---
read_when:
    - Instalación o configuración del entorno acpx para Claude Code / Codex / Gemini CLI
    - Habilitación del puente MCP de plugin-tools u OpenClaw-tools
    - Configuración de los modos de permisos de ACP
summary: 'Configuración de agentes ACP: configuración del entorno acpx, configuración del plugin y permisos'
title: Agentes ACP — configuración
x-i18n:
    generated_at: "2026-07-22T10:50:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ae3750092175b44252dd080717a1af176995df43c653f245f82d7e556cfd25eb
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para obtener una descripción general, el manual operativo y los conceptos, consulte [Agentes ACP](/es/tools/acp-agents).

Esta página abarca la configuración del entorno acpx, la configuración del Plugin para los puentes MCP y la configuración de permisos.

Utilice esta página únicamente cuando configure la ruta ACP/acpx. Para la configuración del entorno de ejecución nativo del servidor de aplicaciones de Codex, consulte [Entorno de Codex](/es/plugins/codex-harness). Para las claves de API de OpenAI o la configuración del proveedor de modelos mediante OAuth de Codex, consulte [OpenAI](/es/providers/openai).

Codex tiene dos rutas de OpenClaw:

| Ruta                               | Configuración/comando                                  | Página de configuración                |
| ---------------------------------- | ------------------------------------------------------ | -------------------------------------- |
| Servidor de aplicaciones nativo de Codex | `/codex ...`, referencias de agente `openai/gpt-*` | [Entorno de Codex](/es/plugins/codex-harness) |
| Adaptador ACP explícito de Codex   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                            |

