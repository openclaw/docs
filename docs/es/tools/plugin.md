---
read_when:
    - Instalar o configurar plugins
    - Entender las reglas de detección y carga de plugins
    - Trabajar con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y gestionar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:40:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
entornos de agente, herramientas, Skills, voz, transcripción en tiempo real, voz en tiempo real,
comprensión de medios, generación de imágenes, generación de video, obtención web, búsqueda web
y más. Algunos plugins son **core** (incluidos con OpenClaw), otros
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

    # Desde un directorio local o un archivo
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar el Gateway">
    ```bash
    openclaw gateway restart
    ```

    Luego configúralo en `plugins.entries.\<id\>.config` en tu archivo de configuración.

  </Step>
</Steps>

Si prefieres el control nativo por chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, `clawhub:<pkg>`
explícito, o especificación de paquete simple (primero ClawHub, luego respaldo en npm).

Si la configuración no es válida, la instalación normalmente falla de forma segura y te dirige a
`openclaw doctor --fix`. La única excepción de recuperación es una ruta limitada de
reinstalación de plugin incluido para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el árbol
de dependencias de tiempo de ejecución de cada plugin incluido.
Cuando un plugin incluido propiedad de OpenClaw está activo desde la configuración
del plugin, configuración heredada del canal o un manifiesto habilitado por defecto, el inicio
repara solo las dependencias de tiempo de ejecución declaradas por ese plugin antes de importarlo.
El estado persistido de autenticación del canal por sí solo no activa un canal incluido para la
reparación de dependencias de tiempo de ejecución del Gateway al iniciar.
La desactivación explícita sigue teniendo prioridad: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` y `channels.<id>.enabled: false`
impiden la reparación automática de dependencias de tiempo de ejecución incluidas para ese plugin/canal.
Un `plugins.allow` no vacío también limita la reparación predeterminada de dependencias de tiempo de ejecución
incluidas habilitadas por defecto; la habilitación explícita de un canal incluido (`channels.<id>.enabled: true`) aún puede
reparar las dependencias del plugin de ese canal.
Los plugins externos y las rutas de carga personalizadas aún deben instalarse mediante
`openclaw plugins install`.

## Tipos de plugin

OpenClaw reconoce dos formatos de plugin:

| Formato    | Cómo funciona                                                    | Ejemplos                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de tiempo de ejecución; se ejecuta en proceso | Plugins oficiales, paquetes npm de la comunidad        |
| **Bundle** | Diseño compatible con Codex/Claude/Cursor; mapeado a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Plugin Bundles](/es/plugins/bundles) para detalles sobre bundles.

Si estás escribiendo un plugin nativo, empieza con [Building Plugins](/es/plugins/building-plugins)
y la [Plugin SDK Overview](/es/plugins/sdk-overview).

## Puntos de entrada del paquete

Los paquetes npm de plugins nativos deben declarar `openclaw.extensions` en `package.json`.
Cada entrada debe permanecer dentro del directorio del paquete y resolverse a un archivo
de tiempo de ejecución legible, o a un archivo fuente TypeScript con un par JavaScript compilado inferido
como `src/index.ts` a `dist/index.js`.

Usa `openclaw.runtimeExtensions` cuando los archivos de tiempo de ejecución publicados no estén en
las mismas rutas que las entradas fuente. Cuando está presente, `runtimeExtensions` debe contener
exactamente una entrada por cada entrada de `extensions`. Las listas que no coinciden hacen fallar la instalación y
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
    - `memory-core` — búsqueda de memoria incluida (predeterminado mediante `plugins.slots.memory`)
    - `memory-lancedb` — memoria a largo plazo de instalación bajo demanda con recuperación/captura automática (establece `plugins.slots.memory = "memory-lancedb"`)

  </Accordion>

  <Accordion title="Proveedores de voz (habilitados por defecto)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — plugin de navegador incluido para la herramienta de navegador, la CLI `openclaw browser`, el método de gateway `browser.request`, el tiempo de ejecución del navegador y el servicio de control de navegador predeterminado (habilitado por defecto; desactívalo antes de reemplazarlo)
    - `copilot-proxy` — puente de Proxy de VS Code Copilot (deshabilitado por defecto)

  </Accordion>
</AccordionGroup>

¿Buscas plugins de terceros? Consulta [Community Plugins](/es/plugins/community).

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
| `deny`           | Lista de bloqueados de plugins (opcional; deny tiene prioridad) |
| `load.paths`     | Archivos/directorios de plugin adicionales                |
| `slots`          | Selectores de ranura exclusivos (p. ej. `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruptores + configuración por plugin                  |

