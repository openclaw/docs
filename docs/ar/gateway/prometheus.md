---
read_when:
    - تريد أن يجمع Prometheus أو Grafana أو VictoriaMetrics أو أي scraper آخر مقاييس OpenClaw Gateway
    - تحتاج إلى أسماء مقاييس Prometheus وسياسة التسميات للوحات المعلومات أو التنبيهات
    - تريد مقاييس من دون تشغيل مجمّع OpenTelemetry
sidebarTitle: Prometheus
summary: اعرض تشخيصات OpenClaw كمقاييس نصية لـ Prometheus من خلال Plugin diagnostics-prometheus
title: مقاييس Prometheus
x-i18n:
    generated_at: "2026-06-27T17:42:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  يمكن لـ OpenClaw عرض مقاييس التشخيص عبر Plugin الرسمي `diagnostics-prometheus`. يستمع إلى التشخيصات الموثوقة وأحداث استقرار Gateway الصادرة من النواة، ثم يعرض نقطة نهاية نصية بتنسيق Prometheus على:

  ```text
  GET /api/diagnostics/prometheus
  ```

  نوع المحتوى هو `text/plain; version=0.0.4; charset=utf-8`، وهو تنسيق العرض القياسي في Prometheus.

  <Warning>
  يستخدم المسار مصادقة Gateway (نطاق المشغّل). لا تعرضه كنقطة نهاية `/metrics` عامة بلا مصادقة. اجعله يُكشَط عبر مسار المصادقة نفسه الذي تستخدمه لواجهات API الأخرى الخاصة بالمشغّل.
  </Warning>

  للتتبعات والسجلات ودفع OTLP وسمات GenAI الدلالية في OpenTelemetry، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).

  ## بدء سريع

  <Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="فعّل Plugin">
    <Tabs>
      <Tab title="التكوين">
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
يلزم ضبط `diagnostics.enabled: true`. بدونه، يظل Plugin يسجّل مسار HTTP، لكن لا تتدفق أي أحداث تشخيصية إلى أداة التصدير، لذلك تكون الاستجابة فارغة.
</Note>

## المقاييس المصدّرة

| المقياس                                           | النوع      | التسميات                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | عداد   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | مدرج تكراري | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | عداد   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | مدرج تكراري | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | عداد   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | عداد   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | مدرج تكراري | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | عداد   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | عداد   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | عداد   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | مدرج تكراري | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | عداد   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | عداد   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | مدرج تكراري | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | عداد   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | عداد   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | مدرج تكراري | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | عداد   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | عداد   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | عداد   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | مدرج تكراري | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | عداد   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | مدرج تكراري | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | عداد   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | عداد   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | مدرج تكراري | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | عداد   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | مدرج تكراري | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | مدرج تكراري | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | مقياس     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | مدرج تكراري | `lane`                                                                                    |
| `openclaw_session_state_total`                   | عداد   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | مقياس     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | عداد   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | عداد   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | مدرج تكراري | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | عداد   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | مدرج تكراري | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | عداد   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | مقياس     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | مدرج تكراري | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | مدرج تكراري | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | مدرج تكراري | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | مدرج تكراري | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | عداد   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | مدرج تكراري | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | مقياس     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | مدرج تكراري | لا شيء                                                                                      |
| `openclaw_memory_pressure_total`                 | عداد   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | عداد   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | عداد   | لا شيء                                                                                      |

## سياسة التسميات

<AccordionGroup>
  <Accordion title="تسميات محدودة ومنخفضة التعددية">
    تبقى تسميات Prometheus محدودة ومنخفضة التعددية. لا تصدر أداة التصدير معرّفات تشخيصية خامًا مثل `runId` أو `sessionKey` أو `sessionId` أو `callId` أو `toolCallId` أو معرّفات الرسائل أو معرّفات المحادثات أو معرّفات طلبات المزوّدين.

    تُنقّح قيم التسميات ويجب أن تطابق سياسة OpenClaw للأحرف منخفضة التعددية. تُستبدل القيم التي لا تستوفي السياسة بـ `unknown` أو `other` أو `none`، حسب المقياس. وتُستبدل أيضًا التسميات التي تبدو كمفاتيح جلسات وكيل ذات نطاق بـ `unknown`.

  </Accordion>
  <Accordion title="حد السلاسل ومحاسبة التجاوز">
    تضع أداة التصدير حدًا أقصى للسلاسل الزمنية المحتفَظ بها في الذاكرة يبلغ **2048** سلسلة عبر العدادات والمقاييس والمدرجات التكرارية مجتمعة. تُسقَط السلاسل الجديدة التي تتجاوز هذا الحد، وتزداد قيمة `openclaw_prometheus_series_dropped_total` بمقدار واحد كل مرة.

    راقب هذا العداد كإشارة حاسمة إلى أن سمة في المصدر الأعلى تسرّب قيمًا عالية التعددية. لا ترفع أداة التصدير الحد تلقائيًا أبدًا؛ إذا بدأ بالارتفاع، فأصلح المصدر بدلًا من تعطيل الحد.

  </Accordion>
  <Accordion title="ما لا يظهر أبدًا في مخرجات Prometheus">
    - نص الموجه، نص الاستجابة، مدخلات الأدوات، مخرجات الأدوات، موجهات النظام
    - نصوص محادثات Talk، حمولات الصوت، معرّفات المكالمات، معرّفات الغرف، رموز التسليم، معرّفات الأدوار، ومعرّفات الجلسات الخام
    - معرّفات طلبات المزوّد الخام (تجزئات محدودة فقط، عند الاقتضاء، على المقاطع — وليس على المقاييس أبدًا)
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

