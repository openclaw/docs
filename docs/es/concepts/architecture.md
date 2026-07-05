---
read_when:
    - Trabajar en el protocolo de Gateway, clientes o transportes
summary: Arquitectura, componentes y flujos de cliente del Gateway WebSocket
title: Arquitectura de Gateway
x-i18n:
    generated_at: "2026-07-05T11:13:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8054bd87f738b957c24f8d6965d55365de2293d44902530a9ba778afa597cc7
    source_path: concepts/architecture.md
    workflow: 16
---

## Resumen

- Un único **Gateway** de larga duración posee todas las superficies de mensajería (WhatsApp mediante
  Baileys, Telegram mediante grammY, Slack, Discord, Signal, iMessage, WebChat).
- Los clientes del plano de control (app de macOS, CLI, interfaz web, automatizaciones) se conectan al
  Gateway mediante **WebSocket** en el host de enlace configurado (predeterminado
  `127.0.0.1:18789`).
- Los **Nodes** (macOS/iOS/Android/sin interfaz) también se conectan mediante **WebSocket**, pero
  declaran `role: node` con capacidades/comandos explícitos.
- Un Gateway por host; es el único lugar que abre una sesión de WhatsApp.
- El **host del canvas** lo sirve el servidor HTTP del Gateway en:
  - `/__openclaw__/canvas/` (HTML/CSS/JS editable por el agente)
  - `/__openclaw__/a2ui/` (host A2UI)

  Usa el mismo puerto que el Gateway (predeterminado `18789`).

## Componentes y flujos

### Gateway (demonio)

- Mantiene conexiones con proveedores.
- Expone una API WS tipada (solicitudes, respuestas, eventos enviados por el servidor).
- Valida los frames entrantes contra JSON Schema.
- Emite eventos como `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Clientes (app de Mac / CLI / administración web)

- Una conexión WS por cliente.
- Envían solicitudes (`health`, `status`, `send`, `agent`, `system-presence`).
- Se suscriben a eventos (`tick`, `agent`, `presence`, `shutdown`).

### Nodes (macOS / iOS / Android / sin interfaz)

- Se conectan al **mismo servidor WS** con `role: node`.
- Proporcionan una identidad de dispositivo en `connect`; el emparejamiento está **basado en dispositivos** (rol `node`) y
  la aprobación vive en el almacén de emparejamiento de dispositivos.
- Exponen comandos como `canvas.*`, `camera.*`, `screen.record`, `location.get`.

Detalles del protocolo: [protocolo del Gateway](/es/gateway/protocol)

### WebChat

- Interfaz estática que usa la API WS del Gateway para el historial de chat y los envíos.
- En configuraciones remotas, se conecta a través del mismo túnel SSH/Tailscale que otros
  clientes.

## Ciclo de vida de conexión (cliente único)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: or res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## Protocolo de cable (resumen)

- Transporte: WebSocket, frames de texto con cargas JSON.
- El primer frame **debe** ser `connect`.
- Después del handshake:
  - Solicitudes: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Eventos: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` son metadatos de descubrimiento, no un
  volcado generado de cada ruta auxiliar invocable.
- La autenticación con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación del gateway configurado.
- Los modos que llevan identidad, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o no loopback
  `gateway.auth.mode: "trusted-proxy"` satisfacen la autenticación desde las cabeceras de la solicitud
  en lugar de `connect.params.auth.*`.
- El ingreso privado `gateway.auth.mode: "none"` desactiva por completo la autenticación con secreto compartido;
  mantén ese modo desactivado en ingresos públicos/no confiables.
- Las claves de idempotencia son obligatorias para métodos con efectos secundarios (`send`, `agent`) para
  reintentar de forma segura; el servidor mantiene una caché de deduplicación de corta duración.
- Los nodos deben incluir `role: "node"` más capacidades/comandos/permisos en `connect`.

## Emparejamiento y confianza local

- Todos los clientes WS (operadores + nodos) incluyen una **identidad de dispositivo** en `connect`.
- Los IDs de dispositivos nuevos requieren aprobación de emparejamiento; el Gateway emite un **token de dispositivo**
  para conexiones posteriores.
- Las conexiones directas por local loopback se pueden aprobar automáticamente para mantener fluida la UX
  en el mismo host.
- OpenClaw también tiene una ruta estrecha de autoconexión local del backend/contenedor para
  flujos auxiliares confiables con secreto compartido.
- Las conexiones por tailnet y LAN, incluidos los enlaces de tailnet en el mismo host, siguen requiriendo
  aprobación explícita de emparejamiento.
- Todas las conexiones deben firmar el nonce `connect.challenge`. La carga de firma `v3`
  también vincula `platform` y `deviceFamily`; el gateway fija los metadatos emparejados al
  reconectar y exige emparejamiento de reparación para cambios de metadatos.
- Las conexiones **no locales** siguen requiriendo aprobación explícita.
- La autenticación del Gateway (`gateway.auth.*`) sigue aplicándose a **todas** las conexiones, locales o
  remotas.

Detalles: [protocolo del Gateway](/es/gateway/protocol), [Emparejamiento](/es/channels/pairing),
[Seguridad](/es/gateway/security).

## Tipado del protocolo y codegen

- Los esquemas TypeBox definen el protocolo.
- JSON Schema se genera a partir de esos esquemas.
- Los modelos Swift se generan a partir de JSON Schema.

## Acceso remoto

- Preferido: Tailscale o VPN.
- Alternativa: túnel SSH

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
  ```

- El mismo handshake + token de autenticación se aplican a través del túnel.
- TLS + pinning opcional se pueden habilitar para WS en configuraciones remotas.

## Instantánea de operaciones

- Inicio: `openclaw gateway` (primer plano, registra en stdout).
- Salud: `health` mediante WS (también incluido en `hello-ok`).
- Supervisión: launchd/systemd para reinicio automático.

## Invariantes

- Exactamente un Gateway controla una única sesión de Baileys por host.
- El handshake es obligatorio; cualquier primer frame que no sea JSON o no sea connect provoca un cierre firme.
- Los eventos no se reproducen; los clientes deben actualizarse si hay brechas.

## Relacionado

- [Bucle del agente](/es/concepts/agent-loop) — ciclo detallado de ejecución del agente
- [Protocolo del Gateway](/es/gateway/protocol) — contrato del protocolo WebSocket
- [Cola](/es/concepts/queue) — cola de comandos y concurrencia
- [Seguridad](/es/gateway/security) — modelo de confianza y endurecimiento
