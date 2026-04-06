---
read_when:
    - Sie möchten die Runway-Videogenerierung in OpenClaw verwenden
    - Sie benötigen die Einrichtung des Runway-API-Schlüssels/der Umgebungsvariablen
    - Sie möchten Runway zum Standard-Video-Provider machen
summary: Einrichtung der Runway-Videogenerierung in OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-06T03:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc615d1a26f7a4b890d29461e756690c858ecb05024cf3c4d508218022da6e76
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw enthält einen gebündelten `runway`-Provider für gehostete Videogenerierung.

- Provider-ID: `runway`
- Auth: `RUNWAYML_API_SECRET` (kanonisch) oder `RUNWAY_API_KEY`
- API: Aufgabenbasierte Runway-Videogenerierung (`GET /v1/tasks/{id}`-Polling)

## Schnellstart

1. Setzen Sie den API-Schlüssel:

```bash
openclaw onboard --auth-choice runway-api-key
```

2. Setzen Sie Runway als Standard-Video-Provider:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
```

3. Bitten Sie den Agenten, ein Video zu generieren. Runway wird automatisch verwendet.

## Unterstützte Modi

| Modus           | Modell             | Referenzeingabe            |
| --------------- | ------------------ | -------------------------- |
| Text-zu-Video   | `gen4.5` (Standard) | Keine                     |
| Bild-zu-Video   | `gen4.5`           | 1 lokales oder entferntes Bild |
| Video-zu-Video  | `gen4_aleph`       | 1 lokales oder entferntes Video |

- Lokale Bild- und Videoreferenzen werden über Daten-URIs unterstützt.
- Video-zu-Video erfordert derzeit ausdrücklich `runway/gen4_aleph`.
- Rein textbasierte Läufe bieten derzeit die Seitenverhältnisse `16:9` und `9:16`.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Verwandt

- [Video Generation](/tools/video-generation) -- gemeinsame Tool-Parameter, Provider-Auswahl und asynchrones Verhalten
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults)
