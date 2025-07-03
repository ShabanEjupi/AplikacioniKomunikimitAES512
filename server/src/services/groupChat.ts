import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import config from '../config';

export interface GroupMember {
  userId: string;
  username: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  members: GroupMember[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPrivate: boolean;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'emoji';
  timestamp: Date;
  attachments?: {
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    thumbnailPath?: string;
  }[];
  reactions?: {
    emoji: string;
    userId: string;
    username: string;
  }[];
  replyTo?: string; // Reply to another message
  edited?: boolean;
  editedAt?: Date;
}

export class GroupChatService {
  private groups: Map<string, Group> = new Map();
  private groupMessages: Map<string, GroupMessage[]> = new Map();
  private groupsFilePath: string;
  private messagesFilePath: string;

  constructor() {
    const dataDir = config.dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.groupsFilePath = path.join(dataDir, 'groups.json');
    this.messagesFilePath = path.join(dataDir, 'group-messages.json');
    
    this.loadGroups();
    this.loadGroupMessages();
  }

  private loadGroups() {
    try {
      if (fs.existsSync(this.groupsFilePath)) {
        const data = fs.readFileSync(this.groupsFilePath, 'utf8');
        const groups = JSON.parse(data);
        this.groups = new Map(groups.map((group: Group) => [group.id, {
          ...group,
          createdAt: new Date(group.createdAt),
          updatedAt: new Date(group.updatedAt),
          members: group.members.map(member => ({
            ...member,
            joinedAt: new Date(member.joinedAt)
          }))
        }]));
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }

  private loadGroupMessages() {
    try {
      if (fs.existsSync(this.messagesFilePath)) {
        const data = fs.readFileSync(this.messagesFilePath, 'utf8');
        const messages = JSON.parse(data);
        this.groupMessages = new Map(Object.entries(messages).map(([groupId, msgs]) => [
          groupId,
          (msgs as any[]).map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined
          }))
        ]));
      }
    } catch (error) {
      console.error('Error loading group messages:', error);
    }
  }

  private saveGroups() {
    try {
      const groupsArray = Array.from(this.groups.values());
      fs.writeFileSync(this.groupsFilePath, JSON.stringify(groupsArray, null, 2));
    } catch (error) {
      console.error('Error saving groups:', error);
    }
  }

  private saveGroupMessages() {
    try {
      const messagesObject = Object.fromEntries(this.groupMessages.entries());
      fs.writeFileSync(this.messagesFilePath, JSON.stringify(messagesObject, null, 2));
    } catch (error) {
      console.error('Error saving group messages:', error);
    }
  }

