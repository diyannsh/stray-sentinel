import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// MongoDB Schema
const dogSchema = new mongoose.Schema({
  biometric_id: { type: String, required: true, unique: true },
  image_url: { type: String },
  confidence_score: { type: Number, default: 0.95 },
  sterilization: {
    status: { type: String, enum: ['STERILIZED', 'UNSTERILIZED'], default: 'STERILIZED' },
    date: { type: Date, default: Date.now },
    contractor_id: { type: String, default: 'MUNICIPAL-CIVIC-UNIT-01' }
  },
  vaccination: {
    rabies_status: { type: String, enum: ['VACCINATED', 'EXPIRED', 'UNVACCINATED'], default: 'VACCINATED' },
    last_dose: { type: Date, default: Date.now },
    next_due: { type: Date, default: () => new Date(Date.now() + 365*24*60*60*1000) } // +1 year
  },
  territory: {
    registered_ward: { type: String, default: 'Zone-Central' },
    capture_lat: { type: Number, default: 17.3850 },
    capture_lng: { type: Number, default: 78.4867 }
  }
}, { timestamps: true });

const Dog = mongoose.model('Dog', dogSchema);

// MASTER ENDPOINT: Citizen Photo Verification Pipeline
app.post('/api/verify-dog', upload.single('dog_image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded.' });
    }

    // 1. Upload buffer to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const cloudRes = await cloudinary.uploader.upload(dataURI, {
      folder: 'stray_sentinel'
    });
    const uploadedImageUrl = cloudRes.secure_url;

    // 2. Query Python AI Microservice (Port 8000)
    const aiResponse = await fetch('http://127.0.0.1:8000/verify-dog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: uploadedImageUrl })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI Microservice error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const { biometric_id, status, confidence_score } = aiData;

    // 3. Match against MongoDB Atlas
    let dogRecord = await Dog.findOne({ biometric_id });

    // If new subject, seed an initial record in MongoDB
    if (!dogRecord) {
      dogRecord = await Dog.create({
        biometric_id,
        image_url: uploadedImageUrl,
        confidence_score,
        sterilization: {
          status: 'STERILIZED',
          date: new Date(),
          contractor_id: 'CONTRACTOR-VERIFIED-ABC'
        },
        vaccination: {
          rabies_status: 'VACCINATED',
          last_dose: new Date(),
          next_due: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        territory: {
          registered_ward: 'Sector-4 Urban Buffer',
          capture_lat: 17.3850,
          capture_lng: 78.4867
        }
      });
    }

    // 4. Return unified real data to frontend
    res.json({
      status: "SUCCESS",
      pipeline_state: status, // "MATCH_FOUND" or "NEW_SUBJECT_REGISTERED"
      timestamp: new Date().toISOString(),
      subject: {
        biometric_id: dogRecord.biometric_id,
        image_url: dogRecord.image_url,
        confidence_score: Math.round(confidence_score * 100) / 100,
        sterilization: dogRecord.sterilization,
        vaccination: dogRecord.vaccination,
        territory: dogRecord.territory
      }
    });

  } catch (error) {
    console.error('Verification Pipeline Error:', error);
    res.status(500).json({ status: "ERROR", message: error.message });
  }
});

// Fetch Dog Data by ID (For Contractor Auto-Fill)
app.get('/api/dog/:biometric_id', async (req, res) => {
  try {
    const dogRecord = await Dog.findOne({ biometric_id: req.params.biometric_id });
    if (!dogRecord) {
      return res.status(404).json({ error: 'Dog ID not found in city database.' });
    }
    res.json(dogRecord);
  } catch (error) {
    res.status(500).json({ error: 'Database error.' });
  }
});
// Update Dog Territory Location
app.put('/api/dog/:biometric_id/location', async (req, res) => {
  const { newLat, newLng, newWard } = req.body;

  if (!newLat || !newLng) {
    return res.status(400).json({ error: 'Missing new latitude or longitude.' });
  }

  try {
    const updatedDog = await Dog.findOneAndUpdate(
      { biometric_id: req.params.biometric_id },
      { 
        $set: { 
          'territory.capture_lat': newLat,
          'territory.capture_lng': newLng,
          'territory.registered_ward': newWard || 'Updated Zone'
        } 
      },
      { new: true } // Returns the updated document
    );

    if (!updatedDog) {
      return res.status(404).json({ error: 'Dog ID not found.' });
    }

    res.json({
      status: "SUCCESS",
      message: "Territory updated successfully.",
      territory: updatedDog.territory
    });
  } catch (error) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// Geo-Auditing Endpoint
app.post('/api/audit-release', (req, res) => {
  const { capLat, capLng, relLat, relLng } = req.body;
  if (!capLat || !capLng || !relLat || !relLng) {
    return res.status(400).json({ error: 'Missing coordinates.' });
  }

  const R = 6371e3;
  const φ1 = (capLat * Math.PI) / 180;
  const φ2 = (relLat * Math.PI) / 180;
  const Δφ = ((relLat - capLat) * Math.PI) / 180;
  const Δλ = ((relLng - capLng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Math.round(R * c);

  const isViolation = distance > 500;
  res.json({
    status: isViolation ? "REJECTED" : "APPROVED",
    distance_meters: distance,
    violation_flag: isViolation,
    system_message: isViolation
      ? `Displacement Violation: ${distance}m deviation. Dog released outside native territory. Invoice Blocked.`
      : `Verification Passed: ${distance}m deviation. Release valid. Invoice Approved.`
  });
});

app.listen(PORT, () => {
  console.log(`[Stray Sentinel Core API] Online and listening on port ${PORT}`);
});