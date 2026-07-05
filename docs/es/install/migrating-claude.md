---
read_when:
    - Vienes de Claude Code o Claude Desktop y quieres conservar instrucciones, servidores MCP y Skills
    - Debes entender qué importa OpenClaw automáticamente y qué permanece solo como archivo
summary: Mover el estado local de Claude Code y Claude Desktop a OpenClaw con una importación previsualizada
title: Migrar desde Claude
x-i18n:
    generated_at: "2026-07-05T11:26:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importa el estado local de Claude mediante el proveedor de migración de Claude incluido. El proveedor muestra una vista previa de cada elemento antes de cambiar el estado, redacta los secretos en planes e informes y crea una copia de seguridad verificada antes de aplicar los cambios.

<Note>
Las importaciones durante la incorporación requieren una configuración nueva de OpenClaw. Si ya tienes estado local de OpenClaw, restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo, o usa `openclaw migrate` directamente con `--overwrite` después de revisar el plan.
</Note>

## Dos formas de importar

<Tabs>
  <Tab title="Asistente de incorporación">
    El asistente ofrece Claude cuando detecta estado local de Claude.

    ```bash
    openclaw onboard --flow import
    ```

    O apunta a una fuente específica:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Usa `openclaw migrate` para ejecuciones con scripts o repetibles. Consulta [`openclaw migrate`](/es/cli/migrate) para ver la referencia completa.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Añade `--from <path>` para importar un inicio de Claude Code o una raíz de proyecto específicos.

  </Tab>
</Tabs>

## Qué se importa

<AccordionGroup>
  <Accordion title="Instrucciones y memoria">
    - El contenido de `CLAUDE.md` y `.claude/CLAUDE.md` del proyecto se copia o se añade al `AGENTS.md` del espacio de trabajo del agente de OpenClaw.
    - El contenido de `~/.claude/CLAUDE.md` del usuario se añade al `USER.md` del espacio de trabajo.

  </Accordion>
  <Accordion title="Servidores MCP">
    Las definiciones de servidores MCP se importan desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code y `claude_desktop_config.json` de Claude Desktop cuando están presentes.
  </Accordion>
  <Accordion title="Skills y comandos">
    - Las Skills de Claude con un archivo `SKILL.md` se copian al directorio de Skills del espacio de trabajo de OpenClaw.
    - Los archivos Markdown de comandos de Claude en `.claude/commands/` o `~/.claude/commands/` se convierten en Skills de OpenClaw con `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Qué queda solo como archivo

El proveedor copia esto en el informe de migración para revisión manual, pero **no** lo carga en la configuración activa de OpenClaw:

- Hooks de Claude
- Permisos y listas de permitidos amplias de herramientas de Claude
- Valores predeterminados de entorno de Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Subagentes de Claude en `.claude/agents/` o `~/.claude/agents/`
- Cachés, planes y directorios de historial de proyectos de Claude Code
- Extensiones de Claude Desktop y credenciales almacenadas por el sistema operativo

OpenClaw se niega a ejecutar hooks, confiar en listas de permitidos de permisos o decodificar automáticamente el estado opaco de OAuth y credenciales de Desktop. Mueve manualmente lo que necesites después de revisar el archivo.

## Selección de fuente

Sin `--from`, OpenClaw inspecciona el inicio predeterminado de Claude Code en `~/.claude`, el archivo de estado muestreado de Claude Code `~/.claude.json` y la configuración MCP de Claude Desktop en macOS.

Cuando `--from` apunta a una raíz de proyecto, OpenClaw importa solo los archivos de Claude de ese proyecto, como `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` y `.mcp.json`. No lee tu inicio global de Claude durante una importación desde la raíz de un proyecto.

## Flujo recomendado

<Steps>
  <Step title="Previsualizar el plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    El plan enumera todo lo que cambiará, incluidos conflictos, elementos omitidos y valores sensibles redactados de campos MCP anidados `env` o `headers`.

  </Step>
  <Step title="Aplicar con copia de seguridad">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw crea y verifica una copia de seguridad antes de aplicar los cambios.

  </Step>
  <Step title="Ejecutar Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/es/gateway/doctor) comprueba si hay problemas de configuración o estado después de la importación.

  </Step>
  <Step title="Reiniciar y verificar">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirma que el Gateway está en buen estado y que tus instrucciones, servidores MCP y Skills importados están cargados.

  </Step>
</Steps>

## Gestión de conflictos

La aplicación se niega a continuar cuando el plan informa conflictos (un archivo o valor de configuración ya existe en el destino).

<Warning>
Vuelve a ejecutar con `--overwrite` solo cuando reemplazar el destino existente sea intencional. Los proveedores aún pueden escribir copias de seguridad por elemento para los archivos sobrescritos en el directorio del informe de migración.
</Warning>

En una instalación nueva de OpenClaw, los conflictos son inusuales. Suelen aparecer cuando vuelves a ejecutar la importación en una configuración que ya tiene ediciones del usuario.

## Salida JSON para automatización

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` es obligatorio para `migrate apply` fuera de una terminal interactiva; sin él, OpenClaw produce un error en lugar de aplicar los cambios, por lo que los scripts y CI deben pasar `--yes` explícitamente. Previsualiza primero con `--dry-run --json` y luego aplica con `--json --yes` cuando el plan parezca correcto.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El estado de Claude está fuera de ~/.claude">
    Pasa `--from /actual/path` (CLI) o `--import-source /actual/path` (incorporación).
  </Accordion>
  <Accordion title="La incorporación se niega a importar en una configuración existente">
    Las importaciones durante la incorporación requieren una configuración nueva. Restablece el estado y vuelve a incorporarte, o usa `openclaw migrate apply claude` directamente, que admite `--overwrite` y control explícito de copias de seguridad.
  </Accordion>
  <Accordion title="Los servidores MCP de Claude Desktop no se importaron">
    Claude Desktop lee `claude_desktop_config.json` desde una ruta específica de la plataforma. Apunta `--from` al directorio de ese archivo si OpenClaw no lo detectó automáticamente.
  </Accordion>
  <Accordion title="Los comandos de Claude se convirtieron en Skills con invocación de modelo deshabilitada">
    Es intencional. Los comandos de Claude los activa el usuario, por lo que OpenClaw los importa como Skills con `disable-model-invocation: true`. Edita el frontmatter de cada Skill si quieres que el agente las invoque automáticamente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia completa de la CLI, contrato del Plugin y formas JSON.
- [Guía de migración](/es/install/migrating): todas las rutas de migración.
- [Migrar desde Hermes](/es/install/migrating-hermes): la otra ruta de importación entre sistemas.
- [Incorporación](/es/cli/onboard): flujo del asistente y flags no interactivos.
- [Doctor](/es/gateway/doctor): comprobación de estado posterior a la migración.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): donde viven `AGENTS.md`, `USER.md` y las Skills.
