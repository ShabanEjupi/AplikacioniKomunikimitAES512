import axios from 'axios';

export default class UserAuthentication {
    private apiUrl: string;

    constructor(apiUrl?: string) {
        if (process.env.NODE_ENV === 'production') {
            this.apiUrl = 'https://cryptocall.netlify.app/.netlify/functions';
        } else {
            this.apiUrl = apiUrl || 'http://localhost:3000/api';
        }
    }

    async register(username: string, password: string): Promise<any> {
        try {
            const response = await axios.post(`${this.apiUrl}/register`, {
                username,
                password
            });
            return response.data;
        } catch (error) {
            throw new Error('Regjistrimi dështoi: ' + (error as Error).message);
        }
    }

    async login(username: string, password: string): Promise<string> {
        try {
            const response = await axios.post(`${this.apiUrl}/login`, {
                username,
                password
            });
            return response.data.token; // Duke supozuar që serveri kthen një token
        } catch (error) {
            throw new Error('Hyrja dështoi: ' + (error as Error).message);
        }
    }
}

