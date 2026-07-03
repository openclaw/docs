---
read_when:
    - आप कई LLMs के लिए एक ही API कुंजी चाहते हैं
    - आप OpenClaw में OpenRouter के माध्यम से मॉडल चलाना चाहते हैं
    - आप छवि निर्माण के लिए OpenRouter का उपयोग करना चाहते हैं
    - आप संगीत निर्माण के लिए OpenRouter का उपयोग करना चाहते हैं
    - आप वीडियो बनाने के लिए OpenRouter का उपयोग करना चाहते हैं
summary: OpenClaw में कई मॉडलों तक पहुंचने के लिए OpenRouter के एकीकृत API का उपयोग करें
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:38:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter एक **एकीकृत API** प्रदान करता है, जो एक ही endpoint और API key के पीछे कई models को requests route करता है। यह OpenAI-संगत है, इसलिए अधिकांश OpenAI SDKs base URL बदलने पर काम करते हैं।

## शुरू करना

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth onboarding चलाएँ">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw OpenRouter का browser sign-in flow खोलता है, PKCE
        code को OpenRouter API key से exchange करता है, और उस key को default
        OpenRouter auth profile में store करता है। remote/headless hosts पर, OpenClaw
        sign-in URL print करता है और sign in करने के बाद redirect URL paste करने को कहता है।
      </Step>
      <Step title="(वैकल्पिक) किसी विशिष्ट model पर switch करें">
        Onboarding default रूप से `openrouter/auto` पर सेट होता है। बाद में कोई ठोस model चुनें:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="अपनी API key प्राप्त करें">
        [openrouter.ai/keys](https://openrouter.ai/keys) पर API key बनाएँ।
      </Step>
      <Step title="API-key onboarding चलाएँ">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(वैकल्पिक) किसी विशिष्ट model पर switch करें">
        Onboarding default रूप से `openrouter/auto` पर सेट होता है। बाद में कोई ठोस model चुनें:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Config उदाहरण

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Model references

<Note>
Model refs `openrouter/<provider>/<model>` pattern का पालन करते हैं। उपलब्ध
providers और models की पूरी सूची के लिए, [/concepts/model-providers](/hi/concepts/model-providers) देखें।
</Note>

Bundled fallback उदाहरण:

| Model ref                         | Notes                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter automatic routing |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion router     |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI के माध्यम से Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI के माध्यम से Kimi K2.5 |

## Image generation

OpenRouter `image_generate` tool को भी back कर सकता है। `agents.defaults.imageGenerationModel` के अंतर्गत OpenRouter image model का उपयोग करें:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw image requests को OpenRouter के chat completions image API पर `modalities: ["image", "text"]` के साथ भेजता है। Gemini image models को supported `aspectRatio` और `resolution` hints OpenRouter के `image_config` के माध्यम से मिलते हैं। धीमे OpenRouter image models के लिए `agents.defaults.imageGenerationModel.timeoutMs` का उपयोग करें; `image_generate` tool का per-call `timeoutMs` parameter फिर भी प्राथमिकता लेता है।

## Video generation

OpenRouter अपने asynchronous `/videos` API के माध्यम से `video_generate` tool को भी back कर सकता है। `agents.defaults.videoGenerationModel` के अंतर्गत OpenRouter video model का उपयोग करें:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw text-to-video और image-to-video jobs OpenRouter को submit करता है, लौटाए गए `polling_url` को poll करता है, और पूर्ण हुए video को
OpenRouter के `unsigned_urls` या documented job content endpoint से download करता है।
Reference images default रूप से first/last frame images के रूप में भेजी जाती हैं; `reference_image` tag वाली images OpenRouter input references के रूप में भेजी जाती हैं। Bundled `google/veo-3.1-fast` default वर्तमान supported 4/6/8
second durations, `720P`/`1080P` resolutions, और `16:9`/`9:16` aspect
ratios advertise करता है। Video-to-video OpenRouter के लिए registered नहीं है क्योंकि upstream
video generation API फिलहाल text और image references स्वीकार करता है।

## Music generation

OpenRouter chat completions audio output के माध्यम से `music_generate` tool को भी back कर सकता है। `agents.defaults.musicGenerationModel` के अंतर्गत
OpenRouter audio model का उपयोग करें:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Bundled OpenRouter music provider default रूप से
`google/lyria-3-pro-preview` का उपयोग करता है और
`google/lyria-3-clip-preview` भी expose करता है। OpenClaw `modalities: ["text",
"audio"]` भेजता है, streaming enable करता है, streamed audio chunks collect करता है, और
channel delivery के लिए result को generated media के रूप में save करता है। Reference images
shared `music_generate image=...` parameter के माध्यम से Lyria models के लिए
स्वीकार की जाती हैं।

## Text-to-speech

OpenRouter को उसके OpenAI-संगत
`/audio/speech` endpoint के माध्यम से TTS provider के रूप में भी उपयोग किया जा सकता है।

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

यदि `messages.tts.providers.openrouter.apiKey` छोड़ा गया है, तो TTS
`models.providers.openrouter.apiKey`, फिर `OPENROUTER_API_KEY` को reuse करता है।

## Speech-to-text (inbound audio)

OpenRouter shared `tools.media.audio` path के माध्यम से अपने STT endpoint (`/audio/transcriptions`) का उपयोग करके inbound voice/audio attachments को transcribe कर सकता है।
यह किसी भी channel plugin पर लागू होता है जो inbound voice/audio को
media understanding preflight में forward करता है।

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw OpenRouter STT requests को `input_audio` के अंतर्गत base64 audio के साथ JSON के रूप में भेजता है (OpenRouter STT contract), multipart OpenAI form uploads के रूप में नहीं।

## Fusion router

जब आप चाहते हैं कि एक OpenClaw model ref कई
OpenRouter models से parallel में पूछे, OpenRouter उनके उत्तरों का judgment करे, और normal OpenRouter provider endpoint के माध्यम से
एक अंतिम response return करे, तब OpenRouter Fusion का उपयोग करें। क्योंकि
upstream model slug `openrouter/fusion` है, OpenClaw model ref में
OpenClaw provider prefix और upstream OpenRouter namespace दोनों शामिल होते हैं:

```bash
openclaw models set openrouter/openrouter/fusion
```

Fusion के panel और judge को model के `params.extraBody` के माध्यम से configure करें। वे
fields OpenRouter chat-completions request body में forward किए जाते हैं। Fusion
OpenRouter OAuth onboarding या API-key onboarding, दोनों के साथ काम करता है; यदि आप
OAuth का उपयोग करते हैं, तो नीचे दिए गए example से `env.OPENROUTER_API_KEY` line हटा दें।

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` list parallel panel है, और Fusion
plugin config के अंदर `model` judge model है। Fusion को force करने की कोशिश में normal OpenClaw agent/chat turns में top-level `tool_choice` को
`"required"` पर set न करें;
OpenClaw turns में OpenClaw tool definitions शामिल हो सकती हैं, और top-level required
tool choice Fusion router के बजाय उन tools में से किसी एक की मांग कर सकता है। जब
यह Fusion plugin config मौजूद होता है, OpenClaw configured analysis models और judge model के साथ sanitized
system-prompt note भी जोड़ता है, ताकि
agent अपने current Fusion panel के बारे में सवालों का जवाब दे सके। अन्य `extraBody`
fields prompt में copy नहीं किए जाते।

Fusion design के अनुसार धीमा है। OpenRouter वही OpenClaw prompt
कई analysis models को भेज सकता है और फिर final judge/synthesis step चला सकता है, इसलिए latency
आमतौर पर direct single-model request से अधिक होती है। Fusion का उपयोग deliberate,
high-quality answers या escalation paths के लिए करें, इसे
latency-sensitive chat के लिए default न बनाएँ। तेज responses के लिए, panel छोटा रखें और
तेज analysis और judge models चुनें।

Configured ref को one-shot local model call से test करें:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Authentication and headers

OpenRouter पर्दे के पीछे आपकी API key के साथ Bearer token का उपयोग करता है। OpenRouter
OAuth एक PKCE login flow है जो OpenRouter API key issue करता है, इसलिए OpenClaw
result को manual API-key setup path द्वारा उपयोग किए जाने वाले उसी `openrouter:default` API-key auth profile के रूप में store करता है।

Existing install के लिए, full onboarding दोबारा चलाए बिना stored OpenRouter key में sign in करें या rotate करें:

```bash
openclaw models auth login --provider openrouter --method oauth
```

जब आप OpenRouter पर manually बनाई गई key paste करना चाहते हैं, तब
`openclaw models auth login --provider openrouter --method api-key` का उपयोग करें।

Real OpenRouter requests (`https://openrouter.ai/api/v1`) पर, OpenClaw
OpenRouter के documented app-attribution headers भी जोड़ता है:

| Header                    | Value                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
यदि आप OpenRouter provider को किसी अन्य proxy या base URL पर repoint करते हैं, तो OpenClaw
वे OpenRouter-specific headers या Anthropic cache markers inject **नहीं** करता।
</Warning>

## Advanced configuration

<AccordionGroup>
  <Accordion title="Response caching">
    OpenRouter response caching opt-in है। इसे प्रति OpenRouter model
    model params के साथ enable करें:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw `X-OpenRouter-Cache: true` और, configure होने पर,
    `X-OpenRouter-Cache-TTL` भेजता है। `responseCacheClear: true`
    current request के लिए refresh force करता है और replacement response store करता है। Snake_case aliases
    (`response_cache`, `response_cache_ttl_seconds`, और
    `response_cache_clear`) भी स्वीकार किए जाते हैं।

    यह provider prompt caching और OpenRouter के
    Anthropic `cache_control` markers से अलग है। यह केवल verified
    `openrouter.ai` routes पर लागू होता है, custom proxy base URLs पर नहीं।

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Verified OpenRouter routes पर, Anthropic model refs
    OpenRouter-specific Anthropic `cache_control` markers बनाए रखते हैं, जिनका उपयोग OpenClaw
    system/developer prompt blocks पर बेहतर prompt-cache reuse के लिए करता है।
  </Accordion>

  <Accordion title="Anthropic रीज़निंग प्रीफिल">
    सत्यापित OpenRouter मार्गों पर, रीज़निंग सक्षम Anthropic मॉडल रेफ़
    अनुरोध के OpenRouter तक पहुँचने से पहले अंतिम assistant प्रीफिल टर्न हटा देते हैं,
    जिससे Anthropic की इस आवश्यकता से मेल बना रहता है कि रीज़निंग वार्तालाप
    user टर्न के साथ समाप्त हों।
  </Accordion>

  <Accordion title="सोच / रीज़निंग इंजेक्शन">
    समर्थित गैर-`auto` मार्गों पर, OpenClaw चुने गए सोच स्तर को
    OpenRouter प्रॉक्सी रीज़निंग पेलोड में मैप करता है। असमर्थित मॉडल संकेत और
    `openrouter/auto` उस रीज़निंग इंजेक्शन को छोड़ देते हैं। Hunter Alpha पुराने कॉन्फ़िगर किए गए
    मॉडल रेफ़ के लिए प्रॉक्सी रीज़निंग भी छोड़ देता है क्योंकि OpenRouter
    उस सेवानिवृत्त मार्ग के लिए रीज़निंग फ़ील्ड में अंतिम उत्तर टेक्स्ट
    लौटा सकता था।
  </Accordion>

  <Accordion title="DeepSeek V4 रीज़निंग रीप्ले">
    सत्यापित OpenRouter मार्गों पर, `openrouter/deepseek/deepseek-v4-flash` और
    `openrouter/deepseek/deepseek-v4-pro` रीप्ले किए गए assistant टर्न पर
    अनुपस्थित `reasoning_content` भरते हैं ताकि सोच/टूल वार्तालाप DeepSeek V4 की
    आवश्यक फ़ॉलो-अप आकृति बनाए रखें। OpenClaw इन मार्गों के लिए OpenRouter-समर्थित
    `reasoning.effort` मान भेजता है; निम्न गैर-ऑफ़ स्तर
    `high` पर मैप होते हैं, और पुराने `max` ओवरराइड `xhigh` पर मैप होते हैं।
  </Accordion>

  <Accordion title="केवल OpenAI अनुरोध आकार देना">
    OpenRouter अब भी प्रॉक्सी-शैली वाले OpenAI-संगत पथ से होकर चलता है, इसलिए
    मूल केवल OpenAI अनुरोध आकार देना, जैसे `serviceTier`, Responses `store`,
    OpenAI रीज़निंग-संगत पेलोड, और प्रॉम्प्ट-कैश संकेत आगे नहीं भेजे जाते।
  </Accordion>

  <Accordion title="Gemini-समर्थित मार्ग">
    Gemini-समर्थित OpenRouter रेफ़ प्रॉक्सी-Gemini पथ पर रहते हैं: OpenClaw वहाँ
    Gemini thought-signature स्वच्छता बनाए रखता है, लेकिन मूल Gemini
    रीप्ले सत्यापन या बूटस्ट्रैप पुनर्लेखन सक्षम नहीं करता।
  </Accordion>

  <Accordion title="प्रदाता रूटिंग मेटाडेटा">
    OpenRouter अंतर्निहित प्रदाता रूटिंग के लिए `provider` अनुरोध ऑब्जेक्ट
    का समर्थन करता है। सभी OpenRouter टेक्स्ट-मॉडल अनुरोधों के लिए
    `models.providers.openrouter.params.provider` के साथ एक डिफ़ॉल्ट नीति कॉन्फ़िगर करें:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw उस ऑब्जेक्ट को अनुरोध `provider` पेलोड के रूप में OpenRouter को
    आगे भेजता है। OpenRouter के दस्तावेज़ित snake_case फ़ील्ड का उपयोग करें, जिनमें `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr`, और `enforce_distillable_text` शामिल हैं।

    प्रति-मॉडल पैरामीटर अब भी प्रदाता-व्यापी रूटिंग ऑब्जेक्ट को ओवरराइड करते हैं:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    यह केवल OpenRouter chat-completions मार्गों पर लागू होता है। सीधे Anthropic,
    Google, OpenAI, या कस्टम प्रदाता मार्ग OpenRouter रूटिंग पैरामीटर को अनदेखा करते हैं।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल रेफ़, और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    एजेंटों, मॉडलों, और प्रदाताओं के लिए पूर्ण कॉन्फ़िग संदर्भ।
  </Card>
</CardGroup>
