---
read_when:
    - Quiere instalar o gestionar plugins de Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de Plugin
sidebarTitle: Plugins
summary: Referencia de CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T22:17:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

Gestiona Plugins de Gateway, paquetes de hooks y bundles compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de Plugins" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo instalar, activar y solucionar problemas de Plugins.
  </Card>
  <Card title="Gestionar Plugins" href="/es/plugins/manage-plugins">
    Ejemplos rápidos para instalar, listar, actualizar, desinstalar y publicar.
  </Card>
  <Card title="Bundles de Plugins" href="/es/plugins/bundles">
    Modelo de compatibilidad de bundles.
  </Card>
  <Card title="Manifiesto de Plugin" href="/es/plugins/manifest">
    Campos del manifiesto y esquema de configuración.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security">
    Refuerzo de seguridad para instalaciones de Plugins.
  </Card>
</CardGroup>

## Comandos

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
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

Para investigar instalaciones, inspecciones, desinstalaciones o actualizaciones de registro lentas, ejecuta el comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de fase en stderr y mantiene la salida JSON analizable. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
Los Plugins incluidos se distribuyen con OpenClaw. Algunos están activados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el Plugin de navegador incluido); otros requieren `plugins enable`.

Los Plugins nativos de OpenClaw deben distribuir `openclaw.plugin.json` con un JSON Schema en línea (`configSchema`, incluso si está vacío). Los bundles compatibles usan sus propios manifiestos de bundle.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de bundle (`codex`, `claude` o `cursor`) junto con las capacidades de bundle detectadas.
</Note>

