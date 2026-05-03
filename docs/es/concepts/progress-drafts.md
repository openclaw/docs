---
read_when:
    - Configurar actualizaciones de progreso visibles para turnos de chat de larga duración
    - Elegir entre los modos de streaming parcial, por bloque y de progreso
    - Explicación de cómo OpenClaw actualiza un mensaje de canal mientras el trabajo está en curso
    - Solución de problemas de borradores de progreso, mensajes de progreso independientes o mecanismo de reserva de finalización
summary: 'Borradores de progreso: un mensaje visible de trabajo en curso que se actualiza mientras se ejecuta un agente'
title: Borradores de progreso
x-i18n:
    generated_at: "2026-05-03T21:30:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Los borradores de progreso hacen que los turnos largos del agente se sientan vivos en el chat sin convertir
la conversación en una pila de respuestas temporales de estado.

Cuando los borradores de progreso están habilitados, OpenClaw crea un mensaje visible de trabajo en curso,
lo actualiza mientras el agente lee, planifica, llama herramientas o espera
aprobación, y luego convierte ese borrador en la respuesta final cuando el canal puede
hacerlo de forma segura.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Usa borradores de progreso cuando quieras un único mensaje de estado ordenado durante trabajo intensivo con herramientas
y la respuesta final cuando el turno haya terminado.

## Inicio Rápido

Habilita los borradores de progreso por canal con `streaming.mode: "progress"`:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

Eso suele ser suficiente. OpenClaw elegirá una etiqueta automática de una palabra, añadirá
líneas de progreso compactas mientras ocurra trabajo útil y suprimirá el ruido de progreso
independiente duplicado para ese turno.

## Lo Que Ven Los Usuarios

Un borrador de progreso tiene dos partes:

| Parte              | Propósito                                                         |
| ------------------ | ----------------------------------------------------------------- |
| Etiqueta           | Un título corto como `Thinking` o `Shelling`.                     |
| Líneas de progreso | Actualizaciones compactas de ejecución como llamadas a herramientas, pasos de tareas o aprobaciones. |

La etiqueta aparece de inmediato cuando el agente empieza a responder. Las líneas de progreso se
añaden solo cuando el agente emite actualizaciones de trabajo útiles. La respuesta final reemplaza
el borrador cuando es posible; de lo contrario, OpenClaw envía la respuesta final normalmente y
limpia o deja de actualizar el borrador según el transporte del canal.

## Elige Un Modo

`channels.<channel>.streaming.mode` controla el comportamiento visible en curso:

| Modo       | Ideal para                         | Lo que aparece en el chat                         |
| ---------- | ---------------------------------- | ------------------------------------------------- |
| `off`      | Canales silenciosos                | Solo la respuesta final.                          |
| `partial`  | Ver aparecer el texto de respuesta | Un borrador editado con el texto de respuesta más reciente. |
| `block`    | Fragmentos mayores de vista previa de respuesta | Una vista previa actualizada o añadida en fragmentos más grandes. |
| `progress` | Turnos intensivos con herramientas o de larga duración | Un borrador de estado y luego la respuesta final. |

Elige `progress` cuando a los usuarios les importe más "qué está ocurriendo" que ver
el texto de respuesta transmitirse token por token.

Elige `partial` cuando la respuesta en sí sea la señal de progreso.

Elige `block` cuando quieras actualizaciones de vista previa del borrador en fragmentos de texto más grandes. En
Discord y Telegram, `streaming.mode: "block"` sigue siendo streaming de vista previa, no
entrega normal por bloques. Usa `streaming.block.enabled` o el valor heredado
`blockStreaming` cuando quieras respuestas normales por bloques.

## Configura Etiquetas

Las etiquetas de progreso viven en `channels.<channel>.streaming.progress`.

La etiqueta predeterminada es `auto`, que elige del conjunto integrado de etiquetas de una sola palabra
de OpenClaw:

