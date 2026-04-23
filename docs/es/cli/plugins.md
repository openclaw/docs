---
read_when:
    - Quieres instalar o administrar plugins del Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de plugins
summary: Referencia de la CLI para `openclaw plugins` (listar, instalar, marketplace, desinstalar, habilitar/deshabilitar, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T14:01:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Administra plugins del Gateway, paquetes de hooks y paquetes compatibles.

Relacionado:

- Sistema de plugins: [Plugins](/es/tools/plugin)
- Compatibilidad de paquetes: [Paquetes de plugins](/es/plugins/bundles)
- Manifiesto + esquema de plugins: [Manifiesto de Plugin](/es/plugins/manifest)
- Refuerzo de seguridad: [Seguridad](/es/gateway/security)

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

Los plugins integrados se incluyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo,
proveedores de modelos integrados, proveedores de voz integrados y el Plugin integrado de navegador);
otros requieren `plugins enable`.

Los plugins nativos de OpenClaw deben incluir `openclaw.plugin.json` con un esquema
JSON en línea (`configSchema`, incluso si está vacío). Los paquetes compatibles usan sus
propios manifiestos de paquete.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info
también muestra el subtipo de paquete (`codex`, `claude` o `cursor`) más las capacidades
detectadas del paquete.

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub primero, luego npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install <package> --force              # sobrescribe la instalación existente
openclaw plugins install <package> --pin                # fija la versión
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ruta local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explícito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Los nombres de paquetes sin prefijo se comprueban primero en ClawHub y luego en npm. Nota de seguridad:
trata la instalación de plugins como la ejecución de código. Prefiere versiones fijadas.

Si tu sección `plugins` está respaldada por un único `$include` de un solo archivo, `plugins install/update/enable/disable/uninstall` escriben en ese archivo incluido y dejan `openclaw.json` intacto. Los includes de raíz, los arreglos de includes y los includes con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Config includes](/es/gateway/configuration) para ver las formas admitidas.

Si la configuración no es válida, `plugins install` normalmente falla de forma cerrada y te indica que
ejecutes primero `openclaw doctor --fix`. La única excepción documentada es una ruta estrecha de
recuperación de Plugin integrado para plugins que optan explícitamente por
`openclaw.install.allowInvalidConfigRecovery`.

`--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un
Plugin o paquete de hooks ya instalado. Úsalo cuando estés reinstalando intencionalmente
el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto npm.
Para actualizaciones rutinarias de un Plugin npm ya rastreado, prefiere
`openclaw plugins update <id-or-npm-spec>`.

Si ejecutas `plugins install` para un id de Plugin que ya está instalado, OpenClaw
se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal,
o a `plugins install <package> --force` cuando realmente quieras sobrescribir
la instalación actual desde una fuente distinta.

`--pin` se aplica solo a instalaciones de npm. No es compatible con `--marketplace`,
porque las instalaciones desde marketplace conservan metadatos de la fuente del marketplace en lugar de una
especificación npm.

`--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos
en el escáner integrado de código peligroso. Permite que la instalación continúe incluso
cuando el escáner integrado informa hallazgos `critical`, pero **no**
omite los bloqueos de política del hook `before_install` del Plugin y **no** omite fallos
de análisis.

Esta bandera de CLI se aplica a los flujos de instalación/actualización de plugins. Las instalaciones
de dependencias de Skills respaldadas por Gateway usan la sobrescritura equivalente de solicitud
`dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo separado
de descarga/instalación de Skills desde ClawHub.

`plugins install` también es la superficie de instalación para paquetes de hooks que exponen
`openclaw.hooks` en `package.json`. Usa `openclaw hooks` para visibilidad filtrada de hooks
y habilitación por hook, no para instalación de paquetes.

Las especificaciones npm son **solo de registro** (nombre del paquete + **versión exacta** opcional o
**dist-tag**). Se rechazan especificaciones Git/URL/archivo y rangos semver. Las instalaciones
de dependencias se ejecutan con `--ignore-scripts` por seguridad.

Las especificaciones simples y `@latest` permanecen en la línea estable. Si npm resuelve cualquiera
de esas a una versión preliminar, OpenClaw se detiene y te pide que optes por ella explícitamente con una
etiqueta de preliminar como `@beta`/`@rc` o una versión preliminar exacta como
`@1.2.3-beta.4`.

Si una especificación de instalación simple coincide con el id de un Plugin integrado (por ejemplo `diffs`), OpenClaw
instala directamente el Plugin integrado. Para instalar un paquete npm con el mismo
nombre, usa una especificación explícita con alcance (por ejemplo `@scope/diffs`).

Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

También se admiten instalaciones desde el marketplace de Claude.

Las instalaciones desde ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ahora también prefiere ClawHub para especificaciones de plugins simples compatibles con npm. Solo
recurre a npm si ClawHub no tiene ese paquete o versión:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw descarga el archivo del paquete desde ClawHub, verifica la compatibilidad
anunciada de la API del Plugin / la compatibilidad mínima del Gateway, y luego lo instala mediante la
ruta normal de archivo. Las instalaciones registradas conservan sus metadatos de origen de ClawHub para futuras
actualizaciones.

Usa la abreviatura `plugin@marketplace` cuando el nombre del marketplace exista en la caché
del registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` cuando quieras pasar la fuente del marketplace explícitamente:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Las fuentes de marketplace pueden ser:

