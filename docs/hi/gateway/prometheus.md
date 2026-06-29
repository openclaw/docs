---
read_when:
    - आप चाहते हैं कि Prometheus, Grafana, VictoriaMetrics, या कोई अन्य scraper OpenClaw Gateway metrics एकत्र करे
    - आपको डैशबोर्ड या अलर्ट के लिए Prometheus मीट्रिक नामों और लेबल नीति की आवश्यकता है
    - आप OpenTelemetry collector चलाए बिना metrics चाहते हैं
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin के माध्यम से OpenClaw निदान को Prometheus टेक्स्ट मेट्रिक्स के रूप में उजागर करें
title: Prometheus मेट्रिक्स
x-i18n:
    generated_at: "2026-06-28T23:11:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw आधिकारिक `diagnostics-prometheus` plugin के माध्यम से diagnostics metrics उजागर कर सकता है। यह विश्वसनीय diagnostics और core-emitted gateway stability events को सुनता है, फिर इस पते पर Prometheus text endpoint प्रस्तुत करता है:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Content type `text/plain; version=0.0.4; charset=utf-8` है, जो मानक Prometheus exposition format है।

  <Warning>
  यह route Gateway authentication (operator scope) का उपयोग करता है। इसे public unauthenticated `/metrics` endpoint के रूप में expose न करें। इसे उसी auth path के माध्यम से scrape करें जिसका उपयोग आप अन्य operator APIs के लिए करते हैं।
  </Warning>

  Traces, logs, OTLP push, और OpenTelemetry GenAI semantic attributes के लिए, [OpenTelemetry export](/hi/gateway/opentelemetry) देखें।

  ## त्वरित शुरुआत

  <Steps>
  <Step title="Plugin install करें">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Plugin enable करें">
    <Tabs>
      <Tab title="Config">
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
  <Step title="Gateway restart करें">
    HTTP route plugin startup पर register होता है, इसलिए enable करने के बाद reload करें।
  </Step>
  <Step title="Protected route scrape करें">
    वही gateway auth भेजें जिसका उपयोग आपके operator clients करते हैं:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus को वायर करें">
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
`diagnostics.enabled: true` आवश्यक है। इसके बिना, Plugin फिर भी HTTP route पंजीकृत करता है, लेकिन कोई diagnostic events exporter में प्रवाहित नहीं होते, इसलिए response खाली होता है।
</Note>

## निर्यात किए गए metrics

| Metric                                           | Type      | Labels                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | counter   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | counter   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | counter   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | counter   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | counter   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | gauge     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | counter   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | counter   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | gauge     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | counter   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | none                                                                                      |
| `openclaw_memory_pressure_total`                 | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | counter   | none                                                                                      |

## Label नीति

