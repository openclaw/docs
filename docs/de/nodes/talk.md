---
read_when:
    - Implementierung des Talk-Modus auf macOS/iOS/Android
    - Sprach-/TTS-/Unterbrechungsverhalten ändern
summary: 'Sprechmodus: kontinuierliche Sprachunterhaltungen mit lokalem STT/TTS und Echtzeit-Sprachkommunikation'
title: Sprechmodus
x-i18n:
    generated_at: "2026-05-06T06:55:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Der Talk-Modus hat zwei Laufzeitformen:

- Nativer macOS-/iOS-/Android-Talk verwendet lokale Spracherkennung, Gateway-Chat und `talk.speak`-TTS. Nodes geben die `talk`-Fähigkeit bekannt und deklarieren die `talk.*`-Befehle, die sie unterstützen.
- Browser-Talk verwendet `talk.client.create` für client-eigene `webrtc`- und `provider-websocket`-Sitzungen oder `talk.session.create` für Gateway-eigene `gateway-relay`-Sitzungen. `managed-room` ist für Gateway-Übergabe und Walkie-Talkie-Räume reserviert.
- Nur-Transkriptions-Clients verwenden `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` und anschließend `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`, wenn sie Untertitel oder Diktat ohne Sprachantwort eines Assistenten benötigen.

Nativer Talk ist eine kontinuierliche Sprachkonversationsschleife:

1. Auf Sprache warten
2. Transkript über die aktive Sitzung an das Modell senden
3. Auf die Antwort warten
4. Über den konfigurierten Talk-Provider sprechen (`talk.speak`)

Browser-Echtzeit-Talk leitet Provider-Tool-Aufrufe über `talk.client.toolCall` weiter; Browser-Clients rufen `chat.send` für Echtzeit-Konsultationen nicht direkt auf.

Nur-Transkriptions-Talk gibt dieselbe gemeinsame Talk-Ereignishülle wie Echtzeit- und STT-/TTS-Sitzungen aus, verwendet aber `mode: "transcription"` und `brain: "none"`. Er ist für Untertitel, Diktat und beobachtende Sprachaufnahme gedacht; einmalig hochgeladene Sprachnotizen verwenden weiterhin den Medien-/Audio-Pfad.

## Verhalten (macOS)

- **Immer eingeblendetes Overlay**, solange der Talk-Modus aktiviert ist.
- Phasenübergänge **Zuhören → Nachdenken → Sprechen**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden **in WebChat geschrieben** (wie beim Tippen).
- **Unterbrechen bei Sprache** (standardmäßig aktiviert): Wenn der Benutzer zu sprechen beginnt, während der Assistent spricht, stoppen wir die Wiedergabe und vermerken den Unterbrechungszeitstempel für den nächsten Prompt.

## Sprachdirektiven in Antworten

Der Assistent kann seiner Antwort eine **einzelne JSON-Zeile** voranstellen, um die Stimme zu steuern:

```json
{ "voice": "<voice-id>", "once": true }
```

Regeln:

