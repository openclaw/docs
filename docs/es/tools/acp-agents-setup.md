---
read_when:
    - Instalando o configurando el harness acpx para Claude Code / Codex / Gemini CLI
    - Habilitando el puente MCP de plugin-tools o OpenClaw-tools
    - Configurando modos de permisos ACP
summary: 'Configuración de agentes ACP: configuración del harness acpx, configuración del Plugin, permisos'
title: Agentes ACP — configuración
x-i18n:
    generated_at: "2026-04-24T05:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Para el resumen, el runbook del operador y los conceptos, consulta [Agentes ACP](/es/tools/acp-agents).
Esta página cubre la configuración del harness acpx, la configuración del Plugin para los puentes MCP y
la configuración de permisos.

## Compatibilidad actual del harness acpx

Alias integrados actuales del harness acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
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

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId` a menos que tu configuración de acpx defina alias de agente personalizados.
Si tu instalación local de Cursor todavía expone ACP como `agent acp`, anula el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor integrado predeterminado.

El uso directo de la CLI de acpx también puede dirigirse a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal `agentId` de OpenClaw).

## Configuración requerida

Base ACP core:

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

La configuración de enlaces de hilos es específica del adaptador de canal. Ejemplo para Discord:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si la generación de ACP enlazada a hilos no funciona, verifica primero la bandera de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Los enlaces a conversación actual no requieren creación de hilos secundarios. Requieren un contexto de conversación activo y un adaptador de canal que exponga enlaces de conversación ACP.

Consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del Plugin para el backend acpx

Las instalaciones nuevas se entregan con el Plugin de tiempo de ejecución `acpx` incluido habilitado de forma predeterminada, por lo que ACP normalmente funciona sin un paso manual de instalación del Plugin.

Empieza con:

```text
/acp doctor
```

Si deshabilitaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres
cambiar a una copia local de desarrollo, usa la ruta explícita del Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación desde espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica la salud del backend:

```text
/acp doctor
```

### Configuración de comando y versión de acpx

De forma predeterminada, el Plugin incluido `acpx` usa su binario fijado local al Plugin (`node_modules/.bin/acpx` dentro del paquete del Plugin). Al inicio, registra el backend como no preparado y una tarea en segundo plano verifica `acpx --version`; si el binario falta o no coincide, ejecuta `npm install --omit=dev --no-save acpx@<pinned>` y vuelve a verificar. El gateway sigue sin bloquearse durante todo el proceso.

Anula el comando o la versión en la configuración del Plugin:

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
- `expectedVersion: "any"` desactiva la comprobación estricta de versión.
- Las rutas `command` personalizadas desactivan la instalación automática local al Plugin.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las dependencias de tiempo de ejecución de acpx
(binarios específicos de plataforma) se instalan automáticamente
mediante un hook de postinstall. Si la instalación automática falla, el gateway sigue iniciándose
con normalidad e informa de la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de Plugin

De forma predeterminada, las sesiones ACPX **no** exponen herramientas registradas por Plugins de OpenClaw al
harness ACP.

Si quieres que agentes ACP como Codex o Claude Code puedan llamar a
herramientas de Plugin instaladas en OpenClaw como recuperación/almacenamiento de memoria, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el arranque
  de la sesión ACPX.
- Expone herramientas de Plugin ya registradas por Plugins de OpenClaw instalados y habilitados.
- Mantiene la función explícita y desactivada por defecto.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del harness ACP.
- Los agentes ACP obtienen acceso solo a herramientas de Plugin ya activas en el gateway.
- Trata esto como el mismo límite de confianza que permitir que esos Plugins se ejecuten en
  OpenClaw.
- Revisa los Plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de Plugin es
una comodidad adicional opcional, no un sustituto de la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco exponen herramientas integradas de OpenClaw mediante
MCP. Habilita el puente independiente de herramientas core cuando un agente ACP necesite herramientas
integradas seleccionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el arranque
  de la sesión ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene explícita y desactivada por defecto la exposición de herramientas core.

### Configuración del tiempo de espera del entorno de ejecución

El Plugin incluido `acpx` establece por defecto los turnos incrustados del entorno de ejecución en
120 segundos de tiempo de espera. Esto da suficiente tiempo a harnesses más lentos como Gemini CLI para completar
el arranque e inicialización de ACP. Anúlalo si tu host necesita un límite de tiempo distinto:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicia el gateway después de cambiar este valor.

### Configuración del agente de sondeo de salud

El Plugin incluido `acpx` sondea un agente de harness al decidir si el backend incrustado del entorno de ejecución está preparado. Por defecto usa `codex`. Si tu implementación usa un agente ACP predeterminado distinto, establece el agente de sondeo con ese mismo id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan sin interacción: no hay TTY para aprobar o denegar solicitudes de permisos de escritura de archivos y ejecución de shell. El Plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos del harness ACPX son independientes de las aprobaciones de ejecución de OpenClaw y también independientes de las banderas de omisión del proveedor para backends CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia a nivel de harness para sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente del harness sin preguntar.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo lecturas; las escrituras y ejecuciones requieren prompts. |
| `deny-all`      | Deniega todas las solicitudes de permisos.                |

### `nonInteractivePermissions`

Controla qué sucede cuando se mostraría una solicitud de permisos pero no hay TTY interactivo disponible (lo cual siempre ocurre en las sesiones ACP).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Aborta la sesión con `AcpRuntimeError`. **(predeterminado)**      |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación controlada). |

### Configuración

Establécelo mediante la configuración del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el gateway después de cambiar estos valores.

> **Importante:** OpenClaw actualmente usa por defecto `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permisos puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden de forma controlada en lugar de bloquearse.

## Relacionado

- [Agentes ACP](/es/tools/acp-agents) — resumen, runbook del operador, conceptos
- [Sub-agents](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
