---
read_when:
    - Audio-Transkription oder Medienverarbeitung ändern
summary: Wie eingehende Audio-/Sprachnachrichten heruntergeladen, transkribiert und in Antworten eingefügt werden
title: Audio- und Sprachnotizen
x-i18n:
    generated_at: "2026-06-27T17:39:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
    source_path: nodes/audio.md
    workflow: 16
---

## Was funktioniert

- **Medienverständnis (Audio)**: Wenn Audioverständnis aktiviert ist (oder automatisch erkannt wird), führt OpenClaw Folgendes aus:
  1. Es findet den ersten Audioanhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
  2. Es erzwingt `maxBytes`, bevor an jeden Modelleintrag gesendet wird.
  3. Es führt den ersten geeigneten Modelleintrag der Reihe nach aus (Provider oder CLI).
  4. Wenn dies fehlschlägt oder übersprungen wird (Größe/Timeout), versucht es den nächsten Eintrag.
  5. Bei Erfolg ersetzt es `Body` durch einen `[Audio]`-Block und setzt `{{Transcript}}`.
- **Befehlsparsing**: Wenn die Transkription erfolgreich ist, werden `CommandBody`/`RawBody` auf das Transkript gesetzt, sodass Slash-Befehle weiterhin funktionieren.
- **Ausführliches Logging**: Mit `--verbose` protokollieren wir, wann die Transkription ausgeführt wird und wann sie den Body ersetzt.

## Automatische Erkennung (Standard)

Wenn Sie **keine Modelle konfigurieren** und `tools.media.audio.enabled` **nicht** auf `false` gesetzt ist,
erkennt OpenClaw Optionen automatisch in dieser Reihenfolge und stoppt bei der ersten funktionierenden Option:

1. **Aktives Antwortmodell**, wenn dessen Provider Audioverständnis unterstützt.
2. **Lokale CLIs** (falls installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit Encoder/Decoder/Joiner/Tokens)
   - `whisper-cli` (aus `whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
3. **Provider-Authentifizierung**
   - Konfigurierte `models.providers.*`-Einträge, die Audio unterstützen, werden zuerst versucht
   - Provider-Fallback-Reihenfolge: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Seit dem 22.05.2026 wird die automatische Erkennung der Gemini CLI für Medienverständnis nicht mehr unterstützt. Google stellt Gemini-CLI-Nutzer auf Antigravity CLI um; Audio sollte lokale oder Provider-Transkription verwenden, während der CLI-Fallback für Bilder/Videos auf Antigravity CLI (`agy`) umgestellt werden sollte.

Um die automatische Erkennung zu deaktivieren, setzen Sie `tools.media.audio.enabled: false`.
Um sie anzupassen, setzen Sie `tools.media.audio.models`.
Hinweis: Die Binärerkennung erfolgt bestmöglich über macOS/Linux/Windows hinweg; stellen Sie sicher, dass die CLI in `PATH` liegt (wir expandieren `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

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

### Transkript an den Chat zurückgeben (Opt-in)

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

## Hinweise und Einschränkungen

- Die Provider-Authentifizierung folgt der standardmäßigen Authentifizierungsreihenfolge für Modelle (Authentifizierungsprofile, Umgebungsvariablen, `models.providers.*.apiKey`).
- Groq-Einrichtungsdetails: [Groq](/de/providers/groq).
- Deepgram übernimmt `DEEPGRAM_API_KEY`, wenn `provider: "deepgram"` verwendet wird.
- Deepgram-Einrichtungsdetails: [Deepgram (Audiotranskription)](/de/providers/deepgram).
- Mistral-Einrichtungsdetails: [Mistral](/de/providers/mistral).
- SenseAudio übernimmt `SENSEAUDIO_API_KEY`, wenn `provider: "senseaudio"` verwendet wird.
- SenseAudio-Einrichtungsdetails: [SenseAudio](/de/providers/senseaudio).
- Audio-Provider können `baseUrl`, `headers` und `providerOptions` über `tools.media.audio` überschreiben.
- Die standardmäßige Größenobergrenze beträgt 20 MB (`tools.media.audio.maxBytes`). Zu große Audiodateien werden für dieses Modell übersprungen und der nächste Eintrag wird versucht.
- Sehr kleine/leere Audiodateien unter 1024 Byte werden vor der Provider-/CLI-Transkription übersprungen.
- Der Standardwert für `maxChars` für Audio ist **nicht gesetzt** (vollständiges Transkript). Setzen Sie `tools.media.audio.maxChars` oder `maxChars` pro Eintrag, um die Ausgabe zu kürzen.
- Der automatische OpenAI-Standard ist `gpt-4o-mini-transcribe`; setzen Sie `model: "gpt-4o-transcribe"` für höhere Genauigkeit.
- Verwenden Sie `tools.media.audio.attachments`, um mehrere Sprachnachrichten zu verarbeiten (`mode: "all"` + `maxAttachments`).
- Das Transkript ist für Templates als `{{Transcript}}` verfügbar.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert; aktivieren Sie es, um vor der Agent-Verarbeitung eine Transkriptbestätigung an den ursprünglichen Chat zurückzusenden.
- `tools.media.audio.echoFormat` passt den Echo-Text an (Platzhalter: `{transcript}`).
- CLI-stdout ist begrenzt (5 MB); halten Sie die CLI-Ausgabe knapp.
- CLI-`args` sollten `{{MediaPath}}` für den lokalen Audiodateipfad verwenden. Führen Sie `openclaw doctor --fix` aus, um veraltete `{input}`-Platzhalter aus älteren `audio.transcription.command`-Konfigurationen zu migrieren.

### Proxy-Umgebungsunterstützung

Provider-basierte Audiotranskription berücksichtigt standardmäßige Umgebungsvariablen für ausgehende Proxys:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, wird direkter Egress verwendet. Wenn die Proxy-Konfiguration fehlerhaft ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Erwähnungserkennung in Gruppen

Wenn `requireMention: true` für einen Gruppenchat gesetzt ist, transkribiert OpenClaw Audio jetzt **vor** der Prüfung auf Erwähnungen. Dadurch können Sprachnachrichten verarbeitet werden, auch wenn sie Erwähnungen enthalten.

**Funktionsweise:**

1. Wenn eine Sprachnachricht keinen Text-Body hat und die Gruppe Erwähnungen erfordert, führt OpenClaw eine „Preflight“-Transkription aus.
2. Das Transkript wird auf Erwähnungsmuster geprüft (z. B. `@BotName`, Emoji-Auslöser).
3. Wenn eine Erwähnung gefunden wird, durchläuft die Nachricht die vollständige Antwort-Pipeline.
4. Das Transkript wird für die Erwähnungserkennung verwendet, damit Sprachnachrichten das Erwähnungsgate passieren können.

**Fallback-Verhalten:**

- Wenn die Transkription während des Preflight fehlschlägt (Timeout, API-Fehler usw.), wird die Nachricht basierend auf reiner Text-Erwähnungserkennung verarbeitet.
- Dadurch wird sichergestellt, dass gemischte Nachrichten (Text + Audio) niemals fälschlicherweise verworfen werden.

**Opt-out pro Telegram-Gruppe/Thema:**

- Setzen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, um Preflight-Transkript-Erwähnungsprüfungen für diese Gruppe zu überspringen.
- Setzen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, um dies pro Thema zu überschreiben (`true` zum Überspringen, `false` zum Erzwingen der Aktivierung).
- Standard ist `false` (Preflight aktiviert, wenn erwähnungsgesteuerte Bedingungen zutreffen).

**Beispiel:** Ein Nutzer sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnachricht mit dem Inhalt „Hey @Claude, what's the weather?“. Die Sprachnachricht wird transkribiert, die Erwähnung wird erkannt und der Agent antwortet.

## Fallstricke

- Scope-Regeln verwenden „erste Übereinstimmung gewinnt“. `chatType` wird zu `direct`, `group` oder `room` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit 0 beendet wird und Klartext ausgibt; JSON muss über `jq -r .text` angepasst werden.
- Für `parakeet-mlx`: Wenn Sie `--output-dir` übergeben, liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn `--output-format` `txt` ist (oder ausgelassen wurde); Nicht-`txt`-Ausgabeformate fallen auf stdout-Parsing zurück.
- Halten Sie Timeouts angemessen (`timeoutSeconds`, Standard 60 s), um ein Blockieren der Antwortwarteschlange zu vermeiden.
- Die Preflight-Transkription verarbeitet nur den **ersten** Audioanhang für die Erwähnungserkennung. Zusätzliches Audio wird während der Hauptphase des Medienverständnisses verarbeitet.

## Verwandt

- [Medienverständnis](/de/nodes/media-understanding)
- [Sprechmodus](/de/nodes/talk)
- [Voice Wake](/de/nodes/voicewake)
