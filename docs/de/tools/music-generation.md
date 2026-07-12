---
read_when:
    - Musik oder Audio über den Agenten generieren
    - Musikgenerierungs-Provider und -Modelle konfigurieren
    - Die Parameter des Tools `music_generate` verstehen
sidebarTitle: Music generation
summary: Musik über music_generate in ComfyUI-, fal-, Google-Lyria-, MiniMax- und OpenRouter-Workflows generieren
title: Musikerzeugung
x-i18n:
    generated_at: "2026-07-12T15:58:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

Das Tool `music_generate` erstellt Musik oder Audio über die gemeinsame
Funktion zur Musikgenerierung, die von ComfyUI, fal, Google, MiniMax und
OpenRouter unterstützt wird.

<Note>
`music_generate` wird nur angezeigt, wenn mindestens ein Provider für die
Musikgenerierung verfügbar ist: eine explizite Konfiguration für
`agents.defaults.musicGenerationModel` oder ein für die Authentifizierung
konfigurierter Provider (zum Beispiel mit gesetztem API-Schlüssel).
</Note>

Bei sitzungsgebundenen Agent-Ausführungen startet `music_generate` als
Hintergrundaufgabe, verfolgt den Fortschritt im Aufgabenprotokoll und weckt
anschließend den Agent, sobald der Titel bereit ist, damit er den Benutzer
informieren und das fertige Audio anhängen kann. Der Abschluss-Agent folgt
dem Vertrag der Sitzung für sichtbare Antworten: eine automatische
abschließende Antwort, wenn dies konfiguriert ist, oder
`message(action="send")`, wenn die Sitzung das Nachrichtentool erfordert.
Wenn die anfragende Sitzung inaktiv ist oder das Aufwecken fehlschlägt und
das generierte Audio weiterhin in der Antwort fehlt, sendet OpenClaw einen
idempotenten direkten Fallback, der nur das fehlende Audio enthält.

## Schnellstart

