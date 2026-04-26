---
read_when:
    - Quieres automatización impulsada por eventos para /new, /reset, /stop y eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar hooks
summary: 'Hooks: automatización impulsada por eventos para comandos y eventos del ciclo de vida'
title: Hooks
x-i18n:
    generated_at: "2026-04-26T11:23:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf40a64449347ef750b4b0e0a83b80e2e8fdef87d92daa71f028d2bf6a3d3d22
    source_path: automation/hooks.md
    workflow: 15
---

Los Hooks son pequeños scripts que se ejecutan cuando algo ocurre dentro del Gateway. Se pueden detectar desde directorios e inspeccionar con `openclaw hooks`. El Gateway carga los hooks internos solo después de que habilites los hooks o configures al menos una entrada de hook, hook pack, controlador heredado o directorio adicional de hooks.

Hay dos tipos de hooks en OpenClaw:

- **Hooks internos** (esta página): se ejecutan dentro del Gateway cuando se disparan eventos del agente, como `/new`, `/reset`, `/stop` o eventos del ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permiten que otros sistemas desencadenen trabajo en OpenClaw. Consulta [Webhooks](/es/automation/cron-jobs#webhooks).

Los hooks también se pueden incluir dentro de plugins. `openclaw hooks list` muestra tanto hooks independientes como hooks gestionados por plugins.

## Inicio rápido

```bash
# Listar hooks disponibles
openclaw hooks list

# Habilitar un hook
openclaw hooks enable session-memory

# Comprobar el estado del hook
openclaw hooks check

# Obtener información detallada
openclaw hooks info session-memory
```

## Tipos de eventos

| Evento                   | Cuándo se dispara                               |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Se emite el comando `/new`                      |
| `command:reset`          | Se emite el comando `/reset`                    |
| `command:stop`           | Se emite el comando `/stop`                     |
| `command`                | Cualquier evento de comando (escucha general)   |
| `session:compact:before` | Antes de que Compaction resuma el historial     |
| `session:compact:after`  | Después de que Compaction se complete           |
| `session:patch`          | Cuando se modifican propiedades de la sesión    |
| `agent:bootstrap`        | Antes de que se inyecten los archivos bootstrap del espacio de trabajo |
| `gateway:startup`        | Después de que se inician los canales y se cargan los hooks |
| `message:received`       | Mensaje entrante desde cualquier canal          |
| `message:transcribed`    | Después de que se complete la transcripción de audio |
| `message:preprocessed`   | Después de que se complete todo el procesamiento de medios y enlaces |
| `message:sent`           | Mensaje saliente entregado                      |

## Escritura de hooks

### Estructura de un hook

Cada hook es un directorio que contiene dos archivos:

```
my-hook/
├── HOOK.md          # Metadatos + documentación
└── handler.ts       # Implementación del controlador
```

### Formato de HOOK.md

```markdown
---
name: my-hook
description: "Descripción breve de lo que hace este hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Mi Hook

La documentación detallada va aquí.
```

**Campos de metadatos** (`metadata.openclaw`):

| Campo      | Descripción                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji mostrado para la CLI                           |
| `events`   | Array de eventos que se deben escuchar               |
| `export`   | Exportación con nombre que se debe usar (por defecto `"default"`) |
| `os`       | Plataformas requeridas (por ejemplo, `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` o rutas de `config` requeridos |
| `always`   | Omitir comprobaciones de elegibilidad (booleano)     |
| `install`  | Métodos de instalación                               |

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

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` (haz push para enviar al usuario) y `context` (datos específicos del evento). Los contextos de hooks de plugin de agente y herramientas también pueden incluir `trace`, un contexto de rastreo de diagnóstico compatible con W3C y de solo lectura que los plugins pueden pasar a logs estructurados para correlación OTEL.

### Aspectos destacados del contexto de eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName`, `guildId`).

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo final enriquecido), `context.from`, `context.channelId`.

**Eventos de bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutable), `context.agentId`.

**Eventos de parche de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campos modificados), `context.cfg`. Solo los clientes con privilegios pueden activar eventos de parche.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount`, `tokenCount`. `session:compact:after` añade `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa cuando el usuario emite `/stop`; es parte del ciclo de vida de cancelación/comando, no una compuerta de finalización del agente. Los plugins que necesiten inspeccionar una respuesta final natural y pedir al agente una pasada más deben usar en su lugar el hook tipado de plugin `before_agent_finalize`. Consulta [Plugin hooks](/es/plugins/hooks).

## Detección de hooks

