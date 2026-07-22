---
read_when:
    - Ajuste de la cadencia o los mensajes de Heartbeat
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Heartbeat
summary: Mensajes de sondeo de Heartbeat y reglas de notificación
title: Heartbeat
x-i18n:
    generated_at: "2026-07-22T10:33:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 91066c93c0921f408da32171701ff732da35ef79a5fc0df4288cb9bcc3437c1a
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**¿Heartbeat o Cron?** Consulte [Automatización](/es/automation) para obtener orientación sobre cuándo usar cada uno.
</Note>

Heartbeat ejecuta **turnos periódicos del agente** en la sesión principal para que el modelo pueda señalar cualquier asunto que requiera atención sin enviar mensajes excesivos.

Heartbeat es un turno programado de la sesión principal; **no** crea registros de [tareas en segundo plano](/es/automation/tasks). Los registros de tareas son para trabajos desvinculados (ejecuciones de ACP, subagentes y trabajos de Cron aislados).

Solución de problemas: [Tareas programadas](/es/automation/cron-jobs#troubleshooting)

## Inicio rápido (principiantes)

<Steps>
  <Step title="Elegir una frecuencia">
    Mantenga los Heartbeats activados (el valor predeterminado es `30m`, o `1h` cuando está configurada la autenticación OAuth/por token de Anthropic, incluida la reutilización de la CLI de Claude) o establezca su propia frecuencia.
  </Step>
  <Step title="Añadir HEARTBEAT.md (opcional)">
    Cree una pequeña lista de comprobación `HEARTBEAT.md` o un bloque `tasks:` en el espacio de trabajo del agente.
  </Step>
  <Step title="Decidir adónde deben enviarse los mensajes de Heartbeat">
    `target: "none"` es el valor predeterminado; establezca `target: "last"` para dirigirlos al último contacto.
  </Step>
  <Step title="Ajustes opcionales">
    - Active la entrega del razonamiento de Heartbeat para ofrecer transparencia.
    - Use un contexto de arranque ligero si las ejecuciones de Heartbeat solo necesitan `HEARTBEAT.md`.
    - Active sesiones aisladas para evitar enviar todo el historial de conversación con cada Heartbeat.
    - Restrinja los Heartbeats al horario activo (hora local).

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
        directPolicy: "allow", // valor predeterminado: permitir destinos directos/DM; use "block" para suprimirlos
        lightContext: true, // opcional: inyectar únicamente HEARTBEAT.md desde los archivos de arranque
        isolatedSession: true, // opcional: sesión nueva en cada ejecución (sin historial de conversación)
        skipWhenBusy: true, // opcional: aplazar también cuando estén ocupados los subagentes o canales anidados de este agente
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: enviar también un mensaje `Thinking` separado
      },
    },
  },
}
```

## Valores predeterminados

- Intervalo: `30m`. Al aplicar los valores predeterminados del proveedor Anthropic, este valor aumenta a `1h` cuando el modo de autenticación resuelto es OAuth/por token (incluida la reutilización de la CLI de Claude), pero solo mientras `heartbeat.every` no esté establecido. Establezca `agents.defaults.heartbeat.every` o `agents.entries.*.heartbeat.every` por agente; use `0m` para desactivarlo.
- Cuerpo del prompt (configurable mediante `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Tiempo de espera: los turnos de Heartbeat sin un valor establecido usan `agents.defaults.timeoutSeconds` cuando está definido. De lo contrario, usan la frecuencia de Heartbeat con un límite de 600 segundos. Establezca `agents.defaults.heartbeat.timeoutSeconds` o `agents.entries.*.heartbeat.timeoutSeconds` por agente para trabajos de Heartbeat más prolongados.
- El prompt de Heartbeat se envía **literalmente** como mensaje del usuario. El prompt del sistema incluye una sección «Heartbeats» solo cuando están activados para el agente predeterminado (y `includeSystemPromptSection` no es `false`), y la ejecución se marca internamente.
- Cuando se desactivan los Heartbeats con `0m`, las ejecuciones normales también omiten `HEARTBEAT.md` del contexto de arranque para que el modelo no vea instrucciones exclusivas de Heartbeat.
- El horario activo (`heartbeat.activeHours`) se comprueba en la zona horaria configurada. Fuera de ese intervalo, los Heartbeats se omiten hasta la siguiente activación dentro del intervalo.
- Los Heartbeats se aplazan automáticamente mientras haya trabajos de Cron activos o en cola. Establezca `heartbeat.skipWhenBusy: true` para aplazar también un agente cuando estén ocupados sus propios subagentes asociados a una clave de sesión o sus canales de comandos anidados; los agentes relacionados ya no se detienen únicamente porque otro agente tenga trabajo de subagentes en curso.

