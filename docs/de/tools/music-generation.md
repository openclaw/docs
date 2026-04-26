---
read_when:
    - Musik oder Audio über den Agent generieren
    - Provider und Modelle für Musikgenerierung konfigurieren
    - Die Parameter des Tools `music_generate` verstehen
sidebarTitle: Music generation
summary: Musik über `music_generate` mit Google Lyria, MiniMax und ComfyUI-Workflows generieren
title: Musikgenerierung
x-i18n:
    generated_at: "2026-04-26T11:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

Das Tool `music_generate` ermöglicht dem Agent, Musik oder Audio über die
gemeinsame Funktion zur Musikgenerierung mit konfigurierten Providern zu erzeugen — heute
Google, MiniMax und workflow-konfiguriertes ComfyUI.

Für sitzungsgebundene Agent-Läufe startet OpenClaw die Musikgenerierung als
Hintergrundaufgabe, verfolgt sie im Aufgabenprotokoll und weckt den Agent dann erneut,
wenn der Track fertig ist, damit der Agent das fertige Audio wieder im
ursprünglichen Kanal posten kann.

<Note>
Das integrierte gemeinsame Tool erscheint nur, wenn mindestens ein Provider für Musikgenerierung
verfügbar ist. Wenn Sie `music_generate` nicht in den Tools Ihres Agent sehen, konfigurieren Sie `agents.defaults.musicGenerationModel` oder richten Sie einen
API-Schlüssel für einen Provider ein.
</Note>

## Schnellstart

<Tabs>
  <Tab title="Gemeinsamer providergestützter Pfad">
    <Steps>
      <Step title="Authentifizierung konfigurieren">
        Setzen Sie einen API-Schlüssel für mindestens einen Provider — zum Beispiel
        `GEMINI_API_KEY` oder `MINIMAX_API_KEY`.
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
      <Step title="Den Agent fragen">
        _„Erzeuge einen mitreißenden Synthpop-Track über eine nächtliche Fahrt durch eine
        Neonstadt.“_

        Der Agent ruft `music_generate` automatisch auf. Kein
        Tool-Allowlisting erforderlich.
      </Step>
    </Steps>

    Für direkte synchrone Kontexte ohne sitzungsgebundenen Agent-Lauf
    fällt das integrierte Tool weiterhin auf Inline-Generierung zurück und gibt
    den finalen Medienpfad im Tool-Ergebnis zurück.

  </Tab>
  <Tab title="ComfyUI-Workflow">
    <Steps>
      <Step title="Den Workflow konfigurieren">
        Konfigurieren Sie `plugins.entries.comfy.config.music` mit einem Workflow-
        JSON und Prompt-/Output-Nodes.
      </Step>
      <Step title="Cloud-Authentifizierung (optional)">
        Für Comfy Cloud setzen Sie `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Das Tool aufrufen">
        ```text
        /tool music_generate prompt="Warme Ambient-Synth-Schleife mit weicher Tape-Textur"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Beispiel-Prompts:

```text
Erzeuge einen cineastischen Klavier-Track mit weichen Streichern und ohne Gesang.
```

```text
Erzeuge eine energiegeladene Chiptune-Schleife über den Start einer Rakete bei Sonnenaufgang.
```

## Unterstützte Provider

| Provider | Standardmodell         | Referenzeingaben | Unterstützte Steuerungen                                 | Auth                                   |
| -------- | ---------------------- | ---------------- | -------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Bis zu 1 Bild    | Workflow-definierte Musik oder Audio                     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Bis zu 10 Bilder | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Keine            | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` oder MiniMax OAuth   |

### Matrix der Fähigkeiten

Der explizite Modusvertrag, der von `music_generate`, Vertragstests und dem
gemeinsamen Live-Sweep verwendet wird:

| Provider | `generate` | `edit` | Edit-Limit | Gemeinsame Live-Lanes                                                     |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 Bild     | Nicht im gemeinsamen Sweep; abgedeckt durch `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 Bilder  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Keine      | `generate`                                                                |

Verwenden Sie `action: "list"`, um verfügbare gemeinsame Provider und Modelle
zur Laufzeit zu prüfen:

```text
/tool music_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive sitzungsgebundene Musikaufgabe zu prüfen:

```text
/tool music_generate action=status
```

Beispiel für direkte Generierung:

```text
/tool music_generate prompt="Verträumter Lo-fi-Hip-Hop mit Vinyl-Textur und sanftem Regen" instrumental=true
```

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Prompt für die Musikgenerierung. Erforderlich für `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` gibt die aktuelle Sitzungsaufgabe zurück; `"list"` prüft Provider.
</ParamField>
<ParamField path="model" type="string">
  Überschreibung für Provider/Modell (z. B. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionale Liedtexte, wenn der Provider explizite Texteingabe unterstützt.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Nur instrumentale Ausgabe anfordern, wenn der Provider dies unterstützt.
</ParamField>
<ParamField path="image" type="string">
  Einzelner Referenzbildpfad oder URL.
</ParamField>
<ParamField path="images" type="string[]">
  Mehrere Referenzbilder (bis zu 10 bei unterstützenden Providern).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Ziel-Dauer in Sekunden, wenn der Provider Dauerhinweise unterstützt.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Hinweis auf das Ausgabeformat, wenn der Provider dies unterstützt.
</ParamField>
<ParamField path="filename" type="string">Hinweis für den Ausgabedateinamen.</ParamField>
<ParamField path="timeoutMs" type="number">Optionales Timeout für Provider-Anfragen in Millisekunden.</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert weiterhin harte
Grenzen wie die Anzahl der Eingaben vor dem Absenden. Wenn ein Provider Dauer unterstützt,
aber ein niedrigeres Maximum als angefordert verwendet, begrenzt OpenClaw auf die nächstliegende unterstützte Dauer. Wirklich nicht unterstützte optionale Hinweise
werden mit einer Warnung ignoriert, wenn der ausgewählte Provider oder das Modell sie nicht umsetzen kann. Tool-Ergebnisse melden angewendete Einstellungen; `details.normalization`
erfasst jede Abbildung von angefordert auf angewendet.
</Note>

## Asynchrones Verhalten

Sitzungsgebundene Musikgenerierung läuft als Hintergrundaufgabe:

- **Hintergrundaufgabe:** `music_generate` erstellt eine Hintergrundaufgabe, gibt sofort eine
  Antwort „gestartet/Aufgabe“ zurück und postet den fertigen Track später in
  einer Folge-Nachricht des Agent.
- **Verhinderung von Duplikaten:** Solange eine Aufgabe `queued` oder `running` ist, geben spätere
  `music_generate`-Aufrufe in derselben Sitzung den Aufgabenstatus zurück, statt
  eine weitere Generierung zu starten. Verwenden Sie `action: "status"` für eine explizite Prüfung.
- **Statusabfrage:** Mit `openclaw tasks list` oder `openclaw tasks show <taskId>`
  prüfen Sie Status wie queued, running und terminal.
- **Wecksignal bei Abschluss:** OpenClaw injiziert ein internes Abschlussereignis zurück
  in dieselbe Sitzung, damit das Modell selbst die benutzerseitige Folge-
  Nachricht schreiben kann.
- **Prompt-Hinweis:** Spätere Benutzer-/manuelle Durchläufe in derselben Sitzung erhalten einen kleinen
  Laufzeithinweis, wenn bereits eine Musikaufgabe läuft, damit das Modell
  nicht blind erneut `music_generate` aufruft.
- **Fallback ohne Sitzung:** Direkte/lokale Kontexte ohne echte Agent-
  Sitzung laufen inline und geben das finale Audioergebnis in demselben Durchlauf zurück.

### Aufgabenlebenszyklus

| Status      | Bedeutung                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Aufgabe erstellt, wartet darauf, dass der Provider sie annimmt.                                |
| `running`   | Der Provider verarbeitet sie (typischerweise 30 Sekunden bis 3 Minuten, je nach Provider und Dauer). |
| `succeeded` | Track ist bereit; der Agent wird geweckt und postet ihn in die Konversation.                   |
| `failed`    | Provider-Fehler oder Timeout; der Agent wird mit Fehlerdetails geweckt.                        |

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

### Reihenfolge der Providerauswahl

OpenClaw versucht Provider in dieser Reihenfolge:

1. Parameter `model` aus dem Tool-Aufruf (wenn der Agent einen angibt).
2. `musicGenerationModel.primary` aus der Konfiguration.
3. `musicGenerationModel.fallbacks` in Reihenfolge.
4. Automatische Erkennung nur mit auth-gestützten Provider-Standards:
   - zuerst aktueller Standard-Provider;
   - dann verbleibende registrierte Provider für Musikgenerierung in der Reihenfolge der Provider-IDs.

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle
fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, um nur
explizite Einträge in `model`, `primary` und `fallbacks` zu verwenden.

## Hinweise zu Providern

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflow-gesteuert und abhängig vom konfigurierten Graphen plus Node-Zuordnung
    für Prompt-/Output-Felder. Das mitgelieferte Plugin `comfy` wird über das Register
    der Provider für Musikgenerierung in das gemeinsame Tool `music_generate`
    eingebunden.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Verwendet Batch-Generierung mit Lyria 3. Der aktuell mitgelieferte Ablauf unterstützt
    Prompt, optionalen Liedtext und optionale Referenzbilder.
  </Accordion>
  <Accordion title="MiniMax">
    Verwendet den Batch-Endpunkt `music_generation`. Unterstützt Prompt, optionale
    Liedtexte, instrumentalen Modus, Steuerung der Dauer und mp3-Ausgabe über
    entweder `minimax`-Authentifizierung per API-Schlüssel oder OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Den richtigen Pfad wählen

- **Gemeinsamer providergestützter Pfad**, wenn Sie Modellauswahl, Provider-
  Failover und den integrierten asynchronen Aufgaben-/Status-Ablauf möchten.
- **Plugin-Pfad (ComfyUI)**, wenn Sie einen benutzerdefinierten Workflow-Graphen oder einen
  Provider benötigen, der nicht Teil der gemeinsamen integrierten Musikfunktion ist.

Wenn Sie ComfyUI-spezifisches Verhalten debuggen, siehe
[ComfyUI](/de/providers/comfy). Wenn Sie gemeinsames Provider-
Verhalten debuggen, beginnen Sie mit [Google (Gemini)](/de/providers/google) oder
[MiniMax](/de/providers/minimax).

## Provider-Fähigkeitsmodi

Der gemeinsame Vertrag für Musikgenerierung unterstützt explizite Modus-Deklarationen:

- `generate` für Generierung nur auf Basis eines Prompts.
- `edit`, wenn die Anfrage ein oder mehrere Referenzbilder enthält.

Neue Provider-Implementierungen sollten explizite Modus-Blöcke bevorzugen:

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

Ältere flache Felder wie `maxInputImages`, `supportsLyrics` und
`supportsFormat` reichen **nicht** aus, um Unterstützung für `edit` zu bewerben. Provider
sollten `generate` und `edit` explizit deklarieren, damit Live-Tests, Vertragstests und das gemeinsame Tool `music_generate` die Modusunterstützung
deterministisch validieren können.

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsamen mitgelieferten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media music
```

Diese Live-Datei lädt fehlende Provider-Env-Variablen aus `~/.profile`, bevorzugt
standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen und führt sowohl
`generate` als auch deklarierte `edit`-Abdeckung aus, wenn der Provider den Edit-
Modus aktiviert. Heutige Abdeckung:

- `google`: `generate` plus `edit`
- `minimax`: nur `generate`
- `comfy`: separate Comfy-Live-Abdeckung, nicht der gemeinsame Provider-Sweep

Opt-in-Live-Abdeckung für den mitgelieferten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Comfy-Live-Datei deckt auch Bild- und Video-Workflows von Comfy ab, wenn diese
Abschnitte konfiguriert sind.

## Verwandt

- [Hintergrundaufgaben](/de/automation/tasks) — Nachverfolgung von Aufgaben für getrennte `music_generate`-Läufe
- [ComfyUI](/de/providers/comfy)
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Konfiguration `musicGenerationModel`
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Modelle](/de/concepts/models) — Modellkonfiguration und Failover
- [Tools overview](/de/tools)
