---
read_when:
    - Talk-Modus unter macOS/iOS/Android implementieren
    - Sprach-/TTS-/Unterbrechungsverhalten ändern
summary: 'Sprechmodus: kontinuierliche Sprachunterhaltungen über lokale STT/TTS und Echtzeit-Sprache'
title: Sprechmodus
x-i18n:
    generated_at: "2026-06-27T17:40:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Der Talk-Modus hat zwei Laufzeitformen:

- Native macOS/iOS/Android Talk verwendet lokale Spracherkennung, Gateway-Chat und `talk.speak` TTS. Nodes geben die `talk`-Capability bekannt und deklarieren die von ihnen unterstützten `talk.*`-Befehle.
- Browser Talk verwendet `talk.client.create` für clientverwaltete `webrtc`- und `provider-websocket`-Sitzungen oder `talk.session.create` für Gateway-verwaltete `gateway-relay`-Sitzungen. `managed-room` ist für Gateway-Übergaben und Walkie-Talkie-Räume reserviert.
- Android Talk kann mit `talk.realtime.mode: "realtime"` und `talk.realtime.transport: "gateway-relay"` Gateway-verwaltete Echtzeit-Relay-Sitzungen aktivieren. Andernfalls bleibt es bei nativer Spracherkennung, Gateway-Chat und `talk.speak`.
- Nur-Transkriptions-Clients verwenden `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, danach `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`, wenn sie Untertitel oder Diktat ohne Sprachantwort eines Assistenten benötigen.

Native Talk ist eine kontinuierliche Sprachkonversationsschleife:

1. Auf Sprache hören
2. Transkript über die aktive Sitzung an das Modell senden
3. Auf die Antwort warten
4. Über den konfigurierten Talk-Provider sprechen (`talk.speak`)

Browser-Echtzeit-Talk leitet Provider-Toolaufrufe über `talk.client.toolCall` weiter; Browser-Clients rufen `chat.send` für Echtzeit-Konsultationen nicht direkt auf.
Während eine Echtzeit-Konsultation aktiv ist, können Talk-Clients `talk.client.steer` oder
`talk.session.steer` verwenden, um gesprochene Eingaben als `status`, `steer`, `cancel` oder
`followup` zu klassifizieren. Akzeptierte Steuerung wird in den aktiven eingebetteten Lauf eingereiht; abgelehnte
Steuerung gibt einen strukturierten Grund wie `no_active_run`, `not_streaming`
oder `compacting` zurück.

Nur-Transkriptions-Talk gibt denselben gemeinsamen Talk-Ereignisumschlag wie Echtzeit- und STT/TTS-Sitzungen aus, verwendet aber `mode: "transcription"` und `brain: "none"`. Er ist für Untertitel, Diktat und reine Beobachtungs-Spracherfassung gedacht; einmalig hochgeladene Sprachnotizen verwenden weiterhin den Medien-/Audiopfad.

## Verhalten (macOS)

- **Immer sichtbares Overlay**, während der Talk-Modus aktiviert ist.
- Phasenübergänge **Zuhören → Denken → Sprechen**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden **in WebChat geschrieben** (wie beim Tippen).
- **Unterbrechen bei Sprache** (standardmäßig aktiviert): Wenn der Benutzer zu sprechen beginnt, während der Assistent spricht, stoppen wir die Wiedergabe und vermerken den Unterbrechungszeitstempel für den nächsten Prompt.

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

Standards:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: Wenn nicht gesetzt, behält Talk das standardmäßige Pausenfenster der Plattform bei, bevor das Transkript gesendet wird (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: wählt den aktiven Talk-Provider aus. Verwenden Sie `elevenlabs`, `mlx` oder `system` für die macOS-lokalen Wiedergabepfade.
- `providers.<provider>.voiceId`: fällt für ElevenLabs auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Schlüssel verfügbar ist).
- `providers.elevenlabs.modelId`: standardmäßig `eleven_v3`, wenn nicht gesetzt.
- `providers.mlx.modelId`: standardmäßig `mlx-community/Soprano-80M-bf16`, wenn nicht gesetzt.
- `providers.elevenlabs.apiKey`: fällt auf `ELEVENLABS_API_KEY` zurück (oder auf das Gateway-Shellprofil, falls verfügbar).
- `consultThinkingLevel`: optionale Überschreibung der Denkstufe für den vollständigen OpenClaw-Agentenlauf hinter Echtzeit-`openclaw_agent_consult`-Aufrufen.
- `consultFastMode`: optionale Fast-Mode-Überschreibung für Echtzeit-`openclaw_agent_consult`-Aufrufe.
- `realtime.provider`: wählt den aktiven Browser-/Server-Echtzeit-Sprach-Provider aus. Verwenden Sie `openai` für WebRTC, `google` für Provider-WebSocket oder einen reinen Bridge-Provider über Gateway-Relay.
- `realtime.providers.<provider>` speichert providerverwaltete Echtzeitkonfiguration. Der Browser erhält nur kurzlebige oder eingeschränkte Sitzungsanmeldedaten, niemals einen standardmäßigen API-Schlüssel.
- `realtime.providers.openai.voice`: integrierte OpenAI-Realtime-Sprach-ID. Aktuelle `gpt-realtime-2`-Stimmen sind `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` und `cedar`; `marin` und `cedar` werden für die beste Qualität empfohlen.
- `realtime.transport`: `webrtc` und `provider-websocket` sind Browser-Echtzeittransporte. Android verwendet Echtzeit-Relay nur, wenn dies `gateway-relay` ist; andernfalls verwendet Android Talk seine native STT/TTS-Schleife.
- `realtime.brain`: `agent-consult` leitet Echtzeit-Toolaufrufe über Gateway-Richtlinien; `direct-tools` ist Legacy-Kompatibilitätsverhalten für direkte Tools; `none` ist für Transkription oder externe Orchestrierung.
- `realtime.consultRouting`: `provider-direct` behält die direkte Antwort des Providers bei, wenn er `openclaw_agent_consult` überspringt; `force-agent-consult` veranlasst Gateway-Relay stattdessen, finalisierte Benutzertranskripte über OpenClaw zu leiten.
- `realtime.instructions`: hängt providerseitige Systemanweisungen an den integrierten Echtzeit-Prompt von OpenClaw an. Verwenden Sie dies für Sprachstil und Tonfall; OpenClaw behält die standardmäßige `openclaw_agent_consult`-Anleitung bei.
- `talk.catalog` stellt die gültigen Modi, Transporte, Brain-Strategien, Echtzeit-Audioformate und Capability-Flags jedes Providers bereit, damit First-Party-Talk-Clients nicht unterstützte Kombinationen vermeiden können.
- Streaming-Transkriptions-Provider werden über `talk.catalog.transcription` entdeckt. Das aktuelle Gateway-Relay verwendet die Streaming-Provider-Konfiguration für Voice Call, bis die dedizierte Talk-Transkriptionskonfigurationsoberfläche hinzugefügt wird.
- `speechLocale`: optionale BCP-47-Locale-ID für die Talk-Spracherkennung auf dem Gerät unter iOS/macOS. Lassen Sie dies unset, um den Gerätestandard zu verwenden.
- `outputFormat`: standardmäßig `pcm_44100` auf macOS/iOS und `pcm_24000` auf Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-Oberfläche

- Menüleisten-Schalter: **Talk**
- Konfigurations-Tab: Gruppe **Talk Mode** (Sprach-ID + Unterbrechungsschalter)
- Overlay:
  - **Listening**: Wolke pulsiert mit Mikrofonpegel
  - **Thinking**: Sinkende Animation
  - **Speaking**: Ausstrahlende Ringe
  - Wolke anklicken: Sprechen stoppen
  - X anklicken: Talk-Modus beenden

## Android-Oberfläche

- Voice-Tab-Schalter: **Talk**
- Manuelle Modi **Mic** und **Talk** schließen sich als Laufzeit-Erfassungsmodi gegenseitig aus.
- Manual Mic stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Voice-Tab verlässt.
- Talk Mode läuft weiter, bis er ausgeschaltet wird oder die Android-Node getrennt wird, und verwendet während der Aktivität den Android-Mikrofon-Vordergrunddiensttyp.

## Hinweise

- Erfordert Berechtigungen für Speech + Microphone.
- Native Talk verwendet die aktive Gateway-Sitzung und fällt nur dann auf Verlaufspolling zurück, wenn Antwortereignisse nicht verfügbar sind.
- Browser-Echtzeit-Talk verwendet `talk.client.toolCall` für `openclaw_agent_consult`, statt `chat.send` providerverwalteten Browser-Sitzungen bereitzustellen.
- Nur-Transkriptions-Talk verwendet `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`; Clients abonnieren `talk.event` für partielle/finale Transkriptaktualisierungen.
- Das Gateway löst die Talk-Wiedergabe über `talk.speak` mit dem aktiven Talk-Provider auf. Android fällt nur dann auf lokales System-TTS zurück, wenn dieser RPC nicht verfügbar ist.
- Die lokale MLX-Wiedergabe unter macOS verwendet den gebündelten `openclaw-mlx-tts`-Helper, wenn vorhanden, oder eine ausführbare Datei auf `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, um während der Entwicklung auf eine benutzerdefinierte Helper-Binärdatei zu verweisen.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird auf `0..4` validiert, wenn gesetzt.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für latenzarmes AudioTrack-Streaming.

## Verwandt

- [Voice wake](/de/nodes/voicewake)
- [Audio- und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
