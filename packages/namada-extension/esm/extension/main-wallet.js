var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MainWalletBase } from '@cosmos-kit/core';
import { ChainNamadaExtension } from './chain-wallet';
import { NamadaClient } from './client';
import { getNamadaFromExtension } from './utils';
export class NamadaExtensionWallet extends MainWalletBase {
    constructor(walletInfo) {
        super(walletInfo, ChainNamadaExtension);
    }
    initClient() {
        return __awaiter(this, void 0, void 0, function* () {
            this.initingClient();
            try {
                const namada = yield getNamadaFromExtension();
                console.log('Init client', namada);
                this.initClientDone(namada ? new NamadaClient(namada) : undefined);
            }
            catch (error) {
                this.initClientError(error);
            }
        });
    }
}
//# sourceMappingURL=main-wallet.js.map