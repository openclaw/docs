---
read_when:
    - Quieres entender cómo funciona la memoria
    - Quieres saber qué archivos de memoria escribir
summary: Cómo OpenClaw recuerda cosas entre sesiones
title: Descripción general de la memoria
x-i18n:
    generated_at: "2026-06-27T11:13:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw recuerda cosas escribiendo **archivos Markdown sin formato** en el
workspace de tu agente. El modelo solo "recuerda" lo que se guarda en disco; no
hay estado oculto.

## Cómo funciona

Tu agente tiene tres archivos relacionados con la memoria:

- **`MEMORY.md`**: memoria a largo plazo. Hechos duraderos, preferencias y
  decisiones. Se carga al inicio de cada sesión de DM.
- **`memory/YYYY-MM-DD.md`** (o **`memory/YYYY-MM-DD-<slug>.md`**): notas diarias.
  Contexto en curso y observaciones. Las notas de hoy y de ayer se cargan
  automáticamente, y las variantes con slug, como las escritas por el hook de
  memoria de sesión incluido en `/new` o `/reset`, ahora se recogen junto con el
  archivo que solo tiene fecha.
- **`DREAMS.md`** (opcional): resúmenes del Diario de Dreaming y de barridos de
  Dreaming para revisión humana, incluidas entradas de relleno histórico
  fundamentado.

Estos archivos viven en el workspace del agente (predeterminado:
`~/.openclaw/workspace`).

## Qué va dónde

`MEMORY.md` es la capa compacta y curada. Úsalo para hechos duraderos,
preferencias, decisiones permanentes y resúmenes breves que deberían estar
disponibles al inicio de una sesión privada principal. No está pensado como
transcripción sin procesar, registro diario ni archivo exhaustivo.

Los archivos `memory/YYYY-MM-DD.md` son la capa de trabajo. Úsalos para notas
diarias detalladas, observaciones, resúmenes de sesión y contexto sin procesar
que todavía puede ser útil más adelante. Estos archivos se indexan para
`memory_search` y `memory_get`, pero no se inyectan en el prompt de arranque
normal en cada turno.

Con el tiempo, se espera que el agente destile material útil de las notas diarias
en `MEMORY.md` y elimine entradas a largo plazo obsoletas. Las instrucciones
generadas del workspace y el flujo de heartbeat pueden hacerlo periódicamente; no
necesitas editar manualmente `MEMORY.md` para cada detalle recordado.

Si `MEMORY.md` supera el presupuesto de archivo de arranque, OpenClaw conserva
intacto el archivo en disco, pero trunca la copia inyectada en el contexto del
modelo. Tómalo como una señal para mover el material detallado de vuelta a
`memory/*.md`, dejar solo el resumen duradero en `MEMORY.md` o aumentar los
límites de arranque si explícitamente quieres gastar más presupuesto de prompt.
Usa `/context list`, `/context detail` u `openclaw doctor` para ver los tamaños
sin procesar frente a los inyectados y el estado de truncamiento.

<Tip>
Si quieres que tu agente recuerde algo, solo pídeselo: "Remember that I
prefer TypeScript." Lo escribirá en el archivo adecuado.
</Tip>

## Memorias sensibles a acciones

La mayoría de las memorias se pueden escribir como notas Markdown normales. Pero algunas memorias afectan lo que el agente debería hacer más adelante. Para esas, captura cuándo es seguro actuar según la nota, no solo el hecho en sí.

Captura ese límite de acción cuando una nota implique:

- requisitos de aprobación o permiso,
- restricciones temporales,
- traspasos a otra sesión, hilo o persona,
- condiciones de expiración,
- momento seguro para actuar,
- autoridad de la fuente o del propietario,
- instrucciones para evitar una acción tentadora.

Una memoria sensible a acciones útil deja claro:

- qué cambia el comportamiento futuro,
- cuándo o bajo qué condición se aplica,
- cuándo expira o qué desbloquea la acción,
- qué debería evitar hacer el agente,
- quién es la fuente o el propietario, si eso afecta la confianza o la autoridad.

La memoria puede preservar el contexto de aprobación, pero no aplica políticas. Usa los ajustes de aprobación de OpenClaw, el sandboxing y las tareas programadas para controles operativos estrictos.

