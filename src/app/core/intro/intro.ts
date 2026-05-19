import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  Output,
  EventEmitter,
  inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import * as THREE from 'three';
import { gsap } from 'gsap';

import { SelectionService, Work, WORKS } from '../service/selection-service';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro.html',
  styleUrl: './intro.scss',
})
export class Intro implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('introRoot', { static: true }) introRoot!: ElementRef<HTMLElement>;
  @ViewChild('hudCategory', { static: true }) hudCategory!: ElementRef;
  @ViewChild('hudClient', { static: true }) hudClient!: ElementRef;
  @ViewChild('hudHint', { static: true }) hudHint!: ElementRef;
  @ViewChild('progress', { static: true }) progress!: ElementRef;

  @Output() completed = new EventEmitter<Work>();

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private selSvc = inject(SelectionService);

  // ── Three.js ──
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private rafId: number | null = null;
  private clock = new THREE.Clock();

  // ── Panels ──
  private panels: Panel[] = [];
  private hovered: Panel | null = null;
  private locked = false;

  // ── Input ──
  private mouse = new THREE.Vector2();
  private mouseTarget = new THREE.Vector2();
  private mouseSmooth = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();

  // ── Haze ──
  private hazeMat!: THREE.ShaderMaterial;
  private hazeUniforms!: Record<string, THREE.IUniform>;

  // ── Layout: same as the working preview ──
  private readonly LAYOUT = [
    { x: -8.5, y: 1.2, z: -1, ry: 0.35 },
    { x: -3.5, y: -1.5, z: 3, ry: 0.18 },
    { x: 1.5, y: 1.6, z: 1, ry: 0.05 },
    { x: 6.0, y: -1.0, z: -2, ry: -0.22 },
    { x: -6.5, y: -3.5, z: 4, ry: 0.28 },
    { x: 4.0, y: 3.2, z: -3, ry: -0.15 },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => {
      try {
        this.init();
        this.buildPanels();
        this.entrance();
        this.bindEvents();
        this.loop();
        console.log('[PitchRoom] ready');
      } catch (e) {
        console.error('[PitchRoom] init error:', e);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    const stage = this.introRoot.nativeElement;
    stage.removeEventListener('mousemove', this.onMouseMove);
    stage.removeEventListener('click', this.onClickStage);
    stage.removeEventListener('touchstart', this.onTouchStart as any);
    stage.removeEventListener('touchend', this.onTouchEnd as any);
    window.removeEventListener('resize', this.onResize);
    this.panels.forEach((p) => {
      p.geo.dispose();
      p.mat.dispose();
      p.tex.dispose();
      p.glowGeo.dispose();
      p.glowMat.dispose();
    });
    this.hazeMat?.dispose();
    this.renderer?.dispose();
  }

  // ─────────────────────────────────────────────────────────
  //  INIT
  // ─────────────────────────────────────────────────────────

  private init(): void {
    const stage = this.introRoot.nativeElement;
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: true,
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0612, 1);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0612, 0.045);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 200);
    this.camera.position.set(0, 0, 18);

    // Haze background
    this.hazeUniforms = {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#0a0612') },
      uColorB: { value: new THREE.Color('#1a0935') },
      uColorAccent: { value: new THREE.Color('#8a4fff') },
    };
    this.hazeMat = new THREE.ShaderMaterial({
      uniforms: this.hazeUniforms,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime; uniform vec3 uColorA, uColorB, uColorAccent;
        varying vec2 vUv;
        float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
        float n(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
          return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y); }
        float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){v+=a*n(p);p*=2.0;a*=0.5;} return v; }
        void main(){
          float n1=fbm(vUv*3.0+vec2(uTime*.05,uTime*.03));
          float n2=fbm(vUv*1.3+vec2(-uTime*.02,uTime*.04));
          vec3 col=mix(uColorA,uColorB,n1);
          col=mix(col,uColorAccent*.4,smoothstep(.5,.9,n2)*.4);
          col*=0.5+0.5*smoothstep(1.5,.3,length(vUv-.5));
          gl_FragColor=vec4(col,1.0);
        }
      `,
    });
    const hazeMesh = new THREE.Mesh(new THREE.PlaneGeometry(140, 80), this.hazeMat);
    hazeMesh.position.z = -25;
    this.scene.add(hazeMesh);
  }

  // ─────────────────────────────────────────────────────────
  //  PANELS — identical logic to the working preview
  // ─────────────────────────────────────────────────────────

  private buildPanels(): void {
    WORKS.forEach((work, i) => {
      const slot = this.LAYOUT[i];

      // Canvas texture
      const tex = this.paintPanel(work, i);

      // Main plane
      const geo = new THREE.PlaneGeometry(4.2, 2.8);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(slot.x, slot.y, slot.z);
      mesh.rotation.y = slot.ry;
      mesh.userData['baseY'] = slot.y;
      mesh.userData['baseZ'] = slot.z;
      mesh.userData['phase'] = i * 0.7;
      this.scene.add(mesh);

      // Glow plane
      const glowGeo = new THREE.PlaneGeometry(5.4, 4.0);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(work.color),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(mesh.position);
      glow.position.z -= 0.05;
      glow.rotation.y = slot.ry;
      this.scene.add(glow);

      this.panels.push({ work, mesh, geo, mat, tex, glow, glowGeo, glowMat });
    });
  }

  private paintPanel(work: Work, idx: number): THREE.CanvasTexture {
    const W = 1024,
      H = 640;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0d0820');
    const wk = new THREE.Color(work.color).multiplyScalar(0.55);
    bg.addColorStop(1, '#' + wk.getHexString());
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Blob glow
    const c2 = new THREE.Color(work.color);
    const r = Math.round(c2.r * 255),
      g = Math.round(c2.g * 255),
      b = Math.round(c2.b * 255);
    const blob = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, W * 0.5);
    blob.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
    blob.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, W, H);

    // Text
    ctx.fillStyle = work.color;
    ctx.font = '700 14px Inter, sans-serif';
    ctx.fillText('CASE STUDY', 50, 50);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText(String(idx + 1).padStart(2, '0'), 50, 80);

    ctx.fillStyle = work.color;
    ctx.fillRect(50, 95, 60, 3);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 64px Inter, sans-serif';
    ctx.fillText(work.category, 50, 220);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '500 32px Inter, sans-serif';
    ctx.fillText(work.title, 50, 280);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '500 20px Inter, sans-serif';
    ctx.fillText(work.client.toUpperCase(), 50, H - 60);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  // ─────────────────────────────────────────────────────────
  //  ENTRANCE
  // ─────────────────────────────────────────────────────────

  private entrance(): void {
    const tl = gsap.timeline();
    this.panels.forEach((p, i) => {
      const baseZ = p.mesh.userData['baseZ'];
      gsap.set(p.mesh.position, { z: baseZ - 25 });
      gsap.set(p.glow.position, { z: baseZ - 25 - 0.05 });
      tl.to(p.mesh.position, { z: baseZ, duration: 1.4, ease: 'power3.out' }, i * 0.1);
      tl.to(p.glow.position, { z: baseZ - 0.05, duration: 1.4, ease: 'power3.out' }, i * 0.1);
      tl.to(p.mat, { opacity: 0.92, duration: 0.9 }, i * 0.1 + 0.2);
    });
    gsap.fromTo(
      [this.hudHint.nativeElement, this.progress.nativeElement],
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 1.4, stagger: 0.1 },
    );
  }

  // ─────────────────────────────────────────────────────────
  //  EVENTS — attached to the stage div, same as the preview
  // ─────────────────────────────────────────────────────────

  private bindEvents(): void {
    const stage = this.introRoot.nativeElement;

    // Arrow-function members so removeEventListener works
    stage.addEventListener('mousemove', this.onMouseMove, { passive: true });
    stage.addEventListener('click', this.onClickStage);
    stage.addEventListener('touchstart', this.onTouchStart as any, { passive: true });
    stage.addEventListener('touchend', this.onTouchEnd as any);
    window.addEventListener('resize', this.onResize);
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (this.locked) return;
    const r = this.introRoot.nativeElement.getBoundingClientRect();
    this.mouseTarget.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouseTarget.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  };

  private onClickStage = (e: MouseEvent): void => {
    if (this.locked) return;

    // Sync raycaster from click position (don't trust this.hovered)
    const r = this.introRoot.nativeElement.getBoundingClientRect();
    const ndx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ndy = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(ndx, ndy), this.camera);
    const hits = this.raycaster.intersectObjects(
      this.panels.map((p) => p.mesh),
      false,
    );
    const target =
      hits.length > 0
        ? (this.panels.find((p) => p.mesh === hits[0].object) ?? this.hovered)
        : this.hovered;

    console.log('[PitchRoom] click — target:', target?.work.category ?? 'none');
    if (target) this.flyInto(target);
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 0 || this.locked) return;
    const t = e.touches[0];
    const r = this.introRoot.nativeElement.getBoundingClientRect();
    this.mouseTarget.x = ((t.clientX - r.left) / r.width) * 2 - 1;
    this.mouseTarget.y = -((t.clientY - r.top) / r.height) * 2 + 1;
    this.mouseSmooth.copy(this.mouseTarget);
    // Pre-hover so touchEnd can fire
    this.raycaster.setFromCamera(this.mouseTarget, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.panels.map((p) => p.mesh),
      false,
    );
    this.hovered =
      hits.length > 0 ? (this.panels.find((p) => p.mesh === hits[0].object) ?? null) : null;
  };

  private onTouchEnd = (_e: TouchEvent): void => {
    if (this.locked || !this.hovered) return;
    this.flyInto(this.hovered);
  };

  private onResize = (): void => {
    const stage = this.introRoot.nativeElement;
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // ─────────────────────────────────────────────────────────
  //  HOVER STATE
  // ─────────────────────────────────────────────────────────

  private setHovered(next: Panel | null): void {
    if (this.hovered && this.hovered !== next) {
      gsap.to(this.hovered.mesh.scale, { x: 1, y: 1, duration: 0.4 });
      gsap.to(this.hovered.glowMat, { opacity: 0, duration: 0.4 });
    }

    if (!next) {
      this.panels.forEach((p) => gsap.to(p.mat, { opacity: 0.92, duration: 0.4 }));
      gsap.to(this.hudCategory.nativeElement, { opacity: 0, duration: 0.3 });
      gsap.to(this.hudClient.nativeElement, { opacity: 0, duration: 0.3 });
    } else {
      this.panels.forEach((p) =>
        gsap.to(p.mat, { opacity: p === next ? 1.0 : 0.45, duration: 0.4 }),
      );
      gsap.to(next.mesh.scale, { x: 1.08, y: 1.08, duration: 0.5, ease: 'power3.out' });
      gsap.to(next.glowMat, { opacity: 0.55, duration: 0.5 });

      const cat = this.hudCategory.nativeElement;
      const cli = this.hudClient.nativeElement;
      cat.textContent = next.work.category;
      cli.textContent = next.work.client;
      cat.style.color = next.work.color;
      gsap.fromTo(
        cat,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
      );
      gsap.fromTo(
        cli,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.05 },
      );
    }

    this.hovered = next;
  }

  // ─────────────────────────────────────────────────────────
  //  FLY INTO — identical logic to the working preview
  // ─────────────────────────────────────────────────────────

  // ── Animation state for manual fly-in ──
  private flyTarget: Panel | null = null;
  private flyProgress = 0;
  private flyDuration = 1.5;
  private flyStart: Record<string, number> = {};
  private lastTime = 0;

  private flyInto(target: Panel): void {
    if (this.locked) return;
    this.locked = true;
    console.log('[PitchRoom] flyInto →', target.work.category);

    gsap.to(this.hudHint.nativeElement, { opacity: 0, duration: 0.3 });

    // Snapshot starting positions for lerp
    this.flyStart = {
      tx: target.mesh.position.x,
      ty: target.mesh.position.y,
      tz: target.mesh.position.z,
      try_: target.mesh.rotation.y,
      gx: target.glow.position.x,
      gy: target.glow.position.y,
      gz: target.glow.position.z,
      camZ: this.camera.position.z,
    };

    this.flyTarget = target;
    this.flyProgress = 0;

    // Fade other panels out immediately via opacity (CSS material prop — safe)
    this.panels
      .filter((p) => p !== target)
      .forEach((p) => {
        gsap.to(p.mat, { opacity: 0, duration: 0.6 });
        gsap.to(p.glowMat, { opacity: 0, duration: 0.6 });
      });
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private tickFlyAnimation(dt: number): void {
    if (!this.flyTarget) return;

    this.flyProgress = Math.min(this.flyProgress + dt / this.flyDuration, 1);
    if (Math.round(this.flyProgress * 10) % 3 === 0) {
      console.log(
        '[fly] progress:',
        this.flyProgress.toFixed(2),
        'dt:',
        dt.toFixed(4),
        'camZ:',
        this.camera.position.z.toFixed(2),
        'meshZ:',
        this.flyTarget.mesh.position.z.toFixed(2),
        'scale:',
        this.flyTarget.mesh.scale.x.toFixed(2),
      );
    }
    const t = this.easeInOut(this.flyProgress);
    const t2 = this.easeInOut(Math.max(0, (this.flyProgress - 0.3) / 0.7)); // delayed scale

    const s = this.flyStart;
    const tgt = this.flyTarget;

    // Move panel to center
    tgt.mesh.position.x = this.lerp(s['tx'], 0, t);
    tgt.mesh.position.y = this.lerp(s['ty'], 0, t);
    tgt.mesh.position.z = this.lerp(s['tz'], 5, t);
    tgt.mesh.rotation.y = this.lerp(s['try_'], 0, t);

    // Glow follows
    tgt.glow.position.x = this.lerp(s['gx'], 0, t);
    tgt.glow.position.y = this.lerp(s['gy'], 0, t);
    tgt.glow.position.z = this.lerp(s['gz'], 4.95, t);
    tgt.glow.rotation.y = tgt.mesh.rotation.y;

    // Scale up
    const scale = this.lerp(1, 12, t2);
    tgt.mesh.scale.set(scale, scale, 1);
    tgt.glow.scale.set(scale, scale, 1);

    // Glow opacity
    tgt.glowMat.opacity = this.lerp(0, 1, t);

    // Camera flies forward
    this.camera.position.z = this.lerp(s['camZ'], 5.1, t);
    this.camera.lookAt(0, 0, 0);

    // Haze color shift
    const hazeCol = this.hazeUniforms['uColorAccent'].value as THREE.Color;
    const targetCol = new THREE.Color(tgt.work.color);
    hazeCol.r = this.lerp(hazeCol.r, targetCol.r, dt * 1.5);
    hazeCol.g = this.lerp(hazeCol.g, targetCol.g, dt * 1.5);
    hazeCol.b = this.lerp(hazeCol.b, targetCol.b, dt * 1.5);

    // Done
    if (this.flyProgress >= 1) {
      console.log('[PitchRoom] → emitting completed');
      this.flyTarget = null;
      // Select AFTER animation so the Home component doesn't
      // destroy the Intro mid-flight
      this.selSvc.select(tgt.work);
      this.completed.emit(tgt.work);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  RENDER LOOP
  // ─────────────────────────────────────────────────────────

  private loop = (): void => {
    this.rafId = requestAnimationFrame(this.loop);
    const now = performance.now() / 1000;
    const dt = this.lastTime === 0 ? 0 : Math.min(now - this.lastTime, 0.05);
    this.lastTime = now;
    const t = now;

    this.hazeUniforms['uTime'].value = t;

    this.mouseSmooth.x += (this.mouseTarget.x - this.mouseSmooth.x) * 0.06;
    this.mouseSmooth.y += (this.mouseTarget.y - this.mouseSmooth.y) * 0.06;

    if (!this.locked) {
      // Camera drift
      this.camera.position.x += (this.mouseSmooth.x * 4 - this.camera.position.x) * 0.05;
      this.camera.position.y += (this.mouseSmooth.y * 2.5 - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);

      // Hover via raycaster
      this.raycaster.setFromCamera(this.mouseTarget, this.camera);
      const hits = this.raycaster.intersectObjects(
        this.panels.map((p) => p.mesh),
        false,
      );
      const next =
        hits.length > 0 ? (this.panels.find((p) => p.mesh === hits[0].object) ?? null) : null;
      if (next !== this.hovered) this.setHovered(next);

      // Idle float — ONLY when unlocked so GSAP owns transforms during flyInto
      this.panels.forEach((p) => {
        const by = p.mesh.userData['baseY'];
        const ty = by + Math.sin(t * 0.6 + p.mesh.userData['phase']) * 0.18;
        p.mesh.position.y += (ty - p.mesh.position.y) * 0.05;
        p.glow.position.y = p.mesh.position.y;
      });
    }

    // Manual fly animation — bypasses GSAP zone issues
    if (this.flyTarget) {
      this.tickFlyAnimation(dt);
    }

    this.renderer.render(this.scene, this.camera);
  };
}

// ── Types ──
interface Panel {
  work: Work;
  mesh: THREE.Mesh;
  geo: THREE.PlaneGeometry;
  mat: THREE.MeshBasicMaterial;
  tex: THREE.CanvasTexture;
  glow: THREE.Mesh;
  glowGeo: THREE.PlaneGeometry;
  glowMat: THREE.MeshBasicMaterial;
}
