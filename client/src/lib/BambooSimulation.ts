import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface BambooPole {
  mesh: THREE.Mesh;
  targetHeight: number;
  currentHeight: number;
  ageInYears: number;
  isHarvested: boolean;
  growthFactor: number;
}

export class BambooSimulation {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private bambooClump: BambooClump;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    
    this.camera.position.set(30, 5, 30);

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.shadowMap.enabled = true;
      container.appendChild(this.renderer.domElement);
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      throw new Error('WEBGL_NOT_AVAILABLE');
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 10, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI / 2;
    
    this.controls.update();

    this.setupLighting();
    this.setupGround();

    this.bambooClump = new BambooClump(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.bambooClump.container);

    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
    mainLight.position.set(20, 30, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;

    mainLight.shadow.camera.left = -30;
    mainLight.shadow.camera.right = 30;
    mainLight.shadow.camera.top = 30;
    mainLight.shadow.camera.bottom = -30;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;

    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight.position.set(-20, 15, -20);
    this.scene.add(fillLight);
  }

  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const primaryColor = 0xdddddd;
    const secondaryColor = 0xf2f2f2;
    const gridHelper = new THREE.GridHelper(
      100,
      100,
      primaryColor,
      secondaryColor,
    );
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    this.addScaleIndicator();
  }

  private addScaleIndicator(): void {
    const humanGroup = new THREE.Group();

    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    humanGroup.add(body);

    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    humanGroup.add(head);

    humanGroup.position.set(3, 0, 3);
    this.scene.add(humanGroup);
  }

  zoomIn(): void {
    if (this.controls.getDistance() > this.controls.minDistance + 5) {
      this.camera.position.multiplyScalar(0.8);
      this.controls.update();
    }
  }
  
  zoomOut(): void {
    if (this.controls.getDistance() < this.controls.maxDistance - 5) {
      this.camera.position.multiplyScalar(1.2);
      this.controls.update();
    }
  }
  
  resetCameraPosition(): void {
    this.camera.position.set(12, 12, 12);
    this.controls.target.set(0, 5, 0);
    this.controls.update();
  }
  
  topView(): void {
    this.camera.position.set(0, 30, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }
  
  sideView(): void {
    this.camera.position.set(20, 5, 0);
    this.controls.target.set(0, 5, 0);
    this.controls.update();
  }

  loadTerrain(terrainUrl: string): void {
    console.log("Terrain loading requested:", terrainUrl);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public update(progress: number): {
    height: number;
    poleCount: number;
    carbon: number;
  } {
    return this.bambooClump.update(progress);
  }

  public handleResize(): void {
    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
  }

  public cleanup(): void {
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    this.renderer.dispose();
  }
}

class BambooClump {
  public container: THREE.Group;
  private poles: BambooPole[] = [];
  private position: THREE.Vector3;
  private maxPoles: number = 100;
  private currentPoles: number = 0;
  private harvestedPoles: number = 0;
  private targetHeight: number = 0.5;
  private growthProgress: number = 0;
  private rhizomeMesh: THREE.Mesh | null = null;

  constructor(position: THREE.Vector3) {
    this.position = position;
    this.container = new THREE.Group();
    this.container.position.copy(position);

    this.createRhizomeMound();
    this.addNewPoles(5);
  }

  private createRhizomeMound(): void {
    const moundGeometry = new THREE.SphereGeometry(1.5, 16, 8);
    moundGeometry.scale(1, 0.3, 1);

    for (let i = 0; i < moundGeometry.attributes.position.count; i++) {
      const y = moundGeometry.attributes.position.getY(i);
      if (y < 0) {
        moundGeometry.attributes.position.setY(i, 0);
      }
    }

    const moundMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 1.0,
    });

    this.rhizomeMesh = new THREE.Mesh(moundGeometry, moundMaterial);
    this.rhizomeMesh.receiveShadow = true;
    this.rhizomeMesh.castShadow = true;
    this.container.add(this.rhizomeMesh);
  }

  private calculateHeight(progress: number): number {
    const maxHeight = 2.55;
    const minHeight = 0.5;
    
    const growthRate = 15;
    const midpoint = 0.3;
    
    const calculatedHeight = minHeight + (maxHeight - minHeight) / (1 + Math.exp(-growthRate * (progress - midpoint)));
    
    return calculatedHeight;
  }

  private calculatePoleCount(progress: number): number {
    const minPoles = 5;
    const growthRate = 15;
    const midpoint = 0.3;
    
    const calculatedPoleCount = minPoles + (this.maxPoles - minPoles) / 
      (1 + Math.exp(-growthRate * (progress - midpoint)));
    
    return Math.floor(calculatedPoleCount);
  }

  private calculateCarbon(height: number, poleCount: number): number {
    return parseFloat(((height / 27) * (poleCount / 90) * 87.5).toFixed(1));
  }

  private addNewPoles(count: number): void {
    const existingPositions: {x: number, z: number, radius: number}[] = [];
    
    this.poles.forEach(pole => {
      if (pole.mesh && !pole.isHarvested) {
        existingPositions.push({
          x: pole.mesh.position.x,
          z: pole.mesh.position.z,
          radius: pole.mesh.geometry instanceof THREE.CylinderGeometry ? 
                 (pole.mesh.geometry as THREE.CylinderGeometry).parameters.radiusBottom * 1.2 : 0.1
        });
      }
    });

    let attemptsCounter = 0;
    const maxAttempts = 100;
    
    for (let i = 0; i < count; i++) {
      let validPosition = false;
      let x = 0, z = 0, thickness = 0;
      
      while (!validPosition && attemptsCounter < maxAttempts) {
        attemptsCounter++;
        
        let radius;
        
        if (Math.random() < 0.3) {
          radius = Math.random() * 0.6;
        } else {
          radius = 0.8 + Math.random() * 1.0;
        }
        
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        
        if (radius < 0.6) {
          thickness = 0.06 + Math.random() * 0.04;
        } else {
          thickness = 0.12 + Math.random() * 0.06;
        }
        
        validPosition = true;
        
        for (const pos of existingPositions) {
          const dx = x - pos.x;
          const dz = z - pos.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance < (thickness + pos.radius)) {
            validPosition = false;
            break;
          }
        }
      }
      
      if (!validPosition) {
        continue;
      }
      
      existingPositions.push({
        x: x,
        z: z,
        radius: thickness * 1.2
      });

      const heightVariation = 30 + Math.random() * 25;
      const height = heightVariation;
      
      const topThinning = 0.7 + Math.random() * 0.4;
      
      const poleGeometry = new THREE.CylinderGeometry(
        thickness * topThinning,
        thickness * (1.1 + Math.random() * 0.2),
        height,
        8,
      );
      poleGeometry.translate(0, height / 2, 0);

      const poleMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          0.02 + Math.random() * 0.02,
          0.15 + Math.random() * 0.1,
          0.01 + Math.random() * 0.03,
        ),
        roughness: 0.6 + Math.random() * 0.3,
        metalness: 0.05 + Math.random() * 0.1,
      });

      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(x, 0, z);
      pole.castShadow = true;
      pole.receiveShadow = true;

      pole.scale.y = 0.01;

      const tiltAngle = Math.PI * 0.02;
      
      const outwardDirection = new THREE.Vector2(x, z).normalize();
      
      pole.rotation.x = (outwardDirection.y * 0.01) + (Math.random() - 0.5) * tiltAngle;
      pole.rotation.z = (-outwardDirection.x * 0.01) + (Math.random() - 0.5) * tiltAngle;

      const growthRateFactor = 1.2 + Math.random() * 0.4;
      
      const poleObject: BambooPole = {
        mesh: pole,
        targetHeight: height,
        currentHeight: 0.5,
        ageInYears: 0,
        isHarvested: false,
        growthFactor: growthRateFactor,
      };

      this.poles.push(poleObject);
      this.container.add(pole);
    }

    this.currentPoles += count;
  }

  private harvestMaturePoles(growthProgress: number): void {
    if (growthProgress < 0.3) return;

    const maturePoles = this.poles.filter(
      (pole) => pole.ageInYears >= 3 && !pole.isHarvested,
    );

    const polesToHarvest = Math.ceil(maturePoles.length * 0.2);

    if (polesToHarvest === 0) return;

    maturePoles.sort((a, b) => b.ageInYears - a.ageInYears);

    for (let i = 0; i < polesToHarvest && i < maturePoles.length; i++) {
      const pole = maturePoles[i];
      pole.isHarvested = true;

      if (pole.mesh.material instanceof THREE.MeshStandardMaterial) {
        pole.mesh.material.opacity = 0.3;
        pole.mesh.material.transparent = true;
      }

      this.harvestedPoles++;
    }
  }

  public update(growthProgress: number): {
    height: number;
    poleCount: number;
    carbon: number;
  } {
    this.growthProgress = Math.max(0, Math.min(1, growthProgress));

    this.targetHeight = this.calculateHeight(this.growthProgress);
    const targetPoles = this.calculatePoleCount(this.growthProgress);

    if (targetPoles > this.currentPoles) {
      this.addNewPoles(targetPoles - this.currentPoles);
    }

    if (Math.random() < 0.02 && this.growthProgress > 0.5) {
      this.harvestMaturePoles(this.growthProgress);
    }

    this.poles.forEach((pole) => {
      pole.ageInYears = this.growthProgress * 10;

      if (pole.isHarvested) return;

      const normalizedHeight = (this.targetHeight - 0.5) / (4.5 - 0.5);
      
      const individualGrowth = normalizedHeight * (pole.growthFactor || 1.0);
      
      const scaleY = Math.min(0.99, Math.max(0.01, individualGrowth * 0.99 + 0.01));
      
      pole.mesh.scale.y = scaleY;

      pole.currentHeight = pole.targetHeight * scaleY;

      const maturityFactor = Math.min(pole.ageInYears / 5, 1);
      const hue = 0.25 + (0.08 + Math.random() * 0.04) * maturityFactor;
      const saturation = 0.8 - (0.25 + Math.random() * 0.1) * maturityFactor;
      const lightness = 0.45 + Math.random() * 0.1;

      if (pole.mesh.material instanceof THREE.MeshStandardMaterial) {
        pole.mesh.material.color.setHSL(hue, saturation, lightness);
      }
    });

    const finalHeight = Math.max(0.5, this.targetHeight);
    const finalPoleCount = Math.max(5, this.currentPoles - this.harvestedPoles);
    const finalCarbon = Math.max(
      0,
      this.calculateCarbon(finalHeight, finalPoleCount),
    );

    return {
      height: finalHeight,
      poleCount: finalPoleCount,
      carbon: finalCarbon,
    };
  }
}
