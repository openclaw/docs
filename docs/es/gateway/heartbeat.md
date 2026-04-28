---
read_when:
    - Ajustar la cadencia o los mensajes de Heartbeat
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Heartbeat
summary: Mensajes de sondeo de Heartbeat y reglas de notificación
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:28:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**¿Heartbeat o Cron?** Consulta [Automatización y tareas](/es/automation) para obtener orientación sobre cuándo usar cada uno.
</Note>

Heartbeat ejecuta **turnos periódicos del agente** en la sesión principal para que el modelo pueda mostrar cualquier cosa que necesite atención sin llenarte de mensajes.

Heartbeat es un turno programado de la sesión principal: **no** crea registros de [tareas en segundo plano](/es/automation/tasks). Los registros de tareas son para trabajo desacoplado (ejecuciones ACP, subagentes, trabajos Cron aislados).

Solución de problemas: [Tareas programadas](/es/automation/cron-jobs#troubleshooting)

## Inicio rápido (principiante)

<Steps>
  <Step title="Elige una cadencia">
    Deja Heartbeat habilitado (el valor predeterminado es `30m`, o `1h` para autenticación OAuth/token de Anthropic, incluida la reutilización de Claude CLI) o establece tu propia cadencia.
  </Step>
  <Step title="Agrega HEARTBEAT.md (opcional)">
    Crea una pequeña lista de verificación `HEARTBEAT.md` o un bloque `tasks:` en el espacio de trabajo del agente.
  </Step>
  <Step title="Decide dónde deben ir los mensajes de Heartbeat">
    `target: "none"` es el valor predeterminado; establece `target: "last"` para enrutar al último contacto.
  </Step>
  <Step title="Ajuste opcional">
    - Habilita la entrega del razonamiento de Heartbeat para mayor transparencia.
    - Usa contexto bootstrap ligero si las ejecuciones de Heartbeat solo necesitan `HEARTBEAT.md`.
    - Habilita sesiones aisladas para evitar enviar el historial completo de conversación en cada Heartbeat.
    - Restringe Heartbeat a horas activas (hora local).

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
        directPolicy: "allow", // predeterminado: permitir destinos directos/DM; establece "block" para suprimir
        lightContext: true, // opcional: solo inyecta HEARTBEAT.md de los archivos bootstrap
        isolatedSession: true, // opcional: sesión nueva en cada ejecución (sin historial de conversación)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: enviar también un mensaje separado `Reasoning:`
      },
    },
  },
}
```

## Valores predeterminados

- Intervalo: `30m` (o `1h` cuando el modo de autenticación detectado es OAuth/token de Anthropic, incluida la reutilización de Claude CLI). Establece `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every`; usa `0m` para deshabilitar.
- Cuerpo del prompt (configurable mediante `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- El prompt de Heartbeat se envía **literalmente** como mensaje del usuario. El prompt del sistema incluye una sección "Heartbeat" solo cuando Heartbeat está habilitado para el agente predeterminado y la ejecución está marcada internamente.
- Cuando Heartbeat se deshabilita con `0m`, las ejecuciones normales también omiten `HEARTBEAT.md` del contexto bootstrap para que el modelo no vea instrucciones solo de Heartbeat.
- Las horas activas (`heartbeat.activeHours`) se comprueban en la zona horaria configurada. Fuera de la ventana, Heartbeat se omite hasta el siguiente tick dentro de la ventana.

## Para qué sirve el prompt de Heartbeat

El prompt predeterminado es intencionalmente amplio:

- **Tareas en segundo plano**: “Consider outstanding tasks” anima al agente a revisar seguimientos (bandeja de entrada, calendario, recordatorios, trabajo en cola) y mostrar cualquier cosa urgente.
- **Comprobación humana**: “Checkup sometimes on your human during day time” impulsa un mensaje ocasional y ligero de “¿necesitas algo?”, pero evita spam nocturno usando tu zona horaria local configurada (consulta [Zona horaria](/es/concepts/timezone)).

