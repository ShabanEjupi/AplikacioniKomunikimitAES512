// Type declarations for crypto-js to fix build issues
declare module 'crypto-js' {
  export interface WordArray {
    words: number[];
    sigBytes: number;
    toString(encoder?: any): string;
  }

  export interface Hasher {
    update(messageUpdate: WordArray | string): Hasher;
    finalize(messageUpdate?: WordArray | string): WordArray;
  }

  export interface Hash {
    (message: WordArray | string, key?: WordArray | string): WordArray;
    create(cfg?: object): Hasher;
  }

  export const SHA512: Hash;
  export const SHA256: Hash;
  export const SHA1: Hash;
  export const MD5: Hash;
  
  export interface Cipher {
    encrypt(message: WordArray | string, key: WordArray | string, cfg?: object): WordArray;
    decrypt(ciphertext: WordArray | string, key: WordArray | string, cfg?: object): WordArray;
  }

  export const AES: Cipher;
  
  export interface Encoding {
    parse(str: string): WordArray;
    stringify(wordArray: WordArray): string;
  }

  export const enc: {
    Hex: Encoding;
    Base64: Encoding;
    Base64url: Encoding;
    Utf8: Encoding;
    Latin1: Encoding;
  };

  export const lib: {
    WordArray: {
      create(words?: number[], sigBytes?: number): WordArray;
      random(nBytes: number): WordArray;
    };
  };
}
