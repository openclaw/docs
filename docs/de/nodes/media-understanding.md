---
read_when:
    - Medienverständnis entwerfen oder überarbeiten
    - Vorverarbeitung eingehender Audio-/Video-/Bilder abstimmen
summary: Verständnis eingehender Bilder/Audio/Video (optional) mit Fallbacks für Provider + CLI
title: Medienverständnis
x-i18n:
    generated_at: "2026-04-25T13:49:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Medienverständnis – eingehend (2026-01-17)

OpenClaw kann **eingehende Medien zusammenfassen** (Bild/Audio/Video), bevor die Antwort-Pipeline ausgeführt wird. Es erkennt automatisch, wenn lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verständnis deaktiviert ist, erhalten Modelle die ursprünglichen Dateien/URLs wie gewohnt.

Anbieterspezifisches Medienverhalten wird von Vendor-Plugins registriert, während der
OpenClaw-Core die gemeinsame Konfiguration `tools.media`, die Fallback-Reihenfolge und die
Integration in die Antwort-Pipeline verwaltet.

## Ziele

- Optional: eingehende Medien vorab in kurzen Text umwandeln, für schnelleres Routing + besseres Parsen von Befehlen.
- Ursprüngliche Medienzustellung an das Modell beibehalten (immer).
- **Provider-APIs** und **CLI-Fallbacks** unterstützen.
- Mehrere Modelle mit geordnetem Fallback zulassen (Fehler/Größe/Timeout).

## Verhalten auf hoher Ebene

1. Eingehende Anhänge sammeln (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Für jede aktivierte Capability (Bild/Audio/Video) Anhänge gemäß Richtlinie auswählen (Standard: **erste**).
3. Den ersten geeigneten Modelleintrag auswählen (Größe + Capability + Auth).
4. Wenn ein Modell fehlschlägt oder das Medium zu groß ist, **auf den nächsten Eintrag zurückfallen**.
5. Bei Erfolg:
   - `Body` wird zu einem Block `[Image]`, `[Audio]` oder `[Video]`.
   - Audio setzt `{{Transcript}}`; das Parsen von Befehlen verwendet den Caption-Text, wenn vorhanden,
     andernfalls das Transcript.
   - Captions bleiben als `User text:` innerhalb des Blocks erhalten.

Wenn das Verständnis fehlschlägt oder deaktiviert ist, **läuft der Antwortfluss weiter** mit dem ursprünglichen Body + Anhängen.

## Überblick über die Konfiguration

`tools.media` unterstützt **gemeinsame Modelle** sowie Überschreibungen pro Capability:

- `tools.media.models`: gemeinsame Modellliste (verwenden Sie `capabilities` zur Begrenzung).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - Standards (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
  - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
  - Steuerung für Audio-Transcript-Echo (`echoTranscript`, Standard `false`; `echoFormat`)
  - optionale **Modellliste pro Capability `models`** (wird vor gemeinsamen Modellen bevorzugt)
  - `attachments`-Richtlinie (`mode`, `maxAttachments`, `prefer`)
  - `scope` (optionale Begrenzung nach Kanal/chatType/Sitzungsschlüssel)
- `tools.media.concurrency`: maximale gleichzeitige Capability-Läufe (Standard **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* gemeinsame Liste */
      ],
      image: {
        /* optionale Überschreibungen */
      },
      audio: {
        /* optionale Überschreibungen */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optionale Überschreibungen */
      },
    },
  },
}
```

### Modelleinträge

Jeder `models[]`-Eintrag kann **Provider** oder **CLI** sein:

```json5
{
  type: "provider", // Standard, wenn weggelassen
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Beschreibe das Bild in <= 500 Zeichen.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, wird für multimodale Einträge verwendet
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Lies das Medium unter {{MediaPath}} und beschreibe es in <= {{MaxChars}} Zeichen.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI-Templates können außerdem verwenden:

- `{{MediaDir}}` (Verzeichnis, das die Mediendatei enthält)
- `{{OutputDir}}` (temporäres Verzeichnis, das für diesen Lauf erstellt wird)
- `{{OutputBase}}` (Basispfad der temporären Datei, ohne Erweiterung)

## Standardwerte und Limits

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, befehlsfreundlich)
- `maxChars`: **nicht gesetzt** für Audio (vollständiges Transcript, sofern Sie kein Limit setzen)
- `maxBytes`:
  - Bild: **10MB**
  - Audio: **20MB**
  - Video: **50MB**

