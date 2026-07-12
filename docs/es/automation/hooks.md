---
read_when:
    - Quiere automatización basada en eventos para /new, /reset, /stop y los eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar hooks
summary: 'Hooks: automatización basada en eventos para comandos y eventos del ciclo de vida'
title: Hooks
x-i18n:
    generated_at: "2026-07-12T14:17:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Los hooks son pequeños scripts que se ejecutan dentro del Gateway cuando se producen eventos del agente: comandos como `/new`, `/reset`, `/stop`, Compaction de sesión, ciclo de vida del Gateway y flujo de mensajes. Se descubren en directorios y se administran con `openclaw hooks`. El Gateway carga los hooks internos solo después de habilitarlos o configurar al menos una entrada de hook, un paquete de hooks, un controlador heredado o un directorio adicional de hooks.

Hay dos tipos de hooks en OpenClaw:

- **Hooks internos** (esta página): se ejecutan dentro del Gateway cuando se producen eventos del agente.
- **Webhooks**: endpoints HTTP externos que permiten que otros sistemas activen trabajo en OpenClaw. Consulte [Webhooks](/es/automation/cron-jobs#webhooks).

Los hooks también pueden incluirse dentro de plugins. `openclaw hooks list` muestra tanto los hooks independientes como los administrados por plugins (mostrados como `plugin:<id>`).

## Elegir la superficie adecuada

OpenClaw tiene varias superficies de extensión que parecen similares, pero resuelven problemas diferentes:

| Si desea...                                                                                                                            | Use...                                          | Motivo                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Guardar una instantánea con `/new`, registrar `/reset`, llamar a una API externa después de `message:sent` o añadir automatización general del operador | Hooks internos (`HOOK.md`, esta página)         | Los hooks basados en archivos están pensados para efectos secundarios administrados por el operador y automatización de comandos o del ciclo de vida |
| Reescribir prompts, bloquear herramientas, cancelar mensajes salientes o añadir middleware o políticas ordenados                       | Hooks de plugin tipados mediante `api.on(...)`  | Los hooks tipados tienen contratos explícitos, prioridades, reglas de combinación y semántica de bloqueo o cancelación  |
| Añadir exportación solo de telemetría u observabilidad                                                                                  | Eventos de diagnóstico                          | La observabilidad es un bus de eventos independiente, no una superficie de hooks de políticas                          |

Use hooks internos cuando quiera una automatización que se comporte como una pequeña integración instalada. Use hooks de plugin tipados cuando necesite controlar el ciclo de vida del entorno de ejecución.

## Inicio rápido

```bash
# Enumerar los hooks disponibles
openclaw hooks list

# Habilitar un hook
openclaw hooks enable session-memory

# Comprobar el estado de los hooks
openclaw hooks check

# Obtener información detallada
openclaw hooks info session-memory
```

## Tipos de eventos

Los hooks se suscriben a una clave específica de esta tabla o a un nombre de familia
sin calificar (`command`, `session`, `agent`, `gateway`, `message`) para recibir todas las acciones
de esa familia. El núcleo de OpenClaw no emite nada más, por lo que cualquier otro nombre casi
siempre es un error tipográfico que deja el hook inactivo silenciosamente (solo podría activarlo un plugin que emitiera
un evento personalizado). El cargador de hooks registra una advertencia para esos nombres
(por ejemplo, `command:nwe`), y `openclaw hooks info <name>` los marca, por lo que es posible diagnosticar
un hook que nunca se ejecuta.

| Evento                   | Cuándo se activa                                                     |
| ------------------------ | -------------------------------------------------------------------- |
| `command:new`            | Se emite el comando `/new`                                           |
| `command:reset`          | Se emite el comando `/reset`                                         |
| `command:stop`           | Se emite el comando `/stop`                                          |
| `command`                | Cualquier evento de comando (escucha general)                        |
| `session:compact:before` | Antes de que Compaction resuma el historial                          |
| `session:compact:after`  | Después de que finalice Compaction                                   |
| `session:patch`          | Cuando se modifican las propiedades de la sesión                     |
| `agent:bootstrap`        | Antes de inyectar los archivos de arranque del espacio de trabajo    |
| `gateway:startup`        | Después de iniciar los canales y cargar los hooks                    |
| `gateway:shutdown`       | Cuando comienza el cierre del Gateway                                |
| `gateway:pre-restart`    | Antes de un reinicio previsto del Gateway                            |
| `message:received`       | Mensaje entrante de cualquier canal                                  |
| `message:transcribed`    | Después de finalizar la transcripción de audio                       |
| `message:preprocessed`   | Después de finalizar u omitir el preprocesamiento de medios y enlaces |
| `message:sent`           | Se intentó un envío saliente (`context.success` contiene el resultado) |

## Escribir hooks

### Estructura de un hook

Cada hook es un directorio que contiene dos archivos:

```text
my-hook/
├── HOOK.md          # Metadatos y documentación
└── handler.ts       # Implementación del controlador
```

El archivo del controlador puede ser `handler.ts`, `handler.js`, `index.ts` o `index.js`.

### Formato de HOOK.md

```markdown
---
name: my-hook
description: "Descripción breve de lo que hace este hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Mi hook

Aquí va la documentación detallada.
```

**Campos de metadatos** (`metadata.openclaw`):

| Campo      | Descripción                                                   |
| ---------- | ------------------------------------------------------------- |
| `emoji`    | Emoji mostrado en la CLI                                      |
| `events`   | Matriz de eventos que se escucharán                           |
| `export`   | Exportación con nombre que se usará (el valor predeterminado es `"default"`) |
| `os`       | Plataformas requeridas (p. ej., `["darwin", "linux"]`)        |
| `requires` | Rutas requeridas de `bins`, `anyBins`, `env` o `config`       |
| `always`   | Omite las comprobaciones de elegibilidad (booleano)           |
| `hookKey`  | Sustitución de la clave de configuración (el valor predeterminado es el nombre del hook) |
| `homepage` | URL de la documentación que muestra `openclaw hooks info`     |
| `install`  | Métodos de instalación                                        |

### Implementación del controlador

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] Se activó el comando nuevo`);
  // Su lógica aquí

  // Enviar opcionalmente una respuesta en superficies que admitan respuestas
  event.messages.push("¡Hook ejecutado!");
};

export default handler;
```

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` y `context` (datos específicos del evento). Los contextos de hooks de plugin tipados para hooks de agente y herramientas también pueden incluir `trace`, un contexto de seguimiento de diagnóstico de solo lectura compatible con W3C que los plugins pueden pasar a registros estructurados para la correlación con OTEL.

Las cadenas añadidas a `event.messages` se devuelven al chat solo para
`command:new` y `command:reset` (enrutadas como respuesta a la conversación
de origen) y para `session:compact:before` / `session:compact:after`
(enviadas como avisos de estado de Compaction). Todos los demás eventos, incluidos
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch` y
`gateway:*`, ignoran los mensajes añadidos.

