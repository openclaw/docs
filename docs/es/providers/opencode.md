---
read_when:
    - Quieres acceso a modelos alojados por OpenCode
    - Quieres elegir entre los catálogos Zen y Go
summary: Usar los catálogos Zen y Go de OpenCode con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T05:45:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode expone dos catálogos alojados en OpenClaw:

| Catálogo | Prefijo           | Proveedor de runtime |
| -------- | ----------------- | -------------------- |
| **Zen**  | `opencode/...`    | `opencode`           |
| **Go**   | `opencode-go/...` | `opencode-go`        |

Ambos catálogos usan la misma clave API de OpenCode. OpenClaw mantiene separados los ids de proveedor de runtime
para que el enrutamiento upstream por modelo siga siendo correcto, pero la incorporación y la documentación los tratan
como una sola configuración de OpenCode.

## Primeros pasos

<Tabs>
  <Tab title="Catálogo Zen">
    **Ideal para:** el proxy multimodelo curado de OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Establecer un modelo Zen como predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verificar que los modelos estén disponibles">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catálogo Go">
    **Ideal para:** la línea alojada por OpenCode de Kimi, GLM y MiniMax.

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Establecer un modelo Go como predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
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
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catálogos integrados

### Zen

| Propiedad        | Valor                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Proveedor de runtime | `opencode`                                                          |
| Modelos de ejemplo | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Propiedad        | Valor                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Proveedor de runtime | `opencode-go`                                                        |
| Modelos de ejemplo | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Alias de clave API">
    `OPENCODE_ZEN_API_KEY` también es compatible como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenciales compartidas">
    Introducir una clave de OpenCode durante la configuración almacena credenciales para ambos proveedores
    de runtime. No necesitas incorporar cada catálogo por separado.
  </Accordion>

  <Accordion title="Facturación y panel">
    Inicias sesión en OpenCode, agregas los datos de facturación y copias tu clave API. La facturación
    y la disponibilidad del catálogo se gestionan desde el panel de OpenCode.
  </Accordion>

  <Accordion title="Comportamiento de replay de Gemini">
    Las referencias OpenCode respaldadas por Gemini permanecen en la ruta proxy-Gemini, por lo que OpenClaw mantiene
    allí la sanitización de firmas de pensamiento de Gemini sin habilitar validación de replay nativa de Gemini
    ni reescrituras bootstrap.
  </Accordion>

  <Accordion title="Comportamiento de replay no Gemini">
    Las referencias OpenCode no Gemini mantienen la política mínima de replay compatible con OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Introducir una clave de OpenCode durante la configuración almacena credenciales para los proveedores de runtime Zen y
Go, por lo que solo necesitas hacer la incorporación una vez.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
