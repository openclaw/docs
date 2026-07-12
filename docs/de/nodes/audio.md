---
read_when:
    - Audio-Transkription oder Medienverarbeitung ändern
summary: Wie eingehende Audio- und Sprachnachrichten heruntergeladen, transkribiert und in Antworten eingefügt werden
title: Audio- und Sprachnachrichten
x-i18n:
    generated_at: "2026-07-12T01:47:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Funktionsweise

Wenn die Audioerkennung aktiviert ist (oder automatisch erkannt wurde), führt OpenClaw folgende Schritte aus:

1. OpenClaw sucht den ersten Audioanhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
2. OpenClaw erzwingt `maxBytes`, bevor der Anhang an den jeweiligen Modelleintrag gesendet wird.
3. OpenClaw führt der Reihe nach den ersten geeigneten Modelleintrag aus (Provider oder CLI). Wenn ein Eintrag fehlschlägt oder übersprungen wird (Größe/Zeitüberschreitung), wird der nächste Eintrag versucht.
4. Bei Erfolg ersetzt OpenClaw `Body` durch einen `[Audio]`-Block und setzt `{{Transcript}}`.

Wenn die Transkription erfolgreich ist, werden auch `CommandBody`/`RawBody` auf das Transkript gesetzt, sodass Slash-Befehle weiterhin funktionieren. Mit `--verbose` zeigen die Protokolle, wann die Transkription ausgeführt wird und wann sie den Inhalt ersetzt.

## Automatische Erkennung (Standard)

Wenn Sie keine Modelle konfiguriert haben und `tools.media.audio.enabled` nicht auf `false` gesetzt ist, führt OpenClaw die automatische Erkennung in der folgenden Reihenfolge durch und beendet sie bei der ersten funktionsfähigen Option:

1. **Aktives Antwortmodell**, wenn dessen Provider Audioerkennung unterstützt.
2. **Konfigurierte Provider-Authentifizierung** – jeder `models.providers.*`-Eintrag mit verfügbarer Authentifizierung für einen Provider, der Audiotranskription unterstützt. Dies wird vor lokalen CLIs geprüft, sodass ein konfigurierter API-Schlüssel immer Vorrang vor einer lokalen Binärdatei in `PATH` hat.
   Priorität der Provider, wenn mehrere konfiguriert sind: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **Lokale CLIs** (nur wenn keine Provider-Authentifizierung ermittelt wurde). OpenClaw erstellt eine geordnete Fallback-Liste:
   - `whisper-cli` vor den CPU-Standardeinstellungen, jedoch nur, wenn ein früherer Modellaufruf im aktuellen Prozess Metal oder CUDA erkannt hat
   - `sherpa-onnx-offline` mit seinem standardmäßigen CPU-Provider (erfordert `SHERPA_ONNX_MODEL_DIR` mit `tokens.txt`, `encoder.onnx`, `decoder.onnx` und `joiner.onnx`)
   - `whisper-cli`, wenn Metal/CUDA nur vom Build unterstützt wird oder das ausgewählte Backend anderweitig noch nicht beobachtet wurde
   - `parakeet-mlx` auf Apple Silicon (MLX-fähig; die Gerätenutzung bleibt unbeobachtet)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)

Die Herkunft der Installation oder Verknüpfung ist ein Nachweis der Fähigkeit, kein Nachweis der Ausführung. Sie verschiebt einen Kandidaten für sich genommen niemals vor CPU-sherpa. OpenClaw lädt während der Einrichtung oder bei Statusprüfungen kein Modell, nur um ein Backend zu prüfen.
Automatisch erkanntes whisper.cpp behält seine normalen Modelllaufprotokolle aktiviert, damit OpenClaw die vorgelagerte Zeile `using … backend` erfassen kann. Explizite CLI-Einträge behalten ihre konfigurierten Ausgabeoptionen bei.

Die automatische Erkennung der Gemini CLI für die Medienerkennung wurde durch einen in einer Sandbox ausgeführten Fallback der Antigravity CLI (`agy`) für Bilder und Videos ersetzt. Für Audio wird über die oben aufgeführten lokalen Binärdateien hinaus kein CLI-Fallback verwendet.

Um die automatische Erkennung zu deaktivieren, setzen Sie `tools.media.audio.enabled: false`. Um sie anzupassen, setzen Sie `tools.media.audio.models`.

<Note>
Die Erkennung von Binärdateien erfolgt unter macOS/Linux/Windows nach bestem Bemühen. Stellen Sie sicher, dass sich die CLI in `PATH` befindet (`~` wird aufgelöst), oder legen Sie ein explizites CLI-Modell mit dem vollständigen Befehlspfad fest.
</Note>