# Skill usage, split by bounded source
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
فضّل `gen_ai_client_token_usage` للوحات المعلومات متعددة المزوّدين: فهو يتبع اصطلاحات OpenTelemetry GenAI الدلالية ويتسق مع المقاييس من خدمات GenAI غير التابعة لـ OpenClaw.
</Tip>

## الاختيار بين تصدير Prometheus وOpenTelemetry

يدعم OpenClaw كلا السطحين بشكل مستقل. يمكنك تشغيل أيٍّ منهما، أو كليهما، أو عدم تشغيلهما.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - نموذج **السحب**: يقوم Prometheus بجمع `/api/diagnostics/prometheus`.
    - لا يلزم مجمّع خارجي.
    - تتم المصادقة عبر مصادقة Gateway العادية.
    - السطح مخصص للمقاييس فقط (لا توجد تتبعات أو سجلات).
    - الأفضل للمكدسات الموحّدة مسبقًا على Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - نموذج **الدفع**: يرسل OpenClaw ‏OTLP/HTTP إلى مجمّع أو واجهة خلفية متوافقة مع OTLP.
    - يشمل السطح المقاييس والتتبعات والسجلات.
    - يربط إلى Prometheus عبر OpenTelemetry Collector (مصدّر `prometheus` أو `prometheusremotewrite`) عندما تحتاج إلى كليهما.
    - راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry) للاطلاع على الكتالوج الكامل.

  </Tab>
</Tabs>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="جسم استجابة فارغ">
    - تحقق من `diagnostics.enabled: true` في الإعدادات.
    - تأكد من أن Plugin مفعّل ومحمّل باستخدام `openclaw plugins list --enabled`.
    - أنشئ بعض الحركة؛ لا تُصدر العدادات والمدرجات التكرارية أسطرًا إلا بعد حدث واحد على الأقل.

  </Accordion>
  <Accordion title="401 / غير مصرّح">
    تتطلب نقطة النهاية نطاق مشغّل Gateway (`auth: "gateway"` مع `gatewayRuntimeScopeSurface: "trusted-operator"`). استخدم الرمز أو كلمة المرور نفسها التي يستخدمها Prometheus لأي مسار مشغّل Gateway آخر. لا يوجد وضع عام غير مصادق عليه.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` يرتفع">
    تتجاوز سمة جديدة حد السلاسل البالغ **2048**. افحص المقاييس الحديثة بحثًا عن تسمية ذات كاردينالية عالية بشكل غير متوقع، وأصلحها عند المصدر. يتعمّد المصدّر إسقاط السلاسل الجديدة بدلًا من إعادة كتابة التسميات بصمت.
  </Accordion>
  <Accordion title="يعرض Prometheus سلاسل قديمة بعد إعادة التشغيل">
    يحتفظ Plugin بالحالة في الذاكرة فقط. بعد إعادة تشغيل Gateway، تعود العدادات إلى الصفر وتُعاد مقاييس القياس عند القيمة التالية التي يتم الإبلاغ عنها. استخدم `rate()` و`increase()` في PromQL للتعامل مع عمليات إعادة الضبط بشكل نظيف.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [تصدير التشخيصات](/ar/gateway/diagnostics) — أرشيف zip للتشخيصات المحلية لحزم الدعم
- [الصحة والجاهزية](/ar/gateway/health) — مجسات `/healthz` و`/readyz`
- [التسجيل](/ar/logging) — تسجيل قائم على الملفات
- [تصدير OpenTelemetry](/ar/gateway/opentelemetry) — دفع OTLP للتتبعات والمقاييس والسجلات
