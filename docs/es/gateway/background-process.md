---
read_when:
    - Añadir o modificar el comportamiento de ejecución en segundo plano
    - Depuración de tareas de ejecución de larga duración
summary: Ejecución en segundo plano y gestión de procesos
title: Ejecución en segundo plano y herramienta de procesos
x-i18n:
    generated_at: "2026-07-11T23:04:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw ejecuta comandos de shell mediante la herramienta `exec` y mantiene en memoria las tareas de larga duración. La herramienta `process` gestiona esas sesiones en segundo plano.

## Herramienta exec

Parámetros:

| Parámetro    | Descripción                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Obligatorio. Comando de shell que se ejecutará.                                                                                                                                                             |
| `workdir`    | Directorio de trabajo; omítalo para usar el directorio de trabajo actual predeterminado.                                                                                                                    |
| `env`        | Variables de entorno adicionales para el comando.                                                                                                                                                           |
| `yieldMs`    | Milisegundos que se esperará antes de pasar a segundo plano (valor predeterminado: 10000).                                                                                                                   |
| `background` | Ejecuta inmediatamente en segundo plano.                                                                                                                                                                    |
| `timeout`    | Tiempo de espera en segundos (valor predeterminado: `tools.exec.timeoutSec`); finaliza el proceso cuando vence. Establezca `timeout: 0` para desactivar el tiempo de espera del proceso exec en esa llamada. |
| `pty`        | Ejecuta en un pseudoterminal cuando esté disponible (CLI que requieren TTY, agentes de programación).                                                                                                        |
| `elevated`   | Ejecuta fuera del entorno aislado si el modo con privilegios elevados está habilitado o permitido (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).                        |
| `host`       | Destino de exec: `auto`, `sandbox`, `gateway` o `node`.                                                                                                                                                     |
| `node`       | Identificador o nombre del Node, usado con `host: "node"`.                                                                                                                                                  |

Comportamiento:

- Las ejecuciones en primer plano devuelven la salida directamente.
- Al pasar a segundo plano (de forma explícita o por agotarse el tiempo de `yieldMs`), la herramienta devuelve `status: "running"` + `sessionId` y un breve fragmento final de la salida.
- Las ejecuciones en segundo plano y con `yieldMs` heredan `tools.exec.timeoutSec`, a menos que la llamada proporcione un `timeout` explícito.
- La salida permanece en memoria hasta que se consulta o elimina la sesión.
- Si la herramienta `process` no está permitida, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
- Los comandos exec iniciados reciben `OPENCLAW_SHELL=exec` para las reglas de shell o perfil que tienen en cuenta el contexto.
- Para trabajos de larga duración que comienzan ahora: inícielos una sola vez y confíe en la reactivación automática al completarse (cuando esté habilitada) cuando el comando produzca salida o falle.
- Si la reactivación automática al completarse no está disponible, o necesita confirmar que un comando finalizó correctamente sin producir salida, consulte su estado con `process`.
- No simule recordatorios ni seguimientos diferidos con bucles de `sleep` o consultas repetidas: use Cron para el trabajo futuro.

### Sustituciones mediante variables de entorno

