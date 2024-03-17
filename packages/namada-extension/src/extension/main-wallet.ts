import { Wallet } from '@cosmos-kit/core';
import { MainWalletBase } from '@cosmos-kit/core';

import { ChainNamadaExtension } from './chain-wallet';
import { NamadaClient } from './client';
import { getNamadaFromExtension } from './utils';
import { BalancesProps, Namada } from 'src/extension/types';

export class NamadaExtensionWallet extends MainWalletBase {
  constructor(walletInfo: Wallet) {
    super(walletInfo, ChainNamadaExtension);
  }

  private namadaInstance?: Namada;

  public async getBalances(props: BalancesProps) {
    return await this.namadaInstance?.balances(props);
  }

  async initClient() {

    this.initingClient();
    try {
      const namada = await getNamadaFromExtension();
      this.namadaInstance = namada;
      this.initClientDone(namada ? new NamadaClient(namada) : undefined);
    } catch (error: any) {
      this.initClientError(error);
    }
  }
}
