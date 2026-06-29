---
read_when:
    - आप OpenClaw में गोपनीयता-केंद्रित इन्फ़रेंस चाहते हैं
    - आप Venice AI सेटअप मार्गदर्शन चाहते हैं
summary: OpenClaw में Venice AI के गोपनीयता-केंद्रित मॉडल का उपयोग करें
title: Venice AI
x-i18n:
    generated_at: "2026-06-29T00:03:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f02885dd7d8dc06fb6a923f504ad515c4b9345507d784bff290d3fcc483ed45
    source_path: providers/venice.md
    workflow: 16
---

Venice AI **गोपनीयता-केंद्रित AI inference** प्रदान करता है, जिसमें बिना सेंसर वाले models का समर्थन और उनके anonymized proxy के माध्यम से प्रमुख proprietary models तक पहुंच शामिल है। सभी inference डिफ़ॉल्ट रूप से निजी हैं — आपके डेटा पर कोई training नहीं, कोई logging नहीं।

## OpenClaw में Venice क्यों

- open-source models के लिए **निजी inference** (कोई logging नहीं)।
- जरूरत पड़ने पर **बिना सेंसर वाले models**।
- गुणवत्ता महत्वपूर्ण होने पर proprietary models (Opus/GPT/Gemini) तक **अनामित पहुंच**।
- OpenAI-compatible `/v1` endpoints।

## गोपनीयता मोड

Venice दो गोपनीयता स्तर प्रदान करता है — इसे समझना अपना model चुनने की कुंजी है:

| मोड | विवरण | Models |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **निजी** | पूरी तरह निजी। Prompts/responses **कभी stored या logged नहीं किए जाते**। क्षणिक। | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, आदि। |
| **अनामित** | Metadata हटाकर Venice के माध्यम से proxy किया गया। मूल provider (OpenAI, Anthropic, Google, xAI) अनामित requests देखता है। | Claude, GPT, Gemini, Grok |

<Warning>
अनामित models पूरी तरह निजी **नहीं** हैं। Venice आगे भेजने से पहले metadata हटाता है, लेकिन मूल provider (OpenAI, Anthropic, Google, xAI) फिर भी request को process करता है। जब पूर्ण गोपनीयता आवश्यक हो, तो **निजी** models चुनें।
</Warning>

## विशेषताएं

- **गोपनीयता-केंद्रित**: "निजी" (पूरी तरह निजी) और "अनामित" (proxied) modes में से चुनें
- **बिना सेंसर वाले models**: content restrictions के बिना models तक पहुंच
- **प्रमुख model access**: Venice के anonymized proxy के माध्यम से Claude, GPT, Gemini, और Grok का उपयोग करें
- **OpenAI-compatible API**: आसान integration के लिए मानक `/v1` endpoints
- **Streaming**: सभी models पर समर्थित
- **Function calling**: चुनिंदा models पर समर्थित (model capabilities जांचें)
- **Vision**: vision capability वाले models पर समर्थित
- **कोई hard rate limits नहीं**: अत्यधिक उपयोग पर fair-use throttling लागू हो सकती है

