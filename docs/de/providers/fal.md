---
read_when:
    - Sie möchten die fal-Bildgenerierung in OpenClaw verwenden
    - Sie benötigen den FAL_KEY-Authentifizierungsablauf
    - Sie möchten fal-Standardwerte für image_generate oder video_generate
summary: Einrichtung der fal-Bild- und Videoerzeugung in OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-06T03:10:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1922907d2c8360c5877a56495323d54bd846d47c27a801155e3d11e3f5706fbd
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw wird mit einem gebündelten `fal`-Provider für gehostete Bild- und Videoerzeugung ausgeliefert.

- Provider: `fal`
- Auth: `FAL_KEY` (kanonisch; `FAL_API_KEY` funktioniert auch als Fallback)
- API: fal-Modell-Endpoints

## Schnellstart

1. Setzen Sie den API-Schlüssel:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Setzen Sie ein Standard-Bildmodell:

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

Der gebündelte `fal`-Provider für Bildgenerierung verwendet standardmäßig
`fal/fal-ai/flux/dev`.

- Generierung: bis zu 4 Bilder pro Anfrage
- Bearbeitungsmodus: aktiviert, 1 Referenzbild
- Unterstützt `size`, `aspectRatio` und `resolution`
- Aktuelle Einschränkung bei der Bearbeitung: Der fal-Endpunkt zur Bildbearbeitung unterstützt **keine**
  Überschreibungen von `aspectRatio`

So verwenden Sie fal als Standard-Provider für Bilder:

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

## Videoerzeugung

Der gebündelte `fal`-Provider für Videoerzeugung verwendet standardmäßig
`fal/fal-ai/minimax/video-01-live`.

- Modi: Text-zu-Video und Abläufe mit Einzelbild-Referenz
- Laufzeit: warteschlangenbasierter Ablauf für Übermittlung/Status/Ergebnis bei lang laufenden Jobs

So verwenden Sie fal als Standard-Provider für Videos:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/minimax/video-01-live",
      },
    },
  },
}
```

## Verwandt

- [Image Generation](/de/tools/image-generation)
- [Video Generation](/tools/video-generation)
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults)
