---
read_when:
    - Instalar o configurar el arnés acpx para Claude Code / Codex / Gemini CLI
    - Habilitar el puente MCP plugin-tools u OpenClaw-tools
    - Configurar los modos de permisos de ACP
summary: 'Configuración de agentes ACP: configuración del arnés acpx, configuración de Plugin, permisos'
title: Agentes ACP — configuración
x-i18n:
    generated_at: "2026-04-30T06:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para obtener la descripción general, el runbook del operador y los conceptos, consulta [agentes ACP](/es/tools/acp-agents).

Las secciones siguientes cubren la configuración del arnés acpx, la configuración de plugins para los puentes MCP y la configuración de permisos.

Usa esta página solo cuando estés configurando la ruta ACP/acpx. Para la configuración de runtime del servidor de aplicaciones nativo de Codex, usa [arnés de Codex](/es/plugins/codex-harness). Para claves de API de OpenAI o configuración del proveedor de modelos OAuth de Codex, usa
[OpenAI](/es/providers/openai).

Codex tiene dos rutas de OpenClaw:

| Ruta                       | Configuración/comando                                  | Página de configuración                  |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| Servidor de aplicaciones nativo de Codex | `/codex ...`, `agentRuntime.id: "codex"`               | [arnés de Codex](/es/plugins/codex-harness) |
| Adaptador ACP explícito de Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                              |

Prefiere la ruta nativa salvo que necesites explícitamente el comportamiento ACP/acpx.

## Compatibilidad del arnés acpx (actual)

Alias actuales del arnés integrado de acpx:

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

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId` salvo que tu configuración de acpx defina alias de agente personalizados.
Si tu instalación local de Cursor aún expone ACP como `agent acp`, sobrescribe el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de acpx CLI también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de acpx CLI (no la ruta normal `agentId` de OpenClaw).

El control del modelo depende de las capacidades del adaptador. Las referencias de modelo de Codex ACP son normalizadas por OpenClaw antes del inicio. Otros arneses necesitan `models` de ACP más compatibilidad con `session/set_model`; si un arnés no expone ni esa capacidad de ACP ni su propia marca de modelo de inicio, OpenClaw/acpx no puede forzar una selección de modelo.

## Configuración requerida

Base de ACP principal:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si el spawn de ACP vinculado a hilo no funciona, verifica primero la marca de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Los enlaces de conversación actual no requieren la creación de hilos secundarios. Requieren un contexto de conversación activo y un adaptador de canal que exponga enlaces de conversación ACP.

Consulta la [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración de Plugin para backend acpx

Las instalaciones nuevas incluyen el plugin de runtime `acpx` empaquetado y habilitado de forma predeterminada, por lo que ACP normalmente funciona sin un paso manual de instalación de plugins.

Comienza con:

```text
/acp doctor
```

Si deshabilitaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres cambiar a un checkout de desarrollo local, usa la ruta explícita del plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación de workspace local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica la salud del backend:

```text
/acp doctor
```

### Configuración de comando y versión de acpx

De forma predeterminada, el plugin `acpx` empaquetado registra el backend ACP embebido sin generar un agente ACP durante el inicio del Gateway. Ejecuta `/acp doctor` para una prueba activa explícita. Define `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` solo cuando necesites que el Gateway pruebe el agente configurado al inicio.

Sobrescribe el comando o la versión en la configuración del plugin:

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
- `expectedVersion: "any"` deshabilita la coincidencia estricta de versión.
- Las rutas `command` personalizadas deshabilitan la instalación automática local del plugin.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las dependencias de runtime de acpx (binarios específicos de la plataforma) se instalan automáticamente mediante un hook postinstall. Si la instalación automática falla, el Gateway igualmente se inicia con normalidad e informa la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de plugin

De forma predeterminada, las sesiones ACPX **no** exponen herramientas registradas por plugins de OpenClaw al arnés ACP.

Si quieres que agentes ACP como Codex o Claude Code llamen a herramientas de plugins instalados de OpenClaw, como recuperación/almacenamiento de memoria, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el bootstrap de sesión ACPX.
- Expone herramientas de plugins ya registradas por plugins de OpenClaw instalados y habilitados.
- Mantiene la función explícita y desactivada de forma predeterminada.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del arnés ACP.
- Los agentes ACP obtienen acceso solo a herramientas de plugins ya activas en el Gateway.
- Trata esto como el mismo límite de confianza que permitir que esos plugins se ejecuten en OpenClaw mismo.
- Revisa los plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de plugins es una comodidad adicional opcional, no un reemplazo de la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco exponen herramientas integradas de OpenClaw mediante MCP. Habilita el puente separado de herramientas principales cuando un agente ACP necesite herramientas integradas seleccionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el bootstrap de sesión ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene la exposición de herramientas principales explícita y desactivada de forma predeterminada.

### Configuración de timeout de runtime

El plugin `acpx` empaquetado usa de forma predeterminada un timeout de 120 segundos para los turnos de runtime embebido. Esto da a arneses más lentos, como Gemini CLI, tiempo suficiente para completar el arranque y la inicialización de ACP. Sobrescríbelo si tu host necesita un límite de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicia el Gateway después de cambiar este valor.

### Configuración del agente de prueba de salud

Cuando `/acp doctor` o la prueba de inicio opcional revisa el backend, el plugin `acpx` empaquetado prueba un agente de arnés. Si `acp.allowedAgents` está definido, usa de forma predeterminada el primer agente permitido; de lo contrario, usa `codex`. Si tu despliegue necesita un agente ACP diferente para las comprobaciones de salud, define el agente de prueba explícitamente:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el Gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay TTY para aprobar o denegar prompts de permisos de escritura de archivos y ejecución de shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos de arnés ACPX son independientes de las aprobaciones de ejecución de OpenClaw y de las marcas de omisión del proveedor del backend CLI, como `--permission-mode bypassPermissions` de Claude CLI. `approve-all` de ACPX es el interruptor de emergencia a nivel de arnés para sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente del arnés sin solicitar confirmación.

| Valor           | Comportamiento                                           |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo lecturas; escrituras y ejecuciones requieren prompts. |
| `deny-all`      | Deniega todos los prompts de permisos.                   |

### `nonInteractivePermissions`

Controla qué ocurre cuando se mostraría un prompt de permiso pero no hay una TTY interactiva disponible (lo cual siempre es el caso para sesiones ACP).

| Valor  | Comportamiento                                                    |
| ------ | ----------------------------------------------------------------- |
| `fail` | Aborta la sesión con `AcpRuntimeError`. **(predeterminado)**      |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación gradual). |

### Configuración

Configúralo mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el Gateway después de cambiar estos valores.

<Warning>
OpenClaw usa de forma predeterminada `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active un prompt de permiso puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden gradualmente en lugar de fallar.
</Warning>

## Relacionado

- [agentes ACP](/es/tools/acp-agents) — descripción general, runbook del operador, conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
