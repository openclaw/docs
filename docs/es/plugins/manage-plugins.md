---
doc-schema-version: 1
read_when:
    - Quieres explorar, instalar, habilitar o deshabilitar plugins en la interfaz de control
    - Quieres ejemplos rápidos para listar, instalar, actualizar, inspeccionar o desinstalar plugins.
    - Quieres elegir una fuente de instalación de plugins
    - Quieres la referencia adecuada para publicar paquetes de plugins
sidebarTitle: Manage plugins
summary: Gestiona los plugins de OpenClaw desde la interfaz de control o la CLI
title: Gestionar plugins
x-i18n:
    generated_at: "2026-07-11T23:18:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La interfaz de control cubre el flujo de trabajo habitual de detección, instalación, activación y desactivación. La CLI añade actualización, desinstalación, configuración avanzada y controles explícitos de la fuente de instalación. Para consultar el contrato completo de sus comandos, las opciones, las reglas de selección de fuentes y los casos límite, consulta [`openclaw plugins`](/es/cli/plugins).

Flujo de trabajo típico de la CLI: busca un paquete, instálalo desde ClawHub, npm, git o una ruta local, deja que el Gateway administrado se reinicie automáticamente (o reinícialo manualmente) y, a continuación, verifica los registros en tiempo de ejecución del plugin.

## Usar la interfaz de control

Abre **Plugins** en la interfaz de control o usa `/settings/plugins` en relación con la ruta base configurada de la interfaz de control. Por ejemplo, una ruta base `/openclaw` usa `/openclaw/settings/plugins`. La página tiene dos pestañas:

