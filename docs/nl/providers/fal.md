---
read_when:
    - Je wilt fal-afbeeldingsgeneratie gebruiken in OpenClaw
    - Je hebt de FAL_KEY-authenticatiestroom nodig
    - Je wilt fal-standaardwaarden voor image_generate of video_generate
summary: fal-configuratie voor afbeeldings- en videogeneratie in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw levert een gebundelde `fal`-provider voor gehoste beeld- en videogeneratie.

| Eigenschap | Waarde                                                        |
| ---------- | ------------------------------------------------------------- |
| Provider   | `fal`                                                         |
| Auth       | `FAL_KEY` (canoniek; `FAL_API_KEY` werkt ook als fallback)    |
| API        | fal-modeleindpunten                                           |

## Aan de slag

<Steps>
  <Step title="Stel de API-sleutel in">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Stel een standaardbeeldmodel in">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Beeldgeneratie

De gebundelde `fal`-provider voor beeldgeneratie gebruikt standaard
`fal/fal-ai/flux/dev`.

| Mogelijkheid        | Waarde                                                        |
| ------------------- | ------------------------------------------------------------- |
| Max. afbeeldingen   | 4 per aanvraag                                                |
| Bewerkingsmodus     | Flux: 1 referentieafbeelding; GPT Image 2: 10; Nano Banana 2: 14 |
| Grootte-overschrijvingen | Ondersteund                                             |
| Beeldverhouding     | Ondersteund voor genereren en GPT Image 2-/Nano Banana 2-bewerking |
| Resolutie           | Ondersteund                                                   |
| Uitvoerformaat      | `png` of `jpeg`                                               |

<Warning>
Flux-aanvragen voor image-to-image ondersteunen **geen** `aspectRatio`-overschrijvingen. GPT
Image 2- en Nano Banana 2-bewerkingsaanvragen gebruiken het `/edit`-eindpunt van fal en accepteren
hints voor beeldverhoudingen.
</Warning>

Gebruik `outputFormat: "png"` wanneer je PNG-uitvoer wilt. fal declareert geen
expliciete regeling voor transparante achtergronden in OpenClaw, dus `background:
"transparent"` wordt gerapporteerd als een genegeerde overschrijving voor fal-modellen.

Om fal als standaardbeeldprovider te gebruiken:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Videogeneratie

De gebundelde `fal`-provider voor videogeneratie gebruikt standaard
`fal/fal-ai/minimax/video-01-live`.

| Mogelijkheid | Waarde                                                             |
| ------------ | ------------------------------------------------------------------ |
| Modi         | Tekst-naar-video, enkele-afbeeldingsreferentie, Seedance-referentie-naar-video |
| Runtime      | Wachtrijgebaseerde submit/status/result-flow voor langlopende taken |

<AccordionGroup>
  <Accordion title="Beschikbare videomodellen">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Configuratievoorbeeld voor Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configuratievoorbeeld voor Seedance 2.0 reference-to-video">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Reference-to-video accepteert maximaal 9 afbeeldingen, 3 video's en 3 audioreferenties
    via de gedeelde `video_generate`-parameters `images`, `videos` en `audioRefs`,
    met maximaal 12 referentiebestanden in totaal.

  </Accordion>

  <Accordion title="Configuratievoorbeeld voor HeyGen video-agent">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
Gebruik `openclaw models list --provider fal` om de volledige lijst met beschikbare fal-modellen te bekijken,
inclusief recent toegevoegde vermeldingen.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Beeldgeneratie" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor beeldtools en providerselectie.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaarden, inclusief selectie van beeld- en videomodellen.
  </Card>
</CardGroup>
