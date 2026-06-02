import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactPage implements AfterViewInit, OnDestroy {
  @ViewChild('starCanvas', { static: true }) starCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursorEl') cursorEl!: ElementRef<HTMLElement>;
  @ViewChild('cursorDot') cursorDot!: ElementRef<HTMLElement>;
  @ViewChild('cursorLbl') cursorLbl!: ElementRef<HTMLElement>;
  @ViewChild('arcsEl') arcsEl!: ElementRef<HTMLElement>;
  @ViewChild('successEl') successEl!: ElementRef<HTMLElement>;
  @ViewChild('successCircle') successCircle!: ElementRef<SVGCircleElement>;
  @ViewChild('successCheck') successCheck!: ElementRef<SVGPathElement>;

  private platformId = inject(PLATFORM_ID);
  private _starRaf = 0;

  selectedBudget = '';
  stepDone = 0;
  showSuccess = false;

  nameErr = false;
  emailErr = false;
  serviceErr = false;
  messageErr = false;

  formName = '';
  formEmail = '';
  formService = '';
  formMessage = '';

  readonly budgets = [
    { val: '<25k', label: '< 25K' },
    { val: '25-50k', label: '25–50K' },
    { val: '50-100k', label: '50–100K' },
    { val: '100k+', label: '100K+' },
  ];

  readonly services = [
    'Branding & Identity',
    'Graphic Design',
    'Motion & Video',
    'Web & Mobile App Development',
    'Digital Marketing',
    'Something else',
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.style.cursor = 'none';
    CustomEase.create('crisp', '0.16, 1, 0.3, 1');
    this.initStars();
    this.initCursor();
    this.initArcsParallax();
    this.initEntrance();
  }

  ngOnDestroy(): void {
    document.body.style.cursor = '';
    if (this._starRaf) cancelAnimationFrame(this._starRaf);
  }

  // ── Form state ───────────────────────────────────────────

  selectBudget(val: string): void {
    this.selectedBudget = val;
    this.updateProgress();
    const chips = document.querySelectorAll<HTMLElement>('.chip');
    chips.forEach((c) => {
      if (c.dataset['budget'] === val)
        gsap.fromTo(c, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
    });
  }

  updateProgress(): void {
    let done = 0;
    if (this.formName.trim()) done++;
    if (this.isValidEmail()) done++;
    if (this.formService) done++;
    if (this.formMessage.trim()) done++;
    this.stepDone = Math.min(4, done);
  }

  clearError(field: 'name' | 'email' | 'service' | 'message'): void {
    if (field === 'name') this.nameErr = false;
    if (field === 'email') this.emailErr = false;
    if (field === 'service') this.serviceErr = false;
    if (field === 'message') this.messageErr = false;
  }

  submitForm(e: Event): void {
    e.preventDefault();
    if (!this.validate()) {
      gsap.fromTo('.form__submit', { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,.3)' });
      return;
    }
    this.showSuccess = true;
    setTimeout(() => this.animateSuccess(), 20);
  }

  resetForm(): void {
    gsap.to(this.successEl.nativeElement, {
      opacity: 0,
      duration: 0.4,
      onComplete: () => {
        this.showSuccess = false;
        this.formName = this.formEmail = this.formService = this.formMessage = '';
        this.selectedBudget = '';
        this.stepDone = 0;
        this.nameErr = this.emailErr = this.serviceErr = this.messageErr = false;
      },
    });
  }

  // ── Private ──────────────────────────────────────────────

  private validate(): boolean {
    this.nameErr = !this.formName.trim();
    this.emailErr = !this.isValidEmail();
    this.serviceErr = !this.formService;
    this.messageErr = !this.formMessage.trim();

    const fieldMap: [boolean, string][] = [
      [this.nameErr, '.field-name'],
      [this.emailErr, '.field-email'],
      [this.serviceErr, '.field-service'],
      [this.messageErr, '.field-message'],
    ];
    fieldMap.forEach(([err, sel]) => {
      if (err) gsap.fromTo(sel, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,.4)' });
    });

    return !this.nameErr && !this.emailErr && !this.serviceErr && !this.messageErr;
  }

  private isValidEmail(): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.formEmail);
  }

  private animateSuccess(): void {
    const circle = this.successCircle?.nativeElement as unknown as SVGElement;
    const check = this.successCheck?.nativeElement as unknown as SVGElement;
    if (!circle) return;

    const len = 2 * Math.PI * 42;
    gsap.set(circle, { strokeDasharray: len, strokeDashoffset: len });
    if (check) gsap.set(check, { opacity: 0 });

    gsap
      .timeline()
      .fromTo(this.successEl.nativeElement, { opacity: 0 }, { opacity: 1, duration: 0.4 })
      .from('.success__ring', { scale: 0, duration: 0.6, ease: 'back.out(1.8)' }, '<')
      .to(circle, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '<.2')
      .to(check, { opacity: 1, duration: 0.3 }, '-=.2')
      .fromTo(
        '.success__title, .success__text, .success__again',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
        '-=.2',
      );
  }

  private initStars(): void {
    const canvas = this.starCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.8 + 0.8,
      baseAlpha: Math.random() * 0.4 + 0.08,
      phase: Math.random() * Math.PI * 2,
      spd: Math.random() * 0.5 + 0.2,
      glow: Math.random() > 0.65,
    }));

    let t = 0;
    const draw = () => {
      this._starRaf = requestAnimationFrame(draw);
      t += 0.016;
      ctx.fillStyle = '#06030c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const a = s.baseAlpha * (0.5 + 0.5 * Math.sin(t * s.spd + s.phase));
        if (s.glow) { ctx.shadowBlur = s.r * 7; ctx.shadowColor = `rgba(220,190,255,${a})`; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.glow ? '245,225,255' : '196,155,255'},${a})`;
        ctx.fill();
        if (s.glow) ctx.shadowBlur = 0;
      }
    };
    draw();
  }

  private initCursor(): void {
    const cur = this.cursorEl?.nativeElement;
    const dot = this.cursorDot?.nativeElement;
    const lbl = this.cursorLbl?.nativeElement;
    if (!cur) return;

    const m = { x: innerWidth / 2, y: innerHeight / 2 };
    const p = { x: m.x, y: m.y };
    const d = { x: m.x, y: m.y };
    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    window.addEventListener('mousemove', (e) => {
      m.x = e.clientX;
      m.y = e.clientY;
    });

    gsap.ticker.add(() => {
      p.x = lerp(p.x, m.x, 0.15);
      p.y = lerp(p.y, m.y, 0.15);
      d.x = lerp(d.x, m.x, 0.55);
      d.y = lerp(d.y, m.y, 0.55);
      gsap.set(cur, { x: p.x, y: p.y });
      if (dot) gsap.set(dot, { x: d.x, y: d.y });
      if (lbl) gsap.set(lbl, { x: m.x, y: m.y });
    });

    document.querySelectorAll<HTMLElement>('a, button, .chip').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(cur, { scale: 1.6, borderColor: '#fff', duration: 0.3 });
        if (dot) gsap.to(dot, { scale: 0, duration: 0.2 });
        if (lbl) gsap.to(lbl, { opacity: 0, duration: 0.1 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(cur, { scale: 1, borderColor: '#c49bff', duration: 0.3 });
        if (dot) gsap.to(dot, { scale: 1, duration: 0.2 });
      });
    });

    document.querySelectorAll<HTMLElement>('.ct-input, .ct-textarea, .ct-select').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (lbl) {
          lbl.textContent = el.tagName === 'SELECT' ? 'Pick' : 'Type';
          gsap.to(lbl, { opacity: 1, duration: 0.2 });
        }
        gsap.to(cur, { scale: 1.3, duration: 0.3 });
      });
      el.addEventListener('mouseleave', () => {
        if (lbl) gsap.to(lbl, { opacity: 0, duration: 0.2 });
        gsap.to(cur, { scale: 1, duration: 0.3 });
      });
    });
  }

  private initArcsParallax(): void {
    const arcs = this.arcsEl?.nativeElement;
    if (!arcs) return;
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / innerWidth - 0.5) * 2;
      const ny = (e.clientY / innerHeight - 0.5) * 2;
      gsap.to(arcs, {
        x: nx * -25,
        y: ny * -18,
        duration: 1.8,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    });
  }

  private initEntrance(): void {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.ct-arc', { scale: 1.4, opacity: 0, duration: 2, stagger: 0.1 }, 0);
    tl.from('.ct-eyebrow', { opacity: 0, y: 20, duration: 0.8 }, 0.2);
    tl.from('.ct-title', { opacity: 0, y: 40, duration: 1 }, 0.3);
    tl.from('.ct-desc', { opacity: 0, y: 20, duration: 0.8 }, 0.5);
    tl.from('.ct-row', { opacity: 0, x: -30, duration: 0.7, stagger: 0.1 }, 0.6);
    tl.from(
      '.ct-social',
      { opacity: 0, scale: 0.7, duration: 0.5, stagger: 0.06, ease: 'back.out(2)' },
      0.9,
    );
    tl.from('.form-card', { opacity: 0, y: 50, duration: 1 }, 0.4);
    tl.from(
      '.ct-field, .form-card__head',
      { opacity: 0, y: 25, duration: 0.7, stagger: 0.08 },
      0.7,
    );
  }
}