```text
Thinking
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

Usa una etiqueta fija:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Usa tu propio conjunto automático de etiquetas:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Oculta la etiqueta y muestra solo las líneas de progreso:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## Controla Las Líneas De Progreso

Las líneas de progreso están habilitadas de forma predeterminada en el modo de progreso. Provienen de eventos reales de
ejecución: inicios de herramientas, actualizaciones de elementos, planes de tareas, aprobaciones, salida de comandos, resúmenes
de parches y actividad similar del agente.

Limita cuántas líneas permanecen visibles:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

Mantén el único borrador de progreso, pero oculta las líneas de herramientas y tareas:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Con `toolProgress: false`, OpenClaw sigue suprimiendo los mensajes independientes
más antiguos de progreso de herramientas para ese turno. El canal permanece visualmente silencioso hasta la
respuesta final, salvo por la etiqueta si hay una configurada.

## Comportamiento Del Canal

Cada canal usa el transporte más limpio que admite:

| Canal           | Transporte de progreso                  | Notas                                                                 |
| --------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envía un mensaje y luego lo edita.      | El texto final se edita en el mismo lugar cuando cabe en un mensaje seguro de vista previa. |
| Matrix          | Envía un evento y luego lo edita.       | La configuración de streaming de nivel de cuenta controla los borradores de nivel de cuenta. |
| Microsoft Teams | Stream nativo de Teams en chats personales. | `streaming.mode: "block"` se asigna a la entrega por bloques de Teams. |
| Slack           | Stream nativo o publicación de borrador editable. | La disponibilidad del hilo afecta si se puede usar streaming nativo. |
| Telegram        | Envía un mensaje y luego lo edita.      | Los borradores visibles antiguos pueden reemplazarse para que las marcas de tiempo finales sigan siendo útiles. |
| Mattermost      | Publicación de borrador editable.       | La actividad de herramientas se incorpora en la misma publicación de estilo borrador. |

Los canales sin soporte de edición seguro suelen recurrir a indicadores de escritura o
entrega solo final.

## Finalización

Cuando la respuesta final está lista, OpenClaw intenta mantener limpio el chat:

- Si el borrador puede convertirse de forma segura en la respuesta final, OpenClaw lo edita en el mismo lugar.
- Si el canal usa streaming de progreso nativo, OpenClaw finaliza ese stream
  cuando el transporte nativo acepta el texto final.
- Si la respuesta final tiene medios, una solicitud de aprobación, un destino explícito de respuesta,
  demasiados fragmentos o un fallo de edición/envío, OpenClaw envía la respuesta final mediante
  la ruta normal de entrega del canal.

La ruta alternativa es intencional. Es mejor enviar una respuesta final nueva que
perder texto, colocar una respuesta en el hilo incorrecto o sobrescribir un borrador con una carga útil que el canal
no puede representar de forma segura.

## Solución De Problemas

**Solo veo la respuesta final.**

Comprueba que `channels.<channel>.streaming.mode` esté configurado como `progress` para la
cuenta o el canal que gestionó el mensaje. Algunas rutas de grupo o de respuesta citada pueden
deshabilitar las vistas previas de borrador para un turno cuando el canal no puede editar de forma segura el mensaje
correcto.

**Veo la etiqueta, pero no líneas de herramientas.**

Comprueba `streaming.progress.toolProgress`. Si es `false`, OpenClaw mantiene el
comportamiento de borrador único, pero oculta las líneas de progreso de herramientas y tareas.

**Veo un mensaje final nuevo en lugar de un borrador editado.**

Ese es un mecanismo alternativo de seguridad. Puede ocurrir con respuestas con medios, respuestas largas,
destinos explícitos de respuesta, borradores antiguos de Telegram, destinos de hilo de Slack ausentes,
mensajes de vista previa eliminados o fallos al finalizar streams nativos.

**Sigo viendo mensajes de progreso independientes.**

El modo de progreso suprime los mensajes independientes predeterminados de progreso de herramientas cuando un borrador
está activo. Si siguen apareciendo mensajes independientes, verifica que el turno esté usando realmente
el modo de progreso y no `streaming.mode: "off"` ni una ruta de canal que
no pueda crear un borrador para ese mensaje.

**Teams se comporta de forma diferente a Discord o Telegram.**

Microsoft Teams usa un stream nativo en chats personales en lugar del transporte genérico
de envío y edición de vista previa. Teams también trata `streaming.mode: "block"` como
entrega por bloques de Teams porque no tiene el mismo modo de bloque de vista previa de borrador
que usan Discord y Telegram.

## Relacionado

- [Streaming y fragmentación](/es/concepts/streaming)
- [Mensajes](/es/concepts/messages)
- [Configuración de canal](/es/gateway/config-channels)
- [Discord](/es/channels/discord)
- [Matrix](/es/channels/matrix)
- [Microsoft Teams](/es/channels/msteams)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
