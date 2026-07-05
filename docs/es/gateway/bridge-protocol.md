---
read_when:
    - Investigación de código antiguo de cliente Node o registros de emparejamiento archivados
    - Auditar lo que solía exponer la superficie heredada de Node
summary: 'Protocolo de puente histórico (nodos heredados): TCP JSONL, emparejamiento, RPC con alcance'
title: Protocolo de puente
x-i18n:
    generated_at: "2026-07-05T11:17:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
El puente TCP se ha **eliminado**. Las compilaciones actuales de OpenClaw no incluyen el listener del puente, y las claves de configuración `bridge.*` ya no están en el esquema. Esta página es solo una referencia histórica. Usa el [protocolo Gateway](/es/gateway/protocol) para todos los clientes de nodo/operador.
</Warning>

## Por qué existía

- **Límite de seguridad**: exponía una pequeña lista de permitidos en lugar de toda la superficie de la API del Gateway.
- **Emparejamiento + identidad de nodo**: la admisión de nodos era propiedad del Gateway y estaba vinculada a un token por nodo.
- **UX de descubrimiento**: los nodos podían descubrir gateways mediante Bonjour en la LAN, o conectarse directamente a través de una tailnet.
- **WS de loopback**: el plano de control WS completo permanecía local salvo que se tunelizara mediante SSH.

## Transporte

- TCP, un objeto JSON por línea (JSONL).
- TLS opcional (`bridge.tls.enabled: true`).
- El puerto de listener predeterminado era `18790`.

Cuando TLS estaba habilitado, los registros TXT de descubrimiento incluían `bridgeTls=1` más `bridgeTlsSha256` como pista no secreta. Los registros TXT de Bonjour/mDNS no están autenticados; los clientes no podían tratar la huella anunciada como un pin autoritativo sin otra verificación fuera de banda.

## Handshake y emparejamiento

1. El cliente envía `hello` con metadatos del nodo más el token (si ya está emparejado).
2. Si no está emparejado, el Gateway responde `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. El cliente envía `pair-request`.
4. El Gateway espera la aprobación y luego envía `pair-ok` y `hello-ok`.

`hello-ok` solía devolver `serverName`; las superficies de Plugin alojadas ahora se anuncian mediante `pluginSurfaceUrls` en el protocolo Gateway actual (Canvas/A2UI usa `pluginSurfaceUrls.canvas`).

## Frames

Cliente a Gateway:

- `req` / `res`: RPC de Gateway acotado (chat, sesiones, configuración, estado, voicewake, skills.bins).
- `event`: señales del nodo (transcripción de voz, solicitud de agente, suscripción a chat, ciclo de vida de exec).

Gateway a cliente:

- `invoke` / `invoke-res`: comandos de nodo (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: actualizaciones de chat para sesiones suscritas.
- `ping` / `pong`: keepalive.

La aplicación de la lista de permitidos vivía en `src/gateway/server-bridge.ts` (eliminado).

## Eventos del ciclo de vida de exec

Los nodos emitían `exec.finished` para exponer actividad de `system.run` completada, asignada a eventos del sistema por el Gateway (los nodos heredados también podían emitir `exec.started`). `exec.denied` marcaba un intento denegado de `system.run` como una denegación terminal sin encolar un evento del sistema ni activar trabajo de agente.

Campos de payload (todos opcionales salvo que se indique lo contrario):

| Campo                            | Notas                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Obligatorio. Sesión de agente para correlación de eventos y, para `exec.finished`, entrega de eventos del sistema. |
| `runId`                          | ID de exec único para agrupación.                                                              |
| `command`                        | Cadena de comando sin procesar o formateada.                                                   |
| `exitCode`, `timedOut`, `output` | Detalles de finalización (solo finalizados).                                                   |
| `reason`                         | Motivo de denegación (solo denegados).                                                         |

## Uso histórico de tailnet

- Vincula el puente a una IP de tailnet: `bridge.bind: "tailnet"` en `~/.openclaw/openclaw.json` (solo histórico; `bridge.*` ya no es configuración válida).
- Los clientes se conectaban mediante un nombre MagicDNS o una IP de tailnet.
- Bonjour no cruza redes; de lo contrario, se requería DNS-SD de área amplia o un host/puerto manual.

## Versionado

El puente era v1 implícito, sin negociación min/max. Los clientes de nodo/operador actuales usan el [protocolo Gateway](/es/gateway/protocol) WebSocket, que sí negocia un rango de versiones del protocolo.

## Relacionado

- [Protocolo Gateway](/es/gateway/protocol)
- [Nodos](/es/nodes)
