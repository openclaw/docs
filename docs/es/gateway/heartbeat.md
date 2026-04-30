---
read_when:
    - Ajustar la cadencia de Heartbeat o la mensajería
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Heartbeat
summary: Mensajes de sondeo de Heartbeat y reglas de notificación
title: Heartbeat
x-i18n:
    generated_at: "2026-04-30T05:42:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**¿Heartbeat o cron?** Consulta [Automatización y tareas](/es/automation) para obtener orientación sobre cuándo usar cada uno.
</Note>

Heartbeat ejecuta **turnos periódicos del agente** en la sesión principal para que el modelo pueda mostrar cualquier cosa que requiera atención sin enviarte spam.

Heartbeat es un turno programado de la sesión principal; **no** crea registros de [tareas en segundo plano](/es/automation/tasks). Los registros de tareas son para trabajo separado (ejecuciones de ACP, subagentes, trabajos cron aislados).

Solución de problemas: [Tareas programadas](/es/automation/cron-jobs#troubleshooting)

## Inicio rápido (principiante)

<Steps>
  <Step title="Elige una cadencia">
    Deja los heartbeats activados (el valor predeterminado es `30m`, o `1h` para autenticación OAuth/token de Anthropic, incluida la reutilización de Claude CLI) o configura tu propia cadencia.
  </Step>
  <Step title="Añade HEARTBEAT.md (opcional)">
    Crea una pequeña lista de verificación `HEARTBEAT.md` o un bloque `tasks:` en el espacio de trabajo del agente.
  </Step>
  <Step title="Decide adónde deben ir los mensajes de heartbeat">
    `target: "none"` es el valor predeterminado; configura `target: "last"` para enrutar al último contacto.
  </Step>
  <Step title="Ajuste opcional">
    - Activa la entrega del razonamiento de heartbeat para mayor transparencia.
    - Usa contexto de arranque ligero si las ejecuciones de heartbeat solo necesitan `HEARTBEAT.md`.
    - Activa sesiones aisladas para evitar enviar todo el historial de conversación en cada heartbeat.
    - Restringe los heartbeats a horas activas (hora local).

  </Step>
</Steps>

Configuración de ejemplo:

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
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Valores predeterminados

- Intervalo: `30m` (o `1h` cuando el modo de autenticación detectado es OAuth/token de Anthropic, incluida la reutilización de Claude CLI). Configura `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` por agente; usa `0m` para desactivar.
- Cuerpo del prompt (configurable mediante `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- El prompt de heartbeat se envía **literalmente** como mensaje del usuario. El prompt del sistema incluye una sección "Heartbeat" solo cuando los heartbeats están activados para el agente predeterminado, y la ejecución se marca internamente.
- Cuando los heartbeats están desactivados con `0m`, las ejecuciones normales también omiten `HEARTBEAT.md` del contexto de arranque para que el modelo no vea instrucciones exclusivas de heartbeat.
- Las horas activas (`heartbeat.activeHours`) se comprueban en la zona horaria configurada. Fuera de la ventana, los heartbeats se omiten hasta el siguiente tick dentro de la ventana.
- Los heartbeats se aplazan automáticamente mientras hay trabajo cron activo o en cola. Configura `heartbeat.skipWhenBusy: true` para aplazar también en carriles muy ocupados adicionales (subagente o trabajo de comandos anidados); esto es útil para Ollama local y otros hosts restringidos de runtime único.

## Para qué sirve el prompt de heartbeat

El prompt predeterminado es intencionalmente amplio:

- **Tareas en segundo plano**: "Consider outstanding tasks" empuja al agente a revisar seguimientos (bandeja de entrada, calendario, recordatorios, trabajo en cola) y mostrar cualquier cosa urgente.
- **Comprobación con la persona**: "Checkup sometimes on your human during day time" empuja un mensaje ligero ocasional de "¿necesitas algo?", pero evita el spam nocturno usando tu zona horaria local configurada (consulta [Zona horaria](/es/concepts/timezone)).

Heartbeat puede reaccionar a [tareas en segundo plano](/es/automation/tasks) completadas, pero una ejecución de heartbeat en sí no crea un registro de tarea.

Si quieres que un heartbeat haga algo muy específico (por ejemplo, "check Gmail PubSub stats" o "verify gateway health"), configura `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) con un cuerpo personalizado (enviado literalmente).

## Contrato de respuesta

- Si nada requiere atención, responde con **`HEARTBEAT_OK`**.
- Durante las ejecuciones de heartbeat, OpenClaw trata `HEARTBEAT_OK` como un acuse cuando aparece al **inicio o al final** de la respuesta. El token se elimina y la respuesta se descarta si el contenido restante es **≤ `ackMaxChars`** (valor predeterminado: 300).
- Si `HEARTBEAT_OK` aparece en el **medio** de una respuesta, no se trata de forma especial.
- Para alertas, **no** incluyas `HEARTBEAT_OK`; devuelve solo el texto de la alerta.

Fuera de los heartbeats, un `HEARTBEAT_OK` suelto al inicio/final de un mensaje se elimina y se registra; un mensaje que solo contiene `HEARTBEAT_OK` se descarta.

## Configuración

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Alcance y precedencia

- `agents.defaults.heartbeat` configura el comportamiento global de heartbeat.
- `agents.list[].heartbeat` se fusiona encima; si algún agente tiene un bloque `heartbeat`, **solo esos agentes** ejecutan heartbeats.
- `channels.defaults.heartbeat` configura los valores predeterminados de visibilidad para todos los canales.
- `channels.<channel>.heartbeat` reemplaza los valores predeterminados del canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canales multicuenta) reemplaza la configuración por canal.

