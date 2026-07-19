---
read_when:
    - आप OpenClaw में गोपनीयता-केंद्रित इन्फ़रेंस चाहते हैं
    - आप Venice AI सेटअप मार्गदर्शन चाहते हैं
summary: OpenClaw में Venice AI के गोपनीयता-केंद्रित मॉडल का उपयोग करें
title: Venice AI
x-i18n:
    generated_at: "2026-07-19T09:19:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 13c32b783394eb3092ff94a532b69e34c00624127b0e76e4e2812751d39073a1
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) गोपनीयता-केंद्रित इन्फ़रेंस प्रदान करता है: ओपन मॉडल
बिना किसी लॉगिंग के चलते हैं, साथ ही Claude, GPT, Gemini और Grok तक अनामीकृत प्रॉक्सी पहुँच मिलती है।
सभी एंडपॉइंट OpenAI-संगत हैं (`/v1`)।

## गोपनीयता मोड

| मोड           | व्यवहार                                                         | मॉडल                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **निजी**    | प्रॉम्प्ट/प्रतिक्रियाएँ कभी संग्रहीत या लॉग नहीं की जातीं। अल्पकालिक।         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored आदि। |
| **अनामीकृत** | अग्रेषित करने से पहले मेटाडेटा हटाकर Venice के माध्यम से प्रॉक्सी किया जाता है। | Claude, GPT, Gemini, Grok                                     |

<Warning>
अनामीकृत मॉडल पूरी तरह निजी नहीं होते। Venice अग्रेषित करने से पहले मेटाडेटा हटा देता है, लेकिन अंतर्निहित प्रदाता (OpenAI, Anthropic, Google, xAI) फिर भी अनुरोध को संसाधित करता है। जब पूर्ण गोपनीयता आवश्यक हो, तब निजी मॉडल का उपयोग करें।
</Warning>

