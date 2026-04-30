---
read_when:
    - تريد من Prometheus أو Grafana أو VictoriaMetrics أو أداة جمع أخرى جمع مقاييس OpenClaw Gateway
    - تحتاج إلى أسماء مقاييس Prometheus وسياسة التسميات للوحات المعلومات أو التنبيهات
    - تريد مقاييس دون تشغيل مجمّع OpenTelemetry
sidebarTitle: Prometheus
summary: إتاحة تشخيصات OpenClaw كمقاييس نصية بصيغة Prometheus من خلال Plugin diagnostics-prometheus
title: مقاييس Prometheus
x-i18n:
    generated_at: "2026-04-30T08:01:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

يمكن لـ OpenClaw عرض مقاييس التشخيص عبر Plugin المضمّن `diagnostics-prometheus`. يستمع إلى التشخيصات الداخلية الموثوقة ويعرض نقطة نهاية نصية بصيغة Prometheus على:

```text
GET /api/diagnostics/prometheus
```

نوع المحتوى هو `text/plain; version=0.0.4; charset=utf-8`، وهو تنسيق العرض القياسي في Prometheus.

<Warning>
يستخدم المسار مصادقة Gateway (نطاق المشغّل). لا تعرضه كنقطة نهاية `/metrics` عامة من دون مصادقة. اكشطه عبر مسار المصادقة نفسه الذي تستخدمه لواجهات API الخاصة بالمشغّل.
</Warning>

للتتبعات والسجلات ودفع OTLP وسمات OpenTelemetry GenAI الدلالية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).

## البدء السريع

<Steps>
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
    يُسجَّل مسار HTTP عند بدء Plugin، لذا أعد التحميل بعد التفعيل.
  </Step>
  <Step title="اكشط المسار المحمي">
    أرسل مصادقة Gateway نفسها التي يستخدمها عملاء المشغّل لديك:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="وصّل Prometheus">
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
القيمة `diagnostics.enabled: true` مطلوبة. من دونها، يظل Plugin يسجّل مسار HTTP، لكن لا تتدفق أي أحداث تشخيصية إلى المصدّر، لذلك تكون الاستجابة فارغة.
</Note>

## المقاييس المصدّرة

| المقياس                                        | النوع      | التسميات                                                                                    |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | عدّاد   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | مدرّج تكراري | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | عدّاد   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | مدرّج تكراري | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | عدّاد   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | مدرّج تكراري | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | عدّاد   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | عدّاد   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | مدرّج تكراري | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | عدّاد   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | مدرّج تكراري | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | عدّاد   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | مدرّج تكراري | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | عدّاد   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | مدرّج تكراري | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | مقياس     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | مدرّج تكراري | `lane`                                                                                    |
| `openclaw_session_state_total`                | عدّاد   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | مقياس     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | مقياس     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | مدرّج تكراري | لا شيء                                                                                      |
| `openclaw_memory_pressure_total`              | عدّاد   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | عدّاد   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | عدّاد   | لا شيء                                                                                      |

## سياسة التسميات

<AccordionGroup>
  <Accordion title="تسميات محدودة ومنخفضة الكاردينالية">
    تظل تسميات Prometheus محدودة ومنخفضة الكاردينالية. لا يصدر المصدّر معرّفات تشخيصية خامًا مثل `runId` أو `sessionKey` أو `sessionId` أو `callId` أو `toolCallId` أو معرّفات الرسائل أو معرّفات الدردشات أو معرّفات طلبات المزوّد.

    تُنقّح قيم التسميات ويجب أن تطابق سياسة الأحرف منخفضة الكاردينالية في OpenClaw. تُستبدل القيم التي تفشل في السياسة بـ `unknown` أو `other` أو `none`، حسب المقياس.

  </Accordion>
  <Accordion title="حد السلاسل ومحاسبة التجاوز">
    يحدّ المصدّر السلاسل الزمنية المحتفظ بها في الذاكرة عند **2048** سلسلة عبر العدّادات والمقاييس والمدرجات التكرارية مجتمعة. تُسقط السلاسل الجديدة التي تتجاوز ذلك الحد، وتزيد قيمة `openclaw_prometheus_series_dropped_total` بمقدار واحد في كل مرة.

    راقب هذا العدّاد كإشارة حاسمة إلى أن سمة في المنبع تسرّب قيمًا عالية الكاردينالية. لا يرفع المصدّر الحد تلقائيًا أبدًا؛ إذا ارتفع، فأصلح المصدر بدلًا من تعطيل الحد.

  </Accordion>
  <Accordion title="ما لا يظهر أبدًا في مخرجات Prometheus">
    - نص الموجّه، نص الاستجابة، مدخلات الأدوات، مخرجات الأدوات، موجّهات النظام
    - معرّفات طلبات المزوّد الخام (تجزئات محدودة فقط، عند الاقتضاء، على الامتدادات — وليس على المقاييس أبدًا)
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
فضّل `gen_ai_client_token_usage` للوحات المعلومات العابرة للمزوّدين: فهو يتبع اصطلاحات OpenTelemetry GenAI الدلالية ويتسق مع المقاييس من خدمات GenAI غير التابعة لـ OpenClaw.
</Tip>

