import { useState } from 'react';
import api from '../api/axios';
import UptimeChart from './UptimeChart';

interface Site {
  _id: string;
  name: string;
  url: string;
  isUp: boolean;
  lastChecked: string | null;
}

interface Props {
  site: Site;
  onDelete: (id: string) => void;
}

export default function SiteCard({ site, onDelete }: Props) {
  const [showChart, setShowChart] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Remove ${site.name} from monitoring?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/sites/${site._id}`);
      onDelete(site._id);   // tell Dashboard to remove this card
    } catch {
      alert('Failed to delete site');
      setDeleting(false);
    }
  };

  const lastChecked = site.lastChecked
    ? new Date(site.lastChecked).toLocaleTimeString()
    : 'Not yet checked';

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          {/* Green dot = UP, Red dot = DOWN */}
          <span style={{ ...styles.dot, backgroundColor: site.isUp ? '#48bb78' : '#e53e3e' }} />
          <span style={styles.name}>{site.name}</span>
          <span style={{ ...styles.badge, backgroundColor: site.isUp ? '#c6f6d5' : '#fed7d7', color: site.isUp ? '#276749' : '#9b2c2c' }}>
            {site.isUp ? 'UP' : 'DOWN'}
          </span>
        </div>
        <button
          style={styles.deleteBtn}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '...' : 'Remove'}
        </button>
      </div>

      <p style={styles.url}>{site.url}</p>
      <p style={styles.meta}>Last checked: {lastChecked}</p>

      <button style={styles.chartBtn} onClick={() => setShowChart(!showChart)}>
        {showChart ? 'Hide history' : 'Show uptime history'}
      </button>

      {/* Expandable chart section */}
      {showChart && <UptimeChart siteId={site._id} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  dot: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', marginRight: '8px' },
  name: { fontSize: '17px', fontWeight: 600, marginRight: '10px' },
  badge: { padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 },
  url: { color: '#718096', fontSize: '14px', margin: '4px 0' },
  meta: { color: '#a0aec0', fontSize: '13px', margin: '4px 0 12px' },
  deleteBtn: { padding: '6px 14px', borderRadius: '6px', backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', cursor: 'pointer' },
  chartBtn: { padding: '8px 16px', borderRadius: '6px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8', cursor: 'pointer', fontSize: '13px' },
};