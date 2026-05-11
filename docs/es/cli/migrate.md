---
read_when:
    - Quieres migrar desde Hermes u otro sistema de agentes a OpenClaw
    - Estás agregando un proveedor de migración propiedad del Plugin
summary: Referencia de CLI para `openclaw migrate` (importar estado desde otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-05-11T20:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa el estado desde otro sistema de agentes mediante un proveedor de migración propiedad de un plugin. Los proveedores incluidos cubren el estado de Codex CLI, [Claude](/es/install/migrating-claude) y [Hermes](/es/install/migrating-hermes); los plugins de terceros pueden registrar proveedores adicionales.

<Tip>
Para guías orientadas a usuarios, consulta [Migrar desde Claude](/es/install/migrating-claude) y [Migrar desde Hermes](/es/install/migrating-hermes). El [centro de migración](/es/install/migrating) enumera todas las rutas.
</Tip>

## Comandos

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Nombre de un proveedor de migración registrado, por ejemplo `hermes`. Ejecuta `openclaw migrate list` para ver los proveedores instalados.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Crea el plan y sale sin cambiar el estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sobrescribe el directorio de estado de origen. Hermes usa `~/.hermes` de forma predeterminada.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa las credenciales compatibles. Desactivado de forma predeterminada.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que apply reemplace destinos existentes cuando el plan informa conflictos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Omite el mensaje de confirmación. Obligatorio en modo no interactivo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecciona un elemento de copia de Skill por nombre de Skill o id de elemento. Repite la marca para migrar varios Skills. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas y las migraciones no interactivas conservan todos los Skills planificados.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecciona un elemento de instalación de plugin de Codex por nombre de plugin o id de elemento. Repite la marca para migrar varios plugins de Codex. Cuando se omite, las migraciones interactivas de Codex muestran un selector nativo de casillas de plugins de Codex y las migraciones no interactivas conservan todos los plugins planificados. Esto solo se aplica a plugins de Codex `openai-curated` instalados desde el origen y descubiertos por el inventario del servidor de aplicaciones de Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omite la copia de seguridad previa a aplicar. Requiere `--force` cuando existe estado local de OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obligatorio junto con `--no-backup` cuando apply se negaría a omitir la copia de seguridad.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime el plan o el resultado de apply como JSON. Con `--json` y sin `--yes`, apply imprime el plan y no muta el estado.
</ParamField>

## Modelo de seguridad

`openclaw migrate` prioriza la vista previa.

<AccordionGroup>
  <Accordion title="Vista previa antes de aplicar">
    El proveedor devuelve un plan detallado antes de que cambie nada, incluidos conflictos, elementos omitidos y elementos sensibles. Los planes JSON, la salida de apply y los informes de migración redactan claves anidadas con apariencia de secreto, como claves de API, tokens, encabezados de autorización, cookies y contraseñas.

    `openclaw migrate apply <provider>` muestra una vista previa del plan y solicita confirmación antes de cambiar el estado, salvo que `--yes` esté definido. En modo no interactivo, apply requiere `--yes`.

  </Accordion>
  <Accordion title="Copias de seguridad">
    Apply crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si todavía no existe ningún estado local de OpenClaw, el paso de copia de seguridad se omite y la migración puede continuar. Para omitir una copia de seguridad cuando existe estado, pasa tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflictos">
    Apply se niega a continuar cuando el plan tiene conflictos. Revisa el plan y luego vuelve a ejecutarlo con `--overwrite` si reemplazar destinos existentes es intencional. Los proveedores aún pueden escribir copias de seguridad por elemento para los archivos sobrescritos en el directorio del informe de migración.
  </Accordion>
  <Accordion title="Secretos">
    Los secretos nunca se importan de forma predeterminada. Usa `--include-secrets` para importar credenciales compatibles.
  </Accordion>
</AccordionGroup>

## Proveedor Claude

El proveedor Claude incluido detecta el estado de Claude Code en `~/.claude` de forma predeterminada. Usa `--from <path>` para importar un home de Claude Code o una raíz de proyecto específicos.

<Tip>
Para una guía orientada a usuarios, consulta [Migrar desde Claude](/es/install/migrating-claude).
</Tip>

### Qué importa Claude

- `CLAUDE.md` y `.claude/CLAUDE.md` del proyecto en el espacio de trabajo del agente OpenClaw.
- `~/.claude/CLAUDE.md` de usuario anexado a `USER.md` del espacio de trabajo.
- Definiciones de servidores MCP desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code y `claude_desktop_config.json` de Claude Desktop.
- Directorios de Skills de Claude que incluyen `SKILL.md`.
- Archivos Markdown de comandos de Claude convertidos en Skills de OpenClaw solo con invocación manual.

### Estado archivado y de revisión manual

Los hooks, permisos, valores predeterminados de entorno, memoria local, reglas con alcance de ruta, subagentes, cachés, planes e historial de proyectos de Claude se conservan en el informe de migración o se informan como elementos de revisión manual. OpenClaw no ejecuta hooks, no copia listas amplias de permitidos ni importa automáticamente estado de credenciales OAuth/Desktop.

## Proveedor Codex

El proveedor Codex incluido detecta el estado de Codex CLI en `~/.codex` de forma predeterminada, o
en `CODEX_HOME` cuando esa variable de entorno está definida. Usa `--from <path>` para
inventariar un home de Codex específico.

Usa este proveedor al pasar al harness Codex de OpenClaw y cuando quieras
promover deliberadamente recursos personales útiles de Codex CLI. Los lanzamientos locales del servidor de aplicaciones de Codex
usan directorios `CODEX_HOME` y `HOME` por agente, por lo que no leen
tu estado personal de Codex CLI de forma predeterminada.

Ejecutar `openclaw migrate codex` en una terminal interactiva muestra una vista previa del
plan completo y luego abre selectores de casillas antes de la confirmación final de apply. Los elementos de
copia de Skills se solicitan primero. Usa `Toggle all on` o `Toggle all off` para selección
masiva; los Skills planificados empiezan marcados, los Skills con conflicto empiezan sin marcar y
`Skip for now` omite las copias de Skills en esta ejecución mientras continúa con la selección de
plugins. Cuando hay plugins de Codex seleccionados instalados desde el origen que son migrables y
no se proporcionó `--plugin`, la migración luego solicita la activación de plugins nativos de Codex
por nombre de plugin. Los elementos de plugin
empiezan marcados salvo que la configuración del plugin Codex de destino de OpenClaw ya tenga ese
plugin. Los plugins de destino existentes empiezan sin marcar y muestran una pista de conflicto como
`conflict: plugin exists`; elige `Toggle all off` para no migrar plugins nativos de Codex
en esa ejecución, o `Skip for now` para detenerte antes de aplicar. Para ejecuciones con scripts o
exactas, pasa `--skill <name>` una vez por Skill, por ejemplo:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Usa `--plugin <name>` para limitar la migración de plugins nativos de Codex de forma no interactiva
a uno o más plugins seleccionados instalados desde el origen:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Qué importa Codex

- Directorios de Skills de Codex CLI bajo `$CODEX_HOME/skills`, excluida la
  caché `.system` de Codex.
- AgentSkills personales bajo `$HOME/.agents/skills`, copiados en el espacio de trabajo actual
  del agente OpenClaw cuando quieres propiedad por agente.
- Plugins de Codex `openai-curated` instalados desde el origen y descubiertos mediante
  `plugin/list` del servidor de aplicaciones de Codex. Apply llama a `plugin/install` del servidor de aplicaciones para cada
  plugin seleccionado, incluso si el servidor de aplicaciones de destino ya informa que ese plugin está
  instalado y habilitado. Los plugins de Codex migrados solo se pueden usar en sesiones que
  seleccionan el harness Codex nativo; no se exponen a Pi, ejecuciones normales del proveedor
  OpenAI, vinculaciones de conversación ACP ni otros harnesses.

### Estado de Codex para revisión manual

Codex `config.toml`, `hooks/hooks.json` nativo, marketplaces no seleccionados y
paquetes de plugins en caché que no sean plugins seleccionados instalados desde el origen no se
activan automáticamente. Se copian o se informan en el informe de migración para
revisión manual.

Para plugins seleccionados instalados desde el origen migrados, apply escribe:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- una entrada explícita de plugin con `marketplaceName: "openai-curated"` y
  `pluginName` para cada plugin seleccionado

La migración nunca escribe `plugins["*"]` y nunca almacena rutas locales de caché de marketplace.
Las instalaciones que requieren autenticación se informan en el elemento de plugin afectado con
`status: "skipped"`, `reason: "auth_required"` e identificadores de aplicación saneados.
Sus entradas de configuración explícitas se escriben deshabilitadas hasta que vuelvas a autorizar y
las habilites. Otros fallos de instalación son resultados `error` con alcance de elemento.

Si el inventario de plugins del servidor de aplicaciones de Codex no está disponible durante la planificación, la migración
recurre a elementos de aviso de paquetes en caché en lugar de fallar toda la
migración.

## Proveedor Hermes

El proveedor Hermes incluido detecta el estado en `~/.hermes` de forma predeterminada. Usa `--from <path>` cuando Hermes esté en otro lugar.

### Qué importa Hermes

- Configuración de modelo predeterminada desde `config.yaml`.
- Proveedores de modelo configurados y endpoints personalizados compatibles con OpenAI desde `providers` y `custom_providers`.
- Definiciones de servidores MCP desde `mcp_servers` o `mcp.servers`.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md` anexados a los archivos de memoria del espacio de trabajo.
- Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw, además de elementos archivados o de revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyen un archivo `SKILL.md` bajo `skills/<name>/`.
- Valores de configuración por Skill desde `skills.config`.
- Claves de API compatibles desde `.env`, solo con `--include-secrets`.

### Claves `.env` compatibles

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Estado solo archivado

El estado de Hermes que OpenClaw no puede interpretar con seguridad se copia en el informe de migración para revisión manual, pero no se carga en la configuración o las credenciales activas de OpenClaw. Esto conserva estado opaco o inseguro sin fingir que OpenClaw puede ejecutarlo o confiar en él automáticamente:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Después de aplicar

```bash
openclaw doctor
```

## Contrato de Plugin

Las fuentes de migración son plugins. Un plugin declara sus ids de proveedor en `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

En tiempo de ejecución, el plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. Core posee la orquestación de CLI, la política de copias de seguridad, los mensajes, la salida JSON y la comprobación previa de conflictos. Core pasa el plan revisado a `apply(ctx, plan)`, y los proveedores pueden reconstruir el plan solo cuando ese argumento esté ausente por compatibilidad.

Los plugins proveedores pueden usar `openclaw/plugin-sdk/migration` para la construcción de elementos y recuentos de resumen, además de `openclaw/plugin-sdk/migration-runtime` para copias de archivos conscientes de conflictos, copias de informe solo archivadas, envoltorios de config-runtime en caché e informes de migración.

## Integración de incorporación

La incorporación puede ofrecer migración cuando un proveedor detecta un origen conocido. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` usan el mismo proveedor de migración de plugin y aún muestran una vista previa antes de aplicar.

<Note>
Las importaciones de incorporación requieren una configuración nueva de OpenClaw. Restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo si ya tienes estado local. Las importaciones con copia de seguridad y sobrescritura, o con combinación, están restringidas para configuraciones existentes.
</Note>

## Relacionado

- [Migrar desde Hermes](/es/install/migrating-hermes): guía para usuarios.
- [Migrar desde Claude](/es/install/migrating-claude): guía para usuarios.
- [Migración](/es/install/migrating): mover OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación de estado después de aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
