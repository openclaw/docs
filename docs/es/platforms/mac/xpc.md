---
read_when:
    - Edición de contratos IPC o del IPC de la aplicación de la barra de menús
summary: Arquitectura IPC de macOS para la aplicación OpenClaw, el transporte del Node del Gateway y PeekabooBridge
title: IPC de macOS
x-i18n:
    generated_at: "2026-07-12T14:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Arquitectura IPC de OpenClaw para macOS

Un socket Unix local conecta el servicio host del nodo con la aplicación para macOS para gestionar las aprobaciones de ejecución y `system.run`. Existe una CLI de depuración `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) para comprobaciones de detección y conexión; las acciones del agente siguen fluyendo a través del WebSocket del Gateway y `node.invoke`. La ruta `computer.act` respaldada por el nodo ejecuta la automatización Peekaboo integrada dentro del proceso; los clientes Peekaboo independientes usan PeekabooBridge.

## Objetivos

- Una única instancia de la aplicación GUI que gestione todo el trabajo relacionado con TCC (notificaciones, grabación de pantalla, micrófono, voz, AppleScript).
- Una superficie pequeña para la automatización: Gateway + comandos de nodo, `computer.act` dentro del proceso y PeekabooBridge para clientes independientes de automatización de la interfaz de usuario.
- Permisos predecibles: siempre el mismo ID de paquete firmado, iniciado por launchd, para que las concesiones de TCC persistan.

## Cómo funciona

### Transporte mediante Gateway + nodo

- La aplicación ejecuta el Gateway (modo local) y se conecta a él como nodo.
- Las acciones del agente se realizan mediante `node.invoke` (p. ej., `system.run`, `system.notify`, `canvas.*`).
- Los comandos de nodo incluyen `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` y `system.notify`.
- El nodo proporciona un mapa `permissions` para que los agentes puedan comprobar si está disponible el acceso a la pantalla, la cámara, el micrófono, la voz, la automatización o la accesibilidad.

### Servicio de nodo + IPC de la aplicación

- Un servicio host de nodo sin interfaz gráfica se conecta al WebSocket del Gateway.
- Las solicitudes de `system.run` se reenvían a la aplicación para macOS a través de un socket Unix local (`ExecApprovalsSocket.swift`).
- La aplicación ejecuta la acción en el contexto de la interfaz de usuario, solicita confirmación si es necesario y devuelve la salida.

Diagrama (SCI):

```text
Agente -> Gateway -> Servicio de nodo (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Aplicación para Mac (IU + TCC + system.run)
```

### PeekabooBridge (automatización de la interfaz de usuario)

- La herramienta `computer` integrada del agente **no** usa este socket. Un nodo macOS emparejado ejecuta `computer.act` en el proceso de la aplicación mediante servicios Peekaboo integrados.
- La automatización de la interfaz de usuario usa un socket UNIX independiente (`~/Library/Application Support/OpenClaw/<socket>`) y el protocolo JSON de PeekabooBridge.
- Orden de preferencia de hosts (del lado del cliente): Peekaboo.app -> Claude.app -> OpenClaw.app -> ejecución local.
- Seguridad: los hosts del puente requieren un TeamID incluido en la lista de permitidos (el `PeekabooBridgeHostCoordinator` integrado permite un equipo fijo y el propio equipo de firma de la aplicación); una vía de escape solo para DEBUG y para el mismo UID está protegida mediante `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convención de Peekaboo).
- Consulte [Uso de PeekabooBridge](/es/platforms/mac/peekaboo) para obtener más información.

## Flujos operativos

- Reinicio/recompilación: `scripts/restart-mac.sh` finaliza las instancias existentes, recompila mediante Swift, vuelve a empaquetar y reinicia la aplicación. Detecta automáticamente una identidad de firma disponible y recurre a `--no-sign` si no encuentra ninguna; pase `--sign` para exigir la firma (falla si no hay ninguna clave disponible) o `--no-sign` para forzar la ruta sin firma. La variable `SIGN_IDENTITY` definida en el entorno se elimina en la ruta con firma, de modo que la detección automática de identidad de `scripts/codesign-mac-app.sh` seleccione el certificado.
- Instancia única: la aplicación comprueba `NSWorkspace.runningApplications` para detectar un ID de paquete duplicado y se cierra si encuentra más de una instancia (`isDuplicateInstance()` en `MenuBar.swift`).

## Notas de refuerzo de seguridad

- Es preferible exigir que el TeamID coincida en todas las superficies con privilegios.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (solo para DEBUG) puede permitir llamadas desde el mismo UID para el desarrollo local.
- Toda la comunicación permanece exclusivamente en el entorno local; no se expone ningún socket de red.
- Las solicitudes de TCC se originan únicamente en el paquete de la aplicación GUI; mantenga estable el ID del paquete firmado entre recompilaciones.
- Refuerzo de seguridad del socket de aprobaciones de ejecución: modo de archivo `0600`, token compartido, comprobación del UID del par (`getpeereid`), desafío/respuesta HMAC-SHA256 y un TTL corto para las solicitudes.

## Contenido relacionado

- [Aplicación para macOS](/es/platforms/macos)
- [Flujo IPC de macOS (aprobaciones de ejecución)](/es/tools/exec-approvals-advanced#macos-ipc-flow)
