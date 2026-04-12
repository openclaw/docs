---
read_when:
    - Quieres usar modelos Z.AI / GLM en OpenClaw
    - Necesitas una configuración sencilla de `ZAI_API_KEY`
summary: Usa Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-12T23:33:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 972b467dab141c8c5126ac776b7cb6b21815c27da511b3f34e12bd9e9ac953b7
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI es la plataforma de API para modelos **GLM**. Proporciona API REST para GLM y usa claves de API
para la autenticación. Crea tu clave de API en la consola de Z.AI. OpenClaw usa el proveedor `zai`
con una clave de API de Z.AI.

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autenticación Bearer)

## Primeros pasos

<Tabs>
  <Tab title="Detectar endpoint automáticamente">
    **Ideal para:** la mayoría de los usuarios. OpenClaw detecta el endpoint de Z.AI correspondiente a partir de la clave y aplica automáticamente la URL base correcta.

    <Steps>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Ideal para:** usuarios que quieren forzar una superficie específica de Coding Plan o de la API general.

    <Steps>
      <Step title="Elegir la opción de onboarding correcta">
        ```bash
        # Coding Plan Global (recomendado para usuarios de Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (región de China)
        openclaw onboard --auth-choice zai-coding-cn

        # API general
        openclaw onboard --auth-choice zai-global

        # API general CN (región de China)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catálogo GLM integrado

OpenClaw actualmente inicializa el proveedor integrado `zai` con:

| Referencia de modelo | Notas         |
| -------------------- | ------------- |
| `zai/glm-5.1`        | Modelo predeterminado |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
Los modelos GLM están disponibles como `zai/<model>` (ejemplo: `zai/glm-5`). La referencia de modelo integrada predeterminada es `zai/glm-5.1`.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Resolución anticipada de modelos GLM-5 desconocidos">
    Los id desconocidos `glm-5*` siguen resolviéndose por anticipado en la ruta del proveedor integrado
    sintetizando metadatos propios del proveedor a partir de la plantilla `glm-4.7` cuando el id
    coincide con la forma actual de la familia GLM-5.
  </Accordion>

  <Accordion title="Streaming de llamadas a herramientas">
    `tool_stream` está habilitado de forma predeterminada para el streaming de llamadas a herramientas de Z.AI. Para deshabilitarlo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El Plugin integrado de Z.AI registra comprensión de imágenes.

    | Property      | Value       |
    | ------------- | ----------- |
    | Modelo        | `glm-4.6v`  |

    La comprensión de imágenes se resuelve automáticamente a partir de la autenticación configurada de Z.AI; no
    se necesita configuración adicional.

  </Accordion>

  <Accordion title="Detalles de autenticación">
    - Z.AI usa autenticación Bearer con tu clave de API.
    - La opción de onboarding `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente a partir del prefijo de la clave.
    - Usa las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) cuando quieras forzar una superficie específica de la API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Familia de modelos GLM" href="/es/providers/glm" icon="microchip">
    Descripción general de la familia de modelos GLM.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
</CardGroup>
