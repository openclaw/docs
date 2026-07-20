---
read_when:
    - आप OpenClaw मॉडल उपयोग, संदेश प्रवाह या सत्र मेट्रिक्स को किसी OpenTelemetry कलेक्टर पर भेजना चाहते हैं
    - आप ट्रेस, मेट्रिक्स या लॉग को Grafana, Datadog, Honeycomb, New Relic, Tempo या किसी अन्य OTLP बैकएंड से जोड़ रहे हैं
    - डैशबोर्ड या अलर्ट बनाने के लिए आपको सटीक मेट्रिक नामों, स्पैन नामों या एट्रिब्यूट संरचनाओं की आवश्यकता है
summary: diagnostics-otel Plugin के माध्यम से OpenClaw निदान को OpenTelemetry कलेक्टरों या stdout JSONL में निर्यात करें
title: OpenTelemetry निर्यात
x-i18n:
    generated_at: "2026-07-20T07:12:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ed37f094c6c151379d8e0aaa2633b3ebebdb08b7dcbc9403c4bdeb6e5b8cf76
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw आधिकारिक `diagnostics-otel` Plugin के माध्यम से निदान निर्यात करता है,
जिसमें **OTLP/HTTP (protobuf)** का उपयोग होता है। कंटेनर और सैंडबॉक्स लॉग पाइपलाइनों के लिए
लॉग stdout JSONL के रूप में भी लिखे जा सकते हैं। OTLP/HTTP स्वीकार करने वाला कोई भी
कलेक्टर या बैकएंड बिना कोड परिवर्तन के काम करता है। स्थानीय फ़ाइल लॉग के लिए,
[लॉगिंग](/hi/logging) देखें।

- **निदान इवेंट** संरचित, इन-प्रोसेस रिकॉर्ड हैं, जिन्हें
  Gateway और बंडल किए गए plugins मॉडल रन, संदेश प्रवाह, सत्र, क्यू और
  exec के लिए उत्सर्जित करते हैं।
- **`diagnostics-otel`** उन इवेंट की सदस्यता लेता है और उन्हें
  OTLP/HTTP पर OpenTelemetry **मेट्रिक्स**, **ट्रेस** और **लॉग** के रूप में निर्यात करता है तथा
  लॉग रिकॉर्ड को stdout JSONL पर मिरर कर सकता है।
- **प्रदाता कॉल** को OpenClaw के विश्वसनीय मॉडल-कॉल स्पैन संदर्भ से W3C `traceparent`
  हेडर मिलता है, जब प्रदाता ट्रांसपोर्ट कस्टम हेडर स्वीकार करता है।
  Plugin द्वारा उत्सर्जित ट्रेस संदर्भ प्रसारित नहीं किया जाता।
- निर्यातक केवल तभी संलग्न होते हैं, जब निदान सतह और Plugin दोनों
  सक्षम हों, इसलिए डिफ़ॉल्ट रूप से इन-प्रोसेस लागत लगभग शून्य रहती है।

## त्वरित शुरुआत

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

या CLI से Plugin सक्षम करें: `openclaw plugins enable diagnostics-otel`।

<Note>
`protocol` केवल `http/protobuf` का समर्थन करता है। चूँकि `traces` और `metrics` डिफ़ॉल्ट रूप से सक्षम होते हैं, इसलिए कोई भी अन्य मान (`grpc` सहित) `unsupported protocol` चेतावनी के साथ संपूर्ण diagnostics-otel सदस्यता रोक देता है—इससे stdout लॉग निर्यात भी रुक जाता है। यदि आपको गैर-OTLP प्रोटोकॉल मान के साथ केवल `logsExporter: "stdout"` चाहिए, तो `traces: false` और `metrics: false` को स्पष्ट रूप से सेट करें।
</Note>

## निर्यात किए गए सिग्नल

| सिग्नल      | इसमें क्या शामिल होता है                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **मेट्रिक्स** | टोकन उपयोग, लागत, रन अवधि, फ़ेलओवर, skill उपयोग, संदेश प्रवाह, Talk इवेंट, क्यू लेन, सत्र स्थिति/पुनर्प्राप्ति, टूल निष्पादन, exec, मेमोरी, सक्रियता और निर्यातक की स्थिति के लिए काउंटर/हिस्टोग्राम। |
| **ट्रेस**  | मॉडल उपयोग, मॉडल कॉल, हार्नेस जीवनचक्र, skill उपयोग, टूल निष्पादन, exec, webhook/संदेश प्रसंस्करण, संदर्भ संयोजन और टूल लूप के लिए स्पैन।                                                      |
| **लॉग**    | `diagnostics.otel.logs` सक्षम होने पर OTLP या stdout JSONL पर निर्यात किए गए संरचित `logging.file` रिकॉर्ड; जब तक सामग्री कैप्चर स्पष्ट रूप से सक्षम न हो, लॉग बॉडी रोकी जाती हैं।                          |

`traces`, `metrics` और `logs` को स्वतंत्र रूप से टॉगल करें। `diagnostics.otel.enabled` के true होने पर ट्रेस और मेट्रिक्स
डिफ़ॉल्ट रूप से चालू होते हैं; लॉग डिफ़ॉल्ट रूप से बंद होते हैं
और केवल तभी निर्यात होते हैं, जब `diagnostics.otel.logs` को स्पष्ट रूप से `true` सेट किया गया हो। लॉग निर्यात
डिफ़ॉल्ट रूप से OTLP का उपयोग करता है; stdout पर JSONL के लिए `diagnostics.otel.logsExporter` को `stdout`
पर या दोनों के लिए `both` पर सेट करें।

