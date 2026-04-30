---
read_when:
    - Quieres migrar de Hermes u otro sistema de agentes a OpenClaw
    - Estás agregando un proveedor de migración propiedad del Plugin
summary: Referencia de la CLI para `openclaw migrate` (importar estado desde otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-04-30T05:34:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa el estado desde otro sistema de agente mediante un proveedor de migración propiedad de un Plugin. Los proveedores incluidos cubren [Claude](/es/install/migrating-claude) y [Hermes](/es/install/migrating-hermes); los plugins de terceros pueden registrar proveedores adicionales.

<Tip>
Para guías paso a paso orientadas al usuario, consulta [Migrar desde Claude](/es/install/migrating-claude) y [Migrar desde Hermes](/es/install/migrating-hermes). El [centro de migración](/es/install/migrating) enumera todas las rutas.
</Tip>

## Comandos

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  Anula el directorio de estado de origen. Hermes usa `~/.hermes` de forma predeterminada.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa credenciales compatibles. Desactivado de forma predeterminada.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que la aplicación sustituya destinos existentes cuando el plan informa conflictos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Omite la solicitud de confirmación. Obligatorio en modo no interactivo.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omite la copia de seguridad previa a la aplicación. Requiere `--force` cuando existe estado local de OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obligatorio junto con `--no-backup` cuando la aplicación de otro modo se negaría a omitir la copia de seguridad.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime el plan o el resultado de la aplicación como JSON. Con `--json` y sin `--yes`, apply imprime el plan y no modifica el estado.
</ParamField>

## Modelo de seguridad

`openclaw migrate` prioriza la vista previa.

<AccordionGroup>
  <Accordion title="Vista previa antes de aplicar">
    El proveedor devuelve un plan detallado antes de que cambie nada, incluidos conflictos, elementos omitidos y elementos sensibles. Los planes JSON, la salida de aplicación y los informes de migración redactan claves anidadas con apariencia de secreto, como claves de API, tokens, encabezados de autorización, cookies y contraseñas.

    `openclaw migrate apply <provider>` muestra una vista previa del plan y solicita confirmación antes de cambiar el estado, salvo que se establezca `--yes`. En modo no interactivo, apply requiere `--yes`.

  </Accordion>
  <Accordion title="Copias de seguridad">
    Apply crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si aún no existe estado local de OpenClaw, se omite el paso de copia de seguridad y la migración puede continuar. Para omitir una copia de seguridad cuando existe estado, pasa tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflictos">
    Apply se niega a continuar cuando el plan tiene conflictos. Revisa el plan y luego vuelve a ejecutarlo con `--overwrite` si sustituir destinos existentes es intencional. Los proveedores aún pueden escribir copias de seguridad a nivel de elemento para archivos sobrescritos en el directorio del informe de migración.
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
- `~/.claude/CLAUDE.md` del usuario agregado a `USER.md` del espacio de trabajo.
- Definiciones de servidor MCP desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code y `claude_desktop_config.json` de Claude Desktop.
- Directorios de Skills de Claude que incluyen `SKILL.md`.
- Archivos Markdown de comandos de Claude convertidos en Skills de OpenClaw solo con invocación manual.

### Estado de archivo y revisión manual

Los hooks, permisos, valores predeterminados de entorno, memoria local, reglas con alcance por ruta, subagentes, cachés, planes e historial de proyecto de Claude se conservan en el informe de migración o se informan como elementos de revisión manual. OpenClaw no ejecuta hooks, no copia listas amplias de permisos ni importa automáticamente el estado de credenciales OAuth/Desktop.

## Proveedor de Hermes

El proveedor de Hermes incluido detecta el estado en `~/.hermes` de forma predeterminada. Usa `--from <path>` cuando Hermes esté en otro lugar.

### Qué importa Hermes

- Configuración de modelo predeterminada desde `config.yaml`.
- Proveedores de modelo configurados y endpoints personalizados compatibles con OpenAI desde `providers` y `custom_providers`.
- Definiciones de servidor MCP desde `mcp_servers` o `mcp.servers`.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente de OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md` agregados a los archivos de memoria del espacio de trabajo.
- Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw, además de elementos archivados o de revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyen un archivo `SKILL.md` bajo `skills/<name>/`.
- Valores de configuración por Skill desde `skills.config`.
- Claves de API compatibles desde `.env`, solo con `--include-secrets`.

### Claves `.env` compatibles

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Estado solo archivado

El estado de Hermes que OpenClaw no puede interpretar con seguridad se copia en el informe de migración para revisión manual, pero no se carga en la configuración ni en las credenciales activas de OpenClaw. Esto conserva el estado opaco o inseguro sin fingir que OpenClaw puede ejecutarlo o confiar en él automáticamente:

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

En tiempo de ejecución, el plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. Core es responsable de la orquestación de la CLI, la política de copias de seguridad, las solicitudes de confirmación, la salida JSON y la comprobación previa de conflictos. Core pasa el plan revisado a `apply(ctx, plan)`, y los proveedores pueden reconstruir el plan solo cuando ese argumento esté ausente por compatibilidad.

Los plugins de proveedor pueden usar `openclaw/plugin-sdk/migration` para la construcción de elementos y conteos de resumen, además de `openclaw/plugin-sdk/migration-runtime` para copias de archivos conscientes de conflictos, copias de informes solo archivadas, envoltorios de runtime de configuración en caché e informes de migración.

## Integración de incorporación

La incorporación puede ofrecer migración cuando un proveedor detecta una fuente conocida. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` usan el mismo proveedor de migración de plugin y siguen mostrando una vista previa antes de aplicar.

<Note>
Las importaciones de incorporación requieren una configuración nueva de OpenClaw. Restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo si ya tienes estado local. Las importaciones con copia de seguridad más sobrescritura o fusión están protegidas por feature gate para configuraciones existentes.
</Note>

## Relacionado

- [Migrar desde Hermes](/es/install/migrating-hermes): guía paso a paso orientada al usuario.
- [Migrar desde Claude](/es/install/migrating-claude): guía paso a paso orientada al usuario.
- [Migrar](/es/install/migrating): mueve OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación de estado después de aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
