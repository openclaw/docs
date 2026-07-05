---
read_when:
    - Ejecutar o depurar el proceso del gateway
    - Investigando la aplicación de instancia única
summary: 'Gateway singleton guard: bloqueo de archivo más enlace WebSocket/HTTP'
title: Bloqueo del Gateway
x-i18n:
    generated_at: "2026-07-05T11:18:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Por Qué

- Solo un proceso de Gateway debe poseer una configuración + puerto determinados en un host; ejecuta gateways adicionales con perfiles aislados y puertos únicos.
- Sobrevive a fallos/SIGKILL sin dejar archivos de bloqueo obsoletos.
- Falla rápido con un error claro cuando otro gateway ya posee el puerto.

## Dos Capas

El inicio aplica la propiedad de instancia única en dos pasos independientes, en orden:

1. **Bloqueo de archivo** adquiere un archivo de bloqueo por configuración bajo el directorio de bloqueo de estado. Como parte de adquirirlo, el inicio sondea el puerto configurado en busca de un listener activo para detectar un propietario de bloqueo obsoleto (bloqueado).
2. **Enlace de socket** enlaza el listener HTTP/WebSocket (predeterminado `ws://127.0.0.1:18789`) como listener TCP exclusivo.

Cada capa puede fallar de forma independiente y lanza su propio `GatewayLockError`.

### Bloqueo de archivo

- Si falta el archivo de bloqueo, el proceso propietario registrado ya no existe, o el sondeo del puerto del propietario no muestra ningún listener activo, el inicio reclama el bloqueo y continúa.
- Si el bloqueo está retenido activamente y nada de lo anterior aplica, el inicio reintenta durante hasta 5 segundos (valor predeterminado) antes de rendirse:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Enlace de socket

- En `EADDRINUSE`, el inicio reintenta el enlace durante hasta 20 intentos a intervalos de 500 ms (aproximadamente 10 segundos en total) para atravesar una ventana `TIME_WAIT` después de un proceso que salió recientemente.
- Si el puerto sigue en uso después de los reintentos:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Otros fallos de enlace:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Al apagarse, el gateway cierra el servidor HTTP/WebSocket y elimina el archivo de bloqueo.

## Notas operativas

- Si el puerto está ocupado por un proceso diferente que no es gateway, el error es el mismo; libera el puerto o elige otro con `openclaw gateway --port <port>`.
- Bajo un supervisor de servicios, un nuevo proceso de gateway que encuentra cualquiera de los errores anteriores primero sondea `/healthz` en el proceso existente. Si ese proceso está sano, el nuevo proceso lo deja en control en lugar de fallar. En systemd, sale con código `78`; el `RestartPreventExitStatus=78` de la unidad evita que `Restart=always` entre en bucle por un conflicto de bloqueo o `EADDRINUSE`. Si el proceso existente nunca se vuelve sano, el reintento del sondeo de salud está limitado en el tiempo y el inicio luego falla con el error de bloqueo anterior en lugar de entrar en bucle para siempre.
- La app de macOS mantiene su propia guarda PID ligera antes de generar el gateway; el bloqueo de archivo y el enlace de socket anteriores son la aplicación real en tiempo de ejecución.

## Relacionado

- [Múltiples Gateways](/es/gateway/multiple-gateways) - ejecutar varias instancias con puertos únicos
- [Solución de problemas](/es/gateway/troubleshooting) - diagnosticar `EADDRINUSE` y conflictos de puertos
