---
read_when:
    - आप OpenClaw के साथ Google Gemini मॉडल का उपयोग करना चाहते हैं
    - आपको API कुंजी या OAuth प्रमाणीकरण प्रवाह की आवश्यकता है
summary: Google Gemini सेटअप (API कुंजी + OAuth, इमेज जनरेशन, मीडिया की समझ, TTS, वेब खोज)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-19T09:47:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 475864f0327ce678b92abb4e35fc2df42b0498ae6fd3c738eff8dd85a35a5458
    source_path: providers/google.md
    workflow: 16
---

Google Plugin, Google AI Studio के माध्यम से Gemini मॉडल के साथ-साथ इमेज जनरेशन, मीडिया समझ (इमेज/ऑडियो/वीडियो), टेक्स्ट-टू-स्पीच और Gemini Grounding के ज़रिए वेब खोज की सुविधा प्रदान करता है।

- प्रदाता: `google`
- प्रमाणीकरण: `GEMINI_API_KEY` या `GOOGLE_API_KEY`
- API: Google Gemini API
- रनटाइम विकल्प: `agentRuntime.id: "google-gemini-cli"`, मॉडल संदर्भों को `google/*` के रूप में कैनोनिकल रखते हुए Gemini CLI OAuth का पुनः उपयोग करता है।

## शुरुआत करना

अपनी पसंदीदा प्रमाणीकरण विधि चुनें और सेटअप के चरणों का पालन करें।

