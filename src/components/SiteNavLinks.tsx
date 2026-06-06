'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; prefix: string };

export function SiteNavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: '/bibliotheque', label: 'Bibliothèque', prefix: '/bibliotheque' },
    { href: '/tarifs', label: 'Tarifs', prefix: '/tarifs' },
    ...(isAdmin
      ? [{ href: '/admin/documents', label: 'Admin', prefix: '/admin' }]
      : []),
  ];

  return (
    <>
      {items.map(({ href, label, prefix }) => {
        const active = pathname === prefix || pathname.startsWith(`${prefix}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active
                ? 'font-medium text-foreground underline decoration-accent decoration-2 underline-offset-[6px]'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
