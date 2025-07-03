import React, { useState, useEffect } from 'react';
import { fetchRegistrationStatus, fetchSystemStatus } from '../api/index';
import config from '../config';

const DebugInfo: React.FC = () => {
    const [debugData, setDebugData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDebugInfo = async () => {
            const info: any = {
                environment: process.env.NODE_ENV,
                apiBaseUrl: config.API_BASE_URL,
                wsUrl: config.WS_URL,
                useHttps: config.USE_HTTPS,
                userAgent: navigator.userAgent,
                location: window.location.href,
                timestamp: new Date().toISOString()
            };

            // Test API endpoints
            try {
                console.log('🔍 Testing registration status endpoint...');
                info.registrationStatus = await fetchRegistrationStatus();
                info.registrationStatusSuccess = true;
            } catch (error: any) {
                console.error('❌ Registration status failed:', error);
                info.registrationStatusError = error.message;
                info.registrationStatusSuccess = false;
            }

            try {
                console.log('🔍 Testing system status endpoint...');
                info.systemStatus = await fetchSystemStatus();
                info.systemStatusSuccess = true;
            } catch (error: any) {
                console.error('❌ System status failed:', error);
                info.systemStatusError = error.message;
                info.systemStatusSuccess = false;
            }

            setDebugData(info);
            setLoading(false);
        };

        loadDebugInfo();
    }, []);

    if (loading) {
        return <div>Loading debug info...</div>;
    }

    return (
        <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            background: '#000', 
            color: '#0f0', 
            padding: '10px', 
            fontFamily: 'monospace', 
            fontSize: '12px', 
            borderRadius: '5px',
            maxWidth: '400px',
            maxHeight: '300px',
            overflow: 'auto',
            zIndex: 9999
        }}>
            <h4>🔧 Debug Information</h4>
            <pre>{JSON.stringify(debugData, null, 2)}</pre>
        </div>
    );
};

export default DebugInfo;
