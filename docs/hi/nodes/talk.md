---
read_when:
    - macOS/iOS/Android पर टॉक मोड लागू करना
    - आवाज़/TTS/व्यवधान का व्यवहार बदलना
summary: 'टॉक मोड: स्थानीय STT/TTS और रीयलटाइम वॉइस के माध्यम से निरंतर मौखिक वार्तालाप'
title: बातचीत मोड
x-i18n:
    generated_at: "2026-07-16T15:39:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Talk मोड पाँच रनटाइम स्वरूपों को कवर करता है:

- **नेटिव macOS/iOS/Android Talk**: स्थानीय वाक् पहचान, Gateway चैट और `talk.speak` TTS। Nodes `talk` क्षमता का विज्ञापन करते हैं और घोषित करते हैं कि वे किन `talk.*` कमांड का समर्थन करते हैं।
- **iOS Talk (रीयलटाइम)**: उन OpenAI रीयलटाइम कॉन्फ़िगरेशन के लिए क्लाइंट-स्वामित्व वाला WebRTC, जो `webrtc` ट्रांसपोर्ट चुनते हैं या ट्रांसपोर्ट निर्दिष्ट नहीं करते। स्पष्ट `gateway-relay`, `provider-websocket` और गैर-OpenAI रीयलटाइम कॉन्फ़िगरेशन Gateway-स्वामित्व वाले रिले पर बने रहते हैं; गैर-रीयलटाइम कॉन्फ़िगरेशन नेटिव वाक् लूप का उपयोग करते हैं।
- **ब्राउज़र Talk**: क्लाइंट-स्वामित्व वाले `webrtc`/`provider-websocket` सत्रों के लिए `talk.client.create`, या Gateway-स्वामित्व वाले `gateway-relay` सत्रों के लिए `talk.session.create`। `managed-room` Gateway हैंडऑफ़ और वॉकी-टॉकी रूम के लिए आरक्षित है।
- **Android Talk (रीयलटाइम)**: `talk.realtime.mode: "realtime"` और `talk.realtime.transport: "gateway-relay"` के साथ इसे सक्षम करें। अन्यथा Android नेटिव वाक् पहचान, Gateway चैट और `talk.speak` पर बना रहता है।
- **केवल-ट्रांसक्रिप्शन क्लाइंट**: सहायक की ध्वनि प्रतिक्रिया के बिना कैप्शन/डिक्टेशन के लिए `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, फिर `talk.session.appendAudio`, `talk.session.cancelTurn` और `talk.session.close`। एक बार में अपलोड किए गए वॉइस नोट अभी भी [मीडिया समझ](/hi/nodes/media-understanding) ऑडियो पथ का उपयोग करते हैं।

नेटिव Talk एक निरंतर लूप है: वाणी सुनें, सक्रिय सत्र के माध्यम से ट्रांसक्रिप्ट को मॉडल के पास भेजें, प्रतिक्रिया की प्रतीक्षा करें, फिर कॉन्फ़िगर किए गए Talk प्रदाता (`talk.speak`) के माध्यम से उसे बोलें।

क्लाइंट-स्वामित्व वाला रीयलटाइम Talk, `chat.send` को सीधे कॉल करने के बजाय प्रदाता के टूल कॉल को `talk.client.toolCall` के माध्यम से अग्रेषित करता है। जब कोई रीयलटाइम परामर्श सक्रिय हो, तब क्लाइंट बोले गए इनपुट को `status`, `steer`, `cancel` या `followup` के रूप में वर्गीकृत करने के लिए `talk.client.steer` या `talk.session.steer` को कॉल कर सकते हैं। स्वीकृत निर्देशन सक्रिय एम्बेडेड रन की कतार में जाता है; अस्वीकृत निर्देशन `no_active_run`, `not_streaming` या `compacting` जैसा कारण लौटाता है।

केवल-ट्रांसक्रिप्शन Talk, रीयलटाइम और STT/TTS सत्रों के समान Talk इवेंट एनवेलप उत्सर्जित करता है, लेकिन `mode: "transcription"` और `brain: "none"` का उपयोग करता है। सभी Talk सत्र `talk.event` चैनल पर इवेंट प्रसारित करते हैं; क्लाइंट आंशिक/अंतिम ट्रांसक्रिप्ट अपडेट (`transcript.delta`/`transcript.done`) और अन्य सत्र टेलीमेट्री के लिए इसकी सदस्यता लेते हैं।

## व्यवहार (macOS)

- Talk मोड सक्षम रहने पर हमेशा सक्रिय ओवरले।
- **सुनना &rarr; सोचना &rarr; बोलना** चरण परिवर्तन।
- थोड़े विराम (मौन विंडो) पर वर्तमान ट्रांसक्रिप्ट भेज दिया जाता है।
- उत्तर WebChat में लिखे जाते हैं (टाइप करने के समान)।
- **बोलने पर बाधित करें** (डिफ़ॉल्ट रूप से चालू): यदि सहायक के बोलते समय उपयोगकर्ता बोलता है, तो प्लेबैक रुक जाता है और अगले प्रॉम्प्ट के लिए बाधा का टाइमस्टैम्प दर्ज किया जाता है।

## उत्तरों में ध्वनि निर्देश

सहायक ध्वनि को नियंत्रित करने के लिए उत्तर के आरंभ में एक JSON पंक्ति जोड़ सकता है:

```json
{ "voice": "<voice-id>", "once": true }
```

नियम:

- केवल पहली गैर-रिक्त पंक्ति; TTS प्लेबैक से पहले JSON पंक्ति हटा दी जाती है।
- अज्ञात कुंजियों को अनदेखा किया जाता है।
- `once: true` केवल वर्तमान उत्तर पर लागू होता है; इसके बिना, ध्वनि नया Talk मोड डिफ़ॉल्ट बन जाती है।

समर्थित कुंजियाँ: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`।