<Tabs>
  <Tab title="API कुंजी">
    **इनके लिए सर्वोत्तम:** Google AI Studio के माध्यम से मानक Gemini API एक्सेस।

    <Steps>
      <Step title="API कुंजी प्राप्त करें">
        [Google AI Studio](https://aistudio.google.com/apikey) में एक मुफ़्त कुंजी बनाएँ।
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        या कुंजी सीधे प्रदान करें:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` और `GOOGLE_API_KEY` दोनों स्वीकार किए जाते हैं। इनमें से जो भी पहले से कॉन्फ़िगर किया गया हो, उसका उपयोग करें।
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **इनके लिए सर्वोत्तम:** अलग API कुंजी का उपयोग करने के बजाय Gemini CLI OAuth के माध्यम से अपने Google खाते से साइन इन करना।

    <Warning>
    `google-gemini-cli` प्रदाता एक अनाधिकारिक एकीकरण है। कुछ उपयोगकर्ताओं ने
    इस तरह OAuth का उपयोग करने पर खाता प्रतिबंधों की सूचना दी है। इसका उपयोग अपने जोखिम पर करें।
    </Warning>

    <Steps>
      <Step title="Gemini CLI इंस्टॉल करें">
        स्थानीय `gemini` कमांड, `PATH` पर उपलब्ध होना आवश्यक है।

        ```bash
        # Homebrew
        brew install gemini-cli

        # या npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw, Homebrew इंस्टॉलेशन और वैश्विक npm इंस्टॉलेशन, दोनों का समर्थन करता है, जिनमें
        सामान्य Windows/npm लेआउट भी शामिल हैं।
      </Step>
      <Step title="OAuth के माध्यम से लॉग इन करें">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - डिफ़ॉल्ट मॉडल: `google/gemini-3.1-pro-preview`
    - रनटाइम: `google-gemini-cli`
    - उपनाम: `gemini-cli`

    Gemini 3.1 Pro की Gemini API मॉडल आईडी `gemini-3.1-pro-preview` है। OpenClaw सुविधा के लिए छोटे `google/gemini-3.1-pro` को उपनाम के रूप में स्वीकार करता है और प्रदाता कॉल से पहले इसे सामान्यीकृत करता है।

    **परिवेश चर:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    यदि लॉगिन के बाद Gemini CLI OAuth अनुरोध विफल हों, तो Gateway होस्ट पर `GOOGLE_CLOUD_PROJECT` या
    `GOOGLE_CLOUD_PROJECT_ID` सेट करें और फिर से प्रयास करें।
    </Note>

    <Note>
    यदि ब्राउज़र प्रवाह शुरू होने से पहले लॉगिन विफल हो, तो सुनिश्चित करें कि स्थानीय `gemini`
    कमांड इंस्टॉल है और `PATH` पर उपलब्ध है।
    </Note>

    ऑनबोर्डिंग का स्वतः-पता लगाना मौजूदा Gemini CLI लॉगिन को सूचीबद्ध करता है, लेकिन उसका
    स्वतः-परीक्षण कभी नहीं करता, क्योंकि Gemini CLI में टूल-रहित जाँच नहीं है। जारी रखने के लिए Gemini CLI
    OAuth या Gemini API कुंजी चुनें।

    `google-gemini-cli/*` मॉडल संदर्भ पुराने संगतता उपनाम हैं। स्थानीय Gemini CLI निष्पादन चाहने वाले नए
    कॉन्फ़िगरेशन को `google-gemini-cli` रनटाइम के साथ `google/*` मॉडल संदर्भों का उपयोग करना चाहिए।

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` को 2026-03-09 को सेवानिवृत्त कर दिया गया था; इसके बजाय `google/gemini-3.1-pro-preview` का उपयोग करें। Gemini API कुंजी सेटअप (`openclaw onboard --auth-choice gemini-api-key` या `openclaw models auth login --provider google`) फिर से चलाने पर पुराना कॉन्फ़िगर किया गया डिफ़ॉल्ट वर्तमान मॉडल से पुनर्लिखित हो जाता है।
</Note>

## क्षमताएँ

| क्षमता                  | समर्थित                       |
| ---------------------- | ----------------------------- |
| चैट पूर्णताएँ          | हाँ                           |
| इमेज जनरेशन            | हाँ                           |
| संगीत जनरेशन           | हाँ                           |
| टेक्स्ट-टू-स्पीच       | हाँ                           |
| रीयलटाइम वॉइस          | हाँ (Google Live API)         |
| इमेज समझ               | हाँ                           |
| ऑडियो ट्रांसक्रिप्शन   | हाँ                           |
| वीडियो समझ             | हाँ                           |
| वेब खोज (Grounding)    | हाँ                           |
| चिंतन/तर्क              | हाँ (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 मॉडल           | हाँ                           |

## वेब खोज

बंडल किया गया `gemini` वेब-खोज प्रदाता Gemini Google Search grounding का उपयोग करता है।
`plugins.entries.google.config.webSearch` के अंतर्गत एक समर्पित खोज कुंजी कॉन्फ़िगर करें,
या `GEMINI_API_KEY` के बाद उसे `models.providers.google.apiKey` का पुनः उपयोग करने दें:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // वैकल्पिक, यदि GEMINI_API_KEY या models.providers.google.apiKey सेट है
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // models.providers.google.baseUrl पर फ़ॉलबैक करता है
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

क्रेडेंशियल की प्राथमिकता पहले समर्पित `webSearch.apiKey`, फिर `GEMINI_API_KEY`,
और उसके बाद `models.providers.google.apiKey` है। `webSearch.baseUrl` वैकल्पिक है और
ऑपरेटर प्रॉक्सी या संगत Gemini API एंडपॉइंट के लिए मौजूद है; इसे छोड़ने पर,
Gemini वेब खोज `models.providers.google.baseUrl` का पुनः उपयोग करती है। प्रदाता-विशिष्ट टूल व्यवहार के लिए
[Gemini खोज](/hi/tools/gemini-search) देखें।

<Tip>
Gemini 3 मॉडल `thinkingBudget` के बजाय `thinkingLevel` का उपयोग करते हैं। OpenClaw,
Gemini 3, Gemini 3.1 और `gemini-*-latest` उपनाम के तर्क नियंत्रणों को
`thinkingLevel` से मैप करता है, ताकि डिफ़ॉल्ट/कम-विलंबता वाले रन अक्षम
`thinkingBudget` मान न भेजें।

`/think adaptive` किसी निश्चित OpenClaw स्तर को चुनने के बजाय Google की डायनेमिक थिंकिंग सिमेंटिक्स को बनाए रखता है। Gemini 3 और Gemini 3.1 किसी निश्चित `thinkingLevel` को छोड़ देते हैं ताकि
Google स्तर चुन सके; Gemini 2.5 Google का डायनेमिक सेंटिनल
`thinkingBudget: -1` भेजता है।

Gemma 4 मॉडल (उदाहरण के लिए `gemma-4-26b-a4b-it`) थिंकिंग मोड का समर्थन करते हैं। OpenClaw
Gemma 4 के लिए `thinkingBudget` को समर्थित Google `thinkingLevel` में पुनर्लिखता है।
थिंकिंग को `off` पर सेट करने से, इसे
`MINIMAL` पर मैप करने के बजाय थिंकिंग अक्षम बनी रहती है।

Gemini 2.5 Pro केवल थिंकिंग मोड में काम करता है और स्पष्ट
`thinkingBudget: 0` को अस्वीकार करता है; OpenClaw उस मान को भेजने के बजाय Gemini 2.5 Pro अनुरोधों से
हटा देता है।
</Tip>

## इमेज जनरेशन

बंडल किया गया `google` इमेज-जनरेशन प्रोवाइडर डिफ़ॉल्ट रूप से
`google/gemini-3.1-flash-image` का उपयोग करता है।

- `google/gemini-3-pro-image` का भी समर्थन करता है
- जनरेशन: प्रति अनुरोध अधिकतम 4 इमेज
- एडिट मोड: सक्षम, अधिकतम 5 इनपुट इमेज
- ज्यामिति नियंत्रण: `size`, `aspectRatio`, और `resolution`

Google को डिफ़ॉल्ट इमेज प्रोवाइडर के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image",
      },
    },
  },
}
```

<Note>
साझा टूल पैरामीटर, प्रोवाइडर चयन और फ़ेलओवर व्यवहार के लिए [इमेज जनरेशन](/hi/tools/image-generation) देखें।
</Note>

## वीडियो जनरेशन

बंडल किया गया `google` Plugin साझा
`video_generate` टूल के माध्यम से वीडियो जनरेशन भी पंजीकृत करता है।

- डिफ़ॉल्ट वीडियो मॉडल: `google/veo-3.1-fast-generate-preview`
- मोड: टेक्स्ट-टू-वीडियो, इमेज-टू-वीडियो और सिंगल-वीडियो रेफ़रेंस प्रवाह
- `aspectRatio` (`16:9`, `9:16`) और `resolution` (`720P`, `1080P`) का समर्थन करता है; वर्तमान में Veo ऑडियो आउटपुट का समर्थन नहीं करता
- समर्थित अवधियाँ: **4, 6 या 8 सेकंड** (अन्य मान निकटतम अनुमत मान पर समायोजित हो जाते हैं)

Google को डिफ़ॉल्ट वीडियो प्रोवाइडर के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
साझा टूल पैरामीटर, प्रोवाइडर चयन और फ़ेलओवर व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।
</Note>

## संगीत जनरेशन

बंडल किया गया `google` Plugin साझा
`music_generate` टूल के माध्यम से संगीत जनरेशन भी पंजीकृत करता है।

- डिफ़ॉल्ट संगीत मॉडल: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` का भी समर्थन करता है
- प्रॉम्प्ट नियंत्रण: `lyrics` और `instrumental`
- आउटपुट फ़ॉर्मैट: डिफ़ॉल्ट रूप से `mp3`, साथ ही `google/lyria-3-pro-preview` पर `wav`
- रेफ़रेंस इनपुट: अधिकतम 10 इमेज
- सेशन-समर्थित रन, `action: "status"` सहित, साझा टास्क/स्टेटस प्रवाह के माध्यम से अलग हो जाते हैं

Google को डिफ़ॉल्ट संगीत प्रोवाइडर के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
साझा टूल पैरामीटर, प्रोवाइडर चयन और फ़ेलओवर व्यवहार के लिए [संगीत जनरेशन](/hi/tools/music-generation) देखें।
</Note>

## टेक्स्ट-टू-स्पीच

बंडल किया गया `google` स्पीच प्रोवाइडर
`gemini-3.1-flash-tts-preview` के साथ Gemini API TTS पथ का उपयोग करता है।

- डिफ़ॉल्ट वॉइस: `Kore`
- प्रमाणीकरण: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` या `GOOGLE_API_KEY`
- आउटपुट: नियमित TTS अटैचमेंट के लिए WAV, वॉइस-नोट लक्ष्यों के लिए Opus, Talk/टेलीफ़ोनी के लिए PCM
- वॉइस-नोट आउटपुट: Google PCM को WAV में रैप किया जाता है और `ffmpeg` की सहायता से 48 kHz Opus में ट्रांसकोड किया जाता है

Google का बैच Gemini TTS पथ पूर्ण
`generateContent` प्रतिक्रिया में जनरेट किया गया ऑडियो लौटाता है। न्यूनतम विलंबता वाली मौखिक बातचीत के लिए, बैच
TTS के बजाय Gemini Live API द्वारा समर्थित Google रियलटाइम वॉइस प्रोवाइडर का उपयोग करें।

Google को डिफ़ॉल्ट TTS प्रोवाइडर के रूप में उपयोग करने के लिए:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS शैली नियंत्रण के लिए स्वाभाविक भाषा वाले प्रॉम्प्ट का उपयोग करता है। बोले जाने वाले टेक्स्ट से पहले पुनः उपयोग योग्य शैली प्रॉम्प्ट जोड़ने के लिए
`audioProfile` सेट करें। जब आपका प्रॉम्प्ट टेक्स्ट किसी नामित वक्ता का उल्लेख करे, तब
`speakerName` सेट करें।

Gemini API TTS टेक्स्ट में अभिव्यंजक वर्ग-कोष्ठक वाले ऑडियो टैग भी स्वीकार करता है,
जैसे `[whispers]` या `[laughs]`। टैग को TTS पर भेजते हुए दृश्यमान चैट उत्तर से बाहर रखने के लिए, उन्हें
`[[tts:text]]...[[/tts:text]]` ब्लॉक में रखें:

```text
यह साफ़ उत्तर टेक्स्ट है।

[[tts:text]][whispers] यह बोला जाने वाला संस्करण है।[[/tts:text]]
```

<Note>
Gemini API तक सीमित Google Cloud Console API कुंजी इस
प्रोवाइडर के लिए मान्य है। यह अलग Cloud Text-to-Speech API पथ नहीं है।
</Note>

## रियलटाइम वॉइस

बंडल किया गया `google` Plugin, Voice Call और Google Meet जैसे बैकएंड ऑडियो ब्रिज के लिए
Gemini Live API द्वारा समर्थित रियलटाइम वॉइस प्रोवाइडर पंजीकृत करता है।

| सेटिंग               | कॉन्फ़िग पथ                                                         | डिफ़ॉल्ट                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| मॉडल                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| वॉइस                 | `...google.voice`                                                   | `Kore`                                                                                |
| तापमान           | `...google.temperature`                                             | (सेट नहीं)                                                                               |
| VAD आरंभ संवेदनशीलता | `...google.startSensitivity`                                        | (सेट नहीं)                                                                               |
| VAD समाप्ति संवेदनशीलता   | `...google.endSensitivity`                                          | (सेट नहीं)                                                                               |
| मौन अवधि      | `...google.silenceDurationMs`                                       | (सेट नहीं)                                                                               |
| गतिविधि प्रबंधन     | `...google.activityHandling`                                        | Google डिफ़ॉल्ट, `start-of-activity-interrupts`                                        |
| टर्न कवरेज         | `...google.turnCoverage`                                            | Google डिफ़ॉल्ट, `audio-activity-and-all-video`                                        |
| स्वचालित VAD अक्षम करें      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| सत्र पुनरारंभ    | `...google.sessionResumption`                                       | `true`                                                                                |
| संदर्भ संपीड़न   | `...google.contextWindowCompression`                                | `true`                                                                                |
| API कुंजी               | `...google.apiKey`                                                  | अनुपलब्ध होने पर `models.providers.google.apiKey`, `GEMINI_API_KEY`, या `GOOGLE_API_KEY` का उपयोग |

Voice Call रीयलटाइम कॉन्फ़िग का उदाहरण:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API, WebSocket पर द्विदिश ऑडियो और फ़ंक्शन कॉलिंग का उपयोग करता है।
OpenClaw टेलीफ़ोनी/Meet ब्रिज ऑडियो को Gemini की PCM Live API स्ट्रीम के अनुकूल बनाता है और
टूल कॉल को साझा रीयलटाइम वॉइस अनुबंध पर रखता है। जब तक सैंपलिंग में बदलाव की आवश्यकता न हो, `temperature`
को सेट न करें; OpenClaw गैर-धनात्मक मानों को छोड़ देता है
क्योंकि Google Live, `temperature: 0` के लिए ऑडियो के बिना ट्रांस्क्रिप्ट लौटा सकता है।
Gemini API ट्रांसक्रिप्शन `languageCodes` के बिना सक्षम होता है; वर्तमान Google
SDK इस API पथ पर भाषा-कोड संकेतों को अस्वीकार करता है।
</Note>

<Note>
Gemini 3.1 Live रीयलटाइम इनपुट के माध्यम से संवादात्मक टेक्स्ट स्वीकार करता है और
क्रमिक फ़ंक्शन कॉलिंग का उपयोग करता है। OpenClaw इस मॉडल के लिए पुराने `NON_BLOCKING`, फ़ंक्शन
प्रतिक्रिया शेड्यूलिंग और भावात्मक-संवाद फ़ील्ड को छोड़ देता है। `thinkingLevel` को
प्राथमिकता दें; कॉन्फ़िग किए गए धनात्मक `thinkingBudget` मान निकटतम समर्थित
स्तर पर मैप किए जाते हैं, जबकि `-1` Google के डिफ़ॉल्ट को यथावत रखता है। [Gemini Live क्षमता तुलना](https://ai.google.dev/gemini-api/docs/live-api/capabilities) देखें।
</Note>

<Note>
Control UI Talk सीमित, एक-बार उपयोग वाले टोकन के साथ Google Live ब्राउज़र सत्रों का समर्थन करता है।
Video Talk में, ब्राउज़र सीमित JPEG फ़्रेम सीधे
Google Live को प्रदाता की अधिकतम एक फ़्रेम प्रति सेकंड की दर से भेजता है।
`describe_view` फ़ंक्शन बताता है कि वह कैमरा स्ट्रीम सक्रिय है या नहीं।
कैमरा फ़्रेम Gateway से होकर नहीं गुजरते। केवल-बैकएंड रीयलटाइम वॉइस
प्रदाता सामान्य Gateway रिले ट्रांसपोर्ट के माध्यम से भी चल सकते हैं, जो
प्रदाता क्रेडेंशियल को Gateway पर रखता है।
</Note>

मेंटेनर द्वारा लाइव सत्यापन के लिए,
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` चलाएँ।
स्मोक परीक्षण OpenAI बैकएंड/WebRTC पथों को भी कवर करता है; Google चरण वही
सीमित Live API टोकन संरचना जारी करता है जिसका उपयोग Control UI Talk करता है, ब्राउज़र
WebSocket एंडपॉइंट खोलता है, प्रारंभिक सेटअप पेलोड और एक JPEG फ़्रेम भेजता है, तथा
टेक्स्ट प्रतिक्रिया और `describe_view` फ़ंक्शन राउंडट्रिप को सत्यापित करता है।

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="प्रत्यक्ष Gemini कैश का पुनः उपयोग">
    प्रत्यक्ष Gemini API रन (`api: "google-generative-ai"`) के लिए, OpenClaw
    कॉन्फ़िग किए गए `cachedContent` हैंडल को Gemini अनुरोधों तक पहुँचाता है।

    - प्रति-मॉडल या वैश्विक पैरामीटर को
      `cachedContent` या पुराने `cached_content` में से किसी एक से कॉन्फ़िगर करें
    - अधिक विशिष्ट दायरे के पैरामीटर (वैश्विक के ऊपर मॉडल-स्तरीय) हमेशा प्रभावी होते हैं।
      समान दायरे में, यदि दोनों कुंजियाँ सेट हैं, तो `cached_content` प्रभावी होता है।
      अप्रत्याशित परिणामों से बचने के लिए प्रति दायरा केवल एक कुंजी का उपयोग करें।
    - उदाहरण मान: `cachedContents/prebuilt-context`
    - Gemini कैश-हिट उपयोग को अपस्ट्रीम `cachedContentTokenCount` से
      OpenClaw `cacheRead` में सामान्यीकृत किया जाता है

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI उपयोग संबंधी टिप्पणियाँ">
    `google-gemini-cli` OAuth प्रदाता का उपयोग करते समय, OpenClaw डिफ़ॉल्ट रूप से Gemini
    CLI के `stream-json` आउटपुट का उपयोग करता है और अंतिम
    `stats` पेलोड से उपयोग को सामान्यीकृत करता है। पुराने `--output-format json` ओवरराइड अब भी
    JSON पार्सर का उपयोग करते हैं।

    - स्ट्रीम किया गया उत्तर टेक्स्ट सहायक के `message` इवेंट से आता है।
    - पुराने JSON आउटपुट के लिए, उत्तर टेक्स्ट CLI JSON के `response` फ़ील्ड से आता है।
    - CLI द्वारा `usage` खाली छोड़े जाने पर उपयोग `stats` पर फ़ॉलबैक करता है।
    - `stats.cached` को OpenClaw `cacheRead` में सामान्यीकृत किया जाता है।
    - यदि `stats.input` अनुपस्थित है, तो OpenClaw
      `stats.input_tokens - stats.cached` से इनपुट टोकन निकालता है।

  </Accordion>

  <Accordion title="परिवेश और डेमन सेटअप">
    यदि Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `GEMINI_API_KEY`
    उस प्रोसेस के लिए उपलब्ध हो (उदाहरण के लिए, `~/.openclaw/.env` में या
    `env.shellEnv` के माध्यम से)।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="छवि निर्माण" href="/hi/tools/image-generation" icon="image">
    साझा छवि टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="वीडियो निर्माण" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="संगीत निर्माण" href="/hi/tools/music-generation" icon="music">
    साझा संगीत टूल पैरामीटर और प्रदाता चयन।
  </Card>
</CardGroup>
