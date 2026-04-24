---
read_when:
    - Editing IPC contracts or menu bar app IPC
summary: Arquitectura IPC en macOS para la app de OpenClaw, el transporte de Node del gateway y PeekabooBridge
title: IPC en macOS
x-i18n:
    generated_at: "2026-04-24T05:39:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Arquitectura IPC de OpenClaw en macOS

**Modelo actual:** un socket Unix local conecta el **servicio host del Node** con la **app de macOS** para aprobaciones de exec y `system.run`. Existe una CLI de depuración `openclaw-mac` para comprobaciones de descubrimiento/conexión; las acciones del agente siguen fluyendo a través del Gateway WebSocket y `node.invoke`. La automatización de IU usa PeekabooBridge.

## Objetivos

- Una única instancia de la app GUI que sea propietaria de todo el trabajo con TCC (notificaciones, grabación de pantalla, micrófono, voz, AppleScript).
- Una superficie pequeña para automatización: Gateway + comandos de Node, además de PeekabooBridge para automatización de IU.
- Permisos predecibles: siempre el mismo ID de bundle firmado, lanzado por launchd, para que las concesiones de TCC permanezcan.

## Cómo funciona

### Gateway + transporte de Node

- La app ejecuta el Gateway (modo local) y se conecta a él como un Node.
- Las acciones del agente se realizan mediante `node.invoke` (por ejemplo `system.run`, `system.notify`, `canvas.*`).

### Servicio de Node + IPC de la app

- Un servicio host de Node sin interfaz se conecta al Gateway WebSocket.
- Las solicitudes `system.run` se reenvían a la app de macOS mediante un socket Unix local.
- La app ejecuta el comando en contexto de IU, solicita confirmación si hace falta y devuelve la salida.

Diagrama (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automatización de IU)

- La automatización de IU usa un socket UNIX independiente llamado `bridge.sock` y el protocolo JSON de PeekabooBridge.
- Orden de preferencia del host (lado cliente): Peekaboo.app → Claude.app → OpenClaw.app → ejecución local.
- Seguridad: los hosts del bridge requieren un TeamID permitido; la vía de escape DEBUG-only para mismo UID está protegida por `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convención de Peekaboo).
- Consulta: [Uso de PeekabooBridge](/es/platforms/mac/peekaboo) para más detalles.

## Flujos operativos

- Reiniciar/recompilar: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Mata las instancias existentes
  - Compila Swift + empaqueta
  - Escribe/prepara/inicia de nuevo el LaunchAgent
- Instancia única: la app sale inmediatamente si ya hay otra instancia en ejecución con el mismo ID de bundle.

## Notas de endurecimiento

- Prefiere exigir coincidencia de TeamID en todas las superficies con privilegios.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (solo DEBUG) puede permitir llamadores con el mismo UID para desarrollo local.
- Toda la comunicación permanece solo local; no se exponen sockets de red.
- Los prompts de TCC solo se originan desde el bundle de la app GUI; mantén estable el ID de bundle firmado entre recompilaciones.
- Endurecimiento de IPC: modo de socket `0600`, token, comprobaciones de UID par, desafío/respuesta HMAC, TTL corto.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Flujo IPC de macOS (aprobaciones de exec)](/es/tools/exec-approvals-advanced#macos-ipc-flow)
