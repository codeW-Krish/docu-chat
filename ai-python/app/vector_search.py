import logging
from .embedding_service import EmbeddingService
from .database import get_db_connection

logger = logging.getLogger(__name__)

class VectorSearch:
    def __init__(self):
        self.embedding_service = EmbeddingService()
    
    def search_similar_chunks(self, query, pdf_ids, user_id, top_k=5, similarity_threshold=0.7):
        """Search for similar chunks using vector cosine similarity"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_service.generate_embedding(query)
            logger.info(f"Vector search for query: '{query[:50]}...'")
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Convert UUIDs to strings for query (keep as strings, cast in SQL)
            pdf_ids_str = [str(pdf_id) for pdf_id in pdf_ids]
            user_id_str = str(user_id)
            
            # FIXED: Cast UUID parameters properly
            cursor.execute("""
                SELECT 
                    pce.chunk_id,
                    pce.pdf_id,
                    pce.chunk_index,
                    pce.chunk_text,
                    pce.start_char,
                    pce.end_char,
                    pc.page_number,
                    pdf.file_name,
                    1 - (pce.embedding <=> %s::vector) as similarity
                FROM pdf_chunks_embeddings pce
                JOIN pdfs pdf ON pce.pdf_id = pdf.pdf_id
                JOIN pdf_chunks pc ON pce.chunk_id = pc.chunk_id
                WHERE pce.pdf_id = ANY(%s::uuid[])  -- CAST string array to UUID array
                AND pce.user_id = %s::uuid          -- CAST string to UUID
                ORDER BY pce.embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, pdf_ids_str, user_id_str, query_embedding, top_k * 2))
            
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            
            # Process results and remove duplicates, then apply threshold
            unique_chunks = {}
            for row in results:
                chunk_id, pdf_id, chunk_index, chunk_text, start_char, end_char, page_number, pdf_name, similarity = row
                
                # Use chunk text as key to avoid duplicates
                chunk_key = chunk_text[:100]
                if chunk_key not in unique_chunks or unique_chunks[chunk_key]['similarity'] < similarity:
                    unique_chunks[chunk_key] = {
                        'chunk_id': str(chunk_id),  # Ensure UUID is string
                        'pdf_id': str(pdf_id),      # Ensure UUID is string
                        'chunk_index': chunk_index,
                        'chunk_text': chunk_text,
                        'start_char': start_char,
                        'end_char': end_char,
                        'page_number': page_number,
                        'pdf_name': pdf_name,
                        'similarity': float(similarity)
                    }
            
            # Sort by similarity and get top chunks, then apply threshold
            all_chunks = sorted(unique_chunks.values(), key=lambda x: x['similarity'], reverse=True)
            
            # Apply threshold but be more lenient - take top chunks even if below threshold
            if len(all_chunks) <= top_k:
                top_chunks = all_chunks
            else:
                # Take top chunks, but if they're all below threshold, take the best ones anyway
                top_chunks = all_chunks[:top_k]
                if top_chunks and top_chunks[-1]['similarity'] < similarity_threshold:
                    # If the last chunk is below threshold, still include it for context
                    pass
            
            logger.info(f"Found {len(top_chunks)} relevant chunks (threshold: {similarity_threshold})")
            return top_chunks
            
        except Exception as e:
            logger.error(f"Vector search error: {str(e)}")
            raise
    
    def get_chunk_by_id(self, chunk_id):
        """Get specific chunk by ID for reference"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    pc.chunk_id, pc.pdf_id, pc.chunk_index, pc.chunk_text,
                    pc.start_char, pc.end_char, pc.page_number,
                    pdf.file_name
                FROM pdf_chunks pc
                JOIN pdfs pdf ON pc.pdf_id = pdf.pdf_id
                WHERE pc.chunk_id = %s::uuid  -- CAST to UUID
            """, (chunk_id,))
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if result:
                return {
                    'chunk_id': str(result[0]),  # Convert UUID to string
                    'pdf_id': str(result[1]),    # Convert UUID to string
                    'chunk_index': result[2],
                    'chunk_text': result[3],
                    'start_char': result[4],
                    'end_char': result[5],
                    'page_number': result[6],
                    'pdf_name': result[7]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Get chunk error: {str(e)}")
            raise

    def get_pdf_names(self, pdf_ids):
        """Get names of PDFs by IDs"""
        try:
            if not pdf_ids:
                return []
                
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Convert UUIDs to strings
            pdf_ids_str = [str(pdf_id) for pdf_id in pdf_ids]
            
            cursor.execute("""
                SELECT file_name FROM pdfs
                WHERE pdf_id = ANY(%s::uuid[])
            """, (pdf_ids_str,))
            
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return [row[0] for row in results]
            
        except Exception as e:
            logger.error(f"Get PDF names error: {str(e)}")
            return []