---
read_when:
    - Instalación o configuración del entorno acpx para Claude Code / Codex / Gemini CLI
    - Activación del puente MCP de plugin-tools u OpenClaw-tools
    - Configuración de los modos de permisos de ACP
summary: 'Configuración de agentes ACP: configuración del entorno acpx, configuración del plugin y permisos'
title: Agentes ACP — configuración
x-i18n:
    generated_at: "2026-07-16T11:59:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para obtener una descripción general, el manual operativo y los conceptos, consulte [agentes ACP](/es/tools/acp-agents).

Esta página abarca la configuración del entorno acpx, la configuración de plugins para los puentes MCP y la configuración de permisos.

Use esta página solo cuando configure la ruta ACP/acpx. Para la configuración del entorno de ejecución nativo del servidor de aplicaciones de Codex, use [entorno de Codex](/es/plugins/codex-harness). Para las claves de la API de OpenAI o la configuración del proveedor de modelos mediante OAuth de Codex, use [OpenAI](/es/providers/openai).

Codex tiene dos rutas de OpenClaw:

| Ruta                                    | Configuración/comando                                   | Página de configuración                  |
| --------------------------------------- | ------------------------------------------------------- | ---------------------------------------- |
| Servidor de aplicaciones nativo de Codex | `/codex ...`, referencias de agente `openai/gpt-*` | [Entorno de Codex](/es/plugins/codex-harness) |
| Adaptador ACP explícito de Codex        | `/acp spawn codex`, `runtime: "acp", agentId: "codex"`                  | Esta página                              |

Prefiera la ruta nativa, salvo que necesite explícitamente el comportamiento de ACP/acpx.

## Compatibilidad actual del entorno acpx

Alias integrados del entorno acpx (de la dependencia fijada `acpx`):

