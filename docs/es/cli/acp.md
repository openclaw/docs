---
read_when:
    - Configuración de integraciones de IDE basadas en ACP
    - Depuración del enrutamiento de sesiones ACP hacia el Gateway
summary: Ejecuta el puente ACP para integraciones con IDE
title: ACP
x-i18n:
    generated_at: "2026-06-27T10:55:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Ejecuta el puente [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica con un Gateway de OpenClaw.

Este comando habla ACP por stdio para IDEs y reenvía prompts al Gateway
por WebSocket. Mantiene las sesiones ACP asignadas a claves de sesión del Gateway.

`openclaw acp` es un puente ACP respaldado por Gateway, no un runtime de editor
completamente nativo de ACP. Se centra en el enrutamiento de sesiones, la entrega
de prompts y las actualizaciones básicas de streaming.

Si quieres que un cliente MCP externo hable directamente con conversaciones de
canal de OpenClaw en lugar de alojar una sesión de arnés ACP, usa
[`openclaw mcp serve`](/es/cli/mcp) en su lugar.

## Qué no es esto

Esta página se confunde a menudo con las sesiones de arnés ACP.

`openclaw acp` significa:

- OpenClaw actúa como servidor ACP
- un IDE o cliente ACP se conecta a OpenClaw
- OpenClaw reenvía ese trabajo a una sesión de Gateway

Esto es diferente de [Agentes ACP](/es/tools/acp-agents), donde OpenClaw ejecuta un
arnés externo como Codex o Claude Code mediante `acpx`.

Regla rápida:

- el editor/cliente quiere hablar ACP con OpenClaw: usa `openclaw acp`
- OpenClaw debe iniciar Codex/Claude/Gemini como arnés ACP: usa `/acp spawn` y [Agentes ACP](/es/tools/acp-agents)

## Matriz de compatibilidad

| Área ACP                                                              | Estado      | Notas                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado | Flujo de puente principal por stdio hacia chat/send + abort del Gateway.                                                                                                                                                                                        |
| `listSessions`, comandos slash                                        | Implementado | La lista de sesiones funciona contra el estado de sesión del Gateway con paginación por cursor acotada y filtrado por `cwd` cuando las filas de sesión del Gateway contienen metadatos de espacio de trabajo; los comandos se anuncian mediante `available_commands_update`.                                |
| Metadatos de linaje de sesión                                              | Implementado | Los listados de sesiones y las instantáneas de información de sesión incluyen el linaje padre e hijo de OpenClaw en `_meta` para que los clientes ACP puedan representar gráficos de subagentes sin canales laterales privados del Gateway.                                                                |
| `resumeSession`, `closeSession`                                       | Implementado | Reanudar vuelve a enlazar una sesión ACP con una sesión de Gateway existente sin reproducir el historial. Cerrar cancela el trabajo activo del puente, resuelve los prompts pendientes como cancelados y libera el estado de sesión del puente.                                              |
| `loadSession`                                                         | Parcial     | Vuelve a enlazar la sesión ACP con una clave de sesión de Gateway y reproduce el historial del libro mayor de eventos ACP para sesiones creadas por el puente. Las sesiones antiguas o sin libro mayor recurren al texto almacenado de usuario/asistente.                                                             |
| Contenido del prompt (`text`, `resource` incrustado, imágenes)                  | Parcial     | El texto y los recursos se aplanan en la entrada de chat; las imágenes se convierten en adjuntos del Gateway.                                                                                                                                                                 |
| Modos de sesión                                                         | Parcial     | `session/set_mode` está soportado y el puente expone controles iniciales de sesión respaldados por Gateway para nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones elevadas. Las superficies más amplias de modo/configuración nativas de ACP siguen fuera de alcance. |
| Información de sesión y actualizaciones de uso                                        | Parcial     | El puente emite notificaciones `session_info_update` y `usage_update` de mejor esfuerzo desde instantáneas de sesión del Gateway en caché. El uso es aproximado y solo se envía cuando los totales de tokens del Gateway están marcados como recientes.                                        |
| Streaming de herramientas                                                        | Parcial     | Los eventos `tool_call` / `tool_call_update` incluyen E/S sin procesar, contenido de texto y ubicaciones de archivos de mejor esfuerzo cuando los argumentos/resultados de herramientas del Gateway las exponen. Las terminales incrustadas y una salida más rica nativa de diffs aún no se exponen.                        |
| Aprobaciones de exec                                                        | Parcial     | Los prompts de aprobación de exec del Gateway durante turnos de prompt ACP activos se retransmiten al cliente ACP con `session/request_permission`.                                                                                                                    |
| Servidores MCP por sesión (`mcpServers`)                                | No soportado | El modo puente rechaza solicitudes de servidor MCP por sesión. Configura MCP en el gateway o agente de OpenClaw en su lugar.                                                                                                                                     |
| Métodos de sistema de archivos del cliente (`fs/read_text_file`, `fs/write_text_file`) | No soportado | El puente no llama a métodos de sistema de archivos del cliente ACP.                                                                                                                                                                                          |
| Métodos de terminal del cliente (`terminal/*`)                                | No soportado | El puente no crea terminales de cliente ACP ni transmite ids de terminal mediante llamadas de herramientas.                                                                                                                                                       |
| Planes de sesión / streaming de pensamiento                                     | No soportado | Actualmente el puente emite texto de salida y estado de herramientas, no actualizaciones de plan o pensamiento ACP.                                                                                                                                                         |

