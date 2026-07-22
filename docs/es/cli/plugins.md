---
read_when:
    - Quiere instalar o gestionar plugins del Gateway o paquetes compatibles
    - Se desea crear la estructura inicial o validar un Plugin de herramienta sencillo
    - Quieres depurar los fallos de carga de plugins
sidebarTitle: Plugins
summary: Referencia de la CLI para `openclaw plugins` (inicializar, compilar, validar, listar, instalar, marketplace, desinstalar, habilitar/deshabilitar, diagnosticar)
title: Plugins
x-i18n:
    generated_at: "2026-07-22T10:28:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: af179ea8abc2c6b785200ee44cd4f91a24ec5643ec1825c357572f1b05b33790
    source_path: cli/plugins.md
    workflow: 16
---

Administra plugins del Gateway, paquetes de hooks y paquetes compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de plugins" href="/es/tools/plugin">
    Guía para usuarios finales sobre la instalación, activación y resolución de problemas de plugins.
  </Card>
  <Card title="Administrar plugins" href="/es/plugins/manage-plugins">
    Ejemplos rápidos para instalar, listar, actualizar, desinstalar y publicar.
  </Card>
  <Card title="Paquetes de plugins" href="/es/plugins/bundles">
    Modelo de compatibilidad de paquetes.
  </Card>
  <Card title="Manifiesto de plugin" href="/es/plugins/manifest">
    Campos del manifiesto y esquema de configuración.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security">
    Refuerzo de la seguridad para instalaciones de plugins.
  </Card>
</CardGroup>

## Comandos

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias de inspect
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

Para investigar instalaciones, inspecciones, desinstalaciones o actualizaciones del registro lentas, ejecuta el
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. El seguimiento escribe las duraciones de las fases
en stderr y mantiene analizable la salida JSON. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
En el modo Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` es inmutable. `install`, `update`, `uninstall`, `enable` y `disable` se niegan a ejecutarse. En su lugar, edita la fuente Nix de esta instalación (`programs.openclaw.config` o `instances.<name>.config` para nix-openclaw) y, a continuación, vuelve a compilar. Consulta el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado a agentes.
</Note>

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están activados de forma predeterminada (por ejemplo, los proveedores de modelos incluidos, los proveedores de voz incluidos y el plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw incluyen `openclaw.plugin.json` con un esquema JSON en línea (`configSchema`, incluso si está vacío). Los paquetes compatibles usan sus propios manifiestos de paquete.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de la lista o de la información también muestra el subtipo de paquete (`codex`, `claude` o `cursor`), además de las capacidades detectadas del paquete.
</Note>

## Creación

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea de forma predeterminada un plugin de herramientas mínimo en TypeScript. El primer
argumento es el identificador del plugin; `--name` establece el nombre para mostrar. OpenClaw usa el
identificador para el directorio de salida predeterminado y el nombre del paquete. Las plantillas de herramientas usan
`defineToolPlugin` y generan los scripts `package.json`, `plugin:build` y
`plugin:validate`, que compilan y después invocan `openclaw plugins build`/`validate`.

`plugins build` importa el punto de entrada compilado, lee sus metadatos estáticos de herramientas, escribe
`openclaw.plugin.json` y mantiene alineado el `openclaw.extensions` de `package.json`.
`plugins validate` comprueba que el manifiesto generado, los metadatos del paquete y
la exportación actual del punto de entrada sigan coincidiendo. Consulta [Plugins de herramientas](/es/plugins/tool-plugins) para
ver el flujo de creación completo.

La plantilla escribe el código fuente de TypeScript, pero genera los metadatos a partir del punto de entrada
`./dist/index.js` compilado, por lo que el flujo de trabajo también funciona con la CLI publicada. Usa
`--entry <path>` cuando el punto de entrada no sea el punto de entrada predeterminado del paquete. Usa
`plugins build --check` en CI para generar un error cuando los metadatos generados estén obsoletos, sin
reescribir archivos.

### Plantilla de proveedor

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Las plantillas de proveedores crean un plugin genérico de proveedor de modelos compatible con OpenAI,
con la infraestructura de autenticación mediante clave de API, un script `npm run validate` que ejecuta
`clawhub package validate`, metadatos de paquete de ClawHub y un flujo de trabajo de GitHub Actions
que se ejecuta manualmente para permitir futuras publicaciones de confianza mediante OIDC de GitHub.
Las plantillas de proveedores no generan Skills ni usan
`openclaw plugins build`/`validate`; esos comandos corresponden a la ruta de metadatos generados
de la plantilla de herramientas.

Antes de publicar, sustituye la URL base de API de marcador de posición, el catálogo de modelos, la ruta de
documentación, el texto de las credenciales y el contenido del README por los datos reales del proveedor. Usa el
README generado para la primera publicación en ClawHub y la configuración del publicador de confianza.

## Instalación

```bash
openclaw plugins search "calendar"                      # buscar plugins en ClawHub
openclaw plugins install @openclaw/<package>            # catálogo oficial de confianza
openclaw plugins install <package>                       # paquete npm arbitrario
openclaw plugins install clawhub:<package>                # solo ClawHub
openclaw plugins install npm:<package>                    # solo npm
openclaw plugins install npm-pack:<path.tgz>               # archivo tar local de npm-pack
openclaw plugins install git:github.com/<owner>/<repo>     # repositorio git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # ruta o archivo local
openclaw plugins install -l <path>                         # enlazar en lugar de copiar
openclaw plugins install <plugin>@<marketplace>             # forma abreviada del marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explícito)
openclaw plugins install <package> --force                  # confirmar fuente / sobrescribir existente
openclaw plugins install <package> --pin                    # fijar la versión npm resuelta
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Los mantenedores que prueben instalaciones durante la configuración pueden anular las fuentes automáticas de instalación de
plugins mediante variables de entorno protegidas. Consulta
[Anulaciones de instalación de plugins](/es/plugins/install-overrides).

