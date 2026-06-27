---
read_when:
    - می‌خواهید Prometheus، Grafana، VictoriaMetrics یا جمع‌آورندهٔ دیگری معیارهای OpenClaw Gateway را جمع‌آوری کند.
    - برای داشبوردها یا هشدارها، به نام‌های معیار Prometheus و سیاست برچسب نیاز دارید
    - می‌خواهید بدون اجرای یک جمع‌آورنده OpenTelemetry، سنجه‌ها داشته باشید.
sidebarTitle: Prometheus
summary: عیب‌یابی OpenClaw را از طریق Plugin diagnostics-prometheus به‌صورت معیارهای متنی Prometheus در معرض دسترس قرار دهید
title: معیارهای Prometheus
x-i18n:
    generated_at: "2026-06-27T17:48:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw می‌تواند معیارهای عیب‌یابی را از طریق Plugin رسمی `diagnostics-prometheus` ارائه کند. این Plugin به عیب‌یابی‌های مورد اعتماد و رویدادهای پایداری Gateway که از هسته منتشر می‌شوند گوش می‌دهد، سپس یک نقطهٔ پایانی متنی Prometheus را در مسیر زیر رندر می‌کند:

  ```text
  GET /api/diagnostics/prometheus
  ```

  نوع محتوا `text/plain; version=0.0.4; charset=utf-8` است، یعنی قالب استاندارد انتشار Prometheus.

  <Warning>
  این مسیر از احراز هویت Gateway استفاده می‌کند (دامنهٔ اپراتور). آن را به‌عنوان یک نقطهٔ پایانی عمومی و بدون احراز هویت `/metrics` در دسترس قرار ندهید. آن را از همان مسیر احراز هویتی اسکرپ کنید که برای سایر APIهای اپراتور استفاده می‌کنید.
  </Warning>

  برای رهگیری‌ها، لاگ‌ها، ارسال OTLP، و ویژگی‌های معنایی OpenTelemetry GenAI، به [خروجی OpenTelemetry](/fa/gateway/opentelemetry) مراجعه کنید.

  ## شروع سریع

  <Steps>
  <Step title="Plugin را نصب کنید">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Plugin را فعال کنید">
    <Tabs>
      <Tab title="پیکربندی">
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
  <Step title="Gateway را راه‌اندازی مجدد کنید">
    مسیر HTTP هنگام شروع Plugin ثبت می‌شود، بنابراین پس از فعال‌سازی دوباره بارگذاری کنید.
  </Step>
  <Step title="مسیر محافظت‌شده را اسکرپ کنید">
    همان احراز هویت Gateway را ارسال کنید که کلاینت‌های اپراتور شما استفاده می‌کنند:

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
`diagnostics.enabled: true` الزامی است. بدون آن، Plugin همچنان مسیر HTTP را ثبت می‌کند، اما هیچ رویداد تشخیصی‌ای وارد صادرکننده نمی‌شود؛ بنابراین پاسخ خالی است.
</Note>

## معیارهای صادرشده

| معیار                                            | نوع       | برچسب‌ها                                                                                  |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | شمارنده   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | هیستوگرام | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | شمارنده   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | هیستوگرام | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | شمارنده   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | شمارنده   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | هیستوگرام | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | شمارنده   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | شمارنده   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | شمارنده   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | هیستوگرام | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | شمارنده   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | شمارنده   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | هیستوگرام | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | شمارنده   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | شمارنده   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | هیستوگرام | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | شمارنده   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | شمارنده   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | شمارنده   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | هیستوگرام | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | شمارنده   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | هیستوگرام | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | شمارنده   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | شمارنده   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | هیستوگرام | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | شمارنده   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | هیستوگرام | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | هیستوگرام | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | سنج       | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | هیستوگرام | `lane`                                                                                    |
| `openclaw_session_state_total`                   | شمارنده   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | سنج       | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | شمارنده   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | شمارنده   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | هیستوگرام | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | شمارنده   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | هیستوگرام | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | شمارنده   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | سنج       | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | هیستوگرام | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | هیستوگرام | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | هیستوگرام | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | هیستوگرام | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | شمارنده   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | هیستوگرام | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | سنج       | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | هیستوگرام | هیچ‌کدام                                                                                  |
| `openclaw_memory_pressure_total`                 | شمارنده   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | شمارنده   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | شمارنده   | هیچ‌کدام                                                                                  |

## سیاست برچسب‌ها

