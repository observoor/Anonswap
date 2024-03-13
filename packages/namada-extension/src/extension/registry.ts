import { Wallet } from '@cosmos-kit/core';

import { ICON } from '../constant';

export const namadaExtensionInfo: Wallet = {
  name: 'namada-extension',
  prettyName: 'Namada',
  logo: ICON,
  mode: 'extension',
  mobileDisabled: () =>
    !('namada' in window || /NamadaCosmos/i.test(navigator.userAgent)),
  rejectMessage: {
    source: 'Request rejected',
  },
  connectEventNamesOnWindow: ['namada_keystorechange'],
  downloads: [
    {
      device: 'desktop',
      browser: 'chrome',
      link: 'https://chromewebstore.google.com/detail/namada-extension/hnebcbhjpeejiclgbohcijljcnjdofek',
    },
    {
      link: 'https://chromewebstore.google.com/detail/namada-extension/hnebcbhjpeejiclgbohcijljcnjdofek',
    },
  ],
};
