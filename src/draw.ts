import { vec3, mat4 } from 'gl-matrix';
import dat from 'dat.gui';
import { interpolatePoint } from './utils';

const bonesRotation = {
  angle: 0,
};

const boneRotations = {
  b1: 0,
  b2: 0,
  b3: 0,
  b4: 0,
  b5: 0,
  b6: 0,
};

const scene = {
  showWeights: false,
  showInterpolation: false,
};

const gui = new dat.GUI({ width: 400 });
const bonesDir = gui.addFolder('Bones');
bonesDir.open();
for (const boneRotation of Object.keys(boneRotations)) {
  bonesDir.add(boneRotations, boneRotation, -1, 1, 0.01);
}
bonesDir.add(bonesRotation, 'angle', -2, 2, 0.01);

const sceneDir = gui.addFolder('Scene');
sceneDir.open();
sceneDir.add(scene, 'showWeights');
sceneDir.add(scene, 'showInterpolation');

const model = {
  vertexes: [
    [-1, 0],
    [0, 5],
    [0, 10],
    [2, 15],
    [4, 20],
    [0, 25],
    [-5, 30],
    [-20, 35],
  ],
  weights: [
    [1, 0, 0, 0, 0, 0],
    [0.3, 0.7, 0, 0, 0, 0],
    [0, 0.9, 0.1, 0, 0, 0],
    [0, 0, 1, 0, 0, 0],
    [0, 0, 0.7, 0.3, 0, 0],
    [0, 0, 0, 0.9, 0.1, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1],
  ],
};

const skeleton = {
  bones: [
    [0, 0, 0],
    [1, 8, 0],
    [3, 15, 0],
    [1, 22, 0],
    [-2, 29, 0],
    [-18, 36, 0],
  ] as vec3[],
};

export function draw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 600, 600);

  ctx.save();
  ctx.translate(300, 500);
  ctx.scale(8, -8);

  ctx.beginPath();
  ctx.moveTo(-100, 0);
  ctx.lineTo(100, 0);
  ctx.moveTo(0, -100);
  ctx.lineTo(0, 100);

  for (let x = -5; x <= 10; x++) {
    ctx.moveTo(x * 10, -1);
    ctx.lineTo(x * 10, 1);
  }

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.05;
  ctx.stroke();

  ctx.beginPath();
  // ctx.moveTo(0, 0);
  for (const vertex of model.vertexes) {
    ctx.lineTo(vertex[0], vertex[1]);
  }

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.1;
  ctx.stroke();

  for (const vertex of model.vertexes) {
    ctx.beginPath();
    const x = vertex[0];
    const y = vertex[1];

    ctx.moveTo(x - 1, y);
    ctx.lineTo(x + 1, y);
    ctx.moveTo(x, y - 1);
    ctx.lineTo(x, y + 1);
    ctx.stroke();
  }

  const pose: {
    bones: {
      rotation: number;
      accumulatedRotation: number;
      accumulatedRotationMat: mat4;
      mat: mat4;
      finalMat: mat4;
      finalCoords: vec3;
    }[];
  } = {
    bones: [],
  };

  let accumulatedRotation = 0;
  for (const angle of Object.values(boneRotations)) {
    const rotation = angle * Math.PI + bonesRotation.angle;
    pose.bones.push({
      rotation,
      accumulatedRotation,
      accumulatedRotationMat: mat4.fromZRotation(
        mat4.create(),
        accumulatedRotation,
      ),
      mat: mat4.fromZRotation(mat4.create(), rotation),
      finalMat: undefined as any,
      finalCoords: undefined as any,
    });

    accumulatedRotation += rotation;
  }

  const acc = mat4.create();

  for (let i = 0; i < skeleton.bones.length; i++) {
    const bone = skeleton.bones[i];

    if (i > 0) {
      // const { mat } = pose.bones[i];
      const prevBone = skeleton.bones[i - 1];
      const { mat: prevMat } = pose.bones[i - 1];

      mat4.multiply(acc, acc, prevMat);
      mat4.translate(acc, acc, [
        bone[0] - prevBone[0],
        bone[1] - prevBone[1],
        0,
      ]);
    }

    const coords = [0, 0, 0] as vec3;
    vec3.transformMat4(coords, coords, acc);

    pose.bones[i].finalMat = mat4.clone(acc);
    pose.bones[i].finalCoords = coords;
  }

  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (const bone of pose.bones) {
    ctx.lineTo(bone.finalCoords[0], bone.finalCoords[1]);
  }
  ctx.strokeStyle = '#d90';
  ctx.lineWidth = 0.1;
  ctx.stroke();

  ctx.fillStyle = '#ffa700';
  for (const bone of pose.bones) {
    ctx.beginPath();
    ctx.arc(
      bone.finalCoords[0],
      bone.finalCoords[1],
      0.5,
      0,
      Math.PI * 2,
      true,
    );
    ctx.fill();
  }

  if (scene.showWeights) {
    for (let v = 0; v < model.vertexes.length; v++) {
      const vertex = model.vertexes[v];
      const weights = model.weights[v];

      for (let b = 0; b < pose.bones.length; b++) {
        const bone = pose.bones[b];
        const weight = weights[b];

        if (weight > 0) {
          ctx.beginPath();
          ctx.moveTo(vertex[0], vertex[1]);
          ctx.lineTo(bone.finalCoords[0], bone.finalCoords[1]);
          ctx.strokeStyle = `rgba(255,0,0,${0.2 + weight * 0.8}`;
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }
    }
  }

  ctx.fillStyle = '#f00';
  for (let v = 0; v < model.vertexes.length; v++) {
    const vertex = [...model.vertexes[v], 0] as vec3;
    const weights = model.weights[v];

    const variants = [];

    for (let b = 0; b < pose.bones.length; b++) {
      const weight = weights[b];

      if (weight > 0) {
        const bone = pose.bones[b];
        const boneCoords = bone.finalCoords;
        const initialCoords = skeleton.bones[b];

        const delta = vec3.create();
        vec3.subtract(delta, vertex, initialCoords);

        vec3.transformMat4(delta, delta, bone.accumulatedRotationMat);

        const finalCoords = vec3.create();
        vec3.add(finalCoords, boneCoords, delta);

        variants.push({ coords: finalCoords, weight });
      }
    }

    let coords: vec3;

    if (variants.length === 0) {
      coords = vertex;
    } else {
      if (variants.length > 1 && scene.showInterpolation) {
        ctx.beginPath();
        for (const vari of variants) {
          ctx.lineTo(vari.coords[0], vari.coords[1]);
        }
        ctx.closePath();
        ctx.strokeStyle = '#00f';
        ctx.stroke();
      }

      coords = interpolatePoint(variants, v === 1);
    }

    ctx.beginPath();
    ctx.arc(coords[0], coords[1], 1, 0, Math.PI * 2, true);
    ctx.fill();
  }

  ctx.restore();
}
