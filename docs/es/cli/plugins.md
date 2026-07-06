---
read_when:
    - Quieres instalar o administrar plugins de Gateway o paquetes compatibles
    - Quieres crear una estructura inicial o validar un Plugin de herramienta sencillo
    - Quieres depurar fallos de carga de plugins
sidebarTitle: Plugins
summary: Referencia de CLI para `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-07-06T10:48:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Administra los plugins de Gateway, los paquetes de hooks y los bundles compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de plugins" href="/es/tools/plugin">
    Guía de usuario final para instalar, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Administrar plugins" href="/es/plugins/manage-plugins">
    Ejemplos rápidos para instalar, listar, actualizar, desinstalar y publicar.
  </Card>
  <Card title="Bundles de plugins" href="/es/plugins/bundles">
    Modelo de compatibilidad de bundles.
  </Card>
  <Card title="Manifest de plugin" href="/es/plugins/manifest">
    Campos del manifest y esquema de configuración.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security">
    Endurecimiento de seguridad para instalaciones de plugins.
  </Card>
</CardGroup>

## Comandos

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Para investigar una instalación, inspección, desinstalación o actualización de registro lentas, ejecuta el
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de las fases
en stderr y mantiene la salida JSON analizable. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` es inmutable. `install`, `update`, `uninstall`, `enable` y `disable` se niegan a ejecutarse. Edita en su lugar la fuente Nix de esta instalación (`programs.openclaw.config` o `instances.<name>.config` para nix-openclaw) y luego recompila. Consulta la [Guía rápida](https://github.com/openclaw/nix-openclaw#quick-start) orientada a agentes.
</Note>

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw distribuyen `openclaw.plugin.json` con un JSON Schema en línea (`configSchema`, incluso si está vacío). Los bundles compatibles usan sus propios manifests de bundle.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de bundle (`codex`, `claude` o `cursor`) más las capacidades de bundle detectadas.
</Note>

## Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea de forma predeterminada un plugin de herramienta mínimo en TypeScript. El primer
argumento es el id del plugin; `--name` establece el nombre visible. OpenClaw usa el
id para el directorio de salida predeterminado y la nomenclatura del paquete. Los andamiajes de herramientas usan
`defineToolPlugin` y generan scripts de `package.json` `plugin:build` y
`plugin:validate` que compilan y luego llaman a `openclaw plugins build`/`validate`.

`plugins build` importa la entrada compilada, lee sus metadatos estáticos de herramienta, escribe
`openclaw.plugin.json` y mantiene alineado `openclaw.extensions` de `package.json`.
`plugins validate` comprueba que el manifest generado, los metadatos del paquete y la
exportación actual de la entrada aún coincidan. Consulta [Plugins de herramientas](/es/plugins/tool-plugins) para
el flujo de creación completo.

El andamiaje escribe código fuente TypeScript, pero genera metadatos desde la entrada compilada
`./dist/index.js`, por lo que el flujo también funciona con la CLI publicada. Usa
`--entry <path>` cuando la entrada no sea la entrada predeterminada del paquete. Usa
`plugins build --check` en CI para fallar cuando los metadatos generados estén obsoletos sin
reescribir archivos.

### Andamiaje de proveedor

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Los andamiajes de proveedores crean un plugin de proveedor de modelos genérico compatible con OpenAI
con integración de autenticación mediante clave de API, un script `npm run validate` que ejecuta
`clawhub package validate`, metadatos de paquete de ClawHub y un workflow de GitHub Actions
despachado manualmente para futura publicación de confianza mediante GitHub
OIDC. Los andamiajes de proveedores no generan Skills y no usan
`openclaw plugins build`/`validate`; esos comandos son para la ruta de metadatos generados
del andamiaje de herramientas.

Antes de publicar, reemplaza la URL base de API de marcador de posición, el catálogo de modelos, la ruta de docs,
el texto de credenciales y el contenido del README con detalles reales del proveedor. Usa el
README generado para la primera publicación en ClawHub y la configuración de publicador de confianza.

## Instalar

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Los mantenedores que prueban instalaciones en tiempo de configuración pueden anular las fuentes automáticas de instalación de plugins
con variables de entorno protegidas. Consulta
[Anulaciones de instalación de plugins](/es/plugins/install-overrides).

<Warning>
Los nombres de paquete simples se instalan desde npm de forma predeterminada durante la transición de lanzamiento, salvo que coincidan con un id de plugin incluido u oficial, en cuyo caso OpenClaw usa esa copia local/oficial en lugar de acceder al registro de npm. Usa `npm:<package>` cuando quieras deliberadamente un paquete npm externo. Usa `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como ejecutar código; prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub en busca de paquetes `code-plugin` y
`bundle-plugin` instalables (no Skills; usa `openclaw skills search` para esas).
El valor predeterminado de `--limit` es 20, con un máximo de 100. Solo lee el catálogo remoto: no
inspecciona estado local, muta configuración, instala paquetes ni carga el runtime de plugins.
Los resultados incluyen el nombre del paquete de ClawHub, familia, canal, versión,
resumen y una pista de instalación como `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los plugins. Npm
sigue siendo una ruta de respaldo y de instalación directa compatible. Los paquetes de plugins
`@openclaw/*` propiedad de OpenClaw se publican de nuevo en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables usan `latest`.
Las instalaciones y actualizaciones del canal beta prefieren la dist-tag `beta` de npm cuando está disponible,
con fallback a `latest`. En el canal estable extendido, los plugins npm oficiales
con intención simple/predeterminada o `latest` se resuelven a la versión exacta instalada del núcleo.
Los pins exactos y las etiquetas explícitas distintas de `latest`, los paquetes de terceros y
las fuentes que no son npm no se reescriben.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuración y reparación de configuración no válida">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escriben en ese archivo incluido y dejan `openclaw.json` intacto. Los includes raíz, arreglos de includes e includes con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Includes de configuración](/es/gateway/configuration) para las formas compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma cerrada y te indica que ejecutes primero `openclaw doctor --fix`. Durante el inicio de Gateway y la recarga en caliente, una configuración de plugins no válida falla de forma cerrada como cualquier otra configuración no válida; `openclaw doctor --fix` puede poner en cuarentena la entrada de plugin no válida. La única excepción documentada en tiempo de instalación es una ruta estrecha de recuperación de plugin incluido para plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalar frente a actualizar">
    `--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un plugin o paquete de hooks ya instalado. Úsalo cuando reinstales intencionalmente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto npm. Para actualizaciones rutinarias de un plugin npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieres sobrescribir la instalación actual desde una fuente diferente. `--force` no es compatible con `--link`.

  </Accordion>
  <Accordion title="Alcance de --pin">
    `--pin` se aplica solo a instalaciones npm y registra el `<name>@<version>` exacto resuelto. No es compatible con instalaciones `git:` (fija el ref en la especificación en su lugar, por ejemplo, `git:github.com/acme/plugin@v1.2.3`) ni con `--marketplace` (las instalaciones de marketplace conservan metadatos de fuente de marketplace en lugar de una especificación npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto y ahora no hace nada. OpenClaw ya no ejecuta el bloqueo peligroso de código integrado en tiempo de instalación para instalaciones de plugins.

    Usa la superficie `security.installPolicy` propiedad del operador cuando se requiera una política de instalación específica del host. Los hooks `before_install` de plugins son hooks de ciclo de vida del runtime de plugins, no el límite principal de política para instalaciones mediante CLI.

    Si un plugin que publicaste en ClawHub está oculto o bloqueado por un análisis del registro, usa los pasos de publicador en [Publicación en ClawHub](/es/clawhub/publishing). `--dangerously-force-unsafe-install` no pide a ClawHub que vuelva a analizar el plugin ni que haga pública una versión bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Las instalaciones comunitarias de ClawHub comprueban el registro de confianza de la versión seleccionada antes de descargar. Si ClawHub deshabilita la descarga para la versión, informa hallazgos de análisis maliciosos o pone la versión en un estado de moderación bloqueante (en cuarentena, revocada), OpenClaw la rechaza directamente sin importar esta marca. Para estados de análisis riesgosos o estados de moderación no bloqueantes, OpenClaw muestra los detalles de confianza y solicita confirmación antes de continuar.

    Usa `--acknowledge-clawhub-risk` solo después de revisar la advertencia de ClawHub y decidir continuar sin una indicación interactiva. Los resultados de análisis pendientes u obsoletos (aún no limpios) advierten, pero no requieren reconocimiento. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidas de OpenClaw omiten por completo esta comprobación de confianza de versión.

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para visibilidad filtrada de hooks y habilitación por hook, no para instalación de paquetes.

    Las especificaciones de npm son **solo de registro** (nombre del paquete más **versión exacta** opcional o **dist-tag**). Se rechazan las especificaciones Git/URL/archivo y los rangos semver. Las instalaciones de dependencias se ejecutan en un proyecto npm administrado por Plugin con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene configuraciones globales de instalación de npm. Los proyectos npm administrados de Plugins heredan los `overrides` de npm a nivel de paquete de OpenClaw, por lo que las fijaciones de seguridad del host también se aplican a las dependencias de Plugins elevadas.

    Usa `npm:<package>` para hacer explícita la resolución de npm. Las especificaciones de paquete sin prefijo también se instalan directamente desde npm durante la transición de lanzamiento, salvo que coincidan con un id de Plugin oficial.

    Las especificaciones `@openclaw/*` sin procesar que coinciden con Plugins incluidos se resuelven a la copia incluida propiedad de la imagen antes de recurrir a npm. Por ejemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa el Plugin de Discord incluido de la compilación actual de OpenClaw en lugar de crear una anulación npm administrada. Para forzar el paquete npm externo, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Las especificaciones sin prefijo y `@latest` permanecen en la pista estable. Las versiones de corrección con sello de fecha de OpenClaw, como `2026.5.3-1`, cuentan como estables para esta comprobación. Si npm resuelve cualquiera de las dos formas a una versión preliminar, OpenClaw se detiene y te pide que aceptes explícitamente con una etiqueta de versión preliminar (`@beta`/`@rc`) o una versión preliminar exacta (`@1.2.3-beta.4`).

    Para instalaciones de npm sin una versión exacta (`npm:<package>` o `npm:<package>@latest`), OpenClaw comprueba los metadatos del paquete resuelto antes de instalar. Si el paquete estable más reciente requiere una API de Plugin de OpenClaw más nueva o una versión mínima del host más reciente, OpenClaw inspecciona versiones estables anteriores e instala en su lugar la versión compatible más reciente. Las versiones exactas y los dist-tags explícitos siguen siendo estrictos: una selección incompatible falla y te pide que actualices OpenClaw o elijas una versión compatible.

    Si una especificación de instalación sin prefijo coincide con un id de Plugin oficial (por ejemplo, `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete npm con el mismo nombre, usa una especificación con ámbito explícito (por ejemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio Git. Formas admitidas: `git:github.com/owner/repo`, `git:owner/repo`, URLs de clonación completas `https://`, `ssh://`, `git://`, `file://` y `git@host:owner/repo.git`. Agrega `@<ref>` o `#<ref>` para extraer una rama, etiqueta o commit antes de instalar.

    Las instalaciones Git clonan en un directorio temporal, extraen la ref solicitada cuando está presente y luego usan el instalador normal de directorios de Plugins, por lo que la validación del manifiesto, la política de instalación del operador, el trabajo de instalación del gestor de paquetes y los registros de instalación se comportan como las instalaciones de npm. Las instalaciones Git registradas incluyen la URL/ref de origen más el commit resuelto para que `openclaw plugins update` pueda volver a resolver el origen más tarde.

    Después de instalar desde Git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime como métodos del Gateway y comandos de CLI. Si el Plugin registró una raíz de CLI con `api.registerCli`, ejecuta ese comando directamente a través de la CLI raíz de OpenClaw, por ejemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos">
    Archivos admitidos: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos nativos de Plugins de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz del Plugin extraído; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    Usa `npm-pack:<path.tgz>` cuando el archivo sea un tarball npm-pack y quieras
    la misma ruta de proyecto npm administrado por Plugin que usan las instalaciones de registro,
    incluida la verificación de `package-lock.json`, el escaneo de dependencias elevadas
    y los registros de instalación de npm. Las rutas de archivo simples siguen instalándose como archivos locales
    bajo la raíz de extensiones de Plugins.

    También se admiten instalaciones desde el marketplace de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Las especificaciones de Plugins seguras para npm sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento, salvo que coincidan con un id de Plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución solo por npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la API de Plugin anunciada / compatibilidad mínima del Gateway antes de instalar. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` npm-pack versionado, verifica el encabezado de resumen de ClawHub y el resumen del artefacto, y luego lo instala mediante la ruta normal de archivos. Las versiones anteriores de ClawHub sin metadatos de ClawPack siguen instalándose mediante la ruta heredada de verificación de archivos de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, tipo de artefacto, integridad npm, shasum npm, nombre de tarball y datos de resumen de ClawPack para actualizaciones posteriores.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más recientes de ClawHub; los selectores explícitos de versión o etiqueta, como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta`, permanecen fijados a ese selector.

### Abreviatura de marketplace

Usa la abreviatura `plugin@marketplace` cuando el nombre del marketplace exista en la caché de registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` para pasar explícitamente el origen del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Orígenes del marketplace">
    - un nombre de marketplace conocido de Claude de `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta `marketplace.json`
    - una abreviatura de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL de git

  </Tab>
  <Tab title="Reglas de marketplace remoto">
    Para marketplaces remotos cargados desde GitHub o git, las entradas de plugin deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta orígenes de ruta relativa de ese repositorio y rechaza orígenes de Plugin HTTP(S), de ruta absoluta, git, GitHub y otros orígenes de Plugin que no sean rutas de manifiestos remotos.
  </Tab>
</Tabs>

Para rutas y archivos locales, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json`, o el diseño predeterminado de componentes de Claude cuando ese archivo de manifiesto está ausente)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Las instalaciones locales administradas deben ser directorios o archivos de plugin. Los archivos de plugin independientes `.js`,
`.mjs`, `.cjs` y `.ts` no se copian en la raíz de plugin administrada mediante `plugins install`, ni se cargan colocándolos directamente en
`~/.openclaw/extensions` o `<workspace>/.openclaw/extensions`; esas raíces
detectadas automáticamente cargan directorios de paquetes o bundles de plugin, y omiten
los archivos de script de nivel superior como auxiliares locales. Lista los archivos independientes explícitamente en
`plugins.load.paths` en su lugar.

<Note>
Los bundles compatibles se instalan en la raíz de plugin normal y participan en el mismo flujo de listar/información/habilitar/deshabilitar. Actualmente, se admiten las Skills de bundles, command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` / `lspServers` declarados por manifiesto, command-skills de Cursor y directorios de hooks compatibles con Codex; otras capacidades de bundle detectadas se muestran en diagnósticos/información, pero aún no están conectadas a la ejecución en tiempo de ejecución.
</Note>

Usa `-l`/`--link` para apuntar a un directorio de plugin local sin copiarlo (se agrega a
`plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` no se admite con `--force` (los plugins vinculados apuntan directamente a la
ruta de origen, así que no hay nada que sobrescribir en el lugar), `--marketplace` ni
instalaciones `git:`, y requiere una ruta local que ya exista.

<Note>
Los plugins originados en el espacio de trabajo descubiertos desde una raíz de extensiones del espacio de trabajo no se
importan ni ejecutan hasta que se habilitan explícitamente. Para el desarrollo local,
ejecuta `openclaw plugins enable <plugin-id>` o establece
`plugins.entries.<plugin-id>.enabled: true`; si tu configuración usa
`plugins.allow`, incluye también allí el mismo id de plugin. Esta regla de fallo cerrado
también se aplica cuando la configuración del canal apunta explícitamente a un plugin originado en el espacio de trabajo para
carga solo de configuración, por lo que el código de configuración del plugin de canal local no se ejecutará mientras ese
plugin del espacio de trabajo permanezca deshabilitado o excluido de la lista de permitidos. Las instalaciones vinculadas
y las entradas explícitas de `plugins.load.paths` siguen la política normal para su
origen de plugin resuelto. Consulta
[Configurar la política de plugins](/es/tools/plugin#configure-plugin-policy)
y [Referencia de configuración](/es/gateway/configuration-reference#plugins).

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice de plugins administrados, manteniendo el comportamiento predeterminado sin fijar.
</Note>

## Lista

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
  Cambia de la vista de tabla a líneas de detalle por plugin con metadatos de formato/origen/procedencia/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina, más diagnósticos del registro y estado de instalación de dependencias de paquetes.
</ParamField>

<Note>
`plugins list` lee primero el registro de plugins local persistido, con una alternativa derivada solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un plugin está instalado, habilitado y visible para la planificación de arranque en frío, pero no es una prueba en vivo del tiempo de ejecución de un proceso Gateway que ya se está ejecutando. Después de cambiar el código del plugin, su habilitación, la política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecute el nuevo código `register(api)` o los hooks. En despliegues remotos/en contenedores, verifica que estás reiniciando el proceso hijo real `openclaw gateway run`, no solo un proceso contenedor.

`plugins list --json` incluye el `dependencyStatus` de cada plugin desde `package.json`
`dependencies` y `optionalDependencies`. OpenClaw comprueba si esos nombres de paquetes
están presentes a lo largo de la ruta normal de búsqueda de `node_modules` de Node del plugin; no
importa código de ejecución del plugin, no ejecuta un gestor de paquetes ni repara dependencias
faltantes.
</Note>

Si los registros de arranque indican `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ejecuta `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con un id de plugin listado para confirmar los ids de plugin
y copiar ids de confianza en `plugins.allow` en `openclaw.json`. Cuando la
advertencia puede listar todos los plugins descubiertos, imprime un fragmento de
`plugins.allow` listo para pegar que ya incluye esos ids. Si un plugin se carga
sin procedencia de instalación/ruta de carga, inspecciona ese id de plugin y luego fija
el id de confianza en `plugins.allow` o reinstala el plugin desde un origen de confianza
para que OpenClaw registre la procedencia de instalación.

Para trabajo con plugins incluidos dentro de una imagen Docker empaquetada, monta con bind el directorio de código fuente del plugin
sobre la ruta de código fuente empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw descubre esa superposición de código fuente montada
antes de `/app/dist/extensions/synology-chat`; un directorio de código fuente copiado sin más
permanece inerte, por lo que las instalaciones empaquetadas normales siguen usando el dist compilado.

Para depurar hooks en tiempo de ejecución:
</final>

- `openclaw plugins inspect <id> --runtime --json` muestra los hooks registrados y los diagnósticos de una pasada de inspección con el módulo cargado. La inspección en runtime nunca instala dependencias; usa `openclaw doctor --fix` para limpiar el estado de dependencias heredado o recuperar plugins descargables faltantes que estén referenciados por la configuración.
- `openclaw gateway status --deep --require-rpc` confirma la URL/perfil del Gateway alcanzable, las pistas de servicio/proceso, la ruta de configuración y la salud de RPC.
- Los hooks de conversación no incluidos de serie (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Índice de Plugin

Los metadatos de instalación de Plugin son estado gestionado por máquina, no configuración de usuario. Las instalaciones y actualizaciones los escriben en la base de datos SQLite de estado compartido bajo el directorio de estado activo de OpenClaw. La fila `installed_plugin_index` almacena metadatos duraderos de `installRecords`, incluidos registros de manifiestos de Plugin rotos o faltantes, además de una caché de registro en frío derivada del manifiesto que usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro de plugins en frío.

Cuando OpenClaw ve registros heredados distribuidos de `plugins.installs` en la configuración, las lecturas en runtime los tratan como entrada de compatibilidad sin reescribir `openclaw.json`. Las escrituras explícitas de Plugin y `openclaw doctor --fix` mueven esos registros al índice de Plugin y eliminan la clave de configuración cuando se permiten escrituras de configuración; si alguna escritura falla, los registros de configuración se conservan para que no se pierdan los metadatos de instalación.

## Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` elimina los registros de Plugin de `plugins.entries`, el índice de Plugin persistido, las entradas de listas de permitidos/denegados de Plugin y las entradas vinculadas de `plugins.load.paths` cuando corresponde. A menos que se establezca `--keep-files`, la desinstalación también elimina el directorio de instalación gestionado registrado, pero solo cuando se resuelve dentro de la raíz de extensiones de plugins de OpenClaw. Si el Plugin posee actualmente el slot `memory` o `contextEngine`, ese slot se restablece a su valor predeterminado (`memory-core` para memoria, `legacy` para motor de contexto).

`uninstall` imprime una vista previa de lo que se eliminará y luego solicita `Uninstall plugin "<id>"?` antes de hacer cambios. Pasa `--force` para omitir la solicitud de confirmación (útil para scripts y ejecuciones no interactivas); sin él, la desinstalación requiere una TTY interactiva. `--dry-run` imprime la misma vista previa y sale sin solicitar confirmación ni cambiar nada.

<Note>
`--keep-config` se admite como alias obsoleto de `--keep-files`.
</Note>

## Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a instalaciones de Plugin registradas en el índice de Plugin gestionado y a instalaciones de paquetes de hooks registradas en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de Plugin frente a especificación npm">
    Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese Plugin. Eso significa que los dist-tags almacenados anteriormente, como `@beta`, y las versiones fijadas exactas se siguen usando en ejecuciones posteriores de `update <id>`.

    Durante `update <id> --dry-run`, las instalaciones npm fijadas a versiones exactas permanecen fijadas. Si OpenClaw también puede resolver la línea predeterminada del registro del paquete y esa línea predeterminada es más reciente que la versión fijada instalada, la ejecución de prueba informa la fijación e imprime el comando explícito de actualización del paquete `@latest` para seguir la línea predeterminada del registro.

    Esa regla de actualización dirigida difiere de la ruta de mantenimiento masiva `openclaw plugins update --all`. Las actualizaciones masivas siguen respetando las especificaciones de instalación registradas ordinarias, pero los registros de plugins oficiales de confianza de OpenClaw pueden sincronizarse con el objetivo actual del catálogo oficial en lugar de quedarse en un paquete oficial exacto obsoleto. Usa `update <id>` dirigido cuando quieras conservar intencionalmente una especificación oficial exacta o etiquetada sin cambios.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con un dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de Plugin rastreado, actualiza ese Plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre del paquete npm sin versión ni etiqueta también se resuelve de vuelta al registro de Plugin rastreado. Usa esto cuando un Plugin estaba fijado a una versión exacta y quieras moverlo de vuelta a la línea de publicación predeterminada del registro.

  </Accordion>
  <Accordion title="Actualizaciones del canal beta">
    `openclaw plugins update <id-or-npm-spec>` dirigido reutiliza la especificación de Plugin registrada a menos que pases una especificación nueva. `openclaw plugins update --all` masivo usa el `update.channel` configurado cuando sincroniza registros de plugins oficiales de confianza con el objetivo del catálogo oficial, de modo que las instalaciones del canal beta pueden permanecer en la línea de publicación beta en lugar de normalizarse silenciosamente a stable/latest.

    `openclaw update` también conoce el canal de actualización activo de OpenClaw: en el canal beta, los registros de plugins npm de línea predeterminada y ClawHub prueban `@beta` primero. Recurren a la especificación predeterminada/latest registrada si no existe una publicación beta del Plugin; los plugins npm también recurren cuando el paquete beta existe pero falla la validación de instalación. Ese fallback se informa como advertencia y no hace fallar la actualización del núcleo. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector para actualizaciones dirigidas.

  </Accordion>
  <Accordion title="Comprobaciones de versión y deriva de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado contra los metadatos del registro npm. Si la versión instalada y la identidad del artefacto registrada ya coinciden con el objetivo resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido, OpenClaw lo trata como deriva de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real y pide confirmación antes de continuar. Los helpers de actualización no interactivos fallan en modo cerrado a menos que el llamador proporcione una política de continuación explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en update">
    `--dangerously-force-unsafe-install` también se acepta en `plugins update` por compatibilidad, pero está obsoleto y ya no cambia el comportamiento de actualización de plugins. `security.installPolicy` del operador aún puede bloquear actualizaciones; los hooks `before_install` de Plugin solo se aplican en procesos donde se cargan hooks de Plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk en update">
    Las actualizaciones de plugins respaldados por ClawHub comunitario ejecutan la misma comprobación de confianza de publicación exacta que las instalaciones antes de descargar el paquete de reemplazo. Usa `--acknowledge-clawhub-risk` para automatizaciones revisadas que deban continuar cuando la publicación de ClawHub seleccionada tenga una advertencia de confianza riesgosa. Los paquetes oficiales de ClawHub y las fuentes de Plugin incluidas de OpenClaw omiten esta solicitud de confianza de publicación.
  </Accordion>
</AccordionGroup>

## Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Inspect muestra identidad, estado de carga, fuente, capacidades del manifiesto, indicadores de política, diagnósticos, metadatos de instalación, capacidades del paquete incluido y cualquier soporte detectado de servidor MCP o LSP sin importar el runtime del Plugin de forma predeterminada. La salida JSON incluye los contratos del manifiesto de Plugin, como `contracts.agentToolResultMiddleware` y `contracts.trustedToolPolicies`, para que los operadores puedan auditar las declaraciones de superficies de confianza antes de habilitar o reiniciar un Plugin. Añade `--runtime` para cargar el módulo de Plugin e incluir hooks, herramientas, comandos, servicios, métodos de Gateway y rutas HTTP registrados. La inspección en runtime informa directamente las dependencias faltantes del Plugin; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos de CLI propiedad de Plugin normalmente se instalan como grupos de comandos raíz de `openclaw`, pero los plugins también pueden registrar comandos anidados bajo un padre del núcleo, como `openclaw nodes`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútalo en la ruta indicada; por ejemplo, un Plugin que registra `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada Plugin se clasifica por lo que realmente registra en runtime:

| Forma               | Significado                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | exactamente un tipo de capacidad (p. ej., un Plugin solo proveedor) |
| `hybrid-capability` | más de un tipo de capacidad (p. ej., texto + voz + imágenes)      |
| `hook-only`         | solo hooks, sin capacidades, herramientas, comandos, servicios ni rutas |
| `non-capability`    | herramientas/comandos/servicios, pero sin capacidades             |

Consulta [Formas de Plugin](/es/plugins/architecture#plugin-shapes) para más información sobre el modelo de capacidades.

<Note>
La marca `--json` genera un informe legible por máquina adecuado para scripting y auditoría. `inspect --all` renderiza una tabla de toda la flota con columnas de forma, tipos de capacidad, avisos de compatibilidad, capacidades del paquete incluido y resumen de hooks. `info` es un alias de `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de Plugin, diagnósticos de manifiesto/descubrimiento, avisos de compatibilidad y referencias obsoletas de configuración de Plugin, como slots de Plugin faltantes. Cuando el árbol de instalación y la configuración de Plugin están limpios, imprime `No plugin issues detected.` Si queda configuración obsoleta pero el árbol de instalación está sano por lo demás, el resumen lo indica en lugar de implicar salud completa de Plugin.

Si un Plugin configurado está presente en disco pero bloqueado por las comprobaciones de seguridad de ruta del cargador, la validación de configuración conserva la entrada de Plugin y la informa como `present but blocked`. Corrige el diagnóstico previo de Plugin bloqueado, como la propiedad de la ruta o permisos escribibles por todos, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para fallos de forma de módulo, como exportaciones `register`/`activate` faltantes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de forma de exportación en la salida de diagnóstico.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo de lectura en frío persistido de OpenClaw para identidad de Plugin instalado, habilitación, metadatos de fuente y propiedad de contribuciones. El arranque normal, la búsqueda de propietario de proveedor, la clasificación de configuración de canales y el inventario de plugins pueden leerlo sin importar módulos de runtime de Plugin.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado u obsoleto. Usa `--refresh` para reconstruirlo desde el índice de Plugin persistido, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en runtime.

`openclaw doctor --fix` también repara la deriva npm gestionada adyacente al registro: si un paquete huérfano o recuperado `@openclaw/*` bajo un proyecto npm de Plugin gestionado o la raíz npm gestionada plana heredada oculta un Plugin incluido, doctor elimina ese paquete obsoleto y reconstruye el registro para que el arranque valide contra el manifiesto incluido. Doctor también revincula el paquete host `openclaw` dentro de plugins npm gestionados que declaran `peerDependencies.openclaw`, para que las importaciones de runtime locales del paquete, como `openclaw/plugin-sdk/*`, se resuelvan después de actualizaciones o reparaciones npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad de emergencia obsoleto para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; el fallback de entorno es solo para recuperación de arranque de emergencia mientras se despliega la migración.
</Warning>

## Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` enumera las entradas del feed de marketplace configurado de OpenClaw. De forma predeterminada, intenta usar el feed alojado y recurre a la instantánea aceptada más reciente o a los datos incluidos. Usa `--feed-profile <name>` para leer un perfil configurado específico, `--feed-url <url>` para leer una URL explícita de feed alojado y `--offline` para leer la instantánea aceptada más reciente sin recuperar el feed.

`plugins marketplace refresh` actualiza la instantánea del feed alojado configurado e informa si OpenClaw aceptó datos alojados, una instantánea alojada o datos incluidos como alternativa. Usa `--expected-sha256` cuando un llamador necesite que el comando falle salvo que una carga útil alojada nueva coincida con una suma de comprobación fijada.

Marketplace `list` acepta una ruta de marketplace local, una ruta de `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de origen resuelta junto con el manifiesto de marketplace analizado y las entradas de Plugin.

La actualización de marketplace carga un feed de marketplace alojado de OpenClaw y conserva la
respuesta validada como instantánea local del feed alojado. Sin opciones, usa
el perfil de feed predeterminado configurado. Usa `--feed-profile <name>` para actualizar un
perfil configurado específico, `--feed-url <url>` para actualizar una URL explícita de
feed alojado, `--expected-sha256 <sha256>` para exigir una suma de comprobación de carga útil coincidente
(`sha256:<hex>` o un resumen hexadecimal simple de 64 caracteres), y `--json` para
salida legible por máquina. Las URL explícitas de feed alojado no deben incluir
credenciales, cadenas de consulta ni fragmentos. Las actualizaciones sin fijar pueden informar de un
resultado de instantánea alojada o de alternativa incluida sin hacer fallar el comando. Las actualizaciones
fijadas fallan salvo que acepten una carga útil alojada nueva, y las actualizaciones alojadas
correctas fallan si OpenClaw no puede conservar la instantánea validada.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Referencia de CLI](/es/cli)
- [ClawHub](/clawhub)
