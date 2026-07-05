---
read_when:
    - Quieres usar la CLI de memory-wiki
    - Estás documentando o cambiando `openclaw wiki`
summary: Referencia de CLI para `openclaw wiki` (estado del almacén memory-wiki, búsqueda, compilación, lint, aplicación, puente, importación de ChatGPT y ayudantes de Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-05T11:10:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f50389227366eadfb027b019998604be4651b44430f8d7c04d719990843dd84
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecciona y mantiene la bóveda `memory-wiki`. Proporcionado por el Plugin `memory-wiki` incluido.

Relacionado: [Plugin Memory Wiki](/es/plugins/memory-wiki), [Descripción general de la memoria](/es/concepts/memory), [CLI: memory](/es/cli/memory)

## Comandos comunes

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

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

## Comandos

### `wiki status`

Muestra el modo de la bóveda, el estado y la disponibilidad de la CLI de Obsidian. Úsalo primero para comprobar si la bóveda está inicializada, si el modo puente está en buen estado o si la integración con Obsidian está disponible.

Cuando el modo puente está activo y configurado para leer artefactos de memoria, este comando consulta el Gateway en ejecución, de modo que ve el mismo contexto activo del Plugin de memoria que la memoria de agente/tiempo de ejecución.

### `wiki doctor`

Ejecuta comprobaciones de estado de la wiki e informa correcciones accionables. Sale con un código distinto de cero cuando no está en buen estado.

Cuando el modo puente está activo y configurado para leer artefactos de memoria, este comando consulta el Gateway en ejecución antes de crear el informe. Las importaciones de puente deshabilitadas y las configuraciones de puente que no leen artefactos de memoria permanecen locales/sin conexión.

Problemas típicos:

- modo puente habilitado sin artefactos de memoria públicos
- diseño de bóveda no válido o ausente
- CLI externa de Obsidian ausente cuando se espera el modo Obsidian

### `wiki init`

Crea el diseño de la bóveda wiki y las páginas iniciales, incluidos índices de nivel superior y directorios de caché.

### `wiki ingest <path>`

Importa un archivo local de markdown o texto a la carpeta `sources/` de la wiki como página fuente. `<path>` debe ser una ruta de archivo local; hoy no hay ingesta de URL. Rechaza archivos binarios.

Las páginas fuente importadas llevan frontmatter de procedencia (`sourceType: local-file`, `sourcePath`, `ingestedAt`). La ingesta siempre recompila la bóveda después.

Banderas: `--title <title>` reemplaza el título de la fuente (predeterminado: derivado del nombre de archivo).

### `wiki okf import <path>`

Importa un paquete de Open Knowledge Format descomprimido a páginas de conceptos de la wiki.

El importador lee todos los documentos de concepto `.md` no reservados en el árbol de directorios OKF, exige un campo `type` no vacío y trata los valores de `type` de OKF desconocidos como conceptos genéricos. Los archivos OKF reservados `index.md` y `log.md` no se importan como conceptos.

Las páginas importadas se aplanan bajo `concepts/` para que los flujos existentes de compilación, búsqueda, obtención, resumen y panel de la wiki las vean de inmediato. El ID de concepto OKF original, `type`, `resource`, `tags`, la marca de tiempo, la ruta fuente y el frontmatter completo se conservan en el frontmatter de la página. Los enlaces markdown internos de OKF se reescriben a las páginas de wiki generadas; los enlaces rotos o externos se dejan sin cambios. La importación siempre recompila la bóveda después.

Ejemplos:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Reconstruye índices, bloques relacionados, paneles y resúmenes compilados. Escribe artefactos estables orientados a máquinas en:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` está habilitado, la compilación también actualiza las páginas de informe.

### `wiki lint`

Analiza la bóveda y escribe un informe que cubre:

- problemas estructurales (enlaces rotos, ids ausentes/duplicados, tipo o título de página ausente, frontmatter no válido)
- brechas de procedencia (ids de fuente ausentes, procedencia de importación ausente)
- contradicciones (contradicciones marcadas, afirmaciones en conflicto)
- preguntas abiertas
- páginas y afirmaciones de baja confianza
- páginas y afirmaciones obsoletas

Ejecuta esto después de actualizaciones significativas de la wiki.

### `wiki search <query>`

Busca contenido de la wiki. El comportamiento depende de la configuración:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` o `raw-claim`

Usa `wiki search` para clasificación y procedencia específicas de la wiki. Para una pasada amplia de recuperación compartida, prefiere `openclaw memory search` cuando el Plugin de memoria activo expone búsqueda compartida.

Modos de búsqueda:

- `find-person`: alias, identificadores, redes sociales, IDs canónicos y páginas de personas
- `route-question`: pistas de a quién preguntar/para qué se usa mejor y contexto de relaciones
- `source-evidence`: páginas fuente y campos de evidencia estructurada
- `raw-claim`: texto de afirmación estructurada con metadatos de afirmación/evidencia

Ejemplos:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

La salida de texto incluye líneas `Claim:` y `Evidence:` cuando un resultado coincide con una afirmación estructurada. La salida JSON expone además `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` y `evidenceSourceIds` para investigación detallada del lado del agente.

### `wiki get <lookup>`

Lee una página de la wiki por id o ruta relativa.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplica mutaciones acotadas sin cirugía libre de páginas:

- `apply synthesis <title>`: crea o actualiza una página de síntesis con un cuerpo de resumen gestionado
- `apply metadata <lookup>`: actualiza metadatos en una página existente

Ambos aceptan `--source-id`, `--contradiction`, `--question` (cada uno repetible), `--confidence <n>` (0-1) y `--status <status>`. `apply metadata` también acepta `--clear-confidence` para eliminar un valor de confianza almacenado. Esta es la forma admitida de evolucionar páginas wiki para que los bloques generados gestionados permanezcan intactos.

### `wiki bridge import`

Importa artefactos de memoria públicos desde el Plugin de memoria activo a páginas fuente respaldadas por puente. Usa esto en modo `bridge` para traer los artefactos de memoria exportados más recientes a la bóveda wiki.

Para lecturas activas de artefactos de puente, la CLI enruta la importación mediante RPC del Gateway para que use el contexto del Plugin de memoria en tiempo de ejecución. Si las importaciones de puente están deshabilitadas o las lecturas de artefactos están apagadas, el comando conserva el comportamiento local/sin conexión de importación cero. La actualización del índice después de la importación está controlada por `ingest.autoCompile`.

### `wiki unsafe-local import`

Importa desde rutas locales configuradas explícitamente (`unsafeLocal.paths`) en modo `unsafe-local`. Intencionalmente experimental y solo para la misma máquina. La actualización del índice después de la importación está controlada por `ingest.autoCompile`.

### `wiki chatgpt import`

Importa una exportación de ChatGPT a páginas fuente borrador de la wiki.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Bandera           | Predeterminado | Descripción                                                  |
| ----------------- | -------------- | ------------------------------------------------------------ |
| `--export <path>` | (obligatorio)  | Directorio de exportación de ChatGPT o ruta `conversations.json`. |
| `--dry-run`       | `false`        | Previsualiza conteos de creadas/actualizadas/omitidas sin escribir páginas. |

Una importación que no es simulación y que cambia cualquier página registra un id de ejecución de importación, impreso en el resumen, necesario para revertir.

### `wiki chatgpt rollback <run-id>`

Revierte una ejecución de importación de ChatGPT aplicada anteriormente, eliminando las páginas que creó y restaurando las páginas que sobrescribió. No hace nada (e informa `alreadyRolledBack`) si la ejecución ya fue revertida.

### `wiki obsidian ...`

Comandos auxiliares de Obsidian para bóvedas que se ejecutan en modo compatible con Obsidian: `status`, `search`, `open`, `command`, `daily`. Estos requieren la CLI oficial `obsidian` en `PATH` cuando `obsidian.useOfficialCli` está habilitado.

## Guía de uso práctico

- Usa `wiki search` + `wiki get` cuando importan la procedencia y la identidad de la página.
- Usa `wiki apply` en lugar de editar a mano secciones generadas gestionadas.
- Usa `wiki lint` antes de confiar en contenido contradictorio o de baja confianza.
- Usa `wiki compile` después de importaciones masivas o cambios de fuentes cuando quieras paneles y resúmenes compilados actualizados de inmediato.
- Usa `wiki okf import` cuando un catálogo de datos, una exportación de documentación o un pipeline de enriquecimiento de agentes ya emite paquetes markdown OKF.
- Usa `wiki bridge import` cuando el modo puente depende de artefactos de memoria recién exportados.

## Integraciones de configuración

El comportamiento de `openclaw wiki` está determinado por:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulta [Plugin Memory Wiki](/es/plugins/memory-wiki) para ver el modelo de configuración completo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Memory wiki](/es/plugins/memory-wiki)
