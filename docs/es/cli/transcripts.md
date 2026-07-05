---
read_when:
    - Quieres leer resúmenes de transcripciones almacenados desde la terminal
    - Necesitas la ruta a un resumen Markdown de transcripciones
    - Estás depurando el diseño de almacenamiento de las transcripciones del núcleo
summary: Referencia de CLI para `openclaw transcripts` (listar, mostrar y localizar transcripciones almacenadas)
title: CLI de transcripciones
x-i18n:
    generated_at: "2026-07-05T11:10:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Inspector de solo lectura para transcripciones escritas por la herramienta de agente `transcripts`.
La captura, la importación y la resumición se ejecutan mediante esa herramienta, no esta CLI.

Los artefactos se encuentran bajo el directorio de estado:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

El directorio de estado predeterminado es `~/.openclaw`; anúlelo con `OPENCLAW_STATE_DIR`.
El directorio de fecha proviene de la hora de inicio de la sesión; el directorio de sesión es
un slug seguro para el sistema de archivos derivado del id de sesión.

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
| `list`                        | Lista las sesiones almacenadas.                 |
| `show <session>`              | Imprime el `summary.md` almacenado.             |
| `path <session>`              | Imprime la ruta de `summary.md`.                |
| `path <session> --dir`        | Imprime el directorio de la sesión.             |
| `path <session> --metadata`   | Imprime `metadata.json`.                        |
| `path <session> --transcript` | Imprime `transcript.jsonl`.                     |
| `--json`                      | Imprime salida legible por máquina (cualquier subcomando). |

`<session>` acepta un id de sesión sin prefijo o un selector calificado por fecha
(`YYYY-MM-DD/<session>`). Use la forma calificada cuando el mismo id de sesión
aparezca en más de un día, por ejemplo `openclaw transcripts show
2026-05-22/standup`. Los ids de sesión predeterminados incluyen una marca de tiempo y un sufijo
aleatorio; asigne a una sesión un id fijo solo cuando ese id sea único dentro del día.

## Salida

`list` imprime una línea separada por tabulaciones por sesión: selector, hora de inicio, título,
ruta del resumen.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

El selector es el valor más seguro para volver a pasar a `show` o `path`.

`list --json` devuelve objetos con `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` devuelve los metadatos de sesión almacenados, el selector, el directorio de
sesión, la ruta del resumen y el texto Markdown del resumen.

`path --json` devuelve la ruta seleccionada y si ese archivo existe.

## Muchas sesiones por día

Las sesiones se agrupan por fecha y luego por id de sesión. Diez reuniones en un día se convierten en
diez carpetas hermanas:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Use ids generados predeterminados para la automatización. Use un id fijo como `standup` solo
cuando no se repita en la misma fecha.

## Resúmenes faltantes

Las sesiones en vivo escriben `summary.md` cuando la sesión se detiene; las transcripciones importadas
lo escriben inmediatamente después de la importación. Una sesión puede aparecer en `list` sin un
resumen mientras la captura aún está activa, si un proveedor falló durante la detención o si
los metadatos se escribieron antes de que llegara cualquier intervención.

Use `path <session> --transcript` para inspeccionar la transcripción sin procesar de solo adición,
o ejecute la acción `summarize` de la herramienta `transcripts` para regenerar el resumen
Markdown.

## Configuración

La captura es opcional (las fuentes en vivo pueden unirse y grabar audio de reuniones). Habilítela
con:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (predeterminado `false`): activa la herramienta.
- `maxUtterances` (predeterminado `2000`, limitado a 1-10000): tamaño del búfer de intervenciones por
  sesión.

Configure las fuentes de inicio automático con `transcripts.autoStart`. Cada entrada está
habilitada por estar presente; omita una entrada para deshabilitar esa fuente. `discord-voice`
es la fuente incluida con capacidad de inicio automático y requiere `guildId` y
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