### Aspectos destacados del contexto de los eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Eventos de comando** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName`, `guildId`). `context.content` da preferencia a un cuerpo de comando no vacío para los mensajes similares a comandos y, a continuación, recurre al cuerpo entrante sin procesar y al cuerpo genérico; no incluye enriquecimiento exclusivo del agente, como el historial del hilo o los resúmenes de enlaces.

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`, además de `context.error` cuando falla el envío.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de arranque** (`agent:bootstrap`): `context.bootstrapFiles` (matriz mutable), `context.agentId`.

**Eventos de modificación de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo los campos modificados), `context.cfg`. Solo los clientes con privilegios pueden activar eventos de modificación; el contexto es un clon, por lo que los controladores no pueden modificar la entrada de sesión activa.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount`, `tokenCount`. `session:compact:after` añade `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa cuando el usuario emite `/stop`; forma parte del ciclo de vida
de la cancelación o del comando, no es una barrera de finalización del agente. Los plugins que necesiten inspeccionar una
respuesta final natural y pedir al agente que realice una pasada más deben usar en su lugar el hook
de plugin tipado `before_agent_finalize`. Consulte [Hooks de plugins](/es/plugins/hooks).

**Eventos del ciclo de vida del Gateway**: `gateway:shutdown` incluye `reason` y `restartExpectedMs`, y se activa cuando comienza el cierre del Gateway. `gateway:pre-restart` incluye el mismo contexto, pero solo se activa cuando el cierre forma parte de un reinicio previsto y se proporciona un valor finito de `restartExpectedMs`. Durante el cierre, la espera de cada hook del ciclo de vida es de mejor esfuerzo y está limitada, de modo que el cierre continúa si un controlador se bloquea. El límite de espera predeterminado es de 5 segundos para `gateway:shutdown` y de 10 segundos para `gateway:pre-restart`.

Use `gateway:pre-restart` para avisos breves de reinicio mientras los canales sigan disponibles:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `El Gateway se reiniciará en ~${restartInSeconds}s (${event.context.reason}). Cree un punto de control ahora.`,
  ]);
}
```

