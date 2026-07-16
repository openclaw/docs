---
read_when:
    - आप वॉइस-कॉल Plugin का उपयोग करते हैं और प्रत्येक CLI प्रवेश बिंदु चाहते हैं
    - आपको setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose और start के लिए फ़्लैग तालिकाएँ और डिफ़ॉल्ट मान चाहिए
summary: '`openclaw voicecall` के लिए CLI संदर्भ (वॉइस-कॉल Plugin कमांड सरफ़ेस)'
title: वॉइसकॉल
x-i18n:
    generated_at: "2026-07-16T14:19:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` Plugin द्वारा प्रदान किया गया कमांड है। यह केवल तब दिखाई देता है, जब voice-call
Plugin इंस्टॉल और सक्षम हो।

जब Gateway चल रहा हो, तो संचालन कमांड (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, `status`) उस Gateway के
voice-call रनटाइम पर रूट होते हैं। यदि किसी Gateway तक नहीं पहुँचा जा सकता, तो वे स्टैंडअलोन
CLI रनटाइम पर फ़ॉलबैक करते हैं।

## उपकमांड

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| उपकमांड | विवरण                                                     |
| ---------- | --------------------------------------------------------------- |
| `setup`    | प्रदाता और Webhook की तैयारी संबंधी जाँच दिखाएँ।                     |
| `smoke`    | तैयारी संबंधी जाँच चलाएँ; केवल `--yes` के साथ लाइव परीक्षण कॉल करें। |
| `call`     | आउटबाउंड वॉइस कॉल शुरू करें।                                |
| `start`    | `call` का उपनाम, जिसमें `--to` आवश्यक और `--message` वैकल्पिक है। |
| `continue` | संदेश बोलें और अगली प्रतिक्रिया की प्रतीक्षा करें।                 |
| `speak`    | प्रतिक्रिया की प्रतीक्षा किए बिना संदेश बोलें।                 |
| `dtmf`     | सक्रिय कॉल पर DTMF अंक भेजें।                             |
| `end`      | सक्रिय कॉल काटें।                                         |
| `status`   | सक्रिय कॉलों का निरीक्षण करें (या `--call-id` द्वारा किसी एक का)।                   |
| `tail`     | `calls.jsonl` को टेल करें (प्रदाता परीक्षणों के दौरान उपयोगी)।              |
| `latency`  | `calls.jsonl` से टर्न-विलंबता मेट्रिक्स का सारांश दें।              |
| `expose`   | Webhook एंडपॉइंट के लिए Tailscale serve/funnel टॉगल करें।         |

## सेटअप और स्मोक परीक्षण

### `setup`

डिफ़ॉल्ट रूप से मानव-पठनीय तैयारी जाँच प्रिंट करता है। स्क्रिप्ट के लिए `--json` दें।

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

वही तैयारी जाँच चलाता है। वास्तविक फ़ोन कॉल केवल तभी करता है, जब
`--to` और `--yes` दोनों मौजूद हों।

