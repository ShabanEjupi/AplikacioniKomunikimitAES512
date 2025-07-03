// Skript i thjeshtë për të krijuar një përdorues testues përmes Api
const axios = require('axios');

async function createTestUser() {
    try {
        const response = await axios.post('http://localhost:3000/api/register', {
            username: 'testuser',
            password: 'testpass123'
        });
        console.log('✅ Përdoruesi testues u krijua me sukses:', response.data);
        console.log('📝 Kredencialet e hyrjes:');
        console.log('   Emri i përdoruesit: testuser');
        console.log('   Fjalëkalimi: testpass123');
    } catch (error) {
        if (error.response) {
            console.log('❌ Gabim:', error.response.data.error);
        } else {
            console.log('❌ Gabim rrjeti:', error.message);
            console.log('Sigurohu që serveri po funksionon në http://localhost:3000');
        }
    }
}

createTestUser();

