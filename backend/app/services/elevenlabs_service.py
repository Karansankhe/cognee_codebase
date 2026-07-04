import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class ElevenLabsService:
    def __init__(self):
        self.api_key = settings.elevenlabs_api_key
        # Default voice Rachel
        self.default_voice_id = "21m00Tcm4TlvDq8ikWAM"

    async def transcribe_audio(self, audio_content: bytes, filename: str) -> str:
        """
        Transcribe audio content using ElevenLabs Scribe Scribe v2 API.
        """
        if not self.api_key:
            logger.warning("[ElevenLabs] API key not configured. Using mock fallback transcription.")
            return "This is a mock transcription because your ElevenLabs API Key is not set in the .env file."

        url = "https://api.elevenlabs.io/v1/speech-to-text"
        headers = {
            "xi-api-key": self.api_key
        }
        # Scribe expects model_id and file
        files = {
            "file": (filename, audio_content, "audio/webm")
        }
        data = {
            "model_id": "scribe_v2"
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(url, headers=headers, files=files, data=data)
                resp.raise_for_status()
                result = resp.json()
                return result.get("text", "")
        except Exception as e:
            logger.error(f"[ElevenLabs] Transcription failed: {e}")
            raise e

    async def text_to_speech(self, text: str, voice_id: str = None) -> bytes:
        """
        Generate audio from text using ElevenLabs Text to Speech API.
        Uses the multilingual v2 model for high-quality multilingual languages.
        """
        if not self.api_key:
            logger.warning("[ElevenLabs] API key not configured. Cannot generate TTS.")
            raise ValueError("ElevenLabs API Key is not configured.")

        v_id = voice_id or self.default_voice_id
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{v_id}"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                return resp.content
        except Exception as e:
            logger.error(f"[ElevenLabs] TTS failed: {e}")
            raise e

elevenlabs_service = ElevenLabsService()
