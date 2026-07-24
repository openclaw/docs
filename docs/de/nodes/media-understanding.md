---
read_when:
    - Medienverständnis konzipieren oder refaktorieren
    - Optimierung der Vorverarbeitung eingehender Audio-, Video- und Bilddaten
sidebarTitle: Media understanding
summary: Verarbeitung eingehender Bilder, Audio- und Videodateien (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-07-24T05:08:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0948e9b4b59d1006a126a598ced38a9edc2902a01e4dd150717044f91ef57049
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kann eingehende Medien (Bilder/Audio/Video) zusammenfassen, bevor die Antwort-Pipeline ausgeführt wird, sodass Befehlsanalyse und Routing mit kurzem Text statt mit Rohbytes arbeiten. Die Medienanalyse erkennt lokale Tools oder Provider-Schlüssel automatisch; alternativ können explizite Modelle konfiguriert werden. Die Originalmedien werden dem Modell wie gewohnt immer übermittelt. Wenn die Medienanalyse fehlschlägt oder deaktiviert ist, wird der Antwortablauf unverändert fortgesetzt.

Hersteller-Plugins registrieren Metadaten zu ihren Fähigkeiten (welcher Provider welchen Medientyp unterstützt, Standardmodell, Priorität). Der OpenClaw-Kern verwaltet die gemeinsame `tools.media`-Konfiguration, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline.

## Funktionsweise

<Steps>
  <Step title="Anhänge erfassen">
    Eingehende Anhänge erfassen (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Nach Fähigkeit auswählen">
    Für jede aktivierte Fähigkeit (Bild/Audio/Video) Anhänge gemäß der `attachments`-Richtlinie auswählen (Standard: nur der erste Anhang).
  </Step>
  <Step title="Modell auswählen">
    Den ersten geeigneten Modelleintrag auswählen (Größe + Fähigkeit + verfügbare Authentifizierung).
  </Step>
  <Step title="Bei Fehler auf Fallback zurückgreifen">
    Wenn ein Modell einen Fehler zurückgibt, das Zeitlimit überschreitet oder das Medium `maxBytes` überschreitet, den nächsten Eintrag versuchen.
  </Step>
  <Step title="Bei Erfolg anwenden">
    `Body` wird zu einem `[Image]`-, `[Audio]`- oder `[Video]`-Block. Bei Audio wird außerdem `{{Transcript}}` festgelegt; für die Befehlsanalyse wird der Beschriftungstext verwendet, sofern vorhanden, andernfalls das Transkript. Beschriftungen bleiben im Block als `User text:` erhalten.
  </Step>
</Steps>

## Konfiguration

`tools.media` enthält eine mit Fähigkeiten versehene Modellliste sowie einige kleine, fähigkeitsspezifische Steuerelemente:

```json5
{
  tools: {
    media: {
      concurrency: 2, // maximale Anzahl gleichzeitiger Fähigkeitsausführungen (Standard)
      models: [
        { provider: "openai", model: "gpt-4o-mini-transcribe", capabilities: ["audio"] },
        { provider: "google", model: "gemini-3-flash-preview", capabilities: ["image", "video"] },
      ],
      image: { preferredModel: "google/gemini-3-flash-preview" },
      audio: { enabled: true },
      video: { enabled: true },
    },
  },
}
```

Schlüssel je Fähigkeit (`image`/`audio`/`video`):

| Schlüssel         | Typ       | Standard                               | Hinweise                                                             |
| ---------------- | --------- | -------------------------------------- | -------------------------------------------------------------------- |
| `enabled`        | `boolean` | automatisch (`false` deaktiviert)                | `false` festlegen, um die automatische Erkennung für diese Fähigkeit zu deaktivieren              |
| `preferredModel` | `string`  | erster kompatibler Eintrag                 | `provider/model`, Modell-ID, `provider:<id>` oder `cli:command` bevorzugen |
| `prompt`         | `string`  | Standardwert der Fähigkeit                     | Standard-Prompt, wenn ein Eintrag ihn nicht überschreibt                    |
| `maxChars`       | `number`  | `500` für Bild/Video, für Audio nicht festgelegt         | Standardmäßiges Ausgabelimit                                                 |
| `maxBytes`       | `number`  | 10MB für Bilder, 20MB für Audio, 50MB für Video     | Standardmäßiges Eingabelimit                                                  |
| `timeoutSeconds` | `number`  | `60` für Bild/Audio, `120` für Video          | Standardmäßiges Anfragezeitlimit                                              |
| `language`       | `string`  | nicht festgelegt                                  | Hinweis zur Audiotranskription                                             |
| `scope`          | Objekt    | nicht festgelegt                                  | Nach Kanal-/Chattyp-/Quellschlüssel beschränken                                 |
| `attachments`    | Objekt    | `{ mode: "first", maxAttachments: 1 }` | Auswählen, welche passenden Anhänge verarbeitet werden                      |
| `echoTranscript` | `boolean` | `false`                                | Nur Audio: Transkript vor der Agentenverarbeitung ausgeben              |
| `echoFormat`     | `string`  | `'📝 "{transcript}"'`                  | Nur Audio: Format für das ausgegebene Transkript                         |

Prompts, Limits, Sprachhinweise, Anfrageüberschreibungen und Provider-Optionen können als Standardwerte für Fähigkeiten festgelegt oder in einzelnen `tools.media.models[]`-Einträgen überschrieben werden. Die Standardwerte für Fähigkeiten gelten auch für automatisch erkannte Provider, wenn kein explizites Modell konfiguriert ist.

### Modelleinträge

Jeder `models[]`-Eintrag ist ein **Provider**-Eintrag (Standard) oder ein **CLI**-Eintrag:

<Tabs>
  <Tab title="Provider-Eintrag">
    ```json5
    {
      type: "provider", // Standard, wenn nicht angegeben
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Beschreiben Sie das Bild in höchstens 500 Zeichen.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"],
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
        "Lesen Sie das Medium unter {{MediaPath}} und beschreiben Sie es in höchstens {{MaxChars}} Zeichen.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    CLI-Vorlagen können außerdem `{{MediaDir}}` (Verzeichnis mit der Mediendatei), `{{OutputDir}}` (für diese Ausführung erstelltes temporäres Verzeichnis) und `{{OutputBase}}` (Basispfad der temporären Datei ohne Erweiterung) verwenden.

  </Tab>
</Tabs>

### Provider-Anmeldedaten

Die Medienanalyse über Provider verwendet dieselbe Authentifizierungsauflösung wie normale Modellaufrufe: Authentifizierungsprofile, Umgebungsvariablen und anschließend `models.providers.<providerId>.apiKey`. `tools.media.models[]`-Einträge akzeptieren kein eingebettetes `apiKey`-Feld.

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

Informationen zu Profilen, Umgebungsvariablen und benutzerdefinierten Basis-URLs finden Sie unter [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Regeln und Verhalten

- Medien, die `maxBytes` überschreiten, werden für dieses Modell übersprungen; stattdessen wird das nächste versucht.
- Audiodateien unter 1024 Byte gelten als leer oder beschädigt und werden vor der Transkription übersprungen; der Agent erhält stattdessen ein deterministisches Platzhaltertranskript.
- Wenn das aktive primäre Bildmodell bereits nativ Bildverarbeitung unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt das Originalbild direkt an das Modell. MiniMax bildet eine Ausnahme: `minimax`, `minimax-cn`, `minimax-portal` und `minimax-portal-cn` leiten die Bildanalyse immer über den Plugin-eigenen Medien-Provider `MiniMax-VL-01`, selbst wenn ältere MiniMax-M2.x-Chatmetadaten die Eingabe von Bildern angeben (erst `MiniMax-M3` und neuere Versionen gelten als nativ bildverarbeitungsfähig).
- Wenn ein primäres Gateway-/WebChat-Modell ausschließlich Text unterstützt, bleiben Bildanhänge als ausgelagerte `media://inbound/*`-Referenzen erhalten, damit Bild-/PDF-Tools oder ein konfiguriertes Bildmodell sie weiterhin untersuchen können, statt den Anhang zu verlieren.
- Ein explizites `openclaw infer image describe --file <path> --model <provider/model>` (Alias: `openclaw capability image describe`) führt diesen bildverarbeitungsfähigen Provider beziehungsweise dieses Modell direkt aus. Dies schließt Ollama-Referenzen wie `ollama/qwen2.5vl:7b` ein, wenn unter `models.providers.ollama.models[]` ein passendes bildverarbeitungsfähiges Modell konfiguriert ist.
- Wenn `<capability>.enabled` nicht `false` ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das aktive Antwortmodell, sofern dessen Provider die Fähigkeit unterstützt.

### Automatische Erkennung (Standard)

Wenn `tools.media.<capability>.enabled` nicht `false` ist und keine Modelle konfiguriert sind, versucht OpenClaw die folgenden Optionen der Reihe nach und beendet die Suche bei der ersten funktionierenden Option:

<Steps>
  <Step title="Konfiguriertes Bildmodell (nur Bilder)">
    Primäre/Fallback-Referenzen aus `agents.defaults.imageModel`, sofern das aktive Antwortmodell nicht bereits nativ Bildverarbeitung unterstützt. `provider/model`-Referenzen werden bevorzugt; unqualifizierte Referenzen werden nur dann anhand konfigurierter bildverarbeitungsfähiger Provider-Modelleinträge qualifiziert, wenn die Übereinstimmung eindeutig ist.
  </Step>
  <Step title="Aktives Antwortmodell">
    Das aktive Antwortmodell, sofern dessen Provider die Fähigkeit unterstützt.
  </Step>
  <Step title="Provider-Authentifizierung (nur Audio, vor lokalen CLIs)">
    Konfigurierte `models.providers.*`-Einträge, die Audio unterstützen, werden vor lokalen CLIs versucht. Prioritätsreihenfolge der mitgelieferten Provider (bei Gleichstand entscheidet die alphabetische Reihenfolge der Provider-ID): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="Lokale CLIs (nur Audio)">
    Einsatzbereite lokale Binärdateien bilden eine geordnete Fallback-Liste:
    - `whisper-cli` nur dann zuerst, nachdem ein vorheriger Modellaufruf im aktuellen Prozess Metal oder CUDA festgestellt hat
    - Standardmäßig für die CPU: `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli`, wenn Beschleunigung lediglich vom Build unterstützt oder noch nicht festgestellt wurde
    - `parakeet-mlx` auf Apple Silicon (MLX-fähig, Gerätenutzung nicht festgestellt)
    - `whisper` (Python-CLI; verwendet standardmäßig das Modell `turbo` und lädt es automatisch herunter)

    Die Überprüfung der Backend-Fähigkeiten wird zwischengespeichert und lädt kein Modell. Build-Fähigkeit, angeforderte Backend-Flags und das bei einem tatsächlichen Aufruf festgestellte Backend bleiben voneinander getrennt. Bei automatisch erkanntem whisper.cpp bleiben die Protokolle der Modellausführung aktiviert, damit die vom Upstream ausgegebene Zeile zum ausgewählten Backend aufgezeichnet werden kann. Explizite CLI-Einträge behalten ihre konfigurierte Reihenfolge, Backend-Flags und Ausgabe-Flags bei.

  </Step>
  <Step title="Provider-Authentifizierung (Bild/Video)">
    Konfigurierte `models.providers.*`-Einträge, die die Fähigkeit unterstützen, werden vor der mitgelieferten Fallback-Reihenfolge versucht. Nur für Bilder konfigurierte Provider mit einem bildverarbeitungsfähigen Modell werden automatisch für die Medienanalyse registriert, selbst wenn sie kein mitgeliefertes Hersteller-Plugin sind.

    Prioritätsreihenfolge der mitgelieferten Provider (bei Gleichstand entscheidet die alphabetische Reihenfolge der Provider-ID):
    - Bild: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Video: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity-CLI (nur Bild/Video)">
    Die erste installierte Binärdatei `agy` oder `antigravity` (mit `OPENCLAW_ANTIGRAVITY_CLI` überschreibbar), in einer Sandbox auf das Verzeichnis des Mediums beschränkt.
  </Step>
</Steps>

So deaktivieren Sie die automatische Erkennung für eine Fähigkeit:

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
Die Erkennung von Binärdateien erfolgt unter macOS/Linux/Windows nach bestem Bemühen. Stellen Sie sicher, dass sich die CLI in `PATH` befindet (`~` wird erweitert), oder legen Sie einen expliziten CLI-Modelleintrag mit einem vollständigen Befehlspfad fest.
</Note>

### Proxy-Unterstützung (Provider-Aufrufe für Audio/Video)

Die Provider-basierte Analyse von **Audio** und **Video** berücksichtigt die üblichen Umgebungsvariablen für ausgehende Proxys einschließlich der Umgehungsregeln `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Variablen in Kleinbuchstaben haben Vorrang vor solchen in Großbuchstaben. Wenn keine festgelegt sind, verwendet die Medienanalyse einen direkten ausgehenden Zugriff. Ist der Proxy-Wert fehlerhaft, protokolliert OpenClaw eine Warnung und greift auf direkten Abruf zurück. Die Bildanalyse verwendet diesen Proxy-Pfad nicht.

## Fähigkeiten

Legen Sie `capabilities` in einem `models[]`-Eintrag fest, um ihn auf bestimmte Medientypen zu beschränken. Für gemeinsam genutzte Listen leitet OpenClaw die Standardwerte je mitgeliefertem Provider ab:

| Provider                                                                 | Funktionen            |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | Bild                  |
| `minimax-portal`                                                         | Bild                  |
| `moonshot`                                                               | Bild + Video          |
| `openrouter`                                                             | Bild + Audio          |
| `google` (Gemini API)                                                    | Bild + Audio + Video  |
| `qwen`                                                                   | Bild + Video          |
| `deepinfra`                                                              | Bild + Audio          |
| `mistral`                                                                | Audio                 |
| `zai`                                                                    | Bild                  |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | Audio                 |
| Jeder `models.providers.<id>.models[]`-Katalog mit einem bildfähigen Modell | Bild                  |

Legen Sie für CLI-Einträge `capabilities` explizit fest, um unerwartete Übereinstimmungen zu vermeiden. Wird dies weggelassen, kommt der Eintrag für jede Funktionsliste infrage, in der er aufgeführt ist.

## Provider-Unterstützungsmatrix

| Funktion | Provider                                                                                                                                                | Hinweise                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bild     | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, Konfigurations-Provider | Hersteller-Plugins registrieren die Bildunterstützung; `openai/*` kann API-Schlüssel- oder Codex-OAuth-Routing verwenden; `codex/*` verwendet einen begrenzten Codex-app-server-Turn; bildfähige Konfigurations-Provider werden automatisch registriert. |
| Audio    | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Provider-Transkription (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                      |
| Video    | Google, Moonshot, Qwen                                                                                                                                  | Videoverständnis des Providers über Hersteller-Plugins; das Videoverständnis von Qwen verwendet die standardmäßigen DashScope-Endpunkte.                                                                 |

<Note>
**Hinweis zu MiniMax**: Das Bildverständnis für `minimax`, `minimax-cn`, `minimax-portal` und `minimax-portal-cn` stammt immer vom Plugin-eigenen Medien-Provider `MiniMax-VL-01`, selbst wenn veraltete Chat-Metadaten von MiniMax M2.x eine Bildeingabe angeben.
</Note>

## Hinweise zur Modellauswahl

- Bevorzugen Sie für jede Medienfunktion das leistungsstärkste Modell der aktuellen Generation, wenn Qualität und Sicherheit wichtig sind.
- Vermeiden Sie bei Agenten mit aktivierten Tools, die nicht vertrauenswürdige Eingaben verarbeiten, ältere oder schwächere Medienmodelle.
- Halten Sie für die Verfügbarkeit mindestens einen Fallback pro Funktion bereit (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) helfen, wenn Provider-APIs nicht verfügbar sind.
- Bekannte Dateiausgabemodi sind maßgeblich: Eine leere oder fehlende abgeleitete Transkriptdatei erzeugt kein Transkript, statt auf die CLI-Fortschrittsausgabe zurückzugreifen.
- `parakeet-mlx`: Verwenden Sie `--output-format txt` (oder `all`) mit `--output-dir` und der standardmäßigen Ausgabevorlage `{filename}`. Die Upstream-Umgebungsvariablen `PARAKEET_OUTPUT_FORMAT` und `PARAKEET_OUTPUT_TEMPLATE` werden ebenfalls berücksichtigt. OpenClaw liest `<output-dir>/<media-basename>.txt`; das standardmäßige Format `srt`, andere Formate und benutzerdefinierte Ausgabevorlagen verwenden weiterhin stdout.

## Richtlinie für Anhänge

Das funktionsspezifische `attachments` steuert, welche Anhänge verarbeitet werden:

<ParamField path="mode" type='"first" | "all"' default="first">
  Verarbeitet nur den ersten ausgewählten Anhang oder alle Anhänge.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Begrenzt die Anzahl der verarbeiteten Anhänge.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Auswahlpräferenz unter den infrage kommenden Anhängen.
</ParamField>

Bei `mode: "all"` werden Ausgaben mit `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

### Extraktion von Dateianhängen

- Extrahierter Dateitext wird als nicht vertrauenswürdiger externer Inhalt eingeschlossen, bevor er an den Medien-Prompt angehängt wird. Dabei werden Begrenzungsmarkierungen wie `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` sowie eine Metadatenzeile `Source: External` verwendet.
- Dieser Pfad lässt das lange Banner `SECURITY NOTICE:` bewusst aus, um den Medien-Prompt kurz zu halten; die Begrenzungsmarkierungen und Metadaten gelten weiterhin.
- Eine Datei ohne extrahierbaren Text erhält `[No extractable text]`.
- Wenn ein PDF auf gerenderte Seitenbilder zurückgreift, leitet OpenClaw diese Bilder an antwortende Modelle mit Bildverarbeitungsfähigkeit weiter und behält den Platzhalter `[PDF content rendered to images]` im Dateiblock bei.

## Konfigurationsbeispiele

<Tabs>
  <Tab title="Gemeinsam verwendete Modelle + Überschreibungen">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
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
                "Lesen Sie die Mediendatei unter {{MediaPath}} und beschreiben Sie sie in <= {{MaxChars}} Zeichen.",
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
                  "Lesen Sie die Mediendatei unter {{MediaPath}} und beschreiben Sie sie in <= {{MaxChars}} Zeichen.",
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
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Lesen Sie die Mediendatei unter {{MediaPath}} und beschreiben Sie sie in <= {{MaxChars}} Zeichen.",
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

Wenn das Medienverständnis ausgeführt wird, enthält `/status` eine Zusammenfassungszeile pro Funktion:

```
📎 Medien: Bild erfolgreich (openai/gpt-5.6-sol) · Audio erfolgreich (whisper-cli beobachtet=metal)
```

Führen Sie für die Vorabinventur `openclaw capability audio providers` aus. Lokale Zeilen zeigen den lokalen Fallback-Gewinner getrennt von der globalen Provider-Auswahl, der Bereitschaft und den separaten Feldern für fähige/angeforderte/beobachtete Backends. Dieselbe lokale Auswahl ist als informativer Doctor-Befund verfügbar:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Hinweise

- Das Verständnis erfolgt nach bestem Bemühen. Fehler blockieren Antworten nicht.
- Anhänge werden auch dann an Modelle übergeben, wenn das Verständnis deaktiviert ist.
- Verwenden Sie `scope`, um einzuschränken, wo das Verständnis ausgeführt wird (beispielsweise nur in Direktnachrichten).

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Unterstützung für Bilder und Medien](/de/nodes/images)
