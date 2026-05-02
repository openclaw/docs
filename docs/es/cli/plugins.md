---
read_when:
    - Quieres instalar o gestionar plugins de Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de plugins
sidebarTitle: Plugins
summary: Referencia de CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T05:22:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

Gestiona Plugins de Gateway, paquetes de hooks y bundles compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de Plugin" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo instalar, habilitar y solucionar problemas de Plugins.
  </Card>
  <Card title="Bundles de Plugins" href="/es/plugins/bundles">
    Modelo de compatibilidad de bundles.
  </Card>
  <Card title="Manifiesto de Plugin" href="/es/plugins/manifest">
    Campos del manifiesto y esquema de configuración.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security">
    Endurecimiento de seguridad para instalaciones de Plugins.
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

Para investigar una instalación, inspección, desinstalación o actualización del registro lenta, ejecuta el
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de fase
en stderr y mantiene la salida JSON analizable. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
Los Plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el Plugin de navegador incluido); otros requieren `plugins enable`.

Los Plugins nativos de OpenClaw deben distribuir `openclaw.plugin.json` con un JSON Schema en línea (`configSchema`, incluso si está vacío). Los bundles compatibles usan sus propios manifiestos de bundle en su lugar.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de bundle (`codex`, `claude` o `cursor`) además de las capacidades de bundle detectadas.
</Note>

