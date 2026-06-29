---
permalink: /security/formal-verification/
read_when:
    - औपचारिक सुरक्षा मॉडल की गारंटियों या सीमाओं की समीक्षा करना
    - TLA+/TLC सुरक्षा मॉडल जाँचों को पुनरुत्पादित या अपडेट करना
summary: OpenClaw के सबसे अधिक जोखिम वाले पथों के लिए मशीन-जाँचे गए सुरक्षा मॉडल।
title: औपचारिक सत्यापन (सुरक्षा मॉडल)
x-i18n:
    generated_at: "2026-06-29T00:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

यह पृष्ठ OpenClaw के **औपचारिक सुरक्षा मॉडल** को ट्रैक करता है (आज TLA+/TLC; आवश्यकता अनुसार और भी)।

> नोट: कुछ पुराने लिंक पिछले प्रोजेक्ट नाम का संदर्भ दे सकते हैं।

**लक्ष्य (मुख्य दिशा):** स्पष्ट मान्यताओं के अंतर्गत यह मशीन-जाँचा तर्क देना कि OpenClaw अपनी
अभिप्रेत सुरक्षा नीति (प्राधिकरण, सत्र पृथक्करण, टूल गेटिंग, और
गलत कॉन्फिगरेशन से सुरक्षा) लागू करता है।

**यह क्या है (आज):** एक निष्पादन योग्य, हमलावर-चालित **सुरक्षा रिग्रेशन सूट**:

- प्रत्येक दावे में सीमित अवस्था-स्थान पर चलाने योग्य मॉडल-जाँच है।
- कई दावों के साथ एक युग्मित **नकारात्मक मॉडल** है, जो यथार्थवादी बग वर्ग के लिए प्रति-उदाहरण ट्रेस उत्पन्न करता है।

**यह क्या नहीं है (अभी):** यह प्रमाण नहीं कि "OpenClaw हर दृष्टि से सुरक्षित है" या कि पूरा TypeScript कार्यान्वयन सही है।

## मॉडल कहाँ रहते हैं

मॉडल एक अलग रेपो में रखे जाते हैं: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)।

## महत्वपूर्ण सावधानियाँ

- ये **मॉडल** हैं, पूरा TypeScript कार्यान्वयन नहीं। मॉडल और कोड के बीच विचलन संभव है।
- परिणाम TLC द्वारा खोजे गए अवस्था-स्थान तक सीमित हैं; "हरा" मॉडल की गई मान्यताओं और सीमाओं से परे सुरक्षा का संकेत नहीं देता।
- कुछ दावे स्पष्ट परिवेशीय मान्यताओं पर निर्भर करते हैं (जैसे, सही डिप्लॉयमेंट, सही कॉन्फिगरेशन इनपुट)।

## परिणाम दोहराना

आज, परिणाम स्थानीय रूप से मॉडल रेपो क्लोन करके और TLC चलाकर दोहराए जाते हैं (नीचे देखें)। भविष्य का संस्करण यह दे सकता है:

- सार्वजनिक आर्टिफैक्ट्स (प्रति-उदाहरण ट्रेस, रन लॉग) के साथ CI-चलित मॉडल
- छोटे, सीमित चेक के लिए होस्ट किया गया "यह मॉडल चलाएँ" वर्कफ़्लो

शुरू करना:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Gateway एक्सपोज़र और खुले Gateway का गलत कॉन्फिगरेशन

**दावा:** प्रमाणीकरण के बिना loopback से आगे bind करने से दूरस्थ समझौता संभव हो सकता है / एक्सपोज़र बढ़ता है; token/password अनधिकृत हमलावरों को रोकते हैं (मॉडल की मान्यताओं के अनुसार)।

- सफल रन:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- असफल (अपेक्षित):
  - `make gateway-exposure-v2-negative`

यह भी देखें: मॉडल रेपो में `docs/gateway-exposure-matrix.md`।

### Node exec पाइपलाइन (सबसे अधिक जोखिम वाली क्षमता)

