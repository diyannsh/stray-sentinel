import * as THREE from 'three';

// 1. Custom Interactive Pointer
const cursorOuter = document.querySelector('.custom-cursor');
const cursorInner = document.querySelector('.custom-cursor-dot');
let mouseX = 0, mouseY = 0;
let targetOuterX = 0, targetOuterY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
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

function bindHoverTargets() {
  document.querySelectorAll('[data-hover]').forEach((el) => {
    el.addEventListener('mouseenter', () => cursorOuter.classList.add('active'));
    el.addEventListener('mouseleave', () => cursorOuter.classList.remove('active'));
  });
}
bindHoverTargets();

// 2. Three.js Background Scanner Matrix
const canvas = document.querySelector('#citizen-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Concentric scanning rings
const ringGroup = new THREE.Group();
const ringCount = 5;
for (let i = 1; i <= ringCount; i++) {
  const geom = new THREE.RingGeometry(i * 1.5, i * 1.5 + 0.02, 64);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00ffaa,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.12 / i
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = Math.PI / 2.8;
  ringGroup.add(mesh);
}
scene.add(ringGroup);

// Ambient particle cloud
const pGeom = new THREE.BufferGeometry();
const pCount = 800;
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount * 3; i++) {
  pPos[i] = (Math.random() - 0.5) * 25;
}
pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({
  size: 0.03,
  color: 0x00ffaa,
  transparent: true,
  opacity: 0.4
});
const particles = new THREE.Points(pGeom, pMat);
scene.add(particles);

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  ringGroup.rotation.z = t * 0.05;
  particles.rotation.y = t * 0.02;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 3. UI State Transitions & Pipeline Execution
document.addEventListener('DOMContentLoaded', () => {
  const uploadPanel = document.getElementById('upload-panel');
  const fileInput = document.getElementById('file-input');
  const scanPanel = document.getElementById('scan-panel');
  const resultPanel = document.getElementById('result-panel');
  const previewImg = document.getElementById('preview-img');

  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const step3 = document.getElementById('step-3');

  const resultBadge = document.getElementById('result-badge');
  const resultId = document.getElementById('result-id');
  const valSterilization = document.getElementById('val-sterilization');
  const valContractor = document.getElementById('val-contractor');
  const valRabies = document.getElementById('val-rabies');
  const valNextDue = document.getElementById('val-next-due');
  const valWard = document.getElementById('val-ward');
  const valConfidence = document.getElementById('val-confidence');

  const toggleRaw = document.getElementById('toggle-raw');
  const rawJson = document.getElementById('raw-json');
  const resetBtn = document.getElementById('reset-portal-btn');

  uploadPanel.addEventListener('click', () => fileInput.click());

  uploadPanel.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadPanel.style.borderColor = 'var(--neon-green)';
  });
  uploadPanel.addEventListener('dragleave', () => {
    uploadPanel.style.borderColor = 'var(--border-neon)';
  });
  uploadPanel.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadPanel.style.borderColor = 'var(--border-neon)';
    if (e.dataTransfer.files.length) {
      handleImage(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleImage(e.target.files[0]);
    }
  });

  async function handleImage(file) {
    // Show image preview in scanning view
    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);

    uploadPanel.style.display = 'none';
    scanPanel.style.display = 'block';

    // Step 1 active
    step1.classList.add('active');
    step2.classList.remove('active');
    step3.classList.remove('active');

    const formData = new FormData();
    formData.append('dog_image', file);

    const stepTimer1 = setTimeout(() => step2.classList.add('active'), 1200);
    const stepTimer2 = setTimeout(() => step3.classList.add('active'), 2400);

    try {
      const response = await fetch('http://localhost:5000/api/verify-dog', {
        method: 'POST',
        body: formData
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();
      renderResults(resData);
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      alert(`Pipeline error: ${err.message}. Check that the Node (port 5000) and Python (port 8000) servers are running.`);
      scanPanel.style.display = 'none';
      uploadPanel.style.display = 'block';
    }
  }

  function renderResults(data) {
    scanPanel.style.display = 'none';
    resultPanel.style.display = 'block';

    const sub = data.subject;
    resultId.textContent = sub.biometric_id;

    if (data.pipeline_state === 'MATCH_FOUND') {
      resultBadge.className = 'status-pill verified';
      resultBadge.textContent = 'STATUS: MATCH FOUND';
    } else {
      resultBadge.className = 'status-pill unverified';
      resultBadge.textContent = 'STATUS: NEW SUBJECT REGISTERED';
    }

    valSterilization.textContent = sub.sterilization?.status || 'UNKNOWN';
    valContractor.textContent = `CONT_ID: ${sub.sterilization?.contractor_id || 'MUNICIPAL-ABC'}`;

    valRabies.textContent = sub.vaccination?.rabies_status === 'VACCINATED' ? 'CURRENT / PROTECTED' : 'EXPIRED';
    if (sub.vaccination?.next_due) {
      valNextDue.textContent = `NEXT DUE: ${new Date(sub.vaccination.next_due).toLocaleDateString()}`;
    }

    valWard.textContent = sub.territory?.registered_ward || 'ZONE-CENTRAL';
    valConfidence.textContent = `CONFIDENCE: ${(sub.confidence_score * 100).toFixed(1)}%`;

    rawJson.textContent = JSON.stringify(data, null, 2);
    bindHoverTargets();
  }

  toggleRaw.addEventListener('click', () => {
    const isHidden = rawJson.style.display === 'none';
    rawJson.style.display = isHidden ? 'block' : 'none';
    toggleRaw.textContent = isHidden ? '[-] HIDE SYSTEM DATA' : '[+] VIEW SYSTEM DATA';
  });

  resetBtn.addEventListener('click', () => {
    resultPanel.style.display = 'none';
    uploadPanel.style.display = 'block';
    fileInput.value = '';
    rawJson.style.display = 'none';
  });
});