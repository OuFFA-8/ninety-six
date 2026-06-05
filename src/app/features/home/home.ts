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
  private _orbitRaf = 0;

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
      glow: boolean;
      ox: number;
      oy: number;
    }
    const stars: PS[] = Array.from({ length: 600 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.8,
      baseAlpha: Math.random() * 0.45 + 0.15,
      hue: Math.random() * 40 + 255,
      phase: Math.random() * Math.PI * 2,
      spd: Math.random() * 0.6 + 0.3,
      drift: Math.random() * Math.PI * 2,
      driftAmp: Math.random() * 0.4 + 0.1,
      driftSpd: Math.random() * 0.4 + 0.2,
      parallax: Math.random() * 0.8 + 0.2,
      glow: Math.random() > 0.65,
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
        if (s.glow) { ctx.shadowBlur = s.r * 7; ctx.shadowColor = `hsla(${s.hue}, 90%, 85%, ${alpha})`; }
        ctx.beginPath();
        ctx.arc(wx, wy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, ${s.glow ? 90 : 80}%, ${s.glow ? 92 : 75}%, ${alpha})`;
        ctx.fill();
        if (s.glow) ctx.shadowBlur = 0;
      }
    };
    draw();
  }

  services = [
    {
      tag: '01',
      title: 'Branding & Identity',
      desc: 'We build the foundation before the noise starts. Positioning, messaging, visual direction, logos, colors, typography, and brand systems designed to make your brand clear, recognizable, and hard to ignore.',
      cta: 'Explore Identity',
      image: '/Home%20-%20Services%20Built/Branding%20%26%20Identity.png',
      works: [
        { title: 'Brand Systems', color: '#8a4fff' },
        { title: 'Visual Identity', color: '#6a3bbf' },
        { title: 'Logos', color: '#9d6fff' },
      ],
    },
    {
      tag: '02',
      title: 'Graphic Design',
      desc: 'Every visual touchpoint is a chance to say something without explaining. We design social posts, campaigns, decks, ads, and brand assets that carry your identity with consistency, taste, and edge.',
      cta: 'Explore Design',
      image: '/Home%20-%20Services%20Built/graphic%20design.png',
      works: [
        { title: 'Social Assets', color: '#5c2ea8' },
        { title: 'Campaigns', color: '#8a4fff' },
        { title: 'Print Design', color: '#7b52d4' },
      ],
    },
    {
      tag: '03',
      title: 'Motion & Video',
      desc: 'Static gets skipped. We create campaign videos, reels, motion graphics, and brand films that turn attention into emotion — and emotion into memory.',
      cta: 'Explore Motion',
      image: '/Home%20-%20Services%20Built/Motion.png',
      works: [
        { title: 'Brand Film', color: '#9d6fff' },
        { title: 'Motion Graphics', color: '#8a4fff' },
        { title: 'Reels', color: '#6a3bbf' },
      ],
    },
    {
      tag: '04',
      title: 'Web & Mobile App Development',
      desc: 'Your web & app are not decoration. It is where trust is built, interest is shaped, and action begins. We design digital experiences that look sharp, feel intentional, and move people forward.',
      cta: 'Explore Development',
      image: '/Home%20-%20Services%20Built/web%20%26%20mobile%20app%20development.png',
      works: [
        { title: 'Web Design', color: '#7b52d4' },
        { title: 'Mobile App', color: '#8a4fff' },
        { title: 'UX / UI', color: '#5c2ea8' },
      ],
    },
    {
      tag: '05',
      title: 'Digital Marketing',
      desc: 'We do not chase noise. We build direction. From content strategy to paid campaigns, we create marketing systems designed to attract the right audience, shape demand, and convert attention into action.',
      cta: 'Explore Growth',
      image: '/Home%20-%20Services%20Built/Digital%20markting.png',
      works: [
        { title: 'Paid Ads', color: '#8a4fff' },
        { title: 'Content Strategy', color: '#9d6fff' },
        { title: 'Email', color: '#6a3bbf' },
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
      { src: '/HOME%20-%20WORK/1.png',  service: 'Social Media', project: 'Cash Expo',       link: '/portfolio/social/cash-expo'   },
      { src: '/HOME%20-%20WORK/2.jpg',  service: 'Branding',     project: 'Ruh',              link: '/portfolio/branding/ruh'       },
      { src: '/HOME%20-%20WORK/3.png',  service: 'Motion',       project: 'Motion Design',    link: '/portfolio/motion&video'       },
    ],
    [
      { src: '/HOME%20-%20WORK/4.png',  service: 'Web Design',   project: 'About El-Khaleej', link: null                            },
      { src: '/HOME%20-%20WORK/5.jpg',  service: 'Social Media', project: 'Dunkin',           link: '/portfolio/social/dunkin'      },
      { src: '/HOME%20-%20WORK/6.jpg',  service: 'Branding',     project: 'Dot',              link: '/portfolio/branding/dot'       },
    ],
    [
      { src: '/HOME%20-%20WORK/7.jpg',  service: 'Branding',     project: 'Carnaval',         link: null                            },
      { src: '/HOME%20-%20WORK/8.png',  service: 'Video',        project: 'Video Production', link: '/portfolio/motion&video'       },
      { src: '/HOME%20-%20WORK/9.png',  service: 'Social Media', project: 'Hail',             link: '/portfolio/social/hail'        },
    ],
    [
      { src: '/HOME%20-%20WORK/10.jpg', service: 'Application',  project: 'Coming Soon',      link: null                            },
      { src: '/HOME%20-%20WORK/11.jpg', service: 'Branding',     project: '310',              link: '/portfolio/branding/310'       },
      { src: '/HOME%20-%20WORK/12.jpg', service: 'Social Media', project: 'Turbs',            link: '/portfolio/social/turbs'       },
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
    this.ngZone.runOutsideAngular(() => { this.initPageStars(); this.initOrbits(); });
    this.initCursor();
    this.initServiceCards();
    this.initStats();
    this.initCTA();
    this.initGallery();
    this.initTestimonials();
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
    if (this._veilRaf)    cancelAnimationFrame(this._veilRaf);
    if (this._pageStarRaf) cancelAnimationFrame(this._pageStarRaf);
    if (this._orbitRaf)   cancelAnimationFrame(this._orbitRaf);
    this.unlockScroll();
  }

  private initOrbits(): void {
    const arcsEl = this.heroArcs?.nativeElement;
    if (!arcsEl) return;

    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position: 'absolute', inset: '0',
      pointerEvents: 'none', zIndex: '2',
    });
    arcsEl.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    const speeds = [0.012, 0.008, 0.006, 0.004, 0.003, 0.002];
    const sizes  = [6, 8, 9, 10, 11, 12];

    type Orbit = { cx: number; cy: number; r: number; angle: number; speed: number; size: number };
    let orbits: Orbit[] = [];

    const setup = () => {
      // Match canvas pixels exactly to the container
      const box = arcsEl.getBoundingClientRect();
      canvas.width  = Math.round(box.width);
      canvas.height = Math.round(box.height);

      // Read each arc's real rendered position relative to container
      const arcEls = Array.from(arcsEl.querySelectorAll<HTMLElement>('.hero-arc'));
      orbits = arcEls.map((el, i) => {
        const r  = el.getBoundingClientRect();
        const cx = r.left - box.left + r.width  / 2;
        const cy = r.top  - box.top  + r.height / 2;
        return {
          cx, cy,
          r:     r.width / 2,
          angle: (Math.PI * 2 * i) / arcEls.length,
          speed: speeds[i] ?? 0.003,
          size:  sizes[i]  ?? 5,
        };
      });
    };

    // Run setup after first paint so layout is ready
    requestAnimationFrame(() => {
      setup();
      window.addEventListener('resize', setup, { passive: true });

      const draw = () => {
        this._orbitRaf = requestAnimationFrame(draw);
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        orbits.forEach((p) => {
          p.angle += p.speed;
          const px  = p.cx + p.r * Math.cos(p.angle);
          const py  = p.cy + p.r * Math.sin(p.angle);

          const depth = (Math.sin(p.angle) + 1) / 2;
          const sr    = p.size * (0.6 + 0.4 * depth);
          const alpha = 0.55 + 0.45 * depth;

          // glow
          const glow = ctx.createRadialGradient(px, py, 0, px, py, sr * 5);
          glow.addColorStop(0, `rgba(138,79,255,${(0.2 * depth + 0.05).toFixed(2)})`);
          glow.addColorStop(1, 'rgba(138,79,255,0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(px, py, sr * 5, 0, Math.PI * 2); ctx.fill();

          // 3D sphere — perfect circle
          const sph = ctx.createRadialGradient(
            px - sr * 0.38, py - sr * 0.38, sr * 0.05, px, py, sr
          );
          sph.addColorStop(0,    `rgba(245,230,255,${alpha.toFixed(2)})`);
          sph.addColorStop(0.30, `rgba(196,155,255,${(alpha * 0.9).toFixed(2)})`);
          sph.addColorStop(0.65, `rgba(100,45,200,${(alpha * 0.85).toFixed(2)})`);
          sph.addColorStop(1,    `rgba(8,2,20,${alpha.toFixed(2)})`);
          ctx.save();
          ctx.shadowBlur  = sr * 3;
          ctx.shadowColor = 'rgba(196,155,255,0.5)';
          ctx.beginPath(); ctx.arc(px, py, sr, 0, Math.PI * 2);
          ctx.fillStyle = sph; ctx.fill();
          ctx.restore();

          // specular highlight — small bright dot top-left
          const specR = sr * 0.28;
          const spec  = ctx.createRadialGradient(
            px - sr * 0.32, py - sr * 0.32, 0,
            px - sr * 0.32, py - sr * 0.32, specR
          );
          spec.addColorStop(0, `rgba(255,255,255,${(alpha * 0.85).toFixed(2)})`);
          spec.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath(); ctx.arc(px - sr * 0.32, py - sr * 0.32, specR, 0, Math.PI * 2);
          ctx.fillStyle = spec; ctx.fill();
        });
      };
      draw();
    });
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
      r: Math.random() * 1.8 + 0.8,
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
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.deck-card'));
    const total = cards.length;
    if (!total) return;

    const scrollSpace = document.querySelector<HTMLElement>('.deck-scroll-space');
    // +2 phases: title enter + card-0 rise
    if (scrollSpace) scrollSpace.style.height = `${(total + 2) * 60 + 100}vh`;

    // Initial states
    gsap.set(cards[0], { yPercent: 100, scale: 1, opacity: 1, zIndex: total });
    cards.forEach((card, i) => {
      if (i === 0) return;
      gsap.set(card, { yPercent: 8, scale: 0.96, opacity: 0, zIndex: total - i });
    });
    gsap.set('.deck-title', { y: 70, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.deck-scroll-space',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // Phase 0 → title rises and pins center
    tl.to('.deck-title', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 0);

    // Phase 1 → card 0 rises from below, title falls behind it
    tl.to(cards[0],      { yPercent: 0,  duration: 1, ease: 'power2.out'  }, 1);
    tl.to('.deck-title', {
      x: 120, rotation: 6, opacity: 0,
      duration: 0.8, ease: 'power2.in',
    }, 0.7);

    // Phase 2+ → original stacked card swaps
    cards.forEach((_card, i) => {
      if (i === 0) return;
      tl.to(cards[i],     { yPercent: 0,  scale: 1,    opacity: 1, duration: 1, ease: 'power2.inOut' }, i + 1);
      tl.to(cards[i - 1], { yPercent: -8, scale: 0.96, opacity: 0, duration: 1, ease: 'power2.inOut' }, i + 1);
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
