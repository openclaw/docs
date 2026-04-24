---
read_when:
    - Instalar o configurar Plugins
    - Entender las reglas de descubrimiento y carga de Plugins
    - Trabajar con paquetes de Plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y gestionar Plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-24T05:55:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2cf5cb6146ae5e52a32201ee08c03211dbea2313b884c696307abc56d3f9cbf
    source_path: tools/plugin.md
    workflow: 15
---

Los Plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
herramientas, Skills, voz, transcripción en tiempo real, voz en tiempo real,
comprensión de medios, generación de imágenes, generación de video, web fetch, web
search y más. Algunos Plugins son **core** (incluidos con OpenClaw), otros
son **externos** (publicados en npm por la comunidad).

## Inicio rápido

<Steps>
  <Step title="Ver qué está cargado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instalar un Plugin">
    ```bash
    # Desde npm
    openclaw plugins install @openclaw/voice-call

    # Desde un directorio local o archivo
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar el Gateway">
    ```bash
    openclaw gateway restart
    ```

    Luego configura en `plugins.entries.\<id\>.config` dentro de tu archivo de configuración.

  </Step>
</Steps>

Si prefieres control nativo desde chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, `clawhub:<pkg>` explícito o especificación de paquete sin prefijo (primero ClawHub y luego fallback a npm).

Si la configuración no es válida, la instalación normalmente falla de forma cerrada y te indica
`openclaw doctor --fix`. La única excepción de recuperación es una ruta estrecha de
reinstalación de Plugins incluidos para Plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el árbol de
dependencias de runtime de cada Plugin incluido. Cuando un Plugin incluido propiedad de OpenClaw está activo desde
la configuración de Plugins, la configuración heredada de canales o un manifiesto habilitado por defecto, el
inicio repara solo las dependencias de runtime declaradas de ese Plugin antes de importarlo.
Los Plugins externos y las rutas de carga personalizadas deben seguir instalándose mediante
`openclaw plugins install`.

## Tipos de Plugins

OpenClaw reconoce dos formatos de Plugin:

| Formato    | Cómo funciona                                                     | Ejemplos                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; se ejecuta en proceso | Plugins oficiales, paquetes npm de la comunidad        |
| **Bundle** | Diseño compatible con Codex/Claude/Cursor; se asigna a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Bundles de Plugins](/es/plugins/bundles) para más detalles sobre bundles.

Si estás escribiendo un Plugin nativo, empieza por [Crear Plugins](/es/plugins/building-plugins)
y la [Descripción general del SDK de Plugins](/es/plugins/sdk-overview).

## Plugins oficiales

### Instalables (npm)

| Plugin          | Paquete                | Documentación                        |
| --------------- | ---------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/es/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/es/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/es/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/es/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`       | [Zalo](/es/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/es/plugins/zalouser)  |

### Core (incluidos con OpenClaw)

