import { NamadaExtensionWallet } from "src/extension/main-wallet";
import { namadaExtensionInfo } from "src/extension/registry";
const namadaExtension = new NamadaExtensionWallet(namadaExtensionInfo);
export const wallets = [namadaExtension];
//# sourceMappingURL=namada.js.map