Se recomienda la ruta nativa, salvo que se necesite explícitamente el comportamiento de ACP/acpx.

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
| `pi`         | [Agente de programación Pi](https://github.com/mariozechner/pi)                                                 |
| `qoder`      | [CLI de Qoder](https://docs.qoder.com/cli/acp)                                                                  |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [CLI de Trae](https://docs.trae.cn/cli)                                                                         |

`factory-droid` y `factorydroid` también se resuelven al adaptador integrado `droid`.

Cuando OpenClaw utilice el backend acpx, se recomienda usar estos valores para `agentId`, salvo que la configuración de acpx defina alias de agente personalizados.
Si la instalación local de Cursor aún expone ACP como `agent acp`, sustituya el comando del agente `cursor` en la configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede dirigirse a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal `agentId` de OpenClaw).

El control del modelo depende de las capacidades del adaptador. OpenClaw normaliza las referencias de modelos ACP de Codex antes del inicio. Otros entornos necesitan compatibilidad con `models` de ACP y con `session/set_model`; si un entorno no expone ni esa capacidad de ACP ni su propia opción de modelo al inicio, OpenClaw/acpx no puede imponer la selección de un modelo.

## Configuración obligatoria

Configuración básica de ACP en el núcleo:

```json5
{
  acp: {
    enabled: true,
    // Opcional. El valor predeterminado es true; establézcalo en false para pausar el envío de ACP y mantener los controles /acp.
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

La configuración de vinculación de hilos se comparte entre los adaptadores de canal compatibles:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
      spawnSessions: true,
    },
  },
}
```

Si la creación de ACP vinculada a un hilo no funciona, compruebe primero la marca de función del adaptador:

- Discord: `session.threadBindings.spawnSessions=true`

Las vinculaciones con la conversación actual no requieren crear un hilo secundario. Requieren un contexto de conversación activo y un adaptador de canal que exponga vinculaciones de conversaciones de ACP.

Consulte la [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del Plugin para el backend acpx

Las instalaciones empaquetadas utilizan el Plugin oficial de ejecución `@openclaw/acpx` para ACP.
Instálelo y habilítelo antes de utilizar sesiones del entorno ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los repositorios de código fuente también pueden utilizar el Plugin del espacio de trabajo local después de `pnpm install`.

Comience con:

```text
/acp doctor
```

Si se deshabilitó `acpx`, se denegó mediante `plugins.allow` / `plugins.deny` o se desea volver al Plugin empaquetado, utilice la ruta explícita del paquete:

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

### Comprobación de inicio del entorno de ejecución acpx

El Plugin `acpx` incorpora directamente el entorno de ejecución ACP (no hay ningún binario ni versión `acpx` independiente que configurar). De forma predeterminada, registra el backend incorporado durante el inicio del Gateway y espera a que finalice una comprobación de inicio antes de la señal `ready` del Gateway. Establezca `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` o `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` únicamente para scripts o entornos que mantengan intencionadamente deshabilitada la comprobación de inicio. Ejecute `/acp doctor` para realizar una comprobación explícita bajo demanda.

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

`acpx` descarga automáticamente los adaptadores ACP (por ejemplo, los puentes ACP de Claude y Codex) mediante `npx` cuando se utilizan por primera vez. No es necesario instalar manualmente los paquetes de adaptadores y no hay ningún paso de posinstalación independiente para OpenClaw. Si falla la descarga o la creación de un adaptador, `/acp doctor` informa del error.

### Puente MCP para herramientas de Plugins

De forma predeterminada, las sesiones ACPX **no** exponen al entorno ACP las herramientas registradas por Plugins de OpenClaw.

Si se desea que agentes ACP como Codex o Claude Code invoquen herramientas de Plugins instalados de OpenClaw, como las de recuperación o almacenamiento de memoria, habilite el puente específico:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace:

- Inyecta un servidor MCP integrado denominado `openclaw-plugin-tools` en la inicialización de la sesión ACPX.
- Expone las herramientas de Plugins que ya están registradas por Plugins de OpenClaw instalados y habilitados.
- Transmite la identidad de la sesión ACP activa a las fábricas de herramientas de Plugins, para que las herramientas limitadas al agente permanezcan en el espacio de nombres de dicho agente.
- Mantiene la función explícita y deshabilitada de forma predeterminada.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del entorno ACP.
- Los agentes ACP solo obtienen acceso a las herramientas de Plugins que ya estén activas en el Gateway.
- Debe tratarse como el mismo límite de confianza que permitir que esos Plugins se ejecuten en el propio OpenClaw.
- Revise los Plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado para herramientas de Plugins es una comodidad adicional de activación voluntaria, no un sustituto de la configuración genérica de servidores MCP.

### Puente MCP para herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco exponen mediante MCP las herramientas integradas de OpenClaw. Habilite el puente independiente para herramientas del núcleo cuando un agente ACP necesite determinadas herramientas integradas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace:

- Inyecta un servidor MCP integrado denominado `openclaw-tools` en la inicialización de la sesión ACPX.
- Expone determinadas herramientas integradas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene explícita la exposición de herramientas del núcleo y la deja deshabilitada de forma predeterminada.

### Configuración del tiempo de espera de las operaciones del entorno de ejecución

El Plugin `acpx` concede de forma predeterminada 120 segundos a las operaciones de inicio y control del entorno de ejecución incorporado. Esto proporciona a entornos más lentos, como la CLI de Gemini, tiempo suficiente para completar el inicio y la inicialización de ACP. Sustituya este valor si el host necesita un límite de operación diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Los turnos del entorno de ejecución utilizan los tiempos de espera de agente/ejecución de OpenClaw, incluido `/acp timeout`.
`sessions_spawn` no acepta sustituciones del tiempo de espera por llamada; la ruta del operador es `agents.defaults.subagents.runTimeoutSeconds`. Reinicie el Gateway después de cambiar `timeoutSeconds`.

### Configuración del agente de comprobación de estado

Cuando `/acp doctor` o la comprobación de inicio verifican el backend, el Plugin incluido `acpx` prueba un agente del entorno. Si se establece `acp.allowedAgents`, el valor predeterminado es el primer agente permitido; de lo contrario, el valor predeterminado es `codex`. Si la implementación necesita un agente ACP diferente para las comprobaciones de estado, establezca explícitamente el agente de comprobación:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie el Gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay ninguna TTY para aprobar o denegar las solicitudes de permisos de escritura de archivos y ejecución del shell. El Plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos del entorno ACPX son independientes de las aprobaciones de ejecución de OpenClaw y de los indicadores de omisión del proveedor del backend de la CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia en el nivel del entorno para las sesiones ACP.

Para consultar una comparación más amplia entre OpenClaw `tools.exec.mode`, las aprobaciones de Codex Guardian y los permisos del entorno ACPX, véase
[Modos de permisos](/es/tools/permission-modes).

### `permissionMode`

Controla qué operaciones puede realizar el agente del entorno sin solicitar confirmación.

| Valor           | Comportamiento                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y los comandos de shell.          |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y la ejecución requieren confirmación. |
| `deny-all`      | Rechaza todas las solicitudes de permisos.                              |

### `nonInteractivePermissions`

Controla qué ocurre cuando debería mostrarse una solicitud de permiso, pero no hay disponible una TTY interactiva (lo que siempre sucede en las sesiones ACP).

| Valor  | Comportamiento                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Interrumpe la sesión con `PermissionPromptUnavailableError`. **(valor predeterminado)** |
| `deny` | Rechaza silenciosamente el permiso y continúa (degradación gradual).        |

### Configuración

Se establece mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie el Gateway después de cambiar estos valores.

<Warning>
Los valores predeterminados de OpenClaw son `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Si necesita restringir los permisos, establezca `nonInteractivePermissions` en `deny` para que las sesiones se degraden de forma gradual en lugar de bloquearse.
</Warning>

## Relacionado

- [Agentes ACP](/es/tools/acp-agents) — descripción general, guía operativa, conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
