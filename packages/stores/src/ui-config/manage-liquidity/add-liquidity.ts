import { observable, makeObservable, computed, action } from "mobx";
import {
  ObservableQueryBalances,
  ChainGetter,
  IQueriesStore,
} from "@keplr-wallet/stores";
import {
  IntPretty,
  CoinPretty,
  Dec,
  DecUtils,
  Int,
  RatePretty,
} from "@keplr-wallet/unit";
import { Currency } from "@keplr-wallet/types";
import { AmountConfig } from "@keplr-wallet/hooks";
import {
  ObservableQueryPools,
  ObservableQueryGammPoolShare,
} from "../../queries";
import { ManageLiquidityConfigBase } from "./base";
import { OSMO_MEDIUM_TX_FEE } from ".";

/** Use to config user input UI for eventually sending a valid add liquidity msg.
 *  Supports specifying a single asset LP amount, or evenly adding liquidity from an aribtrary number of pool assets.
 */
export class ObservableAddLiquidityConfig extends ManageLiquidityConfigBase {
  @observable.ref
  protected _queryBalances: ObservableQueryBalances;

  @observable.ref
  protected _queryPools: ObservableQueryPools;

  @observable.ref
  protected _shareOutAmount: IntPretty | undefined = undefined;

  @observable
  protected _isSingleAmountIn: boolean = false;

  /*
	 Used to get the amount config if the mode is single amount in.
	 */
  @observable
  protected _singleAmountInConfigIndex: number = 0;

  protected _cacheAmountConfigs?: {
    poolId: string;
    sender: string;
    configs: AmountConfig[];
  };

  constructor(
    chainGetter: ChainGetter,
    initialChainId: string,
    poolId: string,
    sender: string,
    queriesStore: IQueriesStore,
    queryPoolShare: ObservableQueryGammPoolShare,
    queryPools: ObservableQueryPools,
    queryBalances: ObservableQueryBalances
  ) {
    super(
      chainGetter,
      initialChainId,
      poolId,
      sender,
      queriesStore,
      queryPoolShare
    );

    this._queriesStore = queriesStore;
    this._queryPools = queryPools;
    this._queryBalances = queryBalances;
    this._sender = sender;

    makeObservable(this);
  }

  get isSingleAmountIn(): boolean {
    return this._isSingleAmountIn;
  }

  @computed
  get singleAmountInAsset():
    | {
        weight: IntPretty;
        weightFraction: RatePretty;
        amount: CoinPretty;
        currency: Currency;
      }
    | undefined {
    return this.poolAssets.find(
      (asset) =>
        this.isSingleAmountIn &&
        asset.currency.coinDenom ===
          this.singleAmountInConfig?.sendCurrency.coinDenom
    );
  }

  /*
	 Return the `AmountConfig` of selected single amount in.
	 Return undefined if the mode is no single amount in
	 or `this._singleAmountInConfigIndex` is out of range in poolAssetConfigs.
	 */
  @computed
  get singleAmountInConfig(): AmountConfig | undefined {
    if (!this.isSingleAmountIn) {
      return;
    }

    if (this.poolAssetConfigs.length === 0) {
      return;
    }

    if (this.poolAssetConfigs.length <= this._singleAmountInConfigIndex) {
      return;
    }

    return this.poolAssetConfigs[this._singleAmountInConfigIndex];
  }

  @action
  setIsSingleAmountIn(value: boolean) {
    this._isSingleAmountIn = value;
  }

  @action
  setSingleAmountInConfigIndex(index: number) {
    this._singleAmountInConfigIndex = index;
  }

  @action
  setSingleAmountInConfig(coinDenom: string) {
    const poolAssetIndex = this.poolAssetConfigs.findIndex(
      (assetConfig) => assetConfig.sendCurrency.coinDenom === coinDenom
    );

    if (poolAssetIndex !== -1) {
      this.setSingleAmountInConfigIndex(poolAssetIndex);
    }
  }

  @computed
  get singleAmountInPriceImpact(): RatePretty | undefined {
    if (!this.isSingleAmountIn) {
      return;
    }

    try {
      const config = this.singleAmountInConfig;
      if (!config || config.amount === "") {
        return;
      }

      const poolAsset = this.poolAssets.find(
        (asset) =>
          asset.currency.coinMinimalDenom ===
          config.sendCurrency.coinMinimalDenom
      );
      if (!poolAsset) {
        return;
      }

      /*
       The spot price is ( Bi / Wi ) / (Bo / Wo).
       And "single amount in" only changes the Bi or Bo.
       Others can be handles as constant.
       So, we can calculate the price impact by just consider the added amount of one asset.
       */
      return new RatePretty(
        new Dec(1).sub(
          poolAsset.amount
            .toDec()
            .quo(
              poolAsset.amount
                .toDec()
                .add(
                  new CoinPretty(
                    config.sendCurrency,
                    new Dec(config.amount).mul(
                      DecUtils.getTenExponentNInPrecisionRange(
                        config.sendCurrency.coinDecimals
                      )
                    )
                  ).toDec()
                )
            )
        )
      );
    } catch (e) {
      console.error(e);
    }
  }

