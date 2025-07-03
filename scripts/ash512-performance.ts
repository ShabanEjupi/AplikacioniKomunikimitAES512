#!/usr/bin/env ts-node
import { ASH512 } from '../server/src/crypto/ash512';
import { createHash } from 'crypto';

console.log('🚀 ASH-512 Hash Algorithm Performance Testing');
console.log('==============================================\n');

// Test basic functionality
console.log('✅ Testing Basic Hashing Functionality:');
const testData = Buffer.from("Hello, ASH-512 World with Coordinate Geometry!", 'utf8');
const hashResult = ASH512.hash(testData);
console.log(`Input: "${testData.toString()}"`);
console.log(`Hash:  ${hashResult.toString('hex')}`);
console.log(`Length: ${hashResult.length} bytes (${hashResult.length * 8} bits)\n`);

// Test different input sizes and measure performance
console.log('📈 Running Comprehensive Performance Analysis...');

const testSizes = [
    100,      // 100 bytes
    1000,     // 1 KB
    10000,    // 10 KB
    100000,   // 100 KB
    1000000   // 1 MB
];

console.log('🔍 ASH-512 Performance Analysis');
console.log('================================');
console.log('| Data Size (bytes)              | Execution Time (ms) | Hashes/sec |');
console.log('|--------------------------------|----------------------|------------|');

const ash512Results: any[] = [];

for (const size of testSizes) {
    const testBuffer = Buffer.alloc(size, 'A');
    const iterations = Math.max(1, Math.floor(1000 / Math.sqrt(size / 1000)));
    
    const start = process.hrtime.bigint();
    
    for (let i = 0; i < iterations; i++) {
        ASH512.hash(testBuffer);
    }
    
    const end = process.hrtime.bigint();
    const totalTime = Number(end - start) / 1000000; // Convert to milliseconds
    const avgTime = totalTime / iterations;
    const hashesPerSecond = Math.floor(iterations / (totalTime / 1000));
    
    ash512Results.push({
        size,
        avgTime,
        hashesPerSecond
    });
    
    console.log(`| ${size.toString().padEnd(30)} | ${avgTime.toFixed(3).padEnd(20)} | ${hashesPerSecond.toString().padEnd(10)} |`);
}

// Compare with SHA-512
console.log('\n📊 Comparison with Standard Algorithms');
console.log('======================================');
console.log('| Algorithm | Data Size | Time (ms) | Hashes/sec |');
console.log('|-----------|-----------|-----------|------------|');

const comparisonSizes = [1000, 10000, 100000];

for (const size of comparisonSizes) {
    const testBuffer = Buffer.alloc(size, 'A');
    const iterations = Math.max(1, Math.floor(1000 / Math.sqrt(size / 1000)));
    
    // Test ASH-512
    let start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        ASH512.hash(testBuffer);
    }
    let end = process.hrtime.bigint();
    let ash512Time = Number(end - start) / 1000000 / iterations;
    let ash512ThroughputS = Math.floor(iterations / (Number(end - start) / 1000000000));
    
    // Test SHA-512
    start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        createHash('sha512').update(testBuffer).digest();
    }
    end = process.hrtime.bigint();
    let sha512Time = Number(end - start) / 1000000 / iterations;
    let sha512Throughput = Math.floor(iterations / (Number(end - start) / 1000000000));
    
    console.log(`| ash-512   | ${size.toString().padEnd(9)} | ${ash512Time.toFixed(3).padEnd(9)} | ${ash512ThroughputS.toString().padEnd(10)} |`);
    console.log(`| sha-512   | ${size.toString().padEnd(9)} | ${sha512Time.toFixed(3).padEnd(9)} | ${sha512Throughput.toString().padEnd(10)} |`);
    console.log('|-----------|-----------|-----------|------------|');
}

// Generate Performance Summary
console.log('\n📋 Performance Summary');
console.log('======================');
ash512Results.forEach(result => {
    const sizeLabel = result.size < 1000 
        ? `${result.size} bytes`
        : result.size < 1000000 
            ? `${result.size / 1000} KB`
            : `${result.size / 1000000} MB`;
    
    console.log(`${sizeLabel.padEnd(8)}: ${result.avgTime.toFixed(3)}ms avg, ${result.hashesPerSecond} hashes/sec`);
});

console.log('\n✨ Performance testing completed!');
console.log('\n🔬 ASH-512 Features:');
console.log('   • Uses coordinate geometry transformations');
console.log('   • Implements 2D rotation and permutation operations');
console.log('   • 512-bit output with 1024-bit block size');
console.log('   • Geometric distance calculations for enhanced security');
console.log('   • Permutation tables based on coordinate positions');

