---
read_when:
    - Quieres ejemplos rápidos para instalar, listar, actualizar o desinstalar un Plugin
    - Quieres elegir entre ClawHub y la distribución de plugins mediante npm
    - Está publicando un paquete de Plugin
sidebarTitle: Manage plugins
summary: Ejemplos rápidos para instalar, listar, desinstalar, actualizar y publicar plugins de OpenClaw
title: Administrar plugins
x-i18n:
    generated_at: "2026-05-11T20:44:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La mayoría de los flujos de trabajo de plugins son unos pocos comandos: buscar, instalar, reiniciar el Gateway,
verificar y desinstalar cuando ya no necesites el plugin.

## Listar plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--json` para scripts. Incluye diagnósticos del registro y el
`dependencyStatus` estático de cada plugin cuando el paquete del plugin declara
`dependencies` u `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` es una comprobación de inventario en frío. Muestra lo que OpenClaw puede descubrir
a partir de la configuración, los manifiestos y el registro de plugins; no demuestra que un
proceso Gateway ya en ejecución haya importado el runtime del plugin.

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
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Después de instalar el código del plugin, reinicia el Gateway que sirve tus canales:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Usa `inspect --runtime` cuando necesites una prueba de que el plugin registró superficies
de runtime como herramientas, hooks, servicios, métodos de Gateway o comandos de CLI
propiedad del plugin.

## Actualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Si un plugin se instaló desde un dist-tag de npm como `@beta`, las llamadas posteriores a
`update <plugin-id>` reutilizan esa etiqueta registrada. Pasar una especificación npm explícita
cambia la instalación rastreada a esa especificación para futuras actualizaciones.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

El segundo comando devuelve un plugin a la línea de versiones predeterminada del registro
cuando antes estaba fijado a una versión o etiqueta exacta.

Cuando `openclaw update` se ejecuta en el canal beta, los registros de plugins de npm y ClawHub
en la línea predeterminada intentan primero la versión `@beta` del plugin correspondiente. Si esa versión beta
no existe, OpenClaw vuelve a la especificación predeterminada/latest registrada.
Para plugins de npm, OpenClaw también vuelve atrás cuando el paquete beta existe pero no supera
la validación de instalación. Las versiones exactas y las etiquetas explícitas como `@rc` o `@beta`
se conservan.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

La desinstalación elimina la entrada de configuración del plugin, el registro del índice de plugins, las entradas
de listas de permitidos/denegados y las rutas de carga enlazadas cuando corresponde. Los directorios de instalación
gestionados se eliminan salvo que pases `--keep-files`.

En modo Nix (`OPENCLAW_NIX_MODE=1`), los comandos para instalar, actualizar, desinstalar, habilitar
y deshabilitar plugins están desactivados. Gestiona esas opciones en la fuente de Nix de
la instalación; para nix-openclaw, usa el
[Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en agentes.

## Publicar plugins

Puedes publicar plugins externos en [ClawHub](https://clawhub.ai), npmjs.com o
ambos.

### Publicar en ClawHub

ClawHub es la superficie pública principal de descubrimiento para plugins de OpenClaw. Ofrece a
los usuarios metadatos buscables, historial de versiones y resultados de escaneo del registro antes de
la instalación.

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

Los plugins npm nativos deben incluir un manifiesto de plugin y metadatos de punto de entrada
de OpenClaw en `package.json`.

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
fuerza la resolución mediante npm.

## Elección de fuente

- **ClawHub**: úsalo cuando quieras descubrimiento nativo de OpenClaw, resúmenes de escaneo,
  versiones y sugerencias de instalación.
- **npmjs.com**: úsalo cuando ya distribuyas paquetes JavaScript o necesites flujos de trabajo
  de dist-tags/registro privado de npm.
- **Git**: úsalo cuando quieras instalar directamente desde una rama, etiqueta o commit.
- **Ruta local**: úsala cuando estés desarrollando o probando un plugin en la misma
  máquina.

## Relacionado

- [Plugins](/es/tools/plugin) - resumen y solución de problemas
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de la CLI
- [ClawHub](/es/clawhub/cli) - publicación y operaciones del registro
- [Crear plugins](/es/plugins/building-plugins) - crear un paquete de plugin
- [Manifiesto de plugin](/es/plugins/manifest) - manifiesto y metadatos de paquete
