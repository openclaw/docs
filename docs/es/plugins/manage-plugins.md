---
doc-schema-version: 1
read_when:
    - Quieres ejemplos rápidos para listar, instalar, actualizar, inspeccionar o desinstalar plugins
    - Quieres elegir una fuente de instalación de Plugin
    - Quieres la referencia adecuada para publicar paquetes de Plugin
sidebarTitle: Manage plugins
summary: Ejemplos rápidos para listar, instalar, actualizar, inspeccionar y desinstalar plugins de OpenClaw
title: Administrar plugins
x-i18n:
    generated_at: "2026-07-05T11:35:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44170a7bdcac24bd1f39ea5a1d22af9af219f4c979cc18d839d0cf29bdb7c38
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Comandos comunes de gestión de plugins. Para ver el contrato completo de comandos, flags,
reglas de selección de origen y casos límite, consulta [`openclaw plugins`](/es/cli/plugins).

Flujo de trabajo típico: busca un paquete, instálalo desde ClawHub, npm, git o una
ruta local, deja que el Gateway administrado se reinicie automáticamente (o reinícialo manualmente),
y luego verifica los registros de runtime del plugin.

## Listar y buscar plugins

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

`plugins list` es una comprobación de inventario en frío: lo que OpenClaw puede descubrir a partir de
la configuración, los manifiestos y el registro persistido de plugins. No demuestra que un
Gateway ya en ejecución haya importado el runtime del plugin. La salida JSON incluye
diagnósticos del registro y el `dependencyStatus` de cada plugin (si las
`dependencies`/`optionalDependencies` declaradas se resuelven en disco).

`plugins search` consulta ClawHub para buscar paquetes de plugins instalables e imprime
una sugerencia de instalación (`openclaw plugins install clawhub:<package>`) por cada resultado.

## Habilitar y deshabilitar plugins

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Activa o desactiva la entrada de configuración de un plugin sin tocar los archivos instalados. Algunos
plugins integrados (proveedores integrados de modelos/voz, el plugin de navegador integrado)
están habilitados de forma predeterminada; otros requieren `enable` después de la instalación.

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

Las especificaciones de paquete sin prefijo se instalan desde npm durante la transición de lanzamiento, salvo que el
nombre coincida con un id de plugin integrado u oficial, en cuyo caso OpenClaw usa
esa copia local/oficial en su lugar. Usa `clawhub:`, `npm:`, `git:` o
`npm-pack:` para una selección de origen determinista.

Usa `--force` solo para sobrescribir un destino de instalación existente desde un origen
diferente. Para actualizaciones rutinarias de una instalación rastreada de npm, ClawHub o hook-pack,
usa `openclaw plugins update` en su lugar; `--force` no es compatible con
`--link`.

## Reiniciar e inspeccionar

Un Gateway administrado en ejecución con recarga de configuración habilitada se reinicia automáticamente
después de instalar, actualizar o desinstalar código de plugin. Si el Gateway no está
administrado o la recarga está deshabilitada, reinícialo tú mismo antes de comprobar las superficies
de runtime en vivo:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carga el módulo del plugin y demuestra que registró superficies
de runtime (herramientas, hooks, servicios, métodos de Gateway, rutas HTTP, comandos
CLI propiedad del plugin). `inspect` y `list` simples son solo comprobaciones en frío de manifiesto/configuración/registro.

## Actualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Pasar un id de plugin reutiliza su especificación de instalación rastreada: los dist-tags
almacenados (`@beta`) y las versiones exactas fijadas se conservan en ejecuciones posteriores de
`update <plugin-id>`.

`openclaw plugins update --all` es la ruta de mantenimiento masivo. Sigue
respetando las especificaciones ordinarias de instalación rastreada, pero los registros de plugins oficiales
de OpenClaw de confianza se sincronizan con el destino actual del catálogo oficial en lugar de
quedarse fijados a un paquete oficial exacto obsoleto; cuando `update.channel` es
`beta`, esa sincronización prefiere la línea de lanzamiento beta. Usa un
`update <plugin-id>` dirigido para mantener intacta una especificación oficial exacta o etiquetada.

Para instalaciones de npm, pasa una especificación de paquete explícita para cambiar el registro
rastreado:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

El segundo comando devuelve un plugin a la línea de lanzamiento predeterminada del registro
cuando antes estaba fijado a una versión exacta o etiqueta.

Consulta [`openclaw plugins`](/es/cli/plugins#update) para ver las reglas exactas de fallback y
fijación.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La desinstalación elimina la entrada de configuración del plugin, el registro persistido del índice de plugins,
las entradas de lista de permitir/denegar y las entradas enlazadas de `plugins.load.paths` cuando
corresponda. El directorio de instalación administrado se elimina salvo que pases
`--keep-files`. Un Gateway administrado en ejecución se reinicia automáticamente cuando la
desinstalación cambia el origen del plugin.

En modo Nix (`OPENCLAW_NIX_MODE=1`), la instalación, actualización, desinstalación,
habilitación y deshabilitación de plugins están todas deshabilitadas; administra esas opciones en el origen Nix
de la instalación en su lugar.

## Elegir un origen

| Origen      | Úsalo cuando                                                                    | Ejemplo                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Quieres descubrimiento nativo de OpenClaw, resúmenes de análisis, versiones y sugerencias     | `openclaw plugins install clawhub:<package>`                   |
| git         | Quieres una rama, etiqueta o commit de un repositorio                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local  | Estás desarrollando o probando un plugin en la misma máquina                  | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Estás instalando un plugin de marketplace compatible con Claude                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Estás validando un artefacto de paquete local mediante la semántica de instalación de npm      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Ya publicas paquetes JavaScript o necesitas dist-tags/registro privado de npm | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Las instalaciones de ruta local administradas deben ser directorios o archivos de plugin. Pon
archivos de plugin independientes en `plugins.load.paths` en lugar de instalarlos
con `plugins install`.

## Publicar plugins

ClawHub es la superficie principal de descubrimiento público para plugins de OpenClaw. Publica
allí cuando quieras que los usuarios encuentren metadatos de plugins, historial de versiones, resultados
de análisis del registro y sugerencias de instalación antes de instalar.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Los plugins nativos de npm deben incluir un manifiesto de plugin (`openclaw.plugin.json`) además de
metadatos de `package.json` antes de publicar:

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

Usa estas páginas para el contrato completo de publicación en lugar de tratar esta
página como la referencia de publicación:

- [Publicación en ClawHub](/es/clawhub/publishing) explica propietarios, scopes,
  lanzamientos, revisión, validación de paquetes y transferencia de paquetes.
- [Crear plugins](/es/plugins/building-plugins) muestra la forma completa del paquete de plugin
  (incluido `openclaw.plugin.json`) y el primer flujo de publicación.
- [Manifiesto de plugin](/es/plugins/manifest) define los campos del manifiesto de plugin
  nativo.

Si el mismo paquete está disponible tanto en ClawHub como en npm, usa el prefijo explícito
`clawhub:` o `npm:` para forzar un origen.

## Relacionado

- [Plugins](/es/tools/plugin) - instalar, configurar, reiniciar y solucionar problemas
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de CLI
- [Plugins de la comunidad](/es/plugins/community) - descubrimiento público y publicación en ClawHub
- [ClawHub](/es/clawhub/cli) - operaciones de CLI del registro
- [Crear plugins](/es/plugins/building-plugins) - crear un paquete de plugin
- [Manifiesto de plugin](/es/plugins/manifest) - manifiesto y metadatos de paquete