### Instalar

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Los nombres de paquetes sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento. Usa `clawhub:<package>` para ClawHub. Trata las instalaciones de Plugins como ejecutar código. Prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub en busca de paquetes de Plugins instalables e imprime nombres de paquetes listos para instalar. Busca paquetes code-plugin y bundle-plugin, no Skills. Usa `openclaw skills search` para Skills de ClawHub.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los Plugins. Npm sigue siendo una ruta de respaldo y de instalación directa compatible. Los paquetes de Plugins `@openclaw/*` propiedad de OpenClaw vuelven a publicarse en npm; consulta la lista actual en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el [inventario de Plugins](/es/plugins/plugin-inventory). Las instalaciones estables usan `latest`. Las instalaciones y actualizaciones del canal beta prefieren el dist-tag `beta` de npm cuando esa etiqueta está disponible y luego recurren a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuración y recuperación de configuración no válida">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escriben en ese archivo incluido y dejan `openclaw.json` sin cambios. Los includes raíz, los arrays de includes y los includes con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Includes de configuración](/es/gateway/configuration) para ver las formas compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma cerrada y te indica que ejecutes primero `openclaw doctor --fix`. Durante el inicio de Gateway, la configuración no válida de un Plugin se aísla a ese Plugin para que otros canales y Plugins puedan seguir ejecutándose; `openclaw doctor --fix` puede poner en cuarentena la entrada de Plugin no válida. La única excepción documentada en tiempo de instalación es una ruta limitada de recuperación de Plugins incluidos para Plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalar frente a actualizar">
    `--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un Plugin o paquete de hooks ya instalado. Úsalo cuando estés reinstalando intencionalmente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto de npm. Para actualizaciones rutinarias de un Plugin de npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de Plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieras sobrescribir la instalación actual desde una fuente diferente.

  </Accordion>
  <Accordion title="Alcance de --pin">
    `--pin` solo se aplica a instalaciones de npm. No es compatible con instalaciones `git:`; usa una ref de git explícita, como `git:github.com/acme/plugin@v1.2.3`, cuando quieras una fuente fijada. No es compatible con `--marketplace`, porque las instalaciones de marketplace persisten metadatos de origen de marketplace en lugar de una especificación de npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos en el escáner integrado de código peligroso. Permite que la instalación continúe incluso cuando el escáner integrado informa hallazgos `critical`, pero **no** omite los bloqueos de política de hooks `before_install` de Plugins y **no** omite fallos de escaneo.

    Esta marca de CLI se aplica a flujos de instalación/actualización de Plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan la anulación de solicitud correspondiente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo separado de descarga/instalación de Skills de ClawHub.

    Si un Plugin que publicaste en ClawHub queda bloqueado por un escaneo de registro, usa los pasos para publicadores en [ClawHub](/es/tools/clawhub).

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones de npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para la visibilidad filtrada de hooks y la activación por hook, no para la instalación de paquetes.

    Las especificaciones de npm son **solo de registro** (nombre de paquete + **versión exacta** opcional o **dist-tag**). Las especificaciones Git/URL/file y los rangos semver se rechazan. Las instalaciones de dependencias se ejecutan de forma local al proyecto con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene configuraciones globales de instalación de npm.

    Usa `npm:<package>` cuando quieras hacer explícita la resolución de npm. Las especificaciones de paquete sin prefijo también se instalan directamente desde npm durante la transición de lanzamiento.

    Las especificaciones sin prefijo y `@latest` se mantienen en la pista estable. Si npm resuelve cualquiera de esas a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente con una etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

    Si una especificación de instalación sin prefijo coincide con un id oficial de Plugin (por ejemplo, `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete de npm con el mismo nombre, usa una especificación con scope explícito (por ejemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio git. Las formas compatibles incluyen `git:github.com/owner/repo`, `git:owner/repo`, URLs de clonación completas `https://`, `ssh://`, `git://`, `file://` y `git@host:owner/repo.git`. Agrega `@<ref>` o `#<ref>` para hacer checkout de una rama, etiqueta o commit antes de instalar.

    Las instalaciones Git clonan en un directorio temporal, hacen checkout de la ref solicitada cuando existe y luego usan el instalador normal de directorios de Plugins. Eso significa que la validación del manifiesto, el escaneo de código peligroso, el trabajo de instalación del gestor de paquetes y los registros de instalación se comportan como instalaciones de npm. Las instalaciones Git registradas incluyen la URL/ref de origen más el commit resuelto para que `openclaw plugins update` pueda volver a resolver la fuente más adelante.

    Después de instalar desde git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime como métodos de gateway y comandos de CLI. Si el Plugin registró una raíz de CLI con `api.registerCli`, ejecuta ese comando directamente mediante la CLI raíz de OpenClaw, por ejemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos">
    Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos de Plugins nativos de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz extraída del Plugin; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    También se admiten instalaciones desde marketplace de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Las especificaciones de Plugins seguras para npm sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución solo de npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la API de Plugin anunciada y la compatibilidad mínima con Gateway antes de instalar. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` versionado de npm-pack, verifica el encabezado de digest de ClawHub y el digest del artefacto, y luego lo instala mediante la ruta normal de archivos. Las versiones anteriores de ClawHub sin metadatos ClawPack siguen instalándose mediante la ruta heredada de verificación de archivos de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, tipo de artefacto, integridad de npm, shasum de npm, nombre de tarball y datos de digest de ClawPack para actualizaciones posteriores.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más nuevas de ClawHub; los selectores explícitos de versión o etiqueta como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta` permanecen fijados a ese selector.

#### Abreviatura de marketplace

Usa la abreviatura `plugin@marketplace` cuando el nombre del marketplace exista en la caché del registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` cuando quieras pasar explícitamente la fuente del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Fuentes de marketplace">
    - un nombre de marketplace conocido de Claude de `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta `marketplace.json`
    - una forma abreviada de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL de git

  </Tab>
  <Tab title="Reglas de marketplace remoto">
    Para marketplaces remotos cargados desde GitHub o git, las entradas de plugins deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta fuentes de ruta relativas desde ese repositorio y rechaza fuentes de Plugin HTTP(S), de ruta absoluta, git, GitHub y otras que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas y archivos locales, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

<Note>
Los paquetes compatibles se instalan en la raíz normal de plugins y participan en el mismo flujo de listar/información/activar/desactivar. Hoy se admiten las Skills de paquete, las Skills de comando de Claude, los valores predeterminados de Claude `settings.json`, los valores predeterminados de Claude `.lsp.json` / `lspServers` declarados en el manifiesto, las Skills de comando de Cursor y los directorios de hooks compatibles de Codex; otras capacidades de paquete detectadas se muestran en diagnósticos/información, pero aún no están conectadas a la ejecución en tiempo de ejecución.
</Note>

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Muestra solo los plugins activados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Cambia de la vista de tabla a líneas de detalle por Plugin con metadatos de fuente/origen/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina junto con diagnósticos del registro y estado de instalación de dependencias del paquete.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistido de plugins, con una alternativa derivada solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un Plugin está instalado, activado y visible para la planificación de arranque en frío, pero no es una sonda en vivo del tiempo de ejecución de un proceso Gateway que ya se está ejecutando. Después de cambiar el código de un Plugin, su activación, la política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecute código nuevo de `register(api)` o hooks. Para despliegues remotos/en contenedor, verifica que estés reiniciando el proceso hijo real `openclaw gateway run`, no solo un proceso envoltorio.

`plugins list --json` incluye el `dependencyStatus` de cada Plugin desde `package.json`
`dependencies` y `optionalDependencies`. OpenClaw comprueba si esos nombres de paquete
están presentes a lo largo de la ruta normal de búsqueda `node_modules` de Node del Plugin; no
importa código de tiempo de ejecución del Plugin, no ejecuta un gestor de paquetes ni repara
dependencias faltantes.
</Note>

`plugins search` es una búsqueda remota en el catálogo de ClawHub. No inspecciona el
estado local, no modifica la configuración, no instala paquetes ni carga código de tiempo de ejecución de plugins. Los
resultados de búsqueda incluyen el nombre del paquete de ClawHub, la familia, el canal, la versión, el resumen y
una pista de instalación como `openclaw plugins install clawhub:<package>`.

Para trabajar con plugins incluidos dentro de una imagen Docker empaquetada, monta con bind el directorio
de código fuente del Plugin sobre la ruta de código fuente empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw descubrirá esa superposición de código fuente montada
antes de `/app/dist/extensions/synology-chat`; un directorio de código fuente simplemente copiado
permanece inerte para que las instalaciones empaquetadas normales sigan usando el dist compilado.

Para depurar hooks en tiempo de ejecución:

- `openclaw plugins inspect <id> --runtime --json` muestra hooks registrados y diagnósticos de una pasada de inspección con el módulo cargado. La inspección en tiempo de ejecución nunca instala dependencias; usa `openclaw doctor --fix` para limpiar el estado de dependencias heredado o instalar plugins descargables configurados que falten.
- `openclaw gateway status --deep --require-rpc` confirma el Gateway accesible, indicios de servicio/proceso, ruta de configuración y estado de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local (lo añade a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la ruta de origen en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice de plugins gestionado, manteniendo sin fijar el comportamiento predeterminado.
</Note>

### Índice de plugins

Los metadatos de instalación de plugins son estado gestionado por máquina, no configuración de usuario. Las instalaciones y actualizaciones los escriben en `plugins/installs.json` dentro del directorio de estado activo de OpenClaw. Su mapa de nivel superior `installRecords` es la fuente duradera de metadatos de instalación, incluidos registros de manifiestos de plugins rotos o faltantes. El array `plugins` es la caché de registro en frío derivada del manifiesto. El archivo incluye una advertencia de no editar y lo usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro en frío de plugins.

Cuando OpenClaw ve registros heredados enviados `plugins.installs` en la configuración, los mueve al índice de plugins y elimina la clave de configuración; si falla alguna escritura, los registros de configuración se conservan para que los metadatos de instalación no se pierdan.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina registros de plugins de `plugins.entries`, del índice persistido de plugins, de las entradas de listas de permitir/denegar plugins y de las entradas enlazadas de `plugins.load.paths` cuando corresponde. A menos que se establezca `--keep-files`, la desinstalación también elimina el directorio rastreado de instalación gestionada cuando está dentro de la raíz de extensiones de plugins de OpenClaw. Para plugins de Active Memory, la ranura de memoria se restablece a `memory-core`.

<Note>
`--keep-config` se admite como alias obsoleto de `--keep-files`.
</Note>

### Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a instalaciones de plugins rastreadas en el índice de plugins gestionado y a instalaciones de paquetes de hooks rastreadas en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de Plugin frente a especificación npm">
    Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese Plugin. Esto significa que las dist-tags almacenadas previamente como `@beta` y las versiones exactas fijadas seguirán usándose en ejecuciones posteriores de `update <id>`.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con una dist-tag o versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de Plugin rastreado, actualiza ese Plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre del paquete npm sin versión ni etiqueta también se resuelve de vuelta al registro de Plugin rastreado. Usa esto cuando un Plugin estaba fijado a una versión exacta y quieras moverlo de vuelta a la línea de lanzamiento predeterminada del registro.

  </Accordion>
  <Accordion title="Actualizaciones del canal beta">
    `openclaw plugins update` reutiliza la especificación de Plugin rastreada a menos que pases una especificación nueva. `openclaw update` también conoce el canal de actualización activo de OpenClaw: en el canal beta, los registros de plugins npm y ClawHub de línea predeterminada intentan primero `@beta` y luego recurren a la especificación predeterminada/latest registrada si no existe una versión beta del Plugin. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector.

  </Accordion>
  <Accordion title="Comprobaciones de versión y deriva de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado contra los metadatos del registro npm. Si la versión instalada y la identidad del artefacto registrada ya coinciden con el destino resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido, OpenClaw lo trata como deriva de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real y pide confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan en modo cerrado a menos que el llamador proporcione una política explícita de continuación.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en update">
    `--dangerously-force-unsafe-install` también está disponible en `plugins update` como anulación de emergencia para falsos positivos del escaneo integrado de código peligroso durante actualizaciones de plugins. Aun así, no evita los bloqueos de política `before_install` del Plugin ni el bloqueo por fallo de escaneo, y solo se aplica a actualizaciones de plugins, no a actualizaciones de paquetes de hooks.
  </Accordion>
</AccordionGroup>

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect muestra identidad, estado de carga, fuente, capacidades del manifiesto, indicadores de política, diagnósticos, metadatos de instalación, capacidades de paquete y cualquier soporte detectado de servidor MCP o LSP sin importar el tiempo de ejecución del Plugin de forma predeterminada. Añade `--runtime` para cargar el módulo del Plugin e incluir hooks, herramientas, comandos, servicios, métodos de Gateway y rutas HTTP registrados. La inspección en tiempo de ejecución informa directamente dependencias faltantes del Plugin; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos CLI propiedad de plugins se instalan como grupos de comandos raíz `openclaw`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútalo como `openclaw <command> ...`; por ejemplo, un Plugin que registra `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada Plugin se clasifica por lo que realmente registra en tiempo de ejecución:

- **plain-capability** — un tipo de capacidad (por ejemplo, un Plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capacidades

Consulta [formas de Plugin](/es/plugins/architecture#plugin-shapes) para más información sobre el modelo de capacidades.

<Note>
La marca `--json` emite un informe legible por máquina adecuado para scripts y auditoría. `inspect --all` renderiza una tabla para toda la flota con columnas de forma, tipos de capacidad, avisos de compatibilidad, capacidades de paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de plugins, diagnósticos de manifiesto/descubrimiento y avisos de compatibilidad. Cuando todo está limpio, imprime `No plugin issues detected.`

Para fallos de forma de módulo como exportaciones `register`/`activate` faltantes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de exportación en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo persistido de lectura en frío de OpenClaw para identidad, activación, metadatos de fuente y propiedad de contribuciones de plugins instalados. El arranque normal, la búsqueda de propietario de proveedor, la clasificación de configuración de canales y el inventario de plugins pueden leerlo sin importar módulos de tiempo de ejecución de plugins.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, está actualizado o está obsoleto. Usa `--refresh` para reconstruirlo desde el índice persistido de plugins, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad de emergencia obsoleto para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; el mecanismo alternativo de entorno es solo para la recuperación de inicio de emergencia mientras se despliega la migración.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista del marketplace acepta una ruta de marketplace local, una ruta de `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de origen resuelta más el manifiesto de marketplace analizado y las entradas de plugins.

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins)
- [Referencia de CLI](/es/cli)
- [Plugins comunitarios](/es/plugins/community)
