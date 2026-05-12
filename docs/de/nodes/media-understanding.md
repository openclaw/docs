---
read_when:
    - Medienverständnis entwerfen oder refaktorieren
    - Optimierung der Vorverarbeitung eingehender Audio-, Video- und Bilddaten
sidebarTitle: Media understanding
summary: Verständnis eingehender Bilder, Audio- und Videodaten (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-05-12T08:45:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d58141ac1591890a4eb2c5cdcbc1bf19727fb0c3a1d4d0a912c6bb19d3f3592
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kann **eingehende Medien zusammenfassen** (Bild/Audio/Video), bevor die Antwort-Pipeline ausgeführt wird. Es erkennt automatisch, wann lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verstehen deaktiviert ist, erhalten Modelle die ursprünglichen Dateien/URLs weiterhin wie gewohnt.

Anbieterspezifisches Medienverhalten wird von Anbieter-Plugins registriert, während der OpenClaw-Kern die gemeinsame `tools.media`-Konfiguration, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline verwaltet.

## Ziele

- Optional: Eingehende Medien zu kurzem Text vorverarbeiten, um schnelleres Routing und bessere Befehlsanalyse zu ermöglichen.
- Ursprüngliche Medienübermittlung an das Modell beibehalten (immer).
- **Provider-APIs** und **CLI-Fallbacks** unterstützen.
- Mehrere Modelle mit geordnetem Fallback erlauben (Fehler/Größe/Timeout).

## Verhalten auf hoher Ebene

<Steps>
  <Step title="Collect attachments">
    Eingehende Anhänge erfassen (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Select per-capability">
    Für jede aktivierte Fähigkeit (Bild/Audio/Video) Anhänge gemäß Richtlinie auswählen (Standard: **erste**).
  </Step>
  <Step title="Choose model">
    Den ersten geeigneten Modelleintrag auswählen (Größe + Fähigkeit + Authentifizierung).
  </Step>
  <Step title="Fallback on failure">
    Wenn ein Modell fehlschlägt oder die Medien zu groß sind, **auf den nächsten Eintrag zurückfallen**.
  </Step>
  <Step title="Apply success block">
    Bei Erfolg:

    - `Body` wird zu einem `[Image]`-, `[Audio]`- oder `[Video]`-Block.
    - Audio setzt `{{Transcript}}`; die Befehlsanalyse verwendet vorhandenen Beschriftungstext, andernfalls das Transkript.
    - Beschriftungen werden als `User text:` innerhalb des Blocks beibehalten.

  </Step>
</Steps>

Wenn das Verstehen fehlschlägt oder deaktiviert ist, **läuft der Antwortfluss weiter** mit dem ursprünglichen Body und den Anhängen.

## Konfigurationsübersicht

`tools.media` unterstützt **gemeinsame Modelle** sowie fähigkeitsspezifische Überschreibungen:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: gemeinsame Modellliste (`capabilities` zum Einschränken verwenden).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - Standardwerte (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
      - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
      - Steuerung der Audio-Transkript-Wiedergabe (`echoTranscript`, Standard `false`; `echoFormat`)
      - optionale **fähigkeitsspezifische `models`-Liste** (vor gemeinsamen Modellen bevorzugt)
      - `attachments`-Richtlinie (`mode`, `maxAttachments`, `prefer`)
      - `scope` (optionale Einschränkung nach Kanal/chatType/Sitzungsschlüssel)
    - `tools.media.concurrency`: maximale parallele Fähigkeitsausführungen (Standard **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Modelleinträge

Jeder `models[]`-Eintrag kann **Provider** oder **CLI** sein:

<Tabs>
  <Tab title="Provider entry">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI entry">
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

    CLI-Templates können auch Folgendes verwenden:

    - `{{MediaDir}}` (Verzeichnis, das die Mediendatei enthält)
    - `{{OutputDir}}` (Scratch-Verzeichnis, das für diesen Lauf erstellt wird)
    - `{{OutputBase}}` (Basispfad der Scratch-Datei, ohne Erweiterung)

  </Tab>
</Tabs>

## Standardwerte und Grenzen

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, befehlsfreundlich)
- `maxChars`: **nicht gesetzt** für Audio (vollständiges Transkript, sofern Sie kein Limit setzen)
- `maxBytes`:
  - Bild: **10MB**
  - Audio: **20MB**
  - Video: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - Wenn Medien `maxBytes` überschreiten, wird dieses Modell übersprungen und das **nächste Modell versucht**.
    - Audiodateien kleiner als **1024 Bytes** werden als leer/beschädigt behandelt und vor Provider-/CLI-Transkription übersprungen; der eingehende Antwortkontext erhält ein deterministisches Platzhaltertranskript, damit der Agent weiß, dass die Notiz zu klein war.
    - Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
    - `prompt` ist standardmäßig ein einfaches "Describe the {media}." plus `maxChars`-Hinweis (nur Bild/Video).
    - Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das ursprüngliche Bild an das Modell.
    - Wenn ein primäres Gateway-/WebChat-Modell nur Text unterstützt, werden Bildanhänge als ausgelagerte `media://inbound/*`-Referenzen beibehalten, sodass die Bild-/PDF-Tools oder das konfigurierte Bildmodell sie weiterhin prüfen können, statt den Anhang zu verlieren.
    - Explizite `openclaw infer image describe --model <provider/model>`-Anfragen sind anders: Sie führen dieses bildfähige Provider-/Modell direkt aus, einschließlich Ollama-Referenzen wie `ollama/qwen2.5vl:7b`.
    - Wenn `<capability>.enabled: true` gesetzt ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das **aktive Antwortmodell**, wenn dessen Provider die Fähigkeit unterstützt.

  </Accordion>
</AccordionGroup>

### Medienverstehen automatisch erkennen (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine Modelle konfiguriert haben, erkennt OpenClaw automatisch in dieser Reihenfolge und **stoppt bei der ersten funktionierenden Option**:

<Steps>
  <Step title="Active reply model">
    Aktives Antwortmodell, wenn dessen Provider die Fähigkeit unterstützt.
  </Step>
  <Step title="agents.defaults.imageModel">
    Primäre/Fallback-Referenzen von `agents.defaults.imageModel` (nur Bild).
    `provider/model`-Referenzen bevorzugen. Einfache Referenzen werden nur dann aus konfigurierten bildfähigen Provider-Modelleinträgen qualifiziert, wenn die Übereinstimmung eindeutig ist.
  </Step>
  <Step title="Local CLIs (audio only)">
    Lokale CLIs (falls installiert):

    - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit Encoder/Decoder/Joiner/Tokens)
    - `whisper-cli` (`whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
    - `whisper` (Python-CLI; lädt Modelle automatisch herunter)

  </Step>
  <Step title="Gemini CLI">
    `gemini` mit `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - Konfigurierte `models.providers.*`-Einträge, die die Fähigkeit unterstützen, werden vor der gebündelten Fallback-Reihenfolge versucht.
    - Reine Bild-Konfigurations-Provider mit einem bildfähigen Modell werden automatisch für Medienverstehen registriert, selbst wenn sie kein gebündeltes Anbieter-Plugin sind.
    - Ollama-Bildverstehen ist verfügbar, wenn es explizit ausgewählt wird, zum Beispiel über `agents.defaults.imageModel` oder `openclaw infer image describe --model ollama/<vision-model>`.

    Gebündelte Fallback-Reihenfolge:

    - Audio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Bild: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

Um automatische Erkennung zu deaktivieren, setzen Sie:

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

<Note>
Binärerkennung ist unter macOS/Linux/Windows Best Effort; stellen Sie sicher, dass sich die CLI auf `PATH` befindet (wir expandieren `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.
</Note>

### Unterstützung für Proxy-Umgebungen (Provider-Modelle)

Wenn Provider-basiertes **Audio**- und **Video**-Medienverstehen aktiviert ist, berücksichtigt OpenClaw standardmäßige ausgehende Proxy-Umgebungsvariablen für Provider-HTTP-Aufrufe:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, nutzt Medienverstehen direkten ausgehenden Zugriff. Wenn der Proxy-Wert fehlerhaft formatiert ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Fähigkeiten (optional)

Wenn Sie `capabilities` setzen, läuft der Eintrag nur für diese Medientypen. Für gemeinsame Listen kann OpenClaw Standardwerte ableiten:

- `openai`, `anthropic`, `minimax`: **Bild**
- `minimax-portal`: **Bild**
- `moonshot`: **Bild + Video**
- `openrouter`: **Bild + Audio**
- `google` (Gemini API): **Bild + Audio + Video**
- `qwen`: **Bild + Video**
- `mistral`: **Audio**
- `zai`: **Bild**
- `groq`: **Audio**
- `xai`: **Audio**
- `deepgram`: **Audio**
- Beliebiger `models.providers.<id>.models[]`-Katalog mit einem bildfähigen Modell: **Bild**

Für CLI-Einträge: **setzen Sie `capabilities` explizit**, um überraschende Zuordnungen zu vermeiden. Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste geeignet, in der er erscheint.

## Provider-Unterstützungsmatrix (OpenClaw-Integrationen)

| Fähigkeit | Provider-Integration                                                                                                         | Hinweise                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bild      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurations-Provider | Anbieter-Plugins registrieren Bildunterstützung; `openai-codex/*` nutzt OAuth-Provider-Verkabelung; `codex/*` nutzt einen begrenzten Codex app-server-Turn; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurations-Provider registrieren sich automatisch. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Provider-Transkription (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                     |
| Video      | Google, Qwen, Moonshot                                                                                                       | Provider-Videoverstehen über Anbieter-Plugins; Qwen-Videoverstehen verwendet die Standard-DashScope-Endpunkte.                                                                                                                        |

<Note>
**MiniMax-Hinweis**

- `minimax`- und `minimax-portal`-Bildverstehen stammt vom Plugin-eigenen `MiniMax-VL-01`-Medien-Provider.
- Der gebündelte MiniMax-Textkatalog beginnt weiterhin nur mit Text; explizite `models.providers.minimax`-Einträge materialisieren bildfähige M2.7-Chat-Referenzen.

</Note>

## Anleitung zur Modellauswahl

- Bevorzugen Sie für jede Medienfähigkeit das stärkste verfügbare Modell der neuesten Generation, wenn Qualität und Sicherheit wichtig sind.
- Für toolfähige Agenten, die nicht vertrauenswürdige Eingaben verarbeiten, vermeiden Sie ältere/schwächere Medienmodelle.
- Behalten Sie mindestens einen Fallback pro Fähigkeit für Verfügbarkeit bei (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wurde); andere Formate als `txt` fallen auf stdout zurück.

## Anhangsrichtlinie

Fähigkeitsspezifisches `attachments` steuert, welche Anhänge verarbeitet werden:

<ParamField path="mode" type='"first" | "all"' default="first">
  Ob der erste ausgewählte Anhang oder alle ausgewählten Anhänge verarbeitet werden.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Begrenzen Sie die Anzahl der verarbeiteten Anhänge.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Auswahlpräferenz unter den infrage kommenden Anhängen.
</ParamField>

Bei `mode: "all"` werden Ausgaben als `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er an den Medien-Prompt angehängt wird.
    - Der eingefügte Block verwendet explizite Begrenzungsmarker wie `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine Metadatenzeile `Source: External`.
    - Dieser Pfad zur Anhangsextraktion lässt das lange Banner `SECURITY NOTICE:` absichtlich weg, damit der Medien-Prompt nicht unnötig aufgebläht wird; die Begrenzungsmarker und Metadaten bleiben dennoch erhalten.
    - Wenn eine Datei keinen extrahierbaren Text enthält, fügt OpenClaw `[No extractable text]` ein.
    - Wenn ein PDF in diesem Pfad auf gerenderte Seitenbilder zurückfällt, behält der Medien-Prompt den Platzhalter `[PDF content rendered to images; images not forwarded to model]` bei, weil dieser Anhangsextraktionsschritt Textblöcke weiterleitet, nicht die gerenderten PDF-Bilder.

  </Accordion>
</AccordionGroup>

## Konfigurationsbeispiele

<Tabs>
  <Tab title="Shared models + overrides">
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
  </Tab>
  <Tab title="Audio + video only">
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
  </Tab>
  <Tab title="Image-only">
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
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Multi-modal single entry">
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
  </Tab>
</Tabs>

## Statusausgabe

Wenn Medienverständnis ausgeführt wird, enthält `/status` eine kurze Zusammenfassungszeile:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Dies zeigt Ergebnisse pro Fähigkeit sowie, falls zutreffend, den gewählten Provider bzw. das gewählte Modell.

## Hinweise

- Verständnis erfolgt nach dem **Best-Effort-Prinzip**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, auch wenn Verständnis deaktiviert ist.
- Verwenden Sie `scope`, um einzuschränken, wo Verständnis ausgeführt wird, z. B. nur in DMs.

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Bild- und Medienunterstützung](/de/nodes/images)
