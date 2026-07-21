---
read_when:
    - Ve una clave de configuración `.experimental` y quiere saber si es estable
    - Se desea probar funciones preliminares del entorno de ejecución sin confundirlas con los valores predeterminados normales
    - Quiere un único lugar donde encontrar las opciones experimentales documentadas actualmente
summary: Qué significan los indicadores experimentales en OpenClaw y cuáles están documentados actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-07-21T08:59:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ba3a3e13b308c572b02076e131143845d4ad4c2a28847aabec1496012e29a6f7
    source_path: concepts/experimental-features.md
    workflow: 16
---

Las funciones experimentales son superficies en vista previa tras indicadores explícitos. Necesitan más experiencia de uso en condiciones reales antes de adoptar un valor predeterminado estable o un contrato duradero.

- Desactivadas de forma predeterminada, salvo que un documento describa una regla limitada de configuración automática.
- La forma y el comportamiento pueden cambiar más rápidamente que la configuración estable.
- Se debe preferir una vía estable cuando ya exista una.
- Solo deben implementarse de forma generalizada después de probarlas primero en un entorno más pequeño.

## Indicadores documentados actualmente

| Superficie                  | Clave                                                                                        | Cuándo usarla                                                                                                                       | Más información                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Entorno de ejecución de modelos locales      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend local más pequeño o estricto no puede procesar toda la superficie de herramientas predeterminada de OpenClaw                                                | [Modelos locales](/es/gateway/local-models)                                                         |
| Búsqueda en memoria            | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Se desea que `memory_search` indexe las transcripciones de sesiones anteriores y se acepta el coste adicional de almacenamiento e indexación                            | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Entorno de Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Se desea que el servidor de aplicaciones nativo de Codex 0.132.0 o posterior use como destino un servidor de ejecución respaldado por el entorno aislado de OpenClaw, en lugar de desactivar el modo de código | [Referencia del entorno de Codex](/es/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                                                              | Se desea exponer la herramienta estructurada `update_plan` para realizar un seguimiento del trabajo de varios pasos en entornos de ejecución e interfaces de usuario compatibles                    | [Referencia de configuración del Gateway](/es/gateway/config-tools#toolsexperimental)                    |
| Modo de código                | `tools.codeMode.enabled`                                                                   | Se desea acceso compacto y orquestado mediante código a un catálogo oculto de herramientas de OpenClaw                                                       | [Modo de código](/es/tools/code-mode)                                                                 |
| Swarm                    | `tools.swarm.enabled`                                                                      | Se desea que los scripts del modo de código orquesten en paralelo grupos limitados de subagentes                                                | [Swarm](/es/tools/swarm)                                                                         |

## Labs de Control UI

Abra **Settings → Agents & Tools → Labs** para gestionar los experimentos que tienen un
interruptor en Control UI. Al activar o desactivar un laboratorio, se modifica de inmediato la configuración
canónica del Gateway; la página solo muestra una indicación de reinicio cuando una función lo requiere.

El modo de código y Swarm son las entradas de Labs incluidas actualmente. Ambos interruptores
escriben claves de configuración validadas existentes y, por lo general, surten efecto en futuras ejecuciones
de agentes sin reiniciar el Gateway.

## Modo ligero para modelos locales

`agents.defaults.experimental.localModelLean: true` elimina en cada turno las herramientas opcionales pesadas de la superficie directa del agente: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`. Las herramientas permitidas explícitamente o necesarias para la entrega siguen disponibles, aunque Tool Search puede catalogarlas en lugar de exponerlas directamente. El modo ligero también configura de forma predeterminada los catálogos de plugins/MCP/clientes para usar Tool Search estructurado (`tool_search`, `tool_describe`, `tool_call`) cuando `tools.toolSearch` aún no está establecido. Use `agents.list[].experimental.localModelLean` para limitarlo a un agente.

Durante la incorporación, una ruta de inferencia `ollama` o `lmstudio` verificada establece automáticamente `agents.defaults.experimental.localModelLean: true` cuando ese valor no existe. OpenClaw registra que el ajuste procede de la incorporación, por lo que una ruta no local verificada posteriormente solo elimina el ajuste automático. Se conserva un valor de `true` o `false` configurado explícitamente. Otros proveedores autoalojados y compatibles con OpenAI no se infieren a partir de nombres de modelos ni URL.

Si Tool Search ya está ajustado globalmente, OpenClaw no modifica esa configuración. Establezca `tools.toolSearch: false` para rechazar el valor predeterminado de Tool Search del modo ligero.

En el modo estructurado `tools`, las ejecuciones ligeras mantienen `exec` directamente visible junto a los controles de Tool Search para que los modelos locales optimizados para programación puedan seguir eligiendo su ruta de shell habitual. Esto solo modifica la visibilidad del esquema: se siguen aplicando la política normal de herramientas, el aislamiento y las aprobaciones de ejecución. Los modos explícitos `code` y `directory` mantienen su comportamiento normal de Compaction.

### Por qué estas herramientas

Estas herramientas tienen las descripciones más extensas, las formas de parámetros más amplias o la mayor probabilidad de distraer a un modelo pequeño de la ruta normal de programación y conversación. En un backend de contexto reducido o más estricto compatible con OpenAI, esta es la diferencia entre:

- Que los esquemas de herramientas quepan en el prompt o desplacen el historial de conversación.
- Que el modelo elija la herramienta correcta o emita llamadas de herramientas mal formadas debido a un exceso de esquemas similares.
- Que el adaptador de Chat Completions se mantenga dentro de los límites de salida estructurada o se produzca un error 400 por el tamaño de la carga útil de la llamada de herramientas.

Eliminarlas solo acorta la lista directa de herramientas. El modelo sigue disponiendo de `read`, `write`, `edit`, `exec`, `apply_patch`, comprensión de imágenes, búsqueda/obtención web (cuando está configurada), memoria y herramientas de sesión/agente. Los catálogos adicionales siguen accesibles mediante Tool Search, salvo que se establezca `tools.toolSearch: false`; las autorizaciones explícitas de herramientas pueden volver a incluir un agente ligero en un flujo de trabajo reducido.

### Cuándo activarlo

Active el modo ligero una vez que se haya demostrado que el modelo puede comunicarse con el Gateway, pero que los turnos completos del agente presentan problemas:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` se completa correctamente.
2. Un turno normal del agente falla con llamadas de herramientas mal formadas, prompts demasiado grandes o porque el modelo ignora sus herramientas.
3. Cambiar `localModelLean: true` elimina el fallo.

### Cuándo dejarlo desactivado

Si el backend gestiona correctamente el entorno de ejecución predeterminado completo, deje esta opción desactivada. Es una solución alternativa para pilas locales que necesitan una superficie de herramientas más pequeña, no un valor predeterminado para modelos alojados ni equipos locales con suficientes recursos.

El modo ligero no sustituye a `tools.profile`, `tools.allow`/`tools.deny` ni al mecanismo alternativo `compat.supportsTools: false` del modelo. Para disponer permanentemente de una superficie de herramientas más limitada en un agente específico, se deben preferir esos controles estables.

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

Reinicie el Gateway después de cambiar el indicador. El filtrado ligero elimina `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`, salvo que se conserven explícitamente mediante `tools.allow` o `tools.alsoAllow`; Tool Search puede seguir catalogando las herramientas conservadas en lugar de exponerlas directamente.

## Experimental no significa oculto

Una función experimental debe indicarlo claramente en la documentación y en la propia ruta de configuración, sin ocultarse tras un control predeterminado que parezca estable.

## Temas relacionados

- [Funciones](/es/concepts/features)
- [Canales de lanzamiento](/es/install/development-channels)