Heartbeat puede reaccionar a [tareas en segundo plano](/es/automation/tasks) completadas, pero una ejecución de Heartbeat no crea por sí misma un registro de tarea.

Si quieres que un Heartbeat haga algo muy concreto (por ejemplo “comprobar estadísticas de Gmail PubSub” o “verificar la salud del Gateway”), establece `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) con un cuerpo personalizado (enviado literalmente).

## Contrato de respuesta

- Si nada necesita atención, responde con **`HEARTBEAT_OK`**.
- Durante las ejecuciones de Heartbeat, OpenClaw trata `HEARTBEAT_OK` como un acuse cuando aparece al **inicio o al final** de la respuesta. El token se elimina y la respuesta se descarta si el contenido restante es **≤ `ackMaxChars`** (predeterminado: 300).
- Si `HEARTBEAT_OK` aparece en la **mitad** de una respuesta, no se trata de forma especial.
- Para alertas, **no** incluyas `HEARTBEAT_OK`; devuelve solo el texto de la alerta.

Fuera de Heartbeat, un `HEARTBEAT_OK` suelto al inicio/final de un mensaje se elimina y se registra; un mensaje que sea solo `HEARTBEAT_OK` se descarta.

## Configuración

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // predeterminado: 30m (0m deshabilita)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // predeterminado: false (entrega un mensaje separado `Reasoning:` cuando está disponible)
        lightContext: false, // predeterminado: false; true conserva solo HEARTBEAT.md de los archivos bootstrap del espacio de trabajo
        isolatedSession: false, // predeterminado: false; true ejecuta cada Heartbeat en una sesión nueva (sin historial de conversación)
        target: "last", // predeterminado: none | opciones: last | none | <channel id> (núcleo o Plugin, por ejemplo "bluebubbles")
        to: "+15551234567", // sobrescritura opcional específica del canal
        accountId: "ops-bot", // id opcional de canal multicuenta
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // máximo de caracteres permitidos después de HEARTBEAT_OK
      },
    },
  },
}
```

### Alcance y precedencia

- `agents.defaults.heartbeat` establece el comportamiento global de Heartbeat.
- `agents.list[].heartbeat` se fusiona por encima; si algún agente tiene un bloque `heartbeat`, **solo esos agentes** ejecutan Heartbeat.
- `channels.defaults.heartbeat` establece valores predeterminados de visibilidad para todos los canales.
- `channels.<channel>.heartbeat` sobrescribe los valores predeterminados del canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canales multicuenta) sobrescribe la configuración por canal.

### Heartbeats por agente

Si alguna entrada `agents.list[]` incluye un bloque `heartbeat`, **solo esos agentes** ejecutan Heartbeat. El bloque por agente se fusiona por encima de `agents.defaults.heartbeat` (así puedes establecer valores compartidos una vez y sobrescribir por agente).

