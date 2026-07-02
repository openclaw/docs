---
read_when:
    - macOS/iOS/Android पर बातचीत मोड लागू करना
    - आवाज़/TTS/इंटरप्ट व्यवहार बदलना
summary: 'Talk मोड: स्थानीय STT/TTS और realtime voice में निरंतर वाक् बातचीत'
title: बातचीत मोड
x-i18n:
    generated_at: "2026-07-02T22:31:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

Talk मोड के दो रनटाइम आकार हैं:

- मूल macOS/iOS/Android Talk स्थानीय वाक् पहचान, Gateway चैट, और `talk.speak` TTS का उपयोग करता है। Nodes `talk` क्षमता का विज्ञापन करते हैं और वे जिन `talk.*` commands का समर्थन करते हैं, उन्हें घोषित करते हैं।
- iOS Talk उन OpenAI realtime configurations के लिए client-owned WebRTC का उपयोग करता है जो `webrtc` चुनते हैं या transport को छोड़ देते हैं। स्पष्ट `gateway-relay`, `provider-websocket`, और non-OpenAI realtime configurations Gateway-owned relay पर रहते हैं; non-realtime configurations native speech loop का उपयोग करते हैं।
- Browser Talk client-owned `webrtc` और `provider-websocket` sessions के लिए `talk.client.create`, या Gateway-owned `gateway-relay` sessions के लिए `talk.session.create` का उपयोग करता है। `managed-room` Gateway handoff और walkie-talkie rooms के लिए आरक्षित है।
- Android Talk `talk.realtime.mode: "realtime"` और `talk.realtime.transport: "gateway-relay"` के साथ Gateway-owned realtime relay sessions में opt in कर सकता है। अन्यथा यह native speech recognition, Gateway chat, और `talk.speak` पर रहता है।
- Transcription-only clients captions या dictation के लिए बिना assistant voice response के जरूरत होने पर `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, फिर `talk.session.appendAudio`, `talk.session.cancelTurn`, और `talk.session.close` का उपयोग करते हैं।

Native Talk एक continuous voice conversation loop है:

1. speech के लिए सुनें
2. transcript को active session के माध्यम से model को भेजें
3. response की प्रतीक्षा करें
4. configured Talk provider (`talk.speak`) के माध्यम से उसे बोलें

Client-owned realtime Talk provider tool calls को `talk.client.toolCall` के माध्यम से forward करता है; वे clients realtime consults के लिए सीधे `chat.send` call नहीं करते।
जब कोई realtime consult active हो, Talk clients बोले गए input को `status`, `steer`, `cancel`, या
`followup` के रूप में classify करने के लिए `talk.client.steer` या
`talk.session.steer` का उपयोग कर सकते हैं। Accepted steering active embedded run में queue किया जाता है; rejected
steering `no_active_run`, `not_streaming`,
या `compacting` जैसे structured reason लौटाता है।

Transcription-only Talk realtime और STT/TTS sessions जैसा ही common Talk event envelope emit करता है, लेकिन `mode: "transcription"` और `brain: "none"` का उपयोग करता है। यह captions, dictation, और observe-only speech capture के लिए है; one-shot uploaded voice notes अभी भी media/audio path का उपयोग करते हैं।

## व्यवहार (macOS)

- Talk mode enabled होने पर **Always-on overlay**।
- **Listening → Thinking → Speaking** phase transitions।
- **short pause** (silence window) पर, current transcript भेजा जाता है।
- Replies **WebChat में लिखे जाते हैं** (typing के समान)।
- **Interrupt on speech** (default on): यदि assistant के बोलते समय user बोलना शुरू करता है, तो हम playback रोकते हैं और अगले prompt के लिए interruption timestamp note करते हैं।

## replies में Voice directives

assistant voice को control करने के लिए अपने reply के पहले **single JSON line** लगा सकता है:

```json
{ "voice": "<voice-id>", "once": true }
```

Rules:

- केवल first non-empty line।
- Unknown keys ignored होते हैं।
- `once: true` केवल current reply पर apply होता है।
- `once` के बिना, voice Talk mode के लिए नया default बन जाता है।
- JSON line TTS playback से पहले हटा दी जाती है।

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
- `silenceTimeoutMs`: unset होने पर, Talk transcript भेजने से पहले platform default pause window रखता है (`macOS और Android पर 700 ms, iOS पर 900 ms`)
- `provider`: active Talk provider चुनता है। macOS-local playback paths के लिए `elevenlabs`, `mlx`, या `system` का उपयोग करें।
- `providers.<provider>.voiceId`: ElevenLabs के लिए `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` पर fallback करता है (या API key available होने पर first ElevenLabs voice)।
- `providers.elevenlabs.modelId`: unset होने पर default `eleven_v3` है।
- `providers.mlx.modelId`: unset होने पर default `mlx-community/Soprano-80M-bf16` है।
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` पर fallback करता है (या available होने पर gateway shell profile)।
- `consultThinkingLevel`: realtime `openclaw_agent_consult` calls के पीछे full OpenClaw agent run के लिए optional thinking level override।
- `consultFastMode`: realtime `openclaw_agent_consult` calls के लिए optional fast-mode override।
- `realtime.provider`: active realtime voice provider चुनता है। WebRTC के लिए `openai`, provider WebSocket के लिए `google`, या Gateway relay के माध्यम से bridge-only provider का उपयोग करें।
- `realtime.providers.<provider>` provider-owned realtime config store करता है। browser को केवल ephemeral या constrained session credentials मिलते हैं, standard API key कभी नहीं।
- `realtime.providers.openai.voice`: built-in OpenAI Realtime voice id। Current `gpt-realtime-2` voices `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, और `cedar` हैं; best quality के लिए `marin` और `cedar` recommended हैं।
- `realtime.transport`: `webrtc` iOS और browser में client-owned OpenAI WebRTC का उपयोग करता है। `provider-websocket` browser-owned है लेकिन iOS पर Gateway relay पर रहता है। `gateway-relay` provider audio को Gateway पर रखता है; Android इस transport के लिए ही realtime का उपयोग करता है और अन्यथा अपना native STT/TTS loop रखता है।
- `realtime.brain`: `agent-consult` realtime tool calls को Gateway policy के माध्यम से route करता है; `direct-tools` legacy direct-tool compatibility behavior है; `none` transcription या external orchestration के लिए है।
- `realtime.consultRouting`: `provider-direct` provider के direct reply को preserve करता है जब वह `openclaw_agent_consult` skip करता है; `force-agent-consult` Gateway relay को finalized user transcripts OpenClaw के माध्यम से route करवाता है।
- `realtime.instructions`: OpenClaw के built-in realtime prompt में provider-facing system instructions append करता है। इसे voice style और tone के लिए उपयोग करें; OpenClaw default `openclaw_agent_consult` guidance रखता है।
- `talk.catalog` प्रत्येक provider के valid modes, transports, brain strategies, realtime audio formats, और capability flags expose करता है ताकि first-party Talk clients unsupported combinations से बच सकें।
- Streaming transcription providers `talk.catalog.transcription` के माध्यम से discover किए जाते हैं। current Gateway relay dedicated Talk transcription config surface जुड़ने तक Voice Call streaming provider config का उपयोग करता है।
- `speechLocale`: iOS/macOS पर on-device Talk speech recognition के लिए optional BCP 47 locale id। device default का उपयोग करने के लिए unset छोड़ें।
- `outputFormat`: macOS/iOS पर default `pcm_44100` और Android पर `pcm_24000` है (MP3 streaming force करने के लिए `mp3_*` set करें)

## macOS UI

- Menu bar toggle: **Talk**
- Config tab: **Talk Mode** group (voice id + interrupt toggle)
- Overlay:
  - **Listening**: cloud mic level के साथ pulses करता है
  - **Thinking**: sinking animation
  - **Speaking**: radiating rings
  - Click cloud: बोलना रोकें
  - Click X: Talk mode से exit करें

## Android UI

- Voice tab toggle: **Talk**
- Manual **Mic** और **Talk** mutually exclusive runtime capture modes हैं।
- Manual Mic तब रुकता है जब app foreground छोड़ता है या user Voice tab छोड़ता है।
- Talk Mode toggled off होने तक या Android node disconnect होने तक चलता रहता है, और active रहते समय Android के microphone foreground-service type का उपयोग करता है।

## Notes

- Speech + Microphone permissions की आवश्यकता है।
- Native Talk active Gateway session का उपयोग करता है और response events unavailable होने पर ही history polling पर fallback करता है।
- Client-owned realtime Talk provider-owned sessions को `chat.send` expose करने के बजाय `openclaw_agent_consult` के लिए `talk.client.toolCall` का उपयोग करता है।
- Transcription-only Talk `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, और `talk.session.close` का उपयोग करता है; clients partial/final transcript updates के लिए `talk.event` subscribe करते हैं।
- gateway active Talk provider का उपयोग करके Talk playback को `talk.speak` के माध्यम से resolve करता है। Android केवल तब local system TTS पर fallback करता है जब वह RPC unavailable हो।
- macOS local MLX playback bundled `openclaw-mlx-tts` helper मौजूद होने पर उसका, या `PATH` पर executable का उपयोग करता है। development के दौरान custom helper binary की ओर point करने के लिए `OPENCLAW_MLX_TTS_BIN` set करें।
- `eleven_v3` के लिए `stability` को `0.0`, `0.5`, या `1.0` पर validate किया जाता है; अन्य models `0..1` accept करते हैं।
- `latency_tier` set होने पर `0..4` पर validate किया जाता है।
- Android low-latency AudioTrack streaming के लिए `pcm_16000`, `pcm_22050`, `pcm_24000`, और `pcm_44100` output formats support करता है।

## Related

- [Voice wake](/hi/nodes/voicewake)
- [Audio and voice notes](/hi/nodes/audio)
- [Media understanding](/hi/nodes/media-understanding)