Prüfen Sie die lokale Auswahl, ohne Audio zu transkribieren:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Die Provider-Bestandsaufnahme meldet den Gewinner des lokalen Fallbacks getrennt von der globalen Provider-Auswahl sowie Felder für fähige, angeforderte und beobachtete Backends. Nach einer Transkription zeigt `/status` in der Medienzeile das angeforderte oder beobachtete Backend an. Explizite CLI-Einträge in `tools.media.audio.models` umgehen weiterhin die automatische Auswahl. Verwenden Sie deren Backend-spezifische Optionen wie sherpa `--provider=cuda` oder whisper.cpp `--no-gpu`/`--device`.

## Konfigurationsbeispiele

### Provider mit CLI-Fallback (OpenAI und Whisper CLI)

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

### Nur Provider mit Einschränkung des Geltungsbereichs

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

### Transkript im Chat wiedergeben (optional)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // Standardwert ist false
        echoFormat: '📝 "{transcript}"', // optional, unterstützt {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Hinweise und Beschränkungen

- Die Provider-Authentifizierung folgt der standardmäßigen Reihenfolge für die Modellauthentifizierung (Authentifizierungsprofile, Umgebungsvariablen, `models.providers.*.apiKey`).
- Einzelheiten zur Einrichtung von Groq: [Groq](/de/providers/groq).
- Deepgram verwendet `DEEPGRAM_API_KEY`, wenn `provider: "deepgram"` verwendet wird. Einzelheiten zur Einrichtung: [Deepgram](/de/providers/deepgram).
- Einzelheiten zur Einrichtung von Mistral: [Mistral](/de/providers/mistral).
- SenseAudio verwendet `SENSEAUDIO_API_KEY`, wenn `provider: "senseaudio"` verwendet wird. Einzelheiten zur Einrichtung: [SenseAudio](/de/providers/senseaudio).
- Audio-Provider können `baseUrl`, `headers` und `providerOptions` über `tools.media.audio` überschreiben.
- Die standardmäßige Größenbeschränkung beträgt 20 MB (`tools.media.audio.maxBytes`). Zu große Audiodateien werden für dieses Modell übersprungen, und der nächste Eintrag wird versucht.
- Audiodateien mit weniger als 1024 Byte werden vor der Provider-/CLI-Transkription übersprungen.
- Der Standardwert von `maxChars` für Audio ist **nicht festgelegt** (vollständiges Transkript). Legen Sie `tools.media.audio.maxChars` oder ein eintragsspezifisches `maxChars` fest, um die Ausgabe zu kürzen.
- Der Standardwert der automatischen Erkennung für OpenAI ist `gpt-4o-transcribe`. Legen Sie `model: "gpt-4o-mini-transcribe"` fest, um eine kostengünstigere und schnellere Option zu verwenden.
- Verwenden Sie `tools.media.audio.attachments`, um mehrere Sprachnachrichten zu verarbeiten (`mode: "all"` zusammen mit `maxAttachments`, Standardwert 1).
- Das Transkript ist in Vorlagen als `{{Transcript}}` verfügbar.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert. Aktivieren Sie es, um vor der Verarbeitung durch den Agenten eine Transkriptbestätigung an den ursprünglichen Chat zurückzusenden.
- `tools.media.audio.echoFormat` passt den Text der Rückmeldung an (Platzhalter: `{transcript}`; Standardwert `📝 "{transcript}"`).
- Die Standardausgabe der CLI ist auf 5 MB begrenzt. Halten Sie die CLI-Ausgabe knapp.
- CLI-`args` sollten `{{MediaPath}}` für den lokalen Pfad der Audiodatei verwenden. Führen Sie `openclaw doctor --fix` aus, um veraltete `{input}`-Platzhalter aus älteren `audio.transcription.command`-Konfigurationen zu migrieren (entfernter Schlüssel: `audio.transcription`, ersetzt durch `tools.media.audio.models`).
- `tools.media.concurrency` begrenzt Medienaufgaben; es ist kein GPU-Scheduler.

### Dauerhaft laufende lokale Spracherkennung

Automatisch erkannte lokale Spracherkennung bleibt pro Anfrage ein eigener Prozess. OpenClaw verwaltet derzeit keinen dauerhaft laufenden whisper.cpp-Server, da das standardmäßige Homebrew-Paket `whisper-cpp` diesen Server deaktiviert und das vorgelagerte Beispiel keine konfigurierte, begrenzte Aufnahmewarteschlange besitzt. Für einen Plugin-eigenen dauerhaften Lebenszyklus ist ein gepflegter, paketierter Worker mit Zustands-/Startprüfung, dauerhaft geladenem Modell, begrenzter Warteschlange, Abbruch/Zeitüberschreitung, ausschließlich über local loopback zugänglichem Betrieb ohne Authentifizierung und ohne Cloud-Fallback erforderlich, bevor er sicher aktiviert werden kann.

