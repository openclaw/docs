---
read_when:
    - आप Moonshot K2 (Moonshot Open Platform) बनाम Kimi Coding सेटअप चाहते हैं
    - आपको अलग-अलग एंडपॉइंट, कुंजियाँ और मॉडल संदर्भ समझने होंगे
    - आप किसी भी provider के लिए copy/paste config चाहते हैं
summary: Moonshot K2 बनाम Kimi Coding कॉन्फ़िगर करें (अलग प्रदाता + कुंजियाँ)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-29T00:00:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot OpenAI-संगत endpoints के साथ Kimi API प्रदान करता है। provider को कॉन्फ़िगर करें और डिफ़ॉल्ट मॉडल को `moonshot/kimi-k2.6` पर सेट करें, या `kimi/kimi-for-coding` के साथ Kimi Coding का उपयोग करें।

<Warning>
Moonshot और Kimi Coding **अलग-अलग providers** हैं। कुंजियाँ आपस में बदली नहीं जा सकतीं, endpoints अलग हैं, और model refs अलग हैं (`moonshot/...` बनाम `kimi/...`)।
</Warning>

## अंतर्निहित मॉडल catalog

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | नाम                    | Reasoning | इनपुट      | Context | अधिकतम आउटपुट |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | नहीं      | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | हमेशा चालू | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | नहीं      | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | हाँ       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | हाँ       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | नहीं      | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

वर्तमान Moonshot-होस्टेड K2 मॉडलों के लिए catalog लागत अनुमान Moonshot की प्रकाशित पे-एज़-यू-गो दरों का उपयोग करते हैं: Kimi K2.7 Code $0.19/MTok cache hit, $0.95/MTok input, और $4.00/MTok output है; Kimi K2.6 $0.16/MTok cache hit, $0.95/MTok input, और $4.00/MTok output है; Kimi K2.5 $0.10/MTok cache hit, $0.60/MTok input, और $3.00/MTok output है। अन्य legacy catalog entries शून्य-लागत placeholders रखती हैं, जब तक आप उन्हें config में override नहीं करते।

Kimi K2.7 Code हमेशा native thinking का उपयोग करता है। OpenClaw इस मॉडल के लिए केवल `on` thinking state दिखाता है और Moonshot की आवश्यकता के अनुसार outbound `thinking` और `reasoning_effort` controls को छोड़ देता है। OpenClaw उन sampling overrides को भी छोड़ देता है जिन्हें K2.7 provider defaults पर fix करता है। Kimi K2.6 onboarding default बना रहता है।

## शुरुआत करना

अपना provider चुनें और setup चरणों का पालन करें।

<Tabs>
  <Tab title="Moonshot API">
    **इसके लिए सर्वोत्तम:** Moonshot Open Platform के माध्यम से Kimi K2 models।

    <Steps>
      <Step title="अपना endpoint region चुनें">
        | Auth choice            | Endpoint                       | Region        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | अंतरराष्ट्रीय |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | चीन          |
      </Step>
      <Step title="onboarding चलाएँ">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        या चीन endpoint के लिए:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="डिफ़ॉल्ट model सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="जाँचें कि models उपलब्ध हैं">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="live smoke test चलाएँ">
        जब आप अपनी सामान्य sessions को छुए बिना model access और cost tracking सत्यापित करना चाहते हैं, तो अलग state dir का उपयोग करें:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON response में `provider: "moonshot"` और `model: "kimi-k2.6"` रिपोर्ट होना चाहिए। जब Moonshot usage metadata लौटाता है, assistant transcript entry normalized token usage के साथ estimated cost को `usage.cost` के अंतर्गत संग्रहित करती है।
      </Step>
    </Steps>

    ### Config example

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    आधिकारिक Plugin install करें, फिर Gateway restart करें:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **इसके लिए सर्वोत्तम:** Kimi Coding endpoint के माध्यम से code-केंद्रित tasks।

    <Note>
    Kimi Coding, Moonshot (`moonshot/...`) की तुलना में अलग API key और provider prefix (`kimi/...`) का उपयोग करता है। stable API model ref `kimi/kimi-for-coding` है; legacy refs `kimi/kimi-code` और `kimi/k2p5` accepted रहते हैं और उस API model id में normalize होते हैं।
    </Note>

    <Steps>
      <Step title="Plugin install करें">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="onboarding चलाएँ">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="डिफ़ॉल्ट model सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="जाँचें कि model उपलब्ध है">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Config example

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web search

Moonshot Plugin, Moonshot web search द्वारा समर्थित `web_search` provider के रूप में **Kimi** को भी register करता है।

<Steps>
  <Step title="interactive web search setup चलाएँ">
    ```bash
    openclaw configure --section web
    ```

    web-search section में **Kimi** चुनें ताकि `plugins.entries.moonshot.config.webSearch.*` store हो सके।

  </Step>
  <Step title="web search region और model configure करें">
    Interactive setup इसके लिए prompts देता है:

    | Setting             | Options                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API region          | `https://api.moonshot.ai/v1` (international) or `https://api.moonshot.cn/v1` (China) |
    | Web search model    | Defaults to `kimi-k2.6`                                             |

  </Step>
</Steps>

Config `plugins.entries.moonshot.config.webSearch` के अंतर्गत रहता है:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
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

## उन्नत configuration

