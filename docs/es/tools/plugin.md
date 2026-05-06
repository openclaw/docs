---
read_when:
    - Instalación o configuración de Plugins
    - Comprender el descubrimiento de Plugin y las reglas de carga
    - Trabajar con paquetes de Plugin compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y administrar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-06T09:07:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Los plugins extienden OpenClaw con nuevas capacidades: canales, proveedores de modelos,
arneses de agentes, herramientas, skills, voz, transcripción en tiempo real, voz en tiempo real,
comprensión de medios, generación de imágenes, generación de video, obtención web, búsqueda web
y más. Algunos plugins son **core** (incluidos con OpenClaw), otros
son **externos**. La mayoría de los plugins externos se publican y descubren mediante
[ClawHub](/es/tools/clawhub). Npm sigue siendo compatible para instalaciones directas y para un
conjunto temporal de paquetes de plugins propiedad de OpenClaw mientras termina esa migración.

## Inicio rápido

Para ver ejemplos listos para copiar y pegar de instalación, listado, desinstalación, actualización
y publicación, consulta
[Gestionar plugins](/es/plugins/manage-plugins).

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
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

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

    Luego configura en `plugins.entries.\<id\>.config` dentro de tu archivo de configuración.

  </Step>

  <Step title="Gestión nativa desde chat">
    En un Gateway en ejecución, `/plugins enable` y `/plugins disable`, solo para el propietario,
    activan el recargador de configuración del Gateway. El Gateway recarga en el proceso las
    superficies de runtime del plugin, y los nuevos turnos de agente reconstruyen su lista de
    herramientas desde el registro actualizado. `/plugins install` cambia el código fuente del plugin,
    así que el Gateway solicita un reinicio en vez de fingir que el proceso actual puede
    recargar de forma segura módulos ya importados.

  </Step>

  <Step title="Verificar el plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` cuando necesites demostrar herramientas registradas, servicios, métodos de Gateway,
    hooks o comandos de CLI propiedad del plugin. `inspect` sin más es una comprobación fría de
    manifiesto/registro y evita intencionalmente importar el runtime del plugin.

  </Step>
</Steps>

Si prefieres el control nativo desde chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

La ruta de instalación usa el mismo resolver que la CLI: ruta/archivo local, `clawhub:<pkg>` explícito,
`npm:<pkg>` explícito, `npm-pack:<path.tgz>` explícito,
`git:<repo>` explícito, o especificación de paquete sin prefijo mediante npm.

Si la configuración no es válida, la instalación normalmente falla de forma cerrada y te dirige a
`openclaw doctor --fix`. La única excepción de recuperación es una ruta estrecha de reinstalación de
plugins incluidos para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.
Durante el arranque del Gateway, una configuración de plugin no válida falla de forma cerrada como cualquier otra configuración no válida.
Ejecuta `openclaw doctor --fix` para poner en cuarentena la configuración incorrecta del plugin
deshabilitando esa entrada de plugin y eliminando su carga de configuración no válida; la copia de seguridad normal
de la configuración conserva los valores anteriores.
Cuando una configuración de canal hace referencia a un plugin que ya no se puede descubrir, pero el
mismo id de plugin obsoleto permanece en la configuración del plugin o en los registros de instalación, el arranque del Gateway
registra advertencias y omite ese canal en vez de bloquear todos los demás canales.
Ejecuta `openclaw doctor --fix` para eliminar las entradas obsoletas de canal/plugin; las claves de
canal desconocidas sin evidencia de plugin obsoleto siguen fallando la validación para que los errores tipográficos sigan
visibles.
Si se define `plugins.enabled: false`, las referencias a plugins obsoletos se tratan como inertes:
el arranque del Gateway omite el trabajo de descubrimiento/carga de plugins y `openclaw doctor` conserva
la configuración de plugin deshabilitada en vez de eliminarla automáticamente. Vuelve a habilitar los plugins antes de
ejecutar la limpieza de doctor si quieres que se eliminen los ids de plugins obsoletos.

