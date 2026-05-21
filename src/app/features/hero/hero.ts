import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements AfterViewInit, OnDestroy {
  @ViewChild('section',  { static: true }) section!:   ElementRef<HTMLElement>;
  @ViewChild('headline', { static: true }) headline!:  ElementRef;
  @ViewChild('cycleWord', { static: false }) cycleWord!: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);

  private sts:          ScrollTrigger[] = [];
  private cycleTimer:   ReturnType<typeof setInterval> | null = null;
  private wordIdx       = 0;
  private readonly WORDS = [
    'Impact.', 'Results.', 'Brands.', 'Stories.',
    'Growth.', 'Vision.', 'Campaigns.', 'Futures.',
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    requestAnimationFrame(() => {
      this.initScrollTrigger();
      this.hideForIntro();
    });
  }

  playEntrance(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.entranceAnimation();
    // Start cycling after entrance finishes (~2s)
    setTimeout(() => this.startWordCycle(), 2200);
  }

  ngOnDestroy(): void {
    this.sts.forEach((t) => t.kill());
    if (this.cycleTimer) clearInterval(this.cycleTimer);
  }

  // ── Word cycle ───────────────────────────────────────────
  private startWordCycle(): void {
    const el = this.cycleWord?.nativeElement;
    if (!el) return;

    this.cycleTimer = setInterval(() => {
      this.wordIdx = (this.wordIdx + 1) % this.WORDS.length;
      const next = this.WORDS[this.wordIdx];

      const tl = gsap.timeline();
      tl.to(el, { yPercent: -120, opacity: 0, duration: 0.38, ease: 'power2.in' });
      tl.call(() => {
        el.textContent = next;
        gsap.set(el, { yPercent: 120 });
      });
      tl.to(el, { yPercent: 0, opacity: 1, duration: 0.42, ease: 'power3.out' });
    }, 2600);
  }

  // ── Intro setup ──────────────────────────────────────────
  private hideForIntro(): void {
    const lines = this.headline.nativeElement.querySelectorAll('.line');
    gsap.set(lines, { yPercent: 110 });
  }

  private entranceAnimation(): void {
    const lines = this.headline.nativeElement.querySelectorAll('.line');
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(lines, { yPercent: 0, duration: 1.0, stagger: 0.13 }, 0.15);
  }

  private initScrollTrigger(): void {
    const section = this.section.nativeElement;

    const st1 = ScrollTrigger.create({
      trigger: section, start: 'top top', end: '+=30%',
      pin: true, pinSpacing: true,
    });
    this.sts.push(st1);

    const anim = gsap.to(
      this.headline.nativeElement,
      { opacity: 0, y: -40, ease: 'power2.in',
        scrollTrigger: { trigger: section, start: 'top top', end: '+=25%', scrub: 0.6 } },
    );
    if (anim.scrollTrigger) this.sts.push(anim.scrollTrigger);
  }

}
