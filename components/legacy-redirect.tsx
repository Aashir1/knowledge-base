'use client';
import { useEffect } from 'react';
import legacyRoutes from '@/lib/legacy-routes.json';
import { basePath } from '@/lib/shared';

// The old Docsify site used hash routes like `#/frontend/typescript?id=generics`.
// Send those bookmarks to the matching page on the new site.
export function LegacyRedirect() {
  useEffect(() => {
    const { hash } = window.location;
    if (!hash.startsWith('#/')) return;

    const oldPath = decodeURIComponent(hash.slice(2).split('?')[0]).replace(/\.md$/, '').replace(/\/$/, '');
    const newPath = (legacyRoutes as Record<string, string>)[oldPath];
    if (newPath === undefined) return;

    window.location.replace(`${basePath}/${newPath ? `${newPath}/` : ''}`);
  }, []);

  return null;
}
