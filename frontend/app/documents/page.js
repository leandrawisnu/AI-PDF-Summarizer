'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  FileCheck,
  Clock,
  Calendar,
  SortAsc,
  Grid3X3,
  List,
  Plus
} from 'lucide-react';
import { pdfApi, formatFileSize, formatDate } from '../../lib/api';
import { useFileUpload } from '../../hooks/useApi';
import SummaryModal from '../../components/SummaryModal';

export default function DocumentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 12,
    totalPages: 0,
    totalItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const { upload, uploading, progress } = useFileUpload();

  const fetchDocuments = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await pdfApi.getPDFs({
        page: params.page || pagination.page,
        itemsPerPage: params.itemsPerPage || pagination.itemsPerPage,
        sortBy: params.sortBy || sortBy,
        order: params.order || order,
        search: params.search || searchQuery
      });

      const formattedDocs = response.data?.map(doc => ({
        id: doc.id,
        name: doc.title || doc.filename,
        size: formatFileSize(doc.file_size),
        pages: doc.page_count,
        uploadedAt: doc.created_at,
        summaries: doc.summaries?.length || 0,
        thumbnail: null
      })) || [];

      setDocuments(formattedDocs);
      setPagination({
        page: response.page || 1,
        itemsPerPage: response.itemsPerPage || 12,
        totalPages: response.totalPages || 0,
        totalItems: response.totalItems || 0
      });
    } catch (err) {
      setError(err.message);
      console.error('Documents fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [sortBy, order]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDocuments({ page: 1, search: searchQuery });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await pdfApi.deletePDF(id);
      fetchDocuments(); // Refresh the list
    } catch (err) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      await upload(file);
      fetchDocuments(); // Refresh the list
    } catch (err) {
      alert('Failed to upload file: ' + err.message);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchDocuments({ page: newPage });
  };

  const handleSortChange = (value) => {
    if (value === 'desc') {
      setSortBy('created_at');
      setOrder('desc');
    } else if (value === 'asc') {
      setSortBy('created_at');
      setOrder('asc');
    }
  };


  const handleGenerateSummary = (document) => {
    setSelectedDocument(document);
    setSummaryModalOpen(true);
  };

  const handleSummaryGenerated = (summary) => {
    // Refresh the documents list to update summary count
    fetchDocuments();
    alert('Summary generated successfully!');
  };

  const handleDownload = async (doc) => {
    try {
      const response = await pdfApi.downloadPDF(doc.id);

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${doc.name}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download document: ' + err.message);
    }
  };

  const handleViewDocument = (id) => {
    router.push(`/documents/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#1F2937] backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-[#3B82F6] rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#3B82F6] stroke-1.5" />
              </div>
              <h1 className="text-xl font-medium text-white">AI PDF Management</h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Home</a>
              <a href="/documents" className="text-[#3B82F6] font-normal">Documents</a>
              <a href="/summaries" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Summaries</a>
              <a href="/study" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Study</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-medium text-white mb-2">Documents</h2>
            <p className="text-[#D1D5DB] font-normal">Manage your PDF documents and their AI-generated summaries</p>
          </div>
          <label className="border border-[#3B82F6] text-[#3B82F6] px-6 py-3 rounded font-normal transition-all duration-200 hover:border-[#2563EB] hover:text-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center gap-2">
            <Upload className="w-4 h-4 stroke-1.5" />
            Upload PDF
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
            />
          </label>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] stroke-1.5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-[#1F2937] rounded pl-10 pr-4 py-3 text-white placeholder-[#6B7280] focus:border-[#3B82F6] focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 font-normal"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <select
              value={order}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent border border-[#1F2937] rounded px-4 py-3 text-white focus:border-[#3B82F6] focus:outline-none transition-all duration-200 font-normal"
            >
              <option value="desc" className="bg-[#0A0A0A]">Newest</option>
              <option value="asc" className="bg-[#0A0A0A]">Oldest</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-[#1F2937] rounded">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-all duration-200 ${viewMode === 'grid'
                  ? 'text-[#3B82F6] border-r border-[#3B82F6]'
                  : 'text-[#9CA3AF] hover:text-white border-r border-[#1F2937]'
                  }`}
              >
                <Grid3X3 className="w-4 h-4 stroke-1.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-all duration-200 ${viewMode === 'list'
                  ? 'text-[#3B82F6]'
                  : 'text-[#9CA3AF] hover:text-white'
                  }`}
              >
                <List className="w-4 h-4 stroke-1.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Documents Grid/List */}
        {error && (
          <div className="border border-[#EF4444] rounded-lg p-4 mb-6 bg-[#EF4444]/5">
            <div className="text-[#EF4444] text-sm">
              Error loading documents: {error}
            </div>
          </div>
        )}

        {uploading && (
          <div className="border border-[#3B82F6] rounded-lg p-4 mb-6 bg-[#3B82F6]/5">
            <div className="text-[#3B82F6] text-sm mb-2">
              Uploading... {Math.round(progress)}%
            </div>
            <div className="w-full bg-[#1F2937] rounded-full h-2">
              <div
                className="bg-[#3B82F6] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border border-[#1F2937] rounded-lg p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#1F2937] rounded"></div>
                  <div className="w-16 h-6 bg-[#1F2937] rounded"></div>
                </div>
                <div className="h-5 bg-[#1F2937] rounded mb-2"></div>
                <div className="h-4 bg-[#1F2937] rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="border border-[#1F2937] rounded-lg p-12 text-center">
            <div className="w-16 h-16 border border-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#9CA3AF] stroke-1.5" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Documents Found</h3>
            <p className="text-[#D1D5DB] font-normal mb-6">
              {searchQuery ? 'Try adjusting your search terms or filters.' : 'Upload your first PDF document to get started.'}
            </p>
            <label className="border border-[#3B82F6] text-[#3B82F6] px-6 py-3 rounded font-normal transition-all duration-200 hover:border-[#2563EB] hover:text-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center gap-2 mx-auto cursor-pointer">
              <Plus className="w-4 h-4 stroke-1.5" />
              Upload PDF
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
              />
            </label>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleViewDocument(doc.id)}
                className={`border border-[#1F2937] rounded-lg hover:border-[#374151] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group ${viewMode === 'grid' ? 'p-6' : 'p-4'
                  }`}
              >
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 border border-[#1F2937] rounded flex items-center justify-center text-[#3B82F6] group-hover:border-[#3B82F6] transition-colors">
                        <FileText className="w-6 h-6 stroke-1.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-[#9CA3AF] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4 stroke-1.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2 truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-[#9CA3AF] mb-4">
                      <span>{doc.size}</span>
                      <span>{doc.pages} pages</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                      <span>{formatDate(doc.uploadedAt)}</span>
                      <span>{doc.summaries} summaries</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDocument(doc.id);
                        }}
                        className="flex-1 border border-[#1F2937] text-[#D1D5DB] py-2 px-3 rounded text-sm hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-3 h-3 stroke-1.5" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateSummary(doc);
                        }}
                        className="border border-[#1F2937] text-[#D1D5DB] p-2 rounded hover:border-[#10B981] hover:text-[#10B981] transition-all duration-200"
                        title="Generate Summary"
                      >
                        <FileCheck className="w-3 h-3 stroke-1.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(doc);
                        }}
                        className="border border-[#1F2937] text-[#D1D5DB] p-2 rounded hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all duration-200">
                        <Download className="w-3 h-3 stroke-1.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        className="border border-[#1F2937] text-[#D1D5DB] p-2 rounded hover:border-[#EF4444] hover:text-[#EF4444] transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3 stroke-1.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  // List View
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-[#1F2937] rounded flex items-center justify-center text-[#3B82F6] flex-shrink-0">
                      <FileText className="w-5 h-5 stroke-1.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{doc.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-[#9CA3AF] mt-1">
                        <span>{doc.size}</span>
                        <span>{doc.pages} pages</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                        <span>{doc.summaries} summaries</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(doc.id);
                          }}
                          className="text-[#D1D5DB] hover:text-[#3B82F6] p-1 transition-colors"
                        >
                          <Eye className="w-4 h-4 stroke-1.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateSummary(doc);
                          }}
                          className="text-[#D1D5DB] hover:text-[#10B981] p-1 transition-colors"
                          title="Generate Summary"
                        >
                          <FileCheck className="w-4 h-4 stroke-1.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc);
                          }}
                          className="text-[#D1D5DB] hover:text-[#F59E0B] p-1 transition-colors"
                        >
                          <Download className="w-4 h-4 stroke-1.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="text-[#D1D5DB] hover:text-[#EF4444] p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 stroke-1.5" />
                        </button>
                        <button className="text-[#9CA3AF] hover:text-white p-1 transition-colors">
                          <MoreVertical className="w-4 h-4 stroke-1.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {documents.length > 0 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-[#9CA3AF]">
              Showing {((pagination.page - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.page * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} documents
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="border border-[#1F2937] text-[#D1D5DB] px-3 py-2 rounded hover:border-[#374151] hover:text-white transition-all duration-200 text-sm font-normal disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + Math.max(1, pagination.page - 2);
                if (pageNum > pagination.totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded text-sm font-normal transition-all duration-200 ${pageNum === pagination.page
                      ? 'border border-[#3B82F6] text-[#3B82F6]'
                      : 'border border-[#1F2937] text-[#D1D5DB] hover:border-[#374151] hover:text-white'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="border border-[#1F2937] text-[#D1D5DB] px-3 py-2 rounded hover:border-[#374151] hover:text-white transition-all duration-200 text-sm font-normal disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Summary Generation Modal */}
      <SummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        document={selectedDocument}
        onSummaryGenerated={handleSummaryGenerated}
      />
    </div>
  );
}