---
read_when:
    - Musik oder Audio über den Agenten erzeugen
    - Konfigurieren von Providern und Modellen für die Musikgenerierung
    - Die Parameter des Tools `music_generate` verstehen
sidebarTitle: Music generation
summary: Musik über music_generate in ComfyUI-, fal-, Google-Lyria-, MiniMax- und OpenRouter-Workflows generieren
title: Musikerzeugung
x-i18n:
    generated_at: "2026-07-24T04:13:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3f2a8a4a36e47839c7896046a556f7bf84f6c168492e2de46736635fe2a9358e
    source_path: tools/music-generation.md
    workflow: 16
---

Das Tool `music_generate` erstellt Musik oder Audio über die gemeinsame
Musikgenerierungsfunktion, unterstützt durch ComfyUI, fal, Google, MiniMax und
OpenRouter.

<Note>
`music_generate` wird nur angezeigt, wenn mindestens ein Provider für die Musikgenerierung
verfügbar ist: eine explizite `agents.defaults.mediaModels.music`-Konfiguration oder ein
für die Authentifizierung konfigurierter Provider (beispielsweise mit festgelegtem API-Schlüssel).
</Note>

Bei sitzungsgebundenen Agent-Ausführungen startet `music_generate` als Hintergrundaufgabe,
verfolgt den Fortschritt im Aufgabenprotokoll und weckt anschließend den Agent, sobald der Titel
fertig ist, damit er den Benutzer informieren und das fertige Audio anhängen kann. Der Abschluss-Agent
folgt dem Vertrag der Sitzung für sichtbare Antworten: automatische abschließende Antwort,
wenn dies konfiguriert ist, oder `message(action="send")`, wenn die Sitzung das
Nachrichten-Tool erfordert. Wenn die anfordernde Sitzung inaktiv ist oder das Wecken fehlschlägt und
das generierte Audio weiterhin in der Antwort fehlt, sendet OpenClaw einen
idempotenten direkten Fallback, der nur das fehlende Audio enthält.

## Schnellstart

