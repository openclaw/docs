---
read_when:
    - تريد أن يجمع Prometheus أو Grafana أو VictoriaMetrics أو أداة جمع أخرى مقاييس Gateway في OpenClaw
    - تحتاج إلى أسماء مقاييس Prometheus وسياسة التسميات للوحات المعلومات أو التنبيهات
    - تريد مقاييس دون تشغيل مُجمِّع OpenTelemetry
sidebarTitle: Prometheus
summary: اعرض تشخيصات OpenClaw كمقاييس نصية بتنسيق Prometheus من خلال Plugin diagnostics-prometheus
title: مقاييس Prometheus
x-i18n:
    generated_at: "2026-07-12T05:54:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  يمكن لـ OpenClaw عرض مقاييس التشخيص من خلال Plugin
  `diagnostics-prometheus` الرسمي. ويستمع إلى بيانات التشخيص الموثوقة، بالإضافة إلى
  أحداث التشخيص الموسومة داخليًا والمملوكة للموزّع (إشارات قائمة الانتظار والذاكرة
  واسترداد الجلسة)، ويعرض نقطة نهاية نصية بتنسيق Prometheus على:

  ```text
  GET /api/diagnostics/prometheus
  ```

  نوع المحتوى هو `text/plain; version=0.0.4; charset=utf-8`، وهو تنسيق العرض
  القياسي لـ Prometheus.

  <Warning>
  يستخدم المسار مصادقة Gateway (نطاق المشغّل، وواجهة المشغّل الموثوق). لا تعرضه كنقطة نهاية عامة غير مصادَق عليها باسم `/metrics`. اجمع بياناته عبر مسار المصادقة نفسه الذي تستخدمه لواجهات API الأخرى الخاصة بالمشغّل.
  </Warning>

  للاطلاع على آثار التتبّع والسجلات والدفع عبر OTLP والسمات الدلالية لـ OpenTelemetry GenAI، راجع [التصدير عبر OpenTelemetry](/ar/gateway/opentelemetry).

  ## البدء السريع

  <Steps>
  <Step title="تثبيت Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="تمكين Plugin">
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
  <Step title="إعادة تشغيل Gateway">
    يُسجَّل مسار HTTP عند بدء تشغيل Plugin، لذا أعد التحميل بعد تمكينه.
  </Step>
  <Step title="جمع البيانات من المسار المحمي">
    أرسل مصادقة Gateway نفسها التي تستخدمها برامج المشغّل العميلة:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="ربط Prometheus">
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
تكون القيمة الافتراضية لـ `diagnostics.enabled` هي `true`؛ ولا تضبطها على `false` إلا في البيئات شديدة التقييد. إذا كانت `false`، فسيظل Plugin يسجّل مسار HTTP، لكن لن تتدفق أي أحداث تشخيصية إلى المُصدِّر، ولذلك ستكون الاستجابة فارغة.
</Note>

## المقاييس المُصدَّرة

| المقياس                                          | النوع           | التسميات                                                                                  |
| ------------------------------------------------ | --------------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | عدّاد            | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | مدرّج تكراري     | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | عدّاد            | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | مدرّج تكراري     | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | عدّاد            | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | عدّاد            | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | مدرّج تكراري     | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | عدّاد            | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | مدرّج تكراري     | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | عدّاد            | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | عدّاد            | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | مدرّج تكراري     | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | عدّاد            | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | عدّاد            | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | مدرّج تكراري     | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | عدّاد            | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | عدّاد            | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | مدرّج تكراري     | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | عدّاد            | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | عدّاد            | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | عدّاد            | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | مدرّج تكراري     | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | عدّاد            | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | مدرّج تكراري     | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | عدّاد            | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | عدّاد            | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | مدرّج تكراري     | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | عدّاد            | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | مدرّج تكراري     | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | مدرّج تكراري     | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | مقياس آني        | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | مدرّج تكراري     | `lane`                                                                                    |
| `openclaw_session_state_total`                   | عدّاد            | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | مقياس آني        | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | عدّاد            | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | عدّاد            | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | مدرّج تكراري     | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | عدّاد            | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | مدرّج تكراري     | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | عدّاد            | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | مقياس آني        | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | مدرّج تكراري     | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | مدرّج تكراري     | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | مدرّج تكراري     | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | مدرّج تكراري     | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | عدّاد            | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | مدرّج تكراري     | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | مقياس آني        | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | مدرّج تكراري     | لا شيء                                                                                    |
| `openclaw_memory_pressure_total`                 | عدّاد            | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | عدّاد            | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | عدّاد            | لا شيء                                                                                    |
| `openclaw_diagnostic_async_queue_dropped_total`  | عدّاد            | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | مقياس آني        | لا شيء                                                                                    |