La instalación de dependencias de plugins ocurre solo durante flujos explícitos de instalación/actualización o
reparación de doctor. El arranque del Gateway, la recarga de configuración y la inspección de runtime no
ejecutan gestores de paquetes ni reparan árboles de dependencias. Los plugins locales ya deben
tener sus dependencias instaladas, mientras que los plugins de npm, git y ClawHub se
instalan bajo las raíces de plugins gestionadas por OpenClaw. Las dependencias npm pueden elevarse
dentro de la raíz npm gestionada por OpenClaw; install/update escanea esa raíz gestionada antes de
confiar, y uninstall elimina paquetes gestionados por npm mediante npm. Los plugins externos
y las rutas de carga personalizadas deben seguir instalándose mediante `openclaw plugins install`.
Usa `openclaw plugins list --json` para ver el `dependencyStatus` estático de cada
plugin visible sin importar código de runtime ni reparar dependencias.
Consulta [Resolución de dependencias de plugins](/es/plugins/dependency-resolution) para el
ciclo de vida en tiempo de instalación.

### Propiedad de rutas de plugins bloqueadas

Si los diagnósticos del plugin dicen
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
y la validación de configuración sigue con `plugin present but blocked`, OpenClaw encontró
archivos de plugin propiedad de un usuario Unix distinto del proceso que los está cargando.
Mantén la configuración del plugin en su lugar; corrige la propiedad del sistema de archivos o ejecuta
OpenClaw como el mismo usuario que posee el directorio de estado.

Para instalaciones Docker, la imagen oficial se ejecuta como `node` (uid `1000`), por lo que los
directorios de configuración y espacio de trabajo de OpenClaw montados desde el host normalmente deberían ser
propiedad de uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si ejecutas OpenClaw intencionalmente como root, repara la raíz de plugins gestionada para que sea
propiedad de root en su lugar:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Después de corregir la propiedad, vuelve a ejecutar `openclaw doctor --fix` o
`openclaw plugins registry --refresh` para que el registro de plugins persistido coincida con
los archivos reparados.

Para instalaciones npm, los selectores mutables como `latest` o una dist-tag se resuelven
antes de la instalación y luego se fijan a la versión exacta verificada en la raíz npm
gestionada por OpenClaw. Cuando npm termina, OpenClaw verifica que la entrada
`package-lock.json` instalada siga coincidiendo con la versión resuelta y la integridad. Si
npm escribe metadatos de paquete diferentes, la instalación falla y el paquete gestionado
se revierte en vez de aceptar un artefacto de plugin diferente.

Los checkouts de código fuente son workspaces de pnpm. Si clonas OpenClaw para modificar plugins
incluidos, ejecuta `pnpm install`; OpenClaw entonces carga los plugins incluidos desde
`extensions/<id>` para que las ediciones y las dependencias locales del paquete se usen directamente.
Las instalaciones raíz simples con npm son para OpenClaw empaquetado, no para desarrollo
en un checkout de código fuente.

## Tipos de plugins

OpenClaw reconoce dos formatos de plugins:

| Formato    | Cómo funciona                                                     | Ejemplos                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; se ejecuta en proceso | Plugins oficiales, paquetes npm de la comunidad        |
| **Bundle** | Diseño compatible con Codex/Claude/Cursor; se mapea a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Bundles de plugins](/es/plugins/bundles) para obtener detalles sobre bundles.

Si estás escribiendo un plugin nativo, empieza con [Crear plugins](/es/plugins/building-plugins)
y la [Vista general del SDK de plugins](/es/plugins/sdk-overview).

## Puntos de entrada del paquete

Los paquetes npm de plugins nativos deben declarar `openclaw.extensions` en `package.json`.
Cada entrada debe permanecer dentro del directorio del paquete y resolver a un archivo de
runtime legible, o a un archivo fuente TypeScript con un par JavaScript compilado inferido,
como `src/index.ts` a `dist/index.js`.
Las instalaciones empaquetadas deben incluir esa salida de runtime JavaScript. El fallback de
fuente TypeScript es para checkouts de código fuente y rutas de desarrollo local, no para
paquetes npm instalados en la raíz de plugins gestionada por OpenClaw.

Si una advertencia de paquete gestionado dice que `requires compiled runtime output for
TypeScript entry ...`, el paquete se publicó sin los archivos JavaScript que
OpenClaw necesita en runtime. Eso es un problema de empaquetado del plugin, no un problema de
configuración local. Actualiza o reinstala el plugin después de que el publicador vuelva a publicar
JavaScript compilado, o deshabilita/desinstala ese plugin hasta que haya disponible un paquete corregido.

