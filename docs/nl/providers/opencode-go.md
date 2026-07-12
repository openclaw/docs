---
read_when:
    - Je wilt de OpenCode Go-catalogus
    - Je hebt de runtimemodelreferenties nodig voor door Go gehoste modellen
summary: Gebruik de OpenCode Go-catalogus met de gedeelde OpenCode-configuratie
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T09:19:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go is de Go-catalogus binnen [OpenCode](/nl/providers/opencode). Deze deelt
de `OPENCODE_API_KEY`-referentie met de Zen-catalogus, maar behoudt een eigen
runtimeprovider-id (`opencode-go`), zodat de upstreamroutering per model
correct blijft.

| Eigenschap       | Waarde                                             |
| ---------------- | -------------------------------------------------- |
| Runtimeprovider  | `opencode-go`                                      |
| Authenticatie    | `OPENCODE_API_KEY` (alias: `OPENCODE_ZEN_API_KEY`) |
| Bovenliggende configuratie | [OpenCode](/nl/providers/opencode)          |

## Aan de slag

<Tabs>
  <Tab title="Interactief">
    <Steps>
      <Step title="Voer de onboarding uit">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Stel een Go-model als standaard in">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Controleer of modellen beschikbaar zijn">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Niet-interactief">
    <Steps>
      <Step title="Geef de sleutel rechtstreeks door">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Controleer of modellen beschikbaar zijn">
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

## Ingebouwde catalogus

Voer `openclaw models list --provider opencode-go` uit voor de huidige modellenlijst.
Meegeleverde vermeldingen:

| Modelreferentie                 | Naam              | Context   | Maximale uitvoer | Afbeeldingsinvoer |
| ------------------------------- | ----------------- | --------- | ---------------- | ----------------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K             | Nee               |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K             | Nee               |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768           | Nee               |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768           | Nee               |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072          | Nee               |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768           | Nee               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536           | Ja                |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536           | Ja                |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144          | Ja                |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000          | Ja                |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000          | Nee               |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536           | Nee               |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072          | Nee               |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072          | Nee               |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536           | Ja                |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536           | Ja                |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536           | Nee               |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536           | Ja                |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Routeringsgedrag">
    OpenClaw routeert elke modelreferentie van het type `opencode-go/...` automatisch. Er is geen
    aanvullende providerconfiguratie vereist.
  </Accordion>

  <Accordion title="Conventie voor runtimereferenties">
    Runtimereferenties blijven expliciet: `opencode/...` voor Zen en `opencode-go/...` voor
    Go. Hierdoor blijft de upstreamroutering per model in beide catalogi correct.
  </Accordion>

  <Accordion title="Gedeelde referenties">
    Eén `OPENCODE_API_KEY` is geldig voor zowel de Zen- als de Go-catalogus. Wanneer u de
    sleutel tijdens de configuratie invoert, worden referenties voor beide runtimeproviders opgeslagen.
  </Accordion>
</AccordionGroup>

<Tip>
Zie [OpenCode](/nl/providers/opencode) voor het gedeelde onboardingoverzicht en de volledige
catalogusreferentie voor Zen en Go.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="OpenCode (bovenliggend)" href="/nl/providers/opencode" icon="server">
    Gedeelde onboarding, catalogusoverzicht en geavanceerde opmerkingen.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers en modelreferenties kiezen en failovergedrag configureren.
  </Card>
</CardGroup>
