---
read_when:
    - Quieres usar la CLI de memory-wiki
    - Estás documentando o cambiando `openclaw wiki`
summary: Referencia de la CLI para `openclaw wiki` (estado del vault de memory-wiki, búsqueda, compilación, lint, aplicación, bridge y helpers de Obsidian)
title: wiki
x-i18n:
    generated_at: "2026-04-23T14:02:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Inspecciona y mantén el vault de `memory-wiki`.

Proporcionado por el Plugin incluido `memory-wiki`.

Relacionado:

- [Plugin Memory Wiki](/es/plugins/memory-wiki)
- [Resumen de Memory](/es/concepts/memory)
- [CLI: memory](/es/cli/memory)

## Para qué sirve

Usa `openclaw wiki` cuando quieras un vault de conocimiento compilado con:

- búsqueda nativa de wiki y lectura de páginas
- síntesis con procedencia detallada
- informes de contradicciones y vigencia
- importaciones bridge desde el Plugin de memory activo
- helpers opcionales de la CLI de Obsidian

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

Inspecciona el modo actual del vault, el estado de salud y la disponibilidad de la CLI de Obsidian.

Usa esto primero cuando no tengas claro si el vault está inicializado, si el modo bridge
está en buen estado o si la integración con Obsidian está disponible.

### `wiki doctor`

Ejecuta comprobaciones de salud de la wiki y muestra problemas de configuración o del vault.

Los problemas habituales incluyen:

- modo bridge habilitado sin artefactos públicos de memory
- estructura del vault no válida o ausente
- falta de la CLI externa de Obsidian cuando se espera el modo Obsidian

### `wiki init`

Crea la estructura del vault de la wiki y las páginas iniciales.

Esto inicializa la estructura raíz, incluidos índices de nivel superior y
directorios de caché.

### `wiki ingest <path-or-url>`

Importa contenido a la capa de fuentes de la wiki.

Notas:

- la importación por URL está controlada por `ingest.allowUrlIngest`
- las páginas de origen importadas conservan la procedencia en el frontmatter
- la compilación automática puede ejecutarse después de la importación cuando está habilitada

### `wiki compile`

Reconstruye índices, bloques relacionados, paneles e informes compilados.

Esto escribe artefactos estables orientados a máquinas en:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` está habilitado, la compilación también actualiza las páginas de informes.

### `wiki lint`

Ejecuta lint sobre el vault e informa:

- problemas estructurales
- vacíos de procedencia
- contradicciones
- preguntas abiertas
- páginas/reclamaciones de baja confianza
- páginas/reclamaciones obsoletas

Ejecuta esto después de actualizaciones importantes de la wiki.

### `wiki search <query>`

Busca contenido en la wiki.

El comportamiento depende de la configuración:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`

Usa `wiki search` cuando quieras clasificación específica de la wiki o detalles de procedencia.
Para una pasada amplia única de recuperación compartida, prefiere `openclaw memory search` cuando el
Plugin de memory activo exponga búsqueda compartida.

### `wiki get <lookup>`

Lee una página de wiki por id o ruta relativa.

Ejemplos:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplica mutaciones puntuales sin cirugía libre de páginas.

Los flujos compatibles incluyen:

- crear/actualizar una página de síntesis
- actualizar metadatos de página
- adjuntar ids de origen
- añadir preguntas
- añadir contradicciones
- actualizar confianza/estado
- escribir reclamaciones estructuradas

Este comando existe para que la wiki pueda evolucionar de forma segura sin editar manualmente
bloques gestionados.

### `wiki bridge import`

Importa artefactos públicos de memory desde el Plugin de memory activo a páginas de origen
respaldadas por bridge.

Usa esto en modo `bridge` cuando quieras que los artefactos de memory exportados más recientes
se incorporen al vault de la wiki.

### `wiki unsafe-local import`

Importa desde rutas locales configuradas explícitamente en modo `unsafe-local`.

Esto es intencionalmente experimental y solo para la misma máquina.

### `wiki obsidian ...`

Comandos helper de Obsidian para vaults que se ejecutan en modo compatible con Obsidian.

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
- Usa `wiki compile` después de importaciones masivas o cambios de fuentes cuando quieras
  paneles e informes compilados actualizados de inmediato.
- Usa `wiki bridge import` cuando el modo bridge dependa de artefactos de memory recién exportados.

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
