---
read_when:
    - आप चाहते हैं कि Prometheus, Grafana, VictoriaMetrics या कोई अन्य स्क्रेपर OpenClaw Gateway के मेट्रिक्स एकत्र करे
    - डैशबोर्ड या अलर्ट के लिए आपको Prometheus मेट्रिक नामों और लेबल नीति की आवश्यकता है
    - आप OpenTelemetry कलेक्टर चलाए बिना मेट्रिक्स चाहते हैं
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin के माध्यम से OpenClaw डायग्नोस्टिक्स को Prometheus टेक्स्ट मेट्रिक्स के रूप में उपलब्ध कराएँ
title: Prometheus मेट्रिक्स
x-i18n:
    generated_at: "2026-07-19T08:52:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9d04a46bdb401df3cdd2571b973f2a60f264862cf74da02c5a9cfa1de6ea9ffe
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw आधिकारिक
`diagnostics-prometheus` Plugin के माध्यम से निदान मेट्रिक्स उपलब्ध करा सकता है। यह विश्वसनीय निदान के साथ-साथ
आंतरिक रूप से टैग किए गए, डिस्पैचर-स्वामित्व वाले निदान इवेंट (कतार, मेमोरी और
सेशन-पुनर्प्राप्ति संकेत) सुनता है और यहाँ Prometheus टेक्स्ट एंडपॉइंट प्रस्तुत करता है:

```text
GET /api/diagnostics/prometheus
```

कंटेंट टाइप `text/plain; version=0.0.4; charset=utf-8`, मानक
Prometheus एक्सपोज़िशन फ़ॉर्मैट है।

<Warning>
यह रूट Gateway प्रमाणीकरण (ऑपरेटर स्कोप, विश्वसनीय-ऑपरेटर सतह) का उपयोग करता है। इसे सार्वजनिक, बिना प्रमाणीकरण वाले `/metrics` एंडपॉइंट के रूप में उपलब्ध न कराएँ। इसे उसी प्रमाणीकरण पथ के माध्यम से स्क्रेप करें जिसका उपयोग आप अन्य ऑपरेटर API के लिए करते हैं।
</Warning>

ट्रेस, लॉग, OTLP पुश और OpenTelemetry GenAI सिमैंटिक एट्रिब्यूट के लिए, [OpenTelemetry निर्यात](/hi/gateway/opentelemetry) देखें।

## त्वरित शुरुआत

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Plugin सक्षम करें">
    <Tabs>
      <Tab title="कॉन्फ़िगरेशन">
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
  <Step title="Gateway पुनः आरंभ करें">
    HTTP रूट Plugin के आरंभ होने पर पंजीकृत होता है, इसलिए इसे सक्षम करने के बाद पुनः लोड करें।
  </Step>
  <Step title="सुरक्षित रूट को स्क्रेप करें">
    वही Gateway प्रमाणीकरण भेजें जिसका उपयोग आपके ऑपरेटर क्लाइंट करते हैं:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus कनेक्ट करें">
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
`diagnostics.enabled` का डिफ़ॉल्ट मान `true` है; इसे केवल अत्यधिक प्रतिबंधित परिवेशों में `false` पर सेट करें। यदि यह `false` है, तो Plugin फिर भी HTTP रूट पंजीकृत करता है, लेकिन कोई निदान इवेंट एक्सपोर्टर में प्रवाहित नहीं होता, इसलिए प्रतिक्रिया खाली रहती है।
</Note>

## निर्यात किए गए मेट्रिक्स

| मेट्रिक                                          | प्रकार    | लेबल                                                                                     |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | काउंटर    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | हिस्टोग्राम | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | काउंटर    | `api`, `error_category`, `model`, `observation_unit`, `outcome`, `provider`, `transport`  |
| `openclaw_model_call_duration_seconds`           | हिस्टोग्राम | `api`, `error_category`, `model`, `observation_unit`, `outcome`, `provider`, `transport`  |
| `openclaw_model_failover_total`                  | काउंटर    | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | काउंटर    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | हिस्टोग्राम | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | काउंटर    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | हिस्टोग्राम | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | काउंटर    | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | काउंटर    | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | हिस्टोग्राम | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | काउंटर    | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | काउंटर    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | हिस्टोग्राम | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | काउंटर    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | काउंटर    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | हिस्टोग्राम | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | काउंटर    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | काउंटर    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | काउंटर    | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | हिस्टोग्राम | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | काउंटर    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | हिस्टोग्राम | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | काउंटर    | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | काउंटर    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | हिस्टोग्राम | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | काउंटर    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | हिस्टोग्राम | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | हिस्टोग्राम | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | गेज       | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | हिस्टोग्राम | `lane`                                                                                    |
| `openclaw_session_state_total`                   | काउंटर    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | गेज       | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | काउंटर    | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | काउंटर    | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | हिस्टोग्राम | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | काउंटर    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | हिस्टोग्राम | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | काउंटर    | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | गेज       | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | हिस्टोग्राम | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | हिस्टोग्राम | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | हिस्टोग्राम | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | हिस्टोग्राम | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | काउंटर    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | हिस्टोग्राम | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | गेज       | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | हिस्टोग्राम | कोई नहीं                                                                                   |
| `openclaw_memory_pressure_total`                 | काउंटर    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | काउंटर    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | काउंटर    | कोई नहीं                                                                                   |
| `openclaw_diagnostic_async_queue_dropped_total`  | काउंटर    | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | गेज       | कोई नहीं                                                                                   |

