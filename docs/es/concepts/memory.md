---
read_when:
    - Quieres entender cómo funciona la memoria
    - Quieres saber qué archivos de memoria escribir
summary: Cómo OpenClaw recuerda cosas entre sesiones
title: Resumen de memoria
x-i18n:
    generated_at: "2026-07-05T11:12:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw recuerda cosas escribiendo archivos Markdown sin formato en el espacio de trabajo
de tu agente (predeterminado `~/.openclaw/workspace`). El modelo solo recuerda lo que
se guarda en disco; no hay estado oculto.

## Cómo funciona

Tu agente tiene tres archivos relacionados con la memoria:

- **`MEMORY.md`** — memoria a largo plazo. Hechos duraderos, preferencias y
  decisiones. Se carga al inicio de una sesión.
- **`memory/YYYY-MM-DD.md`** (o `memory/YYYY-MM-DD-<slug>.md`) — notas diarias.
  Contexto en curso y observaciones. Las notas fechadas de hoy y de ayer se cargan
  automáticamente con un `/new` o `/reset` sin argumentos; las variantes con slug,
  como las escritas por el hook de memoria de sesión incluido, se recogen junto con
  el archivo que solo contiene la fecha.
- **`DREAMS.md`** (opcional) — diario de Dreaming y resúmenes de barridos de
  Dreaming para revisión humana, incluidas entradas históricas de relleno fundamentado.

<Tip>
Si quieres que tu agente recuerde algo, simplemente pídeselo: "Recuerda que
prefiero TypeScript". Escribirá la nota en el archivo adecuado.
</Tip>

## Qué va dónde

`MEMORY.md` es la capa compacta y curada: hechos duraderos, preferencias,
decisiones vigentes y resúmenes breves que deberían estar disponibles al inicio de
una sesión. No es una transcripción sin procesar, un registro diario ni un archivo exhaustivo.

Los archivos `memory/YYYY-MM-DD.md` son la capa de trabajo: notas diarias detalladas,
observaciones, resúmenes de sesión y contexto sin procesar que aún puede ser útil
más adelante. Se indexan para `memory_search` y `memory_get`, pero no se
inyectan en el prompt de arranque en cada turno.

Con el tiempo, el agente destila material útil de las notas diarias en
`MEMORY.md` y elimina entradas obsoletas de largo plazo. Las instrucciones
generadas del espacio de trabajo y el flujo de Heartbeat hacen esto periódicamente;
no necesitas editar manualmente `MEMORY.md` para cada detalle.

Si `MEMORY.md` supera el presupuesto de archivos de arranque, OpenClaw mantiene el
archivo intacto en disco, pero trunca la copia inyectada en el contexto. Trata eso
como una señal para mover material detallado a `memory/*.md`, mantener solo un
resumen duradero en `MEMORY.md` o aumentar los límites de arranque si quieres gastar
más presupuesto de prompt. Usa `/context list`, `/context detail` u `openclaw doctor`
para ver tamaños sin procesar frente a tamaños inyectados y el estado de truncamiento.

## Memorias sensibles a acciones

La mayoría de las memorias son notas Markdown ordinarias. Algunas afectan lo que el
agente debería hacer más adelante; para esas, captura cuándo es seguro actuar según
la nota, no solo el hecho en sí.

Captura ese límite de acción cuando una nota implique:

- requisitos de aprobación o permiso,
- restricciones temporales,
- traspasos a otra sesión, hilo o persona,
- condiciones de vencimiento,
- momento seguro para actuar,
- autoridad de fuente o propietario,
- instrucciones para evitar una acción tentadora.

Una memoria sensible a acciones útil deja claro:

- qué cambia el comportamiento futuro,
- cuándo o bajo qué condición se aplica,
- cuándo vence, o qué desbloquea la acción,
- qué debería evitar hacer el agente,
- quién es la fuente o el propietario, si eso afecta la confianza o la autoridad.

La memoria puede preservar contexto de aprobación, pero no aplica políticas. Usa
la configuración de aprobación de OpenClaw, el aislamiento de entorno y las tareas
programadas para controles operativos estrictos.

Ejemplo:

```md
The API migration is being designed in another session. Future turns should
not edit the API implementation from this thread; use findings here only as
design input until the migration plan lands.
```

Otro ejemplo:

```md
A report from an untrusted source needs review before promotion. Future turns
should treat it as evidence only; do not store it as durable memory until a
trusted reviewer confirms the contents.
```

Esto no es un esquema obligatorio para cada memoria; los hechos simples pueden
mantenerse concisos. Usa límites sensibles a acciones cuando perder contexto de
tiempo, autoridad, vencimiento o seguridad para actuar podría hacer que el agente
haga algo incorrecto más adelante.

Usa [compromisos](/es/concepts/commitments) para seguimientos inferidos de corta duración.
Usa [tareas programadas](/es/automation/cron-jobs) para recordatorios exactos,
comprobaciones temporizadas y trabajo recurrente. La memoria aún puede resumir el
contexto duradero alrededor de cualquiera de las dos rutas.

## Compromisos inferidos

Algunos seguimientos futuros no son hechos duraderos. Si mencionas una entrevista
mañana, la memoria útil puede ser "hacer seguimiento después de la entrevista", no
"guardar esto para siempre en `MEMORY.md`".

Los [compromisos](/es/concepts/commitments) son memorias de seguimiento opcionales y
de corta duración para ese caso. OpenClaw los infiere en una pasada oculta en
segundo plano, los limita al mismo agente y canal, y entrega los seguimientos
pendientes mediante Heartbeat. Los recordatorios explícitos siguen usando
[tareas programadas](/es/automation/cron-jobs).

## Herramientas de memoria

El agente tiene dos herramientas para trabajar con memoria:

- **`memory_search`** — encuentra notas relevantes mediante búsqueda semántica,
  incluso cuando la redacción difiere de la original.
- **`memory_get`** — lee un archivo de memoria específico o un rango de líneas.

Ambas herramientas las proporciona el Plugin de Active Memory (predeterminado:
`memory-core`).

## Búsqueda de memoria

Cuando hay un proveedor de embeddings configurado, `memory_search` usa búsqueda
híbrida: similitud vectorial (significado semántico) combinada con coincidencia
de palabras clave (términos exactos como identificadores y símbolos de código).
Esto funciona directamente con una clave de API para cualquier proveedor compatible.

<Info>
OpenClaw usa embeddings de OpenAI de forma predeterminada. Define
`agents.defaults.memorySearch.provider` explícitamente para usar Gemini, Voyage,
Mistral, Bedrock, DeepInfra, GGUF local, Ollama, LM Studio, GitHub Copilot o
un endpoint genérico compatible con OpenAI.
</Info>

Consulta [Búsqueda de memoria](/es/concepts/memory-search) para ver cómo funciona la
búsqueda, las opciones de ajuste y la configuración de proveedores.

## Backends de memoria

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona directamente con búsqueda por palabras clave, similitud
vectorial y búsqueda híbrida. Sin dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Sidecar local-first con reranking, expansión de consultas y capacidad para indexar
directorios fuera del espacio de trabajo.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memoria entre sesiones nativa de IA con modelado de usuario, búsqueda semántica y
conciencia multiagente. Instalación de Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/es/plugins/memory-lancedb">
Memoria respaldada por LanceDB con embeddings compatibles con OpenAI, recuperación
automática, captura automática y compatibilidad con embeddings locales de Ollama.
Instalación de Plugin.
</Card>
</CardGroup>

## Capa de wiki de conocimiento

