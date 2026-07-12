---
read_when:
    - Quieres automatización basada en eventos para /new, /reset, /stop y los eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar hooks
summary: 'Hooks: automatización basada en eventos para comandos y eventos del ciclo de vida'
title: Hooks
x-i18n:
    generated_at: "2026-07-11T22:51:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Los hooks son pequeños scripts que se ejecutan dentro del Gateway cuando se producen eventos del agente: comandos como `/new`, `/reset`, `/stop`, Compaction de sesión, ciclo de vida del Gateway y flujo de mensajes. Se detectan en directorios y se administran con `openclaw hooks`. El Gateway carga los hooks internos únicamente después de que habilites los hooks o configures al menos una entrada de hook, un paquete de hooks, un controlador heredado o un directorio adicional de hooks.

Hay dos tipos de hooks en OpenClaw:

- **Hooks internos** (esta página): se ejecutan dentro del Gateway cuando se producen eventos del agente.
- **Webhooks**: endpoints HTTP externos que permiten que otros sistemas activen tareas en OpenClaw. Consulta [Webhooks](/es/automation/cron-jobs#webhooks).

Los hooks también pueden incluirse dentro de plugins. `openclaw hooks list` muestra tanto los hooks independientes como los administrados por plugins (mostrados como `plugin:<id>`).

## Elegir la superficie adecuada

OpenClaw tiene varias superficies de extensión que parecen similares, pero resuelven problemas diferentes:

| Si quieres...                                                                                                                               | Usa...                                         | Por qué                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Guardar una instantánea con `/new`, registrar `/reset`, llamar a una API externa después de `message:sent` o añadir automatización general del operador | Hooks internos (`HOOK.md`, esta página)        | Los hooks basados en archivos están pensados para efectos secundarios administrados por el operador y automatización de comandos y del ciclo de vida |
| Reescribir prompts, bloquear herramientas, cancelar mensajes salientes o añadir middleware o políticas ordenados                            | Hooks tipados de plugins mediante `api.on(...)` | Los hooks tipados tienen contratos explícitos, prioridades, reglas de combinación y semántica de bloqueo y cancelación |
| Añadir exportación exclusiva de telemetría u observabilidad                                                                                  | Eventos de diagnóstico                         | La observabilidad es un bus de eventos independiente, no una superficie de hooks de políticas                     |

Usa hooks internos cuando quieras una automatización que se comporte como una pequeña integración instalada. Usa hooks tipados de plugins cuando necesites controlar el ciclo de vida en tiempo de ejecución.

## Inicio rápido

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Tipos de eventos

Los hooks se suscriben a una clave específica de esta tabla o a un nombre de familia sin más
(`command`, `session`, `agent`, `gateway`, `message`) para recibir todas las acciones
de esa familia. El núcleo de OpenClaw no emite ningún otro evento, por lo que cualquier otro nombre es casi
siempre un error tipográfico que deja el hook inactivo sin indicarlo (solo podría activarlo un plugin que emitiera
un evento personalizado). El cargador de hooks registra una advertencia para esos nombres
(por ejemplo, `command:nwe`), y `openclaw hooks info <name>` los señala, por lo que
es posible diagnosticar un hook que nunca se ejecuta.

| Evento                   | Cuándo se activa                                                    |
| ------------------------ | ------------------------------------------------------------------- |
| `command:new`            | Se emite el comando `/new`                                          |
| `command:reset`          | Se emite el comando `/reset`                                        |
| `command:stop`           | Se emite el comando `/stop`                                         |
| `command`                | Cualquier evento de comando (escucha general)                        |
| `session:compact:before` | Antes de que la Compaction resuma el historial                       |
| `session:compact:after`  | Después de que finalice la Compaction                                |
| `session:patch`          | Cuando se modifican las propiedades de la sesión                     |
| `agent:bootstrap`        | Antes de insertar los archivos de inicialización del espacio de trabajo |
| `gateway:startup`        | Después de iniciar los canales y cargar los hooks                    |
| `gateway:shutdown`       | Cuando comienza el cierre del Gateway                                |
| `gateway:pre-restart`    | Antes de un reinicio previsto del Gateway                            |
| `message:received`       | Mensaje entrante de cualquier canal                                  |
| `message:transcribed`    | Después de finalizar la transcripción de audio                       |
| `message:preprocessed`   | Después de finalizar u omitirse el preprocesamiento de medios y enlaces |
| `message:sent`           | Se intentó el envío saliente (`context.success` contiene el resultado) |

## Escribir hooks

### Estructura de un hook

Cada hook es un directorio que contiene dos archivos:

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

El archivo del controlador puede ser `handler.ts`, `handler.js`, `index.ts` o `index.js`.

### Formato de HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Campos de metadatos** (`metadata.openclaw`):

| Campo      | Descripción                                                      |
| ---------- | ---------------------------------------------------------------- |
| `emoji`    | Emoji mostrado en la CLI                                         |
| `events`   | Matriz de eventos que se escucharán                               |
| `export`   | Exportación con nombre que se usará (el valor predeterminado es `"default"`) |
| `os`       | Plataformas requeridas (p. ej., `["darwin", "linux"]`)            |
| `requires` | Rutas requeridas de `bins`, `anyBins`, `env` o `config`           |
| `always`   | Omite las comprobaciones de aptitud (booleano)                     |
| `hookKey`  | Sustitución de la clave de configuración (el valor predeterminado es el nombre del hook) |
| `homepage` | URL de documentación mostrada por `openclaw hooks info`           |
| `install`  | Métodos de instalación                                             |

### Implementación del controlador

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` y `context` (datos específicos del evento). Los contextos de hooks tipados de plugins para hooks de agentes y herramientas también pueden incluir `trace`, un contexto de rastreo de diagnóstico de solo lectura compatible con W3C que los plugins pueden pasar a registros estructurados para correlacionarlos con OTEL.

Las cadenas añadidas a `event.messages` se devuelven al chat únicamente para
`command:new` y `command:reset` (enrutadas como respuesta a la conversación
de origen) y para `session:compact:before` / `session:compact:after`
(enviadas como avisos del estado de la Compaction). Todos los demás eventos, incluidos
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch` y
`gateway:*`, ignoran los mensajes añadidos.

### Aspectos destacados del contexto de los eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Eventos de comando** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName` y `guildId`). `context.content` prioriza un cuerpo de comando no vacío para los mensajes similares a comandos y, como alternativa, usa el cuerpo entrante sin procesar y el cuerpo genérico; no incluye enriquecimiento exclusivo del agente, como el historial del hilo o los resúmenes de enlaces.

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`, además de `context.error` cuando el envío falla.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de inicialización** (`agent:bootstrap`): `context.bootstrapFiles` (matriz mutable), `context.agentId`.

**Eventos de modificación de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo los campos modificados), `context.cfg`. Solo los clientes privilegiados pueden activar eventos de modificación; el contexto es un clon, por lo que los controladores no pueden modificar la entrada de sesión activa.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount` y `tokenCount`. `session:compact:after` añade `compactedCount`, `summaryLength`, `tokensBefore` y `tokensAfter`.

`command:stop` observa que el usuario emite `/stop`; forma parte del ciclo de vida
de la cancelación o del comando, no es una barrera para la finalización del agente. Los plugins que necesiten inspeccionar una
respuesta final natural y pedir al agente una iteración adicional deben usar en su lugar el hook tipado
de plugin `before_agent_finalize`. Consulta [Hooks de plugins](/es/plugins/hooks).

**Eventos del ciclo de vida del Gateway**: `gateway:shutdown` incluye `reason` y `restartExpectedMs`, y se activa cuando comienza el cierre del Gateway. `gateway:pre-restart` incluye el mismo contexto, pero solo se activa cuando el cierre forma parte de un reinicio previsto y se proporciona un valor finito de `restartExpectedMs`. Durante el cierre, la espera de cada hook del ciclo de vida es de mejor esfuerzo y está limitada, de modo que el cierre continúa si un controlador se bloquea. El tiempo de espera predeterminado es de 5 segundos para `gateway:shutdown` y de 10 segundos para `gateway:pre-restart`.

Usa `gateway:pre-restart` para enviar avisos breves de reinicio mientras los canales sigan disponibles:

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
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Entre el evento `gateway:shutdown` (o `gateway:pre-restart`) y el resto de la secuencia de cierre, el Gateway también activa un hook tipado de plugin `session_end` para cada sesión que todavía estaba activa cuando se detuvo el proceso. El valor `reason` del evento es `shutdown` para una detención normal mediante SIGTERM/SIGINT y `restart` cuando el cierre se programó como parte de un reinicio previsto. Este vaciado está limitado para que un controlador `session_end` lento no pueda bloquear la salida del proceso, y se omiten las sesiones que ya se hayan finalizado mediante sustitución, restablecimiento, eliminación o Compaction para evitar activarlas dos veces.

## Detección de hooks

Los hooks se detectan desde cuatro fuentes:

1. **Hooks incluidos**: se distribuyen con OpenClaw
2. **Hooks de plugins**: se incluyen dentro de los plugins instalados; pueden sustituir hooks incluidos con el mismo nombre
3. **Hooks administrados**: `~/.openclaw/hooks/` (instalados por el usuario y compartidos entre espacios de trabajo); pueden sustituir hooks incluidos y de plugins. Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta precedencia.
4. **Hooks del espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados de forma predeterminada hasta que se habiliten explícitamente)

