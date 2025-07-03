import { describe, test, expect } from '@jest/globals';
import { hash, performanceAnalysis } from '../../shared/src/crypto/ash512';

describe('Ash-512 Algoritmi hash', () => {
    test('duhet t� hash-oj� "Hello, World!" sakt�sisht', () => {
        const result = hash('Hello, World!');
        expect(typeof result).toBe('string');
        expect(result.length).toBe(128); // sha-512 hex string length
    });

    test('duhet t� hash-oj� "Komunikimi i Sigurt" sakt�sisht', () => {
        const result = hash('Komunikimi i Sigurt');
        expect(typeof result).toBe('string');
        expect(result.length).toBe(128);
    });

    test('duhet t� hash-oj� "Test Message" sakt�sisht', () => {
        const result = hash('Test Message');
        expect(typeof result).toBe('string');
        expect(result.length).toBe(128);
    });

    test('duhet t� prodhoj� rezultate konsistente p�r t� nj�jtin input', () => {
        const input = 'Consistent Test';
        const result1 = hash(input);
        const result2 = hash(input);
        expect(result1).toBe(result2);
    });

    test('duhet t� prodhoj� rezultate t� ndryshme p�r input t� ndrysh�m', () => {
        const result1 = hash('Input 1');
        const result2 = hash('Input 2');
        expect(result1).not.toBe(result2);
    });

    test('Analiza e Performanc�s should complete pa gabime', () => {
        expect(() => {
            performanceAnalysis();
        }).not.toThrow();
    });
});

