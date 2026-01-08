import { useState, useEffect } from 'react';
import { X, Search, FileText, Check } from 'lucide-react';
import { pdfApi, formatDate, formatFileSize } from '../lib/api';

export default function PDFSelectionModal({ isOpen, onClose, onSelect, selectedPDFs = [] }) {
    const [pdfs, setPdfs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
        totalPages: 0,
        totalItems: 0
    });

    useEffect(() => {
        if (isOpen) {
            fetchPDFs();
        }
    }, [isOpen, searchQuery, pagination.page]);

    const fetchPDFs = async () => {
        try {
            setLoading(true);
            const response = await pdfApi.getPDFs({
                page: pagination.page,
                itemsPerPage: pagination.itemsPerPage,
                search: searchQuery
            });

            setPdfs(response.data || []);
            setPagination({
                page: response.page || 1,
                itemsPerPage: response.itemsPerPage || 10,
                totalPages: response.totalPages || 0,
                totalItems: response.totalItems || 0
            });
        } catch (error) {
            console.error('Error fetching PDFs:', error);
        } finally {
            setLoading(false);
        }
    };

    const isSelected = (pdfId) => {
        return selectedPDFs.some(p => p.id === pdfId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0A0A0A] border border-[#1F2937] rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#1F2937]">
                    <div>
                        <h2 className="text-xl font-medium text-white">Select Documents</h2>
                        <p className="text-sm text-[#9CA3AF] mt-1 font-normal">
                            Choose documents to add to your study session
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#9CA3AF] hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5 stroke-1.5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-[#1F2937]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] stroke-1.5" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border border-[#1F2937] rounded pl-10 pr-4 py-3 text-white placeholder-[#6B7280] focus:border-[#3B82F6] focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 font-normal"
                        />
                    </div>
                </div>

                {/* PDF List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="border border-[#1F2937] rounded-lg p-4 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#1F2937] rounded"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-[#1F2937] rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-[#1F2937] rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : pdfs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border border-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-6 h-6 text-[#9CA3AF] stroke-1.5" />
                            </div>
                            <p className="text-sm text-[#9CA3AF] font-normal">
                                {searchQuery ? 'No documents found' : 'No documents available'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pdfs.map((pdf) => (
                                <button
                                    key={pdf.id}
                                    onClick={() => onSelect(pdf)}
                                    disabled={isSelected(pdf.id)}
                                    className={`w-full border rounded-lg p-4 transition-all duration-200 text-left ${
                                        isSelected(pdf.id)
                                            ? 'border-[#10B981] bg-[#10B981]/5'
                                            : 'border-[#1F2937] hover:border-[#374151]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 border rounded flex items-center justify-center flex-shrink-0 ${
                                            isSelected(pdf.id)
                                                ? 'border-[#10B981] text-[#10B981]'
                                                : 'border-[#1F2937] text-[#3B82F6]'
                                        }`}>
                                            {isSelected(pdf.id) ? (
                                                <Check className="w-5 h-5 stroke-1.5" />
                                            ) : (
                                                <FileText className="w-5 h-5 stroke-1.5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-white truncate">
                                                {pdf.title}
                                            </h3>
                                            <p className="text-xs text-[#9CA3AF] mt-1 font-normal">
                                                {formatFileSize(pdf.file_size)} • {pdf.page_count} pages • {formatDate(pdf.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pdfs.length > 0 && (
                    <div className="flex items-center justify-between p-6 border-t border-[#1F2937]">
                        <div className="text-sm text-[#9CA3AF]">
                            Showing {((pagination.page - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.page * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="border border-[#1F2937] text-[#D1D5DB] px-3 py-2 rounded hover:border-[#374151] hover:text-white transition-all duration-200 text-sm font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="border border-[#1F2937] text-[#D1D5DB] px-3 py-2 rounded hover:border-[#374151] hover:text-white transition-all duration-200 text-sm font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
