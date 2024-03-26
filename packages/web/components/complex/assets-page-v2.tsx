import { logEvent } from '@amplitude/analytics-browser';
import { observer } from 'mobx-react-lite';
import { FunctionComponent, useCallback } from 'react';

import { NamadaIntegration } from '~/components/complex/namada-integration';
import { AssetsInfoTable } from '~/components/table/asset-info';
import { EventName } from '~/config';
import { useNavBar, useTranslation } from '~/hooks';
import { useBridge } from '~/hooks/bridge';
import { useStore } from '~/stores';

export const AssetsPageV2: FunctionComponent = observer(() => {
  const { assetsStore } = useStore();
  const {
    nativeBalances,
    ibcBalances,
    unverifiedIbcBalances,
    unverifiedNativeBalances,
  } = assetsStore;
  const { t } = useTranslation();
  const { startBridge, bridgeAsset } = useBridge();
  // set nav bar ctas
  useNavBar({
    ctas: [
      {
        label: t('assets.table.depositButton'),
        onClick: () => {
          startBridge('deposit');
          logEvent(EventName.Assets.depositClicked);
        },
      },
      {
        label: t('assets.table.withdrawButton'),
        onClick: () => {
          startBridge('withdraw');
          logEvent(EventName.Assets.withdrawClicked);
        },
      },
    ],
  });

  const onTableDeposit = useCallback(
    (_chainId: string, coinDenom: string, externalDepositUrl?: string) => {
      if (!externalDepositUrl) {
        bridgeAsset(coinDenom, 'deposit');
      }
    },
    [bridgeAsset]
  );
  const onTableWithdraw = useCallback(
    (_chainId: string, coinDenom: string, externalWithdrawUrl?: string) => {
      if (!externalWithdrawUrl) {
        bridgeAsset(coinDenom, 'withdraw');
      }
    },
    [bridgeAsset]
  );

  return (
    <main className="mx-5 flex max-w-container flex-col gap-4 bg-osmoverse-900 pt-4 md:gap-8 md:p-4">
      <NamadaIntegration />

      <div className="pt-8">
        <p className="py-1">Assets on Osmosis network</p>
        <hr className="py-1" />
        <AssetsInfoTable
          tableTopPadding={10}
          onDeposit={(coinMinimalDenom) => {
            onTableDeposit('osmosis', coinMinimalDenom);
          }}
          onWithdraw={(coinMinimalDenom) => {
            onTableWithdraw('osmosis', coinMinimalDenom);
          }}
        />
      </div>
    </main>
  );
});
