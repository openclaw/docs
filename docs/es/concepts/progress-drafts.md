---
read_when:
    - Configuración de actualizaciones de progreso visibles para turnos de chat de larga duración
    - Elegir entre los modos de transmisión parcial, por bloque y de progreso
    - Explicación de cómo OpenClaw actualiza un mensaje de canal mientras el trabajo está en curso
    - Solución de problemas de borradores de progreso, mensajes de progreso independientes o mecanismo de reserva de finalización
summary: 'Borradores de progreso: un mensaje visible de trabajo en curso que se actualiza mientras se ejecuta un agente'
title: Borradores de progreso
x-i18n:
    generated_at: "2026-05-04T05:28:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f78c07866cd7f613012a80a40413e5866c1dd2edd477088f9fc141347f5f3788
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Los borradores de progreso hacen que los turnos largos de agentes se sientan vivos en el chat sin convertir la conversación en una pila de respuestas temporales de estado.

Cuando los borradores de progreso están habilitados, OpenClaw crea un único mensaje visible de trabajo en curso solo después de que el turno demuestra que está haciendo trabajo real, lo actualiza mientras el agente lee, planifica, llama a herramientas o espera aprobación, y luego convierte ese borrador en la respuesta final cuando el canal puede hacerlo de forma segura.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Usa borradores de progreso cuando quieras un único mensaje de estado ordenado durante trabajos con muchas herramientas y la respuesta final cuando el turno termine.

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

Eso suele ser suficiente. OpenClaw elegirá una etiqueta automática de una palabra, esperará hasta que el trabajo dure al menos cinco segundos o emita un segundo evento de trabajo, añadirá líneas de progreso compactas mientras ocurra trabajo útil y suprimirá los mensajes de progreso independientes duplicados para ese turno.

## Lo que ven los usuarios

Un borrador de progreso tiene dos partes:

| Parte               | Propósito                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| Etiqueta            | Un título breve como `Thinking...` o `Shelling...`.                          |
| Líneas de progreso  | Actualizaciones compactas de ejecución que usan las mismas etiquetas e iconos de herramientas que la salida detallada. |

La etiqueta aparece después de que el agente inicia trabajo significativo y permanece ocupado durante cinco segundos o emite un segundo evento de trabajo. Las respuestas de solo texto sin formato no muestran un borrador de progreso. Las líneas de progreso se añaden solo cuando el agente emite actualizaciones de trabajo útiles, por ejemplo `🛠️ Exec`, `🔎 Web Search` o `✍️ Write: to /tmp/file`. De forma predeterminada, usan el mismo modo explicativo compacto que `/verbose`; configura `agents.defaults.toolProgressDetail: "raw"` cuando depures y también quieras que se añadan comandos o detalles sin procesar.
La respuesta final reemplaza el borrador cuando es posible; de lo contrario, OpenClaw envía la respuesta final con normalidad y limpia o deja de actualizar el borrador según el transporte del canal.

## Elegir un modo

`channels.<channel>.streaming.mode` controla el comportamiento visible de trabajo en curso:

| Modo       | Ideal para                         | Lo que aparece en el chat                                |
| ---------- | ---------------------------------- | -------------------------------------------------------- |
| `off`      | Canales silenciosos                | Solo la respuesta final.                                 |
| `partial`  | Ver aparecer el texto de respuesta | Un borrador editado con el texto de respuesta más reciente. |
| `block`    | Fragmentos más grandes de vista previa de la respuesta | Una vista previa actualizada o añadida en fragmentos más grandes. |
| `progress` | Turnos largos o con muchas herramientas | Un borrador de estado y luego la respuesta final.        |

Elige `progress` cuando a los usuarios les importe más "qué está pasando" que ver el texto de la respuesta transmitirse token por token.

Elige `partial` cuando la respuesta en sí sea la señal de progreso.

Elige `block` cuando quieras actualizaciones de vista previa del borrador en fragmentos de texto más grandes. En Discord y Telegram, `streaming.mode: "block"` sigue siendo streaming de vista previa, no entrega normal por bloques. Usa `streaming.block.enabled` o el valor heredado `blockStreaming` cuando quieras respuestas normales por bloques.

## Configurar etiquetas

Las etiquetas de progreso se encuentran en `channels.<channel>.streaming.progress`.

La etiqueta predeterminada es `auto`, que elige del conjunto integrado de OpenClaw de etiquetas de una sola palabra con puntos suspensivos:

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

## Controlar las líneas de progreso

Las líneas de progreso están habilitadas de forma predeterminada en el modo de progreso. Proceden de eventos de ejecución reales: inicios de herramientas, actualizaciones de elementos, planes de tareas, aprobaciones, salida de comandos, resúmenes de parches y actividad similar del agente.

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

`"explain"` es el valor predeterminado y mantiene los borradores estables con etiquetas concisas como `🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` añade el comando o detalle subyacente cuando está disponible, lo que resulta útil durante la depuración, pero genera más ruido en el chat.