## कॉन्फ़िगरेशन (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| कुंजी                                      | डिफ़ॉल्ट                                    | टिप्पणियाँ                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | सक्रिय Talk TTS प्रदाता। macOS-स्थानीय प्लेबैक पथों के लिए `elevenlabs`, `mlx` या `system` का उपयोग करें।                                                                                                                                                                             |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs वापस `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`, या API कुंजी के साथ उपलब्ध पहली ध्वनि का उपयोग करता है।                                                                                                                                                             |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | वापस `ELEVENLABS_API_KEY` (या उपलब्ध होने पर Gateway शेल प्रोफ़ाइल) का उपयोग करता है।                                                                                                                                                                                                |
| `speechLocale`                           | डिवाइस डिफ़ॉल्ट                             | iOS/macOS पर डिवाइस-आधारित Talk वाक् पहचान के लिए BCP 47 लोकेल आईडी।                                                                                                                                                                                                       |
| `silenceTimeoutMs`                       | `700` ms macOS/Android, `900` ms iOS       | Talk द्वारा ट्रांसक्रिप्ट भेजने से पहले की विराम विंडो।                                                                                                                                                                                                                             |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | MP3 स्ट्रीमिंग को बाध्य करने के लिए `mp3_*` सेट करें।                                                                                                                                                                                                                                        |
| `consultThinkingLevel`                   | सेट नहीं                                    | रीयलटाइम `openclaw_agent_consult` कॉल के पीछे एजेंट रन के लिए सोचने के स्तर का ओवरराइड।                                                                                                                                                                                  |
| `consultFastMode`                        | सेट नहीं                                    | रीयलटाइम `openclaw_agent_consult` कॉल के लिए तेज़-मोड ओवरराइड।                                                                                                                                                                                                            |
| `realtime.provider`                      | -                                          | WebRTC के लिए `openai`, प्रदाता WebSocket के लिए `google`, या Gateway रिले के माध्यम से केवल-ब्रिज प्रदाता।                                                                                                                                                                     |
| `realtime.providers.<id>`                | -                                          | प्रदाता-स्वामित्व वाला रीयलटाइम कॉन्फ़िगरेशन। ब्राउज़र को केवल अस्थायी/सीमित सत्र क्रेडेंशियल मिलते हैं, कभी भी मानक API कुंजी नहीं।                                                                                                                                                 |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | अंतर्निहित OpenAI रीयलटाइम ध्वनि आईडी (पुरानी `voice` कुंजी अभी भी काम करती है, लेकिन अप्रचलित है)। वर्तमान `gpt-realtime-2.1` ध्वनियाँ: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; सर्वोत्तम गुणवत्ता के लिए `marin` और `cedar` अनुशंसित हैं। |
| `realtime.transport`                     | -                                          | `webrtc`: iOS और ब्राउज़र में क्लाइंट-स्वामित्व वाला OpenAI WebRTC। `provider-websocket`: ब्राउज़र-स्वामित्व वाला, iOS पर Gateway रिले में बना रहता है। `gateway-relay`: प्रदाता ऑडियो को Gateway पर रखता है; Android केवल इस ट्रांसपोर्ट के साथ रीयलटाइम का उपयोग करता है।                                  |
| `realtime.brain`                         | -                                          | `agent-consult` रीयलटाइम टूल कॉल को Gateway नीति के माध्यम से रूट करता है; `direct-tools` पुरानी प्रत्यक्ष-टूल संगतता है; `none` ट्रांसक्रिप्शन/बाहरी ऑर्केस्ट्रेशन के लिए है।                                                                                                 |
| `realtime.consultRouting`                | -                                          | जब प्रदाता `openclaw_agent_consult` को छोड़ देता है, तब `provider-direct` उसके प्रत्यक्ष उत्तर को बनाए रखता है; इसके बजाय `force-agent-consult` अंतिम उपयोगकर्ता ट्रांसक्रिप्ट को OpenClaw के माध्यम से रूट करता है।                                                                                          |
| `realtime.instructions`                  | -                                          | OpenClaw के अंतर्निहित रीयलटाइम प्रॉम्प्ट में प्रदाता-संबंधी सिस्टम निर्देश (ध्वनि शैली/लहजा) जोड़ता है; डिफ़ॉल्ट `openclaw_agent_consult` मार्गदर्शन बना रहता है।                                                                                                                |

