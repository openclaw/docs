---
read_when:
    - Audiotranskription oder Medienverarbeitung ändern
summary: Wie eingehende Audio-/Sprachnachrichten heruntergeladen, transkribiert und in Antworten eingefügt werden
title: Audio und Sprachnotizen
x-i18n:
    generated_at: "2026-05-03T06:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# Audio-/Sprachnotizen (2026-01-17)

## Was funktioniert

- **Medienverständnis (Audio)**: Wenn Audioverständnis aktiviert ist (oder automatisch erkannt wird), führt OpenClaw Folgendes aus:
  1. Es findet den ersten Audioanhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
  2. Es erzwingt `maxBytes`, bevor Daten an jeden Modelleintrag gesendet werden.
  3. Es führt den ersten geeigneten Modelleintrag der Reihe nach aus (Provider oder CLI).
  4. Wenn dies fehlschlägt oder übersprungen wird (Größe/Timeout), wird der nächste Eintrag versucht.
  5. Bei Erfolg ersetzt es `Body` durch einen `[Audio]`-Block und setzt `{{Transcript}}`.
- **Befehlsauswertung**: Wenn die Transkription erfolgreich ist, werden `CommandBody`/`RawBody` auf das Transkript gesetzt, sodass Slash-Befehle weiterhin funktionieren.
- **Ausführliche Protokollierung**: In `--verbose` protokollieren wir, wann die Transkription ausgeführt wird und wann sie den Body ersetzt.

## Automatische Erkennung (Standard)

Wenn Sie **keine Modelle konfigurieren** und `tools.media.audio.enabled` **nicht** auf `false` gesetzt ist,
erkennt OpenClaw automatisch in dieser Reihenfolge und stoppt bei der ersten funktionierenden Option:

1. **Aktives Antwortmodell**, wenn dessen Provider Audioverständnis unterstützt.
2. **Lokale CLIs** (falls installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit Encoder/Decoder/Joiner/Tokens)
   - `whisper-cli` (aus `whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
3. **Gemini-CLI** (`gemini`) mit `read_many_files`
4. **Provider-Authentifizierung**
   - Konfigurierte `models.providers.*`-Einträge, die Audio unterstützen, werden zuerst versucht
   - Gebündelte Fallback-Reihenfolge: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Um die automatische Erkennung zu deaktivieren, setzen Sie `tools.media.audio.enabled: false`.
Um sie anzupassen, setzen Sie `tools.media.audio.models`.
Hinweis: Die Binärerkennung erfolgt bestmöglich unter macOS/Linux/Windows; stellen Sie sicher, dass sich die CLI in `PATH` befindet (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit einem vollständigen Befehlspfad.

## Konfigurationsbeispiele

### Provider + CLI-Fallback (OpenAI + Whisper-CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Nur Provider mit Scope-Gating

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Nur Provider (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Nur Provider (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Nur Provider (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Transkript in den Chat spiegeln (Opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Hinweise und Grenzen

- Die Provider-Authentifizierung folgt der standardmäßigen Authentifizierungsreihenfolge für Modelle (Authentifizierungsprofile, Env-Vars, `models.providers.*.apiKey`).
- Groq-Einrichtungsdetails: [Groq](/de/providers/groq).
- Deepgram übernimmt `DEEPGRAM_API_KEY`, wenn `provider: "deepgram"` verwendet wird.
- Deepgram-Einrichtungsdetails: [Deepgram (Audiotranskription)](/de/providers/deepgram).
- Mistral-Einrichtungsdetails: [Mistral](/de/providers/mistral).
- SenseAudio übernimmt `SENSEAUDIO_API_KEY`, wenn `provider: "senseaudio"` verwendet wird.
- SenseAudio-Einrichtungsdetails: [SenseAudio](/de/providers/senseaudio).
- Audio-Provider können `baseUrl`, `headers` und `providerOptions` über `tools.media.audio` überschreiben.
- Die Standardgrößenbegrenzung beträgt 20 MB (`tools.media.audio.maxBytes`). Zu große Audiodateien werden für dieses Modell übersprungen und der nächste Eintrag wird versucht.
- Winzige/leere Audiodateien unter 1024 Byte werden vor der Provider-/CLI-Transkription übersprungen.
- Der Standardwert für `maxChars` bei Audio ist **nicht gesetzt** (vollständiges Transkript). Setzen Sie `tools.media.audio.maxChars` oder `maxChars` pro Eintrag, um die Ausgabe zu kürzen.
- Der automatische OpenAI-Standard ist `gpt-4o-mini-transcribe`; setzen Sie `model: "gpt-4o-transcribe"` für höhere Genauigkeit.
- Verwenden Sie `tools.media.audio.attachments`, um mehrere Sprachnotizen zu verarbeiten (`mode: "all"` + `maxAttachments`).
- Das Transkript steht Vorlagen als `{{Transcript}}` zur Verfügung.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert; aktivieren Sie es, um vor der Agent-Verarbeitung eine Transkriptbestätigung an den ursprünglichen Chat zurückzusenden.
- `tools.media.audio.echoFormat` passt den Echo-Text an (Platzhalter: `{transcript}`).
- CLI-stdout ist begrenzt (5 MB); halten Sie CLI-Ausgaben knapp.
- CLI-`args` sollte `{{MediaPath}}` für den lokalen Audiodateipfad verwenden. Führen Sie `openclaw doctor --fix` aus, um veraltete `{input}`-Platzhalter aus älteren `audio.transcription.command`-Konfigurationen zu migrieren.

### Unterstützung für Proxy-Umgebungen

Provider-basierte Audiotranskription berücksichtigt standardmäßige ausgehende Proxy-Env-Vars:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Wenn keine Proxy-Env-Vars gesetzt sind, wird direkter ausgehender Zugriff verwendet. Wenn die Proxy-Konfiguration fehlerhaft ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Erwähnungserkennung in Gruppen

Wenn `requireMention: true` für einen Gruppenchat gesetzt ist, transkribiert OpenClaw Audio jetzt **vor** der Prüfung auf Erwähnungen. Dadurch können Sprachnotizen auch dann verarbeitet werden, wenn sie Erwähnungen enthalten.

**Funktionsweise:**

1. Wenn eine Sprachnachricht keinen Text-Body hat und die Gruppe Erwähnungen erfordert, führt OpenClaw eine „Preflight“-Transkription aus.
2. Das Transkript wird auf Erwähnungsmuster geprüft (z. B. `@BotName`, Emoji-Trigger).
3. Wenn eine Erwähnung gefunden wird, durchläuft die Nachricht die vollständige Antwort-Pipeline.
4. Das Transkript wird für die Erwähnungserkennung verwendet, sodass Sprachnotizen das Erwähnungstor passieren können.

**Fallback-Verhalten:**

- Wenn die Transkription während des Preflight fehlschlägt (Timeout, API-Fehler usw.), wird die Nachricht anhand der reinen Texterwähnungserkennung verarbeitet.
- Dadurch wird sichergestellt, dass gemischte Nachrichten (Text + Audio) niemals fälschlicherweise verworfen werden.

**Opt-out pro Telegram-Gruppe/-Thema:**

- Setzen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, um Preflight-Transkript-Erwähnungsprüfungen für diese Gruppe zu überspringen.
- Setzen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, um pro Thema zu überschreiben (`true` zum Überspringen, `false` zum Erzwingen der Aktivierung).
- Der Standardwert ist `false` (Preflight aktiviert, wenn Bedingungen mit Erwähnungstor zutreffen).

**Beispiel:** Ein Benutzer sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnotiz mit dem Inhalt „Hey @Claude, wie ist das Wetter?“. Die Sprachnotiz wird transkribiert, die Erwähnung wird erkannt, und der Agent antwortet.

## Fallstricke

- Scope-Regeln verwenden „erster Treffer gewinnt“. `chatType` wird auf `direct`, `group` oder `room` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit 0 beendet wird und Klartext ausgibt; JSON muss über `jq -r .text` aufbereitet werden.
- Bei `parakeet-mlx`: Wenn Sie `--output-dir` übergeben, liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn `--output-format` `txt` ist (oder ausgelassen wird); Nicht-`txt`-Ausgabeformate fallen auf stdout-Auswertung zurück.
- Halten Sie Timeouts angemessen (`timeoutSeconds`, Standard 60 s), um die Antwortwarteschlange nicht zu blockieren.
- Die Preflight-Transkription verarbeitet nur den **ersten** Audioanhang für die Erwähnungserkennung. Zusätzliche Audiodateien werden während der Hauptphase des Medienverständnisses verarbeitet.

## Verwandte Themen

- [Medienverständnis](/de/nodes/media-understanding)
- [Sprechmodus](/de/nodes/talk)
- [Sprachaktivierung](/de/nodes/voicewake)
