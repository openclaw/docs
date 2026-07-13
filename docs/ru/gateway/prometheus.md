---
read_when:
    - Вы хотите, чтобы Prometheus, Grafana, VictoriaMetrics или другой сборщик собирал метрики OpenClaw Gateway
    - Вам нужны имена метрик Prometheus и правила использования меток для панелей мониторинга или оповещений.
    - Вам нужны метрики без запуска коллектора OpenTelemetry
sidebarTitle: Prometheus
summary: Предоставляйте диагностические данные OpenClaw в виде текстовых метрик Prometheus через плагин diagnostics-prometheus
title: Метрики Prometheus
x-i18n:
    generated_at: "2026-07-13T19:49:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw может предоставлять диагностические метрики через официальный
плагин `diagnostics-prometheus`. Он принимает доверенные диагностические события, а также
внутренне помеченные диагностические события, которыми управляет диспетчер (сигналы очереди, памяти и
восстановления сеанса), и предоставляет текстовую конечную точку Prometheus по адресу:

```text
GET /api/diagnostics/prometheus
```

Тип содержимого — `text/plain; version=0.0.4; charset=utf-8`, стандартный
формат представления Prometheus.

<Warning>
Маршрут использует аутентификацию Gateway (область оператора, интерфейс доверенного оператора). Не публикуйте его как общедоступную конечную точку `/metrics` без аутентификации. Собирайте с него метрики через тот же путь аутентификации, который используется для других операторских API.
</Warning>

Сведения о трассировках, журналах, отправке OTLP и семантических атрибутах OpenTelemetry GenAI см. в разделе [Экспорт OpenTelemetry](/ru/gateway/opentelemetry).

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
    HTTP-маршрут регистрируется при запуске плагина, поэтому после включения выполните перезапуск.
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
По умолчанию `diagnostics.enabled` имеет значение `true`; устанавливайте значение `false` только в строго контролируемых средах. Если установлено значение `false`, плагин по-прежнему регистрирует HTTP-маршрут, но диагностические события не поступают в экспортёр, поэтому ответ будет пустым.
</Note>

## Экспортируемые метрики

| Метрика                                          | Тип       | Метки                                                                                     |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | счётчик   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | гистограмма | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | счётчик   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | гистограмма | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | счётчик   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | счётчик   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | гистограмма | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | счётчик   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | гистограмма | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | счётчик   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | счётчик   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | гистограмма | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | счётчик   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | счётчик   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | гистограмма | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | счётчик   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | счётчик   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | гистограмма | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | счётчик   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | счётчик   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | счётчик   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | гистограмма | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | счётчик   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | гистограмма | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | счётчик   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | счётчик   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | гистограмма | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | счётчик   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | гистограмма | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | гистограмма | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | датчик    | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | гистограмма | `lane`                                                                                    |
| `openclaw_session_state_total`                   | счётчик   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | датчик    | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | счётчик   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | счётчик   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | гистограмма | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | счётчик   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | гистограмма | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | счётчик   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | датчик    | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | гистограмма | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | гистограмма | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | гистограмма | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | гистограмма | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | счётчик   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | гистограмма | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | датчик    | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | гистограмма | нет                                                                                       |
| `openclaw_memory_pressure_total`                 | счётчик   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | счётчик   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | счётчик   | нет                                                                                       |
| `openclaw_diagnostic_async_queue_dropped_total`  | счётчик   | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | датчик    | нет                                                                                       |

## Политика меток

