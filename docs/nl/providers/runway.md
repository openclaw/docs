---
read_when:
    - Je wilt Runway-videogeneratie gebruiken in OpenClaw
    - Je hebt de Runway API-sleutel-/omgevingsconfiguratie nodig
    - Je wilt Runway instellen als de standaardvideoprovider
summary: Runway-videogeneratie instellen in OpenClaw
title: Startbaan
x-i18n:
    generated_at: "2026-04-29T23:13:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw levert een meegeleverde `runway`-provider voor gehoste videogeneratie.

| Eigenschap | Waarde                                                            |
| ---------- | ----------------------------------------------------------------- |
| Provider-id | `runway`                                                         |
| Authenticatie | `RUNWAYML_API_SECRET` (canoniek) of `RUNWAY_API_KEY`           |
| API        | Runway-taakgebaseerde videogeneratie (`GET /v1/tasks/{id}`-polling) |

## Aan de slag

<Steps>
  <Step title="Stel de API-sleutel in">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Stel Runway in als de standaardvideoprovider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Genereer een video">
    Vraag de agent om een video te genereren. Runway wordt automatisch gebruikt.
  </Step>
</Steps>

## Ondersteunde modi

| Modus          | Model              | Referentie-invoer       |
| -------------- | ------------------ | ----------------------- |
| Tekst-naar-video | `gen4.5` (standaard) | Geen                    |
| Afbeelding-naar-video | `gen4.5`           | 1 lokale of externe afbeelding |
| Video-naar-video | `gen4_aleph`       | 1 lokale of externe video |

<Note>
Lokale afbeeldings- en videoreferenties worden ondersteund via data-URI's. Runs met alleen tekst bieden momenteel de beeldverhoudingen `16:9` en `9:16`.
</Note>

<Warning>
Video-naar-video vereist momenteel specifiek `runway/gen4_aleph`.
</Warning>

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

  <Accordion title="Taakpolling">
    Runway gebruikt een taakgebaseerde API. Nadat een generatieverzoek is ingediend, pollt OpenClaw
    `GET /v1/tasks/{id}` totdat de video klaar is. Er is geen aanvullende
    configuratie nodig voor het pollinggedrag.
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
