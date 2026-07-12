---
read_when:
    - Je wilt lokale ComfyUI-workflows gebruiken met OpenClaw
    - Je wilt Comfy Cloud gebruiken met workflows voor afbeeldingen, video of muziek
    - Je hebt de configuratiesleutels van de meegeleverde comfy-plugin nodig
summary: Installatie van ComfyUI-workflows voor het genereren van afbeeldingen, video's en muziek in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T09:12:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw levert een gebundelde `comfy`-Plugin voor workflowgestuurde ComfyUI-uitvoeringen. De
Plugin is volledig workflowgestuurd: OpenClaw koppelt algemene instellingen zoals `size`,
`aspectRatio`, `resolution`, `durationSeconds` of TTS-achtige bedieningselementen niet aan
je grafiek.

| Eigenschap         | Details                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| Provider           | `comfy`                                                                            |
| Model              | `comfy/workflow`                                                                   |
| Gedeelde tools     | `image_generate`, `video_generate`, `music_generate`                               |
| Authenticatie      | Geen voor lokale ComfyUI; `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` voor Comfy Cloud |
| API                | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                     |

## Wat wordt ondersteund

- Afbeeldingen genereren en bewerken vanuit een workflow-JSON (voor bewerken is 1 geüploade referentieafbeelding nodig)
- Video's genereren vanuit een workflow-JSON, van tekst naar video of van afbeelding naar video (1 referentieafbeelding)
- Muziek/audio genereren via de gedeelde tool `music_generate`, met optioneel 1 referentieafbeelding
- Uitvoer downloaden van een geconfigureerde Node, of van alle overeenkomende uitvoer-Nodes wanneer er geen is geconfigureerd

## Aan de slag

Kies tussen ComfyUI uitvoeren op je eigen machine en Comfy Cloud gebruiken.

