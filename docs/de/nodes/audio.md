---
read_when:
    - Audio-Transkription oder Medienverarbeitung ändern
summary: Wie eingehende Audio- und Sprachnachrichten heruntergeladen, transkribiert und in Antworten eingefügt werden
title: Audio- und Sprachnachrichten
x-i18n:
    generated_at: "2026-07-12T15:36:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Funktionsweise

Wenn das Audioverständnis aktiviert ist (oder automatisch erkannt wird), führt OpenClaw folgende Schritte aus:

1. Es ermittelt den ersten Audioanhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
2. Es erzwingt `maxBytes`, bevor der Anhang an jeden Modelleintrag gesendet wird.
3. Es führt den ersten geeigneten Modelleintrag der Reihe nach aus (Provider oder CLI). Wenn ein Eintrag fehlschlägt oder übersprungen wird (Größe/Zeitüberschreitung), wird der nächste Eintrag versucht.
4. Bei Erfolg ersetzt es `Body` durch einen `[Audio]`-Block und setzt `{{Transcript}}`.

Wenn die Transkription erfolgreich ist, werden `CommandBody`/`RawBody` ebenfalls auf das Transkript gesetzt, damit Slash-Befehle weiterhin funktionieren. Mit `--verbose` zeigen die Protokolle, wann die Transkription ausgeführt wird und wann sie den Textkörper ersetzt.

## Automatische Erkennung (Standard)

Wenn Sie keine Modelle konfiguriert haben und `tools.media.audio.enabled` nicht auf `false` gesetzt ist, führt OpenClaw die automatische Erkennung in dieser Reihenfolge durch und beendet sie bei der ersten funktionierenden Option:

1. **Aktives Antwortmodell**, wenn dessen Provider Audioverständnis unterstützt.
2. **Konfigurierte Provider-Authentifizierung** – jeder `models.providers.*`-Eintrag mit verfügbarer Authentifizierung für einen Provider, der Audiotranskription unterstützt. Dies wird vor lokalen CLIs geprüft, sodass ein konfigurierter API-Schlüssel stets Vorrang vor einem lokalen Programm in `PATH` hat.
   Provider-Priorität bei mehreren konfigurierten Providern: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **Lokale CLIs** (nur wenn keine Provider-Authentifizierung ermittelt wurde). OpenClaw erstellt eine geordnete Fallback-Liste:
   - `whisper-cli`, vor CPU-Standardeinstellungen nur dann, wenn ein früherer Modellaufruf im aktuellen Prozess Metal oder CUDA erkannt hat
   - `sherpa-onnx-offline` mit seinem standardmäßigen CPU-Provider (erfordert `SHERPA_ONNX_MODEL_DIR` mit `tokens.txt`, `encoder.onnx`, `decoder.onnx` und `joiner.onnx`)
   - `whisper-cli`, wenn Metal/CUDA lediglich beim Build unterstützt wird oder das ausgewählte Backend anderweitig noch nicht beobachtet wurde
   - `parakeet-mlx` auf Apple Silicon (MLX-fähig; die Gerätenutzung bleibt unbeobachtet)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)

Die Herkunft der Installation/Verknüpfung ist ein Nachweis der Fähigkeit, nicht der Ausführung. Sie verschiebt einen Kandidaten für sich genommen niemals vor CPU-Sherpa. OpenClaw lädt während der Einrichtung oder bei Statusprüfungen kein Modell, nur um ein Backend zu prüfen.
Automatisch erkanntes whisper.cpp lässt seine normalen Modelllauf-Protokolle aktiviert, damit OpenClaw die vorgelagerte Zeile `using … backend` erfassen kann. Explizite CLI-Einträge behalten ihre konfigurierten Ausgabeoptionen bei.

Die automatische Erkennung der Gemini CLI für das Medienverständnis wurde durch einen sandboxgeschützten Antigravity-CLI-Fallback (`agy`) für Bilder/Videos ersetzt. Audio verwendet außer den oben genannten lokalen Programmen keinen CLI-Fallback.

Um die automatische Erkennung zu deaktivieren, setzen Sie `tools.media.audio.enabled: false`. Zur Anpassung setzen Sie `tools.media.audio.models`.

<Note>
Die Binärerkennung erfolgt nach bestem Bemühen unter macOS/Linux/Windows. Stellen Sie sicher, dass sich die CLI in `PATH` befindet (`~` wird expandiert), oder legen Sie ein explizites CLI-Modell mit einem vollständigen Befehlspfad fest.
</Note>

