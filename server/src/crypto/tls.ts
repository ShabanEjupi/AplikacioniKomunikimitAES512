import * as tls from 'tls';
import * as fs from 'fs';
import { KeyManager } from '../crypto/keyManager';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

const keyManager = new KeyManager();

export async function createServer(options: tls.TlsOptions) {
    const server = tls.createServer(options, (socket: tls.TLSSocket) => {
        console.log('Klienti u lidhur');

        socket.on('data', (data: Buffer) => {
            console.log('Të dhëna të marra:', data.toString());
            // Menaxhimi i të dhënave të ardhura
        });

        socket.on('end', () => {
            console.log('Klienti u shkëput');
        });
    });

    return server;
}

export async function startServer(port: number, certPath: string, keyPath: string) {
    const [cert, key] = await Promise.all([
        readFile(certPath),
        readFile(keyPath),
    ]);

    const options: tls.TlsOptions = {
        key: key,
        cert: cert,
        // Opsione shtesë mund të vendosen këtu
    };

    const server = await createServer(options);
    server.listen(port, () => {
        console.log(`Serveri tls po dëgjon në portin ${port}`);
    });
}

export function verifyClientCertificate(cert: Buffer) {
    // Zbato logjikën e verifikimit të çertifikatës këtu
    // Kthe të vërtetë nëse është e vlefshme, të gabuar përndryshe
    return true; // Vendmbajtës
}

