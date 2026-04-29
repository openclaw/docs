---
read_when:
    - Je wilt GLM-modellen in OpenClaw
    - Je hebt de naamgevingsconventie voor modellen en de configuratie nodig
summary: Overzicht van de GLM-modelfamilie + hoe u deze in OpenClaw gebruikt
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-29T23:10:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 16
---

# GLM-modellen

GLM is een **modelfamilie** (geen bedrijf) die beschikbaar is via het Z.AI-platform. In OpenClaw worden GLM-modellen benaderd via de `zai`-provider en model-ID's zoals `zai/glm-5`.

## Aan de slag

<Steps>
  <Step title="Kies een authenticatieroute en voer onboarding uit">
    Kies de onboardingoptie die past bij je Z.AI-abonnement en regio:

    | Authenticatiekeuze | Meest geschikt voor |
    | ----------- | -------- |
    | `zai-api-key` | Generieke API-sleutelconfiguratie met automatische endpointdetectie |
    | `zai-coding-global` | Gebruikers van Coding Plan (wereldwijd) |
    | `zai-coding-cn` | Gebruikers van Coding Plan (regio China) |
    | `zai-global` | Algemene API (wereldwijd) |
    | `zai-cn` | Algemene API (regio China) |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Stel GLM in als het standaardmodel">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Controleer of modellen beschikbaar zijn">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Configuratievoorbeeld

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
Met `zai-api-key` kan OpenClaw het overeenkomende Z.AI-endpoint uit de sleutel detecteren en
automatisch de juiste basis-URL toepassen. Gebruik de expliciete regionale keuzes wanneer
je een specifiek Coding Plan- of algemeen API-oppervlak wilt afdwingen.
</Tip>

## Ingebouwde catalogus

OpenClaw vult de gebundelde `zai`-provider momenteel vooraf met deze GLM-verwijzingen:

| Model           | Model            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
De standaard gebundelde modelverwijzing is `zai/glm-5.1`. GLM-versies en beschikbaarheid
kunnen veranderen; raadpleeg de documentatie van Z.AI voor de nieuwste informatie.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Automatische endpointdetectie">
    Wanneer je de authenticatiekeuze `zai-api-key` gebruikt, inspecteert OpenClaw de sleutelindeling
    om de juiste Z.AI-basis-URL te bepalen. Expliciete regionale keuzes
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) overschrijven
    automatische detectie en zetten het endpoint rechtstreeks vast.
  </Accordion>

  <Accordion title="Providerdetails">
    GLM-modellen worden aangeboden door de `zai`-runtimeprovider. Zie voor volledige providerconfiguratie,
    regionale endpoints en aanvullende mogelijkheden de
    [Z.AI-providerdocumentatie](/nl/providers/zai).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Z.AI-provider" href="/nl/providers/zai" icon="server">
    Volledige Z.AI-providerconfiguratie en regionale endpoints.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
</CardGroup>
