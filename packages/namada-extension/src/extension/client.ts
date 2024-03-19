import { BroadcastMode, DirectSignDoc, Logger, SignOptions, WalletClient } from '@cosmos-kit/core';

import { BalancesProps, Namada, SignArbitraryProps, TxMsgProps } from './types';
import { AccountType } from './namada-types';
import { toBase64, fromBase64 } from '@cosmjs/encoding';
import { DirectSignResponse } from '@cosmjs/proto-signing';
import { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";



export class NamadaClient implements WalletClient {
  readonly client: Namada;
  logger?: Logger;
  private _defaultSignOptions: SignOptions = {
    preferNoSetFee: false,
    preferNoSetMemo: true,
    disableBalanceCheck: true,
  };


  get defaultSignOptions() {
    return this._defaultSignOptions;
  }

  setDefaultSignOptions(options: SignOptions) {
    this._defaultSignOptions = options;
  }

  constructor(client: Namada) {
    this.client = client;
  }

  async enable() {
    await this.client.connect();
  }



  async getBalances(props: BalancesProps) {
    const account = await this.getSimpleAccount();
    if (!account) {
      return [];
    }
    return await this.client.balances(props);
  }


  async getSimpleAccount() {

    const chain = await this.client.getChain();
    if (!chain) {
      await this.client.connect();
    }

    //const accountType = 'shielded-keys';
    const accountType = 'mnemonic';
    const address = (await this.client.accounts())?.find((account) => account.type === accountType)?.address;

    const returnData = {
      namespace: 'namada',
      chainId: chain?.chainId || '',
      address: address || '',
      username: 'Namada Wallet',
    };
    this.logger?.info('Namada wallet returnData', returnData);

    return {
      namespace: 'namada',
      chainId: chain?.chainId || '',
      address: address || '',
      username: 'Namada Wallet',
    };
  }

  async signDirect(
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc,
  ) {

    const signProps: SignArbitraryProps = {
      signer,
      data: toBase64(signDoc?.bodyBytes || new Uint8Array())
    };

    const sigature = await this.client?.sign(signProps);
    const signerNew = await (this.client.getSigner());
    const pubKey = (await signerNew.accounts(chainId))?.find((account) => account.address === signer)?.publicKey || '';

    const response: DirectSignResponse = {
      signed: signDoc as SignDoc,
      signature: {
        signature: sigature?.signature || '',
        pubkey: fromBase64(pubKey) || new Uint8Array(),
      } as any

    }
    return response;
  }

  async sendTx(chainId: string, tx: Uint8Array, mode: BroadcastMode) {

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


    const props: TxMsgProps = {
      type: AccountType.Mnemonic,
      txType: TxType.Transfer,
      specificMsg: toBase64(tx),
      txMsg: toBase64(tx),
    };

    await this.client.submitTx(props);
    return tx;
  }


}
