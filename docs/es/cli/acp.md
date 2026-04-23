---
read_when:
    - Configuración de integraciones de IDE basadas en ACP
    - Depuración del enrutamiento de sesiones de ACP al Gateway
summary: Ejecuta el puente ACP para integraciones de IDE
title: ACP
x-i18n:
    generated_at: "2026-04-23T13:59:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

Ejecuta el puente [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica con un Gateway de OpenClaw.

Este comando usa ACP sobre stdio para IDEs y reenvía prompts al Gateway
mediante WebSocket. Mantiene las sesiones de ACP asignadas a claves de sesión del Gateway.

`openclaw acp` es un puente ACP respaldado por Gateway, no un entorno de
ejecución de editor totalmente nativo de ACP. Se centra en el enrutamiento de sesiones, la entrega
de prompts y actualizaciones básicas de streaming.

Si quieres que un cliente MCP externo se comunique directamente con conversaciones de canal de OpenClaw
en lugar de alojar una sesión de arnés ACP, usa
[`openclaw mcp serve`](/es/cli/mcp) en su lugar.

## Qué no es esto

Esta página suele confundirse con sesiones de arnés ACP.

`openclaw acp` significa:

- OpenClaw actúa como un servidor ACP
- un IDE o cliente ACP se conecta a OpenClaw
- OpenClaw reenvía ese trabajo a una sesión del Gateway

Esto es diferente de [ACP Agents](/es/tools/acp-agents), donde OpenClaw ejecuta un
arnés externo como Codex o Claude Code mediante `acpx`.

Regla rápida:

- si el editor/cliente quiere hablar ACP con OpenClaw: usa `openclaw acp`
- si OpenClaw debe iniciar Codex/Claude/Gemini como un arnés ACP: usa `/acp spawn` y [ACP Agents](/es/tools/acp-agents)

## Matriz de compatibilidad

| Área de ACP                                                           | Estado      | Notas                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado | Flujo principal del puente sobre stdio hacia chat/send + cancelación del Gateway.                                                                                                                                                                    |
| `listSessions`, comandos con barra                                    | Implementado | La lista de sesiones funciona con el estado de sesión del Gateway; los comandos se anuncian mediante `available_commands_update`.                                                                                                                     |
| `loadSession`                                                         | Parcial     | Vuelve a vincular la sesión ACP a una clave de sesión del Gateway y reproduce el historial almacenado de texto de usuario/asistente. El historial de herramientas/sistema todavía no se reconstruye.                                                |
| Contenido del prompt (`text`, `resource` incrustado, imágenes)        | Parcial     | El texto/los recursos se aplanan en la entrada del chat; las imágenes pasan a ser adjuntos del Gateway.                                                                                                                                             |
| Modos de sesión                                                       | Parcial     | `session/set_mode` es compatible y el puente expone controles iniciales de sesión respaldados por Gateway para nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones elevadas. Las superficies más amplias de modo/configuración nativas de ACP siguen fuera de alcance. |
| Información de sesión y actualizaciones de uso                        | Parcial     | El puente emite notificaciones `session_info_update` y `usage_update` de mejor esfuerzo a partir de instantáneas en caché de la sesión del Gateway. El uso es aproximado y solo se envía cuando los totales de tokens del Gateway están marcados como recientes. |
| Streaming de herramientas                                             | Parcial     | Los eventos `tool_call` / `tool_call_update` incluyen E/S sin procesar, contenido de texto y ubicaciones de archivos de mejor esfuerzo cuando los argumentos/resultados de herramientas del Gateway las exponen. Los terminales incrustados y la salida nativa de diferencias más rica todavía no se exponen. |
| Servidores MCP por sesión (`mcpServers`)                              | No compatible | El modo puente rechaza solicitudes de servidores MCP por sesión. Configura MCP en el Gateway o el agente de OpenClaw en su lugar.                                                                                                                   |
| Métodos de sistema de archivos del cliente (`fs/read_text_file`, `fs/write_text_file`) | No compatible | El puente no llama a métodos de sistema de archivos del cliente ACP.                                                                                                                                                                                 |
| Métodos de terminal del cliente (`terminal/*`)                        | No compatible | El puente no crea terminales de cliente ACP ni transmite IDs de terminal mediante llamadas de herramientas.                                                                                                                                          |
| Planes de sesión / streaming de pensamiento                           | No compatible | El puente actualmente emite texto de salida y estado de herramientas, no actualizaciones de planes o pensamiento de ACP.                                                                                                                             |

## Limitaciones conocidas

- `loadSession` reproduce el historial almacenado de texto de usuario y asistente, pero no
  reconstruye llamadas históricas de herramientas, avisos del sistema ni tipos de eventos
  nativos de ACP más ricos.
- Si varios clientes ACP comparten la misma clave de sesión del Gateway, el enrutamiento
  de eventos y cancelaciones es de mejor esfuerzo en lugar de estar estrictamente aislado
  por cliente. Prefiere las sesiones `acp:<uuid>` aisladas predeterminadas cuando necesites
  turnos locales del editor limpios.
- Los estados de detención del Gateway se traducen en motivos de detención de ACP, pero esa asignación es
  menos expresiva que la de un entorno de ejecución totalmente nativo de ACP.
- Los controles de sesión iniciales actualmente exponen un subconjunto concreto de controles del Gateway:
  nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y
  acciones elevadas. La selección de modelo y los controles de host de ejecución todavía no se exponen como
  opciones de configuración de ACP.
- `session_info_update` y `usage_update` se derivan de instantáneas de sesión del Gateway,
  no de contabilidad en vivo de un entorno nativo de ACP. El uso es aproximado,
  no incluye datos de costo y solo se emite cuando el Gateway marca como recientes los
  datos totales de tokens.
- Los datos de seguimiento de herramientas son de mejor esfuerzo. El puente puede mostrar rutas de archivos que
  aparezcan en argumentos/resultados de herramientas conocidos, pero todavía no emite terminales ACP ni
  diferencias de archivos estructuradas.

## Uso

```bash
openclaw acp

# Gateway remoto
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token desde archivo)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Adjuntarse a una clave de sesión existente
openclaw acp --session agent:main:main

# Adjuntarse por etiqueta (debe existir previamente)
openclaw acp --session-label "support inbox"

# Restablecer la clave de sesión antes del primer prompt
openclaw acp --session agent:main:main --reset-session
```

## Cliente ACP (depuración)

Usa el cliente ACP integrado para comprobar el puente sin un IDE.
Inicia el puente ACP y te permite escribir prompts de forma interactiva.

```bash
openclaw acp client

# Apuntar el puente iniciado a un Gateway remoto
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Reemplazar el comando del servidor (predeterminado: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permisos (modo de depuración del cliente):

- La aprobación automática se basa en lista de permitidos y solo se aplica a IDs de herramientas principales de confianza.
- La aprobación automática de `read` está limitada al directorio de trabajo actual (`--cwd` cuando está establecido).
- ACP solo aprueba automáticamente clases de solo lectura limitadas: llamadas `read` acotadas bajo el cwd activo más herramientas de búsqueda de solo lectura (`search`, `web_search`, `memory_search`). Las herramientas desconocidas/no principales, lecturas fuera de alcance, herramientas con capacidad de ejecución, herramientas de plano de control, herramientas mutables y flujos interactivos siempre requieren aprobación explícita por prompt.
- `toolCall.kind` proporcionado por el servidor se trata como metadatos no confiables (no como fuente de autorización).
- Esta política del puente ACP es independiente de los permisos de arnés ACPX. Si ejecutas OpenClaw mediante el backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` es el interruptor de emergencia “yolo” para esa sesión de arnés.

## Cómo usar esto

Usa ACP cuando un IDE (u otro cliente) hable Agent Client Protocol y quieras
que controle una sesión de Gateway de OpenClaw.

1. Asegúrate de que el Gateway esté en ejecución (local o remoto).
2. Configura el destino del Gateway (configuración o flags).
3. Configura tu IDE para ejecutar `openclaw acp` sobre stdio.

Ejemplo de configuración (persistente):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Ejemplo de ejecución directa (sin escribir configuración):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferido para la seguridad del proceso local
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selección de agentes

ACP no selecciona agentes directamente. Enruta según la clave de sesión del Gateway.

Usa claves de sesión con ámbito de agente para apuntar a un agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sesión ACP se asigna a una única clave de sesión del Gateway. Un agente puede tener muchas
sesiones; ACP usa de forma predeterminada una sesión aislada `acp:<uuid>` a menos que reemplaces
la clave o la etiqueta.

`mcpServers` por sesión no es compatible en modo puente. Si un cliente ACP
los envía durante `newSession` o `loadSession`, el puente devuelve un error claro
en lugar de ignorarlos silenciosamente.

Si quieres que las sesiones respaldadas por ACPX vean herramientas Plugin de OpenClaw o herramientas
integradas seleccionadas como `cron`, habilita los puentes MCP ACPX del lado del Gateway
en lugar de intentar pasar `mcpServers` por sesión. Consulta
[ACP Agents](/es/tools/acp-agents#plugin-tools-mcp-bridge) y
[OpenClaw tools MCP bridge](/es/tools/acp-agents#openclaw-tools-mcp-bridge).

## Uso desde `acpx` (Codex, Claude, otros clientes ACP)

Si quieres que un agente de programación como Codex o Claude Code hable con tu
bot de OpenClaw mediante ACP, usa `acpx` con su destino `openclaw` integrado.

Flujo típico:

1. Ejecuta el Gateway y asegúrate de que el puente ACP pueda alcanzarlo.
2. Apunta `acpx openclaw` a `openclaw acp`.
3. Apunta a la clave de sesión de OpenClaw que quieres que use el agente de programación.

Ejemplos:

```bash
# Solicitud única en tu sesión ACP predeterminada de OpenClaw
acpx openclaw exec "Summarize the active OpenClaw session state."

# Sesión persistente con nombre para turnos de seguimiento
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si quieres que `acpx openclaw` apunte a un Gateway específico y a una clave de sesión específica
siempre, reemplaza el comando del agente `openclaw` en `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para una copia local del repositorio de OpenClaw, usa el punto de entrada directo de la CLI en lugar del
ejecutor de desarrollo para que el stream ACP se mantenga limpio. Por ejemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta es la forma más sencilla de permitir que Codex, Claude Code u otro cliente compatible con ACP
extraiga información contextual de un agente de OpenClaw sin tener que raspar una terminal.

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

Para apuntar a un Gateway o agente específicos:

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

En Zed, abre el panel Agent y selecciona “OpenClaw ACP” para iniciar un hilo.

## Asignación de sesiones

De forma predeterminada, las sesiones ACP obtienen una clave de sesión de Gateway aislada con un prefijo `acp:`.
Para reutilizar una sesión conocida, pasa una clave o etiqueta de sesión:

- `--session <key>`: usa una clave de sesión específica del Gateway.
- `--session-label <label>`: resuelve una sesión existente por etiqueta.
- `--reset-session`: genera un id de sesión nuevo para esa clave (misma clave, nueva transcripción).

Si tu cliente ACP admite metadatos, puedes reemplazarlo por sesión:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Obtén más información sobre claves de sesión en [/concepts/session](/es/concepts/session).

## Opciones

- `--url <url>`: URL de WebSocket del Gateway (usa de forma predeterminada `gateway.remote.url` cuando está configurado).
- `--token <token>`: token de autenticación del Gateway.
- `--token-file <path>`: lee el token de autenticación del Gateway desde un archivo.
- `--password <password>`: contraseña de autenticación del Gateway.
- `--password-file <path>`: lee la contraseña de autenticación del Gateway desde un archivo.
- `--session <key>`: clave de sesión predeterminada.
- `--session-label <label>`: etiqueta de sesión predeterminada que se debe resolver.
- `--require-existing`: falla si la clave/etiqueta de sesión no existe.
- `--reset-session`: restablece la clave de sesión antes del primer uso.
- `--no-prefix-cwd`: no anteponer el directorio de trabajo a los prompts.
- `--provenance <off|meta|meta+receipt>`: incluye metadatos o comprobantes de procedencia de ACP.
- `--verbose, -v`: registro detallado en stderr.

Nota de seguridad:

- `--token` y `--password` pueden ser visibles en listados de procesos locales en algunos sistemas.
- Prefiere `--token-file`/`--password-file` o variables de entorno (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La resolución de autenticación del Gateway sigue el contrato compartido usado por otros clientes del Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> reserva en `gateway.remote.*` solo cuando `gateway.auth.*` no está establecido (los SecretRefs locales configurados pero no resueltos fallan en cerrado)
  - modo remoto: `gateway.remote.*` con reserva de env/config según las reglas de precedencia remota
  - `--url` es seguro para reemplazo y no reutiliza credenciales implícitas de config/env; pasa `--token`/`--password` explícitos (o variantes de archivo)
- Los procesos hijo del backend de ejecución ACP reciben `OPENCLAW_SHELL=acp`, que puede usarse para reglas de contexto específicas del shell/perfil.
- `openclaw acp client` establece `OPENCLAW_SHELL=acp-client` en el proceso del puente iniciado.

### Opciones de `acp client`

- `--cwd <dir>`: directorio de trabajo para la sesión ACP.
- `--server <command>`: comando del servidor ACP (predeterminado: `openclaw`).
- `--server-args <args...>`: argumentos adicionales pasados al servidor ACP.
- `--server-verbose`: habilita el registro detallado en el servidor ACP.
- `--verbose, -v`: registro detallado del cliente.