<AccordionGroup>
  <Accordion title="Proveedores de modelos (habilitados por defecto)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memoria">
    - `memory-core` — búsqueda de memoria incluida (predeterminada mediante `plugins.slots.memory`)
    - `memory-lancedb` — memoria a largo plazo de instalación bajo demanda con recuperación/captura automática (establece `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Proveedores de voz (habilitados por defecto)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — Plugin de navegador incluido para la herramienta de navegador, la CLI `openclaw browser`, el método de gateway `browser.request`, el runtime del navegador y el servicio de control de navegador predeterminado (habilitado por defecto; desactívalo antes de reemplazarlo)
    - `copilot-proxy` — puente de Proxy de VS Code Copilot (deshabilitado por defecto)
  </Accordion>
</AccordionGroup>

¿Buscas Plugins de terceros? Consulta [Plugins de la comunidad](/es/plugins/community).

## Configuración

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo            | Descripción                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruptor principal (predeterminado: `true`)            |
| `allow`          | Lista de permitidos de Plugins (opcional)                 |
| `deny`           | Lista de denegados de Plugins (opcional; deny prevalece)  |
| `load.paths`     | Archivos/directorios adicionales de Plugins               |
| `slots`          | Selectores de slots exclusivos (p. ej. `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruptores + configuración por Plugin                  |

Los cambios de configuración **requieren reiniciar el gateway**. Si el Gateway se está ejecutando con
watch de configuración + reinicio en proceso habilitados (la ruta predeterminada `openclaw gateway`),
ese reinicio normalmente se realiza automáticamente un momento después de que se escriba la configuración.

<Accordion title="Estados del Plugin: deshabilitado vs ausente vs no válido">
  - **Deshabilitado**: el Plugin existe pero las reglas de habilitación lo apagaron. La configuración se conserva.
  - **Ausente**: la configuración hace referencia a un id de Plugin que el descubrimiento no encontró.
  - **No válido**: el Plugin existe pero su configuración no coincide con el esquema declarado.
</Accordion>

## Descubrimiento y precedencia

OpenClaw busca Plugins en este orden (la primera coincidencia prevalece):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` — rutas explícitas de archivo o directorio.
  </Step>

  <Step title="Plugins del espacio de trabajo">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluidos">
    Incluidos con OpenClaw. Muchos están habilitados por defecto (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los Plugins
- `plugins.deny` siempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese Plugin
- Los Plugins originados en el espacio de trabajo están **deshabilitados por defecto** (deben habilitarse explícitamente)
- Los Plugins incluidos siguen el conjunto integrado habilitado por defecto a menos que se sobrescriba
- Los slots exclusivos pueden forzar la habilitación del Plugin seleccionado para ese slot

## Slots de Plugins (categorías exclusivas)

Algunas categorías son exclusivas (solo una activa a la vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // o "none" para deshabilitar
      contextEngine: "legacy", // o un id de Plugin
    },
  },
}
```

| Slot            | Qué controla               | Predeterminado     |
| --------------- | -------------------------- | ------------------ |
| `memory`        | Plugin de memoria activo   | `memory-core`      |
| `contextEngine` | Motor de contexto activo   | `legacy` (integrado) |

## Referencia de CLI

```bash
openclaw plugins list                       # inventario compacto
openclaw plugins list --enabled            # solo Plugins cargados
openclaw plugins list --verbose            # líneas de detalle por Plugin
openclaw plugins list --json               # inventario legible por máquina
openclaw plugins inspect <id>              # detalle profundo
openclaw plugins inspect <id> --json       # legible por máquina
openclaw plugins inspect --all             # tabla de toda la flota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instalar (primero ClawHub, luego npm)
openclaw plugins install clawhub:<pkg>     # instalar solo desde ClawHub
openclaw plugins install <spec> --force    # sobrescribir instalación existente
openclaw plugins install <path>            # instalar desde ruta local
openclaw plugins install -l <path>         # enlazar (sin copiar) para desarrollo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar la spec npm resuelta exacta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # actualizar un Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # actualizar todos
openclaw plugins uninstall <id>          # eliminar registros de config/instalación
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los Plugins incluidos se distribuyen con OpenClaw. Muchos están habilitados por defecto (por ejemplo,
proveedores de modelos incluidos, proveedores de voz incluidos y el Plugin de navegador
incluido). Otros Plugins incluidos siguen necesitando `openclaw plugins enable <id>`.

`--force` sobrescribe in situ un Plugin instalado o un paquete de hooks existente. Usa
`openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de Plugins npm
rastreados. No es compatible con `--link`, que reutiliza la ruta de origen en lugar
de copiar sobre un destino de instalación gestionado.

Cuando `plugins.allow` ya está establecido, `openclaw plugins install` añade el
id del Plugin instalado a esa lista de permitidos antes de habilitarlo, de modo que las instalaciones sean
cargables inmediatamente después del reinicio.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar
una spec de paquete npm con una dist-tag o versión exacta resuelve el nombre del paquete
de vuelta al registro del Plugin rastreado y registra la nueva spec para futuras actualizaciones.
Pasar el nombre del paquete sin versión devuelve una instalación fijada exacta
a la línea de lanzamiento predeterminada del registro. Si el Plugin npm instalado ya coincide
con la versión resuelta y la identidad de artefacto registrada, OpenClaw omite la actualización
sin descargar, reinstalar ni reescribir la configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones de marketplace conservan metadatos de origen del marketplace en lugar de una spec npm.

`--dangerously-force-unsafe-install` es una sobrescritura de emergencia para falsos
positivos del escáner integrado de código peligroso. Permite que las instalaciones
y actualizaciones de Plugins continúen más allá de hallazgos integrados `critical`, pero aun así
no omite los bloqueos de política `before_install` del Plugin ni el bloqueo por fallo de escaneo.

Este flag de CLI se aplica solo a los flujos de instalación/actualización de Plugins. Las
instalaciones de dependencias de Skills respaldadas por Gateway usan en su lugar la sobrescritura de solicitud correspondiente
`dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo el flujo separado
de descarga/instalación de Skills de ClawHub.

Los bundles compatibles participan en el mismo flujo de listar/inspeccionar/habilitar/deshabilitar
Plugins. La compatibilidad actual de runtime incluye Skills de bundle, command-skills de Claude,
valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y
`lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks
compatibles de Codex.

`openclaw plugins inspect <id>` también informa las capacidades de bundle detectadas además de
las entradas de servidor MCP y LSP compatibles o no compatibles para Plugins respaldados por bundle.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude desde
`~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local o una ruta a
`marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio
de GitHub o una URL git. Para marketplaces remotos, las entradas de Plugin deben permanecer dentro del
repositorio de marketplace clonado y usar solo fuentes de ruta relativa.

Consulta la [referencia de CLI de `openclaw plugins`](/es/cli/plugins) para ver todos los detalles.

## Resumen de la API de Plugins

Los Plugins nativos exportan un objeto de entrada que expone `register(api)`. Los
Plugins antiguos todavía pueden usar `activate(api)` como alias heredado, pero los Plugins nuevos deben
usar `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw carga el objeto de entrada y llama a `register(api)` durante la
activación del Plugin. El cargador sigue recurriendo a `activate(api)` para Plugins más antiguos,
pero los Plugins incluidos y los nuevos Plugins externos deben tratar `register` como el contrato público.

Métodos de registro comunes:

| Método                                  | Qué registra                 |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Proveedor de modelos (LLM)   |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Herramienta de agente        |
| `registerHook` / `on(...)`              | Hooks del ciclo de vida      |
| `registerSpeechProvider`                | Texto a voz / STT            |
| `registerRealtimeTranscriptionProvider` | STT en streaming             |
| `registerRealtimeVoiceProvider`         | Voz dúplex en tiempo real    |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio     |
| `registerImageGenerationProvider`       | Generación de imágenes       |
| `registerMusicGenerationProvider`       | Generación de música         |
| `registerVideoGenerationProvider`       | Generación de video          |
| `registerWebFetchProvider`              | Proveedor de web fetch / scrape |
| `registerWebSearchProvider`             | Web search                   |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Comandos CLI                 |
| `registerContextEngine`                 | Motor de contexto            |
| `registerService`                       | Servicio en segundo plano    |

Comportamiento de guardas de Hooks para Hooks tipados del ciclo de vida:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los manejadores de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no limpia un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los manejadores de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no limpia un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los manejadores de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no limpia una cancelación anterior.

Para el comportamiento completo de Hooks tipados, consulta [Resumen del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Crear Plugins](/es/plugins/building-plugins) — crea tu propio Plugin
- [Bundles de Plugins](/es/plugins/bundles) — compatibilidad con bundles de Codex/Claude/Cursor
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema del manifiesto
- [Registrar herramientas](/es/plugins/building-plugins#registering-agent-tools) — añade herramientas de agente en un Plugin
- [Internals de Plugins](/es/plugins/architecture) — modelo de capacidades y pipeline de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