- un nombre de marketplace conocido de Claude desde `~/.claude/plugins/known_marketplaces.json`
- una raíz local de marketplace o una ruta `marketplace.json`
- una abreviatura de repositorio GitHub como `owner/repo`
- una URL de repositorio GitHub como `https://github.com/owner/repo`
- una URL git

Para marketplaces remotos cargados desde GitHub o git, las entradas de plugins deben permanecer
dentro del repositorio clonado del marketplace. OpenClaw acepta fuentes de rutas relativas desde
ese repositorio y rechaza fuentes de plugins HTTP(S), de ruta absoluta, git, GitHub y otras
fuentes que no sean rutas desde manifiestos remotos.

Para rutas locales y archivos, OpenClaw detecta automáticamente:

- plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado
  de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Los paquetes compatibles se instalan en la raíz normal de plugins y participan en
el mismo flujo de list/info/enable/disable. Actualmente, se admiten Skills de paquetes,
command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` /
`lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks
compatibles con Codex; otras capacidades detectadas del paquete se muestran en diagnóstico/info,
pero todavía no están conectadas a la ejecución en tiempo de ejecución.

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--enabled` para mostrar solo plugins cargados. Usa `--verbose` para pasar de la
vista de tabla a líneas detalladas por Plugin con metadatos de fuente/origen/versión/activación.
Usa `--json` para inventario legible por máquina más diagnósticos
del registro.

Usa `--link` para evitar copiar un directorio local (agrega a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la
ruta de origen en lugar de copiar sobre un destino de instalación administrado.

Usa `--pin` en instalaciones de npm para guardar la especificación exacta resuelta (`name@version`) en
`plugins.installs`, manteniendo el comportamiento predeterminado sin fijar.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina registros de plugins de `plugins.entries`, `plugins.installs`,
la lista de permitidos de plugins y las entradas enlazadas de `plugins.load.paths` cuando corresponda.
Para plugins de memoria activa, la ranura de memoria se restablece a `memory-core`.

De forma predeterminada, uninstall también elimina el directorio de instalación del Plugin bajo la
raíz de plugins del directorio de estado activo. Usa
`--keep-files` para conservar los archivos en disco.

`--keep-config` se admite como alias desaprobado de `--keep-files`.

### Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a las instalaciones rastreadas en `plugins.installs` y a las
instalaciones rastreadas de paquetes de hooks en `hooks.internal.installs`.

Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese
Plugin. Eso significa que las dist-tags almacenadas anteriormente, como `@beta`, y las versiones exactas fijadas
se siguen usando en ejecuciones posteriores de `update <id>`.

Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con una dist-tag
o versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro del Plugin rastreado,
actualiza ese Plugin instalado y registra la nueva especificación npm para futuras
actualizaciones basadas en id.

Pasar el nombre del paquete npm sin versión ni etiqueta también resuelve de vuelta al
registro del Plugin rastreado. Úsalo cuando un Plugin estaba fijado a una versión exacta y
quieres devolverlo a la línea de versión predeterminada del registro.

Antes de una actualización npm en vivo, OpenClaw verifica la versión instalada del paquete frente a
los metadatos del registro npm. Si la versión instalada y la identidad del artefacto registrado
ya coinciden con el destino resuelto, la actualización se omite sin
descargar, reinstalar ni reescribir `openclaw.json`.

Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido,
OpenClaw trata eso como una deriva del artefacto npm. El comando interactivo
`openclaw plugins update` imprime los hashes esperados y reales y pide
confirmación antes de continuar. Los ayudantes de actualización no interactivos fallan de forma cerrada
a menos que el llamador proporcione una política explícita de continuación.

`--dangerously-force-unsafe-install` también está disponible en `plugins update` como una
sobrescritura de emergencia para falsos positivos del análisis integrado de código peligroso durante
actualizaciones de plugins. Aun así, no omite los bloqueos de política `before_install` del Plugin
ni el bloqueo por fallos de análisis, y solo se aplica a actualizaciones de plugins, no a
actualizaciones de paquetes de hooks.

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspección profunda de un solo Plugin. Muestra identidad, estado de carga, origen,
capacidades registradas, hooks, herramientas, comandos, servicios, métodos del Gateway,
rutas HTTP, indicadores de política, diagnósticos, metadatos de instalación, capacidades del paquete
y cualquier compatibilidad detectada con servidores MCP o LSP.

Cada Plugin se clasifica por lo que realmente registra en tiempo de ejecución:

- **plain-capability** — un tipo de capacidad (por ejemplo, un Plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capacidades

Consulta [Formas de Plugin](/es/plugins/architecture#plugin-shapes) para más información sobre el modelo de capacidades.

La bandera `--json` genera un informe legible por máquina adecuado para scripts y
auditorías.

`inspect --all` muestra una tabla de toda la flota con columnas de forma, tipos de capacidad,
avisos de compatibilidad, capacidades de paquetes y resumen de hooks.

`info` es un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de plugins, diagnósticos de manifiesto/descubrimiento y
avisos de compatibilidad. Cuando todo está limpio, imprime `No plugin issues
detected.`

Para fallos de forma de módulo, como exportaciones `register`/`activate` ausentes, vuelve a ejecutar
con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de exportación en
la salida de diagnóstico.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista de marketplace acepta una ruta local de marketplace, una ruta `marketplace.json`, una
abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL git. `--json`
imprime la etiqueta de origen resuelta junto con el manifiesto de marketplace analizado y las
entradas de plugins.
