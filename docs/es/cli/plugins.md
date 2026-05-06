---
read_when:
    - Desea instalar o gestionar plugins de Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de Plugin
sidebarTitle: Plugins
summary: Referencia de la CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T09:03:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Administra los plugins de Gateway, los paquetes de hooks y los paquetes compatibles.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo instalar, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Manage plugins" href="/es/plugins/manage-plugins">
    Ejemplos rápidos para instalar, listar, actualizar, desinstalar y publicar.
  </Card>
  <Card title="Plugin bundles" href="/es/plugins/bundles">
    Modelo de compatibilidad de paquetes.
  </Card>
  <Card title="Plugin manifest" href="/es/plugins/manifest">
    Campos del manifiesto y esquema de configuración.
  </Card>
  <Card title="Security" href="/es/gateway/security">
    Refuerzo de seguridad para instalaciones de plugins.
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

Para investigar instalaciones, inspecciones, desinstalaciones o actualizaciones del registro lentas, ejecuta el
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de fase
en stderr y mantiene la salida JSON analizable. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw deben incluir `openclaw.plugin.json` con un JSON Schema en línea (`configSchema`, incluso si está vacío). Los paquetes compatibles usan sus propios manifiestos de paquete en su lugar.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de paquete (`codex`, `claude` o `cursor`) junto con las capacidades de paquete detectadas.
</Note>

