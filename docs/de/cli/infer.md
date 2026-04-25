---
read_when:
    - '`openclaw infer`-Befehle hinzufügen oder ändern'
    - Stabile Headless-Capability-Automatisierung entwerfen
summary: Infer-first CLI für provider-gestützte Workflows mit Modell, Bild, Audio, TTS, Video, Web und Embeddings
title: Inference-CLI
x-i18n:
    generated_at: "2026-04-25T13:43:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` ist die kanonische Headless-Oberfläche für provider-gestützte Inference-Workflows.

Es stellt bewusst Fähigkeitsfamilien bereit, nicht rohe Gateway-RPC-Namen und nicht rohe Agent-Tool-IDs.

## Infer in eine Skill verwandeln

Kopieren Sie dies und fügen Sie es in einen Agenten ein:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Eine gute infer-basierte Skill sollte:

- gängige Benutzerabsichten dem richtigen infer-Unterbefehl zuordnen
- einige kanonische infer-Beispiele für die von ihr abgedeckten Workflows enthalten
- in Beispielen und Vorschlägen `openclaw infer ...` bevorzugen
- vermeiden, die gesamte infer-Oberfläche innerhalb des Skill-Textes erneut zu dokumentieren

Typische infer-fokussierte Skill-Abdeckung:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Warum infer verwenden

`openclaw infer` bietet eine einheitliche CLI für provider-gestützte Inference-Aufgaben innerhalb von OpenClaw.

Vorteile:

- Verwenden Sie die in OpenClaw bereits konfigurierten Provider und Modelle, anstatt einmalige Wrapper für jedes Backend zu verdrahten.
- Halten Sie Workflows für Modell, Bild, Audiotranskription, TTS, Video, Web und Embeddings unter einem einzigen Befehlsbaum.
- Verwenden Sie eine stabile `--json`-Ausgabeform für Skripte, Automatisierung und agentengesteuerte Workflows.
- Bevorzugen Sie eine erstklassige OpenClaw-Oberfläche, wenn die Aufgabe grundlegend „Inference ausführen“ ist.
- Verwenden Sie den normalen lokalen Pfad, ohne dass für die meisten infer-Befehle das Gateway erforderlich ist.

Für End-to-End-Provider-Prüfungen bevorzugen Sie `openclaw infer ...`, sobald untergeordnete
Provider-Tests grün sind. Es prüft die ausgelieferte CLI, das Laden der Konfiguration,
die Auflösung des Standard-Agenten, die Aktivierung gebündelter Plugins, die Reparatur von
Laufzeitabhängigkeiten und die gemeinsame Fähigkeitslaufzeit, bevor die Provider-Anfrage erfolgt.

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

Diese Tabelle ordnet gängige Inference-Aufgaben dem entsprechenden infer-Befehl zu.

| Aufgabe                  | Befehl                                                                | Hinweise                                              |
| ------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Einen Text-/Modell-Prompt ausführen | `openclaw infer model run --prompt "..." --json`            | Verwendet standardmäßig den normalen lokalen Pfad     |
| Ein Bild erzeugen        | `openclaw infer image generate --prompt "..." --json`                 | Verwenden Sie `image edit`, wenn Sie mit einer vorhandenen Datei beginnen |
| Eine Bilddatei beschreiben | `openclaw infer image describe --file ./image.png --json`           | `--model` muss ein bildfähiges `<provider/model>` sein |
| Audio transkribieren     | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` muss `<provider/model>` sein                |
| Sprache synthetisieren   | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` ist Gateway-orientiert                 |
| Ein Video erzeugen       | `openclaw infer video generate --prompt "..." --json`                 | Unterstützt Provider-Hinweise wie `--resolution`      |
| Eine Videodatei beschreiben | `openclaw infer video describe --file ./clip.mp4 --json`           | `--model` muss `<provider/model>` sein                |
| Im Web suchen            | `openclaw infer web search --query "..." --json`                      |                                                       |
| Eine Webseite abrufen    | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Embeddings erstellen     | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Verhalten

