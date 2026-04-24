---
read_when:
    - Quieres instalar o gestionar Plugins de Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de Plugins
summary: Referencia de CLI para `openclaw plugins` (listar, instalar, marketplace, desinstalar, habilitar/deshabilitar, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-24T05:23:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gestiona Plugins de Gateway, paquetes de hooks y paquetes compatibles.

Relacionado:

- Sistema de Plugins: [Plugins](/es/tools/plugin)
- Compatibilidad de paquetes: [Paquetes de Plugins](/es/plugins/bundles)
- Manifiesto + esquema de Plugin: [Manifiesto de Plugin](/es/plugins/manifest)
- Endurecimiento de seguridad: [Seguridad](/es/gateway/security)

## Comandos

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Los Plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo,
proveedores de modelos incluidos, proveedores de voz incluidos y el Plugin de navegador
incluido); otros requieren `plugins enable`.

Los Plugins nativos de OpenClaw deben incluir `openclaw.plugin.json` con un esquema JSON
integrado (`configSchema`, incluso si está vacío). Los paquetes compatibles usan en su lugar
sus propios manifiestos de paquete.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info
también muestra el subtipo de paquete (`codex`, `claude` o `cursor`) además de las capacidades
del paquete detectadas.

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub primero, luego npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install <package> --force              # sobrescribe una instalación existente
openclaw plugins install <package> --pin                # fija la versión
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ruta local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explícito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Los nombres de paquete sin prefijo se comprueban primero en ClawHub y luego en npm. Nota de seguridad:
trata las instalaciones de Plugins como si ejecutarás código. Prefiere versiones fijadas.

Si tu sección `plugins` está respaldada por un único archivo `$include`, `plugins install/update/enable/disable/uninstall` escribe en ese archivo incluido y deja `openclaw.json` intacto. Los includes de raíz, arrays de includes e includes con sobrescrituras hermanas fallan de forma segura en lugar de aplanarse. Consulta [Config includes](/es/gateway/configuration) para ver los formatos compatibles.

Si la configuración no es válida, `plugins install` normalmente falla de forma segura y te indica que
ejecutes antes `openclaw doctor --fix`. La única excepción documentada es una ruta limitada de
recuperación de Plugins incluidos para Plugins que aceptan explícitamente
`openclaw.install.allowInvalidConfigRecovery`.

`--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un
Plugin o paquete de hooks ya instalado. Úsalo cuando quieras reinstalar intencionadamente
el mismo id desde una ruta local nueva, archivo, paquete de ClawHub o artefacto npm.
Para actualizaciones rutinarias de un Plugin npm ya registrado, prefiere
`openclaw plugins update <id-or-npm-spec>`.

Si ejecutas `plugins install` para un id de Plugin que ya está instalado, OpenClaw
se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal,
o a `plugins install <package> --force` cuando realmente quieras sobrescribir
la instalación actual desde otra fuente.

`--pin` solo se aplica a instalaciones npm. No es compatible con `--marketplace`,
porque las instalaciones desde marketplace conservan metadatos del origen del marketplace en lugar de una
especificación npm.

`--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos
en el escáner integrado de código peligroso. Permite que la instalación continúe incluso
cuando el escáner integrado informa hallazgos `critical`, pero **no**
omite los bloqueos de política del hook `before_install` del Plugin ni omite
los fallos de escaneo.

Este indicador de CLI se aplica a los flujos de instalación/actualización de Plugins. Las instalaciones de
dependencias de Skills respaldadas por Gateway usan la sobrescritura de solicitud equivalente
`dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo independiente
de descarga/instalación de Skills de ClawHub.

`plugins install` también es la superficie de instalación para paquetes de hooks que exponen
`openclaw.hooks` en `package.json`. Usa `openclaw hooks` para la visibilidad filtrada de hooks
y la habilitación por hook, no para la instalación del paquete.

Las especificaciones npm son **solo de registro** (nombre de paquete + **versión exacta** opcional o
**dist-tag**). Las especificaciones Git/URL/file y los rangos semver se rechazan. Las instalaciones de
dependencias se ejecutan con `--ignore-scripts` por seguridad.

Las especificaciones sin prefijo y `@latest` permanecen en la línea estable. Si npm resuelve
cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide que optes
explícitamente por ella con una etiqueta preliminar como `@beta`/`@rc` o una versión preliminar exacta
como `@1.2.3-beta.4`.

Si una especificación de instalación sin prefijo coincide con el id de un Plugin incluido (por ejemplo `diffs`), OpenClaw
instala directamente el Plugin incluido. Para instalar un paquete npm con el mismo
nombre, usa una especificación con alcance explícito (por ejemplo `@scope/diffs`).

Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

También se admiten instalaciones desde el marketplace de Claude.

Las instalaciones de ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ahora también prefiere ClawHub para especificaciones de Plugin sin prefijo compatibles con npm. Solo
recurre a npm si ClawHub no tiene ese paquete o versión:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw descarga el archivo del paquete desde ClawHub, comprueba la
compatibilidad anunciada con la API del Plugin / versión mínima del gateway, y luego lo instala a través de la ruta normal
de archivos. Las instalaciones registradas conservan sus metadatos de origen de ClawHub para actualizaciones posteriores.

Usa la forma abreviada `plugin@marketplace` cuando el nombre del marketplace exista en la
caché del registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

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

Los orígenes de marketplace pueden ser:

- un nombre de marketplace conocido por Claude de `~/.claude/plugins/known_marketplaces.json`
- una raíz local de marketplace o una ruta a `marketplace.json`
- una forma abreviada de repositorio GitHub como `owner/repo`
- una URL de repositorio GitHub como `https://github.com/owner/repo`
- una URL git

