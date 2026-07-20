---
read_when:
    - Quiere instalar o gestionar plugins del Gateway o paquetes compatibles
    - Se desea crear la estructura inicial o validar un Plugin de herramientas sencillo
    - Quiere depurar los fallos de carga de plugins
sidebarTitle: Plugins
summary: Referencia de la CLI para `openclaw plugins` (inicializar, compilar, validar, enumerar, instalar, marketplace, desinstalar, habilitar/deshabilitar, diagnosticar)
title: Plugins
x-i18n:
    generated_at: "2026-07-20T00:46:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8db98bf732151009ca09a38c0f56d6e9feb185812196fdfa946bc0949aa09d1f
    source_path: cli/plugins.md
    workflow: 16
---

Administra plugins del Gateway, paquetes de hooks y paquetes compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de plugins" href="/es/tools/plugin">
    Guía para usuarios finales sobre la instalación, habilitación y solución de problemas de plugins.
  </Card>
  <Card title="Administrar plugins" href="/es/plugins/manage-plugins">
    Ejemplos rápidos para instalar, enumerar, actualizar, desinstalar y publicar.
  </Card>
  <Card title="Paquetes de plugins" href="/es/plugins/bundles">
    Modelo de compatibilidad de paquetes.
  </Card>
  <Card title="Manifiesto de plugin" href="/es/plugins/manifest">
    Campos del manifiesto y esquema de configuración.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security">
    Refuerzo de la seguridad para las instalaciones de plugins.
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
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de las fases
en stderr y mantiene analizable la salida JSON. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` es inmutable. `install`, `update`, `uninstall`, `enable` y `disable` se niegan a ejecutarse. En su lugar, edita la fuente Nix de esta instalación (`programs.openclaw.config` o `instances.<name>.config` para nix-openclaw) y, después, vuelve a compilarla. Consulta el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado a agentes.
</Note>

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, los proveedores de modelos incluidos, los proveedores de voz incluidos y el plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw incluyen `openclaw.plugin.json` con un esquema JSON en línea (`configSchema`, incluso si está vacío). Los paquetes compatibles utilizan sus propios manifiestos de paquete.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de lista/información también muestra el subtipo de paquete (`codex`, `claude` o `cursor`) junto con las capacidades de paquete detectadas.
</Note>

## Creación

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea de forma predeterminada un plugin de herramienta mínimo en TypeScript. El primer
argumento es el identificador del plugin; `--name` establece el nombre para mostrar. OpenClaw utiliza el
identificador para el directorio de salida predeterminado y el nombre del paquete. Los esqueletos de herramientas utilizan
`defineToolPlugin` y generan scripts `package.json` `plugin:build` y
`plugin:validate` que compilan y, después, llaman a `openclaw plugins build`/`validate`.

`plugins build` importa el punto de entrada compilado, lee los metadatos estáticos de sus herramientas, escribe
`openclaw.plugin.json` y mantiene alineado el `openclaw.extensions` de `package.json`.
`plugins validate` comprueba que el manifiesto generado, los metadatos del paquete y
la exportación actual del punto de entrada sigan coincidiendo. Consulta [Plugins de herramientas](/es/plugins/tool-plugins) para conocer
el flujo de creación completo.

El esqueleto escribe el código fuente TypeScript, pero genera los metadatos a partir del punto de entrada
`./dist/index.js` compilado, por lo que el flujo también funciona con la CLI publicada. Utiliza
`--entry <path>` cuando el punto de entrada no sea el punto de entrada predeterminado del paquete. Utiliza
`plugins build --check` en la Pipeline de CI para producir un error cuando los metadatos generados estén obsoletos sin
reescribir archivos.

### Esqueleto de proveedor

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Los esqueletos de proveedor crean un plugin genérico de proveedor de modelos compatible con OpenAI
con la infraestructura de autenticación mediante clave de API, un script `npm run validate` que ejecuta
`clawhub package validate`, metadatos de paquete de ClawHub y un flujo de GitHub Actions
de ejecución manual para futuras publicaciones de confianza mediante OIDC de GitHub.
Los esqueletos de proveedor no generan Skills ni utilizan
`openclaw plugins build`/`validate`; esos comandos corresponden a la ruta de metadatos
generados del esqueleto de herramientas.

Antes de publicar, sustituye la URL base de API de marcador de posición, el catálogo de modelos, la ruta de
documentación, el texto de credenciales y el contenido del README por los datos reales del proveedor. Utiliza el
README generado para la primera publicación en ClawHub y la configuración del publicador de confianza.

## Instalación

```bash
openclaw plugins search "calendar"                      # buscar plugins de ClawHub
openclaw plugins install @openclaw/<package>            # catálogo oficial de confianza
openclaw plugins install <package>                       # paquete npm arbitrario
openclaw plugins install clawhub:<package>                # solo ClawHub
openclaw plugins install npm:<package>                    # solo npm
openclaw plugins install npm-pack:<path.tgz>               # archivo tar local de npm-pack
openclaw plugins install git:github.com/<owner>/<repo>     # repositorio git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # ruta o archivo local
openclaw plugins install -l <path>                         # enlazar en lugar de copiar
openclaw plugins install <plugin>@<marketplace>             # forma abreviada de marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explícito)
openclaw plugins install <package> --force                  # confirmar fuente / sobrescribir existente
openclaw plugins install <package> --pin                    # fijar la versión npm resuelta
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Los mantenedores que prueben instalaciones durante la configuración pueden sustituir las fuentes automáticas de
instalación de plugins mediante variables de entorno protegidas. Consulta
[Anulaciones de instalación de plugins](/es/plugins/install-overrides).

