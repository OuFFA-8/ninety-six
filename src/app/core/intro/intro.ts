import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import * as THREE from 'three';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [],
  templateUrl: './intro.html',
  styleUrl: './intro.scss',
})
export class Intro implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('aimDot') aimDot!: ElementRef;
  @ViewChild('instruction') instruction!: ElementRef;
  @ViewChild('hitFeedback') hitFeedback!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId!: number;

  // Target (Logo rings)
  private targetGroup!: THREE.Group;
  private rings: THREE.Mesh[] = [];
  private centerDot!: THREE.Mesh;

  // Arrow
  private arrowGroup!: THREE.Group;
  private isAiming = false;
  private aimStart = { x: 0, y: 0 };
  private currentAim = { x: 0, y: 0 };
  private arrowFired = false;
  private hasWon = false;

  // Aim line
  private aimLine!: THREE.Line;

  // Mouse
  private mouse = { x: 0, y: 0 };
  private mouseMoveHandler!: (e: MouseEvent) => void;
  private mouseDownHandler!: (e: MouseEvent) => void;
  private mouseUpHandler!: (e: MouseEvent) => void;
  private touchStartHandler!: (e: TouchEvent) => void;
  private touchMoveHandler!: (e: TouchEvent) => void;
  private touchEndHandler!: (e: TouchEvent) => void;

  constructor(private router: Router) {}

  ngAfterViewInit() {
    this.initThree();
    this.initEvents();
    this.entranceAnimation();
  }

  initThree() {
    const canvas = this.canvasRef.nativeElement;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080808, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.z = 6;

    // Fog for depth
    this.scene.fog = new THREE.FogExp2(0x080808, 0.04);

    this.createTarget();
    this.createArrow();
    this.createAimLine();
    this.createBackground();
    this.createLights();

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    this.animate();
  }

  createTarget() {
    this.targetGroup = new THREE.Group();
    this.targetGroup.position.z = 0;

    const ringData = [
      { r: 1.8, tube: 0.04, color: 0x2a1a4a, emissive: 0x1a0a2a },
      { r: 1.4, tube: 0.045, color: 0x3d1a7a, emissive: 0x2a0a5a },
      { r: 1.0, tube: 0.05, color: 0x5c2ea8, emissive: 0x3d1a7a },
      { r: 0.6, tube: 0.055, color: 0x8a4fff, emissive: 0x6a3bbf },
      { r: 0.25, tube: 0.06, color: 0xc49bff, emissive: 0x8a4fff },
    ];

    ringData.forEach((data, i) => {
      const geo = new THREE.TorusGeometry(data.r, data.tube, 16, 120);
      const mat = new THREE.MeshStandardMaterial({
        color: data.color,
        emissive: data.emissive,
        emissiveIntensity: 0.6,
        metalness: 0.9,
        roughness: 0.1,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.userData['index'] = i;
      ring.userData['baseEmissive'] = data.emissive;
      this.rings.push(ring);
      this.targetGroup.add(ring);
    });

    // Center bullseye dot
    const dotGeo = new THREE.SphereGeometry(0.1, 32, 32);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xc49bff,
      emissiveIntensity: 2,
      metalness: 1,
      roughness: 0,
    });
    this.centerDot = new THREE.Mesh(dotGeo, dotMat);
    this.targetGroup.add(this.centerDot);

    // Outer glow ring
    const glowGeo = new THREE.TorusGeometry(2.1, 0.02, 8, 100);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x8a4fff,
      transparent: true,
      opacity: 0.3,
    });
    const glowRing = new THREE.Mesh(glowGeo, glowMat);
    this.targetGroup.add(glowRing);

    // Start invisible
    this.targetGroup.scale.set(0, 0, 0);
    this.scene.add(this.targetGroup);
  }

  createArrow() {
    this.arrowGroup = new THREE.Group();

    // Shaft - على طول المحور Z
    const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xd4a843,
      metalness: 0.8,
      roughness: 0.2,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.x = Math.PI / 2; // على طول Z
    this.arrowGroup.add(shaft);

    // Tip
    const tipGeo = new THREE.ConeGeometry(0.04, 0.2, 8);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 1,
      roughness: 0,
      emissive: 0x8a4fff,
      emissiveIntensity: 0.3,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = -0.7; // الطرف الأمامي
    this.arrowGroup.add(tip);

    // Feathers
    const featherGeo = new THREE.BoxGeometry(0.15, 0.08, 0.01);
    const featherMat = new THREE.MeshStandardMaterial({
      color: 0x8a4fff,
      emissive: 0x8a4fff,
      emissiveIntensity: 0.5,
    });
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((rot) => {
      const f = new THREE.Mesh(featherGeo, featherMat);
      f.position.z = 0.5;
      f.position.y = 0.06;
      f.rotation.z = rot;
      this.arrowGroup.add(f);
    });

    this.arrowGroup.position.set(0, -3, 3);
    this.arrowGroup.scale.set(0, 0, 0);
    this.scene.add(this.arrowGroup);
  }

  createAimLine() {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x8a4fff,
      transparent: true,
      opacity: 0,
    });
    this.aimLine = new THREE.Line(geo, mat);
    this.scene.add(this.aimLine);
  }

  createBackground() {
    // Starfield
    const count = 1500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = (Math.random() - 0.5) * 40;
      positions[i + 2] = (Math.random() - 0.5) * 30 - 5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.025,
      color: 0x8a4fff,
      transparent: true,
      opacity: 0.5,
    });
    this.scene.add(new THREE.Points(geo, mat));

    // Grid floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x8a4fff, 0x1a0a3a);
    gridHelper.position.y = -4;
    (gridHelper.material as THREE.LineBasicMaterial).opacity = 0.3;
    (gridHelper.material as THREE.LineBasicMaterial).transparent = true;
    this.scene.add(gridHelper);
  }

  createLights() {
    this.scene.add(new THREE.AmbientLight(0x8a4fff, 0.4));

    const main = new THREE.PointLight(0xc49bff, 3, 20);
    main.position.set(0, 3, 5);
    this.scene.add(main);

    const fill = new THREE.PointLight(0x8a4fff, 2, 15);
    fill.position.set(-3, -2, 3);
    this.scene.add(fill);

    const back = new THREE.PointLight(0x4a1a9a, 1.5, 10);
    back.position.set(0, 0, -3);
    this.scene.add(back);
  }

  entranceAnimation() {
    const tl = gsap.timeline({ delay: 0.3 });

    // Target appears
    tl.to(this.targetGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.5,
      ease: 'elastic.out(1, 0.5)',
    })

      // Arrow appears
      .to(
        this.arrowGroup.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.8,
          ease: 'back.out(2)',
        },
        '-=0.5',
      )

      // Instruction fades in
      .to(
        this.instruction.nativeElement,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
        },
        '-=0.3',
      );
  }

  // ══════════════════════════════
  // EVENTS
  // ══════════════════════════════
  initEvents() {
    this.mouseMoveHandler = (e: MouseEvent) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
      if (this.isAiming) this.updateAimLine();
    };

    this.mouseDownHandler = (e: MouseEvent) => {
      if (this.arrowFired || this.hasWon) return;
      this.isAiming = true;
      this.aimStart = { x: e.clientX, y: e.clientY };
      this.showAimLine();
    };

    this.mouseUpHandler = (e: MouseEvent) => {
      if (!this.isAiming || this.arrowFired || this.hasWon) return;
      this.isAiming = false;
      this.hideAimLine();
      this.fireArrow();
    };

    // Touch support
    this.touchStartHandler = (e: TouchEvent) => {
      if (this.arrowFired || this.hasWon) return;
      const t = e.touches[0];
      this.isAiming = true;
      this.aimStart = { x: t.clientX, y: t.clientY };
      this.mouse.x = (t.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = -(t.clientY / window.innerHeight - 0.5) * 2;
      this.showAimLine();
    };

    this.touchMoveHandler = (e: TouchEvent) => {
      const t = e.touches[0];
      this.mouse.x = (t.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = -(t.clientY / window.innerHeight - 0.5) * 2;
      if (this.isAiming) this.updateAimLine();
    };

    this.touchEndHandler = () => {
      if (!this.isAiming || this.arrowFired || this.hasWon) return;
      this.isAiming = false;
      this.hideAimLine();
      this.fireArrow();
    };

    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
    window.addEventListener('touchstart', this.touchStartHandler);
    window.addEventListener('touchmove', this.touchMoveHandler);
    window.addEventListener('touchend', this.touchEndHandler);
  }

  showAimLine() {
    gsap.to(this.aimLine.material as THREE.LineBasicMaterial, {
      opacity: 0.6,
      duration: 0.2,
    });
  }

  hideAimLine() {
    gsap.to(this.aimLine.material as THREE.LineBasicMaterial, {
      opacity: 0,
      duration: 0.2,
    });
  }

  updateAimLine() {
    // Draw line from arrow to target direction
    const start = new THREE.Vector3(this.mouse.x * 3, this.mouse.y * 3 - 1, 3);
    const end = new THREE.Vector3(0, 0, 0);

    const positions = new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z]);
    this.aimLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Arrow follows mouse when aiming
    gsap.to(this.arrowGroup.position, {
      x: this.mouse.x * 3,
      y: this.mouse.y * 3 - 1,
      duration: 0.1,
    });

    // Arrow points toward target
    const dir = new THREE.Vector3(-this.mouse.x * 3, -(this.mouse.y * 3 - 1), -3).normalize();
    this.arrowGroup.lookAt(0, 0, 0);
  }

  fireArrow() {
    if (this.arrowFired) return;
    this.arrowFired = true;

    // Hide instruction
    gsap.to(this.instruction.nativeElement, { opacity: 0, duration: 0.3 });

    // Calc accuracy - how close mouse was to center
    const accuracy = Math.sqrt(this.mouse.x * this.mouse.x + this.mouse.y * this.mouse.y);

    // Fire arrow toward center
    const tl = gsap.timeline();

    tl.to(this.arrowGroup.position, {
      x: 0,
      y: 0,
      z: 0.1,
      duration: 0.35,
      ease: 'power3.in',
    }).call(() => {
      // Check hit - always hit (as per requirement) but show accuracy ring
      this.onHit(accuracy);
    });
  }

  onHit(accuracy: number) {
    this.hasWon = true;

    // Determine which ring was hit based on accuracy
    const hitRingIndex = Math.min(Math.floor(accuracy * 4), 4);

    // Flash hit ring
    const hitRing = this.rings[hitRingIndex];
    if (hitRing) {
      gsap.to(hitRing.material as THREE.MeshStandardMaterial, {
        emissiveIntensity: 3,
        duration: 0.1,
        yoyo: true,
        repeat: 3,
      });
    }

    // Center bullseye flash
    gsap.to(this.centerDot.material as THREE.MeshStandardMaterial, {
      emissiveIntensity: 5,
      duration: 0.15,
      yoyo: true,
      repeat: 5,
    });

    // Show hit feedback
    gsap.to(this.hitFeedback.nativeElement, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: 'back.out(2)',
    });

    // All rings light up
    this.rings.forEach((ring, i) => {
      gsap.to(ring.material as THREE.MeshStandardMaterial, {
        emissiveIntensity: 2,
        duration: 0.3,
        delay: i * 0.08,
      });
    });

    // Camera shake
    gsap.to(this.camera.position, {
      x: 0.15,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.camera.position.x = 0;
      },
    });

    // After 1.5s - portal transition
    setTimeout(() => this.portalTransition(), 1500);
  }

  portalTransition() {
    // Hide feedback
    gsap.to(this.hitFeedback.nativeElement, { opacity: 0, duration: 0.3 });

    const tl = gsap.timeline({
      onComplete: () => {
        this.router.navigate(['/']);
      },
    });

    // Target spins and scales up
    tl.to(
      this.targetGroup.rotation,
      {
        z: Math.PI * 4,
        duration: 1.5,
        ease: 'power2.in',
      },
      0,
    )

      // Camera flies INTO the center dot
      .to(
        this.camera.position,
        {
          z: -2,
          duration: 1.8,
          ease: 'power3.in',
        },
        0,
      )

      // Target scales up to fill screen
      .to(
        this.targetGroup.scale,
        {
          x: 15,
          y: 15,
          z: 15,
          duration: 1.8,
          ease: 'power3.in',
        },
        0.2,
      )

      // Fade to black
      .to(
        this.canvasRef.nativeElement,
        {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
        },
        1.5,
      );
  }

  // ══════════════════════════════
  // RENDER LOOP
  // ══════════════════════════════
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    const time = Date.now() * 0.001;

    if (!this.arrowFired) {
      // Target gentle float + rotation
      this.targetGroup.position.y = Math.sin(time * 0.8) * 0.08;
      this.rings.forEach((ring, i) => {
        ring.rotation.z += i % 2 === 0 ? 0.004 : -0.003;
        ring.rotation.x = Math.sin(time * 0.4 + i) * 0.05;
      });

      // Camera follows mouse slightly
      this.camera.position.x += (this.mouse.x * 0.3 - this.camera.position.x) * 0.05;
      this.camera.position.y += (this.mouse.y * 0.2 - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);

      // Arrow follows mouse when not aiming
      if (!this.isAiming) {
        gsap.to(this.arrowGroup.position, {
          x: this.mouse.x * 2.5,
          y: this.mouse.y * 2 - 1.5,
          z: 3,
          duration: 0.3,
        });
        this.arrowGroup.lookAt(0, 0, 0);
      }
    } else {
      // After firing - rings keep spinning faster
      this.rings.forEach((ring, i) => {
        ring.rotation.z += i % 2 === 0 ? 0.02 : -0.015;
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('mousedown', this.mouseDownHandler);
    window.removeEventListener('mouseup', this.mouseUpHandler);
    window.removeEventListener('touchstart', this.touchStartHandler);
    window.removeEventListener('touchmove', this.touchMoveHandler);
    window.removeEventListener('touchend', this.touchEndHandler);
  }
}