Para marketplaces remotos cargados desde GitHub o git, las entradas de Plugin deben permanecer
dentro del repositorio clonado del marketplace. OpenClaw acepta orígenes de ruta relativa desde
ese repositorio y rechaza orígenes de Plugin HTTP(S), de ruta absoluta, git, GitHub y otros orígenes
que no sean ruta desde manifiestos remotos.

Para rutas locales y archivos, OpenClaw detecta automáticamente:

- Plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado
  de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Los paquetes compatibles se instalan en la raíz normal de Plugins y participan en
el mismo flujo de list/info/enable/disable. Actualmente se admiten Skills de paquetes,
command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` /
`lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks compatibles
de Codex; otras capacidades de paquete detectadas se muestran en diagnósticos/info,
pero todavía no están integradas en la ejecución en tiempo de ejecución.

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--enabled` para mostrar solo los Plugins cargados. Usa `--verbose` para cambiar de la
vista de tabla a líneas de detalle por Plugin con metadatos de origen/procedencia/versión/activación. Usa `--json` para inventario legible por máquina más
diagnósticos del registro.

Usa `--link` para evitar copiar un directorio local (lo añade a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la
ruta de origen en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en
`plugins.installs` mientras mantienes el comportamiento predeterminado sin fijar.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina registros de Plugins de `plugins.entries`, `plugins.installs`,
la lista de permitidos de Plugins y las entradas enlazadas de `plugins.load.paths` cuando corresponda.
Para Plugins de memoria activos, la ranura de memoria se restablece a `memory-core`.

De forma predeterminada, desinstalar también elimina el directorio de instalación del Plugin bajo la
raíz de Plugins del directorio de estado activo. Usa
`--keep-files` para conservar los archivos en disco.

`--keep-config` se admite como alias obsoleto de `--keep-files`.

### Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a las instalaciones registradas en `plugins.installs` y a las instalaciones registradas
de paquetes de hooks en `hooks.internal.installs`.

Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese
Plugin. Eso significa que dist-tags almacenados previamente como `@beta` y versiones exactas fijadas
siguen utilizándose en ejecuciones posteriores de `update <id>`.

Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con una dist-tag
o versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro del Plugin
instalado, actualiza ese Plugin instalado y registra la nueva especificación npm para futuras
actualizaciones basadas en id.

Pasar el nombre del paquete npm sin versión ni etiqueta también resuelve de vuelta al
registro del Plugin instalado. Usa esto cuando un Plugin estaba fijado a una versión exacta y
quieres volver a la línea de versiones predeterminada del registro.

Antes de una actualización npm en vivo, OpenClaw compara la versión instalada del paquete con
los metadatos del registro npm. Si la versión instalada y la identidad del artefacto
registrado ya coinciden con el destino resuelto, la actualización se omite sin
descargar, reinstalar ni reescribir `openclaw.json`.

Cuando existe un hash de integridad almacenado y el hash del artefacto obtenido cambia,
OpenClaw trata esto como deriva del artefacto npm. El comando interactivo
`openclaw plugins update` imprime los hashes esperados y reales y solicita
confirmación antes de continuar. Los asistentes de actualización no interactivos fallan de forma segura
a menos que quien llama proporcione una política explícita de continuación.

`--dangerously-force-unsafe-install` también está disponible en `plugins update` como una
sobrescritura de emergencia para falsos positivos del escaneo integrado de código peligroso durante
actualizaciones de Plugins. Sigue sin omitir los bloques de política `before_install` de Plugins
ni el bloqueo por fallo de escaneo, y solo se aplica a actualizaciones de Plugins, no a actualizaciones
de paquetes de hooks.

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspección profunda de un solo Plugin. Muestra identidad, estado de carga, origen,
capacidades registradas, hooks, herramientas, comandos, servicios, métodos de gateway,
rutas HTTP, indicadores de política, diagnósticos, metadatos de instalación, capacidades de paquete
y cualquier compatibilidad MCP o servidor LSP detectada.

Cada Plugin se clasifica según lo que realmente registra en tiempo de ejecución:

- **plain-capability** — un tipo de capacidad (por ejemplo, un Plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios pero sin capacidades

Consulta [Formas de Plugins](/es/plugins/architecture#plugin-shapes) para más información sobre el modelo de capacidades.

El indicador `--json` genera un informe legible por máquina adecuado para scripts y
auditorías.

`inspect --all` renderiza una tabla de toda la flota con forma, tipos de capacidad,
avisos de compatibilidad, capacidades de paquete y columnas de resumen de hooks.

`info` es un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de Plugins, diagnósticos de manifiesto/detección y
avisos de compatibilidad. Cuando todo está correcto, imprime `No plugin issues
detected.`

Para fallos de forma de módulo, como exportaciones `register`/`activate` faltantes, vuelve a ejecutar
con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de las exportaciones en
la salida de diagnóstico.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista de marketplace acepta una ruta local de marketplace, una ruta a `marketplace.json`, una
forma abreviada de GitHub como `owner/repo`, una URL de repositorio GitHub o una URL git. `--json`
imprime la etiqueta de origen resuelta más el manifiesto de marketplace analizado y las
entradas de Plugin.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Crear Plugins](/es/plugins/building-plugins)
- [Plugins de la comunidad](/es/plugins/community)
