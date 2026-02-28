# Chat With PDF - Project Report

## Abstract
In the era of information overload, extracting relevant insights from multiple documents efficiently is a significant challenge. "Chat With PDF" is an advanced web application designed to solve this by enabling users to interact with multiple documents (PDF, DOCX, PPTX, TXT, CSV) simultaneously using Natural Language Processing (NLP). The system leverages Large Language Models (LLMs) to provide accurate answers, citation highlighting, and real-time document previews, transforming how users engage with static documents.

## Introduction
Traditional methods of information retrieval involve manually searching through documents or using keyword-based search engines, which often lack context. "Chat With PDF" introduces a conversational interface where users can ask questions in natural language and receive context-aware responses derived directly from their uploaded files. This project integrates modern web technologies with state-of-the-art AI models to create a seamless research and study tool.

## Problem Statement
Students, researchers, and professionals often deal with large volumes of PDF documents. Finding specific information across these files is time-consuming and error-prone. Existing tools often limit users to single-file interactions or lack transparency in their responses (hallucinations). There is a need for a system that can handle multiple documents, provide evidence for its answers (citations), and offer an intuitive reading experience.

## Objectives
The primary objectives of this project are:
1.  To develop a multi-document chat interface that allows simultaneous querying of multiple files.
2.  To implement a Retrieval-Augmented Generation (RAG) pipeline for accurate, context-aware responses.
3.  To provide visual citation highlighting, linking AI responses directly to the source text in the PDF.
4.  To create a responsive and modern user interface with real-time PDF previews.

## System Analysis

### Existing System
Current solutions typically allow users to upload a single PDF and chat with it. They often lack:
-   **Multi-document support**: Users must switch contexts to query different files.
-   **Visual Verification**: Users cannot easily verify if the AI's answer is correct without manually searching the document.
-   **Session Management**: Chats are often ephemeral and lost upon refresh.

### Proposed System
The proposed "Chat With PDF" system addresses these limitations by:
-   **Batch Processing**: Supporting multiple PDF uploads and cross-document context.
-   **Smart Citations**: Highlighting the exact text segment used to generate an answer.
-   **Document Selection**: Granular control over which documents are used for context generation.
-   **Split-Screen UI**: displaying the chat and the relevant PDF page side-by-side for immediate verification.
-   **Intelligent Preview Handling**: Automatically detects file types, providing full previews for PDFs and informative placeholders for other formats (PPTX, DOCX).
-   **Persistent Sessions**: Allowing users to save and resume their research.

## System Architecture
The system follows a modular architecture comprising three main components:

1.  **Frontend (Client-Side)**: Built with **Next.js 15** and **Tailwind CSS 4**, providing a responsive and interactive UI. It handles user inputs, displays chat history, and renders PDFs using a custom viewer.
2.  **Backend (Server-Side)**: Developed using **CodeIgniter 4 (PHP)**, managing user authentication, file uploads, and session data.
3.  **AI Engine (Microservice)**: A **Python** service utilizing **LangChain** for orchestration. It handles:
    -   **Text Extraction**: Using `pdfplumber`, `python-pptx`, and `pypdfium2`.
    -   **Embeddings**: Generating vector embeddings using **HuggingFace** models.
    -   **LLM Inference**: Querying **Groq** for high-speed, accurate responses.

## Modules Description

### 1. User Interface Module
-   **Dashboard**: Displays uploaded files and chat sessions.
-   **Chat Interface**: A split-pane view with a message thread on one side and a PDF viewer on the other. Includes a sidebar for document selection.
-   **PDF Viewer**: Supports zooming, navigation, and dynamic highlighting of text for PDFs, with graceful fallback for other document types.

### 2. Authentication & Management Module
-   Secure user login and registration (JWT-based).
-   File management (upload, delete, list).
-   Chat session history storage.

### 3. RAG Pipeline Module
-   **Ingestion**: Converts PDF text into chunks.
-   **Vector Store**: Indexes chunks for semantic search.
-   **Retrieval**: Finds relevant chunks based on user queries.
-   **Generation**: Synthesizes answers using the retrieved context.

## Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 15 (React 18) |
| **Styling** | Tailwind CSS 4, Radix UI |
| **Backend Framework** | CodeIgniter 4 (PHP 8.1+) |
| **AI Orchestration** | LangChain |
| **LLM Provider** | Groq |
| **Embeddings** | HuggingFace (Sentence Transformers) |
| **Database** | PostgreSQL (Metadata), Neon PgVector (Vector Store) |

## Implementation Details
The core functionality relies on the RAG pattern:
1.  **Upload**: User uploads PDFs. The Python service extracts text and creates embeddings.
2.  **Query**: User asks a question. The system converts the question into a vector.
3.  **Search**: The system finds the most similar text chunks in the vector store.
4.  **Response**: The LLM generates an answer using the retrieved chunks as context, appending citation metadata.
5.  **Display**: The frontend renders the answer and uses the metadata to automatically scroll to and highlight the source text in the PDF viewer.

## Future Scope
1.  **Collaborative Research**: Allowing multiple users to share sessions and annotate documents together.
2.  **Mobile Application**: Developing a native mobile app for on-the-go access.
3.  **Voice Interaction**: Adding speech-to-text and text-to-speech capabilities for accessibility.
4.  **Multi-Modal Support**: Analyze images and charts within documents.

## Conclusion
"Chat With PDF" successfully bridges the gap between static documents and dynamic information retrieval. By combining advanced AI models with a user-centric design, it offers a powerful tool for anyone looking to digest complex information efficiently. The project demonstrates the potential of RAG architectures in real-world applications.

## References
-   Next.js Documentation: https://nextjs.org/docs
-   CodeIgniter 4 User Guide: https://codeigniter.com/user_guide/
-   LangChain Documentation: https://python.langchain.com/docs/get_started/introduction
-   Groq API Docs: https://console.groq.com/docs/quickstart
