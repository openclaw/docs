---
read_when:
    - Instalar o configurar plugins
    - Comprender las reglas de descubrimiento y carga de plugins
    - Trabajar con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y administrar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T14:08:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
herramientas, Skills, voz, transcripción en tiempo real, voz en tiempo real,
comprensión de medios, generación de imágenes, generación de video, obtención web,
búsqueda web y más. Algunos plugins son **del núcleo** (incluidos con OpenClaw), otros
son **externos** (publicados en npm por la comunidad).

## Inicio rápido

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # Desde npm
    openclaw plugins install @openclaw/voice-call

    # Desde un directorio local o archivo
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Luego configura en `plugins.entries.\<id\>.config` dentro de tu archivo de configuración.

  </Step>
</Steps>

Si prefieres control nativo de chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, 
`clawhub:<pkg>` explícito o especificación simple de paquete (primero ClawHub, luego respaldo en npm).

Si la configuración no es válida, la instalación normalmente falla de forma cerrada y te dirige a
`openclaw doctor --fix`. La única excepción de recuperación es una ruta estrecha de reinstalación
de Plugin integrado para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el árbol de dependencias
de tiempo de ejecución de cada Plugin integrado. Cuando un Plugin integrado propiedad de OpenClaw está activo desde
la configuración del Plugin, configuración heredada de canal o un manifiesto habilitado por defecto, el inicio
repara solo las dependencias de tiempo de ejecución declaradas de ese Plugin antes de importarlo.
Los plugins externos y las rutas de carga personalizadas deben seguir instalándose mediante
`openclaw plugins install`.

## Tipos de plugins

OpenClaw reconoce dos formatos de Plugin:

| Format     | How it works                                                       | Examples                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de tiempo de ejecución; se ejecuta en proceso       | Plugins oficiales, paquetes npm de la comunidad               |
| **Paquete** | Diseño compatible con Codex/Claude/Cursor; asignado a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Paquetes de plugins](/es/plugins/bundles) para más detalles sobre paquetes.

Si estás escribiendo un Plugin nativo, empieza con [Creación de plugins](/es/plugins/building-plugins)
y el [Resumen del SDK de plugins](/es/plugins/sdk-overview).

## Plugins oficiales

### Instalables (npm)

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/es/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/es/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/es/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/es/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/es/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/es/plugins/zalouser)   |

### Del núcleo (incluidos con OpenClaw)