Entre el evento `gateway:shutdown` (o `gateway:pre-restart`) y el resto de la secuencia de cierre, el Gateway también activa un hook de plugin tipado `session_end` para cada sesión que seguía activa cuando se detuvo el proceso. El valor `reason` del evento es `shutdown` para una detención normal mediante SIGTERM/SIGINT y `restart` cuando el cierre se programó como parte de un reinicio previsto. Este vaciado está limitado para que un controlador `session_end` lento no pueda bloquear la salida del proceso, y se omiten las sesiones que ya se hayan finalizado mediante sustitución, restablecimiento, eliminación o Compaction para evitar activaciones duplicadas.

## Descubrimiento de hooks

Los hooks se descubren desde cuatro fuentes:

1. **Hooks incluidos**: se distribuyen con OpenClaw
2. **Hooks de plugins**: se incluyen dentro de los plugins instalados; pueden sustituir hooks incluidos con el mismo nombre
3. **Hooks administrados**: `~/.openclaw/hooks/` (instalados por el usuario y compartidos entre espacios de trabajo); pueden sustituir hooks incluidos y hooks de plugins. Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta precedencia.
4. **Hooks del espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados de forma predeterminada hasta que se habiliten explícitamente)

Los hooks del espacio de trabajo pueden añadir nombres de hooks nuevos, pero no pueden sustituir hooks incluidos, administrados o proporcionados por plugins que tengan el mismo nombre.

El Gateway omite el descubrimiento de hooks internos durante el inicio hasta que estos estén configurados. Habilite un hook incluido o administrado con `openclaw hooks enable <name>`, instale un paquete de hooks o establezca `hooks.internal.enabled=true` para habilitarlos. Cuando se habilita un hook con nombre, el Gateway carga únicamente el controlador de ese hook; `hooks.internal.enabled=true`, los directorios adicionales de hooks y los controladores heredados habilitan el descubrimiento general.

### Paquetes de hooks

Los paquetes de hooks son paquetes npm que exportan hooks mediante `openclaw.hooks` en `package.json`. Instálelos con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones de npm solo pueden proceder del registro (nombre del paquete + versión exacta o dist-tag opcional). Se rechazan las especificaciones de Git/URL/archivo y los rangos semver. Los comandos anteriores `openclaw hooks install` y `openclaw hooks update` son alias obsoletos de `openclaw plugins install` / `openclaw plugins update`.

## Hooks incluidos

| Hook                  | Eventos                                           | Función                                                         |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Guarda el contexto de la sesión en `<workspace>/memory/`        |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inyecta archivos de arranque adicionales mediante patrones glob |
| command-logger        | `command`                                         | Registra todos los comandos en `~/.openclaw/logs/commands.log`  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envía avisos visibles al chat al iniciar/finalizar Compaction    |
| boot-md               | `gateway:startup`                                 | Ejecuta `BOOT.md` cuando se inicia el Gateway                    |

Para habilitar cualquier hook incluido:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalles de session-memory

Extrae los últimos mensajes del usuario y del asistente (15 de forma predeterminada, configurable mediante `hooks.internal.entries.session-memory.messages`) y los guarda en `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando la fecha local del host. La captura de memoria se ejecuta en segundo plano para que las confirmaciones de `/new` y `/reset` no se retrasen por la lectura de la transcripción ni por la generación opcional de identificadores descriptivos. Establezca `hooks.internal.entries.session-memory.llmSlug: true` para generar identificadores descriptivos para los nombres de archivo y, opcionalmente, establezca `hooks.internal.entries.session-memory.model` en un alias configurado, como `sonnet`, un ID de modelo sin proveedor que pertenezca al proveedor predeterminado del agente o una referencia `provider/model`. Cuando se omite `model`, la generación del identificador usa el modelo predeterminado del agente y, si no está disponible, recurre a identificadores basados en la marca de tiempo. Requiere que `workspace.dir` esté configurado.

<a id="bootstrap-extra-files"></a>

### Configuración de bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

`patterns` y `files` se aceptan como alias de `paths`. Las rutas se resuelven en relación con el espacio de trabajo y deben permanecer dentro de él. Solo se cargan los nombres base de arranque reconocidos (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalles de command-logger

Registra cada comando con barra como una línea JSON (marca de tiempo, acción, clave de sesión, ID del remitente, origen) en `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalles de compaction-notifier