Los cambios de configuración **requieren reiniciar el gateway**. Si el Gateway se está ejecutando con observación
de configuración + reinicio en proceso habilitado (la ruta predeterminada de `openclaw gateway`), ese
reinicio normalmente se realiza automáticamente un momento después de que se escribe la configuración.
No hay una ruta admitida de recarga en caliente para el código de tiempo de ejecución del plugin nativo ni para los hooks
de ciclo de vida; reinicia el proceso Gateway que sirve el canal activo antes de
esperar que se ejecuten el código `register(api)`, los hooks `api.on(...)`, las herramientas, los servicios o
los hooks de proveedor/tiempo de ejecución actualizados.

`openclaw plugins list` es una instantánea local del registro/configuración de plugins. Un
plugin `enabled` allí significa que el registro persistido y la configuración actual permiten que el
plugin participe. No demuestra que un proceso hijo remoto del Gateway ya en ejecución
se haya reiniciado con el mismo código del plugin. En configuraciones de VPS/contenedor con
procesos envoltorio, envía los reinicios al proceso real `openclaw gateway run`,
o usa `openclaw gateway restart` contra el Gateway en ejecución.

<Accordion title="Estados del plugin: deshabilitado vs ausente vs inválido">
  - **Deshabilitado**: el plugin existe pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Ausente**: la configuración hace referencia a un id de plugin que el descubrimiento no encontró.
  - **Inválido**: el plugin existe pero su configuración no coincide con el esquema declarado.

</Accordion>

## Descubrimiento y precedencia

