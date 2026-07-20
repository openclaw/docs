---
read_when:
    - Instalación o configuración del entorno acpx para Claude Code / Codex / Gemini CLI
    - Habilitación del puente MCP de plugin-tools u OpenClaw-tools
    - Configuración de los modos de permisos de ACP
summary: 'Configuración de agentes ACP: configuración del arnés acpx, configuración del plugin y permisos'
title: Agentes ACP — configuración
x-i18n:
    generated_at: "2026-07-20T00:59:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a1742373d9e65733a2f969422253c3b2c0aa33e0b4caa4d5ab769dc2cc5d97
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para obtener una descripción general, el manual operativo y los conceptos, consulte [Agentes ACP](/es/tools/acp-agents).

Esta página trata sobre la configuración del entorno acpx, la configuración del plugin para los puentes MCP y la configuración de permisos.

Use esta página solo cuando configure la ruta ACP/acpx. Para la configuración del runtime app-server nativo de Codex, use [Entorno de Codex](/es/plugins/codex-harness). Para las claves de la API de OpenAI o la configuración del proveedor de modelos mediante OAuth de Codex, use [OpenAI](/es/providers/openai).

Codex dispone de dos rutas de OpenClaw:

| Ruta                       | Configuración/comando                                  | Página de configuración                 |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server nativo de Codex | `/codex ...`, referencias de agente `openai/gpt-*` | [Entorno de Codex](/es/plugins/codex-harness) |
| Adaptador ACP explícito de Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                             |

Prefiera la ruta nativa, salvo que necesite explícitamente el comportamiento de ACP/acpx.

## Compatibilidad actual con el entorno acpx

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

`factory-droid` y `factorydroid` también se resuelven al adaptador integrado `droid`.

Cuando OpenClaw use el backend acpx, prefiera estos valores para `agentId`, salvo que la configuración de acpx defina alias de agente personalizados.
Si la instalación local de Cursor sigue exponiendo ACP como `agent acp`, sustituya el comando del agente `cursor` en la configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede dirigirse a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape directa es una función de la CLI de acpx (no la ruta habitual `agentId` de OpenClaw).

El control del modelo depende de las capacidades del adaptador. OpenClaw normaliza las referencias de modelos de Codex ACP antes del inicio. Otros entornos necesitan ACP `models` junto con compatibilidad con `session/set_model`; si un entorno no expone ni esa capacidad de ACP ni su propia opción de modelo de inicio, OpenClaw/acpx no puede forzar la selección de un modelo.

## Configuración obligatoria

Configuración base de ACP en el núcleo:

```json5
{
  acp: {
    enabled: true,
    // Opcional. El valor predeterminado es true; establézcalo en false para pausar el envío de ACP y conservar los controles /acp.
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
    stream: {
      deliveryMode: "live",
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
        // El valor predeterminado ya es true; aquí se muestra explícitamente.
        spawnSessions: true,
      },
    },
  },
}
```

Si la creación de ACP vinculada a un hilo no funciona, compruebe primero la marca de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Las vinculaciones con la conversación actual no requieren crear un hilo secundario. Requieren un contexto de conversación activo y un adaptador de canal que exponga vinculaciones de conversaciones ACP.

