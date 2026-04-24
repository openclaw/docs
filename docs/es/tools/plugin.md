---
read_when:
    - Instalar o configurar plugins
    - Comprender las reglas de descubrimiento y carga de plugins
    - Trabajar con bundles de plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y gestionar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-24T09:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos, arneses de agentes, herramientas, Skills, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de video, obtención web, búsqueda web y más. Algunos plugins son **core** (incluidos con OpenClaw) y otros son **externos** (publicados en npm por la comunidad).

## Inicio rápido

<Steps>
  <Step title="Ver qué está cargado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instalar un plugin">
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

    Luego configúralo en `plugins.entries.\<id\>.config` dentro de tu archivo de configuración.

  </Step>
</Steps>

Si prefieres control nativo de chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, `clawhub:<pkg>` explícito o especificación de paquete simple (primero ClawHub, luego fallback a npm).

Si la configuración no es válida, la instalación normalmente falla de forma cerrada y te indica usar `openclaw doctor --fix`. La única excepción de recuperación es una ruta limitada de reinstalación de plugins incluidos para plugins que optan por `openclaw.install.allowInvalidConfigRecovery`.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el árbol de dependencias de tiempo de ejecución de cada plugin incluido. Cuando un plugin incluido propiedad de OpenClaw está activo desde la configuración de plugins, configuración heredada de canal o un manifiesto habilitado por defecto, el arranque repara solo las dependencias de tiempo de ejecución declaradas por ese plugin antes de importarlo. Los plugins externos y las rutas de carga personalizadas todavía deben instalarse mediante `openclaw plugins install`.

## Tipos de plugins

OpenClaw reconoce dos formatos de plugins:

| Formato    | Cómo funciona                                                    | Ejemplos                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + módulo de tiempo de ejecución; se ejecuta en proceso | Plugins oficiales, paquetes npm de la comunidad        |
| **Bundle** | Diseño compatible con Codex/Claude/Cursor; asignado a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Bundles de plugins](/es/plugins/bundles) para ver detalles sobre bundles.

Si estás escribiendo un plugin nativo, empieza con [Crear plugins](/es/plugins/building-plugins) y el [Resumen del SDK de plugins](/es/plugins/sdk-overview).

## Plugins oficiales

### Instalables (npm)

