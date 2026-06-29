---
read_when:
    - आप युग्मित नोड्स (कैमरे, स्क्रीन, कैनवास) प्रबंधित कर रहे हैं
    - आपको अनुरोधों को मंज़ूरी देनी होगी या node कमांड चलाने होंगे
summary: '`openclaw nodes` के लिए CLI संदर्भ (स्थिति, पेयरिंग, इनवोक, कैमरा/कैनवास/स्क्रीन)'
title: Nodes
x-i18n:
    generated_at: "2026-06-28T22:51:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

पेयर किए गए नोड्स (डिवाइस) प्रबंधित करें और नोड क्षमताओं को इनवोक करें।

संबंधित:

- नोड्स अवलोकन: [नोड्स](/hi/nodes)
- कैमरा: [कैमरा नोड्स](/hi/nodes/camera)
- इमेज: [इमेज नोड्स](/hi/nodes/images)

सामान्य विकल्प:

- `--url`, `--token`, `--timeout`, `--json`

## सामान्य कमांड

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` लंबित/पेयर की गई तालिकाएं प्रिंट करता है। पेयर की गई पंक्तियों में सबसे हाल की कनेक्ट आयु (Last Connect) शामिल होती है।
केवल वर्तमान में कनेक्टेड नोड्स दिखाने के लिए `--connected` का उपयोग करें। किसी अवधि के भीतर
कनेक्ट हुए नोड्स तक फ़िल्टर करने के लिए `--last-connected <duration>` का उपयोग करें (जैसे `24h`, `7d`)।
किसी नोड पेयरिंग को हटाने के लिए `nodes remove --node <id|name|ip>` का उपयोग करें। किसी
डिवाइस-समर्थित नोड के लिए यह `devices/paired.json` में डिवाइस की `node` भूमिका रद्द करता है
और उसके नोड-भूमिका सत्रों को डिस्कनेक्ट करता है (मिश्रित-भूमिका डिवाइस अपनी पंक्ति रखता है और
केवल `node` भूमिका खोता है; केवल-नोड डिवाइस हटा दिया जाता है); यह किसी भी
मेल खाते हुए विरासती Gateway-स्वामित्व वाले नोड पेयरिंग रिकॉर्ड को भी साफ़ करता है। `operator.pairing`
गैर-ऑपरेटर नोड पंक्तियों को हटा सकता है; मिश्रित-भूमिका डिवाइस पर अपनी ही नोड भूमिका रद्द करने वाले
डिवाइस-टोकन कॉलर को अतिरिक्त रूप से `operator.admin` चाहिए।

स्वीकृति नोट:

- `openclaw nodes pending` को केवल पेयरिंग स्कोप चाहिए।
- `gateway.nodes.pairing.autoApproveCidrs` लंबित चरण को केवल
  स्पष्ट रूप से विश्वसनीय, पहली बार की `role: node` डिवाइस पेयरिंग के लिए छोड़ सकता है। यह
  डिफ़ॉल्ट रूप से बंद है और अपग्रेड स्वीकृत नहीं करता।
- `openclaw nodes approve <requestId>` लंबित अनुरोध से अतिरिक्त स्कोप आवश्यकताएं विरासत में लेता है:
  - कमांड-रहित अनुरोध: केवल पेयरिंग
  - गैर-exec नोड कमांड: पेयरिंग + लिखना
  - `system.run` / `system.run.prepare` / `system.which`: पेयरिंग + एडमिन

## इनवोक करें

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

इनवोक फ़्लैग:

- `--params <json>`: JSON ऑब्जेक्ट स्ट्रिंग (डिफ़ॉल्ट `{}`)।
- `--invoke-timeout <ms>`: नोड इनवोक टाइमआउट (डिफ़ॉल्ट `15000`)।
- `--idempotency-key <key>`: वैकल्पिक idempotency key।
- `system.run` और `system.run.prepare` यहां ब्लॉक हैं; शेल निष्पादन के लिए `host=node` के साथ `exec` टूल का उपयोग करें।

किसी नोड पर शेल निष्पादन के लिए, `openclaw nodes run` के बजाय `host=node` के साथ `exec` टूल का उपयोग करें।
`nodes` CLI अब क्षमता-केंद्रित है: `nodes invoke` के ज़रिए प्रत्यक्ष RPC, साथ में पेयरिंग, कैमरा,
स्क्रीन, स्थान, Canvas, और नोटिफ़िकेशन। Canvas कमांड बंडल किए गए प्रायोगिक Canvas Plugin द्वारा लागू किए जाते हैं; कोर एक संगतता हुक रखता है ताकि वे `openclaw nodes canvas` के अंतर्गत बने रहें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [नोड्स](/hi/nodes)
