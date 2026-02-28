# Project Presentation & Interview Guide

This guide is designed to help you explain the "Chat with PDF" project orally. It covers how to tell the story of the project, deep technical explanations, and how to handle difficult questions.

---

## 1. The "Elevator Pitch" (High-Level Explanation)
*Use this when someone asks: "So, what does your project do?"*

> "I built an intelligent document assistant that lets users chat with their PDF files. Unlike basic PDF readers, my system uses **RAG (Retrieval-Augmented Generation)** to understand the content. You can ask a question, and it doesn't just give you an answer—it actually **highlights the exact paragraph** in the PDF where it found the information, so you can verify it instantly. It's built with a **Next.js** frontend, a **PHP** backend for orchestration, and a **Python** microservice for the AI logic."

---

## 2. The Deep Dive (The "How it Works" Story)
*Use this when explaining the workflow. Use the "3 Pillars" analogy.*

"To understand how it works, think of the system as three distinct pillars working together:"

### **Pillar 1: The Frontend (The Interface)**
"I used **Next.js** and **React** for the UI. The critical part here is the PDF Viewer. I didn't just use a standard viewer; I customized `react-pdf` to support **dynamic highlighting**. When the AI returns an answer, it sends back the specific text it used. My frontend intercepts the PDF rendering process and 'paints' that text yellow on the screen."

### **Pillar 2: The Orchestrator (The PHP Backend)**
"I used **CodeIgniter (PHP)** as the central API gateway. It handles authentication, session management, and file uploads. It acts as a secure bridge. It doesn't do the heavy AI lifting itself; instead, it validates the user's request and forwards it to my Python service. This keeps the application logic separate from the AI computation."

### **Pillar 3: The Brain (The Python AI Service)**
"This is where the magic happens. I built a **Flask** microservice that handles the RAG pipeline:
1.  **Ingestion:** When you upload a PDF, I use `PyPDF2` to break it into small chunks.
2.  **Embedding:** I convert those chunks into vector embeddings (numbers that represent meaning) and store them in the database.
3.  **Retrieval:** When you ask a question, I search for the most similar chunks.
4.  **Generation:** I send those chunks to **Groq (Llama 3)** to generate the answer.
5.  **Citation:** I return the answer *plus* the original text chunks so the frontend can do the highlighting."

---

## 3. Technical Q&A Simulation
*Be ready for these questions. They test your depth of understanding.*

### **Q1: "How exactly does the highlighting work? Do you modify the PDF file?"**
**Answer:** "No, I never modify the original PDF file. That would be destructive. Instead, I use a **layering technique**. `react-pdf` renders the PDF as a visual canvas, but it also creates an invisible 'Text Layer' on top for selecting text. I wrote a **custom text renderer** function. As the page loads, this function checks every piece of text. If it matches the citation returned by the AI, I inject a CSS class to give it a yellow background. It's purely a visual overlay on the frontend."

### **Q2: "Why did you separate PHP and Python? Why not do it all in one?"**
**Answer:** "I chose a **microservices architecture** for separation of concerns. PHP is excellent for rapid application development, routing, and managing relational data (users, sessions). Python, however, is the native language of AI and data science. By separating them, I get the best of both worlds: a robust, secure web backend and a specialized, high-performance AI service. It also allows me to scale the AI service independently if needed."

### **Q3: "How do you handle large PDFs? Does the context window get full?"**
**Answer:** "That's exactly why I use **RAG (Retrieval-Augmented Generation)**. I don't feed the entire PDF to the LLM. I chunk the PDF into smaller pieces (e.g., 1000 characters) and store them as vectors. When a user asks a question, I perform a **semantic vector search** to find only the top 5-10 most relevant chunks. I only send those specific chunks to the LLM. This keeps the prompt small, fast, and cost-effective, regardless of the PDF size."

### **Q4: "What happens if the user asks a question that isn't in the PDF?"**
**Answer:** "The system is designed to be grounded in the document. If the vector search returns chunks with low similarity scores (meaning no relevant information was found), the system is programmed to tell the user: 'I couldn't find relevant information in the provided document.' This prevents 'hallucinations' where the AI makes up facts."

### **Q5: "How do you manage state when navigating between pages?"**
**Answer:** "I use **React State** to manage the `currentPage` index. The PDF viewer is 'controlled'—it only renders the page number I tell it to. When a user clicks a citation, I update the `currentPage` state to match the citation's page, and the viewer instantly re-renders to show that page. This makes the navigation feel instant and responsive."

---

## 4. Key Terminology to Use
*   **RAG (Retrieval-Augmented Generation):** The core architecture.
*   **Vector Embeddings:** Converting text to numbers for search.
*   **Semantic Search:** Searching by meaning, not just keywords.
*   **Microservices:** The PHP/Python split.
*   **Overlay/Layering:** The highlighting technique.
*   **Lazy Loading:** Rendering only one PDF page at a time.

