---
read_when:
    - Talk-Modus auf macOS/iOS/Android implementieren
    - Sprach-/TTS-/Unterbrechungsverhalten ändern
summary: 'Sprechmodus: kontinuierliche Sprachunterhaltungen über lokales STT/TTS und Echtzeitstimme'
title: Sprechmodus
x-i18n:
    generated_at: "2026-07-03T00:55:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

Der Talk-Modus hat zwei Laufzeitformen:

- Native macOS-/iOS-/Android-Talk verwendet lokale Spracherkennung, Gateway-Chat und `talk.speak`-TTS. Nodes kündigen die Fähigkeit `talk` an und deklarieren die `talk.*`-Befehle, die sie unterstützen.
- iOS-Talk verwendet clientseitig verwaltetes WebRTC für OpenAI-Echtzeitkonfigurationen, die `webrtc` auswählen oder den Transport weglassen. Explizite `gateway-relay`-, `provider-websocket`- und Nicht-OpenAI-Echtzeitkonfigurationen bleiben auf dem vom Gateway verwalteten Relay; Nicht-Echtzeitkonfigurationen verwenden die native Sprachschleife.
- Browser-Talk verwendet `talk.client.create` für clientseitig verwaltete `webrtc`- und `provider-websocket`-Sitzungen oder `talk.session.create` für vom Gateway verwaltete `gateway-relay`-Sitzungen. `managed-room` ist für Gateway-Übergabe und Walkie-Talkie-Räume reserviert.
- Android-Talk kann mit `talk.realtime.mode: "realtime"` und `talk.realtime.transport: "gateway-relay"` vom Gateway verwaltete Echtzeit-Relay-Sitzungen aktivieren. Andernfalls bleibt es bei nativer Spracherkennung, Gateway-Chat und `talk.speak`.
- Nur-Transkriptions-Clients verwenden `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` und danach `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`, wenn sie Untertitel oder Diktat ohne gesprochene Antwort eines Assistenten benötigen.

Native Talk ist eine kontinuierliche Sprachkonversationsschleife:

1. Auf Sprache warten
2. Transkript über die aktive Sitzung an das Modell senden
3. Auf die Antwort warten
4. Sie über den konfigurierten Talk-Provider sprechen (`talk.speak`)

Clientseitig verwalteter Echtzeit-Talk leitet Provider-Tool-Aufrufe über `talk.client.toolCall` weiter; diese Clients rufen für Echtzeit-Rückfragen nicht direkt `chat.send` auf.
Während eine Echtzeit-Rückfrage aktiv ist, können Talk-Clients `talk.client.steer` oder
`talk.session.steer` verwenden, um gesprochene Eingaben als `status`, `steer`, `cancel` oder
`followup` zu klassifizieren. Akzeptierte Steuerung wird in den aktiven eingebetteten Lauf eingereiht; abgelehnte
Steuerung gibt einen strukturierten Grund wie `no_active_run`, `not_streaming`
oder `compacting` zurück.

Nur-Transkriptions-Talk gibt denselben gemeinsamen Talk-Ereignisumschlag aus wie Echtzeit- und STT/TTS-Sitzungen, verwendet aber `mode: "transcription"` und `brain: "none"`. Er ist für Untertitel, Diktat und reine Beobachtungs-Spracherfassung gedacht; einmalig hochgeladene Sprachnotizen verwenden weiterhin den Medien-/Audiopfad.

## Verhalten (macOS)

