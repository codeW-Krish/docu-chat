from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv

# Fix relative imports
from .pdf_processor import DocumentProcessor
from .ai_generator import AIGenerator
from .database import test_connection


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
    
    logger.info("All services initialized successfully")
    services_available = True
    
except Exception as e:
    logger.error(f"Service initialization failed: {str(e)}")
    # Set to None if initialization fails
    pdf_processor = None
    ai_generator = None
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
        
        # Validate PDF file exists
        if not os.path.exists(pdf_path):
            logger.error(f"PDF file not found: {pdf_path}")
            return jsonify({
                'status': 'error',
                'message': 'PDF file not found on server'
            }), 400
        
        # Validate it's a PDF file
        # Validate file type
        allowed_extensions = ['.pdf', '.docx', '.txt', '.csv', '.pptx']
        if not any(pdf_path.lower().endswith(ext) for ext in allowed_extensions):
            logger.error(f"Invalid file type: {pdf_path}")
            return jsonify({
                'status': 'error',
                'message': 'Invalid file type. Allowed: PDF, DOCX, PPTX, TXT, CSV'
            }), 400
        
        logger.info(f"Processing PDF: {pdf_path} for user {user_id}")
        
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
        
        if not all([question, pdf_ids, user_id]):
            return jsonify({
                'status': 'error', 
                'message': 'Missing required fields: question, pdf_ids, user_id'
            }), 400
        
        logger.info(f"Chat request - User: {user_id}, Session: {session_id}")
        logger.info(f"Conversation history length: {len(conversation_history)}")
        
        # Generate AI response with conversation context
        result = ai_generator.generate_answer(question, pdf_ids, user_id, session_id, conversation_history, provider)
        
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