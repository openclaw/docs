---
read_when:
    - Depurar por qué un agente respondió, falló o llamó herramientas de cierta manera
    - Exportar un paquete de soporte para una sesión de OpenClaw
    - Investigar el contexto del prompt, las llamadas de herramientas, los errores de runtime o los metadatos de uso
    - Deshabilitar o reubicar la captura de trayectorias
summary: Exportar paquetes de trayectorias redactadas para depurar una sesión de agente de OpenClaw
title: Paquetes de trayectorias
x-i18n:
    generated_at: "2026-04-24T05:56:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
    source_path: tools/trajectory.md
    workflow: 15
---

La captura de trayectorias es la caja negra por sesión de OpenClaw. Registra una
línea temporal estructurada para cada ejecución del agente y luego `/export-trajectory` empaqueta la
sesión actual en un paquete de soporte redactado.

Úsala cuando necesites responder preguntas como:

- ¿Qué prompt, system prompt y herramientas se enviaron al modelo?
- ¿Qué mensajes de transcripción y llamadas de herramientas condujeron a esta respuesta?
- ¿La ejecución agotó el tiempo, se abortó, se compactó o encontró un error del proveedor?
- ¿Qué modelo, Plugins, Skills y ajustes de runtime estaban activos?
- ¿Qué metadatos de uso y caché de prompts devolvió el proveedor?

## Inicio rápido

Envía esto en la sesión activa:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw escribe el paquete dentro del espacio de trabajo:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Puedes elegir un nombre de directorio de salida relativo:

```text
/export-trajectory bug-1234
```

La ruta personalizada se resuelve dentro de `.openclaw/trajectory-exports/`. Las
rutas absolutas y las rutas con `~` se rechazan.

## Acceso

La exportación de trayectorias es un comando de propietario. El remitente debe pasar las
comprobaciones normales de autorización de comandos y las comprobaciones de propietario del canal.

## Qué se registra

La captura de trayectorias está activada por defecto para las ejecuciones de agentes de OpenClaw.

Los eventos de runtime incluyen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Los eventos de transcripción también se reconstruyen desde la rama activa de la sesión:

- mensajes del usuario
- mensajes del asistente
- llamadas de herramientas
- resultados de herramientas
- compactaciones
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

| Archivo               | Contenido                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `manifest.json`       | Esquema del paquete, archivos de origen, recuentos de eventos y lista de archivos generados |
| `events.jsonl`        | Línea temporal ordenada de runtime y transcripción                                           |
| `session-branch.json` | Rama activa redactada de la transcripción y encabezado de la sesión                          |
| `metadata.json`       | Versión de OpenClaw, SO/runtime, modelo, instantánea de config, Plugins, Skills y metadatos del prompt |
| `artifacts.json`      | Estado final, errores, uso, caché de prompt, recuento de compactaciones, texto del asistente y metadatos de herramientas |
| `prompts.json`        | Prompts enviados y detalles seleccionados de construcción de prompts                         |
| `system-prompt.txt`   | Último system prompt compilado, cuando se captura                                            |
| `tools.json`          | Definiciones de herramientas enviadas al modelo, cuando se capturan                          |

`manifest.json` enumera los archivos presentes en ese paquete. Algunos archivos se omiten
cuando la sesión no capturó los datos de runtime correspondientes.

## Ubicación de la captura

De forma predeterminada, los eventos de trayectoria de runtime se escriben junto al archivo de sesión:

```text
<session>.trajectory.jsonl
```

OpenClaw también escribe un archivo puntero de mejor esfuerzo junto a la sesión:

```text
<session>.trajectory-path.json
```

Establece `OPENCLAW_TRAJECTORY_DIR` para almacenar los sidecars de trayectoria de runtime en un
directorio dedicado:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Cuando esta variable está establecida, OpenClaw escribe un archivo JSONL por id de sesión en ese
directorio.

## Deshabilitar la captura

Establece `OPENCLAW_TRAJECTORY=0` antes de iniciar OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Esto deshabilita la captura de trayectorias de runtime. `/export-trajectory` aún puede exportar
la rama de transcripción, pero los archivos solo de runtime como el contexto compilado,
los artefactos del proveedor y los metadatos del prompt pueden faltar.

## Privacidad y límites

Los paquetes de trayectorias están diseñados para soporte y depuración, no para publicación pública.
OpenClaw redacta valores sensibles antes de escribir los archivos exportados:

- credenciales y campos de carga útil conocidos con aspecto de secreto
- datos de imagen
- rutas de estado local
- rutas del espacio de trabajo, reemplazadas por `$WORKSPACE_DIR`
- rutas del directorio personal, cuando se detectan

El exportador también limita el tamaño de entrada:

- archivos sidecar de runtime: 50 MiB
- archivos de sesión: 50 MiB
- eventos de runtime: 200,000
- total de eventos exportados: 250,000
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
límites de seguridad de exportación. Inicia una nueva sesión o exporta una reproducción más pequeña.

## Relacionado

- [Diffs](/es/tools/diffs)
- [Gestión de sesiones](/es/concepts/session)
- [Herramienta Exec](/es/tools/exec)
