import './GlobalBackgroundLayout.css';

export default function GlobalBackgroundLayout({ children }) {
  return (
    <div className="global-bg-container cyberpunk-theme">
      <div className="global-bg-image" aria-hidden="true" />
      <div className="global-bg-overlay" aria-hidden="true" />
      <div className="global-bg-content">{children}</div>
    </div>
  );
}
