---
read_when:
    - Instalar o configurar el harness acpx para Claude Code / Codex / Gemini CLI
    - Habilitar el puente MCP plugin-tools u OpenClaw-tools
    - Configuración de los modos de permiso de ACP
summary: 'Configuración de agentes ACP: configuración del arnés acpx, configuración de Plugin, permisos'
title: Agentes ACP — configuración
x-i18n:
    generated_at: "2026-06-27T12:59:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para la visión general, el runbook del operador y los conceptos, consulta [agentes ACP](/es/tools/acp-agents).

Las secciones siguientes cubren la configuración del arnés acpx, la configuración del Plugin para los puentes MCP y la configuración de permisos.

Usa esta página solo cuando estés configurando la ruta ACP/acpx. Para la configuración del runtime nativo del servidor de aplicación de Codex, usa [arnés de Codex](/es/plugins/codex-harness). Para claves de API de OpenAI o configuración del proveedor de modelos de OAuth de Codex, usa
[OpenAI](/es/providers/openai).

Codex tiene dos rutas de OpenClaw:

| Ruta                       | Configuración/comando                                   | Página de configuración                 |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Servidor de aplicación nativo de Codex | `/codex ...`, refs de agente `openai/gpt-*`                | [arnés de Codex](/es/plugins/codex-harness) |
| Adaptador ACP explícito de Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                             |

Prefiere la ruta nativa a menos que necesites explícitamente el comportamiento ACP/acpx.

## Compatibilidad del arnés acpx (actual)

