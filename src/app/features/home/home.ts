import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { Draggable } from 'gsap/Draggable';
gsap.registerPlugin(Draggable);

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
  // @ViewChild('portalFlash') portalFlash!: ElementRef;
  @ViewChild('dotOverlay') dotOverlay!: ElementRef;
  @ViewChild('testiTrack') testiTrack!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId!: number;
  private targetGroup!: THREE.Group;
  private rings: THREE.Mesh[] = [];
  private particles!: THREE.Points;
  private tunnelRings: THREE.Mesh[] = [];
  private mouse = { x: 0, y: 0 };
  private mouseMoveHandler!: (e: MouseEvent) => void;

  services = [
    {
      tag: '01',
      icon: '🎯',
      title: 'Brand Strategy',
      desc: 'Powerful brand identities that resonate with your audience and dominate the market.',
      works: [
        { title: 'Nike MENA', color: '#8a4fff' },
        { title: 'Adidas Gulf', color: '#6a3bbf' },
        { title: 'Pepsi Egypt', color: '#9d6fff' },
      ],
    },
    {
      tag: '02',
      icon: '✦',
      title: 'Visual Identity',
      desc: 'Logos, color systems, typography — cohesive visual languages that tell your story.',
      works: [
        { title: 'Noon Brand', color: '#5c2ea8' },
        { title: 'Careem ID', color: '#8a4fff' },
        { title: 'Talabat VI', color: '#7b52d4' },
      ],
    },
    {
      tag: '03',
      icon: '▶',
      title: 'Motion & Video',
      desc: 'Cinematic video production and motion graphics that captivate and convert.',
      works: [
        { title: 'Ramadan Campaign', color: '#9d6fff' },
        { title: 'Product Reel', color: '#8a4fff' },
        { title: 'Brand Film', color: '#6a3bbf' },
      ],
    },
    {
      tag: '04',
      icon: '◈',
      title: 'Web Design',
      desc: 'Pixel-perfect websites with immersive experiences that drive real results.',
      works: [
        { title: 'E-Commerce', color: '#7b52d4' },
        { title: 'SaaS Landing', color: '#8a4fff' },
        { title: 'Portfolio Site', color: '#5c2ea8' },
      ],
    },
    {
      tag: '05',
      icon: '◎',
      title: 'Graphic Design',
      desc: 'From social media to print — creative designs that make your brand unforgettable.',
      works: [
        { title: 'Social Pack', color: '#8a4fff' },
        { title: 'OOH Campaign', color: '#9d6fff' },
        { title: 'Print Design', color: '#6a3bbf' },
      ],
    },
    {
      tag: '06',
      icon: '⬡',
      title: 'Digital Marketing',
      desc: 'Data-driven campaigns that grow your reach and maximize your ROI.',
      works: [
        { title: 'Meta Ads', color: '#5c2ea8' },
        { title: 'SEO Campaign', color: '#8a4fff' },
        { title: 'Email Marketing', color: '#7b52d4' },
      ],
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

  partners = [
    'Nike',
    'Adidas',
    'Pepsi',
    'Samsung',
    'Noon',
    'Careem',
    'Talabat',
    'Spotify',
    'Apple',
    'Google',
    'Meta',
    'Amazon',
    'Uber',
    'Netflix',
    'Airbnb',
    'Adobe',
  ];

  galleryColumns = [
    [
      { label: 'Brand Strategy', bg: 'linear-gradient(135deg, #1a0535, #3d1a7a)' },
      { label: 'Visual Identity', bg: 'linear-gradient(135deg, #0a0318, #6a3bbf)' },
      { label: 'Motion Design', bg: 'linear-gradient(135deg, #120526, #8a4fff)' },
    ],
    [
      { label: 'Web Design', bg: 'linear-gradient(135deg, #0d0520, #5c2ea8)' },
      { label: 'Social Media', bg: 'linear-gradient(135deg, #1a0535, #9d6fff)' },
      { label: 'Campaigns', bg: 'linear-gradient(135deg, #080314, #7b52d4)' },
    ],
    [
      { label: 'Photography', bg: 'linear-gradient(135deg, #120526, #4a1a96)' },
      { label: 'Print Design', bg: 'linear-gradient(135deg, #0a0318, #8a4fff)' },
      { label: 'Branding', bg: 'linear-gradient(135deg, #1a0535, #6a3bbf)' },
    ],
    [
      { label: 'UI/UX Design', bg: 'linear-gradient(135deg, #0d0520, #c49bff)' },
      { label: 'Digital Ads', bg: 'linear-gradient(135deg, #080314, #8a4fff)' },
      { label: 'Marketing', bg: 'linear-gradient(135deg, #120526, #5c2ea8)' },
    ],
  ];

  testimonials = [
    {
      text: 'Ninety Six completely transformed our brand. The strategy was sharp, the execution was flawless, and results came faster than expected.',
      name: 'Ahmed Khalil',
      role: 'CEO, Noon Egypt',
      initials: 'AK',
    },
    {
      text: 'The team understood our vision from day one. Our new identity feels premium and has been noticed by everyone in the industry.',
      name: 'Sara Mostafa',
      role: 'Marketing Director, Careem',
      initials: 'SM',
    },
    {
      text: 'Best investment we made. Our social media engagement went up 5x in just two months after working with Ninety Six.',
      name: 'Omar Fathy',
      role: 'Founder, Bounce',
      initials: 'OF',
    },
    {
      text: "Creative, professional, and always on time. They don't just deliver — they deliver wow.",
      name: 'Nour Hassan',
      role: 'Brand Manager, Diageo',
      initials: 'NH',
    },
    {
      text: 'Our website redesign exceeded all expectations. The animations and UX are on another level.',
      name: 'Karim Adel',
      role: 'CTO, Tribepad',
      initials: 'KA',
    },
    {
      text: 'Working with Ninety Six felt like having an in-house creative team that truly cares about your success.',
      name: 'Laila Ramzy',
      role: 'Director, British Red Cross Egypt',
      initials: 'LR',
    },
  ];

  ngAfterViewInit() {
    this.initThree();
    this.initCursor();
    this.initHeroScroll();
    this.initServiceCards();
    this.initStats();
    this.initWorks();
    this.initCTA();
    this.initPartners();
    this.initFooter();
    this.initGallery();
    this.initTestimonials();
  }

  initGallery() {
    gsap.from('.gallery-section__header', {
      scrollTrigger: {
        trigger: '.gallery-section',
        start: 'top 80%',
      },
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    });

    gsap.from('.gallery__item', {
      scrollTrigger: {
        trigger: '.gallery',
        start: 'top 90%',
      },
      opacity: 0,
      scale: 0.92,
      duration: 0.7,
      stagger: { amount: 0.8, from: 'random' },
      ease: 'power2.out',
    });

    // عمود 1 و 3 → لفوق | عمود 2 و 4 → لتحت
    const directions = [-150, 150, -100, 120];

    document.querySelectorAll<HTMLElement>('.gallery__col').forEach((col, i) => {
      gsap.fromTo(
        col,
        { y: directions[i] > 0 ? -directions[i] / 2 : -directions[i] / 2 },
        {
          y: directions[i],
          ease: 'none',
          scrollTrigger: {
            trigger: '.gallery',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 2,
          },
        },
      );
    });
  }

  initTestimonials() {
    // Register Draggable
    gsap.registerPlugin(Draggable);

    const track = this.testiTrack.nativeElement as HTMLElement;
    const cards = track.querySelectorAll<HTMLElement>('.testi-card');
    const cardWidth = 480 + 24; // width + gap
    let current = 0;
    const total = this.testimonials.length;

    const updateCounter = () => {
      const el = document.getElementById('testiCurrent');
      if (el) el.textContent = String(current + 1);
    };

    const goTo = (index: number) => {
      current = Math.max(0, Math.min(index, total - 1));
      gsap.to(track, {
        x: -current * cardWidth,
        duration: 0.7,
        ease: 'power3.out',
      });
      updateCounter();
    };

    // Draggable
    Draggable.create(track, {
      type: 'x',
      edgeResistance: 0.85,
      bounds: {
        minX: -(total - 1) * cardWidth,
        maxX: 0,
      },
      inertia: true,
      onDragEnd: function (this: Draggable.Vars) {
        const snapped = Math.round(-this['x'] / cardWidth);
        current = Math.max(0, Math.min(snapped, total - 1));
        gsap.to(track, {
          x: -current * cardWidth,
          duration: 0.5,
          ease: 'power3.out',
        });
        updateCounter();
      },
    });

    // Buttons
    document.getElementById('testiNext')?.addEventListener('click', () => goTo(current + 1));
    document.getElementById('testiPrev')?.addEventListener('click', () => goTo(current - 1));

    // Entrance animation
    gsap.from('.testimonials__left', {
      scrollTrigger: { trigger: '.testimonials', start: 'top 80%' },
      x: -80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    });

    gsap.from('.testi-card', {
      scrollTrigger: { trigger: '.testimonials', start: 'top 75%' },
      x: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
    });
  }

  initPartners() {
    // Title entrance
    gsap.from('.partners__title', {
      scrollTrigger: {
        trigger: '.partners',
        start: 'top 80%',
      },
      x: -80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    });

    // Grid logos stagger
    gsap.from('.partner-logo', {
      scrollTrigger: {
        trigger: '.partners__grid',
        start: 'top 85%',
      },
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: {
        amount: 1.2,
        from: 'start',
      },
      ease: 'power2.out',
    });
  }

  initFooter() {
    gsap.from('.footer__brand', {
      scrollTrigger: {
        trigger: '.footer-wrapper',
        start: 'top 90%',
      },
      x: -50,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    });

    gsap.from('.footer__col', {
      scrollTrigger: {
        trigger: '.footer-wrapper',
        start: 'top 90%',
      },
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power2.out',
    });

    gsap.from('.footer__big-text span', {
      scrollTrigger: {
        trigger: '.footer-wrapper',
        start: 'top 80%',
      },
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
    });
  }

  // ══════════════════════════════
  // THREE.JS
  // ══════════════════════════════
  initThree() {
    const canvas = this.threeCanvas.nativeElement;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.z = 5;

    this.createTargetRings();
    this.createTunnelRings();
    this.createParticles();
    this.createLights();

    this.mouseMoveHandler = (e: MouseEvent) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', this.mouseMoveHandler);

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    this.animate();
    this.entranceAnimation();
  }

  createTargetRings() {
    this.targetGroup = new THREE.Group();

    const ringData = [
      { r: 2.2, tube: 0.025, color: 0x1a0a3a, emissive: 0x1a0a3a },
      { r: 1.7, tube: 0.03, color: 0x2d1260, emissive: 0x2d1260 },
      { r: 1.2, tube: 0.035, color: 0x5c2ea8, emissive: 0x3d1a7a },
      { r: 0.75, tube: 0.04, color: 0x8a4fff, emissive: 0x6a3bbf },
      { r: 0.35, tube: 0.045, color: 0xc49bff, emissive: 0x8a4fff },
    ];

    ringData.forEach((data, i) => {
      const geo = new THREE.TorusGeometry(data.r, data.tube, 16, 120);
      const mat = new THREE.MeshStandardMaterial({
        color: data.color,
        emissive: data.emissive,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.userData['speed'] = i % 2 === 0 ? 0.003 : -0.002;
      ring.scale.set(0, 0, 0);
      this.rings.push(ring);
      this.targetGroup.add(ring);
    });

    // Center dot - THE PORTAL
    const dotGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xc49bff,
      emissiveIntensity: 3,
      metalness: 1,
      roughness: 0,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.userData['isPortal'] = true;
    this.targetGroup.add(dot);

    // Dot glow
    const glowGeo = new THREE.SphereGeometry(0.22, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x8a4fff,
      transparent: true,
      opacity: 0.2,
    });
    this.targetGroup.add(new THREE.Mesh(glowGeo, glowMat));

    this.targetGroup.scale.set(0, 0, 0);
    this.scene.add(this.targetGroup);
  }

  createTunnelRings() {
    for (let i = 0; i < 30; i++) {
      const geo = new THREE.TorusGeometry(0.12 + i * 0.08, 0.005, 8, 60);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x8a4fff,
        transparent: true,
        opacity: 0.15 - i * 0.004,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.z = -i * 0.8;
      ring.visible = false;
      this.tunnelRings.push(ring);
      this.scene.add(ring);
    }
  }

  createParticles() {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c1 = new THREE.Color(0x8a4fff);
    const c2 = new THREE.Color(0xc49bff);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 25;
      positions[i3 + 1] = (Math.random() - 0.5) * 25;
      positions[i3 + 2] = (Math.random() - 0.5) * 25;
      const c = c1.clone().lerp(c2, Math.random());
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.025,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
      }),
    );
    this.scene.add(this.particles);
  }

  createLights() {
    this.scene.add(new THREE.AmbientLight(0x8a4fff, 0.5));
    const p1 = new THREE.PointLight(0xc49bff, 3, 20);
    p1.position.set(0, 3, 4);
    this.scene.add(p1);
    const p2 = new THREE.PointLight(0x8a4fff, 2, 15);
    p2.position.set(-3, -2, 2);
    this.scene.add(p2);
  }

  entranceAnimation() {
    const tl = gsap.timeline({ delay: 0.3 });

    tl.to(this.targetGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.8,
      ease: 'elastic.out(1, 0.5)',
    });

    this.rings.forEach((ring, i) => {
      gsap.to(ring.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1,
        delay: 0.4 + i * 0.12,
        ease: 'back.out(2)',
      });
    });

    gsap.from(this.heroContent.nativeElement.children, {
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      delay: 0.8,
      ease: 'power3.out',
    });

    gsap.to(this.camera.position, {
      z: 5,
      duration: 2,
      ease: 'power3.out',
      delay: 0.2,
    });

    // Rings rotation on entrance
    gsap.to('.hero-ring', {
      rotation: 360,
      duration: 20,
      ease: 'none',
      repeat: -1,
    });
  }

  // ══════════════════════════════
  // SCROLL → PORTAL
  // ══════════════════════════════

  initHeroScroll() {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: '.wrapper',
          start: 'top top',
          end: '+=150%',
          pin: true,
          scrub: true,
        },
      })
      .to('.dot-overlay', {
        opacity: 1,
        duration: 0.1,
      })
      .to('.dot-overlay', {
        scale: 120,
        z: 350,
        transformOrigin: 'center center',
        ease: 'power1.inOut',
      })
      .to(
        this.heroContent.nativeElement,
        {
          scale: 1.05,
          opacity: 0,
          transformOrigin: 'center center',
          ease: 'power1.inOut',
        },
        '<',
      );

    // Services cards
    gsap.from('.service-card-new', {
      scrollTrigger: {
        trigger: '.services-portal',
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
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
  }

  // ══════════════════════════════
  // SERVICES CARDS
  // ══════════════════════════════
  initServiceCards() {
    gsap.from('.services-portal__header', {
      scrollTrigger: {
        trigger: '.services-portal',
        start: 'top 80%',
      },
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    });

    gsap.utils.toArray<HTMLElement>('.deck-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 90%',
        },
        opacity: 0,
        y: 40,
        duration: 0.7,
        delay: i * 0.05,
        ease: 'power2.out',
      });
    });
  }

  // ══════════════════════════════
  // STATS
  // ══════════════════════════════
  initStats() {
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
  }

  // ══════════════════════════════
  // WORKS
  // ══════════════════════════════
  initWorks() {
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
  }

  // ══════════════════════════════
  // CTA
  // ══════════════════════════════
  initCTA() {
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

    document.querySelectorAll('a, button, .service-card-new, .work-card').forEach((el) => {
      el.addEventListener('mouseenter', () =>
        gsap.to(cursor, { scale: 2.5, opacity: 0.3, duration: 0.3 }),
      );
      el.addEventListener('mouseleave', () =>
        gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 }),
      );
    });
  }

  // ══════════════════════════════
  // RENDER LOOP
  // ══════════════════════════════
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    const time = Date.now() * 0.001;

    this.rings.forEach((ring, i) => {
      ring.rotation.z += ring.userData['speed'];
      ring.rotation.x = Math.sin(time * 0.3 + i) * 0.08;
    });

    this.targetGroup.rotation.y = Math.sin(time * 0.2) * 0.1;

    this.camera.position.x += (this.mouse.x * 0.3 - this.camera.position.x) * 0.03;
    this.camera.position.y += (this.mouse.y * 0.2 - this.camera.position.y) * 0.03;

    this.particles.rotation.y = time * 0.015;

    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }
}
