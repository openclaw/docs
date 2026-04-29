---
read_when:
    - Je wilt toegang tot modellen die door OpenCode worden gehost
    - Je wilt kiezen tussen de Zen- en Go-catalogi
summary: Gebruik OpenCode Zen- en Go-catalogi met OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-29T23:12:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode biedt twee gehoste catalogi aan in OpenClaw:

| Catalogus | Voorvoegsel       | Runtimeprovider |
| --------- | ----------------- | --------------- |
| **Zen**   | `opencode/...`    | `opencode`      |
| **Go**    | `opencode-go/...` | `opencode-go`   |

Beide catalogi gebruiken dezelfde OpenCode API-sleutel. OpenClaw houdt de runtimeprovider-id's
gescheiden zodat upstream-routering per model correct blijft, maar onboarding en documentatie behandelen ze
als één OpenCode-configuratie.

## Aan de slag

<Tabs>
  <Tab title="Zen-catalogus">
    **Het meest geschikt voor:** de gecureerde OpenCode multi-modelproxy (Claude, GPT, Gemini).

    <Steps>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Of geef de sleutel direct door:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Een Zen-model als standaard instellen">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Controleren of modellen beschikbaar zijn">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go-catalogus">
    **Het meest geschikt voor:** de door OpenCode gehoste Kimi-, GLM- en MiniMax-reeks.

    <Steps>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Of geef de sleutel direct door:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Een Go-model als standaard instellen">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Controleren of modellen beschikbaar zijn">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuratievoorbeeld

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Ingebouwde catalogi

### Zen

| Eigenschap       | Waarde                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Runtimeprovider  | `opencode`                                                              |
| Voorbeeldmodellen | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Eigenschap       | Waarde                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Runtimeprovider  | `opencode-go`                                                            |
| Voorbeeldmodellen | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="API-sleutelaliassen">
    `OPENCODE_ZEN_API_KEY` wordt ook ondersteund als alias voor `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Gedeelde inloggegevens">
    Als u tijdens de installatie één OpenCode-sleutel invoert, worden inloggegevens voor beide runtimeproviders
    opgeslagen. U hoeft niet voor elke catalogus afzonderlijk onboarding uit te voeren.
  </Accordion>

  <Accordion title="Facturering en dashboard">
    U meldt zich aan bij OpenCode, voegt factureringsgegevens toe en kopieert uw API-sleutel. Facturering
    en beschikbaarheid van catalogi worden beheerd vanuit het OpenCode-dashboard.
  </Accordion>

  <Accordion title="Gemini-replaygedrag">
    Door Gemini ondersteunde OpenCode-verwijzingen blijven op het proxy-Gemini-pad, dus OpenClaw houdt
    Gemini-sanitatie van gedachtehandtekeningen daar actief zonder native Gemini-replayvalidatie of bootstrap-herschrijvingen in te schakelen.
  </Accordion>

  <Accordion title="Niet-Gemini-replaygedrag">
    Niet-Gemini OpenCode-verwijzingen behouden het minimale OpenAI-compatibele replaybeleid.
  </Accordion>
</AccordionGroup>

<Tip>
Als u tijdens de installatie één OpenCode-sleutel invoert, worden inloggegevens voor zowel de Zen- als
Go-runtimeproviders opgeslagen, zodat u onboarding maar één keer hoeft uit te voeren.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
