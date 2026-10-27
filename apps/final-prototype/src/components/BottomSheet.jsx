import { useEffect, useRef } from 'react';

export default function BottomSheet({ title, subtitle, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-layer">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <div>
            <h2 className="sheet-title">{title}</h2>
            {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
