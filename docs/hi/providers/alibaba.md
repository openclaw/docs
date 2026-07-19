---
read_when:
    - आप OpenClaw में Alibaba Wan वीडियो जनरेशन का उपयोग करना चाहते हैं
    - वीडियो जनरेशन के लिए आपको Model Studio या DashScope API कुंजी सेट अप करनी होगी
summary: OpenClaw में Alibaba Model Studio Wan वीडियो निर्माण
title: Alibaba मॉडल स्टूडियो
x-i18n:
    generated_at: "2026-07-19T09:40:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

बंडल किया गया `alibaba` Plugin Alibaba Model Studio (DashScope का अंतरराष्ट्रीय नाम) पर Wan मॉडल के लिए वीडियो-जनरेशन प्रदाता पंजीकृत करता है। यह डिफ़ॉल्ट रूप से सक्षम होता है; केवल API कुंजी की आवश्यकता होती है।

| गुण              | मान                                                                             |
| ---------------- | ------------------------------------------------------------------------------- |
| प्रदाता आईडी     | `alibaba`                                                              |
| Plugin           | बंडल किया गया, `enabledByDefault: true`                                               |
| प्रमाणीकरण एन्वायरनमेंट वेरिएबल | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (पहला मिलान प्रभावी होता है) |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice alibaba-model-studio-api-key`                                                             |
| प्रत्यक्ष CLI फ़्लैग | `--alibaba-model-studio-api-key <key>`                                                           |
| डिफ़ॉल्ट मॉडल    | `alibaba/wan2.6-t2v`                                                              |
| डिफ़ॉल्ट बेस URL | `https://dashscope-intl.aliyuncs.com`                                                              |

## आरंभ करना

<Steps>
  <Step title="API कुंजी सेट करें">
    ऑनबोर्डिंग के माध्यम से कुंजी को `alibaba` प्रदाता के लिए संग्रहीत करें:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    या कुंजी सीधे प्रदान करें:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    या Gateway शुरू करने से पहले स्वीकार किए गए एन्वायरनमेंट वेरिएबल में से किसी एक को एक्सपोर्ट करें:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # या DASHSCOPE_API_KEY=...
    # या QWEN_API_KEY=...
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
  <Step title="सत्यापित करें कि प्रदाता कॉन्फ़िगर किया गया है">
    ```bash
    openclaw models list --provider alibaba
    ```

    सूची में सभी पाँच बंडल किए गए Wan मॉडल शामिल होते हैं। यदि `MODELSTUDIO_API_KEY` को हल नहीं किया जा सकता, तो `openclaw models status --json`, `auth.unusableProfiles` के अंतर्गत अनुपलब्ध क्रेडेंशियल की रिपोर्ट करता है।

  </Step>
</Steps>

<Note>
  Alibaba Plugin और [Qwen Plugin](/hi/providers/qwen), दोनों DashScope के माध्यम से प्रमाणीकरण करते हैं और परस्पर व्याप्त एन्वायरनमेंट वेरिएबल स्वीकार करते हैं। समर्पित Wan वीडियो सतह के लिए `alibaba/...` मॉडल आईडी का उपयोग करें; Qwen चैट, एम्बेडिंग या मीडिया-समझ के लिए `qwen/...` आईडी का उपयोग करें।
</Note>

## अंतर्निहित Wan मॉडल

