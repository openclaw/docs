---
read_when:
    - Musik oder Audio über den Agenten generieren
    - Musikgenerierungs-Provider und -Modelle konfigurieren
    - Die Parameter des Tools music_generate verstehen
sidebarTitle: Music generation
summary: Musik über music_generate in Google Lyria-, MiniMax- und ComfyUI-Workflows generieren
title: Musikgenerierung
x-i18n:
    generated_at: "2026-05-02T21:04:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

Das Tool `music_generate` ermöglicht es dem Agent, Musik oder Audio über die
gemeinsame Musikgenerierungsfunktion mit konfigurierten Providern zu erstellen —
heute Google, MiniMax und per Workflow konfigurierte ComfyUI.

Für sitzungsbasierte Agent-Ausführungen startet OpenClaw die Musikgenerierung als
Hintergrundaufgabe, verfolgt sie im Task-Ledger und weckt den Agent erneut,
wenn der Track bereit ist, damit der Agent das fertige Audio wieder in den
ursprünglichen Kanal posten kann.

<Note>
Das integrierte gemeinsame Tool erscheint nur, wenn mindestens ein
Musikgenerierungs-Provider verfügbar ist. Wenn Sie `music_generate` nicht in den
Tools Ihres Agent sehen, konfigurieren Sie `agents.defaults.musicGenerationModel`
oder richten Sie einen Provider-API-Schlüssel ein.
</Note>

## Schnellstart

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        Legen Sie einen API-Schlüssel für mindestens einen Provider fest — zum
        Beispiel `GEMINI_API_KEY` oder `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
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
      </Step>
      <Step title="Ask the agent">
        _„Erzeuge einen schwungvollen Synthpop-Track über eine Nachtfahrt durch
        eine Neonstadt.“_

        Der Agent ruft `music_generate` automatisch auf. Es ist keine
        Tool-Zulassungsliste erforderlich.
      </Step>
    </Steps>

    Für direkte synchrone Kontexte ohne sitzungsbasierte Agent-Ausführung fällt
    das integrierte Tool weiterhin auf Inline-Generierung zurück und gibt den
    finalen Medienpfad im Tool-Ergebnis zurück.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Konfigurieren Sie `plugins.entries.comfy.config.music` mit einem Workflow-
        JSON sowie Prompt- und Ausgabeknoten.
      </Step>
      <Step title="Cloud auth (optional)">
        Legen Sie für Comfy Cloud `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` fest.
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Beispiel-Prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Unterstützte Provider

| Provider | Standardmodell         | Referenzeingaben | Unterstützte Steuerelemente                              | Authentifizierung                      |
| -------- | ---------------------- | ---------------- | -------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Bis zu 1 Bild    | Workflow-definierte Musik oder Audio                     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Bis zu 10 Bilder | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Keine            | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` oder MiniMax OAuth   |

### Funktionsmatrix

Der explizite Modusvertrag, der von `music_generate`, Vertragstests und dem
gemeinsamen Live-Sweep verwendet wird:

| Provider | `generate` | `edit` | Bearbeitungslimit | Gemeinsame Live-Lanes                                                      |
| -------- | :--------: | :----: | ----------------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 Bild            | Nicht im gemeinsamen Sweep; abgedeckt durch `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 Bilder         | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Keine             | `generate`                                                                |

Verwenden Sie `action: "list"`, um verfügbare gemeinsame Provider und Modelle zur
Laufzeit zu prüfen:

```text
/tool music_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive sitzungsbasierte Musikaufgabe zu
prüfen:

```text
/tool music_generate action=status
```

