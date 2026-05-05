---
read_when:
    - Generieren von Musik oder Audio über den Agenten
    - Provider und Modelle für die Musikgenerierung konfigurieren
    - Die Parameter des Tools music_generate verstehen
sidebarTitle: Music generation
summary: Musik über music_generate für Google Lyria-, MiniMax- und ComfyUI-Workflows generieren
title: Musikgenerierung
x-i18n:
    generated_at: "2026-05-05T06:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

Das `music_generate`-Tool ermöglicht dem Agenten, Musik oder Audio über die
gemeinsame Musikgenerierungsfunktion mit konfigurierten Providern zu erstellen:
derzeit Google, MiniMax und per Workflow konfigurierte ComfyUI.

Bei sitzungsgestützten Agentenläufen startet OpenClaw die Musikgenerierung als
Hintergrundaufgabe, verfolgt sie im Aufgabenprotokoll und weckt den Agenten
erneut, wenn der Track fertig ist, damit der Agent den Benutzer informieren und
das fertige Audio anhängen kann. In Gruppen-/Kanal-Chats, die eine sichtbare
Zustellung ausschließlich über das Nachrichtentool verwenden, übermittelt der
Agent das Ergebnis über das Nachrichtentool. Wenn der Abschlussagent nur eine
private finale Antwort schreibt, greift OpenClaw auf einen direkten
Kanalversand mit den generierten Medien zurück. Das Abschluss-Wecken warnt den
Agenten ausdrücklich, dass normale finale Antworten auf diesen Routen privat
sind.

<Note>
Das integrierte gemeinsame Tool wird nur angezeigt, wenn mindestens ein
Musikgenerierungs-Provider verfügbar ist. Wenn Sie `music_generate` in den
Tools Ihres Agenten nicht sehen, konfigurieren Sie
`agents.defaults.musicGenerationModel` oder richten Sie einen
Provider-API-Schlüssel ein.
</Note>

## Schnelleinstieg

<Tabs>
  <Tab title="Gemeinsam, Provider-gestützt">
    <Steps>
      <Step title="Authentifizierung konfigurieren">
        Legen Sie einen API-Schlüssel für mindestens einen Provider fest, zum
        Beispiel `GEMINI_API_KEY` oder `MINIMAX_API_KEY`.
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
      <Step title="Den Agenten fragen">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Der Agent ruft `music_generate` automatisch auf. Es ist keine
        Zulassungsliste für Tools erforderlich.
      </Step>
    </Steps>

    Für direkte synchrone Kontexte ohne sitzungsgestützten Agentenlauf
    fällt das integrierte Tool weiterhin auf Inline-Generierung zurück und
    gibt den finalen Medienpfad im Tool-Ergebnis zurück.

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

| Provider | Standardmodell         | Referenzeingaben | Unterstützte Steuerungen                                  | Authentifizierung                       |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | --------------------------------------- |
| ComfyUI  | `workflow`             | Bis zu 1 Bild    | Workflow-definierte Musik oder Audio                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| Google   | `lyria-3-clip-preview` | Bis zu 10 Bilder | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax  | `music-2.6`            | Keine            | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` oder MiniMax OAuth    |

### Fähigkeitsmatrix

Der explizite Modusvertrag, der von `music_generate`, Vertragstests und dem
gemeinsamen Live-Sweep verwendet wird:

| Provider | `generate` | `edit` | Bearbeitungslimit | Gemeinsame Live-Lanes                                                     |
| -------- | :--------: | :----: | ----------------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 Bild            | Nicht im gemeinsamen Sweep; abgedeckt durch `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 Bilder         | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Keine             | `generate`                                                                |

Verwenden Sie `action: "list"`, um verfügbare gemeinsame Provider und Modelle
zur Laufzeit zu prüfen:

```text
/tool music_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive sitzungsgestützte
Musikaufgabe zu prüfen:

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
  Provider-/Modellüberschreibung (z. B. `google/lyria-3-pro-preview`,
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
  Hinweis zum Ausgabeformat, wenn der Provider es unterstützt.
</ParamField>
<ParamField path="filename" type="string">Hinweis zum Ausgabedateinamen.</ParamField>
<ParamField path="timeoutMs" type="number">Optionaler Timeout für Provider-Anfragen in Millisekunden. Werte unter 10000 ms werden auf 10000 ms angehoben und im Tool-Ergebnis gemeldet.</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert dennoch
harte Grenzen wie Eingabeanzahlen vor dem Absenden. Wenn ein Provider Dauer
unterstützt, aber ein kürzeres Maximum als den angeforderten Wert verwendet,
begrenzt OpenClaw auf die nächstliegende unterstützte Dauer. Wirklich nicht
unterstützte optionale Hinweise werden mit einer Warnung ignoriert, wenn der
ausgewählte Provider oder das Modell sie nicht berücksichtigen kann.
Tool-Ergebnisse melden angewendete Einstellungen; `details.normalization`
erfasst jede Zuordnung von angefordert zu angewendet.
</Note>

## Asynchrones Verhalten

Sitzungsgestützte Musikgenerierung läuft als Hintergrundaufgabe:

- **Hintergrundaufgabe:** `music_generate` erstellt eine Hintergrundaufgabe,
  gibt sofort eine Gestartet-/Aufgabenantwort zurück und veröffentlicht den
  fertigen Track später in einer nachfolgenden Agentennachricht.
- **Duplikatvermeidung:** Solange eine Aufgabe `queued` oder `running` ist,
  geben spätere `music_generate`-Aufrufe in derselben Sitzung den
  Aufgabenstatus zurück, statt eine weitere Generierung zu starten. Verwenden
  Sie `action: "status"`, um dies ausdrücklich zu prüfen.
- **Statusabfrage:** `openclaw tasks list` oder `openclaw tasks show <taskId>`
  prüft Status für Warteschlange, laufende Aufgaben und Endzustände.
- **Abschluss-Wecken:** OpenClaw injiziert ein internes Abschlussereignis
  zurück in dieselbe Sitzung, damit das Modell die benutzerseitige
  Folgenachricht selbst schreiben kann.
- **Prompt-Hinweis:** Spätere Benutzer-/manuelle Turns in derselben Sitzung
  erhalten einen kleinen Laufzeithinweis, wenn bereits eine Musikaufgabe
  läuft, damit das Modell `music_generate` nicht blind erneut aufruft.
- **Fallback ohne Sitzung:** Direkte/lokale Kontexte ohne echte
  Agentensitzung laufen inline und geben das finale Audioergebnis im selben
  Turn zurück.

### Aufgabenlebenszyklus

| Status      | Bedeutung                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Aufgabe erstellt, wartet darauf, dass der Provider sie annimmt.                               |
| `running`   | Provider verarbeitet sie (typischerweise 30 Sekunden bis 3 Minuten, je nach Provider und Dauer). |
| `succeeded` | Track ist fertig; der Agent wird geweckt und veröffentlicht ihn in der Unterhaltung.           |
| `failed`    | Provider-Fehler oder Timeout; der Agent wird mit Fehlerdetails geweckt.                       |

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
4. Automatische Erkennung ausschließlich anhand authentifizierungsgestützter
   Provider-Standards:
   - aktueller Standard-Provider zuerst;
   - verbleibende registrierte Musikgenerierungs-Provider in
     Provider-ID-Reihenfolge.

Wenn ein Provider fehlschlägt, wird der nächste Kandidat automatisch versucht.
Wenn alle fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, um nur
explizite Einträge für `model`, `primary` und `fallbacks` zu verwenden.

## Provider-Hinweise

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflow-gesteuert und abhängig vom konfigurierten Graphen sowie der
    Knotenzuordnung für Prompt-/Ausgabefelder. Das gebündelte `comfy`-Plugin
    bindet sich über die Musikgenerierungs-Provider-Registry in das
    gemeinsame `music_generate`-Tool ein.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Verwendet Lyria-3-Batch-Generierung. Der aktuelle gebündelte Ablauf
    unterstützt Prompt, optionalen Liedtext und optionale Referenzbilder.
  </Accordion>
  <Accordion title="MiniMax">
    Verwendet den Batch-Endpunkt `music_generation`. Unterstützt Prompt,
    optionale Liedtexte, Instrumentalmodus, Dauersteuerung und MP3-Ausgabe
    entweder über `minimax`-API-Schlüssel-Authentifizierung oder
    `minimax-portal` OAuth.
  </Accordion>
</AccordionGroup>

## Den richtigen Pfad wählen

- **Gemeinsam, Provider-gestützt**, wenn Sie Modellauswahl,
  Provider-Failover und den integrierten asynchronen Aufgaben-/Statusablauf
  wünschen.
- **Plugin-Pfad (ComfyUI)**, wenn Sie einen benutzerdefinierten
  Workflow-Graphen oder einen Provider benötigen, der nicht Teil der
  gemeinsamen gebündelten Musikfunktion ist.

Wenn Sie ComfyUI-spezifisches Verhalten debuggen, siehe
[ComfyUI](/de/providers/comfy). Wenn Sie gemeinsames Provider-Verhalten
debuggen, beginnen Sie mit [Google (Gemini)](/de/providers/google) oder
[MiniMax](/de/providers/minimax).

## Provider-Fähigkeitsmodi

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
`supportsFormat` reichen **nicht** aus, um Bearbeitungsunterstützung
anzukündigen. Provider sollten `generate` und `edit` explizit deklarieren,
damit Live-Tests, Vertragstests und das gemeinsame `music_generate`-Tool
Modusunterstützung deterministisch validieren können.

## Live-Tests

Optionale Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media music
```

Diese Live-Datei lädt fehlende Provider-Umgebungsvariablen aus `~/.profile`,
bevorzugt standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten
Authentifizierungsprofilen und führt sowohl `generate` als auch deklarierte
`edit`-Abdeckung aus, wenn der Provider den Bearbeitungsmodus aktiviert.
Abdeckung heute:

- `google`: `generate` plus `edit`
- `minimax`: nur `generate`
- `comfy`: separate Comfy-Live-Abdeckung, nicht der gemeinsame Provider-Sweep

Optionale Live-Abdeckung für den mitgelieferten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Comfy-Live-Datei deckt auch comfy-Bild- und Videoworkflows ab, wenn diese
Abschnitte konfiguriert sind.

## Verwandte Themen

- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenverfolgung für abgekoppelte `music_generate`-Ausführungen
- [ComfyUI](/de/providers/comfy)
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — `musicGenerationModel`-Konfiguration
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Modelle](/de/concepts/models) — Modellkonfiguration und Failover
- [Tools-Übersicht](/de/tools)
