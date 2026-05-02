---
read_when:
    - می‌خواهید Prometheus، Grafana، VictoriaMetrics یا اسکریپر دیگری متریک‌های OpenClaw Gateway را جمع‌آوری کند
    - برای داشبوردها یا هشدارها، به نام متریک‌های Prometheus و سیاست برچسب‌ها نیاز دارید
    - می‌خواهید بدون اجرای گردآورندهٔ OpenTelemetry سنجه‌ها را داشته باشید
sidebarTitle: Prometheus
summary: داده‌های عیب‌یابی OpenClaw را از طریق Plugin ‏diagnostics-prometheus به‌صورت معیارهای متنی Prometheus در دسترس قرار دهید
title: متریک‌های Prometheus
x-i18n:
    generated_at: "2026-05-02T20:45:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw می‌تواند معیارهای تشخیصی را از طریق Plugin رسمی `diagnostics-prometheus` ارائه کند. این Plugin به تشخیص‌های داخلی قابل‌اعتماد گوش می‌دهد و یک نقطه پایانی متنی Prometheus را در مسیر زیر ارائه می‌کند:

```text
GET /api/diagnostics/prometheus
```

نوع محتوا `text/plain; version=0.0.4; charset=utf-8` است؛ همان قالب استاندارد انتشار Prometheus.

<Warning>
این مسیر از احراز هویت Gateway استفاده می‌کند (محدوده اپراتور). آن را به‌عنوان نقطه پایانی عمومی و بدون احراز هویت `/metrics` در دسترس قرار ندهید. آن را از همان مسیر احراز هویتی واکشی کنید که برای سایر APIهای اپراتور استفاده می‌کنید.
</Warning>

