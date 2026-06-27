---
read_when:
    - Quieres usar la CLI de memory-wiki
    - Estás documentando o cambiando `openclaw wiki`
summary: Referencia de CLI para `openclaw wiki` (estado, búsqueda, compilación, lint, aplicación y puente del almacén memory-wiki, y ayudantes de Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-06-27T11:07:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecciona y mantiene la bóveda `memory-wiki`.

Proporcionado por el Plugin `memory-wiki` incluido.

Relacionado:

- [Plugin Memory Wiki](/es/plugins/memory-wiki)
- [Descripción general de la memoria](/es/concepts/memory)
- [CLI: memoria](/es/cli/memory)

## Para qué sirve

Usa `openclaw wiki` cuando quieras una bóveda de conocimiento compilada con:

- búsqueda nativa de wiki y lectura de páginas
- síntesis ricas en procedencia
- informes de contradicciones y actualización
- importaciones de puente desde el Plugin de memoria activa
- ayudantes opcionales de Obsidian CLI

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

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Comandos

### `wiki status`

Inspecciona el modo actual de la bóveda, su estado y la disponibilidad de Obsidian CLI.

Usa esto primero cuando no sepas si la bóveda está inicializada, si el modo de puente
está en buen estado o si la integración con Obsidian está disponible.

Cuando el modo de puente está activo y configurado para leer artefactos de memoria, este comando
consulta el Gateway en ejecución para ver el mismo contexto del Plugin de memoria activa que la
memoria del agente/en tiempo de ejecución.

### `wiki doctor`

Ejecuta comprobaciones de estado de la wiki y muestra problemas de configuración o de la bóveda.

Cuando el modo de puente está activo y configurado para leer artefactos de memoria, este comando
consulta el Gateway en ejecución antes de crear el informe. Las importaciones de puente
deshabilitadas y las configuraciones de puente que no leen artefactos de memoria permanecen locales/sin conexión.

Los problemas típicos incluyen:

- modo de puente habilitado sin artefactos de memoria públicos
- diseño de bóveda no válido o ausente
- CLI externa de Obsidian ausente cuando se espera el modo Obsidian

### `wiki init`

Crea el diseño de la bóveda wiki y las páginas iniciales.

Esto inicializa la estructura raíz, incluidos los índices de nivel superior y los directorios
de caché.

### `wiki ingest <path-or-url>`

Importa contenido a la capa de origen de la wiki.

Notas:

- la ingesta de URL está controlada por `ingest.allowUrlIngest`
- las páginas de origen importadas conservan la procedencia en el frontmatter
- la compilación automática puede ejecutarse después de la ingesta cuando está habilitada

### `wiki okf import <path>`

Importa un paquete Open Knowledge Format descomprimido a páginas de conceptos de la wiki.

El importador lee todos los documentos de concepto `.md` no reservados en el árbol de
directorios OKF, requiere un campo `type` no vacío y trata los valores `type` de OKF
desconocidos como conceptos genéricos. Los archivos OKF reservados `index.md` y `log.md`
no se importan como conceptos.

Las páginas importadas se aplanan bajo `concepts/` para que los flujos existentes de compilación,
búsqueda, obtención, resumen y panel de la wiki las vean de inmediato. El ID de concepto OKF
original, `type`, `resource`, `tags`, la marca de tiempo, la ruta de origen y el
frontmatter completo se conservan en el frontmatter de la página. Los enlaces markdown internos de OKF
se reescriben a las páginas wiki generadas; los enlaces rotos o externos se dejan
sin cambios.

Ejemplos:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Reconstruye índices, bloques relacionados, paneles y resúmenes compilados.

Esto escribe artefactos estables orientados a máquina bajo:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` está habilitado, la compilación también actualiza las páginas de informe.

### `wiki lint`

Analiza la bóveda e informa:

- problemas estructurales
- brechas de procedencia
- contradicciones
- preguntas abiertas
- páginas/afirmaciones de baja confianza
- páginas/afirmaciones obsoletas

Ejecuta esto después de actualizaciones significativas de la wiki.

### `wiki search <query>`

Busca contenido de la wiki.

El comportamiento depende de la configuración:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` o
  `raw-claim`

Usa `wiki search` cuando quieras una clasificación específica de la wiki o detalles de procedencia.
Para una pasada amplia de recuperación compartida, prefiere `openclaw memory search` cuando el
Plugin de memoria activa exponga la búsqueda compartida.

Los modos de búsqueda ayudan al agente a elegir la superficie correcta:

- `find-person`: alias, identificadores, redes sociales, ID canónicos y páginas de personas
- `route-question`: pistas de a quién preguntar/para qué se usa mejor y contexto de relaciones
- `source-evidence`: páginas de origen y campos de evidencia estructurados
- `raw-claim`: texto de afirmación estructurado con metadatos de afirmación/evidencia

Ejemplos:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

La salida de texto incluye líneas `Claim:` y `Evidence:` cuando un resultado coincide con una
afirmación estructurada. La salida JSON además expone `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` y
`evidenceSourceIds` para el análisis detallado del lado del agente.

### `wiki get <lookup>`

Lee una página wiki por ID o ruta relativa.

Ejemplos:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplica mutaciones acotadas sin cirugía libre de páginas.

Los flujos admitidos incluyen:

- crear/actualizar una página de síntesis
- actualizar metadatos de página
- adjuntar ID de origen
- agregar preguntas
- agregar contradicciones
- actualizar confianza/estado
- escribir afirmaciones estructuradas

Este comando existe para que la wiki pueda evolucionar de forma segura sin editar manualmente
bloques administrados.

### `wiki bridge import`

Importa artefactos públicos de memoria desde el Plugin de memoria activa a páginas de origen
respaldadas por puente.

Usa esto en modo `bridge` cuando quieras llevar a la bóveda wiki los artefactos de memoria
exportados más recientes.

Para lecturas activas de artefactos de puente, la CLI enruta la importación mediante RPC de Gateway
para que la importación use el contexto del Plugin de memoria en tiempo de ejecución. Si las importaciones de puente están
deshabilitadas o las lecturas de artefactos están apagadas, el comando conserva el comportamiento
local/sin conexión de importación cero.

### `wiki unsafe-local import`

Importa desde rutas locales configuradas explícitamente en modo `unsafe-local`.

Esto es intencionalmente experimental y solo para la misma máquina.

### `wiki obsidian ...`

Comandos auxiliares de Obsidian para bóvedas que se ejecutan en modo compatible con Obsidian.

Subcomandos:

- `status`
- `search`
- `open`
- `command`
- `daily`

Estos requieren la CLI oficial `obsidian` en `PATH` cuando
`obsidian.useOfficialCli` está habilitado.

## Guía de uso práctico

- Usa `wiki search` + `wiki get` cuando importen la procedencia y la identidad de la página.
- Usa `wiki apply` en lugar de editar a mano secciones generadas administradas.
- Usa `wiki lint` antes de confiar en contenido contradictorio o de baja confianza.
- Usa `wiki compile` después de importaciones masivas o cambios de origen cuando quieras paneles
  y resúmenes compilados nuevos de inmediato.
- Usa `wiki okf import` cuando un catálogo de datos, una exportación de documentación o un proceso
  de enriquecimiento de agente ya emita paquetes markdown OKF.
- Usa `wiki bridge import` cuando el modo de puente dependa de artefactos de memoria recién
  exportados.

## Vínculos de configuración

El comportamiento de `openclaw wiki` está determinado por:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulta [Plugin Memory Wiki](/es/plugins/memory-wiki) para ver el modelo de configuración completo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Wiki de memoria](/es/plugins/memory-wiki)
