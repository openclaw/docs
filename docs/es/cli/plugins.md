---
read_when:
    - Quieres instalar o gestionar Plugins de Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de Plugins
sidebarTitle: Plugins
summary: Referencia de la CLI para `openclaw plugins` (listar, instalar, marketplace, desinstalar, habilitar/deshabilitar, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:26:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Gestiona Plugins de Gateway, paquetes de hooks y paquetes compatibles.

<CardGroup cols={2}>
  <Card title="Sistema de Plugins" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo instalar, habilitar y solucionar problemas de Plugins.
  </Card>
  <Card title="Paquetes de Plugins" href="/es/plugins/bundles">
    Modelo de compatibilidad de paquetes.
  </Card>
  <Card title="Manifiesto de Plugin" href="/es/plugins/manifest">
    Campos del manifiesto y esquema de configuración.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security">
    Refuerzo de seguridad para instalaciones de Plugins.
  </Card>
</CardGroup>

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
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
Los Plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el Plugin de navegador incluido); otros requieren `plugins enable`.

Los Plugins nativos de OpenClaw deben incluir `openclaw.plugin.json` con un esquema JSON inline (`configSchema`, incluso si está vacío). Los paquetes compatibles usan sus propios manifiestos de paquete en su lugar.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo de paquete (`codex`, `claude` o `cursor`) además de las capacidades detectadas del paquete.
</Note>

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub primero, después npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install <package> --force              # sobrescribe una instalación existente
openclaw plugins install <package> --pin                # fija la versión
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ruta local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explícito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Los nombres de paquete sin prefijo se comprueban primero en ClawHub y después en npm. Trata las instalaciones de Plugins como ejecución de código. Prefiere versiones fijadas.
</Warning>

<AccordionGroup>
  <Accordion title="Inclusiones de configuración y recuperación de configuración no válida">
    Si tu sección `plugins` está respaldada por un `$include` de archivo único, `plugins install/update/enable/disable/uninstall` escriben en ese archivo incluido y dejan `openclaw.json` intacto. Las inclusiones raíz, los arrays de inclusiones y las inclusiones con sobrescrituras hermanas fallan de forma segura en lugar de aplanarse. Consulta [Inclusiones de configuración](/es/gateway/configuration) para ver las estructuras compatibles.

    Si la configuración no es válida, `plugins install` normalmente falla de forma segura y te indica que primero ejecutes `openclaw doctor --fix`. La única excepción documentada es una ruta limitada de recuperación para Plugins incluidos que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force y reinstalar frente a actualizar">
    `--force` reutiliza el destino de instalación existente y sobrescribe en el lugar un Plugin o paquete de hooks ya instalado. Úsalo cuando quieras reinstalar intencionadamente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto npm. Para actualizaciones rutinarias de un Plugin npm ya registrado, prefiere `openclaw plugins update <id-or-npm-spec>`.

    Si ejecutas `plugins install` para un id de Plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieras sobrescribir la instalación actual desde una fuente diferente.

  </Accordion>
  <Accordion title="Ámbito de --pin">
    `--pin` se aplica solo a instalaciones npm. No es compatible con `--marketplace`, porque las instalaciones desde marketplace conservan metadatos del origen del marketplace en lugar de una especificación npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos en el escáner integrado de código peligroso. Permite que la instalación continúe incluso cuando el escáner integrado informa hallazgos `critical`, pero **no** omite los bloqueos de política de hooks `before_install` del Plugin ni **no** omite fallos del escaneo.

    Esta bandera de CLI se aplica a los flujos de instalación/actualización de Plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan la anulación equivalente de solicitud `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo independiente de descarga/instalación de Skills desde ClawHub.

  </Accordion>
  <Accordion title="Paquetes de hooks y especificaciones npm">
    `plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para la visibilidad filtrada de hooks y la habilitación por hook, no para la instalación de paquetes.

    Las especificaciones npm son **solo de registro** (nombre del paquete + **versión exacta** o **dist-tag** opcional). Las especificaciones Git/URL/archivo y los rangos semver se rechazan. Las instalaciones de dependencias se ejecutan localmente en el proyecto con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene ajustes globales de instalación npm.

    Las especificaciones simples y `@latest` permanecen en la rama estable. Si npm resuelve cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide optar explícitamente con una etiqueta preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

    Si una especificación simple de instalación coincide con el id de un Plugin incluido (por ejemplo `diffs`), OpenClaw instala directamente el Plugin incluido. Para instalar un paquete npm con el mismo nombre, usa una especificación con ámbito explícito (por ejemplo `@scope/diffs`).

  </Accordion>
  <Accordion title="Archivos">
    Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Los archivos de Plugins nativos de OpenClaw deben contener un `openclaw.plugin.json` válido en la raíz extraída del Plugin; los archivos que solo contienen `package.json` se rechazan antes de que OpenClaw escriba registros de instalación.

    También se admiten instalaciones desde el marketplace de Claude.

  </Accordion>