### Heartbeats por agente

Si alguna entrada de `agents.list[]` incluye un bloque `heartbeat`, **solo esos agentes** ejecutan heartbeats. El bloque por agente se fusiona encima de `agents.defaults.heartbeat` (para que puedas configurar valores predeterminados compartidos una vez y reemplazarlos por agente).

Ejemplo: dos agentes, solo el segundo agente ejecuta heartbeats.

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

### Ejemplo de horas activas

Restringe los heartbeats al horario laboral en una zona horaria específica:

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

Fuera de esta ventana (antes de las 9 a. m. o después de las 10 p. m., hora del Este), los heartbeats se omiten. El siguiente tick programado dentro de la ventana se ejecutará normalmente.

### Configuración 24/7

Si quieres que los heartbeats se ejecuten todo el día, usa uno de estos patrones:

- Omite `activeHours` por completo (sin restricción de ventana horaria; este es el comportamiento predeterminado).
- Configura una ventana de día completo: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
No configures la misma hora de `start` y `end` (por ejemplo, de `08:00` a `08:00`). Eso se trata como una ventana de ancho cero, por lo que los heartbeats siempre se omiten.
</Warning>

### Ejemplo multicuenta

Usa `accountId` para apuntar a una cuenta específica en canales multicuenta como Telegram:

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

### Notas de campos

<ParamField path="every" type="string">
  Intervalo de heartbeat (cadena de duración; unidad predeterminada = minutos).