<AccordionGroup>
  <Accordion title="सीमित, कम-cardinality labels">
    Prometheus labels सीमित और कम-cardinality रहते हैं। exporter कच्चे diagnostic identifiers जैसे `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, message IDs, chat IDs, या provider request IDs emit नहीं करता।

    Label values को redact किया जाता है और उन्हें OpenClaw की कम-cardinality character policy से मेल खाना चाहिए। जो values policy में fail होती हैं, उन्हें metric के आधार पर `unknown`, `other`, या `none` से बदल दिया जाता है। scoped agent session keys जैसी दिखने वाली labels को भी `unknown` से बदल दिया जाता है।

  </Accordion>
  <Accordion title="Series cap और overflow accounting">
    exporter counters, gauges, और histograms को मिलाकर memory में retained time series को **2048** series पर cap करता है। उस cap से आगे की नई series drop कर दी जाती हैं, और हर बार `openclaw_prometheus_series_dropped_total` एक से increment होता है।

    इस counter को इस hard signal के रूप में देखें कि upstream attribute high-cardinality values leak कर रहा है। exporter कभी भी cap को अपने-आप नहीं बढ़ाता; अगर यह बढ़ता है, तो cap disable करने के बजाय source को fix करें।

  </Accordion>
  <Accordion title="What never appears in Prometheus output">
    - प्रॉम्प्ट टेक्स्ट, प्रतिक्रिया टेक्स्ट, टूल इनपुट, टूल आउटपुट, सिस्टम प्रॉम्प्ट
    - Talk ट्रांसक्रिप्ट, ऑडियो पेलोड, कॉल आईडी, रूम आईडी, हैंडऑफ टोकन, टर्न आईडी, और कच्चे सेशन आईडी
    - कच्चे प्रदाता अनुरोध आईडी (जहां लागू हो, केवल spans पर सीमित हैश — metrics पर कभी नहीं)
    - सेशन कुंजियां और सेशन आईडी
    - होस्टनाम, फाइल पाथ, गुप्त मान

  </Accordion>
</AccordionGroup>

## PromQL recipes

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
क्रॉस-प्रदाता डैशबोर्ड के लिए `gen_ai_client_token_usage` को प्राथमिकता दें: यह OpenTelemetry GenAI semantic conventions का पालन करता है और गैर-OpenClaw GenAI सेवाओं की metrics के अनुरूप है।
</Tip>

## Prometheus और OpenTelemetry निर्यात के बीच चयन

OpenClaw दोनों surfaces को स्वतंत्र रूप से समर्थन देता है। आप इनमें से किसी एक को, दोनों को, या किसी को भी नहीं चला सकते हैं।

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** मॉडल: Prometheus `/api/diagnostics/prometheus` को scrape करता है।
    - किसी बाहरी collector की आवश्यकता नहीं है।
    - सामान्य Gateway auth के माध्यम से प्रमाणित।
    - Surface केवल metrics है (traces या logs नहीं)।
    - उन stacks के लिए सर्वोत्तम जो पहले से Prometheus + Grafana पर मानकीकृत हैं।

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** मॉडल: OpenClaw OTLP/HTTP को collector या OTLP-संगत backend पर भेजता है।
    - Surface में metrics, traces, और logs शामिल हैं।
    - जब आपको दोनों की आवश्यकता हो, तो OpenTelemetry Collector (`prometheus` या `prometheusremotewrite` exporter) के माध्यम से Prometheus से जोड़ता है।
    - पूर्ण कैटलॉग के लिए [OpenTelemetry निर्यात](/hi/gateway/opentelemetry) देखें।

  </Tab>
</Tabs>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Empty response body">
    - config में `diagnostics.enabled: true` जांचें।
    - पुष्टि करें कि Plugin सक्षम है और `openclaw plugins list --enabled` के साथ लोड है।
    - कुछ traffic जनरेट करें; counters और histograms कम से कम एक event के बाद ही lines emit करते हैं।

  </Accordion>
  <Accordion title="401 / unauthorized">
    Endpoint को Gateway operator scope (`auth: "gateway"` के साथ `gatewayRuntimeScopeSurface: "trusted-operator"`) की आवश्यकता होती है। वही token या password उपयोग करें जो Prometheus किसी अन्य Gateway operator route के लिए उपयोग करता है। कोई सार्वजनिक unauthenticated mode नहीं है।
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` is climbing">
    कोई नया attribute **2048**-series cap से अधिक हो रहा है। अनपेक्षित रूप से high-cardinality label के लिए हाल की metrics का निरीक्षण करें और उसे source पर ठीक करें। Exporter labels को चुपचाप rewrite करने के बजाय जानबूझकर नई series drop करता है।
  </Accordion>
  <Accordion title="Prometheus shows stale series after a restart">
    Plugin state को केवल memory में रखता है। Gateway restart के बाद, counters शून्य पर reset हो जाते हैं और gauges अपनी अगली reported value से restart होते हैं। resets को साफ़ तरह से संभालने के लिए PromQL `rate()` और `increase()` का उपयोग करें।
  </Accordion>
</AccordionGroup>

## संबंधित

- [Diagnostics निर्यात](/hi/gateway/diagnostics) — support bundles के लिए local diagnostics zip
- [Health और readiness](/hi/gateway/health) — `/healthz` और `/readyz` probes
- [Logging](/hi/logging) — file-based logging
- [OpenTelemetry निर्यात](/hi/gateway/opentelemetry) — traces, metrics, और logs के लिए OTLP push
