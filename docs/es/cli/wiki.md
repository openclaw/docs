---
read_when:
    - Quieres usar la CLI de memory-wiki
    - Estás documentando o cambiando `openclaw wiki`
summary: Referencia de CLI para `openclaw wiki` (estado del almacén memory-wiki, búsqueda, compilación, lint, aplicación, puente y ayudantes de Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-24T05:24:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Inspecciona y mantiene el almacén `memory-wiki`.

Lo proporciona el Plugin integrado `memory-wiki`.

Relacionado:

- [Plugin Memory Wiki](/es/plugins/memory-wiki)
- [Descripción general de Memory](/es/concepts/memory)
- [CLI: memory](/es/cli/memory)

## Para qué sirve

Usa `openclaw wiki` cuando quieras un almacén de conocimiento compilado con:

- búsqueda nativa de wiki y lectura de páginas
- síntesis ricas en procedencia
- informes de contradicción y vigencia
- importaciones puente desde el Plugin de memoria activo
- ayudantes opcionales de la CLI de Obsidian

## Comandos comunes

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
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

Inspecciona el modo actual del almacén, el estado y la disponibilidad de la CLI de Obsidian.

Úsalo primero cuando no estés seguro de si el almacén está inicializado, si el modo puente
está en buen estado o si la integración con Obsidian está disponible.

### `wiki doctor`

Ejecuta comprobaciones de estado de la wiki y muestra problemas de configuración o del almacén.

Los problemas típicos incluyen:

- modo puente habilitado sin artefactos públicos de memoria
- diseño del almacén no válido o ausente
- falta de la CLI externa de Obsidian cuando se espera el modo Obsidian

### `wiki init`

Crea el diseño del almacén wiki y las páginas iniciales.

Esto inicializa la estructura raíz, incluidos los índices de nivel superior y los directorios
de caché.

### `wiki ingest <path-or-url>`

Importa contenido a la capa de origen de la wiki.

Notas:

- la importación de URL está controlada por `ingest.allowUrlIngest`
- las páginas de origen importadas mantienen la procedencia en el frontmatter
- la compilación automática puede ejecutarse después de la importación cuando está habilitada

### `wiki compile`

Reconstruye índices, bloques relacionados, paneles y resúmenes compilados.

Esto escribe artefactos estables orientados a máquina en:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` está habilitado, la compilación también actualiza las páginas de informes.

### `wiki lint`

Ejecuta lint en el almacén e informa sobre:

- problemas estructurales
- vacíos de procedencia
- contradicciones
- preguntas abiertas
- páginas/reclamaciones de baja confianza
- páginas/reclamaciones desactualizadas

Ejecuta esto después de actualizaciones significativas de la wiki.

### `wiki search <query>`

Busca contenido de la wiki.

El comportamiento depende de la configuración:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`

Usa `wiki search` cuando quieras clasificación específica de la wiki o detalles de procedencia.
Para una única pasada amplia de recuperación compartida, prefiere `openclaw memory search` cuando el
Plugin de memoria activo exponga búsqueda compartida.

### `wiki get <lookup>`

Lee una página wiki por ID o ruta relativa.

Ejemplos:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplica mutaciones específicas sin edición libre de páginas.

Los flujos compatibles incluyen:

- crear/actualizar una página de síntesis
- actualizar metadatos de la página
- adjuntar IDs de origen
- añadir preguntas
- añadir contradicciones
- actualizar confianza/estado
- escribir reclamaciones estructuradas

Este comando existe para que la wiki pueda evolucionar de forma segura sin editar manualmente
bloques gestionados.

### `wiki bridge import`

Importa artefactos públicos de memoria desde el Plugin de memoria activo a páginas de
origen respaldadas por puente.

Úsalo en modo `bridge` cuando quieras incorporar en el almacén wiki los artefactos de memoria
exportados más recientes.

### `wiki unsafe-local import`

Importa desde rutas locales configuradas explícitamente en modo `unsafe-local`.

Esto es intencionalmente experimental y solo para la misma máquina.

### `wiki obsidian ...`

Comandos auxiliares de Obsidian para almacenes que se ejecutan en modo compatible con Obsidian.

Subcomandos:

- `status`
- `search`
- `open`
- `command`
- `daily`

Estos requieren la CLI oficial `obsidian` en `PATH` cuando
`obsidian.useOfficialCli` está habilitado.

## Guía práctica de uso

- Usa `wiki search` + `wiki get` cuando importen la procedencia y la identidad de la página.
- Usa `wiki apply` en lugar de editar manualmente secciones generadas gestionadas.
- Usa `wiki lint` antes de confiar en contenido contradictorio o de baja confianza.
- Usa `wiki compile` después de importaciones masivas o cambios de origen cuando quieras paneles
  y resúmenes compilados actualizados de inmediato.
- Usa `wiki bridge import` cuando el modo puente dependa de artefactos de memoria
  recién exportados.

## Relación con la configuración

El comportamiento de `openclaw wiki` está determinado por:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulta [Plugin Memory Wiki](/es/plugins/memory-wiki) para ver el modelo completo de configuración.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Memory wiki](/es/plugins/memory-wiki)
