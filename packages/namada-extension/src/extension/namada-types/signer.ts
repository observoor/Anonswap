import { Account } from "./account";


export type SignatureResponse = {
  hash: string;
  signature: string;
};

export interface Signer {
  accounts: (chainId?: string) => Promise<Account[] | undefined>;
  defaultAccount: (chainId?: string) => Promise<Account | undefined>;
  sign: (
    signer: string,
    data: string
  ) => Promise<SignatureResponse | undefined>;
  verify: (publicKey: string, hash: string, signature: string) => Promise<void>;
  submitBond(
    args: any,
    txArgs: any,
    type: any
  ): Promise<void>;
  submitUnbond(
    args: any,
    txArgs: any,
    type: any
  ): Promise<void>;
  submitWithdraw(
    args: any,
    txArgs: any,
    type: any
  ): Promise<void>;
  submitTransfer(
    args: any,
    txArgs: any,
    type: any
  ): Promise<void>;
  submitIbcTransfer(
    args: any,
    txArgs: any,
    type: any
  ): Promise<void>;
  submitVoteProposal(
    args: any,
    txArgs: any,
    type: any
  ): Promise<void>;
  submitEthBridgeTransfer(
    args: any,
    txArgs: any,
    type: any
  ): Promise<void>;
}
