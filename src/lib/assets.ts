/** Files in public/ are served verbatim and need the Vite base prefix. */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
