---
read_when:
    - Вы хотите, чтобы Prometheus, Grafana, VictoriaMetrics или другой сборщик собирал метрики OpenClaw Gateway
    - Вам нужны имена метрик Prometheus и правила использования меток для панелей мониторинга или оповещений.
    - Вам нужны метрики без запуска коллектора OpenTelemetry
sidebarTitle: Prometheus
summary: Предоставление диагностических данных OpenClaw в виде текстовых метрик Prometheus через Plugin diagnostics-prometheus
title: Метрики Prometheus
x-i18n:
    generated_at: "2026-07-12T11:25:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw может предоставлять диагностические метрики через официальный
  Plugin `diagnostics-prometheus`. Он принимает доверенные диагностические события, а также
  внутренне помеченные диагностические события, принадлежащие диспетчеру (сигналы очереди, памяти и
  восстановления сеансов), и формирует текстовую конечную точку Prometheus по адресу:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Тип содержимого — `text/plain; version=0.0.4; charset=utf-8`, стандартный
  формат представления Prometheus.

  <Warning>
  Маршрут использует аутентификацию Gateway (область действия оператора, интерфейс доверенного оператора). Не публикуйте его как общедоступную конечную точку `/metrics` без аутентификации. Собирайте с него метрики через тот же путь аутентификации, который используется для других операторских API.
  </Warning>

  Сведения о трассировках, журналах, отправке данных через OTLP и семантических атрибутах OpenTelemetry GenAI см. в разделе [Экспорт OpenTelemetry](/ru/gateway/opentelemetry).

  ## Быстрый старт

  <Steps>
  <Step title="Установите Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Включите Plugin">
    <Tabs>
      <Tab title="Конфигурация">
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
  <Step title="Перезапустите Gateway">
    HTTP-маршрут регистрируется при запуске Plugin, поэтому после включения перезапустите Gateway.
  </Step>
  <Step title="Соберите метрики с защищённого маршрута">
    Передайте те же данные аутентификации Gateway, которые используют ваши операторские клиенты:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Подключите Prometheus">
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
По умолчанию `diagnostics.enabled` имеет значение `true`; устанавливайте его в `false` только в средах с жёсткими ограничениями. Если задано значение `false`, Plugin по-прежнему регистрирует HTTP-маршрут, но диагностические события не поступают в экспортёр, поэтому ответ будет пустым.
</Note>

## Экспортируемые метрики

| Метрика                                          | Тип       | Метки                                                                                     |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | счётчик   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | гистограмма | `channel`, `model`, `outcome`, `provider`, `trigger`                                    |
| `openclaw_model_call_total`                      | счётчик   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | гистограмма | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                    |
| `openclaw_model_failover_total`                  | счётчик   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | счётчик   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | гистограмма | `model`, `provider`, `token_type`                                                       |
| `openclaw_model_cost_usd_total`                  | счётчик   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | гистограмма | `agent`, `channel`, `model`, `provider`                                                 |
| `openclaw_skill_used_total`                      | счётчик   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | счётчик   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | гистограмма | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`         |
| `openclaw_tool_execution_blocked_total`          | счётчик   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | счётчик   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | гистограмма | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | счётчик   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | счётчик   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | гистограмма | `channel`, `webhook`                                                                    |
| `openclaw_message_received_total`                | счётчик   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | счётчик   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | счётчик   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | гистограмма | `channel`, `outcome`, `reason`, `source`                                                |
| `openclaw_message_processed_total`               | счётчик   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | гистограмма | `channel`, `outcome`, `reason`                                                          |
| `openclaw_message_delivery_started_total`        | счётчик   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | счётчик   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | гистограмма | `channel`, `delivery_kind`, `error_category`, `outcome`                                 |
| `openclaw_talk_event_total`                      | счётчик   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | гистограмма | `brain`, `event_type`, `mode`, `provider`, `transport`                                  |
| `openclaw_talk_audio_bytes`                      | гистограмма | `brain`, `event_type`, `mode`, `provider`, `transport`                                  |
| `openclaw_queue_lane_size`                       | индикатор | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | гистограмма | `lane`                                                                                  |
| `openclaw_session_state_total`                   | счётчик   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | индикатор | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | счётчик   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | счётчик   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | гистограмма | `reason`, `state`                                                                       |
| `openclaw_session_recovery_total`                | счётчик   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | гистограмма | `action`, `active_work_kind`, `state`, `status`                                         |
| `openclaw_liveness_warning_total`                | счётчик   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | индикатор | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | гистограмма | `reason`                                                                                |
| `openclaw_liveness_event_loop_delay_max_seconds` | гистограмма | `reason`                                                                                |
| `openclaw_liveness_event_loop_utilization_ratio` | гистограмма | `reason`                                                                                |
| `openclaw_liveness_cpu_core_ratio`               | гистограмма | `reason`                                                                                |
| `openclaw_payload_large_total`                   | счётчик   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | гистограмма | `action`, `channel`, `plugin`, `reason`, `surface`                                      |
| `openclaw_memory_bytes`                          | индикатор | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | гистограмма | нет                                                                                     |
| `openclaw_memory_pressure_total`                 | счётчик   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | счётчик   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | счётчик   | нет                                                                                       |
| `openclaw_diagnostic_async_queue_dropped_total`  | счётчик   | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | индикатор | нет                                                                                       |

## Политика меток

<AccordionGroup>
  <Accordion title="Ограниченные метки с низкой кардинальностью">
    Метки Prometheus имеют ограниченные наборы значений и низкую кардинальность. Экспортёр не выводит исходные диагностические идентификаторы, такие как `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, идентификаторы сообщений, чатов или запросов провайдера.

    Значения меток редактируются и должны соответствовать политике OpenClaw в отношении символов для значений с низкой кардинальностью. Значения, не соответствующие политике, заменяются на `unknown`, `other` или `none` в зависимости от метрики. Метки, похожие на ключи сеансов агентов с областью действия, также заменяются на `unknown`.

  </Accordion>
  <Accordion title="Ограничение количества рядов и учёт переполнения">
    Экспортёр ограничивает количество временных рядов, хранящихся в памяти, до **2048** суммарно для счётчиков, индикаторов и гистограмм. Новые ряды сверх этого ограничения отбрасываются, а значение `openclaw_prometheus_series_dropped_total` каждый раз увеличивается на единицу.

    Следите за этим счётчиком: его рост однозначно указывает, что один из вышестоящих атрибутов пропускает значения с высокой кардинальностью. Экспортёр никогда не повышает ограничение автоматически; если значение счётчика растёт, исправьте источник, а не отключайте ограничение.

  </Accordion>
  <Accordion title="Что никогда не попадает в вывод Prometheus">
    - текст запросов, текст ответов, входные и выходные данные инструментов, системные запросы
    - расшифровки разговоров, звуковые данные, идентификаторы вызовов и комнат, токены передачи, идентификаторы реплик и необработанные идентификаторы сеансов
    - необработанные идентификаторы запросов провайдера (только хеши ограниченного размера, где применимо, в интервалах трассировки — но никогда в метриках)
    - ключи и идентификаторы сеансов
    - имена хостов, пути к файлам, значения секретов

  </Accordion>
