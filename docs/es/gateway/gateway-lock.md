---
read_when:
    - Ejecución o depuración del proceso del Gateway
    - Investigando la imposición de una única instancia
summary: Protección de singleton del Gateway mediante la vinculación del escuchador WebSocket
title: Bloqueo del Gateway
x-i18n:
    generated_at: "2026-04-30T16:28:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Por qué

- Garantizar que solo se ejecute una instancia de Gateway por puerto base en el mismo host; los Gateways adicionales deben usar perfiles aislados y puertos únicos.
- Sobrevivir a fallos/SIGKILL sin dejar archivos de bloqueo obsoletos.
- Fallar rápido con un error claro cuando el puerto de control ya está ocupado.

## Mecanismo

- El Gateway primero adquiere un archivo de bloqueo por configuración en el directorio de bloqueos de estado y sondea el puerto configurado para detectar un listener existente.
- Si el propietario de bloqueo registrado ya no existe, el puerto está libre o el bloqueo está obsoleto, el inicio recupera el bloqueo y continúa.
- Luego el Gateway enlaza el listener HTTP/WebSocket (predeterminado `ws://127.0.0.1:18789`) usando un listener TCP exclusivo.
- Si el enlace falla con `EADDRINUSE`, el inicio lanza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Al apagarse, el Gateway cierra el servidor HTTP/WebSocket y elimina el archivo de bloqueo.

## Superficie de error

- Si otro proceso ocupa el puerto, el inicio lanza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Otros fallos de enlace se muestran como `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Notas operativas

- Si el puerto está ocupado por _otro_ proceso, el error es el mismo; libera el puerto o elige otro con `openclaw gateway --port <port>`.
- Bajo un supervisor de servicios, un nuevo proceso de Gateway que ve un respondedor `/healthz` existente y en buen estado deja ese proceso en control. En systemd, el iniciador duplicado sale con el código 78, por lo que el `RestartPreventExitStatus=78` predeterminado evita que `Restart=always` entre en bucle por un conflicto de bloqueo o `EADDRINUSE`. Si el proceso existente nunca llega a estar en buen estado, los reintentos quedan acotados y el inicio falla con un error de bloqueo claro en lugar de entrar en bucle indefinidamente.
- La app de macOS todavía mantiene su propia protección ligera de PID antes de generar el Gateway; el bloqueo en tiempo de ejecución lo aplican el archivo de bloqueo más el enlace HTTP/WebSocket.

## Relacionado

- [Múltiples Gateways](/es/gateway/multiple-gateways) — ejecutar varias instancias con puertos únicos
- [Solución de problemas](/es/gateway/troubleshooting) — diagnosticar `EADDRINUSE` y conflictos de puertos