| Variable                                 | Efecto                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_BASH_YIELD_MS`                 | Espera predeterminada antes de pasar a segundo plano (ms). Valor predeterminado: 10000, limitado a 10-120000.                         |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Límite de la salida en memoria (caracteres).                                                                                          |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Límite de stdout/stderr pendiente por flujo (caracteres).                                                                             |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL de las sesiones finalizadas (ms), limitado a 1 min-3 h.                                                                           |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Umbral de inactividad de la salida antes de marcar las sesiones en segundo plano con escritura habilitada como probablemente en espera de entrada. Valor predeterminado: 15000. |

### Configuración (preferible a las sustituciones mediante variables de entorno)

| Clave                                 | Valor predeterminado | Efecto                                                                                           |
| ------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| `tools.exec.backgroundMs`             | 10000                | Igual que `OPENCLAW_BASH_YIELD_MS`.                                                              |
| `tools.exec.timeoutSec`               | 1800                 | Tiempo de espera predeterminado por llamada.                                                     |
| `tools.exec.cleanupMs`                | 1800000              | Igual que `OPENCLAW_BASH_JOB_TTL_MS`.                                                            |
| `tools.exec.notifyOnExit`             | true                 | Encola un evento del sistema y solicita un Heartbeat cuando finaliza una ejecución en segundo plano. |
| `tools.exec.notifyOnExitEmptySuccess` | false                | También encola eventos de finalización para las ejecuciones en segundo plano correctas sin salida.   |

## Puente de procesos secundarios

Al iniciar procesos secundarios de larga duración fuera de las herramientas exec/process (reinicios de CLI, auxiliares del Gateway), adjunte el auxiliar de puente de procesos secundarios para que las señales de terminación se reenvíen y los escuchadores se desvinculen al salir o producirse un error. Esto evita procesos huérfanos en systemd y mantiene un apagado uniforme entre plataformas.

## Herramienta process

Acciones:

| Acción      | Efecto                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `list`      | Sesiones en ejecución y finalizadas.                                                                      |
| `poll`      | Obtiene la nueva salida de una sesión (también informa del estado de salida).                             |
| `log`       | Lee la salida agregada y las indicaciones para recuperar la entrada. Admite `offset` + `limit`.           |
| `write`     | Envía datos a stdin (`data`, `eof` opcional).                                                             |
| `send-keys` | Envía tokens de teclas o bytes explícitos a una sesión respaldada por PTY.                                |
| `submit`    | Envía Intro/retorno de carro a una sesión respaldada por PTY.                                             |
| `paste`     | Envía texto literal, opcionalmente envuelto en el modo de pegado entre corchetes.                         |
| `kill`      | Finaliza una sesión en segundo plano.                                                                     |
| `clear`     | Elimina de la memoria una sesión finalizada.                                                              |
| `remove`    | La finaliza si está en ejecución; de lo contrario, la elimina si ya ha finalizado.                        |

Notas:

- Solo las sesiones en segundo plano se muestran y conservan; únicamente en memoria, no en disco. Las sesiones se pierden al reiniciar el proceso.
- Una sesión activa en segundo plano bloquea la suspensión cooperativa del host y el reinicio seguro del Gateway hasta que el propietario del proceso confirme su salida efectiva.
- `process remove` puede ocultar una sesión en ejecución inmediatamente después de solicitar su finalización; la suspensión y el reinicio permanecen bloqueados hasta que se confirme la salida.
- Los registros de sesión solo se guardan en el historial del chat si ejecuta `process poll`/`log` y se registra el resultado de la herramienta.
- `process` tiene un ámbito por agente; solo ve las sesiones iniciadas por ese agente.
- Use `poll`/`log` para consultar el estado y los registros, o para confirmar la finalización cuando la reactivación automática al completarse no esté disponible.
- Use `log` antes de recuperar una CLI interactiva, para que la transcripción actual, el estado de stdin y la indicación de espera de entrada sean visibles juntos.
- Use `write`/`send-keys`/`submit`/`paste`/`kill` cuando necesite proporcionar entrada o intervenir.
- `process list` incluye un `name` derivado (verbo del comando + destino) para realizar consultas rápidas.
- `process list`, `poll` y `log` informan de `waitingForInput` solo cuando la sesión aún tiene stdin con escritura habilitada y ha permanecido inactiva durante más tiempo que el umbral de espera de entrada (valor predeterminado: 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` usa `offset`/`limit` basados en líneas. Si se omiten ambos, devuelve las últimas 200 líneas con una indicación de paginación. Si se establece `offset` pero no `limit`, devuelve desde `offset` hasta el final (sin limitarse a 200).
- El `timeout` de `poll` espera hasta esa cantidad de milisegundos antes de devolver el resultado; los valores superiores a 30000 se limitan a 30000.
- Las consultas sirven para obtener el estado bajo demanda, no para programar bucles de espera. Si el trabajo debe realizarse más adelante, use Cron.

## Ejemplos

Ejecutar una tarea larga y consultar su estado más tarde:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inspeccionar una sesión interactiva antes de enviar entrada:

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
