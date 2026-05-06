---
read_when:
    - Quieres entender qué significa "contexto" en OpenClaw
    - Estás depurando por qué el modelo "sabe" algo (o lo olvidó)
    - Quieres reducir la sobrecarga de contexto (/context, /status, /compact)
summary: 'Contexto: lo que ve el modelo, cómo se construye y cómo inspeccionarlo'
title: Contexto
x-i18n:
    generated_at: "2026-05-06T05:30:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

El "Contexto" es **todo lo que OpenClaw envía al modelo para una ejecución**. Está limitado por la **ventana de contexto** del modelo (límite de tokens).

Modelo mental para principiantes:

- **Prompt del sistema** (creado por OpenClaw): reglas, herramientas, lista de Skills, tiempo/entorno de ejecución y archivos del espacio de trabajo inyectados.
- **Historial de conversación**: tus mensajes + los mensajes del asistente para esta sesión.
- **Llamadas/resultados de herramientas + adjuntos**: salida de comandos, lecturas de archivos, imágenes/audio, etc.

El contexto _no es lo mismo_ que la "memoria": la memoria puede almacenarse en disco y recargarse más tarde; el contexto es lo que está dentro de la ventana actual del modelo.

## Inicio rápido (inspeccionar el contexto)

- `/status` → vista rápida de "¿qué tan llena está mi ventana?" + ajustes de sesión.
- `/context list` → qué está inyectado + tamaños aproximados (por archivo + totales).
- `/context detail` → desglose más profundo: tamaños por archivo, por esquema de herramienta, por entrada de Skill y del prompt del sistema.
- `/usage tokens` → añade un pie de uso por respuesta a las respuestas normales.
- `/compact` → resume el historial antiguo en una entrada compacta para liberar espacio de la ventana.

Consulta también: [Comandos de barra](/es/tools/slash-commands), [Uso de tokens y costos](/es/reference/token-use), [Compaction](/es/concepts/compaction).

## Salida de ejemplo

Los valores varían según el modelo, el proveedor, la política de herramientas y lo que haya en tu espacio de trabajo.

### `/context list`

```
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

```
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

## Qué cuenta para la ventana de contexto

Todo lo que recibe el modelo cuenta, incluyendo:

- Prompt del sistema (todas las secciones).
- Historial de conversación.
- Llamadas a herramientas + resultados de herramientas.
- Adjuntos/transcripciones (imágenes/audio/archivos).
- Resúmenes de Compaction y artefactos de poda.
- "Envoltorios" o encabezados ocultos del proveedor (no visibles, pero aun así contabilizados).

## Cómo OpenClaw construye el prompt del sistema

El prompt del sistema es **propiedad de OpenClaw** y se reconstruye en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves.
- Lista de Skills (solo metadatos; ver abajo).
- Ubicación del espacio de trabajo.
- Hora (UTC + hora del usuario convertida si está configurada).
- Metadatos del entorno de ejecución (host/SO/modelo/razonamiento).
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
- `BOOTSTRAP.md` (solo en la primera ejecución)

Los archivos grandes se truncan por archivo usando `agents.defaults.bootstrapMaxChars` (valor predeterminado `12000` caracteres). OpenClaw también impone un límite total de inyección de arranque entre archivos con `agents.defaults.bootstrapTotalMaxChars` (valor predeterminado `60000` caracteres). `/context` muestra los tamaños **sin procesar frente a inyectados** y si se produjo truncamiento.

Cuando ocurre truncamiento, el entorno de ejecución puede inyectar un bloque de advertencia dentro del prompt bajo Contexto del proyecto. Configura esto con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; valor predeterminado `once`).

## Skills: inyectadas frente a cargadas bajo demanda

El prompt del sistema incluye una **lista de Skills** compacta (nombre + descripción + ubicación). Esta lista tiene una sobrecarga real.

Las instrucciones de Skills _no_ se incluyen de forma predeterminada. Se espera que el modelo haga `read` del `SKILL.md` de la Skill **solo cuando sea necesario**.

## Herramientas: hay dos costos

Las herramientas afectan al contexto de dos maneras:

1. **Texto de lista de herramientas** en el prompt del sistema (lo que ves como "Herramientas").
2. **Esquemas de herramientas** (JSON). Estos se envían al modelo para que pueda llamar herramientas. Cuentan para el contexto aunque no los veas como texto sin formato.

`/context detail` desglosa los esquemas de herramientas más grandes para que puedas ver qué domina.

## Comandos, directivas y "atajos en línea"

Los comandos de barra los gestiona el Gateway. Hay varios comportamientos diferentes:

- **Comandos independientes**: un mensaje que solo contiene `/...` se ejecuta como comando.
- **Directivas**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` se eliminan antes de que el modelo vea el mensaje.
  - Los mensajes que solo contienen directivas conservan los ajustes de sesión.
  - Las directivas en línea dentro de un mensaje normal actúan como sugerencias por mensaje.
- **Atajos en línea** (solo remitentes en lista permitida): ciertos tokens `/...` dentro de un mensaje normal pueden ejecutarse de inmediato (ejemplo: "hey /status") y se eliminan antes de que el modelo vea el texto restante.

Detalles: [Comandos de barra](/es/tools/slash-commands).

## Sesiones, Compaction y poda (qué persiste)

Lo que persiste entre mensajes depende del mecanismo:

- **Historial normal** persiste en la transcripción de la sesión hasta que la política lo compacte o pode.
- **Compaction** conserva un resumen en la transcripción y mantiene intactos los mensajes recientes.
- **Poda** elimina resultados antiguos de herramientas del prompt _en memoria_ para liberar espacio en la ventana de contexto, pero no reescribe la transcripción de sesión: el historial completo sigue siendo inspeccionable en disco.

Documentación: [Sesión](/es/concepts/session), [Compaction](/es/concepts/compaction), [Poda de sesión](/es/concepts/session-pruning).

De forma predeterminada, OpenClaw usa el motor de contexto integrado `legacy` para el ensamblaje y
Compaction. Si instalas un Plugin que proporciona `kind: "context-engine"` y
lo seleccionas con `plugins.slots.contextEngine`, OpenClaw delega el ensamblaje
del contexto, `/compact` y los hooks relacionados del ciclo de vida de contexto de subagentes en ese
motor en su lugar. `ownsCompaction: false` no hace una reversión automática al motor
`legacy`; el motor activo aún debe implementar `compact()` correctamente. Consulta
[Motor de contexto](/es/concepts/context-engine) para ver la interfaz
enchufable completa, los hooks de ciclo de vida y la configuración.

## Qué informa realmente `/context`

`/context` prefiere el último informe de prompt del sistema **construido en ejecución** cuando está disponible:

- `System prompt (run)` = capturado desde la última ejecución embebida (con capacidad de herramientas) y persistido en el almacén de sesión.
- `System prompt (estimate)` = calculado al vuelo cuando no existe informe de ejecución (o cuando se ejecuta mediante un backend de CLI que no genera el informe).

En cualquier caso, informa tamaños y principales contribuyentes; **no** vuelca el prompt del sistema completo ni los esquemas de herramientas.

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
  <Card title="Bucle de agente" href="/es/concepts/agent-loop" icon="arrows-rotate">
    El ciclo completo de ejecución del agente desde el mensaje entrante hasta la respuesta final.
  </Card>
</CardGroup>
