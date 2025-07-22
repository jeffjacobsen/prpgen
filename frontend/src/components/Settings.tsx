import { useState, useEffect } from 'react';
// Removed NotificationSettings - no longer needed
// Removed useNotifications - no longer needed
import { API, currentBackend } from '../utils/api';
import type { AppConfig } from '../types/config';
// Removed unused imports

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [_config, setConfig] = useState<AppConfig | null>(null);
  const [claudeExecutablePath, setClaudeExecutablePath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claudeTestResult, setClaudeTestResult] = useState<{
    available: boolean;
    version?: string;
    path?: string;
    error?: string;
  } | null>(null);
  const [isTestingClaude, setIsTestingClaude] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const response = await API.config.get();
      if (!response.success) throw new Error(response.error || 'Failed to fetch config');
      const data = response.data as AppConfig;
      setConfig(data);
      setClaudeExecutablePath(data.claudeExecutablePath || '');
    } catch (err) {
      setError('Failed to load configuration');
    }
  };

  const testClaude = async (customPath?: string) => {
    setIsTestingClaude(true);
    setClaudeTestResult(null);
    
    try {
      const response = await API.config.testClaude(customPath);
      if (response.success && response.data) {
        // Parse the test result string
        if (typeof response.data === 'string') {
          const testData = JSON.parse(response.data) as {
            available: boolean;
            version?: string;
            path?: string;
            error?: string;
          };
          setClaudeTestResult(testData);
        } else {
          setClaudeTestResult(response.data as any);
        }
      } else {
        setClaudeTestResult({
          available: false,
          error: response.error || 'Failed to test Claude'
        });
      }
    } catch (err) {
      setClaudeTestResult({
        available: false,
        error: err instanceof Error ? err.message : 'Failed to test Claude'
      });
    } finally {
      setIsTestingClaude(false);
    }
  };

  const seedTemplates = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    
    try {
      const result = await API.templates.seedDefaultTemplates();
      if (result.success && result.data) {
        setSeedResult(result.data);
      } else {
        setSeedResult(result.error || 'Failed to seed templates');
      }
    } catch (err) {
      setSeedResult(err instanceof Error ? err.message : 'Failed to seed templates');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await API.config.update({ 
        claude_executable_path: claudeExecutablePath,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update configuration');
      }

      // Refresh config from server
      await fetchConfig();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="settings-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="claudeExecutablePath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Claude Executable Path (Optional)
            </label>
            <div className="flex gap-2">
              <input
                id="claudeExecutablePath"
                type="text"
                value={claudeExecutablePath}
                onChange={(e) => setClaudeExecutablePath(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="/usr/local/bin/claude"
              />
              <button
                type="button"
                onClick={async () => {
                  const result = await API.dialog.openFile({
                    title: 'Select Claude Executable',
                    buttonLabel: 'Select',
                    properties: ['openFile'],
                    filters: [
                      { name: 'Executables', extensions: ['*'] }
                    ]
                  });
                  if (result.success && result.data) {
                    setClaudeExecutablePath(result.data);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Browse
              </button>
              <button
                type="button"
                onClick={() => testClaude(claudeExecutablePath.trim() || undefined)}
                disabled={isTestingClaude}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isTestingClaude ? 'Testing...' : 'Test'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Full path to the claude executable. Leave empty to use the claude command from PATH. This is useful if Claude is installed in a non-standard location.
            </p>
            {claudeTestResult && (
              <div className={`mt-2 p-3 rounded-md text-sm ${
                claudeTestResult.available 
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
              }`}>
                {claudeTestResult.available ? (
                  <div className="text-green-800 dark:text-green-200">
                    <div className="font-medium mb-1">✓ Claude Code is available</div>
                    {claudeTestResult.version && (
                      <div className="text-xs">Version: {claudeTestResult.version}</div>
                    )}
                    {claudeTestResult.path && (
                      <div className="text-xs">Path: {claudeTestResult.path}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-800 dark:text-red-200">
                    <div className="font-medium mb-1">✗ Claude Code not found</div>
                    {claudeTestResult.error && (
                      <div className="text-xs">{claudeTestResult.error}</div>
                    )}
                    <div className="text-xs mt-1">
                      Please ensure Claude Code is installed and accessible from the command line.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Template Seeding (Tauri only) */}
          {currentBackend === 'tauri' && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                Template Management
              </h3>
              <div>
                <button
                  type="button"
                  onClick={seedTemplates}
                  disabled={isSeeding}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSeeding ? 'Seeding...' : 'Seed Default Templates'}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Populate the database with default PRP templates. This is safe to run multiple times.
                </p>
                {seedResult && (
                  <div className={`mt-2 p-3 rounded-md text-sm ${
                    seedResult.includes('Successfully') 
                      ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                      : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className={seedResult.includes('Successfully') ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}>
                      {seedResult}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="settings-form"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
        </div>
      </div>
    </div>
  );
}