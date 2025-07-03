import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/index';
import SessionManager from '../auth/session';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        const session = SessionManager.getInstance();

        try {
            console.log('Duke u përpjekur të hyj me:', { username, password: password.length + ' karaktere' });
            const response = await loginUser({ username, password });
            console.log('Përgjigja e hyrjes:', response);
            
            if (response.token) {
                session.storeToken(response.token);
                setSuccess(true);
                setError('');
                
                // Kalo tek biseda pas hyrjes së suksesshme
                setTimeout(() => {
                    navigate('/chat');
                }, 1500);
            } else {
                setError('Hyrja dështoi: Nuk u mor token nga serveri');
            }
        } catch (err: any) {
            console.error('Gabim në hyrje:', err);
            let errorMessage = 'Hyrja dështoi. Ju lutemi kontrolloni kredencialet tuaja.';
            
            if (err.response?.data?.error) {
                errorMessage = `Hyrja dështoi: ${err.response.data.error}`;
            } else if (err.message) {
                errorMessage = `Hyrja dështoi: ${err.message}`;
            }
            
            setError(errorMessage);
            setSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ 
                maxWidth: '400px', 
                width: '100%',
                margin: '20px',
                padding: '40px', 
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ 
                        fontSize: '40px', 
                        marginBottom: '10px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 'bold'
                    }}>🔐</div>
                    <h2 style={{ 
                        margin: '0',
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#333',
                        letterSpacing: '-0.5px'
                    }}>Hyrje e sigurt</h2>
                    <p style={{ 
                        margin: '8px 0 0',
                        fontSize: '14px',
                        color: '#666'
                    }}>Hyni në llogarinë tuaj të sigurt</p>
                </div>
                
                {error && (
                    <div style={{
                        padding: '12px 16px',
                        marginBottom: '20px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '12px',
                        color: '#c33',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>⚠️</span>
                        {error}
                    </div>
                )}
                
                {success && (
                    <div style={{
                        padding: '12px 16px',
                        marginBottom: '20px',
                        backgroundColor: '#efe',
                        border: '1px solid #cfc',
                        borderRadius: '12px',
                        color: '#373',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>✅</span>
                        Hyrja u krye me sukses! Duke kaluar tek biseda...
                    </div>
                )}
                
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label htmlFor="username" style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            fontWeight: '500',
                            fontSize: '14px',
                            color: '#374151'
                        }}>Emri i përdoruesit</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            style={{ 
                                width: '100%', 
                                padding: '16px', 
                                border: '2px solid #e5e7eb', 
                                borderRadius: '12px',
                                fontSize: '16px',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                                backgroundColor: isLoading ? '#f9fafb' : 'white'
                            }}
                            placeholder="Shkruani emrin tuaj të përdoruesit"
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            fontWeight: '500',
                            fontSize: '14px',
                            color: '#374151'
                        }}>Fjalëkalimi</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            style={{ 
                                width: '100%', 
                                padding: '16px', 
                                border: '2px solid #e5e7eb', 
                                borderRadius: '12px',
                                fontSize: '16px',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                                backgroundColor: isLoading ? '#f9fafb' : 'white'
                            }}
                            placeholder="Shkruani fjalëkalimin tuaj"
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            transform: isLoading ? 'none' : 'translateY(0)',
                            boxShadow: isLoading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseEnter={(e) => !isLoading && ((e.target as HTMLElement).style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => !isLoading && ((e.target as HTMLElement).style.transform = 'translateY(0)')}
                    >
                        {isLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid transparent',
                                    borderTop: '2px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                Duke u loguar...
                            </div>
                        ) : 'Hyni'}
                    </button>
                </form>
                
                <div style={{ 
                    marginTop: '30px', 
                    padding: '20px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#64748b'
                    }}>
                        <span>🔧</span>
                        Kredencialet për testim
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                        <div><strong>Emri i përdoruesit:</strong> testuser</div>
                        <div><strong>Fjalëkalimi:</strong> testpass123</div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                input:focus {
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
                }
            `}</style>
        </div>
    );
};

export default Login;