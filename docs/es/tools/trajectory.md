---
read_when:
    - Depurar por qué un agente respondió, falló o llamó a herramientas de cierta manera
    - Exportar un paquete de soporte para una sesión de OpenClaw
    - Investigación del contexto del prompt, llamadas a herramientas, errores de ejecución o metadatos de uso
    - Deshabilitar o reubicar la captura de trayectorias
summary: Exportar paquetes de trayectoria redactados para depurar una sesión de agente de OpenClaw
title: Paquetes de trayectoria
x-i18n:
    generated_at: "2026-07-05T11:52:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08cd5d28c203d5b50212be917507fe9b5a1f5eefd31d6a84dbdc9dfd8d9ed0e1
    source_path: tools/trajectory.md
    workflow: 16
---

La captura de trayectoria es el registrador de vuelo por sesión de OpenClaw. Registra una
cronología estructurada de cada ejecución de agente; luego `/export-trajectory` empaqueta la
sesión actual en un paquete de soporte redactado que cubre:

- El prompt, el prompt del sistema y las herramientas enviadas al modelo
- Qué mensajes de transcripción y llamadas a herramientas condujeron a una respuesta
- Si la ejecución agotó el tiempo de espera, se abortó, hizo Compaction o encontró un error del proveedor
- Qué modelo, plugins, Skills y ajustes de runtime estaban activos
- Metadatos de uso y de caché de prompts devueltos por el proveedor