<Warning>
Los nombres de paquete sin prefijo se instalan desde npm de forma predeterminada durante la transición del lanzamiento, salvo que coincidan con un identificador de plugin incluido u oficial, en cuyo caso OpenClaw usa esa copia local u oficial en lugar de acceder al registro npm. Usa `npm:<package>` cuando se quiera expresamente un paquete npm externo. Usa `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como la ejecución de código; da preferencia a las versiones fijadas.
</Warning>

<Warning>
Los paquetes de ClawHub y el catálogo incluido/oficial de OpenClaw son fuentes de instalación
de confianza. Una nueva fuente arbitraria de npm, `npm-pack:`, git, ruta/archivo local o
marketplace muestra una advertencia y solicita confirmación antes de continuar. Las instalaciones arbitrarias
no interactivas deben incluir `--force` después de revisar la fuente y confiar en ella. La misma
opción sobrescribe un destino de instalación existente cuando es necesario. Las actualizaciones normales de una
instalación cuyo seguimiento ya está activo no la requieren. Esta confirmación es independiente de
`--acknowledge-clawhub-risk`, que solo se aplica a las advertencias de confianza sobre versiones riesgosas de
ClawHub. `--force` no omite `security.installPolicy` ni las comprobaciones de seguridad de
instalación restantes.
</Warning>

`plugins search` consulta en ClawHub los paquetes instalables `code-plugin` y
`bundle-plugin` (no Skills; usa `openclaw skills search` para estas).
El valor predeterminado de `--limit` es 20, con un máximo de 100. Solo lee el catálogo remoto: no
inspecciona el estado local, modifica la configuración, instala paquetes ni carga el entorno de ejecución del
plugin. Los resultados incluyen el nombre del paquete de ClawHub, la familia, el canal, la versión,
el resumen y una indicación de instalación como `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub es la principal superficie de distribución y descubrimiento para la mayoría de los plugins. Npm
sigue siendo una alternativa compatible y una ruta de instalación directa. Los paquetes de plugins
`@openclaw/*` propiedad de OpenClaw vuelven a publicarse en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables usan `latest`.
Las instalaciones y actualizaciones del canal beta prefieren la etiqueta de distribución `beta` de npm cuando está disponible
y, en caso contrario, recurren a `latest`. En el canal estable extendido, los plugins oficiales de npm
con intención sin prefijo/predeterminada o `latest` se resuelven a la versión exacta instalada del núcleo.
Las versiones exactas fijadas y las etiquetas explícitas distintas de `latest`, los paquetes de terceros y
las fuentes ajenas a npm no se reescriben.
</Note>

