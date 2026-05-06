---
read_when:
    - تريد أن يجمع Prometheus أو Grafana أو VictoriaMetrics أو أداة سحب أخرى مقاييس OpenClaw Gateway
    - تحتاج إلى أسماء مقاييس Prometheus وسياسة التسميات للوحات المعلومات أو التنبيهات
    - تريد مقاييس دون تشغيل مُجمِّع OpenTelemetry
sidebarTitle: Prometheus
summary: أتِح تشخيصات OpenClaw كمقاييس نصية لـ Prometheus من خلال Plugin diagnostics-prometheus
title: مقاييس Prometheus
x-i18n:
    generated_at: "2026-05-06T17:57:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 864e2a343266d84baaaaca9d8e494359198a3b43e8663ec8dcfcd4e2e4c6c004
    source_path: gateway/prometheus.md
    workflow: 16
---

يمكن لـ OpenClaw كشف مقاييس التشخيصات عبر Plugin الرسمي `diagnostics-prometheus`. يستمع إلى التشخيصات الداخلية الموثوقة ويعرض نقطة نهاية نصية بتنسيق Prometheus عند:

```text
GET /api/diagnostics/prometheus
```

نوع المحتوى هو `text/plain; version=0.0.4; charset=utf-8`، وهو تنسيق العرض القياسي في Prometheus.

<Warning>
يستخدم المسار مصادقة Gateway (نطاق المشغّل). لا تكشفه كنقطة نهاية `/metrics` عامة بلا مصادقة. اكشطه عبر مسار المصادقة نفسه الذي تستخدمه لواجهات API الخاصة بالمشغّل.
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
    يُسجَّل مسار HTTP عند بدء تشغيل Plugin، لذا أعد التحميل بعد التفعيل.
  </Step>
  <Step title="اكشط المسار المحمي">
    أرسل مصادقة gateway نفسها التي يستخدمها عملاء المشغّل لديك:

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
`diagnostics.enabled: true` مطلوب. بدونه، يظل Plugin يسجّل مسار HTTP لكن لا تتدفق أي أحداث تشخيصية إلى المصدّر، لذلك تكون الاستجابة فارغة.
</Note>

## المقاييس المصدّرة