Regeln:

- Wenn das Medium `maxBytes` überschreitet, wird dieses Modell übersprungen und **das nächste Modell versucht**.
- Audiodateien kleiner als **1024 Bytes** werden als leer/beschädigt behandelt und vor Provider-/CLI-Transkription übersprungen.
- Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
- `prompt` verwendet standardmäßig ein einfaches „Beschreibe das {media}.“ plus die Anweisung zu `maxChars` (nur Bild/Video).
- Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw
  den Zusammenfassungsblock `[Image]` und übergibt stattdessen das ursprüngliche Bild an das
  Modell.
- Wenn ein primäres Gateway-/WebChat-Modell nur Text unterstützt, werden Bildanhänge
  als ausgelagerte Refs `media://inbound/*` beibehalten, damit die Bild-/PDF-Tools oder das
  konfigurierte Bildmodell sie weiterhin prüfen können, statt den Anhang zu verlieren.
- Explizite Anfragen `openclaw infer image describe --model <provider/model>` sind anders: Sie führen dieses bildfähige Provider-/Modell direkt aus, einschließlich
  Ollama-Refs wie `ollama/qwen2.5vl:7b`.
- Wenn `<capability>.enabled: true` ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das
  **aktive Antwortmodell**, wenn dessen Provider die Capability unterstützt.

### Medienverständnis automatisch erkennen (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine
Modelle konfiguriert haben, erkennt OpenClaw automatisch in dieser Reihenfolge und **stoppt bei der ersten
funktionierenden Option**:

1. **Aktives Antwortmodell**, wenn dessen Provider die Capability unterstützt.
2. Primäre/Fallback-Refs aus **`agents.defaults.imageModel`** (nur Bild).
3. **Lokale CLIs** (nur Audio; falls installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
4. **Gemini CLI** (`gemini`) mit `read_many_files`
5. **Provider-Auth**
   - Konfigurierte Einträge `models.providers.*`, die die Capability unterstützen, werden
     vor der gebündelten Fallback-Reihenfolge versucht.
   - Nur-Bild-Konfigurationsprovider mit einem bildfähigen Modell registrieren sich automatisch für
     Medienverständnis, selbst wenn sie kein gebündeltes Vendor-Plugin sind.
   - Ollama-Bildverständnis ist verfügbar, wenn es explizit ausgewählt wird, zum
     Beispiel über `agents.defaults.imageModel` oder
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Gebündelte Fallback-Reihenfolge:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
     - Bild: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Um die automatische Erkennung zu deaktivieren, setzen Sie:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Hinweis: Die Erkennung von Binärdateien erfolgt als Best-Effort auf macOS/Linux/Windows; stellen Sie sicher, dass sich die CLI im `PATH` befindet (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

### Unterstützung für Proxy-Umgebungen (Provider-Modelle)

Wenn providerbasiertes Medienverständnis für **Audio** und **Video** aktiviert ist, berücksichtigt OpenClaw
standardmäßige Umgebungsvariablen für ausgehende Proxys bei HTTP-Aufrufen an Provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, verwendet Medienverständnis direkte Egress-Verbindungen.
Wenn der Proxy-Wert fehlerhaft ist, protokolliert OpenClaw eine Warnung und greift auf direkte
Abrufe zurück.

## Capabilities (optional)

Wenn Sie `capabilities` setzen, läuft der Eintrag nur für diese Medientypen. Bei gemeinsamen
Listen kann OpenClaw Standardwerte ableiten:

- `openai`, `anthropic`, `minimax`: **Bild**
- `minimax-portal`: **Bild**
- `moonshot`: **Bild + Video**
- `openrouter`: **Bild**
- `google` (Gemini API): **Bild + Audio + Video**
- `qwen`: **Bild + Video**
- `mistral`: **Audio**
- `zai`: **Bild**
- `groq`: **Audio**
- `xai`: **Audio**
- `deepgram`: **Audio**
- Jeder Katalog `models.providers.<id>.models[]` mit einem bildfähigen Modell:
  **Bild**

Für CLI-Einträge **setzen Sie `capabilities` explizit**, um überraschende Treffer zu vermeiden.
Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste geeignet, in der er erscheint.

## Matrix der Provider-Unterstützung (OpenClaw-Integrationen)

| Capability | Provider-Integration                                                                                                         | Hinweise                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bild       | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurationsprovider | Vendor-Plugins registrieren Bildunterstützung; `openai-codex/*` verwendet OAuth-Provider-Logik; `codex/*` verwendet einen begrenzten Turn des Codex app-server; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurationsprovider registrieren sich automatisch. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Provider-Transkription (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                       |
| Video      | Google, Qwen, Moonshot                                                                                                       | Provider-Videoverständnis über Vendor-Plugins; Qwen-Videoverständnis verwendet die Standard-DashScope-Endpunkte.                                                                                                                           |

Hinweis zu MiniMax:

- Das Bildverständnis von `minimax` und `minimax-portal` stammt vom pluginverwalteten
  Medienprovider `MiniMax-VL-01`.
- Der gebündelte MiniMax-Textkatalog beginnt weiterhin nur mit Text; explizite
  Einträge `models.providers.minimax` materialisieren bildfähige M2.7-Chat-Refs.

## Leitlinien zur Modellauswahl

- Bevorzugen Sie für jede Medien-Capability das stärkste Modell der neuesten Generation, wenn Qualität und Sicherheit wichtig sind.
- Für Tool-aktivierte Agenten, die nicht vertrauenswürdige Eingaben verarbeiten, vermeiden Sie ältere/schwächere Medienmodelle.
- Halten Sie mindestens ein Fallback pro Capability für Verfügbarkeit bereit (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wurde); nicht-`txt`-Formate greifen auf stdout zurück.

## Anhangsrichtlinie

`attachments` pro Capability steuert, welche Anhänge verarbeitet werden:

- `mode`: `first` (Standard) oder `all`
- `maxAttachments`: begrenzt die Anzahl der verarbeiteten Anhänge (Standard **1**)
- `prefer`: `first`, `last`, `path`, `url`

Bei `mode: "all"` werden Ausgaben mit `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

Verhalten bei der Extraktion von Dateianhängen:

- Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** eingeschlossen, bevor er
  an den Medienprompt angehängt wird.
- Der eingefügte Block verwendet explizite Begrenzungsmarkierungen wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  Metadatenzeile `Source: External`.
- Dieser Pfad zur Extraktion von Anhängen lässt das lange Banner
  `SECURITY NOTICE:` bewusst weg, um den Medienprompt nicht unnötig aufzublähen; die Begrenzungs-
  markierungen und Metadaten bleiben dennoch erhalten.
- Wenn eine Datei keinen extrahierbaren Text hat, injiziert OpenClaw `[No extractable text]`.
- Wenn ein PDF in diesem Pfad auf gerenderte Seitenbilder zurückfällt, behält der Medienprompt
  den Platzhalter `[PDF content rendered to images; images not forwarded to model]` bei,
  weil dieser Schritt der Anhangsextraktion Textblöcke und nicht die gerenderten PDF-Bilder weitergibt.

## Konfigurationsbeispiele

### 1) Gemeinsame Modellliste + Überschreibungen

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Lies das Medium unter {{MediaPath}} und beschreibe es in <= {{MaxChars}} Zeichen.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Nur Audio + Video (Bild deaktiviert)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Lies das Medium unter {{MediaPath}} und beschreibe es in <= {{MaxChars}} Zeichen.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Optionales Bildverständnis

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Lies das Medium unter {{MediaPath}} und beschreibe es in <= {{MaxChars}} Zeichen.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Einzelner multimodaler Eintrag (explizite Capabilities)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Statusausgabe

Wenn Medienverständnis ausgeführt wird, enthält `/status` eine kurze Zusammenfassungszeile:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Dies zeigt Ergebnisse pro Capability und, wenn zutreffend, den gewählten Provider/das gewählte Modell.

## Hinweise

- Das Verständnis ist **Best Effort**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, auch wenn das Verständnis deaktiviert ist.
- Verwenden Sie `scope`, um zu begrenzen, wo das Verständnis ausgeführt wird (z. B. nur in DMs).

## Verwandte Dokumentation

- [Configuration](/de/gateway/configuration)
- [Image & Media Support](/de/nodes/images)
