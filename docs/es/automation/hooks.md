---
read_when:
    - Quieres automatización basada en eventos para /new, /reset, /stop y los eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar ganchos
summary: 'Hooks: automatización basada en eventos para comandos y eventos del ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-07-05T11:01:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b35a7f4bf42ed45960b6988e6640b64c5c70c0948234f9403872007565bc8e6
    source_path: automation/hooks.md
    workflow: 16
---

Los hooks son scripts pequeños que se ejecutan dentro del Gateway cuando se disparan eventos del agente: comandos como `/new`, `/reset`, `/stop`, Compaction de sesión, ciclo de vida del gateway y flujo de mensajes. Se descubren desde directorios y se gestionan con `openclaw hooks`. El Gateway carga los hooks internos solo después de que habilitas hooks o configuras al menos una entrada de hook, un paquete de hooks, un manejador heredado o un directorio adicional de hooks.

Hay dos tipos de hooks en OpenClaw:

- **Hooks internos** (esta página): se ejecutan dentro del Gateway cuando se disparan eventos del agente.
- **Webhooks**: endpoints HTTP externos que permiten que otros sistemas activen trabajo en OpenClaw. Consulta [Webhooks](/es/automation/cron-jobs#webhooks).

Los hooks también se pueden incluir dentro de plugins. `openclaw hooks list` muestra tanto hooks independientes como hooks gestionados por plugins (mostrados como `plugin:<id>`).

## Elige la superficie adecuada

OpenClaw tiene varias superficies de extensión que parecen similares, pero resuelven problemas distintos:

| Si quieres...                                                                                                                | Usa...                                      | Por qué                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Guardar una instantánea en `/new`, registrar `/reset`, llamar a una API externa después de `message:sent` o añadir automatización general de operador | Hooks internos (`HOOK.md`, esta página)    | Los hooks basados en archivos están pensados para efectos secundarios gestionados por operadores y automatización de comandos/ciclo de vida |
| Reescribir prompts, bloquear herramientas, cancelar mensajes salientes o añadir middleware/política ordenados                 | Hooks tipados de Plugin mediante `api.on(...)` | Los hooks tipados tienen contratos explícitos, prioridades, reglas de combinación y semántica de bloqueo/cancelación |
| Añadir exportación solo de telemetría u observabilidad                                                                        | Eventos de diagnóstico                     | La observabilidad es un bus de eventos separado, no una superficie de hooks de política                   |

Usa hooks internos cuando quieras automatización que se comporte como una pequeña integración instalada. Usa hooks tipados de Plugin cuando necesites control del ciclo de vida en tiempo de ejecución.

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

## Tipos de evento

| Evento                   | Cuándo se dispara                                         |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Se emite el comando `/new`                                |
| `command:reset`          | Se emite el comando `/reset`                              |
| `command:stop`           | Se emite el comando `/stop`                               |
| `command`                | Cualquier evento de comando (escucha general)             |
| `session:compact:before` | Antes de que Compaction resuma el historial               |
| `session:compact:after`  | Después de que Compaction se complete                     |
| `session:patch`          | Cuando se modifican propiedades de la sesión              |
| `agent:bootstrap`        | Antes de inyectar los archivos de arranque del espacio de trabajo |
| `gateway:startup`        | Después de que los canales se inician y los hooks se cargan |
| `gateway:shutdown`       | Cuando comienza el apagado del gateway                    |
| `gateway:pre-restart`    | Antes de un reinicio esperado del gateway                 |
| `message:received`       | Mensaje entrante desde cualquier canal                    |
| `message:transcribed`    | Después de que se completa la transcripción de audio      |
| `message:preprocessed`   | Después de que el preprocesamiento de medios y enlaces se completa o se omite |
| `message:sent`           | Se intentó el envío saliente (`context.success` tiene el resultado) |

## Escribir hooks

### Estructura del hook

Cada hook es un directorio que contiene dos archivos:

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

El archivo del manejador puede ser `handler.ts`, `handler.js`, `index.ts` o `index.js`.

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

| Campo      | Descripción                                           |
| ---------- | ----------------------------------------------------- |
| `emoji`    | Emoji mostrado para la CLI                            |
| `events`   | Array de eventos que escuchar                         |
| `export`   | Exportación con nombre que usar (por defecto `"default"`) |
| `os`       | Plataformas requeridas (por ejemplo, `["darwin", "linux"]`) |
| `requires` | Rutas requeridas de `bins`, `anyBins`, `env` o `config` |
| `always`   | Omitir comprobaciones de elegibilidad (booleano)      |
| `hookKey`  | Reemplazo de clave de configuración (por defecto, el nombre del hook) |
| `homepage` | URL de documentación mostrada por `openclaw hooks info` |
| `install`  | Métodos de instalación                                |

### Implementación del manejador

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

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` y `context` (datos específicos del evento). Los contextos de hooks tipados de Plugin para hooks de agente y herramienta también pueden incluir `trace`, un contexto de traza de diagnóstico de solo lectura compatible con W3C que los plugins pueden pasar a registros estructurados para correlación OTEL.

Las cadenas enviadas a `event.messages` se entregan de vuelta al chat solo para
`command:new` y `command:reset` (enrutadas como respuesta a la conversación
de origen) y para `session:compact:before` / `session:compact:after`
(enviadas como avisos de estado de Compaction). Todos los demás eventos,
incluidos `command:stop`, `message:*`, `agent:bootstrap`, `session:patch` y
`gateway:*`, ignoran los mensajes enviados.

### Puntos destacados del contexto de evento

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Eventos de comando** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName`, `guildId`). `context.content` prefiere un cuerpo de comando no vacío para mensajes similares a comandos, y luego recurre al cuerpo entrante sin procesar y al cuerpo genérico; no incluye enriquecimiento solo del agente, como historial del hilo o resúmenes de enlaces.

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`, además de `context.error` cuando el envío falla.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo final enriquecido), `context.from`, `context.channelId`.

**Eventos de arranque** (`agent:bootstrap`): `context.bootstrapFiles` (array mutable), `context.agentId`.

**Eventos de parche de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campos cambiados), `context.cfg`. Solo los clientes con privilegios pueden activar eventos de parche; el contexto es una copia, por lo que los manejadores no pueden mutar la entrada de sesión activa.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount`, `tokenCount`. `session:compact:after` añade `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa que el usuario emite `/stop`; pertenece al ciclo de vida de
cancelación/comando, no es una puerta de finalización del agente. Los plugins que necesiten inspeccionar una
respuesta final natural y pedirle al agente una pasada más deben usar en su lugar el hook tipado
de Plugin `before_agent_finalize`. Consulta [Hooks de Plugin](/es/plugins/hooks).

**Eventos de ciclo de vida del Gateway**: `gateway:shutdown` incluye `reason` y `restartExpectedMs`, y se dispara cuando comienza el apagado del gateway. `gateway:pre-restart` incluye el mismo contexto, pero solo se dispara cuando el apagado forma parte de un reinicio esperado y se suministra un valor finito de `restartExpectedMs`. Durante el apagado, cada espera de hook de ciclo de vida se realiza como mejor esfuerzo y está acotada para que el apagado continúe si un manejador se atasca. El presupuesto de espera predeterminado es de 5 segundos para `gateway:shutdown` y 10 segundos para `gateway:pre-restart`.

Usa `gateway:pre-restart` para avisos breves de reinicio mientras los canales siguen disponibles:

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

Entre el evento `gateway:shutdown` (o `gateway:pre-restart`) y el resto de la secuencia de apagado, el gateway también dispara un hook tipado de Plugin `session_end` para cada sesión que seguía activa cuando el proceso se detuvo. El `reason` del evento es `shutdown` para una parada SIGTERM/SIGINT simple y `restart` cuando el cierre se programó como parte de un reinicio esperado. Este drenaje está acotado para que un manejador lento de `session_end` no pueda bloquear la salida del proceso, y las sesiones que ya se hayan finalizado mediante reemplazo / reset / eliminación / Compaction se omiten para evitar disparos duplicados.

## Descubrimiento de hooks

Los hooks se descubren desde cuatro fuentes:

1. **Hooks incluidos**: enviados con OpenClaw
2. **Hooks de Plugin**: incluidos dentro de plugins instalados; pueden reemplazar hooks incluidos con el mismo nombre
3. **Hooks gestionados**: `~/.openclaw/hooks/` (instalados por el usuario, compartidos entre espacios de trabajo); pueden reemplazar hooks incluidos y hooks de Plugin. Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta precedencia.
4. **Hooks de espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados por defecto hasta que se habilitan explícitamente)

Los hooks de espacio de trabajo pueden añadir nuevos nombres de hook, pero no pueden reemplazar hooks incluidos, gestionados o proporcionados por plugins con el mismo nombre.

El Gateway omite el descubrimiento de hooks internos al inicio hasta que se configuran hooks internos. Habilita un hook incluido o gestionado con `openclaw hooks enable <name>`, instala un paquete de hooks o define `hooks.internal.enabled=true` para optar por usarlos. Cuando habilitas un hook con nombre, el Gateway carga solo el manejador de ese hook; `hooks.internal.enabled=true`, los directorios adicionales de hooks y los manejadores heredados optan por el descubrimiento amplio.

### Paquetes de hooks

Los paquetes de hooks son paquetes npm que exportan hooks mediante `openclaw.hooks` en `package.json`. Instala con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones npm son solo de registro (nombre del paquete + versión exacta opcional o dist-tag). Se rechazan especificaciones Git/URL/archivo y rangos semver. Los comandos antiguos `openclaw hooks install` y `openclaw hooks update` son alias obsoletos de `openclaw plugins install` / `openclaw plugins update`.

## Hooks incluidos

| Hook                  | Eventos                                           | Qué hace                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Guarda el contexto de la sesión en `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inyecta archivos de arranque adicionales desde patrones glob   |
| command-logger        | `command`                                         | Registra todos los comandos en `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envía avisos visibles en el chat cuando la compactación de la sesión empieza/termina |
| boot-md               | `gateway:startup`                                 | Ejecuta `BOOT.md` cuando se inicia el Gateway                  |

Habilita cualquier hook incluido:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### detalles de session-memory

Extrae los últimos mensajes del usuario/asistente (15 de forma predeterminada, configurable con `hooks.internal.entries.session-memory.messages`) y los guarda en `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando la fecha local del host. La captura de memoria se ejecuta en segundo plano para que las confirmaciones de `/new` y `/reset` no se retrasen por lecturas de transcripción ni por la generación opcional de slugs. Define `hooks.internal.entries.session-memory.llmSlug: true` para generar slugs descriptivos de nombres de archivo con el modelo configurado (recurre a slugs de marca de tiempo cuando no está disponible). Requiere que `workspace.dir` esté configurado.

