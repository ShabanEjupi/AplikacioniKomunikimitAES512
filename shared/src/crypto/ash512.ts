// Re-export from implementation for compatibility
export { ASH512 } from './ash512-impl';

// Legacy function exports for backward compatibility
import { ASH512 } from './ash512-impl';

export function hash(data: string | Buffer): string {
    const input = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const result = ASH512.hash(input);
    return result.toString('hex');
}

export function performanceAnalysis(testSizes: number[] = [100, 1000, 10000, 100000, 1000000]) {
    console.log('\n🔍 ASH-512 Performance Analysis');
    console.log('================================');
    console.log('| Data Size (bytes)              | Execution Time (ms) | Hashes/sec |');
    console.log('|--------------------------------|----------------------|------------|');
    
    const results: any[] = [];
    
    for (const size of testSizes) {
        const testData = Buffer.alloc(size, 'A');
        const iterations = Math.max(1, Math.floor(1000 / Math.sqrt(size / 1000)));
        
        const start = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            ASH512.hash(testData);
        }
        const end = process.hrtime.bigint();
        
        const executionTimeMs = Number(end - start) / 1000000;
        const avgTime = executionTimeMs / iterations;
        const hashesPerSecond = Math.floor(iterations / (executionTimeMs / 1000));
        
        const result = {
            dataSize: size,
            executionTime: avgTime,
            hashesPerSecond
        };
        
        results.push(result);
        console.log(`| ${size.toString().padEnd(30)} | ${avgTime.toFixed(3).padEnd(20)} | ${hashesPerSecond.toString().padEnd(10)} |`);
    }
    
    return results;
}

export function compareWithStandardAlgorithms(testSizes: number[] = [1000, 10000, 100000]): void {
    const { createHash } = require('crypto');
    
    console.log('\n📊 Algorithm Comparison');
    console.log('=======================');
    console.log('| Algorithm | Data Size | Time (ms) | Hashes/sec |');
    console.log('|-----------|-----------|-----------|------------|');
    
    for (const size of testSizes) {
        const testData = Buffer.alloc(size, 'A');
        const iterations = Math.max(1, Math.floor(1000 / Math.sqrt(size / 1000)));
        
        // Test ASH-512
        let start = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            ASH512.hash(testData);
        }
        let end = process.hrtime.bigint();
        const ash512Time = Number(end - start) / 1000000 / iterations;
        const ash512Rate = Math.floor(iterations / (Number(end - start) / 1000000000));
        
        // Test SHA-512
        start = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            createHash('sha512').update(testData).digest();
        }
        end = process.hrtime.bigint();
        const sha512Time = Number(end - start) / 1000000 / iterations;
        const sha512Rate = Math.floor(iterations / (Number(end - start) / 1000000000));
        
        console.log(`| ash-512   | ${size.toString().padEnd(9)} | ${ash512Time.toFixed(3).padEnd(9)} | ${ash512Rate.toString().padEnd(10)} |`);
        console.log(`| sha-512   | ${size.toString().padEnd(9)} | ${sha512Time.toFixed(3).padEnd(9)} | ${sha512Rate.toString().padEnd(10)} |`);
        console.log('|-----------|-----------|-----------|------------|');
    }
}

