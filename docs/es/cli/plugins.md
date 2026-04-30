---
read_when:
    - Quieres instalar o gestionar plugins de Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de Plugin
sidebarTitle: Plugins
summary: Referencia de CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-30T05:35:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Administra los plugins de Gateway, los paquetes de hooks y los bundles compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de Plugin" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo instalar, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Bundles de Plugin" href="/es/plugins/bundles">
    Modelo de compatibilidad de bundles.
  </Card>
  <Card title="Manifiesto de Plugin" href="/es/plugins/manifest">
    Campos del manifiesto y esquema de configuración.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security">
    Refuerzo de seguridad para instalaciones de plugins.
  </Card>
</CardGroup>

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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Para investigar instalaciones, inspecciones, desinstalaciones o actualizaciones del registro lentas, ejecuta el
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de las fases
en stderr y mantiene la salida JSON analizable. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw deben incluir `openclaw.plugin.json` con un esquema JSON inline (`configSchema`, incluso si está vacío). Los bundles compatibles usan en su lugar sus propios manifiestos de bundle.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de bundle (`codex`, `claude` o `cursor`) más las capacidades detectadas del bundle.
</Note>

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Los nombres de paquete sin prefijo se comprueban primero en ClawHub y después en npm. Trata las instalaciones de plugins como ejecutar código. Prefiere versiones fijadas.
</Warning>

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los plugins. Npm
sigue siendo una ruta compatible de respaldo e instalación directa. Durante la migración a
ClawHub, OpenClaw todavía distribuye algunos paquetes de plugins `@openclaw/*` propiedad de OpenClaw
en npm; esas versiones de paquetes pueden ir por detrás del código fuente incluido entre trenes de lanzamiento de plugins. Si npm marca un paquete de plugin propiedad de OpenClaw como obsoleto, esa
versión publicada es un artefacto externo antiguo; usa el plugin incluido con
la versión actual de OpenClaw o un checkout local hasta que se publique un paquete npm más reciente.
</Note>

<AccordionGroup>
  <Accordion title="Inclusiones de configuración y recuperación de configuración no válida">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escribe en ese archivo incluido y deja `openclaw.json` intacto. Las inclusiones raíz, los arreglos de inclusiones y las inclusiones con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Inclusiones de configuración](/es/gateway/configuration) para ver las formas compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma cerrada y te indica que primero ejecutes `openclaw doctor --fix`. Durante el inicio de Gateway, la configuración no válida de un plugin se aísla en ese plugin para que otros canales y plugins puedan seguir ejecutándose; `openclaw doctor --fix` puede poner en cuarentena la entrada de plugin no válida. La única excepción documentada en tiempo de instalación es una ruta estrecha de recuperación de plugins incluidos para plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalación frente a actualización">
    `--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un plugin o paquete de hooks ya instalado. Úsalo cuando estés reinstalando intencionalmente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto de npm. Para actualizaciones rutinarias de un plugin de npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de plugin que ya está instalado, OpenClaw se detiene y te señala `plugins update <id-or-npm-spec>` para una actualización normal, o `plugins install <package> --force` cuando realmente quieres sobrescribir la instalación actual desde una fuente diferente.

  </Accordion>
  <Accordion title="Alcance de --pin">
    `--pin` solo se aplica a instalaciones de npm. No es compatible con `--marketplace`, porque las instalaciones de marketplace conservan metadatos de fuente de marketplace en lugar de una especificación de npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos en el escáner integrado de código peligroso. Permite que la instalación continúe incluso cuando el escáner integrado informa hallazgos `critical`, pero **no** omite los bloqueos de política del hook `before_install` del plugin y **no** omite los fallos de escaneo.

    Esta bandera de CLI se aplica a los flujos de instalación/actualización de plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan la sobrescritura de solicitud correspondiente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo separado de descarga/instalación de Skills desde ClawHub.

    Si un plugin que publicaste en ClawHub está bloqueado por un escaneo del registro, usa los pasos para publicadores en [ClawHub](/es/tools/clawhub).

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones de npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para visibilidad filtrada de hooks y habilitación por hook, no para instalación de paquetes.

    Las especificaciones de npm son **solo de registro** (nombre de paquete + **versión exacta** opcional o **dist-tag**). Se rechazan especificaciones Git/URL/archivo y rangos semver. Las instalaciones de dependencias se ejecutan en el proyecto local con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene configuraciones globales de instalación de npm.

    Usa `npm:<package>` cuando quieras omitir la búsqueda en ClawHub e instalar directamente desde npm. Las especificaciones de paquete sin prefijo siguen prefiriendo ClawHub y solo recurren a npm cuando ClawHub no tiene ese paquete o versión.

    Las especificaciones sin prefijo y `@latest` permanecen en el canal estable. Si npm resuelve cualquiera de esas a una versión preliminar, OpenClaw se detiene y te pide optar explícitamente con una etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

    Si una especificación de instalación sin prefijo coincide con un id de plugin incluido (por ejemplo, `diffs`), OpenClaw instala directamente el plugin incluido. Para instalar un paquete de npm con el mismo nombre, usa una especificación con ámbito explícito (por ejemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Archivos">
    Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos de plugins nativos de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz del plugin extraído; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    También se admiten instalaciones desde marketplace de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ahora también prefiere ClawHub para especificaciones de plugins sin prefijo seguras para npm. Solo recurre a npm si ClawHub no tiene ese paquete o versión:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para forzar una resolución solo por npm, por ejemplo cuando ClawHub no está disponible o sabes que el paquete existe solo en npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw descarga el archivo del paquete desde ClawHub, comprueba la API de plugin anunciada / la compatibilidad mínima de gateway y luego lo instala por la ruta normal de archivo. Las instalaciones registradas conservan sus metadatos de fuente de ClawHub para actualizaciones posteriores.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más recientes de ClawHub; los selectores explícitos de versión o etiqueta como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta` permanecen fijados a ese selector.

