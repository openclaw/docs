---
doc-schema-version: 1
read_when:
    - Se desea explorar, instalar, habilitar o deshabilitar plugins en la interfaz de control
    - Quieres ejemplos rápidos para listar, instalar, actualizar, inspeccionar o desinstalar plugins
    - Quiere elegir una fuente de instalación de plugins
    - Quiere la referencia adecuada para publicar paquetes de plugins
sidebarTitle: Manage plugins
summary: Gestiona los plugins de OpenClaw desde la interfaz de control o la CLI
title: Gestionar plugins
x-i18n:
    generated_at: "2026-07-14T13:57:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: dde533c089aba2d4df0a595a6b463437b6a58af821a246f96a9fbb5afdadf593
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La interfaz de control abarca el flujo de trabajo habitual de descubrimiento,
instalación, activación y desactivación. La CLI añade actualización, desinstalación,
configuración avanzada y controles explícitos de la fuente de instalación. Para consultar
el contrato completo de comandos, las opciones, las reglas de selección de fuentes
y los casos límite, véase [`openclaw plugins`](/es/cli/plugins).

Flujo de trabajo típico de la CLI: buscar un paquete, instalarlo desde ClawHub, npm, git
o una ruta local, permitir que el Gateway administrado se reinicie automáticamente
(o reiniciarlo manualmente) y, a continuación, verificar los registros de ejecución
del plugin.

## Usar la interfaz de control

Abra **Plugins** en la interfaz de control o use `/settings/plugins` en relación con la
ruta base configurada de la interfaz de control. Por ejemplo, una ruta base
`/openclaw` usa `/openclaw/settings/plugins`. La página tiene dos pestañas:

- **Instalados** muestra el inventario local completo agrupado por categoría (canales,
  proveedores de modelos, memoria y herramientas). Cada fila abre una vista detallada;
  su menú de opciones adicionales (`…`) permite activar o desactivar el
  plugin y, en el caso de los plugins instalados externamente, ofrece **Eliminar**.
  La pestaña también muestra los [servidores MCP](/es/cli/mcp) configurados con las mismas
  acciones de activación, desactivación y eliminación mediante menús, y edita
  `mcp.servers` en la configuración del Gateway.
