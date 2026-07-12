---
read_when:
    - Adición o modificación del comportamiento de ejecución en segundo plano
    - Depuración de tareas de ejecución de larga duración
summary: Ejecución en segundo plano y gestión de procesos
title: Ejecución en segundo plano y herramienta de procesos
x-i18n:
    generated_at: "2026-07-12T14:26:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw ejecuta comandos de shell mediante la herramienta `exec` y mantiene en memoria las tareas de larga duración. La herramienta `process` administra esas sesiones en segundo plano.

## Herramienta exec

Parámetros:

| Parámetro    | Descripción                                                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `command`    | Obligatorio. Comando de shell que se ejecutará.                                                                                                                                                        |
| `workdir`    | Directorio de trabajo; omítalo para usar el directorio de trabajo actual predeterminado.                                                                                                               |
| `env`        | Variables de entorno adicionales para el comando.                                                                                                                                                      |
| `yieldMs`    | Milisegundos que se esperará antes de pasar a segundo plano (valor predeterminado: 10000).                                                                                                              |
| `background` | Ejecutar inmediatamente en segundo plano.                                                                                                                                                              |
| `timeout`    | Tiempo de espera en segundos (valor predeterminado: `tools.exec.timeoutSec`); finaliza el proceso cuando vence. Establezca `timeout: 0` para desactivar el tiempo de espera del proceso exec en esa llamada. |
| `pty`        | Ejecutar en un seudoterminal cuando esté disponible (CLI que requieren TTY, agentes de programación).                                                                                                   |
| `elevated`   | Ejecutar fuera del entorno aislado si el modo elevado está habilitado o permitido (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).                                     |
| `host`       | Destino de exec: `auto`, `sandbox`, `gateway` o `node`.                                                                                                                                                |
| `node`       | Id./nombre del Node, utilizado con `host: "node"`.                                                                                                                                                     |

Comportamiento:

- Las ejecuciones en primer plano devuelven la salida directamente.
- Cuando se ejecuta en segundo plano (de forma explícita o al agotarse el tiempo de `yieldMs`), la herramienta devuelve `status: "running"` + `sessionId` y un breve fragmento final de la salida.
- Las ejecuciones en segundo plano y con `yieldMs` heredan `tools.exec.timeoutSec`, salvo que la llamada proporcione un `timeout` explícito.
- La salida permanece en memoria hasta que se consulta o elimina la sesión.
- Si no se permite la herramienta `process`, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
- Los comandos exec iniciados reciben `OPENCLAW_SHELL=exec` para las reglas de shell/perfil que dependen del contexto.
- Para trabajos de larga duración que comienzan ahora: inícielos una sola vez y confíe en la activación automática al completarse (cuando esté habilitada) una vez que el comando genere una salida o falle.
- Si la activación automática al completarse no está disponible, o se necesita confirmar la finalización correcta de un comando que termina sin generar salida, realice consultas con `process`.
- No emule recordatorios ni seguimientos diferidos con bucles de `sleep` o consultas repetidas; use cron para el trabajo futuro.

### Sustituciones mediante variables de entorno

