---
read_when:
    - Instalación o configuración de plugins
    - Comprender las reglas de descubrimiento y carga de plugins
    - Trabajo con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y gestionar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:22:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
arneses de agente, herramientas, Skills, voz, transcripción en tiempo real, voz en tiempo real,
comprensión de medios, generación de imágenes, generación de video, obtención web, búsqueda web
y más. Algunos plugins son **core** (se distribuyen con OpenClaw), otros
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

    Después, configura en `plugins.entries.\<id\>.config` dentro de tu archivo de config.

  </Step>
</Steps>

Si prefieres control nativo en chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, `clawhub:<pkg>`
explícito o especificación simple de paquete (ClawHub primero, luego npm como respaldo).

Si la config no es válida, la instalación normalmente falla de forma cerrada y te indica
`openclaw doctor --fix`. La única excepción de recuperación es una ruta limitada de reinstalación de Plugin integrado
para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el árbol de dependencias de runtime
de cada Plugin integrado. Cuando un Plugin integrado propiedad de OpenClaw está activo desde
la config de plugins, una config heredada de canal o un manifiesto habilitado por defecto,
las reparaciones de inicio solo reparan las dependencias de runtime declaradas de ese Plugin antes de importarlo.
La desactivación explícita sigue teniendo prioridad: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` y `channels.<id>.enabled: false`
impiden la reparación automática de dependencias de runtime integradas para ese Plugin/canal.
Los plugins externos y las rutas de carga personalizadas deben seguir instalándose mediante
`openclaw plugins install`.

## Tipos de Plugin

OpenClaw reconoce dos formatos de Plugin:

| Formato    | Cómo funciona                                                    | Ejemplos                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; se ejecuta en proceso | Plugins oficiales, paquetes npm de la comunidad        |
| **Paquete** | diseño compatible con Codex/Claude/Cursor; se asigna a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Paquetes de Plugin](/es/plugins/bundles) para ver detalles sobre paquetes.

Si estás escribiendo un Plugin nativo, empieza con [Creación de plugins](/es/plugins/building-plugins)
y la [Descripción general del SDK de Plugin](/es/plugins/sdk-overview).

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

### Core (distribuidos con OpenClaw)

<AccordionGroup>
  <Accordion title="Proveedores de modelos (habilitados de forma predeterminada)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memoria">
    - `memory-core` — búsqueda de memoria integrada (predeterminado mediante `plugins.slots.memory`)
    - `memory-lancedb` — memoria a largo plazo con instalación bajo demanda y recuperación/captura automática (configura `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Proveedores de voz (habilitados de forma predeterminada)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — Plugin de navegador integrado para la herramienta de navegador, la CLI `openclaw browser`, el método de Gateway `browser.request`, el runtime del navegador y el servicio predeterminado de control del navegador (habilitado de forma predeterminada; deshabilítalo antes de reemplazarlo)
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
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo           | Descripción                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Alternador maestro (predeterminado: `true`)               |
| `allow`          | Allowlist de Plugin (opcional)                            |
| `deny`           | Denylist de Plugin (opcional; deny tiene prioridad)       |
| `load.paths`     | Archivos/directorios adicionales de Plugin                |
| `slots`          | Selectores de slot exclusivos (p. ej. `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternadores + config por Plugin                          |

Los cambios de config **requieren reiniciar el gateway**. Si el Gateway se está ejecutando con
vigilancia de config + reinicio en proceso habilitados (la ruta predeterminada `openclaw gateway`),
ese reinicio normalmente se realiza automáticamente poco después de que se escriba la config.
No existe una ruta compatible de recarga en caliente para el código de runtime nativo de Plugin ni para hooks
de ciclo de vida; reinicia el proceso Gateway que atiende el canal en vivo antes de
esperar que se ejecute código actualizado de `register(api)`, hooks `api.on(...)`, herramientas, servicios o
hooks de proveedor/runtime.

`openclaw plugins list` es una instantánea local del registro/config de plugins. Un
Plugin `enabled` allí significa que el registro persistido y la config actual permiten que el
Plugin participe. No demuestra que un Gateway hijo remoto ya en ejecución
se haya reiniciado con ese mismo código de Plugin. En configuraciones VPS/contenedor con
procesos envoltorio, envía reinicios al proceso real `openclaw gateway run`,
o usa `openclaw gateway restart` contra el Gateway en ejecución.

<Accordion title="Estados de Plugin: deshabilitado vs ausente vs no válido">
  - **Deshabilitado**: el Plugin existe, pero las reglas de habilitación lo desactivaron. La config se conserva.
  - **Ausente**: la config hace referencia a un id de Plugin que el descubrimiento no encontró.
  - **No válido**: el Plugin existe, pero su config no coincide con el esquema declarado.
</Accordion>

## Descubrimiento y precedencia

OpenClaw busca plugins en este orden (la primera coincidencia gana):

<Steps>
  <Step title="Rutas de config">
    `plugins.load.paths` — rutas explícitas a archivos o directorios.
  </Step>

  <Step title="Plugins del espacio de trabajo">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins integrados">
    Se distribuyen con OpenClaw. Muchos están habilitados de forma predeterminada (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins
- `plugins.deny` siempre tiene prioridad sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese Plugin
- Los plugins originados en el espacio de trabajo están **deshabilitados de forma predeterminada** (deben habilitarse explícitamente)
- Los plugins integrados siguen el conjunto interno habilitado por defecto salvo anulación
- Los slots exclusivos pueden forzar la habilitación del Plugin seleccionado para ese slot
- Algunos plugins integrados opcionales se habilitan automáticamente cuando la config nombra una
  superficie propiedad de un Plugin, como una referencia de modelo de proveedor, una config de canal o un
  runtime de arnés
- Las rutas Codex de la familia OpenAI mantienen límites de Plugin separados:
  `openai-codex/*` pertenece al Plugin OpenAI, mientras que el Plugin integrado
  de app-server de Codex se selecciona con `embeddedHarness.runtime: "codex"` o con referencias de modelo heredadas `codex/*`

## Solución de problemas de hooks de runtime

Si un Plugin aparece en `plugins list` pero los efectos laterales de `register(api)` o los hooks
no se ejecutan en el tráfico de chat en vivo, comprueba primero lo siguiente:

- Ejecuta `openclaw gateway status --deep --require-rpc` y confirma que la
  URL, perfil, ruta de config y proceso activos del Gateway sean los que estás editando.
- Reinicia el Gateway en vivo después de cambios de instalación/config/código del Plugin. En contenedores
  envoltorio, PID 1 puede ser solo un supervisor; reinicia o señala el proceso hijo
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` para confirmar registros de hooks y
  diagnósticos. Los hooks de conversación no integrados como `llm_input`,
  `llm_output` y `agent_end` necesitan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para cambiar de modelo, prefiere `before_model_resolve`. Se ejecuta antes de la resolución
  del modelo para los turnos del agente; `llm_output` solo se ejecuta después de que un intento de modelo
  produce salida del asistente.
- Para demostrar el modelo efectivo de la sesión, usa `openclaw sessions` o las
  superficies de sesión/estado del Gateway y, al depurar cargas útiles del proveedor, inicia
  el Gateway con `--raw-stream --raw-stream-path <path>`.

## Slots de Plugin (categorías exclusivas)

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

| Slot            | Qué controla            | Predeterminado       |
| --------------- | ----------------------- | -------------------- |
| `memory`        | Plugin de memoria activo | `memory-core`       |
| `contextEngine` | motor de contexto activo | `legacy` (integrado) |

## Referencia de CLI

```bash
openclaw plugins list                       # inventario compacto
openclaw plugins list --enabled            # solo plugins habilitados
openclaw plugins list --verbose            # líneas de detalle por Plugin
openclaw plugins list --json               # inventario legible por máquina
openclaw plugins inspect <id>              # detalle profundo
openclaw plugins inspect <id> --json       # legible por máquina
openclaw plugins inspect --all             # tabla de toda la flota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos
openclaw plugins registry                  # inspeccionar el estado del registro persistido
openclaw plugins registry --refresh        # reconstruir el registro persistido

openclaw plugins install <package>         # instalar (ClawHub primero, luego npm)
openclaw plugins install clawhub:<pkg>     # instalar solo desde ClawHub
openclaw plugins install <spec> --force    # sobrescribir una instalación existente
openclaw plugins install <path>            # instalar desde una ruta local
openclaw plugins install -l <path>         # enlazar (sin copiar) para desarrollo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar la especificación npm resuelta exacta
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

Los plugins integrados se distribuyen con OpenClaw. Muchos están habilitados de forma predeterminada (por ejemplo,
proveedores de modelos integrados, proveedores de voz integrados y el Plugin
integrado de navegador). Otros plugins integrados siguen necesitando `openclaw plugins enable <id>`.

`--force` sobrescribe en sitio un Plugin o paquete de hooks ya instalado. Usa
`openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de
plugins npm rastreados. No es compatible con `--link`, que reutiliza la ruta de origen en lugar
de copiar sobre un destino de instalación gestionado.

Cuando `plugins.allow` ya está configurado, `openclaw plugins install` añade el
id del Plugin instalado a esa allowlist antes de habilitarlo, para que las instalaciones sean
cargables inmediatamente después del reinicio.

OpenClaw mantiene un registro persistido local de plugins como modelo de lectura en frío para
inventario de plugins, propiedad de contribuciones y planificación del inicio. Los flujos de instalar, actualizar,
desinstalar, habilitar y deshabilitar refrescan ese registro después de cambiar el estado del Plugin.
Si el registro falta, está obsoleto o no es válido, `openclaw plugins registry
--refresh` lo reconstruye a partir del libro duradero de instalaciones, la política de config y
los metadatos de manifiesto/paquete sin cargar módulos de runtime de Plugin.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar
una especificación de paquete npm con una dist-tag o una versión exacta resuelve el nombre del paquete
de vuelta al registro del Plugin rastreado y registra la nueva especificación para futuras actualizaciones.
Pasar el nombre del paquete sin versión devuelve una instalación exacta fijada a
la línea de versión predeterminada del registro. Si el Plugin npm instalado ya coincide
con la versión resuelta y la identidad del artefacto registrada, OpenClaw omite la actualización
sin descargar, reinstalar ni reescribir la config.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones desde marketplace persisten metadatos del origen del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos
positivos del escáner integrado de código peligroso. Permite que instalaciones
y actualizaciones de plugins continúen más allá de hallazgos integrados `critical`, pero aun así
no omite los bloqueos de políticas `before_install` del Plugin ni el bloqueo por fallos de análisis.

Esta bandera de CLI se aplica solo a los flujos de instalación/actualización de plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway
usan en su lugar la anulación equivalente de solicitud `dangerouslyForceUnsafeInstall`, mientras que
`openclaw skills install` sigue siendo el flujo separado de descarga/instalación de Skills de ClawHub.

Los paquetes compatibles participan en el mismo flujo de list/inspect/enable/disable
de plugins. El soporte actual de runtime incluye Skills en paquetes, command-skills de Claude,
valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y `lspServers` declarados en el manifiesto,
command-skills de Cursor y directorios de hooks de Codex compatibles.

`openclaw plugins inspect <id>` también informa las capacidades de paquete detectadas, además de
entradas de servidores MCP y LSP admitidas o no admitidas para plugins respaldados por paquetes.

Los orígenes de marketplace pueden ser un nombre conocido de marketplace de Claude tomado de
`~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local o una ruta a
`marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL git. Para marketplaces remotos, las entradas de Plugin deben permanecer dentro del
repositorio de marketplace clonado y usar solo orígenes de ruta relativa.

Consulta la [referencia de CLI `openclaw plugins`](/es/cli/plugins) para ver todos los detalles.

## Descripción general de la API de Plugin

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los
plugins antiguos pueden seguir usando `activate(api)` como alias heredado, pero los plugins nuevos deben
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
activación del Plugin. El cargador sigue recurriendo a `activate(api)` para plugins
antiguos, pero los plugins integrados y los nuevos plugins externos deben tratar `register` como el
contrato público.

`api.registrationMode` le indica a un Plugin por qué se está cargando su entrada:

| Modo            | Significado                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | Activación de runtime. Registra herramientas, hooks, servicios, comandos, rutas y otros efectos laterales en vivo.                 |
| `discovery`     | Descubrimiento de capacidades de solo lectura. Registra proveedores y metadatos; el código de entrada de Plugin confiable puede cargarse, pero debe omitir efectos laterales en vivo. |
| `setup-only`    | Carga de metadatos de configuración de canal mediante una entrada de configuración ligera.                                          |
| `setup-runtime` | Carga de configuración de canal que también necesita la entrada de runtime.                                                         |
| `cli-metadata`  | Solo recopilación de metadatos de comandos de CLI.                                                                                  |

Las entradas de Plugin que abren sockets, bases de datos, workers en segundo plano o clientes
de larga duración deben proteger esos efectos laterales con `api.registrationMode === "full"`.
Las cargas de descubrimiento se almacenan en caché por separado de las cargas de activación y no sustituyen
el registro del Gateway en ejecución. El descubrimiento no activa, pero tampoco está libre de importación:
OpenClaw puede evaluar la entrada confiable del Plugin o el módulo del Plugin de canal para construir
la instantánea. Mantén los niveles superiores del módulo ligeros y sin efectos laterales, y mueve
clientes de red, subprocesos, listeners, lecturas de credenciales e inicio de servicios detrás de rutas de runtime completo.

Métodos comunes de registro:

| Método                                  | Qué registra                 |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Proveedor de modelos (LLM)   |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Herramienta del agente       |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida       |
| `registerSpeechProvider`                | Texto a voz / STT            |
| `registerRealtimeTranscriptionProvider` | STT en streaming             |
| `registerRealtimeVoiceProvider`         | Voz bidireccional en tiempo real |
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

Comportamiento de guardas de hooks para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_tool_call`: `{ block: false }` es una no operación y no limpia un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_install`: `{ block: false }` es una no operación y no limpia un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los controladores de menor prioridad.
- `message_sending`: `{ cancel: false }` es una no operación y no limpia una cancelación anterior.

Las ejecuciones nativas de app-server de Codex vuelven a conectar los eventos de herramientas nativas de Codex a esta
superficie de hooks. Los plugins pueden bloquear herramientas nativas de Codex mediante `before_tool_call`,
observar resultados mediante `after_tool_call` y participar en aprobaciones
`PermissionRequest` de Codex. El puente aún no reescribe argumentos de herramientas nativas de Codex. El límite exacto del soporte de runtime de Codex se encuentra en el
[contrato de soporte v1 del arnés Codex](/es/plugins/codex-harness#v1-support-contract).

Para ver el comportamiento tipado completo de hooks, consulta la [descripción general del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins) — crea tu propio Plugin
- [Paquetes de Plugin](/es/plugins/bundles) — compatibilidad con paquetes de Codex/Claude/Cursor
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema de manifiesto
- [Registro de herramientas](/es/plugins/building-plugins#registering-agent-tools) — añade herramientas del agente en un Plugin
- [Aspectos internos de Plugin](/es/plugins/architecture) — modelo de capacidades y pipeline de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