<AccordionGroup>
  <Accordion title="Ограниченные метки с низкой кардинальностью">
    Метки Prometheus остаются ограниченными и низкокардинальными. Экспортер не выводит необработанные диагностические идентификаторы, такие как `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, идентификаторы сообщений, чатов или запросов к провайдеру.

    Значения меток редактируются и должны соответствовать политике OpenClaw для низкокардинальных символов. Значения, не соответствующие политике, заменяются на `unknown`, `other` или `none` в зависимости от метрики. Метки, похожие на ключи сеансов агентов с областью действия, также заменяются на `unknown`.

  </Accordion>
  <Accordion title="Ограничение рядов и учет переполнения">
    Экспортер ограничивает количество временных рядов, хранящихся в памяти, до **2048** суммарно для счетчиков, индикаторов и гистограмм. Новые ряды сверх этого ограничения отбрасываются, а `openclaw_prometheus_series_dropped_total` каждый раз увеличивается на единицу.

    Отслеживайте этот счетчик как однозначный признак того, что вышестоящий атрибут пропускает значения с высокой кардинальностью. Экспортер никогда не снимает ограничение автоматически; если счетчик растет, исправьте источник, а не отключайте ограничение.

  </Accordion>
  <Accordion title="Что никогда не появляется в выводе Prometheus">
    - текст запросов, текст ответов, входные данные инструментов, выходные данные инструментов, системные запросы
    - расшифровки разговоров, аудиоданные, идентификаторы вызовов, идентификаторы комнат, токены передачи, идентификаторы ходов и необработанные идентификаторы сеансов
    - необработанные идентификаторы запросов к провайдеру (только ограниченные хеши, где применимо, в интервалах — никогда в метриках)
    - ключи и идентификаторы сеансов
    - имена хостов, пути к файлам, значения секретов

  </Accordion>
</AccordionGroup>

## Рецепты PromQL

```promql
# Токены в минуту с разбивкой по провайдерам
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Расходы (USD) за последний час с разбивкой по моделям
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95-й процентиль длительности выполнения модели
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO времени ожидания в очереди (95-й процентиль менее 2 с)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Использование навыков с разбивкой по ограниченным источникам
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Отброшенные ряды Prometheus (предупреждение о кардинальности)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Для панелей мониторинга, охватывающих несколько провайдеров, предпочитайте `gen_ai_client_token_usage`: эта метрика следует семантическим соглашениям OpenTelemetry GenAI и согласуется с метриками сервисов GenAI, не относящихся к OpenClaw.
</Tip>

## Выбор между экспортом Prometheus и OpenTelemetry

OpenClaw независимо поддерживает оба интерфейса. Можно использовать любой из них, оба или ни одного.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Модель **извлечения**: Prometheus опрашивает `/api/diagnostics/prometheus`.
    - Внешний сборщик не требуется.
    - Аутентификация выполняется через обычную аутентификацию Gateway.
    - Интерфейс включает только метрики (без трассировок и журналов).
    - Лучше всего подходит для стеков, уже стандартизированных на Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Модель **отправки**: OpenClaw отправляет данные по OTLP/HTTP сборщику или совместимому с OTLP серверу.
    - Интерфейс включает метрики, трассировки и журналы.
    - При необходимости использовать оба варианта обеспечивает интеграцию с Prometheus через OpenTelemetry Collector (экспортер `prometheus` или `prometheusremotewrite`).
    - Полный каталог см. в разделе [Экспорт OpenTelemetry](/ru/gateway/opentelemetry).

  </Tab>
</Tabs>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Пустое тело ответа">
    - Убедитесь, что в конфигурации параметр `diagnostics.enabled` не имеет значения `false` (по умолчанию используется `true`).
    - Подтвердите с помощью `openclaw plugins list --enabled`, что плагин включен и загружен.
    - Создайте некоторый трафик: счетчики и гистограммы начинают выводить строки только после хотя бы одного события.

  </Accordion>
  <Accordion title="401 / нет авторизации">
    Конечная точка требует область полномочий оператора Gateway (`auth: "gateway"` с `gatewayRuntimeScopeSurface: "trusted-operator"`). Используйте тот же токен или пароль, который Prometheus использует для любого другого маршрута оператора Gateway. Общедоступного режима без аутентификации нет.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` растет">
    Новый атрибут превышает ограничение в **2048** рядов. Проверьте последние метрики на наличие метки с неожиданно высокой кардинальностью и исправьте ее в источнике. Экспортер намеренно отбрасывает новые ряды вместо неявного перезаписывания меток.
  </Accordion>
  <Accordion title="После перезапуска Prometheus показывает устаревшие ряды">
    Плагин хранит состояние только в памяти. После перезапуска Gateway счетчики сбрасываются до нуля, а индикаторы возобновляют работу со следующего переданного значения. Используйте в PromQL `rate()` и `increase()`, чтобы корректно обрабатывать сбросы.
  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Экспорт диагностики](/ru/gateway/diagnostics) — локальный ZIP-архив диагностики для пакетов поддержки
- [Работоспособность и готовность](/ru/gateway/health) — пробы `/healthz` и `/readyz`
- [Ведение журналов](/ru/logging) — ведение журналов в файлах
- [Экспорт OpenTelemetry](/ru/gateway/opentelemetry) — отправка по OTLP трассировок, метрик и журналов
