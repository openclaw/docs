---
read_when:
    - Quieres entender cómo funciona la memoria
    - Quiere saber qué archivos de memoria debe escribir
summary: Cómo recuerda OpenClaw las cosas entre sesiones
title: Descripción general de la memoria
x-i18n:
    generated_at: "2026-07-22T10:30:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cdfd5276d6289a4ee38b5203eb5443312c4b040d4ea67abe4a9c579703136339
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw recuerda cosas escribiendo archivos Markdown simples en el espacio de
trabajo del agente (valor predeterminado: `~/.openclaw/workspace`). El modelo solo recuerda lo que se
guarda en el disco; no hay ningún estado oculto.

## Cómo funciona

El agente tiene tres archivos relacionados con la memoria:

- **`MEMORY.md`** — memoria a largo plazo. Hechos, preferencias y
  decisiones duraderos. Se carga al inicio de una sesión.
- **`memory/YYYY-MM-DD.md`** (o `memory/YYYY-MM-DD-<slug>.md`) — notas diarias.
  Contexto activo y observaciones. Las notas fechadas de hoy y ayer se cargan
  automáticamente con un `/new` o `/reset` básico; las variantes con slug, como las
  escritas por el hook de memoria de sesión incluido, se recogen junto con el
  archivo que solo contiene la fecha.
- **`DREAMS.md`** (opcional) — Diario de sueños y resúmenes de las pasadas de Dreaming para
  revisión humana, incluidas entradas históricas de relleno fundamentado.

<Tip>
Para que el agente recuerde algo, basta con pedírselo: «Recuerda que
prefiero TypeScript». Escribirá la nota en el archivo correspondiente.
</Tip>

## Qué se guarda en cada lugar

`MEMORY.md` es la capa compacta y depurada: hechos duraderos, preferencias, decisiones
permanentes y resúmenes breves que deben estar disponibles al inicio de una
sesión. No es una transcripción sin procesar, un registro diario ni un archivo exhaustivo.

Los archivos `memory/YYYY-MM-DD.md` son la capa de trabajo: notas diarias detalladas,
observaciones, resúmenes de sesiones y contexto sin procesar que aún puede resultar útil
más adelante. Se indexan para `memory_search` y `memory_get`, pero no se
inyectan en el prompt de arranque en cada turno.

Con el tiempo, el agente sintetiza el material útil de las notas diarias en
`MEMORY.md` y elimina las entradas obsoletas de la memoria a largo plazo. Las instrucciones
generadas del espacio de trabajo y el flujo de Heartbeat lo hacen periódicamente; no es necesario
editar manualmente `MEMORY.md` para cada detalle.

Si `MEMORY.md` supera el presupuesto de archivos de arranque, OpenClaw mantiene intacto el archivo en
el disco, pero trunca la copia inyectada en el contexto. Esto debe considerarse una
señal para trasladar el material detallado a `memory/*.md`, conservar solo un resumen
duradero en `MEMORY.md` o aumentar los límites de arranque si se desea dedicar más
presupuesto del prompt. Utilice `/context list`, `/context detail` o `openclaw doctor` para
consultar los tamaños sin procesar e inyectados, así como el estado de truncamiento.

## Importación desde asistentes de programación

La interfaz de control puede importar la memoria local existente de Codex y Claude Code.
Abra **Settings** → **Import Memory**, elija el agente de destino, revise los
archivos detectados y confirme la importación. OpenClaw solo copia memoria en Markdown:

- Codex: los archivos consolidados `MEMORY.md` y `memory_summary.md` dentro de
  `~/.codex/memories` (o `CODEX_HOME/memories`). No se importan los archivos de
  ejecuciones sin procesar ni las transcripciones.
- Claude Code: archivos Markdown de cada directorio de memoria automática del proyecto dentro de
  `~/.claude/projects/*/memory`, además de un
  `autoMemoryDirectory` configurado por el usuario cuando exista. Las instrucciones del proyecto, las sesiones, la configuración
  y las credenciales no forman parte de esta acción limitada a la memoria.

Los archivos importados permanecen separados en `memory/imports/codex/` y
`memory/imports/claude-code/` dentro del espacio de trabajo del agente seleccionado. Se indexan
para `memory_search` y están disponibles mediante `memory_get`; no se combinan con
el `MEMORY.md` de arranque del agente. Los archivos de origen no se modifican.

La vista previa marca los conflictos de destino. Active **Replace existing imports** para
reemplazar esos archivos; al aplicar la operación, se crea una copia de seguridad verificada previa a la importación y se conservan
copias individuales de los archivos sobrescritos en el informe de migración.

## Memorias sensibles a las acciones

La mayoría de las memorias son notas Markdown comunes. Algunas afectan a lo que el agente debe
hacer más adelante; en esos casos, registre cuándo es seguro actuar según la nota, no solo
el hecho en sí.

