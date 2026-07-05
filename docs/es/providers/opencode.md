---
read_when:
    - Quieres acceso a modelos alojado en OpenCode
    - Quieres elegir entre los catálogos Zen y Go
summary: Usa los catálogos OpenCode Zen y Go con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-05T11:38:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode expone dos catálogos alojados en OpenClaw:

| Catálogo | Prefijo           | Proveedor de runtime |
| -------- | ----------------- | -------------------- |
| **Zen**  | `opencode/...`    | `opencode`           |
| **Go**   | `opencode-go/...` | `opencode-go`        |

Ambos catálogos comparten una clave de API de OpenCode (`OPENCODE_API_KEY`, alias
`OPENCODE_ZEN_API_KEY`). OpenClaw mantiene separados los ids de proveedor de runtime para que
el enrutamiento ascendente por modelo siga siendo correcto, pero la configuración inicial y la documentación los tratan como
una sola configuración de OpenCode.

## Primeros pasos

<Tabs>
  <Tab title="Zen catalog">
    **Ideal para:** el proxy multimodelo seleccionado de OpenCode (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

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
    **Ideal para:** la línea alojada en OpenCode de Kimi, GLM, MiniMax, Qwen y DeepSeek.

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

## Ejemplo de configuración

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catálogos integrados

### Zen

| Propiedad            | Valor                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Proveedor de runtime | `opencode`                                                                                    |
| Modelos de ejemplo   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

Ejecuta `openclaw models list --provider opencode` para ver la lista actual completa, que
también incluye filas de nivel gratuito como `opencode/big-pickle` y
`opencode/deepseek-v4-flash-free`.

### Go

| Propiedad            | Valor                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Proveedor de runtime | `opencode-go`                                                            |
| Modelos de ejemplo   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Consulta [OpenCode Go](/es/providers/opencode-go) para ver la tabla completa de modelos Go.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` también se acepta como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Shared credentials">
    Introducir una clave de OpenCode durante la configuración almacena credenciales para ambos proveedores de runtime.
    No necesitas configurar cada catálogo por separado.
  </Accordion>

  <Accordion title="Getting an API key">
    Crea una cuenta de OpenCode y genera una clave de API en
    [opencode.ai/auth](https://opencode.ai/auth). La facturación y la disponibilidad del catálogo
    se gestionan desde el panel de OpenCode.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Las refs de OpenCode respaldadas por Gemini permanecen en la ruta proxy-Gemini, por lo que OpenClaw mantiene
    allí la limpieza de firmas de pensamiento de Gemini sin habilitar la validación de repetición nativa de Gemini
    ni reescrituras de arranque.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    Las refs de OpenCode que no son Gemini mantienen la política mínima de repetición compatible con OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/es/providers/opencode-go" icon="server">
    Referencia completa del catálogo Go.
  </Card>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
