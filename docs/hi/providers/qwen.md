---
read_when:
    - आप OpenClaw के साथ Qwen का उपयोग करना चाहते हैं
    - आपने पहले Qwen OAuth का उपयोग किया था
summary: OpenClaw Plugin के माध्यम से Qwen Cloud का उपयोग करें
title: Qwen
x-i18n:
    generated_at: "2026-06-29T00:02:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw अब Qwen को canonical id `qwen` वाले प्रथम-श्रेणी प्रदाता Plugin के रूप में मानता है। प्रदाता Plugin Qwen Cloud / Alibaba DashScope और Coding Plan endpoints को लक्षित करता है, compatibility alias के रूप में legacy `modelstudio` ids को चालू रखता है, और प्रदाता `qwen-oauth` के रूप में Qwen Portal token flow भी उजागर करता है।

- प्रदाता: `qwen`
- Portal प्रदाता: [`qwen-oauth`](/hi/providers/qwen-oauth)
- पसंदीदा env var: `QWEN_API_KEY`
- compatibility के लिए ये भी स्वीकार्य हैं: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API शैली: OpenAI-compatible

<Tip>
यदि आप `qwen3.6-plus` चाहते हैं, तो **Standard (pay-as-you-go)** endpoint को प्राथमिकता दें। Coding Plan समर्थन public catalog से पीछे रह सकता है।
</Tip>

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway restart करें:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## शुरू करना

अपना plan type चुनें और setup steps का पालन करें।

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **इसके लिए सर्वोत्तम:** Qwen Coding Plan के माध्यम से subscription-based access।

    <Steps>
      <Step title="अपनी API key प्राप्त करें">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) से API key बनाएं या copy करें।
      </Step>
      <Step title="onboarding चलाएं">
        **Global** endpoint के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **China** endpoint के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="default model सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें कि model उपलब्ध है">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Legacy `modelstudio-*` auth-choice ids और `modelstudio/...` model refs अभी भी
    compatibility aliases के रूप में काम करते हैं, लेकिन नए setup flows को canonical
    `qwen-*` auth-choice ids और `qwen/...` model refs को प्राथमिकता देनी चाहिए। यदि आप किसी अन्य `api` value के साथ exact custom `models.providers.modelstudio` entry define करते हैं, तो वह custom provider Qwen compatibility alias के बजाय `modelstudio/...` refs का owner होगा।
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **इसके लिए सर्वोत्तम:** Standard Model Studio endpoint के माध्यम से pay-as-you-go access, जिसमें `qwen3.6-plus` जैसे models शामिल हैं जो Coding Plan पर उपलब्ध नहीं हो सकते।

    <Steps>
      <Step title="अपनी API key प्राप्त करें">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) से API key बनाएं या copy करें।
      </Step>
      <Step title="onboarding चलाएं">
        **Global** endpoint के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **China** endpoint के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="default model सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें कि model उपलब्ध है">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Legacy `modelstudio-*` auth-choice ids और `modelstudio/...` model refs अभी भी
    compatibility aliases के रूप में काम करते हैं, लेकिन नए setup flows को canonical
    `qwen-*` auth-choice ids और `qwen/...` model refs को प्राथमिकता देनी चाहिए। यदि आप किसी अन्य `api` value के साथ exact custom `models.providers.modelstudio` entry define करते हैं, तो वह custom provider Qwen compatibility alias के बजाय `modelstudio/...` refs का owner होगा।
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **इसके लिए सर्वोत्तम:** `https://portal.qwen.ai/v1` के विरुद्ध Qwen Portal token।

    समर्पित provider page और migration notes के लिए [Qwen OAuth / Portal](/hi/providers/qwen-oauth) देखें।

    <Steps>
      <Step title="अपना portal token दें">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="default model सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें कि model उपलब्ध है">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` DashScope provider जैसा ही `QWEN_API_KEY` env var नाम उपयोग करता है, लेकिन OpenClaw onboarding के माध्यम से configure किए जाने पर auth को `qwen-oauth` provider id के अंतर्गत store करता है।
    </Note>

  </Tab>
</Tabs>

## Plan types और endpoints

| Plan                       | क्षेत्र | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

Provider आपके auth choice के आधार पर endpoint auto-select करता है। Canonical choices `qwen-*` family का उपयोग करते हैं; `modelstudio-*` केवल compatibility के लिए रहता है। आप config में custom `baseUrl` से override कर सकते हैं।

<Tip>
**keys manage करें:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Docs:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Built-in catalog

OpenClaw currently यह Qwen static catalog ship करता है। Configured catalog endpoint-aware है: Coding Plan configs उन models को omit करते हैं जिनके बारे में केवल Standard endpoint पर काम करने की जानकारी है।

| Model ref                   | Input       | Context   | Notes                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | पाठ, छवि | 1,000,000 | Default model                                      |
| `qwen/qwen3.6-plus`         | पाठ, छवि | 1,000,000 | जब आपको इस model की आवश्यकता हो, तो Standard endpoints को प्राथमिकता दें |
| `qwen/qwen3-max-2026-01-23` | पाठ        | 262,144   | Qwen Max line                                      |
| `qwen/qwen3-coder-next`     | पाठ        | 262,144   | कोडिंग                                             |
| `qwen/qwen3-coder-plus`     | पाठ        | 1,000,000 | कोडिंग                                             |
| `qwen/MiniMax-M2.5`         | पाठ        | 1,000,000 | Reasoning enabled                                  |
| `qwen/glm-5`                | पाठ        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | पाठ        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | पाठ, छवि | 262,144   | Alibaba के माध्यम से Moonshot AI                            |
| `qwen-oauth/qwen3.5-plus`   | पाठ, छवि | 1,000,000 | Qwen Portal default                                |

<Note>
किसी model के static catalog में मौजूद होने पर भी availability endpoint और billing plan के अनुसार अलग-अलग हो सकती है।
</Note>

## Thinking Controls

Reasoning-enabled Qwen Cloud models के लिए, provider OpenClaw thinking levels को DashScope के top-level `enable_thinking` request flag पर map करता है। Disabled thinking `enable_thinking: false` भेजता है; अन्य thinking levels `enable_thinking: true` भेजते हैं।

## Multimodal add-ons

`qwen` Plugin **Standard** DashScope endpoints पर multimodal capabilities भी expose करता है (Coding Plan endpoints पर नहीं):

- `qwen-vl-max-latest` के माध्यम से **video understanding**
- `wan2.6-t2v` (default), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v` के माध्यम से **Wan video generation**