<AccordionGroup>
  <Accordion title="Inclusiones de configuración y reparación de configuraciones no válidas">
    Si la sección `plugins` está respaldada por una inclusión `$include` de un único archivo, `plugins install/update/enable/disable/uninstall` escribe directamente en ese archivo incluido y deja `openclaw.json` intacto. Las inclusiones raíz, las matrices de inclusiones y las inclusiones con anulaciones hermanas generan un error seguro en lugar de aplanarse. Consulta [Inclusiones de configuración](/es/gateway/configuration) para conocer las estructuras compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente genera un error seguro y solicita ejecutar primero `openclaw doctor --fix`. Durante el inicio y la recarga en caliente del Gateway, una configuración de plugin no válida genera un error seguro como cualquier otra configuración no válida; `openclaw doctor --fix` puede poner en cuarentena la entrada del plugin no válida. La única excepción documentada durante la instalación es una ruta limitada de recuperación de plugins incluidos para aquellos que habilitan expresamente `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="Confirmación con --force y reinstalación frente a actualización">
    `--force` confirma una fuente ajena a ClawHub sin solicitar confirmación. No omite `security.installPolicy` ni las comprobaciones de seguridad de instalación restantes. Cuando el plugin o paquete de hooks ya está instalado, también reutiliza el destino existente y lo sobrescribe en el mismo lugar. Úsalo después de revisar una fuente arbitraria de npm, local, archivo, git o marketplace, o cuando se reinstale intencionadamente el mismo identificador. Para las actualizaciones habituales de un plugin npm cuyo seguimiento ya está activo, usa preferentemente `openclaw plugins update <id-or-npm-spec>`.

    Si se ejecuta `plugins install` con el identificador de un plugin que ya está instalado, OpenClaw se detiene y remite a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente se quiera sobrescribir la instalación actual desde una fuente diferente. Las fuentes arbitrarias siguen mostrando la advertencia interactiva sobre procedencia; las instalaciones no interactivas deben incluir `--force` después de revisarlas. Las fuentes de confianza de ClawHub y del catálogo de OpenClaw no la necesitan. Con `--link`, `--force` confirma la fuente, pero no cambia el modo de instalación mediante ruta enlazada.

  </Accordion>
  <Accordion title="Ámbito de --pin">
    `--pin` se aplica únicamente a las instalaciones de npm y registra el `<name>@<version>` exacto resuelto. No es compatible con instalaciones `git:` (fija la referencia en la especificación, por ejemplo, `git:github.com/acme/plugin@v1.2.3`) ni con `--marketplace` (las instalaciones desde el marketplace conservan metadatos de la fuente del marketplace en lugar de una especificación de npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto y ahora no realiza ninguna operación. OpenClaw ya no ejecuta el bloqueo integrado de código peligroso durante la instalación de plugins.

    Usa la superficie `security.installPolicy` propiedad del operador cuando se requiera una política de instalación específica del host. Los hooks `before_install` del Plugin son hooks del ciclo de vida del runtime del Plugin, no el límite de política principal para las instalaciones mediante la CLI.

    Si un Plugin que publicaste en ClawHub está oculto o bloqueado por un análisis del registro, sigue los pasos para publicadores de [Publicación en ClawHub](/es/clawhub/publishing). `--dangerously-force-unsafe-install` no solicita a ClawHub que vuelva a analizar el Plugin ni que haga pública una versión bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Las instalaciones de ClawHub de la comunidad comprueban el registro de confianza de la versión seleccionada antes de descargarla. Si ClawHub deshabilita la descarga de la versión, informa de hallazgos maliciosos en el análisis o coloca la versión en un estado de moderación bloqueante (en cuarentena, revocada), OpenClaw la rechaza de plano independientemente de esta opción. Para estados de análisis de riesgo o estados de moderación no bloqueantes, OpenClaw muestra los detalles de confianza y solicita confirmación antes de continuar.

    Usa `--acknowledge-clawhub-risk` solo después de revisar la advertencia de ClawHub y decidir continuar sin una solicitud interactiva. Los resultados de análisis pendientes u obsoletos (aún no limpios) generan una advertencia, pero no requieren confirmación. Los paquetes oficiales de ClawHub y las fuentes de Plugins incluidos con OpenClaw omiten por completo esta comprobación de confianza de la versión.

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones de npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para la visibilidad filtrada de hooks y la habilitación individual de cada hook, no para instalar paquetes.

    Las especificaciones de npm son **solo para el registro** (nombre del paquete más una **versión exacta** o **dist-tag** opcional). Se rechazan las especificaciones de Git/URL/archivo y los rangos semver. Por seguridad, las instalaciones de dependencias se ejecutan en un proyecto npm administrado por Plugin con `--ignore-scripts`, incluso cuando el shell tiene una configuración global de instalación de npm. Los proyectos npm administrados de los Plugins heredan el `overrides` de npm a nivel de paquete de OpenClaw, por lo que las restricciones de seguridad del host también se aplican a las dependencias elevadas de los Plugins.

    Usa `npm:<package>` para hacer explícita la resolución de npm. Durante la transición del lanzamiento, las especificaciones simples de paquetes también se instalan directamente desde npm, salvo que coincidan con un id de Plugin oficial.

    Las especificaciones `@openclaw/*` sin procesar que coinciden con Plugins incluidos se resuelven a la copia incluida propiedad de la imagen antes de recurrir a npm. Por ejemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa el Plugin de Discord incluido en la compilación actual de OpenClaw en lugar de crear una anulación administrada de npm. Para forzar el paquete externo de npm, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Las especificaciones simples y `@latest` permanecen en el canal estable. Las versiones de corrección de OpenClaw con fecha, como `2026.5.3-1`, se consideran estables para esta comprobación. Si npm resuelve cualquiera de estas formas a una versión preliminar, OpenClaw se detiene y solicita una aceptación explícita mediante una etiqueta de versión preliminar (`@beta`/`@rc`) o una versión preliminar exacta (`@1.2.3-beta.4`).

    Para instalaciones de npm sin una versión exacta (`npm:<package>` o `npm:<package>@latest`), OpenClaw comprueba los metadatos del paquete resuelto antes de instalarlo. Si el paquete estable más reciente requiere una API de Plugin de OpenClaw más nueva o una versión mínima del host superior, OpenClaw examina versiones estables anteriores e instala en su lugar la versión compatible más reciente. Las versiones exactas y los dist-tags explícitos siguen siendo estrictos: una selección incompatible falla y solicita actualizar OpenClaw o elegir una versión compatible.

    Si una especificación de instalación simple coincide con un id de Plugin oficial (por ejemplo, `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete npm con el mismo nombre, usa una especificación con ámbito explícito (por ejemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio Git. Formas admitidas: `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` y URL de clonación `git@host:owner/repo.git`. Añade `@<ref>` o `#<ref>` para extraer una rama, etiqueta o commit antes de la instalación.

    Las instalaciones desde Git clonan en un directorio temporal, extraen la referencia solicitada cuando está presente y después usan el instalador normal de directorios de Plugins, por lo que la validación del manifiesto, la política de instalación del operador, las tareas de instalación del gestor de paquetes y los registros de instalación se comportan igual que en las instalaciones de npm. Las instalaciones desde Git registradas incluyen la URL/referencia de origen y el commit resuelto para que `openclaw plugins update` pueda volver a resolver el origen más adelante.

    Después de instalar desde Git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros del runtime, como los métodos del Gateway y los comandos de la CLI. Si el Plugin registró una raíz de la CLI con `api.registerCli`, ejecuta ese comando directamente mediante la CLI raíz de OpenClaw; por ejemplo, `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos comprimidos">
    Archivos admitidos: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos de Plugins nativos de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz extraída del Plugin; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    Usa `npm-pack:<path.tgz>` cuando el archivo sea un tarball de npm-pack y se quiera
    usar la misma ruta de proyecto npm administrado por Plugin que emplean las instalaciones desde el registro,
    incluida la verificación de `package-lock.json`, el análisis de dependencias elevadas
    y los registros de instalación de npm. Las rutas de archivos comprimidos simples se siguen instalando como
    archivos locales bajo la raíz de extensiones de Plugins.

    También se admiten instalaciones desde marketplaces de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador `clawhub:<package>` explícito:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Durante la transición del lanzamiento, las especificaciones de Plugins simples compatibles con npm se instalan desde npm de forma predeterminada, salvo que coincidan con un id de Plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución exclusiva mediante npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba antes de la instalación la compatibilidad anunciada con la API de Plugins y la versión mínima del Gateway. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` versionado de npm-pack, verifica el encabezado de resumen de ClawHub y el resumen del artefacto y, a continuación, lo instala mediante la ruta normal de archivos comprimidos. Las versiones anteriores de ClawHub sin metadatos de ClawPack se siguen instalando mediante la ruta heredada de verificación de archivos de paquetes. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, el tipo de artefacto, la integridad de npm, el shasum de npm, el nombre del tarball y los datos del resumen de ClawPack para futuras actualizaciones.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más recientes de ClawHub; los selectores explícitos de versión o etiqueta, como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta`, permanecen fijados a ese selector.

### Forma abreviada de marketplace

Usa la forma abreviada `plugin@marketplace` cuando el nombre del marketplace exista en la caché local del registro de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` para indicar explícitamente el origen del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Orígenes de marketplaces">
    - un nombre de marketplace conocido de Claude procedente de `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta `marketplace.json`
    - una forma abreviada de repositorio de GitHub, como `owner/repo`
    - una URL de repositorio de GitHub, como `https://github.com/owner/repo`
    - una URL de Git

  </Tab>
  <Tab title="Reglas de marketplaces remotos">
    Para los marketplaces remotos cargados desde GitHub o Git, las entradas de Plugins deben permanecer dentro del repositorio clonado del marketplace. OpenClaw acepta orígenes de rutas relativas de ese repositorio y rechaza los orígenes de Plugins HTTP(S), de rutas absolutas, Git, GitHub y otros orígenes que no sean rutas en los manifiestos remotos.
  </Tab>
</Tabs>

Para rutas y archivos locales, OpenClaw detecta automáticamente:

- Plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json`, o el diseño predeterminado de componentes de Claude cuando ese archivo de manifiesto no está presente)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Las instalaciones locales administradas deben ser directorios o archivos comprimidos de Plugins. Los archivos de Plugin independientes `.js`,
`.mjs`, `.cjs` y `.ts` no se copian en la raíz administrada de Plugins
mediante `plugins install`, ni se cargan al colocarlos directamente en
`~/.openclaw/extensions` o `<workspace>/.openclaw/extensions`; esas
raíces detectadas automáticamente cargan directorios de paquetes o bundles de Plugins y omiten
los archivos de scripts de nivel superior, ya que se consideran auxiliares locales. En su lugar, enumera explícitamente los archivos independientes en
`plugins.load.paths`.

<Note>
Los bundles compatibles se instalan en la raíz normal de Plugins y participan en el mismo flujo de enumeración/información/habilitación/deshabilitación. Actualmente, se admiten las Skills de bundles, las Skills de comandos de Claude, los valores predeterminados `settings.json` de Claude, los valores predeterminados `.lsp.json` de Claude y `lspServers` declarados en el manifiesto, las Skills de comandos de Cursor y los directorios de hooks compatibles con Codex; otras capacidades de bundles detectadas se muestran en los diagnósticos y la información, pero todavía no están conectadas a la ejecución del runtime.
</Note>

Usa `-l`/`--link` para apuntar a un directorio local de Plugins sin copiarlo (lo añade
a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` no es compatible con instalaciones `--marketplace` o `git:` y
requiere una ruta local que ya exista. Para crear un enlace local no interactivo,
pasa `--force` después de revisar el origen; confirma la procedencia, pero no
copia ni sobrescribe el directorio enlazado.

<Note>
Los Plugins con origen en un espacio de trabajo que se detectan desde una raíz de extensiones del espacio de trabajo no se
importan ni ejecutan hasta que se habilitan explícitamente. Para el desarrollo local,
ejecuta `openclaw plugins enable <plugin-id>` o configura
`plugins.entries.<plugin-id>.enabled: true`; si la configuración usa
`plugins.allow`, incluye también allí el mismo id de Plugin. Esta regla de cierre seguro
también se aplica cuando la configuración de un canal selecciona explícitamente un Plugin con origen en un espacio de trabajo para
cargarlo solo durante la configuración, por lo que el código de configuración del Plugin de canal local no se ejecutará mientras ese
Plugin del espacio de trabajo permanezca deshabilitado o excluido de la lista de permitidos. Las instalaciones enlazadas
y las entradas explícitas `plugins.load.paths` siguen la política normal correspondiente al
origen resuelto del Plugin. Consulta
[Configurar la política de Plugins](/es/tools/plugin#configure-plugin-policy)
y la [Referencia de configuración](/es/gateway/configuration-reference#plugins).

Usa `--pin` en instalaciones de npm para guardar la especificación exacta resuelta (`name@version`) en el índice administrado de Plugins, manteniendo sin fijar el comportamiento predeterminado.
</Note>

## Enumeración

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Muestra solo los Plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Cambia de la vista de tabla a líneas de detalles por Plugin con metadatos de formato/origen/procedencia/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina, junto con diagnósticos del registro y el estado de instalación de las dependencias de los paquetes.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistente de plugins, con una alternativa derivada únicamente del manifiesto cuando el registro falta o no es válido. Resulta útil para comprobar si un plugin está instalado, habilitado y visible para la planificación del inicio en frío, pero no es una sonda del entorno de ejecución en vivo de un proceso de Gateway que ya está en ejecución. Después de cambiar el código del plugin, la habilitación, la política de hooks o `plugins.load.paths`, reinicie el Gateway que sirve el canal antes de esperar que se ejecuten el código o los hooks nuevos de `register(api)`. Para implementaciones remotas o en contenedores, compruebe que se esté reiniciando el proceso secundario `openclaw gateway run` real, no solo un proceso contenedor.

`plugins list --json` incluye el `dependencyStatus` de cada plugin desde `package.json`
`dependencies` y `optionalDependencies`. OpenClaw comprueba si esos nombres de
paquete están presentes en la ruta de búsqueda `node_modules` normal de Node
del plugin; no importa el código de ejecución del plugin, no ejecuta un gestor
de paquetes ni repara dependencias faltantes.
</Note>

Si el registro de inicio muestra `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ejecute `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con un id de plugin incluido en la lista para confirmar los
ids de los plugins y copie los ids de confianza en `plugins.allow` dentro de
`openclaw.json`. Cuando la advertencia puede enumerar todos los plugins
detectados, imprime un fragmento `plugins.allow` listo para pegar que ya
incluye esos ids. Si un plugin se carga sin procedencia de instalación o de ruta
de carga, inspeccione ese id de plugin y, a continuación, fije el id de confianza
en `plugins.allow` o reinstale el plugin desde una fuente de confianza para
que OpenClaw registre la procedencia de la instalación.

Para trabajar con plugins incluidos dentro de una imagen de Docker empaquetada,
monte mediante enlace el directorio de origen del plugin sobre la ruta de origen
empaquetada correspondiente, como `/app/extensions/synology-chat`. OpenClaw detecta esa
superposición de origen montada antes que `/app/dist/extensions/synology-chat`; un directorio de
origen simplemente copiado permanece inactivo, por lo que las instalaciones
empaquetadas normales siguen utilizando el dist compilado.

Para depurar hooks en tiempo de ejecución:

- `openclaw plugins inspect <id> --runtime --json` muestra los hooks registrados y los diagnósticos de una pasada de inspección con el módulo cargado. La inspección en tiempo de ejecución nunca instala dependencias; utilice `openclaw doctor --fix` para limpiar el estado heredado de las dependencias o recuperar plugins descargables faltantes a los que haga referencia la configuración.
- `openclaw gateway status --deep --require-rpc` confirma la URL o el perfil accesible del Gateway, las indicaciones de servicio o proceso, la ruta de configuración y el estado de la RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Índice de plugins

Los metadatos de instalación de plugins son un estado gestionado por la máquina, no una configuración del usuario. Las instalaciones y actualizaciones los escriben en la base de datos de estado SQLite compartida bajo el directorio de estado activo de OpenClaw. La fila `installed_plugin_index` almacena metadatos duraderos de `installRecords`, incluidos registros de manifiestos de plugins dañados o faltantes, además de una caché de registro en frío derivada del manifiesto que utilizan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro de plugins en frío.

`plugins.installs` es una superficie de configuración creada manualmente que se ha retirado. El entorno de ejecución y los comandos de actualización solo leen el índice de plugins instalados de SQLite. Ejecute `openclaw doctor --fix` para importar los registros de configuración heredados al índice y eliminar la clave retirada antes del uso normal del entorno de ejecución.

## Desinstalación

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` elimina los registros del plugin de `plugins.entries`, el índice de plugins persistente, las entradas de las listas de plugins permitidos o denegados y las entradas `plugins.load.paths` vinculadas cuando corresponda. A menos que se establezca `--keep-files`, la desinstalación también elimina el directorio de instalación gestionado del que se realiza seguimiento, pero solo cuando este se resuelve dentro de la raíz de extensiones de plugins de OpenClaw. Si el plugin ocupa actualmente el espacio `memory` o `contextEngine`, ese espacio recupera su valor predeterminado (`memory-core` para la memoria y `legacy` para el motor de contexto).

`uninstall` imprime una vista previa de lo que se eliminará y, a continuación, solicita `Uninstall plugin "<id>"?` antes de realizar cambios. Pase `--force` para omitir la solicitud de confirmación (útil para scripts y ejecuciones no interactivas); sin esta opción, la desinstalación requiere una TTY interactiva. `--dry-run` imprime la misma vista previa y finaliza sin solicitar confirmación ni cambiar nada.

<Note>
`--keep-config` se admite como alias obsoleto de `--keep-files`.
</Note>

## Actualización

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a las instalaciones de plugins con seguimiento del índice de plugins gestionado y a las instalaciones de paquetes de hooks con seguimiento del estado SQLite compartido. Reutilizan la fuente que el usuario ya eligió al instalar el plugin, por lo que no requieren una segunda confirmación de la fuente.

<AccordionGroup>
  <Accordion title="Resolución entre el id del plugin y la especificación npm">
    Al pasar un id de plugin, OpenClaw reutiliza la especificación de instalación registrada para ese plugin. Esto significa que las etiquetas de distribución almacenadas previamente, como `@beta`, y las versiones exactas fijadas se siguen utilizando en ejecuciones posteriores de `update <id>`.

    Durante `update <id> --dry-run`, las instalaciones npm fijadas a una versión exacta permanecen fijadas. Si OpenClaw también puede resolver la línea predeterminada del registro del paquete y esa línea predeterminada es más reciente que la versión fijada instalada, la simulación informa de la fijación e imprime el comando explícito de actualización del paquete `@latest` para seguir la línea predeterminada del registro.

    Esta regla de actualización dirigida difiere de la ruta de mantenimiento masivo `openclaw plugins update --all`. Las actualizaciones masivas siguen respetando las especificaciones de instalación ordinarias de las que se realiza seguimiento, pero los registros de plugins oficiales de confianza de OpenClaw pueden sincronizarse con el objetivo actual del catálogo oficial en lugar de permanecer en un paquete oficial exacto obsoleto. Utilice la actualización dirigida `update <id>` cuando se quiera mantener deliberadamente intacta una especificación oficial exacta o etiquetada.

    Para las instalaciones npm, también se puede pasar una especificación explícita de paquete npm con una etiqueta de distribución o una versión exacta. OpenClaw vuelve a resolver ese nombre de paquete al registro de plugin del que se realiza seguimiento, actualiza el plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en el id.

    Pasar el nombre del paquete npm sin una versión ni una etiqueta también vuelve a resolverlo al registro de plugin del que se realiza seguimiento. Utilice esta opción cuando un plugin se haya fijado a una versión exacta y se quiera devolver a la línea de versiones predeterminada del registro.

  </Accordion>
  <Accordion title="Actualizaciones del canal beta">
    La actualización dirigida `openclaw plugins update <id-or-npm-spec>` reutiliza la especificación del plugin de la que se realiza seguimiento, salvo que se pase una nueva especificación. La actualización masiva `openclaw plugins update --all` utiliza el `update.channel` configurado al sincronizar registros de plugins oficiales de confianza con el objetivo del catálogo oficial, de modo que las instalaciones del canal beta pueden permanecer en la línea de versiones beta en lugar de normalizarse silenciosamente a estable/latest.

    `openclaw update` también conoce el canal de actualización activo de OpenClaw: en el canal beta, los registros de plugins npm y ClawHub de la línea predeterminada prueban primero `@beta`. Recurren a la especificación predeterminada/latest registrada si no existe una versión beta del plugin; los plugins npm también recurren a ella cuando el paquete beta existe, pero no supera la validación de instalación. Esta alternativa se notifica como una advertencia y no provoca un error en la actualización del núcleo. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector para las actualizaciones dirigidas.

  </Accordion>
  <Accordion title="Comprobaciones de versión y desviación de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado con los metadatos del registro npm. Si la versión instalada y la identidad registrada del artefacto ya coinciden con el objetivo resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido, OpenClaw lo considera una desviación del artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real y solicita confirmación antes de continuar. Los asistentes de actualización no interactivos bloquean de forma segura salvo que quien realiza la llamada proporcione una política de continuación explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en la actualización">
    `--dangerously-force-unsafe-install` también se acepta en `plugins update` por compatibilidad, pero está obsoleto y ya no cambia el comportamiento de actualización de los plugins. El `security.installPolicy` del operador todavía puede bloquear las actualizaciones; los hooks `before_install` del plugin solo se aplican en procesos donde se cargan los hooks de plugins.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk en la actualización">
    Las actualizaciones de plugins de la comunidad respaldados por ClawHub ejecutan la misma comprobación de confianza de la versión exacta que las instalaciones antes de descargar el paquete de reemplazo. Utilice `--acknowledge-clawhub-risk` para automatizaciones revisadas que deban continuar cuando la versión seleccionada de ClawHub tenga una advertencia de confianza que implique riesgos. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidas de OpenClaw omiten esta solicitud de confianza de la versión.
  </Accordion>
</AccordionGroup>

## Inspección

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

La inspección muestra la identidad, el estado de carga, la fuente, las capacidades del manifiesto, los indicadores de políticas, los diagnósticos, los metadatos de instalación, las capacidades del paquete y cualquier compatibilidad detectada con servidores MCP o LSP sin importar de forma predeterminada el entorno de ejecución del plugin. La salida JSON incluye los contratos del manifiesto del plugin, como `contracts.agentToolResultMiddleware` y `contracts.trustedToolPolicies`, para que los operadores puedan auditar las declaraciones de superficies de confianza antes de habilitar o reiniciar un plugin. Añada `--runtime` para cargar el módulo del plugin e incluir los hooks, las herramientas, los comandos, los servicios, los métodos del Gateway y las rutas HTTP registrados. La inspección en tiempo de ejecución informa directamente de las dependencias faltantes del plugin; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos de la CLI propiedad de plugins suelen instalarse como grupos de comandos raíz `openclaw`, pero los plugins también pueden registrar comandos anidados bajo un elemento principal del núcleo, como `openclaw nodes`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútelo en la ruta indicada; por ejemplo, un plugin que registre `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada plugin se clasifica según lo que registra realmente en tiempo de ejecución:

| Forma               | Significado                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | exactamente un tipo de capacidad (p. ej., un plugin exclusivo de proveedor)         |
| `hybrid-capability` | más de un tipo de capacidad (p. ej., texto + voz + imágenes)       |
| `hook-only`         | solo hooks, sin capacidades, herramientas, comandos, servicios ni rutas |
| `non-capability`    | herramientas/comandos/servicios, pero sin capacidades                       |

Consulte [Formas de plugins](/es/plugins/architecture#plugin-shapes) para obtener más información sobre el modelo de capacidades.

<Note>
El indicador `--json` genera un informe legible por máquinas, apto para scripts y auditorías. `inspect --all` representa una tabla de todo el parque con columnas de forma, tipos de capacidades, avisos de compatibilidad, capacidades del paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` informa de errores de carga de plugins, diagnósticos de manifiesto o detección, avisos de compatibilidad y referencias obsoletas de la configuración de plugins, como espacios de plugins faltantes. Cuando el árbol de instalación y la configuración de plugins están limpios, imprime `No plugin issues detected.` Si queda configuración obsoleta, pero el árbol de instalación está en buen estado por lo demás, el resumen lo indica en lugar de dar a entender que el estado de los plugins es totalmente correcto.

Si un plugin configurado está presente en el disco, pero las comprobaciones de seguridad de rutas del cargador lo bloquean, la validación de la configuración conserva la entrada del plugin y la notifica como `present but blocked`. Corrija el diagnóstico anterior del plugin bloqueado, como la propiedad de la ruta o los permisos de escritura para todos, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para fallos de estructura del módulo, como la ausencia de exportaciones `register`/`activate`, vuelva a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la estructura de exportaciones en la salida de diagnóstico.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo persistente de lectura en frío de OpenClaw para la identidad de los plugins instalados, su habilitación, los metadatos de origen y la propiedad de las contribuciones. El inicio normal, la búsqueda del propietario del proveedor, la clasificación de la configuración de canales y el inventario de plugins pueden leerlo sin importar módulos de tiempo de ejecución de los plugins.

Use `plugins registry` para comprobar si el registro persistente está presente, actualizado u obsoleto. Use `--refresh` para reconstruirlo a partir del índice persistente de plugins, la política de configuración y los metadatos del manifiesto o paquete. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

`openclaw doctor --fix` también repara las desviaciones adyacentes al registro en npm administrado. Si un paquete `@openclaw/*` huérfano o recuperado en un proyecto npm de plugins administrados o en la raíz plana heredada de npm administrado oculta un plugin incluido, doctor elimina ese paquete obsoleto y reconstruye el registro para que el inicio realice la validación con el manifiesto incluido. Cuando un registro de instalación autoritativo selecciona una generación administrada, pero permanecen directorios planos o de generaciones anteriores, doctor retira esos árboles obsoletos para podarlos después de que se reinicie el Gateway. Doctor también vuelve a enlazar el paquete `openclaw` del host en los plugins npm administrados que declaran `peerDependencies.openclaw`, para que las importaciones locales del paquete en tiempo de ejecución, como `openclaw/plugin-sdk/*`, se resuelvan tras las actualizaciones o reparaciones de npm.

## Mercado

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

`plugins marketplace entries` enumera las entradas del canal de mercado de OpenClaw configurado. De forma predeterminada, intenta usar el canal alojado y recurre a la instantánea aceptada más reciente o a los datos incluidos. Use `--feed-profile <name>` para leer un perfil configurado específico, `--feed-url <url>` para leer una URL explícita de un canal alojado y `--offline` para leer la instantánea aceptada más reciente sin obtener el canal.

`plugins marketplace refresh` actualiza la instantánea del canal alojado configurado e indica si OpenClaw aceptó datos alojados, una instantánea alojada o datos incluidos como alternativa. Use `--expected-sha256` cuando quien invoque el comando necesite que falle a menos que una carga útil alojada reciente coincida con una suma de comprobación fijada.

`list` del mercado acepta una ruta local del mercado, una ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` muestra la etiqueta de origen resuelta, además del manifiesto del mercado analizado y las entradas de plugins.

La actualización del mercado carga un canal alojado del mercado de OpenClaw y conserva la
respuesta validada como instantánea local del canal alojado. Sin opciones, utiliza
el perfil predeterminado configurado del canal. Use `--feed-profile <name>` para actualizar un
perfil configurado específico, `--feed-url <url>` para actualizar una URL explícita de un
canal alojado, `--expected-sha256 <sha256>` para exigir una suma de comprobación coincidente de la carga útil
(`sha256:<hex>` o un resumen hexadecimal sin prefijo de 64 caracteres) y `--json` para obtener
una salida legible por máquina. Las URL explícitas de canales alojados no deben incluir
credenciales, cadenas de consulta ni fragmentos. Las actualizaciones sin fijar pueden indicar como
resultado una instantánea alojada o datos incluidos como alternativa sin que falle el comando. Las actualizaciones
fijadas fallan a menos que acepten una carga útil alojada reciente, y las actualizaciones alojadas
correctas fallan si OpenClaw no puede conservar la instantánea validada.

## Contenido relacionado

- [Creación de plugins](/es/plugins/building-plugins)
- [Referencia de la CLI](/es/cli)
- [ClawHub](/es/clawhub)
