---
read_when:
    - Configurar integraciones de IDE basadas en ACP
    - Depurar el enrutamiento de sesiones de ACP hacia el Gateway
summary: Ejecutar el puente de ACP para integraciones de IDE
title: ACP
x-i18n:
    generated_at: "2026-04-24T05:21:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

Ejecuta el puente de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica con un Gateway de OpenClaw.

Este comando usa ACP sobre stdio para IDEs y reenvía prompts al Gateway
mediante WebSocket. Mantiene las sesiones de ACP mapeadas a claves de sesión del Gateway.

`openclaw acp` es un puente de ACP respaldado por Gateway, no un runtime completo
de editor nativo de ACP. Se centra en el enrutamiento de sesiones, la entrega de prompts y las actualizaciones básicas de streaming.

Si quieres que un cliente MCP externo hable directamente con conversaciones de canal de OpenClaw
en lugar de alojar una sesión de harness de ACP, usa
[`openclaw mcp serve`](/es/cli/mcp) en su lugar.

## Qué no es esto

Esta página suele confundirse con sesiones de harness de ACP.

`openclaw acp` significa:

- OpenClaw actúa como servidor ACP
- un IDE o cliente ACP se conecta a OpenClaw
- OpenClaw reenvía ese trabajo a una sesión del Gateway

Esto es diferente de [ACP Agents](/es/tools/acp-agents), donde OpenClaw ejecuta un
harness externo como Codex o Claude Code mediante `acpx`.

Regla rápida:

- si un editor/cliente quiere hablar ACP con OpenClaw: usa `openclaw acp`
- si OpenClaw debe iniciar Codex/Claude/Gemini como harness de ACP: usa `/acp spawn` y [ACP Agents](/es/tools/acp-agents)

## Matriz de compatibilidad

| Área de ACP                                                            | Estado      | Notas                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                         | Implementado | Flujo principal del puente sobre stdio a chat/send + cancelación del Gateway.                                                                                                                                                                   |
| `listSessions`, comandos con barra                                     | Implementado | La lista de sesiones funciona contra el estado de sesiones del Gateway; los comandos se anuncian mediante `available_commands_update`.                                                                                                          |
| `loadSession`                                                          | Parcial     | Vuelve a vincular la sesión de ACP a una clave de sesión del Gateway y reproduce el historial almacenado de texto de usuario/asistente. El historial de herramientas/sistema aún no se reconstruye.                                          |
| Contenido del prompt (`text`, `resource` incrustado, imágenes)         | Parcial     | El texto/los recursos se aplanan en la entrada de chat; las imágenes se convierten en archivos adjuntos del Gateway.                                                                                                                           |
| Modos de sesión                                                        | Parcial     | `session/set_mode` es compatible y el puente expone controles iniciales de sesión respaldados por Gateway para nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones elevadas. Superficies más amplias de modo/configuración nativas de ACP aún quedan fuera de alcance. |
| Información de sesión y actualizaciones de uso                         | Parcial     | El puente emite notificaciones `session_info_update` y `usage_update` en modo best-effort a partir de instantáneas en caché de sesiones del Gateway. El uso es aproximado y solo se envía cuando los totales de tokens del Gateway están marcados como recientes. |
| Streaming de herramientas                                              | Parcial     | Los eventos `tool_call` / `tool_call_update` incluyen E/S sin procesar, contenido de texto y ubicaciones de archivo en modo best-effort cuando los argumentos/resultados de herramientas del Gateway las exponen. Los terminales incrustados y la salida más rica nativa de diferencias aún no se exponen. |
| Servidores MCP por sesión (`mcpServers`)                               | No compatible | El modo puente rechaza solicitudes de servidor MCP por sesión. Configura MCP en el Gateway o agente de OpenClaw en su lugar.                                                                                                                   |
| Métodos de sistema de archivos del cliente (`fs/read_text_file`, `fs/write_text_file`) | No compatible | El puente no llama a métodos de sistema de archivos del cliente ACP.                                                                                                                                                                            |
| Métodos de terminal del cliente (`terminal/*`)                         | No compatible | El puente no crea terminales de cliente ACP ni transmite identificadores de terminal mediante llamadas de herramienta.                                                                                                                          |
| Planes de sesión / streaming de pensamiento                            | No compatible | El puente actualmente emite texto de salida y estado de herramientas, no actualizaciones de planes o pensamiento de ACP.                                                                                                                        |

## Limitaciones conocidas

- `loadSession` reproduce el historial almacenado de texto de usuario y asistente, pero no
  reconstruye llamadas históricas de herramientas, avisos del sistema ni tipos de evento
  nativos de ACP más ricos.
