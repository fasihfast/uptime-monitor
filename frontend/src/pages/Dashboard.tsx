import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import SiteCard from '../components/SiteCard';
import AddSiteModal from '../components/AddSiteModal';

interface Site {
  _id: string;
  name: string;
  url: string;
  isUp: boolean;
  lastChecked: string | null;
}

export default function Dashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchSites = async () => {
    try {
      const res = await api.get('/sites');
      setSites(res.data);
    } catch (err) {
      console.error('Failed to fetch sites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();

    // Auto-refresh every 30 seconds so status updates without manual reload
    const interval = setInterval(fetchSites, 30_000);
    return () => clearInterval(interval); // cleanup on component unmount
  }, []);

  const handleSiteAdded = (newSite: Site) => {
    setSites((prev) => [newSite, ...prev]);
  };

  const handleSiteDeleted = (id: string) => {
    setSites((prev) => prev.filter((s) => s._id !== id));
  };

  const upCount = sites.filter((s) => s.isUp).length;
  const downCount = sites.filter((s) => !s.isUp).length;

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* Summary bar */}
        <div style={styles.summary}>
          <div style={styles.stat}>
            <span style={styles.statNum}>{sites.length}</span>
            <span style={styles.statLabel}>Total sites</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statNum, color: '#48bb78' }}>{upCount}</span>
            <span style={styles.statLabel}>Online</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statNum, color: '#e53e3e' }}>{downCount}</span>
            <span style={styles.statLabel}>Down</span>
          </div>
        </div>

        {/* Header row */}
        <div style={styles.header}>
          <h2 style={styles.heading}>Monitored sites</h2>
          <button style={styles.addBtn} onClick={() => setShowModal(true)}>
            + Add site
          </button>
        </div>

        {/* Site list */}
        {loading ? (
          <p style={styles.empty}>Loading your sites...</p>
        ) : sites.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No sites monitored yet.</p>
            <p>Click "Add site" to start monitoring your first URL.</p>
          </div>
        ) : (
          sites.map((site) => (
            <SiteCard
              key={site._id}
              site={site}
              onDelete={handleSiteDeleted}
            />
          ))
        )}
      </div>

      {showModal && (
        <AddSiteModal
          onClose={() => setShowModal(false)}
          onAdded={handleSiteAdded}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f7f8fc' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '32px 16px' },
  summary: { display: 'flex', gap: '16px', marginBottom: '32px' },
  stat: { flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNum: { fontSize: '32px', fontWeight: 700, color: '#1a1a2e' },
  statLabel: { fontSize: '13px', color: '#718096', marginTop: '4px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  heading: { margin: 0, fontSize: '20px', color: '#1a1a2e' },
  addBtn: { padding: '10px 20px', borderRadius: '8px', backgroundColor: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px' },
  empty: { textAlign: 'center', color: '#718096' },
  emptyState: { textAlign: 'center', color: '#718096', padding: '40px', backgroundColor: 'white', borderRadius: '12px' },
};