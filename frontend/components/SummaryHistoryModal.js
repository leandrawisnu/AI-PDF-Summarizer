'use client';

import { useState, useEffect } from 'react';
import { X, FileCheck, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { pdfApi, formatDate } from '../lib/api';

export default function SummaryHistoryModal({ isOpen, onClose, pdfId }) {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    if (isOpen && pdfId) {
      setPage(1);
      fetchSummaries(1);
    }
  }, [isOpen, pdfId]);

  useEffect(() => {
    if (isOpen && pdfId && page > 1) {
      fetchSummaries(page);
    }
  }, [page]);

  useEffect(() => {
    if (isOpen && pdfId) {
      setPage(1);
      fetchSummaries(1);
    }
  }, [order]);

  const fetchSummaries = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await pdfApi.getPDFSummaries(pdfId, {
        page: pageNum,
        itemsPerPage,
        order,
      });
      setSummaries(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalItems(response.totalItems || 0);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0A0A] border border-[#1F2937] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1F2937]">
          <h2 className="text-xl font-medium text-white">Summary History</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white transition-colors"
          >
            <X className="w-5 h-5 stroke-1.5" />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-[#1F2937] space-y-4">
          <div>
            <label className="text-xs text-[#9CA3AF] block mb-2">Order</label>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full bg-transparent border border-[#1F2937] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3B82F6] transition-all duration-200 font-normal"
            >
              <option value="desc" className='bg-[#0A0A0A]'>Newest First</option>
              <option value="asc" className='bg-[#0A0A0A]'>Oldest First</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-[#1F2937] rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-[#1F2937] rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-[#1F2937] rounded w-full mb-2"></div>
                  <div className="h-3 bg-[#1F2937] rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="border border-[#EF4444] rounded-lg p-4 bg-[#EF4444]/5">
              <p className="text-[#EF4444] text-sm">{error}</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 text-[#374151] mx-auto mb-3 stroke-1.5" />
              <p className="text-[#D1D5DB] font-normal">No summaries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  className="border border-[#1F2937] rounded-lg p-4 hover:border-[#374151] transition-colors hover:bg-[#111827]/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 border border-[#10B981] rounded flex items-center justify-center flex-shrink-0">
                        <FileCheck className="w-4 h-4 text-[#10B981] stroke-1.5" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium capitalize">
                          {summary.style} Summary
                        </h4>
                        <p className="text-xs text-[#9CA3AF]">{summary.language}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#9CA3AF] whitespace-nowrap ml-2">
                      {formatDate(summary.created_at)}
                    </span>
                  </div>

                  <p className="text-[#D1D5DB] font-normal text-sm leading-relaxed mb-3">
                    {summary.content}
                  </p>

                  <div className="flex items-center gap-4 pt-3 border-t border-[#1F2937]">
                    <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                      <Clock className="w-3 h-3 stroke-1.5" />
                      {summary.summary_time?.toFixed(2) || 'N/A'}s
                    </div>
                    <a
                      href={`/summaries/${summary.id}`}
                      className="text-[#3B82F6] hover:text-[#2563EB] text-xs font-normal transition-colors ml-auto"
                    >
                      View Full →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-[#1F2937] p-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9CA3AF]">
              Showing {totalItems > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, totalItems)} of {totalItems} summaries
            </span>
            <span className="text-[#9CA3AF]">
              Page {page} of {totalPages}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePreviousPage}
              disabled={page === 1 || loading}
              className="flex items-center gap-2 border border-[#1F2937] text-[#D1D5DB] px-4 py-2 rounded font-normal transition-all duration-200 hover:border-[#374151] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 stroke-1.5" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className={`w-8 h-8 rounded font-normal transition-all duration-200 ${page === pageNum
                        ? 'border border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6]'
                        : 'border border-[#1F2937] text-[#D1D5DB] hover:border-[#374151] hover:text-white'
                      } disabled:opacity-50`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextPage}
              disabled={page === totalPages || loading}
              className="flex items-center gap-2 border border-[#1F2937] text-[#D1D5DB] px-4 py-2 rounded font-normal transition-all duration-200 hover:border-[#374151] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 stroke-1.5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full border border-[#1F2937] text-[#D1D5DB] py-3 px-4 rounded font-normal transition-all duration-200 hover:border-[#374151] hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
