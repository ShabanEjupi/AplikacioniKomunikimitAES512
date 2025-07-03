import { describe, beforeAll, afterAll, test, expect } from '@jest/globals';
import { UserAuthentication } from '../../server/src/auth/authentication';
import SessionManager from '../../server/src/auth/session';
import { KeyManager } from '../../server/src/crypto/keyManager';
import { encryptMessage, decryptMessage } from '../../server/src/messaging/encryption';
import { createServer } from 'http';
import { Server as httpServer } from 'http';

describe('Komunikimi i Sigurt Testet e Integrimit', () => {
    let userAuth: UserAuthentication;
    let sessionManager: SessionManager;
    let keyManager: KeyManager;
    let server: httpServer;

    beforeAll(() => {
        userAuth = new UserAuthentication();
        sessionManager = new SessionManager('a_secret');
        keyManager = new KeyManager();
        server = createServer();
        server.listen(3001); // Përdor një port të ndryshëm për të shmangur konfliktin me serverin e zhvillimit
    });

    afterAll(() => {
        server.close();
    });

    test('Regjistrimi dhe hyrja e përdoruesit', async () => {
        const username = 'testUser';
        const password = 'testPassword';
        await userAuth.register(username, password);
        const token = await userAuth.login(username, password);
        expect(token).toBeDefined();
        sessionManager.storeSession(token);
    });

    test('Transmetimi i sigurt i mesazheve', () => {
        const message = 'Përshëndetje, botë e sigurt!';
        const { iv, encryptedData } = encryptMessage(message);
        
        const decryptedMessage = decryptMessage(iv, encryptedData);
        expect(decryptedMessage).toBe(message);
    });

    test('Menaxhimi i sesioneve', async () => {
        const token = await userAuth.login('testUser', 'testPassword');
        expect(sessionManager.validateToken(token)).toBe(true);
        sessionManager.removeSession(token);
        expect(sessionManager.validateToken(token)).toBe(false);
    });
});

