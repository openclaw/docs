---
read_when:
    - Configuración de integraciones de IDE basadas en ACP
    - Depuración del enrutamiento de sesiones ACP al Gateway
summary: Ejecutar el puente ACP para integraciones con IDE
title: ACP
x-i18n:
    generated_at: "2026-05-06T09:02:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

Ejecuta el puente de [Protocolo de cliente de agentes (ACP)](https://agentclientprotocol.com/) que se comunica con un OpenClaw Gateway.

Este comando habla ACP sobre stdio para IDE y reenvía prompts al Gateway
por WebSocket. Mantiene las sesiones ACP asignadas a claves de sesión de Gateway.

`openclaw acp` es un puente ACP respaldado por Gateway, no un runtime de editor
completamente nativo de ACP. Se centra en el enrutamiento de sesiones, la entrega
de prompts y las actualizaciones básicas de streaming.

Si quieres que un cliente MCP externo hable directamente con conversaciones de
canales de OpenClaw en lugar de hospedar una sesión de arnés ACP, usa
[`openclaw mcp serve`](/es/cli/mcp) en su lugar.

## Qué no es esto

Esta página se confunde a menudo con sesiones de arnés ACP.

`openclaw acp` significa:

- OpenClaw actúa como servidor ACP
- un IDE o cliente ACP se conecta a OpenClaw
- OpenClaw reenvía ese trabajo a una sesión de Gateway

Esto es diferente de [agentes ACP](/es/tools/acp-agents), donde OpenClaw ejecuta un
arnés externo como Codex o Claude Code mediante `acpx`.

Regla rápida:

- el editor/cliente quiere hablar ACP con OpenClaw: usa `openclaw acp`
- OpenClaw debe iniciar Codex/Claude/Gemini como arnés ACP: usa `/acp spawn` y [agentes ACP](/es/tools/acp-agents)

## Matriz de compatibilidad

| Área de ACP                                                           | Estado      | Notas                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado | Flujo principal del puente sobre stdio hacia chat/send + abort de Gateway.                                                                                                                                                                 |
| `listSessions`, comandos slash                                        | Implementado | La lista de sesiones funciona contra el estado de sesión de Gateway; los comandos se anuncian mediante `available_commands_update`.                                                                                                        |
| `loadSession`                                                         | Parcial     | Revincula la sesión ACP a una clave de sesión de Gateway y reproduce el historial de texto de usuario/asistente almacenado. El historial de herramientas/sistema aún no se reconstruye.                                                    |
| Contenido de prompt (`text`, `resource` integrado, imágenes)          | Parcial     | El texto y los recursos se aplanan en la entrada de chat; las imágenes se convierten en adjuntos de Gateway.                                                                                                                               |
| Modos de sesión                                                       | Parcial     | `session/set_mode` es compatible y el puente expone controles iniciales de sesión respaldados por Gateway para nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones elevadas. Superficies más amplias de modo/configuración nativas de ACP siguen fuera de alcance. |
| Información de sesión y actualizaciones de uso                        | Parcial     | El puente emite notificaciones `session_info_update` y `usage_update` de mejor esfuerzo a partir de instantáneas en caché de sesiones de Gateway. El uso es aproximado y solo se envía cuando los totales de tokens de Gateway están marcados como recientes. |
| Streaming de herramientas                                             | Parcial     | Los eventos `tool_call` / `tool_call_update` incluyen E/S sin procesar, contenido de texto y ubicaciones de archivo de mejor esfuerzo cuando los argumentos/resultados de herramientas de Gateway los exponen. Las terminales integradas y una salida nativa de diffs más rica aún no se exponen. |
| Servidores MCP por sesión (`mcpServers`)                              | No compatible | El modo puente rechaza solicitudes de servidores MCP por sesión. Configura MCP en el gateway o agente de OpenClaw en su lugar.                                                                                                             |
| Métodos de sistema de archivos del cliente (`fs/read_text_file`, `fs/write_text_file`) | No compatible | El puente no llama a métodos de sistema de archivos del cliente ACP.                                                                                                                                                                      |
| Métodos de terminal del cliente (`terminal/*`)                        | No compatible | El puente no crea terminales de cliente ACP ni transmite ids de terminal mediante llamadas de herramientas.                                                                                                                                |
| Planes de sesión / streaming de pensamiento                           | No compatible | Actualmente el puente emite texto de salida y estado de herramientas, no actualizaciones de planes o pensamiento ACP.                                                                                                                      |

## Limitaciones conocidas

- `loadSession` reproduce el historial de texto almacenado de usuario y
  asistente, pero no reconstruye llamadas históricas de herramientas, avisos del
  sistema ni tipos de eventos nativos de ACP más ricos.
- Si varios clientes ACP comparten la misma clave de sesión de Gateway, el
  enrutamiento de eventos y cancelaciones es de mejor esfuerzo en lugar de
  estar estrictamente aislado por cliente. Prefiere las sesiones aisladas
  `acp:<uuid>` predeterminadas cuando necesites turnos limpios locales al editor.
- Los estados de detención de Gateway se traducen a motivos de detención ACP,
  pero esa asignación es menos expresiva que un runtime completamente nativo de
  ACP.
- Los controles iniciales de sesión actualmente exponen un subconjunto enfocado
  de opciones de Gateway: nivel de pensamiento, verbosidad de herramientas,
  razonamiento, detalle de uso y acciones elevadas. La selección de modelo y los
  controles de host de ejecución aún no se exponen como opciones de configuración
  ACP.
- `session_info_update` y `usage_update` se derivan de instantáneas de sesión de
  Gateway, no de contabilidad de runtime nativa de ACP en vivo. El uso es
  aproximado, no incluye datos de costo y solo se emite cuando el Gateway marca
  los datos totales de tokens como recientes.
- Los datos de seguimiento de herramientas son de mejor esfuerzo. El puente
  puede mostrar rutas de archivos que aparecen en argumentos/resultados de
  herramientas conocidos, pero aún no emite terminales ACP ni diffs de archivo
  estructurados.

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
Genera el puente ACP y te permite escribir prompts de forma interactiva.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permisos (modo de depuración del cliente):

- La aprobación automática se basa en una lista de permitidos y solo se aplica a ids de herramientas centrales de confianza.
- La aprobación automática de `read` está limitada al directorio de trabajo actual (`--cwd` cuando se define).
- ACP solo aprueba automáticamente clases estrechas de solo lectura: llamadas `read` con alcance dentro del cwd activo más herramientas de búsqueda de solo lectura (`search`, `web_search`, `memory_search`). Las herramientas desconocidas/no centrales, lecturas fuera de alcance, herramientas capaces de ejecutar, herramientas del plano de control, herramientas mutables y flujos interactivos siempre requieren aprobación explícita del prompt.
- `toolCall.kind` proporcionado por el servidor se trata como metadatos no confiables (no como una fuente de autorización).
- Esta política del puente ACP es independiente de los permisos del arnés ACPX. Si ejecutas OpenClaw mediante el backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` es el interruptor de emergencia "yolo" para esa sesión de arnés.

## Cómo usar esto

Usa ACP cuando un IDE (u otro cliente) habla el Protocolo de cliente de agentes
y quieres que controle una sesión de OpenClaw Gateway.

1. Asegúrate de que el Gateway esté en ejecución (local o remoto).
2. Configura el destino del Gateway (configuración o flags).
3. Indica a tu IDE que ejecute `openclaw acp` sobre stdio.

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

ACP no elige agentes directamente. Enruta por la clave de sesión de Gateway.

Usa claves de sesión con alcance de agente para apuntar a un agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sesión ACP se asigna a una sola clave de sesión de Gateway. Un agente puede
tener muchas sesiones; ACP usa de forma predeterminada una sesión aislada
`acp:<uuid>` salvo que sobrescribas la clave o la etiqueta.

Los `mcpServers` por sesión no son compatibles en modo puente. Si un cliente ACP
los envía durante `newSession` o `loadSession`, el puente devuelve un error claro
en lugar de ignorarlos silenciosamente.

Si quieres que las sesiones respaldadas por ACPX vean herramientas de plugins de
OpenClaw o herramientas integradas seleccionadas como `cron`, habilita los
puentes MCP de ACPX del lado del gateway en lugar de intentar pasar `mcpServers`
por sesión. Consulta
[agentes ACP](/es/tools/acp-agents-setup#plugin-tools-mcp-bridge) y
[puente MCP de herramientas de OpenClaw](/es/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Uso desde `acpx` (Codex, Claude, otros clientes ACP)

Si quieres que un agente de programación como Codex o Claude Code hable con tu
bot de OpenClaw sobre ACP, usa `acpx` con su destino `openclaw` integrado.

Flujo típico:

1. Ejecuta el Gateway y asegúrate de que el puente ACP pueda alcanzarlo.
2. Apunta `acpx openclaw` a `openclaw acp`.
3. Apunta a la clave de sesión de OpenClaw que quieres que use el agente de programación.

Ejemplos:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si quieres que `acpx openclaw` apunte a un Gateway y una clave de sesión
específicos cada vez, sobrescribe el comando del agente `openclaw` en
`~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para un checkout de OpenClaw local al repo, usa el punto de entrada directo de la
CLI en lugar del ejecutor de desarrollo para que el stream ACP permanezca limpio.
Por ejemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta es la forma más sencilla de permitir que Codex, Claude Code u otro cliente
compatible con ACP extraiga información contextual de un agente de OpenClaw sin
scrapear una terminal.

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

En Zed, abre el panel de Agente y selecciona "OpenClaw ACP" para iniciar un hilo.

## Asignación de sesiones

De forma predeterminada, las sesiones ACP obtienen una clave de sesión de Gateway aislada con un prefijo `acp:`.
Para reutilizar una sesión conocida, pasa una clave o etiqueta de sesión:

- `--session <key>`: usa una clave de sesión de Gateway específica.
- `--session-label <label>`: resuelve una sesión existente por etiqueta.
- `--reset-session`: acuña un id de sesión nuevo para esa clave (misma clave, transcripción nueva).

Si tu cliente ACP admite metadatos, puedes sobrescribirlos por sesión:

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

- `--url <url>`: URL WebSocket de Gateway (usa gateway.remote.url de forma predeterminada cuando está configurada).
- `--token <token>`: token de autenticación de Gateway.
- `--token-file <path>`: lee el token de autenticación de Gateway desde un archivo.
- `--password <password>`: contraseña de autenticación de Gateway.
- `--password-file <path>`: lee la contraseña de autenticación de Gateway desde un archivo.
- `--session <key>`: clave de sesión predeterminada.
- `--session-label <label>`: etiqueta de sesión predeterminada que se resolverá.
- `--require-existing`: falla si la clave/etiqueta de sesión no existe.
- `--reset-session`: restablece la clave de sesión antes del primer uso.
- `--no-prefix-cwd`: no antepone el directorio de trabajo a los prompts.
- `--provenance <off|meta|meta+receipt>`: incluye metadatos de procedencia o recibos de ACP.
- `--verbose, -v`: registro detallado en stderr.

Nota de seguridad:

- `--token` y `--password` pueden ser visibles en los listados de procesos locales en algunos sistemas.
- Prefiere `--token-file`/`--password-file` o variables de entorno (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La resolución de autenticación de Gateway sigue el contrato compartido que usan otros clientes de Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> reserva `gateway.remote.*` solo cuando `gateway.auth.*` no está definido (las SecretRefs locales configuradas pero no resueltas fallan de forma cerrada)
  - modo remoto: `gateway.remote.*` con reserva env/config según las reglas de precedencia remota
  - `--url` es seguro como sobrescritura y no reutiliza credenciales implícitas de config/env; pasa `--token`/`--password` explícitos (o variantes de archivo)
- Los procesos secundarios del backend de tiempo de ejecución ACP reciben `OPENCLAW_SHELL=acp`, que puede usarse para reglas de shell/perfil específicas del contexto.
- `openclaw acp client` establece `OPENCLAW_SHELL=acp-client` en el proceso de puente generado.

### Opciones de `acp client`

- `--cwd <dir>`: directorio de trabajo para la sesión ACP.
- `--server <command>`: comando del servidor ACP (predeterminado: `openclaw`).
- `--server-args <args...>`: argumentos adicionales pasados al servidor ACP.
- `--server-verbose`: habilita el registro detallado en el servidor ACP.
- `--verbose, -v`: registro detallado del cliente.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Agentes ACP](/es/tools/acp-agents)
