---
read_when:
    - Instalar o configurar plugins
    - Comprender las reglas de descubrimiento y carga de plugins
    - Trabajar con paquetes de Plugin compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y administrar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-30T06:06:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
arneses de agentes, herramientas, skills, voz, transcripción en tiempo real, voz en
tiempo real, comprensión de medios, generación de imágenes, generación de video, obtención web, búsqueda
web y más. Algunos plugins son **centrales** (se entregan con OpenClaw), otros
son **externos**. La mayoría de los plugins externos se publican y descubren mediante
[ClawHub](/es/tools/clawhub). Npm sigue siendo compatible para instalaciones directas y para un
conjunto temporal de paquetes de plugins propiedad de OpenClaw mientras termina esa migración.

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

    Luego configura en `plugins.entries.\<id\>.config` en tu archivo de configuración.

  </Step>
</Steps>

Si prefieres control nativo por chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, especificación explícita
`clawhub:<pkg>`, especificación explícita `npm:<pkg>` o especificación de paquete simple (primero ClawHub y luego
alternativa de npm).

Si la configuración no es válida, la instalación normalmente falla de forma cerrada y te dirige a
`openclaw doctor --fix`. La única excepción de recuperación es una ruta estrecha de reinstalación de plugins
incluidos para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.
Durante el inicio del Gateway, la configuración no válida de un plugin se aísla a ese plugin:
el inicio registra el problema de `plugins.entries.<id>.config`, omite ese plugin durante
la carga y mantiene en línea los demás plugins y canales. Ejecuta `openclaw doctor --fix`
para poner en cuarentena la configuración incorrecta del plugin deshabilitando esa entrada de plugin y eliminando
su carga de configuración no válida; la copia de seguridad normal de configuración conserva los valores anteriores.
Cuando una configuración de canal hace referencia a un plugin que ya no se puede descubrir, pero el
mismo id de plugin obsoleto permanece en la configuración de plugins o en registros de instalación, el inicio del Gateway
registra advertencias y omite ese canal en lugar de bloquear todos los demás canales.
Ejecuta `openclaw doctor --fix` para eliminar las entradas obsoletas de canal/plugin; las claves
de canal desconocidas sin evidencia de plugin obsoleto siguen fallando la validación para que los errores tipográficos sigan
visibles.
Si se establece `plugins.enabled: false`, las referencias obsoletas a plugins se tratan como inertes:
el inicio del Gateway omite el trabajo de descubrimiento/carga de plugins y `openclaw doctor` conserva
la configuración de plugins deshabilitada en lugar de eliminarla automáticamente. Vuelve a habilitar los plugins antes de
ejecutar la limpieza de doctor si quieres eliminar ids de plugins obsoletos.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el árbol
de dependencias de runtime de cada plugin incluido. Cuando un plugin incluido propiedad de OpenClaw está activo desde
la configuración de plugins, la configuración de canal heredada o un manifiesto habilitado de forma predeterminada, el inicio
repara solo las dependencias de runtime declaradas de ese plugin antes de importarlo.
El estado de autenticación persistido de un canal por sí solo no activa un canal incluido para
la reparación de dependencias de runtime durante el inicio del Gateway.
La deshabilitación explícita sigue prevaleciendo: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` y `channels.<id>.enabled: false`
impiden la reparación automática de dependencias de runtime incluidas para ese plugin/canal.
Un `plugins.allow` no vacío también limita la reparación de dependencias de runtime incluidas
habilitadas de forma predeterminada; la habilitación explícita de un canal incluido (`channels.<id>.enabled: true`) aún puede
reparar las dependencias del plugin de ese canal.
Los plugins externos y las rutas de carga personalizadas aún deben instalarse mediante
`openclaw plugins install`.

## Tipos de plugins

OpenClaw reconoce dos formatos de plugin:

| Formato    | Cómo funciona                                                     | Ejemplos                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; se ejecuta en proceso  | Plugins oficiales, paquetes npm de la comunidad        |
| **Paquete** | Diseño compatible con Codex/Claude/Cursor; asignado a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Paquetes de plugins](/es/plugins/bundles) para obtener detalles sobre paquetes.

Si estás escribiendo un plugin nativo, empieza con [Crear plugins](/es/plugins/building-plugins)
y la [Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Puntos de entrada de paquetes

Los paquetes npm de plugins nativos deben declarar `openclaw.extensions` en `package.json`.
Cada entrada debe permanecer dentro del directorio del paquete y resolverse a un archivo de
runtime legible, o a un archivo fuente TypeScript con un par JavaScript compilado
inferido, como `src/index.ts` a `dist/index.js`.

Usa `openclaw.runtimeExtensions` cuando los archivos de runtime publicados no vivan en las
mismas rutas que las entradas fuente. Cuando esté presente, `runtimeExtensions` debe contener
exactamente una entrada por cada entrada de `extensions`. Las listas no coincidentes hacen fallar la instalación y
el descubrimiento de plugins en lugar de recurrir silenciosamente a las rutas fuente.

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
migrado a ClawHub, OpenClaw sigue distribuyendo algunos paquetes de plugins `@openclaw/*` en
npm para instalaciones antiguas/personalizadas y flujos de trabajo directos con npm.

Si npm informa que un paquete de plugin `@openclaw/*` está obsoleto, esa versión de paquete
pertenece a una línea de paquetes externos anterior. Usa el plugin incluido de
OpenClaw actual o un checkout local hasta que se publique un paquete npm más reciente.

| Plugin          | Paquete                    | Docs                                       |
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

### Centrales (incluidos con OpenClaw)

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
    - `memory-lancedb` — memoria a largo plazo instalable bajo demanda con recuperación/captura automática (establece `plugins.slots.memory = "memory-lancedb"`)

    Consulta [Memory LanceDB](/es/plugins/memory-lancedb) para la configuración de embeddings compatibles con OpenAI,
    ejemplos de Ollama, límites de recuperación y solución de problemas.

  </Accordion>

  <Accordion title="Proveedores de voz (habilitados de forma predeterminada)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — plugin de navegador incluido para la herramienta de navegador, la CLI `openclaw browser`, el método Gateway `browser.request`, el runtime de navegador y el servicio de control de navegador predeterminado (habilitado de forma predeterminada; deshabilítalo antes de reemplazarlo)
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

| Campo            | Descripción                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruptor maestro (predeterminado: `true`)              |
| `allow`          | Lista de permitidos de plugins (opcional)                 |
| `deny`           | Lista de denegados de plugins (opcional; deny gana)       |
| `load.paths`     | Archivos/directorios de plugins adicionales               |
| `slots`          | Selectores de ranura exclusivos (p. ej., `memory`, `contextEngine`) |
| `entries.\<id\>` | Activaciones por plugin + configuración                   |

Los cambios de configuración **requieren reiniciar el Gateway**. Si el Gateway se ejecuta con vigilancia de configuración
+ reinicio en proceso habilitado (la ruta predeterminada de `openclaw gateway`), ese
reinicio normalmente se realiza automáticamente un momento después de que se escriba la configuración.
No existe una ruta de recarga en caliente compatible para código de runtime de plugins nativos ni hooks de ciclo de vida;
reinicia el proceso del Gateway que atiende el canal en vivo antes de
esperar que se ejecute código `register(api)` actualizado, hooks `api.on(...)`, herramientas, servicios o
hooks de proveedor/runtime.

`openclaw plugins list` es una instantánea local del registro/configuración de plugins. Un plugin
`enabled` allí significa que el registro persistido y la configuración actual permiten que el
plugin participe. No demuestra que un proceso hijo de Gateway remoto ya en ejecución
se haya reiniciado con el mismo código de plugin. En configuraciones VPS/contenedor con
procesos envoltorio, envía reinicios al proceso real `openclaw gateway run`,
o usa `openclaw gateway restart` contra el Gateway en ejecución.

<Accordion title="Estados de plugins: deshabilitado vs ausente vs no válido">
  - **Deshabilitado**: el plugin existe, pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Ausente**: la configuración hace referencia a un id de plugin que el descubrimiento no encontró.
  - **No válido**: el plugin existe, pero su configuración no coincide con el esquema declarado. El inicio del Gateway omite solo ese plugin; `openclaw doctor --fix` puede poner en cuarentena la entrada no válida deshabilitándola y eliminando su carga de configuración.

</Accordion>

## Descubrimiento y precedencia

OpenClaw busca plugins en este orden (gana la primera coincidencia):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` — rutas explícitas de archivos o directorios. Las rutas que apuntan
    de vuelta a los propios directorios empaquetados de plugins incluidos de OpenClaw se ignoran;
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
árbol compilado `dist/extensions`. Si un directorio fuente de un plugin incluido se
monta con bind sobre la ruta fuente empaquetada correspondiente, por ejemplo
`/app/extensions/synology-chat`, OpenClaw trata ese directorio fuente montado
como una superposición de fuente incluida y lo descubre antes que el paquete
`/app/dist/extensions/synology-chat` empaquetado. Esto mantiene funcionando los
ciclos de contenedor de mantenimiento sin volver a cambiar cada plugin incluido a fuente TypeScript.
Define `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forzar los paquetes dist empaquetados
incluso cuando haya montajes de superposición de fuente presentes.

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins y omite el trabajo de descubrimiento/carga de plugins
- `plugins.deny` siempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese plugin
- Los plugins originados en el espacio de trabajo están **deshabilitados de forma predeterminada** (deben habilitarse explícitamente)
- Los plugins incluidos siguen el conjunto integrado predeterminado habilitado salvo que se anule
- Los espacios exclusivos pueden forzar la habilitación del plugin seleccionado para ese espacio
- Algunos plugins incluidos de suscripción explícita se habilitan automáticamente cuando la configuración nombra una
  superficie propiedad de un plugin, como una referencia de modelo de proveedor, configuración de canal o runtime
  de arnés
- La configuración obsoleta de plugins se conserva mientras `plugins.enabled: false` está activo;
  vuelve a habilitar los plugins antes de ejecutar la limpieza de doctor si quieres eliminar ids obsoletos
- Las rutas Codex de la familia OpenAI mantienen límites de plugin separados:
  `openai-codex/*` pertenece al plugin OpenAI, mientras que el plugin de servidor de apps Codex
  incluido se selecciona con `agentRuntime.id: "codex"` o referencias de modelo heredadas
  `codex/*`

## Solución de problemas de hooks de runtime

Si un plugin aparece en `plugins list` pero los efectos secundarios o hooks de `register(api)`
no se ejecutan en el tráfico de chat en vivo, comprueba primero lo siguiente:

- Ejecuta `openclaw gateway status --deep --require-rpc` y confirma que la URL activa del
  Gateway, el perfil, la ruta de configuración y el proceso son los que estás editando.
- Reinicia el Gateway en vivo después de cambios de instalación/configuración/código de plugins. En contenedores
  envoltorio, el PID 1 puede ser solo un supervisor; reinicia o envía una señal al proceso hijo
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` para confirmar los registros de hooks y
  diagnósticos. Los hooks de conversación no incluidos, como `llm_input`,
  `llm_output`, `before_agent_finalize` y `agent_end`, necesitan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para cambiar de modelo, prefiere `before_model_resolve`. Se ejecuta antes de la
  resolución de modelos en los turnos del agente; `llm_output` solo se ejecuta después de que un intento de modelo
  produzca salida del asistente.
- Como prueba del modelo de sesión efectivo, usa `openclaw sessions` o las superficies
  de sesión/estado del Gateway y, al depurar cargas útiles de proveedores, inicia
  el Gateway con `--raw-stream --raw-stream-path <path>`.

### Propiedad duplicada de canal o herramienta

Síntomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Esto significa que más de un plugin habilitado intenta poseer el mismo canal,
flujo de configuración o nombre de herramienta. La causa más común es un plugin de canal externo
instalado junto a un plugin incluido que ahora proporciona el mismo id de canal.

Pasos de depuración:

- Ejecuta `openclaw plugins list --enabled --verbose` para ver cada plugin habilitado
  y su origen.
- Ejecuta `openclaw plugins inspect <id> --json` para cada plugin sospechoso y
  compara `channels`, `channelConfigs`, `tools` y los diagnósticos.
- Ejecuta `openclaw plugins registry --refresh` después de instalar o eliminar
  paquetes de plugins para que los metadatos persistidos reflejen la instalación actual.
- Reinicia el Gateway después de cambios de instalación, registro o configuración.

Opciones de corrección:

- Si un plugin sustituye intencionadamente a otro para el mismo id de canal, el
  plugin preferido debe declarar `channelConfigs.<channel-id>.preferOver` con
  el id del plugin de menor prioridad. Consulta [/plugins/manifest#replacing-another-channel-plugin](/es/plugins/manifest#replacing-another-channel-plugin).
- Si el duplicado es accidental, deshabilita un lado con
  `plugins.entries.<plugin-id>.enabled: false` o elimina la instalación obsoleta del plugin.
- Si habilitaste explícitamente ambos plugins, OpenClaw conserva esa solicitud e
  informa del conflicto. Elige un propietario para el canal o cambia el nombre de las herramientas propiedad del plugin
  para que la superficie de runtime no sea ambigua.

## Espacios de plugins (categorías exclusivas)

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

| Espacio         | Qué controla          | Predeterminado      |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de memoria activa | `memory-core`       |
| `contextEngine` | Motor de contexto activo | `legacy` (integrado) |

## Referencia de la CLI

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

Los plugins incluidos se distribuyen con OpenClaw. Muchos están habilitados de forma predeterminada (por ejemplo,
proveedores de modelos incluidos, proveedores de voz incluidos y el plugin de navegador
incluido). Otros plugins incluidos todavía necesitan `openclaw plugins enable <id>`.

`--force` sobrescribe in situ un plugin instalado o paquete de hooks existente. Usa
`openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm
rastreados. No es compatible con `--link`, que reutiliza la ruta fuente en lugar
de copiar sobre un destino de instalación administrado.

Cuando `plugins.allow` ya está definido, `openclaw plugins install` añade el
id del plugin instalado a esa lista de permitidos antes de habilitarlo. Si el mismo id de plugin
está presente en `plugins.deny`, la instalación elimina esa entrada obsoleta de deny para que la
instalación explícita se pueda cargar inmediatamente después de reiniciar.

OpenClaw mantiene un registro local persistido de plugins como modelo de lectura en frío para
el inventario de plugins, la propiedad de contribuciones y la planificación de inicio. Los flujos de instalación, actualización,
desinstalación, habilitación y deshabilitación actualizan ese registro después de cambiar el
estado del plugin. El mismo archivo `plugins/installs.json` conserva metadatos duraderos de instalación en
`installRecords` de nivel superior y metadatos de manifiesto reconstruibles en `plugins`. Si
el registro falta, está obsoleto o no es válido, `openclaw plugins registry
--refresh` reconstruye su vista de manifiestos a partir de registros de instalación, políticas de configuración y
metadatos de manifiesto/paquete sin cargar módulos de runtime de plugins.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar
una especificación de paquete npm con una dist-tag o versión exacta resuelve el nombre del paquete
de vuelta al registro del plugin rastreado y registra la nueva especificación para futuras actualizaciones.
Pasar el nombre del paquete sin versión mueve una instalación fijada exacta de vuelta a
la línea de publicación predeterminada del registro. Si el plugin npm instalado ya coincide
con la versión resuelta y la identidad del artefacto registrada, OpenClaw omite la actualización
sin descargar, reinstalar ni reescribir la configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones de marketplace persisten metadatos de fuente de marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos
positivos del escáner integrado de código peligroso. Permite que las instalaciones de plugins
y las actualizaciones de plugins continúen pese a hallazgos integrados `critical`, pero aun así
no omite los bloqueos de política `before_install` del plugin ni el bloqueo por fallos de escaneo.
Los escaneos de instalación ignoran archivos y directorios de prueba comunes, como `tests/`,
`__tests__/`, `*.test.*` y `*.spec.*`, para evitar bloquear mocks de prueba empaquetados;
los puntos de entrada de runtime declarados por el plugin se siguen escaneando aunque usen uno de
esos nombres.

Esta bandera de CLI se aplica solo a los flujos de instalación/actualización de plugins. Las instalaciones de dependencias de Skills
respaldadas por Gateway usan en su lugar la anulación de solicitud `dangerouslyForceUnsafeInstall`
correspondiente, mientras que `openclaw skills install` sigue siendo el flujo separado de descarga/instalación de Skills
de ClawHub.

Si un plugin que publicaste en ClawHub está oculto o bloqueado por un escaneo, abre el
panel de ClawHub o ejecuta `clawhub package rescan <name>` para pedir a ClawHub que lo revise
de nuevo. `--dangerously-force-unsafe-install` solo afecta las instalaciones en tu propia
máquina; no pide a ClawHub que vuelva a escanear el plugin ni que haga pública una publicación
bloqueada.

Los paquetes compatibles participan en el mismo flujo de lista/inspección/habilitación/deshabilitación
de plugins. El soporte de runtime actual incluye Skills de paquete, Skills de comandos de Claude,
valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y
`lspServers` declarados en manifiesto, Skills de comandos de Cursor y directorios de hooks
Codex compatibles.

`openclaw plugins inspect <id>` también informa de capacidades de paquete detectadas, además de
entradas de servidor MCP y LSP compatibles o no compatibles para plugins respaldados por paquetes.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude de
`~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local o una ruta
`marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub
o una URL git. Para marketplaces remotos, las entradas de plugins deben permanecer dentro del
repositorio de marketplace clonado y usar solo fuentes de ruta relativa.

Consulta la [referencia de la CLI `openclaw plugins`](/es/cli/plugins) para ver todos los detalles.

## Resumen de la API de plugins

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los plugins
antiguos aún pueden usar `activate(api)` como alias heredado, pero los plugins nuevos deben
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
activación del plugin. El cargador todavía recurre a `activate(api)` para plugins antiguos,
pero los plugins incluidos y los nuevos plugins externos deben tratar `register` como el
contrato público.

`api.registrationMode` indica a un plugin por qué se está cargando su entrada:

| Modo            | Significado                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activación en tiempo de ejecución. Registra herramientas, ganchos, servicios, comandos, rutas y otros efectos secundarios activos.        |
| `discovery`     | Descubrimiento de capacidades de solo lectura. Registra proveedores y metadatos; el código de entrada de Plugin de confianza puede cargarse, pero omite los efectos secundarios activos. |
| `setup-only`    | Carga de metadatos de configuración de canal mediante una entrada de configuración ligera.                                                |
| `setup-runtime` | Carga de configuración de canal que también necesita la entrada de tiempo de ejecución.                                                    |
| `cli-metadata`  | Solo recopilación de metadatos de comandos de CLI.                                                                                        |

Las entradas de Plugin que abren sockets, bases de datos, trabajadores en segundo plano o clientes de larga duración deben proteger esos efectos secundarios con `api.registrationMode === "full"`. Las cargas de descubrimiento se almacenan en caché por separado de las cargas de activación y no reemplazan el registro del Gateway en ejecución. El descubrimiento no activa, pero no está libre de importaciones: OpenClaw puede evaluar la entrada de Plugin de confianza o el módulo de Plugin de canal para crear la instantánea. Mantén ligeros y sin efectos secundarios los niveles superiores de los módulos, y mueve clientes de red, subprocesos, escuchas, lecturas de credenciales e inicio de servicios detrás de rutas de tiempo de ejecución completo.

Métodos comunes de registro:

| Método                                  | Qué registra                         |
| --------------------------------------- | ------------------------------------ |
| `registerProvider`                      | Proveedor de modelos (LLM)           |
| `registerChannel`                       | Canal de chat                        |
| `registerTool`                          | Herramienta de agente                |
| `registerHook` / `on(...)`              | Ganchos del ciclo de vida            |
| `registerSpeechProvider`                | Texto a voz / STT                    |
| `registerRealtimeTranscriptionProvider` | STT en streaming                     |
| `registerRealtimeVoiceProvider`         | Voz dúplex en tiempo real            |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio             |
| `registerImageGenerationProvider`       | Generación de imágenes               |
| `registerMusicGenerationProvider`       | Generación de música                 |
| `registerVideoGenerationProvider`       | Generación de video                  |
| `registerWebFetchProvider`              | Proveedor de obtención / scraping web |
| `registerWebSearchProvider`             | Búsqueda web                         |
| `registerHttpRoute`                     | Endpoint HTTP                        |
| `registerCommand` / `registerCli`       | Comandos de CLI                      |
| `registerContextEngine`                 | Motor de contexto                    |
| `registerService`                       | Servicio en segundo plano            |

Comportamiento de protección para ganchos de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los manejadores de menor prioridad.
- `before_tool_call`: `{ block: false }` no tiene efecto y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los manejadores de menor prioridad.
- `before_install`: `{ block: false }` no tiene efecto y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los manejadores de menor prioridad.
- `message_sending`: `{ cancel: false }` no tiene efecto y no elimina una cancelación anterior.

Las ejecuciones del servidor de aplicaciones nativo de Codex reenvían los eventos de herramientas nativas de Codex de vuelta a esta superficie de ganchos. Los Plugins pueden bloquear herramientas nativas de Codex mediante `before_tool_call`, observar resultados mediante `after_tool_call` y participar en las aprobaciones `PermissionRequest` de Codex. El puente todavía no reescribe los argumentos de herramientas nativas de Codex. El límite exacto de soporte del tiempo de ejecución de Codex se encuentra en el [contrato de soporte del arnés de Codex v1](/es/plugins/codex-harness#v1-support-contract).

Para ver el comportamiento completo de los ganchos tipados, consulta la [descripción general del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Crear plugins](/es/plugins/building-plugins) — crea tu propio Plugin
- [Paquetes de Plugin](/es/plugins/bundles) — compatibilidad con paquetes de Codex/Claude/Cursor
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema del manifiesto
- [Registrar herramientas](/es/plugins/building-plugins#registering-agent-tools) — añade herramientas de agente en un Plugin
- [Elementos internos de Plugin](/es/plugins/architecture) — modelo de capacidades y canalización de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
