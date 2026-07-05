---
read_when:
    - Quieres instalar o gestionar plugins de Gateway o paquetes compatibles
    - Quieres generar o validar la estructura de un Plugin de herramienta sencillo
    - Quieres depurar fallos de carga de plugins
sidebarTitle: Plugins
summary: Referencia de CLI para `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-07-05T11:11:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a42d3fa6a60263f3fc2918cd34e6c1e3380b9ecae433a6ed340967c929de4c3c
    source_path: cli/plugins.md
    workflow: 16
---

Administra Plugins de Gateway, paquetes de hooks y paquetes compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de Plugins" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo instalar, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Administrar plugins" href="/es/plugins/manage-plugins">
    Ejemplos rápidos para instalar, listar, actualizar, desinstalar y publicar.
  </Card>
  <Card title="Paquetes de Plugins" href="/es/plugins/bundles">
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

Para investigar instalaciones, inspecciones, desinstalaciones o actualizaciones del registro lentas, ejecuta el
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de las fases
en stderr y mantiene la salida JSON analizable. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` es inmutable. `install`, `update`, `uninstall`, `enable` y `disable` se niegan a ejecutarse. En su lugar, edita la fuente de Nix para esta instalación (`programs.openclaw.config` o `instances.<name>.config` para nix-openclaw) y luego recompila. Consulta el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en agentes.
</Note>

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw incluyen `openclaw.plugin.json` con un esquema JSON en línea (`configSchema`, aunque esté vacío). Los paquetes compatibles usan sus propios manifiestos de paquete en su lugar.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de lista/información también muestra el subtipo de paquete (`codex`, `claude` o `cursor`) junto con las capacidades de paquete detectadas.
</Note>

## Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea de forma predeterminada un plugin de herramienta mínimo en TypeScript. El primer
argumento es el id del plugin; `--name` define el nombre para mostrar. OpenClaw usa el
id para el directorio de salida predeterminado y la nomenclatura del paquete. Los andamiajes de herramientas usan
`defineToolPlugin` y generan scripts de `package.json` `plugin:build` y
`plugin:validate`, que compilan y luego llaman a `openclaw plugins build`/`validate`.

`plugins build` importa la entrada compilada, lee sus metadatos estáticos de herramienta, escribe
`openclaw.plugin.json` y mantiene alineado `openclaw.extensions` de `package.json`.
`plugins validate` comprueba que el manifiesto generado, los metadatos del paquete y la
exportación de entrada actual sigan coincidiendo. Consulta [Plugins de herramienta](/es/plugins/tool-plugins) para ver
el flujo de trabajo completo de autoría.

El andamiaje escribe código fuente TypeScript, pero genera metadatos a partir de la entrada compilada
`./dist/index.js`, por lo que el flujo de trabajo también funciona con la CLI publicada. Usa
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

Los andamiajes de proveedor crean un plugin genérico de proveedor de modelos compatible con OpenAI
con infraestructura de autenticación mediante clave de API, un script `npm run validate` que ejecuta
`clawhub package validate`, metadatos de paquete de ClawHub y un flujo de trabajo de GitHub Actions
despachado manualmente para futura publicación de confianza mediante OIDC de GitHub. Los andamiajes
de proveedor no generan Skills y no usan
`openclaw plugins build`/`validate`; esos comandos son para la ruta de metadatos generados
del andamiaje de herramientas.

Antes de publicar, reemplaza la URL base de API, el catálogo de modelos, la ruta de documentación,
el texto de credenciales y el contenido del README de marcador de posición por detalles reales del proveedor. Usa el
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

Los responsables que prueben instalaciones en tiempo de configuración pueden anular las fuentes
automáticas de instalación de plugins con variables de entorno protegidas. Consulta
[Anulaciones de instalación de Plugins](/es/plugins/install-overrides).

