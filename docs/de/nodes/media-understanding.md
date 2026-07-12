---
read_when:
    - Medienverständnis konzipieren oder überarbeiten
    - Optimierung der Vorverarbeitung eingehender Audio-, Video- und Bilddaten
sidebarTitle: Media understanding
summary: Verarbeitung eingehender Bilder, Audio- und Videodateien (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-07-12T01:48:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kann eingehende Medien (Bilder/Audio/Video) zusammenfassen, bevor die Antwort-Pipeline ausgeführt wird. Dadurch arbeiten Befehlsanalyse und Routing mit kurzem Text statt mit Rohdaten. Die Medienanalyse erkennt lokale Werkzeuge oder Provider-Schlüssel automatisch; alternativ können Sie explizite Modelle konfigurieren. Die Originalmedien werden dem Modell wie gewohnt immer bereitgestellt. Wenn die Analyse fehlschlägt oder deaktiviert ist, wird der Antwortablauf unverändert fortgesetzt.

Hersteller-Plugins registrieren Metadaten zu ihren Fähigkeiten (welcher Provider welchen Medientyp unterstützt, Standardmodell, Priorität). Der OpenClaw-Kern verwaltet die gemeinsame Konfiguration `tools.media`, die Fallback-Reihenfolge und die Integration in die Antwort-Pipeline.

## Funktionsweise

<Steps>
  <Step title="Anhänge erfassen">
    Eingehende Anhänge (`MediaPaths`, `MediaUrls`, `MediaTypes`) erfassen.
  </Step>
  <Step title="Nach Fähigkeit auswählen">
    Für jede aktivierte Fähigkeit (Bild/Audio/Video) Anhänge gemäß der Richtlinie `attachments` auswählen (Standard: nur der erste Anhang).
  </Step>
  <Step title="Modell auswählen">
    Den ersten geeigneten Modelleintrag auswählen (Größe, Fähigkeit und verfügbare Authentifizierung).
  </Step>
  <Step title="Bei einem Fehler ausweichen">
    Wenn ein Modell einen Fehler zurückgibt, das Zeitlimit überschreitet oder das Medium `maxBytes` überschreitet, den nächsten Eintrag versuchen.
  </Step>
  <Step title="Bei Erfolg anwenden">
    `Body` wird zu einem `[Image]`-, `[Audio]`- oder `[Video]`-Block. Audio setzt außerdem `{{Transcript}}`; für die Befehlsanalyse wird, sofern vorhanden, der Beschriftungstext verwendet, andernfalls das Transkript. Beschriftungen bleiben innerhalb des Blocks als `User text:` erhalten.
  </Step>
</Steps>

## Konfiguration

`tools.media` enthält eine gemeinsame Modellliste sowie fähigkeitsspezifische Überschreibungen:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

Schlüssel pro Fähigkeit (`image`/`audio`/`video`):

| Schlüssel                                        | Typ       | Standard                                             | Hinweise                                                                                           |
| ------------------------------------------------ | --------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `enabled`                                        | `boolean` | automatisch (`false` deaktiviert)                    | Auf `false` setzen, um die automatische Erkennung für diese Fähigkeit zu deaktivieren              |
| `models`                                         | Array     | keine                                                | Wird vor der gemeinsamen Liste `tools.media.models` bevorzugt                                      |
| `prompt`                                         | `string`  | `"Describe the {media}."` (+ maxChars guidance)      | Standardmäßig nur für Bilder/Videos                                                                |
| `maxChars`                                       | `number`  | `500` (Bild/Video), nicht gesetzt (Audio)            | Die Ausgabe wird gekürzt, wenn das Modell mehr zurückgibt                                          |
| `maxBytes`                                       | `number`  | Bild `10485760`, Audio `20971520`, Video `52428800`  | Bei zu großen Medien wird zum nächsten Modell gewechselt                                           |
| `timeoutSeconds`                                 | `number`  | `60` (Bild/Audio), `120` (Video)                     |                                                                                                    |
| `language`                                       | `string`  | nicht gesetzt                                        | Hinweis für die Audiotranskription                                                                 |
| `baseUrl`/`headers`/`providerOptions`/`request`  | -         | -                                                    | Überschreibungen für Provider-Anfragen; siehe [Werkzeuge und benutzerdefinierte Provider](/de/gateway/config-tools) |
| `attachments`                                    | Objekt    | `{ mode: "first", maxAttachments: 1 }`               | Siehe [Anhangsrichtlinie](#attachment-policy)                                                      |
| `scope`                                          | Objekt    | nicht gesetzt                                        | Nach Kanal/`chatType`/`keyPrefix` beschränken                                                       |
| `echoTranscript`                                 | `boolean` | `false`                                              | Nur Audio: das Transkript vor der Agentenverarbeitung an den Chat zurücksenden                      |
| `echoFormat`                                     | `string`  | `'📝 "{transcript}"'`                                | Nur Audio: Platzhalter `{transcript}`                                                              |

Deepgram-spezifische Optionen gehören unter `providerOptions.deepgram` (das Feld `deepgram: { detectLanguage, punctuate, smartFormat }` auf oberster Ebene ist veraltet, wird aber weiterhin gelesen).

### Modelleinträge

Jeder Eintrag in `models[]` ist ein **Provider**-Eintrag (Standard) oder ein **CLI**-Eintrag:

<Tabs>
  <Tab title="Provider-Eintrag">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
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

    CLI-Vorlagen können außerdem `{{MediaDir}}` (Verzeichnis mit der Mediendatei), `{{OutputDir}}` (für diesen Lauf erstelltes Arbeitsverzeichnis) und `{{OutputBase}}` (Basispfad der Arbeitsdatei ohne Erweiterung) verwenden.

  </Tab>
</Tabs>

### Provider-Anmeldedaten

Die Provider-basierte Medienanalyse verwendet dieselbe Authentifizierungsauflösung wie normale Modellaufrufe: Authentifizierungsprofile, Umgebungsvariablen und anschließend `models.providers.<providerId>.apiKey`. Einträge in `tools.media.*.models[]` akzeptieren kein direkt eingebettetes Feld `apiKey`.

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

Informationen zu Profilen, Umgebungsvariablen und benutzerdefinierten Basis-URLs finden Sie unter [Werkzeuge und benutzerdefinierte Provider](/de/gateway/config-tools).

## Regeln und Verhalten

- Medien, die `maxBytes` überschreiten, überspringen dieses Modell und verwenden das nächste.
- Audiodateien unter 1024 Byte werden als leer oder beschädigt behandelt und vor der Transkription übersprungen; der Agent erhält stattdessen ein deterministisches Platzhaltertranskript.
- Wenn das aktive primäre Bildmodell bereits nativ Bildverarbeitung unterstützt, überspringt OpenClaw den Zusammenfassungsblock `[Image]` und übergibt das Originalbild direkt an das Modell. MiniMax bildet eine Ausnahme: `minimax`, `minimax-cn`, `minimax-portal` und `minimax-portal-cn` leiten die Bildanalyse immer über den Plugin-eigenen Medien-Provider `MiniMax-VL-01`, selbst wenn veraltete Chat-Metadaten von MiniMax M2.x die Unterstützung von Bildeingaben angeben (nur `MiniMax-M3` und spätere Versionen gelten als nativ bildverarbeitungsfähig).
- Wenn ein primäres Gateway-/WebChat-Modell nur Text unterstützt, bleiben Bildanhänge als ausgelagerte Referenzen vom Typ `media://inbound/*` erhalten. Dadurch können Bild-/PDF-Werkzeuge oder ein konfiguriertes Bildmodell sie weiterhin untersuchen, statt dass der Anhang verloren geht.
- Der explizite Aufruf `openclaw infer image describe --file <path> --model <provider/model>` (Alias: `openclaw capability image describe`) führt den bildfähigen Provider bzw. das bildfähige Modell direkt aus. Dies schließt Ollama-Referenzen wie `ollama/qwen2.5vl:7b` ein, wenn unter `models.providers.ollama.models[]` ein passendes bildfähiges Modell konfiguriert ist.
- Wenn `<capability>.enabled` nicht `false` ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das aktive Antwortmodell, sofern dessen Provider die Fähigkeit unterstützt.

### Automatische Erkennung (Standard)

Wenn `tools.media.<capability>.enabled` nicht `false` ist und keine Modelle konfiguriert sind, versucht OpenClaw die folgenden Optionen der Reihe nach und beendet die Suche bei der ersten funktionierenden Option:

<Steps>
  <Step title="Konfiguriertes Bildmodell (nur Bilder)">
    Primäre/Fallback-Referenzen aus `agents.defaults.imageModel`, sofern das aktive Antwortmodell nicht bereits nativ Bildverarbeitung unterstützt. Referenzen im Format `provider/model` werden bevorzugt; reine Modellreferenzen werden nur dann anhand konfigurierter bildfähiger Provider-Modelleinträge qualifiziert, wenn die Übereinstimmung eindeutig ist.
  </Step>
  <Step title="Aktives Antwortmodell">
    Das aktive Antwortmodell, sofern dessen Provider die Fähigkeit unterstützt.
  </Step>
  <Step title="Provider-Authentifizierung (nur Audio, vor lokalen CLIs)">
    Konfigurierte Einträge unter `models.providers.*`, die Audio unterstützen, werden vor lokalen CLIs versucht. Prioritätsreihenfolge der mitgelieferten Provider (bei Gleichstand alphabetisch nach Provider-ID): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="Lokale CLIs (nur Audio)">
    Verfügbare lokale Binärdateien bilden eine geordnete Fallback-Liste:
    - `whisper-cli` nur dann zuerst, wenn ein früherer Modellaufruf im aktuellen Prozess Metal oder CUDA erkannt hat
    - standardmäßig CPU-basiertes `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli`, wenn Beschleunigung lediglich bei der Erstellung unterstützt wurde oder noch nicht beobachtet wurde
    - `parakeet-mlx` auf Apple Silicon (MLX-fähig, Gerätenutzung nicht beobachtet)
    - `whisper` (Python-CLI; verwendet standardmäßig das Modell `turbo`, automatischer Download)

    Die Prüfung der Backend-Fähigkeiten wird zwischengespeichert und lädt kein Modell. Build-Fähigkeit, angeforderte Backend-Flags und das bei einem tatsächlichen Aufruf beobachtete Backend bleiben getrennt. Automatisch erkanntes whisper.cpp lässt Protokolle von Modellläufen aktiviert, damit die Upstream-Zeile zum ausgewählten Backend aufgezeichnet werden kann. Explizite CLI-Einträge behalten ihre konfigurierte Reihenfolge sowie ihre Backend- und Ausgabe-Flags bei.

  </Step>
  <Step title="Provider-Authentifizierung (Bild/Video)">
    Konfigurierte Einträge unter `models.providers.*`, die diese Fähigkeit unterstützen, werden vor der mitgelieferten Fallback-Reihenfolge versucht. Nur für Bilder konfigurierte Provider mit einem bildfähigen Modell werden automatisch für die Medienanalyse registriert, auch wenn sie kein mitgeliefertes Hersteller-Plugin sind.

    Prioritätsreihenfolge der mitgelieferten Provider (bei Gleichstand alphabetisch nach Provider-ID):
    - Bild: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Video: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity-CLI (nur Bild/Video)">
    Die erste installierte Binärdatei `agy` oder `antigravity` (mit `OPENCLAW_ANTIGRAVITY_CLI` überschreibbar), isoliert auf das Verzeichnis des Mediums.
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
Die Erkennung von Binärdateien erfolgt unter macOS/Linux/Windows nach bestem Bemühen. Stellen Sie sicher, dass sich die CLI im `PATH` befindet (`~` wird aufgelöst), oder legen Sie einen expliziten CLI-Modelleintrag mit dem vollständigen Befehlspfad fest.
</Note>

### Proxy-Unterstützung (Provider-Aufrufe für Audio/Video)

Die Provider-basierte Analyse von **Audio** und **Video** berücksichtigt standardmäßige Umgebungsvariablen für ausgehende Proxys einschließlich der Umgehungsregeln `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Variablen in Kleinschreibung haben Vorrang vor solchen in Großschreibung. Wenn keine gesetzt ist, verwendet die Medienanalyse eine direkte ausgehende Verbindung. Ist der Proxy-Wert fehlerhaft, protokolliert OpenClaw eine Warnung und greift auf direkten Abruf zurück. Die Bildanalyse verwendet diesen Proxy-Pfad nicht.

## Fähigkeiten

Legen Sie `capabilities` für einen Eintrag in `models[]` fest, um ihn auf bestimmte Medientypen zu beschränken. Bei gemeinsamen Listen leitet OpenClaw die Standardwerte für jeden mitgelieferten Provider ab:

| Provider                                                                                     | Funktionen          |
| -------------------------------------------------------------------------------------------- | ------------------- |
| `openai`, `anthropic`, `minimax`                                                             | Bild                |
| `minimax-portal`                                                                             | Bild                |
| `moonshot`                                                                                   | Bild + Video        |
| `openrouter`                                                                                 | Bild + Audio        |
| `google` (Gemini API)                                                                        | Bild + Audio + Video |
| `qwen`                                                                                       | Bild + Video        |
| `deepinfra`                                                                                  | Bild + Audio        |
| `mistral`                                                                                    | Audio               |
| `zai`                                                                                        | Bild                |
| `groq`, `xai`, `deepgram`, `senseaudio`                                                      | Audio               |
| Jeder `models.providers.<id>.models[]`-Katalog mit einem bildfähigen Modell                   | Bild                |

Legen Sie für CLI-Einträge `capabilities` explizit fest, um unerwartete Zuordnungen zu vermeiden. Wird die Option ausgelassen, ist der Eintrag für jede Funktionsliste geeignet, in der er vorkommt.

## Provider-Unterstützungsmatrix

| Funktion | Provider                                                                                                                                               | Hinweise                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bild     | Anthropic, Codex-App-Server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, Konfigurations-Provider | Hersteller-Plugins registrieren die Bildunterstützung; `openai/*` kann das Routing per API-Schlüssel oder Codex OAuth verwenden; `codex/*` verwendet einen begrenzten Codex-App-Server-Durchlauf; bildfähige Konfigurations-Provider werden automatisch registriert. |
| Audio    | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Transkription durch den Provider (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                             |
| Video    | Google, Moonshot, Qwen                                                                                                                                 | Videoverständnis durch den Provider über Hersteller-Plugins; das Videoverständnis von Qwen verwendet die standardmäßigen DashScope-Endpunkte.                                                            |

<Note>
**Hinweis zu MiniMax**: Das Bildverständnis von `minimax`, `minimax-cn`, `minimax-portal` und `minimax-portal-cn` stammt immer vom Plugin-eigenen Medien-Provider `MiniMax-VL-01`, selbst wenn veraltete Chat-Metadaten von MiniMax M2.x die Eingabe von Bildern angeben.
</Note>

## Hinweise zur Modellauswahl

- Bevorzugen Sie für jede Medienfunktion das leistungsfähigste Modell der aktuellen Generation, wenn Qualität und Sicherheit wichtig sind.
- Vermeiden Sie bei Agenten mit Werkzeugzugriff, die nicht vertrauenswürdige Eingaben verarbeiten, ältere oder schwächere Medienmodelle.
- Behalten Sie für jede Funktion mindestens eine Ausweichoption zur Sicherstellung der Verfügbarkeit bei (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Ausweichoptionen (`whisper-cli`, `whisper`, `gemini`) helfen, wenn Provider-APIs nicht verfügbar sind.
- Bekannte Dateiausgabemodi sind maßgeblich: Eine leere oder fehlende abgeleitete Transkriptdatei erzeugt kein Transkript, statt auf die Fortschrittsausgabe der CLI zurückzugreifen.
- `parakeet-mlx`: Verwenden Sie `--output-format txt` (oder `all`) zusammen mit `--output-dir` und der standardmäßigen Ausgabevorlage `{filename}`. Die Upstream-Umgebungsvariablen `PARAKEET_OUTPUT_FORMAT` und `PARAKEET_OUTPUT_TEMPLATE` werden ebenfalls berücksichtigt. OpenClaw liest `<output-dir>/<media-basename>.txt`; beim Standardformat `srt`, bei anderen Formaten und bei benutzerdefinierten Ausgabevorlagen wird weiterhin die Standardausgabe verwendet.

## Richtlinie für Anhänge

Das funktionsspezifische Feld `attachments` steuert, welche Anhänge verarbeitet werden:

<ParamField path="mode" type='"first" | "all"' default="first">
  Verarbeitet nur den ersten ausgewählten Anhang oder alle ausgewählten Anhänge.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Begrenzt die Anzahl der verarbeiteten Anhänge.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Auswahlpräferenz unter den infrage kommenden Anhängen.
</ParamField>

Bei `mode: "all"` werden Ausgaben mit `[Bild 1/2]`, `[Audio 2/2]` usw. gekennzeichnet.

### Extraktion von Dateianhängen

- Extrahierter Dateitext wird als nicht vertrauenswürdiger externer Inhalt eingeschlossen, bevor er an den Medien-Prompt angehängt wird. Dazu werden Begrenzungsmarkierungen wie `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` sowie eine Metadatenzeile `Source: External` verwendet.
- Dieser Pfad lässt das lange Banner `SECURITY NOTICE:` absichtlich aus, um den Medien-Prompt kurz zu halten; die Begrenzungsmarkierungen und Metadaten werden weiterhin angewendet.
- Eine Datei ohne extrahierbaren Text erhält `[Kein extrahierbarer Text]`.
- Wenn bei einer PDF-Datei ersatzweise gerenderte Seitenbilder verwendet werden, leitet OpenClaw diese Bilder an antwortende Modelle mit Bildverarbeitungsfähigkeit weiter und behält den Platzhalter `[PDF-Inhalt als Bilder gerendert]` im Dateiblock bei.

## Konfigurationsbeispiele

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Image only">
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

Wenn die Medienanalyse ausgeführt wird, enthält `/status` eine Zusammenfassungszeile je Funktion:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Führen Sie für die Vorabinventarisierung `openclaw capability audio providers` aus. Lokale Zeilen zeigen die ausgewählte lokale Ausweichoption getrennt von der globalen Provider-Auswahl, der Bereitschaft sowie den separaten Feldern für fähige, angeforderte und beobachtete Backends an. Dieselbe lokale Auswahl ist als informativer Doctor-Befund verfügbar:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Hinweise

- Die Analyse erfolgt nach bestem Bemühen. Fehler blockieren keine Antworten.
- Anhänge werden weiterhin an Modelle übergeben, auch wenn die Analyse deaktiviert ist.
- Verwenden Sie `scope`, um einzuschränken, wo die Analyse ausgeführt wird, beispielsweise nur in Direktnachrichten.

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Unterstützung für Bilder und Medien](/de/nodes/images)
