import { NamadaExtensionWallet } from "./extension/main-wallet";
import { namadaExtensionInfo } from "./extension/registry";


const namadaExtension = new NamadaExtensionWallet(namadaExtensionInfo);

export const wallets = [namadaExtension];
