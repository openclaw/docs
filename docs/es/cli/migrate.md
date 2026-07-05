---
read_when:
    - Quieres migrar de Hermes u otro sistema de agentes a OpenClaw
    - Estás agregando un proveedor de migración propiedad del plugin
summary: Referencia de la CLI para `openclaw migrate` (importar estado desde otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-07-05T11:08:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa el estado desde otro sistema de agentes mediante un proveedor de migración propiedad de un plugin. Los proveedores incluidos cubren Claude, Codex CLI y [Hermes](/es/install/migrating-hermes); los plugins pueden registrar proveedores adicionales.

<Tip>
Para guías paso a paso orientadas al usuario, consulta [Migrar desde Claude](/es/install/migrating-claude) y [Migrar desde Hermes](/es/install/migrating-hermes). El [centro de migración](/es/install/migrating) enumera todas las rutas.
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

Ejecutar `openclaw migrate <provider>` sin otras marcas planifica, previsualiza y (en una TTY) solicita confirmación antes de aplicar. `openclaw migrate plan <provider>` y `openclaw migrate apply <provider>` separan la previsualización y la aplicación en subcomandos distintos con las mismas marcas.

<ParamField path="<provider>" type="string">
  Nombre de un proveedor de migración registrado, por ejemplo `hermes`. Ejecuta `openclaw migrate list` para ver los proveedores instalados.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Crea el plan y sale sin cambiar el estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sobrescribe el directorio de estado de origen. Hermes usa `~/.hermes` por defecto, Codex usa `~/.codex` (o `$CODEX_HOME`) y Claude usa `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa credenciales compatibles sin preguntar. La aplicación interactiva pregunta antes de importar credenciales de autenticación detectadas, con sí seleccionado de forma predeterminada; `--yes` no interactivo requiere `--include-secrets` para importarlas.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Omite la importación de credenciales de autenticación, incluida la solicitud interactiva.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que apply reemplace destinos existentes cuando el plan informa conflictos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Omite la solicitud de confirmación. Obligatorio en modo no interactivo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecciona un elemento de copia de skill por nombre de skill o id de elemento. Repite la marca para migrar varias skills. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas y las migraciones no interactivas conservan todas las skills planificadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecciona un elemento de instalación de plugin de Codex por nombre de plugin o id de elemento. Repite la marca para migrar varios plugins de Codex. Cuando se omite, las migraciones interactivas de Codex muestran un selector nativo de casillas de plugins de Codex y las migraciones no interactivas conservan todos los plugins planificados. Se aplica solo a plugins de Codex `openai-curated` instalados en el origen y descubiertos por el inventario del app-server de Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Solo Codex. Fuerza un recorrido nuevo de `app/list` del app-server de Codex de origen antes de planificar la activación de plugins nativos. Desactivado de forma predeterminada para mantener rápida la planificación de la migración.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Ruta o directorio del archivo de copia de seguridad previo a la migración. Se pasa a `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omite la copia de seguridad previa a la aplicación. Requiere `--force` cuando existe estado local de OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obligatorio junto con `--no-backup` cuando apply de otro modo rechazaría omitir la copia de seguridad.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime el plan o el resultado de apply como JSON. Con `--json` y sin `--yes`, apply imprime el plan y no muta el estado.
</ParamField>

## Modelo de seguridad

`openclaw migrate` prioriza la previsualización.

<AccordionGroup>
  <Accordion title="Preview before apply">
    El proveedor devuelve un plan detallado por elementos antes de que nada cambie, incluidos conflictos, elementos omitidos y elementos sensibles. Los planes JSON, la salida de apply y los informes de migración redactan claves anidadas que parecen secretas, como claves de API, tokens, encabezados de autorización, cookies y contraseñas.

    `openclaw migrate apply <provider>` previsualiza el plan y solicita confirmación antes de cambiar el estado, salvo que `--yes` esté establecido. En modo no interactivo, apply requiere `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Apply crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si aún no existe estado local de OpenClaw, el paso de copia de seguridad se omite y la migración continúa. Para omitir una copia de seguridad cuando existe estado, pasa tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflicts">
    Apply se niega a continuar cuando el plan tiene conflictos. Revisa el plan y luego vuelve a ejecutarlo con `--overwrite` si reemplazar destinos existentes es intencional. Los proveedores aún pueden escribir copias de seguridad a nivel de elemento para archivos sobrescritos en el directorio del informe de migración.
  </Accordion>
  <Accordion title="Secrets">
    Apply interactivo pregunta si importar credenciales de autenticación detectadas, con sí seleccionado de forma predeterminada. Usa `--no-auth-credentials` para omitirlas, o `--include-secrets` para la importación de credenciales desatendida con `--yes`.
  </Accordion>
</AccordionGroup>

## Proveedor de Claude

El proveedor de Claude incluido detecta el estado de Claude Code en `~/.claude` de forma predeterminada. Usa `--from <path>` para importar un directorio personal o una raíz de proyecto de Claude Code específicos.

<Tip>
Para una guía paso a paso orientada al usuario, consulta [Migrar desde Claude](/es/install/migrating-claude).
</Tip>

### Qué importa Claude

- `CLAUDE.md` del proyecto y `.claude/CLAUDE.md` al espacio de trabajo del agente de OpenClaw (`AGENTS.md`).
- `~/.claude/CLAUDE.md` del usuario anexado a `USER.md` del espacio de trabajo.
- Definiciones de servidores MCP desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code (incluidas sus entradas por proyecto) y `claude_desktop_config.json` de Claude Desktop.
- Directorios de skills de Claude que incluyen `SKILL.md` (`~/.claude/skills` del usuario y `.claude/skills` del proyecto).
- Archivos Markdown de comandos de Claude (`~/.claude/commands` del usuario y `.claude/commands` del proyecto) convertidos en skills de OpenClaw solo con invocación manual.

### Estado de archivo y revisión manual

Los hooks de Claude, permisos, valores predeterminados de entorno, `CLAUDE.local.md` del proyecto, `.claude/rules`, directorios `agents/` de usuario y de proyecto, y el historial del proyecto (`projects`, `cache`, `plans` bajo `~/.claude`) se conservan en el informe de migración o se informan como elementos de revisión manual. OpenClaw no ejecuta hooks, copia allowlists amplias ni importa automáticamente el estado de credenciales OAuth/Desktop.

## Proveedor de Codex

El proveedor de Codex incluido detecta el estado de Codex CLI en `~/.codex` de forma predeterminada, o en `CODEX_HOME` cuando esa variable de entorno está establecida. Usa `--from <path>` para inventariar un directorio personal de Codex específico.

Usa este proveedor al pasar al arnés de Codex de OpenClaw y cuando quieras promover deliberadamente recursos personales útiles de Codex CLI. Los lanzamientos locales del app-server de Codex usan un `CODEX_HOME` por agente, por lo que no leen tu `~/.codex` personal de forma predeterminada. El `HOME` normal del proceso se sigue heredando, por lo que Codex puede ver skills/entradas de marketplace de plugins compartidas en `$HOME/.agents/*` y los subprocesos pueden encontrar configuración y tokens del directorio personal del usuario.

Ejecutar `openclaw migrate codex` en una terminal interactiva previsualiza el plan completo y luego abre selectores de casillas antes de la confirmación final de aplicación. Los elementos de copia de skills se solicitan primero. Usa `Toggle all on` o `Toggle all off` para selección masiva. Pulsa Espacio para alternar filas, o Enter para activar la fila resaltada y continuar. Las skills planificadas empiezan marcadas, las skills en conflicto empiezan desmarcadas, y `Skip for now` omite las copias de skills para esta ejecución mientras continúa con la selección de plugins. Cuando los plugins curados de Codex instalados en el origen son migrables y no se proporcionó `--plugin`, la migración solicita después la activación de plugins nativos de Codex por nombre de plugin. Los elementos de plugin empiezan marcados salvo que la configuración del plugin Codex de OpenClaw de destino ya tenga ese plugin. Los plugins de destino existentes empiezan desmarcados y muestran una pista de conflicto como `conflict: plugin exists`; elige `Toggle all off` para no migrar plugins nativos de Codex en esa ejecución, o `Skip for now` para detenerte antes de aplicar.

Para ejecuciones con scripts o exactas, selecciona explícitamente una o más skills o plugins:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Qué importa Codex

- Directorios de skills de Codex CLI bajo `$CODEX_HOME/skills`, excluida la caché `.system` de Codex.
- AgentSkills personales bajo `$HOME/.agents/skills`, copiadas al espacio de trabajo actual del agente de OpenClaw para propiedad por agente.
- Plugins de Codex `openai-curated` instalados en el origen y descubiertos mediante `plugin/list` del app-server de Codex. La planificación lee `plugin/read` para cada plugin instalado habilitado.

La migración de plugins respaldados por apps tiene compuertas adicionales:

- Los plugins respaldados por apps requieren que la cuenta del app-server de Codex de origen sea una cuenta con suscripción a ChatGPT. Las respuestas sin cuenta o que no sean de ChatGPT se omiten con `codex_subscription_required`.
- De forma predeterminada, la migración no llama a `app/list` de origen, por lo que los plugins respaldados por apps que pasan la compuerta de cuenta se planifican sin verificación de accesibilidad de apps de origen, y los fallos de transporte de consulta de cuenta se omiten con `codex_account_unavailable`.
- Pasa `--verify-plugin-apps` para forzar una instantánea nueva de `app/list` de origen y exigir que cada app propiedad de la cuenta esté presente, habilitada y accesible antes de planificar la activación nativa. En ese modo, los fallos de transporte de consulta de cuenta pasan a la verificación de inventario de apps de origen. La instantánea se conserva en memoria solo para el proceso actual; nunca se escribe en la salida de migración ni en la configuración de destino.

Los plugins deshabilitados, los detalles de plugin ilegibles, las cuentas de origen limitadas por suscripción y (cuando `--verify-plugin-apps` está establecido) las apps ausentes, deshabilitadas o inaccesibles se convierten en elementos omitidos manuales con motivos tipados en lugar de entradas de configuración de destino. Apply llama a `plugin/install` del app-server para cada plugin elegible seleccionado, incluso si el app-server de destino ya informa que ese plugin está instalado y habilitado. Los plugins de Codex migrados solo se pueden usar en sesiones que seleccionan el arnés nativo de Codex; no se exponen a ejecuciones de proveedores de OpenClaw, enlaces de conversaciones ACP ni otros arneses.

### Estado de Codex de revisión manual

`config.toml` de Codex, `hooks/hooks.json` nativo, marketplaces no curados, paquetes de plugins en caché que no son plugins curados instalados en el origen, y plugins instalados en el origen que no superan la compuerta de suscripción de origen no se activan automáticamente. Cuando `--verify-plugin-apps` está establecido, los plugins que no superan la compuerta de inventario de apps de origen también se omiten. Todo esto se copia o informa en el informe de migración para revisión manual.

Para plugins curados migrados e instalados en el origen, apply escribe:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- una entrada de plugin explícita con `marketplaceName: "openai-curated"` y `pluginName` para cada plugin seleccionado

La migración nunca escribe `plugins["*"]` y nunca almacena rutas de caché de marketplaces locales.

Los plugins omitidos no se escriben en la configuración de destino. Los fallos de suscripción del lado de origen se informan en los elementos manuales con motivos tipados: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` o `plugin_read_unavailable`. Con `--verify-plugin-apps`, los fallos del inventario de aplicaciones de origen también pueden aparecer como `app_inaccessible`, `app_disabled`, `app_missing` o `app_inventory_unavailable`. Las instalaciones del lado de destino que requieren autenticación se informan en el elemento de plugin afectado con `status: "skipped"`, `reason: "auth_required"` e identificadores de aplicación saneados; sus entradas de configuración explícitas se escriben deshabilitadas hasta que las vuelvas a autorizar y habilitar. Otros fallos de instalación son resultados `error` con alcance de elemento.

Si el inventario de plugins del servidor de aplicaciones de Codex no está disponible durante la planificación, la migración recurre a elementos de aviso de paquete en caché en lugar de fallar toda la migración.

## Proveedor Hermes

El proveedor Hermes incluido detecta el estado en `~/.hermes` de forma predeterminada. Usa `--from <path>` cuando Hermes se encuentre en otro lugar.

### Qué importa Hermes

- Configuración del modelo predeterminado desde `config.yaml`.
- Proveedores de modelos configurados y endpoints personalizados compatibles con OpenAI desde `providers` y `custom_providers`.
- Definiciones de servidor MCP desde `mcp_servers` o `mcp.servers`.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente de OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md` anexados a los archivos de memoria del espacio de trabajo.
- Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw, además de elementos de archivo o revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyen un archivo `SKILL.md` bajo `skills/<name>/`.
- Valores de configuración por Skill desde `skills.config`.
- Credenciales OAuth de OpenCode OpenAI desde `auth.json` de OpenCode cuando se acepta la migración interactiva de credenciales, o cuando se establece `--include-secrets`. Las entradas OAuth de `auth.json` de Hermes son estado heredado informado para la reautorización manual de OpenAI o reparación con doctor.
- Claves API y tokens compatibles desde `.env` de Hermes y `auth.json` de OpenCode cuando se acepta la migración interactiva de credenciales, o cuando se establece `--include-secrets`.

### Claves `.env` compatibles

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Estado solo de archivo

El estado de Hermes que OpenClaw no puede interpretar de forma segura se copia en el informe de migración para revisión manual, pero no se carga en la configuración ni en las credenciales activas de OpenClaw. Esto conserva el estado opaco o inseguro sin fingir que OpenClaw puede ejecutarlo o confiar en él automáticamente: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Después de aplicar

```bash
openclaw doctor
```

## Contrato del Plugin

Las fuentes de migración son plugins. Un plugin declara sus ids de proveedor en `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

En tiempo de ejecución, el plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. Core es propietario de la orquestación de la CLI, la política de copias de seguridad, los prompts, la salida JSON y la comprobación previa de conflictos. Core pasa el plan revisado a `apply(ctx, plan)`, y los proveedores pueden reconstruir el plan solo cuando ese argumento está ausente por compatibilidad.

Los plugins de proveedor pueden usar `openclaw/plugin-sdk/migration` para la construcción de elementos y los recuentos de resumen, además de `openclaw/plugin-sdk/migration-runtime` para copias de archivos conscientes de conflictos, copias en informes solo de archivo, wrappers de config-runtime en caché e informes de migración.

## Integración de incorporación

La incorporación puede ofrecer la migración cuando un proveedor detecta un origen conocido. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` usan el mismo proveedor de migración de plugin y aún muestran una vista previa antes de aplicar.

<Note>
Las importaciones de incorporación requieren una configuración nueva de OpenClaw. Restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo si ya tienes estado local. Las importaciones con copia de seguridad y sobrescritura o con fusión están restringidas por una marca de característica para configuraciones existentes.
</Note>

## Relacionado

- [Migración desde Hermes](/es/install/migrating-hermes): guía paso a paso orientada al usuario.
- [Migración desde Claude](/es/install/migrating-claude): guía paso a paso orientada al usuario.
- [Migración](/es/install/migrating): mueve OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación de estado después de aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
