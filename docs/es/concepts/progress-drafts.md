---
read_when:
    - Configurar actualizaciones de progreso visibles para turnos de chat de larga duración
    - Elegir entre los modos de transmisión parcial, por bloques y de progreso
    - Explicación de cómo OpenClaw actualiza un mensaje de canal mientras el trabajo está en curso
    - Solución de problemas de borradores de progreso, mensajes de progreso independientes o mecanismo de reserva de finalización
summary: 'Borradores de progreso: un mensaje visible de trabajo en curso que se actualiza mientras se ejecuta un agente'
title: Borradores de progreso
x-i18n:
    generated_at: "2026-05-11T20:32:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d84027a412a2c62ea9a5698d015c7aeb8a7f27d9db79112bb2c1c10f97ebd88
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Los borradores de progreso hacen que los turnos largos de agente se sientan vivos en el chat sin convertir
la conversación en una pila de respuestas de estado temporales.

Cuando los borradores de progreso están habilitados, OpenClaw crea un único mensaje visible de trabajo en curso
solo después de que el turno demuestra que está haciendo trabajo real, lo actualiza mientras el
agente lee, planifica, llama herramientas o espera aprobación, y luego convierte ese borrador
en la respuesta final cuando el canal puede hacerlo de forma segura.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Usa borradores de progreso cuando quieres un único mensaje de estado ordenado durante trabajo intensivo en herramientas
y la respuesta final cuando el turno termina.

## Inicio rápido

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
hasta que el trabajo dure al menos cinco segundos o emita un segundo evento de trabajo, añadirá líneas
de progreso compactas mientras ocurre trabajo útil y suprimirá la charla de progreso independiente duplicada
para ese turno.

## Lo que ven los usuarios

Un borrador de progreso tiene dos partes:

| Parte              | Propósito                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Etiqueta           | Una línea breve inicial/de estado como `Thinking...` o `Shelling...`.                     |
| Líneas de progreso | Actualizaciones de ejecución compactas con los mismos iconos de herramientas y formateador de detalles que la salida detallada. |

La etiqueta aparece después de que el agente inicia trabajo significativo y permanece ocupado
durante cinco segundos o emite un segundo evento de trabajo. Forma parte de la lista continua de líneas
de progreso, por lo que el estado inicial desaparece al desplazarse una vez que aparece suficiente trabajo concreto.
Las respuestas solo de texto sin formato no muestran un borrador de progreso. Las líneas de progreso se añaden
solo cuando el agente emite actualizaciones de trabajo útiles, por ejemplo `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"` o `✍️ Write: to /tmp/file`.
De forma predeterminada usan el mismo modo de explicación compacto que `/verbose`; configura
`agents.defaults.toolProgressDetail: "raw"` al depurar y si también quieres que se anexen comandos/detalles sin procesar.
La respuesta final reemplaza el borrador cuando es posible; de lo contrario
OpenClaw envía la respuesta final normalmente y limpia o deja de actualizar el
borrador según el transporte del canal.

## Elegir un modo

`channels.<channel>.streaming.mode` controla el comportamiento visible en progreso:

| Modo       | Ideal para                         | Lo que aparece en el chat                              |
| ---------- | ---------------------------------- | ------------------------------------------------------ |
| `off`      | Canales silenciosos                | Solo la respuesta final.                               |
| `partial`  | Ver aparecer el texto de respuesta | Un borrador editado con el texto de respuesta más reciente. |
| `block`    | Fragmentos más grandes de vista previa de respuesta | Una vista previa actualizada o anexada en fragmentos más grandes. |
| `progress` | Turnos intensivos en herramientas o de larga duración | Un borrador de estado, luego la respuesta final.       |

Elige `progress` cuando a los usuarios les importa más "qué está pasando" que ver
el texto de la respuesta transmitirse token por token.

Elige `partial` cuando la respuesta en sí sea la señal de progreso.

Elige `block` cuando quieras actualizaciones de vista previa de borrador en fragmentos de texto más grandes. En
Discord y Telegram, `streaming.mode: "block"` sigue siendo streaming de vista previa, no
entrega normal en bloques. Usa `streaming.block.enabled` o el valor heredado
`blockStreaming` cuando quieras respuestas normales en bloques.

## Configurar etiquetas

Las etiquetas de progreso viven en `channels.<channel>.streaming.progress`.

La etiqueta predeterminada es `auto`, que elige del conjunto integrado de OpenClaw
de etiquetas de una sola palabra con puntos suspensivos:

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

Usa tu propio conjunto de etiquetas automáticas:

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

Oculta la etiqueta y muestra solo líneas de progreso:

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

## Controlar las líneas de progreso

Las líneas de progreso están habilitadas de forma predeterminada en modo de progreso. Provienen de eventos reales de ejecución:
inicios de herramientas, actualizaciones de elementos, planes de tareas, aprobaciones, salida de comandos, resúmenes
de parches y actividad similar del agente.

OpenClaw usa el mismo formateador para los borradores de progreso y `/verbose`:

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
`🛠️ check JS syntax for /tmp/app.js`. `"raw"` anexa el comando/detalle subyacente
cuando está disponible, lo cual es útil durante la depuración pero genera más ruido en el
chat.

