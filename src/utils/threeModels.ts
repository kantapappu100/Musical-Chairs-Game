import * as THREE from 'three';
import { Player, PlayerAccessory } from '../types/game';

// Shared materials and geometries for high performance and zero memory leaks
const woodLegGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.9, 8);
const woodMat = new THREE.MeshStandardMaterial({
  color: 0x5c2c16,
  roughness: 0.6,
  metalness: 0.1,
});

const goldTrimMat = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  roughness: 0.3,
  metalness: 0.8,
});

/**
 * Creates a detailed, multi-part 3D Chair model
 * Parts: Cushion, 4 Legs, Seat Base Frame, Backrest Slats, Top Curved Rail, Shadow Decal
 */
export function create3DChairModel(color: string, chairIndex: number): THREE.Group {
  const chairGroup = new THREE.Group();
  chairGroup.name = `chair-${chairIndex}`;

  const chairColorHex = parseInt(color.replace('#', '0x'), 16) || 0xf59e0b;

  // 1. Cushion (Main comfortable seat)
  const cushionGeo = new THREE.BoxGeometry(1.2, 0.22, 1.15);
  const cushionMat = new THREE.MeshStandardMaterial({
    color: chairColorHex,
    roughness: 0.45,
    metalness: 0.15,
  });
  const cushion = new THREE.Mesh(cushionGeo, cushionMat);
  cushion.position.y = 0.95;
  cushion.castShadow = true;
  cushion.receiveShadow = true;
  chairGroup.add(cushion);

  // 2. Seat Wooden Base Trim
  const baseFrameGeo = new THREE.BoxGeometry(1.24, 0.08, 1.19);
  const baseFrame = new THREE.Mesh(baseFrameGeo, woodMat);
  baseFrame.position.y = 0.84;
  baseFrame.castShadow = true;
  chairGroup.add(baseFrame);

  // 3. Four Wooden Legs (angled slightly outward for realism)
  const legPositions = [
    { x: -0.48, z: 0.45, rx: 0.06, rz: -0.06 },
    { x: 0.48, z: 0.45, rx: 0.06, rz: 0.06 },
    { x: -0.48, z: -0.45, rx: -0.06, rz: -0.06 },
    { x: 0.48, z: -0.45, rx: -0.06, rz: 0.06 },
  ];

  legPositions.forEach((pos) => {
    const leg = new THREE.Mesh(woodLegGeo, woodMat);
    leg.position.set(pos.x, 0.45, pos.z);
    leg.rotation.x = pos.rx;
    leg.rotation.z = pos.rz;
    leg.castShadow = true;
    chairGroup.add(leg);
  });

  // 4. Backrest Uprights & Slats
  const uprightGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8);
  const leftUpright = new THREE.Mesh(uprightGeo, woodMat);
  leftUpright.position.set(-0.46, 1.5, -0.48);
  leftUpright.castShadow = true;
  chairGroup.add(leftUpright);

  const rightUpright = new THREE.Mesh(uprightGeo, woodMat);
  rightUpright.position.set(0.46, 1.5, -0.48);
  rightUpright.castShadow = true;
  chairGroup.add(rightUpright);

  // Backrest Center Slats
  const slatGeo = new THREE.BoxGeometry(0.1, 0.8, 0.04);
  [-0.18, 0, 0.18].forEach((offset) => {
    const slat = new THREE.Mesh(slatGeo, woodMat);
    slat.position.set(offset, 1.45, -0.48);
    slat.castShadow = true;
    chairGroup.add(slat);
  });

  // Top Backrest Crown Rail (curved wood with velvet inlay)
  const topRailGeo = new THREE.BoxGeometry(1.15, 0.22, 0.1);
  const topRail = new THREE.Mesh(topRailGeo, cushionMat);
  topRail.position.set(0, 2.05, -0.48);
  topRail.castShadow = true;
  chairGroup.add(topRail);

  // Soft Contact Shadow Plane directly beneath chair
  const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  chairGroup.add(shadowMesh);

  // Occupied glowing indicator ring (hidden initially)
  const ringGeo = new THREE.RingGeometry(0.85, 0.98, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.03;
  ringMesh.name = 'chair-ring';
  chairGroup.add(ringMesh);

  return chairGroup;
}

/**
 * Creates an expressive 3D Player character avatar
 * Composed of Head, Torso, 2 Arms, 2 Legs, Accessories (hat, shades, headphones),
 * and dynamic billboard nameplate.
 */