  // Create a new group
  createGroup(name: string, description: string, createdBy: string, isPrivate: boolean = false): Group {
    const group: Group = {
      id: uuidv4(),
      name,
      description,
      members: [{
        userId: createdBy,
        username: createdBy, // This should be fetched from user service
        role: 'admin',
        joinedAt: new Date()
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      isPrivate
    };

    this.groups.set(group.id, group);
    this.groupMessages.set(group.id, []);
    this.saveGroups();
    
    return group;
  }

  // Get all groups for a user
  getUserGroups(userId: string): Group[] {
    return Array.from(this.groups.values()).filter(group => 
      group.members.some(member => member.userId === userId)
    );
  }

  // Get group by ID
  getGroup(groupId: string): Group | undefined {
    return this.groups.get(groupId);
  }

  // Add member to group
  addMember(groupId: string, userId: string, username: string, addedBy: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    // Check if user is already a member
    if (group.members.some(member => member.userId === userId)) {
      return false;
    }

    // Check if the person adding is an admin
    const adder = group.members.find(member => member.userId === addedBy);
    if (!adder || adder.role !== 'admin') {
      return false;
    }

    group.members.push({
      userId,
      username,
      role: 'member',
      joinedAt: new Date()
    });

    group.updatedAt = new Date();
    this.saveGroups();
    
    return true;
  }

  // Remove member from group
  removeMember(groupId: string, userId: string, removedBy: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    // Check if the person removing is an admin or removing themselves
    const remover = group.members.find(member => member.userId === removedBy);
    if (!remover || (remover.role !== 'admin' && removedBy !== userId)) {
      return false;
    }

    group.members = group.members.filter(member => member.userId !== userId);
    group.updatedAt = new Date();
    this.saveGroups();
    
    return true;
  }

  // Send message to group
  sendGroupMessage(groupId: string, senderId: string, content: string, messageType: GroupMessage['messageType'] = 'text', attachments?: GroupMessage['attachments'], replyTo?: string): GroupMessage | null {
    const group = this.groups.get(groupId);
    if (!group) return null;

    // Check if user is a member
    if (!group.members.some(member => member.userId === senderId)) {
      return null;
    }

    const message: GroupMessage = {
      id: uuidv4(),
      groupId,
      senderId,
      content,
      messageType,
      timestamp: new Date(),
      attachments,
      reactions: [],
      replyTo,
      edited: false
    };

    const messages = this.groupMessages.get(groupId) || [];
    messages.push(message);
    this.groupMessages.set(groupId, messages);
    this.saveGroupMessages();

    return message;
  }

  // Get group messages
  getGroupMessages(groupId: string, limit: number = 50, offset: number = 0): GroupMessage[] {
    const messages = this.groupMessages.get(groupId) || [];
    return messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit)
      .reverse();
  }

  // Add reaction to message
  addReaction(groupId: string, messageId: string, emoji: string, userId: string, username: string): boolean {
    const messages = this.groupMessages.get(groupId);
    if (!messages) return false;

    const message = messages.find(msg => msg.id === messageId);
    if (!message) return false;

    // Remove existing reaction from this user
    message.reactions = message.reactions?.filter(r => r.userId !== userId) || [];
    
    // Add new reaction
    message.reactions.push({ emoji, userId, username });
    
    this.saveGroupMessages();
    return true;
  }

  // Remove reaction from message
  removeReaction(groupId: string, messageId: string, userId: string): boolean {
    const messages = this.groupMessages.get(groupId);
    if (!messages) return false;

    const message = messages.find(msg => msg.id === messageId);
    if (!message) return false;

    message.reactions = message.reactions?.filter(r => r.userId !== userId) || [];
    
    this.saveGroupMessages();
    return true;
  }

  // Edit message
  editMessage(groupId: string, messageId: string, newContent: string, userId: string): boolean {
    const messages = this.groupMessages.get(groupId);
    if (!messages) return false;

    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.senderId !== userId) return false;

    message.content = newContent;
    message.edited = true;
    message.editedAt = new Date();
    
    this.saveGroupMessages();
    return true;
  }

  // Delete message
  deleteMessage(groupId: string, messageId: string, userId: string): boolean {
    const messages = this.groupMessages.get(groupId);
    if (!messages) return false;

    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return false;

    const message = messages[messageIndex];
    const group = this.groups.get(groupId);
    
    // Check if user is sender or admin
    const userMember = group?.members.find(member => member.userId === userId);
    if (message.senderId !== userId && userMember?.role !== 'admin') {
      return false;
    }

    messages.splice(messageIndex, 1);
    this.saveGroupMessages();
    return true;
  }

  // Update group info
  updateGroup(groupId: string, updates: Partial<Pick<Group, 'name' | 'description' | 'avatar'>>, updatedBy: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const updater = group.members.find(member => member.userId === updatedBy);
    if (!updater || updater.role !== 'admin') {
      return false;
    }

    Object.assign(group, updates);
    group.updatedAt = new Date();
    this.saveGroups();
    
    return true;
  }

  // Delete group
  deleteGroup(groupId: string, deletedBy: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    // Only creator can delete group
    if (group.createdBy !== deletedBy) {
      return false;
    }

    this.groups.delete(groupId);
    this.groupMessages.delete(groupId);
    this.saveGroups();
    this.saveGroupMessages();
    
    return true;
  }
}

// Singleton instance
let groupChatServiceInstance: GroupChatService | null = null;

export function getGroupChatService(): GroupChatService {
  if (!groupChatServiceInstance) {
    groupChatServiceInstance = new GroupChatService();
  }
  return groupChatServiceInstance;
}
