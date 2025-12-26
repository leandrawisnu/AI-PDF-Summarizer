# AI PDF Summarizer

A full-stack application that uses AI to summarize PDF documents with customizable styles and language options.

## 🚀 Features

- **PDF Upload & Processing**: Upload PDF files up to 10MB
- **AI-Powered Summarization**: Uses Google Gemini AI for intelligent document summarization
- **Multiple Summary Styles**: Choose from short, general, or detailed summaries
- **Multi-language Support**: Generate summaries in Indonesian or English
- **Smart Text Chunking**: Handles large documents by intelligently splitting content
- **Document Statistics**: Get word count, reading time, and text analysis
- **Modern UI**: Clean, responsive Next.js frontend with Tailwind CSS

## 🏗️ Architecture

```
├── backend/          # FastAPI backend server
├── frontend/         # Next.js React frontend
└── collection/       # Bruno API collection for testing
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Google Gemini AI** - AI summarization engine
- **PyPDF2** - PDF text extraction
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Styling framework
- **Marked** - Markdown rendering

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+
- Google Gemini API key

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd ai-pdf-summarizer
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Run the server
python main.py
```
Backend will be available at `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /summarize` - Upload and summarize PDF

## 📝 API Usage

### Summarize PDF
```bash
curl -X POST "http://localhost:8000/summarize" \
  -F "file=@document.pdf" \
  -F "style=general" \
  -F "language=english"
```

**Parameters:**
- `file`: PDF file (max 10MB)
- `style`: `short` | `general` | `detailed`
- `language`: `indonesian` | `english`

## 🧪 Testing

Use the Bruno collection in the `collection/` directory to test API endpoints:
- Health Check
- Root endpoint
- PDF Summarization

**Bruno API Client**: Download and install [Bruno](https://www.usebruno.com/) to run the API tests from the collection.

## 📁 Project Structure

```
ai-pdf-summarizer/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   └── .gitignore          # Git ignore rules
├── frontend/
│   ├── app/                 # Next.js app directory
│   ├── package.json         # Node.js dependencies
│   └── .gitignore          # Git ignore rules
└── collection/
    ├── bruno.json           # Bruno collection config
    └── *.bru               # API test files
```

## 🔒 Security Features

- File type validation (PDF only)
- File size limits (10MB max)
- CORS configuration
- Environment variable protection

## 📄 License

This project is licensed under the MIT License.
