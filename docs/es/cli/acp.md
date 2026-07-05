---
read_when:
    - Configuración de integraciones de IDE basadas en ACP
    - Depuración del enrutamiento de sesiones ACP al Gateway
summary: Ejecuta el puente ACP para integraciones de IDE
title: ACP
x-i18n:
    generated_at: "2026-07-05T11:08:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Ejecuta el puente [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica con un OpenClaw Gateway.

`openclaw acp` habla ACP por stdio para IDEs y reenvía prompts al Gateway por WebSocket, manteniendo las sesiones ACP asignadas a claves de sesión del Gateway. Es un puente ACP respaldado por Gateway, no un runtime de editor completamente nativo de ACP: se centra en el enrutamiento de sesiones, la entrega de prompts y las actualizaciones en streaming.

Si quieres que un cliente MCP externo hable directamente con conversaciones de canal de OpenClaw en lugar de alojar una sesión de arnés ACP, usa [`openclaw mcp serve`](/es/cli/mcp).

## Qué no es esto

`openclaw acp` significa que OpenClaw actúa como servidor ACP: un IDE o cliente ACP se conecta a OpenClaw, y OpenClaw reenvía ese trabajo a una sesión de Gateway.

Esto es diferente de [ACP Agents](/es/tools/acp-agents), donde OpenClaw ejecuta un arnés externo como Codex o Claude Code mediante `acpx`.

Regla rápida:

- el editor/cliente quiere hablar ACP con OpenClaw: usa `openclaw acp`
- OpenClaw debe lanzar Codex/Claude/Gemini como arnés ACP: usa `/acp spawn` y [ACP Agents](/es/tools/acp-agents)

## Matriz de compatibilidad

| Área ACP                                                              | Estado      | Notas                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado | Flujo central del puente por stdio hacia chat/send + abort de Gateway.                                                                                                                                                                |
| `listSessions`, comandos slash                                        | Implementado | La lista de sesiones funciona contra el estado de sesiones de Gateway con paginación de cursor acotada y filtrado por `cwd` cuando las filas de sesión de Gateway llevan metadatos de workspace; los comandos se anuncian mediante `available_commands_update`. |
| Metadatos de linaje de sesión                                         | Implementado | Los listados de sesiones y las instantáneas de información de sesión incluyen el linaje padre e hijo de OpenClaw en `_meta`, para que los clientes ACP puedan renderizar grafos de subagentes sin canales laterales privados de Gateway. |
| `resumeSession`, `closeSession`                                       | Implementado | Resume vuelve a enlazar una sesión ACP con una sesión de Gateway existente sin reproducir el historial. Close cancela el trabajo activo del puente, resuelve los prompts pendientes como cancelados y libera el estado de sesión del puente. |
| `loadSession`                                                         | Parcial     | Vuelve a enlazar la sesión ACP con una clave de sesión de Gateway y reproduce el historial del libro mayor de eventos ACP para sesiones creadas por el puente. Las sesiones antiguas/sin libro mayor recurren al texto de usuario/asistente almacenado. |
| Contenido de prompt (`text`, `resource` incrustado, imágenes)         | Parcial     | Texto/recursos se aplanan en la entrada de chat; las imágenes se convierten en adjuntos de Gateway.                                                                                                                                   |
| Modos de sesión                                                       | Parcial     | `session/set_mode` es compatible; el puente expone controles de sesión respaldados por Gateway para nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones elevadas. Las superficies más amplias de modo/configuración nativas de ACP siguen fuera de alcance. |
| Streaming de pensamiento                                              | Implementado | El contenido de pensamiento del modelo se transmite como actualizaciones de sesión `agent_thought_chunk`. No se emiten planes de sesión nativos de ACP.                                                                                |
| Información de sesión y actualizaciones de uso                        | Parcial     | El puente emite notificaciones `session_info_update` y `usage_update` de mejor esfuerzo desde instantáneas de sesión de Gateway en caché. El uso es aproximado y solo se envía cuando los totales de tokens de Gateway están marcados como frescos. |
| Streaming de herramientas                                             | Parcial     | Los eventos `tool_call`/`tool_call_update` incluyen E/S sin procesar, contenido de texto y ubicaciones de archivos de mejor esfuerzo cuando los argumentos/resultados de herramientas de Gateway las exponen. No se exponen terminales incrustadas ni salida más rica nativa de diffs. |
| Aprobaciones de exec                                                  | Parcial     | Los prompts de aprobación de exec de Gateway durante turnos activos de prompt ACP se retransmiten al cliente ACP con `session/request_permission`.                                                                                   |
| Servidores MCP por sesión (`mcpServers`)                              | No compatible | El modo puente rechaza solicitudes de servidor MCP por sesión. Configura MCP en el OpenClaw Gateway o en el agente.                                                                                                                   |
| Métodos de sistema de archivos del cliente (`fs/read_text_file`, `fs/write_text_file`) | No compatible | El puente no llama a métodos de sistema de archivos del cliente ACP.                                                                                                                                                                  |
| Métodos de terminal del cliente (`terminal/*`)                        | No compatible | El puente no crea terminales de cliente ACP ni transmite ids de terminal mediante llamadas de herramientas.                                                                                                                           |