### Instalar

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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
Los nombres de paquete sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento. Usa `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como ejecutar código. Prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub en busca de paquetes de plugins instalables e imprime
nombres de paquete listos para instalar. Busca paquetes code-plugin y bundle-plugin,
no Skills. Usa `openclaw skills search` para Skills de ClawHub.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los plugins. Npm
sigue siendo una alternativa compatible y una ruta de instalación directa. Los paquetes de plugins
`@openclaw/*` propiedad de OpenClaw se vuelven a publicar en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables usan `latest`.
Las instalaciones y actualizaciones del canal beta prefieren el dist-tag `beta` de npm cuando esa etiqueta
está disponible y luego recurren a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escribe en ese archivo incluido y deja `openclaw.json` intacto. Los includes raíz, los arreglos de includes y los includes con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Includes de configuración](/es/gateway/configuration) para ver las formas compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma cerrada y te indica que primero ejecutes `openclaw doctor --fix`. Durante el inicio de Gateway y la recarga en caliente, una configuración de plugin no válida falla de forma cerrada como cualquier otra configuración no válida; `openclaw doctor --fix` puede poner en cuarentena la entrada de plugin no válida. La única excepción documentada en tiempo de instalación es una ruta estrecha de recuperación de plugins incluidos para plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` reutiliza el destino de instalación existente y sobrescribe in situ un plugin o paquete de hooks ya instalado. Úsalo cuando estés reinstalando intencionalmente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto de npm. Para actualizaciones rutinarias de un plugin de npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieres sobrescribir la instalación actual desde una fuente diferente.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` se aplica solo a instalaciones de npm. No es compatible con instalaciones `git:`; usa una referencia git explícita como `git:github.com/acme/plugin@v1.2.3` cuando quieras una fuente fijada. No es compatible con `--marketplace`, porque las instalaciones de marketplace conservan metadatos de fuente de marketplace en lugar de una especificación de npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos en el escáner integrado de código peligroso. Permite que la instalación continúe incluso cuando el escáner integrado informa hallazgos `critical`, pero **no** omite los bloqueos de política del hook `before_install` del plugin y **no** omite fallos de escaneo.

    Esta marca de CLI se aplica a flujos de instalación/actualización de plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan la anulación de solicitud correspondiente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo separado de descarga/instalación de Skills de ClawHub.

    Si un plugin que publicaste en ClawHub está bloqueado por un escaneo del registro, usa los pasos para publicadores en [ClawHub](/es/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para visibilidad filtrada de hooks y habilitación por hook, no para instalación de paquetes.

    Las especificaciones de npm son **solo de registro** (nombre de paquete + **versión exacta** opcional o **dist-tag**). Se rechazan especificaciones Git/URL/file y rangos semver. Las instalaciones de dependencias se ejecutan de forma local al proyecto con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene configuraciones globales de instalación de npm.

    Usa `npm:<package>` cuando quieras hacer explícita la resolución de npm. Las especificaciones de paquete sin prefijo también se instalan directamente desde npm durante la transición de lanzamiento.

    Las especificaciones sin prefijo y `@latest` permanecen en la rama estable. Las versiones correctivas con fecha de OpenClaw, como `2026.5.3-1`, son versiones estables para esta comprobación. Si npm resuelve cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente con una etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

    Si una especificación de instalación sin prefijo coincide con un id de plugin oficial (por ejemplo `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete de npm con el mismo nombre, usa una especificación con ámbito explícito (por ejemplo `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Usa `git:<repo>` para instalar directamente desde un repositorio git. Las formas compatibles incluyen `git:github.com/owner/repo`, `git:owner/repo`, URL de clonación completas `https://`, `ssh://`, `git://`, `file://` y `git@host:owner/repo.git`. Agrega `@<ref>` o `#<ref>` para hacer checkout de una rama, etiqueta o commit antes de instalar.

    Las instalaciones git clonan en un directorio temporal, hacen checkout de la referencia solicitada cuando está presente y luego usan el instalador normal del directorio de plugins. Eso significa que la validación del manifiesto, el escaneo de código peligroso, el trabajo de instalación del gestor de paquetes y los registros de instalación se comportan como instalaciones de npm. Las instalaciones git registradas incluyen la URL/referencia de origen más el commit resuelto para que `openclaw plugins update` pueda volver a resolver la fuente más tarde.

    Después de instalar desde git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime como métodos de gateway y comandos de CLI. Si el plugin registró una raíz de CLI con `api.registerCli`, ejecuta ese comando directamente a través de la CLI raíz de OpenClaw, por ejemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos de plugins nativos de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz del plugin extraído; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    Usa `npm-pack:<path.tgz>` cuando el archivo sea un tarball npm-pack y quieras
    probar la misma ruta de instalación administrada en la raíz npm que usan las instalaciones de registro,
    incluida la verificación de `package-lock.json`, el escaneo de dependencias elevadas y
    los registros de instalación de npm. Las rutas de archivo normales aún se instalan como archivos locales
    bajo la raíz de extensiones de plugins.

    Las instalaciones desde marketplace de Claude también son compatibles.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Las especificaciones de plugins compatibles con npm sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución solo por npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la compatibilidad anunciada de la API del plugin / Gateway mínimo antes de instalar. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` npm-pack versionado, verifica el encabezado de resumen de ClawHub y el resumen del artefacto, y luego lo instala mediante la ruta normal de archivo. Las versiones anteriores de ClawHub sin metadatos ClawPack aún se instalan mediante la ruta heredada de verificación de archivo de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, tipo de artefacto, integridad de npm, shasum de npm, nombre de tarball y datos de resumen de ClawPack para actualizaciones posteriores.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más nuevas de ClawHub; los selectores explícitos de versión o etiqueta como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta` permanecen fijados a ese selector.

#### Abreviatura de marketplace

Usa la abreviatura `plugin@marketplace` cuando el nombre del marketplace exista en la caché de registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplace sources">
    - un nombre de marketplace conocido por Claude de `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta de `marketplace.json`
    - una abreviatura de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL de git

  </Tab>
  <Tab title="Remote marketplace rules">
    Para los marketplaces remotos cargados desde GitHub o git, las entradas de Plugin deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta fuentes de rutas relativas de ese repositorio y rechaza HTTP(S), rutas absolutas, git, GitHub y otras fuentes de Plugin que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas locales y archivos, OpenClaw detecta automáticamente:

- Plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

<Note>
Los paquetes compatibles se instalan en la raíz normal de plugins y participan en el mismo flujo de listar/información/habilitar/deshabilitar. Actualmente, se admiten Skills de paquetes, Skills de comandos de Claude, valores predeterminados de `settings.json` de Claude, valores predeterminados de `.lsp.json` de Claude / `lspServers` declarados en el manifiesto, Skills de comandos de Cursor y directorios de hooks de Codex compatibles; otras capacidades de paquetes detectadas se muestran en diagnósticos/información, pero aún no están conectadas a la ejecución en runtime.
</Note>

### Lista

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
  Muestra solo los plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Cambia de la vista de tabla a líneas de detalle por Plugin con metadatos de fuente/origen/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina, más diagnósticos del registro y estado de instalación de dependencias de paquetes.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistente de plugins, con una alternativa derivada solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un Plugin está instalado, habilitado y visible para la planificación de arranque en frío, pero no es una sonda en vivo del runtime de un proceso Gateway ya en ejecución. Después de cambiar el código de un Plugin, su habilitación, la política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecuten nuevo código `register(api)` o hooks. Para despliegues remotos/en contenedores, verifica que estás reiniciando el proceso hijo real de `openclaw gateway run`, no solo un proceso envoltorio.

`plugins list --json` incluye el `dependencyStatus` de cada Plugin desde `package.json`
`dependencies` y `optionalDependencies`. OpenClaw comprueba si esos nombres de paquete
están presentes a lo largo de la ruta normal de búsqueda `node_modules` de Node del Plugin; no
importa el código de runtime del Plugin, ejecuta un gestor de paquetes ni repara
dependencias faltantes.
</Note>

`plugins search` es una búsqueda remota en el catálogo de ClawHub. No inspecciona el
estado local, muta la configuración, instala paquetes ni carga código de runtime del Plugin. Los
resultados de búsqueda incluyen el nombre del paquete de ClawHub, familia, canal, versión, resumen y
una sugerencia de instalación como `openclaw plugins install clawhub:<package>`.

Para trabajar con un Plugin incluido dentro de una imagen Docker empaquetada, monta con bind el directorio
fuente del Plugin sobre la ruta de origen empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw descubrirá esa superposición de fuente montada
antes de `/app/dist/extensions/synology-chat`; un directorio de fuente copiado sin más
permanece inerte, de modo que las instalaciones empaquetadas normales siguen usando el dist compilado.

Para depurar hooks en runtime:

- `openclaw plugins inspect <id> --runtime --json` muestra hooks registrados y diagnósticos de una pasada de inspección con módulo cargado. La inspección en runtime nunca instala dependencias; usa `openclaw doctor --fix` para limpiar el estado de dependencias heredado o recuperar plugins descargables faltantes que estén referenciados por la configuración.
- `openclaw gateway status --deep --require-rpc` confirma el Gateway alcanzable, indicios de servicio/proceso, ruta de configuración y salud de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local (lo agrega a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la ruta de origen en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice de plugins gestionados mientras se mantiene sin fijar el comportamiento predeterminado.
</Note>

### Índice de Plugin

Los metadatos de instalación de Plugin son estado gestionado por máquina, no configuración de usuario. Las instalaciones y actualizaciones lo escriben en `plugins/installs.json` bajo el directorio de estado activo de OpenClaw. Su mapa de nivel superior `installRecords` es la fuente duradera de metadatos de instalación, incluidos registros de manifiestos de Plugin rotos o faltantes. El arreglo `plugins` es la caché de registro en frío derivada del manifiesto. El archivo incluye una advertencia de no editar y lo usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro de plugins en frío.

Cuando OpenClaw ve registros heredados enviados `plugins.installs` en la configuración, los mueve al índice de plugins y elimina la clave de configuración; si cualquiera de las escrituras falla, se conservan los registros de configuración para que no se pierdan los metadatos de instalación.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina registros de Plugin de `plugins.entries`, el índice persistente de plugins, entradas de listas de permisos/denegaciones de Plugin y entradas enlazadas de `plugins.load.paths` cuando corresponde. A menos que se defina `--keep-files`, la desinstalación también elimina el directorio de instalación gestionado rastreado cuando está dentro de la raíz de extensiones de plugins de OpenClaw. Para plugins de memoria activa, el slot de memoria se restablece a `memory-core`.

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

Las actualizaciones se aplican a instalaciones de Plugin rastreadas en el índice de plugins gestionados y a instalaciones de hook-pack rastreadas en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese Plugin. Eso significa que dist-tags almacenados previamente, como `@beta`, y versiones exactas fijadas se siguen usando en ejecuciones posteriores de `update <id>`.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con un dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de Plugin rastreado, actualiza ese Plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre de paquete npm sin una versión ni etiqueta también resuelve de vuelta al registro de Plugin rastreado. Usa esto cuando un Plugin estaba fijado a una versión exacta y quieres devolverlo a la línea de publicación predeterminada del registro.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` reutiliza la especificación de Plugin rastreada salvo que pases una nueva especificación. `openclaw update` además conoce el canal activo de actualización de OpenClaw: en el canal beta, los registros de Plugin npm y ClawHub de línea predeterminada prueban primero `@beta` y luego recurren a la especificación predeterminada/latest registrada si no existe ninguna publicación beta del Plugin. Las versiones exactas y etiquetas explícitas permanecen fijadas a ese selector.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado frente a los metadatos del registro npm. Si la versión instalada y la identidad registrada del artefacto ya coinciden con el destino resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y el hash del artefacto obtenido cambia, OpenClaw lo trata como deriva de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real y pide confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan de forma cerrada salvo que el llamador proporcione una política explícita de continuación.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` también está disponible en `plugins update` como anulación de emergencia para falsos positivos del escaneo de código peligroso incorporado durante actualizaciones de Plugin. Aun así, no omite bloqueos de política `before_install` del Plugin ni bloqueos por fallo de escaneo, y solo se aplica a actualizaciones de Plugin, no a actualizaciones de hook-pack.
  </Accordion>
</AccordionGroup>

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspeccionar muestra identidad, estado de carga, fuente, capacidades del manifiesto, marcas de política, diagnósticos, metadatos de instalación, capacidades de paquetes y cualquier soporte detectado para servidores MCP o LSP sin importar de forma predeterminada el runtime del Plugin. Agrega `--runtime` para cargar el módulo del Plugin e incluir hooks, herramientas, comandos, servicios, métodos Gateway y rutas HTTP registrados. La inspección en runtime informa directamente dependencias faltantes del Plugin; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos CLI propiedad del Plugin se instalan como grupos raíz de comandos `openclaw`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútalo como `openclaw <command> ...`; por ejemplo, un Plugin que registra `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada Plugin se clasifica por lo que realmente registra en runtime:

- **plain-capability** — un tipo de capacidad (por ejemplo, un Plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capacidades

Consulta [Formas de Plugin](/es/plugins/architecture#plugin-shapes) para más información sobre el modelo de capacidades.

<Note>
La marca `--json` genera un informe legible por máquina apto para scripts y auditorías. `inspect --all` renderiza una tabla de toda la flota con columnas de forma, clases de capacidad, avisos de compatibilidad, capacidades de paquetes y resumen de hooks. `info` es un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de plugins, diagnósticos de manifiesto/descubrimiento y avisos de compatibilidad. Cuando todo está limpio, imprime `No plugin issues detected.`

Si un Plugin configurado está presente en disco, pero lo bloquean las comprobaciones de seguridad de ruta del cargador, la validación de configuración conserva la entrada del Plugin y lo informa como `present but blocked`. Corrige el diagnóstico previo de Plugin bloqueado, como la propiedad de la ruta o permisos de escritura para todos, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para fallos de forma de módulo, como exports `register`/`activate` faltantes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de exports en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo de lectura en frío persistido de OpenClaw para la identidad de plugins instalados, habilitación, metadatos de origen y propiedad de contribuciones. El inicio normal, la búsqueda del propietario del proveedor, la clasificación de configuración del canal y el inventario de plugins pueden leerlo sin importar módulos de tiempo de ejecución de plugins.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado u obsoleto. Usa `--refresh` para reconstruirlo a partir del índice de plugins persistido, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

`openclaw doctor --fix` también repara la desviación de npm administrado adyacente al registro: si un paquete `@openclaw/*` huérfano o recuperado bajo la raíz npm administrada de plugins oculta un plugin incluido, doctor elimina ese paquete obsoleto y reconstruye el registro para que el inicio valide contra el manifiesto incluido.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad de emergencia obsoleto para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; la alternativa mediante env es solo para recuperación de inicio de emergencia mientras se despliega la migración.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista de Marketplace acepta una ruta local de marketplace, una ruta `marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de origen resuelta junto con el manifiesto de marketplace analizado y las entradas de plugins.

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins)
- [Referencia de la CLI](/es/cli)
- [Plugins de la comunidad](/es/plugins/community)
