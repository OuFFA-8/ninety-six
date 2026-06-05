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
const sm = (folder: string, file: string) =>
  `/SOCIAL%20MEDIA/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;

interface Img { src: string; span?: number; }
interface ProjectCfg { title: string; tag: string; desc: string; images: Img[]; layout?: string; fullWidth?: number[]; }

const i = (f: string, n: string, span?: number): Img => ({ src: sm(f, n), ...(span ? { span } : {}) });

// ── project data ───────────────────────────────────────────
const PROJECTS: Record<string, ProjectCfg> = {

  hail: {
    title: 'Rally Hail .', tag: 'Social Media · Motion · 2024',
    desc: 'Social media designs, event coverage, and digital content for Rally Hail — celebrations, competitions, and brand moments.',
    images: [
      i('حائل', 'معكم رالي حائل.png'),
      i('حائل', 'مليونية الفروسية.png'),
      i('حائل', 'تصميم كاس العال.png'),
      i('حائل', 'الشيخ طلال.png'),
      i('حائل', 'رمضان مبارك.png'),
      i('حائل', 'جوائز ابار 2.png'),
      i('حائل', 'عيد الاضحى.png'),
      i('حائل', 'دعوة عامة الحفل الختامي.png'),
      i('حائل', 'تهنئة العيد - بندر.png'),
      i('حائل', 'راية التوحيد.png'),
      i('حائل', '3.5 مشاهدة.png'),
      i('حائل', 'سيارة ابار.png'),
      i('حائل', 'صرف جوائز.png'),
      i('حائل', 'صيانة المضمار.png'),
      i('حائل', 'اقتباس الامير.png'),
      i('حائل', 'اوقات الحفل العاشر.png'),
      i('حائل', 'مسابقة تصوير.png'),
    ],
  },

  'cash-expo': {
    title: 'Cash Expo .', tag: 'Social Media · 2024',
    desc: 'Campaign coverage and digital content for Cash Expo.',
    layout: 'cash-expo',
    // idx 6 = Artboard 1 copy (16:9, 1.78) | idx 27-29 = LinkedIn/X banners (3.9–5.9)
    fullWidth: [6, 27, 28, 29],
    images: [
      i('Cash Expo', 'Copy of  -3- دعوةة.png'),
      i('Cash Expo', 'Copy of  -٢- 4 خطوات.png'),
      i('Cash Expo', 'Copy of -١- اكسبو اليوم الوطني copy.png'),
      i('Cash Expo', 'Copy of 5000-5000.png'),
      i('Cash Expo', 'Copy of 5000-5000.png-٢-.png'),
      i('Cash Expo', 'Copy of Artboard 1.png'),
      i('Cash Expo', 'Copy of Artboard 1 copy.png'),
      i('Cash Expo', 'Copy of Artboard 11.png'),
      i('Cash Expo', 'Copy of Artboard 12 copy 2.png'),
      i('Cash Expo', 'Copy of Artboard 12 copy.jpg'),
      i('Cash Expo', 'Copy of Artboard 12.png'),
      i('Cash Expo', 'Copy of Artboard 4 (1).png'),
      i('Cash Expo', 'Copy of Artboard 8 (1).png'),
      i('Cash Expo', 'Copy of instgram.png'),
      i('Cash Expo', 'Copy of اكسبو اليوم الوطني.png'),
      i('Cash Expo', 'Copy of انضم كاش اكسبو copy (1).png'),
      i('Cash Expo', 'Copy of انضم كاش اكسبو copy 2 (1).png'),
      i('Cash Expo', 'Copy of انضم كاش اكسبو copy 2.png'),
      i('Cash Expo', 'Copy of انضم كاش اكسبو copy.png'),
      i('Cash Expo', 'Copy of انضم كاش اكسبو.png'),
      i('Cash Expo', 'Copy of عد تنازلي_6 ساعات.png'),
      i('Cash Expo', 'Copy of كااش اكسبو.png'),
      i('Cash Expo', 'Copy of ١.png'),
      i('Cash Expo', 'Copy of ١٠٢.png'),
      i('Cash Expo', 'Copy of ٢.png'),
      i('Cash Expo', 'Copy of ٣-4 خطوات copy 2.png'),
      i('Cash Expo', 'Copy of ٣.png'),
      i('Cash Expo', 'Copy of linked.png'),
      i('Cash Expo', 'Copy of x.png'),
      i('Cash Expo', 'Copy of x copy.png'),
    ],
  },

  dunkin: {
    title: 'Dunkin .',  tag: 'Social Media · 2024',
    desc: 'Social media content for Dunkin.',
    layout: 'dunkin',
    // idx 5 = Artboard 2 (ultra-wide banner, ratio 6.9)
    fullWidth: [5],
    images: [
      i('DUNKIN', 'Artboard 1 copy 2-100.jpg'),
      i('DUNKIN', 'Artboard 1 copy 3-100.jpg'),
      i('DUNKIN', 'Artboard 1 copy 4-100.jpg'),
      i('DUNKIN', 'Artboard 1 copy-100.jpg'),
      i('DUNKIN', 'Artboard 1-100.jpg'),
      i('DUNKIN', 'Artboard 2-100.jpg'),
    ],
  },

  'saudi-restaurant': {
    title: 'Saudi Restaurant .', tag: 'Social Media · 2024',
    desc: 'Social media designs for Saudi Restaurant.',
    images: [
      i('المطعم السعودي', '1.png'),
      i('المطعم السعودي', '2.png'),
      i('المطعم السعودي', '3.png'),
      i('المطعم السعودي', '4.png'),
      i('المطعم السعودي', '5.png'),
      i('المطعم السعودي', '6.png'),
      i('المطعم السعودي', '7.png'),
      i('المطعم السعودي', 'تكة لحم_.png'),
      i('المطعم السعودي', 'جبنا لك الشتا-1.png'),
      i('المطعم السعودي', 'جبنا لك الشتا.png'),
      i('المطعم السعودي', 'خصم 25.png'),
      i('المطعم السعودي', 'ستوري عرض اليوم الوطني.png'),
    ],
  },

  turbs: {
    title: 'Turbs .', tag: 'Social Media · 2024',
    desc: 'Social media content for Turbs.',
    images: [
      i('تربس', 'Artboard 1 copy 2-100.jpg'),
      i('تربس', 'Artboard 1 copy 3-100.jpg'),
      i('تربس', 'Artboard 1 copy 4-100.jpg'),
      i('تربس', 'Artboard 1 copy 5-100.jpg'),
      i('تربس', 'Artboard 1 copy 6-100.jpg'),
      i('تربس', 'Artboard 1 copy-100.jpg'),
      i('تربس', 'Artboard 1-100.jpg'),
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
  layout = '';

  ngOnInit(): void {
    const slug   = this.route.snapshot.paramMap.get('slug') ?? '';
    this.project = PROJECTS[slug] ?? null;
    if (this.project) {
      this.images = this.project.images;
      this.layout = this.project.layout ?? '';
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initStars();
    this.initEntrance();
    setTimeout(() => {
      this.initGallery();
      ScrollTrigger.refresh();
    }, 120);
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
    if (this._starRaf) cancelAnimationFrame(this._starRaf);
  }

  open(src: string)  { this.lightbox.set(src); }
  close()            { this.lightbox.set(null); }

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

  // ── entrance ──────────────────────────────────────────────
  private initEntrance(): void {
    gsap.set('.social-back',  { opacity: 0, x: -24 });
    gsap.set('.social-tag',   { opacity: 0, y: 14 });
    gsap.set('.social-ln',    { yPercent: 110 });
    gsap.set('.social-desc',  { opacity: 0, y: 22 });
    gsap.set('.social-count', { opacity: 0, y: 10 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.social-back',  { opacity: 1, x: 0,    duration: 0.7 }, 0);
    tl.to('.social-tag',   { opacity: 1, y: 0,    duration: 0.7 }, 0.2);
    tl.to('.social-ln',    { yPercent: 0,          duration: 1.1 }, 0.35);
    tl.to('.social-desc',  { opacity: 1, y: 0,    duration: 0.9 }, 0.65);
    tl.to('.social-count', { opacity: 1, y: 0,    duration: 0.6 }, 0.85);

    gsap.to('.social-header', {
      yPercent: -18, ease: 'none',
      scrollTrigger: {
        trigger: '.social-page', start: 'top top', end: '40% top', scrub: 1.2,
      },
    });
  }

  // ── gallery ───────────────────────────────────────────────
  private initGallery(): void {
    gsap.set('.social-item', { opacity: 0, y: 55, scale: 0.94 });

    ScrollTrigger.batch('.social-item', {
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
