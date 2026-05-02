---
read_when:
    - Ajustar la cadencia o la mensajería de Heartbeat
    - Elegir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Heartbeat
summary: Mensajes de sondeo de Heartbeat y reglas de notificación
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**¿Heartbeat o cron?** Consulta [Automatización y tareas](/es/automation) para obtener orientación sobre cuándo usar cada uno.
</Note>

Heartbeat ejecuta **turnos periódicos del agente** en la sesión principal para que el modelo pueda señalar cualquier cosa que necesite atención sin saturarte con mensajes.

Heartbeat es un turno programado de la sesión principal; **no** crea registros de [tareas en segundo plano](/es/automation/tasks). Los registros de tareas son para trabajo desacoplado (ejecuciones de ACP, subagentes, trabajos de Cron aislados).

Solución de problemas: [Tareas programadas](/es/automation/cron-jobs#troubleshooting)

## Inicio rápido (principiante)

<Steps>
  <Step title="Elige una cadencia">
    Deja los heartbeats habilitados (el valor predeterminado es `30m`, o `1h` para autenticación OAuth/token de Anthropic, incluida la reutilización de Claude CLI) o define tu propia cadencia.
  </Step>
  <Step title="Agrega HEARTBEAT.md (opcional)">
    Crea una pequeña lista de comprobación `HEARTBEAT.md` o un bloque `tasks:` en el espacio de trabajo del agente.
  </Step>
  <Step title="Decide adónde deben ir los mensajes de heartbeat">
    `target: "none"` es el valor predeterminado; define `target: "last"` para dirigirlos al último contacto.
  </Step>
  <Step title="Ajuste opcional">
    - Habilita la entrega de razonamiento de heartbeat para mayor transparencia.
    - Usa contexto de arranque ligero si las ejecuciones de heartbeat solo necesitan `HEARTBEAT.md`.
    - Habilita sesiones aisladas para evitar enviar todo el historial de conversación en cada heartbeat.
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

- Intervalo: `30m` (o `1h` cuando se detecta autenticación OAuth/token de Anthropic como modo de autenticación, incluida la reutilización de Claude CLI). Define `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` por agente; usa `0m` para deshabilitar.
- Cuerpo del prompt (configurable mediante `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- El prompt de heartbeat se envía **literalmente** como mensaje de usuario. El prompt del sistema incluye una sección "Heartbeat" solo cuando los heartbeats están habilitados para el agente predeterminado, y la ejecución se marca internamente.
- Cuando los heartbeats se deshabilitan con `0m`, las ejecuciones normales también omiten `HEARTBEAT.md` del contexto de arranque para que el modelo no vea instrucciones exclusivas de heartbeat.
- Las horas activas (`heartbeat.activeHours`) se comprueban en la zona horaria configurada. Fuera de la ventana, los heartbeats se omiten hasta el siguiente tick dentro de la ventana.
- Los heartbeats se aplazan automáticamente mientras hay trabajo de Cron activo o en cola. Define `heartbeat.skipWhenBusy: true` para aplazarlos también en carriles con carga adicional (subagente o trabajo de comandos anidados); esto es útil para Ollama local y otros hosts restringidos de un solo runtime.

## Para qué sirve el prompt de heartbeat

El prompt predeterminado es intencionalmente amplio:

- **Tareas en segundo plano**: "Consider outstanding tasks" incita al agente a revisar seguimientos (bandeja de entrada, calendario, recordatorios, trabajo en cola) y señalar cualquier cosa urgente.
- **Contacto con la persona**: "Checkup sometimes on your human during day time" incita a enviar ocasionalmente un mensaje ligero del tipo "¿necesitas algo?", pero evita el spam nocturno usando tu zona horaria local configurada (consulta [Zona horaria](/es/concepts/timezone)).

Heartbeat puede reaccionar a [tareas en segundo plano](/es/automation/tasks) completadas, pero una ejecución de heartbeat en sí no crea un registro de tarea.

Si quieres que un heartbeat haga algo muy específico (por ejemplo, "check Gmail PubSub stats" o "verify gateway health"), define `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) con un cuerpo personalizado (enviado literalmente).

## Contrato de respuesta

- Si nada necesita atención, responde con **`HEARTBEAT_OK`**.
- Las ejecuciones de heartbeat con capacidad de herramientas pueden llamar en su lugar a `heartbeat_respond` con `notify: false` para no mostrar ninguna actualización visible, o `notify: true` más `notificationText` para una alerta. Cuando está presente, la respuesta estructurada de la herramienta tiene prioridad sobre el respaldo de texto.
- Durante las ejecuciones de heartbeat, OpenClaw trata `HEARTBEAT_OK` como un acuse cuando aparece al **inicio o final** de la respuesta. El token se elimina y la respuesta se descarta si el contenido restante es **≤ `ackMaxChars`** (valor predeterminado: 300).
- Si `HEARTBEAT_OK` aparece en el **medio** de una respuesta, no se trata de forma especial.
- Para alertas, **no** incluyas `HEARTBEAT_OK`; devuelve solo el texto de la alerta.

Fuera de los heartbeats, cualquier `HEARTBEAT_OK` accidental al inicio/final de un mensaje se elimina y se registra; un mensaje que solo contiene `HEARTBEAT_OK` se descarta.

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

- `agents.defaults.heartbeat` define el comportamiento global de heartbeat.
- `agents.list[].heartbeat` se combina encima; si algún agente tiene un bloque `heartbeat`, **solo esos agentes** ejecutan heartbeats.
- `channels.defaults.heartbeat` define los valores predeterminados de visibilidad para todos los canales.
- `channels.<channel>.heartbeat` sobrescribe los valores predeterminados del canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canales multicuenta) sobrescribe la configuración por canal.

