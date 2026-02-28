# Chat With PDF - Master Documentation

## Table of Contents

| Sr. No. | Chapter | Page No. | Key Content Summary |
| :--- | :--- | :--- | :--- |
| 5 | Project Profile | 3 | Tech stack, hardware, software used |
| 6 | Project Overview | 4 | Features, user roles, benefits |
| 7 | Tools To Be Used | 5 | VS Code, XAMPP, Python, Next.js, etc. |
| 8 | Goals of Project | 6 | Core functionalities and purpose |
| 9 | Objectives of Project | 7 | Specific goals like efficiency and accuracy |
| 10 | Scope of Project | 8 | Current & potential applications |
| 11 | Functions to be Performed | 9 | Actions for User & System |
| 12 | Module Specification | 10 | Frontend, Backend, AI Service |
| 13 | Database Design | 11 | Tables: Users, PDFs, Chat Sessions, Messages |
| 14 | ER Diagram | 13 | Entity-Relationship model (Chen Notation) |
| 15 | Data Flow / Activity Diagrams | 15 | System Architecture and Activity Flows |
| 16 | Screenshot & Description | 18 | UI descriptions for key modules |
| 17 | Conclusion | 20 | Summary of benefits and impact |
| 18 | Future Scope | 21 | Enhancement ideas (Collaboration, Mobile App) |
| 19 | Resources | 22 | Web + Book references |

---

## 5. Project Profile

### Technology Stack
-   **Frontend**: Next.js 15 (React 18), Tailwind CSS 4, Radix UI.
-   **Backend**: CodeIgniter 4 (PHP 8.1+).
-   **AI Service**: Python 3.10+, Flask, LangChain.
-   **Database**: PostgreSQL (Metadata), Neon PgVector (Vector Store).
-   **LLM Provider**: Groq (Llama 3.3 70B Versatile, Llama 3.1 8B Instant).
-   **Embeddings**: HuggingFace (Sentence Transformers).

### Hardware Requirements
-   **Server**: Cloud-based or Local Server with Python & PHP support.
-   **Client**: Any modern device with a web browser (Laptop, Tablet, Smartphone).

### Software Requirements
-   **IDE**: Visual Studio Code.
-   **Local Server**: XAMPP (for PHP/Apache), Python Virtual Environment.
-   **Version Control**: Git.

### Benefits
-   **Efficiency**: Drastically reduces time spent searching through documents.
-   **Accuracy**: Minimizes hallucinations by grounding answers in source text.
-   **Usability**: Intuitive interface for seamless research.

---

## 7. Tools To Be Used

-   **Visual Studio Code**: Primary code editor.
-   **XAMPP**: For running the PHP backend and Apache server.
-   **Postman**: For testing API endpoints.
-   **Git/GitHub**: For version control and collaboration.
-   **Composer**: PHP dependency manager.
-   **npm/pnpm**: Node.js package manager.
-   **pip**: Python package manager.

---

## 8. Goals of Project

The core goal is to democratize access to information locked in static PDF documents. By transforming these documents into interactive knowledge bases, the project aims to:
1.  Make research interactive and conversational.
2.  Provide instant answers to complex queries.
3.  Enhance learning and comprehension through AI assistance.

---

## 9. Objectives of Project

1.  **Reduce Information Overload**: Help users digest large volumes of text quickly.
2.  **Ensure Data Integrity**: Provide citations to verify AI claims.
3.  **Seamless Integration**: Combine powerful AI with a user-friendly web interface.
4.  **Scalability**: Support multiple users and large documents efficiently.

---

## 10. Scope of Project

### Current Applications
-   **Academic Research**: Summarizing papers and finding references.
-   **Legal Analysis**: Reviewing contracts and case files.
-   **Corporate Training**: Querying manuals and policy documents.

### Potential Applications
-   **Medical Records**: Analyzing patient history and reports.
-   **Technical Support**: Troubleshooting using product manuals.

---

## 11. Functions to be Performed

### User Actions
-   **Register/Login**: Secure authentication.
-   **Upload PDF**: Drag-and-drop file upload.
-   **Create Session**: Group PDFs into a chat context.
-   **Select/Deselect Documents**: Control which files contribute to the answer.
-   **Ask Question**: Type natural language queries.
-   **Click Citation**: Navigate to the relevant PDF page.

### System Actions
-   **Extract Text**: Parse PDF content.
-   **Generate Embeddings**: Convert text to vectors.
-   **Retrieve Context**: Find relevant chunks for a query.
-   **Generate Answer**: Synthesize response using LLM.

---

## 12. Module Specification

