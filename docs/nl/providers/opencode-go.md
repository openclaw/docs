---
read_when:
    - U wilt de OpenCode Go-catalogus
    - Je hebt de runtime-modelverwijzingen nodig voor door Go gehoste modellen
summary: Gebruik de OpenCode Go-catalogus met de gedeelde OpenCode-configuratie
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-29T23:12:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go is de Go-catalogus binnen [OpenCode](/nl/providers/opencode).
Het gebruikt dezelfde `OPENCODE_API_KEY` als de Zen-catalogus, maar behoudt de runtime
provider-id `opencode-go` zodat upstream routering per model correct blijft.

| Eigenschap       | Waarde                          |
| ---------------- | ------------------------------- |
| Runtime provider | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Bovenliggende setup | [OpenCode](/nl/providers/opencode) |

## Ingebouwde catalogus

OpenClaw haalt de meeste Go-catalogusrijen uit het gebundelde Pi-modelregister en
vult actuele upstream rijen aan terwijl het register wordt bijgewerkt. Voer
`openclaw models list --provider opencode-go` uit voor de huidige modellenlijst.

De provider bevat:

| Modelverwijzing                 | Naam                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (3x limieten) |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

## Aan de slag

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Set a Go model as default">
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

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Pass the key directly">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Routing behavior">
    OpenClaw verwerkt routering per model automatisch wanneer de modelverwijzing
    `opencode-go/...` gebruikt. Er is geen aanvullende providerconfiguratie vereist.
  </Accordion>

  <Accordion title="Runtime ref convention">
    Runtimeverwijzingen blijven expliciet: `opencode/...` voor Zen, `opencode-go/...` voor Go.
    Dit houdt upstream routering per model correct in beide catalogi.
  </Accordion>

  <Accordion title="Shared credentials">
    Dezelfde `OPENCODE_API_KEY` wordt gebruikt door zowel de Zen- als de Go-catalogus. Het invoeren
    van de sleutel tijdens de setup slaat referenties op voor beide runtimeproviders.
  </Accordion>
</AccordionGroup>

<Tip>
Zie [OpenCode](/nl/providers/opencode) voor het gedeelde onboardingoverzicht en de volledige
Zen + Go-catalogusreferentie.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/nl/providers/opencode" icon="server">
    Gedeelde onboarding, catalogusoverzicht en geavanceerde notities.
  </Card>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
</CardGroup>
