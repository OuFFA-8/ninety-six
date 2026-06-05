import {
  Component, signal, computed, AfterViewInit, OnDestroy,
  inject, PLATFORM_ID, ElementRef, ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Category = 'motion' | 'video';
interface VideoItem { id: string; title: string; category: Category; }

const VIDEOS: VideoItem[] = [
  // ── Motion ──────────────────────────────────────────────
  { id: '1-dHGGBddu6NQh-EgBdm6Vk6mYW4gV-bo', title: 'Bidksss',        category: 'motion' },
  { id: '1jhTt5nCZiN11ltnhmydPN7IdXh8cOK5T',  title: 'STC',            category: 'motion' },
  { id: '1BwwlScB6-kQz8TTqEUnztcauZwgbTgTt',  title: 'IELTS',          category: 'motion' },
  { id: '1U33OzUJWzTGoyXSI5qswxj4od4R6K0Zs',  title: 'Al-Shamil',      category: 'motion' },
  { id: '1sTLULKHx6FsAXr9Zzzwyr3oJhd8244qP',  title: 'Life Matters',   category: 'motion' },
  { id: '1vzxy086wJurwZqMNCMSmPNnmwFsOduY0',   title: 'Ouch',           category: 'motion' },
  { id: '1B_GsdINs2CDG0DTAtUAl6cPG08o1NaJv',  title: 'Tasheel',        category: 'motion' },
  { id: '1pYfWdX18f_W6Uw0-9C7E6xir0_QxVSB0',  title: 'Matjar',         category: 'motion' },
  { id: '1DkkP6sR2uNDHo9imYlFernBK-dZhfgoG',  title: 'Zakat Project',  category: 'motion' },
  { id: '1HLkAh4jgBW-NNtXhCZbwhY4F2Ii9XkId',  title: 'Waqf Tomouh',   category: 'motion' },
  // ── Video ───────────────────────────────────────────────
  { id: '13MfXEFwEipClaDVK26bwmo8A6VBmKEAr',  title: 'Do Good Vol. 1', category: 'video' },
  { id: '1d6XXhxuPd9g-pp8-bIxADwQJns7tuJ8t',  title: 'Do Good Vol. 2', category: 'video' },
  { id: '1_jAe7YdzuLEnLRAHwGpFzgen6wycGk4-',  title: 'First Day',      category: 'video' },
  { id: '19fiPdowslzKbU8Kaa7z8R0HsBHIkiTIr',  title: 'Soon',           category: 'video' },
  { id: '1tObr1RzgbJSPBj9q_Zyjpb5yFASOk1zt',  title: 'Saif Tamayoz',  category: 'video' },
  { id: '1qN6C4V3dWVICs193ZvXiS-z6hqSrH5-A',  title: 'Wars',           category: 'video' },
  { id: '1strJ7nNuroRg79ST983I2XWMfMOH74VH',   title: 'Orphan Day',     category: 'video' },
];

@Component({
  selector: 'app-motion-video',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './motion-video.html',
  styleUrl:    './motion-video.scss',
})
export class MotionVideoPage implements AfterViewInit, OnDestroy {
  @ViewChild('starsCanvas', { static: true }) starsCanvas!: ElementRef<HTMLCanvasElement>;
  private platformId = inject(PLATFORM_ID);
  private sanitizer  = inject(DomSanitizer);
  private _starRaf   = 0;

  filter   = signal<'all' | Category>('all');
  lightbox = signal<string | null>(null);

  filtered = computed(() =>
    this.filter() === 'all' ? VIDEOS : VIDEOS.filter(v => v.category === this.filter())
  );

  readonly motionCount = VIDEOS.filter(v => v.category === 'motion').length;
  readonly videoCount  = VIDEOS.filter(v => v.category === 'video').length;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initStars();
    this.initEntrance();
    setTimeout(() => { this.initGrid(); ScrollTrigger.refresh(); }, 120);
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
    if (this._starRaf) cancelAnimationFrame(this._starRaf);
  }

  setFilter(f: 'all' | Category): void {
    this.filter.set(f);
    setTimeout(() => { ScrollTrigger.refresh(); this.initGrid(); }, 60);
  }

  open(id: string):  void { this.lightbox.set(id); }
  close():           void { this.lightbox.set(null); }

  embedUrl(id: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://drive.google.com/file/d/${id}/preview`,
    );
  }

  thumbUrl(id: string): string {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
  }

  // ── Stars ─────────────────────────────────────────────────
  private initStars(): void {
    const canvas = this.starsCanvas.nativeElement;
    const ctx    = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 1.8 + 0.8, baseAlpha: Math.random() * 0.4 + 0.08,
      phase: Math.random() * Math.PI * 2, spd: Math.random() * 0.5 + 0.2,
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
    gsap.set('.mv-back',    { opacity: 0, x: -24 });
    gsap.set('.mv-tag',     { opacity: 0, y: 14 });
    gsap.set('.mv-ln',      { yPercent: 110 });
    gsap.set('.mv-desc',    { opacity: 0, y: 22 });
    gsap.set('.mv-meta',    { opacity: 0, y: 10 });
    gsap.set('.mv-filters', { opacity: 0, y: 16 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.mv-back',    { opacity: 1, x: 0, duration: 0.7 }, 0);
    tl.to('.mv-tag',     { opacity: 1, y: 0, duration: 0.7 }, 0.2);
    tl.to('.mv-ln',      { yPercent: 0,       duration: 1.1 }, 0.35);
    tl.to('.mv-desc',    { opacity: 1, y: 0, duration: 0.9 }, 0.65);
    tl.to('.mv-meta',    { opacity: 1, y: 0, duration: 0.6 }, 0.85);
    tl.to('.mv-filters', { opacity: 1, y: 0, duration: 0.6 }, 0.95);

    gsap.to('.mv-header', {
      yPercent: -18, ease: 'none',
      scrollTrigger: {
        trigger: '.mv-page', start: 'top top', end: '40% top', scrub: 1.2,
      },
    });
  }

  // ── Grid animation ────────────────────────────────────────
  private initGrid(): void {
    gsap.set('.mv-card', { opacity: 0, y: 55, scale: 0.94 });
    ScrollTrigger.batch('.mv-card', {
      start: 'top 92%',
      onEnter: batch => gsap.to(batch, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.8, stagger: 0.07, ease: 'power3.out', overwrite: true,
      }),
      onEnterBack: batch => gsap.to(batch, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.6, stagger: 0.05, ease: 'power3.out', overwrite: true,
      }),
    });
  }
}
