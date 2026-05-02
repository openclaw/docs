---
read_when:
    - Quieres automatización basada en eventos para /new, /reset, /stop y eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar ganchos
summary: 'Hooks: automatización basada en eventos para comandos y eventos del ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-05-02T20:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Los ganchos son scripts pequeños que se ejecutan cuando ocurre algo dentro del Gateway. Se pueden detectar desde directorios e inspeccionar con `openclaw hooks`. El Gateway carga los ganchos internos solo después de habilitar ganchos o configurar al menos una entrada de gancho, un paquete de ganchos, un controlador heredado o un directorio de ganchos adicional.

Hay dos tipos de ganchos en OpenClaw:

- **Ganchos internos** (esta página): se ejecutan dentro del Gateway cuando se activan eventos de agente, como `/new`, `/reset`, `/stop` o eventos de ciclo de vida.
- **Webhooks**: puntos de conexión HTTP externos que permiten que otros sistemas activen trabajo en OpenClaw. Consulta [Webhooks](/es/automation/cron-jobs#webhooks).

Los ganchos también pueden estar incluidos dentro de Plugins. `openclaw hooks list` muestra tanto ganchos independientes como ganchos administrados por Plugins.

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

| Evento                   | Cuándo se activa                                          |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Se emitió el comando `/new`                               |
| `command:reset`          | Se emitió el comando `/reset`                             |
| `command:stop`           | Se emitió el comando `/stop`                              |
| `command`                | Cualquier evento de comando (escucha general)             |
| `session:compact:before` | Antes de que Compaction resuma el historial               |
| `session:compact:after`  | Después de que Compaction se complete                     |
| `session:patch`          | Cuando se modifican las propiedades de sesión             |
| `agent:bootstrap`        | Antes de inyectar archivos de arranque del espacio de trabajo |
| `gateway:startup`        | Después de que los canales se inicien y los ganchos se carguen |
| `gateway:shutdown`       | Cuando comienza el apagado del Gateway                    |
| `gateway:pre-restart`    | Antes de un reinicio esperado del Gateway                 |
| `message:received`       | Mensaje entrante desde cualquier canal                    |
| `message:transcribed`    | Después de que se complete la transcripción de audio      |
| `message:preprocessed`   | Después de que el preprocesamiento de medios y enlaces se complete o se omita |
| `message:sent`           | Mensaje saliente entregado                                |

## Escribir ganchos

### Estructura del gancho

Cada gancho es un directorio que contiene dos archivos:

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
| `events`   | Arreglo de eventos que escuchar                      |
| `export`   | Exportación con nombre que usar (el valor predeterminado es `"default"`) |
| `os`       | Plataformas requeridas (por ejemplo, `["darwin", "linux"]`) |
| `requires` | Rutas requeridas de `bins`, `anyBins`, `env` o `config` |
| `always`   | Omitir las comprobaciones de elegibilidad (booleano) |
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

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` (inserta para enviar al usuario) y `context` (datos específicos del evento). Los contextos de ganchos de Plugins de agente y herramienta también pueden incluir `trace`, un contexto de traza de diagnóstico de solo lectura compatible con W3C que los Plugins pueden pasar a registros estructurados para correlación de OTEL.

### Aspectos destacados del contexto de eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName`, `guildId`). `context.content` prefiere un cuerpo de comando no vacío para mensajes similares a comandos, luego recurre al cuerpo entrante sin procesar y al cuerpo genérico; no incluye enriquecimiento exclusivo del agente, como historial del hilo o resúmenes de enlaces.

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de arranque** (`agent:bootstrap`): `context.bootstrapFiles` (arreglo mutable), `context.agentId`.

**Eventos de parche de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo los campos modificados), `context.cfg`. Solo los clientes con privilegios pueden activar eventos de parche.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount`, `tokenCount`. `session:compact:after` agrega `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa cuando el usuario emite `/stop`; corresponde al ciclo de vida de cancelación/comando, no a una puerta de finalización del agente. Los Plugins que necesiten inspeccionar una respuesta final natural y pedir al agente una pasada más deben usar en su lugar el gancho tipado de Plugin `before_agent_finalize`. Consulta [ganchos de Plugin](/es/plugins/hooks).

