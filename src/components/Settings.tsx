import React, { useState, useEffect } from 'react';
import { getCurrentUser, logout } from '../api/index';

interface SettingsProps {
  onClose: () => void;
}

interface UserSettings {
  notifications: {
    sound: boolean;
    desktop: boolean;
    vibration: boolean;
  };
  privacy: {
    readReceipts: boolean;
    lastSeen: boolean;
    profilePhoto: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    autoLock: boolean;
    autoLockTime: number; // minutes
    encryptionLevel: 'standard' | 'enhanced';
  };
  chat: {
    enterToSend: boolean;
    fontSize: 'small' | 'medium' | 'large';
    theme: 'light' | 'dark' | 'auto';
    messagePreview: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    includeMedia: boolean;
    cloudBackup: boolean;
  };
  storage: {
    autoDownload: {
      photos: boolean;
      videos: boolean;
      documents: boolean;
    };
    cacheSize: number; // MB
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    sound: true,
    desktop: true,
    vibration: true,
  },
  privacy: {
    readReceipts: true,
    lastSeen: true,
    profilePhoto: true,
  },
  security: {
    twoFactorAuth: false,
    autoLock: false,
    autoLockTime: 5,
    encryptionLevel: 'enhanced',
  },
  chat: {
    enterToSend: true,
    fontSize: 'medium',
    theme: 'light',
    messagePreview: true,
  },
  backup: {
    autoBackup: false,
    backupFrequency: 'weekly',
    includeMedia: true,
    cloudBackup: false,
  },
  storage: {
    autoDownload: {
      photos: true,
      videos: false,
      documents: true,
    },
    cacheSize: 100,
  },
};

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'security' | 'chat' | 'backup' | 'storage'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem(`settings_${currentUser?.userId}`);
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, [currentUser?.userId]);

  const saveSettings = () => {
    setIsLoading(true);
    try {
      localStorage.setItem(`settings_${currentUser?.userId}`, JSON.stringify(settings));
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      settings,
      messages: JSON.parse(localStorage.getItem('messages') || '[]'),
      conversations: JSON.parse(localStorage.getItem('conversations') || '[]'),
      exportDate: new Date().toISOString(),
      user: currentUser?.username
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto512_backup_${currentUser?.username}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: 'Data exported successfully!' });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.settings) {
          setSettings({ ...defaultSettings, ...data.settings });
        }
        if (data.messages) {
          localStorage.setItem('messages', JSON.stringify(data.messages));
        }
        if (data.conversations) {
          localStorage.setItem('conversations', JSON.stringify(data.conversations));
        }
        setMessage({ type: 'success', text: 'Data imported successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to import data. Invalid file format.' });
      }
    };
    reader.readAsText(file);
  };

  const clearCache = () => {
    // Clear various cache items
    localStorage.removeItem('messageCache');
    localStorage.removeItem('fileCache');
    sessionStorage.clear();
    setMessage({ type: 'success', text: 'Cache cleared successfully!' });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setMessage({ type: 'success', text: 'Settings reset to defaults!' });
  };

  const updateSettings = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateNestedSettings = (section: keyof UserSettings, subsection: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [key]: value
        }
      }
    }));
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button onClick={onClose} className="close-btn">❌</button>
        </div>

        {message && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
            <button onClick={() => setMessage(null)}>✕</button>
          </div>
        )}

        <div className="settings-content">
          <div className="settings-tabs">
            <button 
              className={activeTab === 'general' ? 'active' : ''} 
              onClick={() => setActiveTab('general')}
            >
              📱 General
            </button>
            <button 
              className={activeTab === 'privacy' ? 'active' : ''} 
              onClick={() => setActiveTab('privacy')}
            >
              🔒 Privacy
            </button>
            <button 
              className={activeTab === 'security' ? 'active' : ''} 
              onClick={() => setActiveTab('security')}
            >
              🛡️ Security
            </button>
            <button 
              className={activeTab === 'chat' ? 'active' : ''} 
              onClick={() => setActiveTab('chat')}
            >
              💬 Chat
            </button>
            <button 
              className={activeTab === 'backup' ? 'active' : ''} 
              onClick={() => setActiveTab('backup')}
            >
              💾 Backup
            </button>
            <button 
              className={activeTab === 'storage' ? 'active' : ''} 
              onClick={() => setActiveTab('storage')}
            >
              📦 Storage
            </button>
          </div>

          <div className="settings-panel">
            {activeTab === 'general' && (
              <div className="settings-section">
                <h3>📢 Notifications</h3>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.notifications.sound}
                      onChange={(e) => updateNestedSettings('notifications', 'sound', '', e.target.checked)}
                    />
                    Sound notifications
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.notifications.desktop}
                      onChange={(e) => updateNestedSettings('notifications', 'desktop', '', e.target.checked)}
                    />
                    Desktop notifications
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.notifications.vibration}
                      onChange={(e) => updateNestedSettings('notifications', 'vibration', '', e.target.checked)}
                    />
                    Vibration (mobile)
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h3>👁️ Privacy Settings</h3>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.privacy.readReceipts}
                      onChange={(e) => updateNestedSettings('privacy', 'readReceipts', '', e.target.checked)}
                    />
                    Send read receipts
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.privacy.lastSeen}
                      onChange={(e) => updateNestedSettings('privacy', 'lastSeen', '', e.target.checked)}
                    />
                    Show last seen
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.privacy.profilePhoto}
                      onChange={(e) => updateNestedSettings('privacy', 'profilePhoto', '', e.target.checked)}
                    />
                    Show profile photo
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section">
                <h3>🔐 Security</h3>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.security.twoFactorAuth}
                      onChange={(e) => updateNestedSettings('security', 'twoFactorAuth', '', e.target.checked)}
                    />
                    Two-factor authentication
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.security.autoLock}
                      onChange={(e) => updateNestedSettings('security', 'autoLock', '', e.target.checked)}
                    />
                    Auto-lock app
                  </label>
                </div>
                {settings.security.autoLock && (
                  <div className="setting-item">
                    <label>
                      Auto-lock after:
                      <select
                        value={settings.security.autoLockTime}
                        onChange={(e) => updateNestedSettings('security', 'autoLockTime', '', Number(e.target.value))}
                      >
                        <option value={1}>1 minute</option>
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                      </select>
                    </label>
                  </div>
                )}
                <div className="setting-item">
                  <label>
                    Encryption level:
                    <select
                      value={settings.security.encryptionLevel}
                      onChange={(e) => updateNestedSettings('security', 'encryptionLevel', '', e.target.value)}
                    >
                      <option value="standard">Standard (AES-256)</option>
                      <option value="enhanced">Enhanced (AES-512)</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="settings-section">
                <h3>💬 Chat Settings</h3>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.chat.enterToSend}
                      onChange={(e) => updateNestedSettings('chat', 'enterToSend', '', e.target.checked)}
                    />
                    Press Enter to send
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    Font size:
                    <select
                      value={settings.chat.fontSize}
                      onChange={(e) => updateNestedSettings('chat', 'fontSize', '', e.target.value)}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    Theme:
                    <select
                      value={settings.chat.theme}
                      onChange={(e) => updateNestedSettings('chat', 'theme', '', e.target.value)}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.chat.messagePreview}
                      onChange={(e) => updateNestedSettings('chat', 'messagePreview', '', e.target.checked)}
                    />
                    Show message preview in notifications
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="settings-section">
                <h3>💾 Backup & Restore</h3>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.backup.autoBackup}
                      onChange={(e) => updateNestedSettings('backup', 'autoBackup', '', e.target.checked)}
                    />
                    Automatic backup
                  </label>
                </div>
                {settings.backup.autoBackup && (
                  <div className="setting-item">
                    <label>
                      Backup frequency:
                      <select
                        value={settings.backup.backupFrequency}
                        onChange={(e) => updateNestedSettings('backup', 'backupFrequency', '', e.target.value)}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </label>
                  </div>
                )}
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.backup.includeMedia}
                      onChange={(e) => updateNestedSettings('backup', 'includeMedia', '', e.target.checked)}
                    />
                    Include media files in backup
                  </label>
                </div>

                <div className="backup-actions">
                  <button onClick={exportData} className="export-btn">
                    📤 Export Data
                  </button>
                  <label className="import-btn">
                    📥 Import Data
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="settings-section">
                <h3>📦 Storage Management</h3>
                <div className="setting-item">
                  <h4>Auto-download</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.storage.autoDownload.photos}
                      onChange={(e) => updateNestedSettings('storage', 'autoDownload', 'photos', e.target.checked)}
                    />
                    Photos
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.storage.autoDownload.videos}
                      onChange={(e) => updateNestedSettings('storage', 'autoDownload', 'videos', e.target.checked)}
                    />
                    Videos
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.storage.autoDownload.documents}
                      onChange={(e) => updateNestedSettings('storage', 'autoDownload', 'documents', e.target.checked)}
                    />
                    Documents
                  </label>
                </div>

                <div className="setting-item">
                  <label>
                    Cache size limit: {settings.storage.cacheSize} MB
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="50"
                      value={settings.storage.cacheSize}
                      onChange={(e) => updateNestedSettings('storage', 'cacheSize', '', Number(e.target.value))}
                    />
                  </label>
                </div>

                <div className="storage-actions">
                  <button onClick={clearCache} className="clear-cache-btn">
                    🗑️ Clear Cache
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button onClick={resetSettings} className="reset-btn">
            🔄 Reset to Defaults
          </button>
          <div className="footer-actions">
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button onClick={saveSettings} disabled={isLoading} className="save-btn">
              {isLoading ? '⏳ Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>

        <style>{`
          .settings-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .settings-modal {
            background: white;
            border-radius: 10px;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          }

          .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
          }

          .settings-header h2 {
            margin: 0;
            color: #333;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 5px;
          }

          .settings-message {
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .settings-message.success {
            background: #d4edda;
            color: #155724;
            border-bottom: 1px solid #c3e6cb;
          }

          .settings-message.error {
            background: #f8d7da;
            color: #721c24;
            border-bottom: 1px solid #f5c6cb;
          }

          .settings-content {
            flex: 1;
            display: flex;
            overflow: hidden;
          }

          .settings-tabs {
            width: 200px;
            background: #f8f9fa;
            border-right: 1px solid #e0e0e0;
            display: flex;
            flex-direction: column;
          }

          .settings-tabs button {
            background: none;
            border: none;
            padding: 15px 20px;
            text-align: left;
            cursor: pointer;
            border-bottom: 1px solid #e0e0e0;
            transition: background-color 0.2s;
          }

          .settings-tabs button:hover {
            background: #e9ecef;
          }

          .settings-tabs button.active {
            background: #007bff;
            color: white;
          }

          .settings-panel {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
          }

          .settings-section h3 {
            margin-top: 0;
            margin-bottom: 20px;
            color: #333;
          }

          .setting-item {
            margin-bottom: 15px;
          }

          .setting-item label {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
          }

          .setting-item input[type="checkbox"] {
            width: 18px;
            height: 18px;
          }

          .setting-item select {
            padding: 5px 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-left: 10px;
          }

          .setting-item input[type="range"] {
            flex: 1;
            margin-left: 10px;
          }

          .backup-actions, .storage-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
          }

          .export-btn, .import-btn, .clear-cache-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .export-btn:hover, .import-btn:hover, .clear-cache-btn:hover {
            background: #218838;
          }

          .clear-cache-btn {
            background: #dc3545;
          }

          .clear-cache-btn:hover {
            background: #c82333;
          }

          .settings-footer {
            padding: 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .reset-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
          }

          .footer-actions {
            display: flex;
            gap: 10px;
          }

          .cancel-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
          }

          .save-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
          }

          .save-btn:hover:not(:disabled) {
            background: #0056b3;
          }

          .save-btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
          }

          @media (max-width: 768px) {
            .settings-overlay {
              padding: 10px;
            }

            .settings-content {
              flex-direction: column;
            }

            .settings-tabs {
              width: 100%;
              flex-direction: row;
              overflow-x: auto;
            }

            .settings-tabs button {
              white-space: nowrap;
              min-width: 120px;
            }

            .settings-footer {
              flex-direction: column;
              gap: 10px;
            }

            .footer-actions {
              width: 100%;
              justify-content: space-between;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Settings;
