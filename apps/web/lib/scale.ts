export function scaleColor(count: number): string {
  if (count <= 0) return "#EDE4D3";
  if (count === 1) return "#F6E3D6";
  if (count === 2) return "#E9B99A";
  if (count === 3) return "#D58A60";
  if (count === 4) return "#B4532A";
  return "#7E3418";
}