## शुरू करना

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Get your API key">
    1. [venice.ai](https://venice.ai) पर sign up करें
    2. **Settings > API Keys > Create new key** पर जाएं
    3. अपनी API key copy करें (format: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure OpenClaw">
    अपनी पसंदीदा setup विधि चुनें:

    <Tabs>
      <Tab title="Interactive (recommended)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        यह करेगा:
        1. आपकी API key के लिए prompt करेगा (या मौजूदा `VENICE_API_KEY` का उपयोग करेगा)
        2. सभी उपलब्ध Venice models दिखाएगा
        3. आपको अपना default model चुनने देगा
        4. Provider को अपने आप configure करेगा
      </Tab>
      <Tab title="Environment variable">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interactive">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Model चयन

Setup के बाद, OpenClaw सभी उपलब्ध Venice models दिखाता है। अपनी जरूरतों के आधार पर चुनें:

- **Default model**: मजबूत निजी reasoning और vision के लिए `venice/kimi-k2-5`।
- **High-capability option**: सबसे मजबूत अनामित Venice path के लिए `venice/claude-opus-4-6`।
- **गोपनीयता**: पूरी तरह निजी inference के लिए "निजी" models चुनें।
- **Capability**: Venice के proxy के माध्यम से Claude, GPT, Gemini तक पहुंचने के लिए "अनामित" models चुनें।

अपना default model कभी भी बदलें:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

सभी उपलब्ध models सूचीबद्ध करें:

```bash
openclaw models list --all --provider venice
```

आप `openclaw configure` भी चला सकते हैं, **Model/auth** चुन सकते हैं, और **Venice AI** चुन सकते हैं।

<Tip>
अपने use case के लिए सही model चुनने हेतु नीचे दी गई table का उपयोग करें।

| Use Case | Recommended Model | क्यों |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **सामान्य chat (default)** | `kimi-k2-5` | मजबूत निजी reasoning और vision |
| **सर्वश्रेष्ठ कुल गुणवत्ता** | `claude-opus-4-6` | सबसे मजबूत अनामित Venice option |
| **गोपनीयता + coding** | `qwen3-coder-480b-a35b-instruct` | बड़े context वाला निजी coding model |
| **निजी vision** | `kimi-k2-5` | निजी mode छोड़े बिना vision support |
| **तेज + सस्ता** | `qwen3-4b` | हल्का reasoning model |
| **जटिल निजी tasks** | `deepseek-v3.2` | मजबूत reasoning, लेकिन Venice tool support नहीं |
| **बिना सेंसर** | `venice-uncensored` | कोई content restrictions नहीं |

</Tip>

## DeepSeek V4 replay व्यवहार

यदि Venice `venice/deepseek-v4-pro` या
`venice/deepseek-v4-flash` जैसे DeepSeek V4 models expose करता है, तो OpenClaw proxy द्वारा इसे
छोड़े जाने पर assistant messages पर आवश्यक DeepSeek V4
`reasoning_content` replay placeholder भरता है। Venice DeepSeek के native top-level `thinking` control को reject करता है, इसलिए
OpenClaw उस provider-specific replay fix को native
DeepSeek provider के thinking controls से अलग रखता है।

## Built-in catalog (कुल 41)

<AccordionGroup>
  <Accordion title="Private models (26) — fully private, no logging">
    | Model ID | नाम | Context | विशेषताएं |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5` | Kimi K2.5 | 256k | Default, reasoning, vision |
    | `kimi-k2-thinking` | Kimi K2 Thinking | 256k | Reasoning |
    | `llama-3.3-70b` | Llama 3.3 70B | 128k | General |
    | `llama-3.2-3b` | Llama 3.2 3B | 128k | General |
    | `hermes-3-llama-3.1-405b` | Hermes 3 Llama 3.1 405B | 128k | General, tools disabled |
    | `qwen3-235b-a22b-thinking-2507` | Qwen3 235B Thinking | 128k | Reasoning |
    | `qwen3-235b-a22b-instruct-2507` | Qwen3 235B Instruct | 128k | General |
    | `qwen3-coder-480b-a35b-instruct` | Qwen3 Coder 480B | 256k | Coding |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo | 256k | Coding |
    | `qwen3-5-35b-a3b` | Qwen3.5 35B A3B | 256k | Reasoning, vision |
    | `qwen3-next-80b` | Qwen3 Next 80B | 256k | General |
    | `qwen3-vl-235b-a22b` | Qwen3 VL 235B (Vision) | 256k | Vision |
    | `qwen3-4b` | Venice Small (Qwen3 4B) | 32k | Fast, reasoning |
    | `deepseek-v3.2` | DeepSeek V3.2 | 160k | Reasoning, tools disabled |
    | `venice-uncensored` | Venice Uncensored (Dolphin-Mistral) | 32k | Uncensored, tools disabled |
    | `mistral-31-24b` | Venice Medium (Mistral) | 128k | Vision |
    | `google-gemma-3-27b-it` | Google Gemma 3 27B Instruct | 198k | Vision |
    | `openai-gpt-oss-120b` | OpenAI GPT OSS 120B | 128k | General |
    | `nvidia-nemotron-3-nano-30b-a3b` | NVIDIA Nemotron 3 Nano 30B | 128k | General |
    | `olafangensan-glm-4.7-flash-heretic` | GLM 4.7 Flash Heretic | 128k | Reasoning |
    | `zai-org-glm-4.6` | GLM 4.6 | 198k | General |
    | `zai-org-glm-4.7` | GLM 4.7 | 198k | Reasoning |
    | `zai-org-glm-4.7-flash` | GLM 4.7 Flash | 128k | Reasoning |
    | `zai-org-glm-5` | GLM 5 | 198k | Reasoning |
    | `minimax-m21` | MiniMax M2.1 | 198k | Reasoning |
    | `minimax-m25` | MiniMax M2.5 | 198k | Reasoning |
  </Accordion>

  <Accordion title="Anonymized models (12) — via Venice proxy">
    | Model ID | नाम | Context | विशेषताएं |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6` | Claude Opus 4.6 (Venice के माध्यम से) | 1M | Reasoning, vision |
    | `claude-sonnet-4-6` | Claude Sonnet 4.6 (Venice के माध्यम से) | 1M | Reasoning, vision |
    | `openai-gpt-54` | GPT-5.4 (Venice के माध्यम से) | 1M | Reasoning, vision |
    | `openai-gpt-53-codex` | GPT-5.3 Codex (Venice के माध्यम से) | 400k | Reasoning, vision, coding |
    | `openai-gpt-52` | GPT-5.2 (Venice के माध्यम से) | 256k | Reasoning |
    | `openai-gpt-52-codex` | GPT-5.2 Codex (Venice के माध्यम से) | 256k | Reasoning, vision, coding |
    | `openai-gpt-4o-2024-11-20` | GPT-4o (Venice के माध्यम से) | 128k | Vision |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (Venice के माध्यम से) | 128k | Vision |
    | `gemini-3-1-pro-preview` | Gemini 3.1 Pro (Venice के माध्यम से) | 1M | Reasoning, vision |
    | `gemini-3-pro-preview` | Gemini 3 Pro (Venice के माध्यम से) | 198k | Reasoning, vision |
    | `gemini-3-flash-preview` | Gemini 3 Flash (Venice के माध्यम से) | 256k | Reasoning, vision |
    | `grok-41-fast` | Grok 4.1 Fast (Venice के माध्यम से) | 1M | Reasoning, vision |
  </Accordion>
</AccordionGroup>

## Model discovery

OpenClaw read-only model listing के लिए manifest-backed Venice seed catalog ship करता है। Runtime refresh अब भी Venice API से models discover कर सकता है, और API unreachable होने पर manifest catalog पर fallback करता है।

`/models` endpoint public है (listing के लिए auth की जरूरत नहीं), लेकिन inference के लिए मान्य API key आवश्यक है।

## Streaming और tool support

| सुविधा              | समर्थन                                              |
| -------------------- | ---------------------------------------------------- |
| **स्ट्रीमिंग**        | सभी मॉडल                                           |
| **फ़ंक्शन कॉलिंग** | अधिकांश मॉडल (API में `supportsFunctionCalling` देखें) |
| **विज़न/इमेज**    | "विज़न" सुविधा से चिह्नित मॉडल                  |
| **JSON मोड**        | `response_format` के ज़रिए समर्थित                      |

## मूल्य निर्धारण

Venice क्रेडिट-आधारित सिस्टम का उपयोग करता है। मौजूदा दरों के लिए [venice.ai/pricing](https://venice.ai/pricing) देखें:

- **निजी मॉडल**: आम तौर पर कम लागत
- **अनामित मॉडल**: सीधे API मूल्य निर्धारण + छोटा Venice शुल्क के समान

### Venice (अनामित) बनाम सीधा API

| पहलू       | Venice (अनामित)           | सीधा API          |
| ------------ | ----------------------------- | ------------------- |
| **गोपनीयता**  | मेटाडेटा हटाया गया, अनामित | आपका खाता लिंक किया गया |
| **विलंबता**  | +10-50ms (प्रॉक्सी)              | सीधा              |
| **सुविधाएं** | अधिकांश सुविधाएं समर्थित       | पूरी सुविधाएं       |
| **बिलिंग**  | Venice क्रेडिट                | प्रदाता बिलिंग    |

## उपयोग के उदाहरण

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## समस्या निवारण

<AccordionGroup>
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    सुनिश्चित करें कि कुंजी `vapi_` से शुरू होती है।

  </Accordion>

  <Accordion title="Model not available">
    Venice मॉडल कैटलॉग गतिशील रूप से अपडेट होता है। वर्तमान में उपलब्ध मॉडल देखने के लिए `openclaw models list` चलाएं। कुछ मॉडल अस्थायी रूप से ऑफ़लाइन हो सकते हैं।
  </Accordion>

  <Accordion title="Connection issues">
    Venice API `https://api.venice.ai/api/v1` पर है। सुनिश्चित करें कि आपका नेटवर्क HTTPS कनेक्शन की अनुमति देता है।
  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [FAQ](/hi/help/faq)।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="Config file example">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल रेफ़रेंस और फेलओवर व्यवहार चुनना।
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI होमपेज और खाता साइनअप।
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    Venice API संदर्भ और डेवलपर दस्तावेज़।
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    मौजूदा Venice क्रेडिट दरें और प्लान।
  </Card>
</CardGroup>
