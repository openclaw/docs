---
read_when:
    - Musik oder Audio über den Agenten generieren
    - Provider und Modelle für Musikgenerierung konfigurieren
    - Die Parameter des Tools `music_generate` verstehen
summary: Musik mit gemeinsamen Providern generieren, einschließlich workflowgestützter Plugins
title: Musikgenerierung
x-i18n:
    generated_at: "2026-04-25T13:58:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

Das Tool `music_generate` ermöglicht es dem Agenten, Musik oder Audio über die
gemeinsame Musikgenerierungsfunktion mit konfigurierten Providern wie Google,
MiniMax und workflowkonfiguriertem ComfyUI zu erzeugen.

Bei agentengestützten Sitzungen mit gemeinsamen Providern startet OpenClaw die Musikgenerierung als
Hintergrundtask, verfolgt sie im Task-Ledger und weckt den Agenten dann erneut,
wenn der Track bereit ist, damit der Agent das fertige Audio zurück in den
ursprünglichen Kanal posten kann.

<Note>
Das eingebaute gemeinsame Tool erscheint nur dann, wenn mindestens ein Provider für Musikgenerierung verfügbar ist. Wenn Sie `music_generate` nicht in den Tools Ihres Agenten sehen, konfigurieren Sie `agents.defaults.musicGenerationModel` oder richten Sie einen API-Key für einen Provider ein.
</Note>

## Schnellstart

### Gemeinsame providergestützte Generierung

1. Setzen Sie für mindestens einen Provider einen API-Key, zum Beispiel `GEMINI_API_KEY` oder
   `MINIMAX_API_KEY`.
2. Setzen Sie optional Ihr bevorzugtes Modell:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. Bitten Sie den Agenten: _„Generate an upbeat synthpop track about a night drive
   through a neon city.“_

Der Agent ruft `music_generate` automatisch auf. Kein Allow-Listing für Tools erforderlich.

Bei direkten synchronen Kontexten ohne agentengestützten Lauf mit Sitzungsbindung
fällt das eingebaute Tool weiterhin auf Inline-Generierung zurück und gibt den endgültigen Medienpfad im Tool-Ergebnis zurück.

Beispiel-Prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Workflowgestützte Comfy-Generierung

Das gebündelte Plugin `comfy` bindet sich über die Registry für Provider der Musikgenerierung
in das gemeinsame Tool `music_generate` ein.

1. Konfigurieren Sie `plugins.entries.comfy.config.music` mit einem Workflow-JSON und
   Prompt-/Output-Nodes.
2. Wenn Sie Comfy Cloud verwenden, setzen Sie `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY`.
3. Bitten Sie den Agenten um Musik oder rufen Sie das Tool direkt auf.

Beispiel:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Unterstützung durch gemeinsame gebündelte Provider

| Provider | Standardmodell        | Referenzeingaben | Unterstützte Steuerungen                                 | API-Key                                |
| -------- | --------------------- | ---------------- | -------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`            | Bis zu 1 Bild    | Workflowdefinierte Musik oder Audio                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Bis zu 10 Bilder | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`           | Keine            | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                    |

### Deklarierte Fähigkeitsmatrix

Dies ist der explizite Mode-Vertrag, der von `music_generate`, Vertragstests
und dem gemeinsamen Live-Sweep verwendet wird.

| Provider | `generate` | `edit` | Edit-Limit | Gemeinsame Live-Lanes                                                     |
| -------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  | Ja         | Ja     | 1 Bild     | Nicht im gemeinsamen Sweep; abgedeckt durch `extensions/comfy/comfy.live.test.ts` |
| Google   | Ja         | Ja     | 10 Bilder  | `generate`, `edit`                                                        |
| MiniMax  | Ja         | Nein   | Keines     | `generate`                                                                |

Verwenden Sie `action: "list"`, um verfügbare gemeinsame Provider und Modelle
zur Laufzeit zu prüfen:

```text
/tool music_generate action=list
```

Verwenden Sie `action: "status"`, um den aktiven sitzungsgebundenen Musik-Task zu prüfen:

```text
/tool music_generate action=status
```

Beispiel für direkte Generierung:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parameter des eingebauten Tools

