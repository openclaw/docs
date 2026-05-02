---
read_when:
    - Instalar o configurar Plugins
    - Comprender las reglas de descubrimiento y carga de Plugin
    - Trabajar con paquetes de Plugin compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instala, configura y gestiona plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T05:38:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
arneses de agentes, herramientas, Skills, voz, transcripción en tiempo real, voz en
tiempo real, comprensión de medios, generación de imágenes, generación de video, obtención web,
búsqueda web y más. Algunos plugins son **core** (incluidos con OpenClaw), otros
son **externos**. La mayoría de los plugins externos se publican y descubren a través de
[ClawHub](/es/tools/clawhub). Npm sigue siendo compatible para instalaciones directas y para un
conjunto temporal de paquetes de plugins propiedad de OpenClaw mientras finaliza esa migración.

## Inicio rápido

<Steps>
  <Step title="Ver qué está cargado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instalar un plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
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

  <Step title="Verificar el plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` cuando necesites demostrar herramientas registradas, servicios, métodos de Gateway,
    hooks o comandos de CLI propiedad del plugin. `inspect` simple es una comprobación fría
    de manifiesto/registro y evita intencionalmente importar el runtime del plugin.

  </Step>
</Steps>

Si prefieres control nativo del chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

La ruta de instalación usa el mismo resolver que la CLI: ruta/archivo local, `clawhub:<pkg>` explícito,
`npm:<pkg>` explícito, `git:<repo>` explícito o especificación de paquete simple
(ClawHub primero, luego fallback a npm).

Si la configuración no es válida, la instalación normalmente falla de forma cerrada y te remite a
`openclaw doctor --fix`. La única excepción de recuperación es una ruta estrecha de reinstalación de plugins incluidos
para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.
Durante el arranque del Gateway, la configuración no válida de un plugin queda aislada a ese plugin:
el arranque registra el problema de `plugins.entries.<id>.config`, omite ese plugin durante
la carga y mantiene otros plugins y canales en línea. Ejecuta `openclaw doctor --fix`
para poner en cuarentena la configuración incorrecta del plugin deshabilitando esa entrada de plugin y eliminando
su payload de configuración no válido; la copia de seguridad de configuración normal conserva los valores anteriores.
Cuando una configuración de canal referencia un plugin que ya no se puede descubrir, pero el
mismo id de plugin obsoleto permanece en la configuración de plugins o registros de instalación, el arranque del Gateway
registra advertencias y omite ese canal en lugar de bloquear todos los demás canales.
Ejecuta `openclaw doctor --fix` para eliminar las entradas obsoletas de canal/plugin; las claves de
canal desconocidas sin evidencia de plugin obsoleto siguen fallando la validación para que los errores tipográficos permanezcan
visibles.
Si se establece `plugins.enabled: false`, las referencias de plugin obsoletas se tratan como inertes:
el arranque del Gateway omite el trabajo de descubrimiento/carga de plugins y `openclaw doctor` conserva
la configuración de plugin deshabilitada en lugar de eliminarla automáticamente. Vuelve a habilitar los plugins antes de
ejecutar la limpieza de doctor si quieres eliminar ids de plugin obsoletos.

La instalación de dependencias de plugins ocurre solo durante flujos explícitos de instalación/actualización o
reparación de doctor. El arranque del Gateway, la recarga de configuración y la inspección de runtime no
ejecutan gestores de paquetes ni reparan árboles de dependencias. Los plugins locales ya deben
tener sus dependencias instaladas, mientras que los plugins de npm, git y ClawHub se
instalan bajo las raíces de plugins gestionadas por OpenClaw. Las dependencias de npm pueden elevarse
dentro de la raíz npm gestionada de OpenClaw; la instalación/actualización escanea esa raíz gestionada antes de
confiar y la desinstalación elimina paquetes gestionados por npm mediante npm. Los plugins externos
y las rutas de carga personalizadas todavía deben instalarse mediante `openclaw plugins install`.
Consulta [Resolución de dependencias de Plugin](/es/plugins/dependency-resolution) para el
ciclo de vida durante la instalación.

Los checkouts de código fuente son workspaces de pnpm. Si clonas OpenClaw para modificar plugins incluidos,
ejecuta `pnpm install`; OpenClaw entonces carga los plugins incluidos desde
`extensions/<id>` para que las ediciones y dependencias locales del paquete se usen directamente.
Las instalaciones raíz simples de npm son para OpenClaw empaquetado, no para desarrollo en
checkout de código fuente.

