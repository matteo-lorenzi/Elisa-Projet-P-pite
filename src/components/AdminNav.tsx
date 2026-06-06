'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin/documents', label: 'Documents' },
  { href: '/admin/users', label: 'Utilisateurs' },
  { href: '/admin/newsletter', label: 'Newsletter' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration" className="flex flex-wrap gap-1">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active
                ? 'bg-accent text-accent-ink'
                : 'text-muted hover:bg-surface hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
