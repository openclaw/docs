---
read_when:
    - Ejecutar o depurar el proceso Gateway
    - Investigando la aplicación de instancia única
summary: Protección singleton del Gateway mediante el enlace del escuchador WebSocket
title: Bloqueo de Gateway
x-i18n:
    generated_at: "2026-04-30T05:41:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Por Qué

- Garantizar que solo se ejecute una instancia de Gateway por puerto base en el mismo host; los Gateways adicionales deben usar perfiles aislados y puertos únicos.
- Sobrevivir a bloqueos/SIGKILL sin dejar archivos de bloqueo obsoletos.
- Fallar rápidamente con un error claro cuando el puerto de control ya esté ocupado.

## Mecanismo

- El Gateway primero adquiere un archivo de bloqueo por configuración dentro del directorio de bloqueos de estado y sondea el puerto configurado para detectar un listener existente.
- Si el propietario de bloqueo registrado ya no existe, el puerto está libre o el bloqueo está obsoleto, el arranque reclama el bloqueo y continúa.
- Después, el Gateway enlaza el listener HTTP/WebSocket (predeterminado `ws://127.0.0.1:18789`) mediante un listener TCP exclusivo.
- Si el enlace falla con `EADDRINUSE`, el arranque lanza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Al apagarse, el Gateway cierra el servidor HTTP/WebSocket y elimina el archivo de bloqueo.

## Superficie de error

- Si otro proceso retiene el puerto, el arranque lanza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Otros fallos de enlace aparecen como `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Notas operativas

- Si el puerto está ocupado por _otro_ proceso, el error es el mismo; libera el puerto o elige otro con `openclaw gateway --port <port>`.
- Bajo un supervisor de servicio, un nuevo proceso de Gateway que detecta un respondedor `/healthz` saludable existente sale correctamente y deja ese proceso en control. Si el proceso existente nunca se vuelve saludable, los reintentos están acotados y el arranque falla con un error de bloqueo claro en lugar de entrar en un bucle infinito.
- La app de macOS sigue manteniendo su propia protección ligera de PID antes de iniciar el Gateway; el bloqueo en tiempo de ejecución se aplica mediante el archivo de bloqueo más el enlace HTTP/WebSocket.

## Relacionado

- [Múltiples Gateways](/es/gateway/multiple-gateways) — ejecutar varias instancias con puertos únicos
- [Solución de problemas](/es/gateway/troubleshooting) — diagnosticar `EADDRINUSE` y conflictos de puertos
