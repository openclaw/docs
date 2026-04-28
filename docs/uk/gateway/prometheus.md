---
read_when:
    - Ви хочете, щоб Prometheus, Grafana, VictoriaMetrics або інший скрапер збирав метрики OpenClaw Gateway
    - Вам потрібні назви метрик Prometheus і політика міток для панелей моніторингу або сповіщень
    - Вам потрібні метрики без запуску колектора OpenTelemetry
sidebarTitle: Prometheus
summary: Експортуйте діагностику OpenClaw як текстові метрики Prometheus через Plugin diagnostics-prometheus
title: Метрики Prometheus
x-i18n:
    generated_at: "2026-04-28T11:13:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw може надавати діагностичні метрики через вбудований Plugin `diagnostics-prometheus`. Він прослуховує довірені внутрішні діагностичні дані та віддає текстовий endpoint Prometheus за адресою:

```text
GET /api/diagnostics/prometheus
```

Тип вмісту — `text/plain; version=0.0.4; charset=utf-8`, стандартний формат експозиції Prometheus.

<Warning>
Маршрут використовує автентифікацію Gateway (область оператора). Не відкривайте його як публічний неавтентифікований endpoint `/metrics`. Збирайте його через той самий шлях автентифікації, який використовуєте для інших API оператора.
</Warning>

Про трасування, журнали, OTLP push і семантичні атрибути OpenTelemetry GenAI див. [експорт OpenTelemetry](/uk/gateway/opentelemetry).

## Швидкий старт

<Steps>
  <Step title="Увімкніть Plugin">
    <Tabs>
      <Tab title="Конфігурація">
        ```json5
        {
          plugins: {
            allow: ["diagnostics-prometheus"],
            entries: {
              "diagnostics-prometheus": { enabled: true },
            },
          },
          diagnostics: {
            enabled: true,
          },
        }
        ```
      </Tab>
      <Tab title="CLI">
        ```bash
        openclaw plugins enable diagnostics-prometheus
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Перезапустіть Gateway">
    HTTP-маршрут реєструється під час запуску Plugin, тому після ввімкнення перезавантажте його.
  </Step>
  <Step title="Збирайте захищений маршрут">
    Надішліть ту саму автентифікацію gateway, яку використовують ваші клієнти оператора:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Під’єднайте Prometheus">
    ```yaml
    # prometheus.yml
    scrape_configs:
      - job_name: openclaw
        scrape_interval: 30s
        metrics_path: /api/diagnostics/prometheus
        authorization:
          credentials_file: /etc/prometheus/openclaw-gateway-token
        static_configs:
          - targets: ["openclaw-gateway:18789"]
    ```
  </Step>
</Steps>

<Note>
Потрібно встановити `diagnostics.enabled: true`. Без цього Plugin усе одно реєструє HTTP-маршрут, але діагностичні події не надходять до експортера, тому відповідь буде порожньою.
</Note>

## Експортовані метрики

| Метрика                                       | Тип       | Мітки                                                                                     |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | counter   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | немає                                                                                     |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | немає                                                                                     |

## Політика міток

<AccordionGroup>
  <Accordion title="Обмежені мітки з низькою кардинальністю">
    Мітки Prometheus залишаються обмеженими та мають низьку кардинальність. Експортер не видає необроблені діагностичні ідентифікатори, як-от `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID повідомлень, ID чатів або ID запитів провайдера.

    Значення міток редагуються і мають відповідати політиці OpenClaw щодо символів із низькою кардинальністю. Значення, які не проходять цю політику, замінюються на `unknown`, `other` або `none` залежно від метрики.

  </Accordion>
  <Accordion title="Ліміт серій і облік переповнення">
    Експортер обмежує збережені в пам’яті часові ряди до **2048** серій сумарно для лічильників, датчиків і гістограм. Нові серії понад цей ліміт відкидаються, а `openclaw_prometheus_series_dropped_total` збільшується на одиницю щоразу.

    Стежте за цим лічильником як за чітким сигналом, що атрибут вище за потоком пропускає значення з високою кардинальністю. Експортер ніколи не знімає ліміт автоматично; якщо він зростає, виправте джерело, а не вимикайте ліміт.

  </Accordion>
  <Accordion title="Що ніколи не з’являється у виводі Prometheus">
    - текст prompt, текст відповіді, входи інструментів, виходи інструментів, системні prompt
    - необроблені ID запитів провайдера (лише обмежені хеші, де застосовно, у span — ніколи в метриках)
    - ключі сесій і ID сесій
    - імена хостів, шляхи файлів, секретні значення

  </Accordion>
</AccordionGroup>

## Рецепти PromQL

```promql
# Tokens per minute, split by provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Spend (USD) over the last hour, by model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95th percentile model run duration
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# Queue wait time SLO (95p under 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Віддавайте перевагу `gen_ai_client_token_usage` для панелей моніторингу між різними провайдерами: він дотримується семантичних конвенцій OpenTelemetry GenAI і узгоджується з метриками сервісів GenAI поза OpenClaw.
</Tip>

## Вибір між Prometheus і експортом OpenTelemetry

OpenClaw підтримує обидві поверхні незалежно. Ви можете використовувати одну, обидві або жодну.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Модель **Pull**: Prometheus збирає `/api/diagnostics/prometheus`.
    - Зовнішній колектор не потрібен.
    - Автентифікується через звичайну автентифікацію Gateway.
    - Поверхня містить лише метрики (без трасувань або журналів).
    - Найкраще підходить для стеків, уже стандартизованих на Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Модель **Push**: OpenClaw надсилає OTLP/HTTP до колектора або OTLP-сумісного бекенда.
    - Поверхня містить метрики, трасування та журнали.
    - Під’єднується до Prometheus через OpenTelemetry Collector (експортер `prometheus` або `prometheusremotewrite`), коли потрібні обидва.
    - Повний каталог див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).

  </Tab>
</Tabs>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Порожнє тіло відповіді">
    - Перевірте `diagnostics.enabled: true` у конфігурації.
    - Переконайтеся, що Plugin увімкнено та завантажено, за допомогою `openclaw plugins list --enabled`.
    - Згенеруйте певний трафік; лічильники й гістограми виводять рядки лише після принаймні однієї події.

  </Accordion>
  <Accordion title="401 / неавторизовано">
    Endpoint потребує області оператора Gateway (`auth: "gateway"` з `gatewayRuntimeScopeSurface: "trusted-operator"`). Використовуйте той самий токен або пароль, який Prometheus використовує для будь-якого іншого маршруту оператора Gateway. Публічного неавтентифікованого режиму немає.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` зростає">
    Новий атрибут перевищує ліміт у **2048** серій. Перегляньте останні метрики на наявність несподіваної мітки з високою кардинальністю та виправте її в джерелі. Експортер навмисно відкидає нові серії замість непомітного переписування міток.
  </Accordion>
  <Accordion title="Prometheus показує застарілі серії після перезапуску">
    Plugin зберігає стан лише в пам’яті. Після перезапуску Gateway лічильники скидаються до нуля, а датчики починають знову з наступного повідомленого значення. Використовуйте PromQL `rate()` і `increase()`, щоб коректно обробляти скидання.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Експорт діагностики](/uk/gateway/diagnostics) — локальний діагностичний zip для пакетів підтримки
- [Стан і готовність](/uk/gateway/health) — проби `/healthz` і `/readyz`
- [Журналювання](/uk/logging) — журналювання на основі файлів
- [Експорт OpenTelemetry](/uk/gateway/opentelemetry) — OTLP push для трасувань, метрик і журналів
