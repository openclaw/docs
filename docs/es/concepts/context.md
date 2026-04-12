---
read_when:
    - Quieres entender qué significa “contexto” en OpenClaw
    - Estás depurando por qué el modelo “sabe” algo (o por qué lo olvidó)
    - Quieres reducir la sobrecarga de contexto (`/context`, `/status`, `/compact`)
summary: 'Contexto: lo que ve el modelo, cómo se construye y cómo inspeccionarlo'
title: Contexto
x-i18n:
    generated_at: "2026-04-12T23:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3620db1a8c1956d91a01328966df491388d3a32c4003dc4447197eb34316c77d
    source_path: concepts/context.md
    workflow: 15
---

# Contexto

“Contexto” es **todo lo que OpenClaw envía al modelo para una ejecución**. Está limitado por la **ventana de contexto** del modelo (límite de tokens).

Modelo mental para principiantes:

- **Prompt del sistema** (construido por OpenClaw): reglas, herramientas, lista de Skills, hora/entorno de ejecución y archivos del espacio de trabajo inyectados.
- **Historial de la conversación**: tus mensajes + los mensajes del asistente de esta sesión.
- **Llamadas/resultados de herramientas + adjuntos**: salida de comandos, lecturas de archivos, imágenes/audio, etc.

El contexto _no es lo mismo_ que la “memoria”: la memoria puede almacenarse en disco y recargarse más tarde; el contexto es lo que está dentro de la ventana actual del modelo.

## Inicio rápido (inspeccionar el contexto)

- `/status` → vista rápida de “¿qué tan llena está mi ventana?” + configuración de la sesión.
- `/context list` → qué está inyectado + tamaños aproximados (por archivo + totales).
- `/context detail` → desglose más profundo: por archivo, tamaños de esquema de herramientas, tamaños de entradas de Skills y tamaño del prompt del sistema.
- `/usage tokens` → agrega un pie de uso por respuesta a las respuestas normales.
- `/compact` → resume el historial más antiguo en una entrada compacta para liberar espacio en la ventana.

Consulta también: [Comandos con barra](/es/tools/slash-commands), [Uso de tokens y costos](/es/reference/token-use), [Compaction](/es/concepts/compaction).

## Salida de ejemplo

Los valores varían según el modelo, el proveedor, la política de herramientas y lo que haya en tu espacio de trabajo.

### `/context list`

```
🧠 Desglose del contexto
Espacio de trabajo: <workspaceDir>
Máximo de bootstrap/archivo: 20,000 caracteres
Sandbox: mode=non-main sandboxed=false
Prompt del sistema (ejecución): 38,412 caracteres (~9,603 tokens) (Contexto del proyecto 23,901 caracteres (~5,976 tokens))

Archivos del espacio de trabajo inyectados:
- AGENTS.md: OK | bruto 1,742 caracteres (~436 tokens) | inyectado 1,742 caracteres (~436 tokens)
- SOUL.md: OK | bruto 912 caracteres (~228 tokens) | inyectado 912 caracteres (~228 tokens)
- TOOLS.md: TRUNCATED | bruto 54,210 caracteres (~13,553 tokens) | inyectado 20,962 caracteres (~5,241 tokens)
- IDENTITY.md: OK | bruto 211 caracteres (~53 tokens) | inyectado 211 caracteres (~53 tokens)
- USER.md: OK | bruto 388 caracteres (~97 tokens) | inyectado 388 caracteres (~97 tokens)
- HEARTBEAT.md: MISSING | bruto 0 | inyectado 0
- BOOTSTRAP.md: OK | 0 caracteres (~0 tokens) | inyectado 0 caracteres (~0 tokens)

Lista de Skills (texto del prompt del sistema): 2,184 caracteres (~546 tokens) (12 Skills)
Herramientas: read, edit, write, exec, process, browser, message, sessions_send, …
Lista de herramientas (texto del prompt del sistema): 1,032 caracteres (~258 tokens)
Esquemas de herramientas (JSON): 31,988 caracteres (~7,997 tokens) (cuentan para el contexto; no se muestran como texto)
Herramientas: (igual que arriba)

Tokens de sesión (en caché): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Desglose del contexto (detallado)
…
Principales Skills (tamaño de entrada del prompt):
- frontend-design: 412 caracteres (~103 tokens)
- oracle: 401 caracteres (~101 tokens)
… (+10 más Skills)

Principales herramientas (tamaño del esquema):
- browser: 9,812 caracteres (~2,453 tokens)
- exec: 6,240 caracteres (~1,560 tokens)
… (+N más herramientas)
```

## Qué cuenta para la ventana de contexto

Todo lo que recibe el modelo cuenta, incluido:

- Prompt del sistema (todas las secciones).
- Historial de la conversación.
- Llamadas de herramientas + resultados de herramientas.
- Adjuntos/transcripciones (imágenes/audio/archivos).
- Resúmenes de Compaction y artefactos de poda.
- “Wrappers” del proveedor o encabezados ocultos (no visibles, pero igualmente cuentan).

