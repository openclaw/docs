---
read_when:
    - Videos über den Agenten erzeugen
    - Provider und Modelle für die Videoerzeugung konfigurieren
    - Die Parameter des Tools `video_generate` verstehen
summary: Videos aus Text, Bildern oder vorhandenen Videos mit 12 Provider-Backends generieren
title: Videoerzeugung
x-i18n:
    generated_at: "2026-04-11T02:48:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6848d03ef578181902517d068e8d9fe2f845e572a90481bbdf7bd9f1c591f245
    source_path: tools/video-generation.md
    workflow: 15
---

# Videoerzeugung

OpenClaw-Agenten können Videos aus Text-Prompts, Referenzbildern oder vorhandenen Videos erzeugen. Zwölf Provider-Backends werden unterstützt, jeweils mit unterschiedlichen Modelloptionen, Eingabemodi und Funktionsumfängen. Der Agent wählt automatisch den richtigen Provider anhand Ihrer Konfiguration und verfügbaren API-Schlüssel aus.

<Note>
Das Tool `video_generate` erscheint nur, wenn mindestens ein Provider für Videoerzeugung verfügbar ist. Wenn Sie es nicht in den Agent-Tools sehen, setzen Sie einen API-Schlüssel für einen Provider oder konfigurieren Sie `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw behandelt die Videoerzeugung als drei Runtime-Modi:

- `generate` für Text-zu-Video-Anfragen ohne Referenzmedien
- `imageToVideo`, wenn die Anfrage ein oder mehrere Referenzbilder enthält
- `videoToVideo`, wenn die Anfrage ein oder mehrere Referenzvideos enthält

Provider können jede beliebige Teilmenge dieser Modi unterstützen. Das Tool validiert den aktiven
Modus vor dem Absenden und meldet unterstützte Modi in `action=list`.

## Schnellstart

1. Setzen Sie einen API-Schlüssel für einen beliebigen unterstützten Provider:

```bash
export GEMINI_API_KEY="your-key"
```

2. Optional: Legen Sie ein Standardmodell fest:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Fragen Sie den Agenten:

> Erzeuge ein 5 Sekunden langes cineastisches Video von einem freundlichen Hummer, der bei Sonnenuntergang surft.

Der Agent ruft `video_generate` automatisch auf. Keine Tool-Allowlist ist erforderlich.

## Was passiert, wenn Sie ein Video erzeugen

Die Videoerzeugung ist asynchron. Wenn der Agent in einer Sitzung `video_generate` aufruft:

1. OpenClaw sendet die Anfrage an den Provider und gibt sofort eine Aufgaben-ID zurück.
2. Der Provider verarbeitet den Job im Hintergrund (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. Wenn das Video fertig ist, weckt OpenClaw dieselbe Sitzung mit einem internen Abschlussereignis auf.
4. Der Agent stellt das fertige Video wieder in der ursprünglichen Unterhaltung bereit.

Während ein Job läuft, geben doppelte Aufrufe von `video_generate` in derselben Sitzung den aktuellen Aufgabenstatus zurück, statt eine weitere Erzeugung zu starten. Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um den Fortschritt in der CLI zu prüfen.

Außerhalb von sitzungsgestützten Agent-Läufen (zum Beispiel bei direkten Tool-Aufrufen) fällt das Tool auf Inline-Erzeugung zurück und gibt im selben Turn den endgültigen Medienpfad zurück.

### Aufgabenlebenszyklus

Jede `video_generate`-Anfrage durchläuft vier Zustände:

1. **queued** -- Aufgabe erstellt, wartet darauf, dass der Provider sie annimmt.
2. **running** -- der Provider verarbeitet sie (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. **succeeded** -- Video bereit; der Agent wird aufgeweckt und stellt es in der Unterhaltung bereit.
4. **failed** -- Provider-Fehler oder Timeout; der Agent wird mit Fehlerdetails aufgeweckt.

Status in der CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Vermeidung von Duplikaten: Wenn für die aktuelle Sitzung bereits eine Videoaufgabe `queued` oder `running` ist, gibt `video_generate` den Status der vorhandenen Aufgabe zurück, statt eine neue zu starten. Verwenden Sie `action: "status"`, um explizit zu prüfen, ohne eine neue Erzeugung auszulösen.

## Unterstützte Provider

| Provider | Standardmodell                 | Text | Bildreferenz      | Videoreferenz    | API-Schlüssel                             |
| -------- | ------------------------------ | ---- | ----------------- | ---------------- | ----------------------------------------- |
| Alibaba  | `wan2.6-t2v`                   | Ja   | Ja (Remote-URL)   | Ja (Remote-URL)  | `MODELSTUDIO_API_KEY`                     |
| BytePlus | `seedance-1-0-lite-t2v-250428` | Ja   | 1 Bild            | Nein             | `BYTEPLUS_API_KEY`                        |
| ComfyUI  | `workflow`                     | Ja   | 1 Bild            | Nein             | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live` | Ja   | 1 Bild            | Nein             | `FAL_KEY`                                 |
| Google   | `veo-3.1-fast-generate-preview` | Ja  | 1 Bild            | 1 Video          | `GEMINI_API_KEY`                          |
| MiniMax  | `MiniMax-Hailuo-2.3`           | Ja   | 1 Bild            | Nein             | `MINIMAX_API_KEY`                         |
| OpenAI   | `sora-2`                       | Ja   | 1 Bild            | 1 Video          | `OPENAI_API_KEY`                          |
| Qwen     | `wan2.6-t2v`                   | Ja   | Ja (Remote-URL)   | Ja (Remote-URL)  | `QWEN_API_KEY`                            |
| Runway   | `gen4.5`                       | Ja   | 1 Bild            | 1 Video          | `RUNWAYML_API_SECRET`                     |
| Together | `Wan-AI/Wan2.2-T2V-A14B`       | Ja   | 1 Bild            | Nein             | `TOGETHER_API_KEY`                        |
| Vydra    | `veo3`                         | Ja   | 1 Bild (`kling`)  | Nein             | `VYDRA_API_KEY`                           |
| xAI      | `grok-imagine-video`           | Ja   | 1 Bild            | 1 Video          | `XAI_API_KEY`                             |

