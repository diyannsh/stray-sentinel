# 🐾 Stray-Sentinel: AI-Audited ABC & Civic Verification Platform

[![Three.js](https://img.shields.io/badge/Three.js-Black?logo=three.js&style=flat-square)](#)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=flat-square)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=flat-square)](#)
[![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?logo=opencv&logoColor=white&style=flat-square)](#)

> **Stray-Sentinel** is a closed-loop civic verification platform that turns municipal stray animal management into a transparent, audit-backed pipeline using WebGL data visualization and AI biometric verification.

---

## 🚨 The Civic Problem

Municipal corporations spend substantial budgets outsourcing Animal Birth Control (ABC) and anti-rabies vaccinations to third-party contractors. This system suffers from severe accountability gaps:

1. **Contractor Fraud:** Double-billing for the same animal or falsified ear-notches.
2. **Displacement Violations:** Dogs relocated away from original territories, violating ABC laws and increasing territorial aggression.
3. **Data Blackholes:** Zero actionable data on rabies vaccination coverage per municipal ward.

---

## 💡 The Solution Architecture

Our platform eliminates these gaps by enforcing accountability at every step of the pipeline.

### Core Features

- **🌐 3D Bite-Risk Heatmap (WebGL/Three.js):** An interactive, spatial dashboard mapping bite complaints against sterilization percentages ward-by-ward, pinpointing exactly where municipal vans need dispatching.
- **📍 Proof-of-Release Geo-Auditing:** Calculates the Haversine distance between capture and release coordinates. If a contractor drops an animal outside an acceptable radius, the system flags a **Displacement Violation** and blocks invoice clearance.
- **📷 Biometric & Feature Re-Identification:** Computer vision models verify the standard V-shape ear-notch confirming sterilization, eliminating human-error and fraud in reporting.
- **📱 Citizen Verification Portal:** A smooth, GSAP/Lenis-powered portal where citizens can upload photos of neighborhood strays to instantly check their sterilization/vaccination status, reducing civic panic.

---

## 🛠️ Tech Stack

- **Frontend Environment:** Vite, HTML5, CSS3, Vanilla JavaScript
- **3D / Graphics:** Three.js, WebGL
- **UI / Animations:** GSAP, Lenis (Smooth Scrolling)
- **Backend API:** Node.js, Express.js
- **Computer Vision (Microservice):** Python, OpenCV, MediaPipe (Ear-notch & biometric processing)

---

## 🚀 Getting Started (Local Development)

This project uses a monorepo structure separating the Vite frontend and Node.js backend.

### Prerequisites

- Node.js (v18+)
- Python 3.x (for the computer vision microservice)

### Installation Steps

**1. Clone the repository**

```bash
git clone [https://github.com/diyannsh/stray-sentinel.git](https://github.com/diyannsh/stray-sentinel.git)
cd stray-sentinel


```
