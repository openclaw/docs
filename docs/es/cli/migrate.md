---
read_when:
    - Quieres migrar desde Hermes u otro sistema de agentes a OpenClaw
    - Estás agregando un proveedor de migración propiedad del Plugin
summary: Referencia de CLI para `openclaw migrate` (importar el estado desde otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-04-30T20:05:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa el estado desde otro sistema de agentes mediante un proveedor de migración propiedad de un plugin. Los proveedores incluidos cubren el estado de Codex CLI, [Claude](/es/install/migrating-claude) y [Hermes](/es/install/migrating-hermes); los plugins de terceros pueden registrar proveedores adicionales.

<Tip>
Para guías paso a paso orientadas al usuario, consulta [Migrar desde Claude](/es/install/migrating-claude) y [Migrar desde Hermes](/es/install/migrating-hermes). El [centro de migración](/es/install/migrating) enumera todas las rutas.
</Tip>

## Comandos

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
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
  Construye el plan y sale sin cambiar el estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sobrescribe el directorio de estado de origen. Hermes usa `~/.hermes` de forma predeterminada.
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
  Selecciona un elemento de copia de skill por nombre de skill o id de elemento. Repite la marca para migrar varios skills. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas y las migraciones no interactivas conservan todos los skills planificados.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omite la copia de seguridad previa a la aplicación. Requiere `--force` cuando existe estado local de OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obligatorio junto con `--no-backup` cuando la aplicación se negaría de otro modo a omitir la copia de seguridad.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime el plan o el resultado de la aplicación como JSON. Con `--json` y sin `--yes`, la aplicación imprime el plan y no muta el estado.
</ParamField>

## Modelo de seguridad

`openclaw migrate` prioriza la vista previa.

<AccordionGroup>
  <Accordion title="Vista previa antes de aplicar">
    El proveedor devuelve un plan detallado antes de que cambie nada, incluidos conflictos, elementos omitidos y elementos sensibles. Los planes JSON, la salida de aplicación y los informes de migración redactan claves anidadas con aspecto de secreto, como claves de API, tokens, encabezados de autorización, cookies y contraseñas.

    `openclaw migrate apply <provider>` muestra una vista previa del plan y solicita confirmación antes de cambiar el estado, salvo que se establezca `--yes`. En modo no interactivo, la aplicación requiere `--yes`.

  </Accordion>
  <Accordion title="Copias de seguridad">
    La aplicación crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si todavía no existe estado local de OpenClaw, el paso de copia de seguridad se omite y la migración puede continuar. Para omitir una copia de seguridad cuando existe estado, pasa tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflictos">
    La aplicación se niega a continuar cuando el plan tiene conflictos. Revisa el plan y luego vuelve a ejecutarlo con `--overwrite` si reemplazar destinos existentes es intencional. Los proveedores aún pueden escribir copias de seguridad a nivel de elemento para archivos sobrescritos en el directorio del informe de migración.
  </Accordion>
  <Accordion title="Secretos">
    Los secretos nunca se importan de forma predeterminada. Usa `--include-secrets` para importar credenciales compatibles.
  </Accordion>
</AccordionGroup>

## Proveedor de Claude

El proveedor de Claude incluido detecta el estado de Claude Code en `~/.claude` de forma predeterminada. Usa `--from <path>` para importar una carpeta de inicio o raíz de proyecto específica de Claude Code.

<Tip>
Para una guía paso a paso orientada al usuario, consulta [Migrar desde Claude](/es/install/migrating-claude).
</Tip>

### Qué importa Claude

- `CLAUDE.md` del proyecto y `.claude/CLAUDE.md` en el espacio de trabajo del agente de OpenClaw.
- `~/.claude/CLAUDE.md` del usuario anexado a `USER.md` del espacio de trabajo.
- Definiciones de servidor MCP desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code y `claude_desktop_config.json` de Claude Desktop.
- Directorios de skills de Claude que incluyen `SKILL.md`.
- Archivos Markdown de comandos de Claude convertidos en skills de OpenClaw solo con invocación manual.

### Archivo y estado de revisión manual

Los hooks, permisos, valores predeterminados de entorno, memoria local, reglas con alcance por ruta, subagentes, cachés, planes e historial de proyecto de Claude se conservan en el informe de migración o se informan como elementos de revisión manual. OpenClaw no ejecuta hooks, copia allowlists amplias ni importa automáticamente estado de credenciales OAuth/Desktop.

## Proveedor de Codex

El proveedor de Codex incluido detecta el estado de Codex CLI en `~/.codex` de forma predeterminada, o
en `CODEX_HOME` cuando esa variable de entorno está establecida. Usa `--from <path>` para
inventariar una carpeta de inicio específica de Codex.

Usa este proveedor al pasar al arnés de Codex de OpenClaw y cuando quieras
promocionar deliberadamente recursos personales útiles de Codex CLI. Los lanzamientos
locales del servidor de aplicaciones de Codex usan directorios `CODEX_HOME` y `HOME`
por agente, por lo que no leen tu estado personal de Codex CLI de forma predeterminada.

Ejecutar `openclaw migrate codex` en una terminal interactiva muestra una vista previa del plan
completo y luego abre un selector de casillas para los elementos de copia de skills antes de la confirmación
final de aplicación. Todos los skills empiezan seleccionados; desmarca cualquier skill que no quieras
copiar en este agente. Para ejecuciones con scripts o exactas, pasa `--skill <name>` una vez
por skill, por ejemplo:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Qué importa Codex

- Directorios de skills de Codex CLI bajo `$CODEX_HOME/skills`, excluida la caché
  `.system` de Codex.
- AgentSkills personales bajo `$HOME/.agents/skills`, copiados en el espacio de trabajo
  actual del agente de OpenClaw cuando quieres propiedad por agente.

### Estado de Codex de revisión manual

Los plugins nativos de Codex, `config.toml` y `hooks/hooks.json` nativo no se
activan automáticamente. Los plugins pueden exponer servidores MCP, apps, hooks u otro
comportamiento ejecutable, por lo que el proveedor los informa para revisión en lugar de cargarlos
en OpenClaw. Los archivos de configuración y hooks se copian en el informe de migración
para revisión manual.

## Proveedor de Hermes

El proveedor de Hermes incluido detecta el estado en `~/.hermes` de forma predeterminada. Usa `--from <path>` cuando Hermes esté en otro lugar.

### Qué importa Hermes

- Configuración de modelo predeterminada desde `config.yaml`.
- Proveedores de modelos configurados y endpoints personalizados compatibles con OpenAI desde `providers` y `custom_providers`.
- Definiciones de servidor MCP desde `mcp_servers` o `mcp.servers`.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente de OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md` anexados a los archivos de memoria del espacio de trabajo.
- Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw, además de elementos de archivo o revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyen un archivo `SKILL.md` bajo `skills/<name>/`.
- Valores de configuración por skill desde `skills.config`.
- Claves de API compatibles desde `.env`, solo con `--include-secrets`.

### Claves `.env` compatibles

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Estado solo de archivo

El estado de Hermes que OpenClaw no puede interpretar de forma segura se copia en el informe de migración para revisión manual, pero no se carga en la configuración ni en las credenciales activas de OpenClaw. Esto conserva el estado opaco o inseguro sin fingir que OpenClaw puede ejecutarlo o confiar en él automáticamente:

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

En tiempo de ejecución, el plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. El núcleo posee la orquestación de CLI, la política de copias de seguridad, los mensajes de confirmación, la salida JSON y la comprobación previa de conflictos. El núcleo pasa el plan revisado a `apply(ctx, plan)`, y los proveedores pueden reconstruir el plan solo cuando ese argumento está ausente por compatibilidad.

Los plugins de proveedor pueden usar `openclaw/plugin-sdk/migration` para la construcción de elementos y recuentos de resumen, además de `openclaw/plugin-sdk/migration-runtime` para copias de archivos con detección de conflictos, copias de informes solo de archivo, envoltorios de config-runtime en caché e informes de migración.

## Integración de onboarding

El onboarding puede ofrecer migración cuando un proveedor detecta una fuente conocida. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` usan el mismo proveedor de migración de plugin y aún muestran una vista previa antes de aplicar.

<Note>
Las importaciones de onboarding requieren una configuración nueva de OpenClaw. Restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo si ya tienes estado local. Las importaciones con copia de seguridad más sobrescritura o fusión están protegidas por feature gate para configuraciones existentes.
</Note>

## Relacionado

- [Migrar desde Hermes](/es/install/migrating-hermes): guía paso a paso orientada al usuario.
- [Migrar desde Claude](/es/install/migrating-claude): guía paso a paso orientada al usuario.
- [Migrar](/es/install/migrating): mueve OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación de estado después de aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