Einige Provider akzeptieren zusätzliche oder alternative API-Schlüssel-Umgebungsvariablen. Details finden Sie auf den jeweiligen [Provider-Seiten](#related).

Führen Sie `video_generate action=list` aus, um verfügbare Provider, Modelle und
Runtime-Modi zur Laufzeit zu prüfen.

### Deklarierte Capability-Matrix

Dies ist der explizite Modusvertrag, der von `video_generate`, Vertragstests
und dem gemeinsamen Live-Sweep verwendet wird.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Gemeinsame Live-Umgebungen heute                                                                                                      |
| -------- | ---------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` übersprungen, weil dieser Provider Remote-`http(s)`-Video-URLs benötigt                   |
| BytePlus | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                             |
| ComfyUI  | Ja         | Ja             | Nein           | Nicht im gemeinsamen Sweep; workflowspezifische Abdeckung liegt bei den Comfy-Tests                                                   |
| fal      | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                             |
| Google   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; gemeinsames `videoToVideo` übersprungen, weil der aktuelle buffergestützte Gemini-/Veo-Sweep diese Eingabe nicht akzeptiert |
| MiniMax  | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                             |
| OpenAI   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; gemeinsames `videoToVideo` übersprungen, weil dieser Organisations-/Eingabepfad derzeit providerseitigen Inpaint-/Remix-Zugriff benötigt |
| Qwen     | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` übersprungen, weil dieser Provider Remote-`http(s)`-Video-URLs benötigt                   |
| Runway   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` läuft nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist                            |
| Together | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                             |
| Vydra    | Ja         | Ja             | Nein           | `generate`; gemeinsames `imageToVideo` übersprungen, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL benötigt |
| xAI      | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` übersprungen, weil dieser Provider derzeit eine Remote-MP4-URL benötigt                   |

## Tool-Parameter

### Erforderlich

| Parameter | Typ    | Beschreibung                                                                |
| --------- | ------ | --------------------------------------------------------------------------- |
| `prompt`  | string | Textbeschreibung des zu erzeugenden Videos (erforderlich für `action: "generate"`) |

### Inhaltseingaben

| Parameter | Typ      | Beschreibung                           |
| --------- | -------- | -------------------------------------- |
| `image`   | string   | Einzelnes Referenzbild (Pfad oder URL) |
| `images`  | string[] | Mehrere Referenzbilder (bis zu 5)      |
| `video`   | string   | Einzelnes Referenzvideo (Pfad oder URL) |
| `videos`  | string[] | Mehrere Referenzvideos (bis zu 4)      |

### Stilsteuerung

| Parameter         | Typ     | Beschreibung                                                             |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`      | string  | `480P`, `720P`, `768P` oder `1080P`                                     |
| `durationSeconds` | number  | Zieldauer in Sekunden (auf den nächsten vom Provider unterstützten Wert gerundet) |
| `size`            | string  | Größenhinweis, wenn der Provider ihn unterstützt                         |
| `audio`           | boolean | Erzeugten Ton aktivieren, wenn unterstützt                               |
| `watermark`       | boolean | Watermarking des Providers umschalten, wenn unterstützt                  |

### Erweitert

| Parameter  | Typ    | Beschreibung                                        |
| ---------- | ------ | --------------------------------------------------- |
| `action`   | string | `"generate"` (Standard), `"status"` oder `"list"`   |
| `model`    | string | Provider-/Modell-Override (z. B. `runway/gen4.5`)   |
| `filename` | string | Hinweis für den Ausgabedateinamen                   |

Nicht alle Provider unterstützen alle Parameter. OpenClaw normalisiert die Dauer bereits auf den jeweils nächstunterstützten Provider-Wert und ordnet außerdem übersetzte Geometriehinweise wie Größe-zu-Seitenverhältnis um, wenn ein Fallback-Provider eine andere Steueroberfläche bereitstellt. Wirklich nicht unterstützte Overrides werden nach bestem Bemühen ignoriert und als Warnungen im Tool-Ergebnis gemeldet. Harte Capability-Grenzen (zum Beispiel zu viele Referenzeingaben) schlagen vor dem Absenden fehl.

Tool-Ergebnisse melden die angewendeten Einstellungen. Wenn OpenClaw während eines Provider-Fallbacks Dauer oder Geometrie umordnet, spiegeln die zurückgegebenen Werte für `durationSeconds`, `size`, `aspectRatio` und `resolution` das wider, was tatsächlich übermittelt wurde, und `details.normalization` erfasst die Übersetzung von angefordert zu angewendet.

Referenzeingaben wählen außerdem den Runtime-Modus:

- Keine Referenzmedien: `generate`
- Beliebige Bildreferenz: `imageToVideo`
- Beliebige Videoreferenz: `videoToVideo`

Gemischte Bild- und Videoreferenzen sind keine stabile gemeinsame Capability-Oberfläche.
Bevorzugen Sie einen Referenztyp pro Anfrage.

## Aktionen

- **generate** (Standard) -- ein Video aus dem angegebenen Prompt und optionalen Referenzeingaben erstellen.
- **status** -- den Zustand der laufenden Videoaufgabe für die aktuelle Sitzung prüfen, ohne eine weitere Erzeugung zu starten.
- **list** -- verfügbare Provider, Modelle und deren Capabilities anzeigen.

## Modellauswahl

Beim Erzeugen eines Videos löst OpenClaw das Modell in dieser Reihenfolge auf:

1. **Tool-Parameter `model`** -- falls der Agent beim Aufruf einen angibt.
2. **`videoGenerationModel.primary`** -- aus der Konfiguration.
3. **`videoGenerationModel.fallbacks`** -- werden der Reihe nach versucht.
4. **Automatische Erkennung** -- verwendet Provider mit gültiger Authentifizierung, beginnend mit dem aktuellen Standard-Provider, dann die übrigen Provider in alphabetischer Reihenfolge.

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle Kandidaten fehlschlagen, enthält der Fehler Details aus jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn Sie möchten,
dass die Videoerzeugung nur die expliziten Einträge `model`, `primary` und `fallbacks` verwendet.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

HeyGen video-agent auf fal kann festgelegt werden mit:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/heygen/v2/video-agent",
      },
    },
  },
}
```

Seedance 2.0 auf fal kann festgelegt werden mit:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
      },
    },
  },
}
```

## Hinweise zu Providern

| Provider | Hinweise                                                                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Verwendet den asynchronen DashScope-/Model-Studio-Endpoint. Referenzbilder und -videos müssen Remote-`http(s)`-URLs sein.                                           |
| BytePlus | Nur eine einzelne Bildreferenz.                                                                                                                                       |
| ComfyUI  | Workflow-gesteuerte lokale oder Cloud-Ausführung. Unterstützt Text-zu-Video und Bild-zu-Video über den konfigurierten Graphen.                                      |
| fal      | Verwendet einen warteschlangengestützten Ablauf für lang laufende Jobs. Nur eine einzelne Bildreferenz. Enthält HeyGen video-agent und Seedance 2.0 Text-zu-Video- und Bild-zu-Video-Modell-Refs. |
| Google   | Verwendet Gemini/Veo. Unterstützt ein Bild oder ein Video als Referenz.                                                                                               |
| MiniMax  | Nur eine einzelne Bildreferenz.                                                                                                                                       |
| OpenAI   | Nur der Override `size` wird weitergegeben. Andere Stil-Overrides (`aspectRatio`, `resolution`, `audio`, `watermark`) werden mit einer Warnung ignoriert.            |
| Qwen     | Dasselbe DashScope-Backend wie Alibaba. Referenzeingaben müssen Remote-`http(s)`-URLs sein; lokale Dateien werden vorab abgelehnt.                                  |
| Runway   | Unterstützt lokale Dateien über Data-URIs. Video-zu-Video erfordert `runway/gen4_aleph`. Rein textbasierte Läufe stellen die Seitenverhältnisse `16:9` und `9:16` bereit. |
| Together | Nur eine einzelne Bildreferenz.                                                                                                                                       |
| Vydra    | Verwendet direkt `https://www.vydra.ai/api/v1`, um Redirects zu vermeiden, die Authentifizierung verlieren. `veo3` ist gebündelt nur als Text-zu-Video; `kling` erfordert eine Remote-Bild-URL. |
| xAI      | Unterstützt Text-zu-Video, Bild-zu-Video und Remote-Workflows zum Bearbeiten/Erweitern von Videos.                                                                   |

