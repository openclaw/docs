---
read_when:
    - Creación o depuración de clientes de nodo (modo nodo de iOS/Android/macOS)
    - Investigación de fallos de emparejamiento o de autenticación del puente
    - Auditoría de la superficie Node expuesta por el gateway
summary: 'Protocolo de puente histórico (nodos heredados): TCP JSONL, emparejamiento, RPC con ámbito'
title: Protocolo puente
x-i18n:
    generated_at: "2026-06-27T11:22:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
El puente TCP se ha **eliminado**. Las compilaciones actuales de OpenClaw no incluyen el listener del puente y las claves de configuración `bridge.*` ya no están en el esquema. Esta página se conserva solo como referencia histórica. Usa el [Protocolo de Gateway](/es/gateway/protocol) para todos los clientes de nodo/operador.
</Warning>

## Por qué existía

- **Límite de seguridad**: el puente expone una pequeña lista de permitidos en lugar de la
  superficie completa de la API del Gateway.
- **Emparejamiento + identidad de nodo**: la admisión de nodos pertenece al Gateway y está vinculada
  a un token por nodo.
- **UX de descubrimiento**: los nodos pueden descubrir gateways mediante Bonjour en la LAN, o conectarse
  directamente a través de una tailnet.
- **WS de loopback**: el plano de control WS completo permanece local salvo que se tunelice mediante SSH.

## Transporte

- TCP, un objeto JSON por línea (JSONL).
- TLS opcional (cuando `bridge.tls.enabled` es true).
- El puerto listener predeterminado histórico era `18790` (las compilaciones actuales no inician un
  puente TCP).

Cuando TLS está habilitado, los registros TXT de descubrimiento incluyen `bridgeTls=1` más
`bridgeTlsSha256` como una pista no secreta. Ten en cuenta que los registros TXT de Bonjour/mDNS
no están autenticados; los clientes no deben tratar la huella anunciada como un pin
autoritativo sin intención explícita del usuario u otra verificación fuera de banda.

## Handshake + emparejamiento

1. El cliente envía `hello` con metadatos del nodo + token (si ya está emparejado).
2. Si no está emparejado, el Gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. El cliente envía `pair-request`.
4. El Gateway espera aprobación y luego envía `pair-ok` y `hello-ok`.

Históricamente, `hello-ok` devolvía `serverName`; las superficies de plugins alojados ahora se
anuncian mediante `pluginSurfaceUrls`. Canvas/A2UI usa
`pluginSurfaceUrls.canvas`; el alias obsoleto `canvasHostUrl` no forma parte del
protocolo refactorizado.

## Frames

Cliente → Gateway:

- `req` / `res`: RPC de Gateway con alcance (chat, sesiones, configuración, salud, voicewake, skills.bins)
- `event`: señales de nodo (transcripción de voz, solicitud de agente, suscripción a chat, ciclo de vida de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos de nodo (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: actualizaciones de chat para sesiones suscritas
- `ping` / `pong`: keepalive

La aplicación heredada de la lista de permitidos vivía en `src/gateway/server-bridge.ts` (eliminado).

## Eventos del ciclo de vida de exec

Los nodos pueden emitir eventos `exec.finished` para exponer actividad `system.run` completada.
Estos se asignan a eventos del sistema en el Gateway. (Los nodos heredados aún pueden emitir `exec.started`.)
Los nodos pueden emitir `exec.denied` para intentos de `system.run` denegados; el Gateway acepta
el evento como una denegación terminal y no encola un evento del sistema ni despierta trabajo de agente.

Campos de payload (todos opcionales salvo que se indique lo contrario):

- `sessionKey` (obligatorio): sesión de agente para correlación de eventos y, para
  `exec.finished`, entrega de eventos del sistema.
- `runId`: id de exec único para agrupación.
- `command`: cadena de comando sin procesar o formateada.
- `exitCode`, `timedOut`, `success`, `output`: detalles de finalización (solo finished).
- `reason`: motivo de denegación (solo denied).

## Uso histórico de tailnet

- Vincular el puente a una IP de tailnet: `bridge.bind: "tailnet"` en
  `~/.openclaw/openclaw.json` (solo histórico; `bridge.*` ya no es válido).
- Los clientes se conectan mediante nombre MagicDNS o IP de tailnet.
- Bonjour **no** cruza redes; usa host/puerto manual o DNS-SD de área amplia
  cuando sea necesario.

## Versionado

El puente era **v1 implícito** (sin negociación de mín./máx.). Esta sección es
solo referencia histórica; los clientes de nodo/operador actuales usan el WebSocket
[Protocolo de Gateway](/es/gateway/protocol).

## Relacionado

- [Protocolo de Gateway](/es/gateway/protocol)
- [Nodos](/es/nodes)
