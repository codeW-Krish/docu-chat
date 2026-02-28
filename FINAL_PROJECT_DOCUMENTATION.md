# Chat With PDF - Final Project Report

**Submitted To:**
[University/Institute Name]

**In Partial Fulfillment of the Requirements for the Degree of:**
[Degree Name]

**Year:** 2025-2026

**Developed By:**
[Your Name/Team Name]

**Guided By:**
[Guide Name]

---

## Certificate

This is to certify that **[Your Name]** has successfully completed the Minor Project Report on **"Chat With PDF"** in partial fulfillment of the requirements for the degree of [Degree Name] for the academic year 2025–26.

The said report is based on bona fide work done by them.

---

## Acknowledgement

I would like to express my deepest appreciation to all individuals who contributed to the success of this project. I am grateful for the guidance and support received throughout the development process.

I also acknowledge the valuable resources and tools that made this project possible, including the open-source communities behind Next.js, CodeIgniter, and LangChain.

---

## Index

| Sr. No. | Chapter | Page No. |
| :--- | :--- | :--- |
| 1 | Project Profile | 1 |
| 2 | Project Overview | 2 |
| 3 | Tools To Be Used | 4 |
| 4 | Goals of Project | 6 |
| 5 | Objectives of Project | 7 |
| 6 | Scope of Project | 8 |
| 7 | Functions to be Performed | 9 |
| 8 | Module Specification | 10 |
| 9 | Database Design | 12 |
| 10 | ER Diagram | 14 |
| 11 | Data Flow Diagrams | 15 |
| 12 | Conclusion | 18 |
| 13 | Future Scope | 19 |
| 14 | References | 20 |

---

## 1. Project Profile

**Project Title:** Chat With PDF

**Project Description:**
"Chat With PDF" is an advanced web application designed to democratize access to information locked in static documents. It enables users to upload multiple files (PDF, DOCX, PPTX, TXT, CSV) and interact with them using natural language. The system leverages Retrieval-Augmented Generation (RAG) to provide accurate, context-aware answers with visual citation highlighting.

**Technology Stack:**
-   **Frontend:** Next.js 15 (React 18), Tailwind CSS 4, Radix UI
-   **Backend:** CodeIgniter 4 (PHP 8.1+)
-   **AI Engine:** Python 3.10+, Flask, LangChain
-   **Database:** PostgreSQL (Metadata), Neon PgVector (Vector Store)
-   **LLM Provider:** Groq (Llama 3.3 70B Versatile)
-   **Embeddings:** HuggingFace (Sentence Transformers)

**Hardware Requirements:**
-   **Server:** Cloud-based or Local Server with Python & PHP support.
-   **Client:** Any modern device with a web browser (Laptop, Tablet, Smartphone).
-   **Processor:** Intel Core i5 or equivalent (recommended for local AI processing).
-   **RAM:** 8GB minimum (16GB recommended).

**Software Requirements:**
-   **IDE:** Visual Studio Code
-   **Local Server:** XAMPP (Apache/MySQL), Python Virtual Environment
-   **Version Control:** Git

---

## 2. Project Overview

"Chat With PDF" is an intuitive web application designed to help users digest large volumes of text quickly. It transforms static documents into interactive knowledge bases.

**Key Features:**
1.  **Multi-Document Chat:** Upload and query multiple documents simultaneously.
2.  **Intelligent Preview Handling:** Automatically detects file types, providing full previews for PDFs and informative placeholders for other formats (PPTX, DOCX).
3.  **Smart Citations:** Visual links to the exact source text in the PDF.
4.  **RAG Architecture:** Ensures answers are grounded in the document content, minimizing hallucinations.
5.  **Document Selection:** Allows users to dynamically select or deselect documents to control the AI's context.
6.  **Real-time Preview:** Split-screen view for reading and chatting.
7.  **Secure Authentication:** JWT-based login and registration.

