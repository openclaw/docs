---
read_when:
    - Agregar o modificar el comportamiento de exec en segundo plano
    - Depuración de tareas exec de larga duración
summary: Ejecución en segundo plano con exec y gestión de procesos
title: Herramienta de ejecución en segundo plano y procesos
x-i18n:
    generated_at: "2026-07-05T11:16:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a4cd16585ee31038f5a9849add94ddc5056591d2f04523375b0a3f570a301c6
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw ejecuta comandos de shell mediante la herramienta `exec` y conserva las tareas de larga duración en memoria. La herramienta `process` administra esas sesiones en segundo plano.

## herramienta exec

Parámetros:

| Parámetro    | Descripción                                                                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Obligatorio. Comando de shell que se va a ejecutar.                                                                                                                         |
| `workdir`    | Directorio de trabajo; omítelo para usar el cwd predeterminado.                                                                                                             |
| `env`        | Variables de entorno adicionales para el comando.                                                                                                                           |
| `yieldMs`    | Milisegundos que se esperarán antes de enviar al segundo plano (valor predeterminado: 10000).                                                                                |
| `background` | Ejecutar en segundo plano inmediatamente.                                                                                                                                   |
| `timeout`    | Tiempo de espera en segundos (valor predeterminado: `tools.exec.timeoutSec`); mata el proceso al vencer. Define `timeout: 0` para desactivar el tiempo de espera del proceso exec para esa llamada. |
| `pty`        | Ejecutar en una pseudoterminal cuando esté disponible (CLI que requieren TTY, agentes de programación).                                                                     |
| `elevated`   | Ejecutar fuera del sandbox si el modo elevado está habilitado/permitido (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).                  |
| `host`       | Destino de exec: `auto`, `sandbox`, `gateway` o `node`.                                                                                                                     |
| `node`       | Id/nombre de Node, usado con `host: "node"`.                                                                                                                                |

Comportamiento:

- Las ejecuciones en primer plano devuelven la salida directamente.
- Cuando se envía al segundo plano (explícitamente o mediante el tiempo de espera de `yieldMs`), la herramienta devuelve `status: "running"` + `sessionId` y una cola breve de salida.
- Las ejecuciones en segundo plano y con `yieldMs` heredan `tools.exec.timeoutSec` salvo que la llamada pase un `timeout` explícito.
- La salida permanece en memoria hasta que se sondea o se borra la sesión.
- Si la herramienta `process` no está permitida, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
- Los comandos exec generados reciben `OPENCLAW_SHELL=exec` para reglas de shell/perfil conscientes del contexto.
- Para trabajo de larga duración que empieza ahora: inícialo una vez y confía en la activación automática al completarse (cuando esté habilitada) una vez que el comando emita salida o falle.
- Si la activación automática al completarse no está disponible, o necesitas confirmar éxito silencioso para un comando que sale correctamente sin salida, sondea con `process`.
- No emules recordatorios ni seguimientos diferidos con bucles `sleep` o sondeos repetidos; usa cron para trabajo futuro.

### Sobrescrituras de entorno

| Variable                                 | Efecto                                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Espera predeterminada antes de enviar al segundo plano (ms). Valor predeterminado: 10000, limitado a 10-120000.            |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Límite de salida en memoria (caracteres).                                                                                  |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Límite de stdout/stderr pendiente por flujo (caracteres).                                                                  |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL para sesiones finalizadas (ms), limitado a 1m-3h.                                                                      |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Umbral de salida inactiva antes de que las sesiones en segundo plano escribibles se marquen como probablemente esperando entrada. Valor predeterminado: 15000. |

### Configuración (preferida sobre las sobrescrituras de entorno)

| Clave                                 | Predeterminado | Efecto                                                                                  |
| ------------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000          | Igual que `OPENCLAW_BASH_YIELD_MS`.                                                     |
| `tools.exec.timeoutSec`               | 1800           | Tiempo de espera predeterminado por llamada.                                            |
| `tools.exec.cleanupMs`                | 1800000        | Igual que `OPENCLAW_BASH_JOB_TTL_MS`.                                                   |
| `tools.exec.notifyOnExit`             | true           | Encola un evento del sistema + solicita Heartbeat cuando sale un exec en segundo plano. |
| `tools.exec.notifyOnExitEmptySuccess` | false          | También encola eventos de finalización para ejecuciones en segundo plano correctas sin salida. |

## Puente de procesos hijos

Al generar procesos hijos de larga duración fuera de las herramientas exec/process (reinicios de CLI, helpers de gateway), adjunta el helper de puente de procesos hijos para que las señales de terminación se reenvíen y los listeners se desprendan al salir/error. Esto evita procesos huérfanos en systemd y mantiene un apagado coherente entre plataformas.

## herramienta process

Acciones:

| Acción      | Efecto                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `list`      | Sesiones en ejecución + finalizadas.                                                             |
| `poll`      | Drenar salida nueva de una sesión (también informa el estado de salida).                         |
| `log`       | Leer salida agregada y pistas de recuperación de entrada. Admite `offset` + `limit`.             |
| `write`     | Enviar stdin (`data`, `eof` opcional).                                                           |
| `send-keys` | Enviar tokens de tecla explícitos o bytes a una sesión respaldada por PTY.                       |
| `submit`    | Enviar Enter/retorno de carro a una sesión respaldada por PTY.                                   |
| `paste`     | Enviar texto literal, opcionalmente envuelto en modo de pegado entre corchetes.                  |
| `kill`      | Terminar una sesión en segundo plano.                                                            |
| `clear`     | Eliminar una sesión finalizada de la memoria.                                                    |
| `remove`    | Matar si está en ejecución; de lo contrario, borrar si finalizó.                                 |

Notas:

- Solo se listan/persisten las sesiones en segundo plano: únicamente en memoria, no en disco. Las sesiones se pierden al reiniciar el proceso.
- Los registros de sesión solo se guardan en el historial de chat si ejecutas `process poll`/`log` y se registra el resultado de la herramienta.
- `process` tiene alcance por agente; solo ve las sesiones iniciadas por ese agente.
- Usa `poll`/`log` para estado, registros o confirmación de finalización cuando la activación automática al completarse no esté disponible.
- Usa `log` antes de recuperar una CLI interactiva, para que la transcripción actual, el estado de stdin y la pista de espera de entrada sean visibles juntos.
- Usa `write`/`send-keys`/`submit`/`paste`/`kill` cuando necesites entrada o intervención.
- `process list` incluye un `name` derivado (verbo del comando + destino) para revisiones rápidas.
- `process list`, `poll` y `log` informan `waitingForInput` solo cuando la sesión todavía tiene stdin escribible y ha estado inactiva más tiempo que el umbral de espera de entrada (valor predeterminado: 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` usa `offset`/`limit` basados en líneas. Cuando ambos se omiten, devuelve las últimas 200 líneas con una pista de paginación. Cuando se establece `offset` y `limit` no, devuelve desde `offset` hasta el final (sin limitar a 200).
- El `timeout` de `poll` espera hasta esa cantidad de milisegundos antes de devolver; los valores superiores a 30000 se limitan a 30000.
- El sondeo es para estado bajo demanda, no para programar bucles de espera. Si el trabajo debe ocurrir más tarde, usa cron.

## Ejemplos

Ejecutar una tarea larga y sondear más tarde:

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

Enviar stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Enviar teclas PTY:

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

## Relacionado

- [Herramienta Exec](/es/tools/exec)
- [Aprobaciones de exec](/es/tools/exec-approvals)
