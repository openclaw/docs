---
read_when:
    - Usas el plugin de llamadas de voz y quieres todos los puntos de entrada de la CLI
    - Necesitas tablas de flags y valores predeterminados para setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose y start
summary: Referencia de CLI para `openclaw voicecall` (superficie de comandos del plugin de llamadas de voz)
title: Llamada de voz
x-i18n:
    generated_at: "2026-07-05T11:12:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` es un comando proporcionado por un Plugin. Solo aparece cuando el Plugin de llamadas de voz está instalado y habilitado.

Cuando el Gateway está en ejecución, los comandos operativos (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, `status`) se enrutan al runtime de llamadas de voz de ese Gateway. Si no se puede alcanzar ningún Gateway, recurren a un runtime de CLI independiente.

## Subcomandos

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Subcomando | Descripción                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| `setup`    | Muestra comprobaciones de preparación del proveedor y el webhook.            |
| `smoke`    | Ejecuta comprobaciones de preparación; realiza una llamada de prueba en vivo solo con `--yes`. |
| `call`     | Inicia una llamada de voz saliente.                                          |
| `start`    | Alias de `call` con `--to` obligatorio y `--message` opcional.               |
| `continue` | Reproduce un mensaje y espera la siguiente respuesta.                        |
| `speak`    | Reproduce un mensaje sin esperar una respuesta.                              |
| `dtmf`     | Envía dígitos DTMF a una llamada activa.                                     |
| `end`      | Cuelga una llamada activa.                                                   |
| `status`   | Inspecciona las llamadas activas (o una por `--call-id`).                    |
| `tail`     | Sigue `calls.jsonl` (útil durante pruebas de proveedores).                   |
| `latency`  | Resume métricas de latencia de turnos desde `calls.jsonl`.                   |
| `expose`   | Alterna Tailscale serve/funnel para el endpoint del webhook.                 |

## Configuración y smoke

### `setup`

Imprime comprobaciones de preparación legibles por humanos de forma predeterminada. Pasa `--json` para scripts.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Ejecuta las mismas comprobaciones de preparación. Realiza una llamada telefónica real solo cuando están presentes tanto `--to` como `--yes`.

| Flag               | Predeterminado                    | Descripción                                      |
| ------------------ | --------------------------------- | ------------------------------------------------ |
| `-t, --to <phone>` | (ninguno)                         | Número de teléfono al que llamar para un smoke en vivo. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Mensaje que se reproducirá durante la llamada smoke. |
| `--mode <mode>`    | `notify`                          | Modo de llamada: `notify` o `conversation`.      |
| `--yes`            | `false`                           | Realiza realmente la llamada saliente en vivo.   |
| `--json`           | `false`                           | Imprime JSON legible por máquina.                |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
Para proveedores externos (`plivo`, `telnyx`, `twilio`), `setup` y `smoke` requieren una URL pública de webhook desde `publicUrl`, un túnel o exposición de Tailscale. Se rechaza un fallback de loopback o serve privado porque los operadores no pueden alcanzarlo.
</Note>

## Ciclo de vida de llamadas

### `call`

Inicia una llamada de voz saliente.

| Flag                   | Obligatorio | Predeterminado  | Descripción                                                               |
| ---------------------- | ----------- | ---------------- | ------------------------------------------------------------------------- |
| `-m, --message <text>` | sí          | (ninguno)        | Mensaje que se reproducirá cuando se conecte la llamada.                  |
| `-t, --to <phone>`     | no          | config `toNumber` | Número de teléfono E.164 al que llamar.                                  |
| `--mode <mode>`        | no          | `conversation`   | Modo de llamada: `notify` (colgar después del mensaje) o `conversation` (mantener abierta). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias de `call` con una forma de flags predeterminada diferente.

