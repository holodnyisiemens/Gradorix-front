import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Download } from 'lucide-react';
import { exportChartAsPng, exportAsCSV } from './useChartExport';
import styles from './HRCharts.module.css';

interface HiPoProgressChartProps {
  done: number;
  total: number;
  completionRate: number;
  quizCount: number;
  points: number;
}

export function HiPoProgressChart({ done, total, completionRate, points }: HiPoProgressChartProps) {
  const radialData = [{ name: 'Прогресс', value: completionRate, fill: 'var(--color-primary)' }];

  const activityData = [
    { week: 'Нед 1', points: Math.round(points * 0.1) },
    { week: 'Нед 2', points: Math.round(points * 0.25) },
    { week: 'Нед 3', points: Math.round(points * 0.45) },
    { week: 'Нед 4', points: Math.round(points * 0.65) },
    { week: 'Нед 5', points: Math.round(points * 0.8) },
    { week: 'Сейчас', points },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
      {/* Radial progress */}
      <div className={styles.chartCard} id="chart-radial">
        <div className={styles.chartHeader}>
          <p className={styles.chartTitle}>Выполнение задач</p>
          <button className={styles.exportBtn} onClick={() => exportChartAsPng('chart-radial', 'progress.png')}>
            <Download size={12} /> PNG
          </button>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} angleAxisId={0} />
          </RadialBarChart>
        </ResponsiveContainer>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-primary-bright)', marginTop: -20 }}>
          {completionRate}%
        </p>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>{done} из {total} задач</p>
      </div>

      {/* Points growth line */}
      <div className={styles.chartCard} id="chart-growth">
        <div className={styles.chartHeader}>
          <p className={styles.chartTitle}>Рост баллов</p>
          <button className={styles.exportBtn} onClick={() => exportAsCSV(activityData, 'growth.csv')}>
            <Download size={12} /> CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={activityData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
            <defs>
              <linearGradient id="colorPts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="points" stroke="var(--color-primary)" strokeWidth={2} fill="url(#colorPts)" name="Баллы" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