#### Abreviatura de marketplace

Usa la abreviatura `plugin@marketplace` cuando el nombre de marketplace exista en la caché de registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` cuando quieras pasar la fuente de marketplace explícitamente:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Fuentes de marketplace">
    - un nombre de marketplace conocido de Claude desde `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta `marketplace.json`
    - una abreviatura de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL de git

  </Tab>
  <Tab title="Reglas de marketplaces remotos">
    Para marketplaces remotos cargados desde GitHub o git, las entradas de plugins deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta fuentes de ruta relativa desde ese repositorio y rechaza HTTP(S), rutas absolutas, git, GitHub y otras fuentes de plugins que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas locales y archivos, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- bundles compatibles con Codex (`.codex-plugin/plugin.json`)
- bundles compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- bundles compatibles con Cursor (`.cursor-plugin/plugin.json`)

<Note>
Los bundles compatibles se instalan en la raíz normal de plugins y participan en el mismo flujo de list/info/enable/disable. Actualmente, se admiten Skills de bundle, command-skills de Claude, valores predeterminados `settings.json` de Claude, valores predeterminados `.lsp.json` / `lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks compatibles de Codex; otras capacidades detectadas de bundles se muestran en diagnósticos/info, pero todavía no están conectadas a la ejecución en tiempo de ejecución.
</Note>

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Muestra solo los plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Cambia de la vista de tabla a líneas de detalle por plugin con metadatos de fuente/origen/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina más diagnósticos del registro.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistido de Plugin, con una alternativa derivada solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un Plugin está instalado, habilitado y visible para la planificación de inicio en frío, pero no es una prueba en vivo del runtime de un proceso de Gateway que ya está en ejecución. Después de cambiar el código de un Plugin, su habilitación, la política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecute código nuevo de `register(api)` o hooks nuevos. Para despliegues remotos/en contenedores, verifica que estás reiniciando el proceso hijo real de `openclaw gateway run`, no solo un proceso envoltorio.
</Note>

Para trabajo con Plugins incluidos dentro de una imagen Docker empaquetada, monta con bind el directorio de código fuente del Plugin sobre la ruta de código fuente empaquetada correspondiente, como `/app/extensions/synology-chat`. OpenClaw descubrirá esa superposición de fuente montada antes de `/app/dist/extensions/synology-chat`; un directorio de fuente copiado sin más permanecerá inerte, de modo que las instalaciones empaquetadas normales seguirán usando el dist compilado.

Para depurar hooks en runtime:

- `openclaw plugins inspect <id> --json` muestra los hooks registrados y los diagnósticos de una pasada de inspección con el módulo cargado.
- `openclaw gateway status --deep --require-rpc` confirma el Gateway alcanzable, pistas de servicio/proceso, ruta de configuración y salud de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local (lo añade a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` no es compatible con `--link` porque las instalaciones vinculadas reutilizan la ruta de origen en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice de Plugins gestionados, manteniendo sin fijar el comportamiento predeterminado.
</Note>

### Índice de Plugin

Los metadatos de instalación de Plugin son estado gestionado por la máquina, no configuración del usuario. Las instalaciones y actualizaciones los escriben en `plugins/installs.json` dentro del directorio de estado activo de OpenClaw. Su mapa de nivel superior `installRecords` es la fuente duradera de metadatos de instalación, incluidos los registros de manifiestos de Plugin rotos o faltantes. El arreglo `plugins` es la caché de registro en frío derivada del manifiesto. El archivo incluye una advertencia de no editar y lo usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro en frío de Plugins.

Cuando OpenClaw ve registros heredados enviados de `plugins.installs` en la configuración, los mueve al índice de Plugins y elimina la clave de configuración; si alguna escritura falla, los registros de configuración se conservan para que no se pierdan los metadatos de instalación.

