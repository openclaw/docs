---
read_when:
    - Talk-Modus auf macOS/iOS/Android implementieren
    - Stimm-/TTS-/Unterbrechungsverhalten ändern
summary: 'Talk-Modus: kontinuierliche Sprachunterhaltungen mit konfigurierten TTS-Anbietern'
title: Talk-Modus
x-i18n:
    generated_at: "2026-04-25T13:50:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

Der Talk-Modus ist eine kontinuierliche Sprachunterhaltungsschleife:

1. Auf Sprache hören
2. Das Transkript an das Modell senden (Haupt-Session, `chat.send`)
3. Auf die Antwort warten
4. Sie über den konfigurierten Talk-Anbieter sprechen (`talk.speak`)

## Verhalten (macOS)

- **Immer aktives Overlay**, solange der Talk-Modus aktiviert ist.
- Phasenübergänge **Listening → Thinking → Speaking**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden **in WebChat geschrieben** (wie beim Tippen).
- **Unterbrechen bei Sprache** (standardmäßig aktiviert): Wenn der Benutzer zu sprechen beginnt, während der Assistent spricht, stoppen wir die Wiedergabe und vermerken den Zeitstempel der Unterbrechung für den nächsten Prompt.

## Sprachdirektiven in Antworten

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
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Standardeinstellungen:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: wenn nicht gesetzt, verwendet Talk vor dem Senden des Transkripts das plattformspezifische Standard-Pausenfenster (`700 ms` auf macOS und Android, `900 ms` auf iOS)
- `provider`: wählt den aktiven Talk-Anbieter aus. Verwenden Sie `elevenlabs`, `mlx` oder `system` für die lokalen Wiedergabepfade auf macOS.
- `providers.<provider>.voiceId`: greift für ElevenLabs auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Key verfügbar ist).
- `providers.elevenlabs.modelId`: standardmäßig `eleven_v3`, wenn nicht gesetzt.
- `providers.mlx.modelId`: standardmäßig `mlx-community/Soprano-80M-bf16`, wenn nicht gesetzt.
- `providers.elevenlabs.apiKey`: greift auf `ELEVENLABS_API_KEY` zurück (oder auf das Shell-Profil des Gateway, falls verfügbar).
- `outputFormat`: standardmäßig `pcm_44100` auf macOS/iOS und `pcm_24000` auf Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-UI

- Umschalter in der Menüleiste: **Talk**
- Konfigurations-Tab: Gruppe **Talk Mode** (voice id + Interrupt-Umschalter)
- Overlay:
  - **Listening**: Wolke pulsiert mit Mikrofonpegel
  - **Thinking**: sinkende Animation
  - **Speaking**: abstrahlende Ringe
  - Auf Wolke klicken: Sprechen stoppen
  - Auf X klicken: Talk-Modus beenden

## Hinweise

- Erfordert Berechtigungen für Speech + Mikrofon.
- Verwendet `chat.send` für den Session-Schlüssel `main`.
- Das Gateway löst die Talk-Wiedergabe über `talk.speak` mit dem aktiven Talk-Anbieter auf. Android greift nur dann auf lokales System-TTS zurück, wenn diese RPC nicht verfügbar ist.
- Die lokale MLX-Wiedergabe auf macOS verwendet den gebündelten Helfer `openclaw-mlx-tts`, wenn vorhanden, oder ein Executable auf `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, um während der Entwicklung auf eine benutzerdefinierte Helper-Binärdatei zu verweisen.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird, wenn gesetzt, auf `0..4` validiert.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für latenzarmes AudioTrack-Streaming.

## Verwandt

- [Voice wake](/de/nodes/voicewake)
- [Audio and voice notes](/de/nodes/audio)
- [Media understanding](/de/nodes/media-understanding)
