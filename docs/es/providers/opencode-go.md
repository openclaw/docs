---
read_when:
    - Quieres el catálogo de OpenCode Go
    - Necesitas las referencias de modelos en tiempo de ejecución para los modelos alojados en Go
summary: Usa el catálogo de OpenCode Go con la configuración compartida de OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T14:48:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go es el catálogo de Go dentro de [OpenCode](/es/providers/opencode). Comparte
la credencial `OPENCODE_API_KEY` con el catálogo Zen, pero mantiene su propio
id. de proveedor de ejecución (`opencode-go`) para que el enrutamiento por modelo
del proveedor ascendente siga siendo correcto.

| Propiedad              | Valor                                              |
| ---------------------- | -------------------------------------------------- |
| Proveedor de ejecución | `opencode-go`                                      |
| Autenticación          | `OPENCODE_API_KEY` (alias: `OPENCODE_ZEN_API_KEY`) |
| Configuración principal | [OpenCode](/es/providers/opencode)                   |

## Primeros pasos

<Tabs>
  <Tab title="Interactivo">
    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Establecer un modelo Go como predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verificar que los modelos estén disponibles">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="No interactivo">
    <Steps>
      <Step title="Pasar la clave directamente">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verificar que los modelos estén disponibles">
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

Ejecute `openclaw models list --provider opencode-go` para consultar la lista actual de modelos.
Filas incluidas:

| Referencia del modelo            | Nombre            | Contexto  | Salida máxima | Entrada de imagen |
| -------------------------------- | ----------------- | --------- | ------------- | ----------------- |
| `opencode-go/deepseek-v4-pro`    | DeepSeek V4 Pro   | 1M        | 384K          | No                |
| `opencode-go/deepseek-v4-flash`  | DeepSeek V4 Flash | 1M        | 384K          | No                |
| `opencode-go/glm-5`              | GLM-5             | 202,752   | 32,768        | No                |
| `opencode-go/glm-5.1`            | GLM-5.1           | 202,752   | 32,768        | No                |
| `opencode-go/glm-5.2`            | GLM-5.2           | 1M        | 131,072       | No                |
| `opencode-go/hy3-preview`        | HY3 Preview       | 262,144   | 32,768        | No                |
| `opencode-go/kimi-k2.5`          | Kimi K2.5         | 262,144   | 65,536        | Sí                |
| `opencode-go/kimi-k2.6`          | Kimi K2.6         | 262,144   | 65,536        | Sí                |
| `opencode-go/kimi-k2.7-code`     | Kimi K2.7 Code    | 262,144   | 262,144       | Sí                |
| `opencode-go/mimo-v2.5`          | MiMo V2.5         | 1M        | 128,000       | Sí                |
| `opencode-go/mimo-v2.5-pro`      | MiMo V2.5 Pro     | 1,048,576 | 128,000       | No                |
| `opencode-go/minimax-m2.5`       | MiniMax M2.5      | 204,800   | 65,536        | No                |
| `opencode-go/minimax-m2.7`       | MiniMax M2.7      | 204,800   | 131,072       | No                |
| `opencode-go/minimax-m3`         | MiniMax M3        | 204,800   | 131,072       | No                |
| `opencode-go/qwen3.5-plus`       | Qwen3.5 Plus      | 262,144   | 65,536        | Sí                |
| `opencode-go/qwen3.6-plus`       | Qwen3.6 Plus      | 262,144   | 65,536        | Sí                |
| `opencode-go/qwen3.7-max`        | Qwen3.7 Max       | 1M        | 65,536        | No                |
| `opencode-go/qwen3.7-plus`       | Qwen3.7 Plus      | 1M        | 65,536        | Sí                |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento del enrutamiento">
    OpenClaw enruta automáticamente cualquier referencia de modelo `opencode-go/...`. No se requiere
    ninguna configuración adicional del proveedor.
  </Accordion>

  <Accordion title="Convención de referencias de ejecución">
    Las referencias de ejecución se mantienen explícitas: `opencode/...` para Zen y `opencode-go/...` para
    Go. Esto mantiene correcto el enrutamiento por modelo del proveedor ascendente en ambos catálogos.
  </Accordion>

  <Accordion title="Credenciales compartidas">
    Una sola `OPENCODE_API_KEY` abarca los catálogos Zen y Go. Al introducir la
    clave durante la configuración, se almacenan las credenciales para ambos proveedores de ejecución.
  </Accordion>
</AccordionGroup>

<Tip>
Consulte [OpenCode](/es/providers/opencode) para ver la descripción general de la incorporación compartida y la referencia
completa de los catálogos Zen y Go.
</Tip>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (principal)" href="/es/providers/opencode" icon="server">
    Incorporación compartida, descripción general del catálogo y notas avanzadas.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
</CardGroup>