## Tipos de Plugin

OpenClaw reconoce dos formatos de plugin:

| Formato    | Cómo funciona                                                     | Ejemplos                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; se ejecuta en proceso  | Plugins oficiales, paquetes npm comunitarios           |
| **Bundle** | Diseño compatible con Codex/Claude/Cursor; asignado a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Bundles de Plugin](/es/plugins/bundles) para detalles sobre bundles.

Si estás escribiendo un plugin nativo, empieza con [Crear Plugins](/es/plugins/building-plugins)
y la [Descripción general del SDK de Plugin](/es/plugins/sdk-overview).

## Puntos de entrada de paquete

Los paquetes npm de plugins nativos deben declarar `openclaw.extensions` en `package.json`.
Cada entrada debe permanecer dentro del directorio del paquete y resolver a un archivo de
runtime legible, o a un archivo fuente TypeScript con un par JavaScript compilado
inferido, como `src/index.ts` a `dist/index.js`.

Usa `openclaw.runtimeExtensions` cuando los archivos de runtime publicados no vivan en las
mismas rutas que las entradas de origen. Cuando está presente, `runtimeExtensions` debe contener
exactamente una entrada por cada entrada de `extensions`. Las listas que no coinciden hacen fallar la instalación y
el descubrimiento de plugins en lugar de volver silenciosamente a las rutas de origen. Si también
publicas `openclaw.setupEntry`, usa `openclaw.runtimeSetupEntry` para su par
JavaScript compilado; ese archivo es obligatorio cuando se declara.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugins oficiales

### Paquetes npm propiedad de OpenClaw durante la migración

ClawHub es la ruta principal de distribución para la mayoría de los plugins. Las versiones empaquetadas actuales
de OpenClaw ya incluyen muchos plugins oficiales, por lo que estos no necesitan
instalaciones npm separadas en configuraciones normales. Hasta que todos los plugins propiedad de OpenClaw
hayan migrado a ClawHub, OpenClaw todavía publica algunos paquetes de plugins `@openclaw/*` en
npm para instalaciones antiguas/personalizadas y flujos de trabajo npm directos.

Si npm informa que un paquete de plugin `@openclaw/*` está obsoleto, esa versión del paquete
proviene de una línea de paquetes externos anterior. Usa el plugin incluido de
OpenClaw actual o un checkout local hasta que se publique un paquete npm más reciente.

| Plugin          | Paquete                    | Documentación                              |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/es/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/es/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/es/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/es/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/es/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/es/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/es/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/es/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/es/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/es/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/es/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/es/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/es/plugins/zalouser)         |

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
    - `memory-lancedb` — memoria a largo plazo respaldada por LanceDB con recuperación/captura automática (establece `plugins.slots.memory = "memory-lancedb"`)

    Consulta [Memory LanceDB](/es/plugins/memory-lancedb) para configuración de embeddings compatible con OpenAI,
    ejemplos de Ollama, límites de recuperación y solución de problemas.

  </Accordion>

  <Accordion title="Proveedores de voz (habilitados de forma predeterminada)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — plugin de navegador incluido para la herramienta de navegador, CLI `openclaw browser`, método de Gateway `browser.request`, runtime de navegador y servicio predeterminado de control de navegador (habilitado de forma predeterminada; deshabilítalo antes de reemplazarlo)
    - `copilot-proxy` — puente de VS Code Copilot Proxy (deshabilitado de forma predeterminada)

  </Accordion>
</AccordionGroup>