**दावा:** `exec host=node` के लिए (a) node कमांड allowlist और घोषित कमांड, तथा (b) कॉन्फिगर किए जाने पर लाइव अनुमोदन आवश्यक है; अनुमोदनों को replay रोकने के लिए tokenized किया जाता है (मॉडल में)।

- सफल रन:
  - `make nodes-pipeline`
  - `make approvals-token`
- असफल (अपेक्षित):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### पेयरिंग स्टोर (DM गेटिंग)

**दावा:** पेयरिंग अनुरोध TTL और लंबित-अनुरोध सीमा का सम्मान करते हैं।

- सफल रन:
  - `make pairing`
  - `make pairing-cap`
- असफल (अपेक्षित):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Ingress गेटिंग (mentions + control-command bypass)

**दावा:** mention की आवश्यकता वाले समूह संदर्भों में, अनधिकृत "control command" mention गेटिंग को bypass नहीं कर सकता।

- सफल:
  - `make ingress-gating`
- असफल (अपेक्षित):
  - `make ingress-gating-negative`

### रूटिंग/सत्र-कुंजी पृथक्करण

**दावा:** अलग-अलग peers से आने वाले DMs उसी सत्र में collapse नहीं होते, जब तक कि उन्हें स्पष्ट रूप से linked/configured न किया गया हो।

- सफल:
  - `make routing-isolation`
- असफल (अपेक्षित):
  - `make routing-isolation-negative`

## v1++: अतिरिक्त सीमित मॉडल (concurrency, retries, trace correctness)

ये follow-on मॉडल हैं, जो वास्तविक दुनिया के failure modes (non-atomic updates, retries, और message fan-out) के आसपास fidelity को कसते हैं।

### पेयरिंग स्टोर concurrency / idempotency

**दावा:** पेयरिंग स्टोर को interleavings के तहत भी `MaxPending` और idempotency लागू करनी चाहिए (अर्थात, "check-then-write" atomic / locked होना चाहिए; refresh से duplicates नहीं बनने चाहिए)।

इसका अर्थ:

- concurrent requests के तहत, आप किसी channel के लिए `MaxPending` से अधिक नहीं जा सकते।
- उसी `(channel, sender)` के लिए repeated requests/refreshes से duplicate live pending rows नहीं बनने चाहिए।

- सफल रन:
  - `make pairing-race` (atomic/locked cap check)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- असफल (अपेक्षित):
  - `make pairing-race-negative` (non-atomic begin/commit cap race)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Ingress trace correlation / idempotency

**दावा:** ingestion को fan-out के दौरान trace correlation बनाए रखना चाहिए और provider retries के तहत idempotent होना चाहिए।

इसका अर्थ:

- जब एक external event कई internal messages बनता है, तो हर भाग वही trace/event identity बनाए रखता है।
- retries से double-processing नहीं होती।
- यदि provider event IDs अनुपस्थित हैं, तो अलग-अलग events को drop करने से बचने के लिए dedupe सुरक्षित key (जैसे, trace ID) पर fallback करता है।

- सफल:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- असफल (अपेक्षित):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Routing dmScope precedence + identityLinks

**दावा:** routing को default रूप से DM sessions को isolated रखना चाहिए, और sessions को केवल स्पष्ट रूप से configured होने पर collapse करना चाहिए (channel precedence + identity links)।

इसका अर्थ:

- Channel-specific dmScope overrides को global defaults पर प्राथमिकता मिलनी चाहिए।
- identityLinks को केवल स्पष्ट linked groups के भीतर collapse करना चाहिए, unrelated peers के बीच नहीं।

- सफल:
  - `make routing-precedence`
  - `make routing-identitylinks`
- असफल (अपेक्षित):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## संबंधित

- [थ्रेट मॉडल](/hi/security/THREAT-MODEL-ATLAS)
- [थ्रेट मॉडल में योगदान](/hi/security/CONTRIBUTING-THREAT-MODEL)
