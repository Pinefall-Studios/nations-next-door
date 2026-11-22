globalThis.fetch = async () => {
  throw new Error("Live network is disabled in unit tests. Inject a fixture fetch.");
};