Alias actuales del arnés integrado de acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (CLI de Cursor: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `qwen`

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId` a menos que tu configuración de acpx defina alias de agente personalizados.
Si tu instalación local de Cursor aún expone ACP como `agent acp`, sobrescribe el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal de `agentId` de OpenClaw).

El control del modelo depende de la capacidad del adaptador. Las refs de modelo de ACP de Codex son normalizadas por OpenClaw antes del arranque. Otros arneses necesitan `models` de ACP más compatibilidad con `session/set_model`; si un arnés no expone esa capacidad de ACP ni su propia marca de modelo de arranque, OpenClaw/acpx no puede forzar una selección de modelo.

## Configuración requerida

Línea base de ACP del núcleo:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "openclaw",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuración de enlace de hilos es específica del adaptador de canal. Ejemplo para Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnSessions: true,
      },
    },
  },
}
```

Si la generación de ACP enlazada a hilo no funciona, verifica primero la marca de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Los enlaces de conversación actual no requieren crear hilos secundarios. Requieren un contexto de conversación activo y un adaptador de canal que exponga enlaces de conversación de ACP.

Consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del Plugin para el backend acpx

Las instalaciones empaquetadas usan el Plugin oficial de runtime `@openclaw/acpx` para ACP.
Instálalo y actívalo antes de usar sesiones de arnés ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los checkouts de código fuente también pueden usar el Plugin del workspace local después de `pnpm install`.

Empieza con:

```text
/acp doctor
```

Si desactivaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres volver al Plugin empaquetado, usa la ruta explícita del paquete:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación del workspace local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica la salud del backend:

```text
/acp doctor
```

### Configuración del comando y la versión de acpx

De forma predeterminada, el Plugin `acpx` registra el backend ACP integrado durante el arranque del Gateway y espera la sonda de arranque del runtime integrado antes de la señal `ready` del gateway. Define `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` o `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` solo para scripts o entornos que mantienen intencionalmente desactivada la sonda de arranque. Ejecuta `/acp doctor` para una sonda explícita bajo demanda.

Sobrescribe el comando o la versión en la configuración del Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` acepta una ruta absoluta, una ruta relativa (resuelta desde el workspace de OpenClaw) o un nombre de comando.
- `expectedVersion: "any"` desactiva la coincidencia estricta de versiones.
- Las rutas de `command` personalizadas desactivan la instalación automática local del Plugin.

Sobrescribe un comando de agente ACP individual con argumentos estructurados cuando una ruta o un valor de marca deba permanecer como un solo token argv:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` es el ejecutable o la cadena de comando existente para ese agente ACP.
- `agents.<id>.args` es opcional. Cada elemento del arreglo se cita para shell antes de que OpenClaw lo pase por el registro actual de cadenas de comando de acpx.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las dependencias del runtime acpx (binarios específicos de la plataforma) se instalan automáticamente mediante un hook postinstall. Si la instalación automática falla, el gateway sigue arrancando normalmente y reporta la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de Plugin

De forma predeterminada, las sesiones de ACPX **no** exponen herramientas registradas por Plugins de OpenClaw al arnés ACP.

Si quieres que agentes ACP como Codex o Claude Code llamen herramientas de Plugins de OpenClaw instaladas, como recuperación/almacenamiento de memoria, activa el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el bootstrap de sesión de ACPX.
- Expone herramientas de Plugins ya registradas por Plugins de OpenClaw instalados y activados.
- Mantiene la función explícita y desactivada de forma predeterminada.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del arnés ACP.
- Los agentes ACP obtienen acceso solo a herramientas de Plugins que ya están activas en el gateway.
- Trata esto como el mismo límite de confianza que permitir que esos Plugins se ejecuten dentro de OpenClaw.
- Revisa los Plugins instalados antes de activarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de Plugins es una comodidad adicional con activación explícita, no un reemplazo de la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones de ACPX tampoco exponen herramientas integradas de OpenClaw mediante MCP. Activa el puente separado de herramientas del núcleo cuando un agente ACP necesite herramientas integradas seleccionadas como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el bootstrap de sesión de ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene la exposición de herramientas del núcleo explícita y desactivada de forma predeterminada.

### Configuración del tiempo de espera de operaciones del runtime

El Plugin `acpx` da a las operaciones de arranque y control del runtime integrado 120 segundos de forma predeterminada. Esto da a arneses más lentos como Gemini CLI tiempo suficiente para completar el arranque y la inicialización de ACP. Sobrescríbelo si tu host necesita un límite de operación diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Los turnos del runtime usan los tiempos de espera de agente/ejecución de OpenClaw, incluido `/acp timeout`.
`sessions_spawn` no acepta sobrescrituras de tiempo de espera por llamada. Reinicia el gateway después de cambiar este valor.

### Configuración del agente de sonda de salud

Cuando `/acp doctor` o la sonda de arranque revisan el backend, el Plugin `acpx` incluido sondea un agente de arnés. Si `acp.allowedAgents` está definido, usa de forma predeterminada el primer agente permitido; de lo contrario usa `codex`. Si tu despliegue necesita un agente ACP diferente para las comprobaciones de salud, define explícitamente el agente de sonda:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay TTY para aprobar o denegar solicitudes de permiso de escritura de archivos y ejecución de shell. El Plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos de arnés ACPX son independientes de las aprobaciones de ejecución de OpenClaw y de las marcas de omisión de proveedores de backend de CLI, como `--permission-mode bypassPermissions` de Claude CLI. `approve-all` de ACPX es el interruptor de emergencia a nivel de arnés para sesiones ACP.

Para la comparación más amplia entre `tools.exec.mode` de OpenClaw, las aprobaciones de Codex Guardian y los permisos de arnés ACPX, consulta
[modos de permiso](/es/tools/permission-modes).

### `permissionMode`

Controla qué operaciones puede realizar el agente de arnés sin solicitar confirmación.

| Valor           | Comportamiento                                           |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo lecturas; las escrituras y la ejecución requieren solicitudes. |
| `deny-all`      | Deniega todas las solicitudes de permiso.                 |

### `nonInteractivePermissions`

Controla qué sucede cuando se mostraría una solicitud de permiso pero no hay una TTY interactiva disponible (lo que siempre ocurre para sesiones ACP).

| Valor  | Comportamiento                                                   |
| ------ | ----------------------------------------------------------------- |
| `fail` | Interrumpe la sesión con `AcpRuntimeError`. **(predeterminado)**  |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación gradual). |

### Configuración

Define mediante la configuración del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el gateway después de cambiar estos valores.

<Warning>
OpenClaw usa de forma predeterminada `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Si necesitas restringir permisos, define `nonInteractivePermissions` como `deny` para que las sesiones se degraden gradualmente en lugar de fallar.
</Warning>

## Relacionado

- [agentes ACP](/es/tools/acp-agents) — visión general, runbook del operador, conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
