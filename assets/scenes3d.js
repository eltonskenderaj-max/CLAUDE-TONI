/**
 * AHRPA – Scènes 3D WebGL (Three.js)
 * Illustrations premium pour le site AHRPA
 * CDN: https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

/* ─────────────────────────────────────────────
   1. HERO : Bâtiment hôtel 3D avec lumières
───────────────────────────────────────────── */
export function initHotelScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const W = canvas.clientWidth, H = canvas.clientHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(6, 4, 8);
  camera.lookAt(0, 2, 0);

  // Lumières
  const ambient = new THREE.AmbientLight(0x0a1628, 1.5);
  scene.add(ambient);

  const gold = new THREE.DirectionalLight(0xc9a84c, 2);
  gold.position.set(5, 8, 5);
  gold.castShadow = true;
  scene.add(gold);

  const fill = new THREE.PointLight(0x1a3a6a, 1.5, 20);
  fill.position.set(-5, 3, -2);
  scene.add(fill);

  // Matériaux
  const navyMat = new THREE.MeshStandardMaterial({
    color: 0x0f2040,
    metalness: 0.3,
    roughness: 0.7
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc9a84c,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xc9a84c,
    emissiveIntensity: 0.2
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xc9a84c,
    emissive: 0xc9a84c,
    emissiveIntensity: 0.6,
    metalness: 0,
    roughness: 0.5
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x060c18,
    metalness: 0.2,
    roughness: 0.8
  });

  const hotel = new THREE.Group();

  // Corps principal
  const body = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 2), navyMat);
  body.position.y = 2.5;
  body.castShadow = true;
  body.receiveShadow = true;
  hotel.add(body);

  // Toit
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 2.2), goldMat);
  roof.position.y = 5.1;
  hotel.add(roof);

  // Bandeau doré en bas
  const band = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.12, 2.05), goldMat);
  band.position.y = 0.06;
  hotel.add(band);

  // Fenêtres lumineuses
  const windows = [];
  const wGeo = new THREE.PlaneGeometry(0.28, 0.38);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const win = new THREE.Mesh(wGeo, windowMat.clone());
      win.position.set(-0.85 + col * 0.85, 1.2 + row * 0.9, 1.02);
      win.userData.baseIntensity = 0.3 + Math.random() * 0.5;
      win.userData.phase = Math.random() * Math.PI * 2;
      windows.push(win);
      hotel.add(win);
    }
  }

  // Entrée hôtel
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.05), darkMat);
  door.position.set(0, 0.45, 1.03);
  hotel.add(door);

  const doorframe = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.06), goldMat);
  doorframe.position.set(0, 0.94, 1.03);
  hotel.add(doorframe);

  // Colonnes entrée
  [-0.5, 0.5].forEach(x => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), goldMat);
    col.position.set(x, 0.5, 1.05);
    hotel.add(col);
  });

  // Auvent entrée
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.5), goldMat);
  canopy.position.set(0, 1.0, 1.3);
  hotel.add(canopy);

  scene.add(hotel);

  // Sol réfléchissant
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x060c18, metalness: 0.3, roughness: 0.8 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Particules flottantes (étoiles)
  const particleGeo = new THREE.BufferGeometry();
  const count = 120;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({ color: 0xc9a84c, size: 0.05, transparent: true, opacity: 0.6 })
  );
  scene.add(particles);

  // Interaction souris
  let mouseX = 0, mouseY = 0;
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / W - 0.5) * 2;
    mouseY = -((e.clientY - rect.top) / H - 0.5) * 2;
  });

  // Animation
  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();
    requestAnimationFrame(animate);

    // Rotation douce de l'hôtel suivant la souris
    hotel.rotation.y = THREE.MathUtils.lerp(hotel.rotation.y, mouseX * 0.3, 0.05);
    hotel.rotation.x = THREE.MathUtils.lerp(hotel.rotation.x, mouseY * 0.1, 0.05);
    hotel.position.y = Math.sin(t * 0.4) * 0.08;

    // Fenêtres qui clignotent
    windows.forEach(w => {
      w.material.emissiveIntensity = w.userData.baseIntensity + Math.sin(t * 1.5 + w.userData.phase) * 0.15;
    });

    // Particules tournent
    particles.rotation.y = t * 0.03;

    renderer.render(scene, camera);
  }
  animate();

  // Responsive
  window.addEventListener('resize', () => {
    const W2 = canvas.clientWidth, H2 = canvas.clientHeight;
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
    renderer.setSize(W2, H2);
  });
}