OpenClaw busca plugins en este orden (la primera coincidencia tiene prioridad):

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
    Incluidos con OpenClaw. Muchos están habilitados por defecto (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

Las instalaciones empaquetadas y las imágenes Docker normalmente resuelven los plugins incluidos desde el
árbol compilado `dist/extensions`. Si un directorio fuente de plugin incluido se monta
por bind sobre la ruta fuente empaquetada correspondiente, por ejemplo
`/app/extensions/synology-chat`, OpenClaw trata ese directorio fuente montado
como una superposición de fuente incluida y lo descubre antes del bundle empaquetado
`/app/dist/extensions/synology-chat`. Esto mantiene funcionales los bucles de contenedor de mantenimiento
sin volver a cambiar todos los plugins incluidos a fuente TypeScript.
Establece `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forzar los bundles dist empaquetados
incluso cuando haya montajes de superposición de fuente presentes.

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins
- `plugins.deny` siempre tiene prioridad sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese plugin
- Los plugins con origen en el espacio de trabajo están **deshabilitados por defecto** (deben habilitarse explícitamente)
- Los plugins incluidos siguen el conjunto integrado habilitado por defecto salvo que se sobrescriba
- Las ranuras exclusivas pueden forzar la habilitación del plugin seleccionado para esa ranura
- Algunos plugins incluidos opcionales se habilitan automáticamente cuando la configuración nombra una
  superficie propiedad del plugin, como una referencia de modelo de proveedor, configuración de canal o
  tiempo de ejecución del entorno
- Las rutas Codex de la familia OpenAI mantienen límites de plugin separados:
  `openai-codex/*` pertenece al plugin OpenAI, mientras que el plugin incluido del servidor de aplicaciones Codex
  se selecciona mediante `agentRuntime.id: "codex"` o referencias heredadas de modelo
  `codex/*`

## Solución de problemas de hooks de tiempo de ejecución

Si un plugin aparece en `plugins list` pero los efectos secundarios o hooks de `register(api)`
no se ejecutan en el tráfico de chat activo, comprueba primero lo siguiente:

- Ejecuta `openclaw gateway status --deep --require-rpc` y confirma que la
  URL activa del Gateway, el perfil, la ruta de configuración y el proceso sean los que estás editando.
- Reinicia el Gateway activo después de cambios de instalación/configuración/código del plugin. En contenedores
  envoltorio, PID 1 puede ser solo un supervisor; reinicia o envía señal al proceso hijo
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` para confirmar registros de hooks y
  diagnósticos. Los hooks de conversación no incluidos, como `llm_input`,
  `llm_output`, `before_agent_finalize` y `agent_end`, necesitan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para cambio de modelo, prefiere `before_model_resolve`. Se ejecuta antes de la resolución
  del modelo para los turnos del agente; `llm_output` solo se ejecuta después de que un intento de modelo
  produce salida del asistente.
- Para demostrar el modelo efectivo de la sesión, usa `openclaw sessions` o las
  superficies de sesión/estado del Gateway y, al depurar cargas útiles del proveedor, inicia
  el Gateway con `--raw-stream --raw-stream-path <path>`.

### Propiedad duplicada de canal o herramienta

Síntomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Esto significa que más de un plugin habilitado está intentando ser propietario del mismo canal,
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

- Si un plugin reemplaza intencionalmente a otro para el mismo id de canal, el
  plugin preferido debe declarar `channelConfigs.<channel-id>.preferOver` con
  el id del plugin de menor prioridad. Consulta [/plugins/manifest#replacing-another-channel-plugin](/es/plugins/manifest#replacing-another-channel-plugin).
- Si el duplicado es accidental, deshabilita uno de los dos con
  `plugins.entries.<plugin-id>.enabled: false` o elimina la instalación
  obsoleta del plugin.
- Si habilitaste explícitamente ambos plugins, OpenClaw conserva esa solicitud y
  reporta el conflicto. Elige un único propietario para el canal o renombra las herramientas
  propiedad del plugin para que la superficie de tiempo de ejecución no sea ambigua.

## Ranuras de plugin (categorías exclusivas)

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

| Ranura          | Qué controla               | Predeterminado      |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Plugin de memoria activa   | `memory-core`       |
| `contextEngine` | Motor de contexto activo   | `legacy` (integrado) |

## Referencia de la CLI

```bash
openclaw plugins list                       # inventario compacto
openclaw plugins list --enabled            # solo plugins habilitados
openclaw plugins list --verbose            # líneas de detalle por plugin
openclaw plugins list --json               # inventario legible por máquina
openclaw plugins inspect <id>              # detalle profundo
openclaw plugins inspect <id> --json       # legible por máquina
openclaw plugins inspect --all             # tabla global
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos
openclaw plugins registry                  # inspeccionar el estado del registro persistido
openclaw plugins registry --refresh        # reconstruir el registro persistido
openclaw doctor --fix                      # reparar el estado del registro de plugins

openclaw plugins install <package>         # instalar (primero ClawHub, luego npm)
openclaw plugins install clawhub:<pkg>     # instalar solo desde ClawHub
openclaw plugins install <spec> --force    # sobrescribir la instalación existente
openclaw plugins install <path>            # instalar desde una ruta local
openclaw plugins install -l <path>         # enlazar (sin copiar) para desarrollo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar la especificación npm exacta resuelta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # actualizar un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # actualizar todos
openclaw plugins uninstall <id>          # eliminar la configuración y los registros del índice de plugins
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los plugins incluidos se distribuyen con OpenClaw. Muchos están habilitados por defecto (por ejemplo,
los proveedores de modelos incluidos, los proveedores de voz incluidos y el plugin de navegador
incluido). Otros plugins incluidos aún requieren `openclaw plugins enable <id>`.

`--force` sobrescribe un plugin instalado existente o un paquete de hooks en su lugar. Usa
`openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm
seguidos. No es compatible con `--link`, que reutiliza la ruta de origen en lugar
de copiar sobre un destino de instalación administrado.

Cuando `plugins.allow` ya está configurado, `openclaw plugins install` agrega el
id del plugin instalado a esa lista de permitidos antes de habilitarlo. Si el mismo id de plugin
está presente en `plugins.deny`, la instalación elimina esa entrada obsoleta de denegación para que la
instalación explícita pueda cargarse inmediatamente después del reinicio.

OpenClaw mantiene un registro local persistido de plugins como modelo de lectura en frío para el
inventario de plugins, la propiedad de contribuciones y la planificación del inicio. Los flujos de instalación, actualización,
desinstalación, habilitación y deshabilitación actualizan ese registro después de cambiar el estado
del plugin. El mismo archivo `plugins/installs.json` mantiene metadatos duraderos de instalación en
`installRecords` de nivel superior y metadatos de manifiesto reconstruibles en `plugins`. Si
el registro falta, está obsoleto o no es válido, `openclaw plugins registry
--refresh` reconstruye su vista del manifiesto a partir de los registros de instalación, la política de configuración y
los metadatos de manifiesto/paquete sin cargar módulos de tiempo de ejecución del plugin.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones seguidas. Pasar
una especificación de paquete npm con una dist-tag o una versión exacta resuelve el nombre del paquete
de vuelta al registro del plugin seguido y registra la nueva especificación para futuras actualizaciones.
Pasar el nombre del paquete sin una versión devuelve una instalación exacta fijada a
la línea de versión predeterminada del registro. Si el plugin npm instalado ya coincide
con la versión resuelta y la identidad del artefacto registrada, OpenClaw omite la actualización
sin descargar, reinstalar ni reescribir la configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones desde marketplace conservan metadatos de origen del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de último recurso para falsos
positivos del escáner integrado de código peligroso. Permite que las instalaciones
y actualizaciones de plugins continúen más allá de hallazgos integrados `critical`, pero aun así
no omite los bloqueos de política `before_install` del plugin ni el bloqueo por fallos del escaneo.

Esta bandera de CLI se aplica solo a los flujos de instalación/actualización de plugins. Las instalaciones
de dependencias de Skills respaldadas por Gateway usan en su lugar la anulación de solicitud correspondiente
`dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo el flujo separado de descarga/instalación
de Skills de ClawHub.

Los bundles compatibles participan en el mismo flujo de listar/inspeccionar/habilitar/deshabilitar
plugins. El soporte actual en tiempo de ejecución incluye bundles de Skills, command-skills de Claude,
valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y
`lspServers` declarados en manifiesto, command-skills de Cursor y directorios de hooks de Codex
compatibles.

`openclaw plugins inspect <id>` también informa las capacidades de bundle detectadas además de las entradas
de servidor MCP y LSP compatibles o no compatibles para plugins respaldados por bundles.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude desde
`~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local o
ruta `marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub
o una URL git. Para marketplaces remotos, las entradas de plugin deben permanecer dentro del
repositorio de marketplace clonado y usar solo fuentes de ruta relativa.

Consulta la [`openclaw plugins` referencia de CLI](/es/cli/plugins) para ver todos los detalles.

## Descripción general de la API de plugins

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
activación del plugin. El cargador aún recurre a `activate(api)` para plugins más antiguos,
pero los plugins incluidos y los nuevos plugins externos deben tratar `register` como el
contrato público.

`api.registrationMode` le indica a un plugin por qué se está cargando su entrada:

| Modo            | Significado                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activación en tiempo de ejecución. Registra herramientas, hooks, servicios, comandos, rutas y otros efectos secundarios en vivo.     |
| `discovery`     | Descubrimiento de capacidades de solo lectura. Registra proveedores y metadatos; el código de entrada del plugin confiable puede cargarse, pero omite los efectos secundarios en vivo. |
| `setup-only`    | Carga de metadatos de configuración de canal mediante una entrada ligera de configuración.                                            |
| `setup-runtime` | Carga de configuración de canal que también necesita la entrada de tiempo de ejecución.                                               |
| `cli-metadata`  | Solo recopilación de metadatos de comandos de CLI.                                                                                    |

Las entradas de plugin que abren sockets, bases de datos, workers en segundo plano o clientes
de larga duración deben proteger esos efectos secundarios con `api.registrationMode === "full"`.
Las cargas de descubrimiento se almacenan en caché por separado de las cargas de activación y no reemplazan
el registro del Gateway en ejecución. El descubrimiento no activa, pero no está libre de importaciones:
OpenClaw puede evaluar la entrada del plugin confiable o el módulo del plugin de canal para construir
la instantánea. Mantén ligeros y sin efectos secundarios los niveles superiores del módulo y mueve
los clientes de red, subprocesos, listeners, lecturas de credenciales y el inicio de servicios
detrás de rutas de tiempo de ejecución completas.

Métodos de registro comunes:

| Método                                  | Qué registra                |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Proveedor de modelos (LLM)  |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Herramienta del agente      |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida      |
| `registerSpeechProvider`                | Texto a voz / STT           |
| `registerRealtimeTranscriptionProvider` | STT en streaming            |
| `registerRealtimeVoiceProvider`         | Voz en tiempo real dúplex   |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio    |
| `registerImageGenerationProvider`       | Generación de imágenes      |
| `registerMusicGenerationProvider`       | Generación de música        |
| `registerVideoGenerationProvider`       | Generación de video         |
| `registerWebFetchProvider`              | Proveedor de obtención / scraping web |
| `registerWebSearchProvider`             | Búsqueda web                |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos de CLI             |
| `registerContextEngine`                 | Motor de contexto           |
| `registerService`                       | Servicio en segundo plano   |

Comportamiento de protección de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los controladores de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no elimina una cancelación anterior.

El app-server nativo de Codex ejecuta un puente que devuelve eventos de herramientas nativas de Codex a esta
superficie de hooks. Los plugins pueden bloquear herramientas nativas de Codex mediante `before_tool_call`,
observar resultados mediante `after_tool_call` y participar en aprobaciones de
`PermissionRequest` de Codex. El puente aún no reescribe los argumentos de herramientas nativas de Codex.
El límite exacto de soporte del tiempo de ejecución de Codex se encuentra en el
[contrato de soporte de Codex harness v1](/es/plugins/codex-harness#v1-support-contract).

Para ver el comportamiento completo de hooks tipados, consulta la [descripción general del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Building plugins](/es/plugins/building-plugins) — crea tu propio plugin
- [Plugin bundles](/es/plugins/bundles) — compatibilidad de bundles de Codex/Claude/Cursor
- [Plugin manifest](/es/plugins/manifest) — esquema del manifiesto
- [Registering tools](/es/plugins/building-plugins#registering-agent-tools) — añade herramientas de agente en un plugin
- [Plugin internals](/es/plugins/architecture) — modelo de capacidades y canalización de carga
- [Community plugins](/es/plugins/community) — listados de terceros
