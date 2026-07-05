---
read_when:
    - Quieres entender qué significa "contexto" en OpenClaw
    - Estás depurando por qué el modelo "sabe" algo (o lo olvidó)
    - Quieres reducir la sobrecarga de contexto (/context, /status, /compact)
summary: 'Contexto: lo que ve el modelo, cómo se construye y cómo inspeccionarlo'
title: Contexto
x-i18n:
    generated_at: "2026-07-05T11:11:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b94bf7dd87318107840faced4e899e0a4acae5fe8ae55cfcb91ae72259c79aa
    source_path: concepts/context.md
    workflow: 16
---

"Contexto" es **todo lo que OpenClaw envía al modelo para una ejecución**. Está limitado por la **ventana de contexto** del modelo (límite de tokens).

Modelo mental para principiantes:

- **Prompt del sistema** (construido por OpenClaw): reglas, herramientas, lista de Skills, hora/runtime y archivos del espacio de trabajo inyectados.
- **Historial de conversación**: tus mensajes + los mensajes del asistente para esta sesión.
- **Llamadas/resultados de herramientas + adjuntos**: salida de comandos, lecturas de archivos, imágenes/audio, etc.

El contexto _no es lo mismo_ que la "memoria": la memoria puede almacenarse en disco y recargarse más tarde; el contexto es lo que está dentro de la ventana actual del modelo.

## Inicio rápido (inspeccionar contexto)

- `/status` → vista rápida de "¿qué tan llena está mi ventana?" + configuración de sesión.
- `/context list` → qué se inyectó + tamaños aproximados (por archivo + totales).
- `/context detail` → desglose más profundo: tamaños por archivo, por esquema de herramienta, por entrada de Skills, tamaño del prompt del sistema y recuentos de mensajes de transcripción compactables.
- `/context map` → imagen de mapa de árbol estilo WinDirStat de los contribuidores de contexto rastreados de la sesión actual.
- `/usage tokens` → añade un pie de uso por respuesta a las respuestas normales.
- `/compact` → resume el historial antiguo en una entrada compacta para liberar espacio de ventana.

Consulta también: [Comandos de barra](/es/tools/slash-commands), [Uso de tokens y costos](/es/reference/token-use), [Compaction](/es/concepts/compaction).

## Salida de ejemplo

Los valores varían según el modelo, el proveedor, la política de herramientas y lo que haya en tu espacio de trabajo.

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

Envía una imagen generada a partir del último informe de ejecución en caché. Antes de que un mensaje normal haya producido un informe de ejecución en la sesión, `/context map` devuelve un mensaje de no disponible en lugar de renderizar una estimación. El área de los rectángulos es proporcional a los caracteres de prompt rastreados:

- archivos del espacio de trabajo inyectados
- texto base del prompt del sistema
- entradas de prompt de Skills
- esquemas JSON de herramientas

`/context list`, `/context detail` y `/context json` todavía pueden inspeccionar una estimación bajo demanda cuando no hay un informe de ejecución en caché.

## Qué cuenta para la ventana de contexto

Todo lo que recibe el modelo cuenta, incluido:

- Prompt del sistema (todas las secciones).
- Historial de conversación.
- Llamadas de herramientas + resultados de herramientas.
- Adjuntos/transcripciones (imágenes/audio/archivos).
- Resúmenes de Compaction y artefactos de poda.
- "Envoltorios" del proveedor o encabezados ocultos (no visibles, pero aun así cuentan).

## Cómo OpenClaw construye el prompt del sistema

El prompt del sistema es **propiedad de OpenClaw** y se reconstruye en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves.
- Lista de Skills (solo metadatos; ver abajo).
- Ubicación del espacio de trabajo.
- Hora (UTC + hora de usuario convertida si está configurada).
- Metadatos de runtime (host/SO/modelo/razonamiento).
- Archivos de arranque del espacio de trabajo inyectados bajo **Contexto del proyecto**.

Desglose completo: [Prompt del sistema](/es/concepts/system-prompt).

## Archivos del espacio de trabajo inyectados (Contexto del proyecto)

De forma predeterminada, OpenClaw inyecta un conjunto fijo de archivos del espacio de trabajo (si existen):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo primera ejecución)

Los archivos grandes se truncan por archivo usando `agents.defaults.bootstrapMaxChars` (valor predeterminado: `20000` caracteres). OpenClaw también aplica un límite total de inyección de arranque entre archivos con `agents.defaults.bootstrapTotalMaxChars` (valor predeterminado: `60000` caracteres). `/context` muestra los tamaños **sin procesar frente a inyectados** y si hubo truncamiento.