export function create3DPlayerModel(player: Player): THREE.Group {
  const root = new THREE.Group();
  root.name = `player-${player.id}`;

  const colorHex = parseInt(player.color.replace('#', '0x'), 16) || 0x3b82f6;
  const secondaryHex = parseInt(player.secondaryColor.replace('#', '0x'), 16) || 0x1d4ed8;

  // Material sets
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffdfc4, // Warm peach skin tone
    roughness: 0.7,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.4,
    metalness: 0.1,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: secondaryHex,
    roughness: 0.6,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
  });

  // Main articulated character pivot (allows body bobbing & sit kinematics)
  const bodyPivot = new THREE.Group();
  bodyPivot.name = 'body-pivot';
  root.add(bodyPivot);

  // 1. Torso
  const torsoGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.85, 16);
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  bodyPivot.add(torso);

  // 2. Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 2.1;
  headGroup.name = 'head-group';
  bodyPivot.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.42, 20, 20);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Expressive 3D Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  [-0.15, 0.15].forEach((x) => {
    // Sclera
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), eyeWhiteMat);
    eyeWhite.position.set(x, 0.05, 0.38);
    eyeWhite.scale.z = 0.4;
    headGroup.add(eyeWhite);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), eyeMat);
    pupil.position.set(x, 0.05, 0.41);
    headGroup.add(pupil);
  });

  // 3. Accessory based on player profile
  addAccessoryToHead(headGroup, player.accessory, colorHex);

  // 4. Arms
  const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.65, 8);
  const leftArmPivot = new THREE.Group();
  leftArmPivot.name = 'left-arm';
  leftArmPivot.position.set(-0.48, 1.65, 0);
  const leftArm = new THREE.Mesh(armGeo, shirtMat);
  leftArm.position.y = -0.3;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  bodyPivot.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.name = 'right-arm';
  rightArmPivot.position.set(0.48, 1.65, 0);
  const rightArm = new THREE.Mesh(armGeo, shirtMat);
  rightArm.position.y = -0.3;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  bodyPivot.add(rightArmPivot);

  // 5. Legs
  const legGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.75, 10);
  const leftLegPivot = new THREE.Group();
  leftLegPivot.name = 'left-leg';
  leftLegPivot.position.set(-0.2, 0.95, 0);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.y = -0.38;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);

  // Shoe
  const shoeGeo = new THREE.BoxGeometry(0.2, 0.14, 0.32);
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(0, -0.74, 0.06);
  leftShoe.castShadow = true;
  leftLegPivot.add(leftShoe);
  bodyPivot.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.name = 'right-leg';
  rightLegPivot.position.set(0.2, 0.95, 0);
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.y = -0.38;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);

  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0, -0.74, 0.06);
  rightShoe.castShadow = true;
  rightLegPivot.add(rightShoe);
  bodyPivot.add(rightLegPivot);

  // 6. Winner Crown (toggleable)
  const crownGroup = new THREE.Group();
  crownGroup.name = 'winner-crown';
  crownGroup.position.set(0, 0.52, 0);
  crownGroup.visible = false;

  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.2, 16, 1, true), goldTrimMat);
  crownGroup.add(crownBase);
  [-0.2, -0.07, 0.07, 0.2].forEach((x) => {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), goldTrimMat);
    spike.position.set(x, 0.16, 0.15);
    crownGroup.add(spike);
  });
  headGroup.add(crownGroup);

  // 7. Contact Shadow Decal on Floor
  const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
  const sCanvas = document.createElement('canvas');
  sCanvas.width = 64;
  sCanvas.height = 64;
  const sCtx = sCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 64, 64);

  const shadowTex = new THREE.CanvasTexture(sCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  shadowMesh.name = 'player-shadow';
  root.add(shadowMesh);

  // 8. Overhead 3D Billboard Nameplate
  const nameplate = createNameplateSprite(player.name, player.isUser);
  nameplate.position.y = 2.85;
  nameplate.name = 'nameplate';
  root.add(nameplate);

  // 9. "YOU" ring if human player
  if (player.isUser) {
    const userMarkerGeo = new THREE.RingGeometry(0.65, 0.75, 32);
    const userMarkerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const userMarker = new THREE.Mesh(userMarkerGeo, userMarkerMat);
    userMarker.rotation.x = -Math.PI / 2;
    userMarker.position.y = 0.03;
    userMarker.name = 'user-marker';
    root.add(userMarker);
  }

  return root;
}

/**
 * Creates dynamic 3D billboard text sprite for player names
 */
export function createNameplateSprite(name: string, isUser: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;

  // Background rounded capsule
  ctx.fillStyle = isUser ? 'rgba(2, 132, 199, 0.9)' : 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(16, 12, 224, 48, 24);
  ctx.fill();

  ctx.strokeStyle = isUser ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const clean = name.length > 12 ? `${name.slice(0, 11)}…` : name;
  ctx.fillText(clean, 128, 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.4, 0.4, 1);
  return sprite;
}

/**
 * Decorates 3D Head with hats, sunglasses, bows, or headphones
 */
function addAccessoryToHead(headGroup: THREE.Group, accessory: PlayerAccessory, playerColorHex: number) {
  if (accessory === 'party-hat') {
    const hatGeo = new THREE.ConeGeometry(0.24, 0.65, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.set(0, 0.65, 0);
    headGroup.add(hat);

    // Pompom
    const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
    pompom.position.set(0, 0.98, 0);
    headGroup.add(pompom);
  } else if (accessory === 'sunglasses') {
    const shadesMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.8 });
    const shadesGeo = new THREE.BoxGeometry(0.68, 0.16, 0.12);
    const shades = new THREE.Mesh(shadesGeo, shadesMat);
    shades.position.set(0, 0.06, 0.41);
    headGroup.add(shades);
  } else if (accessory === 'headphones') {
    const hpMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 });
    // Headband
    const bandGeo = new THREE.TorusGeometry(0.44, 0.05, 8, 20, Math.PI);
    const band = new THREE.Mesh(bandGeo, hpMat);
    band.position.set(0, 0.05, 0);
    band.rotation.z = Math.PI;
    headGroup.add(band);

    // Earcups
    [-0.43, 0.43].forEach((x) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12), hpMat);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(x, 0.05, 0);
      headGroup.add(cup);
    });
  } else if (accessory === 'cap') {
    const capMat = new THREE.MeshStandardMaterial({ color: playerColorHex, roughness: 0.5 });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    cap.position.y = 0.08;
    headGroup.add(cap);

    // Visor
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 12, 1, false, -Math.PI / 3, (Math.PI * 2) / 3), capMat);
    visor.position.set(0, 0.1, 0.32);
    headGroup.add(visor);
  }
}