### Instalar

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # ClawHub first, then npm
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
Los nombres de paquete sin prefijo se comprueban primero en ClawHub y luego en npm. Trata las instalaciones de Plugins como ejecutar código. Prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub en busca de paquetes de Plugins instalables e imprime
nombres de paquete listos para instalar. Busca paquetes de Plugins de código y Plugins de bundle,
no Skills. Usa `openclaw skills search` para Skills de ClawHub.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los Plugins. Npm
sigue siendo una ruta de respaldo y de instalación directa compatible. Durante la migración a
ClawHub, OpenClaw todavía distribuye algunos paquetes de Plugins `@openclaw/*` propiedad de OpenClaw
en npm; esas versiones de paquete pueden ir por detrás del código fuente incluido entre trenes de lanzamiento
de Plugins. Si npm informa que un paquete de Plugin propiedad de OpenClaw está obsoleto, esa
versión publicada es un artefacto externo antiguo; usa el Plugin incluido con
la versión actual de OpenClaw o un checkout local hasta que se publique un paquete npm más reciente.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuración y recuperación de configuración no válida">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escribe en ese archivo incluido y deja `openclaw.json` intacto. Los includes raíz, los arrays de includes y los includes con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Includes de configuración](/es/gateway/configuration) para ver las formas admitidas.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma cerrada y te indica que ejecutes primero `openclaw doctor --fix`. Durante el inicio de Gateway, la configuración no válida de un Plugin se aísla a ese Plugin para que otros canales y Plugins puedan seguir ejecutándose; `openclaw doctor --fix` puede poner en cuarentena la entrada de Plugin no válida. La única excepción documentada en tiempo de instalación es una ruta estrecha de recuperación de Plugins incluidos para Plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalar frente a actualizar">
    `--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un Plugin o paquete de hooks ya instalado. Úsalo cuando estés reinstalando intencionalmente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto npm. Para actualizaciones rutinarias de un Plugin npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de Plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieres sobrescribir la instalación actual desde una fuente diferente.

  </Accordion>
  <Accordion title="Alcance de --pin">
    `--pin` solo se aplica a instalaciones npm. No es compatible con instalaciones `git:`; usa una referencia git explícita como `git:github.com/acme/plugin@v1.2.3` cuando quieras una fuente fijada. No es compatible con `--marketplace`, porque las instalaciones de marketplace conservan metadatos de origen del marketplace en lugar de una especificación npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` es una opción de último recurso para falsos positivos en el escáner integrado de código peligroso. Permite que la instalación continúe incluso cuando el escáner integrado informa hallazgos `critical`, pero **no** omite los bloqueos de política de hooks `before_install` del Plugin y **no** omite los fallos de escaneo.

    Esta bandera de CLI se aplica a los flujos de instalación/actualización de Plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan la anulación de solicitud correspondiente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo separado de descarga/instalación de Skills de ClawHub.

    Si un Plugin que publicaste en ClawHub queda bloqueado por un escaneo del registro, usa los pasos para publicadores en [ClawHub](/es/tools/clawhub).

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para visibilidad filtrada de hooks y habilitación por hook, no para la instalación de paquetes.

    Las especificaciones npm son **solo de registro** (nombre de paquete + **versión exacta** opcional o **dist-tag**). Las especificaciones Git/URL/archivo y los rangos semver se rechazan. Las instalaciones de dependencias se ejecutan localmente en el proyecto con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene configuraciones globales de instalación npm.

    Usa `npm:<package>` cuando quieras omitir la búsqueda en ClawHub e instalar directamente desde npm. Las especificaciones de paquetes sin prefijo todavía prefieren ClawHub y solo recurren a npm cuando ClawHub no tiene ese paquete o versión.

    Las especificaciones sin prefijo y `@latest` permanecen en el canal estable. Si npm resuelve cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente por una etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

    Si una especificación de instalación sin prefijo coincide con un id de Plugin oficial (por ejemplo `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete npm con el mismo nombre, usa una especificación con scope explícito (por ejemplo `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio git. Las formas admitidas incluyen `git:github.com/owner/repo`, `git:owner/repo`, URLs completas `https://`, `ssh://`, `git://`, `file://` y URLs de clonación `git@host:owner/repo.git`. Añade `@<ref>` o `#<ref>` para hacer checkout de una rama, etiqueta o commit antes de instalar.

    Las instalaciones Git clonan en un directorio temporal, hacen checkout de la referencia solicitada cuando está presente y luego usan el instalador normal de directorios de Plugins. Eso significa que la validación del manifiesto, el escaneo de código peligroso, el trabajo de instalación del gestor de paquetes y los registros de instalación se comportan como instalaciones npm. Las instalaciones git registradas incluyen la URL/ref de origen y el commit resuelto para que `openclaw plugins update` pueda volver a resolver la fuente más adelante.

    Después de instalar desde git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros en tiempo de ejecución como métodos de gateway y comandos CLI. Si el Plugin registró una raíz de CLI con `api.registerCli`, ejecuta ese comando directamente mediante la CLI raíz de OpenClaw, por ejemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos">
    Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos de Plugins nativos de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz del Plugin extraído; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    Las instalaciones desde marketplace de Claude también son compatibles.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ahora también prefiere ClawHub para especificaciones de Plugins compatibles con npm sin prefijo. Solo recurre a npm si ClawHub no tiene ese paquete o versión:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para forzar la resolución solo por npm, por ejemplo cuando ClawHub no está disponible o sabes que el paquete solo existe en npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la compatibilidad anunciada de la API del Plugin / Gateway mínimo antes de instalar. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el ClawPack versionado, verifica el encabezado de digest de ClawHub y el digest del artefacto, y luego lo instala mediante la ruta normal de archivos. Las versiones antiguas de ClawHub sin metadatos ClawPack todavía se instalan mediante la ruta heredada de verificación de archivos de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub y los datos de digest de ClawPack para actualizaciones posteriores.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir lanzamientos más recientes de ClawHub; los selectores explícitos de versión o etiqueta como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta` permanecen fijados a ese selector.

#### Abreviatura de marketplace

Usa la abreviatura `plugin@marketplace` cuando el nombre del marketplace exista en la caché local del registro de Claude en `~/.claude/plugins/known_marketplaces.json`:

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
    - un nombre de marketplace conocido de Claude desde `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta `marketplace.json`
    - una forma abreviada de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL de git

  </Tab>
  <Tab title="Reglas de marketplace remoto">
    Para los marketplaces remotos cargados desde GitHub o git, las entradas de plugins deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta fuentes de ruta relativa desde ese repositorio y rechaza HTTP(S), rutas absolutas, git, GitHub y otras fuentes de plugins que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas y archivos locales, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

<Note>
Los paquetes compatibles se instalan en la raíz normal de plugins y participan en el mismo flujo de listar/información/habilitar/deshabilitar. Hoy se admiten Skills de paquetes, Skills de comandos de Claude, valores predeterminados de `settings.json` de Claude, valores predeterminados de `.lsp.json` de Claude / `lspServers` declarados en manifiesto, Skills de comandos de Cursor y directorios de hooks compatibles de Codex; otras capacidades detectadas de paquetes se muestran en diagnósticos/información, pero todavía no están conectadas a la ejecución en runtime.
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
  Cambia de la vista de tabla a líneas de detalle por plugin con metadatos de fuente/origen/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina más diagnósticos del registro.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistido de plugins, con una alternativa derivada solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un plugin está instalado, habilitado y visible para la planificación de inicio en frío, pero no es una prueba de runtime en vivo de un proceso Gateway que ya esté en ejecución. Después de cambiar el código de un plugin, la habilitación, la política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecute nuevo código `register(api)` o hooks. Para despliegues remotos/en contenedores, verifica que estés reiniciando el proceso hijo real `openclaw gateway run`, no solo un proceso contenedor.
</Note>

`plugins search` es una consulta remota al catálogo de ClawHub. No inspecciona el
estado local, no muta la configuración, no instala paquetes ni carga código de runtime de plugins. Los
resultados de búsqueda incluyen el nombre del paquete de ClawHub, familia, canal, versión, resumen y
una sugerencia de instalación como `openclaw plugins install clawhub:<package>`.

Para trabajar con plugins incluidos dentro de una imagen Docker empaquetada, monta con bind el directorio
fuente del plugin sobre la ruta de fuente empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw descubrirá esa superposición de fuente montada
antes que `/app/dist/extensions/synology-chat`; un directorio de fuente copiado sin más
permanece inerte para que las instalaciones empaquetadas normales sigan usando el dist compilado.

Para depurar hooks de runtime:

- `openclaw plugins inspect <id> --runtime --json` muestra hooks registrados y diagnósticos desde una pasada de inspección con el módulo cargado. La inspección de runtime nunca instala dependencias; usa `openclaw doctor --fix` para limpiar el estado de dependencias heredado o instalar plugins descargables configurados que falten.
- `openclaw gateway status --deep --require-rpc` confirma el Gateway alcanzable, indicios de servicio/proceso, ruta de configuración y salud RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local (se agrega a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la ruta de fuente en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice de plugins gestionado mientras se mantiene sin fijar el comportamiento predeterminado.
</Note>

### Índice de plugins

Los metadatos de instalación de plugins son estado gestionado por máquina, no configuración de usuario. Las instalaciones y actualizaciones los escriben en `plugins/installs.json` bajo el directorio de estado activo de OpenClaw. Su mapa de nivel superior `installRecords` es la fuente duradera de metadatos de instalación, incluidos registros de manifiestos de plugins rotos o ausentes. El arreglo `plugins` es la caché de registro en frío derivada de manifiestos. El archivo incluye una advertencia de no editar y lo usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro en frío de plugins.

Cuando OpenClaw ve registros heredados enviados de `plugins.installs` en la configuración, los mueve al índice de plugins y elimina la clave de configuración; si cualquiera de las escrituras falla, los registros de configuración se conservan para que no se pierdan los metadatos de instalación.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina registros de plugins de `plugins.entries`, del índice de plugins persistido, de las entradas de listas de permitir/denegar plugins y de las entradas enlazadas de `plugins.load.paths` cuando corresponda. A menos que se establezca `--keep-files`, la desinstalación también elimina el directorio de instalación gestionado rastreado cuando está dentro de la raíz de extensiones de plugins de OpenClaw. Para plugins de active memory, el espacio de memoria se restablece a `memory-core`.

<Note>
`--keep-config` se admite como alias obsoleto de `--keep-files`.
</Note>

### Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a instalaciones de plugins rastreadas en el índice de plugins gestionado y a instalaciones de hook-packs rastreadas en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de plugin frente a especificación npm">
    Cuando pasas un id de plugin, OpenClaw reutiliza la especificación de instalación registrada para ese plugin. Eso significa que dist-tags almacenadas previamente como `@beta` y versiones fijadas exactas siguen usándose en ejecuciones posteriores de `update <id>`.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con una dist-tag o versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de plugin rastreado, actualiza ese plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre del paquete npm sin versión ni etiqueta también se resuelve de vuelta al registro de plugin rastreado. Usa esto cuando un plugin se fijó a una versión exacta y quieres devolverlo a la línea de publicación predeterminada del registro.

  </Accordion>
  <Accordion title="Comprobaciones de versión y desviación de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado contra los metadatos del registro npm. Si la versión instalada y la identidad del artefacto registrada ya coinciden con el destino resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y el hash del artefacto obtenido cambia, OpenClaw lo trata como desviación de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real, y pide confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan de forma cerrada a menos que el llamador proporcione una política de continuación explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en update">
    `--dangerously-force-unsafe-install` también está disponible en `plugins update` como anulación de emergencia para falsos positivos del análisis integrado de código peligroso durante actualizaciones de plugins. Aun así, no omite bloqueos de política `before_install` de plugins ni bloqueo por fallo de análisis, y solo se aplica a actualizaciones de plugins, no a actualizaciones de hook-packs.
  </Accordion>
</AccordionGroup>

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect muestra identidad, estado de carga, fuente, capacidades de manifiesto, marcas de política, diagnósticos, metadatos de instalación, capacidades de paquete y cualquier soporte de servidor MCP o LSP detectado sin importar por defecto el runtime del plugin. Agrega `--runtime` para cargar el módulo del plugin e incluir hooks, herramientas, comandos, servicios, métodos de Gateway y rutas HTTP registrados. La inspección de runtime informa directamente dependencias de plugin faltantes; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos CLI propiedad de plugins se instalan como grupos de comandos raíz de `openclaw`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútalo como `openclaw <command> ...`; por ejemplo, un plugin que registra `demo-git` se puede verificar con `openclaw demo-git ping`.

Cada plugin se clasifica por lo que registra realmente en runtime:

- **plain-capability** — un tipo de capacidad (p. ej., un plugin solo de proveedor)
- **hybrid-capability** — múltiples tipos de capacidad (p. ej., texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capacidades

Consulta [Formas de plugins](/es/plugins/architecture#plugin-shapes) para más información sobre el modelo de capacidades.

<Note>
La marca `--json` genera un informe legible por máquina apto para scripts y auditorías. `inspect --all` renderiza una tabla de toda la flota con columnas de forma, tipos de capacidad, avisos de compatibilidad, capacidades de paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de plugins, diagnósticos de manifiesto/descubrimiento y avisos de compatibilidad. Cuando todo está limpio imprime `No plugin issues detected.`

Para fallos de forma de módulo como exports `register`/`activate` faltantes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de forma de exports en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo de lectura en frío persistido de OpenClaw para identidad de plugins instalados, habilitación, metadatos de fuente y propiedad de contribuciones. El inicio normal, la búsqueda de propietario de proveedor, la clasificación de configuración de canales y el inventario de plugins pueden leerlo sin importar módulos de runtime de plugins.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, vigente u obsoleto. Usa `--refresh` para reconstruirlo desde el índice de plugins persistido, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación de runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad de emergencia obsoleto para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; la alternativa por variable de entorno es solo para recuperación de inicio de emergencia mientras se despliega la migración.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista de marketplace acepta una ruta de marketplace local, una ruta `marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de fuente resuelta más el manifiesto de marketplace analizado y las entradas de plugins.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Referencia de CLI](/es/cli)
- [Plugins de la comunidad](/es/plugins/community)
