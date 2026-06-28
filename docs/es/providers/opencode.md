---
read_when:
    - Quieres acceso a modelos alojados en OpenCode
    - Quieres elegir entre los catálogos Zen y Go
summary: Usa catálogos de OpenCode Zen y Go con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:45:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode expone dos catálogos alojados en OpenClaw:

| Catálogo | Prefijo           | Proveedor en tiempo de ejecución |
| -------- | ----------------- | -------------------------------- |
| **Zen**  | `opencode/...`    | `opencode`                       |
| **Go**   | `opencode-go/...` | `opencode-go`                    |

Ambos catálogos usan la misma clave de API de OpenCode. OpenClaw mantiene separados
los ids de los proveedores en tiempo de ejecución para que el enrutamiento ascendente por modelo siga siendo correcto, pero el onboarding y la documentación los tratan
como una sola configuración de OpenCode.

## Primeros pasos

<Tabs>
  <Tab title="Catálogo Zen">
    **Ideal para:** el proxy multimodelo curado de OpenCode (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Ejecutar el onboarding">
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
    **Ideal para:** la línea de Kimi, GLM y MiniMax alojada en OpenCode.

    <Steps>
      <Step title="Ejecutar el onboarding">
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

| Propiedad                    | Valor                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| Proveedor en tiempo de ejecución | `opencode`                                                                                |
| Modelos de ejemplo           | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Propiedad                    | Valor                                                                    |
| ---------------------------- | ------------------------------------------------------------------------ |
| Proveedor en tiempo de ejecución | `opencode-go`                                                        |
| Modelos de ejemplo           | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Alias de clave de API">
    `OPENCODE_ZEN_API_KEY` también se admite como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenciales compartidas">
    Introducir una clave de OpenCode durante la configuración almacena credenciales para ambos proveedores en tiempo
    de ejecución. No necesitas hacer el onboarding de cada catálogo por separado.
  </Accordion>

  <Accordion title="Facturación y panel">
    Inicias sesión en OpenCode, agregas los datos de facturación y copias tu clave de API. La facturación
    y la disponibilidad del catálogo se gestionan desde el panel de OpenCode.
  </Accordion>

  <Accordion title="Comportamiento de reproducción de Gemini">
    Las referencias de OpenCode respaldadas por Gemini permanecen en la ruta proxy-Gemini, por lo que OpenClaw mantiene
    allí la limpieza de firmas de pensamiento de Gemini sin habilitar la validación de reproducción nativa de Gemini
    ni las reescrituras de arranque.
  </Accordion>

  <Accordion title="Comportamiento de reproducción no Gemini">
    Las referencias de OpenCode que no son de Gemini mantienen la política mínima de reproducción compatible con OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Introducir una clave de OpenCode durante la configuración almacena credenciales para los proveedores en tiempo de ejecución Zen y
Go, por lo que solo necesitas hacer el onboarding una vez.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
