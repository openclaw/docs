---
read_when:
    - Instalación o configuración del arnés acpx para Claude Code / Codex / Gemini CLI
    - Habilitación del puente MCP de plugin-tools u OpenClaw-tools
    - Configuración de los modos de permisos de ACP
summary: 'Configuración de agentes ACP: configuración del arnés acpx, configuración del Plugin, permisos'
title: Agentes ACP — configuración
x-i18n:
    generated_at: "2026-04-26T11:38:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Para la visión general, el runbook del operador y los conceptos, consulta [Agentes ACP](/es/tools/acp-agents).

Las secciones siguientes cubren la configuración del arnés acpx, la configuración del Plugin para los puentes MCP y la configuración de permisos.

Usa esta página solo cuando estés configurando la ruta ACP/acpx. Para la configuración nativa del entorno de ejecución app-server de Codex, usa [Arnés de Codex](/es/plugins/codex-harness). Para las claves de API de OpenAI o la configuración del proveedor de modelos de OAuth de Codex, usa [OpenAI](/es/providers/openai).

Codex tiene dos rutas de OpenClaw:

| Ruta                         | Configuración/comando                                  | Página de configuración                |
| ---------------------------- | ------------------------------------------------------ | -------------------------------------- |
| app-server nativo de Codex   | `/codex ...`, `agentRuntime.id: "codex"`               | [Arnés de Codex](/es/plugins/codex-harness) |
| Adaptador ACP explícito de Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                            |

Prefiere la ruta nativa a menos que necesites explícitamente el comportamiento de ACP/acpx.

## Compatibilidad del arnés acpx (actual)

Alias integrados actuales del arnés acpx:

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
Si tu instalación local de Cursor todavía expone ACP como `agent acp`, sustituye el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal de `agentId` de OpenClaw).

El control del modelo depende de las capacidades del adaptador. Las referencias de modelos ACP de Codex son
normalizadas por OpenClaw antes del arranque. Otros arneses necesitan ACP `models` más
compatibilidad con `session/set_model`; si un arnés no expone ni esa capacidad ACP
ni su propia marca de modelo al inicio, OpenClaw/acpx no puede forzar una selección de modelo.

## Configuración requerida

Línea base principal de ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. El valor predeterminado es true; establece false para pausar el despacho de ACP mientras mantienes los controles /acp.
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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si la generación de ACP vinculada a hilos no funciona, primero verifica la marca de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Las vinculaciones a la conversación actual no requieren la creación de hilos secundarios. Requieren un contexto de conversación activo y un adaptador de canal que exponga vinculaciones de conversación ACP.

Consulta la [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del Plugin para el backend acpx

Las instalaciones nuevas incluyen el Plugin de entorno de ejecución `acpx` empaquetado habilitado de forma predeterminada, por lo que ACP
normalmente funciona sin un paso manual de instalación del Plugin.

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

Instalación del espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica el estado del backend:

```text
/acp doctor
```

### Configuración del comando y de la versión de acpx

De forma predeterminada, el Plugin `acpx` empaquetado registra el backend ACP integrado sin
iniciar un agente ACP durante el arranque del Gateway. Ejecuta `/acp doctor` para una sonda en vivo
explícita. Establece `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` solo cuando necesites que el
Gateway sondee el agente configurado al inicio.

Sustituye el comando o la versión en la configuración del Plugin:

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
- `expectedVersion: "any"` deshabilita la coincidencia estricta de versiones.
- Las rutas `command` personalizadas deshabilitan la instalación automática local del Plugin.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las dependencias del entorno de ejecución de acpx
(binarios específicos de la plataforma) se instalan automáticamente
mediante un hook de postinstall. Si la instalación automática falla, el gateway sigue iniciándose
con normalidad y notifica la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de Plugin

De forma predeterminada, las sesiones ACPX **no** exponen las herramientas registradas por Plugins de OpenClaw al
arnés ACP.

Si quieres que agentes ACP como Codex o Claude Code llamen a herramientas instaladas
de Plugins de OpenClaw, como recuperación/almacenamiento de memoria, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el bootstrap de la sesión ACPX.
- Expone herramientas de Plugins ya registradas por Plugins de OpenClaw instalados y habilitados.
- Mantiene la función como explícita y desactivada de forma predeterminada.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del arnés ACP.
- Los agentes ACP obtienen acceso solo a las herramientas de Plugins ya activas en el gateway.
- Trátalo como el mismo límite de confianza que permitir que esos Plugins se ejecuten en el propio OpenClaw.
- Revisa los Plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de Plugin es
una comodidad adicional de adhesión voluntaria, no un reemplazo de la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco exponen herramientas integradas de OpenClaw mediante
MCP. Habilita el puente separado de herramientas principales cuando un agente ACP necesite herramientas integradas
seleccionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el bootstrap de la sesión ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene la exposición de herramientas principales como explícita y desactivada de forma predeterminada.

### Configuración del tiempo de espera del entorno de ejecución

El Plugin `acpx` empaquetado establece de forma predeterminada un tiempo de espera de 120 segundos
para los turnos del entorno de ejecución integrado. Esto da a arneses más lentos, como Gemini CLI, tiempo suficiente para completar
el inicio y la inicialización de ACP. Sustitúyelo si tu host necesita un límite de entorno de ejecución distinto:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicia el gateway después de cambiar este valor.

### Configuración del agente de sonda de estado

Cuando `/acp doctor` o la sonda de inicio opcional verifica el backend, el Plugin
`acpx` empaquetado sondea un agente de arnés. Si `acp.allowedAgents` está configurado,
el valor predeterminado es el primer agente permitido; en caso contrario, el valor predeterminado es `codex`. Si tu
implementación necesita un agente ACP distinto para las comprobaciones de estado, configura el agente de sonda
explícitamente:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay TTY para aprobar o denegar solicitudes de permiso de escritura de archivos y ejecución de shell. El Plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos del arnés ACPX son independientes de las aprobaciones de ejecución de OpenClaw y de las marcas de omisión del proveedor del backend CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia a nivel de arnés para las sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente del arnés sin solicitar confirmación.

| Valor           | Comportamiento                                           |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y los comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y la ejecución requieren solicitudes. |
| `deny-all`      | Deniega todas las solicitudes de permiso.                |

### `nonInteractivePermissions`

Controla qué ocurre cuando se mostraría una solicitud de permiso, pero no hay un TTY interactivo disponible (lo que siempre ocurre en las sesiones ACP).

| Valor  | Comportamiento                                                          |
| ------ | ----------------------------------------------------------------------- |
| `fail` | Interrumpe la sesión con `AcpRuntimeError`. **(predeterminado)**        |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación controlada). |

### Configuración

Configúralo mediante la configuración del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el gateway después de cambiar estos valores.

> **Importante:** OpenClaw actualmente usa `permissionMode=approve-reads` y `nonInteractivePermissions=fail` de forma predeterminada. En sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden de forma controlada en lugar de fallar.

## Relacionado

- [Agentes ACP](/es/tools/acp-agents) — visión general, runbook del operador, conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
