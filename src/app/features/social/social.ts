import {
  Component, signal, OnInit, AfterViewInit, OnDestroy,
  inject, PLATFORM_ID, ViewChild, ElementRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── helpers ────────────────────────────────────────────────
const enc = (s: string) => s.replace(/ /g, '%20');
const sm  = (folder: string, file: string) =>
  `/SOCIAL%20MEDIA/${enc(folder)}/${enc(file)}`;

type Orient = 'port' | 'sq' | 'land';
interface Img { src: string; orient: Orient; }
interface ProjectCfg { title: string; tag: string; desc: string; images: Img[]; }

const p = (f: string, n: string): Img => ({ src: sm(f, n), orient: 'port' });
const s = (f: string, n: string): Img => ({ src: sm(f, n), orient: 'sq'   });
const l = (f: string, n: string): Img => ({ src: sm(f, n), orient: 'land' });

// ── project data ───────────────────────────────────────────
const PROJECTS: Record<string, ProjectCfg> = {

  'cash-expo': {
    title: 'Cash Expo .', tag: 'Social Media · 2024',
    desc: 'Campaign coverage and digital content for Cash Expo.',
    images: [
      p('Cash Expo', 'Copy of  -3- دعوةة.png'),
      p('Cash Expo', 'Copy of  -٢- 4 خطوات.png'),
      p('Cash Expo', 'Copy of -١- اكسبو اليوم الوطني copy.png'),
      s('Cash Expo', 'Copy of 5000-5000.png'),
      s('Cash Expo', 'Copy of 5000-5000.png-٢-.png'),
      l('Cash Expo', 'Copy of Artboard 1 copy.png'),
      p('Cash Expo', 'Copy of Artboard 1.png'),
      p('Cash Expo', 'Copy of Artboard 11.png'),
      p('Cash Expo', 'Copy of Artboard 12 copy 2.png'),
      p('Cash Expo', 'Copy of Artboard 12 copy.jpg'),
      p('Cash Expo', 'Copy of Artboard 12.png'),
      p('Cash Expo', 'Copy of Artboard 4 (1).png'),
      p('Cash Expo', 'Copy of Artboard 8 (1).png'),
      p('Cash Expo', 'Copy of instgram.png'),
      l('Cash Expo', 'Copy of linked.png'),
      l('Cash Expo', 'Copy of x copy.png'),
      l('Cash Expo', 'Copy of x.png'),
      p('Cash Expo', 'Copy of اكسبو اليوم الوطني.png'),
      p('Cash Expo', 'Copy of انضم كاش اكسبو copy (1).png'),
      p('Cash Expo', 'Copy of انضم كاش اكسبو copy 2 (1).png'),
      p('Cash Expo', 'Copy of انضم كاش اكسبو copy 2.png'),
      p('Cash Expo', 'Copy of انضم كاش اكسبو copy.png'),
      p('Cash Expo', 'Copy of انضم كاش اكسبو.png'),
      p('Cash Expo', 'Copy of عد تنازلي_6 ساعات.png'),
      p('Cash Expo', 'Copy of كااش اكسبو.png'),
      p('Cash Expo', 'Copy of ١.png'),
      p('Cash Expo', 'Copy of ١٠٢.png'),
      p('Cash Expo', 'Copy of ٢.png'),
      p('Cash Expo', 'Copy of ٣-4 خطوات copy 2.png'),
      p('Cash Expo', 'Copy of ٣.png'),
    ],
  },

  dunkin: {
    title: 'Dunkin .',  tag: 'Social Media · 2024',
    desc: 'Social media content for Dunkin.',
    images: [
      p('DUNKIN', 'Artboard 1 copy 2-100.jpg'),
      p('DUNKIN', 'Artboard 1 copy 3-100.jpg'),
      p('DUNKIN', 'Artboard 1 copy 4-100.jpg'),
      p('DUNKIN', 'Artboard 1 copy-100.jpg'),
      p('DUNKIN', 'Artboard 1-100.jpg'),
      l('DUNKIN', 'Artboard 2-100.jpg'),
    ],
  },

  'saudi-restaurant': {
    title: 'Saudi Restaurant .', tag: 'Social Media · 2024',
    desc: 'Social media designs for Saudi Restaurant.',
    images: [
      p('المطعم السعودي', '1.png'),
      p('المطعم السعودي', '2.png'),
      p('المطعم السعودي', '3.png'),
      p('المطعم السعودي', '4.png'),
      p('المطعم السعودي', '5.png'),
      p('المطعم السعودي', '6.png'),
      p('المطعم السعودي', '7.png'),
      p('المطعم السعودي', 'تكة لحم_.png'),
      p('المطعم السعودي', 'جبنا لك الشتا-1.png'),
      p('المطعم السعودي', 'جبنا لك الشتا.png'),
      p('المطعم السعودي', 'خصم 25.png'),
      p('المطعم السعودي', 'ستوري عرض اليوم الوطني.png'),
    ],
  },

  turbs: {
    title: 'Turbs .', tag: 'Social Media · 2024',
    desc: 'Social media content for Turbs.',
    images: [
      p('تربس', 'Artboard 1 copy 2-100.jpg'),
      p('تربس', 'Artboard 1 copy 3-100.jpg'),
      p('تربس', 'Artboard 1 copy 4-100.jpg'),
      p('تربس', 'Artboard 1 copy 5-100.jpg'),
      p('تربس', 'Artboard 1 copy 6-100.jpg'),
      p('تربس', 'Artboard 1 copy-100.jpg'),
      p('تربس', 'Artboard 1-100.jpg'),
    ],
  },
};

// ── component ──────────────────────────────────────────────
@Component({
  selector: 'app-social',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './social.html',
  styleUrl: './social.scss',
})
export class SocialProject implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('starsCanvas', { static: true }) starsCanvas!: ElementRef<HTMLCanvasElement>;
  private platformId = inject(PLATFORM_ID);
  private route      = inject(ActivatedRoute);
  private _starRaf   = 0;

  lightbox = signal<string | null>(null);
  project: ProjectCfg | null = null;
  images: Img[] = [];

  ngOnInit(): void {
    const slug    = this.route.snapshot.paramMap.get('slug') ?? '';
    this.project  = PROJECTS[slug] ?? null;
    if (this.project) this.images = this.project.images;
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initStars();
    requestAnimationFrame(() => this.initGallery());
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
    if (this._starRaf) cancelAnimationFrame(this._starRaf);
  }

  open(src: string) { this.lightbox.set(src); }
  close()           { this.lightbox.set(null); }

  // ── stars ─────────────────────────────────────────────────
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

  // ── gallery ───────────────────────────────────────────────
  private initGallery(): void {
    document.querySelectorAll<HTMLElement>('.social-item').forEach(item => {
      gsap.fromTo(item,
        { opacity: 0, y: 70, scale: 0.9 },
        {
          opacity: 1, y: 0, scale: 1, ease: 'power2.out',
          scrollTrigger: { trigger: item, start: 'top 95%', end: 'top 40%', scrub: 1.2 },
        },
      );
    });
  }
}
