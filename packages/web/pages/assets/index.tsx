import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';

import { AssetsPageV2 } from '~/components/complex/assets-page-v2';
import { useTranslation } from '~/hooks';
// import { useFeatureFlags } from '~/hooks/use-feature-flags';

const Assets: NextPage = () => {
  // const flags = useFeatureFlags();
  const { t } = useTranslation();

  // will lose SSR until we delete the old assets page and FF
  /* if (!flags._isInitialized)
    return (
      <NextSeo
        title={t('seo.assets.title')}
        description={t('seo.assets.description')}
      />
    ); */

  return (
    <>
      <NextSeo
        title={t('seo.assets.title')}
        description={t('seo.assets.description')}
      />
      <AssetsPageV2 />
    </>
  );
};

export default Assets;
