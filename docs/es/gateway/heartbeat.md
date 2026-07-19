---
read_when:
    - Ajuste de la cadencia o los mensajes del Heartbeat
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Heartbeat
summary: Mensajes de sondeo de Heartbeat y reglas de notificación
title: Heartbeat
x-i18n:
    generated_at: "2026-07-19T01:55:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 84129f3660ca730698dcda2e8ddf04dce909d3e3a4a9823e886eab53be52f61a
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**¿Heartbeat o cron?** Consulte [Automatización](/es/automation) para obtener orientación sobre cuándo usar cada uno.
</Note>

Heartbeat ejecuta **turnos periódicos del agente** en la sesión principal para que el modelo pueda señalar cualquier asunto que requiera atención sin enviar mensajes en exceso.

Heartbeat es un turno programado de la sesión principal; **no** crea registros de [tareas en segundo plano](/es/automation/tasks). Los registros de tareas son para trabajos independientes (ejecuciones de ACP, subagentes y trabajos de cron aislados).

Solución de problemas: [Tareas programadas](/es/automation/cron-jobs#troubleshooting)

## Inicio rápido (principiantes)

<Steps>
  <Step title="Elegir una frecuencia">
    Deje habilitados los heartbeats (el valor predeterminado es `30m`, o `1h` cuando se configura la autenticación OAuth/mediante token de Anthropic, incluida la reutilización de la CLI de Claude) o establezca su propia frecuencia.
  </Step>
  <Step title="Añadir HEARTBEAT.md (opcional)">
    Cree una pequeña lista de comprobación `HEARTBEAT.md` o un bloque `tasks:` en el espacio de trabajo del agente.
  </Step>
  <Step title="Decidir dónde deben enviarse los mensajes de heartbeat">
    `target: "none"` es el valor predeterminado; establezca `target: "last"` para dirigirlos al último contacto.
  </Step>
  <Step title="Ajustes opcionales">
    - Habilite el envío del razonamiento de heartbeat para ofrecer transparencia.
    - Use un contexto de arranque ligero si las ejecuciones de heartbeat solo necesitan `HEARTBEAT.md`.
    - Habilite sesiones aisladas para evitar enviar el historial completo de la conversación en cada heartbeat.
    - Restrinja los heartbeats a las horas activas (hora local).

  </Step>
</Steps>

Ejemplo de configuración:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita al último contacto (el valor predeterminado es "none")
        directPolicy: "allow", // valor predeterminado: permitir destinos directos/DM; establecer "block" para suprimirlos
        lightContext: true, // opcional: inyectar únicamente HEARTBEAT.md desde los archivos de arranque
        isolatedSession: true, // opcional: sesión nueva en cada ejecución (sin historial de conversación)
        skipWhenBusy: true, // opcional: aplazar también cuando estén ocupados los carriles de subagentes o anidados de este agente
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: enviar también un mensaje `Thinking` independiente
      },
    },
  },
}
```

## Valores predeterminados

- Intervalo: `30m`. Al aplicar los valores predeterminados del proveedor Anthropic, aumenta a `1h` cuando el modo de autenticación resuelto es OAuth/mediante token (incluida la reutilización de la CLI de Claude), pero solo mientras `heartbeat.every` no esté definido. Establezca `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` por agente; use `0m` para deshabilitarlo.
- Cuerpo del prompt (configurable mediante `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Tiempo de espera: los turnos de heartbeat sin un valor definido usan `agents.defaults.timeoutSeconds` cuando está establecido. De lo contrario, usan la frecuencia de heartbeat, con un límite de 600 segundos. Establezca `agents.defaults.heartbeat.timeoutSeconds` o `agents.list[].heartbeat.timeoutSeconds` por agente para trabajos de heartbeat más prolongados.
- El prompt de heartbeat se envía **literalmente** como mensaje del usuario. El prompt del sistema incluye una sección «Heartbeats» solo cuando los heartbeats están habilitados para el agente predeterminado (y `includeSystemPromptSection` no es `false`), y la ejecución se marca internamente.
- Cuando los heartbeats se deshabilitan con `0m`, las ejecuciones normales también omiten `HEARTBEAT.md` del contexto de arranque para que el modelo no vea instrucciones exclusivas de heartbeat.
- Las horas activas (`heartbeat.activeHours`) se comprueban en la zona horaria configurada. Fuera de ese intervalo, los heartbeats se omiten hasta el siguiente ciclo que esté dentro del intervalo.
- Los heartbeats se aplazan automáticamente mientras haya trabajos de cron activos o en cola. Establezca `heartbeat.skipWhenBusy: true` para aplazar también un agente cuando estén activos sus propios carriles de subagentes vinculados a la clave de sesión o de comandos anidados; los agentes del mismo nivel ya no se pausan solo porque otro agente tenga trabajo de subagentes en curso.

