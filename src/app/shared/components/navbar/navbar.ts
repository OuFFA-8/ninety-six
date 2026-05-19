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

  ngAfterViewInit(): void {
    gsap.from(this.navbar.nativeElement, {
      y: -80, opacity: 0, duration: 1.1, ease: 'power4.out',
    });
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