<AccordionGroup>
  <Accordion title="Bounded, low-cardinality labels">
    برچسب‌های Prometheus محدود و کم‌کاردینالیتی می‌مانند. صادرکننده شناسه‌های تشخیصی خام مانند `runId`، `sessionKey`، `sessionId`، `callId`، `toolCallId`، شناسه‌های پیام، شناسه‌های گفت‌وگو یا شناسه‌های درخواست ارائه‌دهنده را منتشر نمی‌کند.

    مقدارهای برچسب‌ها پنهان‌سازی می‌شوند و باید با سیاست کاراکتر کم‌کاردینالیتی OpenClaw مطابقت داشته باشند. مقدارهایی که با این سیاست منطبق نیستند، بسته به معیار، با `unknown`، `other` یا `none` جایگزین می‌شوند. برچسب‌هایی که شبیه کلیدهای نشست عاملِ دارای محدوده هستند نیز با `unknown` جایگزین می‌شوند.

  </Accordion>
  <Accordion title="Series cap and overflow accounting">
    صادرکننده، سری‌های زمانی نگه‌داری‌شده در حافظه را در مجموع برای شمارنده‌ها، سنج‌ها و هیستوگرام‌ها به **2048** سری محدود می‌کند. سری‌های جدید فراتر از این سقف حذف می‌شوند و `openclaw_prometheus_series_dropped_total` هر بار یک واحد افزایش می‌یابد.

    این شمارنده را به‌عنوان نشانه‌ای قطعی پایش کنید که یک ویژگی در بالادست در حال نشت مقدارهای پرکاردینالیتی است. صادرکننده هرگز سقف را به‌طور خودکار افزایش نمی‌دهد؛ اگر مقدار آن بالا رفت، به‌جای غیرفعال کردن سقف، منبع را اصلاح کنید.

  </Accordion>
  <Accordion title="آنچه هرگز در خروجی Prometheus ظاهر نمی‌شود">
    - متن پرامپت، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، پرامپت‌های سیستم
    - رونوشت‌های گفت‌وگو، payloadهای صوتی، شناسه‌های تماس، شناسه‌های اتاق، توکن‌های واگذاری، شناسه‌های نوبت، و شناسه‌های خام نشست
    - شناسه‌های خام درخواست ارائه‌دهنده (فقط هش‌های محدود، در صورت کاربرد، روی spanها — هرگز روی metrics)
    - کلیدهای نشست و شناسه‌های نشست
    - نام میزبان‌ها، مسیرهای فایل، مقدارهای محرمانه

  </Accordion>
</AccordionGroup>

## دستورهای آماده PromQL

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
برای داشبوردهای چندارائه‌دهنده‌ای، `gen_ai_client_token_usage` را ترجیح دهید: این مورد از قراردادهای معنایی OpenTelemetry GenAI پیروی می‌کند و با metrics سرویس‌های GenAI غیر OpenClaw سازگار است.
</Tip>

## انتخاب بین خروجی Prometheus و OpenTelemetry

OpenClaw هر دو سطح را به‌صورت مستقل پشتیبانی می‌کند. می‌توانید هرکدام، هر دو، یا هیچ‌کدام را اجرا کنید.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - مدل **Pull**: Prometheus مسیر `/api/diagnostics/prometheus` را scrape می‌کند.
    - به collector خارجی نیاز ندارد.
    - از طریق احراز هویت عادی Gateway احراز هویت می‌شود.
    - این سطح فقط metrics است (بدون traces یا logs).
    - بهترین گزینه برای stackهایی است که از پیش روی Prometheus + Grafana استاندارد شده‌اند.

  </Tab>
  <Tab title="diagnostics-otel">
    - مدل **Push**: OpenClaw داده‌های OTLP/HTTP را به یک collector یا backend سازگار با OTLP می‌فرستد.
    - این سطح شامل metrics، traces، و logs است.
    - وقتی به هر دو نیاز دارید، از طریق یک OpenTelemetry Collector (exporterهای `prometheus` یا `prometheusremotewrite`) به Prometheus متصل می‌شود.
    - برای کاتالوگ کامل، [خروجی OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.

  </Tab>
</Tabs>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="بدنه پاسخ خالی است">
    - در پیکربندی، `diagnostics.enabled: true` را بررسی کنید.
    - تأیید کنید Plugin فعال است و با `openclaw plugins list --enabled` بارگذاری شده است.
    - مقداری ترافیک ایجاد کنید؛ شمارنده‌ها و هیستوگرام‌ها فقط پس از دست‌کم یک رویداد خط تولید می‌کنند.

  </Accordion>
  <Accordion title="401 / غیرمجاز">
    endpoint به scope اپراتور Gateway نیاز دارد (`auth: "gateway"` با `gatewayRuntimeScopeSurface: "trusted-operator"`). از همان token یا passwordی استفاده کنید که Prometheus برای هر مسیر اپراتوری دیگر Gateway استفاده می‌کند. هیچ حالت عمومی بدون احراز هویت وجود ندارد.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` در حال افزایش است">
    یک attribute جدید از سقف **2048** سری عبور کرده است. metrics اخیر را برای labelی با cardinality غیرمنتظره بالا بررسی کنید و آن را در مبدا اصلاح کنید. exporter عمداً سری‌های جدید را drop می‌کند، نه اینکه labelها را بی‌صدا بازنویسی کند.
  </Accordion>
  <Accordion title="Prometheus پس از راه‌اندازی دوباره سری‌های stale نشان می‌دهد">
    Plugin وضعیت را فقط در حافظه نگه می‌دارد. پس از راه‌اندازی دوباره Gateway، شمارنده‌ها به صفر بازنشانی می‌شوند و gaugeها از مقدار گزارش‌شده بعدی خود دوباره شروع می‌شوند. برای مدیریت تمیز بازنشانی‌ها از PromQL `rate()` و `increase()` استفاده کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [خروجی Diagnostics](/fa/gateway/diagnostics) — فایل zip عیب‌یابی محلی برای بسته‌های پشتیبانی
- [سلامت و آمادگی](/fa/gateway/health) — probeهای `/healthz` و `/readyz`
- [Logging](/fa/logging) — logging مبتنی بر فایل
- [خروجی OpenTelemetry](/fa/gateway/opentelemetry) — push با OTLP برای traces، metrics، و logs
