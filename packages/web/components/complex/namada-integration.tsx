/* eslint-disable import/no-extraneous-dependencies */
import { toBase64 } from '@cosmjs/encoding';
import {
  AccountType,
  IbcTransferMsgValue,
  Message,
  Namada,
  NamadaClient,
  TokenInfo,
  TransferMsgValue,
  TxMsgValue,
  WindowWithNamada,
} from '@cosmos-kit/namada-extension';
import BigNumber from 'bignumber.js';
import { observer } from 'mobx-react-lite';
import { FunctionComponent, useEffect, useRef, useState } from 'react';

import { displayToast, ToastType } from '~/components/alert';
import { InputBox } from '~/components/input';
import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import { useStore } from '~/stores';

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

const tokenId = 'tnam1qxvg64psvhwumv3mwrrjfcz0h3t3274hwggyzcee';

const OsmoToken: TokenInfo = {
  symbol: 'OSMO',
  type: 128,
  path: 0,
  coin: 'Osmo',
  url: 'https://osmosis.zone/',
  address: '',
  coinGeckoId: 'osmosis',
};

export const NamadaIntegration: FunctionComponent = observer(() => {
  const {
    chainStore: {
      osmosis: { chainId },
    },
    accountStore,
  } = useStore();

  const wallet = useRef(accountStore.getWallet(chainId));
  const namadaClient = useRef<Namada>();

  const [osmosisAddress, setOsmosisAddress] = useState(
    'osmo178nutp2lnwp3qjx055sluz8fxvx3nywurhp6rd'
  );
  const [amount, setAmount] = useState('10');

  const [data, setData] = useState({
    address: '',
    shieldedAddress: '',
    balance: '',
    shieldedBalance: '',
  });

  const [loading, setLoading] = useState({
    data: false,
    transfer: false,
    deploy: false,
    transferToNam: false,
  });

  useEffect(() => {
    if (chainId && accountStore) {
      wallet.current = accountStore.getWallet(chainId);

      if (wallet.current) {
        loadNamadaData();
      }
    }
  }, [chainId, accountStore, accountStore.walletManager]);

  function initNamadaClient() {
    if (!namadaClient.current) {
      if (wallet.current?.mainWallet?.walletName !== 'namada-extension') {
        displayToast({ message: 'mainWallet is not NAMADA' }, ToastType.ERROR);
      } else if (wallet.current.mainWallet) {
        namadaClient.current = (
          wallet.current.mainWallet.client as NamadaClient
        ).client;
        return true;
      } else {
        displayToast({ message: 'No mainWallet' }, ToastType.ERROR);
      }
    } else {
      return true;
    }

    return false;
  }

  async function loadNamadaData() {
    if (!initNamadaClient() || !namadaClient.current) {
      displayToast({ message: 'No NAMADA client' }, ToastType.ERROR);
      return;
    }

    setLoading((l) => ({ ...l, data: true }));

    try {
      const accounts = await namadaClient.current.accounts();

      const address =
        accounts?.find((a) => a.type === 'mnemonic')?.address || '';
      const shieldedAddress =
        accounts?.find((a) => a.type === 'shielded-keys')?.address || '';

      loadNamadaBalance(address, 'balance');
      loadNamadaBalance(shieldedAddress, 'shieldedBalance');

      setData((data) => ({
        ...data,
        address,
        shieldedAddress,
      }));
    } catch (e) {
      console.error(e);
    }

    setLoading((l) => ({ ...l, data: false }));
  }

  async function loadNamadaBalance(
    owner: string,
    state: 'balance' | 'shieldedBalance'
  ) {
    if (!namadaClient.current) {
      displayToast({ message: 'No NAMADA client' }, ToastType.ERROR);
      return;
    }

    let balance = '0';

    const balances = await namadaClient.current.balances({
      owner,
      tokens: [tokenId],
    });

    if (balances?.length) {
      balance = balances[0].amount;
    }

    setData((data) => ({ ...data, [state]: balance }));
  }

  /**
   * Transfer `amount` from mnemonic to shielded account
   */
  async function onTransfer() {
    if (!namadaClient.current) {
      displayToast({ message: 'No NAMADA client' }, ToastType.ERROR);
      return;
    }

    if (!data.address.startsWith('tnam')) {
      displayToast({ message: 'Wallet is not NAMADA' }, ToastType.ERROR);
      return;
    }

    if (!data.address || !data.shieldedAddress) {
      displayToast(
        { message: 'NAMADA address not found, please change wallet' },
        ToastType.ERROR
      );
      return;
    }

    setLoading((l) => ({ ...l, transfer: false }));

    try {
      const encodedMsg = new Message<TransferMsgValue>().encode(
        new TransferMsgValue({
          source: data.address,
          target: data.shieldedAddress,
          amount: new BigNumber(amount),
          token: tokenId,
          nativeToken: 'NAM',
        })
      );

      const encodedTx = new Message<TxMsgValue>().encode(
        new TxMsgValue({
          token: tokenId,
          feeAmount: new BigNumber(0),
          gasLimit: new BigNumber(20_000),
          chainId,
        })
      );

      const res = await namadaClient.current.submitTx({
        type: AccountType.Mnemonic,
        txType: TxType.Transfer,
        specificMsg: toBase64(encodedMsg),
        txMsg: toBase64(encodedTx),
      });

      console.log(res);
    } catch (e) {
      console.error(e);
    }

    setLoading((l) => ({ ...l, transfer: false }));
  }

  /**
   * Deploy amount to osmosis
   */
  async function onDeploy() {
    if (!namadaClient.current) {
      displayToast({ message: 'No NAMADA client' }, ToastType.ERROR);
      return;
    }

    if (!data.address.startsWith('tnam')) {
      displayToast({ message: 'Wallet is not NAMADA' }, ToastType.ERROR);
      return;
    }

    if (!data.address || !data.shieldedAddress) {
      displayToast(
        { message: 'NAMADA address not found, please change wallet' },
        ToastType.ERROR
      );
      return;
    }

    setLoading((l) => ({ ...l, deploy: false }));

    try {
      const encodedMsg = new Message<IbcTransferMsgValue>().encode(
        new IbcTransferMsgValue({
          source: data.address,
          receiver: osmosisAddress,
          amount: new BigNumber(amount),
          token: OsmoToken,
          portId: 'transfer',
          channelId: 'channel-5802', //osmosis test 5802
        })
      );

      const encodedTx = new Message<TxMsgValue>().encode(
        new TxMsgValue({
          token: tokenId,
          feeAmount: new BigNumber(0),
          gasLimit: new BigNumber(20_000),
          chainId,
        })
      );

      const res = await namadaClient.current.submitTx({
        type: AccountType.Mnemonic,
        txType: TxType.IBCTransfer,
        specificMsg: toBase64(encodedMsg),
        txMsg: toBase64(encodedTx),
      });

      console.log(res);
    } catch (e) {
      console.error(e);
    }

    setLoading((l) => ({ ...l, deploy: false }));
  }

  /**
   * Transfer amount to osmosis type 2
   */
  async function onTransferUsingSigner(shielded: boolean = false) {
    if (!namadaClient.current) {
      displayToast({ message: 'No NAMADA client' }, ToastType.ERROR);
      return;
    }

    if (!data.address.startsWith('tnam')) {
      displayToast({ message: 'Wallet is not NAMADA' }, ToastType.ERROR);
      return;
    }

    if (!data.address || !data.shieldedAddress) {
      displayToast(
        { message: 'NAMADA address not found, please change wallet' },
        ToastType.ERROR
      );
      return;
    }

    setLoading((l) => ({ ...l, transferToNam: false }));

    try {
      const cli = namadaClient.current as WindowWithNamada['namada'];
      const signer = cli.getSigner();
      const chain = await cli.getChain();
      const defaultAccount = await cli.defaultAccount();

      const transferArgs = {
        source: data.address,
        target: osmosisAddress,
        token: tokenId, // TODO: Update to support other tokens again!
        amount: new BigNumber(amount),
        nativeToken: tokenId,
      };

      const txArgs = {
        token: tokenId, // TODO: Update to support other tokens again!
        nativeToken: tokenId,
        feeAmount: new BigNumber(20_000),
        gasLimit: new BigNumber(20_000),
        chainId: chain?.chainId || '',
        publicKey: defaultAccount?.publicKey || '',
        signer: undefined,
        disposableSigningKey: shielded,
        memo: '',
      };

      signer.submitTransfer(
        transferArgs,
        txArgs,
        shielded ? 'shielded-keys' : 'mnemonic'
      );
      console.log(
        'Transfer submitted using props',
        txArgs,
        transferArgs,
        shielded ? 'shielded-keys' : 'mnemonic'
      );
    } catch (e) {
      console.error(e);
    }

    setLoading((l) => ({ ...l, transferToNam: false }));
  }

  return (
    <div className="rounded-3xl bg-osmoverse-800 p-4">
      <h2 className="text-xl">Namada to Osmosis</h2>

      <Button variant="outline" size="sm" onClick={() => loadNamadaData()}>
        Refresh
        {loading.data && <Spinner />}
      </Button>

      <code className="mb-6 mt-2 block break-all">{JSON.stringify(data)}</code>

      <p className="mb-1 text-base">Osmosis or Namada address</p>
      <InputBox
        currentValue={osmosisAddress}
        className="mb-4"
        onInput={(v) => setOsmosisAddress(v)}
      />

      <p className="mb-1 text-base">Transfer amount</p>
      <InputBox
        currentValue={amount}
        type="number"
        className="mb-4"
        onInput={(v) => setAmount(v)}
      />

      <div className="flex gap-4">
        <Button onClick={() => onTransfer()}>
          Transfer to shielded
          {loading.transfer && <Spinner />}
        </Button>

        <Button onClick={() => onTransferUsingSigner()}>
          Transfer to Mnemonic
          {loading.deploy && <Spinner />}
        </Button>

        <Button onClick={() => onDeploy()}>
          Deploy to Osmosis
          {loading.deploy && <Spinner />}
        </Button>
      </div>
    </div>
  );
});
