---
read_when:
    - Quieres comprender la compactación automática y `/compact`
    - Estás depurando sesiones largas que alcanzan los límites de contexto
summary: Cómo OpenClaw resume conversaciones largas para mantenerse dentro de los límites del modelo
title: Compaction
x-i18n:
    generated_at: "2026-07-22T10:30:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb1f794fa60affd602378bcff8b07786bfeca55ab3fa09d5fa7214a05fa48806
    source_path: concepts/compaction.md
    workflow: 16
---

Cada modelo tiene una ventana de contexto: el número máximo de tokens que puede procesar. Cuando una conversación se acerca a ese límite, OpenClaw **compacta** los mensajes anteriores en un resumen para que el chat pueda continuar.

## Cómo funciona

1. Los turnos anteriores de la conversación se resumen en una entrada compacta.
2. El resumen se guarda en la transcripción de la sesión.
3. Los mensajes recientes se mantienen intactos.

OpenClaw mantiene las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes cuando elige un punto de división para la compactación. Si el punto queda dentro de un bloque de herramientas, OpenClaw desplaza el límite para mantener unido el par y conservar la cola actual sin resumir.

El historial completo de la conversación permanece en el disco. La compactación solo cambia lo que ve el modelo en el siguiente turno.

<Note>
Las configuraciones nuevas establecen de forma predeterminada `agents.defaults.compaction.mode` en `"safeguard"` (medidas de protección más estrictas y auditorías de calidad de los resúmenes). Establezca explícitamente `mode: "default"` para desactivarlo.
</Note>

## Compactación automática

La compactación automática está activada de forma predeterminada. Se ejecuta cuando la sesión se acerca al límite de contexto o cuando el modelo devuelve un error de desbordamiento de contexto (en cuyo caso, OpenClaw compacta y vuelve a intentarlo).

Se muestra lo siguiente:

- `embedded run auto-compaction start` / `complete` en los registros normales del Gateway.
- `🧹 Auto-compaction complete` en el modo detallado.
- `/status` que muestra `🧹 Compactions: <count>`.

<Info>
Antes de compactar, OpenClaw recuerda automáticamente al agente que guarde las notas importantes en archivos de [memoria](/es/concepts/memory). Esto evita la pérdida de contexto.
</Info>

<AccordionGroup>
  <Accordion title="Patrones de errores de desbordamiento que reconoce OpenClaw">
    OpenClaw identifica decenas de cadenas de error de desbordamiento específicas de proveedores (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter y otros). Ejemplos habituales:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compactación manual

Escriba `/compact` en cualquier chat para forzar una compactación. Añada instrucciones para orientar el resumen:

```text
/compact Céntrate en las decisiones de diseño de la API
```

Cuando se establece `agents.defaults.compaction.keepRecentTokens` (valor predeterminado: 20,000), la compactación manual respeta ese punto de corte y conserva la cola reciente en el contexto reconstruido. Sin un presupuesto de conservación explícito, la compactación manual funciona como un punto de control estricto y continúa únicamente desde el nuevo resumen.

## Configuración

Configure la compactación en `agents.defaults.compaction` dentro de su `openclaw.json`. Las opciones más habituales se indican a continuación; para consultar la referencia completa, consulte el [análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction).

### Uso de un modelo diferente

De forma predeterminada, la compactación utiliza el modelo principal del agente. Establezca `agents.defaults.compaction.model` para delegar el resumen a un modelo más capaz o especializado. La anulación acepta una cadena `provider/model-id` o un alias simple configurado en `agents.defaults.models`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Los alias simples configurados se resuelven en su proveedor y modelo canónicos antes de que comience la compactación. Si un valor simple coincide tanto con un alias como con un identificador literal de modelo configurado, prevalece el identificador literal del modelo. Un valor simple sin coincidencias se mantiene como identificador de modelo en el proveedor activo.

Esto también funciona con modelos locales; por ejemplo, un segundo modelo de Ollama dedicado al resumen:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Cuando no se establece, la compactación comienza con el modelo activo de la sesión. Si el resumen falla con un error del proveedor que admite el uso de un modelo alternativo, OpenClaw vuelve a intentar esa compactación mediante la cadena existente de modelos alternativos de la sesión. La elección alternativa es temporal y no se vuelve a escribir en el estado de la sesión. Una anulación explícita de `agents.defaults.compaction.model` se mantiene exacta y no hereda la cadena de modelos alternativos de la sesión.

### Conservación de identificadores

El resumen de la compactación conserva de forma predeterminada los identificadores opacos (`identifierPolicy: "strict"`). Establezca `identifierPolicy: "off"` para desactivarlo. Las instrucciones personalizadas deben incluirse en la implementación `summarize()` de un proveedor de compactación.

### Límite de bytes de la transcripción activa

