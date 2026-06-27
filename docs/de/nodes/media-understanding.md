---
read_when:
    - Medienverständnis entwerfen oder refaktorieren
    - Optimierung der Vorverarbeitung eingehender Audio-, Video- und Bilddaten
sidebarTitle: Media understanding
summary: Eingehendes Bild-/Audio-/Video-Verständnis (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-06-27T17:40:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kann **eingehende Medien zusammenfassen** (Bild/Audio/Video), bevor die Antwort-Pipeline ausgeführt wird. Es erkennt automatisch, wenn lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verstehen deaktiviert ist, erhalten Modelle weiterhin wie gewohnt die Originaldateien/URLs.

Anbieterspezifisches Medienverhalten wird von Vendor-Plugins registriert, während der OpenClaw-Kern die gemeinsame `tools.media`-Konfiguration, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline besitzt.

## Ziele

- Optional: Eingehende Medien für schnelleres Routing + bessere Befehlsanalyse vorab in kurzen Text verdichten.
- Ursprüngliche Medienauslieferung an das Modell beibehalten (immer).
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
    Den ersten geeigneten Modelleintrag auswählen (Größe + Fähigkeit + Authentifizierung).
  </Step>
  <Step title="Fallback bei Fehler">
    Wenn ein Modell fehlschlägt oder die Medien zu groß sind, **auf den nächsten Eintrag zurückfallen**.
  </Step>
  <Step title="Erfolgsblock anwenden">
    Bei Erfolg:

    - `Body` wird zum Block `[Image]`, `[Audio]` oder `[Video]`.
    - Audio setzt `{{Transcript}}`; die Befehlsanalyse verwendet vorhandenen Beschriftungstext, andernfalls das Transkript.
    - Beschriftungen werden als `User text:` innerhalb des Blocks beibehalten.

  </Step>
</Steps>

Wenn das Verstehen fehlschlägt oder deaktiviert ist, **läuft der Antwortfluss weiter** mit ursprünglichem Body + Anhängen.

## Konfigurationsübersicht

`tools.media` unterstützt **gemeinsam genutzte Modelle** plus überschreibende Einstellungen pro Fähigkeit:

<AccordionGroup>
  <Accordion title="Schlüssel auf oberster Ebene">
    - `tools.media.models`: gemeinsam genutzte Modellliste (`capabilities` zum Einschränken verwenden).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - Standardwerte (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
      - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
      - Steuerung der Audio-Transkript-Wiedergabe (`echoTranscript`, Standard `false`; `echoFormat`)
      - optionale **`models`-Liste pro Fähigkeit** (wird vor gemeinsam genutzten Modellen bevorzugt)
      - Anhänge-Richtlinie (`mode`, `maxAttachments`, `prefer`)
      - `scope` (optionale Einschränkung nach Channel/chatType/Sitzungsschlüssel)
    - `tools.media.concurrency`: maximale gleichzeitige Fähigkeitsläufe (Standard **2**).

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

    CLI-Vorlagen können außerdem verwenden:

    - `{{MediaDir}}` (Verzeichnis, das die Mediendatei enthält)
    - `{{OutputDir}}` (für diesen Lauf erstelltes Scratch-Verzeichnis)
    - `{{OutputBase}}` (Basis-Pfad der Scratch-Datei, ohne Erweiterung)

  </Tab>
</Tabs>

### Provider-Zugangsdaten (`apiKey`)

Provider-basiertes Medienverstehen verwendet dieselbe Provider-Auth-Auflösung wie normale
Modellaufrufe: Auth-Profile, Umgebungsvariablen, dann
`models.providers.<providerId>.apiKey`.

`tools.media.*.models[]`-Einträge akzeptieren kein Inline-Feld `apiKey`. Der
`provider`-Wert in einem Medienmodelleintrag, etwa `openai` oder `moonshot`, muss
Zugangsdaten über eine der Standardquellen für Provider-Auth verfügbar haben.

Minimalbeispiel:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Die vollständige Provider-Auth-Referenz, einschließlich Profilen, Umgebungsvariablen
und benutzerdefinierten Basis-URLs, finden Sie unter [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

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
    - Wenn Medien `maxBytes` überschreiten, wird dieses Modell übersprungen und das **nächste Modell ausprobiert**.
    - Audiodateien unter **1024 Byte** werden als leer/beschädigt behandelt und vor Provider-/CLI-Transkription übersprungen; der eingehende Antwortkontext erhält ein deterministisches Platzhaltertranskript, damit der Agent weiß, dass die Notiz zu klein war.
    - Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
    - `prompt` verwendet standardmäßig ein einfaches „Describe the {media}.“ plus die `maxChars`-Vorgabe (nur Bild/Video).
    - Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das Originalbild an das Modell.
    - Wenn ein primäres Gateway-/WebChat-Modell nur Text unterstützt, bleiben Bildanhänge als ausgelagerte `media://inbound/*`-Refs erhalten, damit die Bild-/PDF-Tools oder das konfigurierte Bildmodell sie weiterhin prüfen können, statt den Anhang zu verlieren.
    - Explizite `openclaw infer image describe --model <provider/model>`-Anfragen sind anders: Sie führen diesen bildfähigen Provider/dieses bildfähige Modell direkt aus, einschließlich Ollama-Refs wie `ollama/qwen2.5vl:7b`.
    - Wenn `<capability>.enabled: true` ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das **aktive Antwortmodell**, wenn dessen Provider die Fähigkeit unterstützt.

  </Accordion>
</AccordionGroup>

### Medienverstehen automatisch erkennen (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine Modelle konfiguriert haben, erkennt OpenClaw automatisch in dieser Reihenfolge und **stoppt bei der ersten funktionierenden Option**:

<Steps>
  <Step title="Aktives Antwortmodell">
    Aktives Antwortmodell, wenn dessen Provider die Fähigkeit unterstützt.
  </Step>
  <Step title="agents.defaults.imageModel">
    Primäre/Fallback-Refs von `agents.defaults.imageModel` (nur Bild).
    `provider/model`-Refs bevorzugen. Bloße Refs werden nur dann aus konfigurierten bildfähigen Provider-Modelleinträgen qualifiziert, wenn die Übereinstimmung eindeutig ist.
  </Step>
  <Step title="Lokale CLIs (nur Audio)">
    Lokale CLIs (falls installiert):

    - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte tiny-Modell)
    - `whisper` (Python-CLI; lädt Modelle automatisch herunter)

  </Step>
  <Step title="Gemini-CLI">
    `gemini` mit `read_many_files`.
  </Step>
  <Step title="Provider-Auth">
    - Konfigurierte `models.providers.*`-Einträge, die die Fähigkeit unterstützen, werden vor der gebündelten Fallback-Reihenfolge ausprobiert.
    - Reine Bild-Konfigurationsprovider mit einem bildfähigen Modell registrieren sich automatisch für Medienverstehen, auch wenn sie kein gebündeltes Vendor-Plugin sind.
    - Ollama-Bildverstehen ist verfügbar, wenn es explizit ausgewählt wird, zum Beispiel über `agents.defaults.imageModel` oder `openclaw infer image describe --model ollama/<vision-model>`.

    Gebündelte Fallback-Reihenfolge:

    - Audio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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
Binärerkennung ist unter macOS/Linux/Windows Best-Effort; stellen Sie sicher, dass die CLI auf `PATH` liegt (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.
</Note>

### Proxy-Umgebungsunterstützung (Provider-Modelle)

Wenn Provider-basiertes **Audio**- und **Video**-Medienverstehen aktiviert ist, berücksichtigt OpenClaw standardmäßige ausgehende Proxy-Umgebungsvariablen für Provider-HTTP-Aufrufe:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, verwendet Medienverstehen direkten ausgehenden Zugriff. Wenn der Proxy-Wert fehlerhaft formatiert ist, protokolliert OpenClaw eine Warnung und fällt auf direktes Abrufen zurück.

## Fähigkeiten (optional)

Wenn Sie `capabilities` setzen, läuft der Eintrag nur für diese Medientypen. Für gemeinsam genutzte Listen kann OpenClaw Standardwerte ableiten:

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

Für CLI-Einträge sollten Sie **`capabilities` explizit setzen**, um überraschende Treffer zu vermeiden. Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste geeignet, in der er erscheint.

## Provider-Unterstützungsmatrix (OpenClaw-Integrationen)

| Fähigkeit | Provider-Integration                                                                                                         | Hinweise                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bild      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurationsprovider | Vendor-Plugins registrieren Bildunterstützung; `openai/*` kann API-Schlüssel- oder Codex-OAuth-Routing verwenden; `codex/*` verwendet einen begrenzten Codex-app-server-Turn; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurationsprovider registrieren sich automatisch. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Provider-Transkription (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| Video      | Google, Qwen, Moonshot                                                                                                       | Provider-Videoverstehen über Vendor-Plugins; Qwen-Videoverstehen verwendet die Standard-DashScope-Endpunkte.                                                                                                                            |

<Note>
**MiniMax-Hinweis**

- `minimax`-, `minimax-cn`-, `minimax-portal`- und `minimax-portal-cn`-Bildverständnis stammt vom Plugin-eigenen Medien-Provider `MiniMax-VL-01`.
- Automatisches Bild-Routing verwendet weiterhin `MiniMax-VL-01`, auch wenn veraltete MiniMax-M2.x-Chat-Metadaten Bildeingaben ausweisen.

</Note>

## Anleitung zur Modellauswahl

- Bevorzugen Sie für jede Medienfunktion das stärkste verfügbare Modell der neuesten Generation, wenn Qualität und Sicherheit wichtig sind.
- Vermeiden Sie bei toolfähigen Agents, die nicht vertrauenswürdige Eingaben verarbeiten, ältere/schwächere Medienmodelle.
- Halten Sie für die Verfügbarkeit mindestens einen Fallback pro Fähigkeit vor (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wurde); Nicht-`txt`-Formate fallen auf stdout zurück.

## Richtlinie für Anhänge

Pro Fähigkeit steuert `attachments`, welche Anhänge verarbeitet werden:

<ParamField path="mode" type='"first" | "all"' default="first">
  Ob der erste ausgewählte Anhang oder alle ausgewählten Anhänge verarbeitet werden.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Begrenzt die Anzahl der verarbeiteten Anhänge.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Auswahlpräferenz unter den Kandidatenanhängen.
</ParamField>

Bei `mode: "all"` werden Ausgaben mit `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

<AccordionGroup>
  <Accordion title="Verhalten beim Extrahieren von Dateianhängen">
    - Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** eingeschlossen, bevor er an den Medien-Prompt angehängt wird.
    - Der eingefügte Block verwendet explizite Begrenzungsmarker wie `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine Metadatenzeile `Source: External`.
    - Dieser Pfad zur Anhangsextraktion lässt das lange Banner `SECURITY NOTICE:` absichtlich weg, um den Medien-Prompt nicht aufzublähen; die Begrenzungsmarker und Metadaten bleiben dennoch erhalten.
    - Wenn eine Datei keinen extrahierbaren Text enthält, fügt OpenClaw `[No extractable text]` ein.
    - Wenn ein PDF in diesem Pfad auf gerenderte Seitenbilder zurückfällt, behält der Medien-Prompt den Platzhalter `[PDF content rendered to images; images not forwarded to model]` bei, da dieser Anhangsextraktionsschritt Textblöcke weiterleitet, nicht die gerenderten PDF-Bilder.

  </Accordion>
</AccordionGroup>

## Konfigurationsbeispiele

<Tabs>
  <Tab title="Gemeinsame Modelle + Overrides">
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

Diese zeigt Ergebnisse pro Fähigkeit und, sofern zutreffend, den gewählten Provider/das gewählte Modell.

## Hinweise

- Verständnis erfolgt nach **Best-Effort**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, auch wenn Verständnis deaktiviert ist.
- Verwenden Sie `scope`, um einzuschränken, wo Verständnis ausgeführt wird (z. B. nur DMs).

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Bild- und Medienunterstützung](/de/nodes/images)
