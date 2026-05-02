---
read_when:
    - Quieres entender la compactación automática y /compact
    - Estás depurando sesiones largas que alcanzan los límites de contexto
summary: Cómo OpenClaw resume conversaciones largas para mantenerse dentro de los límites del modelo
title: Compaction
x-i18n:
    generated_at: "2026-05-02T05:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

Cada modelo tiene una ventana de contexto: la cantidad máxima de tokens que puede procesar. Cuando una conversación se acerca a ese límite, OpenClaw **compacta** los mensajes más antiguos en un resumen para que el chat pueda continuar.

## Cómo funciona

1. Los turnos de conversación más antiguos se resumen en una entrada compacta.
2. El resumen se guarda en la transcripción de la sesión.
3. Los mensajes recientes se mantienen intactos.

Cuando OpenClaw divide el historial en fragmentos de Compaction, mantiene las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes. Si un punto de división cae dentro de un bloque de herramienta, OpenClaw mueve el límite para que el par permanezca junto y se conserve la cola actual sin resumir.

El historial completo de la conversación permanece en disco. La Compaction solo cambia lo que ve el modelo en el siguiente turno.

## Compaction automática

La Compaction automática está activada de forma predeterminada. Se ejecuta cuando la sesión se acerca al límite de contexto o cuando el modelo devuelve un error de desbordamiento de contexto (en cuyo caso OpenClaw compacta y vuelve a intentarlo).

Verás:

- `🧹 Auto-compaction complete` en modo detallado.
- `/status` muestra `🧹 Compactions: <count>`.

<Info>
Antes de compactar, OpenClaw recuerda automáticamente al agente que guarde notas importantes en archivos de [memoria](/es/concepts/memory). Esto evita la pérdida de contexto.
</Info>

<AccordionGroup>
  <Accordion title="Firmas de desbordamiento reconocidas">
    OpenClaw detecta el desbordamiento de contexto a partir de estos patrones de error del proveedor:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manual

Escribe `/compact` en cualquier chat para forzar una Compaction. Añade instrucciones para orientar el resumen:

```
/compact Focus on the API design decisions
```

Cuando `agents.defaults.compaction.keepRecentTokens` está configurado, la Compaction manual respeta ese punto de corte de Pi y mantiene la cola reciente en el contexto reconstruido. Sin un presupuesto explícito de conservación, la Compaction manual se comporta como un punto de control estricto y continúa solo desde el nuevo resumen.

## Configuración

Configura la Compaction en `agents.defaults.compaction` dentro de tu `openclaw.json`. Los controles más comunes se enumeran abajo; para ver la referencia completa, consulta [Análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction).

### Usar un modelo diferente

De forma predeterminada, la Compaction usa el modelo principal del agente. Configura `agents.defaults.compaction.model` para delegar el resumen a un modelo más capaz o especializado. La sustitución acepta cualquier cadena `provider/model-id`:

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

Esto también funciona con modelos locales, por ejemplo un segundo modelo de Ollama dedicado al resumen:

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

Cuando no está configurado, la Compaction comienza con el modelo activo de la sesión. Si el resumen falla con un error de proveedor apto para recuperación mediante modelo alternativo, OpenClaw vuelve a intentar ese intento de Compaction a través de la cadena de modelos alternativos existente de la sesión. La elección del modelo alternativo es temporal y no se escribe de vuelta en el estado de la sesión. Una sustitución explícita de `agents.defaults.compaction.model` sigue siendo exacta y no hereda la cadena de modelos alternativos de la sesión.

### Conservación de identificadores

El resumen de Compaction conserva los identificadores opacos de forma predeterminada (`identifierPolicy: "strict"`). Sustitúyelo con `identifierPolicy: "off"` para desactivarlo, o con `identifierPolicy: "custom"` más `identifierInstructions` para una orientación personalizada.

### Guarda de bytes de transcripción activa

Cuando `agents.defaults.compaction.maxActiveTranscriptBytes` está configurado, OpenClaw activa la Compaction local normal antes de una ejecución si el JSONL activo alcanza ese tamaño. Esto es útil para sesiones de larga duración en las que la gestión de contexto del lado del proveedor puede mantener sano el contexto del modelo mientras la transcripción local sigue creciendo. No divide bytes JSONL sin procesar; le pide al flujo normal de Compaction que cree un resumen semántico.

