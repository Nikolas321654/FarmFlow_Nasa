export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  mapTileUrl:
    import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  mapTileAttribution: import.meta.env.VITE_MAP_TILE_ATTRIBUTION || '© OpenStreetMap contributors',
} as const;
