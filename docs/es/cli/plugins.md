---
read_when:
    - Quieres instalar o gestionar plugins de Gateway o paquetes compatibles
    - Desea crear la estructura inicial o validar un Plugin de herramienta simple
    - Quieres depurar fallos de carga de plugins
sidebarTitle: Plugins
summary: Referencia de la CLI para `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-28T22:33:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Gestiona plugins de Gateway, paquetes de hooks y paquetes compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de Plugin" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo instalar, habilitar y solucionar problemas de plugins.
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

Para investigar instalaciones, inspecciones, desinstalaciones o actualizaciones de registro lentas, ejecuta el
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traza escribe los tiempos de fase
en stderr y mantiene la salida JSON analizable. Consulta [Depuración](/es/help/debugging#plugin-lifecycle-trace).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), los mutadores del ciclo de vida de plugins están deshabilitados. Usa la fuente de Nix para esta instalación en lugar de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` o `plugins disable`; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en agentes.
</Note>

<Note>
Los plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el Plugin de navegador incluido); otros requieren `plugins enable`.

Los plugins nativos de OpenClaw deben distribuir `openclaw.plugin.json` con un esquema JSON en línea (`configSchema`, incluso si está vacío). Los paquetes compatibles usan en su lugar sus propios manifiestos de paquete.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de paquete (`codex`, `claude` o `cursor`) y las capacidades de paquete detectadas.
</Note>

### Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea de forma predeterminada un Plugin de herramienta TypeScript mínimo. El primer
argumento es el id del Plugin; pasa `--name` para el nombre visible. OpenClaw usa el
id para el directorio de salida predeterminado y el nombre del paquete. Los andamiajes de herramientas usan
`defineToolPlugin`.
`plugins build` importa la entrada compilada, lee sus metadatos estáticos de herramienta, escribe
`openclaw.plugin.json` y mantiene alineado `openclaw.extensions` de `package.json`.
`plugins validate` comprueba que el manifiesto generado, los metadatos del paquete y
la exportación de entrada actual sigan coincidiendo. Consulta [Plugins de herramienta](/es/plugins/tool-plugins) para
el flujo completo de creación de herramientas.

El andamiaje escribe código fuente TypeScript, pero genera metadatos desde la entrada compilada
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

Los andamiajes de proveedor crean un Plugin genérico de proveedor de texto/modelos con cableado de
clave de API compatible con OpenAI, un script integrado `npm run validate` para `clawhub package
validate`, metadatos de paquete de ClawHub y un flujo de trabajo de GitHub despachado manualmente
para publicación confiable futura mediante GitHub Actions OIDC. Los andamiajes de proveedor no
generan Skills y no usan `openclaw plugins build` ni
`openclaw plugins validate`; esos comandos son para la ruta de metadatos generados
del andamiaje de herramientas.

Antes de publicar, reemplaza la URL base de API de marcador de posición, el catálogo de modelos, la ruta de documentación,
el texto de credenciales y el texto del README por detalles reales del proveedor. Usa el
README generado para la primera publicación en ClawHub y la configuración de publicador confiable.

### Instalar

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

Los mantenedores que prueban instalaciones durante la configuración pueden anular las fuentes automáticas de instalación de plugins
con variables de entorno protegidas. Consulta
[Anulaciones de instalación de Plugin](/es/plugins/install-overrides).

<Warning>
Durante la transición de lanzamiento, los nombres de paquete sin prefijo se instalan desde npm de forma predeterminada, salvo que coincidan con un id de Plugin oficial. Las especificaciones de paquete `@openclaw/*` sin procesar que coincidan con plugins incluidos usan la copia incluida que se distribuyó con la compilación actual de OpenClaw. Usa `npm:<package>` cuando quieras deliberadamente un paquete externo de npm. Usa `clawhub:<package>` para ClawHub. Trata las instalaciones de plugins como ejecutar código. Prefiere versiones fijadas.
</Warning>

