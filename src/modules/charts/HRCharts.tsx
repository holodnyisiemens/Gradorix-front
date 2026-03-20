import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Download } from 'lucide-react';
import { exportChartAsPng, exportAsCSV } from './useChartExport';
import { getJuniorActivityStats, MOCK_ALL_USERS, MOCK_USER_POINTS, MOCK_QUIZ_RESULTS, MOCK_QUIZZES } from '@shared/api/mockData';
import styles from './HRCharts.module.css';

// --- Data preparation ---
function useHRChartsData() {
  const stats = getJuniorActivityStats();
  const hipoUsers = MOCK_ALL_USERS.filter(u => u.role === 'JUNIOR');

  // Bar chart: tasks completion per HiPo
  const tasksData = hipoUsers.map(u => {
    const s = stats.find(x => x.userId === u.id);
    return {
      name: u.firstname ?? u.username,
      done: s?.done ?? 0,
      inProgress: s?.inProgress ?? 0,
      going: s?.going ?? 0,
      skipped: s?.skipped ?? 0,
    };
  });

  // Pie chart: activity status distribution
  const totals = stats.reduce((acc, s) => {
    acc.done += s.done;
    acc.inProgress += s.inProgress;
    acc.going += s.going;
    acc.skipped += s.skipped;
    return acc;
  }, { done: 0, inProgress: 0, going: 0, skipped: 0 });

  const pieData = [
    { name: 'Выполнено', value: totals.done },
    { name: 'В работе', value: totals.inProgress },
    { name: 'Не начато', value: totals.going },
    { name: 'Пропущено', value: totals.skipped },
  ];

  // Bar chart: points leaderboard
  const pointsData = MOCK_USER_POINTS.slice(0, 6).map(p => {
    const u = MOCK_ALL_USERS.find(x => x.id === p.userId);
    return { name: u?.firstname ?? 'Участник', points: p.totalPoints, level: p.levelName };
  });

  // Quiz results
  const quizData = MOCK_QUIZZES.map(q => {
    const results = MOCK_QUIZ_RESULTS.filter(r => r.quizId === q.id);
    return {
      name: q.title.length > 12 ? q.title.slice(0, 12) + '…' : q.title,
      fullName: q.title,
      attempts: results.length,
      avgScore: results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0,
    };
  });

  return { tasksData, pieData, pointsData, quizData, totals };
}

interface ChartCardProps {
  id: string;
  title: string;
  onExportPng?: () => void;
  onExportCsv?: () => void;
  children: React.ReactNode;
}

function ChartCard({ id, title, onExportPng, onExportCsv, children }: ChartCardProps) {
  return (
    <div className={styles.chartCard} id={id}>
      <div className={styles.chartHeader}>
        <p className={styles.chartTitle}>{title}</p>
        <div className={styles.chartActions}>
          {onExportCsv && (
            <button className={styles.exportBtn} onClick={onExportCsv} title="Скачать CSV">
              <Download size={14} /> CSV
            </button>
          )}
          {onExportPng && (
            <button className={styles.exportBtn} onClick={onExportPng} title="Скачать PNG">
              <Download size={14} /> PNG
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

const COLORS = {
  done: '#3dbd6a',
  inProgress: '#ffaa40',
  going: '#6b7280',
  skipped: '#ff4444',
  primary: 'var(--color-primary)',
  blue: '#3a9aee',
};

const PIE_COLORS = [COLORS.done, COLORS.inProgress, COLORS.going, COLORS.skipped];

export function HRCharts() {
  const { tasksData, pieData, pointsData, quizData } = useHRChartsData();

  return (
    <div className={styles.grid}>
      {/* Tasks by HiPo */}
      <ChartCard
        id="chart-tasks"
        title="Задачи по участникам"
        onExportPng={() => exportChartAsPng('chart-tasks', 'tasks-chart.png')}
        onExportCsv={() => exportAsCSV(tasksData, 'tasks-data.csv')}
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tasksData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="done" name="Выполнено" fill={COLORS.done} radius={[3, 3, 0, 0]} />
            <Bar dataKey="inProgress" name="В работе" fill={COLORS.inProgress} radius={[3, 3, 0, 0]} />
            <Bar dataKey="skipped" name="Пропущено" fill={COLORS.skipped} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Status distribution pie */}
      <ChartCard
        id="chart-pie"
        title="Распределение статусов"
        onExportPng={() => exportChartAsPng('chart-pie', 'status-chart.png')}
        onExportCsv={() => exportAsCSV(pieData, 'status-data.csv')}
      >
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
              {pieData.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Points leaderboard bar */}
      <ChartCard
        id="chart-points"
        title="Рейтинг баллов"
        onExportPng={() => exportChartAsPng('chart-points', 'points-chart.png')}
        onExportCsv={() => exportAsCSV(pointsData, 'points-data.csv')}
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pointsData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={50} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="points" name="Баллы" fill={COLORS.blue} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Quiz scores */}
      <ChartCard
        id="chart-quizzes"
        title="Средний балл по тестам"
        onExportPng={() => exportChartAsPng('chart-quizzes', 'quiz-chart.png')}
        onExportCsv={() => exportAsCSV(quizData, 'quiz-data.csv')}
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={quizData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <Tooltip
              content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <p style={{ color: 'var(--text-primary)' }}>{payload[0]?.payload?.fullName}</p>
                  <p style={{ color: COLORS.inProgress }}>Ср. балл: {payload[0]?.value}%</p>
                </div>
              ) : null}
            />
            <Bar dataKey="avgScore" name="Ср. балл %" fill={COLORS.inProgress} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