- **Instalados** muestra el inventario local completo agrupado por categoría (canales, proveedores de modelos, memoria y herramientas). Cada fila abre una vista detallada; su menú adicional (`…`) activa o desactiva el plugin y, para los plugins instalados externamente, ofrece **Eliminar**. La pestaña también muestra los [servidores MCP](/es/cli/mcp) configurados con las mismas acciones de menú para activar, desactivar y eliminar, mediante la edición de `mcp.servers` en la configuración del Gateway.
- **Descubrir** es la tienda: plugins destacados incluidos con OpenClaw, plugins externos oficiales y una selección de conectores. Las tarjetas de conectores permiten añadir con un solo clic un servidor MCP alojado (GitHub, Notion, Linear, Sentry, Home Assistant) o abrir una búsqueda de ClawHub con datos rellenados previamente. Al escribir en el cuadro de búsqueda, se consulta [ClawHub](https://clawhub.ai/plugins) en la misma página y se añade una sección **Desde ClawHub** con recuentos de descargas e insignias de verificación de la fuente.

Los plugins incluidos no necesitan que se instale ningún paquete. La acción de su menú es **Activar** o **Desactivar**. Workboard, por ejemplo, se incluye con OpenClaw y está desactivado de forma predeterminada, por lo que debes elegir **Activar** para habilitarlo. Los plugins integrados no se pueden eliminar, solo desactivar.

El acceso al catálogo y a la búsqueda requiere `operator.read`. La instalación, activación, desactivación, eliminación y los cambios en servidores MCP requieren `operator.admin`. El Gateway realiza las instalaciones desde ClawHub y conserva sus comprobaciones de confianza, integridad y políticas de instalación de plugins.

Instalar o eliminar el código de un plugin requiere reiniciar el Gateway. Los cambios de activación pueden aplicarse sin reiniciar cuando el plugin instalado y el entorno de ejecución actual del Gateway lo admiten; de lo contrario, la interfaz indica que es necesario reiniciar. Los conectores MCP respaldados por OAuth siguen necesitando ejecutar una vez `openclaw mcp login <name>` desde la CLI después de añadirlos.

La interfaz de control no permite instalar desde fuentes arbitrarias de npm, git o rutas locales, actualizar plugins ni acceder a una configuración avanzada de plugins. Usa los siguientes flujos de trabajo de la CLI para esas operaciones.

## Mostrar y buscar plugins

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

`plugins list` es una comprobación de inventario en frío: muestra lo que OpenClaw puede detectar a partir de la configuración, los manifiestos y el registro persistente de plugins. No demuestra que un Gateway que ya esté en ejecución haya importado el entorno de ejecución del plugin. La salida JSON incluye diagnósticos del registro y el valor `dependencyStatus` de cada plugin, que indica si las `dependencies`/`optionalDependencies` declaradas se resuelven en el disco.

`plugins search` consulta en ClawHub los paquetes de plugins instalables y muestra una sugerencia de instalación (`openclaw plugins install clawhub:<package>`) para cada resultado.

## Activar y desactivar plugins

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Cambia la entrada de configuración de un plugin sin modificar los archivos instalados. Algunos plugins integrados (proveedores de modelos o voz integrados y el plugin de navegador integrado) están activados de forma predeterminada; otros requieren ejecutar `enable` después de la instalación.

## Instalar plugins

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm-pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Durante la transición del lanzamiento, las especificaciones de paquetes sin prefijo se instalan desde npm, salvo que el nombre coincida con el identificador de un plugin integrado u oficial, en cuyo caso OpenClaw usa esa copia local u oficial. Usa `clawhub:`, `npm:`, `git:` o `npm-pack:` para seleccionar la fuente de forma determinista.

Usa `--force` únicamente para sobrescribir un destino de instalación existente procedente de una fuente diferente. Para las actualizaciones habituales de una instalación registrada de npm, ClawHub o un paquete de hooks, usa `openclaw plugins update`; `--force` no es compatible con `--link`.

## Reiniciar e inspeccionar

Un Gateway administrado en ejecución y con la recarga de configuración activada se reinicia automáticamente después de instalar, actualizar o desinstalar el código de un plugin. Si el Gateway no está administrado o la recarga está desactivada, reinícialo manualmente antes de comprobar las superficies activas del entorno de ejecución:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carga el módulo del plugin y demuestra que ha registrado superficies del entorno de ejecución (herramientas, hooks, servicios, métodos del Gateway, rutas HTTP y comandos de la CLI pertenecientes al plugin). `inspect` y `list` sin opciones solo realizan comprobaciones en frío del manifiesto, la configuración y el registro.

## Actualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Al pasar el identificador de un plugin, se reutiliza su especificación de instalación registrada: las etiquetas de distribución almacenadas (`@beta`) y las versiones exactas fijadas se conservan en ejecuciones posteriores de `update <plugin-id>`.

`openclaw plugins update --all` es la vía de mantenimiento masivo. Sigue respetando las especificaciones de instalación registradas habituales, pero los registros de plugins oficiales de confianza de OpenClaw se sincronizan con el destino actual del catálogo oficial en lugar de permanecer fijados a un paquete oficial exacto y obsoleto; cuando `update.channel` es `beta`, esa sincronización da preferencia a la línea de versiones beta. Usa una actualización específica mediante `update <plugin-id>` para mantener intacta una especificación oficial exacta o etiquetada.

Para instalaciones de npm, pasa una especificación explícita de paquete para cambiar el registro asociado:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

El segundo comando devuelve un plugin a la línea de versiones predeterminada del registro cuando anteriormente estaba fijado a una versión exacta o una etiqueta.

Consulta [`openclaw plugins`](/es/cli/plugins#update) para conocer las reglas exactas de alternativa y fijación de versiones.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La desinstalación elimina la entrada de configuración del plugin, el registro persistente del índice de plugins, las entradas de las listas de permitidos y denegados y, cuando corresponda, las entradas vinculadas de `plugins.load.paths`. El directorio de instalación administrado se elimina salvo que pases `--keep-files`. Un Gateway administrado en ejecución se reinicia automáticamente cuando la desinstalación cambia la fuente del plugin.

En el modo Nix (`OPENCLAW_NIX_MODE=1`), la instalación, actualización, desinstalación, activación y desactivación de plugins están deshabilitadas; administra esas opciones en la fuente Nix de la instalación.

## Elegir una fuente

| Fuente       | Cuándo usarla                                                                    | Ejemplo                                                        |
| ------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub      | Quieres detección nativa de OpenClaw, resúmenes de análisis, versiones y sugerencias | `openclaw plugins install clawhub:<package>`                   |
| git          | Quieres una rama, etiqueta o confirmación de cambios de un repositorio            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local   | Estás desarrollando o probando un plugin en el mismo equipo                       | `openclaw plugins install --link ./my-plugin`                  |
| marketplace  | Estás instalando un plugin de marketplace compatible con Claude                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| paquete npm  | Estás verificando un artefacto de paquete local mediante la semántica de instalación de npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com    | Ya distribuyes paquetes JavaScript o necesitas etiquetas de distribución de npm o un registro privado | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Las instalaciones administradas desde rutas locales deben ser directorios o archivos de plugins. Coloca los archivos de plugin independientes en `plugins.load.paths` en lugar de instalarlos mediante `plugins install`.

## Publicar plugins

ClawHub es la principal superficie pública de detección de plugins de OpenClaw. Publica allí cuando quieras que los usuarios encuentren los metadatos del plugin, el historial de versiones, los resultados del análisis del registro y las sugerencias de instalación antes de instalarlo.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Los plugins nativos de npm deben incluir un manifiesto de plugin (`openclaw.plugin.json`) y metadatos de `package.json` antes de publicarse:

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

Usa estas páginas para consultar el contrato completo de publicación en lugar de considerar esta página como referencia de publicación:

- [Publicación en ClawHub](/es/clawhub/publishing) explica los propietarios, los ámbitos, las versiones, la revisión, la validación y la transferencia de paquetes.
- [Creación de plugins](/es/plugins/building-plugins) muestra la estructura completa del paquete del plugin (incluido `openclaw.plugin.json`) y el flujo de trabajo de la primera publicación.
- [Manifiesto de Plugin](/es/plugins/manifest) define los campos del manifiesto de plugins nativos.

Si el mismo paquete está disponible tanto en ClawHub como en npm, usa el prefijo explícito `clawhub:` o `npm:` para forzar una fuente concreta.

## Contenido relacionado

- [Plugins](/es/tools/plugin) - instalar, configurar, reiniciar y solucionar problemas
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de la CLI
- [Plugins de la comunidad](/es/plugins/community) - detección pública y publicación en ClawHub
- [ClawHub](/es/clawhub/cli) - operaciones de la CLI del registro
- [Creación de plugins](/es/plugins/building-plugins) - crear un paquete de plugin
- [Manifiesto de Plugin](/es/plugins/manifest) - manifiesto y metadatos del paquete