Qwen को default video provider के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Shared tool parameters, provider selection, और failover behavior के लिए [Video Generation](/hi/tools/video-generation) देखें।
</Note>

## Advanced configuration

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Qwen Plugin images और video के लिए **Standard** DashScope endpoints पर media understanding register करता है (Coding Plan endpoints पर नहीं)।

    | Property      | Value                 |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Supported input | Images, video       |

    Media understanding configured Qwen auth से auto-resolve होती है — कोई additional config आवश्यक नहीं है। Media understanding support के लिए सुनिश्चित करें कि आप Standard (pay-as-you-go) endpoint उपयोग कर रहे हैं।

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` Standard (pay-as-you-go) Model Studio endpoints पर उपलब्ध है:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    यदि Coding Plan endpoints `qwen3.6-plus` के लिए "unsupported model" error लौटाते हैं, तो Coding Plan endpoint/key pair के बजाय Standard (pay-as-you-go) पर switch करें।

    OpenClaw का Qwen static catalog Coding Plan endpoints पर `qwen3.6-plus` advertise नहीं करता, लेकिन `models.providers.qwen.models` के अंतर्गत explicitly configured `qwen/qwen3.6-plus` entries को Coding Plan baseUrls पर honor किया जाता है, इसलिए यदि Aliyun इसे आपके subscription पर enable करता है तो आप उस model को opt in कर सकते हैं। Upstream API फिर भी तय करता है कि call सफल होगी या नहीं।

  </Accordion>

  <Accordion title="Capability plan">
    `qwen` Plugin को केवल coding/text models के बजाय पूरे Qwen Cloud surface के लिए vendor home के रूप में position किया जा रहा है।

    - **Text/chat models:** Plugin के माध्यम से उपलब्ध
    - **Tool calling, structured output, thinking:** OpenAI-compatible transport से inherited
    - **Image generation:** provider-Plugin layer पर planned
    - **Image/video understanding:** Standard endpoint पर Plugin के माध्यम से उपलब्ध
    - **Speech/audio:** provider-Plugin layer पर planned
    - **Memory embeddings/reranking:** embedding adapter surface के माध्यम से planned
    - **Video generation:** shared video-generation capability के माध्यम से Plugin के जरिए उपलब्ध

  </Accordion>

  <Accordion title="Video generation details">
    Video generation के लिए, OpenClaw job submit करने से पहले configured Qwen region को matching DashScope AIGC host पर map करता है:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    इसका अर्थ है कि Coding Plan या Standard Qwen hosts में से किसी की ओर point करने वाला सामान्य `models.providers.qwen.baseUrl` फिर भी video generation को सही regional DashScope video endpoint पर रखता है।

    Current Qwen video-generation limits:

    - प्रति request **1** output video तक
    - **1** input image तक
    - **4** input videos तक
    - **10 seconds** duration तक
    - `size`, `aspectRatio`, `resolution`, `audio`, और `watermark` का समर्थन करता है
    - Reference image/video mode को currently **remote http(s) URLs** चाहिए। Local file paths को पहले ही reject कर दिया जाता है क्योंकि DashScope video endpoint उन references के लिए uploaded local buffers स्वीकार नहीं करता।

  </Accordion>

  <Accordion title="स्ट्रीमिंग उपयोग संगतता">
    नेटिव Model Studio एंडपॉइंट साझा `openai-completions` ट्रांसपोर्ट पर
    स्ट्रीमिंग उपयोग संगतता घोषित करते हैं। OpenClaw अब इसे एंडपॉइंट
    क्षमताओं के आधार पर तय करता है, इसलिए उन्हीं नेटिव होस्ट को लक्षित करने वाले
    DashScope-संगत कस्टम provider id, विशेष रूप से बिल्ट-इन `qwen` provider id
    की आवश्यकता के बजाय, वही स्ट्रीमिंग-उपयोग व्यवहार विरासत में लेते हैं।

    नेटिव-स्ट्रीमिंग उपयोग संगतता Coding Plan होस्ट और Standard
    DashScope-संगत होस्ट, दोनों पर लागू होती है:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="मल्टीमोडल एंडपॉइंट क्षेत्र">
    मल्टीमोडल सतहें (वीडियो समझना और Wan वीडियो जनरेशन)
    **Standard** DashScope एंडपॉइंट का उपयोग करती हैं, Coding Plan एंडपॉइंट का नहीं:

    - Global/Intl Standard बेस URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard बेस URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="पर्यावरण और डेमन सेटअप">
    यदि Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `QWEN_API_KEY`
    उस प्रक्रिया के लिए उपलब्ध हो (उदाहरण के लिए, `~/.openclaw/.env` में या
    `env.shellEnv` के माध्यम से)।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    provider, model refs, और failover व्यवहार चुनना।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और provider चयन।
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/hi/providers/alibaba" icon="cloud">
    लेगेसी ModelStudio provider और माइग्रेशन नोट्स।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्या निवारण और FAQ।
  </Card>
</CardGroup>
