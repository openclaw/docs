---
read_when:
    - Medienverständnis entwerfen oder refaktorieren
    - Eingehende Audio-/Video-/Bildvorverarbeitung abstimmen
sidebarTitle: Media understanding
summary: Eingehendes Verstehen von Bildern/Audio/Video (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-04-26T11:33:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw kann **eingehende Medien zusammenfassen** (Bild/Audio/Video), bevor die Antwort-Pipeline ausgeführt wird. Es erkennt automatisch, wenn lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verständnis deaktiviert ist, erhalten Modelle weiterhin wie gewohnt die Originaldateien/-URLs.

Anbieterspezifisches Medienverhalten wird von Vendor-Plugins registriert, während der OpenClaw-Core die gemeinsame `tools.media`-Konfiguration, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline besitzt.

## Ziele

- Optional: eingehende Medien in kurzen Text vorverdauen, für schnelleres Routing + besseres Parsen von Befehlen.
- Originale Medienzustellung an das Modell immer beibehalten.
- **Provider-APIs** und **CLI-Fallbacks** unterstützen.
- Mehrere Modelle mit geordnetem Fallback erlauben (Fehler/Größe/Timeout).

## Verhalten auf hoher Ebene

<Steps>
  <Step title="Anhänge sammeln">
    Eingehende Anhänge sammeln (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Pro Fähigkeit auswählen">
    Für jede aktivierte Fähigkeit (Bild/Audio/Video) Anhänge gemäß Richtlinie auswählen (Standard: **erste**).
  </Step>
  <Step title="Modell wählen">
    Den ersten geeigneten Modelleintrag wählen (Größe + Fähigkeit + Authentifizierung).
  </Step>
  <Step title="Bei Fehler zurückfallen">
    Wenn ein Modell fehlschlägt oder das Medium zu groß ist, **auf den nächsten Eintrag zurückfallen**.
  </Step>
  <Step title="Erfolgsblock anwenden">
    Bei Erfolg:

    - `Body` wird zu einem Block `[Image]`, `[Audio]` oder `[Video]`.
    - Bei Audio wird `{{Transcript}}` gesetzt; das Parsen von Befehlen verwendet den Beschriftungstext, wenn vorhanden, andernfalls das Transkript.
    - Beschriftungen bleiben als `User text:` innerhalb des Blocks erhalten.

  </Step>
</Steps>

Wenn das Verständnis fehlschlägt oder deaktiviert ist, wird **der Antwortfluss fortgesetzt** mit dem ursprünglichen Body + Anhängen.

## Konfigurationsüberblick

`tools.media` unterstützt **gemeinsame Modelle** plus Überschreibungen pro Fähigkeit:

<AccordionGroup>
  <Accordion title="Schlüssel auf oberster Ebene">
    - `tools.media.models`: gemeinsame Modellliste (mit `capabilities` als Gating).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - Standardwerte (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
      - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
      - Steuerelemente für Audio-Transkript-Echo (`echoTranscript`, Standard `false`; `echoFormat`)
      - optionale `models`-Liste **pro Fähigkeit** (bevorzugt vor gemeinsamen Modellen)
      - Richtlinie `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (optionales Gating nach Channel/chatType/Sitzungsschlüssel)
    - `tools.media.concurrency`: maximale gleichzeitige Fähigkeit-Läufe (Standard **2**).

  </Accordion>
</AccordionGroup>

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

<Tabs>
  <Tab title="Provider-Eintrag">
    ```json5
    {
      type: "provider", // Standard, wenn weggelassen
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Beschreibe das Bild in <= 500 Zeichen.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, verwendet für multimodale Einträge
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
    - `{{OutputDir}}` (Scratch-Verzeichnis, das für diesen Lauf erstellt wird)
    - `{{OutputBase}}` (Basis-Pfad der Scratch-Datei, ohne Erweiterung)

  </Tab>
</Tabs>

## Standardwerte und Limits

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, befehlsfreundlich)
- `maxChars`: **nicht gesetzt** für Audio (volles Transkript, sofern Sie kein Limit setzen)
- `maxBytes`:
  - Bild: **10 MB**
  - Audio: **20 MB**
  - Video: **50 MB**

<AccordionGroup>
  <Accordion title="Regeln">
    - Wenn Medien `maxBytes` überschreiten, wird dieses Modell übersprungen und **das nächste Modell versucht**.
    - Audiodateien kleiner als **1024 Bytes** werden als leer/beschädigt behandelt und vor Provider-/CLI-Transkription übersprungen; der eingehende Antwortkontext erhält ein deterministisches Platzhalter-Transkript, damit der Agent weiß, dass die Notiz zu klein war.
    - Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe abgeschnitten.
    - `prompt` ist standardmäßig ein einfaches „Beschreibe das {Medium}.“ plus die Anweisung zu `maxChars` (nur Bild/Video).
    - Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den Zusammenfassungsblock `[Image]` und gibt stattdessen das Originalbild an das Modell weiter.
    - Wenn ein primäres Gateway-/WebChat-Modell nur Text unterstützt, bleiben Bildanhänge als ausgelagerte Referenzen `media://inbound/*` erhalten, sodass die Bild-/PDF-Tools oder das konfigurierte Bildmodell sie weiterhin prüfen können, statt den Anhang zu verlieren.
    - Explizite Anfragen `openclaw infer image describe --model <provider/model>` sind etwas anderes: Sie führen dieses bildfähige Provider-/Modell direkt aus, einschließlich Ollama-Referenzen wie `ollama/qwen2.5vl:7b`.
    - Wenn `<capability>.enabled: true` gesetzt ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das **aktive Antwortmodell**, wenn dessen Provider die Fähigkeit unterstützt.

  </Accordion>
</AccordionGroup>

### Automatische Erkennung des Medienverständnisses (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine Modelle konfiguriert haben, erkennt OpenClaw in dieser Reihenfolge automatisch und **stoppt bei der ersten funktionierenden Option**:

<Steps>
  <Step title="Aktives Antwortmodell">
    Aktives Antwortmodell, wenn dessen Provider die Fähigkeit unterstützt.
  </Step>
  <Step title="agents.defaults.imageModel">
    Primäre/Fallback-Referenzen von `agents.defaults.imageModel` (nur Bild).
  </Step>
  <Step title="Lokale CLIs (nur Audio)">
    Lokale CLIs (falls installiert):

    - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
    - `whisper` (Python-CLI; lädt Modelle automatisch herunter)

  </Step>
  <Step title="Gemini CLI">
    `gemini` mit `read_many_files`.
  </Step>
  <Step title="Provider-Authentifizierung">
    - Konfigurierte Einträge `models.providers.*`, die die Fähigkeit unterstützen, werden vor der gebündelten Fallback-Reihenfolge versucht.
    - Nur-Bild-Konfigurationsprovider mit einem bildfähigen Modell werden automatisch für Medienverständnis registriert, auch wenn sie kein gebündeltes Vendor-Plugin sind.
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
Die Erkennung von Binärdateien erfolgt best-effort auf macOS/Linux/Windows; stellen Sie sicher, dass die CLI im `PATH` liegt (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.
</Note>

### Unterstützung für Proxy-Umgebungen (Provider-Modelle)

Wenn providerbasiertes **Audio**- und **Video**-Medienverständnis aktiviert ist, berücksichtigt OpenClaw Standard-Umgebungsvariablen für ausgehende Proxys bei HTTP-Aufrufen an Provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, verwendet Medienverständnis direkte ausgehende Verbindungen. Wenn der Proxy-Wert fehlerhaft ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Fähigkeiten (optional)

Wenn Sie `capabilities` setzen, wird der Eintrag nur für diese Medientypen ausgeführt. Für gemeinsame Listen kann OpenClaw Standardwerte ableiten:

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
- Jeder Katalog `models.providers.<id>.models[]` mit einem bildfähigen Modell: **Bild**

Für CLI-Einträge sollten Sie `capabilities` **explizit setzen**, um überraschende Treffer zu vermeiden. Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste geeignet, in der er erscheint.

## Provider-Unterstützungsmatrix (OpenClaw-Integrationen)

| Fähigkeit | Provider-Integration                                                                                                  | Hinweise                                                                                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bild       | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurationsprovider | Vendor-Plugins registrieren Bildunterstützung; `openai-codex/*` verwendet OAuth-Provider-Plumbing; `codex/*` verwendet einen begrenzten Codex-app-server-Turn; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurationsprovider registrieren sich automatisch. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                  | Provider-Transkription (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| Video      | Google, Qwen, Moonshot                                                                                                | Provider-Videoverständnis über Vendor-Plugins; Qwen-Videoverständnis verwendet die Standard-DashScope-Endpunkte.                                                                                                                        |

<Note>
**MiniMax-Hinweis**

- `minimax`- und `minimax-portal`-Bildverständnis stammt vom Plugin-eigenen Medienprovider `MiniMax-VL-01`.
- Der gebündelte MiniMax-Textkatalog beginnt weiterhin nur mit Text; explizite Einträge `models.providers.minimax` materialisieren bildfähige M2.7-Chat-Referenzen.

</Note>

## Leitfaden zur Modellauswahl

- Bevorzugen Sie für jede Medienfähigkeit das stärkste verfügbare Modell der neuesten Generation, wenn Qualität und Sicherheit wichtig sind.
- Für Tool-fähige Agenten, die mit nicht vertrauenswürdigen Eingaben arbeiten, sollten Sie ältere/schwächere Medienmodelle vermeiden.
- Halten Sie mindestens einen Fallback pro Fähigkeit für Verfügbarkeit vor (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wurde); nicht-`txt`-Formate fallen auf stdout zurück.

## Anhangsrichtlinie

`attachments` pro Fähigkeit steuert, welche Anhänge verarbeitet werden:

<ParamField path="mode" type='"first" | "all"' default="first">
  Ob der erste ausgewählte Anhang oder alle verarbeitet werden sollen.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Begrenzt die Anzahl der verarbeiteten Anhänge.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Auswahlpräferenz unter den Kandidaten-Anhängen.
</ParamField>

Wenn `mode: "all"` gesetzt ist, werden Ausgaben als `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

<AccordionGroup>
  <Accordion title="Verhalten bei der Extraktion von Dateianhängen">
    - Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er an den Medien-Prompt angehängt wird.
    - Der eingefügte Block verwendet explizite Begrenzungsmarker wie `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine Metadatenzeile `Source: External`.
    - Dieser Pfad zur Anhangsextraktion lässt absichtlich das lange Banner `SECURITY NOTICE:` weg, damit der Medien-Prompt nicht aufgebläht wird; die Begrenzungsmarker und Metadaten bleiben trotzdem erhalten.
    - Wenn eine Datei keinen extrahierbaren Text hat, fügt OpenClaw `[No extractable text]` ein.
    - Wenn ein PDF in diesem Pfad auf gerenderte Seitenbilder zurückfällt, behält der Medien-Prompt den Platzhalter `[PDF content rendered to images; images not forwarded to model]`, weil dieser Anhangsextraktionsschritt Textblöcke weiterleitet, nicht die gerenderten PDF-Bilder.

  </Accordion>
</AccordionGroup>

## Konfigurationsbeispiele

<Tabs>
  <Tab title="Gemeinsame Modelle + Überschreibungen">
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
                  "Lies das Medium unter {{MediaPath}} und beschreibe es in <= {{MaxChars}} Zeichen.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Nur Bild">
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
  </Tab>
  <Tab title="Multimodaler Einzeleintrag">
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

Diese zeigt Ergebnisse pro Fähigkeit und den gewählten Provider/das gewählte Modell, falls zutreffend.

## Hinweise

- Verständnis ist **best-effort**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, auch wenn das Verständnis deaktiviert ist.
- Verwenden Sie `scope`, um zu begrenzen, wo Verständnis ausgeführt wird (z. B. nur in DMs).

## Verwandt

- [Configuration](/de/gateway/configuration)
- [Image & media support](/de/nodes/images)
