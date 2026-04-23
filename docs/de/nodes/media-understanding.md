---
read_when:
    - Medienverständnis entwerfen oder überarbeiten
    - Vorverarbeitung für eingehendes Audio/Video/Bild optimieren
summary: Eingehendes Bild-/Audio-/Video-Verständnis (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-04-23T06:30:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Medienverständnis – eingehend (2026-01-17)

OpenClaw kann **eingehende Medien** (Bild/Audio/Video) zusammenfassen, bevor die Antwort-Pipeline läuft. Es erkennt automatisch, wenn lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verständnis ausgeschaltet ist, erhalten Modelle wie gewohnt weiterhin die ursprünglichen Dateien/URLs.

Anbieterspezifisches Medienverhalten wird von Anbieter-Plugins registriert, während der OpenClaw-Core die gemeinsame `tools.media`-Konfiguration, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline verwaltet.

## Ziele

- Optional: eingehende Medien vorverdauen zu kurzem Text für schnelleres Routing und besseres Befehlsparsing.
- Ursprüngliche Medienzustellung an das Modell erhalten (immer).
- **Provider-APIs** und **CLI-Fallbacks** unterstützen.
- Mehrere Modelle mit geordnetem Fallback erlauben (Fehler/Größe/Timeout).

## Verhalten auf hoher Ebene

1. Eingehende Anhänge sammeln (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Für jede aktivierte Capability (Bild/Audio/Video) Anhänge gemäß Richtlinie auswählen (Standard: **erstes**).
3. Den ersten zulässigen Modelleintrag wählen (Größe + Capability + Authentifizierung).
4. Wenn ein Modell fehlschlägt oder das Medium zu groß ist, **auf den nächsten Eintrag zurückfallen**.
5. Bei Erfolg:
   - `Body` wird zu einem `[Image]`-, `[Audio]`- oder `[Video]`-Block.
   - Audio setzt `{{Transcript}}`; beim Befehlsparsing wird vorhandener Caption-Text verwendet, andernfalls das Transkript.
   - Captions bleiben als `User text:` innerhalb des Blocks erhalten.

Wenn das Verständnis fehlschlägt oder deaktiviert ist, **läuft der Antwortfluss** mit dem ursprünglichen Body + Anhängen weiter.

## Konfigurationsübersicht

`tools.media` unterstützt **gemeinsame Modelle** plus überschreibungen pro Capability:

- `tools.media.models`: gemeinsame Modellliste (verwenden Sie `capabilities` zum Begrenzen).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - Standardwerte (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
  - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
  - Audio-Transkript-Echo-Steuerungen (`echoTranscript`, Standard `false`; `echoFormat`)
  - optionale **`models`-Liste pro Capability** (wird vor gemeinsamen Modellen bevorzugt)
  - `attachments`-Richtlinie (`mode`, `maxAttachments`, `prefer`)
  - `scope` (optionale Begrenzung nach Kanal/`chatType`/Sitzungsschlüssel)
- `tools.media.concurrency`: maximale Anzahl gleichzeitiger Capability-Läufe (Standard **2**).

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
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, für multimodale Einträge verwendet
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
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI-Templates können außerdem Folgendes verwenden:

- `{{MediaDir}}` (Verzeichnis mit der Mediendatei)
- `{{OutputDir}}` (Scratch-Verzeichnis, das für diesen Lauf erstellt wird)
- `{{OutputBase}}` (Scratch-Dateibasispfad, ohne Erweiterung)

## Standardwerte und Grenzen

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, befehlsfreundlich)
- `maxChars`: **nicht gesetzt** für Audio (volles Transkript, sofern Sie kein Limit setzen)
- `maxBytes`:
  - Bild: **10 MB**
  - Audio: **20 MB**
  - Video: **50 MB**

Regeln:

- Wenn ein Medium `maxBytes` überschreitet, wird dieses Modell übersprungen und **das nächste Modell versucht**.
- Audiodateien kleiner als **1024 Byte** werden als leer/beschädigt behandelt und vor der Provider-/CLI-Transkription übersprungen.
- Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
- `prompt` ist standardmäßig ein einfaches „Describe the {media}.“ plus der `maxChars`-Hinweis (nur Bild/Video).
- Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das Originalbild an das Modell.
- Explizite Anfragen wie `openclaw infer image describe --model <provider/model>` sind anders: Sie führen dieses bildfähige Provider-/Modellpaar direkt aus, einschließlich Ollama-Referenzen wie `ollama/qwen2.5vl:7b`.
- Wenn `<capability>.enabled: true` gesetzt ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das **aktive Antwortmodell**, wenn dessen Provider die Capability unterstützt.

### Automatische Erkennung von Medienverständnis (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine
Modelle konfiguriert haben, erkennt OpenClaw in dieser Reihenfolge automatisch und **stoppt bei der ersten funktionierenden Option**:

1. **Aktives Antwortmodell**, wenn dessen Provider die Capability unterstützt.
2. **`agents.defaults.imageModel`** Primär-/Fallback-Referenzen (nur Bild).
3. **Lokale CLIs** (nur Audio; falls installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
4. **Gemini CLI** (`gemini`) mit `read_many_files`
5. **Provider-Authentifizierung**
   - Konfigurierte Einträge in `models.providers.*`, die die Capability unterstützen, werden vor der gebündelten Fallback-Reihenfolge versucht.
   - Reine Bild-Konfigurationsprovider mit einem bildfähigen Modell werden automatisch für Medienverständnis registriert, auch wenn sie kein gebündeltes Anbieter-Plugin sind.
   - Ollama-Bildverständnis ist verfügbar, wenn es explizit ausgewählt wird, zum Beispiel über `agents.defaults.imageModel` oder `openclaw infer image describe --model ollama/<vision-model>`.
   - Gebündelte Fallback-Reihenfolge:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
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

Hinweis: Die Binärerkennung erfolgt best effort auf macOS/Linux/Windows; stellen Sie sicher, dass die CLI auf `PATH` liegt (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

### Unterstützung von Proxy-Umgebungsvariablen (Provider-Modelle)

Wenn providerbasiertes **Audio-** und **Video-**Medienverständnis aktiviert ist, berücksichtigt OpenClaw bei HTTP-Aufrufen zu Providern Standard-Proxy-Umgebungsvariablen für ausgehenden Datenverkehr:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, verwendet das Medienverständnis direkte ausgehende Verbindungen.
Wenn der Proxy-Wert fehlerhaft formatiert ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Capabilities (optional)

Wenn Sie `capabilities` setzen, läuft der Eintrag nur für diese Medientypen. Für gemeinsame
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
- Jeder `models.providers.<id>.models[]`-Katalog mit einem bildfähigen Modell:
  **Bild**

Für CLI-Einträge setzen Sie `capabilities` **explizit**, um überraschende Treffer zu vermeiden.
Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste zulässig, in der er erscheint.

## Provider-Unterstützungsmatrix (OpenClaw-Integrationen)

| Capability | Provider-Integration                                                                   | Hinweise                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Bild       | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurationsprovider | Anbieter-Plugins registrieren Bildunterstützung; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurationsprovider registrieren sich automatisch. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Provider-Transkription (Whisper/Deepgram/Gemini/Voxtral).                                                                                 |
| Video      | Google, Qwen, Moonshot                                                                 | Provider-Videoverständnis über Anbieter-Plugins; Qwen-Videoverständnis verwendet die Standard-DashScope-Endpunkte.                       |

MiniMax-Hinweis:

- `minimax`- und `minimax-portal`-Bildverständnis stammt vom Plugin-eigenen
  Medienprovider `MiniMax-VL-01`.
- Der gebündelte MiniMax-Textkatalog beginnt weiterhin nur mit Text; explizite
  `models.providers.minimax`-Einträge materialisieren bildfähige M2.7-Chat-Referenzen.

## Richtlinien zur Modellauswahl

- Bevorzugen Sie für jede Medien-Capability das stärkste verfügbare Modell der neuesten Generation, wenn Qualität und Sicherheit wichtig sind.
- Für Tool-fähige Agents, die mit nicht vertrauenswürdigen Eingaben arbeiten, vermeiden Sie ältere/schwächere Medienmodelle.
- Halten Sie mindestens ein Fallback pro Capability für Verfügbarkeit bereit (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wurde); Formate ungleich `txt` fallen auf stdout zurück.

## Anhangsrichtlinie

`attachments` pro Capability steuert, welche Anhänge verarbeitet werden:

- `mode`: `first` (Standard) oder `all`
- `maxAttachments`: begrenzt die Anzahl der verarbeiteten Anhänge (Standard **1**)
- `prefer`: `first`, `last`, `path`, `url`

Wenn `mode: "all"` gesetzt ist, werden Ausgaben als `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

Verhalten bei der Extraktion aus Dateianhängen:

- Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er an den Medien-Prompt angehängt wird.
- Der eingefügte Block verwendet explizite Begrenzungsmarker wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  Metadatenzeile `Source: External`.
- Dieser Pfad zur Anhangsextraktion lässt absichtlich das lange
  Banner `SECURITY NOTICE:` weg, um den Medien-Prompt nicht aufzublähen; die Begrenzungsmarker und Metadaten bleiben dennoch erhalten.
- Wenn eine Datei keinen extrahierbaren Text hat, fügt OpenClaw `[No extractable text]` ein.
- Wenn in diesem Pfad bei einem PDF auf gerenderte Seitenbilder zurückgefallen wird, behält der Medien-Prompt den Platzhalter `[PDF content rendered to images; images not forwarded to model]`, weil dieser Anhangsextraktionsschritt Textblöcke weitergibt, nicht die gerenderten PDF-Bilder.

## Konfigurationsbeispiele

### 1) Gemeinsame Modellliste + Überschreibungen

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
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

### 2) Nur Audio + Video (Bild aus)

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
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
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
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Ein einzelner multimodaler Eintrag (explizite Capabilities)

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
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Dies zeigt Ergebnisse pro Capability und, falls zutreffend, den gewählten Provider/das gewählte Modell.

## Hinweise

- Das Verständnis erfolgt **best effort**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, auch wenn das Verständnis deaktiviert ist.
- Verwenden Sie `scope`, um zu begrenzen, wo das Verständnis ausgeführt wird (z. B. nur in DMs).

## Verwandte Dokumente

- [Konfiguration](/de/gateway/configuration)
- [Bild- & Medienunterstützung](/de/nodes/images)
