---
read_when:
    - Quieres entender qué significa «contexto» en OpenClaw
    - Estás depurando por qué el modelo «sabe» algo (o lo olvidó)
    - Quieres reducir la sobrecarga de contexto (/context, /status, /compact)
summary: 'Contexto: qué ve el modelo, cómo se construye y cómo inspeccionarlo'
title: Contexto
x-i18n:
    generated_at: "2026-07-11T23:02:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

El «contexto» es **todo lo que OpenClaw envía al modelo para una ejecución**. Está limitado por la **ventana de contexto** del modelo (límite de tokens).

Modelo mental para principiantes:

- **Prompt del sistema** (creado por OpenClaw): reglas, herramientas, lista de Skills, hora/entorno de ejecución y archivos del espacio de trabajo inyectados.
- **Historial de conversación**: tus mensajes + los mensajes del asistente en esta sesión.
- **Llamadas/resultados de herramientas + archivos adjuntos**: salida de comandos, lecturas de archivos, imágenes/audio, etc.

El contexto _no es lo mismo_ que la «memoria»: la memoria puede almacenarse en disco y volver a cargarse más adelante; el contexto es lo que se encuentra dentro de la ventana actual del modelo.

## Inicio rápido (inspeccionar el contexto)

- `/status` → vista rápida de «¿qué tan llena está mi ventana?» + configuración de la sesión.
- `/context list` → qué se ha inyectado + tamaños aproximados (por archivo + totales).
- `/context detail` → desglose más detallado: tamaños por archivo, por esquema de herramienta y por entrada de Skill, tamaño del prompt del sistema y cantidad de mensajes de la transcripción que pueden compactarse.
- `/context map` → imagen de mapa de árbol al estilo de WinDirStat con los elementos que contribuyen al contexto rastreado de la sesión actual.
- `/usage tokens` → añade un pie de uso por respuesta a las respuestas normales.
- `/compact` → resume el historial más antiguo en una entrada compacta para liberar espacio en la ventana.

Consulta también: [Comandos de barra diagonal](/es/tools/slash-commands), [Uso y costes de tokens](/es/reference/token-use), [Compaction](/es/concepts/compaction).

## Ejemplo de salida

Los valores varían según el modelo, el proveedor, la política de herramientas y el contenido del espacio de trabajo.

### `/context list`

```text
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```text
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

Envía una imagen generada a partir del informe más reciente de la ejecución almacenado en caché y de la transcripción de la sesión. Antes de que un mensaje normal haya producido un informe de ejecución en la sesión, `/context map` devuelve un mensaje que indica que no está disponible, en lugar de representar una estimación. El área de cada rectángulo es proporcional a los caracteres del prompt rastreados:

- transcripción de la conversación (mensajes del usuario, respuestas del asistente, resultados de herramientas y resúmenes de Compaction), además del contexto del entorno de ejecución de cada turno y las adiciones de prompts de hooks que solo llegan al modelo
- archivos del espacio de trabajo inyectados
- texto base del prompt del sistema
- entradas de prompts de Skills
- esquemas JSON de herramientas

El grupo de conversación crece a medida que avanza la sesión, por lo que el mapa cambia de un turno a otro; después de la Compaction, se contrae en un mosaico de resúmenes.

`/context list`, `/context detail` y `/context json` aún pueden inspeccionar una estimación generada bajo demanda cuando no hay ningún informe de ejecución almacenado en caché.

## Qué cuenta para la ventana de contexto

Todo lo que recibe el modelo cuenta, incluidos:

- Prompt del sistema (todas las secciones).
- Historial de conversación.
- Llamadas a herramientas + resultados de herramientas.
- Archivos adjuntos/transcripciones (imágenes/audio/archivos).
- Resúmenes de Compaction y artefactos de poda.
- «Envoltorios» del proveedor o encabezados ocultos (no visibles, pero también cuentan).

## Cómo crea OpenClaw el prompt del sistema

El prompt del sistema es **propiedad de OpenClaw** y se vuelve a crear en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves.
- Lista de Skills (solo metadatos; consulta más adelante).
- Ubicación del espacio de trabajo.
- Hora (UTC + hora del usuario convertida, si está configurada).
- Metadatos del entorno de ejecución (host/SO/modelo/razonamiento).
- Archivos de arranque del espacio de trabajo inyectados en **Contexto del proyecto**.

Desglose completo: [Prompt del sistema](/es/concepts/system-prompt).

## Archivos del espacio de trabajo inyectados (Contexto del proyecto)

De forma predeterminada, OpenClaw inyecta un conjunto fijo de archivos del espacio de trabajo (si están presentes):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en la primera ejecución)

Los archivos grandes se truncan individualmente mediante `agents.defaults.bootstrapMaxChars` (`20000` caracteres de forma predeterminada). OpenClaw también aplica un límite total de inyección de arranque para todos los archivos mediante `agents.defaults.bootstrapTotalMaxChars` (`60000` caracteres de forma predeterminada). `/context` muestra los tamaños **originales frente a los inyectados** y si se produjo un truncamiento.

