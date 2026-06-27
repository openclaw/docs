---
read_when:
    - Ви хочете, щоб Prometheus, Grafana, VictoriaMetrics або інший скрейпер збирав метрики OpenClaw Gateway
    - Вам потрібні назви метрик Prometheus і політика міток для панелей моніторингу або сповіщень
    - Вам потрібні метрики без запуску колектора OpenTelemetry
sidebarTitle: Prometheus
summary: Надайте діагностику OpenClaw як текстові метрики Prometheus через Plugin diagnostics-prometheus
title: Метрики Prometheus
x-i18n:
    generated_at: "2026-06-27T17:35:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw може надавати діагностичні метрики через офіційний Plugin `diagnostics-prometheus`. Він прослуховує довірену діагностику, а також події стабільності gateway, які генерує ядро, а потім віддає текстову кінцеву точку Prometheus за адресою:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Тип вмісту — `text/plain; version=0.0.4; charset=utf-8`, стандартний формат експозиції Prometheus.

  <Warning>
  Маршрут використовує автентифікацію Gateway (область оператора). Не відкривайте його як публічну неавтентифіковану кінцеву точку `/metrics`. Збирайте метрики через той самий шлях автентифікації, який ви використовуєте для інших API оператора.
  </Warning>

  Для трасувань, журналів, OTLP push і семантичних атрибутів OpenTelemetry GenAI див. [експорт OpenTelemetry](/uk/gateway/opentelemetry).

  ## Швидкий старт

  <Steps>
  <Step title="Установіть Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
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
    HTTP-маршрут реєструється під час запуску Plugin, тому перезавантажте після ввімкнення.
  </Step>
  <Step title="Збирайте дані із захищеного маршруту">
    Надішліть ту саму автентифікацію gateway, яку використовують ваші операторські клієнти:

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
Потрібно встановити `diagnostics.enabled: true`. Без цього plugin усе одно реєструє HTTP-маршрут, але діагностичні події не надходять до експортера, тому відповідь порожня.
</Note>

## Експортовані метрики

| Метрика                                          | Тип       | Мітки                                                                                     |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | лічильник | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | гістограма | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | лічильник | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | гістограма | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | лічильник | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | лічильник | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | гістограма | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | лічильник | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | лічильник | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | лічильник | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | гістограма | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | лічильник | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | лічильник | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | гістограма | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | лічильник | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | лічильник | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | гістограма | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | лічильник | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | лічильник | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | лічильник | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | гістограма | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | лічильник | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | гістограма | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | лічильник | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | лічильник | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | гістограма | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | лічильник | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | гістограма | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | гістограма | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | вимірювач | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | гістограма | `lane`                                                                                    |
| `openclaw_session_state_total`                   | лічильник | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | вимірювач | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | лічильник | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | лічильник | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | гістограма | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | лічильник | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | гістограма | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | лічильник | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | вимірювач | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | гістограма | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | гістограма | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | гістограма | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | гістограма | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | лічильник | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | гістограма | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | вимірювач | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | гістограма | немає                                                                                     |
| `openclaw_memory_pressure_total`                 | лічильник | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | лічильник | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | лічильник | немає                                                                                     |

## Політика міток

