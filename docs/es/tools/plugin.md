---
read_when:
    - Instalar o configurar plugins
    - Comprender las reglas de descubrimiento y carga de plugins
    - Trabajar con paquetes de Plugin compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instala, configura y administra plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-01T05:34:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f876df0c2ed3ff356ada9462b56f2b5a65a662b64b328ecc97d8b463036934
    source_path: tools/plugin.md
    workflow: 16
---

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
arneses de agente, herramientas, Skills, voz, transcripción en tiempo real, voz
en tiempo real, comprensión de medios, generación de imágenes, generación de video, obtención web, búsqueda
web y más. Algunos plugins son **core** (se entregan con OpenClaw), otros
son **externos**. La mayoría de los plugins externos se publican y se descubren mediante
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
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar el Gateway">
    ```bash
    openclaw gateway restart
    ```

    Luego configúralo bajo `plugins.entries.\<id\>.config` en tu archivo de configuración.

  </Step>
</Steps>

Si prefieres el control nativo del chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

La ruta de instalación usa el mismo resolver que la CLI: ruta/archivo local, `clawhub:<pkg>`
explícito, `npm:<pkg>` explícito o especificación de paquete sin prefijo (primero ClawHub, luego
respaldo de npm).

Si la configuración no es válida, la instalación normalmente falla de forma cerrada y te dirige a
`openclaw doctor --fix`. La única excepción de recuperación es una ruta estrecha de reinstalación
de plugins incluidos para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.
Durante el arranque del Gateway, la configuración no válida de un plugin se aísla a ese plugin:
el arranque registra el problema de `plugins.entries.<id>.config`, omite ese plugin durante
la carga y mantiene los demás plugins y canales en línea. Ejecuta `openclaw doctor --fix`
para poner en cuarentena la configuración incorrecta del plugin deshabilitando esa entrada de plugin y eliminando
su carga de configuración no válida; la copia de seguridad normal de configuración conserva los valores anteriores.
Cuando la configuración de un canal referencia un plugin que ya no es detectable, pero el
mismo id de plugin obsoleto permanece en la configuración de plugins o en los registros de instalación, el arranque del Gateway
registra advertencias y omite ese canal en lugar de bloquear todos los demás canales.
Ejecuta `openclaw doctor --fix` para eliminar las entradas obsoletas de canal/plugin; las claves
de canal desconocidas sin evidencia de plugin obsoleto siguen fallando la validación para que los errores tipográficos sigan
visibles.
Si se establece `plugins.enabled: false`, las referencias a plugins obsoletos se tratan como inertes:
el arranque del Gateway omite el trabajo de descubrimiento/carga de plugins y `openclaw doctor` conserva
la configuración de plugins deshabilitada en lugar de eliminarla automáticamente. Vuelve a habilitar los plugins antes de
ejecutar la limpieza de doctor si quieres que se eliminen los ids de plugins obsoletos.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el árbol de
dependencias de runtime de cada plugin incluido. Cuando un plugin incluido propiedad de OpenClaw está activo desde
la configuración de plugins, la configuración de canal heredada o un manifiesto habilitado por defecto, el arranque
repara solo las dependencias de runtime declaradas de ese plugin antes de importarlo.
El estado de autenticación de canal persistido por sí solo no activa un canal incluido para
la reparación de dependencias de runtime durante el arranque del Gateway.
La deshabilitación explícita sigue teniendo prioridad: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` y `channels.<id>.enabled: false`
impiden la reparación automática de dependencias de runtime incluidas para ese plugin/canal.
Un `plugins.allow` no vacío también acota la reparación de dependencias de runtime incluidas
habilitadas por defecto; la habilitación explícita de un canal incluido (`channels.<id>.enabled: true`) todavía puede
reparar las dependencias del plugin de ese canal.
Los plugins externos y las rutas de carga personalizadas todavía deben instalarse mediante
`openclaw plugins install`.

## Tipos de plugin

OpenClaw reconoce dos formatos de plugin:

| Formato    | Cómo funciona                                                     | Ejemplos                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; se ejecuta en proceso  | Plugins oficiales, paquetes npm de la comunidad        |
| **Bundle** | Diseño compatible con Codex/Claude/Cursor; se asigna a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Bundles de plugins](/es/plugins/bundles) para obtener detalles sobre los bundles.

Si estás escribiendo un plugin nativo, empieza con [Crear plugins](/es/plugins/building-plugins)
y la [Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Puntos de entrada de paquetes

Los paquetes npm de plugins nativos deben declarar `openclaw.extensions` en `package.json`.
Cada entrada debe permanecer dentro del directorio del paquete y resolverse a un archivo de
runtime legible, o a un archivo fuente de TypeScript con un par JavaScript compilado inferido,
como `src/index.ts` a `dist/index.js`.

Usa `openclaw.runtimeExtensions` cuando los archivos de runtime publicados no vivan en las
mismas rutas que las entradas fuente. Cuando está presente, `runtimeExtensions` debe contener
exactamente una entrada por cada entrada de `extensions`. Las listas no coincidentes hacen fallar la instalación y
el descubrimiento de plugins en lugar de volver silenciosamente a las rutas fuente.

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

ClawHub es la ruta de distribución principal para la mayoría de los plugins. Las versiones empaquetadas
actuales de OpenClaw ya incluyen muchos plugins oficiales, por lo que estos no necesitan
instalaciones npm separadas en configuraciones normales. Hasta que todos los plugins propiedad de OpenClaw hayan
migrado a ClawHub, OpenClaw sigue publicando algunos paquetes de plugins `@openclaw/*` en
npm para instalaciones antiguas/personalizadas y flujos de trabajo npm directos.

Si npm informa que un paquete de plugin `@openclaw/*` está en desuso, esa versión del paquete
proviene de una línea de paquetes externos anterior. Usa el plugin incluido de la versión
actual de OpenClaw o un checkout local hasta que se publique un paquete npm más reciente.

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

### Core (incluido con OpenClaw)

<AccordionGroup>
  <Accordion title="Proveedores de modelos (habilitados por defecto)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memoria">
    - `memory-core` — búsqueda de memoria incluida (por defecto mediante `plugins.slots.memory`)
    - `memory-lancedb` — memoria a largo plazo de instalación bajo demanda con recuperación/captura automática (establece `plugins.slots.memory = "memory-lancedb"`)

    Consulta [Memory LanceDB](/es/plugins/memory-lancedb) para la configuración de embeddings compatible con OpenAI,
    ejemplos de Ollama, límites de recuperación y solución de problemas.

  </Accordion>

  <Accordion title="Proveedores de voz (habilitados por defecto)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — plugin de navegador incluido para la herramienta de navegador, la CLI `openclaw browser`, el método de gateway `browser.request`, runtime de navegador y servicio de control de navegador predeterminado (habilitado por defecto; deshabilítalo antes de reemplazarlo)
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

| Campo            | Descripción                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruptor maestro (por defecto: `true`)                 |
| `allow`          | Lista de permitidos de plugins (opcional)                 |
| `deny`           | Lista de denegados de plugins (opcional; deny gana)       |
| `load.paths`     | Archivos/directorios de plugins adicionales               |
| `slots`          | Selectores de slots exclusivos (por ejemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternadores + configuración por plugin                   |

`plugins.allow` es exclusivo. Cuando no está vacío, solo los plugins listados pueden cargarse
o exponer herramientas, incluso si `tools.allow` contiene `"*"` o un nombre de herramienta
propiedad de un plugin específico. Si una lista de permitidos de herramientas referencia herramientas de plugins, añade los ids de plugins propietarios
a `plugins.allow` o elimina `plugins.allow`; `openclaw doctor` advierte sobre esta
forma.

Los cambios de configuración **requieren reiniciar el gateway**. Si el Gateway se ejecuta con observación de configuración
+ reinicio en proceso habilitados (la ruta predeterminada de `openclaw gateway`), ese
reinicio suele realizarse automáticamente un momento después de que se escriba la configuración.
No hay una ruta de recarga en caliente compatible para código de runtime de plugins nativos ni hooks de ciclo de vida;
reinicia el proceso del Gateway que sirve el canal activo antes de
esperar que se ejecute el código actualizado de `register(api)`, hooks `api.on(...)`, herramientas, servicios o
hooks de proveedor/runtime.

`openclaw plugins list` es una instantánea local del registro/configuración de plugins. Un plugin
`enabled` ahí significa que el registro persistido y la configuración actual permiten que el
plugin participe. No demuestra que un proceso hijo de Gateway remoto que ya se está ejecutando
se haya reiniciado con el mismo código de plugin. En configuraciones VPS/contenedor con
procesos wrapper, envía los reinicios al proceso real `openclaw gateway run`,
o usa `openclaw gateway restart` contra el Gateway en ejecución.

<Accordion title="Estados de plugin: deshabilitado vs faltante vs no válido">
  - **Deshabilitado**: el plugin existe, pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Faltante**: la configuración referencia un id de plugin que el descubrimiento no encontró.
  - **No válido**: el plugin existe, pero su configuración no coincide con el esquema declarado. El arranque del Gateway omite solo ese plugin; `openclaw doctor --fix` puede poner en cuarentena la entrada no válida deshabilitándola y eliminando su carga de configuración.

</Accordion>

## Descubrimiento y precedencia

OpenClaw busca plugins en este orden (la primera coincidencia gana):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` — rutas explícitas de archivos o directorios. Las rutas que apuntan
    de vuelta a los directorios de plugins empaquetados incluidos de OpenClaw se ignoran;
    ejecuta `openclaw doctor --fix` para eliminar esos alias obsoletos.
  </Step>

  <Step title="Plugins del espacio de trabajo">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluidos">
    Incluidos con OpenClaw. Muchos están habilitados de forma predeterminada (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

Las instalaciones empaquetadas y las imágenes de Docker normalmente resuelven los plugins incluidos desde el
árbol compilado `dist/extensions`. Si un directorio fuente de un Plugin incluido se
monta mediante bind sobre la ruta fuente empaquetada correspondiente, por ejemplo
`/app/extensions/synology-chat`, OpenClaw trata ese directorio fuente montado
como una superposición de fuente incluida y lo descubre antes del paquete
`/app/dist/extensions/synology-chat` empaquetado. Esto mantiene funcionando los bucles
de contenedor para mantenedores sin volver a cambiar cada Plugin incluido a fuente TypeScript.
Define `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forzar los paquetes dist empaquetados
incluso cuando haya montajes de superposición de fuente presentes.

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins y omite el trabajo de descubrimiento/carga de plugins
- `plugins.deny` siempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese Plugin
- Los plugins originados en el espacio de trabajo están **deshabilitados de forma predeterminada** (deben habilitarse explícitamente)
- Los plugins incluidos siguen el conjunto integrado habilitado de forma predeterminada salvo que se anule
- Las ranuras exclusivas pueden forzar la habilitación del Plugin seleccionado para esa ranura
- Algunos plugins incluidos opcionales se habilitan automáticamente cuando la configuración nombra una
  superficie propiedad de un Plugin, como una referencia de modelo de proveedor, configuración de canal o runtime
  de arnés
- La configuración obsoleta de plugins se conserva mientras `plugins.enabled: false` está activo;
  vuelve a habilitar los plugins antes de ejecutar la limpieza de doctor si quieres eliminar ids obsoletos
- Las rutas Codex de la familia OpenAI mantienen límites de Plugin separados:
  `openai-codex/*` pertenece al Plugin de OpenAI, mientras que el Plugin de servidor de aplicaciones
  Codex incluido se selecciona con `agentRuntime.id: "codex"` o referencias de modelo
  `codex/*` heredadas

## Solución de problemas de hooks de runtime

Si un Plugin aparece en `plugins list` pero los efectos secundarios o hooks de `register(api)`
no se ejecutan en el tráfico de chat en vivo, revisa primero esto:

- Ejecuta `openclaw gateway status --deep --require-rpc` y confirma que la URL de
  Gateway activa, el perfil, la ruta de configuración y el proceso son los que estás editando.
- Reinicia el Gateway en vivo después de cambios de instalación/configuración/código del Plugin. En contenedores
  envoltorio, PID 1 puede ser solo un supervisor; reinicia o señala el proceso hijo
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` para confirmar los registros de hooks y
  diagnósticos. Los hooks de conversación no incluidos como `llm_input`,
  `llm_output`, `before_agent_finalize` y `agent_end` necesitan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para cambiar de modelo, prefiere `before_model_resolve`. Se ejecuta antes de la resolución
  de modelo para turnos de agente; `llm_output` solo se ejecuta después de que un intento de modelo
  produce salida del asistente.
- Para comprobar el modelo efectivo de la sesión, usa `openclaw sessions` o las
  superficies de sesión/estado del Gateway y, al depurar payloads de proveedores, inicia
  el Gateway con `--raw-stream --raw-stream-path <path>`.

### Propiedad duplicada de canal o herramienta

Síntomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Esto significa que más de un Plugin habilitado intenta poseer el mismo canal,
flujo de configuración o nombre de herramienta. La causa más común es un Plugin de canal externo
instalado junto a un Plugin incluido que ahora proporciona el mismo id de canal.

Pasos de depuración:

- Ejecuta `openclaw plugins list --enabled --verbose` para ver cada Plugin habilitado
  y su origen.
- Ejecuta `openclaw plugins inspect <id> --json` para cada Plugin sospechoso y
  compara `channels`, `channelConfigs`, `tools` y diagnósticos.
- Ejecuta `openclaw plugins registry --refresh` después de instalar o eliminar
  paquetes de Plugin para que los metadatos persistidos reflejen la instalación actual.
- Reinicia el Gateway después de cambios de instalación, registro o configuración.

Opciones de corrección:

- Si un Plugin reemplaza intencionalmente a otro para el mismo id de canal, el
  Plugin preferido debe declarar `channelConfigs.<channel-id>.preferOver` con
  el id de Plugin de menor prioridad. Consulta [/plugins/manifest#replacing-another-channel-plugin](/es/plugins/manifest#replacing-another-channel-plugin).
- Si el duplicado es accidental, deshabilita un lado con
  `plugins.entries.<plugin-id>.enabled: false` o elimina la instalación obsoleta del Plugin.
- Si habilitaste explícitamente ambos plugins, OpenClaw conserva esa solicitud y
  reporta el conflicto. Elige un propietario para el canal o renombra las herramientas propiedad del Plugin
  para que la superficie de runtime no sea ambigua.

## Ranuras de Plugin (categorías exclusivas)

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

| Ranura          | Qué controla          | Valor predeterminado |
| --------------- | --------------------- | -------------------- |
| `memory`        | Plugin de memoria activa | `memory-core`       |
| `contextEngine` | Motor de contexto activo | `legacy` (integrado) |

## Referencia de CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los plugins incluidos se distribuyen con OpenClaw. Muchos están habilitados de forma predeterminada (por ejemplo
proveedores de modelos incluidos, proveedores de voz incluidos y el Plugin de navegador incluido).
Otros plugins incluidos todavía necesitan `openclaw plugins enable <id>`.

`--force` sobrescribe in situ un Plugin instalado o paquete de hooks existente. Usa
`openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm
rastreados. No es compatible con `--link`, que reutiliza la ruta fuente en lugar
de copiar sobre un destino de instalación administrado.

Cuando `plugins.allow` ya está definido, `openclaw plugins install` añade el
id del Plugin instalado a esa lista de permitidos antes de habilitarlo. Si el mismo id de Plugin
está presente en `plugins.deny`, la instalación elimina esa entrada denegada obsoleta para que la
instalación explícita pueda cargarse inmediatamente después del reinicio.

OpenClaw mantiene un registro local persistido de plugins como modelo de lectura en frío para
inventario de plugins, propiedad de contribuciones y planificación de arranque. Los flujos de instalación, actualización,
desinstalación, habilitación y deshabilitación actualizan ese registro después de cambiar el estado de plugins. El mismo archivo `plugins/installs.json` mantiene metadatos de instalación duraderos en
`installRecords` de nivel superior y metadatos de manifiesto reconstruibles en `plugins`. Si
falta el registro, está obsoleto o no es válido, `openclaw plugins registry
--refresh` reconstruye su vista de manifiestos a partir de registros de instalación, política de configuración y
metadatos de manifiesto/paquete sin cargar módulos de runtime de plugins.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar
una especificación de paquete npm con un dist-tag o versión exacta resuelve el nombre del paquete
de vuelta al registro del Plugin rastreado y registra la nueva especificación para futuras actualizaciones.
Pasar el nombre del paquete sin una versión mueve una instalación fijada exacta de vuelta a
la línea de publicación predeterminada del registro. Si el Plugin npm instalado ya coincide
con la versión resuelta y la identidad de artefacto registrada, OpenClaw omite la actualización
sin descargar, reinstalar ni reescribir la configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones de marketplace persisten metadatos de fuente de marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos
positivos del escáner integrado de código peligroso. Permite que instalaciones de Plugin
y actualizaciones de Plugin continúen después de hallazgos `critical` integrados, pero aún
no omite bloqueos de política `before_install` de Plugin ni bloqueos por fallos de escaneo.
Los escaneos de instalación ignoran archivos y directorios de prueba comunes como `tests/`,
`__tests__/`, `*.test.*` y `*.spec.*` para evitar bloquear mocks de prueba empaquetados;
los entrypoints de runtime de Plugin declarados aún se escanean aunque usen uno de
esos nombres.

Esta bandera de CLI se aplica solo a flujos de instalación/actualización de Plugin. Las instalaciones de
dependencias de Skills respaldadas por Gateway usan en su lugar la anulación de solicitud
`dangerouslyForceUnsafeInstall` correspondiente, mientras que `openclaw skills install` sigue siendo el flujo separado de descarga/instalación de Skills de ClawHub.

Si un Plugin que publicaste en ClawHub está oculto o bloqueado por un escaneo, abre el
panel de ClawHub o ejecuta `clawhub package rescan <name>` para pedir a ClawHub que lo revise
de nuevo. `--dangerously-force-unsafe-install` solo afecta las instalaciones en tu propia
máquina; no pide a ClawHub que vuelva a escanear el Plugin ni que haga pública una publicación
bloqueada.

Los paquetes compatibles participan en el mismo flujo de lista/inspección/habilitación/deshabilitación
de plugins. El soporte de runtime actual incluye Skills de paquetes, command-skills de Claude,
valores predeterminados de `settings.json` de Claude, valores predeterminados de Claude `.lsp.json` y de
`lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks
Codex compatibles.

`openclaw plugins inspect <id>` también informa las capacidades de paquetes detectadas, además de
entradas de servidor MCP y LSP admitidas o no admitidas para plugins respaldados por paquetes.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude desde
`~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local o ruta
`marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repo de GitHub
o una URL git. Para marketplaces remotos, las entradas de plugins deben permanecer dentro del
repo de marketplace clonado y usar solo fuentes de ruta relativa.

Consulta la [referencia de CLI de `openclaw plugins`](/es/cli/plugins) para detalles completos.

## Resumen de la API de Plugin

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los plugins
más antiguos todavía pueden usar `activate(api)` como alias heredado, pero los plugins nuevos deben
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
activación del plugin. El cargador aún recurre a `activate(api)` para plugins más
antiguos, pero los plugins incluidos y los nuevos plugins externos deben tratar
`register` como el contrato público.

`api.registrationMode` indica a un plugin por qué se está cargando su entrada:

| Modo            | Significado                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | Activación en tiempo de ejecución. Registra herramientas, hooks, servicios, comandos, rutas y otros efectos secundarios activos.                       |
| `discovery`     | Descubrimiento de capacidades de solo lectura. Registra proveedores y metadatos; el código de entrada de plugins de confianza puede cargarse, pero omite efectos secundarios activos. |
| `setup-only`    | Carga de metadatos de configuración de canal mediante una entrada de configuración ligera.                                                             |
| `setup-runtime` | Carga de configuración de canal que también necesita la entrada en tiempo de ejecución.                                                                |
| `cli-metadata`  | Solo recopilación de metadatos de comandos de la CLI.                                                                                                 |

Las entradas de plugins que abren sockets, bases de datos, workers en segundo plano o clientes
de larga duración deben proteger esos efectos secundarios con `api.registrationMode === "full"`.
Las cargas de descubrimiento se almacenan en caché por separado de las cargas de activación y no reemplazan
el registro del Gateway en ejecución. El descubrimiento no activa, pero no está libre de importaciones:
OpenClaw puede evaluar la entrada del plugin de confianza o el módulo de plugin de canal para crear
la instantánea. Mantén los niveles superiores de los módulos ligeros y sin efectos secundarios, y mueve
clientes de red, subprocesos, listeners, lecturas de credenciales e inicio de servicios
detrás de rutas de tiempo de ejecución completo.

Métodos comunes de registro:

| Método                                  | Qué registra                            |
| --------------------------------------- | --------------------------------------- |
| `registerProvider`                      | Proveedor de modelo (LLM)               |
| `registerChannel`                       | Canal de chat                           |
| `registerTool`                          | Herramienta de agente                   |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida                  |
| `registerSpeechProvider`                | Texto a voz / STT                       |
| `registerRealtimeTranscriptionProvider` | STT en streaming                        |
| `registerRealtimeVoiceProvider`         | Voz en tiempo real dúplex               |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio                |
| `registerImageGenerationProvider`       | Generación de imágenes                  |
| `registerMusicGenerationProvider`       | Generación de música                    |
| `registerVideoGenerationProvider`       | Generación de video                     |
| `registerWebFetchProvider`              | Proveedor de obtención / scraping web   |
| `registerWebSearchProvider`             | Búsqueda web                            |
| `registerHttpRoute`                     | Endpoint HTTP                           |
| `registerCommand` / `registerCli`       | Comandos de la CLI                      |
| `registerContextEngine`                 | Motor de contexto                       |
| `registerService`                       | Servicio en segundo plano               |

Comportamiento de protección de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los manejadores de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los manejadores de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los manejadores de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no elimina una cancelación anterior.

Las ejecuciones del servidor de aplicaciones nativo de Codex conectan de vuelta los eventos de herramientas nativas de Codex a esta
superficie de hooks. Los plugins pueden bloquear herramientas nativas de Codex mediante `before_tool_call`,
observar resultados mediante `after_tool_call` y participar en aprobaciones de
`PermissionRequest` de Codex. El puente todavía no reescribe los argumentos de herramientas nativas de Codex.
El límite exacto de compatibilidad del entorno de ejecución de Codex está en el
[contrato de compatibilidad de Codex harness v1](/es/plugins/codex-harness#v1-support-contract).

Para ver el comportamiento completo de hooks tipados, consulta [descripción general del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Crear plugins](/es/plugins/building-plugins) — crea tu propio plugin
- [Paquetes de plugins](/es/plugins/bundles) — compatibilidad de paquetes Codex/Claude/Cursor
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema del manifiesto
- [Registrar herramientas](/es/plugins/building-plugins#registering-agent-tools) — agrega herramientas de agente en un plugin
- [Elementos internos de plugins](/es/plugins/architecture) — modelo de capacidades y canalización de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