Consulte la [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del plugin para el backend acpx

Las instalaciones empaquetadas usan el plugin de runtime oficial `@openclaw/acpx` para ACP.
Instálelo y actívelo antes de usar sesiones del entorno ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los repositorios de código fuente también pueden usar el plugin del espacio de trabajo local después de `pnpm install`.

Comience con:

```text
/acp doctor
```

Si desactivó `acpx`, lo denegó mediante `plugins.allow` / `plugins.deny` o desea volver al plugin empaquetado, use la ruta de paquete explícita:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación desde el espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

A continuación, compruebe el estado del backend:

```text
/acp doctor
```

### Sondeo de inicio del runtime acpx

El plugin `acpx` incorpora directamente el runtime de ACP (sin ningún binario `acpx` independiente ni una versión que configurar). De forma predeterminada, registra el backend incorporado durante el inicio del Gateway y espera a que finalice un sondeo de inicio antes de la señal `ready` del gateway. Establezca `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` o `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` solo para scripts o entornos que mantengan desactivado intencionadamente el sondeo de inicio. Ejecute `/acp doctor` para realizar un sondeo explícito bajo demanda.

Sustituya el comando de un agente ACP concreto mediante argumentos estructurados cuando una ruta o el valor de una opción deban permanecer como un único token de argv:

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
- `agents.<id>.args` es opcional. Cada elemento de la matriz se entrecomilla para el shell antes de que OpenClaw lo pase por el registro actual de cadenas de comandos de acpx.

Consulte [Plugins](/es/tools/plugin).

### Descarga automática de adaptadores

`acpx` descarga automáticamente los adaptadores ACP (por ejemplo, los puentes ACP de Claude y Codex) mediante `npx` la primera vez que se usan. No es necesario instalar manualmente los paquetes de adaptadores, y OpenClaw tampoco requiere un paso de posinstalación independiente. Si falla la descarga o el inicio de un adaptador, `/acp doctor` informa del fallo.

### Puente MCP de herramientas de plugins

De forma predeterminada, las sesiones ACPX **no** exponen al entorno ACP las herramientas registradas por plugins de OpenClaw.

Si desea que agentes ACP como Codex o Claude Code llamen a herramientas de plugins instalados de OpenClaw, como las de recuperación o almacenamiento de memoria, active el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace:

- Inyecta un servidor MCP integrado denominado `openclaw-plugin-tools` en la inicialización de la sesión ACPX.
- Expone las herramientas de plugins que ya han registrado los plugins de OpenClaw instalados y activados.
- Transmite la identidad de la sesión ACP activa a las fábricas de herramientas de plugins, de modo que las herramientas asociadas a un agente permanezcan en el espacio de nombres de ese agente.
- Mantiene la función explícita y desactivada de forma predeterminada.

Notas sobre seguridad y confianza:

- Esto amplía la superficie de herramientas del entorno ACP.
- Los agentes ACP solo obtienen acceso a las herramientas de plugins que ya están activas en el gateway.
- Considérelo el mismo límite de confianza que permitir que esos plugins se ejecuten en el propio OpenClaw.
- Revise los plugins instalados antes de activarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de plugins es una comodidad adicional opcional, no un sustituto de la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco exponen mediante MCP las herramientas integradas de OpenClaw. Active el puente independiente de herramientas del núcleo cuando un agente ACP necesite herramientas integradas seleccionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace:

- Inyecta un servidor MCP integrado denominado `openclaw-tools` en la inicialización de la sesión ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene la exposición de herramientas del núcleo explícita y desactivada de forma predeterminada.

### Configuración del tiempo de espera de las operaciones del runtime

El plugin `acpx` concede de forma predeterminada 120 segundos a las operaciones de inicio y control del runtime incorporado. Esto permite que entornos más lentos, como la CLI de Gemini, dispongan de tiempo suficiente para completar el inicio y la inicialización de ACP. Sustituya este valor si el host necesita un límite de operación distinto:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Los turnos del runtime usan los tiempos de espera de agentes y ejecuciones de OpenClaw, incluido `/acp timeout`.
`sessions_spawn` no acepta sustituciones del tiempo de espera por llamada; la ruta del operador es `agents.defaults.subagents.runTimeoutSeconds`. Reinicie el gateway después de cambiar `timeoutSeconds`.

### Configuración del agente de sondeo de estado

Cuando `/acp doctor` o el sondeo de inicio comprueban el backend, el plugin incluido `acpx` sondea un agente del entorno. Si se establece `acp.allowedAgents`, el valor predeterminado es el primer agente permitido; de lo contrario, el valor predeterminado es `codex`. Si el despliegue necesita otro agente ACP para las comprobaciones de estado, establezca explícitamente el agente de sondeo:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie el gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay ningún TTY para aprobar o denegar las solicitudes de permiso de escritura de archivos y ejecución del shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos del entorno ACPX son independientes de las aprobaciones de ejecución de OpenClaw y de los indicadores de omisión del proveedor del backend de la CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia a nivel del entorno para las sesiones ACP.

Para consultar una comparación más amplia entre OpenClaw `tools.exec.mode`, las aprobaciones de Codex Guardian
y los permisos del entorno ACPX, véase
[Modos de permisos](/es/tools/permission-modes).

### `permissionMode`

Controla qué operaciones puede realizar el agente del entorno sin solicitar confirmación.

| Valor           | Comportamiento                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y los comandos del shell.          |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y la ejecución requieren confirmación. |
| `deny-all`      | Deniega todas las solicitudes de permisos.                              |

### `nonInteractivePermissions`

Controla qué sucede cuando debería mostrarse una solicitud de permiso, pero no hay disponible una TTY interactiva (lo que siempre ocurre en las sesiones ACP).

| Valor  | Comportamiento                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Cancela la sesión con `PermissionPromptUnavailableError`. **(predeterminado)** |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación gradual).        |

### Configuración

Se establece mediante la configuración del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie el Gateway después de cambiar estos valores.

<Warning>
Los valores predeterminados de OpenClaw son `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En las sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Si es necesario restringir los permisos, establezca `nonInteractivePermissions` en `deny` para que las sesiones se degraden gradualmente en lugar de bloquearse.
</Warning>

## Relacionado

- [Agentes ACP](/es/tools/acp-agents) — descripción general, guía operativa, conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
