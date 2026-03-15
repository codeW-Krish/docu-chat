"""
PageIndex Service — Tree generation, search, and answer pipeline.

This module provides vectorless RAG capabilities via PageIndex's hierarchical
tree index approach. All operations are error-isolated so they never break
the existing vector RAG pipeline.
"""

import os
import json
import logging
import tempfile
import requests
import re
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class PageIndexService:
    """
    Handles:
    - Tree generation from PDF text (per-page)
    - Tree storage/retrieval via Appwrite
    - LLM reasoning-based search over the tree
    - Answer generation from selected sections
    """

    def __init__(self, ai_generator=None):
        """
        Args:
            ai_generator: Optional AIGenerator instance for LLM calls.
                          If None, tree search/answer won't work but tree gen still can.
        """
        self.ai_generator = ai_generator
        # Retrieval tuning knobs (safe defaults, override via env).
        self.base_candidates = int(os.getenv('PAGEINDEX_BASE_CANDIDATES', '20'))
        self.max_candidates = int(os.getenv('PAGEINDEX_MAX_CANDIDATES', '40'))
        self.low_conf_gap = float(os.getenv('PAGEINDEX_LOW_CONF_GAP', '1.2'))
        self.low_conf_top1 = float(os.getenv('PAGEINDEX_LOW_CONF_TOP1', '3.5'))
        self.expansion_probe_candidates = int(os.getenv('PAGEINDEX_EXPANSION_PROBE_CANDIDATES', '12'))
        self.expansion_max_terms = int(os.getenv('PAGEINDEX_EXPANSION_MAX_TERMS', '6'))
        self.page_rescue_max_windows = int(os.getenv('PAGEINDEX_PAGE_RESCUE_MAX_WINDOWS', '8'))
        self.page_rescue_window_radius = int(os.getenv('PAGEINDEX_PAGE_RESCUE_WINDOW_RADIUS', '1'))
        self.tree_overview_max_pages = int(os.getenv('PAGEINDEX_TREE_OVERVIEW_MAX_PAGES', '90'))
        self.precision_core_max_tokens = int(os.getenv('PAGEINDEX_PRECISION_CORE_MAX_TOKENS', '3'))
        self.precision_min_grounding_score = float(os.getenv('PAGEINDEX_PRECISION_MIN_GROUNDING_SCORE', '1.0'))

        self._init_appwrite()
        logger.info("PageIndexService initialized")

    def _init_appwrite(self):
        """Initialize Appwrite client for tree JSON storage."""
        try:
            from appwrite.client import Client
            from appwrite.services.storage import Storage
            from appwrite.input_file import InputFile
            from appwrite.id import ID

            endpoint = os.getenv('APPWRITE_ENDPOINT')
            project_id = os.getenv('APPWRITE_PROJECT_ID')
            api_key = os.getenv('APPWRITE_API_KEY')
            bucket_id = os.getenv('APPWRITE_STORAGE_BUCKET_ID')

            logger.info(f"[TreeGen-Appwrite] Initializing Appwrite:")
            logger.info(f"[TreeGen-Appwrite]   ENDPOINT: {endpoint}")
            logger.info(f"[TreeGen-Appwrite]   PROJECT_ID: {project_id}")
            logger.info(f"[TreeGen-Appwrite]   API_KEY: {'***' + api_key[-4:] if api_key and len(api_key) > 4 else 'NOT SET'}")
            logger.info(f"[TreeGen-Appwrite]   BUCKET_ID: {bucket_id}")

            client = Client()
            client.set_endpoint(endpoint)
            client.set_project(project_id)
            client.set_key(api_key)

            self.storage = Storage(client)
            self.bucket_id = bucket_id
            self.InputFile = InputFile
            self.ID = ID
            self._appwrite_available = True
            logger.info("[TreeGen-Appwrite] Appwrite initialized successfully")
        except Exception as e:
            logger.warning(f"[TreeGen-Appwrite] Appwrite NOT available: {e}")
            self.storage = None
            self._appwrite_available = False

    # ─── Tree Generation ──────────────────────────────────────────────

    def generate_tree_from_pages(self, pages_data, pdf_id, provider='groq', model=None):
        """
        Generate a hierarchical tree index from page-level text data.

        Args:
            pages_data: List of dicts with {'page_number': int, 'text': str}
            pdf_id: UUID of the PDF
            provider: LLM provider for tree generation
            model: Specific model to use

        Returns:
            dict with tree JSON and tree_file_id (if uploaded to Appwrite)
        """
        try:
            logger.info(f"[TreeGen-SVC] === generate_tree_from_pages START ===")
            logger.info(f"[TreeGen-SVC] pdf_id={pdf_id} provider={provider} model={model}")
            logger.info(f"[TreeGen-SVC] pages_data count: {len(pages_data)}")

            # Build page texts
            page_texts = {}
            for page in pages_data:
                if page.get('text', '').strip():
                    page_texts[page['page_number']] = page['text']

            logger.info(f"[TreeGen-SVC] Non-empty page_texts count: {len(page_texts)}")

            if len(page_texts) < 1:
                logger.warning(f"[TreeGen-SVC] ABORT: No text pages to build tree for PDF {pdf_id}")
                return {'status': 'error', 'message': 'No text content for tree generation'}

            # Try using PageIndex library first
            logger.info("[TreeGen-SVC] Step 1: Trying PageIndex library...")
            tree = self._generate_tree_with_library(page_texts, provider, model)
            if tree is None:
                # Fallback: generate tree using LLM directly
                logger.info("[TreeGen-SVC] Step 2: Library returned None, trying LLM fallback...")
                tree = self._generate_tree_with_llm(page_texts, provider, model)

            if tree is None:
                logger.error("[TreeGen-SVC] ABORT: Both library and LLM failed to generate tree")
                return {'status': 'error', 'message': 'Tree generation failed'}

            logger.info(f"[TreeGen-SVC] Tree generated successfully! Keys: {list(tree.keys())}")
            logger.info(f"[TreeGen-SVC] Tree title: {tree.get('title', 'N/A')}")
            logger.info(f"[TreeGen-SVC] Tree top-level nodes: {len(tree.get('nodes', []))}")

            # Add page texts to tree for later retrieval
            tree['_page_texts'] = {str(k): v for k, v in page_texts.items()}
            logger.info(f"[TreeGen-SVC] Added _page_texts ({len(page_texts)} pages)")

            # Upload tree to Appwrite
            logger.info("[TreeGen-SVC] Step 3: Uploading tree to Appwrite...")
            logger.info(f"[TreeGen-SVC] Appwrite available: {self._appwrite_available}")
            logger.info(f"[TreeGen-SVC] Bucket ID: {self.bucket_id}")
            tree_file_id = self._upload_tree_to_appwrite(tree, pdf_id)
            logger.info(f"[TreeGen-SVC] Appwrite upload result: tree_file_id={tree_file_id}")

            if tree_file_id is None:
                logger.error("[TreeGen-SVC] WARNING: tree_file_id is None — Appwrite upload failed!")

            node_count = self._count_nodes(tree)
            logger.info(f"[TreeGen-SVC] === generate_tree_from_pages DONE === file_id={tree_file_id}, nodes={node_count}")
            return {
                'status': 'success',
                'tree_file_id': tree_file_id,
                'node_count': node_count
            }

        except Exception as e:
            logger.error(f"[TreeGen-SVC] EXCEPTION in generate_tree_from_pages: {e}", exc_info=True)
            return {'status': 'error', 'message': str(e)}

    def _generate_tree_with_library(self, page_texts, provider, model):
        """Try generating tree using the PageIndex library."""
        try:
            logger.info("[TreeGen-Lib] Attempting to import pageindex library...")
            from pageindex import PageIndex

            # PageIndex expects a list of page strings
            pages_list = [page_texts.get(i, '') for i in range(1, max(page_texts.keys()) + 1)]
            logger.info(f"[TreeGen-Lib] Built pages_list with {len(pages_list)} entries")

            pi = PageIndex()
            logger.info("[TreeGen-Lib] PageIndex() instantiated, calling build_tree()...")
            tree = pi.build_tree(pages_list)

            if tree and isinstance(tree, dict):
                logger.info(f"[TreeGen-Lib] SUCCESS: Tree generated via PageIndex library, keys={list(tree.keys())}")
                return tree
            else:
                logger.warning(f"[TreeGen-Lib] build_tree returned invalid result: type={type(tree)}, value={str(tree)[:200]}")

        except ImportError:
            logger.info("[TreeGen-Lib] PageIndex library NOT installed, will use LLM fallback")
        except Exception as e:
            logger.warning(f"[TreeGen-Lib] PageIndex library FAILED: {e}", exc_info=True)

        return None

    def _generate_tree_with_llm(self, page_texts, provider, model):
        """Generate tree using LLM analysis of the document."""
        logger.info(f"[TreeGen-LLM] === LLM tree generation START ===")
        logger.info(f"[TreeGen-LLM] provider={provider} model={model}")
        logger.info(f"[TreeGen-LLM] ai_generator available: {self.ai_generator is not None}")

        if not self.ai_generator:
            logger.error("[TreeGen-LLM] ABORT: No AI generator available")
            return None

        try:
            # Build a condensed overview with full-document coverage.
            doc_overview = self._build_tree_generation_overview(page_texts)
            sampled_pages = doc_overview.count('--- PAGE ')
            logger.info(f"[TreeGen-LLM] Built doc_overview: {sampled_pages} pages, {len(doc_overview)} chars")

            prompt = f"""Analyze this document and create a hierarchical tree index (like a table of contents).

DOCUMENT PAGES:
{doc_overview}

Create a JSON tree with this exact structure:
{{
  "title": "Document Title",
  "doc_description": "Brief description of what this document is about",
  "nodes": [
    {{
      "title": "Section Title",
      "node_id": "0001",
      "start_index": 1,
      "end_index": 5,
      "summary": "2-3 sentence summary of this section",
      "nodes": [
        {{
          "title": "Subsection Title",
          "node_id": "0002",
          "start_index": 2,
          "end_index": 3,
          "summary": "Summary of subsection"
        }}
      ]
    }}
  ]
}}

Rules:
1. start_index and end_index are PAGE NUMBERS (1-based)
2. Each node covers a contiguous range of pages
3. Use descriptive section titles
4. node_id must be unique, zero-padded 4-digit string
5. Add 2-3 sentence summaries for each node
6. Create nested nodes for subsections when appropriate
7. Return ONLY valid JSON, no markdown or explanation

JSON:"""

            logger.info(f"[TreeGen-LLM] Calling _call_llm with provider={provider} model={model} max_tokens=4000...")
            response = self.ai_generator._call_llm(
                prompt, provider=provider, model=model,
                max_tokens=4000, temperature=0.1
            )
            logger.info(f"[TreeGen-LLM] LLM response received, length={len(response) if response else 0}")
            logger.info(f"[TreeGen-LLM] LLM response preview: {(response or '')[:300]}")

            # Parse JSON from response
            logger.info("[TreeGen-LLM] Parsing JSON from LLM response...")
            tree = self._parse_json_response(response)
            if tree and 'nodes' in tree:
                logger.info(f"[TreeGen-LLM] SUCCESS: Tree parsed, title={tree.get('title')}, top-level nodes={len(tree.get('nodes', []))}")
                return tree
            else:
                logger.warning(f"[TreeGen-LLM] FAILED: Invalid tree structure. Got type={type(tree)}, keys={list(tree.keys()) if isinstance(tree, dict) else 'N/A'}")
                return None

        except Exception as e:
            logger.error(f"[TreeGen-LLM] EXCEPTION: {e}", exc_info=True)
            logger.error(f"LLM tree generation failed: {e}")
            return None

    def _build_tree_generation_overview(self, page_texts):
        """Create a tree-generation overview that covers the whole document, not only early pages."""
        if not page_texts:
            return ''

        ordered_pages = sorted(page_texts.keys())
        total_pages = len(ordered_pages)
        max_pages = max(20, self.tree_overview_max_pages)

        # Priority pages: front matter + pages that look like table of contents/index hints.
        front_pages = ordered_pages[: min(20, total_pages)]
        toc_like_pages = []
        for p in ordered_pages[: min(60, total_pages)]:
            text = (page_texts.get(p) or '').lower()
            if ('contents' in text) or ('table of contents' in text) or ('chapter' in text and '....' in text):
                toc_like_pages.append(p)

        # Even coverage across the entire document.
        remaining_budget = max(0, max_pages - len(set(front_pages + toc_like_pages)))
        coverage_pages = []
        if remaining_budget > 0 and total_pages > 0:
            if remaining_budget >= total_pages:
                coverage_pages = ordered_pages
            else:
                step = max(1, total_pages // remaining_budget)
                coverage_pages = [ordered_pages[i] for i in range(0, total_pages, step)]

        selected_pages = []
        seen = set()
        for p in front_pages + toc_like_pages + coverage_pages:
            if p in seen:
                continue
            seen.add(p)
            selected_pages.append(p)
            if len(selected_pages) >= max_pages:
                break

        summary_parts = []
        for page_num in selected_pages:
            text = page_texts.get(page_num, '')
            preview = (text or '')[:420].strip()
            if preview:
                summary_parts.append(f"--- PAGE {page_num} ---\n{preview}")

        logger.info(
            "[TreeGen-LLM] Overview sampling total_pages=%s selected=%s max_pages=%s",
            total_pages,
            len(summary_parts),
            max_pages,
        )
        return "\n\n".join(summary_parts)

    def _parse_json_response(self, response):
        """Extract and parse JSON from LLM response."""
        try:
            # Try direct parse
            return json.loads(response)
        except json.JSONDecodeError:
            pass

        # Try extracting JSON from markdown code block
        try:
            if '```json' in response:
                json_str = response.split('```json')[1].split('```')[0].strip()
                return json.loads(json_str)
            elif '```' in response:
                json_str = response.split('```')[1].split('```')[0].strip()
                return json.loads(json_str)
        except (json.JSONDecodeError, IndexError):
            pass

        # Try finding JSON object in response
        try:
            start = response.index('{')
            end = response.rindex('}') + 1
            return json.loads(response[start:end])
        except (ValueError, json.JSONDecodeError):
            pass

        logger.error("Could not parse JSON from LLM response")
        return None

    # ─── Tree Storage (Appwrite) ──────────────────────────────────────

    def _upload_tree_to_appwrite(self, tree, pdf_id):
        """Upload tree JSON to Appwrite bucket."""
        logger.info(f"[TreeGen-Upload] === _upload_tree_to_appwrite START ===")
        logger.info(f"[TreeGen-Upload] pdf_id={pdf_id}")
        logger.info(f"[TreeGen-Upload] _appwrite_available={self._appwrite_available}")
        logger.info(f"[TreeGen-Upload] bucket_id={self.bucket_id}")
        logger.info(f"[TreeGen-Upload] storage object: {self.storage}")

        if not self._appwrite_available:
            logger.error("[TreeGen-Upload] ABORT: Appwrite not available, tree will NOT be persisted!")
            return None

        try:
            tree_json = json.dumps(tree, ensure_ascii=False)
            tree_bytes = tree_json.encode('utf-8')
            logger.info(f"[TreeGen-Upload] Tree JSON size: {len(tree_bytes)} bytes")

            # Save to temp file for upload
            fd, tmp_path = tempfile.mkstemp(suffix='.json')
            with os.fdopen(fd, 'wb') as f:
                f.write(tree_bytes)
            logger.info(f"[TreeGen-Upload] Temp file written: {tmp_path}")

            try:
                file_id = self.ID.unique()
                logger.info(f"[TreeGen-Upload] Generated file_id: {file_id}")
                logger.info(f"[TreeGen-Upload] Calling storage.create_file(bucket={self.bucket_id}, file_id={file_id})...")

                result = self.storage.create_file(
                    bucket_id=self.bucket_id,
                    file_id=file_id,
                    file=self.InputFile.from_path(tmp_path),
                )
                logger.info(f"[TreeGen-Upload] SUCCESS! Appwrite returned: $id={result['$id']}, size={result.get('sizeOriginal', '?')} bytes")
                logger.info(f"[TreeGen-Upload] Full Appwrite response keys: {list(result.keys())}")
                return result['$id']
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                    logger.info(f"[TreeGen-Upload] Temp file cleaned up: {tmp_path}")

        except Exception as e:
            logger.error(f"[TreeGen-Upload] EXCEPTION during Appwrite upload: {e}", exc_info=True)
            return None

    def download_tree_from_appwrite(self, tree_file_id):
        """Download tree JSON from Appwrite."""
        if not self._appwrite_available or not tree_file_id:
            return None

        try:
            # Use REST API directly (same pattern as pdf_processor.py)
            endpoint = os.getenv('APPWRITE_ENDPOINT')
            project = os.getenv('APPWRITE_PROJECT_ID')
            api_key = os.getenv('APPWRITE_API_KEY')

            url = f"{endpoint}/storage/buckets/{self.bucket_id}/files/{tree_file_id}/download"
            headers = {
                "X-Appwrite-Project": project,
                "X-Appwrite-Key": api_key
            }

            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                logger.error(f"Appwrite download failed: {response.status_code}")
                return None

            tree = json.loads(response.content.decode('utf-8'))
            logger.info(f"Tree downloaded from Appwrite: {tree_file_id}")
            return tree

        except Exception as e:
            logger.error(f"Failed to download tree from Appwrite: {e}")
            return None

    def delete_tree_from_appwrite(self, tree_file_id):
        """Delete tree JSON from Appwrite (called on PDF deletion)."""
        if not self._appwrite_available or not tree_file_id:
            return

        try:
            self.storage.delete_file(self.bucket_id, tree_file_id)
            logger.info(f"Tree deleted from Appwrite: {tree_file_id}")
        except Exception as e:
            logger.warning(f"Failed to delete tree from Appwrite: {e}")

    # ─── Tree Search (LLM Reasoning) ─────────────────────────────────

    def tree_search(self, query, tree, provider='groq', model=None, conversation_history=None):
        """
        Use LLM reasoning to find relevant sections in the tree.

        Returns:
            List of relevant page numbers and section info.
        """
        if not self.ai_generator:
            raise Exception("AI generator not available for tree search")

        try:
            page_texts = tree.get('_page_texts', {})
            effective_query = self._prepare_query_for_retrieval(query, conversation_history, provider, model)
            query_shape = self._analyze_query_shape(effective_query)
            probe_budget = min(self.base_candidates, self.max_candidates)

            probe_candidates = self._rank_tree_candidates(
                effective_query,
                tree,
                page_texts,
                max_candidates=probe_budget,
            )

            if not probe_candidates:
                logger.warning("Tree search found no probe candidates")
                return []

            expanded_query = self._expand_query(effective_query, probe_candidates)
            if expanded_query != effective_query:
                probe_candidates = self._rank_tree_candidates(
                    expanded_query,
                    tree,
                    page_texts,
                    max_candidates=probe_budget,
                )

            candidate_budget = self._candidate_budget(
                query_shape,
                self._analyze_ranking_distribution(probe_candidates),
                self._analyze_tree_structure(tree, probe_candidates),
            )

            if candidate_budget > len(probe_candidates):
                candidate_nodes = self._rank_tree_candidates(
                    expanded_query,
                    tree,
                    page_texts,
                    max_candidates=candidate_budget,
                )
            else:
                candidate_nodes = probe_candidates[:candidate_budget]

            if not candidate_nodes:
                logger.warning("Tree search found no candidate nodes")
                return []

            ranking_stats = self._analyze_ranking_distribution(candidate_nodes)
            tree_stats = self._analyze_tree_structure(tree, candidate_nodes)
            logger.info(
                "[PageIndex-Search] Adaptive budget probe=%s final=%s query_shape=%s ranking=%s tree=%s",
                probe_budget,
                candidate_budget,
                query_shape,
                ranking_stats,
                tree_stats,
            )

            if self._is_low_confidence(candidate_nodes):
                logger.info("[PageIndex-Search] Low confidence rank detected. Running broad pass over full tree catalog.")
                broad_node_ids = self._broad_tree_pass(effective_query, tree, provider, model)
                if broad_node_ids:
                    broad_candidates = self._candidates_from_node_ids(broad_node_ids, tree, page_texts)
                    candidate_nodes = self._merge_candidates(candidate_nodes, broad_candidates, limit=candidate_budget)
                    logger.info(
                        "[PageIndex-Search] Broad pass merged %s nodes, candidate set size=%s",
                        len(broad_candidates),
                        len(candidate_nodes),
                    )

                page_rescue_candidates = self._rank_page_windows(
                    expanded_query,
                    page_texts,
                    max_windows=self.page_rescue_max_windows,
                    window_radius=self.page_rescue_window_radius,
                )
                if page_rescue_candidates:
                    rescue_limit = min(self.max_candidates, candidate_budget + len(page_rescue_candidates))
                    candidate_nodes = self._merge_candidates(candidate_nodes, page_rescue_candidates, limit=rescue_limit)
                    logger.info(
                        "[PageIndex-Search] Page-window rescue merged %s windows, candidate set size=%s",
                        len(page_rescue_candidates),
                        len(candidate_nodes),
                    )

            for idx, candidate in enumerate(candidate_nodes[:5], start=1):
                logger.info(
                    "[PageIndex-Search] Candidate %s: id=%s title=%s pages=%s-%s score=%.3f",
                    idx,
                    candidate.get('node_id'),
                    candidate.get('title', '')[:80],
                    candidate.get('start_index'),
                    candidate.get('end_index'),
                    candidate.get('score', 0.0),
                )

            guarded_candidates, grounding_scores, grounded_candidates, core_tokens = self._apply_precision_guard(
                candidate_nodes,
                effective_query,
            )

            # Keep LLM context focused: only top-ranked candidates, not full tree.
            candidate_payload = [
                {
                    'node_id': c['node_id'],
                    'title': c['title'],
                    'start_index': c['start_index'],
                    'end_index': c['end_index'],
                    'summary': c['summary'],
                    'preview': c['preview'],
                    'score_hint': round(c['score'], 3)
                }
                for c in guarded_candidates
            ]

            prompt = f"""Given these candidate sections from a document tree:
{json.dumps(candidate_payload, indent=2)}

Query: {effective_query}

Analyze the candidate sections and identify which are most relevant to answer this query.

Return a JSON object with:
{{
  "relevant_nodes": [
    {{
      "node_id": "0001",
      "title": "Section title",
      "reason": "Why this section is relevant"
    }}
  ]
}}

Rules:
1. Select the MOST specific sections that answer the query.
2. Prefer leaf/deeper nodes over broad parent nodes when both are relevant.
3. Prioritize sections whose preview/summary directly discusses the query terms.
4. Select 1-3 most relevant sections.
5. Return ONLY valid JSON.

JSON:"""

            response = self.ai_generator._call_llm(
                prompt, provider=provider, model=model,
                max_tokens=1000, temperature=0.1
            )

            result = self._parse_json_response(response)
            if not result or 'relevant_nodes' not in result:
                logger.warning("Tree search LLM returned no relevant nodes; using ranked fallback")
                fallback_candidates = grounded_candidates[:3] if grounded_candidates else guarded_candidates[:3]
                return self._build_relevant_info(fallback_candidates)

            relevant_info = self._resolve_llm_selected_candidates(result.get('relevant_nodes', []), guarded_candidates)

            relevant_info = self._post_llm_precision_guard(
                relevant_info,
                grounded_candidates,
                grounding_scores,
                core_tokens,
            )

            if not relevant_info:
                logger.warning("Tree search LLM node IDs did not match candidates; using ranked fallback")
                fallback_candidates = grounded_candidates[:3] if grounded_candidates else guarded_candidates[:3]
                return self._build_relevant_info(fallback_candidates)

            # Keep only unique sections while preserving order.
            deduped = []
            seen = set()
            for section in relevant_info:
                node_id = section['node_id']
                if node_id in seen:
                    continue
                seen.add(node_id)
                deduped.append(section)

            logger.info("[PageIndex-Search] LLM selected %s nodes", len(deduped))
            return deduped[:3]

        except Exception as e:
            logger.error(f"Tree search failed: {e}")
            fallback_budget = min(self.base_candidates, 3)
            fallback_candidates = self._rank_tree_candidates(query, tree, tree.get('_page_texts', {}), max_candidates=fallback_budget)
            return self._build_relevant_info(fallback_candidates)

    def generate_answer_from_tree(self, query, tree, pdf_id, pdf_name,
                                   provider='groq', model=None, conversation_history=None):
        """
        Full PageIndex RAG pipeline:
        1. Tree search → find relevant sections
        2. Extract page text
        3. Generate answer

        Returns:
            Dict with answer, references, and suggested_questions.
        """
        if not self.ai_generator:
            raise Exception("AI generator not available for answer generation")

        try:
            # Step 1: Tree search
            relevant_sections = self.tree_search(query, tree, provider, model, conversation_history)

            if not relevant_sections:
                return {
                    'answer': "I couldn't find relevant sections in the document tree to answer your question.",
                    'references': [],
                    'suggested_questions': []
                }

            # Step 2: Extract page text
            page_texts = tree.get('_page_texts', {})
            context_parts = []
            references = []

            for section in relevant_sections:
                section_text_parts = []
                for page_num in section['pages']:
                    page_text = page_texts.get(str(page_num), '')
                    if page_text:
                        section_text_parts.append(f"[Page {page_num}]\n{page_text}")

                section_text = "\n\n".join(section_text_parts)
                if section_text:
                    context_parts.append(
                        f"=== Section: {section['title']} (Pages {section['pages'][0]}-{section['pages'][-1]}) ===\n"
                        f"{section_text}"
                    )

                    # Create reference for each section
                    references.append({
                        'pdf_id': pdf_id,
                        'pdf_name': pdf_name,
                        'page_number': section['pages'][0],
                        'chunk_index': 0,
                        'chunk_text': section_text[:300],
                        'similarity': 0.95,  # PageIndex doesn't use similarity scores
                        'source': 'pageindex',
                        'section_title': section['title']
                    })

            context = "\n\n".join(context_parts)

            # Step 3: Generate answer
            answer_prompt = f"""You are an expert AI assistant. Answer the question using ONLY the document context below.

DOCUMENT CONTEXT:
{context[:15000]}

QUESTION: {query}

INSTRUCTIONS:
1. Provide a comprehensive answer based on the document context
2. Reference specific sections and page numbers
3. If the context doesn't fully answer the question, say so
4. Do not make up information

ANSWER:"""

            answer = self.ai_generator._call_llm(
                answer_prompt, provider=provider, model=model,
                max_tokens=2000, temperature=0.2
            )

            # Generate follow-up questions
            followups = self.ai_generator._generate_followup_questions(
                answer, query, provider, model=model
            )

            return {
                'answer': answer,
                'references': references,
                'suggested_questions': followups,
                'provider': provider
            }

        except Exception as e:
            logger.error(f"PageIndex answer generation failed: {e}")
            return {
                'answer': "I encountered an error while processing your question with PageIndex. Please try again.",
                'references': [],
                'suggested_questions': []
            }

    # ─── Streaming version ────────────────────────────────────────────

    def generate_answer_stream_from_tree(self, query, tree, pdf_id, pdf_name,
                                          provider='groq', model=None, conversation_history=None):
        """
        Streaming version of generate_answer_from_tree.
        Yields SSE-compatible dicts.
        """
        if not self.ai_generator:
            yield {"type": "metadata", "references": [], "suggested_questions": [], "provider": provider}
            yield {"type": "chunk", "content": "AI generator not available for PageIndex."}
            yield {"type": "done"}
            return

        try:
            # Step 1: Tree search
            relevant_sections = self.tree_search(query, tree, provider, model, conversation_history)

            if not relevant_sections:
                yield {"type": "metadata", "references": [], "suggested_questions": [], "provider": provider}
                yield {"type": "chunk", "content": "I couldn't find relevant sections in the document tree to answer your question."}
                yield {"type": "done"}
                return

            # Step 2: Extract page text and build references
            page_texts = tree.get('_page_texts', {})
            context_parts = []
            references = []

            for section in relevant_sections:
                section_text_parts = []
                for page_num in section['pages']:
                    page_text = page_texts.get(str(page_num), '')
                    if page_text:
                        section_text_parts.append(f"[Page {page_num}]\n{page_text}")

                section_text = "\n\n".join(section_text_parts)
                if section_text:
                    context_parts.append(
                        f"=== Section: {section['title']} (Pages {section['pages'][0]}-{section['pages'][-1]}) ===\n"
                        f"{section_text}"
                    )
                    references.append({
                        'pdf_id': pdf_id,
                        'pdf_name': pdf_name,
                        'page_number': section['pages'][0],
                        'chunk_index': 0,
                        'chunk_text': section_text[:300],
                        'similarity': 0.95,
                        'source': 'pageindex',
                        'section_title': section['title']
                    })

            context = "\n\n".join(context_parts)

            # Yield references first
            yield {"type": "metadata", "references": references, "suggested_questions": [], "provider": provider}

            # Step 3: Stream answer
            answer_prompt = f"""You are an expert AI assistant. Answer the question using ONLY the document context below.

DOCUMENT CONTEXT:
{context[:15000]}

QUESTION: {query}

Answer comprehensively, referencing specific sections and page numbers. Do not make up information.

ANSWER:"""

            full_response = ""
            for chunk in self.ai_generator._call_llm_stream(
                answer_prompt, provider=provider, model=model,
                max_tokens=2000, temperature=0.2
            ):
                full_response += chunk
                yield {"type": "chunk", "content": chunk}

            # Generate follow-up questions
            followups = self.ai_generator._generate_followup_questions(
                full_response, query, provider, model=model
            )
            yield {"type": "followups", "suggested_questions": followups}
            yield {"type": "done"}

        except Exception as e:
            logger.error(f"PageIndex streaming error: {e}")
            yield {"type": "metadata", "references": [], "suggested_questions": [], "provider": provider}
            yield {"type": "chunk", "content": "Error processing with PageIndex. Please try again."}
            yield {"type": "done"}

    # ─── Helpers ──────────────────────────────────────────────────────

    def _get_tree_without_pages(self, tree):
        """Return tree structure without the _page_texts field."""
        cleaned = {k: v for k, v in tree.items() if k != '_page_texts'}
        return cleaned

    def _tokenize_query(self, text):
        """Tokenize text for lightweight lexical matching."""
        if not text:
            return []

        stopwords = {
            'the', 'and', 'for', 'with', 'that', 'this', 'what', 'from', 'into',
            'about', 'your', 'you', 'are', 'was', 'were', 'how', 'why', 'who',
            'when', 'where', 'which', 'term', 'means', 'meaning', 'example', 'examples',
            'please', 'explain', 'tell', 'me', 'of', 'to', 'in', 'on', 'a', 'an', 'is'
        }

        tokens = re.findall(r"[a-zA-Z0-9]+", text.lower())
        return [t for t in tokens if len(t) >= 3 and t not in stopwords]

    def _analyze_query_shape(self, query):
        """Extract generic linguistic signals from the query without domain assumptions."""
        query_text = (query or '').strip()
        query_lower = query_text.lower()
        tokens = self._tokenize_query(query_text)

        conjunction_count = len(re.findall(r"\b(?:and|or)\b", query_lower))
        comparison_count = len(re.findall(r"\b(?:vs\.?|versus|compare|compared|difference|different|contrast)\b", query_lower))
        clause_parts = re.split(r"[?;:]|\b(?:and|or|because|while|whereas|then)\b", query_lower)
        clause_count = len([part for part in clause_parts if self._tokenize_query(part)])

        question_type = 'other'
        if re.match(r"^\s*what\b", query_lower):
            question_type = 'definition'
        elif re.match(r"^\s*how\b", query_lower):
            question_type = 'procedure'
        elif re.match(r"^\s*why\b", query_lower):
            question_type = 'causal'
        elif comparison_count > 0:
            question_type = 'comparison'

        return {
            'token_count': len(tokens),
            'conjunction_count': conjunction_count,
            'comparison_count': comparison_count,
            'clause_count': max(1, clause_count),
            'question_type': question_type,
        }

    def _looks_like_followup(self, query):
        """Detect short/ambiguous follow-up phrasing that needs context rewrite."""
        query_text = (query or '').strip()
        if not query_text:
            return False

        query_lower = query_text.lower()
        tokens = self._tokenize_query(query_text)
        followup_markers = (
            'that', 'this', 'it', 'those', 'these', 'them', 'there', 'then',
            'deeper', 'deep', 'more', 'elaborate', 'expand', 'continue', 'also',
        )

        marker_hit = any(re.search(rf"\b{re.escape(marker)}\b", query_lower) for marker in followup_markers)
        return len(tokens) <= 4 or marker_hit

    def _prepare_query_for_retrieval(self, query, conversation_history, provider, model):
        """Rewrite ambiguous follow-ups into standalone retrieval queries when possible."""
        if not query:
            return ''

        if not conversation_history or not self._looks_like_followup(query):
            return query

        enhancer = getattr(self.ai_generator, '_enhance_question_with_context', None)
        if not callable(enhancer):
            return query

        try:
            rewritten = enhancer(query, conversation_history, provider)
            rewritten = (rewritten or '').strip()
            if rewritten and rewritten.lower() != query.strip().lower():
                logger.info("[PageIndex-Search] Rewrote follow-up query: '%s' -> '%s'", query, rewritten)
                return rewritten
        except Exception as e:
            logger.warning("[PageIndex-Search] Follow-up rewrite failed, using original query: %s", e)

        return query

    def _extract_core_query_tokens(self, query, max_tokens=3):
        """Extract a small set of high-signal query tokens for precision grounding."""
        tokens = self._tokenize_query(query)
        if not tokens:
            return []

        # Keep order by first appearance, prefer longer/high-signal tokens.
        seen = set()
        unique_tokens = []
        for token in tokens:
            if token in seen:
                continue
            seen.add(token)
            unique_tokens.append(token)

        ranked = sorted(unique_tokens, key=lambda t: (-len(t), unique_tokens.index(t)))
        max_tokens = max(1, int(max_tokens or 3))
        return ranked[:max_tokens]

    def _candidate_grounding_score(self, candidate, core_tokens):
        """Score how strongly a candidate is lexically grounded to core query tokens."""
        if not candidate or not core_tokens:
            return 0.0

        title_tokens = self._tokenize_query(candidate.get('title', ''))
        summary_tokens = self._tokenize_query(candidate.get('summary', ''))
        preview_tokens = self._tokenize_query(candidate.get('preview', ''))

        title_score = self._query_token_hit_score(core_tokens, title_tokens)
        summary_score = self._query_token_hit_score(core_tokens, summary_tokens)
        preview_score = self._query_token_hit_score(core_tokens, preview_tokens)

        full_text = " ".join([
            candidate.get('title', ''),
            candidate.get('summary', ''),
            candidate.get('preview', ''),
        ]).lower()
        phrase_bonus = 0.0
        for token in core_tokens:
            if token and token in full_text:
                phrase_bonus += 0.2

        # Title overlap is weighted highest for section-level precision.
        return (1.6 * title_score) + (1.1 * summary_score) + (1.0 * preview_score) + phrase_bonus

    def _apply_precision_guard(self, candidate_nodes, effective_query):
        """Soft precision gate: prioritize grounded candidates without hard-filtering others."""
        if not candidate_nodes:
            return [], {}, [], []

        core_tokens = self._extract_core_query_tokens(effective_query, self.precision_core_max_tokens)
        if not core_tokens:
            return candidate_nodes, {}, [], []

        scored = []
        grounding_scores = {}
        for candidate in candidate_nodes:
            node_id = str(candidate.get('node_id', '')).strip()
            score = self._candidate_grounding_score(candidate, core_tokens)
            grounding_scores[node_id] = score
            scored.append((candidate, score))

        grounded_pairs = [pair for pair in scored if pair[1] >= self.precision_min_grounding_score]
        grounded_pairs.sort(key=lambda x: x[1], reverse=True)

        if grounded_pairs:
            grounded_ids = {str(c.get('node_id', '')).strip() for c, _ in grounded_pairs}
            ordered = [c for c, _ in grounded_pairs]
            ordered.extend([c for c, _ in scored if str(c.get('node_id', '')).strip() not in grounded_ids])
            logger.info(
                "[PageIndex-Search] Precision guard core_tokens=%s grounded=%s/%s min_score=%.2f",
                core_tokens,
                len(grounded_pairs),
                len(candidate_nodes),
                self.precision_min_grounding_score,
            )
            return ordered, grounding_scores, [c for c, _ in grounded_pairs], core_tokens

        logger.info(
            "[PageIndex-Search] Precision guard found no grounded candidates for core_tokens=%s; keeping original order",
            core_tokens,
        )
        return candidate_nodes, grounding_scores, [], core_tokens

    def _post_llm_precision_guard(self, relevant_info, grounded_candidates, grounding_scores, core_tokens):
        """If LLM picks only ungrounded nodes while grounded options exist, replace with grounded fallback."""
        if not relevant_info or not grounded_candidates:
            return relevant_info

        min_score = self.precision_min_grounding_score
        selected_scores = []
        for section in relevant_info:
            node_id = str(section.get('node_id', '')).strip()
            selected_scores.append(float(grounding_scores.get(node_id, 0.0)))

        has_grounded_selection = any(score >= min_score for score in selected_scores)
        if has_grounded_selection:
            return relevant_info

        replacement_count = max(1, min(3, len(relevant_info)))
        replacements = []
        for candidate in grounded_candidates[:replacement_count]:
            replacements.append({
                'node_id': str(candidate.get('node_id', '')).strip(),
                'title': candidate.get('title', ''),
                'reason': f"Selected by precision guard (grounded on core query tokens: {', '.join(core_tokens)})",
                'pages': candidate.get('pages', []),
            })

        if replacements:
            logger.info(
                "[PageIndex-Search] Precision guard replaced ungrounded LLM selection with %s grounded candidates",
                len(replacements),
            )
            return replacements

        return relevant_info

    def _expand_query(self, query, probe_candidates):
        """Expand query using document-adaptive pseudo-relevance feedback (no domain hardcoding)."""
        if not query:
            return ''

        base_query = query.strip()
        query_tokens = set(self._tokenize_query(base_query))
        if not query_tokens:
            return base_query

        if not probe_candidates:
            return base_query

        ranking_stats = self._analyze_ranking_distribution(probe_candidates)
        should_expand = (
            ranking_stats.get('non_zero_top10', 0) >= 6
            and ranking_stats.get('top1_share', 1.0) < 0.45
            and ranking_stats.get('relative_gap', 1.0) < 0.22
        )
        if not should_expand:
            return base_query

        token_counts = {}
        token_doc_counts = {}
        doc_total = max(1, len(probe_candidates))
        for candidate in probe_candidates:
            candidate_text = " ".join([
                candidate.get('title', ''),
                candidate.get('summary', ''),
                candidate.get('preview', ''),
            ])
            candidate_tokens = self._tokenize_query(candidate_text)
            for token in candidate_tokens:
                if token in query_tokens:
                    continue
                token_counts[token] = token_counts.get(token, 0) + 1
            for token in set(candidate_tokens):
                if token in query_tokens:
                    continue
                token_doc_counts[token] = token_doc_counts.get(token, 0) + 1

        if not token_counts:
            return base_query

        def term_weight(term, count):
            doc_freq = token_doc_counts.get(term, 0) / doc_total
            if doc_freq > 0.8:
                return -1.0
            # Prefer terms that are frequent but not ubiquitous in probe candidates.
            return count * (1.0 - doc_freq)

        ranked_terms = sorted(token_counts.items(), key=lambda x: (-term_weight(x[0], x[1]), x[0]))
        feedback_terms = [term for term, _ in ranked_terms[: max(0, self.expansion_max_terms)]]

        if not feedback_terms:
            return base_query

        expanded_query = base_query + " " + " ".join(feedback_terms)
        logger.info("[PageIndex-Search] Expanded query with feedback terms: %s", feedback_terms)
        return expanded_query

    def _normalize_node_id(self, node_id):
        """Normalize node IDs like 1/001/0001 to a consistent 4-digit key."""
        raw = str(node_id or '').strip()
        if not raw:
            return ''
        if raw.isdigit():
            return raw.zfill(4)
        return raw

    def _resolve_llm_selected_candidates(self, selected_nodes, candidate_nodes):
        """Resolve LLM-selected nodes against candidates with tolerant ID/title matching."""
        if not selected_nodes or not candidate_nodes:
            return []

        direct_map = {str(c.get('node_id', '')).strip(): c for c in candidate_nodes if c.get('node_id')}
        normalized_map = {self._normalize_node_id(c.get('node_id')): c for c in candidate_nodes if c.get('node_id')}
        unresolved = []
        resolved = []

        for node_info in selected_nodes:
            node_id_raw = str(node_info.get('node_id', '')).strip()
            candidate = direct_map.get(node_id_raw)
            if not candidate and node_id_raw:
                candidate = normalized_map.get(self._normalize_node_id(node_id_raw))

            if not candidate:
                unresolved.append(node_info)
                continue

            resolved.append({
                'node_id': str(candidate.get('node_id', '')).strip(),
                'title': node_info.get('title', '') or candidate.get('title', ''),
                'reason': node_info.get('reason', ''),
                'pages': candidate.get('pages', []),
            })

        if unresolved:
            remaining = [c for c in candidate_nodes if str(c.get('node_id', '')).strip() not in {r['node_id'] for r in resolved}]
            for node_info in unresolved:
                llm_title = str(node_info.get('title', '')).strip().lower()
                if not llm_title or not remaining:
                    continue

                best = None
                best_score = 0.0
                for candidate in remaining:
                    cand_title = str(candidate.get('title', '')).strip().lower()
                    if not cand_title:
                        continue
                    ratio = SequenceMatcher(None, llm_title, cand_title).ratio()
                    if llm_title in cand_title or cand_title in llm_title:
                        ratio += 0.2
                    if ratio > best_score:
                        best_score = ratio
                        best = candidate

                if best and best_score >= 0.62:
                    resolved.append({
                        'node_id': str(best.get('node_id', '')).strip(),
                        'title': node_info.get('title', '') or best.get('title', ''),
                        'reason': node_info.get('reason', ''),
                        'pages': best.get('pages', []),
                    })

        deduped = []
        seen = set()
        for section in resolved:
            node_id = section.get('node_id', '')
            pages = section.get('pages', [])
            if not node_id or not pages or node_id in seen:
                continue
            seen.add(node_id)
            deduped.append(section)

        return deduped

    def _analyze_ranking_distribution(self, ranked_candidates):
        """Summarize how sharp or diffuse the first-pass ranking is."""
        if not ranked_candidates:
            return {
                'top1_score': 0.0,
                'top2_score': 0.0,
                'gap': 0.0,
                'relative_gap': 0.0,
                'top1_share': 0.0,
                'non_zero_top10': 0,
            }

        top_slice = ranked_candidates[:10]
        scores = [float(candidate.get('score', 0.0)) for candidate in top_slice]
        top1_score = scores[0] if scores else 0.0
        top2_score = scores[1] if len(scores) > 1 else 0.0
        gap = top1_score - top2_score
        relative_gap = gap / max(top1_score, 1.0)
        top1_share = top1_score / max(sum(scores[:5]), 1.0)
        non_zero_top10 = sum(1 for score in scores if score > 0)

        return {
            'top1_score': round(top1_score, 3),
            'top2_score': round(top2_score, 3),
            'gap': round(gap, 3),
            'relative_gap': round(relative_gap, 3),
            'top1_share': round(top1_share, 3),
            'non_zero_top10': non_zero_top10,
        }

    def _analyze_tree_structure(self, tree, ranked_candidates):
        """Summarize tree topology and top-candidate page dispersion for adaptive budgeting."""
        flattened = self._flatten_tree_nodes(tree)
        node_count = len(flattened)
        max_depth = max((node.get('depth', 0) for node in flattened), default=0)

        top_candidates = ranked_candidates[:5]
        top_starts = [int(candidate.get('start_index', 1) or 1) for candidate in top_candidates]
        top_page_dispersion = (max(top_starts) - min(top_starts)) if len(top_starts) > 1 else 0

        return {
            'node_count': node_count,
            'max_depth': max_depth,
            'top_page_dispersion': top_page_dispersion,
        }

    def _candidate_budget(self, query_shape, ranking_stats, tree_stats):
        """Compute candidate budget from query shape and first-pass retrieval evidence."""
        budget = self.base_candidates

        token_count = query_shape.get('token_count', 0)
        clause_count = query_shape.get('clause_count', 1)
        conjunction_count = query_shape.get('conjunction_count', 0)
        comparison_count = query_shape.get('comparison_count', 0)

        if token_count >= 10:
            budget += 6
        elif token_count >= 6:
            budget += 3

        if clause_count >= 3:
            budget += 6
        elif clause_count == 2:
            budget += 3

        if conjunction_count > 0:
            budget += 2

        if comparison_count > 0:
            budget += 4

        if ranking_stats.get('non_zero_top10', 0) >= 8 and ranking_stats.get('top1_share', 1.0) < 0.38:
            budget += 6
        elif ranking_stats.get('relative_gap', 1.0) < 0.12:
            budget += 4

        top_page_dispersion = tree_stats.get('top_page_dispersion', 0)
        if top_page_dispersion >= 100:
            budget += 8
        elif top_page_dispersion >= 50:
            budget += 5

        if tree_stats.get('node_count', 0) > 60 and tree_stats.get('max_depth', 0) >= 4:
            budget += 2

        return max(self.base_candidates, min(int(budget), self.max_candidates))

    def _is_low_confidence(self, ranked_candidates):
        """Detect uncertain lexical ranking and trigger broad reasoning pass."""
        if not ranked_candidates:
            return True

        top1 = float(ranked_candidates[0].get('score', 0.0))
        top2 = float(ranked_candidates[1].get('score', 0.0)) if len(ranked_candidates) > 1 else 0.0
        gap = top1 - top2

        return top1 < self.low_conf_top1 or gap < self.low_conf_gap

    def _broad_tree_pass(self, query, tree, provider, model):
        """Run one global reasoning pass over compact tree catalog for recall rescue."""
        if not self.ai_generator:
            return []

        all_nodes = self._flatten_tree_nodes(tree)
        if not all_nodes:
            return []

        compact_catalog = []
        for node in all_nodes[:200]:
            compact_catalog.append({
                'node_id': node.get('node_id'),
                'title': node.get('title', ''),
                'summary': node.get('summary', '')[:250],
                'start_index': node.get('start_index'),
                'end_index': node.get('end_index'),
                'depth': node.get('depth', 0),
            })

        prompt = f"""You are selecting relevant nodes from a document tree catalog.

Query: {query}

Tree catalog:
{json.dumps(compact_catalog, indent=2)}

Return valid JSON only:
{{
  "relevant_nodes": [
    {{
      "node_id": "0001",
      "reason": "why it is relevant"
    }}
  ]
}}

Rules:
1. Return 1-5 node_ids.
2. Prefer specific/deep nodes when possible.
3. Do not include node_ids that are not in the catalog.
"""

        try:
            response = self.ai_generator._call_llm(
                prompt,
                provider=provider,
                model=model,
                max_tokens=900,
                temperature=0.1,
            )
            parsed = self._parse_json_response(response) or {}
            node_ids = []
            for item in parsed.get('relevant_nodes', []):
                node_id = str(item.get('node_id', '')).strip()
                if node_id:
                    node_ids.append(node_id)
            return list(dict.fromkeys(node_ids))
        except Exception as e:
            logger.warning(f"[PageIndex-Search] Broad pass failed: {e}")
            return []

    def _candidates_from_node_ids(self, node_ids, tree, page_texts):
        """Materialize candidate entries from node IDs with neutral but non-zero score."""
        if not node_ids:
            return []

        node_map = {n.get('node_id'): n for n in self._flatten_tree_nodes(tree)}
        candidates = []
        for node_id in node_ids:
            node = node_map.get(node_id)
            if not node:
                continue

            preview = self._node_preview_text(node.get('pages', []), page_texts)
            candidates.append({
                **node,
                'preview': preview[:300],
                'score': 0.5,
            })

        return candidates

    def _merge_candidates(self, ranked_candidates, broad_candidates, limit):
        """Merge lexical and broad-pass candidates while preserving lexical order preference."""
        merged = {c.get('node_id'): c for c in ranked_candidates if c.get('node_id')}

        for candidate in broad_candidates:
            node_id = candidate.get('node_id')
            if not node_id:
                continue
            if node_id not in merged:
                merged[node_id] = candidate

        merged_list = list(merged.values())
        merged_list.sort(key=lambda x: float(x.get('score', 0.0)), reverse=True)
        return merged_list[:limit]

    def _flatten_tree_nodes(self, tree):
        """Flatten tree into a list of nodes with page ranges and metadata."""
        flat = []

        def walk(nodes, depth=0):
            for node in nodes or []:
                start = int(node.get('start_index', 1) or 1)
                end = int(node.get('end_index', start) or start)
                if end < start:
                    end = start

                pages = list(range(start, end + 1))
                flat.append({
                    'node_id': str(node.get('node_id', '')).strip(),
                    'title': str(node.get('title', '')).strip(),
                    'summary': str(node.get('summary', '')).strip(),
                    'start_index': start,
                    'end_index': end,
                    'pages': pages,
                    'depth': depth,
                })
                walk(node.get('nodes', []), depth + 1)

        walk(tree.get('nodes', []), depth=0)
        return [n for n in flat if n['node_id']]

    def _node_preview_text(self, pages, page_texts, max_chars=600):
        """Collect a bounded text preview from node pages for relevance scoring."""
        collected = []
        total = 0
        for page in pages[:4]:
            text = (page_texts.get(str(page)) or '').strip()
            if not text:
                continue
            remaining = max_chars - total
            if remaining <= 0:
                break
            snippet = text[:remaining]
            collected.append(snippet)
            total += len(snippet)
            if total >= max_chars:
                break

        return "\n".join(collected)

    def _token_similarity(self, a, b):
        """Return normalized similarity between two tokens."""
        if not a or not b:
            return 0.0
        return SequenceMatcher(None, a, b).ratio()

    def _query_token_hit_score(self, query_tokens, candidate_tokens):
        """Compute robust token hit score with exact and typo-tolerant fuzzy matches."""
        if not query_tokens or not candidate_tokens:
            return 0.0

        candidate_set = set(candidate_tokens)
        score = 0.0
        for token in query_tokens:
            if token in candidate_set:
                score += 1.0
                continue

            if len(token) < 5:
                continue

            best = 0.0
            for cand in candidate_set:
                if abs(len(cand) - len(token)) > 3:
                    continue
                sim = self._token_similarity(token, cand)
                if sim > best:
                    best = sim

            if best >= 0.84:
                score += 0.7

        return score

    def _rank_page_windows(self, query, page_texts, max_windows=8, window_radius=1):
        """Build pseudo-candidates from page-level lexical hits for coarse-tree rescue."""
        if not query or not page_texts:
            return []

        query_tokens = self._tokenize_query(query)
        query_lower = query.lower()
        if not query_tokens:
            return []

        page_scores = []
        for page_key, text in page_texts.items():
            try:
                page_num = int(page_key)
            except Exception:
                continue

            content = (text or '').strip()
            if not content:
                continue

            content_lower = content.lower()
            candidate_tokens = self._tokenize_query(content_lower)
            token_score = self._query_token_hit_score(query_tokens, candidate_tokens)
            phrase_hit = 1.0 if query_lower in content_lower else 0.0
            if token_score <= 0 and phrase_hit <= 0:
                continue

            score = (2.2 * token_score) + (3.0 * phrase_hit)
            page_scores.append((page_num, score, content))

        if not page_scores:
            return []

        page_scores.sort(key=lambda x: x[1], reverse=True)
        selected = []
        used_pages = set()
        max_windows = max(1, max_windows)
        window_radius = max(0, window_radius)

        for page_num, score, _ in page_scores:
            if len(selected) >= max_windows:
                break
            if page_num in used_pages:
                continue

            start = max(1, page_num - window_radius)
            end = page_num + window_radius
            pages = list(range(start, end + 1))
            for p in pages:
                used_pages.add(p)

            preview = self._node_preview_text(pages, page_texts)
            selected.append({
                'node_id': f"page-{page_num:05d}",
                'title': f"Pages {start}-{end} (keyword match)",
                'summary': 'High lexical overlap with user query from page text',
                'start_index': start,
                'end_index': end,
                'pages': pages,
                'depth': 99,
                'preview': preview[:300],
                'score': score,
            })

        return selected

    def _rank_tree_candidates(self, query, tree, page_texts, max_candidates=20):
        """Rank tree nodes with lexical + structure signals before LLM selection."""
        query_tokens = self._tokenize_query(query)
        if not query_tokens:
            query_tokens = self._tokenize_query(query.lower())

        flattened = self._flatten_tree_nodes(tree)
        if not flattened:
            return []

        ranked = []
        query_lower = query.lower()

        for node in flattened:
            preview = self._node_preview_text(node['pages'], page_texts)
            haystack = " ".join([
                node.get('title', ''),
                node.get('summary', ''),
                preview
            ]).lower()
            candidate_tokens = self._tokenize_query(haystack)

            token_hits = self._query_token_hit_score(query_tokens, candidate_tokens)
            phrase_hit = 1 if query_lower in haystack else 0
            page_span = max(1, (node['end_index'] - node['start_index'] + 1))
            specificity_bonus = 1.0 / page_span
            depth_bonus = 0.15 * node.get('depth', 0)

            score = (2.2 * token_hits) + (3.0 * phrase_hit) + specificity_bonus + depth_bonus

            ranked.append({
                **node,
                'preview': preview[:300],
                'score': score,
            })

        ranked.sort(key=lambda x: x['score'], reverse=True)

        # If everything scored zero, still keep small set to let LLM reason.
        if ranked and ranked[0]['score'] <= 0:
            return ranked[: min(max_candidates, 8)]

        return ranked[:max_candidates]

    def _build_relevant_info(self, candidates):
        """Convert ranked candidates to the response schema used by answer generation."""
        relevant = []
        for c in candidates:
            pages = c.get('pages') or []
            if not pages:
                continue
            relevant.append({
                'node_id': c.get('node_id', ''),
                'title': c.get('title', ''),
                'reason': 'Selected via relevance fallback ranking',
                'pages': pages,
            })
        return relevant

    def _get_pages_for_node(self, node_id, tree):
        """Extract page range for a given node_id from the tree."""
        def search(nodes):
            for node in nodes:
                if node.get('node_id') == node_id:
                    start = node.get('start_index', 1)
                    end = node.get('end_index', start)
                    return list(range(start, end + 1))
                if 'nodes' in node:
                    result = search(node['nodes'])
                    if result:
                        return result
            return None

        return search(tree.get('nodes', []))

    def _count_nodes(self, tree):
        """Count total nodes in the tree."""
        count = 0
        def _count(nodes):
            nonlocal count
            for node in nodes:
                count += 1
                if 'nodes' in node:
                    _count(node['nodes'])
        _count(tree.get('nodes', []))
        return count