Ejemplo:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Otro ejemplo:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Usa [compromisos](/es/concepts/commitments) para seguimientos inferidos y de corta duración. Usa [tareas programadas](/es/automation/cron-jobs) para recordatorios exactos, comprobaciones temporizadas y trabajo recurrente. La memoria aún puede resumir el contexto duradero alrededor de cualquiera de las dos rutas.

Esto no es un esquema obligatorio para cada memoria. Los hechos simples pueden mantenerse concisos. Usa límites sensibles a acciones cuando perder el contexto de tiempo, autoridad, expiración o seguridad para actuar pueda hacer que el agente haga algo incorrecto más adelante.

## Compromisos inferidos

Algunos seguimientos futuros no son hechos duraderos. Si mencionas una entrevista
mañana, la memoria útil puede ser "consultar después de la entrevista", no
"guardar esto para siempre en `MEMORY.md`."

Los [compromisos](/es/concepts/commitments) son memorias de seguimiento opcionales
y de corta duración para ese caso. OpenClaw los infiere en una pasada oculta en
segundo plano, los limita al mismo agente y canal, y entrega los check-ins
vencidos mediante heartbeat. Los recordatorios explícitos siguen usando
[tareas programadas](/es/automation/cron-jobs).

## Herramientas de memoria

El agente tiene dos herramientas para trabajar con la memoria:

- **`memory_search`**: encuentra notas relevantes mediante búsqueda semántica,
  incluso cuando la redacción difiere de la original.
- **`memory_get`**: lee un archivo de memoria específico o un rango de líneas.

Ambas herramientas las proporciona el plugin de Active Memory (predeterminado:
`memory-core`).

## Plugin complementario Memory Wiki

Si quieres que la memoria duradera se comporte más como una base de conocimiento
mantenida que como simples notas sin procesar, usa el plugin incluido
`memory-wiki`.

`memory-wiki` compila conocimiento duradero en una bóveda wiki con:

- estructura de páginas determinista
- afirmaciones y evidencia estructuradas
- seguimiento de contradicciones y frescura
- paneles generados
- resúmenes compilados para consumidores del agente/runtime
- herramientas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` y `wiki_lint`

No reemplaza al plugin de Active Memory. El plugin de Active Memory sigue
siendo dueño de la recuperación, la promoción y Dreaming. `memory-wiki` añade a
su lado una capa de conocimiento rica en procedencia.

Consulta [Memory Wiki](/es/plugins/memory-wiki).

## Búsqueda de memoria

Cuando se configura un proveedor de embeddings, `memory_search` usa **búsqueda
híbrida**: combina similitud vectorial (significado semántico) con coincidencia
de palabras clave (términos exactos como IDs y símbolos de código). Esto funciona
de inmediato una vez que tienes una clave de API para cualquier proveedor
compatible.

<Info>
OpenClaw usa embeddings de OpenAI de forma predeterminada. Establece
`agents.defaults.memorySearch.provider` explícitamente para usar embeddings de
Gemini, Voyage, Mistral, local, Ollama, Bedrock, GitHub Copilot o compatibles
con OpenAI.
</Info>

Para detalles sobre cómo funciona la búsqueda, opciones de ajuste y configuración
de proveedores, consulta [Búsqueda de memoria](/es/concepts/memory-search).

## Backends de memoria

<CardGroup cols={3}>
<Card title="Integrado (predeterminado)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona de inmediato con búsqueda por palabras clave, similitud vectorial y
búsqueda híbrida. Sin dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Sidecar local-first con reranking, expansión de consultas y la capacidad de indexar
directorios fuera del workspace.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memoria entre sesiones nativa de IA con modelado de usuario, búsqueda semántica y
conciencia multiagente. Instalación de plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/es/plugins/memory-lancedb">
Memoria incluida respaldada por LanceDB con embeddings compatibles con OpenAI,
recuperación automática, captura automática y soporte local para embeddings de Ollama.
</Card>
</CardGroup>

## Capa wiki de conocimiento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/es/plugins/memory-wiki">
Compila memoria duradera en una bóveda wiki rica en procedencia con afirmaciones,
paneles, modo puente y flujos de trabajo compatibles con Obsidian.
</Card>
</CardGroup>

## Vaciado automático de memoria

Antes de que [Compaction](/es/concepts/compaction) resuma tu conversación, OpenClaw
ejecuta un turno silencioso que recuerda al agente guardar contexto importante en
archivos de memoria. Está activado de forma predeterminada; no necesitas
configurar nada.

Para mantener ese turno de mantenimiento en un modelo local, establece una
sobrescritura exacta de modelo para el vaciado de memoria:

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

La sobrescritura se aplica solo al turno de vaciado de memoria y no hereda la
cadena de fallbacks de la sesión activa.

<Tip>
El vaciado de memoria evita la pérdida de contexto durante Compaction. Si tu
agente tiene hechos importantes en la conversación que aún no se han escrito en
un archivo, se guardarán automáticamente antes de que ocurra el resumen.
</Tip>

## Dreaming

Dreaming es una pasada opcional de consolidación en segundo plano para la memoria. Recopila
señales a corto plazo, puntúa candidatos y promueve solo elementos cualificados a
la memoria a largo plazo (`MEMORY.md`).

Está diseñado para mantener alta la señal de la memoria a largo plazo:

- **Opcional**: desactivado de forma predeterminada.
- **Programado**: cuando está activado, `memory-core` autogestiona un trabajo cron
  recurrente para un barrido completo de Dreaming.
- **Con umbrales**: las promociones deben superar puertas de puntuación,
  frecuencia de recuperación y diversidad de consultas.
- **Revisable**: los resúmenes de fase y las entradas de diario se escriben en
  `DREAMS.md` para revisión humana.

Para el comportamiento de fases, señales de puntuación y detalles del Diario de
Dreaming, consulta [Dreaming](/es/concepts/dreaming).

## Relleno fundamentado y promoción en vivo

El sistema de Dreaming ahora tiene dos carriles de revisión estrechamente relacionados:

- **Dreaming en vivo** trabaja desde el almacén de Dreaming a corto plazo bajo
  `memory/.dreams/` y es lo que usa la fase profunda normal al decidir qué puede
  graduarse a `MEMORY.md`.
- **Relleno fundamentado** lee notas históricas `memory/YYYY-MM-DD.md` como
  archivos diarios independientes y escribe salida de revisión estructurada en
  `DREAMS.md`.

El relleno fundamentado es útil cuando quieres reproducir notas antiguas e
inspeccionar qué considera duradero el sistema sin editar manualmente
`MEMORY.md`.

Cuando usas:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

los candidatos duraderos fundamentados no se promueven directamente. Se preparan
en el mismo almacén de Dreaming a corto plazo que ya usa la fase profunda normal.
Eso significa:

- `DREAMS.md` sigue siendo la superficie de revisión humana.
- el almacén a corto plazo sigue siendo la superficie de clasificación orientada a la máquina.
- `MEMORY.md` todavía solo lo escribe la promoción profunda.

Si decides que la reproducción no fue útil, puedes eliminar los artefactos
preparados sin tocar entradas de diario ordinarias ni el estado de recuperación
normal:

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

- [Motor de memoria integrado](/es/concepts/memory-builtin): backend SQLite predeterminado.
- [Motor de memoria QMD](/es/concepts/memory-qmd): sidecar avanzado local-first.
- [Memoria Honcho](/es/concepts/memory-honcho): memoria entre sesiones nativa de IA.
- [Memory LanceDB](/es/plugins/memory-lancedb): plugin respaldado por LanceDB con embeddings compatibles con OpenAI.
- [Memory Wiki](/es/plugins/memory-wiki): bóveda de conocimiento compilada y herramientas nativas de wiki.
- [Búsqueda de memoria](/es/concepts/memory-search): canalización de búsqueda, proveedores y ajuste.
- [Dreaming](/es/concepts/dreaming): promoción en segundo plano desde recuperación a corto plazo a memoria a largo plazo.
- [Referencia de configuración de memoria](/es/reference/memory-config): todos los controles de configuración.
- [Compaction](/es/concepts/compaction): cómo Compaction interactúa con la memoria.

## Relacionado

- [Active Memory](/es/concepts/active-memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria Honcho](/es/concepts/memory-honcho)
- [Memory LanceDB](/es/plugins/memory-lancedb)
- [Compromisos](/es/concepts/commitments)
