'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    FileCheck,
    Search,
    MoreVertical,
    Download,
    Eye,
    Trash2,
    Copy,
    Languages,
    Zap,
    Grid3X3,
    List,
    Plus
} from 'lucide-react';
import { summaryApi, formatDate } from '../../lib/api';
import DocumentSelectionModal from '../../components/DocumentSelectionModal';
import SummaryModal from '../../components/SummaryModal';

export default function SummariesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [sortBy, setSortBy] = useState('created_at');
    const [order, setOrder] = useState('desc');
    const [filterStyle, setFilterStyle] = useState('all');
    const [filterLanguage, setFilterLanguage] = useState('all');
    const [summaries, setSummaries] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 12,
        totalPages: 0,
        totalItems: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        english: 0,
        indonesian: 0,
        avgWords: 0
    });
    const [documentSelectionModalOpen, setDocumentSelectionModalOpen] = useState(false);
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const fetchSummaries = async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const response = await summaryApi.getSummaries({
                page: params.page || pagination.page,
                itemsPerPage: params.itemsPerPage || pagination.itemsPerPage,
                sortBy: params.sortBy || sortBy,
                order: params.order || order,
                search: params.search || searchQuery
            });

            // Format summaries data with PDF information now included in response
            const allSummaries = (response.data || []).map((summary) => ({
                id: summary.id,
                documentName: summary.pdf?.title || `PDF Document ${summary.pdf_id}`,
                documentId: summary.pdf_id,
                documentFilename: summary.pdf?.filename || 'Unknown',
                documentFileSize: summary.pdf?.file_size || 0,
                documentPageCount: summary.pdf?.page_count || 0,
                style: summary.style,
                language: summary.language,
                createdAt: summary.created_at,
                summaryTime: summary.summary_time,
                wordCount: summary.content ? summary.content.split(' ').length : 0,
                preview: summary.content ? summary.content.substring(0, 150) + '...' : 'No preview available',
                content: summary.content
            }));

            // Filter by style and language on frontend
            const filteredSummaries = allSummaries.filter(summary => {
                const matchesStyle = filterStyle === 'all' || summary.style.toLowerCase() === filterStyle;
                const matchesLanguage = filterLanguage === 'all' || summary.language.toLowerCase() === filterLanguage;
                return matchesStyle && matchesLanguage;
            });

            setSummaries(filteredSummaries);
            setPagination({
                page: response.page || 1,
                itemsPerPage: response.itemsPerPage || 12,
                totalPages: response.totalPages || 0,
                totalItems: response.totalItems || 0
            });

            // Calculate stats from filtered summaries (client-side for filtered results)
            const englishCount = filteredSummaries.filter(s => s.language.toLowerCase() === 'english').length;
            const indonesianCount = filteredSummaries.filter(s => s.language.toLowerCase() === 'indonesian').length;
            const avgWords = filteredSummaries.length > 0
                ? Math.round(filteredSummaries.reduce((acc, s) => acc + (s.wordCount || 0), 0) / filteredSummaries.length)
                : 0;

            setStats({
                total: filteredSummaries.length,
                english: englishCount,
                indonesian: indonesianCount,
                avgWords
            });

        } catch (err) {
            setError(err.message);
            console.error('Summaries fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummaries();
    }, [sortBy, order, filterStyle, filterLanguage]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSummaries({ page: 1, search: searchQuery });
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this summary?')) return;

        try {
            await summaryApi.deleteSummary(id);
            fetchSummaries(); // Refresh the list
        } catch (err) {
            alert('Failed to delete summary: ' + err.message);
        }
    };

    const handleCopy = async (content) => {
        try {
            await navigator.clipboard.writeText(content);
            alert('Summary copied to clipboard!');
        } catch (err) {
            alert('Failed to copy summary');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        fetchSummaries({ page: newPage });
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

    const handleDocumentSelected = (document) => {
        setSelectedDocument(document);
        setSummaryModalOpen(true);
    };

    const handleSummaryGenerated = (summary) => {
        // Refresh the summaries list
        fetchSummaries();
        alert('Summary generated successfully!');
    };

    const getStyleIcon = (style) => {
        switch (style?.toLowerCase()) {
            case 'short': return <Zap className="w-4 h-4 stroke-1.5" />;
            case 'general': return <FileCheck className="w-4 h-4 stroke-1.5" />;
            case 'detailed': return <FileText className="w-4 h-4 stroke-1.5" />;
            default: return <FileCheck className="w-4 h-4 stroke-1.5" />;
        }
    };

    const getStyleColor = (style) => {
        switch (style?.toLowerCase()) {
            case 'short': return 'text-[#F59E0B]';
            case 'general': return 'text-[#10B981]';
            case 'detailed': return 'text-[#3B82F6]';
            default: return 'text-[#10B981]';
        }
    };

    const filteredSummaries = summaries;

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
                            <a href="/documents" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Documents</a>
                            <a href="/summaries" className="text-[#3B82F6] font-normal">Summaries</a>
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
                        <h2 className="text-3xl font-medium text-white mb-2">Summaries</h2>
                        <p className="text-[#D1D5DB] font-normal">AI-generated summaries of your PDF documents</p>
                    </div>
                    <button 
                        onClick={() => setDocumentSelectionModalOpen(true)}
                        className="border border-[#10B981] text-[#10B981] px-6 py-3 rounded font-normal transition-all duration-200 hover:border-[#059669] hover:text-[#059669] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 stroke-1.5" />
                        Generate Summary
                    </button>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] stroke-1.5" />
                        <input
                            type="text"
                            placeholder="Search summaries or documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border border-[#1F2937] rounded pl-10 pr-4 py-3 text-white placeholder-[#6B7280] focus:border-[#3B82F6] focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 font-normal"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <select
                            value={filterStyle}
                            onChange={(e) => setFilterStyle(e.target.value)}
                            className="bg-transparent border border-[#1F2937] rounded px-4 py-3 text-white focus:border-[#3B82F6] focus:outline-none transition-all duration-200 font-normal"
                        >
                            <option value="all" className="bg-[#0A0A0A]">All Styles</option>
                            <option value="short" className="bg-[#0A0A0A]">Short</option>
                            <option value="general" className="bg-[#0A0A0A]">General</option>
                            <option value="detailed" className="bg-[#0A0A0A]">Detailed</option>
                        </select>

                        <select
                            value={filterLanguage}
                            onChange={(e) => setFilterLanguage(e.target.value)}
                            className="bg-transparent border border-[#1F2937] rounded px-4 py-3 text-white focus:border-[#3B82F6] focus:outline-none transition-all duration-200 font-normal"
                        >
                            <option value="all" className="bg-[#0A0A0A]">All Languages</option>
                            <option value="english" className="bg-[#0A0A0A]">English</option>
                            <option value="indonesian" className="bg-[#0A0A0A]">Indonesian</option>
                        </select>

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

                {/* Summaries Grid/List */}
                {error && (
                    <div className="border border-[#EF4444] rounded-lg p-4 mb-6 bg-[#EF4444]/5">
                        <div className="text-[#EF4444] text-sm">
                            Error loading summaries: {error}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="border border-[#1F2937] rounded-lg p-6 animate-pulse">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-[#1F2937] rounded"></div>
                                        <div className="h-4 bg-[#1F2937] rounded w-24"></div>
                                    </div>
                                </div>
                                <div className="h-5 bg-[#1F2937] rounded mb-2"></div>
                                <div className="h-4 bg-[#1F2937] rounded w-3/4 mb-4"></div>
                                <div className="h-3 bg-[#1F2937] rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredSummaries.length === 0 ? (
                    <div className="border border-[#1F2937] rounded-lg p-12 text-center">
                        <div className="w-16 h-16 border border-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileCheck className="w-8 h-8 text-[#9CA3AF] stroke-1.5" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No Summaries Found</h3>
                        <p className="text-[#D1D5DB] font-normal mb-6">
                            {searchQuery ? 'Try adjusting your search terms or filters.' : 'Generate your first AI summary from uploaded documents.'}
                        </p>
                        <button 
                            onClick={() => setDocumentSelectionModalOpen(true)}
                            className="border border-[#10B981] text-[#10B981] px-6 py-3 rounded font-normal transition-all duration-200 hover:border-[#059669] hover:text-[#059669] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-4 h-4 stroke-1.5" />
                            Generate Summary
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                        {filteredSummaries.map((summary) => (
                            <div
                                key={summary.id}
                                onClick={() => window.location.href = `/summaries/${summary.id}`}
                                className={`block border border-[#1F2937] rounded-lg hover:border-[#374151] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group ${viewMode === 'grid' ? 'p-6' : 'p-4'
                                    }`}
                            >
                                {viewMode === 'grid' ? (
                                    // Grid View
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`${getStyleColor(summary.style)}`}>
                                                    {getStyleIcon(summary.style)}
                                                </div>
                                                <span className="text-sm font-normal text-white">{summary.style} Summary</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                                                    <Languages className="w-3 h-3 stroke-1.5" />
                                                    <span>{summary.language}</span>
                                                </div>
                                                <button className="text-[#9CA3AF] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                                    <MoreVertical className="w-4 h-4 stroke-1.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-medium text-white mb-2 truncate" title={summary.documentName}>
                                            {summary.documentName}
                                        </h3>

                                        <p className="text-[#D1D5DB] text-sm leading-relaxed font-normal line-clamp-3 mb-4">
                                            {summary.preview}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-4">
                                            <span>{formatDate(summary.createdAt)}</span>
                                            <span>{summary.wordCount} words</span>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a 
                                                href={`/summaries/${summary.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 border border-[#1F2937] text-[#D1D5DB] py-2 px-3 rounded text-sm hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all duration-200 flex items-center justify-center gap-2"
                                            >
                                                <Eye className="w-3 h-3 stroke-1.5" />
                                                Read Full
                                            </a>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleCopy(summary.content);
                                                }}
                                                className="border border-[#1F2937] text-[#D1D5DB] p-2 rounded hover:border-[#10B981] hover:text-[#10B981] transition-all duration-200"
                                            >
                                                <Copy className="w-3 h-3 stroke-1.5" />
                                            </button>
                                            <button className="border border-[#1F2937] text-[#D1D5DB] p-2 rounded hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all duration-200">
                                                <Download className="w-3 h-3 stroke-1.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDelete(summary.id);
                                                }}
                                                className="border border-[#1F2937] text-[#D1D5DB] p-2 rounded hover:border-[#EF4444] hover:text-[#EF4444] transition-all duration-200"
                                            >
                                                <Trash2 className="w-3 h-3 stroke-1.5" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // List View
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 border border-[#1F2937] rounded flex items-center justify-center flex-shrink-0 ${getStyleColor(summary.style)}`}>
                                            {getStyleIcon(summary.style)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-white font-medium truncate">{summary.documentName}</h3>
                                                <span className="text-xs text-[#9CA3AF] px-2 py-1 border border-[#1F2937] rounded">
                                                    {summary.style}
                                                </span>
                                            </div>
                                            <p className="text-[#D1D5DB] text-sm font-normal line-clamp-2 mb-2">
                                                {summary.preview}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                                                <div className="flex items-center gap-1">
                                                    <Languages className="w-3 h-3 stroke-1.5" />
                                                    <span>{summary.language}</span>
                                                </div>
                                                <span>{formatDate(summary.createdAt)}</span>
                                                <span>{summary.wordCount} words</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a 
                                                href={`/summaries/${summary.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[#D1D5DB] hover:text-[#3B82F6] p-1 transition-colors"
                                            >
                                                <Eye className="w-4 h-4 stroke-1.5" />
                                            </a>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleCopy(summary.content);
                                                }}
                                                className="text-[#D1D5DB] hover:text-[#10B981] p-1 transition-colors"
                                            >
                                                <Copy className="w-4 h-4 stroke-1.5" />
                                            </button>
                                            <button className="text-[#D1D5DB] hover:text-[#F59E0B] p-1 transition-colors">
                                                <Download className="w-4 h-4 stroke-1.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDelete(summary.id);
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
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Stats */}
                {filteredSummaries.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                        <div className="border border-[#1F2937] rounded-lg p-4 text-center">
                            <div className="text-2xl font-medium text-[#3B82F6] mb-1">
                                {stats.total}
                            </div>
                            <div className="text-[#D1D5DB] text-sm font-normal">Total Summaries</div>
                        </div>
                        <div className="border border-[#1F2937] rounded-lg p-4 text-center">
                            <div className="text-2xl font-medium text-[#10B981] mb-1">
                                {stats.english}
                            </div>
                            <div className="text-[#D1D5DB] text-sm font-normal">English</div>
                        </div>
                        <div className="border border-[#1F2937] rounded-lg p-4 text-center">
                            <div className="text-2xl font-medium text-[#F59E0B] mb-1">
                                {stats.indonesian}
                            </div>
                            <div className="text-[#D1D5DB] text-sm font-normal">Indonesian</div>
                        </div>
                        <div className="border border-[#1F2937] rounded-lg p-4 text-center">
                            <div className="text-2xl font-medium text-[#8B5CF6] mb-1">
                                {stats.avgWords}
                            </div>
                            <div className="text-[#D1D5DB] text-sm font-normal">Avg Words</div>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {filteredSummaries.length > 0 && (
                    <div className="flex items-center justify-between mt-8">
                        <div className="text-sm text-[#9CA3AF]">
                            Showing {((pagination.page - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.page * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} summaries
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

            {/* Document Selection Modal */}
            <DocumentSelectionModal
                isOpen={documentSelectionModalOpen}
                onClose={() => setDocumentSelectionModalOpen(false)}
                onDocumentSelected={handleDocumentSelected}
            />

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