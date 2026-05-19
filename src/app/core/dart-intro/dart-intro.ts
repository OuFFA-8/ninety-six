import {
  Component,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  NgZone,
  inject,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import gsap from 'gsap';

@Component({
  selector: 'app-dart-intro',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dart-intro.html',
  styleUrl: './dart-intro.scss',
})
export class DartIntro implements AfterViewInit, OnDestroy {
  @Output() completed     = new EventEmitter<void>();
  @Output() transitioning = new EventEmitter<void>();

  @ViewChild('canvas',      { static: true }) canvasRef!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('crosshair')                     crosshairRef!:   ElementRef<HTMLElement>;
  @ViewChild('instruction')                   instructionRef!: ElementRef<HTMLElement>;
  @ViewChild('hitFeedback')                   hitFeedbackRef!: ElementRef<HTMLElement>;
  @ViewChild('missFeedback')                  missFeedbackRef!:ElementRef<HTMLElement>;
  @ViewChild('container')                     containerRef!:   ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone     = inject(NgZone);

  attemptsLeft = 3;
  gameOver     = false;

  // ── Three.js ───────────────────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!:    THREE.Scene;
  private camera!:   THREE.PerspectiveCamera;
  private animId!:   number;

  private targetGroup!: THREE.Group;
  private rings:      THREE.Mesh[]                  = [];
  private ringMats:   THREE.MeshStandardMaterial[]  = [];
  private centerDot!: THREE.Mesh;
  private arrowGroup!: THREE.Group;
  private aimLine!:    THREE.Line;
  private aimLineMat!: THREE.LineDashedMaterial;

  // ── Aim / game state ──────────────────────────────────────
  private fired = false;
  private won   = false;

  // Raw mouse position (screen px)
  private mouseX = 0;
  private mouseY = 0;

  // Organic wobble accumulator
  private wobbleT = 0;
  private wobbleX = 0;
  private wobbleY = 0;

  private lastTime   = 0;
  private cleanupFns: (() => void)[] = [];

  // Re-used vectors to avoid GC pressure
  private readonly _aim3D   = new THREE.Vector3();
  private readonly _raycaster = new THREE.Raycaster();
  private readonly _plane   = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.ngZone.run(() => this.completed.emit());
      return;
    }
    this.mouseX = window.innerWidth  / 2;
    this.mouseY = window.innerHeight / 2;
    this.ngZone.runOutsideAngular(() => this.init());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    this.renderer?.dispose();
    this.cleanupFns.forEach((fn) => fn());
  }

  retry(): void {
    this.fired = false;
    this.won   = false;
    this.gameOver = false;
    this.attemptsLeft = 3;
    this.arrowGroup.position.set(0.3, -0.8, 4.5);
    gsap.set(this.arrowGroup.scale, { x: 1, y: 1, z: 1 });
    gsap.to(this.aimLineMat, { opacity: 0.55, duration: 0.4 });
    gsap.to(this.instructionRef.nativeElement, { opacity: 1, y: 0, duration: 0.4 });
  }

  // ─────────────────────────────────────────────────────────

  private init(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: true,
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080808, 1);

    this.scene  = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x080808, 0.028);

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 7);
    this.camera.lookAt(0, 0, 0);

    this.buildTarget();
    this.buildArrow();
    this.buildAimLine();
    this.buildBackground();
    this.buildLights();

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    this.cleanupFns.push(() => window.removeEventListener('resize', onResize));

    this.bindEvents();
    this.entrance();
    this.loop();
  }

  // ── Scene building ────────────────────────────────────────

  private buildTarget(): void {
    this.targetGroup = new THREE.Group();

    const ringData = [
      { r: 1.9,  tube: 0.038, color: 0x160828, emissive: 0x0a0418 },
      { r: 1.45, tube: 0.043, color: 0x2d1160, emissive: 0x1a0940 },
      { r: 1.0,  tube: 0.048, color: 0x5c2ea8, emissive: 0x3d1a7a },
      { r: 0.6,  tube: 0.053, color: 0x8a4fff, emissive: 0x6a3bbf },
      { r: 0.25, tube: 0.058, color: 0xd4b3ff, emissive: 0xa060ff },
    ];

    ringData.forEach((d) => {
      const geo = new THREE.TorusGeometry(d.r, d.tube, 16, 128);
      const mat = new THREE.MeshStandardMaterial({
        color:            d.color,
        emissive:         d.emissive,
        emissiveIntensity: 0.9,
        metalness:        0.9,
        roughness:        0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      this.rings.push(mesh);
      this.ringMats.push(mat);
      this.targetGroup.add(mesh);
    });

    // Bullseye centre dot
    const dotGeo = new THREE.SphereGeometry(0.07, 32, 32);
    const dotMat = new THREE.MeshStandardMaterial({
      color:            0xffffff,
      emissive:         0xd4b3ff,
      emissiveIntensity: 3.5,
      metalness:        1,
      roughness:        0,
    });
    this.centerDot = new THREE.Mesh(dotGeo, dotMat);
    this.centerDot.position.z = 0.02;
    this.targetGroup.add(this.centerDot);

    // Outer glow halo
    const glowGeo = new THREE.TorusGeometry(2.25, 0.012, 8, 100);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x5020a0, transparent: true, opacity: 0.22,
    });
    this.targetGroup.add(new THREE.Mesh(glowGeo, glowMat));

    this.targetGroup.scale.set(0, 0, 0);
    this.scene.add(this.targetGroup);
  }

  private buildArrow(): void {
    this.arrowGroup = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xb89030, metalness: 0.96, roughness: 0.04,
    });
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xdcdcdc, metalness: 1, roughness: 0,
    });
    const flightMat = new THREE.MeshStandardMaterial({
      color: 0x8a4fff, emissive: 0x8a4fff, emissiveIntensity: 0.75,
      side: THREE.DoubleSide,
    });

    // Needle tip — razor-thin: radius 0.006, height 0.18
    // rotation.x = -PI/2 → apex at -Z (toward board)
    // position.z = -0.59 → base at -0.50 (meets shaft end), apex at -0.68
    const tipGeo = new THREE.ConeGeometry(0.006, 0.18, 8);
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.59;
    this.arrowGroup.add(tip);

    // Barrel: slim, tapered cylinder, length 1.0 → spans z = -0.50 to +0.50
    const shaftGeo = new THREE.CylinderGeometry(0.007, 0.011, 1.0, 8);
    const shaft = new THREE.Mesh(shaftGeo, metalMat);
    shaft.rotation.x = Math.PI / 2;
    this.arrowGroup.add(shaft);

    // Two thin flights in a cross — small and elegant
    const flightGeo = new THREE.BoxGeometry(0.11, 0.055, 0.005);
    [0, Math.PI / 2].forEach((rot) => {
      const f = new THREE.Mesh(flightGeo, flightMat);
      f.position.z = 0.44;
      f.rotation.z = rot;
      this.arrowGroup.add(f);
    });

    this.arrowGroup.position.set(0.3, -0.8, 4.5);
    this.scene.add(this.arrowGroup);
  }

  private buildAimLine(): void {
    const pts = [new THREE.Vector3(), new THREE.Vector3()];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    this.aimLineMat = new THREE.LineDashedMaterial({
      color:       0x8a4fff,
      transparent: true,
      opacity:     0,
      dashSize:    0.12,
      gapSize:     0.1,
    });
    this.aimLine = new THREE.Line(geo, this.aimLineMat);
    this.aimLine.computeLineDistances();
    this.scene.add(this.aimLine);
  }

  private buildBackground(): void {
    // Starfield
    const N = 2200;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i += 3) {
      pos[i]     = (Math.random() - 0.5) * 55;
      pos[i + 1] = (Math.random() - 0.5) * 55;
      pos[i + 2] = (Math.random() - 0.5) * 40 - 12;
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const smat = new THREE.PointsMaterial({ size: 0.028, color: 0x8a4fff, transparent: true, opacity: 0.4 });
    this.scene.add(new THREE.Points(sgeo, smat));

    // Perspective grid floor
    const grid = new THREE.GridHelper(50, 50, 0x8a4fff, 0x1a0a3a);
    grid.position.y = -5;
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    (grid.material as THREE.LineBasicMaterial).opacity     = 0.18;
    this.scene.add(grid);
  }

  private buildLights(): void {
    this.scene.add(new THREE.AmbientLight(0x8a4fff, 0.55));

    const main = new THREE.PointLight(0xd4b3ff, 4.5, 28);
    main.position.set(0, 4, 7);
    this.scene.add(main);

    const fill = new THREE.PointLight(0x8a4fff, 3, 20);
    fill.position.set(-4, -2, 4);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0x4a1a9a, 2, 14);
    rim.position.set(0, 0, -5);
    this.scene.add(rim);
  }

  // ── Events ────────────────────────────────────────────────

  private bindEvents(): void {
    const onMove = (e: MouseEvent) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    };
    const onClick = () => {
      if (this.fired || this.won || this.gameOver) return;
      this.fire();
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) { this.mouseX = t.clientX; this.mouseY = t.clientY; }
    };
    const onTouchEnd = () => {
      if (this.fired || this.won || this.gameOver) return;
      this.fire();
    };

    window.addEventListener('mousemove',  onMove,       { passive: true });
    window.addEventListener('click',      onClick);
    window.addEventListener('touchmove',  onTouchMove,  { passive: true });
    window.addEventListener('touchend',   onTouchEnd);

    this.cleanupFns.push(
      () => window.removeEventListener('mousemove', onMove),
      () => window.removeEventListener('click', onClick),
      () => window.removeEventListener('touchmove', onTouchMove),
      () => window.removeEventListener('touchend', onTouchEnd),
    );
  }

  // ── Entrance animation ────────────────────────────────────

  private entrance(): void {
    const tl = gsap.timeline({ delay: 0.35 });

    tl.to(this.targetGroup.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.6,
      ease: 'elastic.out(1, 0.5)',
    });

    tl.to(this.aimLineMat, { opacity: 0.55, duration: 0.5 }, '-=0.3');

    tl.to(this.instructionRef.nativeElement, {
      opacity: 1, y: 0,
      duration: 0.6,
    }, '-=0.4');
  }

  // ── Fire ──────────────────────────────────────────────────

  private fire(): void {
    this.fired = true;
    gsap.to(this.instructionRef.nativeElement, { opacity: 0, duration: 0.2 });
    gsap.to(this.aimLineMat, { opacity: 0, duration: 0.15 });

    // Wobbled aim in screen space
    const aimSX = this.mouseX + this.wobbleX;
    const aimSY = this.mouseY + this.wobbleY;

    // Project to 3D on target plane (z = 0)
    const ndx = (aimSX / window.innerWidth)  *  2 - 1;
    const ndy = (aimSY / window.innerHeight) * -2 + 1;
    this._raycaster.setFromCamera(new THREE.Vector2(ndx, ndy), this.camera);
    this._raycaster.ray.intersectPlane(this._plane, this._aim3D);

    // Clamp to board area
    const r = Math.sqrt(this._aim3D.x * this._aim3D.x + this._aim3D.y * this._aim3D.y);
    if (r > 2.0) {
      this._aim3D.x *= 2.0 / r;
      this._aim3D.y *= 2.0 / r;
    }
    this._aim3D.z = 0.05;

    const isHit = r < 0.32;   // bullseye inner ring r=0.25, generous zone

    this.flyArrow(this.arrowGroup.position.clone(), this._aim3D.clone(), isHit);
  }

  // ── Arrow arc flight ──────────────────────────────────────

  private flyArrow(start: THREE.Vector3, end: THREE.Vector3, isHit: boolean): void {
    // Dart trajectory: slight upward arc then drops into board.
    // Mid-point raised a little on Y (gravity-like curve), no Z deviation.
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    mid.y += 0.22;

    const obj = { t: 0 };

    gsap.to(obj, {
      t: 1,
      duration: 0.3,
      ease: 'power2.in',
      onUpdate: () => {
        const t  = obj.t;
        const s  = (1 - t) * (1 - t);
        const ms = 2  * (1 - t) * t;
        const es = t  * t;

        this.arrowGroup.position.set(
          start.x * s + mid.x * ms + end.x * es,
          start.y * s + mid.y * ms + end.y * es,
          start.z * s + mid.z * ms + end.z * es,
        );

        // Orient tip (local -Z) toward the NEXT point on the bezier curve.
        // lookAt on a regular Object3D aligns its local -Z toward the target.
        const dt  = Math.min(t + 0.06, 1);
        const ds  = (1 - dt) * (1 - dt);
        const dms = 2 * (1 - dt) * dt;
        const des = dt * dt;
        this.arrowGroup.lookAt(
          start.x * ds + mid.x * dms + end.x * des,
          start.y * ds + mid.y * dms + end.y * des,
          start.z * ds + mid.z * dms + end.z * des,
        );
      },
      onComplete: () => {
        if (isHit) this.onHit();
        else       this.onMiss(end);
      },
    });
  }

  // ── Hit ───────────────────────────────────────────────────

  private onHit(): void {
    this.won = true;

    // Arrow vibrates — stuck in board
    const rx = this.arrowGroup.rotation.x;
    gsap.to(this.arrowGroup.rotation, {
      x: rx + 0.06, duration: 0.05, yoyo: true, repeat: 7,
    });

    // All rings light up in sequence
    this.ringMats.forEach((m, i) => {
      gsap.to(m, {
        emissiveIntensity: 3.5,
        duration: 0.15, delay: i * 0.06, yoyo: true, repeat: 1,
      });
    });

    // Bullseye mega-flare
    const dotMat = this.centerDot.material as THREE.MeshStandardMaterial;
    gsap.to(dotMat, { emissiveIntensity: 9, duration: 0.08, yoyo: true, repeat: 5 });

    // Camera shake
    gsap.to(this.camera.position, {
      x: 0.18, duration: 0.05, yoyo: true, repeat: 7,
      onComplete: () => { this.camera.position.x = 0; },
    });

    // Show hit feedback
    gsap.fromTo(this.hitFeedbackRef.nativeElement,
      { opacity: 0, scale: 0.55 },
      { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' },
    );

    setTimeout(() => this.portalTransition(), 1500);
  }

  // ── Miss ──────────────────────────────────────────────────

  private onMiss(landPos: THREE.Vector3): void {
    const dist = Math.sqrt(landPos.x * landPos.x + landPos.y * landPos.y);

    // Identify and flash the ring that was hit
    const radii = [1.9, 1.45, 1.0, 0.6, 0.25];
    const idx   = radii.findIndex((r) => dist < r + 0.06);
    if (idx >= 0) {
      gsap.to(this.ringMats[idx], {
        emissiveIntensity: 4, duration: 0.07, yoyo: true, repeat: 7,
      });
    }

    // Arrow vibrates on impact
    const rx = this.arrowGroup.rotation.x;
    gsap.to(this.arrowGroup.rotation, { x: rx + 0.07, duration: 0.05, yoyo: true, repeat: 7 });

    // Camera shake
    gsap.to(this.camera.position, {
      x: -0.14, duration: 0.04, yoyo: true, repeat: 7,
      onComplete: () => { this.camera.position.x = 0; },
    });

    // Miss text
    gsap.fromTo(this.missFeedbackRef.nativeElement,
      { opacity: 0, y: -8 },
      {
        opacity: 1, y: 0, duration: 0.28, ease: 'power2.out',
        onComplete: () => {
          gsap.to(this.missFeedbackRef.nativeElement, { opacity: 0, duration: 0.3, delay: 0.55 });
        },
      },
    );

    this.ngZone.run(() => { this.attemptsLeft--; });

    setTimeout(() => {
      // Retract arrow back to held position
      gsap.to(this.arrowGroup.position, { x: 0.3, y: -0.8, z: 4.5, duration: 0.45, ease: 'power2.inOut' });

      if (this.attemptsLeft <= 0) {
        this.ngZone.run(() => { this.gameOver = true; });
      } else {
        setTimeout(() => {
          this.fired = false;
          gsap.to(this.aimLineMat, { opacity: 0.55, duration: 0.35 });
          gsap.to(this.instructionRef.nativeElement, { opacity: 1, y: 0, duration: 0.4 });
        }, 450);
      }
    }, 950);
  }

  // ── Portal transition ─────────────────────────────────────

  private portalTransition(): void {
    gsap.to(this.hitFeedbackRef.nativeElement, { opacity: 0, duration: 0.3 });

    const tl = gsap.timeline({
      onComplete: () => this.ngZone.run(() => this.completed.emit()),
    });

    // Rings spin faster and faster
    tl.to(this.targetGroup.rotation, {
      z: Math.PI * 6,
      duration: 1.7,
      ease: 'power2.in',
    }, 0);

    // Camera rockets through the bullseye
    tl.to(this.camera.position, {
      z: -1.5,
      duration: 1.85,
      ease: 'power3.in',
    }, 0);

    // Target scales up to swallow the screen
    tl.to(this.targetGroup.scale, {
      x: 20, y: 20, z: 20,
      duration: 1.85,
      ease: 'power3.in',
    }, 0.18);

    // All ring emissive intensities ramp up to white
    this.ringMats.forEach((m) => {
      tl.to(m, { emissiveIntensity: 6, duration: 1, ease: 'power2.in' }, 0.2);
    });

    // Signal home to show the star veil (black + stars) — bridges the exit
    tl.call(() => this.ngZone.run(() => this.transitioning.emit()), [], 1.3);

    // Canvas fades behind the veil
    tl.to(this.canvasRef.nativeElement, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in',
    }, 1.45);

    // Full container fades out
    tl.to(this.containerRef.nativeElement, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
    }, 1.6);
  }

  // ── Render loop ───────────────────────────────────────────

  private loop = (): void => {
    this.animId = requestAnimationFrame(this.loop);

    const now  = performance.now();
    const dt   = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.05) : 0;
    this.lastTime = now;
    const t = now / 1000;

    // ── Wobble ──
    if (!this.fired) {
      this.wobbleT += dt;
      this.wobbleX = Math.sin(this.wobbleT * 1.4) * 18 + Math.sin(this.wobbleT * 0.65) * 9;
      this.wobbleY = Math.cos(this.wobbleT * 1.1) * 13 + Math.cos(this.wobbleT * 0.5)  * 6;
    }

    if (!this.won && !this.gameOver && !this.fired) {

      // Wobbled aim → NDC → 3D on target plane
      const aimSX = this.mouseX + this.wobbleX;
      const aimSY = this.mouseY + this.wobbleY;
      const ndx = (aimSX / window.innerWidth)  *  2 - 1;
      const ndy = (aimSY / window.innerHeight) * -2 + 1;
      this._raycaster.setFromCamera(new THREE.Vector2(ndx, ndy), this.camera);
      this._raycaster.ray.intersectPlane(this._plane, this._aim3D);

      // Arrow sits in a "held / about-to-throw" position — visible in the lower-right
      // foreground.  Small parallax follows the mouse so it feels alive.
      const heldX = 0.32 + ndx * 0.14;
      const heldY = -0.72 + ndy * 0.09;
      this.arrowGroup.position.x += (heldX - this.arrowGroup.position.x) * 0.1;
      this.arrowGroup.position.y += (heldY - this.arrowGroup.position.y) * 0.1;
      this.arrowGroup.position.z  = 4.5;
      // Tip is at local -Z; lookAt makes group's -Z face the aim point → tip faces board
      this.arrowGroup.lookAt(this._aim3D.x, this._aim3D.y, 0);

      // Dashed aim line: arrow tip → aim point on target
      const ap = this.arrowGroup.position;
      const linePos = new Float32Array([
        ap.x, ap.y, ap.z,
        this._aim3D.x, this._aim3D.y, 0.1,
      ]);
      this.aimLine.geometry.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
      this.aimLine.computeLineDistances();

      // Crosshair on screen at wobbled position
      if (this.crosshairRef?.nativeElement) {
        gsap.set(this.crosshairRef.nativeElement, {
          x: aimSX, y: aimSY, xPercent: -50, yPercent: -50,
        });

        // Check if crosshair is over bullseye (screen-space check)
        const cx = window.innerWidth  / 2;
        const cy = window.innerHeight / 2;
        // Project bullseye edge point to screen
        const bsEdge = new THREE.Vector3(0.25, 0, 0).project(this.camera);
        const bsSX   = (bsEdge.x + 1) / 2 * window.innerWidth;
        const bsR    = Math.abs(bsSX - cx) * 1.7; // generous hit zone for visual feedback
        const d      = Math.sqrt((aimSX - cx) ** 2 + (aimSY - cy) ** 2);
        this.crosshairRef.nativeElement.classList.toggle('di-crosshair--locked', d < bsR);
      }

      // Camera drifts subtly with mouse
      this.camera.position.x += ((ndx * 0.22) - this.camera.position.x) * 0.04;
      this.camera.position.y += ((ndy * 0.16) - this.camera.position.y) * 0.04;
      this.camera.lookAt(0, 0, 0);
    }

    // Target rings idle animation
    if (!this.won) {
      this.targetGroup.position.y = Math.sin(t * 0.7) * 0.06;
      this.rings.forEach((ring, i) => {
        ring.rotation.z += i % 2 === 0 ?  0.0045 : -0.0035;
        ring.rotation.x  = Math.sin(t * 0.4 + i) * 0.045;
      });
    } else {
      // After win — rings accelerate
      this.rings.forEach((ring, i) => {
        ring.rotation.z += i % 2 === 0 ? 0.028 : -0.022;
      });
    }

    this.renderer.render(this.scene, this.camera);
  };
}