Registre ese límite de acción cuando una nota implique:

- requisitos de aprobación o permiso,
- restricciones temporales,
- transferencias a otra sesión, hilo o persona,
- condiciones de caducidad,
- momento seguro para actuar,
- autoridad de la fuente o del propietario,
- instrucciones para evitar una acción tentadora.

Una memoria útil sensible a las acciones deja claro:

- qué cambia el comportamiento futuro,
- cuándo o bajo qué condición se aplica,
- cuándo caduca o qué permite actuar,
- qué debe evitar hacer el agente,
- quién es la fuente o el propietario, si esto afecta a la confianza o la autoridad.

La memoria puede conservar el contexto de aprobación, pero no aplica las políticas. Utilice
la configuración de aprobación, el aislamiento y las tareas programadas de OpenClaw para establecer
controles operativos estrictos.

Ejemplo:

```md
La migración de la API se está diseñando en otra sesión. Los turnos futuros no deben
editar la implementación de la API desde este hilo; utilice los hallazgos de aquí solo como
información de diseño hasta que se apruebe el plan de migración.
```

Otro ejemplo:

```md
Un informe de una fuente no confiable necesita revisión antes de su promoción. Los turnos futuros
deben tratarlo solo como evidencia; no lo almacene como memoria duradera hasta que un
revisor de confianza confirme el contenido.
```

Este esquema no es obligatorio para todas las memorias; los hechos simples pueden seguir siendo concisos.
Utilice límites sensibles a las acciones cuando perder el contexto temporal, de autoridad, de caducidad o
de seguridad para actuar pueda hacer que el agente haga algo incorrecto más adelante.

Utilice [tareas programadas](/es/automation/cron-jobs) para recordatorios exactos, comprobaciones temporizadas
y trabajo recurrente. La memoria puede seguir resumiendo el contexto duradero relacionado con ese
trabajo.

## Compromisos inferidos retirados

Algunos seguimientos futuros no son hechos duraderos. Si se menciona una entrevista
mañana, la memoria útil podría ser «comprobar cómo fue después de la entrevista», no «guardar
esto para siempre en `MEMORY.md`».

El experimento de compromisos inferidos se ha retirado. OpenClaw ya no extrae ni
entrega esos seguimientos. Utilice [tareas programadas](/es/automation/cron-jobs) para
acciones futuras; el comando heredado `openclaw commitments` sigue disponible para
inspeccionar o descartar las filas almacenadas existentes.

## Herramientas de memoria

El agente dispone de dos herramientas para trabajar con la memoria:

- **`memory_search`** — encuentra notas relevantes mediante búsqueda semántica, incluso cuando
  la redacción difiere de la original.
- **`memory_get`** — lee un archivo de memoria o un intervalo de líneas específico.

Ambas herramientas las proporciona el Plugin de memoria activo (valor predeterminado: `memory-core`).

## Búsqueda en la memoria

Cuando hay un proveedor de embeddings configurado, `memory_search` utiliza búsqueda híbrida:
similitud vectorial (significado semántico) combinada con coincidencia de palabras clave (términos
exactos como identificadores y símbolos de código). Funciona de inmediato con una clave de API
de cualquier proveedor compatible.

<Info>
OpenClaw utiliza embeddings de OpenAI de forma predeterminada. Establezca
`memory.search.provider` explícitamente para utilizar Gemini, Voyage,
Mistral, Bedrock, DeepInfra, GGUF local, Ollama, LM Studio, GitHub Copilot o
un endpoint genérico compatible con OpenAI.
</Info>

Consulte [Búsqueda en la memoria](/es/concepts/memory-search) para saber cómo funciona la búsqueda, las opciones
de ajuste y la configuración del proveedor.

## Backends de memoria

<CardGroup cols={3}>
<Card title="Integrado (predeterminado)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona de inmediato con búsqueda por palabras clave, similitud vectorial y
búsqueda híbrida. No requiere dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Servicio auxiliar centrado en el entorno local con reclasificación, expansión de consultas y capacidad para indexar
directorios externos al espacio de trabajo.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memoria entre sesiones nativa de IA con modelado de usuarios, búsqueda semántica y
conocimiento de varios agentes. Instalación de Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/es/plugins/memory-lancedb">
Memoria respaldada por LanceDB con embeddings compatibles con OpenAI, recuperación automática,
captura automática y compatibilidad con embeddings locales de Ollama. Instalación de Plugin.
</Card>
</CardGroup>

## Capa de wiki de conocimiento

