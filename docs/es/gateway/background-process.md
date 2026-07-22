---
read_when:
    - Añadir o modificar el comportamiento de ejecución en segundo plano
    - Depuración de tareas de ejecución prolongada
summary: Ejecución en segundo plano y gestión de procesos
title: Ejecución en segundo plano y herramienta de procesos
x-i18n:
    generated_at: "2026-07-22T10:33:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 37cb65ddf67227e32be972e77d16b9835d592120ecd12e041d05c48536fd2204
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw ejecuta comandos de shell mediante la herramienta `exec` y mantiene en memoria las tareas de larga duración. La herramienta `process` gestiona esas sesiones en segundo plano.

## Herramienta exec

Parámetros:

| Parámetro    | Descripción                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Obligatorio. Comando de shell que se ejecutará.                                                                                                            |
| `workdir`    | Directorio de trabajo; omítalo para usar el directorio de trabajo actual predeterminado.                                                                   |
| `env`        | Variables de entorno adicionales para el comando.                                                                                                         |
| `yieldMs`    | Milisegundos de espera antes de pasar a segundo plano (valor predeterminado: 10000).                                                                        |
| `background` | Ejecutar inmediatamente en segundo plano.                                                                                                                  |
| `timeout`    | Tiempo de espera en segundos (valor predeterminado: `tools.exec.timeoutSeconds`); finaliza el proceso cuando vence. Establezca `timeout: 0` para desactivar el tiempo de espera del proceso exec para esa llamada. |
| `pty`        | Ejecutar en un seudoterminal cuando esté disponible (CLI que requieren TTY, agentes de programación).                                                      |
| `elevated`   | Ejecutar fuera del entorno aislado si el modo elevado está habilitado o permitido (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`). |
| `host`       | Destino de exec: `auto`, `sandbox`, `gateway` o `node`.                                                         |
| `node`       | Id. o nombre del Node, utilizado con `host: "node"`.                                                                                                  |

Comportamiento:

- Las ejecuciones en primer plano devuelven la salida directamente.
- Cuando pasa a segundo plano (de forma explícita o por el tiempo de espera de `yieldMs`), la herramienta devuelve `status: "running"` + `sessionId` y un breve fragmento final de la salida.
- Las ejecuciones en segundo plano y `yieldMs` heredan `tools.exec.timeoutSeconds`, salvo que la llamada proporcione un valor `timeout` explícito.
- La salida permanece en memoria hasta que se consulta o borra la sesión.
- Si la herramienta `process` no está permitida, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
- Los comandos exec iniciados reciben `OPENCLAW_SHELL=exec` para aplicar reglas de shell o perfil que tengan en cuenta el contexto.
- Para un trabajo de larga duración que comienza ahora: inícielo una sola vez y espere la activación automática al finalizar (cuando esté habilitada) una vez que el comando produzca salida o falle.
- Si la activación automática al finalizar no está disponible, o se necesita confirmar el éxito silencioso de un comando que termina correctamente sin producir salida, consulte con `process`.
- No emule recordatorios ni seguimientos diferidos con bucles de `sleep` o consultas repetidas; use Cron para el trabajo futuro.

### Sustituciones mediante variables de entorno

| Variable                                 | Efecto                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Espera predeterminada antes de pasar a segundo plano (ms). Valor predeterminado: 10000; limitado a 10-120000.    |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Límite de salida en memoria (caracteres).                                                                         |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Límite de stdout/stderr pendiente por flujo (caracteres).                                                         |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL de las sesiones finalizadas (ms), limitado a 1m-3h.                                                          |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Umbral de inactividad de la salida antes de marcar las sesiones en segundo plano con capacidad de escritura como probablemente en espera de entrada. Valor predeterminado: 15000. |

### Configuración (preferible a las sustituciones mediante variables de entorno)

| Clave                                   | Valor predeterminado | Efecto                                                                          |
| --------------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000   | Igual que `OPENCLAW_BASH_YIELD_MS`.                                               |
| `tools.exec.timeoutSeconds`           | 1800    | Tiempo de espera predeterminado por llamada.                                 |
| `tools.exec.cleanupMs`                | 1800000 | Igual que `OPENCLAW_BASH_JOB_TTL_MS`.                                             |
| `tools.exec.notifyOnExit`             | true    | Pone en cola un evento del sistema y solicita un Heartbeat cuando finaliza una ejecución en segundo plano. |
| `tools.exec.notifyOnExitEmptySuccess` | false   | También pone en cola eventos de finalización para las ejecuciones en segundo plano que terminan correctamente sin producir salida. |

## Puente de procesos secundarios

Al iniciar procesos secundarios de larga duración fuera de las herramientas exec/process (reinicios de CLI, auxiliares del Gateway), adjunte el auxiliar de puente de procesos secundarios para que reenvíe las señales de terminación y retire los detectores al salir o producirse un error. Esto evita procesos huérfanos en systemd y mantiene un cierre uniforme entre plataformas.

## Herramienta process

Acciones:

| Acción      | Efecto                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| `list`      | Sesiones en ejecución y finalizadas.                                           |
| `poll`      | Extrae la salida nueva de una sesión (también informa del estado de salida).   |
| `log`       | Lee la salida agregada y las indicaciones para recuperar la entrada. Admite `offset` + `limit`. |
| `write`     | Envía datos a stdin (`data`, `eof` opcional).                                  |
| `send-keys` | Envía tokens de teclas explícitos o bytes a una sesión respaldada por PTY.     |
| `submit`    | Envía Intro o un retorno de carro a una sesión respaldada por PTY.             |
| `paste`     | Envía texto literal, opcionalmente envuelto en el modo de pegado entre corchetes. |
| `kill`      | Finaliza una sesión en segundo plano.                                          |
| `clear`     | Elimina de la memoria una sesión finalizada.                                   |
| `remove`    | Finaliza la sesión si está en ejecución; de lo contrario, la borra si ha finalizado. |

Notas:

- Solo se enumeran y conservan las sesiones en segundo plano: únicamente en memoria, no en disco. Las sesiones se pierden al reiniciar el proceso.
- Una sesión activa en segundo plano bloquea la suspensión cooperativa del host y el reinicio seguro del Gateway hasta que el propietario del proceso confirme su finalización real.
- `process remove` puede ocultar una sesión en ejecución inmediatamente después de solicitar su finalización; la suspensión y el reinicio siguen bloqueados hasta confirmar la salida.
- Los registros de sesión solo se guardan en el historial del chat si se ejecuta `process poll`/`log` y se registra el resultado de la herramienta.
- `process` tiene un ámbito por agente; solo muestra las sesiones iniciadas por ese agente.
- Use `poll`/`log` para consultar el estado, los registros o la confirmación de finalización cuando la activación automática al finalizar no esté disponible.
- Use `log` antes de recuperar una CLI interactiva para que la transcripción actual, el estado de stdin y la indicación de espera de entrada sean visibles conjuntamente.
- Use `write`/`send-keys`/`submit`/`paste`/`kill` cuando se necesite una entrada o intervención.
- `process list` incluye un valor `name` derivado (verbo del comando + destino) para realizar revisiones rápidas.
- `process list`, `poll` y `log` solo informan de `waitingForInput` cuando la sesión aún dispone de stdin con capacidad de escritura y ha permanecido inactiva durante más tiempo que el umbral de espera de entrada (valor predeterminado: 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` utiliza `offset`/`limit` basados en líneas. Cuando se omiten ambos, devuelve las últimas 200 líneas con una indicación de paginación. Cuando se establece `offset` y no `limit`, devuelve desde `offset` hasta el final (sin limitarse a 200).
- El valor `timeout` de `poll` espera como máximo esa cantidad de milisegundos antes de devolver el resultado; los valores superiores a 30000 se limitan a 30000.
- Las consultas sirven para comprobar el estado bajo demanda, no para programar bucles de espera. Si el trabajo debe realizarse más tarde, use Cron.

## Ejemplos

Ejecutar una tarea larga y consultarla más tarde:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inspeccionar una sesión interactiva antes de enviar datos:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Iniciar inmediatamente en segundo plano:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Enviar datos a stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Enviar teclas de PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Enviar la línea actual:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Pegar texto literal:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Contenido relacionado

- [Herramienta exec](/es/tools/exec)
- [Aprobaciones de exec](/es/tools/exec-approvals)
