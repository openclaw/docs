---
read_when:
    - Quieres migrar de Hermes u otro sistema de agentes a OpenClaw
    - Estás agregando un proveedor de migración propiedad de un Plugin
summary: Referencia de CLI para `openclaw migrate` (importar el estado desde otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-06-27T11:01:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa el estado desde otro sistema de agentes mediante un proveedor de migración propiedad de un plugin. Los proveedores incluidos cubren el estado de Codex CLI, [Claude](/es/install/migrating-claude) y [Hermes](/es/install/migrating-hermes); los plugins de terceros pueden registrar proveedores adicionales.

<Tip>
Para recorridos orientados al usuario, consulta [Migración desde Claude](/es/install/migrating-claude) y [Migración desde Hermes](/es/install/migrating-hermes). El [centro de migración](/es/install/migrating) enumera todas las rutas.
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
  Importa credenciales admitidas sin preguntar. La aplicación interactiva pregunta antes de importar credenciales de autenticación detectadas, con sí seleccionado de forma predeterminada; `--yes` no interactivo requiere `--include-secrets` para importarlas.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Omite la importación de credenciales de autenticación, incluida la pregunta interactiva.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que la aplicación reemplace destinos existentes cuando el plan informa conflictos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Omite la solicitud de confirmación. Obligatorio en modo no interactivo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecciona un elemento de copia de skill por nombre de skill o id de elemento. Repite la marca para migrar varias skills. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas y las migraciones no interactivas conservan todas las skills planificadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecciona un elemento de instalación de plugin de Codex por nombre de plugin o id de elemento. Repite la marca para migrar varios plugins de Codex. Cuando se omite, las migraciones interactivas de Codex muestran un selector nativo de casillas de plugins de Codex y las migraciones no interactivas conservan todos los plugins planificados. Esto solo se aplica a plugins de Codex `openai-curated` instalados desde el origen y descubiertos por el inventario del servidor de aplicaciones de Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Solo Codex. Fuerza un recorrido nuevo de `app/list` del servidor de aplicaciones de Codex de origen antes de planificar la activación nativa de plugins. Desactivado de forma predeterminada para que la planificación de migración sea rápida.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omite la copia de seguridad previa a la aplicación. Requiere `--force` cuando existe estado local de OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obligatorio junto con `--no-backup` cuando, de otro modo, la aplicación se negaría a omitir la copia de seguridad.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime el plan o el resultado de aplicación como JSON. Con `--json` y sin `--yes`, apply imprime el plan y no modifica el estado.
</ParamField>

## Modelo de seguridad

`openclaw migrate` prioriza la vista previa.

<AccordionGroup>
  <Accordion title="Vista previa antes de aplicar">
    El proveedor devuelve un plan detallado por elementos antes de que nada cambie, incluidos conflictos, elementos omitidos y elementos sensibles. Los planes JSON, la salida de aplicación y los informes de migración redactan claves anidadas que parecen secretas, como claves de API, tokens, encabezados de autorización, cookies y contraseñas.

    `openclaw migrate apply <provider>` muestra una vista previa del plan y pregunta antes de cambiar el estado, a menos que se establezca `--yes`. En modo no interactivo, apply requiere `--yes`.

  </Accordion>
  <Accordion title="Copias de seguridad">
    Apply crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si aún no existe estado local de OpenClaw, el paso de copia de seguridad se omite y la migración puede continuar. Para omitir una copia de seguridad cuando existe estado, pasa tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflictos">
    Apply se niega a continuar cuando el plan tiene conflictos. Revisa el plan y, luego, vuelve a ejecutar con `--overwrite` si reemplazar destinos existentes es intencional. Los proveedores aún pueden escribir copias de seguridad a nivel de elemento para archivos sobrescritos en el directorio de informes de migración.
  </Accordion>
  <Accordion title="Secretos">
    La aplicación interactiva pregunta si se deben importar las credenciales de autenticación detectadas, con sí seleccionado de forma predeterminada. Usa `--no-auth-credentials` para omitirlas, o usa `--include-secrets` para importar credenciales sin supervisión con `--yes`.
  </Accordion>
</AccordionGroup>

## Proveedor Claude

El proveedor Claude incluido detecta el estado de Claude Code en `~/.claude` de forma predeterminada. Usa `--from <path>` para importar un directorio principal o raíz de proyecto de Claude Code específico.

<Tip>
Para un recorrido orientado al usuario, consulta [Migración desde Claude](/es/install/migrating-claude).
</Tip>

### Qué importa Claude

- `CLAUDE.md` del proyecto y `.claude/CLAUDE.md` en el espacio de trabajo del agente de OpenClaw.
- `~/.claude/CLAUDE.md` del usuario añadido a `USER.md` del espacio de trabajo.
- Definiciones de servidor MCP desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code y `claude_desktop_config.json` de Claude Desktop.
- Directorios de skills de Claude que incluyen `SKILL.md`.
- Archivos Markdown de comandos de Claude convertidos en Skills de OpenClaw solo con invocación manual.

### Estado de archivo y revisión manual

Los hooks, permisos, valores predeterminados de entorno, memoria local, reglas con alcance de ruta, subagentes, cachés, planes e historial de proyecto de Claude se conservan en el informe de migración o se informan como elementos de revisión manual. OpenClaw no ejecuta hooks, no copia listas de permitidos amplias ni importa automáticamente el estado de credenciales OAuth/Desktop.

## Proveedor Codex

El proveedor Codex incluido detecta el estado de Codex CLI en `~/.codex` de forma predeterminada, o
en `CODEX_HOME` cuando esa variable de entorno está definida. Usa `--from <path>` para
inventariar un directorio principal de Codex específico.

Usa este proveedor al pasar al arnés de Codex de OpenClaw y cuando quieras
promover deliberadamente recursos personales útiles de Codex CLI. Los lanzamientos locales del servidor de aplicaciones de Codex
usan un `CODEX_HOME` por agente, por lo que no leen tu `~/.codex` personal
de forma predeterminada. El proceso normal `HOME` todavía se hereda, por lo que Codex
puede ver entradas compartidas de skills/mercado de plugins de `$HOME/.agents/*` y
los subprocesos pueden encontrar configuración y tokens del directorio personal del usuario.

Ejecutar `openclaw migrate codex` en una terminal interactiva muestra una vista previa del
plan completo y luego abre selectores de casillas antes de la confirmación final de aplicación. Los elementos de copia de skills
se solicitan primero. Usa `Toggle all on` o `Toggle all off` para la selección masiva.
Presiona Espacio para alternar filas, o presiona Enter para activar la fila resaltada
y continuar. Las skills planificadas empiezan marcadas, las skills en conflicto empiezan desmarcadas, y
`Skip for now` omite las copias de skills para esta ejecución mientras continúa con la selección de plugins.
Cuando los plugins curados de Codex instalados desde el origen se pueden migrar y
no se proporcionó `--plugin`, la migración luego solicita la activación nativa de plugins de Codex
por nombre de plugin. Los elementos de plugins
empiezan marcados a menos que la configuración del plugin de Codex de OpenClaw de destino ya tenga ese
plugin. Los plugins de destino existentes empiezan desmarcados y muestran una sugerencia de conflicto como
`conflict: plugin exists`; elige `Toggle all off` para no migrar ningún plugin nativo de Codex
en esa ejecución, o `Skip for now` para detener antes de aplicar. Para ejecuciones con script o
exactas, pasa `--skill <name>` una vez por skill, por ejemplo:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Usa `--plugin <name>` para limitar la migración no interactiva de plugins nativos de Codex
a uno o más plugins curados instalados desde el origen:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Qué importa Codex

- Directorios de skills de Codex CLI bajo `$CODEX_HOME/skills`, excluida la
  caché `.system` de Codex.
- AgentSkills personales bajo `$HOME/.agents/skills`, copiadas en el espacio de trabajo
  actual del agente de OpenClaw cuando quieres propiedad por agente.
- Plugins de Codex `openai-curated` instalados desde el origen y descubiertos mediante
  `plugin/list` del servidor de aplicaciones de Codex. La planificación lee `plugin/read` para cada plugin
  instalado y habilitado. Los plugins respaldados por aplicaciones requieren que la respuesta de cuenta del servidor de aplicaciones de Codex
  de origen sea una cuenta de suscripción de ChatGPT; las respuestas de cuenta que no son de ChatGPT o que faltan
  se omiten con `codex_subscription_required`. De forma predeterminada,
  la migración no llama a `app/list` de origen, por lo que los plugins respaldados por aplicaciones que pasan la
  puerta de cuenta se planifican sin verificación de accesibilidad de la aplicación de origen, y
  los fallos de transporte de búsqueda de cuenta se omiten con `codex_account_unavailable`. Pasa
  `--verify-plugin-apps` cuando quieras que la migración fuerce una instantánea nueva de
  `app/list` de origen y requiera que cada aplicación propia esté presente, habilitada y
  accesible antes de planificar la activación nativa. En ese modo, los fallos de transporte de
  búsqueda de cuenta pasan a la verificación del inventario de aplicaciones de origen. La
  instantánea del inventario de aplicaciones de origen se mantiene en memoria para el proceso actual; no
  se escribe en la salida de migración ni en la configuración de destino. Plugins deshabilitados,
  detalles de plugins ilegibles, cuentas de origen restringidas por suscripción y, cuando
  se solicita verificación, aplicaciones faltantes, aplicaciones deshabilitadas, aplicaciones inaccesibles o
  fallos de inventario de aplicaciones de origen se convierten en elementos manuales omitidos con motivos tipados
  en lugar de entradas de configuración de destino.
  Apply llama a `plugin/install` del servidor de aplicaciones para cada plugin elegible seleccionado,
  incluso si el servidor de aplicaciones de destino ya informa que ese plugin está instalado y
  habilitado. Los plugins de Codex migrados solo se pueden usar en sesiones que seleccionan el
  arnés nativo de Codex; no se exponen a ejecuciones de proveedor de OpenClaw,
  enlaces de conversación ACP ni otros arneses.

### Estado de Codex para revisión manual

`config.toml` de Codex, `hooks/hooks.json` nativo, mercados no curados, paquetes de
plugins en caché que no son plugins curados instalados desde el origen y plugins instalados desde el origen
que fallan la puerta de suscripción de origen no se activan automáticamente.
Cuando `--verify-plugin-apps` está definido, los plugins que fallan la puerta del inventario de aplicaciones
de origen también se omiten. Se copian o se informan en el informe de migración para
revisión manual.

Para plugins curados instalados desde el origen migrados, apply escribe:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- una entrada explícita de plugin con `marketplaceName: "openai-curated"` y
  `pluginName` para cada plugin seleccionado

La migración nunca escribe `plugins["*"]` y nunca almacena rutas de caché del marketplace local. Los fallos de suscripción del lado de origen se informan en elementos manuales con motivos tipificados como `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` o `plugin_read_unavailable`. Con `--verify-plugin-apps`, los fallos del inventario de aplicaciones de origen también pueden aparecer como `app_inaccessible`, `app_disabled`, `app_missing` o `app_inventory_unavailable`. Los plugins omitidos no se escriben en la configuración de destino.
Las instalaciones del lado de destino que requieren autenticación se informan en el elemento del plugin afectado con `status: "skipped"`, `reason: "auth_required"` e identificadores de aplicación saneados. Sus entradas de configuración explícitas se escriben deshabilitadas hasta que vuelvas a autorizarlas y habilitarlas. Otros fallos de instalación son resultados `error` limitados al elemento.

Si el inventario de plugins del servidor de aplicaciones de Codex no está disponible durante la planificación, la migración recurre a elementos de aviso de paquete almacenados en caché en lugar de fallar toda la migración.

## Proveedor Hermes

El proveedor Hermes incluido detecta el estado en `~/.hermes` de forma predeterminada. Usa `--from <path>` cuando Hermes esté en otra ubicación.

### Qué importa Hermes

- Configuración del modelo predeterminado desde `config.yaml`.
- Proveedores de modelos configurados y endpoints personalizados compatibles con OpenAI desde `providers` y `custom_providers`.
- Definiciones de servidores MCP desde `mcp_servers` o `mcp.servers`.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente de OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md` anexados a los archivos de memoria del espacio de trabajo.
- Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw, además de elementos de archivo o de revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyen un archivo `SKILL.md` bajo `skills/<name>/`.
- Valores de configuración por Skill desde `skills.config`.
- Credenciales OAuth de OpenAI de OpenCode desde `auth.json` de OpenCode cuando se acepta la migración interactiva de credenciales, o cuando `--include-secrets` está configurado. Las entradas OAuth de `auth.json` de Hermes son estado heredado informado para reautenticación manual de OpenAI o reparación con doctor.
- Claves de API y tokens compatibles desde `.env` de Hermes y `auth.json` de OpenCode cuando se acepta la migración interactiva de credenciales, o cuando `--include-secrets` está configurado.

### Claves `.env` compatibles

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Estado solo de archivo

El estado de Hermes que OpenClaw no puede interpretar de forma segura se copia en el informe de migración para revisión manual, pero no se carga en la configuración ni en las credenciales activas de OpenClaw. Esto conserva el estado opaco o inseguro sin fingir que OpenClaw puede ejecutarlo o confiar en él automáticamente:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### Después de aplicar

```bash
openclaw doctor
```

## Contrato del plugin

Las fuentes de migración son plugins. Un plugin declara sus ids de proveedor en `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

En tiempo de ejecución, el plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. El núcleo es responsable de la orquestación de la CLI, la política de copias de seguridad, los prompts, la salida JSON y la comprobación previa de conflictos. El núcleo pasa el plan revisado a `apply(ctx, plan)`, y los proveedores pueden reconstruir el plan solo cuando ese argumento está ausente por compatibilidad.

Los plugins de proveedor pueden usar `openclaw/plugin-sdk/migration` para construir elementos y calcular recuentos de resumen, además de `openclaw/plugin-sdk/migration-runtime` para copias de archivos conscientes de conflictos, copias de informes solo de archivo, envoltorios de config-runtime en caché e informes de migración.

## Integración de onboarding

El onboarding puede ofrecer migración cuando un proveedor detecta una fuente conocida. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` usan el mismo proveedor de migración de plugin y siguen mostrando una vista previa antes de aplicar.

<Note>
Las importaciones de onboarding requieren una configuración nueva de OpenClaw. Restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo si ya tienes estado local. Las importaciones con copia de seguridad más sobrescritura o con fusión están detrás de una feature gate para configuraciones existentes.
</Note>

## Relacionado

- [Migrar desde Hermes](/es/install/migrating-hermes): guía paso a paso para usuarios.
- [Migrar desde Claude](/es/install/migrating-claude): guía paso a paso para usuarios.
- [Migrar](/es/install/migrating): mover OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación de estado después de aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