Cuando se establece `agents.defaults.compaction.maxActiveTranscriptBytes`, OpenClaw
activa la compactación local normal antes de una ejecución si el historial de la transcripción alcanza
ese tamaño. Esto resulta útil para sesiones de larga duración en las que la gestión
del contexto por parte del proveedor puede mantener en buen estado el contexto del modelo mientras el historial persistente
de la transcripción sigue creciendo. No divide bytes sin procesar; solicita a la pipeline normal
de compactación que cree un resumen semántico.

<Warning>
El límite de bytes se aplica al historial activo de transcripciones de SQLite. Los artefactos de puntos de control
JSONL heredados no son el objetivo activo de la compactación.
</Warning>

### Transcripciones sucesoras

Cuando se activa `agents.defaults.compaction.truncateAfterCompaction`, OpenClaw no reescribe la transcripción existente en el mismo lugar. Crea una nueva transcripción sucesora activa a partir del resumen de la compactación, el estado conservado y la cola sin resumir; a continuación, registra metadatos del punto de control que dirigen los flujos de ramificación y restauración a esa sucesora compactada.
Las transcripciones sucesoras también descartan los turnos largos del usuario que sean duplicados exactos y lleguen
dentro de un breve intervalo de reintento, para que las avalanchas de reintentos del canal no se trasladen
a la siguiente transcripción activa después de la compactación.

OpenClaw ya no escribe copias independientes de `.checkpoint.*.jsonl` para las nuevas
compactaciones. Los archivos de puntos de control heredados existentes todavía pueden utilizarse mientras estén referenciados
y la limpieza normal de sesiones se encarga de eliminarlos.

### Avisos de compactación

De forma predeterminada, la compactación se ejecuta silenciosamente. Establezca `notifyUser` para mostrar mensajes breves de estado cuando comienza y finaliza la compactación, y para mostrar un aviso de funcionamiento degradado cuando se agota un volcado de memoria previo a la compactación, pero la respuesta continúa:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Volcado de memoria

Antes de la compactación, OpenClaw puede ejecutar un turno **silencioso de volcado de memoria** para almacenar notas duraderas en el disco. Establezca `agents.defaults.compaction.memoryFlush.model` cuando este turno de mantenimiento deba usar un modelo local en lugar del modelo activo de la conversación:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

La anulación del modelo de volcado de memoria es exacta y no hereda la cadena de modelos alternativos de la sesión activa. Consulte [Memoria](/es/concepts/memory) para obtener información detallada y la configuración.

## Proveedores de compactación conectables

Los Plugins pueden registrar un proveedor de compactación personalizado mediante `registerCompactionProvider()` en la API del Plugin. Cuando se registra y configura un proveedor, OpenClaw le delega el resumen en lugar de utilizar la pipeline de LLM integrada.

Para utilizar un proveedor registrado, establezca su identificador en la configuración:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Establecer un `provider` fuerza automáticamente `mode: "safeguard"`. Los proveedores reciben las mismas instrucciones de compactación y la misma política de conservación de identificadores que la ruta integrada, y OpenClaw sigue conservando el contexto del sufijo de los turnos recientes y divididos tras la salida del proveedor.

<Note>
Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre al resumen mediante el LLM integrado.
</Note>

## Compactación frente a poda

|                  | Compactación                          | Poda                                      |
| ---------------- | ------------------------------------- | ----------------------------------------- |
| **Qué hace**     | Resume la conversación anterior       | Recorta los resultados antiguos de herramientas |
| **¿Se guarda?**  | Sí (en la transcripción de la sesión) | No (solo en memoria, por solicitud)       |
| **Ámbito**       | Toda la conversación                   | Solo los resultados de herramientas       |

La [poda de sesiones](/es/concepts/session-pruning) es un complemento más ligero que recorta la salida de las herramientas sin resumirla.

## Solución de problemas

**¿La compactación ocurre con demasiada frecuencia?** Es posible que la ventana de contexto del modelo sea pequeña o que las salidas de las herramientas sean grandes. Pruebe a activar la [poda de sesiones](/es/concepts/session-pruning).

**¿El contexto parece obsoleto después de la compactación?** Utilice `/compact Focus on <topic>` para orientar el resumen o active el [volcado de memoria](/es/concepts/memory) para conservar las notas.

**¿Se necesita empezar desde cero?** `/new` inicia una sesión nueva sin compactar.

Para obtener información sobre la configuración avanzada (tokens reservados, conservación de identificadores, motores de contexto personalizados y compactación del lado del servidor de OpenAI), consulte el [análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction).

## Temas relacionados

- [Sesión](/es/concepts/session): gestión y ciclo de vida de las sesiones.
- [Poda de sesiones](/es/concepts/session-pruning): recorte de los resultados de herramientas.
- [Contexto](/es/concepts/context): cómo se construye el contexto para los turnos del agente.
- [Hooks](/es/automation/hooks): hooks del ciclo de vida de la compactación (`before_compaction`, `after_compaction`).
