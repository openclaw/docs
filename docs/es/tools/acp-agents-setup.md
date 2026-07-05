---
read_when:
    - Instalar o configurar el arnés acpx para Claude Code / Codex / Gemini CLI
    - Habilitar el puente MCP plugin-tools u OpenClaw-tools
    - Configurar los modos de permiso de ACP
summary: 'Configurar agentes ACP: configuración del arnés acpx, configuración del Plugin, permisos'
title: ACP agentes — configuración
x-i18n:
    generated_at: "2026-07-05T11:47:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para la vista general, el runbook del operador y los conceptos, consulta [agentes ACP](/es/tools/acp-agents).

Esta página cubre la configuración del harness acpx, la configuración de plugins para los puentes MCP y la configuración de permisos.

Usa esta página solo cuando estés configurando la ruta ACP/acpx. Para la configuración del runtime nativo Codex
app-server, usa [harness Codex](/es/plugins/codex-harness). Para
claves de API de OpenAI o la configuración del proveedor de modelos de Codex OAuth, usa
[OpenAI](/es/providers/openai).

Codex tiene dos rutas de OpenClaw:

| Ruta                       | Configuración/comando                                  | Página de configuración                 |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Codex app-server nativo    | `/codex ...`, refs de agente `openai/gpt-*`            | [harness Codex](/es/plugins/codex-harness) |
| Adaptador ACP Codex explícito | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                             |

Prefiere la ruta nativa salvo que necesites explícitamente el comportamiento ACP/acpx.

## Compatibilidad del harness acpx (actual)

Alias integrados del harness acpx (desde la dependencia fijada `acpx`):

| Alias        | Envuelve                                                                                                        |
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
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` y `factorydroid` también se resuelven al adaptador integrado `droid`.

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId`, salvo que tu configuración de acpx defina alias de agente personalizados.
Si tu instalación local de Cursor todavía expone ACP como `agent acp`, sobrescribe el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal `agentId` de OpenClaw).

El control de modelos depende de las capacidades del adaptador. Las refs de modelo de Codex ACP son
normalizadas por OpenClaw antes del inicio. Otros harnesses necesitan `models` de ACP más
compatibilidad con `session/set_model`; si un harness no expone ni esa capacidad de ACP
ni su propia marca de modelo de inicio, OpenClaw/acpx no puede forzar una selección de modelo.

## Configuración requerida

Base ACP del núcleo:

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

La configuración de vinculación de hilos es específica del adaptador de canal. Ejemplo para Discord:

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

Si la generación ACP vinculada a hilos no funciona, verifica primero la marca de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Las vinculaciones de la conversación actual no requieren la creación de hilos secundarios. Requieren un contexto de conversación activo y un adaptador de canal que exponga vinculaciones de conversación ACP.

Consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración de Plugin para el backend acpx

Las instalaciones empaquetadas usan el Plugin de runtime oficial `@openclaw/acpx` para ACP.
Instálalo y habilítalo antes de usar sesiones de harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los checkouts de código fuente también pueden usar el Plugin del workspace local después de `pnpm install`.

Comienza con:

```text
/acp doctor
```

Si deshabilitaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres
volver al Plugin empaquetado, usa la ruta de paquete explícita:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación del workspace local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica el estado del backend:

```text
/acp doctor
```

### Sonda de inicio del runtime acpx

