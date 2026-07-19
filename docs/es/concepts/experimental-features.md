---
read_when:
    - Ve una clave de configuración `.experimental` y quiere saber si es estable
    - Quieres probar funciones preliminares del entorno de ejecución sin confundirlas con los valores predeterminados habituales
    - Se necesita un único lugar donde encontrar las opciones experimentales documentadas actualmente
summary: Qué significan las opciones experimentales en OpenClaw y cuáles están documentadas actualmente
title: Características experimentales
x-i18n:
    generated_at: "2026-07-19T01:55:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c25e5120b0c602c2d143e54f124b760208a08ddfed3d515f73de2b2fd2640d9d
    source_path: concepts/experimental-features.md
    workflow: 16
---

Las funciones experimentales son superficies preliminares tras indicadores explícitos. Necesitan más experiencia de uso en el mundo real antes de adoptar un valor predeterminado estable o un contrato duradero.

- Desactivadas de forma predeterminada, salvo que un documento describa una regla limitada de configuración automática.
- Su estructura y comportamiento pueden cambiar más rápido que los de la configuración estable.
- Es preferible usar una vía estable cuando ya exista.
- Solo deben implementarse de forma generalizada después de probarlas primero en un entorno más pequeño.

## Indicadores documentados actualmente

| Superficie               | Clave                                                                                      | Úsela cuando                                                                                                                      | Más información                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Entorno de ejecución de modelos locales | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend local más pequeño o estricto no puede procesar toda la superficie de herramientas predeterminada de OpenClaw           | [Modelos locales](/es/gateway/local-models)                                                       |
| Búsqueda en memoria      | `agents.defaults.memorySearch.experimental.sessionMemory`                                                                         | Se desea que `memory_search` indexe las transcripciones de sesiones anteriores y se acepta el coste adicional de almacenamiento e indexación | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Arnés de Codex           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                                                                         | Se desea que el servidor de aplicaciones nativo de Codex 0.132.0 o posterior utilice un servidor de ejecución respaldado por el entorno aislado de OpenClaw en lugar de desactivar el modo de código | [Referencia del arnés de Codex](/es/plugins/codex-harness-reference#sandboxed-native-execution) |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                                                             | Se desea exponer la herramienta estructurada `update_plan` para realizar el seguimiento de trabajos de varios pasos en entornos de ejecución e interfaces compatibles | [Referencia de configuración del Gateway](/es/gateway/config-tools#toolsexperimental) |
| Modo de código           | `tools.codeMode.enabled`                                                                         | Se desea un acceso compacto, orquestado mediante código, a un catálogo oculto de herramientas de OpenClaw                         | [Modo de código](/es/tools/code-mode)                                                             |

## Laboratorios de la interfaz de control

Abra **Settings → Agents & Tools → Labs** para gestionar los experimentos que tienen un
interruptor en la interfaz de control. Al activar o desactivar un laboratorio, se modifica
inmediatamente la configuración canónica del Gateway; la página solo muestra una indicación
de reinicio cuando una función lo requiere.

El modo de código es actualmente la única entrada de Labs publicada. Swarm todavía no está disponible:
su estructura de configuración no se ha publicado, por lo que la interfaz de control no escribe una
clave especulativa que invalidaría la configuración del operador.

## Modo ligero para modelos locales

`agents.defaults.experimental.localModelLean: true` elimina en cada turno las herramientas opcionales pesadas de la superficie directa del agente: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`. Las herramientas permitidas explícitamente o necesarias para la entrega siguen disponibles, aunque la búsqueda de herramientas puede catalogarlas en lugar de exponerlas directamente. El modo ligero también establece de forma predeterminada los catálogos de plugins/MCP/clientes en la búsqueda estructurada de herramientas (`tool_search`, `tool_describe`, `tool_call`) cuando `tools.toolSearch` aún no está establecido. Use `agents.list[].experimental.localModelLean` para limitarlo a un solo agente.

Durante la incorporación, una ruta de inferencia `ollama` o `lmstudio` verificada establece automáticamente `agents.defaults.experimental.localModelLean: true` cuando ese valor no está presente. OpenClaw registra que el ajuste procede de la incorporación, por lo que una ruta no local verificada posteriormente solo elimina el ajuste automático. Se conserva cualquier `true` o `false` configurado explícitamente. Los demás proveedores autoalojados y compatibles con OpenAI no se deducen a partir de nombres de modelos ni de URL.

Si la búsqueda de herramientas ya está ajustada globalmente, OpenClaw no modifica esa configuración. Establezca `tools.toolSearch: false` para excluirse del valor predeterminado de la búsqueda de herramientas del modo ligero.

En el modo estructurado `tools`, las ejecuciones ligeras mantienen `exec` visible directamente junto a los controles de búsqueda de herramientas, de modo que los modelos locales optimizados para programación puedan seguir eligiendo su vía habitual de shell. Esto solo cambia la visibilidad del esquema: se siguen aplicando la política normal de herramientas, el aislamiento y las aprobaciones de ejecución. Los modos explícitos `code` y `directory` mantienen su comportamiento normal de Compaction.

### Por qué se eligen estas herramientas

Estas herramientas tienen las descripciones más extensas, las estructuras de parámetros más amplias o la mayor probabilidad de distraer a un modelo pequeño de la vía normal de programación y conversación. En un backend compatible con OpenAI con poco contexto o más estricto, esto marca la diferencia entre:

- Que los esquemas de herramientas quepan en el prompt o desplacen el historial de conversación.
- Que el modelo elija la herramienta correcta o emita llamadas de herramientas con formato incorrecto debido a un exceso de esquemas similares.
- Que el adaptador de finalizaciones de chat se mantenga dentro de los límites de salida estructurada o devuelva un error 400 por el tamaño de la carga útil de llamadas de herramientas.

Eliminarlas solo acorta la lista directa de herramientas. El modelo sigue disponiendo de `read`, `write`, `edit`, `exec`, `apply_patch`, comprensión de imágenes, búsqueda/obtención web (cuando está configurada), memoria y herramientas de sesión/agente. Los catálogos adicionales siguen siendo accesibles mediante la búsqueda de herramientas, salvo que se establezca `tools.toolSearch: false`; los permisos explícitos de herramientas pueden volver a incluir un agente ligero en un flujo de trabajo reducido.

### Cuándo activarlo

Active el modo ligero una vez que se haya comprobado que el modelo puede comunicarse con el Gateway, pero los turnos completos del agente funcionen incorrectamente:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` se ejecuta correctamente.
2. Un turno normal del agente falla debido a llamadas de herramientas con formato incorrecto, prompts demasiado grandes o porque el modelo ignora sus herramientas.
3. Alternar `localModelLean: true` elimina el fallo.

### Cuándo dejarlo desactivado

Si el backend gestiona correctamente todo el entorno de ejecución predeterminado, deje esta opción desactivada. Es una solución alternativa para pilas locales que necesitan una superficie de herramientas más pequeña, no un valor predeterminado para modelos alojados ni para equipos locales con recursos suficientes.

El modo ligero no sustituye a `tools.profile`, `tools.allow`/`tools.deny` ni a la vía de escape `compat.supportsTools: false` del modelo. Para obtener una superficie de herramientas permanentemente más reducida en un agente específico, es preferible usar esos controles estables.

### Activación

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

Reinicie el Gateway después de cambiar el indicador. El filtrado ligero elimina `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`, salvo que se conserven explícitamente mediante `tools.allow` o `tools.alsoAllow`; la búsqueda de herramientas aún puede catalogar las herramientas conservadas en lugar de exponerlas directamente.

## Experimental no significa oculto

Una función experimental debe indicarlo claramente en la documentación y en la propia ruta de configuración, en lugar de ocultarse tras un control predeterminado que parezca estable.

## Contenido relacionado

- [Funciones](/es/concepts/features)
- [Canales de publicación](/es/install/development-channels)
