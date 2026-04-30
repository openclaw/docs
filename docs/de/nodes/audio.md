---
read_when:
    - Audio-Transkription oder Medienverarbeitung ändern
summary: Wie eingehende Audio-/Sprachnachrichten heruntergeladen, transkribiert und in Antworten eingefügt werden
title: Audio und Sprachnotizen
x-i18n:
    generated_at: "2026-04-30T07:01:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / Sprachnotizen (2026-01-17)

## Was funktioniert

- **Medienverständnis (Audio)**: Wenn Audioverständnis aktiviert ist (oder automatisch erkannt wird), führt OpenClaw Folgendes aus:
  1. Sucht den ersten Audioanhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
  2. Erzwingt `maxBytes`, bevor der Anhang an jeden Modelleintrag gesendet wird.
  3. Führt den ersten geeigneten Modelleintrag der Reihe nach aus (Provider oder CLI).
  4. Wenn dies fehlschlägt oder übersprungen wird (Größe/Timeout), wird der nächste Eintrag versucht.
  5. Bei Erfolg wird `Body` durch einen `[Audio]`-Block ersetzt und `{{Transcript}}` gesetzt.
- **Befehlsparsing**: Wenn die Transkription erfolgreich ist, werden `CommandBody`/`RawBody` auf das Transkript gesetzt, sodass Slash-Befehle weiterhin funktionieren.
- **Ausführliche Protokollierung**: Mit `--verbose` protokollieren wir, wann die Transkription ausgeführt wird und wann sie den Body ersetzt.

## Automatische Erkennung (Standard)

Wenn Sie **keine Modelle konfigurieren** und `tools.media.audio.enabled` **nicht** auf `false` gesetzt ist,
erkennt OpenClaw automatisch in dieser Reihenfolge und stoppt bei der ersten funktionierenden Option:

