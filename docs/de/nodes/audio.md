---
read_when:
    - Audiotranskription oder Medienverarbeitung ändern
summary: Wie eingehende Audio-/Sprachnotizen heruntergeladen, transkribiert und in Antworten eingefügt werden
title: Audio- und Sprachnotizen
x-i18n:
    generated_at: "2026-05-02T23:39:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91cd6951f80c6137061a7d4e82415b0872bc92c6d6ad136273a2e9ad7ec00ac1
    source_path: nodes/audio.md
    workflow: 16
---

# Audio-/Sprachnotizen (2026-01-17)

## Was funktioniert

- **Medienverständnis (Audio)**: Wenn Audioverständnis aktiviert ist (oder automatisch erkannt wird), führt OpenClaw Folgendes aus:
  1. Es findet den ersten Audioanhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
  2. Es erzwingt `maxBytes`, bevor an jeden Modelleintrag gesendet wird.
  3. Es führt den ersten geeigneten Modelleintrag in der Reihenfolge aus (Provider oder CLI).
  4. Wenn dies fehlschlägt oder übersprungen wird (Größe/Timeout), wird der nächste Eintrag versucht.
  5. Bei Erfolg ersetzt es `Body` durch einen `[Audio]`-Block und setzt `{{Transcript}}`.