## Para qué sirve el prompt de Heartbeat

El prompt predeterminado es deliberadamente amplio:

- **Tareas en segundo plano**: «Considerar las tareas pendientes» insta al agente a revisar los seguimientos (bandeja de entrada, calendario, recordatorios y trabajo en cola) y señalar cualquier asunto urgente.
- **Comprobación con la persona**: «Preguntar ocasionalmente durante el día cómo está la persona» insta a enviar de vez en cuando un breve mensaje como «¿necesita algo?», pero evita el envío excesivo durante la noche mediante el uso de la zona horaria local configurada (consulte [Zona horaria](/es/concepts/timezone)).

Heartbeat puede reaccionar a [tareas en segundo plano](/es/automation/tasks) completadas, pero una ejecución de Heartbeat no crea por sí misma un registro de tarea.

Si desea que un Heartbeat realice algo muy específico (por ejemplo, «comprobar las estadísticas de Gmail PubSub» o «verificar el estado del Gateway»), establezca `agents.defaults.heartbeat.prompt` (o `agents.entries.*.heartbeat.prompt`) con un cuerpo personalizado (enviado literalmente).

## Contrato de respuesta

- Si nada requiere atención, responda con **`HEARTBEAT_OK`**.
- En su lugar, las ejecuciones de Heartbeat pueden llamar a `heartbeat_respond` con `notify: false` para no mostrar ninguna actualización visible, o a `notify: true` junto con `notificationText` para emitir una alerta. Cuando está presente, la respuesta estructurada de la herramienta tiene prioridad sobre la respuesta de texto alternativa.
- Un resultado significativo de `heartbeat_respond` con `notify: false` permanece en silencio, pero se recuerda como contexto interno acotado para el siguiente turno del usuario en esa sesión. Las confirmaciones `no_change` y las notificaciones visibles no se almacenan de esta forma.
- Durante las ejecuciones de Heartbeat, OpenClaw trata `HEARTBEAT_OK` como una confirmación cuando aparece al **principio o al final** de la respuesta. El token se elimina y la respuesta se descarta si el contenido restante tiene **≤ `ackMaxChars`** (valor predeterminado: 300).
- Si `HEARTBEAT_OK` aparece en **medio** de una respuesta, no recibe ningún tratamiento especial.
- Para las alertas, **no** incluya `HEARTBEAT_OK`; devuelva únicamente el texto de la alerta.

Fuera de los Heartbeats, cualquier `HEARTBEAT_OK` aislado al principio o al final de un mensaje se elimina y se registra; los mensajes que solo contienen `HEARTBEAT_OK` se descartan.

