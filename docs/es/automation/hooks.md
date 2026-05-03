---
read_when:
    - Quieres automatización basada en eventos para /new, /reset, /stop y eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar ganchos
summary: 'Ganchos: automatización basada en eventos para comandos y eventos del ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-05-03T21:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Los hooks son pequeños scripts que se ejecutan cuando ocurre algo dentro del Gateway. Se pueden descubrir desde directorios e inspeccionar con `openclaw hooks`. El Gateway carga hooks internos solo después de que habilitas los hooks o configuras al menos una entrada de hook, un paquete de hooks, un manejador heredado o un directorio adicional de hooks.

Hay dos tipos de hooks en OpenClaw:

- **Hooks internos** (esta página): se ejecutan dentro del Gateway cuando se disparan eventos del agente, como `/new`, `/reset`, `/stop` o eventos del ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permiten que otros sistemas activen trabajo en OpenClaw. Consulta [Webhooks](/es/automation/cron-jobs#webhooks).

Los hooks también se pueden agrupar dentro de plugins. `openclaw hooks list` muestra tanto hooks independientes como hooks administrados por plugins.

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

| Evento                   | Cuándo se dispara                                            |
| ------------------------ | ------------------------------------------------------------ |
| `command:new`            | Se emitió el comando `/new`                                  |
| `command:reset`          | Se emitió el comando `/reset`                                |
| `command:stop`           | Se emitió el comando `/stop`                                 |
| `command`                | Cualquier evento de comando (listener general)               |
| `session:compact:before` | Antes de que la Compaction resuma el historial               |
| `session:compact:after`  | Después de que la Compaction finaliza                        |
| `session:patch`          | Cuando se modifican las propiedades de la sesión             |
| `agent:bootstrap`        | Antes de inyectar los archivos de arranque del espacio de trabajo |
| `gateway:startup`        | Después de que los canales inician y los hooks se cargan     |
| `gateway:shutdown`       | Cuando comienza el apagado del Gateway                       |
| `gateway:pre-restart`    | Antes de un reinicio esperado del Gateway                    |
| `message:received`       | Mensaje entrante desde cualquier canal                       |
| `message:transcribed`    | Después de que finaliza la transcripción de audio            |
| `message:preprocessed`   | Después de que el preprocesamiento de medios y enlaces finaliza o se omite |
| `message:sent`           | Mensaje saliente entregado                                   |

## Escribir hooks

### Estructura del hook

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
| `emoji`    | Emoji de visualización para CLI                      |
| `events`   | Arreglo de eventos para escuchar                     |
| `export`   | Exportación con nombre que se usará (por defecto `"default"`) |
| `os`       | Plataformas requeridas (p. ej., `["darwin", "linux"]`) |
| `requires` | Rutas requeridas de `bins`, `anyBins`, `env` o `config` |
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

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` (hacer push para enviar al usuario) y `context` (datos específicos del evento). Los contextos de hooks de plugins de agente y herramientas también pueden incluir `trace`, un contexto de traza de diagnóstico de solo lectura compatible con W3C que los plugins pueden pasar a logs estructurados para correlación con OTEL.

### Aspectos destacados del contexto de eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName`, `guildId`). `context.content` prefiere un cuerpo de comando no vacío para mensajes con forma de comando; luego recurre al cuerpo entrante sin procesar y al cuerpo genérico; no incluye enriquecimiento solo del agente, como historial de hilos o resúmenes de enlaces.

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de arranque** (`agent:bootstrap`): `context.bootstrapFiles` (arreglo mutable), `context.agentId`.

**Eventos de parche de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campos cambiados), `context.cfg`. Solo los clientes privilegiados pueden activar eventos de parche.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount`, `tokenCount`. `session:compact:after` agrega `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa que el usuario emite `/stop`; pertenece al ciclo de vida de cancelación/comando, no es una puerta de finalización del agente. Los plugins que necesiten inspeccionar una respuesta final natural y pedirle al agente una pasada más deben usar en su lugar el hook tipado de plugin `before_agent_finalize`. Consulta [Hooks de plugins](/es/plugins/hooks).

**Eventos del ciclo de vida del Gateway**: `gateway:shutdown` incluye `reason` y `restartExpectedMs`, y se dispara cuando comienza el apagado del Gateway. `gateway:pre-restart` incluye el mismo contexto, pero solo se dispara cuando el apagado forma parte de un reinicio esperado y se proporciona un valor finito de `restartExpectedMs`. Durante el apagado, la espera de cada hook de ciclo de vida es de mejor esfuerzo y acotada, para que el apagado continúe si un manejador se bloquea.

## Descubrimiento de hooks

Los hooks se descubren desde estos directorios, en orden de precedencia de sobrescritura creciente:

1. **Hooks incluidos**: enviados con OpenClaw
2. **Hooks de plugins**: hooks incluidos dentro de plugins instalados
3. **Hooks administrados**: `~/.openclaw/hooks/` (instalados por el usuario, compartidos entre espacios de trabajo). Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta precedencia.
4. **Hooks del espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados por defecto hasta que se habiliten explícitamente)

Los hooks del espacio de trabajo pueden agregar nuevos nombres de hook, pero no pueden sobrescribir hooks incluidos, administrados o proporcionados por plugins con el mismo nombre.

El Gateway omite el descubrimiento de hooks internos al iniciar hasta que se configuran los hooks internos. Habilita un hook incluido o administrado con `openclaw hooks enable <name>`, instala un paquete de hooks o establece `hooks.internal.enabled=true` para optar por participar. Cuando habilitas un hook con nombre, el Gateway carga solo el manejador de ese hook; `hooks.internal.enabled=true`, los directorios adicionales de hooks y los manejadores heredados optan por el descubrimiento amplio.

### Paquetes de hooks

Los paquetes de hooks son paquetes npm que exportan hooks mediante `openclaw.hooks` en `package.json`. Instala con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones de npm son solo de registro (nombre de paquete + versión exacta opcional o dist-tag). Se rechazan las especificaciones Git/URL/file y los rangos semver.

## Hooks incluidos

| Hook                  | Eventos                                           | Qué hace                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Guarda el contexto de la sesión en `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inyecta archivos de arranque adicionales desde patrones glob   |
| command-logger        | `command`                                         | Registra todos los comandos en `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envía avisos visibles de chat cuando la Compaction de sesión comienza/finaliza |
| boot-md               | `gateway:startup`                                 | Ejecuta `BOOT.md` cuando el Gateway inicia                     |

Habilita cualquier hook incluido:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalles de session-memory

Extrae los últimos 15 mensajes de usuario/asistente, genera un slug descriptivo de nombre de archivo mediante LLM y lo guarda en `<workspace>/memory/YYYY-MM-DD-slug.md` usando la fecha local del host. Requiere que `workspace.dir` esté configurado.

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

Las rutas se resuelven relativas al espacio de trabajo. Solo se cargan nombres base de arranque reconocidos (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalles de command-logger

Registra cada comando slash en `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalles de compaction-notifier

Envía mensajes de estado breves a la conversación actual cuando OpenClaw empieza y termina de compactar la transcripción de la sesión. Esto hace que los turnos largos sean menos confusos en superficies de chat porque el usuario puede ver que el asistente está resumiendo el contexto y continuará después de la Compaction.

<a id="boot-md"></a>

### Detalles de boot-md

Ejecuta `BOOT.md` desde el espacio de trabajo activo cuando el Gateway inicia.

## Hooks de plugins

Los plugins pueden registrar hooks tipados mediante el Plugin SDK para una integración más profunda:
interceptar llamadas a herramientas, modificar prompts, controlar el flujo de mensajes y más.
Usa hooks de plugins cuando necesites `before_tool_call`, `before_agent_reply`,
`before_install` u otros hooks de ciclo de vida en proceso.

Para ver la referencia completa de hooks de plugins, consulta [Hooks de plugins](/es/plugins/hooks).

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

Directorios adicionales de hooks:

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
El formato de configuración heredado de arreglo `hooks.internal.handlers` sigue siendo compatible por retrocompatibilidad, pero los hooks nuevos deben usar el sistema basado en descubrimiento.
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

- **Mantén los manejadores rápidos.** Los ganchos se ejecutan durante el procesamiento de comandos. Ejecuta trabajos pesados sin esperar su resultado con `void processInBackground(event)`.
- **Gestiona los errores con elegancia.** Envuelve las operaciones riesgosas en try/catch; no lances errores para que otros manejadores puedan ejecutarse.
- **Filtra los eventos pronto.** Devuelve inmediatamente si el tipo o la acción del evento no es relevante.
- **Usa claves de evento específicas.** Prefiere `"events": ["command:new"]` en lugar de `"events": ["command"]` para reducir la sobrecarga.

## Solución de problemas

### Gancho no descubierto

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Gancho no elegible

```bash
openclaw hooks info my-hook
```

Comprueba si faltan binarios (PATH), variables de entorno, valores de configuración o compatibilidad con el sistema operativo.

### Gancho no se ejecuta

1. Verifica que el gancho esté habilitado: `openclaw hooks list`
2. Reinicia tu proceso de Gateway para que los ganchos se recarguen.
3. Revisa los registros de Gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [Referencia de CLI: hooks](/es/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Ganchos de Plugin](/es/plugins/hooks) — ganchos del ciclo de vida de Plugin en proceso
- [Configuración](/es/gateway/configuration-reference#hooks)
