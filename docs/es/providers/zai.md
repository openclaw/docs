---
read_when:
    - Quieres Z.AI / modelos GLM en OpenClaw
    - Necesitas una configuración sencilla de ZAI_API_KEY
summary: Usa Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-08T05:02:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66cbd9813ee28d202dcae34debab1b0cf9927793acb00743c1c62b48d9e381f9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI es la plataforma de API para los modelos **GLM**. Proporciona API REST para GLM y usa claves de API
para la autenticación. Crea tu clave de API en la consola de Z.AI. OpenClaw usa el proveedor `zai`
con una clave de API de Z.AI.

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

## Catálogo GLM empaquetado

Actualmente, OpenClaw inicializa el proveedor `zai` empaquetado con:

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

- Los modelos GLM están disponibles como `zai/<model>` (ejemplo: `zai/glm-5`).
- La referencia del modelo empaquetado predeterminada es `zai/glm-5.1`
- Los identificadores `glm-5*` desconocidos siguen resolviéndose en la ruta del proveedor empaquetado mediante
  la síntesis de metadatos propiedad del proveedor a partir de la plantilla `glm-4.7` cuando el identificador
  coincide con la forma actual de la familia GLM-5.
- `tool_stream` está habilitado de forma predeterminada para el streaming de llamadas a herramientas de Z.AI. Establece
  `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para deshabilitarlo.
- Consulta [/providers/glm](/es/providers/glm) para ver el resumen de la familia de modelos.
- Z.AI usa autenticación Bearer con tu clave de API.
