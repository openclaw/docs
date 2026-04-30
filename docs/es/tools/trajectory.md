---
read_when:
    - Depuración de por qué un agente respondió, falló o invocó herramientas de cierta manera
    - Exportar un paquete de soporte para una sesión de OpenClaw
    - Investigación del contexto de la instrucción, las llamadas a herramientas, los errores de tiempo de ejecución o los metadatos de uso
    - Deshabilitar o reubicar la captura de trayectorias
summary: Exportar paquetes de trayectoria con datos censurados para depurar una sesión de agente de OpenClaw
title: Paquetes de trayectorias
x-i18n:
    generated_at: "2026-04-30T06:06:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

La captura de trayectoria es la caja negra por sesión de OpenClaw. Registra una
línea de tiempo estructurada para cada ejecución de agente; luego, `/export-trajectory` empaqueta la
sesión actual en un paquete de soporte censurado.

Úsala cuando necesites responder preguntas como:

- ¿Qué prompt, prompt del sistema y herramientas se enviaron al modelo?
- ¿Qué mensajes de transcripción y llamadas a herramientas llevaron a esta respuesta?
- ¿La ejecución agotó el tiempo, se canceló, hizo Compaction o encontró un error del proveedor?
- ¿Qué modelo, plugins, Skills y ajustes de runtime estaban activos?
- ¿Qué metadatos de uso y de caché de prompts devolvió el proveedor?