`plugins search` consulta ClawHub en busca de paquetes de Plugin instalables e imprime
nombres de paquete listos para instalar. Busca paquetes code-plugin y bundle-plugin,
no Skills. Usa `openclaw skills search` para Skills de ClawHub.

<Note>
ClawHub es la superficie principal de distribución y descubrimiento para la mayoría de plugins. Npm
sigue siendo una alternativa compatible y una ruta de instalación directa. Los paquetes de Plugin
`@openclaw/*` propiedad de OpenClaw se publican de nuevo en npm; consulta la lista actual
en [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o el
[inventario de plugins](/es/plugins/plugin-inventory). Las instalaciones estables usan `latest`.
Las instalaciones y actualizaciones del canal beta prefieren la etiqueta de distribución `beta` de npm cuando esa etiqueta
está disponible y luego recurren a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuración y reparación de configuración no válida">
    Si tu sección `plugins` está respaldada por un `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escribe en ese archivo incluido y deja `openclaw.json` intacto. Los includes raíz, los arrays de includes y los includes con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Includes de configuración](/es/gateway/configuration) para las formas admitidas.

    Si la configuración no es válida durante la instalación, `plugins install` normalmente falla de forma cerrada y te indica que ejecutes primero `openclaw doctor --fix`. Durante el inicio de Gateway y la recarga en caliente, la configuración de Plugin no válida falla de forma cerrada como cualquier otra configuración no válida; `openclaw doctor --fix` puede poner en cuarentena la entrada de Plugin no válida. La única excepción documentada en tiempo de instalación es una ruta limitada de recuperación de plugins incluidos para plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalar frente a actualizar">
    `--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un Plugin o paquete de hooks ya instalado. Úsalo cuando reinstales intencionalmente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto npm. Para actualizaciones rutinarias de un Plugin npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de Plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieras sobrescribir la instalación actual desde una fuente distinta.

  </Accordion>
  <Accordion title="Alcance de --pin">
    `--pin` se aplica solo a instalaciones npm. No es compatible con instalaciones `git:`; usa una ref de git explícita como `git:github.com/acme/plugin@v1.2.3` cuando quieras una fuente fijada. No es compatible con `--marketplace`, porque las instalaciones de marketplace conservan metadatos de fuente de marketplace en lugar de una especificación npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto y ahora no hace nada. OpenClaw ya no ejecuta bloqueo integrado de código peligroso en tiempo de instalación para instalaciones de plugins.

    Usa la superficie compartida `security.installPolicy` propiedad del operador cuando se requiera una política de instalación específica del host. Los hooks `before_install` de Plugin son hooks de ciclo de vida del runtime de Plugin y no son el límite principal de política para instalaciones de CLI.

    Si un Plugin que publicaste en ClawHub está oculto o bloqueado por un escaneo del registro, usa los pasos de publicador en [Publicación en ClawHub](/es/clawhub/publishing). `--dangerously-force-unsafe-install` no pide a ClawHub que vuelva a escanear el Plugin ni que haga pública una versión bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Las instalaciones comunitarias de ClawHub comprueban el registro de confianza de la versión seleccionada antes de descargar el paquete. Si ClawHub deshabilita la descarga de la versión, informa hallazgos de escaneo malicioso o pone la versión en un estado de moderación bloqueante como cuarentena, OpenClaw rechaza la versión. Para estados de escaneo riesgosos no bloqueantes, estados de moderación riesgosos o motivos de registro, OpenClaw muestra los detalles de confianza y pide confirmación antes de continuar.

    Usa `--acknowledge-clawhub-risk` solo después de revisar la advertencia de ClawHub y decidir continuar sin un prompt interactivo. Los registros de confianza limpios pendientes u obsoletos advierten, pero no requieren confirmación. Los paquetes oficiales de ClawHub y las fuentes de Plugin incluidas en OpenClaw omiten este prompt de confianza de versión.

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para visibilidad filtrada de hooks y habilitación por hook, no para instalación de paquetes.

    Las especificaciones de npm son **solo de registro** (nombre del paquete + **versión exacta** opcional o **dist-tag**). Se rechazan las especificaciones Git/URL/archivo y los rangos semver. Las instalaciones de dependencias se ejecutan en un proyecto npm administrado por plugin con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene ajustes globales de instalación de npm. Los proyectos npm de plugins administrados heredan los `overrides` de npm a nivel de paquete de OpenClaw, por lo que los pines de seguridad del host también se aplican a las dependencias de plugins elevadas.

    Usa `npm:<package>` cuando quieras hacer explícita la resolución de npm. Las especificaciones de paquetes sin prefijo también se instalan directamente desde npm durante la transición de lanzamiento, a menos que coincidan con un id de plugin oficial.

    Las especificaciones de paquete `@openclaw/*` sin procesar que coinciden con plugins incluidos resuelven a la copia incluida propiedad de la imagen antes de recurrir a npm. Por ejemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa el plugin Discord incluido de la compilación actual de OpenClaw en lugar de crear una sustitución npm administrada. Para forzar el paquete npm externo, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Las especificaciones sin prefijo y `@latest` permanecen en la pista estable. Las versiones de corrección con fecha de OpenClaw, como `2026.5.3-1`, son versiones estables para esta comprobación. Si npm resuelve cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente con una etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

    Para instalaciones npm sin una versión exacta (`npm:<package>` o `npm:<package>@latest`), OpenClaw comprueba los metadatos del paquete resuelto antes de instalar. Si el paquete estable más reciente requiere una API de plugin de OpenClaw más nueva o una versión mínima de host más reciente, OpenClaw inspecciona versiones estables anteriores e instala en su lugar la versión compatible más reciente. Las versiones exactas y los dist-tags explícitos como `@beta` siguen siendo estrictos: si el paquete seleccionado es incompatible, el comando falla y te pide actualizar OpenClaw o elegir una versión compatible.

    Si una especificación de instalación sin prefijo coincide con un id de plugin oficial (por ejemplo, `diffs`), OpenClaw instala directamente la entrada del catálogo. Para instalar un paquete npm con el mismo nombre, usa una especificación con ámbito explícito (por ejemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositorios Git">
    Usa `git:<repo>` para instalar directamente desde un repositorio git. Las formas admitidas incluyen `git:github.com/owner/repo`, `git:owner/repo`, direcciones URL de clonación completas `https://`, `ssh://`, `git://`, `file://` y `git@host:owner/repo.git`. Agrega `@<ref>` o `#<ref>` para hacer checkout de una rama, etiqueta o commit antes de instalar.

    Las instalaciones Git clonan en un directorio temporal, hacen checkout de la ref solicitada cuando está presente y luego usan el instalador normal de directorios de plugins. Eso significa que la validación de manifiesto, la política de instalación del operador, el trabajo de instalación del gestor de paquetes y los registros de instalación se comportan como las instalaciones npm. Las instalaciones git registradas incluyen la URL/ref de origen más el commit resuelto para que `openclaw plugins update` pueda volver a resolver el origen más adelante.

    Después de instalar desde git, usa `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime como métodos de gateway y comandos CLI. Si el plugin registró una raíz CLI con `api.registerCli`, ejecuta ese comando directamente a través de la CLI raíz de OpenClaw, por ejemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivos">
    Archivos admitidos: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos nativos de plugins de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz del plugin extraído; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    Usa `npm-pack:<path.tgz>` cuando el archivo sea un tarball npm-pack y quieras
    probar la misma ruta de proyecto npm administrado por plugin usada por las
    instalaciones desde registro, incluida la verificación de `package-lock.json`,
    el escaneo de dependencias elevadas y los registros de instalación npm. Las
    rutas de archivo simples siguen instalándose como archivos locales bajo la
    raíz de extensiones de plugins.

    También se admiten instalaciones del marketplace de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Las especificaciones de plugins seguras para npm sin prefijo se instalan desde npm de forma predeterminada durante la transición de lanzamiento, a menos que coincidan con un id de plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` para hacer explícita la resolución solo por npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw comprueba la compatibilidad anunciada de la API de plugin / Gateway mínimo antes de instalar. Cuando la versión seleccionada de ClawHub publica un artefacto ClawPack, OpenClaw descarga el `.tgz` npm-pack versionado, verifica el encabezado de resumen de ClawHub y el resumen del artefacto, y luego lo instala a través de la ruta de archivo normal. Las versiones anteriores de ClawHub sin metadatos ClawPack siguen instalándose a través de la ruta heredada de verificación de archivos de paquete. Las instalaciones registradas conservan sus metadatos de origen de ClawHub, el tipo de artefacto, la integridad npm, el shasum npm, el nombre del tarball y los datos de resumen de ClawPack para actualizaciones posteriores.
Las instalaciones de ClawHub sin versión conservan una especificación registrada sin versión para que `openclaw plugins update` pueda seguir versiones más recientes de ClawHub; los selectores explícitos de versión o etiqueta como `clawhub:pkg@1.2.3` y `clawhub:pkg@beta` permanecen fijados a ese selector.

#### Abreviatura del marketplace

Usa la abreviatura `plugin@marketplace` cuando el nombre del marketplace exista en la caché local de registro de Claude en `~/.claude/plugins/known_marketplaces.json`:

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
    - una raíz de marketplace local o ruta `marketplace.json`
    - una abreviatura de repositorio de GitHub como `owner/repo`
    - una URL de repositorio de GitHub como `https://github.com/owner/repo`
    - una URL git

  </Tab>
  <Tab title="Reglas de marketplace remoto">
    Para marketplaces remotos cargados desde GitHub o git, las entradas de plugins deben permanecer dentro del repositorio de marketplace clonado. OpenClaw acepta orígenes de ruta relativa desde ese repositorio y rechaza HTTP(S), rutas absolutas, git, GitHub y otros orígenes de plugins que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas locales y archivos, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Las instalaciones locales administradas deben ser directorios o archivos de
plugins. Los archivos de plugin independientes `.js`, `.mjs`, `.cjs` y `.ts` no
se copian en la raíz de plugins administrada mediante `plugins install`; enuméralos
explícitamente en `plugins.load.paths` en su lugar.

<Note>
Los paquetes compatibles se instalan en la raíz normal de plugins y participan en el mismo flujo de list/info/enable/disable. Hoy se admiten Skills de paquete, command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` / `lspServers` declarados en manifiesto, command-skills de Cursor y directorios de hooks compatibles de Codex; otras capacidades de paquete detectadas se muestran en diagnósticos/info, pero todavía no están conectadas a la ejecución en runtime.
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
`plugins list` lee primero el registro local persistido de plugins, con un fallback derivado solo del manifiesto cuando el registro falta o no es válido. Es útil para comprobar si un plugin está instalado, habilitado y visible para la planificación de arranque en frío, pero no es una sonda de runtime en vivo de un proceso Gateway ya en ejecución. Después de cambiar código de plugin, habilitación, política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve al canal antes de esperar que se ejecuten el nuevo código `register(api)` o los hooks. Para despliegues remotos/en contenedor, verifica que estás reiniciando el hijo real `openclaw gateway run`, no solo un proceso envoltorio.

`plugins list --json` incluye el `dependencyStatus` de cada plugin desde
`dependencies` y `optionalDependencies` de `package.json`. OpenClaw comprueba si
esos nombres de paquete están presentes a lo largo de la ruta normal de búsqueda
`node_modules` de Node del plugin; no importa código de runtime del plugin,
ejecuta un gestor de paquetes ni repara dependencias faltantes.
</Note>

Si los logs de inicio muestran `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ejecuta `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con un id de plugin listado para confirmar los
ids de plugins y copiar ids de confianza en `plugins.allow` en `openclaw.json`. Cuando la
advertencia puede listar todos los plugins descubiertos, imprime un fragmento
`plugins.allow` listo para pegar que ya incluye esos ids. Si un plugin se carga
sin procedencia de instalación/ruta de carga, inspecciona ese id de plugin y luego fija
el id de confianza en `plugins.allow` o reinstala el plugin desde un origen de confianza
para que OpenClaw registre la procedencia de instalación.

`plugins search` es una consulta remota al catálogo de ClawHub. No inspecciona el
estado local, modifica config, instala paquetes ni carga código de runtime de
plugins. Los resultados de búsqueda incluyen el nombre de paquete de ClawHub, familia,
canal, versión, resumen y una sugerencia de instalación como `openclaw plugins install clawhub:<package>`.

Para trabajo en plugins incluidos dentro de una imagen Docker empaquetada, monta con bind
el directorio de origen del plugin sobre la ruta de origen empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw descubrirá esa superposición de origen montada
antes de `/app/dist/extensions/synology-chat`; un directorio de origen simplemente copiado
permanece inerte para que las instalaciones empaquetadas normales sigan usando el dist compilado.

Para depurar hooks de runtime:

- `openclaw plugins inspect <id> --runtime --json` muestra hooks registrados y diagnósticos de una pasada de inspección con módulo cargado. La inspección de runtime nunca instala dependencias; usa `openclaw doctor --fix` para limpiar estado heredado de dependencias o recuperar plugins descargables faltantes referenciados por la config.
- `openclaw gateway status --deep --require-rpc` confirma la URL/perfil de Gateway alcanzable, indicios de servicio/proceso, ruta de config y salud RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local de plugin (se agrega a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Los archivos de plugin independientes deben enumerarse en `plugins.load.paths` en lugar de
instalarse con `plugins install` o colocarse directamente en `~/.openclaw/extensions`
o `<workspace>/.openclaw/extensions`. Esas raíces autodetectadas cargan directorios de
paquete o paquete compatible de plugin, mientras que los archivos de script de nivel superior se tratan como
helpers locales y se omiten.

<Note>
Los Plugins de origen de espacio de trabajo descubiertos desde una raíz de extensiones del espacio de trabajo no se
importan ni ejecutan hasta que se habilitan explícitamente. Para desarrollo local,
ejecuta `openclaw plugins enable <plugin-id>` o configura
`plugins.entries.<plugin-id>.enabled: true`; si tu configuración usa
`plugins.allow`, incluye allí también el mismo id de Plugin. Esta regla de cierre seguro
también se aplica cuando la configuración de canal apunta explícitamente a un Plugin de origen de espacio de trabajo para
carga solo de configuración, por lo que el código de configuración de Plugin de canal local no se ejecutará mientras ese
Plugin de espacio de trabajo permanezca deshabilitado o excluido de la lista de permitidos. Las instalaciones enlazadas
y las entradas explícitas de `plugins.load.paths` siguen la política normal para su
origen de Plugin resuelto. Consulta
[Configurar la política de Plugin](/es/tools/plugin#configure-plugin-policy)
y [Referencia de configuración](/es/gateway/configuration-reference#plugins).

`--force` no se admite con `--link` porque las instalaciones enlazadas reutilizan la ruta de origen en lugar de copiar sobre un destino de instalación administrado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice de Plugin administrado mientras se conserva el comportamiento predeterminado sin fijar.
</Note>

### Índice de Plugin

Los metadatos de instalación de Plugin son estado administrado por la máquina, no configuración de usuario. Las instalaciones y actualizaciones los escriben en la base de datos de estado SQLite compartida bajo el directorio de estado activo de OpenClaw. La fila `installed_plugin_index` almacena metadatos duraderos de `installRecords`, incluidos registros de manifiestos de Plugin rotos o faltantes, además de una caché de registro en frío derivada del manifiesto usada por `openclaw plugins update`, la desinstalación, los diagnósticos y el registro de Plugin en frío.

Cuando OpenClaw detecta registros heredados distribuidos de `plugins.installs` en la configuración, las lecturas en tiempo de ejecución los tratan como entrada de compatibilidad sin reescribir `openclaw.json`. Las escrituras explícitas de Plugin y `openclaw doctor --fix` trasladan esos registros al índice de Plugin y eliminan la clave de configuración cuando se permiten escrituras de configuración; si alguna escritura falla, los registros de configuración se conservan para que no se pierdan los metadatos de instalación.

### Desinstalación

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina los registros de Plugin de `plugins.entries`, el índice de Plugin persistido, las entradas de lista de permitidos/denegados de Plugin y las entradas enlazadas de `plugins.load.paths` cuando corresponda. A menos que se configure `--keep-files`, la desinstalación también elimina el directorio de instalación administrado rastreado cuando está dentro de la raíz de extensiones de Plugin de OpenClaw. Para Plugins de Active Memory, la ranura de memoria se restablece a `memory-core`.

<Note>
`--keep-config` se admite como alias obsoleto de `--keep-files`.
</Note>

### Actualización

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a instalaciones de Plugin rastreadas en el índice de Plugin administrado y a instalaciones de paquetes de hooks rastreadas en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de Plugin frente a especificación npm">
    Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese Plugin. Eso significa que las dist-tags almacenadas previamente, como `@beta`, y las versiones exactas fijadas siguen usándose en ejecuciones posteriores de `update <id>`.

    Durante `update <id> --dry-run`, las instalaciones npm exactas fijadas permanecen fijadas. Si OpenClaw también puede resolver la línea predeterminada del registro del paquete y esa línea predeterminada es más reciente que la versión fijada instalada, la ejecución de prueba informa la fijación e imprime el comando explícito de actualización de paquete `@latest` para seguir la línea predeterminada del registro.

    Esa regla de actualización dirigida es diferente de la ruta de mantenimiento masiva `openclaw plugins update --all`. Las actualizaciones masivas siguen respetando las especificaciones ordinarias de instalación rastreadas, pero los registros de Plugin oficiales de confianza de OpenClaw pueden sincronizarse con el destino actual del catálogo oficial en lugar de permanecer en un paquete oficial exacto obsoleto. Usa `update <id>` dirigida cuando quieras conservar intencionalmente intacta una especificación oficial exacta o etiquetada.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con una dist-tag o versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de Plugin rastreado, actualiza ese Plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre del paquete npm sin versión ni etiqueta también se resuelve de vuelta al registro de Plugin rastreado. Usa esto cuando un Plugin se haya fijado a una versión exacta y quieras devolverlo a la línea de publicación predeterminada del registro.

  </Accordion>
  <Accordion title="Actualizaciones del canal beta">
    `openclaw plugins update <id-or-npm-spec>` dirigida reutiliza la especificación de Plugin rastreada salvo que pases una nueva especificación. `openclaw plugins update --all` masiva usa el `update.channel` configurado cuando sincroniza registros de Plugin oficiales de confianza con el destino del catálogo oficial, por lo que las instalaciones del canal beta pueden permanecer en la línea de publicación beta en lugar de normalizarse silenciosamente a estable/latest.

    `openclaw update` también conoce el canal de actualización activo de OpenClaw: en el canal beta, los registros de Plugin npm de línea predeterminada y ClawHub prueban primero `@beta`. Retroceden a la especificación predeterminada/latest registrada si no existe una publicación beta del Plugin; los Plugins npm también retroceden cuando el paquete beta existe pero falla la validación de instalación. Ese retroceso se informa como advertencia y no hace fallar la actualización del núcleo. Las versiones exactas y las etiquetas explícitas permanecen fijadas a ese selector para actualizaciones dirigidas.

  </Accordion>
  <Accordion title="Comprobaciones de versión y desviación de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado contra los metadatos del registro npm. Si la versión instalada y la identidad de artefacto registrada ya coinciden con el destino resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y el hash del artefacto obtenido cambia, OpenClaw lo trata como desviación de artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real y solicita confirmación antes de continuar. Los ayudantes de actualización no interactivos cierran de forma segura salvo que el llamador proporcione una política de continuación explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en update">
    `--dangerously-force-unsafe-install` también se acepta en `plugins update` por compatibilidad, pero está obsoleto y ya no cambia el comportamiento de actualización de Plugin. `security.installPolicy` del operador todavía puede bloquear actualizaciones; los hooks `before_install` de Plugin solo se aplican en procesos donde se cargan hooks de Plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk en update">
    Las actualizaciones de Plugin respaldadas por ClawHub comunitario ejecutan la misma comprobación de confianza de publicación exacta que las instalaciones antes de descargar el paquete de reemplazo. Usa `--acknowledge-clawhub-risk` para automatización revisada que debe continuar cuando la publicación seleccionada de ClawHub tiene una advertencia de confianza riesgosa. Los paquetes oficiales de ClawHub y las fuentes de Plugin de OpenClaw incluidas omiten este aviso de confianza de publicación.
  </Accordion>
</AccordionGroup>

### Inspección

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect muestra identidad, estado de carga, origen, capacidades del manifiesto, indicadores de política, diagnósticos, metadatos de instalación, capacidades de paquete y cualquier soporte detectado de servidor MCP o LSP sin importar el tiempo de ejecución del Plugin de forma predeterminada. La salida JSON incluye los contratos del manifiesto de Plugin, como `contracts.agentToolResultMiddleware` y `contracts.trustedToolPolicies`, para que los operadores puedan auditar declaraciones de superficies de confianza antes de habilitar o reiniciar un Plugin. Añade `--runtime` para cargar el módulo del Plugin e incluir hooks, herramientas, comandos, servicios, métodos de Gateway y rutas HTTP registrados. La inspección de tiempo de ejecución informa directamente las dependencias de Plugin faltantes; las instalaciones y reparaciones permanecen en `openclaw plugins install`, `openclaw plugins update` y `openclaw doctor --fix`.

Los comandos CLI propiedad de Plugin normalmente se instalan como grupos de comandos raíz de `openclaw`, pero los Plugins también pueden registrar comandos anidados bajo un padre del núcleo como `openclaw nodes`. Después de que `inspect --runtime` muestre un comando bajo `cliCommands`, ejecútalo en la ruta indicada; por ejemplo, un Plugin que registra `demo-git` puede verificarse con `openclaw demo-git ping`.

Cada Plugin se clasifica según lo que registra realmente en tiempo de ejecución:

- **plain-capability** — un tipo de capacidad (por ejemplo, un Plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios pero sin capacidades

Consulta [Formas de Plugin](/es/plugins/architecture#plugin-shapes) para más información sobre el modelo de capacidades.

<Note>
El indicador `--json` genera un informe legible por máquina adecuado para scripting y auditoría. `inspect --all` muestra una tabla de toda la flota con columnas de forma, tipos de capacidad, avisos de compatibilidad, capacidades de paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de Plugin, diagnósticos de manifiesto/descubrimiento, avisos de compatibilidad y referencias obsoletas de configuración de Plugin, como ranuras de Plugin faltantes. Cuando el árbol de instalación y la configuración de Plugin están limpios, imprime `No plugin issues detected.` Si queda configuración obsoleta pero el árbol de instalación está sano por lo demás, el resumen lo indica en lugar de insinuar salud completa de Plugin.

Si un Plugin configurado está presente en disco pero bloqueado por las comprobaciones de seguridad de ruta del cargador, la validación de configuración conserva la entrada del Plugin y la informa como `present but blocked`. Corrige el diagnóstico anterior de Plugin bloqueado, como propiedad de ruta o permisos de escritura mundial, en lugar de eliminar la configuración `plugins.entries.<id>` o `plugins.allow`.

Para fallos de forma de módulo, como exportaciones `register`/`activate` faltantes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de forma de exportación en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro de Plugin local es el modelo de lectura en frío persistido de OpenClaw para identidad de Plugin instalado, habilitación, metadatos de origen y propiedad de contribuciones. El arranque normal, la búsqueda de propietario de proveedor, la clasificación de configuración de canal y el inventario de Plugin pueden leerlo sin importar módulos de tiempo de ejecución de Plugin.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado u obsoleto. Usa `--refresh` para reconstruirlo a partir del índice de Plugin persistido, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

`openclaw doctor --fix` también repara desviación npm administrada adyacente al registro: si un paquete `@openclaw/*` huérfano o recuperado bajo un proyecto npm de Plugin administrado o la raíz npm administrada plana heredada oculta un Plugin incluido, doctor elimina ese paquete obsoleto y reconstruye el registro para que el arranque valide contra el manifiesto incluido. Doctor también vuelve a enlazar el paquete host `openclaw` en Plugins npm administrados que declaran `peerDependencies.openclaw`, para que las importaciones de tiempo de ejecución locales al paquete, como `openclaw/plugin-sdk/*`, se resuelvan después de actualizaciones o reparaciones npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad de emergencia obsoleto para fallos de lectura del registro. Prefiere `plugins registry --refresh` u `openclaw doctor --fix`; el retroceso por variable de entorno es solo para recuperación de arranque de emergencia mientras se despliega la migración.
</Warning>

### Marketplace

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

`plugins marketplace entries` enumera las entradas del feed configurado del marketplace de OpenClaw. De forma predeterminada, intenta usar el feed alojado y recurre a la instantánea aceptada más reciente o a los datos incluidos. Usa `--feed-profile <name>` para leer un perfil configurado específico, `--feed-url <url>` para leer una URL explícita de feed alojado y `--offline` para leer la instantánea aceptada más reciente sin obtener el feed.

`plugins marketplace refresh` actualiza la instantánea configurada del feed alojado e informa si OpenClaw aceptó datos alojados, una instantánea alojada o datos incluidos como alternativa. Usa `--expected-sha256` cuando un llamador necesite que el comando falle a menos que una carga útil alojada nueva coincida con una suma de comprobación fijada.

Marketplace `list` acepta una ruta de marketplace local, una ruta de `marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta de origen resuelta junto con el manifiesto de marketplace analizado y las entradas de plugins.

La actualización de Marketplace carga un feed de marketplace alojado de OpenClaw y conserva la
respuesta validada como la instantánea local del feed alojado. Sin opciones, usa
el perfil de feed predeterminado configurado. Usa `--feed-profile <name>` para actualizar un
perfil configurado específico, `--feed-url <url>` para actualizar una URL explícita de feed
alojado, `--expected-sha256 <sha256>` para exigir una suma de verificación de carga útil coincidente
(`sha256:<hex>` o un resumen hexadecimal simple de 64 caracteres), y `--json` para una salida
legible por máquina. Las URL explícitas de feeds alojados no deben incluir
credenciales, cadenas de consulta ni fragmentos. Las actualizaciones sin fijar pueden informar un
resultado de instantánea alojada o de reserva incluida sin que el comando falle. Las actualizaciones
fijadas fallan a menos que acepten una carga útil alojada reciente, y las actualizaciones alojadas
correctas fallan si OpenClaw no puede conservar la instantánea validada.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Referencia de la CLI](/es/cli)
- [ClawHub](/es/clawhub)
