---
read_when:
    - Je wilt PixVerse-videogeneratie gebruiken in OpenClaw
    - Je moet de PixVerse-API-sleutel en omgevingsvariabelen instellen
    - Je wilt PixVerse als standaardvideoprovider instellen
summary: Configuratie voor PixVerse-videogeneratie in OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T09:14:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw biedt `pixverse` als officiële externe plugin voor gehoste videogeneratie met PixVerse. De plugin registreert de `pixverse`-provider voor het `videoGenerationProviders`-contract.

| Eigenschap          | Waarde                                                                       |
| ------------------- | ---------------------------------------------------------------------------- |
| Provider-id         | `pixverse`                                                                   |
| Plugin-pakket       | `@openclaw/pixverse-provider`                                                |
| Omgevingsvariabele voor authenticatie | `PIXVERSE_API_KEY`                                      |
| Onboarding-vlag     | `--auth-choice pixverse-api-key`                                             |
| Rechtstreekse CLI-vlag | `--pixverse-api-key <key>`                                                |
| API                 | PixVerse Platform API v2 (indiening met `video_id` plus peilen van resultaat) |
| Standaardmodel      | `pixverse/v6`                                                                |
| Standaard-API-regio | Internationaal                                                               |

## Aan de slag

<Steps>
  <Step title="Installeer de plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Stel de API-sleutel in">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    De wizard vraagt om het internationale of Chinese eindpunt (zie API-regio
    hieronder) voordat `region` en `baseUrl` naar de providerconfiguratie worden
    geschreven. Niet-interactieve uitvoeringen (sleutel via `--pixverse-api-key`
    of `PIXVERSE_API_KEY`) gebruiken standaard Internationaal.

    Onboarding stelt ook `agents.defaults.videoGenerationModel.primary` in op
    `pixverse/v6` wanneer er nog geen standaardvideomodel is geconfigureerd.

  </Step>
  <Step title="Wijzig een bestaande standaardprovider voor video (optioneel)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Genereer een video">
    Vraag de agent om een video te genereren. PixVerse wordt automatisch gebruikt.
  </Step>
</Steps>

## Ondersteunde modi en modellen

De provider stelt PixVerse-generatiemodellen beschikbaar via de gedeelde videotool van OpenClaw.

| Modus             | Modellen             | Referentie-invoer               |
| ----------------- | -------------------- | ------------------------------- |
| Tekst-naar-video  | `v6` (standaard), `c1` | Geen                          |
| Afbeelding-naar-video | `v6` (standaard), `c1` | 1 lokale of externe afbeelding |

Lokale afbeeldingsreferenties worden naar PixVerse geüpload vóór het verzoek voor afbeelding-naar-video. URL's van externe afbeeldingen worden via het PixVerse-eindpunt voor het uploaden van afbeeldingen doorgegeven als `image_url`.

| Optie              | Ondersteunde waarden                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Duur               | 1-15 seconden (standaard 5)                                                                                                                     |
| Resolutie          | `360P`, `540P`, `720P`, `1080P` (standaard `540P`; verzoeken voor `480P` worden toegewezen aan `540P`)                                         |
| Beeldverhouding    | `16:9` (standaard), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; alleen tekst-naar-video, afbeelding-naar-video volgt de bronafbeelding |
| Gegenereerde audio | `audio: true`                                                                                                                                   |

<Note>
Het genereren van PixVerse-afbeeldingssjablonen is nog niet beschikbaar via `image_generate`. Die API wordt aangestuurd door sjabloon-id's, terwijl het gedeelde contract voor afbeeldingsgeneratie van OpenClaw momenteel geen PixVerse-specifieke getypeerde optiegroep bevat.
</Note>

## Provideropties

De videoprovider accepteert deze optionele providerspecifieke sleutels:

| Optie                                | Type   | Effect                                               |
| ------------------------------------ | ------ | ---------------------------------------------------- |
| `seed`                               | getal  | Deterministische seed, van 0 tot 2147483647          |
| `negativePrompt` / `negative_prompt` | tekenreeks | Negatieve prompt                                  |
| `quality`                            | tekenreeks | PixVerse-kwaliteit, zoals `720p`                  |
| `motionMode` / `motion_mode`         | tekenreeks | Bewegingsmodus voor afbeelding-naar-video (standaard `normal`) |
| `cameraMovement` / `camera_movement` | tekenreeks | PixVerse-voorinstelling voor camerabeweging       |
| `templateId` / `template_id`         | getal  | Id van geactiveerd PixVerse-sjabloon                 |

## Configuratie

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

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="API-regio">
    | Regiowaarde     | Basis-URL van PixVerse-API                    |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    Stel `models.providers.pixverse.region` handmatig in wanneer uw sleutel bij
    een specifieke PixVerse-platformregio hoort, of voer
    `openclaw onboard --auth-choice pixverse-api-key` uit om er een te kiezen
    in de installatiewizard:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" of "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Aangepaste basis-URL">
    Stel `models.providers.pixverse.baseUrl` alleen in wanneer verkeer via een vertrouwde, compatibele proxy wordt geleid.
    `baseUrl` heeft voorrang op `region`.

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

  <Accordion title="Taakstatus peilen">
    PixVerse retourneert een `video_id` vanuit het generatieverzoek. OpenClaw peilt
    `/openapi/v2/video/result/{video_id}` elke 5 seconden totdat de taak
    slaagt, mislukt of de time-out bereikt (standaard 5 minuten; overschrijf dit met
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde toolparameters, providerselectie en asynchroon gedrag.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Standaardinstellingen voor agents, inclusief het model voor videogeneratie.
  </Card>
</CardGroup>
