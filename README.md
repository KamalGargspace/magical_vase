# 🌌 Elysian - The Magical Vase

**Elysian** is an interactive, cinematic 3D web experience built with React, Three.js, and React Three Fiber. It features a stunning translucent glass vase set against a moody, moonlit mountain lake, beautifully framed by magical glowing tree branches. The experience combines physics-based rendering, post-processing effects, procedural generation, and scroll-driven animations to create a highly immersive and premium aesthetic.

🌟 **[Experience the Live Demo Here](https://magical-vase.vercel.app/)** 🌟

## ✨ Features

- **Translucent Glass Physics**: A custom physically-based material (PBR) that simulates thick, dark purple glass with realistic light transmission, attenuation, and surface ridges.
- **Procedural Petal System**: Hundreds of cherry blossom petals swirl around the vase. Instead of relying on heavy 3D models, the petals are procedurally generated in code for maximum performance, using an instanced rendering system.
  - **Click to Scatter**: Clicking the screen triggers a physics burst, causing the petals to explode outward and upward chaotically based on mathematical phase functions.
- **Scroll-Driven Animation**: As the user scrolls, the vase dynamically twists, scales, and straightens while the petals converge inside the vase opening. HTML UI elements fade in and out seamlessly.
- **Cinematic & Magical Lighting**:
  - A highly-tuned cinematic light rig tailored specifically for glass translucency and background illumination.
  - The framing tree branches feature a custom emissive material (`#3a1b48`) giving them a magical inner glow to pop against the dark night sky.
  - Advanced post-processing stack including Bloom, Chromatic Aberration, and Vignetting to create a dreamy, glowing atmosphere.
- **Atmospheric Environment**: Features a procedural 3D mountain terrain generated using Fractional Brownian Motion (FBM) noise, a starry sky dome, floating moonbeams, dust particles, and a hyper-realistic reflecting water floor.

## 🚀 Extreme Performance Optimizations

To ensure the experience runs at a silky-smooth 60FPS while loading instantly:
- **Draco Compression Pipeline**: All large 3D models (`tree2.glb`, `vase.glb`) were aggressively compressed using `gltf-pipeline` and Draco compression, stripping file sizes down by over 80-90% without sacrificing visual quality.
- **Asset Trimming**: Removed over 130MB of unused static models (like `petal.glb` and large terrain meshes) by replacing them with procedural geometry and noise functions.
- **Instanced Meshes**: Utilizing `<instancedMesh>` allows us to render hundreds of independent physics-driven petals in a single draw call.

## 🛠️ Technology Stack

- **[React](https://reactjs.org/)** & **[Vite](https://vitejs.dev/)**: Fast, modern frontend development.
- **[Three.js](https://threejs.org/)**: The core 3D WebGL engine.
- **[React Three Fiber (@react-three/fiber)](https://docs.pmnd.rs/react-three-fiber)**: A React renderer for Three.js.
- **[React Three Drei (@react-three/drei)](https://github.com/pmndrs/drei)**: Useful helpers and abstractions for R3F (Environment, GLTF loaders, Reflector floors).
- **[Framer Motion & framer-motion-3d](https://www.framer.com/motion/)**: Smooth UI transitions and spring-physics 3D animations.
- **[Postprocessing](https://docs.pmnd.rs/react-postprocessing)**: Advanced image effects (Bloom, Vignette).

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KamalGargspace/magical_vase.git
   cd magical-vase
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser to view the project.

### Building for Production

To create an optimized production build:
```bash
npm run build
```
This will output static files into the `dist` directory, which can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

## 📂 Project Structure

- `src/App.jsx`: The main entry point, handling HTML UI overlays, scrolling logic, and the React Three Fiber `<Canvas>`.
- `src/scenes/MainScene.jsx`: Assembles the entire 3D world, camera, environment, and post-processing effects.
- `src/components/Vase.jsx`: The 3D vase component, including the custom translucent glass shader and scroll-based rotation.
- `src/components/PetalSystem.jsx`: The instanced mesh system for the cherry blossom petals, containing the math for their swirling and click-burst physics.
- `src/components/Background3D.jsx`: The procedural night sky, stars, mountains, dust, and framing tree branches.
- `src/components/Lights.jsx`: The cinematic lighting rig.

## 🎨 Design & Aesthetic

The visual design is aimed at a "dark luxury" and serene aesthetic. The deep purple tones, soft glowing highlights, magical tree silhouettes, and floating petals evoke a sense of magic and elite craftsmanship.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
