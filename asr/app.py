"""Private experimental Arabic ASR adapter for Shams Alkhair.
General Whisper is NOT a validated Quran/tajweed grading model.
Deploy behind private network and require a long token. Never log audio/text.
"""
import hmac
import io
import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from faster_whisper import WhisperModel

TOKEN = os.getenv("RECITATION_ASR_TOKEN", "")
if len(TOKEN) < 32:
    raise RuntimeError("Set RECITATION_ASR_TOKEN to 32+ random characters")

model = WhisperModel(
    os.getenv("ASR_MODEL", "small"),
    device=os.getenv("ASR_DEVICE", "cpu"),
    compute_type=os.getenv("ASR_COMPUTE_TYPE", "int8"),
)
app = FastAPI(title="Private Quran Recitation ASR", docs_url=None, redoc_url=None)

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), authorization: str | None = Header(None)):
    incoming = (authorization or "").removeprefix("Bearer ")
    if not hmac.compare_digest(incoming, TOKEN):
        raise HTTPException(401, "Unauthorized")
    if audio.content_type not in {"audio/webm", "audio/ogg", "audio/mp4", "audio/wav", "audio/mpeg"}:
        raise HTTPException(415, "Unsupported audio")
    content = await audio.read(12 * 1024 * 1024 + 1)
    if not content or len(content) > 12 * 1024 * 1024:
        raise HTTPException(413, "Audio size exceeds 12 MB")
    try:
        # Do not supply the expected verse as an initial prompt: this would bias recognition.
        segments, info = model.transcribe(io.BytesIO(content), language="ar", beam_size=5,
                                          vad_filter=True, condition_on_previous_text=False)
        if info.duration and info.duration > 180:
            raise HTTPException(413, "Recordings must not exceed 3 minutes")
        text = " ".join(s.text.strip() for s in segments).strip()
        return {"text": text[:15000], "model": f"faster-whisper-{os.getenv('ASR_MODEL','small')}"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(422, "Unable to decode or transcribe audio")
