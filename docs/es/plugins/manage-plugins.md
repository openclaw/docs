---
doc-schema-version: 1
read_when:
    - Quieres explorar, instalar, activar o desactivar plugins en la interfaz de control
    - Quieres ejemplos rápidos para listar, instalar, actualizar, inspeccionar o desinstalar plugins.
    - Quieres elegir una fuente de instalación de plugins
    - Quieres la referencia adecuada para publicar paquetes de plugins
sidebarTitle: Manage plugins
summary: Gestiona los plugins de OpenClaw desde la interfaz de control o la CLI
title: Administrar plugins
x-i18n:
    generated_at: "2026-07-12T14:44:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La interfaz de control abarca el flujo de trabajo habitual de descubrimiento,
instalación, habilitación y deshabilitación. La CLI añade controles de
actualización, desinstalación, configuración avanzada y selección explícita del
origen de instalación. Para consultar el contrato completo de comandos, las
opciones, las reglas de selección de origen y los casos límite, consulte
[`openclaw plugins`](/es/cli/plugins).

Flujo de trabajo típico de la CLI: busque un paquete, instálelo desde ClawHub,
npm, git o una ruta local, deje que el Gateway administrado se reinicie
automáticamente (o reinícielo manualmente) y, a continuación, verifique los
registros del entorno de ejecución del plugin.

## Usar la interfaz de control

Abra **Plugins** en la interfaz de control o use `/settings/plugins` en relación
con la ruta base configurada de la interfaz de control. Por ejemplo, una ruta
base `/openclaw` usa `/openclaw/settings/plugins`. La página tiene dos pestañas:

- **Instalados** muestra el inventario local completo agrupado por categoría
  (canales, proveedores de modelos, memoria y herramientas). Cada fila abre una
  vista de detalles; su menú de opciones adicionales (`…`) habilita o
  deshabilita el plugin y, en el caso de los plugins instalados externamente,
  ofrece **Eliminar**. La pestaña también enumera los
  [servidores MCP](/es/cli/mcp) configurados con las mismas acciones de
  habilitación, deshabilitación y eliminación mediante menús, que modifican
  `mcp.servers` en la configuración del Gateway.
