---
read_when:
    - Ви хочете, щоб Prometheus, Grafana, VictoriaMetrics або інший скрейпер збирав метрики OpenClaw Gateway
    - Вам потрібні назви метрик Prometheus і політика міток для панелей моніторингу або сповіщень
    - Вам потрібні метрики без запуску колектора OpenTelemetry
sidebarTitle: Prometheus
summary: Надайте діагностику OpenClaw як текстові метрики Prometheus через Plugin diagnostics-prometheus
title: Метрики Prometheus
x-i18n:
    generated_at: "2026-05-02T15:15:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw може надавати діагностичні метрики через офіційний Plugin `diagnostics-prometheus`. Він слухає довірену внутрішню діагностику та віддає текстову кінцеву точку Prometheus за адресою:

```text
GET /api/diagnostics/prometheus
```

Тип вмісту — `text/plain; version=0.0.4; charset=utf-8`, стандартний формат експозиції Prometheus.

<Warning>
Маршрут використовує автентифікацію Gateway (область оператора). Не відкривайте його як публічну неавтентифіковану кінцеву точку `/metrics`. Зчитуйте його через той самий шлях автентифікації, який ви використовуєте для інших API оператора.
</Warning>

Для трасувань, журналів, OTLP push і семантичних атрибутів OpenTelemetry GenAI див. [Експорт OpenTelemetry](/uk/gateway/opentelemetry).

## Швидкий старт

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Enable the plugin">
    <Tabs>
      <Tab title="Config">
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
  <Step title="Restart the Gateway">
    HTTP-маршрут реєструється під час запуску Plugin, тож перезавантажте після ввімкнення.
  </Step>
  <Step title="Scrape the protected route">
    Надішліть ті самі облікові дані автентифікації Gateway, які використовують ваші операторські клієнти:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Wire Prometheus">
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
`diagnostics.enabled: true` є обов’язковим. Без нього Plugin усе одно реєструє HTTP-маршрут, але діагностичні події не надходять в експортер, тому відповідь порожня.
</Note>

## Експортовані метрики

| Метрика                                       | Тип       | Мітки                                                                                     |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | лічильник | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | гістограма | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | лічильник | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | гістограма | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | лічильник | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | гістограма | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | лічильник | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | лічильник | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | гістограма | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | лічильник | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | гістограма | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | лічильник | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | гістограма | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | лічильник | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | гістограма | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | вимірювач | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | гістограма | `lane`                                                                                    |
| `openclaw_session_state_total`                | лічильник | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | вимірювач | `state`                                                                                   |
| `openclaw_memory_bytes`                       | вимірювач | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | гістограма | немає                                                                                     |
| `openclaw_memory_pressure_total`              | лічильник | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | лічильник | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | лічильник | немає                                                                                     |

## Політика міток

<AccordionGroup>
  <Accordion title="Bounded, low-cardinality labels">
    Мітки Prometheus залишаються обмеженими та низькокардинальними. Експортер не виводить необроблені діагностичні ідентифікатори, як-от `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ідентифікатори повідомлень, ідентифікатори чатів або ідентифікатори запитів провайдера.

    Значення міток редагуються та мають відповідати політиці OpenClaw щодо низькокардинальних символів. Значення, що не відповідають політиці, замінюються на `unknown`, `other` або `none` залежно від метрики.

  </Accordion>
  <Accordion title="Series cap and overflow accounting">
    Експортер обмежує кількість збережених часових рядів у пам’яті до **2048** рядів сумарно для лічильників, вимірювачів і гістограм. Нові ряди понад цей ліміт відкидаються, а `openclaw_prometheus_series_dropped_total` щоразу збільшується на одиницю.

    Відстежуйте цей лічильник як чіткий сигнал, що вищий за потоком атрибут пропускає висококардинальні значення. Експортер ніколи не піднімає ліміт автоматично; якщо він зростає, виправте джерело, а не вимикайте ліміт.

  </Accordion>
  <Accordion title="What never appears in Prometheus output">
    - текст підказок, текст відповідей, вхідні дані інструментів, вихідні дані інструментів, системні підказки
    - необроблені ідентифікатори запитів провайдера (лише обмежені хеші, де застосовно, у span — ніколи в метриках)
    - ключі сеансів та ідентифікатори сеансів
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
Надавайте перевагу `gen_ai_client_token_usage` для панелей моніторингу між провайдерами: він відповідає семантичним конвенціям OpenTelemetry GenAI і узгоджується з метриками від сервісів GenAI поза OpenClaw.
</Tip>

## Вибір між Prometheus і експортом OpenTelemetry

OpenClaw підтримує обидві поверхні незалежно. Ви можете запускати будь-яку з них, обидві або жодну.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Модель **pull**: Prometheus зчитує `/api/diagnostics/prometheus`.
    - Зовнішній колектор не потрібен.
    - Автентифікація через звичайну автентифікацію Gateway.
    - Поверхня містить лише метрики (без трасувань або журналів).
    - Найкраще підходить для стеків, уже стандартизованих на Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Модель **push**: OpenClaw надсилає OTLP/HTTP до колектора або OTLP-сумісного бекенду.
    - Поверхня містить метрики, трасування та журнали.
    - З’єднує з Prometheus через OpenTelemetry Collector (експортер `prometheus` або `prometheusremotewrite`), коли потрібні обидва.
    - Повний каталог див. у [Експорт OpenTelemetry](/uk/gateway/opentelemetry).

  </Tab>
</Tabs>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Empty response body">
    - Перевірте `diagnostics.enabled: true` у конфігурації.
    - Підтвердьте, що Plugin увімкнено та завантажено за допомогою `openclaw plugins list --enabled`.
    - Згенеруйте трохи трафіку; лічильники та гістограми виводять рядки лише після принаймні однієї події.

  </Accordion>
  <Accordion title="401 / unauthorized">
    Кінцева точка потребує операторської області Gateway (`auth: "gateway"` з `gatewayRuntimeScopeSurface: "trusted-operator"`). Використовуйте той самий токен або пароль, який Prometheus використовує для будь-якого іншого операторського маршруту Gateway. Публічного неавтентифікованого режиму немає.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` is climbing">
    Новий атрибут перевищує ліміт у **2048** рядів. Перегляньте нещодавні метрики на наявність неочікувано висококардинальної мітки та виправте її в джерелі. Експортер навмисно відкидає нові ряди замість того, щоб непомітно переписувати мітки.
  </Accordion>
  <Accordion title="Prometheus shows stale series after a restart">
    Plugin зберігає стан лише в пам’яті. Після перезапуску Gateway лічильники скидаються до нуля, а вимірювачі відновлюються з наступного повідомленого значення. Використовуйте PromQL `rate()` і `increase()`, щоб коректно обробляти скидання.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Експорт діагностики](/uk/gateway/diagnostics) — локальний zip-файл діагностики для пакетів підтримки
- [Стан і готовність](/uk/gateway/health) — проби `/healthz` і `/readyz`
- [Журналювання](/uk/logging) — журналювання на основі файлів
- [Експорт OpenTelemetry](/uk/gateway/opentelemetry) — OTLP push для трасувань, метрик і журналів
