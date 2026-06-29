---
read_when:
    - आप voice-call Plugin का उपयोग करते हैं और हर CLI प्रवेश बिंदु चाहते हैं
    - आपको setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose, और start के लिए फ़्लैग तालिकाएँ और डिफ़ॉल्ट चाहिए
summary: '`openclaw voicecall` के लिए CLI संदर्भ (वॉयस-कॉल Plugin कमांड सतह)'
title: वॉइस कॉल
x-i18n:
    generated_at: "2026-06-28T22:55:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` एक Plugin-प्रदान किया गया कमांड है। यह केवल तब दिखाई देता है जब voice-call Plugin इंस्टॉल और सक्षम हो।

जब Gateway चल रहा हो, तो ऑपरेशनल कमांड (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) उस Gateway के voice-call रनटाइम पर रूट किए जाते हैं। यदि कोई Gateway पहुंच योग्य नहीं है, तो वे स्टैंडअलोन CLI रनटाइम पर फ़ॉलबैक करते हैं।

## सबकमांड

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

| सबकमांड | विवरण                                                     |
| ---------- | --------------------------------------------------------------- |
| `setup`    | प्रदाता और Webhook तत्परता जांच दिखाएं।                     |
| `smoke`    | तत्परता जांच चलाएं; `--yes` के साथ ही लाइव टेस्ट कॉल करें। |
| `call`     | आउटबाउंड वॉइस कॉल शुरू करें।                                |
| `start`    | `call` का उपनाम, जिसमें `--to` आवश्यक और `--message` वैकल्पिक है। |
| `continue` | संदेश बोलें और अगली प्रतिक्रिया की प्रतीक्षा करें।                 |
| `speak`    | प्रतिक्रिया की प्रतीक्षा किए बिना संदेश बोलें।                 |
| `dtmf`     | सक्रिय कॉल पर DTMF अंक भेजें।                             |
| `end`      | सक्रिय कॉल काटें।                                         |
| `status`   | सक्रिय कॉल जांचें (या `--call-id` से एक कॉल)।                   |
| `tail`     | `calls.jsonl` को टेल करें (प्रदाता टेस्ट के दौरान उपयोगी)।              |
| `latency`  | `calls.jsonl` से टर्न-लेटेंसी मेट्रिक्स का सारांश दें।              |
| `expose`   | Webhook एंडपॉइंट के लिए Tailscale serve/funnel टॉगल करें।         |

## सेटअप और स्मोक

### `setup`

डिफ़ॉल्ट रूप से मानव-पठनीय तत्परता जांच प्रिंट करता है। स्क्रिप्ट के लिए `--json` पास करें।

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

वही तत्परता जांच चलाता है। जब तक `--to` और `--yes` दोनों मौजूद न हों, यह वास्तविक फ़ोन कॉल नहीं करेगा।

| फ़्लैग               | डिफ़ॉल्ट                           | विवरण                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | (कोई नहीं)                            | लाइव स्मोक के लिए कॉल करने वाला फ़ोन नंबर।  |
| `--message <text>` | `OpenClaw voice call smoke test.` | स्मोक कॉल के दौरान बोला जाने वाला संदेश। |
| `--mode <mode>`    | `notify`                          | कॉल मोड: `notify` या `conversation`।  |
| `--yes`            | `false`                           | वास्तव में लाइव आउटबाउंड कॉल करें।  |
| `--json`           | `false`                           | मशीन-पठनीय JSON प्रिंट करें।            |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
बाहरी प्रदाताओं (`twilio`, `telnyx`, `plivo`) के लिए, `setup` और `smoke` को `publicUrl`, टनल, या Tailscale एक्सपोज़र से सार्वजनिक Webhook URL चाहिए। लूपबैक या निजी serve फ़ॉलबैक अस्वीकार किया जाता है क्योंकि कैरियर उस तक नहीं पहुंच सकते।
</Note>

## कॉल लाइफ़साइकल

### `call`

आउटबाउंड वॉइस कॉल शुरू करें।

| फ़्लैग                   | आवश्यक | डिफ़ॉल्ट           | विवरण                                                                |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | हां      | (कोई नहीं)            | कॉल कनेक्ट होने पर बोला जाने वाला संदेश।                                   |
| `-t, --to <phone>`     | नहीं       | कॉन्फ़िग `toNumber` | कॉल करने के लिए E.164 फ़ोन नंबर।                                                |
| `--mode <mode>`        | नहीं       | `conversation`    | कॉल मोड: `notify` (संदेश के बाद कॉल काटें) या `conversation` (खुला रखें)। |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