| Parameter         | Typ      | Beschreibung                                                                                 |
| ----------------- | -------- | -------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt für die Musikgenerierung (erforderlich für `action: "generate"`)                     |
| `action`          | string   | `"generate"` (Standard), `"status"` für den aktuellen Sitzungs-Task oder `"list"` zur Prüfung von Providern |
| `model`           | string   | Override für Provider/Modell, z. B. `google/lyria-3-pro-preview` oder `comfy/workflow`      |
| `lyrics`          | string   | Optionale Liedtexte, wenn der Provider explizite Texteingabe für Lyrics unterstützt          |
| `instrumental`    | boolean  | Nur instrumentale Ausgabe anfordern, wenn der Provider dies unterstützt                      |
| `image`           | string   | Einzelner Referenzbildpfad oder URL                                                          |
| `images`          | string[] | Mehrere Referenzbilder (bis zu 10)                                                           |
| `durationSeconds` | number   | Gewünschte Dauer in Sekunden, wenn der Provider Dauerhinweise unterstützt                    |
| `timeoutMs`       | number   | Optionales Timeout für Provider-Anfragen in Millisekunden                                    |
| `format`          | string   | Hinweis auf das Ausgabeformat (`mp3` oder `wav`), wenn der Provider dies unterstützt         |
| `filename`        | string   | Hinweis auf den Ausgabedateinamen                                                            |

Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert harte Limits
wie die Anzahl der Eingaben weiterhin vor dem Absenden. Wenn ein Provider Dauer unterstützt, aber
ein kürzeres Maximum als den angeforderten Wert verwendet, begrenzt OpenClaw
automatisch auf die nächstunterstützte Dauer. Wirklich nicht unterstützte optionale Hinweise werden
mit einer Warnung ignoriert, wenn der ausgewählte Provider oder das ausgewählte Modell sie nicht berücksichtigen kann.

Tool-Ergebnisse geben die angewendeten Einstellungen an. Wenn OpenClaw die Dauer während eines Provider-Fallbacks begrenzt, spiegelt das zurückgegebene `durationSeconds` den abgesendeten Wert wider und `details.normalization.durationSeconds` zeigt die Zuordnung von angefordert zu angewendet.

## Asynchrones Verhalten für den gemeinsamen providergestützten Pfad

- Agentenläufe mit Sitzungsbindung: `music_generate` erstellt einen Hintergrundtask, gibt sofort eine Antwort mit gestartetem Task/Task-Status zurück und postet den fertigen Track später in einer Folge-Nachricht des Agenten.
- Vermeidung von Duplikaten: Solange dieser Hintergrundtask im Status `queued` oder `running` ist, geben spätere `music_generate`-Aufrufe in derselben Sitzung den Task-Status zurück, statt eine neue Generierung zu starten.
- Statusabfrage: Verwenden Sie `action: "status"`, um den aktiven sitzungsgebundenen Musik-Task zu prüfen, ohne eine neue Generierung zu starten.
- Task-Verfolgung: Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um den Status `queued`, `running` und Terminalstatus der Generierung zu prüfen.
- Aufwecken bei Abschluss: OpenClaw injiziert ein internes Abschlussereignis zurück in dieselbe Sitzung, damit das Modell selbst die benutzerseitige Folge-Nachricht schreiben kann.
- Prompt-Hinweis: Spätere Benutzer-/manuelle Züge in derselben Sitzung erhalten einen kleinen Laufzeit-Hinweis, wenn bereits ein Musik-Task läuft, damit das Modell nicht blind erneut `music_generate` aufruft.
- Fallback ohne Sitzung: Direkte/lokale Kontexte ohne echte Agentensitzung laufen weiterhin inline und geben das finale Audio-Ergebnis im selben Zug zurück.

### Task-Lebenszyklus

Jede Anfrage an `music_generate` durchläuft vier Zustände:

1. **queued** -- Task erstellt und wartet darauf, dass der Provider ihn annimmt.
2. **running** -- Provider verarbeitet den Task (typischerweise 30 Sekunden bis 3 Minuten, abhängig von Provider und Dauer).
3. **succeeded** -- Track ist bereit; der Agent wird geweckt und postet ihn in die Konversation.
4. **failed** -- Provider-Fehler oder Timeout; der Agent wird mit Fehlerdetails geweckt.

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Vermeidung von Duplikaten: Wenn für die aktuelle Sitzung bereits ein Musik-Task `queued` oder `running` ist, gibt `music_generate` den bestehenden Task-Status zurück, statt einen neuen zu starten. Verwenden Sie `action: "status"`, um explizit zu prüfen, ohne eine neue Generierung auszulösen.