## Limitaciones conocidas

- `loadSession` puede reproducir el historial completo del libro mayor de eventos ACP solo para
  sesiones creadas por el puente. Las sesiones antiguas o sin libro mayor siguen usando el
  fallback de transcripción y no reconstruyen llamadas históricas a herramientas ni avisos del sistema.
- Si varios clientes ACP comparten la misma clave de sesión de Gateway, el enrutamiento de eventos y cancelaciones
  es de mejor esfuerzo en lugar de estar estrictamente aislado por cliente. Prefiere las
  sesiones aisladas predeterminadas `acp-bridge:<uuid>` cuando necesites turnos limpios locales del editor.
- Los estados de detención del Gateway se traducen a motivos de detención ACP, pero esa asignación es
  menos expresiva que un runtime completamente nativo de ACP.
- Los controles iniciales de sesión actualmente exponen un subconjunto enfocado de perillas del Gateway:
  nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones
  elevadas. La selección de modelo y los controles de host de exec aún no se exponen como opciones de
  configuración ACP.
- `session_info_update` y `usage_update` se derivan de instantáneas de sesión del Gateway,
  no de contabilidad en vivo de runtime nativa de ACP. El uso es aproximado,
  no contiene datos de costo y solo se emite cuando el Gateway marca los datos totales de
  tokens como recientes.
- Los datos de seguimiento de herramientas son de mejor esfuerzo. El puente puede exponer rutas de archivos que
  aparecen en argumentos/resultados de herramientas conocidos, pero aún no emite terminales ACP ni
  diffs de archivos estructurados.
- La retransmisión de aprobaciones de exec se limita al turno de prompt ACP activo; las aprobaciones de
  otras sesiones de Gateway se ignoran.

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

Modelo de permisos (modo de depuración de cliente):

