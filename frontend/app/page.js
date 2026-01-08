'use client';

import { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Search, 
  ArrowRight,
  Languages,
  FileCheck,
  Zap
} from 'lucide-react';
import { useFileUpload } from '../hooks/useApi';
import { useStats } from '../hooks/useStats';
import { pdfApi, summaryApi } from '../lib/api';

export default function HomePage() {
  const [dragActive, setDragActive] = useState(false);
  const { totalDocuments, totalSummaries, loading: statsLoading, refreshStats } = useStats();

  const { upload, uploading, progress, error: uploadError } = useFileUpload();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        await handleFileUpload(file);
      } else {
        alert('Please upload a PDF file only.');
      }
    }
  };

  const handleFileUpload = async (file) => {
    try {
      await upload(file);
      // Refresh stats after successful upload
      refreshStats();
      alert('File uploaded successfully!');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        handleFileUpload(file);
      } else {
        alert('Please upload a PDF file only.');
      }
    }
  };

  const features = [
    {
      icon: <Upload className="w-6 h-6 stroke-1.5" />,
      title: "Smart Upload",
      description: "Drag & drop PDFs with automatic metadata extraction and page counting"
    },
    {
      icon: <Sparkles className="w-6 h-6 stroke-1.5" />,
      title: "AI Summarization",
      description: "Generate intelligent summaries using Google Gemini AI technology"
    },
    {
      icon: <Languages className="w-6 h-6 stroke-1.5" />,
      title: "Multi-Language",
      description: "Support for Indonesian and English summaries with style options"
    },
    {
      icon: <FileText className="w-6 h-6 stroke-1.5" />,
      title: "Study Assistant",
      description: "Chat with your PDFs using AI-powered study sessions"
    }
  ];

  const summaryStyles = [
    { name: "Short", description: "Brief overview of key points", icon: <Zap className="w-4 h-4 stroke-1.5" /> },
    { name: "General", description: "Balanced summary with main insights", icon: <FileCheck className="w-4 h-4 stroke-1.5" /> },
    { name: "Detailed", description: "Comprehensive analysis with explanations", icon: <FileText className="w-4 h-4 stroke-1.5" /> }
  ];

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
              <a href="/documents" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Documents</a>
              <a href="/summaries" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Summaries</a>
              <a href="/study" className="text-[#D1D5DB] hover:text-white transition-colors font-normal">Study</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-6 leading-tight">
            Transform Your PDFs with
            <span className="text-[#3B82F6] block">AI-Powered Insights</span>
          </h2>
          <p className="text-xl text-[#D1D5DB] mb-8 max-w-2xl mx-auto font-normal">
            Upload, manage, and generate intelligent summaries of your PDF documents 
            using advanced AI technology. Get insights in multiple languages and styles.
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-16">
          {uploadError && (
            <div className="border border-[#EF4444] rounded-lg p-4 mb-4 bg-[#EF4444]/5">
              <div className="text-[#EF4444] text-sm">
                Upload error: {uploadError}
              </div>
            </div>
          )}

          {uploading && (
            <div className="border border-[#3B82F6] rounded-lg p-4 mb-4 bg-[#3B82F6]/5">
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

          <div 
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-[#3B82F6] bg-[#3B82F6]/5' 
                : 'border-[#1F2937] hover:border-[#374151]'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border border-[#1F2937] rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#3B82F6] stroke-1.5" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">
                  Drop your PDF here or click to browse
                </h3>
                <p className="text-[#D1D5DB] font-normal">
                  Supports PDF files up to 50MB. Automatic metadata extraction included.
                </p>
              </div>
              <label className="border border-[#3B82F6] text-[#3B82F6] px-6 py-3 rounded font-normal transition-all duration-200 hover:border-[#2563EB] hover:text-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center gap-2 cursor-pointer">
                Choose File
                <ArrowRight className="w-4 h-4 stroke-1.5" />
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-medium text-white mb-8 text-center">
            Powerful Features for Document Management
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="border border-[#1F2937] rounded-lg p-6 hover:border-[#374151] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-12 h-12 border border-[#1F2937] rounded flex items-center justify-center mb-4 text-[#3B82F6]">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-medium text-white mb-2">{feature.title}</h4>
                <p className="text-[#D1D5DB] text-sm leading-relaxed font-normal">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Styles */}
        <div className="mb-16">
          <h3 className="text-2xl font-medium text-white mb-8 text-center">
            Choose Your Summary Style
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {summaryStyles.map((style, index) => (
              <div 
                key={index}
                className="border border-[#1F2937] rounded-lg p-6 hover:border-[#3B82F6] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-[#3B82F6] group-hover:scale-110 transition-transform">
                    {style.icon}
                  </div>
                  <h4 className="text-lg font-medium text-white">{style.name}</h4>
                </div>
                <p className="text-[#D1D5DB] text-sm font-normal">{style.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="border border-[#1F2937] rounded-lg p-8 mb-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-medium text-[#3B82F6] mb-2">
                {statsLoading ? '...' : totalDocuments}
              </div>
              <div className="text-[#D1D5DB] font-normal">Documents Processed</div>
            </div>
            <div>
              <div className="text-3xl font-medium text-[#10B981] mb-2">
                {statsLoading ? '...' : totalSummaries}
              </div>
              <div className="text-[#D1D5DB] font-normal">Summaries Generated</div>
            </div>
            <div>
              <div className="text-3xl font-medium text-[#F59E0B] mb-2">2</div>
              <div className="text-[#D1D5DB] font-normal">Languages Supported</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-2xl font-medium text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/documents"
              className="border border-[#1F2937] rounded-lg p-6 hover:border-[#3B82F6] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-200 text-left group block"
            >
              <FileText className="w-8 h-8 text-[#3B82F6] stroke-1.5 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-medium mb-2">Manage Documents</h4>
              <p className="text-[#D1D5DB] text-sm font-normal">View, upload, and organize your PDF documents</p>
            </a>

            <a 
              href="/summaries"
              className="border border-[#1F2937] rounded-lg p-6 hover:border-[#10B981] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-200 text-left group block"
            >
              <FileCheck className="w-8 h-8 text-[#10B981] stroke-1.5 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-medium mb-2">View Summaries</h4>
              <p className="text-[#D1D5DB] text-sm font-normal">Browse and manage your AI-generated summaries</p>
            </a>

            <a 
              href="/study"
              className="border border-[#1F2937] rounded-lg p-6 hover:border-[#F59E0B] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all duration-200 text-left group block"
            >
              <Sparkles className="w-8 h-8 text-[#F59E0B] stroke-1.5 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-medium mb-2">Study Assistant</h4>
              <p className="text-[#D1D5DB] text-sm font-normal">Chat with your PDFs using AI-powered insights</p>
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-medium text-white">Get Started</h3>
          </div>
          <div className="border border-[#1F2937] rounded-lg p-8 text-center">
            <div className="w-16 h-16 border border-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#3B82F6] stroke-1.5" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">Ready to Get Started?</h4>
            <p className="text-[#D1D5DB] font-normal mb-6">
              Upload your first PDF document and generate intelligent summaries with AI-powered insights.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a 
                href="/documents"
                className="border border-[#3B82F6] text-[#3B82F6] px-6 py-3 rounded font-normal transition-all duration-200 hover:border-[#2563EB] hover:text-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center gap-2"
              >
                <Upload className="w-4 h-4 stroke-1.5" />
                Upload Document
              </a>
              <a 
                href="/summaries"
                className="border border-[#1F2937] text-[#D1D5DB] px-6 py-3 rounded font-normal transition-all duration-200 hover:border-[#374151] hover:text-white flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4 stroke-1.5" />
                View Summaries
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1F2937] mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-[#9CA3AF]">
            <p className="font-normal">&copy; 2024 AI PDF Management. Powered by Google Gemini AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}