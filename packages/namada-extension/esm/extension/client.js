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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield this.client.getSigner();
            const address = (_a = (yield signer.defaultAccount())) === null || _a === void 0 ? void 0 : _a.address;
            return {
                namespace: 'namada',
                chainId: 'shielded-expedition.88f17d1d14',
                address: address || '',
                username: 'Namada Wallet',
            };
        });
    }
}
//# sourceMappingURL=client.js.map