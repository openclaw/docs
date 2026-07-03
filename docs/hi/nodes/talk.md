---
read_when:
    - macOS/iOS/Android पर Talk मोड लागू करना
    - आवाज़/TTS/इंटरप्ट व्यवहार बदलना
summary: 'Talk मोड: स्थानीय STT/TTS और रियलटाइम वॉइस में निरंतर वाक् बातचीत'
title: बातचीत मोड
x-i18n:
    generated_at: "2026-07-03T09:35:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

बातचीत मोड के दो रनटाइम रूप हैं:

- नेटिव macOS/iOS/Android बातचीत स्थानीय speech recognition, Gateway chat, और `talk.speak` TTS का उपयोग करती है। Node `talk` capability विज्ञापित करते हैं और समर्थित `talk.*` commands घोषित करते हैं।
- iOS बातचीत OpenAI realtime configurations के लिए क्लाइंट-स्वामित्व वाले WebRTC का उपयोग करती है, जो `webrtc` चुनते हैं या transport छोड़ देते हैं। स्पष्ट `gateway-relay`, `provider-websocket`, और non-OpenAI realtime configurations Gateway-स्वामित्व वाले relay पर रहते हैं; non-realtime configurations नेटिव speech loop का उपयोग करते हैं।
- ब्राउज़र बातचीत क्लाइंट-स्वामित्व वाले `webrtc` और `provider-websocket` sessions के लिए `talk.client.create`, या Gateway-स्वामित्व वाले `gateway-relay` sessions के लिए `talk.session.create` का उपयोग करती है। `managed-room` Gateway handoff और walkie-talkie rooms के लिए आरक्षित है।
- Android बातचीत `talk.realtime.mode: "realtime"` और `talk.realtime.transport: "gateway-relay"` के साथ Gateway-स्वामित्व वाले realtime relay sessions में opt in कर सकती है। अन्यथा यह नेटिव speech recognition, Gateway chat, और `talk.speak` पर रहती है।
- केवल transcription वाले clients captions या dictation के लिए बिना assistant voice response के जरूरत होने पर `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, फिर `talk.session.appendAudio`, `talk.session.cancelTurn`, और `talk.session.close` का उपयोग करते हैं।

नेटिव बातचीत एक continuous voice conversation loop है:

1. speech सुनें
2. active session के माध्यम से transcript model को भेजें
3. response की प्रतीक्षा करें
4. configured बातचीत provider (`talk.speak`) के जरिए उसे बोलें

क्लाइंट-स्वामित्व वाली realtime बातचीत provider tool calls को `talk.client.toolCall` के माध्यम से forward करती है; ये clients realtime consults के लिए सीधे `chat.send` call नहीं करते।
जब realtime consult active हो, बातचीत clients बोले गए input को `status`, `steer`, `cancel`, या
`followup` के रूप में classify करने के लिए `talk.client.steer` या
`talk.session.steer` का उपयोग कर सकते हैं। Accepted steering active embedded run में queue की जाती है; rejected
steering `no_active_run`, `not_streaming`,
या `compacting` जैसी structured reason लौटाती है।

केवल transcription वाली बातचीत realtime और STT/TTS sessions जैसी ही common बातचीत event envelope emit करती है, लेकिन `mode: "transcription"` और `brain: "none"` का उपयोग करती है। यह captions, dictation, और observe-only speech capture के लिए है; one-shot uploaded voice notes अब भी media/audio path का उपयोग करते हैं।

## व्यवहार (macOS)

- बातचीत मोड enabled होने पर **हमेशा-चालू overlay**।
- **सुनना → सोचना → बोलना** phase transitions।
- **छोटे pause** (silence window) पर current transcript भेजा जाता है।
- Replies **WebChat में लिखे जाते हैं** (typing जैसा ही)।
- **speech पर interrupt** (default on): अगर assistant बोलते समय user बोलना शुरू करता है, तो हम playback रोकते हैं और अगले prompt के लिए interruption timestamp note करते हैं।

## replies में voice directives

assistant voice control करने के लिए अपनी reply की शुरुआत में **single JSON line** लगा सकता है:

```json
{ "voice": "<voice-id>", "once": true }
```

नियम:

- केवल पहली non-empty line।
- Unknown keys ignore की जाती हैं।
- `once: true` केवल current reply पर लागू होता है।
- `once` के बिना, voice बातचीत मोड के लिए नया default बन जाता है।
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
- `silenceTimeoutMs`: unset होने पर, बातचीत transcript भेजने से पहले platform default pause window रखती है (`macOS और Android पर 700 ms, iOS पर 900 ms`)
- `provider`: active बातचीत provider चुनता है। macOS-local playback paths के लिए `elevenlabs`, `mlx`, या `system` का उपयोग करें।
- `providers.<provider>.voiceId`: ElevenLabs के लिए `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` पर fallback करता है (या API key उपलब्ध होने पर पहली ElevenLabs voice)।
- `providers.elevenlabs.modelId`: unset होने पर default `eleven_v3` होता है।
- `providers.mlx.modelId`: unset होने पर default `mlx-community/Soprano-80M-bf16` होता है।
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` पर fallback करता है (या उपलब्ध होने पर gateway shell profile)।
- `consultThinkingLevel`: realtime `openclaw_agent_consult` calls के पीछे full OpenClaw agent run के लिए optional thinking level override।
- `consultFastMode`: realtime `openclaw_agent_consult` calls के लिए optional fast-mode override।
- `realtime.provider`: active realtime voice provider चुनता है। WebRTC के लिए `openai`, provider WebSocket के लिए `google`, या Gateway relay के माध्यम से bridge-only provider का उपयोग करें।
- `realtime.providers.<provider>` provider-स्वामित्व वाली realtime config store करता है। ब्राउज़र को केवल ephemeral या constrained session credentials मिलते हैं, standard API key कभी नहीं।
- `realtime.providers.openai.voice`: built-in OpenAI Realtime voice id। Current `gpt-realtime-2` voices हैं `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, और `cedar`; best quality के लिए `marin` और `cedar` recommended हैं।
- `realtime.transport`: `webrtc` iOS और ब्राउज़र में क्लाइंट-स्वामित्व वाला OpenAI WebRTC उपयोग करता है। `provider-websocket` ब्राउज़र-स्वामित्व वाला है, लेकिन iOS पर Gateway relay पर रहता है। `gateway-relay` provider audio को Gateway पर रखता है; Android केवल इस transport के लिए realtime उपयोग करता है और अन्यथा अपना native STT/TTS loop रखता है।
- `realtime.brain`: `agent-consult` realtime tool calls को Gateway policy के माध्यम से route करता है; `direct-tools` legacy direct-tool compatibility behavior है; `none` transcription या external orchestration के लिए है।
- `realtime.consultRouting`: `provider-direct` provider की direct reply preserve करता है जब वह `openclaw_agent_consult` skip करता है; `force-agent-consult` Gateway relay से finalized user transcripts को इसके बजाय OpenClaw के माध्यम से route करवाता है।
- `realtime.instructions`: OpenClaw के built-in realtime prompt में provider-facing system instructions append करता है। इसे voice style और tone के लिए उपयोग करें; OpenClaw default `openclaw_agent_consult` guidance रखता है।
- `talk.catalog` हर provider के valid modes, transports, brain strategies, realtime audio formats, capability flags, और runtime-selected readiness result के साथ canonical provider ids और registry aliases expose करता है। First-party बातचीत clients को provider aliases locally maintain करने के बजाय उस catalog का उपयोग करना चाहिए; group readiness omit करने वाला पुराना Gateway definitively unconfigured नहीं, बल्कि unverified होता है।
- Streaming transcription providers `talk.catalog.transcription` के माध्यम से discover किए जाते हैं। Current Gateway relay dedicated बातचीत transcription config surface जोड़े जाने तक Voice Call streaming provider config का उपयोग करता है।
- `speechLocale`: iOS/macOS पर on-device बातचीत speech recognition के लिए optional BCP 47 locale id। device default उपयोग करने के लिए unset छोड़ें।
- `outputFormat`: macOS/iOS पर default `pcm_44100` और Android पर `pcm_24000` होता है (MP3 streaming force करने के लिए `mp3_*` set करें)

## macOS UI

- Menu bar toggle: **बातचीत**
- Config tab: **बातचीत मोड** group (voice id + interrupt toggle)
- Overlay:
  - **सुनना**: mic level के साथ cloud pulses
  - **सोचना**: sinking animation
  - **बोलना**: radiating rings
  - cloud पर click करें: बोलना रोकें
  - X पर click करें: बातचीत मोड से exit करें

## Android UI

- Voice tab toggle: **बातचीत**
- Manual **Mic** और **बातचीत** mutually exclusive runtime capture modes हैं।
- Manual Mic और realtime बातचीत connected Bluetooth Classic या BLE headset microphone को prefer करते हैं। अगर यह disconnect हो जाता है, तो app दूसरा headset input request करता है या Android को default microphone उपयोग करने देता है; capture रोकने पर default microphone preference restore होती है।
- जब app foreground छोड़ता है या user Voice tab छोड़ता है, Manual Mic रुक जाता है।
- बातचीत मोड toggled off होने तक या Android node disconnect होने तक चलता रहता है, और active रहने पर Android के microphone foreground-service type का उपयोग करता है।

## Notes

- Speech + Microphone permissions आवश्यक हैं।
- नेटिव बातचीत active Gateway session का उपयोग करती है और response events unavailable होने पर ही history polling पर fallback करती है।
- क्लाइंट-स्वामित्व वाली realtime बातचीत provider-owned sessions को `chat.send` expose करने के बजाय `openclaw_agent_consult` के लिए `talk.client.toolCall` का उपयोग करती है।
- केवल transcription वाली बातचीत `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, और `talk.session.close` का उपयोग करती है; clients partial/final transcript updates के लिए `talk.event` subscribe करते हैं।
- gateway active बातचीत provider का उपयोग करके `talk.speak` के माध्यम से बातचीत playback resolve करता है। Android उस RPC के unavailable होने पर ही local system TTS पर fallback करता है।
- macOS local MLX playback मौजूद होने पर bundled `openclaw-mlx-tts` helper, या `PATH` पर executable का उपयोग करता है। development के दौरान custom helper binary की ओर point करने के लिए `OPENCLAW_MLX_TTS_BIN` set करें।
- `eleven_v3` के लिए `stability` को `0.0`, `0.5`, या `1.0` तक validate किया जाता है; अन्य models `0..1` accept करते हैं।
- set होने पर `latency_tier` को `0..4` तक validate किया जाता है।
- Android low-latency AudioTrack streaming के लिए `pcm_16000`, `pcm_22050`, `pcm_24000`, और `pcm_44100` output formats support करता है।

## संबंधित

- [Voice wake](/hi/nodes/voicewake)
- [Audio और voice notes](/hi/nodes/audio)
- [Media understanding](/hi/nodes/media-understanding)
