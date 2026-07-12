---
read_when:
    - Quieres instalar o gestionar plugins de Gateway o paquetes compatibles
    - Quieres crear la estructura inicial o validar un Plugin de herramienta sencillo
    - Quieres depurar los fallos de carga de plugins
sidebarTitle: Plugins
summary: Referencia de la CLI para `openclaw plugins` (inicializar, compilar, validar, listar, instalar, marketplace, desinstalar, habilitar/deshabilitar, diagnosticar)
title: Plugins
x-i18n:
    generated_at: "2026-07-11T23:00:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Administra los plugins del Gateway, los paquetes de hooks y los paquetes compatibles.

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
  <Card title="Manifiesto de Plugin" href="/es/plugins/manifest">
    Campos del manifiesto y esquema de configuración.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security">
    Refuerzo de seguridad para las instalaciones de plugins.
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

Para investigar instalaciones, inspecciones, desinstalaciones o actualizaciones del registro que sean lentas, ejecuta el
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. El seguimiento escribe las duraciones de las fases
en stderr y mantiene analizable la salida JSON. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
En el modo Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` es inmutable. `install`, `update`, `uninstall`, `enable` y `disable` se niegan a ejecutarse. En su lugar, edita la fuente Nix de esta instalación (`programs.openclaw.config` o `instances.<name>.config` para nix-openclaw) y después vuelve a compilar. Consulta el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado a agentes.
</Note>

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, los proveedores de modelos incluidos, los proveedores de voz incluidos y el Plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw incluyen `openclaw.plugin.json` con un esquema JSON integrado (`configSchema`, aunque esté vacío). Los paquetes compatibles utilizan sus propios manifiestos de paquete.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de la lista o la información también muestra el subtipo de paquete (`codex`, `claude` o `cursor`), además de las capacidades de paquete detectadas.
</Note>

## Creación

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea de forma predeterminada un Plugin de herramienta mínimo en TypeScript. El primer
argumento es el identificador del Plugin; `--name` establece el nombre para mostrar. OpenClaw utiliza el
identificador para el directorio de salida predeterminado y el nombre del paquete. Las plantillas de herramientas utilizan
`defineToolPlugin` y generan los scripts `plugin:build` y
`plugin:validate` de `package.json`, que compilan y después invocan `openclaw plugins build`/`validate`.

`plugins build` importa el punto de entrada compilado, lee los metadatos estáticos de la herramienta, escribe
`openclaw.plugin.json` y mantiene sincronizado `openclaw.extensions` de `package.json`.
`plugins validate` comprueba que el manifiesto generado, los metadatos del paquete y
la exportación actual del punto de entrada sigan coincidiendo. Consulta [Plugins de herramientas](/es/plugins/tool-plugins) para
ver el flujo de creación completo.

La plantilla escribe código fuente TypeScript, pero genera los metadatos a partir del punto de entrada compilado
`./dist/index.js`, por lo que el flujo de trabajo también funciona con la CLI publicada. Utiliza
`--entry <path>` cuando el punto de entrada no sea el predeterminado del paquete. Utiliza
`plugins build --check` en CI para que falle cuando los metadatos generados estén desactualizados sin
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

Las plantillas de proveedores crean un Plugin genérico de proveedor de modelos compatible con OpenAI
con la infraestructura de autenticación mediante clave de API, un script `npm run validate` que ejecuta
`clawhub package validate`, metadatos de paquete de ClawHub y un flujo de trabajo de
GitHub Actions que se inicia manualmente para futuras publicaciones de confianza mediante GitHub
OIDC. Las plantillas de proveedores no generan Skills ni utilizan
`openclaw plugins build`/`validate`; esos comandos son para la ruta de metadatos generados
de la plantilla de herramientas.

Antes de publicar, sustituye la URL base de la API, el catálogo de modelos, la ruta de
documentación, el texto de las credenciales y el contenido del README provisionales por los datos reales del proveedor. Utiliza el
README generado para la primera publicación en ClawHub y la configuración del publicador de confianza.

## Instalación

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

Los responsables de mantenimiento que prueben instalaciones durante la configuración pueden sustituir las fuentes
automáticas de instalación de plugins mediante variables de entorno protegidas. Consulta
[Anulaciones de instalación de plugins](/es/plugins/install-overrides).

<Warning>
Durante la transición del lanzamiento, los nombres de paquete simples se instalan de forma predeterminada desde npm, salvo que coincidan con el identificador de un Plugin incluido u oficial, en cuyo caso OpenClaw utiliza esa copia local u oficial en vez de acceder al registro de npm. Utiliza `npm:<package>` cuando quieras deliberadamente un paquete externo de npm. Utiliza `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como la ejecución de código; prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub para buscar paquetes instalables `code-plugin` y
`bundle-plugin` (no Skills; utiliza `openclaw skills search` para buscarlas).
El valor predeterminado de `--limit` es 20, con un máximo de 100. Solo lee el catálogo remoto: no
inspecciona el estado local, modifica la configuración, instala paquetes ni carga el entorno de ejecución
de plugins. Los resultados incluyen el nombre del paquete de ClawHub, la familia, el canal, la versión,
el resumen y una indicación de instalación, como `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los plugins. Npm
sigue siendo una alternativa compatible y una vía de instalación directa. Los paquetes de plugins
`@openclaw/*` propiedad de OpenClaw vuelven a publicarse en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables utilizan `latest`.
Las instalaciones y actualizaciones del canal beta prefieren la etiqueta de distribución `beta` de npm cuando está disponible
y, en caso contrario, utilizan `latest`. En el canal estable extendido, los plugins oficiales de npm
con intención simple, predeterminada o `latest` se resuelven a la versión exacta instalada del núcleo.
Las versiones exactas fijadas y las etiquetas explícitas distintas de `latest`, los paquetes de terceros y
las fuentes que no sean npm no se reescriben.
</Note>

<AccordionGroup>
  <Accordion title="Inclusiones de configuración y reparación de configuraciones no válidas">
    Si la sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escribe directamente en ese archivo incluido y deja `openclaw.json` intacto. Las inclusiones raíz, las matrices de inclusiones y las inclusiones con anulaciones hermanas fallan de forma segura en lugar de aplanarse. Consulta [Inclusiones de configuración](/es/gateway/configuration) para conocer las estructuras compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma segura y te indica que ejecutes primero `openclaw doctor --fix`. Durante el inicio y la recarga en caliente del Gateway, una configuración de Plugin no válida falla de forma segura como cualquier otra configuración no válida; `openclaw doctor --fix` puede poner en cuarentena la entrada no válida del Plugin. La única excepción documentada durante la instalación es una ruta limitada de recuperación para plugins incluidos que habilitan explícitamente `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalación frente a actualización">
    `--force` reutiliza el destino de instalación existente y sobrescribe en el mismo lugar un Plugin o paquete de hooks ya instalado. Utilízalo cuando quieras reinstalar intencionadamente el mismo identificador desde una nueva ruta local, un archivo, un paquete de ClawHub o un artefacto de npm. Para actualizaciones rutinarias de un Plugin de npm ya registrado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un identificador de Plugin que ya está instalado, OpenClaw se detiene y te remite a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieras sobrescribir la instalación actual desde una fuente diferente. `--force` no es compatible con `--link`.

  </Accordion>
  <Accordion title="Ámbito de --pin">
    `--pin` se aplica únicamente a instalaciones de npm y registra el valor exacto resuelto `<name>@<version>`. No es compatible con instalaciones `git:` (fija la referencia en la especificación, por ejemplo, `git:github.com/acme/plugin@v1.2.3`) ni con `--marketplace` (las instalaciones del mercado conservan metadatos de la fuente del mercado en lugar de una especificación de npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto y ahora no realiza ninguna acción. OpenClaw ya no ejecuta el bloqueo integrado de código peligroso durante la instalación de plugins.

    Utiliza la superficie `security.installPolicy`, gestionada por el operador, cuando sea necesaria una política de instalación específica del host. Los hooks `before_install` de los plugins son hooks del ciclo de vida del entorno de ejecución de plugins, no el límite principal de políticas para las instalaciones mediante la CLI.

    Si un Plugin que publicaste en ClawHub está oculto o bloqueado por un análisis del registro, sigue los pasos para publicadores de [Publicación en ClawHub](/es/clawhub/publishing). `--dangerously-force-unsafe-install` no solicita a ClawHub que vuelva a analizar el Plugin ni que haga pública una versión bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Las instalaciones comunitarias de ClawHub comprueban el registro de confianza de la versión seleccionada antes de descargarla. Si ClawHub deshabilita la descarga de la versión, informa de hallazgos maliciosos en el análisis o coloca la versión en un estado de moderación bloqueante (en cuarentena o revocada), OpenClaw la rechaza por completo independientemente de esta opción. Para estados de análisis de riesgo o estados de moderación que no sean bloqueantes, OpenClaw muestra los detalles de confianza y solicita confirmación antes de continuar.

    Utiliza `--acknowledge-clawhub-risk` solo después de revisar la advertencia de ClawHub y decidir continuar sin una solicitud interactiva. Los resultados de análisis pendientes u obsoletos (todavía no limpios) generan una advertencia, pero no requieren confirmación. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidas con OpenClaw omiten por completo esta comprobación de confianza de la versión.

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones de npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Utiliza `openclaw hooks` para obtener visibilidad filtrada de los hooks y habilitarlos individualmente, no para instalar paquetes.

    Las especificaciones de npm son **exclusivas del registro** (nombre del paquete más una **versión exacta** o **dist-tag** opcional). Se rechazan las especificaciones de Git/URL/archivo y los rangos semver. Las dependencias se instalan en un proyecto npm administrado por plugin con `--ignore-scripts` por seguridad, incluso cuando el shell tiene ajustes globales de instalación de npm. Los proyectos npm administrados de los plugins heredan los `overrides` de npm a nivel de paquete de OpenClaw, por lo que las fijaciones de seguridad del host también se aplican a las dependencias elevadas de los plugins.

    Usa `npm:<package>` para hacer explícita la resolución mediante npm. Las especificaciones de paquete sin prefijo también se instalan directamente desde npm durante la transición del lanzamiento, salvo que coincidan con un identificador de plugin oficial.

    Las especificaciones `@openclaw/*` sin procesar que coinciden con plugins incluidos se resuelven primero con la copia incluida propiedad de la imagen, antes de recurrir a npm. Por ejemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa el plugin de Discord incluido en la compilación actual de OpenClaw, en lugar de crear una sustitución administrada de npm. Para forzar el uso del paquete npm externo, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Las especificaciones sin prefijo y `@latest` permanecen en el canal estable. Las versiones de corrección de OpenClaw con fecha, como `2026.5.3-1`, se consideran estables para esta comprobación. Si npm resuelve cualquiera de estas formas como una versión preliminar, OpenClaw se detiene y solicita que la aceptes explícitamente mediante una etiqueta de versión preliminar (`@beta`/`@rc`) o una versión preliminar exacta (`@1.2.3-beta.4`).

    Para instalaciones de npm sin una versión exacta (`npm:<package>` o `npm:<package>@latest`), OpenClaw comprueba los metadatos del paquete resuelto antes de instalarlo. Si el paquete estable más reciente requiere una API de plugins de OpenClaw más nueva o una versión mínima del host superior, OpenClaw examina versiones estables anteriores e instala en su lugar la versión compatible más reciente. Las versiones exactas y los dist-tags explícitos siguen siendo estrictos: una selección incompatible falla y solicita actualizar OpenClaw o elegir una versión compatible.

    Si una especificación de instalación sin prefijo coincide con un identificador de plugin oficial (por ejemplo, `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete npm con el mismo nombre, usa una especificación con ámbito explícito (por ejemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio Git. Formas compatibles: `git:github.com/owner/repo`, `git:owner/repo`, direcciones completas `https://`, `ssh://`, `git://`, `file://` y URL de clonación `git@host:owner/repo.git`. Añade `@<ref>` o `#<ref>` para cambiar a una rama, etiqueta o confirmación antes de la instalación.

    Las instalaciones desde Git clonan el contenido en un directorio temporal, cambian a la referencia solicitada cuando está presente y luego usan el instalador normal de directorios de plugins; así, la validación del manifiesto, la política de instalación del operador, la instalación mediante el gestor de paquetes y los registros de instalación se comportan igual que en las instalaciones desde npm. Las instalaciones registradas desde Git incluyen la URL/referencia de origen y la confirmación resuelta, para que `openclaw plugins update` pueda volver a resolver el origen posteriormente.

    Después de instalar desde Git, usa `openclaw plugins inspect <id> --runtime --json` para verificar los registros de ejecución, como los métodos del Gateway y los comandos de la CLI. Si el plugin registró una raíz de la CLI con `api.registerCli`, ejecuta ese comando directamente mediante la CLI raíz de OpenClaw, por ejemplo, `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos comprimidos">
    Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos de plugins nativos de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz extraída del plugin; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba los registros de instalación.

    Usa `npm-pack:<path.tgz>` cuando el archivo sea un tarball generado por npm-pack y quieras
    usar la misma ruta de proyecto npm administrado por plugin que utilizan las instalaciones desde el registro,
    incluida la verificación de `package-lock.json`, el análisis de dependencias elevadas
    y los registros de instalación de npm. Las rutas de archivos comprimidos normales siguen instalándose como
    archivos locales bajo la raíz de extensiones de plugins.

    También se admiten instalaciones desde mercados de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Las especificaciones de plugins sin prefijo válidas para npm se instalan desde npm de forma predeterminada durante la transición del lanzamiento, salvo que coincidan con un identificador de plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución exclusiva mediante npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la compatibilidad anunciada de la API de plugins y la versión mínima del Gateway antes de la instalación. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` versionado de npm-pack, verifica el encabezado de resumen de ClawHub y el resumen del artefacto y, a continuación, lo instala mediante la ruta normal de archivos comprimidos. Las versiones anteriores de ClawHub sin metadatos de ClawPack siguen instalándose mediante la ruta heredada de verificación de archivos de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, el tipo de artefacto, la integridad de npm, el shasum de npm, el nombre del tarball y los datos del resumen de ClawPack para futuras actualizaciones.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más recientes de ClawHub; los selectores explícitos de versión o etiqueta, como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta`, permanecen fijados a ese selector.

### Forma abreviada del mercado

Usa la forma abreviada `plugin@marketplace` cuando el nombre del mercado exista en la caché del registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` para indicar explícitamente el origen del mercado:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Orígenes de mercados">
    - un nombre de mercado conocido de Claude procedente de `~/.claude/plugins/known_marketplaces.json`
    - una raíz de mercado local o una ruta a `marketplace.json`
    - una forma abreviada de repositorio de GitHub, como `owner/repo`
    - una URL de repositorio de GitHub, como `https://github.com/owner/repo`
    - una URL de Git

  </Tab>
  <Tab title="Reglas de mercados remotos">
    Para los mercados remotos cargados desde GitHub o Git, las entradas de plugins deben permanecer dentro del repositorio clonado del mercado. OpenClaw acepta orígenes de rutas relativas de ese repositorio y rechaza los orígenes HTTP(S), de rutas absolutas, Git, GitHub y otros orígenes de plugins que no sean rutas en los manifiestos remotos.
  </Tab>
</Tabs>

Para rutas locales y archivos comprimidos, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o la disposición predeterminada de componentes de Claude cuando ese archivo de manifiesto no está presente)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Las instalaciones locales administradas deben ser directorios o archivos comprimidos de plugins. Los archivos de plugin independientes `.js`,
`.mjs`, `.cjs` y `.ts` no se copian en la raíz administrada de plugins mediante `plugins install`
ni se cargan colocándolos directamente en
`~/.openclaw/extensions` o `<workspace>/.openclaw/extensions`; esas
raíces de detección automática cargan directorios de paquetes o paquetes de plugins y omiten
los archivos de script de nivel superior como auxiliares locales. En su lugar, enumera explícitamente los archivos independientes en
`plugins.load.paths`.

<Note>
Los paquetes compatibles se instalan en la raíz normal de plugins y participan en el mismo flujo de enumeración/información/activación/desactivación. Actualmente se admiten las Skills de paquetes, las Skills de comandos de Claude, los valores predeterminados de `settings.json` de Claude, los valores predeterminados de `.lsp.json` de Claude y de `lspServers` declarados en el manifiesto, las Skills de comandos de Cursor y los directorios de hooks compatibles de Codex; otras capacidades detectadas de los paquetes aparecen en los diagnósticos y la información, pero todavía no están conectadas a la ejecución.
</Note>

Usa `-l`/`--link` para apuntar a un directorio local de plugins sin copiarlo (lo añade
a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` no es compatible con `--force` (los plugins enlazados apuntan directamente a la ruta
de origen, por lo que no hay nada que sobrescribir en el destino), `--marketplace` ni las
instalaciones `git:`, y requiere una ruta local que ya exista.

<Note>
Los plugins procedentes de un espacio de trabajo y detectados desde una raíz de extensiones del espacio de trabajo no se
importan ni ejecutan hasta que se activan explícitamente. Para el desarrollo local,
ejecuta `openclaw plugins enable <plugin-id>` o establece
`plugins.entries.<plugin-id>.enabled: true`; si la configuración usa
`plugins.allow`, incluye también allí el mismo identificador del plugin. Esta regla de denegación predeterminada
también se aplica cuando la configuración de un canal apunta explícitamente a un plugin procedente del espacio de trabajo para
cargarlo solo durante la configuración; por tanto, el código de configuración del plugin de canal local no se ejecutará mientras ese
plugin del espacio de trabajo permanezca desactivado o excluido de la lista de permitidos. Las instalaciones enlazadas
y las entradas explícitas de `plugins.load.paths` siguen la política normal correspondiente al
origen resuelto del plugin. Consulta
[Configurar la política de plugins](/es/tools/plugin#configure-plugin-policy)
y la [Referencia de configuración](/es/gateway/configuration-reference#plugins).

Usa `--pin` en las instalaciones de npm para guardar la especificación exacta resuelta (`name@version`) en el índice administrado de plugins, mientras se mantiene sin fijación el comportamiento predeterminado.
</Note>

## Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Muestra solo los plugins activados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Cambia de la vista de tabla a líneas de detalles por plugin con metadatos de formato/origen/procedencia/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquinas, junto con diagnósticos del registro y el estado de instalación de las dependencias de paquetes.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistente de plugins y usa como alternativa una vista derivada únicamente del manifiesto cuando el registro falta o no es válido. Resulta útil para comprobar si un plugin está instalado, activado y visible para la planificación de un arranque en frío, pero no es una sonda en vivo de un proceso del Gateway que ya esté en ejecución. Después de cambiar el código de un plugin, su activación, la política de hooks o `plugins.load.paths`, reinicia el Gateway que presta servicio al canal antes de esperar que se ejecute código nuevo de `register(api)` o nuevos hooks. En implementaciones remotas o en contenedores, verifica que estás reiniciando el proceso secundario real `openclaw gateway run`, no solo un proceso contenedor.

`plugins list --json` incluye el `dependencyStatus` de cada plugin a partir de
`dependencies` y `optionalDependencies` de `package.json`. OpenClaw comprueba si esos nombres de paquetes
están presentes en la ruta normal de búsqueda de `node_modules` de Node correspondiente al plugin; no
importa el código de ejecución del plugin, no ejecuta un gestor de paquetes ni repara
dependencias ausentes.
</Note>

Si durante el arranque se registra `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ejecuta `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con un identificador de plugin enumerado para confirmar los
identificadores de los plugins y copiar los identificadores de confianza en `plugins.allow` dentro de `openclaw.json`. Cuando la
advertencia puede enumerar todos los plugins detectados, muestra un fragmento de
`plugins.allow` listo para pegar que ya incluye esos identificadores. Si un plugin se carga
sin procedencia de instalación o ruta de carga, inspecciona el identificador de ese plugin y, a continuación, fija
el identificador de confianza en `plugins.allow` o reinstala el plugin desde un origen de confianza
para que OpenClaw registre la procedencia de la instalación.

Para trabajar con plugins incluidos dentro de una imagen de Docker empaquetada, monta mediante bind el directorio
de origen del plugin sobre la ruta de origen empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw detecta esa superposición del origen montado
antes de `/app/dist/extensions/synology-chat`; un directorio de origen simplemente copiado
permanece inactivo, por lo que las instalaciones empaquetadas normales siguen usando la distribución compilada.

Para depurar hooks durante la ejecución:

- `openclaw plugins inspect <id> --runtime --json` muestra los hooks registrados y los diagnósticos de una pasada de inspección con el módulo cargado. La inspección en tiempo de ejecución nunca instala dependencias; use `openclaw doctor --fix` para limpiar el estado de dependencias heredado o recuperar plugins descargables ausentes a los que haga referencia la configuración.
- `openclaw gateway status --deep --require-rpc` confirma la URL o el perfil del Gateway accesible, las indicaciones sobre el servicio o proceso, la ruta de configuración y el estado de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Índice de plugins

Los metadatos de instalación de plugins son un estado administrado por la máquina, no configuración del usuario. Las instalaciones y actualizaciones los escriben en la base de datos de estado SQLite compartida, dentro del directorio de estado activo de OpenClaw. La fila `installed_plugin_index` almacena metadatos duraderos de `installRecords`, incluidos registros de manifiestos de plugins dañados o ausentes, además de una caché de registro en frío derivada de los manifiestos que utilizan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro de plugins en frío.

Cuando OpenClaw encuentra registros heredados distribuidos de `plugins.installs` en la configuración, las lecturas en tiempo de ejecución los tratan como entrada de compatibilidad sin reescribir `openclaw.json`. Las escrituras explícitas de plugins y `openclaw doctor --fix` trasladan esos registros al índice de plugins y eliminan la clave de configuración cuando se permiten escrituras en la configuración; si falla cualquiera de las escrituras, los registros de configuración se conservan para no perder los metadatos de instalación.

## Desinstalación

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` elimina los registros del plugin de `plugins.entries`, el índice de plugins persistente, las entradas de las listas de plugins permitidos o denegados y, cuando corresponda, las entradas vinculadas de `plugins.load.paths`. A menos que se establezca `--keep-files`, la desinstalación también elimina el directorio de instalación administrado registrado, pero solo cuando este se resuelve dentro de la raíz de extensiones de plugins de OpenClaw. Si el plugin ocupa actualmente la ranura `memory` o `contextEngine`, esa ranura se restablece a su valor predeterminado (`memory-core` para la memoria y `legacy` para el motor de contexto).

`uninstall` muestra una vista previa de lo que se eliminará y luego solicita `Uninstall plugin "<id>"?` antes de realizar cambios. Pase `--force` para omitir la solicitud de confirmación (útil para scripts y ejecuciones no interactivas); sin esta opción, la desinstalación requiere una TTY interactiva. `--dry-run` muestra la misma vista previa y finaliza sin solicitar confirmación ni modificar nada.

<Note>
`--keep-config` se admite como alias obsoleto de `--keep-files`.
</Note>

## Actualización

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a las instalaciones de plugins registradas en el índice de plugins administrado y a las instalaciones registradas de paquetes de hooks en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolución del identificador del plugin frente a la especificación de npm">
    Cuando se pasa un identificador de plugin, OpenClaw reutiliza la especificación de instalación registrada para ese plugin. Esto significa que los dist-tags almacenados anteriormente, como `@beta`, y las versiones exactas fijadas siguen utilizándose en ejecuciones posteriores de `update <id>`.

    Durante `update <id> --dry-run`, las instalaciones de npm fijadas a una versión exacta permanecen fijadas. Si OpenClaw también puede resolver la línea predeterminada del registro del paquete y esa línea es más reciente que la versión fijada instalada, la simulación informa de la fijación y muestra el comando explícito de actualización del paquete a `@latest` para seguir la línea predeterminada del registro.

    Esta regla de actualización dirigida difiere de la ruta de mantenimiento masivo `openclaw plugins update --all`. Las actualizaciones masivas siguen respetando las especificaciones ordinarias de instalación registradas, pero los registros de plugins oficiales y de confianza de OpenClaw pueden sincronizarse con el objetivo actual del catálogo oficial en lugar de permanecer en un paquete oficial con una versión exacta obsoleta. Use la actualización dirigida `update <id>` cuando quiera mantener deliberadamente sin cambios una especificación oficial exacta o etiquetada.

    Para las instalaciones de npm, también puede pasar una especificación explícita de paquete npm con un dist-tag o una versión exacta. OpenClaw vuelve a resolver el nombre del paquete al registro del plugin correspondiente, actualiza ese plugin instalado y registra la nueva especificación de npm para futuras actualizaciones basadas en el identificador.

    Pasar el nombre del paquete npm sin una versión ni una etiqueta también lo vuelve a resolver al registro del plugin correspondiente. Use esta opción cuando un plugin esté fijado a una versión exacta y quiera devolverlo a la línea de versiones predeterminada del registro.

  </Accordion>
  <Accordion title="Actualizaciones del canal beta">
    La actualización dirigida `openclaw plugins update <id-or-npm-spec>` reutiliza la especificación registrada del plugin a menos que se pase una nueva. La actualización masiva `openclaw plugins update --all` usa el valor configurado de `update.channel` cuando sincroniza registros de plugins oficiales y de confianza con el objetivo del catálogo oficial, de modo que las instalaciones del canal beta pueden permanecer en la línea de versiones beta en lugar de normalizarse silenciosamente a estable o más reciente.

    `openclaw update` también conoce el canal de actualización activo de OpenClaw: en el canal beta, los registros de plugins de npm y ClawHub de la línea predeterminada prueban primero `@beta`. Si no existe una versión beta del plugin, recurren a la especificación predeterminada o más reciente registrada; los plugins de npm también recurren a ella cuando el paquete beta existe pero no supera la validación de instalación. Este recurso se notifica como advertencia y no provoca que falle la actualización del núcleo. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector para las actualizaciones dirigidas.

  </Accordion>
  <Accordion title="Comprobaciones de versiones y desviaciones de integridad">
    Antes de una actualización real de npm, OpenClaw compara la versión del paquete instalado con los metadatos del registro de npm. Si la versión instalada y la identidad registrada del artefacto ya coinciden con el objetivo resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido, OpenClaw lo considera una desviación del artefacto de npm. El comando interactivo `openclaw plugins update` muestra los hashes esperado y real y solicita confirmación antes de continuar. Los auxiliares de actualización no interactivos aplican un cierre seguro, a menos que el invocador proporcione una política explícita de continuación.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install durante la actualización">
    `--dangerously-force-unsafe-install` también se acepta en `plugins update` por compatibilidad, pero está obsoleto y ya no modifica el comportamiento de actualización de plugins. La opción del operador `security.installPolicy` todavía puede bloquear las actualizaciones; los hooks `before_install` del plugin solo se aplican en procesos donde estén cargados los hooks de plugins.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk durante la actualización">
    Las actualizaciones de plugins de la comunidad respaldados por ClawHub realizan, antes de descargar el paquete de sustitución, la misma comprobación de confianza de la versión exacta que las instalaciones. Use `--acknowledge-clawhub-risk` para automatizaciones revisadas que deban continuar cuando la versión seleccionada de ClawHub tenga una advertencia de confianza de riesgo. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidos de OpenClaw omiten esta solicitud de confianza de la versión.
  </Accordion>
</AccordionGroup>

## Inspección

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

La inspección muestra la identidad, el estado de carga, el origen, las capacidades del manifiesto, los indicadores de políticas, los diagnósticos, los metadatos de instalación, las capacidades del paquete y cualquier compatibilidad detectada con servidores MCP o LSP, sin importar de forma predeterminada el entorno de ejecución del plugin. La salida JSON incluye los contratos del manifiesto del plugin, como `contracts.agentToolResultMiddleware` y `contracts.trustedToolPolicies`, para que los operadores puedan auditar las declaraciones de superficies de confianza antes de activar o reiniciar un plugin. Añada `--runtime` para cargar el módulo del plugin e incluir los hooks, las herramientas, los comandos, los servicios, los métodos del Gateway y las rutas HTTP registrados. La inspección en tiempo de ejecución informa directamente de las dependencias ausentes del plugin; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos de la CLI propiedad de plugins suelen instalarse como grupos de comandos raíz de `openclaw`, pero los plugins también pueden registrar comandos anidados bajo un elemento principal del núcleo, como `openclaw nodes`. Después de que `inspect --runtime` muestre un comando en `cliCommands`, ejecútelo en la ruta indicada; por ejemplo, un plugin que registre `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada plugin se clasifica según lo que registra realmente en tiempo de ejecución:

| Forma               | Significado                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| `plain-capability`  | exactamente un tipo de capacidad (p. ej., un plugin solo de proveedor)    |
| `hybrid-capability` | más de un tipo de capacidad (p. ej., texto + voz + imágenes)              |
| `hook-only`         | solo hooks, sin capacidades, herramientas, comandos, servicios ni rutas   |
| `non-capability`    | herramientas, comandos o servicios, pero sin capacidades                  |

Consulte [Formas de plugins](/es/plugins/architecture#plugin-shapes) para obtener más información sobre el modelo de capacidades.

<Note>
La opción `--json` genera un informe legible por máquina adecuado para scripts y auditorías. `inspect --all` representa una tabla de todo el conjunto con columnas de forma, tipos de capacidades, avisos de compatibilidad, capacidades del paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` informa de errores de carga de plugins, diagnósticos de manifiestos o detección, avisos de compatibilidad y referencias obsoletas de configuración de plugins, como ranuras de plugins ausentes. Cuando el árbol de instalación y la configuración de plugins están limpios, muestra `No plugin issues detected.` Si queda configuración obsoleta, pero el árbol de instalación está en buen estado en los demás aspectos, el resumen lo indica en lugar de dar a entender que el estado de los plugins es totalmente correcto.

Si un plugin configurado está presente en el disco, pero las comprobaciones de seguridad de rutas del cargador lo bloquean, la validación de la configuración conserva la entrada del plugin e informa de ella como `present but blocked`. Corrija el diagnóstico anterior del plugin bloqueado, como la propiedad de la ruta o los permisos de escritura para todos, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para errores de forma de módulo, como la ausencia de exportaciones `register` o `activate`, vuelva a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de las exportaciones en la salida de diagnóstico.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo persistente de lectura en frío de OpenClaw para la identidad de los plugins instalados, su estado de activación, los metadatos de origen y la propiedad de las contribuciones. El inicio normal, la búsqueda del propietario de un proveedor, la clasificación de la configuración de canales y el inventario de plugins pueden leerlo sin importar módulos del entorno de ejecución de plugins.

Use `plugins registry` para comprobar si el registro persistente está presente, actualizado u obsoleto. Use `--refresh` para reconstruirlo a partir del índice de plugins persistente, la política de configuración y los metadatos de manifiestos o paquetes. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

`openclaw doctor --fix` también repara las desviaciones administradas de npm relacionadas con el registro: si un paquete `@openclaw/*` huérfano o recuperado, ubicado en un proyecto npm administrado de plugins o en la raíz plana heredada administrada de npm, oculta un plugin incluido, Doctor elimina ese paquete obsoleto y reconstruye el registro para que el inicio valide el manifiesto incluido. Doctor también vuelve a vincular el paquete anfitrión `openclaw` en los plugins npm administrados que declaran `peerDependencies.openclaw`, de modo que las importaciones locales del paquete en tiempo de ejecución, como `openclaw/plugin-sdk/*`, se resuelvan después de actualizaciones o reparaciones de npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un mecanismo de emergencia de compatibilidad obsoleto para errores de lectura del registro. Prefiera `plugins registry --refresh` u `openclaw doctor --fix`; el recurso a la variable de entorno solo sirve para la recuperación de emergencia del inicio mientras se despliega la migración.
</Warning>

## Mercado de plugins

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

`plugins marketplace entries` enumera las entradas del feed de marketplace de OpenClaw configurado. De forma predeterminada, intenta usar el feed alojado y, si no está disponible, recurre a la última instantánea aceptada o a los datos incluidos. Usa `--feed-profile <name>` para leer un perfil configurado específico, `--feed-url <url>` para leer una URL explícita de un feed alojado y `--offline` para leer la última instantánea aceptada sin obtener el feed.

`plugins marketplace refresh` actualiza la instantánea del feed alojado configurado e indica si OpenClaw aceptó los datos alojados, una instantánea alojada o los datos incluidos como alternativa. Usa `--expected-sha256` cuando el proceso que invoca el comando necesite que este falle a menos que una carga útil alojada reciente coincida con una suma de comprobación fijada.

El comando `list` del marketplace acepta una ruta local de marketplace, una ruta a `marketplace.json`, una abreviatura de GitHub como `owner/repo`, la URL de un repositorio de GitHub o una URL de Git. `--json` muestra la etiqueta de la fuente resuelta, junto con el manifiesto del marketplace analizado y las entradas de plugins.

La actualización del marketplace carga un feed de marketplace de OpenClaw alojado y conserva la respuesta validada como instantánea local del feed alojado. Sin opciones, utiliza el perfil de feed predeterminado configurado. Usa `--feed-profile <name>` para actualizar un perfil configurado específico, `--feed-url <url>` para actualizar una URL explícita de un feed alojado, `--expected-sha256 <sha256>` para exigir una suma de comprobación coincidente de la carga útil (`sha256:<hex>` o un resumen hexadecimal sin prefijo de 64 caracteres) y `--json` para obtener una salida legible por máquinas. Las URL explícitas de feeds alojados no deben incluir credenciales, cadenas de consulta ni fragmentos. Las actualizaciones sin suma fijada pueden indicar como resultado una instantánea alojada o los datos incluidos como alternativa sin que el comando falle. Las actualizaciones con suma fijada fallan a menos que acepten una carga útil alojada reciente, y las actualizaciones alojadas correctas fallan si OpenClaw no puede conservar la instantánea validada.

## Contenido relacionado

- [Creación de plugins](/es/plugins/building-plugins)
- [Referencia de la CLI](/es/cli)
- [ClawHub](/clawhub)
