---
read_when:
    - Quieres entender qué significa "contexto" en OpenClaw
    - Estás depurando por qué el modelo "sabe" algo (o lo olvidó)
    - Quieres reducir la sobrecarga de contexto (/context, /status, /compact)
summary: 'Contexto: lo que ve el modelo, cómo se construye y cómo inspeccionarlo'
title: Contexto
x-i18n:
    generated_at: "2026-05-11T20:30:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

"Contexto" es **todo lo que OpenClaw envía al modelo para una ejecución**. Está limitado por la **ventana de contexto** del modelo (límite de tokens).

Modelo mental para principiantes:

- **Prompt del sistema** (creado por OpenClaw): reglas, herramientas, lista de Skills, hora/entorno de ejecución y archivos del espacio de trabajo inyectados.
- **Historial de conversación**: tus mensajes + los mensajes del asistente para esta sesión.
- **Llamadas/resultados de herramientas + adjuntos**: salida de comandos, lecturas de archivos, imágenes/audio, etc.

El contexto _no es lo mismo_ que la "memoria": la memoria puede almacenarse en disco y volver a cargarse más tarde; el contexto es lo que está dentro de la ventana actual del modelo.

## Inicio rápido (inspeccionar el contexto)

- `/status` → vista rápida de "¿qué tan llena está mi ventana?" + configuración de la sesión.
- `/context list` → qué está inyectado + tamaños aproximados (por archivo + totales).
- `/context detail` → desglose más detallado: tamaños por archivo, por esquema de herramienta, por entrada de Skill y tamaño del prompt del sistema.
- `/context map` → imagen de mapa de árbol estilo WinDirStat de los contribuidores de contexto rastreados de la sesión actual.
- `/usage tokens` → añadir un pie de uso por respuesta a las respuestas normales.
- `/compact` → resumir el historial más antiguo en una entrada compacta para liberar espacio en la ventana.

Consulta también: [Comandos slash](/es/tools/slash-commands), [Uso de tokens y costos](/es/reference/token-use), [Compaction](/es/concepts/compaction).

## Ejemplo de salida

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

### `/context map`

Envía una imagen generada a partir del informe de ejecución en caché más reciente. Antes de que un mensaje normal haya producido un informe de ejecución en la sesión, `/context map` devuelve un mensaje de no disponibilidad en lugar de renderizar una estimación. El área del rectángulo es proporcional a los caracteres del prompt rastreados:

- archivos del espacio de trabajo inyectados
- texto base del prompt del sistema
- entradas de prompt de Skills
- esquemas JSON de herramientas

`/context list`, `/context detail` y `/context json` aún pueden inspeccionar una estimación bajo demanda cuando no hay ningún informe de ejecución en caché.

## Qué cuenta para la ventana de contexto

Todo lo que recibe el modelo cuenta, incluido:

- Prompt del sistema (todas las secciones).
- Historial de conversación.
- Llamadas de herramientas + resultados de herramientas.
- Adjuntos/transcripciones (imágenes/audio/archivos).
- Resúmenes de Compaction y artefactos de recorte.
- "Envoltorios" del proveedor o encabezados ocultos (no visibles, pero aun así contabilizados).

## Cómo OpenClaw construye el prompt del sistema

El prompt del sistema es **propiedad de OpenClaw** y se reconstruye en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves.
- Lista de Skills (solo metadatos; consulta abajo).
- Ubicación del espacio de trabajo.
- Hora (UTC + hora del usuario convertida si está configurada).
- Metadatos de ejecución (host/SO/modelo/razonamiento).
- Archivos bootstrap del espacio de trabajo inyectados en **Contexto del proyecto**.

Desglose completo: [Prompt del sistema](/es/concepts/system-prompt).

## Archivos del espacio de trabajo inyectados (Contexto del proyecto)

De forma predeterminada, OpenClaw inyecta un conjunto fijo de archivos del espacio de trabajo (si están presentes):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo primera ejecución)

