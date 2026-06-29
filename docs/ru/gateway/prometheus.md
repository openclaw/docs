---
read_when:
    - Вы хотите, чтобы Prometheus, Grafana, VictoriaMetrics или другой сборщик собирал метрики OpenClaw Gateway
    - Вам нужны имена метрик Prometheus и политика меток для панелей мониторинга или оповещений
    - Вам нужны метрики без запуска коллектора OpenTelemetry
sidebarTitle: Prometheus
summary: Предоставляйте диагностику OpenClaw как текстовые метрики Prometheus через plugin diagnostics-prometheus
title: Метрики Prometheus
x-i18n:
    generated_at: "2026-06-28T22:59:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw может предоставлять диагностические метрики через официальный плагин `diagnostics-prometheus`. Он прослушивает доверенную диагностику и события стабильности Gateway, генерируемые ядром, а затем отдает текстовую конечную точку Prometheus по адресу:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Тип содержимого — `text/plain; version=0.0.4; charset=utf-8`, стандартный формат экспозиции Prometheus.

  <Warning>
  Маршрут использует аутентификацию Gateway (область оператора). Не открывайте его как публичную неаутентифицированную конечную точку `/metrics`. Опрос выполняйте через тот же путь аутентификации, который вы используете для других операторских API.
  </Warning>

  Сведения о трассировках, журналах, OTLP push и семантических атрибутах OpenTelemetry GenAI см. в разделе [экспорт OpenTelemetry](/ru/gateway/opentelemetry).

  ## Быстрый старт

  <Steps>
  <Step title="Установите плагин">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Включите плагин">
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
    HTTP-маршрут регистрируется при запуске плагина, поэтому перезагрузите Gateway после включения.
  </Step>
  <Step title="Опросите защищенный маршрут">
    Отправьте те же учетные данные Gateway, которые используют ваши операторские клиенты:

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
Требуется `diagnostics.enabled: true`. Без этого Plugin по-прежнему регистрирует HTTP-маршрут, но диагностические события не поступают в экспортер, поэтому ответ пуст.
</Note>

## Экспортируемые метрики

| Метрика                                          | Тип       | Метки                                                                                     |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | счетчик   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | гистограмма | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | счетчик   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | гистограмма | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | счетчик   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | счетчик   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | гистограмма | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | счетчик   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | счетчик   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | счетчик   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | гистограмма | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | счетчик   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | счетчик   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | гистограмма | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | счетчик   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | счетчик   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | гистограмма | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | счетчик   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | счетчик   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | счетчик   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | гистограмма | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | счетчик   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | гистограмма | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | счетчик   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | счетчик   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | гистограмма | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | счетчик   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | гистограмма | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | гистограмма | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | измеритель | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | гистограмма | `lane`                                                                                    |
| `openclaw_session_state_total`                   | счетчик   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | измеритель | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | счетчик   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | счетчик   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | гистограмма | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | счетчик   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | гистограмма | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | счетчик   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | измеритель | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | гистограмма | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | гистограмма | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | гистограмма | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | гистограмма | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | счетчик   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | гистограмма | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | измеритель | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | гистограмма | нет                                                                                       |
| `openclaw_memory_pressure_total`                 | счетчик   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | счетчик   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | счетчик   | нет                                                                                       |

## Политика меток

