---
read_when:
    - Medienverständnis entwerfen oder refaktorisieren
    - Optimierung der Vorverarbeitung eingehender Audio-, Video- und Bilddaten
sidebarTitle: Media understanding
summary: Eingehendes Bild-/Audio-/Videoverstehen (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-06-28T05:08:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kann **eingehende Medien zusammenfassen** (Bild/Audio/Video), bevor die Antwort-Pipeline ausgeführt wird. Es erkennt automatisch, ob lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verständnis deaktiviert ist, erhalten Modelle weiterhin wie gewohnt die ursprünglichen Dateien/URLs.

Vendorspezifisches Medienverhalten wird von Vendor-Plugins registriert, während der OpenClaw-Kern die gemeinsame `tools.media`-Konfiguration, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline besitzt.

## Ziele

- Optional: Eingehende Medien vorab zu kurzem Text verdichten, für schnelleres Routing und besseres Parsen von Befehlen.
- Ursprüngliche Medienzustellung an das Modell beibehalten (immer).
- **Provider-APIs** und **CLI-Fallbacks** unterstützen.
- Mehrere Modelle mit geordnetem Fallback erlauben (Fehler/Größe/Timeout).

## Verhalten auf hoher Ebene

<Steps>
  <Step title="Anhänge sammeln">
    Eingehende Anhänge sammeln (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Pro Fähigkeit auswählen">
    Für jede aktivierte Fähigkeit (Bild/Audio/Video) Anhänge gemäß Richtlinie auswählen (Standard: **erster**).
  </Step>
  <Step title="Modell wählen">
    Den ersten geeigneten Modelleintrag wählen (Größe + Fähigkeit + Authentifizierung).
  </Step>
  <Step title="Bei Fehler Fallback verwenden">
    Wenn ein Modell fehlschlägt oder das Medium zu groß ist, **auf den nächsten Eintrag zurückfallen**.
  </Step>
  <Step title="Erfolgsblock anwenden">
    Bei Erfolg:

    - `Body` wird zu einem `[Image]`-, `[Audio]`- oder `[Video]`-Block.
    - Audio setzt `{{Transcript}}`; das Parsen von Befehlen verwendet vorhandenen Beschriftungstext, andernfalls das Transkript.
    - Beschriftungen bleiben als `User text:` innerhalb des Blocks erhalten.

  </Step>
</Steps>

Wenn das Verständnis fehlschlägt oder deaktiviert ist, **läuft der Antwortfluss weiter** mit dem ursprünglichen Body und den Anhängen.

## Konfigurationsübersicht

`tools.media` unterstützt **gemeinsame Modelle** plus Überschreibungen pro Fähigkeit:

<AccordionGroup>
  <Accordion title="Schlüssel auf oberster Ebene">
    - `tools.media.models`: gemeinsame Modellliste (verwenden Sie `capabilities` zur Eingrenzung).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - Standardwerte (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
      - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
      - Steuerung für Audio-Transkript-Echo (`echoTranscript`, Standard `false`; `echoFormat`)
      - optionale **`models`-Liste pro Fähigkeit** (bevorzugt vor gemeinsamen Modellen)
      - `attachments`-Richtlinie (`mode`, `maxAttachments`, `prefer`)
      - `scope` (optionale Eingrenzung nach Kanal/chatType/Sitzungsschlüssel)
    - `tools.media.concurrency`: maximale gleichzeitige Fähigkeitsausführungen (Standard **2**).

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

    CLI-Vorlagen können auch Folgendes verwenden:

    - `{{MediaDir}}` (Verzeichnis, das die Mediendatei enthält)
    - `{{OutputDir}}` (für diesen Lauf erstelltes Scratch-Verzeichnis)
    - `{{OutputBase}}` (Basispfad der Scratch-Datei, ohne Erweiterung)

  </Tab>
</Tabs>

### Provider-Zugangsdaten (`apiKey`)

Provider-basiertes Medienverständnis verwendet dieselbe Provider-Auth-Auflösung wie normale
Modellaufrufe: Auth-Profile, Umgebungsvariablen, dann
`models.providers.<providerId>.apiKey`.

`tools.media.*.models[]`-Einträge akzeptieren kein Inline-Feld `apiKey`. Der
`provider`-Wert in einem Medienmodelleintrag, z. B. `openai` oder `moonshot`, muss
Zugangsdaten über eine der Standardquellen für Provider-Auth verfügbar haben.

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

Die vollständige Referenz zur Provider-Auth, einschließlich Profilen, Umgebungsvariablen
und benutzerdefinierten Basis-URLs, finden Sie unter [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Standardwerte und Limits

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, befehlsfreundlich)
- `maxChars`: **nicht gesetzt** für Audio (vollständiges Transkript, sofern Sie kein Limit setzen)
- `maxBytes`:
  - Bild: **10 MB**
  - Audio: **20 MB**
  - Video: **50 MB**

<AccordionGroup>
  <Accordion title="Regeln">
    - Wenn Medien `maxBytes` überschreiten, wird dieses Modell übersprungen und das **nächste Modell versucht**.
    - Audiodateien unter **1024 Byte** werden als leer/beschädigt behandelt und vor Provider-/CLI-Transkription übersprungen; der eingehende Antwortkontext erhält ein deterministisches Platzhaltertranskript, damit der Agent weiß, dass die Notiz zu klein war.
    - Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
    - `prompt` ist standardmäßig ein einfaches „Describe the {media}.“ plus `maxChars`-Hinweis (nur Bild/Video).
    - Wenn das aktive primäre Bildmodell bereits nativ Vision unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das ursprüngliche Bild an das Modell.
    - Wenn ein primäres Gateway-/WebChat-Modell nur Text unterstützt, bleiben Bildanhänge als ausgelagerte `media://inbound/*`-Referenzen erhalten, damit die Bild-/PDF-Tools oder das konfigurierte Bildmodell sie weiterhin prüfen können, statt den Anhang zu verlieren.
    - Explizite Anforderungen mit `openclaw infer image describe --model <provider/model>` sind anders: Sie führen dieses bildfähige Provider-/Modellpaar direkt aus, einschließlich Ollama-Referenzen wie `ollama/qwen2.5vl:7b`.
    - Wenn `<capability>.enabled: true` gesetzt ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das **aktive Antwortmodell**, wenn dessen Provider die Fähigkeit unterstützt.

  </Accordion>
</AccordionGroup>

### Medienverständnis automatisch erkennen (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine Modelle konfiguriert haben, erkennt OpenClaw automatisch in dieser Reihenfolge und **stoppt bei der ersten funktionierenden Option**:

<Steps>
  <Step title="Aktives Antwortmodell">
    Aktives Antwortmodell, wenn dessen Provider die Fähigkeit unterstützt.
  </Step>
  <Step title="agents.defaults.imageModel">
    Primäre/Fallback-Referenzen von `agents.defaults.imageModel` (nur Bild).
    Bevorzugen Sie `provider/model`-Referenzen. Bloße Referenzen werden nur dann aus konfigurierten bildfähigen Provider-Modelleinträgen qualifiziert, wenn die Übereinstimmung eindeutig ist.
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
  <Step title="Provider-Auth">
    - Konfigurierte `models.providers.*`-Einträge, die die Fähigkeit unterstützen, werden vor der gebündelten Fallback-Reihenfolge versucht.
    - Reine Bild-Konfigurations-Provider mit einem bildfähigen Modell registrieren sich automatisch für Medienverständnis, auch wenn sie kein gebündeltes Vendor-Plugin sind.
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
Binärerkennung erfolgt bestmöglich unter macOS/Linux/Windows; stellen Sie sicher, dass die CLI auf `PATH` liegt (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.
</Note>

### Unterstützung für Proxy-Umgebungen (Provider-Modelle)

Wenn Provider-basiertes **Audio**- und **Video**-Medienverständnis aktiviert ist, berücksichtigt OpenClaw Standard-Umgebungsvariablen für ausgehende Proxys bei Provider-HTTP-Aufrufen:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, verwendet Medienverständnis direkten Egress. Wenn der Proxy-Wert fehlerhaft ist, protokolliert OpenClaw eine Warnung und fällt auf direkten Abruf zurück.

## Fähigkeiten (optional)

Wenn Sie `capabilities` setzen, wird der Eintrag nur für diese Medientypen ausgeführt. Für gemeinsame Listen kann OpenClaw Standardwerte ableiten:

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

Für CLI-Einträge sollten Sie `capabilities` **explizit setzen**, um überraschende Übereinstimmungen zu vermeiden. Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste geeignet, in der er erscheint.

## Provider-Supportmatrix (OpenClaw-Integrationen)

| Fähigkeit | Provider-Integration                                                                                                         | Hinweise                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bild      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurations-Provider | Vendor-Plugins registrieren Bildunterstützung; `openai/*` kann API-Schlüssel- oder Codex-OAuth-Routing verwenden; `codex/*` verwendet einen begrenzten Codex-app-server-Turn; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurations-Provider registrieren sich automatisch. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Provider-Transkription (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| Video      | Google, Qwen, Moonshot                                                                                                       | Provider-Videoverständnis über Vendor-Plugins; Qwen-Videoverständnis verwendet die Standard-DashScope-Endpunkte.                                                                                                                            |

<Note>
**MiniMax-Hinweis**

- Das Bildverstehen von `minimax`, `minimax-cn`, `minimax-portal` und `minimax-portal-cn` stammt vom Plugin-eigenen Medien-Provider `MiniMax-VL-01`.
- Automatisches Bild-Routing verwendet weiterhin `MiniMax-VL-01`, selbst wenn ältere MiniMax-M2.x-Chat-Metadaten Bildeingaben ausweisen.

</Note>

## Anleitung zur Modellauswahl

- Bevorzugen Sie für jede Medienfähigkeit das stärkste verfügbare Modell der neuesten Generation, wenn Qualität und Sicherheit wichtig sind.
- Vermeiden Sie bei tool-fähigen Agents, die nicht vertrauenswürdige Eingaben verarbeiten, ältere/schwächere Medienmodelle.
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
  Auswahlpräferenz unter möglichen Anhängen.
</ParamField>

Bei `mode: "all"` werden Ausgaben mit `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

<AccordionGroup>
  <Accordion title="Extraktionsverhalten für Dateianhänge">
    - Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er an den Medien-Prompt angehängt wird.
    - Der eingefügte Block verwendet explizite Begrenzungsmarker wie `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine Metadatenzeile `Source: External`.
    - Dieser Pfad zur Anhangsextraktion lässt das lange Banner `SECURITY NOTICE:` absichtlich weg, um den Medien-Prompt nicht aufzublähen; die Begrenzungsmarker und Metadaten bleiben dennoch erhalten.
    - Wenn eine Datei keinen extrahierbaren Text enthält, fügt OpenClaw `[No extractable text]` ein.
    - Wenn ein PDF in diesem Pfad auf gerenderte Seitenbilder zurückfällt, leitet OpenClaw diese Seitenbilder an antwortende Modelle mit Bildverarbeitungsfähigkeit weiter und behält den Platzhalter `[PDF content rendered to images]` im Dateiblock bei.

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

Wenn Medienverstehen ausgeführt wird, enthält `/status` eine kurze Zusammenfassungszeile:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Dies zeigt Ergebnisse pro Fähigkeit und gegebenenfalls den gewählten Provider/das gewählte Modell.

## Hinweise

- Verstehen erfolgt nach **Best-Effort**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, auch wenn Verstehen deaktiviert ist.
- Verwenden Sie `scope`, um zu begrenzen, wo Verstehen ausgeführt wird (z. B. nur DMs).

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Bild- und Medienunterstützung](/de/nodes/images)
