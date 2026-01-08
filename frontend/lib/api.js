// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_GO || 'http://localhost:8080';
const PYTHON_API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'http://localhost:8000';

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// PDF API functions
export const pdfApi = {
  // Get all PDFs with pagination and search
  async getPDFs(params = {}) {
    const searchParams = new URLSearchParams({
      page: params.page || 1,
      itemsperpage: params.itemsPerPage || 10,
      sort: params.sortBy || 'created_at',
      order: params.order || 'desc',
      ...(params.search && { search: params.search })
    });
    
    const response = await fetch(`${API_BASE_URL}/pdf?${searchParams}`);
    return handleResponse(response);
  },

  // Get single PDF with summaries
  async getPDF(id) {
    const response = await fetch(`${API_BASE_URL}/pdf/${id}`);
    return handleResponse(response);
  },

  // Upload PDF file
  async uploadPDF(file, title) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }

    const response = await fetch(`${API_BASE_URL}/pdf/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  // Create PDF record manually
  async createPDF(pdfData) {
    const response = await fetch(`${API_BASE_URL}/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pdfData),
    });
    return handleResponse(response);
  },

  // Delete PDF
  async deletePDF(id) {
    const response = await fetch(`${API_BASE_URL}/pdf/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Generate summary for PDF
  async generateSummary(id, summaryData) {
    const response = await fetch(`${API_BASE_URL}/pdf/${id}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(summaryData),
    });
    return handleResponse(response);
  },

  // Get PDF count
  async getPDFCount() {
    const response = await fetch(`${API_BASE_URL}/pdf/count`);
    return handleResponse(response);
  },

  // Download PDF file
  async downloadPDF(id) {
    const response = await fetch(`${API_BASE_URL}/pdf/${id}/download`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response;
  },

  // Get summaries for a specific PDF
  async getPDFSummaries(id, params = {}) {
    const searchParams = new URLSearchParams({
      page: params.page || 1,
      itemsperpage: params.itemsPerPage || 10,
      sort: params.sortBy || 'created_at',
      order: params.order || 'desc',
      ...(params.search && { search: params.search }),
    });

    const response = await fetch(`${API_BASE_URL}/pdf/${id}/summaries?${searchParams}`);
    return handleResponse(response);
  },
};

// Summary API functions
export const summaryApi = {
  // Get all summaries with pagination and search
  async getSummaries(params = {}) {
    const searchParams = new URLSearchParams({
      page: params.page || 1,
      itemsperpage: params.itemsPerPage || 10,
      sort: params.sortBy || 'created_at',
      order: params.order || 'desc',
      ...(params.search && { search: params.search }),
      ...(params.style && { style: params.style }),
      ...(params.language && { language: params.language }),
      ...(params.pdfId && { pdf: params.pdfId })
    });

    const response = await fetch(`${API_BASE_URL}/summaries?${searchParams}`);
    return handleResponse(response);
  },

  // Get single summary
  async getSummary(id) {
    const response = await fetch(`${API_BASE_URL}/summaries/${id}`);
    return handleResponse(response);
  },

  // Delete summary
  async deleteSummary(id) {
    const response = await fetch(`${API_BASE_URL}/summaries/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Bulk delete summaries
  async bulkDeleteSummaries(ids) {
    const response = await fetch(`${API_BASE_URL}/summaries/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    return handleResponse(response);
  },



  // Get summary count
  async getSummaryCount() {
    const response = await fetch(`${API_BASE_URL}/summaries/count`);
    return handleResponse(response);
  },
};

// Health check
export const healthApi = {
  async ping() {
    const response = await fetch(`${API_BASE_URL}/ping`);
    return handleResponse(response);
  },

  async health() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  },
};

// Chat API functions (via Go backend proxy to Python)
export const chatApi = {
  async sendMessage(message, history = [], pdfIds = []) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: history.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'model',
          content: msg.content
        })),
        pdf_ids: pdfIds
      }),
    });
    return handleResponse(response);
  },
};

// Utility functions for data formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'processed': return 'border-[#10B981] text-[#10B981]';
    case 'processing': return 'border-[#F59E0B] text-[#F59E0B]';
    case 'failed': return 'border-[#EF4444] text-[#EF4444]';
    default: return 'border-[#9CA3AF] text-[#9CA3AF]';
  }
};