# System Workflow Diagrams

This document visualizes the key workflows of the "Chat With PDF" application, mapping user actions to specific files and API endpoints.

## 1. High-Level System Architecture

This diagram shows the overall structure of the application and how the different components interact.

```mermaid
graph TD
    subgraph Client ["Client Side"]
        Browser["Web Browser"]
    end

    subgraph Frontend ["Frontend (Next.js)"]
        UI["User Interface (React)"]
        APIRoute["API Routes / Handlers"]
    end

    subgraph Backend ["Backend (CodeIgniter 4)"]
        Router["Router (Routes.php)"]
        Controllers["Controllers (Auth, Pdf, Chat)"]
        Models["Models (User, Pdf, ChatSession)"]
    end

    subgraph AI_Service ["AI Service (Python)"]
        Flask["Flask API"]
        PDFProc["Document Processor (pdfplumber/docx2txt)"]
        RAG["RAG Engine (LangChain)"]
    end

    subgraph External ["External Services"]
        Groq["Groq API (LLM)"]
        HF["HuggingFace (Embeddings)"]
    end

    Browser <-->|HTTP/JSON| UI
    UI <-->|Next.js Server Actions/API| APIRoute
    APIRoute <-->|REST API| Router
    Router --> Controllers
    Controllers --> Models
    Models <--> PostgreSQL
    Controllers -->|Uploads| FS
    Controllers <-->|Internal API| Flask
    
    Flask --> PDFProc
    PDFProc -->|Read| FS
    Flask --> RAG
    RAG <-->|Embeddings| HF
    RAG <-->|Vectors| Neon
    RAG <-->|Inference| Groq
    
    subgraph Data ["Data Storage"]
        PostgreSQL[("PostgreSQL Database (Metadata)")]
        Neon[("Neon PgVector (Vector Store)")]
        FS[("File System (PDFs)")]
    end
```

## 2. Activity Diagram: Chat with PDF

This diagram details the step-by-step logic flow when a user sends a message to the chat.

```mermaid
flowchart TD
    Start([User Sends Message]) --> Validate{Validate Request}
    
    Validate -- Invalid --> Error[Return 400 Error]
    Validate -- Valid --> CheckSession{Check Session Access}
    
    CheckSession -- Denied --> AuthError[Return 403 Forbidden]
    CheckSession -- Allowed --> GetPDFs[Fetch Session PDF IDs]
    
    GetPDFs --> SaveUserMsg[Save User Message to DB]
    SaveUserMsg --> FetchHistory[Fetch Conversation History]
    
    FetchHistory --> CallAI[Call Python AI Service]
    
    subgraph AI_Processing [AI Service Processing]
        CallAI --> GenQueryVec[Generate Query Vector]
        GenQueryVec --> SearchDB[Search Vector DB]
        SearchDB --> RetrieveChunks[Retrieve Relevant Chunks]
        RetrieveChunks --> ConstructPrompt[Construct LLM Prompt]
        ConstructPrompt --> CallLLM[Call Groq LLM]
        CallLLM --> GenAnswer[Generate Answer]
    end
    
    GenAnswer --> ReturnAI[Return Answer + Citations]
    
    ReturnAI --> SaveAIMsg[Save AI Message to DB]
    SaveAIMsg --> FormatResp[Format JSON Response]
    FormatResp --> End([Send Response to User])
```

## 3. Document Upload & Processing Workflow


This flow describes how a document is uploaded, stored, and processed for AI interaction.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend (Next.js)
    participant Backend as Backend (CodeIgniter)
    participant DB as Database (PostgreSQL)
    participant AI as AI Service (Python)
    participant VectorDB as Vector Store (Neon PgVector)

    User->>Frontend: Selects File & Clicks Upload
    Note over Frontend: File: app/chat/page.tsx
    
    Frontend->>Backend: POST /api/pdfs/upload
    Note over Backend: Controller: App\Controllers\PdfController::upload
    
    Backend->>Backend: Validate File & Generate UUID
    Backend->>FileSystem: Save File to /uploads
    Backend->>DB: Insert Document Metadata (status: pending)
    
    Backend->>AI: POST /process-pdf
    Note over AI: File: app/app.py (process_pdf)
    
    Backend-->>Frontend: Return Success (status: processing)
    
    activate AI
    AI->>AI: Extract Text (pdfplumber/python-pptx)
    Note over AI: File: app/pdf_processor.py
    
    AI->>AI: Generate Embeddings (HuggingFace)
    AI->>VectorDB: Store Vectors
    
    AI-->>Backend: Return Processing Result
    deactivate AI
    
    Backend->>DB: Update Document Status (status: completed)