## कॉन्फ़िगरेशन संदर्भ

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc OTLP निर्यात को अक्षम करता है
      serviceName: "openclaw-gateway", // सेट न होने पर पहले OTEL_SERVICE_NAME, फिर "openclaw" का उपयोग होता है
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | दोनों
      sampleRate: 0.2, // रूट-स्पैन सैंपलर, 0.0..1.0
      flushIntervalMs: 60000, // मेट्रिक निर्यात अंतराल (न्यूनतम 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### पर्यावरण चर

| चर                                                                                                          | उद्देश्य                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | कॉन्फ़िगरेशन कुंजी सेट न होने पर `diagnostics.otel.endpoint` के लिए फ़ॉलबैक।                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | संबंधित `diagnostics.otel.*Endpoint` कॉन्फ़िगरेशन कुंजी सेट न होने पर उपयोग होने वाले सिग्नल-विशिष्ट एंडपॉइंट फ़ॉलबैक। सिग्नल-विशिष्ट कॉन्फ़िगरेशन को सिग्नल-विशिष्ट पर्यावरण चर पर प्राथमिकता मिलती है और सिग्नल-विशिष्ट पर्यावरण चर को साझा एंडपॉइंट पर प्राथमिकता मिलती है।                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | कॉन्फ़िगरेशन कुंजी सेट न होने पर `diagnostics.otel.serviceName` के लिए फ़ॉलबैक। डिफ़ॉल्ट सेवा नाम `openclaw` है।                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | `diagnostics.otel.protocol` सेट न होने पर वायर प्रोटोकॉल के लिए फ़ॉलबैक। केवल `http/protobuf` निर्यात सक्षम करता है।                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | नवीनतम GenAI अनुमान स्पैन संरचना उत्सर्जित करने के लिए इसे `gen_ai_latest_experimental` पर सेट करें: `{gen_ai.operation.name} {gen_ai.request.model}` स्पैन नाम, `CLIENT` स्पैन प्रकार और विरासती `gen_ai.system` के स्थान पर `gen_ai.provider.name`। GenAI मेट्रिक्स हमेशा सीमित, कम-कार्डिनैलिटी विशेषताओं का उपयोग करते हैं। |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | जब किसी अन्य प्रीलोड या होस्ट प्रक्रिया ने पहले ही वैश्विक OpenTelemetry SDK पंजीकृत कर दिया हो, तो इसे `1` पर सेट करें। इसके बाद Plugin अपना NodeSDK जीवनचक्र छोड़ देता है, लेकिन फिर भी निदान लिसनर जोड़ता है और `traces`/`metrics`/`logs` का पालन करता है।                                                                                    |

## गोपनीयता और सामग्री कैप्चर

कच्ची मॉडल/टूल सामग्री डिफ़ॉल्ट रूप से निर्यात **नहीं** की जाती। स्पैन में सीमित
पहचानकर्ता (चैनल, प्रदाता, मॉडल, त्रुटि श्रेणी, केवल-हैश अनुरोध आईडी,
टूल स्रोत, टूल स्वामी, skill नाम/स्रोत) होते हैं और उनमें कभी भी प्रॉम्प्ट टेक्स्ट,
प्रतिक्रिया टेक्स्ट, टूल इनपुट, टूल आउटपुट, skill फ़ाइल पथ या सत्र कुंजियाँ शामिल नहीं होतीं।
स्कोप किए गए एजेंट सत्र कुंजियों जैसे दिखने वाले मानों (उदाहरण के लिए
`agent:` से शुरू होने वाले) को कम-कार्डिनैलिटी विशेषताओं पर `unknown` से बदल दिया जाता है। OTLP लॉग
रिकॉर्ड डिफ़ॉल्ट रूप से गंभीरता, लॉगर, कोड स्थान, विश्वसनीय ट्रेस संदर्भ और
स्वच्छ की गई विशेषताएँ रखते हैं; कच्ची लॉग संदेश बॉडी केवल तभी निर्यात की जाती है,
जब `diagnostics.otel.captureContent` बूलियन `true` हो। सूक्ष्म
`captureContent.*` उपकुंजियाँ लॉग बॉडी को कभी सक्षम नहीं करतीं। Talk मेट्रिक्स केवल
सीमित इवेंट मेटाडेटा (मोड, ट्रांसपोर्ट, प्रदाता, इवेंट प्रकार) निर्यात करते हैं—कोई
प्रतिलेख, ऑडियो पेलोड, सत्र आईडी, टर्न आईडी, कॉल आईडी, रूम आईडी या
हैंडऑफ़ टोकन नहीं।

आउटबाउंड मॉडल अनुरोधों में एक W3C `traceparent` हेडर शामिल हो सकता है, जो केवल
सक्रिय मॉडल कॉल के लिए OpenClaw के स्वामित्व वाले निदान ट्रेस संदर्भ से उत्पन्न होता है।
कॉलर द्वारा पहले से दिए गए `traceparent` हेडर बदल दिए जाते हैं, इसलिए plugins या
कस्टम प्रदाता विकल्प क्रॉस-सर्विस ट्रेस वंशावली की जालसाज़ी नहीं कर सकते।

`diagnostics.otel.captureContent.*` को `true` पर केवल तभी सेट करें, जब आपका कलेक्टर
और अवधारण नीति प्रॉम्प्ट, प्रतिक्रिया, टूल या
सिस्टम-प्रॉम्प्ट टेक्स्ट के लिए अनुमोदित हो। प्रत्येक उपकुंजी स्वतंत्र है:

