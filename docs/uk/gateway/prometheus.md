---
read_when:
    - Ви хочете, щоб Prometheus, Grafana, VictoriaMetrics або інший збирач збирав метрики OpenClaw Gateway
    - Вам потрібні назви метрик Prometheus і політика міток для інформаційних панелей або сповіщень
    - Вам потрібні метрики без запуску збирача OpenTelemetry
sidebarTitle: Prometheus
summary: Надавайте діагностичні дані OpenClaw у вигляді текстових метрик Prometheus через Plugin diagnostics-prometheus
title: Метрики Prometheus
x-i18n:
    generated_at: "2026-07-12T13:14:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw може надавати діагностичні метрики через офіційний
  Plugin `diagnostics-prometheus`. Він прослуховує довірену діагностику, а також
  внутрішньо позначені діагностичні події, якими керує диспетчер (сигнали черги, пам’яті та
  відновлення сеансів), і надає текстову кінцеву точку Prometheus за адресою:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Тип вмісту — `text/plain; version=0.0.4; charset=utf-8`, стандартний
  формат представлення Prometheus.

  <Warning>
  Маршрут використовує автентифікацію Gateway (область оператора, інтерфейс довіреного оператора). Не надавайте його як загальнодоступну неавтентифіковану кінцеву точку `/metrics`. Збирайте з нього метрики через той самий шлях автентифікації, який ви використовуєте для інших API оператора.
  </Warning>

  Відомості про трасування, журнали, надсилання через OTLP та семантичні атрибути OpenTelemetry GenAI див. у розділі [Експорт OpenTelemetry](/uk/gateway/opentelemetry).

  ## Швидкий початок

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
    HTTP-маршрут реєструється під час запуску Plugin, тому після ввімкнення перезавантажте Gateway.
  </Step>
  <Step title="Збирайте метрики із захищеного маршруту">
    Надсилайте ті самі дані автентифікації Gateway, які використовують ваші клієнти оператора:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Підключіть Prometheus">
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
Значенням `diagnostics.enabled` за замовчуванням є `true`; установлюйте його в `false` лише в середовищах із жорсткими обмеженнями. Якщо воно має значення `false`, Plugin усе одно реєструє HTTP-маршрут, але діагностичні події не надходять до експортера, тому відповідь порожня.
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
| `openclaw_model_usage_duration_seconds`          | гістограма | `agent`, `channel`, `model`, `provider`                                                   |
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
| `openclaw_queue_lane_size`                       | індикатор | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | гістограма | `lane`                                                                                    |
| `openclaw_session_state_total`                   | лічильник | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | індикатор | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | лічильник | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | лічильник | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | гістограма | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | лічильник | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | гістограма | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | лічильник | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | індикатор | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | гістограма | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | гістограма | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | гістограма | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | гістограма | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | лічильник | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | гістограма | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | індикатор | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | гістограма | немає                                                                                     |
| `openclaw_memory_pressure_total`                 | лічильник | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | лічильник | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | лічильник | немає                                                                                     |
| `openclaw_diagnostic_async_queue_dropped_total`  | лічильник | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | індикатор | немає                                                                                     |

## Політика міток

