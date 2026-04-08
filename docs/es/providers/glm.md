---
read_when:
    - Quieres modelos GLM en OpenClaw
    - Necesitas la convención de nombres de modelos y la configuración
summary: Resumen de la familia de modelos GLM + cómo usarla en OpenClaw
title: Modelos GLM
x-i18n:
    generated_at: "2026-04-08T05:02:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a55acfa139847b4b85dbc09f1068cbd2febb1e49f984a23ea9e3b43bc910eb
    source_path: providers/glm.md
    workflow: 15
---

# Modelos GLM

GLM es una **familia de modelos** (no una empresa) disponible a través de la plataforma Z.AI. En OpenClaw, a los modelos GLM
se accede mediante el proveedor `zai` y con identificadores de modelo como `zai/glm-5`.

## Configuración de la CLI

```bash
# Configuración genérica de clave de API con detección automática del endpoint
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, recomendado para usuarios de Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (región de China), recomendado para usuarios de Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# API general
openclaw onboard --auth-choice zai-global

# API general CN (región de China)
openclaw onboard --auth-choice zai-cn
```

## Fragmento de configuración

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

`zai-api-key` permite que OpenClaw detecte el endpoint de Z.AI correspondiente a partir de la clave y
aplique automáticamente la URL base correcta. Usa las opciones regionales explícitas cuando
quieras forzar un Coding Plan específico o una superficie de API general específica.

## Modelos GLM empaquetados actuales

Actualmente, OpenClaw inicializa el proveedor `zai` empaquetado con estas referencias GLM:

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## Notas

- Las versiones de GLM y su disponibilidad pueden cambiar; consulta la documentación de Z.AI para ver la información más reciente.
- La referencia del modelo empaquetado predeterminada es `zai/glm-5.1`.
- Para más detalles del proveedor, consulta [/providers/zai](/es/providers/zai).
