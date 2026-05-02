---
read_when:
    - Quieres ejemplos rápidos para instalar, listar, actualizar o desinstalar Plugin
    - Quieres elegir entre ClawHub y la distribución de plugins mediante npm
    - Estás publicando un paquete de Plugin
sidebarTitle: Manage plugins
summary: Ejemplos rápidos para instalar, listar, desinstalar, actualizar y publicar Plugins de OpenClaw
title: Gestionar plugins
x-i18n:
    generated_at: "2026-05-02T20:52:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La mayoría de los flujos de trabajo de Plugin son unos pocos comandos: buscar, instalar, reiniciar el Gateway,
verificar y desinstalar cuando ya no necesites el Plugin.

## Listar plugins

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
desde la configuración, los manifiestos y el registro de plugins; no demuestra que un
proceso Gateway ya en ejecución haya importado el runtime del Plugin.

## Instalar plugins

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
openclaw plugins install npm:@openclaw/codex@beta

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Después de instalar el código del Plugin, reinicia el Gateway que sirve tus canales:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Usa `inspect --runtime` cuando necesites comprobar que el Plugin registró superficies
de runtime como herramientas, hooks, servicios, métodos de Gateway o comandos de CLI
propiedad del Plugin.

## Actualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Si un Plugin se instaló desde una etiqueta dist-tag de npm como `@beta`, las llamadas posteriores a
`update <plugin-id>` reutilizan esa etiqueta registrada. Pasar una especificación explícita de npm
cambia la instalación rastreada a esa especificación para futuras actualizaciones.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

El segundo comando mueve un Plugin de vuelta a la línea de lanzamiento predeterminada del registro
cuando antes estaba fijado a una versión exacta o una etiqueta.

Cuando `openclaw update` se ejecuta en el canal beta, los registros de Plugin de npm y ClawHub
en la línea predeterminada intentan primero la versión `@beta` correspondiente del Plugin. Si esa versión beta
no existe, OpenClaw vuelve a la especificación predeterminada/latest registrada.
Las versiones exactas y las etiquetas explícitas como `@rc` o `@beta` se conservan.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

La desinstalación elimina la entrada de configuración del Plugin, el registro del índice de plugins, las entradas de lista
de permitidos/denegados y las rutas de carga enlazadas cuando corresponda. Los directorios de instalación gestionados se
eliminan salvo que pases `--keep-files`.

## Publicar plugins

Puedes publicar plugins externos en [ClawHub](https://clawhub.ai), npmjs.com o
ambos.

### Publicar en ClawHub

ClawHub es la superficie pública principal de descubrimiento para plugins de OpenClaw. Ofrece a los
usuarios metadatos buscables, historial de versiones y resultados de análisis del registro antes de la
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

La forma simple aún consulta ClawHub primero.

### Publicar en npmjs.com

Los plugins nativos de npm deben incluir un manifiesto de Plugin y metadatos de punto de entrada de OpenClaw en `package.json`.

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

Los usuarios instalan paquetes solo de npm con:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Si el mismo paquete también está disponible en ClawHub, `npm:` omite la búsqueda en ClawHub y
fuerza la resolución con npm.

## Elección de fuente

- **ClawHub**: úsalo cuando quieras descubrimiento nativo de OpenClaw, resúmenes de análisis,
  versiones y sugerencias de instalación.
- **npmjs.com**: úsalo cuando ya distribuyas paquetes JavaScript o necesites flujos de trabajo de
  dist-tags de npm/registros privados.
- **Git**: úsalo cuando quieras instalar directamente desde una rama, etiqueta o commit.
- **Ruta local**: úsala cuando estés desarrollando o probando un Plugin en la misma
  máquina.

## Relacionado

- [Plugins](/es/tools/plugin) - descripción general y solución de problemas
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de la CLI
- [ClawHub](/es/tools/clawhub) - publicación y operaciones del registro
- [Crear plugins](/es/plugins/building-plugins) - crear un paquete de Plugin
- [Manifiesto de Plugin](/es/plugins/manifest) - manifiesto y metadatos del paquete
