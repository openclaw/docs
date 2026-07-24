---
read_when:
    - Ändern der Audiotranskription oder Medienverarbeitung
summary: Wie eingehende Audio-/Sprachnachrichten heruntergeladen, transkribiert und in Antworten eingefügt werden
title: Audio- und Sprachnachrichten
x-i18n:
    generated_at: "2026-07-24T03:56:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9303b2bb84c81f3a8c9f27fee6b84a1295022af96327c097987af56776487644
    source_path: nodes/audio.md
    workflow: 16
---

## Funktionsweise

Wenn die Audioerkennung aktiviert ist (oder automatisch erkannt wird), führt OpenClaw Folgendes aus:

1. Sucht den ersten Audioanhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
2. Erzwingt `maxBytes`, bevor die Daten an jeden Modelleintrag gesendet werden.
3. Führt den ersten geeigneten Modelleintrag der Reihe nach aus (Provider oder CLI); wenn ein Eintrag fehlschlägt oder übersprungen wird (Größe/Zeitüberschreitung), wird der nächste Eintrag versucht.
4. Ersetzt bei Erfolg `Body` durch einen `[Audio]`-Block und legt `{{Transcript}}` fest.

Wenn die Transkription erfolgreich ist, werden `CommandBody`/`RawBody` ebenfalls auf das Transkript gesetzt, damit Slash-Befehle weiterhin funktionieren. Mit `--verbose` zeigen die Protokolle, wann die Transkription ausgeführt wird und wann sie den Textkörper ersetzt.

## Automatische Erkennung (Standard)

Wenn Sie keine Modelle konfiguriert haben und `tools.media.audio.enabled` nicht `false` ist, führt OpenClaw die automatische Erkennung in dieser Reihenfolge durch und beendet sie bei der ersten funktionierenden Option:

1. **Aktives Antwortmodell**, wenn dessen Provider Audioerkennung unterstützt.
2. **Konfigurierte Provider-Authentifizierung** – jeder `models.providers.*`-Eintrag mit verfügbarer Authentifizierung für einen Provider, der Audiotranskription unterstützt. Dies wird vor lokalen CLIs geprüft, sodass ein konfigurierter API-Schlüssel stets Vorrang vor einer lokalen Binärdatei in `PATH` hat.
   Provider-Priorität, wenn mehrere konfiguriert sind: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **Lokale CLIs** (nur wenn keine Provider-Authentifizierung ermittelt wurde). OpenClaw erstellt eine geordnete Fallback-Liste:
   - `whisper-cli`, vor CPU-Standardeinstellungen nur dann, wenn bei einem früheren Modellaufruf im aktuellen Prozess Metal oder CUDA festgestellt wurde
   - `sherpa-onnx-offline` mit seinem standardmäßigen CPU-Provider (erfordert `SHERPA_ONNX_MODEL_DIR` mit `tokens.txt`, `encoder.onnx`, `decoder.onnx` und `joiner.onnx`)
   - `whisper-cli`, wenn Metal/CUDA lediglich beim Build unterstützt wird oder das ausgewählte Backend anderweitig nicht beobachtet wurde
   - `parakeet-mlx` auf Apple Silicon (MLX-fähig; die Gerätenutzung bleibt unbeobachtet)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)

Die Herkunft der Installation/Verknüpfung ist ein Nachweis der Fähigkeit, nicht der Ausführung. Sie verschiebt einen Kandidaten allein niemals vor CPU-sherpa. OpenClaw lädt während der Einrichtung oder bei Statusprüfungen kein Modell, nur um ein Backend zu prüfen.
Das automatisch erkannte whisper.cpp behält seine normalen Protokolle der Modellausführung aktiviert, damit OpenClaw die vorgelagerte `using … backend`-Zeile erfassen kann. Explizite CLI-Einträge behalten ihre konfigurierten Ausgabe-Flags bei.

Die automatische Erkennung der Gemini CLI für die Medienerkennung wurde durch einen in einer Sandbox ausgeführten Fallback der Antigravity CLI (`agy`) für Bilder/Videos ersetzt; für Audio wird über die oben genannten lokalen Binärdateien hinaus kein CLI-Fallback verwendet.

Um die automatische Erkennung zu deaktivieren, legen Sie `tools.media.audio.enabled: false` fest. Fügen Sie zur Anpassung mit Fähigkeiten gekennzeichnete Einträge zu `tools.media.models` hinzu.

<Note>
Die Erkennung von Binärdateien erfolgt unter macOS/Linux/Windows nach bestem Bemühen. Stellen Sie sicher, dass sich die CLI in `PATH` befindet (`~` wird erweitert), oder legen Sie ein explizites CLI-Modell mit einem vollständigen Befehlspfad fest.
</Note>

