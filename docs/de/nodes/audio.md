---
read_when:
    - Ändern der Audiotranskription oder Medienverarbeitung
summary: Wie eingehende Audio-/Sprachnotizen heruntergeladen, transkribiert und in Antworten eingefügt werden
title: Audio und Sprachnotizen
x-i18n:
    generated_at: "2026-04-25T13:49:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Sprachnotizen (2026-01-17)

## Was funktioniert

- **Medienverständnis (Audio)**: Wenn Audioverständnis aktiviert ist (oder automatisch erkannt wird), macht OpenClaw Folgendes:
  1. Findet den ersten Audio-Anhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
  2. Erzwingt `maxBytes`, bevor an jeden Modelleintrag gesendet wird.
  3. Führt den ersten geeigneten Modelleintrag der Reihe nach aus (Provider oder CLI).
  4. Wenn dies fehlschlägt oder übersprungen wird (Größe/Timeout), wird der nächste Eintrag versucht.
  5. Bei Erfolg ersetzt es `Body` durch einen `[Audio]`-Block und setzt `{{Transcript}}`.
- **Befehlsparsing**: Wenn die Transkription erfolgreich ist, werden `CommandBody`/`RawBody` auf das Transkript gesetzt, sodass Slash-Befehle weiterhin funktionieren.
- **Ausführliches Logging**: In `--verbose` protokollieren wir, wann die Transkription läuft und wann sie den Textkörper ersetzt.

## Automatische Erkennung (Standard)

Wenn Sie **keine Modelle konfigurieren** und `tools.media.audio.enabled` **nicht** auf `false` gesetzt ist,
erkennt OpenClaw automatisch in dieser Reihenfolge und stoppt bei der ersten funktionierenden Option:

