import { useEffect, useState } from 'react';
import { API } from '../utils/api';
import { TemplateEditor } from './TemplateEditor';
import { useErrorStore } from '../stores/errorStore';
import { 
  FileText, 
  Plus, 
  Search,
  Eye,
  Edit,
  Trash2,
  FileUp
} from 'lucide-react';

interface Template {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  word_count?: number;
  created_at: string;
  updated_at: string;
  url?: string;
  file_path?: string;
}

type SortBy = 'updated' | 'created' | 'title' | 'category';

export function TemplateManagement() {
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'view' | 'edit' | 'create'>('view');
  const { showError } = useErrorStore();

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Filter and sort templates when dependencies change
  useEffect(() => {
    filterAndSortTemplates();
  }, [allTemplates, searchQuery, sortBy]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const response = await API.templates.getAll();
      if (response.success && response.data) {
        setAllTemplates(response.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setAllTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTemplates = () => {
    let filtered = [...allTemplates];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  const handleCreate = () => {
    setSelectedTemplate({
      id: 0,
      title: '',
      content: '',
      category: 'general',
      tags: [],
      word_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setEditorMode('create');
    setIsEditorOpen(true);
  };

  const handleView = (template: Template) => {
    setSelectedTemplate(template);
    setEditorMode('view');
    setIsEditorOpen(true);
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setEditorMode('edit');
    setIsEditorOpen(true);
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Are you sure you want to delete "${template.title}"?`)) {
      return;
    }

    try {
      const response = await API.templates.delete(template.id);
      
      if (response.success) {
        setAllTemplates(prev => prev.filter(t => t.id !== template.id));
      } else {
        throw new Error(response.error || 'Failed to delete template');
      }
    } catch (error: any) {
      showError({
        title: 'Delete Failed',
        error: error.message
      });
    }
  };

  const handleTemplateSaved = (savedTemplate: Template) => {
    setAllTemplates(prev => {
      const existing = prev.find(t => t.id === savedTemplate.id);
      if (existing) {
        return prev.map(t => t.id === savedTemplate.id ? savedTemplate : t);
      } else {
        return [...prev, savedTemplate];
      }
    });
    setIsEditorOpen(false);
  };


  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      setSelectedTemplate({
        id: 0,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        content: content,
        category: 'imported',
        tags: ['imported', 'file'],
        word_count: content.split(/\s+/).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        file_path: file.name
      });
      setEditorMode('create');
      setIsEditorOpen(true);
    } catch (error: any) {
      showError({
        title: 'Import Failed',
        error: 'Failed to read file content'
      });
    }

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getWordCount = (template: Template) => {
    return template.word_count || (template.content ? template.content.split(/\s+/).length : 0);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Templates
          </h1>
          <div className="flex items-center gap-2">
            <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              <FileUp className="w-4 h-4" />
              <span>Import File</span>
              <input
                type="file"
                onChange={handleFileImport}
                className="hidden"
                accept=".txt,.md,.markdown"
              />
            </label>
            <button
              onClick={handleCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Template</span>
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Templates are reusable content pieces that can be used across your projects. Import from files or create your own.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      {allTemplates.length > 0 && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="title">Title</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-600 dark:text-gray-400">Loading templates...</div>
          </div>
        ) : allTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Templates Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
              Create or import templates to build your knowledge base
            </p>
            <button
              onClick={handleCreate}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Template</span>
            </button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400 p-6">
            <FileText className="w-12 h-12 mb-2" />
            <p>No templates found</p>
            {searchQuery && (
              <p className="text-sm">Try adjusting your search</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {template.title}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        {template.category}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {template.content.substring(0, 200)}...
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{getWordCount(template)} words</span>
                      <span>Updated {formatDate(template.updated_at)}</span>
                      {template.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span>+{template.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleView(template)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Editor */}
      {isEditorOpen && selectedTemplate && (
        <TemplateEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          template={selectedTemplate}
          mode={editorMode}
          onSave={handleTemplateSaved}
        />
      )}

    </div>
  );
}