Envía mensajes breves de estado a la conversación actual cuando OpenClaw inicia y finaliza la compactación de la transcripción de la sesión. Esto hace que los turnos largos resulten menos confusos en las interfaces de chat, ya que el usuario puede ver que el asistente está resumiendo el contexto y que continuará después de Compaction.

<a id="boot-md"></a>

### Detalles de boot-md

Ejecuta `BOOT.md` al iniciar el Gateway para cada ámbito de agente configurado, si el archivo existe en el espacio de trabajo resuelto de ese agente.

## Hooks de Plugin

Los Plugins pueden registrar hooks tipados mediante el SDK de Plugin para lograr una integración más profunda:
interceptar llamadas a herramientas, modificar instrucciones, controlar el flujo de mensajes y mucho más.
Use hooks de Plugin cuando necesite `before_tool_call`, `before_agent_reply`,
`before_install` u otros hooks del ciclo de vida dentro del proceso.

Los hooks internos gestionados por Plugins son diferentes: participan en el sistema
general de eventos de comandos y del ciclo de vida descrito en esta página y aparecen en `openclaw hooks list` como
`plugin:<id>`. Úselos para efectos secundarios y compatibilidad con paquetes de hooks, no
como middleware ordenado ni como controles de políticas.

Para consultar la referencia completa de hooks de Plugin, consulte [Hooks de Plugin](/es/plugins/hooks).

## Configuración

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Los valores de entorno específicos de cada hook satisfacen sus comprobaciones de elegibilidad `requires.env` (junto con el entorno del proceso), y los controladores pueden leerlos desde la entrada de configuración del hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Directorios de hooks adicionales:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
El formato de configuración heredado basado en el arreglo `hooks.internal.handlers` sigue siendo compatible por motivos de retrocompatibilidad, pero los hooks nuevos deben usar el sistema basado en descubrimiento.
</Note>

## Referencia de la CLI

```bash
# Enumerar todos los hooks (añada --eligible, --verbose o --json)
openclaw hooks list

# Mostrar información detallada sobre un hook
openclaw hooks info <hook-name>

# Mostrar el resumen de elegibilidad
openclaw hooks check

# Habilitar/deshabilitar
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Prácticas recomendadas

- **Mantenga rápidos los controladores.** Los hooks se ejecutan durante el procesamiento de comandos. Ejecute las tareas pesadas en segundo plano sin esperar su resultado mediante `void processInBackground(event)`.
- **Gestione los errores de forma adecuada.** Encapsule las operaciones arriesgadas en try/catch; no lance excepciones para que los demás controladores puedan ejecutarse.
- **Filtre los eventos cuanto antes.** Retorne inmediatamente si el tipo o la acción del evento no son relevantes.
- **Use claves de evento específicas.** Prefiera `"events": ["command:new"]` en lugar de `"events": ["command"]` para reducir la sobrecarga.

## Solución de problemas

### No se descubre el hook

```bash
# Verificar la estructura del directorio
ls -la ~/.openclaw/hooks/my-hook/
# Debe mostrar: HOOK.md, handler.ts

# Enumerar todos los hooks descubiertos
openclaw hooks list
```

### El hook no es elegible

```bash
openclaw hooks info my-hook
```

Compruebe si faltan binarios (PATH), variables de entorno o valores de configuración, o si existe alguna incompatibilidad con el sistema operativo.

### El hook no se ejecuta

1. Compruebe que el hook esté habilitado: `openclaw hooks list`
2. Reinicie el proceso del Gateway para que los hooks se vuelvan a cargar.
3. Compruebe los registros del Gateway: `openclaw logs --follow | grep -i hook`

## Contenido relacionado

- [Referencia de la CLI: hooks](/es/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/es/plugins/hooks) — hooks del ciclo de vida del Plugin dentro del proceso
- [Configuración](/es/gateway/configuration-reference#hooks)
