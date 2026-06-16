import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface ProjectConfig {
  title: string;
  tag: string;
  liveUrl: string;
  domain: string;
  desktopShots: string[];
  mobileShots: string[];
}

const PROJECTS: Record<string, ProjectConfig> = {
  carpaccio: {
    title: 'Carpaccio .',
    tag: 'Web Design & Development · 2026',
    liveUrl: 'https://carpaccio-restaurant.vercel.app/home',
    domain: 'carpaccio-restaurant.vercel.app',
    desktopShots: [
      '/website/carpaccio/home.jpg',
      '/website/carpaccio/menu.jpg',
      '/website/carpaccio/menu-detail.jpg',
    ],
    mobileShots: ['/website/carpaccio/mobile-home.jpg'],
  },
};

@Component({
  selector: 'app-web',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './web.html',
  styleUrl: './web.scss',
})
export class WebProject implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  project: ProjectConfig | null = null;
  safeLiveUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.project = PROJECTS[slug] ?? null;
    if (this.project) {
      this.safeLiveUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.project.liveUrl);
    }
  }
}
