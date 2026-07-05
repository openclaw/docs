---
read_when:
    - Quieres entender la autocompactación y /compact
    - Estás depurando sesiones largas que alcanzan los límites de contexto
summary: Cómo OpenClaw resume conversaciones largas para mantenerse dentro de los límites del modelo
title: Compaction
x-i18n:
    generated_at: "2026-07-05T11:13:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c28a6b7c34872d23fa302ca42310928b862637ce7af4d742411a26dd868637fa
    source_path: concepts/compaction.md
    workflow: 16
---

Cada modelo tiene una ventana de contexto: el número máximo de tokens que puede procesar. Cuando una conversación se acerca a ese límite, OpenClaw **compacts** los mensajes antiguos en un resumen para que el chat pueda continuar.

## Cómo funciona

1. Los turnos antiguos de la conversación se resumen en una entrada compacta.
2. El resumen se guarda en la transcripción de la sesión.
3. Los mensajes recientes se conservan intactos.

OpenClaw mantiene las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes cuando elige un punto de división para la Compaction. Si el punto cae dentro de un bloque de herramienta, OpenClaw mueve el límite para que el par permanezca junto y se preserve la cola actual sin resumir.

El historial completo de la conversación permanece en disco. La Compaction solo cambia lo que el modelo ve en el siguiente turno.

<Note>
Las configuraciones nuevas establecen `agents.defaults.compaction.mode` en `"safeguard"` de forma predeterminada (protecciones más estrictas, auditorías de calidad del resumen). Establece `mode: "default"` explícitamente para desactivarlo.
</Note>

## Compaction automática

La Compaction automática está activada de forma predeterminada. Se ejecuta cuando la sesión se acerca al límite de contexto, o cuando el modelo devuelve un error de desbordamiento de contexto (en cuyo caso OpenClaw hace la Compaction y reintenta).

Verás:

- `embedded run auto-compaction start` / `complete` en los registros normales de Gateway.
- `🧹 Auto-compaction complete` en modo detallado.
- `/status` mostrando `🧹 Compactions: <count>`.

<Info>
Antes de compactar, OpenClaw recuerda automáticamente al agente que guarde notas importantes en archivos de [memoria](/es/concepts/memory). Esto evita la pérdida de contexto.
</Info>

<AccordionGroup>
  <Accordion title="Patrones de error de desbordamiento que OpenClaw reconoce">
    OpenClaw detecta docenas de cadenas de error de desbordamiento específicas de proveedores (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter y más). Ejemplos comunes:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manual

Escribe `/compact` en cualquier chat para forzar una Compaction. Añade instrucciones para orientar el resumen:

```text
/compact Focus on the API design decisions
```

Cuando `agents.defaults.compaction.keepRecentTokens` está configurado (valor predeterminado: 20,000), la Compaction manual respeta ese punto de corte y conserva la cola reciente en el contexto reconstruido. Sin un presupuesto de conservación explícito, la Compaction manual se comporta como un punto de control estricto y continúa solo desde el nuevo resumen.

## Configuración

Configura la Compaction en `agents.defaults.compaction` dentro de tu `openclaw.json`. Las opciones más comunes se enumeran a continuación; para la referencia completa, consulta [Análisis profundo de la gestión de sesiones](/es/reference/session-management-compaction).

### Usar un modelo diferente

De forma predeterminada, la Compaction usa el modelo principal del agente. Establece `agents.defaults.compaction.model` para delegar el resumen en un modelo más capaz o especializado. La sobrescritura acepta una cadena `provider/model-id` o un alias simple configurado en `agents.defaults.models`:

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

Los alias simples configurados se resuelven a su proveedor y modelo canónicos antes de que comience la Compaction. Si un valor simple coincide tanto con un alias como con un ID de modelo literal configurado, gana el ID de modelo literal. Un valor simple sin coincidencia permanece como ID de modelo en el proveedor activo.

Esto también funciona con modelos locales, por ejemplo, un segundo modelo de Ollama dedicado al resumen:

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

Cuando no está configurado, la Compaction comienza con el modelo de la sesión activa. Si el resumen falla con un error de proveedor elegible para reserva de modelo, OpenClaw reintenta ese intento de Compaction mediante la cadena de reserva de modelos existente de la sesión. La opción de reserva es temporal y no se escribe de nuevo en el estado de la sesión. Una sobrescritura explícita de `agents.defaults.compaction.model` permanece exacta y no hereda la cadena de reserva de la sesión.

### Preservación de identificadores

El resumen de la Compaction preserva identificadores opacos de forma predeterminada (`identifierPolicy: "strict"`). Sobrescríbelo con `identifierPolicy: "off"` para desactivarlo, o `identifierPolicy: "custom"` junto con `identifierInstructions` para indicaciones personalizadas.

