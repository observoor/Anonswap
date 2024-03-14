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
  const namada = (window as NamadaWindow).namada;
  if (namada) {
    return namada;
  }

  if (document.readyState === 'complete') {
    if (namada) {
      return namada;
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
        const namada = (window as NamadaWindow).namada;
        if (namada) {
          resolve(namada);
        } else {
          reject(ClientNotExistError.message);
        }
        document.removeEventListener('readystatechange', documentStateChange);
      }
    };

    document.addEventListener('readystatechange', documentStateChange);
  });
};