- Si varios clientes ACP comparten la misma clave de sesión del Gateway, el enrutamiento
  de eventos y cancelaciones es best-effort en lugar de estar estrictamente aislado por cliente.
  Prefiere las sesiones aisladas predeterminadas `acp:<uuid>` cuando necesites
  turnos limpios locales del editor.
- Los estados de detención del Gateway se traducen a motivos de detención de ACP, pero ese mapeo
  es menos expresivo que el de un runtime totalmente nativo de ACP.
- Los controles de sesión iniciales actualmente exponen un subconjunto centrado de ajustes del Gateway:
  nivel de pensamiento, verbosidad de herramientas, razonamiento, detalle de uso y acciones
  elevadas. La selección de modelo y los controles de host de ejecución aún no se exponen como opciones
  de configuración de ACP.
- `session_info_update` y `usage_update` se derivan de instantáneas de sesiones del Gateway,
  no de una contabilidad en vivo nativa de ACP. El uso es aproximado,
  no incluye datos de coste y solo se emite cuando el Gateway marca como recientes
  los datos totales de tokens.
- Los datos de seguimiento de herramientas son best-effort. El puente puede exponer rutas de archivo que
  aparezcan en argumentos/resultados de herramientas conocidos, pero aún no emite terminales ACP ni
  diferencias estructuradas de archivos.

## Uso

```bash
openclaw acp

# Gateway remoto
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token desde archivo)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Conectarse a una clave de sesión existente
openclaw acp --session agent:main:main

# Conectarse por etiqueta (debe existir ya)
openclaw acp --session-label "support inbox"

# Restablecer la clave de sesión antes del primer prompt
openclaw acp --session agent:main:main --reset-session
```

## Cliente ACP (depuración)

Usa el cliente ACP incorporado para verificar el puente sin un IDE.
Inicia el puente ACP y te permite escribir prompts de forma interactiva.

```bash
openclaw acp client

# Apuntar el puente iniciado a un Gateway remoto
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Sobrescribir el comando del servidor (predeterminado: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permisos (modo de depuración del cliente):

- La aprobación automática se basa en listas de permitidos y solo se aplica a ID de herramientas centrales de confianza.
- La aprobación automática de `read` se limita al directorio de trabajo actual (`--cwd` cuando está configurado).
- ACP solo aprueba automáticamente clases estrechas de solo lectura: llamadas `read` dentro del cwd activo más herramientas de búsqueda de solo lectura (`search`, `web_search`, `memory_search`). Las herramientas desconocidas/no centrales, lecturas fuera de alcance, herramientas con capacidad de ejecución, herramientas del plano de control, herramientas mutables y flujos interactivos siempre requieren aprobación explícita mediante prompt.
- `toolCall.kind` proporcionado por el servidor se trata como metadatos no confiables (no como fuente de autorización).
- Esta política del puente ACP es independiente de los permisos del harness ACPX. Si ejecutas OpenClaw mediante el backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` es el interruptor de emergencia “yolo” para esa sesión de harness.

## Cómo usar esto

Usa ACP cuando un IDE (u otro cliente) hable Agent Client Protocol y quieras
que controle una sesión de Gateway de OpenClaw.

1. Asegúrate de que el Gateway esté en ejecución (local o remoto).
2. Configura el destino del Gateway (configuración o flags).
3. Configura tu IDE para ejecutar `openclaw acp` sobre stdio.

Ejemplo de configuración (persistida):

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

ACP no selecciona agentes directamente. Enruta por la clave de sesión del Gateway.

Usa claves de sesión con ámbito de agente para dirigirte a un agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sesión ACP se asigna a una sola clave de sesión del Gateway. Un agente puede tener muchas
sesiones; ACP usa por defecto una sesión aislada `acp:<uuid>` salvo que sobrescribas
la clave o la etiqueta.

Los `mcpServers` por sesión no son compatibles en modo puente. Si un cliente ACP
los envía durante `newSession` o `loadSession`, el puente devuelve un error claro
en lugar de ignorarlos silenciosamente.