---

## 5. The Demo Walkthrough Script
*Use this if you are showing the project live to someone.*

**[Step 1: The Setup]**
"Let's look at a live example. Here I have a PDF about 'Climate Change'. I'll upload it to the system."
*(Upload file)*
"Right now, the Python backend is chunking this file and creating vector embeddings."

**[Step 2: The Interaction]**
"Now, I'll ask a specific question: *'What is the projected sea level rise?'*"
*(Type and send)*
"Notice how the answer appears almost instantly. But here's the key feature..."

**[Step 3: The Reveal]**
"See this reference link? When I click it..."
*(Click reference)*
"...the PDF viewer instantly jumps to Page 12. And look at this yellow highlight. This isn't pre-baked into the PDF. My system dynamically identified that this specific sentence is the source of truth for the AI's answer and highlighted it in real-time. This builds trust because you can verify the AI's claims immediately."

---

## 6. Technology Stack & Rationale (Deep Dive)
*Use this section to show off your architectural choices.*

### **A. Python AI Service (The Brain)**
*   **Library:** `sentence-transformers` (Model: `all-MiniLM-L6-v2`)
    *   **Why:** This is a state-of-the-art model for creating "embeddings." It converts text into a 384-dimensional vector.
    *   **Clarification:** "Aren't we using PyTorch?" -> **Yes!** `sentence-transformers` is a high-level wrapper built *on top of* PyTorch. It simplifies the complex code needed to load BERT models and generate embeddings down to just a few lines.
    *   **Library:** `Groq` (LLM Provider)
    *   **Why:** Groq is the fastest inference engine available today. It allows us to generate answers in milliseconds, making the chat feel real-time.
    *   **Library:** `Flask`
    *   **Why:** A lightweight microframework perfect for building simple API endpoints (`/chat`, `/process-pdf`) without the overhead of Django.

### **B. PHP Backend (The Orchestrator)**
*   **Framework:** `CodeIgniter 4`
    *   **Why:** It's lightweight, fast, and has a small footprint. Unlike Laravel, it doesn't force a complex structure, making it ideal for a proxy/orchestration layer.
    *   **Library:** `firebase/php-jwt`
    *   **Why:** For secure, stateless authentication. We issue a JWT (JSON Web Token) when you log in, so the server doesn't need to remember you in memory.

### **C. Frontend (The Interface)**
*   **Framework:** `Next.js 15` (React)
    *   **Why:** It gives us server-side rendering (SSR) for fast initial loads and great SEO. It also handles routing automatically.
    *   **Library:** `react-pdf` (wrapping `pdf.js`)
    *   **Why:** The standard for rendering PDFs in React. It gives us granular control over the rendering process, allowing us to inject the custom highlighting layer.
    *   **UI Library:** `shadcn/ui` (based on Radix UI)
    *   **Why:** It provides accessible, unstyled components that we can fully customize with Tailwind CSS. It's not a "component library" you install, but code you copy, giving you full control.

---

## 7. Deep Concept: Embeddings & Vector Search
*This is the most impressive technical part. Explain it well.*

**"What is an Embedding?"**
"Computers don't understand words; they understand numbers. An 'embedding' is a way to translate a sentence into a list of numbers (a vector). Similar sentences will have similar numbers."

*   *Example:*
    *   "The dog chased the cat" -> `[0.1, 0.5, 0.9]`
    *   "The canine pursued the feline" -> `[0.11, 0.51, 0.89]` (Very close!)
    *   "I like pizza" -> `[0.9, 0.1, 0.2]` (Far away)

**"How Vector Search Works"**
"When you ask a question, we convert it into numbers. Then we use a mathematical formula called **Cosine Similarity** to find the 'nearest neighbors' in our database. We don't look for matching keywords; we look for matching *meaning*."

**Code Snippet (Python):**
```python
# ai-python/app/vector_search.py

# 1. Convert user question to vector
query_embedding = self.embedding_service.generate_embedding(query)

# 2. SQL Query using pgvector logic
# EXPLANATION: The operator <=> calculates "Cosine Distance" (how different they are).
# We want "Similarity" (how same they are), so we do 1 - Distance.
# If Distance is 0 (identical), Similarity is 1 (100%).
cursor.execute("""
    SELECT chunk_text, 1 - (embedding <=> %s) as similarity
    FROM pdf_chunks
    ORDER BY similarity DESC
    LIMIT 5
""", (query_embedding,))
```

---

## 8. The Upload Workflow (Step-by-Step)
*Use this to explain what happens when a user uploads a file.*

