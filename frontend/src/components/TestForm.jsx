import React, { useState } from 'react';
import { HTTP_METHODS, methodColor } from '../utils/helpers';
import { HintIcon } from './Shared';

const HINTS = {
  name: 'Краткое имя теста для удобства поиска в списке.\nПример: "Homepage GET smoke", "Checkout 50 RPS".',
  description: 'Опционально. Контекст: цель теста, кто заказал, ссылки на тикеты.',
  http_method:
    'HTTP-метод запроса.\nGET — чтение, POST — создание, PUT — полная замена,\nPATCH — частичное обновление, DELETE — удаление,\nHEAD — заголовки без тела, OPTIONS — CORS preflight.',
  target_url:
    'Полный URL включая схему (https://).\nПоддерживает плейсхолдеры:\n• {request_number} — порядковый номер запроса (1, 2, ...)\n• {user_number} — номер виртуального юзера\n• {random} — случайный UUID hex\n• {timestamp} — Unix-время в мс\n\nПример: https://api.example.com/posts/{request_number}',
  headers:
    'Дополнительные HTTP-заголовки в формате JSON.\nПример:\n{\n  "Authorization": "Bearer eyJhbGc...",\n  "X-API-Key": "secret"\n}',
  body:
    'Тело запроса. Для JSON — валидный объект (без backslash-экранирования).\nПоддерживает те же плейсхолдеры, что и URL.\n\nПример: {"title": "{random}", "userId": {user_number}}',
  content_type:
    'Заголовок Content-Type для тела запроса.\nДобавляется автоматически, если не указан в headers.',
  total_requests:
    'Сколько всего запросов отправит тест.\nЧем больше — тем точнее статистика, но и дольше выполнение.\nРекомендация: 100–1000 для smoke, 10000+ для нагрузочного.',
  concurrent_users:
    'Сколько виртуальных юзеров отправляют запросы параллельно.\nКаждый юзер последовательно отправляет (total_requests / concurrent_users) запросов.\nЭто и есть параллельная нагрузка на сервер.',
  ramp_up_seconds:
    'За какое время постепенно запускаются все юзеры.\n0 = все стартуют одновременно (резкий пик).\nБольше = плавный рост нагрузки.\nПример: 60 секунд для 100 юзеров = +1.6 юзер/сек.',
  timeout_seconds:
    'Максимальное время ожидания ответа для одного запроса.\nЕсли сервер не ответил за это время — запрос помечается как ошибка.',
  think_time_ms:
    'Пауза между запросами одного юзера в миллисекундах.\nИмитирует "думающего" пользователя.\n0 = максимальная RPS, юзер шлёт следующий запрос сразу.',
};

function LabeledField({ name, label, required, children }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        {label}{required && ' *'}
        {HINTS[name] && <HintIcon text={HINTS[name]} side="right" />}
      </label>
      {children}
    </div>
  );
}

const DEFAULTS = {
  name: '',
  description: '',
  target_url: '',
  http_method: 'GET',
  headers: '',
  body: '',
  content_type: 'application/json',
  total_requests: 100,
  concurrent_users: 10,
  ramp_up_seconds: 0,
  timeout_seconds: 30,
  think_time_ms: 0,
};

