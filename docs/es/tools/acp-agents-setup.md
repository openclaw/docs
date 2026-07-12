---
read_when:
    - Instalación o configuración del entorno acpx para Claude Code / Codex / Gemini CLI
    - Activación del puente MCP de plugin-tools u OpenClaw-tools
    - Configuración de los modos de permisos de ACP
summary: 'Configuración de agentes ACP: configuración del entorno acpx, configuración del Plugin y permisos'
title: 'Agentes ACP: configuración'
x-i18n:
    generated_at: "2026-07-11T23:32:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para obtener una visión general, consultar el manual operativo y conocer los conceptos, consulta [agentes ACP](/es/tools/acp-agents).

Esta página abarca la configuración del entorno acpx, la configuración de plugins para los puentes MCP y la configuración de permisos.

Usa esta página solo cuando configures la ruta ACP/acpx. Para configurar el entorno de ejecución nativo del servidor de aplicaciones de Codex, usa [entorno de Codex](/es/plugins/codex-harness). Para configurar claves de la API de OpenAI o el proveedor de modelos de Codex mediante OAuth, usa [OpenAI](/es/providers/openai).

Codex tiene dos rutas de OpenClaw:

| Ruta                                       | Configuración/comando                                    | Página de configuración                  |
| ------------------------------------------ | -------------------------------------------------------- | ---------------------------------------- |
| Servidor de aplicaciones nativo de Codex   | `/codex ...`, referencias de agente `openai/gpt-*`       | [Entorno de Codex](/es/plugins/codex-harness) |
| Adaptador ACP explícito de Codex            | `/acp spawn codex`, `runtime: "acp", agentId: "codex"`   | Esta página                              |

Prefiere la ruta nativa, salvo que necesites explícitamente el comportamiento de ACP/acpx.

## Compatibilidad actual del entorno acpx

Alias integrados del entorno acpx (procedentes de la dependencia fijada `acpx`):

