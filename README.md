![Your Banner Image](https://ibb.co.com/MyGwf7XJ)

# AI PDF Management System

A full-stack application for managing PDF documents with AI-powered summarization capabilities using Google Gemini AI.

## 🏗️ Architecture

This project consists of three main components:

- **Frontend**: Next.js application for user interface
- **Backend (Go)**: Go/Fiber API for PDF management and database operations
- **Backend (Python)**: FastAPI service for AI-powered PDF summarization
- **Database**: PostgreSQL for data persistence

## 🚀 Features

- **PDF Upload & Management**: Upload, store, and manage PDF documents
- **AI Summarization**: Generate summaries using Google Gemini AI with multiple styles and languages
- **Multi-language Support**: Indonesian and English summarization
- **Summary Styles**: Short, General, and Detailed summaries
- **RESTful API**: Clean API design with proper DTOs and validation
- **Pagination**: Efficient data retrieval with pagination support
- **Search**: Search through PDFs and summaries
- **Dockerized**: Full containerization with Docker Compose

## 📁 Project Structure

```
AI PDF Management/
├── frontend/                 # Next.js frontend application
├── backend - go/            # Go backend (PDF management)
│   ├── dto/                 # Data Transfer Objects
│   ├── models/              # Database models
│   ├── utils/               # Utility functions
│   ├── migrate/             # Database migration
│   └── uploads/             # PDF file storage
├── backend - python/        # Python backend (AI summarization)
├── collection - go/         # Bruno API collection for testing
├── postgres/                # PostgreSQL configuration
└── docker-compose.yml       # Docker orchestration
```

## 🛠️ Tech Stack

### Frontend
- **Next.js**: React framework
- **JavaScript**: Programming language

### Backend (Go)
- **Go 1.25.2**: Programming language
- **Fiber v2**: Web framework
- **GORM**: ORM for database operations
- **PostgreSQL**: Database driver
- **UUID**: Unique identifier generation

### Backend (Python)
- **FastAPI**: Web framework
- **Google Gemini AI**: AI summarization service
- **PyPDF2**: PDF text extraction
- **Uvicorn**: ASGI server

### Database
- **PostgreSQL 15**: Primary database
- **Adminer**: Database administration tool

## 🚦 Getting Started

### Prerequisites

- Docker and Docker Compose
- Go 1.25.2+ (for local development)
- Python 3.8+ (for local development)
- Node.js 18+ (for local development)

### Database Setup Options

You have two options for PostgreSQL:

**Option A: Use included PostgreSQL in Docker Compose (Recommended for development)**
- PostgreSQL is already configured in docker-compose.yml
- No additional setup required

**Option B: Use your own PostgreSQL instance**
1. Remove the `postgres` service from docker-compose.yml
2. Update the `DATABASE_URL` in backend-go service to point to your PostgreSQL instance
3. Ensure your PostgreSQL has database: `ai_pdf_management`

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "AI PDF Management"
   ```

2. **Set up Python backend environment**
   ```bash
   cd "backend - python"
   cp .env.example .env
   # Edit .env and add your Google Gemini API key
   ```

3. **Run with Docker Compose**
   ```bash
   # Option A: With included PostgreSQL
   docker-compose up -d
   
   # Option B: Without PostgreSQL (if using external database)
   # First remove postgres service from docker-compose.yml
   # Then update DATABASE_URL in backend-go service
   docker-compose up -d
   ```

### Manual Setup (Development)

#### Database Setup
Choose one of these options:

**Option A: Use Docker PostgreSQL (Recommended)**
```bash
# PostgreSQL is included in docker-compose.yml
# Just run: docker-compose up postgres -d
```

**Option B: Use External PostgreSQL**
- Install PostgreSQL locally or use existing instance
- Create database `ai_pdf_management`
- Ensure credentials: `postgres:postgres` on port 5432
- Or update DATABASE_URL in docker-compose.yml to match your setup

**Option C: Standalone PostgreSQL Container**
```bash
docker run --name postgres-ai-pdf \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_pdf_management \
  -p 5432:5432 \
  -d postgres:latest
```

#### Go Backend
```bash
cd "backend - go"
go mod tidy
go run migrate/main.go  # Run database migration
go run main.go          # Start the server
```

#### Python Backend
```bash
cd "backend - python"
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 API Endpoints

### Go Backend (Port 8080)

#### PDF Management
- `GET /ping` - Health check
- `GET /pdf` - List PDFs with pagination
- `POST /pdf` - Create PDF record manually
- `GET /pdf/:id` - Get PDF details with summaries
- `DELETE /pdf/:id` - Delete PDF
- `POST /pdf/upload` - Upload PDF file
- `POST /pdf/:id/summarize` - Generate AI summary

#### Summary Management
- `GET /summaries` - List summaries with pagination
- `GET /summaries/:id` - Get summary details
- `DELETE /summaries/:id` - Delete summary

### Python Backend (Port 8000)

- `GET /` - Health check
- `GET /health` - Detailed health check
- `POST /summarize` - Generate PDF summary with AI

## 📊 Database Schema

### PDF Model
```go
type PDF struct {
    gorm.Model
    Filename  string
    FileSize  int64
    Title     string
    PageCount int
    Summaries []Summaries
}
```

### Summary Model
```go
type Summaries struct {
    gorm.Model
    Style       string
    Content     string
    PDFID       uint
    Language    string
    SummaryTime float64
}
```

## 🎯 API Usage Examples

### Upload PDF
```bash
curl -X POST http://localhost:8080/pdf/upload \
  -F "file=@document.pdf" \
  -F "title=My Document"
```

### Generate Summary
```bash
curl -X POST http://localhost:8080/pdf/1/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "style": "general",
    "language": "english"
  }'
```

### List PDFs
```bash
curl "http://localhost:8080/pdf?page=1&itemsperpage=10&search=document"
```

## 🔧 Configuration

### Environment Variables

#### Python Backend (.env)
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

#### Docker Compose
- **PostgreSQL**: Run separately using Docker or local installation (see setup instructions above)
- Go Backend: `localhost:8080`
- Python Backend: `localhost:8000`
- Frontend: `localhost:3000`

## 🧪 Testing

### API Testing Collections

This project includes comprehensive API testing collections using [Bruno](https://www.usebruno.com/) - a fast and Git-friendly alternative to Postman.

#### Go Backend API Collection (`collection - go/`)
Tests for the Go backend (Port 8080):
- **Ping**: Health check endpoint
- **Upload PDF**: File upload with validation
- **Get All PDFs**: List PDFs with pagination and search
- **Get PDF Details**: Individual PDF information with summaries
- **Generate Summary**: AI-powered summary generation
- **Delete PDF**: PDF deletion with cleanup

#### Python Backend API Collection (`collection- python/`)
Tests for the Python backend (Port 8000):
- **Health Check**: Service availability check
- **Root**: Basic endpoint verification
- **Summarize**: Direct AI summarization service

### Getting Started with Bruno

1. **Download Bruno**: Visit [https://www.usebruno.com/](https://www.usebruno.com/) to download the Bruno API client
2. **Open Collection**: 
   - Launch Bruno
   - Click "Open Collection"
   - Navigate to either `collection - go/` or `collection- python/` directory
3. **Configure Environment**: Update base URLs if needed (default: localhost)
4. **Run Tests**: Execute individual requests or run the entire collection

### Test Environment Setup

Ensure your services are running before testing:
```bash
# Start all services
docker-compose up -d

# Or start individually
docker-compose up postgres -d
docker-compose up backend-go -d
docker-compose up backend-python -d
```

Default endpoints:
- Go Backend: `http://localhost:8080`
- Python Backend: `http://localhost:8000`

## 📝 Development Notes

### Summary Styles
- **Short**: Brief overview of the document
- **General**: Moderate-length summary with main points
- **Detailed**: In-depth summary with key explanations

### Supported Languages
- **Indonesian**: Bahasa Indonesia responses
- **English**: English responses

### File Upload
- Supported format: PDF only
- Files stored in `backend - go/uploads/` directory
- Automatic UUID-based filename generation
- Page count extraction using npdfpages

## 🚀 Deployment

### Quick Start with Docker Compose

**Option A: With included PostgreSQL (Recommended)**
```bash
# Start all services including PostgreSQL
docker-compose up -d --build
```

**Option B: With external PostgreSQL**
1. **Remove PostgreSQL from docker-compose.yml**
   ```yaml
   # Comment out or remove the postgres service section
   ```

2. **Update backend-go DATABASE_URL**
   ```yaml
   environment:
     - DATABASE_URL=postgres://your_user:your_password@your_host:5432/ai_pdf_management?sslmode=disable
   ```

3. **Start services**
   ```bash
   docker-compose up -d --build
   ```

Services will be available at:
- Frontend: http://localhost:3000
- Go API: http://localhost:8080
- Python API: http://localhost:8000

### Database Connection Details
**Default configuration (included PostgreSQL):**
- Host: `postgres` (container name) or `localhost` (external access)
- Port: `5432`
- Database: `ai_pdf_management`
- Username: `postgres`
- Password: `postgres`

**For external PostgreSQL:**
Update the `DATABASE_URL` environment variable in docker-compose.yml:
```yaml
environment:
  - DATABASE_URL=postgres://username:password@host:port/database_name?sslmode=disable
```
