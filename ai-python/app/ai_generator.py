import os
import groq
import logging
import importlib
from .vector_search import VectorSearch

try:
    cerebras_module = importlib.import_module('cerebras.cloud.sdk')
    Cerebras = getattr(cerebras_module, 'Cerebras', None)
except Exception:
    Cerebras = None

logger = logging.getLogger(__name__)

class AIGenerator:
    def __init__(self):
        try:
            self.client = groq.Client(api_key=os.getenv('GROQ_API_KEY'))
            self.default_provider = (os.getenv('LLM_PROVIDER') or 'groq').lower()
            self.groq_model = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
            self.cerebras_model = os.getenv('CEREBRAS_MODEL', 'llama3.1-70b')

            self.cerebras_client = None
            cerebras_api_key = os.getenv('CEREBRAS_API_KEY')
            if Cerebras and cerebras_api_key:
                self.cerebras_client = Cerebras(api_key=cerebras_api_key)

            self.vector_search = VectorSearch()
            logger.info("Groq client initialized successfully")
            if self.cerebras_client:
                logger.info("Cerebras client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {str(e)}")
            raise
    
    def generate_answer(self, question, pdf_ids, user_id, session_id=None, conversation_history=None, provider=None):
        """Generate AI answer with semantic search and references"""
        try:
            logger.info(f"Generating answer for user {user_id}, PDFs: {pdf_ids}")
            selected_provider = self._resolve_provider(provider)
            
            # Enhance question with context if conversation history is provided
            enhanced_question = self._enhance_question_with_context(question, conversation_history, selected_provider)
            logger.info(f"Original question: {question}")
            logger.info(f"Enhanced question: {enhanced_question}")
            
            # Determine if summarization is requested
            if "summarize" in enhanced_question.lower():
                # Retrieve a broad set of chunks for summarization
                summary_chunks = self.vector_search.search_similar_chunks(
                    enhanced_question, pdf_ids, user_id, top_k=50, similarity_threshold=0.1
                )
                if not summary_chunks:
                    logger.warning("No chunks found for summarization")
                    return {
                        "answer": "Unable to find content to summarize. Please ensure the PDFs contain relevant information.",
                        "references": [],
                        "suggested_questions": []
                    }
                # Concatenate chunk texts
                full_text = " ".join(chunk["chunk_text"] for chunk in summary_chunks)
                # Generate summary
                summary = self.summarize_text(full_text, selected_provider)
                # Generate follow‑up suggestions
                followups = self._generate_followup_questions(summary, enhanced_question, selected_provider)
                # Return summary with follow‑up suggestions
                return {
                    "answer": f"{summary}",
                    "references": summary_chunks,
                    "suggested_questions": followups,
                    "provider": selected_provider
                }
            
            # Search for relevant chunks using enhanced question
            # Lower threshold and more chunks for better context
            relevant_chunks = self.vector_search.search_similar_chunks(
                enhanced_question, pdf_ids, user_id, top_k=10, similarity_threshold=0.3
            )
            
            if not relevant_chunks:
                logger.warning("No relevant chunks found for question")
                
                # Get names of selected PDFs
                pdf_names = self.vector_search.get_pdf_names(pdf_ids)
                pdf_list = "\n".join([f"- {name}" for name in pdf_names])
                
                msg = "I couldn't find relevant information in the provided PDFs to answer your question."
                if pdf_names:
                    msg += f"\n\nCurrently selected documents:\n{pdf_list}\n\nYou can try asking about these, or select more documents."
                else:
                    msg += " No documents are currently selected."

                return {
                    "answer": msg,
                    "references": [],
                    "suggested_questions": []
                }
            
            logger.info(f"Using {len(relevant_chunks)} relevant chunks for context")
            
            # Build context with better organization and more details
            context_parts = []
            
            # Group chunks by PDF for better organization
            pdf_chunks = {}
            for chunk in relevant_chunks:
                pdf_name = chunk['pdf_name']
                if pdf_name not in pdf_chunks:
                    pdf_chunks[pdf_name] = []
                pdf_chunks[pdf_name].append(chunk)
            
            # Build context organized by PDF
            for pdf_name, chunks in pdf_chunks.items():
                context_parts.append(f"=== FROM {pdf_name} ===")
                for i, chunk in enumerate(chunks, 1):
                    context_parts.append(
                        f"[Source {i}] Page {chunk['page_number']}, Chunk {chunk['chunk_index']} (Similarity: {chunk['similarity']:.2f}):\n"
                        f"{chunk['chunk_text']}\n"
                    )
                context_parts.append("")  # Empty line between PDFs
            
            context = "\n".join(context_parts)
            
            # Generate answer using Groq
            prompt = self._build_prompt(question, context)
            response = self._call_llm(prompt, provider=selected_provider)
            
            # Generate follow-up questions
            followups = self._generate_followup_questions(response, question, selected_provider)
            
            # Format answer with references
            formatted_answer = self._add_references(response, relevant_chunks)
            
            logger.info("Answer generated successfully")
            
            return {
                "answer": formatted_answer,
                "references": relevant_chunks,
                "suggested_questions": followups,
                "provider": selected_provider
            }
            
        except Exception as e:
            logger.error(f"AI generation error: {str(e)}")
            return {
                "answer": "I apologize, but I encountered an error while processing your question. Please try again in a moment.",
                "references": [],
                "suggested_questions": []
            }

    def generate_document_summary(self, pdf_ids, user_id, provider=None):
        """Generate a summary of the provided PDFs"""
        try:
            logger.info(f"Generating summary for PDFs: {pdf_ids}")
            selected_provider = self._resolve_provider(provider)
            
            # Get a broad set of chunks from the beginning of documents or random
            summary_chunks = self.vector_search.search_similar_chunks(
                "introduction summary overview abstract", pdf_ids, user_id, top_k=20, similarity_threshold=0.1
            )
            
            if not summary_chunks:
                return "I couldn't extract enough text to generate a summary. Please ask me specific questions about the documents."
            
            # Concatenate chunk texts
            full_text = " ".join(chunk["chunk_text"] for chunk in summary_chunks)
            
            # Generate summary
            prompt = f"""Based on the following excerpts from the uploaded documents, provide a concise and engaging summary of what these documents are about. 
            Highlight the key topics and main themes. Keep it under 200 words.
            
            Excerpts:
            {full_text[:10000]}  # Limit context size
            
            Summary:"""
            
            summary = self._call_llm(prompt, provider=selected_provider)
            return summary
            
        except Exception as e:
            logger.error(f"Summary generation error: {str(e)}")
            return "Unable to generate summary at this time."
    
    def summarize_text(self, text, provider=None):
        """Summarize the given text using the LLM."""
        prompt = f"""Summarize the following text in a concise paragraph, preserving the main ideas and important details:\n\n{text}"""
        return self._call_llm(prompt, provider=provider)

    def _generate_followup_questions(self, context_text, original_question, provider=None):
        """Generate concise follow‑up question suggestions."""
        followup_prompt = f"""Based on the answer below and the original user question, suggest exactly 3 short, relevant follow‑up questions the user might ask to explore the topic further.
        
        Rules:
        1. Provide ONLY the questions, one per line.
        2. Do not number them.
        3. Do not add quotes or bullet points.
        4. Keep them short (under 10 words).
        
        Answer Context:
        {context_text}
        
        Original Question:
        {original_question}
        
        Questions:"""
        
        try:
            response = self._call_llm(followup_prompt, provider=provider)
            # Parse response into a list
            questions = [q.strip() for q in response.split('\n') if q.strip()]
            # Filter out any that look like headers or non-questions if possible, but simple split is usually fine
            return questions[:3]
        except Exception as e:
            logger.error(f"Error generating follow-ups: {str(e)}")
            return []

    def _build_prompt(self, question, context):
        """Build the prompt for the LLM"""
        return f"""You are an expert AI assistant that provides comprehensive answers based on PDF documents. Your goal is to give detailed, well-structured responses that fully address the user's question.
        
        CONTEXT FROM PDFS:
        {context}
        
        USER QUESTION: {question}
        
        INSTRUCTIONS:
        1. Provide a comprehensive answer based on the information in the context above
        2. Structure your response clearly with proper explanations and examples when available
        3. Include specific details, definitions, and explanations from the source material
        4. If the context contains multiple relevant pieces of information, synthesize them into a coherent answer
        5. Use the source information to provide depth and context, not just surface-level answers
        6. If the context doesn't contain enough information to fully answer the question, say so and explain what information is available
        7. Do not make up information or use external knowledge beyond what's provided
        8. Reference specific sources when citing information using [Source X] notation
        9. If the question asks for definitions or explanations, provide thorough, detailed responses
        10. Organize your answer logically with clear sections if appropriate
        
        IMPORTANT: End your response with a "References" section that lists the sources you used, explaining briefly what specific point or topic each source contributed. Format it exactly like this:
        
        References
        [Source 1] – Page X (brief explanation of what this source covers regarding the question)
        [Source 2] – Page Y (brief explanation)
        
        ANSWER:"""
    
    def _resolve_provider(self, provider=None):
        selected = (provider or self.default_provider or 'groq').lower()

        if selected == 'cerebras' and self.cerebras_client:
            return 'cerebras'

        if selected == 'groq' and self.client:
            return 'groq'

        if self.client:
            return 'groq'

        if self.cerebras_client:
            return 'cerebras'

        return 'groq'

    def _call_llm(self, prompt, provider=None, max_tokens=2000, temperature=0.2, timeout=60):
        """Call selected LLM provider to generate response"""
        selected_provider = self._resolve_provider(provider)

        if selected_provider == 'cerebras':
            return self._call_cerebras_llm(prompt, max_tokens=max_tokens, temperature=temperature)

        return self._call_groq_llm(prompt, max_tokens=max_tokens, temperature=temperature, timeout=timeout)

    def _call_groq_llm(self, prompt, max_tokens=2000, temperature=0.2, timeout=60):
        """Call Groq API to generate response"""
        try:
            response = self.client.chat.completions.create(
                # model="gemma2-9b-it",  # or "mixtral-8x7b-32768" for faster response
                #model="meta-llama/llama-4-scout-17b-16e-instruct",  #openai/gpt-oss-120b
                # model="llama-3.3-70b-versatile",
                model=self.groq_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert AI assistant that provides comprehensive, detailed answers based on document context. Focus on being thorough and educational in your responses."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=timeout
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            raise

    def _call_cerebras_llm(self, prompt, max_tokens=2000, temperature=0.2):
        """Call Cerebras API to generate response"""
        if not self.cerebras_client:
            raise Exception("Cerebras client not initialized. Add CEREBRAS_API_KEY in environment.")

        try:
            response = self.cerebras_client.chat.completions.create(
                model=self.cerebras_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert AI assistant that provides comprehensive, detailed answers based on document context. Focus on being thorough and educational in your responses."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Cerebras API error: {str(e)}")
            raise
    
    def _enhance_question_with_context(self, question, conversation_history, provider=None):
        """Enhance question with conversation context using LLM"""
        if not conversation_history or len(conversation_history) == 0:
            return question
        
        try:
            # Build context from conversation history
            context = "Previous conversation:\n"
            for msg in conversation_history[-6:]:  # Last 6 messages for context
                sender = "User" if msg.get('sender') == 'user' else "AI"
                context += f"{sender}: {msg.get('message_text', '')}\n"
            
            # Use LLM to enhance the question
            enhancement_prompt = f"""Based on the conversation context below, rewrite the user's current question to be a standalone search query.
            
            Rules:
            1. Replace pronouns (it, that, he, she) with specific names/terms from context.
            2. Make the question specific and complete.
            3. DO NOT answer the question.
            4. DO NOT add any introductory text.
            5. Output ONLY the rewritten question.
            
            Context:
            {context}
            
            Current question: {question}
            
            Rewritten question:"""
            
            selected_provider = self._resolve_provider(provider)
            enhanced = self._call_llm(
                enhancement_prompt,
                provider=selected_provider,
                max_tokens=100,
                temperature=0.1,
                timeout=30
            ).strip()
            return enhanced if enhanced else question
            
        except Exception as e:
            logger.error(f"Error enhancing question: {str(e)}")
            return question
    
    def _add_references(self, answer, chunks):
        """Add reference markers to the answer"""
        if not chunks:
            return answer
        
        # The LLM generates the first "References" section (Contextual).
        # We append the second "References:" section (Detailed/Source).
        
        references_section = "\n\n---\n**Source Documents:**\n"
        for i, chunk in enumerate(chunks, 1):
            references_section += f"{chunk['pdf_name']} (Page {chunk['page_number']}, Similarity: {chunk['similarity']:.2f})\n"
        
        return answer + references_section
