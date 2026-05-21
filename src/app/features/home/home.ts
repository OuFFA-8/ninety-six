import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { Hero } from '../hero/hero';
import { DartIntro } from '../../core/dart-intro/dart-intro';

gsap.registerPlugin(ScrollTrigger, Draggable);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Hero, DartIntro],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit, OnDestroy {
  @ViewChild('cursor') cursor!: ElementRef;
  @ViewChild('cursorDot') cursorDot!: ElementRef;
  @ViewChild('testiTrack') testiTrack!: ElementRef;
  @ViewChild('transitionVeil', { static: true }) transitionVeil!: ElementRef<HTMLElement>;
  @ViewChild('veilStars', { static: true }) veilStars!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pageBg',   { static: true }) pageBg!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('heroArcs', { static: true }) heroArcs!: ElementRef<HTMLElement>;
  @ViewChild(Hero) private heroComp!: Hero;

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  showLoading = false;
  showDartIntro = !sessionStorage.getItem('dartIntroPlayed');

  onLoadingDone(): void {
    this.showLoading = false;
  }

  onDartIntroTransitioning(): void {
    // Snap veil visible immediately — black + stars bridges the exit
    gsap.set(this.transitionVeil.nativeElement, { opacity: 1 });
    this.startVeilStars();
  }

  onDartIntroDone(): void {
    this.showDartIntro = false;
    sessionStorage.setItem('dartIntroPlayed', '1');
    this.unlockScroll();
    // Hero entrance begins after a short beat (veil still covers)
    setTimeout(() => this.heroComp.playEntrance(), 380);
    // Veil fades out, revealing the hero mid-entrance
    gsap.to(this.transitionVeil.nativeElement, {
      opacity: 0,
      duration: 1.4,
      delay: 0.2,
      ease: 'power2.inOut',
      onComplete: () => {
        cancelAnimationFrame(this._veilRaf);
        this._veilRaf = 0;
      },
    });
  }

  private _veilRaf = 0;
  private _pageStarRaf = 0;

  // ── Global page star field ─────────────────────────────

  private initPageStars(): void {
    const canvas = this.pageBg.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    interface PS {
      x: number;
      y: number;
      r: number;
      baseAlpha: number;
      hue: number;
      phase: number;
      spd: number;
      drift: number;
      driftAmp: number;
      driftSpd: number;
      parallax: number;
      ox: number;
      oy: number;
    }
    const stars: PS[] = Array.from({ length: 600 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 0.9 + 0.3,
      baseAlpha: Math.random() * 0.45 + 0.15,
      hue: Math.random() * 40 + 255,
      phase: Math.random() * Math.PI * 2,
      spd: Math.random() * 0.6 + 0.3,
      drift: Math.random() * Math.PI * 2,
      driftAmp: Math.random() * 0.4 + 0.1,
      driftSpd: Math.random() * 0.4 + 0.2,
      parallax: Math.random() * 0.8 + 0.2,
      ox: 0,
      oy: 0,
    }));

    // Mouse parallax — stars + arcs move together
    const arcsEl = this.heroArcs.nativeElement;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      for (const s of stars) { s.ox = nx * 32 * s.parallax; }
      gsap.to(arcsEl, { x: nx * 22, y: ny * 16, duration: 2.2, ease: 'power3.out', overwrite: 'auto' });
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const W = () => canvas.width;
    const H = () => canvas.height;

    let t = 0;
    const draw = () => {
      this._pageStarRaf = requestAnimationFrame(draw);
      t += 0.016;

      // Full black background — same vibe as the old hero
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W(), H());

      for (const s of stars) {
        s.oy += (Math.sin(t * s.driftSpd + s.drift) * s.driftAmp - s.oy) * 0.05;
        const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(t * s.spd + s.phase));
        const wx = (((s.x + s.ox) % W()) + W()) % W();
        const wy = (((s.y + s.oy) % H()) + H()) % H();
        ctx.beginPath();
        ctx.arc(wx, wy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${alpha})`;
        ctx.fill();
      }
    };
    draw();
  }

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

  impactStats = [
    {
      index: '01 — Output',
      value: 124,
      suffix: '+',
      label: 'Projects Landed',
      desc: 'Campaigns, identities and launches shipped across the region since <em>2020</em>. Every one engineered to hit.',
    },
    {
      index: '02 — Reach',
      value: 48,
      suffix: '',
      label: 'Brands Built',
      desc: 'Identity systems engineered to <em>scale</em> beyond their first quarter. Built to hold up at every angle.',
    },
    {
      index: '03 — Tenure',
      value: 6,
      suffix: 'yr',
      label: 'In Motion',
      desc: 'Six years of refining how to take a <em>vague brief</em> and turn it into a brand that moves.',
    },
  ];

  trustLogos = ['Zamil & Kharrashi', 'Arabsat', 'Solidere', 'Mobily', 'Saudia'];

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
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => this.initPageStars());
    this.initCursor();
    this.initServiceCards();
    this.initStats();
    this.initWorks();
    this.initCTA();
    this.initGallery();
    this.initTestimonials();
    this.initPartners();
    this.initFooter();

    if (this.showDartIntro) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      setTimeout(() => this.heroComp?.playEntrance(), 100);
    }
  }

  ngOnDestroy() {
    ScrollTrigger.getAll().forEach((t) => t.kill());
    if (this._veilRaf) cancelAnimationFrame(this._veilRaf);
    if (this._pageStarRaf) cancelAnimationFrame(this._pageStarRaf);
    this.unlockScroll();
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  // ── Transition veil stars ──────────────────────────────

  private startVeilStars(): void {
    const canvas = this.veilStars.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;

    interface VS {
      x: number;
      y: number;
      r: number;
      alpha: number;
      hue: number;
      phase: number;
      spd: number;
      drift: number;
      driftAmp: number;
      driftSpd: number;
    }
    const stars: VS[] = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 0.9 + 0.2,
      alpha: Math.random() * 0.5 + 0.12,
      hue: Math.random() * 40 + 255,
      phase: Math.random() * Math.PI * 2,
      spd: Math.random() * 0.5 + 0.3,
      drift: Math.random() * Math.PI * 2,
      driftAmp: Math.random() * 0.35 + 0.1,
      driftSpd: Math.random() * 0.3 + 0.15,
    }));

    let t = 0;
    const draw = () => {
      this._veilRaf = requestAnimationFrame(draw);
      t += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.spd + s.phase));
        const dy = Math.sin(t * s.driftSpd + s.drift) * s.driftAmp;
        ctx.beginPath();
        ctx.arc(s.x, s.y + dy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${a})`;
        ctx.fill();
      }
    };
    this.ngZone.runOutsideAngular(draw);
  }

  // ── Section animations ──

  initServiceCards() {
    gsap.from('.services-portal .section-head', {
      scrollTrigger: { trigger: '.services-portal', start: 'top 80%' },
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    });
    gsap.utils.toArray<HTMLElement>('.deck-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 90%' },
        opacity: 0,
        y: 40,
        duration: 0.7,
        delay: i * 0.05,
        ease: 'power2.out',
      });
    });
  }

  initStats() {
    gsap.from('.impact__head > *', {
      scrollTrigger: { trigger: '.impact__head', start: 'top 82%', once: true },
      y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
    });
    gsap.from('.stat-block', {
      scrollTrigger: { trigger: '.impact__stats', start: 'top 82%', once: true },
      y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
    });
    gsap.from('.trust', {
      scrollTrigger: { trigger: '.trust', start: 'top 88%', once: true },
      y: 30, opacity: 0, duration: 0.7, ease: 'power2.out',
    });

    // Counter animation
    this.impactStats.forEach((stat, i) => {
      const el = document.querySelectorAll('.counter')[i] as HTMLElement | undefined;
      if (!el) return;
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: '.impact__stats',
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: stat.value,
            duration: 2.5,
            delay: i * 0.15,
            ease: 'power2.out',
            onUpdate: () => { el.textContent = String(Math.round(obj.val)); },
          });
        },
      });
    });
  }

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

  initCTA() {
    gsap.from('.cta__inner > *', {
      scrollTrigger: { trigger: '.cta', start: 'top 75%' },
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
    });
  }

  initGallery() {
    gsap.from('.gallery-section .section-head', {
      scrollTrigger: { trigger: '.gallery-section', start: 'top 80%' },
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    });
    gsap.from('.gallery__item', {
      scrollTrigger: { trigger: '.gallery', start: 'top 90%' },
      opacity: 0,
      scale: 0.92,
      duration: 0.7,
      stagger: { amount: 0.8, from: 'random' },
      ease: 'power2.out',
    });
    const directions = [-150, 150, -100, 120];
    document.querySelectorAll<HTMLElement>('.gallery__col').forEach((col, i) => {
      gsap.fromTo(
        col,
        { y: -Math.abs(directions[i]) / 2 },
        {
          y: directions[i],
          ease: 'none',
          scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: 2 },
        },
      );
    });
  }

  initTestimonials() {
    const track = this.testiTrack.nativeElement as HTMLElement;
    const cardWidth = 480 + 24;
    let current = 0;
    const total = this.testimonials.length;

    const updateCounter = () => {
      const el = document.getElementById('testiCurrent');
      if (el) el.textContent = String(current + 1);
    };

    const goTo = (index: number) => {
      current = Math.max(0, Math.min(index, total - 1));
      gsap.to(track, { x: -current * cardWidth, duration: 0.7, ease: 'power3.out' });
      updateCounter();
    };

    Draggable.create(track, {
      type: 'x',
      edgeResistance: 0.85,
      bounds: { minX: -(total - 1) * cardWidth, maxX: 0 },
      inertia: true,
      onDragEnd: function (this: Draggable.Vars) {
        const snapped = Math.round(-this['x'] / cardWidth);
        current = Math.max(0, Math.min(snapped, total - 1));
        gsap.to(track, { x: -current * cardWidth, duration: 0.5, ease: 'power3.out' });
        updateCounter();
      },
    });

    document.getElementById('testiNext')?.addEventListener('click', () => goTo(current + 1));
    document.getElementById('testiPrev')?.addEventListener('click', () => goTo(current - 1));

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
    gsap.from('.partners__title', {
      scrollTrigger: { trigger: '.partners', start: 'top 80%' },
      x: -80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    });
    gsap.from('.partner-logo', {
      scrollTrigger: { trigger: '.partners__grid', start: 'top 85%' },
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: { amount: 1.2, from: 'start' },
      ease: 'power2.out',
    });
  }

  initFooter() {
    gsap.from('.footer__brand', {
      scrollTrigger: { trigger: '.footer-wrapper', start: 'top 90%' },
      x: -50,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    });
    gsap.from('.footer__col', {
      scrollTrigger: { trigger: '.footer-wrapper', start: 'top 90%' },
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power2.out',
    });
    gsap.from('.footer__big-text span', {
      scrollTrigger: { trigger: '.footer-wrapper', start: 'top 80%' },
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
    });
  }


  initCursor() {
    const cursor = this.cursor.nativeElement;
    const dot = this.cursorDot.nativeElement;

    window.addEventListener('mousemove', (e: MouseEvent) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power2.out' });
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1 });
    });

    document.querySelectorAll('a, button, .deck-card, .work-card').forEach((el) => {
      el.addEventListener('mouseenter', () =>
        gsap.to(cursor, { scale: 2.5, opacity: 0.3, duration: 0.3 }),
      );
      el.addEventListener('mouseleave', () =>
        gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 }),
      );
    });
  }
}