Usa `openclaw.runtimeExtensions` cuando los archivos de runtime publicados no vivan en las
mismas rutas que las entradas de origen. Cuando está presente, `runtimeExtensions` debe contener
exactamente una entrada por cada entrada de `extensions`. Las listas que no coinciden fallan la instalación y
el descubrimiento de plugins en vez de volver silenciosamente a las rutas de origen. Si también
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

ClawHub es la ruta principal de distribución para la mayoría de los plugins. Las versiones empaquetadas
actuales de OpenClaw ya incluyen muchos plugins oficiales, por lo que estos no necesitan
instalaciones npm separadas en configuraciones normales. Hasta que todos los plugins propiedad de OpenClaw
hayan migrado a ClawHub, OpenClaw aún publica algunos paquetes de plugins `@openclaw/*` en
npm para instalaciones antiguas/personalizadas y flujos directos con npm.

Si npm informa que un paquete de plugin `@openclaw/*` está obsoleto, esa versión del paquete
pertenece a una línea de paquetes externos anterior. Usa el plugin incluido de
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
    - `memory-core` - búsqueda de memoria incluida (valor predeterminado mediante `plugins.slots.memory`)
    - `memory-lancedb` - memoria a largo plazo respaldada por LanceDB con recuperación/captura automática (define `plugins.slots.memory = "memory-lancedb"`)

    Consulta [Memory LanceDB](/es/plugins/memory-lancedb) para la configuración de embeddings compatible con OpenAI, ejemplos de Ollama, límites de recuperación y solución de problemas.

  </Accordion>

  <Accordion title="Proveedores de voz (habilitados de forma predeterminada)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` - plugin de navegador incluido para la herramienta de navegador, la CLI `openclaw browser`, el método de Gateway `browser.request`, el runtime de navegador y el servicio de control de navegador predeterminado (habilitado de forma predeterminada; deshabilítalo antes de reemplazarlo)
    - `copilot-proxy` - puente VS Code Copilot Proxy (deshabilitado de forma predeterminada)

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

| Campo              | Descripción                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Interruptor principal (predeterminado: `true`)            |
| `allow`            | Lista de permitidos de plugins (opcional)                 |
| `bundledDiscovery` | Modo de descubrimiento de plugins incluidos (`allowlist` de forma predeterminada) |
| `deny`             | Lista de denegados de plugins (opcional; denegar prevalece) |
| `load.paths`       | Archivos/directorios de plugins adicionales               |
| `slots`            | Selectores de ranuras exclusivas (p. ej., `memory`, `contextEngine`) |
| `entries.\<id\>`   | Alternadores por plugin + configuración                   |

`plugins.allow` es exclusivo. Cuando no está vacío, solo los plugins listados pueden cargarse o exponer herramientas, incluso si `tools.allow` contiene `"*"` o un nombre de herramienta específico propiedad de un plugin. Si una lista de permitidos de herramientas hace referencia a herramientas de plugins, añade los ids de los plugins propietarios a `plugins.allow` o elimina `plugins.allow`; `openclaw doctor` advierte sobre esta forma.

`plugins.bundledDiscovery` usa `"allowlist"` de forma predeterminada para configuraciones nuevas, por lo que un inventario restrictivo de `plugins.allow` también bloquea los plugins de proveedores incluidos que se omitan, incluido el descubrimiento de proveedores de búsqueda web en runtime. Doctor marca las configuraciones antiguas con listas de permitidos restrictivas con `"compat"` durante la migración, de modo que las actualizaciones mantengan el comportamiento heredado de los proveedores incluidos hasta que el operador opte por el modo más estricto. Un `plugins.allow` vacío sigue tratándose como no definido/abierto.

Los cambios de configuración realizados mediante `/plugins enable` o `/plugins disable` activan una recarga de plugins del Gateway dentro del proceso. Los nuevos turnos de agente reconstruyen su lista de herramientas a partir del registro de plugins actualizado. Las operaciones que cambian el origen, como instalar, actualizar y desinstalar, siguen reiniciando el proceso del Gateway porque los módulos de plugins ya importados no pueden reemplazarse de forma segura en el mismo proceso.