## Para qué sirve el prompt de heartbeat

El prompt predeterminado es deliberadamente amplio:

- **Tareas en segundo plano**: «Considerar las tareas pendientes» incita al agente a revisar seguimientos (bandeja de entrada, calendario, recordatorios y trabajos en cola) y señalar cualquier asunto urgente.
- **Consulta a la persona**: «Preguntar ocasionalmente durante el día cómo está la persona» incita a enviar de vez en cuando un breve mensaje como «¿necesita algo?», pero evita el exceso de mensajes nocturnos mediante la zona horaria local configurada (consulte [Zona horaria](/es/concepts/timezone)).

Heartbeat puede reaccionar a [tareas en segundo plano](/es/automation/tasks) completadas, pero una ejecución de heartbeat no crea por sí misma un registro de tarea.

Si desea que un heartbeat haga algo muy específico (por ejemplo, «comprobar las estadísticas de Gmail PubSub» o «verificar el estado del Gateway»), establezca `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) con un cuerpo personalizado (enviado literalmente).

## Contrato de respuesta

- Si nada requiere atención, responda con **`HEARTBEAT_OK`**.
- En su lugar, las ejecuciones de heartbeat pueden llamar a `heartbeat_respond` con `notify: false` para no mostrar ninguna actualización visible, o a `notify: true` junto con `notificationText` para emitir una alerta. Cuando está presente, la respuesta estructurada de la herramienta tiene prioridad sobre la alternativa de texto.
- Un resultado significativo de `heartbeat_respond` con `notify: false` permanece oculto, pero se recuerda como contexto interno acotado para el siguiente turno del usuario en esa sesión. Las confirmaciones `no_change` y las notificaciones visibles no se almacenan de esta forma.
- Durante las ejecuciones de heartbeat, OpenClaw trata `HEARTBEAT_OK` como una confirmación cuando aparece al **principio o al final** de la respuesta. El token se elimina y la respuesta se descarta si el contenido restante tiene **≤ `ackMaxChars`** (valor predeterminado: 300).
- Si `HEARTBEAT_OK` aparece en la parte **intermedia** de una respuesta, no recibe ningún tratamiento especial.
- Para las alertas, **no** incluya `HEARTBEAT_OK`; devuelva únicamente el texto de la alerta.

Fuera de los heartbeats, cualquier `HEARTBEAT_OK` aislado al principio o al final de un mensaje se elimina y se registra; los mensajes que contienen únicamente `HEARTBEAT_OK` se descartan.

## Configuración

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // valor predeterminado: 30m (0m lo desactiva)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // valor predeterminado: false (envía un mensaje de razonamiento independiente cuando está disponible)
        lightContext: false, // valor predeterminado: false; true conserva solo HEARTBEAT.md de los archivos de arranque del espacio de trabajo
        isolatedSession: false, // valor predeterminado: false; true ejecuta cada heartbeat en una sesión nueva (sin historial de conversación)
        skipWhenBusy: false, // valor predeterminado: false; true también espera a los subagentes y carriles anidados de este agente
        target: "last", // valor predeterminado: none | opciones: last | none | <channel id> (núcleo o plugin, p. ej., "imessage")
        to: "+15551234567", // sustitución opcional específica del canal
        accountId: "ops-bot", // id. opcional del canal para varias cuentas
        prompt: "Lee HEARTBEAT.md si existe (contexto del espacio de trabajo). Síguelo estrictamente. No deduzcas ni repitas tareas antiguas de conversaciones anteriores. Si nada requiere atención, responde HEARTBEAT_OK.",
        includeSystemPromptSection: true, // valor predeterminado: true; false omite la sección ## Heartbeats del prompt del sistema para el agente predeterminado
        ackMaxChars: 300, // número máximo de caracteres permitidos después de HEARTBEAT_OK
      },
    },
  },
}
```