**Eventos de ciclo de vida del Gateway**: `gateway:shutdown` incluye `reason` y `restartExpectedMs`, y se activa cuando comienza el apagado del Gateway. `gateway:pre-restart` incluye el mismo contexto, pero solo se activa cuando el apagado forma parte de un reinicio esperado y se proporciona un valor finito de `restartExpectedMs`. Durante el apagado, cada espera de gancho de ciclo de vida es de mejor esfuerzo y acotada, por lo que el apagado continúa si un controlador se bloquea.

## Detección de ganchos

Los ganchos se detectan desde estos directorios, en orden de precedencia de sobrescritura creciente:

1. **Ganchos incluidos**: distribuidos con OpenClaw
2. **Ganchos de Plugin**: ganchos incluidos dentro de Plugins instalados
3. **Ganchos administrados**: `~/.openclaw/hooks/` (instalados por el usuario, compartidos entre espacios de trabajo). Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta precedencia.
4. **Ganchos del espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados de forma predeterminada hasta que se habiliten explícitamente)

Los ganchos del espacio de trabajo pueden agregar nombres de gancho nuevos, pero no pueden sobrescribir ganchos incluidos, administrados o proporcionados por Plugins con el mismo nombre.

El Gateway omite la detección de ganchos internos al iniciar hasta que se configuren los ganchos internos. Habilita un gancho incluido o administrado con `openclaw hooks enable <name>`, instala un paquete de ganchos o establece `hooks.internal.enabled=true` para habilitarlos. Cuando habilitas un gancho con nombre, el Gateway carga solo el controlador de ese gancho; `hooks.internal.enabled=true`, los directorios de ganchos adicionales y los controladores heredados habilitan la detección amplia.

### Paquetes de ganchos

Los paquetes de ganchos son paquetes de npm que exportan ganchos mediante `openclaw.hooks` en `package.json`. Instala con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones de Npm son solo de registro (nombre de paquete + versión exacta opcional o dist-tag). Se rechazan las especificaciones Git/URL/file y los rangos semver.

## Hooks incluidos

| Hook                  | Eventos                        | Qué hace                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Guarda el contexto de sesión en `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Inyecta archivos de bootstrap adicionales desde patrones glob |
| command-logger        | `command`                      | Registra todos los comandos en `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Ejecuta `BOOT.md` cuando se inicia el Gateway         |

Habilita cualquier hook incluido:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalles de session-memory

Extrae los últimos 15 mensajes de usuario/asistente, genera un slug descriptivo para el nombre de archivo mediante LLM y lo guarda en `<workspace>/memory/YYYY-MM-DD-slug.md` usando la fecha local del host. Requiere que `workspace.dir` esté configurado.

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

Las rutas se resuelven en relación con el espacio de trabajo. Solo se cargan los nombres base de bootstrap reconocidos (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalles de command-logger

Registra cada comando de barra en `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detalles de boot-md

Ejecuta `BOOT.md` desde el espacio de trabajo activo cuando se inicia el Gateway.

## Hooks de Plugin

Los Plugins pueden registrar hooks tipados a través del SDK de Plugin para una integración más profunda:
interceptar llamadas de herramientas, modificar prompts, controlar el flujo de mensajes y más.
Usa hooks de Plugin cuando necesites `before_tool_call`, `before_agent_reply`,
`before_install` u otros hooks de ciclo de vida en proceso.

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
El formato heredado de configuración de arreglo `hooks.internal.handlers` aún se admite por compatibilidad con versiones anteriores, pero los hooks nuevos deben usar el sistema basado en descubrimiento.
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

- **Mantén los handlers rápidos.** Los hooks se ejecutan durante el procesamiento de comandos. Ejecuta el trabajo pesado en segundo plano sin esperar con `void processInBackground(event)`.
- **Maneja los errores con elegancia.** Envuelve las operaciones riesgosas en try/catch; no lances excepciones para que otros handlers puedan ejecutarse.
- **Filtra los eventos temprano.** Devuelve inmediatamente si el tipo/acción del evento no es relevante.
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
2. Reinicia el proceso del Gateway para que los hooks se recarguen.
3. Comprueba los registros del Gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [Referencia de CLI: hooks](/es/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/es/plugins/hooks) — hooks del ciclo de vida de Plugin en proceso
- [Configuración](/es/gateway/configuration-reference#hooks)
