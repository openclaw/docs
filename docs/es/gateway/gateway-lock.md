---
read_when:
    - Ejecutar o depurar el proceso del Gateway
    - Investigar la aplicación de instancia única
summary: Protección Singleton del Gateway usando el bind del listener WebSocket
title: Bloqueo del Gateway
x-i18n:
    generated_at: "2026-04-24T05:28:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## Por qué

- Asegurar que solo se ejecute una instancia del gateway por puerto base en el mismo host; los gateways adicionales deben usar perfiles aislados y puertos únicos.
- Sobrevivir a fallos/SIGKILL sin dejar archivos de bloqueo obsoletos.
- Fallar rápidamente con un error claro cuando el puerto de control ya esté ocupado.

## Mecanismo

- El gateway vincula el listener WebSocket (predeterminado `ws://127.0.0.1:18789`) inmediatamente al iniciar usando un listener TCP exclusivo.
- Si el bind falla con `EADDRINUSE`, el inicio lanza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- El sistema operativo libera el listener automáticamente cuando el proceso termina, incluidos fallos y SIGKILL; no se necesita ningún archivo de bloqueo independiente ni paso de limpieza.
- Al apagarse, el gateway cierra el servidor WebSocket y el servidor HTTP subyacente para liberar el puerto rápidamente.

## Superficie de error

- Si otro proceso tiene el puerto, el inicio lanza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Otros fallos de bind aparecen como `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Notas operativas

- Si el puerto está ocupado por _otro_ proceso, el error es el mismo; libera el puerto o elige otro con `openclaw gateway --port <port>`.
- La app de macOS sigue manteniendo su propio guard ligero de PID antes de iniciar el gateway; el bloqueo de runtime lo aplica el bind de WebSocket.

## Relacionado

- [Múltiples Gateways](/es/gateway/multiple-gateways): ejecutar varias instancias con puertos únicos
- [Solución de problemas](/es/gateway/troubleshooting): diagnosticar `EADDRINUSE` y conflictos de puertos