<AccordionGroup>
  <Accordion title="Обмежені мітки з низькою кардинальністю">
    Мітки Prometheus залишаються обмеженими та мають низьку кардинальність. Експортер не виводить необроблені діагностичні ідентифікатори, як-от `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ідентифікатори повідомлень, чатів або запитів до постачальника.

    Значення міток редагуються та мають відповідати політиці OpenClaw щодо символів із низькою кардинальністю. Значення, які не відповідають політиці, замінюються на `unknown`, `other` або `none` залежно від метрики. Мітки, схожі на ключі сеансів агентів з областю видимості, також замінюються на `unknown`.

  </Accordion>
  <Accordion title="Обмеження кількості часових рядів і облік перевищення">
    Експортер обмежує кількість часових рядів, що зберігаються в пам’яті, до **2048** для лічильників, індикаторів і гістограм разом. Нові ряди понад це обмеження відкидаються, а `openclaw_prometheus_series_dropped_total` щоразу збільшується на одиницю.

    Відстежуйте цей лічильник як однозначний сигнал того, що атрибут вище за потоком пропускає значення з високою кардинальністю. Експортер ніколи не підвищує обмеження автоматично; якщо значення лічильника зростає, виправте джерело, а не вимикайте обмеження.

  </Accordion>
  <Accordion title="Що ніколи не потрапляє до виводу Prometheus">
    - текст запиту, текст відповіді, вхідні дані інструментів, вихідні дані інструментів, системні запити
    - транскрипти Talk, аудіодані, ідентифікатори викликів, ідентифікатори кімнат, токени передавання, ідентифікатори ходів і необроблені ідентифікатори сеансів
    - необроблені ідентифікатори запитів постачальника (лише обмежені хеші, де це застосовно, у span — ніколи в метриках)
    - ключі та ідентифікатори сеансів
    - імена хостів, шляхи до файлів, значення секретів

  </Accordion>
</AccordionGroup>

## Рецепти PromQL

```promql
# Кількість токенів за хвилину, розподілена за постачальниками
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Витрати (USD) за останню годину, за моделями
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95-й процентиль тривалості виконання моделі
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO часу очікування в черзі (95-й процентиль менше ніж 2 с)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Використання Skills, розподілене за обмеженим джерелом
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Відкинуті ряди Prometheus (сигнал тривоги щодо кардинальності)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Для інформаційних панелей із кількома постачальниками віддавайте перевагу `gen_ai_client_token_usage`: ця метрика відповідає семантичним угодам OpenTelemetry GenAI та узгоджується з метриками служб GenAI, що не належать до OpenClaw.
</Tip>

## Вибір між експортом Prometheus і OpenTelemetry

OpenClaw підтримує обидва інтерфейси незалежно. Можна використовувати будь-який із них, обидва або жодного.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Модель **отримання**: Prometheus опитує `/api/diagnostics/prometheus`.
    - Зовнішній збирач не потрібен.
    - Автентифікація виконується через звичайний механізм автентифікації Gateway.
    - Інтерфейс містить лише метрики (без трасувань і журналів).
    - Найкраще підходить для стеків, уже стандартизованих на Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Модель **надсилання**: OpenClaw надсилає OTLP/HTTP до збирача або сумісної з OTLP серверної системи.
    - Інтерфейс містить метрики, трасування та журнали.
    - Забезпечує інтеграцію з Prometheus через OpenTelemetry Collector (експортер `prometheus` або `prometheusremotewrite`), коли потрібні обидва інтерфейси.
    - Повний каталог див. у розділі [Експорт OpenTelemetry](/uk/gateway/opentelemetry).

  </Tab>
</Tabs>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Порожнє тіло відповіді">
    - Переконайтеся, що для `diagnostics.enabled` у конфігурації не встановлено значення `false` (типове значення — `true`).
    - Переконайтеся, що Plugin увімкнено та завантажено, за допомогою `openclaw plugins list --enabled`.
    - Створіть певний трафік; лічильники та гістограми виводять рядки лише після принаймні однієї події.

  </Accordion>
  <Accordion title="401 / немає авторизації">
    Кінцева точка потребує області дії оператора Gateway (`auth: "gateway"` із `gatewayRuntimeScopeSurface: "trusted-operator"`). Використовуйте той самий токен або пароль, який Prometheus використовує для будь-якого іншого маршруту оператора Gateway. Загальнодоступного режиму без автентифікації немає.
  </Accordion>
  <Accordion title="Значення `openclaw_prometheus_series_dropped_total` зростає">
    Новий атрибут перевищує обмеження в **2048** рядів. Перевірте останні метрики на наявність мітки з неочікувано високою кардинальністю та виправте її в джерелі. Експортер навмисно відкидає нові ряди замість непомітного переписування міток.
  </Accordion>
  <Accordion title="Prometheus показує застарілі ряди після перезапуску">
    Plugin зберігає стан лише в пам’яті. Після перезапуску Gateway лічильники скидаються до нуля, а індикатори відновлюються з наступного переданого значення. Використовуйте функції PromQL `rate()` та `increase()`, щоб коректно обробляти скидання.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Експорт діагностики](/uk/gateway/diagnostics) — локальний ZIP-архів діагностики для пакетів підтримки
- [Стан і готовність](/uk/gateway/health) — проби `/healthz` і `/readyz`
- [Ведення журналів](/uk/logging) — ведення журналів у файлах
- [Експорт OpenTelemetry](/uk/gateway/opentelemetry) — надсилання через OTLP трасувань, метрик і журналів