### Protección de bytes de la transcripción activa

Cuando `agents.defaults.compaction.maxActiveTranscriptBytes` está configurado, OpenClaw activa una Compaction local normal antes de una ejecución si el JSONL activo alcanza ese tamaño. Esto es útil para sesiones de larga duración en las que la gestión de contexto del lado del proveedor puede mantener sano el contexto del modelo mientras la transcripción local sigue creciendo. No divide bytes JSONL sin procesar; solicita a la canalización normal de Compaction que cree un resumen semántico.

<Warning>
La protección de bytes requiere `truncateAfterCompaction: true`. Sin rotación de transcripción, el archivo activo no se reduciría y la protección permanecería inactiva.
</Warning>

### Transcripciones sucesoras

Cuando `agents.defaults.compaction.truncateAfterCompaction` está habilitado, OpenClaw no reescribe la transcripción existente en el mismo lugar. Crea una nueva transcripción sucesora activa a partir del resumen de Compaction, el estado preservado y la cola sin resumir, y luego registra metadatos de punto de control que dirigen los flujos de ramificación/restauración a esa sucesora compactada.
Las transcripciones sucesoras también descartan turnos largos exactos y duplicados del usuario que llegan
dentro de una ventana breve de reintento, para que las tormentas de reintentos del canal no se arrastren a la
siguiente transcripción activa después de la Compaction.

OpenClaw ya no escribe copias `.checkpoint.*.jsonl` separadas para nuevas
Compactions. Los archivos de punto de control heredados existentes todavía pueden usarse mientras estén referenciados
y se eliminan durante la limpieza normal de sesiones.

### Avisos de Compaction

De forma predeterminada, la Compaction se ejecuta en silencio. Establece `notifyUser` para mostrar mensajes breves de estado cuando la Compaction comienza y se completa:

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

Antes de la Compaction, OpenClaw puede ejecutar un turno de **vaciado silencioso de memoria** para almacenar notas duraderas en disco. Establece `agents.defaults.compaction.memoryFlush.model` cuando este turno de mantenimiento deba usar un modelo local en lugar del modelo de conversación activo:

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

La sobrescritura del modelo de vaciado de memoria es exacta y no hereda la cadena de reserva de la sesión activa. Consulta [Memoria](/es/concepts/memory) para obtener detalles y configuración.

## Proveedores de Compaction conectables

Los Plugins pueden registrar un proveedor de Compaction personalizado mediante `registerCompactionProvider()` en la API del Plugin. Cuando un proveedor está registrado y configurado, OpenClaw le delega el resumen en lugar de usar la canalización LLM integrada.

Para usar un proveedor registrado, establece su id en tu configuración:

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

Establecer un `provider` fuerza automáticamente `mode: "safeguard"`. Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada, y OpenClaw sigue preservando el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.

<Note>
Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre al resumen LLM integrado.
</Note>

## Compaction frente a poda

|                  | Compaction                    | Poda                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **Qué hace**     | Resume conversaciones antiguas | Recorta resultados antiguos de herramientas |
| **¿Guardado?**   | Sí (en la transcripción de la sesión) | No (solo en memoria, por solicitud) |
| **Ámbito**       | Toda la conversación           | Solo resultados de herramientas  |

La [poda de sesión](/es/concepts/session-pruning) es un complemento más ligero que recorta la salida de herramientas sin resumirla.

## Solución de problemas

**¿Se compacta demasiado a menudo?** La ventana de contexto del modelo puede ser pequeña, o las salidas de herramientas pueden ser grandes. Prueba a habilitar la [poda de sesión](/es/concepts/session-pruning).

**¿El contexto parece desactualizado después de la Compaction?** Usa `/compact Focus on <topic>` para orientar el resumen, o habilita el [vaciado de memoria](/es/concepts/memory) para que las notas se conserven.

**¿Necesitas empezar desde cero?** `/new` inicia una sesión nueva sin compactar.

Para configuración avanzada (tokens reservados, preservación de identificadores, motores de contexto personalizados, Compaction del lado del servidor de OpenAI), consulta el [análisis profundo de la gestión de sesiones](/es/reference/session-management-compaction).

## Relacionado

- [Sesión](/es/concepts/session): gestión de sesiones y ciclo de vida.
- [Poda de sesión](/es/concepts/session-pruning): recorte de resultados de herramientas.
- [Contexto](/es/concepts/context): cómo se construye el contexto para los turnos del agente.
- [Hooks](/es/automation/hooks): hooks del ciclo de vida de Compaction (`before_compaction`, `after_compaction`).