```

## 4. Chat Interaction Workflow (Sequence)

This flow illustrates how a user's question is processed to generate a context-aware response.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend (Next.js)
    participant Backend as Backend (CodeIgniter)
    participant DB as Database (PostgreSQL)
    participant AI as AI Service (Python)
    participant VectorDB as Vector Store (Neon PgVector)
    participant LLM as LLM Provider (Groq)

    User->>Frontend: Sends Message
    Note over Frontend: File: app/chat/[sessionId]/page.tsx
    
    Frontend->>Backend: POST /api/chat/message
    Note over Backend: Controller: App\Controllers\ChatController::sendMessage
    
    Backend->>DB: Verify Session & Save User Message
    Backend->>DB: Fetch Session PDF IDs (Filter by User Selection)
    
    Backend->>AI: POST /chat
    Note over AI: File: app/app.py (chat)
    
    activate AI
    AI->>VectorDB: Search Similar Chunks (RAG)
    VectorDB-->>AI: Return Relevant Context
    
    AI->>LLM: Send Prompt + Context + History
    Note over AI: File: app/ai_generator.py
    
    LLM-->>AI: Return Generated Answer
    
    AI-->>Backend: Return Answer + Citations
    deactivate AI
    
    Backend->>DB: Save AI Response & References
    Backend-->>Frontend: Return JSON Response
    
    Frontend->>User: Display Message & Highlight Citations
```

## 5. ER Diagram (Chen Notation)

This diagram represents the database entities, their attributes, and relationships based on the exact SQL schema.

```mermaid
flowchart TD
    %% Entities
    User[User]
    Pdf[Pdf]
    PdfChunk[PdfChunk]
    PdfChunkEmbedding[PdfChunkEmbedding]
    ChatSession[ChatSession]
    ChatMessage[ChatMessage]
    UserRefreshToken[UserRefreshToken]

    %% Styles
    classDef entity fill:#f9f,stroke:#333,stroke-width:2px;
    classDef attribute fill:#fff,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;
    classDef relationship fill:#9f9,stroke:#333,stroke-width:2px,shape:diamond;

    class User,Pdf,PdfChunk,PdfChunkEmbedding,ChatSession,ChatMessage,UserRefreshToken entity;

    %% User Attributes
    User_ID([user_id]) --- User
    User_Email([email]) --- User
    User_Pass([password_hash]) --- User
    User_Name([name]) --- User
    User_Created([created_at]) --- User

    %% Pdf Attributes
    Pdf_ID([pdf_id]) --- Pdf
    Pdf_FileName([file_name]) --- Pdf
    Pdf_FilePath([file_path]) --- Pdf
    Pdf_Hash([file_hash]) --- Pdf
    Pdf_Size([file_size]) --- Pdf
    Pdf_PageCount([page_count]) --- Pdf
    Pdf_Status([processing_status]) --- Pdf
    Pdf_Uploaded([uploaded_at]) --- Pdf

    %% PdfChunk Attributes
    Chunk_ID([chunk_id]) --- PdfChunk
    Chunk_Index([chunk_index]) --- PdfChunk
    Chunk_Page([page_number]) --- PdfChunk
    Chunk_Text([chunk_text]) --- PdfChunk
    Chunk_Start([start_char]) --- PdfChunk
    Chunk_End([end_char]) --- PdfChunk

    %% PdfChunkEmbedding Attributes
    Embed_ID([chunk_id]) --- PdfChunkEmbedding
    Embed_Vector([embedding]) --- PdfChunkEmbedding
    Embed_Text([chunk_text]) --- PdfChunkEmbedding

    %% ChatSession Attributes
    Session_ID([session_id]) --- ChatSession
    Session_Name([session_name]) --- ChatSession
    Session_Created([created_at]) --- ChatSession

    %% ChatMessage Attributes
    Msg_ID([message_id]) --- ChatMessage
    Msg_Sender([sender]) --- ChatMessage
    Msg_Text([message_text]) --- ChatMessage
    Msg_Refs([references_data]) --- ChatMessage
    Msg_Created([created_at]) --- ChatMessage

    %% UserRefreshToken Attributes
    Token_ID([token_id]) --- UserRefreshToken
    Token_Val([refresh_token]) --- UserRefreshToken
    Token_Exp([expires_at]) --- UserRefreshToken

    %% Relationships
    User -- 1 --> Uploads{Uploads} -- N --> Pdf
    User -- 1 --> Creates{Creates} -- N --> ChatSession
    User -- 1 --> Has{Has} -- N --> UserRefreshToken
    
    Pdf -- 1 --> Contains{Contains} -- N --> PdfChunk
    PdfChunk -- 1 --> HasEmbedding{Has} -- 1 --> PdfChunkEmbedding
    
    ChatSession -- 1 --> Includes{Includes} -- N --> ChatMessage
    ChatSession -- M --> References{References} -- N --> Pdf

    class Uploads,Creates,Has,Contains,HasEmbedding,Includes,References relationship;
```

## Key Components Map

| Component | Technology | Key Files |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 | `app/chat/page.tsx`, `app/chat/[sessionId]/page.tsx`, `lib/api.ts` |
| **Backend** | CodeIgniter 4 | `app/Config/Routes.php`, `app/Controllers/PdfController.php`, `app/Controllers/ChatController.php` |
| **AI Service** | Python (Flask) | `app/app.py`, `app/pdf_processor.py`, `app/ai_generator.py` |