<a id="bootstrap-extra-files"></a>

### configuración de bootstrap-extra-files

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

### detalles de command-logger

Registra cada comando de barra como una línea JSON (marca de tiempo, acción, clave de sesión, ID del remitente, origen) en `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### detalles de compaction-notifier

Envía mensajes breves de estado a la conversación actual cuando OpenClaw empieza y termina de compactar la transcripción de la sesión. Esto hace que los turnos largos sean menos confusos en superficies de chat porque el usuario puede ver que el asistente está resumiendo el contexto y continuará después de la compactación.

<a id="boot-md"></a>

### detalles de boot-md

Ejecuta `BOOT.md` al iniciar el Gateway para cada ámbito de agente configurado, si el archivo existe en el espacio de trabajo resuelto de ese agente.

## Hooks de Plugin

Los Plugins pueden registrar hooks tipados mediante el SDK de Plugin para una integración más profunda:
interceptar llamadas a herramientas, modificar prompts, controlar el flujo de mensajes y más.
Usa hooks de Plugin cuando necesites `before_tool_call`, `before_agent_reply`,
`before_install` u otros hooks de ciclo de vida en proceso.

Los hooks internos gestionados por Plugins son diferentes: participan en el sistema
general de eventos de comandos/ciclo de vida de esta página y aparecen en `openclaw hooks list` como
`plugin:<id>`. Úsalos para efectos secundarios y compatibilidad con paquetes de hooks, no
para middleware ordenado ni puertas de políticas.

Para ver la referencia completa de hooks de Plugin, consulta [Hooks de Plugin](/es/plugins/hooks).

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

Los valores de entorno por hook satisfacen las comprobaciones de elegibilidad `requires.env` de un hook (junto con el entorno del proceso), y los handlers pueden leerlos desde la entrada de configuración de su hook:

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
El formato heredado de configuración del arreglo `hooks.internal.handlers` sigue siendo compatible por retrocompatibilidad, pero los hooks nuevos deben usar el sistema basado en descubrimiento.
</Note>

## Referencia de CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Prácticas recomendadas

- **Mantén los handlers rápidos.** Los hooks se ejecutan durante el procesamiento de comandos. Lanza el trabajo pesado en segundo plano con `void processInBackground(event)`.
- **Gestiona los errores con elegancia.** Envuelve las operaciones riesgosas en try/catch; no lances excepciones para que otros handlers puedan ejecutarse.
- **Filtra los eventos pronto.** Devuelve inmediatamente si el tipo/acción del evento no es relevante.
- **Usa claves de evento específicas.** Prefiere `"events": ["command:new"]` en lugar de `"events": ["command"]` para reducir la sobrecarga.

## Solución de problemas

### Hook no descubierto

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook no elegible

```bash
openclaw hooks info my-hook
```

Comprueba si faltan binarios (PATH), variables de entorno, valores de configuración o compatibilidad con el sistema operativo.

### Hook no se ejecuta

1. Verifica que el hook esté habilitado: `openclaw hooks list`
2. Reinicia tu proceso de Gateway para que los hooks se recarguen.
3. Revisa los registros del Gateway: `openclaw logs --follow | grep -i hook`

## Relacionado

- [Referencia de CLI: hooks](/es/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/es/plugins/hooks) — hooks de ciclo de vida de Plugin en proceso
- [Configuración](/es/gateway/configuration-reference#hooks)
