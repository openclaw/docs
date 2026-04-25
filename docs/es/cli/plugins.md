---
read_when:
    - Quieres instalar o gestionar Plugins de Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de Plugins
summary: Referencia de la CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:17:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ae8f71873fb90dc7acde2ac522228cc60603ba34322e5b6d031e8de7545684e
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gestiona Plugins de Gateway, paquetes de hooks y paquetes compatibles.

Relacionado:

- Sistema de Plugin: [Plugins](/es/tools/plugin)
- Compatibilidad de paquetes: [Paquetes de Plugin](/es/plugins/bundles)
- Manifiesto + esquema de Plugin: [Manifiesto de Plugin](/es/plugins/manifest)
- Endurecimiento de seguridad: [Seguridad](/es/gateway/security)

## Comandos

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Los Plugins incluidos se entregan con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, los proveedores de modelos incluidos, los proveedores de voz incluidos y el plugin de navegador incluido); otros requieren `plugins enable`.

Los Plugins nativos de OpenClaw deben incluir `openclaw.plugin.json` con un esquema JSON en línea (`configSchema`, incluso si está vacío). Los paquetes compatibles usan en su lugar sus propios manifiestos de paquete.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de paquete (`codex`, `claude` o `cursor`) más las capacidades del paquete detectadas.

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub primero, luego npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install <package> --force              # sobrescribe la instalación existente
openclaw plugins install <package> --pin                # fija la versión
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ruta local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explícito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Los nombres de paquete sin calificador se comprueban primero en ClawHub y luego en npm. Nota de seguridad: trata las instalaciones de Plugins como si ejecutaran código. Prefiere versiones fijadas.

Si tu sección `plugins` está respaldada por un único `$include` de archivo, `plugins install/update/enable/disable/uninstall` escriben en ese archivo incluido y dejan `openclaw.json` intacto. Los includes raíz, los arrays de includes y los includes con sobrescrituras hermanas fallan de forma segura en lugar de aplanarse. Consulta [Config includes](/es/gateway/configuration) para ver las formas admitidas.

Si la configuración no es válida, `plugins install` normalmente falla de forma segura y te indica que primero ejecutes `openclaw doctor --fix`. La única excepción documentada es una ruta de recuperación limitada para Plugins incluidos que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

`--force` reutiliza el destino de instalación existente y sobrescribe en su lugar un plugin o paquete de hooks ya instalado. Úsalo cuando quieras reinstalar intencionadamente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto de npm. Para actualizaciones rutinarias de un plugin de npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

Si ejecutas `plugins install` para un id de plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieres sobrescribir la instalación actual desde una fuente distinta.

`--pin` solo se aplica a instalaciones de npm. No es compatible con `--marketplace`, porque las instalaciones desde marketplace conservan metadatos de origen del marketplace en lugar de una especificación de npm.

`--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos en el escáner integrado de código peligroso. Permite que la instalación continúe incluso cuando el escáner integrado informa hallazgos `critical`, pero **no** omite los bloqueos de política de hooks `before_install` del plugin y **no** omite los fallos del escaneo.

Esta bandera de CLI se aplica a los flujos de instalación/actualización de Plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan la anulación de solicitud correspondiente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo separado de descarga/instalación de Skills desde ClawHub.

`plugins install` también es la superficie de instalación para los paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para la visibilidad filtrada de hooks y la habilitación por hook, no para la instalación de paquetes.

Las especificaciones de npm son **solo de registro** (nombre del paquete + **versión exacta** opcional o **dist-tag**). Se rechazan las especificaciones de git/URL/archivo y los rangos semver. Las instalaciones de dependencias se ejecutan con `--ignore-scripts` por seguridad.

Las especificaciones sin calificador y `@latest` permanecen en la línea estable. Si npm resuelve cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente por ella con una etiqueta preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

Si una especificación de instalación sin calificador coincide con el id de un plugin incluido (por ejemplo `diffs`), OpenClaw instala directamente el plugin incluido. Para instalar un paquete npm con el mismo nombre, usa una especificación con alcance explícito (por ejemplo `@scope/diffs`).

Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

También se admiten instalaciones desde el marketplace de Claude.

Las instalaciones desde ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Ahora OpenClaw también prefiere ClawHub para las especificaciones de Plugins sin calificador seguras para npm. Solo recurre a npm si ClawHub no tiene ese paquete o versión:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw descarga el archivo del paquete desde ClawHub, comprueba la compatibilidad anunciada con la API de plugin / Gateway mínimo y luego lo instala mediante la ruta normal de archivo. Las instalaciones registradas conservan sus metadatos de origen de ClawHub para actualizaciones posteriores.

Usa la sintaxis abreviada `plugin@marketplace` cuando el nombre del marketplace exista en la caché del registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` cuando quieras pasar la fuente del marketplace explícitamente:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Las fuentes de marketplace pueden ser:

- un nombre de marketplace conocido de Claude desde `~/.claude/plugins/known_marketplaces.json`
- una raíz de marketplace local o una ruta a `marketplace.json`
- una forma abreviada de repositorio de GitHub como `owner/repo`
- una URL de repositorio de GitHub como `https://github.com/owner/repo`
- una URL de git

Para marketplaces remotos cargados desde GitHub o git, las entradas de Plugins deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta fuentes de rutas relativas desde ese repositorio y rechaza fuentes de Plugins HTTP(S), de ruta absoluta, git, GitHub y otras fuentes que no sean rutas desde manifiestos remotos.

Para rutas locales y archivos, OpenClaw detecta automáticamente:

- Plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Los paquetes compatibles se instalan en la raíz normal de Plugins y participan en el mismo flujo de list/info/enable/disable. Actualmente, se admiten las Skills de paquetes, command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` / `lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks compatibles de Codex; otras capacidades de paquetes detectadas se muestran en diagnósticos/info, pero todavía no están conectadas a la ejecución en tiempo de ejecución.

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--enabled` para mostrar solo los Plugins habilitados. Usa `--verbose` para cambiar de la vista de tabla a líneas de detalle por plugin con metadatos de fuente/origen/versión/activación. Usa `--json` para obtener un inventario legible por máquina más diagnósticos del registro.

`plugins list` primero lee el registro local persistido de Plugins, con una alternativa derivada solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un plugin está instalado, habilitado y visible para la planificación de inicio en frío, pero no es una sonda en vivo del tiempo de ejecución de un proceso de Gateway ya en ejecución. Después de cambiar el código de un plugin, su habilitación, la política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecuten nuevo código `register(api)` o hooks. Para implementaciones remotas/en contenedores, verifica que estés reiniciando el proceso hijo real `openclaw gateway run`, no solo un proceso contenedor.

Para depurar hooks en tiempo de ejecución:

- `openclaw plugins inspect <id> --json` muestra hooks registrados y diagnósticos de una pasada de inspección con el módulo cargado.
- `openclaw gateway status --deep --require-rpc` confirma el Gateway accesible, pistas de servicio/proceso, ruta de configuración y estado de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local (lo agrega a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la ruta de origen en lugar de copiar sobre un destino de instalación administrado.

Usa `--pin` en instalaciones de npm para guardar la especificación exacta resuelta (`name@version`) en `plugins.installs` mientras mantienes el comportamiento predeterminado sin fijar.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina los registros del plugin de `plugins.entries`, `plugins.installs`, la lista de permitidos de Plugins y las entradas enlazadas de `plugins.load.paths` cuando corresponde. En el caso de los Plugins de memoria activa, la ranura de memoria se restablece a `memory-core`.

De forma predeterminada, desinstalar también elimina el directorio de instalación del plugin en la raíz de Plugins del directorio de estado activo. Usa `--keep-files` para conservar los archivos en disco.

`--keep-config` se admite como alias obsoleto de `--keep-files`.

### Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a las instalaciones rastreadas en `plugins.installs` y a las instalaciones rastreadas de paquetes de hooks en `hooks.internal.installs`.

Cuando pasas un id de plugin, OpenClaw reutiliza la especificación de instalación registrada para ese plugin. Esto significa que las dist-tags almacenadas previamente, como `@beta`, y las versiones exactas fijadas siguen utilizándose en ejecuciones posteriores de `update <id>`.

Para instalaciones de npm, también puedes pasar una especificación explícita de paquete npm con una dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro del plugin rastreado, actualiza ese plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

Pasar el nombre del paquete npm sin una versión o etiqueta también se resuelve de vuelta al registro del plugin rastreado. Usa esto cuando un plugin estaba fijado a una versión exacta y quieres devolverlo a la línea de versiones predeterminada del registro.

Antes de una actualización de npm en vivo, OpenClaw comprueba la versión del paquete instalado con los metadatos del registro npm. Si la versión instalada y la identidad del artefacto registrada ya coinciden con el destino resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

Cuando existe un hash de integridad almacenado y cambia el hash del artefacto recuperado, OpenClaw trata eso como una deriva del artefacto de npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real, y solicita confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan de forma segura a menos que el llamador proporcione una política explícita de continuación.

`--dangerously-force-unsafe-install` también está disponible en `plugins update` como una anulación de emergencia para falsos positivos del escaneo integrado de código peligroso durante las actualizaciones de Plugins. Sigue sin omitir los bloqueos de política `before_install` del plugin ni el bloqueo por fallos del escaneo, y solo se aplica a actualizaciones de Plugins, no a actualizaciones de paquetes de hooks.

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspección profunda para un solo plugin. Muestra identidad, estado de carga, origen, capacidades registradas, hooks, herramientas, comandos, servicios, métodos de gateway, rutas HTTP, banderas de política, diagnósticos, metadatos de instalación, capacidades del paquete y cualquier compatibilidad detectada con servidores MCP o LSP.

Cada plugin se clasifica según lo que realmente registra en tiempo de ejecución:

- **plain-capability** — un tipo de capacidad (por ejemplo, un plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios pero sin capacidades

Consulta [Formas de Plugin](/es/plugins/architecture#plugin-shapes) para obtener más información sobre el modelo de capacidades.

La bandera `--json` genera un informe legible por máquina adecuado para scripts y auditorías.

`inspect --all` muestra una tabla de toda la flota con columnas de forma, tipos de capacidades, avisos de compatibilidad, capacidades del paquete y resumen de hooks.

`info` es un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de Plugins, diagnósticos de manifiesto/detección y avisos de compatibilidad. Cuando todo está correcto, imprime `No plugin issues detected.`

Para fallos de forma de módulo, como exportaciones `register`/`activate` ausentes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de exportación en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de Plugins es el modelo de lectura en frío persistido de OpenClaw para la identidad del plugin instalado, su habilitación, los metadatos de origen y la propiedad de contribuciones. El inicio normal, la búsqueda del propietario del proveedor, la clasificación de la configuración del canal y el inventario de Plugins pueden leerlo sin importar módulos de tiempo de ejecución del plugin.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado o desactualizado. Usa `--refresh` para reconstruirlo a partir del registro duradero de instalaciones, la política de configuración y los metadatos del manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad de emergencia obsoleto para fallos de lectura del registro. Prefiere `plugins registry --refresh` o `openclaw doctor --fix`; la alternativa mediante variable de entorno es solo para recuperación de inicio de emergencia mientras se despliega la migración.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista de marketplace acepta una ruta de marketplace local, una ruta a `marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de origen resuelta más el manifiesto del marketplace analizado y las entradas de Plugins.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Creación de Plugins](/es/plugins/building-plugins)
- [Plugins de la comunidad](/es/plugins/community)
