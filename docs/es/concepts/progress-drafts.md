---
read_when:
    - Configuración de actualizaciones de progreso visibles para turnos de chat de larga duración
    - Elegir entre los modos de transmisión parcial, por bloques y de progreso
    - Explicación de cómo OpenClaw actualiza un mensaje del canal mientras el trabajo está en curso
    - Borradores de progreso de solución de problemas, mensajes de progreso independientes o alternativa de finalización
summary: 'Borradores de progreso: un mensaje visible de trabajo en curso que se actualiza mientras se ejecuta un agente'
title: Borradores de progreso
x-i18n:
    generated_at: "2026-07-12T14:26:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a7d2e60768718922b3d00c72817ff8e342a1e37c6d9a43eef30972412ad9a49
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Los borradores de progreso convierten un mensaje del canal en una línea de estado activa mientras un
agente trabaja, en lugar de crear una pila de respuestas temporales del tipo «sigo trabajando». Configure
`channels.<channel>.streaming.mode: "progress"` y OpenClaw crea el
mensaje cuando comienza el trabajo real, lo edita a medida que el agente lee, planifica, llama a
herramientas o espera aprobación y, después, lo convierte en la respuesta final.

```text
Ejecutando shell...
📖 desde docs/concepts/progress-drafts.md
🔎 Búsqueda web: de "discord edit message"
🛠️ Bash: ejecutar pruebas
```

