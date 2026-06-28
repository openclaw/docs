---
read_when:
    - Sie möchten die Videogenerierung von Runway in OpenClaw verwenden
    - Sie benötigen die Einrichtung des Runway-API-Schlüssels bzw. der Umgebungsvariablen
    - Sie möchten Runway als Standard-Video-Provider festlegen
summary: Einrichtung der Runway-Videogenerierung in OpenClaw
title: Start- und Landebahn
x-i18n:
    generated_at: "2026-05-06T07:01:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw enthält einen gebündelten `runway`-Provider für gehostete Videogenerierung. Das Plugin ist standardmäßig aktiviert und registriert den `runway`-Provider für den `videoGenerationProviders`-Contract.

| Eigenschaft           | Wert                                                              |
| --------------------- | ----------------------------------------------------------------- |
| Provider-ID           | `runway`                                                          |
| Plugin                | gebündelt, `enabledByDefault: true`                               |
| Auth-Umgebungsvariablen | `RUNWAYML_API_SECRET` (kanonisch) oder `RUNWAY_API_KEY`         |
| Onboarding-Flag       | `--auth-choice runway-api-key`                                    |
| Direktes CLI-Flag     | `--runway-api-key <key>`                                          |
| API                   | Runway-Aufgaben-basierte Videogenerierung (`GET /v1/tasks/{id}` polling) |
| Standardmodell        | `runway/gen4.5`                                                   |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway als Standard-Video-Provider festlegen">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Video generieren">
    Bitten Sie den Agenten, ein Video zu generieren. Runway wird automatisch verwendet.
  </Step>
</Steps>

## Unterstützte Modi und Modelle

Der Provider stellt sieben Runway-Modelle in drei Modi bereit. Dieselbe Modell-ID kann für mehr als einen Modus dienen (zum Beispiel funktioniert `gen4.5` sowohl für Text-zu-Video als auch für Bild-zu-Video).

| Modus          | Modelle                                                                | Referenzeingabe         |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| Text-zu-Video  | `gen4.5` (Standard), `veo3.1`, `veo3.1_fast`, `veo3`                    | Keine                   |
| Bild-zu-Video  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 lokales oder entferntes Bild |
| Video-zu-Video | `gen4_aleph`                                                           | 1 lokales oder entferntes Video |

Lokale Bild- und Videoreferenzen werden über Data-URIs unterstützt.

| Seitenverhältnisse    | Zulässige Werte                             |
| --------------------- | ------------------------------------------- |
| Text-zu-Video         | `16:9`, `9:16`                              |
| Bild- und Videobearbeitungen | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Video-zu-Video erfordert derzeit `runway/gen4_aleph`. Andere Runway-Modell-IDs lehnen Videoreferenzeingaben ab.
</Warning>

<Note>
  Die Auswahl einer Runway-Modell-ID aus der falschen Spalte erzeugt einen expliziten Fehler, bevor die API-Anfrage OpenClaw verlässt. Der Provider validiert `model` gegen die Allowlist des Modus (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) in `extensions/runway/video-generation-provider.ts`.
</Note>

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
  <Accordion title="Aliasse für Umgebungsvariablen">
    OpenClaw erkennt sowohl `RUNWAYML_API_SECRET` (kanonisch) als auch `RUNWAY_API_KEY`.
    Beide Variablen authentifizieren den Runway-Provider.
  </Accordion>

  <Accordion title="Aufgaben-Polling">
    Runway verwendet eine aufgabenbasierte API. Nach dem Senden einer Generierungsanfrage fragt OpenClaw
    `GET /v1/tasks/{id}` ab, bis das Video bereit ist. Für das Polling-Verhalten ist keine zusätzliche
    Konfiguration erforderlich.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Tool-Parameter, Provider-Auswahl und asynchrones Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Standard-Agenteneinstellungen einschließlich Videogenerierungsmodell.
  </Card>
</CardGroup>
