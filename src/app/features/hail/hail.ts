import {
  Component, signal, AfterViewInit, OnDestroy,
  inject, PLATFORM_ID, ViewChild, ElementRef,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-hail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hail.html',
  styleUrl: './hail.scss',
})
export class HailProject implements AfterViewInit, OnDestroy {
  @ViewChild('starsCanvas', { static: true }) starsCanvas!: ElementRef<HTMLCanvasElement>;
  private platformId = inject(PLATFORM_ID);
  private _starRaf = 0;
  lightbox = signal<string | null>(null);

  readonly images = [
    '/حائل/معكم رالي حائل.png',
    '/حائل/مليونية الفروسية.png',
    '/حائل/تصميم كاس العال.png',
    '/حائل/الشيخ طلال.png',
    '/حائل/رمضان مبارك.png',
    '/حائل/جوائز ابار 2.png',
    '/حائل/عيد الاضحى.png',
    '/حائل/دعوة عامة الحفل الختامي.png',
    '/حائل/تهنئة العيد - بندر.png',
    '/حائل/راية التوحيد.png',
    '/حائل/3.5 مشاهدة.png',
    '/حائل/سيارة ابار.png',
    '/حائل/صرف جوائز.png',
    '/حائل/صيانة المضمار.png',
    '/حائل/اقتباس الامير.png',
    '/حائل/اوقات الحفل العاشر.png',
    '/حائل/مسابقة تصوير.png',
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initStars();
    requestAnimationFrame(() => {
      this.initEntrance();
      this.initGallery();
    });
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
    if (this._starRaf) cancelAnimationFrame(this._starRaf);
  }

  open(src: string)  { this.lightbox.set(src); }
  close()            { this.lightbox.set(null); }

  // ── Stars ─────────────────────────────────────────────────

  private initStars(): void {
    const canvas = this.starsCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
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
        if (s.glow) { ctx.shadowBlur = s.r * 7; ctx.shadowColor = `rgba(220,190,255,${a})`; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.glow ? '245,225,255' : '196,155,255'},${a})`;
        ctx.fill();
        if (s.glow) ctx.shadowBlur = 0;
      }
    };
    draw();
  }

  // ── Entrance ──────────────────────────────────────────────

  private initEntrance(): void {
    // Initial states
    gsap.set('.hail-back',  { opacity: 0, x: -24 });
    gsap.set('.hail-tag',   { opacity: 0, y: 14 });
    gsap.set('.hail-ln',    { yPercent: 110 });
    gsap.set('.hail-desc',  { opacity: 0, y: 22 });
    gsap.set('.hail-count', { opacity: 0, y: 10 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.to('.hail-back',  { opacity: 1, x: 0,       duration: 0.7          }, 0);
    tl.to('.hail-tag',   { opacity: 1, y: 0,        duration: 0.7          }, 0.2);
    tl.to('.hail-ln',    { yPercent: 0,             duration: 1.1          }, 0.35);
    tl.to('.hail-desc',  { opacity: 1, y: 0,        duration: 0.9          }, 0.65);
    tl.to('.hail-count', { opacity: 1, y: 0,        duration: 0.6          }, 0.85);

    // Subtle parallax on header as user scrolls
    gsap.to('.hail-header', {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hail-page',
        start: 'top top',
        end: '40% top',
        scrub: 1.2,
      },
    });
  }

  // ── Gallery ───────────────────────────────────────────────

  private initGallery(): void {
    gsap.set('.hail-item', { opacity: 0, y: 55, scale: 0.94 });

    ScrollTrigger.batch('.hail-item', {
      start: 'top 92%',
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.85,
        stagger: 0.07,
        ease: 'power3.out',
        overwrite: true,
      }),
      once: true,
    });
  }
}
