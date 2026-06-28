---
read_when:
    - Je wilt Runway-videogeneratie gebruiken in OpenClaw
    - Je hebt de Runway API-sleutel/env-configuratie nodig
    - Je wilt Runway instellen als de standaardvideoprovider
summary: Runway-videogeneratie instellen in OpenClaw
title: Startbaan
x-i18n:
    generated_at: "2026-05-06T09:30:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw levert een gebundelde `runway`-provider voor gehoste videogeneratie. De Plugin is standaard ingeschakeld en registreert de `runway`-provider voor het `videoGenerationProviders`-contract.

| Eigenschap       | Waarde                                                            |
| ---------------- | ----------------------------------------------------------------- |
| Provider-ID      | `runway`                                                          |
| Plugin           | gebundeld, `enabledByDefault: true`                               |
| Auth-env-vars    | `RUNWAYML_API_SECRET` (canoniek) of `RUNWAY_API_KEY`              |
| Onboarding-vlag  | `--auth-choice runway-api-key`                                    |
| Directe CLI-vlag | `--runway-api-key <key>`                                          |
| API              | Taakgebaseerde videogeneratie van Runway (`GET /v1/tasks/{id}` polling) |
| Standaardmodel   | `runway/gen4.5`                                                   |

## Aan de slag

<Steps>
  <Step title="Stel de API-sleutel in">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Stel Runway in als de standaard videoprovider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Genereer een video">
    Vraag de agent om een video te genereren. Runway wordt automatisch gebruikt.
  </Step>
</Steps>

## Ondersteunde modi en modellen

De provider biedt zeven Runway-modellen verdeeld over drie modi. Dezelfde model-ID kan meer dan één modus bedienen (bijvoorbeeld `gen4.5` werkt voor zowel tekst-naar-video als afbeelding-naar-video).

| Modus                  | Modellen                                                               | Referentie-invoer             |
| ---------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| Tekst-naar-video       | `gen4.5` (standaard), `veo3.1`, `veo3.1_fast`, `veo3`                  | Geen                          |
| Afbeelding-naar-video  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 lokale of externe afbeelding |
| Video-naar-video       | `gen4_aleph`                                                           | 1 lokale of externe video     |

Lokale afbeeldings- en videoreferenties worden ondersteund via data-URI's.

| Beeldverhoudingen      | Toegestane waarden                          |
| ---------------------- | ------------------------------------------- |
| Tekst-naar-video       | `16:9`, `9:16`                              |
| Afbeeldings- en videobewerkingen | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Video-naar-video vereist momenteel `runway/gen4_aleph`. Andere Runway-model-ID's weigeren invoer met videoreferenties.
</Warning>

<Note>
  Het kiezen van een Runway-model-ID uit de verkeerde kolom levert een expliciete fout op voordat de API-aanvraag OpenClaw verlaat. De provider valideert `model` tegen de allowlist van de modus (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) in `extensions/runway/video-generation-provider.ts`.
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
    Beide variabelen authenticeren de Runway-provider.
  </Accordion>

  <Accordion title="Task polling">
    Runway gebruikt een taakgebaseerde API. Na het indienen van een generatieaanvraag pollt OpenClaw
    `GET /v1/tasks/{id}` totdat de video klaar is. Er is geen aanvullende
    configuratie nodig voor het polling-gedrag.
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
