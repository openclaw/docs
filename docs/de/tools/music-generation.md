---
read_when:
    - Musik oder Audio über den Agenten generieren
    - Musikgenerierungs-Provider und -Modelle konfigurieren
    - Die Parameter des Tools music_generate verstehen
sidebarTitle: Music generation
summary: Musik über music_generate in ComfyUI-, fal-, Google-Lyria-, MiniMax- und OpenRouter-Workflows generieren
title: Musikgenerierung
x-i18n:
    generated_at: "2026-06-27T18:19:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

Der `music_generate`-Tool ermöglicht dem Agenten, Musik oder Audio über die
gemeinsame Fähigkeit zur Musikgenerierung mit konfigurierten Providern zu
erstellen — derzeit ComfyUI, fal, Google, MiniMax und OpenRouter.

Für sitzungsgestützte Agentenläufe startet OpenClaw die Musikgenerierung als
Hintergrundaufgabe, verfolgt sie im Aufgabenprotokoll und weckt den Agenten
erneut, wenn der Track bereit ist, damit der Agent den Benutzer informieren
und das fertige Audio anhängen kann. Der Abschluss-Agent folgt dem normalen
Modus der Sitzung für sichtbare Antworten: automatische Zustellung der
endgültigen Antwort, wenn konfiguriert, oder `message(action="send")`, wenn
die Sitzung das Nachrichtentool erfordert. Wenn die anfordernde Sitzung
inaktiv ist oder ihr aktives Wecken fehlschlägt und in der Abschlussantwort
noch generiertes Audio fehlt, sendet OpenClaw einen idempotenten direkten
Fallback nur mit dem fehlenden Audio.

<Note>
Das integrierte gemeinsame Tool erscheint nur, wenn mindestens ein Provider
für Musikgenerierung verfügbar ist. Wenn Sie `music_generate` nicht in den
Tools Ihres Agenten sehen, konfigurieren Sie
`agents.defaults.musicGenerationModel` oder richten Sie einen Provider-API-Key
ein.
</Note>

## Schnellstart

<Tabs>
  <Tab title="Gemeinsam, Provider-gestützt">
    <Steps>
      <Step title="Authentifizierung konfigurieren">
        Legen Sie einen API-Key für mindestens einen Provider fest — zum
        Beispiel `GEMINI_API_KEY` oder `MINIMAX_API_KEY`.
      </Step>
      <Step title="Ein Standardmodell auswählen (optional)">
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
      <Step title="Den Agenten fragen">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Der Agent ruft `music_generate` automatisch auf. Keine
        Tool-Zulassungsliste erforderlich.
      </Step>
    </Steps>

    Für direkte synchrone Kontexte ohne sitzungsgestützten Agentenlauf fällt
    das integrierte Tool weiterhin auf Inline-Generierung zurück und gibt den
    endgültigen Medienpfad im Tool-Ergebnis zurück.

  </Tab>
  <Tab title="ComfyUI-Workflow">
    <Steps>
      <Step title="Workflow konfigurieren">
        Konfigurieren Sie `plugins.entries.comfy.config.music` mit einem
        Workflow-JSON sowie Prompt-/Ausgabeknoten.
      </Step>
      <Step title="Cloud-Authentifizierung (optional)">
        Legen Sie für Comfy Cloud `COMFY_API_KEY` oder
        `COMFY_CLOUD_API_KEY` fest.
      </Step>
      <Step title="Tool aufrufen">
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

| Provider   | Standardmodell               | Referenzeingaben | Unterstützte Steuerungen                            | Authentifizierung                       |
| ---------- | ---------------------------- | ---------------- | --------------------------------------------------- | --------------------------------------- |
| ComfyUI    | `workflow`                   | Bis zu 1 Bild    | Workflow-definierte Musik oder Audio                | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Keine            | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` oder `FAL_API_KEY`            |
| Google     | `lyria-3-clip-preview`       | Bis zu 10 Bilder | `lyrics`, `instrumental`, `format`                  | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax    | `music-2.6`                  | Keine            | `lyrics`, `instrumental`, `format=mp3`              | `MINIMAX_API_KEY` oder MiniMax OAuth    |
| OpenRouter | `google/lyria-3-pro-preview` | Bis zu 1 Bild    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                    |

### Fähigkeitsmatrix

Der explizite Modusvertrag, der von `music_generate`, Vertragstests und dem
gemeinsamen Live-Sweep verwendet wird:

| Provider   | `generate` | `edit` | Bearbeitungslimit | Gemeinsame Live-Lanes                                                      |
| ---------- | :--------: | :----: | ----------------- | -------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 Bild            | Nicht im gemeinsamen Sweep; abgedeckt durch `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Keines            | `generate`                                                                 |
| Google     |     ✓      |   ✓    | 10 Bilder         | `generate`, `edit`                                                         |
| MiniMax    |     ✓      |   —    | Keines            | `generate`                                                                 |
| OpenRouter |     ✓      |   ✓    | 1 Bild            | `generate`, `edit`                                                         |

