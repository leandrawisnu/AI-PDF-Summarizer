import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { pdfApi } from '../lib/api';

export default function GenerateSummaryModal({ isOpen, onClose, pdf, onSummaryGenerated }) {
    const [style, setStyle] = useState('general');
    const [language, setLanguage] = useState('english');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            setError(null);

            await pdfApi.generateSummary(pdf.id, {
                style,
                language
            });

            // Notify parent component
            if (onSummaryGenerated) {
                onSummaryGenerated(pdf);
            }

            onClose();
        } catch (err) {
            console.error('Error generating summary:', err);
            setError(err.message || 'Failed to generate summary');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen || !pdf) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0A0A0A] border border-[#1F2937] rounded-lg w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#1F2937]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-[#3B82F6] rounded flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#3B82F6] stroke-1.5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-white">Generate Summary</h2>
                            <p className="text-xs text-[#9CA3AF] mt-0.5 font-normal">
                                {pdf.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="text-[#9CA3AF] hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 stroke-1.5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="border border-[#EF4444] bg-[#EF4444]/10 rounded-lg p-4">
                            <p className="text-sm text-[#EF4444] font-normal">{error}</p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="border border-[#1F2937] rounded-lg p-4">
                        <p className="text-sm text-[#D1D5DB] font-normal">
                            This document needs a summary before you can chat with it. Generate one now to enable AI-powered conversations.
                        </p>
                    </div>

                    {/* Style Selection */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-3">
                            Summary Style
                        </label>
                        <div className="space-y-2">
                            {[
                                { value: 'short', label: 'Short', desc: 'Brief overview' },
                                { value: 'general', label: 'General', desc: 'Balanced summary' },
                                { value: 'detailed', label: 'Detailed', desc: 'In-depth analysis' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setStyle(option.value)}
                                    disabled={isGenerating}
                                    className={`w-full border rounded-lg p-3 text-left transition-all duration-200 ${
                                        style === option.value
                                            ? 'border-[#3B82F6] bg-[#3B82F6]/10'
                                            : 'border-[#1F2937] hover:border-[#374151]'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`text-sm font-medium ${
                                                style === option.value ? 'text-[#3B82F6]' : 'text-white'
                                            }`}>
                                                {option.label}
                                            </div>
                                            <div className="text-xs text-[#9CA3AF] mt-0.5 font-normal">
                                                {option.desc}
                                            </div>
                                        </div>
                                        {style === option.value && (
                                            <div className="w-4 h-4 border-2 border-[#3B82F6] rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-[#3B82F6] rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-3">
                            Language
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'english', label: 'English' },
                                { value: 'indonesian', label: 'Indonesian' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setLanguage(option.value)}
                                    disabled={isGenerating}
                                    className={`border rounded-lg p-3 text-sm font-medium transition-all duration-200 ${
                                        language === option.value
                                            ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6]'
                                            : 'border-[#1F2937] text-white hover:border-[#374151]'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-[#1F2937]">
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="border border-[#1F2937] text-[#D1D5DB] px-4 py-2 rounded hover:border-[#374151] hover:text-white transition-all duration-200 text-sm font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="border border-[#3B82F6] bg-[#3B82F6] text-white px-4 py-2 rounded hover:bg-[#2563EB] hover:border-[#2563EB] transition-all duration-200 text-sm font-normal disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin stroke-1.5" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 stroke-1.5" />
                                Generate Summary
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