Para un informe amplio de soporte del Gateway, empieza con
[`/diagnostics`](/es/gateway/diagnostics#chat-command); recopila el
paquete saneado del Gateway y, para sesiones del arnés de OpenAI Codex, puede enviar comentarios de Codex
a OpenAI tras la aprobación. Usa `/export-trajectory` cuando necesites la
cronología detallada por sesión de prompts, herramientas y transcripción.

## Inicio rápido

Envía en la sesión activa (alias `/trajectory`):

```text
/export-trajectory
```

OpenClaw escribe el paquete bajo el espacio de trabajo:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Pasa un nombre de directorio de salida relativo para sobrescribirlo:

```text
/export-trajectory bug-1234
```

El nombre se resuelve dentro de `.openclaw/trajectory-exports/`. Las rutas absolutas y
las rutas `~` se rechazan.

Los paquetes de trayectoria pueden contener prompts, mensajes del modelo, esquemas de herramientas, resultados de herramientas,
eventos de runtime y rutas locales, por lo que el comando de chat siempre se ejecuta
mediante aprobación de exec. Aprueba la exportación una vez cuando quieras crear el
paquete; no uses allow-all. En chats grupales, OpenClaw envía el
prompt de aprobación y el resultado de exportación al propietario en privado en lugar de publicar detalles de trayectoria
en la sala compartida.

Para inspección local o flujos de trabajo de soporte, ejecuta directamente el comando CLI
subyacente:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Otras marcas: `--output <path>` (nombre de directorio dentro de
`.openclaw/trajectory-exports`), `--store <path>` (sobrescritura del almacén de sesiones),
`--agent <id>` (id de agente para la resolución del almacén), `--json` (salida estructurada).

## Acceso

La exportación de trayectoria es un comando de propietario. El remitente debe superar las comprobaciones normales de
autorización de comandos más la comprobación de propietario para el canal.

## Qué se registra

La captura de trayectoria está activada de forma predeterminada para las ejecuciones de agentes de OpenClaw.

Los eventos de runtime incluyen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, incluido el modelo de origen, el siguiente modelo, el motivo/detalle del fallo, la posición en la cadena y si la cadena avanzó, tuvo éxito o se agotó
- `model.completed`
- `trace.artifacts`
- `session.ended`

Los eventos de transcripción se reconstruyen a partir de la rama de sesión activa: mensajes de usuario,
mensajes del asistente, llamadas a herramientas, resultados de herramientas, eventos de Compaction, cambios de modelo,
etiquetas y entradas de sesión personalizadas.

Los eventos se escriben como JSON Lines con este marcador de esquema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Archivos del paquete

| Archivo               | Contenido                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Esquema del paquete, archivos de origen, recuentos de eventos y lista de archivos generados    |
| `events.jsonl`        | Cronología ordenada de runtime y transcripción                                                 |
| `session-branch.json` | Rama de transcripción activa redactada y encabezado de sesión                                  |
| `metadata.json`       | Versión de OpenClaw, SO/runtime, modelo, instantánea de configuración, plugins, Skills y metadatos de prompts |
| `artifacts.json`      | Estado final, errores, uso, caché de prompts, recuento de Compaction, texto del asistente y metadatos de herramientas |
| `prompts.json`        | Prompts enviados y detalles seleccionados de construcción de prompts                           |
| `system-prompt.txt`   | Último prompt del sistema compilado, cuando se captura                                          |
| `tools.json`          | Definiciones de herramientas enviadas al modelo, cuando se capturan                            |

`manifest.json` enumera los archivos presentes en un paquete determinado; algunos archivos se
omiten cuando la sesión no capturó los datos de runtime correspondientes.

## Ubicación de captura

De forma predeterminada, los eventos de trayectoria de runtime se escriben junto al archivo de sesión:

```text
<session>.trajectory.jsonl
```

OpenClaw también escribe un archivo puntero de mejor esfuerzo junto a la sesión:

```text
<session>.trajectory-path.json
```

Establece `OPENCLAW_TRAJECTORY_DIR` para almacenar los sidecars de trayectoria de runtime en un
directorio dedicado, un archivo JSONL por id de sesión:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

El mantenimiento de sesiones elimina los sidecars de trayectoria cuando su entrada de sesión propietaria
se poda, se limita o se expulsa por el presupuesto de disco de sesiones. Los archivos de runtime
fuera del directorio de sesiones solo se eliminan cuando el destino del puntero todavía
demuestra que pertenece a esa sesión.

## Desactivar captura

```bash
export OPENCLAW_TRAJECTORY=0
```

Esto desactiva la captura de trayectoria de runtime antes de iniciar OpenClaw.
`/export-trajectory` todavía puede exportar la rama de transcripción, pero pueden faltar archivos
solo de runtime, como contexto compilado, artefactos del proveedor y metadatos de prompts.

## Ajustar tiempo de espera de vaciado

OpenClaw vacía los sidecars de trayectoria de runtime durante la limpieza del agente. El tiempo de espera
de limpieza predeterminado es de 10,000 ms. En discos lentos o almacenes grandes, establece
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` antes de iniciar OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Esto controla cuándo OpenClaw registra un tiempo de espera `openclaw-trajectory-flush` y
continúa; no cambia los límites de tamaño de trayectoria. Para ajustar todos los pasos de
limpieza del agente que no pasan un tiempo de espera explícito, establece
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Privacidad y límites

Los paquetes de trayectoria son para soporte y depuración, no para publicación pública. OpenClaw
redacta valores sensibles antes de escribir archivos de exportación:

- credenciales y campos de carga útil conocidos que parecen secretos
- datos de imagen
- rutas de estado local
- rutas del espacio de trabajo, reemplazadas por `$WORKSPACE_DIR`
- rutas del directorio de inicio, cuando se detectan

El exportador también limita el tamaño de entrada:

- archivos sidecar de runtime: el archivo de captura en vivo es una ventana móvil limitada a 10 MiB, que descarta los eventos más antiguos para hacer espacio para los nuevos; la exportación acepta archivos sidecar de runtime existentes de hasta 50 MiB
- archivos de sesión: 50 MiB
- eventos de runtime por exportación: 200,000
- eventos exportados totales: 250,000
- las líneas individuales de eventos de runtime se truncan por encima de 256 KiB

Revisa los paquetes antes de compartirlos fuera de tu equipo. La redacción es de mejor esfuerzo
y no puede conocer todos los secretos específicos de cada aplicación.

## Solución de problemas

Si la exportación no tiene eventos de runtime:

- confirma que OpenClaw se inició sin `OPENCLAW_TRAJECTORY=0`
- comprueba si `OPENCLAW_TRAJECTORY_DIR` apunta a un directorio con permisos de escritura
- ejecuta otro mensaje en la sesión y luego exporta de nuevo
- inspecciona `manifest.json` para ver `runtimeEventCount`

Si el comando rechaza la ruta de salida:

- usa un nombre relativo como `bug-1234`
- no pases `/tmp/...` ni `~/...`
- mantén la exportación dentro de `.openclaw/trajectory-exports/`

Si la exportación falla con un error de tamaño, la sesión o el sidecar superó los
límites de seguridad de exportación anteriores. Inicia una sesión nueva o exporta una reproducción
más pequeña.

## Relacionado

- [Diffs](/es/tools/diffs)
- [Gestión de sesiones](/es/concepts/session)
- [Herramienta exec](/es/tools/exec)
