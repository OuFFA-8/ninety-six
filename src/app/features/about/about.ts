import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  NgZone,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutPage implements AfterViewInit, OnDestroy {
  @ViewChild('starCanvas', { static: true }) starCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursor') cursorEl!: ElementRef<HTMLElement>;
  @ViewChild('cursorDot') cursorDotEl!: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private _starRaf = 0;

  readonly disciplines = [
    { num: '01', name: 'Brand Identity', color: '#8a4fff' },
    { num: '02', name: 'Social Media', color: '#00d4a8' },
    { num: '03', name: 'Motion & Video', color: '#ff4757' },
    { num: '04', name: 'Web Design', color: '#ff8c42' },
    { num: '05', name: 'Print Design', color: '#4a9eff' },
    { num: '06', name: 'Digital Marketing', color: '#e8b923' },
  ];

  readonly stats = [
    { num: '20+', label: 'Projects' },
    { num: '15+', label: 'Clients' },
    { num: '6',   label: 'Disciplines' },
    { num: '01',  label: 'Studio' },
  ];

  readonly process = [
    {
      num: '01',
      title: 'Brief',
      desc: 'We listen, define the target, and align on what success looks like before a single pixel moves.',
    },
    {
      num: '02',
      title: 'Strategy',
      desc: 'We map the route — concept, positioning, tone — so every decision is grounded in intent.',
    },
    {
      num: '03',
      title: 'Craft',
      desc: 'Design, motion, code. Precision at every layer. Nothing ships until it earns its place.',
    },
    {
      num: '04',
      title: 'Deliver',
      desc: 'On time, on target. Then we measure, refine, and make it last.',
    },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.style.cursor = 'none';

    this.ngZone.runOutsideAngular(() => this.initStars());
    this.initCursor();

    setTimeout(() => {
      this.initAnimations();
      ScrollTrigger.refresh();
    }, 80);
  }

  ngOnDestroy(): void {
    document.body.style.cursor = '';
    ScrollTrigger.getAll().forEach((t) => t.kill());
    if (this._starRaf) cancelAnimationFrame(this._starRaf);
  }

  private initStars(): void {
    const canvas = this.starCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.8 + 0.8,
      baseAlpha: Math.random() * 0.4 + 0.08,
      phase: Math.random() * Math.PI * 2,
      spd: Math.random() * 0.5 + 0.2,
      glow: Math.random() > 0.65,
    }));

    let t = 0;
    const draw = () => {
      this._starRaf = requestAnimationFrame(draw);
      t += 0.016;
      ctx.fillStyle = '#06030c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const a = s.baseAlpha * (0.5 + 0.5 * Math.sin(t * s.spd + s.phase));
        if (s.glow) {
          ctx.shadowBlur = s.r * 7;
          ctx.shadowColor = `rgba(220,190,255,${a})`;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.glow ? '245,225,255' : '196,155,255'},${a})`;
        ctx.fill();
        if (s.glow) ctx.shadowBlur = 0;
      }
    };
    draw();
  }

  private initCursor(): void {
    const cursor = this.cursorEl?.nativeElement;
    const dot = this.cursorDotEl?.nativeElement;
    if (!cursor) return;

    const m = { x: innerWidth / 2, y: innerHeight / 2 };
    const p = { x: m.x, y: m.y };
    const d = { x: m.x, y: m.y };
    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    window.addEventListener('mousemove', (e) => {
      m.x = e.clientX;
      m.y = e.clientY;
    });

    gsap.ticker.add(() => {
      p.x = lerp(p.x, m.x, 0.15);
      p.y = lerp(p.y, m.y, 0.15);
      d.x = lerp(d.x, m.x, 0.55);
      d.y = lerp(d.y, m.y, 0.55);
      gsap.set(cursor, { x: p.x, y: p.y });
      if (dot) gsap.set(dot, { x: d.x, y: d.y });
    });

    document.querySelectorAll<HTMLElement>('a, button, .ab-disc__row').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(cursor, { scale: 1.6, borderColor: '#fff', duration: 0.3 });
        if (dot) gsap.to(dot, { scale: 0, duration: 0.2 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(cursor, { scale: 1, borderColor: '#c49bff', duration: 0.3 });
        if (dot) gsap.to(dot, { scale: 1, duration: 0.2 });
      });
    });
  }

  private initAnimations(): void {
    // Hero entrance
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.ab-hero__eyebrow', { opacity: 0, y: 20, duration: 0.8 }, 0.1);
    tl.from('.ab-hero__ln', { yPercent: 115, duration: 1.2, stagger: 0.13 }, 0.25);
    tl.from('.ab-hero__desc', { opacity: 0, y: 30, duration: 0.9 }, 0.75);
    tl.from('.ab-hero__scroll', { opacity: 0, duration: 0.7 }, 1.1);

    gsap.fromTo(
      '.scroll-dot',
      { y: -8 },
      { y: 42, duration: 1.6, repeat: -1, ease: 'power1.inOut', repeatDelay: 0.2 },
    );

    // Manifesto
    gsap.from('.ab-mf__line', {
      yPercent: 110,
      duration: 1.2,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.ab-manifesto', start: 'top 78%' },
    });

    // Story left text
    gsap.from('.ab-story__eyebrow, .ab-story__heading, .ab-story__body, .ab-story__location', {
      opacity: 0,
      y: 36,
      duration: 0.9,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.ab-story', start: 'top 75%' },
    });

    // Stats
    gsap.from('.ab-stat', {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.ab-stats', start: 'top 80%' },
    });

    // Disciplines
    gsap.from('.ab-disc__header', {
      opacity: 0,
      y: 24,
      duration: 0.8,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.ab-disc', start: 'top 78%' },
    });

    gsap.from('.ab-disc__row', {
      opacity: 0,
      x: -28,
      duration: 0.7,
      stagger: 0.07,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.ab-disc', start: 'top 72%' },
    });

    // Process
    gsap.from('.ab-process__header', {
      opacity: 0,
      y: 24,
      duration: 0.8,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.ab-process', start: 'top 78%' },
    });

    gsap.from('.ab-step', {
      opacity: 0,
      y: 50,
      duration: 0.9,
      stagger: 0.12,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.ab-process', start: 'top 72%' },
    });

    // CTA
    gsap.from('.ab-cta__inner > *', {
      opacity: 0,
      y: 36,
      duration: 0.9,
      stagger: 0.12,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.ab-cta', start: 'top 82%' },
    });
  }
}
