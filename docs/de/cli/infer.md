---
read_when:
    - '`openclaw infer`-Befehle hinzufügen oder ändern'
    - Stabile Headless-Capability-Automatisierung entwerfen
summary: Infer-first-CLI für providergestützte Workflows mit Modellen, Bildern, Audio, TTS, Video, Web und Embeddings
title: Inference CLI
x-i18n:
    generated_at: "2026-04-26T11:26:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` ist die kanonische Headless-Oberfläche für providergestützte Inference-Workflows.

Es stellt bewusst Capability-Familien bereit, nicht rohe Gateway-RPC-Namen und auch keine rohen Agent-Tool-IDs.

## Infer in ein Skill verwandeln

Kopieren Sie Folgendes und fügen Sie es in einen Agenten ein:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Ein gutes infer-basiertes Skill sollte:

- häufige Benutzerintentionen dem richtigen Infer-Unterbefehl zuordnen
- einige kanonische Infer-Beispiele für die unterstützten Workflows enthalten
- in Beispielen und Vorschlägen `openclaw infer ...` bevorzugen
- vermeiden, die gesamte Infer-Oberfläche im Skill-Text erneut zu dokumentieren

Typische infer-fokussierte Skill-Abdeckung:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Warum infer verwenden

`openclaw infer` bietet eine einheitliche CLI für providergestützte Inference-Aufgaben innerhalb von OpenClaw.

Vorteile:

- Verwenden Sie die bereits in OpenClaw konfigurierten Provider und Modelle, statt einmalige Wrapper für jedes Backend zu verdrahten.
- Halten Sie Workflows für Modelle, Bilder, Audiotranskription, TTS, Video, Web und Embeddings unter einem einzigen Befehlsbaum zusammen.
- Verwenden Sie eine stabile `--json`-Ausgabeform für Skripte, Automatisierung und agentengesteuerte Workflows.
- Bevorzugen Sie eine First-Party-Oberfläche von OpenClaw, wenn die Aufgabe im Kern „Inference ausführen“ ist.
- Verwenden Sie den normalen lokalen Pfad, ohne dass für die meisten Infer-Befehle das Gateway erforderlich ist.

Für End-to-End-Provider-Prüfungen sollten Sie `openclaw infer ...` bevorzugen, sobald Tests auf niedrigerer Providerebene grün sind. Es prüft die ausgelieferte CLI, das Laden der Konfiguration,
die Auflösung des Standard-Agenten, die Aktivierung gebündelter Plugins,
die Reparatur von Laufzeitabhängigkeiten und die gemeinsame Capability-Laufzeit, bevor die Provider-Anfrage ausgeführt wird.

## Befehlsbaum

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Häufige Aufgaben

Diese Tabelle ordnet häufige Inference-Aufgaben dem entsprechenden Infer-Befehl zu.

| Aufgabe                | Befehl                                                                | Hinweise                                              |
| ---------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Text-/Modell-Prompt ausführen | `openclaw infer model run --prompt "..." --json`                | Verwendet standardmäßig den normalen lokalen Pfad     |
| Ein Bild generieren    | `openclaw infer image generate --prompt "..." --json`                 | Verwenden Sie `image edit`, wenn Sie von einer vorhandenen Datei ausgehen |
| Eine Bilddatei beschreiben | `openclaw infer image describe --file ./image.png --json`         | `--model` muss ein bildfähiges `<provider/model>` sein |
| Audio transkribieren   | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` muss `<provider/model>` sein                |
| Sprache synthetisieren | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` ist Gateway-orientiert                 |
| Ein Video generieren   | `openclaw infer video generate --prompt "..." --json`                 | Unterstützt Provider-Hinweise wie `--resolution`      |
| Eine Videodatei beschreiben | `openclaw infer video describe --file ./clip.mp4 --json`         | `--model` muss `<provider/model>` sein                |
| Das Web durchsuchen    | `openclaw infer web search --query "..." --json`                      |                                                       |
| Eine Webseite abrufen  | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Embeddings erstellen   | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Verhalten

- `openclaw infer ...` ist die primäre CLI-Oberfläche für diese Workflows.
- Verwenden Sie `--json`, wenn die Ausgabe von einem anderen Befehl oder Skript verarbeitet wird.
- Verwenden Sie `--provider` oder `--model provider/model`, wenn ein bestimmtes Backend erforderlich ist.
- Für `image describe`, `audio transcribe` und `video describe` muss `--model` die Form `<provider/model>` verwenden.
- Für `image describe` führt ein explizites `--model` dieses Provider/Modell direkt aus. Das Modell muss im Modellkatalog oder in der Provider-Konfiguration bildfähig sein. `codex/<model>` führt einen begrenzten Codex-App-Server-Turn zur Bildinterpretation aus; `openai-codex/<model>` verwendet den Provider-Pfad OpenAI Codex OAuth.
- Zustandslose Ausführungsbefehle verwenden standardmäßig lokal.
- Gateway-verwaltete Zustandsbefehle verwenden standardmäßig das Gateway.
- Der normale lokale Pfad erfordert kein laufendes Gateway.
- `model run` ist einmalig. MCP-Server, die für diesen Befehl über die Agent-Laufzeit geöffnet werden, werden nach der Antwort sowohl bei lokaler als auch bei `--gateway`-Ausführung beendet, sodass wiederholte skriptgesteuerte Aufrufe keine `stdio`-MCP-Kindprozesse aktiv halten.

