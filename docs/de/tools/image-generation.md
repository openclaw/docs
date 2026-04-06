---
read_when:
    - Bilder über den Agenten generieren
    - Provider und Modelle für die Bildgenerierung konfigurieren
    - Die Parameter des Tools `image_generate` verstehen
summary: Bilder mit konfigurierten Providern generieren und bearbeiten (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Bildgenerierung
x-i18n:
    generated_at: "2026-04-06T03:12:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: dde416dd1441a06605db85b5813cf61ccfc525813d6db430b7b7dfa53d6a3134
    source_path: tools/image-generation.md
    workflow: 15
---

# Bildgenerierung

Das Tool `image_generate` ermöglicht es dem Agenten, Bilder mit Ihren konfigurierten Providern zu erstellen und zu bearbeiten. Generierte Bilder werden automatisch als Medienanhänge in der Antwort des Agenten zugestellt.

<Note>
Das Tool erscheint nur, wenn mindestens ein Provider für Bildgenerierung verfügbar ist. Wenn Sie `image_generate` nicht in den Tools Ihres Agenten sehen, konfigurieren Sie `agents.defaults.imageGenerationModel` oder richten Sie einen API-Schlüssel für einen Provider ein.
</Note>

## Schnellstart

1. Legen Sie für mindestens einen Provider einen API-Schlüssel fest (zum Beispiel `OPENAI_API_KEY` oder `GEMINI_API_KEY`).
2. Legen Sie optional Ihr bevorzugtes Modell fest:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. Fragen Sie den Agenten: _„Erzeuge ein Bild eines freundlichen Hummer-Maskottchens.“_

Der Agent ruft `image_generate` automatisch auf. Kein Tool-Allowlisting erforderlich — es ist standardmäßig aktiviert, wenn ein Provider verfügbar ist.

## Unterstützte Provider

| Provider | Standardmodell                 | Unterstützung für Bearbeitung      | API-Schlüssel                                          |
| -------- | ------------------------------ | ---------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-1`                  | Ja (bis zu 5 Bilder)               | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Ja                               | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                 |
| fal      | `fal-ai/flux/dev`              | Ja                                 | `FAL_KEY`                                              |
| MiniMax  | `image-01`                     | Ja (Subjektreferenz)               | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                     | Ja (1 Bild, workflowkonfiguriert)  | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Cloud   |
| Vydra    | `grok-imagine`                 | Nein                               | `VYDRA_API_KEY`                                        |

Verwenden Sie `action: "list"`, um verfügbare Provider und Modelle zur Laufzeit zu prüfen:

```
/tool image_generate action=list
```

## Tool-Parameter

| Parameter     | Typ      | Beschreibung                                                                        |
| ------------- | -------- | ----------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt für die Bildgenerierung (erforderlich für `action: "generate"`)              |
| `action`      | string   | `"generate"` (Standard) oder `"list"`, um Provider zu prüfen                        |
| `model`       | string   | Override für Provider/Modell, z. B. `openai/gpt-image-1`                            |
| `image`       | string   | Einzelner Pfad oder URL eines Referenzbilds für den Bearbeitungsmodus               |
| `images`      | string[] | Mehrere Referenzbilder für den Bearbeitungsmodus (bis zu 5)                         |
| `size`        | string   | Größenhinweis: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`      |
| `aspectRatio` | string   | Seitenverhältnis: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Auflösungshinweis: `1K`, `2K` oder `4K`                                             |
| `count`       | number   | Anzahl der zu generierenden Bilder (1–4)                                            |
| `filename`    | string   | Hinweis für den Ausgabedateinamen                                                   |

Nicht alle Provider unterstützen alle Parameter. Das Tool übergibt, was der jeweilige Provider unterstützt, ignoriert den Rest und meldet verworfene Overrides im Tool-Ergebnis.

## Konfiguration

### Modellauswahl

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Reihenfolge der Providerauswahl

Beim Generieren eines Bildes versucht OpenClaw Provider in dieser Reihenfolge:

1. **Parameter `model`** aus dem Tool-Aufruf (falls der Agent einen angibt)
2. **`imageGenerationModel.primary`** aus der Konfiguration
3. **`imageGenerationModel.fallbacks`** in Reihenfolge
4. **Automatische Erkennung** — verwendet nur auth-gestützte Provider-Standards:
   - zuerst den aktuellen Standardprovider
   - dann die übrigen registrierten Provider für Bildgenerierung in Provider-ID-Reihenfolge

Wenn ein Provider fehlschlägt (Auth-Fehler, Rate Limit usw.), wird automatisch der nächste Kandidat versucht. Wenn alle fehlschlagen, enthält der Fehler Details aus jedem Versuch.

Hinweise:

- Die automatische Erkennung ist auth-bewusst. Ein Provider-Standard wird nur dann in die Kandidatenliste aufgenommen,
  wenn OpenClaw diesen Provider tatsächlich authentifizieren kann.
- Verwenden Sie `action: "list"`, um die aktuell registrierten Provider, ihre
  Standardmodelle und Hinweise zu Auth-Env-Variablen zu prüfen.

### Bildbearbeitung

OpenAI, Google, fal, MiniMax und ComfyUI unterstützen die Bearbeitung von Referenzbildern. Übergeben Sie einen Pfad oder eine URL zu einem Referenzbild:

```
"Erzeuge eine Aquarellversion dieses Fotos" + image: "/path/to/photo.jpg"
```

OpenAI und Google unterstützen bis zu 5 Referenzbilder über den Parameter `images`. fal, MiniMax und ComfyUI unterstützen 1.

MiniMax-Bildgenerierung ist über beide gebündelten MiniMax-Auth-Pfade verfügbar:

- `minimax/image-01` für Setups mit API-Schlüssel
- `minimax-portal/image-01` für Setups mit OAuth

## Provider-Fähigkeiten

| Fähigkeit             | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ----- |
| Generieren            | Ja (bis zu 4)        | Ja (bis zu 4)        | Ja (bis zu 4)       | Ja (bis zu 9)              | Ja (workflowdefinierte Ausgaben)   | Ja (1) |
| Bearbeiten/Referenz   | Ja (bis zu 5 Bilder) | Ja (bis zu 5 Bilder) | Ja (1 Bild)         | Ja (1 Bild, Subjektreferenz) | Ja (1 Bild, workflowkonfiguriert) | Nein |
| Größensteuerung       | Ja                   | Ja                   | Ja                  | Nein                       | Nein                               | Nein |
| Seitenverhältnis      | Nein                 | Ja                   | Ja (nur Generieren) | Ja                         | Nein                               | Nein |
| Auflösung (1K/2K/4K)  | Nein                 | Ja                   | Ja                  | Nein                       | Nein                               | Nein |

## Verwandt

- [Tools-Übersicht](/de/tools) — alle verfügbaren Agenten-Tools
- [fal](/providers/fal) — Einrichtung des Bild- und Videoproviders fal
- [ComfyUI](/providers/comfy) — Einrichtung von lokalem ComfyUI und Comfy Cloud Workflows
- [Google (Gemini)](/de/providers/google) — Einrichtung des Bildproviders Gemini
- [MiniMax](/de/providers/minimax) — Einrichtung des Bildproviders MiniMax
- [OpenAI](/de/providers/openai) — Einrichtung des Providers OpenAI Images
- [Vydra](/providers/vydra) — Einrichtung von Bild, Video und Sprache mit Vydra
- [Konfigurationsreferenz](/de/gateway/configuration-reference#agent-defaults) — Konfiguration von `imageGenerationModel`
- [Models](/de/concepts/models) — Modellkonfiguration und Failover
