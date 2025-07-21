import { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { API } from '../utils/api';
import { useErrorStore } from '../stores/errorStore';
import { 
  Save, 
  Eye, 
  FileText, 
  Edit3, 
  X, 
  Download,
  Copy,
  Tag
} from 'lucide-react';

interface Template {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  word_count?: number;
  url?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

interface TemplateEditorProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (template: Template) => void;
  mode?: 'view' | 'edit' | 'create';
}

type ViewMode = 'editor' | 'preview' | 'split';

export function TemplateEditor({ 
  template, 
  isOpen, 
  onClose, 
  onSave, 
  mode = 'edit' 
}: TemplateEditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(mode === 'edit' || mode === 'create');
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const { showError } = useErrorStore();
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && template) {
      setContent(template.content || '');
      setTitle(template.title || '');
      setCategory(template.category || 'general');
      setTags(template.tags || []);
      setIsDirty(false);
      setIsEditMode(mode === 'edit' || mode === 'create');
    } else if (isOpen && mode === 'create') {
      // For create mode with initial content
      if (template?.content) {
        setContent(template.content);
        setTitle(template.title || '');
        setCategory(template.category || 'general');
        setTags(template.tags || []);
        setIsDirty(true);
      } else {
        setContent('');
        setTitle('');
        setCategory('general');
        setTags([]);
        setIsDirty(false);
      }
      setIsEditMode(true);
    }
  }, [isOpen, template, mode]);

  useEffect(() => {
    // Update word and line counts
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    setWordCount(words);
    setLineCount(lines);
  }, [content]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Monaco for Markdown
    monaco.languages.setMonarchTokensProvider('markdown', {
      tokenizer: {
        root: [
          [/^#+.*$/, 'markup.heading'],
          [/^\s*-\s+\[[\sx]\].*$/, 'markup.list.checklist'],
          [/^\s*[-*+]\s+.*$/, 'markup.list'],
          [/```[^`]*```/, 'markup.code.block'],
          [/`[^`]+`/, 'markup.code.inline'],
          [/\*\*[^*]+\*\*/, 'markup.bold'],
          [/\*[^*]+\*/, 'markup.italic'],
          [/\[([^\]]+)\]\(([^)]+)\)/, 'markup.link'],
        ]
      }
    });

    // Add custom commands
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      setViewMode(viewMode === 'preview' ? 'split' : 'preview');
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError({
        title: 'Missing Title',
        error: 'Please provide a title for the template'
      });
      return;
    }

    if (!content.trim()) {
      showError({
        title: 'Missing Content',
        error: 'Please provide content for the template'
      });
      return;
    }

    setIsSaving(true);
    try {
      let response;
      
      if (template && template.id && mode !== 'create') {
        // Update existing template
        response = await API.templates.update(template.id, {
          title,
          content,
          category,
          tags
        });
      } else {
        // Create new template
        response = await API.templates.create({
          title,
          content,
          category,
          tags,
          url: template?.url,
          file_path: template?.file_path
        });
      }
      
      if (response.success) {
        setIsDirty(false);
        if (onSave && response.data) {
          onSave(response.data);
        }
        if (mode === 'create') {
          onClose();
        }
      } else {
        throw new Error(response.error || 'Failed to save template');
      }
    } catch (error: any) {
      showError({
        title: 'Save Failed',
        error: error.message || 'Failed to save template'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    if (!isDirty) {
      setIsDirty(true);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setIsDirty(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    setIsDirty(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // Could show a toast notification here
    } catch (error) {
      showError({
        title: 'Copy Failed',
        error: 'Failed to copy content to clipboard'
      });
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderPreview = () => {
    // Using a simple markdown renderer for preview
    const htmlContent = content
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/^\s*- \[ \] (.*$)/gm, '<div class="checkbox unchecked">☐ $1</div>')
      .replace(/^\s*- \[x\] (.*$)/gm, '<div class="checkbox checked">☑ $1</div>')
      .replace(/^\s*- (.*$)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');

    return (
      <div 
        className="prose prose-sm max-w-none dark:prose-invert p-4 overflow-auto h-full"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-[90vh] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Template Title"
                    className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"
                  />
                ) : (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title || 'Untitled Template'}
                  </h2>
                )}
                {isDirty && <span className="text-orange-500 text-sm">●</span>}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
                <span>{wordCount} words</span>
                <span>{lineCount} lines</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                  {category}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View mode toggles */}
            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-md">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1 text-sm rounded-l-md transition-colors ${
                  viewMode === 'editor' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 text-sm border-x border-gray-200 dark:border-gray-600 transition-colors ${
                  viewMode === 'split' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-4 h-4 flex">
                  <div className="w-2 h-4 border border-current"></div>
                  <div className="w-2 h-4 border border-current border-l-0"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-sm rounded-r-md transition-colors ${
                  viewMode === 'preview' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={downloadAsFile}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Download as file"
            >
              <Download className="w-4 h-4" />
            </button>

            {isEditMode && (
              <button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category and Tags (for edit mode) */}
        {isEditMode && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-center gap-4">
              {/* Category selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Category:</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setIsDirty(true);
                  }}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="general">General</option>
                  <option value="react">React</option>
                  <option value="backend">Backend</option>
                  <option value="database">Database</option>
                  <option value="testing">Testing</option>
                  <option value="devops">DevOps</option>
                  <option value="imported">Imported</option>
                </select>
              </div>

              {/* Tags */}
              <div className="flex-1 flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Tags:</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add tag..."
                      className="px-2 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 w-24"
                    />
                    <button
                      onClick={handleAddTag}
                      className="ml-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <Tag className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Editor */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-r border-gray-200 dark:border-gray-700 h-full`}>
              <Editor
                height="100%"
                language="markdown"
                value={content}
                onChange={handleContentChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  fontSize: 14,
                  tabSize: 2,
                  insertSpaces: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  readOnly: !isEditMode,
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto'
                  }
                }}
              />
            </div>
          )}

          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} bg-white dark:bg-gray-900 h-full`}>
              <div className="h-full overflow-auto">
                {renderPreview()}
              </div>
            </div>
          )}
        </div>

        {/* Source info (if imported) */}
        {(template?.url || template?.file_path) && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Source: {template.url ? (
                <a href={template.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  {template.url}
                </a>
              ) : (
                <span>{template.file_path}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}