¿Buscas plugins de terceros? Consulta [Plugins comunitarios](/es/plugins/community).

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
| `enabled`        | Interruptor maestro (predeterminado: `true`)              |
| `allow`          | Lista de permitidos de plugins (opcional)                 |
| `deny`           | Lista de denegados de plugins (opcional; deny prevalece)  |
| `load.paths`     | Archivos/directorios de plugins adicionales               |
| `slots`          | Selectores de slots exclusivos (p. ej., `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggles + configuración por plugin                        |

`plugins.allow` es exclusiva. Cuando no está vacía, solo los plugins listados pueden cargarse
o exponer herramientas, incluso si `tools.allow` contiene `"*"` o un nombre específico de
herramienta propiedad de un plugin. Si una lista de permitidos de herramientas referencia herramientas de plugins, añade los ids de los plugins propietarios
a `plugins.allow` o elimina `plugins.allow`; `openclaw doctor` advierte sobre esta
forma.

Los cambios de configuración **requieren reiniciar el gateway**. Si el Gateway se está ejecutando con vigilancia de configuración
+ reinicio en proceso habilitado (la ruta predeterminada de `openclaw gateway`), ese
reinicio normalmente se realiza automáticamente un momento después de que se escriba la configuración.
No hay una ruta de recarga en caliente compatible para código de runtime de plugins nativos o hooks de ciclo de vida;
reinicia el proceso del Gateway que sirve el canal activo antes de
esperar que se ejecute código `register(api)` actualizado, hooks `api.on(...)`, herramientas, servicios o
hooks de proveedor/runtime.

`openclaw plugins list` es una instantánea del registro/configuración local de plugins. Un
plugin `enabled` allí significa que el registro persistido y la configuración actual permiten que el
plugin participe. No demuestra que un proceso hijo de Gateway remoto que ya está en ejecución
se haya reiniciado con el mismo código de plugin. En configuraciones VPS/contenedor con
procesos envoltorio, envía los reinicios al proceso real `openclaw gateway run`,
o usa `openclaw gateway restart` contra el Gateway en ejecución.

<Accordion title="Estados de Plugin: deshabilitado vs faltante vs inválido">
  - **Deshabilitado**: el plugin existe, pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Faltante**: la configuración hace referencia a un id de plugin que el descubrimiento no encontró.
  - **Inválido**: el plugin existe, pero su configuración no coincide con el esquema declarado. El inicio de Gateway omite solo ese plugin; `openclaw doctor --fix` puede poner en cuarentena la entrada inválida deshabilitándola y eliminando su carga de configuración.

</Accordion>

## Descubrimiento y precedencia

OpenClaw busca plugins en este orden (la primera coincidencia gana):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` — rutas explícitas de archivo o directorio. Las rutas que apuntan
    de vuelta a los propios directorios de plugins incluidos empaquetados de OpenClaw se ignoran;
    ejecuta `openclaw doctor --fix` para eliminar esos alias obsoletos.
  </Step>

  <Step title="Plugins del espacio de trabajo">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluidos">
    Distribuidos con OpenClaw. Muchos están habilitados de forma predeterminada (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

Las instalaciones empaquetadas y las imágenes Docker normalmente resuelven los plugins incluidos desde el
árbol compilado `dist/extensions`. Si un directorio de código fuente de un plugin incluido se
monta mediante bind sobre la ruta de código fuente empaquetada correspondiente, por ejemplo
`/app/extensions/synology-chat`, OpenClaw trata ese directorio de código fuente montado
como una superposición de código fuente incluido y lo descubre antes del paquete
`/app/dist/extensions/synology-chat` empaquetado. Esto mantiene funcionando los bucles de contenedor
de mantenedores sin volver a cambiar cada plugin incluido al código fuente TypeScript.
Configura `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forzar los paquetes dist empaquetados
incluso cuando existan montajes de superposición de código fuente.

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins y omite el trabajo de descubrimiento/carga de plugins
- `plugins.deny` siempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese plugin
- Los plugins originados en el espacio de trabajo están **deshabilitados de forma predeterminada** (deben habilitarse explícitamente)
- Los plugins incluidos siguen el conjunto integrado habilitado por defecto, salvo que se sobrescriba
- Los slots exclusivos pueden forzar la habilitación del plugin seleccionado para ese slot
- Algunos plugins incluidos de activación opcional se habilitan automáticamente cuando la configuración nombra una
  superficie propiedad del plugin, como una referencia de modelo de proveedor, configuración de canal o runtime
  de arnés
- La configuración obsoleta de plugins se conserva mientras `plugins.enabled: false` está activo;
  vuelve a habilitar los plugins antes de ejecutar la limpieza de doctor si quieres eliminar ids obsoletos
- Las rutas Codex de la familia OpenAI mantienen límites de plugin separados:
  `openai-codex/*` pertenece al plugin OpenAI, mientras que el plugin incluido del
  servidor de app Codex se selecciona mediante `agentRuntime.id: "codex"` o referencias de modelo heredadas
  `codex/*`

## Solución de problemas de hooks de runtime

Si un plugin aparece en `plugins list` pero los efectos secundarios o hooks de `register(api)`
no se ejecutan en tráfico de chat en vivo, revisa primero lo siguiente:

- Ejecuta `openclaw gateway status --deep --require-rpc` y confirma que la URL,
  el perfil, la ruta de configuración y el proceso activos de Gateway sean los que estás editando.
- Reinicia el Gateway en vivo después de cambios de instalación/configuración/código de plugins. En contenedores
  con envoltorio, el PID 1 puede ser solo un supervisor; reinicia o envía una señal al proceso hijo
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` para confirmar registros de hooks y
  diagnósticos. Los hooks de conversación no incluidos como `llm_input`,
  `llm_output`, `before_agent_finalize` y `agent_end` necesitan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para cambios de modelo, prefiere `before_model_resolve`. Se ejecuta antes de la
  resolución del modelo para turnos de agente; `llm_output` solo se ejecuta después de que un intento de modelo
  produce salida del asistente.
- Para probar el modelo de sesión efectivo, usa `openclaw sessions` o las
  superficies de sesión/estado de Gateway y, al depurar cargas de proveedor, inicia
  Gateway con `--raw-stream --raw-stream-path <path>`.

### Configuración lenta de herramientas de plugin

Si los turnos del agente parecen bloquearse mientras preparan herramientas, habilita el registro de trazas y
comprueba las líneas de tiempo de fábrica de herramientas de plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Busca:

```text
[trace:plugin-tools] factory timings ...
```

El resumen enumera el tiempo total de fábrica y las fábricas de herramientas de plugin más lentas,
incluyendo id de plugin, nombres de herramientas declarados, forma del resultado y si la herramienta es
opcional. Las líneas lentas se elevan a advertencias cuando una sola fábrica tarda al
menos 1 s o la preparación total de fábricas de herramientas de plugin tarda al menos 5 s.

Si un plugin domina el tiempo, inspecciona sus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Luego actualiza, reinstala o deshabilita ese plugin. Los autores de plugins deben mover
la carga costosa de dependencias detrás de la ruta de ejecución de la herramienta en lugar de hacerlo
dentro de la fábrica de herramientas.

### Propiedad duplicada de canal o herramienta

Síntomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Esto significa que más de un plugin habilitado intenta poseer el mismo canal,
flujo de configuración o nombre de herramienta. La causa más común es un plugin de canal externo
instalado junto a un plugin incluido que ahora proporciona el mismo id de canal.

Pasos de depuración:

- Ejecuta `openclaw plugins list --enabled --verbose` para ver todos los plugins habilitados
  y su origen.
- Ejecuta `openclaw plugins inspect <id> --runtime --json` para cada plugin sospechoso y
  compara `channels`, `channelConfigs`, `tools` y diagnósticos.
- Ejecuta `openclaw plugins registry --refresh` después de instalar o eliminar
  paquetes de plugins para que los metadatos persistidos reflejen la instalación actual.
- Reinicia Gateway después de cambios de instalación, registro o configuración.

Opciones de corrección:

- Si un plugin reemplaza intencionalmente a otro para el mismo id de canal, el
  plugin preferido debe declarar `channelConfigs.<channel-id>.preferOver` con
  el id del plugin de menor prioridad. Consulta [/plugins/manifest#replacing-another-channel-plugin](/es/plugins/manifest#replacing-another-channel-plugin).
- Si el duplicado es accidental, deshabilita un lado con
  `plugins.entries.<plugin-id>.enabled: false` o elimina la instalación obsoleta del plugin.
- Si habilitaste explícitamente ambos plugins, OpenClaw conserva esa solicitud e
  informa el conflicto. Elige un propietario para el canal o renombra las herramientas propiedad del plugin
  para que la superficie de runtime sea inequívoca.

## Slots de plugin (categorías exclusivas)

Algunas categorías son exclusivas (solo una activa a la vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Qué controla          | Predeterminado      |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de memoria activo | `memory-core`       |
| `contextEngine` | Motor de contexto activo | `legacy` (integrado) |

## Referencia de CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los plugins incluidos se distribuyen con OpenClaw. Muchos están habilitados de forma predeterminada (por ejemplo,
proveedores de modelos incluidos, proveedores de voz incluidos y el plugin de navegador incluido).
Otros plugins incluidos todavía necesitan `openclaw plugins enable <id>`.

`--force` sobrescribe en sitio un plugin instalado o paquete de hooks existente. Usa
`openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm
rastreados. No es compatible con `--link`, que reutiliza la ruta de origen en lugar
de copiar sobre un destino de instalación administrado.

Cuando `plugins.allow` ya está configurado, `openclaw plugins install` añade el
id del plugin instalado a esa lista de permitidos antes de habilitarlo. Si el mismo id de plugin
está presente en `plugins.deny`, la instalación elimina esa entrada deny obsoleta para que la
instalación explícita se pueda cargar inmediatamente después de reiniciar.

OpenClaw mantiene un registro local persistido de plugins como modelo de lectura en frío para
inventario de plugins, propiedad de contribuciones y planificación de inicio. Los flujos de instalación, actualización,
desinstalación, habilitación y deshabilitación actualizan ese registro después de cambiar el estado del plugin.
El mismo archivo `plugins/installs.json` mantiene metadatos de instalación duraderos en
`installRecords` de nivel superior y metadatos de manifiesto reconstruibles en `plugins`. Si
el registro falta, está obsoleto o es inválido, `openclaw plugins registry
--refresh` reconstruye su vista de manifiesto a partir de registros de instalación, política de configuración y
metadatos de manifiesto/paquete sin cargar módulos de runtime de plugin.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar
una especificación de paquete npm con un dist-tag o versión exacta resuelve el nombre del paquete
de vuelta al registro de plugin rastreado y registra la nueva especificación para futuras actualizaciones.
Pasar el nombre del paquete sin una versión mueve una instalación fijada exacta de vuelta a
la línea de lanzamiento predeterminada del registro. Si el plugin npm instalado ya coincide
con la versión resuelta y la identidad de artefacto registrada, OpenClaw omite la actualización
sin descargar, reinstalar ni reescribir la configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones de marketplace conservan metadatos de origen del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos
positivos del escáner de código peligroso integrado. Permite que las instalaciones
de plugins y las actualizaciones de plugins continúen pese a hallazgos `critical`
integrados, pero aun así no omite los bloqueos de política `before_install` del
plugin ni los bloqueos por fallo de escaneo. Los escaneos de instalación ignoran
archivos y directorios de prueba comunes como `tests/`, `__tests__/`, `*.test.*`
y `*.spec.*` para evitar bloquear mocks de prueba empaquetados; los puntos de
entrada de runtime declarados del plugin se siguen escaneando aunque usen uno de
esos nombres.

Esta marca de CLI se aplica solo a los flujos de instalación/actualización de
plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan
en su lugar la anulación de solicitud `dangerouslyForceUnsafeInstall`
correspondiente, mientras que `openclaw skills install` sigue siendo el flujo
separado de descarga/instalación de Skills de ClawHub.

Si un plugin que publicaste en ClawHub está oculto o bloqueado por un escaneo,
abre el panel de ClawHub o ejecuta `clawhub package rescan <name>` para pedir a
ClawHub que lo revise de nuevo. `--dangerously-force-unsafe-install` solo afecta
a instalaciones en tu propia máquina; no pide a ClawHub que vuelva a escanear el
plugin ni hace pública una versión bloqueada.

Los paquetes compatibles participan en el mismo flujo de listar/inspeccionar/habilitar/deshabilitar plugins. El soporte de runtime actual incluye Skills de paquete, Skills de comando de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y `lspServers` declarados en el manifiesto, Skills de comando de Cursor y directorios de hooks compatibles de Codex.

`openclaw plugins inspect <id>` también informa las capacidades detectadas del
paquete, además de entradas de servidor MCP y LSP compatibles o no compatibles
para plugins respaldados por paquetes.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude
desde `~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local
o una ruta `marketplace.json`, una forma abreviada de GitHub como `owner/repo`,
una URL de repositorio de GitHub o una URL git. Para marketplaces remotos, las
entradas de plugins deben permanecer dentro del repositorio de marketplace clonado
y usar solo fuentes de rutas relativas.

Consulta la [referencia de CLI de `openclaw plugins`](/es/cli/plugins) para ver todos los detalles.

## Descripción general de la API de Plugin

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los
plugins antiguos aún pueden usar `activate(api)` como alias heredado, pero los
plugins nuevos deben usar `register`.

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
activación del plugin. El cargador aún recurre a `activate(api)` para plugins
antiguos, pero los plugins incluidos y los nuevos plugins externos deben tratar
`register` como el contrato público.

`api.registrationMode` le indica a un plugin por qué se está cargando su entrada:

| Modo            | Significado                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | Activación de runtime. Registra herramientas, hooks, servicios, comandos, rutas y otros efectos secundarios activos.                 |
| `discovery`     | Descubrimiento de capacidades de solo lectura. Registra proveedores y metadatos; el código de entrada confiable del plugin puede cargarse, pero omite efectos secundarios activos. |
| `setup-only`    | Carga de metadatos de configuración de canal mediante una entrada de configuración ligera.                                           |
| `setup-runtime` | Carga de configuración de canal que también necesita la entrada de runtime.                                                          |
| `cli-metadata`  | Solo recopilación de metadatos de comandos de CLI.                                                                                   |

Las entradas de plugins que abren sockets, bases de datos, workers en segundo
plano o clientes de larga duración deben proteger esos efectos secundarios con
`api.registrationMode === "full"`. Las cargas de descubrimiento se almacenan en
caché por separado de las cargas de activación y no reemplazan el registro del
Gateway en ejecución. El descubrimiento no activa, pero no está libre de
importaciones: OpenClaw puede evaluar la entrada confiable del plugin o el módulo
del plugin de canal para construir la instantánea. Mantén los niveles superiores
de los módulos ligeros y sin efectos secundarios, y mueve clientes de red,
subprocesos, escuchas, lecturas de credenciales e inicio de servicios detrás de
rutas de runtime completo.

Métodos de registro comunes:

| Método                                  | Qué registra                      |
| --------------------------------------- | --------------------------------- |
| `registerProvider`                      | Proveedor de modelo (LLM)         |
| `registerChannel`                       | Canal de chat                     |
| `registerTool`                          | Herramienta de agente             |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida            |
| `registerSpeechProvider`                | Texto a voz / STT                 |
| `registerRealtimeTranscriptionProvider` | STT en streaming                  |
| `registerRealtimeVoiceProvider`         | Voz en tiempo real dúplex         |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio          |
| `registerImageGenerationProvider`       | Generación de imágenes            |
| `registerMusicGenerationProvider`       | Generación de música              |
| `registerVideoGenerationProvider`       | Generación de video               |
| `registerWebFetchProvider`              | Proveedor de obtención web / scraping |
| `registerWebSearchProvider`             | Búsqueda web                      |
| `registerHttpRoute`                     | Endpoint HTTP                     |
| `registerCommand` / `registerCli`       | Comandos de CLI                   |
| `registerContextEngine`                 | Motor de contexto                 |
| `registerService`                       | Servicio en segundo plano         |

Comportamiento de protección de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` es terminal; los manejadores de menor prioridad se omiten.
- `before_tool_call`: `{ block: false }` es una no operación y no borra un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; los manejadores de menor prioridad se omiten.
- `before_install`: `{ block: false }` es una no operación y no borra un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; los manejadores de menor prioridad se omiten.
- `message_sending`: `{ cancel: false }` es una no operación y no borra una cancelación anterior.

El servidor de aplicaciones nativo de Codex enlaza eventos de herramientas nativas
de Codex de vuelta a esta superficie de hooks. Los plugins pueden bloquear
herramientas nativas de Codex mediante `before_tool_call`, observar resultados
mediante `after_tool_call` y participar en aprobaciones de `PermissionRequest` de
Codex. El puente aún no reescribe argumentos de herramientas nativas de Codex. El
límite exacto de soporte de runtime de Codex se encuentra en el [contrato de
soporte v1 del arnés de Codex](/es/plugins/codex-harness#v1-support-contract).

Para ver el comportamiento completo de hooks tipados, consulta la [descripción general del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Crear plugins](/es/plugins/building-plugins) — crea tu propio plugin
- [Paquetes de plugins](/es/plugins/bundles) — compatibilidad de paquetes de Codex/Claude/Cursor
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema del manifiesto
- [Registrar herramientas](/es/plugins/building-plugins#registering-agent-tools) — agrega herramientas de agente en un plugin
- [Elementos internos de Plugin](/es/plugins/architecture) — modelo de capacidades y pipeline de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