| Flag               | Obligatorio | Predeterminado | Descripción                                              |
| ------------------ | ----------- | -------------- | -------------------------------------------------------- |
| `--to <phone>`     | sí          | (ninguno)      | Número de teléfono al que llamar.                        |
| `--message <text>` | no          | (ninguno)      | Mensaje que se reproducirá cuando se conecte la llamada. |
| `--mode <mode>`    | no          | `conversation` | Modo de llamada: `notify` o `conversation`.              |

### `continue`

Reproduce un mensaje y espera una respuesta.

| Flag               | Obligatorio | Descripción              |
| ------------------ | ----------- | ------------------------ |
| `--call-id <id>`   | sí          | ID de llamada.           |
| `--message <text>` | sí          | Mensaje que reproducir.  |

### `speak`

Reproduce un mensaje sin esperar una respuesta.

| Flag               | Obligatorio | Descripción              |
| ------------------ | ----------- | ------------------------ |
| `--call-id <id>`   | sí          | ID de llamada.           |
| `--message <text>` | sí          | Mensaje que reproducir.  |

### `dtmf`

Envía dígitos DTMF a una llamada activa.

| Flag                | Obligatorio | Descripción                                                |
| ------------------- | ----------- | ---------------------------------------------------------- |
| `--call-id <id>`    | sí          | ID de llamada.                                             |
| `--digits <digits>` | sí          | Dígitos DTMF (por ejemplo `ww123456#` para esperas).       |

### `end`

Cuelga una llamada activa.

| Flag             | Obligatorio | Descripción    |
| ---------------- | ----------- | -------------- |
| `--call-id <id>` | sí          | ID de llamada. |

### `status`

Inspecciona las llamadas activas.

| Flag             | Predeterminado | Descripción                         |
| ---------------- | -------------- | ----------------------------------- |
| `--call-id <id>` | (ninguno)      | Restringe la salida a una llamada.  |
| `--json`         | `false`        | Imprime JSON legible por máquina.   |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Registros y métricas

### `tail`

Sigue el registro JSONL de llamadas de voz. Imprime las últimas `--since` líneas al iniciar y luego transmite las líneas nuevas a medida que se escriben.

| Flag            | Predeterminado                  | Descripción                                  |
| --------------- | -------------------------------- | -------------------------------------------- |
| `--file <path>` | resuelto desde el almacén del Plugin | Ruta a `calls.jsonl`.                     |
| `--since <n>`   | `25`                             | Líneas que imprimir antes de seguir.         |
| `--poll <ms>`   | `250` (mínimo 50)                | Intervalo de sondeo en milisegundos.         |

### `latency`

Resume métricas de latencia de turnos y espera de escucha desde `calls.jsonl`. La salida es JSON con resúmenes de `recordsScanned`, `turnLatency` y `listenWait`.

| Flag            | Predeterminado                  | Descripción                                  |
| --------------- | -------------------------------- | -------------------------------------------- |
| `--file <path>` | resuelto desde el almacén del Plugin | Ruta a `calls.jsonl`.                     |
| `--last <n>`    | `200` (mínimo 1)                 | Número de registros recientes que analizar.  |

## Exposición de webhooks

### `expose`

Habilita, deshabilita o cambia la configuración de Tailscale serve/funnel para el webhook de voz.

| Flag                  | Predeterminado                         | Descripción                                     |
| --------------------- | -------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                               | `off`, `serve` (tailnet) o `funnel` (público).  |
| `--path <path>`       | config `tailscale.path` o `--serve-path` | Ruta de Tailscale que exponer.                |
| `--port <port>`       | config `serve.port` o `3334`           | Puerto local del webhook.                       |
| `--serve-path <path>` | config `serve.path` o `/voice/webhook` | Ruta local del webhook.                         |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Expón el endpoint del webhook solo a redes en las que confíes. Prefiere Tailscale Serve sobre Funnel cuando sea posible.
</Warning>

## Relacionado

- [Referencia de CLI](/es/cli)
- [Plugin de llamadas de voz](/es/plugins/voice-call)
