import { buildLocator } from "../lib/maps";

export function LocatorMap({
  latitude,
  longitude,
  countryCode,
  usStates,
  rounded,
}: {
  latitude: number;
  longitude: number;
  countryCode: string | null;
  usStates: string[];
  rounded: boolean;
}) {
  const map = buildLocator({ latitude, longitude, countryCode, usStates });
  return (
    <figure className="locator">
      <svg viewBox={`0 0 ${map.width} ${map.height}`} role="img" aria-label="Locator map">
        {map.shapes.map((shape, index) => (
          <path
            key={index}
            d={shape.d}
            fill={shape.emphasis ? "#E9B99A" : "#EDE4D3"}
            stroke={shape.emphasis ? "#B7AA96" : "#CFC4B2"}
            strokeWidth={shape.emphasis ? 1.6 : 1.15}
            strokeLinejoin="round"
          />
        ))}
        {map.marker ? (
          <circle cx={map.marker.x} cy={map.marker.y} r={7} fill="#B4532A" stroke="#FAF6EF" strokeWidth={2} />
        ) : null}
      </svg>
      <figcaption className="notice">
        {rounded
          ? "Rounded to one decimal degree, about 11 km. This country is on the Open Doors World Watch List."
          : "Published point from this sample record."}
      </figcaption>
    </figure>
  );
}