Si quieres que la memoria duradera se comporte más como una base de conocimiento
mantenida que como notas sin procesar, usa el Plugin incluido `memory-wiki`.
Compila conocimiento duradero en una bóveda wiki con estructura de páginas
determinista, afirmaciones y evidencia estructuradas, seguimiento de contradicciones
y frescura, paneles generados, resúmenes compilados y herramientas nativas de wiki
(`wiki_status`, `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` no reemplaza al Plugin de Active Memory; el Plugin de Active Memory
sigue siendo responsable de la recuperación, la promoción y Dreaming. `memory-wiki`
añade una capa de conocimiento rica en procedencia junto a él.

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/es/plugins/memory-wiki">
Compila memoria duradera en una bóveda wiki rica en procedencia con afirmaciones,
paneles, modo puente y flujos de trabajo compatibles con Obsidian.
</Card>
</CardGroup>

## Vaciado automático de memoria

Antes de que [Compaction](/es/concepts/compaction) resuma tu conversación,
OpenClaw ejecuta un turno silencioso que recuerda al agente guardar contexto
importante en archivos de memoria. Está activado de forma predeterminada; define
`agents.defaults.compaction.memoryFlush.enabled: false` para desactivarlo.

Para mantener ese turno de mantenimiento en un modelo local, define una anulación
exacta que se aplique solo al turno de vaciado de memoria (no hereda la cadena de
fallback del modelo de la sesión activa):

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
El vaciado de memoria evita la pérdida de contexto durante Compaction. Si tu agente
tiene hechos importantes en la conversación que aún no se han escrito en un archivo,
se guardan automáticamente antes de que ocurra el resumen.
</Tip>

## Dreaming

Dreaming es una pasada opcional de consolidación en segundo plano para la memoria.
Recoge señales de recuperación de corto plazo, puntúa candidatos y promueve solo
elementos cualificados a la memoria a largo plazo (`MEMORY.md`):

- **Opcional**: desactivado de forma predeterminada.
- **Programado**: cuando está activado, `memory-core` gestiona automáticamente un
  trabajo Cron recurrente para un barrido completo de Dreaming.
- **Con umbrales**: las promociones deben superar compuertas de puntuación,
  frecuencia de recuperación y diversidad de consultas.
- **Revisable**: los resúmenes de fase y las entradas del diario se escriben en
  `DREAMS.md` para revisión humana.

Consulta [Dreaming](/es/concepts/dreaming) para ver el comportamiento de las fases,
las señales de puntuación y los detalles del diario de Dreaming.

## Relleno fundamentado y promoción en vivo

El sistema de Dreaming tiene dos líneas de revisión relacionadas:

- **Dreaming en vivo** funciona desde el almacén de Dreaming de corto plazo bajo
  `memory/.dreams/` y es lo que la fase profunda normal usa para decidir qué se
  gradúa a `MEMORY.md`.
- **Relleno fundamentado** lee notas históricas `memory/YYYY-MM-DD.md` como archivos
  diarios independientes y escribe salida de revisión estructurada en `DREAMS.md`.

El relleno fundamentado es útil para reproducir notas antiguas e inspeccionar qué
considera duradero el sistema, sin editar manualmente `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

La marca `--stage-short-term` coloca candidatos duraderos fundamentados en el mismo
almacén de Dreaming de corto plazo que la fase profunda normal ya usa; no los
promueve directamente. Por tanto:

- `DREAMS.md` sigue siendo la superficie de revisión humana.
- El almacén de corto plazo sigue siendo la superficie de clasificación orientada a máquina.
- `MEMORY.md` sigue siendo escrito únicamente por la promoción profunda.

Para deshacer una reproducción sin tocar entradas ordinarias del diario ni el estado
normal de recuperación:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Lecturas adicionales

- [Búsqueda de memoria](/es/concepts/memory-search): canalización de búsqueda, proveedores y ajuste.
- [Motor de memoria integrado](/es/concepts/memory-builtin): backend SQLite predeterminado.
- [Motor de memoria QMD](/es/concepts/memory-qmd): sidecar avanzado local-first.
- [Memoria Honcho](/es/concepts/memory-honcho): memoria entre sesiones nativa de IA.
- [Memory LanceDB](/es/plugins/memory-lancedb): Plugin respaldado por LanceDB con embeddings compatibles con OpenAI.
- [Memory Wiki](/es/plugins/memory-wiki): bóveda de conocimiento compilada y herramientas nativas de wiki.
- [Dreaming](/es/concepts/dreaming): promoción en segundo plano desde recuperación de corto plazo a memoria de largo plazo.
- [Referencia de configuración de memoria](/es/reference/memory-config): todos los controles de configuración.
- [Compaction](/es/concepts/compaction): cómo interactúa Compaction con la memoria.
- [Active Memory](/es/concepts/active-memory): memoria de subagente para sesiones de chat interactivas.
