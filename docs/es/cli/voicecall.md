---
read_when:
    - Usas el plugin de llamadas de voz y quieres todos los puntos de entrada de la CLI
    - Necesitas tablas de opciones y valores predeterminados para setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose y start
summary: Referencia de la CLI para `openclaw voicecall` (superficie de comandos del plugin de llamadas de voz)
title: Llamada de voz
x-i18n:
    generated_at: "2026-07-11T22:58:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` es un comando proporcionado por un plugin. Solo aparece cuando el plugin de llamadas de voz está instalado y habilitado.

Cuando el Gateway está en ejecución, los comandos operativos (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) se enrutan al entorno de ejecución de llamadas de voz de ese Gateway. Si no se puede acceder a ningún Gateway, recurren a un entorno de ejecución independiente de la CLI.

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

| Subcomando | Descripción                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| `setup`    | Muestra las comprobaciones de disponibilidad del proveedor y del Webhook.           |
| `smoke`    | Ejecuta comprobaciones de disponibilidad; solo realiza una llamada de prueba real con `--yes`. |
| `call`     | Inicia una llamada de voz saliente.                                                 |
| `start`    | Alias de `call` que requiere `--to` y permite omitir `--message`.                    |
| `continue` | Reproduce un mensaje y espera la siguiente respuesta.                               |
| `speak`    | Reproduce un mensaje sin esperar una respuesta.                                     |
| `dtmf`     | Envía dígitos DTMF a una llamada activa.                                            |
| `end`      | Cuelga una llamada activa.                                                          |
| `status`   | Inspecciona las llamadas activas (o una mediante `--call-id`).                       |
| `tail`     | Sigue `calls.jsonl` (útil durante las pruebas del proveedor).                        |
| `latency`  | Resume las métricas de latencia de turnos de `calls.jsonl`.                         |
| `expose`   | Alterna Tailscale Serve/Funnel para el punto de conexión del Webhook.                |

## Configuración y prueba rápida

### `setup`

De forma predeterminada, imprime comprobaciones de disponibilidad legibles para humanos. Use `--json` para scripts.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Ejecuta las mismas comprobaciones de disponibilidad. Solo realiza una llamada telefónica real cuando se proporcionan tanto `--to` como `--yes`.

| Opción             | Valor predeterminado               | Descripción                                            |
| ------------------ | ---------------------------------- | ------------------------------------------------------ |
| `-t, --to <phone>` | (ninguno)                          | Número de teléfono al que llamar para una prueba real. |
| `--message <text>` | `OpenClaw voice call smoke test.`  | Mensaje que se reproducirá durante la llamada de prueba. |
| `--mode <mode>`    | `notify`                           | Modo de llamada: `notify` o `conversation`.            |
| `--yes`            | `false`                            | Realiza efectivamente la llamada saliente real.        |
| `--json`           | `false`                            | Imprime JSON legible por máquinas.                     |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # ejecución de prueba
openclaw voicecall smoke --to "+15555550123" --yes  # llamada real de notificación
```

<Note>
Para los proveedores externos (`plivo`, `telnyx`, `twilio`), `setup` y `smoke` requieren una URL pública de Webhook procedente de `publicUrl`, un túnel o la exposición mediante Tailscale. Se rechaza recurrir a local loopback o a un servicio privado porque los operadores no pueden acceder a ellos.
</Note>

## Ciclo de vida de las llamadas

### `call`

Inicia una llamada de voz saliente.

| Opción                 | Obligatoria | Valor predeterminado | Descripción                                                                         |
| ---------------------- | ----------- | -------------------- | ----------------------------------------------------------------------------------- |
| `-m, --message <text>` | sí          | (ninguno)            | Mensaje que se reproducirá cuando se conecte la llamada.                             |
| `-t, --to <phone>`     | no          | config `toNumber`    | Número de teléfono E.164 al que llamar.                                              |
| `--mode <mode>`        | no          | `conversation`       | Modo de llamada: `notify` (cuelga tras el mensaje) o `conversation` (permanece abierta). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias de `call` con una configuración predeterminada de opciones diferente.

| Opción             | Obligatoria | Valor predeterminado | Descripción                                             |
| ------------------ | ----------- | -------------------- | ------------------------------------------------------- |
| `--to <phone>`     | sí          | (ninguno)            | Número de teléfono al que llamar.                       |
| `--message <text>` | no          | (ninguno)            | Mensaje que se reproducirá cuando se conecte la llamada. |
| `--mode <mode>`    | no          | `conversation`       | Modo de llamada: `notify` o `conversation`.             |

### `continue`

Reproduce un mensaje y espera una respuesta.

| Opción             | Obligatoria | Descripción                |
| ------------------ | ----------- | -------------------------- |
| `--call-id <id>`   | sí          | Identificador de llamada.  |
| `--message <text>` | sí          | Mensaje que se reproducirá. |

### `speak`

Reproduce un mensaje sin esperar una respuesta.

| Opción             | Obligatoria | Descripción                |
| ------------------ | ----------- | -------------------------- |
| `--call-id <id>`   | sí          | Identificador de llamada.  |
| `--message <text>` | sí          | Mensaje que se reproducirá. |

### `dtmf`

Envía dígitos DTMF a una llamada activa.

| Opción              | Obligatoria | Descripción                                                   |
| ------------------- | ----------- | ------------------------------------------------------------- |
| `--call-id <id>`    | sí          | Identificador de llamada.                                     |
| `--digits <digits>` | sí          | Dígitos DTMF (por ejemplo, `ww123456#` para introducir pausas). |