Prüfen Sie die lokale Auswahl, ohne Audio zu transkribieren:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Das Provider-Inventar meldet den Gewinner des lokalen Fallbacks getrennt von der globalen Provider-Auswahl sowie Felder für fähige, angeforderte und beobachtete Backends. Nach der Transkription meldet `/status` das angeforderte oder beobachtete Backend in der Medienzeile. Explizite, audiofähige `tools.media.models`-CLI-Einträge umgehen weiterhin die automatische Auswahl; verwenden Sie deren Backend-spezifische Flags wie sherpa `--provider=cuda` oder whisper.cpp `--no-gpu`/`--device`.

## Konfigurationsbeispiele

### Provider mit CLI-Fallback (OpenAI und Whisper CLI)

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-4o-transcribe", capabilities: ["audio"] },
        {
          type: "cli",
          command: "whisper",
          args: ["--model", "base", "{{MediaPath}}"],
          timeoutSeconds: 45,
          capabilities: ["audio"],
        },
      ],
      audio: { enabled: true, preferredModel: "openai/gpt-4o-transcribe" },
    },
  },
}
```

### Nur Provider (Deepgram)

```json5
{
  tools: {
    media: {
      models: [{ provider: "deepgram", model: "nova-3", capabilities: ["audio"] }],
      audio: { enabled: true },
    },
  },
}
```

### Nur Provider (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      models: [{ provider: "mistral", model: "voxtral-mini-latest", capabilities: ["audio"] }],
      audio: { enabled: true },
    },
  },
}
```

### Nur Provider (SenseAudio)

```json5
{
  tools: {
    media: {
      models: [
        {
          provider: "senseaudio",
          model: "senseaudio-asr-pro-1.5-260319",
          capabilities: ["audio"],
        },
      ],
      audio: { enabled: true },
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
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
    },
  },
}
```

## Hinweise und Einschränkungen

- Die Provider-Authentifizierung folgt der standardmäßigen Reihenfolge der Modellauthentifizierung (Authentifizierungsprofile, Umgebungsvariablen, `models.providers.*.apiKey`).
- Einrichtungsdetails für Groq: [Groq](/de/providers/groq).
- Deepgram übernimmt `DEEPGRAM_API_KEY`, wenn `provider: "deepgram"` verwendet wird. Einrichtungsdetails: [Deepgram](/de/providers/deepgram).
- Einrichtungsdetails für Mistral: [Mistral](/de/providers/mistral).
- SenseAudio übernimmt `SENSEAUDIO_API_KEY`, wenn `provider: "senseaudio"` verwendet wird. Einrichtungsdetails: [SenseAudio](/de/providers/senseaudio).
- Audio-Provider können Standardeinstellungen unter `tools.media.audio` verwenden oder `baseUrl`, `headers`, `providerOptions` sowie Grenzwerte in ihrem `tools.media.models[]`-Eintrag überschreiben.
- Die integrierte Größenbeschränkung für Audio beträgt 20MB. Eine Überschreibung durch `maxBytes` auf Eintragsebene kann sie ändern; zu große Audiodateien werden für dieses Modell übersprungen und der nächste Eintrag wird versucht.
- Audiodateien mit weniger als 1024 Byte werden vor der Provider-/CLI-Transkription übersprungen.
- Der standardmäßige `maxChars`-Wert für Audio ist **nicht festgelegt** (vollständiges Transkript). Legen Sie `tools.media.audio.maxChars` oder `maxChars` pro Eintrag fest, um die Ausgabe zu kürzen.
- Der Standardwert der automatischen Erkennung für OpenAI ist `gpt-4o-transcribe`; legen Sie `model: "gpt-4o-mini-transcribe"` für eine günstigere/schnellere Option fest.
- Das Transkript steht Vorlagen als `{{Transcript}}` zur Verfügung.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert; `echoFormat` akzeptiert einen `{transcript}`-Platzhalter.
- Die CLI-Standardausgabe ist auf 5MB begrenzt; halten Sie die CLI-Ausgabe knapp.
- CLI-`args` sollte `{{MediaPath}}` für den lokalen Audiodateipfad verwenden. Führen Sie `openclaw doctor --fix` aus, um veraltete `{input}`-Platzhalter aus älteren `audio.transcription.command`-Konfigurationen zu migrieren (entfernter Schlüssel: `audio.transcription`, ersetzt durch `tools.media.models`).
- `tools.media.concurrency` begrenzt Medienaufgaben; es ist kein GPU-Scheduler.

### Dauerhaft ausgeführte lokale Spracherkennung

Die automatisch erkannte lokale Spracherkennung bleibt pro Anfrage ein eigener Prozess. OpenClaw verwaltet derzeit keinen dauerhaft ausgeführten whisper.cpp-Server, da das standardmäßige Homebrew-Paket `whisper-cpp` diesen Server deaktiviert, während das vorgelagerte Beispiel keine konfigurierte begrenzte Annahmewarteschlange besitzt. Ein Plugin-eigener dauerhafter Lebenszyklus benötigt einen gepflegten, paketierten Worker mit Zustands-/Startprüfung, Modellresidenz, begrenzter Warteschlange, Abbruch/Zeitüberschreitung, ausschließlich auf Loopback beschränktem Betrieb ohne Authentifizierung und ohne Cloud-Fallback, bevor er sicher aktiviert werden kann.

