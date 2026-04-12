---
read_when:
    - Quieres modelos GLM en OpenClaw
    - Necesitas la convención de nombres de modelos y la configuración
summary: Resumen de la familia de modelos GLM + cómo usarla en OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-12T23:31:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b38f0896c900fae3cf3458ff99938d73fa46973a057d1dd373ae960cb7d2e9b5
    source_path: providers/glm.md
    workflow: 15
---

# Modelos GLM

GLM es una **familia de modelos** (no una empresa) disponible a través de la plataforma Z.AI. En OpenClaw, los modelos GLM se usan mediante el proveedor `zai` y IDs de modelo como `zai/glm-5`.

## Primeros pasos

<Steps>
  <Step title="Choose an auth route and run onboarding">
    Elige la opción de onboarding que coincida con tu plan y región de Z.AI:

    | Auth choice | Ideal para |
    | ----------- | ---------- |
    | `zai-api-key` | Configuración genérica con clave de API y detección automática del endpoint |
    | `zai-coding-global` | Usuarios del Coding Plan (global) |
    | `zai-coding-cn` | Usuarios del Coding Plan (región de China) |
    | `zai-global` | API general (global) |
    | `zai-cn` | API general (región de China) |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Set GLM as the default model">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verify models are available">
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
`zai-api-key` permite que OpenClaw detecte el endpoint de Z.AI correspondiente a partir de la clave y aplique automáticamente la URL base correcta. Usa las opciones regionales explícitas cuando quieras forzar una superficie específica de Coding Plan o de API general.
</Tip>

## Modelos GLM incluidos

OpenClaw actualmente inicializa el proveedor `zai` incluido con estas refs de GLM:

| Modelo          | Modelo           |
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
La ref de modelo incluida predeterminada es `zai/glm-5.1`. Las versiones y la disponibilidad de GLM pueden cambiar; consulta la documentación de Z.AI para ver la información más reciente.
</Note>

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Endpoint auto-detection">
    Cuando usas la opción de autenticación `zai-api-key`, OpenClaw inspecciona el formato de la clave para determinar la URL base correcta de Z.AI. Las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) sustituyen la detección automática y fijan el endpoint directamente.
  </Accordion>

  <Accordion title="Provider details">
    Los modelos GLM se sirven mediante el proveedor de runtime `zai`. Para ver la configuración completa del proveedor, los endpoints regionales y capacidades adicionales, consulta la [documentación del proveedor Z.AI](/es/providers/zai).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Z.AI provider" href="/es/providers/zai" icon="server">
    Configuración completa del proveedor Z.AI y endpoints regionales.
  </Card>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Cómo elegir proveedores, refs de modelos y comportamiento de failover.
  </Card>
</CardGroup>
