---
read_when:
    - Configuración de actualizaciones de progreso visibles para turnos de chat de larga duración
    - Elegir entre los modos de transmisión parcial, por bloques y de progreso
    - Explicación de cómo OpenClaw actualiza un mensaje de canal mientras el trabajo está en curso
    - Solución de problemas de borradores de progreso, mensajes de progreso independientes o fallback de finalización
summary: 'Borradores de progreso: un mensaje visible de trabajo en curso que se actualiza mientras se ejecuta un agente'
title: Borradores de progreso
x-i18n:
    generated_at: "2026-07-05T11:15:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e284f9a7895ac9111608899ba8a4b4824a10159bc38b4158928bdf7fd3c45cd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Los borradores de progreso convierten un mensaje de canal en una línea de estado en vivo mientras un agente trabaja, en lugar de una pila de respuestas temporales de "sigo trabajando". Configura `channels.<channel>.streaming.mode: "progress"` y OpenClaw crea el mensaje cuando empieza el trabajo real, lo edita mientras el agente lee, planifica, llama herramientas o espera aprobación, y luego lo convierte en la respuesta final.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

<Note>
  Discord ya usa `streaming.mode: "progress"` de forma predeterminada cuando
  `channels.discord.streaming.mode`/`streamMode` no están configurados, por lo que los borradores de progreso
  aparecen allí sin ninguna configuración. Todos los demás canales usan `partial`
  u `off` de forma predeterminada; consulta [Streaming y fragmentación](/es/concepts/streaming#channel-mapping)
  para ver la tabla completa de valores predeterminados por canal.
</Note>

## Inicio rápido

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

Valores predeterminados desde aquí: una etiqueta automática de una palabra, un retraso inicial de 5 segundos
(o inmediatamente con un segundo evento de trabajo), líneas de progreso compactas mientras ocurre trabajo útil
y supresión de los mensajes de progreso independientes más antiguos para ese turno.

Esta página cubre la experiencia de borradores de progreso y sus controles de configuración. Para ver la
matriz completa de modos de streaming, notas de ejecución por canal y migración de claves heredadas,
consulta [Streaming y fragmentación](/es/concepts/streaming).

## Lo que ven los usuarios

| Parte           | Propósito                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| Etiqueta          | Línea breve inicial/de estado como `Working` o `Shelling`.                        |
| Líneas de progreso | Actualizaciones compactas de ejecución que usan los mismos iconos de herramientas y formateador de detalles que `/verbose`. |

La etiqueta aparece cuando el agente inicia trabajo significativo y sigue ocupado durante el
retraso inicial, o cuando se dispara inmediatamente un segundo evento de trabajo. Se ubica en la parte superior de
la lista continua de líneas de progreso, por lo que desaparece al desplazarse cuando aparecen suficientes líneas
de trabajo concretas. Las respuestas de solo texto sin formato nunca muestran un borrador de progreso; una línea
aparece solo para actualizaciones de trabajo reales, por ejemplo `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"` o `✍️ Write: to /tmp/file`.

La respuesta final reemplaza el borrador en el mismo lugar cuando el canal puede hacerlo de forma segura;
de lo contrario, OpenClaw envía la respuesta final mediante la entrega normal y
limpia o deja de actualizar el borrador (consulta [Finalización](#finalization)).

## Elegir un modo

`channels.<channel>.streaming.mode` controla el comportamiento visible mientras está en progreso:

| Modo       | Ideal para                         | Qué aparece en el chat                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Canales silenciosos                   | Solo la respuesta final.                            |
| `partial`  | Ver aparecer el texto de la respuesta      | Un borrador editado con el texto más reciente de la respuesta.     |
| `block`    | Fragmentos más grandes de vista previa de respuesta     | Una vista previa actualizada o añadida en fragmentos más grandes. |
| `progress` | Turnos con muchas herramientas o de larga duración | Un borrador de estado y luego la respuesta final.          |

Elige `progress` cuando a los usuarios les importe más "qué está ocurriendo" que ver
el texto de la respuesta transmitirse token por token; `partial` cuando el propio texto de la respuesta sea
la señal de progreso; `block` para fragmentos más grandes de vista previa. En Discord y
Telegram, `streaming.mode: "block"` sigue siendo streaming de vista previa, no entrega normal
de respuestas en bloque; usa `streaming.block.enabled` (o el heredado
`blockStreaming`) para eso.

## Configurar etiquetas

Las etiquetas de progreso viven en `channels.<channel>.streaming.progress`. La
`label` predeterminada es `"auto"`, que elige entre el conjunto integrado de OpenClaw de
etiquetas de una sola palabra:

```text
Working, Shelling, Scuttling, Clawing, Pinching, Molting, Bubbling, Tiding,
Reefing, Cracking, Sifting, Brining, Nautiling, Krilling, Barnacling,
Lobstering, Tidepooling, Pearling, Snapping, Surfacing
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

Usa tu propio conjunto de etiquetas (todavía se elige al azar/por semilla cuando `label: "auto"`):

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

## Controlar líneas de progreso

Las líneas de progreso provienen de eventos reales de ejecución: inicios de herramientas, actualizaciones de elementos, planes de tareas, aprobaciones, salida de comandos, resúmenes de parches y actividad similar del agente.
Están habilitadas de forma predeterminada (`progress.toolProgress`, valor predeterminado `true`).

Las herramientas también pueden emitir progreso tipado mientras una llamada individual sigue en ejecución. Así es
como una obtención o búsqueda lenta actualiza el borrador visible antes de que la herramienta
devuelva su resultado final. La actualización de progreso es un resultado parcial de herramienta con
contenido de modelo vacío y metadatos explícitos de canal público:

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw renderiza solo `progress.text` en la interfaz de progreso del canal. El resultado normal
de la herramienta sigue llegando más tarde como `content`/`details` y es la única parte
devuelta al modelo.

Al añadir progreso a una herramienta, emite un mensaje breve y genérico, y retrásalo
hasta que la operación haya estado pendiente el tiempo suficiente para ser útil. `web_fetch`
hace exactamente esto con un retraso de 5 segundos:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Las llamadas rápidas no muestran una línea de progreso; las llamadas largas muestran una mientras siguen pendientes;
las llamadas canceladas borran el temporizador antes de que pueda aparecer progreso obsoleto. El texto de progreso
es un canal lateral público de la interfaz de usuario, por lo que nunca debe incluir secretos, argumentos sin procesar,
contenido obtenido, salida de comandos ni texto de páginas.

### Modo de detalle

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

`"explain"` es el valor predeterminado y mantiene los borradores estables con etiquetas concisas.
`"raw"` añade el comando subyacente cuando está disponible, lo cual es útil durante
la depuración pero genera más ruido en el chat. Por ejemplo, una llamada `node --check /tmp/app.js`
se representa de forma distinta según el modo:

| Modo      | Línea de progreso                                             |
| --------- | ------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                          |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Texto de comando/exec

`streaming.progress.commandText` (valor predeterminado `"raw"`) controla cuánto detalle del comando
se muestra junto a las líneas de progreso de exec/bash, independientemente del modo de detalle
anterior. Establécelo en `"status"` para mantener visible una línea de progreso de herramienta mientras se oculta
por completo el texto del comando:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Carril de comentario

`streaming.progress.commentary` (valor predeterminado `false`) intercala la narración de comentario/preámbulo
previa a la herramienta del modelo (💬, por ejemplo "I'll check... then
...") con las líneas de herramienta en el borrador. Consulta
[Streaming y fragmentación](/es/concepts/streaming#commentary-progress-lane) para ver la
forma de configuración compartida entre canales.

### Límites de líneas

Limita cuántas líneas permanecen visibles (valor predeterminado 8):

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

Las líneas de progreso se compactan automáticamente para reducir el reflujo de burbujas de chat mientras
se edita el borrador, y OpenClaw trunca las líneas largas para que las ediciones repetidas del borrador
no se ajusten de forma distinta en cada actualización. El presupuesto predeterminado por línea es de 120
caracteres; la prosa se corta en un límite de palabra, mientras que los detalles largos, como rutas o
comandos sin procesar, se acortan con puntos suspensivos en medio para que el sufijo permanezca visible.

Ajusta el presupuesto por línea:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

### Representación enriquecida (Slack)

Slack puede representar las líneas de progreso como campos estructurados de Block Kit en lugar de
texto sin formato:

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

La representación enriquecida siempre envía el mismo cuerpo de texto sin formato junto con los campos de Block Kit,
por lo que los clientes que no pueden representar la forma más enriquecida siguen mostrando el texto de progreso
compacto.

### Ocultar líneas de herramienta/tarea

Mantén el único borrador de progreso, pero oculta las líneas de herramienta y tarea:

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
de progreso de herramienta para ese turno: el canal permanece visualmente silencioso hasta
la respuesta final, excepto por la etiqueta si hay una configurada.

## Comportamiento del canal

| Canal           | Transporte de progreso                  | Notas                                                                                                                                                              |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord         | Envía un mensaje y luego lo edita.      | Usa el modo `progress` de forma predeterminada; el texto final se edita en el mismo lugar cuando cabe en un mensaje de vista previa seguro.                         |
| Matrix          | Envía un evento y luego lo edita.       | La configuración de streaming a nivel de cuenta controla los borradores a nivel de cuenta.                                                                          |
| Microsoft Teams | Stream nativo de Teams en chats personales. | `streaming.mode: "block"` se asigna en su lugar a la entrega por bloques de Teams.                                                                              |
| Slack           | Stream nativo o publicación de borrador editable. | Necesita un destino de hilo de respuesta; los MD de nivel superior sin uno siguen recibiendo publicaciones de vista previa de borrador y ediciones.          |
| Telegram        | Envía un mensaje y luego lo edita.      | Si llega un mensaje entre el borrador de progreso y la respuesta, el borrador se vuelve a publicar debajo de él (publicar nuevo y luego eliminar antiguo) en lugar de desplazar bruscamente el cliente. |
| Mattermost      | Publicación de borrador editable.       | La actividad de herramientas se integra en la misma publicación de estilo borrador.                                                                                 |

Los canales sin soporte de edición segura recurren a indicadores de escritura o
entrega solo final. Consulta [Streaming y fragmentación](/es/concepts/streaming) para ver el
desglose completo del comportamiento en tiempo de ejecución por canal.

## Finalización

Cuando la respuesta final está lista, OpenClaw intenta mantener el chat limpio:

- Si el borrador puede convertirse de forma segura en la respuesta final, OpenClaw lo edita en el lugar.
- Si el canal usa transmisión de progreso nativa, OpenClaw finaliza esa
  transmisión cuando el transporte nativo acepta el texto final.
- De lo contrario (medios, una solicitud de aprobación, un destino de respuesta explícito, demasiados
  fragmentos, o un fallo al editar/enviar), OpenClaw envía la respuesta final a través de la
  ruta normal de entrega del canal en lugar de sobrescribir el borrador.

La alternativa de reserva es intencional: enviar una respuesta final nueva es mejor que perder texto,
encadenar mal una respuesta o sobrescribir un borrador con una carga que el canal
no puede representar de forma segura.

## Solución de problemas

**Solo veo la respuesta final.**

Comprueba que `channels.<channel>.streaming.mode` sea `progress` para la cuenta
o el canal que gestionó el mensaje. Algunas rutas de grupo o de respuesta con cita desactivan
las vistas previas de borrador para un turno cuando el canal no puede editar de forma segura el
mensaje correcto.

**Veo la etiqueta, pero no líneas de herramientas.**

Comprueba `streaming.progress.toolProgress`. Si es `false`, OpenClaw mantiene el
comportamiento de borrador único, pero oculta las líneas de progreso de herramientas y tareas.

**Veo un mensaje final nuevo en lugar de un borrador editado.**

Esa es la alternativa de seguridad descrita en [Finalización](#finalization). Puede
ocurrir con respuestas multimedia, respuestas largas, destinos de respuesta explícitos, borradores antiguos de Telegram,
destinos de hilo de Slack ausentes, mensajes de vista previa eliminados o finalización fallida
de transmisión nativa.

**Sigo viendo mensajes de progreso independientes.**

El modo de progreso suprime los mensajes independientes predeterminados de progreso de herramientas siempre que haya un
borrador activo. Si siguen apareciendo mensajes independientes, confirma que el turno está
usando realmente el modo `progress` y no `streaming.mode: "off"` ni una ruta de
canal que no pueda crear un borrador para ese mensaje.

**Teams se comporta de forma diferente a Discord o Telegram.**

Microsoft Teams usa una transmisión nativa en chats personales en lugar del transporte genérico
de vista previa de enviar y editar, y asigna `streaming.mode: "block"` a la entrega en bloque de Teams
porque no tiene un modo de bloque con vista previa de borrador como Discord y
Telegram.

## Relacionado

- [Transmisión y fragmentación](/es/concepts/streaming)
- [Mensajes](/es/concepts/messages)
- [Configuración de canales](/es/gateway/config-channels)
- [Discord](/es/channels/discord)
- [Matrix](/es/channels/matrix)
- [Microsoft Teams](/es/channels/msteams)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
- [Mattermost](/es/channels/mattermost)