## الاختيار بين Prometheus وتصدير OpenTelemetry

يدعم OpenClaw كلا السطحين بشكل مستقل. يمكنك تشغيل أي منهما أو كليهما أو لا شيء منهما.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - نموذج **السحب**: يكشط Prometheus المسار `/api/diagnostics/prometheus`.
    - لا حاجة إلى جامع خارجي.
    - تتم المصادقة عبر مصادقة Gateway العادية.
    - السطح للمقاييس فقط (لا تتبعات أو سجلات).
    - الأنسب للمكدسات الموحّدة مسبقًا على Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - نموذج **الدفع**: يرسل OpenClaw ‏OTLP/HTTP إلى جامع أو خلفية متوافقة مع OTLP.
    - يتضمن السطح المقاييس والتتبعات والسجلات.
    - يربط إلى Prometheus عبر OpenTelemetry Collector (مصدّر `prometheus` أو `prometheusremotewrite`) عندما تحتاج إلى كليهما.
    - راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry) للاطلاع على الفهرس الكامل.

  </Tab>
</Tabs>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="نص الاستجابة فارغ">
    - تحقّق من `diagnostics.enabled: true` في الإعداد.
    - تأكّد من أن Plugin مفعّل ومحمّل باستخدام `openclaw plugins list --enabled`.
    - أنشئ بعض الحركة؛ فالعدّادات والمدرجات التكرارية لا تصدر أسطرًا إلا بعد حدث واحد على الأقل.

  </Accordion>
  <Accordion title="401 / غير مصرح">
    تتطلب نقطة النهاية نطاق مشغّل Gateway (`auth: "gateway"` مع `gatewayRuntimeScopeSurface: "trusted-operator"`). استخدم الرمز أو كلمة المرور نفسها التي يستخدمها Prometheus لأي مسار مشغّل آخر في Gateway. لا يوجد وضع عام من دون مصادقة.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` يرتفع">
    تتجاوز سمة جديدة حد **2048** سلسلة. افحص المقاييس الحديثة بحثًا عن تسمية عالية الكاردينالية بشكل غير متوقع وأصلحها في المصدر. يسقط المصدّر عمدًا السلاسل الجديدة بدلًا من إعادة كتابة التسميات بصمت.
  </Accordion>
  <Accordion title="يعرض Prometheus سلاسل قديمة بعد إعادة التشغيل">
    يحتفظ Plugin بالحالة في الذاكرة فقط. بعد إعادة تشغيل Gateway، تُعاد العدّادات إلى الصفر وتبدأ المقاييس من جديد عند القيمة التالية المبلّغ عنها. استخدم `rate()` و `increase()` في PromQL للتعامل مع عمليات إعادة الضبط بنظافة.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [تصدير التشخيصات](/ar/gateway/diagnostics) — ملف zip تشخيصي محلي لحزم الدعم
- [الصحة والجاهزية](/ar/gateway/health) — مجسات `/healthz` و `/readyz`
- [التسجيل](/ar/logging) — تسجيل قائم على الملفات
- [تصدير OpenTelemetry](/ar/gateway/opentelemetry) — دفع OTLP للتتبعات والمقاييس والسجلات