  get singleAmountInBalance(): CoinPretty | undefined {
    if (!this.singleAmountInAsset) return;

    return this._queryBalances
      .getQueryBech32Address(this._sender)
      .getBalanceFromCurrency(this.singleAmountInAsset.currency);
  }

  @computed
  get poolAssetConfigs(): AmountConfig[] {
    const pool = this._queryPools.getPool(this._poolId);
    if (!pool) {
      return [];
    }

    if (
      !this._cacheAmountConfigs ||
      this._cacheAmountConfigs.poolId !== pool.id ||
      this._cacheAmountConfigs.sender !== this.sender ||
      this._cacheAmountConfigs.configs.length === 0
    ) {
      this._cacheAmountConfigs = {
        poolId: pool.id,
        sender: this.sender,
        configs: pool.poolAssets.map((asset) => {
          const config = new AmountConfig(
            this.chainGetter,
            this._queriesStore,
            this.chainId,
            this.sender,
            undefined
          );
          config.setSendCurrency(asset.amount.currency);
          return config;
        }),
      };
    }

    return this._cacheAmountConfigs.configs;
  }

  @computed
  get poolAssets(): {
    weight: IntPretty;
    weightFraction: RatePretty;
    amount: CoinPretty;
    currency: Currency;
  }[] {
    const pool = this._queryPools.getPool(this._poolId);
    if (!pool) {
      return [];
    }
    return pool.poolAssets.map((asset) => {
      return {
        ...asset,
        currency: asset.amount.currency,
      };
    });
  }

  @computed
  get totalWeight(): IntPretty {
    let result = new IntPretty(new Int(0));
    for (const asset of this.poolAssets) {
      result = result.add(asset.weight);
    }
    return result;
  }

  @computed
  get totalShare(): IntPretty {
    const pool = this._queryPools.getPool(this._poolId);
    if (!pool) {
      return new IntPretty(new Int(0));
    }

    return new IntPretty(pool.totalShare);
  }

  get shareOutAmount(): IntPretty | undefined {
    return this._shareOutAmount;
  }

  @action
  setAmountAt(index: number, amount: string, isMax = false): void {
    const amountConfig = this.poolAssetConfigs[index];
    amountConfig.setAmount(amount);

    if (amountConfig.error === undefined) {
      /*
        share out amount = (token in amount * total share) / pool asset
       */
      const tokenInAmount = new IntPretty(new Dec(amountConfig.amount));
      const totalShare = this.totalShare;
      const poolAsset = this.poolAssets.find(
        (asset) =>
          asset.currency.coinMinimalDenom ===
          amountConfig.sendCurrency.coinMinimalDenom
      );

      if (tokenInAmount.toDec().equals(new Dec(0))) {
        this._shareOutAmount = undefined;
        return;
      }

      if (totalShare.toDec().equals(new Dec(0))) {
        this._shareOutAmount = undefined;
        return;
      }

      if (!poolAsset) {
        this._shareOutAmount = undefined;
        return;
      }

      // totalShare / poolAsset.amount = totalShare per poolAssetAmount = total share per tokenInAmount
      // tokenInAmount * (total share per tokenInAmount) = totalShare of given tokenInAmount aka shareOutAmount;
      // tokenInAmount in terms of totalShare unit

      // shareOutAmount / totalShare = totalShare proportion of tokenInAmount;
      // totalShare proportion of tokenInAmount * otherTotalPoolAssetAmount = otherPoolAssetAmount

      const shareOutAmount = tokenInAmount
        .mul(totalShare)
        .quo(poolAsset.amount);
      const otherConfigs = this.poolAssetConfigs.slice();
      otherConfigs.splice(index, 1);

      for (const otherConfig of otherConfigs) {
        const poolAsset = this.poolAssets.find(
          (asset) =>
            asset.currency.coinMinimalDenom ===
            otherConfig.sendCurrency.coinMinimalDenom
        );

        if (!poolAsset) {
          this._shareOutAmount = undefined;
          return;
        }

        otherConfig.setAmount(
          shareOutAmount
            .mul(poolAsset.amount)
            .quo(totalShare)
            .trim(true)
            .shrink(true)
            .maxDecimals(isMax ? 6 : 2)
            .locale(false)
            .toString()
        );
      }

      this._shareOutAmount = shareOutAmount;
    } else {
      this._shareOutAmount = undefined;
    }
  }

  getAmountAt(index: number): string {
    return this.poolAssetConfigs[index].amount;
  }

  getSenderBalanceAt(index: number): CoinPretty {
    return this._queryBalances
      .getQueryBech32Address(this._sender)
      .getBalanceFromCurrency(this.poolAssetConfigs[index].sendCurrency);
  }

