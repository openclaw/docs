---
read_when:
    - Sie möchten die PixVerse-Videogenerierung in OpenClaw verwenden
    - Sie müssen den PixVerse-API-Schlüssel und die Umgebungsvariablen einrichten
    - Sie möchten PixVerse als Standard-Provider für Videos festlegen
summary: Einrichtung der PixVerse-Videogenerierung in OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-24T04:07:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3dba881e877e3da4677a40dff736cb46de114337a1e0338ef8220dcd8e616f46
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw stellt `pixverse` als offizielles externes Plugin für die gehostete PixVerse-Videogenerierung bereit. Das Plugin registriert den Provider `pixverse` für den Vertrag `videoGenerationProviders`.

| Eigenschaft        | Wert                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| Provider-ID        | `pixverse`                                                   |
| Plugin-Paket       | `@openclaw/pixverse-provider`                                                   |
| Authentifizierungs-Umgebungsvariable | `PIXVERSE_API_KEY`                              |
| Onboarding-Flag    | `--auth-choice pixverse-api-key`                                                   |
| Direktes CLI-Flag  | `--pixverse-api-key <key>`                                                   |
| API                | PixVerse Platform API v2 (Übermittlung über `video_id` sowie Abfrage des Ergebnisses) |
| Standardmodell     | `pixverse/v6`                                                   |
| Standard-API-Region | International                                                       |

## Erste Schritte

<Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="API-Schlüssel festlegen">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Der Assistent fragt nach dem Endpunkt International oder CN (siehe API-Region
    unten), bevor er `region` und `baseUrl` in die Provider-Konfiguration schreibt.
    Nicht interaktive Ausführungen (Schlüssel aus `--pixverse-api-key` oder `PIXVERSE_API_KEY`)
    verwenden standardmäßig International.

    Das Onboarding setzt außerdem `agents.defaults.mediaModels.video.primary` auf
    `pixverse/v6`, wenn noch kein Standard-Videomodell konfiguriert ist.

  </Step>
  <Step title="Vorhandenen Standard-Provider für Videos wechseln (optional)">
    ```bash
    openclaw config set agents.defaults.mediaModels.video.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Video generieren">
    Bitten Sie den Agenten, ein Video zu generieren. PixVerse wird automatisch verwendet.
  </Step>
</Steps>

## Unterstützte Modi und Modelle

Der Provider stellt PixVerse-Generierungsmodelle über das gemeinsame Videowerkzeug von OpenClaw bereit.

| Modus          | Modelle              | Referenzeingabe          |
| -------------- | -------------------- | ------------------------ |
| Text-zu-Video  | `v6` (Standard), `c1` | Keine                    |
| Bild-zu-Video  | `v6` (Standard), `c1` | 1 lokales oder entferntes Bild |

Lokale Bildreferenzen werden vor der Bild-zu-Video-Anfrage zu PixVerse hochgeladen. URLs entfernter Bilder werden als `image_url` an den PixVerse-Endpunkt zum Hochladen von Bildern übergeben.

| Option          | Unterstützte Werte                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Dauer           | 1–15 Sekunden (Standard: 5)                                                                                                     |
| Auflösung       | `360P`, `540P`, `720P`, `1080P` (Standard: `540P`; Anfragen für `480P` werden `540P` zugeordnet) |
| Seitenverhältnis | `16:9` (Standard), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; nur Text-zu-Video, Bild-zu-Video übernimmt das Quellbild |
| Generiertes Audio | `audio: true`                                                                                                            |

<Note>
Die Generierung von PixVerse-Bildvorlagen wird über `image_generate` noch nicht bereitgestellt. Diese API wird über Vorlagen-IDs gesteuert, während der gemeinsame Vertrag von OpenClaw zur Bildgenerierung derzeit keinen PixVerse-spezifischen typisierten Optionssatz besitzt.
</Note>

## Provider-Optionen

Der Video-Provider akzeptiert folgende optionale Provider-spezifische Schlüssel:

| Option                               | Typ    | Wirkung                                       |
| ------------------------------------ | ------ | --------------------------------------------- |
| `seed`                   | Zahl   | Deterministischer Seed von 0 bis 2147483647   |
| `negativePrompt` / `negative_prompt` | Zeichenfolge | Negativer Prompt                      |
| `quality`                   | Zeichenfolge | PixVerse-Qualität wie `720p` |
| `motionMode` / `motion_mode` | Zeichenfolge | Bewegungsmodus für Bild-zu-Video (Standard: `normal`) |
| `cameraMovement` / `camera_movement` | Zeichenfolge | PixVerse-Voreinstellung für Kamerabewegungen |
| `templateId` / `template_id` | Zahl   | Aktivierte PixVerse-Vorlagen-ID               |

## Konfiguration

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="API-Region">
    | Regionswert     | PixVerse-API-Basis-URL                      |
    | --------------- | ------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`                       |
    | `cn` | `https://app-api.pixverseai.cn/openapi/v2`                       |

    Legen Sie `models.providers.pixverse.region` manuell fest, wenn Ihr Schlüssel zu einer
    bestimmten PixVerse-Plattformregion gehört, oder führen Sie
    `openclaw onboard --auth-choice pixverse-api-key` aus, um im
    Einrichtungsassistenten eine Region auszuwählen:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Benutzerdefinierte Basis-URL">
    Legen Sie `models.providers.pixverse.baseUrl` nur fest, wenn die Weiterleitung über einen vertrauenswürdigen kompatiblen Proxy erfolgt.
    `baseUrl` hat Vorrang vor `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Task-Abfrage">
    PixVerse gibt bei der Generierungsanfrage eine `video_id` zurück. OpenClaw fragt
    `/openapi/v2/video/result/{video_id}` alle 5 Sekunden ab, bis der Task
    erfolgreich abgeschlossen wird, fehlschlägt oder das Zeitlimit erreicht (Standard: 5 Minuten; mit
    `agents.defaults.mediaModels.video.timeoutMs` überschreibbar).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Werkzeugparameter, Provider-Auswahl und asynchrones Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Standardeinstellungen des Agenten einschließlich des Modells zur Videogenerierung.
  </Card>
</CardGroup>
