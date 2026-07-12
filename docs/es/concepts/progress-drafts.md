---
read_when:
    - Configuración de actualizaciones de progreso visibles para turnos de chat de larga duración
    - Elección entre los modos de transmisión parcial, por bloques y de progreso
    - Explicación de cómo OpenClaw actualiza un mensaje del canal mientras el trabajo está en curso
    - Borradores de progreso de solución de problemas, mensajes de progreso independientes o alternativa de finalización
summary: 'Borradores de progreso: un mensaje visible de trabajo en curso que se actualiza mientras se ejecuta un agente'
title: Borradores de progreso
x-i18n:
    generated_at: "2026-07-12T21:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f937a61dfa360ac1d6c67e1a05e5ac698af563f2b58624d6de4e69a7f904cdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Los borradores de progreso convierten un mensaje del canal en una línea de estado en vivo mientras un agente trabaja, en lugar de crear una pila de respuestas temporales del tipo «todavía trabajando». Establezca
`channels.<channel>.streaming.mode: "progress"` y OpenClaw crea el
mensaje cuando comienza el trabajo real, lo edita mientras el agente lee, planifica, llama a
herramientas o espera aprobación y, después, lo convierte en la respuesta final.

```text
Ejecutando shell...
📖 desde docs/concepts/progress-drafts.md
🔎 Búsqueda web: de "discord edit message"
🛠️ Bash: ejecutar pruebas
```

<Note>
  Discord ya usa de forma predeterminada `streaming.mode: "progress"` cuando
  `channels.discord.streaming` no está definido, por lo que los borradores de progreso
  aparecen allí sin ninguna configuración. Los demás canales usan de forma predeterminada `partial`
  u `off`; consulte [Transmisión y fragmentación](/es/concepts/streaming#channel-mapping)
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

Valores predeterminados a partir de aquí: un retraso inicial de 5 segundos (o inmediato al producirse un segundo evento de trabajo), líneas de progreso compactas mientras se realiza trabajo útil y supresión de los mensajes de progreso independientes anteriores para ese turno. Los borradores de líneas de herramientas sin procesar usan una etiqueta automática de una palabra; el estado narrado omite ese título redundante salvo que se configure uno explícitamente.

Esta página trata sobre la experiencia de los borradores de progreso y sus opciones de configuración. Para consultar la matriz completa de modos de transmisión, las notas de ejecución por canal y la migración de claves heredadas, consulte [Transmisión y fragmentación](/es/concepts/streaming).

## Lo que ven los usuarios

| Parte              | Propósito                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Etiqueta           | Línea inicial o de estado opcional, como `Working` o `Shelling`.                                       |
| Líneas de progreso | Actualizaciones compactas de la ejecución que usan los mismos iconos de herramientas y formato de detalles que `/verbose`. |

Para el progreso sin procesar de las herramientas, la etiqueta aparece cuando el agente comienza un trabajo significativo y sigue ocupado durante el retraso inicial, o cuando se produce inmediatamente un segundo evento de trabajo. Se sitúa en la parte superior de la lista móvil de líneas de progreso, por lo que desaparece al desplazarse cuando aparecen suficientes líneas de trabajo concretas. El progreso narrado muestra únicamente el estado del agente en lenguaje natural, salvo que se configure explícitamente una etiqueta. Las respuestas que contienen solo texto nunca muestran un borrador de progreso; solo aparece una línea para actualizaciones de trabajo reales, por ejemplo `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"` o `✍️ Write: to /tmp/file`.

La respuesta final sustituye al borrador en el mismo lugar cuando el canal puede hacerlo de forma segura; de lo contrario, OpenClaw envía la respuesta final mediante la entrega normal y elimina el borrador o deja de actualizarlo (consulte [Finalización](#finalization)).

## Elegir un modo

`channels.<channel>.streaming.mode` controla el comportamiento visible durante el proceso:

| Modo       | Ideal para                                    | Lo que aparece en el chat                                     |
| ---------- | -------------------------------------------- | -------------------------------------------------------------- |
| `off`      | Canales silenciosos                          | Solo la respuesta final.                                       |
| `partial`  | Ver cómo aparece el texto de la respuesta    | Un borrador editado con el texto más reciente de la respuesta. |
| `block`    | Fragmentos más grandes de vista previa       | Una vista previa actualizada o ampliada en fragmentos mayores. |
| `progress` | Turnos con muchas herramientas o prolongados | Un borrador de estado y, después, la respuesta final.          |

Elija `progress` cuando a los usuarios les importe más «qué está sucediendo» que ver cómo se transmite el texto de la respuesta token por token; `partial` cuando el propio texto de la respuesta sea la señal de progreso; y `block` para fragmentos de vista previa más grandes. En Discord y Telegram, `streaming.mode: "block"` sigue siendo transmisión de vista previa, no entrega normal de respuestas por bloques; use `streaming.block.enabled` para ello.

## Configurar etiquetas

Las etiquetas de progreso se encuentran en `channels.<channel>.streaming.progress`. La etiqueta predeterminada para las líneas de herramientas sin procesar es `"auto"`, que elige una opción del conjunto integrado de etiquetas de una sola palabra de OpenClaw. El progreso narrado oculta esa etiqueta implícita; establezca `label: "auto"` explícitamente si también desea mostrarla sobre la narración:

```text
Trabajando, Ejecutando shell, Desplazándose, Arañando, Pellizcando, Mudando, Burbujeando, Mareando,
Formando arrecifes, Quebrando, Tamizando, Poniendo en salmuera, Nautilando, Krilleando, Cubriendo de percebes,
Langosteando, Formando pozas de marea, Formando perlas, Chasqueando, Emergiendo
```

Use una etiqueta fija:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigando",
        },
      },
    },
  },
}
```

Use su propio conjunto de etiquetas (se siguen eligiendo al azar o por semilla cuando `label: "auto"`):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Comprobando", "Leyendo", "Probando", "Finalizando"],
        },
      },
    },
  },
}
```

