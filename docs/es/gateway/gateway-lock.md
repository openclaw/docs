---
read_when:
    - Ejecución o depuración del proceso del Gateway
    - Investigación de la aplicación de instancia única
summary: 'Protección de instancia única del Gateway: bloqueo de archivo y enlace WebSocket/HTTP'
title: Bloqueo del Gateway
x-i18n:
    generated_at: "2026-07-14T13:40:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Por qué

- Solo un proceso de Gateway debe ser propietario de un directorio de estado; ejecute Gateways adicionales con perfiles, directorios de estado, configuraciones y puertos aislados.
- Permite sobrevivir a fallos o SIGKILL sin dejar archivos de bloqueo obsoletos.
- Falla de inmediato con un error claro cuando otro Gateway ya es propietario del puerto.

## Tres capas

El inicio aplica la propiedad en tres pasos, en este orden:

1. El **bloqueo de propiedad del estado** adquiere un bloqueo asociado al directorio de estado canónico. Todos los Gateway participan, incluidos los Gateway iniciados con `OPENCLAW_ALLOW_MULTI_GATEWAY=1`, para que el mantenimiento destructivo de SQLite no entre en conflicto con un propietario activo.
2. El **bloqueo de configuración** adquiere el bloqueo histórico por configuración y registra el puerto de ejecución. El modo multi-Gateway omite esta instancia única de configuración, pero conserva el bloqueo de propiedad del estado.
3. El **enlace del socket** enlaza el servidor HTTP/WebSocket (valor predeterminado: `ws://127.0.0.1:18789`) como servidor TCP exclusivo.

Cada capa puede fallar de forma independiente y genera su propio `GatewayLockError`.

### Bloqueos de estado y configuración

- La vigencia del bloqueo se determina mediante el PID registrado, la identidad de inicio del proceso de la plataforma cuando está disponible y la identidad del proceso de Gateway. Un propietario verificado conserva la autoridad durante el inicio antes de que su puerto comience a escuchar.
- Un coordinador de SQLite dedicado serializa la inspección de metadatos, la recuperación de propietarios obsoletos y la sustitución de bloqueos. Su transacción exclusiva se libera automáticamente si el proceso propietario falla.
- Si falta un archivo de bloqueo o el proceso propietario registrado ya no existe, el inicio recupera el bloqueo y continúa.
- Si cualquiera de los bloqueos está activo, el inicio vuelve a intentarlo durante un máximo de 5 segundos (de forma predeterminada) antes de desistir:

  ```text
  GatewayLockError("el gateway ya se está ejecutando (pid <pid>); tiempo de espera del bloqueo agotado tras <ms>ms")
  ```

### Enlace del socket

- En `EADDRINUSE`, el inicio vuelve a intentar el enlace hasta 20 veces, en intervalos de 500ms (aproximadamente 10 segundos en total), para superar un intervalo de `TIME_WAIT` tras la finalización reciente de un proceso.
- Si el puerto sigue en uso después de los reintentos:

  ```text
  GatewayLockError("otra instancia del gateway ya está escuchando en ws://127.0.0.1:<port>")
  ```

- Otros fallos de enlace:

  ```text
  GatewayLockError("no se pudo enlazar el socket del gateway en ws://127.0.0.1:<port>: <cause>")
  ```

Al apagarse, el Gateway cierra el servidor HTTP/WebSocket y elimina sus archivos
de bloqueo de estado y configuración.

## Notas operativas

- Si el puerto está ocupado por otro proceso que no es un Gateway, el error es el mismo; libere el puerto o elija otro mediante `openclaw gateway --port <port>`.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` permite varias instancias de configuración y ejecución, no un estado mutable compartido. Cada instancia sigue necesitando un `OPENCLAW_STATE_DIR` único.
- Con un supervisor de servicios, un nuevo proceso de Gateway que detecta cualquiera de los errores anteriores primero comprueba `/healthz` en el proceso existente. Si ese proceso está en buen estado, el nuevo proceso permite que conserve el control en lugar de fallar. En systemd, termina con el código `78`; el `RestartPreventExitStatus=78` de la unidad evita que `Restart=always` se repita indefinidamente por un conflicto de bloqueo o de `EADDRINUSE`. Si el proceso existente nunca alcanza un estado correcto, los reintentos de comprobación de estado tienen un límite de tiempo y, a continuación, el inicio falla con el error de bloqueo anterior en lugar de repetirse indefinidamente.
- La aplicación para macOS mantiene su propia protección ligera mediante PID antes de iniciar el Gateway; el archivo de bloqueo y el enlace del socket anteriores son los mecanismos reales de aplicación durante la ejecución.

## Temas relacionados

- [Varios Gateway](/es/gateway/multiple-gateways) - ejecución de varias instancias con puertos únicos
- [Solución de problemas](/es/gateway/troubleshooting) - diagnóstico de `EADDRINUSE` y conflictos de puertos
