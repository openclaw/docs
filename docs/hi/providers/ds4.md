---
read_when:
    - आप OpenClaw को antirez/ds4 के साथ चलाना चाहते हैं
    - आप tool calls वाला एक स्थानीय DeepSeek V4 Flash बैकएंड चाहते हैं
    - आपको ds4-server के लिए OpenClaw कॉन्फ़िग चाहिए
summary: OpenClaw को ds4 के माध्यम से चलाएँ, जो एक स्थानीय DeepSeek V4 Flash OpenAI-संगत सर्वर है
title: ds4
x-i18n:
    generated_at: "2026-06-28T23:58:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) एक स्थानीय Metal बैकएंड से OpenAI-संगत `/v1` API के साथ DeepSeek V4 Flash सर्व करता है। OpenClaw सामान्य `openai-completions` प्रदाता परिवार के माध्यम से ds4 से कनेक्ट करता है।

ds4 कोई बंडल किया हुआ OpenClaw प्रदाता Plugin नहीं है। इसे `models.providers.ds4` के अंतर्गत कॉन्फ़िगर करें, फिर `ds4/deepseek-v4-flash` चुनें।

- प्रदाता id: `ds4`
- Plugin: कोई नहीं
- API: OpenAI-संगत Chat Completions (`openai-completions`)
- सुझाया गया बेस URL: `http://127.0.0.1:18000/v1`
- मॉडल id: `deepseek-v4-flash`
- टूल कॉल: OpenAI-शैली के `tools` और `tool_calls` के माध्यम से समर्थित
- रीजनिंग: DeepSeek-शैली के `thinking` और `reasoning_effort`

## आवश्यकताएँ

- Metal समर्थन वाला macOS।
- `ds4-server` और DeepSeek V4 Flash GGUF फ़ाइल के साथ काम करता हुआ ds4 checkout।
- आपके चुने हुए कॉन्टेक्स्ट के लिए पर्याप्त मेमोरी। बड़े `--ctx` मान सर्वर शुरू होने पर अधिक KV मेमोरी आवंटित करते हैं।

<Warning>
OpenClaw एजेंट टर्न में टूल स्कीमा और workspace कॉन्टेक्स्ट शामिल होते हैं। `--ctx 4096` जैसा बहुत छोटा कॉन्टेक्स्ट सीधे curl परीक्षण पास कर सकता है, लेकिन पूरे एजेंट रन में `500 prompt exceeds context` के साथ विफल हो सकता है। एजेंट और टूल smoke परीक्षणों के लिए कम से कम `--ctx 32768` का उपयोग करें। `--ctx 393216` का उपयोग केवल तब करें जब आपके पास पर्याप्त मेमोरी हो और आप ds4 Think Max व्यवहार चाहते हों।
</Warning>

## त्वरित शुरुआत

<Steps>
  <Step title="ds4-server शुरू करें">
    `<DS4_DIR>` को अपने ds4 checkout पथ से बदलें।

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="OpenAI-संगत endpoint सत्यापित करें">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    प्रतिक्रिया में `deepseek-v4-flash` शामिल होना चाहिए।

  </Step>
  <Step title="OpenClaw प्रदाता config जोड़ें">
    [पूर्ण config](#full-config) से config जोड़ें, फिर एक one-shot मॉडल जाँच चलाएँ:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## पूर्ण config

इस config का उपयोग तब करें जब ds4 पहले से `127.0.0.1:18000` पर चल रहा हो।

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`contextWindow` को `ds4-server --ctx` मान के साथ संरेखित रखें। `maxTokens` को `--tokens` के साथ संरेखित रखें, जब तक कि आप जानबूझकर OpenClaw से सर्वर default से कम output अनुरोध कराना न चाहें।

## ऑन-डिमांड startup

OpenClaw ds4 को केवल तब शुरू कर सकता है जब कोई `ds4/...` मॉडल चुना गया हो। उसी प्रदाता एंट्री में `localService` जोड़ें:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` एक पूर्ण executable पथ होना चाहिए। Shell lookup और `~` expansion का उपयोग नहीं किया जाता। हर `localService` फ़ील्ड के लिए [स्थानीय मॉडल सेवाएँ](/hi/gateway/local-model-services) देखें।

## Think Max

ds4 Think Max केवल तब लागू करता है जब दोनों शर्तें सत्य हों:

- `ds4-server` `--ctx 393216` या उससे अधिक के साथ शुरू होता है।
- अनुरोध `reasoning_effort: "max"` या समकक्ष ds4 effort फ़ील्ड का उपयोग करता है।

यदि आप इतना बड़ा कॉन्टेक्स्ट चलाते हैं, तो सर्वर flags और OpenClaw मॉडल metadata दोनों अपडेट करें:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## परीक्षण

सीधी HTTP जाँच से शुरू करें:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

फिर OpenClaw मॉडल routing का परीक्षण करें:

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

पूरे एजेंट और टूल-कॉल smoke के लिए, कम से कम 32768 का कॉन्टेक्स्ट उपयोग करें:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

अपेक्षित परिणाम:

- `executionTrace.winnerProvider` `ds4` है
- `executionTrace.winnerModel` `deepseek-v4-flash` है
- `toolSummary.calls` कम से कम `1` है
- `finalAssistantVisibleText` `tool-ok` से शुरू होता है

## समस्या निवारण

<AccordionGroup>
  <Accordion title="curl /v1/models कनेक्ट नहीं कर सकता">
    ds4 चल नहीं रहा है या `baseUrl` में दिए गए host और port से bind नहीं है। `ds4-server` शुरू करें, फिर दोबारा प्रयास करें:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    कॉन्फ़िगर किया गया `--ctx` OpenClaw टर्न के लिए बहुत छोटा है। `ds4-server --ctx` बढ़ाएँ, फिर मिलान के लिए `models.providers.ds4.models[].contextWindow` अपडेट करें। टूल्स के साथ पूरे एजेंट टर्न को सीधे एक-message curl अनुरोध की तुलना में काफी अधिक कॉन्टेक्स्ट चाहिए।
  </Accordion>

  <Accordion title="Think Max सक्रिय नहीं होता">
    ds4 Think Max का उपयोग केवल तब करता है जब `--ctx` कम से कम `393216` हो और अनुरोध `reasoning_effort: "max"` माँगे। छोटे कॉन्टेक्स्ट high reasoning पर fallback करते हैं।
  </Accordion>

  <Accordion title="पहला अनुरोध धीमा है">
    ds4 में cold Metal residency और मॉडल warmup चरण होता है। जब OpenClaw सर्वर को मांग पर शुरू करता है, तो `localService.readyTimeoutMs: 300000` का उपयोग करें।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="स्थानीय मॉडल सेवाएँ" href="/hi/gateway/local-model-services" icon="play">
    मॉडल अनुरोधों से पहले स्थानीय मॉडल सर्वर मांग पर शुरू करें।
  </Card>
  <Card title="स्थानीय मॉडल" href="/hi/gateway/local-models" icon="server">
    स्थानीय मॉडल बैकएंड चुनें और संचालित करें।
  </Card>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता refs, auth, और failover कॉन्फ़िगर करें।
  </Card>
  <Card title="DeepSeek" href="/hi/providers/deepseek" icon="brain">
    Native DeepSeek प्रदाता व्यवहार और thinking controls।
  </Card>
</CardGroup>