Ejemplo: dos agentes, solo el segundo agente ejecuta Heartbeat.

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
        target: "last", // entrega explícita al último contacto (el valor predeterminado es "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcional; usa tu userTimezone si está configurado; de lo contrario, la zona horaria del host
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
- Establece una ventana de día completo: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
No establezcas la misma hora para `start` y `end` (por ejemplo `08:00` a `08:00`). Eso se trata como una ventana de ancho cero, por lo que Heartbeat siempre se omite.
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
          to: "12345678:topic:42", // opcional: enrutar a un tema/hilo específico
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
  Cuando está habilitado, también entrega el mensaje separado `Reasoning:` cuando está disponible (misma forma que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Cuando es true, las ejecuciones de Heartbeat usan contexto bootstrap ligero y conservan solo `HEARTBEAT.md` de los archivos bootstrap del espacio de trabajo.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial previo de conversación. Usa el mismo patrón de aislamiento que Cron `sessionTarget: "isolated"`. Reduce drásticamente el costo de tokens por Heartbeat. Combínalo con `lightContext: true` para obtener el máximo ahorro. El enrutamiento de entrega sigue usando el contexto de la sesión principal.
</ParamField>
<ParamField path="session" type="string">
  Clave de sesión opcional para ejecuciones de Heartbeat.

  - `main` (predeterminado): sesión principal del agente.
  - Clave de sesión explícita (copia desde `openclaw sessions --json` o la [CLI de sesiones](/es/cli/sessions)).
  - Formatos de clave de sesión: consulta [Sesiones](/es/concepts/session) y [Grupos](/es/channels/groups).

</ParamField>
<ParamField path="target" type="string">
  - `last`: entrega al último canal externo usado.
  - canal explícito: cualquier canal configurado o id de Plugin, por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`.
  - `none` (predeterminado): ejecuta Heartbeat pero **no entrega** externamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla el comportamiento de entrega directa/DM. `allow`: permite entrega de Heartbeat en directo/DM. `block`: suprime la entrega directa/DM (`reason=dm-blocked`).
</ParamField>
<ParamField path="to" type="string">
  Sobrescritura opcional del destinatario (id específico del canal, por ejemplo E.164 para WhatsApp o un id de chat de Telegram). Para temas/hilos de Telegram, usa `<chatId>:topic:<messageThreadId>`.
</ParamField>
<ParamField path="accountId" type="string">
  Id de cuenta opcional para canales multicuenta. Cuando `target: "last"`, el id de cuenta se aplica al último canal resuelto si admite cuentas; de lo contrario, se ignora. Si el id de cuenta no coincide con una cuenta configurada para el canal resuelto, la entrega se omite.
</ParamField>
<ParamField path="prompt" type="string">
  Sobrescribe el cuerpo del prompt predeterminado (no se fusiona).
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Máximo de caracteres permitidos después de `HEARTBEAT_OK` antes de la entrega.
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Cuando es true, suprime las cargas útiles de advertencia de error de herramientas durante ejecuciones de Heartbeat.
</ParamField>
<ParamField path="activeHours" type="object">
  Restringe las ejecuciones de Heartbeat a una ventana horaria. Objeto con `start` (HH:MM, inclusivo; usa `00:00` para inicio del día), `end` (HH:MM exclusivo; se permite `24:00` para fin del día) y `timezone` opcional.

  - Omitido o `"user"`: usa tu `agents.defaults.userTimezone` si está configurado; de lo contrario, recurre a la zona horaria del sistema host.
  - `"local"`: siempre usa la zona horaria del sistema host.
  - Cualquier identificador IANA (por ejemplo `America/New_York`): se usa directamente; si no es válido, recurre al comportamiento `"user"` anterior.
  - `start` y `end` no deben ser iguales para una ventana activa; valores iguales se tratan como ancho cero (siempre fuera de la ventana).
  - Fuera de la ventana activa, Heartbeat se omite hasta el siguiente tick dentro de la ventana.

</ParamField>

## Comportamiento de entrega

<AccordionGroup>
  <Accordion title="Enrutamiento de sesión y destino">
    - Heartbeat se ejecuta en la sesión principal del agente por defecto (`agent:<id>:<mainKey>`), o `global` cuando `session.scope = "global"`. Establece `session` para sobrescribir a una sesión específica de canal (Discord/WhatsApp/etc.).
    - `session` solo afecta el contexto de ejecución; la entrega está controlada por `target` y `to`.
    - Para entregar a un canal/destinatario específico, establece `target` + `to`. Con `target: "last"`, la entrega usa el último canal externo de esa sesión.
    - Las entregas de Heartbeat permiten destinos directos/DM por defecto. Establece `directPolicy: "block"` para suprimir envíos a destinos directos mientras sigue ejecutándose el turno de Heartbeat.
    - Si la cola principal está ocupada, Heartbeat se omite y se reintenta más tarde.
    - Si `target` no se resuelve a ningún destino externo, la ejecución igualmente ocurre, pero no se envía ningún mensaje saliente.

  </Accordion>
  <Accordion title="Visibilidad y comportamiento de omisión">
    - Si `showOk`, `showAlerts` y `useIndicator` están todos deshabilitados, la ejecución se omite desde el principio como `reason=alerts-disabled`.
    - Si solo la entrega de alertas está deshabilitada, OpenClaw aún puede ejecutar Heartbeat, actualizar marcas de tiempo de tareas vencidas, restaurar la marca de tiempo de inactividad de la sesión y suprimir la carga útil de alerta saliente.
    - Si el destino resuelto de Heartbeat admite escritura, OpenClaw muestra escritura mientras la ejecución de Heartbeat está activa. Esto usa el mismo destino al que Heartbeat enviaría la salida de chat, y se deshabilita con `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo de vida de sesión y auditoría">
    - Las respuestas solo de Heartbeat **no** mantienen viva la sesión. Los metadatos de Heartbeat pueden actualizar la fila de la sesión, pero la expiración por inactividad usa `lastInteractionAt` del último mensaje real de usuario/canal, y la expiración diaria usa `sessionStartedAt`.
    - El historial de la UI de control y WebChat oculta los prompts de Heartbeat y los acuses solo-OK. La transcripción subyacente de la sesión puede seguir conteniendo esos turnos para auditoría/reproducción.
    - Las [tareas en segundo plano](/es/automation/tasks) desacopladas pueden poner en cola un evento del sistema y despertar a Heartbeat cuando la sesión principal deba notar algo rápidamente. Ese despertar no convierte la ejecución de Heartbeat en una tarea en segundo plano.

  </Accordion>
</AccordionGroup>

## Controles de visibilidad

Por defecto, los acuses `HEARTBEAT_OK` se suprimen mientras que el contenido de alerta sí se entrega. Puedes ajustarlo por canal o por cuenta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Oculta HEARTBEAT_OK (predeterminado)
      showAlerts: true # Muestra mensajes de alerta (predeterminado)
      useIndicator: true # Emite eventos de indicador (predeterminado)
  telegram:
    heartbeat:
      showOk: true # Muestra acuses OK en Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suprime entrega de alertas para esta cuenta
```

Precedencia: por cuenta → por canal → valores predeterminados del canal → valores predeterminados integrados.

### Qué hace cada bandera

- `showOk`: envía un acuse `HEARTBEAT_OK` cuando el modelo devuelve una respuesta solo-OK.
- `showAlerts`: envía el contenido de alerta cuando el modelo devuelve una respuesta no-OK.
- `useIndicator`: emite eventos de indicador para superficies de estado de UI.

Si **las tres** son false, OpenClaw omite completamente la ejecución de Heartbeat (sin llamada al modelo).

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
      showOk: true # todas las cuentas de Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suprime alertas solo para la cuenta ops
  telegram:
    heartbeat:
      showOk: true
```

### Patrones comunes

| Objetivo                                 | Configuración                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamiento predeterminado (OK silenciosos, alertas activas) | _(no se necesita configuración)_                                             |
| Totalmente silencioso (sin mensajes, sin indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicador (sin mensajes)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK solo en un canal                      | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Si existe un archivo `HEARTBEAT.md` en el espacio de trabajo, el prompt predeterminado le dice al agente que lo lea. Piénsalo como tu “lista de verificación de Heartbeat”: pequeña, estable y segura para incluir cada 30 minutos.

En ejecuciones normales, `HEARTBEAT.md` solo se inyecta cuando la guía de Heartbeat está habilitada para el agente predeterminado. Deshabilitar la cadencia de Heartbeat con `0m` o establecer `includeSystemPromptSection: false` lo omite del contexto bootstrap normal.

Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco y encabezados markdown como `# Heading`), OpenClaw omite la ejecución de Heartbeat para ahorrar llamadas API. Esa omisión se informa como `reason=empty-heartbeat-file`. Si el archivo no existe, Heartbeat igualmente se ejecuta y el modelo decide qué hacer.

Mantenlo pequeño (lista corta de verificación o recordatorios) para evitar inflar el prompt.

Ejemplo de `HEARTBEAT.md`:

```md
# Lista de verificación de Heartbeat

- Escaneo rápido: ¿hay algo urgente en las bandejas de entrada?
- Si es de día, haz una comprobación ligera si no hay nada más pendiente.
- Si una tarea está bloqueada, escribe _qué falta_ y pregúntale a Peter la próxima vez.
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

# Instrucciones adicionales

- Mantén cortas las alertas.
- Si nada necesita atención después de todas las tareas vencidas, responde HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportamiento">
    - OpenClaw analiza el bloque `tasks:` y comprueba cada tarea según su propio `interval`.
    - Solo las tareas **vencidas** se incluyen en el prompt de Heartbeat de ese tick.
    - Si no hay tareas vencidas, Heartbeat se omite por completo (`reason=no-tasks-due`) para evitar una llamada al modelo desperdiciada.
    - El contenido que no es tarea en `HEARTBEAT.md` se conserva y se anexa como contexto adicional después de la lista de tareas vencidas.
    - Las marcas de tiempo de última ejecución de tareas se almacenan en el estado de la sesión (`heartbeatTaskState`), por lo que los intervalos sobreviven a reinicios normales.
    - Las marcas de tiempo de tareas solo avanzan después de que una ejecución de Heartbeat completa su ruta normal de respuesta. Las ejecuciones omitidas `empty-heartbeat-file` / `no-tasks-due` no marcan tareas como completadas.

  </Accordion>
</AccordionGroup>

El modo de tareas es útil cuando quieres que un archivo de Heartbeat contenga varias comprobaciones periódicas sin pagar por todas ellas en cada tick.

### ¿Puede el agente actualizar HEARTBEAT.md?

Sí, si se lo pides.

`HEARTBEAT.md` es solo un archivo normal del espacio de trabajo del agente, así que puedes decirle al agente (en un chat normal) algo como:

- "Actualiza `HEARTBEAT.md` para agregar una comprobación diaria del calendario."
- "Reescribe `HEARTBEAT.md` para que sea más corto y se centre en seguimientos de bandeja de entrada."

Si quieres que esto ocurra de forma proactiva, también puedes incluir una línea explícita en tu prompt de Heartbeat como: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
No pongas secretos (claves API, números de teléfono, tokens privados) en `HEARTBEAT.md`, porque pasa a formar parte del contexto del prompt.
</Warning>

## Despertar manual (bajo demanda)

Puedes poner en cola un evento del sistema y activar un Heartbeat inmediato con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si varios agentes tienen `heartbeat` configurado, un despertar manual ejecuta inmediatamente los Heartbeats de cada uno de esos agentes.

Usa `--mode next-heartbeat` para esperar al siguiente tick programado.

## Entrega de razonamiento (opcional)

Por defecto, los Heartbeats entregan solo la carga útil final de “respuesta”.

Si quieres transparencia, habilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Cuando está habilitado, los Heartbeats también entregarán un mensaje separado con prefijo `Reasoning:` (la misma forma que `/reasoning on`). Esto puede ser útil cuando el agente gestiona varias sesiones/codexes y quieres ver por qué decidió enviarte un aviso, pero también puede filtrar más detalle interno del que deseas. Es preferible mantenerlo desactivado en chats grupales.

## Conciencia de costos

Los Heartbeats ejecutan turnos completos del agente. Intervalos más cortos consumen más tokens. Para reducir el costo:

- Usa `isolatedSession: true` para evitar enviar el historial completo de conversación (~100K tokens baja a ~2-5K por ejecución).
- Usa `lightContext: true` para limitar los archivos bootstrap a solo `HEARTBEAT.md`.
- Establece un `model` más barato (por ejemplo `ollama/llama3.2:1b`).
- Mantén pequeño `HEARTBEAT.md`.
- Usa `target: "none"` si solo quieres actualizaciones internas de estado.

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — cómo se rastrea el trabajo desacoplado
- [Zona horaria](/es/concepts/timezone) — cómo la zona horaria afecta la programación de Heartbeat
- [Solución de problemas](/es/automation/cron-jobs#troubleshooting) — depuración de problemas de automatización
