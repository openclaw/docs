---
read_when:
    - Quieres el catálogo de OpenCode Go
    - Necesitas las referencias de modelo en tiempo de ejecución para modelos alojados en Go
summary: Usa el catálogo Go de OpenCode con la configuración compartida de OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-05T11:41:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: decfc453b812c1264fc3e976dca4e1289171bac67b9e268f6cd9e5076b5aa78b
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go es el catálogo Go dentro de [OpenCode](/es/providers/opencode). Comparte
la credencial `OPENCODE_API_KEY` con el catálogo Zen, pero conserva su propio
id de proveedor en tiempo de ejecución (`opencode-go`) para que el enrutamiento
ascendente por modelo siga siendo correcto.

| Propiedad                      | Valor                                              |
| ------------------------------ | -------------------------------------------------- |
| Proveedor en tiempo de ejecución | `opencode-go`                                      |
| Autenticación                  | `OPENCODE_API_KEY` (alias: `OPENCODE_ZEN_API_KEY`) |
| Configuración principal        | [OpenCode](/es/providers/opencode)                    |

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

## Ejemplo de configuración

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Catálogo integrado

Ejecuta `openclaw models list --provider opencode-go` para ver la lista actual de modelos.
Filas incluidas:

| Referencia de modelo            | Nombre            | Contexto  | Salida máxima | Entrada de imagen |
| ------------------------------- | ----------------- | --------- | ------------- | ----------------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K          | No                |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K          | No                |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768        | No                |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768        | No                |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072       | No                |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768        | No                |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536        | Sí                |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536        | Sí                |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144       | Sí                |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni      | 262,144   | 32,000        | Sí                |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000       | Sí                |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro       | 1,048,576 | 32,000        | No                |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000       | No                |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536        | No                |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072       | No                |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072       | No                |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536        | Sí                |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536        | Sí                |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536        | No                |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536        | Sí                |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Routing behavior">
    OpenClaw enruta automáticamente cualquier referencia de modelo `opencode-go/...`. No se requiere
    configuración adicional del proveedor.
  </Accordion>

  <Accordion title="Runtime ref convention">
    Las referencias en tiempo de ejecución siguen siendo explícitas: `opencode/...` para Zen, `opencode-go/...` para
    Go. Esto mantiene correcto el enrutamiento ascendente por modelo en ambos catálogos.
  </Accordion>

  <Accordion title="Shared credentials">
    Una sola `OPENCODE_API_KEY` cubre los catálogos Zen y Go. Introducir la
    clave durante la configuración guarda las credenciales para ambos proveedores en tiempo de ejecución.
  </Accordion>
</AccordionGroup>

<Tip>
Consulta [OpenCode](/es/providers/opencode) para ver la descripción general compartida de incorporación y la referencia completa
del catálogo Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/es/providers/opencode" icon="server">
    Incorporación compartida, descripción general del catálogo y notas avanzadas.
  </Card>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
</CardGroup>
