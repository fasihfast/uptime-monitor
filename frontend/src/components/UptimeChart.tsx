import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

interface Log {
  checkedAt: string;
  responseTime: number;
  isUp: boolean;
}

interface ChartPoint {
  time: string;
  responseTime: number;
  status: string;
}

export default function UptimeChart({ siteId }: { siteId: string }) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sites/${siteId}/logs`)
      .then((res) => {
        // Transform raw logs into chart-friendly format
        const points: ChartPoint[] = res.data
          .reverse()   // oldest first for left-to-right chart
          .map((log: Log) => ({
            time: new Date(log.checkedAt).toLocaleTimeString(),
            responseTime: log.isUp ? log.responseTime : 0,
            status: log.isUp ? 'UP' : 'DOWN',
          }));
        setData(points);
      })
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) return <p style={{ color: '#888', fontSize: '14px' }}>Loading history...</p>;
  if (data.length === 0) return <p style={{ color: '#888', fontSize: '14px' }}>No history yet — wait for the first ping.</p>;

  return (
    <div style={{ marginTop: '16px' }}>
      <p style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>
        Response time (ms) — last {data.length} pings
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} unit="ms" />
         <Tooltip
            formatter={(value, _name, props) => {
              if (props?.payload?.status === 'DOWN') {
                return ['DOWN', 'Status'];
              }
              return [`${value ?? 0}ms`, 'Response time'];
            }}
          />
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}