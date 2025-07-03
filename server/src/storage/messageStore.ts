import fs from 'fs';
import path from 'path';

interface Message {
    id: string;
    content: string;
    timestamp: Date;
    senderId: string;
    recipientId: string;
}

export class MessageStore {
    private messages: Message[] = [];
    private filePath: string;

    constructor() {
        // Create a data directory if it doesn't exist
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        this.filePath = path.join(dataDir, 'messages.json');
        this.loadMessages();
    }

    private loadMessages() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf8');
                const parsed = JSON.parse(data);
                // Convert timestamp strings back to Date objects
                this.messages = parsed.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
                console.log(`📥 Loaded ${this.messages.length} messages from storage`);
            }
        } catch (error) {
            console.error('❌ Error loading messages:', error);
            this.messages = [];
        }
    }

    private saveMessages() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.messages, null, 2));
            console.log(`💾 Saved ${this.messages.length} messages to storage`);
        } catch (error) {
            console.error('❌ Error saving messages:', error);
        }
    }

    addMessage(message: Message): void {
        this.messages.push(message);
        this.saveMessages();
    }

    getAllMessages(): Message[] {
        return this.messages;
    }

    getConversation(user1: string, user2: string): Message[] {
        return this.messages.filter(msg => 
            (msg.senderId === user1 && msg.recipientId === user2) ||
            (msg.senderId === user2 && msg.recipientId === user1)
        );
    }

    getMessagesForUser(userId: string): Message[] {
        return this.messages.filter(msg => 
            msg.senderId === userId || msg.recipientId === userId
        );
    }

    clearMessages(): void {
        this.messages = [];
        this.saveMessages();
    }

    deleteMessage(messageId: string, userId: string): boolean {
        const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex === -1) {
            return false;
        }
        
        const message = this.messages[messageIndex];
        // Only allow deletion if the user is the sender
        if (message.senderId !== userId) {
            return false;
        }
        
        this.messages.splice(messageIndex, 1);
        this.saveMessages();
        return true;
    }

    deleteConversation(user1: string, user2: string): number {
        const initialLength = this.messages.length;
        this.messages = this.messages.filter(msg => 
            !((msg.senderId === user1 && msg.recipientId === user2) ||
              (msg.senderId === user2 && msg.recipientId === user1))
        );
        const deletedCount = initialLength - this.messages.length;
        if (deletedCount > 0) {
            this.saveMessages();
        }
        return deletedCount;
    }

    deleteAllMessagesForUser(userId: string): number {
        const initialLength = this.messages.length;
        this.messages = this.messages.filter(msg => 
            msg.senderId !== userId && msg.recipientId !== userId
        );
        const deletedCount = initialLength - this.messages.length;
        if (deletedCount > 0) {
            this.saveMessages();
        }
        return deletedCount;
    }

    // New method: Delete message for everyone (admin capability)
    deleteMessageForEveryone(messageId: string): boolean {
        const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex === -1) {
            return false;
        }
        
        this.messages.splice(messageIndex, 1);
        this.saveMessages();
        return true;
    }

    // New method: Delete conversation for everyone (admin capability)
    deleteConversationForEveryone(user1: string, user2: string): number {
        const initialLength = this.messages.length;
        this.messages = this.messages.filter(msg => 
            !((msg.senderId === user1 && msg.recipientId === user2) ||
              (msg.senderId === user2 && msg.recipientId === user1))
        );
        const deletedCount = initialLength - this.messages.length;
        if (deletedCount > 0) {
            this.saveMessages();
        }
        return deletedCount;
    }

    // Enhanced delete message method with options
    deleteMessageAdvanced(messageId: string, userId: string, forEveryone: boolean = false): boolean {
        const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex === -1) {
            return false;
        }
        
        const message = this.messages[messageIndex];
        
        // If forEveryone is true, allow deletion regardless of sender
        // Otherwise, only allow deletion if the user is the sender
        if (!forEveryone && message.senderId !== userId) {
            return false;
        }
        
        this.messages.splice(messageIndex, 1);
        this.saveMessages();
        return true;
    }

    // Enhanced delete conversation method with options
    deleteConversationAdvanced(user1: string, user2: string, requestingUser: string, forEveryone: boolean = false): number {
        const initialLength = this.messages.length;
        
        if (forEveryone) {
            // Delete for everyone
            this.messages = this.messages.filter(msg => 
                !((msg.senderId === user1 && msg.recipientId === user2) ||
                  (msg.senderId === user2 && msg.recipientId === user1))
            );
        } else {
            // Delete only messages where the requesting user is involved
            this.messages = this.messages.filter(msg => {
                const isConversationMessage = (msg.senderId === user1 && msg.recipientId === user2) ||
                                            (msg.senderId === user2 && msg.recipientId === user1);
                const isUserInvolved = msg.senderId === requestingUser || msg.recipientId === requestingUser;
                return !(isConversationMessage && isUserInvolved);
            });
        }
        
        const deletedCount = initialLength - this.messages.length;
        if (deletedCount > 0) {
            this.saveMessages();
        }
        return deletedCount;
    }
}

// Singleton instance
let messageStoreInstance: MessageStore | null = null;

export function getMessageStore(): MessageStore {
    if (!messageStoreInstance) {
        messageStoreInstance = new MessageStore();
    }
    return messageStoreInstance;
}
