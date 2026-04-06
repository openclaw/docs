---
read_when:
    - Videos über den Agent erzeugen
    - Provider und Modelle für die Videoerzeugung konfigurieren
    - Die Parameter des Tools `video_generate` verstehen
summary: Videos aus Text, Bildern oder vorhandenen Videos mit 12 Provider-Backends erzeugen
title: Videoerzeugung
x-i18n:
    generated_at: "2026-04-06T03:13:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4afec87368232221db1aa5a3980254093d6a961b17271b2dcbf724e6bd455b16
    source_path: tools/video-generation.md
    workflow: 15
---

# Videoerzeugung

OpenClaw-Agents können Videos aus Text-Prompts, Referenzbildern oder vorhandenen Videos erzeugen. Zwölf Provider-Backends werden unterstützt, jedes mit unterschiedlichen Modelloptionen, Eingabemodi und Funktionssätzen. Der Agent wählt automatisch den richtigen Provider basierend auf Ihrer Konfiguration und den verfügbaren API-Schlüsseln aus.

<Note>
Das Tool `video_generate` erscheint nur, wenn mindestens ein Provider für Videoerzeugung verfügbar ist. Wenn Sie es nicht in Ihren Agent-Tools sehen, setzen Sie einen API-Schlüssel für einen Provider oder konfigurieren Sie `agents.defaults.videoGenerationModel`.
</Note>

## Schnellstart

1. Setzen Sie einen API-Schlüssel für einen unterstützten Provider:

```bash
export GEMINI_API_KEY="your-key"
```

2. Heften Sie optional ein Standardmodell fest:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Fragen Sie den Agent:

> Erzeuge ein 5-sekündiges cineastisches Video eines freundlichen Hummers, der bei Sonnenuntergang surft.

Der Agent ruft `video_generate` automatisch auf. Keine Tool-Allowlist ist erforderlich.

## Was passiert, wenn Sie ein Video erzeugen

Die Videoerzeugung ist asynchron. Wenn der Agent `video_generate` in einer Sitzung aufruft:

1. OpenClaw sendet die Anfrage an den Provider und gibt sofort eine Task-ID zurück.
2. Der Provider verarbeitet den Job im Hintergrund (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. Wenn das Video bereit ist, weckt OpenClaw dieselbe Sitzung mit einem internen Abschlussereignis.
4. Der Agent veröffentlicht das fertige Video zurück in der ursprünglichen Konversation.

Während ein Job läuft, geben doppelte `video_generate`-Aufrufe in derselben Sitzung den aktuellen Task-Status zurück, statt eine weitere Erzeugung zu starten. Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um den Fortschritt über die CLI zu prüfen.

Außerhalb sitzungsgebundener Agent-Ausführungen (zum Beispiel bei direkten Tool-Aufrufen) fällt das Tool auf Inline-Erzeugung zurück und gibt im selben Turn den endgültigen Medienpfad zurück.

## Unterstützte Provider

| Provider | Standardmodell                | Text | Bildreferenz     | Videoreferenz    | API-Schlüssel                           |
| -------- | ----------------------------- | ---- | ---------------- | ---------------- | --------------------------------------- |
| Alibaba  | `wan2.6-t2v`                  | Ja   | Ja (Remote-URL)  | Ja (Remote-URL)  | `MODELSTUDIO_API_KEY`                   |
| BytePlus | `seedance-1-0-lite-t2v-250428`| Ja   | 1 Bild           | Nein             | `BYTEPLUS_API_KEY`                      |
| ComfyUI  | `workflow`                    | Ja   | 1 Bild           | Nein             | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`| Ja   | 1 Bild           | Nein             | `FAL_KEY`                               |
| Google   | `veo-3.1-fast-generate-preview` | Ja | 1 Bild           | 1 Video          | `GEMINI_API_KEY`                        |
| MiniMax  | `MiniMax-Hailuo-2.3`          | Ja   | 1 Bild           | Nein             | `MINIMAX_API_KEY`                       |
| OpenAI   | `sora-2`                      | Ja   | 1 Bild           | 1 Video          | `OPENAI_API_KEY`                        |
| Qwen     | `wan2.6-t2v`                  | Ja   | Ja (Remote-URL)  | Ja (Remote-URL)  | `QWEN_API_KEY`                          |
| Runway   | `gen4.5`                      | Ja   | 1 Bild           | 1 Video          | `RUNWAYML_API_SECRET`                   |
| Together | `Wan-AI/Wan2.2-T2V-A14B`      | Ja   | 1 Bild           | Nein             | `TOGETHER_API_KEY`                      |
| Vydra    | `veo3`                        | Ja   | 1 Bild (`kling`) | Nein             | `VYDRA_API_KEY`                         |
| xAI      | `grok-imagine-video`          | Ja   | 1 Bild           | 1 Video          | `XAI_API_KEY`                           |

Einige Provider akzeptieren zusätzliche oder alternative API-Schlüssel-Umgebungsvariablen. Details finden Sie auf den einzelnen [Provider-Seiten](#related).

Führen Sie `video_generate action=list` aus, um verfügbare Provider und Modelle zur Laufzeit zu prüfen.

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
| `resolution`      | string  | `480P`, `720P` oder `1080P`                                              |
| `durationSeconds` | number  | Zieldauer in Sekunden (auf den nächstgelegenen vom Provider unterstützten Wert gerundet) |
| `size`            | string  | Größenhinweis, wenn der Provider ihn unterstützt                         |
| `audio`           | boolean | Erzeugten Ton aktivieren, wenn unterstützt                               |
| `watermark`       | boolean | Watermarking des Providers aktivieren/deaktivieren, wenn unterstützt     |

### Erweitert

| Parameter  | Typ    | Beschreibung                                      |
| ---------- | ------ | ------------------------------------------------- |
| `action`   | string | `"generate"` (Standard), `"status"` oder `"list"` |
| `model`    | string | Provider-/Modell-Überschreibung (z. B. `runway/gen4.5`) |
| `filename` | string | Hinweis für den Ausgabedateinamen                 |

Nicht alle Provider unterstützen alle Parameter. Nicht unterstützte Überschreibungen werden best effort ignoriert und als Warnungen im Tool-Ergebnis gemeldet. Harte Funktionsgrenzen (zum Beispiel zu viele Referenzeingaben) schlagen vor dem Absenden fehl.

## Aktionen

- **generate** (Standard) -- ein Video aus dem angegebenen Prompt und optionalen Referenzeingaben erzeugen.
- **status** -- den Status des laufenden Video-Tasks für die aktuelle Sitzung prüfen, ohne eine weitere Erzeugung zu starten.
- **list** -- verfügbare Provider, Modelle und ihre Funktionen anzeigen.

## Modellauswahl

Beim Erzeugen eines Videos löst OpenClaw das Modell in dieser Reihenfolge auf:

1. **Tool-Parameter `model`** -- wenn der Agent im Aufruf eines angibt.
2. **`videoGenerationModel.primary`** -- aus der Konfiguration.
3. **`videoGenerationModel.fallbacks`** -- werden in Reihenfolge versucht.
4. **Automatische Erkennung** -- verwendet Provider mit gültiger Authentifizierung, beginnend mit dem aktuellen Standard-Provider, dann die übrigen Provider in alphabetischer Reihenfolge.

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle Kandidaten fehlschlagen, enthält der Fehler Details aus jedem Versuch.

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

## Hinweise zu Providern

| Provider | Hinweise                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Verwendet den asynchronen DashScope-/Model-Studio-Endpoint. Referenzbilder und -videos müssen Remote-`http(s)`-URLs sein.                  |
| BytePlus | Nur eine einzelne Bildreferenz.                                                                                                             |
| ComfyUI  | Workflow-gesteuerte lokale oder Cloud-Ausführung. Unterstützt Text-zu-Video und Bild-zu-Video über den konfigurierten Graphen.            |
| fal      | Verwendet einen queue-gestützten Ablauf für lang laufende Jobs. Nur eine einzelne Bildreferenz.                                            |
| Google   | Verwendet Gemini/Veo. Unterstützt ein Bild oder ein Video als Referenz.                                                                     |
| MiniMax  | Nur eine einzelne Bildreferenz.                                                                                                             |
| OpenAI   | Nur die Überschreibung `size` wird weitergegeben. Andere Stilüberschreibungen (`aspectRatio`, `resolution`, `audio`, `watermark`) werden mit einer Warnung ignoriert. |
| Qwen     | Verwendet dasselbe DashScope-Backend wie Alibaba. Referenzeingaben müssen Remote-`http(s)`-URLs sein; lokale Dateien werden direkt abgelehnt. |
| Runway   | Unterstützt lokale Dateien über Daten-URIs. Video-zu-Video erfordert `runway/gen4_aleph`. Reine Textläufe bieten die Seitenverhältnisse `16:9` und `9:16`. |
| Together | Nur eine einzelne Bildreferenz.                                                                                                             |
| Vydra    | Verwendet direkt `https://www.vydra.ai/api/v1`, um Redirects zu vermeiden, bei denen Authentifizierung verloren geht. `veo3` ist gebündelt nur als Text-zu-Video; `kling` erfordert eine Remote-Bild-URL. |
| xAI      | Unterstützt Text-zu-Video-, Bild-zu-Video- sowie Remote-Video-Bearbeitungs-/Erweiterungsabläufe.                                           |

## Konfiguration

Setzen Sie das Standardmodell für die Videoerzeugung in Ihrer OpenClaw-Konfiguration:

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
- [Background Tasks](/de/automation/tasks) -- Task-Verfolgung für asynchrone Videoerzeugung
- [Alibaba Model Studio](/providers/alibaba)
- [BytePlus](/providers/byteplus)
- [ComfyUI](/providers/comfy)
- [fal](/providers/fal)
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [OpenAI](/de/providers/openai)
- [Qwen](/de/providers/qwen)
- [Runway](/providers/runway)
- [Together AI](/de/providers/together)
- [Vydra](/providers/vydra)
- [xAI](/de/providers/xai)
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults)
- [Models](/de/concepts/models)