### Alcance y precedencia

- `agents.defaults.heartbeat` establece el comportamiento global de los heartbeats.
- `agents.list[].heartbeat` se combina por encima; si algún agente tiene un bloque `heartbeat`, **solo esos agentes** ejecutan heartbeats.
- `channels.defaults.heartbeat` establece los valores predeterminados de visibilidad para todos los canales.
- `channels.<channel>.heartbeat` sustituye los valores predeterminados del canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canales con varias cuentas) sustituye la configuración de cada canal.

### Heartbeats por agente

Si alguna entrada `agents.list[]` incluye un bloque `heartbeat`, **solo esos agentes** ejecutan heartbeats. El bloque por agente se combina por encima de `agents.defaults.heartbeat` (por lo que se pueden establecer una sola vez los valores predeterminados compartidos y sustituirlos para cada agente).

Ejemplo: dos agentes; solo el segundo ejecuta heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita al último contacto (el valor predeterminado es "none")
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
          prompt: "Lee HEARTBEAT.md si existe (contexto del espacio de trabajo). Síguelo estrictamente. No deduzcas ni repitas tareas antiguas de conversaciones anteriores. Si nada requiere atención, responde HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Ejemplo de horario activo

Restringe los heartbeats al horario laboral de una zona horaria específica:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita al último contacto (el valor predeterminado es "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcional; usa userTimezone si está establecido; de lo contrario, usa la zona horaria del host
        },
      },
    },
  },
}
```

Fuera de esta franja (antes de las 9 a. m. o después de las 10 p. m., hora del Este), se omiten los Heartbeat. El siguiente ciclo programado dentro de la franja se ejecutará con normalidad.

### Configuración 24/7

Para que los Heartbeat se ejecuten durante todo el día, utilice uno de estos patrones:

- Omita `activeHours` por completo (sin restricción de franja horaria; este es el comportamiento predeterminado).
- Establezca una franja de día completo: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
No establezca la misma hora para `start` y `end` (por ejemplo, de `08:00` a `08:00`). Esto se interpreta como una franja de amplitud cero, por lo que los Heartbeat siempre se omiten.
</Warning>

### Ejemplo con varias cuentas

Utilice `accountId` para seleccionar una cuenta específica en canales con varias cuentas, como Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opcional: dirigir a un tema/hilo específico
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
  Sustitución opcional del modelo para las ejecuciones de Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Cuando se habilita, también se entrega el mensaje `Thinking` por separado cuando está disponible (con la misma estructura que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Cuando es verdadero, las ejecuciones de Heartbeat utilizan un contexto de arranque ligero y conservan únicamente `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Cuando es verdadero, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversaciones previo. Utiliza el mismo patrón de aislamiento que `sessionTarget: "isolated"` de Cron. Reduce drásticamente el coste de tokens por Heartbeat. Combínelo con `lightContext: true` para lograr el máximo ahorro. El enrutamiento de la entrega sigue utilizando el contexto de la sesión principal.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Cuando es verdadero, las ejecuciones de Heartbeat se aplazan en los carriles ocupados adicionales de ese agente: el trabajo de su propio subagente vinculado a la clave de sesión o de comandos anidados. Los carriles de Cron siempre aplazan los Heartbeat, incluso sin esta opción, para que los hosts de modelos locales no ejecuten solicitudes de Cron y Heartbeat al mismo tiempo.
