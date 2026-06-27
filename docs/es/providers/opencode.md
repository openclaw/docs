---
read_when:
    - Quieres acceso a modelos alojados por OpenCode
    - Quieres elegir entre los catálogos Zen y Go
summary: Usa los catálogos de OpenCode Zen y Go con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:55:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenCode expone dos catálogos alojados en OpenClaw:

| Catalog | Prefix            | Runtime provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Ambos catálogos usan la misma clave de API de OpenCode. OpenClaw mantiene separados los id de proveedor de tiempo de ejecución
para que el enrutamiento ascendente por modelo siga siendo correcto, pero la incorporación y la documentación los tratan
como una sola configuración de OpenCode.

## Primeros pasos

<Tabs>
  <Tab title="Catálogo Zen">
    **Ideal para:** el proxy multimodelo curado de OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Establece un modelo Zen como predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verifica que los modelos estén disponibles">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catálogo Go">
    **Ideal para:** la gama Kimi, GLM y MiniMax alojada por OpenCode.

    <Steps>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Establece un modelo Go como predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verifica que los modelos estén disponibles">
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

| Property         | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime provider | `opencode`                                                              |
| Example models   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Property         | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime provider | `opencode-go`                                                            |
| Example models   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Alias de claves de API">
    `OPENCODE_ZEN_API_KEY` también es compatible como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenciales compartidas">
    Introducir una clave de OpenCode durante la configuración almacena credenciales para ambos proveedores
    de tiempo de ejecución. No necesitas incorporar cada catálogo por separado.
  </Accordion>

  <Accordion title="Facturación y panel">
    Inicias sesión en OpenCode, agregas los datos de facturación y copias tu clave de API. La facturación
    y la disponibilidad del catálogo se gestionan desde el panel de OpenCode.
  </Accordion>

  <Accordion title="Comportamiento de repetición de Gemini">
    Las referencias de OpenCode respaldadas por Gemini permanecen en la ruta proxy-Gemini, por lo que OpenClaw mantiene
    allí el saneamiento de firmas de pensamiento de Gemini sin habilitar la validación nativa de repetición de Gemini
    ni las reescrituras de arranque.
  </Accordion>

  <Accordion title="Comportamiento de repetición no Gemini">
    Las referencias de OpenCode no Gemini mantienen la política mínima de repetición compatible con OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Introducir una clave de OpenCode durante la configuración almacena credenciales para los proveedores de tiempo de ejecución Zen y
Go, por lo que solo necesitas hacer la incorporación una vez.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
