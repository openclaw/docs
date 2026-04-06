---
read_when:
    - Sie möchten die Alibaba-Wan-Videogenerierung in OpenClaw verwenden
    - Sie benötigen die Einrichtung eines API-Schlüssels für Model Studio oder DashScope zur Videogenerierung
summary: Alibaba Model Studio Wan-Videogenerierung in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-06T03:09:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 97a1eddc7cbd816776b9368f2a926b5ef9ee543f08d151a490023736f67dc635
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw enthält einen gebündelten Provider zur Videogenerierung `alibaba` für Wan-Modelle auf
Alibaba Model Studio / DashScope.

- Provider: `alibaba`
- Bevorzugte Authentifizierung: `MODELSTUDIO_API_KEY`
- Ebenfalls akzeptiert: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: Asynchrone Videogenerierung über DashScope / Model Studio

## Schnellstart

1. API-Schlüssel setzen:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

2. Ein Standard-Videomodell festlegen:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "alibaba/wan2.6-t2v",
      },
    },
  },
}
```

## Integrierte Wan-Modelle

Der gebündelte Provider `alibaba` registriert derzeit:

- `alibaba/wan2.6-t2v`
- `alibaba/wan2.6-i2v`
- `alibaba/wan2.6-r2v`
- `alibaba/wan2.6-r2v-flash`
- `alibaba/wan2.7-r2v`

## Aktuelle Grenzen

- Bis zu **1** Ausgabevideo pro Anfrage
- Bis zu **1** Eingabebild
- Bis zu **4** Eingabevideos
- Bis zu **10 Sekunden** Dauer
- Unterstützt `size`, `aspectRatio`, `resolution`, `audio` und `watermark`
- Der Modus für Referenzbild/-video erfordert derzeit **entfernte http(s)-URLs**

## Beziehung zu Qwen

Der gebündelte Provider `qwen` verwendet ebenfalls von Alibaba gehostete DashScope-Endpunkte für
die Wan-Videogenerierung. Verwenden Sie:

- `qwen/...`, wenn Sie die kanonische Qwen-Provider-Oberfläche möchten
- `alibaba/...`, wenn Sie die direkte, anbieterbetriebene Wan-Video-Oberfläche möchten

## Verwandt

- [Videogenerierung](/tools/video-generation)
- [Qwen](/de/providers/qwen)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#agent-defaults)
