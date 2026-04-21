---
read_when:
    - Instalando o configurando Plugins
    - Entender las reglas de descubrimiento y carga de Plugins
    - Trabajar con paquetes de Plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instala, configura y gestiona Plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-21T05:19:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Los Plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
tools, Skills, voz, transcripción en tiempo real, voz en tiempo real,
comprensión de multimedia, generación de imágenes, generación de video, obtención web, búsqueda web
y más. Algunos Plugins son **core** (incluidos con OpenClaw), otros
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

    # Desde un directorio o archivo local
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar el Gateway">
    ```bash
    openclaw gateway restart
    ```

    Luego configura en `plugins.entries.\<id\>.config` en tu archivo de configuración.

  </Step>
</Steps>

Si prefieres control nativo del chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, `clawhub:<pkg>`
explícito, o especificación de paquete simple (primero ClawHub y luego respaldo en npm).

Si la configuración no es válida, la instalación normalmente falla en modo cerrado y te remite a
`openclaw doctor --fix`. La única excepción de recuperación es una ruta estrecha de reinstalación de Plugin integrado
para Plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el árbol de dependencias
runtime de cada Plugin integrado. Cuando un Plugin integrado propiedad de OpenClaw está activo desde
la configuración de plugins, configuración heredada de canal o un manifest habilitado por defecto,
el inicio repara solo las dependencias runtime declaradas de ese Plugin antes de importarlo.
Los Plugins externos y rutas de carga personalizadas deben seguir instalándose mediante
`openclaw plugins install`.

## Tipos de Plugins

OpenClaw reconoce dos formatos de Plugin:

| Formato    | Cómo funciona                                                   | Ejemplos                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + módulo runtime; se ejecuta en proceso  | Plugins oficiales, paquetes npm de la comunidad        |
| **Bundle** | diseño compatible con Codex/Claude/Cursor; asignado a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Paquetes de Plugins](/es/plugins/bundles) para detalles de bundles.

Si estás escribiendo un Plugin Native, empieza con [Crear Plugins](/es/plugins/building-plugins)
y el [Resumen del SDK de Plugins](/es/plugins/sdk-overview).

## Plugins oficiales

### Instalables (npm)

