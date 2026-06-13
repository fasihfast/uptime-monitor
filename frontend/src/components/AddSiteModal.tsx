import { useState } from 'react';
import api from '../api/axios';

interface Site {
  _id: string;
  name: string;
  url: string;
  isUp: boolean;
  lastChecked: string | null;
}

interface Props {
  onClose: () => void;
  onAdded: (site: Site) => void;
}

export default function AddSiteModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/sites', { name, url });
      console.log("Res",res);
      onAdded(res.data);    // add new site to dashboard list instantly
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Add site to monitor</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Site name</label>
          <input
            style={styles.input}
            placeholder="e.g. Company Portal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label style={styles.label}>URL</label>
          <input
            style={styles.input}
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <div style={styles.buttons}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.addBtn} disabled={loading}>
              {loading ? 'Adding...' : 'Add site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '440px' },
  title: { margin: '0 0 20px', fontSize: '20px' },
  error: { color: '#e53e3e', backgroundColor: '#fff5f5', padding: '10px', borderRadius: '6px', marginBottom: '12px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '14px', fontWeight: 500, color: '#4a5568' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' },
  buttons: { display: 'flex', gap: '12px', marginTop: '8px' },
  cancelBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer' },
  addBtn: { flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer' },
};