</ParamField>
<ParamField path="model" type="string">
  Reemplazo opcional del modelo para ejecuciones de heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Cuando está activado, también entrega el mensaje separado `Reasoning:` cuando está disponible (misma forma que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Cuando es true, las ejecuciones de heartbeat usan contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Cuando es true, cada heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Usa el mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce drásticamente el coste de tokens por heartbeat. Combínalo con `lightContext: true` para obtener el máximo ahorro. El enrutamiento de entrega sigue usando el contexto de la sesión principal.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Cuando es true, las ejecuciones de heartbeat se aplazan en carriles muy ocupados adicionales: subagente o trabajo de comandos anidados. Los carriles de Cron siempre aplazan los heartbeats, incluso sin esta marca, para que los hosts de modelos locales no ejecuten prompts de cron y heartbeat al mismo tiempo.
</ParamField>
<ParamField path="session" type="string">
  Clave de sesión opcional para ejecuciones de heartbeat.

- `main` (predeterminado): sesión principal del agente.
- Clave de sesión explícita (copia desde `openclaw sessions --json` o la [CLI de sesiones](/es/cli/sessions)).
- Formatos de clave de sesión: consulta [Sesiones](/es/concepts/session) y [Grupos](/es/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: entregar al último canal externo usado.
- canal explícito: cualquier canal configurado o id de plugin, por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (predeterminado): ejecutar el heartbeat pero **no entregar** externamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla el comportamiento de entrega directa/DM. `allow`: permitir la entrega directa/DM de heartbeat. `block`: suprimir la entrega directa/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Reemplazo opcional de destinatario (id específico del canal, por ejemplo E.164 para WhatsApp o un id de chat de Telegram). Para temas/hilos de Telegram, usa `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id de cuenta opcional para canales multicuenta. Cuando `target: "last"`, el id de cuenta se aplica al último canal resuelto si admite cuentas; de lo contrario, se ignora. Si el id de cuenta no coincide con una cuenta configurada para el canal resuelto, la entrega se omite.

</ParamField>
<ParamField path="prompt" type="string">
  Reemplaza el cuerpo del prompt predeterminado (no se fusiona).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Máximo de caracteres permitidos después de `HEARTBEAT_OK` antes de la entrega.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Cuando es true, suprime las cargas útiles de advertencia de error de herramienta durante las ejecuciones de Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Restringe las ejecuciones de Heartbeat a una ventana horaria. Objeto con `start` (HH:MM, inclusivo; usa `00:00` para el inicio del día), `end` (HH:MM exclusivo; se permite `24:00` para el fin del día) y `timezone` opcional.

- Omitido o `"user"`: usa tu `agents.defaults.userTimezone` si está configurado; de lo contrario, recurre a la zona horaria del sistema anfitrión.
- `"local"`: usa siempre la zona horaria del sistema anfitrión.
- Cualquier identificador IANA (por ejemplo, `America/New_York`): se usa directamente; si no es válido, recurre al comportamiento `"user"` anterior.
- `start` y `end` no deben ser iguales para una ventana activa; los valores iguales se tratan como ancho cero (siempre fuera de la ventana).
- Fuera de la ventana activa, los Heartbeats se omiten hasta el siguiente tick dentro de la ventana.

</ParamField>

## Comportamiento de entrega

<AccordionGroup>
  <Accordion title="Session and target routing">
    - Los Heartbeats se ejecutan de forma predeterminada en la sesión principal del agente (`agent:<id>:<mainKey>`), o en `global` cuando `session.scope = "global"`. Configura `session` para anularlo con una sesión de canal específica (Discord/WhatsApp/etc.).
    - `session` solo afecta al contexto de ejecución; la entrega la controlan `target` y `to`.
    - Para entregar a un canal/destinatario específico, configura `target` + `to`. Con `target: "last"`, la entrega usa el último canal externo de esa sesión.
    - Las entregas de Heartbeat permiten destinos directos/DM de forma predeterminada. Configura `directPolicy: "block"` para suprimir los envíos a destinos directos y seguir ejecutando el turno de Heartbeat.
    - Si la cola principal, el carril de sesión de destino, el carril de cron o un trabajo de cron activo están ocupados, el Heartbeat se omite y se reintenta más tarde.
    - Si `skipWhenBusy: true`, los carriles de subagentes y anidados también difieren las ejecuciones de Heartbeat.
    - Si `target` no se resuelve en ningún destino externo, la ejecución sigue ocurriendo, pero no se envía ningún mensaje saliente.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - Si `showOk`, `showAlerts` y `useIndicator` están todos desactivados, la ejecución se omite de entrada como `reason=alerts-disabled`.
    - Si solo está desactivada la entrega de alertas, OpenClaw todavía puede ejecutar el Heartbeat, actualizar las marcas de tiempo de tareas vencidas, restaurar la marca de tiempo de inactividad de la sesión y suprimir la carga útil de alerta externa.
    - Si el destino de Heartbeat resuelto admite escritura, OpenClaw muestra escritura mientras la ejecución de Heartbeat está activa. Esto usa el mismo destino al que el Heartbeat enviaría la salida de chat, y se desactiva con `typingMode: "never"`.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - Las respuestas solo de Heartbeat **no** mantienen viva la sesión. Los metadatos de Heartbeat pueden actualizar la fila de sesión, pero la expiración por inactividad usa `lastInteractionAt` del último mensaje real de usuario/canal, y la expiración diaria usa `sessionStartedAt`.
    - El historial de Control UI y WebChat oculta las solicitudes de Heartbeat y las confirmaciones solo OK. La transcripción subyacente de la sesión aún puede contener esos turnos para auditoría/reproducción.
    - Las [tareas en segundo plano](/es/automation/tasks) desacopladas pueden poner en cola un evento del sistema y despertar el Heartbeat cuando la sesión principal debe notar algo rápidamente. Ese despertar no convierte la ejecución de Heartbeat en una tarea en segundo plano.

  </Accordion>
</AccordionGroup>

## Controles de visibilidad

De forma predeterminada, las confirmaciones `HEARTBEAT_OK` se suprimen mientras se entrega contenido de alerta. Puedes ajustar esto por canal o por cuenta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Precedencia: por cuenta → por canal → valores predeterminados del canal → valores predeterminados integrados.

### Qué hace cada indicador

- `showOk`: envía una confirmación `HEARTBEAT_OK` cuando el modelo devuelve una respuesta solo OK.
- `showAlerts`: envía el contenido de alerta cuando el modelo devuelve una respuesta que no es OK.
- `useIndicator`: emite eventos de indicador para superficies de estado de UI.

Si **los tres** son false, OpenClaw omite por completo la ejecución de Heartbeat (sin llamada al modelo).

### Ejemplos por canal frente a por cuenta

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Patrones comunes

| Objetivo                                 | Configuración                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamiento predeterminado (OK silenciosos, alertas activadas) | _(no se necesita configuración)_                                                         |
| Totalmente silencioso (sin mensajes, sin indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicador (sin mensajes)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK solo en un canal                      | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Si existe un archivo `HEARTBEAT.md` en el espacio de trabajo, la solicitud predeterminada le indica al agente que lo lea. Piensa en él como tu "lista de verificación de Heartbeat": pequeña, estable y segura para incluir cada 30 minutos.

En ejecuciones normales, `HEARTBEAT.md` solo se inyecta cuando la guía de Heartbeat está habilitada para el agente predeterminado. Desactivar la cadencia de Heartbeat con `0m` o configurar `includeSystemPromptSection: false` lo omite del contexto de arranque normal.

Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco y encabezados markdown como `# Heading`), OpenClaw omite la ejecución de Heartbeat para ahorrar llamadas a la API. Esa omisión se reporta como `reason=empty-heartbeat-file`. Si falta el archivo, el Heartbeat aún se ejecuta y el modelo decide qué hacer.

Mantenlo diminuto (lista de verificación o recordatorios breves) para evitar inflar la solicitud.

Ejemplo de `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Bloques `tasks:`

`HEARTBEAT.md` también admite un pequeño bloque estructurado `tasks:` para comprobaciones basadas en intervalos dentro del propio Heartbeat.

Ejemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Behavior">
    - OpenClaw analiza el bloque `tasks:` y comprueba cada tarea contra su propio `interval`.
    - Solo las tareas **vencidas** se incluyen en la solicitud de Heartbeat para ese tick.
    - Si no hay tareas vencidas, el Heartbeat se omite por completo (`reason=no-tasks-due`) para evitar una llamada al modelo desperdiciada.
    - El contenido que no es de tareas en `HEARTBEAT.md` se conserva y se agrega como contexto adicional después de la lista de tareas vencidas.
    - Las marcas de tiempo de la última ejecución de las tareas se almacenan en el estado de sesión (`heartbeatTaskState`), por lo que los intervalos sobreviven a reinicios normales.
    - Las marcas de tiempo de tareas solo avanzan después de que una ejecución de Heartbeat complete su ruta normal de respuesta. Las ejecuciones omitidas por `empty-heartbeat-file` / `no-tasks-due` no marcan tareas como completadas.

  </Accordion>
</AccordionGroup>

El modo de tareas es útil cuando quieres que un archivo de Heartbeat contenga varias comprobaciones periódicas sin pagar por todas ellas en cada tick.

### ¿Puede el agente actualizar HEARTBEAT.md?

Sí, si se lo pides.

`HEARTBEAT.md` es solo un archivo normal en el espacio de trabajo del agente, así que puedes decirle al agente (en un chat normal) algo como:

- "Actualiza `HEARTBEAT.md` para agregar una comprobación diaria del calendario."
- "Reescribe `HEARTBEAT.md` para que sea más corto y esté centrado en seguimientos de la bandeja de entrada."

Si quieres que esto ocurra de forma proactiva, también puedes incluir una línea explícita en tu solicitud de Heartbeat como: "Si la lista de verificación queda obsoleta, actualiza HEARTBEAT.md con una mejor."

<Warning>
No pongas secretos (claves de API, números de teléfono, tokens privados) en `HEARTBEAT.md`: pasa a formar parte del contexto de la solicitud.
</Warning>

## Activación manual (bajo demanda)

Puedes poner en cola un evento del sistema y activar un Heartbeat inmediato con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si varios agentes tienen `heartbeat` configurado, una activación manual ejecuta de inmediato cada uno de esos Heartbeats de agente.

Usa `--mode next-heartbeat` para esperar al siguiente tick programado.

## Entrega de razonamiento (opcional)

De forma predeterminada, los Heartbeats entregan solo la carga útil final de "respuesta".

Si quieres transparencia, habilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Cuando está habilitado, los Heartbeats también entregarán un mensaje separado con el prefijo `Reasoning:` (misma forma que `/reasoning on`). Esto puede ser útil cuando el agente gestiona varias sesiones/codexes y quieres ver por qué decidió contactarte, pero también puede filtrar más detalle interno del que deseas. Es preferible mantenerlo desactivado en chats grupales.

## Conciencia de costos

Los Heartbeats ejecutan turnos completos de agente. Los intervalos más cortos consumen más tokens. Para reducir costos:

- Usa `isolatedSession: true` para evitar enviar todo el historial de conversación (de ~100K tokens a ~2-5K por ejecución).
- Usa `lightContext: true` para limitar los archivos de arranque solo a `HEARTBEAT.md`.
- Configura un `model` más barato (por ejemplo, `ollama/llama3.2:1b`).
- Mantén `HEARTBEAT.md` pequeño.
- Usa `target: "none"` si solo quieres actualizaciones de estado internas.

## Desbordamiento de contexto después de Heartbeat

Si un Heartbeat usa un modelo local más pequeño, por ejemplo un modelo de Ollama con una ventana de 32k, y el siguiente turno de la sesión principal reporta desbordamiento de contexto, comprueba si el Heartbeat anterior dejó la sesión en el modelo de Heartbeat. El mensaje de restablecimiento de OpenClaw lo indica cuando el último modelo de runtime coincide con el `heartbeat.model` configurado.

Usa `isolatedSession: true` para ejecutar Heartbeats en una sesión nueva, combínalo con `lightContext: true` para obtener la solicitud más pequeña, o elige un modelo de Heartbeat con una ventana de contexto suficientemente grande para la sesión compartida.

## Relacionado

- [Automatización y tareas](/es/automation): todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks): cómo se rastrea el trabajo desacoplado
- [Zona horaria](/es/concepts/timezone): cómo la zona horaria afecta a la programación de Heartbeat
- [Solución de problemas](/es/automation/cron-jobs#troubleshooting): depuración de problemas de automatización
