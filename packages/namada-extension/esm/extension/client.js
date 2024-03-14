var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class NamadaClient {
    constructor(client) {
        this._defaultSignOptions = {
            preferNoSetFee: false,
            preferNoSetMemo: true,
            disableBalanceCheck: true,
        };
        this.client = client;
    }
    get defaultSignOptions() {
        return this._defaultSignOptions;
    }
    setDefaultSignOptions(options) {
        this._defaultSignOptions = options;
    }
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.connect();
        });
    }
    getSimpleAccount() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const chain = yield this.client.getChain();
            if (!chain) {
                yield this.client.connect();
            }
            //const accountType = 'shielded-keys';
            const accountType = 'mnemonic';
            const address = (_b = (_a = (yield this.client.accounts())) === null || _a === void 0 ? void 0 : _a.find((account) => account.type === accountType)) === null || _b === void 0 ? void 0 : _b.address;
            const returnData = {
                namespace: 'namada',
                chainId: (chain === null || chain === void 0 ? void 0 : chain.chainId) || '',
                address: address || '',
                username: 'Namada Wallet',
            };
            (_c = this.logger) === null || _c === void 0 ? void 0 : _c.info('Namada wallet returnData', returnData);
            return {
                namespace: 'namada',
                chainId: (chain === null || chain === void 0 ? void 0 : chain.chainId) || '',
                address: address || '',
                username: 'Namada Wallet',
            };
        });
    }
}
//# sourceMappingURL=client.js.map