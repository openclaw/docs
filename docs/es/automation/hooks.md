---
read_when:
    - Desea automatización basada en eventos para /new, /reset, /stop y los eventos del ciclo de vida del agente
    - Quieres crear, instalar o depurar ganchos
summary: 'Ganchos: automatización basada en eventos para comandos y eventos de ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-05-05T08:25:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Los ganchos son scripts pequeños que se ejecutan cuando ocurre algo dentro del Gateway. Pueden descubrirse desde directorios e inspeccionarse con `openclaw hooks`. El Gateway carga los ganchos internos solo después de que habilitas los ganchos o configuras al menos una entrada de gancho, un paquete de ganchos, un manejador heredado o un directorio de ganchos adicional.

Hay dos tipos de ganchos en OpenClaw:

- **Ganchos internos** (esta página): se ejecutan dentro del Gateway cuando se disparan eventos de agente, como `/new`, `/reset`, `/stop` o eventos de ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permiten que otros sistemas activen trabajo en OpenClaw. Consulta [Webhooks](/es/automation/cron-jobs#webhooks).

Los ganchos también pueden incluirse dentro de plugins. `openclaw hooks list` muestra tanto ganchos independientes como ganchos administrados por plugins.

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
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Se emitió el comando `/new`                                |
| `command:reset`          | Se emitió el comando `/reset`                              |
| `command:stop`           | Se emitió el comando `/stop`                               |
| `command`                | Cualquier evento de comando (oyente general)               |
| `session:compact:before` | Antes de que la Compaction resuma el historial             |
| `session:compact:after`  | Después de que finaliza la Compaction                      |
| `session:patch`          | Cuando se modifican las propiedades de la sesión           |
| `agent:bootstrap`        | Antes de que se inyecten los archivos de arranque del espacio de trabajo |
| `gateway:startup`        | Después de que los canales se inician y los ganchos se cargan |
| `gateway:shutdown`       | Cuando comienza el apagado del gateway                     |
| `gateway:pre-restart`    | Antes de un reinicio previsto del gateway                  |
| `message:received`       | Mensaje entrante desde cualquier canal                     |
| `message:transcribed`    | Después de que finaliza la transcripción de audio          |
| `message:preprocessed`   | Después de que finaliza o se omite el preprocesamiento de medios y enlaces |
| `message:sent`           | Mensaje saliente entregado                                 |

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
| `emoji`    | Emoji de visualización para la CLI                   |
| `events`   | Arreglo de eventos que se deben escuchar             |
| `export`   | Exportación con nombre que se debe usar (predeterminado: `"default"`) |
| `os`       | Plataformas requeridas (por ejemplo, `["darwin", "linux"]`) |
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

Cada evento incluye: `type`, `action`, `sessionKey`, `timestamp`, `messages` (agrega elementos para enviar al usuario) y `context` (datos específicos del evento). Los contextos de ganchos de plugins de agente y herramienta también pueden incluir `trace`, un contexto de traza diagnóstica de solo lectura compatible con W3C que los plugins pueden pasar a registros estructurados para correlación OTEL.

### Aspectos destacados del contexto de eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensaje** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (datos específicos del proveedor, incluidos `senderId`, `senderName`, `guildId`). `context.content` prefiere un cuerpo de comando no vacío para mensajes similares a comandos; luego recurre al cuerpo entrante sin procesar y al cuerpo genérico; no incluye enriquecimiento exclusivo del agente, como historial del hilo o resúmenes de enlaces.

**Eventos de mensaje** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensaje** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensaje** (`message:preprocessed`): `context.bodyForAgent` (cuerpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de arranque** (`agent:bootstrap`): `context.bootstrapFiles` (arreglo mutable), `context.agentId`.

**Eventos de parche de sesión** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campos modificados), `context.cfg`. Solo los clientes con privilegios pueden activar eventos de parche.

**Eventos de Compaction**: `session:compact:before` incluye `messageCount`, `tokenCount`. `session:compact:after` agrega `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa cuando el usuario emite `/stop`; pertenece al ciclo de vida de cancelación/comando, no es una puerta de finalización del agente. Los plugins que necesitan inspeccionar una respuesta final natural y pedir al agente una pasada más deben usar en su lugar el gancho de plugin tipado `before_agent_finalize`. Consulta [Ganchos de plugins](/es/plugins/hooks).

**Eventos de ciclo de vida del Gateway**: `gateway:shutdown` incluye `reason` y `restartExpectedMs`, y se dispara cuando comienza el apagado del gateway. `gateway:pre-restart` incluye el mismo contexto, pero solo se dispara cuando el apagado forma parte de un reinicio previsto y se proporciona un valor finito de `restartExpectedMs`. Durante el apagado, cada espera de gancho de ciclo de vida se realiza con el máximo esfuerzo y con límite, de modo que el apagado continúa si un manejador se bloquea.

## Descubrimiento de ganchos

Los ganchos se descubren desde estos directorios, en orden de precedencia de sobrescritura creciente:

1. **Ganchos incluidos**: enviados con OpenClaw
2. **Ganchos de plugins**: ganchos incluidos dentro de plugins instalados
3. **Ganchos administrados**: `~/.openclaw/hooks/` (instalados por el usuario, compartidos entre espacios de trabajo). Los directorios adicionales de `hooks.internal.load.extraDirs` comparten esta precedencia.
4. **Ganchos del espacio de trabajo**: `<workspace>/hooks/` (por agente, deshabilitados de forma predeterminada hasta que se habiliten explícitamente)

Los ganchos del espacio de trabajo pueden agregar nombres de gancho nuevos, pero no pueden sobrescribir ganchos incluidos, administrados o proporcionados por plugins con el mismo nombre.

El Gateway omite el descubrimiento de ganchos internos al iniciar hasta que los ganchos internos estén configurados. Habilita un gancho incluido o administrado con `openclaw hooks enable <name>`, instala un paquete de ganchos o define `hooks.internal.enabled=true` para activarlo. Cuando habilitas un gancho con nombre, el Gateway carga solo el manejador de ese gancho; `hooks.internal.enabled=true`, los directorios de ganchos adicionales y los manejadores heredados activan el descubrimiento amplio.

### Paquetes de ganchos

Los paquetes de hooks son paquetes npm que exportan hooks mediante `openclaw.hooks` en `package.json`. Instálalos con:

```bash
openclaw plugins install <path-or-spec>
```

Las especificaciones de npm son solo de registro (nombre del paquete + versión exacta opcional o dist-tag). Se rechazan las especificaciones Git/URL/archivo y los rangos semver.

## Hooks incluidos

| Hook                  | Eventos                                           | Qué hace                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Guarda el contexto de la sesión en `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inyecta archivos de arranque adicionales desde patrones glob   |
| command-logger        | `command`                                         | Registra todos los comandos en `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envía avisos de chat visibles cuando empieza/termina la compactación de la sesión |
| boot-md               | `gateway:startup`                                 | Ejecuta `BOOT.md` cuando se inicia el gateway                  |

Habilita cualquier hook incluido:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalles de session-memory

Extrae los últimos 15 mensajes de usuario/asistente y los guarda en `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando la fecha local del host. La captura de memoria se ejecuta en segundo plano para que las confirmaciones de `/new` y `/reset` no se retrasen por lecturas de transcripción ni por la generación opcional de slugs. Configura `hooks.internal.entries.session-memory.llmSlug: true` para generar slugs descriptivos de nombres de archivo con el modelo configurado. Requiere que `workspace.dir` esté configurado.

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

Las rutas se resuelven en relación con el espacio de trabajo. Solo se cargan los nombres base de arranque reconocidos (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalles de command-logger

Registra cada comando slash en `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalles de compaction-notifier

Envía mensajes de estado breves a la conversación actual cuando OpenClaw empieza y termina de compactar la transcripción de la sesión. Esto hace que los turnos largos sean menos confusos en superficies de chat porque el usuario puede ver que el asistente está resumiendo el contexto y continuará después de la Compaction.

<a id="boot-md"></a>

### Detalles de boot-md

Ejecuta `BOOT.md` desde el espacio de trabajo activo cuando se inicia el gateway.

## Hooks de Plugin

Los plugins pueden registrar hooks tipados mediante el Plugin SDK para una integración más profunda:
interceptar llamadas a herramientas, modificar prompts, controlar el flujo de mensajes y más.
Usa hooks de plugin cuando necesites `before_tool_call`, `before_agent_reply`,
`before_install` u otros hooks de ciclo de vida en proceso.

Para consultar la referencia completa de hooks de plugin, consulta [Hooks de Plugin](/es/plugins/hooks).

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
El formato de configuración heredado del array `hooks.internal.handlers` sigue siendo compatible por compatibilidad con versiones anteriores, pero los nuevos hooks deberían usar el sistema basado en descubrimiento.
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

- **Mantén los controladores rápidos.** Los ganchos se ejecutan durante el procesamiento de comandos. Lanza el trabajo pesado sin esperar su resultado con `void processInBackground(event)`.
- **Gestiona los errores con elegancia.** Envuelve las operaciones riesgosas en try/catch; no lances excepciones para que otros controladores puedan ejecutarse.
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
2. Reinicia tu proceso de gateway para que los ganchos se recarguen.
3. Comprueba los registros del gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [Referencia de CLI: ganchos](/es/cli/hooks)
- [Webhooks](/es/automation/cron-jobs#webhooks)
- [Ganchos de Plugin](/es/plugins/hooks) — ganchos de ciclo de vida de plugin en proceso
- [Configuración](/es/gateway/configuration-reference#hooks)