`talk.catalog` प्रामाणिक प्रदाता आईडी और रजिस्ट्री उपनाम, प्रत्येक प्रदाता के मान्य मोड/ट्रांसपोर्ट/ब्रेन रणनीतियाँ/रीयलटाइम ऑडियो प्रारूप/क्षमता फ़्लैग, और रनटाइम द्वारा चयनित तत्परता परिणाम उपलब्ध कराता है। प्रथम-पक्ष Talk क्लाइंट को प्रदाता उपनाम स्थानीय रूप से बनाए रखने के बजाय उस कैटलॉग को पढ़ना चाहिए; समूह तत्परता को शामिल न करने वाले पुराने Gateway को निश्चित रूप से गैर-कॉन्फ़िगर किया हुआ मानने के बजाय असत्यापित मानें। स्ट्रीमिंग ट्रांसक्रिप्शन प्रदाताओं की खोज `talk.catalog.transcription` के माध्यम से की जाती है; वर्तमान Gateway रिले समर्पित Talk ट्रांसक्रिप्शन कॉन्फ़िगरेशन सतह जारी होने तक Voice Call स्ट्रीमिंग प्रदाता कॉन्फ़िगरेशन का उपयोग करता है।

## macOS UI

- मेनू बार टॉगल: **Talk**
- कॉन्फ़िगरेशन टैब: **Talk Mode** समूह (वॉइस आईडी + व्यवधान टॉगल)
- ओवरले: ऑर्ब सार्वभौमिक टॉक वेवफ़ॉर्म प्रस्तुत करता है (iOS, watchOS और Android के साथ साझा)। सुनना लाइव माइक स्तर का अनुसरण करता है, बोलना वास्तविक TTS प्लेबैक एन्वेलप का अनुसरण करता है, सोचना धीरे-धीरे स्पंदित होता है। रोकने/फिर से शुरू करने के लिए ऑर्ब पर क्लिक करें, बोलना रोकने के लिए डबल-क्लिक करें और Talk मोड से बाहर निकलने के लिए X पर क्लिक करें।

## Android UI

- Voice टैब टॉगल: **Talk**
- मैन्युअल **Mic** और **Talk** परस्पर अनन्य कैप्चर मोड हैं।
- मैन्युअल Mic और रीयलटाइम Talk कनेक्ट किए गए Bluetooth Classic या BLE हेडसेट माइक्रोफ़ोन को प्राथमिकता देते हैं; यदि उसका कनेक्शन टूट जाता है, तो ऐप किसी अन्य हेडसेट इनपुट का अनुरोध करता है या डिफ़ॉल्ट माइक्रोफ़ोन पर वापस चला जाता है और कैप्चर रुकने पर डिफ़ॉल्ट वरीयता बहाल कर देता है।
- ऐप के फ़ोरग्राउंड से बाहर जाने या उपयोगकर्ता के Voice टैब छोड़ने पर मैन्युअल Mic रुक जाता है।
- Talk Mode टॉगल बंद किए जाने या Node का कनेक्शन टूटने तक चलता रहता है और सक्रिय रहने के दौरान Android के माइक्रोफ़ोन फ़ोरग्राउंड-सर्विस प्रकार का उपयोग करता है।
- Android कम-विलंबता वाली `AudioTrack` स्ट्रीमिंग के लिए `pcm_16000`, `pcm_22050`, `pcm_24000` और `pcm_44100` आउटपुट प्रारूपों का समर्थन करता है।

## टिप्पणियाँ

- Speech + Microphone अनुमतियाँ आवश्यक हैं।
- नेटिव Talk सक्रिय Gateway सत्र का उपयोग करता है और केवल प्रतिक्रिया इवेंट अनुपलब्ध होने पर इतिहास पोलिंग पर वापस जाता है।
- Gateway सक्रिय Talk प्रदाता का उपयोग करके `talk.speak` के माध्यम से Talk प्लेबैक का समाधान करता है। Android केवल वह RPC अनुपलब्ध होने पर स्थानीय सिस्टम TTS पर वापस जाता है।
- macOS स्थानीय MLX प्लेबैक उपलब्ध होने पर बंडल किए गए `openclaw-mlx-tts` सहायक या `PATH` पर किसी निष्पादन योग्य फ़ाइल का उपयोग करता है। विकास के दौरान किसी कस्टम सहायक बाइनरी की ओर संकेत करने के लिए `OPENCLAW_MLX_TTS_BIN` सेट करें।
- वॉइस निर्देश मान श्रेणियाँ (ElevenLabs): `stability`, `similarity` और `style`, `0..1` स्वीकार करते हैं; `speed`, `0.5..2` स्वीकार करता है; `latency_tier`, `0..4` स्वीकार करता है।

## संबंधित

- [वॉइस वेक](/hi/nodes/voicewake)
- [ऑडियो और वॉइस नोट्स](/hi/nodes/audio)
- [मीडिया की समझ](/hi/nodes/media-understanding)