## Modell

Verwenden Sie `model` für providergestützte Text-Inference sowie Modell-/Provider-Inspektion.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Hinweise:

- `model run` verwendet die Agent-Laufzeit erneut, sodass Provider-/Modell-Overrides sich wie bei der normalen Agent-Ausführung verhalten.
- Da `model run` für Headless-Automatisierung gedacht ist, behält es keine gebündelten MCP-Laufzeiten pro Sitzung nach Abschluss des Befehls bei.
- `model auth login`, `model auth logout` und `model auth status` verwalten den gespeicherten Auth-Status des Providers.

## Bild

Verwenden Sie `image` für Generierung, Bearbeitung und Beschreibung.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Hinweise:

- Verwenden Sie `image edit`, wenn Sie mit vorhandenen Eingabedateien beginnen.
- Verwenden Sie `--size`, `--aspect-ratio` oder `--resolution` mit `image edit` für
  Provider/Modelle, die Geometrie-Hinweise bei Bearbeitungen mit Referenzbildern unterstützen.
- Verwenden Sie `--output-format png --background transparent` mit
  `--model openai/gpt-image-1.5` für OpenAI-PNG-Ausgaben mit transparentem Hintergrund;
  `--openai-background` bleibt als OpenAI-spezifischer Alias verfügbar. Provider,
  die keine Unterstützung für Hintergründe deklarieren, melden den Hinweis als ignoriertes Override.
- Verwenden Sie `image providers --json`, um zu prüfen, welche gebündelten Bild-Provider
  auffindbar, konfiguriert, ausgewählt sind und welche Generierungs-/Bearbeitungs-Capabilities
  jeder Provider bereitstellt.
- Verwenden Sie `image generate --model <provider/model> --json` als engsten Live-
  CLI-Smoke-Test für Änderungen an der Bildgenerierung. Beispiel:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Die JSON-Antwort meldet `ok`, `provider`, `model`, `attempts` und geschriebene
  Ausgabepfade. Wenn `--output` gesetzt ist, kann die endgültige Erweiterung dem
  vom Provider zurückgegebenen MIME-Typ folgen.

- Für `image describe` muss `--model` ein bildfähiges `<provider/model>` sein.
- Für lokale Ollama-Vision-Modelle ziehen Sie das Modell zuerst und setzen `OLLAMA_API_KEY` auf einen beliebigen Platzhalterwert, zum Beispiel `ollama-local`. Siehe [Ollama](/de/providers/ollama#vision-and-image-description).

## Audio

Verwenden Sie `audio` für Dateitranskription.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Hinweise:

- `audio transcribe` ist für Dateitranskription gedacht, nicht für die Verwaltung von Echtzeit-Sitzungen.
- `--model` muss `<provider/model>` sein.

## TTS

Verwenden Sie `tts` für Sprachsynthese und den Status des TTS-Providers.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Hinweise:

- `tts status` verwendet standardmäßig das Gateway, da es den Gateway-verwalteten TTS-Status widerspiegelt.
- Verwenden Sie `tts providers`, `tts voices` und `tts set-provider`, um TTS-Verhalten zu prüfen und zu konfigurieren.

## Video

Verwenden Sie `video` für Generierung und Beschreibung.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Hinweise:

- `video generate` akzeptiert `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` und `--timeout-ms` und leitet sie an die Laufzeit für Videogenerierung weiter.
- `--model` muss für `video describe` `<provider/model>` sein.

## Web

Verwenden Sie `web` für Such- und Abruf-Workflows.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Hinweise:

- Verwenden Sie `web providers`, um verfügbare, konfigurierte und ausgewählte Provider zu prüfen.

## Embedding

Verwenden Sie `embedding` für Vektorerstellung und die Prüfung von Embedding-Providern.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON-Ausgabe

Infer-Befehle normalisieren die JSON-Ausgabe unter einer gemeinsamen Hülle:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Top-Level-Felder sind stabil:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Bei Befehlen zur Mediengenerierung enthält `outputs` von OpenClaw geschriebene Dateien. Verwenden Sie
für die Automatisierung `path`, `mimeType`, `size` und alle medienspezifischen Dimensionen in diesem Array,
anstatt menschenlesbares `stdout` zu parsen.

## Häufige Fallstricke

```bash
# Schlecht
openclaw infer media image generate --prompt "friendly lobster"

# Gut
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Schlecht
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Gut
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Hinweise

- `openclaw capability ...` ist ein Alias für `openclaw infer ...`.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Modelle](/de/concepts/models)