- La aprobación automática se basa en una lista de permitidos y solo se aplica a IDs de herramientas centrales de confianza.
- La aprobación automática de `read` se limita al directorio de trabajo actual (`--cwd` cuando está configurado).
- ACP solo aprueba automáticamente clases estrechas de solo lectura: llamadas `read` con alcance bajo el cwd activo más herramientas de búsqueda de solo lectura (`search`, `web_search`, `memory_search`). Las herramientas desconocidas/no centrales, las lecturas fuera de alcance, las herramientas capaces de exec, las herramientas de plano de control, las herramientas mutantes y los flujos interactivos siempre requieren aprobación explícita del prompt.
- `toolCall.kind` proporcionado por el servidor se trata como metadatos no confiables (no como una fuente de autorización).
- Esta política del puente ACP es independiente de los permisos del arnés ACPX. Si ejecutas OpenClaw mediante el backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` es el interruptor "yolo" de emergencia para esa sesión de arnés.

## Pruebas rápidas del protocolo

Para la depuración a nivel de protocolo, inicia un Gateway con estado aislado y controla
`openclaw acp` por stdio con un cliente ACP JSON-RPC. Cubre `initialize`,
`session/new`, `session/list` con un `cwd` absoluto, `session/resume`,
`session/close`, cierre duplicado y reanudación faltante.

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

Evita usar `openclaw gateway call sessions.list` como única prueba ACP. Esa
ruta de CLI puede solicitar una actualización de alcance de operador con token reciente; la
corrección del puente ACP se demuestra con tramas stdio ACP más el registro `sessions.list` del Gateway.

## Cómo usar esto

Usa ACP cuando un IDE (u otro cliente) habla Agent Client Protocol y quieres
que controle una sesión de Gateway de OpenClaw.

1. Asegúrate de que el Gateway esté en ejecución (local o remoto).
2. Configura el destino del Gateway (configuración o flags).
3. Apunta tu IDE para ejecutar `openclaw acp` por stdio.

Configuración de ejemplo (persistida):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Ejecución directa de ejemplo (sin escritura de configuración):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selección de agentes

ACP no elige agentes directamente. Enruta por la clave de sesión del Gateway.

Usa claves de sesión con alcance de agente para apuntar a un agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sesión de ACP se asigna a una única clave de sesión del Gateway. Un agente puede tener muchas
sesiones; ACP usa de forma predeterminada una sesión aislada `acp-bridge:<uuid>`, a menos que sobrescribas
la clave o la etiqueta.

Los `mcpServers` por sesión no son compatibles en modo puente. Si un cliente ACP
los envía durante `newSession` o `loadSession`, el puente devuelve un error claro
en lugar de ignorarlos silenciosamente.

Si quieres que las sesiones respaldadas por ACPX vean las herramientas de Plugin de OpenClaw o herramientas
integradas seleccionadas como `cron`, habilita los puentes MCP de ACPX del lado del Gateway en lugar
de intentar pasar `mcpServers` por sesión. Consulta
[Agentes ACP](/es/tools/acp-agents-setup#plugin-tools-mcp-bridge) y
[puente MCP de herramientas de OpenClaw](/es/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Usar desde `acpx` (Codex, Claude, otros clientes ACP)

Si quieres que un agente de programación como Codex o Claude Code se comunique con tu
bot de OpenClaw mediante ACP, usa `acpx` con su destino `openclaw` integrado.

Flujo típico:

1. Ejecuta el Gateway y asegúrate de que el puente ACP pueda alcanzarlo.
2. Apunta `acpx openclaw` a `openclaw acp`.
3. Dirige a la clave de sesión de OpenClaw que quieres que use el agente de programación.

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
ejecutor de desarrollo para que el flujo ACP permanezca limpio. Por ejemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta es la forma más sencilla de permitir que Codex, Claude Code u otro cliente compatible con ACP
obtenga información contextual de un agente de OpenClaw sin extraerla de una terminal.

## Configuración del editor Zed

Agrega un agente ACP personalizado en `~/.config/zed/settings.json` (o usa la interfaz de configuración de Zed):

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

De forma predeterminada, las sesiones del puente ACP obtienen una clave de sesión de Gateway aislada con el
prefijo `acp-bridge:`. Estas sesiones de puente de modelo normal son sintéticas y
están sujetas a la eliminación de entradas obsoletas y a límites de recuento de entradas. Para reutilizar una sesión conocida,
pasa una clave o etiqueta de sesión:

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

- `--url <url>`: URL de WebSocket de Gateway (usa `gateway.remote.url` de forma predeterminada cuando está configurada).
- `--token <token>`: token de autenticación de Gateway.
- `--token-file <path>`: lee el token de autenticación de Gateway desde un archivo.
- `--password <password>`: contraseña de autenticación de Gateway.
- `--password-file <path>`: lee la contraseña de autenticación de Gateway desde un archivo.
- `--session <key>`: clave de sesión predeterminada.
- `--session-label <label>`: etiqueta de sesión predeterminada que se debe resolver.
- `--require-existing`: falla si la clave/etiqueta de sesión no existe.
- `--reset-session`: restablece la clave de sesión antes del primer uso.
- `--no-prefix-cwd`: no antepongas el directorio de trabajo a los prompts.
- `--provenance <off|meta|meta+receipt>`: incluye metadatos o recibos de procedencia de ACP.
- `--verbose, -v`: registro detallado en stderr.

Nota de seguridad:

- `--token` y `--password` pueden ser visibles en los listados de procesos locales en algunos sistemas.
- Prefiere `--token-file`/`--password-file` o variables de entorno (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La resolución de autenticación de Gateway sigue el contrato compartido usado por otros clientes de Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> reserva `gateway.remote.*` solo cuando `gateway.auth.*` no está definido (las SecretRefs locales configuradas pero no resueltas fallan de forma cerrada)
  - modo remoto: `gateway.remote.*` con reserva de env/config según las reglas de precedencia remota
  - `--url` es seguro como sobrescritura y no reutiliza credenciales implícitas de config/env; pasa `--token`/`--password` explícitos (o variantes de archivo)
- Los procesos secundarios del backend de runtime ACP reciben `OPENCLAW_SHELL=acp`, que puede usarse para reglas de shell/perfil específicas del contexto.
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
