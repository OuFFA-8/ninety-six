import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type ImageItem = string | [string, string];

interface ProjectConfig {
  title: string;
  tag: string;
  images: ImageItem[];
}

const F =
  '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2';

const PROJECTS: Record<string, ProjectConfig> = {
  '310': {
    title: '310 .',
    tag: 'Brand Identity · 2024',
    images: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((n) => `/BRADNING/310/1x/${n}.jpg`),
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
  nutriglow: {
    title: 'NutriGlow. ',
    tag: 'Brand Identity · 2025',
    images: [
      '/BRADNING/nutrigllow/Artboard%201-100.jpg',
      '/BRADNING/nutrigllow/Artboard%202-100.jpg',
    ],
  },
  'uboor-al-khaleej': {
    title: 'Uboor Al-Khaleej .',
    tag: 'Brand Identity · 2025',
    images: Array.from(
      { length: 13 },
      (_, i) =>
        `/BRADNING/%D8%B9%D8%A8%D9%88%D8%B1%20%D8%A7%D9%84%D8%AE%D9%84%D9%8A%D8%AC/1x/${i + 1}.jpg`,
    ),
  },
  'prince-festival': {
    title: 'Prince Abdul Aziz Festival .',
    tag: 'Brand Identity · 2025',
    images: [
      `${F}/1.jpg`,
      `${F}/2.jpg`,
      `${F}/3.jpg`,
      `${F}/4.jpg`,
      `${F}/5.jpg`,
      `${F}/6.jpg`,
      `${F}/7.jpg`,
      `${F}/8.jpeg`,
      [`${F}/9.jpg`, `${F}/10.jpg`],
      `${F}/11.jpeg`,
      `${F}/12.jpeg`,
      `${F}/13.jpeg`,
      `${F}/14.jpg`,
      `${F}/15.jpg`,
      `${F}/16.jpeg`,
      `${F}/17.jpg`,
      [`${F}/18.jpg`, `${F}/19.jpg`],
      `${F}/20.jpeg`,
    ],
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
  images: ImageItem[] = [];

  get totalImages(): number {
    return this.images.reduce((n, item) => n + (Array.isArray(item) ? item.length : 1), 0);
  }

  isPair(item: ImageItem): item is [string, string] {
    return Array.isArray(item);
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.project = PROJECTS[slug] ?? null;
    if (this.project) {
      this.images = this.project.images;
    }
  }
}
