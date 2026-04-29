---
read_when:
    - می‌خواهید Prometheus، Grafana، VictoriaMetrics یا یک گردآورندهٔ دیگر معیارهای OpenClaw Gateway را جمع‌آوری کند
    - برای داشبوردها یا هشدارها، به نام‌های معیار Prometheus و سیاست برچسب نیاز دارید
    - می‌خواهید بدون اجرای یک جمع‌آورندهٔ OpenTelemetry معیارها را داشته باشید
sidebarTitle: Prometheus
summary: تشخیص‌های OpenClaw را از طریق Plugin diagnostics-prometheus به‌صورت سنجه‌های متنی Prometheus ارائه کنید
title: سنجه‌های Prometheus
x-i18n:
    generated_at: "2026-04-29T22:54:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw می‌تواند معیارهای عیب‌یابی را از طریق Plugin همراه `diagnostics-prometheus` ارائه کند. این Plugin به عیب‌یابی‌های داخلیِ مورد اعتماد گوش می‌دهد و یک نقطهٔ پایانی متنی Prometheus را در این مسیر رندر می‌کند:

```text
GET /api/diagnostics/prometheus
```

نوع محتوا `text/plain; version=0.0.4; charset=utf-8` است؛ قالب استاندارد ارائهٔ Prometheus.

<Warning>
این مسیر از احراز هویت Gateway استفاده می‌کند (محدودهٔ اپراتور). آن را به‌عنوان نقطهٔ پایانی عمومی و بدون احراز هویت `/metrics` در معرض دسترس قرار ندهید. آن را از همان مسیر احراز هویتی بخوانید که برای APIهای دیگر اپراتور استفاده می‌کنید.
</Warning>