<Tabs>
  <Tab title="Gemeinsam und Provider-gestützt">
    <Steps>
      <Step title="Authentifizierung konfigurieren">
        Legen Sie einen API-Schlüssel für mindestens einen Provider fest —
        zum Beispiel `GEMINI_API_KEY` oder `MINIMAX_API_KEY`.
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
        _„Erzeuge einen schwungvollen Synthpop-Titel über eine nächtliche
        Fahrt durch eine neonbeleuchtete Stadt.“_

        Der Agent ruft `music_generate` automatisch auf. Eine Aufnahme in
        die Tool-Zulassungsliste ist nicht erforderlich.
      </Step>
    </Steps>

    Ohne eine sitzungsgebundene Agent-Ausführung (in direkten/lokalen
    Kontexten) wird das Tool direkt ausgeführt und gibt den endgültigen
    Medienpfad im selben Tool-Ergebnis zurück.

  </Tab>
  <Tab title="ComfyUI-Workflow">
    <Steps>
      <Step title="Workflow konfigurieren">
        Konfigurieren Sie `plugins.entries.comfy.config.music` mit einem
        Workflow-JSON sowie Prompt- und Ausgabeknoten.
      </Step>
      <Step title="Cloud-Authentifizierung (optional)">
        Legen Sie für Comfy Cloud `COMFY_API_KEY` oder
        `COMFY_CLOUD_API_KEY` fest.
      </Step>
      <Step title="Tool aufrufen">
        ```text
        /tool music_generate prompt="Warme Ambient-Synthesizer-Schleife mit sanfter Bandtextur"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Beispiel-Prompts:

```text
Erzeuge einen filmischen Klaviertitel mit sanften Streichern und ohne Gesang.
```

```text
Erzeuge eine energiegeladene Chiptune-Schleife über einen Raketenstart bei Sonnenaufgang.
```

Verwenden Sie `action: "list"`, um verfügbare Provider/Modelle anzuzeigen,
und `action: "status"`, um die aktive sitzungsgebundene Musikaufgabe
anzuzeigen:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Beispiel für direkte Generierung:

```text
/tool music_generate prompt="Verträumter Lo-Fi-Hip-Hop mit Vinyltextur und sanftem Regen" instrumental=true
```

## Unterstützte Provider

| Provider   | Standardmodell               | Referenzeingaben   | Unterstützte Steuerungen                               | Authentifizierung                       |
| ---------- | ---------------------------- | ------------------ | ------------------------------------------------------ | --------------------------------------- |
| ComfyUI    | `workflow`                   | Bis zu 1 Bild      | Workflow-definierte Musik oder Audio                   | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| fal        | `fal-ai/minimax-music/v2.6`  | Keine              | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `FAL_KEY` oder `FAL_API_KEY`            |
| Google     | `lyria-3-clip-preview`       | Bis zu 10 Bilder   | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax    | `music-2.6`                  | Keine              | `lyrics`, `instrumental`, `format` (nur mp3)           | `MINIMAX_API_KEY` oder MiniMax OAuth    |
| OpenRouter | `google/lyria-3-pro-preview` | Bis zu 1 Bild      | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `OPENROUTER_API_KEY`                    |

MiniMax registriert zwei Provider-IDs, die dieselben Modelle verwenden:
`minimax` für die Authentifizierung per API-Schlüssel und `minimax-portal`
für OAuth. Modellreferenzen folgen dem Authentifizierungspfad
(`minimax/music-2.6` gegenüber `minimax-portal/music-2.6`); siehe
[MiniMax](/de/providers/minimax#music-generation).

fal stellt neben seinem standardmäßigen, von MiniMax gestützten Modell auch
`fal-ai/ace-step/prompt-to-audio` (wav, keine Liedtexte, kein Schalter für
Instrumentalmusik) und `fal-ai/stable-audio-25/text-to-audio` (wav, nur
Prompt) bereit. Googles Standardmodell `lyria-3-clip-preview` gibt
ausschließlich mp3 aus; `lyria-3-pro-preview` unterstützt außerdem wav.
MiniMax stellt auch `music-2.6-free`, `music-cover` und `music-cover-free`
bereit. OpenRouter stellt außerdem `google/lyria-3-clip-preview` bereit.

### Funktionsmatrix

Der explizite Modusvertrag, den `music_generate`, Vertragstests und der
gemeinsame Live-Durchlauf verwenden:

| Provider   | `generate` | `edit` | Bearbeitungslimit | Gemeinsame Live-Testläufe                                                 |
| ---------- | :--------: | :----: | ----------------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 Bild            | Nicht im gemeinsamen Durchlauf; abgedeckt durch `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Keines             | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 Bilder          | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | Keines             | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 Bild             | `generate`, `edit`                                                        |

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Prompt für die Musikgenerierung. Für `action: "generate"` erforderlich.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` gibt die aktuelle Sitzungsaufgabe zurück; `"list"` zeigt
  Provider an.
</ParamField>
<ParamField path="model" type="string">
  Überschreibung von Provider/Modell (z. B. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionale Liedtexte, wenn der Provider eine explizite Liedtexteingabe
  unterstützt.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Fordert eine rein instrumentale Ausgabe an, wenn der Provider dies
  unterstützt.
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
  Hinweis zum Ausgabeformat, wenn der Provider es unterstützt.
</ParamField>
<ParamField path="filename" type="string">Hinweis zum Ausgabedateinamen.</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert vor dem
Absenden dennoch feste Grenzen wie die Anzahl der Eingaben. Wenn ein
Provider eine Dauer unterstützt, aber einen niedrigeren Höchstwert als den
angeforderten Wert verwendet, begrenzt OpenClaw die Dauer auf den
nächstgelegenen unterstützten Wert. Tatsächlich nicht unterstützte optionale
Hinweise werden mit einer Warnung ignoriert, wenn der ausgewählte Provider
oder das Modell sie nicht berücksichtigen kann. Tool-Ergebnisse melden die
angewendeten Einstellungen; `details.normalization` erfasst jede Zuordnung
von angeforderten zu angewendeten Werten.
</Note>

Zeitüberschreitungen für Provider-Anfragen sind ausschließlich eine
Betreiberkonfiguration. OpenClaw verwendet
`agents.defaults.musicGenerationModel.timeoutMs`, wenn dies konfiguriert
ist, erhöht Werte unter 120000ms auf 120000ms und verwendet andernfalls für
Provider-Anfragen standardmäßig 300000ms.

## Asynchrones Verhalten

Die sitzungsgebundene Musikgenerierung wird als Hintergrundaufgabe
ausgeführt:

- **Hintergrundaufgabe:** `music_generate` erstellt eine
  Hintergrundaufgabe, gibt sofort eine Antwort mit Start-/Aufgabenstatus
  zurück und veröffentlicht den fertigen Titel später in einer
  nachfolgenden Agent-Nachricht.
- **Vermeidung von Duplikaten:** Solange eine Aufgabe `queued` oder
  `running` ist, geben spätere `music_generate`-Aufrufe in derselben Sitzung
  den Aufgabenstatus zurück, statt eine weitere Generierung zu starten.
  Verwenden Sie `action: "status"`, um dies ausdrücklich zu prüfen. Eine
  kürzlich abgeschlossene, übereinstimmende Anfrage wird ebenfalls
  2 Minuten lang dedupliziert.
- **Statusabfrage:** `openclaw tasks list` oder
  `openclaw tasks show <taskId>` zeigt den Status wartender, laufender und
  abgeschlossener Aufgaben an.
- **Aufwecken bei Abschluss:** OpenClaw fügt ein internes Abschlussereignis
  wieder in dieselbe Sitzung ein, sodass das Modell die benutzerseitige
  Folgenachricht selbst verfassen kann.
- **Prompt-Hinweis:** Spätere Benutzer-/manuelle Interaktionen in derselben
  Sitzung erhalten einen kleinen Laufzeithinweis, wenn bereits eine
  Musikaufgabe ausgeführt wird, damit das Modell nicht unbedacht erneut
  `music_generate` aufruft.
- **Fallback ohne Sitzung:** Direkte/lokale Kontexte ohne echte
  Agent-Sitzung werden direkt ausgeführt und geben das endgültige
  Audioergebnis im selben Durchgang zurück.

### Aufgabenlebenszyklus

Die Musikaufgabe zeigt dieselben Zustände wie die allgemeine
Aufgabenregistrierung (siehe
[Hintergrundaufgaben](/de/automation/tasks#task-lifecycle) für die vollständige
Zustandsmaschine einschließlich `timed_out`, `cancelled` und `lost`). Die
meisten Musikgenerierungen durchlaufen:

| Zustand     | Bedeutung                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Aufgabe erstellt; wartet darauf, dass der Provider sie annimmt.                               |
| `running`   | Der Provider verarbeitet sie (typischerweise 30 Sekunden bis 3 Minuten, abhängig von Provider und Dauer). |
| `succeeded` | Titel ist bereit; der Agent wird aufgeweckt und veröffentlicht ihn in der Unterhaltung.       |
| `failed`    | Provider-Fehler oder Zeitüberschreitung; der Agent wird mit Fehlerdetails aufgeweckt.          |

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

OpenClaw probiert Provider in dieser Reihenfolge aus:

1. Parameter `model` aus dem Tool-Aufruf (wenn der Agent einen angibt).
2. `musicGenerationModel.primary` aus der Konfiguration.
3. `musicGenerationModel.fallbacks` in der angegebenen Reihenfolge.
4. Automatische Erkennung ausschließlich anhand der Standardwerte von
   Providern mit konfigurierter Authentifizierung:
   - zuerst der aktuelle Standard-Provider des Textmodells, sofern er auch
     Musikgenerierung anbietet;
   - anschließend die übrigen registrierten Provider für Musikgenerierung,
     alphabetisch nach Provider-ID.

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat
ausprobiert. Wenn alle fehlschlagen, enthält der Fehler Details zu jedem
Versuch.

Legen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false` fest,
um ausschließlich explizite Einträge für `model`, `primary` und `fallbacks`
zu verwenden.