**Oral Explanation:**
"When a user uploads a PDF, we don't just save it. We trigger a complex processing pipeline. First, the PHP backend saves the raw file. Then, it immediately hands it off to the Python service. The Python service acts like a factory: it extracts the text (using OCR if needed), splits it into small chunks, converts those chunks into vector embeddings, and finally saves everything into our specialized vector database. This ensures that the moment the upload finishes, the document is ready to be searched."

**Technical Steps:**

1.  **Frontend (`api.ts`):**
    *   User selects file.
    *   `uploadPdf` sends `POST` request to PHP backend.

2.  **PHP Backend (`PdfController.php`):**
    *   **Function:** `upload()`
    *   **Action:** Validates file type (PDF/DOCX/TXT), generates a unique ID, and saves the file to the `uploads/` folder.
    *   **Trigger:** Calls `sendToPythonProcessor()` which sends a request to the Python service.

3.  **Python Service (`app.py` -> `pdf_processor.py`):**
    *   **Endpoint:** `/process-pdf` (Yes, this one endpoint handles the entire pipeline!)
    *   **Step A (Extraction):** Uses `pdfplumber` to read text. If the page is an image (scanned PDF), it automatically falls back to `pytesseract` (OCR) to read the text from the image.
    *   **Step B (Chunking):** Uses `RecursiveCharacterTextSplitter` to split the text into 800-character chunks with overlap. This ensures we don't cut sentences in half.
    *   **Step C (Embedding):** Passes each chunk to `embedding_service.py` to generate the 384-dimensional vector.
        *   *Correction:* The code currently processes these **iteratively** (one by one) inside a loop.
        *   *Why?* This allows us to wrap each insertion in a database transaction block. If one chunk fails, we can catch it without losing the whole document.
        *   *Note:* The `EmbeddingService` class *does* have a `generate_embeddings_batch()` function, so we *could* switch to batch processing for speed in the future, but right now it's disabled in favor of granular error handling.
    *   **Step D (Storage):** Saves the text chunk AND the vector embedding into the `pdf_chunks_embeddings` table in the database.

**Code Snippet: PHP Calling Python**
```php
// backend/app/Controllers/PdfController.php

private function sendToPythonProcessor($pdfId, $pdfPath, $userId)
{
    // We use cURL to send a POST request to the internal Python service
    $pythonServerUrl = getenv('PYTHON_SERVER_URL'); // e.g., http://localhost:5000
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $pythonServerUrl . '/process-pdf');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'pdf_id' => $pdfId,
        'pdf_path' => $pdfPath, // We send the PATH, not the file content
        'user_id' => $userId
    ]));
    
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}
```

**Clarification: "Is the file only saved on PHP?"**
**Yes.** The PHP backend handles the physical file upload and saves it to the disk (e.g., `uploads/pdfs/file.pdf`). It then sends the **absolute file path** to the Python service. The Python service reads the file directly from that disk path. They share the same filesystem.

---

## 10. Python Backend Call Graph (The "Map")
*Use this to explain how the functions connect.*

### **Endpoint 1: `/process-pdf`**
*   **Entry:** `app.py` -> `process_pdf()`
*   **Logic:** `pdf_processor.py` -> `DocumentProcessor.process_pdf()`
    *   Calls `extract_text_with_ocr()` (or `docx`, `txt` extractors)
    *   Calls `chunk_text_with_metadata()` -> `RecursiveCharacterTextSplitter`
    *   **Loop:** For each chunk:
        *   Calls `embedding_service.py` -> `generate_embedding()`
        *   Calls `database.py` -> `get_db_connection()` (Insert SQL)

### **Endpoint 2: `/chat`**
*   **Entry:** `app.py` -> `chat()`
*   **Logic:** `ai_generator.py` -> `AIGenerator.generate_answer()`
    *   Calls `_enhance_question_with_context()` -> `_call_groq_llm()`
    *   Calls `vector_search.py` -> `search_similar_chunks()`
        *   Calls `embedding_service.py` -> `generate_embedding()` (for query)
        *   Calls `database.py` -> `get_db_connection()` (Select SQL)
    *   Calls `_build_prompt()`
    *   Calls `_call_groq_llm()` (Main Answer Generation)
    *   Calls `_add_references()`

### **Endpoint 3: `/summarize`**
*   **Entry:** `app.py` -> `summarize()`
*   **Logic:** `ai_generator.py` -> `AIGenerator.generate_document_summary()`
    *   Calls `vector_search.py` -> `get_random_chunks()` (to get representative text)
    *   Calls `_call_groq_llm()` (Summary Generation)

---

## 11. PHP Backend Call Graph (The "Orchestrator")
*Use this to explain the API layer.*