### 1. Frontend Module
-   Built with Next.js.
-   Handles UI rendering, state management, and API calls.
-   Components: `PdfViewer`, `ChatInterface`, `Dashboard`.

### 2. Backend Module
-   Built with CodeIgniter 4.
-   Manages business logic, database interactions, and file storage.
-   Controllers: `Auth`, `PdfController`, `ChatController`.

### 3. AI Service Module
-   Built with Python/Flask.
-   Handles CPU-intensive tasks: OCR, Embedding generation, LLM inference.
-   Libraries: `langchain`, `pdfplumber`, `python-pptx`, `sentence-transformers`.

---

## 13. Database Design

### Tables

1.  **users**
    -   `user_id` (UUID, PK)
    -   `email`, `password_hash`, `name`

2.  **pdfs**
    -   `pdf_id` (UUID, PK)
    -   `user_id` (FK), `file_name`, `file_path`, `processing_status`

3.  **pdf_chunks**
    -   `chunk_id` (UUID, PK)
    -   `pdf_id` (FK), `chunk_text`, `page_number`

4.  **pdf_chunks_embeddings**
    -   `chunk_id` (FK, PK)
    -   `embedding` (Vector)

5.  **chat_sessions**
    -   `session_id` (UUID, PK)
    -   `user_id` (FK), `session_name`

6.  **chat_messages**
    -   `message_id` (UUID, PK)
    -   `session_id` (FK), `sender`, `message_text`, `references_data`

---

## 14. ER Diagram

*(See WORKFLOW_DIAGRAM.md for the visual representation)*

**Entities:**
-   **User**: The entity initiating actions.
-   **Pdf**: The document resource.
-   **ChatSession**: The context for interaction.
-   **ChatMessage**: The individual units of conversation.

**Relationships:**
-   One **User** uploads many **Pdfs**.
-   One **User** creates many **ChatSessions**.
-   One **ChatSession** includes many **Pdfs**.
-   One **ChatSession** contains many **ChatMessages**.

---

## 15. Data Flow / Activity Diagrams

*(See WORKFLOW_DIAGRAM.md for visual charts)*

### System Architecture
Client (Browser) <-> Frontend (Next.js) <-> Backend (CodeIgniter) <-> AI Service (Python) <-> External APIs (Groq, HuggingFace).

### Activity Flow (Chat)
1.  User sends message.
2.  Backend validates session.
3.  AI Service retrieves relevant chunks (RAG).
4.  LLM generates answer.
5.  Response returned to User.

---

## 16. Screenshot & Description

### 1. Dashboard
**Description**: A clean interface listing all uploaded PDFs and active chat sessions. Users can upload new files using a prominent "Upload" button or resume existing chats.
**Key Elements**: Sidebar navigation, File list, Session list, Status indicators.

### 2. Chat Interface
**Description**: A split-screen layout. The left side displays the PDF document with zoom and navigation controls. The right side contains the chat thread. A collapsible sidebar allows for document selection.
**Key Elements**: Message input, Chat history, PDF viewer, Citation links, Document Selection Sidebar.

### 3. Login/Register
**Description**: Secure forms for user authentication.
**Key Elements**: Email input, Password input, "Sign Up" toggle.

---

## 17. Conclusion

The "Chat With PDF" project successfully implements a modern, AI-powered document interaction system. By leveraging RAG technology, it solves the problem of information retrieval from static documents, offering a significant productivity boost for students and professionals. The modular architecture ensures scalability and maintainability.

---

## 18. Future Scope

1.  **Collaborative Features**: Real-time multi-user editing and chatting.
2.  **Mobile App**: Native iOS/Android application.
3.  **Voice Mode**: Speak to the PDF and hear answers.
4.  **Multi-Modal Support**: Analyze images and charts within PDFs.
5.  **Blockchain Integration**: Verify document authenticity.
6.  **Offline Mode**: Local LLM inference for privacy.
7.  **API Access**: Public API for third-party integrations.
8.  **Analytics Dashboard**: Insights into reading habits and query patterns.
9.  **Auto-Summarization**: Generate executive summaries upon upload.
10. **Flashcard Generation**: Auto-create study aids from content.

---

## 19. Resources

### Web References
1.  **Next.js**: https://nextjs.org/docs
2.  **CodeIgniter 4**: https://codeigniter.com/user_guide/
3.  **LangChain**: https://python.langchain.com/docs/get_started/introduction
4.  **Groq API**: https://console.groq.com/docs/quickstart
5.  **Neon DB**: https://neon.tech/docs

### Book References
1.  *Designing Data-Intensive Applications* by Martin Kleppmann.
2.  *Deep Learning with Python* by François Chollet.
3.  *Modern PHP* by Josh Lockhart.
