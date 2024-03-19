/* eslint-disable import/no-extraneous-dependencies */
import { toBase64 } from '@cosmjs/encoding';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  AccountType,
  Message,
  Namada,
  NamadaClient,
  TransferMsgValue,
  TxMsgProps,
  TxMsgValue,
} from '@cosmos-kit/namada-extension';
import BigNumber from 'bignumber.js';
import { observer } from 'mobx-react-lite';
import { FunctionComponent, useCallback, useEffect, useState } from 'react';

import { useNavBar } from '~/hooks';
import { useStore } from '~/stores';

export const AssetsPageV2: FunctionComponent = observer(() => {
  const { accountStore, chainStore } = useStore();
  const wallet = accountStore.getWallet(chainStore.osmosis.chainId);
  const isNamada = wallet?.walletInfo?.prettyName?.toLowerCase() === 'namada';

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
  const [namdaData, setNamdaData] = useState({
    nemonicBalance: '' as string | null,
    shieldedBalance: '' as string | null,
    nemonicAddress: '' as string | null,
    shieldedAddress: '' as string | null,
  });

  const [namadaClient, setNamadaClient] = useState<Namada | null>(null);

  useEffect(() => {
    getNamadaData();
  });

  const getNamadaData = async () => {
    if (isNamada && wallet?.address) {
      const getNamadaData = async () => {
        const namadaClient = (await wallet?.mainWallet.client) as NamadaClient;
        const client: Namada = namadaClient.client;

        setNamadaClient(client);

        const accountType = 'shielded-keys';
        const shieldedAddress = (await client.accounts())?.find(
          (account: any) => account.type === accountType
        )?.address;

        const balance = await client?.balances({
          owner: wallet?.address ?? '',
          tokens: ['tnam1qxvg64psvhwumv3mwrrjfcz0h3t3274hwggyzcee'],
        });

        const balanceShielded = await client?.balances({
          owner: shieldedAddress ?? '',
          tokens: ['tnam1qxvg64psvhwumv3mwrrjfcz0h3t3274hwggyzcee'],
        });
        console.log('Namada balance', balance, balanceShielded);
        setNamdaData({
          nemonicBalance: balance ? balance[0]?.amount : '',
          shieldedBalance: balanceShielded ? balanceShielded[0]?.amount : '',
          nemonicAddress: wallet?.address || '',
          shieldedAddress: shieldedAddress || '',
        });
      };
      getNamadaData();
    }
  };

  const onTransferToShieldedClick = useCallback(async () => {
    const namadaClient = (await wallet?.mainWallet.client) as NamadaClient;
    const client: Namada = namadaClient.client;
    if (!client) {
      throw new Error('Namada client not found');
    }
    await submitTransfer();

    // const tx_data = {
    //   type: 'MsgSend',

    // const signer = new Signer(tx_data );
    // namadaClient.submitTx({
  }, []);

  const onDeployToOsmosisClick = useCallback(async () => {
    const namadaClient = (await wallet?.mainWallet.client) as NamadaClient;
    const client: Namada = namadaClient.client;
    if (!client) {
      throw new Error('Namada client not found');
    }
    await submitTransfer();

    // const tx_data = {
    //   type: 'MsgSend',

    // const signer = new Signer(tx_data );
    // namadaClient.submitTx({
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
      /* const signProps: SignArbitraryProps = {
        signer: namdaData?.nemonicAddress || '',
        data: 'Transfer',
      }; */

      // await namadaClient?.sign(signProps);

      const msgInst = new Message<TransferMsgValue>();
      const messageData = new TransferMsgValue({
        source: namdaData?.nemonicAddress || '',
        target: namdaData?.shieldedAddress || '',
        amount: new BigNumber(10),
        token: 'NAM',
        nativeToken: 'NAM',
      });

      const encoded = msgInst.encode(messageData);
      const txMsgValue = new TxMsgValue({
        token: 'NAM',
        feeAmount: new BigNumber(10),
        gasLimit: new BigNumber(20_000),
        chainId: 'namada',
      });
      const txMsg = new Message<TxMsgValue>();
      const txEncoded = txMsg.encode(txMsgValue);

      const props: TxMsgProps = {
        type: AccountType.Mnemonic,
        txType: TxType.Transfer,
        specificMsg: toBase64(encoded),
        txMsg: toBase64(txEncoded),
      };
      const data = await namadaClient?.submitTx(props);
      console.log('Transfer submitted', data);
    } catch (error) {
      console.error('Error while submitting transfer', error);
    }
  };

  return (
    <main className="mx-auto flex max-w-container flex-col gap-20 bg-osmoverse-900 p-8 pt-4 md:gap-8 md:p-4">
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

      <p className="text-h5 font-h5">
        Namada memonic balance: {namdaData?.nemonicBalance}
      </p>

      <p className="text-h5 font-h5">
        Namada shielded balance:{namdaData?.shieldedBalance || ''}
      </p>

      <button
        className="flex shrink-0 items-center gap-2 rounded-md border border-wosmongton-100 px-2 py-1 hover:bg-wosmongton-100/30"
        onClick={onTransferToShieldedClick}
      >
        {' '}
        Transfer to shielded{' '}
      </button>

      <button
        className="flex shrink-0 items-center gap-2 rounded-md border border-wosmongton-100 px-2 py-1 hover:bg-wosmongton-100/30"
        onClick={onDeployToOsmosisClick}
      >
        {' '}
        Deploy to osmosis{' '}
      </button>
    </main>
  );
});
