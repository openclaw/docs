---
read_when:
    - Ajustar la cadencia o la mensajería de Heartbeat
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Heartbeat
summary: Mensajes de sondeo de Heartbeat y reglas de notificación
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T00:58:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: de1fee0df75d9e8f356dc02d089f61ae5048c302169acc363eee2149e09aacb3
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**¿Heartbeat frente a cron?** Consulta [Automatización](/es/automation) para obtener orientación sobre cuándo usar cada uno.
</Note>

Heartbeat ejecuta **turnos periódicos del agente** en la sesión principal para que el modelo pueda mostrar cualquier cosa que requiera atención sin enviarte spam.

Heartbeat es un turno programado de la sesión principal; **no** crea registros de [tarea en segundo plano](/es/automation/tasks). Los registros de tareas son para trabajo separado (ejecuciones ACP, subagentes, trabajos cron aislados).

Solución de problemas: [Tareas programadas](/es/automation/cron-jobs#troubleshooting)

## Inicio rápido (principiante)

<Steps>
  <Step title="Elige una cadencia">
    Deja Heartbeat habilitado (el valor predeterminado es `30m`, o `1h` para autenticación OAuth/token de Anthropic, incluida la reutilización de Claude CLI) o define tu propia cadencia.
  </Step>
  <Step title="Agrega HEARTBEAT.md (opcional)">
    Crea una pequeña lista de verificación `HEARTBEAT.md` o un bloque `tasks:` en el espacio de trabajo del agente.
  </Step>
  <Step title="Decide adónde deben ir los mensajes de Heartbeat">
    `target: "none"` es el valor predeterminado; define `target: "last"` para enrutar al último contacto.
  </Step>
  <Step title="Ajuste opcional">
    - Habilita la entrega de razonamiento de Heartbeat para mayor transparencia.
    - Usa contexto de arranque ligero si las ejecuciones de Heartbeat solo necesitan `HEARTBEAT.md`.
    - Habilita sesiones aisladas para evitar enviar el historial completo de conversación en cada Heartbeat.
    - Restringe Heartbeat a horas activas (hora local).

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

- Intervalo: `30m` (o `1h` cuando el modo de autenticación detectado es autenticación OAuth/token de Anthropic, incluida la reutilización de Claude CLI). Define `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` por agente; usa `0m` para deshabilitar.
- Cuerpo del prompt (configurable mediante `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- El prompt de Heartbeat se envía **verbatim** como mensaje del usuario. El prompt del sistema incluye una sección "Heartbeat" solo cuando Heartbeat está habilitado para el agente predeterminado, y la ejecución se marca internamente.
- Cuando Heartbeat se deshabilita con `0m`, las ejecuciones normales también omiten `HEARTBEAT.md` del contexto de arranque para que el modelo no vea instrucciones exclusivas de Heartbeat.
- Las horas activas (`heartbeat.activeHours`) se comprueban en la zona horaria configurada. Fuera de la ventana, Heartbeat se omite hasta el siguiente tick dentro de la ventana.
- Heartbeat se aplaza automáticamente mientras el trabajo cron está activo o en cola. Define `heartbeat.skipWhenBusy: true` para aplazar también en carriles con carga adicional (trabajo de subagente o comando anidado); esto es útil para Ollama local y otros hosts de runtime único con recursos limitados.

## Para qué sirve el prompt de Heartbeat

El prompt predeterminado es intencionalmente amplio:

- **Tareas en segundo plano**: "Consider outstanding tasks" anima al agente a revisar seguimientos (bandeja de entrada, calendario, recordatorios, trabajo en cola) y mostrar cualquier cosa urgente.
- **Contacto con la persona**: "Checkup sometimes on your human during day time" sugiere un mensaje ligero ocasional de "¿necesitas algo?", pero evita el spam nocturno usando tu zona horaria local configurada (consulta [Zona horaria](/es/concepts/timezone)).

Heartbeat puede reaccionar a [tareas en segundo plano](/es/automation/tasks) completadas, pero una ejecución de Heartbeat en sí no crea un registro de tarea.

Si quieres que Heartbeat haga algo muy específico (por ejemplo, "check Gmail PubSub stats" o "verify gateway health"), define `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) con un cuerpo personalizado (enviado verbatim).

## Contrato de respuesta

- Si nada requiere atención, responde con **`HEARTBEAT_OK`**.
- Las ejecuciones de Heartbeat con capacidad de herramientas pueden llamar en su lugar a `heartbeat_respond` con `notify: false` para no mostrar ninguna actualización visible, o `notify: true` más `notificationText` para una alerta. Cuando está presente, la respuesta estructurada de la herramienta tiene precedencia sobre el respaldo de texto.
- Durante las ejecuciones de Heartbeat, OpenClaw trata `HEARTBEAT_OK` como una confirmación cuando aparece al **inicio o al final** de la respuesta. El token se elimina y la respuesta se descarta si el contenido restante es **≤ `ackMaxChars`** (valor predeterminado: 300).
- Si `HEARTBEAT_OK` aparece en el **medio** de una respuesta, no recibe tratamiento especial.
- Para alertas, **no** incluyas `HEARTBEAT_OK`; devuelve solo el texto de la alerta.

Fuera de Heartbeat, un `HEARTBEAT_OK` suelto al inicio/final de un mensaje se elimina y se registra; un mensaje que solo contiene `HEARTBEAT_OK` se descarta.

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
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
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

- `agents.defaults.heartbeat` define el comportamiento global de Heartbeat.
- `agents.list[].heartbeat` se fusiona encima; si algún agente tiene un bloque `heartbeat`, **solo esos agentes** ejecutan Heartbeat.
- `channels.defaults.heartbeat` define valores predeterminados de visibilidad para todos los canales.
- `channels.<channel>.heartbeat` sobrescribe los valores predeterminados del canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canales multicuenta) sobrescribe la configuración por canal.