### Heartbeats por agente

Si cualquier entrada de `agents.list[]` incluye un bloque `heartbeat`, **solo esos agentes** ejecutan heartbeats. El bloque por agente se combina encima de `agents.defaults.heartbeat` (así puedes definir valores predeterminados compartidos una vez y sobrescribirlos por agente).

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

Fuera de esta ventana (antes de las 9 a. m. o después de las 10 p. m. hora del Este), los heartbeats se omiten. El siguiente tick programado dentro de la ventana se ejecutará normalmente.

### Configuración 24/7

Si quieres que los heartbeats se ejecuten todo el día, usa uno de estos patrones:

- Omite `activeHours` por completo (sin restricción de ventana horaria; este es el comportamiento predeterminado).
- Define una ventana de día completo: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
No definas la misma hora de `start` y `end` (por ejemplo, de `08:00` a `08:00`). Eso se trata como una ventana de ancho cero, por lo que los heartbeats siempre se omiten.
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

### Notas de campo

<ParamField path="every" type="string">
  Intervalo de Heartbeat (cadena de duración; unidad predeterminada = minutos).
</ParamField>
<ParamField path="model" type="string">
  Sobrescritura opcional del modelo para ejecuciones de heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Cuando está habilitado, también entrega el mensaje separado `Reasoning:` cuando está disponible (misma forma que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Cuando es true, las ejecuciones de heartbeat usan contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Cuando es true, cada heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Usa el mismo patrón de aislamiento que Cron `sessionTarget: "isolated"`. Reduce drásticamente el costo de tokens por heartbeat. Combínalo con `lightContext: true` para obtener el máximo ahorro. El enrutamiento de entrega sigue usando el contexto de la sesión principal.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Cuando es true, las ejecuciones de heartbeat se aplazan en carriles con carga adicional: subagente o trabajo de comandos anidados. Los carriles de Cron siempre aplazan los heartbeats, incluso sin esta opción, de modo que los hosts de modelos locales no ejecuten prompts de Cron y heartbeat al mismo tiempo.
</ParamField>
<ParamField path="session" type="string">
  Clave de sesión opcional para ejecuciones de heartbeat.

- `main` (predeterminado): sesión principal del agente.
- Clave de sesión explícita (cópiala de `openclaw sessions --json` o de la [CLI de sesiones](/es/cli/sessions)).
- Formatos de clave de sesión: consulta [Sesiones](/es/concepts/session) y [Grupos](/es/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: entregar al último canal externo usado.
- canal explícito: cualquier canal configurado o id de Plugin, por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (predeterminado): ejecutar el heartbeat pero **no entregarlo** externamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla el comportamiento de entrega directa/DM. `allow`: permite la entrega directa/DM de heartbeat. `block`: suprime la entrega directa/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Sobrescritura opcional del destinatario (id específico del canal, por ejemplo E.164 para WhatsApp o un id de chat de Telegram). Para temas/hilos de Telegram, usa `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id de cuenta opcional para canales multicuenta. Cuando `target: "last"`, el id de cuenta se aplica al último canal resuelto si admite cuentas; de lo contrario, se ignora. Si el id de cuenta no coincide con una cuenta configurada para el canal resuelto, se omite la entrega.

</ParamField>
<ParamField path="prompt" type="string">
  Sobrescribe el cuerpo del prompt predeterminado (no se combina).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Máximo de caracteres permitidos después de `HEARTBEAT_OK` antes de la entrega.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Cuando es true, suprime las cargas útiles de advertencia de error de herramientas durante las ejecuciones de Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Restringe las ejecuciones de Heartbeat a una ventana horaria. Objeto con `start` (HH:MM, inclusivo; usa `00:00` para el inicio del día), `end` (HH:MM exclusivo; se permite `24:00` para el final del día) y `timezone` opcional.

- Omitido o `"user"`: usa tu `agents.defaults.userTimezone` si está configurado; de lo contrario, recurre a la zona horaria del sistema anfitrión.
- `"local"`: siempre usa la zona horaria del sistema anfitrión.
- Cualquier identificador IANA (por ejemplo, `America/New_York`): se usa directamente; si no es válido, recurre al comportamiento de `"user"` anterior.
- `start` y `end` no deben ser iguales para una ventana activa; los valores iguales se tratan como de ancho cero (siempre fuera de la ventana).
- Fuera de la ventana activa, los Heartbeats se omiten hasta el siguiente tick dentro de la ventana.

</ParamField>

## Comportamiento de entrega

<AccordionGroup>
  <Accordion title="Sesión y enrutamiento de destino">
    - Los Heartbeats se ejecutan en la sesión principal del agente de forma predeterminada (`agent:<id>:<mainKey>`), o en `global` cuando `session.scope = "global"`. Configura `session` para sobrescribirlo con una sesión de canal específica (Discord/WhatsApp/etc.).
    - `session` solo afecta al contexto de ejecución; la entrega la controlan `target` y `to`.
    - Para entregar a un canal/destinatario específico, configura `target` + `to`. Con `target: "last"`, la entrega usa el último canal externo de esa sesión.
    - Las entregas de Heartbeat permiten destinos directos/DM de forma predeterminada. Configura `directPolicy: "block"` para suprimir los envíos a destinos directos mientras se sigue ejecutando el turno de Heartbeat.
    - Si la cola principal, el carril de sesión de destino, el carril de Cron o un trabajo de Cron activo está ocupado, el Heartbeat se omite y se reintenta más tarde.
    - Si `skipWhenBusy: true`, los carriles de subagente y anidados también aplazan las ejecuciones de Heartbeat.
    - Si `target` no se resuelve a ningún destino externo, la ejecución igualmente ocurre, pero no se envía ningún mensaje saliente.

  </Accordion>
  <Accordion title="Visibilidad y comportamiento de omisión">
    - Si `showOk`, `showAlerts` y `useIndicator` están todos deshabilitados, la ejecución se omite de entrada como `reason=alerts-disabled`.
    - Si solo se deshabilita la entrega de alertas, OpenClaw aún puede ejecutar el Heartbeat, actualizar las marcas de tiempo de tareas vencidas, restaurar la marca de tiempo de inactividad de la sesión y suprimir la carga útil de alerta externa.
    - Si el destino de Heartbeat resuelto admite indicación de escritura, OpenClaw muestra que está escribiendo mientras la ejecución de Heartbeat está activa. Esto usa el mismo destino al que el Heartbeat enviaría la salida de chat, y se deshabilita con `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo de vida de sesión y auditoría">
    - Las respuestas solo de Heartbeat **no** mantienen viva la sesión. Los metadatos de Heartbeat pueden actualizar la fila de sesión, pero la expiración por inactividad usa `lastInteractionAt` del último mensaje real de usuario/canal, y la expiración diaria usa `sessionStartedAt`.
    - El historial de Control UI y WebChat oculta los prompts de Heartbeat y los acuses solo de OK. La transcripción de sesión subyacente aún puede contener esos turnos para auditoría/reproducción.
    - Las [tareas en segundo plano](/es/automation/tasks) desacopladas pueden encolar un evento del sistema y despertar Heartbeat cuando la sesión principal deba notar algo rápidamente. Ese despertar no convierte la ejecución de Heartbeat en una tarea en segundo plano.

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

Precedencia: por cuenta → por canal → valores predeterminados de canal → valores predeterminados integrados.

### Qué hace cada opción

- `showOk`: envía un acuse `HEARTBEAT_OK` cuando el modelo devuelve una respuesta solo de OK.
- `showAlerts`: envía el contenido de alerta cuando el modelo devuelve una respuesta no OK.
- `useIndicator`: emite eventos indicadores para superficies de estado de UI.

Si **las tres** son false, OpenClaw omite la ejecución de Heartbeat por completo (sin llamada al modelo).

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
| Comportamiento predeterminado (OK silenciosos, alertas activas) | _(no se necesita configuración)_                                                         |
| Totalmente silencioso (sin mensajes, sin indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicador (sin mensajes)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK solo en un canal                      | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Si existe un archivo `HEARTBEAT.md` en el espacio de trabajo, el prompt predeterminado le indica al agente que lo lea. Piensa en él como tu "lista de comprobación de Heartbeat": pequeña, estable y segura para incluir cada 30 minutos.

En ejecuciones normales, `HEARTBEAT.md` solo se inyecta cuando la guía de Heartbeat está habilitada para el agente predeterminado. Deshabilitar la cadencia de Heartbeat con `0m` o configurar `includeSystemPromptSection: false` lo omite del contexto de arranque normal.

Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco y encabezados de Markdown como `# Heading`), OpenClaw omite la ejecución de Heartbeat para ahorrar llamadas a la API. Esa omisión se informa como `reason=empty-heartbeat-file`. Si falta el archivo, el Heartbeat igualmente se ejecuta y el modelo decide qué hacer.

Mantenlo diminuto (lista breve de comprobación o recordatorios) para evitar inflar el prompt.

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
  <Accordion title="Comportamiento">
    - OpenClaw analiza el bloque `tasks:` y comprueba cada tarea según su propio `interval`.
    - Solo las tareas **vencidas** se incluyen en el prompt de Heartbeat para ese tick.
    - Si no hay tareas vencidas, el Heartbeat se omite por completo (`reason=no-tasks-due`) para evitar una llamada al modelo desperdiciada.
    - El contenido no relacionado con tareas en `HEARTBEAT.md` se conserva y se agrega como contexto adicional después de la lista de tareas vencidas.
    - Las marcas de tiempo de última ejecución de tareas se almacenan en el estado de sesión (`heartbeatTaskState`), por lo que los intervalos sobreviven a reinicios normales.
    - Las marcas de tiempo de tareas solo avanzan después de que una ejecución de Heartbeat completa su ruta de respuesta normal. Las ejecuciones omitidas `empty-heartbeat-file` / `no-tasks-due` no marcan tareas como completadas.

  </Accordion>
</AccordionGroup>

El modo de tareas es útil cuando quieres que un archivo de Heartbeat contenga varias comprobaciones periódicas sin pagar por todas ellas en cada tick.

### ¿Puede el agente actualizar HEARTBEAT.md?

Sí — si se lo pides.

`HEARTBEAT.md` es simplemente un archivo normal en el espacio de trabajo del agente, así que puedes decirle al agente (en un chat normal) algo como:

- "Actualiza `HEARTBEAT.md` para agregar una comprobación diaria de calendario."
- "Reescribe `HEARTBEAT.md` para que sea más corto y esté centrado en seguimientos de la bandeja de entrada."

Si quieres que esto ocurra de forma proactiva, también puedes incluir una línea explícita en tu prompt de Heartbeat como: "Si la lista de comprobación queda obsoleta, actualiza HEARTBEAT.md con una mejor."

<Warning>
No pongas secretos (claves de API, números de teléfono, tokens privados) en `HEARTBEAT.md` — pasa a formar parte del contexto del prompt.
</Warning>

## Despertar manual (bajo demanda)

Puedes encolar un evento del sistema y activar un Heartbeat inmediato con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si varios agentes tienen `heartbeat` configurado, un despertar manual ejecuta de inmediato cada uno de esos Heartbeats de agente.

Usa `--mode next-heartbeat` para esperar al siguiente tick programado.

## Entrega de razonamiento (opcional)

De forma predeterminada, los Heartbeats entregan solo la carga útil final de "respuesta".

Si quieres transparencia, habilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Cuando está habilitado, los Heartbeats también entregarán un mensaje separado con el prefijo `Reasoning:` (la misma forma que `/reasoning on`). Esto puede ser útil cuando el agente gestiona varias sesiones/codexes y quieres ver por qué decidió avisarte, pero también puede filtrar más detalles internos de los que quieres. Prefiere mantenerlo desactivado en chats grupales.

## Conciencia de costos

Los Heartbeats ejecutan turnos completos de agente. Los intervalos más cortos consumen más tokens. Para reducir costos:

- Usa `isolatedSession: true` para evitar enviar el historial completo de conversación (~100K tokens a ~2-5K por ejecución).
- Usa `lightContext: true` para limitar los archivos de arranque solo a `HEARTBEAT.md`.
- Configura un `model` más barato (por ejemplo, `ollama/llama3.2:1b`).
- Mantén `HEARTBEAT.md` pequeño.
- Usa `target: "none"` si solo quieres actualizaciones de estado internas.

## Desbordamiento de contexto después de Heartbeat

Si un Heartbeat dejó anteriormente una sesión existente en un modelo local más pequeño, por ejemplo un modelo de Ollama con una ventana de 32k, y el siguiente turno de la sesión principal informa desbordamiento de contexto, restablece el modelo de ejecución de sesión al modelo primario configurado. El mensaje de restablecimiento de OpenClaw lo señala cuando el último modelo de ejecución coincide con `heartbeat.model` configurado.

Los Heartbeats actuales conservan el modelo de ejecución existente de la sesión compartida después de que la ejecución se completa. Aún puedes usar `isolatedSession: true` para ejecutar Heartbeats en una sesión nueva, combinarlo con `lightContext: true` para el prompt más pequeño, o elegir un modelo de Heartbeat con una ventana de contexto lo suficientemente grande para la sesión compartida.

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — cómo se rastrea el trabajo desacoplado
- [Zona horaria](/es/concepts/timezone) — cómo la zona horaria afecta la programación de Heartbeat
- [Solución de problemas](/es/automation/cron-jobs#troubleshooting) — depuración de problemas de automatización
