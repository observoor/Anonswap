import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';

import { ProgressiveSvgImage } from '~/components/progressive-svg-image';
import { EventName } from '~/config';
import { useAmplitudeAnalytics, useFeatureFlags } from '~/hooks';

const Home = () => {
  const featureFlags = useFeatureFlags();
  const router = useRouter();
  router.push('/assets');

  useAmplitudeAnalytics({
    onLoadEvent: [EventName.Swap.pageViewed, { isOnHome: true }],
  });

  console.log('featureFlags', featureFlags.tokenInfo);

  return (
    <main className="relative flex h-full items-center overflow-auto bg-osmoverse-900 py-2">
      <div className="pointer-events-none fixed h-full w-full bg-home-bg-pattern bg-cover bg-repeat-x">
        <svg
          className="absolute h-full w-full lg:hidden"
          pointerEvents="none"
          viewBox="0 0 1300 900"
          height="900"
          preserveAspectRatio="xMidYMid slice"
        >
          <g>
            <ProgressiveSvgImage
              lowResXlinkHref="/images/osmosis-home-bg-low.png"
              xlinkHref="/images/osmosis-home-bg.png"
              x="56"
              y="220"
              width="578.7462"
              height="725.6817"
            />
            <ProgressiveSvgImage
              lowResXlinkHref={'/images/osmosis-home-fg-low.png'}
              xlinkHref={'/images/osmosis-home-fg.png'}
              x={'61'}
              y={'682'}
              width={'448.8865'}
              height={'285.1699'}
            />
          </g>
        </svg>
      </div>
      <div className="my-auto flex h-auto w-full items-center">
        <div className="ml-auto mr-[15%] flex w-[27rem] flex-col gap-4 lg:mx-auto md:mt-mobile-header">
          {/* <SwapTool /> */}
        </div>
      </div>
    </main>
  );
};

export interface SwapAdBannerResponse {
  banners: {
    name: string;
    startDate: string;
    endDate: string;
    headerOrTranslationKey: string;
    subheaderOrTranslationKey: string;
    externalUrl: string;
    iconImageUrl: string;
    iconImageAltOrTranslationKey: string;
    gradient: string;
    fontColor: string;
    arrowColor: string;
    featured: true;
  }[];
  localization: Record<string, Record<string, any>>;
}

export default observer(Home);
