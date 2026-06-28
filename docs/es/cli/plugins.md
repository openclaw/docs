---
read_when:
    - Quieres instalar o gestionar Plugins de Gateway o paquetes compatibles
    - Quieres generar o validar la estructura de un Plugin de herramienta simple
    - Quieres depurar errores de carga de plugins
sidebarTitle: Plugins
summary: Referencia de CLI para `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-28T20:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Gestiona plugins de Gateway, paquetes de hooks y bundles compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de plugins" href="/es/tools/plugin">
    Guía para usuarios finales sobre instalación, activación y solución de problemas de plugins.
  </Card>
  <Card title="Gestionar plugins" href="/es/plugins/manage-plugins">
    Ejemplos rápidos para instalar, listar, actualizar, desinstalar y publicar.
  </Card>
  <Card title="Bundles de plugins" href="/es/plugins/bundles">
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
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Para investigar instalaciones, inspecciones, desinstalaciones o actualizaciones del registro lentas, ejecuta el
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de fase
en stderr y mantiene la salida JSON analizable. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), los mutadores del ciclo de vida de plugins están deshabilitados. Usa la fuente Nix para esta instalación en lugar de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` o `plugins disable`; para nix-openclaw, usa la [Guía rápida](https://github.com/openclaw/nix-openclaw#quick-start) centrada en el agente.
</Note>

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw deben distribuir `openclaw.plugin.json` con un esquema JSON en línea (`configSchema`, incluso si está vacío). Los bundles compatibles usan en su lugar sus propios manifiestos de bundle.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de bundle (`codex`, `claude` o `cursor`) junto con las capacidades de bundle detectadas.
</Note>

### Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea de forma predeterminada un plugin de herramienta TypeScript mínimo. El primer
argumento es el id del plugin; pasa `--name` para el nombre para mostrar. OpenClaw usa el
id para el directorio de salida predeterminado y la denominación del paquete. Los esqueletos de herramientas usan
`defineToolPlugin`.
`plugins build` importa la entrada compilada, lee sus metadatos estáticos de herramientas, escribe
`openclaw.plugin.json` y mantiene alineado `package.json` `openclaw.extensions`.
`plugins validate` comprueba que el manifiesto generado, los metadatos del paquete y la
exportación actual de la entrada sigan coincidiendo. Consulta [Plugins de herramientas](/es/plugins/tool-plugins) para
el flujo completo de creación de herramientas.

El esqueleto escribe código fuente TypeScript, pero genera metadatos desde la entrada compilada
`./dist/index.js`, por lo que el flujo también funciona con la CLI publicada. Usa
`--entry <path>` cuando la entrada no sea la entrada predeterminada del paquete. Usa
`plugins build --check` en CI para fallar cuando los metadatos generados estén obsoletos sin
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

Los esqueletos de proveedor crean un plugin genérico de proveedor de texto/modelos con
conexión de claves API compatible con OpenAI, un script integrado `npm run validate` para `clawhub package
validate`, metadatos de paquete de ClawHub y un flujo de trabajo de GitHub con ejecución manual
para publicación confiable futura mediante GitHub Actions OIDC. Los esqueletos de proveedor no
generan skills y no usan `openclaw plugins build` ni
`openclaw plugins validate`; esos comandos son para la ruta de metadatos generados
del esqueleto de herramientas.

Antes de publicar, reemplaza la URL base de API de marcador de posición, el catálogo de modelos, la ruta de documentación,
el texto de credenciales y el contenido del README por detalles reales del proveedor. Usa el
README generado para la primera publicación en ClawHub y la configuración de publicador confiable.

### Instalación

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Los mantenedores que prueben instalaciones durante la configuración pueden sobrescribir las fuentes automáticas de instalación de plugins
con variables de entorno protegidas. Consulta
[Sobrescrituras de instalación de plugins](/es/plugins/install-overrides).

<Warning>
Los nombres de paquete sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento, salvo que coincidan con un id oficial de plugin. Las especificaciones de paquete `@openclaw/*` sin procesar que coincidan con plugins incluidos usan la copia incluida que se distribuyó con la compilación actual de OpenClaw. Usa `npm:<package>` cuando quieras deliberadamente un paquete npm externo. Usa `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como ejecutar código. Prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub en busca de paquetes de plugins instalables e imprime
nombres de paquetes listos para instalar. Busca paquetes code-plugin y bundle-plugin,
no skills. Usa `openclaw skills search` para Skills de ClawHub.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de los plugins. Npm
sigue siendo una ruta de respaldo e instalación directa compatible. Los paquetes de plugins `@openclaw/*`
propiedad de OpenClaw vuelven a publicarse en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables usan `latest`.
Las instalaciones y actualizaciones del canal beta prefieren la etiqueta de distribución npm `beta` cuando esa etiqueta
está disponible y luego recurren a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuración y reparación de configuración no válida">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escribe en ese archivo incluido y deja `openclaw.json` sin cambios. Los includes raíz, los arrays de includes y los includes con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Includes de configuración](/es/gateway/configuration) para las formas compatibles.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma cerrada y te indica que ejecutes primero `openclaw doctor --fix`. Durante el inicio de Gateway y la recarga en caliente, la configuración de plugins no válida falla de forma cerrada como cualquier otra configuración no válida; `openclaw doctor --fix` puede poner en cuarentena la entrada de plugin no válida. La única excepción documentada en tiempo de instalación es una ruta estrecha de recuperación de plugins incluidos para plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalar frente a actualizar">
    `--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un plugin o paquete de hooks ya instalado. Úsalo cuando estés reinstalando intencionadamente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto npm. Para actualizaciones rutinarias de un plugin npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de plugin que ya está instalado, OpenClaw se detiene y te remite a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieras sobrescribir la instalación actual desde una fuente diferente.

  </Accordion>
  <Accordion title="Alcance de --pin">
    `--pin` se aplica solo a instalaciones npm. No es compatible con instalaciones `git:`; usa una referencia git explícita, como `git:github.com/acme/plugin@v1.2.3`, cuando quieras una fuente fijada. No es compatible con `--marketplace`, porque las instalaciones desde marketplace conservan metadatos de fuente de marketplace en lugar de una especificación npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto y ahora no hace nada. OpenClaw ya no ejecuta bloqueos integrados de código peligroso en tiempo de instalación para instalaciones de plugins.

    Usa la superficie compartida `security.installPolicy` propiedad del operador cuando se requiera una política de instalación específica del host. Los hooks `before_install` de plugins son hooks de ciclo de vida del runtime de plugins y no son el límite principal de política para instalaciones desde CLI.

    Si un plugin que publicaste en ClawHub está oculto o bloqueado por un análisis del registro, usa los pasos de publicador en [Publicación en ClawHub](/es/clawhub/publishing). `--dangerously-force-unsafe-install` no pide a ClawHub que vuelva a analizar el plugin ni que haga pública una versión bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Las instalaciones de ClawHub comunitario comprueban el registro de confianza de la versión seleccionada antes de descargar el paquete. Si ClawHub deshabilita la descarga de la versión, informa hallazgos de análisis maliciosos o pone la versión en un estado de moderación bloqueante como cuarentena, OpenClaw rechaza la versión. Para estados de análisis riesgosos no bloqueantes, estados de moderación riesgosos o motivos de registro, OpenClaw muestra los detalles de confianza y pide confirmación antes de continuar.

    Usa `--acknowledge-clawhub-risk` solo después de revisar la advertencia de ClawHub y decidir continuar sin un aviso interactivo. Los registros de confianza limpios pendientes u obsoletos advierten, pero no requieren reconocimiento. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidas de OpenClaw omiten este aviso de confianza de versión.

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para visibilidad de hooks filtrada y habilitación por hook, no para instalación de paquetes.

    Las especificaciones de npm son **solo de registro** (nombre del paquete + **versión exacta** opcional o **dist-tag**). Las especificaciones Git/URL/archivo y los rangos semver se rechazan. Las instalaciones de dependencias se ejecutan en un proyecto npm gestionado por Plugin con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene ajustes globales de instalación de npm. Los proyectos npm gestionados de Plugins heredan los `overrides` de npm a nivel de paquete de OpenClaw, por lo que las fijaciones de seguridad del host también se aplican a las dependencias elevadas de Plugins.

    Usa `npm:<package>` cuando quieras hacer explícita la resolución de npm. Las especificaciones de paquete simples también se instalan directamente desde npm durante el cambio de lanzamiento, salvo que coincidan con un id de Plugin oficial.

    Las especificaciones sin procesar de paquetes `@openclaw/*` que coinciden con Plugins incluidos se resuelven a la copia incluida propiedad de la imagen antes del fallback de npm. Por ejemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa el Plugin de Discord incluido de la compilación actual de OpenClaw en lugar de crear un override npm gestionado. Para forzar el paquete npm externo, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Las especificaciones simples y `@latest` permanecen en la pista estable. Las versiones de corrección con fecha de OpenClaw, como `2026.5.3-1`, son versiones estables para esta comprobación. Si npm resuelve cualquiera de esas a una versión preliminar, OpenClaw se detiene y te pide optar explícitamente con una etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

    Para instalaciones de npm sin una versión exacta (`npm:<package>` o `npm:<package>@latest`), OpenClaw comprueba los metadatos del paquete resuelto antes de instalar. Si el paquete estable más reciente requiere una API de Plugin de OpenClaw más nueva o una versión mínima del host más reciente, OpenClaw inspecciona versiones estables anteriores e instala en su lugar la versión compatible más reciente. Las versiones exactas y los dist-tags explícitos como `@beta` siguen siendo estrictos: si el paquete seleccionado es incompatible, el comando falla y te pide actualizar OpenClaw o elegir una versión compatible.

    Si una especificación de instalación simple coincide con un id de Plugin oficial (por ejemplo `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete npm con el mismo nombre, usa una especificación con ámbito explícita (por ejemplo `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio git. Las formas admitidas incluyen `git:github.com/owner/repo`, `git:owner/repo`, URL de clonación completas `https://`, `ssh://`, `git://`, `file://` y `git@host:owner/repo.git`. Agrega `@<ref>` o `#<ref>` para hacer checkout de una rama, etiqueta o commit antes de instalar.

    Las instalaciones Git clonan en un directorio temporal, hacen checkout de la referencia solicitada cuando está presente y luego usan el instalador normal de directorios de Plugins. Eso significa que la validación del manifiesto, la política de instalación del operador, el trabajo de instalación del gestor de paquetes y los registros de instalación se comportan como las instalaciones npm. Las instalaciones git registradas incluyen la URL/referencia de origen más el commit resuelto para que `openclaw plugins update` pueda volver a resolver el origen más tarde.

    Después de instalar desde git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime como métodos de Gateway y comandos de CLI. Si el Plugin registró una raíz de CLI con `api.registerCli`, ejecuta ese comando directamente a través de la CLI raíz de OpenClaw, por ejemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos">
    Archivos admitidos: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos nativos de Plugins de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz del Plugin extraído; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    Usa `npm-pack:<path.tgz>` cuando el archivo sea un tarball de npm-pack y quieras
    probar la misma ruta de proyecto npm gestionado por Plugin que usan las
    instalaciones de registro, incluida la verificación de `package-lock.json`,
    el escaneo de dependencias elevadas y los registros de instalación de npm.
    Las rutas de archivo simples todavía se instalan como archivos locales
    bajo la raíz de extensiones de Plugins.

    También se admiten instalaciones desde el marketplace de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Las especificaciones simples de Plugins seguras para npm se instalan desde npm de forma predeterminada durante el cambio de lanzamiento, salvo que coincidan con un id de Plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución solo de npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la compatibilidad anunciada de la API de Plugin / Gateway mínimo antes de instalar. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` de npm-pack versionado, verifica el encabezado de resumen de ClawHub y el resumen del artefacto, y luego lo instala mediante la ruta normal de archivo. Las versiones anteriores de ClawHub sin metadatos de ClawPack siguen instalándose mediante la ruta heredada de verificación de archivo de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, tipo de artefacto, integridad de npm, shasum de npm, nombre del tarball y datos de resumen de ClawPack para actualizaciones posteriores.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más nuevas de ClawHub; los selectores explícitos de versión o etiqueta como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta` permanecen fijados a ese selector.

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
    - un nombre de marketplace conocido de Claude de `~/.claude/plugins/known_marketplaces.json`
    - una raíz local de marketplace o una ruta `marketplace.json`
    - una abreviatura de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL git

  </Tab>
  <Tab title="Reglas de marketplace remoto">
    Para marketplaces remotos cargados desde GitHub o git, las entradas de Plugins deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta orígenes de ruta relativa desde ese repositorio y rechaza HTTP(S), rutas absolutas, git, GitHub y otros orígenes de Plugins que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas y archivos locales, OpenClaw detecta automáticamente:

- Plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Las instalaciones locales gestionadas deben ser directorios o archivos de Plugins. Los archivos de Plugin independientes `.js`,
`.mjs`, `.cjs` y `.ts` no se copian en la raíz de Plugins gestionada
mediante `plugins install`; inclúyelos explícitamente en `plugins.load.paths` en su lugar.

<Note>
Los paquetes compatibles se instalan en la raíz normal de Plugins y participan en el mismo flujo de lista/información/activación/desactivación. Hoy se admiten Skills de paquete, command-skills de Claude, valores predeterminados de `settings.json` de Claude, valores predeterminados de `.lsp.json` de Claude / `lspServers` declarados por manifiesto, command-skills de Cursor y directorios de hooks compatibles de Codex; otras capacidades de paquetes detectadas se muestran en diagnósticos/información, pero aún no están conectadas a la ejecución en runtime.
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
  Muestra solo los Plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Cambia de la vista de tabla a líneas de detalle por Plugin con metadatos de origen/procedencia/versión/activación.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina más diagnósticos de registro y estado de instalación de dependencias de paquetes.
</ParamField>

<Note>
`plugins list` lee primero el registro local persistido de Plugins, con un fallback derivado solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un Plugin está instalado, habilitado y visible para la planificación de arranque en frío, pero no es una prueba de runtime en vivo de un proceso Gateway ya en ejecución. Después de cambiar código de Plugin, habilitación, política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecute nuevo código `register(api)` o hooks. Para despliegues remotos/en contenedor, verifica que estés reiniciando el hijo real de `openclaw gateway run`, no solo un proceso envoltorio.

`plugins list --json` incluye el `dependencyStatus` de cada Plugin de `package.json`
`dependencies` y `optionalDependencies`. OpenClaw comprueba si esos nombres de
paquetes están presentes a lo largo de la ruta normal de búsqueda `node_modules`
de Node del Plugin; no importa código de runtime de Plugins, no ejecuta un gestor
de paquetes ni repara dependencias faltantes.
</Note>

Si los logs de arranque registran `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ejecuta `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con un id de Plugin listado para confirmar los
ids de Plugins y copiar los ids de confianza en `plugins.allow` en `openclaw.json`. Cuando la
advertencia puede listar cada Plugin descubierto, imprime un fragmento
`plugins.allow` listo para pegar que ya incluye esos ids. Si un Plugin se carga
sin procedencia de instalación/ruta de carga, inspecciona ese id de Plugin y luego fija
el id de confianza en `plugins.allow` o reinstala el Plugin desde un origen de confianza
para que OpenClaw registre la procedencia de instalación.

`plugins search` es una búsqueda remota en el catálogo de ClawHub. No inspecciona el estado
local, no muta la configuración, no instala paquetes ni carga código de runtime de Plugins. Los
resultados de búsqueda incluyen el nombre del paquete de ClawHub, familia, canal, versión, resumen y
una sugerencia de instalación como `openclaw plugins install clawhub:<package>`.

Para trabajo con Plugins incluidos dentro de una imagen Docker empaquetada, monta con bind el directorio
de origen del Plugin sobre la ruta de origen empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw descubrirá esa superposición de origen montada
antes de `/app/dist/extensions/synology-chat`; un directorio de origen copiado sin más
permanece inerte, de modo que las instalaciones empaquetadas normales siguen usando dist compilado.

Para depuración de hooks de runtime:

- `openclaw plugins inspect <id> --runtime --json` muestra hooks registrados y diagnósticos de un pase de inspección con módulo cargado. La inspección de runtime nunca instala dependencias; usa `openclaw doctor --fix` para limpiar estado heredado de dependencias o recuperar Plugins descargables faltantes referenciados por la configuración.
- `openclaw gateway status --deep --require-rpc` confirma la URL/perfil de Gateway alcanzable, indicios de servicio/proceso, ruta de configuración y salud de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local de Plugin (lo agrega a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Los archivos de Plugin independientes deben listarse en `plugins.load.paths` en lugar de
instalarse con `plugins install` o colocarse directamente en `~/.openclaw/extensions`
o `<workspace>/.openclaw/extensions`. Esas raíces descubiertas automáticamente cargan
paquetes de Plugins o directorios de paquetes, mientras que los archivos de script de nivel superior
se tratan como ayudantes locales y se omiten.

<Note>
Los plugins originados en un espacio de trabajo que se descubren desde una raíz de extensiones del espacio de trabajo no se
importan ni ejecutan hasta que se habilitan explícitamente. Para el desarrollo local,
ejecuta `openclaw plugins enable <plugin-id>` o establece
`plugins.entries.<plugin-id>.enabled: true`; si tu configuración usa
`plugins.allow`, incluye allí también el mismo id de plugin. Esta regla de fallo en modo cerrado
también se aplica cuando la configuración del canal apunta explícitamente a un plugin originado en el espacio de trabajo para
carga solo de configuración, de modo que el código de configuración del plugin de canal local no se ejecutará mientras ese
plugin del espacio de trabajo permanezca deshabilitado o excluido de la lista de permitidos. Las instalaciones vinculadas
y las entradas explícitas de `plugins.load.paths` siguen la política normal para su
origen de plugin resuelto. Consulta
[Configurar la política de plugins](/es/tools/plugin#configure-plugin-policy)
y [Referencia de configuración](/es/gateway/configuration-reference#plugins).

`--force` no es compatible con `--link` porque las instalaciones vinculadas reutilizan la ruta de origen en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice de plugins gestionados y mantener sin fijar el comportamiento predeterminado.
</Note>

### Índice de plugins

Los metadatos de instalación de plugins son estado gestionado por la máquina, no configuración de usuario. Las instalaciones y actualizaciones los escriben en la base de datos de estado SQLite compartida bajo el directorio de estado activo de OpenClaw. La fila `installed_plugin_index` almacena metadatos duraderos de `installRecords`, incluidos registros de manifiestos de plugin rotos o ausentes, además de una caché de registro en frío derivada del manifiesto que usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro de plugins en frío.

Cuando OpenClaw ve registros heredados publicados de `plugins.installs` en la configuración, las lecturas en tiempo de ejecución los tratan como entrada de compatibilidad sin reescribir `openclaw.json`. Las escrituras explícitas de plugins y `openclaw doctor --fix` mueven esos registros al índice de plugins y eliminan la clave de configuración cuando se permiten escrituras de configuración; si cualquiera de las escrituras falla, los registros de configuración se conservan para que no se pierdan los metadatos de instalación.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina registros de plugin de `plugins.entries`, del índice de plugins persistido, de las entradas de listas de permitidos/denegados de plugins y de las entradas vinculadas de `plugins.load.paths` cuando corresponde. A menos que se establezca `--keep-files`, la desinstalación también elimina el directorio de instalación gestionado rastreado cuando está dentro de la raíz de extensiones de plugins de OpenClaw. Para plugins de Active Memory, la ranura de memoria se restablece a `memory-core`.

<Note>
`--keep-config` se admite como alias obsoleto de `--keep-files`.
</Note>

### Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a instalaciones de plugins rastreadas en el índice de plugins gestionados y a instalaciones de paquetes de hooks rastreadas en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Cuando pasas un id de plugin, OpenClaw reutiliza la especificación de instalación registrada para ese plugin. Eso significa que los dist-tags almacenados previamente, como `@beta`, y las versiones exactas fijadas se siguen usando en ejecuciones posteriores de `update <id>`.

    Durante `update <id> --dry-run`, las instalaciones npm fijadas a una versión exacta permanecen fijadas. Si OpenClaw también puede resolver la línea predeterminada del registro del paquete y esa línea predeterminada es más reciente que la versión fijada instalada, la simulación informa la fijación e imprime el comando explícito de actualización de paquete `@latest` para seguir la línea predeterminada del registro.

    Esa regla de actualización dirigida es distinta de la ruta de mantenimiento masivo `openclaw plugins update --all`. Las actualizaciones masivas siguen respetando las especificaciones ordinarias de instalación rastreadas, pero los registros de plugins oficiales de confianza de OpenClaw pueden sincronizarse con el objetivo actual del catálogo oficial en lugar de permanecer en un paquete oficial exacto obsoleto. Usa `update <id>` dirigida cuando quieras mantener intencionalmente intacta una especificación oficial exacta o etiquetada.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con un dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de plugin rastreado, actualiza ese plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre del paquete npm sin versión ni etiqueta también resuelve de vuelta al registro de plugin rastreado. Usa esto cuando un plugin estaba fijado a una versión exacta y quieres devolverlo a la línea de lanzamiento predeterminada del registro.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update <id-or-npm-spec>` dirigido reutiliza la especificación de plugin rastreada a menos que pases una especificación nueva. `openclaw plugins update --all` masivo usa el `update.channel` configurado cuando sincroniza registros de plugins oficiales de confianza con el objetivo del catálogo oficial, de modo que las instalaciones del canal beta pueden permanecer en la línea de lanzamiento beta en lugar de normalizarse silenciosamente a estable/latest.

    `openclaw update` también conoce el canal de actualización activo de OpenClaw: en el canal beta, los registros de plugins npm de línea predeterminada y ClawHub prueban primero `@beta`. Vuelven a la especificación predeterminada/latest registrada si no existe una versión beta del plugin; los plugins npm también hacen fallback cuando el paquete beta existe pero falla la validación de instalación. Ese fallback se informa como advertencia y no hace fallar la actualización del núcleo. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector para actualizaciones dirigidas.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Antes de una actualización npm en vivo, OpenClaw verifica la versión del paquete instalado contra los metadatos del registro npm. Si la versión instalada y la identidad del artefacto registrada ya coinciden con el objetivo resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y el hash del artefacto obtenido cambia, OpenClaw lo trata como deriva de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real y pide confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan en modo cerrado a menos que el llamador proporcione una política explícita de continuación.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` también se acepta en `plugins update` por compatibilidad, pero está obsoleto y ya no cambia el comportamiento de actualización de plugins. `security.installPolicy` del operador todavía puede bloquear actualizaciones; los hooks `before_install` de plugins solo se aplican en procesos donde se cargan hooks de plugins.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Las actualizaciones de plugins respaldadas por ClawHub de la comunidad ejecutan la misma verificación de confianza de lanzamiento exacto que las instalaciones antes de descargar el paquete de reemplazo. Usa `--acknowledge-clawhub-risk` para automatización revisada que debe continuar cuando el lanzamiento seleccionado de ClawHub tenga una advertencia de confianza riesgosa. Los paquetes oficiales de ClawHub y las fuentes de plugins integradas de OpenClaw omiten esta solicitud de confianza del lanzamiento.
  </Accordion>
</AccordionGroup>

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect muestra identidad, estado de carga, origen, capacidades del manifiesto, banderas de política, diagnósticos, metadatos de instalación, capacidades del paquete y cualquier compatibilidad detectada con servidores MCP o LSP sin importar de forma predeterminada el tiempo de ejecución del plugin. La salida JSON incluye los contratos del manifiesto del plugin, como `contracts.agentToolResultMiddleware` y `contracts.trustedToolPolicies`, para que los operadores puedan auditar las declaraciones de superficies de confianza antes de habilitar o reiniciar un plugin. Añade `--runtime` para cargar el módulo del plugin e incluir hooks, herramientas, comandos, servicios, métodos de Gateway y rutas HTTP registrados. La inspección en tiempo de ejecución informa directamente dependencias de plugin ausentes; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos de CLI propiedad de plugins normalmente se instalan como grupos de comandos raíz de `openclaw`, pero los plugins también pueden registrar comandos anidados bajo un padre del núcleo como `openclaw nodes`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútalo en la ruta indicada; por ejemplo, un plugin que registra `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada plugin se clasifica por lo que realmente registra en tiempo de ejecución:

- **plain-capability** — un tipo de capacidad (p. ej., un plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (p. ej., texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capacidades

Consulta [Formas de plugins](/es/plugins/architecture#plugin-shapes) para más información sobre el modelo de capacidades.

<Note>
La bandera `--json` genera un informe legible por máquina adecuado para scripting y auditoría. `inspect --all` representa una tabla de toda la flota con columnas de forma, tipos de capacidades, avisos de compatibilidad, capacidades de paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de plugins, diagnósticos de manifiesto/descubrimiento, avisos de compatibilidad y referencias obsoletas de configuración de plugins, como ranuras de plugin ausentes. Cuando el árbol de instalación y la configuración de plugins están limpios, imprime `No plugin issues detected.` Si queda configuración obsoleta pero el árbol de instalación por lo demás está sano, el resumen lo indica en lugar de implicar salud completa de plugins.

Si un plugin configurado está presente en disco pero bloqueado por las comprobaciones de seguridad de rutas del cargador, la validación de configuración conserva la entrada del plugin y la informa como `present but blocked`. Corrige el diagnóstico precedente del plugin bloqueado, como la propiedad de la ruta o permisos de escritura globales, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para fallos de forma de módulo, como exportaciones `register`/`activate` ausentes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de exportaciones en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de plugins es el modelo de lectura en frío persistido de OpenClaw para identidad de plugins instalados, habilitación, metadatos de origen y propiedad de contribuciones. El arranque normal, la búsqueda de propietario de proveedor, la clasificación de configuración de canal y el inventario de plugins pueden leerlo sin importar módulos de tiempo de ejecución de plugins.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado u obsoleto. Usa `--refresh` para reconstruirlo desde el índice de plugins persistido, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

`openclaw doctor --fix` también repara deriva npm gestionada adyacente al registro: si un paquete `@openclaw/*` huérfano o recuperado bajo un proyecto npm de plugin gestionado o la raíz npm gestionada plana heredada oculta un plugin integrado, doctor elimina ese paquete obsoleto y reconstruye el registro para que el arranque valide contra el manifiesto integrado. Doctor también revincula el paquete host `openclaw` en plugins npm gestionados que declaran `peerDependencies.openclaw`, de modo que las importaciones de tiempo de ejecución locales del paquete, como `openclaw/plugin-sdk/*`, se resuelvan después de actualizaciones o reparaciones npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad de emergencia obsoleto para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; el fallback de entorno es solo para recuperación de arranque de emergencia mientras se despliega la migración.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

La lista del marketplace acepta una ruta de marketplace local, una ruta de `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de origen resuelta junto con el manifiesto de marketplace analizado y las entradas de plugin.

La actualización del marketplace carga un feed de marketplace alojado de OpenClaw y conserva la
respuesta validada como la instantánea local del feed alojado. Sin opciones, usa
el perfil de feed predeterminado configurado. Usa `--feed-profile <name>` para actualizar un
perfil configurado específico, `--feed-url <url>` para actualizar una URL explícita de
feed alojado, `--expected-sha256 <sha256>` para exigir una suma de verificación de carga útil coincidente
(`sha256:<hex>` o un resumen hexadecimal simple de 64 caracteres), y `--json` para
salida legible por máquina. Las URL explícitas de feed alojado no deben incluir
credenciales, cadenas de consulta ni fragmentos. Las actualizaciones sin fijar pueden informar un
resultado de instantánea alojada o de alternativa incluida sin hacer fallar el comando. Las actualizaciones
fijadas fallan a menos que acepten una carga útil alojada reciente, y las actualizaciones alojadas
correctas fallan si OpenClaw no puede conservar la instantánea validada.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Referencia de la CLI](/es/cli)
- [ClawHub](/es/clawhub)
