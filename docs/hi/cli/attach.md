---
read_when:
    - आप चाहते हैं कि Claude Code, OpenClaw Gateway के MCP टूल का उपयोग करे
    - आपको किसी बाहरी हार्नेस के लिए एक अस्थायी, सत्र-बद्ध MCP अनुमति चाहिए
summary: '`openclaw attach` के लिए CLI संदर्भ (सीमित दायरे वाले Gateway MCP अनुदान के साथ Claude Code लॉन्च करें)'
title: CLI संलग्न करें
x-i18n:
    generated_at: "2026-07-16T13:54:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` एक Gateway सत्र से बंधे सख्त अस्थायी MCP कॉन्फ़िगरेशन के साथ Claude Code लॉन्च करता है।

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

विकल्प:

- `--session <key>` अनुदान को एक Gateway सत्र से बांधता है। डिफ़ॉल्ट रूप से मुख्य सत्र का उपयोग होता है।
- `--ttl <ms>` मिलीसेकंड में धनात्मक अनुदान TTL का अनुरोध करता है। Gateway अपनी सीमा लागू करता है।
- `--bin <path>` Claude Code बाइनरी चुनता है। डिफ़ॉल्ट: `claude`।
- `--print-config` अस्थायी `.mcp.json` लिखता है, लॉन्च कमांड और env प्रिंट करता है, और TTL समाप्त होने तक अनुदान सक्रिय रखता है (यह Claude Code को स्पॉन नहीं करता या अनुदान निरस्त नहीं करता)।

बेयरर टोकन argv के बजाय एनवायरनमेंट वेरिएबल के माध्यम से भेजा जाता है। OpenClaw, Claude Code को `--strict-mcp-config --mcp-config <path>` के साथ लॉन्च करता है, ताकि परिवेशी Claude MCP सर्वर संलग्न सत्र में शामिल न हों। सामान्य लॉन्च (`--print-config` के बिना) Claude Code प्रक्रिया के बाहर निकलने पर अनुदान निरस्त कर देते हैं।

यह भी देखें: [Gateway CLI](/hi/cli/gateway), [MCP CLI](/hi/cli/mcp), और [ACP CLI](/hi/cli/acp)।
