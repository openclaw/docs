---
read_when:
    - Ves una clave de configuración `.experimental` y quieres saber si es estable
    - Quieres probar funciones preliminares del entorno de ejecución sin confundirlas con los valores predeterminados normales
    - Quieres un único lugar para encontrar las marcas experimentales documentadas actualmente
summary: Qué significan las marcas experimentales en OpenClaw y cuáles están documentadas actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-06-27T11:11:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

Las funciones experimentales en OpenClaw son **superficies de vista previa opcionales**. Están
detrás de marcas explícitas porque aún necesitan recorrido en el mundo real antes de
merecer un valor predeterminado estable o un contrato público de larga duración.

Trátalas de forma distinta a la configuración normal:

- Mantenlas **desactivadas de forma predeterminada** salvo que la documentación relacionada te indique probar una.
- Espera que **la forma y el comportamiento cambien** más rápido que la configuración estable.
- Prefiere primero la ruta estable cuando ya exista una.
- Si estás implementando OpenClaw de forma amplia, prueba las marcas experimentales en un entorno
  más pequeño antes de incorporarlas a una referencia compartida.

## Marcas documentadas actualmente

| Superficie               | Clave                                                                                      | Úsala cuando                                                                                                                      | Más                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime de modelo local  | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend local más pequeño o estricto se atasca con la superficie de herramientas predeterminada completa de OpenClaw           | [Modelos locales](/es/gateway/local-models)                                                       |
| Búsqueda de memoria      | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Quieres que `memory_search` indexe transcripciones de sesiones anteriores y aceptas el coste adicional de almacenamiento/indexado | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Arnés de Codex           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Quieres que el servidor de aplicaciones nativo de Codex 0.132.0 o posterior apunte a un exec-server respaldado por el sandbox de OpenClaw en lugar de desactivar el Modo de código | [Referencia del arnés de Codex](/es/plugins/codex-harness-reference#sandboxed-native-execution)  |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                                                  | Quieres exponer la herramienta estructurada `update_plan` para el seguimiento de trabajo de varios pasos en runtimes e interfaces compatibles | [Referencia de configuración del Gateway](/es/gateway/config-tools#toolsexperimental)            |

## Modo ligero de modelo local

`agents.defaults.experimental.localModelLean: true` es una válvula de alivio para configuraciones de modelos locales más débiles. Cuando está activada, OpenClaw elimina tres herramientas predeterminadas — `browser`, `cron` y `message` — de la superficie de herramientas del agente en cada turno. También hace que esa ejecución use de forma predeterminada controles estructurados de búsqueda de herramientas cuando `tools.toolSearch` no está configurado explícitamente, de modo que los catálogos de herramientas de plugins, MCP o clientes más grandes permanezcan detrás de `tool_search`, `tool_describe` y `tool_call` en lugar de volcarse en el prompt. Las ejecuciones que requieren entrega directa con `message` mantienen esa herramienta directa en lugar de activar el valor predeterminado de búsqueda de herramientas del modo ligero. Usa `agents.list[].experimental.localModelLean` para activar o desactivar el mismo comportamiento en un agente configurado.

### Por qué estas tres herramientas

Estas tres herramientas tienen las descripciones más grandes y la mayor cantidad de formas de parámetros en el runtime predeterminado de OpenClaw. En un backend compatible con OpenAI de contexto pequeño o más estricto, esa es la diferencia entre:

- Esquemas de herramientas que encajan limpiamente en el prompt frente a desplazar el historial de conversación.
- El modelo que elige la herramienta correcta frente a emitir llamadas de herramientas mal formadas porque hay demasiados esquemas de aspecto similar.
- El adaptador de Chat Completions que se mantiene dentro de los límites de salida estructurada del servidor frente a provocar un 400 por el tamaño de la carga útil de llamadas de herramientas.

Eliminarlas no reconfigura OpenClaw silenciosamente; solo acorta la lista de herramientas directas. El modelo todavía tiene disponibles `read`, `write`, `edit`, `exec`, `apply_patch`, búsqueda/obtención web (cuando está configurada), memoria y herramientas de sesión/agente. Los catálogos adicionales siguen siendo invocables mediante la búsqueda de herramientas salvo que establezcas explícitamente `tools.toolSearch: false`.

### Cuándo activarlo

Activa el modo ligero cuando ya hayas comprobado que el modelo puede hablar con el Gateway, pero los turnos completos del agente fallan. La cadena de señales típica es:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` se completa correctamente.
2. Un turno normal del agente falla con llamadas de herramientas mal formadas, prompts demasiado grandes o el modelo ignora sus herramientas.
3. Cambiar `localModelLean: true` elimina el fallo.

### Cuándo dejarlo desactivado

Si tu backend maneja limpiamente el runtime predeterminado completo, deja esto desactivado. El modo ligero es una solución alternativa, no un valor predeterminado. Existe porque algunas pilas locales necesitan una superficie de herramientas más pequeña para comportarse correctamente; los modelos alojados y los equipos locales con buenos recursos no.

El modo ligero tampoco sustituye a `tools.profile`, `tools.allow`/`tools.deny` ni a la vía de escape `compat.supportsTools: false` del modelo. Si necesitas una superficie de herramientas permanentemente más estrecha para un agente específico, prefiere esos controles estables antes que la marca experimental.

Si ya ajustas la búsqueda de herramientas globalmente, OpenClaw deja intacta esa configuración del operador. Establece `tools.toolSearch: false` para excluirte del valor predeterminado de búsqueda de herramientas del modo ligero.

### Activar

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

Reinicia el Gateway después de cambiar la marca y, luego, confirma la lista recortada de herramientas con:

```bash
openclaw status --deep
```

La salida de estado profundo enumera las herramientas activas del agente; `browser`, `cron` y `message` deberían estar ausentes cuando el modo ligero está activado, salvo que el modo de entrega actual fuerce respuestas directas con `message`.

## Experimental no significa oculto

Si una función es experimental, OpenClaw debería decirlo claramente en la documentación y en la
propia ruta de configuración. Lo que **no** debería hacer es introducir comportamiento de vista previa de forma encubierta en un
control predeterminado que parece estable y fingir que eso es normal. Así es como las superficies de
configuración se vuelven desordenadas.

## Relacionado

- [Funciones](/es/concepts/features)
- [Canales de lanzamiento](/es/install/development-channels)
