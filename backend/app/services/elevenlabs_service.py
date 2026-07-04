import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class ElevenLabsService:
    def __init__(self):
        self.api_key = settings.smallest_api_key
        # Default voice for Smallest AI
        self.default_voice_id = "meher"

    async def transcribe_audio(self, audio_content: bytes, filename: str) -> str:
        """
        Transcribe audio content using Smallest AI Pulse API.
        """
        if not self.api_key:
            logger.warning("[Smallest AI] API key not configured. Using mock fallback transcription.")
            return "This is a mock transcription because your Smallest AI API Key is not set in the .env file."

        url = "https://waves-api.smallest.ai/api/v1/pulse/get_text"
        params = {
            "model": "pulse",
            "language": "en"
        }
        
        content_type = "audio/wav"
        if filename and filename.endswith(".webm"):
            content_type = "audio/webm"
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": content_type
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(url, params=params, headers=headers, content=audio_content)
                resp.raise_for_status()
                result = resp.json()
                return result.get("transcription", "")
        except Exception as e:
            logger.error(f"[Smallest AI] Transcription failed: {e}")
            raise e

    async def text_to_speech(self, text: str, voice_id: str = None) -> bytes:
        """
        Generate audio from text using Smallest AI Lightning API.
        """
        if not self.api_key:
            logger.warning("[Smallest AI] API key not configured. Cannot generate TTS.")
            raise ValueError("Smallest AI API Key is not configured.")

        v_id = voice_id or self.default_voice_id
        url = "https://api.smallest.ai/waves/v1/tts"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "voice_id": v_id,
            "model": "lightning_v3.1_pro",
            "sample_rate": 24000,
            "output_format": "wav"
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code != 200:
                    logger.error(f"[Smallest AI] TTS status {resp.status_code}: {resp.text}")
                resp.raise_for_status()
                return resp.content
        except Exception as e:
            logger.error(f"[Smallest AI] TTS failed: {e}")
            raise e

elevenlabs_service = ElevenLabsService()