- **Befehlsparsing**: Wenn die Transkription erfolgreich ist, werden `CommandBody`/`RawBody` auf das Transkript gesetzt, sodass Slash-Befehle weiterhin funktionieren.
- **Ausführliche Protokollierung**: In `--verbose` protokollieren wir, wann die Transkription ausgeführt wird und wann sie den Body ersetzt.
- **Diktat in der Steuerungs-UI**: Der Chat-Composer kann einen im Browser aufgenommenen Mikrofonclip an `chat.transcribeAudio` senden. Dieser Gateway-RPC schreibt den Clip in eine temporäre lokale Datei, führt dieselbe Audio-Transkriptionspipeline aus, gibt Entwurfstext an den Browser zurück und löscht die temporäre Datei. Er erstellt nicht selbst einen Agentenlauf.

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
Zum Anpassen setzen Sie `tools.media.audio.models`.
Hinweis: Die Binärerkennung erfolgt nach bestem Bemühen unter macOS/Linux/Windows; stellen Sie sicher, dass die CLI auf `PATH` liegt (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

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

### Nur Provider mit Bereichssteuerung

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

### Transkript in den Chat zurückgeben (Opt-in)

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

- Die Provider-Authentifizierung folgt der Standardreihenfolge für die Modellauthentifizierung (Authentifizierungsprofile, Umgebungsvariablen, `models.providers.*.apiKey`).
- Details zur Groq-Einrichtung: [Groq](/de/providers/groq).
- Deepgram greift `DEEPGRAM_API_KEY` auf, wenn `provider: "deepgram"` verwendet wird.
- Details zur Deepgram-Einrichtung: [Deepgram (Audio-Transkription)](/de/providers/deepgram).
- Details zur Mistral-Einrichtung: [Mistral](/de/providers/mistral).
- SenseAudio greift `SENSEAUDIO_API_KEY` auf, wenn `provider: "senseaudio"` verwendet wird.
- Details zur SenseAudio-Einrichtung: [SenseAudio](/de/providers/senseaudio).
- Audio-Provider können `baseUrl`, `headers` und `providerOptions` über `tools.media.audio` überschreiben.
- Die standardmäßige Größenbegrenzung beträgt 20 MB (`tools.media.audio.maxBytes`). Zu große Audiodateien werden für dieses Modell übersprungen, und der nächste Eintrag wird versucht.
- Sehr kleine/leere Audiodateien unter 1024 Byte werden vor der Provider-/CLI-Transkription übersprungen.
- Der Standardwert für `maxChars` bei Audio ist **nicht gesetzt** (vollständiges Transkript). Setzen Sie `tools.media.audio.maxChars` oder `maxChars` pro Eintrag, um die Ausgabe zu kürzen.
- Der automatische OpenAI-Standard ist `gpt-4o-mini-transcribe`; setzen Sie `model: "gpt-4o-transcribe"` für höhere Genauigkeit.
- Verwenden Sie `tools.media.audio.attachments`, um mehrere Sprachnotizen zu verarbeiten (`mode: "all"` + `maxAttachments`).
- Das Transkript ist in Vorlagen als `{{Transcript}}` verfügbar.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert; aktivieren Sie es, um vor der Agentenverarbeitung eine Transkriptbestätigung an den ursprünglichen Chat zurückzusenden.
- `tools.media.audio.echoFormat` passt den Echo-Text an (Platzhalter: `{transcript}`).
- Die CLI-Standardausgabe ist begrenzt (5 MB); halten Sie die CLI-Ausgabe knapp.
- CLI-`args` sollten `{{MediaPath}}` für den lokalen Audiodateipfad verwenden. Führen Sie `openclaw doctor --fix` aus, um veraltete `{input}`-Platzhalter aus älteren `audio.transcription.command`-Konfigurationen zu migrieren.

### Unterstützung für Proxy-Umgebungen

Provider-basierte Audio-Transkription berücksichtigt standardmäßige ausgehende Proxy-Umgebungsvariablen:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, wird direkter ausgehender Zugriff verwendet. Wenn die Proxy-Konfiguration fehlerhaft ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Erwähnungserkennung in Gruppen

Wenn `requireMention: true` für einen Gruppenchat gesetzt ist, transkribiert OpenClaw Audio jetzt **vor** der Prüfung auf Erwähnungen. Dadurch können Sprachnotizen auch dann verarbeitet werden, wenn sie Erwähnungen enthalten.

**So funktioniert es:**

1. Wenn eine Sprachnachricht keinen Text-Body hat und die Gruppe Erwähnungen erfordert, führt OpenClaw eine „Preflight“-Transkription aus.
2. Das Transkript wird auf Erwähnungsmuster geprüft (z. B. `@BotName`, Emoji-Auslöser).
3. Wenn eine Erwähnung gefunden wird, durchläuft die Nachricht die vollständige Antwortpipeline.
4. Das Transkript wird für die Erwähnungserkennung verwendet, sodass Sprachnotizen das Erwähnungs-Gate passieren können.

**Fallback-Verhalten:**

- Wenn die Transkription während des Preflight fehlschlägt (Timeout, API-Fehler usw.), wird die Nachricht anhand der reinen Text-Erwähnungserkennung verarbeitet.
- Dadurch wird sichergestellt, dass gemischte Nachrichten (Text + Audio) nie fälschlicherweise verworfen werden.

**Opt-out pro Telegram-Gruppe/Thema:**

- Setzen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, um Preflight-Transkriptprüfungen auf Erwähnungen für diese Gruppe zu überspringen.
- Setzen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, um pro Thema zu überschreiben (`true` zum Überspringen, `false` zum Erzwingen der Aktivierung).
- Standard ist `false` (Preflight aktiviert, wenn die durch Erwähnungen gesteuerten Bedingungen zutreffen).

**Beispiel:** Ein Benutzer sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnotiz mit dem Inhalt „Hey @Claude, wie ist das Wetter?“. Die Sprachnotiz wird transkribiert, die Erwähnung wird erkannt, und der Agent antwortet.

## Fallstricke

- Bereichsregeln verwenden „erste Übereinstimmung gewinnt“. `chatType` wird zu `direct`, `group` oder `room` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit 0 beendet wird und Klartext ausgibt; JSON muss über `jq -r .text` aufbereitet werden.
- Bei `parakeet-mlx` liest OpenClaw, wenn Sie `--output-dir` übergeben, `<output-dir>/<media-basename>.txt`, wenn `--output-format` `txt` ist (oder ausgelassen wird); Nicht-`txt`-Ausgabeformate fallen auf das Parsen von stdout zurück.
- Halten Sie Timeouts angemessen (`timeoutSeconds`, Standard 60 s), um ein Blockieren der Antwortwarteschlange zu vermeiden.
- Die Preflight-Transkription verarbeitet zur Erwähnungserkennung nur den **ersten** Audioanhang. Zusätzliches Audio wird während der Hauptphase des Medienverständnisses verarbeitet.

## Verwandt

- [Medienverständnis](/de/nodes/media-understanding)
- [Sprechmodus](/de/nodes/talk)
- [Sprachaktivierung](/de/nodes/voicewake)
