---
read_when:
    - Quieres entender la Compaction automática y `/compact`
    - Estás depurando sesiones largas que alcanzan los límites de contexto
summary: Cómo OpenClaw resume conversaciones largas para mantenerse dentro de los límites del modelo
title: Compaction
x-i18n:
    generated_at: "2026-04-21T05:13:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Cada modelo tiene una ventana de contexto: la cantidad máxima de tokens que puede procesar.
Cuando una conversación se acerca a ese límite, OpenClaw **compacta** los mensajes más antiguos
en un resumen para que el chat pueda continuar.

## Cómo funciona

1. Los turnos más antiguos de la conversación se resumen en una entrada compacta.
2. El resumen se guarda en la transcripción de la sesión.
3. Los mensajes recientes se mantienen intactos.

Cuando OpenClaw divide el historial en fragmentos de Compaction, mantiene las
llamadas de herramientas del asistente emparejadas con sus entradas `toolResult`
correspondientes. Si un punto de división cae dentro de un bloque de herramientas,
OpenClaw mueve el límite para que el par permanezca junto y se preserve la cola
actual sin resumir.

El historial completo de la conversación permanece en disco. Compaction solo cambia lo que el
modelo ve en el siguiente turno.

## Compaction automática

La Compaction automática está activada de forma predeterminada. Se ejecuta cuando la sesión se acerca al límite
de contexto, o cuando el modelo devuelve un error de desbordamiento de contexto (en cuyo caso
OpenClaw hace Compaction y reintenta). Las firmas típicas de desbordamiento incluyen
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` y `ollama error: context length
exceeded`.

<Info>
Antes de hacer Compaction, OpenClaw recuerda automáticamente al agente que guarde notas importantes
en archivos de [memory](/es/concepts/memory). Esto evita la pérdida de contexto.
</Info>

Usa la configuración `agents.defaults.compaction` en tu `openclaw.json` para configurar el comportamiento de Compaction (modo, tokens objetivo, etc.).
La resumización de Compaction preserva identificadores opacos de forma predeterminada (`identifierPolicy: "strict"`). Puedes sobrescribir esto con `identifierPolicy: "off"` o proporcionar texto personalizado con `identifierPolicy: "custom"` e `identifierInstructions`.

Opcionalmente puedes especificar un modelo diferente para la resumización de Compaction mediante `agents.defaults.compaction.model`. Esto es útil cuando tu modelo principal es un modelo local o pequeño y quieres que los resúmenes de Compaction los produzca un modelo más capaz. La sobrescritura acepta cualquier cadena `provider/model-id`:

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

Esto también funciona con modelos locales, por ejemplo un segundo modelo de Ollama dedicado a la resumización o un especialista de Compaction ajustado finamente:

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

Cuando no se establece, Compaction usa el modelo principal del agente.

## Proveedores de Compaction conectables

Los plugins pueden registrar un proveedor de Compaction personalizado mediante `registerCompactionProvider()` en la API del plugin. Cuando un proveedor está registrado y configurado, OpenClaw le delega la resumización en lugar de usar el pipeline de LLM integrado.

Para usar un proveedor registrado, establece el id del proveedor en tu configuración:

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

Establecer un `provider` fuerza automáticamente `mode: "safeguard"`. Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada, y OpenClaw sigue preservando el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor. Si el proveedor falla o devuelve un resultado vacío, OpenClaw vuelve a la resumización LLM integrada.

## Compaction automática (activada de forma predeterminada)

Cuando una sesión se acerca o supera la ventana de contexto del modelo, OpenClaw activa la Compaction automática y puede reintentar la solicitud original usando el contexto compactado.

Verás:

- `🧹 Auto-compaction complete` en modo detallado
- `/status` mostrando `🧹 Compactions: <count>`

Antes de la Compaction, OpenClaw puede ejecutar un turno de **volcado silencioso de memoria** para almacenar
notas persistentes en el disco. Consulta [Memory](/es/concepts/memory) para más detalles y configuración.

## Compaction manual

Escribe `/compact` en cualquier chat para forzar una Compaction. Agrega instrucciones para guiar
el resumen:

```
/compact Focus on the API design decisions
```

## Usar un modelo diferente

De forma predeterminada, Compaction usa el modelo principal de tu agente. Puedes usar un modelo más
capaz para obtener mejores resúmenes:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Avisos de Compaction

De forma predeterminada, Compaction se ejecuta silenciosamente. Para mostrar avisos breves cuando la Compaction
comienza y cuando finaliza, habilita `notifyUser`:

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

Cuando está habilitado, el usuario ve mensajes breves de estado alrededor de cada ejecución de Compaction
(por ejemplo, "Compacting context..." y "Compaction complete").

## Compaction frente a poda

|                  | Compaction                    | Poda                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **Qué hace**     | Resume la conversación antigua | Recorta resultados de herramientas antiguos |
| **¿Se guarda?**  | Sí (en la transcripción de la sesión) | No (solo en memoria, por solicitud) |
| **Alcance**      | Toda la conversación          | Solo resultados de herramientas  |

La [poda de sesión](/es/concepts/session-pruning) es un complemento más liviano que
recorta la salida de herramientas sin resumir.

## Solución de problemas

**¿Compacta con demasiada frecuencia?** Puede que la ventana de contexto del modelo sea pequeña, o que las
salidas de herramientas sean grandes. Intenta habilitar la
[poda de sesión](/es/concepts/session-pruning).

**¿El contexto se siente obsoleto después de la Compaction?** Usa `/compact Focus on <topic>` para
guiar el resumen, o habilita el [volcado de memoria](/es/concepts/memory) para que las notas
persistan.

**¿Necesitas empezar de cero?** `/new` inicia una sesión nueva sin hacer Compaction.

Para la configuración avanzada (reserva de tokens, preservación de identificadores, motores de
contexto personalizados, Compaction del lado del servidor de OpenAI), consulta el
[Análisis profundo de administración de sesiones](/es/reference/session-management-compaction).

## Relacionado

- [Sesión](/es/concepts/session) — administración y ciclo de vida de la sesión
- [Poda de sesión](/es/concepts/session-pruning) — recorte de resultados de herramientas
- [Contexto](/es/concepts/context) — cómo se construye el contexto para los turnos del agente
- [Hooks](/es/automation/hooks) — hooks del ciclo de vida de Compaction (`before_compaction`, `after_compaction`)
