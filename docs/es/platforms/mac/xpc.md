---
read_when:
    - Editar contratos de IPC o IPC de la app de la barra de menús
summary: Arquitectura IPC de macOS para la app OpenClaw, el transporte del nodo Gateway y PeekabooBridge
title: IPC de macOS
x-i18n:
    generated_at: "2026-07-05T11:32:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0216deb436632a8bc83ccd9b750b6be4e53e317fbd72af035bc152c6a8be504a
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Arquitectura IPC de OpenClaw en macOS

Un socket Unix local conecta el servicio host de Node con la app de macOS para las aprobaciones de ejecución y `system.run`. Existe una CLI de depuración `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) para comprobaciones de descubrimiento/conexión; las acciones del agente siguen fluyendo por el WebSocket del Gateway y `node.invoke`. La automatización de la UI usa PeekabooBridge.

## Objetivos

- Una única instancia de la app GUI que posea todo el trabajo orientado a TCC (notificaciones, grabación de pantalla, micrófono, voz, AppleScript).
- Una superficie pequeña para automatización: Gateway + comandos de Node, más PeekabooBridge para automatización de la UI.
- Permisos predecibles: siempre el mismo ID de paquete firmado, lanzado por launchd, para que las concesiones de TCC persistan.

## Cómo funciona

### Transporte de Gateway + Node

- La app ejecuta el Gateway (modo local) y se conecta a él como un Node.
- Las acciones del agente se realizan mediante `node.invoke` (por ejemplo, `system.run`, `system.notify`, `canvas.*`).
- Los comandos de Node incluyen `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `system.run` y `system.notify`.
- El Node informa un mapa `permissions` para que los agentes puedan ver si está disponible el acceso a pantalla, cámara, micrófono, voz, automatización o accesibilidad.

### Servicio de Node + IPC de la app

- Un servicio host de Node sin interfaz se conecta al WebSocket del Gateway.
- Las solicitudes `system.run` se reenvían a la app de macOS por un socket Unix local (`ExecApprovalsSocket.swift`).
- La app realiza la ejecución en contexto de UI, solicita confirmación si es necesario y devuelve la salida.

Diagrama (SCI):

```text
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automatización de UI)

- La automatización de UI usa un socket UNIX separado (`~/Library/Application Support/OpenClaw/<socket>`) y el protocolo JSON de PeekabooBridge.
- Orden de preferencia de host (del lado del cliente): Peekaboo.app -> Claude.app -> OpenClaw.app -> ejecución local.
- Seguridad: los hosts del puente requieren un TeamID en la lista de permitidos (el `PeekabooBridgeHostCoordinator` incluido permite un equipo fijo más el propio equipo de firma de la app); una vía de escape solo para DEBUG con el mismo UID está protegida por `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convención de Peekaboo).
- Consulta: [uso de PeekabooBridge](/es/platforms/mac/peekaboo) para más detalles.

## Flujos operativos

- Reiniciar/recompilar: `scripts/restart-mac.sh` elimina las instancias existentes, recompila con Swift, vuelve a empaquetar y relanza. Detecta automáticamente una identidad de firma disponible y recurre a `--no-sign` si no encuentra ninguna; pasa `--sign` para requerir firma (falla si no hay clave disponible) o `--no-sign` para forzar la ruta sin firma. `SIGN_IDENTITY` configurada en el entorno se desconfigura en la ruta firmada, por lo que la propia detección automática de identidad de `scripts/codesign-mac-app.sh` elige el certificado.
- Instancia única: la app comprueba `NSWorkspace.runningApplications` para detectar un ID de paquete duplicado y sale si encuentra más de una instancia (`isDuplicateInstance()` en `MenuBar.swift`).

## Notas de endurecimiento

- Prefiere requerir una coincidencia de TeamID para todas las superficies privilegiadas.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (solo DEBUG) puede permitir llamadores con el mismo UID para desarrollo local.
- Toda la comunicación sigue siendo solo local; no se exponen sockets de red.
- Las solicitudes de TCC se originan únicamente desde el paquete de la app GUI; mantén estable el ID de paquete firmado entre recompilaciones.
- Endurecimiento del socket de aprobaciones de ejecución: modo de archivo `0600`, token compartido, comprobación de UID del par (`getpeereid`), desafío/respuesta HMAC-SHA256 y un TTL corto en las solicitudes.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [flujo IPC de macOS (aprobaciones de ejecución)](/es/tools/exec-approvals-advanced#macos-ipc-flow)
