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
  'prince-festival': {
    title: 'مهرجان الأمير عبد العزيز .',
    tag: 'Brand Identity · 2025',
    images: [
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/1.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/2.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/3.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/4.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/5.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/6.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/7.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/8.jpeg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/9.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/10.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/11.jpeg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/12.jpeg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/13.jpeg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/14.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/15.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/16.jpeg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/17.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/18.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/19.jpg',
      '/BRADNING/%D9%85%D9%87%D8%B1%D8%AC%D8%A7%D9%86%20%D8%A7%D9%84%D8%A7%D9%85%D9%8A%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2/20.jpeg',
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
  images: string[] = [];

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.project = PROJECTS[slug] ?? null;
    if (this.project) {
      this.images = this.project.images;
    }
  }
}
