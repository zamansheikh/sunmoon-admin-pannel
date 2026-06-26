/**
 * BrandLogo — pure CSS + Remixicon, zero SVG gradient IDs.
 * Avoids duplicate-ID bugs when both logo-light and logo-dark
 * are present in the DOM simultaneously.
 *
 * Variants:
 *  "full"  → gradient circle icon + "AddaVoiceRoom" wordmark
 *  "icon"  → gradient circle icon only (condensed sidebar)
 */
import { PROJECT_NAME, APP_LOGO } from '@/lib/constants';

interface BrandLogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

function MicCircle() {
  return (
    <img
      src={APP_LOGO}
      alt={PROJECT_NAME}
      width={34}
      height={34}
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
      }}
    />
  );
}

export default function BrandLogo({ variant = 'full', className = '' }: BrandLogoProps) {
  if (variant === 'icon') {
    return (
      <span
        className={`brand-icon ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <MicCircle />
      </span>
    );
  }

  return (
    <span
      className={`brand-full ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        userSelect: 'none',
      }}
    >
      <MicCircle />

      {/* Wordmark */}
      <span
        style={{
          fontFamily: "'Outfit', 'Public Sans', 'Segoe UI', sans-serif",
          fontWeight: 700,
          fontSize: 20,
          lineHeight: 1,
          letterSpacing: '-0.3px',
          whiteSpace: 'nowrap',
          color: '#4f8ef7',
        }}
      >
        {PROJECT_NAME}
      </span>
    </span>
  );
}