/* ─────────────────────────────────────────────
   2. RÉSULTATS : Graphique barres 3D animé
───────────────────────────────────────────── */
export function initRevenueChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const W = canvas.clientWidth, H = canvas.clientHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 50);
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dir = new THREE.DirectionalLight(0xc9a84c, 2);
  dir.position.set(5, 5, 5);
  scene.add(dir);
  scene.add(new THREE.PointLight(0x1a3a6a, 1, 15));

  // Données : mois avant / après AHRPA
  const beforeData = [0.35, 0.40, 0.38, 0.42, 0.45, 0.41];
  const afterData  = [0.52, 0.61, 0.58, 0.72, 0.85, 1.0];
  const labels = ['J', 'F', 'M', 'A', 'M', 'J'];

  const bars = [];
  const spacing = 1.2;
  const offset = -(beforeData.length - 1) * spacing / 2;

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 0.6, roughness: 0.3, emissive: 0xc9a84c, emissiveIntensity: 0.1 });
  const navyMat = new THREE.MeshStandardMaterial({ color: 0x1a3060, metalness: 0.3, roughness: 0.7 });

  beforeData.forEach((val, i) => {
    const x = offset + i * spacing;

    // Barre avant (bleu foncé)
    const bBar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.01, 0.4), navyMat.clone());
    bBar.position.set(x - 0.25, 0, 0);
    bBar.userData = { targetH: val * 3, phase: i * 0.2 };
    scene.add(bBar);
    bars.push({ mesh: bBar, target: val * 3, isBefore: true });

    // Barre après (or)
    const aBar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.01, 0.4), goldMat.clone());
    aBar.position.set(x + 0.25, 0, 0);
    aBar.userData = { targetH: afterData[i] * 3, phase: i * 0.2 + 0.1 };
    scene.add(aBar);
    bars.push({ mesh: aBar, target: afterData[i] * 3, isAfter: true });
  });

  // Sol
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 6),
    new THREE.MeshStandardMaterial({ color: 0x060c18, metalness: 0.2, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // Grille dorée
  const gridHelper = new THREE.GridHelper(10, 10, 0xc9a84c, 0x1a2840);
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  let progress = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    progress = Math.min(progress + 0.008, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    bars.forEach(b => {
      const h = b.target * eased;
      b.mesh.scale.y = Math.max(h, 0.01);
      b.mesh.position.y = h / 2;
      if (b.isAfter && b.mesh.material.emissiveIntensity !== undefined) {
        b.mesh.material.emissiveIntensity = 0.1 + Math.sin(t * 2 + b.mesh.position.x) * 0.08;
      }
    });

    camera.position.x = Math.sin(t * 0.15) * 0.5;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const W2 = canvas.clientWidth, H2 = canvas.clientHeight;
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
    renderer.setSize(W2, H2);
  });
}

/* ─────────────────────────────────────────────
   3. SECTION MÉTHODE : Globe 3D Albanie
───────────────────────────────────────────── */
export function initGlobe(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const W = canvas.clientWidth, H = canvas.clientHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 50);
  camera.position.set(0, 0, 3.5);

  scene.add(new THREE.AmbientLight(0x1a3060, 2));
  const sunLight = new THREE.DirectionalLight(0xc9a84c, 3);
  sunLight.position.set(3, 2, 3);
  scene.add(sunLight);

  // Globe
  const globeGeo = new THREE.SphereGeometry(1, 64, 64);
  const globeMat = new THREE.MeshStandardMaterial({
    color: 0x0a1628,
    metalness: 0.1,
    roughness: 0.6,
    wireframe: false
  });
  const globe = new THREE.Mesh(globeGeo, globeMat);
  scene.add(globe);

  // Wireframe par-dessus
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(1.002, 18, 18),
    new THREE.MeshBasicMaterial({ color: 0xc9a84c, wireframe: true, transparent: true, opacity: 0.08 })
  );
  scene.add(wire);

  // Atmosphère brillante
  const atmoMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a6a,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
    emissive: 0x1a3a6a,
    emissiveIntensity: 0.5
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.08, 32, 32), atmoMat));

  // Points lumineux (villes) — lat/lon to 3D
  function latLonToVec3(lat, lon, r = 1.02) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  const cities = [
    { name: 'Tirana',  lat: 41.33, lon: 19.82, color: 0xc9a84c, size: 0.04 },
    { name: 'Durrës',  lat: 41.32, lon: 19.45, color: 0xc9a84c, size: 0.03 },
    { name: 'Sarandë', lat: 39.87, lon: 20.01, color: 0xc9a84c, size: 0.03 },
    { name: 'Cannes',  lat: 43.55, lon: 7.02,  color: 0x4a90e2, size: 0.035 },
    { name: 'Antibes', lat: 43.58, lon: 7.13,  color: 0x4a90e2, size: 0.028 },
    { name: 'Paris',   lat: 48.85, lon: 2.35,  color: 0x4a90e2, size: 0.025 },
  ];

  const dotGroup = new THREE.Group();
  cities.forEach(city => {
    const pos = latLonToVec3(city.lat, city.lon);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(city.size, 8, 8),
      new THREE.MeshBasicMaterial({ color: city.color })
    );
    dot.position.copy(pos);
    dot.userData = { phase: Math.random() * Math.PI * 2 };

    // Halo autour du point
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(city.size * 1.5, city.size * 2.5, 16),
      new THREE.MeshBasicMaterial({ color: city.color, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    halo.position.copy(pos);
    halo.lookAt(0, 0, 0);
    dotGroup.add(halo);
    dotGroup.add(dot);
  });
  scene.add(dotGroup);

  // Arc de connexion Albanie → France
  const arcPoints = [];
  const start = latLonToVec3(41.33, 19.82, 1.05);
  const end = latLonToVec3(43.55, 7.02, 1.05);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5).normalize().multiplyScalar(1.4);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  for (let i = 0; i <= 40; i++) arcPoints.push(curve.getPoint(i / 40));
  const arc = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arcPoints),
    new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.5 })
  );
  scene.add(arc);

  let mouseX = 0;
  canvas.addEventListener('mousemove', e => {
    mouseX = (e.clientX / W - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    globe.rotation.y = t * 0.1 + mouseX * 0.3;
    wire.rotation.y = globe.rotation.y;
    dotGroup.rotation.y = globe.rotation.y;
    arc.rotation.y = globe.rotation.y;

    // Pulsation des points
    dotGroup.children.forEach((c, i) => {
      if (c.userData.phase !== undefined) {
        c.material.opacity = 0.3 + Math.abs(Math.sin(t * 2 + c.userData.phase)) * 0.4;
      }
    });

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const W2 = canvas.clientWidth, H2 = canvas.clientHeight;
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
    renderer.setSize(W2, H2);
  });
}
