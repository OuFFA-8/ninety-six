import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import gsap from 'gsap';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements AfterViewInit {
  @ViewChild('navbar')   navbar!:   ElementRef<HTMLElement>;
  @ViewChild('dropdown') dropdown!: ElementRef<HTMLElement>;

  isMenuOpen = false;
  isHidden   = false;
  private _lastY   = 0;
  private _scrolled = 0;

  ngAfterViewInit(): void {
    gsap.from(this.navbar.nativeElement, {
      y: -80, opacity: 0, duration: 1.1, ease: 'power4.out',
      clearProps: 'transform,opacity',
    });
    this._lastY = window.scrollY;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const y    = window.scrollY;
    const diff = y - this._lastY;
    this._lastY = y;

    if (y < 80) { this.isHidden = false; return; }

    this._scrolled += diff;

    if (this._scrolled > 60) {
      this.isHidden  = true;
      this._scrolled = 0;
    } else if (this._scrolled < -40) {
      this.isHidden  = false;
      this._scrolled = 0;
    }
  }

  toggleMenu(): void {
    this.isMenuOpen ? this.close() : this.open();
  }

  open(): void {
    this.isMenuOpen = true;
    gsap.fromTo(
      this.dropdown.nativeElement.querySelectorAll('li, .navbar__cta-link'),
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.05 },
    );
  }

  close(): void {
    this.isMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.isMenuOpen) return;
    if (!this.navbar.nativeElement.contains(e.target as Node)) {
      this.close();
    }
  }
}