- `inputMessages` - उपयोगकर्ता प्रॉम्प्ट सामग्री।
- `outputMessages` - मॉडल प्रतिक्रिया सामग्री।
- `toolInputs` - टूल आर्ग्युमेंट पेलोड।
- `toolOutputs` - टूल परिणाम पेलोड।
- `systemPrompt` - संयोजित सिस्टम/डेवलपर प्रॉम्प्ट।
- `toolDefinitions` - मॉडल टूल नाम, विवरण और स्कीमा।

कोई भी उपकुंजी सक्षम होने पर, मॉडल और टूल स्पैन को केवल उस वर्ग के लिए सीमित, संशोधित
`openclaw.content.*` विशेषताएँ मिलती हैं।

<Note>
बूलियन `captureContent: true` `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` और OTLP लॉग बॉडी को एक साथ सक्षम करता है, लेकिन `systemPrompt` को **नहीं**—यदि आपको संयोजित सिस्टम प्रॉम्प्ट भी चाहिए, तो `captureContent.systemPrompt: true` को स्पष्ट रूप से सेट करें।
</Note>

`toolInputs`/`toolOutputs` सामग्री अंतर्निहित एजेंट
रनटाइम के टूल निष्पादनों के लिए कैप्चर की जाती है (पूर्ण/त्रुटि स्पैन पर `openclaw.content.tool_input` और
`gen_ai.tool.call.arguments`;
पूर्ण स्पैन पर `openclaw.content.tool_output` और `gen_ai.tool.call.result`)।
`openclaw.content.*` नाम स्थिर OpenClaw विशेषता नाम बने रहते हैं;
`gen_ai.tool.call.*` प्रतियाँ semconv-मूल व्यूअर के लिए उन्हें प्रतिबिंबित करती हैं।
बाहरी हार्नेस टूल कॉल (Codex, Claude CLI)
सामग्री पेलोड के बिना `tool.execution.*` स्पैन उत्सर्जित करते हैं। कैप्चर की गई सामग्री एक
विश्वसनीय, केवल-लिसनर चैनल पर संचारित होती है और कभी भी सार्वजनिक निदान इवेंट
बस पर नहीं रखी जाती।

## सैंपलिंग और फ़्लशिंग

- **ट्रेस:** `diagnostics.otel.sampleRate` केवल रूट स्पैन पर एक `TraceIdRatioBasedSampler`
  सेट करता है (`0.0` सभी को हटा देता है, `1.0` सभी को बनाए रखता है)। सेट न होने पर
  OpenTelemetry SDK का डिफ़ॉल्ट (हमेशा चालू) उपयोग होता है।
- **मेट्रिक्स:** `diagnostics.otel.flushIntervalMs` (न्यूनतम
  `1000` तक सीमित); सेट न होने पर SDK के आवधिक-निर्यात डिफ़ॉल्ट का उपयोग होता है।
- **लॉग:** OTLP लॉग `logging.level` (फ़ाइल लॉग स्तर) का पालन करते हैं और
  कंसोल फ़ॉर्मेटिंग के बजाय डायग्नोस्टिक लॉग-रिकॉर्ड रिडैक्शन पथ का उपयोग करते हैं। अधिक मात्रा वाले
  इंस्टॉलेशन को स्थानीय सैंपलिंग के बजाय OTLP कलेक्टर सैंपलिंग/फ़िल्टरिंग
  को प्राथमिकता देनी चाहिए। जब आपका प्लेटफ़ॉर्म
  stdout/stderr को पहले से किसी लॉग प्रोसेसर तक भेजता हो और आपके पास कोई OTLP लॉग
  कलेक्टर न हो, तब `diagnostics.otel.logsExporter: "stdout"` सेट करें। Stdout रिकॉर्ड प्रति पंक्ति एक JSON ऑब्जेक्ट होते हैं, जिनमें `ts`, `signal`,
  `service.name`, गंभीरता, मुख्य भाग, रिडैक्ट किए गए एट्रिब्यूट और उपलब्ध होने पर विश्वसनीय ट्रेस
  फ़ील्ड होते हैं।
- **फ़ाइल-लॉग सहसंबंध:** जब लॉग कॉल में मान्य
  डायग्नोस्टिक ट्रेस संदर्भ होता है, तो JSONL फ़ाइल लॉग में शीर्ष-स्तरीय `traceId`,
  `spanId`, `parentSpanId` और `traceFlags` शामिल होते हैं, जिससे लॉग प्रोसेसर स्थानीय लॉग पंक्तियों को
  निर्यात किए गए स्पैन से जोड़ सकते हैं।
- **अनुरोध सहसंबंध:** Gateway HTTP अनुरोध और WebSocket फ़्रेम
  एक आंतरिक अनुरोध ट्रेस स्कोप बनाते हैं। उस
  स्कोप के भीतर के लॉग और डायग्नोस्टिक इवेंट डिफ़ॉल्ट रूप से अनुरोध ट्रेस को इनहेरिट करते हैं, जबकि एजेंट रन और मॉडल-कॉल
  स्पैन चाइल्ड के रूप में बनाए जाते हैं, ताकि प्रदाता के `traceparent` हेडर उसी
  ट्रेस पर रहें।
- **मॉडल-कॉल सहसंबंध:** `openclaw.model.call` स्पैन में डिफ़ॉल्ट रूप से सुरक्षित प्रॉम्प्ट
  घटक आकार और, प्रदाता परिणाम द्वारा उपयोग उपलब्ध कराने पर, प्रत्येक कॉल के टोकन एट्रिब्यूट शामिल होते हैं। `openclaw.model.usage` कुल लागत, संदर्भ और चैनल डैशबोर्ड के लिए रन-स्तरीय
  लेखांकन स्पैन बना रहता है और उत्सर्जन करने वाले रनटाइम के पास विश्वसनीय
  ट्रेस संदर्भ होने पर उसी डायग्नोस्टिक ट्रेस पर रहता है।

