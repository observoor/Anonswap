import { AccountType, DerivedAccount } from "../extension/namada-types/account";
import { Chain } from "../extension/namada-types/chain";
import { SignatureResponse, Signer } from "../extension/namada-types/signer";

export interface Key {
  readonly name: string;
  readonly algo: string;
  readonly pubKey: Uint8Array;
  readonly address: Uint8Array;
  readonly bech32Address: string;
  readonly isNanoLedger: boolean;
}
export type TxMsgProps = {
  //TODO: figure out if we can make it better
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  txType: any;
  specificMsg: string;
  txMsg: string;
  type: AccountType;
};

export type SignArbitraryProps = {
  signer: string;
  data: string;
};

export type VerifyArbitraryProps = {
  publicKey: string;
  hash: string;
  signature: string;
};

export type BalancesProps = {
  owner: string;
  tokens: string[];
};

export interface Namada {
  accounts(chainId?: string): Promise<DerivedAccount[] | undefined>;
  balances(
    props: BalancesProps
  ): Promise<{ token: string; amount: string }[] | undefined>;
  shieldedSync(): Promise<void>;
  connect(chainId?: string): Promise<void>;
  isConnected(): Promise<boolean | undefined>;
  defaultAccount(chainId?: string): Promise<DerivedAccount | undefined>;
  sign(props: SignArbitraryProps): Promise<SignatureResponse | undefined>;
  verify(props: VerifyArbitraryProps): Promise<void>;
  submitTx: (props: TxMsgProps) => Promise<void>;
  getChain: () => Promise<Chain | undefined>;
  getSigner: () => Signer;
  version: () => string;
}

export type WindowWithNamada = Window &
  typeof globalThis & {
    namada: Namada & {
      getSigner: () => Signer;
    };
  };

