---
read_when:
    - Quieres automatización impulsada por eventos para `/new`, `/reset`, `/stop` y eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar hooks
summary: 'Hooks: automatización impulsada por eventos para comandos y eventos del ciclo de vida'
title: Hooks
x-i18n:
    generated_at: "2026-04-24T08:57:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6246f25272208d9a9ff2f186bcd3a463c78ea24b833f0259174d0f7f0cbea6
    source_path: automation/hooks.md
    workflow: 15
---

Los Hooks son scripts pequeños que se ejecutan cuando ocurre algo dentro del Gateway. Pueden descubrirse desde directorios e inspeccionarse con `openclaw hooks`. El Gateway carga Hooks internos solo después de que habilites Hooks o configures al menos una entrada de hook, un paquete de Hooks, un manejador heredado o un directorio de Hooks adicional.

Hay dos tipos de Hooks en OpenClaw:

- **Hooks internos** (esta página): se ejecutan dentro del Gateway cuando se activan eventos del agente, como `/new`, `/reset`, `/stop` o eventos del ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permiten que otros sistemas activen trabajo en OpenClaw. Consulta [Webhooks](/es/automation/cron-jobs#webhooks).

Los Hooks también pueden incluirse dentro de Plugins. `openclaw hooks list` muestra tanto Hooks independientes como Hooks administrados por Plugins.

## Inicio rápido

```bash
# Listar Hooks disponibles
openclaw hooks list

# Habilitar un Hook
openclaw hooks enable session-memory

# Comprobar el estado de los Hooks
openclaw hooks check

# Obtener información detallada
openclaw hooks info session-memory
```

## Tipos de eventos

| Evento                   | Cuándo se activa                                |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Se emite el comando `/new`                      |
| `command:reset`          | Se emite el comando `/reset`                    |
| `command:stop`           | Se emite el comando `/stop`                     |
| `command`                | Cualquier evento de comando (listener general)  |
| `session:compact:before` | Antes de que Compaction resuma el historial     |
| `session:compact:after`  | Después de que Compaction finaliza              |
| `session:patch`          | Cuando se modifican propiedades de la sesión    |
| `agent:bootstrap`        | Antes de inyectar archivos bootstrap al espacio de trabajo |
| `gateway:startup`        | Después de que los canales inician y se cargan los Hooks |
| `message:received`       | Mensaje entrante desde cualquier canal          |
| `message:transcribed`    | Después de que finaliza la transcripción de audio |
| `message:preprocessed`   | Después de completar todo el procesamiento de medios y comprensión de enlaces |
| `message:sent`           | Mensaje saliente entregado                      |

## Escribir Hooks

### Estructura de un Hook

Cada Hook es un directorio que contiene dos archivos:

```
my-hook/
├── HOOK.md          # Metadatos + documentación
└── handler.ts       # Implementación del manejador
```

### Formato de HOOK.md

```markdown
---
name: my-hook
description: "Breve descripción de lo que hace este hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

La documentación detallada va aquí.
```

**Campos de metadatos** (`metadata.openclaw`):

| Campo      | Descripción                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji mostrado para la CLI                           |
| `events`   | Array de eventos que se deben escuchar               |
| `export`   | Exportación con nombre que se usará (por defecto `"default"`) |
| `os`       | Plataformas requeridas (p. ej., `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` o rutas de `config` requeridos |
| `always`   | Omite las comprobaciones de elegibilidad (booleano)  |
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

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` (haz `push` para enviar al usuario) y `context` (datos específicos del evento). Los contextos de Hooks de Plugins de agente y herramientas también pueden incluir `trace`, un contexto de rastreo de diagnóstico compatible con W3C y de solo lectura que los Plugins pueden pasar a logs estructurados para correlación OTEL.

### Puntos destacados del contexto de eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName`, `guildId`).

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo final enriquecido), `context.from`, `context.channelId`.

**Eventos bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutable), `context.agentId`.

**Eventos de parche de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campos modificados), `context.cfg`. Solo los clientes con privilegios pueden activar eventos de parche.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount`, `tokenCount`. `session:compact:after` agrega `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Descubrimiento de Hooks

Los Hooks se descubren desde estos directorios, en orden de precedencia de sobrescritura creciente:

1. **Hooks incluidos**: enviados con OpenClaw
2. **Hooks de Plugins**: Hooks incluidos dentro de Plugins instalados
3. **Hooks administrados**: `~/.openclaw/hooks/` (instalados por el usuario, compartidos entre espacios de trabajo). Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta precedencia.
4. **Hooks del espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados por defecto hasta que se habilitan explícitamente)

