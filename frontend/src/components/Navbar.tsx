import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>Uptime Monitor</span>
      <div style={styles.right}>
        <span style={styles.name}>Hi, {user?.name}</span>
        <button style={styles.button} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', backgroundColor: '#1a1a2e', color: 'white' },
  brand: { fontSize: '20px', fontWeight: 600 },
  right: { display: 'flex', alignItems: 'center', gap: '16px' },
  name: { color: '#a0aec0' },
  button: { padding: '8px 16px', borderRadius: '6px', backgroundColor: '#e53e3e', color: 'white', border: 'none', cursor: 'pointer' },
};