Los hooks del espacio de trabajo pueden añadir nuevos nombres de hooks, pero no pueden sustituir hooks incluidos, administrados o proporcionados por plugins con el mismo nombre.

El Gateway omite la detección de hooks internos durante el inicio hasta que estos se configuran. Habilita un hook incluido o administrado con `openclaw hooks enable <name>`, instala un paquete de hooks o establece `hooks.internal.enabled=true` para habilitarlos. Cuando habilitas un hook por su nombre, el Gateway carga únicamente el controlador de ese hook; `hooks.internal.enabled=true`, los directorios adicionales de hooks y los controladores heredados habilitan la detección general.

### Paquetes de hooks

Los paquetes de hooks son paquetes npm que exportan hooks mediante `openclaw.hooks` en `package.json`. Instálalos con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones de npm solo pueden hacer referencia al registro (nombre del paquete + versión exacta opcional o dist-tag). Se rechazan las especificaciones de Git/URL/archivo y los rangos de semver. Los comandos antiguos `openclaw hooks install` y `openclaw hooks update` son alias obsoletos de `openclaw plugins install` / `openclaw plugins update`.

## Hooks incluidos

| Hook                  | Eventos                                           | Qué hace                                                                  |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Guarda el contexto de la sesión en `<workspace>/memory/`                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inyecta archivos de arranque adicionales a partir de patrones glob        |
| command-logger        | `command`                                         | Registra todos los comandos en `~/.openclaw/logs/commands.log`            |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envía avisos visibles al chat cuando comienza o termina la compactación de la sesión |
| boot-md               | `gateway:startup`                                 | Ejecuta `BOOT.md` cuando se inicia el Gateway                             |

