---
read_when:
    - Quieres el catálogo de OpenCode Go
    - Necesitas las referencias de modelo en tiempo de ejecución para los modelos alojados en Go
summary: Usa el catálogo Go de OpenCode con la configuración compartida de OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T12:40:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go es el catálogo Go dentro de [OpenCode](/es/providers/opencode).
Usa la misma `OPENCODE_API_KEY` que el catálogo Zen, pero mantiene el id de
proveedor de tiempo de ejecución `opencode-go` para que el enrutamiento ascendente
por modelo siga siendo correcto.

| Propiedad                     | Valor                           |
| ----------------------------- | ------------------------------- |
| Proveedor de tiempo de ejecución | `opencode-go`                |
| Autenticación                 | `OPENCODE_API_KEY`              |
| Configuración principal       | [OpenCode](/es/providers/opencode) |

## Catálogo integrado

OpenClaw obtiene la mayoría de las filas del catálogo Go del registro de modelos
integrado de OpenClaw y complementa las filas ascendentes actuales mientras el
registro se pone al día. Ejecuta `openclaw models list --provider opencode-go`
para ver la lista de modelos actual.

El proveedor incluye:

| Ref. de modelo                 | Nombre                |
| ------------------------------ | --------------------- |
| `opencode-go/glm-5`            | GLM-5                 |
| `opencode-go/glm-5.1`          | GLM-5.1               |
| `opencode-go/glm-5.2`          | GLM-5.2               |
| `opencode-go/kimi-k2.5`        | Kimi K2.5             |
| `opencode-go/kimi-k2.6`        | Kimi K2.6 (límites 3x) |
| `opencode-go/kimi-k2.7-code`   | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`  | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash    |
| `opencode-go/mimo-v2-omni`     | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`      | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`     | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`     | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`     | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`     | Qwen3.6 Plus          |

GLM-5.2 usa una ventana de contexto de 1 millón de tokens y admite hasta 131 mil tokens de salida.

## Primeros pasos

<Tabs>
  <Tab title="Interactivo">
    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Definir un modelo Go como predeterminado">
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

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de enrutamiento">
    OpenClaw gestiona automáticamente el enrutamiento por modelo cuando la ref. del modelo usa
    `opencode-go/...`. No se requiere configuración adicional del proveedor.
  </Accordion>

  <Accordion title="Convención de refs. de tiempo de ejecución">
    Las refs. de tiempo de ejecución siguen siendo explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
    Esto mantiene correcto el enrutamiento ascendente por modelo en ambos catálogos.
  </Accordion>

  <Accordion title="Credenciales compartidas">
    Tanto el catálogo Zen como el catálogo Go usan la misma `OPENCODE_API_KEY`. Introducir
    la clave durante la configuración almacena credenciales para ambos proveedores de tiempo de ejecución.
  </Accordion>
</AccordionGroup>

<Tip>
Consulta [OpenCode](/es/providers/opencode) para ver la descripción general de la incorporación compartida y la referencia completa
del catálogo Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (principal)" href="/es/providers/opencode" icon="server">
    Incorporación compartida, descripción general del catálogo y notas avanzadas.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs. de modelo y comportamiento de conmutación por error.
  </Card>
</CardGroup>
