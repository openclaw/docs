---
read_when:
    - macOS/iOS/Android पर Talk मोड लागू करना
    - आवाज़/TTS/बाधित करने के व्यवहार को बदलना
summary: 'बातचीत मोड: स्थानीय STT/TTS और रीयलटाइम वॉइस में निरंतर स्पीच बातचीत'
title: बातचीत मोड
x-i18n:
    generated_at: "2026-07-03T00:57:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

टॉक मोड के दो runtime आकार हैं:

- नेटिव macOS/iOS/Android टॉक स्थानीय speech recognition, Gateway चैट, और `talk.speak` TTS का उपयोग करता है। नोड `talk` capability विज्ञापित करते हैं और समर्थित `talk.*` commands घोषित करते हैं।
- iOS टॉक उन OpenAI realtime configurations के लिए client-owned WebRTC का उपयोग करता है जो `webrtc` चुनते हैं या transport छोड़ देते हैं। स्पष्ट `gateway-relay`, `provider-websocket`, और गैर-OpenAI realtime configurations Gateway-owned relay पर रहते हैं; गैर-realtime configurations नेटिव speech loop का उपयोग करते हैं।
- Browser टॉक client-owned `webrtc` और `provider-websocket` sessions के लिए `talk.client.create`, या Gateway-owned `gateway-relay` sessions के लिए `talk.session.create` का उपयोग करता है। `managed-room` Gateway handoff और walkie-talkie rooms के लिए आरक्षित है।
- Android टॉक `talk.realtime.mode: "realtime"` और `talk.realtime.transport: "gateway-relay"` के साथ Gateway-owned realtime relay sessions में opt in कर सकता है। अन्यथा यह नेटिव speech recognition, Gateway चैट, और `talk.speak` पर रहता है।
- केवल transcription वाले clients `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` का उपयोग करते हैं, फिर जब उन्हें assistant voice response के बिना captions या dictation चाहिए हो तो `talk.session.appendAudio`, `talk.session.cancelTurn`, और `talk.session.close` का उपयोग करते हैं।

नेटिव टॉक एक निरंतर voice conversation loop है:

1. speech के लिए सुनें
2. active session के माध्यम से transcript को model को भेजें
3. response की प्रतीक्षा करें
4. configured टॉक provider (`talk.speak`) के माध्यम से उसे बोलें

Client-owned realtime टॉक provider tool calls को `talk.client.toolCall` के माध्यम से forward करता है; ये clients realtime consults के लिए सीधे `chat.send` call नहीं करते।
जब कोई realtime consult active हो, तो टॉक clients बोले गए input को `status`, `steer`, `cancel`, या
`followup` के रूप में classify करने के लिए `talk.client.steer` या
`talk.session.steer` का उपयोग कर सकते हैं। Accepted steering active embedded run में queue की जाती है; rejected
steering `no_active_run`, `not_streaming`,
या `compacting` जैसा structured reason लौटाती है।

केवल transcription वाला टॉक realtime और STT/TTS sessions जैसा ही common टॉक event envelope emit करता है, लेकिन `mode: "transcription"` और `brain: "none"` का उपयोग करता है। यह captions, dictation, और observe-only speech capture के लिए है; one-shot uploaded voice notes अभी भी media/audio path का उपयोग करते हैं।

## व्यवहार (macOS)

- टॉक मोड enabled होने पर **हमेशा-on overlay**।
- **सुनना → सोचना → बोलना** phase transitions।
- **short pause** (silence window) पर, current transcript भेजा जाता है।
- Replies **WebChat में लिखे जाते हैं** (typing जैसा ही)।
- **speech पर interrupt** (default on): यदि assistant बोल रहा हो और user बोलना शुरू कर दे, तो हम playback रोकते हैं और अगले prompt के लिए interruption timestamp note करते हैं।

## replies में voice directives

assistant voice नियंत्रित करने के लिए अपनी reply के आगे **single JSON line** लगा सकता है:

```json
{ "voice": "<voice-id>", "once": true }
```

Rules:

- केवल पहली non-empty line।
- Unknown keys ignore की जाती हैं।
- `once: true` केवल current reply पर लागू होता है।
- `once` के बिना, voice टॉक मोड के लिए नया default बन जाती है।
- TTS playback से पहले JSON line हटा दी जाती है।

Supported keys:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

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

