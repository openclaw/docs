---
read_when:
    - Depuración de por qué un agente respondió, falló o llamó a herramientas de una manera determinada
    - Exportación de un paquete de soporte para una sesión de OpenClaw
    - Investigación del contexto del prompt, las llamadas a herramientas, los errores de ejecución o los metadatos de uso
    - Desactivar la captura de trayectorias
summary: Exportar paquetes de trayectorias censurados para depurar una sesión de agente de OpenClaw
title: Paquetes de trayectorias
x-i18n:
    generated_at: "2026-07-12T14:54:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

La captura de trayectorias es el registrador de vuelo por sesión de OpenClaw. Registra una
cronología estructurada de cada ejecución del agente y, después, `/export-trajectory` empaqueta la
sesión actual en un paquete de soporte con datos confidenciales ocultos que incluye:

- El prompt, el prompt del sistema y las herramientas enviados al modelo
- Qué mensajes de la transcripción y llamadas a herramientas condujeron a una respuesta
- Si la ejecución agotó el tiempo de espera, se anuló, se compactó o encontró un error del proveedor
- Qué modelo, plugins, Skills y ajustes del entorno de ejecución estaban activos
- Los metadatos de uso y de la caché de prompts devueltos por el proveedor

Para obtener un informe general de soporte del Gateway, comience con
[`/diagnostics`](/es/gateway/diagnostics#chat-command); recopila el paquete
saneado del Gateway y, en las sesiones del entorno de OpenAI Codex, puede enviar comentarios de Codex
a OpenAI después de su aprobación. Use `/export-trajectory` cuando necesite la
cronología detallada de prompts, herramientas y transcripciones de cada sesión.

## Inicio rápido

Envíe lo siguiente en la sesión activa (alias `/trajectory`):

```text
/export-trajectory
```

OpenClaw escribe el paquete en el espacio de trabajo:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Proporcione un nombre de directorio de salida relativo para sustituirlo:

```text
/export-trajectory bug-1234
```

El nombre se resuelve dentro de `.openclaw/trajectory-exports/`. Se rechazan las rutas absolutas y
las rutas con `~`.

Los paquetes de trayectoria pueden contener prompts, mensajes del modelo, esquemas de herramientas, resultados de
herramientas, eventos del entorno de ejecución y rutas locales, por lo que el comando de chat siempre pasa
por la aprobación de ejecución. Apruebe la exportación una vez cuando tenga la intención de crear el
paquete; no use la opción de permitir todo. En los chats grupales, OpenClaw envía de forma privada al
propietario la solicitud de aprobación y el resultado de la exportación, en lugar de publicar los detalles de la trayectoria
en la sala compartida.

Para la inspección local o los flujos de trabajo de soporte, ejecute directamente el comando de la CLI
subyacente:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Otras opciones: `--output <path>` (nombre del directorio dentro de
`.openclaw/trajectory-exports`), `--store <path>` (sustitución del almacén de sesiones),
`--agent <id>` (id del agente para resolver el almacén), `--json` (salida estructurada).

## Acceso

La exportación de trayectorias es un comando del propietario. El remitente debe superar las comprobaciones normales de
autorización de comandos, además de la comprobación del propietario del canal.

## Qué se registra

La captura de trayectorias está activada de forma predeterminada para las ejecuciones de agentes de OpenClaw.

Los eventos del entorno de ejecución incluyen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, incluidos el modelo de origen, el modelo siguiente, el motivo o detalle del fallo, la posición en la cadena y si la cadena avanzó, tuvo éxito o se agotó
- `model.completed`
- `trace.artifacts`
- `session.ended`

Los eventos de la transcripción se reconstruyen a partir de la rama activa de la sesión: mensajes del usuario,
mensajes del asistente, llamadas a herramientas, resultados de herramientas, compactaciones, cambios de modelo,
etiquetas y entradas personalizadas de la sesión.

Los eventos se escriben como líneas JSON con este marcador de esquema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Archivos del paquete

| Archivo               | Contenido                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `manifest.json`       | Esquema del paquete, archivos de origen, recuentos de eventos y lista de archivos generados                |
| `events.jsonl`        | Cronología ordenada del entorno de ejecución y de la transcripción                                         |
| `session-branch.json` | Rama activa de la transcripción con datos confidenciales ocultos y encabezado de la sesión                 |
| `metadata.json`       | Versión de OpenClaw, SO/entorno de ejecución, modelo, instantánea de configuración, plugins, Skills y metadatos de prompts |
| `artifacts.json`      | Estado final, errores, uso, caché de prompts, número de compactaciones, texto del asistente y metadatos de herramientas |
| `prompts.json`        | Prompts enviados y detalles seleccionados sobre su construcción                                            |
| `system-prompt.txt`   | Último prompt del sistema compilado, cuando se haya capturado                                               |
| `tools.json`          | Definiciones de herramientas enviadas al modelo, cuando se hayan capturado                                  |

`manifest.json` enumera los archivos presentes en un paquete determinado; algunos archivos se
omiten cuando la sesión no capturó los datos correspondientes del entorno de ejecución.

## Almacenamiento de capturas

Los eventos de trayectoria del entorno de ejecución se almacenan con la sesión en la base de datos SQLite
de cada agente. Exportar una trayectoria materializa un paquete de soporte JSONL con datos confidenciales ocultos;
la captura activa del entorno de ejecución no es un archivo auxiliar JSONL adyacente a la sesión.

Los archivos heredados `.trajectory.jsonl` y `.trajectory-path.json` aún pueden aparecer
procedentes de versiones anteriores o de exportaciones explícitas a archivos heredados. El mantenimiento de sesiones considera
esos archivos objetivos de limpieza; la captura activa escribe filas en la base de datos.

## Desactivar la captura

```bash
export OPENCLAW_TRAJECTORY=0
```

Esto desactiva la captura de trayectorias del entorno de ejecución antes de iniciar OpenClaw.
`/export-trajectory` aún puede exportar la rama de la transcripción, pero pueden faltar
datos exclusivos del entorno de ejecución, como el contexto compilado, los artefactos del proveedor y los metadatos de prompts.

## Ajustar el tiempo de espera de vaciado

OpenClaw vacía las filas de trayectorias del entorno de ejecución durante la limpieza del agente. El tiempo de espera
predeterminado de limpieza es de 10,000 ms. En discos lentos o almacenes grandes, configure
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` antes de iniciar OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Esto controla cuándo OpenClaw registra un tiempo de espera agotado de `openclaw-trajectory-flush` y
continúa; no cambia los límites de tamaño de la trayectoria. Para ajustar todos los pasos de
limpieza del agente que no proporcionen un tiempo de espera explícito, configure
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Privacidad y límites

Los paquetes de trayectoria están destinados al soporte y la depuración, no a su publicación. OpenClaw
oculta los valores confidenciales antes de escribir los archivos de exportación:

- credenciales y campos conocidos de cargas útiles que parecen contener secretos
- datos de imágenes
- rutas del estado local
- rutas del espacio de trabajo, sustituidas por `$WORKSPACE_DIR`
- rutas del directorio de inicio, cuando se detectan

El exportador también limita el tamaño de la entrada:

- captura del entorno de ejecución: la captura activa es una ventana móvil limitada a 10 MiB que descarta los eventos más antiguos para dejar espacio a los nuevos; la exportación acepta archivos auxiliares heredados existentes del entorno de ejecución de hasta 50 MiB
- archivos de sesión: 50 MiB
- eventos del entorno de ejecución por exportación: 200,000
- total de eventos exportados: 250,000
- las líneas individuales de eventos del entorno de ejecución se truncan por encima de 256 KiB

Revise los paquetes antes de compartirlos fuera de su equipo. La ocultación de datos confidenciales se realiza con el máximo esfuerzo
y no puede conocer todos los secretos específicos de cada aplicación.

## Solución de problemas

Si la exportación no contiene eventos del entorno de ejecución:

- confirme que OpenClaw se inició sin `OPENCLAW_TRAJECTORY=0`
- ejecute otro mensaje en la sesión y vuelva a exportar
- inspeccione `manifest.json` para comprobar `runtimeEventCount`

Si el comando rechaza la ruta de salida:

- use un nombre relativo como `bug-1234`
- no proporcione `/tmp/...` ni `~/...`
- mantenga la exportación dentro de `.openclaw/trajectory-exports/`

Si la exportación falla con un error de tamaño, la sesión o el archivo auxiliar superó los
límites de seguridad de exportación indicados anteriormente. Inicie una sesión nueva o exporte una
reproducción más pequeña.

## Contenido relacionado

- [Diferencias](/es/tools/diffs)
- [Gestión de sesiones](/es/concepts/session)
- [Herramienta de ejecución](/es/tools/exec)
