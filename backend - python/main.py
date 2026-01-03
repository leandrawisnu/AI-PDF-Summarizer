from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
from dotenv import load_dotenv
from enum import Enum
import google.generativeai as genai
import io
import PyPDF2
import re
import os
import time

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Configure Gemini API
if api_key:
    genai.configure(api_key=api_key)
else:
    print("Warning: GEMINI_API_KEY not found in environment variables")


# Enum for summary style
class Style(str, Enum):
    SHORT = "short"
    GENERAL = "general"
    DETAILED = "detailed"
    
# Enum for summary language
class Language(str, Enum):
    IND = "indonesian"
    ENG = "english"


# Initialize FastAPI app
app = FastAPI(
    title="PDF AI Summarizer API",
    description="API for uploading and summarizing PDF documents",
    version="1.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure the Gemini API
# You'll need to set your API key in environment variables
genai.configure(api_key=api_key)

# For now, we'll initialize without the client since API key setup is needed

# Allowed file types
ALLOWED_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "PDF AI Summarizer API is running"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "PDF AI Summarizer API",
        "version": "1.0.0"
    }

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text content from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error extracting text from PDF: {str(e)}"
        )

def count_words(text: str) -> dict:
    """
    Count words in text and return detailed statistics
    
    Args:
        text: The text to analyze
        
    Returns:
        Dictionary with word count statistics
    """
    if not text:
        return {
            "total_words": 0,
            "unique_words": 0,
            "characters": 0,
            "characters_no_spaces": 0,
            "sentences": 0,
            "paragraphs": 0
        }
    
    # Clean text and split into words
    words = re.findall(r'\b\w+\b', text.lower())
    
    # Count sentences (rough estimate)
    sentences = len(re.findall(r'[.!?]+', text))
    
    # Count paragraphs (double newlines or more)
    paragraphs = len(re.split(r'\n\s*\n', text.strip())) if text.strip() else 0
    
    return {
        "total_words": len(words),
        "unique_words": len(set(words)),
        "characters": len(text),
        "characters_no_spaces": len(text.replace(' ', '')),
        "sentences": sentences,
        "paragraphs": paragraphs
    }

def estimate_reading_time(word_count: int, wpm: int = 200) -> str:
    """
    Estimate reading time based on word count
    
    Args:
        word_count: Number of words
        wpm: Words per minute (default 200)
        
    Returns:
        Formatted reading time string
    """
    if word_count == 0:
        return "0 minutes"
    
    minutes = word_count / wpm
    
    if minutes < 1:
        return "Less than 1 minute"
    elif minutes < 60:
        return f"{int(minutes)} minute{'s' if int(minutes) != 1 else ''}"
    else:
        hours = int(minutes // 60)
        remaining_minutes = int(minutes % 60)
        if remaining_minutes == 0:
            return f"{hours} hour{'s' if hours != 1 else ''}"
        else:
            return f"{hours} hour{'s' if hours != 1 else ''} {remaining_minutes} minute{'s' if remaining_minutes != 1 else ''}"

def chunk_text(text: str, max_chunk_size: int = 8000, overlap: int = 200) -> list:
    """
    Split text into overlapping chunks for better processing
    
    Args:
        text: The text to chunk
        max_chunk_size: Maximum characters per chunk
        overlap: Number of characters to overlap between chunks
        
    Returns:
        List of text chunks
    """
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        # Find the end of this chunk
        end = start + max_chunk_size
        
        # If we're not at the end of the text, try to break at a sentence or paragraph
        if end < len(text):
            # Look for sentence endings within the last 200 characters
            sentence_end = text.rfind('.', start + max_chunk_size - 200, end)
            if sentence_end != -1 and sentence_end > start:
                end = sentence_end + 1
            else:
                # Look for paragraph breaks
                para_break = text.rfind('\n\n', start + max_chunk_size - 200, end)
                if para_break != -1 and para_break > start:
                    end = para_break + 2
                else:
                    # Look for any line break
                    line_break = text.rfind('\n', start + max_chunk_size - 100, end)
                    if line_break != -1 and line_break > start:
                        end = line_break + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move start position with overlap
        start = end - overlap if end < len(text) else end
        
        # Prevent infinite loop
        if start >= len(text):
            break
    
    return chunks

def summarize_chunks(chunks: list, style: str, language: str) -> str:
    """
    Summarize multiple chunks and combine them into a final summary
    
    Args:
        chunks: List of text chunks
        style: Summary style (short, general, detailed)
        language: Language for summary
        
    Returns:
        Combined summary
    """
    if not chunks:
        return "No content to summarize."
    
    # If only one chunk, summarize directly
    if len(chunks) == 1:
        return summarize_single_chunk(chunks[0], style, language)
    
    # Summarize each chunk first
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        try:
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
            response = model.generate_content(
                f"""
                You are summarizing part {i+1} of {len(chunks)} from a PDF document.
                
                Instructions:
                - Create a concise summary of this section
                - Focus on key points and main ideas
                - Keep it factual and based only on the provided content
                - Language: {language}
                
                Content to summarize:
                {chunk}
                """,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.5,
                    top_k=1,
                    top_p=1,
                    max_output_tokens=1024,
                )
            )
            chunk_summaries.append(response.text)
        except Exception as e:
            chunk_summaries.append(f"Error summarizing section {i+1}: {str(e)}")
    
    # Combine chunk summaries into final summary
    combined_text = "\n\n".join(chunk_summaries)
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        response = model.generate_content(
            f"""
            You are creating a final summary from multiple section summaries of a PDF document.
            
            Instructions:
            - Combine the section summaries into one coherent summary
            - Remove redundancy and organize information logically
            - Maintain all important information from the sections
            - Follow the requested style and language
            
            Summary style: {style}
            - short: very brief summary of the document content
            - general: moderate-length summary covering main points and function of the document
            - detailed: in-depth summary with key explanations and important details
            
            Language: {language}
            - indonesian: respond in Bahasa Indonesia
            - english: respond in English
            
            Section summaries to combine:
            {combined_text}
            """,
            generation_config=genai.types.GenerationConfig(
                temperature=0.5,
                top_k=1,
                top_p=1,
                max_output_tokens=2048,
            )
        )
        return response.text
    except Exception as e:
        return f"Error creating final summary: {str(e)}\n\nSection summaries:\n{combined_text}"