- Nur die erste nicht leere Zeile.
- Unbekannte Schlüssel werden ignoriert.
- `once: true` gilt nur für die aktuelle Antwort.
- Ohne `once` wird die Stimme zur neuen Standardeinstellung für den Talk-Modus.
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
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
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
- `provider`: wählt den aktiven Talk-Provider aus. Verwenden Sie `elevenlabs`, `mlx` oder `system` für die macOS-lokalen Wiedergabepfade.
- `providers.<provider>.voiceId`: fällt für ElevenLabs auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Schlüssel verfügbar ist).
- `providers.elevenlabs.modelId`: ist standardmäßig `eleven_v3`, wenn nicht gesetzt.
- `providers.mlx.modelId`: ist standardmäßig `mlx-community/Soprano-80M-bf16`, wenn nicht gesetzt.
- `providers.elevenlabs.apiKey`: fällt auf `ELEVENLABS_API_KEY` zurück (oder auf das Gateway-Shell-Profil, falls verfügbar).
- `realtime.provider`: wählt den aktiven Browser-/Server-Echtzeit-Sprach-Provider aus. Verwenden Sie `openai` für WebRTC, `google` für Provider-WebSocket oder einen reinen Bridge-Provider über Gateway-Relay.
- `realtime.providers.<provider>` speichert die echtzeitbezogene, Provider-eigene Konfiguration. Der Browser erhält nur kurzlebige oder eingeschränkte Sitzungsanmeldeinformationen, niemals einen Standard-API-Schlüssel.
- `realtime.brain`: `agent-consult` leitet Echtzeit-Tool-Aufrufe durch die Gateway-Richtlinie; `direct-tools` ist ein nur dem Eigentümer vorbehaltenes Kompatibilitätsverhalten; `none` ist für Transkription oder externe Orchestrierung.
- `talk.catalog` stellt die gültigen Modi, Transporte, Brain-Strategien, Echtzeit-Audioformate und Fähigkeits-Flags jedes Providers bereit, damit First-Party-Talk-Clients nicht unterstützte Kombinationen vermeiden können.
- Streaming-Transkriptions-Provider werden über `talk.catalog.transcription` ermittelt. Das aktuelle Gateway-Relay verwendet die Streaming-Provider-Konfiguration für Sprachanrufe, bis die dedizierte Talk-Transkriptions-Konfigurationsoberfläche hinzugefügt wird.
- `speechLocale`: optionale BCP-47-Locale-ID für die geräteinterne Talk-Spracherkennung unter iOS/macOS. Lassen Sie den Wert nicht gesetzt, um die Gerätestandardeinstellung zu verwenden.
- `outputFormat`: ist standardmäßig `pcm_44100` unter macOS/iOS und `pcm_24000` unter Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-Benutzeroberfläche

- Menüleisten-Umschalter: **Talk**
- Konfigurations-Tab: Gruppe **Talk-Modus** (Stimmen-ID + Unterbrechungs-Umschalter)
- Overlay:
  - **Zuhören**: Wolke pulsiert mit Mikrofonpegel
  - **Nachdenken**: sinkende Animation
  - **Sprechen**: abstrahlende Ringe
  - Wolke anklicken: Sprechen stoppen
  - X anklicken: Talk-Modus beenden

## Android-Benutzeroberfläche

- Voice-Tab-Umschalter: **Talk**
- Manuelle Modi **Mic** und **Talk** schließen sich als Laufzeit-Aufnahmemodi gegenseitig aus.
- Manueller Mic stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Voice-Tab verlässt.
- Der Talk-Modus läuft weiter, bis er deaktiviert wird oder der Android-Node die Verbindung trennt, und verwendet während der Aktivität den Android-Mikrofon-Foreground-Service-Typ.

## Hinweise

- Erfordert Berechtigungen für Sprache und Mikrofon.
- Nativer Talk verwendet die aktive Gateway-Sitzung und fällt nur auf Verlaufsabfragen zurück, wenn Antwortereignisse nicht verfügbar sind.
- Browser-Echtzeit-Talk verwendet `talk.client.toolCall` für `openclaw_agent_consult`, statt `chat.send` für Provider-eigene Browser-Sitzungen offenzulegen.
- Nur-Transkriptions-Talk verwendet `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close`; Clients abonnieren `talk.event` für teilweise/endgültige Transkriptaktualisierungen.
- Das Gateway löst die Talk-Wiedergabe über `talk.speak` mit dem aktiven Talk-Provider auf. Android fällt nur dann auf lokales System-TTS zurück, wenn dieser RPC nicht verfügbar ist.
- Die lokale MLX-Wiedergabe unter macOS verwendet den gebündelten `openclaw-mlx-tts`-Helper, wenn vorhanden, oder eine ausführbare Datei in `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, um während der Entwicklung auf ein benutzerdefiniertes Helper-Binärprogramm zu verweisen.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird auf `0..4` validiert, wenn gesetzt.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für latenzarmes AudioTrack-Streaming.

## Verwandt

- [Sprachaktivierung](/de/nodes/voicewake)
- [Audio und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
