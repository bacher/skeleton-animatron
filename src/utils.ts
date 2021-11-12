import { vec3 } from 'gl-matrix';

export function interpolatePoint(
  points: { coords: vec3; weight: number }[],
  debug: boolean,
): vec3 {
  let acc = points[0];

  for (let i = 1; i < points.length; i++) {
    const { coords, weight } = points[i];

    const newCoords: vec3 = [0, 0, 0];

    if (debug) {
      debugger;
    }

    for (let j = 0; j < 3; j++) {
      const v = acc.coords[j];
      const v1 = coords[j];

      const d = v1 - v;

      newCoords[j] = v + d * (weight / (weight + acc.weight));
    }

    acc = {
      coords: newCoords,
      weight: acc.weight + weight,
    };
  }

  if (acc.weight !== 1) {
    console.log(`strange weight (${acc.weight} != 1)`);
  }

  return acc.coords;
}
