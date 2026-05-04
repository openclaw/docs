---
read_when:
    - Configurar actualizaciones visibles de progreso para turnos de chat de larga duración
    - Elegir entre los modos de transmisión parcial, por bloques y de progreso
    - Explicación de cómo OpenClaw actualiza un mensaje de canal mientras el trabajo está en curso
    - Solución de problemas de borradores de progreso, mensajes de progreso independientes o mecanismo alternativo de finalización
summary: 'Borradores de progreso: un mensaje visible de trabajo en curso que se actualiza mientras se ejecuta un agente'
title: Borradores de progreso
x-i18n:
    generated_at: "2026-05-04T02:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Los borradores de progreso hacen que los turnos largos de agentes parezcan vivos en el chat sin convertir
la conversación en una pila de respuestas temporales de estado.

Cuando los borradores de progreso están habilitados, OpenClaw crea un único mensaje visible de trabajo en curso
solo después de que el turno demuestra que está haciendo trabajo real, lo actualiza mientras el
agente lee, planifica, llama herramientas o espera aprobación, y luego convierte ese borrador
en la respuesta final cuando el canal puede hacerlo de forma segura.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Usa borradores de progreso cuando quieras un único mensaje de estado ordenado durante trabajo intenso con herramientas
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

Eso suele ser suficiente. OpenClaw elegirá una etiqueta automática de una palabra, esperará
hasta que el trabajo dure al menos cinco segundos o emita un segundo evento de trabajo, añadirá líneas compactas
de progreso mientras ocurra trabajo útil y suprimirá el ruido de progreso independiente duplicado
para ese turno.

## Qué Ven Los Usuarios

Un borrador de progreso tiene dos partes:

| Parte              | Propósito                                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| Etiqueta           | Un título corto como `Thinking...` o `Shelling...`.                         |
| Líneas de progreso | Actualizaciones compactas de ejecución con las mismas etiquetas e iconos de herramientas que la salida detallada. |

La etiqueta aparece después de que el agente inicia trabajo significativo y permanece ocupado
durante cinco segundos o emite un segundo evento de trabajo. Las respuestas de solo texto simple no
muestran un borrador de progreso. Las líneas de progreso se añaden solo cuando el agente emite actualizaciones de trabajo
útiles, por ejemplo `🛠️ Exec`, `🔎 Web Search` o `✍️ Write: to /tmp/file`.
De forma predeterminada usan el mismo modo de explicación compacto que `/verbose`; establece
`agents.defaults.toolProgressDetail: "raw"` al depurar y cuando también quieras que se anexen comandos/detalles
sin procesar.
La respuesta final reemplaza el borrador cuando es posible; de lo contrario,
OpenClaw envía la respuesta final normalmente y limpia o deja de actualizar el
borrador según el transporte del canal.

## Elige Un Modo

`channels.<channel>.streaming.mode` controla el comportamiento visible en curso:

| Modo       | Ideal para                                | Qué aparece en el chat                                |
| ---------- | ----------------------------------------- | ----------------------------------------------------- |
| `off`      | Canales silenciosos                       | Solo la respuesta final.                              |
| `partial`  | Ver aparecer el texto de la respuesta     | Un borrador editado con el texto más reciente de la respuesta. |
| `block`    | Fragmentos de vista previa de respuesta más grandes | Una vista previa actualizada o anexada en fragmentos más grandes. |
| `progress` | Turnos intensos con herramientas o de larga duración | Un borrador de estado y luego la respuesta final.     |

Elige `progress` cuando a los usuarios les importe más "qué está pasando" que ver
el texto de la respuesta transmitirse token por token.

Elige `partial` cuando la propia respuesta sea la señal de progreso.

Elige `block` cuando quieras actualizaciones de borrador de vista previa en fragmentos de texto más grandes. En
Discord y Telegram, `streaming.mode: "block"` sigue siendo transmisión de vista previa, no
entrega normal por bloques. Usa `streaming.block.enabled` o el heredado
`blockStreaming` cuando quieras respuestas normales por bloques.

## Configura Etiquetas

Las etiquetas de progreso viven en `channels.<channel>.streaming.progress`.

La etiqueta predeterminada es `auto`, que elige del conjunto integrado de etiquetas de OpenClaw
de una sola palabra con puntos suspensivos:

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
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

Las líneas de progreso están habilitadas de forma predeterminada en el modo de progreso. Provienen de eventos de ejecución
reales: inicios de herramientas, actualizaciones de elementos, planes de tareas, aprobaciones, salida de comandos, resúmenes
de parches y actividad similar del agente.

