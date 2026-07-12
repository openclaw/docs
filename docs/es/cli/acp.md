---
read_when:
    - Configuración de integraciones de IDE basadas en ACP
    - Depuración del enrutamiento de sesiones ACP al Gateway
summary: Ejecuta el puente ACP para las integraciones con IDE
title: ACP
x-i18n:
    generated_at: "2026-07-11T22:54:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Ejecuta el puente de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica con un Gateway de OpenClaw.

`openclaw acp` utiliza ACP a través de stdio para los IDE y reenvía las solicitudes al Gateway mediante WebSocket, manteniendo las sesiones ACP asignadas a claves de sesión del Gateway. Es un puente ACP respaldado por el Gateway, no un entorno de ejecución de editor totalmente nativo de ACP: se centra en el enrutamiento de sesiones, la entrega de solicitudes y las actualizaciones en streaming.

Si quieres que un cliente MCP externo se comunique directamente con las conversaciones de los canales de OpenClaw en lugar de alojar una sesión del entorno ACP, utiliza [`openclaw mcp serve`](/es/cli/mcp).

## Qué no es

`openclaw acp` significa que OpenClaw actúa como servidor ACP: un IDE o cliente ACP se conecta a OpenClaw, y OpenClaw reenvía ese trabajo a una sesión del Gateway.

Esto es diferente de los [agentes ACP](/es/tools/acp-agents), donde OpenClaw ejecuta un entorno externo como Codex o Claude Code mediante `acpx`.

Regla rápida:

- si el editor o cliente quiere comunicarse mediante ACP con OpenClaw: utiliza `openclaw acp`
- si OpenClaw debe iniciar Codex/Claude/Gemini como entorno ACP: utiliza `/acp spawn` y [agentes ACP](/es/tools/acp-agents)

## Matriz de compatibilidad

| Área de ACP                                                           | Estado        | Notas                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado  | Flujo principal del puente desde stdio hasta chat/send + abort del Gateway.                                                                                                                                                                                        |
| `listSessions`, comandos con barra                                    | Implementado  | La lista de sesiones funciona con el estado de las sesiones del Gateway, con paginación limitada mediante cursor y filtrado por `cwd` cuando las filas de sesión del Gateway contienen metadatos del espacio de trabajo; los comandos se anuncian mediante `available_commands_update`. |
| Metadatos de linaje de sesiones                                       | Implementado  | Las listas y las instantáneas de información de sesiones incluyen el linaje principal y secundario de OpenClaw en `_meta`, para que los clientes ACP puedan representar gráficos de subagentes sin canales laterales privados del Gateway.                           |
| `resumeSession`, `closeSession`                                       | Implementado  | La reanudación vuelve a vincular una sesión ACP con una sesión existente del Gateway sin reproducir el historial. El cierre cancela el trabajo activo del puente, resuelve como canceladas las solicitudes pendientes y libera el estado de sesión del puente.       |
| `loadSession`                                                         | Parcial       | Vuelve a vincular la sesión ACP con una clave de sesión del Gateway y reproduce el historial del registro de eventos ACP para las sesiones creadas por el puente. Las sesiones antiguas o sin registro recurren al texto almacenado del usuario y el asistente.      |
| Contenido de las solicitudes (`text`, `resource` incrustado, imágenes) | Parcial       | El texto y los recursos se convierten en una entrada de chat; las imágenes se convierten en archivos adjuntos del Gateway.                                                                                                                                         |
| Modos de sesión                                                       | Parcial       | Se admite `session/set_mode`; el puente expone controles de sesión respaldados por el Gateway para el nivel de pensamiento, la verbosidad de las herramientas, el razonamiento, el detalle de uso y las acciones con privilegios elevados. Las superficies más amplias de modos y configuración nativas de ACP siguen fuera del alcance. |
| Streaming de pensamiento                                              | Implementado  | El contenido de pensamiento del modelo se transmite como actualizaciones de sesión `agent_thought_chunk`. No se emiten planes de sesión nativos de ACP.                                                                                                            |
| Información de sesión y actualizaciones de uso                        | Parcial       | El puente emite notificaciones `session_info_update` y, en la medida de lo posible, `usage_update` a partir de instantáneas almacenadas en caché de las sesiones del Gateway. El uso es aproximado y solo se envía cuando los totales de tokens del Gateway están marcados como recientes. |
| Streaming de herramientas                                             | Parcial       | Los eventos `tool_call`/`tool_call_update` incluyen E/S sin procesar, contenido de texto y, en la medida de lo posible, ubicaciones de archivos cuando los argumentos o resultados de las herramientas del Gateway las exponen. No se exponen terminales incrustados ni salidas nativas de diferencias más completas. |
| Aprobaciones de ejecución                                             | Parcial       | Las solicitudes de aprobación de ejecución del Gateway durante turnos activos de solicitudes ACP se retransmiten al cliente ACP mediante `session/request_permission`.                                                                                              |
| Servidores MCP por sesión (`mcpServers`)                              | No compatible | El modo puente rechaza las solicitudes de servidores MCP por sesión. Configura MCP en el Gateway o el agente de OpenClaw.                                                                                                                                          |
| Métodos del sistema de archivos del cliente (`fs/read_text_file`, `fs/write_text_file`) | No compatible | El puente no invoca los métodos del sistema de archivos del cliente ACP.                                                                                                                                                                                           |
| Métodos de terminal del cliente (`terminal/*`)                        | No compatible | El puente no crea terminales del cliente ACP ni transmite identificadores de terminal mediante llamadas a herramientas.                                                                                                                                           |

