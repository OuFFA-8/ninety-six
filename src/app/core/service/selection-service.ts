import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * One of six pitch-room "works" the user can pick.
 * Each work has its own color signature that propagates through
 * the rest of the site after selection.
 */
export interface Work {
  id: string;
  category: string;
  title: string;
  client: string;
  /** Primary tint — used for the screen glow, hero accents, buttons. */
  color: string;
  /** Soft tint variant — used for ambient haze and gradient bg. */
  colorSoft: string;
  /** Ink tint — used for text on light surfaces. */
  colorInk: string;
}

export const WORKS: Work[] = [
  {
    id: 'brand-strategy',
    category: 'Brand Strategy',
    title: 'Repositioning Noon',
    client: 'Noon Egypt',
    color: '#8a4fff',
    colorSoft: '#c49bff',
    colorInk: '#1a0535',
  },
  {
    id: 'visual-identity',
    category: 'Visual Identity',
    title: 'Careem Rebrand',
    client: 'Careem',
    color: '#00d4a8',
    colorSoft: '#5fe3c3',
    colorInk: '#012e23',
  },
  {
    id: 'motion-video',
    category: 'Motion & Video',
    title: 'Pepsi Ramadan',
    client: 'Pepsi MENA',
    color: '#ff4757',
    colorSoft: '#ff8a92',
    colorInk: '#3d0a10',
  },
  {
    id: 'web-design',
    category: 'Web Design',
    title: 'Talabat E-commerce',
    client: 'Talabat',
    color: '#ff8c42',
    colorSoft: '#ffb380',
    colorInk: '#3d1a05',
  },
  {
    id: 'print-design',
    category: 'Print Design',
    title: 'Adidas Magazine',
    client: 'Adidas Gulf',
    color: '#4a9eff',
    colorSoft: '#85bdff',
    colorInk: '#04244d',
  },
  {
    id: 'digital-marketing',
    category: 'Digital Marketing',
    title: 'Samsung Launch',
    client: 'Samsung MENA',
    color: '#e8b923',
    colorSoft: '#f0d271',
    colorInk: '#3d2e02',
  },
];

const STORAGE_KEY = 'ninetysix.selectedWorkId';

/**
 * Tracks whether the user has completed the intro (selected a work),
 * and what they selected. Used by the Home component to skip the
 * intro on subsequent visits and to theme the rest of the site.
 */
@Injectable({ providedIn: 'root' })
export class SelectionService {
  private platformId = inject(PLATFORM_ID);

  /** Currently selected work, or null before user picks. */
  readonly selected = signal<Work | null>(null);

  /** True once the intro has finished (user clicked through). */
  readonly hasCompletedIntro = signal<boolean>(false);

  /** Reactive accent color — defaults to brand purple before selection. */
  readonly accent = computed(() => this.selected()?.color ?? '#8a4fff');
  readonly accentSoft = computed(() => this.selected()?.colorSoft ?? '#c49bff');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.restoreFromStorage();
    }
  }

  /** Called by the Pitch Room when the user picks a screen. */
  select(work: Work): void {
    this.selected.set(work);
    this.hasCompletedIntro.set(true);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(STORAGE_KEY, work.id);
      } catch {
        // localStorage might fail in private mode — silent fallback
      }
    }
  }

  /** Reset — useful for letting the user replay the intro. */
  reset(): void {
    this.selected.set(null);
    this.hasCompletedIntro.set(false);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* noop */
      }
    }
  }

  private restoreFromStorage(): void {
    try {
      const id = localStorage.getItem(STORAGE_KEY);
      if (!id) return;
      const found = WORKS.find((w) => w.id === id);
      if (found) {
        this.selected.set(found);
        // intentionally NOT setting hasCompletedIntro — intro plays every load
      }
    } catch {
      /* noop */
    }
  }
}