### मॉडल-कॉल अवलोकन इकाइयाँ

हर `openclaw.model.call` स्पैन `openclaw.model_call.observation_unit` के माध्यम से यह पहचानता है कि उसका जीवनचक्र क्या मापता है:

- `request` - एक अवलोकनीय मॉडल/प्रदाता अनुरोध। नेटिव एम्बेडेड मॉडल
  कॉल इस इकाई का उपयोग करते हैं और पुराने या बाहरी उत्सर्जकों के साथ
  संगतता के लिए निर्यातक अनुपस्थित मान को `request` मानते हैं।
- `turn` - एक अपारदर्शी एजेंट CLI टर्न, जिसमें छिपे हुए मॉडल अनुरोध,
  पुनः प्रयास, टूल कार्य या बैकग्राउंड कार्य हो सकते हैं। Claude Code CLI और Codex ऐप-सर्वर
  कॉल इस इकाई का उपयोग करते हैं।

दोनों इकाइयाँ मॉडल-कॉल स्पैन बनी रहती हैं, ताकि ट्रेस बैकएंड मॉडल इनपुट,
आउटपुट, उपयोग और पदानुक्रम रेंडर कर सकें। अनुरोध स्पैन API से प्राप्त GenAI ऑपरेशन
(`chat`, `generate_content` या `text_completion`) का उपयोग करते हैं, जबकि टर्न स्पैन
`gen_ai.operation.name = invoke_agent` का उपयोग करते हैं। दोनों
`gen_ai.client.operation.duration` में योगदान करते हैं, जहाँ ऑपरेशन नाम प्रत्यक्ष
अनुरोध विलंबता को पूरे टर्न की विलंबता से अलग रखता है। OpenClaw के OTEL मॉडल-कॉल
मेट्रिक्स में `openclaw.model_call.observation_unit` भी शामिल है; Prometheus
मॉडल-कॉल मेट्रिक्स समतुल्य `observation_unit` लेबल उपलब्ध कराते हैं।

### Claude Code CLI मॉडल-कॉल की निष्ठा

Claude Code CLI टर्न एक सिंथेटिक, टर्न-स्तरीय `openclaw.model.call`
स्पैन उत्सर्जित करते हैं। ये Anthropic HTTP अनुरोध स्पैन नहीं हैं। ये `openclaw.api =
claude-code`, `openclaw.model_call.observation_unit = turn` का उपयोग करते हैं और
ऑपरेशन को `gen_ai.operation.name = invoke_agent` के रूप में पहचानते हैं। ये
`openclaw.transport` के माध्यम से OpenClaw की CLI सीमा की पहचान करते हैं:

- `stdio` - एक बार चलने वाली स्थानीय Claude Code प्रक्रिया।
- `stdio-live` - प्रबंधित स्थायी Claude stdio सत्र पर एक टर्न।
- `paired-node-cli` - युग्मित
  Node को सौंपा गया एक बार चलने वाला Claude Code निष्पादन।

Claude CLI डायग्नोस्टिक्स केवल तभी इंस्टैंशिएट किए जाते हैं, जब प्रक्रिया डायग्नोस्टिक
डिस्पैचर सक्षम हो और कोई आंतरिक या विश्वसनीय इवेंट लिसनर संलग्न हो।
कोई ऑब्ज़र्वेबिलिटी Plugin या अन्य लिसनर सक्रिय न होने पर Claude CLI टर्न
सिंथेटिक ट्रेस पदानुक्रम, सामग्री बफ़र और डायग्नोस्टिक स्ट्रीम-बाइट
लेखांकन को छोड़ देते हैं। सामग्री कैप्चर सक्षम होने पर प्रॉम्प्ट और सिस्टम-प्रॉम्प्ट फ़ील्ड
प्रत्येक 128 KiB तक सीमित होते हैं; असिस्टेंट आउटपुट अधिकतम 200 एनवेलप में कुल 128 KiB तक
सीमित होता है, जिसमें अंतिम दृश्यमान फ़ॉलबैक
प्रतिक्रिया के लिए 16 KiB और एक आइटम आरक्षित होता है। सीमा पूरी होने पर एक मार्कर ट्रंकेशन दर्ज करता है।

OpenClaw, Claude CLI टर्न को वही स्वामित्व पदानुक्रम देता है जिसका उपयोग अन्य
एजेंट रनटाइम करते हैं: `openclaw.harness.run` (`openclaw.harness.id = claude-cli`)
में `openclaw.run` होता है, जिसमें Claude `openclaw.model.call`
स्पैन होता है। हार्नेस और रन स्पैन सिंथेटिक OpenClaw टर्न सीमाएँ हैं, न कि
Claude Code के आंतरिक चरण। एक बार चलने वाले और प्रबंधित stdio टर्न समान
पदानुक्रम का उपयोग करते हैं; वास्तविक नए-सत्र का पुनः प्रयास उसी OpenClaw रन के भीतर
एक और मॉडल-कॉल चाइल्ड बनाता है।