## Limitaciones conocidas

- `loadSession` reproduce el historial completo del registro de eventos ACP únicamente para las sesiones creadas por el puente. Las sesiones antiguas o sin registro utilizan el historial de conversación como alternativa y no reconstruyen las llamadas históricas a herramientas ni los avisos del sistema.
- Si varios clientes ACP comparten la misma clave de sesión del Gateway, el enrutamiento de eventos y cancelaciones se realiza en la medida de lo posible, en lugar de estar estrictamente aislado por cliente. Cuando necesites turnos locales del editor claramente aislados, utiliza preferentemente las sesiones aisladas predeterminadas `acp-bridge:<uuid>`.
- Los estados de detención del Gateway se traducen en motivos de detención de ACP, pero esa correspondencia es menos expresiva que la de un entorno de ejecución totalmente nativo de ACP.
- Los controles de sesión exponen un subconjunto específico de ajustes del Gateway: nivel de pensamiento, verbosidad de las herramientas, razonamiento, detalle de uso y acciones con privilegios elevados. La selección del modelo y los controles del host de ejecución no se exponen como opciones de configuración de ACP.
- `session_info_update` y `usage_update` se derivan de instantáneas de las sesiones del Gateway, no de una contabilidad en tiempo real de un entorno de ejecución nativo de ACP. El uso es aproximado, no incluye datos de costes y solo se emite cuando el Gateway marca como recientes los datos de tokens totales.
- Los datos de seguimiento de herramientas se proporcionan en la medida de lo posible: el puente expone las rutas de archivo que aparecen en argumentos o resultados conocidos de herramientas, pero no emite terminales ACP ni diferencias estructuradas de archivos.
- La retransmisión de aprobaciones de ejecución se limita al turno activo de la solicitud ACP; se ignoran las aprobaciones procedentes de otras sesiones del Gateway.

## Uso

```bash
openclaw acp

# Gateway remoto
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token desde un archivo)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Asociarse a una clave de sesión existente
openclaw acp --session agent:main:main

# Asociarse mediante una etiqueta (debe existir previamente)
openclaw acp --session-label "support inbox"

# Restablecer la clave de sesión antes de la primera solicitud
openclaw acp --session agent:main:main --reset-session
```

## Cliente ACP (depuración)

Utiliza el cliente ACP integrado para realizar una comprobación básica del puente sin un IDE. Este inicia el puente ACP y permite escribir solicitudes de forma interactiva.

