import { observer } from "mobx-react-lite";
import { FunctionComponent } from "react";

import { NamadaIntegration } from "~/components/complex/namada-integration";
import { AssetsInfoTable } from "~/components/table/asset-info";
import { useNavBar } from "~/hooks";

export const AssetsPageV2: FunctionComponent = observer(() => {
  // set nav bar ctas
  useNavBar({
    ctas: [
      /*{v
        label: t('assets.table.depositButton'),
        onClick: () => {
          startBridge('deposit');
          logEvent([EventName.Assets.depositClicked]);
        },
      },
      {
        label: t('assets.table.withdrawButton'),
        onClick: () => {
          startBridge('withdraw');
          logEvent([EventName.Assets.withdrawClicked]);
        },
      },*/
    ],
  });

  return (
    <main className="mx-auto flex max-w-container flex-col gap-4 bg-osmoverse-900 p-8 pt-4 md:gap-8 md:p-4">
      <NamadaIntegration />

      <div className="pt-8">
        <p className="py-1"> Assets info</p>
        <hr className="py-1" />
        <AssetsInfoTable
          tableTopPadding={10}
          onDeposit={(coinMinimalDenom) => {
            console.log("Deposit", coinMinimalDenom);
          }}
          onWithdraw={(coinMinimalDenom) => {
            console.log("Withdraw", coinMinimalDenom);
          }}
        />
      </div>
    </main>
  );
});
