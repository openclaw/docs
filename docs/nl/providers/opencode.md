---
read_when:
    - Je wilt door OpenCode gehoste modeltoegang
    - Je wilt kiezen tussen de Zen- en Go-catalogi
summary: OpenCode Zen- en Go-catalogi gebruiken met OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:45:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode biedt twee gehoste catalogi in OpenClaw:

| Catalogus | Voorvoegsel       | Runtimeprovider |
| --------- | ----------------- | --------------- |
| **Zen**   | `opencode/...`    | `opencode`      |
| **Go**    | `opencode-go/...` | `opencode-go`   |

Beide catalogi gebruiken dezelfde OpenCode-API-sleutel. OpenClaw houdt de runtimeprovider-id's
gescheiden zodat upstream-routering per model correct blijft, maar onboarding en documentatie behandelen ze
als één OpenCode-configuratie.

## Aan de slag

<Tabs>
  <Tab title="Zen catalog">
    **Beste voor:** de samengestelde OpenCode-proxy voor meerdere modellen (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Of geef de sleutel direct door:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **Beste voor:** de door OpenCode gehoste reeks van Kimi, GLM en MiniMax.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Of geef de sleutel direct door:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
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

| Eigenschap       | Waarde                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Runtimeprovider  | `opencode`                                                                                    |
| Voorbeeldmodellen | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Eigenschap       | Waarde                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Runtimeprovider  | `opencode-go`                                                            |
| Voorbeeldmodellen | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` wordt ook ondersteund als alias voor `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Shared credentials">
    Als je tijdens de configuratie één OpenCode-sleutel invoert, worden referenties voor beide runtimeproviders
    opgeslagen. Je hoeft niet elke catalogus afzonderlijk te onboarden.
  </Accordion>

  <Accordion title="Billing and dashboard">
    Je meldt je aan bij OpenCode, voegt factureringsgegevens toe en kopieert je API-sleutel. Facturering
    en catalogusbeschikbaarheid worden beheerd vanuit het OpenCode-dashboard.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Door Gemini ondersteunde OpenCode-refs blijven op het proxy-Gemini-pad, zodat OpenClaw daar
    opschoning van Gemini-gedachtesignaturen behoudt zonder native Gemini-replayvalidatie of bootstrap-herschrijvingen in te schakelen.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    Niet-Gemini OpenCode-refs behouden het minimale OpenAI-compatibele replaybeleid.
  </Accordion>
</AccordionGroup>

<Tip>
Als je tijdens de configuratie één OpenCode-sleutel invoert, worden referenties voor zowel de Zen- als
Go-runtimeproviders opgeslagen, zodat je maar één keer hoeft te onboarden.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, model-refs en failovergedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
