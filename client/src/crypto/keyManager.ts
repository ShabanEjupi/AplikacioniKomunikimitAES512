export class KeyManager {
    private keys: Map<string, string>;

    constructor() {
        this.keys = new Map();
    }

    generateKey(identifier: string): string {
        const key = this.createSecureKey();
        this.keys.set(identifier, key);
        return key;
    }

    retrieveKey(identifier: string): string | undefined {
        return this.keys.get(identifier);
    }

    private createSecureKey(): string {
        // Use Web Crypto api for browser environment
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    deleteKey(identifier: string): void {
        this.keys.delete(identifier);
    }
}

