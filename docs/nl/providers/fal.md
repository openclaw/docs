---
read_when:
    - Je wilt fal-afbeeldingsgeneratie gebruiken in OpenClaw
    - Je hebt de FAL_KEY-authenticatieflow nodig
    - Je wilt fal-standaardinstellingen voor image_generate, video_generate of music_generate
summary: fal-configuratie voor het genereren van afbeeldingen, video en muziek in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:11:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw levert een gebundelde `fal`-provider voor gehoste afbeelding-, video- en muziekgeneratie.

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
  <Step title="Stel een standaard afbeeldingsmodel in">
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

## Afbeeldingsgeneratie

De gebundelde `fal`-provider voor afbeeldingsgeneratie gebruikt standaard
`fal/fal-ai/flux/dev`.

| Mogelijkheid       | Waarde                                                             |
| ------------------ | ------------------------------------------------------------------ |
| Max. afbeeldingen  | 4 per aanvraag; Krea 2: 1 per aanvraag                             |
| Bewerkmodus        | Flux: 1 referentieafbeelding; GPT Image 2: 10; Nano Banana 2: 14   |
| Stijlreferenties   | Krea 2: tot 10 stijlreferenties via `image` / `images`             |
| Grootte-overschrijvingen | Ondersteund                                                   |
| Beeldverhouding    | Ondersteund voor genereren, Krea 2 en bewerken met GPT Image 2/Nano Banana 2 |
| Resolutie          | Ondersteund                                                        |
| Uitvoerformaat     | `png` of `jpeg`                                                    |

<Warning>
Flux-aanvragen voor afbeelding-naar-afbeelding ondersteunen **geen** `aspectRatio`-overschrijvingen. GPT
Image 2- en Nano Banana 2-bewerkverzoeken gebruiken het `/edit`-eindpunt van fal en accepteren
hints voor beeldverhouding. Nano Banana 2 accepteert ook extra-native brede/hoge verhoudingen
zoals `4:1`, `1:4`, `8:1` en `1:8`; Krea 2 valideert zijn eigen kleinere
subset van beeldverhoudingen.
</Warning>

Krea 2-modellen gebruiken het native Krea-payloadschema van fal. OpenClaw verstuurt
`aspect_ratio`, `creativity` en `image_style_references` in plaats van de
generieke `image_size` / edit-endpoint-payload die Flux gebruikt. De modelreferenties zijn:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Gebruik Medium voor snellere expressieve illustratie, anime, schilderkunst en artistieke
stijlen. Gebruik Large voor tragere fotorealistische beelden, ruwe textuur, filmkorrel en gedetailleerde
looks. Krea gebruikt standaard `fal.creativity: "medium"`; ondersteunde waarden zijn
`raw`, `low`, `medium` en `high`.

Krea 2 biedt beeldverhouding, niet `image_size`, in het aanvraagschema van fal. Geef de voorkeur aan
`aspectRatio`; OpenClaw koppelt `size` aan de dichtstbijzijnde ondersteunde Krea-beeldverhouding
en weigert `resolution` voor Krea in plaats van die te negeren.

Gebruik `outputFormat: "png"` wanneer je PNG-uitvoer wilt van fal-modellen die
`output_format` aanbieden. fal declareert geen expliciete instelling voor transparante achtergrond
in OpenClaw, dus `background: "transparent"` wordt gerapporteerd als een genegeerde
overschrijving voor fal-modellen.
Krea 2-eindpunten bieden geen aanvraagveld `output_format` via fal, dus
OpenClaw weigert `outputFormat`-overschrijvingen voor Krea-aanvragen.

Om fal als standaard afbeeldingsprovider te gebruiken:

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

Om Krea 2 Medium te gebruiken:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## Videogeneratie

De gebundelde `fal`-provider voor videogeneratie gebruikt standaard
`fal/fal-ai/minimax/video-01-live`.

| Mogelijkheid | Waarde                                                            |
| ------------ | ----------------------------------------------------------------- |
| Modi         | Tekst-naar-video, referentie met één afbeelding, Seedance referentie-naar-video |
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

  <Accordion title="Seedance 2.0-configuratievoorbeeld">
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

  <Accordion title="Seedance 2.0-configuratievoorbeeld voor referentie-naar-video">
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

    Referentie-naar-video accepteert tot 9 afbeeldingen, 3 video's en 3 audioreferenties
    via de gedeelde `video_generate`-parameters `images`, `videos` en `audioRefs`,
    met maximaal 12 referentiebestanden in totaal.

  </Accordion>

  <Accordion title="HeyGen video-agent-configuratievoorbeeld">
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

## Muziekgeneratie

De gebundelde `fal`-Plugin registreert ook een provider voor muziekgeneratie voor de
gedeelde tool `music_generate`.

| Mogelijkheid    | Waarde                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Standaardmodel  | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| Modellen        | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Runtime         | Synchrone aanvraag plus download van gegenereerde audio                                                |

Gebruik fal als standaard muziekprovider:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` ondersteunt expliciete songteksten en instrumentale modus.
ACE-Step en Stable Audio zijn prompt-naar-audio-eindpunten; kies ze met de
`model`-overschrijving wanneer je die modelfamilies wilt.

<Tip>
Gebruik `openclaw models list --provider fal` om de volledige lijst met beschikbare fal-
modellen te bekijken, inclusief recent toegevoegde vermeldingen.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Afbeeldingsgeneratie" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor de afbeeldingstool en providerselectie.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor de videotool en providerselectie.
  </Card>
  <Card title="Muziekgeneratie" href="/nl/tools/music-generation" icon="music">
    Gedeelde parameters voor de muziektool en providerselectie.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaarden, inclusief selectie van afbeeldings-, video- en muziekmodellen.
  </Card>
</CardGroup>
