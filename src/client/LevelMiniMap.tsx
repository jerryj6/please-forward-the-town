import type { LevelDefinition } from "../rt/types.js";

interface Props {
  level: LevelDefinition;
}

function tileColor(tile: string, x: number, y: number): string {
  if (tile === "~") return "#3f8e9b";
  if (tile === ",") return (x + y) % 2 === 0 ? "#e4cf98" : "#dcc58c";
  if (tile === ";") return (x + y) % 2 === 0 ? "#9d8e68" : "#8e805f";
  if (tile === "=") return "#b07642";
  if (tile === "#") return "#53624f";
  if (tile === "X") return "#b98a58";
  if (tile >= "a" && tile <= "z") return "#e9d6a6";
  return (x + y) % 2 === 0 ? "#93c46f" : "#8aba67";
}

export function LevelMiniMap({ level }: Props): JSX.Element {
  const width = level.map[0]?.length ?? 0;
  const height = level.map.length;

  return (
    <svg
      className="route-art route-map"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${level.title} map`}
      shapeRendering="crispEdges"
    >
      {level.map.map((row, y) => [...row].map((tile, x) => (
        <rect
          key={`tile-${x}-${y}`}
          x={x}
          y={y}
          width="1"
          height="1"
          fill={tileColor(tile, x, y)}
          stroke={tile === "=" ? "#593c26" : "#284d4a"}
          strokeOpacity={tile === "=" || tile === "-" ? "0.85" : "0.2"}
          strokeWidth={tile === "=" || tile === "-" ? "0.09" : "0.025"}
          strokeDasharray={tile === "-" ? "0.15 0.1" : undefined}
        />
      )))}
      {level.map.flatMap((row, y) => [...row].flatMap((tile, x) => {
        if (tile >= "a" && tile <= "z") {
          return [
            <circle
              key={`zone-${x}-${y}`}
              cx={x + 0.5}
              cy={y + 0.5}
              r="0.19"
              fill="#e26955"
              stroke="#fff7e7"
              strokeWidth="0.07"
            />,
          ];
        }
        if (tile === "X") {
          return [
            <g key={`exit-${x}-${y}`} fill="#e0583f" stroke="#5b4632" strokeWidth="0.06">
              <path d={`M ${x + 0.72} ${y + 0.82} V ${y + 0.2} h 0.48 l -0.15 0.17 0.15 0.17 h -0.48`} />
            </g>,
          ];
        }
        return [];
      }))}
    </svg>
  );
}
