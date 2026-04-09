import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Download } from 'lucide-react';
import { exportChartAsPng, exportAsCSV } from './useChartExport';
import { useUsers, useLeaderboard, useQuizzes, useQuizResults, useChallengeJuniors } from '@shared/hooks/useApi';
import styles from './HRCharts.module.css';

// ── Design tokens (recharts needs real hex, not CSS vars) ─────────────────
const C = {
  done:       '#3dbd6a',
  inProgress: '#ff7a1a',
  going:      '#3a5a70',
  skipped:    '#cc3333',
  blue:       '#3a9aee',
  red:        '#cc0000',
  muted:      '#5a5550',
  text:       '#9a9080',
};

const PIE_COLORS = [C.done, C.inProgress, C.going, C.skipped];
const MEDALS = ['🥇', '🥈', '🥉'];

// ── Shared tooltip ────────────────────────────────────────────────────────
function Tip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {label && <p className={styles.tooltipLabel}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span style={{ color: C.text }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────
function ChartCard({ id, title, onExportPng, onExportCsv, children }: {
  id: string;
  title: string;
  onExportPng?: () => void;
  onExportCsv?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.chartCard} id={id}>
      <div className={styles.chartHeader}>
        <p className={styles.chartTitle}>{title}</p>
        <div className={styles.chartActions}>
          {onExportCsv && (
            <button className={styles.exportBtn} onClick={onExportCsv} title="CSV">
              <Download size={12} /> CSV
            </button>
          )}
          {onExportPng && (
            <button className={styles.exportBtn} onClick={onExportPng} title="PNG">
              <Download size={12} /> PNG
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Data hook ─────────────────────────────────────────────────────────────
function useHRChartsData() {
  const { data: allUsers = [] } = useUsers();
  const { data: leaderboard = [] } = useLeaderboard();
  const { data: quizzes = [] } = useQuizzes();
  const { data: quizResults = [] } = useQuizResults();
  const { data: allAssignments = [] } = useChallengeJuniors();

  const hipoUsers = allUsers.filter(u => u.role === 'JUNIOR');

  // Stacked bar: tasks per HiPo
  const tasksData = hipoUsers.map(u => {
    const ua = allAssignments.filter(a => a.junior_id === u.id);
    return {
      name: (u.firstname ?? u.username).slice(0, 8),
      fullName: `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.username,
      done:       ua.filter(a => a.progress === 'DONE').length,
      inProgress: ua.filter(a => a.progress === 'IN_PROGRESS').length,
      going:      ua.filter(a => a.progress === 'GOING').length,
      skipped:    ua.filter(a => a.progress === 'SKIPPED').length,
    };
  });

  // Donut: status totals
  const totals = tasksData.reduce(
    (acc, s) => ({ done: acc.done + s.done, inProgress: acc.inProgress + s.inProgress, going: acc.going + s.going, skipped: acc.skipped + s.skipped }),
    { done: 0, inProgress: 0, going: 0, skipped: 0 },
  );
  const pieData = [
    { name: 'Выполнено',  value: totals.done,       color: C.done },
    { name: 'В работе',   value: totals.inProgress,  color: C.inProgress },
    { name: 'Не начато',  value: totals.going,       color: C.going },
    { name: 'Пропущено',  value: totals.skipped,     color: C.skipped },
  ].filter(d => d.value > 0);
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  // Horizontal bar: leaderboard
  const pointsData = leaderboard.slice(0, 6).map((p, i) => {
    const u = allUsers.find(x => x.id === p.userId);
    return {
      name: (u?.firstname ?? 'Участник').slice(0, 9),
      points: p.totalPoints,
      level: p.levelName,
      medal: MEDALS[i] ?? '',
    };
  });

  // Bar: quiz avg score
  const quizData = quizzes.map(q => {
    const results = quizResults.filter(r => r.quizId === q.id);
    const avg = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
    return {
      name: q.title.length > 10 ? q.title.slice(0, 10) + '…' : q.title,
      fullName: q.title,
      avgScore: avg,
      attempts: results.length,
      color: avg >= 70 ? C.done : avg >= 40 ? C.inProgress : C.skipped,
    };
  });

  return { tasksData, pieData, pieTotal, pointsData, quizData, totals };
}

// ─────────────────────────────────────────────────────────────────────────
export function HRCharts() {
  const { tasksData, pieData, pieTotal, pointsData, quizData } = useHRChartsData();

  return (
    <div className={styles.grid}>

      {/* ── 1. Задачи по участникам (stacked bar) ── */}
      <ChartCard
        id="chart-tasks"
        title="Задачи по участникам"
        onExportPng={() => exportChartAsPng('chart-tasks', 'tasks.png')}
        onExportCsv={() => exportAsCSV(tasksData, 'tasks.csv')}
      >
        {tasksData.length === 0 ? (
          <EmptyState text="Нет данных по задачам" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tasksData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barSize={18}>
              <defs>
                <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3dbd6a" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2a8a4e" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="gradProg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7a1a" stopOpacity={1} />
                  <stop offset="100%" stopColor="#c05510" stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: C.muted }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: C.muted }}
                axisLine={false} tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className={styles.tooltip}>
                      <p className={styles.tooltipLabel}>{
                        tasksData.find(d => d.name === label)?.fullName ?? label
                      }</p>
                      {payload.map((p, i) => (
                        <div key={i} className={styles.tooltipRow}>
                          <span className={styles.tooltipDot} style={{ background: p.color as string }} />
                          <span style={{ color: C.text }}>{p.name}:</span>
                          <span style={{ fontWeight: 600 }}>{p.value as number}</span>
                        </div>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="done"       name="Выполнено"  stackId="a" fill="url(#gradDone)" radius={[0,0,0,0]} />
              <Bar dataKey="inProgress" name="В работе"   stackId="a" fill="url(#gradProg)" radius={[0,0,0,0]} />
              <Bar dataKey="going"      name="Не начато"  stackId="a" fill={C.going}        radius={[0,0,0,0]} />
              <Bar dataKey="skipped"    name="Пропущено"  stackId="a" fill={C.skipped}      radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {/* Stack legend */}
        <div className={styles.pieLegend}>
          {[
            { color: C.done,       label: 'Выполнено' },
            { color: C.inProgress, label: 'В работе' },
            { color: C.going,      label: 'Не начато' },
            { color: C.skipped,    label: 'Пропущено' },
          ].map(l => (
            <div key={l.label} className={styles.pieLegendItem}>
              <span className={styles.pieLegendDot} style={{ background: l.color }} />
              <span className={styles.pieLegendName}>{l.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* ── 2. Donut: распределение статусов ── */}
      <ChartCard
        id="chart-pie"
        title="Статусы задач"
        onExportPng={() => exportChartAsPng('chart-pie', 'statuses.png')}
        onExportCsv={() => exportAsCSV(pieData, 'statuses.csv')}
      >
        {pieData.length === 0 ? (
          <EmptyState text="Нет назначенных задач" />
        ) : (
          <>
            <div className={styles.donutWrap}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={54} outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className={styles.tooltip}>
                          <div className={styles.tooltipRow}>
                            <span className={styles.tooltipDot} style={{ background: payload[0]?.payload?.color }} />
                            <span style={{ color: C.text }}>{payload[0]?.name}:</span>
                            <span style={{ fontWeight: 600 }}>{payload[0]?.value as number}</span>
                          </div>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.donutCenter}>
                <p className={styles.donutCenterVal}>{pieTotal}</p>
                <p className={styles.donutCenterLabel}>задач</p>
              </div>
            </div>
            <div className={styles.pieLegend}>
              {pieData.map((d, i) => (
                <div key={i} className={styles.pieLegendItem}>
                  <span className={styles.pieLegendDot} style={{ background: PIE_COLORS[i] }} />
                  <span className={styles.pieLegendName}>{d.name}</span>
                  <span className={styles.pieLegendVal}>{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </ChartCard>

      {/* ── 3. Рейтинг баллов (горизонтальные бары) ── */}
      <ChartCard
        id="chart-points"
        title="Рейтинг баллов"
        onExportPng={() => exportChartAsPng('chart-points', 'leaderboard.png')}
        onExportCsv={() => exportAsCSV(pointsData, 'leaderboard.csv')}
      >
        {pointsData.length === 0 ? (
          <EmptyState text="Нет данных рейтинга" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={pointsData}
              layout="vertical"
              margin={{ top: 0, right: 36, bottom: 0, left: 4 }}
              barSize={14}
            >
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1a6aaa" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3a9aee" stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: C.muted }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: C.text }}
                axisLine={false} tickLine={false}
                width={56}
              />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className={styles.tooltip}>
                      <p className={styles.tooltipLabel}>{payload[0]?.payload?.level}</p>
                      <div className={styles.tooltipRow}>
                        <span className={styles.tooltipDot} style={{ background: C.blue }} />
                        <span style={{ color: C.text }}>Баллы:</span>
                        <span style={{ fontWeight: 600 }}>{payload[0]?.value as number}</span>
                      </div>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="points" name="Баллы" fill="url(#gradBlue)" radius={[0, 4, 4, 0]}
                label={{ position: 'right', fontSize: 11, fill: C.text, formatter: (v: number) => v }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── 4. Средний балл по тестам ── */}
      <ChartCard
        id="chart-quizzes"
        title="Средний балл по тестам"
        onExportPng={() => exportChartAsPng('chart-quizzes', 'quizzes.png')}
        onExportCsv={() => exportAsCSV(quizData, 'quizzes.csv')}
      >
        {quizData.length === 0 ? (
          <EmptyState text="Нет результатов тестов" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quizData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barSize={22}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: C.muted }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: C.muted }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className={styles.tooltip}>
                      <p className={styles.tooltipLabel}>{payload[0]?.payload?.fullName}</p>
                      <div className={styles.tooltipRow}>
                        <span className={styles.tooltipDot} style={{ background: payload[0]?.payload?.color }} />
                        <span style={{ color: C.text }}>Ср. балл:</span>
                        <span style={{ fontWeight: 600 }}>{payload[0]?.value as number}%</span>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span className={styles.tooltipDot} style={{ background: 'transparent' }} />
                        <span style={{ color: C.muted }}>Попыток: {payload[0]?.payload?.attempts}</span>
                      </div>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="avgScore" name="Ср. балл %" radius={[4, 4, 0, 0]}>
                {quizData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{
      height: 160,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: C.muted,
      fontSize: 13,
      border: '1px dashed rgba(240,237,230,0.08)',
      borderRadius: 8,
    }}>
      {text}
    </div>
  );
}
