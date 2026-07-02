---
read_when:
    - Talk-Modus unter macOS/iOS/Android implementieren
    - Sprach-/TTS-/Unterbrechungsverhalten ändern
summary: 'Sprechmodus: kontinuierliche Sprachunterhaltungen über lokales STT/TTS und Echtzeitstimme'
title: Sprechmodus
x-i18n:
    generated_at: "2026-07-02T22:26:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

Der Talk-Modus hat zwei Laufzeitformen:

- Native macOS-/iOS-/Android-Talk verwendet lokale Spracherkennung, Gateway-Chat und `talk.speak`-TTS. Nodes kündigen die `talk`-Fähigkeit an und deklarieren die von ihnen unterstützten `talk.*`-Befehle.
- iOS-Talk verwendet clientseitiges WebRTC für OpenAI-Realtime-Konfigurationen, die `webrtc` auswählen oder den Transport auslassen. Explizite `gateway-relay`-, `provider-websocket`- und Nicht-OpenAI-Realtime-Konfigurationen bleiben beim Gateway-eigenen Relay; Nicht-Realtime-Konfigurationen verwenden den nativen Sprach-Loop.
- Browser-Talk verwendet `talk.client.create` für clientseitige `webrtc`- und `provider-websocket`-Sitzungen oder `talk.session.create` für Gateway-eigene `gateway-relay`-Sitzungen. `managed-room` ist für Gateway-Übergaben und Walkie-Talkie-Räume reserviert.
- Android-Talk kann sich mit `talk.realtime.mode: "realtime"` und `talk.realtime.transport: "gateway-relay"` für Gateway-eigene Realtime-Relay-Sitzungen entscheiden. Andernfalls bleibt es bei nativer Spracherkennung, Gateway-Chat und `talk.speak`.
- Nur-Transkriptions-Clients verwenden `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` und danach `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`, wenn sie Untertitel oder Diktat ohne Sprachantwort eines Assistenten benötigen.

Native Talk ist ein kontinuierlicher Sprachkonversations-Loop:

1. Auf Sprache warten
2. Transkript über die aktive Sitzung an das Modell senden
3. Auf die Antwort warten
4. Über den konfigurierten Talk-Provider aussprechen (`talk.speak`)

Clientseitiger Realtime-Talk leitet Provider-Tool-Aufrufe über `talk.client.toolCall` weiter; diese Clients rufen `chat.send` für Realtime-Konsultationen nicht direkt auf.
Während eine Realtime-Konsultation aktiv ist, können Talk-Clients `talk.client.steer` oder
`talk.session.steer` verwenden, um gesprochene Eingaben als `status`, `steer`, `cancel` oder
`followup` zu klassifizieren. Akzeptiertes Steering wird in den aktiven eingebetteten Lauf eingereiht; abgelehntes
Steering gibt einen strukturierten Grund wie `no_active_run`, `not_streaming`
oder `compacting` zurück.

Nur-Transkriptions-Talk gibt denselben gemeinsamen Talk-Ereignisumschlag aus wie Realtime- und STT/TTS-Sitzungen, verwendet aber `mode: "transcription"` und `brain: "none"`. Er ist für Untertitel, Diktat und reine Beobachtung von Sprachaufnahmen gedacht; einmalig hochgeladene Sprachnotizen verwenden weiterhin den Medien-/Audiopfad.

## Verhalten (macOS)

