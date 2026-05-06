---
read_when:
    - می‌خواهید Prometheus، Grafana، VictoriaMetrics یا اسکریپر دیگری متریک‌های OpenClaw Gateway را جمع‌آوری کند
    - به نام‌های معیار Prometheus و سیاست برچسب‌ها برای داشبوردها یا هشدارها نیاز دارید
    - می‌خواهید بدون اجرای یک گردآورندهٔ OpenTelemetry، معیارها را داشته باشید
sidebarTitle: Prometheus
summary: داده‌های عیب‌یابی OpenClaw را از طریق Plugin diagnostics-prometheus به‌صورت معیارهای متنی Prometheus ارائه کنید
title: متریک‌های Prometheus
x-i18n:
    generated_at: "2026-05-06T11:58:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 864e2a343266d84baaaaca9d8e494359198a3b43e8663ec8dcfcd4e2e4c6c004
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw می‌تواند معیارهای تشخیصی را از طریق Plugin رسمی `diagnostics-prometheus` ارائه کند. این Plugin به تشخیص‌های داخلی مورداعتماد گوش می‌دهد و یک نقطه پایانی متنی Prometheus را در مسیر زیر رندر می‌کند:

```text
GET /api/diagnostics/prometheus
```

نوع محتوا `text/plain; version=0.0.4; charset=utf-8` است، یعنی قالب استاندارد انتشار Prometheus.

<Warning>
این مسیر از احراز هویت Gateway استفاده می‌کند (دامنه operator). آن را به‌صورت نقطه پایانی عمومی و بدون احراز هویت `/metrics` در معرض دسترس قرار ندهید. آن را از همان مسیر احراز هویتی scrape کنید که برای APIهای دیگر operator استفاده می‌کنید.
</Warning>

