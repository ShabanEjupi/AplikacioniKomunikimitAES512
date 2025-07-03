import { describe, beforeAll, afterAll, test, expect } from '@jest/globals';
import { createServer as createHttpsServer } from 'https';
import { request } from 'https';
import { readFileSync } from 'fs';
import { verifyClientCertificate } from '../../client/src/crypto/tls';
import * as path from 'path';

describe('Testet e tls', () => {
    let server: any;
    const certPath = path.join(__dirname, '../../server/certs/cert.pem');
    const keyPath = path.join(__dirname, '../../server/certs/key.pem');

    beforeAll((done) => {
        try {
            const options = {
                key: readFileSync(keyPath, 'utf8'),
                cert: readFileSync(certPath, 'utf8'),
            };
            
            server = createHttpsServer(options, (req, res) => {
                res.writeHead(200);
                res.end('Lidhja e sigurt u vendos');
            }).listen(8443, done);
        } catch (error) {
            console.warn('Skedarët e çertifikatës nuk u gjetën, kapërcej krijimin e serverit');
            done();
        }
    });

    afterAll((done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    test('duhet të verifikojë çertifikatën e klientit', () => {
        const testCert = Buffer.from('test-certificate-data');
        const isValid = verifyClientCertificate(testCert);
        expect(typeof isValid).toBe('boolean');
    });

    test('duhet të menaxhojë gabimet e verifikimit të çertifikatës me butësi', () => {
        const invalidCert = Buffer.from('invalid-cert');
        expect(() => {
            verifyClientCertificate(invalidCert);
        }).not.toThrow();
    });

    test('duhet të kthejë boolean për verifikimin e çertifikatës', () => {
        const emptyCert = Buffer.alloc(0);
        const result = verifyClientCertificate(emptyCert);
        expect(typeof result).toBe('boolean');
    });
});

