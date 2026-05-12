---
read_when:
    - Desea migrar desde Hermes u otro sistema de agentes a OpenClaw
    - Está agregando un proveedor de migración propiedad de un Plugin
summary: Referencia de CLI para `openclaw migrate` (importar estado desde otro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-05-12T23:29:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
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
  Crea el plan y sale sin cambiar el estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sobrescribe el directorio de estado de origen. Hermes usa `~/.hermes` de forma predeterminada.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa credenciales compatibles. Desactivado de forma predeterminada.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que la aplicación sustituya destinos existentes cuando el plan informe conflictos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Omite la solicitud de confirmación. Requerido en modo no interactivo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecciona un elemento de copia de skill por nombre de skill o id de elemento. Repite la bandera para migrar varias Skills. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas y las migraciones no interactivas conservan todas las Skills planificadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecciona un elemento de instalación de plugin de Codex por nombre de plugin o id de elemento. Repite la bandera para migrar varios plugins de Codex. Cuando se omite, las migraciones interactivas de Codex muestran un selector de casillas nativo de plugins de Codex y las migraciones no interactivas conservan todos los plugins planificados. Esto solo se aplica a plugins de Codex `openai-curated` instalados en el origen descubiertos por el inventario del servidor de aplicaciones de Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Solo Codex. Fuerza un recorrido nuevo de `app/list` del servidor de aplicaciones de Codex de origen antes de planificar la activación de plugins nativos. Desactivado de forma predeterminada para mantener rápida la planificación de la migración.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Omite la copia de seguridad previa a la aplicación. Requiere `--force` cuando existe estado local de OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Requerido junto con `--no-backup` cuando, de otro modo, la aplicación se negaría a omitir la copia de seguridad.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime el plan o el resultado de la aplicación como JSON. Con `--json` y sin `--yes`, la aplicación imprime el plan y no modifica el estado.
</ParamField>

## Modelo de seguridad

`openclaw migrate` prioriza la vista previa.

<AccordionGroup>
  <Accordion title="Vista previa antes de aplicar">
    El proveedor devuelve un plan detallado por elementos antes de que cambie nada, incluidos conflictos, elementos omitidos y elementos sensibles. Los planes JSON, la salida de aplicación y los informes de migración redactan claves anidadas que parecen secretas, como claves de API, tokens, encabezados de autorización, cookies y contraseñas.

    `openclaw migrate apply <provider>` muestra una vista previa del plan y solicita confirmación antes de cambiar el estado, a menos que se establezca `--yes`. En modo no interactivo, aplicar requiere `--yes`.

  </Accordion>
  <Accordion title="Copias de seguridad">
    Aplicar crea y verifica una copia de seguridad de OpenClaw antes de aplicar la migración. Si aún no existe estado local de OpenClaw, el paso de copia de seguridad se omite y la migración puede continuar. Para omitir una copia de seguridad cuando existe estado, pasa tanto `--no-backup` como `--force`.
  </Accordion>
  <Accordion title="Conflictos">
    Aplicar se niega a continuar cuando el plan tiene conflictos. Revisa el plan y luego vuelve a ejecutarlo con `--overwrite` si la sustitución de destinos existentes es intencional. Los proveedores aún pueden escribir copias de seguridad a nivel de elemento para archivos sobrescritos en el directorio del informe de migración.
  </Accordion>
  <Accordion title="Secretos">
    Los secretos nunca se importan de forma predeterminada. Usa `--include-secrets` para importar credenciales compatibles.
  </Accordion>
</AccordionGroup>

## Proveedor de Claude

El proveedor de Claude incluido detecta el estado de Claude Code en `~/.claude` de forma predeterminada. Usa `--from <path>` para importar un directorio principal o raíz de proyecto específico de Claude Code.

<Tip>
Para una guía paso a paso orientada al usuario, consulta [Migrar desde Claude](/es/install/migrating-claude).
</Tip>

### Lo que importa Claude

- `CLAUDE.md` del proyecto y `.claude/CLAUDE.md` al área de trabajo del agente de OpenClaw.
- `~/.claude/CLAUDE.md` del usuario anexado a `USER.md` del área de trabajo.
- Definiciones de servidor MCP desde `.mcp.json` del proyecto, `~/.claude.json` de Claude Code y `claude_desktop_config.json` de Claude Desktop.
- Directorios de skills de Claude que incluyen `SKILL.md`.
- Archivos Markdown de comandos de Claude convertidos en Skills de OpenClaw solo con invocación manual.

### Estado de archivo y revisión manual

Los hooks de Claude, permisos, valores predeterminados de entorno, memoria local, reglas con alcance de ruta, subagentes, cachés, planes e historial del proyecto se conservan en el informe de migración o se notifican como elementos de revisión manual. OpenClaw no ejecuta hooks, no copia listas de permisos amplias ni importa automáticamente estado de credenciales de OAuth/Desktop.

## Proveedor de Codex

El proveedor de Codex incluido detecta el estado de Codex CLI en `~/.codex` de forma predeterminada, o
en `CODEX_HOME` cuando esa variable de entorno está establecida. Usa `--from <path>` para
inventariar un directorio principal específico de Codex.

Usa este proveedor al migrar al arnés de Codex de OpenClaw y si quieres
promover de forma deliberada recursos personales útiles de Codex CLI. Los
lanzamientos del servidor de aplicaciones local de Codex usan directorios
`CODEX_HOME` y `HOME` por agente, por lo que no leen tu estado personal de
Codex CLI de forma predeterminada.

Ejecutar `openclaw migrate codex` en una terminal interactiva muestra una vista previa del plan
completo y luego abre selectores de casillas antes de la confirmación final de aplicación. Los elementos de
copia de Skills se solicitan primero. Usa `Toggle all on` o `Toggle all off` para la selección
masiva. Pulsa Espacio para alternar filas, o pulsa Intro para activar la fila resaltada
y continuar. Las Skills planificadas empiezan marcadas, las Skills con conflicto empiezan desmarcadas, y
`Skip for now` omite las copias de Skills para esta ejecución mientras continúa con la selección de
plugins. Cuando los plugins seleccionados de Codex instalados en el origen son migrables y
no se proporcionó `--plugin`, la migración solicita entonces la activación nativa de plugins de Codex
por nombre de plugin. Los elementos de plugin
empiezan marcados salvo que la configuración del plugin de Codex de OpenClaw de destino ya tenga ese
plugin. Los plugins de destino existentes empiezan desmarcados y muestran una pista de conflicto como
`conflict: plugin exists`; elige `Toggle all off` para no migrar ningún plugin nativo de Codex
en esa ejecución, o `Skip for now` para detenerte antes de aplicar. Para ejecuciones exactas o
con scripts, pasa `--skill <name>` una vez por skill, por ejemplo:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Usa `--plugin <name>` para limitar la migración no interactiva de plugins nativos de Codex
a uno o más plugins seleccionados instalados en el origen:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Lo que importa Codex

- Directorios de Skills de Codex CLI bajo `$CODEX_HOME/skills`, excluida la caché
  `.system` de Codex.
- AgentSkills personales bajo `$HOME/.agents/skills`, copiadas al área de trabajo del agente
  actual de OpenClaw cuando quieres propiedad por agente.
- Plugins de Codex `openai-curated` instalados en el origen descubiertos mediante
  `plugin/list` del servidor de aplicaciones de Codex. La planificación lee `plugin/read` para cada plugin
  instalado y habilitado. Los plugins respaldados por aplicaciones requieren que la respuesta de cuenta del servidor
  de aplicaciones de Codex de origen sea una cuenta de suscripción de ChatGPT; las respuestas de cuenta que no son de ChatGPT
  o faltantes se omiten con `codex_subscription_required`. De forma predeterminada,
  la migración no llama a `app/list` de origen, por lo que los plugins respaldados por aplicaciones que superan la
  puerta de cuenta se planifican sin verificación de accesibilidad de aplicaciones de origen, y
  los fallos de transporte de búsqueda de cuenta se omiten con `codex_account_unavailable`. Pasa
  `--verify-plugin-apps` cuando quieras que la migración fuerce una instantánea nueva de
  `app/list` de origen y requiera que cada aplicación poseída esté presente, habilitada y
  accesible antes de planificar la activación nativa. En ese modo, los fallos de transporte
  de búsqueda de cuenta pasan a la verificación del inventario de aplicaciones de origen. La
  instantánea del inventario de aplicaciones de origen se conserva en memoria para el proceso actual; no
  se escribe en la salida de migración ni en la configuración de destino. Los plugins deshabilitados,
  los detalles de plugin ilegibles, las cuentas de origen con acceso condicionado por suscripción y, cuando
  se solicita verificación, las aplicaciones faltantes, deshabilitadas o inaccesibles, o
  los fallos del inventario de aplicaciones de origen, se convierten en elementos manuales omitidos con razones tipadas
  en lugar de entradas de configuración de destino.
  Aplicar llama a `plugin/install` del servidor de aplicaciones para cada plugin elegible seleccionado,
  incluso si el servidor de aplicaciones de destino ya informa que ese plugin está instalado y
  habilitado. Los plugins de Codex migrados solo se pueden usar en sesiones que seleccionan el
  arnés nativo de Codex; no se exponen a Pi, ejecuciones normales del proveedor OpenAI,
  enlaces de conversación ACP ni otros arneses.

### Estado de Codex de revisión manual

`config.toml` de Codex, `hooks/hooks.json` nativos, marketplaces no seleccionados, paquetes de
plugins en caché que no son plugins seleccionados instalados en el origen y plugins instalados en el origen
que fallan la puerta de suscripción de origen no se activan automáticamente.
Cuando `--verify-plugin-apps` está establecido, los plugins que fallan la puerta del inventario de aplicaciones
de origen también se omiten. Se copian o se notifican en el informe de migración para
revisión manual.

Para plugins seleccionados instalados en el origen migrados, aplicar escribe:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- una entrada explícita de plugin con `marketplaceName: "openai-curated"` y
  `pluginName` para cada plugin seleccionado

La migración nunca escribe `plugins["*"]` y nunca almacena rutas locales de caché de marketplace.
Los fallos de suscripción del lado de origen se informan en elementos manuales con razones tipadas
como `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled` o `plugin_read_unavailable`. Con `--verify-plugin-apps`,
los fallos del inventario de aplicaciones de origen también pueden aparecer como `app_inaccessible`,
`app_disabled`, `app_missing` o `app_inventory_unavailable`. Los plugins omitidos
no se escriben en la configuración de destino.
Las instalaciones del lado de destino que requieren autenticación se notifican en el elemento de plugin afectado con
`status: "skipped"`, `reason: "auth_required"` e identificadores de aplicación saneados.
Sus entradas de configuración explícitas se escriben deshabilitadas hasta que vuelvas a autorizar y
las habilites. Otros fallos de instalación son resultados `error` con alcance de elemento.

Si el inventario de plugins del servidor de aplicaciones de Codex no está disponible durante la planificación, la migración
recurre a elementos de asesoría de paquetes en caché en lugar de hacer fallar toda la
migración.

## Proveedor de Hermes

El proveedor de Hermes incluido detecta el estado en `~/.hermes` de forma predeterminada. Usa `--from <path>` cuando Hermes se encuentre en otro lugar.

### Lo que importa Hermes

- Configuración del modelo predeterminado desde `config.yaml`.
- Proveedores de modelos configurados y endpoints personalizados compatibles con OpenAI desde `providers` y `custom_providers`.
- Definiciones de servidores MCP desde `mcp_servers` o `mcp.servers`.
- `SOUL.md` y `AGENTS.md` en el espacio de trabajo del agente de OpenClaw.
- `memories/MEMORY.md` y `memories/USER.md` añadidos a los archivos de memoria del espacio de trabajo.
- Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw, además de elementos de archivo o revisión manual para proveedores de memoria externos como Honcho.
- Skills que incluyen un archivo `SKILL.md` en `skills/<name>/`.
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

En tiempo de ejecución, el plugin llama a `api.registerMigrationProvider(...)`. El proveedor implementa `detect`, `plan` y `apply`. El núcleo se encarga de la orquestación de CLI, la política de copias de seguridad, los prompts, la salida JSON y la comprobación previa de conflictos. El núcleo pasa el plan revisado a `apply(ctx, plan)`, y los proveedores pueden reconstruir el plan solo cuando ese argumento está ausente por compatibilidad.

Los plugins de proveedor pueden usar `openclaw/plugin-sdk/migration` para la construcción de elementos y los recuentos de resumen, además de `openclaw/plugin-sdk/migration-runtime` para copias de archivos conscientes de conflictos, copias de informes solo de archivo, envoltorios de config-runtime en caché e informes de migración.

## Integración de incorporación

La incorporación puede ofrecer migración cuando un proveedor detecta una fuente conocida. Tanto `openclaw onboard --flow import` como `openclaw setup --wizard --import-from hermes` usan el mismo proveedor de migración de plugin y siguen mostrando una vista previa antes de aplicar.

<Note>
Las importaciones de incorporación requieren una configuración nueva de OpenClaw. Restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo si ya tienes estado local. Las importaciones con copia de seguridad más sobrescritura o fusión están detrás de una feature gate para configuraciones existentes.
</Note>

## Relacionado

- [Migrar desde Hermes](/es/install/migrating-hermes): guía paso a paso orientada al usuario.
- [Migrar desde Claude](/es/install/migrating-claude): guía paso a paso orientada al usuario.
- [Migrar](/es/install/migrating): mover OpenClaw a una máquina nueva.
- [Doctor](/es/gateway/doctor): comprobación de estado tras aplicar una migración.
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