**User Pages:**
1.  **Login/Register Page:** Secure authentication forms.
2.  **Dashboard:** Lists all uploaded PDFs and active chat sessions.
3.  **Chat Interface:** The core workspace with a split-screen layout (PDF Viewer + Chat Thread).
4.  **Upload Modal:** Drag-and-drop interface for adding new files.

---

## 3. Tools To Be Used

### Frontend
-   **Next.js 15:** A React framework for building fast, scalable web applications. It handles server-side rendering and routing.
-   **Tailwind CSS 4:** A utility-first CSS framework for rapid UI development.
-   **Lucide React:** A library for consistent and beautiful icons.

### Backend
-   **CodeIgniter 4:** A lightweight PHP framework used for the REST API, file management, and database interactions.
-   **PostgreSQL On Cloud Neon:** A powerful, open-source relational database system used for storing user and document metadata.

### AI & Data
-   **Python (Flask):** The backend service for AI operations.
-   **LangChain:** A framework for developing applications powered by language models.
-   **Groq API:** Provides ultra-fast inference for Llama 3 models.
-   **Neon PgVector:** A serverless Postgres database with vector search capabilities for RAG.
-   **pdfplumber / python-pptx:** Libraries for extracting text from PDF and PowerPoint files.

---

## 4. Goals of Project

The core goal is to revolutionize how people interact with documents. Instead of manually searching for keywords, users can have a conversation with their data.

**Primary Goals:**
1.  Make research interactive and conversational.
2.  Provide instant answers to complex queries.
3.  Enhance learning and comprehension through AI assistance.
4.  Save time for students, researchers, and professionals.

---

## 5. Objectives of Project

1.  **Reduce Information Overload:** Help users digest large volumes of text quickly.
2.  **Ensure Data Integrity:** Provide citations to verify AI claims.
3.  **Seamless Integration:** Combine powerful AI with a user-friendly web interface.
4.  **Scalability:** Support multiple users and large documents efficiently.
5.  **Accessibility:** Make advanced AI tools accessible to non-technical users.

---

## 6. Scope of Project

**Current Applications:**
-   **Academic Research:** Summarizing papers and finding references.
-   **Legal Analysis:** Reviewing contracts and case files.
-   **Corporate Training:** Querying manuals and policy documents.

**Future Potential:**
-   **Medical Records:** Analyzing patient history and reports.
-   **Technical Support:** Troubleshooting using product manuals.
-   **Personal Knowledge Management:** Organizing personal archives.

---

## 7. Functions to be Performed

### User Role
-   **Register/Login:** Create an account and authenticate securely.
-   **Upload Documents:** Upload PDF, DOCX, PPTX, TXT, and CSV files.
-   **Create Sessions:** Group documents into chat sessions.
-   **Select/Deselect Documents:** Filter which documents are used for AI context.
-   **Ask Questions:** Query the AI about the uploaded content.
-   **View Citations:** Click on references to navigate to the source text.
-   **Manage Files:** Delete uploaded documents.

### System Role (AI & Backend)
-   **Text Extraction:** Parse content from various file formats.
-   **Embedding Generation:** Convert text into vector embeddings.
-   **Semantic Search:** Retrieve relevant text chunks based on user queries.
-   **Answer Generation:** Synthesize responses using the LLM.
-   **Session Management:** Store and retrieve chat history.

---

## 8. Module Specification

### 1. Frontend Module
-   **Components:** `PdfViewer`, `ChatInterface`, `Dashboard`, `FileUpload`, `Sidebar`.
-   **Logic:** Handles user interactions, API calls, document selection state, and state management.
-   **Styling:** Responsive design using Tailwind CSS.

### 2. Backend Module
-   **Controllers:** `Auth`, `PdfController`, `ChatController`.
-   **Models:** `UserModel`, `PdfModel`, `ChatSessionModel`.
-   **Services:** File upload handling, API routing.

