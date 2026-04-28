---
read_when:
    - Sie möchten die Runway-Videogenerierung in OpenClaw verwenden.
    - Sie benötigen die Einrichtung von API key/Env für Runway.
    - Sie möchten Runway zum Standard-Provider für Video machen.
summary: Einrichtung der Runway-Videogenerierung in OpenClaw
title: Runway
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T06:55:51Z"
  model: gpt-5.4
  provider: openai
  source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
  source_path: providers/runway.md
  workflow: 15
---

OpenClaw enthält einen gebündelten Provider `runway` für gehostete Videogenerierung.

| Eigenschaft  | Wert                                                              |
| ------------ | ----------------------------------------------------------------- |
| Provider-ID  | `runway`                                                          |
| Auth         | `RUNWAYML_API_SECRET` (kanonisch) oder `RUNWAY_API_KEY`           |
| API          | Task-basierte Runway-Videogenerierung (`GET /v1/tasks/{id}`-Polling) |

## Erste Schritte

<Steps>
  <Step title="Den API key setzen">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway als Standard-Provider für Video setzen">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Ein Video generieren">
    Bitten Sie den Agenten, ein Video zu generieren. Runway wird automatisch verwendet.
  </Step>
</Steps>

## Unterstützte Modi

| Modus          | Modell            | Referenz-Input          |
| -------------- | ----------------- | ----------------------- |
| Text-zu-Video  | `gen4.5` (Standard) | Keine                 |
| Bild-zu-Video  | `gen4.5`          | 1 lokales oder entferntes Bild |
| Video-zu-Video | `gen4_aleph`      | 1 lokales oder entferntes Video |

<Note>
Lokale Bild- und Video-Referenzen werden über Daten-URIs unterstützt. Rein textbasierte Läufe
stellen derzeit die Seitenverhältnisse `16:9` und `9:16` bereit.
</Note>

<Warning>
Video-zu-Video erfordert derzeit speziell `runway/gen4_aleph`.
</Warning>

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

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Aliase für Umgebungsvariablen">
    OpenClaw erkennt sowohl `RUNWAYML_API_SECRET` (kanonisch) als auch `RUNWAY_API_KEY`.
    Jede dieser Variablen authentifiziert den Runway-Provider.
  </Accordion>

  <Accordion title="Task-Polling">
    Runway verwendet eine task-basierte API. Nach dem Absenden einer Generierungsanfrage pollt OpenClaw
    `GET /v1/tasks/{id}`, bis das Video bereit ist. Für das Polling-Verhalten ist keine zusätzliche
    Konfiguration erforderlich.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Video generation" href="/de/tools/video-generation" icon="video">
    Gemeinsame Tool-Parameter, Provider-Auswahl und asynchrones Verhalten.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Standard-Agent-Einstellungen einschließlich Modell für Videogenerierung.
  </Card>
</CardGroup>