मॉडल-कॉल मेट्रिक्स के लिए, `observation_unit="request"` एक अवलोकनीय
प्रदाता अनुरोध मापता है। `observation_unit="turn"` एक कृत्रिम Claude Code
या Codex CLI एजेंट टर्न मापता है, जिसमें कई छिपे हुए प्रदाता अनुरोध हो सकते हैं।
विलंबता की तुलना करते समय इन शृंखलाओं को अलग रखें।

## लेबल नीति

<AccordionGroup>
  <Accordion title="सीमित, निम्न-कार्डिनैलिटी वाले लेबल">
    Prometheus लेबल सीमित और निम्न-कार्डिनैलिटी वाले रहते हैं। निर्यातक `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, संदेश ID, चैट ID या प्रदाता अनुरोध ID जैसे अपरिष्कृत नैदानिक पहचानकर्ता उत्सर्जित नहीं करता।

    लेबल मानों को संपादित किया जाता है और उनका OpenClaw की निम्न-कार्डिनैलिटी वर्ण नीति से मेल खाना आवश्यक है। नीति में विफल होने वाले मानों को मेट्रिक के आधार पर `unknown`, `other` या `none` से बदल दिया जाता है। स्कोप किए गए एजेंट सत्र कुंजियों जैसे दिखने वाले लेबल भी `unknown` से बदल दिए जाते हैं।

  </Accordion>
  <Accordion title="शृंखला सीमा और अतिप्रवाह गणना">
    निर्यातक काउंटर, गेज और हिस्टोग्राम को मिलाकर मेमोरी में रखी जाने वाली समय शृंखलाओं की सीमा **2048** शृंखलाओं पर निर्धारित करता है। इस सीमा से आगे की नई शृंखलाएँ छोड़ दी जाती हैं और हर बार `openclaw_prometheus_series_dropped_total` में एक की वृद्धि होती है।

    इस काउंटर को एक पक्के संकेत के रूप में देखें कि अपस्ट्रीम में कोई विशेषता उच्च-कार्डिनैलिटी वाले मान लीक कर रही है। निर्यातक कभी भी सीमा को स्वचालित रूप से नहीं बढ़ाता; यदि यह बढ़ती है, तो सीमा को अक्षम करने के बजाय स्रोत ठीक करें।

  </Accordion>
  <Accordion title="Prometheus आउटपुट में क्या कभी दिखाई नहीं देता">
    - प्रॉम्प्ट टेक्स्ट, प्रतिक्रिया टेक्स्ट, टूल इनपुट, टूल आउटपुट, सिस्टम प्रॉम्प्ट
    - वार्ता प्रतिलिपियाँ, ऑडियो पेलोड, कॉल ID, रूम ID, हैंडऑफ़ टोकन, टर्न ID और अपरिष्कृत सत्र ID
    - अपरिष्कृत प्रदाता अनुरोध ID (जहाँ लागू हो, केवल स्पैन पर सीमित हैश — मेट्रिक्स पर कभी नहीं)
    - सत्र कुंजियाँ और सत्र ID
    - होस्टनाम, फ़ाइल पथ, गुप्त मान

  </Accordion>
</AccordionGroup>

## PromQL विधियाँ

```promql
# प्रति मिनट टोकन, प्रदाता के अनुसार विभाजित
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# पिछले घंटे का व्यय (USD), मॉडल के अनुसार
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# मॉडल रन अवधि का 95वाँ प्रतिशतक
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# कतार प्रतीक्षा समय SLO (95p, 2s से कम)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Skill उपयोग, सीमित स्रोत के अनुसार विभाजित
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# छोड़ी गई Prometheus शृंखलाएँ (कार्डिनैलिटी चेतावनी)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
अलग-अलग प्रदाताओं वाले डैशबोर्ड के लिए `gen_ai_client_token_usage` को प्राथमिकता दें: यह OpenTelemetry GenAI अर्थ-संबंधी परंपराओं का पालन करता है और गैर-OpenClaw GenAI सेवाओं के मेट्रिक्स के अनुरूप है।
</Tip>

