---
read_when:
    - Quieres el catálogo OpenCode Go
    - Necesitas las refs de modelos de runtime para modelos alojados en Go
summary: Usa el catálogo OpenCode Go con la configuración compartida de OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-12T23:32:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f0f182de81729616ccc19125d93ba0445de2349daf7067b52e8c15b9d3539c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go es el catálogo Go dentro de [OpenCode](/es/providers/opencode).
Usa la misma `OPENCODE_API_KEY` que el catálogo Zen, pero mantiene el id de proveedor de runtime `opencode-go` para que el enrutamiento upstream por modelo siga siendo correcto.

| Propiedad        | Valor                         |
| ---------------- | ----------------------------- |
| Proveedor de runtime | `opencode-go`             |
| Autenticación    | `OPENCODE_API_KEY`            |
| Configuración principal | [OpenCode](/es/providers/opencode) |

## Modelos compatibles

| Ref del modelo             | Nombre       |
| -------------------------- | ------------ |
| `opencode-go/kimi-k2.5`    | Kimi K2.5    |
| `opencode-go/glm-5`        | GLM 5        |
| `opencode-go/minimax-m2.5` | MiniMax M2.5 |

## Primeros pasos

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

## Ejemplo de configuración

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Routing behavior">
    OpenClaw gestiona automáticamente el enrutamiento por modelo cuando la ref del modelo usa `opencode-go/...`. No se requiere configuración adicional del proveedor.
  </Accordion>

  <Accordion title="Runtime ref convention">
    Las refs de runtime siguen siendo explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
    Esto mantiene correcto el enrutamiento upstream por modelo en ambos catálogos.
  </Accordion>

  <Accordion title="Shared credentials">
    La misma `OPENCODE_API_KEY` se usa tanto para los catálogos Zen como Go. Introducir la clave durante la configuración almacena credenciales para ambos proveedores de runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consulta [OpenCode](/es/providers/opencode) para ver la descripción general compartida del onboarding y la referencia completa de los catálogos Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/es/providers/opencode" icon="server">
    Onboarding compartido, resumen del catálogo y notas avanzadas.
  </Card>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Cómo elegir proveedores, refs de modelos y comportamiento de failover.
  </Card>
</CardGroup>
