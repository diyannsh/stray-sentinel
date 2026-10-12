import * as THREE from 'three';

// 1. Custom Interactive Pointer
const cursorOuter = document.querySelector('.custom-cursor');
const cursorInner = document.querySelector('.custom-cursor-dot');
let mouseX = 0, mouseY = 0, targetOuterX = 0, targetOuterY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursorInner.style.left = `${mouseX}px`;
  cursorInner.style.top = `${mouseY}px`;
});

function animateCursor() {
  targetOuterX += (mouseX - targetOuterX) * 0.15;
  targetOuterY += (mouseY - targetOuterY) * 0.15;
  cursorOuter.style.left = `${targetOuterX}px`;
  cursorOuter.style.top = `${targetOuterY}px`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('[data-hover]').forEach((el) => {
  el.addEventListener('mouseenter', () => cursorOuter.classList.add('active'));
  el.addEventListener('mouseleave', () => cursorOuter.classList.remove('active'));
});

// 2. Subdued WebGL Background
const canvas = document.querySelector('#dashboard-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 12;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Data wireframe grid
const gridGeom = new THREE.BufferGeometry();
const points = [];
for (let i = -10; i <= 10; i += 2) {
  points.push(new THREE.Vector3(-10, i, 0)); points.push(new THREE.Vector3(10, i, 0));
  points.push(new THREE.Vector3(i, -10, 0)); points.push(new THREE.Vector3(i, 10, 0));
}
gridGeom.setFromPoints(points);
const gridMat = new THREE.LineBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.05 });
const grid = new THREE.LineSegments(gridGeom, gridMat);
scene.add(grid);

function animate() {
  grid.position.z = Math.sin(Date.now() * 0.001) * 0.5; // Gentle breathing effect
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 3. Geolocation & Audit Logic
// 3. Geolocation & Audit Logic
document.addEventListener('DOMContentLoaded', () => {
  // --- NEW: AI IMAGE SCANNER ---
  const scanBtn = document.getElementById('scan-photo-btn');
  const imageInput = document.getElementById('dog-image-input');
  const detectedIdInput = document.getElementById('detected-id');
  const capLatInput = document.getElementById('cap-lat');
  const capLngInput = document.getElementById('cap-lng');

  // Open file picker / camera
  scanBtn.addEventListener('click', () => {
    imageInput.click();
  });

  // Run AI Pipeline when photo is selected
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    scanBtn.textContent = "SCANNING FACE...";
    detectedIdInput.value = "Extracting 512-D vector...";

    const formData = new FormData();
    formData.append('dog_image', file);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE}/api/verify-dog`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error("AI Verification failed.");

      const data = await response.json();
      const subject = data.subject;

      // Auto-fill the UI with the AI's results
      detectedIdInput.value = subject.biometric_id;
      capLatInput.value = subject.territory.capture_lat;
      capLngInput.value = subject.territory.capture_lng;

      scanBtn.textContent = "[ ✓ ] MATCH FOUND";
      scanBtn.style.color = "var(--neon-green)";

      setTimeout(() => {
        scanBtn.textContent = "[O] TAKE OR UPLOAD PHOTO";
        scanBtn.style.color = "var(--text-primary)";
      }, 3000);

    } catch (err) {
      alert(`Scan Error: Ensure servers are running. Details: ${err.message}`);
      scanBtn.textContent = "[O] TAKE OR UPLOAD PHOTO";
      detectedIdInput.value = "";
    }
  });

  // --- EXISTING: GPS AND AUDIT VERIFICATION ---
  const gpsBtn = document.getElementById('gps-btn');
  const auditBtn = document.getElementById('audit-btn');
  const resultBox = document.getElementById('audit-result');
  const relLatInput = document.getElementById('rel-lat');
  const relLngInput = document.getElementById('rel-lng');

  // Trigger browser's native GPS API
  gpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    gpsBtn.textContent = "[ ACQUIRING SATELLITE LOCK... ]";
    gpsBtn.style.color = "#fff";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        relLatInput.value = position.coords.latitude.toFixed(6);
        relLngInput.value = position.coords.longitude.toFixed(6);
        
        gpsBtn.textContent = "[ ✓ SATELLITE LOCK ESTABLISHED ]";
        gpsBtn.style.color = "var(--neon-green)";
        
        setTimeout(() => {
          gpsBtn.textContent = "[ 📡 GET MY CURRENT LOCATION ]";
          gpsBtn.style.color = "var(--text-dim)";
        }, 3000);
      },
      (error) => {
        alert(`Location Error: ${error.message}. Please ensure location permissions are granted.`);
        gpsBtn.textContent = "[ 📡 GET MY CURRENT LOCATION ]";
      },
      { enableHighAccuracy: true }
    );
  });

  // Execute full-stack Audit Request
  auditBtn.addEventListener('click', async () => {
    const payload = {
      capLat: parseFloat(capLatInput.value),
      capLng: parseFloat(capLngInput.value),
      relLat: parseFloat(relLatInput.value),
      relLng: parseFloat(relLngInput.value),
    };

    if (isNaN(payload.capLat) || isNaN(payload.relLat)) {
      alert("Please ensure all coordinates are filled or acquired via GPS.");
      return;
    }

    auditBtn.querySelector('.btn-text').textContent = "CHECKING DISTANCE...";

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE}/api/audit-release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      resultBox.style.display = 'block';
      if (data.status === "APPROVED") {
        resultBox.className = 'audit-result-panel approved';
        resultBox.innerHTML = `✓ ${data.system_message}`;
      } else {
        resultBox.className = 'audit-result-panel rejected';
        resultBox.innerHTML = `⚠ ${data.system_message}`;
      }
    } catch (err) {
      alert(`Network Error: Ensure your Node.js API is running. Detail: ${err.message}`);
    } finally {
      auditBtn.querySelector('.btn-text').textContent = "VERIFY DROP-OFF DISTANCE";
    }
  });
});