स्पैन तब शुरू होता है, जब OpenClaw तैयार CLI टर्न को स्वीकार करता है और केवल
उस टर्न के सफल या विफल होने के बाद समाप्त होता है। प्रबंधित सत्रों के लिए, जब Claude परिणाम को रोके रखने वाले बैकग्राउंड एजेंट या
वर्कफ़्लो की सूचना देता है, तब अंतरिम सफल परिणाम स्पैन समाप्त नहीं करता;
ड्रेन के बाद का अंतिम परिणाम ऐसा करता है। निरस्तीकरण, टाइमआउट, प्रक्रिया विफलता,
आउटपुट/पार्स विफलता और अन्य टर्न विफलताएँ उसी स्पैन को त्रुटि के साथ समाप्त करती हैं।

Claude Code प्रत्येक असिस्टेंट-संदेश का उपयोग रिपोर्ट करता है और अपने अंतिम परिणाम में संचयी
उपयोग भी रिपोर्ट कर सकता है। OpenClaw का उत्तर लेखांकन अंतिम
असिस्टेंट संदेश का उपयोग जारी रखता है, ताकि मौजूदा लागत अर्थविज्ञान न बदले;
टर्न-स्तरीय मॉडल-कॉल स्पैन उपलब्ध होने पर टर्मिनल संचयी उपयोग का इस्तेमाल करता है,
जिसमें कैश-पठन और कैश-निर्माण टोकन शामिल हैं।

इन CLI स्पैन के लिए, बाइट और समय फ़ील्ड अवलोकनीय OpenClaw
CLI सीमा का वर्णन करते हैं:

- `openclaw.model_call.request_bytes` एक बार चलने वाले stdin/argv पर भेजे गए
  प्रॉम्प्ट मान या प्रबंधित stdio JSONL उपयोगकर्ता एनवेलप का UTF-8 आकार है। यह
  Claude Code के छिपे हुए मॉडल अनुरोध का आकार नहीं है।
- `openclaw.model_call.response_bytes` टर्न के दौरान देखे गए Claude CLI stdout
  का UTF-8 आकार है। यह Anthropic HTTP प्रतिक्रिया का आकार नहीं है।
- `openclaw.model_call.time_to_first_byte_ms` पहले अवलोकनीय
  Claude CLI stdout या stderr आउटपुट तक का समय है। यह नेटवर्क TTFB नहीं है।

मेल खाते विस्तृत `captureContent` फ़ील्ड सक्षम होने पर स्पैन,
OpenClaw द्वारा Claude Code को भेजा गया प्रभावी प्रॉम्प्ट, OpenClaw का जोड़ा गया सिस्टम
प्रॉम्प्ट और दृश्यमान असिस्टेंट टेक्स्ट/रीज़निंग/टूल-कॉल पहचान
`gen_ai.input.messages`, `gen_ai.output.messages` और
`gen_ai.system_instructions` के माध्यम से निर्यात करता है। टूल आर्ग्युमेंट, अपारदर्शी थिंकिंग सिग्नेचर और
टूल परिणाम Claude असिस्टेंट एनवेलप से हटा दिए जाते हैं। OpenClaw
Claude Code के निजी सिस्टम प्रॉम्प्ट, छिपे हुए पुनः आरंभ या
Compaction किए गए अनुरोध पेलोड, नेटिव आंतरिक टूल स्कीमा, कच्चे Anthropic HTTP
अनुरोध, आंतरिक पुनः प्रयास, अपस्ट्रीम अनुरोध आईडी या वास्तविक नेटवर्क TTFB तक पहुँच का
दावा नहीं करता। चूँकि Claude Code अपनी प्रभावी नेटिव टूल परिभाषाएँ सटीक रूप से उपलब्ध नहीं कराता,
ये स्पैन `gen_ai.tool.definitions` को पॉप्युलेट नहीं करते।

सामग्री कैप्चर सक्षम होने पर भी बाहरी Claude हार्नेस टूल स्पैन केवल मेटाडेटा वाले
रहते हैं। प्रत्येक मॉडल स्पैन की तरह, कैप्चर की गई Claude CLI सामग्री
केवल विश्वसनीय लिसनर वाले पथ और निर्यातक की मौजूदा रिडैक्शन तथा आकार
सीमाओं का उपयोग करती है; सामग्री डिफ़ॉल्ट रूप से बंद रहती है।

## निर्यात किए गए मेट्रिक्स

### मॉडल उपयोग