| Plugin          | Paquete                | Documentación                        |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/es/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/es/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/es/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/es/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/es/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/es/plugins/zalouser)   |

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
    - `memory-lancedb` — memoria a largo plazo con instalación bajo demanda y recuperación/captura automáticas (configura `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Proveedores de voz (habilitados por defecto)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — plugin de navegador incluido para la herramienta de navegador, CLI `openclaw browser`, método de Gateway `browser.request`, tiempo de ejecución del navegador y servicio predeterminado de control del navegador (habilitado por defecto; desactívalo antes de reemplazarlo)
    - `copilot-proxy` — puente VS Code Copilot Proxy (deshabilitado por defecto)
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

| Campo           | Descripción                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruptor maestro (predeterminado: `true`)              |
| `allow`          | Lista de permitidos de plugins (opcional)                 |
| `deny`           | Lista de bloqueo de plugins (opcional; deny tiene prioridad) |
| `load.paths`     | Archivos/directorios adicionales de plugins               |
| `slots`          | Selectores de ranuras exclusivas (p. ej. `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruptores + configuración por plugin                  |

Los cambios de configuración **requieren reiniciar el gateway**. Si el Gateway se está ejecutando con vigilancia de configuración + reinicio en proceso habilitados (la ruta predeterminada de `openclaw gateway`), ese reinicio normalmente se realiza automáticamente poco después de que se escriba la configuración.

<Accordion title="Estados del plugin: deshabilitado vs ausente vs no válido">
  - **Deshabilitado**: el plugin existe, pero las reglas de habilitación lo apagaron. La configuración se conserva.
  - **Ausente**: la configuración hace referencia a un id de plugin que el descubrimiento no encontró.
  - **No válido**: el plugin existe, pero su configuración no coincide con el esquema declarado.
</Accordion>

## Descubrimiento y precedencia

OpenClaw explora plugins en este orden (la primera coincidencia gana):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` — rutas explícitas de archivos o directorios.
  </Step>

  <Step title="Plugins del workspace">
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

- `plugins.enabled: false` deshabilita todos los plugins
- `plugins.deny` siempre tiene prioridad sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese plugin
- Los plugins de origen workspace están **deshabilitados por defecto** (deben habilitarse explícitamente)
- Los plugins incluidos siguen el conjunto integrado habilitado por defecto salvo que se sobrescriba
- Las ranuras exclusivas pueden forzar la habilitación del plugin seleccionado para esa ranura
- Algunos plugins incluidos de activación opcional se habilitan automáticamente cuando la configuración nombra una superficie controlada por el plugin, como una referencia de modelo de proveedor, configuración de canal o tiempo de ejecución de arnés
- Las rutas Codex de la familia OpenAI mantienen límites separados de plugins:
  `openai-codex/*` pertenece al Plugin de OpenAI, mientras que el Plugin incluido del servidor de aplicaciones Codex se selecciona mediante `embeddedHarness.runtime: "codex"` o referencias heredadas de modelo `codex/*`

## Ranuras de plugins (categorías exclusivas)

Algunas categorías son exclusivas (solo una activa a la vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // o "none" para deshabilitar
      contextEngine: "legacy", // o un id de plugin
    },
  },
}
```

| Ranura          | Qué controla              | Predeterminado       |
| --------------- | ------------------------- | -------------------- |
| `memory`        | Plugin de memoria activa  | `memory-core`        |
| `contextEngine` | Motor de contexto activo  | `legacy` (integrado) |

## Referencia de CLI

```bash
openclaw plugins list                       # inventario compacto
openclaw plugins list --enabled            # solo plugins cargados
openclaw plugins list --verbose            # líneas detalladas por plugin
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
openclaw plugins update <id-or-npm-spec> # actualizar un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # actualizar todos
openclaw plugins uninstall <id>          # eliminar registros de configuración/instalación
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los plugins incluidos se distribuyen con OpenClaw. Muchos están habilitados por defecto (por ejemplo, proveedores de modelos incluidos, proveedores de voz incluidos y el plugin de navegador incluido). Otros plugins incluidos aún necesitan `openclaw plugins enable <id>`.

`--force` sobrescribe un plugin o paquete de hooks ya instalado en su lugar. Usa `openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm rastreados. No es compatible con `--link`, que reutiliza la ruta de origen en lugar de copiarla a un destino de instalación gestionado.

Cuando `plugins.allow` ya está configurado, `openclaw plugins install` añade el id del plugin instalado a esa lista de permitidos antes de habilitarlo, para que las instalaciones puedan cargarse inmediatamente después del reinicio.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar una especificación de paquete npm con una dist-tag o versión exacta resuelve el nombre del paquete de vuelta al registro rastreado del plugin y registra la nueva especificación para futuras actualizaciones. Pasar el nombre del paquete sin versión mueve una instalación fijada exactamente de vuelta a la línea de versión predeterminada del registro. Si el plugin npm instalado ya coincide con la versión resuelta y la identidad del artefacto registrada, OpenClaw omite la actualización sin descargar, reinstalar ni reescribir la configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque las instalaciones desde marketplace conservan metadatos del origen del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos positivos del escáner integrado de código peligroso. Permite que las instalaciones y actualizaciones de plugins continúen más allá de hallazgos integrados `critical`, pero aún no omite los bloqueos de política `before_install` del plugin ni el bloqueo por fallos del escaneo.

Esta bandera de CLI se aplica solo a los flujos de instalación/actualización de plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan en su lugar la anulación correspondiente de solicitud `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo el flujo independiente de descarga/instalación de Skills desde ClawHub.

Los bundles compatibles participan en el mismo flujo de listar/inspeccionar/habilitar/deshabilitar plugins. El soporte actual en tiempo de ejecución incluye Skills de bundles, command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y `lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks de Codex compatibles.

`openclaw plugins inspect <id>` también informa las capacidades de bundle detectadas, además de las entradas de servidor MCP y LSP compatibles o no compatibles para plugins respaldados por bundles.

Los orígenes de marketplace pueden ser un nombre de marketplace conocido de Claude tomado de `~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local o ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL git. Para marketplaces remotos, las entradas de plugin deben permanecer dentro del repositorio clonado del marketplace y usar solo orígenes de rutas relativas.

Consulta la [referencia de CLI de `openclaw plugins`](/es/cli/plugins) para ver todos los detalles.

## Resumen de la API de plugins

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los plugins antiguos todavía pueden usar `activate(api)` como alias heredado, pero los plugins nuevos deben usar `register`.

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

OpenClaw carga el objeto de entrada y llama a `register(api)` durante la activación del plugin. El cargador todavía usa `activate(api)` como fallback para plugins antiguos, pero los plugins incluidos y los nuevos plugins externos deben tratar `register` como el contrato público.

Métodos comunes de registro:

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
| `registerWebFetchProvider`              | Proveedor de obtención / scraping web |
| `registerWebSearchProvider`             | Búsqueda web                 |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Comandos de CLI              |
| `registerContextEngine`                 | Motor de contexto            |
| `registerService`                       | Servicio en segundo plano    |

Comportamiento de guardas de hooks para hooks tipados del ciclo de vida:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los controladores de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no elimina una cancelación anterior.

Para ver el comportamiento completo de hooks tipados, consulta [Resumen del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Crear plugins](/es/plugins/building-plugins) — crea tu propio plugin
- [Bundles de plugins](/es/plugins/bundles) — compatibilidad con bundles de Codex/Claude/Cursor
- [Manifiesto del Plugin](/es/plugins/manifest) — esquema del manifiesto
- [Registrar herramientas](/es/plugins/building-plugins#registering-agent-tools) — añade herramientas de agente en un plugin
- [Internos del Plugin](/es/plugins/architecture) — modelo de capacidades y flujo de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
