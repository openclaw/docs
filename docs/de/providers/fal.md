---
read_when:
    - Sie möchten die Bildgenerierung mit fal in OpenClaw verwenden
    - Sie benötigen den Auth-Flow für `FAL_KEY`
    - Sie möchten fal-Standards für `image_generate` oder `video_generate`
summary: fal-Einrichtung für Bild- und Videogenerierung in OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-11T02:47:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9bfe4f69124e922a79a516a1bd78f0c00f7a45f3c6f68b6d39e0d196fa01beb3
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw enthält einen gebündelten `fal`-Provider für gehostete Bild- und Videogenerierung.

- Provider: `fal`
- Auth: `FAL_KEY` (kanonisch; `FAL_API_KEY` funktioniert auch als Fallback)
- API: fal-Modellendpunkte

## Schnellstart

1. API-Schlüssel setzen:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Standard-Bildmodell festlegen:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Bildgenerierung

Der gebündelte Provider für die Bildgenerierung mit `fal` verwendet standardmäßig
`fal/fal-ai/flux/dev`.

- Generierung: bis zu 4 Bilder pro Anfrage
- Edit-Modus: aktiviert, 1 Referenzbild
- Unterstützt `size`, `aspectRatio` und `resolution`
- Aktuelle Einschränkung beim Bearbeiten: Der fal-Endpunkt für die Bildbearbeitung unterstützt **keine**
  `aspectRatio`-Überschreibungen

Um fal als Standardprovider für Bilder zu verwenden:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Videogenerierung

Der gebündelte Provider für die Videogenerierung mit `fal` verwendet standardmäßig
`fal/fal-ai/minimax/video-01-live`.

- Modi: Text-zu-Video und Flows mit einem einzelnen Referenzbild
- Laufzeit: Queue-gestützter Submit-/Status-/Ergebnis-Flow für lang laufende Jobs
- HeyGen-Modellreferenz für Video-Agent:
  - `fal/fal-ai/heygen/v2/video-agent`
- Modellreferenzen für Seedance 2.0:
  - `fal/bytedance/seedance-2.0/fast/text-to-video`
  - `fal/bytedance/seedance-2.0/fast/image-to-video`
  - `fal/bytedance/seedance-2.0/text-to-video`
  - `fal/bytedance/seedance-2.0/image-to-video`

Um Seedance 2.0 als Standardvideomodell zu verwenden:

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

Um den HeyGen-Video-Agent als Standardvideomodell zu verwenden:

```json5
{
  "agents": {
    "defaults": {
      "videoGenerationModel": {
        "primary": "fal/fal-ai/heygen/v2/video-agent"
      }
    }
  }
}
```

## Verwandt

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#agent-defaults)
