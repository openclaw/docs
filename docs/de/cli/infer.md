---
read_when:
    - Hinzufügen oder Ändern von `openclaw infer`-Befehlen
    - Entwicklung stabiler Headless-Capability-Automatisierung
summary: Infer-first-CLI für Provider-gestützte Modell-, Bild-, Audio-, TTS-, Video-, Web- und Embedding-Workflows
title: Inferenz-CLI
x-i18n:
    generated_at: "2026-07-12T15:12:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` ist die kanonische Headless-Oberfläche für Provider-gestützte Inferenz. Sie stellt Funktionsfamilien (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`) bereit, nicht rohe Gateway-RPC-Namen oder IDs von Agent-Tools. `openclaw capability ...` ist ein Alias für denselben Befehlsbaum.

Gründe, diese Oberfläche einem einmalig erstellten Provider-Wrapper vorzuziehen:

- Verwendet Provider und Modelle wieder, die bereits in OpenClaw konfiguriert sind.
- Stabile `--json`-Hülle für Skripte und agentengesteuerte Automatisierung (siehe [JSON-Ausgabe](#json-output)).
- Führt für die meisten Unterbefehle den normalen lokalen Pfad ohne Gateway aus.
- Für End-to-End-Provider-Prüfungen durchläuft sie die ausgelieferte CLI, das Laden der Konfiguration, die Auflösung des Standard-Agenten, die Aktivierung gebündelter Plugins und die gemeinsame Funktionslaufzeit, bevor die Provider-Anfrage gesendet wird.

## Infer in ein Skill umwandeln

Kopieren Sie Folgendes und fügen Sie es bei einem Agenten ein:

```text
Lesen Sie https://docs.openclaw.ai/cli/infer und erstellen Sie anschließend ein Skill, das meine üblichen Arbeitsabläufe an `openclaw infer` weiterleitet.
Konzentrieren Sie sich auf Modellausführungen, Bilderzeugung, Videoerzeugung, Audiotranskription, TTS, Websuche und Einbettungen.
```

Ein gutes Infer-basiertes Skill ordnet häufige Benutzerabsichten dem richtigen Unterbefehl zu, enthält einige kanonische Beispiele pro Arbeitsablauf, bevorzugt `openclaw infer ...` gegenüber Alternativen auf niedrigerer Ebene und dokumentiert nicht die gesamte Infer-Oberfläche erneut im Skill-Text.

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` zeigen diesen Baum als Daten an (Funktions-ID, Transporte, Beschreibung).

## Häufige Aufgaben

| Aufgabe                             | Befehl                                                                                        | Hinweise                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Eine Text-/Modellanfrage ausführen  | `openclaw infer model run --prompt "..." --json`                                              | Standardmäßig lokal                                            |
| Eine Modellanfrage mit Bildern ausführen | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Wiederholen Sie `--file` für mehrere Bilder                    |
| Ein Bild erzeugen                   | `openclaw infer image generate --prompt "..." --json`                                         | Verwenden Sie `image edit`, wenn Sie mit einer vorhandenen Datei beginnen |
| Eine Bilddatei oder URL beschreiben | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` muss ein bildfähiges `<provider/model>` sein         |
| Audio transkribieren                | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` muss `<provider/model>` sein                         |
| Sprache synthetisieren              | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` wird nur über das Gateway ausgeführt              |
| Ein Video erzeugen                  | `openclaw infer video generate --prompt "..." --json`                                         | Unterstützt Provider-Hinweise wie `--resolution`               |
| Eine Videodatei beschreiben         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` muss `<provider/model>` sein                         |
| Das Web durchsuchen                 | `openclaw infer web search --query "..." --json`                                              |                                                                |
| Eine Webseite abrufen               | `openclaw infer web fetch --url https://example.com --json`                                   |                                                                |
| Einbettungen erstellen              | `openclaw infer embedding create --text "..." --json`                                         |                                                                |

## Verhalten

- Verwenden Sie `--json`, wenn die Ausgabe an einen anderen Befehl oder ein Skript übergeben wird; andernfalls verwenden Sie Textausgabe.
- Verwenden Sie `--provider` oder `--model provider/model`, um ein bestimmtes Backend festzulegen.
- Verwenden Sie `model run --thinking <level>` für eine einmalige Überschreibung des Denk-/Reasoning-Niveaus: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` oder `max`.
- Für `image describe`, `audio transcribe` und `video describe` muss `--model` die Form `<provider/model>` verwenden.
- Für `image describe` akzeptiert `--file` lokale Pfade und HTTP(S)-URLs; entfernte URLs durchlaufen die normale SSRF-Richtlinie für Medienabrufe.
- Zustandslose Ausführungsbefehle (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) verwenden standardmäßig die lokale Ausführung. Vom Gateway verwaltete Zustandsbefehle (`tts status`) verwenden standardmäßig das Gateway.
- Für den lokalen Pfad muss das Gateway niemals ausgeführt werden.
- Das lokale `model run` ist eine schlanke, einmalige Provider-Vervollständigung: Es löst das konfigurierte Agentenmodell und die Authentifizierung auf, startet jedoch keinen Chat-Agenten-Durchlauf, lädt keine Tools und öffnet keine gebündelten MCP-Server.
- `model run --file` hängt Bilddateien mit automatisch erkanntem MIME-Typ an die Anfrage an; wiederholen Sie `--file` für mehrere Bilder. Dateien, die keine Bilder sind, werden abgelehnt – verwenden Sie stattdessen `infer audio transcribe` oder `infer video describe`.
- `model run --gateway` prüft Gateway-Routing, gespeicherte Authentifizierung, Provider-Auswahl und die eingebettete Laufzeit, bleibt jedoch eine rohe Modellprüfung: kein vorheriges Sitzungsprotokoll, kein Bootstrap-/AGENTS-Kontext, keine Tools und keine gebündelten MCP-Server.
- `model run --gateway --model <provider/model>` erfordert Gateway-Zugangsdaten eines vertrauenswürdigen Operators, da der Befehl das Gateway auffordert, eine einmalige Provider-/Modellüberschreibung auszuführen.

## Modell

Textinferenz und Modell-/Provider-Inspektion.

```bash
openclaw infer model run --prompt "Antworte exakt mit: smoke-ok" --json
openclaw infer model run --prompt "Fasse diesen Changelog-Eintrag zusammen" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Beschreibe dieses Bild in einem Satz" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Verwende hier ausführlicheres Reasoning" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Verwenden Sie vollständige `<provider/model>`-Referenzen mit `--local`, um einen Provider zu testen, ohne das Gateway zu starten oder die Tool-Oberfläche des Agenten zu laden:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Antworte exakt mit: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Antworte exakt mit: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Antworte exakt mit: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Antworte exakt mit: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Antworte exakt mit: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Antworte exakt mit: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Antworte exakt mit: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Beschreibe dieses Bild." --file ./photo.jpg --json
```

Hinweise:

- Das lokale `model run` ist die gezielteste CLI-Kurzprüfung für den Zustand von Provider, Modell und Authentifizierung: Für Provider außer ChatGPT-Codex sendet es nur die angegebene Anfrage.
- Das lokale `model run --model <provider/model>` kann exakte Zeilen des gebündelten statischen Katalogs auflösen – dieselben Zeilen, die `openclaw models list --all` anzeigt –, bevor dieser Provider in die Konfiguration geschrieben wird. Die Provider-Authentifizierung ist weiterhin erforderlich; fehlende Zugangsdaten führen zu Authentifizierungsfehlern, nicht zu `Unknown model`.
- Lassen Sie bei Reasoning-Prüfungen für Mistral Medium 3.5 die Temperatur ungesetzt beziehungsweise auf dem Standardwert. Mistral lehnt `reasoning_effort="high"` mit `temperature: 0` ab; verwenden Sie die Standardtemperatur oder einen Wert ungleich null wie `0.7`.
- Lokale Prüfungen mit OpenAI ChatGPT/Codex OAuth (`openai-chatgpt-responses`-API) fügen eine minimale Systemanweisung hinzu, damit der Transport sein erforderliches Feld `instructions` befüllen kann – ohne vollständigen Agentenkontext, Tools, Speicher oder Sitzungsprotokoll.
- `model run --file` hängt Bildinhalte direkt an die einzelne Benutzernachricht an. Gängige Formate (PNG, JPEG, WebP) funktionieren, wenn der MIME-Typ als `image/*` erkannt wird; nicht unterstützte oder nicht erkannte Dateien führen zu einem Fehler, bevor der Provider aufgerufen wird. Verwenden Sie stattdessen `infer image describe`, wenn Sie OpenClaws Routing und Fallbacks für Bildmodelle statt einer direkten Prüfung eines multimodalen Modells verwenden möchten.
- Das ausgewählte Modell muss Bildeingaben unterstützen; reine Textmodelle können die Anfrage auf Provider-Ebene ablehnen.
- `model run --prompt` muss Text enthalten, der nicht nur aus Leerzeichen besteht; leere Anfragen werden vor jedem Provider- oder Gateway-Aufruf abgelehnt.
- Das lokale `model run` wird mit einem Exit-Code ungleich null beendet, wenn der Provider keine Textausgabe zurückgibt, sodass nicht erreichbare Provider und leere Vervollständigungen nicht wie erfolgreiche Prüfungen erscheinen.
- Verwenden Sie `model run --gateway`, um das Gateway-Routing oder die Einrichtung der Agentenlaufzeit zu testen und dabei die Modelleingabe unverändert zu lassen. Verwenden Sie `openclaw agent` oder eine Chat-Oberfläche für den vollständigen Agentenkontext, Tools, Speicher und das Sitzungsprotokoll.
- `--thinking adaptive` wird dem Vervollständigungs-Laufzeitniveau `medium` zugeordnet; `--thinking max` wird für OpenAI-Modelle, die die native maximale Intensität unterstützen, `max` zugeordnet, andernfalls `xhigh`.
- `model auth login`, `model auth logout` und `model auth status` verwalten den gespeicherten Authentifizierungszustand des Providers.

## Bild

Erzeugung, Bearbeitung und Beschreibung.

```bash
openclaw infer image generate --prompt "freundliche Hummerillustration" --json
openclaw infer image generate --prompt "filmisches Produktfoto von Kopfhörern" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "einfacher roter Kreisaufkleber auf transparentem Hintergrund" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "kostengünstiger Plakatentwurf" --json
openclaw infer image generate --prompt "langsames Bild-Backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "Behalte das Logo bei und entferne den Hintergrund" --json
openclaw infer image edit --file ./poster.png --prompt "Gestalte dies als vertikale Story-Anzeige" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extrahiere Händler, Datum und Gesamtbetrag" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Vergleiche die Screenshots und liste sichtbare UI-Änderungen auf" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Beschreibe das Bild in einem Satz" --timeout-ms 300000 --json
```

Hinweise:

- Verwenden Sie `image edit`, wenn Sie mit vorhandenen Eingabedateien beginnen; `--size`, `--aspect-ratio` oder `--resolution` fügen bei Providern/Modellen, die sie unterstützen, Hinweise zur Geometrie hinzu.
- `--output-format png --background transparent` mit `--model openai/gpt-image-1.5` erzeugt eine OpenAI-PNG-Ausgabe mit transparentem Hintergrund; `--openai-background` ist ein OpenAI-spezifischer Alias für denselben Hinweis. Provider, die keine Hintergrundunterstützung deklarieren, melden ihn als ignorierte Überschreibung (siehe `ignoredOverrides` im [JSON-Umschlag](#json-output)).
- `--quality low|medium|high|auto` funktioniert bei Providern, die Hinweise zur Bildqualität unterstützen, einschließlich OpenAI. OpenAI akzeptiert außerdem `--openai-moderation low|auto`.
- `image providers --json` listet auf, welche gebündelten Bild-Provider auffindbar, konfiguriert und ausgewählt sind und welche Generierungs-/Bearbeitungsfunktionen sie jeweils bereitstellen.
- `image generate --model <provider/model> --json` ist der engste Live-Smoke-Test für Änderungen an der Bildgenerierung:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimales flaches Testbild: ein blaues Quadrat auf weißem Hintergrund, kein Text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Die Antwort meldet `ok`, `provider`, `model`, `attempts` und die Pfade der geschriebenen Ausgaben. Wenn `--output` festgelegt ist, kann die endgültige Erweiterung dem vom Provider zurückgegebenen MIME-Typ entsprechen.

- Verwenden Sie für `image describe` und `image describe-many` `--prompt` für eine aufgabenspezifische Anweisung (OCR, Vergleich, UI-Prüfung, knappe Bildbeschreibung).
- Verwenden Sie `--timeout-ms` für langsame lokale Vision-Modelle oder Kaltstarts von Ollama.
- Bei `image describe` wird ein explizites `--model` (muss ein bildfähiges `<provider/model>` sein) zuerst ausgeführt. Wenn dieser Aufruf fehlschlägt, werden anschließend die konfigurierten `agents.defaults.imageModel.fallbacks` versucht. Fehler bei der Eingabevorbereitung (fehlende Datei, nicht unterstützte URL) führen vor jedem Fallback-Versuch zum Fehlschlag, und das Modell muss im Modellkatalog oder in der Provider-Konfiguration als bildfähig geführt sein.
- Rufen Sie bei lokalen Ollama-Vision-Modellen zuerst das Modell ab und setzen Sie `OLLAMA_API_KEY` auf einen beliebigen Platzhalterwert, beispielsweise `ollama-local`. Siehe [Ollama](/de/providers/ollama#vision-and-image-description).

## Audio

Dateitranskription (keine Verwaltung von Echtzeitsitzungen).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Konzentrieren Sie sich auf Namen und Aktionspunkte" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` muss `<provider/model>` sein.

## TTS

Sprachsynthese sowie Status von TTS-Provider und -Persona.

```bash
openclaw infer tts convert --text "Hallo von OpenClaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Ihr Build ist abgeschlossen" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Hinweise:

- `tts status` unterstützt nur `--gateway` (es spiegelt den vom Gateway verwalteten TTS-Status wider).
- Verwenden Sie `tts providers`, `tts voices`, `tts personas`, `tts set-provider` und `tts set-persona`, um das TTS-Verhalten zu prüfen und zu konfigurieren.

## Video

Generierung und Beschreibung.

```bash
openclaw infer video generate --prompt "filmischer Sonnenuntergang über dem Meer" --json
openclaw infer video generate --prompt "langsame Drohnenaufnahme über einem Waldsee" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Hinweise:

- `video generate` akzeptiert `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` und `--timeout-ms`, die an die Laufzeitumgebung für die Videogenerierung weitergeleitet werden.
- Für `video describe` muss `--model` den Wert `<provider/model>` haben.

## Web

Suchen und Abrufen.

```bash
openclaw infer web search --query "OpenClaw-Dokumentation" --json
openclaw infer web search --query "OpenClaw-infer-Web-Provider" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` listet die verfügbaren, konfigurierten und ausgewählten Provider für Suche und Abruf auf.

## Einbettung

Vektorerstellung und Prüfung von Einbettungs-Providern.

```bash
openclaw infer embedding create --text "freundlicher Hummer" --json
openclaw infer embedding create --text "Kundensupport-Ticket: verspätete Lieferung" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON-Ausgabe

Infer-Befehle normalisieren die JSON-Ausgabe unter einem gemeinsamen Umschlag:

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

Stabile Felder auf oberster Ebene:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (mit der Anfrage gesendete Bildanhänge, sofern zutreffend)
- `outputs`
- `ignoredOverrides` (Hinweisschlüssel, die ein Provider nicht unterstützt, sofern zutreffend)
- `error`

Bei Befehlen für generierte Medien enthält `outputs` die von OpenClaw geschriebenen Dateien. Verwenden Sie für die Automatisierung `path`, `mimeType`, `size` und alle medienspezifischen Abmessungen in diesem Array, anstatt die menschenlesbare Standardausgabe zu analysieren.

## Häufige Fallstricke

```bash
# Falsch
openclaw infer media image generate --prompt "freundlicher Hummer"

# Richtig
openclaw infer image generate --prompt "freundlicher Hummer"
```

```bash
# Falsch
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Richtig
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Modelle](/de/concepts/models)
