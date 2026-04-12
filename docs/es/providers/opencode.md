---
read_when:
    - Quieres acceso a modelos alojados en OpenCode
    - Quieres elegir entre los catálogos Zen y Go
summary: Usa los catálogos Zen y Go de OpenCode con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-12T23:32:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a68444d8c403c3caba4a18ea47f078c7a4c163f874560e1fad0e818afb6e0e60
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode expone dos catálogos alojados en OpenClaw:

| Catálogo | Prefijo           | Proveedor de runtime |
| -------- | ----------------- | -------------------- |
| **Zen**  | `opencode/...`    | `opencode`           |
| **Go**   | `opencode-go/...` | `opencode-go`        |

Ambos catálogos usan la misma clave API de OpenCode. OpenClaw mantiene separados
los ids de proveedor de runtime para que el enrutamiento upstream por modelo siga siendo correcto,
pero el onboarding y la documentación los tratan como una sola configuración de OpenCode.

## Primeros pasos

<Tabs>
  <Tab title="Zen catalog">
    **Ideal para:** el proxy multimodelo curado de OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        O pasa la clave directamente:

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
    **Ideal para:** la gama de Kimi, GLM y MiniMax alojada por OpenCode.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
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

## Ejemplo de configuración

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catálogos

### Zen

| Propiedad         | Valor                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| Proveedor de runtime | `opencode`                                                           |
| Modelos de ejemplo | `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro` |

### Go

| Propiedad         | Valor                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| Proveedor de runtime | `opencode-go`                                                         |
| Modelos de ejemplo | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Notas avanzadas

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` también es compatible como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Shared credentials">
    Introducir una clave de OpenCode durante la configuración almacena credenciales para ambos proveedores
    de runtime. No necesitas realizar el onboarding de cada catálogo por separado.
  </Accordion>

  <Accordion title="Billing and dashboard">
    Inicias sesión en OpenCode, agregas los datos de facturación y copias tu clave API. La facturación
    y la disponibilidad del catálogo se gestionan desde el panel de OpenCode.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Las referencias de OpenCode respaldadas por Gemini permanecen en la ruta proxy-Gemini, por lo que OpenClaw mantiene
    allí la sanitización de firmas de pensamiento de Gemini sin habilitar la
    validación nativa de repetición de Gemini ni las reescrituras de bootstrap.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    Las referencias de OpenCode no basadas en Gemini mantienen la política mínima de repetición compatible con OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Introducir una sola clave de OpenCode durante la configuración almacena credenciales para los proveedores de runtime Zen y
Go, por lo que solo necesitas hacer el onboarding una vez.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
