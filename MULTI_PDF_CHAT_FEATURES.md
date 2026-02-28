# Multi-Document Chat Features

## Overview
This document describes the new multi-document chat functionality that allows users to select multiple files (PDF, DOCX, PPTX, TXT, CSV) and chat with them simultaneously, with advanced features like preview, citation highlighting, and reference tracking.

## New Features Implemented

### 1. PDF Selection Page (`/chat`)
- **Location**: `frontend/app/chat/page.tsx`
- **Features**:
  - Browse all uploaded PDFs with search functionality
  - Multi-select PDFs using checkboxes
  - Real-time selection counter
  - PDF status indicators (completed, processing, failed)
  - Session name input
  - Create chat session with selected PDFs

### 2. Enhanced Chat Interface (`/chat/[sessionId]`)
- **Location**: `frontend/app/chat/[sessionId]/page.tsx`
- **Features**:
  - Split-screen layout with PDF preview and chat
  - Toggle PDF preview visibility
  - Real-time messaging with AI
  - Citation highlighting and reference tracking
  - PDF switching within the session
  - **Responsive Design**: Mobile-friendly sidebar and layout

### 3. PDF Viewer Component
- **Location**: `frontend/components/pdf-viewer.tsx`
- **Features**:
  - PDF page navigation (previous/next)
  - Zoom controls (50% - 200%)
  - Rotation functionality
  - Highlighted reference display
  - Placeholder rendering for non-PDF files (PPTX, DOCX)
  - Error handling and loading states

### 4. Updated API Types
- **Location**: `frontend/lib/api.ts`
- **New Types**:
  - `PdfReference`: Structure for citation references
  - Updated `ChatMessage` to include `PdfReference[]`
  - Enhanced type safety for multi-PDF operations

## Key Features

### Multi-PDF Selection
- Users can select multiple PDFs when creating a chat session
- Search functionality to quickly find specific PDFs
- Visual indicators for PDF processing status
- Session name customization

### PDF Preview & Navigation
- Side-by-side PDF preview and chat interface
- PDF list with quick switching between documents
- Page navigation within selected PDF
- Zoom and rotation controls
- Toggle visibility for more chat space

### Citation Highlighting
- Click on references to highlight relevant content
- Automatic PDF switching to referenced document
- Page navigation to specific reference location
- Visual highlighting of cited content
- Similarity scores for reference relevance

### Enhanced Chat Experience
- Real-time messaging with AI
- Reference tracking with clickable citations
- Source document information
- Similarity scores for transparency
- Responsive design for different screen sizes

## Technical Implementation

### Frontend Architecture
- **React Components**: Modular design with reusable components
- **TypeScript**: Full type safety with comprehensive interfaces
- **Tailwind CSS**: Responsive design with custom styling
- **Lucide Icons**: Consistent iconography throughout

### State Management
- Local state for UI interactions
- API integration for data persistence
- Real-time updates for chat messages
- Reference highlighting state management

### API Integration
- RESTful API calls for PDF and session management
- Real-time chat message handling
- Error handling with user-friendly messages
- Loading states and progress indicators

## Usage Flow

1. **Start New Chat**:
   - Navigate to `/chat` from dashboard
   - Select multiple PDFs using checkboxes
   - Enter session name
   - Click "Create Chat Session"

2. **Chat with PDFs**:
   - View selected PDFs in sidebar
   - Ask questions about the content
   - Click on references to highlight content
   - Switch between PDFs as needed
   - Toggle PDF preview for more chat space

3. **Reference Navigation**:
   - Click on any reference in AI responses
   - PDF automatically switches to referenced document
   - Page navigates to specific reference location
   - Content is highlighted for easy identification

## Future Enhancements

### PDF.js Integration
- Real PDF rendering instead of placeholders
- Text selection and highlighting
- Search within PDF functionality
- Annotation capabilities

### Advanced Citation Features
- Text-based highlighting in actual PDF content
- Multiple reference highlighting
- Reference comparison tools
- Export citations functionality

### Performance Optimizations
- Lazy loading for large PDFs
- Caching for frequently accessed content
- Virtual scrolling for large document sets
- Progressive loading for better UX

## File Structure

```
frontend/
├── app/
│   ├── chat/
│   │   ├── page.tsx                    # PDF selection page
│   │   └── [sessionId]/
│   │       └── page.tsx                # Chat interface
├── components/
│   ├── pdf-viewer.tsx                 # PDF viewer component
│   └── dashboard/
│       └── session-list.tsx           # Updated session list
└── lib/
    └── api.ts                         # Updated API types and methods
```

## Dependencies

The implementation uses existing dependencies:
- React 18+ with TypeScript
- Next.js 14+ for routing
- Tailwind CSS for styling
- Lucide React for icons
- Custom UI components (Button, Card, Input, etc.)

## Testing

To test the new functionality:

1. **Upload PDFs**: Use the dashboard to upload multiple PDFs
2. **Create Session**: Navigate to `/chat` and select multiple PDFs
3. **Chat Interface**: Test the chat functionality with PDF preview
4. **Reference Highlighting**: Click on references to test highlighting
5. **PDF Navigation**: Test PDF switching and page navigation

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- PDF preview is currently placeholder-based
- Real PDF rendering will require PDF.js integration
- Large PDFs may need lazy loading implementation
- Reference highlighting is optimized for small to medium documents

## Security Notes

- All PDF operations are user-scoped
- Session validation ensures proper access control
- File uploads are validated and sanitized
- API endpoints include proper authentication
