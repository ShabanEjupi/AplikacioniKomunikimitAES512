import { createSecureContext, TLSSocket } from 'tls';
import * as fs from 'fs';
import { promisify } from 'util';
import { resolve } from 'path';

const readFile = promisify(fs.readFile);

const CERT_PATH = resolve(__dirname, 'certs/server-cert.pem');
const KEY_PATH = resolve(__dirname, 'certs/server-key.pem');

export async function createTLSConnection(socket: any) {
    const [keyData, certData] = await Promise.all([
        readFile(KEY_PATH, 'utf8'),
        readFile(CERT_PATH, 'utf8')
    ]);

    const secureContext = createSecureContext({
        key: keyData,
        cert: certData,
    });

    const tlsSocket = new TLSSocket(socket, {
        secureContext,
        isServer: true,
        rejectUnauthorized: true,
    });

    tlsSocket.on('secureConnect', () => {
        console.log('Lidhja tls u vendos');
    });

    tlsSocket.on('error', (error) => {
        console.error('Gabim tls:', error);
    });

    return tlsSocket;
}

export function verifyClientCertificate(clientCert: Buffer) {
    // Zbato logjikën e verifikimit të çertifikatës këtu
    // Kjo është një vendmbajtës për verifikimin aktual
    return true; // Zëvendëso me rezultatin aktual të verifikimit
}

