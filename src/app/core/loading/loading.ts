import {
  Component,
  Output,
  EventEmitter,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  NgZone,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './loading.html',
  styleUrl: './loading.scss',
})
export class Loading implements AfterViewInit {
  @Output() completed = new EventEmitter<void>();

  @ViewChild('overlay')   overlay!:   ElementRef<HTMLElement>;
  @ViewChild('board')     board!:     ElementRef<HTMLElement>;
  @ViewChild('bullseye')  bullseye!:  ElementRef<HTMLElement>;
  @ViewChild('dart')      dart!:      ElementRef<HTMLElement>;
  @ViewChild('labels')    labels!:    ElementRef<HTMLElement>;
  @ViewChild('name')      name!:      ElementRef<HTMLElement>;
  @ViewChild('studio')    studio!:    ElementRef<HTMLElement>;
  @ViewChildren('sector') sectorEls!: QueryList<ElementRef<HTMLElement>>;

  private platformId = inject(PLATFORM_ID);
  private ngZone     = inject(NgZone);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.ngZone.run(() => this.completed.emit());
      return;
    }
    this.ngZone.runOutsideAngular(() => this.runSequence());
  }

  private runSequence(): void {
    const sectors  = this.sectorEls.toArray().map(r => r.nativeElement);
    const dart     = this.dart.nativeElement;
    const bullseye = this.bullseye.nativeElement;
    const board    = this.board.nativeElement;

    // Dart starts far upper-right; tip will land at board centre (x:0, y:0)
    const vmin   = Math.min(window.innerWidth, window.innerHeight);
    const offset = vmin * 0.48;

    gsap.set(dart, {
      xPercent: -50,   // centre element on its own width
      yPercent: -100,  // bottom (tip) sits at top:50% of board
      rotation: 35,    // shaft points upper-right at 35°
      x: offset,
      y: -offset,
      opacity: 0,
    });

    const tl = gsap.timeline({ onComplete: () => this.exit() });

    // Dartboard sectors appear outside → in
    tl.to(sectors, {
      scale: 1,
      opacity: 1,
      duration: 0.52,
      ease: 'back.out(1.3)',
      stagger: { each: 0.09, from: 0 },
    }, 0);

    // Bullseye pops in
    tl.to(bullseye, {
      scale: 1,
      opacity: 1,
      duration: 0.35,
      ease: 'back.out(2.8)',
    }, 0.44);

    // Dart flies in — tip hits bullseye
    tl.to(dart, {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.17,
      ease: 'power4.in',
    }, 0.74);

    // Impact: board shakes laterally
    tl.to(board, {
      x: -5,
      duration: 0.04,
      ease: 'power4.out',
      yoyo: true,
      repeat: 5,
    }, 0.91);

    // Bullseye flares on impact
    tl.to(bullseye, {
      scale: 1.7,
      duration: 0.08,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    }, 0.91);

    // Flash burst
    tl.to(bullseye, {
      filter: 'brightness(3)',
      duration: 0.07,
      yoyo: true,
      repeat: 1,
    }, 0.91);

    // Idle: inner sector pulses gently to show it's alive
    tl.to(sectors[4], {
      opacity: 0.6,
      duration: 0.7,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 1,
    }, 1.1);

    // Brand text fades up
    tl.fromTo(this.name.nativeElement,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.42, ease: 'power2.out' },
      1.08,
    );
    tl.fromTo(this.studio.nativeElement,
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.38, ease: 'power2.out' },
      1.24,
    );

    // Hold
    tl.to({}, { duration: 0.65 });
  }

  private exit(): void {
    const sectors = this.sectorEls.toArray().map(r => r.nativeElement);

    const tl = gsap.timeline({
      onComplete: () => this.ngZone.run(() => this.completed.emit()),
    });

    // Text out
    tl.to(this.labels.nativeElement, {
      opacity: 0, y: -10, duration: 0.2, ease: 'power2.in',
    }, 0);

    // Dart lifts and fades
    tl.to(this.dart.nativeElement, {
      y: -18, opacity: 0, duration: 0.22, ease: 'power2.in',
    }, 0);

    // Bullseye flares and disappears
    tl.to(this.bullseye.nativeElement, {
      scale: 3.5, opacity: 0, duration: 0.38, ease: 'power3.out',
    }, 0.08);

    // Sectors collapse inward (innermost first — iris close)
    tl.to(sectors, {
      scale: 0,
      opacity: 0,
      duration: 0.42,
      ease: 'power3.in',
      stagger: { each: 0.04, from: 'end' },
    }, 0.1);

    // Overlay fades, page is revealed
    tl.to(this.overlay.nativeElement, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
    }, 0.32);
  }
}
