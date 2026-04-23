---
read_when:
    - Instalar o configurar plugins
    - Entender las reglas de detección y carga de plugins
    - Trabajar con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y administrar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T05:21:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 120c96e5b80b6dc9f6c842f9d04ada595f32e21a311128ae053828747a793033
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
herramientas, Skills, voz, transcripción en tiempo real, voz en tiempo real,
comprensión de medios, generación de imágenes, generación de video, obtención web, búsqueda web
y más. Algunos plugins son **core** (se incluyen con OpenClaw) y otros
son **externos** (publicados en npm por la comunidad).

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

  <Step title="Reiniciar Gateway">
    ```bash
    openclaw gateway restart
    ```

    Luego configura en `plugins.entries.\<id\>.config` en tu archivo de configuración.

  </Step>
</Steps>

Si prefieres control nativo por chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, `clawhub:<pkg>`
explícito o especificación de paquete simple (primero ClawHub y luego npm como alternativa).

Si la configuración es inválida, la instalación normalmente falla de forma cerrada y te remite a
`openclaw doctor --fix`. La única excepción de recuperación es una ruta acotada de
reinstalación de plugins incluidos para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.

Las instalaciones empaquetadas de OpenClaw no instalan de forma ansiosa todo el
árbol de dependencias de tiempo de ejecución de cada plugin incluido. Cuando un plugin incluido propiedad de OpenClaw está activo desde
la configuración del plugin, la configuración heredada del canal o un manifiesto habilitado por defecto, la reparación en el arranque
repara solo las dependencias de tiempo de ejecución declaradas de ese plugin antes de importarlo.
Los plugins externos y las rutas de carga personalizadas aún deben instalarse con
`openclaw plugins install`.

## Tipos de plugins

OpenClaw reconoce dos formatos de plugin:

| Formato   | Cómo funciona                                                   | Ejemplos                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de tiempo de ejecución; se ejecuta en proceso       | Plugins oficiales, paquetes npm de la comunidad               |
| **Paquete** | Diseño compatible con Codex/Claude/Cursor; se asigna a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Paquetes de plugins](/es/plugins/bundles) para ver detalles de los paquetes.

Si estás escribiendo un plugin nativo, empieza con [Construcción de plugins](/es/plugins/building-plugins)
y la [Descripción general del SDK de Plugin](/es/plugins/sdk-overview).

## Plugins oficiales

### Instalables (npm)

| Plugin          | Paquete                | Documentación                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/es/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/es/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/es/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/es/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/es/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/es/plugins/zalouser)   |

### Core (incluidos con OpenClaw)

