---
read_when:
    - Bilder über den Agenten generieren
    - Provider und Modelle für die Bildgenerierung konfigurieren
    - Die Parameter des Tools `image_generate` verstehen
summary: Bilder mit konfigurierten Providern generieren und bearbeiten (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Bildgenerierung
x-i18n:
    generated_at: "2026-04-22T04:27:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e365cd23f4f8d8c9ce88d57e65f06ac5ae5285b8b7f9ea37f0b08ab5f6ff7235
    source_path: tools/image-generation.md
    workflow: 15
---

# Bildgenerierung

Das Tool `image_generate` ermöglicht es dem Agenten, Bilder mit Ihren konfigurierten Providern zu erstellen und zu bearbeiten. Generierte Bilder werden automatisch als Medienanhänge in der Antwort des Agenten zugestellt.

<Note>
Das Tool erscheint nur, wenn mindestens ein Provider für Bildgenerierung verfügbar ist. Wenn Sie `image_generate` nicht in den Tools Ihres Agenten sehen, konfigurieren Sie `agents.defaults.imageGenerationModel` oder richten Sie einen API-Schlüssel für einen Provider ein.
</Note>

## Schnellstart

1. Legen Sie einen API-Schlüssel für mindestens einen Provider fest (zum Beispiel `OPENAI_API_KEY` oder `GEMINI_API_KEY`).
2. Legen Sie optional Ihr bevorzugtes Modell fest:

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

Der Agent ruft `image_generate` automatisch auf. Keine Tool-Allowlist erforderlich — es ist standardmäßig aktiviert, wenn ein Provider verfügbar ist.

## Unterstützte Provider

| Provider | Standardmodell                 | Unterstützung für Bearbeitung      | API-Schlüssel                                         |
| -------- | ------------------------------ | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                  | Ja (bis zu 5 Bilder)               | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | Ja                               | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                |
| fal      | `fal-ai/flux/dev`              | Ja                                 | `FAL_KEY`                                             |
| MiniMax  | `image-01`                     | Ja (Subjekt-Referenz)              | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                     | Ja (1 Bild, per Workflow konfiguriert) | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Cloud |
| Vydra    | `grok-imagine`                 | Nein                               | `VYDRA_API_KEY`                                       |

Verwenden Sie `action: "list"`, um verfügbare Provider und Modelle zur Laufzeit zu prüfen:

```
/tool image_generate action=list
```

## Tool-Parameter

| Parameter     | Typ      | Beschreibung                                                                          |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt für die Bildgenerierung (erforderlich für `action: "generate"`)               |
| `action`      | string   | `"generate"` (Standard) oder `"list"` zum Prüfen von Providern                       |
| `model`       | string   | Override für Provider/Modell, z. B. `openai/gpt-image-2`                             |
| `image`       | string   | Einzelner Referenzbildpfad oder URL für den Bearbeitungsmodus                        |
| `images`      | string[] | Mehrere Referenzbilder für den Bearbeitungsmodus (bis zu 5)                          |
| `size`        | string   | Größenhinweis: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`       |
| `aspectRatio` | string   | Seitenverhältnis: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Auflösungshinweis: `1K`, `2K` oder `4K`                                              |
| `count`       | number   | Anzahl der zu generierenden Bilder (1–4)                                             |
| `filename`    | string   | Hinweis für den Ausgabedateinamen                                                    |

Nicht alle Provider unterstützen alle Parameter. Wenn ein Fallback-Provider statt der exakt angeforderten Geometrie nur eine nahegelegene Option unterstützt, ordnet OpenClaw dies vor dem Absenden auf die nächstgelegene unterstützte Größe, das nächstgelegene Seitenverhältnis oder die nächstgelegene Auflösung um. Wirklich nicht unterstützte Overrides werden weiterhin im Tool-Ergebnis gemeldet.

Tool-Ergebnisse melden die angewendeten Einstellungen. Wenn OpenClaw während des Provider-Fallbacks Geometrie umordnet, spiegeln die zurückgegebenen Werte `size`, `aspectRatio` und `resolution` wider, was tatsächlich gesendet wurde, und `details.normalization` erfasst die Übersetzung von angefordert zu angewendet.

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

Beim Generieren eines Bildes versucht OpenClaw Provider in dieser Reihenfolge:

1. **Parameter `model`** aus dem Tool-Aufruf (wenn der Agent einen angibt)
2. **`imageGenerationModel.primary`** aus der Konfiguration
3. **`imageGenerationModel.fallbacks`** in Reihenfolge
4. **Auto-Erkennung** — verwendet nur auth-gestützte Provider-Standards:
   - zuerst den aktuellen Standardprovider
   - verbleibende registrierte Provider für Bildgenerierung in Reihenfolge der Provider-IDs

Wenn ein Provider fehlschlägt (Auth-Fehler, Rate-Limit usw.), wird automatisch der nächste Kandidat versucht. Wenn alle fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Hinweise:

- Die Auto-Erkennung ist auth-bewusst. Ein Provider-Standard gelangt nur dann in die Kandidatenliste, wenn OpenClaw diesen Provider tatsächlich authentifizieren kann.
- Die Auto-Erkennung ist standardmäßig aktiviert. Setzen Sie
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn die Bild-
  generierung nur die expliziten Einträge `model`, `primary` und `fallbacks`
  verwenden soll.
- Verwenden Sie `action: "list"`, um die aktuell registrierten Provider, deren
  Standardmodelle und Hinweise zu Auth-Umgebungsvariablen zu prüfen.

### Bildbearbeitung

OpenAI, Google, fal, MiniMax und ComfyUI unterstützen das Bearbeiten von Referenzbildern. Übergeben Sie einen Referenzbildpfad oder eine URL:

```
"Erzeuge eine Aquarellversion dieses Fotos" + image: "/path/to/photo.jpg"
```

OpenAI und Google unterstützen bis zu 5 Referenzbilder über den Parameter `images`. fal, MiniMax und ComfyUI unterstützen 1.

### OpenAI `gpt-image-2`

Die OpenAI-Bildgenerierung verwendet standardmäßig `openai/gpt-image-2`. Das ältere
Modell `openai/gpt-image-1` kann weiterhin explizit ausgewählt werden, aber neue Anfragen für OpenAI-
Bildgenerierung und Bildbearbeitung sollten `gpt-image-2` verwenden.

`gpt-image-2` unterstützt sowohl Text-zu-Bild-Generierung als auch Referenzbild-
bearbeitung über dasselbe Tool `image_generate`. OpenClaw leitet `prompt`,
`count`, `size` und Referenzbilder an OpenAI weiter. OpenAI erhält
`aspectRatio` oder `resolution` nicht direkt; wenn möglich ordnet OpenClaw diese einer
unterstützten `size` zu, andernfalls meldet das Tool sie als ignorierte Overrides.

Ein 4K-Bild im Querformat generieren:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Ein sauberes redaktionelles Poster für die Bildgenerierung von OpenClaw" size=3840x2160 count=1
```

Zwei quadratische Bilder generieren:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Zwei visuelle Richtungen für ein ruhiges App-Symbol für Produktivität" size=1024x1024 count=2
```

Ein lokales Referenzbild bearbeiten:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Behalte das Motiv bei und ersetze den Hintergrund durch ein helles Studiosetup" image=/path/to/reference.png size=1024x1536
```

Mit mehreren Referenzen bearbeiten:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Kombiniere die Charakteridentität aus dem ersten Bild mit der Farbpalette aus dem zweiten" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

MiniMax-Bildgenerierung ist über beide gebündelten MiniMax-Auth-Pfade verfügbar:

- `minimax/image-01` für API-Key-Setups
- `minimax-portal/image-01` für OAuth-Setups

## Provider-Fähigkeiten

| Fähigkeit             | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Generieren            | Ja (bis zu 4)        | Ja (bis zu 4)        | Ja (bis zu 4)       | Ja (bis zu 9)              | Ja (workflowdefinierte Ausgaben)   | Ja (1)  |
| Bearbeiten/Referenz   | Ja (bis zu 5 Bilder) | Ja (bis zu 5 Bilder) | Ja (1 Bild)         | Ja (1 Bild, Subjekt-Referenz) | Ja (1 Bild, per Workflow konfiguriert) | Nein |
| Größensteuerung       | Ja (bis zu 4K)       | Ja                   | Ja                  | Nein                       | Nein                               | Nein    |
| Seitenverhältnis      | Nein                 | Ja                   | Ja (nur Generierung) | Ja                        | Nein                               | Nein    |
| Auflösung (1K/2K/4K)  | Nein                 | Ja                   | Ja                  | Nein                       | Nein                               | Nein    |

## Verwandt

- [Tools Overview](/de/tools) — alle verfügbaren Agenten-Tools
- [fal](/de/providers/fal) — Einrichtung des fal-Providers für Bild und Video
- [ComfyUI](/de/providers/comfy) — Einrichtung von lokalem ComfyUI und Comfy Cloud Workflow
- [Google (Gemini)](/de/providers/google) — Einrichtung des Gemini-Bildproviders
- [MiniMax](/de/providers/minimax) — Einrichtung des MiniMax-Bildproviders
- [OpenAI](/de/providers/openai) — Einrichtung des OpenAI-Images-Providers
- [Vydra](/de/providers/vydra) — Einrichtung von Vydra für Bild, Video und Sprache
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Konfiguration `imageGenerationModel`
- [Models](/de/concepts/models) — Modellkonfiguration und Failover
