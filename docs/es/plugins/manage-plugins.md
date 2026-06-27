---
doc-schema-version: 1
read_when:
    - Quieres ejemplos rápidos para listar, instalar, actualizar, inspeccionar o desinstalar Plugins
    - Quieres elegir una fuente de instalación de plugin
    - Quieres la referencia adecuada para publicar paquetes de Plugin
sidebarTitle: Manage plugins
summary: Ejemplos rápidos para listar, instalar, actualizar, inspeccionar y desinstalar plugins de OpenClaw
title: Administrar plugins
x-i18n:
    generated_at: "2026-06-27T12:13:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Usa esta página para comandos comunes de gestión de plugins. Para el contrato exhaustivo de comandos, las marcas, las reglas de selección de origen y los casos límite, consulta
[`openclaw plugins`](/es/cli/plugins).

La mayoría de los flujos de instalación son:

1. buscar un paquete
2. instalarlo desde ClawHub, npm, git o una ruta local
3. dejar que el Gateway gestionado se reinicie automáticamente, o reiniciarlo manualmente cuando no esté gestionado
4. verificar los registros de tiempo de ejecución del plugin

## Listar y buscar plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Usa `--json` para scripts:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` es una comprobación de inventario en frío. Muestra lo que OpenClaw puede descubrir desde la configuración, los manifiestos y el registro de plugins; no demuestra que un Gateway que ya está en ejecución haya importado el tiempo de ejecución del plugin. La salida JSON incluye diagnósticos del registro y el `dependencyStatus` estático de cada plugin cuando el paquete del plugin declara `dependencies` u `optionalDependencies`.

`plugins search` consulta ClawHub para encontrar paquetes de plugins instalables e imprime sugerencias de instalación como `openclaw plugins install clawhub:<package>`.

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

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Las especificaciones de paquete sin prefijo se instalan desde npm durante el cambio de lanzamiento. Usa `clawhub:`, `npm:`, `git:` o `npm-pack:` cuando necesites una selección de origen determinista. Si el nombre sin prefijo coincide con un id de plugin oficial, OpenClaw puede instalar directamente la entrada del catálogo.

Usa `--force` solo cuando quieras sobrescribir intencionalmente un destino de instalación existente. Para actualizaciones rutinarias de instalaciones rastreadas de npm, ClawHub o paquetes de hooks, usa `openclaw plugins update`.

## Reiniciar e inspeccionar

Después de instalar, actualizar o desinstalar código de plugin, un Gateway gestionado en ejecución con recarga de configuración habilitada se reinicia automáticamente. Si el Gateway no está gestionado o la recarga está deshabilitada, reinícialo tú mismo antes de comprobar superficies de tiempo de ejecución en vivo:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Usa `inspect --runtime` cuando necesites prueba de que el plugin registró superficies de tiempo de ejecución como herramientas, hooks, servicios, métodos del Gateway, rutas HTTP o comandos de CLI propiedad del plugin. `inspect` y `list` simples son comprobaciones en frío de manifiesto, configuración y registro.

## Actualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Cuando pasas un id de plugin, OpenClaw reutiliza la especificación de instalación rastreada. Las dist-tags almacenadas como `@beta` y las versiones exactas fijadas se siguen usando en ejecuciones posteriores de `update <plugin-id>`.

`openclaw plugins update --all` es la ruta de mantenimiento masivo. Sigue respetando las especificaciones de instalación rastreadas ordinarias, pero los registros de plugins oficiales de OpenClaw de confianza pueden sincronizarse con el destino actual del catálogo oficial en lugar de quedarse en un paquete oficial exacto obsoleto. Si `update.channel` está establecido en `beta`, esa sincronización oficial masiva usa el contexto del canal beta. Usa un `update <plugin-id>` dirigido cuando quieras mantener intencionalmente intacta una especificación oficial exacta o etiquetada.

Para instalaciones de npm, puedes pasar una especificación de paquete explícita para cambiar el registro rastreado:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

El segundo comando devuelve un plugin a la línea de lanzamiento predeterminada del registro cuando antes estaba fijado a una versión exacta o etiqueta.

Cuando `openclaw update` se ejecuta en el canal beta, los registros de plugins pueden preferir versiones `@beta` coincidentes. Para las reglas exactas de reserva y fijación, consulta
[`openclaw plugins`](/es/cli/plugins#update).

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La desinstalación elimina la entrada de configuración del plugin, el registro persistente del índice de plugins, las entradas de listas de permitidos/denegados y las rutas de carga enlazadas cuando corresponde. Los directorios de instalación gestionados se eliminan salvo que pases `--keep-files`. Un Gateway gestionado en ejecución se reinicia automáticamente cuando la desinstalación cambia el origen del plugin.

En modo Nix (`OPENCLAW_NIX_MODE=1`), los comandos para instalar, actualizar, desinstalar, habilitar y deshabilitar plugins están deshabilitados. Gestiona esas opciones en el origen Nix de la instalación en su lugar.

## Elegir un origen

| Origen      | Úsalo cuando                                                                 | Ejemplo                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Quieras descubrimiento nativo de OpenClaw, resúmenes de escaneo, versiones y sugerencias | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Ya publiques paquetes JavaScript o necesites dist-tags/registro privado de npm | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Quieras una rama, etiqueta o commit de un repositorio                       | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local  | Estés desarrollando o probando un plugin en la misma máquina                | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Estés validando un artefacto de paquete local mediante semántica de instalación de npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Estés instalando un plugin de marketplace compatible con Claude             | `openclaw plugins install <plugin> --marketplace <source>`     |

Las instalaciones gestionadas desde ruta local deben ser directorios o archivos de plugins. Coloca los archivos de plugin independientes en `plugins.load.paths` en lugar de instalarlos con `plugins install`.

## Publicar plugins

ClawHub es la superficie principal de descubrimiento público para plugins de OpenClaw. Publica allí cuando quieras que los usuarios encuentren metadatos del plugin, historial de versiones, resultados de escaneo del registro y sugerencias de instalación antes de instalar.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Los plugins nativos de npm deben incluir un manifiesto de plugin y metadatos de paquete antes de publicar:

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

Usa estas páginas para el contrato completo de publicación en lugar de tratar esta página como la referencia de publicación:

- [Publicación en ClawHub](/es/clawhub/publishing) explica propietarios, ámbitos, lanzamientos,
  revisión, validación de paquetes y transferencia de paquetes.
- [Crear plugins](/es/plugins/building-plugins) muestra la forma del paquete de plugin
  y el primer flujo de publicación.
- [Manifiesto de plugin](/es/plugins/manifest) define los campos del manifiesto de plugin nativo.

Si el mismo paquete está disponible tanto en ClawHub como en npm, usa el prefijo explícito `clawhub:` o `npm:` cuando necesites forzar un origen.

## Relacionado

- [Plugins](/es/tools/plugin) - instalar, configurar, reiniciar y solucionar problemas
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de CLI
- [Plugins de la comunidad](/es/plugins/community) - descubrimiento público y publicación en ClawHub
- [ClawHub](/es/clawhub/cli) - operaciones de CLI del registro
- [Crear plugins](/es/plugins/building-plugins) - crear un paquete de plugin
- [Manifiesto de plugin](/es/plugins/manifest) - manifiesto y metadatos de paquete