| Plugin          | Paquete               | Documentación                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/es/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/es/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/es/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/es/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/es/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/es/plugins/zalouser)   |

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
    - `memory-core` — búsqueda de memoria integrada (predeterminada mediante `plugins.slots.memory`)
    - `memory-lancedb` — memoria a largo plazo con instalación bajo demanda y recuperación/captura automática (establece `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Proveedores de voz (habilitados por defecto)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — Plugin de navegador integrado para la tool de navegador, CLI `openclaw browser`, método Gateway `browser.request`, runtime de navegador y servicio predeterminado de control del navegador (habilitado por defecto; desactívalo antes de sustituirlo)
    - `copilot-proxy` — puente VS Code Copilot Proxy (deshabilitado por defecto)
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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo           | Descripción                                              |
| ----------------| -------------------------------------------------------- |
| `enabled`       | Interruptor maestro (predeterminado: `true`)             |
| `allow`         | Lista de permitidos de Plugins (opcional)               |
| `deny`          | Lista de denegación de Plugins (opcional; deny prevalece) |
| `load.paths`    | Archivos/directorios adicionales de Plugins             |
| `slots`         | Selectores de slot exclusivos (p. ej. `memory`, `contextEngine`) |
| `entries.\<id\>`| Interruptores + configuración por Plugin                |

Los cambios de configuración **requieren reiniciar el Gateway**. Si el Gateway se está ejecutando con
observación de configuración + reinicio en proceso habilitados (la ruta predeterminada de `openclaw gateway`),
ese reinicio normalmente se realiza automáticamente un momento después de que se aplique la escritura de configuración.

<Accordion title="Estados del Plugin: deshabilitado vs ausente vs no válido">
  - **Deshabilitado**: el Plugin existe pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Ausente**: la configuración hace referencia a un ID de Plugin que el descubrimiento no encontró.
  - **No válido**: el Plugin existe pero su configuración no coincide con el esquema declarado.
</Accordion>

## Descubrimiento y precedencia

OpenClaw busca Plugins en este orden (la primera coincidencia prevalece):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` — rutas explícitas de archivo o directorio.
  </Step>

  <Step title="Extensiones del espacio de trabajo">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensiones globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins integrados">
    Incluidos con OpenClaw. Muchos están habilitados por defecto (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

### Reglas de habilitación

- `plugins.enabled: false` desactiva todos los Plugins
- `plugins.deny` siempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` desactiva ese Plugin
- Los Plugins con origen en el espacio de trabajo están **deshabilitados por defecto** (deben habilitarse explícitamente)
- Los Plugins integrados siguen el conjunto interno habilitado por defecto salvo anulación
- Los slots exclusivos pueden forzar la habilitación del Plugin seleccionado para ese slot

## Slots de Plugin (categorías exclusivas)

Algunas categorías son exclusivas (solo una activa a la vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // o "none" para deshabilitar
      contextEngine: "legacy", // o un ID de Plugin
    },
  },
}
```

| Slot            | Qué controla              | Predeterminado       |
| --------------- | ------------------------- | -------------------- |
| `memory`        | Plugin de Active Memory   | `memory-core`        |
| `contextEngine` | Motor de contexto activo  | `legacy` (integrado) |

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
openclaw plugins install <spec> --pin      # registrar especificación npm resuelta exacta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # actualizar un Plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # actualizar todos
openclaw plugins uninstall <id>          # eliminar registros de configuración/instalación
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los Plugins integrados se distribuyen con OpenClaw. Muchos están habilitados por defecto (por ejemplo
proveedores de modelos integrados, proveedores de voz integrados y el Plugin de navegador
integrado). Otros Plugins integrados aún necesitan `openclaw plugins enable <id>`.

`--force` sobrescribe un Plugin instalado existente o un paquete de hooks existente.
No se admite con `--link`, que reutiliza la ruta de origen en lugar de
copiar sobre un destino de instalación gestionado.

`--pin` es solo para npm. No se admite con `--marketplace`, porque
las instalaciones de marketplace conservan metadatos de origen del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos
positivos del analizador integrado de código peligroso. Permite que las instalaciones
y actualizaciones de Plugins continúen pese a hallazgos integrados `critical`, pero aún
no omite bloqueos de política `before_install` del Plugin ni bloqueos por fallo de análisis.

Este indicador de CLI se aplica solo a flujos de instalación/actualización de Plugins. Las instalaciones de
dependencias de Skills con respaldo del Gateway usan en su lugar la anulación de solicitud equivalente
`dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo el flujo separado de descarga/instalación de Skills desde ClawHub.

Los bundles compatibles participan en el mismo flujo de listar/inspeccionar/habilitar/deshabilitar Plugins. La compatibilidad runtime actual incluye Skills de bundle, command-skills de Claude,
valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y
`lspServers` declarados por manifest, command-skills de Cursor y directorios de hooks Codex compatibles.

`openclaw plugins inspect <id>` también informa las capacidades de bundle detectadas junto con
entradas MCP y LSP compatibles o no compatibles para Plugins respaldados por bundle.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude desde
`~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local o
ruta `marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio GitHub o una URL git. Para marketplaces remotos, las entradas de Plugin deben permanecer dentro del
repositorio clonado del marketplace y usar solo fuentes de ruta relativa.

Consulta la [referencia de CLI `openclaw plugins`](/cli/plugins) para ver todos los detalles.

## Resumen de la API de Plugins

Los Plugins Native exportan un objeto de entrada que expone `register(api)`. Los Plugins más antiguos
todavía pueden usar `activate(api)` como alias heredado, pero los Plugins nuevos deben
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
activación del Plugin. El cargador sigue usando `activate(api)` como respaldo para Plugins más antiguos,
pero los Plugins integrados y los nuevos Plugins externos deben tratar `register` como el contrato público.

Métodos de registro comunes:

| Método                                  | Qué registra                 |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Proveedor de modelos (LLM)   |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Tool del agente              |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida       |
| `registerSpeechProvider`                | Texto a voz / STT            |
| `registerRealtimeTranscriptionProvider` | STT en streaming             |
| `registerRealtimeVoiceProvider`         | Voz en tiempo real dúplex    |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio     |
| `registerImageGenerationProvider`       | Generación de imágenes       |
| `registerMusicGenerationProvider`       | Generación de música         |
| `registerVideoGenerationProvider`       | Generación de video          |
| `registerWebFetchProvider`              | Proveedor de obtención/scraping web |
| `registerWebSearchProvider`             | Búsqueda web                 |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Comandos CLI                 |
| `registerContextEngine`                 | Motor de contexto            |
| `registerService`                       | Servicio en segundo plano    |

Comportamiento de protección de hooks para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` es terminal; los controladores de menor prioridad se omiten.
- `before_tool_call`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; los controladores de menor prioridad se omiten.
- `before_install`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; los controladores de menor prioridad se omiten.
- `message_sending`: `{ cancel: false }` no hace nada y no elimina una cancelación anterior.

Para ver el comportamiento tipado completo de los hooks, consulta [Resumen del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Crear Plugins](/es/plugins/building-plugins) — crea tu propio Plugin
- [Paquetes de Plugins](/es/plugins/bundles) — compatibilidad con bundles de Codex/Claude/Cursor
- [Manifest de Plugin](/es/plugins/manifest) — esquema del manifest
- [Registrar Tools](/es/plugins/building-plugins#registering-agent-tools) — agregar tools de agente en un Plugin
- [Internals de Plugin](/es/plugins/architecture) — modelo de capacidades y canalización de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
