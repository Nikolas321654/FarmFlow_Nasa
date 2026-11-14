export function currentReturnPath(location: { pathname: string; search: string; hash: string }) {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function absoluteReturnUrl(path: string, origin: string = window.location.origin): string {
  const safePath = path.startsWith('/') && !path.startsWith('//') ? path : '/';
  return `${origin}${safePath}`;
}