## Hinweise zu Providern

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflow-gesteuert und abhängig vom konfigurierten Graphen sowie der Node-Zuordnung
    für Prompt-/Ausgabefelder. Das gebündelte `comfy`-Plugin bindet sich über die
    Registry der Provider für die Musikgenerierung in das gemeinsame Tool
    `music_generate` ein.
  </Accordion>
  <Accordion title="fal">
    Verwendet fal-Modellendpunkte über den gemeinsamen Authentifizierungspfad des Providers. Der
    gebündelte Provider verwendet standardmäßig `fal-ai/minimax-music/v2.6` und stellt außerdem
    `fal-ai/ace-step/prompt-to-audio` und
    `fal-ai/stable-audio-25/text-to-audio` für Prompt-zu-Audio-Anfragen bereit.
    Liedtexte und der Instrumentalmodus sind ausschließlich für MiniMax-Modelle verfügbar; die anderen beiden
    Modelle unterstützen nur Prompts.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Verwendet die Batch-Generierung von Lyria 3. Der aktuelle gebündelte Ablauf unterstützt
    einen Prompt, optionalen Liedtext und optionale Referenzbilder. Das
    Standardmodell `lyria-3-clip-preview` gibt ausschließlich mp3 aus; das
    Modell `lyria-3-pro-preview` unterstützt außerdem wav.
  </Accordion>
  <Accordion title="MiniMax">
    Verwendet den Batch-Endpunkt `music_generation`. Unterstützt Prompt, optionale
    Liedtexte, Instrumentalmodus und mp3-Ausgabe entweder über
    `minimax`-API-Schlüssel-Authentifizierung oder `minimax-portal`-OAuth. Stellt außerdem die Modelle
    `music-2.6-free`, `music-cover` und `music-cover-free` bereit.
  </Accordion>
  <Accordion title="OpenRouter">
    Verwendet die Audioausgabe von OpenRouter-Chat-Completions mit aktiviertem Streaming. Der
    gebündelte Provider verwendet standardmäßig `google/lyria-3-pro-preview` und stellt außerdem
    `openrouter/google/lyria-3-clip-preview` bereit.
  </Accordion>