برای ردگیری‌ها، گزارش‌ها، ارسال OTLP، و ویژگی‌های معنایی OpenTelemetry GenAI، [خروجی OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.

## شروع سریع

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="فعال‌سازی Plugin">
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
  <Step title="راه‌اندازی دوباره Gateway">
    مسیر HTTP هنگام شروع Plugin ثبت می‌شود، بنابراین پس از فعال‌سازی دوباره بارگذاری کنید.
  </Step>
  <Step title="واکشی مسیر محافظت‌شده">
    همان احراز هویت gateway را بفرستید که کلاینت‌های اپراتور شما استفاده می‌کنند:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="اتصال Prometheus">
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
`diagnostics.enabled: true` لازم است. بدون آن، Plugin همچنان مسیر HTTP را ثبت می‌کند اما هیچ رویداد تشخیصی وارد صادرکننده نمی‌شود، بنابراین پاسخ خالی است.
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
| `openclaw_message_delivery_total`             | شمارنده   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | هیستوگرام | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | سنجه     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | هیستوگرام | `lane`                                                                                    |
| `openclaw_session_state_total`                | شمارنده   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | سنجه     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | سنجه     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | هیستوگرام | هیچ‌کدام                                                                                      |
| `openclaw_memory_pressure_total`              | شمارنده   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | شمارنده   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | شمارنده   | هیچ‌کدام                                                                                      |

## سیاست برچسب

<AccordionGroup>
  <Accordion title="برچسب‌های محدود و با کاردینالیتی پایین">
    برچسب‌های Prometheus محدود و با کاردینالیتی پایین باقی می‌مانند. صادرکننده شناسه‌های تشخیصی خام مانند `runId`، `sessionKey`، `sessionId`، `callId`، `toolCallId`، شناسه‌های پیام، شناسه‌های گفت‌وگو، یا شناسه‌های درخواست ارائه‌دهنده را منتشر نمی‌کند.

    مقادیر برچسب‌ها ویرایش محرمانگی می‌شوند و باید با سیاست کاراکترهای کم‌کاردینالیتی OpenClaw مطابقت داشته باشند. مقدارهایی که با این سیاست مطابقت ندارند، بسته به معیار با `unknown`، `other`، یا `none` جایگزین می‌شوند.

  </Accordion>
  <Accordion title="سقف سری‌ها و حسابداری سرریز">
    صادرکننده سقف سری‌های زمانی نگه‌داری‌شده در حافظه را در مجموع برای شمارنده‌ها، سنجه‌ها و هیستوگرام‌ها روی **2048** سری محدود می‌کند. سری‌های جدید فراتر از این سقف حذف می‌شوند، و `openclaw_prometheus_series_dropped_total` هر بار یکی افزایش می‌یابد.

    این شمارنده را به‌عنوان سیگنالی قطعی زیر نظر بگیرید که یک ویژگی بالادست در حال نشت مقدارهای با کاردینالیتی بالا است. صادرکننده هرگز سقف را به‌صورت خودکار افزایش نمی‌دهد؛ اگر بالا رفت، به‌جای غیرفعال کردن سقف، منبع را اصلاح کنید.

  </Accordion>
  <Accordion title="چیزهایی که هرگز در خروجی Prometheus ظاهر نمی‌شوند">
    - متن پرامپت، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، پرامپت‌های سیستمی
    - شناسه‌های خام درخواست ارائه‌دهنده (فقط هش‌های محدود، در صورت کاربرد، روی spanها — هرگز روی معیارها)
    - کلیدهای نشست و شناسه‌های نشست
    - نام میزبان‌ها، مسیرهای فایل، مقدارهای محرمانه

  </Accordion>
</AccordionGroup>

## دستورهای PromQL

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
برای داشبوردهای چندارائه‌دهنده، `gen_ai_client_token_usage` را ترجیح دهید: این مورد از قراردادهای معنایی OpenTelemetry GenAI پیروی می‌کند و با معیارهای سرویس‌های GenAI غیر OpenClaw سازگار است.
</Tip>

## انتخاب میان Prometheus و خروجی OpenTelemetry

OpenClaw از هر دو سطح به‌صورت مستقل پشتیبانی می‌کند. می‌توانید یکی، هر دو، یا هیچ‌کدام را اجرا کنید.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - مدل **Pull**: Prometheus مسیر `/api/diagnostics/prometheus` را واکشی می‌کند.
    - به جمع‌آورنده خارجی نیاز ندارد.
    - از طریق احراز هویت عادی Gateway احراز هویت می‌شود.
    - این سطح فقط معیارها را شامل می‌شود (بدون ردگیری یا گزارش).
    - مناسب‌ترین گزینه برای پشته‌هایی که پیشاپیش روی Prometheus + Grafana استاندارد شده‌اند.

  </Tab>
  <Tab title="diagnostics-otel">
    - مدل **Push**: OpenClaw داده‌های OTLP/HTTP را به یک جمع‌آورنده یا backend سازگار با OTLP می‌فرستد.
    - این سطح شامل معیارها، ردگیری‌ها و گزارش‌ها است.
    - وقتی به هر دو نیاز دارید، از طریق یک OpenTelemetry Collector (صادرکننده `prometheus` یا `prometheusremotewrite`) به Prometheus پل می‌زند.
    - برای فهرست کامل، [خروجی OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.

  </Tab>
</Tabs>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="بدنه پاسخ خالی است">
    - در پیکربندی، `diagnostics.enabled: true` را بررسی کنید.
    - تأیید کنید Plugin با `openclaw plugins list --enabled` فعال و بارگذاری شده است.
    - مقداری ترافیک ایجاد کنید؛ شمارنده‌ها و هیستوگرام‌ها فقط پس از دست‌کم یک رویداد خط تولید می‌کنند.

  </Accordion>
  <Accordion title="401 / غیرمجاز">
    این نقطه پایانی به محدوده اپراتور Gateway نیاز دارد (`auth: "gateway"` با `gatewayRuntimeScopeSurface: "trusted-operator"`). از همان توکن یا گذرواژه‌ای استفاده کنید که Prometheus برای هر مسیر اپراتور Gateway دیگر استفاده می‌کند. هیچ حالت عمومی بدون احراز هویت وجود ندارد.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` در حال افزایش است">
    یک ویژگی جدید از سقف **2048** سری فراتر رفته است. معیارهای اخیر را برای برچسبی با کاردینالیتی غیرمنتظره بالا بررسی کنید و آن را در منبع اصلاح کنید. صادرکننده عمدا به‌جای بازنویسی بی‌صدای برچسب‌ها، سری‌های جدید را حذف می‌کند.
  </Accordion>
  <Accordion title="Prometheus پس از راه‌اندازی دوباره سری‌های قدیمی نشان می‌دهد">
    Plugin فقط در حافظه وضعیت نگه می‌دارد. پس از راه‌اندازی دوباره Gateway، شمارنده‌ها به صفر بازنشانی می‌شوند و سنجه‌ها از مقدار گزارش‌شده بعدی خود دوباره شروع می‌شوند. برای مدیریت تمیز بازنشانی‌ها از PromQL `rate()` و `increase()` استفاده کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [خروجی تشخیص‌ها](/fa/gateway/diagnostics) — فایل zip تشخیص‌های محلی برای بسته‌های پشتیبانی
- [سلامت و آمادگی](/fa/gateway/health) — probeهای `/healthz` و `/readyz`
- [گزارش‌گیری](/fa/logging) — گزارش‌گیری مبتنی بر فایل
- [خروجی OpenTelemetry](/fa/gateway/opentelemetry) — ارسال OTLP برای ردگیری‌ها، معیارها و گزارش‌ها
