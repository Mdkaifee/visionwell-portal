// Stylised per-frame illustration used when no real photo has been uploaded
// yet. It's deliberately not a fake product photo — it's honest art, shaped
// and coloured from the frame's own `shape`/`colour` fields, so every card
// looks distinct instead of repeating one generic glasses icon.
const COLOUR_HEX: Record<string, string> = {
  tortoise: "#8b5a2b",
  gunmetal: "#4b4f54",
  "rose gold": "#b76e79",
  "antique gold": "#b08d57",
  "sky blue": "#7ec8e3",
  "matte black": "#2b2b2b",
  "brown gradient": "#6b4423",
  champagne: "#cbb489",
  black: "#2b2b2b",
  gold: "#b08d57",
  silver: "#9aa0a6",
  brown: "#6b4423",
  blue: "#4a7fb5",
};

function colourToHex(colour: string): string {
  return COLOUR_HEX[colour.trim().toLowerCase()] ?? "#9c8358";
}

const CAT_EYE_PATH =
  "M -30 8 C -31 -18 -10 -29 8 -27 C 24 -25 32 -12 30 4 C 28 20 10 27 -8 25 C -22 23 -29 20 -30 8 Z";
const AVIATOR_PATH =
  "M -28 -8 C -33 0 -30 20 -16 27 C -2 33 18 29 27 15 C 34 3 30 -13 17 -20 C 3 -27 -21 -18 -28 -8 Z";

function Lens({ shape, x, color }: { shape: string; x: number; color: string }) {
  const rim = { stroke: color, strokeWidth: 5, fill: color, fillOpacity: 0.22 };
  switch (shape) {
    case "round":
      return <circle cx={x} cy={0} r={28} {...rim} />;
    case "oval":
      return <ellipse cx={x} cy={0} rx={30} ry={24} {...rim} />;
    case "square":
      return <rect x={x - 26} y={-24} width={52} height={48} rx={8} {...rim} />;
    case "rectangle":
      return <rect x={x - 29} y={-18} width={58} height={36} rx={6} {...rim} />;
    case "cat-eye":
      return (
        <path
          d={CAT_EYE_PATH}
          transform={`translate(${x} 0) scale(${x > 0 ? -1 : 1},1)`}
          {...rim}
        />
      );
    case "aviator":
      return (
        <path
          d={AVIATOR_PATH}
          transform={`translate(${x} 0) scale(${x > 0 ? -1 : 1},1)`}
          {...rim}
        />
      );
    default:
      return <ellipse cx={x} cy={0} rx={29} ry={25} {...rim} />;
  }
}

export function FrameArt({
  shape,
  colour,
  className,
}: {
  shape: string;
  colour: string;
  className?: string;
}) {
  const color = colourToHex(colour);
  const normalizedShape = shape.trim().toLowerCase();

  return (
    <svg viewBox="-100 -50 200 100" className={className} aria-hidden="true">
      <g stroke={color} strokeOpacity={0.6} strokeWidth={4} fill="none" strokeLinecap="round">
        <line x1="-72" y1="-6" x2="-96" y2="-16" />
        <line x1="72" y1="-6" x2="96" y2="-16" />
        <path d="M -14 -2 Q 0 -10 14 -2" />
      </g>
      <Lens shape={normalizedShape} x={-42} color={color} />
      <Lens shape={normalizedShape} x={42} color={color} />
    </svg>
  );
}
