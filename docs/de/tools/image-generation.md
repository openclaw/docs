---
read_when:
    - Bilder über den Agenten erzeugen
    - Provider und Modelle für die Bildgenerierung konfigurieren
    - Die Parameter des Tools `image_generate` verstehen
summary: Bilder mit konfigurierten Providern erzeugen und bearbeiten (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Bildgenerierung
x-i18n:
    generated_at: "2026-04-23T06:35:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# Bildgenerierung

Das Tool `image_generate` ermöglicht dem Agenten, mit Ihren konfigurierten Providern Bilder zu erzeugen und zu bearbeiten. Erzeugte Bilder werden automatisch als Medienanhänge in der Antwort des Agenten zugestellt.

<Note>
Das Tool erscheint nur, wenn mindestens ein Provider für Bildgenerierung verfügbar ist. Wenn Sie `image_generate` nicht in den Tools Ihres Agenten sehen, konfigurieren Sie `agents.defaults.imageGenerationModel` oder richten Sie einen API-Schlüssel für einen Provider ein.
</Note>

## Schnellstart

1. Setzen Sie einen API-Schlüssel für mindestens einen Provider (zum Beispiel `OPENAI_API_KEY` oder `GEMINI_API_KEY`).
2. Optional können Sie Ihr bevorzugtes Modell festlegen:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

3. Fragen Sie den Agenten: _„Erzeuge ein Bild eines freundlichen Hummer-Maskottchens.“_

Der Agent ruft `image_generate` automatisch auf. Kein Tool-Allow-Listing nötig — es ist standardmäßig aktiviert, wenn ein Provider verfügbar ist.

## Unterstützte Provider

| Provider | Standardmodell                 | Unterstützung für Bearbeitung      | API-Schlüssel                                         |
| -------- | ------------------------------ | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                  | Ja (bis zu 5 Bilder)               | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | Ja                               | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                |
| fal      | `fal-ai/flux/dev`              | Ja                                 | `FAL_KEY`                                             |
| MiniMax  | `image-01`                     | Ja (Subjektreferenz)               | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                     | Ja (1 Bild, workflowkonfiguriert)  | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Cloud  |
| Vydra    | `grok-imagine`                 | Nein                               | `VYDRA_API_KEY`                                       |
| xAI      | `grok-imagine-image`           | Ja (bis zu 5 Bilder)               | `XAI_API_KEY`                                         |

Verwenden Sie `action: "list"`, um verfügbare Provider und Modelle zur Laufzeit zu prüfen:

```
/tool image_generate action=list
```

## Tool-Parameter

| Parameter     | Typ      | Beschreibung                                                                        |
| ------------- | -------- | ----------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt für die Bildgenerierung (erforderlich für `action: "generate"`)              |
| `action`      | string   | `"generate"` (Standard) oder `"list"` zum Prüfen von Providern                      |
| `model`       | string   | Override für Provider/Modell, z. B. `openai/gpt-image-2`                            |
| `image`       | string   | Einzelner Referenzbildpfad oder URL für den Bearbeitungsmodus                       |
| `images`      | string[] | Mehrere Referenzbilder für den Bearbeitungsmodus (bis zu 5)                         |
| `size`        | string   | Größenhinweis: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`      |
| `aspectRatio` | string   | Seitenverhältnis: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Auflösungshinweis: `1K`, `2K` oder `4K`                                             |
| `count`       | number   | Anzahl der zu erzeugenden Bilder (1–4)                                              |
| `filename`    | string   | Hinweis für den Ausgabedateinamen                                                   |

Nicht alle Provider unterstützen alle Parameter. Wenn ein Fallback-Provider statt der exakt angeforderten Geometrieoption eine ähnliche unterstützt, bildet OpenClaw vor dem Absenden auf die nächstunterstützte Größe, das nächstunterstützte Seitenverhältnis oder die nächstunterstützte Auflösung ab. Wirklich nicht unterstützte Overrides werden weiterhin im Tool-Ergebnis gemeldet.

Tool-Ergebnisse melden die angewendeten Einstellungen. Wenn OpenClaw bei einem Provider-Fallback Geometrie umbildet, spiegeln die zurückgegebenen Werte `size`, `aspectRatio` und `resolution` wider, was tatsächlich gesendet wurde, und `details.normalization` erfasst die Übersetzung von angefordert zu angewendet.

## Konfiguration

### Modellauswahl

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Reihenfolge der Providerauswahl

Beim Erzeugen eines Bildes versucht OpenClaw Provider in dieser Reihenfolge:

1. **Parameter `model`** aus dem Tool-Aufruf (wenn der Agent einen angibt)
2. **`imageGenerationModel.primary`** aus der Konfiguration
3. **`imageGenerationModel.fallbacks`** in Reihenfolge
4. **Auto-Erkennung** — verwendet nur auth-gestützte Provider-Standards:
   - zuerst der aktuelle Standard-Provider
   - dann die übrigen registrierten Provider für Bildgenerierung in Provider-ID-Reihenfolge

Wenn ein Provider fehlschlägt (Auth-Fehler, Rate Limit usw.), wird automatisch der nächste Kandidat versucht. Wenn alle fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Hinweise:

- Auto-Erkennung ist auth-bewusst. Ein Provider-Standard kommt nur dann in die Kandidatenliste,
  wenn OpenClaw diesen Provider tatsächlich authentifizieren kann.
- Auto-Erkennung ist standardmäßig aktiviert. Setzen Sie
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn Sie möchten, dass die Bild-
  generierung nur die expliziten Einträge `model`, `primary` und `fallbacks`
  verwendet.
- Verwenden Sie `action: "list"`, um die aktuell registrierten Provider, ihre
  Standardmodelle und Hinweise zu Auth-Env-Variablen zu prüfen.

### Bildbearbeitung

OpenAI, Google, fal, MiniMax, ComfyUI und xAI unterstützen die Bearbeitung von Referenzbildern. Übergeben Sie einen Referenzbildpfad oder eine URL:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, Google und xAI unterstützen bis zu 5 Referenzbilder über den Parameter `images`. fal, MiniMax und ComfyUI unterstützen 1.

### OpenAI `gpt-image-2`

OpenAI-Bildgenerierung verwendet standardmäßig `openai/gpt-image-2`. Das ältere
Modell `openai/gpt-image-1` kann weiterhin explizit ausgewählt werden, aber neue OpenAI-
Anfragen zur Bildgenerierung und Bildbearbeitung sollten `gpt-image-2` verwenden.

`gpt-image-2` unterstützt sowohl Text-zu-Bild-Generierung als auch die Bearbeitung von Referenzbildern
über dasselbe Tool `image_generate`. OpenClaw leitet `prompt`,
`count`, `size` und Referenzbilder an OpenAI weiter. OpenAI erhält
`aspectRatio` oder `resolution` nicht direkt; wenn möglich bildet OpenClaw diese auf eine
unterstützte `size` ab, andernfalls meldet das Tool sie als ignorierte Overrides.

Ein 4K-Landschaftsbild erzeugen:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Zwei quadratische Bilder erzeugen:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Ein lokales Referenzbild bearbeiten:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Mit mehreren Referenzen bearbeiten:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

MiniMax-Bildgenerierung ist über beide gebündelten MiniMax-Auth-Pfade verfügbar:

- `minimax/image-01` für Setups mit API-Schlüssel
- `minimax-portal/image-01` für Setups mit OAuth

## Fähigkeiten der Provider

| Fähigkeit             | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generieren            | Ja (bis zu 4)        | Ja (bis zu 4)        | Ja (bis zu 4)       | Ja (bis zu 9)              | Ja (workflowdefinierte Ausgaben)   | Ja (1)  | Ja (bis zu 4)        |
| Bearbeiten/Referenz   | Ja (bis zu 5 Bilder) | Ja (bis zu 5 Bilder) | Ja (1 Bild)         | Ja (1 Bild, Subjektreferenz) | Ja (1 Bild, workflowkonfiguriert) | Nein    | Ja (bis zu 5 Bilder) |
| Größensteuerung       | Ja (bis zu 4K)       | Ja                   | Ja                  | Nein                       | Nein                               | Nein    | Nein                 |
| Seitenverhältnis      | Nein                 | Ja                   | Ja (nur Generieren) | Ja                         | Nein                               | Nein    | Ja                   |
| Auflösung (1K/2K/4K)  | Nein                 | Ja                   | Ja                  | Nein                       | Nein                               | Nein    | Ja (1K/2K)           |

### xAI `grok-imagine-image`

Der gebündelte xAI-Provider verwendet für reine Prompt-Anfragen `/v1/images/generations`
und `/v1/images/edits`, wenn `image` oder `images` vorhanden ist.

- Modelle: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Anzahl: bis zu 4
- Referenzen: ein `image` oder bis zu fünf `images`
- Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Auflösungen: `1K`, `2K`
- Ausgaben: werden als von OpenClaw verwaltete Bildanhänge zurückgegeben

OpenClaw stellt absichtlich keine xAI-nativen Optionen wie `quality`, `mask`, `user` oder
zusätzliche nur nativ verfügbare Seitenverhältnisse bereit, bis diese Steuerungen im gemeinsamen
providerübergreifenden Vertrag von `image_generate` existieren.

## Verwandt

- [Tools-Überblick](/de/tools) — alle verfügbaren Agenten-Tools
- [fal](/de/providers/fal) — Einrichtung des Bild- und Videoproviders fal
- [ComfyUI](/de/providers/comfy) — Einrichtung lokaler ComfyUI- und Comfy-Cloud-Workflows
- [Google (Gemini)](/de/providers/google) — Einrichtung des Bildproviders Gemini
- [MiniMax](/de/providers/minimax) — Einrichtung des Bildproviders MiniMax
- [OpenAI](/de/providers/openai) — Einrichtung des Providers OpenAI Images
- [Vydra](/de/providers/vydra) — Einrichtung von Bild, Video und Sprache für Vydra
- [xAI](/de/providers/xai) — Einrichtung von Grok für Bild, Video, Suche, Codeausführung und TTS
- [Konfigurationsreferenz](/de/gateway/configuration-reference#agent-defaults) — Konfiguration `imageGenerationModel`
- [Modelle](/de/concepts/models) — Modellkonfiguration und Failover
