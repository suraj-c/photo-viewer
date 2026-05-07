import React from 'react';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: every icon button MUST carry an accessible name (Constitution V). */
  label: string;
  variant?: 'default' | 'primary';
  iconChar?: string;
}

/**
 * Minimal icon button with an enforced ARIA label and visible focus ring.
 * `iconChar` lets callers use a single glyph (Unicode arrow, etc.) without
 * pulling in an SVG icon library — the goal is zero non-essential deps.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, variant = 'default', iconChar, children, className, ...rest }, ref) => {
    const cls = ['pv-iconbtn', variant === 'primary' ? 'pv-iconbtn--primary' : '', className]
      .filter(Boolean)
      .join(' ');
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cls}
        {...rest}
      >
        {iconChar ? <span aria-hidden="true">{iconChar}</span> : null}
        {children}
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';