- **Immer sichtbares Overlay**, während der Talk-Modus aktiviert ist.
- Phasenübergänge **Zuhören → Denken → Sprechen**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden **in WebChat geschrieben** (wie beim Tippen).
- **Bei Sprache unterbrechen** (standardmäßig ein): Wenn die Person zu sprechen beginnt, während der Assistent spricht, stoppen wir die Wiedergabe und vermerken den Unterbrechungszeitpunkt für den nächsten Prompt.

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
- `silenceTimeoutMs`: Wenn nicht gesetzt, behält Talk das plattformeigene Standard-Pausenfenster bei, bevor das Transkript gesendet wird (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: wählt den aktiven Talk-Provider aus. Verwenden Sie `elevenlabs`, `mlx` oder `system` für die lokalen macOS-Wiedergabepfade.
- `providers.<provider>.voiceId`: fällt für ElevenLabs auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Schlüssel verfügbar ist).
- `providers.elevenlabs.modelId`: Standard ist `eleven_v3`, wenn nicht gesetzt.
- `providers.mlx.modelId`: Standard ist `mlx-community/Soprano-80M-bf16`, wenn nicht gesetzt.
- `providers.elevenlabs.apiKey`: fällt auf `ELEVENLABS_API_KEY` zurück (oder auf das Gateway-Shell-Profil, wenn verfügbar).
- `consultThinkingLevel`: optionale Überschreibung der Denkstufe für den vollständigen OpenClaw-Agent-Lauf hinter Realtime-`openclaw_agent_consult`-Aufrufen.
- `consultFastMode`: optionale Fast-Mode-Überschreibung für Realtime-`openclaw_agent_consult`-Aufrufe.
- `realtime.provider`: wählt den aktiven Realtime-Sprach-Provider aus. Verwenden Sie `openai` für WebRTC, `google` für Provider-WebSocket oder einen reinen Bridge-Provider über Gateway-Relay.
- `realtime.providers.<provider>` speichert die Provider-eigene Realtime-Konfiguration. Der Browser erhält nur flüchtige oder eingeschränkte Sitzungs-Zugangsdaten, niemals einen Standard-API-Schlüssel.
- `realtime.providers.openai.voice`: integrierte OpenAI-Realtime-Stimmen-ID. Aktuelle `gpt-realtime-2`-Stimmen sind `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` und `cedar`; `marin` und `cedar` werden für die beste Qualität empfohlen.
- `realtime.transport`: `webrtc` verwendet clientseitiges OpenAI WebRTC auf iOS und im Browser. `provider-websocket` ist browserseitig, bleibt auf iOS aber beim Gateway-Relay. `gateway-relay` hält Provider-Audio auf dem Gateway; Android verwendet Realtime nur für diesen Transport und behält andernfalls seinen nativen STT/TTS-Loop bei.
- `realtime.brain`: `agent-consult` leitet Realtime-Tool-Aufrufe über die Gateway-Richtlinie; `direct-tools` ist Legacy-Kompatibilitätsverhalten für direkte Tools; `none` ist für Transkription oder externe Orchestrierung.
- `realtime.consultRouting`: `provider-direct` bewahrt die direkte Antwort des Providers, wenn er `openclaw_agent_consult` überspringt; `force-agent-consult` lässt das Gateway-Relay finalisierte Benutzertranskripte stattdessen durch OpenClaw routen.
- `realtime.instructions`: hängt Provider-seitige Systemanweisungen an den integrierten Realtime-Prompt von OpenClaw an. Verwenden Sie dies für Sprachstil und Ton; OpenClaw behält die Standardanleitung für `openclaw_agent_consult` bei.
- `talk.catalog` stellt die gültigen Modi, Transporte, Brain-Strategien, Realtime-Audioformate und Fähigkeits-Flags jedes Providers bereit, damit First-Party-Talk-Clients nicht unterstützte Kombinationen vermeiden können.
- Streaming-Transkriptions-Provider werden über `talk.catalog.transcription` erkannt. Das aktuelle Gateway-Relay verwendet die Streaming-Provider-Konfiguration für Voice Call, bis die dedizierte Talk-Transkriptions-Konfigurationsoberfläche hinzugefügt wird.
- `speechLocale`: optionale BCP-47-Locale-ID für die geräteinterne Talk-Spracherkennung auf iOS/macOS. Nicht setzen, um den Gerätestandard zu verwenden.
- `outputFormat`: Standard ist `pcm_44100` auf macOS/iOS und `pcm_24000` auf Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-Benutzeroberfläche

- Menüleisten-Schalter: **Talk**
- Konfigurations-Tab: Gruppe **Talk-Modus** (Stimmen-ID + Unterbrechungsschalter)
- Overlay:
  - **Zuhören**: Wolke pulsiert mit Mikrofonpegel
  - **Denken**: Sinkende Animation
  - **Sprechen**: Ausstrahlende Ringe
  - Wolke anklicken: Sprechen stoppen
  - X anklicken: Talk-Modus verlassen

## Android-Benutzeroberfläche

- Voice-Tab-Schalter: **Talk**
- Manuelle Modi **Mic** und **Talk** für die Laufzeitaufnahme schließen sich gegenseitig aus.
- Manuelles Mic stoppt, wenn die App den Vordergrund verlässt oder die Person den Voice-Tab verlässt.
- Der Talk-Modus läuft weiter, bis er ausgeschaltet wird oder der Android-Node die Verbindung trennt, und verwendet währenddessen Androids Mikrofon-Foreground-Service-Typ.

## Hinweise

- Erfordert Berechtigungen für Sprache + Mikrofon.
- Native Talk verwendet die aktive Gateway-Sitzung und fällt nur dann auf Verlaufspolling zurück, wenn Antwortereignisse nicht verfügbar sind.
- Clientseitiger Realtime-Talk verwendet `talk.client.toolCall` für `openclaw_agent_consult`, anstatt `chat.send` für Provider-eigene Sitzungen freizugeben.
- Nur-Transkriptions-Talk verwendet `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`; Clients abonnieren `talk.event` für partielle/finale Transkriptaktualisierungen.
- Das Gateway löst Talk-Wiedergabe über `talk.speak` mit dem aktiven Talk-Provider auf. Android fällt nur dann auf lokales System-TTS zurück, wenn dieser RPC nicht verfügbar ist.
- Lokale macOS-MLX-Wiedergabe verwendet den gebündelten `openclaw-mlx-tts`-Helper, wenn vorhanden, oder eine ausführbare Datei auf `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, um während der Entwicklung auf eine benutzerdefinierte Helper-Binärdatei zu verweisen.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird auf `0..4` validiert, wenn gesetzt.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für latenzarmes AudioTrack-Streaming.

## Verwandte Themen

- [Voice Wake](/de/nodes/voicewake)
- [Audio und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