Oculte la etiqueta y muestre únicamente las líneas de progreso:

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

Las líneas de progreso provienen de eventos de ejecución reales: inicios de herramientas, actualizaciones de elementos, planes de tareas, aprobaciones, salida de comandos, resúmenes de parches y actividades similares del agente. Están habilitadas de forma predeterminada (`progress.toolProgress`, valor predeterminado `true`).

Las herramientas también pueden emitir progreso tipado mientras una llamada sigue en ejecución. Así es como una obtención o búsqueda lenta actualiza el borrador visible antes de que la herramienta devuelva su resultado final. La actualización de progreso es un resultado parcial de la herramienta con contenido del modelo vacío y metadatos explícitos del canal público:

```json
{
  "content": [],
  "progress": {
    "text": "Obteniendo el contenido de la página...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw representa únicamente `progress.text` en la interfaz de progreso del canal. El resultado normal de la herramienta llega posteriormente como `content`/`details` y es la única parte que se devuelve al modelo.

Al añadir progreso a una herramienta, emita un mensaje breve y genérico, y retráselo hasta que la operación lleve pendiente el tiempo suficiente para resultar útil. `web_fetch` hace exactamente esto con un retraso de 5 segundos:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Obteniendo el contenido de la página...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Las llamadas rápidas no muestran ninguna línea de progreso; las llamadas largas muestran una mientras siguen pendientes;
las llamadas canceladas borran el temporizador antes de que pueda aparecer progreso obsoleto. El texto de progreso
es un canal lateral público de la interfaz de usuario, por lo que nunca debe incluir secretos, argumentos sin procesar,
contenido obtenido, salida de comandos ni texto de páginas.

### Modo detallado

OpenClaw usa el mismo formateador para los borradores de progreso y `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explicar | sin procesar
    },
  },
}
```

`"explain"` es el valor predeterminado y mantiene los borradores estables con etiquetas concisas.
`"raw"` añade el comando subyacente cuando está disponible, lo que resulta útil al
depurar, pero genera más ruido en el chat. Por ejemplo, una llamada a `node --check /tmp/app.js`
se muestra de forma distinta según el modo:

| Modo      | Línea de progreso                                               |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Texto de comando/exec

`streaming.progress.commandText` (valor predeterminado: `"raw"`) controla cuánto detalle del comando
se muestra junto a las líneas de progreso de exec/bash, independientemente del modo de detalle
anterior. Establézcalo en `"status"` para mantener visible una línea de progreso de la herramienta mientras se oculta
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

### Canal de comentarios

`streaming.progress.commentary` (valor predeterminado: `false`) intercala la narración de comentarios o preámbulo del modelo previa al uso de herramientas (💬, por ejemplo, «Comprobaré... y luego...») con las líneas de herramientas en el borrador. Consulte [Transmisión y fragmentación](/es/concepts/streaming#commentary-progress-lane) para conocer la estructura de configuración compartida entre canales.

### Estado narrado

Cuando se resuelve un modelo auxiliar para el agente —un [`utilityModel`](/es/gateway/config-agents#utilitymodel) explícito o el modelo pequeño predeterminado declarado por el proveedor principal (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`)—, el borrador de progreso sustituye las líneas continuas de herramientas por una breve narración en lenguaje sencillo de lo que hace el agente, redactada por ese modelo más económico y actualizada a medida que avanza el trabajo:

```text
Actualizando el modelo predeterminado en la configuración y, después, reiniciando el Gateway para aplicar el cambio. Una llamada para enumerar agentes ha fallado y se está reintentando.
```

La narración está activada de forma predeterminada (`streaming.progress.narration`, valor predeterminado: `true`) y nunca recurre al modelo principal: solo se ejecuta con un `utilityModel` explícito o con un valor predeterminado declarado por el proveedor principal del agente. Establezca `utilityModel: ""` para desactivar por completo el enrutamiento auxiliar. Las líneas de herramientas siguen acumulándose debajo y vuelven a mostrarse si la narración se detiene; además, el borrador solo se edita después del umbral de actividad normal y cuando el texto de la narración cambia realmente, lo que evita parpadeos en turnos rápidos y reduce la sucesión de ediciones en canales con mucha actividad. Desactive esta opción para conservar las líneas de herramientas sin procesar:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

La entrada de narración está acotada y censurada: el modelo auxiliar recibe el
texto de la solicitud entrante junto con los mismos resúmenes de herramientas compactos y censurados que mostraría el borrador,
nunca la salida sin procesar de los comandos ni los resultados de las herramientas. Con
`commandText: "status"`, la entrada de narración también omite el texto de los comandos exec/bash,
de acuerdo con lo que muestra el borrador.

### Límites de líneas

Limite cuántas líneas permanecen visibles (valor predeterminado: 8):

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

Las líneas de progreso se compactan automáticamente para reducir la redistribución de los globos de chat mientras
se edita el borrador, y OpenClaw trunca las líneas largas para que las ediciones repetidas del borrador
no ajusten el texto de forma diferente en cada actualización. El límite predeterminado por línea es de 120
caracteres; la prosa se corta en un límite de palabra, mientras que los detalles largos, como rutas o
comandos sin procesar, se acortan con puntos suspensivos intermedios para que el sufijo permanezca visible.

Ajuste el límite por línea:

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
por lo que los clientes que no pueden representar el formato enriquecido siguen mostrando el texto de progreso
compacto.

### Ocultar líneas de herramientas y tareas

Mantenga el único borrador de progreso, pero oculte las líneas de herramientas y tareas:

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

Con `toolProgress: false`, OpenClaw sigue suprimiendo los antiguos mensajes independientes
de progreso de herramientas para ese turno; el canal permanece visualmente despejado hasta
la respuesta final, excepto por la etiqueta si se ha configurado una.

## Comportamiento del canal

