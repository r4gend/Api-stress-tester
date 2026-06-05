import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Zap, Code, Gauge, AlertTriangle, Lightbulb,
  Play, Plus, ArrowRight,
} from 'lucide-react';

function Section({ icon: Icon, title, children }) {
  return (
    <section className="card p-6 space-y-3">
      <h3 className="font-display font-semibold text-surface-100 flex items-center gap-2">
        <Icon className="w-5 h-5 text-accent" />
        {title}
      </h3>
      <div className="text-sm text-surface-400 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

function CodeBlock({ children }) {
  return (
    <pre className="bg-surface-950 border border-surface-800 rounded-lg p-3 text-xs font-mono text-surface-200 overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

function Kbd({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700 text-surface-200 text-xs font-mono">
      {children}
    </code>
  );
}

function MethodRow({ method, color, useCase, body, status, note }) {
  return (
    <tr className="border-b border-surface-800/60 last:border-0">
      <td className={`py-2.5 pr-3 font-mono font-bold text-xs ${color}`}>{method}</td>
      <td className="py-2.5 pr-3 text-surface-300">{useCase}</td>
      <td className="py-2.5 pr-3 text-surface-500 text-center">{body}</td>
      <td className="py-2.5 pr-3 font-mono text-surface-300">{status}</td>
      <td className="py-2.5 text-xs text-surface-500">{note}</td>
    </tr>
  );
}

export default function Help() {
  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs uppercase tracking-wider text-accent font-semibold">Guide</span>
        </div>
        <h2 className="font-display text-3xl font-bold text-surface-100">Как пользоваться</h2>
        <p className="text-sm text-surface-500 mt-2">
          Полная инструкция: от создания первого теста до интерпретации p99 и параллельных DELETE.
        </p>
      </div>

      {/* Quick start */}
      <Section icon={Zap} title="Быстрый старт">
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Перейдите в <Link to="/tests/new" className="text-accent hover:underline inline-flex items-center gap-1">
              New Test <Plus className="w-3.5 h-3.5" />
            </Link>
          </li>
          <li>Заполните обязательные поля: имя, URL, метод</li>
          <li>Настройте нагрузку: общее число запросов и параллельных пользователей</li>
          <li>Нажмите <Kbd>Create Test</Kbd>, затем на странице теста — <Kbd>Run Test</Kbd></li>
          <li>Графики и метрики обновляются в реальном времени каждую секунду</li>
        </ol>
      </Section>

      {/* HTTP methods */}
      <Section icon={Code} title="HTTP-методы">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-surface-500 border-b border-surface-800">
              <tr>
                <th className="pb-2 pr-3 text-left">Метод</th>
                <th className="pb-2 pr-3 text-left">Применение</th>
                <th className="pb-2 pr-3 text-center">Body</th>
                <th className="pb-2 pr-3 text-left">Успех</th>
                <th className="pb-2 text-left">Примечание</th>
              </tr>
            </thead>
            <tbody>
              <MethodRow method="GET" color="text-emerald-400" useCase="Чтение, smoke-тесты" body="—" status="200" note="Не меняет состояние" />
              <MethodRow method="POST" color="text-blue-400" useCase="Создание ресурса" body="✓" status="201" note="Каждый запрос создаёт новый объект" />
              <MethodRow method="PUT" color="text-amber-400" useCase="Полная замена" body="✓" status="200/204" note="Идемпотентно" />
              <MethodRow method="PATCH" color="text-orange-400" useCase="Частичное обновление" body="✓" status="200" note="Только изменяемые поля" />
              <MethodRow method="DELETE" color="text-red-400" useCase="Удаление" body="опц." status="200/204" note="⚠ см. предупреждение ниже" />
              <MethodRow method="HEAD" color="text-purple-400" useCase="Проверка наличия" body="—" status="200" note="Только заголовки, без тела" />
              <MethodRow method="OPTIONS" color="text-surface-400" useCase="CORS preflight" body="—" status="204" note="Проверка CORS-политики" />
            </tbody>
          </table>
        </div>
      </Section>

      {/* Placeholders */}
      <Section icon={Lightbulb} title="Плейсхолдеры в URL и body">
        <p>
          В <Kbd>Target URL</Kbd> и <Kbd>Request Body</Kbd> можно использовать переменные —
          они подставляются для каждого запроса:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="bg-surface-900/60 border border-surface-800 rounded-lg p-3">
            <code className="text-accent font-mono">{`{request_number}`}</code>
            <p className="text-surface-500 mt-1">Порядковый номер: 1, 2, 3...</p>
          </div>
          <div className="bg-surface-900/60 border border-surface-800 rounded-lg p-3">
            <code className="text-accent font-mono">{`{user_number}`}</code>
            <p className="text-surface-500 mt-1">Номер виртуального пользователя: 1..N</p>
          </div>
          <div className="bg-surface-900/60 border border-surface-800 rounded-lg p-3">
            <code className="text-accent font-mono">{`{random}`}</code>
            <p className="text-surface-500 mt-1">Случайный UUID hex для каждого запроса</p>
          </div>
          <div className="bg-surface-900/60 border border-surface-800 rounded-lg p-3">
            <code className="text-accent font-mono">{`{timestamp}`}</code>
            <p className="text-surface-500 mt-1">Unix-время в миллисекундах</p>
          </div>
        </div>

        <p className="font-semibold text-surface-300 mt-4">Пример: DELETE с уникальными ID</p>
        <CodeBlock>{`URL:    https://api.example.com/posts/{request_number}
Method: DELETE
→ DELETE /posts/1
→ DELETE /posts/2
→ DELETE /posts/3
... каждый запрос — свой ресурс, никаких 404`}</CodeBlock>

        <p className="font-semibold text-surface-300 mt-4">Пример: POST с уникальным телом</p>
        <CodeBlock>{`URL:    https://api.example.com/posts
Method: POST
Body:   {"title": "load_{random}", "userId": {user_number}}`}</CodeBlock>
      </Section>

      {/* DELETE warning */}
      <Section icon={AlertTriangle} title="⚠ Параллельные DELETE на один ресурс">
        <p>
          Если отправить <Kbd>DELETE /posts/1</Kbd> с 50 параллельными пользователями без плейсхолдеров —
          первый запрос удалит ресурс, остальные получат <Kbd>404 Not Found</Kbd>.
          Тест покажет ~98% ошибок, но это не нагрузка, а семантика идемпотентности.
        </p>
        <p>
          <strong className="text-surface-300">Правильный способ:</strong> используйте
          <code className="text-accent mx-1">{`{request_number}`}</code> в URL — каждый запрос будет удалять свой ресурс.
        </p>
        <CodeBlock>{`Плохо: DELETE https://api.example.com/posts/1     → 99% ошибок
Хорошо: DELETE https://api.example.com/posts/{request_number}`}</CodeBlock>
      </Section>

      {/* Parameters */}
      <Section icon={Gauge} title="Параметры нагрузки">
        <dl className="space-y-3">
          <div>
            <dt className="font-semibold text-surface-200">Total Requests</dt>
            <dd className="text-surface-500">
              Сколько запросов отправит тест. Чем больше — тем достовернее p95/p99.
              Smoke: 100–500. Нагрузочный: 5000+.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-surface-200">Concurrent Users</dt>
            <dd className="text-surface-500">
              Параллельность. Каждый виртуальный пользователь отправляет последовательно
              (Total / Users) запросов. Реальная нагрузка на сервер = Concurrent Users.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-surface-200">Ramp-Up</dt>
            <dd className="text-surface-500">
              Время постепенного запуска пользователей. 0 = резкий пик одновременно.
              Хорошая практика: ramp-up равен 10–30% от ожидаемой длительности теста.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-surface-200">Timeout</dt>
            <dd className="text-surface-500">
              Максимум на один запрос. По истечении — помечается ошибкой.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-surface-200">Think Time</dt>
            <dd className="text-surface-500">
              Пауза между запросами одного пользователя. Имитация «думающего» пользователя.
              0 = максимальная RPS.
            </dd>
          </div>
        </dl>
      </Section>

      {/* Metrics interpretation */}
      <Section icon={Lightbulb} title="Как читать метрики">
        <dl className="space-y-3">
          <div>
            <dt className="font-semibold text-surface-200">Avg Response Time</dt>
            <dd className="text-surface-500">
              Среднее время. Чувствительно к выбросам — один запрос на 10 секунд испортит avg.
              <strong className="text-surface-300"> Не используйте avg для SLA</strong> — он скрывает плохой опыт.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-surface-200">p95 / p99</dt>
            <dd className="text-surface-500">
              95% / 99% запросов укладываются в это время. Это опыт «обычных» и «худших» пользователей.
              Если p95 = 500 мс — каждый 20-й пользователь ждёт дольше полусекунды.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-surface-200">RPS (Requests/sec)</dt>
            <dd className="text-surface-500">
              Пропускная способность. Главная метрика для capacity planning.
              Растёт с числом юзеров до точки saturation, после которой растёт только latency.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-surface-200">Error Rate</dt>
            <dd className="text-surface-500">
              Доля запросов с HTTP ≥ 400 или сетевой ошибкой/таймаутом.
              SLO часто требует {`< 0.1%`}.
            </dd>
          </div>
        </dl>
      </Section>

      {/* Examples */}
      <Section icon={Play} title="Примеры конфигураций">
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-surface-200 mb-1">Smoke-тест</p>
            <CodeBlock>{`URL:     https://your-api.com/health
Method:  GET
Total:   100
Users:   5
Ramp-up: 0s
→ быстрая проверка что API живой`}</CodeBlock>
          </div>
          <div>
            <p className="font-semibold text-surface-200 mb-1">Baseline нагрузка</p>
            <CodeBlock>{`URL:     https://your-api.com/api/products
Method:  GET
Total:   1000
Users:   50
Ramp-up: 30s
→ ожидаемая нагрузка в проде`}</CodeBlock>
          </div>
          <div>
            <p className="font-semibold text-surface-200 mb-1">Stress-тест POST с уникальными данными</p>
            <CodeBlock>{`URL:     https://your-api.com/api/orders
Method:  POST
Body:    {"orderId": "{random}", "amount": {request_number}}
Total:   5000
Users:   100
Ramp-up: 60s
Timeout: 10s
→ ищем точку отказа на запись`}</CodeBlock>
          </div>
          <div>
            <p className="font-semibold text-surface-200 mb-1">Корректный DELETE-тест</p>
            <CodeBlock>{`URL:     https://your-api.com/api/sessions/{request_number}
Method:  DELETE
Total:   500
Users:   25
→ каждый пользователь удаляет свой набор сессий`}</CodeBlock>
          </div>
        </div>
      </Section>

      <div className="text-center pt-4">
        <Link to="/tests/new" className="btn-primary inline-flex items-center gap-2">
          Создать первый тест <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
