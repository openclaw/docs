---
read_when:
    - आप चैनल की स्थिति और हालिया सत्र प्राप्तकर्ताओं का त्वरित निदान चाहते हैं
    - आप डीबगिंग के लिए चिपकाने योग्य "all" स्थिति चाहते हैं
summary: '`openclaw status` के लिए CLI संदर्भ (निदान, प्रोब, उपयोग स्नैपशॉट)'
title: openclaw status
x-i18n:
    generated_at: "2026-06-28T22:53:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

चैनलों + सत्रों के लिए निदान।

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

नोट्स:

- `--deep` लाइव probes चलाता है (WhatsApp Web + Telegram + Discord + Slack + Signal)।
- सामान्य `openclaw status` तेज़ read-only पथ पर रहता है और memory निरीक्षण छोड़ने पर memory को अनुपलब्ध के बजाय `not checked` के रूप में चिह्नित करता है। भारी सुरक्षा ऑडिट, Plugin संगतता, और memory-vector probes को `openclaw status --all`, `openclaw status --deep`, `openclaw security audit`, और `openclaw memory status --deep` के लिए छोड़ा जाता है।
- `status --json --all` `plugins.slots.memory` द्वारा चुने गए सक्रिय memory Plugin runtime से memory विवरण रिपोर्ट करता है। कस्टम memory Plugins अंतर्निहित `agents.defaults.memorySearch.enabled` को अक्षम छोड़ सकते हैं और फिर भी अपनी फ़ाइलों, chunks, vector, और FTS स्थिति की रिपोर्ट कर सकते हैं।
- `--usage` सामान्यीकृत provider usage windows को `X% left` के रूप में प्रिंट करता है।
- सत्र स्थिति आउटपुट `Execution:` को `Runtime:` से अलग करता है। `Execution` sandbox पथ है (`direct`, `docker/*`), जबकि `Runtime` बताता है कि सत्र `OpenClaw Default`, `OpenAI Codex`, कोई CLI backend, या `codex (acp/acpx)` जैसा ACP backend उपयोग कर रहा है। provider/model/runtime के अंतर के लिए [Agent runtimes](/hi/concepts/agent-runtimes) देखें।
- MiniMax के कच्चे `usage_percent` / `usagePercent` फ़ील्ड शेष quota होते हैं, इसलिए OpenClaw उन्हें प्रदर्शित करने से पहले उलट देता है; count-based फ़ील्ड मौजूद होने पर प्राथमिकता पाते हैं। `model_remains` प्रतिक्रियाएँ chat-model entry को प्राथमिकता देती हैं, ज़रूरत होने पर timestamps से window label निकालती हैं, और plan label में model name शामिल करती हैं।
- जब वर्तमान सत्र snapshot विरल हो, `/status` सबसे हाल के transcript usage log से token और cache counters backfill कर सकता है। मौजूदा nonzero live values फिर भी transcript fallback values पर प्राथमिकता रखते हैं।
- `/status` में संक्षिप्त Gateway process uptime और host system uptime शामिल हैं।
- जब live session entry में सक्रिय runtime model label अनुपस्थित हो, transcript fallback उसे भी पुनर्प्राप्त कर सकता है। यदि वह transcript model चुने गए model से अलग है, तो status चुने गए model के बजाय पुनर्प्राप्त runtime model के विरुद्ध context window resolve करता है।
- जब कोई सत्र configured primary से अलग model पर pinned हो, status दोनों values, कारण (`session override`), और स्पष्ट संकेत (`/model default`) प्रिंट करता है। configured primary नए या unpinned सत्रों पर लागू होता है; मौजूदा pinned सत्र clear किए जाने तक अपना session selection रखते हैं।
- prompt-size accounting के लिए, जब session metadata अनुपस्थित या छोटा हो, transcript fallback बड़े prompt-oriented total को प्राथमिकता देता है, ताकि custom-provider sessions `0` token displays तक न सिमटें।
- जब कई agents configured हों, output में per-agent session stores शामिल होते हैं।
- उपलब्ध होने पर overview में Gateway + node host service install/runtime status शामिल होता है।
- overview में update channel + git SHA (source checkouts के लिए) शामिल होता है।
- Update जानकारी Overview में दिखाई देती है; यदि update उपलब्ध है, तो status `openclaw update` चलाने का संकेत प्रिंट करता है ([Updating](/hi/install/updating) देखें)।
- Model pricing refresh failures वैकल्पिक pricing warnings के रूप में दिखाई जाती हैं। उनका मतलब यह
  नहीं है कि Gateway या channels अस्वस्थ हैं।
- Read-only status surfaces (`status`, `status --json`, `status --all`) संभव होने पर अपने लक्षित config paths के लिए supported SecretRefs resolve करते हैं।
- यदि supported channel SecretRef configured है लेकिन वर्तमान command path में unavailable है, तो status read-only रहता है और crash करने के बजाय degraded output रिपोर्ट करता है। Human output "configured token unavailable in this command path" जैसी warnings दिखाता है, और JSON output में `secretDiagnostics` शामिल होता है।
- जब command-local SecretRef resolution सफल होता है, status resolved snapshot को प्राथमिकता देता है और अंतिम output से transient "secret unavailable" channel markers clear करता है।
- `status --all` में Secrets overview row और diagnosis section शामिल होता है, जो report generation रोके बिना secret diagnostics का सार देता है (readability के लिए truncated)।

## संबंधित

- [CLI reference](/hi/cli)
- [Doctor](/hi/gateway/doctor)
