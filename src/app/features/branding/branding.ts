import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface ProjectConfig {
  title: string;
  tag: string;
  images: string[];
}

const PROJECTS: Record<string, ProjectConfig> = {
  '310': {
    title: '310 .',
    tag: 'Brand Identity · 2024',
    images: [1,2,3,5,6,7,8,9,10,11,12,13].map(n => `/BRADNING/310/1x/${n}.jpg`),
  },
  dot: {
    title: 'DOT .',
    tag: 'Brand Identity · 2024',
    images: Array.from({ length: 10 }, (_, i) => `/BRADNING/DOT/1x/${i + 1}.jpg`),
  },
  sbl: {
    title: 'SBL .',
    tag: 'Brand Identity · 2024',
    images: Array.from({ length: 10 }, (_, i) => `/BRADNING/SBL/1x/${i + 1}.jpg`),
  },
  'cake-can': {
    title: 'Cake Can .',
    tag: 'Brand Identity · 2024',
    images: Array.from({ length: 10 }, (_, i) => `/BRADNING/cake%20can/${i + 1}.jpg`),
  },
  canned: {
    title: 'Canned .',
    tag: 'Brand Identity · 2024',
    images: Array.from({ length: 8 }, (_, i) => `/BRADNING/canned/${i + 1}.jpg`),
  },
  ruh: {
    title: 'Ruh .',
    tag: 'Brand Identity · 2024',
    images: Array.from({ length: 17 }, (_, i) => `/BRADNING/ruh/New%20folder/${i + 1}.jpg`),
  },
};

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './branding.html',
  styleUrl: './branding.scss',
})
export class BrandingProject implements OnInit {
  private route = inject(ActivatedRoute);

  project: ProjectConfig | null = null;
  images: string[] = [];

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.project = PROJECTS[slug] ?? null;
    if (this.project) {
      this.images = this.project.images;
    }
  }
}
