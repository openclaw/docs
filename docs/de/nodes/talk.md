---
read_when:
    - Talk-Modus auf macOS/iOS/Android implementieren
    - Sprach-/TTS-/Unterbrechungsverhalten ändern
summary: 'Sprechmodus: kontinuierliche Sprachgespräche über lokale STT/TTS und Echtzeit-Sprachkommunikation'
title: Gesprächsmodus
x-i18n:
    generated_at: "2026-07-03T09:29:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Der Sprechmodus hat zwei Laufzeitformen:

- Natives Sprechen auf macOS/iOS/Android verwendet lokale Spracherkennung, Gateway-Chat und `talk.speak`-TTS. Nodes kündigen die `talk`-Fähigkeit an und deklarieren die von ihnen unterstützten `talk.*`-Befehle.
- iOS-Sprechen verwendet clientseitig verwaltetes WebRTC für OpenAI-Echtzeitkonfigurationen, die `webrtc` auswählen oder den Transport weglassen. Explizite `gateway-relay`-, `provider-websocket`- und Nicht-OpenAI-Echtzeitkonfigurationen bleiben beim Gateway-verwalteten Relay; Nicht-Echtzeitkonfigurationen verwenden die native Sprachschleife.
- Browser-Sprechen verwendet `talk.client.create` für clientseitig verwaltete `webrtc`- und `provider-websocket`-Sitzungen oder `talk.session.create` für Gateway-verwaltete `gateway-relay`-Sitzungen. `managed-room` ist für Gateway-Übergaben und Walkie-Talkie-Räume reserviert.
- Android-Sprechen kann sich mit `talk.realtime.mode: "realtime"` und `talk.realtime.transport: "gateway-relay"` für Gateway-verwaltete Echtzeit-Relay-Sitzungen entscheiden. Andernfalls bleibt es bei nativer Spracherkennung, Gateway-Chat und `talk.speak`.
- Nur-Transkriptions-Clients verwenden `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, anschließend `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`, wenn sie Untertitel oder Diktat ohne gesprochene Assistentenantwort benötigen.

Natives Sprechen ist eine kontinuierliche Sprachkonversationsschleife:

1. Auf Sprache hören
2. Transkript über die aktive Sitzung an das Modell senden
3. Auf die Antwort warten
4. Über den konfigurierten Sprech-Provider ausgeben (`talk.speak`)

Clientseitig verwaltetes Echtzeit-Sprechen leitet Provider-Toolaufrufe über `talk.client.toolCall` weiter; diese Clients rufen `chat.send` für Echtzeitkonsultationen nicht direkt auf.
Während eine Echtzeitkonsultation aktiv ist, können Sprech-Clients `talk.client.steer` oder
`talk.session.steer` verwenden, um gesprochene Eingaben als `status`, `steer`, `cancel` oder
`followup` zu klassifizieren. Akzeptierte Steuerung wird in den aktiven eingebetteten Lauf eingereiht; abgelehnte
Steuerung gibt einen strukturierten Grund wie `no_active_run`, `not_streaming`
oder `compacting` zurück.

Nur-Transkriptions-Sprechen gibt denselben gemeinsamen Sprechereignis-Umschlag aus wie Echtzeit- und STT/TTS-Sitzungen, verwendet aber `mode: "transcription"` und `brain: "none"`. Es ist für Untertitel, Diktat und reine Beobachtungs-Spracherfassung gedacht; einmalig hochgeladene Sprachnotizen verwenden weiterhin den Medien-/Audiopfad.

## Verhalten (macOS)

- **Immer sichtbares Overlay**, während der Sprechmodus aktiviert ist.
- Phasenübergänge **Zuhören → Denken → Sprechen**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden **in WebChat geschrieben** (genau wie beim Tippen).
- **Bei Sprache unterbrechen** (standardmäßig aktiviert): Wenn der Benutzer zu sprechen beginnt, während der Assistent spricht, stoppen wir die Wiedergabe und vermerken den Unterbrechungszeitstempel für den nächsten Prompt.

## Sprachanweisungen in Antworten

Der Assistent kann seiner Antwort eine **einzelne JSON-Zeile** voranstellen, um die Stimme zu steuern:

```json
{ "voice": "<voice-id>", "once": true }
```

Regeln:

- Nur die erste nicht leere Zeile.
- Unbekannte Schlüssel werden ignoriert.
- `once: true` gilt nur für die aktuelle Antwort.
- Ohne `once` wird die Stimme zur neuen Standardeinstellung für den Sprechmodus.
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
- `silenceTimeoutMs`: Wenn nicht gesetzt, behält Sprechen das plattformspezifische Standard-Pausenfenster vor dem Senden des Transkripts bei (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: wählt den aktiven Sprech-Provider aus. Verwenden Sie `elevenlabs`, `mlx` oder `system` für die macOS-lokalen Wiedergabepfade.
- `providers.<provider>.voiceId`: fällt für ElevenLabs auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Schlüssel verfügbar ist).
- `providers.elevenlabs.modelId`: standardmäßig `eleven_v3`, wenn nicht gesetzt.
- `providers.mlx.modelId`: standardmäßig `mlx-community/Soprano-80M-bf16`, wenn nicht gesetzt.
- `providers.elevenlabs.apiKey`: fällt auf `ELEVENLABS_API_KEY` zurück (oder auf das Gateway-Shell-Profil, falls verfügbar).
- `consultThinkingLevel`: optionale Überschreibung der Denkstufe für den vollständigen OpenClaw-Agentenlauf hinter Echtzeit-`openclaw_agent_consult`-Aufrufen.
- `consultFastMode`: optionale Schnellmodus-Überschreibung für Echtzeit-`openclaw_agent_consult`-Aufrufe.
- `realtime.provider`: wählt den aktiven Echtzeit-Sprach-Provider aus. Verwenden Sie `openai` für WebRTC, `google` für Provider-WebSocket oder einen reinen Bridge-Provider über Gateway-Relay.
- `realtime.providers.<provider>` speichert Provider-verwaltete Echtzeitkonfiguration. Der Browser erhält nur kurzlebige oder eingeschränkte Sitzungszugangsdaten, niemals einen Standard-API-Schlüssel.
- `realtime.providers.openai.voice`: integrierte OpenAI-Realtime-Stimmen-ID. Aktuelle `gpt-realtime-2`-Stimmen sind `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` und `cedar`; `marin` und `cedar` werden für die beste Qualität empfohlen.
- `realtime.transport`: `webrtc` verwendet clientseitig verwaltetes OpenAI WebRTC auf iOS und im Browser. `provider-websocket` ist browserseitig verwaltet, bleibt auf iOS aber beim Gateway-Relay. `gateway-relay` hält Provider-Audio auf dem Gateway; Android verwendet Echtzeit nur für diesen Transport und behält andernfalls seine native STT/TTS-Schleife bei.
- `realtime.brain`: `agent-consult` leitet Echtzeit-Toolaufrufe durch die Gateway-Policy; `direct-tools` ist Legacy-Kompatibilitätsverhalten für direkte Tools; `none` ist für Transkription oder externe Orchestrierung gedacht.
- `realtime.consultRouting`: `provider-direct` behält die direkte Antwort des Providers bei, wenn er `openclaw_agent_consult` überspringt; `force-agent-consult` sorgt dafür, dass Gateway-Relay finalisierte Benutzertranskripte stattdessen durch OpenClaw leitet.
- `realtime.instructions`: hängt Provider-seitige Systemanweisungen an den integrierten Echtzeit-Prompt von OpenClaw an. Verwenden Sie dies für Sprachstil und Tonfall; OpenClaw behält die standardmäßige `openclaw_agent_consult`-Anleitung bei.
- `talk.catalog` stellt kanonische Provider-IDs und Registry-Aliasse zusammen mit den gültigen Modi, Transporten, Brain-Strategien, Echtzeit-Audioformaten, Fähigkeitsflags und dem zur Laufzeit ausgewählten Bereitschaftsergebnis jedes Providers bereit. Offizielle Sprech-Clients sollten diesen Katalog verwenden, statt Provider-Aliasse lokal zu pflegen; ein älteres Gateway, das Gruppenbereitschaft auslässt, gilt als ungeprüft und nicht als eindeutig nicht konfiguriert.
- Streaming-Transkriptions-Provider werden über `talk.catalog.transcription` erkannt. Das aktuelle Gateway-Relay verwendet die Streaming-Provider-Konfiguration für Sprachanrufe, bis die dedizierte Konfigurationsoberfläche für Sprechtranskription hinzugefügt wird.
- `speechLocale`: optionale BCP-47-Gebietsschema-ID für die geräteinterne Sprech-Spracherkennung auf iOS/macOS. Nicht setzen, um den Gerätestandard zu verwenden.
- `outputFormat`: standardmäßig `pcm_44100` auf macOS/iOS und `pcm_24000` auf Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-Benutzeroberfläche

- Umschalter in der Menüleiste: **Sprechen**
- Konfigurations-Tab: Gruppe **Sprechmodus** (Stimmen-ID + Unterbrechungs-Umschalter)
- Overlay:
  - **Zuhören**: Wolke pulsiert mit Mikrofonpegel
  - **Denken**: absinkende Animation
  - **Sprechen**: ausstrahlende Ringe
  - Wolke anklicken: Sprechen stoppen
  - X anklicken: Sprechmodus beenden

## Android-Benutzeroberfläche

- Umschalter im Sprach-Tab: **Sprechen**
- Manuelle Modi **Mikrofon** und **Sprechen** schließen sich als Laufzeit-Erfassungsmodi gegenseitig aus.
- Manuelles Mikrofon und Echtzeit-Sprechen bevorzugen ein verbundenes Bluetooth-Classic- oder BLE-Headset-Mikrofon. Wenn die Verbindung getrennt wird, fordert die App eine andere Headset-Eingabe an oder lässt Android das Standardmikrofon verwenden; das Stoppen der Erfassung stellt die Standardmikrofon-Präferenz wieder her.
- Manuelles Mikrofon stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Sprach-Tab verlässt.
- Der Sprechmodus läuft weiter, bis er ausgeschaltet wird oder der Android-Node die Verbindung trennt, und verwendet im aktiven Zustand den Android-Foreground-Service-Typ für Mikrofone.

## Hinweise

- Erfordert Berechtigungen für Spracherkennung und Mikrofon.
- Natives Sprechen verwendet die aktive Gateway-Sitzung und fällt nur dann auf History-Polling zurück, wenn Antwortereignisse nicht verfügbar sind.
- Clientseitig verwaltetes Echtzeit-Sprechen verwendet `talk.client.toolCall` für `openclaw_agent_consult`, statt `chat.send` für Provider-verwaltete Sitzungen offenzulegen.
- Nur-Transkriptions-Sprechen verwendet `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`; Clients abonnieren `talk.event` für partielle/finale Transkriptaktualisierungen.
- Das Gateway löst die Sprechwiedergabe über `talk.speak` mit dem aktiven Sprech-Provider auf. Android fällt nur dann auf lokale System-TTS zurück, wenn dieser RPC nicht verfügbar ist.
- Die lokale macOS-MLX-Wiedergabe verwendet den gebündelten `openclaw-mlx-tts`-Helper, wenn vorhanden, oder eine ausführbare Datei auf `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, um während der Entwicklung auf eine benutzerdefinierte Helper-Binärdatei zu verweisen.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird, wenn gesetzt, auf `0..4` validiert.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für latenzarmes AudioTrack-Streaming.

## Verwandte Themen

- [Voice Wake](/de/nodes/voicewake)
- [Audio- und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
