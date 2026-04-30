---
read_when:
    - Quieres usar la CLI de memory-wiki
    - Estás documentando o cambiando `openclaw wiki`
summary: Referencia de CLI para `openclaw wiki` (estado de la bóveda de memory-wiki, búsqueda, compilación, lint, aplicación, puente y ayudantes de Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-30T05:35:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecciona y mantiene la bóveda `memory-wiki`.

Proporcionado por el Plugin `memory-wiki` incluido.

Relacionado:

- [Plugin Memory Wiki](/es/plugins/memory-wiki)
- [Descripción general de la memoria](/es/concepts/memory)
- [CLI: memory](/es/cli/memory)

## Para qué sirve

Usa `openclaw wiki` cuando quieras una bóveda de conocimiento compilada con:

- búsqueda nativa de wiki y lectura de páginas
- síntesis ricas en procedencia
- informes de contradicciones y vigencia
- importaciones puente desde el Plugin de Active Memory
- ayudantes opcionales de Obsidian CLI

## Comandos comunes

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

Úsalo primero cuando no tengas claro si la bóveda está inicializada, si el modo puente
está sano o si la integración con Obsidian está disponible.

Cuando el modo puente está activo y configurado para leer artefactos de memoria, este comando
consulta el Gateway en ejecución para que vea el mismo contexto del Plugin de Active Memory que
la memoria de agente/runtime.

### `wiki doctor`

Ejecuta comprobaciones de estado de la wiki y muestra problemas de configuración o de la bóveda.

Cuando el modo puente está activo y configurado para leer artefactos de memoria, este comando
consulta el Gateway en ejecución antes de generar el informe. Las importaciones puente deshabilitadas
y las configuraciones puente que no leen artefactos de memoria permanecen locales/sin conexión.

Los problemas típicos incluyen:

- modo puente habilitado sin artefactos de memoria públicos
- diseño de bóveda inválido o ausente
- CLI externa de Obsidian ausente cuando se espera el modo Obsidian

### `wiki init`

Crea el diseño de la bóveda wiki y las páginas iniciales.

Esto inicializa la estructura raíz, incluidos los índices de nivel superior y los directorios
de caché.

### `wiki ingest <path-or-url>`

Importa contenido en la capa de fuentes de la wiki.

Notas:

- la ingesta de URL está controlada por `ingest.allowUrlIngest`
- las páginas de origen importadas conservan la procedencia en el frontmatter
- la compilación automática puede ejecutarse después de la ingesta cuando está habilitada

### `wiki compile`

Reconstruye índices, bloques relacionados, paneles e informes resumidos compilados.

Esto escribe artefactos estables orientados a máquinas en:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` está habilitado, la compilación también actualiza las páginas de informes.

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

Usa `wiki search` cuando quieras clasificación específica de la wiki o detalles de procedencia.
Para una pasada amplia de recuerdo compartido, prefiere `openclaw memory search` cuando el
Plugin de Active Memory expone búsqueda compartida.

Los modos de búsqueda ayudan al agente a elegir la superficie correcta:

- `find-person`: alias, identificadores, redes sociales, IDs canónicos y páginas de persona
- `route-question`: indicios de a quién preguntar/para qué sirve mejor y contexto de relación
- `source-evidence`: páginas de origen y campos de evidencia estructurada
- `raw-claim`: texto de afirmación estructurada con metadatos de afirmación/evidencia

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
`evidenceSourceIds` para la profundización del lado del agente.

### `wiki get <lookup>`

Lee una página wiki por id o ruta relativa.

Ejemplos:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplica mutaciones acotadas sin cirugía libre de páginas.

Los flujos compatibles incluyen:

- crear/actualizar una página de síntesis
- actualizar metadatos de página
- adjuntar ids de origen
- añadir preguntas
- añadir contradicciones
- actualizar confianza/estado
- escribir afirmaciones estructuradas

Este comando existe para que la wiki pueda evolucionar de forma segura sin editar manualmente
bloques gestionados.

### `wiki bridge import`

Importa artefactos de memoria públicos desde el Plugin de Active Memory en páginas de origen
respaldadas por puente.

Usa esto en modo `bridge` cuando quieras incorporar a la bóveda wiki los artefactos de memoria
exportados más recientes.

Para lecturas activas de artefactos puente, la CLI enruta la importación a través de Gateway RPC
para que la importación use el contexto del Plugin de memoria de runtime. Si las importaciones puente
están deshabilitadas o las lecturas de artefactos están desactivadas, el comando mantiene el
comportamiento local/sin conexión de importación cero.

### `wiki unsafe-local import`

Importa desde rutas locales configuradas explícitamente en modo `unsafe-local`.

Esto es intencionalmente experimental y solo para la misma máquina.

### `wiki obsidian ...`

Comandos ayudantes de Obsidian para bóvedas que se ejecutan en modo compatible con Obsidian.

Subcomandos:

- `status`
- `search`
- `open`
- `command`
- `daily`

Estos requieren la CLI oficial `obsidian` en `PATH` cuando
`obsidian.useOfficialCli` está habilitado.

## Guía de uso práctico

- Usa `wiki search` + `wiki get` cuando importen la procedencia y la identidad de página.
- Usa `wiki apply` en lugar de editar a mano secciones generadas gestionadas.
- Usa `wiki lint` antes de confiar en contenido contradictorio o de baja confianza.
- Usa `wiki compile` después de importaciones masivas o cambios de fuente cuando quieras paneles
  e informes resumidos compilados actualizados de inmediato.
- Usa `wiki bridge import` cuando el modo puente dependa de artefactos de memoria exportados
  recientemente.

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
