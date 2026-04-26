---
read_when:
    - Talk-Modus auf macOS/iOS/Android implementieren
    - Verhalten von Stimme/TTS/Unterbrechungen ändern
summary: 'Talk-Modus: fortlaufende Sprachgespräche mit konfigurierten TTS-Anbietern'
title: Talk-Modus
x-i18n:
    generated_at: "2026-04-26T11:34:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

Der Talk-Modus ist eine fortlaufende Sprachgesprächsschleife:

1. Auf Sprache hören
2. Transkript an das Modell senden (Hauptsitzung, `chat.send`)
3. Auf die Antwort warten
4. Sie über den konfigurierten Talk-Anbieter sprechen (`talk.speak`)

## Verhalten (macOS)

- **Always-on-Overlay**, solange der Talk-Modus aktiviert ist.
- Phasenübergänge **Listening → Thinking → Speaking**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden in **WebChat** geschrieben (wie beim Tippen).
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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Standardwerte:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: wenn nicht gesetzt, verwendet Talk das plattformspezifische Standard-Pausenfenster vor dem Senden des Transkripts (`700 ms unter macOS und Android, 900 ms unter iOS`)
- `provider`: wählt den aktiven Talk-Anbieter aus. Verwenden Sie `elevenlabs`, `mlx` oder `system` für die lokal auf macOS ausgeführten Wiedergabepfade.
- `providers.<provider>.voiceId`: fällt bei ElevenLabs auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Schlüssel verfügbar ist).
- `providers.elevenlabs.modelId`: Standard ist `eleven_v3`, wenn nicht gesetzt.
- `providers.mlx.modelId`: Standard ist `mlx-community/Soprano-80M-bf16`, wenn nicht gesetzt.
- `providers.elevenlabs.apiKey`: fällt auf `ELEVENLABS_API_KEY` zurück (oder auf das Shell-Profil des Gateways, falls verfügbar).
- `speechLocale`: optionale BCP-47-Locale-ID für geräteinterne Talk-Spracherkennung unter iOS/macOS. Lassen Sie sie leer, um den Gerätestandard zu verwenden.
- `outputFormat`: Standard ist `pcm_44100` unter macOS/iOS und `pcm_24000` unter Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-UI

- Umschalter in der Menüleiste: **Talk**
- Tab „Config“: Gruppe **Talk Mode** (Stimmen-ID + Umschalter für Unterbrechung)
- Overlay:
  - **Listening**: Wolke pulsiert mit Mikrofonpegel
  - **Thinking**: sinkende Animation
  - **Speaking**: abstrahlende Ringe
  - Auf die Wolke klicken: Sprechen stoppen
  - Auf X klicken: Talk-Modus verlassen

## Android-UI

- Umschalter im Tab „Voice“: **Talk**
- Manuelles **Mic** und **Talk** sind sich gegenseitig ausschließende Laufzeitmodi für die Aufnahme.
- Das manuelle Mikrofon stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Tab „Voice“ verlässt.
- Der Talk-Modus läuft weiter, bis er deaktiviert wird oder die Android-Node die Verbindung trennt, und verwendet während der Aktivität den Vordergrunddiensttyp Mikrofon von Android.

## Hinweise

- Erfordert Berechtigungen für Sprache + Mikrofon.
- Verwendet `chat.send` für den Sitzungsschlüssel `main`.
- Das Gateway löst die Wiedergabe im Talk-Modus über `talk.speak` unter Verwendung des aktiven Talk-Anbieters auf. Android fällt nur dann auf lokales System-TTS zurück, wenn dieses RPC nicht verfügbar ist.
- Die lokale MLX-Wiedergabe unter macOS verwendet den gebündelten Helper `openclaw-mlx-tts`, wenn vorhanden, oder eine Executable auf `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, um während der Entwicklung auf eine benutzerdefinierte Helper-Binärdatei zu verweisen.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird, wenn gesetzt, auf `0..4` validiert.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für AudioTrack-Streaming mit geringer Latenz.

## Verwandt

- [Sprachaktivierung](/de/nodes/voicewake)
- [Audio und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