`openclaw plugins list` es una instantánea local del registro/configuración de plugins. Un plugin `enabled` allí significa que el registro persistido y la configuración actual permiten que el plugin participe. No demuestra que un Gateway remoto ya en ejecución se haya recargado o reiniciado con el mismo código de plugin. En configuraciones VPS/contenedor con procesos envoltorio, envía reinicios o escrituras que activen recarga al proceso real `openclaw gateway run`, o usa `openclaw gateway restart` contra el Gateway en ejecución cuando la recarga informa un fallo.

<Accordion title="Estados de plugins: deshabilitado vs faltante vs inválido">
  - **Deshabilitado**: el plugin existe, pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Faltante**: la configuración hace referencia a un id de plugin que el descubrimiento no encontró.
  - **Inválido**: el plugin existe, pero su configuración no coincide con el esquema declarado. El arranque del Gateway omite solo ese plugin; `openclaw doctor --fix` puede poner en cuarentena la entrada inválida deshabilitándola y eliminando su payload de configuración.

</Accordion>

## Descubrimiento y precedencia

OpenClaw busca plugins en este orden (la primera coincidencia prevalece):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` - rutas explícitas de archivo o directorio. Las rutas que apuntan de vuelta a los propios directorios de plugins incluidos empaquetados de OpenClaw se ignoran; ejecuta `openclaw doctor --fix` para eliminar esos alias obsoletos.
  </Step>

  <Step title="Plugins del workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluidos">
    Enviados con OpenClaw. Muchos están habilitados de forma predeterminada (proveedores de modelos, voz). Otros requieren habilitación explícita.
  </Step>
</Steps>

Las instalaciones empaquetadas y las imágenes Docker normalmente resuelven los plugins incluidos desde el árbol compilado `dist/extensions`. Si un directorio de origen de un plugin incluido se monta con bind sobre la ruta de origen empaquetada correspondiente, por ejemplo `/app/extensions/synology-chat`, OpenClaw trata ese directorio de origen montado como una superposición de origen incluido y lo descubre antes que el paquete empaquetado `/app/dist/extensions/synology-chat`. Esto mantiene funcionando los bucles de contenedor de mantenedores sin volver a cambiar cada plugin incluido a código fuente TypeScript. Define `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forzar los paquetes dist empaquetados incluso cuando haya montajes de superposición de origen presentes.

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins y omite el trabajo de descubrimiento/carga de plugins
- `plugins.deny` siempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese plugin
- Los plugins originados en workspace están **deshabilitados de forma predeterminada** (deben habilitarse explícitamente)
- Los plugins incluidos siguen el conjunto integrado activado de forma predeterminada salvo que se sobrescriba
- Las ranuras exclusivas pueden forzar la habilitación del plugin seleccionado para esa ranura
- Algunos plugins incluidos de activación opcional se habilitan automáticamente cuando la configuración nombra una superficie propiedad de un plugin, como una referencia de modelo de proveedor, configuración de canal o runtime de arnés
- La configuración obsoleta de plugins se conserva mientras `plugins.enabled: false` está activo; vuelve a habilitar los plugins antes de ejecutar la limpieza de doctor si quieres que se eliminen ids obsoletos
- Las rutas Codex de la familia OpenAI mantienen límites de plugin separados:
  `openai-codex/*` pertenece al plugin OpenAI, mientras que el plugin app-server Codex incluido se selecciona mediante `agentRuntime.id: "codex"` o referencias de modelo heredadas `codex/*`

## Solución de problemas de hooks de runtime

Si un plugin aparece en `plugins list` pero los efectos secundarios o hooks de `register(api)` no se ejecutan en tráfico de chat en vivo, revisa primero lo siguiente:

