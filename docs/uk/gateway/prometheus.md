---
read_when:
    - Ви хочете, щоб Prometheus, Grafana, VictoriaMetrics або інший скрейпер збирав метрики Gateway OpenClaw
    - Вам потрібні назви метрик Prometheus і політика міток для панелей моніторингу або сповіщень
    - Ви хочете отримувати метрики без запуску збирача OpenTelemetry
sidebarTitle: Prometheus
summary: Виставляйте діагностику OpenClaw як текстові метрики Prometheus через Plugin diagnostics-prometheus
title: метрики Prometheus
x-i18n:
    generated_at: "2026-04-26T09:31:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw може виставляти метрики діагностики через вбудований Plugin `diagnostics-prometheus`. Він слухає довірену внутрішню діагностику та віддає текстову кінцеву точку Prometheus за адресою:

```text
GET /api/diagnostics/prometheus
```

Тип вмісту — `text/plain; version=0.0.4; charset=utf-8`, стандартний формат експозиції Prometheus.

<Warning>
Маршрут використовує автентифікацію Gateway (область operator). Не виставляйте його як публічну неавтентифіковану кінцеву точку `/metrics`. Налаштовуйте скрейпінг через той самий шлях автентифікації, який ви використовуєте для інших API operator.
</Warning>

Для трасувань, логів, OTLP push та семантичних атрибутів OpenTelemetry GenAI див. [експорт OpenTelemetry](/uk/gateway/opentelemetry).

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
    HTTP-маршрут реєструється під час запуску Plugin, тому після ввімкнення виконайте перезавантаження.
  </Step>
  <Step title="Налаштуйте скрейпінг захищеного маршруту">
    Передайте ту саму автентифікацію gateway, яку використовують ваші клієнти operator:

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
Потрібно `diagnostics.enabled: true`. Без цього Plugin усе одно реєструє HTTP-маршрут, але жодні події діагностики не потрапляють до експортера, тому відповідь буде порожньою.
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
| `openclaw_memory_rss_bytes`                   | histogram | none                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | none                                                                                      |

## Політика міток

<AccordionGroup>
  <Accordion title="Обмежені мітки з низькою кардинальністю">
    Мітки Prometheus залишаються обмеженими та з низькою кардинальністю. Експортер не виводить сирі ідентифікатори діагностики, як-от `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ідентифікатори повідомлень, ідентифікатори чатів або ідентифікатори запитів провайдера.

    Значення міток редагуються та мають відповідати політиці символів OpenClaw для низької кардинальності. Значення, які не проходять перевірку політики, замінюються на `unknown`, `other` або `none` залежно від метрики.

  </Accordion>
  <Accordion title="Обмеження кількості серій і облік переповнення">
    Експортер обмежує кількість часових серій, що зберігаються в пам’яті, до **2048** серій загалом для counter, gauge і histogram. Нові серії понад це обмеження відкидаються, а `openclaw_prometheus_series_dropped_total` збільшується на одиницю щоразу.

    Відстежуйте цей counter як жорсткий сигнал того, що якийсь атрибут вище за потоком пропускає значення з високою кардинальністю. Експортер ніколи не знімає це обмеження автоматично; якщо значення зростає, виправте джерело замість вимкнення обмеження.

  </Accordion>
  <Accordion title="Що ніколи не з’являється у виводі Prometheus">
    - текст промптів, текст відповідей, вхідні дані інструментів, вихідні дані інструментів, системні промпти
    - сирі ідентифікатори запитів провайдера (лише обмежені хеші, де це застосовно, у spans — ніколи в метриках)
    - ключі сесій та ідентифікатори сесій
    - імена хостів, шляхи до файлів, секретні значення

  </Accordion>
</AccordionGroup>

## Рецепти PromQL

```promql
# Токени за хвилину, з розбиттям за provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Витрати (USD) за останню годину, за model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95-й перцентиль тривалості виконання model
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO часу очікування в черзі (95p менше 2 с)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Відкинуті серії Prometheus (тривога кардинальності)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Для кроспровайдерних панелей моніторингу віддавайте перевагу `gen_ai_client_token_usage`: ця метрика дотримується семантичних угод OpenTelemetry GenAI і узгоджується з метриками сервісів GenAI поза OpenClaw.
</Tip>

## Вибір між Prometheus і експортом OpenTelemetry

OpenClaw підтримує обидві поверхні незалежно. Ви можете використовувати одну з них, обидві або жодну.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Модель **Pull**: Prometheus виконує скрейпінг `/api/diagnostics/prometheus`.
    - Зовнішній збирач не потрібен.
    - Автентифікація через стандартну автентифікацію Gateway.
    - Поверхня охоплює лише метрики (без трасувань або логів).
    - Найкраще підходить для стеків, уже стандартизованих на Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Модель **Push**: OpenClaw надсилає OTLP/HTTP до збирача або бекенда, сумісного з OTLP.
    - Поверхня включає метрики, трасування та логи.
    - Працює через міст до Prometheus за допомогою OpenTelemetry Collector (експортер `prometheus` або `prometheusremotewrite`), коли вам потрібні обидві можливості.
    - Повний каталог див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).

  </Tab>
</Tabs>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Порожнє тіло відповіді">
    - Перевірте `diagnostics.enabled: true` у конфігурації.
    - Підтвердьте, що Plugin увімкнено й завантажено, за допомогою `openclaw plugins list --enabled`.
    - Згенеруйте певний трафік; counter і histogram починають виводити рядки лише після принаймні однієї події.

  </Accordion>
  <Accordion title="401 / unauthorized">
    Кінцева точка вимагає область operator Gateway (`auth: "gateway"` з `gatewayRuntimeScopeSurface: "trusted-operator"`). Використовуйте той самий токен або пароль, який Prometheus використовує для будь-якого іншого маршруту operator Gateway. Публічного неавтентифікованого режиму немає.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` зростає">
    Новий атрибут перевищує ліміт у **2048** серій. Перевірте нещодавні метрики на наявність мітки з неочікувано високою кардинальністю та виправте це в джерелі. Експортер навмисно відкидає нові серії замість тихого переписування міток.
  </Accordion>
  <Accordion title="Prometheus показує застарілі серії після перезапуску">
    Plugin зберігає стан лише в пам’яті. Після перезапуску Gateway counter скидаються до нуля, а gauge починаються з наступного повідомленого значення. Використовуйте в PromQL `rate()` і `increase()`, щоб коректно обробляти скидання.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Експорт діагностики](/uk/gateway/diagnostics) — локальний zip-файл діагностики для пакетів підтримки
- [Стан здоров’я та готовність](/uk/gateway/health) — перевірки `/healthz` і `/readyz`
- [Логування](/uk/logging) — логування у файли
- [Експорт OpenTelemetry](/uk/gateway/opentelemetry) — OTLP push для трасувань, метрик і логів