def summarize_single_chunk(text: str, style: str, language: str) -> str:
    """
    Summarize a single chunk of text
    
    Args:
        text: Text to summarize
        style: Summary style
        language: Language for summary
        
    Returns:
        Summary text
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        response = model.generate_content(
            f"""
            You are an AI assistant tasked with summarizing PDF documents using retrieved context (RAG).

            Instructions:
            - Summarize the content clearly and accurately based ONLY on the provided PDF content.
            - Do NOT add information that is not present in the document.

            Summary styles:
            - short: very brief summary of the section.
            - general: moderate-length summary covering main points and function of the section.
            - detailed: in-depth summary with key explanations and important details.

            Languages:
            - indonesian: respond in Bahasa Indonesia.
            - english: respond in English.

            Selected options:
            - Summary style: {style}
            - Language: {language}

            PDF content:
            {text}
            """,
            generation_config=genai.types.GenerationConfig(
                temperature=0.5,
                top_k=1,
                top_p=1,
                max_output_tokens=2048,
            )
        )
        return response.text
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def validate_pdf_file(file: UploadFile) -> bool:
    """Validate if uploaded file is a PDF"""
    # Check file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        return False
    
    # Skip MIME type check for now since multipart forms from Go backend
    # might not set the correct content type
    if file.content_type != "application/pdf":
        return False
    
    return True

@app.post("/summarize")
async def summarize_pdf(file: UploadFile = File(...), style: Style = Form(...), language: Language = Form(...)):
    """
    Upload and summarize a PDF file in one step
    
    Args:
        file: PDF file to upload and process
        
    Returns:
        JSON response with summary data
    """
    try:
        # Start timing the processing
        start_time = time.time()
        
        # Read file content
        file_content = await file.read()
        
        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB."
            )

        pdf_text = extract_text_from_pdf(file_content)
        
        # Extract word count and statistics from the actual PDF text
        word_stats = count_words(pdf_text)
        reading_time = estimate_reading_time(word_stats["total_words"])
        
        # For now, return mock data
        file_size_mb = len(file_content) / (1024 * 1024)

        # Generate summary using Gemini API with chunking
        try:
            # Split text into chunks if it's too long
            chunks = chunk_text(pdf_text)
            
            print(f"Processing {len(chunks)} chunks for summarization")
            
            # Summarize using chunking strategy
            ai_summary = summarize_chunks(chunks, style.value, language.value)
            
        except Exception as e:
            # Fallback to a basic summary if AI fails
            ai_summary = f"AI summarization unavailable. Document contains {word_stats['total_words']} words across {word_stats['paragraphs']} paragraphs. Error: {str(e)}"
        
        # Split text into chunks for processing info
        chunks = chunk_text(pdf_text)
        
        # Calculate processing time
        end_time = time.time()
        processing_time = round(end_time - start_time, 2)
        
        mock_summary = {
            "title": Path(file.filename).stem,
            "summary": {
                "main_summary": ai_summary,
                "word_count": word_stats["total_words"],
                "reading_time": reading_time,
            },
            "language": language,
            "style": style,
            "file_info": {
                "original_filename": file.filename,
                "file_size": len(file_content),
                "file_size_mb": round(file_size_mb, 2)
            },
            "text_statistics": word_stats,
            "processing_info": {
                "chunks_processed": len(chunks),
                "chunking_used": len(chunks) > 1,
                "processing_time_seconds": processing_time
            },
            "status": "completed"
        }
        
        return JSONResponse(
            status_code=200,
            content=mock_summary
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the file: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)