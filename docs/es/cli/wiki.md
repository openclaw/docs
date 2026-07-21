---
read_when:
    - Desea usar la CLI de memory-wiki
    - Está documentando o cambiando `openclaw wiki`
summary: Referencia de la CLI para `openclaw wiki` (estado del almacén memory-wiki, búsqueda, compilación, lint, aplicación, puente, importación desde ChatGPT y utilidades de Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-21T08:58:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1f793d52de270068cf3a06b13f52242bb66738235718639486e090a2de213e73
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecciona y mantiene el almacén `memory-wiki`. Lo proporciona el plugin opcional incluido `memory-wiki`. Actívalo antes de usarlo por primera vez:

```bash
openclaw plugins enable memory-wiki
openclaw gateway restart
```

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

En una configuración con varios agentes configurados, `--agent` es obligatorio para las operaciones de la CLI
para que un comando no pueda leer ni escribir en un almacén predeterminado arbitrario. Si
solo hay un agente configurado, ese agente sigue siendo el predeterminado. Los identificadores de agente desconocidos
producen un error antes de que comience la operación del almacén. La opción no cambia la ruta
seleccionada cuando `vault.scope` es `global`.

Los clientes del Gateway siguen la misma regla: pasa `agentId` en las solicitudes `wiki.*`
respaldadas por el almacén en una configuración multiagente con ámbito de agente. La ausencia de un identificador o un identificador desconocido constituye un
error. Los turnos de agente, las herramientas wiki, los complementos del corpus de memoria y los resúmenes
compilados del prompt ya incluyen el contexto del agente activo en tiempo de ejecución.

## Comandos

### `wiki status`

Muestra el modo y el ámbito del almacén, el agente resuelto, el estado y la disponibilidad de la CLI de Obsidian. Usa primero este comando para comprobar si el almacén previsto está inicializado, si el modo puente funciona correctamente o si la integración con Obsidian está disponible.

Cuando el modo puente está activo y configurado para leer artefactos de memoria, este comando consulta el Gateway en ejecución para utilizar el mismo contexto del plugin de memoria activo que la memoria del agente o del entorno de ejecución.

### `wiki doctor`

Ejecuta comprobaciones del estado de la wiki e informa de soluciones aplicables. Finaliza con un código distinto de cero si el estado no es correcto.

Cuando el modo puente está activo y configurado para leer artefactos de memoria, este comando consulta el Gateway en ejecución antes de generar el informe. Las importaciones mediante puente desactivadas y las configuraciones de puente que no leen artefactos de memoria permanecen en modo local y sin conexión.

Problemas habituales:

- modo puente activado sin artefactos públicos de memoria
- diseño del almacén no válido o ausente
- falta la CLI externa de Obsidian cuando se espera el modo Obsidian

### `wiki init`

Crea el diseño del almacén wiki y las páginas iniciales, incluidos los índices de nivel superior y los directorios de caché.

### `wiki ingest <path>`

Importa un archivo Markdown o de texto local en la carpeta `sources/` de la wiki como página de origen. `<path>` debe ser una ruta de archivo local; actualmente no se admite la ingesta desde URL. Rechaza los archivos binarios.

Las páginas de origen importadas incluyen frontmatter de procedencia (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Tras la ingesta, siempre se vuelve a compilar el almacén.

Opciones: `--title <title>` sustituye el título de la fuente (valor predeterminado: derivado del nombre del archivo).

### `wiki okf import <path>`

Importa un paquete de Open Knowledge Format descomprimido en páginas de conceptos de la wiki.

El importador lee todos los documentos de conceptos `.md` no reservados del árbol de directorios de OKF, requiere un campo `type` no vacío y trata los valores `type` desconocidos de OKF como conceptos genéricos. Los archivos reservados `index.md` y `log.md` de OKF no se importan como conceptos.

Las páginas importadas se aplanan bajo `concepts/` para que los flujos existentes de compilación, búsqueda, obtención, resumen y panel de la wiki puedan utilizarlas inmediatamente. El identificador original del concepto de OKF, `type`, `resource`, `tags`, la marca de tiempo, la ruta de origen y todo el frontmatter se conservan en el frontmatter de la página. Los enlaces Markdown internos de OKF se reescriben para dirigir a las páginas generadas de la wiki; los enlaces rotos o externos no se modifican. Tras la importación, siempre se vuelve a compilar el almacén.

Ejemplos:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "Tabla de BigQuery" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Reconstruye los índices, los bloques relacionados, los paneles y la instantánea compilada de consultas y prompts. La instantánea se conserva en el estado SQLite compartido del plugin de OpenClaw y se mantiene en memoria para la proyección síncrona del prompt; no crea archivos de caché en el almacén.

Si `render.createDashboards` está activado, la compilación también actualiza las páginas de informes.

### `wiki lint`

Analiza el almacén y genera un informe que abarca:

- problemas estructurales (enlaces rotos, identificadores ausentes o duplicados, tipo o título de página ausente, frontmatter no válido)
- carencias de procedencia (identificadores de origen ausentes, procedencia de importación ausente)
- contradicciones (contradicciones marcadas, afirmaciones incompatibles)
- preguntas abiertas
- páginas y afirmaciones de baja confianza
- páginas y afirmaciones obsoletas

Ejecuta este comando después de realizar actualizaciones importantes en la wiki.

### `wiki search <query>`

Busca contenido en la wiki. El comportamiento depende de la configuración:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` o `raw-claim`

Usa `wiki search` para aplicar clasificación y procedencia específicas de la wiki. Para realizar una única búsqueda amplia en la memoria compartida, se recomienda `openclaw memory search` cuando el plugin de memoria activo ofrece búsqueda compartida.

Modos de búsqueda:

- `find-person`: alias, identificadores de usuario, perfiles sociales, identificadores canónicos y páginas de personas
- `route-question`: indicaciones sobre a quién preguntar o para qué resulta más adecuado y contexto de relaciones
- `source-evidence`: páginas de origen y campos de evidencia estructurados
- `raw-claim`: texto de afirmaciones estructuradas con metadatos de afirmación y evidencia

Ejemplos:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "¿quién conoce el despliegue de Teams?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "ruta sólida de Teams" --mode raw-claim --json
```

La salida de texto incluye líneas `Claim:` y `Evidence:` cuando un resultado coincide con una afirmación estructurada. La salida JSON también expone `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` y `evidenceSourceIds` para que el agente pueda examinar los detalles.

### `wiki get <lookup>`

Lee una página de la wiki mediante su identificador o ruta relativa.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplica modificaciones específicas sin editar libremente las páginas:

- `apply synthesis <title>`: crea o actualiza una página de síntesis con un cuerpo de resumen administrado
- `apply metadata <lookup>`: actualiza los metadatos de una página existente

Ambos aceptan `--source-id`, `--contradiction`, `--question` (cada uno repetible), `--confidence <n>` (0-1) y `--status <status>`. `apply metadata` también acepta `--clear-confidence` para eliminar un valor de confianza almacenado. Esta es la forma compatible de hacer evolucionar las páginas de la wiki sin alterar los bloques generados y administrados.

### `wiki bridge import`

Importa artefactos públicos de memoria del plugin de memoria activo en páginas de origen respaldadas por el puente. Usa este comando en el modo `bridge` para incorporar al almacén de la wiki los últimos artefactos de memoria exportados.

Para las lecturas activas de artefactos mediante el puente, la CLI dirige la importación a través de RPC del Gateway para utilizar el contexto del plugin de memoria del entorno de ejecución. Si las importaciones mediante puente están desactivadas o la lectura de artefactos está deshabilitada, el comando conserva el comportamiento local y sin conexión, sin importar ningún elemento. La actualización de los índices después de la importación depende de `ingest.autoCompile`.

### `wiki unsafe-local import`

Importa desde rutas locales configuradas explícitamente (`unsafeLocal.paths`) en el modo `unsafe-local`. Es deliberadamente experimental y solo funciona en la misma máquina. La actualización de los índices después de la importación depende de `ingest.autoCompile`.

### `wiki chatgpt import`

Importa una exportación de ChatGPT en páginas de origen en borrador de la wiki.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Opción              | Valor predeterminado | Descripción                                                   |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | (obligatorio) | Directorio de exportación de ChatGPT o ruta `conversations.json`.        |
| `--dry-run`       | `false`    | Previsualiza las cantidades de elementos creados, actualizados y omitidos sin escribir páginas. |

Una importación que no sea de prueba y que modifique alguna página registra un identificador de ejecución de importación, que se muestra en el resumen y es necesario para revertirla.

### `wiki chatgpt rollback <run-id>`

Revierte una ejecución de importación de ChatGPT aplicada anteriormente, elimina las páginas que creó y restaura las páginas que sobrescribió. No realiza ninguna operación (e informa de `alreadyRolledBack`) si la ejecución ya se había revertido.

### `wiki obsidian ...`

Comandos auxiliares de Obsidian para almacenes que se ejecutan en un modo compatible con Obsidian: `status`, `search`, `open`, `command`, `daily`. Requieren la CLI oficial `obsidian` en `PATH` cuando `obsidian.useOfficialCli` está activado.

La validación de la configuración rechaza `obsidian.useOfficialCli: true` cuando
`vault.scope` es `agent`, porque `obsidian.vaultName` es una única configuración global,
no una asignación por agente. La representación de Markdown compatible con Obsidian sigue
estando disponible.

## Orientación práctica de uso

- Usa `wiki search` + `wiki get` cuando la procedencia y la identidad de la página sean importantes.
- Usa `wiki apply` en lugar de editar manualmente las secciones generadas y administradas.
- Usa `wiki lint` antes de confiar en contenido contradictorio o de baja confianza.
- Usa `wiki compile` después de importaciones masivas o cambios en las fuentes cuando se necesiten inmediatamente paneles actualizados y resúmenes compilados.
- Usa `wiki okf import` cuando un catálogo de datos, una exportación de documentación o un Pipeline de enriquecimiento de agentes ya genere paquetes Markdown de OKF.
- Usa `wiki bridge import` cuando el modo puente dependa de artefactos de memoria recién exportados.

## Configuración relacionada

El comportamiento de `openclaw wiki` está determinado por:

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

Consulta [Plugin Memory Wiki](/es/plugins/memory-wiki) para obtener el modelo de configuración completo.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Wiki de memoria](/es/plugins/memory-wiki)
