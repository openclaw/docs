---
read_when:
    - Depurar por qué un agente respondió, falló o llamó herramientas de cierta manera
    - Exportar un paquete de soporte para una sesión de OpenClaw
    - Investigar el contexto del prompt, las llamadas a herramientas, los errores de tiempo de ejecución o los metadatos de uso
    - Deshabilitar o reubicar la captura de trayectorias
summary: Exportar paquetes de trayectorias redactadas para depurar una sesión de agente de OpenClaw
title: Paquetes de trayectorias
x-i18n:
    generated_at: "2026-04-23T14:09:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Paquetes de trayectorias

La captura de trayectorias es el registrador por sesión de OpenClaw. Registra una
línea temporal estructurada para cada ejecución del agente, y luego `/export-trajectory` empaqueta la
sesión actual en un paquete de soporte redactado.

Úsalo cuando necesites responder preguntas como:

- ¿Qué prompt, prompt del sistema y herramientas se enviaron al modelo?
- ¿Qué mensajes de transcripción y llamadas a herramientas llevaron a esta respuesta?
- ¿La ejecución agotó el tiempo, se abortó, hizo Compaction o encontró un error del proveedor?
- ¿Qué modelo, plugins, Skills y ajustes de tiempo de ejecución estaban activos?
- ¿Qué metadatos de uso y de caché de prompts devolvió el proveedor?

## Inicio rápido

Envía esto en la sesión activa:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw escribe el paquete en el espacio de trabajo:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Puedes elegir un nombre relativo de directorio de salida:

```text
/export-trajectory bug-1234
```

La ruta personalizada se resuelve dentro de `.openclaw/trajectory-exports/`. Las rutas
absolutas y las rutas `~` se rechazan.

## Acceso

La exportación de trayectorias es un comando de propietario. El remitente debe superar las comprobaciones normales de autorización de comandos y las comprobaciones de propietario del canal.

## Qué se registra

La captura de trayectorias está activada de forma predeterminada para las ejecuciones de agentes de OpenClaw.

Los eventos de tiempo de ejecución incluyen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Los eventos de transcripción también se reconstruyen a partir de la rama activa de la sesión:

- mensajes del usuario
- mensajes del asistente
- llamadas a herramientas
- resultados de herramientas
- Compactions
- cambios de modelo
- etiquetas y entradas personalizadas de sesión

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
| `manifest.json`       | Esquema del paquete, archivos de origen, recuentos de eventos y lista de archivos generados   |
| `events.jsonl`        | Línea temporal ordenada de tiempo de ejecución y transcripción                                |
| `session-branch.json` | Rama activa redactada de la transcripción y encabezado de sesión                              |
| `metadata.json`       | Versión de OpenClaw, SO/tiempo de ejecución, modelo, instantánea de configuración, plugins, Skills y metadatos del prompt |
| `artifacts.json`      | Estado final, errores, uso, caché de prompts, recuento de Compaction, texto del asistente y metadatos de herramientas |
| `prompts.json`        | Prompts enviados y detalles seleccionados de construcción del prompt                          |
| `system-prompt.txt`   | Último prompt del sistema compilado, cuando se captura                                        |
| `tools.json`          | Definiciones de herramientas enviadas al modelo, cuando se capturan                           |

`manifest.json` lista los archivos presentes en ese paquete. Algunos archivos se omiten
cuando la sesión no capturó los datos de tiempo de ejecución correspondientes.

## Ubicación de captura

De forma predeterminada, los eventos de trayectoria de tiempo de ejecución se escriben junto al archivo de sesión:

```text
<session>.trajectory.jsonl
```

OpenClaw también escribe un archivo puntero, en la medida de lo posible, junto a la sesión:

```text
<session>.trajectory-path.json
```

Establece `OPENCLAW_TRAJECTORY_DIR` para almacenar sidecars de trayectorias de tiempo de ejecución en un
directorio dedicado:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Cuando esta variable está establecida, OpenClaw escribe un archivo JSONL por id de sesión en ese
directorio.

## Deshabilitar captura

Establece `OPENCLAW_TRAJECTORY=0` antes de iniciar OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Esto deshabilita la captura de trayectorias de tiempo de ejecución. `/export-trajectory` aún puede exportar
la rama de transcripción, pero pueden faltar archivos solo de tiempo de ejecución, como contexto compilado,
artefactos del proveedor y metadatos del prompt.

## Privacidad y límites

Los paquetes de trayectorias están diseñados para soporte y depuración, no para publicación pública.
OpenClaw redacta valores sensibles antes de escribir archivos de exportación:

- credenciales y campos de carga útil conocidos de tipo secreto
- datos de imágenes
- rutas de estado local
- rutas del espacio de trabajo, sustituidas por `$WORKSPACE_DIR`
- rutas del directorio personal, cuando se detectan

El exportador también limita el tamaño de entrada:

- archivos sidecar de tiempo de ejecución: 50 MiB
- archivos de sesión: 50 MiB
- eventos de tiempo de ejecución: 200 000
- total de eventos exportados: 250 000
- las líneas individuales de eventos de tiempo de ejecución se truncan por encima de 256 KiB

Revisa los paquetes antes de compartirlos fuera de tu equipo. La redacción se realiza en la medida de lo posible
y no puede conocer todos los secrets específicos de cada aplicación.

## Solución de problemas

Si la exportación no tiene eventos de tiempo de ejecución:

- confirma que OpenClaw se inició sin `OPENCLAW_TRAJECTORY=0`
- comprueba si `OPENCLAW_TRAJECTORY_DIR` apunta a un directorio con permiso de escritura
- ejecuta otro mensaje en la sesión y vuelve a exportar
- inspecciona `manifest.json` para `runtimeEventCount`

Si el comando rechaza la ruta de salida:

- usa un nombre relativo como `bug-1234`
- no pases `/tmp/...` ni `~/...`
- mantén la exportación dentro de `.openclaw/trajectory-exports/`

Si la exportación falla con un error de tamaño, la sesión o el sidecar superaron los
límites de seguridad de exportación. Inicia una nueva sesión o exporta una reproducción más pequeña.
