---
read_when:
    - Compilar o depurar clientes de Node (modo Node de iOS/Android/macOS)
    - Investigar fallos de emparejamiento o de autenticación del puente
    - Auditoría de la superficie de Node expuesta por el Gateway
summary: 'Protocolo de puente histórico (nodos heredados): TCP JSONL, emparejamiento, RPC con ámbito'
title: Protocolo de puente
x-i18n:
    generated_at: "2026-05-06T17:55:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
El puente TCP ha sido **eliminado**. Las compilaciones actuales de OpenClaw no incluyen el listener del puente y las claves de configuración `bridge.*` ya no están en el esquema. Esta página se conserva solo como referencia histórica. Usa el [Protocolo Gateway](/es/gateway/protocol) para todos los clientes Node/operador.
</Warning>

## Por qué existía

- **Límite de seguridad**: el puente expone una pequeña lista de permitidos en lugar de toda la superficie de la API de Gateway.
- **Emparejamiento + identidad de Node**: la admisión de Node pertenece al Gateway y está vinculada a un token por Node.
- **UX de descubrimiento**: los Nodes pueden descubrir Gateways mediante Bonjour en la LAN, o conectarse directamente a través de una tailnet.
- **WS de local loopback**: el plano de control WS completo permanece local salvo que se tunelice mediante SSH.

## Transporte

- TCP, un objeto JSON por línea (JSONL).
- TLS opcional (cuando `bridge.tls.enabled` es true).
- El puerto listener predeterminado histórico era `18790` (las compilaciones actuales no inician un puente TCP).

Cuando TLS está habilitado, los registros TXT de descubrimiento incluyen `bridgeTls=1` más `bridgeTlsSha256` como indicio no secreto. Ten en cuenta que los registros TXT de Bonjour/mDNS no están autenticados; los clientes no deben tratar la huella anunciada como un pin autoritativo sin intención explícita del usuario u otra verificación fuera de banda.

## Handshake + emparejamiento

1. El cliente envía `hello` con metadatos de Node + token (si ya está emparejado).
2. Si no está emparejado, Gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. El cliente envía `pair-request`.
4. Gateway espera aprobación y luego envía `pair-ok` y `hello-ok`.

Históricamente, `hello-ok` devolvía `serverName` y podía incluir `canvasHostUrl`.

## Marcos

Cliente → Gateway:

- `req` / `res`: RPC de Gateway con alcance (chat, sesiones, configuración, estado, voicewake, skills.bins)
- `event`: señales de Node (transcripción de voz, solicitud de agente, suscripción a chat, ciclo de vida de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos de Node (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`)
- `event`: actualizaciones de chat para sesiones suscritas
- `ping` / `pong`: keepalive

La aplicación heredada de la lista de permitidos vivía en `src/gateway/server-bridge.ts` (eliminado).

## Eventos del ciclo de vida de exec

Los Nodes pueden emitir eventos `exec.finished` o `exec.denied` para exponer actividad de system.run.
Estos se asignan a eventos del sistema en el Gateway. (Los Nodes heredados aún pueden emitir `exec.started`.)

Campos de payload (todos opcionales salvo que se indique lo contrario):

- `sessionKey` (obligatorio): sesión de agente que recibirá el evento del sistema.
- `runId`: id de exec único para agrupación.
- `command`: cadena de comando sin procesar o formateada.
- `exitCode`, `timedOut`, `success`, `output`: detalles de finalización (solo finished).
- `reason`: motivo de denegación (solo denied).

## Uso histórico de tailnet

- Vincula el puente a una IP de tailnet: `bridge.bind: "tailnet"` en `~/.openclaw/openclaw.json` (solo histórico; `bridge.*` ya no es válido).
- Los clientes se conectan mediante nombre MagicDNS o IP de tailnet.
- Bonjour **no** cruza redes; usa host/puerto manual o DNS-SD de área amplia cuando sea necesario.

## Versionado

El puente era **v1 implícita** (sin negociación mín./máx.). Esta sección es solo referencia histórica; los clientes Node/operador actuales usan el [Protocolo Gateway](/es/gateway/protocol) WebSocket.

## Relacionado

- [Protocolo Gateway](/es/gateway/protocol)
- [Nodes](/es/nodes)
