import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  NgZone,
  inject,
  PLATFORM_ID,
  effect,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Intro } from '../../core/intro/intro';
import { SelectionService, Work } from '../../core/service/selection-service';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [CommonModule, RouterLink, Intro],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesPage implements AfterViewInit, OnDestroy {
  @ViewChild('introWrap',  { static: true }) introWrap!:  ElementRef<HTMLElement>;
  @ViewChild('starCanvas', { static: true }) starCanvas!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone     = inject(NgZone);
  protected selection = inject(SelectionService);

  protected introCompleted = false;
  protected activeIdx: number | null = null;

  private _starRaf   = 0;
  private _targetBgR = 0;
  private _targetBgG = 0;
  private _targetBgB = 0;
  // Selection color — restored when a row is closed
  private _selBgR    = 0;
  private _selBgG    = 0;
  private _selBgB    = 0;

  constructor() {
    effect(() => {
      const work = this.selection.selected();
      if (work) {
        const [r, g, b] = this.hexToRgb(work.color);
        this._selBgR = this._targetBgR = r * 0.32 | 0;
        this._selBgG = this._targetBgG = g * 0.32 | 0;
        this._selBgB = this._targetBgB = b * 0.32 | 0;
      }
    });
  }

  services = [
    {
      tag: '01', icon: '🎯',
      title: 'Brand Strategy',
      desc: 'Powerful brand identities that resonate with your audience and dominate the market.',
      works: [
        { title: 'Repositioning Noon',  color: '#8a4fff' },
        { title: 'Nike MENA Launch',    color: '#6a3bbf' },
        { title: 'Adidas Gulf 2024',    color: '#9d6fff' },
      ],
    },
    {
      tag: '02', icon: '✦',
      title: 'Visual Identity',
      desc: 'Logos, color systems, typography — cohesive visual languages that tell your story.',
      works: [
        { title: 'Careem Rebrand',  color: '#00d4a8' },
        { title: 'Noon Identity',   color: '#00b891' },
        { title: 'Talabat VI',      color: '#5fe3c3' },
      ],
    },
    {
      tag: '03', icon: '▶',
      title: 'Motion & Video',
      desc: 'Cinematic video production and motion graphics that captivate and convert.',
      works: [
        { title: 'Pepsi Ramadan',  color: '#ff4757' },
        { title: 'Product Reel',   color: '#ff6b76' },
        { title: 'Brand Film',     color: '#c73342' },
      ],
    },
    {
      tag: '04', icon: '◈',
      title: 'Web Design',
      desc: 'Pixel-perfect websites with immersive experiences that drive real results.',
      works: [
        { title: 'Talabat E-commerce', color: '#ff8c42' },
        { title: 'SaaS Landing',       color: '#ffaa70' },
        { title: 'Portfolio Site',     color: '#cc6a28' },
      ],
    },
    {
      tag: '05', icon: '◎',
      title: 'Print Design',
      desc: 'From magazines to OOH — bold print work that commands attention everywhere.',
      works: [
        { title: 'Adidas Magazine',  color: '#4a9eff' },
        { title: 'OOH Campaign',     color: '#78b8ff' },
        { title: 'Annual Report',    color: '#2a7bcc' },
      ],
    },
    {
      tag: '06', icon: '⬡',
      title: 'Digital Marketing',
      desc: 'Data-driven campaigns that grow your reach and maximize your ROI.',
      works: [
        { title: 'Samsung Launch', color: '#e8b923' },
        { title: 'Meta Ads',       color: '#f0d271' },
        { title: 'SEO Campaign',   color: '#b8901a' },
      ],
    },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    this.ngZone.runOutsideAngular(() => this.initStars());
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
    if (this._starRaf) cancelAnimationFrame(this._starRaf);
    this.unlockScroll();
  }

  protected toggle(i: number): void {
    if (this.activeIdx === i) {
      this.activeIdx = null;
      this._targetBgR = this._selBgR;
      this._targetBgG = this._selBgG;
      this._targetBgB = this._selBgB;
    } else {
      this.activeIdx = i;
      const color = this.services[i].works[0].color;
      const [r, g, b] = this.hexToRgb(color);
      this._targetBgR = r * 0.32 | 0;
      this._targetBgG = g * 0.32 | 0;
      this._targetBgB = b * 0.32 | 0;
    }
  }

  onIntroCompleted(_work: Work): void {
    this.ngZone.run(() => { this.introCompleted = true; });

    setTimeout(() => {
      gsap.set('.svc-hero__inner', { autoAlpha: 0, y: 40 });
      gsap.set('.svc-row',         { autoAlpha: 0, y: 20 });
      gsap.set('.svc-cta__inner',  { autoAlpha: 0, y: 40 });

      const wrap = this.introWrap.nativeElement;
      gsap.to(wrap, {
        autoAlpha: 0,
        duration: 1.0,
        ease: 'power2.inOut',
        onComplete: () => {
          this.unlockScroll();
          window.scrollTo({ top: 0, behavior: 'auto' });
          ScrollTrigger.refresh();
          this.initAnimations();
        },
      });
    });
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  private hexToRgb(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  private initStars(): void {
    const canvas = this.starCanvas.nativeElement;
    const ctx    = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    interface S { x: number; y: number; r: number; baseAlpha: number; phase: number; spd: number; }

    const stars: S[] = Array.from({ length: 420 }, () => ({
      x:         Math.random() * window.innerWidth,
      y:         Math.random() * window.innerHeight,
      r:         Math.random() * 0.85 + 0.25,
      baseAlpha: Math.random() * 0.45 + 0.1,
      phase:     Math.random() * Math.PI * 2,
      spd:       Math.random() * 0.6 + 0.3,
    }));

    // Start canvas at the already-selected color (if any)
    let bgR = this._targetBgR;
    let bgG = this._targetBgG;
    let bgB = this._targetBgB;
    let t = 0;

    const draw = () => {
      this._starRaf = requestAnimationFrame(draw);
      t += 0.016;

      bgR += (this._targetBgR - bgR) * 0.025;
      bgG += (this._targetBgG - bgG) * 0.025;
      bgB += (this._targetBgB - bgB) * 0.025;

      ctx.fillStyle = `rgb(${bgR | 0},${bgG | 0},${bgB | 0})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        const alpha = s.baseAlpha * (0.55 + 0.45 * Math.sin(t * s.spd + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
    };
    draw();
  }

  private initAnimations(): void {
    gsap.to('.svc-hero__inner', {
      autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out',
    });

    gsap.utils.toArray<HTMLElement>('.svc-row').forEach((row, i) => {
      gsap.to(row, {
        scrollTrigger: { trigger: row, start: 'top 88%', once: true },
        autoAlpha: 1, y: 0, duration: 0.6, delay: i * 0.04, ease: 'power2.out',
      });
    });

    gsap.to('.svc-cta__inner', {
      scrollTrigger: { trigger: '.svc-cta', start: 'top 80%' },
      autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out',
    });
  }
}