- **Descubrir** es la tienda: plugins destacados incluidos con OpenClaw, plugins
  externos oficiales y una selección curada de conectores. Las tarjetas de conectores
  añaden un servidor MCP alojado con un solo clic (GitHub, Notion, Linear, Sentry,
  Home Assistant) o abren una búsqueda de ClawHub precompletada. Al escribir en el
  cuadro de búsqueda, se consulta [ClawHub](https://clawhub.ai/plugins) directamente
  y se añade una sección **Desde ClawHub** con recuentos de descargas e insignias de
  verificación de la fuente.

Los plugins incluidos no necesitan que se instale ningún paquete. La acción de su menú
es **Activar** o **Desactivar**. Workboard, por ejemplo, se incluye con OpenClaw y está
desactivado de forma predeterminada, por lo que debe elegir **Activar** para habilitarlo.
Los plugins integrados no se pueden eliminar, solo desactivar.

El acceso al catálogo y a la búsqueda requiere `operator.read`. La instalación,
activación, desactivación, eliminación y los cambios en servidores MCP requieren
`operator.admin`. El Gateway realiza las instalaciones desde ClawHub y conserva sus
comprobaciones de confianza, integridad y políticas de instalación de plugins. Cuando
un administrador activa un plugin instalado, también registra esa confianza explícita
añadiendo el plugin seleccionado a una lista restrictiva existente
`plugins.allow`. Una entrada explícita `plugins.deny` sigue siendo la autoridad
y debe eliminarse antes de activar el plugin.

La instalación o eliminación del código de un plugin requiere reiniciar el Gateway.
Los cambios de activación pueden aplicarse sin reiniciar cuando el plugin instalado
y el entorno de ejecución actual del Gateway lo permiten; de lo contrario, la interfaz
indica que es necesario reiniciar. Los conectores MCP basados en OAuth aún requieren
una ejecución única de `openclaw mcp login <name>` desde la CLI después de añadirlos.

La interfaz de control no instala desde fuentes npm, git o rutas locales arbitrarias,
no actualiza plugins ni expone una configuración avanzada de plugins. Use los flujos
de trabajo de la CLI que aparecen a continuación para realizar esas operaciones.

## Enumerar y buscar plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` para scripts:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` es una comprobación del inventario en frío: indica lo que OpenClaw
puede descubrir a partir de la configuración, los manifiestos y el registro persistente
de plugins. No demuestra que un Gateway que ya está en ejecución haya importado el
entorno de ejecución del plugin. La salida JSON incluye diagnósticos del registro y
el `dependencyStatus` de cada plugin (si los elementos declarados
`dependencies`/`optionalDependencies` se resuelven en el disco).

`plugins search` consulta en ClawHub los paquetes de plugins que se pueden instalar
y muestra una sugerencia de instalación (`openclaw plugins install clawhub:<package>`) para cada resultado.

## Activar y desactivar plugins

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Cambia la entrada de configuración de un plugin sin modificar los archivos instalados.
Algunos plugins integrados (proveedores integrados de modelos y voz, y el plugin de
navegador integrado) están activados de forma predeterminada; otros requieren
`enable` después de la instalación.

## Instalar plugins

```bash
# Buscar paquetes de plugins en ClawHub.
openclaw plugins search "calendar"

# Instalar desde ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Instalar desde npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Instalar desde un artefacto local de npm pack.
openclaw plugins install npm-pack:<path.tgz>

# Instalar desde git o desde una copia de desarrollo local.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Durante la transición del lanzamiento, las especificaciones de paquetes sin prefijo
se instalan desde npm, salvo que el nombre coincida con el identificador de un plugin
integrado u oficial, en cuyo caso OpenClaw utiliza esa copia local u oficial. Use
`clawhub:`, `npm:`, `git:` o
`npm-pack:` para seleccionar la fuente de forma determinista.

Use `--force` únicamente para sobrescribir un destino de instalación existente
con una fuente distinta. Para las actualizaciones habituales de una instalación
registrada de npm, ClawHub o hook-pack, use `openclaw plugins update`; `--force`
no es compatible con `--link`.

## Reiniciar e inspeccionar

Un Gateway administrado en ejecución con la recarga de configuración activada se
reinicia automáticamente después de instalar, actualizar o desinstalar el código de
un plugin. Si el Gateway no está administrado o la recarga está desactivada, reinícielo
manualmente antes de comprobar las superficies de ejecución activas:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carga el módulo del plugin y demuestra que ha registrado superficies
de ejecución (herramientas, hooks, servicios, métodos del Gateway, rutas HTTP y comandos
de la CLI pertenecientes al plugin). `inspect` y `list` sin
opciones adicionales solo realizan comprobaciones en frío del manifiesto, la
configuración y el registro.

## Actualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Al proporcionar el identificador de un plugin, se reutiliza su especificación de
instalación registrada: las etiquetas de distribución almacenadas
(`@beta`) y las versiones exactas fijadas se conservan en ejecuciones
posteriores de `update <plugin-id>`.

`openclaw plugins update --all` es la ruta de mantenimiento masivo. Sigue respetando las
especificaciones habituales de instalación registradas, pero los registros de plugins
oficiales de OpenClaw de confianza se sincronizan con el destino actual del catálogo
oficial en lugar de permanecer fijados a un paquete oficial exacto y obsoleto; cuando
`update.channel` es `beta`, esa sincronización da preferencia a la línea
de versiones beta. Use una ejecución dirigida de `update <plugin-id>` para conservar
sin cambios una especificación oficial exacta o etiquetada.

Para las instalaciones de npm, proporcione una especificación de paquete explícita
para cambiar el registro:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

El segundo comando devuelve un plugin a la línea de versiones predeterminada del
registro cuando anteriormente estaba fijado a una versión o etiqueta exacta.

Consulte [`openclaw plugins`](/es/cli/plugins#update) para conocer las reglas exactas
de mecanismos alternativos y fijación de versiones.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La desinstalación elimina la entrada de configuración del plugin, el registro persistente
del índice de plugins, las entradas de las listas de permitidos y denegados, y las entradas
`plugins.load.paths` vinculadas cuando corresponda. El directorio de instalación
administrado se elimina, salvo que se proporcione `--keep-files`. Un Gateway
administrado en ejecución se reinicia automáticamente cuando la desinstalación cambia
la fuente del plugin.

En el modo Nix (`OPENCLAW_NIX_MODE=1`), la instalación, actualización, desinstalación,
activación y desactivación de plugins están deshabilitadas; gestione esas opciones
en el código fuente de Nix correspondiente a la instalación.

## Elegir una fuente

| Fuente      | Usar cuando                                                                  | Ejemplo                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Se desea descubrimiento nativo de OpenClaw, resúmenes de análisis, versiones y sugerencias | `openclaw plugins install clawhub:<package>`                   |
| git         | Se desea una rama, etiqueta o confirmación de un repositorio                | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local  | Se está desarrollando o probando un plugin en la misma máquina              | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Se está instalando un plugin de marketplace compatible con Claude           | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Se está verificando un artefacto de paquete local mediante la semántica de instalación de npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Ya se distribuyen paquetes JavaScript o se necesitan etiquetas de distribución de npm o un registro privado | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Las instalaciones administradas desde rutas locales deben ser directorios o archivos
de plugins. Coloque los archivos de plugins independientes en `plugins.load.paths` en
lugar de instalarlos con `plugins install`.

## Publicar plugins

ClawHub es la principal superficie pública de descubrimiento de plugins de OpenClaw.
Publique allí cuando desee que los usuarios encuentren los metadatos del plugin, el
historial de versiones, los resultados de análisis del registro y las sugerencias de
instalación antes de instalarlo.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Los plugins nativos de npm deben incluir un manifiesto de plugin
(`openclaw.plugin.json`) y metadatos `package.json` antes de publicarse:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Use estas páginas para consultar el contrato completo de publicación en lugar de
considerar esta página como referencia de publicación:

- [Publicación en ClawHub](/es/clawhub/publishing) explica los propietarios,
  ámbitos, lanzamientos, revisiones, validación de paquetes y transferencia de paquetes.
- [Creación de plugins](/es/plugins/building-plugins) muestra la estructura
  completa de un paquete de plugin (incluido `openclaw.plugin.json`) y el flujo de trabajo
  de la primera publicación.
- [Manifiesto de plugin](/es/plugins/manifest) define los campos del
  manifiesto nativo de un plugin.

Si el mismo paquete está disponible tanto en ClawHub como en npm, use el prefijo
explícito `clawhub:` o `npm:` para forzar una fuente concreta.

## Relacionado

- [Plugins](/es/tools/plugin) - instalar, configurar, reiniciar y solucionar problemas
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de la CLI
- [Plugins de la comunidad](/es/plugins/community) - descubrimiento público y publicación en ClawHub
- [ClawHub](/es/clawhub/cli) - operaciones de la CLI del registro
- [Creación de plugins](/es/plugins/building-plugins) - crear un paquete de plugin
- [Manifiesto de plugin](/es/plugins/manifest) - manifiesto y metadatos del paquete