- **Ständig sichtbares Overlay**, während der Talk-Modus aktiviert ist.
- Phasenübergänge **Zuhören → Denken → Sprechen**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden **in WebChat geschrieben** (wie beim Tippen).
- **Unterbrechen bei Sprache** (standardmäßig aktiviert): Wenn der Benutzer zu sprechen beginnt, während der Assistent spricht, stoppen wir die Wiedergabe und notieren den Unterbrechungszeitstempel für den nächsten Prompt.

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
- `silenceTimeoutMs`: Wenn nicht gesetzt, behält Talk das plattformseitige Standard-Pausenfenster vor dem Senden des Transkripts bei (`700 ms auf macOS und Android, 900 ms auf iOS`)
- `provider`: Wählt den aktiven Talk-Provider aus. Verwenden Sie `elevenlabs`, `mlx` oder `system` für die macOS-lokalen Wiedergabepfade.
- `providers.<provider>.voiceId`: Fällt für ElevenLabs auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Schlüssel verfügbar ist).
- `providers.elevenlabs.modelId`: Standardmäßig `eleven_v3`, wenn nicht gesetzt.
- `providers.mlx.modelId`: Standardmäßig `mlx-community/Soprano-80M-bf16`, wenn nicht gesetzt.
- `providers.elevenlabs.apiKey`: Fällt auf `ELEVENLABS_API_KEY` zurück (oder auf das Gateway-Shell-Profil, falls verfügbar).
- `consultThinkingLevel`: Optionale Überschreibung der Denkstufe für den vollständigen OpenClaw-Agentenlauf hinter Echtzeit-`openclaw_agent_consult`-Aufrufen.
- `consultFastMode`: Optionale Schnellmodus-Überschreibung für Echtzeit-`openclaw_agent_consult`-Aufrufe.
- `realtime.provider`: Wählt den aktiven Echtzeit-Sprach-Provider aus. Verwenden Sie `openai` für WebRTC, `google` für Provider-WebSocket oder einen reinen Bridge-Provider über Gateway-Relay.
- `realtime.providers.<provider>` speichert Provider-eigene Echtzeitkonfiguration. Der Browser erhält nur kurzlebige oder eingeschränkte Sitzungsanmeldedaten, niemals einen Standard-API-Schlüssel.
- `realtime.providers.openai.voice`: Integrierte OpenAI-Realtime-Stimmen-ID. Aktuelle `gpt-realtime-2`-Stimmen sind `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` und `cedar`; `marin` und `cedar` werden für die beste Qualität empfohlen.
- `realtime.transport`: `webrtc` verwendet clientseitig verwaltetes OpenAI-WebRTC auf iOS und im Browser. `provider-websocket` wird vom Browser verwaltet, bleibt auf iOS aber auf dem Gateway-Relay. `gateway-relay` hält Provider-Audio auf dem Gateway; Android verwendet Echtzeit nur für diesen Transport und behält andernfalls seine native STT/TTS-Schleife bei.
- `realtime.brain`: `agent-consult` leitet Echtzeit-Tool-Aufrufe über Gateway-Policy; `direct-tools` ist altes Kompatibilitätsverhalten für direkte Tools; `none` ist für Transkription oder externe Orchestrierung vorgesehen.
- `realtime.consultRouting`: `provider-direct` bewahrt die direkte Antwort des Providers, wenn dieser `openclaw_agent_consult` überspringt; `force-agent-consult` veranlasst das Gateway-Relay, finalisierte Benutzertranskripte stattdessen durch OpenClaw zu routen.
- `realtime.instructions`: Hängt Provider-seitige Systemanweisungen an den integrierten Echtzeit-Prompt von OpenClaw an. Verwenden Sie dies für Sprachstil und Ton; OpenClaw behält die standardmäßige `openclaw_agent_consult`-Anleitung bei.
- `talk.catalog` stellt die gültigen Modi, Transporte, Brain-Strategien, Echtzeit-Audioformate und Fähigkeits-Flags jedes Providers bereit, damit First-Party-Talk-Clients nicht unterstützte Kombinationen vermeiden können.
- Streaming-Transkriptions-Provider werden über `talk.catalog.transcription` erkannt. Das aktuelle Gateway-Relay verwendet die Streaming-Provider-Konfiguration für Sprachanrufe, bis die dedizierte Talk-Transkriptions-Konfigurationsoberfläche hinzugefügt wird.
- `speechLocale`: Optionale BCP-47-Locale-ID für die geräteinterne Talk-Spracherkennung auf iOS/macOS. Nicht setzen, um den Gerätestandard zu verwenden.
- `outputFormat`: Standardmäßig `pcm_44100` auf macOS/iOS und `pcm_24000` auf Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-Benutzeroberfläche

- Menüleisten-Umschalter: **Talk**
- Konfigurationstab: Gruppe **Talk-Modus** (Stimmen-ID + Unterbrechen-Umschalter)
- Overlay:
  - **Zuhören**: Wolke pulsiert mit Mikrofonpegel
  - **Denken**: absinkende Animation
  - **Sprechen**: ausstrahlende Ringe
  - Wolke anklicken: Sprechen stoppen
  - X anklicken: Talk-Modus beenden

## Android-Benutzeroberfläche

- Umschalter im Sprachtab: **Talk**
- Manuelle **Mikrofon**- und **Talk**-Modi sind sich gegenseitig ausschließende Laufzeit-Erfassungsmodi.
- Manuelles Mikrofon und Echtzeit-Talk bevorzugen ein verbundenes Bluetooth-Classic- oder BLE-Headset-Mikrofon. Wenn die Verbindung getrennt wird, fordert die App eine andere Headset-Eingabe an oder lässt Android das Standardmikrofon verwenden; das Stoppen der Erfassung stellt die Standardmikrofon-Präferenz wieder her.
- Manuelles Mikrofon stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Sprachtab verlässt.
- Der Talk-Modus läuft weiter, bis er ausgeschaltet wird oder der Android-Node die Verbindung trennt, und verwendet während der Aktivität den Android-Foreground-Service-Typ für Mikrofone.

## Hinweise

- Erfordert Berechtigungen für Sprache und Mikrofon.
- Native Talk verwendet die aktive Gateway-Sitzung und fällt nur auf Verlaufspolling zurück, wenn Antwortereignisse nicht verfügbar sind.
- Clientseitig verwalteter Echtzeit-Talk verwendet `talk.client.toolCall` für `openclaw_agent_consult`, statt `chat.send` für Provider-eigene Sitzungen offenzulegen.
- Nur-Transkriptions-Talk verwendet `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`; Clients abonnieren `talk.event` für partielle/finale Transkriptaktualisierungen.
- Das Gateway löst Talk-Wiedergabe über `talk.speak` mit dem aktiven Talk-Provider auf. Android fällt nur dann auf lokale System-TTS zurück, wenn dieser RPC nicht verfügbar ist.
- macOS-lokale MLX-Wiedergabe verwendet den gebündelten `openclaw-mlx-tts`-Helper, wenn vorhanden, oder eine ausführbare Datei auf `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, um während der Entwicklung auf ein benutzerdefiniertes Helper-Binary zu verweisen.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird auf `0..4` validiert, wenn gesetzt.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für latenzarmes AudioTrack-Streaming.

## Verwandte Themen

- [Sprachaktivierung](/de/nodes/voicewake)
- [Audio und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
