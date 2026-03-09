import { Routes } from '@angular/router';
import { MainLayout } from './core/layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: 'intro',
    loadComponent: () => import('./core/intro/intro').then((m) => m.Intro),
  },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'brands',
        loadComponent: () => import('./features/brands/brands').then((m) => m.Brands),
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products').then((m) => m.Products),
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/details/details').then((m) => m.Details),
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart').then((m) => m.Cart),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./core/auth/register/register').then((m) => m.Register),
  },
  {
    path: '**',
    loadComponent: () => import('./features/notfound/notfound').then((m) => m.Notfound),
  },
];
