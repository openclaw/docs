---
read_when:
    - Ves una clave de configuración `.experimental` y quieres saber si es estable
    - Quieres probar funciones de ejecución en vista previa sin confundirlas con los valores predeterminados normales
    - Quieres un único lugar donde encontrar las opciones experimentales documentadas actualmente
summary: Qué significan las opciones experimentales en OpenClaw y cuáles están documentadas actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-05-02T22:18:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

Las funciones experimentales de OpenClaw son **superficies de vista previa opcionales**. Están detrás de marcas explícitas porque todavía necesitan uso en el mundo real antes de merecer un valor predeterminado estable o un contrato público de larga duración.

Trátalas de forma diferente a la configuración normal:

- Mantenlas **desactivadas de forma predeterminada** salvo que la documentación relacionada te indique probar una.
- Espera que **la forma y el comportamiento cambien** más rápido que la configuración estable.
- Prefiere primero la ruta estable cuando ya exista una.
- Si estás implementando OpenClaw de forma amplia, prueba las marcas experimentales en un entorno más pequeño antes de incorporarlas a una línea base compartida.

## Marcas documentadas actualmente

| Superficie               | Clave                                                     | Úsala cuando                                                                                                   | Más                                                                                           |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime de modelo local  | `agents.defaults.experimental.localModelLean`             | Un backend local más pequeño o estricto se atasca con la superficie completa predeterminada de herramientas de OpenClaw | [Modelos locales](/es/gateway/local-models)                                                      |
| Búsqueda de memoria      | `agents.defaults.memorySearch.experimental.sessionMemory` | Quieres que `memory_search` indexe transcripciones de sesiones anteriores y aceptas el coste adicional de almacenamiento/indexación | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                             | Quieres que la herramienta estructurada `update_plan` esté expuesta para seguimiento de trabajo de varios pasos en runtimes e IU compatibles | [Referencia de configuración de Gateway](/es/gateway/config-tools#toolsexperimental)             |

## Modo ligero de modelo local

`agents.defaults.experimental.localModelLean: true` es una válvula de alivio para configuraciones de modelos locales más débiles. Cuando está activado, OpenClaw elimina tres herramientas predeterminadas —`browser`, `cron` y `message`— de la superficie de herramientas del agente en cada turno. Nada más cambia.

### Por qué estas tres herramientas

Estas tres herramientas tienen las descripciones más grandes y la mayor cantidad de formas de parámetros en el runtime predeterminado de OpenClaw. En un backend compatible con OpenAI de contexto pequeño o más estricto, esa es la diferencia entre:

- Que los esquemas de herramientas encajen limpiamente en el prompt frente a desplazar el historial de conversación.
- Que el modelo elija la herramienta correcta frente a emitir llamadas a herramientas mal formadas porque hay demasiados esquemas de aspecto similar.
- Que el adaptador de Chat Completions permanezca dentro de los límites de salida estructurada del servidor frente a disparar un 400 por el tamaño de la carga útil de llamada a herramienta.

Eliminarlas no reconfigura OpenClaw silenciosamente: solo acorta la lista de herramientas. El modelo sigue teniendo disponibles `read`, `write`, `edit`, `exec`, `apply_patch`, búsqueda/captura web (cuando esté configurada), memoria y herramientas de sesión/agente.

### Cuándo activarlo

Activa el modo ligero cuando ya hayas demostrado que el modelo puede comunicarse con el Gateway pero los turnos completos del agente se comportan mal. La cadena de señales típica es:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` se ejecuta correctamente.
2. Un turno normal de agente falla con llamadas a herramientas mal formadas, prompts demasiado grandes o el modelo ignora sus herramientas.
3. Cambiar `localModelLean: true` resuelve el fallo.

### Cuándo dejarlo desactivado

Si tu backend maneja limpiamente el runtime predeterminado completo, deja esto desactivado. El modo ligero es una solución temporal, no un valor predeterminado. Existe porque algunas pilas locales necesitan una superficie de herramientas más pequeña para comportarse correctamente; los modelos alojados y los equipos locales con buenos recursos no.

El modo ligero tampoco reemplaza `tools.profile`, `tools.allow`/`tools.deny` ni la vía de escape `compat.supportsTools: false` del modelo. Si necesitas una superficie de herramientas permanentemente más reducida para un agente específico, prefiere esos controles estables antes que la marca experimental.

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

Reinicia el Gateway después de cambiar la marca y luego confirma la lista de herramientas recortada con:

```bash
openclaw status --deep
```

La salida de estado profundo enumera las herramientas activas del agente; `browser`, `cron` y `message` deberían estar ausentes cuando el modo ligero esté activado.

## Experimental no significa oculto

Si una función es experimental, OpenClaw debería decirlo claramente en la documentación y en la propia ruta de configuración. Lo que **no** debería hacer es introducir comportamiento de vista previa en un control predeterminado con apariencia estable y fingir que eso es normal. Así es como las superficies de configuración se vuelven desordenadas.

## Relacionado

- [Funciones](/es/concepts/features)
- [Canales de lanzamiento](/es/install/development-channels)
