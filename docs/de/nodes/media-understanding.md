---
read_when:
    - Medienverständnis konzipieren oder refaktorieren
    - Abstimmung der Vorverarbeitung eingehender Audio-, Video- und Bildinhalte
sidebarTitle: Media understanding
summary: Verständnis eingehender Bild-, Audio- und Videoinhalte (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-04-30T07:02:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kann **eingehende Medien zusammenfassen** (Bild/Audio/Video), bevor die Antwort-Pipeline läuft. Es erkennt automatisch, wann lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verständnis deaktiviert ist, erhalten Modelle weiterhin wie üblich die ursprünglichen Dateien/URLs.

Herstellerspezifisches Medienverhalten wird von Vendor-Plugins registriert, während OpenClaw Core die gemeinsame `tools.media`-Konfiguration, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline verwaltet.

## Ziele

- Optional: Eingehende Medien vorab zu kurzem Text verdichten, für schnelleres Routing und bessere Befehlsanalyse.
- Ursprüngliche Medienauslieferung an das Modell beibehalten (immer).
- **Provider-APIs** und **CLI-Fallbacks** unterstützen.
- Mehrere Modelle mit geordnetem Fallback erlauben (Fehler/Größe/Timeout).

## Allgemeines Verhalten

<Steps>
  <Step title="Anhänge sammeln">
    Eingehende Anhänge sammeln (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Nach Capability auswählen">
    Für jede aktivierte Capability (Bild/Audio/Video) Anhänge gemäß Richtlinie auswählen (Standard: **erster**).
  </Step>
  <Step title="Modell auswählen">
    Den ersten geeigneten Modelleintrag auswählen (Größe + Capability + Authentifizierung).
  </Step>
  <Step title="Fallback bei Fehler">
    Wenn ein Modell fehlschlägt oder das Medium zu groß ist, **auf den nächsten Eintrag zurückfallen**.
  </Step>
  <Step title="Erfolgsblock anwenden">
    Bei Erfolg:

    - `Body` wird zu einem `[Image]`-, `[Audio]`- oder `[Video]`-Block.
    - Audio setzt `{{Transcript}}`; die Befehlsanalyse verwendet, wenn vorhanden, den Beschriftungstext, andernfalls das Transkript.
    - Beschriftungen bleiben als `User text:` im Block erhalten.

  </Step>
</Steps>

Wenn das Verständnis fehlschlägt oder deaktiviert ist, **läuft der Antwortfluss weiter** mit dem ursprünglichen Body und den Anhängen.

## Konfigurationsübersicht

`tools.media` unterstützt **gemeinsame Modelle** plus Capability-spezifische Überschreibungen:

<AccordionGroup>
  <Accordion title="Schlüssel auf oberster Ebene">
    - `tools.media.models`: gemeinsame Modellliste (`capabilities` zum Eingrenzen verwenden).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - Standardwerte (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
      - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
      - Steuerelemente für Audio-Transkript-Echo (`echoTranscript`, Standard `false`; `echoFormat`)
      - optionale **Capability-spezifische `models`-Liste** (bevorzugt vor gemeinsamen Modellen)
      - `attachments`-Richtlinie (`mode`, `maxAttachments`, `prefer`)
      - `scope` (optionales Gating nach Kanal/chatType/Sitzungsschlüssel)
    - `tools.media.concurrency`: maximale gleichzeitige Capability-Läufe (Standard **2**).

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
  <Tab title="Provider-Eintrag">
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
  <Tab title="CLI-Eintrag">
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

    CLI-Templates können außerdem verwenden:

    - `{{MediaDir}}` (Verzeichnis, das die Mediendatei enthält)
    - `{{OutputDir}}` (für diesen Lauf erstelltes Scratch-Verzeichnis)
    - `{{OutputBase}}` (Basispfad der Scratch-Datei, ohne Erweiterung)

  </Tab>
</Tabs>

## Standardwerte und Limits

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, befehlsfreundlich)
- `maxChars`: **nicht gesetzt** für Audio (vollständiges Transkript, sofern Sie kein Limit setzen)
- `maxBytes`:
  - Bild: **10MB**
  - Audio: **20MB**
  - Video: **50MB**

<AccordionGroup>
  <Accordion title="Regeln">
    - Wenn Medien `maxBytes` überschreiten, wird dieses Modell übersprungen und das **nächste Modell wird versucht**.
    - Audiodateien kleiner als **1024 Byte** werden als leer/beschädigt behandelt und vor Provider-/CLI-Transkription übersprungen; der eingehende Antwortkontext erhält ein deterministisches Platzhalter-Transkript, damit der Agent weiß, dass die Notiz zu klein war.
    - Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
    - `prompt` ist standardmäßig ein einfaches "Describe the {media}." plus `maxChars`-Hinweis (nur Bild/Video).
    - Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das ursprüngliche Bild an das Modell.
    - Wenn ein Gateway-/WebChat-Primärmodell nur Text unterstützt, bleiben Bildanhänge als ausgelagerte `media://inbound/*`-Referenzen erhalten, sodass die Bild-/PDF-Tools oder das konfigurierte Bildmodell sie weiterhin prüfen können, statt den Anhang zu verlieren.
    - Explizite `openclaw infer image describe --model <provider/model>`-Anfragen sind anders: Sie führen dieses bildfähige Provider-/Modell direkt aus, einschließlich Ollama-Referenzen wie `ollama/qwen2.5vl:7b`.
    - Wenn `<capability>.enabled: true` gesetzt ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das **aktive Antwortmodell**, wenn dessen Provider die Capability unterstützt.

  </Accordion>
</AccordionGroup>

### Medienverständnis automatisch erkennen (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine Modelle konfiguriert haben, erkennt OpenClaw automatisch in dieser Reihenfolge und **stoppt bei der ersten funktionierenden Option**:

<Steps>
  <Step title="Aktives Antwortmodell">
    Aktives Antwortmodell, wenn dessen Provider die Capability unterstützt.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel`-Primär-/Fallback-Referenzen (nur Bild).
    `provider/model`-Referenzen bevorzugen. Bare-Referenzen werden nur dann aus konfigurierten bildfähigen Provider-Modelleinträgen qualifiziert, wenn die Übereinstimmung eindeutig ist.
  </Step>
  <Step title="Lokale CLIs (nur Audio)">
    Lokale CLIs (falls installiert):

    - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit Encoder/Decoder/Joiner/Tokens)
    - `whisper-cli` (`whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
    - `whisper` (Python-CLI; lädt Modelle automatisch herunter)

  </Step>
  <Step title="Gemini CLI">
    `gemini` mit `read_many_files`.
  </Step>
  <Step title="Provider-Authentifizierung">
    - Konfigurierte `models.providers.*`-Einträge, die die Capability unterstützen, werden vor der gebündelten Fallback-Reihenfolge versucht.
    - Nur für Bilder konfigurierte Provider mit einem bildfähigen Modell registrieren sich automatisch für Medienverständnis, selbst wenn sie kein gebündeltes Vendor-Plugin sind.
    - Ollama-Bildverständnis ist verfügbar, wenn es explizit ausgewählt wird, zum Beispiel über `agents.defaults.imageModel` oder `openclaw infer image describe --model ollama/<vision-model>`.

    Gebündelte Fallback-Reihenfolge:

    - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Bild: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

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

<Note>
Die Binärerkennung erfolgt bestmöglich unter macOS/Linux/Windows; stellen Sie sicher, dass die CLI in `PATH` liegt (wir erweitern `~`), oder legen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad fest.
</Note>

### Unterstützung für Proxy-Umgebungen (Provider-Modelle)

Wenn Provider-basiertes **Audio-** und **Video**-Medienverständnis aktiviert ist, berücksichtigt OpenClaw standardmäßige Umgebungsvariablen für ausgehende Proxys bei Provider-HTTP-Aufrufen:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, verwendet Medienverständnis direkten Egress. Wenn der Proxy-Wert fehlerhaft formatiert ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Capabilities (optional)

Wenn Sie `capabilities` setzen, läuft der Eintrag nur für diese Medientypen. Für gemeinsame Listen kann OpenClaw Standardwerte ableiten:

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
- Jeder `models.providers.<id>.models[]`-Katalog mit einem bildfähigen Modell: **Bild**

Für CLI-Einträge sollten Sie **`capabilities` explizit setzen**, um überraschende Zuordnungen zu vermeiden. Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste geeignet, in der er erscheint.

## Provider-Supportmatrix (OpenClaw-Integrationen)

| Capability | Provider-Integration                                                                                                         | Hinweise                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bild      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurations-Provider | Vendor-Plugins registrieren Bildunterstützung; `openai-codex/*` nutzt OAuth-Provider-Plumbing; `codex/*` nutzt einen begrenzten Codex app-server-Turn; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurations-Provider registrieren sich automatisch. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Provider-Transkription (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| Video      | Google, Qwen, Moonshot                                                                                                       | Provider-Videoverständnis über Vendor-Plugins; Qwen-Videoverständnis verwendet die Standard-DashScope-Endpunkte.                                                                                                                        |

<Note>
**MiniMax-Hinweis**

- `minimax`- und `minimax-portal`-Bildverständnis stammt vom Plugin-eigenen `MiniMax-VL-01`-Medien-Provider.
- Der gebündelte MiniMax-Textkatalog startet weiterhin text-only; explizite `models.providers.minimax`-Einträge materialisieren bildfähige M2.7-Chat-Referenzen.

</Note>

## Anleitung zur Modellauswahl

- Bevorzugen Sie für jede Medien-Capability das stärkste verfügbare Modell der neuesten Generation, wenn Qualität und Sicherheit wichtig sind.
- Vermeiden Sie bei toolfähigen Agenten, die nicht vertrauenswürdige Eingaben verarbeiten, ältere/schwächere Medienmodelle.
- Halten Sie pro Capability mindestens einen Fallback bereit, um die Verfügbarkeit zu sichern (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wurde); Nicht-`txt`-Formate fallen auf stdout zurück.

## Anhangsrichtlinie

Capability-spezifisches `attachments` steuert, welche Anhänge verarbeitet werden:

<ParamField path="mode" type='"first" | "all"' default="first">
  Ob der erste ausgewählte Anhang oder alle ausgewählten Anhänge verarbeitet werden sollen.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Begrenzt die Anzahl der verarbeiteten Anhänge.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Auswahlpräferenz unter den möglichen Anhängen.
</ParamField>

Bei `mode: "all"` werden Ausgaben mit `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

<AccordionGroup>
  <Accordion title="Verhalten beim Extrahieren von Dateianhängen">
    - Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er an den Medien-Prompt angehängt wird.
    - Der eingefügte Block verwendet explizite Begrenzungsmarker wie `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine Metadatenzeile `Source: External`.
    - Dieser Pfad zur Anhangsextraktion lässt das lange Banner `SECURITY NOTICE:` absichtlich aus, um den Medien-Prompt nicht aufzublähen; die Begrenzungsmarker und Metadaten bleiben dennoch erhalten.
    - Wenn eine Datei keinen extrahierbaren Text enthält, fügt OpenClaw `[No extractable text]` ein.
    - Wenn eine PDF in diesem Pfad auf gerenderte Seitenbilder zurückfällt, behält der Medien-Prompt den Platzhalter `[PDF content rendered to images; images not forwarded to model]` bei, weil dieser Schritt zur Anhangsextraktion Textblöcke weiterleitet, nicht die gerenderten PDF-Bilder.

  </Accordion>
</AccordionGroup>

## Konfigurationsbeispiele

<Tabs>
  <Tab title="Gemeinsam genutzte Modelle + Überschreibungen">
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
  <Tab title="Nur Audio + Video">
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
  <Tab title="Nur Bilder">
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
  <Tab title="Einzelner multimodaler Eintrag">
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

Dies zeigt die Ergebnisse pro Fähigkeit und gegebenenfalls den ausgewählten Provider/das ausgewählte Modell.

## Hinweise

- Das Verständnis erfolgt nach **bestem Bemühen**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, selbst wenn das Verständnis deaktiviert ist.
- Verwenden Sie `scope`, um einzuschränken, wo Verständnis ausgeführt wird (z. B. nur DMs).

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Bild- und Medienunterstützung](/de/nodes/images)