</AccordionGroup>

## Den richtigen Pfad wählen

- **Gemeinsamer, Provider-gestützter Pfad**, wenn Sie Modellauswahl, Provider-
  Failover und den integrierten asynchronen Aufgaben-/Statusablauf benötigen.
- **Plugin-Pfad (ComfyUI)**, wenn Sie einen benutzerdefinierten Workflow-Graphen oder einen
  Provider benötigen, der nicht Teil der gemeinsamen gebündelten Musikfunktion ist.

Wenn Sie ComfyUI-spezifisches Verhalten debuggen, lesen Sie
[ComfyUI](/de/providers/comfy). Wenn Sie das Verhalten gemeinsamer Provider
debuggen, beginnen Sie mit [fal](/de/providers/fal), [Google (Gemini)](/de/providers/google),
[MiniMax](/de/providers/minimax) oder [OpenRouter](/de/providers/openrouter).

## Fähigkeitsmodi der Provider

Der gemeinsame Vertrag für die Musikgenerierung unterstützt explizite Modusdeklarationen:

- `generate` für die Generierung ausschließlich anhand eines Prompts.
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

Veraltete flache Felder wie `maxInputImages`, `supportsLyrics` und
`supportsFormat` reichen **nicht** aus, um Bearbeitungsunterstützung anzugeben. Provider
sollten `generate` und `edit` explizit deklarieren, damit Live-Tests, Vertragstests
und das gemeinsame Tool `music_generate` die Modusunterstützung
deterministisch validieren können.

## Live-Tests

Optional aktivierbare Live-Testabdeckung für die gemeinsamen gebündelten Provider (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Äquivalenter Repository-Wrapper, der dieselbe Testdatei ausführt:

```bash
pnpm test:live:media:music
```

Diese Live-Datei verwendet standardmäßig bereits exportierte Provider-Umgebungsvariablen
vor gespeicherten Authentifizierungsprofilen und führt sowohl die Abdeckung für `generate` als auch
für deklariertes `edit` aus, wenn der Provider den Bearbeitungsmodus aktiviert. Aktuelle Abdeckung:

- `google`: `generate` plus `edit`
- `fal`: nur `generate`
- `minimax`: nur `generate`
- `openrouter`: `generate` plus `edit`
- `comfy`: separate Comfy-Live-Testabdeckung, nicht Teil des gemeinsamen Provider-Durchlaufs

Optional aktivierbare Live-Testabdeckung für den gebündelten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Comfy-Live-Datei deckt außerdem Comfy-Bild- und -Video-Workflows ab, wenn diese
Abschnitte konfiguriert sind.

## Verwandte Themen

- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenverfolgung für entkoppelte `music_generate`-Ausführungen
- [ComfyUI](/de/providers/comfy)
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — `musicGenerationModel`-Konfiguration
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Modelle](/de/concepts/models) — Modellkonfiguration und Failover
- [Tool-Übersicht](/de/tools)