## आरंभ करना

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="अपनी API कुंजी प्राप्त करें">
    1. [venice.ai](https://venice.ai) पर साइन अप करें
    2. **Settings > API Keys > Create new key** पर जाएँ
    3. अपनी API कुंजी कॉपी करें (प्रारूप: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="OpenClaw कॉन्फ़िगर करें">
    <Tabs>
      <Tab title="इंटरैक्टिव (अनुशंसित)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        API कुंजी माँगता है (या मौजूदा `VENICE_API_KEY` का पुनः उपयोग करता है), उपलब्ध Venice मॉडल सूचीबद्ध करता है और आपका डिफ़ॉल्ट मॉडल सेट करता है।
      </Tab>
      <Tab title="परिवेश चर">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="गैर-इंटरैक्टिव">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="सेटअप सत्यापित करें">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "नमस्ते, क्या आप काम कर रहे हैं?"
    ```
  </Step>
</Steps>

## मॉडल चयन

- **डिफ़ॉल्ट**: `venice/kimi-k2-5` (निजी, रीजनिंग, विज़न)।
- **सबसे शक्तिशाली अनामीकृत विकल्प**: `venice/claude-opus-4-6`।

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

आप `openclaw configure` भी चला सकते हैं और **मॉडल/प्रमाणीकरण प्रदाता > Venice AI** चुन सकते हैं।

<Tip>
| उपयोग का मामला              | मॉडल                                        | कारण                                    |
| --------------------- | -------------------------------------------- | -------------------------------------- |
| सामान्य चैट (डिफ़ॉल्ट) | `kimi-k2-5`                                  | विज़न के साथ शक्तिशाली निजी रीजनिंग   |
| समग्र रूप से सर्वोत्तम गुणवत्ता   | `claude-opus-4-6`                            | सबसे शक्तिशाली अनामीकृत Venice विकल्प     |
| गोपनीयता + कोडिंग       | `qwen3-coder-480b-a35b-instruct-turbo`       | बड़े कॉन्टेक्स्ट वाला निजी कोडिंग मॉडल |
| तेज़ + सस्ता           | `llama-3.2-3b`                               | संक्षिप्त निजी मॉडल                  |
| जटिल निजी कार्य  | `deepseek-v3.2`                              | शक्तिशाली रीजनिंग; टूल कॉलिंग अक्षम |
| सेंसर-रहित             | `venice-uncensored-1-2`                      | वर्तमान सेंसर-रहित Venice मॉडल        |
</Tip>

## अंतर्निहित कैटलॉग (30 मॉडल)

<AccordionGroup>
  <Accordion title="निजी मॉडल (20) — पूरी तरह निजी, कोई लॉगिंग नहीं">
    | मॉडल ID                               | नाम                                 | कॉन्टेक्स्ट | टिप्पणियाँ                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | डिफ़ॉल्ट, रीजनिंग, विज़न  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | सामान्य                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | सामान्य                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | सामान्य, टूल अक्षम     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | रीजनिंग                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | सामान्य                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | कोडिंग                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | रीजनिंग, विज़न           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | सामान्य                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k    | विज़न                      |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | रीजनिंग, टूल अक्षम    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | विज़न                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | सामान्य                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | सामान्य                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | रीजनिंग                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | सामान्य                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | रीजनिंग                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | रीजनिंग                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | रीजनिंग                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | रीजनिंग                    |
  </Accordion>

  <Accordion title="अनामीकृत मॉडल (10) — Venice प्रॉक्सी के माध्यम से">
    | मॉडल ID                        | नाम                           | कॉन्टेक्स्ट | टिप्पणियाँ                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (Venice के माध्यम से)    | 1M      | रीजनिंग, विज़न            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (Venice के माध्यम से)  | 1M      | रीजनिंग, विज़न            |
    | `openai-gpt-54`                 | GPT-5.4 (Venice के माध्यम से)            | 1M      | रीजनिंग, विज़न            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (Venice के माध्यम से)      | 400k    | रीजनिंग, विज़न, कोडिंग     |
    | `openai-gpt-52`                 | GPT-5.2 (Venice के माध्यम से)            | 256k    | रीजनिंग                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (Venice के माध्यम से)      | 256k    | रीजनिंग, विज़न, कोडिंग     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (Venice के माध्यम से)             | 128k    | विज़न                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (Venice के माध्यम से)        | 128k    | विज़न                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (Venice के माध्यम से)     | 1M      | रीजनिंग, विज़न             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (Venice के माध्यम से)     | 256k    | रीजनिंग, विज़न             |
  </Accordion>
</AccordionGroup>

Grok-समर्थित Venice मॉडल (`grok-4-3` और इसी तरह के) को मूल xAI प्रदाता के समान टूल-स्कीमा
संगतता पैच मिलता है, क्योंकि वे समान अपस्ट्रीम
टूल-कॉल प्रारूप साझा करते हैं।

## मॉडल खोज

ऊपर दिया गया बंडल कैटलॉग मैनिफ़ेस्ट-समर्थित प्रारंभिक सूची है। रनटाइम पर OpenClaw
इसे Venice `/models` API से रीफ़्रेश करता है और API तक नहीं पहुँचा जा सकने पर
प्रारंभिक सूची पर वापस लौटता है। `/models` एंडपॉइंट सार्वजनिक है (सूचीबद्ध करने के लिए
प्रमाणीकरण की आवश्यकता नहीं), लेकिन इन्फ़रेंस के लिए एक मान्य API कुंजी आवश्यक है।

Venice, प्रदाता-स्वामित्व वाले उपनामों के रूप में सेवानिवृत्त मॉडल ID स्वीकार करना जारी रख सकता है।
OpenClaw कैटलॉग केवल `/models` द्वारा लौटाए गए कैनोनिकल मॉडल ID प्रदर्शित करता है।

## DeepSeek V4 रीप्ले व्यवहार

यदि Venice, `deepseek-v4-pro` या
`deepseek-v4-flash` जैसे DeepSeek V4 मॉडल उपलब्ध कराता है, तो Venice द्वारा छोड़े जाने पर OpenClaw सहायक संदेशों में आवश्यक `reasoning_content` रीप्ले
फ़ील्ड भरता है और अनुरोध पेलोड से `thinking`/
`reasoning`/`reasoning_effort` हटा देता है (Venice इन मॉडलों पर
DeepSeek के मूल `thinking` नियंत्रण को अस्वीकार करता है)। यह रीप्ले सुधार
मूल DeepSeek प्रदाता के अपने थिंकिंग नियंत्रणों से अलग है।

## स्ट्रीमिंग और टूल समर्थन

| सुविधा          | समर्थन                                           |
| ---------------- | ------------------------------------------------- |
| स्ट्रीमिंग        | सभी मॉडल                                        |
| फ़ंक्शन कॉलिंग | अधिकांश मॉडल; जहाँ ऊपर उल्लेख किया गया है वहाँ प्रति-मॉडल अक्षम |
| विज़न/चित्र    | ऊपर "Vision" चिह्नित मॉडल                      |
| JSON मोड        | `response_format` के माध्यम से                             |

## मूल्य निर्धारण

Venice क्रेडिट-आधारित प्रणाली का उपयोग करता है। अनामीकृत मॉडलों की लागत लगभग
प्रत्यक्ष API मूल्य और एक छोटे Venice शुल्क के योग के बराबर होती है। वर्तमान दरों के लिए
[venice.ai/pricing](https://venice.ai/pricing) देखें।

## उपयोग के उदाहरण

```bash
# डिफ़ॉल्ट निजी मॉडल
openclaw agent --model venice/kimi-k2-5 --message "त्वरित स्वास्थ्य जाँच"

# Venice के माध्यम से Claude Opus (अनामीकृत)
openclaw agent --model venice/claude-opus-4-6 --message "इस कार्य का सारांश दें"

# सेंसर-रहित मॉडल
openclaw agent --model venice/venice-uncensored-1-2 --message "विकल्पों का प्रारूप तैयार करें"

# चित्र के साथ विज़न मॉडल
openclaw agent --model venice/qwen3-vl-235b-a22b --message "संलग्न चित्र की समीक्षा करें"

# कोडिंग मॉडल
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct-turbo --message "इस फ़ंक्शन को रीफ़ैक्टर करें"
```

## समस्या निवारण

<AccordionGroup>
  <Accordion title="API कुंजी पहचानी नहीं गई">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    पुष्टि करें कि कुंजी `vapi_` से शुरू होती है।

  </Accordion>

  <Accordion title="मॉडल उपलब्ध नहीं है">
    वर्तमान में उपलब्ध मॉडल देखने के लिए `openclaw models list --all --provider venice` चलाएँ;
    Venice द्वारा मॉडल जोड़ने या सेवानिवृत्त करने पर कैटलॉग बदलता है।
  </Accordion>

  <Accordion title="कनेक्शन संबंधी समस्याएँ">
    Venice API `https://api.venice.ai/api/v1` पर है। पुष्टि करें कि आपका नेटवर्क उस होस्ट के लिए HTTPS की अनुमति देता है।
  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq)।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="कॉन्फ़िगरेशन फ़ाइल का उदाहरण">
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
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI का मुखपृष्ठ और खाता पंजीकरण।
  </Card>
  <Card title="API दस्तावेज़" href="https://docs.venice.ai" icon="book">
    Venice API संदर्भ और डेवलपर दस्तावेज़।
  </Card>
  <Card title="मूल्य निर्धारण" href="https://venice.ai/pricing" icon="credit-card">
    Venice की वर्तमान क्रेडिट दरें और योजनाएँ।
  </Card>
</CardGroup>