Prüfen Sie die lokale Auswahl, ohne Audio zu transkribieren:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Das Provider-Inventar meldet den Gewinner des lokalen Fallbacks getrennt von der globalen Provider-Auswahl sowie Felder für fähige, angeforderte und beobachtete Backends. Nach Ausführung der Transkription zeigt `/status` in der Medienzeile das angeforderte oder beobachtete Backend an. Explizite CLI-Einträge in `tools.media.audio.models` umgehen weiterhin die automatische Auswahl. Verwenden Sie deren Backend-spezifische Optionen wie `--provider=cuda` für Sherpa oder `--no-gpu`/`--device` für whisper.cpp.

## Konfigurationsbeispiele

### Provider- und CLI-Fallback (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
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

### Nur Provider mit Bereichsbeschränkung

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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### Transkript im Chat wiedergeben (Opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // Standard ist false
        echoFormat: '📝 "{transcript}"', // optional, unterstützt {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Hinweise und Beschränkungen

- Die Provider-Authentifizierung folgt der standardmäßigen Reihenfolge der Modellauthentifizierung (Authentifizierungsprofile, Umgebungsvariablen, `models.providers.*.apiKey`).
- Details zur Einrichtung von Groq: [Groq](/de/providers/groq).
- Deepgram verwendet `DEEPGRAM_API_KEY`, wenn `provider: "deepgram"` verwendet wird. Details zur Einrichtung: [Deepgram](/de/providers/deepgram).
- Details zur Einrichtung von Mistral: [Mistral](/de/providers/mistral).
- SenseAudio verwendet `SENSEAUDIO_API_KEY`, wenn `provider: "senseaudio"` verwendet wird. Details zur Einrichtung: [SenseAudio](/de/providers/senseaudio).
- Audio-Provider können `baseUrl`, `headers` und `providerOptions` über `tools.media.audio` überschreiben.
- Die standardmäßige Größenbegrenzung beträgt 20MB (`tools.media.audio.maxBytes`). Zu große Audiodateien werden für dieses Modell übersprungen, und der nächste Eintrag wird versucht.
- Audiodateien unter 1024 Bytes werden vor der Provider-/CLI-Transkription übersprungen.
- Der Standardwert für `maxChars` bei Audio ist **nicht gesetzt** (vollständiges Transkript). Setzen Sie `tools.media.audio.maxChars` oder ein eintragsspezifisches `maxChars`, um die Ausgabe zu kürzen.
- Der Standardwert der automatischen OpenAI-Erkennung ist `gpt-4o-transcribe`. Setzen Sie `model: "gpt-4o-mini-transcribe"` für eine günstigere/schnellere Option.
- Verwenden Sie `tools.media.audio.attachments`, um mehrere Sprachnachrichten zu verarbeiten (`mode: "all"` zusammen mit `maxAttachments`, Standardwert 1).
- Das Transkript steht Vorlagen als `{{Transcript}}` zur Verfügung.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert. Aktivieren Sie es, um vor der Agentenverarbeitung eine Transkriptbestätigung an den ursprünglichen Chat zurückzusenden.
- `tools.media.audio.echoFormat` passt den Wiedergabetext an (Platzhalter: `{transcript}`; Standardwert `📝 "{transcript}"`).
- Die Standardausgabe der CLI ist auf 5MB begrenzt. Halten Sie die CLI-Ausgabe knapp.
- CLI-`args` sollten `{{MediaPath}}` für den lokalen Pfad der Audiodatei verwenden. Führen Sie `openclaw doctor --fix` aus, um veraltete `{input}`-Platzhalter aus älteren `audio.transcription.command`-Konfigurationen zu migrieren (eingestellter Schlüssel: `audio.transcription`, ersetzt durch `tools.media.audio.models`).
- `tools.media.concurrency` begrenzt Medienaufgaben; es ist kein GPU-Scheduler.

### Dauerhaft laufende lokale Spracherkennung

Automatisch erkannte lokale Spracherkennung bleibt ein separater Prozess pro Anfrage. OpenClaw verwaltet derzeit keinen dauerhaft laufenden whisper.cpp-Server, da das standardmäßige Homebrew-Paket `whisper-cpp` diesen Server deaktiviert, während das vorgelagerte Beispiel keine konfigurierte, begrenzte Zugangswarteschlange besitzt. Ein Plugin-eigener dauerhaft laufender Lebenszyklus benötigt einen gepflegten paketierten Worker mit Zustands-/Startprüfung, dauerhaft geladenem Modell, begrenzter Warteschlange, Abbruch/Zeitüberschreitung, authentifizierungsfreiem Betrieb ausschließlich über die Loopback-Schnittstelle und ohne Cloud-Fallback, bevor er sicher aktiviert werden kann.

