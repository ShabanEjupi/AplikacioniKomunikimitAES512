import { performance } from 'perf_hooks';
import { createHash } from 'crypto';
import { hash } from '../../shared/src/crypto/ash512';

const testData = [
    'Hello, World!',
    'The quick brown fox jumps over the lazy dog',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    'Hashing is a one-way function',
    'Cryptography is essential for komunikimi i sigurt',
];

function benchmarkHashingAlgorithm(algorithm: (data: string) => string, label: string) {
    const start = performance.now();
    for (const data of testData) {
        algorithm(data);
    }
    const end = performance.now();
    console.log(`${label}: ${end - start} ms`);
}

function runBenchmarks() {
    console.log('Krahasimi i performancës ash-512...');
    benchmarkHashingAlgorithm(hash, 'ash-512');

    console.log('Krahasimi i performancës sha-512...');
    benchmarkHashingAlgorithm((data) => createHash('sha512').update(data).digest('hex'), 'sha-512');
}

runBenchmarks();

// Eksporto për përdorim në testim
export { benchmarkHashingAlgorithm };
