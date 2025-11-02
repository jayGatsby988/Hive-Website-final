'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Upload,
  Search,
  MoreVertical,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Share2,
  Folder,
  Grid3x3,
  List,
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';

type FileType = 'document' | 'image' | 'other' | 'folder';

interface Resource {
  id: number;
  name: string;
  type: FileType;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  category: string;
}

export default function ResourcesPageClient() {
  const { selectedOrg } = useOrganization();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');

  const resources: Resource[] = [
    // This would be loaded from a resources service in a real implementation
    {
      id: 1,
      name: 'Organization Guidelines.pdf',
      type: 'document',
      size: '2.4 MB',
      uploadedBy: 'Admin',
      uploadDate: new Date().toLocaleDateString(),
      category: 'Documents',
    },
    {
      id: 2,
      name: 'Event Photos',
      type: 'folder',
      size: '0 items',
      uploadedBy: 'Admin',
      uploadDate: new Date().toLocaleDateString(),
      category: 'Photos',
    },
  ];

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'image':
        return Image;
      case 'folder':
        return Folder;
      default:
        return File;
    }
  };

  const getFileColor = (type: FileType) => {
    switch (type) {
      case 'document':
        return 'text-blue-600 bg-blue-100';
      case 'image':
        return 'text-green-600 bg-green-100';
      case 'folder':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(resources.map((r) => r.category)))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Files & Documents</h1>
          <p className="text-gray-600 mt-1">Manage your organization resources</p>
        </div>
        <motion.button
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg shadow-yellow-500/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload className="w-5 h-5" />
          Upload File
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource, index) => {
              const IconComponent = getFileIcon(resource.type);
              const colorClass = getFileColor(resource.type);

              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </motion.button>
                      <motion.button
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </motion.button>
                      <motion.button
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </motion.button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                    {resource.name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">{resource.size}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{resource.uploadedBy}</span>
                    <span>{resource.uploadDate}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResources.map((resource, index) => {
              const IconComponent = getFileIcon(resource.type);
              const colorClass = getFileColor(resource.type);

              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30 transition-all"
                >
                  <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {resource.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                      <span>{resource.size}</span>
                      <span>•</span>
                      <span>{resource.uploadedBy}</span>
                      <span>•</span>
                      <span>{resource.uploadDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </motion.button>
                    <motion.button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </motion.button>
                    <motion.button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No files found</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Files</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{resources.length}</p>
          <p className="text-sm text-gray-600 mt-1">All resources</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Documents</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resources.filter((r) => r.type === 'document').length}
          </p>
          <p className="text-sm text-gray-600 mt-1">PDF, DOC, XLS</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Images</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resources.filter((r) => r.type === 'image').length}
          </p>
          <p className="text-sm text-gray-600 mt-1">PNG, JPG, SVG</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Folders</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resources.filter((r) => r.type === 'folder').length}
          </p>
          <p className="text-sm text-gray-600 mt-1">Organized files</p>
        </div>
      </div>
    </div>
  );
}
