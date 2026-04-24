---
read_when:
    - Crear o depurar clientes de nodo (modo nodo de iOS/Android/macOS)
    - Investigar fallos de autenticación de vinculación o del puente
    - Auditar la superficie de nodo expuesta por el gateway
summary: 'Protocolo de puente histórico (nodos heredados): TCP JSONL, vinculación, RPC con alcance limitado'
title: Protocolo de puente
x-i18n:
    generated_at: "2026-04-24T05:27:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protocolo de puente (transporte heredado de nodos)

<Warning>
El puente TCP ha sido **eliminado**. Las compilaciones actuales de OpenClaw no incluyen el listener del puente y las claves de configuración `bridge.*` ya no están en el esquema. Esta página se mantiene solo como referencia histórica. Usa el [Protocolo de Gateway](/es/gateway/protocol) para todos los clientes de nodo/operador.
</Warning>

## Por qué existía

- **Límite de seguridad**: el puente expone una pequeña lista de permitidos en lugar de toda
  la superficie de la API de gateway.
- **Vinculación + identidad del nodo**: la admisión de nodos pertenece al gateway y está vinculada
  a un token por nodo.
- **Experiencia de detección**: los nodos pueden descubrir gateways mediante Bonjour en LAN, o conectarse
  directamente mediante una tailnet.
- **WS de loopback**: el plano de control WS completo permanece local salvo que se tunelice mediante SSH.

## Transporte

- TCP, un objeto JSON por línea (JSONL).
- TLS opcional (cuando `bridge.tls.enabled` es true).
- El puerto listener predeterminado histórico era `18790` (las compilaciones actuales no inician un
  puente TCP).

Cuando TLS está habilitado, los registros TXT de detección incluyen `bridgeTls=1` más
`bridgeTlsSha256` como pista no secreta. Ten en cuenta que los registros TXT de Bonjour/mDNS no están
autenticados; los clientes no deben tratar la huella anunciada como un pin
autorizado sin intención explícita del usuario u otra verificación fuera de banda.

## Handshake + vinculación

1. El cliente envía `hello` con metadatos del nodo + token (si ya está vinculado).
2. Si no está vinculado, gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. El cliente envía `pair-request`.
4. Gateway espera la aprobación y luego envía `pair-ok` y `hello-ok`.

Históricamente, `hello-ok` devolvía `serverName` y podía incluir
`canvasHostUrl`.

## Frames

Cliente → Gateway:

- `req` / `res`: RPC de gateway con alcance limitado (chat, sesiones, config, estado, voicewake, skills.bins)
- `event`: señales del nodo (transcripción de voz, solicitud de agente, suscripción a chat, ciclo de vida de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos del nodo (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: actualizaciones de chat para sesiones suscritas
- `ping` / `pong`: keepalive

La aplicación heredada de la lista de permitidos vivía en `src/gateway/server-bridge.ts` (eliminado).

## Eventos del ciclo de vida de exec

Los nodos pueden emitir eventos `exec.finished` o `exec.denied` para mostrar actividad de system.run.
Estos se asignan a eventos del sistema en el gateway. (Los nodos heredados aún pueden emitir `exec.started`.)

Campos de carga útil (todos opcionales salvo que se indique lo contrario):

- `sessionKey` (obligatorio): sesión del agente que recibirá el evento del sistema.
- `runId`: id único de exec para agrupación.
- `command`: cadena de comando sin procesar o formateada.
- `exitCode`, `timedOut`, `success`, `output`: detalles de finalización (solo finished).
- `reason`: motivo de denegación (solo denied).

## Uso histórico de tailnet

- Vincula el puente a una IP de tailnet: `bridge.bind: "tailnet"` en
  `~/.openclaw/openclaw.json` (solo histórico; `bridge.*` ya no es válido).
- Los clientes se conectan mediante nombre MagicDNS o IP de tailnet.
- Bonjour **no** cruza redes; usa host/puerto manual o DNS-SD de área amplia
  cuando sea necesario.

## Versionado

El puente era **v1 implícita** (sin negociación min/max). Esta sección es
solo una referencia histórica; los clientes actuales de nodo/operador usan el WebSocket
[Protocolo de Gateway](/es/gateway/protocol).

## Relacionado

- [Protocolo de Gateway](/es/gateway/protocol)
- [Nodos](/es/nodes)