- Ejecuta `openclaw gateway status --deep --require-rpc` y confirma que la URL, el perfil, la ruta de configuración y el proceso activos del Gateway son los que estás editando.
- Reinicia el Gateway en vivo después de cambios de instalación/configuración/código de plugins. En contenedores envoltorio, PID 1 puede ser solo un supervisor; reinicia o señaliza el proceso hijo `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` para confirmar registros de hooks y diagnósticos. Los hooks de conversación no incluidos, como `llm_input`, `llm_output`, `before_agent_finalize` y `agent_end`, necesitan `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para cambio de modelo, prefiere `before_model_resolve`. Se ejecuta antes de la resolución de modelo para turnos de agente; `llm_output` solo se ejecuta después de que un intento de modelo produce salida de asistente.
- Para probar el modelo efectivo de la sesión, usa `openclaw sessions` o las superficies de sesión/estado del Gateway y, al depurar payloads de proveedores, inicia el Gateway con `--raw-stream --raw-stream-path <path>`.

### Configuración lenta de herramientas de plugins

Si los turnos de agente parecen bloquearse mientras preparan herramientas, habilita el registro de trazas y revisa las líneas de temporización de fábricas de herramientas de plugins:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Busca:

```text
[trace:plugin-tools] factory timings ...
```

El resumen enumera el tiempo total de fábrica y las fábricas de herramientas de plugins más lentas, incluido el id del plugin, los nombres de herramientas declarados, la forma del resultado y si la herramienta es opcional. Las líneas lentas se elevan a advertencias cuando una sola fábrica tarda al menos 1 s o la preparación total de fábricas de herramientas de plugins tarda al menos 5 s.

OpenClaw almacena en caché los resultados correctos de fábricas de herramientas de plugins para resoluciones repetidas con el mismo contexto efectivo de solicitud. La clave de caché incluye la configuración efectiva de runtime, workspace, ids de agente/sesión, política de sandbox, ajustes del navegador, contexto de entrega, identidad del solicitante y estado de propiedad, por lo que las fábricas que dependen de esos campos de confianza se vuelven a ejecutar cuando cambia el contexto.

Si un plugin domina la temporización, inspecciona sus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Después actualiza, reinstala o deshabilita ese plugin. Los autores de plugins deben mover la carga costosa de dependencias detrás de la ruta de ejecución de la herramienta en lugar de hacerla dentro de la fábrica de herramientas.

### Propiedad duplicada de canal o herramienta

Síntomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Estos significan que más de un plugin habilitado intenta poseer el mismo canal, flujo de configuración o nombre de herramienta. La causa más común es un plugin de canal externo instalado junto a un plugin incluido que ahora proporciona el mismo id de canal.

Pasos de depuración:

- Ejecuta `openclaw plugins list --enabled --verbose` para ver todos los plugins habilitados y su origen.
- Ejecuta `openclaw plugins inspect <id> --runtime --json` para cada plugin sospechoso y compara `channels`, `channelConfigs`, `tools` y diagnósticos.
- Ejecuta `openclaw plugins registry --refresh` después de instalar o eliminar paquetes de plugins para que los metadatos persistidos reflejen la instalación actual.
- Reinicia el Gateway después de cambios de instalación, registro o configuración.

Opciones de corrección:

- Si un plugin reemplaza intencionalmente a otro para el mismo id de canal, el plugin preferido debe declarar `channelConfigs.<channel-id>.preferOver` con el id del plugin de menor prioridad. Consulta [/plugins/manifest#replacing-another-channel-plugin](/es/plugins/manifest#replacing-another-channel-plugin).
- Si el duplicado es accidental, deshabilita un lado con `plugins.entries.<plugin-id>.enabled: false` o elimina la instalación de plugin obsoleta.
- Si habilitaste explícitamente ambos plugins, OpenClaw conserva esa solicitud e informa el conflicto. Elige un propietario para el canal o renombra las herramientas propiedad del plugin para que la superficie de runtime sea inequívoca.

## Ranuras de plugins (categorías exclusivas)

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

| Ranura          | Qué controla          | Predeterminado      |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de memoria activo | `memory-core`    |
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

openclaw plugins install <package>         # install from npm by default
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

Los plugins incluidos se distribuyen con OpenClaw. Muchos están habilitados de forma predeterminada (por ejemplo, los proveedores de modelos incluidos, los proveedores de voz incluidos y el plugin de navegador incluido). Otros plugins incluidos todavía necesitan `openclaw plugins enable <id>`.

`--force` sobrescribe en su lugar un plugin instalado o paquete de hooks existente. Usa `openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm con seguimiento. No es compatible con `--link`, que reutiliza la ruta de origen en lugar de copiar sobre un destino de instalación gestionado.