  @action
  setMax() {
    if (this.isSingleAmountIn && this.singleAmountInConfig) {
      const config = this.singleAmountInConfig;
      config.setIsMax(true);
      this.setAmountAt(this._singleAmountInConfigIndex, config.amount);
      config.setIsMax(false);
      return;
    }

    const balancePrettyList = this.poolAssetConfigs.map((poolAssetConfig) =>
      this._queryBalances
        .getQueryBech32Address(this.sender)
        .getBalanceFromCurrency(poolAssetConfig.sendCurrency)
    );
    if (
      balancePrettyList.some((balancePretty) =>
        balancePretty.toDec().equals(new Dec(0))
      )
    ) {
      return this.poolAssetConfigs.forEach((poolAssetConfig) =>
        poolAssetConfig.setAmount("0")
      );
    }
    let feasibleMaxFound = false;
    const totalShare = this.totalShare;
    balancePrettyList.forEach((balancePretty) => {
      if (feasibleMaxFound) {
        return;
      }
      const baseBalanceInt = new IntPretty(balancePretty);
      const basePoolAsset = this.poolAssets.find(
        (poolAsset) =>
          poolAsset.currency.coinMinimalDenom ===
          balancePretty.currency.coinMinimalDenom
      );
      if (!basePoolAsset) return;
      const baseShareOutAmount = baseBalanceInt
        .mul(totalShare)
        .quo(basePoolAsset.amount);
      const outAmountInfoList = this.poolAssets.map((poolAsset) => {
        const coinMinimalDenom = poolAsset.currency.coinMinimalDenom;
        if (basePoolAsset.currency.coinMinimalDenom === coinMinimalDenom) {
          return {
            coinMinimalDenom,
            outAmount: baseBalanceInt,
          };
        }
        return {
          coinMinimalDenom,
          outAmount: baseShareOutAmount.mul(poolAsset.amount).quo(totalShare),
        };
      });
      const hasInsufficientBalance = outAmountInfoList.some((outAmountInfo) => {
        const balanceInfo = balancePrettyList.find(
          (balance) =>
            balance.currency.coinMinimalDenom === outAmountInfo.coinMinimalDenom
        );
        if (!balanceInfo) return false;
        return balanceInfo.toDec().lt(outAmountInfo.outAmount.toDec());
      });
      if (hasInsufficientBalance) {
        return;
      }
      feasibleMaxFound = true;

      const osmoIndex = this.poolAssetConfigs.findIndex((poolAssetConfig) => {
        return poolAssetConfig.sendCurrency.coinMinimalDenom === "uosmo";
      });

      if (osmoIndex !== -1) {
        const osmoOutAmountInfo = outAmountInfoList.find(
          (outAmountInfo) => outAmountInfo.coinMinimalDenom === "uosmo"
        );
        if (!osmoOutAmountInfo) return;
        const osmoBalanceInfo = balancePrettyList.find(
          (balance) => balance.currency.coinMinimalDenom === "uosmo"
        );
        if (!osmoBalanceInfo) return;
        const osmoOutAmount = osmoBalanceInfo
          .toDec()
          .sub(new Dec(OSMO_MEDIUM_TX_FEE))
          .lt(osmoOutAmountInfo.outAmount.toDec())
          ? osmoOutAmountInfo.outAmount.sub(new Dec(OSMO_MEDIUM_TX_FEE))
          : osmoOutAmountInfo.outAmount;

        return this.setAmountAt(
          osmoIndex,
          osmoOutAmount
            .trim(true)
            .shrink(true)
            /** osmo is used to pay tx fees, should have some padding left for future tx? if no padding needed maxDecimals to 6 else 2*/
            .maxDecimals(6)
            .locale(false)
            .toString(),
          true
        );
      }

      /**TODO: should use cheaper coin to setAmount for higher accuracy*/
      const baseOutAmountInfo = outAmountInfoList.find((outAmountInfo) => {
        return (
          outAmountInfo.coinMinimalDenom ===
          this.poolAssetConfigs[0].sendCurrency.coinMinimalDenom
        );
      });
      if (!baseOutAmountInfo) return;

      this.setAmountAt(
        0,
        baseOutAmountInfo?.outAmount
          .trim(true)
          .shrink(true)
          .maxDecimals(6)
          .locale(false)
          .toString(),
        true
      );
    });
  }

  @computed
  get error() {
    if (this.poolAssetConfigs.length === 0) {
      return new Error("Not initialized yet");
    }

    if (this.isSingleAmountIn && this.singleAmountInConfig) {
      const config = this.singleAmountInConfig;
      const error = config.error;
      if (error != null) {
        return error;
      }

      return;
    } else {
      for (const config of this.poolAssetConfigs) {
        const error = config.error;
        if (error != null) {
          return error;
        }
      }
    }

    if (!this.shareOutAmount || this.shareOutAmount.toDec().lte(new Dec(0))) {
      return new Error("Calculating the share out amount");
    }
  }
}