<Warning>
Durante la transición del lanzamiento, los nombres de paquete sin prefijo se instalan de forma predeterminada desde npm, salvo que coincidan con un identificador de plugin incluido u oficial, en cuyo caso OpenClaw utiliza esa copia local/oficial en lugar de acceder al registro npm. Utiliza `npm:<package>` cuando quieras deliberadamente un paquete npm externo. Utiliza `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como la ejecución de código; prioriza las versiones fijadas.
</Warning>

<Warning>
Los paquetes de ClawHub y el catálogo incluido/oficial de OpenClaw son fuentes de instalación
de confianza. Una nueva fuente arbitraria de npm, `npm-pack:`, git, ruta/archivo local o
marketplace muestra una advertencia y solicita confirmación antes de continuar. Las instalaciones arbitrarias
no interactivas deben proporcionar `--force` después de revisar la fuente y confiar en ella. La misma
opción sobrescribe un destino de instalación existente cuando es necesario. Las actualizaciones normales de una
instalación ya registrada no la requieren. Esta confirmación es independiente de
`--acknowledge-clawhub-risk`, que solo se aplica a advertencias de confianza sobre versiones
arriesgadas de ClawHub. `--force` no omite `security.installPolicy` ni las comprobaciones
de seguridad de instalación restantes.
</Warning>

`plugins search` consulta ClawHub para buscar paquetes instalables `code-plugin` y
`bundle-plugin` (no Skills; utiliza `openclaw skills search` para ellas).
El valor predeterminado de `--limit` es 20, con un máximo de 100. Solo lee el catálogo remoto: no
inspecciona el estado local, modifica la configuración, instala paquetes ni carga el entorno de ejecución
de plugins. Los resultados incluyen el nombre del paquete de ClawHub, la familia, el canal, la versión,
el resumen y una indicación de instalación como `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub es la principal superficie de distribución y descubrimiento para la mayoría de los plugins. Npm
sigue siendo una alternativa compatible y una ruta de instalación directa. Los paquetes de plugins
`@openclaw/*` propiedad de OpenClaw vuelven a publicarse en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables utilizan `latest`.
Las instalaciones y actualizaciones del canal beta priorizan la etiqueta de distribución `beta` de npm cuando está disponible
y, de lo contrario, recurren a `latest`. En el canal estable extendido, los plugins oficiales de npm
con una intención sin prefijo/predeterminada o `latest` se resuelven a la versión exacta del núcleo
instalada. Las versiones exactas fijadas y las etiquetas explícitas distintas de `latest`, los paquetes de terceros y
las fuentes que no sean npm no se reescriben.
</Note>

