---
read_when:
    - تريد أن يجمع Prometheus أو Grafana أو VictoriaMetrics أو أي scraper آخر مقاييس OpenClaw Gateway
    - تحتاج إلى أسماء مقاييس Prometheus وسياسة labels لاستخدامها في لوحات المعلومات أو التنبيهات
    - تريد المقاييس من دون تشغيل مجمّع OpenTelemetry
sidebarTitle: Prometheus
summary: عرض تشخيصات OpenClaw كمقاييس نصية لـ Prometheus عبر Plugin ‏diagnostics-prometheus
title: مقاييس Prometheus
x-i18n:
    generated_at: "2026-04-26T11:30:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

يمكن لـ OpenClaw عرض مقاييس التشخيص عبر Plugin المضمّن `diagnostics-prometheus`. وهو يستمع إلى التشخيصات الداخلية الموثوقة ويعرض نقطة نهاية نصية لـ Prometheus على:

```text
GET /api/diagnostics/prometheus
```

يكون نوع المحتوى `text/plain; version=0.0.4; charset=utf-8`، وهو تنسيق العرض القياسي لـ Prometheus.

<Warning>
يستخدم هذا المسار مصادقة Gateway (نطاق المشغّل). لا تعرّضه كنقطة نهاية `/metrics` عامة غير موثقة. اجمعه عبر مسار المصادقة نفسه الذي تستخدمه لبقية واجهات برمجة تطبيقات المشغّل.
</Warning>

بالنسبة إلى التتبعات، والسجلات، ودفع OTLP، وسمات OpenTelemetry GenAI الدلالية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).

## البدء السريع

<Steps>
  <Step title="فعّل Plugin">
    <Tabs>
      <Tab title="الإعدادات">
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
    يتم تسجيل مسار HTTP عند بدء تشغيل Plugin، لذا أعد التحميل بعد التفعيل.
  </Step>
  <Step title="اجمع المسار المحمي">
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
يشترط `diagnostics.enabled: true`. وبدونه، سيظل Plugin يسجل مسار HTTP لكن لن تتدفق أي أحداث تشخيصية إلى المُصدِّر، لذلك ستكون الاستجابة فارغة.
</Note>

## المقاييس المُصدَّرة

| المقياس                                       | النوع     | labels                                                                                    |
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

## سياسة labels

<AccordionGroup>
  <Accordion title="labels محدودة ومنخفضة الكاردينالية">
    تظل labels في Prometheus محدودة ومنخفضة الكاردينالية. ولا يُصدر المُصدِّر معرّفات تشخيصية خام مثل `runId`، أو `sessionKey`، أو `sessionId`، أو `callId`، أو `toolCallId`، أو معرّفات الرسائل، أو معرّفات الدردشة، أو معرّفات طلبات provider.

    تُنقَّح قيم labels ويجب أن تطابق سياسة الأحرف منخفضة الكاردينالية في OpenClaw. ويتم استبدال القيم التي لا تطابق السياسة بـ `unknown` أو `other` أو `none`، بحسب المقياس.

  </Accordion>
  <Accordion title="حد السلاسل واحتساب الفائض">
    يضع المُصدِّر حدًا أقصى للسلاسل الزمنية المحتفَظ بها في الذاكرة يبلغ **2048** سلسلة عبر counters وgauge وhistograms مجتمعة. وأي سلاسل جديدة تتجاوز هذا الحد يتم إسقاطها، وتزداد قيمة `openclaw_prometheus_series_dropped_total` بمقدار واحد في كل مرة.

    راقب هذا العداد بوصفه إشارة حاسمة إلى أن إحدى السمات في المنبع تسرّب قيمًا عالية الكاردينالية. ولا يرفع المُصدِّر الحد تلقائيًا أبدًا؛ فإذا استمرت الزيادة، أصلح المصدر بدلًا من تعطيل الحد.

  </Accordion>
  <Accordion title="ما الذي لا يظهر أبدًا في خرج Prometheus">
    - نص prompt، ونص الاستجابة، ومدخلات الأدوات، ومخرجات الأدوات، وsystem prompts
    - معرّفات طلبات provider الخام (فقط تجزئات محدودة، عند الاقتضاء، على spans — وليس أبدًا على المقاييس)
    - مفاتيح الجلسات ومعرّفات الجلسات
    - أسماء المضيفين، ومسارات الملفات، والقيم السرية
  </Accordion>