<AccordionGroup>
  <Accordion title="Ограниченные метки с низкой кардинальностью">
    Метки Prometheus остаются ограниченными и имеют низкую кардинальность. Экспортер не передает необработанные диагностические идентификаторы, такие как `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, идентификаторы сообщений, идентификаторы чатов или идентификаторы запросов провайдера.

    Значения меток редактируются и должны соответствовать политике OpenClaw для символов с низкой кардинальностью. Значения, которые не проходят эту политику, заменяются на `unknown`, `other` или `none` в зависимости от метрики. Метки, похожие на ключи сессий агентов с областью действия, также заменяются на `unknown`.

  </Accordion>
  <Accordion title="Лимит рядов и учет переполнения">
    Экспортер ограничивает удерживаемые в памяти временные ряды суммарно **2048** рядами для счетчиков, измерителей и гистограмм. Новые ряды сверх этого лимита отбрасываются, а `openclaw_prometheus_series_dropped_total` каждый раз увеличивается на единицу.

    Отслеживайте этот счетчик как строгий сигнал о том, что какой-то вышестоящий атрибут пропускает значения с высокой кардинальностью. Экспортер никогда не снимает лимит автоматически; если счетчик растет, исправьте источник, а не отключайте лимит.

  </Accordion>
  <Accordion title="Что никогда не появляется в выводе Prometheus">
    - текст промпта, текст ответа, входные данные инструментов, выходные данные инструментов, системные промпты
    - расшифровки Talk, аудиоданные, идентификаторы звонков, идентификаторы комнат, токены передачи, идентификаторы ходов и необработанные идентификаторы сеансов
    - необработанные идентификаторы запросов провайдера (только ограниченные хэши, где применимо, в спанах — никогда в метриках)
    - ключи сеансов и идентификаторы сеансов
    - имена хостов, пути к файлам, секретные значения

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
Для панелей мониторинга с несколькими провайдерами предпочитайте `gen_ai_client_token_usage`: она следует семантическим соглашениям OpenTelemetry GenAI и согласуется с метриками из сервисов GenAI вне OpenClaw.
</Tip>

## Выбор между экспортом Prometheus и OpenTelemetry

OpenClaw поддерживает обе поверхности независимо. Вы можете использовать любую из них, обе или ни одну.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Модель **Pull**: Prometheus опрашивает `/api/diagnostics/prometheus`.
    - Внешний коллектор не требуется.
    - Аутентификация выполняется через обычную аутентификацию Gateway.
    - Поверхность предоставляет только метрики (без трассировок и журналов).
    - Лучше всего подходит для стеков, уже стандартизированных на Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Модель **Push**: OpenClaw отправляет OTLP/HTTP в коллектор или OTLP-совместимый бэкенд.
    - Поверхность включает метрики, трассировки и журналы.
    - Подключается к Prometheus через OpenTelemetry Collector (экспортер `prometheus` или `prometheusremotewrite`), когда нужны оба варианта.
    - Полный каталог см. в разделе [Экспорт OpenTelemetry](/ru/gateway/opentelemetry).

  </Tab>
</Tabs>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Пустое тело ответа">
    - Проверьте `diagnostics.enabled: true` в конфигурации.
    - Убедитесь, что Plugin включен и загружен с помощью `openclaw plugins list --enabled`.
    - Создайте трафик; счетчики и гистограммы выводят строки только после хотя бы одного события.

  </Accordion>
  <Accordion title="401 / не авторизовано">
    Эндпоинту требуется область оператора Gateway (`auth: "gateway"` с `gatewayRuntimeScopeSurface: "trusted-operator"`). Используйте тот же токен или пароль, который Prometheus использует для любого другого маршрута оператора Gateway. Публичного режима без аутентификации нет.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` растет">
    Новый атрибут превышает ограничение в **2048** серий. Проверьте недавние метрики на наличие метки с неожиданно высокой кардинальностью и исправьте ее в источнике. Экспортер намеренно отбрасывает новые серии вместо того, чтобы незаметно переписывать метки.
  </Accordion>
  <Accordion title="Prometheus показывает устаревшие серии после перезапуска">
    Plugin хранит состояние только в памяти. После перезапуска Gateway счетчики сбрасываются до нуля, а датчики начинают заново со следующего сообщенного значения. Используйте PromQL `rate()` и `increase()`, чтобы корректно обрабатывать сбросы.
  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Экспорт диагностики](/ru/gateway/diagnostics) — локальный zip-файл диагностики для пакетов поддержки
- [Работоспособность и готовность](/ru/gateway/health) — пробы `/healthz` и `/readyz`
- [Журналирование](/ru/logging) — журналирование на основе файлов
- [Экспорт OpenTelemetry](/ru/gateway/opentelemetry) — push OTLP для трассировок, метрик и журналов
