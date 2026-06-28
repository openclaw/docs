---
read_when:
    - Medienverständnis entwerfen oder refaktorieren
    - Abstimmung der Vorverarbeitung eingehender Audio-, Video- und Bildinhalte
sidebarTitle: Media understanding
summary: Eingehendes Bild-/Audio-/Video-Verständnis (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-06-28T05:32:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kann **eingehende Medien zusammenfassen** (Bild/Audio/Video), bevor die Antwort-Pipeline ausgeführt wird. Es erkennt automatisch, wenn lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verstehen ausgeschaltet ist, erhalten Modelle weiterhin wie gewohnt die ursprünglichen Dateien/URLs.

Anbieterspezifisches Medienverhalten wird von Vendor-Plugins registriert, während der OpenClaw-Core die gemeinsame `tools.media`-Konfiguration, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline besitzt.

## Ziele

- Optional: eingehende Medien vorab in kurzen Text verdichten, für schnelleres Routing und besseres Command-Parsing.
- Ursprüngliche Medienübermittlung an das Modell beibehalten (immer).
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
  <Step title="Modell auswählen">
    Den ersten geeigneten Modelleintrag auswählen (Größe + Fähigkeit + Authentifizierung).
  </Step>
  <Step title="Bei Fehler auf Fallback zurückgreifen">
    Wenn ein Modell fehlschlägt oder das Medium zu groß ist, **auf den nächsten Eintrag zurückgreifen**.
  </Step>
  <Step title="Erfolgsblock anwenden">
    Bei Erfolg:

    - `Body` wird zu einem `[Image]`-, `[Audio]`- oder `[Video]`-Block.
    - Audio setzt `{{Transcript}}`; Command-Parsing verwendet Beschriftungstext, wenn vorhanden, andernfalls das Transkript.
    - Beschriftungen bleiben als `User text:` im Block erhalten.

  </Step>
</Steps>

Wenn das Verstehen fehlschlägt oder deaktiviert ist, **läuft der Antwortfluss weiter** mit dem ursprünglichen Body und den Anhängen.

## Konfigurationsübersicht

`tools.media` unterstützt **gemeinsame Modelle** plus Überschreibungen pro Fähigkeit:

<AccordionGroup>
  <Accordion title="Schlüssel auf oberster Ebene">
    - `tools.media.models`: gemeinsame Modellliste (`capabilities` zum Eingrenzen verwenden).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - Standardwerte (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
      - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
      - Steuerung für Audio-Transkript-Echo (`echoTranscript`, Standard `false`; `echoFormat`)
      - optionale **`models`-Liste pro Fähigkeit** (vor gemeinsamen Modellen bevorzugt)
      - `attachments`-Richtlinie (`mode`, `maxAttachments`, `prefer`)
      - `scope` (optionales Eingrenzen nach Kanal/chatType/Sitzungsschlüssel)
    - `tools.media.concurrency`: maximale Anzahl gleichzeitiger Fähigkeitsläufe (Standard **2**).

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
    - `{{OutputDir}}` (für diesen Lauf erstelltes Arbeitsverzeichnis)
    - `{{OutputBase}}` (Basispfad der Arbeitsdatei, ohne Erweiterung)

  </Tab>
</Tabs>

### Provider-Anmeldedaten (`apiKey`)

Provider-Medienverständnis verwendet dieselbe Provider-Authentifizierungsauflösung wie normale
Modellaufrufe: Authentifizierungsprofile, Umgebungsvariablen, dann
`models.providers.<providerId>.apiKey`.

`tools.media.*.models[]`-Einträge akzeptieren kein Inline-Feld `apiKey`. Der
`provider`-Wert in einem Medienmodelleintrag, zum Beispiel `openai` oder `moonshot`, muss
über eine der standardmäßigen Provider-Authentifizierungsquellen verfügbare Anmeldedaten
haben.

Minimales Beispiel:

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

Die vollständige Referenz zur Provider-Authentifizierung, einschließlich Profilen, Umgebungsvariablen
und benutzerdefinierten Basis-URLs, finden Sie unter [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Standardwerte und Limits

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, befehlsfreundlich)
- `maxChars`: **nicht gesetzt** für Audio (vollständiges Transkript, sofern Sie kein Limit festlegen)
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Regeln">
    - Wenn Medien `maxBytes` überschreiten, wird dieses Modell übersprungen und das **nächste Modell wird ausprobiert**.
    - Audiodateien kleiner als **1024 Byte** werden als leer/beschädigt behandelt und vor der Provider-/CLI-Transkription übersprungen; der Kontext eingehender Antworten erhält ein deterministisches Platzhaltertranskript, damit der Agent weiß, dass die Notiz zu klein war.
    - Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
    - `prompt` verwendet standardmäßig ein einfaches "Beschreiben Sie das {media}." plus die `maxChars`-Hinweise (nur Bild/Video).
    - Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den Zusammenfassungsblock `[Image]` und übergibt stattdessen das Originalbild an das Modell.
    - Wenn ein primäres Gateway-/WebChat-Modell nur Text unterstützt, werden Bildanhänge als ausgelagerte `media://inbound/*`-Refs beibehalten, sodass die Bild-/PDF-Tools oder das konfigurierte Bildmodell sie weiterhin prüfen können, anstatt den Anhang zu verlieren.
    - Explizite Anforderungen mit `openclaw infer image describe --model <provider/model>` unterscheiden sich: Sie führen diesen bildfähigen Provider bzw. dieses Modell direkt aus, einschließlich Ollama-Refs wie `ollama/qwen2.5vl:7b`.
    - Wenn `<capability>.enabled: true` gesetzt ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das **aktive Antwortmodell**, sofern dessen Provider die Fähigkeit unterstützt.

  </Accordion>
</AccordionGroup>

### Medienverständnis automatisch erkennen (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine Modelle konfiguriert haben, erkennt OpenClaw automatisch in dieser Reihenfolge und **stoppt bei der ersten funktionierenden Option**:

<Steps>
  <Step title="Aktives Antwortmodell">
    Aktives Antwortmodell, wenn dessen Provider die Fähigkeit unterstützt.
  </Step>
  <Step title="agents.defaults.imageModel">
    Primäre/Fallback-Refs von `agents.defaults.imageModel` (nur Bild).
    Bevorzugen Sie `provider/model`-Refs. Bare-Refs werden nur dann anhand konfigurierter bildfähiger Provider-Modelleinträge qualifiziert, wenn die Übereinstimmung eindeutig ist.
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
    - Konfigurierte `models.providers.*`-Einträge, die die Fähigkeit unterstützen, werden vor der gebündelten Fallback-Reihenfolge ausprobiert.
    - Nur für Bilder konfigurierte Provider mit einem bildfähigen Modell werden automatisch für Medienverständnis registriert, auch wenn sie kein gebündeltes Vendor-Plugin sind.
    - Ollama-Bildverständnis ist verfügbar, wenn es explizit ausgewählt wird, zum Beispiel über `agents.defaults.imageModel` oder `openclaw infer image describe --model ollama/<vision-model>`.

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
Die Binärerkennung erfolgt bestmöglich über macOS/Linux/Windows hinweg; stellen Sie sicher, dass sich die CLI in `PATH` befindet (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit einem vollständigen Befehlspfad.
</Note>

### Proxy-Umgebungsunterstützung (Provider-Modelle)

Wenn Provider-basiertes **Audio**- und **Video**-Medienverständnis aktiviert ist, berücksichtigt OpenClaw standardmäßige ausgehende Proxy-Umgebungsvariablen für Provider-HTTP-Aufrufe:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, verwendet das Medienverständnis direkten ausgehenden Zugriff. Wenn der Proxy-Wert fehlerhaft formatiert ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Fähigkeiten (optional)

Wenn Sie `capabilities` setzen, wird der Eintrag nur für diese Medientypen ausgeführt. Für gemeinsam genutzte Listen kann OpenClaw Standardwerte ableiten:

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
- Jeder `models.providers.<id>.models[]`-Katalog mit einem bildfähigen Modell: **Bild**

Für CLI-Einträge sollten Sie `capabilities` **explizit setzen**, um überraschende Übereinstimmungen zu vermeiden. Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste berechtigt, in der er erscheint.

## Provider-Unterstützungsmatrix (OpenClaw-Integrationen)

| Fähigkeit | Provider-Integration                                                                                                         | Hinweise                                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bild      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurations-Provider | Vendor-Plugins registrieren Bildunterstützung; `openai/*` kann API-Schlüssel- oder Codex-OAuth-Routing verwenden; `codex/*` nutzt einen begrenzten Codex app-server-Turn; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurations-Provider werden automatisch registriert. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Provider-Transkription (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                       |
| Video      | Google, Qwen, Moonshot                                                                                                       | Provider-Videoverständnis über Vendor-Plugins; Qwen-Videoverständnis verwendet die Standard-DashScope-Endpunkte.                                                                                                                                            |

<Note>
**MiniMax-Hinweis**

- Das Bildverständnis für `minimax`, `minimax-cn`, `minimax-portal` und `minimax-portal-cn` stammt vom Plugin-eigenen Medien-Provider `MiniMax-VL-01`.
- Das automatische Bild-Routing verwendet weiterhin `MiniMax-VL-01`, selbst wenn veraltete MiniMax-M2.x-Chat-Metadaten Bildeingaben ausweisen.

</Note>

## Hinweise zur Modellauswahl

- Bevorzugen Sie für jede Medienfähigkeit das stärkste verfügbare Modell der neuesten Generation, wenn Qualität und Sicherheit wichtig sind.
- Vermeiden Sie für Tool-fähige Agenten, die nicht vertrauenswürdige Eingaben verarbeiten, ältere oder schwächere Medienmodelle.
- Behalten Sie mindestens einen Fallback pro Fähigkeit für die Verfügbarkeit bei (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wurde); Nicht-`txt`-Formate fallen auf stdout zurück.

## Richtlinie für Anhänge

Pro Fähigkeit steuert `attachments`, welche Anhänge verarbeitet werden:

<ParamField path="mode" type='"first" | "all"' default="first">
  Ob der erste ausgewählte Anhang oder alle Anhänge verarbeitet werden.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Begrenzt die Anzahl der verarbeiteten Anhänge.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Auswahlpräferenz unter den Kandidatenanhängen.
</ParamField>

Wenn `mode: "all"` gesetzt ist, werden Ausgaben mit `[Image 1/2]`, `[Audio 2/2]` usw. gekennzeichnet.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** eingeschlossen, bevor er an den Medien-Prompt angehängt wird.
    - Der eingefügte Block verwendet explizite Begrenzungsmarker wie `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine Metadatenzeile `Source: External`.
    - Dieser Pfad zur Anhangsextraktion lässt das lange Banner `SECURITY NOTICE:` absichtlich weg, um den Medien-Prompt nicht aufzublähen; die Begrenzungsmarker und Metadaten bleiben dennoch erhalten.
    - Wenn eine Datei keinen extrahierbaren Text enthält, fügt OpenClaw `[No extractable text]` ein.
    - Wenn eine PDF-Datei in diesem Pfad auf gerenderte Seitenbilder zurückfällt, leitet OpenClaw diese Seitenbilder an antwortende Modelle mit Vision-Fähigkeit weiter und behält den Platzhalter `[PDF content rendered to images]` im Dateiblock bei.

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

Dies zeigt Ergebnisse pro Fähigkeit und, sofern zutreffend, den ausgewählten Provider/das ausgewählte Modell.

## Hinweise

- Das Verständnis erfolgt nach **bestem Bemühen**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, auch wenn das Verständnis deaktiviert ist.
- Verwenden Sie `scope`, um einzuschränken, wo Verständnis ausgeführt wird (z. B. nur in DMs).

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Bild- und Medienunterstützung](/de/nodes/images)
