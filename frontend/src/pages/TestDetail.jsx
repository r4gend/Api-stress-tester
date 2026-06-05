import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play, Square, Trash2, Edit3, ArrowLeft,
  Clock, Users, Gauge, AlertTriangle, CheckCircle, XCircle, TrendingUp,
} from 'lucide-react';
import { usePolling, useFetch } from '../hooks/usePolling';
import { fetchTest, fetchTimeline, fetchProgress, runTest, cancelTest, deleteTest } from '../utils/api';
import { StatusBadge, StatCard, PageLoading, Spinner, HintIcon } from '../components/Shared';
import {
  ResponseTimeChart, StatusCodeChart, ThroughputChart, LatencyScatterChart,
} from '../components/Charts';
import {
  formatDuration, formatNumber, formatPercent, formatDate, methodColor,
} from '../utils/helpers';

export default function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(null);

  const isRunning = (test) => test?.status === 'running';

  const {
    data: test, loading, refresh,
  } = usePolling(
    useCallback(() => fetchTest(id), [id]),
    2000,
    true,
  );

  const {
    data: timeline, refresh: refreshTimeline,
  } = usePolling(
    useCallback(() => fetchTimeline(id), [id]),
    3000,
    test?.status === 'running' || test?.status === 'completed',
  );

  const {
    data: progress,
  } = usePolling(
    useCallback(() => fetchProgress(id), [id]),
    2000,
    test?.status === 'running',
  );

  const handleRun = async () => {
    setActionLoading('run');
    try {
      await runTest(id);
      refresh();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    try {
      await cancelTest(id);
      refresh();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this test and all results?')) return;
    await deleteTest(id);
    navigate('/tests');
  };

  const hasResults = test?.status === 'completed' || test?.status === 'failed';
  const timelinePoints = timeline?.points || [];

  // Live stats: derive from timeline during running, use stored aggregates after completion.
  // IMPORTANT: useMemo must be called unconditionally — before any early returns.
  const liveStats = useMemo(() => {
    if (!test) return {};
    if (hasResults) {
      return {
        avg_response_time_ms: test.avg_response_time_ms,
        requests_per_second: test.requests_per_second,
        error_rate: test.error_rate,
        failed_requests: test.failed_requests,
        successful_requests: test.successful_requests,
        total_requests_sent: test.total_requests_sent,
      };
    }
    if (test.status === 'running' && timelinePoints.length > 0) {
      const total = timelinePoints.length;
      const failed = timelinePoints.filter((p) => p.is_error).length;
      const success = total - failed;
      const avg = timelinePoints.reduce((s, p) => s + p.response_time_ms, 0) / total;
      const duration = timeline?.duration_seconds || 0;
      const rps = duration > 0 ? total / duration : 0;
      return {
        avg_response_time_ms: avg,
        requests_per_second: Math.round(rps * 100) / 100,
        error_rate: (failed / total) * 100,
        failed_requests: failed,
        successful_requests: success,
        total_requests_sent: total,
      };
    }
    return {};
  }, [hasResults, test, timelinePoints, timeline]);

  // Build status distribution live from timeline if test still running
  const liveStatusDist = useMemo(() => {
    if (!test) return null;
    if (hasResults) return test.status_code_distribution;
    if (timelinePoints.length === 0) return null;
    const dist = {};
    timelinePoints.forEach((p) => {
      const key = p.status_code ? String(p.status_code) : 'error';
      dist[key] = (dist[key] || 0) + 1;
    });
    return dist;
  }, [hasResults, test, timelinePoints]);

  if (loading && !test) return <PageLoading />;
  if (!test) return <div className="text-center text-surface-500 py-20">Test not found</div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <Link to="/tests" className="btn-ghost inline-flex items-center gap-1.5 text-sm mb-4 -ml-4">
          <ArrowLeft className="w-4 h-4" /> Back to Tests
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className={`font-mono text-sm font-bold ${methodColor(test.http_method)}`}>
                {test.http_method}
              </span>
              <h2 className="font-display text-2xl font-bold text-surface-100 truncate">
                {test.name}
              </h2>
              <StatusBadge status={test.status} />
            </div>
            <p className="text-sm text-surface-500 font-mono mt-1 truncate">{test.target_url}</p>
            {test.description && (
              <p className="text-sm text-surface-400 mt-2">{test.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {test.status === 'running' ? (
              <button
                onClick={handleCancel}
                className="btn-danger flex items-center gap-2"
                disabled={actionLoading === 'cancel'}
              >
                {actionLoading === 'cancel' ? <Spinner size="sm" /> : <Square className="w-4 h-4" />}
                Cancel
              </button>
            ) : (
              <button
                onClick={handleRun}
                className="btn-primary flex items-center gap-2"
                disabled={actionLoading === 'run'}
              >
                {actionLoading === 'run' ? <Spinner size="sm" /> : <Play className="w-4 h-4" />}
                {hasResults ? 'Re-run' : 'Run Test'}
              </button>
            )}
            <button onClick={handleDelete} className="btn-danger p-2.5" title="Delete test">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Config Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="w-3.5 h-3.5 text-surface-500" />
            <span className="stat-label">Total Requests</span>
          </div>
          <p className="font-mono font-bold text-surface-200">{formatNumber(test.total_requests)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-surface-500" />
            <span className="stat-label">Concurrent Users</span>
          </div>
          <p className="font-mono font-bold text-surface-200">{test.concurrent_users}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-surface-500" />
            <span className="stat-label">Ramp-Up</span>
          </div>
          <p className="font-mono font-bold text-surface-200">{test.ramp_up_seconds}s</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-surface-500" />
            <span className="stat-label">Timeout</span>
          </div>
          <p className="font-mono font-bold text-surface-200">{test.timeout_seconds}s</p>
        </div>
      </div>

      {/* Running indicator */}
      {test.status === 'running' && (
        <div className="card p-5 border-accent/30 bg-accent/5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Spinner size="sm" />
              <p className="font-medium text-accent">Test is running…</p>
            </div>
            {progress && progress.total > 0 && (
              <span className="font-mono text-sm text-surface-300">
                {formatNumber(progress.completed)} / {formatNumber(progress.total)}
              </span>
            )}
          </div>
          {progress && progress.total > 0 ? (
            <>
              <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (progress.completed / progress.total) * 100).toFixed(1)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-surface-500">
                <span>{((progress.completed / progress.total) * 100).toFixed(1)}% complete</span>
                {progress.errors > 0 && (
                  <span className="text-danger">{formatNumber(progress.errors)} errors</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-surface-400">Starting virtual users…</p>
          )}
        </div>
      )}

      {/* Live stats during running, final stats after completion */}
      {(hasResults || (test.status === 'running' && timelinePoints.length > 0)) && (
        <>
          {/* Key Metrics */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-surface-200">
                {test.status === 'running' ? 'Live Metrics' : 'Results Summary'}
              </h3>
              {test.status === 'running' && (
                <span className="text-xs text-accent flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" /> live
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Avg Response"
                value={formatDuration(liveStats.avg_response_time_ms)}
                accent
                hint="Среднее время отклика (мс) по всем выполненным запросам.&#10;Чувствительно к выбросам — большие max могут сильно повысить avg."
              />
              <StatCard
                label="Requests/sec"
                value={liveStats.requests_per_second != null ? `${liveStats.requests_per_second}` : '—'}
                sub="throughput"
                hint="Пропускная способность: сколько запросов завершается в секунду.&#10;Это и есть RPS — главная метрика нагрузки."
              />
              <StatCard
                label="Error Rate"
                value={formatPercent(liveStats.error_rate)}
                sub={`${formatNumber(liveStats.failed_requests)} failed`}
                hint="Процент запросов, завершившихся ошибкой.&#10;Ошибкой считается: HTTP ≥ 400, таймаут, сетевая ошибка."
              />
              <StatCard
                label="Success"
                value={formatNumber(liveStats.successful_requests)}
                sub={`of ${formatNumber(liveStats.total_requests_sent)}`}
                hint="Количество успешных запросов (HTTP < 400).&#10;Под дробью — общее число отправленных запросов."
              />
            </div>
          </section>

          {/* Percentiles — only after completion (need full sample) */}
          {hasResults && test.avg_response_time_ms != null && (
            <section>
              <h3 className="font-display font-semibold text-surface-200 mb-4 flex items-center gap-2">
                Response Time Percentiles
                <HintIcon
                  text={`Перцентили показывают распределение времени ответа.\n\nMin/Max — крайние значения.\np50 (медиана) — половина запросов быстрее этого значения.\np95 — 95% запросов укладываются в это время.\np99 — "хвост" — самые медленные 1%.\n\np95/p99 важнее avg для UX: они показывают опыт худших юзеров.`}
                  side="right"
                />
              </h3>
              <div className="card overflow-hidden">
                <div className="grid grid-cols-5 divide-x divide-surface-800/60">
                  {[
                    { label: 'Min', value: test.min_response_time_ms },
                    { label: 'Median (p50)', value: test.median_response_time_ms },
                    { label: 'p95', value: test.p95_response_time_ms },
                    { label: 'p99', value: test.p99_response_time_ms },
                    { label: 'Max', value: test.max_response_time_ms },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-4 text-center">
                      <p className="stat-label">{label}</p>
                      <p className="font-mono font-bold text-surface-200 mt-1">{formatDuration(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Charts */}
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-surface-200 flex items-center gap-2">
              {test.status === 'running' ? 'Real-time Charts' : 'Charts'}
              <HintIcon
                text="Графики обновляются каждые 3 секунды во время выполнения теста.&#10;&#10;Response Time — время отклика по времени&#10;Throughput — RPS и ошибки по секундам&#10;Status Codes — распределение HTTP-кодов&#10;Latency Scatter — точечный график задержек"
              />
            </h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ResponseTimeChart data={timelinePoints} />
              <ThroughputChart data={timelinePoints} />
              <StatusCodeChart distribution={liveStatusDist} />
              <LatencyScatterChart data={timelinePoints} />
            </div>
          </section>
        </>
      )}

      {/* Timing */}
      {(test.started_at || test.completed_at) && (
        <section className="text-xs text-surface-600 flex gap-6">
          {test.started_at && <span>Started: {formatDate(test.started_at)}</span>}
          {test.completed_at && <span>Completed: {formatDate(test.completed_at)}</span>}
        </section>
      )}
    </div>
  );
}