Cuando ocurre un truncamiento, el runtime puede inyectar un bloque de advertencia dentro del prompt bajo Contexto del proyecto. Configúralo con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; valor predeterminado: `always`).

## Skills: inyectadas frente a cargadas bajo demanda

El prompt del sistema incluye una **lista de Skills** compacta (nombre + descripción + ubicación). Esta lista tiene una sobrecarga real.

Las instrucciones de Skills _no_ se incluyen de forma predeterminada. Se espera que el modelo haga `read` del `SKILL.md` de la Skill **solo cuando sea necesario**.

## Herramientas: hay dos costos

Las herramientas afectan al contexto de dos maneras:

1. **Texto de lista de herramientas** en el prompt del sistema (lo que ves como "Tooling").
2. **Esquemas de herramientas** (JSON). Se envían al modelo para que pueda llamar herramientas. Cuentan para el contexto aunque no los veas como texto plano.

`/context detail` desglosa los esquemas de herramientas más grandes para que puedas ver qué domina.

## Comandos, directivas y "atajos en línea"

Los comandos de barra los gestiona el Gateway. Hay algunos comportamientos distintos:

- **Comandos independientes**: un mensaje que es solo `/...` se ejecuta como comando.
- **Directivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` se eliminan antes de que el modelo vea el mensaje.
  - Los mensajes que solo contienen directivas conservan la configuración de sesión.
  - Las directivas en línea en un mensaje normal actúan como indicaciones por mensaje.
- **Atajos en línea** (solo remitentes permitidos): ciertos tokens `/...` dentro de un mensaje normal pueden ejecutarse inmediatamente (ejemplo: "hey /status") y se eliminan antes de que el modelo vea el texto restante.

Detalles: [Comandos de barra](/es/tools/slash-commands).

## Sesiones, Compaction y poda (qué persiste)

Lo que persiste entre mensajes depende del mecanismo:

- **Historial normal** persiste en la transcripción de la sesión hasta que la política lo compacte/pode.
- **Compaction** persiste un resumen en la transcripción y mantiene intactos los mensajes recientes.
- **Poda** descarta resultados antiguos de herramientas del prompt _en memoria_ para liberar espacio de la ventana de contexto, pero no reescribe la transcripción de la sesión: el historial completo sigue siendo inspeccionable en disco.

Documentación: [Sesión](/es/concepts/session), [Compaction](/es/concepts/compaction), [Poda de sesión](/es/concepts/session-pruning).

De forma predeterminada, OpenClaw usa el motor de contexto integrado `legacy` para el ensamblaje y
la Compaction. Si instalas un Plugin que proporciona `kind: "context-engine"` y
lo seleccionas con `plugins.slots.contextEngine`, OpenClaw delega el ensamblaje
de contexto, `/compact` y los hooks relacionados del ciclo de vida de contexto
de subagentes a ese motor en su lugar. `ownsCompaction: false` no activa una
vuelta automática al motor `legacy`; el motor activo debe seguir implementando
`compact()` correctamente. Consulta [Motor de contexto](/es/concepts/context-engine)
para ver la interfaz enchufable completa, los hooks del ciclo de vida y la
configuración.

## Qué informa realmente `/context`

`/context` prefiere el último informe de prompt del sistema **construido por ejecución** cuando está disponible:

- `System prompt (run)` = capturado de la última ejecución incrustada (con capacidad de herramientas) y persistido en el almacén de sesión.
- `System prompt (estimate)` = calculado al vuelo cuando no existe un informe de ejecución (o cuando se ejecuta mediante un backend de CLI que no genera el informe).

En ambos casos, informa tamaños y principales contribuidores; **no** vuelca el prompt del sistema completo ni los esquemas de herramientas. En modo detallado, también compara la transcripción de la sesión con el mismo predicado de mensajes de conversación real usado por Compaction, por lo que es más fácil distinguir un uso alto de prompt/caché del historial de conversación compactable.

## Relacionado

<CardGroup cols={2}>
  <Card title="Motor de contexto" href="/es/concepts/context-engine" icon="puzzle-piece">
    Inyección de contexto personalizada mediante plugins.
  </Card>
  <Card title="Compaction" href="/es/concepts/compaction" icon="compress">
    Resumir conversaciones largas para mantenerlas dentro de la ventana del modelo.
  </Card>
  <Card title="Prompt del sistema" href="/es/concepts/system-prompt" icon="message-lines">
    Cómo se construye el prompt del sistema y qué inyecta en cada turno.
  </Card>
  <Card title="Bucle del agente" href="/es/concepts/agent-loop" icon="arrows-rotate">
    El ciclo completo de ejecución del agente desde el mensaje entrante hasta la respuesta final.
  </Card>
</CardGroup>