export default function TestForm({ initialData, onSubmit, loading }) {
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        ...DEFAULTS,
        ...initialData,
        headers: initialData.headers ? JSON.stringify(initialData.headers, null, 2) : '',
      };
    }
    return DEFAULTS;
  });

  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.target_url.trim()) errs.target_url = 'Target URL is required';
    try {
      new URL(form.target_url);
    } catch {
      errs.target_url = 'Must be a valid URL';
    }
    if (form.headers) {
      try { JSON.parse(form.headers); } catch { errs.headers = 'Must be valid JSON'; }
    }
    if (form.total_requests < 1) errs.total_requests = 'Minimum 1';
    if (form.concurrent_users < 1) errs.concurrent_users = 'Minimum 1';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      ...form,
      headers: form.headers ? JSON.parse(form.headers) : null,
      body: form.body || null,
    };
    onSubmit(data);
  };

  const showBody = !['GET', 'HEAD', 'OPTIONS'].includes(form.http_method);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <section>
        <h3 className="font-display font-semibold text-surface-200 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <LabeledField name="name" label="Test Name" required>
            <input
              className="input-field"
              placeholder="e.g., Homepage Load Test"
              value={form.name}
              onChange={set('name')}
            />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </LabeledField>
          <LabeledField name="description" label="Description">
            <textarea
              className="input-field resize-none h-20"
              placeholder="Optional description of the test scenario…"
              value={form.description}
              onChange={set('description')}
            />
          </LabeledField>
        </div>
      </section>

      {/* Request Config */}
      <section>
        <h3 className="font-display font-semibold text-surface-200 mb-4">Request Configuration</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-40">
              <LabeledField name="http_method" label="Method">
                <select className="select-field" value={form.http_method} onChange={set('http_method')}>
                  {HTTP_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </LabeledField>
            </div>
            <div className="flex-1">
              <LabeledField name="target_url" label="Target URL" required>
                <input
                  className="input-field"
                  placeholder="https://api.example.com/posts/{request_number}"
                  value={form.target_url}
                  onChange={set('target_url')}
                />
                {errors.target_url && <p className="text-danger text-xs mt-1">{errors.target_url}</p>}
              </LabeledField>
            </div>
          </div>

          <LabeledField name="headers" label="Headers (JSON)">
            <textarea
              className="input-field resize-none h-24 font-mono text-xs"
              placeholder='{"Authorization": "Bearer token123"}'
              value={form.headers}
              onChange={set('headers')}
            />
            {errors.headers && <p className="text-danger text-xs mt-1">{errors.headers}</p>}
          </LabeledField>

          {showBody && (
            <>
              <div className="grid grid-cols-[1fr_200px] gap-3">
                <LabeledField name="body" label="Request Body">
                  <textarea
                    className="input-field resize-none h-32 font-mono text-xs"
                    placeholder='{"title": "{random}", "userId": {user_number}}'
                    value={form.body}
                    onChange={set('body')}
                  />
                </LabeledField>
                <LabeledField name="content_type" label="Content Type">
                  <select className="select-field" value={form.content_type} onChange={set('content_type')}>
                    <option value="application/json">application/json</option>
                    <option value="application/xml">application/xml</option>
                    <option value="text/plain">text/plain</option>
                    <option value="application/x-www-form-urlencoded">form-urlencoded</option>
                    <option value="multipart/form-data">multipart/form-data</option>
                  </select>
                </LabeledField>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Load Parameters */}
      <section>
        <h3 className="font-display font-semibold text-surface-200 mb-4">Load Parameters</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <LabeledField name="total_requests" label="Total Requests">
            <input
              type="number"
              className="input-field"
              min={1}
              max={100000}
              value={form.total_requests}
              onChange={set('total_requests')}
            />
            {errors.total_requests && <p className="text-danger text-xs mt-1">{errors.total_requests}</p>}
          </LabeledField>
          <LabeledField name="concurrent_users" label="Concurrent Users">
            <input
              type="number"
              className="input-field"
              min={1}
              max={1000}
              value={form.concurrent_users}
              onChange={set('concurrent_users')}
            />
            {errors.concurrent_users && <p className="text-danger text-xs mt-1">{errors.concurrent_users}</p>}
          </LabeledField>
          <LabeledField name="ramp_up_seconds" label="Ramp-Up (seconds)">
            <input
              type="number"
              className="input-field"
              min={0}
              max={600}
              value={form.ramp_up_seconds}
              onChange={set('ramp_up_seconds')}
            />
          </LabeledField>
          <LabeledField name="timeout_seconds" label="Timeout (seconds)">
            <input
              type="number"
              className="input-field"
              min={1}
              max={120}
              step={0.5}
              value={form.timeout_seconds}
              onChange={set('timeout_seconds')}
            />
          </LabeledField>
          <LabeledField name="think_time_ms" label="Think Time (ms)">
            <input
              type="number"
              className="input-field"
              min={0}
              max={10000}
              value={form.think_time_ms}
              onChange={set('think_time_ms')}
            />
          </LabeledField>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-800/60">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initialData ? 'Update Test' : 'Create Test'}
        </button>
      </div>
    </form>
  );
}
