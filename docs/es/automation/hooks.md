---
read_when:
    - Quieres automatización basada en eventos para /new, /reset, /stop y eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar hooks
summary: 'Ganchos: automatización impulsada por eventos para comandos y eventos de ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-06-27T10:33:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Los hooks son pequeños scripts que se ejecutan cuando algo sucede dentro del Gateway. Se pueden descubrir desde directorios e inspeccionar con `openclaw hooks`. El Gateway carga hooks internos solo después de que habilitas hooks o configuras al menos una entrada de hook, un paquete de hooks, un manejador heredado o un directorio adicional de hooks.

Hay dos tipos de hooks en OpenClaw:

- **Hooks internos** (esta página): se ejecutan dentro del Gateway cuando se disparan eventos de agente, como `/new`, `/reset`, `/stop` o eventos de ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permiten que otros sistemas activen trabajo en OpenClaw. Consulta [Webhooks](/es/automation/cron-jobs#webhooks).

Los hooks también pueden venir incluidos dentro de plugins. `openclaw hooks list` muestra tanto hooks independientes como hooks gestionados por Plugin.

## Elige la superficie correcta

OpenClaw tiene varias superficies de extensión que parecen similares pero resuelven problemas distintos:

| Si quieres...                                                                                                              | Usa...                                                | Por qué                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Guardar una instantánea en `/new`, registrar `/reset`, llamar a una API externa después de `message:sent` o agregar automatización amplia para operadores | Hooks internos (`HOOK.md`, esta página)              | Los hooks basados en archivos están pensados para efectos secundarios gestionados por operadores y automatización de comandos/ciclo de vida |
| Reescribir prompts, bloquear herramientas, cancelar mensajes salientes o agregar middleware/política ordenados              | Hooks tipados de Plugin mediante `api.on(...)`        | Los hooks tipados tienen contratos explícitos, prioridades, reglas de fusión y semántica de bloqueo/cancelación     |
| Agregar exportación solo de telemetría u observabilidad                                                                     | Eventos de diagnóstico                                | La observabilidad es un bus de eventos separado, no una superficie de hooks de política                             |

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

## Tipos de eventos

| Evento                   | Cuándo se dispara                                         |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Se emitió el comando `/new`                               |
| `command:reset`          | Se emitió el comando `/reset`                             |
| `command:stop`           | Se emitió el comando `/stop`                              |
| `command`                | Cualquier evento de comando (listener general)            |
| `session:compact:before` | Antes de que Compaction resuma el historial               |
| `session:compact:after`  | Después de que Compaction se complete                     |
| `session:patch`          | Cuando se modifican propiedades de la sesión              |
| `agent:bootstrap`        | Antes de inyectar archivos de arranque del espacio de trabajo |
| `gateway:startup`        | Después de que los canales se inician y los hooks se cargan |
| `gateway:shutdown`       | Cuando comienza el apagado del Gateway                    |
| `gateway:pre-restart`    | Antes de un reinicio esperado del Gateway                 |
| `message:received`       | Mensaje entrante desde cualquier canal                    |
| `message:transcribed`    | Después de que se complete la transcripción de audio      |
| `message:preprocessed`   | Después de que el preprocesamiento de medios y enlaces se complete o se omita |
| `message:sent`           | Mensaje saliente entregado                                |

## Escribir hooks

### Estructura de un hook

Cada hook es un directorio que contiene dos archivos:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

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

| Campo      | Descripción                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji mostrado para la CLI                           |
| `events`   | Arreglo de eventos que escuchar                      |
| `export`   | Exportación con nombre que usar (por defecto, `"default"`) |
| `os`       | Plataformas requeridas (por ejemplo, `["darwin", "linux"]`) |
| `requires` | Rutas de `bins`, `anyBins`, `env` o `config` requeridas |
| `always`   | Omitir comprobaciones de elegibilidad (booleano)     |
| `install`  | Métodos de instalación                               |

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

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` (envía respuestas aquí solo en superficies con respuesta) y `context` (datos específicos del evento). Los contextos de hooks de agente y herramientas de Plugin también pueden incluir `trace`, un contexto de traza de diagnóstico compatible con W3C y de solo lectura que los plugins pueden pasar a registros estructurados para correlación OTEL.

`event.messages` solo se entrega automáticamente en superficies con respuesta, como
`command:*` y `message:received`. Los eventos solo de ciclo de vida, como
`agent:bootstrap`, `session:*`, `gateway:*` o `message:sent`, no tienen un
canal de respuesta e ignoran los mensajes enviados.

### Aspectos destacados del contexto de eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName`, `guildId`). `context.content` prefiere un cuerpo de comando no vacío para mensajes similares a comandos; luego recurre al cuerpo entrante sin procesar y al cuerpo genérico. No incluye enriquecimiento solo de agente, como historial de hilos o resúmenes de enlaces.

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de arranque** (`agent:bootstrap`): `context.bootstrapFiles` (arreglo mutable), `context.agentId`.