<Warning>
La guarda de bytes requiere `truncateAfterCompaction: true`. Sin rotación de transcripción, el archivo activo no se reduciría y la guarda permanecería inactiva.
</Warning>

### Transcripciones sucesoras

Cuando `agents.defaults.compaction.truncateAfterCompaction` está habilitado, OpenClaw no reescribe la transcripción existente in situ. Crea una nueva transcripción sucesora activa a partir del resumen de Compaction, el estado conservado y la cola sin resumir, y luego mantiene el JSONL anterior como la fuente archivada del punto de control.
Las transcripciones sucesoras también descartan turnos largos de usuario exactamente duplicados que llegan
dentro de una ventana breve de reintento, por lo que las tormentas de reintentos del canal no se trasladan a la
siguiente transcripción activa después de la Compaction.

Los puntos de control previos a la Compaction se conservan solo mientras permanezcan por debajo del
límite de tamaño de puntos de control de OpenClaw; las transcripciones activas sobredimensionadas aún se compactan, pero OpenClaw
omite la gran instantánea de depuración en lugar de duplicar el uso de disco.

### Avisos de Compaction

De forma predeterminada, la Compaction se ejecuta en silencio. Configura `notifyUser` para mostrar mensajes breves de estado cuando la Compaction empieza y termina:

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

### Vaciado de memoria

Antes de la Compaction, OpenClaw puede ejecutar un turno de **vaciado de memoria silencioso** para almacenar notas duraderas en disco. Configura `agents.defaults.compaction.memoryFlush.model` cuando este turno de mantenimiento deba usar un modelo local en lugar del modelo activo de la conversación:

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

La sustitución del modelo de vaciado de memoria es exacta y no hereda la cadena de modelos alternativos de la sesión activa. Consulta [Memoria](/es/concepts/memory) para ver detalles y configuración.

## Proveedores de Compaction conectables

Los plugins pueden registrar un proveedor de Compaction personalizado mediante `registerCompactionProvider()` en la API del plugin. Cuando un proveedor está registrado y configurado, OpenClaw le delega el resumen en lugar de usar el flujo LLM integrado.

Para usar un proveedor registrado, configura su id en tu configuración:

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

Configurar un `provider` fuerza automáticamente `mode: "safeguard"`. Los proveedores reciben las mismas instrucciones de Compaction y la misma política de conservación de identificadores que la ruta integrada, y OpenClaw aún conserva el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.

<Note>
Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre al resumen LLM integrado.
</Note>

## Compaction frente a poda

|                  | Compaction                    | Poda                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **Qué hace**     | Resume la conversación antigua | Recorta resultados de herramientas antiguos |
| **¿Se guarda?**  | Sí (en la transcripción de la sesión) | No (solo en memoria, por solicitud) |
| **Ámbito**       | Toda la conversación           | Solo resultados de herramientas |

La [poda de sesión](/es/concepts/session-pruning) es un complemento más ligero que recorta la salida de herramientas sin resumir.

## Solución de problemas

**¿Compacta con demasiada frecuencia?** La ventana de contexto del modelo puede ser pequeña o las salidas de herramientas pueden ser grandes. Prueba a habilitar la [poda de sesión](/es/concepts/session-pruning).

**¿El contexto se siente desactualizado después de la Compaction?** Usa `/compact Focus on <topic>` para orientar el resumen, o habilita el [vaciado de memoria](/es/concepts/memory) para que las notas sobrevivan.

**¿Necesitas empezar de cero?** `/new` inicia una sesión nueva sin compactar.

Para la configuración avanzada (tokens de reserva, conservación de identificadores, motores de contexto personalizados, Compaction del lado del servidor de OpenAI), consulta el [Análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction).

## Relacionado

- [Sesión](/es/concepts/session): gestión y ciclo de vida de la sesión.
- [Poda de sesión](/es/concepts/session-pruning): recorte de resultados de herramientas.
- [Contexto](/es/concepts/context): cómo se crea el contexto para los turnos del agente.
- [Hooks](/es/automation/hooks): hooks del ciclo de vida de la Compaction (`before_compaction`, `after_compaction`).
