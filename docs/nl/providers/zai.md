---
read_when:
    - Je wilt Z.AI / GLM-modellen in OpenClaw
    - Je hebt een eenvoudige ZAI_API_KEY-configuratie nodig
summary: Gebruik Z.AI (GLM-modellen) met OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-29T23:14:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI is het API-platform voor **GLM**-modellen. Het biedt REST-API's voor GLM en gebruikt API-sleutels
voor authenticatie. Maak je API-sleutel aan in de Z.AI-console. OpenClaw gebruikt de `zai`-provider
met een Z.AI-API-sleutel.

- Provider: `zai`
- Authenticatie: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer-authenticatie)

## Aan de slag

<Tabs>
  <Tab title="Endpoint automatisch detecteren">
    **Beste voor:** de meeste gebruikers. OpenClaw detecteert het bijbehorende Z.AI-endpoint op basis van de sleutel en past automatisch de juiste basis-URL toe.

    <Steps>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Een standaardmodel instellen">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Controleren of het model beschikbaar is">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Expliciet regionaal endpoint">
    **Beste voor:** gebruikers die een specifiek Coding Plan of algemeen API-oppervlak willen afdwingen.

    <Steps>
      <Step title="Kies de juiste onboardingoptie">
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
      <Step title="Een standaardmodel instellen">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Controleren of het model beschikbaar is">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ingebouwde catalogus

OpenClaw vult de gebundelde `zai`-provider momenteel vooraf met:

| Modelverwijzing      | Opmerkingen      |
| -------------------- | ---------------- |
| `zai/glm-5.1`        | Standaardmodel   |
| `zai/glm-5`          |                  |
| `zai/glm-5-turbo`    |                  |
| `zai/glm-5v-turbo`   |                  |
| `zai/glm-4.7`        |                  |
| `zai/glm-4.7-flash`  |                  |
| `zai/glm-4.7-flashx` |                  |
| `zai/glm-4.6`        |                  |
| `zai/glm-4.6v`       |                  |
| `zai/glm-4.5`        |                  |
| `zai/glm-4.5-air`    |                  |
| `zai/glm-4.5-flash`  |                  |
| `zai/glm-4.5v`       |                  |

<Tip>
GLM-modellen zijn beschikbaar als `zai/<model>` (voorbeeld: `zai/glm-5`). De standaard gebundelde modelverwijzing is `zai/glm-5.1`.
</Tip>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Onbekende GLM-5-modellen vooruit oplossend verwerken">
    Onbekende `glm-5*`-id's worden nog steeds vooruit oplossend verwerkt op het pad van de gebundelde provider door
    provider-eigen metadata te synthetiseren uit de `glm-4.7`-template wanneer de id
    overeenkomt met de huidige vorm van de GLM-5-familie.
  </Accordion>

  <Accordion title="Tool-call-streaming">
    `tool_stream` is standaard ingeschakeld voor Z.AI-tool-call-streaming. Om dit uit te schakelen:

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

  <Accordion title="Thinking en bewaarde thinking">
    Z.AI-thinking volgt de `/think`-besturing van OpenClaw. Met thinking uit
    stuurt OpenClaw `thinking: { type: "disabled" }` om reacties te vermijden die
    het uitvoerbudget besteden aan `reasoning_content` voordat zichtbare tekst verschijnt.

    Bewaarde thinking is opt-in omdat Z.AI vereist dat de volledige historische
    `reasoning_content` opnieuw wordt afgespeeld, wat het aantal prompttokens verhoogt. Schakel dit
    per model in:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Wanneer dit is ingeschakeld en thinking aan staat, stuurt OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` en speelt eerdere
    `reasoning_content` opnieuw af voor hetzelfde OpenAI-compatibele transcript.

    Geavanceerde gebruikers kunnen de exacte providerpayload nog steeds overschrijven met
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Begrip van afbeeldingen">
    De gebundelde Z.AI-Plugin registreert begrip van afbeeldingen.

    | Eigenschap    | Waarde      |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Begrip van afbeeldingen wordt automatisch opgelost vanuit de geconfigureerde Z.AI-authenticatie, zonder
    dat aanvullende configuratie nodig is.

  </Accordion>

  <Accordion title="Authenticatiedetails">
    - Z.AI gebruikt Bearer-authenticatie met je API-sleutel.
    - De onboardingoptie `zai-api-key` detecteert automatisch het bijbehorende Z.AI-endpoint op basis van het sleutelvoorvoegsel.
    - Gebruik de expliciete regionale opties (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) wanneer je een specifiek API-oppervlak wilt afdwingen.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="GLM-modelfamilie" href="/nl/providers/glm" icon="microchip">
    Overzicht van de modelfamilie voor GLM.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
</CardGroup>
