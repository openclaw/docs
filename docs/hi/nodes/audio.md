---
read_when:
    - ऑडियो ट्रांसक्रिप्शन या मीडिया हैंडलिंग बदलना
summary: आने वाले ऑडियो/वॉइस नोट्स कैसे डाउनलोड, ट्रांसक्राइब और जवाबों में इंजेक्ट किए जाते हैं
title: ऑडियो और वॉइस नोट्स
x-i18n:
    generated_at: "2026-06-28T23:24:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
    source_path: nodes/audio.md
    workflow: 16
---

## क्या काम करता है

- **मीडिया समझ (ऑडियो)**: यदि ऑडियो समझ सक्षम है (या स्वतः पहचानी गई है), OpenClaw:
  1. पहला ऑडियो अटैचमेंट (स्थानीय पथ या URL) ढूंढता है और जरूरत होने पर उसे डाउनलोड करता है।
  2. हर मॉडल एंट्री को भेजने से पहले `maxBytes` लागू करता है।
  3. क्रम में पहली योग्य मॉडल एंट्री चलाता है (प्रदाता या CLI)।
  4. यदि यह विफल होती है या छोड़ी जाती है (आकार/टाइमआउट), तो यह अगली एंट्री आजमाता है।
  5. सफलता पर, यह `Body` को `[Audio]` ब्लॉक से बदलता है और `{{Transcript}}` सेट करता है।
- **कमांड पार्सिंग**: जब ट्रांसक्रिप्शन सफल होता है, तो `CommandBody`/`RawBody` को ट्रांसक्रिप्ट पर सेट किया जाता है ताकि स्लैश कमांड अब भी काम करें।
- **विस्तृत लॉगिंग**: `--verbose` में, हम लॉग करते हैं कि ट्रांसक्रिप्शन कब चलता है और कब यह बॉडी को बदलता है।

## स्वतः-पहचान (डिफ़ॉल्ट)

यदि आप **मॉडल कॉन्फ़िगर नहीं करते** और `tools.media.audio.enabled` को **`false`** पर सेट नहीं किया गया है,
तो OpenClaw इस क्रम में स्वतः पहचान करता है और पहले काम करने वाले विकल्प पर रुकता है:

1. **सक्रिय उत्तर मॉडल** जब उसका प्रदाता ऑडियो समझ का समर्थन करता है।
2. **स्थानीय CLI** (यदि इंस्टॉल हैं)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` की आवश्यकता होती है जिसमें encoder/decoder/joiner/tokens हों)
   - `whisper-cli` (`whisper-cpp` से; `WHISPER_CPP_MODEL` या बंडल किए गए tiny मॉडल का उपयोग करता है)
   - `whisper` (Python CLI; मॉडल अपने आप डाउनलोड करता है)
3. **प्रदाता प्रमाणीकरण**
   - ऑडियो का समर्थन करने वाली कॉन्फ़िगर की गई `models.providers.*` एंट्रियां पहले आजमाई जाती हैं
   - प्रदाता फ़ॉलबैक क्रम: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

2026-05-22 तक, मीडिया समझ के लिए Gemini CLI स्वतः-पहचान अब समर्थित नहीं है। Google, Gemini CLI उपयोगकर्ताओं को Antigravity CLI पर स्थानांतरित कर रहा है; ऑडियो को स्थानीय या प्रदाता ट्रांसक्रिप्शन का उपयोग करना चाहिए, जबकि इमेज/वीडियो CLI फ़ॉलबैक को Antigravity CLI (`agy`) पर जाना चाहिए।

स्वतः-पहचान अक्षम करने के लिए, `tools.media.audio.enabled: false` सेट करें।
कस्टमाइज़ करने के लिए, `tools.media.audio.models` सेट करें।
नोट: बाइनरी पहचान macOS/Linux/Windows पर सर्वोत्तम-प्रयास है; सुनिश्चित करें कि CLI `PATH` पर है (हम `~` को विस्तारित करते हैं), या पूर्ण कमांड पथ के साथ स्पष्ट CLI मॉडल सेट करें।

## कॉन्फ़िग उदाहरण

### प्रदाता + CLI फ़ॉलबैक (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### स्कोप गेटिंग के साथ केवल प्रदाता

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### केवल प्रदाता (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### केवल प्रदाता (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### केवल प्रदाता (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### चैट में ट्रांसक्रिप्ट इको करें (ऑप्ट-इन)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## नोट्स और सीमाएं

- प्रदाता प्रमाणीकरण मानक मॉडल प्रमाणीकरण क्रम का पालन करता है (auth profiles, env vars, `models.providers.*.apiKey`)।
- Groq सेटअप विवरण: [Groq](/hi/providers/groq)।
- जब `provider: "deepgram"` उपयोग किया जाता है, तो Deepgram `DEEPGRAM_API_KEY` उठाता है।
- Deepgram सेटअप विवरण: [Deepgram (ऑडियो ट्रांसक्रिप्शन)](/hi/providers/deepgram)।
- Mistral सेटअप विवरण: [Mistral](/hi/providers/mistral)।
- जब `provider: "senseaudio"` उपयोग किया जाता है, तो SenseAudio `SENSEAUDIO_API_KEY` उठाता है।
- SenseAudio सेटअप विवरण: [SenseAudio](/hi/providers/senseaudio)।
- ऑडियो प्रदाता `tools.media.audio` के माध्यम से `baseUrl`, `headers`, और `providerOptions` ओवरराइड कर सकते हैं।
- डिफ़ॉल्ट आकार सीमा 20MB है (`tools.media.audio.maxBytes`)। बहुत बड़े ऑडियो को उस मॉडल के लिए छोड़ दिया जाता है और अगली एंट्री आजमाई जाती है।
- 1024 बाइट से कम वाली छोटी/खाली ऑडियो फ़ाइलें प्रदाता/CLI ट्रांसक्रिप्शन से पहले छोड़ दी जाती हैं।
- ऑडियो के लिए डिफ़ॉल्ट `maxChars` **सेट नहीं** है (पूर्ण ट्रांसक्रिप्ट)। आउटपुट काटने के लिए `tools.media.audio.maxChars` या प्रति-एंट्री `maxChars` सेट करें।
- OpenAI स्वतः डिफ़ॉल्ट `gpt-4o-mini-transcribe` है; अधिक सटीकता के लिए `model: "gpt-4o-transcribe"` सेट करें।
- कई वॉइस नोट्स प्रोसेस करने के लिए `tools.media.audio.attachments` का उपयोग करें (`mode: "all"` + `maxAttachments`)।
- ट्रांसक्रिप्ट टेम्पलेट्स के लिए `{{Transcript}}` के रूप में उपलब्ध है।
- `tools.media.audio.echoTranscript` डिफ़ॉल्ट रूप से बंद है; एजेंट प्रोसेसिंग से पहले मूल चैट को ट्रांसक्रिप्ट पुष्टि भेजने के लिए इसे सक्षम करें।
- `tools.media.audio.echoFormat` इको टेक्स्ट को कस्टमाइज़ करता है (प्लेसहोल्डर: `{transcript}`)।
- CLI stdout सीमित है (5MB); CLI आउटपुट संक्षिप्त रखें।
- CLI `args` को स्थानीय ऑडियो फ़ाइल पथ के लिए `{{MediaPath}}` का उपयोग करना चाहिए। पुराने `audio.transcription.command` कॉन्फ़िग से अप्रचलित `{input}` प्लेसहोल्डर माइग्रेट करने के लिए `openclaw doctor --fix` चलाएं।

### प्रॉक्सी वातावरण समर्थन

प्रदाता-आधारित ऑडियो ट्रांसक्रिप्शन मानक आउटबाउंड प्रॉक्सी env vars का सम्मान करता है:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

यदि कोई प्रॉक्सी env vars सेट नहीं हैं, तो सीधे egress का उपयोग किया जाता है। यदि प्रॉक्सी कॉन्फ़िग विकृत है, तो OpenClaw चेतावनी लॉग करता है और direct fetch पर वापस जाता है।

## समूहों में मेंशन पहचान

जब किसी समूह चैट के लिए `requireMention: true` सेट होता है, तो OpenClaw अब मेंशन जांचने से **पहले** ऑडियो ट्रांसक्राइब करता है। इससे वॉइस नोट्स को तब भी प्रोसेस किया जा सकता है जब उनमें मेंशन हों।

**यह कैसे काम करता है:**

1. यदि किसी वॉइस संदेश में कोई टेक्स्ट बॉडी नहीं है और समूह में मेंशन आवश्यक हैं, तो OpenClaw "preflight" ट्रांसक्रिप्शन करता है।
2. ट्रांसक्रिप्ट में मेंशन पैटर्न जांचे जाते हैं (जैसे, `@BotName`, emoji triggers)।
3. यदि मेंशन मिलता है, तो संदेश पूर्ण उत्तर पाइपलाइन से गुजरता है।
4. ट्रांसक्रिप्ट का उपयोग मेंशन पहचान के लिए किया जाता है ताकि वॉइस नोट्स मेंशन गेट पार कर सकें।

**फ़ॉलबैक व्यवहार:**

- यदि preflight के दौरान ट्रांसक्रिप्शन विफल होता है (टाइमआउट, API त्रुटि, आदि), तो संदेश को केवल-टेक्स्ट मेंशन पहचान के आधार पर प्रोसेस किया जाता है।
- इससे सुनिश्चित होता है कि मिश्रित संदेश (टेक्स्ट + ऑडियो) कभी गलत तरीके से ड्रॉप नहीं होते।

**प्रति Telegram समूह/टॉपिक ऑप्ट-आउट:**

- उस समूह के लिए preflight ट्रांसक्रिप्ट मेंशन जांच छोड़ने के लिए `channels.telegram.groups.<chatId>.disableAudioPreflight: true` सेट करें।
- प्रति-टॉपिक ओवरराइड करने के लिए `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` सेट करें (`true` छोड़ने के लिए, `false` जबरन सक्षम करने के लिए)।
- डिफ़ॉल्ट `false` है (जब mention-gated शर्तें मेल खाती हैं तो preflight सक्षम होता है)।

**उदाहरण:** कोई उपयोगकर्ता `requireMention: true` वाले Telegram समूह में "Hey @Claude, what's the weather?" कहते हुए वॉइस नोट भेजता है। वॉइस नोट ट्रांसक्राइब होता है, मेंशन पहचाना जाता है, और एजेंट उत्तर देता है।

## ध्यान देने योग्य बातें

- स्कोप नियम first-match wins का उपयोग करते हैं। `chatType` को `direct`, `group`, या `room` में सामान्यीकृत किया जाता है।
- सुनिश्चित करें कि आपका CLI 0 पर बाहर निकले और सादा टेक्स्ट प्रिंट करे; JSON को `jq -r .text` के माध्यम से संसाधित करना होगा।
- `parakeet-mlx` के लिए, यदि आप `--output-dir` पास करते हैं, तो OpenClaw `<output-dir>/<media-basename>.txt` पढ़ता है जब `--output-format` `txt` है (या छोड़ा गया है); non-`txt` आउटपुट फ़ॉर्मैट stdout पार्सिंग पर वापस जाते हैं।
- उत्तर कतार को ब्लॉक होने से बचाने के लिए टाइमआउट उचित रखें (`timeoutSeconds`, डिफ़ॉल्ट 60s)।
- Preflight ट्रांसक्रिप्शन मेंशन पहचान के लिए केवल **पहला** ऑडियो अटैचमेंट प्रोसेस करता है। अतिरिक्त ऑडियो मुख्य मीडिया समझ चरण के दौरान प्रोसेस किया जाता है।

## संबंधित

- [मीडिया समझ](/hi/nodes/media-understanding)
- [टॉक मोड](/hi/nodes/talk)
- [वॉइस वेक](/hi/nodes/voicewake)
