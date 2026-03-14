from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv

# Fix relative imports
from .pdf_processor import DocumentProcessor
from .ai_generator import AIGenerator
from .database import test_connection
from .pageindex_service import PageIndexService


# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_FILE_SIZE', 52428800))
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')

# Initialize services ONCE at module level (when app starts)
try:
    logger.info("Initializing AI services...")
    
    # FIXED: Import once
    from .database import test_connection
    if test_connection():
        logger.info("Database connection successful")  # FIXED: Added 'D'
    else:
        logger.error("Database connection failed")
        raise Exception("Database connection failed")
    
    # These will be initialized ONLY ONCE when the module loads
    pdf_processor = DocumentProcessor()
    ai_generator = AIGenerator()
    
    # Initialize PageIndex service with reference to ai_generator for LLM calls
    try:
        pageindex_service = PageIndexService(ai_generator=ai_generator)
        logger.info("PageIndex service initialized")
    except Exception as pi_err:
        pageindex_service = None
        logger.warning(f"PageIndex service not available: {pi_err}")
    
    logger.info("All services initialized successfully")
    services_available = True
    
except Exception as e:
    logger.error(f"Service initialization failed: {str(e)}")
    # Set to None if initialization fails
    pdf_processor = None
    ai_generator = None
    pageindex_service = None
    services_available = False