| Alias        | Encapsula                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [CLI de Codex](https://codex.openai.com)                                                                        |
| `copilot`    | [CLI de GitHub Copilot](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [CLI de Cursor](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                           |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [CLI de Gemini](https://github.com/google/gemini-cli)                                                           |
| `iflow`      | [CLI de iFlow](https://github.com/iflow-ai/iflow-cli)                                                           |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [CLI de Kimi](https://github.com/MoonshotAI/kimi-cli)                                                           |
| `kiro`       | [CLI de Kiro](https://kiro.dev)                                                                                 |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Puente ACP de OpenClaw (`openclaw acp` nativo)                                                              |
| `pi`         | [Agente de programación Pi](https://github.com/mariozechner/pi)                                                |
| `qoder`      | [CLI de Qoder](https://docs.qoder.com/cli/acp)                                                                  |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [CLI de Trae](https://docs.trae.cn/cli)                                                                         |

`factory-droid` y `factorydroid` también se resuelven mediante el adaptador integrado `droid`.

Cuando OpenClaw use el backend acpx, prefiera estos valores para `agentId`, salvo que su configuración de acpx defina alias de agentes personalizados.
Si la instalación local de Cursor todavía expone ACP como `agent acp`, sustituya el comando de agente `cursor` en la configuración de acpx, en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede dirigirse a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal `agentId` de OpenClaw).

El control del modelo depende de las capacidades del adaptador. OpenClaw normaliza las referencias de modelos ACP de Codex antes del inicio. Otros entornos necesitan la compatibilidad con `models` de ACP y con `session/set_model`; si un entorno no expone ni esa capacidad de ACP ni su propio indicador de modelo al inicio, OpenClaw/acpx no puede forzar la selección de un modelo.

## Configuración obligatoria

Configuración básica de ACP en el núcleo:

```json5
{
  acp: {
    enabled: true,
    // Opcional. El valor predeterminado es true; establezca false para pausar el envío de ACP y conservar los controles /acp.
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
      // Los valores predeterminados son coalesceIdleMs: 350 y maxChunkChars: 1800; aquí se muestran explícitamente.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuración de vinculación de hilos es específica del adaptador del canal. Ejemplo para Discord:

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
        // El valor predeterminado ya es true; aquí se muestra explícitamente.
        spawnSessions: true,
      },
    },
  },
}
```

Si la creación de ACP vinculada a un hilo no funciona, compruebe primero el indicador de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Las vinculaciones con la conversación actual no requieren crear un hilo secundario. Requieren un contexto de conversación activo y un adaptador de canal que exponga vinculaciones de conversaciones ACP.

Consulte la [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del Plugin para el backend acpx

Las instalaciones empaquetadas usan el Plugin de entorno de ejecución oficial `@openclaw/acpx` para ACP.
Instálelo y actívelo antes de usar sesiones del entorno ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los repositorios de código fuente también pueden usar el Plugin del espacio de trabajo local después de `pnpm install`.

Comience con:

```text
/acp doctor
```

Si desactivó `acpx`, lo denegó mediante `plugins.allow` / `plugins.deny` o desea volver al Plugin empaquetado, use la ruta explícita del paquete:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación del espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

A continuación, compruebe el estado del backend:

```text
/acp doctor
```

### Sondeo de inicio del entorno de ejecución de acpx

El Plugin `acpx` incorpora directamente el entorno de ejecución ACP (sin ningún binario ni versión `acpx` independientes que configurar). De forma predeterminada, registra el backend incorporado durante el inicio del Gateway y espera a que finalice un sondeo de inicio antes de la señal `ready` del gateway. Establezca `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` o `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` solo para scripts o entornos que mantengan desactivado intencionadamente el sondeo de inicio. Ejecute `/acp doctor` para realizar un sondeo explícito bajo demanda.

Sustituya el comando de un agente ACP concreto con argumentos estructurados cuando una ruta o el valor de un indicador deba permanecer como un único token argv:

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
- `agents.<id>.args` es opcional. Cada elemento de la matriz se entrecomilla para el shell antes de que OpenClaw lo pase a través del registro actual de cadenas de comandos de acpx.

Consulte [Plugins](/es/tools/plugin).

### Descarga automática de adaptadores

`acpx` descarga automáticamente adaptadores ACP (por ejemplo, los puentes ACP de Claude y Codex) mediante `npx` la primera vez que se usan. No es necesario instalar manualmente los paquetes de adaptadores y no existe un paso posterior a la instalación independiente para OpenClaw. Si falla la descarga o la creación de un adaptador, `/acp doctor` informa del error.

### Puente MCP para herramientas de plugins

De forma predeterminada, las sesiones de ACPX **no** exponen al entorno ACP las herramientas registradas por los plugins de OpenClaw.

Si desea que los agentes ACP, como Codex o Claude Code, llamen a herramientas de plugins de OpenClaw instalados, como las de recuperación o almacenamiento de memoria, active el puente específico:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Esto hace lo siguiente:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el arranque de la sesión ACPX.
- Expone las herramientas de plugins ya registradas por los plugins de OpenClaw instalados y activados.
- Pasa la identidad de la sesión ACP activa a las fábricas de herramientas de plugins, de modo que las herramientas asociadas al agente permanezcan en el espacio de nombres de ese agente.
- Mantiene la función explícita y desactivada de forma predeterminada.

Notas sobre seguridad y confianza:

- Esto amplía la superficie de herramientas del entorno ACP.
- Los agentes ACP solo obtienen acceso a las herramientas de plugins que ya están activas en el gateway.
- Considere que esto pertenece al mismo límite de confianza que permitir que esos plugins se ejecuten en OpenClaw.
- Revise los plugins instalados antes de activarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado para herramientas de plugins es una comodidad opcional adicional, no un reemplazo de la configuración genérica del servidor MCP.

### Puente MCP para herramientas de OpenClaw

De forma predeterminada, las sesiones de ACPX tampoco exponen las herramientas integradas de OpenClaw mediante MCP. Active el puente independiente para herramientas del núcleo cuando un agente ACP necesite determinadas herramientas integradas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Esto hace lo siguiente:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el arranque de la sesión ACPX.
- Expone determinadas herramientas integradas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene explícita y desactivada de forma predeterminada la exposición de herramientas del núcleo.

### Configuración del tiempo de espera de las operaciones del entorno de ejecución

El Plugin `acpx` concede de forma predeterminada 120 segundos a las operaciones de inicio y control del entorno de ejecución incorporado. Esto proporciona a entornos más lentos, como la CLI de Gemini, tiempo suficiente para completar el inicio y la inicialización de ACP. Sustituya este valor si el host necesita un límite de operación diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Los turnos del entorno de ejecución usan los tiempos de espera de agente/ejecución de OpenClaw, incluido `/acp timeout`.
`sessions_spawn` no acepta sustituciones del tiempo de espera por llamada; la ruta del operador es `agents.defaults.subagents.runTimeoutSeconds`. Reinicie el gateway después de cambiar `timeoutSeconds`.

### Configuración del agente de sondeo de estado

Cuando `/acp doctor` o el sondeo de inicio comprueban el backend, el Plugin incluido `acpx` sondea un agente del entorno. Si se establece `acp.allowedAgents`, el valor predeterminado es el primer agente permitido; de lo contrario, es `codex`. Si el despliegue necesita un agente ACP diferente para las comprobaciones de estado, establezca explícitamente el agente de sondeo:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie el gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay ningún TTY para aprobar o denegar las solicitudes de permiso de escritura de archivos y ejecución de comandos del shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos del arnés ACPX son independientes de las aprobaciones de ejecución de OpenClaw y de los indicadores de omisión del proveedor del backend de la CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el mecanismo de emergencia a nivel del arnés para las sesiones ACP.

Para consultar una comparación más amplia entre OpenClaw `tools.exec.mode`, las aprobaciones de Codex Guardian
y los permisos del arnés ACPX, véase
[Modos de permisos](/es/tools/permission-modes).

### `permissionMode`

Controla qué operaciones puede realizar el agente del arnés sin solicitar confirmación.

| Valor           | Comportamiento                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y los comandos del shell.          |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y la ejecución requieren confirmación. |
| `deny-all`      | Deniega todas las solicitudes de permiso.                              |

### `nonInteractivePermissions`

Controla qué ocurre cuando debería mostrarse una solicitud de permiso, pero no hay ningún TTY interactivo disponible (como sucede siempre en las sesiones ACP).

| Valor  | Comportamiento                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Interrumpe la sesión con `PermissionPromptUnavailableError`. **(valor predeterminado)** |
| `deny` | Deniega el permiso silenciosamente y continúa (degradación gradual).        |

### Configuración

Se establece mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie el Gateway después de cambiar estos valores.

<Warning>
Los valores predeterminados de OpenClaw son `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En las sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Si es necesario restringir los permisos, establezca `nonInteractivePermissions` en `deny` para que las sesiones se degraden de forma gradual en lugar de bloquearse.
</Warning>

## Contenido relacionado

- [Agentes ACP](/es/tools/acp-agents) — descripción general, manual operativo y conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