<Warning>
Los nombres de paquete sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento, a menos que coincidan con un id de plugin incluido u oficial, en cuyo caso OpenClaw usa esa copia local/oficial en lugar de acceder al registro de npm. Usa `npm:<package>` cuando quieras deliberadamente un paquete npm externo. Usa `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como ejecutar código; prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub para encontrar paquetes `code-plugin` y
`bundle-plugin` instalables (no Skills; usa `openclaw skills search` para esos).
El `--limit` predeterminado es 20, con un máximo de 100. Solo lee el catálogo remoto: no
inspecciona el estado local, no muta la configuración, no instala paquetes ni carga el runtime de plugins.
Los resultados incluyen el nombre del paquete de ClawHub, la familia, el canal, la versión,
el resumen y una sugerencia de instalación como `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los plugins. Npm
sigue siendo una ruta de respaldo e instalación directa compatible. Los paquetes de plugins
`@openclaw/*` propiedad de OpenClaw vuelven a publicarse en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables usan `latest`.
Las instalaciones y actualizaciones del canal beta prefieren la etiqueta de distribución `beta` de npm cuando está disponible,
con reserva a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuración y reparación de configuración inválida">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escriben en ese archivo incluido y dejan `openclaw.json` sin cambios. Los includes raíz, los arrays de includes y los includes con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Includes de configuración](/es/gateway/configuration) para ver las formas admitidas.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma cerrada y te indica ejecutar primero `openclaw doctor --fix`. Durante el inicio de Gateway y la recarga en caliente, la configuración inválida de plugins falla de forma cerrada como cualquier otra configuración inválida; `openclaw doctor --fix` puede poner en cuarentena la entrada de plugin inválida. La única excepción documentada en tiempo de instalación es una ruta estrecha de recuperación de plugins incluidos para plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalar frente a actualizar">
    `--force` reutiliza el destino de instalación existente y sobrescribe in situ un plugin o paquete de hooks ya instalado. Úsalo cuando reinstales intencionadamente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto npm. Para actualizaciones rutinarias de un plugin npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieras sobrescribir la instalación actual desde una fuente diferente. `--force` no es compatible con `--link`.

  </Accordion>
  <Accordion title="Ámbito de --pin">
    `--pin` se aplica solo a instalaciones npm y registra el `<name>@<version>` exacto resuelto. No es compatible con instalaciones `git:` (fija la ref en la especificación en su lugar, por ejemplo, `git:github.com/acme/plugin@v1.2.3`) ni con `--marketplace` (las instalaciones de marketplace persisten metadatos de fuente de marketplace en lugar de una especificación npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto y ahora no hace nada. OpenClaw ya no ejecuta bloqueo integrado de código peligroso en tiempo de instalación para instalaciones de plugins.

    Usa la superficie `security.installPolicy` propiedad del operador cuando se requiera una política de instalación específica del host. Los hooks `before_install` de plugins son hooks de ciclo de vida del runtime de plugins, no el límite principal de política para instalaciones mediante CLI.

    Si un plugin que publicaste en ClawHub está oculto o bloqueado por un análisis del registro, usa los pasos de publicador en [Publicación en ClawHub](/es/clawhub/publishing). `--dangerously-force-unsafe-install` no solicita a ClawHub volver a analizar el plugin ni hacer pública una versión bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Las instalaciones comunitarias de ClawHub comprueban el registro de confianza de la versión seleccionada antes de descargarla. Si ClawHub deshabilita la descarga de la versión, informa hallazgos maliciosos de análisis o coloca la versión en un estado de moderación bloqueante (en cuarentena, revocada), OpenClaw la rechaza directamente independientemente de esta opción. Para estados de moderación o análisis riesgosos no bloqueantes, OpenClaw muestra los detalles de confianza y pide confirmación antes de continuar.

    Usa `--acknowledge-clawhub-risk` solo después de revisar la advertencia de ClawHub y decidir continuar sin un prompt interactivo. Los resultados de análisis pendientes u obsoletos (aún no limpios) advierten, pero no requieren reconocimiento. Los paquetes oficiales de ClawHub y las fuentes de plugins de OpenClaw incluidas omiten por completo esta comprobación de confianza de versión.

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para la visibilidad filtrada de hooks y la habilitación por hook, no para la instalación de paquetes.

    Las especificaciones de npm son **solo de registro** (nombre del paquete más **versión exacta** o **dist-tag** opcional). Las especificaciones Git/URL/file y los rangos semver se rechazan. Las instalaciones de dependencias se ejecutan en un proyecto npm gestionado por Plugin con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene opciones globales de instalación de npm. Los proyectos npm gestionados de Plugin heredan los `overrides` de npm de nivel de paquete de OpenClaw, así que los pines de seguridad del host también se aplican a las dependencias de Plugin elevadas.

    Usa `npm:<package>` para hacer explícita la resolución de npm. Las especificaciones de paquete simples también se instalan directamente desde npm durante la transición de lanzamiento, salvo que coincidan con un id oficial de Plugin.

    Las especificaciones `@openclaw/*` sin procesar que coincidan con Plugins incluidos se resuelven a la copia incluida propiedad de la imagen antes de recurrir a npm. Por ejemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa el Plugin Discord incluido de la compilación actual de OpenClaw en lugar de crear una sustitución npm gestionada. Para forzar el paquete npm externo, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Las especificaciones simples y `@latest` permanecen en la rama estable. Las versiones de corrección con fecha de OpenClaw, como `2026.5.3-1`, cuentan como estables para esta comprobación. Si npm resuelve cualquiera de las dos formas a una versión preliminar, OpenClaw se detiene y te pide optar explícitamente con una etiqueta de versión preliminar (`@beta`/`@rc`) o una versión preliminar exacta (`@1.2.3-beta.4`).

    Para instalaciones npm sin una versión exacta (`npm:<package>` o `npm:<package>@latest`), OpenClaw comprueba los metadatos del paquete resuelto antes de instalar. Si el último paquete estable requiere una API de Plugin de OpenClaw o una versión mínima del host más reciente, OpenClaw inspecciona versiones estables anteriores e instala la versión compatible más nueva. Las versiones exactas y los dist-tags explícitos permanecen estrictos: una selección incompatible falla y te pide actualizar OpenClaw o elegir una versión compatible.

    Si una especificación de instalación simple coincide con un id oficial de Plugin (por ejemplo `diffs`), OpenClaw instala la entrada del catálogo directamente. Para instalar un paquete npm con el mismo nombre, usa una especificación con ámbito explícito (por ejemplo `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio git. Formas compatibles: `git:github.com/owner/repo`, `git:owner/repo`, direcciones URL de clonación completas `https://`, `ssh://`, `git://`, `file://` y `git@host:owner/repo.git`. Agrega `@<ref>` o `#<ref>` para extraer una rama, etiqueta o commit antes de instalar.

    Las instalaciones Git clonan en un directorio temporal, extraen la referencia solicitada cuando está presente y luego usan el instalador normal de directorios de Plugin, así que la validación del manifiesto, la política de instalación del operador, el trabajo de instalación del gestor de paquetes y los registros de instalación se comportan como las instalaciones npm. Las instalaciones git registradas incluyen la URL/referencia de origen más el commit resuelto para que `openclaw plugins update` pueda volver a resolver el origen más tarde.

    Después de instalar desde git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime como métodos de gateway y comandos CLI. Si el Plugin registró una raíz CLI con `api.registerCli`, ejecuta ese comando directamente a través de la CLI raíz de OpenClaw, por ejemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos">
    Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos nativos de Plugin de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz extraída del Plugin; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    Usa `npm-pack:<path.tgz>` cuando el archivo sea un tarball npm-pack y quieras
    la misma ruta de proyecto npm gestionado por Plugin que usan las instalaciones de registro,
    incluida la verificación de `package-lock.json`, el escaneo de dependencias elevadas
    y los registros de instalación npm. Las rutas de archivo simples siguen instalándose como
    archivos locales bajo la raíz de extensiones de Plugin.

    También se admiten instalaciones del marketplace de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Las especificaciones de Plugin simples aptas para npm se instalan desde npm de forma predeterminada durante la transición de lanzamiento, salvo que coincidan con un id oficial de Plugin:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución solo de npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la API de Plugin anunciada / compatibilidad mínima de gateway antes de instalar. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` npm-pack versionado, verifica el encabezado de digest de ClawHub y el digest del artefacto, y luego lo instala a través de la ruta normal de archivo. Las versiones anteriores de ClawHub sin metadatos ClawPack siguen instalándose mediante la ruta heredada de verificación de archivo de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, tipo de artefacto, integridad npm, shasum npm, nombre de tarball y datos de digest de ClawPack para actualizaciones posteriores.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más recientes de ClawHub; los selectores explícitos de versión o etiqueta como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta` permanecen fijados a ese selector.

### Abreviatura de marketplace

Usa la abreviatura `plugin@marketplace` cuando el nombre del marketplace exista en la caché del registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Orígenes de marketplace">
    - un nombre de marketplace conocido de Claude de `~/.claude/plugins/known_marketplaces.json`
    - una raíz de marketplace local o una ruta `marketplace.json`
    - una abreviatura de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL git

  </Tab>
  <Tab title="Reglas de marketplace remoto">
    Para marketplaces remotos cargados desde GitHub o git, las entradas de Plugin deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta orígenes de ruta relativa de ese repositorio y rechaza HTTP(S), rutas absolutas, git, GitHub y otros orígenes de Plugin que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas locales y archivos, OpenClaw detecta automáticamente:

- Plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json`, o el diseño predeterminado de componentes de Claude cuando ese archivo de manifiesto no está presente)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Las instalaciones locales gestionadas deben ser directorios o archivos de Plugin. Los archivos de Plugin independientes `.js`,
`.mjs`, `.cjs` y `.ts` no se copian en la raíz gestionada de Plugin
mediante `plugins install`, ni se cargan colocándolos directamente en
`~/.openclaw/extensions` o `<workspace>/.openclaw/extensions`; esas
raíces autodescubiertas cargan directorios de paquetes o bundles de Plugin y omiten
archivos de script de nivel superior como helpers locales. Lista los archivos independientes explícitamente en
`plugins.load.paths` en su lugar.

<Note>
Los bundles compatibles se instalan en la raíz normal de Plugin y participan en el mismo flujo de listar/información/habilitar/deshabilitar. Hoy se admiten Skills de bundle, Skills de comando de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` / `lspServers` declarados en manifiesto, Skills de comando de Cursor y directorios de hooks de Codex compatibles; otras capacidades de bundle detectadas se muestran en diagnósticos/información, pero aún no están conectadas a la ejecución en runtime.
</Note>

Usa `-l`/`--link` para apuntar a un directorio local de Plugin sin copiarlo (se agrega
a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` no es compatible con `--force` (los Plugins enlazados apuntan directamente a la ruta
de origen, así que no hay nada que sobrescribir in situ), `--marketplace` ni
instalaciones `git:`, y requiere una ruta local que ya exista.

<Note>
Los Plugins de origen de workspace descubiertos desde una raíz de extensiones de workspace no se
importan ni ejecutan hasta que se habilitan explícitamente. Para desarrollo local,
ejecuta `openclaw plugins enable <plugin-id>` o define
`plugins.entries.<plugin-id>.enabled: true`; si tu configuración usa
`plugins.allow`, incluye allí también el mismo id de Plugin. Esta regla fail-closed
también se aplica cuando la configuración de canal apunta explícitamente a un Plugin de origen de workspace para
carga solo de configuración, así que el código de configuración de Plugin de canal local no se ejecutará mientras ese
Plugin de workspace permanezca deshabilitado o excluido de la allowlist. Las instalaciones enlazadas
y las entradas explícitas de `plugins.load.paths` siguen la política normal para su
origen de Plugin resuelto. Consulta
[Configurar la política de Plugin](/es/tools/plugin#configure-plugin-policy)
y [Referencia de configuración](/es/gateway/configuration-reference#plugins).

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice gestionado de Plugin mientras se mantiene el comportamiento predeterminado sin fijar.
</Note>

## Listar

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
  Cambia de la vista de tabla a líneas de detalle por Plugin con metadatos de formato/origen/procedencia/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina más diagnósticos de registro y estado de instalación de dependencias de paquete.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistido de Plugins, con una alternativa derivada solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un Plugin está instalado, habilitado y visible para la planificación de arranque en frío, pero no es una sonda de runtime en vivo de un proceso Gateway ya en ejecución. Después de cambiar código de Plugin, habilitación, política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecute nuevo código `register(api)` o hooks. Para despliegues remotos/en contenedores, verifica que estés reiniciando el hijo real `openclaw gateway run`, no solo un proceso contenedor.

`plugins list --json` incluye el `dependencyStatus` de cada Plugin desde `package.json`
`dependencies` y `optionalDependencies`. OpenClaw comprueba si esos nombres de paquetes
están presentes a lo largo de la ruta normal de búsqueda `node_modules` de Node del Plugin; no
importa código de runtime del Plugin, ejecuta un gestor de paquetes ni repara dependencias
faltantes.
</Note>

Si los registros de inicio muestran `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ejecuta `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con un id de Plugin listado para confirmar los ids de Plugin
y copiar ids confiables en `plugins.allow` en `openclaw.json`. Cuando la
advertencia puede listar todos los Plugins descubiertos, imprime un fragmento
`plugins.allow` listo para pegar que ya incluye esos ids. Si un Plugin se carga
sin procedencia de instalación/ruta de carga, inspecciona ese id de Plugin y luego fija
el id confiable en `plugins.allow` o reinstala el Plugin desde un origen confiable
para que OpenClaw registre la procedencia de instalación.

Para trabajo en Plugins incluidos dentro de una imagen Docker empaquetada, monta con bind el directorio
de origen del Plugin sobre la ruta de origen empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw descubre esa superposición de origen montada
antes de `/app/dist/extensions/synology-chat`; un directorio de origen copiado sin más
permanece inerte, así que las instalaciones empaquetadas normales siguen usando el dist compilado.

Para depuración de hooks en runtime:

- `openclaw plugins inspect <id> --runtime --json` muestra hooks registrados y diagnósticos de una pasada de inspección con el módulo cargado. La inspección en tiempo de ejecución nunca instala dependencias; usa `openclaw doctor --fix` para limpiar el estado de dependencias heredado o recuperar plugins descargables faltantes que están referenciados por la configuración.
- `openclaw gateway status --deep --require-rpc` confirma la URL/perfil del Gateway accesible, pistas de servicio/proceso, ruta de configuración y estado de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Índice de Plugin

Los metadatos de instalación de Plugin son estado gestionado por la máquina, no configuración de usuario. Las instalaciones y actualizaciones los escriben en la base de datos SQLite de estado compartido bajo el directorio de estado activo de OpenClaw. La fila `installed_plugin_index` almacena metadatos duraderos de `installRecords`, incluidos registros de manifiestos de Plugin rotos o faltantes, además de una caché fría de registro derivada del manifiesto que usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro frío de Plugin.

Cuando OpenClaw ve registros heredados distribuidos de `plugins.installs` en la configuración, las lecturas en tiempo de ejecución los tratan como entrada de compatibilidad sin reescribir `openclaw.json`. Las escrituras explícitas de Plugin y `openclaw doctor --fix` mueven esos registros al índice de Plugin y eliminan la clave de configuración cuando se permiten escrituras de configuración; si cualquiera de las escrituras falla, los registros de configuración se conservan para que no se pierdan los metadatos de instalación.

## Desinstalación

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` elimina registros de Plugin de `plugins.entries`, el índice persistido de Plugin, las entradas de listas de permiso/denegación de Plugin y las entradas vinculadas de `plugins.load.paths` cuando corresponde. A menos que se establezca `--keep-files`, la desinstalación también elimina el directorio de instalación gestionado registrado, pero solo cuando se resuelve dentro de la raíz de extensiones de Plugin de OpenClaw. Si el Plugin posee actualmente el espacio `memory` o `contextEngine`, ese espacio se restablece a su valor predeterminado (`memory-core` para memoria, `legacy` para motor de contexto).

`uninstall` imprime una vista previa de lo que se eliminará y luego solicita `Uninstall plugin "<id>"?` antes de realizar cambios. Pasa `--force` para omitir la solicitud de confirmación (útil para scripts y ejecuciones no interactivas); sin él, la desinstalación requiere una TTY interactiva. `--dry-run` imprime la misma vista previa y sale sin solicitar confirmación ni cambiar nada.

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

Las actualizaciones se aplican a instalaciones rastreadas de Plugin en el índice gestionado de Plugin y a instalaciones rastreadas de paquetes de hooks en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de Plugin frente a especificación npm">
    Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese Plugin. Eso significa que los dist-tags almacenados previamente, como `@beta`, y las versiones exactas fijadas se siguen usando en ejecuciones posteriores de `update <id>`.

    Durante `update <id> --dry-run`, las instalaciones npm fijadas a una versión exacta permanecen fijadas. Si OpenClaw también puede resolver la línea predeterminada del registro del paquete y esa línea predeterminada es más reciente que la versión fijada instalada, la ejecución de prueba informa la fijación e imprime el comando explícito de actualización del paquete con `@latest` para seguir la línea predeterminada del registro.

    Esa regla de actualización dirigida difiere de la ruta de mantenimiento masiva `openclaw plugins update --all`. Las actualizaciones masivas siguen respetando las especificaciones ordinarias de instalación rastreadas, pero los registros de Plugin oficiales y de confianza de OpenClaw pueden sincronizarse con el objetivo actual del catálogo oficial en lugar de permanecer en un paquete oficial exacto obsoleto. Usa `update <id>` dirigido cuando quieras conservar intencionalmente una especificación oficial exacta o etiquetada sin tocar.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con un dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de Plugin rastreado, actualiza ese Plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre del paquete npm sin versión ni etiqueta también se resuelve de vuelta al registro de Plugin rastreado. Usa esto cuando un Plugin se fijó a una versión exacta y quieres moverlo de nuevo a la línea de publicación predeterminada del registro.

  </Accordion>
  <Accordion title="Actualizaciones del canal beta">
    `openclaw plugins update <id-or-npm-spec>` dirigido reutiliza la especificación de Plugin rastreada a menos que pases una especificación nueva. `openclaw plugins update --all` masivo usa el `update.channel` configurado cuando sincroniza registros de Plugin oficiales y de confianza con el objetivo del catálogo oficial, por lo que las instalaciones del canal beta pueden permanecer en la línea de publicación beta en lugar de normalizarse silenciosamente a estable/latest.

    `openclaw update` también conoce el canal activo de actualización de OpenClaw: en el canal beta, los registros de Plugin npm de línea predeterminada y de ClawHub prueban primero `@beta`. Recurren a la especificación predeterminada/latest registrada si no existe una publicación beta del Plugin; los plugins npm también recurren a esa alternativa cuando el paquete beta existe pero falla la validación de instalación. Esa alternativa se informa como advertencia y no hace fallar la actualización principal. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector para actualizaciones dirigidas.

  </Accordion>
  <Accordion title="Comprobaciones de versión y deriva de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado frente a los metadatos del registro npm. Si la versión instalada y la identidad registrada del artefacto ya coinciden con el objetivo resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y el hash del artefacto obtenido cambia, OpenClaw lo trata como deriva de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real, y solicita confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan en modo cerrado a menos que el llamador proporcione una política explícita de continuación.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en update">
    `--dangerously-force-unsafe-install` también se acepta en `plugins update` por compatibilidad, pero está obsoleto y ya no cambia el comportamiento de actualización de Plugin. El operador `security.installPolicy` aún puede bloquear actualizaciones; los hooks de Plugin `before_install` solo se aplican en procesos donde los hooks de Plugin están cargados.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk en update">
    Las actualizaciones de Plugin comunitarias respaldadas por ClawHub ejecutan la misma comprobación de confianza de publicación exacta que las instalaciones antes de descargar el paquete de reemplazo. Usa `--acknowledge-clawhub-risk` para automatización revisada que deba continuar cuando la publicación de ClawHub seleccionada tenga una advertencia de confianza riesgosa. Los paquetes oficiales de ClawHub y las fuentes de Plugin incluidas de OpenClaw omiten esta solicitud de confianza de publicación.
  </Accordion>
</AccordionGroup>

## Inspección

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

La inspección muestra identidad, estado de carga, origen, capacidades del manifiesto, indicadores de política, diagnósticos, metadatos de instalación, capacidades del paquete incluido y cualquier compatibilidad detectada con servidores MCP o LSP sin importar el runtime de Plugin de forma predeterminada. La salida JSON incluye los contratos del manifiesto de Plugin, como `contracts.agentToolResultMiddleware` y `contracts.trustedToolPolicies`, para que los operadores puedan auditar declaraciones de superficies de confianza antes de habilitar o reiniciar un Plugin. Agrega `--runtime` para cargar el módulo de Plugin e incluir hooks, herramientas, comandos, servicios, métodos de Gateway y rutas HTTP registrados. La inspección en tiempo de ejecución informa directamente las dependencias faltantes de Plugin; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos CLI propiedad de Plugin normalmente se instalan como grupos de comandos raíz de `openclaw`, pero los plugins también pueden registrar comandos anidados bajo un padre principal como `openclaw nodes`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútalo en la ruta indicada; por ejemplo, un Plugin que registra `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada Plugin se clasifica según lo que realmente registra en tiempo de ejecución:

| Forma               | Significado                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | exactamente un tipo de capacidad (p. ej., un Plugin solo de proveedor) |
| `hybrid-capability` | más de un tipo de capacidad (p. ej., texto + voz + imágenes)      |
| `hook-only`         | solo hooks, sin capacidades, herramientas, comandos, servicios ni rutas |
| `non-capability`    | herramientas/comandos/servicios, pero sin capacidades             |

Consulta [Formas de Plugin](/es/plugins/architecture#plugin-shapes) para obtener más información sobre el modelo de capacidades.

<Note>
La marca `--json` genera un informe legible por máquina apto para scripting y auditoría. `inspect --all` muestra una tabla de toda la flota con columnas de forma, tipos de capacidad, avisos de compatibilidad, capacidades del paquete incluido y resumen de hooks. `info` es un alias de `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de Plugin, diagnósticos de manifiesto/descubrimiento, avisos de compatibilidad y referencias obsoletas de configuración de Plugin, como espacios de Plugin faltantes. Cuando el árbol de instalación y la configuración de Plugin están limpios, imprime `No plugin issues detected.` Si queda configuración obsoleta pero el árbol de instalación por lo demás está sano, el resumen lo indica en lugar de implicar una salud completa de Plugin.

Si un Plugin configurado está presente en disco pero bloqueado por las comprobaciones de seguridad de rutas del cargador, la validación de configuración conserva la entrada de Plugin y la informa como `present but blocked`. Corrige el diagnóstico anterior de Plugin bloqueado, como la propiedad de la ruta o permisos de escritura para todos, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para fallos de forma de módulo, como exportaciones `register`/`activate` faltantes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de forma de exportación en la salida de diagnóstico.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de Plugin es el modelo de lectura fría persistido de OpenClaw para identidad de Plugin instalada, habilitación, metadatos de origen y propiedad de contribuciones. El arranque normal, la búsqueda de propietario de proveedor, la clasificación de configuración de canal y el inventario de Plugin pueden leerlo sin importar módulos de runtime de Plugin.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado u obsoleto. Usa `--refresh` para reconstruirlo a partir del índice persistido de Plugin, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

`openclaw doctor --fix` también repara deriva npm gestionada adyacente al registro: si un paquete `@openclaw/*` huérfano o recuperado bajo un proyecto npm gestionado de Plugin o la raíz npm gestionada plana heredada eclipsa un Plugin incluido, doctor elimina ese paquete obsoleto y reconstruye el registro para que el arranque valide contra el manifiesto incluido. Doctor también vuelve a enlazar el paquete host `openclaw` en plugins npm gestionados que declaran `peerDependencies.openclaw`, para que las importaciones de runtime locales al paquete, como `openclaw/plugin-sdk/*`, se resuelvan después de actualizaciones o reparaciones npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un conmutador de compatibilidad obsoleto de emergencia para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; la alternativa por env solo es para recuperación de arranque de emergencia mientras se despliega la migración.
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

`plugins marketplace entries` enumera las entradas de la fuente de marketplace de OpenClaw configurada. De forma predeterminada, intenta usar la fuente alojada y recurre a la instantánea aceptada más reciente o a los datos incluidos. Usa `--feed-profile <name>` para leer un perfil configurado específico, `--feed-url <url>` para leer una URL explícita de fuente alojada y `--offline` para leer la instantánea aceptada más reciente sin obtener la fuente.

`plugins marketplace refresh` actualiza la instantánea de la fuente alojada configurada e informa si OpenClaw aceptó datos alojados, una instantánea alojada o datos alternativos incluidos. Usa `--expected-sha256` cuando un invocador necesite que el comando falle a menos que una carga útil alojada reciente coincida con una suma de comprobación fijada.

Marketplace `list` acepta una ruta de marketplace local, una ruta de `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de origen resuelta, además del manifiesto de marketplace analizado y las entradas de plugins.

La actualización del marketplace carga un feed de marketplace alojado de OpenClaw y conserva la
respuesta validada como la instantánea local del feed alojado. Sin opciones, usa
el perfil de feed predeterminado configurado. Usa `--feed-profile <name>` para actualizar un
perfil configurado específico, `--feed-url <url>` para actualizar una URL explícita de
feed alojado, `--expected-sha256 <sha256>` para exigir una suma de comprobación de carga útil coincidente
(`sha256:<hex>` o un resumen hexadecimal simple de 64 caracteres), y `--json` para
salida legible por máquina. Las URL explícitas de feed alojado no deben incluir
credenciales, cadenas de consulta ni fragmentos. Las actualizaciones sin fijar pueden informar un
resultado de instantánea alojada o de alternativa incluida sin hacer fallar el comando. Las actualizaciones
fijadas fallan a menos que acepten una carga útil alojada reciente, y las actualizaciones alojadas
correctas fallan si OpenClaw no puede conservar la instantánea validada.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Referencia de CLI](/es/cli)
- [ClawHub](/clawhub)
