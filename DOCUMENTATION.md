# Chat With PDF - Project Documentation

## Overview
This project is a "Chat With PDF" application that allows users to upload multiple documents (PDF, DOCX, TXT, CSV) and interact with them using an AI-powered chat interface. It features advanced capabilities such as multi-document support, citation highlighting, and real-time previews.

## Architecture
The application follows a microservices-like architecture with three main components:

1.  **Frontend (`/frontend`)**: A modern web interface built with Next.js.
2.  **Backend (`/backend`)**: A robust backend service built with CodeIgniter 4 (PHP).
3.  **AI Service (`/ai-python`)**: A dedicated Python service for PDF processing and LLM interactions.

## Technology Stack

### Frontend
-   **Framework**: Next.js 15 (React 18)
-   **Styling**: Tailwind CSS 4
-   **UI Components**: Radix UI, Lucide React
-   **State Management**: React Hooks
-   **Language**: TypeScript

### Backend
-   **Framework**: CodeIgniter 4
-   **Language**: PHP 8.1+
-   **Authentication**: JWT (firebase/php-jwt)
-   **Database**: (Implied MySQL/MariaDB based on typical CodeIgniter usage, to be confirmed)

### AI Service
-   **Language**: Python
-   **Orchestration**: LangChain
-   **LLM Provider**: Groq (Llama 3.3 70B Versatile, Llama 3.1 8B Instant)
-   **Embeddings**: HuggingFace (Sentence Transformers)
-   **PDF Processing**: pdfplumber, pypdfium2, pdfminer.six
-   **Database**: SQLAlchemy (likely for vector storage or metadata)

## Key Features
-   **Multi-Document Chat**: Select and chat with multiple documents (PDF, DOCX, TXT, CSV) simultaneously.
-   **Document Selection**: Dynamically select or deselect specific documents in the sidebar to control which files the AI uses for context.
-   **Real-time Preview**: Split-screen view with chat and PDF side-by-side.
-   **Citation Highlighting**: Clickable references in chat responses that highlight the source text in the PDF.
-   **Session Management**: Save and resume chat sessions.

## Setup & Installation

### 1. Database Setup
The project uses a PostgreSQL database (Neon DB) for the AI service and likely a MySQL/MariaDB database for the PHP backend.
-   Ensure you have the connection details for your Neon DB instance.
-   Ensure you have a local or remote MySQL instance running for CodeIgniter.

### 2. Backend (CodeIgniter 4)
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    composer install
    ```
3.  Configure Environment:
    -   Copy `env` to `.env`.
    -   Update database credentials:
        ```ini
        database.default.hostname = localhost
        database.default.database = chat_pdf_db
        database.default.username = root
        database.default.password =
        database.default.DBDriver = MySQLi
        ```
    -   Set `CI_ENVIRONMENT = development`.
4.  Run Migrations (if applicable):
    ```bash
    php spark migrate
    ```
5.  Start the server:
    ```bash
    php spark serve
    ```
    The backend will run on `http://localhost:8080`.

### 3. AI Service (Python)
1.  Navigate to the AI service directory:
    ```bash
    cd ai-python
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # Windows: .venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Install Tesseract OCR:
    -   Download and install Tesseract.
    -   Note the installation path (e.g., `C:\Program Files\Tesseract-OCR\tesseract.exe`).
5.  Configure Environment:
    -   Create a `.env` file with the following:
        ```ini
        DB_HOST=your_neon_host
        DB_NAME=neondb
        DB_USER=your_user
        DB_PASSWORD=your_password
        GROQ_API_KEY=your_groq_api_key
        TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
        ```
6.  Start the service:
    ```bash
    python app/app.py
    ```
    The AI service will run on `http://localhost:5000`.

### 4. Frontend (Next.js)
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    -   Create `.env.local`:
        ```ini
        NEXT_PUBLIC_API_URL=http://localhost:8080/api
        ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will run on `http://localhost:3000`.

## API Documentation
For detailed information about the API endpoints, request/response formats, and authentication, please refer to the **[API Documentation](API_DOCUMENTATION.md)**.

## Troubleshooting

### Common Issues
1.  **CORS Errors**:
    -   Ensure the backend `Routes.php` has the correct CORS headers configured for `http://localhost:3000`.
    -   Check if the browser console shows "Access-Control-Allow-Origin" errors.

2.  **Tesseract Not Found**:
    -   Verify `TESSERACT_PATH` in `ai-python/.env` points to the correct executable.
    -   Ensure Tesseract is installed on the system.

3.  **Database Connection Failed**:
    -   Check `backend/.env` for MySQL credentials.
    -   Check `ai-python/.env` for Neon DB credentials.
    -   Ensure the database servers are running and accessible.

4.  **PDF Processing Stuck**:
    -   Check the `ai-python` console logs for errors.
    -   Ensure the `uploads` directory exists and is writable in both backend and AI service paths.
