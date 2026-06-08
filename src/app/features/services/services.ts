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
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, Flip, CustomEase);

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesPage implements AfterViewInit, OnDestroy {
  @ViewChild('starCanvas', { static: true }) starCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursor')    cursorEl!: ElementRef<HTMLElement>;
  @ViewChild('cursorDot') cursorDotEl!: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone     = inject(NgZone);

  private _starRaf = 0;

  activeFilter = 'all';
  filterCount  = '05';
  allHasMore   = true;
  private _allMax = 5;
  scNum        = '01';
  scProgress   = 0;
  caseCurrent  = '01';
  caseLabel    = 'Logo Construction';

  readonly caseLabels = [
    'Logo Construction', 'Colour Palette', 'Typography',
    'Stationery', 'Digital / App',
  ];

  readonly stripItems = [
    'Brand Identity', 'Campaigns', 'Motion', 'Web Design',
    'Social', 'Art Direction', 'Strategy', '3D & Render',
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.style.cursor = 'none';

    CustomEase.create('crisp',  '0.16, 1, 0.3, 1');
    CustomEase.create('smooth', '0.7, 0, 0.2, 1');

    this.ngZone.runOutsideAngular(() => this.initStars());
    this.initCursor();
    this.buildStrip();

    setTimeout(() => {
      this.initIntro();
      this.initWorkGrid();
      this.initShowcase();
      this.initCase();
      this.initCTA();
      this.initNavHide();
      ScrollTrigger.refresh();
    }, 80);
  }

  ngOnDestroy(): void {
    document.body.style.cursor = '';
    ScrollTrigger.getAll().forEach(t => t.kill());
    if (this._starRaf) cancelAnimationFrame(this._starRaf);
  }

  // ── Filter ──────────────────────────────────────────────

  setFilter(cat: string): void {
    const items = Array.from(document.querySelectorAll<HTMLElement>('.work-item'));
    const state = Flip.getState(items);

    this.activeFilter = cat;
    if (cat === 'all') this._allMax = 5;

    setTimeout(() => {
      items.forEach((el, i) => {
        el.style.display = cat === 'all'
          ? (i < this._allMax ? '' : 'none')
          : (el.dataset['cat'] === cat ? '' : 'none');
      });

      const visibleItems = items.filter(el => el.style.display !== 'none');
      this.filterCount = String(visibleItems.length).padStart(2, '0');
      this.allHasMore   = cat === 'all' && items.length > this._allMax;

      Flip.from(state, {
        duration: 0.6,
        ease: 'smooth',
        scale: true,
        onEnter: (els: Element[]) =>
          gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4, delay: 0.08 }),
        onLeave: (els: Element[]) =>
          gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.28 }),
        onComplete: () => {
          gsap.to(visibleItems, { opacity: 1, y: 0, duration: 0.35, overwrite: true });
        },
      });

      const sec = document.querySelector<HTMLElement>('.work-grid-sec');
      if (sec) window.scrollTo({ top: sec.offsetTop, behavior: 'smooth' });
      ScrollTrigger.refresh();
    });
  }

  loadMore(): void {
    const items = Array.from(document.querySelectorAll<HTMLElement>('.work-item'));
    const state = Flip.getState(items);

    this._allMax   = items.length;
    this.allHasMore = false;
    items.forEach(el => { el.style.display = ''; });
    this.filterCount = String(items.length).padStart(2, '0');

    Flip.from(state, {
      duration: 0.6,
      ease: 'smooth',
      scale: true,
      onEnter: (els: Element[]) =>
        gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4, delay: 0.08 }),
      onComplete: () => {
        gsap.to(items, { opacity: 1, y: 0, duration: 0.35, overwrite: true });
      },
    });
    ScrollTrigger.refresh();
  }

  // ── Stars ───────────────────────────────────────────────

  private initStars(): void {
    const canvas = this.starCanvas.nativeElement;
    const ctx    = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const stars = Array.from({ length: 80 }, () => ({
      x:         Math.random() * window.innerWidth,
      y:         Math.random() * window.innerHeight,
      r:         Math.random() * 1.8 + 0.8,
      baseAlpha: Math.random() * 0.4 + 0.08,
      phase:     Math.random() * Math.PI * 2,
      spd:       Math.random() * 0.5 + 0.2,
      glow:      Math.random() > 0.65,
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

  // ── Cursor ──────────────────────────────────────────────

  private initCursor(): void {
    const cursor = this.cursorEl?.nativeElement;
    const dot    = this.cursorDotEl?.nativeElement;
    if (!cursor) return;

    const m = { x: innerWidth / 2, y: innerHeight / 2 };
    const p = { x: m.x, y: m.y };
    const d = { x: m.x, y: m.y };
    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    window.addEventListener('mousemove', e => { m.x = e.clientX; m.y = e.clientY; });

    gsap.ticker.add(() => {
      p.x = lerp(p.x, m.x, 0.15); p.y = lerp(p.y, m.y, 0.15);
      d.x = lerp(d.x, m.x, 0.55); d.y = lerp(d.y, m.y, 0.55);
      gsap.set(cursor, { x: p.x, y: p.y });
      if (dot) gsap.set(dot, { x: d.x, y: d.y });
    });

    document.querySelectorAll<HTMLElement>('a,button,.work-item,.showcase__card').forEach(el => {
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

  // ── Intro entrance ──────────────────────────────────────

  private initIntro(): void {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.intro__arc',        { scale: 1.4, opacity: 0, duration: 2, stagger: 0.1 }, 0);
    tl.from('.intro__eyebrow',    { opacity: 0, y: 20, duration: 0.8 }, 0.3);
    tl.from('.intro__title-inner',{ yPercent: 110, duration: 1.2, stagger: 0.14 }, 0.4);
    tl.from('.intro__meta',       { opacity: 0, y: 30, duration: 0.9 }, 1.0);
    tl.from('.intro__scroll',     { opacity: 0, duration: 0.8 }, 1.2);

    gsap.fromTo('.scroll-dot',
      { y: -8 },
      { y: 42, duration: 1.6, repeat: -1, ease: 'power1.inOut', repeatDelay: 0.2 }
    );

    gsap.to('.intro__title', {
      yPercent: -15, opacity: 0.35, ease: 'none',
      scrollTrigger: { trigger: '.svc-intro', start: 'top top', end: 'bottom top', scrub: 1 },
    });
  }

  // ── Work grid ───────────────────────────────────────────

  private initWorkGrid(): void {
    const allItems = Array.from(document.querySelectorAll<HTMLElement>('.work-item'));
    allItems.forEach((el, i) => { if (i >= this._allMax) el.style.display = 'none'; });
    this.allHasMore = allItems.length > this._allMax;

    gsap.set('.work-item', { opacity: 0, y: 80 });

    ScrollTrigger.batch('.work-item', {
      start: 'top 88%',
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out', overwrite: true,
      }),
      once: true,
    });

    document.querySelectorAll<HTMLElement>('.work-item').forEach(item => {
      const deco = item.querySelector<HTMLElement>('[data-deco]');
      if (!deco) return;
      gsap.to(deco, {
        yPercent: -18, ease: 'none',
        scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    });
  }

  // ── Horizontal showcase ─────────────────────────────────

  private initShowcase(): void {
    if (window.innerWidth < 1100) return;

    const track = document.getElementById('showcaseTrack');
    if (!track) return;

    const getAmount = () => track.scrollWidth - window.innerWidth;

    const scrollTween = gsap.to(track, {
      x: () => -(getAmount() + 80),
      ease: 'none',
      scrollTrigger: {
        trigger: '.showcase',
        start: 'top top',
        end: () => `+=${getAmount() + 200}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          this.ngZone.run(() => {
            this.scProgress = self.progress * 100;
            this.scNum = String(Math.min(3, Math.floor(self.progress * 3) + 1)).padStart(2, '0');
          });
        },
      },
    });

    document.querySelectorAll<HTMLElement>('.showcase__card').forEach(card => {
      const deco = card.querySelector<HTMLElement>('[data-sc-deco]');
      if (deco) {
        gsap.fromTo(deco, { xPercent: -12 }, {
          xPercent: 12, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: scrollTween, start: 'left right', end: 'right left', scrub: true },
        });
      }
      gsap.fromTo(card, { scale: 0.92 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: scrollTween, start: 'left center', end: 'center center', scrub: true },
      });
    });
  }

  // ── Case study ──────────────────────────────────────────

  private initCase(): void {
    const slides = Array.from(document.querySelectorAll<HTMLElement>('.case__slide'));
    const total  = slides.length;
    if (!total) return;

    slides.forEach((s, i) => {
      gsap.set(s, {
        yPercent:  i === 0 ? 0 : 12 * i,
        scale:     i === 0 ? 1 : 1 - i * 0.05,
        opacity:   i === 0 ? 1 : 0,
        zIndex:    total - i,
        rotationX: i === 0 ? 0 : -8,
      });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.case',
        start: 'top top',
        end: `+=${total * 60}%`,
        pin: '.case__pin',
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          this.ngZone.run(() => {
            const idx = Math.min(total - 1, Math.floor(self.progress * total));
            this.caseCurrent = String(idx + 1).padStart(2, '0');
            this.caseLabel   = this.caseLabels[idx];
          });
        },
      },
    });

    slides.forEach((s, i) => {
      if (i === 0) return;
      tl.to(slides[i],     { yPercent: 0, scale: 1, opacity: 1, rotationX: 0,  duration: 1, ease: 'power2.inOut' }, i - 1);
      tl.to(slides[i - 1], { yPercent: -12, scale: 0.92, opacity: 0, rotationX: 8, duration: 1, ease: 'power2.inOut' }, i - 1);
    });

    gsap.to('.case__left', {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '.case', start: 'top top', end: 'bottom top', scrub: 1 },
    });
  }

  // ── Strip marquee ────────────────────────────────────────

  private buildStrip(): void {
    const track = document.getElementById('stripTrack');
    if (!track) return;

    const logos = [
      '/LOGOES/Artboard 1.png',
      '/LOGOES/Artboard 1 copy.png',
      '/LOGOES/Artboard 1-100.jpg',
      '/LOGOES/Artboard 1 copy-100.jpg',
      '/LOGOES/Artboard 1 copy 2-100.jpg',
      '/LOGOES/Artboard 1 copy 3-100.jpg',
      '/LOGOES/Artboard 1 copy 4-100.jpg',
      '/LOGOES/Artboard 1 copy 5-100.jpg',
      '/LOGOES/Artboard 1 copy 6-100.jpg',
      '/LOGOES/Artboard 1 copy 7-100.jpg',
      '/LOGOES/Artboard 1 copy 8-100.jpg',
      '/LOGOES/Artboard 1 copy 9-100.jpg',
      '/LOGOES/Artboard 1 copy 10-100.jpg',
      '/LOGOES/Artboard 1 copy 11-100.jpg',
      '/LOGOES/Artboard 1 copy 12-100.jpg',
      '/LOGOES/Artboard 1 copy 13-100.jpg',
      '/LOGOES/Artboard 1 copy 14-100.jpg',
      '/LOGOES/Artboard 1 copy 15-100.jpg',
      '/LOGOES/Artboard 1 copy 16-100.jpg',
      '/LOGOES/Artboard 1 copy 17.png',
      '/LOGOES/Artboard 1 copy 18.png',
      '/LOGOES/Artboard 1 copy 19.png',
      '/LOGOES/Artboard 1 copy 20.png',
      '/LOGOES/Artboard 1 copy 21.png',
    ];
    const repeated = Array(2).fill(logos).flat();
    const lightOnTransparent = new Set([
      '/LOGOES/Artboard 1 copy 17.png',
      '/LOGOES/Artboard 1 copy 18.png',
      '/LOGOES/Artboard 1 copy 19.png',
      '/LOGOES/Artboard 1 copy 20.png',
      '/LOGOES/Artboard 1 copy 21.png',
    ]);
    const baseStyle = 'width:140px;height:40px;object-fit:contain;object-position:center;display:block;opacity:0.65';
    const itemStyle = 'display:flex;align-items:center;height:56px';
    const sepStyle  = 'color:rgba(138,79,255,0.4);font-size:0.8rem;flex-shrink:0;margin:0 1rem';
    const html = [...repeated, ...repeated]
      .map((src, i) => {
        const filter = lightOnTransparent.has(src) ? 'grayscale(1)' : 'invert(1) grayscale(1)';
        const imgStyle = `${baseStyle};filter:${filter}`;
        return `<div class="strip__item" style="${itemStyle}"><img src="${src}" alt="" style="${imgStyle}" /></div>` +
          (i % 2 === 1 ? `<span style="${sepStyle}">✦</span>` : '');
      })
      .join('');
    track.innerHTML = html;

    setTimeout(() => {
      const half  = track.scrollWidth / 2;
      const tween = gsap.to(track, { x: -half, duration: 24, ease: 'none', repeat: -1 });

      ScrollTrigger.create({
        trigger: '.strip', start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => {
          const v    = self.getVelocity();
          const skew = gsap.utils.clamp(-30, 30, v / -60);
          gsap.to('.strip__item', { skewX: skew * 0.3, duration: 0.3, overwrite: 'auto' });
          tween.timeScale(1 + Math.abs(v) / 3000);
          gsap.to(tween, { timeScale: 1, duration: 0.6, overwrite: 'auto', delay: 0.1 });
        },
      });
    }, 50);
  }

  // ── CTA ─────────────────────────────────────────────────

  private initCTA(): void {
    gsap.from('.svc-cta__inner > *', {
      opacity: 0, y: 40, duration: 0.9, stagger: 0.12, ease: 'expo.out',
      scrollTrigger: { trigger: '.svc-cta', start: 'top 78%' },
    });
  }

  private initNavHide(): void {
    const nav = document.querySelector<HTMLElement>('.navbar');
    if (!nav) return;

    ScrollTrigger.create({
      trigger: '.work-grid-sec',
      start: 'top top',
      end: 'bottom bottom',
      onEnter:     () => nav.classList.add('force-hidden'),
      onLeave:     () => nav.classList.remove('force-hidden'),
      onEnterBack: () => nav.classList.add('force-hidden'),
      onLeaveBack: () => nav.classList.remove('force-hidden'),
    });
  }
}
