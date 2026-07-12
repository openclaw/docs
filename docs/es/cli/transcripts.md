---
read_when:
    - Quieres leer los resúmenes de transcripciones almacenados desde la terminal
    - Necesitas la ruta a un resumen de transcripciones en Markdown
    - Estás depurando la estructura de almacenamiento de las transcripciones del núcleo
summary: Referencia de la CLI para `openclaw transcripts` (listar, mostrar y localizar transcripciones almacenadas)
title: CLI de transcripciones
x-i18n:
    generated_at: "2026-07-11T23:01:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Inspector de solo lectura para las transcripciones escritas por la herramienta de agente `transcripts`.
La captura, la importación y el resumen se ejecutan mediante esa herramienta, no mediante esta CLI.

Los artefactos se almacenan en el directorio de estado:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

El directorio de estado predeterminado es `~/.openclaw`; puede cambiarlo con `OPENCLAW_STATE_DIR`.
El directorio de fecha se obtiene de la hora de inicio de la sesión; el directorio de sesión es
un identificador corto seguro para el sistema de archivos derivado del id. de sesión.

## Comandos

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| Comando                       | Descripción                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `list`                        | Enumera las sesiones almacenadas.                             |
| `show <session>`              | Muestra el archivo `summary.md` almacenado.                    |
| `path <session>`              | Muestra la ruta de `summary.md`.                               |
| `path <session> --dir`        | Muestra el directorio de la sesión.                            |
| `path <session> --metadata`   | Muestra `metadata.json`.                                       |
| `path <session> --transcript` | Muestra `transcript.jsonl`.                                    |
| `--json`                      | Muestra una salida legible por máquinas (cualquier subcomando). |

`<session>` acepta un id. de sesión sin calificar o un selector calificado por fecha
(`YYYY-MM-DD/<session>`). Use la forma calificada cuando el mismo id. de sesión
aparezca en más de un día; por ejemplo, `openclaw transcripts show
2026-05-22/standup`. Los id. de sesión predeterminados incluyen una marca de tiempo y un
sufijo aleatorio; asigne un id. fijo a una sesión solo cuando sea único durante ese día.

## Salida

`list` muestra una línea separada por tabulaciones por cada sesión: selector, hora de inicio, título
y ruta del resumen.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Reunión semanal  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

El selector es el valor más seguro para volver a pasarlo a `show` o `path`.

`list --json` devuelve objetos con `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath` y `hasSummary`.

`show --json` devuelve los metadatos de la sesión almacenada, el selector, el directorio
de la sesión, la ruta del resumen y el texto Markdown del resumen.

`path --json` devuelve la ruta seleccionada e indica si ese archivo existe.

## Varias sesiones por día

Las sesiones se agrupan primero por fecha y luego por id. de sesión. Diez reuniones en un día se convierten en
diez carpetas hermanas:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Use los id. generados de forma predeterminada para la automatización. Use un id. fijo como `standup` solo
cuando no vaya a repetirse en la misma fecha.

## Resúmenes ausentes

Las sesiones en directo escriben `summary.md` cuando la sesión se detiene; las transcripciones importadas
lo escriben inmediatamente después de la importación. Una sesión puede aparecer en `list` sin
resumen mientras la captura sigue activa, si un proveedor falla durante la detención o si
los metadatos se escribieron antes de que llegara alguna intervención.

Use `path <session> --transcript` para inspeccionar la transcripción sin procesar de solo anexado,
o ejecute la acción `summarize` de la herramienta `transcripts` para regenerar el resumen
en Markdown.

## Configuración

La captura requiere activación explícita (las fuentes en directo pueden unirse y grabar el audio de la reunión). Actívela
con:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (valor predeterminado: `false`): activa la herramienta.
- `maxUtterances` (valor predeterminado: `2000`, limitado a 1-10000): tamaño del búfer de intervenciones por
  sesión.

Configure las fuentes de inicio automático con `transcripts.autoStart`. Cada entrada se
activa al estar presente; omita una entrada para desactivar esa fuente. `discord-voice`
es la fuente incluida compatible con el inicio automático y requiere `guildId` y
`channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
