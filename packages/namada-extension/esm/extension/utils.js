var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ClientNotExistError } from '@cosmos-kit/core';
export const getNamadaFromExtension = () => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof window === 'undefined') {
        return void 0;
    }
    const namadaInst = window.namada;
    if (namadaInst) {
        return namadaInst;
    }
    if (document.readyState === 'complete') {
        if (namadaInst) {
            return namadaInst;
        }
        else {
            throw ClientNotExistError;
        }
    }
    return new Promise((resolve, reject) => {
        const documentStateChange = (event) => {
            if (event.target &&
                event.target.readyState === 'complete') {
                if (namadaInst) {
                    resolve(namadaInst);
                }
                else {
                    reject(ClientNotExistError.message);
                }
                document.removeEventListener('readystatechange', documentStateChange);
            }
        };
        document.addEventListener('readystatechange', documentStateChange);
    });
});
//# sourceMappingURL=utils.js.map