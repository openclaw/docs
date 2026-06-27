---
read_when:
    - Configuración de actualizaciones de progreso visibles para turnos de chat de larga duración
    - Elegir entre los modos de transmisión parcial, por bloque y de progreso
    - Explicación de cómo OpenClaw actualiza un mensaje de canal mientras el trabajo está en curso
    - Solución de problemas de borradores de progreso, mensajes de progreso independientes o reserva de finalización
summary: 'Borradores de progreso: un mensaje visible de trabajo en curso que se actualiza mientras se ejecuta un agente'
title: Borradores de progreso
x-i18n:
    generated_at: "2026-06-27T11:18:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Los borradores de progreso hacen que los turnos largos del agente se sientan vivos en el chat sin convertir
la conversación en una pila de respuestas temporales de estado.

Cuando los borradores de progreso están habilitados, OpenClaw crea un único mensaje visible de trabajo en curso
solo después de que el turno demuestre que está realizando trabajo real, lo actualiza mientras el
agente lee, planifica, llama herramientas o espera aprobación, y luego convierte ese borrador
en la respuesta final cuando el canal puede hacerlo de forma segura.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Usa los borradores de progreso cuando quieras un único mensaje de estado ordenado durante trabajos intensivos en herramientas
y la respuesta final cuando el turno haya terminado.

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

Eso suele ser suficiente. OpenClaw elegirá una etiqueta automática de una sola palabra, esperará
hasta que el trabajo dure al menos cinco segundos o emita un segundo evento de trabajo, añadirá líneas de progreso compactas
mientras ocurra trabajo útil y suprimirá el parloteo de progreso independiente duplicado
para ese turno.

## Lo que ven los usuarios

Un borrador de progreso tiene dos partes:

| Parte              | Propósito                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Etiqueta           | Una línea breve de inicio/estado como `Working` o `Shelling`.                                  |
| Líneas de progreso | Actualizaciones compactas de ejecución que usan los mismos iconos de herramientas y formateador de detalles que la salida detallada. |

La etiqueta aparece después de que el agente inicia trabajo significativo y se mantiene ocupado
durante cinco segundos o emite un segundo evento de trabajo. Forma parte de la lista móvil de líneas de progreso,
por lo que el estado inicial se desplaza fuera de la vista cuando aparecen suficientes trabajos concretos.
Las respuestas solo de texto sin formato no muestran un borrador de progreso. Las líneas de progreso se añaden
solo cuando el agente emite actualizaciones de trabajo útiles, por ejemplo `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"` o `✍️ Write: to /tmp/file`.
De forma predeterminada usan el mismo modo de explicación compacto que `/verbose`; configura
`agents.defaults.toolProgressDetail: "raw"` al depurar y si también quieres que se anexen comandos/detalles sin procesar.
La respuesta final reemplaza el borrador cuando es posible; de lo contrario
OpenClaw envía la respuesta final normalmente y limpia o deja de actualizar el
borrador según el transporte del canal.

## Elegir un modo

`channels.<channel>.streaming.mode` controla el comportamiento visible en curso:

| Modo       | Mejor para                              | Lo que aparece en el chat                                  |
| ---------- | --------------------------------------- | ---------------------------------------------------------- |
| `off`      | Canales silenciosos                     | Solo la respuesta final.                                   |
| `partial`  | Ver aparecer el texto de la respuesta   | Un borrador editado con el texto de respuesta más reciente. |
| `block`    | Fragmentos mayores de vista previa      | Una vista previa actualizada o anexada en fragmentos más grandes. |
| `progress` | Turnos intensivos en herramientas o largos | Un borrador de estado, luego la respuesta final.        |

Elige `progress` cuando a los usuarios les importe más "qué está pasando" que ver
el texto de la respuesta transmitirse token por token.

Elige `partial` cuando la respuesta en sí sea la señal de progreso.

Elige `block` cuando quieras actualizaciones de vista previa del borrador en fragmentos de texto más grandes. En
Discord y Telegram, `streaming.mode: "block"` sigue siendo transmisión de vista previa, no
entrega normal por bloques. Usa `streaming.block.enabled` o el legado
`blockStreaming` cuando quieras respuestas normales por bloques.

## Configurar etiquetas

Las etiquetas de progreso viven en `channels.<channel>.streaming.progress`.

La etiqueta predeterminada es `auto`, que elige del conjunto integrado de etiquetas
de una sola palabra de OpenClaw:

```text
Working
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

## Controlar las líneas de progreso

Las líneas de progreso están habilitadas de forma predeterminada en el modo de progreso. Provienen de eventos reales de ejecución:
inicios de herramientas, actualizaciones de elementos, planes de tareas, aprobaciones, salida de comandos, resúmenes de parches
y actividad similar del agente.

Las herramientas también pueden emitir progreso tipado mientras una sola llamada de herramienta sigue ejecutándose.
Así es como una obtención o búsqueda lenta puede actualizar el borrador visible antes de que la herramienta
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

OpenClaw renderiza solo `progress.text` en la interfaz de progreso del canal. El
resultado normal de la herramienta sigue llegando después como `content` y `details`, y es la
única parte devuelta al modelo.

Al añadir progreso a una herramienta, usa un mensaje breve y genérico, y demóralo hasta
que la operación haya estado pendiente el tiempo suficiente para ser útil:

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

Este patrón significa que las llamadas rápidas no muestran una línea de progreso, las llamadas largas muestran una
mientras siguen pendientes, y las llamadas canceladas limpian el temporizador antes de que pueda aparecer progreso obsoleto.
El texto de progreso es un canal lateral público de interfaz, por lo que no debe
incluir secretos, argumentos sin procesar, contenido obtenido, salida de comandos ni texto de páginas.

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

`"explain"` es el valor predeterminado y mantiene estables los borradores con etiquetas concisas como
`🛠️ check JS syntax for /tmp/app.js`. `"raw"` anexa el
comando/detalle subyacente cuando está disponible, lo que es útil al depurar pero más ruidoso en
el chat.

Por ejemplo, el mismo comando aparece de forma diferente según el modo de detalle:

| Modo      | Línea de progreso                                             |
| --------- | ------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                          |
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

Las líneas de progreso se compactan automáticamente para reducir el reajuste de burbujas de chat mientras se edita el borrador.

OpenClaw trunca las líneas de progreso largas de forma predeterminada para que las ediciones repetidas del borrador no
salten de línea de forma distinta en cada actualización. El presupuesto predeterminado por línea es de 120 caracteres.
La prosa se corta en un límite de palabra, mientras que los detalles largos como rutas o comandos sin procesar
se acortan con puntos suspensivos en el medio para que el sufijo siga visible.

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

El renderizado enriquecido conserva la misma alternativa de texto sin formato para que los canales y clientes que
no admiten la forma más rica puedan seguir mostrando el texto de progreso compacto.

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

Con `toolProgress: false`, OpenClaw sigue suprimiendo los mensajes independientes antiguos
de progreso de herramientas para ese turno. El canal permanece visualmente silencioso hasta la
respuesta final, salvo por la etiqueta si hay una configurada.

## Comportamiento del canal

Cada canal usa el transporte más limpio que admite:

| Canal           | Transporte de progreso                  | Notas                                                                 |
| --------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envía un mensaje y luego lo edita.      | El texto final se edita en el lugar cuando cabe en un mensaje de vista previa seguro. |
| Matrix          | Envía un evento y luego lo edita.       | La configuración de transmisión a nivel de cuenta controla los borradores a nivel de cuenta. |
| Microsoft Teams | Transmisión nativa de Teams en chats personales. | `streaming.mode: "block"` se asigna a la entrega por bloques de Teams. |
| Slack           | Transmisión nativa o publicación de borrador editable. | La disponibilidad de hilos afecta si puede usarse la transmisión nativa. |
| Telegram        | Envía un mensaje y luego lo edita.      | Los borradores visibles antiguos pueden reemplazarse para que las marcas de tiempo finales sigan siendo útiles. |
| Mattermost      | Publicación de borrador editable.       | La actividad de herramientas se integra en la misma publicación de estilo borrador. |

Los canales sin soporte seguro de edición normalmente recurren a indicadores de escritura o
a entrega solo final.

## Finalización

Cuando la respuesta final está lista, OpenClaw intenta mantener limpio el chat:

- Si el borrador puede convertirse de forma segura en la respuesta final, OpenClaw lo edita en el lugar.
- Si el canal usa transmisión nativa de progreso, OpenClaw finaliza esa transmisión
  cuando el transporte nativo acepta el texto final.
- Si la respuesta final tiene medios, una solicitud de aprobación, un destino de respuesta explícito,
  demasiados fragmentos o un fallo de edición/envío, OpenClaw envía la respuesta final mediante
  la ruta normal de entrega del canal.

La ruta alternativa es intencional. Es mejor enviar una respuesta final nueva que
perder texto, encadenar mal una respuesta u sobrescribir un borrador con una carga que el canal
no puede representar de forma segura.

## Solución de problemas

**Solo veo la respuesta final.**

Comprueba que `channels.<channel>.streaming.mode` esté configurado como `progress` para la
cuenta o el canal que gestionó el mensaje. Algunas rutas de grupo o de respuesta con cita pueden
deshabilitar las vistas previas de borrador para un turno cuando el canal no puede editar de forma segura el mensaje
correcto.

**Veo la etiqueta pero no las líneas de herramientas.**

Comprueba `streaming.progress.toolProgress`. Si es `false`, OpenClaw conserva el
comportamiento de borrador único pero oculta las líneas de progreso de herramientas y tareas.

**Veo un mensaje final nuevo en lugar de un borrador editado.**

Ese es un mecanismo alternativo de seguridad. Puede ocurrir con respuestas con medios, respuestas largas,
destinos de respuesta explícitos, borradores antiguos de Telegram, destinos de hilo de Slack faltantes,
mensajes de vista previa eliminados o fallos al finalizar la transmisión nativa.

**Sigo viendo mensajes independientes de progreso.**

El modo de progreso suprime los mensajes independientes predeterminados de progreso de herramientas cuando hay un borrador
activo. Si siguen apareciendo mensajes independientes, verifica que el turno esté usando realmente
el modo de progreso y no `streaming.mode: "off"` ni una ruta de canal que
no pueda crear un borrador para ese mensaje.

**Teams se comporta de forma diferente a Discord o Telegram.**

Microsoft Teams usa un flujo nativo en chats personales en lugar del transporte genérico de vista previa de enviar y editar. Teams también trata `streaming.mode: "block"` como entrega por bloques de Teams porque no tiene el mismo modo de bloque de vista previa de borrador que usan Discord y Telegram.

## Relacionado

- [Streaming y fragmentación](/es/concepts/streaming)
- [Mensajes](/es/concepts/messages)
- [Configuración de canales](/es/gateway/config-channels)
- [Discord](/es/channels/discord)
- [Matrix](/es/channels/matrix)
- [Microsoft Teams](/es/channels/msteams)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
