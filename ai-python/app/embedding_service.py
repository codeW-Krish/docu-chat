# from sentence_transformers import SentenceTransformer
# import logging

# logger = logging.getLogger(__name__)

# class EmbeddingService:
#     def __init__(self):
#         try:
#             # Load the free HuggingFace model - all-MiniLM-L6-v2 (384 dimensions)
#             self.model = SentenceTransformer('all-MiniLM-L6-v2')
#             self.dimension = 384
            
#             # Test the model
#             test_embedding = self.generate_embedding("test sentence")
#             logger.info(f"✅ Loaded all-MiniLM-L6-v2 embedding model (dimension: {self.dimension})")
#             logger.info(f"✅ Test embedding generated: {len(test_embedding)} dimensions")
            
#         except Exception as e:
#             logger.error(f"❌ Failed to load embedding model: {str(e)}")
#             raise
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    _model_loaded = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        # Prevent re-initialization
        if not self._model_loaded:
            try:
                logger.info("Loading all-MiniLM-L6-v2 embedding model...")
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                self.dimension = 384
                self._model_loaded = True
                
                # Test the model
                test_embedding = self.generate_embedding("test sentence")
                # print("Test Embeddings: ",test_embedding)
                logger.info(f"Embedding model loaded (dimension: {self.dimension})")
                
            except Exception as e:
                logger.error(f"Failed to load embedding model: {str(e)}")
                raise
    
    def generate_embedding(self, text):
        """Generate embedding for text using all-MiniLM-L6-v2"""
        try:
            if not text or not text.strip():
                raise ValueError("Text cannot be empty for embedding")
                
            # Clean text
            clean_text = text.strip()
            if len(clean_text) < 3:
                raise ValueError("Text too short for meaningful embedding")
                
            # Generate embedding - returns numpy array
            embedding_array = self.model.encode(clean_text)
            
            # Convert to list for PostgreSQL vector type
            embedding_list = embedding_array.tolist()
            
            # Validate dimension
            if len(embedding_list) != self.dimension:
                raise ValueError(f"Embedding dimension mismatch: expected {self.dimension}, got {len(embedding_list)}")
                
            return embedding_list
            
        except Exception as e:
            logger.error(f"Embedding generation error for text '{text[:50]}...': {str(e)}")
            raise
    
    def generate_embeddings_batch(self, texts):
        """Generate embeddings for multiple texts at once"""
        try:
            # Filter out empty texts
            valid_texts = [text.strip() for text in texts if text and text.strip()]
            if not valid_texts:
                return []
                
            # Generate batch embeddings
            embeddings_array = self.model.encode(valid_texts)
            embeddings_list = embeddings_array.tolist()
            
            logger.info(f"Generated {len(embeddings_list)} embeddings in batch")
            return embeddings_list
            
        except Exception as e:
            logger.error(f"Batch embedding generation error: {str(e)}")
            raise
    
    def get_dimension(self):
        """Get the embedding dimension"""
        return self.dimension