</AccordionGroup>

## وصفات PromQL

```promql
# Tokens في الدقيقة، مقسمة حسب provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# الإنفاق (USD) خلال الساعة الماضية، حسب model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# النسبة المئوية 95 لمدة تشغيل model
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO لوقت انتظار قائمة الانتظار (95p أقل من ثانيتين)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# سلاسل Prometheus المسقطة (إنذار الكاردينالية)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
فضّل `gen_ai_client_token_usage` في لوحات المعلومات المشتركة بين providers: فهو يتبع الاتفاقيات الدلالية لـ OpenTelemetry GenAI ويتسق مع المقاييس القادمة من خدمات GenAI غير التابعة لـ OpenClaw.
</Tip>

## الاختيار بين Prometheus وتصدير OpenTelemetry

يدعم OpenClaw كلا السطحين بشكل مستقل. يمكنك تشغيل أحدهما، أو كليهما، أو لا شيء منهما.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - نموذج **سحب**: يقوم Prometheus بجمع `/api/diagnostics/prometheus`.
    - لا حاجة إلى مجمّع خارجي.
    - تتم المصادقة عبر مصادقة Gateway العادية.
    - السطح يقتصر على المقاييس فقط (من دون تتبعات أو سجلات).
    - الأفضل للحِزم التي تعتمد أصلًا على Prometheus + Grafana.
  </Tab>
  <Tab title="diagnostics-otel">
    - نموذج **دفع**: يرسل OpenClaw بيانات OTLP/HTTP إلى مجمّع أو إلى واجهة خلفية متوافقة مع OTLP.
    - يتضمن السطح المقاييس، والتتبعات، والسجلات.
    - يربط مع Prometheus عبر OpenTelemetry Collector (مُصدِّر `prometheus` أو `prometheusremotewrite`) عندما تحتاج إلى الاثنين.
    - راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry) للاطلاع على الفهرس الكامل.
  </Tab>
</Tabs>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="جسم استجابة فارغ">
    - تحقّق من `diagnostics.enabled: true` في الإعدادات.
    - أكّد أن Plugin مفعّل ومحمّل عبر `openclaw plugins list --enabled`.
    - أنشئ بعض الحركة؛ فلا تصدر counters وhistograms أي أسطر إلا بعد حدث واحد على الأقل.
  </Accordion>
  <Accordion title="401 / unauthorized">
    تتطلب نقطة النهاية نطاق مشغّل Gateway (`auth: "gateway"` مع `gatewayRuntimeScopeSurface: "trusted-operator"`). استخدم الرمز المميز أو كلمة المرور نفسها التي يستخدمها Prometheus لأي مسار آخر خاص بمشغّل Gateway. لا يوجد وضع عام غير موثّق.
  </Accordion>
  <Accordion title="ارتفاع `openclaw_prometheus_series_dropped_total`">
    تتجاوز سمة جديدة الحد الأقصى **2048** للسلاسل. افحص المقاييس الحديثة بحثًا عن label عالية الكاردينالية بشكل غير متوقع وأصلحها من المصدر. يقوم المُصدِّر عمدًا بإسقاط السلاسل الجديدة بدلًا من إعادة كتابة labels بصمت.
  </Accordion>
  <Accordion title="يعرض Prometheus سلاسل قديمة بعد إعادة التشغيل">
    يحتفظ Plugin بحالته في الذاكرة فقط. بعد إعادة تشغيل Gateway، تعود counters إلى الصفر وتُعاد gauges من قيمتها التالية المُبلَّغ عنها. استخدم `rate()` و`increase()` في PromQL للتعامل مع إعادة الضبط بشكل صحيح.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [تصدير التشخيصات](/ar/gateway/diagnostics) — ملف zip تشخيصات محلي لحِزم الدعم
- [السلامة والجاهزية](/ar/gateway/health) — probes ‏`/healthz` و`/readyz`
- [Logging](/ar/logging) — التسجيل المعتمد على الملفات
- [تصدير OpenTelemetry](/ar/gateway/opentelemetry) — دفع OTLP للتتبعات، والمقاييس، والسجلات