### Unterstützung für Proxy-Umgebungsvariablen

Die Provider-basierte Audiotranskription berücksichtigt standardmäßige Umgebungsvariablen für ausgehende Proxys entsprechend der Semantik von undicis `EnvHttpProxyAgent`:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Variablen in Kleinbuchstaben haben Vorrang vor Variablen in Großbuchstaben. Einträge in `NO_PROXY`/`no_proxy` (Hostnamen, `*.suffix` oder `host:port`) umgehen den Proxy. Wenn keine Proxy-Umgebungsvariablen gesetzt sind, wird eine direkte ausgehende Verbindung verwendet. Wenn die Proxy-Einrichtung fehlschlägt (fehlerhafte URL), protokolliert OpenClaw eine Warnung und greift auf einen direkten Abruf zurück.

## Erwähnungserkennung in Gruppen

Auf Kanälen, die eine Audio-Vorabprüfung unterstützen, transkribiert OpenClaw Audio **vor** der Prüfung auf Erwähnungen, wenn für einen Gruppenchat `requireMention: true` festgelegt ist. Dadurch kann eine Sprachnachricht ohne Beschriftung die Erwähnungsprüfung bestehen, wenn ihr Transkript ein konfiguriertes Erwähnungsmuster enthält. Kanalspezifische Dokumentationen beschreiben Transportwege, die stattdessen eine eingegebene Erwähnung erfordern.

**Funktionsweise:**

1. Wenn eine Sprachnachricht keinen Textinhalt enthält und die Gruppe Erwähnungen erfordert, führt OpenClaw eine Vorabtranskription des ersten Audioanhangs durch.
2. Das Transkript wird auf Erwähnungsmuster geprüft (zum Beispiel `@BotName`, Emoji-Auslöser).
3. Wenn eine Erwähnung gefunden wird, durchläuft die Nachricht die vollständige Antwortverarbeitung.

**Fallback-Verhalten:** Wenn die Vorabtranskription fehlschlägt (Zeitüberschreitung, API-Fehler usw.), greift die Nachricht auf eine reine Texterkennung für Erwähnungen zurück, sodass gemischte Nachrichten (Text und Audio) niemals verworfen werden.

**Deaktivierung pro Telegram-Gruppe/-Thema:**

- Setzen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, um die Vorabprüfung des Transkripts auf Erwähnungen für diese Gruppe zu überspringen.
- Setzen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, um die Einstellung pro Thema zu überschreiben (`true` zum Überspringen, `false` zum Erzwingen der Aktivierung).
- Der Standardwert ist `false` (die Vorabprüfung ist aktiviert, wenn die Bedingungen der Erwähnungsprüfung erfüllt sind).

**Beispiel:** Eine Person sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnachricht mit dem Inhalt „Hallo @Claude, wie ist das Wetter?“. Die Sprachnachricht wird transkribiert, die Erwähnung wird erkannt und der Agent antwortet.

## Fallstricke

- Regeln für den Geltungsbereich verwenden den ersten Treffer; `chatType` wird auf `direct`, `group` oder `channel` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit dem Status 0 beendet wird und Klartext ausgibt. JSON-Ausgaben müssen über `jq -r .text` aufbereitet werden.
- Bekannte Dateiausgabemodi sind maßgeblich: Eine leere oder fehlende abgeleitete Transkriptdatei erzeugt kein Transkript, statt auf die Fortschrittsausgabe der CLI zurückzugreifen.
- Verwenden Sie für `parakeet-mlx` `--output-format txt` (oder `all`) zusammen mit `--output-dir` und der standardmäßigen Ausgabevorlage `{filename}`. Die vorgelagerten Umgebungsvariablen `PARAKEET_OUTPUT_FORMAT` und `PARAKEET_OUTPUT_TEMPLATE` werden ebenfalls berücksichtigt. OpenClaw liest `<output-dir>/<media-basename>.txt`; beim Standardformat `srt`, bei anderen Formaten und bei benutzerdefinierten Ausgabevorlagen wird weiterhin die Standardausgabe verwendet.
- Wählen Sie angemessene Zeitüberschreitungen (`timeoutSeconds`, Standardwert 60 s), damit die Antwortwarteschlange nicht blockiert wird.
- Die Vorabtranskription verarbeitet für die Erwähnungserkennung nur den **ersten** Audioanhang. Weitere Audioanhänge werden während der Hauptphase der Medienerkennung verarbeitet.

## Verwandte Themen

- [Medienerkennung](/de/nodes/media-understanding)
- [Sprechmodus](/de/nodes/talk)
- [Sprachaktivierung](/de/nodes/voicewake)