Defaults:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: unset होने पर, transcript भेजने से पहले टॉक platform default pause window रखता है (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: active टॉक provider चुनता है। macOS-local playback paths के लिए `elevenlabs`, `mlx`, या `system` का उपयोग करें।
- `providers.<provider>.voiceId`: ElevenLabs के लिए `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` पर fall back करता है (या API key उपलब्ध होने पर पहली ElevenLabs voice)।
- `providers.elevenlabs.modelId`: unset होने पर default `eleven_v3` होता है।
- `providers.mlx.modelId`: unset होने पर default `mlx-community/Soprano-80M-bf16` होता है।
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` पर fall back करता है (या उपलब्ध होने पर gateway shell profile)।
- `consultThinkingLevel`: realtime `openclaw_agent_consult` calls के पीछे full OpenClaw agent run के लिए optional thinking level override।
- `consultFastMode`: realtime `openclaw_agent_consult` calls के लिए optional fast-mode override।
- `realtime.provider`: active realtime voice provider चुनता है। WebRTC के लिए `openai`, provider WebSocket के लिए `google`, या Gateway relay के माध्यम से bridge-only provider का उपयोग करें।
- `realtime.providers.<provider>` provider-owned realtime config store करता है। browser को केवल ephemeral या constrained session credentials मिलते हैं, कभी भी standard API key नहीं।
- `realtime.providers.openai.voice`: built-in OpenAI Realtime voice id। वर्तमान `gpt-realtime-2` voices `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, और `cedar` हैं; best quality के लिए `marin` और `cedar` recommended हैं।
- `realtime.transport`: `webrtc` iOS और browser में client-owned OpenAI WebRTC का उपयोग करता है। `provider-websocket` browser-owned है लेकिन iOS पर Gateway relay पर रहता है। `gateway-relay` provider audio को Gateway पर रखता है; Android इस transport के लिए ही realtime का उपयोग करता है और अन्यथा अपना native STT/TTS loop रखता है।
- `realtime.brain`: `agent-consult` realtime tool calls को Gateway policy के माध्यम से route करता है; `direct-tools` legacy direct-tool compatibility behavior है; `none` transcription या external orchestration के लिए है।
- `realtime.consultRouting`: `provider-direct` provider की direct reply को preserve करता है जब वह `openclaw_agent_consult` skip करता है; `force-agent-consult` Gateway relay को finalized user transcripts OpenClaw के माध्यम से route करने देता है।
- `realtime.instructions`: OpenClaw के built-in realtime prompt में provider-facing system instructions append करता है। voice style और tone के लिए इसका उपयोग करें; OpenClaw default `openclaw_agent_consult` guidance रखता है।
- `talk.catalog` प्रत्येक provider के valid modes, transports, brain strategies, realtime audio formats, और capability flags expose करता है ताकि first-party टॉक clients unsupported combinations से बच सकें।
- Streaming transcription providers `talk.catalog.transcription` के माध्यम से discover किए जाते हैं। dedicated टॉक transcription config surface जोड़े जाने तक current Gateway relay Voice Call streaming provider config का उपयोग करता है।
- `speechLocale`: iOS/macOS पर on-device टॉक speech recognition के लिए optional BCP 47 locale id। device default का उपयोग करने के लिए unset छोड़ें।
- `outputFormat`: macOS/iOS पर default `pcm_44100` और Android पर `pcm_24000` होता है (MP3 streaming force करने के लिए `mp3_*` set करें)

## macOS UI

- Menu bar toggle: **टॉक**
- Config tab: **टॉक मोड** group (voice id + interrupt toggle)
- Overlay:
  - **सुनना**: mic level के साथ cloud pulses
  - **सोचना**: sinking animation
  - **बोलना**: radiating rings
  - cloud पर click करें: बोलना रोकें
  - X पर click करें: टॉक मोड से exit करें

## Android UI

- Voice tab toggle: **टॉक**
- Manual **Mic** और **टॉक** mutually exclusive runtime capture modes हैं।
- Manual Mic और realtime टॉक connected Bluetooth Classic या BLE headset microphone को prefer करते हैं। यदि यह disconnect हो जाए, तो app दूसरा headset input request करता है या Android को default microphone उपयोग करने देता है; capture रोकने पर default microphone preference restore हो जाती है।
- app foreground छोड़ता है या user Voice tab छोड़ता है तो Manual Mic रुक जाता है।
- टॉक मोड toggled off होने या Android node disconnect होने तक चलता रहता है, और active रहते समय Android के microphone foreground-service type का उपयोग करता है।

## Notes

- Speech + Microphone permissions की आवश्यकता होती है।
- नेटिव टॉक active Gateway session का उपयोग करता है और response events unavailable होने पर ही history polling पर fall back करता है।
- Client-owned realtime टॉक provider-owned sessions को `chat.send` expose करने के बजाय `openclaw_agent_consult` के लिए `talk.client.toolCall` का उपयोग करता है।
- केवल transcription वाला टॉक `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, और `talk.session.close` का उपयोग करता है; clients partial/final transcript updates के लिए `talk.event` subscribe करते हैं।
- gateway active टॉक provider का उपयोग करके `talk.speak` के माध्यम से टॉक playback resolve करता है। Android उस RPC के unavailable होने पर ही local system TTS पर fall back करता है।
- macOS local MLX playback मौजूद होने पर bundled `openclaw-mlx-tts` helper, या `PATH` पर executable का उपयोग करता है। development के दौरान custom helper binary की ओर point करने के लिए `OPENCLAW_MLX_TTS_BIN` set करें।
- `eleven_v3` के लिए `stability` को `0.0`, `0.5`, या `1.0` पर validate किया जाता है; अन्य models `0..1` accept करते हैं।
- set होने पर `latency_tier` को `0..4` पर validate किया जाता है।
- Android low-latency AudioTrack streaming के लिए `pcm_16000`, `pcm_22050`, `pcm_24000`, और `pcm_44100` output formats support करता है।

## संबंधित

- [Voice wake](/hi/nodes/voicewake)
- [Audio and voice notes](/hi/nodes/audio)
- [Media understanding](/hi/nodes/media-understanding)
