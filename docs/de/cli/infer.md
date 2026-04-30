---
read_when:
    - Hinzufügen oder Ändern von `openclaw infer`-Befehlen
    - Stabile Headless-Fähigkeitsautomatisierung entwerfen
summary: Inferenzorientierte CLI für Provider-gestützte Modell-, Bild-, Audio-, TTS-, Video-, Web- und Embedding-Workflows
title: Inferenz-CLI
x-i18n:
    generated_at: "2026-04-30T06:45:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` ist die kanonische Headless-Oberfläche für Provider-gestützte Inferenz-Workflows.

Sie stellt bewusst Capability-Familien bereit, keine rohen Gateway-RPC-Namen und keine rohen Agent-Tool-IDs.

## infer in einen Skill umwandeln

Kopieren Sie dies und fügen Sie es in einen Agent ein:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Ein guter infer-basierter Skill sollte:

- gängige Benutzerabsichten dem richtigen infer-Unterbefehl zuordnen
- einige kanonische infer-Beispiele für die abgedeckten Workflows enthalten
- in Beispielen und Vorschlägen `openclaw infer ...` bevorzugen
- vermeiden, die gesamte infer-Oberfläche innerhalb des Skill-Texts erneut zu dokumentieren

Typische Abdeckung eines infer-fokussierten Skills:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Warum infer verwenden

`openclaw infer` bietet eine einheitliche CLI für Provider-gestützte Inferenzaufgaben innerhalb von OpenClaw.

Vorteile:

- Verwenden Sie die bereits in OpenClaw konfigurierten Provider und Modelle, statt einmalige Wrapper für jedes Backend zu verdrahten.
- Halten Sie Workflows für Modell, Bild, Audiotranskription, TTS, Video, Web und Embedding unter einem Befehlsbaum.
- Verwenden Sie eine stabile `--json`-Ausgabeform für Skripte, Automatisierung und Agent-gesteuerte Workflows.
- Bevorzugen Sie eine OpenClaw-First-Party-Oberfläche, wenn die Aufgabe grundsätzlich „Inferenz ausführen“ ist.
- Verwenden Sie für die meisten infer-Befehle den normalen lokalen Pfad, ohne den Gateway zu benötigen.

Für End-to-End-Provider-Prüfungen sollten Sie `openclaw infer ...` bevorzugen, sobald die untergeordneten Provider-Tests grün sind. Es testet die ausgelieferte CLI, das Laden der Konfiguration, die Auflösung des Standard-Agents, die Aktivierung gebündelter Plugins, die Reparatur von Runtime-Abhängigkeiten und die gemeinsame Capability-Runtime, bevor die Provider-Anfrage gestellt wird.

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

Diese Tabelle ordnet häufige Inferenzaufgaben dem entsprechenden infer-Befehl zu.

| Aufgabe                         | Befehl                                                                                       | Hinweise                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Text-/Modell-Prompt ausführen      | `openclaw infer model run --prompt "..." --json`                                              | Verwendet standardmäßig den normalen lokalen Pfad                 |
| Modell-Prompt für Bilder ausführen | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Wiederholen Sie `--file` für mehrere Bildeingaben             |
| Bild generieren            | `openclaw infer image generate --prompt "..." --json`                                         | Verwenden Sie `image edit`, wenn Sie mit einer bestehenden Datei beginnen  |
| Bilddatei beschreiben       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` muss ein bildfähiges `<provider/model>` sein |
| Audio transkribieren             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` muss `<provider/model>` sein                  |
| Sprache synthetisieren            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` ist Gateway-orientiert                      |
| Video generieren             | `openclaw infer video generate --prompt "..." --json`                                         | Unterstützt Provider-Hinweise wie `--resolution`        |
| Videodatei beschreiben        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` muss `<provider/model>` sein                  |
| Web durchsuchen               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Webseite abrufen             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Embeddings erstellen            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Verhalten

