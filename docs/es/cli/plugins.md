---
read_when:
    - Quieres instalar o gestionar plugins de Gateway o paquetes compatibles
    - Quieres depurar errores de carga del Plugin
sidebarTitle: Plugins
summary: Referencia de CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-05T01:44:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

Gestiona plugins de Gateway, paquetes de hooks y paquetes compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de Plugin" href="/es/tools/plugin">
    Guía para usuarios finales para instalar, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Gestionar plugins" href="/es/plugins/manage-plugins">
    Ejemplos rápidos para instalar, listar, actualizar, desinstalar y publicar.
  </Card>
  <Card title="Paquetes de Plugin" href="/es/plugins/bundles">
    Modelo de compatibilidad de paquetes.
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
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de las fases
en stderr y mantiene la salida JSON analizable. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el Plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw deben distribuir `openclaw.plugin.json` con un JSON Schema en línea (`configSchema`, incluso si está vacío). Los paquetes compatibles usan sus propios manifiestos de paquete.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de paquete (`codex`, `claude` o `cursor`) más las capacidades de paquete detectadas.
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
Los nombres de paquete sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento. Usa `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como la ejecución de código. Prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub en busca de paquetes de plugins instalables e imprime
nombres de paquetes listos para instalar. Busca paquetes de Plugin de código y de Plugin de paquete,
no Skills. Usa `openclaw skills search` para las Skills de ClawHub.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los plugins. npm
sigue siendo una alternativa compatible y una ruta de instalación directa. Los paquetes de Plugin
`@openclaw/*` propiedad de OpenClaw vuelven a publicarse en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables usan `latest`.
Las instalaciones y actualizaciones del canal beta prefieren el dist-tag `beta` de npm cuando esa etiqueta
está disponible, y luego recurren a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuración y reparación de configuración no válida">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escriben en ese archivo incluido y dejan `openclaw.json` sin tocar. Los includes raíz, arrays de includes e includes con sobrescrituras hermanas fallan en modo cerrado en lugar de aplanarse. Consulta [Includes de configuración](/es/gateway/configuration) para ver las formas compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla en modo cerrado y te indica que ejecutes primero `openclaw doctor --fix`. Durante el inicio de Gateway y la recarga en caliente, la configuración de plugins no válida falla en modo cerrado como cualquier otra configuración no válida; `openclaw doctor --fix` puede poner en cuarentena la entrada de Plugin no válida. La única excepción documentada en tiempo de instalación es una ruta estrecha de recuperación de Plugin incluido para plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalar frente a actualizar">
    `--force` reutiliza el destino de instalación existente y sobrescribe en su lugar un Plugin o paquete de hooks ya instalado. Úsalo cuando estés reinstalando intencionalmente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto de npm. Para actualizaciones rutinarias de un Plugin npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de Plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieres sobrescribir la instalación actual desde una fuente distinta.

  </Accordion>
  <Accordion title="Alcance de --pin">
    `--pin` se aplica solo a instalaciones de npm. No es compatible con instalaciones `git:`; usa una ref de git explícita, como `git:github.com/acme/plugin@v1.2.3`, cuando quieras una fuente fijada. No es compatible con `--marketplace`, porque las instalaciones desde marketplace conservan metadatos de fuente de marketplace en lugar de una especificación de npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos en el escáner integrado de código peligroso. Permite que la instalación continúe incluso cuando el escáner integrado informa hallazgos `critical`, pero **no** omite los bloqueos de política del hook `before_install` del Plugin y **no** omite los fallos de escaneo.

    Esta bandera de CLI se aplica a los flujos de instalación/actualización de plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan la sobrescritura de solicitud correspondiente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo separado de descarga/instalación de Skills de ClawHub.

    Si un Plugin que publicaste en ClawHub está bloqueado por un escaneo de registro, usa los pasos para publicadores en [ClawHub](/es/tools/clawhub).

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones de npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para visibilidad filtrada de hooks y habilitación por hook, no para instalar paquetes.

    Las especificaciones de npm son **solo de registro** (nombre de paquete + **versión exacta** o **dist-tag** opcional). Se rechazan especificaciones Git/URL/archivo y rangos semver. Las instalaciones de dependencias se ejecutan de forma local al proyecto con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene configuraciones globales de instalación de npm.

    Usa `npm:<package>` cuando quieras hacer explícita la resolución de npm. Las especificaciones de paquete sin prefijo también se instalan directamente desde npm durante la transición de lanzamiento.

    Las especificaciones sin prefijo y `@latest` permanecen en la pista estable. Las versiones de corrección con fecha de OpenClaw, como `2026.5.3-1`, son versiones estables para esta comprobación. Si npm resuelve cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente con una etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

    Si una especificación de instalación sin prefijo coincide con un id de Plugin oficial (por ejemplo `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete de npm con el mismo nombre, usa una especificación con ámbito explícita (por ejemplo `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio git. Las formas compatibles incluyen `git:github.com/owner/repo`, `git:owner/repo`, URL de clonación completas `https://`, `ssh://`, `git://`, `file://` y `git@host:owner/repo.git`. Añade `@<ref>` o `#<ref>` para hacer checkout de una rama, etiqueta o commit antes de instalar.

    Las instalaciones Git clonan en un directorio temporal, hacen checkout de la ref solicitada cuando está presente y luego usan el instalador normal de directorios de plugins. Eso significa que la validación del manifiesto, el escaneo de código peligroso, el trabajo de instalación del gestor de paquetes y los registros de instalación se comportan como instalaciones de npm. Las instalaciones Git registradas incluyen la URL/ref de origen más el commit resuelto para que `openclaw plugins update` pueda volver a resolver la fuente más tarde.

    Después de instalar desde git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime como métodos de Gateway y comandos de CLI. Si el Plugin registró una raíz de CLI con `api.registerCli`, ejecuta ese comando directamente a través de la CLI raíz de OpenClaw, por ejemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos">
    Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos de Plugin nativo de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz del Plugin extraído; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    Las instalaciones desde el marketplace de Claude también son compatibles.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Las especificaciones de plugins seguras para npm y sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución solo por npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la compatibilidad anunciada de la API de Plugin / Gateway mínimo antes de instalar. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` de npm-pack versionado, verifica el encabezado de resumen de ClawHub y el resumen del artefacto, y luego lo instala a través de la ruta normal de archivo. Las versiones más antiguas de ClawHub sin metadatos de ClawPack siguen instalándose a través de la ruta heredada de verificación de archivos de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, tipo de artefacto, integridad de npm, shasum de npm, nombre de tarball y datos de resumen de ClawPack para actualizaciones posteriores.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más nuevas de ClawHub; los selectores de versión o etiqueta explícitos, como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta`, permanecen fijados a ese selector.

#### Abreviatura de marketplace

Usa la abreviatura `plugin@marketplace` cuando el nombre del marketplace exista en la caché de registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

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

<Tabs>
  <Tab title="Fuentes de marketplace">
    - un nombre de marketplace conocido por Claude de `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta `marketplace.json`
    - una abreviatura de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL de git

  </Tab>
  <Tab title="Reglas de marketplace remoto">
    Para marketplaces remotos cargados desde GitHub o git, las entradas de plugins deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta fuentes de ruta relativa de ese repositorio y rechaza fuentes de plugins HTTP(S), de ruta absoluta, git, GitHub y otras que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas y archivos locales, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

<Note>
Los paquetes compatibles se instalan en la raíz normal de plugins y participan en el mismo flujo de listar/información/habilitar/deshabilitar. Actualmente, se admiten Skills de paquete, Skills de comandos de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` / `lspServers` declarados por manifiesto, Skills de comandos de Cursor y directorios de hooks compatibles de Codex; otras capacidades de paquete detectadas se muestran en diagnósticos/información, pero aún no están conectadas a la ejecución en runtime.
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
  Muestra solo los plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Cambia de la vista de tabla a líneas de detalle por plugin con metadatos de fuente/origen/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquinas, además de diagnósticos del registro y estado de instalación de dependencias de paquetes.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistido de plugins, con una alternativa derivada solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un plugin está instalado, habilitado y visible para la planificación de arranque en frío, pero no es una sonda en runtime en vivo de un proceso Gateway que ya se está ejecutando. Después de cambiar código de plugin, habilitación, política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve al canal antes de esperar que se ejecute código nuevo de `register(api)` o hooks nuevos. Para despliegues remotos/en contenedores, verifica que estás reiniciando el proceso hijo real `openclaw gateway run`, no solo un proceso envoltorio.

`plugins list --json` incluye el `dependencyStatus` de cada plugin desde `package.json`
`dependencies` y `optionalDependencies`. OpenClaw comprueba si esos nombres de paquete
están presentes en la ruta normal de búsqueda `node_modules` de Node del plugin; no
importa código runtime del plugin, ejecuta un gestor de paquetes ni repara dependencias
faltantes.
</Note>

`plugins search` es una búsqueda remota en el catálogo ClawHub. No inspecciona el estado
local, muta la configuración, instala paquetes ni carga código runtime de plugins. Los
resultados de búsqueda incluyen el nombre de paquete de ClawHub, la familia, el canal, la versión, el resumen y
una sugerencia de instalación como `openclaw plugins install clawhub:<package>`.

Para trabajar con plugins empaquetados dentro de una imagen Docker empaquetada, monta con bind el directorio
fuente del plugin sobre la ruta de fuente empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw descubrirá esa superposición de fuente montada
antes de `/app/dist/extensions/synology-chat`; un directorio de fuente copiado sin más
permanece inerte, por lo que las instalaciones empaquetadas normales siguen usando dist compilado.

Para depuración de hooks en runtime:

- `openclaw plugins inspect <id> --runtime --json` muestra hooks registrados y diagnósticos de una pasada de inspección con módulo cargado. La inspección en runtime nunca instala dependencias; usa `openclaw doctor --fix` para limpiar estado de dependencias heredado o recuperar plugins descargables faltantes referenciados por la configuración.
- `openclaw gateway status --deep --require-rpc` confirma el Gateway alcanzable, sugerencias de servicio/proceso, ruta de configuración y salud de RPC.
- Los hooks de conversación no empaquetados (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local (lo añade a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la ruta de origen en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice de plugins gestionado, manteniendo sin fijar el comportamiento predeterminado.
</Note>

### Índice de plugins

Los metadatos de instalación de plugins son estado gestionado por máquina, no configuración de usuario. Las instalaciones y actualizaciones los escriben en `plugins/installs.json` bajo el directorio de estado activo de OpenClaw. Su mapa de nivel superior `installRecords` es la fuente duradera de metadatos de instalación, incluidos registros de manifiestos de plugins rotos o faltantes. El arreglo `plugins` es la caché de registro en frío derivada del manifiesto. El archivo incluye una advertencia de no editar y lo usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro en frío de plugins.

Cuando OpenClaw ve registros heredados enviados `plugins.installs` en la configuración, los mueve al índice de plugins y elimina la clave de configuración; si falla cualquiera de las escrituras, los registros de configuración se conservan para que no se pierdan los metadatos de instalación.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina registros de plugins de `plugins.entries`, el índice persistido de plugins, entradas de listas de permitir/denegar plugins y entradas enlazadas de `plugins.load.paths` cuando corresponde. A menos que se establezca `--keep-files`, la desinstalación también elimina el directorio de instalación gestionado rastreado cuando está dentro de la raíz de extensiones de plugins de OpenClaw. Para plugins de memoria activa, la ranura de memoria se restablece a `memory-core`.

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

Las actualizaciones se aplican a instalaciones de plugins rastreadas en el índice de plugins gestionado y a instalaciones rastreadas de paquetes de hooks en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de plugin frente a especificación npm">
    Cuando pasas un id de plugin, OpenClaw reutiliza la especificación de instalación registrada para ese plugin. Eso significa que dist-tags almacenados anteriormente como `@beta` y versiones exactas fijadas siguen usándose en ejecuciones posteriores de `update <id>`.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con un dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de plugin rastreado, actualiza ese plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre de paquete npm sin una versión ni etiqueta también se resuelve de vuelta al registro de plugin rastreado. Usa esto cuando un plugin se fijó a una versión exacta y quieres devolverlo a la línea de lanzamiento predeterminada del registro.

  </Accordion>
  <Accordion title="Actualizaciones del canal beta">
    `openclaw plugins update` reutiliza la especificación de plugin rastreada a menos que pases una especificación nueva. `openclaw update` también conoce el canal de actualización activo de OpenClaw: en el canal beta, los registros de plugins npm y ClawHub de línea predeterminada prueban primero `@beta` y luego recurren a la especificación predeterminada/latest registrada si no existe una versión beta del plugin. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector.

  </Accordion>
  <Accordion title="Comprobaciones de versión y deriva de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado contra los metadatos del registro npm. Si la versión instalada y la identidad de artefacto registrada ya coinciden con el destino resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y el hash del artefacto obtenido cambia, OpenClaw trata eso como deriva de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real, y solicita confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan de forma cerrada a menos que el llamador proporcione una política de continuación explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en update">
    `--dangerously-force-unsafe-install` también está disponible en `plugins update` como una anulación de emergencia para falsos positivos del escaneo integrado de código peligroso durante actualizaciones de plugins. Aun así, no omite bloqueos de política `before_install` del plugin ni bloqueos por fallo de escaneo, y solo se aplica a actualizaciones de plugins, no a actualizaciones de paquetes de hooks.
  </Accordion>
</AccordionGroup>

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect muestra identidad, estado de carga, fuente, capacidades del manifiesto, indicadores de política, diagnósticos, metadatos de instalación, capacidades de paquete y cualquier soporte detectado de servidor MCP o LSP sin importar código runtime del plugin de forma predeterminada. Añade `--runtime` para cargar el módulo del plugin e incluir hooks, herramientas, comandos, servicios, métodos de gateway y rutas HTTP registrados. La inspección en runtime informa directamente de dependencias de plugin faltantes; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos CLI propiedad de plugins se instalan como grupos de comandos raíz `openclaw`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútalo como `openclaw <command> ...`; por ejemplo, un plugin que registra `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada plugin se clasifica según lo que realmente registra en runtime:

- **plain-capability** — un tipo de capacidad (por ejemplo, un plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capacidades

Consulta [Formas de plugins](/es/plugins/architecture#plugin-shapes) para obtener más información sobre el modelo de capacidades.

<Note>
La marca `--json` emite un informe legible por máquinas adecuado para scripts y auditorías. `inspect --all` renderiza una tabla de toda la flota con columnas de forma, tipos de capacidad, avisos de compatibilidad, capacidades de paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de plugins, diagnósticos de manifiesto/descubrimiento y avisos de compatibilidad. Cuando todo está limpio, imprime `No plugin issues detected.`

Si un plugin configurado está presente en disco, pero bloqueado por las comprobaciones de seguridad de rutas del cargador, la validación de configuración conserva la entrada del plugin y la informa como `present but blocked`. Corrige el diagnóstico anterior de plugin bloqueado, como propiedad de ruta o permisos de escritura para todos, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para fallos de forma de módulo como exportaciones `register`/`activate` faltantes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de forma de exportaciones en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo de lectura en frío persistido de OpenClaw para identidad de plugins instalados, habilitación, metadatos de fuente y propiedad de contribuciones. El arranque normal, la búsqueda de propietario de proveedor, la clasificación de configuración de canal y el inventario de plugins pueden leerlo sin importar módulos runtime de plugins.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado u obsoleto. Usa `--refresh` para reconstruirlo desde el índice de plugins persistido, la política de configuración y los metadatos del manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

`openclaw doctor --fix` también repara la deriva de npm gestionado adyacente al registro: si un paquete `@openclaw/*` huérfano o recuperado bajo la raíz de npm de plugins gestionados eclipsa a un plugin incluido, doctor elimina ese paquete obsoleto y reconstruye el registro para que el arranque valide contra el manifiesto incluido.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad de emergencia obsoleto para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; la alternativa de env es solo para recuperación de arranque de emergencia mientras se despliega la migración.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista del marketplace acepta una ruta de marketplace local, una ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de origen resuelta, además del manifiesto de marketplace analizado y las entradas de plugins.

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins)
- [Referencia de la CLI](/es/cli)
- [Plugins de la comunidad](/es/plugins/community)