## Konfiguration

### Modellauswahl

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Reihenfolge der Providerauswahl

Bei der Generierung von Musik versucht OpenClaw Provider in dieser Reihenfolge:

1. Parameter `model` aus dem Tool-Aufruf, falls der Agent einen angibt
2. `musicGenerationModel.primary` aus der Konfiguration
3. `musicGenerationModel.fallbacks` in Reihenfolge
4. Auto-Erkennung nur mit auth-gestützten Standardwerten für Provider:
   - zuerst der aktuelle Standard-Provider
   - danach die übrigen registrierten Provider für Musikgenerierung in der Reihenfolge ihrer Provider-IDs

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle fehlschlagen, enthält der
Fehler Details zu jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn Sie möchten,
dass die Musikgenerierung nur die expliziten Einträge `model`, `primary` und `fallbacks`
verwendet.

## Hinweise zu Providern

- Google verwendet Lyria 3 Batch-Generierung. Der aktuell gebündelte Flow unterstützt
  Prompt, optionalen Liedtext und optionale Referenzbilder.
- MiniMax verwendet den Batch-Endpunkt `music_generation`. Der aktuell gebündelte Flow
  unterstützt Prompt, optionale Lyrics, Instrumentalmodus, Steuerung der Dauer und
  mp3-Ausgabe.
- Die Unterstützung für ComfyUI ist workflowgesteuert und hängt vom konfigurierten Graphen plus
  Node-Mapping für Prompt-/Output-Felder ab.

## Modi für Provider-Fähigkeiten

Der gemeinsame Vertrag für Musikgenerierung unterstützt jetzt explizite Modus-Deklarationen:

- `generate` für promptbasierte Generierung
- `edit`, wenn die Anfrage ein oder mehrere Referenzbilder enthält

Neue Implementierungen von Providern sollten explizite Modus-Blöcke bevorzugen:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Veraltete flache Felder wie `maxInputImages`, `supportsLyrics` und
`supportsFormat` reichen nicht aus, um Edit-Unterstützung zu bewerben. Provider sollten
`generate` und `edit` explizit deklarieren, damit Live-Tests, Vertragstests und
das gemeinsame Tool `music_generate` die Unterstützung des Modus deterministisch validieren können.

## Den richtigen Pfad wählen

- Verwenden Sie den gemeinsamen providergestützten Pfad, wenn Sie Modellauswahl, Provider-Failover und den eingebauten asynchronen Task-/Status-Flow möchten.
- Verwenden Sie einen Plugin-Pfad wie ComfyUI, wenn Sie einen benutzerdefinierten Workflow-Graphen oder einen Provider benötigen, der nicht Teil der gemeinsamen gebündelten Fähigkeit zur Musikgenerierung ist.
- Wenn Sie ComfyUI-spezifisches Verhalten debuggen, siehe [ComfyUI](/de/providers/comfy). Wenn Sie gemeinsames Provider-Verhalten debuggen, beginnen Sie mit [Google (Gemini)](/de/providers/google) oder [MiniMax](/de/providers/minimax).

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repository-Wrapper:

```bash
pnpm test:live:media music
```

Diese Live-Datei lädt fehlende Provider-Umgebungsvariablen aus `~/.profile`, bevorzugt
standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen und führt sowohl
`generate`- als auch deklarierte `edit`-Abdeckung aus, wenn der Provider den Edit-Modus aktiviert.

Das bedeutet heute:

- `google`: `generate` plus `edit`
- `minimax`: nur `generate`
- `comfy`: separate Comfy-Live-Abdeckung, nicht Teil des gemeinsamen Provider-Sweeps

Opt-in-Live-Abdeckung für den gebündelten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Comfy-Live-Datei deckt außerdem Workflows für Bilder und Videos in Comfy ab, wenn diese
Abschnitte konfiguriert sind.

## Verwandt

- [Background Tasks](/de/automation/tasks) - Task-Verfolgung für losgelöste `music_generate`-Läufe
- [Configuration Reference](/de/gateway/config-agents#agent-defaults) - Konfiguration von `musicGenerationModel`
- [ComfyUI](/de/providers/comfy)
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Models](/de/concepts/models) - Modellkonfiguration und Failover
- [Tools Overview](/de/tools)
