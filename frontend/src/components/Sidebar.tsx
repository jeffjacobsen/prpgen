import { useState } from 'react';
import { Settings } from './Settings';
import crystalLogo from '../assets/crystal-logo.svg';
import { FileText, Book } from 'lucide-react';

type ViewMode = 'prps' | 'templates';

interface SidebarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  onShowWelcome: () => void;
  onShowAbout: () => void;
}

export function Sidebar({ 
  viewMode, 
  onViewModeChange, 
  width, 
  onResizeStart, 
  onShowWelcome,
  onShowAbout 
}: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div 
        data-testid="sidebar" 
        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-full flex flex-col pt-4 relative flex-shrink-0 border-r border-gray-200 dark:border-gray-700"
        style={{ width: `${width}px` }}
      >
        {/* Resize handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize group z-10"
          onMouseDown={onResizeStart}
        >
          <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 group-hover:bg-blue-500 transition-colors" />
          <div className="absolute -left-2 -right-2 top-0 bottom-0" />
          <div className="absolute top-1/2 -translate-y-1/2 right-0 transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex flex-col gap-1">
              <div className="w-1 h-1 bg-blue-400 rounded-full" />
              <div className="w-1 h-1 bg-blue-400 rounded-full" />
              <div className="w-1 h-1 bg-blue-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between overflow-hidden">
          <div className="flex items-center space-x-2 min-w-0">
            <img src={crystalLogo} alt="PRPGen" className="h-6 w-6 flex-shrink-0" />
            <h1 className="text-xl font-bold truncate">PRPGen</h1>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={onShowWelcome}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Welcome & Setup"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
            <button
              onClick={onShowAbout}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="About Crystal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              data-testid="settings-button"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col p-4">
          <nav className="space-y-2">
            <button
              onClick={() => onViewModeChange('templates')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === 'templates'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Book className="w-5 h-5" />
              <span>Templates</span>
            </button>
            
            <button
              onClick={() => onViewModeChange('prps')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === 'prps'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>PRPs</span>
            </button>
          </nav>

          {/* Info Section */}
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>PRPGen - PRP & Template Manager</p>
              <p className="text-gray-400 dark:text-gray-500">v{window.electron?.version || '0.0.0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      {isSettingsOpen && (
        <Settings isOpen={true} onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
}