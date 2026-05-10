---
read_when:
    - Gesprächsmodus auf macOS/iOS/Android implementieren
    - Sprach-/TTS-/Unterbrechungsverhalten ändern
summary: 'Sprechmodus: kontinuierliche Sprachkonversationen mit lokalem STT/TTS und Echtzeit-Sprache'
title: Gesprächsmodus
x-i18n:
    generated_at: "2026-05-10T19:41:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

Der Talk-Modus hat zwei Laufzeitformen:

- Nativer macOS/iOS/Android-Talk verwendet lokale Spracherkennung, Gateway-Chat und `talk.speak`-TTS. Nodes geben die `talk`-Capability bekannt und deklarieren die von ihnen unterstützten `talk.*`-Befehle.
- Browser-Talk verwendet `talk.client.create` für clientseitig verwaltete `webrtc`- und `provider-websocket`-Sitzungen oder `talk.session.create` für Gateway-seitig verwaltete `gateway-relay`-Sitzungen. `managed-room` ist für Gateway-Übergabe und Walkie-Talkie-Räume reserviert.
- Nur-Transkriptions-Clients verwenden `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` und anschließend `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`, wenn sie Untertitel oder Diktat ohne Sprachantwort eines Assistenten benötigen.

Nativer Talk ist eine kontinuierliche Sprachkonversationsschleife:

1. Auf Sprache warten
2. Transkript über die aktive Sitzung an das Modell senden
3. Auf die Antwort warten
4. Über den konfigurierten Talk-Provider sprechen (`talk.speak`)

Browser-Echtzeit-Talk leitet Provider-Tool-Aufrufe über `talk.client.toolCall` weiter; Browser-Clients rufen `chat.send` bei Echtzeit-Konsultationen nicht direkt auf.

Nur-Transkriptions-Talk gibt dieselbe gemeinsame Talk-Ereignishülle wie Echtzeit- und STT/TTS-Sitzungen aus, verwendet jedoch `mode: "transcription"` und `brain: "none"`. Er ist für Untertitel, Diktat und reine Beobachtungs-Spracherfassung gedacht; einmalig hochgeladene Sprachnotizen verwenden weiterhin den Medien-/Audiopfad.

## Verhalten (macOS)

- **Always-on-Overlay**, während der Talk-Modus aktiviert ist.
- Phasenübergänge **Zuhören → Denken → Sprechen**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden **in WebChat geschrieben** (wie beim Tippen).
- **Unterbrechung bei Sprache** (standardmäßig aktiviert): Wenn der Benutzer zu sprechen beginnt, während der Assistent spricht, stoppen wir die Wiedergabe und notieren den Unterbrechungszeitstempel für den nächsten Prompt.

## Sprachanweisungen in Antworten

Der Assistent kann seiner Antwort eine **einzelne JSON-Zeile** voranstellen, um die Stimme zu steuern:

```json
{ "voice": "<voice-id>", "once": true }
```

Regeln:

- Nur die erste nicht leere Zeile.
- Unbekannte Schlüssel werden ignoriert.
- `once: true` gilt nur für die aktuelle Antwort.
- Ohne `once` wird die Stimme zum neuen Standard für den Talk-Modus.
- Die JSON-Zeile wird vor der TTS-Wiedergabe entfernt.

Unterstützte Schlüssel:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Konfiguration (`~/.openclaw/openclaw.json`)

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

