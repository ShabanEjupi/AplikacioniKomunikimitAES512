import React, { useState } from 'react';
import { loginUser } from '../api/index';
import SessionManager from '../auth/session';

interface User {
    username: string;
    password: string;
    displayName: string;
}

interface UserSwitcherProps {
    onUserChanged: () => void;
}

const UserSwitcher: React.FC<UserSwitcherProps> = ({ onUserChanged }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const sessionManager = SessionManager.getInstance();

    const demoUsers: User[] = [
        { username: 'alice', password: 'alice123', displayName: 'Alice' },
        { username: 'bob', password: 'bob123', displayName: 'Bob' },
        { username: 'charlie', password: 'charlie123', displayName: 'Charlie' },
        { username: 'testuser', password: 'testpass123', displayName: 'Test User' }
    ];

    const handleUserSwitch = async (user: User) => {
        setLoading(user.username);
        try {
            const response = await loginUser({
                username: user.username,
                password: user.password
            });
            
            sessionManager.storeToken(response.token);
            setIsVisible(false);
            onUserChanged();
        } catch (error) {
            console.error('Failed to switch user:', error);
            alert(`Failed to switch to ${user.displayName}`);
        } finally {
            setLoading(null);
        }
    };

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    background: '#00bfa5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 1000
                }}
                title="Switch User (Demo)"
            >
                👥
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'white',
            border: '1px solid #e4e6ea',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 1000,
            minWidth: '200px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
            }}>
                <h4 style={{ margin: 0, fontSize: '16px' }}>Quick User Switch</h4>
                <button
                    onClick={() => setIsVisible(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    ✕
                </button>
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                Click a user to instantly switch for demonstration purposes
            </div>

            {demoUsers.map((user) => (
                <button
                    key={user.username}
                    onClick={() => handleUserSwitch(user)}
                    disabled={loading === user.username}
                    style={{
                        width: '100%',
                        padding: '12px',
                        margin: '5px 0',
                        background: loading === user.username ? '#f5f5f5' : '#f8f9fa',
                        border: '1px solid #e4e6ea',
                        borderRadius: '8px',
                        cursor: loading === user.username ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <span>{user.displayName}</span>
                    {loading === user.username ? (
                        <span style={{ fontSize: '12px' }}>⏳</span>
                    ) : (
                        <span style={{ fontSize: '12px', color: '#666' }}>@{user.username}</span>
                    )}
                </button>
            ))}
            
            <div style={{ 
                fontSize: '10px', 
                color: '#999', 
                marginTop: '10px',
                textAlign: 'center' 
            }}>
                💡 Use multiple browser tabs to simulate different users chatting
            </div>
        </div>
    );
};

export default UserSwitcher;
