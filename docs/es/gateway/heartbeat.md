---
read_when:
    - Ajustar la frecuencia o los mensajes de Heartbeat
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Heartbeat
summary: Mensajes de sondeo de Heartbeat y reglas de notificación
title: Heartbeat
x-i18n:
    generated_at: "2026-07-11T23:05:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**¿Heartbeat o Cron?** Consulta [Automatización](/es/automation) para obtener orientación sobre cuándo usar cada uno.
</Note>

Heartbeat ejecuta **turnos periódicos del agente** en la sesión principal para que el modelo pueda señalar cualquier asunto que requiera atención sin enviarte mensajes excesivos.

Heartbeat es un turno programado de la sesión principal; **no** crea registros de [tareas en segundo plano](/es/automation/tasks). Los registros de tareas se utilizan para trabajos independientes (ejecuciones de ACP, subagentes y trabajos de Cron aislados).

Solución de problemas: [Tareas programadas](/es/automation/cron-jobs#troubleshooting)

## Inicio rápido (principiantes)

<Steps>
  <Step title="Elige una frecuencia">
    Deja habilitados los Heartbeat (el valor predeterminado es `30m`, o `1h` cuando se configura la autenticación mediante OAuth/token de Anthropic, incluida la reutilización de Claude CLI) o establece tu propia frecuencia.
  </Step>
  <Step title="Añade HEARTBEAT.md (opcional)">
    Crea una pequeña lista de comprobación en `HEARTBEAT.md` o un bloque `tasks:` en el espacio de trabajo del agente.
  </Step>
  <Step title="Decide adónde deben enviarse los mensajes de Heartbeat">
    `target: "none"` es el valor predeterminado; establece `target: "last"` para dirigirlos al último contacto.
  </Step>
  <Step title="Ajustes opcionales">
    - Habilita la entrega del razonamiento de Heartbeat para ofrecer transparencia.
    - Usa un contexto de arranque ligero si las ejecuciones de Heartbeat solo necesitan `HEARTBEAT.md`.
    - Habilita sesiones aisladas para evitar enviar todo el historial de conversación en cada Heartbeat.
    - Restringe los Heartbeat al horario activo (hora local).

  </Step>
</Steps>

Ejemplo de configuración:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Valores predeterminados

- Intervalo: `30m`. Al aplicar los valores predeterminados del proveedor Anthropic, aumenta a `1h` cuando el modo de autenticación resuelto es OAuth/token (incluida la reutilización de Claude CLI), pero solo mientras `heartbeat.every` no esté establecido. Configura `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` por agente; usa `0m` para deshabilitarlo.
- Cuerpo de la instrucción (configurable mediante `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Tiempo de espera: los turnos de Heartbeat sin un valor definido usan `agents.defaults.timeoutSeconds` cuando está configurado. De lo contrario, usan la frecuencia de Heartbeat con un límite máximo de 600 segundos. Configura `agents.defaults.heartbeat.timeoutSeconds` o `agents.list[].heartbeat.timeoutSeconds` por agente para trabajos de Heartbeat más largos.
- La instrucción de Heartbeat se envía **textualmente** como mensaje del usuario. La instrucción del sistema incluye una sección «Heartbeats» solo cuando los Heartbeat están habilitados para el agente predeterminado (y `includeSystemPromptSection` no es `false`), y la ejecución se marca internamente.
- Cuando los Heartbeat se deshabilitan con `0m`, las ejecuciones normales también omiten `HEARTBEAT.md` del contexto de arranque para que el modelo no vea instrucciones exclusivas de Heartbeat.
- El horario activo (`heartbeat.activeHours`) se comprueba en la zona horaria configurada. Fuera de ese intervalo, los Heartbeat se omiten hasta la siguiente activación que esté dentro del intervalo.
- Los Heartbeat se aplazan automáticamente mientras haya trabajos de Cron activos o en cola. Configura `heartbeat.skipWhenBusy: true` para aplazar también un agente cuando estén ocupados su propio subagente vinculado a una clave de sesión o sus canales de comandos anidados; los agentes hermanos ya no se detienen solo porque otro agente tenga trabajo de subagentes en curso.

## Para qué sirve la instrucción de Heartbeat

La instrucción predeterminada es intencionadamente amplia:

- **Tareas en segundo plano**: «Considerar las tareas pendientes» anima al agente a revisar seguimientos (bandeja de entrada, calendario, recordatorios y trabajos en cola) y señalar cualquier asunto urgente.
- **Contacto con la persona**: «Preguntar ocasionalmente cómo está tu persona durante el día» anima a enviar de vez en cuando un mensaje ligero como «¿necesitas algo?», pero evita mensajes nocturnos innecesarios mediante la zona horaria local configurada (consulta [Zona horaria](/es/concepts/timezone)).

Heartbeat puede reaccionar a [tareas en segundo plano](/es/automation/tasks) completadas, pero una ejecución de Heartbeat no crea por sí misma un registro de tarea.

Si quieres que un Heartbeat haga algo muy específico (por ejemplo, «comprobar las estadísticas de Gmail PubSub» o «verificar el estado del Gateway»), establece `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) con un cuerpo personalizado (enviado textualmente).

## Contrato de respuesta

- Si nada requiere atención, responde con **`HEARTBEAT_OK`**.
- En su lugar, las ejecuciones de Heartbeat pueden llamar a `heartbeat_respond` con `notify: false` para no mostrar ninguna actualización, o con `notify: true` y `notificationText` para emitir una alerta. Cuando existe, la respuesta estructurada de la herramienta tiene prioridad sobre la respuesta de texto alternativa.
- Durante las ejecuciones de Heartbeat, OpenClaw trata `HEARTBEAT_OK` como una confirmación cuando aparece al **principio o al final** de la respuesta. El token se elimina y la respuesta se descarta si el contenido restante tiene **≤ `ackMaxChars`** (valor predeterminado: 300).
- Si `HEARTBEAT_OK` aparece en el **medio** de una respuesta, no recibe ningún tratamiento especial.
- Para las alertas, **no** incluyas `HEARTBEAT_OK`; devuelve únicamente el texto de la alerta.

Fuera de los Heartbeat, cualquier `HEARTBEAT_OK` aislado al principio o al final de un mensaje se elimina y se registra; un mensaje que solo contenga `HEARTBEAT_OK` se descarta.

## Configuración

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Alcance y precedencia

- `agents.defaults.heartbeat` establece el comportamiento global de Heartbeat.
- `agents.list[].heartbeat` se combina por encima; si algún agente tiene un bloque `heartbeat`, **solo esos agentes** ejecutan Heartbeat.
- `channels.defaults.heartbeat` establece los valores predeterminados de visibilidad para todos los canales.
- `channels.<channel>.heartbeat` reemplaza los valores predeterminados del canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canales con varias cuentas) reemplaza la configuración específica del canal.