### Heartbeat por agente

Si alguna entrada de `agents.list[]` incluye un bloque `heartbeat`, **solo esos agentes** ejecutan Heartbeat. El bloque por agente se fusiona encima de `agents.defaults.heartbeat` (para que puedas definir valores predeterminados compartidos una vez y sobrescribir por agente).

Ejemplo: dos agentes, solo el segundo agente ejecuta Heartbeat.

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

Restringe Heartbeat al horario laboral en una zona horaria específica:

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

Fuera de esta ventana (antes de las 9 a. m. o después de las 10 p. m. hora del Este), Heartbeat se omite. El siguiente tick programado dentro de la ventana se ejecutará normalmente.

### Configuración 24/7

Si quieres que Heartbeat se ejecute todo el día, usa uno de estos patrones:

- Omite `activeHours` por completo (sin restricción de ventana horaria; este es el comportamiento predeterminado).
- Define una ventana de día completo: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
No definas la misma hora de `start` y `end` (por ejemplo, de `08:00` a `08:00`). Eso se trata como una ventana de ancho cero, por lo que Heartbeat siempre se omite.
</Warning>

### Ejemplo multicuenta

Usa `accountId` para dirigir a una cuenta específica en canales multicuenta como Telegram:

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
  Intervalo de Heartbeat (cadena de duración; unidad predeterminada = minutos).
