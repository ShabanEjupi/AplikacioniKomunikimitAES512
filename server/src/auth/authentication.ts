import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import SessionManager from './session';
import { SESSION_SECRET, JWT_SECRET } from '../constants';
import config from '../config';

export class UserAuthentication {
    private static instance: UserAuthentication | null = null;
    private sessionManager: SessionManager;
    private users: Map<string, { username: string, password: string, userId: string }>; // Ruajtja e përkohshme në memorje
    private static userIdCounter: number = 1000; // Counter për ID unike (static për të gjitha instancat)
    private registrationEnabled: boolean;

    constructor() {
        this.sessionManager = new SessionManager(JWT_SECRET); // Use JWT_SECRET for consistency
        this.users = new Map();
        this.registrationEnabled = process.env.ENABLE_REGISTRATION !== 'false';
        
        // Only initialize default users if enabled
        if (process.env.DEFAULT_USERS_ENABLED !== 'false') {
            this.initializeDefaultUsers();
        } else {
            console.log('ℹ️  Default users disabled. Registration is required.');
        }
    }

    static getInstance(): UserAuthentication {
        if (!UserAuthentication.instance) {
            UserAuthentication.instance = new UserAuthentication();
        }
        return UserAuthentication.instance;
    }

    private async initializeDefaultUsers() {
        // Krijo përdorues testues të paracaktuar për zhvillim
        const defaultUsers = [
            { username: 'testuser', password: 'testpass123' },
            { username: 'alice', password: 'alice123' },
            { username: 'bob', password: 'bob123' },
            { username: 'charlie', password: 'charlie123' }
        ];

        try {
            for (const user of defaultUsers) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                const userId = this.generateUniqueUserId();
                this.users.set(user.username, { 
                    username: user.username, 
                    password: hashedPassword,
                    userId: userId
                });
                console.log(`✅ Përdoruesi testues i paracaktuar u inicializua: ${user.username}/${user.password} (ID: ${userId})`);
            }
        } catch (error) {
            console.error('❌ Dështoi inicializimi i përdoruesve të paracaktuar:', error);
        }
    }

    private generateUniqueUserId(): string {
        return `user_${UserAuthentication.userIdCounter++}_${Date.now()}`;
    }

    async register(username: string, password: string): Promise<any> {
        // Check if registration is enabled
        if (!this.registrationEnabled) {
            throw new Error('Registration is currently disabled');
        }

        // Kontrollo nëse emri i përdoruesit ekziston tashmë
        if (this.checkUsernameExists(username)) {
            throw new Error('Emri i përdoruesit është i zënë');
        }

        // Validate password strength
        if (password.length < 6) {
            throw new Error('Fjalëkalimi duhet të jetë të paktën 6 karaktere');
        }

        const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for security
        const userId = this.generateUniqueUserId();
        this.users.set(username, { 
            username, 
            password: hashedPassword,
            userId: userId
        });
        
        console.log(`✅ New user registered: ${username} (ID: ${userId})`);
        return { id: userId, username };
    }

    // Check if registration is enabled
    isRegistrationEnabled(): boolean {
        return this.registrationEnabled;
    }

    // Toggle registration (admin function)
    setRegistrationEnabled(enabled: boolean): void {
        this.registrationEnabled = enabled;
        console.log(`🔧 Registration ${enabled ? 'enabled' : 'disabled'}`);
    }

    async login(username: string, password: string): Promise<string> {
        const user = this.users.get(username);
        if (!user) {
            throw new Error('Përdoruesi nuk u gjet');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Fjalëkalimi i pavlefshëm');
        }

        // Përdor ID-në ekzistuese të përdoruesit për tokenin jwt
        const token = jwt.sign({ username, userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });
        return token;
    }
    
    checkUsernameExists(username: string): boolean {
        return this.users.has(username);
    }

    getAllUsers(): string[] {
        return Array.from(this.users.keys());
    }

    getUserById(userId: string): { username: string, userId: string } | null {
        for (const [username, userData] of this.users.entries()) {
            if (userData.userId === userId) {
                return { username, userId: userData.userId };
            }
        }
        return null;
    }

    getUserByUsername(username: string): { username: string, userId: string } | null {
        const userData = this.users.get(username);
        if (userData) {
            return { username: userData.username, userId: userData.userId };
        }
        return null;
    }
}