1. **Aktives Antwortmodell**, wenn sein Provider Audioverständnis unterstützt.
2. **Lokale CLIs** (falls installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
   - `whisper-cli` (von `whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
3. **Gemini CLI** (`gemini`) mit `read_many_files`
4. **Provider-Authentifizierung**
   - Konfigurierte `models.providers.*`-Einträge, die Audio unterstützen, werden zuerst versucht
   - Gebündelte Fallback-Reihenfolge: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Um die automatische Erkennung zu deaktivieren, setzen Sie `tools.media.audio.enabled: false`.
Zur Anpassung setzen Sie `tools.media.audio.models`.
Hinweis: Die Erkennung von Binärdateien erfolgt best effort unter macOS/Linux/Windows; stellen Sie sicher, dass sich die CLI im `PATH` befindet (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

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

### Transkript in den Chat zurückspiegeln (Opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // Standard ist false
        echoFormat: '📝 "{transcript}"', // optional, unterstützt {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Hinweise und Grenzen

- Provider-Authentifizierung folgt der Standardreihenfolge für Modell-Authentifizierung (Auth-Profile, Env-Variablen, `models.providers.*.apiKey`).
- Details zur Einrichtung von Groq: [Groq](/de/providers/groq).
- Deepgram verwendet `DEEPGRAM_API_KEY`, wenn `provider: "deepgram"` genutzt wird.
- Details zur Einrichtung von Deepgram: [Deepgram (Audiotranskription)](/de/providers/deepgram).
- Details zur Einrichtung von Mistral: [Mistral](/de/providers/mistral).
- SenseAudio verwendet `SENSEAUDIO_API_KEY`, wenn `provider: "senseaudio"` genutzt wird.
- Details zur Einrichtung von SenseAudio: [SenseAudio](/de/providers/senseaudio).
- Audio-Provider können `baseUrl`, `headers` und `providerOptions` über `tools.media.audio` überschreiben.
- Die standardmäßige Größenbegrenzung beträgt 20 MB (`tools.media.audio.maxBytes`). Zu große Audiodateien werden für dieses Modell übersprungen, und der nächste Eintrag wird versucht.
- Sehr kleine/leere Audiodateien unter 1024 Bytes werden vor der Provider-/CLI-Transkription übersprungen.
- Der Standardwert `maxChars` für Audio ist **nicht gesetzt** (volles Transkript). Setzen Sie `tools.media.audio.maxChars` oder pro Eintrag `maxChars`, um die Ausgabe zu kürzen.
- OpenAI verwendet standardmäßig automatisch `gpt-4o-mini-transcribe`; setzen Sie `model: "gpt-4o-transcribe"` für höhere Genauigkeit.
- Verwenden Sie `tools.media.audio.attachments`, um mehrere Sprachnotizen zu verarbeiten (`mode: "all"` + `maxAttachments`).
- Das Transkript ist in Vorlagen als `{{Transcript}}` verfügbar.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert; aktivieren Sie es, um die Bestätigung des Transkripts vor der Agentenverarbeitung zurück an den Ursprungschat zu senden.
- `tools.media.audio.echoFormat` passt den Echo-Text an (Platzhalter: `{transcript}`).
- CLI-stdout ist auf 5 MB begrenzt; halten Sie die CLI-Ausgabe kurz.

### Unterstützung für Proxy-Umgebungsvariablen

Providerbasierte Audiotranskription beachtet Standard-Env-Variablen für ausgehende Proxys:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Wenn keine Proxy-Env-Variablen gesetzt sind, wird direkter Egress verwendet. Wenn die Proxy-Konfiguration fehlerhaft ist, protokolliert OpenClaw eine Warnung und greift auf direkten Fetch zurück.

## Erwähnungserkennung in Gruppen

Wenn `requireMention: true` für einen Gruppenchat gesetzt ist, transkribiert OpenClaw Audio jetzt **vor** der Prüfung auf Erwähnungen. Dadurch können Sprachnotizen verarbeitet werden, selbst wenn sie Erwähnungen enthalten.

**So funktioniert es:**

1. Wenn eine Sprachnachricht keinen Textkörper hat und die Gruppe Erwähnungen erfordert, führt OpenClaw eine „Preflight“-Transkription durch.
2. Das Transkript wird auf Erwähnungsmuster geprüft (z. B. `@BotName`, Emoji-Trigger).
3. Wenn eine Erwähnung gefunden wird, durchläuft die Nachricht die vollständige Antwort-Pipeline.
4. Das Transkript wird für die Erwähnungserkennung verwendet, sodass Sprachnotizen die Erwähnungsschranke passieren können.

**Fallback-Verhalten:**

- Wenn die Transkription während des Preflight fehlschlägt (Timeout, API-Fehler usw.), wird die Nachricht auf Basis der rein textbasierten Erwähnungserkennung verarbeitet.
- Dadurch wird sichergestellt, dass gemischte Nachrichten (Text + Audio) niemals fälschlich verworfen werden.

**Opt-out pro Telegram-Gruppe/Topic:**

- Setzen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, um Preflight-Transkriptprüfungen auf Erwähnungen für diese Gruppe zu überspringen.
- Setzen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, um dies pro Topic zu überschreiben (`true` zum Überspringen, `false` zum erzwungenen Aktivieren).
- Standard ist `false` (Preflight aktiviert, wenn erwähnungsgesteuerte Bedingungen zutreffen).

**Beispiel:** Ein Benutzer sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnotiz mit „Hey @Claude, wie ist das Wetter?“. Die Sprachnotiz wird transkribiert, die Erwähnung wird erkannt, und der Agent antwortet.

## Stolperfallen

- Scope-Regeln verwenden „first match wins“. `chatType` wird zu `direct`, `group` oder `room` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit Exit-Code 0 endet und Klartext ausgibt; JSON muss über `jq -r .text` angepasst werden.
- Bei `parakeet-mlx` liest OpenClaw, wenn Sie `--output-dir` übergeben, `<output-dir>/<media-basename>.txt`, wenn `--output-format` `txt` ist (oder weggelassen wird); Nicht-`txt`-Ausgabeformate greifen auf stdout-Parsing zurück.
- Halten Sie Timeouts vernünftig (`timeoutSeconds`, Standard 60 s), um die Antwortwarteschlange nicht zu blockieren.
- Die Preflight-Transkription verarbeitet für die Erwähnungserkennung nur den **ersten** Audio-Anhang. Zusätzliche Audiodateien werden während der Hauptphase des Medienverständnisses verarbeitet.

## Verwandt

- [Medienverständnis](/de/nodes/media-understanding)
- [Talk-Modus](/de/nodes/talk)
- [Voice wake](/de/nodes/voicewake)
