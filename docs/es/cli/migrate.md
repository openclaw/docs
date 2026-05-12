---
read_when:
    - Desea migrar de Hermes u otro sistema de agentes a OpenClaw
    - Está agregando un proveedor de migración propiedad del Plugin
summary: Referencia de CLI para `openclaw migrate` (importar estado de otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-05-12T00:58:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa el estado desde otro sistema de agente mediante un proveedor de migración propiedad de un Plugin. Los proveedores incluidos cubren el estado de Codex CLI, [Claude](/es/install/migrating-claude) y [Hermes](/es/install/migrating-hermes); los plugins de terceros pueden registrar proveedores adicionales.

<Tip>
Para guías orientadas al usuario, consulta [Migración desde Claude](/es/install/migrating-claude) y [Migración desde Hermes](/es/install/migrating-hermes). El [centro de migración](/es/install/migrating) enumera todas las rutas.
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
  Compila el plan y sale sin cambiar el estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Reemplaza el directorio de estado de origen. Hermes usa `~/.hermes` de forma predeterminada.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa credenciales compatibles. Desactivado de forma predeterminada.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que la aplicación reemplace destinos existentes cuando el plan informa conflictos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Omite el mensaje de confirmación. Obligatorio en modo no interactivo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecciona un elemento de copia de Skills por nombre de skill o id de elemento. Repite la bandera para migrar varias skills. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas y las migraciones no interactivas conservan todas las skills planificadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecciona un elemento de instalación de Plugin de Codex por nombre de Plugin o id de elemento. Repite la bandera para migrar varios plugins de Codex. Cuando se omite, las migraciones interactivas de Codex muestran un selector nativo de casillas de plugins de Codex y las migraciones no interactivas conservan todos los plugins planificados. Esto solo se aplica a los plugins de Codex `openai-curated` instalados desde origen descubiertos por el inventario del app-server de Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omite la copia de seguridad previa a la aplicación. Requiere `--force` cuando existe estado local de OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obligatorio junto con `--no-backup` cuando, de otro modo, la aplicación se negaría a omitir la copia de seguridad.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime el plan o el resultado de aplicación como JSON. Con `--json` y sin `--yes`, la aplicación imprime el plan y no modifica el estado.
</ParamField>

## Modelo de seguridad

`openclaw migrate` prioriza la vista previa.

<AccordionGroup>
  <Accordion title="Preview before apply">
    El proveedor devuelve un plan detallado por elementos antes de que cambie nada, incluidos conflictos, elementos omitidos y elementos sensibles. Los planes JSON, la salida de aplicación y los informes de migración redactan claves anidadas con apariencia de secreto, como claves de API, tokens, encabezados de autorización, cookies y contraseñas.

    `openclaw migrate apply <provider>` muestra una vista previa del plan y solicita confirmación antes de cambiar el estado, a menos que `--yes` esté configurado. En modo no interactivo, la aplicación requiere `--yes`.

  </Accordion>
  <Accordion title="Backups">
    La aplicación crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si aún no existe estado local de OpenClaw, el paso de copia de seguridad se omite y la migración puede continuar. Para omitir una copia de seguridad cuando existe estado, pasa tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflicts">
    La aplicación se niega a continuar cuando el plan tiene conflictos. Revisa el plan y, después, vuelve a ejecutarlo con `--overwrite` si reemplazar destinos existentes es intencional. Los proveedores aún pueden escribir copias de seguridad por elemento para archivos sobrescritos en el directorio de informes de migración.
  </Accordion>
  <Accordion title="Secrets">
    Los secretos nunca se importan de forma predeterminada. Usa `--include-secrets` para importar credenciales compatibles.
  </Accordion>
</AccordionGroup>

## Proveedor Claude

El proveedor Claude incluido detecta el estado de Claude Code en `~/.claude` de forma predeterminada. Usa `--from <path>` para importar un inicio de Claude Code o una raíz de proyecto específicos.

<Tip>
Para una guía orientada al usuario, consulta [Migración desde Claude](/es/install/migrating-claude).
</Tip>

### Qué importa Claude

- `CLAUDE.md` del proyecto y `.claude/CLAUDE.md` en el espacio de trabajo del agente de OpenClaw.
- `~/.claude/CLAUDE.md` del usuario agregado a `USER.md` del espacio de trabajo.
- Definiciones de servidores MCP desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code y `claude_desktop_config.json` de Claude Desktop.
- Directorios de skills de Claude que incluyen `SKILL.md`.
- Archivos Markdown de comandos de Claude convertidos en Skills de OpenClaw solo con invocación manual.

### Estado archivado y de revisión manual

Los hooks, permisos, valores predeterminados de entorno, memoria local, reglas con alcance por ruta, subagentes, cachés, planes e historial de proyecto de Claude se conservan en el informe de migración o se informan como elementos de revisión manual. OpenClaw no ejecuta hooks, copia listas de permisos amplias ni importa automáticamente el estado de credenciales OAuth/Desktop.

## Proveedor Codex

El proveedor Codex incluido detecta el estado de Codex CLI en `~/.codex` de forma predeterminada, o
en `CODEX_HOME` cuando esa variable de entorno está configurada. Usa `--from <path>` para
inventariar un inicio de Codex específico.

Usa este proveedor cuando te muevas al arnés Codex de OpenClaw y quieras
promover deliberadamente recursos personales útiles de Codex CLI. Los lanzamientos locales del app-server
de Codex usan directorios `CODEX_HOME` y `HOME` por agente, así que no leen
tu estado personal de Codex CLI de forma predeterminada.

Ejecutar `openclaw migrate codex` en una terminal interactiva muestra una vista previa del plan
completo y, después, abre selectores de casillas antes de la confirmación final de aplicación. Los elementos
de copia de Skills se solicitan primero. Usa `Toggle all on` o `Toggle all off` para la selección
masiva; las skills planificadas empiezan marcadas, las skills en conflicto empiezan desmarcadas, y
`Skip for now` omite las copias de skills para esta ejecución mientras continúa con la selección de
plugins. Cuando los plugins de Codex seleccionados e instalados desde origen son migrables y
no se proporcionó `--plugin`, la migración solicita entonces la activación de plugins nativos de Codex
por nombre de Plugin. Los elementos de Plugin
empiezan marcados, a menos que la configuración del Plugin Codex de OpenClaw de destino ya tenga ese
Plugin. Los plugins de destino existentes empiezan desmarcados y muestran una pista de conflicto como
`conflict: plugin exists`; elige `Toggle all off` para no migrar plugins nativos de Codex
en esa ejecución, o `Skip for now` para detenerte antes de aplicar. Para ejecuciones exactas o
con scripts, pasa `--skill <name>` una vez por skill, por ejemplo:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Usa `--plugin <name>` para limitar la migración no interactiva de plugins nativos de Codex
a uno o más plugins seleccionados instalados desde origen:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Qué importa Codex

- Directorios de skills de Codex CLI bajo `$CODEX_HOME/skills`, excluyendo la
  caché `.system` de Codex.
- AgentSkills personales bajo `$HOME/.agents/skills`, copiados en el espacio de trabajo del agente
  de OpenClaw actual cuando quieras propiedad por agente.
- Plugins de Codex `openai-curated` instalados desde origen, descubiertos mediante
  `plugin/list` del app-server de Codex. La aplicación llama a `plugin/install` del app-server para cada
  Plugin seleccionado, incluso si el app-server de destino ya informa que ese Plugin está
  instalado y habilitado. Los plugins de Codex migrados solo son utilizables en sesiones que
  seleccionan el arnés nativo de Codex; no se exponen a Pi, ejecuciones normales del proveedor
  OpenAI, enlaces de conversaciones ACP ni otros arneses.

### Estado de Codex de revisión manual

`config.toml` de Codex, `hooks/hooks.json` nativo, marketplaces no seleccionados y
paquetes de plugins en caché que no sean plugins seleccionados instalados desde origen no se
activan automáticamente. Se copian o se informan en el informe de migración para
revisión manual.

Para plugins seleccionados instalados desde origen migrados, la aplicación escribe:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- una entrada explícita de Plugin con `marketplaceName: "openai-curated"` y
  `pluginName` para cada Plugin seleccionado

La migración nunca escribe `plugins["*"]` y nunca almacena rutas de caché de marketplace
locales. Las instalaciones que requieren autenticación se informan en el elemento de Plugin afectado con
`status: "skipped"`, `reason: "auth_required"` e identificadores de aplicación saneados.
Sus entradas de configuración explícitas se escriben deshabilitadas hasta que vuelvas a autorizar y
las habilites. Otros fallos de instalación son resultados `error` con alcance de elemento.

Si el inventario de plugins del app-server de Codex no está disponible durante la planificación, la migración
recurre a elementos de aviso de paquetes en caché en lugar de fallar toda la
migración.

## Proveedor Hermes

El proveedor Hermes incluido detecta el estado en `~/.hermes` de forma predeterminada. Usa `--from <path>` cuando Hermes esté en otro lugar.

### Qué importa Hermes

- Configuración predeterminada del modelo desde `config.yaml`.
- Proveedores de modelos configurados y endpoints compatibles con OpenAI personalizados desde `providers` y `custom_providers`.
- Definiciones de servidores MCP desde `mcp_servers` o `mcp.servers`.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente de OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md` agregados a archivos de memoria del espacio de trabajo.
- Valores predeterminados de configuración de memoria para memoria de archivos de OpenClaw, además de elementos archivados o de revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyen un archivo `SKILL.md` bajo `skills/<name>/`.
- Valores de configuración por skill desde `skills.config`.
- Claves de API compatibles desde `.env`, solo con `--include-secrets`.

### Claves `.env` compatibles

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Estado solo de archivo

El estado de Hermes que OpenClaw no puede interpretar con seguridad se copia en el informe de migración para revisión manual, pero no se carga en la configuración ni en las credenciales activas de OpenClaw. Esto conserva estado opaco o inseguro sin fingir que OpenClaw puede ejecutarlo o confiar en él automáticamente:

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

Las fuentes de migración son plugins. Un Plugin declara sus ids de proveedor en `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

En tiempo de ejecución, el Plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. Core posee la orquestación de CLI, la política de copias de seguridad, los mensajes, la salida JSON y la comprobación previa de conflictos. Core pasa el plan revisado a `apply(ctx, plan)`, y los proveedores pueden volver a compilar el plan solo cuando ese argumento no está presente por compatibilidad.

Los plugins de proveedores pueden usar `openclaw/plugin-sdk/migration` para la construcción de elementos y los conteos de resumen, además de `openclaw/plugin-sdk/migration-runtime` para copias de archivos conscientes de conflictos, copias de informes solo de archivo, envoltorios config-runtime en caché e informes de migración.

## Integración con onboarding

El onboarding puede ofrecer migración cuando un proveedor detecta una fuente conocida. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` usan el mismo proveedor de migración de Plugin y siguen mostrando una vista previa antes de aplicar.

<Note>
Las importaciones de incorporación requieren una configuración nueva de OpenClaw. Restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo si ya tienes estado local. Las importaciones con copia de seguridad y sobrescritura o con fusión están restringidas por una marca de funcionalidad para configuraciones existentes.
</Note>

## Relacionado

- [Migrar desde Hermes](/es/install/migrating-hermes): guía paso a paso orientada al usuario.
- [Migrar desde Claude](/es/install/migrating-claude): guía paso a paso orientada al usuario.
- [Migrar](/es/install/migrating): mover OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación de estado tras aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