### Dependencias de runtime

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` inspecciona la etapa de dependencias de runtime empaquetadas para Plugins incluidos propiedad de OpenClaw seleccionados por la configuración de Plugins, canales habilitados/configurados, proveedores de modelos configurados o valores predeterminados de manifiestos incluidos. No es la ruta de instalación/actualización para Plugins npm de terceros o de ClawHub.

Usa `--repair` cuando una instalación empaquetada informa dependencias de runtime incluidas faltantes durante el arranque del Gateway o `plugins doctor`. La reparación instala solo las dependencias faltantes de Plugins incluidos habilitados, con los scripts de ciclo de vida deshabilitados. Usa `--prune` para eliminar raíces externas obsoletas y desconocidas de dependencias de runtime dejadas por diseños empaquetados anteriores.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina registros de Plugin de `plugins.entries`, el índice persistido de Plugins, entradas de listas de permiso/denegación de Plugins y entradas vinculadas de `plugins.load.paths` cuando corresponde. A menos que `--keep-files` esté establecido, la desinstalación también elimina el directorio de instalación gestionado rastreado cuando está dentro de la raíz de extensiones de Plugins de OpenClaw. Para Plugins de memoria activa, la ranura de memoria se restablece a `memory-core`.

<Note>
`--keep-config` es compatible como alias obsoleto de `--keep-files`.
</Note>

### Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a instalaciones de Plugins rastreadas en el índice gestionado de Plugins y a instalaciones rastreadas de paquetes de hooks en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de Plugin frente a especificación npm">
    Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese Plugin. Eso significa que dist-tags almacenados previamente, como `@beta`, y versiones exactas fijadas se siguen usando en ejecuciones posteriores de `update <id>`.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con un dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de Plugin rastreado, actualiza ese Plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre del paquete npm sin versión ni etiqueta también se resuelve de vuelta al registro de Plugin rastreado. Usa esto cuando un Plugin estaba fijado a una versión exacta y quieres devolverlo a la línea de lanzamiento predeterminada del registro.

  </Accordion>
  <Accordion title="Comprobaciones de versión y deriva de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado contra los metadatos del registro npm. Si la versión instalada y la identidad del artefacto registrada ya coinciden con el objetivo resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y el hash del artefacto obtenido cambia, OpenClaw trata eso como deriva de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real, y pide confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan de forma cerrada a menos que quien llama proporcione una política de continuación explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en update">
    `--dangerously-force-unsafe-install` también está disponible en `plugins update` como anulación de emergencia para falsos positivos del escaneo integrado de código peligroso durante actualizaciones de Plugins. Aun así, no evita bloqueos de política `before_install` del Plugin ni bloqueos por fallos de escaneo, y solo se aplica a actualizaciones de Plugins, no a actualizaciones de paquetes de hooks.
  </Accordion>
</AccordionGroup>

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspección profunda de un solo Plugin. Muestra identidad, estado de carga, origen, capacidades registradas, hooks, herramientas, comandos, servicios, métodos de Gateway, rutas HTTP, marcas de política, diagnósticos, metadatos de instalación, capacidades del paquete y cualquier soporte detectado para servidores MCP o LSP.

Cada Plugin se clasifica por lo que registra realmente en runtime:

- **plain-capability** — un tipo de capacidad (por ejemplo, un Plugin solo de proveedor)
- **hybrid-capability** — múltiples tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capacidades

Consulta [Formas de Plugin](/es/plugins/architecture#plugin-shapes) para más información sobre el modelo de capacidades.

<Note>
La marca `--json` genera un informe legible por máquina apto para scripts y auditorías. `inspect --all` muestra una tabla de toda la flota con columnas de forma, tipos de capacidad, avisos de compatibilidad, capacidades del paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

### Diagnóstico

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de Plugins, diagnósticos de manifiesto/descubrimiento y avisos de compatibilidad. Cuando todo está limpio, imprime `No plugin issues detected.`

Para fallos de forma de módulo como exportaciones faltantes de `register`/`activate`, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de forma de exportaciones en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de Plugins es el modelo de lectura en frío persistido de OpenClaw para identidad de Plugins instalados, habilitación, metadatos de origen y propiedad de contribuciones. El arranque normal, la búsqueda de propietario de proveedor, la clasificación de configuración de canales y el inventario de Plugins pueden leerlo sin importar módulos de runtime de Plugins.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado u obsoleto. Usa `--refresh` para reconstruirlo desde el índice persistido de Plugins, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación de runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad de emergencia obsoleto para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; la alternativa por variable de entorno es solo para recuperación de emergencia de arranque mientras se despliega la migración.
</Warning>

### Mercado

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista de mercado acepta una ruta local de mercado, una ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL git. `--json` imprime la etiqueta de origen resuelta junto con el manifiesto de mercado analizado y las entradas de Plugin.

## Relacionado

- [Crear Plugins](/es/plugins/building-plugins)
- [Referencia de CLI](/es/cli)
- [Plugins de la comunidad](/es/plugins/community)