## سياسة التسميات

<AccordionGroup>
  <Accordion title="تسميات محدودة ومنخفضة التنوّع">
    تظل تسميات Prometheus محدودة ومنخفضة التنوّع. لا يصدر المُصدِّر معرّفات التشخيص الأولية مثل `runId` أو `sessionKey` أو `sessionId` أو `callId` أو `toolCallId` أو معرّفات الرسائل أو معرّفات المحادثات أو معرّفات طلبات المزوّد.

    تُنقَّح قيم التسميات، ويجب أن تتوافق مع سياسة OpenClaw للحروف منخفضة التنوّع. تُستبدل القيم التي لا تتوافق مع السياسة بـ `unknown` أو `other` أو `none`، وفقًا للمقياس. كما تُستبدل التسميات التي تبدو كمفاتيح جلسات وكيل ذات نطاق بـ `unknown`.

  </Accordion>
  <Accordion title="الحد الأقصى للسلاسل واحتساب التجاوز">
    يحدد المُصدِّر الحد الأقصى للسلاسل الزمنية المحتفَظ بها في الذاكرة عند **2048** سلسلة إجمالًا عبر العدادات والمقاييس والمدرّجات التكرارية. تُسقط السلاسل الجديدة التي تتجاوز هذا الحد، وتزداد قيمة `openclaw_prometheus_series_dropped_total` بمقدار واحد في كل مرة.

    راقب هذا العداد بوصفه إشارة قاطعة إلى أن إحدى السمات في المراحل السابقة تُسرِّب قيمًا عالية التعددية. لا يرفع المُصدِّر الحد تلقائيًا مطلقًا؛ فإذا ارتفعت قيمة العداد، فأصلح المصدر بدلًا من تعطيل الحد.

  </Accordion>
  <Accordion title="ما لا يظهر مطلقًا في مخرجات Prometheus">
    - نص المطالبة، ونص الاستجابة، ومدخلات الأدوات، ومخرجات الأدوات، ومطالبات النظام
    - نصوص محادثات Talk، وحمولات الصوت، ومعرّفات المكالمات، ومعرّفات الغرف، ورموز التسليم، ومعرّفات الأدوار، ومعرّفات الجلسات الأولية
    - معرّفات طلبات المزوّد الأولية (تظهر فقط بصمات محدودة، عند الاقتضاء، في الامتدادات — ولا تظهر مطلقًا في المقاييس)
    - مفاتيح الجلسات ومعرّفات الجلسات
    - أسماء المضيفين، ومسارات الملفات، والقيم السرية

  </Accordion>
</AccordionGroup>

## وصفات PromQL

