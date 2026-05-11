---
read_when:
    - Configuración de integraciones de IDE basadas en ACP
    - Depuración del enrutamiento de sesiones ACP hacia el Gateway
summary: Ejecutar el puente ACP para integraciones con IDE
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:25:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

Ejecuta el puente de [Protocolo de Cliente de Agente (ACP)](https://agentclientprotocol.com/) que se comunica con un Gateway de OpenClaw.

Este comando habla ACP sobre stdio para IDEs y reenvía prompts al Gateway
sobre WebSocket. Mantiene las sesiones de ACP asignadas a claves de sesión del Gateway.

`openclaw acp` es un puente ACP respaldado por Gateway, no un runtime de editor
completamente nativo de ACP. Se centra en el enrutamiento de sesiones, la entrega
de prompts y las actualizaciones básicas de streaming.

Si quieres que un cliente MCP externo se comunique directamente con conversaciones
de canales de OpenClaw en lugar de alojar una sesión de arnés ACP, usa
[`openclaw mcp serve`](/es/cli/mcp) en su lugar.

## Qué no es esto

Esta página suele confundirse con las sesiones de arnés ACP.

`openclaw acp` significa:

- OpenClaw actúa como servidor ACP
- un IDE o cliente ACP se conecta a OpenClaw
- OpenClaw reenvía ese trabajo a una sesión de Gateway

Esto es distinto de [Agentes ACP](/es/tools/acp-agents), donde OpenClaw ejecuta un
arnés externo como Codex o Claude Code mediante `acpx`.

Regla rápida:

- el editor/cliente quiere hablar ACP con OpenClaw: usa `openclaw acp`
- OpenClaw debe iniciar Codex/Claude/Gemini como arnés ACP: usa `/acp spawn` y [Agentes ACP](/es/tools/acp-agents)

## Matriz de compatibilidad

| Área de ACP                                                          | Estado          | Notas                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                       | Implementado    | Flujo principal del puente sobre stdio hacia chat/send + abort del Gateway.                                                                                                                                                                               |
| `listSessions`, comandos de barra                                    | Implementado    | La lista de sesiones funciona contra el estado de sesiones del Gateway con paginación de cursor limitada y filtrado por `cwd` cuando las filas de sesión del Gateway incluyen metadatos de espacio de trabajo; los comandos se anuncian mediante `available_commands_update`. |
| Metadatos de linaje de sesión                                        | Implementado    | Las listas de sesiones y las instantáneas de información de sesión incluyen el linaje padre e hijo de OpenClaw en `_meta` para que los clientes ACP puedan renderizar grafos de subagentes sin canales laterales privados del Gateway.                    |
| `resumeSession`, `closeSession`                                      | Implementado    | Reanudar vuelve a vincular una sesión ACP a una sesión de Gateway existente sin reproducir el historial. Cerrar cancela el trabajo activo del puente, resuelve los prompts pendientes como cancelados y libera el estado de sesión del puente.             |
| `loadSession`                                                        | Parcial         | Vuelve a vincular la sesión ACP a una clave de sesión de Gateway y reproduce el historial del registro de eventos ACP para sesiones creadas por el puente. Las sesiones antiguas o sin registro recurren al texto de usuario/asistente almacenado.        |
| Contenido de prompt (`text`, `resource` incrustado, imágenes)         | Parcial         | El texto y los recursos se aplanan en la entrada de chat; las imágenes se convierten en adjuntos del Gateway.                                                                                                                                             |
| Modos de sesión                                                      | Parcial         | `session/set_mode` es compatible y el puente expone controles de sesión iniciales respaldados por Gateway para nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones elevadas. Las superficies más amplias de modo/configuración nativas de ACP siguen fuera de alcance. |
| Información de sesión y actualizaciones de uso                       | Parcial         | El puente emite notificaciones `session_info_update` y `usage_update` de mejor esfuerzo a partir de instantáneas de sesión del Gateway en caché. El uso es aproximado y solo se envía cuando los totales de tokens del Gateway están marcados como recientes. |
| Streaming de herramientas                                            | Parcial         | Los eventos `tool_call` / `tool_call_update` incluyen E/S sin procesar, contenido de texto y ubicaciones de archivos de mejor esfuerzo cuando los args/resultados de herramientas del Gateway los exponen. Las terminales incrustadas y una salida nativa de diffs más completa aún no se exponen. |
| Aprobaciones de exec                                                 | Parcial         | Los prompts de aprobación de exec del Gateway durante turnos activos de prompt ACP se retransmiten al cliente ACP con `session/request_permission`.                                                                                                      |
| Servidores MCP por sesión (`mcpServers`)                             | No compatible   | El modo puente rechaza solicitudes de servidores MCP por sesión. Configura MCP en el gateway o agente de OpenClaw en su lugar.                                                                                                                            |
| Métodos de sistema de archivos del cliente (`fs/read_text_file`, `fs/write_text_file`) | No compatible | El puente no llama a métodos de sistema de archivos del cliente ACP.                                                                                                                                                                                      |
| Métodos de terminal del cliente (`terminal/*`)                       | No compatible   | El puente no crea terminales de cliente ACP ni transmite ids de terminal mediante llamadas a herramientas.                                                                                                                                                |
| Planes de sesión / streaming de pensamiento                          | No compatible   | Actualmente el puente emite texto de salida y estado de herramientas, no actualizaciones de planes o pensamientos ACP.                                                                                                                                    |

## Limitaciones conocidas

- `loadSession` puede reproducir el historial completo del registro de eventos ACP solo para
  sesiones creadas por el puente. Las sesiones antiguas o sin registro aún usan el recurso
  de respaldo de transcripción y no reconstruyen llamadas de herramientas históricas ni avisos del sistema.
- Si varios clientes ACP comparten la misma clave de sesión de Gateway, el enrutamiento de eventos y cancelaciones
  es de mejor esfuerzo en lugar de estar estrictamente aislado por cliente. Prefiere las
  sesiones aisladas predeterminadas `acp:<uuid>` cuando necesites turnos locales del editor
  limpios.
- Los estados de detención del Gateway se traducen a motivos de detención ACP, pero esa asignación es
  menos expresiva que un runtime completamente nativo de ACP.
- Actualmente, los controles iniciales de sesión exponen un subconjunto centrado de opciones del Gateway:
  nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones
  elevadas. La selección de modelo y los controles de host de exec aún no se exponen como
  opciones de configuración ACP.
- `session_info_update` y `usage_update` se derivan de instantáneas de sesión del Gateway,
  no de contabilidad en vivo de runtime nativo de ACP. El uso es aproximado,
  no incluye datos de costo y solo se emite cuando el Gateway marca los datos totales
  de tokens como recientes.
- Los datos de acompañamiento de herramientas son de mejor esfuerzo. El puente puede mostrar rutas de archivos que
  aparecen en args/resultados de herramientas conocidos, pero aún no emite terminales ACP ni
  diffs de archivos estructurados.
- La retransmisión de aprobación de exec se limita al turno activo de prompt ACP; se ignoran las aprobaciones de
  otras sesiones de Gateway.

## Uso

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## Cliente ACP (depuración)

Usa el cliente ACP integrado para comprobar rápidamente el puente sin un IDE.
Inicia el puente ACP y te permite escribir prompts de forma interactiva.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permisos (modo de depuración del cliente):

- La aprobación automática se basa en una lista de permitidos y solo se aplica a IDs de herramientas principales de confianza.
- La aprobación automática de `read` se limita al directorio de trabajo actual (`--cwd` cuando está definido).
- ACP solo aprueba automáticamente clases estrechas de solo lectura: llamadas `read` acotadas bajo el cwd activo más herramientas de búsqueda de solo lectura (`search`, `web_search`, `memory_search`). Las herramientas desconocidas/no principales, lecturas fuera de alcance, herramientas capaces de exec, herramientas de plano de control, herramientas mutantes y flujos interactivos siempre requieren aprobación explícita del prompt.
- El `toolCall.kind` proporcionado por el servidor se trata como metadatos no confiables (no como fuente de autorización).
- Esta política de puente ACP es independiente de los permisos de arnés ACPX. Si ejecutas OpenClaw mediante el backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` es el interruptor de emergencia "yolo" para esa sesión de arnés.

## Prueba rápida del protocolo

Para depuración a nivel de protocolo, inicia un Gateway con estado aislado y controla
`openclaw acp` sobre stdio con un cliente JSON-RPC de ACP. Cubre `initialize`,
`session/new`, `session/list` con un `cwd` absoluto, `session/resume`,
`session/close`, cierre duplicado y reanudación ausente.

La prueba debe incluir las capacidades de ciclo de vida anunciadas, una fila de sesión
respaldada por Gateway, notificaciones de actualización y el registro `sessions.list` del Gateway:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Evita usar `openclaw gateway call sessions.list` como la única prueba de ACP. Esa
ruta de CLI puede solicitar una actualización de alcance de operador con token reciente; la
corrección del puente ACP se demuestra con tramas ACP stdio más el registro `sessions.list` del Gateway.

## Cómo usar esto

Usa ACP cuando un IDE (u otro cliente) habla Agent Client Protocol y quieres
que controle una sesión de Gateway de OpenClaw.

1. Asegúrate de que el Gateway esté en ejecución (local o remoto).
2. Configura el destino del Gateway (configuración o flags).
3. Apunta tu IDE para ejecutar `openclaw acp` sobre stdio.

Configuración de ejemplo (persistida):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Ejecución directa de ejemplo (sin escribir configuración):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selección de agentes

ACP no elige agentes directamente. Enruta por la clave de sesión del Gateway.

Usa claves de sesión con alcance de agente para dirigirte a un agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sesión de ACP se asigna a una única clave de sesión de Gateway. Un agente puede tener muchas
sesiones; ACP usa de forma predeterminada una sesión aislada `acp:<uuid>` a menos que sobrescribas
la clave o la etiqueta.

Los `mcpServers` por sesión no son compatibles en modo puente. Si un cliente de ACP
los envía durante `newSession` o `loadSession`, el puente devuelve un error claro
en lugar de ignorarlos silenciosamente.

Si quieres que las sesiones respaldadas por ACPX vean herramientas de plugin de OpenClaw o herramientas
integradas seleccionadas como `cron`, habilita los puentes MCP de ACPX del lado del gateway en lugar
de intentar pasar `mcpServers` por sesión. Consulta
[Agentes ACP](/es/tools/acp-agents-setup#plugin-tools-mcp-bridge) y
[Puente MCP de herramientas de OpenClaw](/es/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Usar desde `acpx` (Codex, Claude, otros clientes de ACP)

Si quieres que un agente de programación como Codex o Claude Code hable con tu
bot de OpenClaw mediante ACP, usa `acpx` con su destino `openclaw` integrado.

Flujo típico:

1. Ejecuta el Gateway y asegúrate de que el puente ACP pueda alcanzarlo.
2. Apunta `acpx openclaw` a `openclaw acp`.
3. Dirige el agente de programación a la clave de sesión de OpenClaw que quieres que use.

Ejemplos:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si quieres que `acpx openclaw` apunte a un Gateway y una clave de sesión específicos cada
vez, sobrescribe el comando del agente `openclaw` en `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para un checkout local del repositorio de OpenClaw, usa el punto de entrada directo de la CLI en lugar del
ejecutor de desarrollo para que el flujo ACP se mantenga limpio. Por ejemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta es la forma más sencilla de permitir que Codex, Claude Code u otro cliente compatible con ACP
obtenga información contextual de un agente de OpenClaw sin extraer datos de una terminal.

## Configuración del editor Zed

Añade un agente ACP personalizado en `~/.config/zed/settings.json` (o usa la interfaz de configuración de Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Para apuntar a un Gateway o agente específico:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

En Zed, abre el panel de agentes y selecciona "OpenClaw ACP" para iniciar un hilo.

## Asignación de sesiones

De forma predeterminada, las sesiones de ACP reciben una clave de sesión de Gateway aislada con el prefijo `acp:`.
Para reutilizar una sesión conocida, pasa una clave o etiqueta de sesión:

- `--session <key>`: usa una clave de sesión de Gateway específica.
- `--session-label <label>`: resuelve una sesión existente por etiqueta.
- `--reset-session`: acuña un id de sesión nuevo para esa clave (misma clave, nueva transcripción).

Si tu cliente de ACP admite metadatos, puedes sobrescribirlos por sesión:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Obtén más información sobre las claves de sesión en [/concepts/session](/es/concepts/session).

## Opciones

- `--url <url>`: URL de WebSocket de Gateway (usa de forma predeterminada gateway.remote.url cuando está configurada).
- `--token <token>`: token de autenticación de Gateway.
- `--token-file <path>`: lee el token de autenticación de Gateway desde un archivo.
- `--password <password>`: contraseña de autenticación de Gateway.
- `--password-file <path>`: lee la contraseña de autenticación de Gateway desde un archivo.
- `--session <key>`: clave de sesión predeterminada.
- `--session-label <label>`: etiqueta de sesión predeterminada que se debe resolver.
- `--require-existing`: falla si la clave/etiqueta de sesión no existe.
- `--reset-session`: restablece la clave de sesión antes del primer uso.
- `--no-prefix-cwd`: no antepone el directorio de trabajo a los prompts.
- `--provenance <off|meta|meta+receipt>`: incluye metadatos o recibos de procedencia de ACP.
- `--verbose, -v`: registro detallado en stderr.

Nota de seguridad:

- `--token` y `--password` pueden ser visibles en los listados de procesos locales en algunos sistemas.
- Prefiere `--token-file`/`--password-file` o variables de entorno (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La resolución de autenticación de Gateway sigue el contrato compartido usado por otros clientes de Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> reserva `gateway.remote.*` solo cuando `gateway.auth.*` no está definido (las SecretRefs locales configuradas pero no resueltas fallan de forma cerrada)
  - modo remoto: `gateway.remote.*` con reserva env/config según las reglas de precedencia remota
  - `--url` es seguro como sobrescritura y no reutiliza credenciales implícitas de configuración/env; pasa `--token`/`--password` explícitos (o variantes de archivo)
- Los procesos secundarios del backend de ejecución de ACP reciben `OPENCLAW_SHELL=acp`, que puede usarse para reglas de shell/perfil específicas del contexto.
- `openclaw acp client` establece `OPENCLAW_SHELL=acp-client` en el proceso de puente generado.

### Opciones de `acp client`

- `--cwd <dir>`: directorio de trabajo para la sesión ACP.
- `--server <command>`: comando del servidor ACP (predeterminado: `openclaw`).
- `--server-args <args...>`: argumentos adicionales pasados al servidor ACP.
- `--server-verbose`: habilita el registro detallado en el servidor ACP.
- `--verbose, -v`: registro detallado del cliente.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Agentes ACP](/es/tools/acp-agents)