Por ejemplo, el mismo comando aparece de forma diferente según el modo de detalle:

| Modo      | Línea de progreso                                                    |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
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

Las líneas de progreso se compactan automáticamente para reducir el reajuste de las burbujas de chat mientras se edita el borrador.

OpenClaw trunca las líneas de progreso largas de forma predeterminada para que las ediciones repetidas del borrador no
se ajusten de forma diferente en cada actualización. El prefijo permanece legible, y los detalles largos
como rutas o comandos sin procesar se acortan con puntos suspensivos.

Slack puede representar las líneas de progreso como campos estructurados de Block Kit en lugar de un
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

La representación enriquecida mantiene la misma alternativa de texto plano para que los canales y clientes que
no admiten la forma más enriquecida puedan seguir mostrando el texto de progreso compacto.

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

Con `toolProgress: false`, OpenClaw sigue suprimiendo los mensajes independientes antiguos
de progreso de herramientas para ese turno. El canal permanece visualmente silencioso hasta la
respuesta final, excepto por la etiqueta si hay una configurada.

## Comportamiento del canal

Cada canal usa el transporte más limpio que admite:

| Canal           | Transporte de progreso                          | Notas                                                                 |
| --------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envía un mensaje y luego lo edita.              | El texto final se edita in situ cuando cabe en un mensaje de vista previa seguro. |
| Matrix          | Envía un evento y luego lo edita.               | La configuración de streaming de nivel de cuenta controla los borradores de nivel de cuenta. |
| Microsoft Teams | Stream nativo de Teams en chats personales.     | `streaming.mode: "block"` se asigna a la entrega por bloques de Teams. |
| Slack           | Stream nativo o publicación de borrador editable. | La disponibilidad de hilos afecta si se puede usar el streaming nativo. |
| Telegram        | Envía un mensaje y luego lo edita.              | Los borradores visibles antiguos pueden reemplazarse para que las marcas de tiempo finales sigan siendo útiles. |
| Mattermost      | Publicación de borrador editable.               | La actividad de herramientas se integra en la misma publicación de estilo borrador. |

Los canales sin soporte de edición segura normalmente recurren a indicadores de escritura o
entrega solo final.

## Finalización

Cuando la respuesta final está lista, OpenClaw intenta mantener limpio el chat:

- Si el borrador puede convertirse de forma segura en la respuesta final, OpenClaw lo edita in situ.
- Si el canal usa streaming de progreso nativo, OpenClaw finaliza ese stream
  cuando el transporte nativo acepta el texto final.
- Si la respuesta final tiene contenido multimedia, una solicitud de aprobación, un destino de respuesta explícito,
  demasiados fragmentos, o un envío/edición fallido, OpenClaw envía la respuesta final mediante
  la ruta normal de entrega del canal.

La ruta alternativa es intencional. Es mejor enviar una respuesta final nueva que
perder texto, enrutar mal una respuesta en un hilo o sobrescribir un borrador con una carga que el canal
no puede representar de forma segura.

## Solución de problemas

**Solo veo la respuesta final.**

Comprueba que `channels.<channel>.streaming.mode` esté definido como `progress` para la
cuenta o el canal que gestionó el mensaje. Algunas rutas de grupo o de respuesta citada pueden
desactivar las vistas previas de borrador durante un turno cuando el canal no puede editar de forma segura el
mensaje correcto.

**Veo la etiqueta, pero no las líneas de herramientas.**

Comprueba `streaming.progress.toolProgress`. Si es `false`, OpenClaw mantiene el
comportamiento de borrador único, pero oculta las líneas de progreso de herramientas y tareas.

**Veo un mensaje final nuevo en lugar de un borrador editado.**

Es una alternativa de seguridad. Puede ocurrir con respuestas multimedia, respuestas largas,
destinos de respuesta explícitos, borradores antiguos de Telegram, destinos de hilo de Slack ausentes,
mensajes de vista previa eliminados o finalización fallida de streams nativos.

**Sigo viendo mensajes de progreso independientes.**

El modo de progreso suprime los mensajes independientes predeterminados de progreso de herramientas cuando hay un borrador
activo. Si los mensajes independientes siguen apareciendo, verifica que el turno realmente
esté usando el modo de progreso y no `streaming.mode: "off"` ni una ruta de canal que
no pueda crear un borrador para ese mensaje.

**Teams se comporta de forma diferente a Discord o Telegram.**

Microsoft Teams usa un stream nativo en chats personales en lugar del transporte genérico
de vista previa de enviar y editar. Teams también trata `streaming.mode: "block"` como
entrega por bloques de Teams porque no tiene el mismo modo de bloques de vista previa de borrador
que usan Discord y Telegram.

## Relacionado

- [Streaming y fragmentación](/es/concepts/streaming)
- [Mensajes](/es/concepts/messages)
- [Configuración de canales](/es/gateway/config-channels)
- [Discord](/es/channels/discord)
- [Matrix](/es/channels/matrix)
- [Microsoft Teams](/es/channels/msteams)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
