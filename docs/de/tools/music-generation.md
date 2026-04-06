---
read_when:
    - Musik oder Audio über den Agenten generieren
    - Provider und Modelle für die Musikgenerierung konfigurieren
    - Die Parameter des Tools `music_generate` verstehen
summary: Musik mit gemeinsamen Providern generieren, einschließlich workflowgestützter Plugins
title: Musikgenerierung
x-i18n:
    generated_at: "2026-04-06T03:13:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: a03de8aa75cfb7248eb0c1d969fb2a6da06117967d097e6f6e95771d0f017ae1
    source_path: tools/music-generation.md
    workflow: 15
---

# Musikgenerierung

Das Tool `music_generate` ermöglicht es dem Agenten, Musik oder Audio über die
gemeinsame Capability zur Musikgenerierung mit konfigurierten Providern wie Google,
MiniMax und workflowkonfiguriertem ComfyUI zu erstellen.

Für agentengestützte Sitzungen mit gemeinsamen Providern startet OpenClaw die Musikgenerierung als
Hintergrundaufgabe, verfolgt sie im Task-Ledger und weckt den Agenten anschließend erneut auf, wenn
der Track bereit ist, damit der Agent das fertige Audio wieder im ursprünglichen
Channel posten kann.

<Note>
Das integrierte gemeinsame Tool erscheint nur, wenn mindestens ein Provider für Musikgenerierung verfügbar ist. Wenn Sie `music_generate` nicht in den Tools Ihres Agenten sehen, konfigurieren Sie `agents.defaults.musicGenerationModel` oder richten Sie einen API-Schlüssel für einen Provider ein.
</Note>

## Schnellstart

### Generierung über gemeinsame Provider

1. Legen Sie für mindestens einen Provider einen API-Schlüssel fest, zum Beispiel `GEMINI_API_KEY` oder
   `MINIMAX_API_KEY`.
2. Legen Sie optional Ihr bevorzugtes Modell fest:

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

3. Fragen Sie den Agenten: _„Erzeuge einen beschwingten Synthpop-Track über eine nächtliche Fahrt
   durch eine Neonstadt.“_

Der Agent ruft `music_generate` automatisch auf. Kein Tool-Allowlisting erforderlich.

Für direkte synchrone Kontexte ohne eine agentengestützte Sitzung fällt das integrierte
Tool weiterhin auf Inline-Generierung zurück und gibt den endgültigen Medienpfad im
Tool-Ergebnis zurück.

Beispiel-Prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Workflowgesteuerte Comfy-Generierung

Das gebündelte Plugin `comfy` wird über die Registry für Musikgenerierungs-Provider in das gemeinsame Tool `music_generate` eingebunden.

1. Konfigurieren Sie `models.providers.comfy.music` mit einer Workflow-JSON und
   Prompt-/Output-Nodes.
2. Wenn Sie Comfy Cloud verwenden, setzen Sie `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY`.
3. Fragen Sie den Agenten nach Musik oder rufen Sie das Tool direkt auf.

Beispiel:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Unterstützung durch gemeinsame gebündelte Provider

| Provider | Standardmodell        | Referenzeingaben  | Unterstützte Steuerungen                                | API-Schlüssel                           |
| -------- | --------------------- | ----------------- | ------------------------------------------------------- | --------------------------------------- |
| ComfyUI  | `workflow`            | Bis zu 1 Bild     | Workflowdefinierte Musik oder Audio                     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| Google   | `lyria-3-clip-preview`| Bis zu 10 Bilder  | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax  | `music-2.5+`          | Keine             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                    |

Verwenden Sie `action: "list"`, um verfügbare gemeinsame Provider und Modelle zur
Laufzeit zu prüfen:

```text
/tool music_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive musikbezogene Aufgabe der aktuellen Sitzung zu prüfen:

```text
/tool music_generate action=status
```

Beispiel für direkte Generierung:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parameter des integrierten Tools

| Parameter         | Typ      | Beschreibung                                                                                         |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt für die Musikgenerierung (erforderlich für `action: "generate"`)                              |
| `action`          | string   | `"generate"` (Standard), `"status"` für die aktuelle Sitzungsaufgabe oder `"list"` zum Prüfen von Providern |
| `model`           | string   | Override für Provider/Modell, z. B. `google/lyria-3-pro-preview` oder `comfy/workflow`              |
| `lyrics`          | string   | Optionale Liedtexte, wenn der Provider explizite Texteingaben unterstützt                            |
| `instrumental`    | boolean  | Nur instrumentale Ausgabe anfordern, wenn der Provider dies unterstützt                              |
| `image`           | string   | Einzelner Pfad oder URL eines Referenzbilds                                                          |
| `images`          | string[] | Mehrere Referenzbilder (bis zu 10)                                                                   |
| `durationSeconds` | number   | Zieldauer in Sekunden, wenn der Provider Dauerhinweise unterstützt                                   |
| `format`          | string   | Hinweis zum Ausgabeformat (`mp3` oder `wav`), wenn der Provider dies unterstützt                     |
| `filename`        | string   | Hinweis für den Ausgabedateinamen                                                                    |

Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert weiterhin harte Grenzen
wie Eingabeanzahlen vor dem Senden, aber nicht unterstützte optionale Hinweise werden
mit einer Warnung ignoriert, wenn der ausgewählte Provider oder das Modell sie nicht einhalten kann.

## Asynchrones Verhalten für den gemeinsamen providergestützten Pfad

- Agentengestützte Sitzungen: `music_generate` erstellt eine Hintergrundaufgabe, gibt sofort eine Antwort zum gestarteten Task zurück und postet den fertigen Track später in einer nachfolgenden Agentennachricht.
- Verhinderung von Duplikaten: Solange diese Hintergrundaufgabe noch `queued` oder `running` ist, geben spätere `music_generate`-Aufrufe in derselben Sitzung den Task-Status zurück, statt eine weitere Generierung zu starten.
- Statusabfrage: Verwenden Sie `action: "status"`, um die aktive musikbezogene Aufgabe der Sitzung zu prüfen, ohne eine neue zu starten.
- Task-Verfolgung: Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um den Status `queued`, `running` und Endzustände der Generierung zu prüfen.
- Aufwecken bei Abschluss: OpenClaw injiziert ein internes Abschlussereignis zurück in dieselbe Sitzung, damit das Modell selbst die benutzerseitige Folgemeldung schreiben kann.
- Prompt-Hinweis: Spätere Benutzer-/manuelle Turns in derselben Sitzung erhalten einen kleinen Laufzeithinweis, wenn bereits eine Musikaufgabe läuft, damit das Modell nicht blind erneut `music_generate` aufruft.
- Fallback ohne Sitzung: Direkte/lokale Kontexte ohne echte Agentensitzung laufen weiterhin inline und geben das endgültige Audioergebnis im selben Turn zurück.

## Konfiguration

### Modellauswahl

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Reihenfolge der Providerauswahl

Beim Generieren von Musik versucht OpenClaw Provider in dieser Reihenfolge:

1. Parameter `model` aus dem Tool-Aufruf, falls der Agent einen angibt
2. `musicGenerationModel.primary` aus der Konfiguration
3. `musicGenerationModel.fallbacks` in Reihenfolge
4. Automatische Erkennung nur mit auth-gestützten Provider-Standards:
   - zuerst der aktuelle Standardprovider
   - dann die übrigen registrierten Provider für Musikgenerierung in Provider-ID-Reihenfolge

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle fehlschlagen, enthält der
Fehler Details aus jedem Versuch.

## Hinweise zu Providern

- Google verwendet Lyria-3-Batch-Generierung. Der aktuell gebündelte Flow unterstützt
  Prompt, optionalen Liedtext und optionale Referenzbilder.
- MiniMax verwendet den Batch-Endpunkt `music_generation`. Der aktuell gebündelte Flow
  unterstützt Prompt, optionale Liedtexte, Instrumentalmodus, Steuerung der Dauer und
  mp3-Ausgabe.
- Die Unterstützung für ComfyUI ist workflowgesteuert und hängt vom konfigurierten Graphen sowie
  vom Node-Mapping für Prompt-/Output-Felder ab.

## Den richtigen Pfad wählen

- Verwenden Sie den gemeinsamen providergestützten Pfad, wenn Sie Modellauswahl, Provider-Failover und den integrierten asynchronen Task-/Status-Flow möchten.
- Verwenden Sie einen Plugin-Pfad wie ComfyUI, wenn Sie einen benutzerdefinierten Workflow-Graphen oder einen Provider benötigen, der nicht Teil der gemeinsamen gebündelten Capability zur Musikgenerierung ist.
- Wenn Sie ComfyUI-spezifisches Verhalten debuggen, siehe [ComfyUI](/providers/comfy). Wenn Sie gemeinsames Provider-Verhalten debuggen, beginnen Sie mit [Google (Gemini)](/de/providers/google) oder [MiniMax](/de/providers/minimax).

## Live-Tests

Optionale Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Optionale Live-Abdeckung für den gebündelten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Comfy-Live-Datei deckt außerdem Comfy-Bild- und Video-Workflows ab, wenn diese
Abschnitte konfiguriert sind.

## Verwandt

- [Hintergrundaufgaben](/de/automation/tasks) - Task-Verfolgung für entkoppelte `music_generate`-Läufe
- [Konfigurationsreferenz](/de/gateway/configuration-reference#agent-defaults) - Konfiguration von `musicGenerationModel`
- [ComfyUI](/providers/comfy)
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Models](/de/concepts/models) - Modellkonfiguration und Failover
- [Tools-Übersicht](/de/tools)
