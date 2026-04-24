---
read_when:
    - Quieres modelos GLM en OpenClaw
    - Necesitas la convención de nombres de modelo y la configuración initial
summary: Resumen de la familia de modelos GLM + cómo usarla en OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-24T05:44:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# Modelos GLM

GLM es una **familia de modelos** (no una empresa) disponible a través de la plataforma Z.AI. En OpenClaw, los modelos GLM
se usan mediante el proveedor `zai` y con ID de modelo como `zai/glm-5`.

## Primeros pasos

<Steps>
  <Step title="Elige una ruta de autenticación y ejecuta la incorporación">
    Elige la opción de incorporación que coincida con tu plan y región de Z.AI:

    | Auth choice | Best for |
    | ----------- | -------- |
    | `zai-api-key` | Configuración genérica con clave API y detección automática de endpoint |
    | `zai-coding-global` | Usuarios del plan Coding (global) |
    | `zai-coding-cn` | Usuarios del plan Coding (región de China) |
    | `zai-global` | API general (global) |
    | `zai-cn` | API general (región de China) |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Establece GLM como modelo predeterminado">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verifica que los modelos estén disponibles">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Ejemplo de configuración

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` permite a OpenClaw detectar la coincidencia del endpoint de Z.AI a partir de la clave y
aplicar automáticamente la `baseUrl` correcta. Usa las opciones regionales explícitas cuando
quieras forzar una superficie concreta del plan Coding o de la API general.
</Tip>

## Catálogo incluido

Actualmente, OpenClaw inicializa el proveedor `zai` incluido con estas referencias GLM:

| Model           | Model            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
La referencia de modelo incluida predeterminada es `zai/glm-5.1`. Las versiones y la disponibilidad de GLM
pueden cambiar; consulta la documentación de Z.AI para ver la información más reciente.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Detección automática de endpoint">
    Cuando usas la opción de autenticación `zai-api-key`, OpenClaw inspecciona el formato de la clave
    para determinar la `baseUrl` correcta de Z.AI. Las opciones regionales explícitas
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) anulan la
    detección automática y fijan el endpoint directamente.
  </Accordion>

  <Accordion title="Detalles del proveedor">
    Los modelos GLM se sirven mediante el proveedor de tiempo de ejecución `zai`. Para ver la configuración completa del proveedor,
    endpoints regionales y capacidades adicionales, consulta
    [Documentación del proveedor Z.AI](/es/providers/zai).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedor Z.AI" href="/es/providers/zai" icon="server">
    Configuración completa del proveedor Z.AI y endpoints regionales.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
</CardGroup>
