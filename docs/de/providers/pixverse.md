---
read_when:
    - Sie möchten die Videogenerierung von PixVerse in OpenClaw verwenden
    - Sie benötigen die Einrichtung des PixVerse-API-Schlüssels/der Umgebungsvariablen
    - Sie möchten PixVerse zum standardmäßigen Video-Provider machen
summary: PixVerse-Videogenerierung in OpenClaw einrichten
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:06:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw stellt `pixverse` als offizielles externes Plugin für gehostete PixVerse-Videogenerierung bereit. Das Plugin registriert den Provider `pixverse` gegen den Vertrag `videoGenerationProviders`.

| Eigenschaft        | Wert                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| Provider-ID        | `pixverse`                                                                  |
| Plugin-Paket       | `@openclaw/pixverse-provider`                                               |
| Auth-Umgebungsvariable | `PIXVERSE_API_KEY`                                                       |
| Onboarding-Flag    | `--auth-choice pixverse-api-key`                                            |
| Direkter CLI-Flag  | `--pixverse-api-key <key>`                                                  |
| API                | PixVerse Platform API v2 (`video_id`-Übermittlung plus Ergebnis-Polling)    |
| Standardmodell     | `pixverse/v6`                                                               |
| Standard-API-Region | International                                                              |

## Erste Schritte

<Steps>
  <Step title="Installieren Sie das Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Legen Sie den API-Schlüssel fest">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Der Assistent fragt, ob der internationale Endpunkt
    (`https://app-api.pixverse.ai/openapi/v2`) oder der CN-Endpunkt
    (`https://app-api.pixverseai.cn/openapi/v2`) verwendet werden soll, bevor `region` und
    `baseUrl` in die Provider-Konfiguration geschrieben werden.

  </Step>
  <Step title="Legen Sie PixVerse als Standard-Video-Provider fest">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Generieren Sie ein Video">
    Bitten Sie den Agenten, ein Video zu generieren. PixVerse wird automatisch verwendet.
  </Step>
</Steps>

## Unterstützte Modi und Modelle

Der Provider stellt PixVerse-Generierungsmodelle über das gemeinsame Video-Tool von OpenClaw bereit.

| Modus          | Modelle              | Referenzeingabe          |
| -------------- | -------------------- | ------------------------ |
| Text-zu-Video  | `v6` (Standard), `c1` | Keine                    |
| Bild-zu-Video  | `v6` (Standard), `c1` | 1 lokales oder Remote-Bild |

Lokale Bildreferenzen werden vor der Bild-zu-Video-Anfrage zu PixVerse hochgeladen. Remote-Bild-URLs werden über den PixVerse-Bildupload-Endpunkt als `image_url` weitergegeben.

| Option            | Unterstützte Werte                                                             |
| ----------------- | ------------------------------------------------------------------------------ |
| Dauer             | 1-15 Sekunden                                                                  |
| Auflösung         | `360P`, `540P`, `720P`, `1080P`                                                |
| Seitenverhältnis  | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` für Text-zu-Video    |
| Generiertes Audio | `audio: true`                                                                  |

<Note>
Die PixVerse-Bildvorlagengenerierung wird noch nicht über `image_generate` bereitgestellt. Diese API wird über Template-IDs gesteuert, während der gemeinsame Bildgenerierungsvertrag von OpenClaw derzeit kein PixVerse-spezifisches typisiertes Optionsobjekt hat.
</Note>

## Provider-Optionen

Der Video-Provider akzeptiert diese optionalen Provider-spezifischen Schlüssel:

| Option                               | Typ    | Wirkung                                  |
| ------------------------------------ | ------ | ---------------------------------------- |
| `seed`                               | number | Deterministischer Seed, sofern unterstützt |
| `negativePrompt` / `negative_prompt` | string | Negativer Prompt                         |
| `quality`                            | string | PixVerse-Qualität wie `720p`             |
| `motionMode` / `motion_mode`         | string | Bewegungsmodus für Bild-zu-Video         |
| `cameraMovement` / `camera_movement` | string | PixVerse-Kamerabewegungs-Preset          |
| `templateId` / `template_id`         | number | Aktivierte PixVerse-Template-ID          |

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
    OpenClaw verwendet standardmäßig die internationale PixVerse-API. Legen Sie `models.providers.pixverse.region`
    manuell fest, wenn Ihr Schlüssel zu einer bestimmten PixVerse-Plattformregion gehört, oder verwenden Sie
    `openclaw onboard --auth-choice pixverse-api-key`, um im Einrichtungsassistenten eine Region auszuwählen:

    | Regionswert     | PixVerse-API-Basis-URL                      |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

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
    Legen Sie `models.providers.pixverse.baseUrl` nur fest, wenn das Routing über einen vertrauenswürdigen kompatiblen Proxy erfolgt.
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

  <Accordion title="Aufgaben-Polling">
    PixVerse gibt aus der Generierungsanfrage eine `video_id` zurück. OpenClaw pollt
    `/openapi/v2/video/result/{video_id}`, bis die Aufgabe erfolgreich ist, fehlschlägt
    oder ein Timeout erreicht.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Tool-Parameter, Provider-Auswahl und asynchrones Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agenten-Standardeinstellungen einschließlich Videogenerierungsmodell.
  </Card>
</CardGroup>
