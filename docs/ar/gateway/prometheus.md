---
read_when:
    - تريد أن يجمع Prometheus أو Grafana أو VictoriaMetrics أو أداة كشط أخرى مقاييس OpenClaw Gateway
    - تحتاج إلى أسماء مقاييس Prometheus وسياسة التسميات للوحات المعلومات أو التنبيهات
    - تريد المقاييس من دون تشغيل جامع OpenTelemetry
sidebarTitle: Prometheus
summary: إتاحة تشخيصات OpenClaw كمقاييس نصية لـ Prometheus عبر Plugin diagnostics-prometheus
title: مقاييس Prometheus
x-i18n:
    generated_at: "2026-05-02T20:46:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

يمكن لـ OpenClaw عرض مقاييس التشخيص عبر Plugin الرسمي `diagnostics-prometheus`. يستمع إلى التشخيصات الداخلية الموثوقة ويعرض نقطة نهاية نصية بتنسيق Prometheus عند:

```text
GET /api/diagnostics/prometheus
```

نوع المحتوى هو `text/plain; version=0.0.4; charset=utf-8`، وهو تنسيق العرض القياسي في Prometheus.

<Warning>
يستخدم المسار مصادقة Gateway (نطاق المشغّل). لا تعرضه كنقطة نهاية عامة غير مصادقة `/metrics`. اجعل الكشط يمر عبر مسار المصادقة نفسه الذي تستخدمه لواجهات API الأخرى الخاصة بالمشغّل.
</Warning>

للتتبعات والسجلات ودفع OTLP وسمات OpenTelemetry GenAI الدلالية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).

## البدء السريع

<Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="فعّل Plugin">
    <Tabs>
      <Tab title="الإعداد">
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
  <Step title="أعد تشغيل Gateway">
    يتم تسجيل مسار HTTP عند بدء Plugin، لذا أعد التحميل بعد التفعيل.
  </Step>
  <Step title="اكشط المسار المحمي">
    أرسل مصادقة Gateway نفسها التي يستخدمها عملاء المشغّل لديك:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="اربط Prometheus">
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
`diagnostics.enabled: true` مطلوب. من دونه، يظل Plugin يسجل مسار HTTP، لكن لا تتدفق أي أحداث تشخيصية إلى المصدّر، لذلك تكون الاستجابة فارغة.
</Note>

## المقاييس المصدّرة

| المقياس                                       | النوع     | التسميات                                                                                  |
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
| `openclaw_memory_rss_bytes`                   | histogram | بلا تسميات                                                                                |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | بلا تسميات                                                                                |

## سياسة التسميات

<AccordionGroup>
  <Accordion title="تسميات محدودة ومنخفضة التعددية">
    تبقى تسميات Prometheus محدودة ومنخفضة التعددية. لا يصدر المصدّر معرّفات تشخيصية خام مثل `runId` أو `sessionKey` أو `sessionId` أو `callId` أو `toolCallId` أو معرّفات الرسائل أو معرّفات المحادثات أو معرّفات طلبات المزوّد.

    تُحجب قيم التسميات ويجب أن تطابق سياسة OpenClaw للأحرف منخفضة التعددية. تُستبدل القيم التي لا تجتاز السياسة بـ `unknown` أو `other` أو `none`، حسب المقياس.

  </Accordion>
  <Accordion title="حدّ السلاسل ومحاسبة الفائض">
    يحدّ المصدّر السلاسل الزمنية المحتفظ بها في الذاكرة عند **2048** سلسلة إجمالًا عبر العدادات والمقاييس اللحظية والمدرجات التكرارية مجتمعة. يتم إسقاط أي سلاسل جديدة تتجاوز هذا الحد، ويزيد `openclaw_prometheus_series_dropped_total` بمقدار واحد في كل مرة.

    راقب هذا العداد كإشارة حاسمة إلى أن سمة في المنبع تسرّب قيمًا عالية التعددية. لا يرفع المصدّر الحد تلقائيًا أبدًا؛ إذا بدأ بالارتفاع، فأصلح المصدر بدل تعطيل الحد.

  </Accordion>
  <Accordion title="ما لا يظهر أبدًا في خرج Prometheus">
    - نص المطالبة، نص الاستجابة، مدخلات الأدوات، مخرجات الأدوات، مطالبات النظام
    - معرّفات طلبات المزوّد الخام (فقط تجزئات محدودة عند الاقتضاء، على spans، وليس على المقاييس أبدًا)
    - مفاتيح الجلسات ومعرّفات الجلسات
    - أسماء المضيفين، مسارات الملفات، القيم السرية

  </Accordion>