```bash
openclaw acp client

# Dirigir el puente iniciado a un Gateway remoto
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Sustituir el comando del servidor (valor predeterminado: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permisos (modo de depuración del cliente):

- La aprobación automática se basa en una lista de permitidos y se aplica únicamente a identificadores de herramientas principales de confianza.
- La aprobación automática de `read` se limita al directorio de trabajo actual (`--cwd` cuando se establece).
- ACP solo aprueba automáticamente clases de solo lectura muy específicas: llamadas `read` limitadas al directorio de trabajo activo, además de herramientas de búsqueda de solo lectura (`search`, `web_search`, `memory_search`). Las herramientas desconocidas o no principales, las lecturas fuera del ámbito, las herramientas con capacidad de ejecución, las herramientas del plano de control, las herramientas que realizan modificaciones y los flujos interactivos siempre requieren la aprobación explícita de la solicitud.
- El valor `toolCall.kind` proporcionado por el servidor se considera metadatos no fiables, no una fuente de autorización.
- Esta política del puente ACP es independiente de los permisos del entorno ACPX. Si ejecutas OpenClaw mediante el backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` es el interruptor de emergencia "yolo" para esa sesión del entorno.

## Pruebas básicas del protocolo

Para depurar a nivel de protocolo, inicia un Gateway con un estado aislado y controla `openclaw acp` mediante stdio con un cliente JSON-RPC de ACP. Incluye `initialize`, `session/new`, `session/list` con un `cwd` absoluto, `session/resume`, `session/close`, un cierre duplicado y una reanudación inexistente.

La prueba debe incluir las capacidades anunciadas del ciclo de vida, una fila de sesión respaldada por el Gateway, notificaciones de actualización y el registro `sessions.list` del Gateway:

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

Evita utilizar `openclaw gateway call sessions.list` como única prueba de ACP. Esa ruta de la CLI puede solicitar una ampliación del ámbito de operador mediante un token reciente; la corrección del puente ACP se demuestra con tramas de stdio de ACP y el registro `sessions.list` del Gateway.

## Cómo usarlo

Utiliza ACP cuando un IDE (u otro cliente) se comunique mediante Agent Client Protocol y quieras que controle una sesión del Gateway de OpenClaw.

1. Asegúrate de que el Gateway esté en ejecución (local o remoto).
2. Configura el destino del Gateway (mediante la configuración o las opciones).
3. Configura tu IDE para ejecutar `openclaw acp` mediante stdio.

Ejemplo de configuración (persistente):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Ejemplo de ejecución directa (sin escribir la configuración):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# opción preferida para la seguridad de los procesos locales
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selección de agentes

ACP no selecciona agentes directamente. Realiza el enrutamiento mediante la clave de sesión del Gateway. Utiliza claves de sesión limitadas a un agente para dirigirte a un agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sesión ACP se asigna a una única clave de sesión del Gateway. Un agente puede tener muchas sesiones; de forma predeterminada, ACP utiliza una sesión aislada `acp-bridge:<uuid>`, a menos que sustituyas la clave o la etiqueta.

Las opciones `mcpServers` por sesión no son compatibles con el modo puente. Si un cliente ACP las envía durante `newSession` o `loadSession`, el puente devuelve un error claro en lugar de ignorarlas silenciosamente.