<AccordionGroup>
  <Accordion title="Inclusiones de configuración y reparación de configuraciones no válidas">
    Si la sección `plugins` está respaldada por una `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escribe directamente en ese archivo incluido y deja `openclaw.json` intacto. Las inclusiones raíz, los arreglos de inclusiones y las inclusiones con anulaciones del mismo nivel producen un error seguro en lugar de aplanarse. Consulta [Inclusiones de configuración](/es/gateway/configuration) para conocer las formas compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente produce un error seguro y te indica que ejecutes primero `openclaw doctor --fix`. Durante el inicio y la recarga en caliente del Gateway, una configuración de plugin no válida produce un error seguro como cualquier otra configuración no válida; `openclaw doctor --fix` puede poner en cuarentena la entrada de plugin no válida. La única excepción documentada durante la instalación es una ruta de recuperación limitada para plugins incluidos que acepten explícitamente `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="Confirmación con --force y reinstalación frente a actualización">
    `--force` confirma una fuente que no sea de ClawHub sin solicitar confirmación. No omite `security.installPolicy` ni las comprobaciones de seguridad de instalación restantes. Cuando el plugin o el paquete de hooks ya está instalado, también reutiliza el destino existente y lo sobrescribe en el mismo lugar. Utilízalo después de revisar una fuente arbitraria de npm, local, de archivo, git o marketplace, o cuando reinstales intencionadamente el mismo identificador. Para las actualizaciones rutinarias de un plugin npm ya registrado, utiliza preferentemente `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un identificador de plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieras sobrescribir la instalación actual desde una fuente diferente. Las fuentes arbitrarias siguen mostrando la advertencia interactiva de procedencia; las instalaciones no interactivas deben proporcionar `--force` después de la revisión. Las fuentes de confianza de ClawHub y del catálogo de OpenClaw no la necesitan. Con `--link`, `--force` confirma la fuente, pero no cambia el modo de instalación mediante ruta enlazada.

  </Accordion>
  <Accordion title="Ámbito de --pin">
    `--pin` se aplica únicamente a instalaciones de npm y registra el `<name>@<version>` exacto resuelto. No es compatible con instalaciones `git:` (fija la referencia en la especificación, por ejemplo, `git:github.com/acme/plugin@v1.2.3`) ni con `--marketplace` (las instalaciones de marketplace conservan los metadatos de la fuente del marketplace en lugar de una especificación de npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto y ahora no realiza ninguna operación. OpenClaw ya no ejecuta el bloqueo integrado de código peligroso durante la instalación de plugins.

    Usa la superficie `security.installPolicy` controlada por el operador cuando se requiera una política de instalación específica del host. Los hooks `before_install` de los plugins son hooks del ciclo de vida del runtime del plugin, no el límite principal de políticas para las instalaciones mediante la CLI.

    Si un plugin que publicaste en ClawHub está oculto o bloqueado por un análisis del registro, sigue los pasos para publicadores en [Publicación en ClawHub](/es/clawhub/publishing). `--dangerously-force-unsafe-install` no solicita a ClawHub que vuelva a analizar el plugin ni que haga pública una versión bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Las instalaciones de la comunidad desde ClawHub comprueban el registro de confianza de la versión seleccionada antes de descargarla. Si ClawHub deshabilita la descarga de la versión, informa de hallazgos maliciosos en el análisis o coloca la versión en un estado de moderación bloqueante (en cuarentena, revocada), OpenClaw la rechaza de forma absoluta, independientemente de este indicador. Para los estados de análisis riesgosos no bloqueantes o los estados de moderación no bloqueantes, OpenClaw muestra los detalles de confianza y solicita confirmación antes de continuar.

    Usa `--acknowledge-clawhub-risk` solo después de revisar la advertencia de ClawHub y decidir continuar sin una solicitud interactiva. Los resultados de análisis pendientes u obsoletos (aún no limpios) generan una advertencia, pero no requieren confirmación. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidas con OpenClaw omiten por completo esta comprobación de confianza de la versión.

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones de npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para la visibilidad filtrada de hooks y la habilitación individual de cada hook, no para instalar paquetes.

    Las especificaciones de npm son **exclusivamente del registro** (nombre del paquete más una **versión exacta** opcional o una **dist-tag**). Se rechazan las especificaciones de Git/URL/archivo y los intervalos de semver. Para mayor seguridad, las instalaciones de dependencias se ejecutan en un proyecto npm administrado por plugin con `--ignore-scripts`, incluso cuando el shell tiene una configuración global de instalación de npm. Los proyectos npm administrados de los plugins heredan el `overrides` de npm a nivel de paquete de OpenClaw, por lo que las restricciones de seguridad del host también se aplican a las dependencias elevadas de los plugins.

    Usa `npm:<package>` para hacer explícita la resolución de npm. Durante la transición del lanzamiento, las especificaciones de paquete simples también se instalan directamente desde npm, salvo que coincidan con el identificador de un plugin oficial.

    Las especificaciones `@openclaw/*` sin procesar que coinciden con plugins incluidos se resuelven primero con la copia incluida propiedad de la imagen, antes de recurrir a npm. Por ejemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa el plugin de Discord incluido en la compilación actual de OpenClaw en lugar de crear una sustitución administrada de npm. Para forzar el uso del paquete npm externo, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Las especificaciones simples y `@latest` permanecen en el canal estable. Las versiones de corrección de OpenClaw con fecha, como `2026.5.3-1`, se consideran estables para esta comprobación. Si npm resuelve cualquiera de las dos formas como una versión preliminar, OpenClaw se detiene y solicita que se autorice explícitamente mediante una etiqueta de versión preliminar (`@beta`/`@rc`) o una versión preliminar exacta (`@1.2.3-beta.4`).

    Para las instalaciones de npm sin una versión exacta (`npm:<package>` o `npm:<package>@latest`), OpenClaw comprueba los metadatos del paquete resuelto antes de instalarlo. Si el paquete estable más reciente requiere una API de plugins de OpenClaw más reciente o una versión mínima del host superior, OpenClaw examina versiones estables anteriores e instala en su lugar la versión compatible más reciente. Las versiones exactas y las dist-tags explícitas siguen siendo estrictas: una selección incompatible falla y solicita actualizar OpenClaw o elegir una versión compatible.

    Si una especificación de instalación simple coincide con el identificador de un plugin oficial (por ejemplo, `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete npm con el mismo nombre, usa una especificación explícita con ámbito (por ejemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio Git. Formas compatibles: `git:github.com/owner/repo`, `git:owner/repo`, `https://` completa, `ssh://`, `git://`, `file://` y las URL de clonación `git@host:owner/repo.git`. Añade `@<ref>` o `#<ref>` para cambiar a una rama, etiqueta o commit antes de la instalación.

    Las instalaciones desde Git clonan el repositorio en un directorio temporal, cambian a la referencia solicitada cuando está presente y, después, usan el instalador normal de directorios de plugins. Por tanto, la validación del manifiesto, la política de instalación del operador, las operaciones de instalación del gestor de paquetes y los registros de instalación se comportan igual que en las instalaciones desde npm. Las instalaciones registradas desde Git incluyen la URL/referencia de origen y el commit resuelto para que `openclaw plugins update` pueda volver a resolver el origen posteriormente.

    Después de instalar desde Git, usa `openclaw plugins inspect <id> --runtime --json` para verificar los registros del runtime, como los métodos del Gateway y los comandos de la CLI. Si el plugin registró una raíz de la CLI con `api.registerCli`, ejecuta ese comando directamente mediante la CLI raíz de OpenClaw; por ejemplo, `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos comprimidos">
    Archivos comprimidos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos comprimidos nativos de plugins de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz extraída del plugin; los archivos comprimidos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba los registros de instalación.

    Usa `npm-pack:<path.tgz>` cuando el archivo sea un tarball generado por npm pack y se desee
    la misma ruta de proyecto npm administrado por plugin que usan las instalaciones desde el registro,
    incluida la verificación de `package-lock.json`, el análisis de dependencias elevadas
    y los registros de instalación de npm. Las rutas de archivos comprimidos normales siguen instalándose como
    archivos comprimidos locales en la raíz de extensiones de plugins.

    También se admiten las instalaciones desde marketplaces de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones desde ClawHub usan un localizador `clawhub:<package>` explícito:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Durante la transición del lanzamiento, las especificaciones simples de plugins válidas para npm se instalan desde npm de forma predeterminada, salvo que coincidan con el identificador de un plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución exclusiva mediante npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la compatibilidad anunciada de la API del plugin y la versión mínima del Gateway antes de la instalación. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` de npm pack con versión, verifica la cabecera de resumen de ClawHub y el resumen del artefacto y, después, lo instala mediante la ruta normal de archivos comprimidos. Las versiones anteriores de ClawHub sin metadatos de ClawPack siguen instalándose mediante la ruta heredada de verificación de archivos comprimidos de paquetes. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, el tipo de artefacto, la integridad de npm, el shasum de npm, el nombre del tarball y los datos de resumen de ClawPack para futuras actualizaciones.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir las versiones más recientes de ClawHub; los selectores explícitos de versión o etiqueta, como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta`, permanecen fijados a ese selector.

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
    - un nombre de marketplace conocido por Claude de `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta `marketplace.json`
    - una forma abreviada de repositorio de GitHub, como `owner/repo`
    - una URL de repositorio de GitHub, como `https://github.com/owner/repo`
    - una URL de Git

  </Tab>
  <Tab title="Reglas de marketplaces remotos">
    Para los marketplaces remotos cargados desde GitHub o Git, las entradas de plugins deben permanecer dentro del repositorio clonado del marketplace. OpenClaw acepta orígenes de rutas relativas de ese repositorio y rechaza los orígenes de plugins HTTP(S), con rutas absolutas, de Git, de GitHub y otros orígenes que no sean rutas en los manifiestos remotos.
  </Tab>
</Tabs>

Para las rutas locales y los archivos comprimidos, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json`, o el diseño predeterminado de componentes de Claude cuando ese archivo de manifiesto está ausente)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Las instalaciones locales administradas deben ser directorios o archivos comprimidos de plugins. Los archivos de plugin independientes `.js`,
`.mjs`, `.cjs` y `.ts` no se copian en la raíz administrada de plugins
mediante `plugins install`, ni se cargan al colocarlos directamente en
`~/.openclaw/extensions` o `<workspace>/.openclaw/extensions`; esas
raíces detectadas automáticamente cargan directorios de paquetes o paquetes compatibles de plugins y omiten
los archivos de script de nivel superior por considerarlos utilidades locales. Enumera explícitamente los archivos independientes en
`plugins.load.paths`.

<Note>
Los paquetes compatibles se instalan en la raíz normal de plugins y participan en el mismo flujo de enumeración/información/habilitación/deshabilitación. Actualmente se admiten las Skills de paquetes, las Skills de comandos de Claude, los valores predeterminados `settings.json` de Claude, los valores predeterminados `.lsp.json` de Claude y `lspServers` declarados por el manifiesto, las Skills de comandos de Cursor y los directorios de hooks compatibles con Codex; las demás capacidades detectadas de los paquetes se muestran en los diagnósticos o la información, pero aún no están conectadas con la ejecución del runtime.
</Note>

Usa `-l`/`--link` para apuntar a un directorio local de plugins sin copiarlo (lo añade
a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` no es compatible con las instalaciones `--marketplace` o `git:` y
requiere una ruta local que ya exista. Para crear un enlace local de forma no interactiva,
pasa `--force` después de revisar el origen; confirma la procedencia, pero no
copia ni sobrescribe el directorio enlazado.

<Note>
Los plugins originados en un espacio de trabajo y detectados desde una raíz de extensiones del espacio de trabajo no se
importan ni ejecutan hasta que se habilitan explícitamente. Para el desarrollo local,
ejecuta `openclaw plugins enable <plugin-id>` o configura
`plugins.entries.<plugin-id>.enabled: true`; si la configuración usa
`plugins.allow`, incluye también allí el mismo identificador del plugin. Esta regla de denegación predeterminada
también se aplica cuando la configuración de un canal apunta explícitamente a un plugin originado en un espacio de trabajo para
cargarlo únicamente durante la configuración, por lo que el código de configuración del plugin de canal local no se ejecutará mientras ese
plugin del espacio de trabajo siga deshabilitado o excluido de la lista de permitidos. Las instalaciones enlazadas
y las entradas explícitas `plugins.load.paths` siguen la política normal correspondiente a su
origen de plugin resuelto. Consulta
[Configurar la política de plugins](/es/tools/plugin#configure-plugin-policy)
y la [Referencia de configuración](/es/gateway/configuration-reference#plugins).

Usa `--pin` en las instalaciones de npm para guardar la especificación exacta resuelta (`name@version`) en el índice administrado de plugins y mantener sin fijar el comportamiento predeterminado.
</Note>

## Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Muestra únicamente los plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Cambia de la vista de tabla a líneas de detalles por plugin con metadatos de formato/origen/procedencia/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquinas, junto con diagnósticos del registro y el estado de instalación de las dependencias de los paquetes.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistente de plugins, con una alternativa derivada únicamente del manifiesto cuando el registro falta o no es válido. Resulta útil para comprobar si un plugin está instalado, habilitado y visible para la planificación de un inicio en frío, pero no es una comprobación en vivo del tiempo de ejecución de un proceso de Gateway que ya esté en ejecución. Después de cambiar el código del plugin, su habilitación, la política de hooks o `plugins.load.paths`, reinicie el Gateway que presta servicio al canal antes de esperar que se ejecuten el nuevo código o los hooks de `register(api)`. En implementaciones remotas o en contenedores, verifique que se esté reiniciando el proceso secundario `openclaw gateway run` real, no solo un proceso contenedor.

`plugins list --json` incluye el `dependencyStatus` de cada plugin procedente de `package.json`
`dependencies` y `optionalDependencies`. OpenClaw comprueba si esos nombres de
paquete están presentes en la ruta de búsqueda normal de Node `node_modules` del plugin;
no importa el código de tiempo de ejecución del plugin, no ejecuta un gestor de paquetes ni repara
dependencias faltantes.
</Note>

Si el inicio registra `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ejecute `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con uno de los identificadores de plugin enumerados para confirmar los
identificadores de los plugins y copie los identificadores de confianza en `plugins.allow` dentro de `openclaw.json`. Cuando la
advertencia puede enumerar todos los plugins detectados, muestra un fragmento
`plugins.allow` listo para pegar que ya incluye esos identificadores. Si un plugin se carga
sin procedencia de instalación o ruta de carga, inspeccione el identificador de ese plugin y, a continuación, fije
el identificador de confianza en `plugins.allow` o reinstale el plugin desde una fuente de confianza
para que OpenClaw registre la procedencia de la instalación.

Para trabajar con plugins incluidos dentro de una imagen de Docker empaquetada, monte mediante enlace el
directorio de código fuente del plugin sobre la ruta de código fuente empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw detecta esa superposición de código fuente montada
antes de `/app/dist/extensions/synology-chat`; un directorio de código fuente simplemente copiado
permanece inactivo, por lo que las instalaciones empaquetadas normales siguen usando la distribución compilada.

Para depurar hooks en tiempo de ejecución:

- `openclaw plugins inspect <id> --runtime --json` muestra los hooks registrados y los diagnósticos de una pasada de inspección con el módulo cargado. La inspección en tiempo de ejecución nunca instala dependencias; use `openclaw doctor --fix` para limpiar el estado de dependencias heredado o recuperar plugins descargables faltantes a los que haga referencia la configuración.
- `openclaw gateway status --deep --require-rpc` confirma la URL o el perfil del Gateway accesible, las indicaciones del servicio o proceso, la ruta de configuración y el estado de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Índice de plugins

Los metadatos de instalación de plugins son un estado administrado por la máquina, no una configuración del usuario. Las instalaciones y actualizaciones los escriben en la base de datos de estado SQLite compartida dentro del directorio de estado activo de OpenClaw. La fila `installed_plugin_index` almacena metadatos duraderos de `installRecords`, incluidos registros de manifiestos de plugins dañados o faltantes, además de una caché de registro en frío derivada del manifiesto que utilizan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro de plugins en frío.

`plugins.installs` es una superficie retirada de configuración creada manualmente. Los comandos de tiempo de ejecución y actualización solo leen el índice de plugins instalados de SQLite. Ejecute `openclaw doctor --fix` para importar los registros de configuración heredados al índice y eliminar la clave retirada antes del uso normal en tiempo de ejecución.

## Desinstalación

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` elimina los registros del plugin de `plugins.entries`, el índice persistente de plugins, las entradas de las listas de permitidos y denegados de plugins y las entradas `plugins.load.paths` vinculadas cuando corresponda. Salvo que se establezca `--keep-files`, la desinstalación también elimina el directorio de instalación administrado registrado, pero solo cuando se resuelve dentro de la raíz de extensiones de plugins de OpenClaw. Si el plugin ocupa actualmente el espacio `memory` o `contextEngine`, ese espacio se restablece a su valor predeterminado (`memory-core` para la memoria, `legacy` para el motor de contexto).

`uninstall` muestra una vista previa de lo que se eliminará y luego solicita `Uninstall plugin "<id>"?` antes de realizar cambios. Pase `--force` para omitir la solicitud de confirmación (útil para scripts y ejecuciones no interactivas); sin esta opción, la desinstalación requiere un TTY interactivo. `--dry-run` muestra la misma vista previa y finaliza sin solicitar confirmación ni cambiar nada.

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

Las actualizaciones se aplican a las instalaciones de plugins registradas en el índice administrado de plugins y a las instalaciones de paquetes de hooks registradas en `hooks.internal.installs`. Reutilizan la fuente que el usuario ya eligió al instalar el plugin, por lo que no requieren una segunda confirmación de la fuente.

<AccordionGroup>
  <Accordion title="Resolución del identificador del plugin frente a la especificación de npm">
    Cuando se pasa un identificador de plugin, OpenClaw reutiliza la especificación de instalación registrada para ese plugin. Esto significa que las etiquetas de distribución almacenadas anteriormente, como `@beta`, y las versiones exactas fijadas se siguen utilizando en posteriores ejecuciones de `update <id>`.

    Durante `update <id> --dry-run`, las instalaciones de npm fijadas a una versión exacta permanecen fijadas. Si OpenClaw también puede resolver la línea predeterminada del registro del paquete y esa línea predeterminada es más reciente que la versión fijada instalada, la ejecución de prueba informa de la fijación y muestra el comando explícito de actualización del paquete `@latest` para seguir la línea predeterminada del registro.

    Esta regla de actualización dirigida difiere de la ruta de mantenimiento masivo `openclaw plugins update --all`. Las actualizaciones masivas siguen respetando las especificaciones de instalación registradas habituales, pero los registros de plugins oficiales de confianza de OpenClaw pueden sincronizarse con el destino actual del catálogo oficial en lugar de permanecer en un paquete oficial exacto obsoleto. Use la actualización dirigida `update <id>` cuando desee conservar intencionadamente sin cambios una especificación oficial exacta o etiquetada.

    Para las instalaciones de npm, también se puede pasar una especificación explícita de paquete npm con una etiqueta de distribución o una versión exacta. OpenClaw vuelve a resolver ese nombre de paquete al registro de plugin correspondiente, actualiza ese plugin instalado y registra la nueva especificación de npm para futuras actualizaciones basadas en el identificador.

    Pasar el nombre del paquete npm sin una versión ni etiqueta también vuelve a resolverlo al registro de plugin correspondiente. Use esta opción cuando un plugin se haya fijado a una versión exacta y se quiera devolver a la línea de versiones predeterminada del registro.

  </Accordion>
  <Accordion title="Actualizaciones del canal beta">
    La actualización dirigida `openclaw plugins update <id-or-npm-spec>` reutiliza la especificación de plugin registrada, salvo que se pase una nueva especificación. La actualización masiva `openclaw plugins update --all` usa el valor configurado de `update.channel` cuando sincroniza los registros de plugins oficiales de confianza con el destino del catálogo oficial, por lo que las instalaciones del canal beta pueden permanecer en la línea de versiones beta en lugar de normalizarse silenciosamente a estable/latest.

    `openclaw update` también conoce el canal de actualización activo de OpenClaw: en el canal beta, los registros de plugins npm y ClawHub de la línea predeterminada prueban primero `@beta`. Si no existe una versión beta del plugin, recurren a la especificación predeterminada/latest registrada; los plugins de npm también recurren a ella cuando el paquete beta existe, pero no supera la validación de instalación. Esta alternativa se informa como advertencia y no provoca un fallo de la actualización del núcleo. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector para las actualizaciones dirigidas.

  </Accordion>
  <Accordion title="Comprobaciones de versión y desviación de integridad">
    Antes de una actualización en vivo de npm, OpenClaw compara la versión del paquete instalado con los metadatos del registro de npm. Si la versión instalada y la identidad registrada del artefacto ya coinciden con el destino resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido, OpenClaw lo considera una desviación del artefacto de npm. El comando interactivo `openclaw plugins update` muestra los hashes esperado y real y solicita confirmación antes de continuar. Los auxiliares de actualización no interactivos se cierran de forma segura, salvo que el llamador proporcione una política explícita para continuar.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en la actualización">
    `--dangerously-force-unsafe-install` también se acepta en `plugins update` por compatibilidad, pero está obsoleto y ya no cambia el comportamiento de actualización de los plugins. `security.installPolicy` del operador aún puede bloquear las actualizaciones; los hooks `before_install` de los plugins solo se aplican en procesos donde se cargan los hooks de los plugins.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk en la actualización">
    Las actualizaciones de plugins de la comunidad respaldados por ClawHub ejecutan la misma comprobación de confianza de la versión exacta que las instalaciones antes de descargar el paquete de sustitución. Use `--acknowledge-clawhub-risk` para automatizaciones revisadas que deban continuar cuando la versión seleccionada de ClawHub tenga una advertencia de confianza riesgosa. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidos de OpenClaw omiten esta solicitud de confianza de la versión.
  </Accordion>
</AccordionGroup>

## Inspección

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

La inspección muestra la identidad, el estado de carga, la fuente, las capacidades del manifiesto, los indicadores de política, los diagnósticos, los metadatos de instalación, las capacidades del paquete y cualquier compatibilidad detectada con servidores MCP o LSP, sin importar de forma predeterminada el tiempo de ejecución del plugin. La salida JSON incluye los contratos del manifiesto del plugin, como `contracts.agentToolResultMiddleware` y `contracts.trustedToolPolicies`, para que los operadores puedan auditar las declaraciones de superficies de confianza antes de habilitar o reiniciar un plugin. Añada `--runtime` para cargar el módulo del plugin e incluir los hooks, las herramientas, los comandos, los servicios, los métodos de Gateway y las rutas HTTP registrados. La inspección en tiempo de ejecución informa directamente de las dependencias faltantes del plugin; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos de CLI propiedad de los plugins suelen instalarse como grupos de comandos raíz `openclaw`, pero los plugins también pueden registrar comandos anidados bajo un elemento principal del núcleo, como `openclaw nodes`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútelo en la ruta indicada; por ejemplo, un plugin que registre `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada plugin se clasifica según lo que registra realmente en tiempo de ejecución:

| Forma               | Significado                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | exactamente un tipo de capacidad (p. ej., un plugin que solo es proveedor)         |
| `hybrid-capability` | más de un tipo de capacidad (p. ej., texto + voz + imágenes)       |
| `hook-only`         | solo hooks, sin capacidades, herramientas, comandos, servicios ni rutas |
| `non-capability`    | herramientas/comandos/servicios, pero sin capacidades                       |

Consulte [Formas de los plugins](/es/plugins/architecture#plugin-shapes) para obtener más información sobre el modelo de capacidades.

<Note>
La opción `--json` genera un informe legible por máquina, adecuado para scripts y auditorías. `inspect --all` representa una tabla de toda la flota con columnas de forma, tipos de capacidades, avisos de compatibilidad, capacidades del paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` informa de errores de carga de plugins, diagnósticos del manifiesto o de detección, avisos de compatibilidad y referencias obsoletas de configuración de plugins, como espacios de plugins faltantes. Cuando el árbol de instalación y la configuración de plugins están limpios, muestra `No plugin issues detected.` Si queda configuración obsoleta, pero el árbol de instalación está en buen estado por lo demás, el resumen lo indica en lugar de dar a entender que el estado de los plugins es completamente correcto.

Si hay un plugin configurado presente en el disco, pero está bloqueado por las comprobaciones de seguridad de rutas del cargador, la validación de la configuración conserva la entrada del plugin y la notifica como `present but blocked`. Corrija el diagnóstico anterior del plugin bloqueado, como la propiedad de la ruta o los permisos de escritura para todos, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para errores de estructura del módulo, como la ausencia de exportaciones `register`/`activate`, vuelva a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la estructura de exportaciones en la salida de diagnóstico.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo persistido de lectura en frío de OpenClaw para la identidad de los plugins instalados, su habilitación, los metadatos de origen y la propiedad de las contribuciones. El inicio normal, la búsqueda del propietario del proveedor, la clasificación de la configuración de canales y el inventario de plugins pueden leerlo sin importar módulos del entorno de ejecución de los plugins.

Use `plugins registry` para comprobar si el registro persistido está presente, actualizado u obsoleto. Use `--refresh` para reconstruirlo a partir del índice persistido de plugins, la política de configuración y los metadatos del manifiesto o paquete. Esta es una vía de reparación, no una vía de activación en tiempo de ejecución.

`openclaw doctor --fix` también repara las desviaciones de npm administrado adyacentes al registro. Si un paquete `@openclaw/*` huérfano o recuperado situado en un proyecto npm de plugins administrados o en la raíz plana heredada de npm administrado oculta un plugin incluido, doctor elimina ese paquete obsoleto y reconstruye el registro para que el inicio valide el manifiesto incluido. Cuando un registro de instalación autoritativo selecciona una generación administrada, pero permanecen directorios planos o de generaciones anteriores, doctor retira esos árboles obsoletos para podarlos después de que se reinicie el Gateway. Doctor también vuelve a enlazar el paquete `openclaw` del host en los plugins npm administrados que declaran `peerDependencies.openclaw`, para que las importaciones locales del paquete en tiempo de ejecución, como `openclaw/plugin-sdk/*`, se resuelvan después de actualizaciones o reparaciones de npm.

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

`plugins marketplace entries` enumera las entradas del feed configurado del marketplace de OpenClaw. De forma predeterminada, intenta usar el feed alojado y recurre a la última instantánea aceptada o a los datos incluidos. Use `--feed-profile <name>` para leer un perfil configurado específico, `--feed-url <url>` para leer una URL explícita de un feed alojado y `--offline` para leer la última instantánea aceptada sin obtener el feed.

`plugins marketplace refresh` actualiza la instantánea del feed alojado configurado e indica si OpenClaw aceptó los datos alojados, una instantánea alojada o los datos alternativos incluidos. Use `--expected-sha256` cuando quien realiza la llamada necesite que el comando falle a menos que una carga útil alojada reciente coincida con una suma de comprobación fijada.

`list` de Marketplace acepta una ruta local del marketplace, una ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de origen resuelta junto con el manifiesto del marketplace analizado y las entradas de plugins.

La actualización del marketplace carga un feed alojado del marketplace de OpenClaw y conserva la
respuesta validada como instantánea local del feed alojado. Sin opciones, utiliza
el perfil de feed predeterminado configurado. Use `--feed-profile <name>` para actualizar un
perfil configurado específico, `--feed-url <url>` para actualizar una URL explícita de un
feed alojado, `--expected-sha256 <sha256>` para exigir una suma de comprobación coincidente de la carga útil
(`sha256:<hex>` o un resumen hexadecimal simple de 64 caracteres) y `--json` para obtener
una salida legible por máquinas. Las URL explícitas de feeds alojados no deben incluir
credenciales, cadenas de consulta ni fragmentos. Las actualizaciones no fijadas pueden informar de
una instantánea alojada o un resultado alternativo incluido sin que falle el comando. Las actualizaciones
fijadas fallan a menos que acepten una carga útil alojada reciente, y las actualizaciones alojadas
correctas fallan si OpenClaw no puede conservar la instantánea validada.

## Contenido relacionado

- [Creación de plugins](/es/plugins/building-plugins)
- [Referencia de la CLI](/es/cli)
- [ClawHub](/es/clawhub)