Por ejemplo, el mismo comando aparece de forma diferente según el modo de detalle:

| Modo      | Línea de progreso                                           |
| --------- | ----------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                        |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Las líneas de progreso se compactan automáticamente para reducir el reajuste de la burbuja de chat mientras se edita el borrador.

OpenClaw trunca las líneas de progreso largas de forma predeterminada para que las ediciones repetidas del borrador no
se ajusten de forma diferente en cada actualización. El prefijo permanece legible, y los detalles largos
como rutas o comandos sin procesar se acortan con puntos suspensivos.

Slack puede renderizar líneas de progreso como campos estructurados de Block Kit en lugar de un
único cuerpo de texto:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

El renderizado enriquecido mantiene la misma alternativa de texto sin formato para que los canales y clientes que
no admiten la forma más rica aún puedan mostrar el texto de progreso compacto.

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

Con `toolProgress: false`, OpenClaw aún suprime los mensajes independientes más antiguos
de progreso de herramientas para ese turno. El canal permanece visualmente silencioso hasta la
respuesta final, excepto por la etiqueta si hay una configurada.

## Comportamiento de canales

Cada canal usa el transporte más limpio que admite:

| Canal           | Transporte de progreso                  | Notas                                                                 |
| --------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envía un mensaje y luego lo edita.      | El texto final se edita en su lugar cuando cabe en un mensaje seguro de vista previa. |
| Matrix          | Envía un evento y luego lo edita.       | La configuración de streaming a nivel de cuenta controla los borradores a nivel de cuenta. |
| Microsoft Teams | Stream nativo de Teams en chats personales. | `streaming.mode: "block"` se asigna a la entrega en bloques de Teams. |
| Slack           | Stream nativo o publicación de borrador editable. | La disponibilidad del hilo afecta si se puede usar streaming nativo.  |
| Telegram        | Envía un mensaje y luego lo edita.      | Los borradores visibles más antiguos pueden reemplazarse para que las marcas de tiempo finales sigan siendo útiles. |
| Mattermost      | Publicación de borrador editable.       | La actividad de herramientas se incorpora en la misma publicación de estilo borrador. |

Los canales sin soporte de edición segura normalmente recurren a indicadores de escritura o
entrega solo final.

## Finalización

Cuando la respuesta final está lista, OpenClaw intenta mantener limpio el chat:

- Si el borrador puede convertirse de forma segura en la respuesta final, OpenClaw lo edita en su lugar.
- Si el canal usa streaming de progreso nativo, OpenClaw finaliza ese stream
  cuando el transporte nativo acepta el texto final.
- Si la respuesta final tiene medios, una solicitud de aprobación, un destino explícito de respuesta,
  demasiados fragmentos o un envío/edición fallido, OpenClaw envía la respuesta final mediante
  la ruta normal de entrega del canal.

La ruta alternativa es intencional. Es mejor enviar una nueva respuesta final que
perder texto, enhebrar mal una respuesta o sobrescribir un borrador con una carga que el canal
no puede representar de forma segura.

## Solución de problemas

**Solo veo la respuesta final.**

Comprueba que `channels.<channel>.streaming.mode` esté establecido en `progress` para la
cuenta o el canal que gestionó el mensaje. Algunas rutas de grupo o de respuesta con cita pueden
deshabilitar las vistas previas de borrador para un turno cuando el canal no puede editar de forma segura el mensaje
correcto.

**Veo la etiqueta pero no líneas de herramientas.**

Comprueba `streaming.progress.toolProgress`. Si es `false`, OpenClaw conserva el
comportamiento de borrador único pero oculta las líneas de progreso de herramientas y tareas.

**Veo un mensaje final nuevo en lugar de un borrador editado.**

Eso es una ruta alternativa de seguridad. Puede ocurrir con respuestas con medios, respuestas largas,
destinos explícitos de respuesta, borradores antiguos de Telegram, destinos de hilo de Slack faltantes,
mensajes de vista previa eliminados o finalización fallida de stream nativo.

**Sigo viendo mensajes de progreso independientes.**

El modo de progreso suprime los mensajes independientes predeterminados de progreso de herramientas cuando hay un borrador
activo. Si aún aparecen mensajes independientes, verifica que el turno realmente
esté usando el modo de progreso y no `streaming.mode: "off"` ni una ruta de canal que
no pueda crear un borrador para ese mensaje.

**Teams se comporta de forma diferente a Discord o Telegram.**

Microsoft Teams usa un stream nativo en chats personales en lugar del transporte genérico
de vista previa de enviar y editar. Teams también trata `streaming.mode: "block"` como
entrega en bloques de Teams porque no tiene el mismo modo de bloques de vista previa de borrador
usado por Discord y Telegram.

## Relacionado

- [Streaming y fragmentación](/es/concepts/streaming)
- [Mensajes](/es/concepts/messages)
- [Configuración de canales](/es/gateway/config-channels)
- [Discord](/es/channels/discord)
- [Matrix](/es/channels/matrix)
- [Microsoft Teams](/es/channels/msteams)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