Cuando `plugins.allow` ya está configurado, `openclaw plugins install` agrega el id del plugin instalado a esa lista de permitidos antes de habilitarlo. Si el mismo id de plugin está presente en `plugins.deny`, la instalación elimina esa entrada de denegación obsoleta para que la instalación explícita pueda cargarse inmediatamente después del reinicio.

OpenClaw mantiene un registro local persistente de plugins como modelo de lectura en frío para el inventario de plugins, la propiedad de las contribuciones y la planificación del inicio. Los flujos de instalación, actualización, desinstalación, habilitación y deshabilitación actualizan ese registro después de cambiar el estado de los plugins. El mismo archivo `plugins/installs.json` conserva metadatos de instalación duraderos en `installRecords` de nivel superior y metadatos de manifiesto reconstruibles en `plugins`. Si el registro falta, está obsoleto o no es válido, `openclaw plugins registry --refresh` reconstruye su vista de manifiestos a partir de registros de instalación, la política de configuración y metadatos de manifiesto/paquete sin cargar módulos de runtime de plugins.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones con seguimiento. Al pasar una especificación de paquete npm con una dist-tag o versión exacta, el nombre del paquete se resuelve de vuelta al registro del plugin con seguimiento y se registra la nueva especificación para futuras actualizaciones. Pasar el nombre del paquete sin una versión mueve una instalación fijada exacta de vuelta a la línea de publicación predeterminada del registro. Si el plugin npm instalado ya coincide con la versión resuelta y la identidad del artefacto registrada, OpenClaw omite la actualización sin descargar, reinstalar ni reescribir la configuración.
Cuando `openclaw update` se ejecuta en el canal beta, los registros de plugins npm y ClawHub de línea predeterminada prueban primero `@beta` y vuelven a predeterminado/latest cuando no existe una versión beta del plugin. Las versiones exactas y las etiquetas explícitas permanecen fijadas.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque las instalaciones de marketplace conservan metadatos de origen de marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos positivos del escáner integrado de código peligroso. Permite que las instalaciones y actualizaciones de plugins continúen después de hallazgos `critical` integrados, pero aun así no omite los bloqueos de política `before_install` de plugins ni el bloqueo por fallos de escaneo. Los escaneos de instalación ignoran archivos y directorios de prueba comunes como `tests/`, `__tests__/`, `*.test.*` y `*.spec.*` para evitar bloquear mocks de prueba empaquetados; los entrypoints de runtime declarados del plugin se siguen escaneando aunque usen uno de esos nombres.

Esta bandera de CLI se aplica solo a los flujos de instalación/actualización de plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan en su lugar la anulación de solicitud `dangerouslyForceUnsafeInstall` correspondiente, mientras que `openclaw skills install` sigue siendo el flujo separado de descarga/instalación de Skills de ClawHub.

Si un plugin que publicaste en ClawHub está oculto o bloqueado por un escaneo, abre el panel de ClawHub o ejecuta `clawhub package rescan <name>` para pedirle a ClawHub que lo compruebe de nuevo. `--dangerously-force-unsafe-install` solo afecta a las instalaciones en tu propia máquina; no pide a ClawHub que vuelva a escanear el plugin ni que haga pública una versión bloqueada.

