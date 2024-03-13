import { SignOptions, WalletClient } from '@cosmos-kit/core';

import { Namada } from './types';

export class NamadaClient implements WalletClient {
  readonly client: Namada;
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


  async getSimpleAccount() {
    const signer = await this.client.getSigner();
    const address = (await signer.defaultAccount())?.address;
    return {
      namespace: 'namada',
      chainId: 'shielded-expedition.88f17d1d14',
      address: address || '',
      username: 'Namada Wallet',
    };
  }





}