Si quieres que las sesiones respaldadas por ACPX vean herramientas Plugin de OpenClaw o herramientas
integradas seleccionadas como `cron`, habilita los puentes MCP de ACPX del lado del Gateway
en lugar de intentar pasar `mcpServers` por sesión. Consulta
[ACP Agents](/es/tools/acp-agents-setup#plugin-tools-mcp-bridge) y
[puente MCP de herramientas de OpenClaw](/es/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Uso desde `acpx` (Codex, Claude, otros clientes ACP)

Si quieres que un agente de programación como Codex o Claude Code hable con tu
bot de OpenClaw mediante ACP, usa `acpx` con su destino `openclaw` incorporado.

Flujo típico:

1. Ejecuta el Gateway y asegúrate de que el puente ACP pueda alcanzarlo.
2. Apunta `acpx openclaw` a `openclaw acp`.
3. Dirígete a la clave de sesión de OpenClaw que quieres que use el agente de programación.

Ejemplos:

```bash
# Solicitud de una sola vez en tu sesión ACP predeterminada de OpenClaw
acpx openclaw exec "Resume el estado activo de la sesión de OpenClaw."

# Sesión persistente con nombre para turnos de seguimiento
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Pide a mi agente de trabajo de OpenClaw contexto reciente relevante para este repositorio."
```

Si quieres que `acpx openclaw` apunte siempre a un Gateway y una clave de sesión específicos,
sobrescribe el comando del agente `openclaw` en `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para un checkout local de OpenClaw del repositorio, usa el punto de entrada directo de la CLI en lugar del
ejecutor de desarrollo para que el flujo ACP permanezca limpio. Por ejemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta es la forma más sencilla de permitir que Codex, Claude Code u otro cliente compatible con ACP
extraiga información contextual de un agente de OpenClaw sin depender de extraerla de una terminal.

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

Para dirigirte a un Gateway o agente específico:

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

## Mapeo de sesiones

De forma predeterminada, las sesiones ACP reciben una clave de sesión aislada del Gateway con prefijo `acp:`.
Para reutilizar una sesión conocida, pasa una clave de sesión o una etiqueta:

- `--session <key>`: usa una clave de sesión específica del Gateway.
- `--session-label <label>`: resuelve una sesión existente por etiqueta.
- `--reset-session`: genera un ID de sesión nuevo para esa clave (misma clave, nuevo historial).

Si tu cliente ACP admite metadatos, puedes sobrescribirlo por sesión:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Más información sobre claves de sesión en [/concepts/session](/es/concepts/session).

## Opciones

- `--url <url>`: URL WebSocket del Gateway (usa por defecto `gateway.remote.url` cuando está configurada).
- `--token <token>`: token de autenticación del Gateway.
- `--token-file <path>`: lee el token de autenticación del Gateway desde un archivo.
- `--password <password>`: contraseña de autenticación del Gateway.
- `--password-file <path>`: lee la contraseña de autenticación del Gateway desde un archivo.
- `--session <key>`: clave de sesión predeterminada.
- `--session-label <label>`: etiqueta de sesión predeterminada a resolver.
- `--require-existing`: falla si la clave/etiqueta de sesión no existe.
- `--reset-session`: restablece la clave de sesión antes del primer uso.
- `--no-prefix-cwd`: no antepone el directorio de trabajo a los prompts.
- `--provenance <off|meta|meta+receipt>`: incluye metadatos o recibos de procedencia de ACP.
- `--verbose, -v`: registro detallado en stderr.

Nota de seguridad:

- `--token` y `--password` pueden ser visibles en listados de procesos locales en algunos sistemas.
- Prefiere `--token-file`/`--password-file` o variables de entorno (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La resolución de autenticación del Gateway sigue el contrato compartido usado por otros clientes del Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> respaldo en `gateway.remote.*` solo cuando `gateway.auth.*` no está configurado (las SecretRefs locales configuradas pero no resueltas fallan de forma cerrada)
  - modo remoto: `gateway.remote.*` con respaldo de env/config según las reglas de precedencia remota
  - `--url` es seguro como sobrescritura y no reutiliza credenciales implícitas de config/env; pasa `--token`/`--password` explícitos (o sus variantes de archivo)
- Los procesos hijo del backend del runtime ACP reciben `OPENCLAW_SHELL=acp`, que puede usarse para reglas específicas de contexto de shell/perfil.
- `openclaw acp client` establece `OPENCLAW_SHELL=acp-client` en el proceso del puente iniciado.

### Opciones de `acp client`

- `--cwd <dir>`: directorio de trabajo para la sesión ACP.
- `--server <command>`: comando del servidor ACP (predeterminado: `openclaw`).
- `--server-args <args...>`: argumentos adicionales pasados al servidor ACP.
- `--server-verbose`: habilita registro detallado en el servidor ACP.
- `--verbose, -v`: registro detallado del cliente.

## Relacionado

- [Referencia de CLI](/es/cli)
- [ACP Agents](/es/tools/acp-agents)
