import { Routes } from '@angular/router';
import { MainLayout } from './core/layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'portfolio',
        loadComponent: () =>
          import('./features/services/services').then((m) => m.ServicesPage),
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/contact/contact').then((m) => m.ContactPage),
      },
      {
        path: 'portfolio/branding/:slug',
        loadComponent: () => import('./features/branding/branding').then((m) => m.BrandingProject),
      },
      {
        path: 'portfolio/social/:slug',
        loadComponent: () => import('./features/social/social').then((m) => m.SocialProject),
      },
      {
        path: 'portfolio/motion&video',
        loadComponent: () => import('./features/motion-video/motion-video').then((m) => m.MotionVideoPage),
      },
      {
        path: 'portfolio/web/:slug',
        loadComponent: () => import('./features/web/web').then((m) => m.WebProject),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/notfound/notfound').then((m) => m.Notfound),
  },
];