Habilite cualquier hook incluido:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalles de session-memory

Extrae los últimos mensajes del usuario y del asistente (15 de forma predeterminada, configurable mediante `hooks.internal.entries.session-memory.messages`) y los guarda en `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando la fecha local del host. La captura de memoria se ejecuta en segundo plano para que las confirmaciones de `/new` y `/reset` no se retrasen por la lectura de la transcripción ni por la generación opcional del slug. Establezca `hooks.internal.entries.session-memory.llmSlug: true` para generar slugs descriptivos para los nombres de archivo y, opcionalmente, establezca `hooks.internal.entries.session-memory.model` en un alias configurado como `sonnet`, un ID de modelo sin proveedor del proveedor predeterminado del agente o una referencia `provider/model`. La generación del slug usa el modelo predeterminado del agente cuando se omite `model` y recurre a slugs de marca temporal cuando no está disponible. Requiere que `workspace.dir` esté configurado.

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

Registra cada comando con barra como una línea JSON (marca temporal, acción, clave de sesión, ID del remitente, origen) en `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalles de compaction-notifier

Envía mensajes breves de estado a la conversación actual cuando OpenClaw comienza y termina de compactar la transcripción de la sesión. Esto hace que los turnos largos resulten menos confusos en las interfaces de chat, porque el usuario puede ver que el asistente está resumiendo el contexto y continuará después de la compactación.

