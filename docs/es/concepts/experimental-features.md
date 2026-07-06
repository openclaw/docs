---
read_when:
    - Ves una clave de configuración `.experimental` y quieres saber si es estable
    - Quieres probar funciones de entorno de ejecución en vista previa sin confundirlas con los valores predeterminados normales
    - Quieres un solo lugar para encontrar las marcas experimentales documentadas actualmente
summary: Qué significan las marcas experimentales en OpenClaw y cuáles están documentadas actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-07-06T10:48:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ac12f9e754afd369a1be0853f8023e479fe51777aa42b73f6245223f07053152
    source_path: concepts/experimental-features.md
    workflow: 16
---

Las funciones experimentales son superficies de vista previa optativas detrás de flags explícitas. Necesitan más uso en el mundo real antes de obtener un valor predeterminado estable o un contrato de larga duración.

- Desactivadas de forma predeterminada salvo que una documentación te indique habilitar una.
- La forma y el comportamiento pueden cambiar más rápido que la configuración estable.
- Prefiere una ruta estable cuando ya exista una.
- Despliégalas de forma amplia solo después de probarlas primero en un entorno más pequeño.

## Flags documentadas actualmente

| Superficie               | Clave                                                                                      | Úsala cuando                                                                                                                          | Más                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Runtime de modelo local  | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend local más pequeño o más estricto se atasca con toda la superficie de herramientas predeterminada de OpenClaw               | [Modelos locales](/es/gateway/local-models)                                                         |
| Búsqueda de memoria      | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Quieres que `memory_search` indexe transcripciones de sesiones anteriores y aceptas el coste adicional de almacenamiento/indexación    | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Arnés de Codex           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Quieres que el servidor de aplicación nativo de Codex 0.132.0 o posterior apunte a un servidor de ejecución respaldado por sandbox de OpenClaw en lugar de desactivar el Modo Código | [Referencia del arnés de Codex](/es/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                                                              | Quieres exponer la herramienta estructurada `update_plan` para el seguimiento de trabajo de varios pasos en runtimes e interfaces de usuario compatibles | [Referencia de configuración del Gateway](/es/gateway/config-tools#toolsexperimental)                    |

## Modo ligero para modelo local

`agents.defaults.experimental.localModelLean: true` elimina las herramientas opcionales pesadas de la superficie directa del agente en cada turno: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`. Las herramientas permitidas explícitamente o requeridas para la entrega siguen disponibles, aunque la Búsqueda de herramientas puede catalogarlas en lugar de exponerlas directamente. El modo ligero también establece de forma predeterminada los catálogos de plugins/MCP/clientes en Búsqueda de herramientas estructurada (`tool_search`, `tool_describe`, `tool_call`) cuando `tools.toolSearch` aún no está configurado. Usa `agents.list[].experimental.localModelLean` para limitar esto a un agente.

Si ya ajustas la Búsqueda de herramientas de forma global, OpenClaw deja esa configuración intacta. Establece `tools.toolSearch: false` para optar por no usar el valor predeterminado de Búsqueda de herramientas del modo ligero.

### Por qué estas herramientas

Estas herramientas tienen las descripciones más grandes, las formas de parámetros más amplias o la mayor probabilidad de distraer a un modelo pequeño de la ruta normal de programación y conversación. En un backend compatible con OpenAI de contexto pequeño o más estricto, esa es la diferencia entre:

- Que los esquemas de herramientas quepan en el prompt frente a que desplacen el historial de conversación.
- Que el modelo elija la herramienta correcta frente a que emita llamadas a herramientas mal formadas por demasiados esquemas similares.
- Que el adaptador de Chat Completions permanezca dentro de los límites de salida estructurada frente a recibir un 400 por el tamaño de la carga útil de llamadas a herramientas.

Eliminarlas solo acorta la lista directa de herramientas. El modelo aún tiene `read`, `write`, `edit`, `exec`, `apply_patch`, comprensión de imágenes, búsqueda/obtención web (cuando está configurada), memoria y herramientas de sesión/agente. Los catálogos adicionales siguen disponibles mediante la Búsqueda de herramientas salvo que establezcas `tools.toolSearch: false`; las herramientas permitidas explícitamente pueden volver a incorporar a un agente ligero en un flujo de trabajo recortado.

### Cuándo activarlo

Habilita el modo ligero una vez que hayas demostrado que el modelo puede hablar con el Gateway, pero los turnos completos del agente se comportan mal:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` se completa correctamente.
2. Un turno normal del agente falla con llamadas a herramientas mal formadas, prompts demasiado grandes o el modelo ignora sus herramientas.
3. Cambiar `localModelLean: true` elimina el fallo.

### Cuándo dejarlo desactivado

Si tu backend maneja limpiamente todo el runtime predeterminado, deja esto desactivado. Es una solución alternativa para pilas locales que necesitan una superficie de herramientas más pequeña, no un valor predeterminado para modelos alojados o equipos locales con buenos recursos.

El modo ligero no reemplaza `tools.profile`, `tools.allow`/`tools.deny` ni la vía de escape `compat.supportsTools: false` del modelo. Para una superficie de herramientas más estrecha de forma permanente en un agente específico, prefiere esos controles estables.

### Habilitar

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Solo para un agente:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Reinicia el Gateway después de cambiar la flag. El filtrado ligero elimina `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf` salvo que las conserves explícitamente con `tools.allow` o `tools.alsoAllow`; la Búsqueda de herramientas aún puede catalogar herramientas conservadas en lugar de exponerlas directamente.

## Experimental no significa oculto

Una función experimental debe indicarlo claramente en la documentación y en la propia ruta de configuración, no ocultarse detrás de un control predeterminado que parece estable.

## Relacionado

- [Funciones](/es/concepts/features)
- [Canales de lanzamiento](/es/install/development-channels)
