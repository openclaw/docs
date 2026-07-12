---
read_when:
    - Je wilt Runway-videogeneratie gebruiken in OpenClaw
    - Je moet de Runway API-sleutel/omgevingsvariabele instellen
    - Je wilt Runway instellen als de standaardvideoprovider
summary: Runway-videogeneratie instellen in OpenClaw
title: Startbaan
x-i18n:
    generated_at: "2026-07-12T09:20:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw wordt geleverd met een gebundelde `runway`-provider voor gehoste videogeneratie, die standaard is ingeschakeld en is geregistreerd voor het contract `videoGenerationProviders`.

| Eigenschap              | Waarde                                                                  |
| ----------------------- | ----------------------------------------------------------------------- |
| Provider-id             | `runway`                                                                |
| Plugin                  | gebundeld, `enabledByDefault: true`                                      |
| Omgevingsvariabelen voor authenticatie | `RUNWAYML_API_SECRET` (canoniek) of `RUNWAY_API_KEY`       |
| Onboarding-vlag         | `--auth-choice runway-api-key`                                          |
| Rechtstreekse CLI-vlag  | `--runway-api-key <key>`                                                 |
| API                     | Taakgebaseerde videogeneratie van Runway (polling via `GET /v1/tasks/{id}`) |
| Standaardmodel          | `runway/gen4.5`                                                         |

## Aan de slag

<Steps>
  <Step title="Stel de API-sleutel in">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Stel Runway in als de standaardprovider voor video">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Genereer een video">
    Vraag de agent om een video te genereren. Runway wordt automatisch gebruikt.
  </Step>
</Steps>

## Ondersteunde modi en modellen

De provider biedt zeven Runway-modellen, verdeeld over drie modi. Dezelfde model-id kan voor meerdere modi dienen (zo werkt `gen4.5` bijvoorbeeld voor zowel tekst-naar-video als afbeelding-naar-video).

| Modus                  | Modellen                                                               | Referentie-invoer                  |
| ---------------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| Tekst-naar-video       | `gen4.5` (standaard), `veo3.1`, `veo3.1_fast`, `veo3`                  | Geen                               |
| Afbeelding-naar-video  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 lokale of externe afbeelding     |
| Video-naar-video       | `gen4_aleph`                                                           | 1 lokale of externe video          |

Lokale verwijzingen naar afbeeldingen en video's worden ondersteund via data-URI's.

| Beeldverhoudingen                | Toegestane waarden                           |
| -------------------------------- | -------------------------------------------- |
| Tekst-naar-video                 | `16:9`, `9:16`                               |
| Bewerkingen van afbeeldingen en video's | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Voor video-naar-video is momenteel `runway/gen4_aleph` vereist. Andere Runway-model-id's weigeren videoverwijzingen als invoer.
</Warning>

<Note>
  Als u een Runway-model-id uit de verkeerde kolom kiest, treedt er een expliciete fout op voordat het API-verzoek OpenClaw verlaat. De provider valideert `model` aan de hand van de toegestane lijst van de modus (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) in `extensions/runway/video-generation-provider.ts`.
</Note>

## Configuratie

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Aliassen voor omgevingsvariabelen">
    OpenClaw herkent zowel `RUNWAYML_API_SECRET` (canoniek) als `RUNWAY_API_KEY`.
    Met beide variabelen kan de Runway-provider worden geauthenticeerd.
  </Accordion>

  <Accordion title="Taakpolling">
    Runway gebruikt een taakgebaseerde API. Nadat een generatieverzoek is ingediend, pollt OpenClaw
    `GET /v1/tasks/{id}` totdat de video gereed is. Voor dit
    pollinggedrag is geen aanvullende configuratie nodig.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde toolparameters, providerselectie en asynchroon gedrag.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Standaardinstellingen voor agents, waaronder het model voor videogeneratie.
  </Card>
</CardGroup>
