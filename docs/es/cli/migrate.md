---
read_when:
    - Quieres migrar desde Hermes u otro sistema de agentes a OpenClaw
    - Estás añadiendo un proveedor de migración propio de un plugin
summary: Referencia de la CLI para `openclaw migrate` (importar el estado desde otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-07-11T23:00:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa el estado desde otro sistema de agentes mediante un proveedor de migración perteneciente a un plugin. Los proveedores incluidos admiten Claude, Codex CLI y [Hermes](/es/install/migrating-hermes); los plugins pueden registrar proveedores adicionales.

<Tip>
Para consultar guías orientadas al usuario, consulta [Migración desde Claude](/es/install/migrating-claude) y [Migración desde Hermes](/es/install/migrating-hermes). El [centro de migración](/es/install/migrating) enumera todas las rutas.
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

Al ejecutar `openclaw migrate <provider>` sin ninguna otra opción, se planifica y previsualiza la migración y, en una TTY, se solicita confirmación antes de aplicarla. `openclaw migrate plan <provider>` y `openclaw migrate apply <provider>` separan la previsualización y la aplicación en subcomandos distintos con las mismas opciones.

<ParamField path="<provider>" type="string">
  Nombre de un proveedor de migración registrado, por ejemplo, `hermes`. Ejecuta `openclaw migrate list` para ver los proveedores instalados.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Genera el plan y finaliza sin modificar el estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sustituye el directorio de estado de origen. El valor predeterminado de Hermes es `~/.hermes`, el de Codex es `~/.codex` (o `$CODEX_HOME`) y el de Claude es `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa las credenciales compatibles sin solicitar confirmación. La aplicación interactiva pregunta antes de importar las credenciales de autenticación detectadas, con la opción afirmativa seleccionada de forma predeterminada; el uso no interactivo de `--yes` requiere `--include-secrets` para importarlas.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Omite la importación de credenciales de autenticación, incluida la solicitud interactiva.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que la aplicación sustituya destinos existentes cuando el plan informa de conflictos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Omite la solicitud de confirmación. Es obligatorio en el modo no interactivo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecciona un elemento de copia de una Skill por su nombre o identificador de elemento. Repite la opción para migrar varias Skills. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas y las migraciones no interactivas conservan todas las Skills planificadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecciona un elemento de instalación de un plugin de Codex por el nombre del plugin o el identificador del elemento. Repite la opción para migrar varios plugins de Codex. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas de plugins nativo de Codex y las migraciones no interactivas conservan todos los plugins planificados. Solo se aplica a los plugins de Codex `openai-curated` instalados desde el origen y detectados por el inventario del servidor de aplicaciones de Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Solo para Codex. Fuerza un recorrido nuevo de `app/list` en el servidor de aplicaciones de Codex de origen antes de planificar la activación de plugins nativos. Está desactivado de forma predeterminada para mantener rápida la planificación de la migración.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Ruta o directorio del archivo de copia de seguridad previo a la migración. Se transmite a `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omite la copia de seguridad previa a la aplicación. Requiere `--force` cuando existe un estado local de OpenClaw.
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

    `openclaw migrate apply <provider>` previsualiza el plan y solicita confirmación antes de modificar el estado, salvo que se establezca `--yes`. En el modo no interactivo, la aplicación requiere `--yes`.

  </Accordion>
  <Accordion title="Copias de seguridad">
    La aplicación crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si todavía no existe ningún estado local de OpenClaw, se omite el paso de copia de seguridad y la migración continúa. Para omitir una copia de seguridad cuando existe un estado, proporciona tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflictos">
    La aplicación se niega a continuar cuando el plan contiene conflictos. Revisa el plan y vuelve a ejecutar el comando con `--overwrite` si la sustitución de los destinos existentes es intencionada. Los proveedores pueden seguir creando copias de seguridad por elemento de los archivos sobrescritos en el directorio del informe de migración.
  </Accordion>
  <Accordion title="Secretos">
    La aplicación interactiva pregunta si se deben importar las credenciales de autenticación detectadas, con la opción afirmativa seleccionada de forma predeterminada. Usa `--no-auth-credentials` para omitirlas o `--include-secrets` para importar credenciales sin supervisión junto con `--yes`.
  </Accordion>
</AccordionGroup>

## Proveedor de Claude

El proveedor de Claude incluido detecta de forma predeterminada el estado de Claude Code en `~/.claude`. Usa `--from <path>` para importar un directorio principal o una raíz de proyecto específicos de Claude Code.

<Tip>
Para consultar una guía orientada al usuario, consulta [Migración desde Claude](/es/install/migrating-claude).
</Tip>

### Qué importa Claude

- Los archivos `CLAUDE.md` y `.claude/CLAUDE.md` del proyecto al espacio de trabajo del agente de OpenClaw (`AGENTS.md`).
- El archivo `~/.claude/CLAUDE.md` del usuario, que se añade al archivo `USER.md` del espacio de trabajo.
- Las definiciones de servidores MCP del archivo `.mcp.json` del proyecto, del archivo `~/.claude.json` de Claude Code (incluidas sus entradas por proyecto) y del archivo `claude_desktop_config.json` de Claude Desktop.
- Los directorios de Skills de Claude que incluyen `SKILL.md` (`~/.claude/skills` del usuario y `.claude/skills` del proyecto).
- Los archivos Markdown de comandos de Claude (`~/.claude/commands` del usuario y `.claude/commands` del proyecto), convertidos en Skills de OpenClaw que solo permiten invocación manual.

### Estado archivado y para revisión manual

Los hooks, permisos, valores predeterminados del entorno, el archivo `CLAUDE.local.md` del proyecto, `.claude/rules`, los directorios `agents/` del usuario y del proyecto y el historial del proyecto (`projects`, `cache` y `plans` en `~/.claude`) se conservan en el informe de migración o se indican como elementos para revisión manual. OpenClaw no ejecuta hooks, no copia listas de permitidos amplias ni importa automáticamente el estado de las credenciales de OAuth o de Desktop.

## Proveedor de Codex

El proveedor de Codex incluido detecta de forma predeterminada el estado de Codex CLI en `~/.codex`, o en `CODEX_HOME` cuando esa variable de entorno está definida. Usa `--from <path>` para inventariar un directorio principal específico de Codex.

Usa este proveedor al migrar al entorno de ejecución de Codex de OpenClaw si quieres incorporar de forma deliberada recursos personales útiles de Codex CLI. Los inicios locales del servidor de aplicaciones de Codex usan un `CODEX_HOME` por agente, por lo que no leen de forma predeterminada tu directorio personal `~/.codex`. El proceso sigue heredando el valor normal de `HOME`, por lo que Codex puede ver las Skills compartidas y las entradas del mercado de plugins de `$HOME/.agents/*`, y los subprocesos pueden encontrar la configuración y los tokens del directorio principal del usuario.

Al ejecutar `openclaw migrate codex` en un terminal interactivo, primero se previsualiza el plan completo y después se abren selectores de casillas antes de la confirmación final de la aplicación. Primero se solicita seleccionar los elementos de copia de Skills. Usa `Toggle all on` o `Toggle all off` para la selección masiva. Pulsa la barra espaciadora para alternar las filas o Intro para activar la fila resaltada y continuar. Las Skills planificadas aparecen marcadas inicialmente, las Skills con conflictos aparecen desmarcadas y `Skip for now` omite las copias de Skills en esta ejecución sin dejar de continuar con la selección de plugins. Cuando hay plugins seleccionados de Codex instalados desde el origen que se pueden migrar y no se ha proporcionado `--plugin`, la migración solicita a continuación la activación de plugins nativos de Codex por nombre de plugin. Los elementos de plugins aparecen marcados inicialmente, salvo que la configuración de destino del plugin de Codex de OpenClaw ya contenga ese plugin. Los plugins de destino existentes aparecen desmarcados y muestran una indicación de conflicto como `conflict: plugin exists`; selecciona `Toggle all off` para no migrar ningún plugin nativo de Codex en esa ejecución o `Skip for now` para detenerte antes de aplicar los cambios.

Para ejecuciones automatizadas o exactas, selecciona explícitamente una o varias Skills o plugins:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Qué importa Codex

- Los directorios de Skills de Codex CLI en `$CODEX_HOME/skills`, excepto la caché `.system` de Codex.
- Las AgentSkills personales de `$HOME/.agents/skills`, copiadas en el espacio de trabajo del agente actual de OpenClaw para que pertenezcan a cada agente.
- Los plugins de Codex `openai-curated` instalados desde el origen y detectados mediante `plugin/list` del servidor de aplicaciones de Codex. La planificación lee `plugin/read` para cada plugin instalado y habilitado.

La migración de plugins respaldados por aplicaciones tiene condiciones adicionales:

- Los plugins respaldados por aplicaciones requieren que la cuenta del servidor de aplicaciones de Codex de origen sea una cuenta con suscripción a ChatGPT. Las respuestas correspondientes a cuentas que no sean de ChatGPT o a cuentas ausentes se omiten con `codex_subscription_required`.
- De forma predeterminada, la migración no llama a `app/list` en el origen, por lo que los plugins respaldados por aplicaciones que superan la comprobación de la cuenta se planifican sin verificar la accesibilidad de la aplicación de origen, y los fallos de transporte al consultar la cuenta se omiten con `codex_account_unavailable`.
- Proporciona `--verify-plugin-apps` para forzar una instantánea nueva de `app/list` en el origen y exigir que todas las aplicaciones propias estén presentes, habilitadas y accesibles antes de planificar la activación nativa. En ese modo, los fallos de transporte al consultar la cuenta dan paso a la verificación del inventario de aplicaciones de origen. La instantánea se conserva en memoria únicamente durante el proceso actual; nunca se escribe en la salida de la migración ni en la configuración de destino.

Los plugins deshabilitados, los detalles de plugins que no se pueden leer, las cuentas de origen restringidas por suscripción y, cuando se establece `--verify-plugin-apps`, las aplicaciones ausentes, deshabilitadas o inaccesibles se convierten en elementos omitidos para revisión manual con motivos tipificados, en lugar de entradas de configuración de destino. La aplicación llama a `plugin/install` del servidor de aplicaciones para cada plugin apto seleccionado, incluso si el servidor de aplicaciones de destino ya informa que ese plugin está instalado y habilitado. Los plugins de Codex migrados solo pueden usarse en sesiones que seleccionen el entorno de ejecución nativo de Codex; no se exponen a las ejecuciones de proveedores de OpenClaw, a las vinculaciones de conversaciones ACP ni a otros entornos de ejecución.

### Estado de Codex para revisión manual

El archivo `config.toml` de Codex, los hooks nativos de `hooks/hooks.json`, los mercados no seleccionados, los paquetes de plugins almacenados en caché que no sean plugins seleccionados instalados desde el origen y los plugins instalados desde el origen que no superen la comprobación de suscripción de origen no se activan automáticamente. Cuando se establece `--verify-plugin-apps`, también se omiten los plugins que no superan la comprobación del inventario de aplicaciones de origen. Todos estos elementos se copian o se indican en el informe de migración para su revisión manual.

Para los plugins seleccionados instalados desde el origen que se migren, la aplicación escribe:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- una entrada de plugin explícita con `marketplaceName: "openai-curated"` y `pluginName` por cada plugin seleccionado

La migración nunca escribe `plugins["*"]` ni almacena rutas locales de caché del mercado.

Los plugins omitidos no se escriben en la configuración de destino. Los fallos de suscripción del origen se notifican en los elementos manuales con motivos tipados: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` o `plugin_read_unavailable`. Con `--verify-plugin-apps`, los fallos del inventario de aplicaciones del origen también pueden aparecer como `app_inaccessible`, `app_disabled`, `app_missing` o `app_inventory_unavailable`. Las instalaciones del destino que requieren autenticación se notifican en el elemento del plugin afectado con `status: "skipped"`, `reason: "auth_required"` e identificadores de aplicación saneados; sus entradas de configuración explícitas se escriben deshabilitadas hasta que vuelva a autorizarlas y habilitarlas. Los demás fallos de instalación se muestran como resultados `error` asociados al elemento correspondiente.

Si el inventario de plugins del servidor de aplicaciones de Codex no está disponible durante la planificación, la migración recurre a elementos informativos almacenados en caché sobre el paquete, en lugar de hacer fallar toda la migración.

## Proveedor Hermes

El proveedor Hermes incluido detecta de forma predeterminada el estado en `~/.hermes`. Use `--from <path>` cuando Hermes se encuentre en otra ubicación.

### Qué importa Hermes

- La configuración predeterminada del modelo desde `config.yaml`.
- Los proveedores de modelos configurados y los endpoints personalizados compatibles con OpenAI desde `providers` y `custom_providers`.
- Las definiciones de servidores MCP desde `mcp_servers` o `mcp.servers`.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente de OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md`, anexados a los archivos de memoria del espacio de trabajo.
- Los valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw, además de elementos de archivo o revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyan un archivo `SKILL.md` en `skills/<name>/`.
- Los valores de configuración de cada Skill desde `skills.config`.
- Las credenciales OAuth de OpenAI de OpenCode desde el archivo `auth.json` de OpenCode cuando se acepta la migración interactiva de credenciales o cuando se establece `--include-secrets`. Las entradas OAuth del archivo `auth.json` de Hermes son un estado heredado que se notifica para volver a autenticar manualmente con OpenAI o repararlo con el doctor.
- Las claves de API y los tokens compatibles desde el archivo `.env` de Hermes y el archivo `auth.json` de OpenCode cuando se acepta la migración interactiva de credenciales o cuando se establece `--include-secrets`.

### Claves de `.env` compatibles

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Estado solo para archivo

El estado de Hermes que OpenClaw no puede interpretar de forma segura se copia en el informe de migración para su revisión manual, pero no se carga en la configuración ni en las credenciales activas de OpenClaw. Esto conserva el estado opaco o inseguro sin dar a entender que OpenClaw puede ejecutarlo o considerarlo fiable automáticamente: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Después de aplicar

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

Durante la ejecución, el plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. El núcleo se encarga de la coordinación de la CLI, la política de copias de seguridad, las solicitudes interactivas, la salida JSON y la comprobación previa de conflictos. El núcleo pasa el plan revisado a `apply(ctx, plan)` y, por compatibilidad, los proveedores solo pueden reconstruir el plan cuando ese argumento no está presente.

Los plugins de proveedor pueden usar `openclaw/plugin-sdk/migration` para crear elementos y contabilizar los resúmenes, además de `openclaw/plugin-sdk/migration-runtime` para realizar copias de archivos que tengan en cuenta los conflictos, copias de informes solo para archivo, envoltorios del entorno de ejecución de configuración almacenados en caché e informes de migración.

## Integración con la incorporación

La incorporación puede ofrecer una migración cuando un proveedor detecta un origen conocido. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` usan el mismo proveedor de migración del plugin y siguen mostrando una vista previa antes de aplicar los cambios.

<Note>
Las importaciones durante la incorporación requieren una instalación nueva de OpenClaw. Si ya tiene estado local, restablezca primero la configuración, las credenciales, las sesiones y el espacio de trabajo. Las importaciones mediante copia de seguridad y sobrescritura o mediante combinación están sujetas a una función habilitada de forma selectiva en las instalaciones existentes.
</Note>

## Contenido relacionado

- [Migración desde Hermes](/es/install/migrating-hermes): guía paso a paso para usuarios.
- [Migración desde Claude](/es/install/migrating-claude): guía paso a paso para usuarios.
- [Migración](/es/install/migrating): traslade OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación del estado después de aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