Verwenden Sie `action: "list"`, um verfügbare gemeinsame Provider und Modelle
zur Laufzeit zu prüfen:

```text
/tool music_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive sitzungsgestützte Musikaufgabe
zu prüfen:

```text
/tool music_generate action=status
```

Beispiel für direkte Generierung:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Prompt für die Musikgenerierung. Erforderlich für `action: "generate"`.
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
  Instrumentale Ausgabe anfordern, wenn der Provider sie unterstützt.
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
  Hinweis zum Ausgabeformat, wenn der Provider ihn unterstützt.
</ParamField>
<ParamField path="filename" type="string">Hinweis zum Ausgabedateinamen.</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert harte
Grenzen wie Eingabeanzahlen dennoch vor der Übermittlung. Wenn ein Provider
Dauerangaben unterstützt, aber ein kürzeres Maximum als den angeforderten Wert
verwendet, begrenzt OpenClaw auf die nächstliegende unterstützte Dauer. Wirklich
nicht unterstützte optionale Hinweise werden mit einer Warnung ignoriert, wenn
der ausgewählte Provider oder das ausgewählte Modell sie nicht einhalten kann.
Tool-Ergebnisse melden angewendete Einstellungen; `details.normalization`
erfasst jede Zuordnung von angefordert zu angewendet.
</Note>

Provider-Anforderungs-Timeouts sind ausschließlich Operatorkonfiguration.
OpenClaw verwendet `agents.defaults.musicGenerationModel.timeoutMs`, wenn
konfiguriert, hebt Werte unter 120000ms auf 120000ms an und setzt
Provider-Anforderungen andernfalls standardmäßig auf 300000ms.

## Asynchrones Verhalten

Sitzungsgestützte Musikgenerierung läuft als Hintergrundaufgabe:

- **Hintergrundaufgabe:** `music_generate` erstellt eine Hintergrundaufgabe,
  gibt sofort eine Started-/Task-Antwort zurück und postet den fertigen Track
  später in einer nachfolgenden Agentennachricht.
- **Duplikatvermeidung:** Solange eine Aufgabe `queued` oder `running` ist,
  geben spätere `music_generate`-Aufrufe in derselben Sitzung den
  Aufgabenstatus zurück, statt eine weitere Generierung zu starten. Verwenden
  Sie `action: "status"`, um explizit zu prüfen.
- **Statusabfrage:** `openclaw tasks list` oder `openclaw tasks show <taskId>`
  prüft Status `queued`, `running` und terminale Status.
- **Abschluss-Wecken:** OpenClaw injiziert ein internes Abschlussereignis zurück
  in dieselbe Sitzung, damit das Modell die benutzerseitige Folgenachricht
  selbst schreiben kann.
- **Prompt-Hinweis:** Spätere Benutzer-/manuelle Turns in derselben Sitzung
  erhalten einen kleinen Laufzeithinweis, wenn bereits eine Musikaufgabe läuft,
  damit das Modell nicht blind erneut `music_generate` aufruft.
- **Fallback ohne Sitzung:** Direkte/lokale Kontexte ohne echte
  Agentensitzung laufen inline und geben das endgültige Audioergebnis im
  selben Turn zurück.

### Aufgabenlebenszyklus

| Status      | Bedeutung                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Aufgabe erstellt, wartet darauf, dass der Provider sie annimmt.                                |
| `running`   | Provider verarbeitet (typischerweise 30 Sekunden bis 3 Minuten, je nach Provider und Dauer).   |
| `succeeded` | Track bereit; der Agent wacht auf und postet ihn in die Unterhaltung.                          |
| `failed`    | Provider-Fehler oder Timeout; der Agent wacht mit Fehlerdetails auf.                           |

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
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
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
4. Automatische Erkennung ausschließlich mit authentifizierungsgestützten
   Provider-Standards:
   - aktueller Standard-Provider zuerst;
   - verbleibende registrierte Musikgenerierungs-Provider in Provider-ID-Reihenfolge.

Wenn ein Provider fehlschlägt, wird der nächste Kandidat automatisch versucht.
Wenn alle fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, um nur
explizite Einträge für `model`, `primary` und `fallbacks` zu verwenden.

## Provider-Hinweise

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflow-gesteuert und abhängig vom konfigurierten Graphen sowie der
    Knotenzuordnung für Prompt-/Ausgabefelder. Das gebündelte `comfy`-Plugin
    bindet sich über die Provider-Registry für Musikgenerierung in das
    gemeinsame Tool `music_generate` ein.
  </Accordion>
  <Accordion title="fal">
    Verwendet fal-Modell-Endpunkte über den gemeinsamen Provider-Auth-Pfad. Der
    gebündelte Provider verwendet standardmäßig `fal-ai/minimax-music/v2.6` und
    stellt außerdem `fal-ai/ace-step/prompt-to-audio` sowie
    `fal-ai/stable-audio-25/text-to-audio` für Prompt-to-Audio-Anforderungen
    bereit.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Verwendet Lyria-3-Batchgenerierung. Der aktuelle gebündelte Flow unterstützt
    Prompt, optionalen Liedtext und optionale Referenzbilder.
  </Accordion>
  <Accordion title="MiniMax">
    Verwendet den Batch-Endpunkt `music_generation`. Unterstützt Prompt,
    optionale Liedtexte, Instrumentalmodus und MP3-Ausgabe entweder über
    `minimax`-API-Key-Authentifizierung oder `minimax-portal` OAuth.
  </Accordion>
  <Accordion title="OpenRouter">
    Verwendet OpenRouter-Chat-Completions-Audioausgabe mit aktiviertem
    Streaming. Der gebündelte Provider verwendet standardmäßig
    `google/lyria-3-pro-preview` und stellt außerdem
    `openrouter/google/lyria-3-clip-preview` bereit.
  </Accordion>
</AccordionGroup>

## Den richtigen Pfad wählen

- **Gemeinsam, Provider-gestützt**, wenn Sie Modellauswahl, Provider-Failover
  und den integrierten asynchronen Aufgaben-/Status-Flow möchten.
- **Plugin-Pfad (ComfyUI)**, wenn Sie einen benutzerdefinierten
  Workflow-Graphen oder einen Provider benötigen, der nicht Teil der
  gemeinsamen gebündelten Musikfähigkeit ist.

Wenn Sie ComfyUI-spezifisches Verhalten debuggen, lesen Sie
[ComfyUI](/de/providers/comfy). Wenn Sie gemeinsames Provider-Verhalten
debuggen, beginnen Sie mit [fal](/de/providers/fal), [Google (Gemini)](/de/providers/google),
[MiniMax](/de/providers/minimax) oder [OpenRouter](/de/providers/openrouter).

## Provider-Fähigkeitsmodi

Der gemeinsame Vertrag für die Musikgenerierung unterstützt explizite Modusdeklarationen:

- `generate` für Generierung nur per Prompt.
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
`supportsFormat` reichen **nicht** aus, um Edit-Unterstützung anzugeben. Provider
sollten `generate` und `edit` explizit deklarieren, damit Live-Tests, Vertragstests
und das gemeinsame Tool `music_generate` die Modusunterstützung
deterministisch validieren können.

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media music
```

Diese Live-Datei verwendet standardmäßig bereits exportierte Provider-Umgebungsvariablen vor gespeicherten Auth-Profilen
und führt sowohl `generate`- als auch deklarierte `edit`-Abdeckung aus, wenn
der Provider den Edit-Modus aktiviert. Aktuelle Abdeckung:

- `google`: `generate` plus `edit`
- `fal`: nur `generate`
- `minimax`: nur `generate`
- `openrouter`: `generate` plus `edit`
- `comfy`: separate Comfy-Live-Abdeckung, nicht der gemeinsame Provider-Durchlauf

Opt-in-Live-Abdeckung für den gebündelten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Comfy-Live-Datei deckt auch Comfy-Bild- und Video-Workflows ab, wenn diese
Abschnitte konfiguriert sind.

## Verwandte Themen

- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenverfolgung für getrennte `music_generate`-Ausführungen
- [ComfyUI](/de/providers/comfy)
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — `musicGenerationModel`-Konfiguration
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Modelle](/de/concepts/models) — Modellkonfiguration und Failover
- [Tools-Übersicht](/de/tools)