## Cómo OpenClaw construye el prompt del sistema

El prompt del sistema es **propiedad de OpenClaw** y se reconstruye en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves.
- Lista de Skills (solo metadatos; ver abajo).
- Ubicación del espacio de trabajo.
- Hora (UTC + hora del usuario convertida, si está configurada).
- Metadatos del entorno de ejecución (host/SO/modelo/thinking).
- Archivos bootstrap del espacio de trabajo inyectados bajo **Contexto del proyecto**.

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

Los archivos grandes se truncan por archivo usando `agents.defaults.bootstrapMaxChars` (valor predeterminado: `20000` caracteres). OpenClaw también aplica un límite total de inyección bootstrap entre archivos con `agents.defaults.bootstrapTotalMaxChars` (valor predeterminado: `150000` caracteres). `/context` muestra los tamaños **bruto vs. inyectado** y si hubo truncamiento.

Cuando ocurre truncamiento, el entorno de ejecución puede inyectar un bloque de advertencia dentro del prompt en Contexto del proyecto. Configúralo con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; valor predeterminado: `once`).

## Skills: inyectadas vs. cargadas bajo demanda

El prompt del sistema incluye una lista compacta de **Skills** (nombre + descripción + ubicación). Esta lista tiene una sobrecarga real.

Las instrucciones de Skills _no_ se incluyen de forma predeterminada. Se espera que el modelo use `read` para leer el `SKILL.md` de la Skill **solo cuando sea necesario**.

## Herramientas: hay dos costos

Las herramientas afectan al contexto de dos maneras:

1. **Texto de la lista de herramientas** en el prompt del sistema (lo que ves como “Tooling”).
2. **Esquemas de herramientas** (JSON). Se envían al modelo para que pueda llamar herramientas. Cuentan para el contexto aunque no los veas como texto plano.

`/context detail` desglosa los esquemas de herramientas más grandes para que puedas ver qué domina.

## Comandos, directivas y "atajos en línea"

Los comandos con barra los gestiona el Gateway. Hay algunos comportamientos diferentes:

- **Comandos independientes**: un mensaje que es solo `/...` se ejecuta como comando.
- **Directivas**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` se eliminan antes de que el modelo vea el mensaje.
  - Los mensajes que contienen solo directivas conservan la configuración de la sesión.
  - Las directivas en línea dentro de un mensaje normal actúan como sugerencias por mensaje.
- **Atajos en línea** (solo remitentes en allowlist): ciertos tokens `/...` dentro de un mensaje normal pueden ejecutarse inmediatamente (ejemplo: “hey /status”), y se eliminan antes de que el modelo vea el texto restante.

Detalles: [Comandos con barra](/es/tools/slash-commands).

## Sesiones, Compaction y poda (qué persiste)

Lo que persiste entre mensajes depende del mecanismo:

- El **historial normal** persiste en la transcripción de la sesión hasta que la política lo compacte o pode.
- **Compaction** conserva un resumen dentro de la transcripción y mantiene intactos los mensajes recientes.
- La **poda** elimina resultados antiguos de herramientas del prompt _en memoria_ para una ejecución, pero no reescribe la transcripción.

Documentación: [Session](/es/concepts/session), [Compaction](/es/concepts/compaction), [Poda de sesión](/es/concepts/session-pruning).

De forma predeterminada, OpenClaw usa el motor de contexto `legacy` integrado para el ensamblaje y la compactación. Si instalas un Plugin que proporciona `kind: "context-engine"` y lo seleccionas con `plugins.slots.contextEngine`, OpenClaw delega el ensamblaje de contexto, `/compact` y los hooks relacionados del ciclo de vida del contexto de subagentes a ese motor. `ownsCompaction: false` no hace fallback automático al motor legacy; el motor activo igualmente debe implementar `compact()` correctamente. Consulta
[Context Engine](/es/concepts/context-engine) para ver la interfaz conectable completa, los hooks del ciclo de vida y la configuración.

## Qué informa realmente `/context`

`/context` prefiere el informe más reciente del prompt del sistema **construido en una ejecución** cuando está disponible:

- `System prompt (run)` = capturado de la última ejecución embebida (con capacidad de herramientas) y persistido en el almacén de sesiones.
- `System prompt (estimate)` = calculado sobre la marcha cuando no existe un informe de ejecución (o cuando se ejecuta mediante un backend de CLI que no genera el informe).

En ambos casos, informa tamaños y los principales contribuyentes; no vuelca el prompt completo del sistema ni los esquemas de herramientas.

## Relacionado

- [Context Engine](/es/concepts/context-engine) — inyección de contexto personalizada mediante plugins
- [Compaction](/es/concepts/compaction) — resumir conversaciones largas
- [Prompt del sistema](/es/concepts/system-prompt) — cómo se construye el prompt del sistema
- [Bucle del agente](/es/concepts/agent-loop) — el ciclo completo de ejecución del agente
