---
read_when:
    - Sie möchten die PixVerse-Videogenerierung in OpenClaw verwenden
    - Sie müssen den PixVerse-API-Schlüssel und die Umgebungsvariablen einrichten
    - Sie möchten PixVerse zum standardmäßigen Video-Provider machen
summary: Einrichtung der PixVerse-Videogenerierung in OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T15:54:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw stellt `pixverse` als offizielles externes Plugin für die gehostete PixVerse-Videogenerierung bereit. Das Plugin registriert den Provider `pixverse` für den Vertrag `videoGenerationProviders`.

| Eigenschaft        | Wert                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Provider-ID        | `pixverse`                                                                                 |
| Plugin-Paket       | `@openclaw/pixverse-provider`                                                              |
| Auth-Umgebungsvariable | `PIXVERSE_API_KEY`                                                                     |
| Onboarding-Flag    | `--auth-choice pixverse-api-key`                                                           |
| Direktes CLI-Flag  | `--pixverse-api-key <key>`                                                                 |
| API                | PixVerse Platform API v2 (Übermittlung einer `video_id` mit anschließender Ergebnisabfrage) |
| Standardmodell     | `pixverse/v6`                                                                              |
| Standard-API-Region | International                                                                             |

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

    Der Assistent fragt nach dem Endpunkt International oder CN (siehe
    API-Region unten), bevor er `region` und `baseUrl` in die
    Provider-Konfiguration schreibt. Nicht interaktive Ausführungen (Schlüssel
    aus `--pixverse-api-key` oder `PIXVERSE_API_KEY`) verwenden standardmäßig
    International.

    Das Onboarding setzt außerdem `agents.defaults.videoGenerationModel.primary`
    auf `pixverse/v6`, wenn noch kein Standard-Videomodell konfiguriert ist.

  </Step>
  <Step title="Vorhandenen Standard-Provider für Videos wechseln (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Video generieren">
    Bitten Sie den Agenten, ein Video zu generieren. PixVerse wird automatisch verwendet.
  </Step>
</Steps>

## Unterstützte Modi und Modelle

Der Provider stellt PixVerse-Generierungsmodelle über das gemeinsame Videowerkzeug von OpenClaw bereit.

| Modus          | Modelle              | Referenzeingabe                   |
| -------------- | -------------------- | --------------------------------- |
| Text-zu-Video  | `v6` (Standard), `c1` | Keine                            |
| Bild-zu-Video  | `v6` (Standard), `c1` | 1 lokales oder entferntes Bild   |

Lokale Bildreferenzen werden vor der Bild-zu-Video-Anfrage zu PixVerse hochgeladen. URLs entfernter Bilder werden als `image_url` an den PixVerse-Endpunkt zum Hochladen von Bildern übergeben.

| Option             | Unterstützte Werte                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dauer              | 1-15 Sekunden (Standard: 5)                                                                                                                      |
| Auflösung          | `360P`, `540P`, `720P`, `1080P` (Standard: `540P`; Anfragen für `480P` werden `540P` zugeordnet)                                                 |
| Seitenverhältnis   | `16:9` (Standard), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; nur Text-zu-Video, Bild-zu-Video übernimmt das Seitenverhältnis des Quellbilds |
| Generiertes Audio  | `audio: true`                                                                                                                                     |

<Note>
Die Generierung von PixVerse-Bildvorlagen wird noch nicht über `image_generate` bereitgestellt. Diese API wird über Vorlagen-IDs gesteuert, während der gemeinsame Vertrag von OpenClaw für die Bildgenerierung derzeit keine PixVerse-spezifische typisierte Optionsstruktur besitzt.
</Note>

## Provider-Optionen

Der Video-Provider akzeptiert die folgenden optionalen providerspezifischen Schlüssel:

| Option                               | Typ    | Wirkung                                                |
| ------------------------------------ | ------ | ------------------------------------------------------ |
| `seed`                               | Zahl   | Deterministischer Seed, 0 bis 2147483647               |
| `negativePrompt` / `negative_prompt` | Zeichenfolge | Negativer Prompt                                  |
| `quality`                            | Zeichenfolge | PixVerse-Qualität wie `720p`                      |
| `motionMode` / `motion_mode`         | Zeichenfolge | Bewegungsmodus für Bild-zu-Video (Standard: `normal`) |
| `cameraMovement` / `camera_movement` | Zeichenfolge | Voreinstellung für die PixVerse-Kamerabewegung    |
| `templateId` / `template_id`         | Zahl   | Aktivierte PixVerse-Vorlagen-ID                        |

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
    | Regionswert     | PixVerse-API-Basis-URL                        |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    Legen Sie `models.providers.pixverse.region` manuell fest, wenn Ihr Schlüssel
    zu einer bestimmten PixVerse-Plattformregion gehört, oder führen Sie
    `openclaw onboard --auth-choice pixverse-api-key` aus, um im
    Einrichtungsassistenten eine Region auszuwählen:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" oder "cn"
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

  <Accordion title="Aufgabenabfrage">
    PixVerse gibt bei der Generierungsanfrage eine `video_id` zurück. OpenClaw
    fragt `/openapi/v2/video/result/{video_id}` alle 5 Sekunden ab, bis die
    Aufgabe erfolgreich abgeschlossen wird, fehlschlägt oder das Zeitlimit
    erreicht (Standard: 5 Minuten; kann mit
    `agents.defaults.videoGenerationModel.timeoutMs` überschrieben werden).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Werkzeugparameter, Provider-Auswahl und asynchrones Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Standardeinstellungen des Agenten einschließlich des Modells für die Videogenerierung.
  </Card>
</CardGroup>
