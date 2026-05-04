---
read_when:
    - Depurar por qué un agente respondió, falló o invocó herramientas de cierta manera
    - Exportación de un paquete de soporte para una sesión de OpenClaw
    - Investigar el contexto de la indicación, las llamadas a herramientas, los errores en tiempo de ejecución o los metadatos de uso
    - Deshabilitar o reubicar la captura de trayectorias
summary: Exportar paquetes de trayectoria redactados para depurar una sesión de agente de OpenClaw
title: Paquetes de trayectoria
x-i18n:
    generated_at: "2026-05-04T09:37:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8b1256e52d27185a48ceddaf7937b4f37ad6d57d075fea0d0b6d3abb871f1d8
    source_path: tools/trajectory.md
    workflow: 16
---

La captura de trayectoria es el registrador de vuelo por sesión de OpenClaw. Registra una
cronología estructurada para cada ejecución de agente; luego `/export-trajectory` empaqueta la
sesión actual en un paquete de soporte redactado.

Úsala cuando necesites responder preguntas como:

- ¿Qué prompt, prompt del sistema y herramientas se enviaron al modelo?
- ¿Qué mensajes de transcripción y llamadas a herramientas llevaron a esta respuesta?
- ¿La ejecución agotó el tiempo, se abortó, se compactó o encontró un error del proveedor?
- ¿Qué modelo, plugins, Skills y ajustes de runtime estaban activos?
- ¿Qué metadatos de uso y caché de prompts devolvió el proveedor?

Si estás presentando un informe de soporte amplio para un problema en vivo del Gateway, comienza con
[`/diagnostics`](/es/gateway/diagnostics#chat-command). Diagnostics recopila el
paquete sanitizado del Gateway y, para sesiones del arnés OpenAI Codex, también puede enviar
comentarios de Codex a los servidores de OpenAI después de la aprobación. Usa `/export-trajectory` cuando
necesites específicamente la cronología detallada por sesión de prompts, herramientas y transcripción.

## Inicio rápido

Envía esto en la sesión activa:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw escribe el paquete dentro del workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Puedes elegir un nombre de directorio de salida relativo:

```text
/export-trajectory bug-1234
```

La ruta personalizada se resuelve dentro de `.openclaw/trajectory-exports/`. Las rutas
absolutas y las rutas con `~` se rechazan.

Los paquetes de trayectoria pueden contener prompts, mensajes del modelo, esquemas de herramientas, resultados de
herramientas, eventos de runtime y rutas locales. Por eso, el comando slash de chat pasa
por aprobación de exec cada vez. Aprueba la exportación una vez cuando tengas intención de
crear el paquete; no uses permitir todo. En chats grupales, OpenClaw envía el
prompt de aprobación y el resultado de la exportación al propietario en privado, en lugar de publicar los
detalles de la trayectoria de vuelta en la sala compartida.

Para inspección local o flujos de trabajo de soporte, también puedes ejecutar directamente la ruta
del comando aprobado:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Acceso

La exportación de trayectoria es un comando de propietario. El remitente debe superar las comprobaciones normales de
autorización de comandos y las comprobaciones de propietario para el canal.

## Qué se registra

La captura de trayectoria está activada de forma predeterminada para las ejecuciones de agentes de OpenClaw.

Los eventos de runtime incluyen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, incluido el modelo de origen, el siguiente modelo, el motivo/detalle del fallo, la posición en la cadena y si el fallback avanzó, tuvo éxito o agotó la cadena
- `model.completed`
- `trace.artifacts`
- `session.ended`

Los eventos de transcripción también se reconstruyen a partir de la rama activa de la sesión:

- mensajes de usuario
- mensajes del asistente
- llamadas a herramientas
- resultados de herramientas
- compactaciones
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
| `manifest.json`       | Esquema del paquete, archivos de origen, conteos de eventos y lista de archivos generada       |
| `events.jsonl`        | Cronología ordenada de runtime y transcripción                                                 |
| `session-branch.json` | Rama de transcripción activa redactada y encabezado de sesión                                  |
| `metadata.json`       | Versión de OpenClaw, SO/runtime, modelo, snapshot de configuración, plugins, Skills y metadatos de prompts |
| `artifacts.json`      | Estado final, errores, uso, caché de prompts, conteo de Compaction, texto del asistente y metadatos de herramientas |
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

OpenClaw también escribe un archivo de puntero de mejor esfuerzo junto a la sesión:

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

El mantenimiento de sesiones elimina los sidecars de trayectoria cuando su entrada de sesión propietaria
se poda, se limita o se expulsa por el presupuesto de disco de las sesiones. Los archivos de runtime fuera
del directorio de sesiones se eliminan solo cuando el destino del puntero todavía demuestra que
pertenece a esa sesión.

## Desactivar captura

Define `OPENCLAW_TRAJECTORY=0` antes de iniciar OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Esto desactiva la captura de trayectoria de runtime. `/export-trajectory` todavía puede exportar
la rama de transcripción, pero pueden faltar archivos solo de runtime, como el contexto compilado,
los artefactos del proveedor y los metadatos de prompts.

## Privacidad y límites

Los paquetes de trayectoria están diseñados para soporte y depuración, no para publicación pública.
OpenClaw redacta valores sensibles antes de escribir los archivos de exportación:

- credenciales y campos de payload conocidos con apariencia de secretos
- datos de imagen
- rutas de estado local
- rutas del workspace, reemplazadas por `$WORKSPACE_DIR`
- rutas del directorio home, cuando se detectan

El exportador también limita el tamaño de entrada:

- archivos sidecar de runtime: la captura en vivo se detiene a los 10 MiB y registra un evento de truncamiento cuando queda espacio; la exportación acepta sidecars de runtime existentes de hasta 50 MiB
- archivos de sesión: 50 MiB
- eventos de runtime: 200,000
- total de eventos exportados: 250,000
- las líneas individuales de eventos de runtime se truncan por encima de 256 KiB

Revisa los paquetes antes de compartirlos fuera de tu equipo. La redacción es de mejor esfuerzo
y no puede conocer todos los secretos específicos de cada aplicación.

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
