---
read_when:
    - Se desea migrar desde Hermes u otro sistema de agentes a OpenClaw
    - Se está añadiendo un proveedor de migración gestionado por un plugin
summary: Referencia de la CLI para `openclaw migrate` (importar el estado desde otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-07-14T13:35:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: a4129b176ae2ca6b73eb9ddba618baccade9da19fe168db290b60e9a088b22fb
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importe el estado desde otro sistema de agentes mediante un proveedor de migración perteneciente a un plugin. Los proveedores incluidos abarcan Claude, Codex CLI y [Hermes](/es/install/migrating-hermes); los plugins pueden registrar proveedores adicionales.

<Tip>
Para obtener guías orientadas al usuario, consulte [Migración desde Claude](/es/install/migrating-claude) y [Migración desde Hermes](/es/install/migrating-hermes). El [centro de migración](/es/install/migrating) enumera todas las rutas.
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

Al ejecutar `openclaw migrate <provider>` sin otras opciones, se planifica, se muestra una vista previa y, en una TTY, se solicita confirmación antes de aplicar. `openclaw migrate plan <provider>` y `openclaw migrate apply <provider>` dividen la vista previa y la aplicación en subcomandos separados con las mismas opciones.

<ParamField path="<provider>" type="string">
  Nombre de un proveedor de migración registrado, por ejemplo, `hermes`. Ejecute `openclaw migrate list` para ver los proveedores instalados.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Cree el plan y salga sin modificar el estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sobrescriba el directorio de estado de origen. Hermes sigue `$HERMES_HOME` y el perfil activo, y después usa el valor predeterminado de la plataforma (`~/.hermes` o `%LOCALAPPDATA%\hermes`). Codex usa de forma predeterminada `~/.codex` (o `$CODEX_HOME`) y Claude, `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importe las credenciales compatibles sin solicitar confirmación. La aplicación interactiva pregunta antes de importar las credenciales de autenticación detectadas y selecciona sí de forma predeterminada; el modo no interactivo `--yes` requiere `--include-secrets` para importarlas.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Omita la importación de credenciales de autenticación, incluida la solicitud interactiva.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permita que la aplicación sustituya destinos existentes cuando el plan informe de conflictos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Omita la solicitud de confirmación. Es obligatorio en el modo no interactivo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleccione un elemento de copia de una skill por su nombre o identificador de elemento. Repita la opción para migrar varias skills. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas y las migraciones no interactivas conservan todas las skills planificadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Seleccione un elemento de instalación de un plugin de Codex por su nombre o identificador de elemento. Repita la opción para migrar varios plugins de Codex. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas nativo para plugins de Codex y las migraciones no interactivas conservan todos los plugins planificados. Solo se aplica a plugins de Codex `openai-curated` instalados desde el origen y detectados por el inventario del servidor de aplicaciones de Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Solo para Codex. Fuerza un recorrido nuevo de `app/list` en el servidor de aplicaciones de Codex de origen antes de planificar la activación de plugins nativos. Está desactivado de forma predeterminada para que la planificación de la migración sea rápida.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Ruta o directorio del archivo de copia de seguridad anterior a la migración. Se pasa directamente a `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omita la copia de seguridad previa a la aplicación. Requiere `--force` cuando existe estado local de OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Es obligatorio junto con `--no-backup` cuando, de lo contrario, la aplicación se negaría a omitir la copia de seguridad.
</ParamField>
<ParamField path="--json" type="boolean">
  Muestre el plan o el resultado de la aplicación como JSON. Con `--json` y sin `--yes`, la aplicación muestra el plan y no modifica el estado.
</ParamField>

## Modelo de seguridad

`openclaw migrate` prioriza la vista previa.

<AccordionGroup>
  <Accordion title="Vista previa antes de aplicar">
    El proveedor devuelve un plan detallado por elementos antes de que se modifique nada, incluidos los conflictos, los elementos omitidos y los elementos sensibles. Los planes JSON, la salida de la aplicación y los informes de migración ocultan las claves anidadas que parecen contener secretos, como claves de API, tokens, encabezados de autorización, cookies y contraseñas.

    `openclaw migrate apply <provider>` muestra una vista previa del plan y solicita confirmación antes de modificar el estado, salvo que se establezca `--yes`. En el modo no interactivo, la aplicación requiere `--yes`.

  </Accordion>
  <Accordion title="Copias de seguridad">
    La aplicación crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si todavía no existe estado local de OpenClaw, se omite el paso de copia de seguridad y la migración continúa. Para omitir una copia de seguridad cuando existe estado, pase tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflictos">
    La aplicación se niega a continuar cuando el plan contiene conflictos. Revise el plan y vuelva a ejecutarlo con `--overwrite` si se pretende sustituir los destinos existentes. Los proveedores aún pueden escribir copias de seguridad por elemento para los archivos sobrescritos en el directorio del informe de migración.
  </Accordion>
  <Accordion title="Secretos">
    La aplicación interactiva pregunta si se deben importar las credenciales de autenticación detectadas y selecciona sí de forma predeterminada. Use `--no-auth-credentials` para omitirlas o `--include-secrets` para importar credenciales sin supervisión con `--yes`.
  </Accordion>
</AccordionGroup>

## Proveedor de Claude

El proveedor de Claude incluido detecta de forma predeterminada el estado de Claude Code en `~/.claude`. Use `--from <path>` para importar una ubicación principal o una raíz de proyecto específicas de Claude Code.

<Tip>
Para obtener una guía orientada al usuario, consulte [Migración desde Claude](/es/install/migrating-claude).
</Tip>

### Qué importa Claude

- Markdown de memoria automática de Claude Code desde `~/.claude/projects/*/memory` y un
  `autoMemoryDirectory` configurado por el usuario, copiado en
  `memory/imports/claude-code/` para su recuperación indexada.
- `CLAUDE.md` y `.claude/CLAUDE.md` del proyecto en el espacio de trabajo del agente de OpenClaw (`AGENTS.md`).
- `~/.claude/CLAUDE.md` del usuario añadido al `USER.md` del espacio de trabajo.
- Definiciones de servidores MCP desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code (incluidas sus entradas por proyecto) y `claude_desktop_config.json` de Claude Desktop.
- Directorios de skills de Claude que incluyen `SKILL.md` (`~/.claude/skills` del usuario y `.claude/skills` del proyecto).
- Archivos Markdown de comandos de Claude (`~/.claude/commands` del usuario y `.claude/commands` del proyecto) convertidos en skills de OpenClaw únicamente con invocación manual.

### Estado archivado y para revisión manual

Los hooks, permisos, valores predeterminados del entorno, `CLAUDE.local.md` del proyecto, `.claude/rules`, los directorios `agents/` del usuario y del proyecto y el historial del proyecto (`projects`, `cache`, `plans` en `~/.claude`) de Claude se conservan en el informe de migración o se notifican como elementos para revisión manual. OpenClaw no ejecuta hooks, copia listas amplias de permisos ni importa automáticamente el estado de credenciales de OAuth/Desktop.

## Proveedor de Codex

El proveedor de Codex incluido detecta de forma predeterminada el estado de Codex CLI en `~/.codex`, o en `CODEX_HOME` cuando se establece esa variable de entorno. Use `--from <path>` para inventariar una ubicación principal específica de Codex.

Use este proveedor al migrar al entorno de ejecución de Codex de OpenClaw cuando se quieran incorporar de forma deliberada recursos personales útiles de Codex CLI. Los inicios locales del servidor de aplicaciones de Codex usan un `CODEX_HOME` por agente, por lo que no leen el `~/.codex` personal de forma predeterminada. El `HOME` normal del proceso se sigue heredando, por lo que Codex puede ver las skills y las entradas del mercado de plugins compartidas de `$HOME/.agents/*`, y los subprocesos pueden encontrar la configuración y los tokens de la ubicación principal del usuario.

Al ejecutar `openclaw migrate codex` en un terminal interactivo, se muestra una vista previa del plan completo y después se abren selectores de casillas antes de la confirmación final de la aplicación. Primero se solicitan los elementos de copia de skills. Use `Toggle all on` o `Toggle all off` para la selección masiva. Pulse Space para alternar filas o Enter para activar la fila resaltada y continuar. Las skills planificadas comienzan marcadas, las skills con conflictos comienzan desmarcadas y `Skip for now` omite las copias de skills en esta ejecución, pero continúa con la selección de plugins. Cuando hay plugins seleccionados de Codex instalados desde el origen que se pueden migrar y no se proporcionó `--plugin`, la migración solicita después la activación de plugins nativos de Codex por nombre de plugin. Los elementos de plugin comienzan marcados, salvo que la configuración de plugins de Codex de OpenClaw de destino ya contenga ese plugin. Los plugins existentes en el destino comienzan desmarcados y muestran una indicación de conflicto como `conflict: plugin exists`; elija `Toggle all off` para no migrar ningún plugin nativo de Codex en esa ejecución o `Skip for now` para detenerse antes de aplicar.

Para ejecuciones automatizadas o exactas, seleccione explícitamente una o varias skills o plugins:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Qué importa Codex

- `MEMORY.md` y `memory_summary.md` consolidados de Codex desde
  `$CODEX_HOME/memories`, copiados en `memory/imports/codex/` para su recuperación
  indexada. No se importa la memoria sin procesar de las ejecuciones.
- Directorios de skills de Codex CLI en `$CODEX_HOME/skills`, excluida la caché `.system` de Codex.
- AgentSkills personales en `$HOME/.agents/skills`, copiadas en el espacio de trabajo del agente actual de OpenClaw para que pertenezcan a ese agente.
- Plugins de Codex `openai-curated` instalados desde el origen y detectados mediante `plugin/list` del servidor de aplicaciones de Codex. La planificación lee `plugin/read` para cada plugin instalado y habilitado.

La migración de plugins respaldados por aplicaciones tiene condiciones adicionales:

- Los plugins respaldados por aplicaciones requieren que la cuenta del servidor de aplicaciones de Codex de origen sea una cuenta con suscripción a ChatGPT. Las respuestas de cuentas que no sean de ChatGPT o las respuestas sin cuenta se omiten con `codex_subscription_required`.
- De forma predeterminada, la migración no llama a `app/list` del origen, por lo que los plugins respaldados por aplicaciones que superan la condición de la cuenta se planifican sin verificar en el origen la accesibilidad de las aplicaciones, y los fallos de transporte al consultar la cuenta se omiten con `codex_account_unavailable`.
- Pase `--verify-plugin-apps` para forzar una instantánea nueva de `app/list` del origen y exigir que todas las aplicaciones asociadas estén presentes, habilitadas y accesibles antes de planificar la activación nativa. En ese modo, los fallos de transporte al consultar la cuenta dan paso a la verificación del inventario de aplicaciones de origen. La instantánea se conserva en memoria únicamente durante el proceso actual; nunca se escribe en la salida de la migración ni en la configuración de destino.

Los plugins deshabilitados, los detalles de plugins ilegibles, las cuentas de origen restringidas por suscripción y, cuando se establece `--verify-plugin-apps`, las aplicaciones ausentes, deshabilitadas o inaccesibles se convierten en elementos manuales omitidos con motivos tipificados, en lugar de entradas de configuración de destino. La aplicación llama a `plugin/install` del servidor de aplicaciones para cada plugin elegible seleccionado, aunque el servidor de aplicaciones de destino ya informe de que ese plugin está instalado y habilitado. Los plugins de Codex migrados solo se pueden usar en sesiones que seleccionen el entorno de ejecución nativo de Codex; no se exponen a ejecuciones de proveedores de OpenClaw, vinculaciones de conversaciones ACP ni otros entornos de ejecución.

### Estado de Codex para revisión manual

Codex `config.toml`, los `hooks/hooks.json` nativos, los marketplaces no seleccionados, los paquetes de plugins almacenados en caché que no sean plugins seleccionados instalados desde el código fuente y los plugins instalados desde el código fuente que no superen la comprobación de suscripción de origen no se activan automáticamente. Cuando se establece `--verify-plugin-apps`, también se omiten los plugins que no superan la comprobación del inventario de aplicaciones de origen. Todos ellos se copian o se registran en el informe de migración para su revisión manual.

Para los plugins seleccionados migrados e instalados desde el código fuente, se aplican las siguientes escrituras:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- una entrada de plugin explícita con `marketplaceName: "openai-curated"` y `pluginName` para cada plugin seleccionado

La migración nunca escribe `plugins["*"]` ni almacena rutas de caché de marketplaces locales.

Los plugins omitidos no se escriben en la configuración de destino. Los errores de suscripción del lado del origen se registran en los elementos manuales con motivos tipados: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` o `plugin_read_unavailable`. Con `--verify-plugin-apps`, los errores del inventario de aplicaciones de origen también pueden aparecer como `app_inaccessible`, `app_disabled`, `app_missing` o `app_inventory_unavailable`. Las instalaciones del lado del destino que requieren autenticación se registran en el elemento del plugin afectado con `status: "skipped"`, `reason: "auth_required"` e identificadores de aplicación depurados; sus entradas de configuración explícitas se escriben deshabilitadas hasta que se vuelvan a autorizar y habilitar. Otros errores de instalación generan resultados `error` asociados al elemento correspondiente.

Si el inventario de plugins del servidor de aplicaciones de Codex no está disponible durante la planificación, la migración recurre a elementos informativos de paquetes almacenados en caché en lugar de hacer fallar toda la migración.

## Proveedor Hermes

El proveedor Hermes incluido sigue `$HERMES_HOME` y el perfil activo, y después utiliza el valor predeterminado de la plataforma (`~/.hermes` o `%LOCALAPPDATA%\hermes`). Utilice `--from <path>` para sustituir la detección.

### Qué importa Hermes

- Configuración predeterminada del modelo desde `config.yaml`.
- Proveedores de modelos configurados y endpoints personalizados compatibles con OpenAI desde `model`, `providers` y `custom_providers`.
- Definiciones de servidores MCP desde `mcp_servers` o `mcp.servers`. Las correspondencias exactas de OpenClaw cubren el enrutamiento predeterminado mediante HTTP transmisible, el ámbito de OAuth, la verificación TLS booleana, rutas separadas para el certificado y la clave del cliente, y la política de herramientas nativas, de recursos y de prompts de Hermes. Los campos de entorno de ejecución o credenciales exclusivos de Hermes que no sean compatibles se registran para su revisión manual.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente de OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md` añadidos a los archivos de memoria del espacio de trabajo.
- Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw, además de elementos de archivo o revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyan un archivo `SKILL.md` en cualquier ubicación bajo `skills/`; las Skills anidadas se trasladan al directorio de Skills del espacio de trabajo sin conservar su jerarquía.
- Valores de configuración por Skill desde `skills.config`.
- Credenciales OAuth actuales de OpenAI Codex de Hermes y credenciales OAuth de OpenAI de OpenCode cuando se acepta la migración interactiva de credenciales o cuando se establece `--include-secrets`. No se debe permitir que Hermes y OpenClaw sigan utilizando la misma concesión de actualización importada.
- Claves de API y tokens compatibles de `.env` de Hermes y `auth.json` de OpenCode cuando se acepta la migración interactiva de credenciales o cuando se establece `--include-secrets`.

### Claves `.env` compatibles

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `KIMI_CODING_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Estado destinado únicamente al archivo

El estado de Hermes que OpenClaw no puede interpretar de forma segura se copia en el informe de migración para su revisión manual, pero no se carga en la configuración ni en las credenciales activas de OpenClaw. Esto incluye `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `plans/`, `workspace/`, `skins/`, `kanban/`, el estado de emparejamiento y de la plataforma, el estado de enrutamiento y procesos del Gateway, y las bases de datos SQLite de Hermes detectadas.

### Después de aplicar la migración

```bash
openclaw doctor
```

## Contrato del plugin

Las fuentes de migración son plugins. Un plugin declara los identificadores de sus proveedores en `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Durante la ejecución, el plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. El núcleo se encarga de la orquestación de la CLI, la política de copias de seguridad, los prompts, la salida JSON y la comprobación previa de conflictos. El núcleo pasa el plan revisado a `apply(ctx, plan)`, y los proveedores solo pueden reconstruir el plan cuando ese argumento esté ausente por motivos de compatibilidad.

Los plugins de proveedores pueden utilizar `openclaw/plugin-sdk/migration` para crear elementos y calcular recuentos de resumen, además de `openclaw/plugin-sdk/migration-runtime` para realizar copias de archivos que tengan en cuenta los conflictos, copias de informes destinadas únicamente al archivo, envoltorios de entorno de ejecución de configuración almacenados en caché e informes de migración.

## Integración con la incorporación

La incorporación puede ofrecer la migración cuando un proveedor detecta una fuente conocida. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` utilizan el mismo proveedor de migración del plugin y siguen mostrando una vista previa antes de aplicar la migración.

<Note>
Las importaciones durante la incorporación requieren una configuración nueva de OpenClaw. Si ya existe un estado local, primero se deben restablecer la configuración, las credenciales, las sesiones y el espacio de trabajo. Las importaciones mediante copia de seguridad y sobrescritura o mediante combinación están sujetas a una función para las configuraciones existentes.
</Note>

## Contenido relacionado

- [Migración desde Hermes](/es/install/migrating-hermes): guía paso a paso para usuarios.
- [Migración desde Claude](/es/install/migrating-claude): guía paso a paso para usuarios.
- [Migración](/es/install/migrating): traslado de OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación del estado después de aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
