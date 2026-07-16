---
doc-schema-version: 1
read_when:
    - Quieres explorar, instalar, habilitar o deshabilitar plugins en la interfaz de control
    - Quieres ejemplos rápidos para listar, instalar, actualizar, inspeccionar o desinstalar plugins
    - Quiere elegir una fuente de instalación del plugin
    - Quieres la referencia adecuada para publicar paquetes de plugins
sidebarTitle: Manage plugins
summary: Gestiona los plugins de OpenClaw desde la interfaz de control o la CLI
title: Gestionar plugins
x-i18n:
    generated_at: "2026-07-16T11:49:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La interfaz de control abarca el flujo de trabajo habitual de detección,
instalación, activación y desactivación. La CLI añade actualización,
desinstalación, configuración avanzada y controles explícitos de la fuente de
instalación. Para consultar el contrato completo de comandos, las opciones, las
reglas de selección de fuentes y los casos límite, véase
[`openclaw plugins`](/es/cli/plugins).

Flujo de trabajo habitual de la CLI: buscar un paquete, instalarlo desde
ClawHub, npm, git o una ruta local, permitir que el Gateway administrado se
reinicie automáticamente (o reiniciarlo manualmente) y, a continuación,
verificar los registros en tiempo de ejecución del plugin.

## Usar la interfaz de control

Abra **Plugins** en la interfaz de control o use `/settings/plugins` con
respecto a la ruta base configurada de la interfaz de control. Por ejemplo, una
ruta base `/openclaw` usa `/openclaw/settings/plugins`. La página tiene dos
pestañas:

- **Instalados** muestra el inventario local completo agrupado
por categoría (canales, proveedores de modelos, memoria y herramientas). Cada
fila abre una vista de detalles; su menú de desbordamiento
(`…`) activa o desactiva el plugin y, para los plugins instalados
externamente, ofrece **Eliminar**. La pestaña también enumera los
[servidores MCP](/es/cli/mcp) configurados con las mismas acciones de activación,
desactivación y eliminación mediante menús, que modifican
`mcp.servers` en la configuración del Gateway.
- **Descubrir** es la tienda: plugins destacados incluidos con
OpenClaw, plugins externos oficiales y una selección de conectores. Las
tarjetas de conectores añaden un servidor MCP alojado con un solo clic (GitHub,
Notion, Linear, Sentry, Home Assistant) o abren una búsqueda de ClawHub
precompletada. Al escribir en el cuadro de búsqueda se consulta
[ClawHub](https://clawhub.ai/plugins) en línea y se añade una sección **Desde
ClawHub** con recuentos de descargas e insignias de verificación de la fuente.

Los plugins incluidos no requieren instalar un paquete. La acción de su menú
es **Activar** o **Desactivar**. Workboard, por ejemplo, está incluido con
OpenClaw y desactivado de forma predeterminada, por lo que debe elegirse
**Activar** para ponerlo en funcionamiento. Los plugins integrados no pueden
eliminarse, solo desactivarse.

El acceso al catálogo y a la búsqueda requiere `operator.read`. Los cambios
de instalación, activación, desactivación, eliminación y servidores MCP
requieren `operator.admin`. El Gateway realiza las instalaciones desde
ClawHub y conserva sus comprobaciones de confianza, integridad y políticas de
instalación de plugins. Cuando un administrador activa un plugin instalado,
también registra esa confianza explícita añadiendo el plugin seleccionado a una
lista restrictiva `plugins.allow` existente. Una entrada
`plugins.deny` explícita sigue teniendo prioridad y debe eliminarse antes
de activar el plugin.

Instalar o eliminar código de plugins requiere reiniciar el Gateway. Los
cambios de activación pueden aplicarse sin reiniciar cuando el plugin instalado
y el entorno de ejecución actual del Gateway lo admiten; en caso contrario, la
interfaz indica que es necesario reiniciar. Los conectores MCP respaldados por
OAuth siguen necesitando una ejecución única de `openclaw mcp login <name>` desde la CLI
después de añadirlos.

La interfaz de control no instala desde fuentes npm, git ni rutas locales
arbitrarias, no actualiza plugins ni ofrece una configuración detallada de
plugins. Use los flujos de trabajo de la CLI que se indican a continuación
para esas operaciones.

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

`plugins list` es una comprobación en frío del inventario: lo que OpenClaw
puede detectar a partir de la configuración, los manifiestos y el registro de
plugins persistente. No demuestra que un Gateway ya en ejecución haya
importado el entorno de ejecución del plugin. La salida JSON incluye
diagnósticos del registro y el valor `dependencyStatus` de cada plugin (si los
elementos `dependencies`/`optionalDependencies` declarados se resuelven en el
disco).

`plugins search` consulta ClawHub para buscar paquetes de plugins instalables
e imprime una sugerencia de instalación (`openclaw plugins install clawhub:<package>`) por cada
resultado.

## Activar y desactivar plugins

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Cambia la entrada de configuración de un plugin sin modificar los archivos
instalados. Algunos plugins integrados (proveedores integrados de modelos o
voz y el plugin integrado del navegador) están activados de forma
predeterminada; otros requieren `enable` después de instalarlos.

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

# Instalar desde git o una copia local de desarrollo.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Las especificaciones de paquetes sin prefijo se instalan desde npm durante la
transición del lanzamiento, salvo que el nombre coincida con el identificador
de un plugin integrado u oficial, en cuyo caso OpenClaw usa esa copia local u
oficial. Use `clawhub:`, `npm:`, `git:` o
`npm-pack:` para seleccionar la fuente de forma determinista. Los
paquetes de los catálogos integrados y oficiales de OpenClaw se consideran de
confianza junto con los paquetes de ClawHub. Las fuentes nuevas y arbitrarias
de npm, git, rutas o archivos locales, `npm-pack:` o mercados requieren
`--force` en las instalaciones no interactivas después de revisar la
fuente y confiar en ella.

`--force` confirma una fuente distinta de ClawHub sin solicitar
confirmación y sobrescribe un destino de instalación existente cuando es
necesario. Para las actualizaciones habituales de una instalación registrada
de npm, ClawHub o un paquete de enlaces, use `openclaw plugins update`. Con
`--link`, `--force` solo confirma la fuente; el directorio
enlazado no se copia ni se sobrescribe.

## Reiniciar e inspeccionar

Un Gateway administrado en ejecución con la recarga de configuración activada
se reinicia automáticamente después de instalar, actualizar o desinstalar
código de plugins. Si el Gateway no está administrado o la recarga está
desactivada, reinícielo manualmente antes de comprobar las superficies activas
en tiempo de ejecución:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carga el módulo del plugin y demuestra que ha registrado
superficies en tiempo de ejecución (herramientas, enlaces, servicios, métodos
del Gateway, rutas HTTP y comandos de la CLI pertenecientes al plugin).
`inspect` sin opciones y `list` son únicamente
comprobaciones en frío del manifiesto, la configuración y el registro.

## Actualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Al proporcionar el identificador de un plugin, se reutiliza su especificación
de instalación registrada: las etiquetas de distribución almacenadas
(`@beta`) y las versiones exactas fijadas se conservan en
ejecuciones posteriores de `update <plugin-id>`.

`openclaw plugins update --all` es la vía de mantenimiento masivo. Sigue respetando las
especificaciones de instalación registradas habituales, pero los registros de
plugins oficiales de confianza de OpenClaw se sincronizan con el destino actual
del catálogo oficial en lugar de permanecer fijados a un paquete oficial
exacto obsoleto; cuando `update.channel` es `beta`, esa
sincronización prefiere la línea de versiones beta. Use una ejecución dirigida
de `update <plugin-id>` para mantener sin cambios una especificación oficial
exacta o etiquetada.

Para las instalaciones de npm, proporcione una especificación explícita del
paquete para cambiar el registro:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

El segundo comando devuelve un plugin a la línea de versiones predeterminada
del registro cuando anteriormente se había fijado a una versión exacta o una
etiqueta.

Consulte [`openclaw plugins`](/es/cli/plugins#update) para conocer las reglas
exactas de alternativa y fijación.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La desinstalación elimina la entrada de configuración del plugin, el registro
persistente del índice de plugins, las entradas de las listas de permitidos y
denegados y, cuando corresponda, las entradas `plugins.load.paths` enlazadas. El
directorio de instalación administrado se elimina salvo que se proporcione
`--keep-files`. Un Gateway administrado en ejecución se reinicia
automáticamente cuando la desinstalación cambia la fuente del plugin.

En el modo Nix (`OPENCLAW_NIX_MODE=1`), la instalación, actualización,
desinstalación, activación y desactivación de plugins están inhabilitadas;
administre esas opciones en el código fuente de Nix de la instalación.

## Elegir una fuente

| Fuente       | Usar cuando                                                                    | Ejemplo                                                        |
| ------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub      | Se necesita detección nativa de OpenClaw, resúmenes de análisis, versiones y sugerencias | `openclaw plugins install clawhub:<package>`                   |
| git          | Se necesita una rama, etiqueta o confirmación de un repositorio               | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local   | Se está desarrollando o probando un plugin en el mismo equipo                 | `openclaw plugins install --link ./my-plugin`                  |
| mercado      | Se está instalando un plugin de mercado compatible con Claude                 | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack     | Se está verificando un artefacto de paquete local mediante la semántica de instalación de npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com    | Ya se distribuyen paquetes JavaScript o se necesitan etiquetas de distribución de npm o un registro privado | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Las instalaciones administradas desde rutas locales deben ser directorios o
archivos de plugins. Coloque los archivos de plugins independientes en
`plugins.load.paths` en lugar de instalarlos con `plugins install`.

## Publicar plugins

ClawHub es la principal superficie pública de detección de plugins de OpenClaw.
Publique allí cuando quiera que los usuarios encuentren los metadatos del
plugin, el historial de versiones, los resultados de análisis del registro y
las sugerencias de instalación antes de instalarlo.

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

Use estas páginas para consultar el contrato de publicación completo en lugar
de tratar esta página como referencia de publicación:

- [Publicación en ClawHub](/es/clawhub/publishing) explica los
propietarios, los ámbitos, las versiones, la revisión, la validación y la
transferencia de paquetes.
- [Creación de plugins](/es/plugins/building-plugins) muestra la
estructura completa de los paquetes de plugins (incluido
`openclaw.plugin.json`) y el flujo de trabajo de la primera publicación.
- [Manifiesto de plugins](/es/plugins/manifest) define los campos
del manifiesto de plugins nativos.

Si el mismo paquete está disponible tanto en ClawHub como en npm, use el
prefijo explícito `clawhub:` o `npm:` para forzar una
fuente.

## Relacionado

- [Plugins](/es/tools/plugin): instalar, configurar, reiniciar y
solucionar problemas
- [`openclaw plugins`](/es/cli/plugins): referencia completa de la
CLI
- [Plugins de la comunidad](/es/plugins/community): detección
pública y publicación en ClawHub
- [ClawHub](/es/clawhub/cli): operaciones de la CLI del registro
- [Creación de plugins](/es/plugins/building-plugins): crear un
paquete de plugin
- [Manifiesto de plugins](/es/plugins/manifest): manifiesto y
metadatos del paquete
