/* eslint-disable import/no-extraneous-dependencies */
import {
  RegistryWallet,
  WalletConnectionInProgressError,
} from "@osmosis-labs/stores";

import { MainnetChainIds } from "./generated/chain-list";
import { CosmosKitWalletList } from "./generated/cosmos-kit-wallet-list";

export const WalletRegistry: RegistryWallet[] = [
  {
    ...CosmosKitWalletList["keplr-extension"],
    mobileDisabled: false,
    logo: "/wallets/keplr.svg",
    lazyInstall: () =>
      import("@cosmos-kit/keplr-extension").then((m) => m.KeplrExtensionWallet),
    windowPropertyName: "keplr",
    stakeUrl: "https://wallet.keplr.app/chains/osmosis?tab=staking",
    governanceUrl: "https://wallet.keplr.app/chains/osmosis?tab=governance",
    features: ["notifications"],
  },
  {
    ...CosmosKitWalletList["keplr-mobile"],
    logo: "/wallets/keplr.svg",
    lazyInstall: () =>
      import("~/integrations/keplr-walletconnect").then(
        (m) => m.KeplrMobileWallet
      ),
    supportsChain: async (chainId) => {
      const keplrMobileAvailableChains: MainnetChainIds[] = [
        "osmosis-1",
      ];

      return keplrMobileAvailableChains.includes(chainId as MainnetChainIds);
    },
    stakeUrl: "https://wallet.keplr.app/chains/osmosis?tab=staking",
    governanceUrl: "https://wallet.keplr.app/chains/osmosis?tab=governance",
    features: [],
  },
  {
    ...CosmosKitWalletList["namada-extension"],
    logo: "/wallets/namada.png",
    mobileDisabled: true,
    lazyInstall: () =>
      import("../../namada-extension").then((m) => m.NamadaExtensionWallet),
    windowPropertyName: "namada",
    stakeUrl: "https://namada.me",
    governanceUrl: "https://namada.me",
    features: ["notifications"],
    supportsChain: async (chainId) => {
      if (typeof window === "undefined") return true;

      const namadaWallet = (window as any)?.namada as {
        getChain: () => Promise<{ chainId: string }[]>;
      };
      const chainInfos = await namadaWallet.getChain();
      if (!namadaWallet) return chainId === 'shielded-expedition.88f17d1d14';
      return chainInfos.some((info) => info.chainId === chainId);
    },
  },
  {
    ...CosmosKitWalletList["leap-cosmos-mobile"],
    logo: "/wallets/leap.svg",
    lazyInstall: () =>
      import("@cosmos-kit/leap-mobile").then((m) => m.LeapMobileWallet),
    supportsChain: async (chainId) => {
      const leapMobileAvailableChains: MainnetChainIds[] = [

      ];
      return leapMobileAvailableChains.includes(chainId as MainnetChainIds);
    },

    stakeUrl: "https://cosmos.leapwallet.io/transact/stake/plain?chain=osmosis",
    governanceUrl: "https://cosmos.leapwallet.io/portfolio/gov?chain=osmosis",
    features: [],
  },
  {
    ...CosmosKitWalletList["cosmostation-extension"],
    logo: "/wallets/cosmostation.png",
    lazyInstall: () =>
      import("@cosmos-kit/cosmostation-extension").then(
        (m) => m.CosmostationExtensionWallet
      ),
    windowPropertyName: "cosmostation",
    stakeUrl: "https://wallet.cosmostation.io/osmosis/delegate",
    governanceUrl: "https://cosmos.leapwallet.io/gov",
    features: ["notifications"],
  },
  {
    ...CosmosKitWalletList["xdefi-extension"],
    logo: "/wallets/xdefi.png",
    lazyInstall: () =>
      import("@cosmos-kit/xdefi-extension").then((m) => m.XDEFIExtensionWallet),
    windowPropertyName: "xfi",
    async supportsChain(chainId) {
      if (typeof window === "undefined") return true;

      const xfiWallet = (window as any)?.xfi?.keplr as {
        getKey: (chainId: string) => Promise<boolean>;
      };

      if (!xfiWallet) return true;

      return xfiWallet
        .getKey(chainId)
        .then(() => true)
        .catch(() => false);
    },
    features: [],
  },
  {
    ...CosmosKitWalletList["station-extension"],
    mobileDisabled: true,
    logo: "/wallets/station.svg",
    lazyInstall: () =>
      import("@cosmos-kit/station-extension").then(
        (m) => m.StationExtensionWallet
      ),
    windowPropertyName: "station",
    supportsChain: async (chainId) => {
      if (typeof window === "undefined") return true;

      const stationWallet = (window as any)?.station?.keplr as {
        getChainInfosWithoutEndpoints: () => Promise<{ chainId: string }[]>;
      };

      if (!stationWallet) return true;

      const chainInfos = await stationWallet.getChainInfosWithoutEndpoints();
      return chainInfos.some((info) => info.chainId === chainId);
    },
    signOptions: {
      preferNoSetFee: true,
    },
    features: [],
  },
  {
    ...CosmosKitWalletList["okxwallet-extension"],
    logo: "/wallets/okx.png",
    lazyInstall: () =>
      import("@cosmos-kit/okxwallet-extension").then(
        (m) => m.OkxwalletExtensionWallet
      ),
    windowPropertyName: "okxwallet",
    async supportsChain(chainId, retryCount = 0) {
      if (typeof window === "undefined") return true;

      const okxWallet = (window as any)?.okxwallet?.keplr as {
        getKey: (chainId: string) => Promise<boolean>;
      };

      if (!okxWallet) return true;

      try {
        await okxWallet.getKey(chainId);
        return true;
      } catch (e) {
        const error = e as { code: number; message: string };

        // Check for chain not supported error
        if (
          error.code === -32603 &&
          error.message.includes("There is no chain info")
        ) {
          return false;
        }

        // Retry if the wallet is already processing
        if (
          error.code === -32002 &&
          error.message.includes("Already processing") &&
          retryCount < 5
        ) {
          /**
           * Simple exponential backoff mechanism where the delay doubles
           * with each retry. Here, we have a base delay of 100 milliseconds.
           * So, the first retry will wait for 200 ms,
           * the second for 400 ms, and so on.
           */
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retryCount) * 100)
          );
          // @ts-ignore
          return this.supportsChain(chainId, retryCount + 1);
        }

        return false;
      }
    },
    matchError: (error) => {
      if (typeof error !== "string") return error;

      if (
        error.includes(
          "Already processing wallet_requestIdentities. Please wait."
        )
      ) {
        return new WalletConnectionInProgressError();
      }

      return error;
    },
    signOptions: {
      preferNoSetFee: true,
    },
    features: [],
  },
];
