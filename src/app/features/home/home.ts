import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas') threeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroContent') heroContent!: ElementRef;
  @ViewChild('cursor') cursor!: ElementRef;
  @ViewChild('cursorDot') cursorDot!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId!: number;
  private logoGroup!: THREE.Group;
  private rings: THREE.Mesh[] = [];
  private particles!: THREE.Points;
  private mouseMoveHandler!: (e: MouseEvent) => void;
  private mouse = { x: 0, y: 0 };

  services = [
    {
      icon: '🎯',
      title: 'Brand Strategy',
      desc: 'We craft powerful brand identities that resonate with your audience and stand out in the market.',
    },
    {
      icon: '✦',
      title: 'Visual Identity',
      desc: 'Logos, color systems, typography — we build cohesive visual languages that tell your story.',
    },
    {
      icon: '▶',
      title: 'Motion & Video',
      desc: 'Cinematic video production and motion graphics that captivate and convert.',
    },
    {
      icon: '◈',
      title: 'Web Design',
      desc: 'Pixel-perfect websites with immersive experiences that drive real results.',
    },
    {
      icon: '◎',
      title: 'Graphic Design',
      desc: 'From social media to print — creative designs that make your brand unforgettable.',
    },
    {
      icon: '⬡',
      title: 'Digital Marketing',
      desc: 'Data-driven campaigns that grow your reach and maximize your ROI.',
    },
  ];

  stats = [
    { value: 96, suffix: '+', label: 'Projects Delivered' },
    { value: 50, suffix: '+', label: 'Happy Clients' },
    { value: 5, suffix: 'x', label: 'Average ROI' },
    { value: 3, suffix: '+', label: 'Years Experience' },
  ];

  works = [
    { title: 'Brand Identity', category: 'Visual Identity', color: '#8a4fff' },
    { title: 'Social Campaign', category: 'Digital Marketing', color: '#6a3bbf' },
    { title: 'Motion Reel', category: 'Video Production', color: '#9d6fff' },
    { title: 'E-Commerce Site', category: 'Web Design', color: '#7b52d4' },
    { title: 'Logo Design', category: 'Graphic Design', color: '#5c2ea8' },
    { title: 'Ad Campaign', category: 'Marketing', color: '#a67fff' },
  ];

  ngAfterViewInit() {
    this.initThree();
    this.initCursor();
    this.initScrollAnimation();
    this.initSections();
  }

  // ══════════════════════════════
  // THREE.JS SETUP
  // ══════════════════════════════
  initThree() {
    const canvas = this.threeCanvas.nativeElement;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.z = 5;

    // Build scene
    this.createLogoRings();
    this.createParticles();
    this.createTunnel();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x8a4fff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x8a4fff, 2, 20);
    pointLight.position.set(0, 0, 3);
    this.scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xc49bff, 1, 15);
    pointLight2.position.set(3, 2, -2);
    this.scene.add(pointLight2);

    // Mouse interaction
    this.mouseMoveHandler = (e: MouseEvent) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', this.mouseMoveHandler);

    // Resize
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    // Start render loop
    this.animate();

    // Entrance animation
    this.entranceAnimation();
  }

  createLogoRings() {
    this.logoGroup = new THREE.Group();

    const ringData = [
      { radius: 0.3, tube: 0.015, color: 0xc49bff, speed: 0.008 },
      { radius: 0.6, tube: 0.012, color: 0x8a4fff, speed: -0.006 },
      { radius: 0.95, tube: 0.01, color: 0x6a3bbf, speed: 0.004 },
      { radius: 1.35, tube: 0.008, color: 0x5c2ea8, speed: -0.003 },
      { radius: 1.8, tube: 0.006, color: 0x3d1a7a, speed: 0.002 },
    ];

    ringData.forEach((data, i) => {
      const geo = new THREE.TorusGeometry(data.radius, data.tube, 16, 100);
      const mat = new THREE.MeshStandardMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.userData['speed'] = data.speed;
      ring.userData['initialScale'] = 0;
      ring.scale.set(0, 0, 0);

      // Slight tilt for 3D effect
      ring.rotation.x = i % 2 === 0 ? 0.1 : -0.1;

      this.rings.push(ring);
      this.logoGroup.add(ring);
    });

    // Center sphere (the dot of the logo)
    const sphereGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xc49bff,
      emissive: 0xc49bff,
      emissiveIntensity: 1,
      metalness: 1,
      roughness: 0,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.logoGroup.add(sphere);

    // Glow sphere
    const glowGeo = new THREE.SphereGeometry(0.25, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x8a4fff,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    this.logoGroup.add(glow);

    this.scene.add(this.logoGroup);
  }

  createParticles() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const color1 = new THREE.Color(0x8a4fff);
    const color2 = new THREE.Color(0xc49bff);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;

      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  createTunnel() {
    // Tunnel rings for the "enter" effect
    for (let i = 0; i < 20; i++) {
      const geo = new THREE.TorusGeometry(2.5 + i * 0.1, 0.008, 8, 80);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x8a4fff,
        transparent: true,
        opacity: 0.08 - i * 0.003,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.z = -i * 1.5;
      ring.userData['isTunnel'] = true;
      this.scene.add(ring);
    }
  }

  entranceAnimation() {
    // Camera starts far back
    this.camera.position.z = 12;

    gsap.to(this.camera.position, {
      z: 5,
      duration: 2.5,
      ease: 'power3.out',
      delay: 0.3,
    });

    // Rings scale in one by one
    this.rings.forEach((ring, i) => {
      gsap.to(ring.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1,
        delay: 0.5 + i * 0.15,
        ease: 'back.out(1.7)',
      });
    });

    // Content fade in
    gsap.from(this.heroContent.nativeElement.children, {
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      delay: 1.2,
      ease: 'power3.out',
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    // Rotate rings
    this.rings.forEach((ring, i) => {
      ring.rotation.z += ring.userData['speed'];
      ring.rotation.x = Math.sin(time * 0.3 + i) * 0.15;
    });

    // Logo group mouse follow
    gsap.to(this.logoGroup.rotation, {
      x: -this.mouse.y * 0.3,
      y: this.mouse.x * 0.3,
      duration: 2,
      ease: 'power2.out',
    });

    // Particles slow rotation
    this.particles.rotation.y = time * 0.02;
    this.particles.rotation.x = time * 0.01;

    // Tunnel rings rotation
    this.scene.children.forEach((child) => {
      if (child.userData['isTunnel']) {
        (child as THREE.Mesh).rotation.z += 0.001;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  // ══════════════════════════════
  // SCROLL ANIMATION
  // ══════════════════════════════
  initScrollAnimation() {
    const heroEl = document.querySelector('.hero') as HTMLElement;

    ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;

        // Camera flies into the logo (tunnel effect)
        this.camera.position.z = 5 - p * 20;
        this.camera.position.y = p * 2;

        // Logo group spins as we enter
        this.logoGroup.rotation.z = p * Math.PI * 2;
        this.logoGroup.scale.setScalar(1 + p * 3);

        // Particles spread out
        this.particles.rotation.z = p * Math.PI;

        // Content fades out
        gsap.set(this.heroContent.nativeElement, {
          y: p * -120,
          opacity: 1 - p * 2,
        });
      },
    });
  }

  // ══════════════════════════════
  // OTHER SECTIONS
  // ══════════════════════════════
  initSections() {
    // Services
    gsap.from('.services__header', {
      scrollTrigger: { trigger: '.services', start: 'top 75%' },
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    });
    gsap.from('.service-card', {
      scrollTrigger: { trigger: '.services__grid', start: 'top 80%' },
      y: 80,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
    });

    // Stats
    this.stats.forEach((stat, i) => {
      const el = document.querySelectorAll('.stat__value')[i];
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: '.stats',
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: stat.value,
            duration: 2.5,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = Math.round(obj.val) + stat.suffix;
            },
          });
        },
      });
    });
    gsap.from('.stat-item', {
      scrollTrigger: { trigger: '.stats', start: 'top 80%' },
      y: 50,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power3.out',
    });

    // Works
    gsap.from('.works__header', {
      scrollTrigger: { trigger: '.works', start: 'top 75%' },
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    });
    gsap.from('.work-card', {
      scrollTrigger: { trigger: '.works__grid', start: 'top 80%' },
      scale: 0.85,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'back.out(1.4)',
    });

    // CTA
    gsap.from('.cta__content > *', {
      scrollTrigger: { trigger: '.cta', start: 'top 75%' },
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
    });
  }

  // ══════════════════════════════
  // CURSOR
  // ══════════════════════════════
  initCursor() {
    const cursor = this.cursor.nativeElement;
    const dot = this.cursorDot.nativeElement;

    window.addEventListener('mousemove', (e: MouseEvent) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power2.out' });
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1 });
    });

    document.querySelectorAll('a, button, .service-card, .work-card').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(cursor, { scale: 2.5, opacity: 0.3, duration: 0.3 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 });
      });
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }
}
