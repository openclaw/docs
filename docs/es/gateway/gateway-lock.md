---
read_when:
    - Ejecución o depuración del proceso del Gateway
    - Investigación de la aplicación de instancia única
summary: 'Protección de instancia única del Gateway: bloqueo de archivo y enlace de WebSocket/HTTP'
title: Bloqueo del Gateway
x-i18n:
    generated_at: "2026-07-11T23:07:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Por qué

- Solo un proceso de Gateway debe controlar una configuración y un puerto determinados en un host; ejecute gateways adicionales con perfiles aislados y puertos únicos.
- Permite sobrevivir a fallos/SIGKILL sin dejar archivos de bloqueo obsoletos.
- Falla de inmediato con un error claro cuando otro Gateway ya controla el puerto.

## Dos capas

El inicio aplica la propiedad de instancia única en dos pasos independientes, en este orden:

1. El **bloqueo de archivo** adquiere un archivo de bloqueo por configuración en el directorio de bloqueos de estado. Como parte de la adquisición, el inicio sondea el puerto configurado en busca de un proceso en escucha activo para detectar un propietario del bloqueo obsoleto (debido a un fallo).
2. La **vinculación del socket** vincula el proceso en escucha HTTP/WebSocket (valor predeterminado: `ws://127.0.0.1:18789`) como un proceso en escucha TCP exclusivo.

Cada capa puede fallar de forma independiente y genera su propio `GatewayLockError`.

### Bloqueo de archivo

- Si falta el archivo de bloqueo, el proceso propietario registrado ya no existe o el sondeo del puerto del propietario no muestra ningún proceso en escucha activo, el inicio recupera el bloqueo y continúa.
- Si el bloqueo está activo y no se cumple ninguna de las condiciones anteriores, el inicio reintenta durante un máximo de 5 segundos (valor predeterminado) antes de desistir:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Vinculación del socket

- Ante `EADDRINUSE`, el inicio vuelve a intentar la vinculación hasta 20 veces en intervalos de 500 ms (aproximadamente 10 segundos en total) para esperar a que finalice una ventana `TIME_WAIT` tras la terminación reciente de un proceso.
- Si el puerto sigue en uso después de los reintentos:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Otros errores de vinculación:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Al apagarse, el Gateway cierra el servidor HTTP/WebSocket y elimina el archivo de bloqueo.

## Notas operativas

- Si el puerto está ocupado por otro proceso que no es un Gateway, el error es el mismo; libere el puerto o elija otro con `openclaw gateway --port <port>`.
- Con un supervisor de servicios, un nuevo proceso de Gateway que encuentra cualquiera de los errores anteriores primero sondea `/healthz` en el proceso existente. Si ese proceso está en buen estado, el nuevo proceso lo deja al mando en lugar de fallar. En systemd, termina con el código `78`; la opción `RestartPreventExitStatus=78` de la unidad evita que `Restart=always` entre en un bucle por un conflicto de bloqueo o `EADDRINUSE`. Si el proceso existente nunca alcanza un estado saludable, los reintentos del sondeo de estado tienen un límite temporal y, a continuación, el inicio falla con el error de bloqueo anterior en lugar de continuar indefinidamente en un bucle.
- La aplicación para macOS mantiene su propia protección ligera mediante PID antes de iniciar el Gateway; el bloqueo de archivo y la vinculación del socket descritos anteriormente son los mecanismos reales de aplicación en tiempo de ejecución.

## Contenido relacionado

- [Varios Gateways](/es/gateway/multiple-gateways) - ejecución de varias instancias con puertos únicos
- [Solución de problemas](/es/gateway/troubleshooting) - diagnóstico de `EADDRINUSE` y conflictos de puertos
