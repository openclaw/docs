---
read_when:
    - Quieres instalar o administrar plugins de Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de Plugins
sidebarTitle: Plugins
summary: Referencia de CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-11T20:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

Gestiona Plugin de Gateway, paquetes de hooks y bundles compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de Plugin" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo instalar, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Gestionar plugins" href="/es/plugins/manage-plugins">
    Ejemplos rápidos para instalar, listar, actualizar, desinstalar y publicar.
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
En modo Nix (`OPENCLAW_NIX_MODE=1`), los modificadores del ciclo de vida de plugins están deshabilitados. Usa la fuente de Nix para esta instalación en lugar de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` o `plugins disable`; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado primero al agente.
</Note>

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el Plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw deben distribuir `openclaw.plugin.json` con un JSON Schema en línea (`configSchema`, aunque esté vacío). Los bundles compatibles usan en su lugar sus propios manifiestos de bundle.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de bundle (`codex`, `claude` o `cursor`) además de las capacidades de bundle detectadas.
</Note>

### Instalación

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

Los mantenedores que prueben instalaciones en tiempo de configuración pueden anular las fuentes automáticas de instalación de plugins
con variables de entorno protegidas. Consulta
[Anulaciones de instalación de Plugin](/es/plugins/install-overrides).

<Warning>
Los nombres de paquete sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento. Usa `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como ejecutar código. Prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub para encontrar paquetes de plugins instalables e imprime
nombres de paquete listos para instalar. Busca paquetes code-plugin y bundle-plugin,
no Skills. Usa `openclaw skills search` para Skills de ClawHub.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los plugins. Npm
sigue siendo una alternativa compatible y una ruta de instalación directa. Los paquetes de Plugin
`@openclaw/*` propiedad de OpenClaw vuelven a publicarse en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables usan `latest`.
Las instalaciones y actualizaciones del canal beta prefieren el dist-tag `beta` de npm cuando esa etiqueta
está disponible, y luego recurren a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuración y reparación de configuración inválida">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escriben en ese archivo incluido y dejan `openclaw.json` intacto. Los includes raíz, los arrays de includes y los includes con anulaciones hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Includes de configuración](/es/gateway/configuration) para las formas compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma cerrada y te indica que ejecutes primero `openclaw doctor --fix`. Durante el arranque de Gateway y la recarga en caliente, la configuración de Plugin inválida falla de forma cerrada como cualquier otra configuración inválida; `openclaw doctor --fix` puede poner en cuarentena la entrada de Plugin inválida. La única excepción documentada en tiempo de instalación es una ruta estrecha de recuperación de Plugin incluido para plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalación frente a actualización">
    `--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un Plugin o paquete de hooks ya instalado. Úsalo cuando reinstales intencionadamente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto npm. Para actualizaciones rutinarias de un Plugin npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de Plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieres sobrescribir la instalación actual desde una fuente diferente.

  </Accordion>
  <Accordion title="Alcance de --pin">
    `--pin` se aplica solo a instalaciones npm. No es compatible con instalaciones `git:`; usa una referencia git explícita como `git:github.com/acme/plugin@v1.2.3` cuando quieras una fuente fijada. No es compatible con `--marketplace`, porque las instalaciones desde marketplace conservan metadatos de fuente de marketplace en lugar de una especificación npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos en el escáner integrado de código peligroso. Permite que la instalación continúe incluso cuando el escáner integrado informa hallazgos `critical`, pero **no** omite los bloqueos de política del hook `before_install` del Plugin y **no** omite fallos de escaneo.

    Esta marca de CLI se aplica a los flujos de instalación/actualización de Plugin. Las instalaciones de dependencias de Skills respaldadas por Gateway usan la anulación de solicitud correspondiente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo separado de descarga/instalación de Skills de ClawHub.

    Si un Plugin que publicaste en ClawHub está bloqueado por un escaneo del registro, usa los pasos para publicadores en [ClawHub](/es/clawhub/security).

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para visibilidad filtrada de hooks y habilitación por hook, no para instalación de paquetes.

    Las especificaciones npm son **solo de registro** (nombre de paquete + **versión exacta** o **dist-tag** opcional). Se rechazan especificaciones Git/URL/archivo y rangos semver. Las instalaciones de dependencias se ejecutan localmente al proyecto con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene ajustes globales de instalación npm. Las raíces npm gestionadas de Plugin heredan los `overrides` npm a nivel de paquete de OpenClaw, por lo que los pines de seguridad del host también se aplican a las dependencias de Plugin elevadas.

    Usa `npm:<package>` cuando quieras hacer explícita la resolución npm. Las especificaciones de paquete sin prefijo también se instalan directamente desde npm durante la transición de lanzamiento.

    Las especificaciones sin prefijo y `@latest` permanecen en la pista estable. Las versiones correctivas con fecha de OpenClaw como `2026.5.3-1` son versiones estables para esta comprobación. Si npm resuelve cualquiera de esas a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente con una etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

    Si una especificación de instalación sin prefijo coincide con un id oficial de Plugin (por ejemplo, `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete npm con el mismo nombre, usa una especificación con ámbito explícita (por ejemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio git. Las formas compatibles incluyen `git:github.com/owner/repo`, `git:owner/repo`, URLs de clonación completas `https://`, `ssh://`, `git://`, `file://` y `git@host:owner/repo.git`. Añade `@<ref>` o `#<ref>` para hacer checkout de una rama, etiqueta o commit antes de instalar.

    Las instalaciones Git clonan en un directorio temporal, hacen checkout de la ref solicitada cuando está presente y luego usan el instalador normal de directorio de Plugin. Eso significa que la validación del manifiesto, el escaneo de código peligroso, el trabajo de instalación del gestor de paquetes y los registros de instalación se comportan como las instalaciones npm. Las instalaciones git registradas incluyen la URL/ref de origen más el commit resuelto para que `openclaw plugins update` pueda volver a resolver la fuente más tarde.

    Después de instalar desde git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros en tiempo de ejecución como métodos de gateway y comandos de CLI. Si el Plugin registró una raíz de CLI con `api.registerCli`, ejecuta ese comando directamente mediante la CLI raíz de OpenClaw, por ejemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos">
    Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos de Plugin nativo de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz del Plugin extraído; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    Usa `npm-pack:<path.tgz>` cuando el archivo sea un tarball npm-pack y quieras
    probar la misma ruta de instalación de raíz npm gestionada que usan las instalaciones desde registro,
    incluida la verificación de `package-lock.json`, el escaneo de dependencias elevadas y
    los registros de instalación npm. Las rutas de archivo simples siguen instalándose como archivos locales
    bajo la raíz de extensiones de Plugin.

    También se admiten instalaciones desde el marketplace de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Las especificaciones de Plugin compatibles con npm y sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución solo por npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la API de plugin anunciada / la compatibilidad mínima del Gateway antes de la instalación. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` versionado empaquetado con npm, verifica el encabezado de resumen de ClawHub y el resumen del artefacto, y luego lo instala a través de la ruta normal de archivo. Las versiones anteriores de ClawHub sin metadatos de ClawPack siguen instalándose mediante la ruta heredada de verificación de archivo de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, el tipo de artefacto, la integridad npm, el shasum npm, el nombre del tarball y los datos del resumen de ClawPack para futuras actualizaciones.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más recientes de ClawHub; los selectores explícitos de versión o etiqueta, como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta`, permanecen fijados a ese selector.

#### Abreviatura de marketplace

Usa la abreviatura `plugin@marketplace` cuando el nombre del marketplace exista en la caché de registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` cuando quieras pasar explícitamente el origen del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Orígenes de marketplace">
    - un nombre de marketplace conocido por Claude desde `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta `marketplace.json`
    - una abreviatura de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL de git

  </Tab>
  <Tab title="Reglas de marketplace remoto">
    Para marketplaces remotos cargados desde GitHub o git, las entradas de plugin deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta orígenes de ruta relativa desde ese repositorio y rechaza orígenes de plugin HTTP(S), de ruta absoluta, git, GitHub y otros que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas y archivos locales, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

<Note>
Los paquetes compatibles se instalan en la raíz normal de plugins y participan en el mismo flujo de listar/información/habilitar/deshabilitar. Actualmente se admiten Skills de paquetes, Skills de comandos de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` / `lspServers` declarados en el manifiesto, Skills de comandos de Cursor y directorios de hooks compatibles de Codex; otras capacidades de paquetes detectadas se muestran en diagnósticos/información, pero todavía no están conectadas a la ejecución en tiempo de ejecución.
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
  Cambia de la vista de tabla a líneas de detalle por plugin con metadatos de origen/procedencia/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina más diagnósticos de registro y estado de instalación de dependencias de paquetes.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistente de plugins, con una alternativa derivada solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un plugin está instalado, habilitado y visible para la planificación de arranque en frío, pero no es una sonda en vivo del tiempo de ejecución de un proceso Gateway ya en ejecución. Después de cambiar el código del plugin, la habilitación, la política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecute código nuevo `register(api)` o hooks. Para despliegues remotos/en contenedores, verifica que estás reiniciando el hijo real de `openclaw gateway run`, no solo un proceso contenedor.

`plugins list --json` incluye el `dependencyStatus` de cada plugin desde `dependencies` y `optionalDependencies` de `package.json`. OpenClaw comprueba si esos nombres de paquetes están presentes a lo largo de la ruta normal de búsqueda `node_modules` de Node del plugin; no importa el código de tiempo de ejecución del plugin, no ejecuta un gestor de paquetes ni repara dependencias faltantes.
</Note>

`plugins search` es una consulta remota al catálogo de ClawHub. No inspecciona el estado local, no modifica la configuración, no instala paquetes ni carga código de tiempo de ejecución de plugins. Los resultados de búsqueda incluyen el nombre de paquete de ClawHub, la familia, el canal, la versión, el resumen y una sugerencia de instalación como `openclaw plugins install clawhub:<package>`.

Para trabajo con plugins incluidos dentro de una imagen Docker empaquetada, monta con bind el directorio de origen del plugin sobre la ruta de origen empaquetada correspondiente, como `/app/extensions/synology-chat`. OpenClaw descubrirá esa superposición de origen montada antes de `/app/dist/extensions/synology-chat`; un directorio de origen copiado sin más permanece inerte, de modo que las instalaciones empaquetadas normales siguen usando el dist compilado.

Para depuración de hooks en tiempo de ejecución:

- `openclaw plugins inspect <id> --runtime --json` muestra hooks registrados y diagnósticos desde una pasada de inspección con el módulo cargado. La inspección en tiempo de ejecución nunca instala dependencias; usa `openclaw doctor --fix` para limpiar estado heredado de dependencias o recuperar plugins descargables faltantes referenciados por la configuración.
- `openclaw gateway status --deep --require-rpc` confirma el Gateway alcanzable, indicios de servicio/proceso, ruta de configuración y salud RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local (lo agrega a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la ruta de origen en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice de plugins gestionados mientras se mantiene sin fijar el comportamiento predeterminado.
</Note>

### Índice de plugins

Los metadatos de instalación de plugins son estado gestionado por máquina, no configuración de usuario. Las instalaciones y actualizaciones los escriben en `plugins/installs.json` bajo el directorio activo de estado de OpenClaw. Su mapa de nivel superior `installRecords` es la fuente duradera de metadatos de instalación, incluidos registros de manifiestos de plugin rotos o faltantes. El arreglo `plugins` es la caché de registro en frío derivada del manifiesto. El archivo incluye una advertencia de no editar y lo usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro de plugins en frío.

Cuando OpenClaw ve registros heredados distribuidos `plugins.installs` en la configuración, las lecturas en tiempo de ejecución los tratan como entrada de compatibilidad sin reescribir `openclaw.json`. Las escrituras explícitas de plugins y `openclaw doctor --fix` mueven esos registros al índice de plugins y eliminan la clave de configuración cuando se permiten escrituras de configuración; si cualquiera de las escrituras falla, los registros de configuración se conservan para que no se pierdan los metadatos de instalación.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina los registros de plugin de `plugins.entries`, el índice persistente de plugins, las entradas de listas de permitir/denegar plugins y las entradas enlazadas de `plugins.load.paths` cuando corresponda. Salvo que se defina `--keep-files`, la desinstalación también elimina el directorio de instalación gestionada rastreado cuando está dentro de la raíz de extensiones de plugins de OpenClaw. Para plugins de memoria activa, la ranura de memoria se restablece a `memory-core`.

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

Las actualizaciones se aplican a instalaciones de plugins rastreadas en el índice de plugins gestionados y a instalaciones de paquetes de hooks rastreadas en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de plugin frente a especificación npm">
    Cuando pasas un id de plugin, OpenClaw reutiliza la especificación de instalación registrada para ese plugin. Eso significa que dist-tags almacenados previamente, como `@beta`, y versiones fijadas exactas siguen usándose en ejecuciones posteriores de `update <id>`.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con un dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de plugin rastreado, actualiza ese plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre de paquete npm sin versión ni etiqueta también resuelve de vuelta al registro de plugin rastreado. Usa esto cuando un plugin estaba fijado a una versión exacta y quieres devolverlo a la línea de publicación predeterminada del registro.

  </Accordion>
  <Accordion title="Actualizaciones de canal beta">
    `openclaw plugins update` reutiliza la especificación de plugin rastreada salvo que pases una nueva especificación. `openclaw update` también conoce el canal activo de actualización de OpenClaw: en el canal beta, los registros de plugins npm y ClawHub de línea predeterminada intentan primero `@beta` y luego vuelven a la especificación predeterminada/latest registrada si no existe una publicación beta del plugin. Esa alternativa se informa como advertencia y no hace fallar la actualización del núcleo. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector.

  </Accordion>
  <Accordion title="Comprobaciones de versión y deriva de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado contra los metadatos del registro npm. Si la versión instalada y la identidad de artefacto registrada ya coinciden con el destino resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido, OpenClaw lo trata como deriva de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real, y pide confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan de forma cerrada salvo que el llamador proporcione una política explícita de continuación.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en update">
    `--dangerously-force-unsafe-install` también está disponible en `plugins update` como anulación de emergencia para falsos positivos del escaneo integrado de código peligroso durante actualizaciones de plugins. Aun así, no omite bloqueos de política `before_install` del plugin ni bloqueos por fallo de escaneo, y solo se aplica a actualizaciones de plugins, no a actualizaciones de paquetes de hooks.
  </Accordion>
</AccordionGroup>

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect muestra identidad, estado de carga, origen, capacidades del manifiesto, indicadores de política, diagnósticos, metadatos de instalación, capacidades de paquetes y cualquier soporte de servidor MCP o LSP detectado sin importar el tiempo de ejecución del plugin de forma predeterminada. Agrega `--runtime` para cargar el módulo del plugin e incluir hooks registrados, herramientas, comandos, servicios, métodos de gateway y rutas HTTP. La inspección en tiempo de ejecución informa directamente dependencias faltantes del plugin; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos CLI propiedad del plugin normalmente se instalan como grupos de comandos raíz de `openclaw`, pero los plugins también pueden registrar comandos anidados bajo un padre del núcleo, como `openclaw nodes`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútalo en la ruta listada; por ejemplo, un plugin que registra `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada plugin se clasifica por lo que realmente registra en tiempo de ejecución:

- **plain-capability** — un tipo de capability (p. ej., un plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capability (p. ej., texto + voz + imágenes)
- **hook-only** — solo hooks, sin capabilities ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capabilities

Consulta [formas de Plugin](/es/plugins/architecture#plugin-shapes) para obtener más información sobre el modelo de capability.

<Note>
La flag `--json` genera un informe legible por máquina adecuado para scripts y auditorías. `inspect --all` muestra una tabla de toda la flota con columnas de forma, tipos de capability, avisos de compatibilidad, capabilities de bundle y resumen de hooks. `info` es un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de plugins, diagnósticos de manifiesto/descubrimiento y avisos de compatibilidad. Cuando todo está limpio, imprime `No plugin issues detected.`

Si un plugin configurado está presente en el disco pero bloqueado por las comprobaciones de seguridad de rutas del cargador, la validación de configuración mantiene la entrada del plugin e informa que está `present but blocked`. Corrige el diagnóstico previo del plugin bloqueado, como la propiedad de la ruta o permisos de escritura para todos, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para fallos de forma del módulo, como exportaciones `register`/`activate` ausentes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de las exportaciones en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo de lectura en frío persistido de OpenClaw para la identidad de plugins instalados, habilitación, metadatos de origen y propiedad de contribuciones. El inicio normal, la búsqueda del propietario del proveedor, la clasificación de configuración de canales y el inventario de plugins pueden leerlo sin importar módulos de runtime de plugins.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado u obsoleto. Usa `--refresh` para reconstruirlo a partir del índice de plugins persistido, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en runtime.

`openclaw doctor --fix` también repara desviaciones gestionadas de npm cercanas al registro: si un paquete `@openclaw/*` huérfano o recuperado bajo la raíz npm gestionada de plugins oculta un plugin incluido en bundle, doctor elimina ese paquete obsoleto y reconstruye el registro para que el inicio valide contra el manifiesto incluido en bundle.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad obsoleto de emergencia para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; el fallback de entorno es solo para recuperación de inicio de emergencia mientras se despliega la migración.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista del Marketplace acepta una ruta local de marketplace, una ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL git. `--json` imprime la etiqueta de origen resuelta junto con el manifiesto de marketplace analizado y las entradas de plugins.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Referencia de CLI](/es/cli)
- [ClawHub](/es/clawhub)