### 3. AI Service Module
-   **Ingestion Pipeline:** Processes files and updates the vector store.
-   **RAG Engine:** Orchestrates the retrieval and generation process.
-   **API Layer:** Flask endpoints for communication with the PHP backend.

---

## 9. Database Design

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

## 10. ER Diagram

*(Refer to the visual diagram in WORKFLOW_DIAGRAM.md)*

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

## 11. Data Flow Diagrams

### Context Level (Level 0)
-   **User** sends **Files** and **Queries** to the **System**.
-   **System** returns **Processed Status** and **Answers**.

### Activity Flow (Chat)
1.  User sends message.
2.  Backend validates session.
3.  AI Service retrieves relevant chunks (RAG).
4.  LLM generates answer.
5.  Response returned to User.

---

## 12. Conclusion

"Chat With PDF" represents a significant leap forward in how we interact with static knowledge. By transforming passive documents into active, conversational agents, this project addresses the critical challenge of information overload in the digital age.

**Key Outcomes:**
1.  **Democratization of Knowledge:** Users no longer need to be experts in search queries or read hundreds of pages to find answers. The natural language interface makes complex information accessible to everyone.
2.  **Enhanced Productivity:** By automating the extraction and synthesis of information, the system saves countless hours for researchers, students, and professionals.
3.  **Trust and Transparency:** Unlike standard AI chatbots, "Chat With PDF" builds trust by providing visual citations, allowing users to verify every claim against the source text.
4.  **Technical Excellence:** The successful integration of a modern tech stack—Next.js for a responsive UI, CodeIgniter for a robust backend, and a Python-based RAG engine—demonstrates a scalable and maintainable architecture.

In conclusion, "Chat With PDF" is not just a tool; it is a productivity platform that redefines the reading experience. It bridges the gap between human curiosity and the vast amount of knowledge locked in documents, making learning faster, easier, and more interactive.

---

## 13. Future Scope

The current iteration of "Chat With PDF" establishes a strong foundation, but the potential for expansion is vast. The following enhancements are envisioned to evolve the platform into a comprehensive enterprise-grade solution:

### 1. Advanced Collaboration & Sharing
-   **Real-time Multiplayer Mode:** Allow teams to upload documents and chat in a shared session, similar to Google Docs.
-   **Annotation Layer:** Enable users to highlight, comment, and share notes directly on the PDF preview.

### 2. Multi-Modal Capabilities
-   **Image & Chart Analysis:** Integrate Vision Transformers (ViT) to understand and answer questions about graphs, diagrams, and images within the PDF.
-   **Voice Interaction:** Implement Speech-to-Text (STT) and Text-to-Speech (TTS) for a fully hands-free, accessible experience.

### 3. Enterprise Integrations
-   **Cloud Storage Sync:** Direct integration with Google Drive, Dropbox, and OneDrive for seamless file import.
-   **API Access:** Expose a public API for third-party developers to build applications on top of the "Chat With PDF" engine.

### 4. Personalized Learning Agents
-   **Flashcard Generation:** Automatically generate study aids and quizzes from uploaded textbooks.
-   **Summarization Agents:** Create executive summaries or "TL;DR" versions of long reports automatically upon upload.

### 5. Enhanced Privacy & Security
-   **Local LLM Support:** Offer an option to run open-source models (like Llama 3 or Mistral) locally on the user's machine for complete data privacy.
-   **Blockchain Verification:** Use blockchain technology to timestamp and verify the authenticity of critical legal or financial documents.

---

## 14. References

**Web Resources:**
1.  **Next.js Documentation:** https://nextjs.org/docs
2.  **CodeIgniter 4 User Guide:** https://codeigniter.com/user_guide/
3.  **LangChain Documentation:** https://python.langchain.com/docs/get_started/introduction
4.  **Groq API:** https://console.groq.com/docs/quickstart

**Books:**
1.  *Designing Data-Intensive Applications* by Martin Kleppmann.
2.  *Deep Learning with Python* by François Chollet.
3.  *Modern PHP* by Josh Lockhart.