<AccordionGroup>
  <Accordion title="Proveedores de modelos (habilitados de forma predeterminada)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memoria">
    - `memory-core` — búsqueda de memoria integrada (predeterminada mediante `plugins.slots.memory`)
    - `memory-lancedb` — memoria a largo plazo con instalación bajo demanda y recuperación/captura automáticas (establece `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Proveedores de voz (habilitados de forma predeterminada)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — Plugin integrado de navegador para la herramienta del navegador, CLI `openclaw browser`, método del Gateway `browser.request`, tiempo de ejecución del navegador y servicio predeterminado de control del navegador (habilitado de forma predeterminada; desactívalo antes de sustituirlo)
    - `copilot-proxy` — puente de proxy de VS Code Copilot (deshabilitado de forma predeterminada)
  </Accordion>
</AccordionGroup>

¿Buscas plugins de terceros? Consulta [Plugins de la comunidad](/es/plugins/community).

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

| Field            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruptor maestro (predeterminado: `true`)                           |
| `allow`          | Lista de permitidos de plugins (opcional)                               |
| `deny`           | Lista de denegación de plugins (opcional; deny gana)                     |
| `load.paths`     | Archivos/directorios adicionales de plugins                            |
| `slots`          | Selectores exclusivos de ranuras (por ejemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruptores + configuración por Plugin                               |

Los cambios de configuración **requieren reiniciar el Gateway**. Si el Gateway se está ejecutando con
observación de configuración + reinicio en proceso habilitados (la ruta predeterminada de `openclaw gateway`), ese
reinicio normalmente se realiza automáticamente un momento después de que se aplique la escritura de configuración.

<Accordion title="Estados de plugins: deshabilitado vs ausente vs no válido">
  - **Deshabilitado**: el Plugin existe, pero las reglas de habilitación lo apagaron. La configuración se conserva.
  - **Ausente**: la configuración hace referencia a un id de Plugin que el descubrimiento no encontró.
  - **No válido**: el Plugin existe, pero su configuración no coincide con el esquema declarado.
</Accordion>

## Descubrimiento y precedencia

OpenClaw busca plugins en este orden (la primera coincidencia gana):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` — rutas explícitas de archivos o directorios.
  </Step>

  <Step title="Plugins del espacio de trabajo">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins integrados">
    Incluidos con OpenClaw. Muchos están habilitados de forma predeterminada (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins
- `plugins.deny` siempre gana sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese Plugin
- Los plugins con origen en el espacio de trabajo están **deshabilitados de forma predeterminada** (deben habilitarse explícitamente)
- Los plugins integrados siguen el conjunto integrado activado por defecto salvo sobrescritura
- Las ranuras exclusivas pueden forzar la habilitación del Plugin seleccionado para esa ranura

## Ranuras de plugins (categorías exclusivas)

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

| Slot            | What it controls      | Default             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de memoria activo  | `memory-core`       |
| `contextEngine` | Motor de contexto activo | `legacy` (integrado) |

## Referencia de CLI

```bash
openclaw plugins list                       # inventario compacto
openclaw plugins list --enabled            # solo plugins cargados
openclaw plugins list --verbose            # líneas detalladas por Plugin
openclaw plugins list --json               # inventario legible por máquina
openclaw plugins inspect <id>              # detalle profundo
openclaw plugins inspect <id> --json       # legible por máquina
openclaw plugins inspect --all             # tabla de toda la flota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instalar (ClawHub primero, luego npm)
openclaw plugins install clawhub:<pkg>     # instalar solo desde ClawHub
openclaw plugins install <spec> --force    # sobrescribir instalación existente
openclaw plugins install <path>            # instalar desde ruta local
openclaw plugins install -l <path>         # enlazar (sin copia) para desarrollo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar especificación npm exacta resuelta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # actualizar un Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # actualizar todos
openclaw plugins uninstall <id>          # eliminar registros de configuración/instalación
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los plugins integrados se incluyen con OpenClaw. Muchos están habilitados de forma predeterminada (por ejemplo,
proveedores de modelos integrados, proveedores de voz integrados y el Plugin integrado de navegador).
Otros plugins integrados siguen necesitando `openclaw plugins enable <id>`.

`--force` sobrescribe en el lugar un Plugin o paquete de hooks ya instalado. Usa
`openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm
rastreados. No es compatible con `--link`, que reutiliza la ruta de origen en lugar
de copiar sobre un destino de instalación administrado.

Cuando `plugins.allow` ya está establecido, `openclaw plugins install` agrega el
id del Plugin instalado a esa lista de permitidos antes de habilitarlo, de modo que las instalaciones
puedan cargarse inmediatamente después del reinicio.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar
una especificación de paquete npm con una dist-tag o versión exacta resuelve el nombre del paquete
de vuelta al registro del Plugin rastreado y registra la nueva especificación para futuras actualizaciones.
Pasar el nombre del paquete sin versión hace que una instalación fijada a una versión exacta vuelva
a la línea de versión predeterminada del registro. Si el Plugin npm instalado ya coincide
con la versión resuelta y la identidad de artefacto registrada, OpenClaw omite la actualización
sin descargar, reinstalar ni reescribir la configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones desde marketplace conservan metadatos de origen del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una sobrescritura de emergencia para falsos
positivos del escáner integrado de código peligroso. Permite que instalaciones y
actualizaciones de plugins continúen pese a hallazgos `critical` del sistema integrado, pero aun así
no omite los bloqueos de política `before_install` del Plugin ni el bloqueo por fallos de análisis.

Esta bandera de CLI se aplica solo a los flujos de instalación/actualización de plugins. Las instalaciones
de dependencias de Skills respaldadas por Gateway usan en su lugar la sobrescritura de solicitud equivalente
`dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo el flujo separado
de descarga/instalación de Skills desde ClawHub.

Los paquetes compatibles participan en el mismo flujo de listado/inspección/habilitación/deshabilitación
de plugins. La compatibilidad actual en tiempo de ejecución incluye Skills de paquetes, command-skills de Claude,
valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y
`lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks
compatibles con Codex.

`openclaw plugins inspect <id>` también informa capacidades de paquetes detectadas, además de
entradas compatibles o no compatibles de servidores MCP y LSP para plugins respaldados por paquetes.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude desde
`~/.claude/plugins/known_marketplaces.json`, una raíz local de marketplace o una
ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub
o una URL git. Para marketplaces remotos, las entradas de plugins deben permanecer dentro del
repositorio clonado del marketplace y usar solo fuentes de rutas relativas.

Consulta la [referencia de CLI de `openclaw plugins`](/es/cli/plugins) para ver todos los detalles.

## Resumen de la API de plugins

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los
plugins antiguos todavía pueden usar `activate(api)` como alias heredado, pero los plugins nuevos deben
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
activación del Plugin. El cargador sigue recurriendo a `activate(api)` para plugins más antiguos,
pero los plugins integrados y los plugins externos nuevos deben tratar `register` como el contrato
público.

Métodos comunes de registro:

| Method                                  | What it registers           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Proveedor de modelos (LLM)        |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Herramienta de agente                  |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida             |
| `registerSpeechProvider`                | Texto a voz / STT        |
| `registerRealtimeTranscriptionProvider` | STT en streaming               |
| `registerRealtimeVoiceProvider`         | Voz en tiempo real dúplex       |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio        |
| `registerImageGenerationProvider`       | Generación de imágenes            |
| `registerMusicGenerationProvider`       | Generación de música            |
| `registerVideoGenerationProvider`       | Generación de video            |
| `registerWebFetchProvider`              | Proveedor de obtención / raspado web |
| `registerWebSearchProvider`             | Búsqueda web                  |
| `registerHttpRoute`                     | Extremo HTTP               |
| `registerCommand` / `registerCli`       | Comandos de CLI                |
| `registerContextEngine`                 | Motor de contexto              |
| `registerService`                       | Servicio en segundo plano          |

Comportamiento de las guardas de hooks para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los manejadores de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los manejadores de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los manejadores de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no elimina una cancelación anterior.

Para el comportamiento completo de hooks tipados, consulta [Resumen del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins) — crea tu propio Plugin
- [Paquetes de plugins](/es/plugins/bundles) — compatibilidad con paquetes Codex/Claude/Cursor
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema de manifiesto
- [Registrar herramientas](/es/plugins/building-plugins#registering-agent-tools) — agrega herramientas de agente en un Plugin
- [Aspectos internos del Plugin](/es/plugins/architecture) — modelo de capacidades y canalización de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
