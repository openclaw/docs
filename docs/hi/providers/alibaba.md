---
read_when:
    - आप OpenClaw में Alibaba Wan वीडियो जनरेशन का उपयोग करना चाहते हैं
    - वीडियो जनरेशन के लिए Model Studio या DashScope API कुंजी सेटअप आवश्यक है
summary: OpenClaw में Alibaba Model Studio Wan वीडियो निर्माण
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-06-28T23:55:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw एक bundled `alibaba` Plugin भेजता है, जो Alibaba Model Studio (DashScope का अंतरराष्ट्रीय नाम) पर Wan मॉडल के लिए वीडियो-जनरेशन प्रदाता रजिस्टर करता है। Plugin डिफ़ॉल्ट रूप से सक्षम है; आपको केवल API key सेट करनी होती है।

| प्रॉपर्टी         | मान                                                                             |
| ---------------- | ------------------------------------------------------------------------------- |
| प्रदाता id        | `alibaba`                                                                       |
| Plugin           | bundled, `enabledByDefault: true`                                               |
| Auth env vars    | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (पहला मिलान जीतेगा) |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice alibaba-model-studio-api-key`                                    |
| डायरेक्ट CLI फ़्लैग | `--alibaba-model-studio-api-key <key>`                                          |
| डिफ़ॉल्ट मॉडल      | `alibaba/wan2.6-t2v`                                                            |
| डिफ़ॉल्ट बेस URL   | `https://dashscope-intl.aliyuncs.com`                                           |

## शुरू करना

<Steps>
  <Step title="API key सेट करें">
    कुंजी को `alibaba` प्रदाता के साथ संग्रहीत करने के लिए ऑनबोर्डिंग का उपयोग करें:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    या install/onboarding के दौरान सीधे कुंजी पास करें:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    या Gateway शुरू करने से पहले स्वीकार किए गए env vars में से कोई भी निर्यात करें:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="डिफ़ॉल्ट वीडियो मॉडल सेट करें">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="सत्यापित करें कि प्रदाता कॉन्फ़िगर है">
    ```bash
    openclaw models list --provider alibaba
    ```

    सूची में सभी पाँच bundled Wan मॉडल शामिल होने चाहिए। यदि `MODELSTUDIO_API_KEY` हल नहीं होता है, तो `openclaw models status --json` अनुपस्थित credential को `auth.unusableProfiles` के अंतर्गत रिपोर्ट करता है।

  </Step>
</Steps>

<Note>
  Alibaba Plugin और [Qwen Plugin](/hi/providers/qwen) दोनों DashScope के विरुद्ध authenticate करते हैं और overlapping env vars स्वीकार करते हैं। समर्पित Wan वीडियो सतह चलाने के लिए `alibaba/...` मॉडल ids का उपयोग करें; Qwen की चैट, embedding, या media-understanding सतह चाहिए तो `qwen/...` ids का उपयोग करें।
</Note>

## अंतर्निहित Wan मॉडल

| मॉडल ref                  | मोड                       |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | टेक्स्ट-से-वीडियो (डिफ़ॉल्ट) |
| `alibaba/wan2.6-i2v`       | इमेज-से-वीडियो             |
| `alibaba/wan2.6-r2v`       | रेफ़रेंस-से-वीडियो          |
| `alibaba/wan2.6-r2v-flash` | रेफ़रेंस-से-वीडियो (तेज़)    |
| `alibaba/wan2.7-r2v`       | रेफ़रेंस-से-वीडियो          |

## क्षमताएँ और सीमाएँ

bundled प्रदाता DashScope के Wan वीडियो API caps को mirror करता है। तीनों मोड समान प्रति-request वीडियो संख्या और अवधि cap साझा करते हैं; केवल इनपुट आकार अलग होता है।

| मोड                | अधिकतम आउटपुट वीडियो | अधिकतम इनपुट इमेज | अधिकतम इनपुट वीडियो | अधिकतम अवधि | समर्थित controls                                         |
| ------------------ | ----------------- | ---------------- | ---------------- | ------------ | --------------------------------------------------------- |
| टेक्स्ट-से-वीडियो   | 1                 | लागू नहीं         | लागू नहीं         | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| इमेज-से-वीडियो      | 1                 | 1                | लागू नहीं         | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| रेफ़रेंस-से-वीडियो  | 1                 | लागू नहीं         | 4                | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

जब कोई request `durationSeconds` छोड़ देता है, तो प्रदाता DashScope का स्वीकार्य डिफ़ॉल्ट **5 सेकंड** भेजता है। 10 s तक बढ़ाने के लिए [वीडियो जनरेशन टूल](/hi/tools/video-generation) पर `durationSeconds` स्पष्ट रूप से सेट करें।

<Warning>
  रेफ़रेंस इमेज और वीडियो इनपुट remote `http(s)` URLs होने चाहिए। DashScope के रेफ़रेंस मोड local file paths स्वीकार नहीं करते; पहले object storage पर अपलोड करें या [मीडिया टूल](/hi/tools/media-overview) flow का उपयोग करें, जो पहले से public URL बनाता है।
</Warning>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="DashScope base URL override करें">
    प्रदाता डिफ़ॉल्ट रूप से अंतरराष्ट्रीय DashScope endpoint का उपयोग करता है। China-region endpoint को target करने के लिए, सेट करें:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    प्रदाता AIGC task URLs बनाने से पहले trailing slashes हटा देता है।

  </Accordion>

  <Accordion title="Auth env प्राथमिकता">
    OpenClaw Alibaba API key को environment variables से इस क्रम में हल करता है, पहला non-empty मान लेते हुए:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    कॉन्फ़िगर की गई `auth.profiles` प्रविष्टियाँ (`openclaw models auth login` के माध्यम से सेट) env-var resolution को override करती हैं। profile rotation, cooldown, और override mechanics के लिए [models FAQ में Auth profiles](/hi/help/faq-models#what-is-an-auth-profile) देखें।

  </Accordion>

  <Accordion title="Qwen Plugin से संबंध">
    दोनों bundled plugins DashScope से बात करते हैं और overlapping API keys स्वीकार करते हैं। उपयोग करें:

    - इस पेज पर दस्तावेज़ किए गए समर्पित Wan वीडियो प्रदाता को चलाने के लिए `alibaba/wan*.*` ids।
    - Qwen chat, embedding, और media understanding के लिए `qwen/*` ids ([Qwen](/hi/providers/qwen) देखें)।

    `MODELSTUDIO_API_KEY` एक बार सेट करने से दोनों plugins authenticate हो जाते हैं क्योंकि auth env var list जानबूझकर overlap करती है; आपको प्रत्येक Plugin को अलग से onboard करने की आवश्यकता नहीं है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल parameters और प्रदाता selection।
  </Card>
  <Card title="Qwen" href="/hi/providers/qwen" icon="microchip">
    उसी DashScope auth पर Qwen chat, embedding, और media-understanding setup।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    Agent defaults और मॉडल कॉन्फ़िगरेशन।
  </Card>
  <Card title="Models FAQ" href="/hi/help/faq-models" icon="circle-question">
    Auth profiles, models बदलना, और "no profile" errors हल करना।
  </Card>
</CardGroup>