## Configuración

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // valor predeterminado: 30m (0m lo desactiva)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // valor predeterminado: false (entrega un mensaje de Pensamiento separado cuando está disponible)
        lightContext: false, // valor predeterminado: false; true conserva solo HEARTBEAT.md de los archivos de arranque del espacio de trabajo
        isolatedSession: false, // valor predeterminado: false; true ejecuta cada Heartbeat en una sesión nueva (sin historial de conversación)
        skipWhenBusy: false, // valor predeterminado: false; true también espera a los subagentes o carriles anidados de este agente
        target: "last", // valor predeterminado: none | opciones: last | none | <channel id> (núcleo o plugin, p. ej., "imessage")
        to: "+15551234567", // sustitución opcional específica del canal
        accountId: "ops-bot", // id. opcional del canal para varias cuentas
        prompt: "Lee HEARTBEAT.md si existe (contexto del espacio de trabajo). Síguelo estrictamente. No deduzcas ni repitas tareas antiguas de chats anteriores. Si nada requiere atención, responde HEARTBEAT_OK.",
        includeSystemPromptSection: true, // valor predeterminado: true; false omite la sección ## Heartbeats del prompt del sistema para el agente predeterminado
        ackMaxChars: 300, // máximo de caracteres permitidos después de HEARTBEAT_OK
      },
    },
  },
}
```

### Ámbito y precedencia

- `agents.defaults.heartbeat` establece el comportamiento global de Heartbeat.
- `agents.entries.*.heartbeat` se combina por encima; si algún agente tiene un bloque `heartbeat`, **solo esos agentes** ejecutan Heartbeats.
- `channels.defaults.heartbeatVisibility` establece los valores predeterminados de visibilidad para todos los canales.
- `channels.<channel>.heartbeatVisibility` sustituye los valores predeterminados del canal.
- `channels.<channel>.accounts.<id>.heartbeatVisibility` (canales con varias cuentas) sustituye la configuración por canal.

### Heartbeats por agente

Si alguna entrada `agents.entries.*` incluye un bloque `heartbeat`, **solo esos agentes** ejecutan Heartbeats. El bloque por agente se combina por encima de `agents.defaults.heartbeat` (por lo que se pueden establecer una vez los valores predeterminados compartidos y sustituirlos por agente).

Ejemplo: dos agentes; solo el segundo ejecuta Heartbeats.

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
          prompt: "Lee HEARTBEAT.md si existe (contexto del espacio de trabajo). Síguelo estrictamente. No deduzcas ni repitas tareas antiguas de chats anteriores. Si nada requiere atención, responde HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Ejemplo de horario activo

Restringe los Heartbeats al horario laboral de una zona horaria específica:

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
          timezone: "America/New_York", // opcional; usa userTimezone si está configurado; de lo contrario, la zona horaria del host
        },
      },
    },
  },
}
```

Fuera de este intervalo (antes de las 9 a. m. o después de las 10 p. m., hora del Este), se omiten los Heartbeats. La siguiente ejecución programada dentro del intervalo se realizará con normalidad.

### Configuración 24/7

Para que los Heartbeats se ejecuten durante todo el día, usa uno de estos patrones:

- Omite `activeHours` por completo (sin restricción de intervalo horario; este es el comportamiento predeterminado).
- Establece un intervalo de día completo: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
No establezcas la misma hora para `start` y `end` (por ejemplo, de `08:00` a `08:00`). Esto se considera un intervalo de amplitud cero, por lo que los Heartbeats siempre se omiten.
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
          to: "12345678:topic:42", // opcional: enruta a un tema o hilo específico
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
  Cuando está habilitado, también entrega el mensaje `Thinking` separado cuando está disponible (con la misma estructura que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Cuando es true, las ejecuciones de Heartbeat usan un contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación anterior. Usa el mismo patrón de aislamiento que Cron `sessionTarget: "isolated"`. Reduce drásticamente el coste de tokens por Heartbeat. Combínalo con `lightContext: true` para obtener el máximo ahorro. El enrutamiento de la entrega sigue usando el contexto de la sesión principal.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Cuando es true, las ejecuciones de Heartbeat se posponen en los carriles ocupados adicionales de ese agente: el trabajo de sus propios subagentes asociados a una clave de sesión o de comandos anidados. Los carriles de Cron siempre posponen los Heartbeats, incluso sin esta opción, para que los hosts de modelos locales no ejecuten prompts de Cron y Heartbeat al mismo tiempo.
</ParamField>
<ParamField path="session" type="string">
  Clave de sesión opcional para las ejecuciones de Heartbeat.

- `main` (valor predeterminado): sesión principal del agente.
- Clave de sesión explícita (cópiala de `openclaw sessions --json` o de la [CLI de sesiones](/es/cli/sessions)).
- Formatos de claves de sesión: consulta [Sesiones](/es/concepts/session) y [Grupos](/es/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: entregar al último canal externo utilizado.
- canal explícito: cualquier canal configurado o id de plugin, por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (predeterminado): ejecutar el heartbeat, pero **no entregarlo** externamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla el comportamiento de entrega directa/por DM. `allow`: permite la entrega directa/por DM del heartbeat. `block`: suprime la entrega directa/por DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Reemplazo opcional del destinatario (id específico del canal; p. ej., E.164 para WhatsApp o un id de chat de Telegram). Para temas/hilos de Telegram, use `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id de cuenta opcional para canales con varias cuentas. Cuando se usa `target: "last"`, el id de cuenta se aplica al último canal resuelto si admite cuentas; de lo contrario, se ignora. Si el id de cuenta no coincide con una cuenta configurada para el canal resuelto, se omite la entrega.

</ParamField>
<ParamField path="prompt" type="string">
  Reemplaza el cuerpo del prompt predeterminado (no se combina).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Indica si se inyecta la sección `## Heartbeats` del prompt del sistema del agente predeterminado. Establezca `false` para conservar el comportamiento del heartbeat en tiempo de ejecución (cadencia, entrega, HEARTBEAT.md) y omitir sus instrucciones del prompt del sistema del agente.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Número máximo de caracteres permitidos después de `HEARTBEAT_OK` antes de la entrega.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Cuando es verdadero, suprime las cargas de advertencia de errores de herramientas durante las ejecuciones del heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Número máximo de segundos permitidos para un turno del agente de heartbeat antes de que se cancele. Déjelo sin establecer para usar `agents.defaults.timeoutSeconds` cuando esté definido; de lo contrario, se usa la cadencia del heartbeat con un límite de 600 segundos.

</ParamField>
<ParamField path="activeHours" type="object">
  Restringe las ejecuciones del heartbeat a un intervalo horario. Objeto con `start` (HH:MM, inclusivo; use `00:00` para el inicio del día), `end` (HH:MM, exclusivo; se permite `24:00` para el final del día) y `timezone` opcional.

- Omitido o `"user"`: usa su `agents.defaults.userTimezone` si está definido; de lo contrario, recurre a la zona horaria del sistema anfitrión.
- `"local"`: siempre usa la zona horaria del sistema anfitrión.
- Cualquier identificador IANA (p. ej., `America/New_York`): se usa directamente; si no es válido, recurre al comportamiento de `"user"` descrito anteriormente.
- `start` y `end` no deben ser iguales para un intervalo activo; los valores iguales se consideran un intervalo de amplitud cero (siempre fuera del intervalo).
- Fuera del intervalo activo, los heartbeats se omiten hasta el siguiente ciclo que quede dentro del intervalo.

</ParamField>

## Comportamiento de entrega

<AccordionGroup>
  <Accordion title="Enrutamiento de sesiones y destinos">
    - De forma predeterminada, los heartbeats se ejecutan en la sesión principal del agente (`agent:<id>:<mainKey>`), o en `global` cuando se usa `session.scope = "global"`. Establezca `session` para reemplazarla por una sesión de canal específica (Discord/WhatsApp/etc.).
    - `session` solo afecta al contexto de ejecución; la entrega se controla mediante `target` y `to`.
    - Para realizar la entrega a un canal/destinatario específico, establezca `target` + `to`. Con `target: "last"`, la entrega usa el último canal externo de esa sesión.
    - Las entregas del heartbeat permiten destinos directos/por DM de forma predeterminada. Establezca `directPolicy: "block"` para suprimir los envíos a destinos directos sin dejar de ejecutar el turno del heartbeat.
    - Si la cola principal, el carril de la sesión de destino, el carril de cron o un trabajo de cron activo están ocupados, el heartbeat se omite y se vuelve a intentar más tarde.
    - Si se usa `skipWhenBusy: true`, los carriles de subagentes asociados a la sesión de este agente y sus carriles anidados también aplazan las ejecuciones del heartbeat. Los carriles ocupados de otros agentes no aplazan las ejecuciones de este agente.
    - Si `target` no se resuelve en ningún destino externo, la ejecución se realiza igualmente, pero no se envía ningún mensaje saliente.

  </Accordion>
  <Accordion title="Visibilidad y comportamiento de omisión">
    - Si `showOk`, `showAlerts` y `useIndicator` están desactivados, la ejecución se omite de antemano como `reason=alerts-disabled`.
    - Si solo está desactivada la entrega de alertas, OpenClaw aún puede ejecutar el heartbeat, actualizar las marcas de tiempo de las tareas pendientes, restaurar la marca de tiempo de inactividad de la sesión y suprimir la carga de alerta externa.
    - Si el destino resuelto del heartbeat admite indicadores de escritura, OpenClaw muestra que se está escribiendo mientras la ejecución está activa. Esto usa el mismo destino al que el heartbeat enviaría la salida del chat y se desactiva mediante `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo de vida y auditoría de la sesión">
    - Las respuestas exclusivas del heartbeat **no** mantienen activa la sesión. Los metadatos del heartbeat pueden actualizar la fila de la sesión, pero la caducidad por inactividad usa `lastInteractionAt` del último mensaje real del usuario/canal, y la caducidad diaria usa `sessionStartedAt`.
    - El historial de Control UI y WebChat oculta los prompts del heartbeat y las confirmaciones que solo contienen OK. La transcripción subyacente de la sesión puede seguir conteniendo esos turnos para fines de auditoría/reproducción.
    - Las [tareas en segundo plano](/es/automation/tasks) desvinculadas pueden poner en cola un evento del sistema y activar el heartbeat cuando la sesión principal deba advertir algo rápidamente. Esa activación no convierte la ejecución del heartbeat en una tarea en segundo plano.

  </Accordion>
</AccordionGroup>

## Controles de visibilidad

De forma predeterminada, las confirmaciones `HEARTBEAT_OK` se suprimen mientras se entrega el contenido de las alertas. Esto se puede ajustar por canal o por cuenta:

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
- `showAlerts`: envía el contenido de la alerta cuando el modelo devuelve una respuesta distinta de OK.
- `useIndicator`: emite eventos de indicador para las superficies de estado de la interfaz.

Si **los tres** son falsos, OpenClaw omite por completo la ejecución del heartbeat (sin llamada al modelo).

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
          showAlerts: false # suprimir alertas solo para la cuenta ops
  telegram:
    heartbeat:
      showOk: true
```

### Patrones comunes

| Objetivo                                 | Configuración                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamiento predeterminado (OK silenciosos, alertas activadas) | _(no se necesita configuración)_                                                         |
| Silencio total (sin mensajes ni indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicador (sin mensajes)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK solo en un canal                      | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Si existe un archivo `HEARTBEAT.md` en el espacio de trabajo, el prompt predeterminado indica al agente que lo lea. Puede considerarse la «lista de comprobación del heartbeat»: pequeña, estable y segura para consultarla cada 30 minutos.

En ejecuciones normales, `HEARTBEAT.md` solo se inyecta cuando la guía del heartbeat está habilitada para el agente predeterminado. Si se deshabilita la cadencia del heartbeat mediante `0m` o se establece `includeSystemPromptSection: false`, se omite del contexto de arranque normal.

En el entorno nativo de Codex, el contenido de `HEARTBEAT.md` no se inyecta en el turno como los demás archivos de arranque. Si el archivo existe y contiene caracteres distintos de espacios en blanco, una nota del modo de colaboración del heartbeat señala el archivo a Codex y le indica que lo lea antes de continuar.

Si `HEARTBEAT.md` existe, pero está prácticamente vacío (solo líneas en blanco, comentarios de Markdown/HTML, encabezados de Markdown como `# Heading`, marcadores de bloques delimitados o esquemas vacíos de listas de comprobación), OpenClaw omite la ejecución del heartbeat para ahorrar llamadas a la API. Esa omisión se registra como `reason=empty-heartbeat-file`. Si falta el archivo, el heartbeat se ejecuta igualmente y el modelo decide qué hacer.

Manténgalo muy pequeño (una lista de comprobación breve o recordatorios) para evitar que el prompt crezca innecesariamente.

Ejemplo de `HEARTBEAT.md`:

```md
# Lista de comprobación del heartbeat

- Revisión rápida: ¿hay algo urgente en las bandejas de entrada?
- Si es de día, haga una comprobación ligera si no hay nada más pendiente.
- Si una tarea está bloqueada, anote _qué falta_ y pregunte a Peter la próxima vez.
```

### Bloques `tasks:`

`HEARTBEAT.md` también admite un pequeño bloque estructurado `tasks:` para realizar comprobaciones basadas en intervalos dentro del propio heartbeat.

Ejemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Comprueba si hay correos electrónicos urgentes sin leer y marca cualquier asunto sujeto a plazos."
- name: calendar-scan
  interval: 2h
  prompt: "Comprueba si hay próximas reuniones que requieran preparación o seguimiento."

# Instrucciones adicionales

- Mantén las alertas breves.
- Si nada requiere atención después de todas las tareas pendientes, responde HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportamiento">
    - OpenClaw analiza el bloque `tasks:` y comprueba cada tarea con respecto a su propio `interval`.
    - Solo se incluyen en el prompt del heartbeat para ese ciclo las tareas **pendientes**.
    - Si no hay tareas pendientes, el heartbeat se omite por completo (`reason=no-tasks-due`) para evitar una llamada innecesaria al modelo.
    - El contenido que no corresponde a tareas en `HEARTBEAT.md` se conserva y se añade como contexto adicional después de la lista de tareas pendientes.
    - Las marcas de tiempo de la última ejecución de las tareas se almacenan en el estado de la sesión (`heartbeatTaskState`), por lo que los intervalos se conservan tras reinicios normales.
    - Las marcas de tiempo de las tareas solo avanzan después de que una ejecución del heartbeat complete su flujo de respuesta normal. Las ejecuciones `empty-heartbeat-file` / `no-tasks-due` omitidas no marcan las tareas como completadas.

  </Accordion>
</AccordionGroup>

El modo de tareas resulta útil cuando se desea que un solo archivo de heartbeat contenga varias comprobaciones periódicas sin pagar por todas ellas en cada ciclo.

### ¿Puede el agente actualizar HEARTBEAT.md?

Sí, si se le solicita.

`HEARTBEAT.md` es simplemente un archivo normal del espacio de trabajo del agente, por lo que se le puede indicar al agente (en un chat normal) algo como:

- «Actualiza `HEARTBEAT.md` para añadir una comprobación diaria del calendario».
- «Reescribe `HEARTBEAT.md` para que sea más breve y se centre en el seguimiento de la bandeja de entrada».

Si se desea que esto ocurra de forma proactiva, también se puede incluir una línea explícita en el prompt del heartbeat, como: «Si la lista de comprobación queda obsoleta, actualiza HEARTBEAT.md con una mejor».

<Warning>
No incluya secretos (claves de API, números de teléfono o tokens privados) en `HEARTBEAT.md`, ya que pasa a formar parte del contexto del prompt.
</Warning>

## Activación manual (bajo demanda)

Use `openclaw system event` para poner en cola un evento del sistema y, opcionalmente, activar un heartbeat inmediato:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| Opción                       | Descripción                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | Texto del evento del sistema (obligatorio).                                                      |
| `--mode <mode>`              | `now` ejecuta un Heartbeat inmediato; `next-heartbeat` (predeterminado) espera al siguiente ciclo programado. |
| `--session-key <sessionKey>` | Dirige el evento a una sesión específica; de forma predeterminada, se usa la sesión principal del agente. |
| `--json`                     | Genera la salida en formato JSON.                                                                |

Si no se proporciona `--session-key` y varios agentes tienen `heartbeat` configurado, `--mode now` ejecuta inmediatamente los Heartbeats de cada uno de esos agentes.

Controles de Heartbeat relacionados en el mismo grupo de la CLI:

```bash
openclaw system heartbeat last     # mostrar el último evento de Heartbeat
openclaw system heartbeat enable   # habilitar los Heartbeats
openclaw system heartbeat disable  # deshabilitar los Heartbeats
```

## Entrega del razonamiento (opcional)

De forma predeterminada, los Heartbeats solo entregan la carga útil final de la «respuesta».

Para disponer de transparencia, habilite:

- `agents.defaults.heartbeat.includeReasoning: true`

Cuando esta opción está habilitada, los Heartbeats también entregan un mensaje independiente con el prefijo `Thinking` (con el mismo formato que `/reasoning on`). Esto puede resultar útil cuando el agente gestiona varias sesiones o instancias de Codex y se desea saber por qué decidió enviar una notificación, pero también puede revelar más detalles internos de los deseados. Es preferible mantenerlo deshabilitado en los chats grupales.

## Consideraciones sobre los costes

Los Heartbeats ejecutan turnos completos del agente. Los intervalos más cortos consumen más tokens. Para reducir el coste:

- Utilice `isolatedSession: true` para evitar enviar el historial completo de la conversación (de ~100K tokens a ~2-5K por ejecución).
- Utilice `lightContext: true` para limitar los archivos de arranque únicamente a `HEARTBEAT.md`.
- Configure un `model` más económico (por ejemplo, `ollama/llama3.2:1b`).
- Mantenga `HEARTBEAT.md` con un tamaño reducido.
- Utilice `target: "none"` si solo desea actualizaciones del estado interno.

## Desbordamiento del contexto después de un Heartbeat

Los Heartbeats conservan el modelo de ejecución existente de la sesión compartida después de que finaliza la ejecución. Por ello, un Heartbeat que haya cambiado una sesión a un modelo local más pequeño (por ejemplo, un modelo de Ollama con una ventana de 32k) puede dejar ese modelo activo para el siguiente turno de la sesión principal. Si ese turno informa posteriormente de un desbordamiento del contexto y el último modelo de ejecución de la sesión coincide con el `heartbeat.model` configurado, el mensaje de recuperación de OpenClaw señala como causa probable la propagación del modelo del Heartbeat y sugiere una solución.

Para evitarlo: utilice `isolatedSession: true` para ejecutar los Heartbeats en una sesión nueva (opcionalmente junto con `lightContext: true` para obtener el prompt más pequeño), o elija un modelo de Heartbeat con una ventana de contexto suficientemente grande para la sesión compartida.

## Contenido relacionado

- [Automatización](/es/automation) - resumen de todos los mecanismos de automatización
- [Tareas en segundo plano](/es/automation/tasks) - cómo se realiza el seguimiento del trabajo desvinculado
- [Zona horaria](/es/concepts/timezone) - cómo afecta la zona horaria a la programación de los Heartbeats
- [Solución de problemas](/es/automation/cron-jobs#troubleshooting) - depuración de problemas de automatización
