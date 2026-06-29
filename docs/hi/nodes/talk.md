---
read_when:
    - macOS/iOS/Android पर Talk मोड लागू करना
    - आवाज़/TTS/व्यवधान व्यवहार बदलना
summary: 'टॉक मोड: स्थानीय STT/TTS और रीयलटाइम वॉइस के ज़रिए निरंतर वाक् वार्तालाप'
title: बातचीत मोड
x-i18n:
    generated_at: "2026-06-28T23:25:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Talk मोड के दो रनटाइम आकार हैं:

- नेटिव macOS/iOS/Android Talk स्थानीय स्पीच रिकग्निशन, Gateway चैट, और `talk.speak` TTS का उपयोग करता है। नोड `talk` क्षमता विज्ञापित करते हैं और वे जिन `talk.*` कमांड का समर्थन करते हैं उन्हें घोषित करते हैं।
- ब्राउज़र Talk क्लाइंट-स्वामित्व वाले `webrtc` और `provider-websocket` सत्रों के लिए `talk.client.create`, या Gateway-स्वामित्व वाले `gateway-relay` सत्रों के लिए `talk.session.create` का उपयोग करता है। `managed-room` Gateway हैंडऑफ और वॉकी-टॉकी रूम के लिए आरक्षित है।
- Android Talk `talk.realtime.mode: "realtime"` और `talk.realtime.transport: "gateway-relay"` के साथ Gateway-स्वामित्व वाले रियलटाइम रिले सत्रों में ऑप्ट इन कर सकता है। अन्यथा यह नेटिव स्पीच रिकग्निशन, Gateway चैट, और `talk.speak` पर रहता है।
- केवल-ट्रांसक्रिप्शन क्लाइंट `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` का उपयोग करते हैं, फिर जब उन्हें सहायक की वॉइस प्रतिक्रिया के बिना कैप्शन या डिक्टेशन चाहिए तब `talk.session.appendAudio`, `talk.session.cancelTurn`, और `talk.session.close` का उपयोग करते हैं।

नेटिव Talk एक सतत वॉइस बातचीत लूप है:

1. भाषण सुनें
2. सक्रिय सत्र के माध्यम से ट्रांसक्रिप्ट मॉडल को भेजें
3. प्रतिक्रिया की प्रतीक्षा करें
4. कॉन्फ़िगर किए गए Talk प्रदाता (`talk.speak`) के माध्यम से उसे बोलें

ब्राउज़र रियलटाइम Talk प्रदाता टूल कॉल को `talk.client.toolCall` के माध्यम से आगे भेजता है; ब्राउज़र क्लाइंट रियलटाइम परामर्शों के लिए सीधे `chat.send` कॉल नहीं करते।
जब कोई रियलटाइम परामर्श सक्रिय हो, Talk क्लाइंट बोले गए इनपुट को `status`, `steer`, `cancel`, या
`followup` के रूप में वर्गीकृत करने के लिए `talk.client.steer` या
`talk.session.steer` का उपयोग कर सकते हैं। स्वीकृत स्टीयरिंग सक्रिय एम्बेडेड रन में कतारबद्ध की जाती है; अस्वीकृत
स्टीयरिंग `no_active_run`, `not_streaming`,
या `compacting` जैसे संरचित कारण लौटाती है।

केवल-ट्रांसक्रिप्शन Talk रियलटाइम और STT/TTS सत्रों जैसा ही सामान्य Talk इवेंट एनवेलप उत्सर्जित करता है, लेकिन `mode: "transcription"` और `brain: "none"` का उपयोग करता है। यह कैप्शन, डिक्टेशन, और केवल-अवलोकन स्पीच कैप्चर के लिए है; वन-शॉट अपलोड किए गए वॉइस नोट अब भी मीडिया/ऑडियो पथ का उपयोग करते हैं।

## व्यवहार (macOS)

- Talk मोड सक्षम होने पर **हमेशा-चालू ओवरले**।
- **सुनना → सोचना → बोलना** चरण संक्रमण।
- **छोटे विराम** (साइलेंस विंडो) पर, वर्तमान ट्रांसक्रिप्ट भेजी जाती है।
- उत्तर **WebChat में लिखे जाते हैं** (टाइप करने जैसा)।
- **भाषण पर व्यवधान** (डिफ़ॉल्ट रूप से चालू): अगर सहायक के बोलते समय उपयोगकर्ता बोलना शुरू करता है, हम प्लेबैक रोक देते हैं और अगले प्रॉम्प्ट के लिए व्यवधान टाइमस्टैम्प नोट करते हैं।

## उत्तरों में वॉइस निर्देश