Cuando se produce un truncamiento, el entorno de ejecución puede inyectar un bloque de advertencia dentro del prompt, en Contexto del proyecto. Configura este comportamiento con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; valor predeterminado: `always`).

## Skills: inyectadas frente a cargadas bajo demanda

El prompt del sistema incluye una **lista de Skills** compacta (nombre + descripción + ubicación). Esta lista tiene una sobrecarga real.

Las instrucciones de las Skills _no_ se incluyen de forma predeterminada. Se espera que el modelo use `read` para leer el archivo `SKILL.md` de la Skill **solo cuando sea necesario**.

## Herramientas: existen dos costes

Las herramientas afectan al contexto de dos maneras:

1. **Texto de la lista de herramientas** en el prompt del sistema (lo que ves como «Herramientas»).
2. **Esquemas de herramientas** (JSON). Se envían al modelo para que pueda llamar a las herramientas. Cuentan para el contexto aunque no los veas como texto sin formato.

`/context detail` desglosa los esquemas de herramientas de mayor tamaño para que puedas ver cuáles predominan.

## Comandos, directivas y «atajos en línea»

El Gateway gestiona los comandos de barra diagonal. Existen varios comportamientos diferentes:

- **Comandos independientes**: un mensaje que contiene únicamente `/...` se ejecuta como comando.
- **Directivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model` y `/queue` se eliminan antes de que el modelo vea el mensaje.
  - Los mensajes que solo contienen directivas conservan la configuración de la sesión.
  - Las directivas en línea dentro de un mensaje normal actúan como indicaciones específicas para ese mensaje.
- **Atajos en línea** (solo para remitentes incluidos en la lista de permitidos): determinados tokens `/...` dentro de un mensaje normal pueden ejecutarse inmediatamente (ejemplo: «hola, /status») y se eliminan antes de que el modelo vea el texto restante.

Detalles: [Comandos de barra diagonal](/es/tools/slash-commands).

## Sesiones, Compaction y poda (qué se conserva)

Lo que se conserva entre mensajes depende del mecanismo:

- El **historial normal** se conserva en la transcripción de la sesión hasta que una política lo compacta o poda.
- La **Compaction** guarda un resumen en la transcripción y mantiene intactos los mensajes recientes.
- La **poda** elimina los resultados antiguos de herramientas del prompt _en memoria_ para liberar espacio en la ventana de contexto, pero no reescribe la transcripción de la sesión: el historial completo aún puede inspeccionarse en disco.

Documentación: [Sesión](/es/concepts/session), [Compaction](/es/concepts/compaction), [Poda de sesiones](/es/concepts/session-pruning).

De forma predeterminada, OpenClaw utiliza el motor de contexto `legacy` integrado para el ensamblaje y la Compaction. Si instalas un Plugin que proporcione `kind: "context-engine"` y lo seleccionas mediante `plugins.slots.contextEngine`, OpenClaw delega en ese motor el ensamblaje del contexto, `/compact` y los hooks relacionados con el ciclo de vida del contexto de los subagentes. `ownsCompaction: false` no activa automáticamente el motor `legacy` como alternativa; el motor activo debe seguir implementando `compact()` correctamente. Consulta [Motor de contexto](/es/concepts/context-engine) para conocer la interfaz conectable completa, los hooks del ciclo de vida y la configuración.

## Qué informa realmente `/context`

`/context` utiliza preferentemente el informe más reciente del prompt del sistema **creado durante una ejecución**, cuando está disponible:

- `System prompt (run)` = capturado de la última ejecución integrada (con capacidad para usar herramientas) y conservado en el almacén de la sesión.
- `System prompt (estimate)` = calculado al vuelo cuando no existe un informe de ejecución (o cuando se ejecuta mediante un backend de CLI que no genera el informe).

En ambos casos, informa de los tamaños y de los principales elementos contribuyentes; **no** muestra el prompt completo del sistema ni los esquemas de herramientas. En el modo detallado, también compara la transcripción de la sesión con el mismo predicado de mensajes de conversación reales que utiliza la Compaction, para facilitar la distinción entre un uso elevado del prompt/caché y el historial de conversación que puede compactarse.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Context engine" href="/es/concepts/context-engine" icon="puzzle-piece">
    Inyección de contexto personalizada mediante plugins.
  </Card>
  <Card title="Compaction" href="/es/concepts/compaction" icon="compress">
    Resumen de conversaciones largas para mantenerlas dentro de la ventana del modelo.
  </Card>
  <Card title="System prompt" href="/es/concepts/system-prompt" icon="message-lines">
    Cómo se crea el prompt del sistema y qué inyecta en cada turno.
  </Card>
  <Card title="Agent loop" href="/es/concepts/agent-loop" icon="arrows-rotate">
    El ciclo completo de ejecución del agente, desde el mensaje entrante hasta la respuesta final.
  </Card>
</CardGroup>
