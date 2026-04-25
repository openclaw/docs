---
read_when:
    - Quieres el catálogo OpenCode Go
    - Necesitas las referencias de modelos en ejecución para modelos alojados en Go
summary: Usa el catálogo OpenCode Go con la configuración compartida de OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T18:20:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go es el catálogo Go dentro de [OpenCode](/es/providers/opencode).
Usa la misma `OPENCODE_API_KEY` que el catálogo Zen, pero mantiene el identificador
de proveedor en ejecución `opencode-go` para que el enrutamiento por modelo aguas arriba siga siendo correcto.

| Propiedad        | Valor                           |
| ---------------- | ------------------------------- |
| Proveedor en ejecución | `opencode-go`             |
| Autenticación    | `OPENCODE_API_KEY`              |
| Configuración principal | [OpenCode](/es/providers/opencode) |

## Catálogo integrado

OpenClaw obtiene la mayoría de las filas del catálogo Go del registro integrado de modelos pi y
complementa las filas actuales aguas arriba mientras el registro se pone al día. Ejecuta
`openclaw models list --provider opencode-go` para ver la lista actual de modelos.

El proveedor incluye:

| Referencia de modelo             | Nombre                |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (límites 3x) |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

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

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de enrutamiento">
    OpenClaw gestiona el enrutamiento por modelo automáticamente cuando la referencia del modelo usa
    `opencode-go/...`. No se requiere configuración adicional del proveedor.
  </Accordion>

  <Accordion title="Convención de referencias en ejecución">
    Las referencias en ejecución se mantienen explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
    Esto mantiene correcto el enrutamiento por modelo aguas arriba en ambos catálogos.
  </Accordion>

  <Accordion title="Credenciales compartidas">
    La misma `OPENCODE_API_KEY` la usan tanto el catálogo Zen como el catálogo Go. Introducir
    la clave durante la configuración almacena credenciales para ambos proveedores en ejecución.
  </Accordion>
</AccordionGroup>

<Tip>
Consulta [OpenCode](/es/providers/opencode) para ver la visión general compartida de incorporación y la referencia completa
de los catálogos Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (principal)" href="/es/providers/opencode" icon="server">
    Incorporación compartida, visión general del catálogo y notas avanzadas.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de respaldo.
  </Card>
</CardGroup>
