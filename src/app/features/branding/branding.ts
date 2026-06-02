import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface ProjectConfig {
  title: string;
  tag: string;
  folder: string;
  count: number;
}

const PROJECTS: Record<string, ProjectConfig> = {
  'cake-can': {
    title: 'Cake Can .',
    tag: 'Brand Identity · 2024',
    folder: 'cake can',
    count: 10,
  },
  canned: {
    title: 'Canned .',
    tag: 'Brand Identity · 2024',
    folder: 'canned',
    count: 8,
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
      this.images = Array.from(
        { length: this.project.count },
        (_, i) => `/branding/${encodeURIComponent(this.project!.folder)}/${i + 1}.jpg`,
      );
    }
  }
}
