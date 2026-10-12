from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import cv2
import numpy as np
import urllib.request
import uuid
from pinecone import Pinecone
import os
from dotenv import load_dotenv

# Load hidden variables
load_dotenv()
# Initialize Pinecone Memory safely
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("stray-sentinel")

app = FastAPI()


class ImageRequest(BaseModel):
    image_url: str


@app.post("/verify-dog")
async def verify_dog(req: ImageRequest):
    try:
        # 2. Download Image from Cloudinary
        resp = urllib.request.urlopen(req.image_url)
        image = np.asarray(bytearray(resp.read()), dtype="uint8")
        img = cv2.imdecode(image, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Could not decode image from URL.")

        # 3. OpenCV Processing (Extract 512 dimensions)
        img_resized = cv2.resize(img, (224, 224))
        gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
        center_crop = gray[80:144, 80:144]
        flat_vector = center_crop.flatten()[:512].astype(float)

        norm = np.linalg.norm(flat_vector)
        if norm == 0:
            norm = 1
        normalized_vector = (flat_vector / norm).tolist()

        # 4. Ask Pinecone if it recognizes the dog (95% similarity threshold)
        query_response = index.query(
            vector=normalized_vector,
            top_k=1,
            include_values=False
        )

        # 5. Return existing ID if matched
        if query_response.matches and query_response.matches[0].score > 0.95:
            return {
                "status": "MATCH_FOUND",
                "biometric_id": query_response.matches[0].id,
                "confidence_score": query_response.matches[0].score
            }

        # 6. Or register a new ID if it's a new dog
        else:
            new_id = f"STRAY-{str(uuid.uuid4())[:8].upper()}"
            index.upsert(
                vectors=[{"id": new_id, "values": normalized_vector}]
            )
            return {
                "status": "NEW_SUBJECT_REGISTERED",
                "biometric_id": new_id,
                "confidence_score": 1.0
            }

    except Exception as e:
        print(f"AI Pipeline Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