| Variable                                 | Efecto                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_BASH_YIELD_MS`                 | Espera predeterminada antes de pasar a segundo plano (ms). Valor predeterminado: 10000, limitado a 10-120000.             |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Límite de la salida en memoria (caracteres).                                                                              |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Límite de stdout/stderr pendiente por flujo (caracteres).                                                                 |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL de las sesiones finalizadas (ms), limitado a 1m-3h.                                                                   |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Umbral de inactividad de la salida antes de marcar como probablemente en espera de entrada las sesiones en segundo plano que admiten escritura. Valor predeterminado: 15000. |

### Configuración (preferible a las sustituciones mediante variables de entorno)

| Clave                                 | Valor predeterminado | Efecto                                                                                       |
| ------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000                | Igual que `OPENCLAW_BASH_YIELD_MS`.                                                          |
| `tools.exec.timeoutSec`               | 1800                 | Tiempo de espera predeterminado por llamada.                                                 |
| `tools.exec.cleanupMs`                | 1800000              | Igual que `OPENCLAW_BASH_JOB_TTL_MS`.                                                        |
| `tools.exec.notifyOnExit`             | true                 | Pone en cola un evento del sistema y solicita un heartbeat cuando termina un exec en segundo plano. |
| `tools.exec.notifyOnExitEmptySuccess` | false                | También pone en cola eventos de finalización para ejecuciones correctas en segundo plano sin salida. |

## Puente de procesos secundarios

Al iniciar procesos secundarios de larga duración fuera de las herramientas exec/process (reinicios de la CLI, auxiliares del gateway), adjunte el auxiliar del puente de procesos secundarios para que las señales de finalización se reenvíen y los escuchadores se desvinculen al producirse una salida o un error. Esto evita procesos huérfanos en systemd y mantiene una finalización coherente entre plataformas.

## Herramienta process

Acciones:

| Acción      | Efecto                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------- |
| `list`      | Sesiones en ejecución y finalizadas.                                                                |
| `poll`      | Obtiene la nueva salida de una sesión (también informa del estado de salida).                        |
| `log`       | Lee la salida agregada y las indicaciones de recuperación de entrada. Admite `offset` + `limit`.     |
| `write`     | Envía datos a stdin (`data`, `eof` opcional).                                                       |
| `send-keys` | Envía tokens de teclas explícitos o bytes a una sesión respaldada por PTY.                           |
| `submit`    | Envía Intro/retorno de carro a una sesión respaldada por PTY.                                       |
| `paste`     | Envía texto literal, opcionalmente envuelto en el modo de pegado entre corchetes.                    |
| `kill`      | Finaliza una sesión en segundo plano.                                                               |
| `clear`     | Elimina de la memoria una sesión finalizada.                                                        |
| `remove`    | La finaliza si está en ejecución; de lo contrario, la elimina si ha terminado.                      |

Notas:

- Solo se enumeran y conservan las sesiones en segundo plano; únicamente en memoria, no en disco. Las sesiones se pierden al reiniciar el proceso.
- Una sesión en segundo plano activa bloquea la suspensión cooperativa del host y el reinicio seguro del Gateway hasta que el propietario del proceso confirme que realmente ha terminado.
- `process remove` puede ocultar de inmediato una sesión en ejecución tras solicitar su finalización; la suspensión y el reinicio permanecen bloqueados hasta que se confirme su salida.
- Los registros de sesión solo se guardan en el historial del chat si se ejecuta `process poll`/`log` y se registra el resultado de la herramienta.
- `process` tiene un ámbito por agente; solo ve las sesiones iniciadas por ese agente.
- Use `poll`/`log` para consultar el estado, los registros o la confirmación de finalización cuando la activación automática al completarse no esté disponible.
- Use `log` antes de recuperar una CLI interactiva, para que la transcripción actual, el estado de stdin y la indicación de espera de entrada estén visibles conjuntamente.
- Use `write`/`send-keys`/`submit`/`paste`/`kill` cuando se necesite proporcionar datos o intervenir.
- `process list` incluye un `name` derivado (verbo del comando + destino) para realizar revisiones rápidas.
- `process list`, `poll` y `log` informan de `waitingForInput` solo cuando la sesión todavía dispone de stdin con capacidad de escritura y ha permanecido inactiva durante más tiempo que el umbral de espera de entrada (valor predeterminado: 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` usa `offset`/`limit` basados en líneas. Cuando se omiten ambos, devuelve las últimas 200 líneas con una indicación de paginación. Cuando se establece `offset` sin `limit`, devuelve desde `offset` hasta el final (sin limitarse a 200).
- El `timeout` de `poll` espera como máximo esa cantidad de milisegundos antes de devolver el resultado; los valores superiores a 30000 se limitan a 30000.
- Las consultas sirven para obtener el estado bajo demanda, no para programar bucles de espera. Si el trabajo debe realizarse más adelante, use cron.

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

Enviar teclas a la PTY:

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

- [Herramienta Exec](/es/tools/exec)
- [Aprobaciones de Exec](/es/tools/exec-approvals)
