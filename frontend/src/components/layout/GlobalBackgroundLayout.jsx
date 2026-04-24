import './GlobalBackgroundLayout.css';
import { useLocation } from 'react-router-dom';

export default function GlobalBackgroundLayout({ children }) {
  const location = useLocation();
  const isGamePage = location.pathname.startsWith('/game');

  return (
    <div className={`global-bg-container ${isGamePage ? '' : 'cyberpunk-theme'}`}>
      <div className="global-bg-image" aria-hidden="true" />
      <div className="global-bg-overlay" aria-hidden="true" />
      <div className="global-bg-content">{children}</div>
    </div>
  );
}