| फ़्लैग               | डिफ़ॉल्ट                           | विवरण                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | (कोई नहीं)                            | लाइव स्मोक परीक्षण के लिए कॉल किया जाने वाला फ़ोन नंबर।  |
| `--message <text>` | `OpenClaw voice call smoke test.` | स्मोक कॉल के दौरान बोला जाने वाला संदेश। |
| `--mode <mode>`    | `notify`                          | कॉल मोड: `notify` या `conversation`।  |
| `--yes`            | `false`                           | वास्तव में लाइव आउटबाउंड कॉल करें।  |
| `--json`           | `false`                           | मशीन-पठनीय JSON प्रिंट करें।            |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # ड्राई रन
openclaw voicecall smoke --to "+15555550123" --yes  # लाइव सूचना कॉल
```

<Note>
बाहरी प्रदाताओं (`plivo`, `telnyx`, `twilio`) के लिए, `setup` और `smoke` को `publicUrl`, किसी टनल या Tailscale एक्सपोज़र से सार्वजनिक Webhook URL की आवश्यकता होती है। लूपबैक या निजी serve फ़ॉलबैक अस्वीकार कर दिया जाता है, क्योंकि वाहक उस तक नहीं पहुँच सकते।
</Note>

## कॉल जीवनचक्र

### `call`

आउटबाउंड वॉइस कॉल शुरू करें।

| फ़्लैग                   | आवश्यक | डिफ़ॉल्ट           | विवरण                                                                |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | हाँ      | (कोई नहीं)            | कॉल कनेक्ट होने पर बोला जाने वाला संदेश।                                   |
| `-t, --to <phone>`     | नहीं       | कॉन्फ़िग `toNumber` | कॉल किया जाने वाला E.164 फ़ोन नंबर।                                                |
| `--mode <mode>`        | नहीं       | `conversation`    | कॉल मोड: `notify` (संदेश के बाद कॉल काटें) या `conversation` (कॉल खुली रखें)। |

```bash
openclaw voicecall call --to "+15555550123" --message "नमस्ते"
openclaw voicecall call -m "ध्यान दें" --mode notify
```

### `start`

अलग डिफ़ॉल्ट फ़्लैग संरचना के साथ `call` का उपनाम।

| फ़्लैग               | आवश्यक | डिफ़ॉल्ट        | विवरण                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | हाँ      | (कोई नहीं)         | कॉल किया जाने वाला फ़ोन नंबर।                    |
| `--message <text>` | नहीं       | (कोई नहीं)         | कॉल कनेक्ट होने पर बोला जाने वाला संदेश। |
| `--mode <mode>`    | नहीं       | `conversation` | कॉल मोड: `notify` या `conversation`।   |

### `continue`

संदेश बोलें और प्रतिक्रिया की प्रतीक्षा करें।

| फ़्लैग               | आवश्यक | विवरण       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | हाँ      | कॉल ID।          |
| `--message <text>` | हाँ      | बोला जाने वाला संदेश। |

### `speak`

प्रतिक्रिया की प्रतीक्षा किए बिना संदेश बोलें।

| फ़्लैग               | आवश्यक | विवरण       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | हाँ      | कॉल ID।          |
| `--message <text>` | हाँ      | बोला जाने वाला संदेश। |

### `dtmf`

सक्रिय कॉल पर DTMF अंक भेजें।

| फ़्लैग                | आवश्यक | विवरण                                      |
| ------------------- | -------- | ------------------------------------------------ |
| `--call-id <id>`    | हाँ      | कॉल ID।                                         |
| `--digits <digits>` | हाँ      | DTMF अंक (उदाहरण के लिए, प्रतीक्षा हेतु `ww123456#`)। |

### `end`

सक्रिय कॉल काटें।

| फ़्लैग             | आवश्यक | विवरण |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | हाँ      | कॉल ID।    |

### `status`

सक्रिय कॉलों का निरीक्षण करें।

| फ़्लैग             | डिफ़ॉल्ट | विवरण                  |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | (कोई नहीं)  | आउटपुट को एक कॉल तक सीमित करें। |
| `--json`         | `false` | मशीन-पठनीय JSON प्रिंट करें। |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## लॉग और मेट्रिक्स

### `tail`

voice-call JSONL लॉग को टेल करें। शुरू होने पर अंतिम `--since` पंक्तियाँ प्रिंट करता है, फिर
लिखी जाने वाली नई पंक्तियों को स्ट्रीम करता है।

| फ़्लैग            | डिफ़ॉल्ट                    | विवरण                    |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | Plugin स्टोर से निर्धारित | `calls.jsonl` का पथ।         |
| `--since <n>`   | `25`                       | टेल करना शुरू करने से पहले प्रिंट की जाने वाली पंक्तियाँ। |
| `--poll <ms>`   | `250` (न्यूनतम 50)         | मिलीसेकंड में पोल अंतराल। |

### `latency`

`calls.jsonl` से टर्न-विलंबता और सुनने-की-प्रतीक्षा मेट्रिक्स का सारांश देता है। आउटपुट
JSON होता है, जिसमें `recordsScanned`, `turnLatency`, और `listenWait` सारांश होते हैं।

| फ़्लैग            | डिफ़ॉल्ट                    | विवरण                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | Plugin स्टोर से निर्धारित | `calls.jsonl` का पथ।               |
| `--last <n>`    | `200` (न्यूनतम 1)          | विश्लेषण किए जाने वाले हालिया रिकॉर्ड की संख्या। |

## Webhook एक्सपोज़ करना

### `expose`

वॉइस Webhook के लिए Tailscale serve/funnel कॉन्फ़िगरेशन को सक्षम, अक्षम या परिवर्तित करें।

| फ़्लैग                  | डिफ़ॉल्ट                                   | विवरण                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (tailnet), या `funnel` (सार्वजनिक)। |
| `--path <path>`       | कॉन्फ़िग `tailscale.path` या `--serve-path` | एक्सपोज़ किया जाने वाला Tailscale पथ।                       |
| `--port <port>`       | कॉन्फ़िग `serve.port` या `3334`             | स्थानीय Webhook पोर्ट।                             |
| `--serve-path <path>` | कॉन्फ़िग `serve.path` या `/voice/webhook`   | स्थानीय Webhook पथ।                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Webhook एंडपॉइंट को केवल उन नेटवर्कों पर एक्सपोज़ करें जिन पर आपको भरोसा है। संभव होने पर Funnel के बजाय Tailscale Serve को प्राथमिकता दें।
</Warning>

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [वॉइस कॉल Plugin](/hi/plugins/voice-call)