## Limitaciones conocidas

- `loadSession` reproduce el historial completo del libro mayor de eventos ACP solo para sesiones creadas por el puente. Las sesiones antiguas/sin libro mayor usan una alternativa basada en transcripción y no reconstruyen llamadas históricas de herramientas ni avisos del sistema.
- Si varios clientes ACP comparten la misma clave de sesión de Gateway, el enrutamiento de eventos y cancelación es de mejor esfuerzo en lugar de estar estrictamente aislado por cliente. Prefiere las sesiones aisladas predeterminadas `acp-bridge:<uuid>` cuando necesites turnos locales de editor limpios.
- Los estados de parada de Gateway se traducen en motivos de parada ACP, pero ese mapeo es menos expresivo que un runtime completamente nativo de ACP.
- Los controles de sesión exponen un subconjunto enfocado de ajustes de Gateway: nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones elevadas. La selección de modelo y los controles de host de exec no se exponen como opciones de configuración ACP.
- `session_info_update` y `usage_update` derivan de instantáneas de sesión de Gateway, no de contabilidad de runtime nativa de ACP en vivo. El uso es aproximado, no incluye datos de coste y solo se emite cuando el Gateway marca los datos totales de tokens como frescos.
- Los datos de seguimiento de herramientas son de mejor esfuerzo: el puente expone rutas de archivo que aparecen en argumentos/resultados conocidos de herramientas, pero no emite terminales ACP ni diffs de archivo estructurados.
- La retransmisión de aprobación de exec está limitada al turno activo de prompt ACP; se ignoran aprobaciones de otras sesiones de Gateway.

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

Usa el cliente ACP integrado para comprobar rápidamente el puente sin un IDE. Genera el puente ACP y te permite escribir prompts de forma interactiva.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permisos (modo de depuración de cliente):

- La aprobación automática se basa en una lista de permitidos y se aplica solo a IDs de herramientas centrales de confianza.
- La aprobación automática de `read` está limitada al directorio de trabajo actual (`--cwd` cuando está configurado).
- ACP solo aprueba automáticamente clases estrechas de solo lectura: llamadas `read` acotadas bajo el cwd activo, además de herramientas de búsqueda de solo lectura (`search`, `web_search`, `memory_search`). Las herramientas desconocidas/no centrales, lecturas fuera de alcance, herramientas con capacidad de exec, herramientas de plano de control, herramientas mutadoras y flujos interactivos siempre requieren aprobación explícita del prompt.
- `toolCall.kind` proporcionado por el servidor se trata como metadatos no confiables, no como fuente de autorización.
- Esta política del puente ACP es independiente de los permisos del arnés ACPX. Si ejecutas OpenClaw mediante el backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` es el interruptor de emergencia "yolo" para esa sesión de arnés.

## Prueba smoke del protocolo

Para depuración a nivel de protocolo, inicia un Gateway con estado aislado y controla `openclaw acp` por stdio con un cliente JSON-RPC ACP. Cubre `initialize`, `session/new`, `session/list` con un `cwd` absoluto, `session/resume`, `session/close`, cierre duplicado y reanudación faltante.

La prueba debe incluir las capacidades de ciclo de vida anunciadas, una fila de sesión respaldada por Gateway, notificaciones de actualización y el registro `sessions.list` de Gateway:

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

Evita usar `openclaw gateway call sessions.list` como única prueba ACP. Esa ruta de CLI puede solicitar una elevación de alcance de operador con token fresco; la corrección del puente ACP se demuestra con frames stdio ACP más el registro `sessions.list` de Gateway.

## Cómo usar esto

Usa ACP cuando un IDE (u otro cliente) habla Agent Client Protocol y quieres que controle una sesión de OpenClaw Gateway.

1. Asegúrate de que el Gateway esté en ejecución (local o remoto).
2. Configura el destino de Gateway (configuración o flags).
3. Apunta tu IDE a ejecutar `openclaw acp` por stdio.

Ejemplo de configuración (persistida):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Ejemplo de ejecución directa (sin escribir configuración):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selección de agentes

ACP no elige agentes directamente. Enruta por la clave de sesión de Gateway. Usa claves de sesión con alcance de agente para apuntar a un agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sesión ACP se asigna a una sola clave de sesión de Gateway. Un agente puede tener muchas sesiones; ACP usa de forma predeterminada una sesión aislada `acp-bridge:<uuid>` a menos que sobrescribas la clave o la etiqueta.

Per-session `mcpServers` no son compatibles en modo puente. Si un cliente ACP los envía durante `newSession` o `loadSession`, el puente devuelve un error claro en lugar de ignorarlos silenciosamente.

Si quieres que las sesiones respaldadas por ACPX vean las herramientas de Plugin de OpenClaw o herramientas integradas seleccionadas como `cron`, habilita los puentes ACPX MCP del lado del Gateway en lugar de intentar pasar `mcpServers` por sesión. Consulta [Agentes ACP](/es/tools/acp-agents-setup#plugin-tools-mcp-bridge) y [puente MCP de herramientas de OpenClaw](/es/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Uso desde `acpx` (Codex, Claude, otros clientes ACP)

Si quieres que un agente de programación como Codex o Claude Code hable con tu bot de OpenClaw mediante ACP, usa `acpx` con su destino `openclaw` integrado.

Flujo típico:

1. Ejecuta el Gateway y asegúrate de que el puente ACP pueda alcanzarlo.
2. Apunta `acpx openclaw` a `openclaw acp`.
3. Dirige la clave de sesión de OpenClaw que quieres que use el agente de programación.

Ejemplos:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si quieres que `acpx openclaw` apunte siempre a un Gateway y una clave de sesión específicos, sobrescribe el comando del agente `openclaw` en `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para un checkout repo-local de OpenClaw, usa el punto de entrada directo de la CLI en lugar del ejecutor de desarrollo para que el flujo ACP permanezca limpio:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta es la forma más sencilla de permitir que Codex, Claude Code u otro cliente compatible con ACP extraiga información contextual de un agente de OpenClaw sin hacer scraping de una terminal.

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