<AccordionGroup>
  <Accordion title="Proveedores de modelos (habilitados de forma predeterminada)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memoria">
    - `memory-core` — búsqueda de memoria incluida (predeterminada mediante `plugins.slots.memory`)
    - `memory-lancedb` — Active Memory a largo plazo con recuperación/captura automática, instalada bajo demanda (establece `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Proveedores de voz (habilitados de forma predeterminada)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — plugin de navegador incluido para la herramienta del navegador, la CLI `openclaw browser`, el método gateway `browser.request`, el tiempo de ejecución del navegador y el servicio predeterminado de control del navegador (habilitado de forma predeterminada; desactívalo antes de reemplazarlo)
    - `copilot-proxy` — puente de VS Code Copilot Proxy (deshabilitado de forma predeterminada)
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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo            | Descripción                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruptor maestro (predeterminado: `true`)                           |
| `allow`          | Lista de permitidos de plugins (opcional)                               |
| `deny`           | Lista de denegados de plugins (opcional; deny tiene prioridad)                     |
| `load.paths`     | Archivos/directorios adicionales de plugins                            |
| `slots`          | Selectores de slots exclusivos (por ejemplo `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruptores + configuración por plugin                               |

Los cambios de configuración **requieren reiniciar el gateway**. Si Gateway se está ejecutando con observación de configuración
+ reinicio en proceso habilitado (la ruta predeterminada `openclaw gateway`), ese
reinicio normalmente se realiza automáticamente poco después de que se aplique la escritura de configuración.

<Accordion title="Estados del plugin: deshabilitado vs ausente vs inválido">
  - **Deshabilitado**: el plugin existe, pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Ausente**: la configuración hace referencia a un id de plugin que la detección no encontró.
  - **Inválido**: el plugin existe, pero su configuración no coincide con el esquema declarado.
</Accordion>

## Detección y prioridad

OpenClaw busca plugins en este orden (la primera coincidencia gana):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths`: rutas explícitas de archivos o directorios.
  </Step>

  <Step title="Extensiones del espacio de trabajo">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensiones globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluidos">
    Se incluyen con OpenClaw. Muchos están habilitados de forma predeterminada (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins
- `plugins.deny` siempre tiene prioridad sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese plugin
- Los plugins con origen en el espacio de trabajo están **deshabilitados de forma predeterminada** (deben habilitarse explícitamente)
- Los plugins incluidos siguen el conjunto predeterminado activado de fábrica, salvo que se reemplacen
- Los slots exclusivos pueden forzar la habilitación del plugin seleccionado para ese slot

## Slots de plugins (categorías exclusivas)

Algunas categorías son exclusivas (solo una puede estar activa a la vez):

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

| Slot            | Qué controla      | Predeterminado             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de Active Memory  | `memory-core`       |
| `contextEngine` | Motor de contexto activo | `legacy` (integrado) |

## Referencia de CLI

```bash
openclaw plugins list                       # inventario compacto
openclaw plugins list --enabled            # solo plugins cargados
openclaw plugins list --verbose            # líneas de detalle por plugin
openclaw plugins list --json               # inventario legible por máquina
openclaw plugins inspect <id>              # detalle profundo
openclaw plugins inspect <id> --json       # legible por máquina
openclaw plugins inspect --all             # tabla de toda la flota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnóstico

openclaw plugins install <package>         # instalar (primero ClawHub, luego npm)
openclaw plugins install clawhub:<pkg>     # instalar solo desde ClawHub
openclaw plugins install <spec> --force    # sobrescribir instalación existente
openclaw plugins install <path>            # instalar desde ruta local
openclaw plugins install -l <path>         # enlazar (sin copia) para desarrollo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar la especificación npm exacta resuelta
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

Los plugins incluidos se distribuyen con OpenClaw. Muchos están habilitados de forma predeterminada (por ejemplo,
proveedores de modelos incluidos, proveedores de voz incluidos y el plugin de navegador
incluido). Otros plugins incluidos aún necesitan `openclaw plugins enable <id>`.

`--force` sobrescribe en el lugar un plugin o paquete de hooks ya instalado. Usa
`openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm
rastreados. No es compatible con `--link`, que reutiliza la ruta fuente en lugar
de copiar sobre un destino de instalación administrado.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar
una especificación de paquete npm con una dist-tag o versión exacta resuelve el nombre del paquete
de vuelta al registro del plugin rastreado y registra la nueva especificación para futuras actualizaciones.
Pasar el nombre del paquete sin versión mueve una instalación fijada exactamente de vuelta a
la línea de versión predeterminada del registro. Si el plugin npm instalado ya coincide
con la versión resuelta y la identidad registrada del artefacto, OpenClaw omite la actualización
sin descargar, reinstalar ni reescribir configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones desde marketplace conservan metadatos del origen del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es un reemplazo de último recurso para falsos
positivos del escáner integrado de código peligroso. Permite que las instalaciones
y actualizaciones de plugins continúen a pesar de hallazgos integrados `critical`, pero aun así
no omite los bloqueos de política `before_install` del plugin ni el bloqueo por fallas de escaneo.

Esta marca CLI se aplica solo a flujos de instalación/actualización de plugins. Las instalaciones
de dependencias de Skills respaldadas por Gateway usan en su lugar la anulación de solicitud correspondiente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo el flujo independiente de descarga/instalación de Skills de ClawHub.

Los paquetes compatibles participan en el mismo flujo de lista/inspección/habilitación/deshabilitación
de plugins. El soporte actual en tiempo de ejecución incluye Skills de paquetes, command-skills de Claude,
valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y `lspServers`
declarados en el manifiesto, command-skills de Cursor y directorios de hooks compatibles de Codex.

`openclaw plugins inspect <id>` también informa las capacidades detectadas del paquete, además de las entradas
de servidores MCP y LSP compatibles o no compatibles para plugins respaldados por paquetes.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude de
`~/.claude/plugins/known_marketplaces.json`, una raíz local de marketplace o una
ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub
o una URL git. Para marketplaces remotos, las entradas de plugins deben permanecer dentro del
repositorio clonado del marketplace y usar solo fuentes de ruta relativa.

Consulta la [referencia de la CLI `openclaw plugins`](/cli/plugins) para ver todos los detalles.

## Descripción general de la API de Plugin

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los
plugins antiguos aún pueden usar `activate(api)` como alias heredado, pero los plugins nuevos deben
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
activación del plugin. El cargador sigue recurriendo a `activate(api)` para plugins antiguos,
pero los plugins incluidos y los nuevos plugins externos deben tratar `register` como el
contrato público.

Métodos comunes de registro:

| Método                                  | Qué registra                 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Proveedor de modelos (LLM)        |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Herramienta del agente                  |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida             |
| `registerSpeechProvider`                | Texto a voz / STT        |
| `registerRealtimeTranscriptionProvider` | STT en streaming               |
| `registerRealtimeVoiceProvider`         | Voz dúplex en tiempo real       |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio        |
| `registerImageGenerationProvider`       | Generación de imágenes            |
| `registerMusicGenerationProvider`       | Generación de música            |
| `registerVideoGenerationProvider`       | Generación de video            |
| `registerWebFetchProvider`              | Proveedor de obtención / extracción web |
| `registerWebSearchProvider`             | Búsqueda web                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos de CLI                |
| `registerContextEngine`                 | Motor de contexto              |
| `registerService`                       | Servicio en segundo plano          |

Comportamiento de guardias de hooks para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_tool_call`: `{ block: false }` es una operación nula y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_install`: `{ block: false }` es una operación nula y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los controladores de menor prioridad.
- `message_sending`: `{ cancel: false }` es una operación nula y no elimina una cancelación anterior.

Para ver el comportamiento completo de hooks tipados, consulta [Descripción general del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Construcción de plugins](/es/plugins/building-plugins) — crea tu propio plugin
- [Paquetes de plugins](/es/plugins/bundles) — compatibilidad con paquetes de Codex/Claude/Cursor
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema del manifiesto
- [Registro de herramientas](/es/plugins/building-plugins#registering-agent-tools) — agrega herramientas de agente en un plugin
- [Componentes internos de plugins](/es/plugins/architecture) — modelo de capacidades y canalización de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