अलग डिफ़ॉल्ट फ़्लैग आकार के साथ `call` का उपनाम।

| फ़्लैग               | आवश्यक | डिफ़ॉल्ट        | विवरण                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | हां      | (कोई नहीं)         | कॉल करने के लिए फ़ोन नंबर।                    |
| `--message <text>` | नहीं       | (कोई नहीं)         | कॉल कनेक्ट होने पर बोला जाने वाला संदेश। |
| `--mode <mode>`    | नहीं       | `conversation` | कॉल मोड: `notify` या `conversation`।   |

### `continue`

संदेश बोलें और प्रतिक्रिया की प्रतीक्षा करें।

| फ़्लैग               | आवश्यक | विवरण       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | हां      | कॉल ID।          |
| `--message <text>` | हां      | बोलने के लिए संदेश। |

### `speak`

प्रतिक्रिया की प्रतीक्षा किए बिना संदेश बोलें।

| फ़्लैग               | आवश्यक | विवरण       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | हां      | कॉल ID।          |
| `--message <text>` | हां      | बोलने के लिए संदेश। |

### `dtmf`

सक्रिय कॉल पर DTMF अंक भेजें।

| फ़्लैग                | आवश्यक | विवरण                               |
| ------------------- | -------- | ----------------------------------------- |
| `--call-id <id>`    | हां      | कॉल ID।                                  |
| `--digits <digits>` | हां      | DTMF अंक (जैसे प्रतीक्षा के लिए `ww123456#`)। |

### `end`

सक्रिय कॉल काटें।

| फ़्लैग             | आवश्यक | विवरण |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | हां      | कॉल ID।    |

### `status`

सक्रिय कॉल जांचें।

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

voice-call JSONL लॉग को टेल करें। शुरू में अंतिम `--since` लाइनें प्रिंट करता है, फिर नई लाइनें लिखे जाने पर उन्हें स्ट्रीम करता है।

| फ़्लैग            | डिफ़ॉल्ट                    | विवरण                    |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | Plugin स्टोर से हल किया गया | `calls.jsonl` का पथ।         |
| `--since <n>`   | `25`                       | टेल करने से पहले प्रिंट की जाने वाली लाइनें। |
| `--poll <ms>`   | `250` (न्यूनतम 50)         | मिलीसेकंड में पोल अंतराल। |

### `latency`

`calls.jsonl` से टर्न-लेटेंसी और listen-wait मेट्रिक्स का सारांश दें। आउटपुट JSON है, जिसमें `recordsScanned`, `turnLatency`, और `listenWait` सारांश होते हैं।

| फ़्लैग            | डिफ़ॉल्ट                    | विवरण                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | Plugin स्टोर से हल किया गया | `calls.jsonl` का पथ।               |
| `--last <n>`    | `200` (न्यूनतम 1)          | विश्लेषण के लिए हाल के रिकॉर्ड की संख्या। |

## Webhook एक्सपोज़ करना

### `expose`

वॉइस Webhook के लिए Tailscale serve/funnel कॉन्फ़िगरेशन सक्षम, अक्षम, या बदलें।

| फ़्लैग                  | डिफ़ॉल्ट                                   | विवरण                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (tailnet), या `funnel` (सार्वजनिक)। |
| `--path <path>`       | कॉन्फ़िग `tailscale.path` या `--serve-path` | एक्सपोज़ करने के लिए Tailscale पथ।                       |
| `--port <port>`       | कॉन्फ़िग `serve.port` या `3334`             | स्थानीय Webhook पोर्ट।                             |
| `--serve-path <path>` | कॉन्फ़िग `serve.path` या `/voice/webhook`   | स्थानीय Webhook पथ।                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Webhook एंडपॉइंट को केवल उन नेटवर्क पर एक्सपोज़ करें जिन पर आप भरोसा करते हैं। संभव हो तो Funnel की बजाय Tailscale Serve को प्राथमिकता दें।
</Warning>

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [वॉइस कॉल Plugin](/hi/plugins/voice-call)