Los paquetes compatibles participan en el mismo flujo de listar/inspeccionar/habilitar/deshabilitar plugins. El soporte de runtime actual incluye Skills de paquete, command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y `lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks Codex compatibles.

`openclaw plugins inspect <id>` también informa las capacidades de paquete detectadas, además de entradas de servidor MCP y LSP compatibles o no compatibles para plugins respaldados por paquetes.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude de `~/.claude/plugins/known_marketplaces.json`, una raíz local de marketplace o ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL git. Para marketplaces remotos, las entradas de plugins deben permanecer dentro del repositorio de marketplace clonado y usar solo fuentes de ruta relativa.

Consulta la [referencia de CLI de `openclaw plugins`](/es/cli/plugins) para obtener todos los detalles.

## Descripción general de la API de Plugin

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los plugins más antiguos aún pueden usar `activate(api)` como alias heredado, pero los plugins nuevos deben usar `register`.

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

OpenClaw carga el objeto de entrada y llama a `register(api)` durante la activación del plugin. El cargador todavía recurre a `activate(api)` para plugins más antiguos, pero los plugins incluidos y los nuevos plugins externos deben tratar `register` como el contrato público.

`api.registrationMode` indica a un plugin por qué se está cargando su entrada:

| Modo            | Significado                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activación de runtime. Registra herramientas, hooks, servicios, comandos, rutas y otros efectos secundarios activos.             |
| `discovery`     | Descubrimiento de capacidades de solo lectura. Registra proveedores y metadatos; el código de entrada del plugin de confianza puede cargarse, pero omite efectos secundarios activos. |
| `setup-only`    | Carga de metadatos de configuración de canal mediante una entrada de configuración ligera.                                       |
| `setup-runtime` | Carga de configuración de canal que también necesita la entrada de runtime.                                                       |
| `cli-metadata`  | Solo recopilación de metadatos de comandos de CLI.                                                                                |

Las entradas de plugins que abren sockets, bases de datos, workers en segundo plano o clientes de larga duración deben proteger esos efectos secundarios con `api.registrationMode === "full"`. Las cargas de descubrimiento se almacenan en caché por separado de las cargas de activación y no reemplazan el registro del Gateway en ejecución. El descubrimiento no activa, pero no está libre de imports: OpenClaw puede evaluar la entrada del plugin de confianza o el módulo de plugin de canal para construir la instantánea. Mantén los niveles superiores de los módulos ligeros y sin efectos secundarios, y mueve clientes de red, subprocesos, listeners, lecturas de credenciales e inicio de servicios detrás de rutas de runtime completo.

Métodos de registro comunes:

| Método                                  | Lo que registra              |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Proveedor de modelos (LLM)   |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Herramienta de agente        |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida       |
| `registerSpeechProvider`                | Texto a voz / STT            |
| `registerRealtimeTranscriptionProvider` | STT en streaming             |
| `registerRealtimeVoiceProvider`         | Voz realtime dúplex          |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio     |
| `registerImageGenerationProvider`       | Generación de imágenes       |
| `registerMusicGenerationProvider`       | Generación de música         |
| `registerVideoGenerationProvider`       | Generación de video          |
| `registerWebFetchProvider`              | Proveedor de fetch / scrape web |
| `registerWebSearchProvider`             | Búsqueda web                 |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Comandos de CLI              |
| `registerContextEngine`                 | Motor de contexto            |
| `registerService`                       | Servicio en segundo plano    |

Comportamiento de protección de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` es terminal; los handlers de menor prioridad se omiten.
- `before_tool_call`: `{ block: false }` es una operación nula y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; los handlers de menor prioridad se omiten.
- `before_install`: `{ block: false }` es una operación nula y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; los handlers de menor prioridad se omiten.
- `message_sending`: `{ cancel: false }` es una operación nula y no elimina una cancelación anterior.

El app-server nativo de Codex reenvía eventos de herramientas nativas de Codex a esta superficie de hooks. Los plugins pueden bloquear herramientas nativas de Codex mediante `before_tool_call`, observar resultados mediante `after_tool_call` y participar en aprobaciones `PermissionRequest` de Codex. El puente aún no reescribe los argumentos de herramientas nativas de Codex. El límite exacto de soporte del runtime de Codex vive en el [contrato de soporte de Codex harness v1](/es/plugins/codex-harness#v1-support-contract).

Para conocer el comportamiento completo de hooks tipados, consulta la [descripción general del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Creación de Plugins](/es/plugins/building-plugins) - crea tu propio Plugin
- [Paquetes de Plugin](/es/plugins/bundles) - compatibilidad de paquetes de Codex/Claude/Cursor
- [Manifiesto de Plugin](/es/plugins/manifest) - esquema del manifiesto
- [Registro de herramientas](/es/plugins/building-plugins#registering-agent-tools) - añade herramientas de agente en un Plugin
- [Aspectos internos de Plugin](/es/plugins/architecture) - modelo de capacidades y canalización de carga
- [Plugins de la comunidad](/es/plugins/community) - listados de terceros