सहायक वॉइस नियंत्रित करने के लिए अपने उत्तर के आगे **एकल JSON पंक्ति** लगा सकता है:

```json
{ "voice": "<voice-id>", "once": true }
```

नियम:

- केवल पहली गैर-खाली पंक्ति।
- अज्ञात कुंजियां अनदेखी की जाती हैं।
- `once: true` केवल वर्तमान उत्तर पर लागू होता है।
- `once` के बिना, वॉइस Talk मोड के लिए नया डिफ़ॉल्ट बन जाती है।
- TTS प्लेबैक से पहले JSON पंक्ति हटा दी जाती है।

समर्थित कुंजियां:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## कॉन्फ़िग (`~/.openclaw/openclaw.json`)

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
          model: "gpt-realtime-2",
          voice: "cedar",
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

डिफ़ॉल्ट:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: सेट न होने पर, Talk ट्रांसक्रिप्ट भेजने से पहले प्लेटफ़ॉर्म का डिफ़ॉल्ट पॉज़ विंडो रखता है (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: सक्रिय Talk प्रदाता चुनता है। macOS-स्थानीय प्लेबैक पथों के लिए `elevenlabs`, `mlx`, या `system` का उपयोग करें।
- `providers.<provider>.voiceId`: ElevenLabs के लिए `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` पर वापस जाता है (या API कुंजी उपलब्ध होने पर पहली ElevenLabs वॉइस)।
- `providers.elevenlabs.modelId`: सेट न होने पर डिफ़ॉल्ट `eleven_v3` होता है।
- `providers.mlx.modelId`: सेट न होने पर डिफ़ॉल्ट `mlx-community/Soprano-80M-bf16` होता है।
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` पर वापस जाता है (या उपलब्ध होने पर Gateway शेल प्रोफ़ाइल)।
- `consultThinkingLevel`: रियलटाइम `openclaw_agent_consult` कॉल के पीछे पूर्ण OpenClaw एजेंट रन के लिए वैकल्पिक थिंकिंग लेवल ओवरराइड।
- `consultFastMode`: रियलटाइम `openclaw_agent_consult` कॉल के लिए वैकल्पिक फ़ास्ट-मोड ओवरराइड।
- `realtime.provider`: सक्रिय ब्राउज़र/सर्वर रियलटाइम वॉइस प्रदाता चुनता है। WebRTC के लिए `openai`, प्रदाता WebSocket के लिए `google`, या Gateway रिले के माध्यम से केवल-ब्रिज प्रदाता का उपयोग करें।
- `realtime.providers.<provider>` प्रदाता-स्वामित्व वाला रियलटाइम कॉन्फ़िग संग्रहीत करता है। ब्राउज़र को केवल अल्पकालिक या सीमित सत्र क्रेडेंशियल मिलते हैं, कभी भी मानक API कुंजी नहीं।
- `realtime.providers.openai.voice`: बिल्ट-इन OpenAI Realtime वॉइस id। वर्तमान `gpt-realtime-2` वॉइस `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, और `cedar` हैं; सर्वोत्तम गुणवत्ता के लिए `marin` और `cedar` अनुशंसित हैं।
- `realtime.transport`: `webrtc` और `provider-websocket` ब्राउज़र रियलटाइम ट्रांसपोर्ट हैं। Android रियलटाइम रिले का उपयोग केवल तब करता है जब यह `gateway-relay` हो; अन्यथा Android Talk अपने नेटिव STT/TTS लूप का उपयोग करता है।
- `realtime.brain`: `agent-consult` रियलटाइम टूल कॉल को Gateway नीति के माध्यम से रूट करता है; `direct-tools` विरासती डायरेक्ट-टूल संगतता व्यवहार है; `none` ट्रांसक्रिप्शन या बाहरी ऑर्केस्ट्रेशन के लिए है।
- `realtime.consultRouting`: जब प्रदाता `openclaw_agent_consult` छोड़ता है तो `provider-direct` प्रदाता के सीधे उत्तर को बनाए रखता है; `force-agent-consult` Gateway रिले को अंतिम उपयोगकर्ता ट्रांसक्रिप्ट OpenClaw के माध्यम से रूट करने को कहता है।
- `realtime.instructions`: OpenClaw के बिल्ट-इन रियलटाइम प्रॉम्प्ट में प्रदाता-सामने सिस्टम निर्देश जोड़ता है। इसे वॉइस शैली और टोन के लिए उपयोग करें; OpenClaw डिफ़ॉल्ट `openclaw_agent_consult` मार्गदर्शन रखता है।
- `talk.catalog` प्रत्येक प्रदाता के वैध मोड, ट्रांसपोर्ट, ब्रेन रणनीतियां, रियलटाइम ऑडियो फ़ॉर्मैट, और क्षमता फ़्लैग उजागर करता है ताकि प्रथम-पक्ष Talk क्लाइंट असमर्थित संयोजनों से बच सकें।
- स्ट्रीमिंग ट्रांसक्रिप्शन प्रदाता `talk.catalog.transcription` के माध्यम से खोजे जाते हैं। वर्तमान Gateway रिले समर्पित Talk ट्रांसक्रिप्शन कॉन्फ़िग सतह जोड़े जाने तक Voice Call स्ट्रीमिंग प्रदाता कॉन्फ़िग का उपयोग करता है।
- `speechLocale`: iOS/macOS पर ऑन-डिवाइस Talk स्पीच रिकग्निशन के लिए वैकल्पिक BCP 47 लोकेल id। डिवाइस डिफ़ॉल्ट उपयोग करने के लिए इसे सेट न करें।
- `outputFormat`: macOS/iOS पर डिफ़ॉल्ट `pcm_44100` और Android पर `pcm_24000` होता है (MP3 स्ट्रीमिंग बाध्य करने के लिए `mp3_*` सेट करें)

## macOS UI

- मेनू बार टॉगल: **Talk**
- कॉन्फ़िग टैब: **Talk मोड** समूह (वॉइस id + व्यवधान टॉगल)
- ओवरले:
  - **सुनना**: क्लाउड माइक स्तर के साथ पल्स करता है
  - **सोचना**: सिंकिंग एनीमेशन
  - **बोलना**: विकीर्ण होती रिंग
  - क्लाउड पर क्लिक करें: बोलना रोकें
  - X पर क्लिक करें: Talk मोड से बाहर निकलें

## Android UI

- वॉइस टैब टॉगल: **Talk**
- मैनुअल **Mic** और **Talk** परस्पर अनन्य रनटाइम कैप्चर मोड हैं।
- जब ऐप फ़ोरग्राउंड छोड़ता है या उपयोगकर्ता Voice टैब छोड़ता है, मैनुअल Mic रुक जाता है।
- Talk मोड तब तक चलता रहता है जब तक उसे बंद न किया जाए या Android नोड डिस्कनेक्ट न हो जाए, और सक्रिय रहते समय Android के माइक्रोफ़ोन फ़ोरग्राउंड-सर्विस प्रकार का उपयोग करता है।

## नोट्स

- Speech + Microphone अनुमतियां आवश्यक हैं।
- नेटिव Talk सक्रिय Gateway सत्र का उपयोग करता है और प्रतिक्रिया इवेंट उपलब्ध न होने पर ही इतिहास पोलिंग पर वापस जाता है।
- ब्राउज़र रियलटाइम Talk प्रदाता-स्वामित्व वाले ब्राउज़र सत्रों को `chat.send` उजागर करने के बजाय `openclaw_agent_consult` के लिए `talk.client.toolCall` का उपयोग करता है।
- केवल-ट्रांसक्रिप्शन Talk `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, और `talk.session.close` का उपयोग करता है; क्लाइंट आंशिक/अंतिम ट्रांसक्रिप्ट अपडेट के लिए `talk.event` को सब्सक्राइब करते हैं।
- gateway सक्रिय Talk प्रदाता का उपयोग करके `talk.speak` के माध्यम से Talk प्लेबैक हल करता है। Android उस RPC के अनुपलब्ध होने पर ही स्थानीय सिस्टम TTS पर वापस जाता है।
- macOS स्थानीय MLX प्लेबैक मौजूद होने पर बंडल किए गए `openclaw-mlx-tts` हेल्पर, या `PATH` पर किसी executable का उपयोग करता है। विकास के दौरान कस्टम हेल्पर बाइनरी की ओर इंगित करने के लिए `OPENCLAW_MLX_TTS_BIN` सेट करें।
- `eleven_v3` के लिए `stability` को `0.0`, `0.5`, या `1.0` पर मान्य किया जाता है; अन्य मॉडल `0..1` स्वीकार करते हैं।
- सेट होने पर `latency_tier` को `0..4` पर मान्य किया जाता है।
- Android कम-लेटेंसी AudioTrack स्ट्रीमिंग के लिए `pcm_16000`, `pcm_22050`, `pcm_24000`, और `pcm_44100` आउटपुट फ़ॉर्मैट का समर्थन करता है।

## संबंधित

- [वॉइस वेक](/hi/nodes/voicewake)
- [ऑडियो और वॉइस नोट्स](/hi/nodes/audio)
- [मीडिया समझ](/hi/nodes/media-understanding)