</AccordionGroup>

## Рецепты PromQL

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
Для панелей мониторинга, охватывающих несколько провайдеров, отдавайте предпочтение `gen_ai_client_token_usage`: эта метрика соответствует семантическим соглашениям OpenTelemetry GenAI и согласуется с метриками сервисов GenAI, не относящихся к OpenClaw.
</Tip>

## Выбор между экспортом Prometheus и OpenTelemetry

OpenClaw независимо поддерживает оба интерфейса. Можно использовать любой из них, оба сразу или ни одного.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Модель **опроса**: Prometheus опрашивает `/api/diagnostics/prometheus`.
    - Внешний коллектор не требуется.
    - Аутентификация выполняется стандартными средствами Gateway.
    - Интерфейс предоставляет только метрики, без трассировок и журналов.
    - Лучше всего подходит для стеков, уже стандартизированных на Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Модель **отправки**: OpenClaw отправляет данные по OTLP/HTTP в коллектор или совместимую с OTLP серверную систему.
    - Интерфейс включает метрики, трассировки и журналы.
    - Если нужны оба варианта, интеграция с Prometheus выполняется через OpenTelemetry Collector с экспортёром `prometheus` или `prometheusremotewrite`.
    - Полный каталог см. в разделе [Экспорт OpenTelemetry](/ru/gateway/opentelemetry).

  </Tab>
</Tabs>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Пустое тело ответа">
    - Убедитесь, что для `diagnostics.enabled` в конфигурации не задано значение `false` (по умолчанию используется `true`).
    - Убедитесь, что плагин включён и загружен, с помощью команды `openclaw plugins list --enabled`.
    - Создайте некоторый трафик: счётчики и гистограммы начинают выводить строки только после хотя бы одного события.

  </Accordion>
  <Accordion title="401 / нет авторизации">
    Конечная точка требует области доступа оператора Gateway (`auth: "gateway"` с `gatewayRuntimeScopeSurface: "trusted-operator"`). Используйте тот же токен или пароль, который Prometheus использует для любых других маршрутов оператора Gateway. Общедоступного режима без аутентификации нет.
  </Accordion>
  <Accordion title="Значение `openclaw_prometheus_series_dropped_total` растёт">
    Новый атрибут приводит к превышению ограничения в **2048** рядов. Проверьте последние метрики на наличие метки с неожиданно высокой кардинальностью и исправьте её в источнике. Экспортёр намеренно отбрасывает новые ряды вместо незаметного изменения меток.
  </Accordion>
  <Accordion title="После перезапуска Prometheus показывает устаревшие ряды">
    Плагин хранит состояние только в памяти. После перезапуска Gateway счётчики сбрасываются до нуля, а индикаторы начинают с очередного переданного значения. Используйте функции PromQL `rate()` и `increase()`, чтобы корректно обрабатывать сбросы.
  </Accordion>
</AccordionGroup>

## Связанные разделы

- [Экспорт диагностических данных](/ru/gateway/diagnostics) — локальный ZIP-архив диагностики для пакетов поддержки
- [Работоспособность и готовность](/ru/gateway/health) — проверки `/healthz` и `/readyz`
- [Ведение журналов](/ru/logging) — ведение журналов в файлах
- [Экспорт OpenTelemetry](/ru/gateway/opentelemetry) — отправка по OTLP трассировок, метрик и журналов
