'use client';

import { useState, useEffect, useRef } from 'react';
import {
    FileText,
    Plus,
    X,
    Send,
    Loader2,
    BookOpen,
    MessageSquare,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { pdfApi, chatApi } from '../../lib/api';
import PDFSelectionModal from '../../components/PDFSelectionModal';
import GenerateSummaryModal from '../../components/GenerateSummaryModal';
import { marked } from 'marked';

// Configure marked options for better rendering
marked.setOptions({
    breaks: true,
    gfm: true,
});

export default function StudyPage() {
    const [selectedPDFs, setSelectedPDFs] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [summaryModalPDF, setSummaryModalPDF] = useState(null);
    const [pdfsWithoutSummary, setPdfsWithoutSummary] = useState([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleAddPDF = async (pdf) => {
        if (selectedPDFs.find(p => p.id === pdf.id)) {
            setIsModalOpen(false);
            return;
        }

        // Check if PDF has summaries
        try {
            const pdfDetails = await pdfApi.getPDF(pdf.id);
            
            if (!pdfDetails.summaries || pdfDetails.summaries.length === 0) {
                // PDF doesn't have summary, show generate modal
                setSummaryModalPDF(pdfDetails);
                setIsModalOpen(false);
            } else {
                // PDF has summary, add it
                setSelectedPDFs([...selectedPDFs, pdfDetails]);
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Error checking PDF summaries:', error);
            // Add anyway if there's an error
            setSelectedPDFs([...selectedPDFs, pdf]);
            setIsModalOpen(false);
        }
    };

    const handleRemovePDF = (pdfId) => {
        setSelectedPDFs(selectedPDFs.filter(p => p.id !== pdfId));
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || selectedPDFs.length === 0) return;

        // Check if all selected PDFs have summaries
        const pdfsWithoutSummaries = selectedPDFs.filter(pdf => 
            !pdf.summaries || pdf.summaries.length === 0
        );

        if (pdfsWithoutSummaries.length > 0) {
            setPdfsWithoutSummary(pdfsWithoutSummaries);
            return;
        }

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages([...messages, userMessage]);
        setInputMessage('');
        setIsSending(true);

        try {
            // Extract PDF IDs from selected PDFs
            const pdfIds = selectedPDFs.map(pdf => pdf.id);
            
            // Call chat API with conversation history and PDF IDs
            const data = await chatApi.sendMessage(inputMessage, messages, pdfIds);

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: data.reply,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    const handleSummaryGenerated = async (pdf) => {
        // Refresh PDF details to get the new summary
        try {
            const pdfDetails = await pdfApi.getPDF(pdf.id);
            setSelectedPDFs([...selectedPDFs, pdfDetails]);
            setSummaryModalPDF(null);
        } catch (error) {
            console.error('Error refreshing PDF:', error);
        }
    };

    const handleGenerateSummaryForPDF = (pdf) => {
        setSummaryModalPDF(pdf);
        setPdfsWithoutSummary([]);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
            {/* Header */}
            <header className="border-b border-[#1F2937] backdrop-blur-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border border-[#3B82F6] rounded flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-[#3B82F6] stroke-1.5" />
                            </div>
                            <h1 className="text-xl font-medium text-white">Study Assistant</h1>
                        </div>
                        <nav className="hidden md:flex items-center gap-6">
                            <a href="/" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Home</a>
                            <a href="/documents" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Documents</a>
                            <a href="/summaries" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Summaries</a>
                            <a href="/study" className="text-[#3B82F6] font-normal">Study</a>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - PDF Selection */}
                <aside className="w-80 border-r border-[#1F2937] flex flex-col">
                    <div className="p-6 border-b border-[#1F2937]">
                        <h2 className="text-lg font-medium text-white mb-2">Sources</h2>
                        <p className="text-sm text-[#9CA3AF] font-normal mb-4">
                            Add documents to chat with
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full border border-[#3B82F6] text-[#3B82F6] px-4 py-3 rounded font-normal transition-all duration-200 hover:border-[#2563EB] hover:text-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4 stroke-1.5" />
                            Add Document
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {selectedPDFs.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 border border-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FileText className="w-6 h-6 text-[#9CA3AF] stroke-1.5" />
                                </div>
                                <p className="text-sm text-[#9CA3AF] font-normal">
                                    No documents added yet
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedPDFs.map((pdf) => (
                                    <div
                                        key={pdf.id}
                                        className="border border-[#1F2937] rounded-lg p-4 hover:border-[#374151] transition-all duration-200 group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <FileText className="w-5 h-5 text-[#3B82F6] flex-shrink-0 stroke-1.5 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium text-white truncate">
                                                    {pdf.title}
                                                </h3>
                                                <p className="text-xs text-[#9CA3AF] mt-1 font-normal">
                                                    {pdf.page_count} pages
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemovePDF(pdf.id)}
                                                className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-4 h-4 stroke-1.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right Side - Chat Interface */}
                <main className="flex-1 flex flex-col h-screen">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center max-w-md">
                                    <div className="w-16 h-16 border border-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-8 h-8 text-[#3B82F6] stroke-1.5" />
                                    </div>
                                    <h3 className="text-xl font-medium text-white mb-2">
                                        Start Your Study Session
                                    </h3>
                                    <p className="text-[#D1D5DB] font-normal mb-6">
                                        Add documents from the sidebar and ask questions to get AI-powered insights
                                    </p>
                                    {selectedPDFs.length === 0 && (
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="border border-[#3B82F6] text-[#3B82F6] px-6 py-3 rounded font-normal transition-all duration-200 hover:border-[#2563EB] hover:text-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] inline-flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4 stroke-1.5" />
                                            Add Your First Document
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-6">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {message.type === 'ai' && (
                                            <div className="w-8 h-8 border border-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="w-4 h-4 text-[#3B82F6] stroke-1.5" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] ${
                                                message.type === 'user'
                                                    ? 'border border-[#3B82F6] rounded-lg p-4'
                                                    : 'border border-[#1F2937] rounded-lg p-4'
                                            }`}
                                        >
                                            {message.type === 'ai' ? (
                                                <div 
                                                    className="text-[#D1D5DB] font-normal leading-relaxed prose prose-invert prose-sm max-w-none
                                                    prose-headings:text-white prose-headings:font-medium
                                                    prose-p:text-[#D1D5DB] prose-p:my-2
                                                    prose-a:text-[#3B82F6] prose-a:no-underline hover:prose-a:underline
                                                    prose-strong:text-white prose-strong:font-medium
                                                    prose-code:text-[#3B82F6] prose-code:bg-[#1F2937] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                                                    prose-pre:bg-[#1F2937] prose-pre:border prose-pre:border-[#374151]
                                                    prose-ul:text-[#D1D5DB] prose-ul:my-2
                                                    prose-ol:text-[#D1D5DB] prose-ol:my-2
                                                    prose-li:text-[#D1D5DB] prose-li:my-1
                                                    prose-blockquote:border-l-[#3B82F6] prose-blockquote:text-[#9CA3AF]"
                                                    dangerouslySetInnerHTML={{ __html: marked(message.content) }}
                                                />
                                            ) : (
                                                <p className="text-[#D1D5DB] font-normal leading-relaxed whitespace-pre-wrap">
                                                    {message.content}
                                                </p>
                                            )}
                                        </div>
                                        {message.type === 'user' && (
                                            <div className="w-8 h-8 border border-[#1F2937] rounded-full flex items-center justify-center flex-shrink-0">
                                                <MessageSquare className="w-4 h-4 text-[#9CA3AF] stroke-1.5" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isSending && (
                                    <div className="flex gap-4 justify-start">
                                        <div className="w-8 h-8 border border-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-4 h-4 text-[#3B82F6] stroke-1.5" />
                                        </div>
                                        <div className="border border-[#1F2937] rounded-lg p-4">
                                            <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin stroke-1.5" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-[#1F2937] p-6 flex-shrink-0">
                        <div className="max-w-3xl mx-auto">
                            <div className="relative">
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={
                                        selectedPDFs.length === 0
                                            ? 'Add documents to start chatting...'
                                            : 'Ask a question about your documents...'
                                    }
                                    disabled={selectedPDFs.length === 0 || isSending}
                                    rows={3}
                                    className="w-full bg-transparent border border-[#1F2937] rounded-lg px-4 py-3 pr-12 text-white placeholder-[#6B7280] focus:border-[#3B82F6] focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 font-normal resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || selectedPDFs.length === 0 || isSending}
                                    className="absolute right-3 bottom-3 w-8 h-8 border border-[#3B82F6] rounded flex items-center justify-center text-[#3B82F6] hover:border-[#2563EB] hover:text-[#2563EB] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                                >
                                    <Send className="w-4 h-4 stroke-1.5" />
                                </button>
                            </div>
                            <p className="text-xs text-[#9CA3AF] mt-2 font-normal">
                                Press Enter to send, Shift+Enter for new line
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            {/* PDF Selection Modal */}
            <PDFSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleAddPDF}
                selectedPDFs={selectedPDFs}
            />

            {/* Generate Summary Modal */}
            <GenerateSummaryModal
                isOpen={summaryModalPDF !== null}
                onClose={() => setSummaryModalPDF(null)}
                pdf={summaryModalPDF}
                onSummaryGenerated={handleSummaryGenerated}
            />

            {/* PDFs Without Summary Warning Modal */}
            {pdfsWithoutSummary.length > 0 && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0A0A0A] border border-[#1F2937] rounded-lg w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#1F2937]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 border border-[#F59E0B] rounded flex items-center justify-center">
                                    <AlertCircle className="w-4 h-4 text-[#F59E0B] stroke-1.5" />
                                </div>
                                <h2 className="text-lg font-medium text-white">Summaries Required</h2>
                            </div>
                            <button
                                onClick={() => setPdfsWithoutSummary([])}
                                className="text-[#9CA3AF] hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5 stroke-1.5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-[#D1D5DB] font-normal">
                                The following documents need summaries before you can chat with them:
                            </p>

                            <div className="space-y-2">
                                {pdfsWithoutSummary.map((pdf) => (
                                    <div
                                        key={pdf.id}
                                        className="border border-[#1F2937] rounded-lg p-3 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="w-4 h-4 text-[#3B82F6] flex-shrink-0 stroke-1.5" />
                                            <span className="text-sm text-white truncate">{pdf.title}</span>
                                        </div>
                                        <button
                                            onClick={() => handleGenerateSummaryForPDF(pdf)}
                                            className="border border-[#3B82F6] text-[#3B82F6] px-3 py-1 rounded text-xs hover:bg-[#3B82F6] hover:text-white transition-all duration-200 flex-shrink-0 ml-2"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="border border-[#F59E0B] bg-[#F59E0B]/10 rounded-lg p-4">
                                <p className="text-xs text-[#F59E0B] font-normal">
                                    Generate summaries for these documents to enable AI-powered conversations.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#1F2937]">
                            <button
                                onClick={() => setPdfsWithoutSummary([])}
                                className="border border-[#1F2937] text-[#D1D5DB] px-4 py-2 rounded hover:border-[#374151] hover:text-white transition-all duration-200 text-sm font-normal"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
