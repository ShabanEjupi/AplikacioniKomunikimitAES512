import React from 'react';

interface AlertProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

const Alert: React.FC<AlertProps> = ({ message, type }) => {
    const getAlertStyles = () => {
        const baseStyles = {
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '4px',
            border: '1px solid',
            fontSize: '14px',
            fontWeight: '500'
        };

        switch (type) {
            case 'success':
                return {
                    ...baseStyles,
                    backgroundColor: '#d4edda',
                    borderColor: '#c3e6cb',
                    color: '#155724'
                };
            case 'error':
                return {
                    ...baseStyles,
                    backgroundColor: '#f8d7da',
                    borderColor: '#f5c6cb',
                    color: '#721c24'
                };
            case 'warning':
                return {
                    ...baseStyles,
                    backgroundColor: '#fff3cd',
                    borderColor: '#ffeaa7',
                    color: '#856404'
                };
            case 'info':
                return {
                    ...baseStyles,
                    backgroundColor: '#d1ecf1',
                    borderColor: '#bee5eb',
                    color: '#0c5460'
                };
            default:
                return baseStyles;
        }
    };

    return (
        <div style={getAlertStyles()} role="alert">
            {message}
        </div>
    );
};

export default Alert;