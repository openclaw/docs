---
read_when:
    - Vienes de Claude Code o Claude Desktop y quieres conservar las instrucciones, los servidores MCP y las Skills
    - Debes comprender qué importa OpenClaw automáticamente y qué permanece únicamente en el archivo histórico
summary: Migra el estado local de Claude Code y Claude Desktop a OpenClaw con una vista previa de la importación
title: Migración desde Claude
x-i18n:
    generated_at: "2026-07-11T23:12:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importa el estado local de Claude mediante el proveedor de migración de Claude incluido. El proveedor muestra una vista previa de cada elemento antes de modificar el estado, oculta los secretos en los planes e informes y crea una copia de seguridad verificada antes de aplicar los cambios.

<Note>
Las importaciones durante la incorporación requieren una instalación nueva de OpenClaw. Si ya tienes un estado local de OpenClaw, restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo, o usa `openclaw migrate` directamente con `--overwrite` después de revisar el plan.
</Note>

## Dos formas de importar

<Tabs>
  <Tab title="Asistente de incorporación">
    El asistente ofrece Claude cuando detecta un estado local de Claude.

    ```bash
    openclaw onboard --flow import
    ```

    También puedes indicar un origen específico:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Usa `openclaw migrate` para ejecuciones automatizadas o repetibles. Consulta [`openclaw migrate`](/es/cli/migrate) para ver la referencia completa.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Añade `--from <path>` para importar un directorio principal de Claude Code o una raíz de proyecto específicos.

  </Tab>
</Tabs>

## Qué se importa

<AccordionGroup>
  <Accordion title="Instrucciones y memoria">
    - El contenido de `CLAUDE.md` y `.claude/CLAUDE.md` del proyecto se copia o se añade al archivo `AGENTS.md` del espacio de trabajo del agente de OpenClaw.
    - El contenido de `~/.claude/CLAUDE.md` del usuario se añade al archivo `USER.md` del espacio de trabajo.

  </Accordion>
  <Accordion title="Servidores MCP">
    Las definiciones de servidores MCP se importan desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code y `claude_desktop_config.json` de Claude Desktop cuando están presentes.
  </Accordion>
  <Accordion title="Skills y comandos">
    - Las Skills de Claude que tienen un archivo `SKILL.md` se copian en el directorio de Skills del espacio de trabajo de OpenClaw.
    - Los archivos Markdown de comandos de Claude ubicados en `.claude/commands/` o `~/.claude/commands/` se convierten en Skills de OpenClaw con `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Qué permanece solo en el archivo

El proveedor copia los siguientes elementos en el informe de migración para su revisión manual, pero **no** los carga en la configuración activa de OpenClaw:

- Hooks de Claude
- Permisos de Claude y listas amplias de herramientas permitidas
- Valores predeterminados del entorno de Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Subagentes de Claude ubicados en `.claude/agents/` o `~/.claude/agents/`
- Cachés, planes y directorios del historial de proyectos de Claude Code
- Extensiones de Claude Desktop y credenciales almacenadas por el sistema operativo

OpenClaw se niega a ejecutar hooks, confiar en listas de permisos o decodificar automáticamente el estado opaco de credenciales de OAuth y Desktop. Tras revisar el archivo, mueve manualmente lo que necesites.

## Selección del origen

Sin `--from`, OpenClaw inspecciona el directorio principal predeterminado de Claude Code en `~/.claude`, el archivo de estado muestreado `~/.claude.json` de Claude Code y la configuración MCP de Claude Desktop en macOS.

Cuando `--from` apunta a la raíz de un proyecto, OpenClaw importa únicamente los archivos de Claude de ese proyecto, como `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` y `.mcp.json`. Durante una importación desde la raíz de un proyecto, no lee el directorio principal global de Claude.

## Flujo recomendado

<Steps>
  <Step title="Previsualizar el plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    El plan enumera todo lo que cambiará, incluidos los conflictos, los elementos omitidos y los valores confidenciales ocultos en los campos MCP anidados `env` o `headers`.

  </Step>
  <Step title="Aplicar con copia de seguridad">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw crea y verifica una copia de seguridad antes de aplicar los cambios.

  </Step>
  <Step title="Ejecutar el diagnóstico">
    ```bash
    openclaw doctor
    ```

    [Diagnóstico](/es/gateway/doctor) comprueba si hay problemas de configuración o estado después de la importación.

  </Step>
  <Step title="Reiniciar y verificar">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirma que el Gateway funciona correctamente y que se han cargado las instrucciones, los servidores MCP y las Skills importados.

  </Step>
</Steps>

## Gestión de conflictos

La aplicación se niega a continuar cuando el plan informa de conflictos, es decir, cuando ya existe un archivo o valor de configuración en el destino.

<Warning>
Vuelve a ejecutar el comando con `--overwrite` solo cuando quieras reemplazar deliberadamente el destino existente. Los proveedores aún pueden crear copias de seguridad individuales de los archivos sobrescritos en el directorio del informe de migración.
</Warning>

En una instalación nueva de OpenClaw, los conflictos son poco habituales. Normalmente aparecen al volver a ejecutar la importación en una instalación que ya contiene modificaciones del usuario.

## Salida JSON para automatización

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` es obligatorio para `migrate apply` fuera de una terminal interactiva; sin esta opción, OpenClaw genera un error en lugar de aplicar los cambios, por lo que los scripts y la integración continua deben pasar `--yes` explícitamente. Primero previsualiza con `--dry-run --json` y, cuando el plan sea correcto, aplica los cambios con `--json --yes`.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El estado de Claude está fuera de ~/.claude">
    Pasa `--from /actual/path` (CLI) o `--import-source /actual/path` (incorporación).
  </Accordion>
  <Accordion title="La incorporación se niega a importar en una instalación existente">
    Las importaciones durante la incorporación requieren una instalación nueva. Restablece el estado y repite la incorporación, o usa directamente `openclaw migrate apply claude`, que admite `--overwrite` y el control explícito de las copias de seguridad.
  </Accordion>
  <Accordion title="Los servidores MCP de Claude Desktop no se importaron">
    Claude Desktop lee `claude_desktop_config.json` desde una ruta específica de la plataforma. Si OpenClaw no lo detectó automáticamente, apunta `--from` al directorio de ese archivo.
  </Accordion>
  <Accordion title="Los comandos de Claude se convirtieron en Skills con la invocación por el modelo desactivada">
    Es el comportamiento previsto. Los comandos de Claude los activa el usuario, por lo que OpenClaw los importa como Skills con `disable-model-invocation: true`. Edita el frontmatter de cada Skill si quieres que el agente las invoque automáticamente.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia completa de la CLI, contrato del Plugin y estructuras JSON.
- [Guía de migración](/es/install/migrating): todas las rutas de migración.
- [Migración desde Hermes](/es/install/migrating-hermes): la otra ruta de importación entre sistemas.
- [Incorporación](/es/cli/onboard): flujo del asistente y opciones no interactivas.
- [Diagnóstico](/es/gateway/doctor): comprobación del estado después de la migración.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): ubicación de `AGENTS.md`, `USER.md` y las Skills.
