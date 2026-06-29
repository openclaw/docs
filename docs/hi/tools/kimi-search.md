---
read_when:
    - आप web_search के लिए Kimi का उपयोग करना चाहते हैं
    - आपको KIMI_API_KEY या MOONSHOT_API_KEY चाहिए
summary: Moonshot वेब खोज के माध्यम से Kimi वेब खोज
title: Kimi खोज
x-i18n:
    generated_at: "2026-06-29T00:20:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw Kimi को `web_search` provider के रूप में समर्थन देता है, जो citations के साथ AI-संश्लेषित उत्तर बनाने के लिए Moonshot वेब खोज
का उपयोग करता है।

## API key प्राप्त करें

<Steps>
  <Step title="key बनाएँ">
    [Moonshot AI](https://platform.moonshot.cn/) से API key प्राप्त करें।
  </Step>
  <Step title="key संग्रहित करें">
    Gateway environment में `KIMI_API_KEY` या `MOONSHOT_API_KEY` सेट करें, या
    इसके माध्यम से configure करें:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

जब आप `openclaw onboard` या
`openclaw configure --section web` के दौरान **Kimi** चुनते हैं, तो OpenClaw यह भी पूछ सकता है:

- Moonshot API region:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- default Kimi वेब-खोज model (default `kimi-k2.6` है)

## Config

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

यदि आप chat के लिए China API host (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`) का उपयोग करते हैं, तो `tools.web.search.kimi.baseUrl` छोड़े जाने पर OpenClaw Kimi
`web_search` के लिए उसी host का फिर से उपयोग करता है, ताकि
[platform.moonshot.cn](https://platform.moonshot.cn/) की keys गलती से
international endpoint तक न पहुँचें (जो अक्सर HTTP 401 लौटाता है)। जब आपको अलग search base URL चाहिए, तो
`tools.web.search.kimi.baseUrl` से override करें।

**Environment विकल्प:** Gateway environment में `KIMI_API_KEY` या `MOONSHOT_API_KEY` सेट करें। gateway install के लिए, इसे `~/.openclaw/.env` में रखें।

यदि आप `baseUrl` छोड़ते हैं, तो OpenClaw default रूप से `https://api.moonshot.ai/v1` का उपयोग करता है।
यदि आप `model` छोड़ते हैं, तो OpenClaw default रूप से `kimi-k2.6` का उपयोग करता है।

## यह कैसे काम करता है

Kimi inline citations के साथ उत्तरों को synthesize करने के लिए Moonshot वेब खोज का उपयोग करता है,
जो Gemini और Grok के grounded response approach जैसा है।

OpenClaw Kimi `web_search` को तभी सफल मानता है जब Moonshot native वेब-खोज grounding evidence लौटाता है, जैसे replayable `$web_search` tool
payload, `search_results`, या citation URLs। यदि Kimi बिना grounding evidence के
"I cannot browse the internet" जैसे साधारण chat answer के साथ तुरंत रुक जाता है,
तो OpenClaw उस text को search result के रूप में wrap करने के बजाय एक structured `kimi_web_search_ungrounded` error लौटाता है। query को retry करें, Brave जैसे structured
provider पर switch करें, या जब आपके पास पहले से target URL हो तो `web_fetch` / browser tool का उपयोग करें।

## समर्थित parameters

Kimi search `query` को support करता है।

shared `web_search` compatibility के लिए `count` स्वीकार किया जाता है, लेकिन Kimi फिर भी
N-result list के बजाय citations के साथ एक synthesized answer लौटाता है।

Provider-specific filters वर्तमान में supported नहीं हैं।

## संबंधित

- [वेब खोज अवलोकन](/hi/tools/web) -- सभी providers और auto-detection
- [Moonshot AI](/hi/providers/moonshot) -- Moonshot model + Kimi Coding provider docs
- [Gemini Search](/hi/tools/gemini-search) -- Google grounding के माध्यम से AI-संश्लेषित उत्तर
- [Grok Search](/hi/tools/grok-search) -- xAI grounding के माध्यम से AI-संश्लेषित उत्तर
