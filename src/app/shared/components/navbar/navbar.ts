import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
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
  @ViewChild('navbar') navbar!: ElementRef;
  isMenuOpen = false;

  ngAfterViewInit() {
    gsap.from(this.navbar.nativeElement, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: 'power4.out',
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      gsap.from('.mobile-menu a', {
        y: -20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
      });
    }
  }
}
