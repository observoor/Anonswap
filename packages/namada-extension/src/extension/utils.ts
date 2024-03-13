import { ClientNotExistError } from '@cosmos-kit/core';

import { Namada } from './types';

interface NamadaWindow {
  namada?: Namada;
}

export const getNamadaFromExtension: () => Promise<
  Namada | undefined
> = async () => {
  if (typeof window === 'undefined') {
    return void 0;
  }
  const namadaInst = (window as NamadaWindow).namada;
  if (namadaInst) {
    return namadaInst;
  }

  if (document.readyState === 'complete') {
    if (namadaInst) {
      return namadaInst;
    } else {
      throw ClientNotExistError;
    }
  }

  return new Promise((resolve, reject) => {
    const documentStateChange = (event: Event) => {
      if (
        event.target &&
        (event.target as Document).readyState === 'complete'
      ) {
        if (namadaInst) {
          resolve(namadaInst);
        } else {
          reject(ClientNotExistError.message);
        }
        document.removeEventListener('readystatechange', documentStateChange);
      }
    };

    document.addEventListener('readystatechange', documentStateChange);
  });
};