Los archivos grandes se truncan por archivo usando `agents.defaults.bootstrapMaxChars` (valor predeterminado `12000` caracteres). OpenClaw también aplica un límite total de inyección bootstrap entre archivos con `agents.defaults.bootstrapTotalMaxChars` (valor predeterminado `60000` caracteres). `/context` muestra los tamaños **sin procesar frente a inyectados** y si se produjo truncamiento.

Cuando ocurre truncamiento, el entorno de ejecución puede inyectar un bloque de advertencia dentro del prompt bajo Contexto del proyecto. Configura esto con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; valor predeterminado `once`).

## Skills: inyectadas frente a cargadas bajo demanda

El prompt del sistema incluye una **lista de Skills** compacta (nombre + descripción + ubicación). Esta lista tiene una sobrecarga real.

Las instrucciones de Skill _no_ se incluyen de forma predeterminada. Se espera que el modelo haga `read` del `SKILL.md` de la Skill **solo cuando sea necesario**.

## Herramientas: hay dos costos

Las herramientas afectan el contexto de dos maneras:

1. **Texto de la lista de herramientas** en el prompt del sistema (lo que ves como "Herramientas").
2. **Esquemas de herramientas** (JSON). Se envían al modelo para que pueda llamar herramientas. Cuentan para el contexto aunque no los veas como texto sin formato.

`/context detail` desglosa los esquemas de herramientas más grandes para que puedas ver qué domina.

## Comandos, directivas y "atajos en línea"

Los comandos slash los gestiona el Gateway. Hay algunos comportamientos diferentes:

- **Comandos independientes**: un mensaje que es solo `/...` se ejecuta como comando.
- **Directivas**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` se eliminan antes de que el modelo vea el mensaje.
  - Los mensajes que solo contienen directivas persisten la configuración de sesión.
  - Las directivas en línea dentro de un mensaje normal actúan como sugerencias por mensaje.
- **Atajos en línea** (solo remitentes permitidos): ciertos tokens `/...` dentro de un mensaje normal pueden ejecutarse inmediatamente (ejemplo: "hey /status") y se eliminan antes de que el modelo vea el texto restante.

Detalles: [Comandos slash](/es/tools/slash-commands).

## Sesiones, Compaction y recorte (qué persiste)

Lo que persiste entre mensajes depende del mecanismo:

- **Historial normal** persiste en la transcripción de la sesión hasta que la política lo compacte/recorte.
- **Compaction** persiste un resumen en la transcripción y mantiene intactos los mensajes recientes.
- **Recorte** descarta resultados antiguos de herramientas del prompt _en memoria_ para liberar espacio en la ventana de contexto, pero no reescribe la transcripción de la sesión; el historial completo sigue siendo inspeccionable en disco.

Documentación: [Sesión](/es/concepts/session), [Compaction](/es/concepts/compaction), [Recorte de sesión](/es/concepts/session-pruning).

De forma predeterminada, OpenClaw usa el motor de contexto integrado `legacy` para el ensamblaje y
la Compaction. Si instalas un plugin que proporciona `kind: "context-engine"` y
lo seleccionas con `plugins.slots.contextEngine`, OpenClaw delega el ensamblaje
del contexto, `/compact` y los hooks relacionados del ciclo de vida del contexto
de subagentes en ese motor. `ownsCompaction: false` no activa una alternativa
automática al motor `legacy`; el motor activo aun así debe implementar
`compact()` correctamente. Consulta [Motor de contexto](/es/concepts/context-engine)
para ver la interfaz extensible completa, los hooks del ciclo de vida y la configuración.

## Qué informa realmente `/context`

`/context` prefiere el informe del prompt del sistema más reciente **construido por ejecución** cuando está disponible:

- `System prompt (run)` = capturado desde la última ejecución integrada (capaz de usar herramientas) y persistido en el almacén de sesión.
- `System prompt (estimate)` = calculado al vuelo cuando no existe ningún informe de ejecución (o cuando se ejecuta mediante un backend de CLI que no genera el informe).

En cualquier caso, informa tamaños y principales contribuidores; **no** vuelca el prompt del sistema completo ni los esquemas de herramientas.

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