- `openclaw infer ...` ist die primäre CLI-Oberfläche für diese Workflows.
- Verwenden Sie `--json`, wenn die Ausgabe von einem anderen Befehl oder Skript verarbeitet wird.
- Verwenden Sie `--provider` oder `--model provider/model`, wenn ein bestimmtes Backend erforderlich ist.
- Für `image describe`, `audio transcribe` und `video describe` muss `--model` die Form `<provider/model>` verwenden.
- Für `image describe` führt ein explizites `--model` dieses Provider/Modell direkt aus. Das Modell muss im Modellkatalog oder in der Provider-Konfiguration bildfähig sein. `codex/<model>` führt eine begrenzte Codex-App-Server-Runde zum Bildverständnis aus; `openai-codex/<model>` verwendet den OAuth-Provider-Pfad von OpenAI Codex.
- Zustandslose Ausführungsbefehle verwenden standardmäßig lokal.
- Gateway-verwaltete Zustandsbefehle verwenden standardmäßig den Gateway.
- Der normale lokale Pfad erfordert nicht, dass der Gateway läuft.
- Lokales `model run` ist eine schlanke einmalige Provider-Vervollständigung. Es löst das konfigurierte Agent-Modell und die Authentifizierung auf, startet aber keine Chat-Agent-Runde, lädt keine Tools und öffnet keine gebündelten MCP-Server.
- `model run --file` akzeptiert Bilddateien, erkennt deren MIME-Typ und sendet sie mit dem angegebenen Prompt an das ausgewählte Modell. Wiederholen Sie `--file` für mehrere Bilder.
- `model run --file` lehnt Nicht-Bildeingaben ab. Verwenden Sie `infer audio transcribe` für Audiodateien und `infer video describe` für Videodateien.
- `model run --gateway` testet Gateway-Routing, gespeicherte Authentifizierung, Provider-Auswahl und die eingebettete Runtime, läuft aber weiterhin als rohe Modellprobe: Es sendet den angegebenen Prompt und alle Bildanhänge ohne vorheriges Sitzungstranskript, Bootstrap-/AGENTS-Kontext, Context-Engine-Zusammenstellung, Tools oder gebündelte MCP-Server.
- `model run --gateway --model <provider/model>` erfordert eine vertrauenswürdige Gateway-Anmeldeinformation für Operatoren, weil die Anfrage den Gateway auffordert, eine einmalige Provider/Modell-Überschreibung auszuführen.

## Modell

Verwenden Sie `model` für Provider-gestützte Textinferenz und Modell-/Provider-Inspektion.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Verwenden Sie vollständige `<provider/model>`-Referenzen, um einen bestimmten Provider per Smoke-Test zu prüfen, ohne den Gateway zu starten oder die vollständige Agent-Tool-Oberfläche zu laden:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Hinweise:

- Lokales `model run` ist der engste CLI-Smoke-Test für Provider-/Modell-/Authentifizierungszustand, weil es nur den angegebenen Prompt an das ausgewählte Modell sendet.
- Lokales `model run --file` behält diesen schlanken Pfad bei und hängt Bildinhalte direkt an die einzelne Benutzernachricht an. Gängige Bilddateien wie PNG, JPEG und WebP funktionieren, wenn ihr MIME-Typ als `image/*` erkannt wird; nicht unterstützte oder nicht erkannte Dateien schlagen fehl, bevor der Provider aufgerufen wird.
- `model run --file` ist am besten geeignet, wenn Sie das ausgewählte multimodale Textmodell direkt testen möchten. Verwenden Sie `infer image describe`, wenn Sie OpenClaws Provider-Auswahl für Bildverständnis und das Standard-Routing für Bildmodelle nutzen möchten.
- Das ausgewählte Modell muss Bildeingabe unterstützen; reine Textmodelle können die Anfrage auf Provider-Ebene ablehnen.
- `model run --prompt` muss nicht nur aus Leerzeichen bestehenden Text enthalten; leere Prompts werden abgelehnt, bevor lokale Provider oder der Gateway aufgerufen werden.
- Lokales `model run` beendet sich mit einem Nicht-Null-Code, wenn der Provider keine Textausgabe zurückgibt, sodass nicht erreichbare lokale Provider und leere Vervollständigungen nicht wie erfolgreiche Proben aussehen.
- Verwenden Sie `model run --gateway`, wenn Sie Gateway-Routing, Agent-Runtime-Einrichtung oder Gateway-verwalteten Provider-Zustand testen müssen, während die Modelleingabe roh bleibt. Verwenden Sie `openclaw agent` oder Chat-Oberflächen, wenn Sie den vollständigen Agent-Kontext, Tools, Speicher und Sitzungstranskript benötigen.
- `model auth login`, `model auth logout` und `model auth status` verwalten gespeicherten Provider-Authentifizierungszustand.

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
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Hinweise:

- Verwenden Sie `image edit`, wenn Sie mit bestehenden Eingabedateien beginnen.
- Verwenden Sie `--size`, `--aspect-ratio` oder `--resolution` mit `image edit` für Provider/Modelle, die Geometriehinweise bei Referenzbild-Bearbeitungen unterstützen.
- Verwenden Sie `--output-format png --background transparent` mit `--model openai/gpt-image-1.5` für OpenAI-PNG-Ausgaben mit transparentem Hintergrund; `--openai-background` bleibt als OpenAI-spezifischer Alias verfügbar. Provider, die keine Hintergrundunterstützung deklarieren, melden den Hinweis als ignorierte Überschreibung.
- Verwenden Sie `image providers --json`, um zu prüfen, welche gebündelten Bild-Provider auffindbar, konfiguriert und ausgewählt sind und welche Generierungs-/Bearbeitungs-Capabilities jeder Provider bereitstellt.
- Verwenden Sie `image generate --model <provider/model> --json` als engsten Live-CLI-Smoke-Test für Änderungen an der Bildgenerierung. Beispiel:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Die JSON-Antwort meldet `ok`, `provider`, `model`, `attempts` und geschriebene
  Ausgabepfade. Wenn `--output` festgelegt ist, kann die endgültige Dateierweiterung dem
  vom Provider zurückgegebenen MIME-Typ folgen.

- Verwenden Sie für `image describe` und `image describe-many` `--prompt`, um dem Vision-Modell eine aufgabenspezifische Anweisung wie OCR, Vergleich, UI-Inspektion oder knappe Beschriftung zu geben.
- Verwenden Sie `--timeout-ms` bei langsamen lokalen Vision-Modellen oder kalten Ollama-Starts.
- Für `image describe` muss `--model` ein bildfähiges `<provider/model>` sein.
- Für lokale Ollama-Vision-Modelle ziehen Sie zuerst das Modell und setzen Sie `OLLAMA_API_KEY` auf einen beliebigen Platzhalterwert, zum Beispiel `ollama-local`. Siehe [Ollama](/de/providers/ollama#vision-and-image-description).

## Audio

Verwenden Sie `audio` für Dateitranskription.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Hinweise:

- `audio transcribe` ist für Dateitranskription vorgesehen, nicht für die Verwaltung von Echtzeitsitzungen.
- `--model` muss `<provider/model>` sein.

## TTS

Verwenden Sie `tts` für Sprachsynthese und TTS-Provider-Status.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Hinweise:

- `tts status` verwendet standardmäßig den Gateway, weil es den vom Gateway verwalteten TTS-Status widerspiegelt.
- Verwenden Sie `tts providers`, `tts voices` und `tts set-provider`, um das TTS-Verhalten zu prüfen und zu konfigurieren.

## Video

Verwenden Sie `video` für Generierung und Beschreibung.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Hinweise:

- `video generate` akzeptiert `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` und `--timeout-ms` und leitet sie an die Laufzeitumgebung für Videogenerierung weiter.
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

Verwenden Sie `embedding` für die Vektorerstellung und die Prüfung von Embedding-Providern.

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

Felder der obersten Ebene sind stabil:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Für Befehle, die Medien generieren, enthält `outputs` Dateien, die von OpenClaw geschrieben wurden. Verwenden Sie
für Automatisierung den `path`, `mimeType`, `size` und alle medienspezifischen Abmessungen in diesem Array,
anstatt menschenlesbares stdout zu parsen.

## Häufige Fallstricke

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Hinweise

- `openclaw capability ...` ist ein Alias für `openclaw infer ...`.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Modelle](/de/concepts/models)
