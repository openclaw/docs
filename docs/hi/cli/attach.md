---
read_when:
    - आप चाहते हैं कि Claude Code OpenClaw Gateway MCP टूल्स का उपयोग करे
    - आपको किसी बाहरी हार्नेस के लिए एक अस्थायी सत्र-बद्ध MCP अनुमति चाहिए
summary: '`openclaw attach` के लिए CLI संदर्भ (स्कोप किए गए Gateway MCP अनुदान के साथ Claude Code लॉन्च करें)'
title: CLI संलग्न करें
x-i18n:
    generated_at: "2026-07-02T00:56:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` एक Gateway session से बंधे सख्त अस्थायी MCP config के साथ Claude Code लॉन्च करता है।

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

विकल्प:

- `--session <key>` grant को Gateway session से बांधता है। डिफ़ॉल्ट मुख्य session है।
- `--ttl <ms>` मिलीसेकंड में सकारात्मक grant TTL का अनुरोध करता है। Gateway अपनी सीमा लागू करता है।
- `--bin <path>` Claude Code binary चुनता है। डिफ़ॉल्ट `claude` है।
- `--print-config` अस्थायी `.mcp.json` लिखता है, launch command और env प्रिंट करता है, और TTL समाप्ति तक grant को live छोड़ता है।

bearer token argv नहीं, बल्कि environment variables के माध्यम से पास किया जाता है। OpenClaw Claude Code को `--strict-mcp-config --mcp-config <path>` के साथ लॉन्च करता है ताकि परिवेशी Claude MCP servers attached session में शामिल न हों। सामान्य launches Claude Code process के exit होने पर grant को revoke कर देते हैं।

यह भी देखें: [Gateway CLI](/hi/cli/gateway), [MCP CLI](/hi/cli/mcp), और [ACP CLI](/hi/cli/acp).
