---
read_when:
    - Je wilt fal-beeldgeneratie gebruiken in OpenClaw
    - Je hebt de FAL_KEY-authenticatiestroom nodig
    - Je wilt fal-standaardinstellingen voor image_generate of video_generate
summary: Configuratie voor afbeeldings- en videogeneratie met fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-29T23:09:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
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
  <Step title="Stel een standaard beeldmodel in">
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

| Mogelijkheid       | Waarde                         |
| ------------------ | ------------------------------ |
| Max. afbeeldingen  | 4 per aanvraag                 |
| Bewerkingsmodus    | Ingeschakeld, 1 referentiebeeld |
| Grootte-overschrijvingen | Ondersteund              |
| Beeldverhouding    | Ondersteund                    |
| Resolutie          | Ondersteund                    |
| Uitvoerformaat     | `png` of `jpeg`                |

<Warning>
Het fal-eindpunt voor beeldbewerking ondersteunt **geen** `aspectRatio`-overschrijvingen.
</Warning>

Gebruik `outputFormat: "png"` wanneer je PNG-uitvoer wilt. fal declareert geen
expliciete regeling voor transparante achtergronden in OpenClaw, dus `background:
"transparent"` wordt gerapporteerd als een genegeerde overschrijving voor fal-modellen.

Om fal als standaard beeldprovider te gebruiken:

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

| Mogelijkheid | Waarde                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Modi         | Tekst-naar-video, referentie met één afbeelding, Seedance referentie-naar-video |
| Runtime      | Wachtrijgestuurde indien/status/resultaat-stroom voor langlopende taken |

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

  <Accordion title="Seedance 2.0 configuratievoorbeeld">
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

  <Accordion title="Seedance 2.0 referentie-naar-video configuratievoorbeeld">
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

    Referentie-naar-video accepteert maximaal 9 afbeeldingen, 3 video's en 3 audioverwijzingen
    via de gedeelde `video_generate`-parameters `images`, `videos` en `audioRefs`,
    met maximaal 12 referentiebestanden in totaal.

  </Accordion>

  <Accordion title="HeyGen video-agent configuratievoorbeeld">
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
Gebruik `openclaw models list --provider fal` om de volledige lijst met beschikbare fal-modellen
te bekijken, inclusief recent toegevoegde items.
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