<Note>
  Discord ya usa `streaming.mode: "progress"` de forma predeterminada cuando
  `channels.discord.streaming` no está configurado, por lo que los borradores de progreso
  aparecen allí sin ninguna configuración. Los demás canales usan `partial`
  u `off` de forma predeterminada; consulte [Streaming y fragmentación](/es/concepts/streaming#channel-mapping)
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

Valores predeterminados a partir de aquí: una etiqueta automática de una sola palabra, un retraso inicial de 5 segundos
(o inmediato cuando se produce un segundo evento de trabajo), líneas de progreso compactas mientras se realiza
trabajo útil y supresión de los antiguos mensajes de progreso independientes para
ese turno.

Esta página abarca la experiencia de los borradores de progreso y sus opciones de configuración. Para consultar la
matriz completa de modos de streaming, las notas de ejecución por canal y la migración de claves
heredadas, consulte [Streaming y fragmentación](/es/concepts/streaming).

## Qué ven los usuarios

| Parte              | Finalidad                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| Etiqueta           | Línea breve inicial o de estado, como `Working` o `Shelling`.                                       |
| Líneas de progreso | Actualizaciones compactas de la ejecución que usan los mismos iconos de herramientas y formateador de detalles que `/verbose`. |

La etiqueta aparece cuando el agente comienza un trabajo significativo y permanece ocupado durante el
retraso inicial, o aparece de inmediato si se produce un segundo evento de trabajo. Se sitúa en la parte superior de
la lista dinámica de líneas de progreso, por lo que desaparece al desplazarse cuando aparecen suficientes líneas
de trabajo concretas. Las respuestas que solo contienen texto nunca muestran un borrador de progreso; las líneas
solo aparecen para actualizaciones de trabajo real, por ejemplo `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"` o `✍️ Write: to /tmp/file`.

La respuesta final sustituye el borrador en el mismo lugar cuando el canal puede hacerlo de forma segura;
de lo contrario, OpenClaw envía la respuesta final mediante la entrega normal y
limpia el borrador o deja de actualizarlo (consulte [Finalización](#finalization)).

## Elegir un modo

`channels.<channel>.streaming.mode` controla el comportamiento visible mientras el trabajo está en curso:

| Modo       | Ideal para                                      | Lo que aparece en el chat                                      |
| ---------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `off`      | Canales silenciosos                             | Solo la respuesta final.                                        |
| `partial`  | Ver cómo aparece el texto de la respuesta       | Un borrador editado con el texto más reciente de la respuesta.  |
| `block`    | Fragmentos más grandes de vista previa          | Una vista previa actualizada o ampliada con fragmentos mayores. |
| `progress` | Turnos con muchas herramientas o de larga duración | Un borrador de estado y, después, la respuesta final.         |

Elija `progress` cuando a los usuarios les importe más «qué está sucediendo» que ver
cómo el texto de la respuesta se transmite token por token; `partial` cuando el propio texto de la respuesta sea
la señal de progreso; `block` para fragmentos de vista previa más grandes. En Discord y
Telegram, `streaming.mode: "block"` sigue siendo streaming de vista previa, no la entrega normal
de respuestas por bloques; use `streaming.block.enabled` para esta última.

## Configurar etiquetas

Las etiquetas de progreso se encuentran en `channels.<channel>.streaming.progress`. El
valor predeterminado de `label` es `"auto"`, que selecciona una opción del conjunto integrado de etiquetas de una sola palabra
de OpenClaw:

```text
Trabajando, Ejecutando shell, Avanzando, Usando pinzas, Pellizcando, Mudando, Burbujeando, Mareando,
Arrecifando, Quebrando, Tamizando, Salmuerando, Nautilando, Krilleando, Percebeando,
Langosteando, Explorando pozas de marea, Perlando, Chasqueando, Emergiendo
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

Use su propio conjunto de etiquetas (la selección continúa siendo aleatoria o basada en una semilla cuando `label: "auto"`):

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

Las líneas de progreso proceden de eventos de ejecución reales: inicios de herramientas, actualizaciones de elementos, planes de
tareas, aprobaciones, salida de comandos, resúmenes de parches y actividades similares del agente.
Están habilitadas de forma predeterminada (`progress.toolProgress`, valor predeterminado `true`).

Las herramientas también pueden emitir progreso tipado mientras una llamada individual sigue ejecutándose. Así,
una obtención o búsqueda lenta puede actualizar el borrador visible antes de que la herramienta
devuelva su resultado final. La actualización de progreso es un resultado parcial de la herramienta con
contenido del modelo vacío y metadatos públicos explícitos del canal:

```json
{
  "content": [],
  "progress": {
    "text": "Obteniendo contenido de la página...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw representa únicamente `progress.text` en la interfaz de progreso del canal. El resultado normal
de la herramienta llega más tarde como `content`/`details` y es la única parte
que se devuelve al modelo.

Al añadir progreso a una herramienta, emita un mensaje breve y genérico y retráselo
hasta que la operación lleve pendiente el tiempo suficiente para resultar útil. `web_fetch`
hace exactamente esto con un retraso de 5 segundos:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Obteniendo contenido de la página...", id: "web_fetch:fetching" },
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

### Modo de detalle

OpenClaw utiliza el mismo formateador para los borradores de progreso y `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explicar | sin procesar
    },
  },
}
```

`"explain"` es el valor predeterminado y mantiene estables los borradores con etiquetas concisas.
`"raw"` añade el comando subyacente cuando está disponible, lo cual resulta útil durante la
depuración, pero genera más ruido en el chat. Por ejemplo, una llamada a `node --check /tmp/app.js`
se representa de forma distinta según el modo:

| Modo      | Línea de progreso                                                |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Texto de comando/exec

`streaming.progress.commandText` (valor predeterminado: `"raw"`) controla cuántos detalles del comando
se muestran junto a las líneas de progreso de exec/bash, independientemente del modo de detalle
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

`streaming.progress.commentary` (valor predeterminado: `false`) intercala la narración de comentarios o preámbulos del modelo antes de usar herramientas (💬, por ejemplo, «Comprobaré... y luego
...») con las líneas de herramientas en el borrador. Consulta
[Transmisión y fragmentación](/es/concepts/streaming#commentary-progress-lane) para conocer la
estructura de configuración compartida entre canales.

### Estado narrado

Cuando se resuelve un modelo auxiliar para el agente, ya sea un
[`utilityModel`](/es/gateway/config-agents#utilitymodel) explícito o el modelo pequeño predeterminado declarado por el proveedor
principal (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`), el borrador de progreso sustituye las líneas
acumulativas de herramientas por una breve narración en lenguaje natural de lo que hace el agente,
redactada por ese modelo más económico y actualizada a medida que avanza el trabajo:

```text
Trabajando

Actualizando el modelo predeterminado en la configuración y reiniciando después el Gateway para
aplicar el cambio. Una llamada para enumerar agentes falló y se está reintentando.
```

La narración está activada de forma predeterminada (`streaming.progress.narration`, valor predeterminado: `true`)
y nunca recurre al modelo principal: solo se ejecuta con un
`utilityModel` explícito o con un valor predeterminado declarado por el proveedor principal
del agente. Establece `utilityModel: ""` para desactivar por completo el enrutamiento auxiliar. Las líneas de herramientas
siguen acumulándose debajo y reaparecen si se detiene la narración; además, el borrador solo se
edita cuando el texto de la narración cambia realmente, lo que también reduce la
cantidad de ediciones en canales con mucha actividad. Desactívala para conservar las líneas de herramientas sin procesar:

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

La entrada de narración está limitada y redactada: el modelo de utilidad recibe el
texto de la solicitud entrante junto con los mismos resúmenes compactos y redactados de herramientas que mostraría el borrador,
nunca la salida sin procesar de comandos ni los resultados de herramientas. Con
`commandText: "status"`, la entrada de narración también omite el texto de los comandos exec/bash,
de forma coherente con lo que muestra el borrador.

### Límites de líneas

Limita cuántas líneas permanecen visibles (valor predeterminado: 8):

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

Las líneas de progreso se compactan automáticamente para reducir el reajuste de los globos de chat mientras
se edita el borrador, y OpenClaw trunca las líneas largas para que las ediciones repetidas del borrador
no ajusten el texto de forma diferente en cada actualización. El límite predeterminado por línea es de 120
caracteres; la prosa se corta en un límite de palabra, mientras que los detalles largos, como rutas o
comandos sin procesar, se acortan con puntos suspensivos intermedios para que el sufijo permanezca visible.

Ajusta el límite por línea:

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
por lo que los clientes que no pueden representar el formato enriquecido siguen mostrando el texto compacto
de progreso.

### Ocultar líneas de herramientas y tareas

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
anteriores de progreso de herramientas para ese turno: el canal permanece visualmente despejado hasta
la respuesta final, excepto por la etiqueta si hay una configurada.

## Comportamiento del canal

| Canal           | Transporte del progreso                          | Notas                                                                                                                                                                                               |
| --------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Envía un mensaje y luego lo edita.              | De forma predeterminada, usa el modo `progress`; la respuesta final incluye un recibo de actividad `-#` y el borrador de estado se elimina después de que se entrega la respuesta.                  |
| Matrix          | Envía un evento y luego lo edita.               | La configuración de streaming del nivel de cuenta controla los borradores del nivel de cuenta.                                                                                                     |
| Microsoft Teams | Flujo nativo de Teams en chats personales.      | `streaming.mode: "block"` se asigna, en cambio, a la entrega por bloques de Teams.                                                                                                                  |
| Slack           | Flujo nativo o publicación de borrador editable. | Requiere un hilo de respuestas como destino; los mensajes directos de nivel superior sin uno siguen recibiendo publicaciones de vista previa del borrador y sus ediciones.                         |
| Telegram        | Envía un mensaje y luego lo edita.              | Si se entrega un mensaje entre el borrador de progreso y la respuesta, el borrador se vuelve a publicar debajo (primero se publica el nuevo y luego se elimina el anterior), en lugar de desplazar bruscamente el cliente. |
| Mattermost      | Publicación de borrador editable.               | El modo `block` alterna entre publicaciones de texto completado y de actividad de herramientas; los demás modos integran la actividad de herramientas en la misma publicación con estilo de borrador. |

Los canales sin compatibilidad segura con la edición recurren a indicadores de escritura o a la
entrega únicamente de la respuesta final. Consulte [Streaming y fragmentación](/es/concepts/streaming) para ver el
desglose completo del comportamiento en tiempo de ejecución por canal.

## Finalización

Cuando la respuesta final está lista, OpenClaw intenta mantener limpio el chat:

- En el modo `progress` en Discord, la respuesta final se envía como un mensaje nuevo
  con un pequeño comprobante de actividad `-#` añadido (por ejemplo,
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), y el borrador de estado se
  elimina una vez entregada esa respuesta. Los canales con mucha actividad no conservan ningún registro
  de herramientas huérfano encima de la respuesta; en caso de error, el borrador se mantiene como registro visible
  del turno fallido.
- Si el borrador puede convertirse de forma segura en la respuesta final (modos `partial`/`block`),
  OpenClaw lo edita directamente.
- Si el canal utiliza transmisión de progreso nativa, OpenClaw finaliza ese
  flujo cuando el transporte nativo acepta el texto final.
- De lo contrario (contenido multimedia, una solicitud de aprobación, un destino de respuesta explícito, demasiados
  fragmentos o un fallo de edición/envío), OpenClaw envía la respuesta final mediante la
  ruta normal de entrega del canal en lugar de sobrescribir el borrador.

La alternativa es intencional: enviar una respuesta final nueva es preferible a perder texto,
asociar una respuesta al hilo incorrecto o sobrescribir un borrador con una carga que el canal
no puede representar de forma segura.

## Solución de problemas

**Solo veo la respuesta final.**

Compruebe que `channels.<channel>.streaming.mode` sea `progress` para la cuenta
o el canal que gestionó el mensaje. Algunas rutas de grupos o de respuesta con cita desactivan
las vistas previas del borrador durante un turno cuando el canal no puede editar de forma segura el
mensaje correcto.

**Veo la etiqueta, pero no las líneas de herramientas.**

Compruebe `streaming.progress.toolProgress`. Si es `false`, OpenClaw mantiene el
comportamiento de borrador único, pero oculta las líneas de progreso de herramientas y tareas.

**Veo un mensaje final nuevo en lugar de un borrador editado.**

Ese es el mecanismo de seguridad alternativo descrito en [Finalización](#finalization). Puede
ocurrir con respuestas multimedia, respuestas largas, destinos de respuesta explícitos, borradores
antiguos de Telegram, destinos de hilo de Slack ausentes, mensajes de vista previa eliminados o errores
al finalizar el flujo nativo.

**Sigo viendo mensajes de progreso independientes.**

El modo de progreso suprime los mensajes independientes predeterminados de progreso de herramientas siempre que
haya un borrador activo. Si siguen apareciendo mensajes independientes, confirme que el turno
esté usando realmente el modo `progress` y no `streaming.mode: "off"` ni una ruta de
canal que no pueda crear un borrador para ese mensaje.

**Teams se comporta de forma diferente a Discord o Telegram.**

Microsoft Teams utiliza un flujo nativo en los chats personales en lugar del transporte genérico
de envío y edición de vistas previas, y asigna `streaming.mode: "block"` a la entrega por bloques de Teams
porque no dispone de un modo de bloques con vista previa de borrador como Discord y
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
