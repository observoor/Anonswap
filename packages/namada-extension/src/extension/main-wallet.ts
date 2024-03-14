import { Wallet } from '@cosmos-kit/core';
import { MainWalletBase } from '@cosmos-kit/core';

import { ChainNamadaExtension } from './chain-wallet';
import { NamadaClient } from './client';
import { getNamadaFromExtension } from './utils';

export class NamadaExtensionWallet extends MainWalletBase {
  constructor(walletInfo: Wallet) {
    super(walletInfo, ChainNamadaExtension);
  }

  async initClient() {

    this.initingClient();
    try {
      const namada = await getNamadaFromExtension();
      this.initClientDone(namada ? new NamadaClient(namada) : undefined);
    } catch (error: any) {
      this.initClientError(error);
    }
  }
}
