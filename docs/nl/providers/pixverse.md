---
read_when:
    - Je wilt PixVerse-videogeneratie gebruiken in OpenClaw
    - Je hebt de PixVerse API-sleutel/omgevingsconfiguratie nodig
    - Je wilt PixVerse de standaard videoprovider maken
summary: Installatie van PixVerse-videogeneratie in OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:14:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw biedt `pixverse` als officiële externe plugin voor gehoste PixVerse-videogeneratie. De plugin registreert de `pixverse`-provider tegen het `videoGenerationProviders`-contract.

| Eigenschap            | Waarde                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| Provider-id           | `pixverse`                                                              |
| Pluginpakket          | `@openclaw/pixverse-provider`                                           |
| Auth-omgevingsvariabele | `PIXVERSE_API_KEY`                                                    |
| Onboarding-vlag       | `--auth-choice pixverse-api-key`                                        |
| Directe CLI-vlag      | `--pixverse-api-key <key>`                                              |
| API                   | PixVerse Platform API v2 (`video_id`-indiening plus resultaatpolling)   |
| Standaardmodel        | `pixverse/v6`                                                           |
| Standaard-API-regio   | Internationaal                                                          |

## Aan de slag

<Steps>
  <Step title="De plugin installeren">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="De API-sleutel instellen">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    De wizard vraagt of het internationale endpoint
    (`https://app-api.pixverse.ai/openapi/v2`) of het CN-endpoint
    (`https://app-api.pixverseai.cn/openapi/v2`) moet worden gebruikt voordat `region` en
    `baseUrl` naar de providerconfiguratie worden geschreven.

  </Step>
  <Step title="PixVerse instellen als standaard videoprovider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Een video genereren">
    Vraag de agent om een video te genereren. PixVerse wordt automatisch gebruikt.
  </Step>
</Steps>

## Ondersteunde modi en modellen

De provider stelt PixVerse-generatiemodellen beschikbaar via de gedeelde videotool van OpenClaw.

| Modus          | Modellen             | Referentie-invoer       |
| -------------- | -------------------- | ----------------------- |
| Tekst-naar-video | `v6` (standaard), `c1` | Geen                  |
| Afbeelding-naar-video | `v6` (standaard), `c1` | 1 lokale of externe afbeelding |

Lokale afbeeldingsreferenties worden naar PixVerse geüpload voordat het afbeelding-naar-videoverzoek wordt gedaan. Externe afbeeldings-URL's worden via het PixVerse-endpoint voor afbeeldingsuploads doorgegeven als `image_url`.

| Optie             | Ondersteunde waarden                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| Duur              | 1-15 seconden                                                              |
| Resolutie         | `360P`, `540P`, `720P`, `1080P`                                            |
| Beeldverhouding   | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` voor tekst-naar-video |
| Gegenereerde audio | `audio: true`                                                             |

<Note>
PixVerse-afbeeldingsgeneratie met templates wordt nog niet beschikbaar gesteld via `image_generate`. Die API wordt aangestuurd door template-id's, terwijl het gedeelde afbeeldingsgeneratiecontract van OpenClaw momenteel geen PixVerse-specifieke getypte optiebag heeft.
</Note>

## Provideropties

De videoprovider accepteert deze optionele providerspecifieke sleutels:

| Optie                                | Type   | Effect                                  |
| ------------------------------------ | ------ | --------------------------------------- |
| `seed`                               | number | Deterministische seed wanneer ondersteund |
| `negativePrompt` / `negative_prompt` | string | Negatieve prompt                        |
| `quality`                            | string | PixVerse-kwaliteit zoals `720p`         |
| `motionMode` / `motion_mode`         | string | Bewegingsmodus voor afbeelding-naar-video |
| `cameraMovement` / `camera_movement` | string | PixVerse-preset voor camerabeweging     |
| `templateId` / `template_id`         | number | Geactiveerde PixVerse-template-id       |

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
    OpenClaw gebruikt standaard de internationale PixVerse-API. Stel `models.providers.pixverse.region`
    handmatig in wanneer je sleutel bij een specifieke PixVerse-platformregio hoort, of gebruik
    `openclaw onboard --auth-choice pixverse-api-key` om er een te kiezen in de installatiewizard:

    | Regiowaarde     | Basis-URL van PixVerse-API                    |
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

  <Accordion title="Aangepaste basis-URL">
    Stel `models.providers.pixverse.baseUrl` alleen in wanneer je routeert via een vertrouwde compatibele proxy.
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

  <Accordion title="Taakpolling">
    PixVerse retourneert een `video_id` vanuit het generatieverzoek. OpenClaw pollt
    `/openapi/v2/video/result/{video_id}` totdat de taak slaagt, mislukt,
    of een time-out bereikt.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde toolparameters, providerselectie en asynchroon gedrag.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Standaardinstellingen voor agents, inclusief videogeneratiemodel.
  </Card>
</CardGroup>