Si vas a presentar un informe de soporte amplio para un problema en vivo del Gateway, empieza con
[`/diagnostics`](/es/gateway/diagnostics#chat-command). Diagnósticos recopila el
paquete saneado del Gateway y, en sesiones del arnés OpenAI Codex, también puede enviar
comentarios de Codex a servidores de OpenAI tras la aprobación. Usa `/export-trajectory` cuando
necesites específicamente la línea de tiempo detallada por sesión de prompts, herramientas y transcripción.

## Inicio rápido

Envía esto en la sesión activa:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw escribe el paquete bajo el espacio de trabajo:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Puedes elegir un nombre de directorio de salida relativo:

```text
/export-trajectory bug-1234
```

La ruta personalizada se resuelve dentro de `.openclaw/trajectory-exports/`. Las rutas absolutas
y las rutas con `~` se rechazan.

Los paquetes de trayectoria pueden contener prompts, mensajes del modelo, esquemas de herramientas, resultados de herramientas,
eventos de runtime y rutas locales. Por lo tanto, el comando slash del chat se ejecuta
mediante aprobación de exec cada vez. Aprueba la exportación una vez cuando quieras
crear el paquete; no uses permitir todo. En chats grupales, OpenClaw envía el
prompt de aprobación y el resultado de la exportación al propietario en privado en lugar de publicar los
detalles de la trayectoria en la sala compartida.

Para inspección local o flujos de trabajo de soporte, también puedes ejecutar directamente la ruta del comando
aprobado:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Acceso

La exportación de trayectoria es un comando de propietario. El remitente debe superar las comprobaciones normales de
autorización de comandos y las comprobaciones de propietario del canal.

## Qué se registra

La captura de trayectoria está activada de forma predeterminada para las ejecuciones de agentes de OpenClaw.

Los eventos de runtime incluyen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, incluido el modelo de origen, el siguiente modelo, el motivo/detalle del fallo, la posición en la cadena y si el respaldo avanzó, tuvo éxito o agotó la cadena
- `model.completed`
- `trace.artifacts`
- `session.ended`

Los eventos de transcripción también se reconstruyen desde la rama activa de la sesión:

- mensajes de usuario
- mensajes del asistente
- llamadas a herramientas
- resultados de herramientas
- Compactions
- cambios de modelo
- etiquetas y entradas de sesión personalizadas

Los eventos se escriben como JSON Lines con este marcador de esquema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Archivos del paquete

Un paquete exportado puede contener:

| Archivo               | Contenido                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Esquema del paquete, archivos de origen, recuentos de eventos y lista de archivos generados     |
| `events.jsonl`        | Línea de tiempo ordenada de runtime y transcripción                                            |
| `session-branch.json` | Rama de transcripción activa censurada y encabezado de sesión                                  |
| `metadata.json`       | Versión de OpenClaw, SO/runtime, modelo, instantánea de configuración, plugins, Skills y metadatos de prompts |
| `artifacts.json`      | Estado final, errores, uso, caché de prompts, recuento de Compaction, texto del asistente y metadatos de herramientas |
| `prompts.json`        | Prompts enviados y detalles seleccionados de construcción de prompts                           |
| `system-prompt.txt`   | Último prompt del sistema compilado, cuando se capturó                                         |
| `tools.json`          | Definiciones de herramientas enviadas al modelo, cuando se capturaron                          |

`manifest.json` enumera los archivos presentes en ese paquete. Algunos archivos se omiten
cuando la sesión no capturó los datos de runtime correspondientes.

## Ubicación de captura

De forma predeterminada, los eventos de trayectoria de runtime se escriben junto al archivo de sesión:

```text
<session>.trajectory.jsonl
```

OpenClaw también escribe un archivo puntero de mejor esfuerzo junto a la sesión:

```text
<session>.trajectory-path.json
```

Define `OPENCLAW_TRAJECTORY_DIR` para almacenar los sidecars de trayectoria de runtime en un
directorio dedicado:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Cuando esta variable está definida, OpenClaw escribe un archivo JSONL por id de sesión en ese
directorio.

El mantenimiento de sesiones elimina los sidecars de trayectoria cuando la entrada de sesión propietaria
se poda, se limita o se expulsa por el presupuesto de disco de sesiones. Los archivos de runtime fuera
del directorio de sesiones se eliminan solo cuando el destino del puntero aún demuestra que
pertenece a esa sesión.

## Desactivar captura

Define `OPENCLAW_TRAJECTORY=0` antes de iniciar OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Esto desactiva la captura de trayectoria de runtime. `/export-trajectory` todavía puede exportar
la rama de transcripción, pero pueden faltar archivos exclusivos de runtime, como el contexto compilado,
los artefactos del proveedor y los metadatos de prompts.

## Privacidad y límites

Los paquetes de trayectoria están diseñados para soporte y depuración, no para publicación pública.
OpenClaw censura valores sensibles antes de escribir archivos de exportación:

- credenciales y campos de payload conocidos con apariencia de secretos
- datos de imagen
- rutas de estado local
- rutas del espacio de trabajo, reemplazadas por `$WORKSPACE_DIR`
- rutas del directorio de inicio, cuando se detectan

El exportador también acota el tamaño de entrada:

- archivos sidecar de runtime: 50 MiB
- archivos de sesión: 50 MiB
- eventos de runtime: 200,000
- eventos exportados totales: 250,000
- las líneas individuales de eventos de runtime se truncan por encima de 256 KiB

Revisa los paquetes antes de compartirlos fuera de tu equipo. La censura es de mejor esfuerzo
y no puede conocer todos los secretos específicos de una aplicación.

## Solución de problemas

Si la exportación no tiene eventos de runtime:

- confirma que OpenClaw se inició sin `OPENCLAW_TRAJECTORY=0`
- comprueba si `OPENCLAW_TRAJECTORY_DIR` apunta a un directorio escribible
- ejecuta otro mensaje en la sesión y luego exporta de nuevo
- inspecciona `manifest.json` para ver `runtimeEventCount`

Si el comando rechaza la ruta de salida:

- usa un nombre relativo como `bug-1234`
- no pases `/tmp/...` ni `~/...`
- mantén la exportación dentro de `.openclaw/trajectory-exports/`

Si la exportación falla con un error de tamaño, la sesión o el sidecar superó los
límites de seguridad de exportación. Inicia una sesión nueva o exporta una reproducción más pequeña.

## Relacionado

- [Diffs](/es/tools/diffs)
- [Gestión de sesiones](/es/concepts/session)
- [Herramienta exec](/es/tools/exec)
