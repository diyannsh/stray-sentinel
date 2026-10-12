import * as THREE from 'three';
import { gsap } from 'gsap';
import Lenis from '@studio-freight/lenis';

// 1. High-Performance Inertial Smooth Scroll (Lenis)
const lenis = new Lenis({
  duration: 1.3,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

function scrollProgress(time) {
  lenis.raf(time);
  requestAnimationFrame(scrollProgress);
}
requestAnimationFrame(scrollProgress);

// 2. Custom Interactive Pointer Setup & HUD Coord Stream
const cursorOuter = document.querySelector('.custom-cursor');
const cursorInner = document.querySelector('.custom-cursor-dot');
const interactiveElements = document.querySelectorAll('[data-hover-type="interactive"]');

let mouseX = 0, mouseY = 0;
let targetOuterX = 0, targetOuterY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  // Render Inner dot with lock step accuracy
  cursorInner.style.left = `${mouseX}px`;
  cursorInner.style.top = `${mouseY}px`;

  // Provide interactive geographic coordinate stream updates
  const coordLat = 17.3850 + (mouseY * 0.00005);
  const coordLng = 78.4867 + (mouseX * 0.00005);
  document.getElementById('hud-lat').innerText = `${coordLat.toFixed(5)}° N`;
  document.getElementById('hud-lng').innerText = `${coordLng.toFixed(5)}° E`;
});

// Interactive state mapping
interactiveElements.forEach(el => {
  el.addEventListener('mouseenter', () => cursorOuter.classList.add('active'));
  el.addEventListener('mouseleave', () => cursorOuter.classList.remove('active'));
});

// Animate trailing pointer delay
function animateCursor() {
  targetOuterX += (mouseX - targetOuterX) * 0.12;
  targetOuterY += (mouseY - targetOuterY) * 0.12;
  
  cursorOuter.style.left = `${targetOuterX}px`;
  cursorOuter.style.top = `${targetOuterY}px`;
  
  requestAnimationFrame(animateCursor);
}
animateCursor();

// 3. WebGL Workspace Construction
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 16);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 4. Transform globe into a fluid cyber-particle ecosystem
const particleCount = 14000;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const originalPositions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const customGreen = new THREE.Color('#00ffaa');
const customRed = new THREE.Color('#ff2a2a');

// Plotting exact spherical geometries for particles
for (let i = 0; i < particleCount * 3; i += 3) {
  const phi = Math.acos((Math.random() * 2) - 1);
  const theta = Math.random() * Math.PI * 2;
  const radius = 6.5 + (Math.random() * 0.1); // Fine structural radius shell
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  positions[i] = x;
  positions[i + 1] = y;
  positions[i + 2] = z;

  // Keep an immutable reference copy of the raw points to use for calculations
  originalPositions[i] = x;
  originalPositions[i + 1] = y;
  originalPositions[i + 2] = z;

  // Map Audit status highlights
  if (Math.random() > 0.94) {
    colors[i] = customRed.r;
    colors[i + 1] = customRed.g;
    colors[i + 2] = customRed.b;
  } else {
    colors[i] = customGreen.r;
    colors[i + 1] = customGreen.g;
    colors[i + 2] = customGreen.b;
  }
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particleMaterial = new THREE.PointsMaterial({
  size: 0.035,
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
});

const particleSphere = new THREE.Points(particleGeometry, particleMaterial);
particleSphere.position.set(4, 0, 0); // Side screen offset for premium UI
scene.add(particleSphere);

// Dynamic 3D cyber grid plane under world
const gridHelper = new THREE.GridHelper(40, 40, 0x00ffaa, 0x111115);
gridHelper.position.y = -7;
gridHelper.rotation.x = 0.2;
scene.add(gridHelper);

// 5. Responsive Scroll Map Camera Track Animation
let scrollPercentage = 0;

lenis.on('scroll', (e) => {
  scrollPercentage = e.scroll / (document.body.scrollHeight - window.innerHeight);
  
  // High-fidelity smooth camera movement based on scroll progress
  gsap.to(camera.position, {
    x: scrollPercentage * -3,
    y: scrollPercentage * -2,
    z: 16 - (scrollPercentage * 6),
    duration: 0.5,
    overwrite: 'auto'
  });

  gsap.to(particleSphere.rotation, {
    x: scrollPercentage * 2.5,
    duration: 0.8,
    overwrite: 'auto'
  });
});

// 6. Natural Fluid Wave Animations
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();
  
  // Constant orbital rotate
  particleSphere.rotation.y = elapsedTime * 0.055;

  const positionsAttr = particleGeometry.attributes.position;
  const count = positionsAttr.count;

  // Update particles with natural undulating movement
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const x = originalPositions[idx];
    const y = originalPositions[idx + 1];
    const z = originalPositions[idx + 2];

    // Mathematical wave offsets
    const wave = Math.sin(elapsedTime * 1.5 + (x * 0.5) + (y * 0.5)) * 0.045;

    positionsAttr.array[idx] = x + (x / 6.5) * wave;
    positionsAttr.array[idx + 1] = y + (y / 6.5) * wave;
    positionsAttr.array[idx + 2] = z + (z / 6.5) * wave;
  }
  positionsAttr.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// 7. Interactive Interface Countups & Entrance Sequence
gsap.from('.visual-title', { opacity: 0, y: 50, skewY: 4, duration: 1.5, ease: 'power4.out', delay: 0.3 });
gsap.from('.visual-description', { opacity: 0, y: 20, duration: 1.2, ease: 'power3.out', delay: 0.6 });
gsap.from('.cyber-btn-group', { opacity: 0, y: 15, duration: 1, ease: 'power3.out', delay: 0.8 });
gsap.from('.hud-data-board', { opacity: 0, duration: 1.5, delay: 1.1 });

// Simulative Dynamic Auditor Counter Progress
gsap.to("#counter-fraud", {
  innerHTML: "100%",
  duration: 3,
  delay: 1.2,
  snap: { innerHTML: 1 },
  ease: "power2.out"
});

// 8. Viewport Sizing Handlers
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});