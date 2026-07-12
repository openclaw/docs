---
read_when:
    - Quieres usar la CLI de memory-wiki
    - Está documentando o cambiando `openclaw wiki`
summary: Referencia de la CLI para `openclaw wiki` (estado del almacén de memory-wiki, búsqueda, compilación, lint, aplicación, puente, importación de ChatGPT y utilidades de Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-12T14:25:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecciona y mantiene el almacén `memory-wiki`. Lo proporciona el plugin `memory-wiki` incluido.

Relacionado: [Plugin Memory Wiki](/es/plugins/memory-wiki), [Descripción general de la memoria](/es/concepts/memory), [CLI: memoria](/es/cli/memory)

## Comandos habituales

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "¿a quién debería preguntar sobre Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Resumen de Alpha" \
  --body "Cuerpo breve de la síntesis" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "¿Sigue activo?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Selección del agente

Cuando `plugins.entries.memory-wiki.config.vault.scope` es `agent`, selecciona el
almacén con la opción de nivel superior `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "política de reembolsos"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

En una configuración con varios agentes configurados, `--agent` es obligatorio para las
operaciones de la CLI, de modo que un comando no pueda leer ni escribir en un almacén predeterminado arbitrario. Si
solo hay un agente configurado, ese agente sigue siendo el predeterminado. Los identificadores de agente desconocidos
generan un error antes de que comience la operación del almacén. La opción no cambia la ruta
seleccionada cuando `vault.scope` es `global`.

Los clientes del Gateway siguen la misma regla: pasa `agentId` en las solicitudes `wiki.*`
respaldadas por el almacén en una configuración multiagente con ámbito de agente. Un identificador ausente o desconocido es un
error. Los turnos del agente, las herramientas de la wiki, los complementos del corpus de memoria y los resúmenes
compilados del prompt ya incluyen el contexto del agente activo en tiempo de ejecución.

## Comandos

### `wiki status`

Muestra el modo y el ámbito del almacén, el agente resuelto, el estado y la disponibilidad de la CLI de Obsidian. Usa este comando primero para comprobar si el almacén previsto está inicializado, si el modo puente funciona correctamente o si la integración con Obsidian está disponible.

Cuando el modo puente está activo y configurado para leer artefactos de memoria, este comando consulta el Gateway en ejecución para obtener el mismo contexto activo del plugin de memoria que la memoria del agente o del entorno de ejecución.

### `wiki doctor`

Ejecuta comprobaciones de estado de la wiki e informa de correcciones aplicables. Finaliza con un código distinto de cero cuando el estado no es correcto.

Cuando el modo puente está activo y configurado para leer artefactos de memoria, este comando consulta el Gateway en ejecución antes de generar el informe. Las importaciones de puente deshabilitadas y las configuraciones de puente que no leen artefactos de memoria permanecen en modo local y sin conexión.

Problemas habituales:

- modo puente habilitado sin artefactos públicos de memoria
- diseño del almacén no válido o ausente
- falta la CLI externa de Obsidian cuando se espera el modo Obsidian

### `wiki init`

Crea el diseño del almacén de la wiki y las páginas iniciales, incluidos los índices de nivel superior y los directorios de caché.

### `wiki ingest <path>`

Importa un archivo Markdown o de texto local en la carpeta `sources/` de la wiki como página de origen. `<path>` debe ser una ruta de archivo local; actualmente no se pueden ingerir URL. Rechaza los archivos binarios.

Las páginas de origen importadas incluyen frontmatter de procedencia (`sourceType: local-file`, `sourcePath`, `ingestedAt`). La ingesta siempre vuelve a compilar el almacén después.

Opciones: `--title <title>` sustituye el título del origen (valor predeterminado: se deriva del nombre del archivo).

### `wiki okf import <path>`

Importa un paquete de Open Knowledge Format descomprimido en páginas de conceptos de la wiki.

El importador lee todos los documentos de conceptos `.md` no reservados del árbol de directorios de OKF, requiere un campo `type` que no esté vacío y trata los valores desconocidos de `type` de OKF como conceptos genéricos. Los archivos reservados `index.md` y `log.md` de OKF no se importan como conceptos.

Las páginas importadas se disponen en una estructura plana dentro de `concepts/` para que los flujos existentes de compilación, búsqueda, obtención, resumen y panel de la wiki las detecten de inmediato. El identificador original del concepto de OKF, `type`, `resource`, `tags`, la marca de tiempo, la ruta de origen y el frontmatter completo se conservan en el frontmatter de la página. Los enlaces Markdown internos de OKF se reescriben para apuntar a las páginas generadas de la wiki; los enlaces rotos o externos se dejan sin cambios. La importación siempre vuelve a compilar el almacén después.

Ejemplos:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "Tabla de BigQuery" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Reconstruye índices, bloques relacionados, paneles y resúmenes compilados. Escribe artefactos estables destinados a máquinas en:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` está habilitado, la compilación también actualiza las páginas de informes.

### `wiki lint`

Analiza el almacén y escribe un informe que abarca:

- problemas estructurales (enlaces rotos, identificadores ausentes o duplicados, falta el tipo o título de la página, frontmatter no válido)
- carencias de procedencia (faltan identificadores de origen, falta la procedencia de importación)
- contradicciones (contradicciones marcadas, afirmaciones en conflicto)
- preguntas abiertas
- páginas y afirmaciones de baja confianza
- páginas y afirmaciones obsoletas

Ejecuta este comando después de realizar actualizaciones significativas en la wiki.

### `wiki search <query>`

Busca contenido en la wiki. El comportamiento depende de la configuración:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` o `raw-claim`

Usa `wiki search` para obtener una clasificación y procedencia específicas de la wiki. Para una única recuperación compartida y amplia, utiliza preferentemente `openclaw memory search` cuando el plugin de memoria activo ofrezca búsqueda compartida.

Modos de búsqueda:

- `find-person`: alias, identificadores, redes sociales, identificadores canónicos y páginas de personas
- `route-question`: indicaciones sobre a quién preguntar, para qué se usa mejor y contexto de relaciones
- `source-evidence`: páginas de origen y campos de evidencia estructurados
- `raw-claim`: texto de afirmaciones estructuradas con metadatos de afirmación y evidencia

Ejemplos:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "¿quién conoce el despliegue de Teams?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "ruta sólida de Teams" --mode raw-claim --json
```

La salida de texto incluye líneas `Claim:` y `Evidence:` cuando un resultado coincide con una afirmación estructurada. La salida JSON también expone `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` y `evidenceSourceIds` para que el agente pueda profundizar.

### `wiki get <lookup>`

Lee una página de la wiki por identificador o ruta relativa.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplica modificaciones específicas sin realizar cambios de formato libre en las páginas:

- `apply synthesis <title>`: crea o actualiza una página de síntesis con un cuerpo de resumen administrado
- `apply metadata <lookup>`: actualiza los metadatos de una página existente

Ambos aceptan `--source-id`, `--contradiction`, `--question` (cada uno se puede repetir), `--confidence <n>` (0-1) y `--status <status>`. `apply metadata` también acepta `--clear-confidence` para eliminar un valor de confianza almacenado. Esta es la forma admitida de hacer evolucionar las páginas de la wiki para que los bloques generados administrados permanezcan intactos.

### `wiki bridge import`

Importa artefactos públicos de memoria desde el plugin de memoria activo en páginas de origen respaldadas por el puente. Usa este comando en modo `bridge` para incorporar al almacén de la wiki los artefactos de memoria exportados más recientes.

Para las lecturas activas de artefactos del puente, la CLI enruta la importación mediante RPC del Gateway para usar el contexto del plugin de memoria en tiempo de ejecución. Si las importaciones del puente están deshabilitadas o las lecturas de artefactos están desactivadas, el comando mantiene el comportamiento local y sin conexión de cero importaciones. La actualización del índice después de la importación está condicionada por `ingest.autoCompile`.

### `wiki unsafe-local import`

Importa desde rutas locales configuradas explícitamente (`unsafeLocal.paths`) en modo `unsafe-local`. Es intencionadamente experimental y solo funciona en la misma máquina. La actualización del índice después de la importación está condicionada por `ingest.autoCompile`.

### `wiki chatgpt import`

Importa una exportación de ChatGPT en páginas de origen de borrador de la wiki.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Opción            | Valor predeterminado | Descripción                                                               |
| ----------------- | -------------------- | ------------------------------------------------------------------------- |
| `--export <path>` | (obligatorio)        | Directorio de exportación de ChatGPT o ruta de `conversations.json`.      |
| `--dry-run`       | `false`              | Previsualiza los recuentos de elementos creados, actualizados u omitidos sin escribir páginas. |

Una importación que no sea de prueba y que cambie alguna página registra un identificador de ejecución de importación, que se muestra en el resumen y es necesario para revertirla.

### `wiki chatgpt rollback <run-id>`

Revierte una ejecución de importación de ChatGPT aplicada anteriormente, eliminando las páginas que creó y restaurando las páginas que sobrescribió. No realiza ninguna operación (e informa de `alreadyRolledBack`) si la ejecución ya se había revertido.

### `wiki obsidian ...`

Comandos auxiliares de Obsidian para almacenes que se ejecutan en un modo compatible con Obsidian: `status`, `search`, `open`, `command`, `daily`. Requieren la CLI oficial `obsidian` en `PATH` cuando `obsidian.useOfficialCli` está habilitado.

La validación de la configuración rechaza `obsidian.useOfficialCli: true` cuando
`vault.scope` es `agent` porque `obsidian.vaultName` es una única configuración global,
no una asignación por agente. La representación de Markdown compatible con Obsidian sigue
estando disponible.

## Orientación práctica de uso

- Usa `wiki search` + `wiki get` cuando importen la procedencia y la identidad de la página.
- Usa `wiki apply` en lugar de editar manualmente las secciones generadas administradas.
- Usa `wiki lint` antes de confiar en contenido contradictorio o de baja confianza.
- Usa `wiki compile` después de importaciones masivas o cambios en los orígenes cuando necesites inmediatamente paneles y resúmenes compilados actualizados.
- Usa `wiki okf import` cuando un catálogo de datos, una exportación de documentación o una canalización de enriquecimiento de agentes ya genere paquetes Markdown de OKF.
- Usa `wiki bridge import` cuando el modo puente dependa de artefactos de memoria recién exportados.

## Configuración relacionada

El comportamiento de `openclaw wiki` depende de:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulta [Plugin Memory Wiki](/es/plugins/memory-wiki) para ver el modelo de configuración completo.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Wiki de memoria](/es/plugins/memory-wiki)
