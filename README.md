# Stray Sentinel

Stray Sentinel is a full-stack civic technology platform for tracking and verifying stray dogs using AI-powered biometric matching and geospatial auditing. The system helps prevent fraudulent or unsafe relocation of dogs by matching a new photo to a known city record and checking whether a release point is within the original territory boundary.

## Overview

The project combines:

- A modern Vite frontend for citizen and contractor workflows
- An Express API for secure data handling and auditing
- A Python FastAPI AI microservice for dog identity verification
- MongoDB Atlas for persistent dog records
- Cloudinary for image storage
- Pinecone for vector-based biometric matching

The experience is split into two portals:

- Citizen Portal: upload or take a photo of a stray dog to verify its record
- Contractor Dashboard: scan a dog, confirm original capture coordinates, and audit drop-off distance before release

## Problem It Solves

The platform is designed around a real civic issue: stray dogs may be relocated or released without proper verification, which can cause safety, record-keeping, and compliance problems. Stray Sentinel makes this process transparent by tying each dog to:

- a biometric identity
- a city database record
- a verified location history
- a distance-based release audit

## How It Works

1. A citizen uploads a dog image from the browser.
2. The Node.js API uploads the image to Cloudinary.
3. The Python AI service downloads that image, preprocesses it, extracts a 512-dimension feature vector, and queries Pinecone for a match.
4. If a match is found, the dog is linked to its existing biometric ID.
5. If not, a new biometric ID is generated and stored in Pinecone.
6. The API checks MongoDB Atlas for the associated record and returns a structured verification response.
7. A contractor can use the dog ID, original capture coordinates, and current GPS coordinates to verify whether the release point is more than 500 meters away from the original territory.

## Tech Stack

- Frontend: Vite, Vanilla JS, HTML, CSS, Three.js
- Backend API: Node.js + Express
- AI service: Python + FastAPI + OpenCV + NumPy
- Vector matching: Pinecone
- Database: MongoDB Atlas
- Media storage: Cloudinary
- Geolocation: Browser GPS API

## Project Structure

```text
stray-sentinel/
├── ai_service/
│   └── main.py                 # FastAPI microservice for biometric verification
├── src/
│   ├── citizen.js              # Citizen portal logic
│   ├── contractor.js          # Contractor dashboard logic
│   ├── main.js                # Landing page animation and WebGL effects
│   └── style.css             # Application styling
├── citizen.html               # Citizen portal UI
├── contractor.html            # Contractor dashboard UI
├── index.html                 # Landing page UI
├── server.js                  # Express API and MongoDB integration
├── vite.config.js             # Vite configuration
├── package.json               # Node scripts and dependencies
├── .gitignore                 # Git ignore rules
├── .env                       # Local environment variables (not committed)
└── README.md                  # Project documentation
```

## Features

### Citizen verification flow

- Upload a photo of a stray dog
- Securely send image to the backend
- Match against prior dog biometric signatures
- View sterilization, vaccination, and territory data
- See confidence score and system result payload

### Contractor audit workflow

- Upload or take a dog photo
- Auto-fill original capture coordinates from the matched dog record
- Capture current GPS coordinates via browser geolocation
- Compare release point against original territory
- Trigger approval or violation response based on a 500 meter threshold

### Security and data flow

- Cloudinary stores uploaded images
- MongoDB stores structured dog records
- Pinecone stores vector embeddings for biometric lookup
- A single API layer coordinates all verification and audit actions

## Environment Variables

Create the required environment files before starting the app.

### Root project `.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### AI service `ai_service/.env`

```env
PINECONE_API_KEY=your_pinecone_api_key
```

## Local Setup

### 1. Install frontend/backend dependencies

```bash
npm install
```

### 2. Install Python dependencies

From the project root, create and activate a virtual environment and install the AI service requirements.

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install fastapi uvicorn opencv-python numpy python-dotenv pinecone
```

### 3. Start the Python AI microservice

```bash
cd ai_service
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Start the Node.js API

In a separate terminal:

```bash
npm run start:api
```

This starts the Express server on port 5000.

### 5. Start the frontend

In another terminal:

```bash
npm run dev
```

Then open the Vite app in the browser. The landing page is available at the default local Vite URL, usually:

```text
http://localhost:5173/
```

## API Endpoints

### Node API

#### POST `/api/verify-dog`

Uploads a dog image and runs the verification pipeline.

#### GET `/api/dog/:biometric_id`

Fetches the record for a known dog ID.

#### PUT `/api/dog/:biometric_id/location`

Updates a dog's capture or territory coordinates.

#### POST `/api/audit-release`

Calculates the distance between original capture coordinates and release coordinates and decides whether the release is valid.

### AI Service

#### POST `/verify-dog`

Accepts an image URL, extracts a dog feature vector, and queries Pinecone for a match.

## Usage Flow

### Citizen flow

1. Open the citizen portal.
2. Upload a dog photo.
3. Wait for the AI verification pipeline to finish.
4. View sterilization, vaccination, ward, and confidence data.

### Contractor flow

1. Open the contractor dashboard.
2. Upload or take a photo of the dog.
3. Confirm the dog ID and original capture coordinates.
4. Enter current drop-off coordinates or use GPS.
5. Run the audit check.
6. Review whether the release is approved or rejected.

## Notes

- The project is a demo/PoC-style civic platform and is intended for local development and experimentation.
- The AI microservice depends on valid Pinecone credentials and a working image input.
- The full pipeline requires both the Python service and the Node API to be running together.
- For deployment, you would typically add production-level auth, rate limiting, monitoring, and environment isolation.

## Suggested Improvements

- Add user authentication for citizen and contractor roles
- Add a dedicated dashboard for city administrators
- Add historical release logs and audit trails
- Improve the AI pipeline with real dog feature extraction models
- Add GIS map-based visualization using geographic data layers
- Add automated tests for API and verification logic

## License

This project does not currently declare a formal license. Please treat it as a codebase for demonstration, internal development, or research use unless a project-specific license is added later.