| मॉडल संदर्भ                | मोड                       |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`         | टेक्स्ट-से-वीडियो (डिफ़ॉल्ट) |
| `alibaba/wan2.6-i2v`         | इमेज-से-वीडियो           |
| `alibaba/wan2.6-r2v`         | संदर्भ-से-वीडियो         |
| `alibaba/wan2.6-r2v-flash`         | संदर्भ-से-वीडियो (तेज़)  |
| `alibaba/wan2.7-r2v`         | संदर्भ-से-वीडियो         |

## क्षमताएँ और सीमाएँ

तीनों मोड में प्रत्येक अनुरोध के लिए वीडियो की संख्या और अवधि की सीमा समान है; केवल इनपुट का स्वरूप अलग होता है।

| मोड                | अधिकतम आउटपुट वीडियो | अधिकतम इनपुट इमेज | अधिकतम इनपुट वीडियो | अधिकतम अवधि | समर्थित नियंत्रण                                         |
| ------------------ | --------------------- | ------------------ | -------------------- | ------------ | --------------------------------------------------------- |
| टेक्स्ट-से-वीडियो | 1                     | लागू नहीं          | लागू नहीं            | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| इमेज-से-वीडियो    | 1                     | 1                  | लागू नहीं            | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| संदर्भ-से-वीडियो  | 1                     | लागू नहीं          | 4                    | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

जिस अनुरोध में `durationSeconds` नहीं दिया जाता, उसे DashScope का स्वीकृत डिफ़ॉल्ट **5 सेकंड** मिलता है। अवधि को 10 s तक बढ़ाने के लिए [वीडियो जनरेशन टूल](/hi/tools/video-generation) पर `durationSeconds` स्पष्ट रूप से सेट करें।

<Warning>
  संदर्भ इमेज और वीडियो इनपुट दूरस्थ `http(s)` URL होने चाहिए; DashScope के संदर्भ मोड स्थानीय फ़ाइल पथ अस्वीकार करते हैं। पहले ऑब्जेक्ट स्टोरेज पर अपलोड करें, या [मीडिया टूल](/hi/tools/media-overview) प्रवाह का उपयोग करें, जो पहले से ही सार्वजनिक URL बनाता है।
</Warning>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="DashScope बेस URL को ओवरराइड करें">
    प्रदाता डिफ़ॉल्ट रूप से अंतरराष्ट्रीय DashScope एंडपॉइंट का उपयोग करता है। चीन-क्षेत्र के एंडपॉइंट को लक्षित करने के लिए:

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

    AIGC टास्क URL बनाने से पहले प्रदाता अंतिम स्लैश हटा देता है।

  </Accordion>

  <Accordion title="प्रमाणीकरण एन्वायरनमेंट वेरिएबल की प्राथमिकता">
    OpenClaw इस क्रम में एन्वायरनमेंट वेरिएबल से Alibaba API कुंजी हल करता है और पहला गैर-रिक्त मान लेता है:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    कॉन्फ़िगर की गई `auth.profiles` प्रविष्टियाँ (`openclaw models auth login` के माध्यम से सेट की गई) एन्वायरनमेंट वेरिएबल समाधान को ओवरराइड करती हैं। प्रोफ़ाइल रोटेशन, कूलडाउन और ओवरराइड की कार्यप्रणाली के लिए [मॉडल FAQ में प्रमाणीकरण प्रोफ़ाइल](/hi/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) देखें।

  </Accordion>

  <Accordion title="Qwen Plugin से संबंध">
    दोनों बंडल किए गए Plugin DashScope से संचार करते हैं और परस्पर व्याप्त API कुंजियाँ स्वीकार करते हैं। उपयोग करें:

    - `alibaba/wan*.*` आईडी, इस पृष्ठ पर प्रलेखित समर्पित Wan वीडियो प्रदाता के लिए।
    - `qwen/*` आईडी, Qwen चैट, एम्बेडिंग और मीडिया-समझ के लिए ([Qwen](/hi/providers/qwen) देखें)।

    `MODELSTUDIO_API_KEY` को एक बार सेट करने पर दोनों Plugin प्रमाणित हो जाते हैं, क्योंकि प्रमाणीकरण एन्वायरनमेंट वेरिएबल की सूचियाँ जानबूझकर परस्पर व्याप्त हैं; प्रत्येक Plugin को अलग-अलग ऑनबोर्ड करना आवश्यक नहीं है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="Qwen" href="/hi/providers/qwen" icon="microchip">
    समान DashScope प्रमाणीकरण पर Qwen चैट, एम्बेडिंग और मीडिया-समझ की स्थापना।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    एजेंट डिफ़ॉल्ट और मॉडल कॉन्फ़िगरेशन।
  </Card>
  <Card title="मॉडल FAQ" href="/hi/help/faq-models" icon="circle-question">
    प्रमाणीकरण प्रोफ़ाइल, मॉडल बदलना और "कोई प्रोफ़ाइल नहीं" त्रुटियों का समाधान।
  </Card>
</CardGroup>
