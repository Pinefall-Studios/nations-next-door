export function PatternTile({ name, large = false }: { name: string; large?: boolean }) {
  const initial = name.trim().charAt(0).toUpperCase() || "·";
  return (
    <div className={large ? "tile lg" : "tile"} aria-hidden="true">
      {initial}
    </div>
  );
}