</ParamField>
<ParamField path="model" type="string">
  Sobrescritura opcional del modelo para ejecuciones de Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Cuando está habilitado, también entrega el mensaje separado `Reasoning:` cuando está disponible (la misma forma que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Cuando es true, las ejecuciones de Heartbeat usan contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Usa el mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce drásticamente el costo de tokens por Heartbeat. Combínalo con `lightContext: true` para ahorrar al máximo. El enrutamiento de entrega sigue usando el contexto de la sesión principal.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Cuando es true, las ejecuciones de Heartbeat se aplazan en carriles con carga adicional: trabajo de subagente o comando anidado. Los carriles cron siempre aplazan Heartbeat, incluso sin esta bandera, para que los hosts con modelos locales no ejecuten prompts de cron y Heartbeat al mismo tiempo.
</ParamField>
<ParamField path="session" type="string">
  Clave de sesión opcional para ejecuciones de Heartbeat.

- `main` (predeterminado): sesión principal del agente.
- Clave de sesión explícita (copia desde `openclaw sessions --json` o la [CLI de sesiones](/es/cli/sessions)).
- Formatos de clave de sesión: consulta [Sesiones](/es/concepts/session) y [Grupos](/es/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: entregar al último canal externo usado.
- canal explícito: cualquier canal configurado o id de Plugin, por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (predeterminado): ejecutar Heartbeat pero **no entregar** externamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla el comportamiento de entrega directa/DM. `allow`: permite la entrega directa/DM de Heartbeat. `block`: suprime la entrega directa/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Sobrescritura opcional de destinatario (id específico del canal, por ejemplo E.164 para WhatsApp o un id de chat de Telegram). Para temas/hilos de Telegram, usa `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id de cuenta opcional para canales multicuenta. Cuando `target: "last"`, el id de cuenta se aplica al último canal resuelto si admite cuentas; de lo contrario, se ignora. Si el id de cuenta no coincide con una cuenta configurada para el canal resuelto, la entrega se omite.

</ParamField>
<ParamField path="prompt" type="string">
  Sobrescribe el cuerpo del prompt predeterminado (no se fusiona).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Caracteres máximos permitidos después de `HEARTBEAT_OK` antes de la entrega.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Cuando es true, suprime las cargas útiles de advertencia de errores de herramientas durante las ejecuciones de heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Restringe las ejecuciones de heartbeat a una ventana de tiempo. Objeto con `start` (HH:MM, inclusivo; usa `00:00` para el inicio del día), `end` (HH:MM exclusivo; se permite `24:00` para el final del día) y `timezone` opcional.

- Omitido o `"user"`: usa tu `agents.defaults.userTimezone` si está configurado; de lo contrario, recurre a la zona horaria del sistema anfitrión.
- `"local"`: siempre usa la zona horaria del sistema anfitrión.
- Cualquier identificador IANA (por ejemplo, `America/New_York`): se usa directamente; si no es válido, recurre al comportamiento de `"user"` anterior.
- `start` y `end` no deben ser iguales para una ventana activa; los valores iguales se tratan como ancho cero (siempre fuera de la ventana).
- Fuera de la ventana activa, los heartbeats se omiten hasta el siguiente tick dentro de la ventana.

</ParamField>

## Comportamiento de entrega

<AccordionGroup>
  <Accordion title="Enrutamiento de sesión y destino">
    - Los heartbeats se ejecutan en la sesión principal del agente de forma predeterminada (`agent:<id>:<mainKey>`), o en `global` cuando `session.scope = "global"`. Configura `session` para sobrescribirlo con una sesión de canal específica (Discord/WhatsApp/etc.).
    - `session` solo afecta al contexto de ejecución; la entrega la controlan `target` y `to`.
    - Para entregar a un canal/destinatario específico, configura `target` + `to`. Con `target: "last"`, la entrega usa el último canal externo de esa sesión.
    - Las entregas de heartbeat permiten destinos directos/DM de forma predeterminada. Configura `directPolicy: "block"` para suprimir los envíos a destinos directos sin dejar de ejecutar el turno de heartbeat.
    - Si la cola principal, la vía de la sesión de destino, la vía de cron o un trabajo de cron activo está ocupado, el heartbeat se omite y se reintenta más tarde.
    - Si `skipWhenBusy: true`, las vías de subagentes y anidadas también aplazan las ejecuciones de heartbeat.
    - Si `target` no se resuelve en ningún destino externo, la ejecución se sigue realizando, pero no se envía ningún mensaje saliente.

  </Accordion>
  <Accordion title="Visibilidad y comportamiento de omisión">
    - Si `showOk`, `showAlerts` y `useIndicator` están todos desactivados, la ejecución se omite de entrada como `reason=alerts-disabled`.
    - Si solo está desactivada la entrega de alertas, OpenClaw todavía puede ejecutar el heartbeat, actualizar las marcas de tiempo de tareas vencidas, restaurar la marca de tiempo de inactividad de la sesión y suprimir la carga útil de alerta saliente.
    - Si el destino de heartbeat resuelto admite escritura, OpenClaw muestra escritura mientras la ejecución de heartbeat está activa. Esto usa el mismo destino al que el heartbeat enviaría la salida de chat, y se desactiva con `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo de vida de la sesión y auditoría">
    - Las respuestas solo de heartbeat **no** mantienen viva la sesión. Los metadatos de heartbeat pueden actualizar la fila de sesión, pero la expiración por inactividad usa `lastInteractionAt` del último mensaje real de usuario/canal, y la expiración diaria usa `sessionStartedAt`.
    - La interfaz de control y el historial de WebChat ocultan los prompts de heartbeat y los acuses solo OK. La transcripción de sesión subyacente todavía puede contener esos turnos para auditoría/reproducción.
    - Las [tareas en segundo plano](/es/automation/tasks) desacopladas pueden poner en cola un evento del sistema y despertar heartbeat cuando la sesión principal debe notar algo rápidamente. Ese despertar no hace que el heartbeat ejecute una tarea en segundo plano.

  </Accordion>
</AccordionGroup>

## Controles de visibilidad

De forma predeterminada, los acuses `HEARTBEAT_OK` se suprimen mientras se entrega el contenido de alerta. Puedes ajustar esto por canal o por cuenta:

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

Prioridad: por cuenta → por canal → valores predeterminados del canal → valores predeterminados integrados.

### Qué hace cada indicador

- `showOk`: envía un acuse `HEARTBEAT_OK` cuando el modelo devuelve una respuesta solo OK.
- `showAlerts`: envía el contenido de alerta cuando el modelo devuelve una respuesta que no es OK.
- `useIndicator`: emite eventos de indicador para superficies de estado de la interfaz.

Si **los tres** son false, OpenClaw omite por completo la ejecución de heartbeat (sin llamada al modelo).

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

| Objetivo                                     | Configuración                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamiento predeterminado (OK silenciosos, alertas activadas) | _(no se necesita configuración)_                                                         |
| Completamente silencioso (sin mensajes, sin indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicador (sin mensajes)                | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK solo en un canal                          | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Si existe un archivo `HEARTBEAT.md` en el espacio de trabajo, el prompt predeterminado le indica al agente que lo lea. Piensa en él como tu "lista de verificación de heartbeat": pequeña, estable y segura para incluir cada 30 minutos.

En ejecuciones normales, `HEARTBEAT.md` solo se inyecta cuando la guía de heartbeat está habilitada para el agente predeterminado. Deshabilitar la cadencia de heartbeat con `0m` o configurar `includeSystemPromptSection: false` lo omite del contexto de arranque normal.

Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco y encabezados markdown como `# Heading`), OpenClaw omite la ejecución de heartbeat para ahorrar llamadas a la API. Esa omisión se informa como `reason=empty-heartbeat-file`. Si falta el archivo, el heartbeat todavía se ejecuta y el modelo decide qué hacer.

Mantenlo pequeño (lista de verificación breve o recordatorios) para evitar inflar el prompt.

Ejemplo de `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Bloques `tasks:`

`HEARTBEAT.md` también admite un pequeño bloque estructurado `tasks:` para comprobaciones basadas en intervalos dentro del propio heartbeat.

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
  <Accordion title="Comportamiento">
    - OpenClaw analiza el bloque `tasks:` y comprueba cada tarea con respecto a su propio `interval`.
    - Solo se incluyen en el prompt de heartbeat de ese tick las tareas **vencidas**.
    - Si no hay tareas vencidas, el heartbeat se omite por completo (`reason=no-tasks-due`) para evitar una llamada desperdiciada al modelo.
    - El contenido que no es de tareas en `HEARTBEAT.md` se conserva y se agrega como contexto adicional después de la lista de tareas vencidas.
    - Las marcas de tiempo de la última ejecución de tareas se almacenan en el estado de sesión (`heartbeatTaskState`), por lo que los intervalos sobreviven a reinicios normales.
    - Las marcas de tiempo de tareas solo se avanzan después de que una ejecución de heartbeat completa su ruta de respuesta normal. Las ejecuciones omitidas por `empty-heartbeat-file` / `no-tasks-due` no marcan las tareas como completadas.

  </Accordion>
</AccordionGroup>

El modo de tareas es útil cuando quieres que un archivo de heartbeat contenga varias comprobaciones periódicas sin pagar por todas en cada tick.

### ¿Puede el agente actualizar HEARTBEAT.md?

Sí, si se lo pides.

`HEARTBEAT.md` es solo un archivo normal en el espacio de trabajo del agente, así que puedes decirle al agente (en un chat normal) algo como:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

Si quieres que esto ocurra de forma proactiva, también puedes incluir una línea explícita en tu prompt de heartbeat como: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
No pongas secretos (claves de API, números de teléfono, tokens privados) en `HEARTBEAT.md`: pasa a formar parte del contexto del prompt.
</Warning>

## Despertar manual (a demanda)

Puedes poner en cola un evento del sistema y activar un heartbeat inmediato con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si varios agentes tienen `heartbeat` configurado, un despertar manual ejecuta inmediatamente cada uno de esos heartbeats de agente.

Usa `--mode next-heartbeat` para esperar al siguiente tick programado.

## Entrega de razonamiento (opcional)

De forma predeterminada, los heartbeats solo entregan la carga útil final de "respuesta".

Si quieres transparencia, habilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Cuando está habilitado, los heartbeats también entregarán un mensaje separado con el prefijo `Reasoning:` (misma forma que `/reasoning on`). Esto puede ser útil cuando el agente gestiona varias sesiones/codexes y quieres ver por qué decidió hacerte ping, pero también puede filtrar más detalles internos de los que quieres. Es preferible mantenerlo desactivado en chats grupales.

## Conciencia de costos

Los heartbeats ejecutan turnos completos de agente. Los intervalos más cortos consumen más tokens. Para reducir costos:

- Usa `isolatedSession: true` para evitar enviar el historial de conversación completo (de ~100K tokens a ~2-5K por ejecución).
- Usa `lightContext: true` para limitar los archivos de arranque solo a `HEARTBEAT.md`.
- Configura un `model` más barato (por ejemplo, `ollama/llama3.2:1b`).
- Mantén `HEARTBEAT.md` pequeño.
- Usa `target: "none"` si solo quieres actualizaciones de estado internas.

## Desbordamiento de contexto después de heartbeat

Si un heartbeat dejó previamente una sesión existente en un modelo local más pequeño, por ejemplo un modelo de Ollama con una ventana de 32k, y el siguiente turno de sesión principal informa desbordamiento de contexto, restablece el modelo de runtime de la sesión al modelo principal configurado. El mensaje de restablecimiento de OpenClaw lo señala cuando el último modelo de runtime coincide con `heartbeat.model` configurado.

Los heartbeats actuales conservan el modelo de runtime existente de la sesión compartida después de que termina la ejecución. Todavía puedes usar `isolatedSession: true` para ejecutar heartbeats en una sesión nueva, combinarlo con `lightContext: true` para el prompt más pequeño, o elegir un modelo de heartbeat con una ventana de contexto lo bastante grande para la sesión compartida.

## Relacionado

- [Automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — cómo se rastrea el trabajo desacoplado
- [Zona horaria](/es/concepts/timezone) — cómo la zona horaria afecta la programación de heartbeat
- [Solución de problemas](/es/automation/cron-jobs#troubleshooting) — depuración de problemas de automatización