- **Descubrir** es la tienda: plugins destacados incluidos con OpenClaw, plugins
  externos oficiales y una selección de conectores. Las tarjetas de conectores
  añaden un servidor MCP alojado con un solo clic (GitHub, Notion, Linear,
  Sentry, Home Assistant) o abren una búsqueda de ClawHub rellenada previamente.
  Al escribir en el cuadro de búsqueda, se consulta
  [ClawHub](https://clawhub.ai/plugins) en la misma página y se añade una sección
  **De ClawHub** con recuentos de descargas e insignias de verificación del
  origen.

Los plugins incluidos no necesitan la instalación de un paquete. La acción de
su menú es **Habilitar** o **Deshabilitar**. Workboard, por ejemplo, se incluye
con OpenClaw y está deshabilitado de forma predeterminada, por lo que debe elegir
**Habilitar** para activarlo. Los plugins integrados no se pueden eliminar, solo
deshabilitar.

El acceso al catálogo y a la búsqueda requiere `operator.read`. La instalación,
habilitación, deshabilitación y eliminación, así como los cambios en servidores
MCP, requieren `operator.admin`. El Gateway realiza las instalaciones desde
ClawHub y conserva sus comprobaciones de confianza, integridad y políticas de
instalación de plugins.

Instalar o eliminar código de plugins requiere reiniciar el Gateway. Los cambios
de habilitación pueden aplicarse sin reiniciar cuando el plugin instalado y el
entorno de ejecución actual del Gateway lo admiten; de lo contrario, la interfaz
indica que es necesario reiniciar. Los conectores MCP respaldados por OAuth
siguen necesitando una ejecución única de `openclaw mcp login <name>` desde la
CLI después de añadirlos.

La interfaz de control no instala desde orígenes arbitrarios de npm, git o rutas
locales, no actualiza plugins ni expone una configuración avanzada de plugins.
Use los flujos de trabajo de la CLI que aparecen a continuación para esas
operaciones.

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

`plugins list` es una comprobación de inventario en frío: muestra lo que
OpenClaw puede descubrir a partir de la configuración, los manifiestos y el
registro persistente de plugins. No demuestra que un Gateway que ya está en
ejecución haya importado el entorno de ejecución del plugin. La salida JSON
incluye diagnósticos del registro y el valor `dependencyStatus` de cada plugin
(que indica si las `dependencies`/`optionalDependencies` declaradas se resuelven
en el disco).

`plugins search` consulta ClawHub para buscar paquetes de plugins instalables e
imprime una sugerencia de instalación
(`openclaw plugins install clawhub:<package>`) por cada resultado.

## Habilitar y deshabilitar plugins

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Alterna la entrada de configuración de un plugin sin modificar los archivos
instalados. Algunos plugins integrados (proveedores integrados de modelos/voz y
el plugin de navegador integrado) están habilitados de forma predeterminada;
otros requieren `enable` después de la instalación.

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

# Instalar desde git o desde un entorno de desarrollo local.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Durante la transición del lanzamiento, las especificaciones de paquetes sin
prefijo se instalan desde npm, salvo que el nombre coincida con el identificador
de un plugin integrado u oficial, en cuyo caso OpenClaw usa esa copia local u
oficial. Use `clawhub:`, `npm:`, `git:` o `npm-pack:` para seleccionar el origen
de forma determinista.

Use `--force` únicamente para sobrescribir un destino de instalación existente
procedente de otro origen. Para las actualizaciones rutinarias de una
instalación registrada de npm, ClawHub o un paquete de hooks, use
`openclaw plugins update`; `--force` no es compatible con `--link`.

## Reiniciar e inspeccionar

Un Gateway administrado en ejecución que tenga habilitada la recarga de
configuración se reinicia automáticamente después de instalar, actualizar o
desinstalar código de plugins. Si el Gateway no está administrado o la recarga
está deshabilitada, reinícielo manualmente antes de comprobar las superficies
del entorno de ejecución activas:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carga el módulo del plugin y demuestra que ha registrado
superficies del entorno de ejecución (herramientas, hooks, servicios, métodos
del Gateway, rutas HTTP y comandos de la CLI propiedad del plugin).
`inspect` sin opciones y `list` son únicamente comprobaciones en frío del
manifiesto, la configuración y el registro.

## Actualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Al pasar el identificador de un plugin, se reutiliza su especificación de
instalación registrada: las etiquetas de distribución (`@beta`) almacenadas y
las versiones exactas fijadas se conservan en ejecuciones posteriores de
`update <plugin-id>`.

`openclaw plugins update --all` es la vía de mantenimiento masivo. Sigue
respetando las especificaciones de instalación registradas habituales, pero los
registros de plugins oficiales de OpenClaw de confianza se sincronizan con el
destino actual del catálogo oficial en lugar de permanecer fijados a un paquete
oficial exacto obsoleto; cuando `update.channel` es `beta`, esa sincronización
prefiere la línea de versiones beta. Use una actualización específica
`update <plugin-id>` para mantener intacta una especificación oficial exacta o
etiquetada.

Para instalaciones de npm, pase una especificación de paquete explícita para
cambiar el registro:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

El segundo comando devuelve un plugin a la línea de versiones predeterminada
del registro cuando anteriormente estaba fijado a una versión o etiqueta
exacta.

Consulte [`openclaw plugins`](/es/cli/plugins#update) para conocer las reglas
exactas de reserva y fijación.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La desinstalación elimina la entrada de configuración del plugin, el registro
persistente del índice de plugins, las entradas de las listas de permitidos y
denegados y las entradas vinculadas de `plugins.load.paths`, cuando corresponda.
El directorio de instalación administrado se elimina a menos que se pase
`--keep-files`. Un Gateway administrado en ejecución se reinicia automáticamente
cuando la desinstalación cambia el origen del plugin.

En el modo Nix (`OPENCLAW_NIX_MODE=1`), la instalación, actualización,
desinstalación, habilitación y deshabilitación de plugins están desactivadas;
gestione esas opciones en el origen Nix de la instalación.

## Elegir un origen

| Origen        | Cuándo usarlo                                                                  | Ejemplo                                                        |
| ------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub       | Cuando desea descubrimiento nativo de OpenClaw, resúmenes de análisis, versiones y sugerencias | `openclaw plugins install clawhub:<package>`                   |
| git           | Cuando desea una rama, etiqueta o confirmación de cambios de un repositorio    | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local    | Cuando desarrolla o prueba un plugin en la misma máquina                       | `openclaw plugins install --link ./my-plugin`                  |
| marketplace   | Cuando instala un plugin de marketplace compatible con Claude                  | `openclaw plugins install <plugin> --marketplace <source>`     |
| paquete npm   | Cuando valida un artefacto de paquete local mediante la semántica de instalación de npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com     | Cuando ya distribuye paquetes JavaScript o necesita etiquetas de distribución de npm/un registro privado | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Las instalaciones administradas desde rutas locales deben ser directorios o
archivos de plugins. Coloque los archivos de plugins independientes en
`plugins.load.paths` en lugar de instalarlos con `plugins install`.

## Publicar plugins

ClawHub es la principal superficie pública de descubrimiento para los plugins
de OpenClaw. Publique allí cuando desee que los usuarios encuentren los
metadatos del plugin, el historial de versiones, los resultados del análisis del
registro y las sugerencias de instalación antes de instalarlo.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Los plugins nativos de npm deben incluir un manifiesto de plugin
(`openclaw.plugin.json`) y metadatos de `package.json` antes de publicarse:

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

Use estas páginas para consultar el contrato completo de publicación en lugar
de tratar esta página como referencia de publicación:

- [Publicación en ClawHub](/es/clawhub/publishing) explica los propietarios, los
  ámbitos, las versiones, la revisión, la validación y la transferencia de
  paquetes.
- [Creación de plugins](/es/plugins/building-plugins) muestra la estructura completa
  de un paquete de plugin (incluido `openclaw.plugin.json`) y el flujo de trabajo
  de la primera publicación.
- [Manifiesto de plugins](/es/plugins/manifest) define los campos del manifiesto de
  plugins nativos.

Si el mismo paquete está disponible tanto en ClawHub como en npm, use el prefijo
explícito `clawhub:` o `npm:` para forzar un origen.

## Temas relacionados

- [Plugins](/es/tools/plugin) - instalar, configurar, reiniciar y solucionar problemas
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de la CLI
- [Plugins de la comunidad](/es/plugins/community) - descubrimiento público y publicación en ClawHub
- [ClawHub](/es/clawhub/cli) - operaciones de la CLI del registro
- [Creación de plugins](/es/plugins/building-plugins) - crear un paquete de plugin
- [Manifiesto de plugins](/es/plugins/manifest) - manifiesto y metadatos del paquete