### **A. Authentication (`Auth.php`)**
*   **`/auth/register`**
    *   **Logic:** Validates input -> `UserModel->insert()` -> `generateTokens()` -> Returns JWT.
*   **`/auth/login`**
    *   **Logic:** Finds user (`UserModel`) -> Verifies password -> `generateTokens()` -> Returns JWT.
*   **`/auth/refresh`**
    *   **Logic:** Decodes Refresh Token -> Verifies DB (`UserRefreshTokenModel`) -> `generateTokens()` -> Returns New Access Token.

### **B. PDF Management (`PdfController.php`)**
*   **`/api/pdf/upload`**
    *   **Logic:**
        1.  Validates file (MIME type, size).
        2.  Moves file to `uploads/pdfs/`.
        3.  `PdfModel->insert()` (Saves metadata).
        4.  **External Call:** `sendToPythonProcessor()` -> cURL to Python `/process-pdf`.
*   **`/api/pdf/list`**
    *   **Logic:** `PdfModel->getUserPdfs()` -> Returns list.
*   **`/api/pdf/view/{id}`**
    *   **Logic:** Checks file existence -> Sets PDF headers -> Streams file content (`readfile`).

### **C. Chat Logic (`ChatController.php`)**
*   **`/api/chat/message`**
    *   **Logic:**
        1.  `ChatMessageModel->addMessage()` (Saves User Message).
        2.  `getConversationHistory()` (Fetches context).
        3.  **External Call:** `sendToAI()` -> cURL to Python `/chat`.
        4.  `ChatMessageModel->addMessage()` (Saves AI Response + References).
*   **`/api/chat/history/{sessionId}`**
    *   **Logic:** `ChatMessageModel->getSessionMessages()` -> Returns chat history.

---

## 12. Frontend Call Graph (The "Interface")
*Use this to explain the React/Next.js layer.*

### **A. Authentication Flow**
*   **Page:** `/signin` or `/signup`
*   **Action:** User submits form.
*   **Code Path:**
    1.  `onSubmit` handler calls `api.login()` or `api.register()`.
    2.  **API Client (`api.ts`):** Sends POST to PHP `/auth/...`.
    3.  **On Success:**
        *   Stores `access_token` and `refresh_token` in `localStorage`.
        *   Redirects to `/dashboard` using `router.push()`.

### **B. Chat & Message Flow**
*   **Page:** `/chat/[sessionId]/page.tsx`
*   **Action:** User types message and hits Enter.
*   **Code Path:**
    1.  `handleSendMessage()` is triggered.
    2.  **Optimistic UI:** Immediately adds user message to `messages` state (so it appears instantly).
    3.  **API Call:** Calls `api.sendMessage(sessionId, text, pdfIds)`.
    4.  **Wait:** Shows "Thinking..." loading state.
    5.  **Response:** Receives JSON `{ answer, references }`.
    6.  **Update:**
        *   Replaces "Thinking..." with actual AI answer.
        *   Sets `highlightedReference` to the first reference (if any).
        *   Sets `showPdfPreview(true)` to open the viewer.

### **C. PDF Highlighting Flow**
*   **Component:** `PdfViewer` (`pdf-viewer.tsx`)
*   **Trigger:** `highlightedReference` prop changes (passed from parent).
*   **Code Path:**
    1.  `useEffect` detects change in `highlightedReference`.
    2.  **Navigation:** Calls `setCurrentPage(ref.page_number)` -> Viewer jumps to page.
    3.  **Rendering:** `customTextRenderer` runs for every text item on that page.
    4.  **Match:** Checks `if (chunkText.includes(itemText))`.
    5.  **Paint:** Returns `<span class="bg-yellow-200">` for matching text.

### **D. PDF Upload Flow**
*   **Component:** `ManageSessionPdfs.tsx` (Modal)
*   **Action:** User drops file.
*   **Code Path:**
    1.  `onDrop` handler receives file.
    2.  **API Call:** Calls `api.uploadPdf(file)`.
    3.  **Progress:** Shows upload progress bar.
    4.  **Polling:** Starts polling `api.getPdfStatus()` every 2 seconds.
    5.  **Completion:** When status is 'completed', adds PDF to the "Selected" list.




---

## 9. System Architecture Summary
"The system is designed as a **RAG Pipeline**:
1.  **Ingest:** PDF -> Text Chunks -> Vectors (Python/SentenceTransformers).
2.  **Store:** Vectors saved in Database.
3.  **Retrieve:** User Question -> Vector -> Find Top 5 Chunks (Python).
4.  **Generate:** Top 5 Chunks + Question -> LLM (Groq) -> Answer.
5.  **Highlight:** Answer + Source Chunks -> Frontend (React-PDF) -> Visual Highlight."

