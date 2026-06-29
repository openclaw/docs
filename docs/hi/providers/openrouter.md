---
read_when:
    - आप कई LLMs के लिए एक ही API कुंजी चाहते हैं
    - आप OpenClaw में OpenRouter के माध्यम से मॉडल चलाना चाहते हैं
    - आप छवि निर्माण के लिए OpenRouter का उपयोग करना चाहते हैं
    - आप संगीत निर्माण के लिए OpenRouter का उपयोग करना चाहते हैं
    - आप वीडियो जनरेशन के लिए OpenRouter का उपयोग करना चाहते हैं
summary: OpenClaw में कई मॉडल तक पहुँचने के लिए OpenRouter की एकीकृत API का उपयोग करें
title: OpenRouter
x-i18n:
    generated_at: "2026-06-29T00:02:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter एक **एकीकृत API** प्रदान करता है, जो एक ही एंडपॉइंट और API कुंजी के पीछे कई मॉडलों तक अनुरोधों को रूट करता है। यह OpenAI-संगत है, इसलिए अधिकांश OpenAI SDK बेस URL बदलकर काम करते हैं।

## शुरू करना

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw OpenRouter का ब्राउज़र साइन-इन फ़्लो खोलता है, PKCE कोड को OpenRouter API कुंजी से एक्सचेंज करता है, और उस कुंजी को डिफ़ॉल्ट OpenRouter ऑथ प्रोफ़ाइल में संग्रहीत करता है। रिमोट/हेडलेस होस्ट पर, OpenClaw साइन-इन URL प्रिंट करता है और साइन-इन करने के बाद आपसे रीडायरेक्ट URL पेस्ट करने को कहता है।
      </Step>
      <Step title="(वैकल्पिक) किसी विशिष्ट मॉडल पर स्विच करें">
        ऑनबोर्डिंग डिफ़ॉल्ट रूप से `openrouter/auto` का उपयोग करती है। बाद में कोई ठोस मॉडल चुनें:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API कुंजी">
    <Steps>
      <Step title="अपनी API कुंजी प्राप्त करें">
        [openrouter.ai/keys](https://openrouter.ai/keys) पर API कुंजी बनाएँ।
      </Step>
      <Step title="API-कुंजी ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(वैकल्पिक) किसी विशिष्ट मॉडल पर स्विच करें">
        ऑनबोर्डिंग डिफ़ॉल्ट रूप से `openrouter/auto` का उपयोग करती है। बाद में कोई ठोस मॉडल चुनें:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## कॉन्फ़िग उदाहरण

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

## मॉडल संदर्भ

<Note>
मॉडल रेफ़रेंस `openrouter/<provider>/<model>` पैटर्न का पालन करते हैं। उपलब्ध प्रदाताओं और मॉडलों की पूरी सूची के लिए, [/concepts/model-providers](/hi/concepts/model-providers) देखें।
</Note>

बंडल किए गए फ़ॉलबैक उदाहरण:

| मॉडल रेफ़रेंस                    | नोट्स                         |
| --------------------------------- | ----------------------------- |
| `openrouter/auto`                 | OpenRouter स्वचालित रूटिंग    |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion राउटर       |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI के माध्यम से Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI के माध्यम से Kimi K2.5 |

## छवि जनरेशन

OpenRouter `image_generate` टूल को भी बैक कर सकता है। `agents.defaults.imageGenerationModel` के अंतर्गत OpenRouter छवि मॉडल का उपयोग करें:

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

OpenClaw `modalities: ["image", "text"]` के साथ OpenRouter के चैट कम्प्लीशन्स छवि API को छवि अनुरोध भेजता है। Gemini छवि मॉडल OpenRouter के `image_config` के माध्यम से समर्थित `aspectRatio` और `resolution` संकेत प्राप्त करते हैं। धीमे OpenRouter छवि मॉडलों के लिए `agents.defaults.imageGenerationModel.timeoutMs` का उपयोग करें; `image_generate` टूल का प्रति-कॉल `timeoutMs` पैरामीटर फिर भी प्राथमिकता लेता है।

## वीडियो जनरेशन

OpenRouter अपने असिंक्रोनस `/videos` API के माध्यम से `video_generate` टूल को भी बैक कर सकता है। `agents.defaults.videoGenerationModel` के अंतर्गत OpenRouter वीडियो मॉडल का उपयोग करें:

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

OpenClaw टेक्स्ट-टू-वीडियो और इमेज-टू-वीडियो जॉब OpenRouter को सबमिट करता है, लौटाए गए `polling_url` को पोल करता है, और पूरा वीडियो OpenRouter के `unsigned_urls` या दस्तावेज़ित जॉब कंटेंट एंडपॉइंट से डाउनलोड करता है। संदर्भ छवियाँ डिफ़ॉल्ट रूप से पहली/आख़िरी फ़्रेम छवियों के रूप में भेजी जाती हैं; `reference_image` से टैग की गई छवियाँ OpenRouter इनपुट रेफ़रेंस के रूप में भेजी जाती हैं। बंडल किया गया `google/veo-3.1-fast` डिफ़ॉल्ट वर्तमान में समर्थित 4/6/8 सेकंड अवधि, `720P`/`1080P` रिज़ॉल्यूशन, और `16:9`/`9:16` आस्पेक्ट रेशियो घोषित करता है। OpenRouter के लिए वीडियो-टू-वीडियो पंजीकृत नहीं है क्योंकि अपस्ट्रीम वीडियो जनरेशन API वर्तमान में टेक्स्ट और छवि रेफ़रेंस स्वीकार करता है।

## संगीत जनरेशन

OpenRouter चैट कम्प्लीशन्स ऑडियो आउटपुट के माध्यम से `music_generate` टूल को भी बैक कर सकता है। `agents.defaults.musicGenerationModel` के अंतर्गत OpenRouter ऑडियो मॉडल का उपयोग करें:

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

बंडल किया गया OpenRouter संगीत प्रदाता डिफ़ॉल्ट रूप से `google/lyria-3-pro-preview` का उपयोग करता है और `google/lyria-3-clip-preview` भी उपलब्ध कराता है। OpenClaw `modalities: ["text", "audio"]` भेजता है, स्ट्रीमिंग सक्षम करता है, स्ट्रीम किए गए ऑडियो चंक एकत्र करता है, और परिणाम को चैनल डिलीवरी के लिए जनरेटेड मीडिया के रूप में सहेजता है। संदर्भ छवियाँ साझा `music_generate image=...` पैरामीटर के माध्यम से Lyria मॉडलों के लिए स्वीकार की जाती हैं।

## टेक्स्ट-टू-स्पीच

OpenRouter को उसके OpenAI-संगत `/audio/speech` एंडपॉइंट के माध्यम से TTS प्रदाता के रूप में भी उपयोग किया जा सकता है।

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

यदि `messages.tts.providers.openrouter.apiKey` छोड़ा गया है, तो TTS `models.providers.openrouter.apiKey`, फिर `OPENROUTER_API_KEY` का फिर से उपयोग करता है।

## स्पीच-टू-टेक्स्ट (इनबाउंड ऑडियो)

OpenRouter साझा `tools.media.audio` पथ के माध्यम से अपने STT एंडपॉइंट (`/audio/transcriptions`) का उपयोग करके इनबाउंड वॉइस/ऑडियो अटैचमेंट ट्रांसक्राइब कर सकता है। यह किसी भी चैनल Plugin पर लागू होता है जो इनबाउंड वॉइस/ऑडियो को मीडिया अंडरस्टैंडिंग प्रीफ़्लाइट में फ़ॉरवर्ड करता है।

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

OpenClaw OpenRouter STT अनुरोधों को `input_audio` के अंतर्गत base64 ऑडियो वाले JSON के रूप में भेजता है (OpenRouter STT अनुबंध), multipart OpenAI फ़ॉर्म अपलोड के रूप में नहीं।

## Fusion राउटर

OpenRouter Fusion का उपयोग तब करें जब आप चाहते हों कि एक OpenClaw मॉडल रेफ़ कई OpenRouter मॉडलों से समानांतर में पूछे, OpenRouter उनके उत्तरों का मूल्यांकन करे, और सामान्य OpenRouter प्रदाता एंडपॉइंट के माध्यम से एक अंतिम प्रतिक्रिया लौटाए। क्योंकि अपस्ट्रीम मॉडल स्लग `openrouter/fusion` है, OpenClaw मॉडल रेफ़ में OpenClaw प्रदाता प्रीफ़िक्स और अपस्ट्रीम OpenRouter नेमस्पेस दोनों शामिल होते हैं:

```bash
openclaw models set openrouter/openrouter/fusion
```

Fusion का पैनल और जज मॉडल के `params.extraBody` के माध्यम से कॉन्फ़िगर करें। ये फ़ील्ड OpenRouter चैट-कम्प्लीशन्स अनुरोध बॉडी में फ़ॉरवर्ड किए जाते हैं। Fusion OpenRouter OAuth ऑनबोर्डिंग या API-कुंजी ऑनबोर्डिंग, दोनों के साथ काम करता है; यदि आप OAuth का उपयोग करते हैं, तो नीचे दिए गए उदाहरण से `env.OPENROUTER_API_KEY` पंक्ति छोड़ दें।

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

`analysis_models` सूची समानांतर पैनल है, और Fusion Plugin कॉन्फ़िग के भीतर `model` जज मॉडल है। सामान्य OpenClaw एजेंट/चैट टर्न में Fusion को बाध्य करने की कोशिश में शीर्ष-स्तरीय `tool_choice` को `"required"` पर सेट न करें; OpenClaw टर्न में OpenClaw टूल परिभाषाएँ शामिल हो सकती हैं, और शीर्ष-स्तरीय आवश्यक टूल चयन Fusion राउटर के बजाय उन टूल में से किसी एक की आवश्यकता पैदा कर सकता है। जब यह Fusion Plugin कॉन्फ़िग मौजूद होता है, तो OpenClaw कॉन्फ़िगर किए गए विश्लेषण मॉडलों और जज मॉडल के साथ एक सैनिटाइज़्ड सिस्टम-प्रॉम्प्ट नोट भी जोड़ता है, ताकि एजेंट अपने वर्तमान Fusion पैनल के बारे में प्रश्नों का उत्तर दे सके। अन्य `extraBody` फ़ील्ड प्रॉम्प्ट में कॉपी नहीं किए जाते।

Fusion डिज़ाइन के अनुसार धीमा है। OpenRouter वही OpenClaw प्रॉम्प्ट कई विश्लेषण मॉडलों को भेज सकता है और फिर अंतिम जज/सिंथेसिस चरण चला सकता है, इसलिए विलंबता आमतौर पर सीधे एकल-मॉडल अनुरोध से अधिक होती है। Fusion का उपयोग विचारपूर्ण, उच्च-गुणवत्ता वाले उत्तरों या एस्केलेशन पथों के लिए करें, विलंबता-संवेदनशील चैट के लिए डिफ़ॉल्ट के रूप में नहीं। तेज़ प्रतिक्रियाओं के लिए, पैनल छोटा रखें और तेज़ विश्लेषण तथा जज मॉडल चुनें।

कॉन्फ़िगर किए गए रेफ़ को एक-शॉट स्थानीय मॉडल कॉल से टेस्ट करें:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## प्रमाणीकरण और हेडर

OpenRouter अंदरूनी रूप से आपकी API कुंजी के साथ Bearer टोकन का उपयोग करता है। OpenRouter OAuth एक PKCE लॉगिन फ़्लो है जो OpenRouter API कुंजी जारी करता है, इसलिए OpenClaw परिणाम को उसी `openrouter:default` API-कुंजी ऑथ प्रोफ़ाइल के रूप में संग्रहीत करता है जिसका उपयोग मैनुअल API-कुंजी सेटअप पथ करता है।

मौजूदा इंस्टॉल के लिए, पूर्ण ऑनबोर्डिंग दोबारा चलाए बिना साइन इन करें या संग्रहीत OpenRouter कुंजी रोटेट करें:

```bash
openclaw models auth login --provider openrouter --method oauth
```

जब आप OpenRouter पर मैन्युअल रूप से बनाई गई कुंजी पेस्ट करना चाहते हों, तो `openclaw models auth login --provider openrouter --method api-key` का उपयोग करें।

वास्तविक OpenRouter अनुरोधों (`https://openrouter.ai/api/v1`) पर, OpenClaw OpenRouter के दस्तावेज़ित ऐप-एट्रिब्यूशन हेडर भी जोड़ता है:

| हेडर                     | मान                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
यदि आप OpenRouter प्रदाता को किसी दूसरे प्रॉक्सी या बेस URL पर इंगित करते हैं, तो OpenClaw उन OpenRouter-विशिष्ट हेडरों या Anthropic कैश मार्करों को इंजेक्ट **नहीं** करता।
</Warning>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="प्रतिक्रिया कैशिंग">
    OpenRouter प्रतिक्रिया कैशिंग ऑप्ट-इन है। इसे मॉडल पैरामीटर के साथ प्रति OpenRouter मॉडल सक्षम करें:

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

    OpenClaw `X-OpenRouter-Cache: true` और, कॉन्फ़िगर होने पर, `X-OpenRouter-Cache-TTL` भेजता है। `responseCacheClear: true` वर्तमान अनुरोध के लिए रीफ़्रेश को बाध्य करता है और प्रतिस्थापन प्रतिक्रिया संग्रहीत करता है। Snake_case उपनाम (`response_cache`, `response_cache_ttl_seconds`, और `response_cache_clear`) भी स्वीकार किए जाते हैं।

    यह प्रदाता प्रॉम्प्ट कैशिंग और OpenRouter के Anthropic `cache_control` मार्करों से अलग है। यह केवल सत्यापित `openrouter.ai` रूटों पर लागू होता है, कस्टम प्रॉक्सी बेस URL पर नहीं।

  </Accordion>

  <Accordion title="Anthropic कैश मार्कर">
    सत्यापित OpenRouter रूटों पर, Anthropic मॉडल रेफ़ OpenRouter-विशिष्ट Anthropic `cache_control` मार्कर बनाए रखते हैं, जिनका उपयोग OpenClaw सिस्टम/डेवलपर प्रॉम्प्ट ब्लॉकों पर बेहतर प्रॉम्प्ट-कैश पुन: उपयोग के लिए करता है।
  </Accordion>

  <Accordion title="Anthropic reasoning प्रीफिल">
    सत्यापित OpenRouter रूट्स पर, reasoning सक्षम Anthropic मॉडल संदर्भ
    अनुरोध के OpenRouter तक पहुंचने से पहले अंतिम assistant प्रीफिल टर्न्स
    हटा देते हैं, जो Anthropic की इस आवश्यकता से मेल खाता है कि reasoning
    वार्तालाप user टर्न पर समाप्त हों।
  </Accordion>

  <Accordion title="Thinking / reasoning इंजेक्शन">
    समर्थित गैर-`auto` रूट्स पर, OpenClaw चयनित thinking स्तर को
    OpenRouter प्रॉक्सी reasoning पेलोड्स में मैप करता है। असमर्थित मॉडल संकेत और
    `openrouter/auto` उस reasoning इंजेक्शन को छोड़ देते हैं। Hunter Alpha पुराने
    कॉन्फ़िगर किए गए मॉडल संदर्भों के लिए प्रॉक्सी reasoning भी छोड़ देता है क्योंकि OpenRouter
    उस सेवानिवृत्त रूट के लिए reasoning फ़ील्ड्स में अंतिम उत्तर टेक्स्ट लौटा सकता है।
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning रीप्ले">
    सत्यापित OpenRouter रूट्स पर, `openrouter/deepseek/deepseek-v4-flash` और
    `openrouter/deepseek/deepseek-v4-pro` रीप्ले किए गए assistant टर्न्स पर
    अनुपस्थित `reasoning_content` भरते हैं ताकि thinking/tool वार्तालाप DeepSeek V4 के
    आवश्यक फ़ॉलो-अप आकार को बनाए रखें। OpenClaw इन रूट्स के लिए OpenRouter-समर्थित
    `reasoning_effort` मान भेजता है; `xhigh` सबसे ऊंचा विज्ञापित
    स्तर है, और पुराने `max` ओवरराइड्स को `xhigh` पर मैप किया जाता है।
  </Accordion>

  <Accordion title="केवल OpenAI अनुरोध आकार-निर्धारण">
    OpenRouter अभी भी प्रॉक्सी-शैली OpenAI-संगत पथ से चलता है, इसलिए
    मूल केवल OpenAI अनुरोध आकार-निर्धारण जैसे `serviceTier`, Responses `store`,
    OpenAI reasoning-संगत पेलोड्स, और प्रॉम्प्ट-कैश संकेत आगे नहीं भेजे जाते।
  </Accordion>

  <Accordion title="Gemini-समर्थित रूट्स">
    Gemini-समर्थित OpenRouter संदर्भ प्रॉक्सी-Gemini पथ पर रहते हैं: OpenClaw वहां
    Gemini thought-signature स्वच्छता बनाए रखता है, लेकिन मूल Gemini
    रीप्ले सत्यापन या bootstrap पुनर्लेखन सक्षम नहीं करता।
  </Accordion>

  <Accordion title="Provider रूटिंग मेटाडेटा">
    OpenRouter अंतर्निहित provider रूटिंग के लिए `provider` अनुरोध ऑब्जेक्ट का समर्थन करता है।
    सभी OpenRouter टेक्स्ट-मॉडल अनुरोधों के लिए डिफ़ॉल्ट नीति
    `models.providers.openrouter.params.provider` से कॉन्फ़िगर करें:

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

    OpenClaw उस ऑब्जेक्ट को अनुरोध `provider` पेलोड के रूप में OpenRouter को आगे भेजता है।
    OpenRouter के प्रलेखित snake_case फ़ील्ड्स का उपयोग करें, जिनमें `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr`, और `enforce_distillable_text` शामिल हैं।

    प्रति-मॉडल params अभी भी provider-व्यापी रूटिंग ऑब्जेक्ट को ओवरराइड करते हैं:

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

    यह केवल OpenRouter chat-completions रूट्स पर लागू होता है। प्रत्यक्ष Anthropic,
    Google, OpenAI, या कस्टम provider रूट्स OpenRouter रूटिंग params को अनदेखा करते हैं।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    providers, मॉडल संदर्भ, और विफलता पर स्विचओवर व्यवहार चुनना।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    agents, मॉडल, और providers के लिए पूर्ण कॉन्फ़िग संदर्भ।
  </Card>
</CardGroup>
