# AI PDF Management - Frontend

Next.js frontend application for the AI PDF Management system with AI-powered summarization capabilities.

## Overview

This is a [Next.js](https://nextjs.org) application that provides a modern, responsive interface for managing PDF documents and generating AI-powered summaries using Google Gemini AI.

## Features

- 📄 **PDF Management**: Upload, view, and manage PDF documents
- 🤖 **AI Summarization**: Generate summaries in multiple styles and languages
- 📊 **Summary History**: View and manage all generated summaries
- 🔍 **Search & Filter**: Search through PDFs and summaries
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🎨 **Modern UI**: Built with Tailwind CSS for a clean, modern interface

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Tailwind
- **API Communication**: Fetch API
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend services running (Go API and Python API)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL_GO=http://localhost:8080
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Other Commands

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── page.js              # Home page
│   ├── layout.js            # Root layout
│   ├── documents/           # Documents pages
│   │   ├── page.js         # Documents list
│   │   └── [id]/           # Document detail
│   │       └── page.js     # Document detail page
│   └── summaries/           # Summaries pages
│       └── page.js         # Summaries list
├── components/              # React components
│   ├── DocumentCard.js     # PDF document card
│   ├── SummaryCard.js      # Summary card
│   ├── SummaryHistoryModal.js  # Summary history modal
│   └── ...                 # Other components
├── hooks/                   # Custom React hooks
│   └── useDocuments.js     # Documents data hook
├── lib/                     # Utility libraries
│   └── api.js              # API client functions
├── public/                  # Static assets
└── styles/                  # Global styles
```

## Key Features

### PDF Upload
- Drag & drop or click to upload
- File validation (PDF only, max 10MB)
- Automatic page count detection
- Custom title support

### AI Summarization
Generate summaries with:
- **Styles**: Short, General, Detailed
- **Languages**: English, Indonesian
- Real-time processing status
- Summary history tracking

### Document Management
- List all uploaded PDFs
- Search by title or filename
- Sort by date, size, or page count
- Download original PDFs
- Delete documents

### Summary Management
- View all generated summaries
- Filter by PDF, style, or language
- Search through summary content
- Delete individual summaries
- View summary statistics

## API Integration

The frontend communicates with two backend services:

### Go Backend (Port 8080)
- PDF management (upload, list, delete)
- Summary retrieval and management
- File downloads

### Python Backend (Port 8000)
- AI-powered PDF summarization
- Text extraction and processing

API client is located in `lib/api.js` with functions for all endpoints.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL_GO` | Go backend URL | `http://localhost:8080` |

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling:

- Utility-first CSS framework
- Responsive design out of the box
- Custom color palette
- Dark mode support (optional)

Configuration: `tailwind.config.js`

## Components

### DocumentCard
Displays PDF document information with actions:
- Title and metadata
- Page count and file size
- Upload date
- Actions: View, Download, Delete

### SummaryCard
Shows summary information:
- Summary content
- Style and language
- Processing time
- Related PDF information

### SummaryHistoryModal
Modal for viewing all summaries of a PDF:
- List of all summaries
- Filter by style/language
- View full summary content
- Delete summaries

## Custom Hooks

### useDocuments
Custom hook for managing documents state:
- Fetch documents list
- Handle pagination
- Search and filter
- Loading and error states

## Development

### Code Style
- Use functional components with hooks
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Keep components small and focused

### Best Practices
- Use `'use client'` directive for client components
- Implement proper error handling
- Show loading states
- Validate user input
- Use semantic HTML

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

The build output will be in the `.next` directory.

## Docker Deployment

The frontend is included in the Docker Compose setup:

```bash
# Build and start all services
docker-compose up -d --build

# Frontend will be available at http://localhost:3000
```

## Troubleshooting

### API Connection Issues
- Verify backend services are running
- Check `NEXT_PUBLIC_API_URL_GO` environment variable
- Check browser console for CORS errors

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

### Styling Issues
- Rebuild Tailwind: `npm run build`
- Check `tailwind.config.js` configuration
- Verify Tailwind directives in CSS files

## Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial
- [Next.js GitHub](https://github.com/vercel/next.js) - Feedback and contributions welcome

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

## Deployment

### Vercel (Recommended)
The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy!

[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)

### Other Platforms
- **Docker**: Use included Dockerfile
- **AWS**: Deploy to EC2, ECS, or Amplify
- **Netlify**: Connect GitHub repository
- **Self-hosted**: Build and run with Node.js

## Contributing

When contributing to the frontend:

1. Follow the existing code style
2. Test on multiple screen sizes
3. Ensure accessibility standards
4. Update documentation as needed
5. Test with backend services

## Support

For issues or questions:
- Check the main project README
- Review API documentation
- Check browser console for errors
- Verify backend services are running

## License

Part of the AI PDF Management system.
