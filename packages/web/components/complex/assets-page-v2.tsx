/* eslint-disable import/no-extraneous-dependencies */
import { toBase64 } from "@cosmjs/encoding";
import {
  AccountType,
  IbcTransferMsgValue,
  Message,
  Namada,
  NamadaClient,
  TokenInfo,
  TransferMsgValue,
  TxMsgProps,
  TxMsgValue,
} from "@cosmos-kit/namada-extension";
import BigNumber from "bignumber.js";
import { observer } from "mobx-react-lite";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { AssetsInfoTable } from "~/components/table/asset-info";
import { useNavBar } from "~/hooks";
import { useStore } from "~/stores";

export const AssetsPageV2: FunctionComponent = observer(() => {
  const {
    chainStore: {
      osmosis: { chainId },
    },
    accountStore,
  } = useStore();
  const wallet = accountStore.getWallet(chainId);
  const tokenID = "tnam1qxvg64psvhwumv3mwrrjfcz0h3t3274hwggyzcee";
  const NotificationBar = () => (
    <div className="fixed bottom-5 left-5 z-40 border-x-chartGradientPrimary bg-wosmongton-200 p-4 text-chartGradientPrimary">
      {notificationMessage}

      <button
        onClick={() => setShowNotification(false)}
        className="rounded-md border-2 border-chartGradientPrimary"
      >
        X
      </button>
    </div>
  );

  // set nav bar ctas
  useNavBar({
    ctas: [
      /*{v
        label: t('assets.table.depositButton'),
        onClick: () => {
          startBridge('deposit');
          logEvent([EventName.Assets.depositClicked]);
        },
      },
      {
        label: t('assets.table.withdrawButton'),
        onClick: () => {
          startBridge('withdraw');
          logEvent([EventName.Assets.withdrawClicked]);
        },
      },*/
    ],
  });

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const oldNamdaData = useRef({
    nemonicBalance: "" as string | null,
    shieldedBalance: "" as string | null,
    nemonicAddress: "" as string | null,
    shieldedAddress: "" as string | null,
  });
  const [namdaData, setNamdaData] = useState(oldNamdaData.current);

  const [namadaClient, setNamadaClient] = useState<Namada | null>(null);
  const [osmoAddress, setOsmoAddress] = useState(
    "osmo178nutp2lnwp3qjx055sluz8fxvx3nywurhp6rd"
  );
  const amount = useRef("10");

  useEffect(() => {
    if (!namdaData?.shieldedAddress?.length) {
      console.debug("wallet?.address", wallet?.address, wallet);
      if (wallet?.address?.startsWith("tnam") || wallet?.address) {
        getNamadaData();
      }
    }
  }, []);

  const initNamadaClient = async () => {
    console.debug("Start init client", wallet);
    const namadaClient = (await wallet?.mainWallet.client) as NamadaClient;
    const client: Namada = namadaClient.client;
    setNamadaClient(client);
    console.debug("Namada client initialized", client);
  };

  const getNamadaData = async () => {
    if (!namadaClient?.version) {
      await initNamadaClient();
    }

    console.debug("Getting namada data", wallet?.address);

    const accounts = await namadaClient?.accounts();

    const shieldedAddress = accounts?.find(
      (account: any) => account.type === "shielded-keys"
    )?.address;

    const nemonicAddress = accounts?.find(
      (account: any) => account.type === "mnemonic"
    )?.address;

    const balance = await namadaClient?.balances({
      owner: wallet?.address ?? "",
      tokens: ["tnam1qxvg64psvhwumv3mwrrjfcz0h3t3274hwggyzcee"],
    });

    const balanceShielded = [{ amount: "0" }];

    // const balanceShielded = await namadaClient?.balances({
    //   owner: shieldedAddress ?? "",
    //   tokens: ["tnam1qxvg64psvhwumv3mwrrjfcz0h3t3274hwggyzcee"],
    // });

    console.debug("Setting namada balance", balance, balanceShielded);
    console.debug("Setting namada address", nemonicAddress, shieldedAddress);

    const newNamdaData = {
      nemonicBalance: balance ? balance[0]?.amount : "",
      shieldedBalance: balanceShielded ? balanceShielded[0]?.amount : "",
      nemonicAddress: nemonicAddress || "",
      shieldedAddress: shieldedAddress || "",
    };

    setNamdaData(newNamdaData);
    oldNamdaData.current = newNamdaData;
  };

  const onTransferToShieldedClick = useCallback(async () => {
    await submitTransfer();
  }, []);

  const onDeployToOsmosisClick = useCallback(async () => {
    // wait for client to be ready

    await submitIBC();
  }, []);

  enum TxType {
    Bond = 1,
    Unbond = 2,
    Withdraw = 3,
    Transfer = 4,
    IBCTransfer = 5,
    EthBridgeTransfer = 6,
    RevealPK = 7,
    VoteProposal = 8,
  }

  const submitTransfer = async () => {
    try {
      // await initNamadaClient();
      // await getNamadaData();
      console.debug("Starting transfer", JSON.stringify(oldNamdaData.current));
      if (
        !oldNamdaData.current?.nemonicAddress?.toString().startsWith("tnam")
      ) {
        setNotificationMessage("Wallet is not Namada");
        setShowNotification(true);
        return;
      }

      const chainId = "namada";
      const tranMsgInst = new Message<TransferMsgValue>();
      if (
        !(
          oldNamdaData.current?.nemonicAddress ||
          oldNamdaData.current?.shieldedAddress
        )
      ) {
        console.error("No address found", oldNamdaData.current);
        setNotificationMessage(
          "Namada address not found, please change wallet"
        );
        setShowNotification(true);
        return;
      }

      const messageData = new TransferMsgValue({
        source: oldNamdaData.current?.nemonicAddress || "",
        target: oldNamdaData.current?.shieldedAddress || "",
        amount: new BigNumber(amount.current),
        token: tokenID,
        nativeToken: "NAM",
      });

      const tranEncoded = tranMsgInst.encode(messageData);

      const txMsgValue = new TxMsgValue({
        token: tokenID,
        feeAmount: new BigNumber(0),
        gasLimit: new BigNumber(20_000),
        chainId,
      });

      const txMsg = new Message<TxMsgValue>();
      const txEncoded = txMsg.encode(txMsgValue);

      const props: TxMsgProps = {
        type: AccountType.Mnemonic,
        txType: TxType.Transfer,
        specificMsg: toBase64(tranEncoded),
        txMsg: toBase64(txEncoded),
      };
      console.log("Transfer data", props, txMsgValue, messageData);
      const data = await namadaClient?.submitTx(props);
      console.log("Transfer submitted", data);
      return props;
    } catch (error) {
      console.error("Error while submitting transfer", error);
    }
  };

  const submitIBC = async () => {
    try {
      // await initNamadaClient();
      // await getNamadaData();
      if (!namdaData?.nemonicAddress?.toString().startsWith("tnam")) {
        setNotificationMessage("Wallet is not Namada");
        setShowNotification(true);
        return;
      }
      if (!(namdaData?.nemonicAddress || namdaData?.shieldedAddress)) {
        console.error("No address found", namdaData);
        setNotificationMessage(
          "Namada address not found, please change wallet"
        );
        setShowNotification(true);
        return;
      }

      const osmosisChanel = "channel-5802"; //osmosis test 5802
      const osmosisPortID = "transfer";
      const chainId = "namada";

      const tranMsgInst = new Message<IbcTransferMsgValue>();

      const tokenData: TokenInfo = {
        symbol: "OSMO",
        type: 128,
        path: 0,
        coin: "Osmo",
        url: "https://osmosis.zone/",
        address: "",
        coinGeckoId: "osmosis",
      };

      const messageData = new IbcTransferMsgValue({
        source: namdaData?.nemonicAddress || "",
        receiver: osmoAddress,
        amount: new BigNumber(amount),
        token: tokenData,
        portId: osmosisPortID,
        channelId: osmosisChanel,
      });

      const tranEncoded = tranMsgInst.encode(messageData);

      const txMsgValue = new TxMsgValue({
        token: tokenID,
        feeAmount: new BigNumber(0),
        gasLimit: new BigNumber(20_000),
        chainId: chainId,
      });
      const txMsg = new Message<TxMsgValue>();
      const txEncoded = txMsg.encode(txMsgValue);

      const props: TxMsgProps = {
        type: AccountType.Mnemonic,
        txType: TxType.IBCTransfer,
        specificMsg: toBase64(tranEncoded),
        txMsg: toBase64(txEncoded),
      };

      console.log("IBC Transfer data", props, txMsgValue, messageData);
      const data = await namadaClient?.submitTx(props);
      console.log("IBC Transfer submitted", data);
      return props;
    } catch (error) {
      console.error("Error while submitting transfer", error);
    }
  };

  return (
    <main className="mx-auto flex max-w-container flex-col gap-4 bg-osmoverse-900 p-8 pt-4 md:gap-8 md:p-4">
      <button
        className="flex shrink-0 items-center gap-2 rounded-md border border-wosmongton-100 px-2 py-0 hover:bg-wosmongton-100/30"
        onClick={getNamadaData}
      >
        Refresh namada data
      </button>

      {showNotification && <NotificationBar />}
      {/* <AssetsInfoTable
        tableTopPadding={valuesHeight}
        onDeposit={(coinMinimalDenom) => {
          bridgeAsset(coinMinimalDenom, 'deposit');
        }}
        onWithdraw={(coinMinimalDenom) => {
          bridgeAsset(coinMinimalDenom, 'withdraw');
        }}
      /
      
      > */}
      <h1 className="text-xl">Namada to Osmosis</h1>

      <p className="text-md">
        Wallet type {wallet?.walletInfo?.prettyName}
        {!namdaData.shieldedAddress && (
          <span className="text-md text-chartGradientPrimary">
            {" "}
            !Wallet is not Namada !!
          </span>
        )}
      </p>
      <p className="text-md">
        Namada nemonic address: {namdaData.nemonicAddress}
      </p>
      <p className="text-md">
        Namada nemonic balance: {namdaData?.nemonicBalance}
      </p>
      <p className="text-md">
        Namada shielded address: {namdaData?.shieldedAddress || ""}
      </p>
      <p className="text-md">
        Namada shielded balance: {namdaData?.shieldedBalance || ""}
      </p>
      <div>
        <p>Osmos address</p>
        <input
          type="text"
          value={osmoAddress}
          onChange={(e) => setOsmoAddress(e.target.value)}
          placeholder="Enter address"
          className="border-wosmongton-100 bg-wosmongton-100/30 px-2 py-0"
        />
      </div>
      <div>
        <p>Amount</p>
        <input
          type="number"
          onChange={(e) => (amount.current = e.target.value)}
          placeholder="Enter amount"
          className="border-wosmongton-100 bg-wosmongton-100/30 px-2 py-0"
        />
      </div>
      <button
        className="flex shrink-0 items-center gap-2 rounded-md border border-wosmongton-100 px-2 py-0 hover:bg-wosmongton-100/30"
        onClick={onTransferToShieldedClick}
      >
        {" "}
        Transfer to shielded{" "}
      </button>
      <button
        className="flex shrink-0 items-center gap-2 rounded-md border border-wosmongton-100 px-2 py-0 hover:bg-wosmongton-100/30"
        onClick={onDeployToOsmosisClick}
      >
        {" "}
        Deploy to osmosis{" "}
      </button>
      <div className="pt-8">
        <p className="py-1"> Assets info</p>
        <hr className="py-1"></hr>
        <AssetsInfoTable
          tableTopPadding={10}
          onDeposit={(coinMinimalDenom) => {
            console.log("Deposit", coinMinimalDenom);
          }}
          onWithdraw={(coinMinimalDenom) => {
            console.log("Withdraw", coinMinimalDenom);
          }}
        />
      </div>
    </main>
  );
});
