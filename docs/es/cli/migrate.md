---
read_when:
    - Quieres migrar desde Hermes u otro sistema de agentes a OpenClaw
    - Se está añadiendo un proveedor de migración gestionado por un plugin
summary: Referencia de la CLI para `openclaw migrate` (importar el estado desde otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-07-19T01:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdedb1bf6c9def52079c021e4e77fe008c9394ee352bec299bf154687f62e514
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa el estado desde otro sistema de agentes mediante un proveedor de migración perteneciente a un plugin. Los proveedores incluidos abarcan Claude, Codex CLI y [Hermes](/es/install/migrating-hermes); los plugins pueden registrar proveedores adicionales.

<Tip>
Para consultar guías paso a paso dirigidas al usuario, véanse [Migración desde Claude](/es/install/migrating-claude) y [Migración desde Hermes](/es/install/migrating-hermes). El [centro de migración](/es/install/migrating) enumera todas las rutas.
</Tip>

## Comandos

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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

Al ejecutar `openclaw migrate <provider>` sin otras marcas, se planifica y previsualiza la migración y, en una TTY, se solicita confirmación antes de aplicarla. `openclaw migrate plan <provider>` y `openclaw migrate apply <provider>` separan la previsualización y la aplicación en subcomandos distintos con las mismas marcas.

<ParamField path="<provider>" type="string">
  Nombre de un proveedor de migración registrado, por ejemplo `hermes`. Ejecute `openclaw migrate list` para ver los proveedores instalados.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Genera el plan y finaliza sin modificar el estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sustituye el directorio de estado de origen. Hermes sigue `$HERMES_HOME` y el perfil activo y, a continuación, utiliza el valor predeterminado de la plataforma (`~/.hermes` o `%LOCALAPPDATA%\hermes`). El valor predeterminado de Codex es `~/.codex` (o `$CODEX_HOME`) y el de Claude es `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa las credenciales compatibles sin solicitar confirmación. La aplicación interactiva pregunta antes de importar las credenciales de autenticación detectadas, con sí seleccionado de forma predeterminada; en modo no interactivo, `--yes` requiere `--include-secrets` para importarlas.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Omite la importación de credenciales de autenticación, incluida la solicitud interactiva.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que la aplicación sustituya destinos existentes cuando el plan informa de conflictos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Omite la solicitud de confirmación. Es obligatorio en modo no interactivo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecciona un elemento de copia de una habilidad por el nombre de la habilidad o el identificador del elemento. Repita la marca para migrar varias habilidades. Si se omite, las migraciones interactivas de Codex muestran un selector con casillas y las migraciones no interactivas conservan todas las habilidades planificadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecciona un elemento de instalación de plugin de Codex por el nombre del plugin o el identificador del elemento. Repita la marca para migrar varios plugins de Codex. Si se omite, las migraciones interactivas de Codex muestran un selector nativo con casillas para plugins de Codex y las migraciones no interactivas conservan todos los plugins planificados. Solo se aplica a los plugins de Codex `openai-curated` instalados desde el código fuente y detectados por el inventario del servidor de aplicaciones de Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Solo para Codex. Fuerza un nuevo recorrido `app/list` del servidor de aplicaciones de Codex de origen antes de planificar la activación nativa de plugins. Está desactivado de forma predeterminada para mantener rápida la planificación de la migración.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Ruta o directorio del archivo de copia de seguridad anterior a la migración. Se pasa directamente a `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omite la copia de seguridad anterior a la aplicación. Requiere `--force` cuando existe un estado local de OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Es obligatorio junto con `--no-backup` cuando, de otro modo, la aplicación se negaría a omitir la copia de seguridad.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime el plan o el resultado de la aplicación como JSON. Con `--json` y sin `--yes`, la aplicación imprime el plan y no modifica el estado.
</ParamField>

## Modelo de seguridad

`openclaw migrate` prioriza la previsualización.

<AccordionGroup>
  <Accordion title="Previsualización antes de aplicar">
    El proveedor devuelve un plan detallado por elementos antes de que se produzca cualquier cambio, incluidos los conflictos, los elementos omitidos y los elementos confidenciales. Los planes JSON, la salida de la aplicación y los informes de migración ocultan las claves anidadas que parecen contener secretos, como claves de API, tokens, encabezados de autorización, cookies y contraseñas.

    `openclaw migrate apply <provider>` previsualiza el plan y solicita confirmación antes de modificar el estado, salvo que se establezca `--yes`. En modo no interactivo, la aplicación requiere `--yes`.

  </Accordion>
  <Accordion title="Copias de seguridad">
    La aplicación crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si todavía no existe ningún estado local de OpenClaw, se omite el paso de copia de seguridad y la migración continúa. Para omitir una copia de seguridad cuando existe un estado, pase tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflictos">
    La aplicación se niega a continuar cuando el plan contiene conflictos. Revise el plan y vuelva a ejecutar el comando con `--overwrite` si la sustitución de los destinos existentes es intencionada. Los proveedores aún pueden escribir copias de seguridad por elemento de los archivos sobrescritos en el directorio del informe de migración.
  </Accordion>
  <Accordion title="Secretos">
    La aplicación interactiva pregunta si se deben importar las credenciales de autenticación detectadas, con sí seleccionado de forma predeterminada. Utilice `--no-auth-credentials` para omitirlas o `--include-secrets` con `--yes` para importar credenciales sin supervisión.
  </Accordion>
</AccordionGroup>

## Proveedor de Claude

El proveedor de Claude incluido detecta de forma predeterminada el estado de Claude Code en `~/.claude`. Utilice `--from <path>` para importar un directorio principal o una raíz de proyecto específicos de Claude Code.

<Tip>
Para consultar una guía paso a paso dirigida al usuario, véase [Migración desde Claude](/es/install/migrating-claude).
</Tip>

### Qué importa Claude

- Markdown de memoria automática de Claude Code procedente de `~/.claude/projects/*/memory` y de una ubicación `autoMemoryDirectory` configurada por el usuario, copiado en
  `memory/imports/claude-code/` para su recuperación indexada.
- `CLAUDE.md` y `.claude/CLAUDE.md` del proyecto en el espacio de trabajo del agente de OpenClaw (`AGENTS.md`).
- `~/.claude/CLAUDE.md` del usuario, añadido a `USER.md` del espacio de trabajo.
- Definiciones de servidores MCP procedentes de `.mcp.json` del proyecto, `~/.claude.json` de Claude Code (incluidas sus entradas por proyecto) y `claude_desktop_config.json` de Claude Desktop.
- Directorios de habilidades de Claude que incluyen `SKILL.md` (`~/.claude/skills` del usuario y `.claude/skills` del proyecto).
- Archivos Markdown de comandos de Claude (`~/.claude/commands` del usuario y `.claude/commands` del proyecto), convertidos en habilidades de OpenClaw que solo permiten la invocación manual.

### Estado archivado y de revisión manual

Los hooks, permisos y valores predeterminados del entorno de Claude, así como `CLAUDE.local.md`, `.claude/rules`, los directorios `agents/` del usuario y del proyecto y el historial del proyecto (`projects`, `cache` y `plans` en `~/.claude`), se conservan en el informe de migración o se notifican como elementos que requieren revisión manual. OpenClaw no ejecuta hooks, no copia listas amplias de elementos permitidos ni importa automáticamente el estado de credenciales de OAuth o Desktop.

## Proveedor de Codex

El proveedor de Codex incluido detecta de forma predeterminada el estado de Codex CLI en `~/.codex`, o en `CODEX_HOME` cuando se establece esa variable de entorno. Utilice `--from <path>` para inventariar un directorio principal específico de Codex.

Utilice este proveedor al migrar al entorno de ejecución de Codex de OpenClaw si desea incorporar deliberadamente recursos personales útiles de Codex CLI. Los inicios locales del servidor de aplicaciones de Codex utilizan un `CODEX_HOME` por agente, por lo que no leen de forma predeterminada su `~/.codex` personal. El proceso normal `HOME` sigue heredándose, por lo que Codex puede ver las habilidades y las entradas del mercado de plugins compartidas en `$HOME/.agents/*`, y los subprocesos pueden localizar la configuración y los tokens del directorio principal del usuario.

Al ejecutar `openclaw migrate codex` en un terminal interactivo, se previsualiza el plan completo y, a continuación, se abren selectores con casillas antes de la confirmación final de la aplicación. Primero se solicita seleccionar los elementos de copia de habilidades. Utilice `Toggle all on` o `Toggle all off` para realizar una selección masiva. Pulse la barra espaciadora para alternar las filas o Intro para activar la fila resaltada y continuar. Las habilidades planificadas comienzan seleccionadas, las habilidades en conflicto comienzan sin seleccionar y `Skip for now` omite las copias de habilidades en esta ejecución, pero continúa con la selección de plugins. Cuando existen plugins seleccionados de Codex instalados desde el código fuente que pueden migrarse y no se ha proporcionado `--plugin`, la migración solicita a continuación la activación nativa de plugins de Codex por nombre de plugin. Los elementos de plugins comienzan seleccionados, salvo que la configuración de plugins de Codex de OpenClaw de destino ya contenga ese plugin. Los plugins existentes en el destino comienzan sin seleccionar y muestran una indicación de conflicto como `conflict: plugin exists`; seleccione `Toggle all off` para no migrar ningún plugin nativo de Codex en esa ejecución o `Skip for now` para detener el proceso antes de aplicar.

Para ejecuciones mediante scripts o exactas, seleccione explícitamente una o varias habilidades o plugins:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Qué importa Codex

- `MEMORY.md` y `memory_summary.md` consolidados de Codex procedentes de
  `$CODEX_HOME/memories`, copiados en `memory/imports/codex/` para su recuperación
  indexada. No se importa la memoria sin procesar de las ejecuciones.
- Directorios de habilidades de Codex CLI en `$CODEX_HOME/skills`, sin incluir la caché `.system` de Codex.
- AgentSkills personales en `$HOME/.agents/skills`, copiados en el espacio de trabajo del agente actual de OpenClaw para que sean propiedad de cada agente.
- Plugins de Codex `openai-curated` instalados desde el código fuente y detectados mediante `plugin/list` del servidor de aplicaciones de Codex. La planificación lee `plugin/read` para cada plugin instalado y habilitado.

La migración de plugins respaldados por aplicaciones tiene comprobaciones adicionales:

- Los plugins respaldados por aplicaciones requieren que la cuenta del servidor de aplicaciones de Codex de origen sea una cuenta con suscripción a ChatGPT. Las respuestas de cuentas que no sean de ChatGPT o en las que falte la cuenta se omiten con `codex_subscription_required`.
- De forma predeterminada, la migración no llama a `app/list` en el origen, por lo que los plugins respaldados por aplicaciones que superan la comprobación de la cuenta se planifican sin verificar la accesibilidad de las aplicaciones de origen, y los fallos de transporte durante la consulta de la cuenta se omiten con `codex_account_unavailable`.
- Pase `--verify-plugin-apps` para forzar una nueva instantánea `app/list` del origen y exigir que cada aplicación propia esté presente, habilitada y accesible antes de planificar la activación nativa. En ese modo, los fallos de transporte durante la consulta de la cuenta dan paso a la verificación del inventario de aplicaciones de origen. La instantánea se conserva en memoria únicamente durante el proceso actual; nunca se escribe en la salida de la migración ni en la configuración de destino.

Los plugins deshabilitados, los detalles de plugins que no pueden leerse, las cuentas de origen restringidas por suscripción y, cuando se establece `--verify-plugin-apps`, las aplicaciones ausentes, deshabilitadas o inaccesibles se convierten en elementos manuales omitidos con motivos tipados, en lugar de entradas de configuración de destino. La aplicación llama a `plugin/install` del servidor de aplicaciones para cada plugin apto seleccionado, incluso si el servidor de aplicaciones de destino ya indica que ese plugin está instalado y habilitado. Los plugins de Codex migrados solo pueden utilizarse en sesiones que seleccionen el entorno de ejecución nativo de Codex; no se exponen a las ejecuciones de proveedores de OpenClaw, las vinculaciones de conversaciones ACP ni otros entornos de ejecución.

### Estado de Codex para revisión manual

Codex `config.toml`, `hooks/hooks.json` nativos, marketplaces no seleccionados, paquetes de plugins almacenados en caché que no son plugins seleccionados instalados desde el código fuente y plugins instalados desde el código fuente que no superan la comprobación de suscripción del código fuente no se activan automáticamente. Cuando se establece `--verify-plugin-apps`, también se omiten los plugins que no superan la comprobación de inventario de aplicaciones del código fuente. Todos ellos se copian o se incluyen en el informe de migración para su revisión manual.

Para los plugins seleccionados migrados e instalados desde el código fuente, se aplican las siguientes escrituras:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- una entrada explícita de plugin con `marketplaceName: "openai-curated"` y `pluginName` para cada plugin seleccionado

La migración nunca escribe `plugins["*"]` ni almacena rutas locales de caché de marketplaces.

Los plugins omitidos no se escriben en la configuración de destino. Los fallos de suscripción del lado del origen se indican en los elementos manuales con motivos tipificados: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` o `plugin_read_unavailable`. Con `--verify-plugin-apps`, los fallos del inventario de aplicaciones del origen también pueden aparecer como `app_inaccessible`, `app_disabled`, `app_missing` o `app_inventory_unavailable`. Las instalaciones que requieren autenticación en el lado del destino se indican en el elemento del plugin afectado con `status: "skipped"`, `reason: "auth_required"` e identificadores de aplicación depurados; sus entradas de configuración explícitas se escriben deshabilitadas hasta que se vuelvan a autorizar y habilitar. Otros fallos de instalación se presentan como resultados `error` asociados al elemento.

Si el inventario de plugins del servidor de aplicaciones de Codex no está disponible durante la planificación, la migración recurre a elementos informativos de paquetes almacenados en caché en lugar de hacer que falle toda la migración.

## Proveedor Hermes

El proveedor Hermes incluido sigue `$HERMES_HOME` y el perfil activo, y después utiliza el valor predeterminado de la plataforma (`~/.hermes` o `%LOCALAPPDATA%\hermes`). Utilice `--from <path>` para sustituir la detección.

### Qué importa Hermes

- Configuración predeterminada del modelo desde `config.yaml`.
- Proveedores de modelos configurados y endpoints personalizados compatibles con OpenAI desde `model`, `providers` y `custom_providers`.
- Definiciones de servidores MCP desde `mcp_servers` o `mcp.servers`. Las asignaciones exactas de OpenClaw abarcan el enrutamiento predeterminado de HTTP transmitible, el ámbito de OAuth, la verificación TLS booleana, las rutas separadas de certificado y clave del cliente, y la política de herramientas nativas, de recursos y de prompts de Hermes. Los campos de entorno de ejecución o credenciales exclusivos de Hermes que no sean compatibles se indican para su revisión manual.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente de OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md` anexados a los archivos de memoria del espacio de trabajo.
  En cambio, las superficies exclusivas de memoria (la página de memoria de incorporación y la página de importación de memoria de la interfaz de control)
  copian estos archivos bajo `memory/imports/hermes/` para su
  recuperación indexada sin modificar la memoria existente del espacio de trabajo.
- Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw, además de elementos de archivo o revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyan un archivo `SKILL.md` en cualquier ubicación bajo `skills/`; las Skills anidadas se consolidan en el directorio de Skills del espacio de trabajo.
- Valores de configuración por Skill desde `skills.config`.
- Credenciales OAuth actuales de OpenAI Codex de Hermes y credenciales OAuth de OpenAI de OpenCode cuando se acepta la migración interactiva de credenciales o cuando se establece `--include-secrets`. No mantenga Hermes y OpenClaw utilizando la misma concesión de actualización importada.
- Claves de API y tokens compatibles desde `.env` de Hermes y `auth.json` de OpenCode cuando se acepta la migración interactiva de credenciales o cuando se establece `--include-secrets`.

### Claves `.env` compatibles

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `KIMI_CODING_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Estado solo para archivo

El estado de Hermes que OpenClaw no puede interpretar de forma segura se copia en el informe de migración para su revisión manual, pero no se carga en la configuración ni en las credenciales activas de OpenClaw. Esto incluye `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `plans/`, `workspace/`, `skins/`, `kanban/`, el estado de emparejamiento/plataforma, el estado de enrutamiento/proceso del Gateway y las bases de datos SQLite de Hermes detectadas.

### Después de aplicar

```bash
openclaw doctor
```

## Contrato de plugins

Las fuentes de migración son plugins. Un plugin declara sus identificadores de proveedor en `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Durante la ejecución, el plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. El núcleo controla la orquestación de la CLI, la política de copias de seguridad, los prompts, la salida JSON y la comprobación previa de conflictos. El núcleo pasa el plan revisado a `apply(ctx, plan)`, y los proveedores solo pueden reconstruir el plan cuando ese argumento está ausente por motivos de compatibilidad.

Los plugins de proveedores pueden utilizar `openclaw/plugin-sdk/migration` para crear elementos y recuentos de resumen, además de `openclaw/plugin-sdk/migration-runtime` para realizar copias de archivos que tengan en cuenta los conflictos, copias de informes solo para archivo, envoltorios del entorno de ejecución de configuración almacenados en caché e informes de migración.

## Integración con la incorporación

La incorporación puede ofrecer la migración cuando un proveedor detecta un origen conocido. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` utilizan el mismo proveedor de migración del plugin y siguen mostrando una vista previa antes de aplicar los cambios.

<Note>
Las importaciones durante la incorporación requieren una instalación nueva de OpenClaw. Restablezca primero la configuración, las credenciales, las sesiones y el espacio de trabajo si ya existe un estado local. Las importaciones mediante copia de seguridad y sobrescritura o mediante fusión están sujetas a una función controlada para las instalaciones existentes.
</Note>

## Contenido relacionado

- [Migración desde Hermes](/es/install/migrating-hermes): guía paso a paso para usuarios.
- [Migración desde Claude](/es/install/migrating-claude): guía paso a paso para usuarios.
- [Migración](/es/install/migrating): trasladar OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación de estado después de aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
