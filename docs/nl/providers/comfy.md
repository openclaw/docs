---
read_when:
    - Je wilt lokale ComfyUI-werkstromen gebruiken met OpenClaw
    - Je wilt Comfy Cloud gebruiken met workflows voor afbeeldingen, video of muziek
    - Je hebt de meegeleverde configuratiesleutels van de comfy Plugin nodig
summary: Configuratie voor afbeeldings-, video- en muziekgeneratie met ComfyUI-werkstromen in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-29T23:09:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw levert een gebundelde `comfy` plugin voor workflow-gestuurde ComfyUI-runs. De plugin is volledig workflow-gestuurd, dus OpenClaw probeert geen generieke `size`-, `aspectRatio`-, `resolution`-, `durationSeconds`- of TTS-achtige bedieningselementen op je grafiek te mappen.

| Eigenschap      | Detail                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| Provider        | `comfy`                                                                          |
| Modellen        | `comfy/workflow`                                                                 |
| Gedeelde oppervlakken | `image_generate`, `video_generate`, `music_generate`                       |
| Auth            | Geen voor lokale ComfyUI; `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` voor Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` en Comfy Cloud `/api/*`                 |

## Wat het ondersteunt

- Afbeeldingen genereren vanuit een workflow-JSON
- Afbeeldingen bewerken met 1 geüploade referentieafbeelding
- Video's genereren vanuit een workflow-JSON
- Video's genereren met 1 geüploade referentieafbeelding
- Muziek- of audiogeneratie via de gedeelde tool `music_generate`
- Uitvoer downloaden vanaf een geconfigureerd knooppunt of alle overeenkomende uitvoerknooppunten

## Aan de slag

Kies tussen ComfyUI draaien op je eigen machine of Comfy Cloud gebruiken.

<Tabs>
  <Tab title="Lokaal">
    **Beste voor:** je eigen ComfyUI-instantie draaien op je machine of LAN.

    <Steps>
      <Step title="Start ComfyUI lokaal">
        Zorg dat je lokale ComfyUI-instantie draait (standaard `http://127.0.0.1:8188`).
      </Step>
      <Step title="Bereid je workflow-JSON voor">
        Exporteer of maak een ComfyUI-workflow-JSON-bestand. Noteer de knooppunt-ID's voor het promptinvoerknooppunt en het uitvoerknooppunt waaruit je OpenClaw wilt laten lezen.
      </Step>
      <Step title="Configureer de provider">
        Stel `mode: "local"` in en verwijs naar je workflowbestand. Hier is een minimaal afbeeldingsvoorbeeld:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Stel het standaardmodel in">
        Verwijs OpenClaw naar het model `comfy/workflow` voor de capability die je hebt geconfigureerd:

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
      </Step>
      <Step title="Verifieer">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Beste voor:** workflows draaien op Comfy Cloud zonder lokale GPU-bronnen te beheren.

    <Steps>
      <Step title="Haal een API-sleutel op">
        Meld je aan op [comfy.org](https://comfy.org) en genereer een API-sleutel vanuit je accountdashboard.
      </Step>
      <Step title="Stel de API-sleutel in">
        Geef je sleutel op via een van deze methoden:

        ```bash
        # Environment variable (preferred)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Bereid je workflow-JSON voor">
        Exporteer of maak een ComfyUI-workflow-JSON-bestand. Noteer de knooppunt-ID's voor het promptinvoerknooppunt en het uitvoerknooppunt.
      </Step>
      <Step title="Configureer de provider">
        Stel `mode: "cloud"` in en verwijs naar je workflowbestand:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        Cloudmodus stelt `baseUrl` standaard in op `https://cloud.comfy.org`. Je hoeft `baseUrl` alleen in te stellen als je een aangepast cloudeindpunt gebruikt.
        </Tip>
      </Step>
      <Step title="Stel het standaardmodel in">
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
      </Step>
      <Step title="Verifieer">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuratie

Comfy ondersteunt gedeelde verbindingsinstellingen op topniveau plus workflowsecties per capability (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
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
  },
}
```

### Gedeelde sleutels

| Sleutel               | Type                   | Beschrijving                                                                         |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` of `"cloud"` | Verbindingsmodus.                                                                     |
| `baseUrl`             | string                 | Standaard `http://127.0.0.1:8188` voor lokaal of `https://cloud.comfy.org` voor cloud. |
| `apiKey`              | string                 | Optionele inline sleutel, alternatief voor de env-vars `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Sta een privé-/LAN-`baseUrl` toe in cloudmodus.                                       |

### Sleutels per capability

Deze sleutels zijn van toepassing binnen de secties `image`, `video` of `music`:

| Sleutel                      | Vereist | Standaard | Beschrijving                                                                 |
| ---------------------------- | ------- | --------- | ----------------------------------------------------------------------------- |
| `workflow` of `workflowPath` | Ja      | --        | Pad naar het ComfyUI-workflow-JSON-bestand.                                  |
| `promptNodeId`               | Ja      | --        | Knooppunt-ID dat de tekstprompt ontvangt.                                    |
| `promptInputName`            | Nee     | `"text"`  | Invoernaam op het promptknooppunt.                                           |
| `outputNodeId`               | Nee     | --        | Knooppunt-ID om uitvoer uit te lezen. Indien weggelaten, worden alle overeenkomende uitvoerknooppunten gebruikt. |
| `pollIntervalMs`             | Nee     | --        | Pollinginterval in milliseconden voor voltooiing van de taak.                |
| `timeoutMs`                  | Nee     | --        | Timeout in milliseconden voor de workflow-run.                               |

De secties `image` en `video` ondersteunen ook:

| Sleutel                | Vereist                                  | Standaard | Beschrijving                                                   |
| --------------------- | ---------------------------------------- | --------- | --------------------------------------------------------------- |
| `inputImageNodeId`    | Ja (bij het doorgeven van een referentieafbeelding) | --        | Knooppunt-ID dat de geüploade referentieafbeelding ontvangt. |
| `inputImageInputName` | Nee                                      | `"image"` | Invoernaam op het afbeeldingsknooppunt.                         |

## Workflowdetails

<AccordionGroup>
  <Accordion title="Afbeeldingsworkflows">
    Stel het standaardafbeeldingsmodel in op `comfy/workflow`:

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

    **Voorbeeld voor bewerken met referentieafbeelding:**

    Voeg `inputImageNodeId` toe aan je afbeeldingsconfiguratie om afbeeldingsbewerking met een geüploade referentieafbeelding in te schakelen:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
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
      },
    }
    ```

  </Accordion>

  <Accordion title="Videoworkflows">
    Stel het standaardvideomodel in op `comfy/workflow`:

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

    Comfy-videoworkflows ondersteunen tekst-naar-video en afbeelding-naar-video via de geconfigureerde grafiek.

    <Note>
    OpenClaw geeft geen invoervideo's door aan Comfy-workflows. Alleen tekstprompts en afzonderlijke referentieafbeeldingen worden ondersteund als invoer.
    </Note>

  </Accordion>

  <Accordion title="Muziekworkflows">
    De gebundelde plugin registreert een provider voor muziekgeneratie voor door workflows gedefinieerde audio- of muziekuitvoer, beschikbaar via de gedeelde tool `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Gebruik de configuratiesectie `music` om naar je audio-workflow-JSON en uitvoerknooppunt te verwijzen.

  </Accordion>

  <Accordion title="Achterwaartse compatibiliteit">
    Bestaande afbeeldingsconfiguratie op topniveau (zonder de geneste sectie `image`) werkt nog steeds:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw behandelt die verouderde vorm als de afbeeldingsworkflowconfiguratie. Je hoeft niet onmiddellijk te migreren, maar de geneste secties `image` / `video` / `music` worden aanbevolen voor nieuwe setups.

    <Tip>
    Als je alleen afbeeldingsgeneratie gebruikt, zijn de verouderde platte configuratie en de nieuwe geneste sectie `image` functioneel gelijkwaardig.
    </Tip>

  </Accordion>

  <Accordion title="Live tests">
    Opt-in live dekking bestaat voor de gebundelde plugin:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    De live test slaat afzonderlijke afbeeldings-, video- of muziekgevallen over tenzij de overeenkomende Comfy-workflowsectie is geconfigureerd.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Configuratie en gebruik van de tool voor het genereren van afbeeldingen.
  </Card>
  <Card title="Video's genereren" href="/nl/tools/video-generation" icon="video">
    Configuratie en gebruik van de tool voor het genereren van video's.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Instelling van de tool voor het genereren van muziek en audio.
  </Card>
  <Card title="Provideroverzicht" href="/nl/providers/index" icon="layers">
    Overzicht van alle providers en modelreferenties.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Volledige configuratiereferentie inclusief standaardwaarden voor agents.
  </Card>
</CardGroup>