**Eventos de parche de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campos cambiados), `context.cfg`. Solo los clientes con privilegios pueden activar eventos de parche.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount`, `tokenCount`. `session:compact:after` agrega `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa que el usuario emite `/stop`; es ciclo de vida de
cancelación/comando, no una compuerta de finalización de agente. Los plugins que
necesitan inspeccionar una respuesta final natural y pedir al agente una pasada
más deben usar el hook tipado de Plugin `before_agent_finalize` en su lugar. Consulta [hooks de Plugin](/es/plugins/hooks).

**Eventos de ciclo de vida del Gateway**: `gateway:shutdown` incluye `reason` y `restartExpectedMs`, y se dispara cuando comienza el apagado del Gateway. `gateway:pre-restart` incluye el mismo contexto, pero solo se dispara cuando el apagado forma parte de un reinicio esperado y se proporciona un valor finito de `restartExpectedMs`. Durante el apagado, cada espera de hook de ciclo de vida es de mejor esfuerzo y acotada para que el apagado continúe si un manejador se queda detenido. El presupuesto de espera predeterminado es de 5 segundos para `gateway:shutdown` y de 10 segundos para `gateway:pre-restart`.

Usa `gateway:pre-restart` para avisos breves de reinicio mientras los canales todavía están disponibles:

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

Entre el evento `gateway:shutdown` (o `gateway:pre-restart`) y el resto de la secuencia de apagado, el gateway también dispara un hook tipado de Plugin `session_end` para cada sesión que seguía activa cuando el proceso se detuvo. El `reason` del evento es `shutdown` para una detención simple por SIGTERM/SIGINT y `restart` cuando el cierre se programó como parte de un reinicio esperado. Este drenaje está acotado para que un manejador `session_end` lento no pueda bloquear la salida del proceso, y las sesiones que ya se finalizaron mediante reemplazo / restablecimiento / eliminación / Compaction se omiten para evitar disparos duplicados.

## Descubrimiento de hooks

Los hooks se descubren desde estos directorios, en orden de precedencia de anulación creciente:

1. **Hooks incluidos**: enviados con OpenClaw
2. **Hooks de Plugin**: hooks incluidos dentro de plugins instalados
3. **Hooks gestionados**: `~/.openclaw/hooks/` (instalados por el usuario, compartidos entre espacios de trabajo). Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta precedencia.
4. **Hooks de espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados por defecto hasta que se habiliten explícitamente)

Los hooks de espacio de trabajo pueden agregar nuevos nombres de hook, pero no pueden anular hooks incluidos, gestionados o proporcionados por Plugin con el mismo nombre.

El Gateway omite el descubrimiento de hooks internos al iniciar hasta que se configuran hooks internos. Habilita un hook incluido o gestionado con `openclaw hooks enable <name>`, instala un paquete de hooks o configura `hooks.internal.enabled=true` para optar por habilitarlos. Cuando habilitas un hook con nombre, el Gateway carga solo el manejador de ese hook; `hooks.internal.enabled=true`, los directorios adicionales de hooks y los manejadores heredados optan por el descubrimiento amplio.