- `openclaw.tokens` (काउंटर, एट्रिब्यूट: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (काउंटर, एट्रिब्यूट: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (हिस्टोग्राम, एट्रिब्यूट: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (हिस्टोग्राम, एट्रिब्यूट: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (हिस्टोग्राम, GenAI सिमैंटिक-कन्वेंशन मेट्रिक, एट्रिब्यूट: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (हिस्टोग्राम, सेकंड, मॉडल अनुरोधों और सिंथेटिक एजेंट टर्न के लिए GenAI सिमैंटिक-कन्वेंशन मेट्रिक; एट्रिब्यूट: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, वैकल्पिक `error.type`; टर्न अवलोकन `gen_ai.operation.name = invoke_agent` का उपयोग करते हैं)
- `openclaw.model_call.duration_ms` (हिस्टोग्राम, एट्रिब्यूट: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit`, साथ ही वर्गीकृत त्रुटियों पर `openclaw.errorCategory` और `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (हिस्टोग्राम, अंतिम मॉडल अनुरोध पेलोड का UTF-8 बाइट आकार; Claude Code CLI के लिए ऊपर वर्णित अवलोकनीय प्रॉम्प्ट इनपुट/एनवेलप; कोई कच्ची पेलोड सामग्री नहीं)
- `openclaw.model_call.response_bytes` (हिस्टोग्राम, स्ट्रीम किए गए प्रतिक्रिया चंक पेलोड का UTF-8 बाइट आकार; उच्च-आवृत्ति टेक्स्ट, थिंकिंग और टूल-कॉल डेल्टा केवल वृद्धिशील `delta` बाइट गिनते हैं; Claude Code CLI के लिए देखे गए stdout बाइट; कोई कच्ची प्रतिक्रिया सामग्री नहीं)
- `openclaw.model_call.time_to_first_byte_ms` (हिस्टोग्राम, पहले स्ट्रीम किए गए प्रतिक्रिया इवेंट से पहले बीता समय; Claude Code CLI के लिए नेटवर्क TTFB के बजाय पहला अवलोकनीय CLI आउटपुट)
- `openclaw.model.failover` (काउंटर, एट्रिब्यूट: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (काउंटर, एट्रिब्यूट: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, वैकल्पिक `openclaw.agent`, वैकल्पिक `openclaw.toolName`)

### संदेश प्रवाह

- `openclaw.webhook.received` (काउंटर, एट्रिब्यूट: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (काउंटर, एट्रिब्यूट: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (हिस्टोग्राम, एट्रिब्यूट: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (काउंटर, एट्रिब्यूट: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (काउंटर, एट्रिब्यूट: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (काउंटर, एट्रिब्यूट: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (काउंटर, एट्रिब्यूट: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (हिस्टोग्राम, एट्रिब्यूट: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (काउंटर, एट्रिब्यूट: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (हिस्टोग्राम, एट्रिब्यूट: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (काउंटर, एट्रिब्यूट: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (हिस्टोग्राम, एट्रिब्यूट: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### बातचीत

- `openclaw.talk.event` (काउंटर, एट्रिब्यूट: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (हिस्टोग्राम, एट्रिब्यूट: `openclaw.talk.event` के समान; जब कोई बातचीत इवेंट अवधि रिपोर्ट करता है, तब उत्सर्जित)
- `openclaw.talk.audio.bytes` (हिस्टोग्राम, एट्रिब्यूट: `openclaw.talk.event` के समान; बाइट लंबाई रिपोर्ट करने वाले बातचीत ऑडियो फ़्रेम इवेंट के लिए उत्सर्जित)

### कतारें और सत्र

- `openclaw.queue.lane.enqueue` (काउंटर, विशेषताएँ: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (काउंटर, विशेषताएँ: `openclaw.lane`)
- `openclaw.queue.depth` (हिस्टोग्राम, विशेषताएँ: `openclaw.lane` या `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (हिस्टोग्राम, विशेषताएँ: `openclaw.lane`)
- `openclaw.session.state` (काउंटर, विशेषताएँ: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (काउंटर, विशेषताएँ: `openclaw.state`; पुनर्प्राप्ति योग्य पुराने सत्र लेखांकन के लिए उत्सर्जित)
- `openclaw.session.stuck_age_ms` (हिस्टोग्राम, विशेषताएँ: `openclaw.state`; पुनर्प्राप्ति योग्य पुराने सत्र लेखांकन के लिए उत्सर्जित)
- `openclaw.session.turn.created` (काउंटर, विशेषताएँ: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (काउंटर, विशेषताएँ: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (काउंटर, विशेषताएँ: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (हिस्टोग्राम, विशेषताएँ: संगत पुनर्प्राप्ति काउंटर के समान)
- `openclaw.run.attempt` (काउंटर, विशेषताएँ: `openclaw.attempt`)

### सत्र सक्रियता टेलीमेट्री

जब OpenClaw उत्तर, टूल, स्थिति, ब्लॉक या ACP रनटाइम की प्रगति देखता है, तब कोई `processing` सत्र अंतर्निहित सक्रियता सीमा की ओर पुराना नहीं होता। टाइपिंग कीपअलाइव को प्रगति नहीं माना जाता, इसलिए मौन मॉडल या हार्नेस का फिर भी पता लगाया जा सकता है।

OpenClaw सत्रों को उस कार्य के आधार पर वर्गीकृत करता है जिसे वह अभी भी देख सकता है:

- `session.long_running`: सक्रिय एम्बेडेड कार्य, मॉडल कॉल या टूल कॉल
  अभी भी प्रगति कर रहे हैं। स्वामित्व वाली मौन मॉडल कॉल भी अंतर्निहित निरस्तीकरण सीमा से पहले लंबे समय से चल रही के रूप में रिपोर्ट होती हैं, इसलिए धीमे या गैर-स्ट्रीमिंग मॉडल प्रदाता निरस्तीकरण-प्रेक्षणीय रहते हुए रुके हुए Gateway सत्रों जैसे नहीं दिखते।
- `session.stalled`: सक्रिय कार्य मौजूद है, लेकिन सक्रिय रन ने
  हाल की प्रगति रिपोर्ट नहीं की है। स्वामित्व वाली मॉडल कॉल अंतर्निहित निरस्तीकरण सीमा पर या उसके बाद `session.long_running` से
  `session.stalled` पर बदल जाती हैं; स्वामी-विहीन
  पुरानी मॉडल/टूल गतिविधि को हानिरहित लंबे समय से चल रहा कार्य नहीं माना जाता।
  रुके हुए एम्बेडेड रन प्रारंभ में केवल-प्रेक्षण स्थिति में रहते हैं, फिर
  बिना प्रगति के निरस्तीकरण सीमा के बाद निरस्त-निकासी करते हैं, ताकि लेन में उनके पीछे की कतारबद्ध टर्न फिर से शुरू हो सकें।
- `session.stuck`: बिना सक्रिय कार्य वाला पुराना सत्र लेखांकन, या पुरानी
  स्वामी-विहीन मॉडल/टूल गतिविधि वाला निष्क्रिय कतारबद्ध सत्र। पुनर्प्राप्ति गेट पास होने के तुरंत बाद यह
  प्रभावित सत्र लेन को मुक्त कर देता है।

पुनर्प्राप्ति संरचित `session.recovery.requested` और
`session.recovery.completed` इवेंट उत्सर्जित करती है। डायग्नोस्टिक सत्र स्थिति को निष्क्रिय
केवल परिवर्तनकारी पुनर्प्राप्ति परिणाम (`aborted` या `released`) के बाद और केवल तभी चिह्नित किया जाता है
जब वही प्रोसेसिंग जनरेशन अभी भी वर्तमान हो।

केवल `session.stuck`, `openclaw.session.stuck` काउंटर,
`openclaw.session.stuck_age_ms` हिस्टोग्राम और `openclaw.session.stuck`
स्पैन उत्सर्जित करता है। सत्र के अपरिवर्तित रहने पर दोहराए गए `session.stuck` डायग्नोस्टिक्स का अंतराल बढ़ता जाता है, इसलिए डैशबोर्ड को
प्रत्येक Heartbeat टिक के बजाय निरंतर वृद्धि पर अलर्ट करना चाहिए। कॉन्फ़िगरेशन विकल्प और डिफ़ॉल्ट के लिए,
[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference#diagnostics) देखें।

सक्रियता चेतावनियाँ ये भी उत्सर्जित करती हैं:

- `openclaw.liveness.warning` (काउंटर, विशेषताएँ: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (हिस्टोग्राम, विशेषताएँ: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (हिस्टोग्राम, विशेषताएँ: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (हिस्टोग्राम, विशेषताएँ: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (हिस्टोग्राम, विशेषताएँ: `openclaw.liveness.reason`)

### हार्नेस जीवनचक्र

- `openclaw.harness.duration_ms` (हिस्टोग्राम, विशेषताएँ: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, त्रुटियों पर `openclaw.harness.phase`)

### टूल निष्पादन और लूप पहचान

- `openclaw.tool.execution.duration_ms` (हिस्टोग्राम, विशेषताएँ: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, साथ ही त्रुटियों पर `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked` (काउंटर, विशेषताएँ: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (काउंटर, विशेषताएँ: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, वैकल्पिक `openclaw.loop.paired_tool`; दोहराव वाले टूल-कॉल लूप का पता लगने पर उत्सर्जित)

### Exec

- `openclaw.exec.duration_ms` (हिस्टोग्राम, विशेषताएँ: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### डायग्नोस्टिक्स के आंतरिक घटक (मेमोरी, पेलोड, एक्सपोर्टर स्वास्थ्य)

- `openclaw.payload.large` (काउंटर, विशेषताएँ: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (हिस्टोग्राम, विशेषताएँ: `openclaw.payload.large` के समान)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (हिस्टोग्राम, कोई विशेषता नहीं; प्रक्रिया मेमोरी नमूने)
- `openclaw.memory.pressure` (काउंटर, विशेषताएँ: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (काउंटर, विशेषताएँ: `openclaw.diagnostic.async_queue.drop_class`; आंतरिक डायग्नोस्टिक-कतार बैकप्रेशर के कारण ड्रॉप)
- `openclaw.telemetry.exporter.events` (काउंटर, विशेषताएँ: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, वैकल्पिक `openclaw.reason`, वैकल्पिक `openclaw.errorCategory`; एक्सपोर्टर जीवनचक्र/विफलता स्व-टेलीमेट्री)

## निर्यात किए गए स्पैन

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (इनपुट/आउटपुट/cache_read/cache_write/कुल)
  - डिफ़ॉल्ट रूप से `gen_ai.system`, या नवीनतम GenAI सिमेंटिक कन्वेंशन अपनाए जाने पर `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - डिफ़ॉल्ट रूप से `gen_ai.system`, या नवीनतम GenAI सिमेंटिक कन्वेंशन अपनाए जाने पर `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit` (`request` या `turn`)
  - `openclaw.errorCategory`, `error.type`, और त्रुटियों पर वैकल्पिक `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (केवल सुरक्षित घटक आकार, कोई प्रॉम्प्ट टेक्स्ट नहीं)
  - जब परिणाम में उस अनुरोध या समेकित टर्न का उपयोग शामिल हो, तब `openclaw.model_call.usage.*` और `gen_ai.usage.*`
  - जब अपस्ट्रीम प्रदाता परिणाम अनुरोध आईडी उपलब्ध कराता है, तब विशेषता `openclaw.upstreamRequestIdHash` (सीमित, हैश-आधारित) वाला स्पैन इवेंट `openclaw.provider.request`; अपरिष्कृत आईडी कभी निर्यात नहीं की जातीं
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` के साथ, अनुरोध स्पैन नवीनतम GenAI इन्फ़रेंस स्पैन नाम `{gen_ai.operation.name} {gen_ai.request.model}` का उपयोग करते हैं। टर्न स्पैन `invoke_agent` का उपयोग करते हैं क्योंकि OpenClaw अपारदर्शी CLI सीमा से किसी मूल एजेंट नाम का दावा नहीं करता। दोनों `openclaw.model.call` के बजाय `CLIENT` स्पैन प्रकार का उपयोग करते हैं।
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - पूर्ण होने पर: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - त्रुटि पर: `openclaw.harness.phase`, `openclaw.errorCategory`, वैकल्पिक `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, वैकल्पिक `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - त्रुटियों पर वैकल्पिक `openclaw.errorCategory`/`openclaw.errorCode`, नीति या सैंडबॉक्स द्वारा अस्वीकृत होने पर `openclaw.deniedReason` और `openclaw.outcome=blocked`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (कोई प्रॉम्प्ट, इतिहास, प्रतिक्रिया या सत्र-कुंजी सामग्री नहीं)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, वैकल्पिक `openclaw.loop.paired_tool` (कोई लूप संदेश, पैरामीटर या टूल आउटपुट नहीं)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, वैकल्पिक `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

जब सामग्री कैप्चर स्पष्ट रूप से सक्षम हो, तो मॉडल और टूल स्पैन उन विशिष्ट
सामग्री वर्गों के लिए सीमित, संपादित `openclaw.content.*` विशेषताएँ भी
शामिल कर सकते हैं जिन्हें आपने चुना है।

## डायग्नोस्टिक इवेंट कैटलॉग

नीचे दिए गए इवेंट ऊपर के मेट्रिक्स और स्पैन का आधार हैं या सीधे
Plugin सदस्यता के लिए उपलब्ध हैं। `run.progress` और `run.execution_phase` केवल-प्रत्यक्ष
जीवनचक्र संकेत हैं; diagnostics-otel Plugin उन्हें
स्वतंत्र OTLP संकेतों के रूप में निर्यात नहीं करता। इवेंट प्रकार और `run.execution_phase.phase` मान
योगात्मक हैं। TypeScript उपभोक्ताओं को यह मानने के बजाय डिफ़ॉल्ट शाखाएँ बनाए रखनी चाहिए कि
इनमें से कोई भी यूनियन स्थायी रूप से संपूर्ण है।

**मॉडल उपयोग**

- `model.usage` - टोकन, लागत, अवधि, संदर्भ, प्रदाता/मॉडल/चैनल,
  सत्र आईडी। `usage` लागत और टेलीमेट्री के लिए प्रदाता/टर्न लेखांकन है;
  `context.used` वर्तमान प्रॉम्प्ट/संदर्भ स्नैपशॉट है और कैश किए गए इनपुट या टूल-लूप कॉल शामिल होने पर
  प्रदाता `usage.total` से कम हो सकता है।

**संदेश प्रवाह**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**कतार और सत्र**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `run.execution_phase` (सार्वजनिक, सत्र-सहसंबद्ध एम्बेडेड-रनर स्टार्टअप माइलस्टोन)
- `diagnostic.heartbeat` (समेकित काउंटर: Webhook/कतार/सत्र)

**हार्नेस जीवनचक्र**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  एजेंट हार्नेस के लिए प्रति-रन जीवनचक्र। इसमें `harnessId`, वैकल्पिक
  `pluginId`, प्रदाता/मॉडल/चैनल और रन आईडी शामिल हैं। पूर्णता पर
  `durationMs`, `outcome`, वैकल्पिक `resultClassification`, `yieldDetected`,
  और `itemLifecycle` गणनाएँ जोड़ी जाती हैं। त्रुटियों पर `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, और
  वैकल्पिक `cleanupFailed` जोड़े जाते हैं।

**Exec**

- `exec.process.completed` - टर्मिनल परिणाम, अवधि, लक्ष्य, मोड, एग्ज़िट
  कोड और विफलता का प्रकार। कमांड टेक्स्ट और कार्यशील डायरेक्टरियाँ
  शामिल नहीं हैं।
- `exec.approval.followup_suppressed` - सत्र के पुनः बाइंड होने के बाद पुराना अनुमोदन फ़ॉलो-अप
  हटा दिया गया। इसमें `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` या `gateway_preflight`),
  और डिस्पैचर टाइमस्टैम्प शामिल हैं। सत्र कुंजियाँ, रूट और कमांड टेक्स्ट
  शामिल नहीं हैं।

## एक्सपोर्टर के बिना

`diagnostics-otel` चलाए बिना डायग्नोस्टिक्स इवेंट को plugins या कस्टम सिंक के लिए
उपलब्ध रखें:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` बढ़ाए बिना लक्षित डीबग आउटपुट के लिए डायग्नोस्टिक्स
फ़्लैग का उपयोग करें। फ़्लैग केस-असंवेदी होते हैं और वाइल्डकार्ड (`telegram.*` या
`*`) का समर्थन करते हैं:

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

या एकबारगी env ओवरराइड के रूप में:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

फ़्लैग आउटपुट मानक लॉग फ़ाइल (`logging.file`) में जाता है और अब भी
`logging.redactSensitive` द्वारा संशोधित किया जाता है। पूरी मार्गदर्शिका:
[डायग्नोस्टिक्स फ़्लैग](/hi/diagnostics/flags)।

## अक्षम करें

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

या `plugins.allow` से `diagnostics-otel` को बाहर रखें, अथवा
`openclaw plugins disable diagnostics-otel` चलाएँ।

## संबंधित

- [लॉगिंग](/hi/logging) - फ़ाइल लॉग, कंसोल आउटपुट, CLI टेलिंग और Control UI का Logs टैब
- [Gateway लॉगिंग की आंतरिक कार्यप्रणाली](/hi/gateway/logging) - WS लॉग शैलियाँ, सबसिस्टम प्रीफ़िक्स और कंसोल कैप्चर
- [डायग्नोस्टिक्स फ़्लैग](/hi/diagnostics/flags) - लक्षित डीबग-लॉग फ़्लैग
- [डायग्नोस्टिक्स एक्सपोर्ट](/hi/gateway/diagnostics) - ऑपरेटर सहायता-बंडल टूल (OTEL एक्सपोर्ट से अलग)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference#diagnostics) - संपूर्ण `diagnostics.*` फ़ील्ड संदर्भ