</AccordionGroup>

## وصفات PromQL

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
فضّل `gen_ai_client_token_usage` للوحات المعلومات العابرة للمزوّدين: فهو يتبع اصطلاحات OpenTelemetry GenAI الدلالية ويتسق مع المقاييس القادمة من خدمات GenAI غير التابعة لـ OpenClaw.
</Tip>

## الاختيار بين تصدير Prometheus وتصدير OpenTelemetry

يدعم OpenClaw كلا السطحين بشكل مستقل. يمكنك تشغيل أحدهما أو كليهما أو لا شيء منهما.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - نموذج **السحب**: يكشط Prometheus المسار `/api/diagnostics/prometheus`.
    - لا حاجة إلى مجمّع خارجي.
    - تتم المصادقة عبر مصادقة Gateway العادية.
    - السطح مخصص للمقاييس فقط (لا توجد تتبعات أو سجلات).
    - الأفضل للمكدسات الموحّدة مسبقًا على Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - نموذج **الدفع**: يرسل OpenClaw ‏OTLP/HTTP إلى مجمّع أو واجهة خلفية متوافقة مع OTLP.
    - يشمل السطح المقاييس والتتبعات والسجلات.
    - يربط إلى Prometheus عبر OpenTelemetry Collector (مصدّر `prometheus` أو `prometheusremotewrite`) عندما تحتاج إلى كليهما.
    - راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry) للفهرس الكامل.

  </Tab>
</Tabs>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="نص استجابة فارغ">
    - تحقق من `diagnostics.enabled: true` في الإعداد.
    - تأكد من أن Plugin مفعّل ومحمّل باستخدام `openclaw plugins list --enabled`.
    - ولّد بعض الحركة؛ لا تصدر العدادات والمدرجات التكرارية أسطرًا إلا بعد حدث واحد على الأقل.

  </Accordion>
  <Accordion title="401 / غير مصرح">
    تتطلب نقطة النهاية نطاق مشغّل Gateway (`auth: "gateway"` مع `gatewayRuntimeScopeSurface: "trusted-operator"`). استخدم الرمز أو كلمة المرور نفسها التي يستخدمها Prometheus لأي مسار آخر خاص بمشغّل Gateway. لا يوجد وضع عام غير مصادق.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` يرتفع">
    تتجاوز سمة جديدة حدّ **2048** سلسلة. افحص المقاييس الأخيرة بحثًا عن تسمية ذات تعددية مرتفعة بشكل غير متوقع وأصلحها في المصدر. يتعمد المصدّر إسقاط السلاسل الجديدة بدل إعادة كتابة التسميات بصمت.
  </Accordion>
  <Accordion title="يعرض Prometheus سلاسل قديمة بعد إعادة التشغيل">
    يحتفظ Plugin بالحالة في الذاكرة فقط. بعد إعادة تشغيل Gateway، تعود العدادات إلى الصفر وتبدأ المقاييس اللحظية من جديد عند القيمة التالية المبلّغ عنها. استخدم PromQL `rate()` و `increase()` للتعامل مع عمليات إعادة الضبط بسلاسة.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [تصدير التشخيصات](/ar/gateway/diagnostics) — ملف zip للتشخيصات المحلية لحزم الدعم
- [الصحة والجاهزية](/ar/gateway/health) — فحوصات `/healthz` و `/readyz`
- [التسجيل](/ar/logging) — تسجيل قائم على الملفات
- [تصدير OpenTelemetry](/ar/gateway/opentelemetry) — دفع OTLP للتتبعات والمقاييس والسجلات
