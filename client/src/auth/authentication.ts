import axios from 'axios';
import config from '../config';

export default class UserAuthentication {
    private apiUrl: string;

    constructor(apiUrl?: string) {
        // Use centralized config
        this.apiUrl = apiUrl || config.API_BASE_URL;
        
        console.log('🔧 UserAuthentication initialized with URL:', this.apiUrl);
        console.log('🌍 Environment:', process.env.NODE_ENV);
        console.log('🌍 Config:', config);
        console.log('🌐 Full URL will be:', this.apiUrl);
    }

    async register(username: string, password: string): Promise<any> {
        try {
            console.log('📤 Attempting registration with URL:', `${this.apiUrl}/register`);
            const response = await axios.post(`${this.apiUrl}/register`, {
                username,
                password
            });
            console.log('✅ Registration successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Registration failed:', error);
            console.error('Response:', error.response?.data);
            console.error('Status:', error.response?.status);
            console.error('URL:', error.config?.url);
            
            let errorMessage = 'Regjistrimi dështoi: ';
            if (error.response?.data?.error) {
                errorMessage += error.response.data.error;
            } else if (error.response?.status === 404) {
                errorMessage += 'API endpoint not found. Check deployment configuration.';
            } else {
                errorMessage += error.message;
            }
            throw new Error(errorMessage);
        }
    }

    async testApiConnectivity(): Promise<void> {
        console.log('🔍 Testing API connectivity...');
        console.log('📍 Current environment:', process.env.NODE_ENV);
        console.log('📍 Base URL:', this.apiUrl);
        
        const endpoints = [
            'registration-status',
            'health-check',
            'users',
            'login',
            'register'
        ];

        for (const endpoint of endpoints) {
            try {
                const url = `${this.apiUrl}/${endpoint}`;
                console.log(`🔗 Testing: ${url}`);
                
                const response = await axios.get(url, { timeout: 5000 });
                console.log(`✅ ${endpoint}: ${response.status} - Available`);
            } catch (error: any) {
                console.error(`❌ ${endpoint}: ${error.response?.status || error.code} - ${error.message}`);
                if (error.response?.data) {
                    console.error(`   Data:`, error.response.data);
                }
            }
        }
    }

    async login(username: string, password: string): Promise<string> {
        try {
            console.log('📤 Attempting login with URL:', `${this.apiUrl}/login`);
            const response = await axios.post(`${this.apiUrl}/login`, {
                username,
                password
            });
            console.log('✅ Login successful:', response.data);
            return response.data.token;
        } catch (error: any) {
            console.error('❌ Login failed:', error);
            console.error('Response:', error.response?.data);
            console.error('Status:', error.response?.status);
            console.error('URL:', error.config?.url);
            
            let errorMessage = 'Hyrja dështoi: ';
            if (error.response?.data?.error) {
                errorMessage += error.response.data.error;
            } else if (error.response?.status === 404) {
                errorMessage += 'API endpoint not found. Check deployment configuration.';
            } else {
                errorMessage += error.message;
            }
            throw new Error(errorMessage);
        }
    }
}