### `end`

Cuelga una llamada activa.

| Opción           | Obligatoria | Descripción               |
| ---------------- | ----------- | ------------------------- |
| `--call-id <id>` | sí          | Identificador de llamada. |

### `status`

Inspecciona las llamadas activas.

| Opción           | Valor predeterminado | Descripción                              |
| ---------------- | -------------------- | ---------------------------------------- |
| `--call-id <id>` | (ninguno)            | Restringe la salida a una sola llamada.  |
| `--json`         | `false`              | Imprime JSON legible por máquinas.       |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Registros y métricas

### `tail`

Sigue el registro JSONL de llamadas de voz. Al iniciarse, imprime las últimas `--since` líneas y, después, transmite las líneas nuevas a medida que se escriben.

| Opción          | Valor predeterminado                  | Descripción                                  |
| --------------- | ------------------------------------- | -------------------------------------------- |
| `--file <path>` | determinado desde el almacén del plugin | Ruta a `calls.jsonl`.                        |
| `--since <n>`   | `25`                                  | Líneas que se imprimirán antes de seguirlas. |
| `--poll <ms>`   | `250` (mínimo 50)                     | Intervalo de consulta en milisegundos.       |

### `latency`

Resume las métricas de latencia de turnos y espera de escucha de `calls.jsonl`. La salida es JSON con resúmenes de `recordsScanned`, `turnLatency` y `listenWait`.

| Opción          | Valor predeterminado                    | Descripción                                      |
| --------------- | --------------------------------------- | ------------------------------------------------ |
| `--file <path>` | determinado desde el almacén del plugin | Ruta a `calls.jsonl`.                            |
| `--last <n>`    | `200` (mínimo 1)                        | Número de registros recientes que se analizarán. |

## Exposición de webhooks

### `expose`

Habilita, deshabilita o cambia la configuración de Tailscale Serve/Funnel para el Webhook de voz.

| Opción                | Valor predeterminado                         | Descripción                                         |
| --------------------- | -------------------------------------------- | --------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                     | `off`, `serve` (tailnet) o `funnel` (público).      |
| `--path <path>`       | config `tailscale.path` o `--serve-path`     | Ruta de Tailscale que se expondrá.                  |
| `--port <port>`       | config `serve.port` o `3334`                 | Puerto local del Webhook.                           |
| `--serve-path <path>` | config `serve.path` o `/voice/webhook`       | Ruta local del Webhook.                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Exponga el punto de conexión del Webhook únicamente a redes de confianza. Siempre que sea posible, prefiera Tailscale Serve a Funnel.
</Warning>

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Plugin de llamadas de voz](/es/plugins/voice-call)