برای traceها، لاگ‌ها، push با OTLP و ویژگی‌های معنایی OpenTelemetry GenAI، [خروجی OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.

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
    مسیر HTTP هنگام راه‌اندازی Plugin ثبت می‌شود، بنابراین پس از فعال‌سازی دوباره بارگذاری کنید.
  </Step>
  <Step title="مسیر محافظت‌شده را scrape کنید">
    همان احراز هویت gateway را ارسال کنید که کلاینت‌های operator شما استفاده می‌کنند:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus را متصل کنید">
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
`diagnostics.enabled: true` الزامی است. بدون آن، Plugin همچنان مسیر HTTP را ثبت می‌کند، اما هیچ رویداد تشخیصی وارد صادرکننده نمی‌شود، بنابراین پاسخ خالی است.
</Note>

## معیارهای صادرشده

| معیار                                        | نوع      | برچسب‌ها                                                                                    |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | شمارنده   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | هیستوگرام | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | شمارنده   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | هیستوگرام | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | شمارنده   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | هیستوگرام | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | شمارنده   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | شمارنده   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | هیستوگرام | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | شمارنده   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | هیستوگرام | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | شمارنده   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | هیستوگرام | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`     | شمارنده   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`             | شمارنده   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | هیستوگرام | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                   | شمارنده   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`        | هیستوگرام | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                   | هیستوگرام | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                    | گیج     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | هیستوگرام | `lane`                                                                                    |
| `openclaw_session_state_total`                | شمارنده   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | گیج     | `state`                                                                                   |
| `openclaw_session_recovery_total`             | شمارنده   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`       | هیستوگرام | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_memory_bytes`                       | گیج     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | هیستوگرام | ندارد                                                                                      |
| `openclaw_memory_pressure_total`              | شمارنده   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | شمارنده   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | شمارنده   | ندارد                                                                                      |

## سیاست برچسب

<AccordionGroup>
  <Accordion title="برچسب‌های محدود و با کاردینالیتی پایین">
    برچسب‌های Prometheus محدود و با کاردینالیتی پایین باقی می‌مانند. صادرکننده شناسه‌های تشخیصی خام مانند `runId`، `sessionKey`، `sessionId`، `callId`، `toolCallId`، شناسه‌های پیام، شناسه‌های چت یا شناسه‌های درخواست provider را منتشر نمی‌کند.

    مقادیر برچسب ویرایش می‌شوند و باید با سیاست کاراکترهای کم‌کاردینالیتی OpenClaw مطابقت داشته باشند. مقادیری که این سیاست را پاس نمی‌کنند، بسته به معیار با `unknown`، `other` یا `none` جایگزین می‌شوند.

  </Accordion>
  <Accordion title="سقف سری‌ها و حسابداری سرریز">
    صادرکننده، سری‌های زمانی نگه‌داری‌شده در حافظه را روی مجموعاً **2048** سری در شمارنده‌ها، گیج‌ها و هیستوگرام‌ها محدود می‌کند. سری‌های جدید فراتر از این سقف حذف می‌شوند و `openclaw_prometheus_series_dropped_total` هر بار یک واحد افزایش می‌یابد.

    این شمارنده را به‌عنوان نشانه‌ای قطعی پایش کنید که یک ویژگی در بالادست، مقادیر با کاردینالیتی بالا نشت می‌دهد. صادرکننده هرگز سقف را به‌صورت خودکار بالا نمی‌برد؛ اگر مقدار آن افزایش یافت، به‌جای غیرفعال‌کردن سقف، منبع را اصلاح کنید.

  </Accordion>
  <Accordion title="چیزهایی که هرگز در خروجی Prometheus ظاهر نمی‌شوند">
    - متن پرامپت، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، پرامپت‌های سیستم
    - رونوشت‌های Talk، payloadهای صوتی، شناسه‌های تماس، شناسه‌های اتاق، توکن‌های handoff، شناسه‌های turn و شناسه‌های خام نشست
    - شناسه‌های خام درخواست ارائه‌دهنده (فقط هش‌های محدود، در صورت کاربرد، روی spanها — هرگز روی معیارها)
    - کلیدهای نشست و شناسه‌های نشست
    - نام میزبان‌ها، مسیرهای فایل، مقادیر محرمانه

  </Accordion>
</AccordionGroup>

## دستورالعمل‌های PromQL

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
برای داشبوردهای میان‌ارائه‌دهنده، `gen_ai_client_token_usage` را ترجیح دهید: این معیار از قراردادهای معنایی OpenTelemetry GenAI پیروی می‌کند و با معیارهای سرویس‌های GenAI غیر OpenClaw سازگار است.
</Tip>

## انتخاب بین خروجی Prometheus و OpenTelemetry

OpenClaw هر دو سطح را به‌صورت مستقل پشتیبانی می‌کند. می‌توانید یکی از آن‌ها، هر دو یا هیچ‌کدام را اجرا کنید.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - مدل **Pull**: Prometheus مسیر `/api/diagnostics/prometheus` را scrape می‌کند.
    - به گردآورنده خارجی نیاز ندارد.
    - از طریق احراز هویت عادی Gateway احراز هویت می‌شود.
    - سطح فقط شامل معیارهاست (بدون ردگیری‌ها یا گزارش‌ها).
    - بهترین گزینه برای پشته‌هایی که از قبل روی Prometheus + Grafana استاندارد شده‌اند.

  </Tab>
  <Tab title="diagnostics-otel">
    - مدل **Push**: OpenClaw داده‌های OTLP/HTTP را به یک گردآورنده یا backend سازگار با OTLP ارسال می‌کند.
    - سطح شامل معیارها، ردگیری‌ها و گزارش‌هاست.
    - وقتی به هر دو نیاز دارید، از طریق یک OpenTelemetry Collector (صادرکننده `prometheus` یا `prometheusremotewrite`) به Prometheus متصل می‌شود.
    - برای فهرست کامل، [خروجی OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.

  </Tab>
</Tabs>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="بدنه پاسخ خالی">
    - در پیکربندی، `diagnostics.enabled: true` را بررسی کنید.
    - تأیید کنید Plugin فعال است و با `openclaw plugins list --enabled` بارگذاری شده است.
    - مقداری ترافیک ایجاد کنید؛ شمارنده‌ها و هیستوگرام‌ها فقط پس از حداقل یک رویداد، خط خروجی منتشر می‌کنند.

  </Accordion>
  <Accordion title="401 / غیرمجاز">
    endpoint به دامنه عملگر Gateway نیاز دارد (`auth: "gateway"` همراه با `gatewayRuntimeScopeSurface: "trusted-operator"`). از همان توکن یا گذرواژه‌ای استفاده کنید که Prometheus برای هر مسیر عملگر دیگر Gateway استفاده می‌کند. حالت عمومی بدون احراز هویت وجود ندارد.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` در حال افزایش است">
    یک ویژگی جدید از سقف **2048** سری فراتر رفته است. معیارهای اخیر را برای برچسبی با کاردینالیتی غیرمنتظره بالا بررسی کنید و آن را در منبع اصلاح کنید. صادرکننده عمداً سری‌های جدید را حذف می‌کند، به‌جای اینکه برچسب‌ها را بی‌سروصدا بازنویسی کند.
  </Accordion>
  <Accordion title="Prometheus پس از راه‌اندازی مجدد، سری‌های کهنه نشان می‌دهد">
    Plugin وضعیت را فقط در حافظه نگه می‌دارد. پس از راه‌اندازی مجدد Gateway، شمارنده‌ها به صفر بازنشانی می‌شوند و گیج‌ها از مقدار گزارش‌شده بعدی خود دوباره شروع می‌کنند. برای مدیریت تمیز بازنشانی‌ها از PromQL `rate()` و `increase()` استفاده کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [برون‌بری عیب‌یابی](/fa/gateway/diagnostics) — فایل zip عیب‌یابی محلی برای بسته‌های پشتیبانی
- [سلامت و آمادگی](/fa/gateway/health) — کاوشگرهای `/healthz` و `/readyz`
- [ثبت گزارش](/fa/logging) — ثبت گزارش مبتنی بر فایل
- [برون‌بری OpenTelemetry](/fa/gateway/opentelemetry) — ارسال OTLP برای ردیابی‌ها، سنجه‌ها و گزارش‌ها