<AccordionGroup>
  <Accordion title="Native thinking mode">
    Kimi K2.7 Code हमेशा native thinking का उपयोग करता है। Moonshot clients से इस model के लिए `thinking` field छोड़ने की अपेक्षा करता है, इसलिए OpenClaw केवल `on` दिखाता है और पुराने `off` settings को ignore करता है। K2.7 `temperature`, `top_p`, `n`, `presence_penalty`, और `frequency_penalty` को भी fix करता है; OpenClaw उन fields के configured overrides छोड़ देता है।

    अन्य Moonshot Kimi models binary native thinking support करते हैं:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    इसे प्रति model `agents.defaults.models.<provider/model>.params` के माध्यम से configure करें:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw उन models के लिए runtime `/think` levels map करता है:

    | `/think` level       | Moonshot behavior          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Any non-off level    | `thinking.type=enabled`    |

    <Warning>
    जब Moonshot thinking enabled हो, तो `tool_choice` `auto` या `none` होना चाहिए। OpenClaw incompatible values को `auto` में normalize करता है। इसमें Kimi K2.7 Code शामिल है, जिसका thinking mode pinned tool choice को preserve करने के लिए disabled नहीं किया जा सकता।
    </Warning>

    Kimi K2.6 एक वैकल्पिक `thinking.keep` फ़ील्ड भी स्वीकार करता है, जो
    `reasoning_content` के मल्टी-टर्न प्रतिधारण को नियंत्रित करता है। टर्नों में पूर्ण
    reasoning बनाए रखने के लिए इसे `"all"` पर सेट करें; सर्वर की डिफ़ॉल्ट
    रणनीति का उपयोग करने के लिए इसे छोड़ दें (या `null` रहने दें)। OpenClaw
    केवल `moonshot/kimi-k2.6` के लिए `thinking.keep` आगे भेजता है और
    अन्य मॉडलों से इसे हटा देता है। Kimi K2.7 Code डिफ़ॉल्ट रूप से पूर्ण
    reasoning इतिहास बनाए रखता है, जबकि OpenClaw पूरे `thinking` फ़ील्ड को छोड़ देता है।

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="टूल कॉल आईडी सैनिटाइजेशन">
    Moonshot Kimi नेटिव tool_call ids देता है जिनका आकार `functions.<name>:<index>` जैसा होता है। OpenAI-completions परिवहन के लिए, OpenClaw हर नेटिव Kimi id की पहली उपस्थिति को बनाए रखता है और बाद की डुप्लीकेट ids को निर्धारक OpenAI-शैली वाली `call_*` ids में फिर से लिखता है। मेल खाते टूल परिणामों को उसी id के साथ रीमैप किया जाता है, ताकि रीप्ले Kimi की पहली नेटिव id हटाए बिना अद्वितीय बना रहे।

    किसी कस्टम OpenAI-संगत प्रदाता पर सख्त सैनिटाइजेशन लागू करने के लिए, `sanitizeToolCallIds: true` सेट करें:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="स्ट्रीमिंग उपयोग संगतता">
    नेटिव Moonshot एंडपॉइंट (`https://api.moonshot.ai/v1` और
    `https://api.moonshot.cn/v1`) साझा `openai-completions` परिवहन पर
    स्ट्रीमिंग उपयोग संगतता घोषित करते हैं। OpenClaw इसे एंडपॉइंट
    क्षमताओं से जोड़ता है, इसलिए समान नेटिव Moonshot होस्ट को लक्षित करने वाली
    संगत कस्टम provider ids वही streaming-usage व्यवहार अपनाती हैं।

    कैटलॉग K2.6 मूल्य निर्धारण के साथ, इनपुट, आउटपुट और cache-read टोकन शामिल करने वाला
    स्ट्रीम किया गया उपयोग `/status`, `/usage full`, `/usage cost`, और transcript-backed
    session accounting के लिए स्थानीय अनुमानित USD लागत में भी बदला जाता है।

  </Accordion>

  <Accordion title="एंडपॉइंट और मॉडल ref संदर्भ">
    | प्रदाता   | मॉडल ref prefix | एंडपॉइंट                      | Auth env var        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding endpoint          | `KIMI_API_KEY`      |
    | Web search | N/A              | Moonshot API क्षेत्र जैसा ही   | `KIMI_API_KEY` or `MOONSHOT_API_KEY` |

    - Kimi वेब खोज `KIMI_API_KEY` या `MOONSHOT_API_KEY` का उपयोग करती है, और मॉडल `kimi-k2.6` के साथ डिफ़ॉल्ट रूप से `https://api.moonshot.ai/v1` पर रहती है।
    - जरूरत हो तो `models.providers` में मूल्य निर्धारण और context metadata ओवरराइड करें।
    - यदि Moonshot किसी मॉडल के लिए अलग context limits प्रकाशित करता है, तो `contextWindow` को उसी के अनुसार समायोजित करें।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल refs, और failover व्यवहार चुनना।
  </Card>
  <Card title="वेब खोज" href="/hi/tools/web" icon="magnifying-glass">
    Kimi सहित वेब खोज प्रदाताओं को कॉन्फ़िगर करना।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाताओं, मॉडलों, और plugins के लिए पूर्ण config schema।
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API key प्रबंधन और दस्तावेज़ीकरण।
  </Card>
</CardGroup>
