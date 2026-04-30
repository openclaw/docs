---
read_when:
    - Vienes de Claude Code o Claude Desktop y quieres conservar las instrucciones, los servidores MCP y Skills.
    - Debes entender qué importa OpenClaw automáticamente y qué queda solo en el archivo
summary: Traslada el estado local de Claude Code y Claude Desktop a OpenClaw mediante una importación con vista previa
title: Migración desde Claude
x-i18n:
    generated_at: "2026-04-30T05:48:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importa el estado local de Claude mediante el proveedor de migración de Claude incluido. El proveedor previsualiza cada elemento antes de cambiar el estado, redacta los secretos en planes e informes, y crea una copia de seguridad verificada antes de aplicar los cambios.

<Note>
Las importaciones de incorporación requieren una instalación nueva de OpenClaw. Si ya tienes estado local de OpenClaw, restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo, o usa `openclaw migrate` directamente con `--overwrite` después de revisar el plan.
</Note>

## Dos formas de importar

<Tabs>
  <Tab title="Asistente de incorporación">
    El asistente ofrece Claude cuando detecta estado local de Claude.

    ```bash
    openclaw onboard --flow import
    ```

    O apunta a un origen específico:

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

    Agrega `--from <path>` para importar una raíz de proyecto o directorio principal de Claude Code específico.

  </Tab>
</Tabs>

## Qué se importa

<AccordionGroup>
  <Accordion title="Instrucciones y memoria">
    - El contenido de `CLAUDE.md` del proyecto y `.claude/CLAUDE.md` se copia o anexa en el `AGENTS.md` del espacio de trabajo del agente de OpenClaw.
    - El contenido de usuario de `~/.claude/CLAUDE.md` se anexa en el `USER.md` del espacio de trabajo.

  </Accordion>
  <Accordion title="Servidores MCP">
    Las definiciones de servidores MCP se importan desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code y `claude_desktop_config.json` de Claude Desktop cuando están presentes.
  </Accordion>
  <Accordion title="Skills y comandos">
    - Las Skills de Claude con un archivo `SKILL.md` se copian en el directorio de Skills del espacio de trabajo de OpenClaw.
    - Los archivos Markdown de comandos de Claude bajo `.claude/commands/` o `~/.claude/commands/` se convierten en Skills de OpenClaw con `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Qué permanece solo en el archivo

El proveedor copia estos elementos en el informe de migración para revisión manual, pero **no** los carga en la configuración activa de OpenClaw:

- Hooks de Claude
- Permisos de Claude y listas de permitidos amplias para herramientas
- Valores predeterminados de entorno de Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Subagentes de Claude bajo `.claude/agents/` o `~/.claude/agents/`
- Directorios de cachés, planes e historial de proyectos de Claude Code
- Extensiones de Claude Desktop y credenciales almacenadas por el sistema operativo

OpenClaw se niega a ejecutar hooks, confiar en listas de permisos permitidos o decodificar automáticamente estados opacos de credenciales de OAuth y Desktop. Mueve manualmente lo que necesites después de revisar el archivo.

## Selección de origen

Sin `--from`, OpenClaw inspecciona el directorio principal predeterminado de Claude Code en `~/.claude`, el archivo de estado muestreado de Claude Code `~/.claude.json` y la configuración MCP de Claude Desktop en macOS.

Cuando `--from` apunta a una raíz de proyecto, OpenClaw importa solo los archivos de Claude de ese proyecto, como `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` y `.mcp.json`. No lee tu directorio principal global de Claude durante una importación desde una raíz de proyecto.

## Flujo recomendado

<Steps>
  <Step title="Previsualizar el plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    El plan enumera todo lo que cambiará, incluidos conflictos, elementos omitidos y valores confidenciales redactados de campos MCP anidados `env` o `headers`.

  </Step>
  <Step title="Aplicar con copia de seguridad">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw crea y verifica una copia de seguridad antes de aplicar.

  </Step>
  <Step title="Ejecutar doctor">
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

    Confirma que el Gateway esté en buen estado y que tus instrucciones, servidores MCP y Skills importados estén cargados.

  </Step>
</Steps>

## Gestión de conflictos

La aplicación se niega a continuar cuando el plan informa conflictos (un archivo o valor de configuración ya existe en el destino).

<Warning>
Vuelve a ejecutar con `--overwrite` solo cuando reemplazar el destino existente sea intencional. Es posible que los proveedores todavía escriban copias de seguridad a nivel de elemento para archivos sobrescritos en el directorio del informe de migración.
</Warning>

En una instalación nueva de OpenClaw, los conflictos son poco habituales. Normalmente aparecen cuando vuelves a ejecutar la importación en una instalación que ya tiene ediciones del usuario.

## Salida JSON para automatización

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Con `--json` y sin `--yes`, la aplicación imprime el plan y no modifica el estado. Este es el modo más seguro para CI y scripts compartidos.

## Solución de problemas

<AccordionGroup>
  <Accordion title="El estado de Claude vive fuera de ~/.claude">
    Pasa `--from /actual/path` (CLI) o `--import-source /actual/path` (incorporación).
  </Accordion>
  <Accordion title="La incorporación rechaza importar en una instalación existente">
    Las importaciones de incorporación requieren una instalación nueva. Restablece el estado y vuelve a incorporar, o usa `openclaw migrate apply claude` directamente, que admite `--overwrite` y control explícito de copias de seguridad.
  </Accordion>
  <Accordion title="Los servidores MCP de Claude Desktop no se importaron">
    Claude Desktop lee `claude_desktop_config.json` desde una ruta específica de la plataforma. Apunta `--from` al directorio de ese archivo si OpenClaw no lo detectó automáticamente.
  </Accordion>
  <Accordion title="Los comandos de Claude se convirtieron en Skills con la invocación de modelo deshabilitada">
    Por diseño. Los comandos de Claude son activados por el usuario, por lo que OpenClaw los importa como Skills con `disable-model-invocation: true`. Edita el frontmatter de cada Skill si quieres que el agente las invoque automáticamente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia completa de CLI, contrato de Plugin y formas JSON.
- [Guía de migración](/es/install/migrating): todas las rutas de migración.
- [Migrar desde Hermes](/es/install/migrating-hermes): la otra ruta de importación entre sistemas.
- [Incorporación](/es/cli/onboard): flujo del asistente y flags no interactivos.
- [Doctor](/es/gateway/doctor): comprobación de estado posterior a la migración.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): dónde viven `AGENTS.md`, `USER.md` y las Skills.
