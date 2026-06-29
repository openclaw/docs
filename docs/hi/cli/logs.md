---
read_when:
    - आपको Gateway लॉग को दूरस्थ रूप से टेल करना होगा (SSH के बिना)
    - आप टूलिंग के लिए JSON लॉग लाइनें चाहते हैं
summary: '`openclaw logs` के लिए CLI संदर्भ (RPC के माध्यम से Gateway लॉग tail करें)'
title: लॉग
x-i18n:
    generated_at: "2026-06-28T22:50:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC के ज़रिए Gateway फ़ाइल लॉग tail करें (remote मोड में काम करता है).

संबंधित:

- Logging अवलोकन: [Logging](/hi/logging)
- Gateway CLI: [gateway](/hi/cli/gateway)

## विकल्प

- `--limit <n>`: लौटाई जाने वाली लॉग पंक्तियों की अधिकतम संख्या (डिफ़ॉल्ट `200`)
- `--max-bytes <n>`: लॉग फ़ाइल से पढ़े जाने वाले अधिकतम बाइट्स (डिफ़ॉल्ट `250000`)
- `--follow`: लॉग स्ट्रीम को follow करें
- `--interval <ms>`: follow करते समय polling अंतराल (डिफ़ॉल्ट `1000`)
- `--json`: line-delimited JSON इवेंट उत्सर्जित करें
- `--plain`: styled formatting के बिना सादा टेक्स्ट आउटपुट
- `--no-color`: ANSI रंग अक्षम करें
- `--local-time`: timestamps को आपके स्थानीय timezone में render करें (डिफ़ॉल्ट)
- `--utc`: timestamps को UTC में render करें

## साझा Gateway RPC विकल्प

`openclaw logs` मानक Gateway client flags भी स्वीकार करता है:

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway token
- `--timeout <ms>`: ms में timeout (डिफ़ॉल्ट `30000`)
- `--expect-final`: जब Gateway call agent-backed हो, तब अंतिम response की प्रतीक्षा करें

जब आप `--url` पास करते हैं, CLI config या environment credentials को auto-apply नहीं करता. यदि लक्ष्य Gateway को auth चाहिए, तो `--token` स्पष्ट रूप से शामिल करें.

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

- डिफ़ॉल्ट रूप से timestamps आपके स्थानीय timezone में render होते हैं. UTC आउटपुट के लिए `--utc` का उपयोग करें.
- यदि implicit local loopback Gateway pairing के लिए पूछता है, connect के दौरान बंद हो जाता है, या `logs.tail` के उत्तर देने से पहले timeout हो जाता है, तो `openclaw logs` अपने-आप configured Gateway फ़ाइल लॉग पर fallback करता है. स्पष्ट `--url` targets इस fallback का उपयोग नहीं करते.
- implicit local Gateway RPC failures के बाद `openclaw logs --follow` configured-file fallbacks को follow नहीं करता. Linux पर, उपलब्ध होने पर यह PID के अनुसार active user-systemd Gateway journal का उपयोग करता है और चयनित log source print करता है; अन्यथा यह किसी संभावित रूप से stale side-by-side file को tail करने के बजाय live Gateway को retry करता रहता है.
- `--follow` का उपयोग करते समय, transient gateway disconnects (WebSocket close, timeout, connection drop) exponential backoff के साथ automatic reconnection trigger करते हैं (8 retries तक, attempts के बीच 30 s की सीमा). प्रत्येक retry पर stderr में warning print होती है, और poll सफल होने पर एक बार `[logs] gateway reconnected` notice print होता है. `--json` mode में retry warning और reconnect transition, दोनों stderr पर `{"type":"notice"}` records के रूप में emit होते हैं. Non-recoverable errors (auth failure, bad configuration) फिर भी तुरंत exit करते हैं.

## संबंधित

- [CLI reference](/hi/cli)
- [Gateway logging](/hi/gateway/logging)