### Heartbeat por agente

Si alguna entrada de `agents.list[]` incluye un bloque `heartbeat`, **solo esos agentes** ejecutan Heartbeat. El bloque por agente se combina por encima de `agents.defaults.heartbeat` (por lo que puedes establecer una sola vez los valores predeterminados compartidos y reemplazarlos para cada agente).

Ejemplo: dos agentes, pero solo el segundo ejecuta Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Ejemplo de horario activo

Restringe los Heartbeat al horario laboral de una zona horaria específica:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Fuera de este intervalo (antes de las 9:00 o después de las 22:00, hora del Este), los Heartbeat se omiten. La siguiente activación programada dentro del intervalo se ejecutará con normalidad.

### Configuración permanente

Si quieres que los Heartbeat se ejecuten todo el día, usa uno de estos patrones:

- Omite `activeHours` por completo (sin restricción de intervalo horario; este es el comportamiento predeterminado).
- Establece un intervalo de todo el día: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
No establezcas la misma hora para `start` y `end` (por ejemplo, de `08:00` a `08:00`). Esto se interpreta como un intervalo de amplitud cero, por lo que los Heartbeat siempre se omiten.
</Warning>

### Ejemplo con varias cuentas

Usa `accountId` para dirigirte a una cuenta específica en canales con varias cuentas, como Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Notas sobre los campos

<ParamField path="every" type="string">
  Intervalo de Heartbeat (cadena de duración; unidad predeterminada = minutos).