| المقياس                                       | النوع     | التسميات                                                                                 |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | عدّاد     | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | مدرّج تكراري | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | عدّاد     | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | مدرّج تكراري | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | عدّاد     | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | مدرّج تكراري | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | عدّاد     | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | عدّاد     | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | مدرّج تكراري | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | عدّاد     | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | مدرّج تكراري | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | عدّاد     | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | مدرّج تكراري | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`     | عدّاد     | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`             | عدّاد     | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | مدرّج تكراري | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                   | عدّاد     | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`        | مدرّج تكراري | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                   | مدرّج تكراري | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                    | مقياس     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | مدرّج تكراري | `lane`                                                                                    |
| `openclaw_session_state_total`                | عدّاد     | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | مقياس     | `state`                                                                                   |
| `openclaw_session_recovery_total`             | عدّاد     | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`       | مدرّج تكراري | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_memory_bytes`                       | مقياس     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | مدرّج تكراري | لا شيء                                                                                    |
| `openclaw_memory_pressure_total`              | عدّاد     | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | عدّاد     | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | عدّاد     | لا شيء                                                                                    |

## سياسة التسميات

<AccordionGroup>
  <Accordion title="تسميات محدودة ومنخفضة الكاردينالية">
    تبقى تسميات Prometheus محدودة ومنخفضة الكاردينالية. لا يصدر المصدّر معرّفات تشخيصية خامًا مثل `runId` أو `sessionKey` أو `sessionId` أو `callId` أو `toolCallId` أو معرّفات الرسائل أو معرّفات الدردشة أو معرّفات طلبات المزوّد.

    تُنقّح قيم التسميات ويجب أن تطابق سياسة OpenClaw للأحرف منخفضة الكاردينالية. تُستبدل القيم التي تفشل في السياسة بـ `unknown` أو `other` أو `none`، وفقًا للمقياس.

  </Accordion>
  <Accordion title="سقف السلاسل الزمنية واحتساب التجاوز">
    يحدّ المصدّر السلاسل الزمنية المحتفَظ بها في الذاكرة عند **2048** سلسلة عبر العدادات والمقاييس والمدرجات التكرارية مجتمعة. تُسقَط السلاسل الجديدة التي تتجاوز هذا السقف، ويزداد `openclaw_prometheus_series_dropped_total` بمقدار واحد في كل مرة.

    راقب هذا العداد بوصفه إشارة حاسمة إلى أن سمةً في المنبع تسرّب قيماً عالية التعددية. لا يرفع المصدّر السقف تلقائياً أبداً؛ إذا أخذ بالارتفاع، فأصلح المصدر بدلاً من تعطيل السقف.

  </Accordion>
  <Accordion title="ما لا يظهر أبداً في مخرجات Prometheus">
    - نص المطالبة، نص الاستجابة، مدخلات الأدوات، مخرجات الأدوات، مطالبات النظام
    - نصوص Talk، حمولات الصوت، معرّفات المكالمات، معرّفات الغرف، رموز التسليم، معرّفات الدورات، ومعرّفات الجلسات الخام
    - معرّفات طلبات المزوّد الخام (فقط التجزئات المحدودة، عند الاقتضاء، على الامتدادات — وليس على المقاييس أبداً)
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
فضّل `gen_ai_client_token_usage` للوحات المعلومات العابرة للمزوّدين: فهو يتبع الاصطلاحات الدلالية لـ OpenTelemetry GenAI ومتسق مع المقاييس من خدمات GenAI غير التابعة لـ OpenClaw.
</Tip>

## الاختيار بين تصدير Prometheus وOpenTelemetry

يدعم OpenClaw السطحين كليهما بشكل مستقل. يمكنك تشغيل أحدهما، أو كليهما، أو عدم تشغيل أي منهما.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - نموذج **السحب**: يجلب Prometheus البيانات من `/api/diagnostics/prometheus`.
    - لا يلزم مجمّع خارجي.
    - تتم المصادقة عبر مصادقة Gateway العادية.
    - السطح مخصص للمقاييس فقط (لا امتدادات أو سجلات).
    - الأنسب للبنى الموحّدة مسبقاً على Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - نموذج **الدفع**: يرسل OpenClaw‏ OTLP/HTTP إلى مجمّع أو واجهة خلفية متوافقة مع OTLP.
    - يشمل السطح المقاييس والامتدادات والسجلات.
    - يربط إلى Prometheus عبر OpenTelemetry Collector (مصدّر `prometheus` أو `prometheusremotewrite`) عندما تحتاج إلى كليهما.
    - راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry) للاطلاع على الكتالوج الكامل.

  </Tab>
</Tabs>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="نص استجابة فارغ">
    - تحقق من `diagnostics.enabled: true` في الإعدادات.
    - تأكد من أن Plugin مفعّل ومحمّل باستخدام `openclaw plugins list --enabled`.
    - أنشئ بعض الحركة؛ لا تصدر العدادات والمدرجات التكرارية أسطراً إلا بعد وقوع حدث واحد على الأقل.

  </Accordion>
  <Accordion title="401 / غير مصرح">
    تتطلب نقطة النهاية نطاق مشغّل Gateway (`auth: "gateway"` مع `gatewayRuntimeScopeSurface: "trusted-operator"`). استخدم نفس الرمز أو كلمة المرور التي يستخدمها Prometheus لأي مسار مشغّل Gateway آخر. لا يوجد وضع عام بلا مصادقة.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` آخذ في الارتفاع">
    تتجاوز سمة جديدة سقف السلاسل البالغ **2048**. افحص المقاييس الأخيرة بحثاً عن تسمية ذات تعددية عالية على نحو غير متوقع وأصلحها في المصدر. يسقط المصدّر السلاسل الجديدة عمداً بدلاً من إعادة كتابة التسميات بصمت.
  </Accordion>
  <Accordion title="يعرض Prometheus سلاسل قديمة بعد إعادة التشغيل">
    يحتفظ Plugin بالحالة في الذاكرة فقط. بعد إعادة تشغيل Gateway، تُعاد العدادات إلى الصفر وتبدأ المقاييس من جديد عند القيمة التالية المبلّغ عنها. استخدم `rate()` و`increase()` في PromQL للتعامل مع عمليات إعادة التعيين بسلاسة.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [تصدير التشخيصات](/ar/gateway/diagnostics) — ملف zip للتشخيصات المحلية لحزم الدعم
- [الصحة والجاهزية](/ar/gateway/health) — مجسّات `/healthz` و`/readyz`
- [التسجيل](/ar/logging) — تسجيل مستند إلى الملفات
- [تصدير OpenTelemetry](/ar/gateway/opentelemetry) — دفع OTLP للتتبعات والمقاييس والسجلات