### Unterstützung für Proxy-Umgebungsvariablen

Die Provider-basierte Audiotranskription berücksichtigt standardmäßige Umgebungsvariablen für ausgehende Proxys entsprechend der `EnvHttpProxyAgent`-Semantik von undici:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Variablen in Kleinbuchstaben haben Vorrang vor solchen in Großbuchstaben; `NO_PROXY`- bzw. `no_proxy`-Einträge (Hostnamen, `*.suffix` oder `host:port`) umgehen den Proxy. Wenn keine Proxy-Umgebungsvariablen festgelegt sind, wird eine direkte ausgehende Verbindung verwendet. Wenn die Proxy-Einrichtung fehlschlägt (fehlerhafte URL), protokolliert OpenClaw eine Warnung und greift auf einen direkten Abruf zurück.

## Erwähnungserkennung in Gruppen

Auf Kanälen, die eine Audio-Vorabprüfung unterstützen, transkribiert OpenClaw Audio **vor** der Prüfung auf Erwähnungen, wenn `requireMention: true` für einen Gruppenchat festgelegt ist. Dadurch kann eine Sprachnachricht ohne Beschriftung die Erwähnungsprüfung passieren, wenn ihr Transkript ein konfiguriertes Erwähnungsmuster enthält. Kanalspezifische Dokumentationen beschreiben Übertragungswege, die stattdessen eine eingegebene Erwähnung erfordern.

**Funktionsweise:**

1. Wenn eine Sprachnachricht keinen Textkörper besitzt und die Gruppe Erwähnungen erfordert, führt OpenClaw eine Vorabtranskription des ersten Audioanhangs durch.
2. Das Transkript wird auf Erwähnungsmuster geprüft (beispielsweise `@BotName`, Emoji-Auslöser).
3. Wenn eine Erwähnung gefunden wird, durchläuft die Nachricht die vollständige Antwort-Pipeline.

**Fallback-Verhalten:** Wenn die Vorabtranskription fehlschlägt (Zeitüberschreitung, API-Fehler usw.), greift die Nachricht auf die reine Text-Erwähnungserkennung zurück, sodass gemischte Nachrichten (Text und Audio) niemals verworfen werden.

**Opt-out pro Telegram-Gruppe/-Thema:**

- Legen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true` fest, um Vorabprüfungen des Transkripts auf Erwähnungen für diese Gruppe zu überspringen.
- Legen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` fest, um dies pro Thema zu überschreiben (`true` zum Überspringen, `false` zum erzwungenen Aktivieren).
- Der Standardwert ist `false` (Vorabprüfung aktiviert, wenn die Bedingungen für die Erwähnungsprüfung erfüllt sind).

**Beispiel:** Eine Person sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnachricht mit dem Inhalt „Hey @Claude, wie ist das Wetter?“. Die Sprachnachricht wird transkribiert, die Erwähnung erkannt und der Agent antwortet.

## Fallstricke

- Bereichsregeln verwenden den ersten Treffer; `chatType` wird zu `direct`, `group` oder `channel` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit 0 beendet wird und Klartext ausgibt; JSON-Ausgaben müssen über `jq -r .text` aufbereitet werden.
- Bekannte Dateiausgabemodi sind maßgeblich: Eine leere oder fehlende abgeleitete Transkriptdatei führt zu keinem Transkript, statt auf die Fortschrittsausgabe der CLI zurückzugreifen.
- Verwenden Sie für `parakeet-mlx` `--output-format txt` (oder `all`) mit `--output-dir` und der standardmäßigen `{filename}`-Ausgabevorlage. Die vorgelagerten Umgebungsvariablen `PARAKEET_OUTPUT_FORMAT` und `PARAKEET_OUTPUT_TEMPLATE` werden ebenfalls berücksichtigt. OpenClaw liest `<output-dir>/<media-basename>.txt`; das standardmäßige `srt`-Format, andere Formate und benutzerdefinierte Ausgabevorlagen verwenden weiterhin die Standardausgabe.
- Halten Sie Zeitüberschreitungen in einem angemessenen Rahmen (`timeoutSeconds`, standardmäßig 60s), damit die Antwortwarteschlange nicht blockiert wird.
- Die Vorabtranskription verarbeitet zur Erwähnungserkennung nur den **ersten** Audioanhang. Weitere Audioanhänge werden während der Hauptphase der Medienerkennung verarbeitet.

## Verwandte Themen

- [Medienerkennung](/de/nodes/media-understanding)
- [Sprechmodus](/de/nodes/talk)
- [Sprachaktivierung](/de/nodes/voicewake)