</ParamField>
<ParamField path="model" type="string">
  Reemplazo opcional del modelo para las ejecuciones de Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Cuando está habilitado, también entrega el mensaje `Thinking` independiente cuando esté disponible (con la misma estructura que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Cuando es verdadero, las ejecuciones de Heartbeat usan un contexto de arranque ligero y conservan únicamente `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Cuando es verdadero, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversaciones anteriores. Usa el mismo patrón de aislamiento que `sessionTarget: "isolated"` de Cron. Reduce drásticamente el coste de tokens por Heartbeat. Combínalo con `lightContext: true` para obtener el máximo ahorro. El enrutamiento de entrega sigue usando el contexto de la sesión principal.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Cuando es verdadero, las ejecuciones de Heartbeat se aplazan en los canales ocupados adicionales de ese agente: su propio subagente vinculado a una clave de sesión o un trabajo de comandos anidados. Los canales de Cron siempre aplazan los Heartbeat, incluso sin esta opción, para que los hosts de modelos locales no ejecuten instrucciones de Cron y Heartbeat al mismo tiempo.
</ParamField>
<ParamField path="session" type="string">
  Clave de sesión opcional para las ejecuciones de Heartbeat.

- `main` (valor predeterminado): sesión principal del agente.
- Clave de sesión explícita (cópiala de `openclaw sessions --json` o de la [CLI de sesiones](/es/cli/sessions)).
- Formatos de clave de sesión: consulta [Sesiones](/es/concepts/session) y [Grupos](/es/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: entrega en el último canal externo utilizado.
- canal explícito: cualquier canal configurado o identificador de Plugin, por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (valor predeterminado): ejecuta el Heartbeat, pero **no lo entrega** externamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla el comportamiento de entrega directa/por mensaje directo. `allow`: permite la entrega directa/por mensaje directo de Heartbeat. `block`: impide la entrega directa/por mensaje directo (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Reemplazo opcional del destinatario (identificador específico del canal, p. ej., E.164 para WhatsApp o un identificador de chat de Telegram). Para temas/hilos de Telegram, usa `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Identificador de cuenta opcional para canales con varias cuentas. Cuando `target: "last"`, el identificador de cuenta se aplica al último canal resuelto si admite cuentas; de lo contrario, se ignora. Si el identificador de cuenta no coincide con una cuenta configurada para el canal resuelto, se omite la entrega.

</ParamField>
<ParamField path="prompt" type="string">
  Sustituye el cuerpo predeterminado del prompt (no se combina).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Indica si se inserta la sección `## Heartbeats` del prompt del sistema del agente predeterminado. Establécelo en `false` para mantener el comportamiento de Heartbeat en tiempo de ejecución (frecuencia, entrega, HEARTBEAT.md) y omitir las instrucciones de Heartbeat del prompt del sistema del agente.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Número máximo de caracteres permitidos después de `HEARTBEAT_OK` antes de la entrega.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Cuando es verdadero, suprime las cargas de advertencia de errores de herramientas durante las ejecuciones de Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Número máximo de segundos permitidos para un turno del agente de Heartbeat antes de que se cancele. Déjalo sin configurar para usar `agents.defaults.timeoutSeconds` cuando esté definido; de lo contrario, se usa la frecuencia de Heartbeat con un límite de 600 segundos.

</ParamField>
<ParamField path="activeHours" type="object">
  Restringe las ejecuciones de Heartbeat a una franja horaria. Es un objeto con `start` (HH:MM, inclusivo; usa `00:00` para el inicio del día), `end` (HH:MM, exclusivo; se permite `24:00` para el final del día) y un valor `timezone` opcional.

- Si se omite o es `"user"`: usa `agents.defaults.userTimezone` si está configurado; de lo contrario, usa como alternativa la zona horaria del sistema anfitrión.
- `"local"`: siempre usa la zona horaria del sistema anfitrión.
- Cualquier identificador IANA (p. ej., `America/New_York`): se usa directamente; si no es válido, se aplica como alternativa el comportamiento de `"user"` descrito anteriormente.
- `start` y `end` no deben ser iguales para una franja activa; los valores iguales se consideran una franja de amplitud cero (siempre fuera de la franja).
- Fuera de la franja activa, los Heartbeats se omiten hasta el siguiente ciclo que caiga dentro de ella.

</ParamField>

## Comportamiento de entrega

<AccordionGroup>
  <Accordion title="Enrutamiento de sesiones y destinos">
    - De forma predeterminada, los Heartbeats se ejecutan en la sesión principal del agente (`agent:<id>:<mainKey>`), o en `global` cuando `session.scope = "global"`. Configura `session` para sustituirla por una sesión específica de un canal (Discord/WhatsApp/etc.).
    - `session` solo afecta al contexto de ejecución; `target` y `to` controlan la entrega.
    - Para entregar a un canal/destinatario específico, configura `target` + `to`. Con `target: "last"`, la entrega usa el último canal externo de esa sesión.
    - Las entregas de Heartbeat permiten destinos directos/DM de forma predeterminada. Configura `directPolicy: "block"` para impedir los envíos a destinos directos sin dejar de ejecutar el turno de Heartbeat.
    - Si la cola principal, el carril de la sesión de destino, el carril de Cron o un trabajo de Cron activo están ocupados, el Heartbeat se omite y se vuelve a intentar más tarde.
    - Si `skipWhenBusy: true`, los carriles de subagentes asociados a la clave de sesión de este agente y sus carriles anidados también posponen las ejecuciones de Heartbeat. Los carriles ocupados de otros agentes no posponen las ejecuciones de este agente.
    - Si `target` no se resuelve en ningún destino externo, la ejecución se realiza igualmente, pero no se envía ningún mensaje saliente.

  </Accordion>
  <Accordion title="Visibilidad y comportamiento de omisión">
    - Si `showOk`, `showAlerts` y `useIndicator` están desactivados, la ejecución se omite desde el principio con `reason=alerts-disabled`.
    - Si solo está desactivada la entrega de alertas, OpenClaw aún puede ejecutar el Heartbeat, actualizar las marcas de tiempo de las tareas pendientes, restaurar la marca de tiempo de inactividad de la sesión y suprimir la carga de alerta saliente.
    - Si el destino de Heartbeat resuelto admite el indicador de escritura, OpenClaw lo muestra mientras la ejecución de Heartbeat está activa. Se usa el mismo destino al que Heartbeat enviaría la salida del chat y se desactiva con `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo de vida y auditoría de sesiones">
    - Las respuestas exclusivas de Heartbeat **no** mantienen activa la sesión. Los metadatos de Heartbeat pueden actualizar la fila de la sesión, pero la caducidad por inactividad usa `lastInteractionAt` del último mensaje real del usuario/canal y la caducidad diaria usa `sessionStartedAt`.
    - El historial de la interfaz de control y WebChat oculta los prompts de Heartbeat y las confirmaciones que solo contienen OK. La transcripción subyacente de la sesión puede seguir conteniendo esos turnos para auditoría/reproducción.
    - Las [tareas en segundo plano](/es/automation/tasks) independientes pueden poner en cola un evento del sistema y activar Heartbeat cuando la sesión principal deba advertir algo rápidamente. Esa activación no convierte la ejecución de Heartbeat en una tarea en segundo plano.

  </Accordion>
</AccordionGroup>

## Controles de visibilidad

De forma predeterminada, las confirmaciones `HEARTBEAT_OK` se suprimen mientras se entrega el contenido de las alertas. Puedes ajustar este comportamiento por canal o por cuenta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ocultar HEARTBEAT_OK (valor predeterminado)
      showAlerts: true # Mostrar mensajes de alerta (valor predeterminado)
      useIndicator: true # Emitir eventos indicadores (valor predeterminado)
  telegram:
    heartbeat:
      showOk: true # Mostrar confirmaciones OK en Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suprimir la entrega de alertas para esta cuenta
```

Precedencia: por cuenta → por canal → valores predeterminados del canal → valores predeterminados integrados.

### Función de cada indicador

- `showOk`: envía una confirmación `HEARTBEAT_OK` cuando el modelo devuelve una respuesta que solo contiene OK.
- `showAlerts`: envía el contenido de la alerta cuando el modelo devuelve una respuesta distinta de OK.
- `useIndicator`: emite eventos indicadores para las superficies de estado de la interfaz de usuario.

Si **los tres** son falsos, OpenClaw omite por completo la ejecución de Heartbeat (sin llamada al modelo).

### Ejemplos por canal y por cuenta

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # todas las cuentas de Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suprimir las alertas solo para la cuenta de operaciones
  telegram:
    heartbeat:
      showOk: true
```

### Patrones comunes

| Objetivo                                             | Configuración                                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamiento predeterminado (OK silenciosos, alertas activadas) | _(no se necesita configuración)_                                              |
| Silencio total (sin mensajes ni indicador)           | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicador (sin mensajes)                        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK solo en un canal                                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Si existe un archivo `HEARTBEAT.md` en el espacio de trabajo, el prompt predeterminado indica al agente que lo lea. Considéralo tu «lista de comprobación de Heartbeat»: pequeña, estable y segura para consultarla cada 30 minutos.

En las ejecuciones normales, `HEARTBEAT.md` solo se inserta cuando las instrucciones de Heartbeat están habilitadas para el agente predeterminado. Deshabilitar la frecuencia de Heartbeat con `0m` o configurar `includeSystemPromptSection: false` hace que se omita del contexto de arranque normal.

En el entorno nativo de Codex, el contenido de `HEARTBEAT.md` no se inserta en el turno como los demás archivos de arranque. Si el archivo existe y contiene algo más que espacios en blanco, una nota del modo de colaboración de Heartbeat señala el archivo a Codex y le indica que lo lea antes de continuar.

Si `HEARTBEAT.md` existe, pero está prácticamente vacío (solo contiene líneas en blanco, comentarios de Markdown/HTML, encabezados de Markdown como `# Heading`, delimitadores de bloques o elementos vacíos de listas de comprobación), OpenClaw omite la ejecución de Heartbeat para ahorrar llamadas a la API. Esa omisión se registra como `reason=empty-heartbeat-file`. Si falta el archivo, Heartbeat se ejecuta igualmente y el modelo decide qué hacer.

Mantenlo pequeño (una lista breve de comprobación o recordatorios) para evitar inflar el prompt.

Ejemplo de `HEARTBEAT.md`:

```md
# Lista de comprobación de Heartbeat

- Revisión rápida: ¿hay algo urgente en las bandejas de entrada?
- Si es de día, realiza una comprobación breve si no hay nada más pendiente.
- Si una tarea está bloqueada, anota _qué falta_ y pregúntale a Peter la próxima vez.
```

### Bloques `tasks:`

`HEARTBEAT.md` también admite un pequeño bloque estructurado `tasks:` para realizar comprobaciones basadas en intervalos dentro del propio Heartbeat.

Ejemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Comprueba si hay correos urgentes sin leer y señala cualquier asunto con plazos ajustados."
- name: calendar-scan
  interval: 2h
  prompt: "Comprueba si hay próximas reuniones que requieran preparación o seguimiento."

# Instrucciones adicionales

- Mantén las alertas breves.
- Si nada requiere atención después de todas las tareas pendientes, responde HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportamiento">
    - OpenClaw analiza el bloque `tasks:` y comprueba cada tarea según su propio `interval`.
    - Solo se incluyen en el prompt de Heartbeat de ese ciclo las tareas **pendientes**.
    - Si no hay tareas pendientes, Heartbeat se omite por completo (`reason=no-tasks-due`) para evitar una llamada innecesaria al modelo.
    - El contenido de `HEARTBEAT.md` que no pertenece a tareas se conserva y se añade como contexto adicional después de la lista de tareas pendientes.
    - Las marcas de tiempo de la última ejecución de las tareas se almacenan en el estado de la sesión (`heartbeatTaskState`), por lo que los intervalos se conservan tras reinicios normales.
    - Las marcas de tiempo de las tareas solo avanzan cuando una ejecución de Heartbeat completa su flujo de respuesta normal. Las ejecuciones omitidas por `empty-heartbeat-file` / `no-tasks-due` no marcan las tareas como completadas.

  </Accordion>
</AccordionGroup>

El modo de tareas resulta útil cuando quieres que un solo archivo de Heartbeat contenga varias comprobaciones periódicas sin pagar por todas ellas en cada ciclo.

### ¿Puede el agente actualizar HEARTBEAT.md?

Sí, si se lo pides.

`HEARTBEAT.md` es simplemente un archivo normal del espacio de trabajo del agente, por lo que puedes decirle al agente (en un chat normal) algo como:

- «Actualiza `HEARTBEAT.md` para añadir una comprobación diaria del calendario».
- «Reescribe `HEARTBEAT.md` para que sea más breve y se centre en el seguimiento de la bandeja de entrada».

Si quieres que esto ocurra de forma proactiva, también puedes incluir una línea explícita en el prompt de Heartbeat, como: «Si la lista de comprobación queda obsoleta, actualiza HEARTBEAT.md con una mejor».

<Warning>
No incluyas secretos (claves de API, números de teléfono o tokens privados) en `HEARTBEAT.md`, ya que pasa a formar parte del contexto del prompt.
</Warning>

## Activación manual (bajo demanda)

Usa `openclaw system event` para poner en cola un evento del sistema y, opcionalmente, activar de inmediato un Heartbeat:

```bash
openclaw system event --text "Comprobar si hay seguimientos urgentes" --mode now
```

| Indicador                    | Descripción                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--text <text>`              | Texto del evento del sistema (obligatorio).                                                                 |
| `--mode <mode>`              | `now` ejecuta un Heartbeat inmediato; `next-heartbeat` (valor predeterminado) espera al siguiente ciclo programado. |
| `--session-key <sessionKey>` | Dirige el evento a una sesión específica; el valor predeterminado es la sesión principal del agente.       |
| `--json`                     | Genera la salida en formato JSON.                                                                           |

Si no se proporciona `--session-key` y varios agentes tienen configurado `heartbeat`, `--mode now` ejecuta inmediatamente el Heartbeat de cada uno de esos agentes.

Controles de Heartbeat relacionados del mismo grupo de la CLI:

```bash
openclaw system heartbeat last     # mostrar el último evento de Heartbeat
openclaw system heartbeat enable   # habilitar los Heartbeats
openclaw system heartbeat disable  # deshabilitar los Heartbeats
```

## Entrega del razonamiento (opcional)

De forma predeterminada, los Heartbeat entregan únicamente la carga útil final de la «respuesta».

Si desea transparencia, habilite:

- `agents.defaults.heartbeat.includeReasoning: true`

Cuando esta opción está habilitada, los Heartbeat también entregan un mensaje independiente con el prefijo `Thinking` (con el mismo formato que `/reasoning on`). Esto puede resultar útil cuando el agente administra varias sesiones o instancias de Codex y desea saber por qué decidió enviarle un aviso, pero también puede revelar más detalles internos de los que desea. Es preferible mantenerla deshabilitada en los chats grupales.

## Consideraciones de coste

Los Heartbeat ejecutan turnos completos del agente. Los intervalos más cortos consumen más tokens. Para reducir el coste:

- Use `isolatedSession: true` para evitar enviar todo el historial de la conversación (de unos 100 000 tokens a unos 2000-5000 por ejecución).
- Use `lightContext: true` para limitar los archivos de inicialización únicamente a `HEARTBEAT.md`.
- Configure un `model` más económico (por ejemplo, `ollama/llama3.2:1b`).
- Mantenga `HEARTBEAT.md` pequeño.
- Use `target: "none"` si solo desea actualizaciones del estado interno.

## Desbordamiento del contexto después de un Heartbeat

Los Heartbeat conservan el modelo de ejecución existente de la sesión compartida después de que finaliza la ejecución, por lo que un Heartbeat que haya cambiado una sesión a un modelo local más pequeño (por ejemplo, un modelo de Ollama con una ventana de 32 000 tokens) puede dejar ese modelo activo para el siguiente turno de la sesión principal. Si ese turno informa entonces de un desbordamiento del contexto y el último modelo de ejecución de la sesión coincide con el `heartbeat.model` configurado, el mensaje de recuperación de OpenClaw señala la persistencia involuntaria del modelo del Heartbeat como la causa probable y sugiere una solución.

Para evitarlo: use `isolatedSession: true` para ejecutar los Heartbeat en una sesión nueva (opcionalmente junto con `lightContext: true` para obtener el prompt más pequeño), o elija un modelo de Heartbeat con una ventana de contexto suficientemente grande para la sesión compartida.

## Temas relacionados

- [Automatización](/es/automation) - todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) - cómo se realiza el seguimiento del trabajo desvinculado
- [Zona horaria](/es/concepts/timezone) - cómo afecta la zona horaria a la programación de los Heartbeat
- [Solución de problemas](/es/automation/cron-jobs#troubleshooting) - depuración de problemas de automatización