Standardwerte:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: Wenn nicht gesetzt, behält Talk das plattformspezifische Standard-Pausenfenster bei, bevor das Transkript gesendet wird (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: wählt den aktiven Talk-Provider aus. Verwenden Sie `elevenlabs`, `mlx` oder `system` für die lokalen macOS-Wiedergabepfade.
- `providers.<provider>.voiceId`: fällt für ElevenLabs auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Schlüssel verfügbar ist).
- `providers.elevenlabs.modelId`: standardmäßig `eleven_v3`, wenn nicht gesetzt.
- `providers.mlx.modelId`: standardmäßig `mlx-community/Soprano-80M-bf16`, wenn nicht gesetzt.
- `providers.elevenlabs.apiKey`: fällt auf `ELEVENLABS_API_KEY` zurück (oder auf das Gateway-Shell-Profil, falls verfügbar).
- `consultThinkingLevel`: optionale Überschreibung der Denkstufe für den vollständigen OpenClaw-Agentenlauf hinter Echtzeit-`openclaw_agent_consult`-Aufrufen.
- `consultFastMode`: optionale Fast-Mode-Überschreibung für Echtzeit-`openclaw_agent_consult`-Aufrufe.
- `realtime.provider`: wählt den aktiven Browser-/Server-Echtzeit-Sprachprovider aus. Verwenden Sie `openai` für WebRTC, `google` für Provider-WebSocket oder einen reinen Bridge-Provider über Gateway-Relay.
- `realtime.providers.<provider>` speichert Provider-eigene Echtzeitkonfiguration. Der Browser erhält nur ephemere oder eingeschränkte Sitzungsanmeldeinformationen, niemals einen Standard-API-Schlüssel.
- `realtime.providers.openai.voice`: integrierte OpenAI-Realtime-Stimmen-ID. Aktuelle `gpt-realtime-2`-Stimmen sind `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` und `cedar`; `marin` und `cedar` werden für beste Qualität empfohlen.
- `realtime.brain`: `agent-consult` leitet Echtzeit-Tool-Aufrufe durch Gateway-Policy; `direct-tools` ist ein Owner-only-Kompatibilitätsverhalten; `none` ist für Transkription oder externe Orchestrierung vorgesehen.
- `realtime.instructions`: hängt providerseitige Systemanweisungen an den integrierten Echtzeit-Prompt von OpenClaw an. Verwenden Sie dies für Sprachstil und Ton; OpenClaw behält die standardmäßige `openclaw_agent_consult`-Anleitung bei.
- `talk.catalog` stellt die gültigen Modi, Transports, Brain-Strategien, Echtzeit-Audioformate und Capability-Flags jedes Providers bereit, damit First-Party-Talk-Clients nicht unterstützte Kombinationen vermeiden können.
- Streaming-Transkriptions-Provider werden über `talk.catalog.transcription` erkannt. Das aktuelle Gateway-Relay verwendet die Konfiguration des Voice-Call-Streaming-Providers, bis die dedizierte Talk-Transkriptions-Konfigurationsoberfläche hinzugefügt wird.
- `speechLocale`: optionale BCP-47-Locale-ID für die geräteinterne Talk-Spracherkennung unter iOS/macOS. Lassen Sie den Wert ungesetzt, um den Gerätestandard zu verwenden.
- `outputFormat`: standardmäßig `pcm_44100` unter macOS/iOS und `pcm_24000` unter Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-Benutzeroberfläche

- Menüleisten-Umschalter: **Talk**
- Konfigurations-Tab: Gruppe **Talk-Modus** (Stimmen-ID + Unterbrechungs-Umschalter)
- Overlay:
  - **Zuhören**: Wolke pulsiert mit Mikrofonpegel
  - **Denken**: absinkende Animation
  - **Sprechen**: ausstrahlende Ringe
  - Wolke anklicken: Sprechen stoppen
  - X anklicken: Talk-Modus beenden

## Android-Benutzeroberfläche

- Sprach-Tab-Umschalter: **Talk**
- Manuelles **Mikrofon** und **Talk** sind gegenseitig ausschließende Laufzeit-Erfassungsmodi.
- Manuelles Mikrofon stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Sprach-Tab verlässt.
- Der Talk-Modus läuft weiter, bis er ausgeschaltet wird oder der Android-Node die Verbindung trennt, und verwendet während der Aktivität den Vordergrunddiensttyp für das Android-Mikrofon.

## Hinweise

- Erfordert Berechtigungen für Sprache und Mikrofon.
- Nativer Talk verwendet die aktive Gateway-Sitzung und fällt nur auf History-Polling zurück, wenn Antwortereignisse nicht verfügbar sind.
- Browser-Echtzeit-Talk verwendet `talk.client.toolCall` für `openclaw_agent_consult`, anstatt `chat.send` für Provider-eigene Browser-Sitzungen offenzulegen.
- Nur-Transkriptions-Talk verwendet `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`; Clients abonnieren `talk.event` für partielle/finale Transkriptaktualisierungen.
- Das Gateway löst die Talk-Wiedergabe über `talk.speak` mithilfe des aktiven Talk-Providers auf. Android fällt nur dann auf lokale System-TTS zurück, wenn dieser RPC nicht verfügbar ist.
- Die lokale macOS-MLX-Wiedergabe verwendet den gebündelten `openclaw-mlx-tts`-Helper, wenn vorhanden, oder eine ausführbare Datei auf `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, um während der Entwicklung auf eine benutzerdefinierte Helper-Binärdatei zu verweisen.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird auf `0..4` validiert, wenn gesetzt.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für latenzarmes AudioTrack-Streaming.

## Verwandt

- [Voice Wake](/de/nodes/voicewake)
- [Audio und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
