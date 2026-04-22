---
read_when:
    - Entwerfen oder Refaktorieren des Medienverständnisses
    - Optimieren der Vorverarbeitung eingehender Audio-/Video-/Bilder
summary: Verstehen eingehender Bilder/Audios/Videos (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-04-22T04:23:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d80c9bcd965b521c3c782a76b9dd31eb6e6c635d8a1cc6895b6ccfaf5f9492e
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Medienverständnis – eingehend (2026-01-17)

OpenClaw kann **eingehende Medien** (Bild/Audio/Video) zusammenfassen, bevor die Antwort-Pipeline ausgeführt wird. Es erkennt automatisch, wenn lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verständnis deaktiviert ist, erhalten Modelle weiterhin wie gewohnt die Originaldateien/-URLs.

Anbieterspezifisches Medienverhalten wird von Anbieter-Plugins registriert, während der OpenClaw-Core die gemeinsame Konfiguration `tools.media`, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline besitzt.

## Ziele

- Optional: eingehende Medien vorab in kurzen Text zusammenfassen für schnelleres Routing + besseres Command-Parsing.
- Ursprüngliche Medienzustellung an das Modell erhalten (immer).
- **Provider-APIs** und **CLI-Fallbacks** unterstützen.
- Mehrere Modelle mit geordnetem Fallback zulassen (Fehler/Größe/Timeout).

## Verhalten auf hoher Ebene

1. Eingehende Anhänge sammeln (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Für jede aktivierte Fähigkeit (Bild/Audio/Video) Anhänge gemäß Richtlinie auswählen (Standard: **erster**).
3. Den ersten geeigneten Modelleintrag wählen (Größe + Fähigkeit + Auth).
4. Wenn ein Modell fehlschlägt oder die Medien zu groß sind, **zum nächsten Eintrag zurückfallen**.
5. Bei Erfolg:
   - `Body` wird zu einem `[Image]`-, `[Audio]`- oder `[Video]`-Block.
   - Audio setzt `{{Transcript}}`; Command-Parsing verwendet vorhandenen Caption-Text,
     andernfalls das Transkript.
   - Captions bleiben als `User text:` innerhalb des Blocks erhalten.

Wenn das Verständnis fehlschlägt oder deaktiviert ist, **läuft der Antwortfluss weiter** mit dem ursprünglichen Body + Anhängen.

## Konfigurationsübersicht

`tools.media` unterstützt **gemeinsame Modelle** sowie Überschreibungen pro Fähigkeit:

- `tools.media.models`: gemeinsame Modellliste (verwende `capabilities` zum Gating).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - Standards (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
  - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
  - Echo-Steuerungen für Audio-Transkripte (`echoTranscript`, Standard `false`; `echoFormat`)
  - optionale **`models`-Liste pro Fähigkeit** (wird vor gemeinsamen Modellen bevorzugt)
  - Richtlinie für `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (optionales Gating nach Kanal/`chatType`/Sitzungsschlüssel)
- `tools.media.concurrency`: maximal gleichzeitige Fähigkeitsausführungen (Standard **2**).

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
    "Lies die Medien unter {{MediaPath}} und beschreibe sie in <= {{MaxChars}} Zeichen.",
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
- `{{OutputBase}}` (Scratch-Dateibasispfad ohne Erweiterung)

## Standards und Grenzen

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, Command-freundlich)
- `maxChars`: **nicht gesetzt** für Audio (volles Transkript, außer du setzt eine Grenze)
- `maxBytes`:
  - Bild: **10MB**
  - Audio: **20MB**
  - Video: **50MB**

Regeln:

- Wenn Medien `maxBytes` überschreiten, wird dieses Modell übersprungen und **das nächste Modell versucht**.
- Audiodateien kleiner als **1024 Bytes** werden als leer/beschädigt behandelt und vor der Provider-/CLI-Transkription übersprungen.
- Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
- `prompt` verwendet standardmäßig ein einfaches „Beschreibe das {media}.“ plus die `maxChars`-Hinweise (nur Bild/Video).
- Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den Zusammenfassungsblock `[Image]` und übergibt stattdessen das Originalbild an das Modell.
- Explizite Anfragen `openclaw infer image describe --model <provider/model>` sind anders: Sie führen dieses bildfähige Provider-/Modell direkt aus, einschließlich Ollama-Referenzen wie `ollama/qwen2.5vl:7b`.
- Wenn `<capability>.enabled: true` gesetzt ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das **aktive Antwortmodell**, wenn dessen Provider die Fähigkeit unterstützt.

### Medienverständnis automatisch erkennen (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und du keine Modelle konfiguriert hast, erkennt OpenClaw automatisch in dieser Reihenfolge und **stoppt bei der ersten funktionierenden Option**:

1. **Aktives Antwortmodell**, wenn sein Provider die Fähigkeit unterstützt.
2. Primäre/Fallback-Referenzen von **`agents.defaults.imageModel`** (nur Bild).
3. **Lokale CLIs** (nur Audio; falls installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
4. **Gemini CLI** (`gemini`) mit `read_many_files`
5. **Provider-Auth**
   - Konfigurierte Einträge `models.providers.*`, die die Fähigkeit unterstützen, werden vor der gebündelten Fallback-Reihenfolge versucht.
   - Reine Bild-Konfigurations-Provider mit einem bildfähigen Modell registrieren sich automatisch für Medienverständnis, auch wenn sie kein gebündeltes Anbieter-Plugin sind.
   - Ollama-Bildverständnis ist verfügbar, wenn es explizit ausgewählt wird, zum Beispiel über `agents.defaults.imageModel` oder `openclaw infer image describe --model ollama/<vision-model>`.
   - Gebündelte Fallback-Reihenfolge:
     - Audio: OpenAI → Groq → Deepgram → Google → Mistral
     - Bild: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Um die automatische Erkennung zu deaktivieren, setze:

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

Hinweis: Binärerkennung erfolgt best effort unter macOS/Linux/Windows; stelle sicher, dass die CLI auf `PATH` liegt (wir erweitern `~`), oder setze ein explizites CLI-Modell mit vollständigem Befehlspfad.

### Unterstützung von Proxy-Umgebungsvariablen (Provider-Modelle)

Wenn providerbasiertes Medienverständnis für **Audio** und **Video** aktiviert ist, berücksichtigt OpenClaw für HTTP-Aufrufe an den Provider die standardmäßigen Proxy-Umgebungsvariablen für ausgehenden Traffic:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, verwendet Medienverständnis direkte ausgehende Verbindungen.
Wenn der Proxy-Wert fehlerhaft formatiert ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Fähigkeiten (optional)

Wenn du `capabilities` setzt, wird der Eintrag nur für diese Medientypen ausgeführt. Für gemeinsame Listen kann OpenClaw Standards ableiten:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Jeder Katalog `models.providers.<id>.models[]` mit einem bildfähigen Modell:
  **image**

Für CLI-Einträge **setze `capabilities` explizit**, um überraschende Treffer zu vermeiden.
Wenn du `capabilities` weglässt, ist der Eintrag für die Liste geeignet, in der er erscheint.

## Matrix der Provider-Unterstützung (OpenClaw-Integrationen)

| Fähigkeit | Provider-Integration                                                                  | Hinweise                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Bild       | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurations-Provider | Anbieter-Plugins registrieren Bildunterstützung; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurations-Provider registrieren sich automatisch. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                               | Provider-Transkription (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Video      | Google, Qwen, Moonshot                                                                | Provider-Videoverständnis über Anbieter-Plugins; Qwen-Videoverständnis verwendet die Standard-DashScope-Endpunkte.                      |

Hinweis zu MiniMax:

- `minimax`- und `minimax-portal`-Bildverständnis kommt vom Plugin-eigenen Medien-Provider `MiniMax-VL-01`.
- Der gebündelte MiniMax-Textkatalog bleibt anfangs rein textbasiert; explizite Einträge `models.providers.minimax` materialisieren bildfähige M2.7-Chat-Referenzen.

## Hinweise zur Modellauswahl

- Bevorzuge für jede Medienfähigkeit das stärkste verfügbare Modell der neuesten Generation, wenn Qualität und Sicherheit wichtig sind.
- Für Tool-aktivierte Agents, die mit nicht vertrauenswürdigen Eingaben umgehen, vermeide ältere/schwächere Medienmodelle.
- Halte mindestens einen Fallback pro Fähigkeit bereit, um Verfügbarkeit sicherzustellen (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wurde); Formate ungleich `txt` fallen auf stdout zurück.

## Anhangsrichtlinie

`attachments` pro Fähigkeit steuert, welche Anhänge verarbeitet werden:

- `mode`: `first` (Standard) oder `all`
- `maxAttachments`: begrenzt die Anzahl der verarbeiteten Anhänge (Standard **1**)
- `prefer`: `first`, `last`, `path`, `url`

Wenn `mode: "all"` gesetzt ist, werden Ausgaben als `[Image 1/2]`, `[Audio 2/2]` usw. gekennzeichnet.

Verhalten bei der Extraktion von Dateianhängen:

- Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er an den Medien-Prompt angehängt wird.
- Der injizierte Block verwendet explizite Begrenzungsmarker wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  Metadatenzeile `Source: External`.
- Dieser Pfad zur Extraktion von Anhängen lässt das lange Banner
  `SECURITY NOTICE:` absichtlich weg, um den Medien-Prompt nicht aufzublähen; die Begrenzungsmarker und Metadaten bleiben dennoch erhalten.
- Wenn eine Datei keinen extrahierbaren Text hat, injiziert OpenClaw `[No extractable text]`.
- Wenn ein PDF in diesem Pfad auf gerenderte Seitenbilder zurückfällt, behält der Medien-Prompt den Platzhalter `[PDF content rendered to images; images not forwarded to model]` bei, weil dieser Schritt zur Extraktion von Anhängen Textblöcke weiterleitet, nicht die gerenderten PDF-Bilder.

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
            "Lies die Medien unter {{MediaPath}} und beschreibe sie in <= {{MaxChars}} Zeichen.",
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
              "Lies die Medien unter {{MediaPath}} und beschreibe sie in <= {{MaxChars}} Zeichen.",
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
              "Lies die Medien unter {{MediaPath}} und beschreibe sie in <= {{MaxChars}} Zeichen.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Einzelner multimodaler Eintrag (explizite Fähigkeiten)

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
📎 Medien: Bild ok (openai/gpt-5.4-mini) · Audio übersprungen (maxBytes)
```

Dies zeigt Ergebnisse pro Fähigkeit und, falls zutreffend, den gewählten Provider/das gewählte Modell.

## Hinweise

- Das Verständnis erfolgt nach dem Prinzip **best effort**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, auch wenn das Verständnis deaktiviert ist.
- Verwende `scope`, um einzuschränken, wo Verständnis ausgeführt wird (z. B. nur DMs).

## Verwandte Docs

- [Konfiguration](/de/gateway/configuration)
- [Bild- & Medienunterstützung](/de/nodes/images)