Si desea que las sesiones respaldadas por ACPX vean las herramientas de plugins de OpenClaw o determinadas herramientas integradas, como `cron`, habilite los puentes MCP de ACPX en el Gateway en lugar de intentar pasar opciones `mcpServers` por sesión. Consulte [Agentes ACP](/es/tools/acp-agents-setup#plugin-tools-mcp-bridge) y [Puente MCP de herramientas de OpenClaw](/es/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Uso desde `acpx` (Codex, Claude y otros clientes ACP)

Si desea que un agente de programación, como Codex o Claude Code, se comunique con su bot de OpenClaw mediante ACP, use `acpx` con su destino `openclaw` integrado.

Flujo habitual:

1. Ejecute el Gateway y asegúrese de que el puente ACP pueda acceder a él.
2. Dirija `acpx openclaw` a `openclaw acp`.
3. Especifique la clave de sesión de OpenClaw que desea que use el agente de programación.

Ejemplos:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si desea que `acpx openclaw` utilice siempre un Gateway y una clave de sesión específicos, sustituya el comando del agente `openclaw` en `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para una copia de trabajo local del repositorio de OpenClaw, use el punto de entrada directo de la CLI en lugar del ejecutor de desarrollo para mantener limpio el flujo ACP:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta es la forma más sencilla de permitir que Codex, Claude Code u otro cliente compatible con ACP obtenga información contextual de un agente de OpenClaw sin extraerla de una terminal.

## Configuración del editor Zed

Añada un agente ACP personalizado en `~/.config/zed/settings.json` (o use la interfaz de configuración de Zed):

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

Para usar un Gateway o agente específico:

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

En Zed, abra el panel Agent y seleccione "OpenClaw ACP" para iniciar un hilo.

## Asignación de sesiones

De forma predeterminada, las sesiones del puente ACP reciben una clave de sesión aislada del Gateway con el prefijo `acp-bridge:`. Estas sesiones de puente de modelo normal son sintéticas y desechables: están sujetas a la eliminación de entradas obsoletas y no se consideran superficies protegidas de conversación humana. Para reutilizar una sesión conocida, pase una clave o etiqueta de sesión:

- `--session <key>`: usa una clave de sesión específica del Gateway.
- `--session-label <label>`: resuelve una sesión existente por su etiqueta.
- `--reset-session`: genera un nuevo identificador de sesión para esa clave (misma clave, nueva transcripción).

Si su cliente ACP admite metadatos, puede sustituirlos para cada sesión:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Obtenga más información sobre las claves de sesión en [/concepts/session](/es/concepts/session).

## Opciones

- `--url <url>`: URL de WebSocket del Gateway (de forma predeterminada, usa `gateway.remote.url` cuando está configurada).
- `--token <token>`: token de autenticación del Gateway.
- `--token-file <path>`: lee el token de autenticación del Gateway desde un archivo.
- `--password <password>`: contraseña de autenticación del Gateway.
- `--password-file <path>`: lee la contraseña de autenticación del Gateway desde un archivo.
- `--session <key>`: clave de sesión predeterminada.
- `--session-label <label>`: etiqueta de sesión predeterminada que se resolverá.
- `--require-existing`: falla si la clave o etiqueta de sesión no existe.
- `--reset-session`: restablece la clave de sesión antes del primer uso.
- `--no-prefix-cwd`: no antepone el directorio de trabajo a los mensajes.
- `--provenance <off|meta|meta+receipt>`: incluye metadatos o recibos de procedencia de ACP.
- `--verbose, -v`: registro detallado en stderr.

Nota de seguridad:

- `--token` y `--password` pueden aparecer en los listados de procesos locales de algunos sistemas. Prefiera `--token-file`/`--password-file` o variables de entorno (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La resolución de la autenticación del Gateway sigue el contrato compartido que utilizan otros clientes del Gateway:
  - modo local: variables de entorno (`OPENCLAW_GATEWAY_*`) y después `gateway.auth.*`; solo recurre a `gateway.remote.*` cuando `gateway.auth.*` no está definido (una SecretRef local configurada pero no resuelta falla de forma segura en lugar de recurrir silenciosamente a otra opción)
  - modo remoto: `gateway.remote.*` con la alternativa de variables de entorno/configuración según las reglas de precedencia remota
  - `--url` permite una sustitución segura y no reutiliza credenciales implícitas de la configuración ni del entorno; pase explícitamente `--token`/`--password` (o sus variantes de archivo)

### Opciones de `acp client`

- `--cwd <dir>`: directorio de trabajo de la sesión ACP.
- `--server <command>`: comando del servidor ACP (valor predeterminado: `openclaw`).
- `--server-args <args...>`: argumentos adicionales que se pasan al servidor ACP.
- `--server-verbose`: habilita el registro detallado en el servidor ACP.
- `--verbose, -v`: registro detallado del cliente.
- `openclaw acp client` establece `OPENCLAW_SHELL=acp-client` en el proceso de puente generado, lo que puede utilizarse para aplicar reglas de shell o perfil específicas del contexto.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Agentes ACP](/es/tools/acp-agents)
