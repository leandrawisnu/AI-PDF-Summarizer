'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { marked } from 'marked';
import {
    FileText,
    ArrowLeft,
    Copy,
    Download,
    Trash2,
    Languages,
    Calendar,
    Clock,
    FileCheck,
    Zap,
    Eye,
    ExternalLink
} from 'lucide-react';
import { summaryApi, formatDate } from '../../../lib/api';

export default function SummaryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Configure marked options
    useEffect(() => {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });
    }, []);

    useEffect(() => {
        if (params.id) {
            fetchSummary();
        }
    }, [params.id]);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await summaryApi.getSummary(params.id);
            
            // Format the summary data
            const formattedSummary = {
                id: response.id,
                content: response.content,
                style: response.style,
                language: response.language,
                createdAt: response.created_at,
                summaryTime: response.summary_time,
                wordCount: response.content ? response.content.split(' ').length : 0,
                documentName: response.pdf?.title || `PDF Document ${response.pdf_id}`,
                documentId: response.pdf_id,
                documentFilename: response.pdf?.filename || 'Unknown',
                documentFileSize: response.pdf?.file_size || 0,
                documentPageCount: response.pdf?.page_count || 0,
            };
            
            setSummary(formattedSummary);
        } catch (err) {
            setError(err.message);
            console.error('Summary fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summary.content);
            alert('Summary copied to clipboard!');
        } catch (err) {
            alert('Failed to copy summary');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this summary?')) return;

        try {
            await summaryApi.deleteSummary(params.id);
            router.push('/summaries');
        } catch (err) {
            alert('Failed to delete summary: ' + err.message);
        }
    };

    const handleDownload = () => {
        const element = document.createElement('a');
        const file = new Blob([summary.content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${summary.documentName}_${summary.style}_summary.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const getStyleIcon = (style) => {
        switch (style?.toLowerCase()) {
            case 'short': return <Zap className="w-5 h-5 stroke-1.5" />;
            case 'general': return <FileCheck className="w-5 h-5 stroke-1.5" />;
            case 'detailed': return <FileText className="w-5 h-5 stroke-1.5" />;
            default: return <FileCheck className="w-5 h-5 stroke-1.5" />;
        }
    };

    const getStyleColor = (style) => {
        switch (style?.toLowerCase()) {
            case 'short': return 'text-[#F59E0B] border-[#F59E0B]';
            case 'general': return 'text-[#10B981] border-[#10B981]';
            case 'detailed': return 'text-[#3B82F6] border-[#3B82F6]';
            default: return 'text-[#10B981] border-[#10B981]';
        }
    };

    if (loading) {
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
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Loading Content */}
                <main className="max-w-4xl mx-auto px-6 py-8">
                    <div className="animate-pulse">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-[#1F2937] rounded"></div>
                            <div className="h-8 bg-[#1F2937] rounded w-64"></div>
                        </div>
                        <div className="border border-[#1F2937] rounded-lg p-6">
                            <div className="h-6 bg-[#1F2937] rounded mb-4"></div>
                            <div className="space-y-3">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-4 bg-[#1F2937] rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
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
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Error Content */}
                <main className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 border border-[#1F2937] rounded flex items-center justify-center text-[#D1D5DB] hover:text-white hover:border-[#374151] transition-all duration-200"
                        >
                            <ArrowLeft className="w-5 h-5 stroke-1.5" />
                        </button>
                        <h2 className="text-2xl font-medium text-white">Summary Details</h2>
                    </div>

                    <div className="border border-[#EF4444] rounded-lg p-8 text-center">
                        <div className="w-16 h-16 border border-[#EF4444] rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-[#EF4444] stroke-1.5" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Error Loading Summary</h3>
                        <p className="text-[#D1D5DB] font-normal mb-6">{error}</p>
                        <button
                            onClick={() => router.push('/summaries')}
                            className="border border-[#3B82F6] text-[#3B82F6] px-6 py-3 rounded font-normal transition-all duration-200 hover:border-[#2563EB] hover:text-[#2563EB]"
                        >
                            Back to Summaries
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Custom styles for markdown content */}
            <style jsx>{`
                .markdown-content h1,
                .markdown-content h2,
                .markdown-content h3,
                .markdown-content h4,
                .markdown-content h5,
                .markdown-content h6 {
                    color: #ffffff;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    line-height: 1.25;
                }
                
                .markdown-content h1 { font-size: 1.875rem; }
                .markdown-content h2 { font-size: 1.5rem; }
                .markdown-content h3 { font-size: 1.25rem; }
                .markdown-content h4 { font-size: 1.125rem; }
                .markdown-content h5 { font-size: 1rem; }
                .markdown-content h6 { font-size: 0.875rem; }
                
                .markdown-content p {
                    margin-bottom: 1rem;
                    line-height: 1.625;
                }
                
                .markdown-content ul,
                .markdown-content ol {
                    margin-bottom: 1rem;
                    padding-left: 1.5rem;
                }
                
                .markdown-content li {
                    margin-bottom: 0.25rem;
                }
                
                .markdown-content strong {
                    color: #ffffff;
                    font-weight: 600;
                }
                
                .markdown-content em {
                    font-style: italic;
                }
                
                .markdown-content code {
                    background-color: #1f2937;
                    color: #f59e0b;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                    font-family: 'Courier New', monospace;
                }
                
                .markdown-content pre {
                    background-color: #1f2937;
                    border: 1px solid #374151;
                    border-radius: 0.5rem;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    overflow-x: auto;
                }
                
                .markdown-content pre code {
                    background-color: transparent;
                    padding: 0;
                    color: #d1d5db;
                }
                
                .markdown-content blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    font-style: italic;
                    color: #9ca3af;
                }
                
                .markdown-content a {
                    color: #3b82f6;
                    text-decoration: underline;
                }
                
                .markdown-content a:hover {
                    color: #2563eb;
                }
                
                .markdown-content hr {
                    border: none;
                    border-top: 1px solid #374151;
                    margin: 2rem 0;
                }
                
                .markdown-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 1rem;
                }
                
                .markdown-content th,
                .markdown-content td {
                    border: 1px solid #374151;
                    padding: 0.5rem;
                    text-align: left;
                }
                
                .markdown-content th {
                    background-color: #1f2937;
                    color: #ffffff;
                    font-weight: 600;
                }
            `}</style>
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
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 border border-[#1F2937] rounded flex items-center justify-center text-[#D1D5DB] hover:text-white hover:border-[#374151] transition-all duration-200"
                    >
                        <ArrowLeft className="w-5 h-5 stroke-1.5" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-2xl font-medium text-white mb-1">Summary Details</h2>
                        <p className="text-[#D1D5DB] font-normal">{summary.documentName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="border border-[#1F2937] text-[#D1D5DB] px-4 py-2 rounded hover:border-[#10B981] hover:text-[#10B981] transition-all duration-200 flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4 stroke-1.5" />
                            Copy
                        </button>
                        <button
                            onClick={handleDownload}
                            className="border border-[#1F2937] text-[#D1D5DB] px-4 py-2 rounded hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all duration-200 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4 stroke-1.5" />
                            Download
                        </button>
                        <button
                            onClick={handleDelete}
                            className="border border-[#1F2937] text-[#D1D5DB] px-4 py-2 rounded hover:border-[#EF4444] hover:text-[#EF4444] transition-all duration-200 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4 stroke-1.5" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Summary Info Card */}
                <div className="border border-[#1F2937] rounded-lg p-6 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 border rounded flex items-center justify-center ${getStyleColor(summary.style)}`}>
                                {getStyleIcon(summary.style)}
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-1">
                                    {summary.style} Summary
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                                    <div className="flex items-center gap-1">
                                        <Languages className="w-4 h-4 stroke-1.5" />
                                        <span>{summary.language}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4 stroke-1.5" />
                                        <span>{formatDate(summary.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 stroke-1.5" />
                                        <span>{summary.wordCount} words</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a
                            href={`/documents/${summary.documentId}`}
                            className="border border-[#1F2937] text-[#D1D5DB] px-4 py-2 rounded hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all duration-200 flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4 stroke-1.5" />
                            View Document
                            <ExternalLink className="w-3 h-3 stroke-1.5" />
                        </a>
                    </div>

                    {/* Document Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0F0F0F] rounded border border-[#1F2937]">
                        <div>
                            <div className="text-xs text-[#9CA3AF] mb-1">Document</div>
                            <div className="text-sm text-white font-medium">{summary.documentFilename}</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#9CA3AF] mb-1">Pages</div>
                            <div className="text-sm text-white font-medium">{summary.documentPageCount}</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#9CA3AF] mb-1">Processing Time</div>
                            <div className="text-sm text-white font-medium">
                                {summary.summaryTime ? `${summary.summaryTime}s` : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Content */}
                <div className="border border-[#1F2937] rounded-lg p-6">
                    <h4 className="text-lg font-medium text-white mb-4">Summary Content</h4>
                    <div className="prose prose-invert max-w-none">
                        <div 
                            className="text-[#D1D5DB] leading-relaxed font-normal markdown-content"
                            dangerouslySetInnerHTML={{ 
                                __html: marked.parse(summary.content || '') 
                            }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}