```promql
# الرموز المميزة في الدقيقة، مقسّمة حسب المزوّد
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# الإنفاق (بالدولار الأمريكي) خلال الساعة الماضية، حسب النموذج
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# المئين الخامس والتسعون لمدة تشغيل النموذج
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# هدف مستوى الخدمة لوقت انتظار قائمة الانتظار (المئين 95 أقل من ثانيتين)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# استخدام المهارات، مقسّم حسب المصدر المحدود
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# سلاسل Prometheus المُسقطة (إنذار التعددية)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
فضّل `gen_ai_client_token_usage` للوحات المعلومات المشتركة بين المزوّدين: فهو يتبع الاصطلاحات الدلالية للذكاء الاصطناعي التوليدي في OpenTelemetry ويتسق مع المقاييس الصادرة عن خدمات الذكاء الاصطناعي التوليدي غير التابعة لـ OpenClaw.
</Tip>

## الاختيار بين التصدير عبر Prometheus وOpenTelemetry

يدعم OpenClaw كلا الوجهتين بصورة مستقلة. يمكنك تشغيل إحداهما أو كلتيهما أو عدم تشغيل أي منهما.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - نموذج **السحب**: يجمع Prometheus البيانات من `/api/diagnostics/prometheus`.
    - لا يلزم جامع خارجي.
    - تتم المصادقة عبر مصادقة Gateway المعتادة.
    - تقتصر الوجهة على المقاييس فقط (من دون تتبعات أو سجلات).
    - الأنسب للمنظومات الموحّدة مسبقًا على Prometheus وGrafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - نموذج **الدفع**: يرسل OpenClaw بيانات OTLP/HTTP إلى جامع أو واجهة خلفية متوافقة مع OTLP.
    - تشمل الوجهة المقاييس والتتبعات والسجلات.
    - يتكامل مع Prometheus عبر OpenTelemetry Collector (مُصدِّر `prometheus` أو `prometheusremotewrite`) عند الحاجة إلى كليهما.
    - راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry) للاطلاع على الكتالوج الكامل.

  </Tab>
</Tabs>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="نص استجابة فارغ">
    - تحقق من أن `diagnostics.enabled` غير مضبوط على `false` في الإعدادات (قيمته الافتراضية `true`).
    - تأكد من تمكين Plugin وتحميله باستخدام `openclaw plugins list --enabled`.
    - أنشئ بعض حركة البيانات؛ فالعدادات والمدرّجات التكرارية لا تصدر أسطرًا إلا بعد وقوع حدث واحد على الأقل.

  </Accordion>
  <Accordion title="401 / غير مصرّح">
    تتطلب نقطة النهاية نطاق مشغّل Gateway (`auth: "gateway"` مع `gatewayRuntimeScopeSurface: "trusted-operator"`). استخدم الرمز المميز أو كلمة المرور نفسها التي يستخدمها Prometheus لأي مسار آخر لمشغّل Gateway. لا يوجد وضع عام غير مصادَق عليه.
  </Accordion>
  <Accordion title="قيمة `openclaw_prometheus_series_dropped_total` آخذة في الارتفاع">
    تتسبب سمة جديدة في تجاوز حد السلاسل البالغ **2048** سلسلة. افحص المقاييس الحديثة بحثًا عن تسمية ذات تعددية مرتفعة على نحو غير متوقع، وأصلحها عند المصدر. يُسقط المُصدِّر السلاسل الجديدة عمدًا بدلًا من إعادة كتابة التسميات بصمت.
  </Accordion>
  <Accordion title="يعرض Prometheus سلاسل قديمة بعد إعادة التشغيل">
    يحتفظ Plugin بالحالة في الذاكرة فقط. بعد إعادة تشغيل Gateway، تُصفّر العدادات وتستأنف المقاييس من القيمة التالية التي يُبلَّغ عنها. استخدم `rate()` و`increase()` في PromQL للتعامل مع عمليات إعادة الضبط بسلاسة.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [تصدير التشخيصات](/ar/gateway/diagnostics) — ملف تشخيصات مضغوط محلي لحزم الدعم
- [الصحة والجاهزية](/ar/gateway/health) — مجسّا `/healthz` و`/readyz`
- [التسجيل](/ar/logging) — تسجيل قائم على الملفات
- [تصدير OpenTelemetry](/ar/gateway/opentelemetry) — دفع OTLP للتتبعات والمقاييس والسجلات