OpenClaw usa el mismo formateador para borradores de progreso y `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` es el valor predeterminado y mantiene los borradores estables con etiquetas concisas como
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` anexa el
comando/detalle subyacente cuando está disponible, lo que es útil al depurar pero genera más ruido en
el chat.

Por ejemplo, el mismo comando aparece de forma diferente según el modo de detalle:

| Modo      | Línea de progreso                                                  |
| --------- | ------------------------------------------------------------------ |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                         |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Mantén el único borrador de progreso pero oculta las líneas de herramientas y tareas:

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

Con `toolProgress: false`, OpenClaw aún suprime los mensajes de progreso de herramientas independientes
anteriores para ese turno. El canal permanece visualmente silencioso hasta la
respuesta final, excepto por la etiqueta si hay una configurada.

## Comportamiento Del Canal

Cada canal usa el transporte más limpio que admite:

| Canal           | Transporte de progreso                  | Notas                                                                 |
| --------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envía un mensaje y luego lo edita.      | El texto final se edita en el mismo lugar cuando cabe en un mensaje de vista previa seguro. |
| Matrix          | Envía un evento y luego lo edita.       | La configuración de transmisión a nivel de cuenta controla los borradores a nivel de cuenta. |
| Microsoft Teams | Transmisión nativa de Teams en chats personales. | `streaming.mode: "block"` se asigna a la entrega por bloques de Teams. |
| Slack           | Transmisión nativa o publicación de borrador editable. | La disponibilidad de hilos afecta si se puede usar la transmisión nativa. |
| Telegram        | Envía un mensaje y luego lo edita.      | Los borradores visibles antiguos pueden reemplazarse para que las marcas de tiempo finales sigan siendo útiles. |
| Mattermost      | Publicación de borrador editable.       | La actividad de herramientas se integra en la misma publicación de estilo borrador. |

Los canales sin soporte seguro de edición suelen recurrir a indicadores de escritura o
entrega solo final.

## Finalización

Cuando la respuesta final está lista, OpenClaw intenta mantener el chat limpio:

- Si el borrador puede convertirse de forma segura en la respuesta final, OpenClaw lo edita en el mismo lugar.
- Si el canal usa transmisión de progreso nativa, OpenClaw finaliza esa transmisión
  cuando el transporte nativo acepta el texto final.
- Si la respuesta final tiene medios, una solicitud de aprobación, un destino de respuesta explícito,
  demasiados fragmentos o una edición/envío fallido, OpenClaw envía la respuesta final mediante
  la ruta normal de entrega del canal.

La ruta de respaldo es intencional. Es mejor enviar una respuesta final nueva que
perder texto, enviar una respuesta al hilo equivocado o sobrescribir un borrador con una carga que el canal
no puede representar de forma segura.

## Solución De Problemas

**Solo veo la respuesta final.**

Comprueba que `channels.<channel>.streaming.mode` esté establecido en `progress` para la
cuenta o canal que manejó el mensaje. Algunas rutas de grupos o respuestas con cita pueden
deshabilitar las vistas previas de borrador para un turno cuando el canal no puede editar de forma segura el mensaje
correcto.

**Veo la etiqueta pero no líneas de herramientas.**

Comprueba `streaming.progress.toolProgress`. Si es `false`, OpenClaw mantiene el
comportamiento de borrador único pero oculta las líneas de progreso de herramientas y tareas.

**Veo un mensaje final nuevo en lugar de un borrador editado.**

Ese es un respaldo de seguridad. Puede ocurrir con respuestas multimedia, respuestas largas,
destinos de respuesta explícitos, borradores antiguos de Telegram, destinos de hilo de Slack faltantes,
mensajes de vista previa eliminados o finalización fallida de transmisión nativa.

**Aún veo mensajes de progreso independientes.**

El modo de progreso suprime los mensajes predeterminados de progreso de herramientas independientes cuando hay un borrador
activo. Si los mensajes independientes aún aparecen, verifica que el turno realmente
esté usando el modo de progreso y no `streaming.mode: "off"` ni una ruta de canal que
no puede crear un borrador para ese mensaje.

**Teams se comporta de forma diferente a Discord o Telegram.**

Microsoft Teams usa una transmisión nativa en chats personales en lugar del transporte genérico
de vista previa de enviar y editar. Teams también trata `streaming.mode: "block"` como
entrega por bloques de Teams porque no tiene el mismo modo de bloque de vista previa de borrador
usado por Discord y Telegram.

## Relacionado

- [Transmisión y fragmentación](/es/concepts/streaming)
- [Mensajes](/es/concepts/messages)
- [Configuración de canales](/es/gateway/config-channels)
- [Discord](/es/channels/discord)
- [Matrix](/es/channels/matrix)
- [Microsoft Teams](/es/channels/msteams)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