- `openclaw infer ...` ist die primäre CLI-Oberfläche für diese Workflows.
- Verwenden Sie `--json`, wenn die Ausgabe von einem anderen Befehl oder Skript verarbeitet wird.
- Verwenden Sie `--provider` oder `--model provider/model`, wenn ein bestimmtes Backend erforderlich ist.
- Für `image describe`, `audio transcribe` und `video describe` muss `--model` die Form `<provider/model>` haben.
- Bei `image describe` führt ein explizites `--model` diesen Provider/dieses Modell direkt aus. Das Modell muss im Modellkatalog oder in der Provider-Konfiguration bildfähig sein. `codex/<model>` führt einen begrenzten Codex-App-Server-Turn zur Bildverarbeitung aus; `openai-codex/<model>` verwendet den OAuth-Providerpfad von OpenAI Codex.
- Zustandslose Ausführungsbefehle verwenden standardmäßig lokal.
- Vom Gateway verwaltete Zustandsbefehle verwenden standardmäßig das Gateway.
- Der normale lokale Pfad erfordert kein laufendes Gateway.
- `model run` ist einmalig. MCP-Server, die über die Agent-Laufzeit für diesen Befehl geöffnet werden, werden nach der Antwort sowohl bei lokaler als auch bei `--gateway`-Ausführung beendet, sodass wiederholte skriptgesteuerte Aufrufe keine stdio-MCP-Child-Prozesse aktiv halten.

## Modell

Verwenden Sie `model` für provider-gestützte Text-Inference und Modell-/Provider-Inspektion.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Hinweise:

- `model run` verwendet die Agent-Laufzeit wieder, sodass sich Provider-/Modell-Overrides wie bei normaler Agent-Ausführung verhalten.
- Da `model run` für Headless-Automatisierung gedacht ist, behält es nach Abschluss des Befehls keine gebündelten MCP-Laufzeiten pro Sitzung bei.
- `model auth login`, `model auth logout` und `model auth status` verwalten den gespeicherten Auth-Status des Providers.

## Bild

Verwenden Sie `image` für Erzeugung, Bearbeitung und Beschreibung.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Hinweise:

- Verwenden Sie `image edit`, wenn Sie mit vorhandenen Eingabedateien beginnen.
- Verwenden Sie `image providers --json`, um zu prüfen, welche gebündelten Bild-Provider
  auffindbar, konfiguriert und ausgewählt sind und welche Erzeugungs-/Bearbeitungsfähigkeiten
  jeder Provider bereitstellt.
- Verwenden Sie `image generate --model <provider/model> --json` als engsten Live-
  CLI-Smoke-Test für Änderungen an der Bilderzeugung. Beispiel:

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

Verwenden Sie `audio` für die Dateitranskription.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Hinweise:

- `audio transcribe` ist für die Dateitranskription gedacht, nicht für die Verwaltung von Echtzeitsitzungen.
- `--model` muss `<provider/model>` sein.

## TTS

Verwenden Sie `tts` für Sprachsynthese und den TTS-Providerstatus.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Hinweise:

- `tts status` verwendet standardmäßig das Gateway, da es den vom Gateway verwalteten TTS-Status widerspiegelt.
- Verwenden Sie `tts providers`, `tts voices` und `tts set-provider`, um das TTS-Verhalten zu prüfen und zu konfigurieren.

## Video

Verwenden Sie `video` für Erzeugung und Beschreibung.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Hinweise:

- `video generate` akzeptiert `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` und `--timeout-ms` und leitet sie an die Laufzeit der Videoerzeugung weiter.
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

Verwenden Sie `embedding` für Vektorerstellung und die Inspektion von Embedding-Providern.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON-Ausgabe

Infer-Befehle normalisieren die JSON-Ausgabe unter einem gemeinsamen Envelope:

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

Bei Befehlen zur Medienerzeugung enthält `outputs` die von OpenClaw geschriebenen Dateien. Verwenden Sie
für die Automatisierung `path`, `mimeType`, `size` und alle medienspezifischen Abmessungen in diesem Array,
anstatt menschenlesbares stdout zu parsen.

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