برای رهگیری‌ها، لاگ‌ها، ارسال OTLP، و ویژگی‌های معنایی OpenTelemetry GenAI، [خروجی OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.

## شروع سریع

<Steps>
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
  <Step title="راه‌اندازی دوبارهٔ Gateway">
    مسیر HTTP هنگام شروع به کار Plugin ثبت می‌شود، پس پس از فعال‌سازی آن را دوباره بارگذاری کنید.
  </Step>
  <Step title="خواندن مسیر محافظت‌شده">
    همان احراز هویت Gateway را که کلاینت‌های اپراتور شما استفاده می‌کنند ارسال کنید:

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
`diagnostics.enabled: true` الزامی است. بدون آن، Plugin همچنان مسیر HTTP را ثبت می‌کند، اما هیچ رویداد عیب‌یابی وارد صادرکننده نمی‌شود، بنابراین پاسخ خالی است.
</Note>

## معیارهای صادرشده

| معیار                                          | نوع       | برچسب‌ها                                                                                  |
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
| `openclaw_queue_lane_size`                    | سنج       | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | هیستوگرام | `lane`                                                                                    |
| `openclaw_session_state_total`                | شمارنده   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | سنج       | `state`                                                                                   |
| `openclaw_memory_bytes`                       | سنج       | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | هیستوگرام | هیچ‌کدام                                                                                  |
| `openclaw_memory_pressure_total`              | شمارنده   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | شمارنده   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | شمارنده   | هیچ‌کدام                                                                                  |

## سیاست برچسب‌ها

<AccordionGroup>
  <Accordion title="برچسب‌های محدود و با کاردینالیتی پایین">
    برچسب‌های Prometheus محدود و با کاردینالیتی پایین می‌مانند. صادرکننده شناسه‌های خام عیب‌یابی مانند `runId`، `sessionKey`، `sessionId`، `callId`، `toolCallId`، شناسه‌های پیام، شناسه‌های چت، یا شناسه‌های درخواست ارائه‌دهنده را منتشر نمی‌کند.

    مقادیر برچسب‌ها ویرایش امنیتی می‌شوند و باید با سیاست کاراکترهای کم‌کاردینالیتی OpenClaw مطابقت داشته باشند. مقدارهایی که با این سیاست مطابقت نداشته باشند، بسته به معیار، با `unknown`، `other`، یا `none` جایگزین می‌شوند.

  </Accordion>
  <Accordion title="سقف سری‌ها و حسابداری سرریز">
    صادرکننده تعداد سری‌های زمانی نگه‌داری‌شده در حافظه را در مجموعِ شمارنده‌ها، سنج‌ها، و هیستوگرام‌ها به **2048** سری محدود می‌کند. سری‌های جدید فراتر از این سقف حذف می‌شوند و `openclaw_prometheus_series_dropped_total` هر بار یک واحد افزایش می‌یابد.

    این شمارنده را به‌عنوان نشانه‌ای قطعی زیر نظر داشته باشید که یک ویژگی بالادستی در حال نشت مقادیر با کاردینالیتی بالاست. صادرکننده هرگز سقف را خودکار برنمی‌دارد؛ اگر مقدار آن بالا رفت، به‌جای غیرفعال کردن سقف، منبع را اصلاح کنید.

  </Accordion>
  <Accordion title="چه چیزهایی هرگز در خروجی Prometheus ظاهر نمی‌شوند">
    - متن پرامپت، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، پرامپت‌های سیستم
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
برای داشبوردهای چندارائه‌دهنده‌ای، `gen_ai_client_token_usage` را ترجیح دهید: این معیار از قراردادهای معنایی OpenTelemetry GenAI پیروی می‌کند و با معیارهای سرویس‌های GenAI غیر OpenClaw سازگار است.
</Tip>

## انتخاب بین خروجی Prometheus و OpenTelemetry

OpenClaw از هر دو سطح به‌صورت مستقل پشتیبانی می‌کند. می‌توانید یکی، هر دو، یا هیچ‌کدام را اجرا کنید.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - مدل **کِششی**: Prometheus مسیر `/api/diagnostics/prometheus` را می‌خواند.
    - به هیچ گردآورندهٔ خارجی نیاز ندارد.
    - از طریق احراز هویت معمول Gateway احراز هویت می‌شود.
    - سطح فقط شامل معیارهاست (بدون رهگیری یا لاگ).
    - بهترین گزینه برای پشته‌هایی که از قبل بر Prometheus + Grafana استاندارد شده‌اند.

  </Tab>
  <Tab title="diagnostics-otel">
    - مدل **ارسالی**: OpenClaw داده‌های OTLP/HTTP را به یک گردآورنده یا backend سازگار با OTLP می‌فرستد.
    - سطح شامل معیارها، رهگیری‌ها، و لاگ‌هاست.
    - وقتی به هر دو نیاز دارید، از طریق یک OpenTelemetry Collector (صادرکنندهٔ `prometheus` یا `prometheusremotewrite`) به Prometheus متصل می‌شود.
    - برای فهرست کامل، [خروجی OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.

  </Tab>
</Tabs>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="بدنهٔ پاسخ خالی است">
    - `diagnostics.enabled: true` را در پیکربندی بررسی کنید.
    - تأیید کنید Plugin با `openclaw plugins list --enabled` فعال و بارگذاری شده است.
    - کمی ترافیک تولید کنید؛ شمارنده‌ها و هیستوگرام‌ها فقط پس از حداقل یک رویداد، خط خروجی منتشر می‌کنند.

  </Accordion>
  <Accordion title="401 / غیرمجاز">
    نقطهٔ پایانی به محدودهٔ اپراتور Gateway نیاز دارد (`auth: "gateway"` همراه با `gatewayRuntimeScopeSurface: "trusted-operator"`). از همان توکن یا گذرواژه‌ای استفاده کنید که Prometheus برای هر مسیر اپراتور دیگر Gateway استفاده می‌کند. هیچ حالت عمومیِ بدون احراز هویت وجود ندارد.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` در حال افزایش است">
    یک ویژگی جدید از سقف **2048** سری فراتر رفته است. معیارهای اخیر را برای یافتن یک برچسب با کاردینالیتی غیرمنتظره بالا بررسی کنید و آن را در منبع اصلاح کنید. صادرکننده عمداً سری‌های جدید را حذف می‌کند، به‌جای آنکه برچسب‌ها را بی‌سروصدا بازنویسی کند.
  </Accordion>
  <Accordion title="Prometheus پس از راه‌اندازی دوباره سری‌های کهنه نشان می‌دهد">
    Plugin فقط در حافظه وضعیت نگه می‌دارد. پس از راه‌اندازی دوبارهٔ Gateway، شمارنده‌ها به صفر بازنشانی می‌شوند و سنج‌ها از مقدار گزارش‌شدهٔ بعدی خود دوباره شروع می‌کنند. برای مدیریت تمیز بازنشانی‌ها از `rate()` و `increase()` در PromQL استفاده کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [خروجی عیب‌یابی](/fa/gateway/diagnostics) — فایل zip عیب‌یابی محلی برای بسته‌های پشتیبانی
- [سلامت و آمادگی](/fa/gateway/health) — probeهای `/healthz` و `/readyz`
- [لاگ‌گیری](/fa/logging) — لاگ‌گیری مبتنی بر فایل
- [خروجی OpenTelemetry](/fa/gateway/opentelemetry) — ارسال OTLP برای رهگیری‌ها، معیارها، و لاگ‌ها