| Alias        | Encapsula                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Puente ACP de OpenClaw (`openclaw acp` nativo)                                                                  |
| `pi`         | [Agente de programación Pi](https://github.com/mariozechner/pi)                                                 |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` y `factorydroid` también se resuelven al adaptador integrado `droid`.

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId`, salvo que tu configuración de acpx defina alias de agente personalizados.
Si tu instalación local de Cursor aún expone ACP como `agent acp`, sustituye el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede dirigirse a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape directa es una función de la CLI de acpx, no la ruta normal de `agentId` de OpenClaw.

El control del modelo depende de las capacidades del adaptador. OpenClaw normaliza las referencias de modelos de Codex ACP antes del inicio. Los demás entornos necesitan la capacidad ACP `models` junto con compatibilidad con `session/set_model`; si un entorno no expone ni esa capacidad ACP ni su propio indicador de modelo durante el inicio, OpenClaw/acpx no puede imponer la selección de un modelo.

## Configuración obligatoria

Configuración base de ACP en el núcleo:

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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Defaults are coalesceIdleMs: 350, maxChunkChars: 1800; shown explicitly here.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuración de vinculación a hilos depende del adaptador de canal. Ejemplo para Discord:

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
        // Default is already true; shown explicitly here.
        spawnSessions: true,
      },
    },
  },
}
```

Si el inicio de ACP vinculado a un hilo no funciona, comprueba primero el indicador de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Las vinculaciones a la conversación actual no requieren crear un hilo secundario. Requieren un contexto de conversación activo y un adaptador de canal que exponga vinculaciones de conversaciones ACP.

Consulta la [referencia de configuración](/es/gateway/configuration-reference).

## Configuración del plugin para el backend acpx

Las instalaciones empaquetadas usan el plugin oficial de entorno de ejecución `@openclaw/acpx` para ACP.
Instálalo y actívalo antes de usar sesiones del entorno ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los repositorios de código fuente también pueden usar el plugin del espacio de trabajo local después de ejecutar `pnpm install`.

Empieza con:

```text
/acp doctor
```

Si desactivaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny` o quieres volver al plugin empaquetado, usa la ruta explícita del paquete:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación del espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Después, comprueba el estado del backend:

```text
/acp doctor
```

### Comprobación de inicio del entorno de ejecución acpx

El plugin `acpx` integra directamente el entorno de ejecución ACP, sin un binario `acpx` independiente ni una versión que configurar. De forma predeterminada, registra el backend integrado durante el inicio del Gateway y espera a que termine una comprobación de inicio antes de emitir la señal `ready` del Gateway. Establece `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` o `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` solo para scripts o entornos que mantengan intencionadamente desactivada la comprobación de inicio. Ejecuta `/acp doctor` para realizar una comprobación explícita bajo demanda.

Sustituye el comando de un agente ACP individual mediante argumentos estructurados cuando una ruta o el valor de un indicador deba permanecer como un único token de argv:

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
- `agents.<id>.args` es opcional. Cada elemento del arreglo se protege con comillas para el shell antes de que OpenClaw lo pase a través del registro actual de cadenas de comandos de acpx.

Consulta [Plugins](/es/tools/plugin).

### Descarga automática de adaptadores

`acpx` descarga automáticamente los adaptadores ACP —por ejemplo, los puentes ACP de Claude y Codex— mediante `npx` la primera vez que se usan. No necesitas instalar manualmente los paquetes de adaptadores y OpenClaw no requiere un paso posterior a la instalación independiente. Si falla la descarga o el inicio de un adaptador, `/acp doctor` informa del error.

### Puente MCP de herramientas de plugins

De forma predeterminada, las sesiones ACPX **no** exponen al entorno ACP las herramientas registradas por los plugins de OpenClaw.

Si quieres que agentes ACP como Codex o Claude Code puedan invocar herramientas de plugins instalados de OpenClaw, como la recuperación o el almacenamiento de memoria, activa el puente específico:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` durante la inicialización de la sesión ACPX.
- Expone las herramientas de plugins ya registradas por los plugins de OpenClaw instalados y activados.
- Mantiene la función explícita y desactivada de forma predeterminada.

Notas de seguridad y confianza:

- Amplía la superficie de herramientas del entorno ACP.
- Los agentes ACP solo obtienen acceso a las herramientas de plugins que ya estén activas en el Gateway.
- Trátalo como el mismo límite de confianza que permitir que esos plugins se ejecuten dentro de OpenClaw.
- Revisa los plugins instalados antes de activarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de plugins es una comodidad opcional adicional, no un sustituto de la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco exponen mediante MCP las herramientas integradas de OpenClaw. Activa el puente independiente de herramientas del núcleo cuando un agente ACP necesite herramientas integradas específicas como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` durante la inicialización de la sesión ACPX.
- Expone determinadas herramientas integradas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene la exposición de herramientas del núcleo explícita y desactivada de forma predeterminada.

### Configuración del tiempo de espera de las operaciones del entorno de ejecución

De forma predeterminada, el plugin `acpx` concede 120 segundos al inicio del entorno de ejecución integrado y a las operaciones de control. Esto permite que entornos más lentos, como Gemini CLI, dispongan de tiempo suficiente para completar el inicio y la inicialización de ACP. Sustituye este valor si tu host necesita un límite de operación diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Los turnos del entorno de ejecución usan los tiempos de espera de ejecución de agentes de OpenClaw, incluido `/acp timeout`.
`sessions_spawn` no acepta valores de tiempo de espera específicos por llamada; la ruta del operador es `agents.defaults.subagents.runTimeoutSeconds`. Reinicia el Gateway después de cambiar `timeoutSeconds`.

### Configuración del agente para comprobaciones de estado

Cuando `/acp doctor` o la comprobación de inicio verifica el backend, el plugin `acpx` incluido comprueba un agente del entorno. Si se establece `acp.allowedAgents`, usa de forma predeterminada el primer agente permitido; de lo contrario, usa `codex`. Si tu implementación necesita un agente ACP diferente para las comprobaciones de estado, establece explícitamente el agente de comprobación:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el Gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay una TTY para aprobar o denegar solicitudes de permisos de escritura de archivos y ejecución de comandos del shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos del entorno ACPX son independientes de las aprobaciones de ejecución de OpenClaw y de los indicadores de omisión del proveedor del backend de la CLI, como `--permission-mode bypassPermissions` de Claude CLI. `approve-all` de ACPX es el interruptor de emergencia del entorno para las sesiones ACP.

Para consultar una comparación más amplia entre `tools.exec.mode` de OpenClaw, las aprobaciones de Codex Guardian y los permisos del entorno ACPX, consulta [modos de permisos](/es/tools/permission-modes).

### `permissionMode`

Controla qué operaciones puede realizar el agente del entorno sin solicitar confirmación.

| Valor           | Comportamiento                                                                  |
| --------------- | ------------------------------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y los comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y la ejecución requieren confirmación. |
| `deny-all`      | Deniega todas las solicitudes de permisos.                                      |

### `nonInteractivePermissions`

Controla qué sucede cuando se debería mostrar una solicitud de permiso, pero no hay ninguna TTY interactiva disponible (lo que siempre ocurre en las sesiones ACP).

| Valor  | Comportamiento                                                               |
| ------ | ---------------------------------------------------------------------------- |
| `fail` | Interrumpe la sesión con `PermissionPromptUnavailableError`. **(predeterminado)** |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación gradual).         |

### Configuración

Establézcalo mediante la configuración del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie el Gateway después de cambiar estos valores.

<Warning>
Los valores predeterminados de OpenClaw son `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Si necesita restringir los permisos, establezca `nonInteractivePermissions` en `deny` para que las sesiones se degraden de forma gradual en lugar de bloquearse.
</Warning>

## Temas relacionados

- [Agentes ACP](/es/tools/acp-agents) — descripción general, manual operativo y conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
