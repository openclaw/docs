---
read_when:
    - Je wilt Z.AI- / GLM-modellen in OpenClaw
    - Je hebt een eenvoudige ZAI_API_KEY-configuratie nodig
summary: Gebruik Z.AI (GLM-modellen) met OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:16:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI is het API-platform voor **GLM**-modellen. Het biedt REST-API's voor GLM en
gebruikt API-sleutels voor authenticatie. Maak je API-sleutel aan in de Z.AI-console.
OpenClaw gebruikt de `zai`-provider met een Z.AI API-sleutel.

| Eigenschap | Waarde                                       |
| ---------- | -------------------------------------------- |
| Provider   | `zai`                                        |
| Pakket     | `@openclaw/zai-provider`                     |
| Auth       | `ZAI_API_KEY` (verouderde alias: `Z_AI_API_KEY`) |
| API        | Z.AI Chat Completions (Bearer-auth)          |

## GLM-modellen

GLM is een modelfamilie, geen afzonderlijke provider. In OpenClaw gebruiken GLM-modellen
refs zoals `zai/glm-5.2`: provider `zai`, model-id `glm-5.2`.

## Aan de slag

Installeer eerst de provider-Plugin:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Endpoint automatisch detecteren">
    **Beste voor:** de meeste gebruikers. OpenClaw test ondersteunde Z.AI-endpoints met je API-sleutel en past automatisch de juiste basis-URL toe.

    <Steps>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Controleren of het model wordt vermeld">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Expliciet regionaal endpoint">
    **Beste voor:** gebruikers die een specifiek Coding Plan of algemeen API-oppervlak willen afdwingen.

    <Steps>
      <Step title="Kies de juiste onboarding-optie">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Controleren of het model wordt vermeld">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuratievoorbeeld

<Tip>
Met `zai-api-key` kan OpenClaw het bijbehorende Z.AI-endpoint uit de sleutel detecteren en
automatisch de juiste basis-URL toepassen. Gebruik de expliciete regionale keuzes wanneer
je een specifiek Coding Plan of algemeen API-oppervlak wilt afdwingen.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Ingebouwde catalogus

De `zai` provider-Plugin levert zijn catalogus mee in het Plugin-manifest, zodat alleen-lezen
weergave bekende GLM-rijen kan tonen zonder de provider-runtime te laden:

```bash
openclaw models list --all --provider zai
```

De door het manifest ondersteunde catalogus bevat momenteel:

| Modelref             | Opmerkingen                    |
| -------------------- | ------------------------------ |
| `zai/glm-5.2`        | Coding Plan-standaard; 1M-context |
| `zai/glm-5.1`        | Standaard voor algemene API    |
| `zai/glm-5`          |                                |
| `zai/glm-5-turbo`    |                                |
| `zai/glm-5v-turbo`   |                                |
| `zai/glm-4.7`        |                                |
| `zai/glm-4.7-flash`  |                                |
| `zai/glm-4.7-flashx` |                                |
| `zai/glm-4.6`        |                                |
| `zai/glm-4.6v`       |                                |
| `zai/glm-4.5`        |                                |
| `zai/glm-4.5-air`    |                                |
| `zai/glm-4.5-flash`  |                                |
| `zai/glm-4.5v`       |                                |

<Tip>
GLM-modellen zijn beschikbaar als `zai/<model>` (voorbeeld: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 ondersteunt de denkniveaus `off`, `low`, `high` en `max`. OpenClaw koppelt
`low` en `high` aan hoge redeneerinspanning in Z.AI, en `max` aan maximale inspanning.
</Tip>

<Note>
De installatie van Coding Plan gebruikt standaard `zai/glm-5.2`; de installatie van de algemene API behoudt
`zai/glm-5.1`. Automatische endpointdetectie valt terug op `glm-5.1` of `glm-4.7`
wanneer het geselecteerde plan GLM-5.2 niet aanbiedt. GLM-versies en beschikbaarheid
kunnen veranderen; voer `openclaw models list --all --provider zai` uit om de catalogus te zien
die bekend is bij je geïnstalleerde versie.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Onbekende GLM-5-modellen vooruit oplossen">
    Onbekende `glm-5*`-id's worden nog steeds vooruit opgelost op het providerpad door
    provider-eigen metadata te synthetiseren uit de `glm-4.7`-template wanneer de id
    overeenkomt met de huidige vorm van de GLM-5-familie.
  </Accordion>

  <Accordion title="Tool-call-streaming">
    `tool_stream` is standaard ingeschakeld voor Z.AI tool-call-streaming. Om dit uit te schakelen:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Denken en bewaard denken">
    Denken in Z.AI volgt de `/think`-besturing van OpenClaw. Wanneer denken uit staat,
    stuurt OpenClaw `thinking: { type: "disabled" }` om reacties te vermijden die
    het uitvoerbudget besteden aan `reasoning_content` vóór zichtbare tekst.

    Bewaard denken is opt-in omdat Z.AI vereist dat de volledige historische
    `reasoning_content` opnieuw wordt afgespeeld, wat prompttokens verhoogt. Schakel dit
    per model in:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Wanneer dit is ingeschakeld en denken aan staat, stuurt OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` en speelt eerdere
    `reasoning_content` opnieuw af voor hetzelfde OpenAI-compatibele transcript.

    Geavanceerde gebruikers kunnen de exacte provider-payload nog steeds overschrijven met
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Begrip van afbeeldingen">
    De Z.AI-Plugin registreert begrip van afbeeldingen.

    | Eigenschap | Waarde      |
    | ---------- | ----------- |
    | Model      | `glm-4.6v`  |

    Begrip van afbeeldingen wordt automatisch opgelost vanuit de geconfigureerde Z.AI-authenticatie: er is geen
    aanvullende configuratie nodig.

  </Accordion>

  <Accordion title="Auth-details">
    - Z.AI gebruikt Bearer-auth met je API-sleutel.
    - De onboarding-keuze `zai-api-key` detecteert automatisch het bijbehorende Z.AI-endpoint door ondersteunde endpoints met je sleutel te testen.
    - Gebruik de expliciete regionale keuzes (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) wanneer je een specifiek API-oppervlak wilt afdwingen.
    - De verouderde env-var `Z_AI_API_KEY` wordt nog steeds geaccepteerd; OpenClaw kopieert deze bij het opstarten naar `ZAI_API_KEY` als `ZAI_API_KEY` niet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig OpenClaw-configuratieschema, inclusief provider- en modelinstellingen.
  </Card>
</CardGroup>