<a id="boot-md"></a>

### Detalles de boot-md

Ejecuta `BOOT.md` al iniciar el Gateway para cada ámbito de agente configurado, si el archivo existe en el espacio de trabajo resuelto de ese agente.

## Hooks de Plugin

Los plugins pueden registrar hooks tipados mediante el SDK de Plugin para lograr una integración más profunda:
interceptar llamadas a herramientas, modificar prompts, controlar el flujo de mensajes y mucho más.
Use hooks de plugins cuando necesite `before_tool_call`, `before_agent_reply`,
`before_install` u otros hooks del ciclo de vida dentro del proceso.

Los hooks internos administrados por plugins son diferentes: participan en el
sistema general de eventos de comandos y del ciclo de vida descrito en esta página y aparecen en `openclaw hooks list` como
`plugin:<id>`. Úselos para efectos secundarios y compatibilidad con paquetes de hooks, no
para middleware ordenado ni controles de políticas.

Para consultar la referencia completa de hooks de plugins, consulte [Hooks de Plugin](/es/plugins/hooks).

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

Los valores de entorno específicos de cada hook satisfacen las comprobaciones de elegibilidad `requires.env` del hook (junto con el entorno del proceso), y los controladores pueden leerlos desde la entrada de configuración del hook:

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
El formato de configuración heredado del arreglo `hooks.internal.handlers` sigue siendo compatible con versiones anteriores, pero los hooks nuevos deben usar el sistema basado en detección.
</Note>

## Referencia de la CLI

```bash
# Listar todos los hooks (añada --eligible, --verbose o --json)
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

- **Mantenga rápidos los controladores.** Los hooks se ejecutan durante el procesamiento de comandos. Ejecute el trabajo pesado en segundo plano sin esperar su resultado mediante `void processInBackground(event)`.
- **Gestione los errores correctamente.** Envuelva las operaciones de riesgo en try/catch; no lance excepciones, para que puedan ejecutarse los demás controladores.
- **Filtre los eventos cuanto antes.** Retorne inmediatamente si el tipo o la acción del evento no son pertinentes.
- **Use claves de evento específicas.** Prefiera `"events": ["command:new"]` en lugar de `"events": ["command"]` para reducir la sobrecarga.

## Solución de problemas

### No se detecta el hook

```bash
# Verificar la estructura del directorio
ls -la ~/.openclaw/hooks/my-hook/
# Debe mostrar: HOOK.md, handler.ts

# Listar todos los hooks detectados
openclaw hooks list
```

### El hook no es elegible

```bash
openclaw hooks info my-hook
```

Compruebe si faltan binarios (PATH), variables de entorno o valores de configuración, o si existen problemas de compatibilidad con el sistema operativo.

### El hook no se ejecuta

1. Verifique que el hook esté habilitado: `openclaw hooks list`
2. Reinicie el proceso del Gateway para que los hooks se vuelvan a cargar.
3. Consulte los registros del Gateway: `openclaw logs --follow | grep -i hook`

## Contenido relacionado

- [Referencia de la CLI: hooks](/es/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/es/plugins/hooks) — hooks del ciclo de vida de plugins dentro del proceso
- [Configuración](/es/gateway/configuration-reference#hooks)
