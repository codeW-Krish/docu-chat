# Chat With PDF - API Documentation

This document details the API endpoints for the "Chat With PDF" application. The backend is built with CodeIgniter 4 and communicates with a Python AI service.

## Base URL
`http://localhost:8080` (Default CodeIgniter port)

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header for protected routes.

**Header Format:**
```
Authorization: Bearer <your_token>
```

---

## 1. Authentication Endpoints

### Register User
Create a new user account.

-   **URL**: `/auth/register`
-   **Method**: `POST`
-   **Content-Type**: `application/json`
-   **Body**:
    ```json
    {
        "email": "user@example.com",
        "password": "securepassword",
        "name": "John Doe"
    }
    ```
-   **Success Response (200)**:
    ```json
    {
        "status": "success",
        "message": "User registered successfully",
        "data": {
            "tokens": { "access_token": "...", "refresh_token": "..." },
            "user": { "user_id": "...", "email": "...", "name": "..." }
        }
    }
    ```

### Login
Authenticate an existing user.

-   **URL**: `/auth/login`
-   **Method**: `POST`
-   **Content-Type**: `application/json`
-   **Body**:
    ```json
    {
        "email": "user@example.com",
        "password": "securepassword"
    }
    ```
-   **Success Response (200)**:
    ```json
    {
        "status": "success",
        "message": "Login successful",
        "data": {
            "tokens": { "access_token": "...", "refresh_token": "..." },
            "user": { ... }
        }
    }
    ```

### Logout
Invalidate the current session (client-side token removal recommended).

-   **URL**: `/auth/logout`
-   **Method**: `POST`

---

## 2. PDF Management Endpoints (Protected)

### Upload Document
Upload a document (PDF, DOCX, TXT, CSV) for processing.

-   **URL**: `/api/pdfs/upload`
-   **Method**: `POST`
-   **Content-Type**: `multipart/form-data`
-   **Body**:
    -   `file`: (File) The document file to upload (PDF, DOCX, PPTX, TXT, CSV).
    -   `user_id`: (String) The ID of the user uploading the file.
-   **Success Response (200)**:
    ```json
    {
        "status": "success",
        "message": "Document uploaded successfully. Processing started.",
        "data": {
            "pdf_id": "...",
            "file_name": "document.pdf",
            "processing_status": "processing"
        }
    }
    ```

### Get User PDFs
Retrieve a list of all PDFs uploaded by the authenticated user.

-   **URL**: `/api/pdfs`
-   **Method**: `GET`
-   **Success Response (200)**:
    ```json
    {
        "status": "success",
        "data": [
            {
                "pdf_id": "...",
                "file_name": "doc1.pdf",
                "processing_status": "completed",
                "uploaded_at": "..."
            },
            ...
        ]
    }
    ```

### Get PDF Status
Check the processing status of a specific PDF.

-   **URL**: `/api/pdfs/{pdf_id}`
-   **Method**: `GET`

### Delete PDF
Remove a PDF and its associated data.

-   **URL**: `/api/pdfs/{pdf_id}`
-   **Method**: `DELETE`

---

## 3. Chat Endpoints (Protected)

### Create Chat Session
Start a new chat session with one or more PDFs.

-   **URL**: `/api/chat/sessions`
-   **Method**: `POST`
-   **Content-Type**: `application/json`
-   **Body**:
    ```json
    {
        "session_name": "Research Project A",
        "pdf_ids": ["pdf_id_1", "pdf_id_2"]
    }
    ```
-   **Success Response (200)**:
    ```json
    {
        "status": "success",
        "message": "Chat session created successfully",
        "data": {
            "session_id": "...",
            "session_name": "Research Project A"
        }
    }
    ```

### Get Chat Sessions
List all chat sessions for the user.

-   **URL**: `/api/chat/sessions`
-   **Method**: `GET`

### Get Session Messages
Retrieve the message history for a specific session.

-   **URL**: `/api/chat/sessions/{session_id}/messages`
-   **Method**: `GET`

### Add PDFs to Session
Add one or more PDFs to an existing chat session.

-   **URL**: `/api/chat/sessions/{session_id}/pdfs`
-   **Method**: `POST`
-   **Content-Type**: `application/json`
-   **Body**:
    ```json
    {
        "pdf_ids": ["pdf_id_3", "pdf_id_4"]
    }
    ```
-   **Success Response (200)**:
    ```json
    {
        "status": "success",
        "message": "PDFs added to session successfully"
    }
    ```

### Remove PDF from Session
Remove a specific PDF from a chat session.

-   **URL**: `/api/chat/sessions/{session_id}/pdfs/{pdf_id}`
-   **Method**: `DELETE`
-   **Success Response (200)**:
    ```json
    {
        "status": "success",
        "message": "PDF removed from session successfully"
    }
    ```

### Send Message
Send a message to the AI in a specific session.

-   **URL**: `/api/chat/message`
-   **Method**: `POST`
-   **Content-Type**: `application/json`
-   **Body**:
    ```json
    {
        "session_id": "...",
        "message": "Summarize the key findings of this paper.",
        "pdf_ids": ["pdf_id_1", "pdf_id_2"]
    }
    ```
    -   `pdf_ids` (Optional): Array of PDF IDs to filter the context. If omitted, all session PDFs are used.
-   **Success Response (200)**:
    ```json
    {
        "status": "success",
        "data": {
            "user_message": "...",
            "ai_response": "The paper discusses...",
            "references": [
                {
                    "pdf_id": "...",
                    "page_number": 5,
                    "text_snippet": "..."
                }
            ]
        }
    }
    ```

---

## 4. Python AI Service Endpoints (Internal)
These endpoints are primarily used by the PHP backend but can be accessed directly for debugging.

-   **Base URL**: `http://localhost:5000`

### Health Check
-   **URL**: `/health`
-   **Method**: `GET`

### Process PDF
-   **URL**: `/process-pdf`
-   **Method**: `POST`
-   **Body**: `{"pdf_path": "...", "pdf_id": "...", "user_id": "..."}`

### Chat
-   **URL**: `/chat`
-   **Method**: `POST`
-   **Body**: `{"question": "...", "pdf_ids": [...], "user_id": "...", "session_id": "...", "conversation_history": [...]}`
