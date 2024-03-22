/* eslint-disable import/no-extraneous-dependencies */
import { toBase64 } from '@cosmjs/encoding';
import {
  AccountType,
  getNamadaFromExtension,
  IbcTransferMsgValue,
  IbcTransferProps,
  Message,
  Namada,
  TokenInfo,
  TransferMsgValue,
  TxMsgValue,
  TxProps,
  WindowWithNamada,
} from '@cosmos-kit/namada-extension';
import { type AccountStoreWallet } from '@osmosis-labs/stores/src/account/types';
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

/*const OsmoToken: TokenInfo = {
  symbol: 'OSMO',
  type: 128,
  path: 0,
  coin: 'Osmo',
  url: 'https://osmosis.zone/',
  address: '',
  coinGeckoId: 'osmosis',
}; */

const NanToken: TokenInfo = {
  symbol: 'NaaN',
  type: 877,
  path: 0,
  coin: 'NAAN',
  url: 'https://osmosis.zone/',
  address: tokenId,
  coinGeckoId: 'osmosis',
};

export const NamadaIntegration: FunctionComponent = observer(() => {
  const {
    chainStore: {
      osmosis: { chainId },
    },
    accountStore,
  } = useStore();

  const wallet = useRef<AccountStoreWallet>(
    accountStore.getWallet(chainId) as AccountStoreWallet
  );
  const namadaClient = useRef<Namada>();

  const [osmosisAddress, setOsmosisAddress] = useState(
    'osmo178nutp2lnwp3qjx055sluz8fxvx3nywurhp6rd'
  );
  const [amount, setAmount] = useState('10');
  const [channel, setChannel] = useState('channel-995');
  const namadaChainId = 'shielded-expedition.88f17d1d14';

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

  /* useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // if (
      //   typeof event.data?.type === "string" &&
      //   ["namada-proxy-request", "namada-proxy-request-response"].includes(
      //     event.data.type
      //   )
      // ) {
      //   console.log(event.data);
      // }
      if (typeof event.data?.type?.includes('namada')) {
        console.log('Proxy event', event.data);
      }
    };

    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  }, []); */

  useEffect(() => {
    loadNamadaData().then();
    if (chainId && accountStore) {
      wallet.current = accountStore.getWallet(chainId) as AccountStoreWallet;

      // if (wallet.current) {

      // }
    }
  }, [chainId, accountStore, accountStore.walletManager]);

  async function initNamadaClient() {
    console.debug('Init client', wallet.current);
    if (!namadaClient.current) {
      // if (wallet.current. {
      //   displayToast({ message: 'mainWallet is not NAMADA' }, ToastType.ERROR);
      //} else
      try {
        const namFromExt = await getNamadaFromExtension();
        namadaClient.current = namFromExt;
        await namadaClient.current?.connect();
      } catch (e) {
        console.error(e);
        displayToast(
          { message: 'No NAMADA extension, please install it!' },
          ToastType.ERROR
        );
        return false;
      }
      return true;
    } else {
      return true;
    }

    return false;
  }

  async function loadNamadaData() {
    console.debug('Loading namada data', JSON.stringify(namadaClient.current));
    if (!(await initNamadaClient()) || !namadaClient.current) {
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
      console.debug('Loading namada data done');
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
  async function onTransfer(shielded: boolean = false) {
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
      const cli = namadaClient.current as WindowWithNamada['namada'];
      const defaultAccount = await cli.defaultAccount();
      const msg = new TransferMsgValue({
        source: data.address,
        target: shielded ? data.shieldedAddress : osmosisAddress,
        amount: new BigNumber(amount),
        token: tokenId,
        nativeToken: tokenId,
      });
      const encodedMsg = new Message<TransferMsgValue>().encode(msg);

      const tx = new TxMsgValue({
        token: tokenId,
        disposableSigningKey: false, // shielded This needs to be checked could be false or true for shielded
        feeAmount: new BigNumber(0),
        gasLimit: new BigNumber(20_000),
        chainId: namadaChainId,
        publicKey: defaultAccount?.publicKey || '',
      });
      const encodedTx = new Message<TxMsgValue>().encode(tx);

      /* Helper for debugging
      const dataSpecific = fromBase64(
        'LQAAAHRuYW0xcXpjZDRwY2Y3NXllZmZ1N2dzbDVoZGw3cHMzamx1NTl1Z3BuZnE4cVIAAAB6bmFtMXF6eHVtOTBzMzdnenVmN3UwODJsMnp4NDBncGx0OGEyN3BkZnFlcHhxOXJ2N3B4OXI0MGc2ODB2dDI4M2YyZWEyNHk1d3BzZnZqbHk5LQAAAHRuYW0xcXh2ZzY0cHN2aHd1bXYzbXdycmpmY3owaDN0MzI3NGh3Z2d5emNlZQEAAAAyLQAAAHRuYW0xcXh2ZzY0cHN2aHd1bXYzbXdycmpmY3owaDN0MzI3NGh3Z2d5emNlZQ=='
      );

      const datatxMsg = fromBase64(
        'LQAAAHRuYW0xcXh2ZzY0cHN2aHd1bXYzbXdycmpmY3owaDN0MzI3NGh3Z2d5emNlZQYAAAAwLjAwMDEFAAAAMjAwMDAeAAAAc2hpZWxkZWQtZXhwZWRpdGlvbi44OGYxN2QxZDE0AUIAAAB0cGtuYW0xcXFncXBwcjk0cGR5dzhhMDU0N2E2N3h5Z2NsbmVxZzc1Y2RhNjYyYWU1dmc4djlsZ2RncHM4MG1waDYBAAAA'
      );

      const destxMsg = deserialize(datatxMsg, TxMsgValue);
      console.log('The desTx - form namada', destxMsg);

      const destxTx = deserialize(encodedTx, TxMsgValue);
      console.log('The desTx', destxTx);

      const desSpecific = deserialize(dataSpecific, TransferMsgValue);
      console.log('The desSpec - from namada', desSpecific);

      const destxsPEC = deserialize(encodedMsg, TransferMsgValue);
      console.log('The destxSpec', destxsPEC); */

      namadaClient.current.submitTx({
        type: AccountType.Mnemonic,
        txType: TxType.Transfer,
        specificMsg: toBase64(encodedMsg),
        txMsg: toBase64(encodedTx),
      });

      console.debug(
        'Transfer using submitTX',
        'msg',
        msg,
        'tx',
        tx,
        'txType',
        TxType.Transfer,
        'accountType',
        AccountType.Mnemonic
      );
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
      const cli = namadaClient.current as WindowWithNamada['namada'];
      const defaultAccount = await cli.defaultAccount();

      const msg = new IbcTransferMsgValue({
        source: data.address,
        receiver: osmosisAddress,
        amount: new BigNumber(amount),
        token: NanToken,
        portId: 'transfer',
        channelId: channel, //osmosis test 5802
      });
      const encodedMsg = new Message<IbcTransferMsgValue>().encode(msg);

      const tx = new TxMsgValue({
        token: tokenId,
        feeAmount: new BigNumber(0),
        gasLimit: new BigNumber(20_000),
        chainId: namadaChainId,
        publicKey: defaultAccount?.publicKey || '',
      });

      const encodedTx = new Message<TxMsgValue>().encode(tx);

      /* -- Helper for debugging
     const dataSpecific = fromBase64(
        'LQAAAHRuYW0xcXpjZDRwY2Y3NXllZmZ1N2dzbDVoZGw3cHMzamx1NTl1Z3BuZnE4cSsAAABvc21vMTlmM3dxeXY2dDBoM2toendwcjJtNzZtOWx1OTA5NXZmMjZyejQ5LQAAAHRuYW0xcThjdGs3dHIzMzdmODVkdzY5cTByc3JnZ2FzeGpqZjVqcTJzMndwaAEAAAAxCAAAAHRyYW5zZmVyCwAAAGNoYW5uZWwtMTI4AAA='
      );

      const datatxMsg = fromBase64(
        'LQAAAHRuYW0xcXh2ZzY0cHN2aHd1bXYzbXdycmpmY3owaDN0MzI3NGh3Z2d5emNlZQEAAAAwBQAAADIwMDAwHgAAAHNoaWVsZGVkLWV4cGVkaXRpb24uODhmMTdkMWQxNAFCAAAAdHBrbmFtMXFxZ3FwcHI5NHBkeXc4YTA1NDdhNjd4eWdjbG5lcWc3NWNkYTY2MmFlNXZnOHY5bGdkZ3BzODBtcGg2AAAA'
      );
      const destxMsg = deserialize(datatxMsg, TxMsgValue);
      console.log('The desTx - form namada', destxMsg);

      
      const destxTx = deserialize(encodedTx, TxMsgValue);
      console.log('The desTx', destxTx);

      const desSpecific = deserialize(dataSpecific, IbcTransferMsgValue);
      console.log('The desSpec - from namada', desSpecific);
      const destxsPEC = deserialize(encodedMsg, IbcTransferMsgValue);
      console.log('The destxsPEC', destxsPEC); */

      await namadaClient.current.submitTx({
        type: AccountType.Mnemonic,
        txType: TxType.IBCTransfer,
        specificMsg: toBase64(encodedMsg),
        txMsg: toBase64(encodedTx),
      });

      console.debug(
        'Deploy using submitTX',
        'msg',
        msg,
        'tx',
        tx,
        'txType',
        TxType.IBCTransfer,
        'accountType',
        AccountType.Mnemonic
      );
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
        feeAmount: new BigNumber(0),
        gasLimit: new BigNumber(20_000),
        chainId: chain?.chainId || '',
        publicKey: defaultAccount?.publicKey || '',
        signer: undefined,
        disposableSigningKey: shielded,
        memo: '',
      };

      signer.submitTransfer(
        txArgs,
        transferArgs,
        shielded ? 'shielded-keys' : 'mnemonic'
      );
      console.debug(
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

  async function onDeployUsingSigner(shielded: boolean = false) {
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

      const transferArgs: IbcTransferProps = {
        source: data.address,
        receiver: osmosisAddress,
        token: NanToken, // TODO: Update to support other tokens again!
        amount: new BigNumber(amount),
        portId: 'transfer',
        channelId: channel,
      };

      const txArgs: TxProps = {
        token: tokenId, // TODO: Update to support other tokens again!
        feeAmount: new BigNumber(0),
        gasLimit: new BigNumber(20_000),
        chainId: chain?.chainId || '',
        disposableSigningKey: shielded,
        memo: 'TEST',
      };

      signer.submitIbcTransfer(
        transferArgs,
        txArgs,
        shielded ? 'shielded-keys' : 'mnemonic'
      );
      console.debug(
        'IBC submitted using signer props',
        transferArgs,
        txArgs,
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
      <p className="mb-1 text-base">Channel</p>
      <InputBox
        currentValue={channel}
        type="string"
        className="mb-4"
        onInput={(v) => setChannel(v)}
      />

      <div className="flex gap-4">
        <Button onClick={() => onTransfer(true)}>
          Transfer to shielded
          {loading.transfer && <Spinner />}
        </Button>

        <Button onClick={() => onTransfer()}>
          Transfer to Mnemonic
          {loading.deploy && <Spinner />}
        </Button>

        <Button className="invisible" onClick={() => onTransferUsingSigner()}>
          Transfer to Mnemonic
          {loading.deploy && <Spinner />}
        </Button>

        <Button onClick={() => onDeploy()}>
          Deploy to Osmosis
          {loading.deploy && <Spinner />}
        </Button>
        <Button className="invisible" onClick={() => onDeployUsingSigner()}>
          Deploy to Osmosis using signer
          {loading.deploy && <Spinner />}
        </Button>
      </div>
    </div>
  );
});
