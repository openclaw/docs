---
read_when:
    - Ves una clave de configuración ``.experimental`` y quieres saber si es estable
    - Quieres probar funciones de runtime en vista previa sin confundirlas con los valores predeterminados normales
    - Quieres un lugar único para encontrar las flags experimentales documentadas actualmente
summary: Qué significan las flags experimentales en OpenClaw y cuáles están documentadas actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-04-24T05:25:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

Las funciones experimentales en OpenClaw son **superficies de vista previa de activación opcional**. Están
detrás de flags explícitas porque todavía necesitan uso real antes de que
merezcan un valor predeterminado estable o un contrato público duradero.

Trátalas de forma distinta a la configuración normal:

- Mantenlas **desactivadas de forma predeterminada** a menos que la documentación relacionada te indique probar alguna.
- Espera que la **forma y el comportamiento cambien** más rápido que la configuración estable.
- Prefiere primero la ruta estable cuando ya exista una.
- Si vas a desplegar OpenClaw ampliamente, prueba las flags experimentales en un entorno
  más pequeño antes de incorporarlas a una base compartida.

## Flags documentadas actualmente

| Superficie               | Clave                                                     | Úsala cuando                                                                                                   | Más información                                                                               |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime de modelo local  | `agents.defaults.experimental.localModelLean`             | Un backend local más pequeño o más estricto se ahoga con toda la superficie de herramientas predeterminada de OpenClaw | [Modelos locales](/es/gateway/local-models)                                                      |
| Búsqueda en memoria      | `agents.defaults.memorySearch.experimental.sessionMemory` | Quieres que `memory_search` indexe transcripciones de sesiones anteriores y aceptas el costo adicional de almacenamiento/indexación | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                             | Quieres que la herramienta estructurada `update_plan` esté expuesta para el seguimiento de trabajo de varios pasos en runtimes e interfaces compatibles | [Referencia de configuración del Gateway](/es/gateway/config-tools#toolsexperimental)            |

## Modo lean para modelos locales

`agents.defaults.experimental.localModelLean: true` es una válvula de alivio
para configuraciones más débiles de modelos locales. Recorta herramientas
predeterminadas pesadas como `browser`, `cron` y `message` para que la forma del prompt sea más pequeña y menos frágil
en backends compatibles con OpenAI con contexto pequeño o más estrictos.

Esto intencionalmente **no** es la ruta normal. Si tu backend maneja el runtime
completo sin problemas, déjalo desactivado.

## Experimental no significa oculto

Si una función es experimental, OpenClaw debe decirlo claramente en la documentación y en la
propia ruta de configuración. Lo que **no** debe hacer es introducir comportamiento de vista previa en una
opción predeterminada con apariencia estable y fingir que eso es normal. Así es como las
superficies de configuración se vuelven desordenadas.

## Relacionado

- [Funciones](/es/concepts/features)
- [Canales de lanzamiento](/es/install/development-channels)