@app.route('/', methods=['GET'])
def index():
    """Root endpoint for HuggingFace Space"""
    return jsonify({
        'service': 'Docu-Chat AI Python Server',
        'status': 'running',
        'endpoints': ['/health', '/process-pdf', '/chat'],
        'services_ready': services_available
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    status_info = {
        'status': 'healthy' if services_available else 'degraded',
        'service': 'Python AI Server',
        'embedding_model': 'all-MiniLM-L6-v2',
        'vector_search': 'enabled',
        'services_ready': services_available
    }
    return jsonify(status_info)

@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    """Process PDF endpoint - called by PHP backend"""
    try:
        # Check if service is available
        if not pdf_processor or not services_available:
            return jsonify({
                'status': 'error', 
                'message': 'PDF processor not available. Service is still initializing.'
            }), 503
            
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error', 
                'message': 'No JSON data provided'
            }), 400
        
        pdf_path = data.get('pdf_path')
        pdf_id = data.get('pdf_id')
        user_id = data.get('user_id')
        
        if not pdf_path or not pdf_id or not user_id:
            return jsonify({
                'status': 'error', 
                'message': 'PDF path, PDF ID, and User ID required'
            }), 400
        
        # Note: We no longer validate file extensions or local existence here 
        # because pdf_path is now an Appwrite File ID, not a local file path.
        
        logger.info(f"Processing PDF (Appwrite ID): {pdf_path} for user {user_id}")
        
        # Process PDF using the provided path
        result = pdf_processor.process_pdf(pdf_id, pdf_path, user_id)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"PDF processing endpoint error: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': f'Processing failed: {str(e)}'
        }), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Chat endpoint - called by PHP backend"""
    try:
        # FIXED: Check if service is available
        if not ai_generator or not services_available:
            return jsonify({
                'status': 'error', 
                'message': 'AI generator not available. Service is still initializing.'
            }), 503
            
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error', 
                'message': 'No JSON data provided'
            }), 400
        
        question = data.get('question')
        pdf_ids = data.get('pdf_ids')
        user_id = data.get('user_id')
        session_id = data.get('session_id')
        conversation_history = data.get('conversation_history', [])
        provider = data.get('provider')
        model = data.get('model')
        retrieval_mode = data.get('retrieval_mode', 'vector')
        
        if not all([question, pdf_ids, user_id]):
            return jsonify({
                'status': 'error', 
                'message': 'Missing required fields: question, pdf_ids, user_id'
            }), 400
        
        logger.info(f"Chat request - User: {user_id}, Session: {session_id}, Mode: {retrieval_mode}")
        logger.info(f"Conversation history length: {len(conversation_history)}")
        
        # Handle retrieval modes
        if retrieval_mode == 'pageindex' and pageindex_service:
            # PageIndex-only mode
            result = _handle_pageindex_chat(question, pdf_ids, user_id, conversation_history, provider, model)
        elif retrieval_mode == 'comparison' and pageindex_service:
            # Comparison mode: both Vector + PageIndex
            vector_result = ai_generator.generate_answer(question, pdf_ids, user_id, session_id, conversation_history, provider, model=model)
            pageindex_result = _handle_pageindex_chat(question, pdf_ids, user_id, conversation_history, provider, model)
            
            combined_answer = vector_result.get('answer', '') + "\n\n|||COMPARISON_SPLIT|||\n\n" + pageindex_result.get('answer', '')
            combined_refs = vector_result.get('references', []) + pageindex_result.get('references', [])
            
            result = {
                'answer': combined_answer,
                'references': combined_refs,
                'provider': vector_result.get('provider', provider)
            }
        else:
            # Default: Vector mode
            result = ai_generator.generate_answer(question, pdf_ids, user_id, session_id, conversation_history, provider, model=model)
        
        return jsonify({
            'status': 'success',
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': f'Chat failed: {str(e)}'
        }), 500

@app.route('/chat/stream', methods=['POST'])
def chat_stream():
    """Chat streaming endpoint - called by PHP backend"""
    try:
        from flask import Response
        import json
        
        if not ai_generator or not services_available:
            return jsonify({
                'status': 'error', 
                'message': 'AI generator not available. Service is still initializing.'
            }), 503
            
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error', 
                'message': 'No JSON data provided'
            }), 400
        
        question = data.get('question')
        pdf_ids = data.get('pdf_ids')
        user_id = data.get('user_id')
        session_id = data.get('session_id')
        conversation_history = data.get('conversation_history', [])
        provider = data.get('provider')
        model = data.get('model')
        retrieval_mode = data.get('retrieval_mode', 'vector')
        
        if not all([question, pdf_ids, user_id]):
            return jsonify({
                'status': 'error', 
                'message': 'Missing required fields: question, pdf_ids, user_id'
            }), 400
        
        logger.info(f"Chat stream request - User: {user_id}, Session: {session_id}, Mode: {retrieval_mode}")
        
        def generate():
            try:
                if retrieval_mode == 'pageindex' and pageindex_service:
                    # Stream from PageIndex
                    for chunk in _handle_pageindex_stream(question, pdf_ids, user_id, conversation_history, provider, model):
                        yield f"data: {json.dumps(chunk)}\n\n"
                elif retrieval_mode == 'comparison' and pageindex_service:
                    # Stream Vector
                    vector_refs = []
                    for chunk in ai_generator.generate_answer_stream(question, pdf_ids, user_id, session_id, conversation_history, provider, model=model):
                        if chunk.get('type') == 'metadata':
                            vector_refs = chunk.get('references', [])
                        else:
                            yield f"data: {json.dumps(chunk)}\n\n"
                    
                    # Split separator
                    split_chunk = {'type': 'chunk', 'content': '\n\n|||COMPARISON_SPLIT|||\n\n'}
                    yield f"data: {json.dumps(split_chunk)}\n\n"
                    
                    # Stream PageIndex
                    pageindex_refs = []
                    for chunk in _handle_pageindex_stream(question, pdf_ids, user_id, conversation_history, provider, model):
                        if chunk.get('type') == 'metadata':
                            pageindex_refs = chunk.get('references', [])
                        else:
                            yield f"data: {json.dumps(chunk)}\n\n"
                            
                    # Yield combined metadata at the end
                    meta_chunk = {'type': 'metadata', 'references': vector_refs + pageindex_refs}
                    yield f"data: {json.dumps(meta_chunk)}\n\n"
                else:
                    # Default: Vector stream
                    for chunk in ai_generator.generate_answer_stream(
                        question, pdf_ids, user_id, session_id, conversation_history, provider, model=model
                    ):
                        yield f"data: {json.dumps(chunk)}\n\n"
            except Exception as e:
                logger.error(f"Error in chat stream: {str(e)}", exc_info=True)
                err_chunk = {'type': 'error', 'content': str(e)}
                yield f"data: {json.dumps(err_chunk)}\n\n"
        
        return Response(generate(), mimetype='text/event-stream', headers={'X-Accel-Buffering': 'no'})
        
    except Exception as e:
        logger.error(f"Chat stream endpoint error: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': f'Chat stream failed: {str(e)}'
        }), 500

@app.route('/summarize', methods=['POST'])
def summarize():
    """Summarize endpoint - called by PHP backend"""
    try:
        # Check if service is available
        if not ai_generator or not services_available:
            return jsonify({
                'status': 'error', 
                'message': 'AI generator not available. Service is still initializing.'
            }), 503
            
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error', 
                'message': 'No JSON data provided'
            }), 400
        
        pdf_ids = data.get('pdf_ids')
        user_id = data.get('user_id')
        provider = data.get('provider')
        
        if not pdf_ids or not user_id:
            return jsonify({
                'status': 'error', 
                'message': 'Missing required fields: pdf_ids, user_id'
            }), 400
        
        logger.info(f"Summarize request - User: {user_id}, PDFs: {pdf_ids}")
        
        # Generate summary
        summary = ai_generator.generate_document_summary(pdf_ids, user_id, provider)
        
        return jsonify({
            'status': 'success',
            'summary': summary
        })
        
    except Exception as e:
        logger.error(f"Summarize endpoint error: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': f'Summarization failed: {str(e)}'
        }), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({
        'status': 'error',
        'message': 'File too large. Maximum size is 50MB.'
    }), 413

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500

# Remove the if __name__ block since we're using run.py

# ─── PageIndex Helper Functions ───────────────────────────────────────

def _get_tree_for_pdf(pdf_id):
    """Load tree from Appwrite for a given PDF."""
    if not pageindex_service:
        return None

    try:
        from .database import get_db_connection
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT tree_file_id, tree_status FROM pdfs WHERE pdf_id = %s", (pdf_id,))
            row = cur.fetchone()
        conn.close()

        if not row or row[1] != 'completed' or not row[0]:
            return None

        return pageindex_service.download_tree_from_appwrite(row[0])

    except Exception as e:
        logger.warning(f"Failed to load tree for PDF {pdf_id}: {e}")
        return None

def _handle_pageindex_chat(question, pdf_ids, user_id, conversation_history, provider, model):
    """Handle a chat request using PageIndex retrieval."""
    # Try first PDF that has a tree
    for pdf_id in pdf_ids:
        tree = _get_tree_for_pdf(pdf_id)
        if tree:
            # Get PDF name
            try:
                from .database import get_db_connection
                conn = get_db_connection()
                with conn.cursor() as cur:
                    cur.execute("SELECT file_name FROM pdfs WHERE pdf_id = %s", (pdf_id,))
                    row = cur.fetchone()
                conn.close()
                pdf_name = row[0] if row else 'Unknown'
            except Exception:
                pdf_name = 'Unknown'

            return pageindex_service.generate_answer_from_tree(
                question, tree, pdf_id, pdf_name, provider, model, conversation_history
            )

    # No trees available — fall back to vector
    return ai_generator.generate_answer(question, pdf_ids, user_id, provider=provider, model=model)

def _handle_pageindex_stream(question, pdf_ids, user_id, conversation_history, provider, model):
    """Handle streaming chat using PageIndex retrieval."""
    for pdf_id in pdf_ids:
        tree = _get_tree_for_pdf(pdf_id)
        if tree:
            try:
                from .database import get_db_connection
                conn = get_db_connection()
                with conn.cursor() as cur:
                    cur.execute("SELECT file_name FROM pdfs WHERE pdf_id = %s", (pdf_id,))
                    row = cur.fetchone()
                conn.close()
                pdf_name = row[0] if row else 'Unknown'
            except Exception:
                pdf_name = 'Unknown'

            yield from pageindex_service.generate_answer_stream_from_tree(
                question, tree, pdf_id, pdf_name, provider, model, conversation_history
            )
            return

    # Fallback to vector stream
    yield from ai_generator.generate_answer_stream(
        question, pdf_ids, user_id, provider=provider, model=model
    )

@app.route('/generate-tree', methods=['POST'])
def generate_tree():
    """Manual tree generation endpoint."""
    try:
        logger.info("[TreeGen-Py] === /generate-tree ENDPOINT HIT ===")
        logger.info(f"[TreeGen-Py] pageindex_service available: {pageindex_service is not None}")
        logger.info(f"[TreeGen-Py] services_available: {services_available}")

        if not pageindex_service or not services_available:
            logger.error("[TreeGen-Py] ABORT: PageIndex service not available")
            return jsonify({'status': 'error', 'message': 'PageIndex service not available'}), 503

        data = request.get_json()
        pdf_id = data.get('pdf_id')
        user_id = data.get('user_id')
        provider = data.get('provider', 'groq')
        model = data.get('model')

        logger.info(f"[TreeGen-Py] pdf_id={pdf_id} user_id={user_id} provider={provider} model={model}")

        if not pdf_id or not user_id:
            logger.error("[TreeGen-Py] ABORT: missing pdf_id or user_id")
            return jsonify({'status': 'error', 'message': 'pdf_id and user_id required'}), 400

        # Download PDF text from DB
        from .database import get_db_connection
        logger.info("[TreeGen-Py] Fetching chunks from DB...")
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT page_number, chunk_text FROM pdf_chunks WHERE pdf_id = %s ORDER BY page_number",
                (pdf_id,)
            )
            rows = cur.fetchall()
        conn.close()

        logger.info(f"[TreeGen-Py] Found {len(rows)} chunk rows from DB")

        if not rows:
            logger.error(f"[TreeGen-Py] ABORT: No chunks found for pdf_id={pdf_id}")
            return jsonify({'status': 'error', 'message': 'No chunks found for this PDF'}), 404

        # Reconstruct pages_data from chunks
        page_texts = {}
        for row in rows:
            page_num = row[0]
            if page_num not in page_texts:
                page_texts[page_num] = []
            page_texts[page_num].append(row[1])

        pages_data = [
            {'page_number': pn, 'text': ' '.join(texts)}
            for pn, texts in sorted(page_texts.items())
        ]

        logger.info(f"[TreeGen-Py] Reconstructed {len(pages_data)} pages from chunks")
        for p in pages_data[:3]:
            logger.info(f"[TreeGen-Py]   Page {p['page_number']}: {len(p['text'])} chars")

        logger.info("[TreeGen-Py] Calling pageindex_service.generate_tree_from_pages()...")
        result = pageindex_service.generate_tree_from_pages(
            pages_data, pdf_id, provider=provider, model=model
        )
        logger.info(f"[TreeGen-Py] generate_tree_from_pages result: status={result.get('status')} tree_file_id={result.get('tree_file_id')} message={result.get('message', 'none')}")

        # Update DB with tree info
        logger.info("[TreeGen-Py] Updating DB with tree info...")
        conn = get_db_connection()
        with conn.cursor() as cur:
            if result.get('status') == 'success':
                cur.execute(
                    "UPDATE pdfs SET tree_file_id = %s, tree_status = 'completed' WHERE pdf_id = %s",
                    (result.get('tree_file_id'), pdf_id)
                )
                logger.info(f"[TreeGen-Py] DB updated: tree_file_id={result.get('tree_file_id')}, tree_status=completed")
            else:
                cur.execute(
                    "UPDATE pdfs SET tree_status = 'failed' WHERE pdf_id = %s",
                    (pdf_id,)
                )
                logger.info(f"[TreeGen-Py] DB updated: tree_status=failed")
        conn.commit()
        conn.close()

        logger.info(f"[TreeGen-Py] === /generate-tree DONE, returning: {result.get('status')} ===")
        return jsonify(result)

    except Exception as e:
        logger.error(f"[TreeGen-Py] EXCEPTION in /generate-tree: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500