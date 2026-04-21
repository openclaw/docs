---
read_when:
    - Quieres automatización impulsada por eventos para /new, /reset, /stop y eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar hooks
summary: 'Hooks: automatización impulsada por eventos para comandos y eventos del ciclo de vida'
title: Hooks
x-i18n:
    generated_at: "2026-04-21T05:12:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5269c3ca3a45d23d79232e041c0980ecaab93fd6f0f1e39e0b2a76cb4c8b5c8b
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Los Hooks son scripts pequeños que se ejecutan cuando ocurre algo dentro del Gateway. Se pueden descubrir desde directorios e inspeccionar con `openclaw hooks`. El Gateway carga los hooks internos solo después de que habilitas hooks o configuras al menos una entrada de hook, paquete de hooks, controlador heredado o directorio adicional de hooks.

Hay dos tipos de hooks en OpenClaw:

- **Hooks internos** (esta página): se ejecutan dentro del Gateway cuando se activan eventos del agente, como `/new`, `/reset`, `/stop` o eventos del ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permiten que otros sistemas activen trabajo en OpenClaw. Consulta [Webhooks](/es/automation/cron-jobs#webhooks).

Los hooks también se pueden incluir dentro de plugins. `openclaw hooks list` muestra tanto hooks independientes como hooks administrados por plugins.

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

| Evento                   | Cuándo se activa                                 |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | Se emite el comando `/new`                       |
| `command:reset`          | Se emite el comando `/reset`                     |
| `command:stop`           | Se emite el comando `/stop`                      |
| `command`                | Cualquier evento de comando (listener general)   |
| `session:compact:before` | Antes de que Compaction resuma el historial      |
| `session:compact:after`  | Después de que Compaction finaliza               |
| `session:patch`          | Cuando se modifican propiedades de la sesión     |
| `agent:bootstrap`        | Antes de inyectar archivos bootstrap del espacio de trabajo |
| `gateway:startup`        | Después de que los canales se inician y se cargan los hooks |
| `message:received`       | Mensaje entrante desde cualquier canal           |
| `message:transcribed`    | Después de que finaliza la transcripción de audio |
| `message:preprocessed`   | Después de completar todo el procesamiento de medios y comprensión de enlaces |
| `message:sent`           | Mensaje saliente entregado                       |

## Escritura de hooks

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

**Campos de metadata** (`metadata.openclaw`):

| Campo      | Descripción                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji de visualización para la CLI                   |
| `events`   | Array de eventos a escuchar                          |
| `export`   | Export nombrado que se usará (por defecto `"default"`) |
| `os`       | Plataformas requeridas (p. ej., `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` o rutas `config` requeridos |
| `always`   | Omitir verificaciones de elegibilidad (boolean)      |
| `install`  | Métodos de instalación                                |

### Implementación del controlador

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

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` (haz push para enviar al usuario) y `context` (datos específicos del evento).

### Aspectos destacados del contexto de eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName`, `guildId`).

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo enriquecido final), `context.from`, `context.channelId`.

**Eventos bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutable), `context.agentId`.

**Eventos de parche de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campos modificados), `context.cfg`. Solo los clientes privilegiados pueden activar eventos de parche.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount`, `tokenCount`. `session:compact:after` agrega `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Descubrimiento de hooks

Los hooks se descubren desde estos directorios, en orden de prioridad creciente para sobrescritura:

1. **Hooks integrados**: distribuidos con OpenClaw
2. **Hooks de plugins**: hooks incluidos dentro de plugins instalados
3. **Hooks administrados**: `~/.openclaw/hooks/` (instalados por el usuario, compartidos entre espacios de trabajo). Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta prioridad.
4. **Hooks del espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados por defecto hasta habilitarlos explícitamente)

Los hooks del espacio de trabajo pueden agregar nuevos nombres de hook, pero no pueden sobrescribir hooks integrados, administrados o proporcionados por plugins con el mismo nombre.

El Gateway omite el descubrimiento de hooks internos al iniciar hasta que los hooks internos estén configurados. Habilita un hook integrado o administrado con `openclaw hooks enable <name>`, instala un paquete de hooks o establece `hooks.internal.enabled=true` para participar. Cuando habilitas un hook con nombre, el Gateway carga solo el controlador de ese hook; `hooks.internal.enabled=true`, directorios adicionales de hooks y controladores heredados activan el descubrimiento amplio.

### Paquetes de hooks

Los paquetes de hooks son paquetes npm que exportan hooks mediante `openclaw.hooks` en `package.json`. Instálalos con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones npm son solo de registro (nombre del paquete + versión exacta opcional o dist-tag). Se rechazan las especificaciones Git/URL/file y los rangos semver.

## Hooks integrados

| Hook                  | Eventos                         | Qué hace                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Guarda el contexto de la sesión en `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Inyecta archivos bootstrap adicionales desde patrones glob |
| command-logger        | `command`                      | Registra todos los comandos en `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Ejecuta `BOOT.md` cuando se inicia el gateway         |

Habilita cualquier hook integrado:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalles de session-memory

Extrae los últimos 15 mensajes del usuario/asistente, genera un slug descriptivo de nombre de archivo mediante LLM y lo guarda en `<workspace>/memory/YYYY-MM-DD-slug.md`. Requiere que `workspace.dir` esté configurado.

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

Las rutas se resuelven en relación con el espacio de trabajo. Solo se cargan nombres base bootstrap reconocidos (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalles de command-logger

Registra cada comando con barra en `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detalles de boot-md

Ejecuta `BOOT.md` desde el espacio de trabajo activo cuando se inicia el gateway.

## Hooks de plugins

Los plugins pueden registrar hooks mediante el Plugin SDK para una integración más profunda: interceptar llamadas a herramientas, modificar prompts, controlar el flujo de mensajes y más. El Plugin SDK expone 28 hooks que cubren resolución de modelos, ciclo de vida del agente, flujo de mensajes, ejecución de herramientas, coordinación de subagentes y ciclo de vida del Gateway.

Para consultar la referencia completa de hooks de plugins, incluidos `before_tool_call`, `before_agent_reply`, `before_install` y todos los demás hooks de plugins, consulta [Plugin Architecture](/es/plugins/architecture#provider-runtime-hooks).

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
El formato de configuración heredado de array `hooks.internal.handlers` todavía es compatible por retrocompatibilidad, pero los hooks nuevos deben usar el sistema basado en descubrimiento.
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

## Buenas prácticas

- **Mantén los controladores rápidos.** Los hooks se ejecutan durante el procesamiento de comandos. Ejecuta trabajo pesado en segundo plano con `void processInBackground(event)`.
- **Maneja los errores con elegancia.** Envuelve operaciones riesgosas en try/catch; no lances errores para que otros controladores puedan ejecutarse.
- **Filtra eventos pronto.** Devuelve inmediatamente si el tipo/acción del evento no es relevante.
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

Verifica si faltan binarios (PATH), variables de entorno, valores de configuración o compatibilidad de SO.

### Hook no se ejecuta

1. Verifica que el hook esté habilitado: `openclaw hooks list`
2. Reinicia tu proceso del gateway para que los hooks se recarguen.
3. Revisa los logs del gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [Referencia de CLI: hooks](/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Plugin Architecture](/es/plugins/architecture#provider-runtime-hooks) — referencia completa de hooks de plugins
- [Configuración](/es/gateway/configuration-reference#hooks)
