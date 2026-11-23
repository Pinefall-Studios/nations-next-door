declare module "*.geojson" {
  const value: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      properties?: { postal?: string; name?: string };
      geometry?: { type?: string; coordinates?: unknown };
    }>;
  };
  export default value;
}