Los Hooks del espacio de trabajo pueden agregar nuevos nombres de Hook, pero no pueden sobrescribir Hooks incluidos, administrados o proporcionados por Plugins con el mismo nombre.

El Gateway omite el descubrimiento de Hooks internos al iniciar hasta que los Hooks internos estén configurados. Habilita un Hook incluido o administrado con `openclaw hooks enable <name>`, instala un paquete de Hooks o establece `hooks.internal.enabled=true` para optar por ello. Cuando habilitas un Hook con nombre, el Gateway carga solo el manejador de ese Hook; `hooks.internal.enabled=true`, los directorios de Hooks adicionales y los manejadores heredados habilitan el descubrimiento amplio.

### Paquetes de Hooks

Los paquetes de Hooks son paquetes npm que exportan Hooks mediante `openclaw.hooks` en `package.json`. Instálalos con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones npm son solo de registro (nombre del paquete + versión exacta opcional o dist-tag). Se rechazan las especificaciones Git/URL/archivo y los rangos semver.

## Hooks incluidos

| Hook                  | Eventos                        | Qué hace                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Guarda el contexto de la sesión en `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Inyecta archivos bootstrap adicionales desde patrones glob |
| command-logger        | `command`                      | Registra todos los comandos en `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Ejecuta `BOOT.md` cuando el gateway inicia            |

Habilita cualquier Hook incluido:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalles de session-memory

Extrae los últimos 15 mensajes de usuario/asistente, genera un slug descriptivo para el nombre de archivo mediante LLM y lo guarda en `<workspace>/memory/YYYY-MM-DD-slug.md`. Requiere que `workspace.dir` esté configurado.

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

Las rutas se resuelven en relación con el espacio de trabajo. Solo se cargan los nombres base bootstrap reconocidos (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalles de command-logger

Registra cada comando con barra en `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detalles de boot-md

Ejecuta `BOOT.md` desde el espacio de trabajo activo cuando el gateway inicia.

## Hooks de Plugins

Los Plugins pueden registrar Hooks mediante el SDK de Plugin para una integración más profunda: interceptar llamadas a herramientas, modificar prompts, controlar el flujo de mensajes y más. El SDK de Plugin expone 28 Hooks que cubren resolución de modelos, ciclo de vida del agente, flujo de mensajes, ejecución de herramientas, coordinación de subagentes y ciclo de vida del gateway.

Para la referencia completa de Hooks de Plugins, incluidos `before_tool_call`, `before_agent_reply`, `before_install` y todos los demás Hooks de Plugins, consulta [Plugin Architecture](/es/plugins/architecture-internals#provider-runtime-hooks).

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

Variables de entorno por Hook:

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

Directorios de Hooks adicionales:

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
El formato heredado de configuración de array `hooks.internal.handlers` todavía es compatible por retrocompatibilidad, pero los Hooks nuevos deben usar el sistema basado en descubrimiento.
</Note>

## Referencia de la CLI

```bash
# Listar todos los Hooks (agrega --eligible, --verbose o --json)
openclaw hooks list

# Mostrar información detallada sobre un Hook
openclaw hooks info <hook-name>

# Mostrar resumen de elegibilidad
openclaw hooks check

# Habilitar/deshabilitar
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Buenas prácticas

- **Mantén los manejadores rápidos.** Los Hooks se ejecutan durante el procesamiento de comandos. Lanza trabajo pesado en segundo plano con `void processInBackground(event)`.
- **Maneja los errores con elegancia.** Envuelve operaciones riesgosas en try/catch; no lances excepciones para que otros manejadores puedan ejecutarse.
- **Filtra eventos pronto.** Devuelve inmediatamente si el tipo/acción del evento no es relevante.
- **Usa claves de evento específicas.** Prefiere `"events": ["command:new"]` sobre `"events": ["command"]` para reducir la sobrecarga.

## Solución de problemas

### Hook no descubierto

```bash
# Verificar la estructura del directorio
ls -la ~/.openclaw/hooks/my-hook/
# Debería mostrar: HOOK.md, handler.ts

# Listar todos los Hooks descubiertos
openclaw hooks list
```

### Hook no elegible

```bash
openclaw hooks info my-hook
```

Comprueba si faltan binarios (PATH), variables de entorno, valores de configuración o compatibilidad con el SO.

### Hook no se ejecuta

1. Verifica que el Hook esté habilitado: `openclaw hooks list`
2. Reinicia tu proceso de gateway para que los Hooks se recarguen.
3. Revisa los logs del gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [Referencia de la CLI: hooks](/es/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Plugin Architecture](/es/plugins/architecture-internals#provider-runtime-hooks) — referencia completa de Hooks de Plugins
- [Configuration](/es/gateway/configuration-reference#hooks)
