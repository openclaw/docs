---
read_when:
    - Quieres ejemplos rápidos para instalar, listar, actualizar o desinstalar plugins
    - Quieres elegir entre ClawHub y la distribución de Plugin mediante npm
    - Estás publicando un paquete de Plugin
sidebarTitle: Manage plugins
summary: Ejemplos rápidos para instalar, listar, desinstalar, actualizar y publicar plugins de OpenClaw
title: Gestionar plugins
x-i18n:
    generated_at: "2026-05-05T01:48:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La mayoría de los flujos de trabajo de Plugins son unos pocos comandos: buscar, instalar, reiniciar el Gateway,
verificar y desinstalar cuando ya no necesites el Plugin.

## Listar Plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--json` para scripts. Incluye diagnósticos del registro y el
`dependencyStatus` estático de cada Plugin cuando el paquete del Plugin declara `dependencies` u
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` es una comprobación de inventario en frío. Muestra lo que OpenClaw puede descubrir
a partir de la configuración, los manifiestos y el registro de Plugins; no demuestra que un
proceso del Gateway ya en ejecución haya importado el runtime del Plugin.

## Instalar Plugins

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Después de instalar código de Plugin, reinicia el Gateway que sirve tus canales:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Usa `inspect --runtime` cuando necesites demostrar que el Plugin registró superficies
de runtime como herramientas, hooks, servicios, métodos del Gateway o comandos de CLI
propiedad del Plugin.

## Actualizar Plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Si un Plugin se instaló desde un dist-tag de npm como `@beta`, las llamadas posteriores a
`update <plugin-id>` reutilizan esa etiqueta registrada. Pasar una especificación npm explícita
cambia la instalación rastreada a esa especificación para futuras actualizaciones.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

El segundo comando mueve un Plugin de vuelta a la línea de versiones predeterminada del registro
cuando antes estaba fijado a una versión exacta o etiqueta.

Cuando `openclaw update` se ejecuta en el canal beta, los registros de Plugins de npm de línea
predeterminada y ClawHub intentan primero la versión `@beta` del Plugin correspondiente. Si esa
versión beta no existe, OpenClaw recurre a la especificación predeterminada/latest registrada.
Para Plugins de npm, OpenClaw también recurre a esa alternativa cuando el paquete beta existe pero falla
la validación de instalación. Las versiones exactas y las etiquetas explícitas como `@rc` o `@beta`
se conservan.

## Desinstalar Plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

La desinstalación elimina la entrada de configuración del Plugin, el registro de índice del Plugin, las entradas
de listas de permisos/denegaciones y las rutas de carga enlazadas cuando corresponda. Los directorios de instalación
gestionados se eliminan salvo que pases `--keep-files`.

## Publicar Plugins

Puedes publicar Plugins externos en [ClawHub](https://clawhub.ai), npmjs.com o
ambos.

### Publicar en ClawHub

ClawHub es la superficie principal de descubrimiento público para Plugins de OpenClaw. Ofrece a los
usuarios metadatos buscables, historial de versiones y resultados de escaneo del registro antes de la
instalación.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Los usuarios instalan desde ClawHub con:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

La forma sin prefijo sigue comprobando ClawHub primero.

### Publicar en npmjs.com

Los Plugins nativos de npm deben incluir un manifiesto de Plugin y metadatos de punto de entrada de OpenClaw
en `package.json`.

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
```

Los usuarios instalan solo desde npm con:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Si el mismo paquete también está disponible en ClawHub, `npm:` omite la búsqueda en ClawHub y
fuerza la resolución de npm.

## Elección de fuente

- **ClawHub**: úsalo cuando quieras descubrimiento nativo de OpenClaw, resúmenes de escaneo,
  versiones e indicaciones de instalación.
- **npmjs.com**: úsalo cuando ya distribuyas paquetes de JavaScript o necesites flujos de trabajo de
  dist-tags/registro privado de npm.
- **Git**: úsalo cuando quieras instalar directamente desde una rama, etiqueta o commit.
- **Ruta local**: úsala cuando estés desarrollando o probando un Plugin en la misma
  máquina.

## Relacionado

- [Plugins](/es/tools/plugin) - descripción general y solución de problemas
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de CLI
- [ClawHub](/es/tools/clawhub) - publicación y operaciones de registro
- [Creación de Plugins](/es/plugins/building-plugins) - crear un paquete de Plugin
- [Manifiesto de Plugin](/es/plugins/manifest) - manifiesto y metadatos de paquete
