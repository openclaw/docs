---
read_when:
    - Ves una clave de configuración `.experimental` y quieres saber si es estable
    - Quieres probar funciones preliminares del runtime sin confundirlas con los valores predeterminados normales
    - Quieres un único lugar donde encontrar las opciones experimentales documentadas actualmente
summary: Qué significan las opciones experimentales en OpenClaw y cuáles están documentadas actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-07-05T11:11:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 428c9519a5252941657a0d961506229a1a8b4077ab4553e7727d1ab6a13da62b
    source_path: concepts/experimental-features.md
    workflow: 16
---

Las funciones experimentales son superficies de vista previa opcionales detrás de flags explícitos. Necesitan más uso en el mundo real antes de obtener un valor predeterminado estable o un contrato duradero.

- Desactivadas de forma predeterminada, a menos que una documentación te indique habilitar una.
- La forma y el comportamiento pueden cambiar más rápido que la configuración estable.
- Prefiere una ruta estable cuando ya exista una.
- Despliega de forma amplia solo después de probar primero en un entorno más pequeño.

## Flags documentados actualmente

| Superficie               | Clave                                                                                      | Úsalo cuando                                                                                                                       | Más                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime de modelo local  | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend local más pequeño o estricto se atasca con la superficie completa de herramientas predeterminadas de OpenClaw           | [Modelos locales](/es/gateway/local-models)                                                       |
| Búsqueda de memoria      | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Quieres que `memory_search` indexe transcripciones de sesiones anteriores y aceptas el costo adicional de almacenamiento/indexado  | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Arnés de Codex           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Quieres que el servidor de app nativo de Codex 0.132.0 o más reciente apunte a un exec-server respaldado por sandbox de OpenClaw en lugar de desactivar Code Mode | [Referencia del arnés de Codex](/es/plugins/codex-harness-reference#sandboxed-native-execution)   |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                                                | Quieres exponer la herramienta estructurada `update_plan` para el seguimiento de trabajo de varios pasos en runtimes e interfaces de usuario compatibles | [Referencia de configuración de Gateway](/es/gateway/config-tools#toolsexperimental)              |

## Modo ligero de modelo local

`agents.defaults.experimental.localModelLean: true` elimina tres herramientas predeterminadas - `browser`, `cron` y `message` - de la superficie de herramientas del agente en cada turno. También usa de forma predeterminada Tool Search estructurado (`tool_search`, `tool_describe`, `tool_call`) para catálogos de herramientas de Plugin/MCP/cliente cuando `tools.toolSearch` aún no está configurado, de modo que esos catálogos queden fuera del prompt en lugar de volcarse allí. Las ejecuciones que requieren entrega directa de `message` la mantienen directa en lugar de adoptar el valor predeterminado de Tool Search del modo ligero. Usa `agents.list[].experimental.localModelLean` para limitar esto a un agente.

Si ya ajustas Tool Search de forma global, OpenClaw deja esa configuración intacta. Configura `tools.toolSearch: false` para excluirte del valor predeterminado de Tool Search del modo ligero.

### Por qué estas tres herramientas

`browser`, `cron` y `message` tienen las descripciones más grandes y la mayor cantidad de formas de parámetros en el runtime predeterminado. En un backend compatible con OpenAI de contexto pequeño o más estricto, esa es la diferencia entre:

- Esquemas de herramientas que caben en el prompt frente a esquemas que desplazan el historial de conversación.
- El modelo eligiendo la herramienta correcta frente a emitir llamadas de herramientas mal formadas por tener demasiados esquemas similares.
- El adaptador de Chat Completions manteniéndose dentro de los límites de salida estructurada frente a un 400 por tamaño de payload de llamada de herramienta.

Eliminarlas solo acorta la lista directa de herramientas. El modelo aún tiene `read`, `write`, `edit`, `exec`, `apply_patch`, búsqueda/captura web (cuando está configurada), memoria y herramientas de sesión/agente. Los catálogos adicionales siguen estando disponibles mediante Tool Search, a menos que configures `tools.toolSearch: false`.

### Cuándo activarlo

Habilita el modo ligero una vez que hayas comprobado que el modelo puede hablar con Gateway, pero los turnos completos del agente se comportan mal:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` se completa correctamente.
2. Un turno normal del agente falla con llamadas de herramientas mal formadas, prompts sobredimensionados o el modelo ignorando sus herramientas.
3. Cambiar `localModelLean: true` resuelve el fallo.

### Cuándo dejarlo desactivado

Si tu backend maneja limpiamente el runtime predeterminado completo, déjalo desactivado. Es una solución alternativa para stacks locales que necesitan una superficie de herramientas más pequeña, no un valor predeterminado para modelos alojados o equipos locales con buenos recursos.

El modo ligero no reemplaza `tools.profile`, `tools.allow`/`tools.deny` ni la vía de escape `compat.supportsTools: false` del modelo. Para una superficie de herramientas permanentemente más estrecha en un agente específico, prefiere esos controles estables.

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

Reinicia Gateway después de cambiar el flag.

## Experimental no significa oculto

Una función experimental debe indicarlo claramente en la documentación y en la propia ruta de configuración, no esconderse detrás de un control predeterminado que parezca estable.

## Relacionado

- [Funciones](/es/concepts/features)
- [Canales de lanzamiento](/es/install/development-channels)