</AccordionGroup>

Las instalaciones desde ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ahora también prefiere ClawHub para especificaciones de Plugin simples compatibles con npm. Solo recurre a npm si ClawHub no tiene ese paquete o versión:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw descarga el archivo del paquete desde ClawHub, comprueba la compatibilidad anunciada de la API del Plugin / versión mínima del gateway, y luego lo instala a través de la ruta normal de archivos. Las instalaciones registradas conservan sus metadatos de origen de ClawHub para futuras actualizaciones.

#### Forma abreviada de marketplace

Usa la forma abreviada `plugin@marketplace` cuando el nombre del marketplace exista en la caché del registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` cuando quieras pasar explícitamente la fuente del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Fuentes de marketplace">
    - un nombre de marketplace conocido por Claude desde `~/.claude/plugins/known_marketplaces.json`
    - una raíz local de marketplace o una ruta a `marketplace.json`
    - una forma abreviada de repositorio GitHub como `owner/repo`
    - una URL de repositorio GitHub como `https://github.com/owner/repo`
    - una URL git

  </Tab>
  <Tab title="Reglas de marketplaces remotos">
    Para marketplaces remotos cargados desde GitHub o git, las entradas de Plugins deben permanecer dentro del repositorio clonado del marketplace. OpenClaw acepta fuentes de ruta relativa desde ese repositorio y rechaza fuentes de Plugins HTTP(S), rutas absolutas, git, GitHub y otras fuentes que no sean rutas desde manifiestos remotos.
  </Tab>
</Tabs>

Para rutas locales y archivos, OpenClaw detecta automáticamente:

- Plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o la estructura predeterminada de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

<Note>
Los paquetes compatibles se instalan en la raíz normal de Plugins y participan en el mismo flujo de listado/info/habilitar/deshabilitar. Actualmente se admiten bundle skills, command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` / `lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks compatibles de Codex; otras capacidades detectadas de paquetes se muestran en diagnósticos/info, pero todavía no están conectadas a la ejecución en tiempo de ejecución.
</Note>

### Listar

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
  Cambia de la vista de tabla a líneas de detalle por Plugin con metadatos de source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario legible por máquina más diagnósticos del registro.
</ParamField>

<Note>
`plugins list` lee primero el registro persistido de Plugins locales, con una reserva derivada solo del manifiesto cuando falta el registro o no es válido. Es útil para comprobar si un Plugin está instalado, habilitado y visible para la planificación de inicio en frío, pero no es una sonda en vivo del tiempo de ejecución de un proceso Gateway ya en ejecución. Después de cambiar el código del Plugin, su habilitación, la política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecuten nuevo código `register(api)` o hooks. Para despliegues remotos/en contenedores, verifica que estás reiniciando el proceso hijo real `openclaw gateway run`, no solo un proceso contenedor.
</Note>

Para trabajar con Plugins incluidos dentro de una imagen Docker empaquetada, monta con bind el directorio fuente del Plugin sobre la ruta fuente empaquetada correspondiente, como
`/app/extensions/synology-chat`. OpenClaw descubrirá esa superposición de fuente montada antes que `/app/dist/extensions/synology-chat`; un directorio fuente simplemente copiado permanece inerte, por lo que las instalaciones empaquetadas normales siguen usando el dist compilado.

Para depuración de hooks en tiempo de ejecución:

- `openclaw plugins inspect <id> --json` muestra hooks registrados y diagnósticos de una pasada de inspección con módulo cargado.
- `openclaw gateway status --deep --require-rpc` confirma el Gateway accesible, indicios de servicio/proceso, ruta de configuración y estado de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local (lo añade a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la ruta fuente en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones npm para guardar la especificación exacta resuelta (`name@version`) en el índice gestionado de Plugins, manteniendo el comportamiento predeterminado sin fijar.
</Note>

### Índice de Plugins

Los metadatos de instalación de Plugins son estado gestionado por la máquina, no configuración del usuario. Las instalaciones y actualizaciones los escriben en `plugins/installs.json` dentro del directorio de estado activo de OpenClaw. Su mapa de nivel superior `installRecords` es la fuente duradera de los metadatos de instalación, incluidos los registros de manifiestos de Plugins dañados o ausentes. El array `plugins` es la caché del registro en frío derivada del manifiesto. El archivo incluye una advertencia de no editar y lo usan `openclaw plugins update`, la desinstalación, los diagnósticos y el registro en frío de Plugins.

Cuando OpenClaw detecta registros heredados enviados en `plugins.installs` dentro de la configuración, los mueve al índice de Plugins y elimina la clave de configuración; si falla cualquiera de las escrituras, los registros de configuración se conservan para que no se pierdan los metadatos de instalación.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina los registros del Plugin de `plugins.entries`, del índice persistido de Plugins, de las entradas de listas permitidas/denegadas del Plugin y de las entradas enlazadas de `plugins.load.paths` cuando corresponde. A menos que se establezca `--keep-files`, la desinstalación también elimina el directorio de instalación gestionado rastreado cuando está dentro de la raíz de extensiones de Plugins de OpenClaw. Para los Plugins de memoria activa, la ranura de memoria se restablece a `memory-core`.

<Note>
`--keep-config` se admite como alias obsoleto de `--keep-files`.
</Note>

### Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a las instalaciones rastreadas de Plugins en el índice gestionado de Plugins y a las instalaciones rastreadas de paquetes de hooks en `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de Plugin frente a especificación npm">
    Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese Plugin. Eso significa que dist-tags almacenadas previamente como `@beta` y versiones exactas fijadas siguen utilizándose en ejecuciones posteriores de `update <id>`.

    Para instalaciones npm, también puedes pasar una especificación explícita de paquete npm con una dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro rastreado del Plugin, actualiza ese Plugin instalado y registra la nueva especificación npm para futuras actualizaciones basadas en id.

    Pasar el nombre del paquete npm sin versión ni etiqueta también se resuelve de vuelta al registro rastreado del Plugin. Usa esto cuando un Plugin se fijó a una versión exacta y quieras devolverlo a la línea de lanzamiento predeterminada del registro.

  </Accordion>
  <Accordion title="Comprobaciones de versión y deriva de integridad">
    Antes de una actualización npm en vivo, OpenClaw comprueba la versión del paquete instalado frente a los metadatos del registro npm. Si la versión instalada y la identidad del artefacto registrada ya coinciden con el objetivo resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

    Cuando existe un hash de integridad almacenado y cambia el hash del artefacto recuperado, OpenClaw trata eso como deriva del artefacto npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real y pide confirmación antes de continuar. Los asistentes de actualización no interactivos fallan de forma segura salvo que quien llama proporcione una política explícita de continuación.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install en actualización">
    `--dangerously-force-unsafe-install` también está disponible en `plugins update` como anulación de emergencia para falsos positivos del escaneo integrado de código peligroso durante actualizaciones de Plugins. Aun así, no omite los bloqueos de política `before_install` del Plugin ni el bloqueo por fallo de escaneo, y solo se aplica a actualizaciones de Plugins, no a actualizaciones de paquetes de hooks.
  </Accordion>
</AccordionGroup>

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspección profunda de un solo Plugin. Muestra identidad, estado de carga, origen, capacidades registradas, hooks, herramientas, comandos, servicios, métodos de Gateway, rutas HTTP, indicadores de política, diagnósticos, metadatos de instalación, capacidades del paquete y cualquier compatibilidad detectada con servidores MCP o LSP.

Cada Plugin se clasifica según lo que realmente registra en tiempo de ejecución:

- **plain-capability** — un tipo de capacidad (por ejemplo, un Plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capacidades

Consulta [Formas de Plugin](/es/plugins/architecture#plugin-shapes) para obtener más información sobre el modelo de capacidades.

<Note>
La bandera `--json` genera un informe legible por máquina adecuado para scripting y auditoría. `inspect --all` renderiza una tabla de todo el conjunto con columnas de forma, tipos de capacidad, avisos de compatibilidad, capacidades del paquete y resumen de hooks. `info` es un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de Plugins, diagnósticos de manifiesto/detección y avisos de compatibilidad. Cuando todo está limpio, imprime `No plugin issues detected.`

Para fallos de forma del módulo, como exportaciones `register`/`activate` ausentes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de exportación en la salida de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

El registro local de Plugins es el modelo persistido de lectura en frío de OpenClaw para la identidad del Plugin instalado, su habilitación, metadatos de origen y propiedad de contribuciones. El inicio normal, la búsqueda del propietario del proveedor, la clasificación de configuración de canales y el inventario de Plugins pueden leerlo sin importar módulos de tiempo de ejecución de Plugins.

Usa `plugins registry` para inspeccionar si el registro persistido está presente, actualizado o desfasado. Usa `--refresh` para reconstruirlo a partir del índice persistido de Plugins, la política de configuración y los metadatos de manifiesto/paquete. Esta es una ruta de reparación, no una ruta de activación en tiempo de ejecución.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` es un interruptor de compatibilidad obsoleto de emergencia para fallos de lectura del registro. Prefiere `plugins registry --refresh` o `openclaw doctor --fix`; la alternativa con variable de entorno es solo para recuperación de arranque de emergencia mientras se despliega la migración.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista de marketplace acepta una ruta local de marketplace, una ruta a `marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio GitHub o una URL git. `--json` imprime la etiqueta de origen resuelta junto con el manifiesto de marketplace analizado y las entradas de Plugins.

## Relacionado

- [Crear Plugins](/es/plugins/building-plugins)
- [Referencia de CLI](/es/cli)
- [Plugins de la comunidad](/es/plugins/community)
