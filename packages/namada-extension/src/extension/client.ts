import { Logger, SignOptions, WalletClient } from '@cosmos-kit/core';

import { Namada } from './types';

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
}
