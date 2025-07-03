import React, { useState } from 'react';
import UserAuthentication from '../auth/authentication';
import { fetchRegistrationStatus, fetchSystemStatus, fetchUsers } from '../api/index';
import config from '../config';

interface DiagnosticResult {
    endpoint: string;
    status: 'success' | 'error' | 'testing';
    message: string;
    data?: any;
    error?: any;
}

const ApiDiagnostics: React.FC = () => {
    const [results, setResults] = useState<DiagnosticResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addResult = (result: DiagnosticResult) => {
        setResults(prev => [...prev, result]);
    };

    const runDiagnostics = async () => {
        setIsRunning(true);
        setResults([]);

        // Log environment info
        addResult({
            endpoint: 'Environment',
            status: 'success',
            message: `NODE_ENV: ${process.env.NODE_ENV}, Base URL: ${config.API_BASE_URL}`,
            data: {
                environment: process.env.NODE_ENV,
                config: config,
                currentUrl: window.location.href
            }
        });

        // Test endpoints
        const tests = [
            {
                name: 'Registration Status',
                test: () => fetchRegistrationStatus()
            },
            {
                name: 'System Status', 
                test: () => fetchSystemStatus()
            },
            {
                name: 'Users List',
                test: () => fetchUsers()
            }
        ];

        for (const { name, test } of tests) {
            try {
                addResult({
                    endpoint: name,
                    status: 'testing',
                    message: 'Testing...'
                });

                const data = await test();
                
                addResult({
                    endpoint: name,
                    status: 'success',
                    message: 'Success',
                    data: data
                });
            } catch (error: any) {
                addResult({
                    endpoint: name,
                    status: 'error',
                    message: error.message,
                    error: {
                        status: error.response?.status,
                        data: error.response?.data,
                        url: error.config?.url,
                        code: error.code
                    }
                });
            }
        }

        // Test UserAuthentication connectivity
        try {
            const auth = new UserAuthentication();
            await auth.testApiConnectivity();
            addResult({
                endpoint: 'UserAuth Connectivity',
                status: 'success',
                message: 'Check console for detailed logs'
            });
        } catch (error: any) {
            addResult({
                endpoint: 'UserAuth Connectivity',
                status: 'error',
                message: error.message,
                error: error
            });
        }

        setIsRunning(false);
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', margin: '20px' }}>
            <h3>🔍 API Diagnostics</h3>
            
            <button 
                onClick={runDiagnostics} 
                disabled={isRunning}
                style={{
                    padding: '10px 20px',
                    backgroundColor: isRunning ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
            >
                {isRunning ? 'Running Diagnostics...' : 'Run API Diagnostics'}
            </button>

            <div style={{ marginTop: '20px' }}>
                {results.map((result, index) => (
                    <div 
                        key={index}
                        style={{
                            padding: '10px',
                            margin: '5px 0',
                            borderLeft: `4px solid ${
                                result.status === 'success' ? '#28a745' : 
                                result.status === 'error' ? '#dc3545' : '#ffc107'
                            }`,
                            backgroundColor: 'white',
                            borderRadius: '4px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>
                            {result.status === 'success' ? '✅' : 
                             result.status === 'error' ? '❌' : '🔄'} {result.endpoint}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            {result.message}
                        </div>
                        {result.data && (
                            <details style={{ marginTop: '5px' }}>
                                <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                                    View Data
                                </summary>
                                <pre style={{ fontSize: '12px', backgroundColor: '#f8f9fa', padding: '10px', overflow: 'auto' }}>
                                    {JSON.stringify(result.data, null, 2)}
                                </pre>
                            </details>
                        )}
                        {result.error && (
                            <details style={{ marginTop: '5px' }}>
                                <summary style={{ cursor: 'pointer', color: '#dc3545' }}>
                                    View Error Details
                                </summary>
                                <pre style={{ fontSize: '12px', backgroundColor: '#f8d7da', padding: '10px', overflow: 'auto' }}>
                                    {JSON.stringify(result.error, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                <p><strong>Tip:</strong> Open browser dev tools (F12) → Console tab to see detailed logs</p>
                <p><strong>Current URL:</strong> {window.location.href}</p>
                <p><strong>Expected API Base:</strong> {config.API_BASE_URL}</p>
            </div>
        </div>
    );
};

export default ApiDiagnostics;