## Prometheus और OpenTelemetry निर्यात में से चयन

OpenClaw दोनों इंटरफ़ेस का स्वतंत्र रूप से समर्थन करता है। आप इनमें से किसी एक को, दोनों को या किसी को भी नहीं चला सकते हैं।

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **पुल** मॉडल: Prometheus `/api/diagnostics/prometheus` को स्क्रैप करता है।
    - किसी बाहरी कलेक्टर की आवश्यकता नहीं है।
    - सामान्य Gateway प्रमाणीकरण के माध्यम से प्रमाणित।
    - इंटरफ़ेस केवल मेट्रिक्स के लिए है (कोई ट्रेस या लॉग नहीं)।
    - पहले से Prometheus + Grafana पर मानकीकृत स्टैक के लिए सर्वोत्तम।

  </Tab>
  <Tab title="diagnostics-otel">
    - **पुश** मॉडल: OpenClaw किसी कलेक्टर या OTLP-संगत बैकएंड को OTLP/HTTP भेजता है।
    - इंटरफ़ेस में मेट्रिक्स, ट्रेस और लॉग शामिल हैं।
    - जब आपको दोनों की आवश्यकता हो, तो OpenTelemetry Collector (`prometheus` या `prometheusremotewrite` निर्यातक) के माध्यम से Prometheus से जोड़ता है।
    - पूरी सूची के लिए [OpenTelemetry निर्यात](/hi/gateway/opentelemetry) देखें।

  </Tab>
</Tabs>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="खाली प्रतिक्रिया बॉडी">
    - जाँचें कि कॉन्फ़िगरेशन में `diagnostics.enabled` को `false` पर सेट नहीं किया गया है (इसका डिफ़ॉल्ट `true` है)।
    - पुष्टि करें कि Plugin सक्षम है और `openclaw plugins list --enabled` के साथ लोड किया गया है।
    - कुछ ट्रैफ़िक उत्पन्न करें; काउंटर और हिस्टोग्राम कम-से-कम एक घटना के बाद ही पंक्तियाँ उत्सर्जित करते हैं।

  </Accordion>
  <Accordion title="401 / अनधिकृत">
    एंडपॉइंट के लिए Gateway ऑपरेटर स्कोप (`auth: "gateway"` के साथ `gatewayRuntimeScopeSurface: "trusted-operator"`) आवश्यक है। उसी टोकन या पासवर्ड का उपयोग करें जिसका उपयोग Prometheus किसी अन्य Gateway ऑपरेटर रूट के लिए करता है। कोई सार्वजनिक अप्रमाणित मोड नहीं है।
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` बढ़ रहा है">
    कोई नई विशेषता **2048**-शृंखला सीमा पार कर रही है। अप्रत्याशित रूप से उच्च-कार्डिनैलिटी वाले लेबल के लिए हालिया मेट्रिक्स का निरीक्षण करें और उसे स्रोत पर ठीक करें। निर्यातक जानबूझकर लेबल को चुपचाप दोबारा लिखने के बजाय नई शृंखलाएँ छोड़ देता है।
  </Accordion>
  <Accordion title="पुनः आरंभ करने के बाद Prometheus पुरानी शृंखलाएँ दिखाता है">
    Plugin केवल मेमोरी में स्थिति बनाए रखता है। Gateway पुनः आरंभ होने के बाद काउंटर शून्य पर रीसेट हो जाते हैं और गेज अपने अगले रिपोर्ट किए गए मान से पुनः आरंभ होते हैं। रीसेट को सुव्यवस्थित ढंग से संभालने के लिए PromQL `rate()` और `increase()` का उपयोग करें।
  </Accordion>
</AccordionGroup>

## संबंधित

- [नैदानिक निर्यात](/hi/gateway/diagnostics) — सहायता बंडलों के लिए स्थानीय नैदानिक ZIP
- [स्वास्थ्य और तत्परता](/hi/gateway/health) — `/healthz` और `/readyz` प्रोब
- [लॉगिंग](/hi/logging) — फ़ाइल-आधारित लॉगिंग
- [OpenTelemetry निर्यात](/hi/gateway/opentelemetry) — ट्रेस, मेट्रिक्स और लॉग के लिए OTLP पुश