<Tabs>
  <Tab title="Gemeinsam und Provider-gestützt">
    <Steps>
      <Step title="Authentifizierung konfigurieren">
        Legen Sie einen API-Schlüssel für mindestens einen Provider fest – beispielsweise
        `GEMINI_API_KEY` oder `MINIMAX_API_KEY`.
      </Step>
      <Step title="Standardmodell auswählen (optional)">
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
      <Step title="Den Agent anweisen">
        _„Erstellen Sie einen beschwingten Synthpop-Titel über eine nächtliche Fahrt durch eine
        neonbeleuchtete Stadt.“_

        Der Agent ruft `music_generate` automatisch auf. Keine
        Freigabeliste für Tools erforderlich.
      </Step>
    </Steps>

    Ohne sitzungsgebundene Agent-Ausführung (direkte/lokale Kontexte) wird das Tool
    inline ausgeführt und gibt den endgültigen Medienpfad im selben Tool-Ergebnis zurück.

  </Tab>
  <Tab title="ComfyUI-Workflow">
    <Steps>
      <Step title="Workflow konfigurieren">
        Konfigurieren Sie `plugins.entries.comfy.config.music` mit einer Workflow-
        JSON-Datei sowie Prompt- und Ausgabeknoten.
      </Step>
      <Step title="Cloud-Authentifizierung (optional)">
        Legen Sie für Comfy Cloud `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` fest.
      </Step>
      <Step title="Tool aufrufen">
        ```text
        /tool music_generate prompt="Warme Ambient-Synth-Schleife mit sanfter Bandtextur"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Beispiel-Prompts:

```text
Erstellen Sie einen filmischen Klaviertitel mit sanften Streichern und ohne Gesang.
```

```text
Erstellen Sie eine energiegeladene Chiptune-Schleife über einen Raketenstart bei Sonnenaufgang.
```

Verwenden Sie `action: "list"`, um verfügbare Provider/Modelle zu prüfen, und
`action: "status"`, um die aktive sitzungsgebundene Musikaufgabe zu prüfen:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Beispiel für direkte Generierung:

```text
/tool music_generate prompt="Verträumter Lo-Fi-Hip-Hop mit Vinyltextur und sanftem Regen" instrumental=true
```

## Unterstützte Provider

| Provider   | Standardmodell               | Referenzeingaben | Unterstützte Steuerungen                              | Authentifizierung                       |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | Bis zu 1 Bild    | Workflow-definierte Musik oder Audio                  | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Keine            | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` oder `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | Bis zu 10 Bilder | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Keine            | `lyrics`, `instrumental`, `format` (nur mp3)          | `MINIMAX_API_KEY` oder MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | Bis zu 1 Bild    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax registriert zwei Provider-IDs mit denselben Modellen: `minimax` für
API-Schlüssel-Authentifizierung und `minimax-portal` für OAuth. Modellreferenzen folgen dem Authentifizierungspfad
(`minimax/music-2.6` gegenüber `minimax-portal/music-2.6`); siehe
[MiniMax](/de/providers/minimax#music-generation).

fal stellt neben seinem standardmäßigen MiniMax-gestützten Modell auch
`fal-ai/ace-step/prompt-to-audio` (wav, keine Liedtexte, kein
Instrumental-Umschalter) und `fal-ai/stable-audio-25/text-to-audio` (wav,
nur Prompt) bereit. Googles Standardmodell `lyria-3-clip-preview` gibt ausschließlich mp3 aus;
`lyria-3-pro-preview` unterstützt außerdem wav. MiniMax stellt außerdem `music-2.6-free`,
`music-cover` und `music-cover-free` bereit. OpenRouter stellt außerdem
`google/lyria-3-clip-preview` bereit.

### Funktionsmatrix

Der explizite Modusvertrag, der von `music_generate`, Vertragstests und dem
gemeinsamen Live-Durchlauf verwendet wird:

| Provider   | `generate` | `edit` | Bearbeitungslimit | Gemeinsame Live-Testläufe                                                |
| ---------- | :--------: | :----: | ----------------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 Bild            | Nicht im gemeinsamen Durchlauf; abgedeckt durch `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Keines            | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 Bilder         | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | Keines            | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 Bild            | `generate`, `edit`                                                        |

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Prompt für die Musikgenerierung. Für `action: "generate"` erforderlich.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` gibt die aktuelle Sitzungsaufgabe zurück; `"list"` prüft Provider.
</ParamField>
<ParamField path="model" type="string">
  Überschreibung von Provider/Modell (z. B. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionale Liedtexte, wenn der Provider eine explizite Liedtexteingabe unterstützt.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Fordert eine ausschließlich instrumentale Ausgabe an, wenn der Provider dies unterstützt.
</ParamField>
<ParamField path="image" type="string">
  Pfad oder URL eines einzelnen Referenzbilds.
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

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert vor der
Übermittlung weiterhin feste Grenzwerte wie die Anzahl der Eingaben. Wenn ein Provider
eine Dauer unterstützt, jedoch einen kürzeren Höchstwert als den angeforderten Wert verwendet,
begrenzt OpenClaw diesen auf die nächstgelegene unterstützte Dauer. Tatsächlich nicht unterstützte optionale Hinweise
werden mit einer Warnung ignoriert, wenn der ausgewählte Provider oder das Modell sie nicht
berücksichtigen kann. Tool-Ergebnisse melden die angewendeten Einstellungen; `details.normalization`
erfasst jede Zuordnung vom angeforderten zum angewendeten Wert.
</Note>

Zeitüberschreitungen für Provider-Anfragen sind ausschließlich eine Betreiberkonfiguration. OpenClaw verwendet
`agents.defaults.mediaModels.music.timeoutMs`, wenn dies konfiguriert ist, erhöht
Werte unter 120000ms auf 120000ms und verwendet andernfalls für Provider-Anfragen standardmäßig
300000ms.

## Asynchrones Verhalten

Sitzungsgebundene Musikgenerierung wird als Hintergrundaufgabe ausgeführt:

- **Hintergrundaufgabe:** `music_generate` erstellt eine Hintergrundaufgabe, gibt
  sofort eine Start-/Aufgabenantwort zurück und veröffentlicht den fertigen Titel später in
  einer nachfolgenden Agent-Nachricht.
- **Duplikatvermeidung:** Solange eine Aufgabe `queued` oder `running` ist, geben spätere
  `music_generate`-Aufrufe in derselben Sitzung den Aufgabenstatus zurück, anstatt
  eine weitere Generierung zu starten. Verwenden Sie `action: "status"`, um dies explizit zu prüfen.
  Eine kürzlich abgeschlossene übereinstimmende Anfrage wird ebenfalls für 2 Minuten dedupliziert.
- **Statusabfrage:** `openclaw tasks list` oder `openclaw tasks show <taskId>`
  prüft den Status in der Warteschlange, während der Ausführung und nach Abschluss.
- **Wecken bei Abschluss:** OpenClaw fügt ein internes Abschlussereignis wieder
  in dieselbe Sitzung ein, sodass das Modell die benutzerseitige Folgenachricht
  selbst verfassen kann.
- **Prompt-Hinweis:** Spätere Benutzer-/manuelle Interaktionen in derselben Sitzung erhalten einen kurzen
  Laufzeithinweis, wenn bereits eine Musikaufgabe läuft, sodass das Modell
  `music_generate` nicht unbesehen erneut aufruft.
- **Fallback ohne Sitzung:** Direkte/lokale Kontexte ohne eine echte Agent-
  Sitzung werden inline ausgeführt und geben das endgültige Audioergebnis in derselben Interaktion zurück.

### Aufgabenlebenszyklus

Die Musikaufgabe stellt dieselben Zustände wie die allgemeine Aufgabenregistrierung bereit (siehe
[Hintergrundaufgaben](/de/automation/tasks#task-lifecycle) für den vollständigen Zustandsautomaten,
einschließlich `timed_out`, `cancelled` und `lost`). Die meisten Musikausführungen
durchlaufen:

| Status      | Bedeutung                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Aufgabe erstellt; wartet darauf, dass der Provider sie annimmt.                                |
| `running`   | Der Provider verarbeitet sie (typischerweise 30 Sekunden bis 3 Minuten, abhängig von Provider und Dauer). |
| `succeeded` | Titel bereit; der Agent wird geweckt und veröffentlicht ihn in der Unterhaltung.               |
| `failed`    | Provider-Fehler oder Zeitüberschreitung; der Agent wird mit Fehlerdetails geweckt.              |

Prüfen Sie den Status über die CLI:

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

### Reihenfolge der Provider-Auswahl

OpenClaw versucht Provider in dieser Reihenfolge:

1. `model`-Parameter aus dem Tool-Aufruf (falls der Agent einen angibt).
2. `musicGenerationModel.primary` aus der Konfiguration.
3. `musicGenerationModel.fallbacks` der Reihe nach.
4. Automatische Erkennung ausschließlich anhand der Authentifizierung gestützter Provider-Standardwerte:
   - zuerst der aktuelle Standard-Provider für Textmodelle, falls er ebenfalls
     Musikgenerierung anbietet;
   - anschließend die verbleibenden registrierten Provider für Musikgenerierung, alphabetisch nach
     Provider-ID.

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle
fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Der automatische Fallback zwischen authentifizierten Providern ist immer aktiviert. Ein
`model` pro Aufruf bleibt maßgeblich.

## Hinweise zu Providern

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflow-gesteuert und abhängig vom konfigurierten Graphen sowie der Node-Zuordnung
    für Eingabeaufforderungs-/Ausgabefelder. Das mitgelieferte `comfy` Plugin bindet sich über die
    Registry der Provider für die Musikgenerierung in das gemeinsame
    `music_generate`-Tool ein.
  </Accordion>
  <Accordion title="fal">
    Verwendet fal-Modellendpunkte über den gemeinsamen Provider-Authentifizierungspfad. Der
    mitgelieferte Provider verwendet standardmäßig `fal-ai/minimax-music/v2.6` und stellt außerdem
    `fal-ai/ace-step/prompt-to-audio` und
    `fal-ai/stable-audio-25/text-to-audio` für Anfragen zur Audioerzeugung aus Eingabeaufforderungen bereit.
    Liedtexte und der Instrumentalmodus sind ausschließlich für das MiniMax-Modell verfügbar; die beiden anderen
    Modelle unterstützen nur Eingabeaufforderungen.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Verwendet die Batch-Generierung von Lyria 3. Der aktuelle mitgelieferte Ablauf unterstützt
    Eingabeaufforderungen, optionalen Liedtext und optionale Referenzbilder. Das
    standardmäßige Modell `lyria-3-clip-preview` gibt ausschließlich mp3 aus; das
    Modell `lyria-3-pro-preview` unterstützt außerdem wav.
  </Accordion>
  <Accordion title="MiniMax">
    Verwendet den Batch-Endpunkt `music_generation`. Unterstützt Eingabeaufforderungen, optionale
    Liedtexte, den Instrumentalmodus und die mp3-Ausgabe entweder über die API-Schlüssel-Authentifizierung
    `minimax` oder `minimax-portal` OAuth. Stellt außerdem die Modelle `music-2.6-free`,
    `music-cover` und `music-cover-free` bereit.
  </Accordion>
  <Accordion title="OpenRouter">
    Verwendet die Audioausgabe der OpenRouter-Chatvervollständigung bei aktiviertem Streaming. Der
    mitgelieferte Provider verwendet standardmäßig `google/lyria-3-pro-preview` und stellt außerdem
    `openrouter/google/lyria-3-clip-preview` bereit.
  </Accordion>
</AccordionGroup>

## Den richtigen Pfad wählen

- **Gemeinsam und Provider-gestützt**, wenn Sie Modellauswahl, Provider-
  Failover und den integrierten asynchronen Aufgaben-/Statusablauf benötigen.
- **Plugin-Pfad (ComfyUI)**, wenn Sie einen benutzerdefinierten Workflow-Graphen oder einen
  Provider benötigen, der nicht Teil der gemeinsamen mitgelieferten Musikfunktion ist.

Wenn Sie ComfyUI-spezifisches Verhalten debuggen, lesen Sie
[ComfyUI](/de/providers/comfy). Wenn Sie das Verhalten gemeinsamer Provider
debuggen, beginnen Sie mit [fal](/de/providers/fal), [Google (Gemini)](/de/providers/google),
[MiniMax](/de/providers/minimax) oder [OpenRouter](/de/providers/openrouter).

## Funktionsmodi der Provider

Der gemeinsame Vertrag für die Musikgenerierung unterstützt explizite Modusdeklarationen:

- `generate` für die Generierung nur aus Eingabeaufforderungen.
- `edit`, wenn die Anfrage mindestens ein Referenzbild enthält.

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

Veraltete flache Felder wie `maxInputImages`, `supportsLyrics` und
`supportsFormat` reichen **nicht** aus, um Bearbeitungsunterstützung anzugeben. Provider
sollten `generate` und `edit` explizit deklarieren, damit Live-Tests, Vertragstests
und das gemeinsame `music_generate`-Tool die Modusunterstützung
deterministisch validieren können.

## Live-Tests

Optional aktivierbare Live-Abdeckung für die gemeinsam mitgelieferten Provider (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Entsprechender Repo-Wrapper, der dieselbe Testdatei ausführt:

```bash
pnpm test:live:media:music
```

Diese Live-Datei verwendet standardmäßig bereits exportierte Provider-Umgebungsvariablen vor gespeicherten
Authentifizierungsprofilen und führt sowohl die Abdeckung für `generate` als auch für deklarierte `edit` aus, wenn
der Provider den Bearbeitungsmodus aktiviert. Aktuelle Abdeckung:

- `google`: `generate` sowie `edit`
- `fal`: nur `generate`
- `minimax`: nur `generate`
- `openrouter`: `generate` sowie `edit`
- `comfy`: separate Comfy-Live-Abdeckung, nicht Teil des gemeinsamen Provider-Durchlaufs

Optional aktivierbare Live-Abdeckung für den mitgelieferten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Comfy-Live-Datei deckt außerdem Comfy-Workflows für Bilder und Videos ab, wenn diese
Abschnitte konfiguriert sind.

## Verwandte Themen

- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenverfolgung für getrennt ausgeführte `music_generate`-Läufe
- [ComfyUI](/de/providers/comfy)
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — `musicGenerationModel`-Konfiguration
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Modelle](/de/concepts/models) — Modellkonfiguration und Failover
- [Tool-Übersicht](/de/tools)