</ParamField>
<ParamField path="session" type="string">
  Clave de sesión opcional para las ejecuciones de Heartbeat.

- `main` (predeterminado): sesión principal del agente.
- Clave de sesión explícita (cópiela de `openclaw sessions --json` o de la [CLI de sesiones](/es/cli/sessions)).
- Formatos de claves de sesión: consulte [Sesiones](/es/concepts/session) y [Grupos](/es/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: entregar en el último canal externo utilizado.
- canal explícito: cualquier canal configurado o id de plugin, por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (predeterminado): ejecutar el Heartbeat, pero **no realizar entregas** externas.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla el comportamiento de entrega directa/por DM. `allow`: permitir la entrega directa/por DM del Heartbeat. `block`: suprimir la entrega directa/por DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Reemplazo opcional del destinatario (id específico del canal, p. ej., E.164 para WhatsApp o un id de chat de Telegram). Para temas/hilos de Telegram, usar `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id de cuenta opcional para canales con varias cuentas. Cuando `target: "last"`, el id de cuenta se aplica al último canal resuelto si admite cuentas; de lo contrario, se ignora. Si el id de cuenta no coincide con una cuenta configurada para el canal resuelto, se omite la entrega.

</ParamField>
<ParamField path="prompt" type="string">
  Reemplaza el cuerpo del prompt predeterminado (no se combina).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Indica si se inyecta la sección `## Heartbeats` del prompt del sistema del agente predeterminado. Establecer `false` para conservar el comportamiento de ejecución del Heartbeat (cadencia, entrega, HEARTBEAT.md), pero omitir las instrucciones del Heartbeat del prompt del sistema del agente.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Número máximo de caracteres permitidos después de `HEARTBEAT_OK` antes de la entrega.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Cuando es verdadero, suprime las cargas útiles de advertencia de errores de herramientas durante las ejecuciones del Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Número máximo de segundos permitidos para un turno del agente de Heartbeat antes de que se cancele. Dejar sin establecer para usar `agents.defaults.timeoutSeconds` cuando esté establecido; de lo contrario, se usa la cadencia del Heartbeat con un límite de 600 segundos.

</ParamField>
<ParamField path="activeHours" type="object">
  Restringe las ejecuciones del Heartbeat a una franja horaria. Objeto con `start` (HH:MM, inclusivo; usar `00:00` para el inicio del día), `end` (HH:MM, exclusivo; se permite `24:00` para el final del día) y `timezone` opcional.

- Omitido o `"user"`: usa `agents.defaults.userTimezone` si está establecido; de lo contrario, recurre a la zona horaria del sistema anfitrión.
- `"local"`: siempre usa la zona horaria del sistema anfitrión.
- Cualquier identificador IANA (p. ej., `America/New_York`): se usa directamente; si no es válido, recurre al comportamiento de `"user"` descrito anteriormente.
- `start` y `end` no deben ser iguales para una franja activa; los valores iguales se tratan como una franja de amplitud cero (siempre fuera de la franja).
- Fuera de la franja activa, los Heartbeats se omiten hasta el siguiente ciclo dentro de la franja.

</ParamField>

## Comportamiento de entrega

<AccordionGroup>
  <Accordion title="Enrutamiento de sesiones y destinos">
    - Los Heartbeats se ejecutan de forma predeterminada en la sesión principal del agente (`agent:<id>:<mainKey>`), o en `global` cuando `session.scope = "global"`. Establecer `session` para usar una sesión de canal específica (Discord/WhatsApp/etc.).
    - `session` solo afecta al contexto de ejecución; la entrega se controla mediante `target` y `to`.
    - Para entregar a un canal/destinatario específico, establecer `target` + `to`. Con `target: "last"`, la entrega usa el último canal externo de esa sesión.
    - Las entregas del Heartbeat permiten destinos directos/por DM de forma predeterminada. Establecer `directPolicy: "block"` para suprimir los envíos a destinos directos sin dejar de ejecutar el turno del Heartbeat.
    - Si la cola principal, el carril de la sesión de destino, el carril de Cron o una tarea de Cron activa están ocupados, el Heartbeat se omite y se vuelve a intentar más tarde.
    - Si `skipWhenBusy: true`, los carriles de subagentes asociados a la sesión y los carriles anidados de este agente también aplazan las ejecuciones del Heartbeat. Los carriles ocupados de otros agentes no aplazan las de este agente.
    - Si `target` no se resuelve en ningún destino externo, la ejecución tiene lugar de todos modos, pero no se envía ningún mensaje saliente.

  </Accordion>
  <Accordion title="Visibilidad y comportamiento de omisión">
    - Si `showOk`, `showAlerts` y `useIndicator` están desactivados, la ejecución se omite desde el principio como `reason=alerts-disabled`.
    - Si solo está desactivada la entrega de alertas, OpenClaw aún puede ejecutar el Heartbeat, actualizar las marcas de tiempo de las tareas pendientes, restaurar la marca de tiempo de inactividad de la sesión y suprimir la carga útil de la alerta externa.
    - Si el destino resuelto del Heartbeat admite el indicador de escritura, OpenClaw lo muestra mientras la ejecución del Heartbeat está activa. Se usa el mismo destino al que el Heartbeat enviaría la salida del chat, y `typingMode: "never"` lo desactiva.

  </Accordion>
  <Accordion title="Ciclo de vida y auditoría de la sesión">
    - Las respuestas exclusivas del Heartbeat **no** mantienen activa la sesión. Los metadatos del Heartbeat pueden actualizar la fila de la sesión, pero el vencimiento por inactividad usa `lastInteractionAt` del último mensaje real del usuario/canal, y el vencimiento diario usa `sessionStartedAt`.
    - El historial de la interfaz de control y WebChat oculta los prompts del Heartbeat y las confirmaciones que solo contienen OK. La transcripción subyacente de la sesión aún puede contener esos turnos para auditoría/reproducción.
    - Las [tareas en segundo plano](/es/automation/tasks) independientes pueden poner en cola un evento del sistema y activar el Heartbeat cuando la sesión principal deba detectar algo rápidamente. Esa activación no convierte la ejecución del Heartbeat en una tarea en segundo plano.

  </Accordion>
</AccordionGroup>

## Controles de visibilidad

De forma predeterminada, se suprimen las confirmaciones `HEARTBEAT_OK` mientras se entrega el contenido de las alertas. Esto se puede ajustar por canal o por cuenta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ocultar HEARTBEAT_OK (predeterminado)
      showAlerts: true # Mostrar mensajes de alerta (predeterminado)
      useIndicator: true # Emitir eventos de indicador (predeterminado)
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
- `showAlerts`: envía el contenido de la alerta cuando el modelo devuelve una respuesta que no es OK.
- `useIndicator`: emite eventos de indicador para las superficies de estado de la interfaz de usuario.

Si **los tres** son falsos, OpenClaw omite por completo la ejecución del Heartbeat (no se llama al modelo).

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

### Patrones habituales

| Objetivo                                        | Configuración                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Comportamiento predeterminado (OK silenciosos, alertas activadas) | _(no se necesita configuración)_                                           |
| Silencio total (sin mensajes ni indicador)      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicador (sin mensajes)                   | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK solo en un canal                             | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Si existe un archivo `HEARTBEAT.md` en el espacio de trabajo, el prompt predeterminado indica al agente que lo lea. Puede considerarse una «lista de comprobación del Heartbeat»: pequeña, estable y segura para revisarla cada 30 minutos.

En las ejecuciones normales, `HEARTBEAT.md` solo se inyecta cuando las indicaciones del Heartbeat están habilitadas para el agente predeterminado. Deshabilitar la cadencia del Heartbeat con `0m` o establecer `includeSystemPromptSection: false` hace que se omita del contexto de arranque normal.

En el entorno nativo de Codex, el contenido de `HEARTBEAT.md` no se inyecta en el turno como ocurre con otros archivos de arranque. Si el archivo existe y contiene caracteres que no sean espacios en blanco, una nota del modo de colaboración del Heartbeat remite a Codex al archivo y le indica que lo lea antes de continuar.

Si `HEARTBEAT.md` existe, pero está efectivamente vacío (solo contiene líneas en blanco, comentarios de Markdown/HTML, encabezados de Markdown como `# Heading`, marcadores de bloques delimitados o elementos vacíos de listas de comprobación), OpenClaw omite la ejecución del Heartbeat para ahorrar llamadas a la API. Esa omisión se registra como `reason=empty-heartbeat-file`. Si falta el archivo, el Heartbeat se ejecuta de todos modos y el modelo decide qué hacer.

Mantenerlo pequeño (una lista de comprobación breve o recordatorios) para evitar que el prompt aumente innecesariamente.

Ejemplo de `HEARTBEAT.md`:

```md
# Lista de comprobación del Heartbeat

- Revisión rápida: ¿hay algo urgente en las bandejas de entrada?
- Si es de día y no hay nada más pendiente, realizar una comprobación ligera.
- Si una tarea está bloqueada, anotar _qué falta_ y preguntar a Peter la próxima vez.
```

### Bloques de `tasks:`

`HEARTBEAT.md` también admite un pequeño bloque estructurado `tasks:` para realizar comprobaciones basadas en intervalos dentro del propio Heartbeat.

Ejemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Comprobar si hay correos electrónicos urgentes sin leer y marcar todo lo que dependa del tiempo."
- name: calendar-scan
  interval: 2h
  prompt: "Comprobar si hay próximas reuniones que requieran preparación o seguimiento."

# Instrucciones adicionales

- Mantener breves las alertas.
- Si nada requiere atención después de todas las tareas pendientes, responder HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportamiento">
    - OpenClaw analiza el bloque `tasks:` y comprueba cada tarea con respecto a su propio `interval`.
    - En el prompt del Heartbeat de ese ciclo solo se incluyen las tareas **pendientes**.
    - Si no hay tareas pendientes, el Heartbeat se omite por completo (`reason=no-tasks-due`) para evitar desperdiciar una llamada al modelo.
    - El contenido que no corresponde a tareas en `HEARTBEAT.md` se conserva y se añade como contexto adicional después de la lista de tareas pendientes.
    - Las marcas de tiempo de la última ejecución de las tareas se almacenan en el estado de la sesión (`heartbeatTaskState`), por lo que los intervalos se conservan tras reinicios normales.
    - Las marcas de tiempo de las tareas solo avanzan después de que una ejecución del Heartbeat complete su flujo normal de respuesta. Las ejecuciones omitidas por `empty-heartbeat-file` / `no-tasks-due` no marcan las tareas como completadas.

  </Accordion>
</AccordionGroup>

El modo de tareas resulta útil cuando se desea que un único archivo del Heartbeat contenga varias comprobaciones periódicas sin pagar por todas ellas en cada ciclo.

### ¿Puede el agente actualizar HEARTBEAT.md?

Sí, si se le solicita.

`HEARTBEAT.md` es simplemente un archivo normal del espacio de trabajo del agente, por lo que se puede indicar al agente (en un chat normal) algo como:

- «Actualizar `HEARTBEAT.md` para añadir una comprobación diaria del calendario».
- «Reescribir `HEARTBEAT.md` para que sea más breve y se centre en el seguimiento de la bandeja de entrada».

Si se desea que esto ocurra de forma proactiva, también se puede incluir una línea explícita en el prompt del Heartbeat, como: «Si la lista de comprobación queda obsoleta, actualizar HEARTBEAT.md con una mejor».

<Warning>
No incluir secretos (claves de API, números de teléfono o tokens privados) en `HEARTBEAT.md`, ya que pasan a formar parte del contexto del prompt.
</Warning>

## Activación manual (bajo demanda)

Usar `openclaw system event` para poner en cola un evento del sistema y, opcionalmente, activar un Heartbeat inmediato:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| Opción                       | Descripción                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | Texto del evento del sistema (obligatorio).                                                      |
| `--mode <mode>`              | `now` ejecuta un Heartbeat inmediato; `next-heartbeat` (valor predeterminado) espera hasta la siguiente ejecución programada. |
| `--session-key <sessionKey>` | Dirige el evento a una sesión específica; de forma predeterminada, se usa la sesión principal del agente. |
| `--json`                     | Genera la salida en formato JSON.                                                                |

Si no se proporciona `--session-key` y varios agentes tienen `heartbeat` configurado, `--mode now` ejecuta inmediatamente el Heartbeat de cada uno de esos agentes.

Controles de Heartbeat relacionados del mismo grupo de la CLI:

```bash
openclaw system heartbeat last     # muestra el último evento de Heartbeat
openclaw system heartbeat enable   # habilita los Heartbeats
openclaw system heartbeat disable  # deshabilita los Heartbeats
```

## Entrega del razonamiento (opcional)

De forma predeterminada, los Heartbeats solo entregan la carga útil final de la «respuesta».

Para habilitar la transparencia:

- `agents.defaults.heartbeat.includeReasoning: true`

Cuando esta opción está habilitada, los Heartbeats también entregan un mensaje independiente con el prefijo `Thinking` (con la misma estructura que `/reasoning on`). Esto puede resultar útil cuando el agente administra varias sesiones o instancias de Codex y se desea saber por qué decidió enviar una notificación, pero también puede revelar más detalles internos de los deseados. Es preferible mantenerla desactivada en los chats grupales.

## Consideraciones sobre los costes

Los Heartbeats ejecutan turnos completos del agente. Los intervalos más cortos consumen más tokens. Para reducir el coste:

- Use `isolatedSession: true` para evitar enviar el historial completo de la conversación (de unos 100 000 tokens a unos 2000-5000 por ejecución).
- Use `lightContext: true` para limitar los archivos de arranque únicamente a `HEARTBEAT.md`.
- Configure un `model` más económico (por ejemplo, `ollama/llama3.2:1b`).
- Mantenga `HEARTBEAT.md` pequeño.
- Use `target: "none"` si solo se desean actualizaciones del estado interno.

## Desbordamiento del contexto después de un Heartbeat

Los Heartbeats conservan el modelo de ejecución existente de la sesión compartida una vez finalizada la ejecución. Por tanto, un Heartbeat que haya cambiado una sesión a un modelo local más pequeño (por ejemplo, un modelo de Ollama con una ventana de 32k) puede dejar ese modelo activo para el siguiente turno de la sesión principal. Si ese siguiente turno informa de un desbordamiento del contexto y el último modelo de ejecución de la sesión coincide con el valor configurado en `heartbeat.model`, el mensaje de recuperación de OpenClaw señala la propagación del modelo del Heartbeat como la causa probable y sugiere una solución.

Para evitarlo: use `isolatedSession: true` para ejecutar los Heartbeats en una sesión nueva (opcionalmente en combinación con `lightContext: true` para obtener el prompt más pequeño), o elija un modelo de Heartbeat con una ventana de contexto suficientemente grande para la sesión compartida.

## Temas relacionados

- [Automatización](/es/automation) - resumen de todos los mecanismos de automatización
- [Tareas en segundo plano](/es/automation/tasks) - cómo se realiza el seguimiento del trabajo desvinculado
- [Zona horaria](/es/concepts/timezone) - cómo afecta la zona horaria a la programación de los Heartbeats
- [Solución de problemas](/es/automation/cron-jobs#troubleshooting) - depuración de problemas de automatización
