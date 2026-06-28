---
read_when:
    - Editar contratos IPC o IPC de la aplicación de la barra de menús
summary: Arquitectura IPC de macOS para la aplicación OpenClaw, el transporte de nodo de Gateway y PeekabooBridge
title: IPC de macOS
x-i18n:
    generated_at: "2026-06-28T00:13:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Arquitectura IPC de OpenClaw en macOS

**Modelo actual:** un socket Unix local conecta el **servicio host de Node** con la **app de macOS** para aprobaciones de ejecución + `system.run`. Existe una CLI de depuración `openclaw-mac` para comprobaciones de descubrimiento/conexión; las acciones del agente siguen fluyendo a través del WebSocket del Gateway y `node.invoke`. La automatización de la UI usa PeekabooBridge.

## Objetivos

- Una única instancia de la app GUI que posee todo el trabajo orientado a TCC (notificaciones, grabación de pantalla, micrófono, voz, AppleScript).
- Una superficie pequeña para automatización: Gateway + comandos de Node, más PeekabooBridge para automatización de la UI.
- Permisos predecibles: siempre el mismo ID de bundle firmado, iniciado por launchd, para que las concesiones de TCC persistan.

## Cómo funciona

### Gateway + transporte de Node

- La app ejecuta el Gateway (modo local) y se conecta a él como un nodo.
- Las acciones del agente se realizan mediante `node.invoke` (p. ej., `system.run`, `system.notify`, `canvas.*`).
- Los comandos comunes de nodo en Mac incluyen `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run` y `system.notify`.
- El nodo informa un mapa `permissions` para que los agentes puedan ver si está disponible el acceso a pantalla,
  cámara, micrófono, voz, automatización o accesibilidad.

### Servicio de Node + IPC de la app

- Un servicio host de Node sin interfaz se conecta al WebSocket del Gateway.
- Las solicitudes `system.run` se reenvían a la app de macOS a través de un socket Unix local.
- La app realiza la ejecución en contexto de UI, solicita confirmación si es necesario y devuelve la salida.

Diagrama (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automatización de la UI)

- La automatización de la UI usa un socket UNIX separado llamado `bridge.sock` y el protocolo JSON de PeekabooBridge.
- Orden de preferencia de host (lado del cliente): Peekaboo.app → Claude.app → OpenClaw.app → ejecución local.
- Seguridad: los hosts de bridge requieren un TeamID permitido; la vía de escape DEBUG-only para el mismo UID está protegida por `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convención de Peekaboo).
- Consulta: [uso de PeekabooBridge](/es/platforms/mac/peekaboo) para más detalles.

## Flujos operativos

- Reiniciar/recompilar: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Finaliza las instancias existentes
  - Compilación de Swift + paquete
  - Escribe/inicializa/reactiva el LaunchAgent
- Instancia única: la app sale temprano si ya se está ejecutando otra instancia con el mismo ID de bundle.

## Notas de endurecimiento

- Prefiere exigir una coincidencia de TeamID para todas las superficies privilegiadas.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG-only) puede permitir llamadores del mismo UID para desarrollo local.
- Toda la comunicación permanece solo local; no se exponen sockets de red.
- Las solicitudes de TCC se originan solo desde el bundle de la app GUI; mantén estable el ID de bundle firmado entre recompilaciones.
- Endurecimiento de IPC: modo de socket `0600`, token, comprobaciones de UID del par, desafío/respuesta HMAC, TTL corto.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [flujo IPC de macOS (aprobaciones de ejecución)](/es/tools/exec-approvals-advanced#macos-ipc-flow)