<AccordionGroup>
  <Accordion title="Обмежені мітки з низькою кардинальністю">
    Мітки Prometheus залишаються обмеженими й низькокардинальними. Експортер не видає необроблені діагностичні ідентифікатори, як-от `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ідентифікатори повідомлень, ідентифікатори чатів або ідентифікатори запитів провайдера.

    Значення міток редагуються й мають відповідати політиці OpenClaw щодо символів із низькою кардинальністю. Значення, що не проходять цю політику, замінюються на `unknown`, `other` або `none`, залежно від метрики. Мітки, схожі на ключі scoped agent session, також замінюються на `unknown`.

  </Accordion>
  <Accordion title="Обмеження серій і облік переповнення">
    Експортер обмежує збережені часові ряди в пам’яті до **2048** серій загалом для лічильників, вимірювачів і гістограм. Нові серії понад це обмеження відкидаються, а `openclaw_prometheus_series_dropped_total` збільшується на одиницю щоразу.

    Відстежуйте цей лічильник як жорсткий сигнал, що атрибут вище за потоком пропускає висококардинальні значення. Експортер ніколи не знімає обмеження автоматично; якщо значення зростає, виправте джерело замість вимикання обмеження.

  </Accordion>
  <Accordion title="Що ніколи не з’являється у виводі Prometheus">
    - текст prompt, текст відповіді, вхідні дані інструментів, вихідні дані інструментів, системні prompt
    - транскрипти Talk, аудіонавантаження, ідентифікатори викликів, ідентифікатори кімнат, токени передавання, ідентифікатори ходів і необроблені ідентифікатори сеансів
    - необроблені ідентифікатори запитів провайдера (лише обмежені хеші, де застосовно, у spans — ніколи в метриках)
    - ключі сеансів та ідентифікатори сеансів
    - імена хостів, шляхи до файлів, секретні значення

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

# Skill usage, split by bounded source
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Надавайте перевагу `gen_ai_client_token_usage` для панелей моніторингу між провайдерами: вона дотримується семантичних конвенцій OpenTelemetry GenAI і узгоджується з метриками від GenAI-сервісів поза OpenClaw.
</Tip>

## Вибір між експортом Prometheus і OpenTelemetry

OpenClaw підтримує обидві поверхні незалежно. Ви можете запускати будь-яку з них, обидві або жодну.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Модель **Pull**: Prometheus збирає `/api/diagnostics/prometheus`.
    - Зовнішній collector не потрібен.
    - Автентифікація через звичайну автентифікацію Gateway.
    - Поверхня містить лише метрики (без трас або журналів).
    - Найкраще для стеків, уже стандартизованих на Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Модель **Push**: OpenClaw надсилає OTLP/HTTP до collector або OTLP-сумісного бекенда.
    - Поверхня містить метрики, траси та журнали.
    - З’єднує з Prometheus через OpenTelemetry Collector (експортер `prometheus` або `prometheusremotewrite`), коли потрібні обидва.
    - Див. [Експорт OpenTelemetry](/uk/gateway/opentelemetry) для повного каталогу.

  </Tab>
</Tabs>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Порожнє тіло відповіді">
    - Перевірте `diagnostics.enabled: true` у конфігурації.
    - Переконайтеся, що Plugin увімкнено й завантажено за допомогою `openclaw plugins list --enabled`.
    - Згенеруйте трохи трафіку; лічильники та гістограми виводять рядки лише після принаймні однієї події.

  </Accordion>
  <Accordion title="401 / неавторизовано">
    Кінцева точка потребує області оператора Gateway (`auth: "gateway"` із `gatewayRuntimeScopeSurface: "trusted-operator"`). Використовуйте той самий токен або пароль, який Prometheus використовує для будь-якого іншого маршруту оператора Gateway. Публічного режиму без автентифікації немає.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` зростає">
    Новий атрибут перевищує обмеження у **2048** серій. Перевірте нещодавні метрики на наявність мітки з неочікувано високою кардинальністю та виправте це в джерелі. Експортер навмисно відкидає нові серії замість тихого переписування міток.
  </Accordion>
  <Accordion title="Prometheus показує застарілі серії після перезапуску">
    Plugin зберігає стан лише в пам’яті. Після перезапуску Gateway лічильники скидаються до нуля, а gauges перезапускаються з наступного повідомленого значення. Використовуйте PromQL `rate()` і `increase()`, щоб коректно обробляти скидання.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Експорт діагностики](/uk/gateway/diagnostics) — локальний zip діагностики для пакетів підтримки
- [Стан і готовність](/uk/gateway/health) — проби `/healthz` і `/readyz`
- [Журналювання](/uk/logging) — журналювання на основі файлів
- [Експорт OpenTelemetry](/uk/gateway/opentelemetry) — OTLP push для трас, метрик і журналів
