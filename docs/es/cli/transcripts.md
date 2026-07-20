---
read_when:
    - Quieres leer los resúmenes de transcripciones almacenados desde el terminal.
    - Necesitas la ruta a un resumen de transcripciones en Markdown
    - Está depurando la estructura de almacenamiento de las transcripciones principales
summary: Referencia de la CLI para `openclaw transcripts` (enumerar, mostrar y localizar transcripciones almacenadas)
title: CLI de transcripciones
x-i18n:
    generated_at: "2026-07-20T00:49:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5615c3051f31f9ae38acb70c8bb00e187b987366d41b8e2049c97ba953aa35d
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Inspector de solo lectura para las transcripciones escritas por la herramienta de agente `transcripts`.
La captura, la importación y el resumen se ejecutan mediante esa herramienta, no mediante esta CLI.

Los artefactos se encuentran en el directorio de estado:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

El directorio de estado predeterminado es `~/.openclaw`; se puede sustituir con `OPENCLAW_STATE_DIR`.
El directorio de fecha se obtiene de la hora de inicio de la sesión; el directorio de sesión es
un slug seguro para el sistema de archivos derivado del id. de sesión.

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

| Comando                       | Descripción                                     |
| ----------------------------- | ----------------------------------------------- |
| `list`                        | Enumera las sesiones almacenadas.                           |
| `show <session>`              | Imprime el `summary.md` almacenado.                  |
| `path <session>`              | Imprime la ruta de `summary.md`.                    |
| `path <session> --dir`        | Imprime el directorio de la sesión.                    |
| `path <session> --metadata`   | Imprime `metadata.json`.                          |
| `path <session> --transcript` | Imprime `transcript.jsonl`.                       |
| `--json`                      | Imprime una salida legible por máquina (cualquier subcomando). |

`<session>` acepta un id. de sesión sin calificar o un selector con fecha
(`YYYY-MM-DD/<session>`). Utilice el formato calificado cuando el mismo id. de sesión
aparezca en más de un día, por ejemplo, `openclaw transcripts show
2026-05-22/standup`. Los id. de sesión predeterminados incluyen una marca de tiempo y un
sufijo aleatorio; asigne un id. fijo a una sesión solo cuando sea único dentro del día.

## Salida

`list` imprime una línea separada por tabulaciones por cada sesión: selector, hora de inicio, título y
ruta del resumen.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Reunión semanal  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

El selector es el valor más seguro para volver a pasar a `show` o `path`.

`list --json` devuelve objetos con `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` devuelve los metadatos de la sesión almacenados, el selector, el directorio de la
sesión, la ruta del resumen y el texto Markdown del resumen.

`path --json` devuelve la ruta seleccionada e indica si ese archivo existe.

## Varias sesiones al día

Las sesiones se agrupan por fecha y, a continuación, por id. de sesión. Diez reuniones en un día se convierten en
diez carpetas hermanas:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Utilice los id. generados de forma predeterminada para la automatización. Utilice un id. fijo como `standup` solo
cuando no vaya a repetirse en la misma fecha.

## Resúmenes ausentes

Las sesiones en directo escriben `summary.md` cuando la sesión se detiene; las transcripciones importadas
lo escriben inmediatamente después de la importación. Una sesión puede aparecer en `list` sin un
resumen mientras la captura siga activa, si un proveedor falló durante la detención o si
los metadatos se escribieron antes de que llegara ninguna intervención.

Utilice `path <session> --transcript` para inspeccionar la transcripción sin procesar de solo anexado,
o ejecute la acción `summarize` de la herramienta `transcripts` para volver a generar el resumen
en Markdown.

## Configuración

La captura es opcional (las fuentes en directo pueden unirse y grabar el audio de las reuniones). Actívela
con:

```json
{
  "transcripts": {
    "enabled": true
  }
}
```

- `enabled` (valor predeterminado: `false`): activa la herramienta.
  Configure las fuentes de inicio automático con `transcripts.autoStart`. Cada entrada se
  activa al estar presente; omita una entrada para desactivar esa fuente. `discord-voice`
  es la fuente integrada compatible con el inicio automático y requiere `guildId` y
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
