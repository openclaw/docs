---
read_when:
    - Ves una clave de configuración `.experimental` y quieres saber si es estable
    - Quieres probar las funciones experimentales del entorno de ejecución sin confundirlas con los valores predeterminados habituales
    - Quieres un único lugar donde encontrar las funciones experimentales documentadas actualmente
summary: Qué significan las opciones experimentales en OpenClaw y cuáles están documentadas actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-07-11T23:02:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Las funciones experimentales son superficies de vista previa voluntarias tras indicadores explícitos. Necesitan más uso en situaciones reales antes de adoptar un valor predeterminado estable o un contrato duradero.

- Están desactivadas de forma predeterminada, salvo que la documentación indique que se habilite alguna.
- Su estructura y comportamiento pueden cambiar más rápido que la configuración estable.
- Prefiera una vía estable cuando ya exista.
- Impleméntelas ampliamente solo después de probarlas primero en un entorno más reducido.

## Indicadores documentados actualmente

| Superficie                       | Clave                                                                                      | Úsela cuando                                                                                                                                    | Más información                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Entorno de ejecución de modelos locales | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend local más pequeño o estricto no puede procesar toda la superficie predeterminada de herramientas de OpenClaw                         | [Modelos locales](/es/gateway/local-models)                                                         |
| Búsqueda en memoria               | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Quiere que `memory_search` indexe transcripciones de sesiones anteriores y acepta el coste adicional de almacenamiento e indexación             | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Entorno de Codex                  | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Quiere que el servidor de aplicaciones nativo de Codex 0.132.0 o posterior utilice un servidor de ejecución respaldado por el entorno aislado de OpenClaw en lugar de deshabilitar el modo de código | [Referencia del entorno de Codex](/es/plugins/codex-harness-reference#sandboxed-native-execution) |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                                                              | Quiere exponer la herramienta estructurada `update_plan` para el seguimiento del trabajo de varios pasos en entornos de ejecución e interfaces compatibles | [Referencia de configuración del Gateway](/es/gateway/config-tools#toolsexperimental)               |

## Modo ligero para modelos locales

`agents.defaults.experimental.localModelLean: true` elimina en cada turno las herramientas opcionales de mayor peso de la superficie directa del agente: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`. Las herramientas permitidas explícitamente o necesarias para la entrega siguen disponibles, aunque la búsqueda de herramientas puede catalogarlas en lugar de exponerlas directamente. Cuando `tools.toolSearch` aún no está establecido, el modo ligero también hace que los catálogos de plugins, MCP y clientes utilicen de forma predeterminada la búsqueda estructurada de herramientas (`tool_search`, `tool_describe`, `tool_call`). Use `agents.list[].experimental.localModelLean` para limitarlo a un solo agente.

Si ya ajusta globalmente la búsqueda de herramientas, OpenClaw no modifica esa configuración. Establezca `tools.toolSearch: false` para no usar el valor predeterminado de búsqueda de herramientas del modo ligero.

En el modo estructurado de `tools`, las ejecuciones ligeras mantienen `exec` visible directamente junto a los controles de búsqueda de herramientas para que los modelos locales optimizados para programación puedan seguir eligiendo su ruta de shell habitual. Esto solo cambia la visibilidad del esquema: se siguen aplicando la política normal de herramientas, el aislamiento y las aprobaciones de ejecución. Los modos explícitos `code` y `directory` conservan su comportamiento normal de Compaction.

### Por qué estas herramientas

Estas herramientas tienen las descripciones más extensas, las estructuras de parámetros más amplias o la mayor probabilidad de distraer a un modelo pequeño de la ruta normal de programación y conversación. En un backend con poco contexto o compatible con OpenAI más estricto, esto supone la diferencia entre:

- Que los esquemas de herramientas quepan en el prompt o desplacen el historial de conversación.
- Que el modelo elija la herramienta correcta o emita llamadas de herramientas mal formadas debido a demasiados esquemas similares.
- Que el adaptador de finalizaciones de chat se mantenga dentro de los límites de salida estructurada o se produzca un error 400 por el tamaño de la carga útil de la llamada a herramientas.

Eliminarlas solo acorta la lista directa de herramientas. El modelo sigue disponiendo de `read`, `write`, `edit`, `exec`, `apply_patch`, comprensión de imágenes, búsqueda y obtención de contenido web (cuando están configuradas), memoria y herramientas de sesión y agente. Se puede seguir accediendo a catálogos adicionales mediante la búsqueda de herramientas, salvo que establezca `tools.toolSearch: false`; las autorizaciones explícitas de herramientas permiten que un agente ligero vuelva a incorporar un flujo de trabajo reducido.

### Cuándo activarlo

Habilite el modo ligero cuando haya comprobado que el modelo puede comunicarse con el Gateway, pero los turnos completos del agente funcionan incorrectamente:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` se ejecuta correctamente.
2. Un turno normal del agente falla con llamadas de herramientas mal formadas, prompts demasiado grandes o porque el modelo ignora sus herramientas.
3. Activar `localModelLean: true` elimina el fallo.

### Cuándo dejarlo desactivado

Si su backend gestiona correctamente el entorno de ejecución predeterminado completo, déjelo desactivado. Es una solución alternativa para entornos locales que necesitan una superficie de herramientas más pequeña, no un valor predeterminado para modelos alojados ni equipos locales con recursos suficientes.

El modo ligero no sustituye a `tools.profile`, `tools.allow`/`tools.deny` ni al mecanismo de escape `compat.supportsTools: false` del modelo. Para obtener una superficie de herramientas permanentemente más reducida en un agente específico, prefiera esas opciones estables.

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

Reinicie el Gateway después de cambiar el indicador. El filtrado ligero elimina `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`, salvo que los conserve explícitamente con `tools.allow` o `tools.alsoAllow`; la búsqueda de herramientas puede seguir catalogando las herramientas conservadas en lugar de exponerlas directamente.

## Experimental no significa oculto

Una función experimental debe indicarlo claramente en la documentación y en la propia ruta de configuración, no ocultarse tras una opción predeterminada que parezca estable.

## Relacionado

- [Funciones](/es/concepts/features)
- [Canales de versiones](/es/install/development-channels)
