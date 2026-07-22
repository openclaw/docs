---
read_when:
    - Se ve una clave de configuración `.experimental` y se quiere saber si es estable
    - Quieres probar las funciones preliminares del entorno de ejecución sin confundirlas con los valores predeterminados habituales
    - Se busca un único lugar donde encontrar las opciones experimentales documentadas actualmente
summary: Qué significan las opciones experimentales en OpenClaw y cuáles están documentadas actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-07-22T10:30:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c14b74bbafce77c0d1e1358ad94053675c4aad9e26be78719f58e78f455c3a2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Las funciones experimentales son superficies de vista previa tras indicadores explícitos. Necesitan más uso en condiciones reales antes de disponer de un valor predeterminado estable o de un contrato duradero.

- Desactivadas de forma predeterminada, salvo que un documento describa una regla específica de configuración automática.
- La forma y el comportamiento pueden cambiar más rápido que la configuración estable.
- Es preferible una vía estable cuando ya existe.
- Solo deben implementarse de forma generalizada después de probarlas primero en un entorno más pequeño.

## Indicadores documentados actualmente

| Superficie                     | Clave                                                                                         | Cuándo usarla                                                                                                                               | Más información                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Entorno de ejecución de modelo local | `agents.defaults.experimental.localModelLean`, `agents.entries.*.experimental.localModelLean` | Un backend local más pequeño o estricto no puede procesar toda la superficie de herramientas predeterminada de OpenClaw                    | [Modelos locales](/es/gateway/local-models)                                                         |
| Arnés de Codex                 | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                       | Se quiere que el servidor de aplicaciones nativo de Codex 0.132.0 o posterior use un servidor de ejecución respaldado por un sandbox de OpenClaw en lugar de desactivar el modo de código | [Referencia del arnés de Codex](/es/plugins/codex-harness-reference#sandboxed-native-execution) |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                                                                 | Se quiere exponer la herramienta estructurada `update_plan` para realizar el seguimiento de trabajos de varios pasos en entornos de ejecución e interfaces de usuario compatibles | [Referencia de configuración del Gateway](/es/gateway/config-tools#toolsexperimental)               |
| Modo de código                 | `tools.codeMode.enabled`                                                                      | Se quiere acceder de forma compacta y orquestada mediante código a un catálogo oculto de herramientas de OpenClaw                          | [Modo de código](/es/tools/code-mode)                                                               |
| Enjambre                       | `tools.swarm.enabled`                                                                         | Se quiere que los scripts del modo de código orquesten en paralelo grupos acotados de subagentes                                            | [Enjambre](/es/tools/swarm)                                                                         |

## Labs de la interfaz de control

Abra **Settings → Agents & Tools → Labs** para administrar los experimentos que tienen un
interruptor en la interfaz de control. Al activar o desactivar un laboratorio, se modifica de inmediato la
configuración canónica del Gateway; la página solo muestra una indicación para reiniciar cuando una función lo
requiere.

El modo de código y Enjambre son las entradas de Labs que se distribuyen actualmente. Ambos interruptores
escriben claves de configuración existentes y validadas, y normalmente surten efecto en las futuras ejecuciones
de agentes sin reiniciar el Gateway.

## Modo ligero de modelos locales

`agents.defaults.experimental.localModelLean: true` elimina en cada turno las herramientas opcionales de gran tamaño de la superficie directa del agente: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`. Las herramientas permitidas explícitamente o necesarias para la entrega siguen disponibles, aunque la búsqueda de herramientas puede catalogarlas en lugar de exponerlas directamente. El modo ligero también configura de forma predeterminada los catálogos de plugins/MCP/clientes para la búsqueda estructurada de herramientas (`tool_search`, `tool_describe`, `tool_call`) cuando `tools.toolSearch` aún no está definido. Use `agents.entries.*.experimental.localModelLean` para limitarlo a un agente.

Durante la incorporación, una ruta de inferencia `ollama` o `lmstudio` verificada establece automáticamente `agents.defaults.experimental.localModelLean: true` cuando ese valor no está presente. OpenClaw registra que el ajuste procede de la incorporación, de modo que una ruta no local verificada posteriormente solo elimina el ajuste automático. Se conserva un valor `true` o `false` configurado explícitamente. Otros proveedores autoalojados y compatibles con OpenAI no se deducen a partir de los nombres de los modelos ni de las URL.

Si la búsqueda de herramientas ya está ajustada globalmente, OpenClaw no modifica esa configuración. Establezca `tools.toolSearch: false` para excluirse del valor predeterminado de búsqueda de herramientas del modo ligero.

En el modo estructurado `tools`, las ejecuciones ligeras mantienen `exec` directamente visible junto a los controles de búsqueda de herramientas para que los modelos locales optimizados para programación puedan seguir eligiendo su vía de shell habitual. Esto solo cambia la visibilidad del esquema: la política normal de herramientas, el uso del sandbox y las aprobaciones de ejecución siguen siendo aplicables. Los modos explícitos `code` y `directory` mantienen su comportamiento normal de Compaction.

### Motivo de estas herramientas

Estas herramientas tienen las descripciones más extensas, las formas de parámetros más amplias o la mayor probabilidad de distraer a un modelo pequeño de la vía normal de programación y conversación. En un backend compatible con OpenAI más estricto o con un contexto reducido, esto marca la diferencia entre:

- Que los esquemas de herramientas quepan en el prompt o desplacen el historial de conversación.
- Que el modelo elija la herramienta correcta o emita llamadas de herramientas mal formadas por haber demasiados esquemas similares.
- Que el adaptador de Chat Completions se mantenga dentro de los límites de salida estructurada o se produzca un error 400 por el tamaño de la carga útil de la llamada de herramientas.

Eliminarlas solo acorta la lista directa de herramientas. El modelo sigue disponiendo de `read`, `write`, `edit`, `exec`, `apply_patch`, comprensión de imágenes, búsqueda/obtención web (cuando están configuradas), memoria y herramientas de sesión/agente. Los catálogos adicionales siguen siendo accesibles mediante la búsqueda de herramientas, a menos que se establezca `tools.toolSearch: false`; las autorizaciones explícitas de herramientas pueden volver a incluir un agente ligero en un flujo de trabajo reducido.

### Cuándo activarlo

Active el modo ligero cuando haya comprobado que el modelo puede comunicarse con el Gateway, pero los turnos completos del agente se comporten incorrectamente:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` se ejecuta correctamente.
2. Un turno normal del agente falla debido a llamadas de herramientas mal formadas, prompts demasiado grandes o porque el modelo ignora sus herramientas.
3. Cambiar `localModelLean: true` elimina el fallo.

### Cuándo dejarlo desactivado

Si el backend gestiona correctamente todo el entorno de ejecución predeterminado, deje esta opción desactivada. Es una solución alternativa para pilas locales que necesitan una superficie de herramientas más pequeña, no un valor predeterminado para modelos alojados ni para equipos locales con recursos suficientes.

El modo ligero no sustituye a `tools.profile`, `tools.allow`/`tools.deny` ni a la vía de escape `compat.supportsTools: false` del modelo. Para disponer de una superficie de herramientas permanentemente más limitada en un agente concreto, se prefieren esos controles estables.

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

Reinicie el Gateway después de cambiar el indicador. El filtrado ligero elimina `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` y `pdf`, salvo que se conserven explícitamente mediante `tools.allow` o `tools.alsoAllow`; la búsqueda de herramientas puede seguir catalogando las herramientas conservadas en lugar de exponerlas directamente.

## Experimental no significa oculto

Una función experimental debe indicarlo claramente en la documentación y en la propia ruta de configuración, en lugar de ocultarse tras un control predeterminado que parezca estable.

## Relacionado

- [Funciones](/es/concepts/features)
- [Canales de publicación](/es/install/development-channels)