| Canal           | Transporte del progreso                       | Notas                                                                                                                                                                                                 |
| --------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Envía un mensaje y luego lo edita.            | El modo predeterminado es `progress`; la respuesta final incluye un acuse de actividad `-#` y el borrador de estado se elimina después de que llega la respuesta.                                     |
| Matrix          | Envía un evento y luego lo edita.             | La configuración de streaming a nivel de cuenta controla los borradores a nivel de cuenta.                                                                                                           |
| Microsoft Teams | Stream nativo de Teams en chats personales.   | `streaming.mode: "block"` se asigna en su lugar a la entrega por bloques de Teams.                                                                                                                    |
| Slack           | Stream nativo o publicación de borrador editable. | Requiere un hilo de respuesta como destino; los mensajes directos de nivel superior sin uno siguen recibiendo publicaciones de vista previa del borrador y modificaciones.                         |
| Telegram        | Envía un mensaje y luego lo edita.            | Si llega un mensaje entre el borrador de progreso y la respuesta, el borrador se vuelve a publicar debajo (primero se publica el nuevo y luego se elimina el anterior), en vez de desplazar abruptamente el cliente. |
| Mattermost      | Publicación de borrador editable.             | El modo `block` alterna entre publicaciones de texto completado y de actividad de herramientas; los demás modos incorporan la actividad de las herramientas en la misma publicación de tipo borrador. |

Los canales sin compatibilidad segura con la edición recurren a indicadores de escritura o
a la entrega únicamente de la respuesta final. Consulte [Streaming y fragmentación](/es/concepts/streaming) para ver el
desglose completo del comportamiento en tiempo de ejecución de cada canal.

## Finalización

Cuando la respuesta final está lista, OpenClaw intenta mantener limpio el chat:

- En el modo `progress` de Discord, la respuesta final se envía como un mensaje nuevo
  con un pequeño comprobante de actividad `-#` añadido (por ejemplo,
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), y el borrador de estado se
  elimina una vez entregada esa respuesta. Los canales con actividad no conservan ningún registro de herramientas
  huérfano encima de la respuesta; en caso de error final, el borrador se conserva como registro visible del
  turno fallido.
- Si el borrador puede convertirse de forma segura en la respuesta final (modos `partial`/`block`),
  OpenClaw lo edita en el mismo lugar.
- Si el canal utiliza transmisión nativa del progreso, OpenClaw finaliza esa
  transmisión cuando el transporte nativo acepta el texto final.
- En caso contrario (contenido multimedia, una solicitud de aprobación, un destino de respuesta explícito, demasiados
  fragmentos o un fallo de edición/envío), OpenClaw envía la respuesta final mediante la
  ruta normal de entrega del canal en lugar de sobrescribir el borrador.

La alternativa es intencional: enviar una respuesta final nueva es preferible a perder texto,
asociar incorrectamente una respuesta a un hilo o sobrescribir un borrador con una carga útil que el canal
no puede representar de forma segura.

## Solución de problemas

**Solo veo la respuesta final.**

Compruebe que `channels.<channel>.streaming.mode` sea `progress` para la cuenta
o el canal que procesó el mensaje. Algunas rutas de grupo o de respuesta con cita
desactivan las vistas previas del borrador durante un turno cuando el canal no puede editar de forma segura
el mensaje correcto.

**Veo la etiqueta, pero no las líneas de herramientas.**

Comprueba `streaming.progress.toolProgress`. Si es `false`, OpenClaw mantiene el
comportamiento de borrador único, pero oculta las líneas de progreso de herramientas y tareas.

**Veo un mensaje final nuevo en lugar de un borrador editado.**

Es el mecanismo alternativo de seguridad descrito en [Finalización](#finalization). Puede
ocurrir con respuestas multimedia, respuestas largas, destinos de respuesta explícitos, borradores
antiguos de Telegram, destinos de hilo de Slack ausentes, mensajes de vista previa eliminados o una
finalización fallida del flujo nativo.

**Sigo viendo mensajes de progreso independientes.**

El modo de progreso suprime los mensajes independientes predeterminados sobre el progreso de las herramientas siempre que haya un
borrador activo. Si siguen apareciendo mensajes independientes, confirma que el turno
esté usando realmente el modo `progress` y no `streaming.mode: "off"` ni una ruta de
canal que no pueda crear un borrador para ese mensaje.

**Teams se comporta de forma diferente a Discord o Telegram.**

Microsoft Teams usa un flujo nativo en los chats personales en lugar del transporte genérico
de vista previa basado en enviar y editar, y asigna `streaming.mode: "block"` a la entrega por bloques de Teams
porque no tiene un modo de bloques de vista previa en borrador como Discord y
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
