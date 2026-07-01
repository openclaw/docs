---
read_when:
    - आपको Gateway लॉग को दूरस्थ रूप से लाइव देखना होगा (SSH के बिना)
    - आपको टूलिंग के लिए JSON लॉग लाइनें चाहिए
summary: '`openclaw logs` के लिए CLI संदर्भ (RPC के माध्यम से Gateway लॉग tail करें)'
title: लॉग
x-i18n:
    generated_at: "2026-07-01T15:24:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC पर Gateway फ़ाइल लॉग को टेल करें (रिमोट मोड में काम करता है)।

संबंधित:

- लॉगिंग अवलोकन: [लॉगिंग](/hi/logging)
- Gateway CLI: [gateway](/hi/cli/gateway)

## विकल्प

- `--limit <n>`: लौटाई जाने वाली लॉग पंक्तियों की अधिकतम संख्या (डिफ़ॉल्ट `200`)
- `--max-bytes <n>`: लॉग फ़ाइल से पढ़े जाने वाले अधिकतम बाइट्स (डिफ़ॉल्ट `250000`)
- `--follow`: लॉग स्ट्रीम का अनुसरण करें
- `--interval <ms>`: अनुसरण करते समय पोलिंग अंतराल (डिफ़ॉल्ट `1000`)
- `--json`: पंक्ति-सीमांकित JSON इवेंट उत्सर्जित करें
- `--plain`: शैलीकृत फ़ॉर्मेटिंग के बिना सादा टेक्स्ट आउटपुट
- `--no-color`: ANSI रंग अक्षम करें
- `--local-time`: टाइमस्टैम्प आपके स्थानीय टाइमज़ोन में रेंडर करें (डिफ़ॉल्ट)
- `--utc`: टाइमस्टैम्प UTC में रेंडर करें

## साझा Gateway RPC विकल्प

`openclaw logs` मानक Gateway क्लाइंट फ़्लैग भी स्वीकार करता है:

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway टोकन
- `--timeout <ms>`: ms में टाइमआउट (डिफ़ॉल्ट `30000`)
- `--expect-final`: जब Gateway कॉल एजेंट-समर्थित हो, तो अंतिम प्रतिक्रिया की प्रतीक्षा करें

जब आप `--url` पास करते हैं, तो CLI कॉन्फ़िग या परिवेश क्रेडेंशियल अपने-आप लागू नहीं करता। यदि लक्षित Gateway को auth चाहिए, तो `--token` स्पष्ट रूप से शामिल करें।

## उदाहरण

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## नोट्स

- टाइमस्टैम्प डिफ़ॉल्ट रूप से आपके स्थानीय टाइमज़ोन में रेंडर होते हैं। UTC आउटपुट के लिए `--utc` का उपयोग करें।
- यदि निहित local loopback Gateway पेयरिंग मांगता है, कनेक्ट के दौरान बंद हो जाता है, या `logs.tail` के उत्तर देने से पहले टाइमआउट हो जाता है, तो `openclaw logs` अपने-आप कॉन्फ़िगर किए गए Gateway फ़ाइल लॉग पर वापस चला जाता है। स्पष्ट `--url` लक्ष्य इस फ़ॉलबैक का उपयोग नहीं करते।
- निहित स्थानीय Gateway RPC विफलताओं के बाद `openclaw logs --follow` कॉन्फ़िगर-फ़ाइल फ़ॉलबैक का अनुसरण नहीं करता। Linux पर, उपलब्ध होने पर यह PID के अनुसार सक्रिय user-systemd Gateway जर्नल का उपयोग करता है और चयनित लॉग स्रोत प्रिंट करता है; अन्यथा यह किसी संभावित रूप से पुराने साथ-साथ रखी फ़ाइल को टेल करने के बजाय लाइव Gateway को फिर से आज़माता रहता है।
- `--follow` का उपयोग करते समय, अस्थायी gateway डिस्कनेक्ट (WebSocket बंद होना, टाइमआउट, कनेक्शन ड्रॉप) एक्सपोनेंशियल बैकऑफ़ के साथ स्वचालित पुनःकनेक्शन ट्रिगर करते हैं (8 पुनःप्रयास तक, प्रयासों के बीच अधिकतम 30 s)। हर पुनःप्रयास पर stderr पर चेतावनी प्रिंट होती है, और पोल सफल होते ही `[logs] gateway reconnected` सूचना प्रिंट होती है। `--json` मोड में पुनःप्रयास चेतावनी और पुनःकनेक्ट संक्रमण, दोनों stderr पर `{"type":"notice"}` रिकॉर्ड के रूप में उत्सर्जित होते हैं। गैर-पुनर्प्राप्ति योग्य त्रुटियाँ (auth विफलता, खराब कॉन्फ़िगरेशन) अब भी तुरंत बाहर निकलती हैं।
- `--follow --json` मोड में, लॉग स्रोत संक्रमण `{"type":"meta"}` रिकॉर्ड के रूप में उत्सर्जित होते हैं। उपभोक्ताओं को प्रति `sourceKind` कर्सर ट्रैक करने चाहिए: कोई स्ट्रीम Gateway फ़ाइल आउटपुट (`sourceKind: "file"`) से स्थानीय जर्नल फ़ॉलबैक (`sourceKind: "journal"`, `localFallback: true`, `service.pid`/`service.unit` के साथ) पर जा सकती है और रिकवरी के बाद वापस Gateway फ़ाइल आउटपुट पर लौट सकती है। पूरे follow सत्र के लिए एक स्थिर स्रोत या कर्सर न मानें, और जब रिकवरी Gateway फ़ाइल कर्सर को फिर से चलाती है, तो ओवरलैप होने वाली पंक्तियों को सहन करें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Gateway लॉगिंग](/hi/gateway/logging)
