/**
 * Full-screen overlay shown on mobile devices in portrait orientation.
 * Asks the player to rotate to landscape before playing.
 */
export function PortraitOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="portrait-overlay" aria-live="polite" role="status">
      <div className="portrait-overlay__content">
        {/* Animated phone-rotate SVG */}
        <svg
          className="portrait-overlay__icon"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Phone body */}
          <rect
            x="22"
            y="8"
            width="36"
            height="56"
            rx="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
          />
          {/* Home indicator */}
          <rect x="33" y="57" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
          {/* Camera dot */}
          <circle cx="40" cy="15" r="2" fill="currentColor" opacity="0.5" />
          {/* Rotation arrow arc — quarter circle around the phone */}
          <path
            d="M 62 22 A 26 26 0 0 1 22 62"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Arrowhead at the end of the arc */}
          <polyline
            points="16,56 22,62 28,56"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        <p className="portrait-overlay__text">יש לסובב למצב מאוזן</p>
      </div>
    </div>
  );
}