1. **Aktives Antwortmodell**, wenn dessen Provider Audioverständnis unterstützt.
2. **Lokale CLIs** (falls installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit Encoder/Decoder/Joiner/Tokens)
   - `whisper-cli` (aus `whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
3. **Gemini CLI** (`gemini`) mit `read_many_files`
4. **Provider-Authentifizierung**
   - Konfigurierte `models.providers.*`-Einträge, die Audio unterstützen, werden zuerst versucht
   - Gebündelte Fallback-Reihenfolge: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Um die automatische Erkennung zu deaktivieren, setzen Sie `tools.media.audio.enabled: false`.
Um sie anzupassen, setzen Sie `tools.media.audio.models`.
Hinweis: Die Erkennung von Binärdateien ist unter macOS/Linux/Windows nach bestem Bemühen; stellen Sie sicher, dass die CLI in `PATH` liegt (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

## Konfigurationsbeispiele

### Provider + CLI-Fallback (OpenAI + Whisper CLI)

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

### Transkript in den Chat zurücksenden (Opt-in)

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

- Die Provider-Authentifizierung folgt der standardmäßigen Authentifizierungsreihenfolge für Modelle (Auth-Profile, Umgebungsvariablen, `models.providers.*.apiKey`).
- Details zur Groq-Einrichtung: [Groq](/de/providers/groq).
- Deepgram übernimmt `DEEPGRAM_API_KEY`, wenn `provider: "deepgram"` verwendet wird.
- Details zur Deepgram-Einrichtung: [Deepgram (Audiotranskription)](/de/providers/deepgram).
- Details zur Mistral-Einrichtung: [Mistral](/de/providers/mistral).
- SenseAudio übernimmt `SENSEAUDIO_API_KEY`, wenn `provider: "senseaudio"` verwendet wird.
- Details zur SenseAudio-Einrichtung: [SenseAudio](/de/providers/senseaudio).
- Audio-Provider können `baseUrl`, `headers` und `providerOptions` über `tools.media.audio` überschreiben.
- Die standardmäßige Größenbegrenzung beträgt 20 MB (`tools.media.audio.maxBytes`). Zu große Audiodateien werden für dieses Modell übersprungen und der nächste Eintrag wird versucht.
- Winzige/leere Audiodateien unter 1024 Bytes werden vor der Provider-/CLI-Transkription übersprungen.
- Der Standardwert für `maxChars` bei Audio ist **nicht gesetzt** (vollständiges Transkript). Setzen Sie `tools.media.audio.maxChars` oder `maxChars` pro Eintrag, um die Ausgabe zu kürzen.
- Der automatische OpenAI-Standard ist `gpt-4o-mini-transcribe`; setzen Sie `model: "gpt-4o-transcribe"` für höhere Genauigkeit.
- Verwenden Sie `tools.media.audio.attachments`, um mehrere Sprachnotizen zu verarbeiten (`mode: "all"` + `maxAttachments`).
- Das Transkript ist für Vorlagen als `{{Transcript}}` verfügbar.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert; aktivieren Sie es, um vor der Agent-Verarbeitung eine Transkriptbestätigung an den ursprünglichen Chat zurückzusenden.
- `tools.media.audio.echoFormat` passt den Echo-Text an (Platzhalter: `{transcript}`).
- CLI-stdout ist begrenzt (5 MB); halten Sie die CLI-Ausgabe knapp.
- CLI-`args` sollte `{{MediaPath}}` für den lokalen Audiodateipfad verwenden. Führen Sie `openclaw doctor --fix` aus, um veraltete `{input}`-Platzhalter aus älteren `audio.transcription.command`-Konfigurationen zu migrieren.

### Unterstützung für Proxy-Umgebungen

Provider-basierte Audiotranskription berücksichtigt standardmäßige ausgehende Proxy-Umgebungsvariablen:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, wird direkter ausgehender Zugriff verwendet. Wenn die Proxy-Konfiguration fehlerhaft ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Mention-Erkennung in Gruppen

Wenn `requireMention: true` für einen Gruppenchat gesetzt ist, transkribiert OpenClaw Audio jetzt **vor** der Prüfung auf Mentions. Dadurch können Sprachnotizen auch dann verarbeitet werden, wenn sie Mentions enthalten.

**So funktioniert es:**

1. Wenn eine Sprachnachricht keinen Text-Body hat und die Gruppe Mentions erfordert, führt OpenClaw eine „Preflight“-Transkription aus.
2. Das Transkript wird auf Mention-Muster geprüft (z. B. `@BotName`, Emoji-Auslöser).
3. Wenn eine Mention gefunden wird, durchläuft die Nachricht die vollständige Antwort-Pipeline.
4. Das Transkript wird für die Mention-Erkennung verwendet, damit Sprachnotizen das Mention-Gate passieren können.

**Fallback-Verhalten:**

- Wenn die Transkription während des Preflight fehlschlägt (Timeout, API-Fehler usw.), wird die Nachricht basierend auf reiner Text-Mention-Erkennung verarbeitet.
- Dadurch wird sichergestellt, dass gemischte Nachrichten (Text + Audio) nie fälschlicherweise verworfen werden.

**Opt-out pro Telegram-Gruppe/-Thema:**

- Setzen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, um Preflight-Transkript-Mention-Prüfungen für diese Gruppe zu überspringen.
- Setzen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, um dies pro Thema zu überschreiben (`true` zum Überspringen, `false` zum erzwungenen Aktivieren).
- Standard ist `false` (Preflight aktiviert, wenn Mention-Gating-Bedingungen zutreffen).

**Beispiel:** Ein Benutzer sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnotiz mit dem Inhalt „Hey @Claude, what's the weather?“. Die Sprachnotiz wird transkribiert, die Mention wird erkannt und der Agent antwortet.

## Stolperfallen

- Scope-Regeln verwenden First-match-wins. `chatType` wird auf `direct`, `group` oder `room` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit 0 beendet wird und Klartext ausgibt; JSON muss über `jq -r .text` angepasst werden.
- Wenn Sie bei `parakeet-mlx` `--output-dir` übergeben, liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn `--output-format` `txt` ist (oder weggelassen wurde); Ausgabeformate ungleich `txt` fallen auf stdout-Parsing zurück.
- Halten Sie Timeouts angemessen (`timeoutSeconds`, Standard 60 s), um die Antwortwarteschlange nicht zu blockieren.
- Die Preflight-Transkription verarbeitet für die Mention-Erkennung nur den **ersten** Audioanhang. Zusätzliches Audio wird während der Hauptphase des Medienverständnisses verarbeitet.

## Verwandt

- [Medienverständnis](/de/nodes/media-understanding)
- [Sprechmodus](/de/nodes/talk)
- [Voice Wake](/de/nodes/voicewake)