### Paquetes de hooks

Los paquetes de hooks son paquetes npm que exportan hooks mediante `openclaw.hooks` en `package.json`. Instala con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones de npm son solo de registro (nombre de paquete + versión exacta opcional o dist-tag). Las especificaciones Git/URL/archivo y los rangos semver se rechazan.

## Hooks incluidos

| Hook                  | Eventos                                           | Qué hace                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Guarda el contexto de la sesión en `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inyecta archivos de arranque adicionales desde patrones glob   |
| command-logger        | `command`                                         | Registra todos los comandos en `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envía avisos de chat visibles cuando la Compaction de la sesión empieza/termina |
| boot-md               | `gateway:startup`                                 | Ejecuta `BOOT.md` cuando se inicia el Gateway                  |

Habilita cualquier hook incluido:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalles de session-memory

Extrae los últimos 15 mensajes de usuario/asistente y los guarda en `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando la fecha local del host. La captura de memoria se ejecuta en segundo plano para que los acuses de recibo de `/new` y `/reset` no se retrasen por lecturas de transcripción ni por la generación opcional de slugs. Establece `hooks.internal.entries.session-memory.llmSlug: true` para generar slugs descriptivos de nombre de archivo con el modelo configurado. Requiere que `workspace.dir` esté configurado.

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

Las rutas se resuelven de forma relativa al espacio de trabajo. Solo se cargan nombres base de arranque reconocidos (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalles de command-logger

Registra cada comando de barra diagonal en `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalles de compaction-notifier

Envía mensajes de estado breves a la conversación actual cuando OpenClaw empieza y termina de compactar la transcripción de la sesión. Esto hace que los turnos largos sean menos confusos en superficies de chat porque el usuario puede ver que el asistente está resumiendo el contexto y continuará después de la Compaction.

<a id="boot-md"></a>

### Detalles de boot-md

Ejecuta `BOOT.md` desde el espacio de trabajo activo cuando se inicia el Gateway.

## Hooks de Plugin

Los Plugins pueden registrar hooks tipados mediante el SDK de Plugin para una integración más profunda:
interceptar llamadas a herramientas, modificar prompts, controlar el flujo de mensajes y más.
Usa hooks de Plugin cuando necesites `before_tool_call`, `before_agent_reply`,
`before_install` u otros hooks de ciclo de vida dentro del proceso.

Los hooks internos gestionados por Plugins son distintos: participan en el sistema
general de eventos de comando/ciclo de vida de esta página y aparecen en `openclaw hooks list` como
`plugin:<id>`. Úsalos para efectos secundarios y compatibilidad con paquetes de hooks, no
para middleware ordenado ni puertas de política.

Para la referencia completa de hooks de Plugin, consulta [Hooks de Plugin](/es/plugins/hooks).

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

Variables de entorno por hook:

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
El formato de configuración heredado del arreglo `hooks.internal.handlers` todavía es compatible por retrocompatibilidad, pero los hooks nuevos deberían usar el sistema basado en descubrimiento.
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

## Mejores prácticas

- **Mantén rápidos los handlers.** Los hooks se ejecutan durante el procesamiento de comandos. Lanza el trabajo pesado en segundo plano con `void processInBackground(event)`.
- **Gestiona los errores con elegancia.** Envuelve las operaciones riesgosas en try/catch; no lances excepciones para que otros handlers puedan ejecutarse.
- **Filtra eventos pronto.** Devuelve de inmediato si el tipo o la acción del evento no es relevante.
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

### Hook no ejecutándose

1. Verifica que el hook esté habilitado: `openclaw hooks list`
2. Reinicia tu proceso de Gateway para que los hooks se recarguen.
3. Revisa los registros del Gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [Referencia de CLI: hooks](/es/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/es/plugins/hooks) — hooks de ciclo de vida de Plugin dentro del proceso
- [Configuración](/es/gateway/configuration-reference#hooks)