Los hooks se detectan desde estos directorios, en orden de precedencia creciente para sobrescritura:

1. **Hooks incluidos**: distribuidos con OpenClaw
2. **Hooks de plugins**: hooks incluidos dentro de plugins instalados
3. **Hooks gestionados**: `~/.openclaw/hooks/` (instalados por el usuario, compartidos entre espacios de trabajo). Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta precedencia.
4. **Hooks del espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados por defecto hasta que se habilitan explícitamente)

Los hooks del espacio de trabajo pueden añadir nombres de hooks nuevos, pero no pueden sobrescribir hooks incluidos, gestionados o proporcionados por plugins con el mismo nombre.

El Gateway omite la detección de hooks internos al iniciarse hasta que los hooks internos estén configurados. Habilita un hook incluido o gestionado con `openclaw hooks enable <name>`, instala un hook pack o establece `hooks.internal.enabled=true` para habilitarlo. Cuando habilitas un hook con nombre, el Gateway carga solo el controlador de ese hook; `hooks.internal.enabled=true`, los directorios adicionales de hooks y los controladores heredados habilitan la detección amplia.

### Hook packs

Los hook packs son paquetes npm que exportan hooks mediante `openclaw.hooks` en `package.json`. Instálalos con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones npm son solo del registro (nombre del paquete + versión exacta opcional o dist-tag). Se rechazan las especificaciones Git/URL/archivo y los rangos semver.

## Hooks incluidos

| Hook                  | Eventos                        | Qué hace                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Guarda el contexto de la sesión en `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Inyecta archivos bootstrap adicionales desde patrones glob |
| command-logger        | `command`                      | Registra todos los comandos en `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Ejecuta `BOOT.md` cuando se inicia el gateway         |

Habilita cualquier hook incluido:

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

Las rutas se resuelven en relación con el espacio de trabajo. Solo se cargan nombres base bootstrap reconocidos (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalles de command-logger

Registra cada comando con barra inclinada en `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detalles de boot-md

Ejecuta `BOOT.md` desde el espacio de trabajo activo cuando se inicia el gateway.

## Hooks de plugins

Los plugins pueden registrar hooks tipados a través del SDK de Plugin para una integración más profunda:
interceptar llamadas a herramientas, modificar prompts, controlar el flujo de mensajes y más.
Usa hooks de plugin cuando necesites `before_tool_call`, `before_agent_reply`,
`before_install` u otros hooks del ciclo de vida en proceso.

Para la referencia completa de hooks de plugins, consulta [Plugin hooks](/es/plugins/hooks).

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
El formato heredado de configuración de array `hooks.internal.handlers` sigue siendo compatible por compatibilidad con versiones anteriores, pero los hooks nuevos deben usar el sistema basado en detección.
</Note>

## Referencia de la CLI

```bash
# Listar todos los hooks (añade --eligible, --verbose o --json)
openclaw hooks list

# Mostrar información detallada sobre un hook
openclaw hooks info <hook-name>

# Mostrar resumen de elegibilidad
openclaw hooks check

# Habilitar/deshabilitar
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Buenas prácticas

- **Mantén los controladores rápidos.** Los hooks se ejecutan durante el procesamiento de comandos. Lanza trabajo pesado en segundo plano con `void processInBackground(event)`.
- **Gestiona los errores con elegancia.** Envuelve las operaciones arriesgadas en try/catch; no lances errores para que otros controladores puedan ejecutarse.
- **Filtra los eventos pronto.** Devuelve inmediatamente si el tipo/acción del evento no es relevante.
- **Usa claves de evento específicas.** Prefiere `"events": ["command:new"]` en lugar de `"events": ["command"]` para reducir la sobrecarga.

## Solución de problemas

### Hook no detectado

```bash
# Verificar la estructura del directorio
ls -la ~/.openclaw/hooks/my-hook/
# Debe mostrar: HOOK.md, handler.ts

# Listar todos los hooks detectados
openclaw hooks list
```

### Hook no elegible

```bash
openclaw hooks info my-hook
```

Comprueba si faltan binarios (PATH), variables de entorno, valores de configuración o compatibilidad con el sistema operativo.

### Hook no se ejecuta

1. Verifica que el hook esté habilitado: `openclaw hooks list`
2. Reinicia tu proceso de gateway para que los hooks se recarguen.
3. Revisa los logs del gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [CLI Reference: hooks](/es/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Plugin hooks](/es/plugins/hooks) — hooks del ciclo de vida del plugin en proceso
- [Configuration](/es/gateway/configuration-reference#hooks)
