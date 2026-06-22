import json
import numpy as np
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple
from app.db.models import BrandDocument, Transcript
from app.services.ai_manager import AIManager

class RAGService:
    """Service to handle document chunking, embedding, retrieval, and vector search."""

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 800, chunk_overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks of approx chunk_size characters."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - chunk_overlap
        return chunks

    @staticmethod
    async def add_document(db: Session, filename: str, content: str, user_id: int = None) -> BrandDocument:
        """Embed and add a new brand voice style guide or reference document."""
        # Clean text
        content = content.strip()
        
        # We store the document in the DB.
        # Since brand documents are usually short style guides, we can embed the whole document,
        # or embed it chunk by chunk. For simplicity and robustness, we embed the document.
        # If it is long, we can chunk it. Let's chunk if len > 1200 chars.
        # For simplicity, let's store the full doc, and embed it.
        vector = await AIManager.generate_embeddings(content)
        
        doc = BrandDocument(
            filename=filename,
            content=content,
            embedding_json=json.dumps(vector),
            user_id=user_id
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        a = np.array(v1)
        b = np.array(v2)
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return float(dot / (norm_a * norm_b))

    @staticmethod
    async def retrieve_relevant_contexts(
        db: Session,
        query: str,
        video_id: int,
        top_k: int = 2
    ) -> Tuple[List[str], List[str]]:
        """
        Search both the Brand Documents and the Transcript for chunks relevant to the query.
        
        Returns:
            Tuple[List[str], List[str]]: (brand_context_list, transcript_context_list)
        """
        # Embed the query
        query_vector = await AIManager.generate_embeddings(query)
        
        # 1. Search brand voice documents
        from app.db.models import Video
        video = db.query(Video).filter(Video.id == video_id).first()
        if video and video.user_id:
            brand_docs = db.query(BrandDocument).filter(BrandDocument.user_id == video.user_id).all()
        else:
            brand_docs = db.query(BrandDocument).all()
            
        brand_results = []
        for doc in brand_docs:
            if doc.embedding_json:
                doc_vec = json.loads(doc.embedding_json)
                similarity = RAGService.cosine_similarity(query_vector, doc_vec)
                brand_results.append((doc.content, similarity))
        
        # Sort and select top_k brand guides
        brand_results.sort(key=lambda x: x[1], reverse=True)
        retrieved_brand = [item[0] for item in brand_results[:top_k]]

        # 2. Search transcript chunks
        retrieved_transcript = []
        transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
        if transcript:
            chunks = RAGService.chunk_text(transcript.raw_text)
            chunk_results = []
            for chunk in chunks:
                chunk_vec = await AIManager.generate_embeddings(chunk)
                similarity = RAGService.cosine_similarity(query_vector, chunk_vec)
                chunk_results.append((chunk, similarity))
            
            chunk_results.sort(key=lambda x: x[1], reverse=True)
            retrieved_transcript = [item[0] for item in chunk_results[:top_k]]

        return retrieved_brand, retrieved_transcript

    @staticmethod
    async def chat_with_video(
        db: Session,
        video_id: int,
        query: str,
        chat_history: List[Dict[str, str]] = []
    ) -> str:
        """
        Queries the video context + brand voice documents and returns an LLM response.
        """
        # Retrieve context
        brand_contexts, transcript_contexts = await RAGService.retrieve_relevant_contexts(db, query, video_id)
        
        # Build prompt
        system_instruction = (
            "You are CreatorPilot AI, a personalized assistant for creators. Your job is to help the creator "
            "write copy, answer questions, draft threads, and summarize content based on their video transcript "
            "and their brand voice style guides. Write in a engaging, confident, and professional creator-first voice."
        )

        context_str = ""
        if brand_contexts:
            context_str += "=== BRAND VOICE & STYLE GUIDELINES ===\n"
            for i, bc in enumerate(brand_contexts):
                context_str += f"[Brand doc {i+1}]:\n{bc}\n\n"
                
        if transcript_contexts:
            context_str += "=== RELEVANT VIDEO TRANSCRIPT CONTEXT ===\n"
            for i, tc in enumerate(transcript_contexts):
                context_str += f"[Transcript segment {i+1}]:\n{tc}\n\n"

        history_str = ""
        for msg in chat_history[-6:]:  # include last 6 messages
            role = msg.get("role", "user")
            content = msg.get("content", "")
            history_str += f"{role.capitalize()}: {content}\n"

        prompt = (
            f"Here is the context available for the video and brand style:\n"
            f"\"\"\"\n{context_str}\"\"\"\n\n"
            f"Here is the chat history:\n{history_str}\n"
            f"User request: {query}\n\n"
            f"Generate a helpful response. If the user asks you to draft content (like a LinkedIn post, thread, or email), "
            f"closely follow the brand voice guidelines. Base factual statements strictly on the transcript context."
        )

        return await AIManager.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            json_mode=False,
            preferred_provider="gemini"
        )
