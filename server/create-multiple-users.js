// Skript për të krijuar shumë përdorues testues
const axios = require('axios');

const testUsers = [
    { username: 'alice', password: 'alice123' },
    { username: 'bob', password: 'bob123' },
    { username: 'charlie', password: 'charlie123' },
    { username: 'diana', password: 'diana123' }
];

async function createMultipleTestUsers() {
    console.log('🚀 Duke krijuar përdorues testues...');
    console.log('=====================================\n');

    for (const user of testUsers) {
        try {
            const response = await axios.post('http://localhost:3000/api/register', {
                username: user.username,
                password: user.password
            });
            console.log(`✅ Përdoruesi '${user.username}' u krijua me sukses`);
        } catch (error) {
            if (error.response?.data?.error === 'Emri i përdoruesit është i zënë') {
                console.log(`⚠️  Përdoruesi '${user.username}' ekziston tashmë`);
            } else {
                console.log(`❌ Gabim në krijimin e '${user.username}':`, error.response?.data?.error || error.message);
            }
        }
    }

    console.log('\n📝 Lista e kredencialeve:');
    console.log('==========================');
    testUsers.forEach(user => {
        console.log(`   ${user.username} / ${user.password}`);
    });
    
    console.log('\n💡 Tani mund të testoni komunikimin multi-përdorues!');
}

createMultipleTestUsers();
