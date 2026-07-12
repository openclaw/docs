---
read_when:
    - Investigación del código antiguo del cliente Node o de los registros de emparejamiento archivados
    - Auditoría de lo que exponía anteriormente la superficie heredada de Node
summary: 'Protocolo histórico del puente (nodos heredados): JSONL sobre TCP, emparejamiento y RPC con ámbito definido'
title: Protocolo del puente
x-i18n:
    generated_at: "2026-07-11T23:06:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
El puente TCP ha sido **eliminado**. Las compilaciones actuales de OpenClaw no incluyen el proceso de escucha del puente y las claves de configuración `bridge.*` ya no forman parte del esquema. Esta página es únicamente una referencia histórica. Use el [protocolo del Gateway](/es/gateway/protocol) para todos los clientes de nodos y operadores.
</Warning>

## Por qué existía

- **Límite de seguridad**: exponía una pequeña lista de permitidos en lugar de toda la superficie de la API del Gateway.
- **Emparejamiento e identidad del nodo**: la admisión de nodos estaba a cargo del Gateway y vinculada a un token específico de cada nodo.
- **Experiencia de detección**: los nodos podían detectar Gateways mediante Bonjour en la red LAN o conectarse directamente a través de una tailnet.
- **WS en local loopback**: el plano de control WS completo permanecía local, salvo que se canalizara mediante SSH.

## Transporte

- TCP, un objeto JSON por línea (JSONL).
- TLS opcional (`bridge.tls.enabled: true`).
- El puerto predeterminado del proceso de escucha era `18790`.

Cuando TLS estaba habilitado, los registros TXT de detección incluían `bridgeTls=1` y `bridgeTlsSha256` como indicación no secreta. Los registros TXT de Bonjour/mDNS no están autenticados; los clientes no podían tratar la huella digital anunciada como un pin autoritativo sin otra verificación fuera de banda.

## Negociación inicial y emparejamiento

1. El cliente envía `hello` con los metadatos del nodo y el token (si ya está emparejado).
2. Si no está emparejado, el Gateway responde con `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. El cliente envía `pair-request`.
4. El Gateway espera la aprobación y, a continuación, envía `pair-ok` y `hello-ok`.

Anteriormente, `hello-ok` devolvía `serverName`; las superficies de Plugin alojadas ahora se anuncian mediante `pluginSurfaceUrls` en el protocolo actual del Gateway (Canvas/A2UI usa `pluginSurfaceUrls.canvas`).

## Tramas

Del cliente al Gateway:

- `req` / `res`: RPC con ámbito limitado del Gateway (chat, sesiones, configuración, estado, activación por voz, skills.bins).
- `event`: señales del nodo (transcripción de voz, solicitud del agente, suscripción al chat, ciclo de vida de ejecución).

Del Gateway al cliente:

- `invoke` / `invoke-res`: comandos del nodo (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: actualizaciones del chat para las sesiones suscritas.
- `ping` / `pong`: mantenimiento de la conexión.

La aplicación de la lista de permitidos se encontraba en `src/gateway/server-bridge.ts` (eliminado).

## Eventos del ciclo de vida de ejecución

Los nodos emitían `exec.finished` para mostrar la actividad completada de `system.run`, que el Gateway asignaba a eventos del sistema (los nodos heredados también podían emitir `exec.started`). `exec.denied` marcaba un intento denegado de `system.run` como denegación terminal, sin poner en cola un evento del sistema ni activar el trabajo del agente.

Campos de la carga útil (todos opcionales, salvo que se indique lo contrario):

| Campo                            | Notas                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Obligatorio. Sesión del agente para correlacionar eventos y, en el caso de `exec.finished`, entregar el evento del sistema. |
| `runId`                          | Identificador único de la ejecución para agrupar.                                                               |
| `command`                        | Cadena del comando sin procesar o con formato.                                                                  |
| `exitCode`, `timedOut`, `output` | Detalles de finalización (solo cuando finaliza).                                                                |
| `reason`                         | Motivo de la denegación (solo cuando se deniega).                                                               |

## Uso histórico de tailnet

- Vincular el puente a una dirección IP de tailnet: `bridge.bind: "tailnet"` en `~/.openclaw/openclaw.json` (solo con fines históricos; `bridge.*` ya no es una configuración válida).
- Los clientes se conectaban mediante el nombre de MagicDNS o la dirección IP de tailnet.
- Bonjour no atraviesa redes; de lo contrario, se requería DNS-SD de área extensa o un host y puerto especificados manualmente.

## Control de versiones

El puente usaba implícitamente la versión 1, sin negociación de valores mínimos y máximos. Los clientes actuales de nodos y operadores usan el [protocolo del Gateway](/es/gateway/protocol) mediante WebSocket, que sí negocia un intervalo de versiones del protocolo.

## Temas relacionados

- [Protocolo del Gateway](/es/gateway/protocol)
- [Nodos](/es/nodes)
