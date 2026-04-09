import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, Tooltip,
} from 'recharts';
import { Download } from 'lucide-react';
import { exportChartAsPng, exportAsCSV } from './useChartExport';
import styles from './HRCharts.module.css';

const C = {
  red:    '#cc0000',
  redBright: '#ff1a1a',
  muted:  '#5a5550',
  text:   '#9a9080',
};

interface HiPoProgressChartProps {
  done: number;
  total: number;
  completionRate: number;
  quizCount: number;
  points: number;
}

export function HiPoProgressChart({ done, total, completionRate, points }: HiPoProgressChartProps) {
  const radialData = [{ value: completionRate, fill: C.red }];

  // Simulated cumulative growth curve
  const curve = [0.08, 0.2, 0.38, 0.55, 0.72, 0.87, 1];
  const activityData = curve.map((factor, i) => ({
    week: i === 6 ? 'Сейчас' : `Нед ${i + 1}`,
    points: Math.round(points * factor),
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>

      {/* ── Radial progress ── */}
      <div className={styles.chartCard} id="chart-radial">
        <div className={styles.chartHeader}>
          <p className={styles.chartTitle}>Выполнение задач</p>
          <button className={styles.exportBtn} onClick={() => exportChartAsPng('chart-radial', 'progress.png')}>
            <Download size={12} /> PNG
          </button>
        </div>

        <div className={styles.radialWrap}>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="62%" outerRadius="88%"
              data={radialData}
              startAngle={90} endAngle={-270}
            >
              <defs>
                <linearGradient id="radialGrad" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.redBright} />
                  <stop offset="100%" stopColor={C.red} />
                </linearGradient>
              </defs>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: 'rgba(240,237,230,0.05)' }}
                dataKey="value"
                cornerRadius={6}
                angleAxisId={0}
                fill="url(#radialGrad)"
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Centered overlay */}
          <div className={styles.radialCenter}>
            <p className={styles.radialPct}>{completionRate}%</p>
            <p className={styles.radialSub}>{done} / {total}</p>
          </div>
        </div>
      </div>

      {/* ── Points growth area ── */}
      <div className={styles.chartCard} id="chart-growth">
        <div className={styles.chartHeader}>
          <p className={styles.chartTitle}>Рост баллов</p>
          <button className={styles.exportBtn} onClick={() => exportAsCSV(activityData, 'growth.csv')}>
            <Download size={12} /> CSV
          </button>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={activityData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.red} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: C.muted }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: C.muted }}
              axisLine={false} tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className={styles.tooltip}>
                    <p className={styles.tooltipLabel}>{label}</p>
                    <div className={styles.tooltipRow}>
                      <span className={styles.tooltipDot} style={{ background: C.red }} />
                      <span style={{ color: C.text }}>Баллы:</span>
                      <span style={{ fontWeight: 600 }}>{payload[0]?.value as number}</span>
                    </div>
                  </div>
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey="points"
              stroke={C.redBright}
              strokeWidth={2}
              fill="url(#areaGrad)"
              dot={{ r: 3, fill: C.redBright, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: C.redBright, strokeWidth: 0 }}
              name="Баллы"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