<Tabs>
  <Tab title="Lokaal">
    **Het meest geschikt voor:** je eigen ComfyUI-instantie uitvoeren op je machine of LAN.

    <Steps>
      <Step title="ComfyUI lokaal starten">
        Zorg dat je lokale ComfyUI-instantie actief is (standaard op `http://127.0.0.1:8188`).
      </Step>
      <Step title="Je workflow-JSON voorbereiden">
        Exporteer of maak een ComfyUI-workflow-JSON-bestand. Noteer de Node-ID's van de invoer-Node voor de prompt en de uitvoer-Node waarvan OpenClaw moet lezen.
      </Step>
      <Step title="De provider configureren">
        Stel `mode: "local"` in en verwijs naar je workflowbestand. Minimaal voorbeeld voor afbeeldingen:

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
      <Step title="Het standaardmodel instellen">
        Laat OpenClaw voor de geconfigureerde mogelijkheid het model `comfy/workflow` gebruiken:

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
      <Step title="Verifiëren">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Het meest geschikt voor:** workflows uitvoeren op Comfy Cloud zonder lokale GPU-resources te beheren.

    <Steps>
      <Step title="Een API-sleutel verkrijgen">
        Registreer je bij [comfy.org](https://comfy.org) en genereer een API-sleutel via het dashboard van je account.
      </Step>
      <Step title="De API-sleutel instellen">
        Geef je sleutel op via een van deze methoden:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Je workflow-JSON voorbereiden">
        Exporteer of maak een ComfyUI-workflow-JSON-bestand. Noteer de Node-ID's van de invoer-Node voor de prompt en de uitvoer-Node.
      </Step>
      <Step title="De provider configureren">
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
        In de cloudmodus is de standaardwaarde voor `baseUrl` `https://cloud.comfy.org`. Stel `baseUrl` alleen in voor een aangepast cloudeindpunt.
        </Tip>
      </Step>
      <Step title="Het standaardmodel instellen">
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
      <Step title="Verifiëren">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuratie

Comfy ondersteunt gedeelde verbindingsinstellingen op het hoogste niveau en workflowsecties per mogelijkheid (`image`, `video`, `music`):

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

| Sleutel                | Type                    | Beschrijving                                                                            |
| ---------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| `mode`                 | `"local"` of `"cloud"`  | Verbindingsmodus. Standaardwaarde is `"local"`.                                         |
| `baseUrl`              | tekenreeks              | Standaard `http://127.0.0.1:8188` voor lokaal of `https://cloud.comfy.org` voor de cloud. |
| `apiKey`               | tekenreeks              | Optionele inline sleutel, als alternatief voor de omgevingsvariabelen `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork`  | booleaanse waarde       | Sta in de cloudmodus een privé-/LAN-`baseUrl` of een lokale privé-DNS-FQDN toe.         |

<Note>
In de modus `local` werken letterlijke loopback-/privé-IP-adressen en servicenames met één label, zoals `http://comfyui:8188`, zonder `allowPrivateNetwork`. Op openbare adressen lijkende privé-DNS-FQDN's, zoals `https://comfy.local.example.com`, vereisen `allowPrivateNetwork: true`. Vertrouwen voor een privé-oorsprong blijft beperkt tot het geconfigureerde schema, de hostnaam en de poort; lokale omleidingen mogen de geconfigureerde hostnaam niet verlaten, terwijl omleidingen vanuit de cloud naar openbare CDN's met het standaard-SSRF-beleid worden gecontroleerd.
</Note>

### Sleutels per mogelijkheid

Deze sleutels zijn van toepassing binnen de secties `image`, `video` of `music`:

| Sleutel                      | Vereist | Standaard | Beschrijving                                                               |
| ---------------------------- | ------- | --------- | -------------------------------------------------------------------------- |
| `workflow` of `workflowPath` | Ja      | --        | Inline workflow-JSON of pad naar het ComfyUI-workflow-JSON-bestand.        |
| `promptNodeId`               | Ja      | --        | Node-ID die de tekstprompt ontvangt.                                       |
| `promptInputName`            | Nee     | `"text"`  | Naam van de invoer op de prompt-Node.                                      |
| `outputNodeId`               | Nee     | --        | Node-ID waarvan de uitvoer wordt gelezen. Indien weggelaten, worden alle overeenkomende uitvoer-Nodes gebruikt. |
| `pollIntervalMs`             | Nee     | `1500`    | Pollinginterval in milliseconden voor het voltooien van de taak.           |
| `timeoutMs`                  | Nee     | `300000`  | Time-out in milliseconden voor de workflowuitvoering.                      |

De secties `image` en `video` ondersteunen ook een invoer-Node voor een referentieafbeelding:

| Sleutel                | Vereist                                      | Standaard | Beschrijving                                              |
| ---------------------- | -------------------------------------------- | --------- | --------------------------------------------------------- |
| `inputImageNodeId`     | Ja (bij het meegeven van een referentieafbeelding) | --  | Node-ID die de geüploade referentieafbeelding ontvangt.   |
| `inputImageInputName`  | Nee                                          | `"image"` | Naam van de invoer op de afbeeldings-Node.                |

`apiKey` accepteert een letterlijke tekenreeks of een [geheimreferentie](/nl/gateway/configuration-reference#secrets)-object.

## Workflowdetails

<AccordionGroup>
  <Accordion title="Afbeeldingsworkflows">
    Stel het standaardmodel voor afbeeldingen in op `comfy/workflow`:

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

    **Voorbeeld voor bewerken met een referentieafbeelding:**

    Voeg `inputImageNodeId` toe aan je afbeeldingsconfiguratie om bewerken met een geüploade referentieafbeelding in te schakelen:

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
    Stel het standaardmodel voor video in op `comfy/workflow`:

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
    OpenClaw geeft geen invoervideo's door aan Comfy-workflows. Alleen tekstprompts en afzonderlijke referentieafbeeldingen worden als invoer ondersteund.
    </Note>

  </Accordion>

  <Accordion title="Muziekworkflows">
    De gebundelde Plugin registreert een provider voor muziekgeneratie voor door workflows gedefinieerde audio- of muziekuitvoer, die beschikbaar wordt gesteld via de gedeelde tool `music_generate`. Deze accepteert een optionele referentieafbeelding (maximaal 1):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Gebruik de configuratiesectie `music` om naar je audio-workflow-JSON en uitvoer-Node te verwijzen.

  </Accordion>

  <Accordion title="Achterwaartse compatibiliteit">
    Bestaande afbeeldingsconfiguratie op het hoogste niveau (zonder de geneste sectie `image`) blijft werken:

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

    OpenClaw behandelt die verouderde structuur als de configuratie voor de afbeeldingsworkflow. Je hoeft niet onmiddellijk te migreren, maar de geneste secties `image` / `video` / `music` worden aanbevolen voor nieuwe configuraties. Als je alleen afbeeldingsgeneratie gebruikt, zijn de verouderde platte configuratie en de nieuwe geneste sectie `image` functioneel gelijkwaardig.

  </Accordion>

  <Accordion title="Live-tests">
    Er is optionele live-testdekking beschikbaar voor de gebundelde Plugin:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    De live-test slaat afzonderlijke gevallen voor afbeeldingen, video’s of muziek over, tenzij de bijbehorende Comfy-workflowsectie is geconfigureerd.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Configuratie en gebruik van het hulpmiddel voor het genereren van afbeeldingen.
  </Card>
  <Card title="Video’s genereren" href="/nl/tools/video-generation" icon="video">
    Configuratie en gebruik van het hulpmiddel voor het genereren van video’s.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Instellen van het hulpmiddel voor het genereren van muziek en audio.
  </Card>
  <Card title="Provideroverzicht" href="/nl/providers/index" icon="layers">
    Overzicht van alle providers en modelreferenties.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Volledige configuratiereferentie, inclusief standaardinstellingen voor agents.
  </Card>
</CardGroup>
