---
read_when:
    - Instalación o configuración del arnés acpx para Claude Code / Codex / Gemini CLI
    - Habilitar el puente MCP plugin-tools u OpenClaw-tools
    - Configurar los modos de permisos de ACP
summary: 'Configuración de agentes ACP: configuración del harness acpx, configuración del Plugin, permisos'
title: Agentes ACP — configuración
x-i18n:
    generated_at: "2026-05-11T20:54:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para la descripción general, el runbook del operador y los conceptos, consulta [agentes ACP](/es/tools/acp-agents).

Las secciones siguientes cubren la configuración del arnés acpx, la configuración del plugin para los puentes MCP y la configuración de permisos.

Usa esta página solo cuando estés configurando la ruta ACP/acpx. Para la configuración del entorno de ejecución del servidor de aplicación nativo de Codex, usa [arnés Codex](/es/plugins/codex-harness). Para claves de API de OpenAI o configuración del proveedor de modelos Codex OAuth, usa
[OpenAI](/es/providers/openai).

Codex tiene dos rutas de OpenClaw:

| Ruta                       | Configuración/comando                                  | Página de configuración                  |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| Servidor de aplicación nativo de Codex | `/codex ...`, referencias de agente `openai/gpt-*` | [arnés Codex](/es/plugins/codex-harness) |
| Adaptador Codex ACP explícito | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                              |

Prefiere la ruta nativa salvo que necesites explícitamente el comportamiento ACP/acpx.

## Compatibilidad del arnés acpx (actual)

Alias actuales de arnés integrados de acpx:

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
- `pi`
- `qwen`

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId`, salvo que tu configuración de acpx defina alias de agente personalizados.
Si tu instalación local de Cursor todavía expone ACP como `agent acp`, anula el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal de `agentId` de OpenClaw).

El control del modelo depende de las capacidades del adaptador. Las referencias de modelo de Codex ACP son normalizadas por OpenClaw antes del inicio. Otros arneses necesitan ACP `models` más compatibilidad con `session/set_model`; si un arnés no expone esa capacidad ACP ni su propia marca de modelo de inicio, OpenClaw/acpx no puede forzar la selección de un modelo.

## Configuración requerida

Base ACP principal:

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
      "pi",
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

La configuración de vinculación de hilos es específica de cada adaptador de canal. Ejemplo para Discord:

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

Si la generación ACP vinculada a hilos no funciona, verifica primero la marca de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Las vinculaciones de conversación actual no requieren creación de hilos secundarios. Requieren un contexto de conversación activo y un adaptador de canal que exponga vinculaciones de conversación ACP.

Consulta la [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del Plugin para el backend acpx

Las instalaciones empaquetadas usan el plugin de entorno de ejecución oficial `@openclaw/acpx` para ACP.
Instálalo y actívalo antes de usar sesiones de arnés ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Las copias de código fuente también pueden usar el plugin del espacio de trabajo local después de `pnpm install`.

Empieza con:

```text
/acp doctor
```

Si desactivaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres volver al plugin empaquetado, usa la ruta de paquete explícita:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación del espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica el estado del backend:

```text
/acp doctor
```

### Configuración del comando y la versión de acpx

De forma predeterminada, el plugin `acpx` prueba el backend ACP incrustado durante el inicio del Gateway y espera a que esa prueba termine antes de la señal `ready` del gateway. Establece `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` para omitir la prueba de inicio y registrar el backend de forma diferida. Ejecuta `/acp doctor` para una prueba explícita bajo demanda.

Anula el comando o la versión en la configuración del plugin:

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

- `command` acepta una ruta absoluta, una ruta relativa (resuelta desde el espacio de trabajo de OpenClaw) o un nombre de comando.
- `expectedVersion: "any"` desactiva la coincidencia estricta de versión.
- Las rutas `command` personalizadas desactivan la instalación automática local del plugin.

Anula el comando de un agente ACP individual con argumentos estructurados cuando una ruta o valor de marca debe permanecer como un solo token argv:

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
- `agents.<id>.args` es opcional. Cada elemento de arreglo se entrecomilla para shell antes de que OpenClaw lo pase por el registro actual de cadenas de comando de acpx.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las dependencias de entorno de ejecución de acpx (binarios específicos de la plataforma) se instalan automáticamente mediante un gancho postinstall. Si la instalación automática falla, el gateway sigue iniciándose normalmente e informa la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de plugins

De forma predeterminada, las sesiones ACPX **no** exponen herramientas registradas por plugins de OpenClaw al arnés ACP.

Si quieres que agentes ACP como Codex o Claude Code llamen herramientas de plugins de OpenClaw instaladas, como recuperar/guardar memoria, activa el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el arranque de sesiones ACPX.
- Expone herramientas de plugins ya registradas por plugins de OpenClaw instalados y activados.
- Mantiene la función explícita y desactivada de forma predeterminada.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del arnés ACP.
- Los agentes ACP solo obtienen acceso a herramientas de plugins ya activas en el gateway.
- Trata esto como el mismo límite de confianza que permitir que esos plugins se ejecuten en OpenClaw mismo.
- Revisa los plugins instalados antes de activarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de plugins es una comodidad adicional opcional, no un reemplazo para la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco exponen herramientas integradas de OpenClaw mediante MCP. Activa el puente separado de herramientas principales cuando un agente ACP necesite herramientas integradas seleccionadas como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el arranque de sesiones ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene la exposición de herramientas principales explícita y desactivada de forma predeterminada.

### Configuración del tiempo de espera del entorno de ejecución

El plugin `acpx` establece de forma predeterminada un tiempo de espera de 120 segundos para los turnos del entorno de ejecución incrustado. Esto da a arneses más lentos, como Gemini CLI, tiempo suficiente para completar el inicio y la inicialización de ACP. Anúlalo si tu host necesita un límite de entorno de ejecución diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicia el gateway después de cambiar este valor.

### Configuración del agente de prueba de estado

Cuando `/acp doctor` o la prueba de inicio comprueba el backend, el plugin `acpx` incluido prueba un agente de arnés. Si `acp.allowedAgents` está definido, usa de forma predeterminada el primer agente permitido; de lo contrario, usa `codex` de forma predeterminada. Si tu implementación necesita un agente ACP diferente para las comprobaciones de estado, establece explícitamente el agente de prueba:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay TTY para aprobar o denegar solicitudes de permiso de escritura de archivos y ejecución de shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos de arnés ACPX están separados de las aprobaciones de ejecución de OpenClaw y de las marcas de omisión de proveedores de backend de CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia de nivel de arnés para sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente de arnés sin solicitar confirmación.

| Valor           | Comportamiento                                           |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo lecturas; las escrituras y la ejecución requieren solicitudes. |
| `deny-all`      | Deniega todas las solicitudes de permiso.                |

### `nonInteractivePermissions`

Controla qué ocurre cuando se mostraría una solicitud de permiso, pero no hay una TTY interactiva disponible (lo que siempre ocurre en las sesiones ACP).

| Valor  | Comportamiento                                                   |
| ------ | ---------------------------------------------------------------- |
| `fail` | Anula la sesión con `AcpRuntimeError`. **(predeterminado)**      |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación gradual). |

### Configuración

Establece mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el gateway después de cambiar estos valores.

<Warning>
OpenClaw usa de forma predeterminada `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden gradualmente en lugar de bloquearse.
</Warning>

## Relacionado

- [agentes ACP](/es/tools/acp-agents) — descripción general, runbook del operador, conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
