---
read_when:
    - Ves una clave de configuración `.experimental` y quieres saber si es estable
    - Quieres probar funciones preliminares del entorno de ejecución sin confundirlas con los valores predeterminados habituales
    - Quieres un único lugar donde encontrar las opciones experimentales documentadas actualmente.
summary: Qué significan las opciones experimentales en OpenClaw y cuáles están documentadas actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-07-12T14:26:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Las funciones experimentales son superficies preliminares de participación voluntaria que se habilitan mediante indicadores explícitos. Necesitan más uso en situaciones reales antes de adoptar un valor predeterminado estable o un contrato duradero.

- Están desactivadas de forma predeterminada, salvo que la documentación indique que se debe habilitar alguna.
- Su estructura y comportamiento pueden cambiar más rápido que la configuración estable.
- Se debe preferir una vía estable cuando ya exista.
- Solo deben implementarse de forma generalizada después de probarlas primero en un entorno más pequeño.

## Indicadores documentados actualmente

| Superficie                       | Clave                                                                                      | Cuándo usarlo                                                                                                                             | Más información                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Entorno de ejecución de modelos locales | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend local más pequeño o estricto no puede manejar toda la superficie de herramientas predeterminada de OpenClaw                   | [Modelos locales](/es/gateway/local-models)                                                             |
| Búsqueda en memoria               | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Se desea que `memory_search` indexe las transcripciones de sesiones anteriores y se acepta el coste adicional de almacenamiento e indexación | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Entorno Codex                     | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Se desea que el servidor de aplicaciones nativo de Codex 0.132.0 o posterior se dirija a un servidor de ejecución respaldado por el entorno aislado de OpenClaw, en lugar de desactivar el modo de código | [Referencia del entorno Codex](/es/plugins/codex-harness-reference#sandboxed-native-execution)          |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                                                              | Se desea exponer la herramienta estructurada `update_plan` para seguir trabajos de varios pasos en entornos de ejecución e interfaces de usuario compatibles | [Referencia de configuración del Gateway](/es/gateway/config-tools#toolsexperimental)                    |

## Modo ligero para modelos locales

`agents.defaults.experimental.localModelLean: true` elimina en cada turno las herramientas opcionales de gran tamaño de la superficie directa del agente: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`. Las herramientas permitidas explícitamente o necesarias para la entrega siguen estando disponibles, aunque Tool Search puede catalogarlas en lugar de exponerlas directamente. El modo ligero también configura de forma predeterminada los catálogos de plugins, MCP y clientes para usar Tool Search estructurado (`tool_search`, `tool_describe`, `tool_call`) cuando `tools.toolSearch` aún no está configurado. Se debe usar `agents.list[].experimental.localModelLean` para limitarlo a un solo agente.

Si Tool Search ya está ajustado globalmente, OpenClaw no modifica esa configuración. Se debe establecer `tools.toolSearch: false` para no utilizar el valor predeterminado de Tool Search del modo ligero.

En el modo estructurado de `tools`, las ejecuciones ligeras mantienen `exec` directamente visible junto a los controles de Tool Search para que los modelos locales ajustados para programación puedan seguir eligiendo su conocida vía de shell. Esto solo cambia la visibilidad del esquema: siguen aplicándose la política normal de herramientas, el aislamiento y las aprobaciones de ejecución. Los modos explícitos `code` y `directory` mantienen su comportamiento normal de Compaction.

### Motivos para elegir estas herramientas

Estas herramientas tienen las descripciones más extensas, las estructuras de parámetros más amplias o la mayor probabilidad de distraer a un modelo pequeño de la vía normal de programación y conversación. En un backend compatible con OpenAI que tenga un contexto pequeño o sea más estricto, esto marca la diferencia entre:

- Que los esquemas de herramientas quepan en el prompt o desplacen el historial de conversación.
- Que el modelo elija la herramienta correcta o emita llamadas de herramientas malformadas debido a demasiados esquemas similares.
- Que el adaptador de Chat Completions se mantenga dentro de los límites de salida estructurada o devuelva un error 400 por el tamaño de la carga de las llamadas de herramientas.

Eliminarlas solo acorta la lista directa de herramientas. El modelo sigue disponiendo de `read`, `write`, `edit`, `exec`, `apply_patch`, comprensión de imágenes, búsqueda y obtención de contenido web (cuando están configuradas), memoria y herramientas de sesión y agente. Los catálogos adicionales siguen siendo accesibles mediante Tool Search, salvo que se establezca `tools.toolSearch: false`; los permisos explícitos de herramientas pueden reincorporar un agente ligero a un flujo de trabajo reducido.

### Cuándo activarlo

Se debe habilitar el modo ligero una vez que se haya comprobado que el modelo puede comunicarse con el Gateway, pero los turnos completos del agente se comportan de forma incorrecta:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` se ejecuta correctamente.
2. Un turno normal del agente falla debido a llamadas de herramientas malformadas, prompts demasiado grandes o porque el modelo ignora sus herramientas.
3. Activar `localModelLean: true` elimina el fallo.

### Cuándo dejarlo desactivado

Si el backend gestiona correctamente el entorno de ejecución predeterminado completo, se debe dejar desactivado. Es una solución alternativa para entornos locales que necesitan una superficie de herramientas más pequeña, no un valor predeterminado para modelos alojados ni equipos locales con recursos suficientes.

El modo ligero no reemplaza `tools.profile`, `tools.allow`/`tools.deny` ni el mecanismo alternativo `compat.supportsTools: false` del modelo. Para disponer permanentemente de una superficie de herramientas más limitada en un agente específico, se deben preferir esas opciones estables.

### Habilitación

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

Se debe reiniciar el Gateway después de cambiar el indicador. El filtrado del modo ligero elimina `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`, salvo que se conserven explícitamente mediante `tools.allow` o `tools.alsoAllow`; Tool Search puede seguir catalogando las herramientas conservadas en lugar de exponerlas directamente.

## Experimental no significa oculto

Una función experimental debe indicarlo claramente en la documentación y en la propia ruta de configuración, en lugar de ocultarse tras una opción predeterminada que parezca estable.

## Relacionado

- [Funciones](/es/concepts/features)
- [Canales de publicación](/es/install/development-channels)