### Unterstützung für Proxy-Umgebungen

Provider-basierte Audiotranskription berücksichtigt standardmäßige Umgebungsvariablen für ausgehende Proxys entsprechend der Semantik von undicis `EnvHttpProxyAgent`:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Variablen in Kleinschreibung haben Vorrang vor solchen in Großschreibung. Einträge in `NO_PROXY`/`no_proxy` (Hostnamen, `*.suffix` oder `host:port`) umgehen den Proxy. Wenn keine Proxy-Umgebungsvariablen gesetzt sind, wird eine direkte ausgehende Verbindung verwendet. Wenn die Proxy-Einrichtung fehlschlägt (fehlerhafte URL), protokolliert OpenClaw eine Warnung und greift auf einen direkten Abruf zurück.

## Erwähnungserkennung in Gruppen

In Kanälen, die eine Audio-Vorprüfung unterstützen, transkribiert OpenClaw Audio **vor** der Prüfung auf Erwähnungen, wenn für einen Gruppenchat `requireMention: true` festgelegt ist. Dadurch kann eine Sprachnachricht ohne Bildunterschrift die Erwähnungsschranke passieren, wenn ihr Transkript ein konfiguriertes Erwähnungsmuster enthält. Kanalspezifische Dokumentationen beschreiben Übertragungswege, die stattdessen eine eingegebene Erwähnung erfordern.

**Funktionsweise:**

1. Wenn eine Sprachnachricht keinen Textkörper enthält und die Gruppe Erwähnungen erfordert, führt OpenClaw eine Vorabtranskription des ersten Audioanhangs durch.
2. Das Transkript wird auf Erwähnungsmuster geprüft (zum Beispiel `@BotName`, Emoji-Auslöser).
3. Wenn eine Erwähnung gefunden wird, durchläuft die Nachricht die vollständige Antwortpipeline.

**Fallback-Verhalten:** Wenn die Vorabtranskription fehlschlägt (Zeitüberschreitung, API-Fehler usw.), greift die Nachricht auf die reine Texterkennung von Erwähnungen zurück, sodass gemischte Nachrichten (Text + Audio) niemals verworfen werden.

**Deaktivierung pro Telegram-Gruppe/-Thema:**

- Setzen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, um die vorgezogene Prüfung des Transkripts auf Erwähnungen für diese Gruppe zu überspringen.
- Setzen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, um dies pro Thema zu überschreiben (`true` zum Überspringen, `false` zum erzwungenen Aktivieren).
- Der Standardwert ist `false` (Vorprüfung aktiviert, wenn die Bedingungen der Erwähnungsschranke erfüllt sind).

**Beispiel:** Ein Benutzer sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnachricht mit dem Inhalt „Hallo @Claude, wie ist das Wetter?“. Die Sprachnachricht wird transkribiert, die Erwähnung wird erkannt und der Agent antwortet.

## Fallstricke

- Bei Bereichsregeln gilt der erste Treffer; `chatType` wird auf `direct`, `group` oder `channel` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit 0 beendet wird und Klartext ausgibt. JSON-Ausgaben müssen über `jq -r .text` aufbereitet werden.
- Bekannte Dateiausgabemodi sind maßgeblich: Eine leere oder fehlende abgeleitete Transkriptdatei erzeugt kein Transkript, statt auf die Fortschrittsausgabe der CLI zurückzugreifen.
- Verwenden Sie für `parakeet-mlx` `--output-format txt` (oder `all`) zusammen mit `--output-dir` und der standardmäßigen Ausgabevorlage `{filename}`. Die vorgelagerten Umgebungsvariablen `PARAKEET_OUTPUT_FORMAT` und `PARAKEET_OUTPUT_TEMPLATE` werden ebenfalls berücksichtigt. OpenClaw liest `<output-dir>/<media-basename>.txt`. Das standardmäßige `srt`-Format, andere Formate und benutzerdefinierte Ausgabevorlagen verwenden weiterhin die Standardausgabe.
- Halten Sie Zeitüberschreitungen angemessen (`timeoutSeconds`, Standardwert 60s), um eine Blockierung der Antwortwarteschlange zu vermeiden.
- Die Vorabtranskription verarbeitet für die Erwähnungserkennung nur den **ersten** Audioanhang. Zusätzliche Audioanhänge werden während der Hauptphase des Medienverständnisses verarbeitet.

## Verwandte Themen

- [Medienverständnis](/de/nodes/media-understanding)
- [Sprechmodus](/de/nodes/talk)
- [Sprachaktivierung](/de/nodes/voicewake)