En Zed, abre el panel Agent y selecciona "OpenClaw ACP" para iniciar un hilo.

## Asignación de sesiones

De forma predeterminada, las sesiones del puente ACP obtienen una clave de sesión de Gateway aislada con el prefijo `acp-bridge:`. Estas sesiones de puente de modelo normal son sintéticas y desechables: están sujetas a la depuración de entradas obsoletas y no se tratan como superficies protegidas de conversación humana. Para reutilizar una sesión conocida, pasa una clave o etiqueta de sesión:

- `--session <key>`: usa una clave de sesión de Gateway específica.
- `--session-label <label>`: resuelve una sesión existente por etiqueta.
- `--reset-session`: acuña un id de sesión nuevo para esa clave (misma clave, nueva transcripción).

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

- `--url <url>`: URL de WebSocket del Gateway (por defecto es `gateway.remote.url` cuando está configurado).
- `--token <token>`: token de autenticación del Gateway.
- `--token-file <path>`: lee el token de autenticación del Gateway desde un archivo.
- `--password <password>`: contraseña de autenticación del Gateway.
- `--password-file <path>`: lee la contraseña de autenticación del Gateway desde un archivo.
- `--session <key>`: clave de sesión predeterminada.
- `--session-label <label>`: etiqueta de sesión predeterminada que se debe resolver.
- `--require-existing`: falla si la clave/etiqueta de sesión no existe.
- `--reset-session`: restablece la clave de sesión antes del primer uso.
- `--no-prefix-cwd`: no antepone el directorio de trabajo a los prompts.
- `--provenance <off|meta|meta+receipt>`: incluye metadatos o recibos de procedencia de ACP.
- `--verbose, -v`: registro detallado en stderr.

Nota de seguridad:

- `--token` y `--password` pueden ser visibles en las listas de procesos locales en algunos sistemas. Prefiere `--token-file`/`--password-file` o variables de entorno (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La resolución de autenticación del Gateway sigue el contrato compartido usado por otros clientes del Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) y luego `gateway.auth.*`, recurriendo a `gateway.remote.*` solo cuando `gateway.auth.*` no está definido (un SecretRef local configurado pero no resuelto falla de forma cerrada en lugar de recurrir silenciosamente)
  - modo remoto: `gateway.remote.*` con respaldo env/config según las reglas de precedencia remota
  - `--url` es seguro para sobrescrituras y no reutiliza credenciales implícitas de config/env; pasa `--token`/`--password` explícitos (o variantes de archivo)

### Opciones de `acp client`

- `--cwd <dir>`: directorio de trabajo para la sesión ACP.
- `--server <command>`: comando del servidor ACP (predeterminado: `openclaw`).
- `--server-args <args...>`: argumentos adicionales pasados al servidor ACP.
- `--server-verbose`: habilita el registro detallado en el servidor ACP.
- `--verbose, -v`: registro detallado del cliente.
- `openclaw acp client` establece `OPENCLAW_SHELL=acp-client` en el proceso de puente generado, que puede usarse para reglas de shell/perfil específicas del contexto.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Agentes ACP](/es/tools/acp-agents)
