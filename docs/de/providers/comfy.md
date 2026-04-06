---
read_when:
    - Sie möchten lokale ComfyUI-Workflows mit OpenClaw verwenden
    - Sie möchten Comfy Cloud mit Bild-, Video- oder Musik-Workflows verwenden
    - Sie benötigen die Konfigurationsschlüssel des gebündelten comfy-Plugins
summary: Einrichtung workflowgesteuerter Bild-, Video- und Musikgenerierung mit ComfyUI in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-06T03:10:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e645f32efdffdf4cd498684f1924bb953a014d3656b48f4b503d64e38c61ba9c
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

OpenClaw enthält ein gebündeltes Plugin `comfy` für workflowgesteuerte ComfyUI-Läufe.

- Provider: `comfy`
- Modelle: `comfy/workflow`
- Gemeinsame Oberflächen: `image_generate`, `video_generate`, `music_generate`
- Auth: keine für lokales ComfyUI; `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Comfy Cloud
- API: ComfyUI `/prompt` / `/history` / `/view` und Comfy Cloud `/api/*`

## Was es unterstützt

- Bildgenerierung aus einer Workflow-JSON
- Bildbearbeitung mit 1 hochgeladenen Referenzbild
- Videogenerierung aus einer Workflow-JSON
- Videogenerierung mit 1 hochgeladenen Referenzbild
- Musik- oder Audiogenerierung über das gemeinsame Tool `music_generate`
- Herunterladen von Ausgaben aus einem konfigurierten Node oder aus allen passenden Ausgabe-Nodes

Das gebündelte Plugin ist workflowgesteuert, daher versucht OpenClaw nicht, generische
Steuerungen wie `size`, `aspectRatio`, `resolution`, `durationSeconds` oder TTS-artige Einstellungen
auf Ihren Graphen abzubilden.

## Konfigurationslayout

Comfy unterstützt gemeinsame Verbindungseinstellungen auf oberster Ebene sowie Workflow-
Abschnitte pro Capability:

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

Gemeinsame Schlüssel:

- `mode`: `local` oder `cloud`
- `baseUrl`: standardmäßig `http://127.0.0.1:8188` für lokal oder `https://cloud.comfy.org` für Cloud
- `apiKey`: optionale Inline-Schlüsselalternative zu Env-Variablen
- `allowPrivateNetwork`: erlaubt eine private/LAN-`baseUrl` im Cloud-Modus

Schlüssel pro Capability unter `image`, `video` oder `music`:

- `workflow` oder `workflowPath`: erforderlich
- `promptNodeId`: erforderlich
- `promptInputName`: standardmäßig `text`
- `outputNodeId`: optional
- `pollIntervalMs`: optional
- `timeoutMs`: optional

Bild- und Videoabschnitte unterstützen außerdem:

- `inputImageNodeId`: erforderlich, wenn Sie ein Referenzbild übergeben
- `inputImageInputName`: standardmäßig `image`

## Abwärtskompatibilität

Bestehende Bildkonfiguration auf oberster Ebene funktioniert weiterhin:

```json5
{
  models: {
    providers: {
      comfy: {
        workflowPath: "./workflows/flux-api.json",
        promptNodeId: "6",
        outputNodeId: "9",
      },
    },
  },
}
```

OpenClaw behandelt diese ältere Form als die Konfiguration für den Bild-Workflow.

## Bild-Workflows

Legen Sie das Standardbildmodell fest:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Beispiel für Bearbeitung mit Referenzbild:

```json5
{
  models: {
    providers: {
      comfy: {
        image: {
          workflowPath: "./workflows/edit-api.json",
          promptNodeId: "6",
          inputImageNodeId: "7",
          inputImageInputName: "image",
          outputNodeId: "9",
        },
      },
    },
  },
}
```

## Video-Workflows

Legen Sie das Standardvideomodell fest:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Comfy-Video-Workflows unterstützen derzeit Text-zu-Video und Bild-zu-Video über
den konfigurierten Graphen. OpenClaw übergibt keine Eingabevideos an Comfy-Workflows.

## Musik-Workflows

Das gebündelte Plugin registriert einen Provider für Musikgenerierung für workflowdefinierte
Audio- oder Musikausgaben, bereitgestellt über das gemeinsame Tool `music_generate`:

```text
/tool music_generate prompt="Warme Ambient-Synth-Loop mit weicher Tape-Textur"
```

Verwenden Sie den Konfigurationsabschnitt `music`, um auf Ihre Audio-Workflow-JSON und den Ausgabe-
Node zu verweisen.

## Comfy Cloud

Verwenden Sie `mode: "cloud"` plus eines von:

- `COMFY_API_KEY`
- `COMFY_CLOUD_API_KEY`
- `models.providers.comfy.apiKey`

Der Cloud-Modus verwendet weiterhin dieselben Workflow-Abschnitte `image`, `video` und `music`.

## Live-Tests

Es gibt optionale Live-Abdeckung für das gebündelte Plugin:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Der Live-Test überspringt einzelne Fälle für Bild, Video oder Musik, sofern der passende
Comfy-Workflow-Abschnitt nicht konfiguriert ist.

## Verwandt

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/tools/video-generation)
- [Musikgenerierung](/tools/music-generation)
- [Provider-Verzeichnis](/de/providers/index)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#agent-defaults)