## Provider-Capability-Modi

Der gemeinsame Vertrag für Videoerzeugung erlaubt Providern jetzt, modusspezifische
Capabilities zu deklarieren, statt nur flache aggregierte Grenzen. Neue Provider-
Implementierungen sollten explizite Modusblöcke bevorzugen:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Flache aggregierte Felder wie `maxInputImages` und `maxInputVideos` reichen nicht
aus, um Unterstützung für Transformationsmodi auszuweisen. Provider sollten
`generate`, `imageToVideo` und `videoToVideo` explizit deklarieren, damit Live-Tests,
Vertragstests und das gemeinsame Tool `video_generate` die Modusunterstützung
deterministisch validieren können.

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media video
```

Diese Live-Datei lädt fehlende Provider-Umgebungsvariablen aus `~/.profile`, bevorzugt
standardmäßig API-Schlüssel aus Live-/Umgebungsvariablen gegenüber gespeicherten Auth-Profilen und führt die
deklarierten Modi aus, die sie sicher mit lokalen Medien testen kann:

- `generate` für jeden Provider im Sweep
- `imageToVideo`, wenn `capabilities.imageToVideo.enabled`
- `videoToVideo`, wenn `capabilities.videoToVideo.enabled` und Provider/Modell
  buffergestützte lokale Videoeingaben im gemeinsamen Sweep akzeptiert

Heute deckt die gemeinsame `videoToVideo`-Live-Umgebung ab:

- `runway` nur, wenn Sie `runway/gen4_aleph` auswählen

## Konfiguration

Legen Sie das Standardmodell für die Videoerzeugung in Ihrer OpenClaw-Konfiguration fest:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Oder über die CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Verwandt

- [Tools Overview](/de/tools)
- [Background Tasks](/de/automation/tasks) -- Aufgabenverfolgung für asynchrone Videoerzeugung
- [Alibaba Model Studio](/de/providers/alibaba)
- [BytePlus](/de/concepts/model-providers#byteplus-international)
- [ComfyUI](/de/providers/comfy)
- [fal](/de/providers/fal)
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [OpenAI](/de/providers/openai)
- [Qwen](/de/providers/qwen)
- [Runway](/de/providers/runway)
- [Together AI](/de/providers/together)
- [Vydra](/de/providers/vydra)
- [xAI](/de/providers/xai)
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults)
- [Models](/de/concepts/models)
