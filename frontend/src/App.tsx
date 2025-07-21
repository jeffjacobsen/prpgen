import { useState, useEffect } from 'react';
import { useIPCEvents } from './hooks/useIPCEvents';
// Removed useNotifications - no longer needed without sessions
import { useResizable } from './hooks/useResizable';
import { Sidebar } from './components/Sidebar';
import { PRPManagement } from './components/PRPManagement';
import { TemplateManagement } from './components/TemplateManagement';
import Help from './components/Help';
import Welcome from './components/Welcome';
import { AboutDialog } from './components/AboutDialog';
import { MainProcessLogger } from './components/MainProcessLogger';
import { ErrorDialog } from './components/ErrorDialog';
import { useErrorStore } from './stores/errorStore';

type ViewMode = 'prps' | 'templates';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('templates');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showWelcomeManually, setShowWelcomeManually] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const { currentError, clearError } = useErrorStore();
  
  const { width: sidebarWidth, startResize } = useResizable({
    defaultWidth: 320,
    minWidth: 200,
    maxWidth: 600,
    storageKey: 'crystal-sidebar-width'
  });
  
  useIPCEvents();
  // useNotifications() - removed

  // Add keyboard shortcut to show Welcome screen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + W to show Welcome
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        setShowWelcomeManually(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      <MainProcessLogger />
      {/* Draggable title bar area */}
      <div 
        className="fixed top-0 left-0 right-0 h-8 z-50 flex items-center justify-end pr-4" 
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
      </div>
      <Sidebar 
        viewMode={viewMode} 
        onViewModeChange={setViewMode}
        width={sidebarWidth}
        onResizeStart={startResize}
        onShowWelcome={() => setShowWelcomeManually(true)}
        onShowAbout={() => setIsAboutOpen(true)}
      />
      
      <main className="flex-1 overflow-hidden">
        {showWelcomeManually ? (
          <Welcome onClose={() => setShowWelcomeManually(false)} />
        ) : viewMode === 'prps' ? (
          <PRPManagement />
        ) : viewMode === 'templates' ? (
          <TemplateManagement />
        ) : null}
      </main>

      {/* Dialogs */}
      {isHelpOpen && (
        <Help isOpen={true} onClose={() => setIsHelpOpen(false)} />
      )}
      {isAboutOpen && (
        <AboutDialog isOpen={true} onClose={() => setIsAboutOpen(false)} />
      )}
      <ErrorDialog 
        isOpen={!!currentError}
        error={currentError?.error || ''} 
        title={currentError?.title}
        details={currentError?.details}
        command={currentError?.command}
        onClose={clearError} 
      />
    </div>
  );
}

export default App;