Para que la memoria duradera se comporte más como una base de conocimiento mantenida
que como notas sin procesar, utilice el Plugin `memory-wiki` incluido. Compila el conocimiento
duradero en un almacén wiki con una estructura de páginas determinista, afirmaciones y
evidencias estructuradas, seguimiento de contradicciones y actualidad, paneles
generados, compendios compilados y herramientas nativas de wiki (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` no reemplaza al Plugin de memoria activo; este sigue siendo
responsable de la recuperación, la promoción y Dreaming. `memory-wiki` añade una
capa de conocimiento con abundante información de procedencia junto a él.

<CardGroup cols={1}>
<Card title="Wiki de memoria" icon="book" href="/es/plugins/memory-wiki">
Compila la memoria duradera en un almacén wiki con abundante información de procedencia, afirmaciones,
paneles, modo puente y flujos de trabajo compatibles con Obsidian.
</Card>
</CardGroup>

## Vaciado automático de la memoria

Antes de que [Compaction](/es/concepts/compaction) resuma la conversación,
OpenClaw ejecuta un turno silencioso que recuerda al agente guardar el contexto importante
en los archivos de memoria. Esta opción está activada de forma predeterminada; establezca
`agents.defaults.compaction.memoryFlush.enabled: false` para desactivarla.

Para mantener ese turno de mantenimiento en un modelo local, establezca una anulación exacta que
se aplique solo al turno de vaciado de memoria (no hereda la cadena de modelos
alternativos de la sesión activa):

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

<Tip>
El vaciado de memoria evita la pérdida de contexto durante Compaction. Si el agente tiene
hechos importantes en la conversación que aún no se han escrito en un archivo, se
guardan automáticamente antes de generar el resumen.
</Tip>

## Dreaming

Dreaming es una pasada opcional de consolidación de memoria en segundo plano. Recopila
señales de recuperación a corto plazo, puntúa candidatos y solo promueve los elementos
que cumplen los requisitos a la memoria a largo plazo (`MEMORY.md`):

- **Activación opcional**: desactivado de forma predeterminada.
- **Programado**: cuando está activado, `memory-core` administra automáticamente un trabajo de Cron
  recurrente para una pasada completa de Dreaming.
- **Con umbrales**: las promociones deben superar los criterios de puntuación, frecuencia de recuperación y
  diversidad de consultas.
- **Revisable**: los resúmenes de las fases y las entradas del diario se escriben en
  `DREAMS.md` para su revisión humana.

Consulte [Dreaming](/es/concepts/dreaming) para obtener información sobre el comportamiento de las fases, las señales de puntuación y
los detalles del Diario de sueños.

## Relleno fundamentado y promoción en directo

El sistema de Dreaming tiene dos vías de revisión relacionadas:

- **Dreaming en directo** trabaja a partir del almacén de Dreaming a corto plazo en
  `memory/.dreams/` y es lo que utiliza la fase profunda normal para decidir qué
  pasa a `MEMORY.md`.
- **Relleno fundamentado** lee las notas históricas de `memory/YYYY-MM-DD.md` como
  archivos diarios independientes y escribe resultados de revisión estructurados en `DREAMS.md`.

El relleno fundamentado resulta útil para reproducir notas antiguas e inspeccionar lo que el
sistema considera duradero, sin editar manualmente `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

La marca `--stage-short-term` incorpora los candidatos duraderos fundamentados al mismo
almacén de Dreaming a corto plazo que ya utiliza la fase profunda normal; no los
promueve directamente. Por tanto:

- `DREAMS.md` sigue siendo la superficie de revisión humana.
- El almacén a corto plazo sigue siendo la superficie de clasificación orientada a la máquina.
- `MEMORY.md` solo se escribe mediante la promoción profunda.

Para deshacer una reproducción sin modificar las entradas ordinarias del diario ni el estado normal de
recuperación:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Comprobar el estado del índice y el proveedor
openclaw memory search "query"  # Buscar desde la línea de comandos
openclaw memory index --force   # Reconstruir el índice
```

## Lecturas adicionales

- [Búsqueda en memoria](/es/concepts/memory-search): pipeline de búsqueda, proveedores y ajustes.
- [Motor de memoria integrado](/es/concepts/memory-builtin): backend SQLite predeterminado.
- [Motor de memoria QMD](/es/concepts/memory-qmd): proceso auxiliar avanzado con prioridad local.
- [Memoria de Honcho](/es/concepts/memory-honcho): memoria nativa de IA entre sesiones.
- [Memoria LanceDB](/es/plugins/memory-lancedb): Plugin respaldado por LanceDB con embeddings compatibles con OpenAI.
- [Wiki de memoria](/es/plugins/memory-wiki): repositorio de conocimiento compilado y herramientas nativas de wiki.
- [Dreaming](/es/concepts/dreaming): promoción en segundo plano desde la recuperación a corto plazo hasta la memoria a largo plazo.
- [Referencia de configuración de memoria](/es/reference/memory-config): todas las opciones de configuración.
- [Compaction](/es/concepts/compaction): cómo interactúa Compaction con la memoria.
- [Memoria activa](/es/concepts/active-memory): memoria de subagentes para sesiones de chat interactivas.