El Plugin `acpx` incrusta directamente el runtime ACP (sin binario `acpx` separado ni
versión que configurar). De forma predeterminada, registra el backend incrustado durante
el inicio del Gateway y espera una sonda de inicio antes de la señal `ready` del gateway.
Define `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` o
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` solo para scripts o entornos que
mantienen intencionalmente deshabilitada la sonda de inicio. Ejecuta `/acp doctor` para una sonda explícita
bajo demanda.

Sobrescribe un comando de agente ACP individual con argumentos estructurados cuando una ruta
o valor de marca deba permanecer como un único token argv:

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

### Descarga automática de adaptadores

`acpx` descarga automáticamente adaptadores ACP (por ejemplo, los puentes ACP de Claude y Codex)
mediante `npx` en el primer uso. No necesitas instalar paquetes de adaptador
manualmente, y no hay un paso postinstall separado para OpenClaw en sí. Si una
descarga de adaptador o generación falla, `/acp doctor` informa el fallo.

### Puente MCP de herramientas de plugins

De forma predeterminada, las sesiones ACPX **no** exponen las herramientas registradas por plugins de OpenClaw al
harness ACP.

Si quieres que agentes ACP como Codex o Claude Code llamen a herramientas de plugins de
OpenClaw instaladas, como recuperación/almacenamiento de memoria, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el arranque
  de sesiones ACPX.
- Expone herramientas de plugins ya registradas por plugins de OpenClaw
  instalados y habilitados.
- Mantiene la función explícita y desactivada de forma predeterminada.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del harness ACP.
- Los agentes ACP obtienen acceso solo a herramientas de plugins ya activas en el gateway.
- Trátalo como el mismo límite de confianza que permitir que esos plugins se ejecuten en
  OpenClaw mismo.
- Revisa los plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de plugins es una
comodidad adicional opcional, no un reemplazo de la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco exponen las herramientas integradas de OpenClaw mediante
MCP. Habilita el puente separado de herramientas del núcleo cuando un agente ACP necesite herramientas
integradas seleccionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el arranque
  de sesiones ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene la exposición de herramientas del núcleo explícita y desactivada de forma predeterminada.

### Configuración del tiempo de espera de operaciones de runtime

El Plugin `acpx` concede 120 segundos de forma predeterminada a las operaciones de inicio y control
del runtime incrustado. Esto da a harnesses más lentos, como Gemini CLI, tiempo suficiente
para completar el inicio y la inicialización de ACP. Sobrescríbelo si tu host necesita un
límite de operación distinto:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Los turnos de runtime usan los tiempos de espera de agente/ejecución de OpenClaw, incluido `/acp timeout`.
`sessions_spawn` no acepta sobrescrituras de tiempo de espera por llamada; la ruta de operador
es `agents.defaults.subagents.runTimeoutSeconds`. Reinicia el gateway después de
cambiar `timeoutSeconds`.

### Configuración del agente de sonda de estado

Cuando `/acp doctor` o la sonda de inicio comprueban el backend, el Plugin `acpx`
incluido sondea un agente de harness. Si `acp.allowedAgents` está definido, usa de forma predeterminada
el primer agente permitido; de lo contrario, usa `codex` de forma predeterminada. Si tu despliegue
necesita un agente ACP distinto para comprobaciones de estado, define explícitamente el agente de sonda:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay TTY para aprobar o denegar solicitudes de permiso de escritura de archivos y ejecución de shell. El Plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos de harness ACPX son independientes de las aprobaciones de exec de OpenClaw e independientes de las marcas de omisión del proveedor del backend CLI, como `--permission-mode bypassPermissions` de Claude CLI. `approve-all` de ACPX es el interruptor de emergencia de nivel de harness para sesiones ACP.

Para la comparación más amplia entre `tools.exec.mode` de OpenClaw, las aprobaciones de Codex Guardian
y los permisos de harness ACPX, consulta
[Modos de permisos](/es/tools/permission-modes).

### `permissionMode`

Controla qué operaciones puede realizar el agente de harness sin solicitar confirmación.

| Valor           | Comportamiento                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos de shell.          |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y la ejecución requieren confirmaciones. |
| `deny-all`      | Deniega todas las solicitudes de permiso.                              |

### `nonInteractivePermissions`

Controla qué ocurre cuando se mostraría una solicitud de permiso, pero no hay una TTY interactiva disponible (lo que siempre ocurre en las sesiones de ACP).

| Valor  | Comportamiento                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Aborta la sesión con `PermissionPromptUnavailableError`. **(predeterminado)** |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación gradual).        |

### Configuración

Establecer mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el gateway después de cambiar estos valores.

<Warning>
OpenClaw usa de forma predeterminada `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones de ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden gradualmente en lugar de fallar.
</Warning>

## Relacionado

- [Agentes ACP](/es/tools/acp-agents) — descripción general, manual de ejecución del operador, conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