Beispiel für direkte Generierung:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Prompt zur Musikgenerierung. Erforderlich für `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` gibt die aktuelle Sitzungsaufgabe zurück; `"list"` prüft Provider.
</ParamField>
<ParamField path="model" type="string">
  Provider-/Modell-Überschreibung (z. B. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionale Liedtexte, wenn der Provider explizite Liedtexteingabe unterstützt.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Fordert eine rein instrumentale Ausgabe an, wenn der Provider dies unterstützt.
</ParamField>
<ParamField path="image" type="string">
  Einzelner Referenzbildpfad oder URL.
</ParamField>
<ParamField path="images" type="string[]">
  Mehrere Referenzbilder (bis zu 10 bei unterstützenden Providern).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Zieldauer in Sekunden, wenn der Provider Dauerhinweise unterstützt.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Hinweis zum Ausgabeformat, wenn der Provider dies unterstützt.
</ParamField>
<ParamField path="filename" type="string">Hinweis zum Ausgabedateinamen.</ParamField>
<ParamField path="timeoutMs" type="number">Optionales Zeitlimit für Provider-Anfragen in Millisekunden. Werte unter 10000ms werden auf 10000ms angehoben und im Tool-Ergebnis gemeldet.</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert weiterhin
harte Grenzen wie Eingabeanzahlen vor der Übermittlung. Wenn ein Provider eine
Dauer unterstützt, aber ein kürzeres Maximum als den angeforderten Wert verwendet,
begrenzt OpenClaw auf die nächstliegende unterstützte Dauer. Wirklich nicht
unterstützte optionale Hinweise werden mit einer Warnung ignoriert, wenn der
ausgewählte Provider oder das ausgewählte Modell sie nicht erfüllen kann.
Tool-Ergebnisse melden die angewendeten Einstellungen; `details.normalization`
erfasst jede Zuordnung von angefordert zu angewendet.
</Note>

## Asynchrones Verhalten

Sitzungsbasierte Musikgenerierung wird als Hintergrundaufgabe ausgeführt:

- **Hintergrundaufgabe:** `music_generate` erstellt eine Hintergrundaufgabe,
  gibt sofort eine gestartet-/Aufgaben-Antwort zurück und postet den fertigen
  Track später in einer nachfolgenden Agent-Nachricht.
- **Vermeidung von Duplikaten:** Solange eine Aufgabe `queued` oder `running`
  ist, geben spätere `music_generate`-Aufrufe in derselben Sitzung den
  Aufgabenstatus zurück, anstatt eine weitere Generierung zu starten. Verwenden
  Sie `action: "status"`, um explizit zu prüfen.
- **Statusabfrage:** `openclaw tasks list` oder `openclaw tasks show <taskId>`
  prüft wartende, laufende und terminale Status.
- **Abschluss-Wecken:** OpenClaw injiziert ein internes Abschlussereignis zurück
  in dieselbe Sitzung, damit das Modell die nutzerseitige Folgenachricht selbst
  schreiben kann.
- **Prompt-Hinweis:** Spätere Benutzer-/manuelle Turns in derselben Sitzung
  erhalten einen kleinen Laufzeithinweis, wenn bereits eine Musikaufgabe läuft,
  damit das Modell `music_generate` nicht blind erneut aufruft.
- **Fallback ohne Sitzung:** Direkte/lokale Kontexte ohne echte Agent-Sitzung
  laufen inline und geben das finale Audioergebnis im selben Turn zurück.

### Aufgabenlebenszyklus

| Status      | Bedeutung                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Aufgabe erstellt, wartet darauf, dass der Provider sie annimmt.                                |
| `running`   | Provider verarbeitet sie (typischerweise 30 Sekunden bis 3 Minuten, abhängig von Provider und Dauer). |
| `succeeded` | Track bereit; der Agent wacht auf und postet ihn in die Unterhaltung.                          |
| `failed`    | Provider-Fehler oder Zeitlimit; der Agent wacht mit Fehlerdetails auf.                         |

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

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

### Provider-Auswahlreihenfolge

OpenClaw versucht Provider in dieser Reihenfolge:

1. `model`-Parameter aus dem Tool-Aufruf (wenn der Agent einen angibt).
2. `musicGenerationModel.primary` aus der Konfiguration.
3. `musicGenerationModel.fallbacks` der Reihe nach.
4. Automatische Erkennung nur anhand authentifizierungsbasierter Provider-Standards:
   - aktueller Standard-Provider zuerst;
   - übrige registrierte Musikgenerierungs-Provider in Provider-ID-Reihenfolge.

Wenn ein Provider fehlschlägt, wird der nächste Kandidat automatisch versucht.
Wenn alle fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, um nur
explizite `model`-, `primary`- und `fallbacks`-Einträge zu verwenden.

## Provider-Hinweise

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflow-gesteuert und abhängig vom konfigurierten Graphen sowie der
    Knotenzuordnung für Prompt-/Ausgabefelder. Das gebündelte `comfy`-Plugin
    bindet sich über die Provider-Registry für Musikgenerierung in das gemeinsame
    Tool `music_generate` ein.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Verwendet Lyria-3-Batch-Generierung. Der aktuelle gebündelte Flow unterstützt
    Prompt, optionalen Liedtext und optionale Referenzbilder.
  </Accordion>
  <Accordion title="MiniMax">
    Verwendet den Batch-Endpunkt `music_generation`. Unterstützt Prompt,
    optionale Liedtexte, Instrumentalmodus, Dauersteuerung und mp3-Ausgabe über
    entweder `minimax`-API-Schlüssel-Authentifizierung oder `minimax-portal` OAuth.
  </Accordion>
</AccordionGroup>

## Den richtigen Pfad wählen

- **Shared provider-backed**, wenn Sie Modellauswahl, Provider-Failover und den
  integrierten asynchronen Aufgaben-/Status-Flow möchten.
- **Plugin-Pfad (ComfyUI)**, wenn Sie einen benutzerdefinierten Workflow-Graphen
  oder einen Provider benötigen, der nicht Teil der gemeinsamen gebündelten
  Musikfunktion ist.

Wenn Sie ComfyUI-spezifisches Verhalten debuggen, siehe
[ComfyUI](/de/providers/comfy). Wenn Sie gemeinsames Provider-Verhalten debuggen,
beginnen Sie mit [Google (Gemini)](/de/providers/google) oder
[MiniMax](/de/providers/minimax).

## Provider-Funktionsmodi

Der gemeinsame Musikgenerierungsvertrag unterstützt explizite Modusdeklarationen:

- `generate` für reine Prompt-Generierung.
- `edit`, wenn die Anfrage ein oder mehrere Referenzbilder enthält.

Neue Provider-Implementierungen sollten explizite Modusblöcke bevorzugen:

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

Legacy-Flachfelder wie `maxInputImages`, `supportsLyrics` und
`supportsFormat` reichen **nicht** aus, um Bearbeitungsunterstützung zu
bewerben. Provider sollten `generate` und `edit` explizit deklarieren, damit
Live-Tests, Vertragstests und das gemeinsame Tool `music_generate` die
Modusunterstützung deterministisch validieren können.

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media music
```

Diese Live-Datei lädt fehlende Provider-Umgebungsvariablen aus `~/.profile`,
bevorzugt standardmäßig Live-/Env-API-Schlüssel vor gespeicherten
Authentifizierungsprofilen und führt sowohl `generate`- als auch deklarierte
`edit`-Abdeckung aus, wenn der Provider den Bearbeitungsmodus aktiviert. Aktuelle
Abdeckung:

- `google`: `generate` plus `edit`
- `minimax`: nur `generate`
- `comfy`: separate Comfy-Live-Abdeckung, nicht der gemeinsame Provider-Sweep

Opt-in-Live-Abdeckung für den gebündelten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Comfy-Live-Datei behandelt auch Comfy-Bild- und Video-Workflows, wenn diese
Abschnitte konfiguriert sind.

## Verwandte Themen

- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenverfolgung für entkoppelte `music_generate`-Läufe
- [ComfyUI](/de/providers/comfy)
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — `musicGenerationModel`-Konfiguration
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Modelle](/de/concepts/models) — Modellkonfiguration und Failover
- [Tools-Übersicht](/de/tools)
