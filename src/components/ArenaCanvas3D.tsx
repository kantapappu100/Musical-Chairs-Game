import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Player, Chair, GamePhase } from '../types/game';
import { create3DChairModel, create3DPlayerModel } from '../utils/threeModels';

interface ArenaCanvas3DProps {
  phase: GamePhase;
  players: Player[];
  chairs: Chair[];
  eliminatedPlayerId: string | null;
  winnerPlayer: Player | null;
  onChairClick?: (chairId: string) => void;
  beatPulse?: number;
}

export const ArenaCanvas3D: React.FC<ArenaCanvas3DProps> = ({
  phase,
  players,
  chairs,
  eliminatedPlayerId,
  winnerPlayer,
  onChairClick,
  beatPulse = 0,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Keep references to scene objects across React renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const chairMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const playerMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const spotlightRef = useRef<THREE.SpotLight | null>(null);
  const discoLightRef = useRef<THREE.PointLight | null>(null);
  const notesGroupRef = useRef<THREE.Group | null>(null);

  // Latest props ref for 60fps render loop
  const propsRef = useRef({
    phase,
    players,
    chairs,
    eliminatedPlayerId,
    winnerPlayer,
    beatPulse,
  });

  useEffect(() => {
    propsRef.current = {
      phase,
      players,
      chairs,
      eliminatedPlayerId,
      winnerPlayer,
      beatPulse,
    };
  });

  // Scale arena 2D coordinate system (0..720, center 360) to 3D world units (e.g. radius ~ 5.5 to 8 units)
  const toWorldCoord = (canvasCoord: number) => (canvasCoord - 360) * 0.038;

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard as instructed by skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0b18);
    scene.fog = new THREE.FogExp2(0x0f0b18, 0.025);
    sceneRef.current = scene;

    // 2. 3D Perspective Camera angled slightly from above (Requirement 3)
    const aspect = container.clientWidth / (container.clientHeight || 1);
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, 14.5, 17.5);
    camera.lookAt(0, 0.8, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // 4. Lighting Rig
    // Cool Hemisphere sky/ground fill
    const hemiLight = new THREE.HemisphereLight(0xddd6fe, 0x1e1b4b, 0.7);
    scene.add(hemiLight);

    // Warm Directional Key Light with soft shadows
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    keyLight.position.set(8, 18, 10);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Ambient Center Disco Pulse Light
    const discoLight = new THREE.PointLight(0xf472b6, 1.2, 25);
    discoLight.position.set(0, 6, 0);
    scene.add(discoLight);
    discoLightRef.current = discoLight;

    // Dramatic Spotlight for Eliminations
    const spotLight = new THREE.SpotLight(0xef4444, 0, 30, Math.PI / 6, 0.35, 1);
    spotLight.position.set(0, 15, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);
    spotlightRef.current = spotLight;

    // 5. 3D Floor Plane with parquet ballroom textures
    const floorGeo = new THREE.CylinderGeometry(11.5, 11.5, 0.4, 64);

    // Procedural Wood Parquet Floor Canvas Texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fCtx = floorCanvas.getContext('2d')!;

    // Rich concentric disco ballroom floor
    const fGrad = fCtx.createRadialGradient(256, 256, 40, 256, 256, 256);
    fGrad.addColorStop(0, '#2e1065'); // deep plum disco
    fGrad.addColorStop(0.4, '#1e1b4b');
    fGrad.addColorStop(0.85, '#0f172a');
    fGrad.addColorStop(1, '#09090b');
    fCtx.fillStyle = fGrad;
    fCtx.fillRect(0, 0, 512, 512);

    // Concentric rings
    fCtx.strokeStyle = 'rgba(216, 180, 254, 0.18)';
    fCtx.lineWidth = 4;
    [90, 160, 220].forEach((r) => {
      fCtx.beginPath();
      fCtx.arc(256, 256, r, 0, Math.PI * 2);
      fCtx.stroke();
    });

    // Star burst / music note in center
    fCtx.fillStyle = '#f59e0b';
    fCtx.font = 'bold 48px sans-serif';
    fCtx.textAlign = 'center';
    fCtx.textBaseline = 'middle';
    fCtx.fillText('♫', 256, 256);

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.25,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Gold Outer Bevel Ring
    const trimGeo = new THREE.TorusGeometry(11.55, 0.12, 12, 64);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.8,
    });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 0;
    scene.add(trim);

    // Group for floating 3D music notes
    const notesGroup = new THREE.Group();
    scene.add(notesGroup);
    notesGroupRef.current = notesGroup;

    // 6. Raycasting Setup for 3D Chair Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== scene) {
          if (curr.userData.chairId && onChairClick) {
            onChairClick(curr.userData.chairId);
            return;
          }
          curr = curr.parent;
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('click', handleCanvasClick);

    // Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / (h || 1);
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 7. Continuous 60fps Animation Loop
    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();
      const currentProps = propsRef.current;

      // Pulse ambient disco light to beat
      if (discoLightRef.current) {
        const pulse = 1.0 + (currentProps.beatPulse || 0) * 1.5;
        discoLightRef.current.intensity = pulse;
      }

      // Smooth camera subtle orbiting / breathing for realism
      if (cameraRef.current) {
        const camAngle = Math.sin(time * 0.15) * 0.08;
        cameraRef.current.position.x = Math.sin(camAngle) * 18;
        cameraRef.current.position.z = Math.cos(camAngle) * 17.5;
        cameraRef.current.lookAt(0, 0.8, 0);
      }

      // Handle Dramatic Spotlight for Elimination
      if (spotlightRef.current) {
        if (currentProps.phase === 'ELIMINATION_SPOTLIGHT' && currentProps.eliminatedPlayerId) {
          const elimMesh = playerMeshesRef.current.get(currentProps.eliminatedPlayerId);
          if (elimMesh) {
            spotlightRef.current.intensity = 3.5;
            spotlightRef.current.target = elimMesh;
            spotlightRef.current.position.set(elimMesh.position.x, 10, elimMesh.position.z);
          }
        } else {
          spotlightRef.current.intensity = 0;
        }
      }

      // Update Player Animations (Walking Stride, Dancing Bob, Sitting Posture)
      currentProps.players.forEach((p) => {
        const pMesh = playerMeshesRef.current.get(p.id);
        if (!pMesh) return;

        const wx = toWorldCoord(p.x);
        const wz = toWorldCoord(p.y);

        // Smooth position interpolation
        pMesh.position.x = THREE.MathUtils.damp(pMesh.position.x, wx, 18, dt);
        pMesh.position.z = THREE.MathUtils.damp(pMesh.position.z, wz, 18, dt);

        const bodyPivot = pMesh.getObjectByName('body-pivot');
        const leftLeg = pMesh.getObjectByName('left-leg');
        const rightLeg = pMesh.getObjectByName('right-leg');
        const leftArm = pMesh.getObjectByName('left-arm');
        const rightArm = pMesh.getObjectByName('right-arm');
        const crown = pMesh.getObjectByName('winner-crown');

        // Winner crown visibility
        if (crown) {
          crown.visible = currentProps.winnerPlayer?.id === p.id;
          if (crown.visible) {
            crown.rotation.y += dt * 1.5;
          }
        }

        if (p.status === 'seated') {
          // SEAMLESS 3D SITTING POSTURE (Requirement 2)
          // Lower body onto chair cushion (~0.9m)
          pMesh.position.y = THREE.MathUtils.damp(pMesh.position.y, 0.0, 14, dt);
          if (bodyPivot) {
            bodyPivot.position.y = THREE.MathUtils.damp(bodyPivot.position.y, -0.4, 14, dt);
          }

          // Fold legs forward 90 degrees for realistic sitting
          if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, Math.PI / 2, 14, dt);
          if (rightLeg) rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, Math.PI / 2, 14, dt);

          // Relax arms on lap
          if (leftArm) leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, 0.3, 14, dt);
          if (rightArm) rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, 0.3, 14, dt);

          // Face outward from center
          const angleOutward = Math.atan2(pMesh.position.x, pMesh.position.z);
          pMesh.rotation.y = THREE.MathUtils.damp(pMesh.rotation.y, angleOutward, 14, dt);
        } else if (p.status === 'dancing') {
          // 3D WALKING / DANCING ANIMATION AROUND CIRCLE (Requirement 2)
          const danceCycle = time * 12 + p.danceStep;
          pMesh.position.y = Math.abs(Math.sin(danceCycle)) * 0.22;

          if (bodyPivot) {
            bodyPivot.position.y = 0;
            bodyPivot.rotation.z = Math.sin(danceCycle) * 0.08;
          }

          // Swing legs with walking stride
          const legSwing = Math.sin(danceCycle) * 0.7;
          if (leftLeg) leftLeg.rotation.x = legSwing;
          if (rightLeg) rightLeg.rotation.x = -legSwing;

          // Swing arms synchronously
          if (leftArm) leftArm.rotation.x = -legSwing * 0.8;
          if (rightArm) rightArm.rotation.x = legSwing * 0.8;

          // Face tangent velocity vector (clockwise rotation around circle)
          const tangentAngle = p.angle + Math.PI / 2;
          pMesh.rotation.y = THREE.MathUtils.damp(pMesh.rotation.y, -tangentAngle + Math.PI, 12, dt);
        } else if (p.status === 'scrambling') {
          // Rapid panic scramble sprint
          const scrambleCycle = time * 24;
          pMesh.position.y = Math.abs(Math.sin(scrambleCycle)) * 0.16;

          if (bodyPivot) {
            bodyPivot.position.y = 0;
            bodyPivot.rotation.x = 0.25; // lean forward sprinting
          }

          const fastLegSwing = Math.sin(scrambleCycle) * 0.95;
          if (leftLeg) leftLeg.rotation.x = fastLegSwing;
          if (rightLeg) rightLeg.rotation.x = -fastLegSwing;
          if (leftArm) leftArm.rotation.x = -fastLegSwing;
          if (rightArm) rightArm.rotation.x = fastLegSwing;

          // Look inward toward center chairs
          const angleToCenter = Math.atan2(-pMesh.position.x, -pMesh.position.z);
          pMesh.rotation.y = THREE.MathUtils.damp(pMesh.rotation.y, angleToCenter, 16, dt);
        } else if (p.status === 'eliminated') {
          // Eliminated player in dugout / sideline
          pMesh.position.y = 0;
          if (bodyPivot) {
            bodyPivot.position.y = -0.3;
            bodyPivot.rotation.x = 0;
          }
          if (leftLeg) leftLeg.rotation.x = Math.PI / 2;
          if (rightLeg) rightLeg.rotation.x = Math.PI / 2;
          pMesh.rotation.y = 0;
        } else {
          // Ready idle stance
          pMesh.position.y = 0;
          if (bodyPivot) {
            bodyPivot.position.y = 0;
            bodyPivot.rotation.x = 0;
            bodyPivot.rotation.z = 0;
          }
          if (leftLeg) leftLeg.rotation.x = 0;
          if (rightLeg) rightLeg.rotation.x = 0;
          if (leftArm) leftArm.rotation.x = 0;
          if (rightArm) rightArm.rotation.x = 0;
        }

        // Billboard nameplates to always face the camera
        const nameplate = pMesh.getObjectByName('nameplate');
        if (nameplate && cameraRef.current) {
          nameplate.quaternion.copy(cameraRef.current.quaternion);
        }
      });

      // Update Chair visual indicators (Occupied glow ring)
      currentProps.chairs.forEach((c) => {
        const cMesh = chairMeshesRef.current.get(c.id);
        if (!cMesh) return;

        const ring = cMesh.getObjectByName('chair-ring') as THREE.Mesh;
        if (ring) {
          const mat = ring.material as THREE.MeshBasicMaterial;
          if (c.occupiedByPlayerId) {
            mat.opacity = 0.8;
            mat.color.setHex(0x10b981);
          } else if (currentProps.phase === 'HORN_SCRAMBLE') {
            mat.opacity = 0.6 + Math.sin(time * 10) * 0.3;
            mat.color.setHex(0xf59e0b);
          } else {
            mat.opacity = 0;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup WebGL lifecycle on unmount
    return () => {
      cancelAnimationFrame(frameId);
      domEl.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize 3D Chairs with React chairs state
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMeshIds = new Set(chairMeshesRef.current.keys());
    const nextIds = new Set(chairs.map((c) => c.id));

    // Remove old chairs that no longer exist
    currentMeshIds.forEach((id) => {
      if (!nextIds.has(id)) {
        const mesh = chairMeshesRef.current.get(id);
        if (mesh) {
          scene.remove(mesh);
          chairMeshesRef.current.delete(id);
        }
      }
    });

    // Add or update 3D chairs
    chairs.forEach((chair) => {
      let chairGroup = chairMeshesRef.current.get(chair.id);

      if (!chairGroup) {
        chairGroup = create3DChairModel(chair.color, chair.index);
        chairGroup.userData = { chairId: chair.id };
        scene.add(chairGroup);
        chairMeshesRef.current.set(chair.id, chairGroup);
      }

      const targetX = toWorldCoord(chair.x);
      const targetZ = toWorldCoord(chair.y);

      chairGroup.position.set(targetX, 0, targetZ);

      // Rotate 3D chair to face outwards from circular center
      const angleOutward = Math.atan2(targetX, targetZ);
      chairGroup.rotation.y = angleOutward;
    });
  }, [chairs]);

  // Synchronize 3D Players with React players state
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMeshIds = new Set(playerMeshesRef.current.keys());
    const nextIds = new Set(players.map((p) => p.id));

    // Remove eliminated or detached meshes
    currentMeshIds.forEach((id) => {
      if (!nextIds.has(id)) {
        const mesh = playerMeshesRef.current.get(id);
        if (mesh) {
          scene.remove(mesh);
          playerMeshesRef.current.delete(id);
        }
      }
    });

    // Add or update 3D players
    players.forEach((p, idx) => {
      let pMesh = playerMeshesRef.current.get(p.id);

      if (!pMesh) {
        pMesh = create3DPlayerModel(p);
        scene.add(pMesh);
        playerMeshesRef.current.set(p.id, pMesh);

        // Initial starting position
        if (p.status === 'eliminated') {
          // Position on cheering sideline bench
          pMesh.position.set(-8.5 + idx * 1.1, 0, 8.5);
        } else {
          pMesh.position.set(toWorldCoord(p.x), 0, toWorldCoord(p.y));
        }
      }
    });
  }, [players]);

  return (
    <div className="relative w-full aspect-square max-w-[680px] mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
      <div
        ref={mountRef}
        className="w-full h-full cursor-pointer select-none"
        title="3D Musical Chairs Arena · Click chairs to scramble"
      />
    </div>
  );
};
