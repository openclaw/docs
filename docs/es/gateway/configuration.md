---
read_when:
    - Configurar OpenClaw por primera vez
    - Buscar patrones comunes de configuración
    - Ir a secciones específicas de configuración
summary: 'Descripción general de la configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-04-24T05:28:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw lee una configuración opcional en <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`.
La ruta de configuración activa debe ser un archivo normal. Los diseños con `openclaw.json`
mediante enlace simbólico no son compatibles para escrituras propiedad de OpenClaw; una escritura atómica puede reemplazar
la ruta en lugar de conservar el enlace simbólico. Si mantienes la configuración fuera del
directorio de estado predeterminado, haz que `OPENCLAW_CONFIG_PATH` apunte directamente al archivo real.

Si falta el archivo, OpenClaw usa valores predeterminados seguros. Motivos comunes para añadir una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Establecer modelos, herramientas, sandboxing o automatización (cron, hooks)
- Ajustar sesiones, multimedia, red o interfaz de usuario

Consulta la [referencia completa](/es/gateway/configuration-reference) para ver todos los campos disponibles.

<Tip>
**¿Eres nuevo en la configuración?** Empieza con `openclaw onboard` para una configuración interactiva, o consulta la guía de [Ejemplos de configuración](/es/gateway/configuration-examples) para ver configuraciones completas listas para copiar y pegar.
</Tip>

## Configuración mínima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Editar la configuración

<Tabs>
  <Tab title="Asistente interactivo">
    ```bash
    openclaw onboard       # flujo completo de incorporación
    openclaw configure     # asistente de configuración
    ```
  </Tab>
  <Tab title="CLI (una sola línea)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Interfaz de Control">
    Abre [http://127.0.0.1:18789](http://127.0.0.1:18789) y usa la pestaña **Config**.
    La interfaz de Control renderiza un formulario a partir del esquema activo de configuración, incluidos los metadatos de documentación de campo
    `title` / `description`, además de los esquemas de Plugins y canales cuando
    están disponibles, con un editor de **Raw JSON** como vía de escape. Para interfaces
    detalladas y otras herramientas, el gateway también expone `config.schema.lookup` para
    obtener un nodo de esquema limitado a una ruta junto con resúmenes inmediatos de sus hijos.
  </Tab>
  <Tab title="Edición directa">
    Edita `~/.openclaw/openclaw.json` directamente. El Gateway observa el archivo y aplica los cambios automáticamente (consulta [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan completamente con el esquema. Las claves desconocidas, los tipos mal formados o los valores no válidos hacen que el Gateway **se niegue a arrancar**. La única excepción en el nivel raíz es `$schema` (cadena), para que los editores puedan adjuntar metadatos de JSON Schema.
</Warning>

`openclaw config schema` imprime el JSON Schema canónico usado por la interfaz de Control
y por la validación. `config.schema.lookup` obtiene un único nodo limitado a una ruta junto con
resúmenes de hijos para herramientas de navegación detallada. Los metadatos de documentación de campo `title`/`description`
se conservan en objetos anidados, comodines (`*`), elementos de arrays (`[]`) y ramas `anyOf`/
`oneOf`/`allOf`. Los esquemas de Plugins y canales en tiempo de ejecución se fusionan cuando se carga
el registro de manifiestos.

Cuando falla la validación:

- El Gateway no arranca
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecuta `openclaw doctor` para ver los problemas exactos
- Ejecuta `openclaw doctor --fix` (o `--yes`) para aplicar reparaciones

El Gateway conserva una copia fiable del último estado válido después de cada arranque correcto.
Si `openclaw.json` falla más tarde en la validación (o pierde `gateway.mode`, se reduce
drásticamente o tiene una línea de log extra al principio), OpenClaw conserva el archivo roto
como `.clobbered.*`, restaura la última copia válida conocida y registra el motivo de la recuperación.
El siguiente turno del agente también recibe una advertencia de evento del sistema para que el agente principal
no reescriba ciegamente la configuración restaurada. La promoción a última configuración válida conocida
se omite cuando una candidata contiene marcadores de posición de secretos redactados como `***`.

## Tareas comunes

<AccordionGroup>
  <Accordion title="Configurar un canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tiene su propia sección de configuración en `channels.<provider>`. Consulta la página dedicada del canal para ver los pasos de configuración:

    - [WhatsApp](/es/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/es/channels/telegram) — `channels.telegram`
    - [Discord](/es/channels/discord) — `channels.discord`
    - [Feishu](/es/channels/feishu) — `channels.feishu`
    - [Google Chat](/es/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/es/channels/msteams) — `channels.msteams`
    - [Slack](/es/channels/slack) — `channels.slack`
    - [Signal](/es/channels/signal) — `channels.signal`
    - [iMessage](/es/channels/imessage) — `channels.imessage`
    - [Mattermost](/es/channels/mattermost) — `channels.mattermost`

    Todos los canales comparten el mismo patrón de política de mensajes directos:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // solo para allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Elegir y configurar modelos">
    Establece el modelo principal y los respaldos opcionales:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` define el catálogo de modelos y actúa como la lista de permitidos para `/model`.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas a la lista de permitidos sin eliminar modelos existentes. Los reemplazos simples que eliminarían entradas se rechazan a menos que pases `--replace`.
    - Las referencias de modelo usan el formato `provider/model` (por ejemplo `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de imágenes de transcripciones/herramientas (predeterminado `1200`); los valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulta [CLI de Modelos](/es/concepts/models) para cambiar de modelo en el chat y [Conmutación por error de modelos](/es/concepts/model-failover) para ver el comportamiento de rotación de autenticación y respaldo.
    - Para proveedores personalizados/autohospedados, consulta [proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso de mensajes directos se controla por canal mediante `dmPolicy`:

    - `"pairing"` (predeterminado): los remitentes desconocidos reciben un código único de vinculación para aprobar
    - `"allowlist"`: solo remitentes en `allowFrom` (o en el almacén de permitidos vinculado)
    - `"open"`: permite todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los mensajes directos

    Para grupos, usa `groupPolicy` + `groupAllowFrom` o listas de permitidos específicas del canal.

    Consulta la [referencia completa](/es/gateway/config-channels#dm-and-group-access) para ver detalles por canal.

  </Accordion>

  <Accordion title="Configurar el filtrado por mención en chats grupales">
    Los mensajes de grupo requieren **mención obligatoria** de forma predeterminada. Configura patrones por agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Menciones por metadatos**: menciones nativas @ (mención táctil de WhatsApp, @bot de Telegram, etc.)
    - **Patrones de texto**: patrones regex seguros en `mentionPatterns`
    - Consulta la [referencia completa](/es/gateway/config-channels#group-chat-mention-gating) para ver sobrescrituras por canal y modo self-chat.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Usa `agents.defaults.skills` para una base compartida y luego sobrescribe agentes
    específicos con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hereda github, weather
          { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
          { id: "locked-down", skills: [] }, // sin Skills
        ],
      },
    }
    ```

    - Omite `agents.defaults.skills` para tener Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar los valores predeterminados.
    - Establece `agents.list[].skills: []` para no tener Skills.
    - Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y
      la [Referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar la monitorización del estado de los canales del gateway">
    Controla con qué agresividad el gateway reinicia canales que parecen obsoletos:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Establece `gateway.channelHealthCheckMinutes: 0` para desactivar globalmente los reinicios del monitor de estado.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de comprobación.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desactivar los reinicios automáticos de un canal o cuenta sin desactivar el monitor global.
    - Consulta [Comprobaciones de estado](/es/gateway/health) para la depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para ver todos los campos.

  </Accordion>

  <Accordion title="Configurar sesiones y restablecimientos">
    Las sesiones controlan la continuidad y el aislamiento de la conversación:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recomendado para varios usuarios
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (compartido) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones vinculadas a hilos (Discord admite `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age`).
    - Consulta [Gestión de sesiones](/es/concepts/session) para ver alcance, enlaces de identidad y política de envío.
    - Consulta la [referencia completa](/es/gateway/config-agents#session) para ver todos los campos.

  </Accordion>

  <Accordion title="Habilitar sandboxing">
    Ejecuta sesiones del agente en runtimes sandbox aislados:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Compila primero la imagen: `scripts/sandbox-setup.sh`

    Consulta [Sandboxing](/es/gateway/sandboxing) para la guía completa y la [referencia completa](/es/gateway/config-agents#agentsdefaultssandbox) para ver todas las opciones.

  </Accordion>

  <Accordion title="Habilitar push respaldado por relay para compilaciones oficiales de iOS">
    El push respaldado por relay se configura en `openclaw.json`.

    Establece esto en la configuración del gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opcional. Predeterminado: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Equivalente en CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Qué hace esto:

    - Permite que el gateway envíe `push.test`, avisos de activación y reactivaciones de reconexión a través del relay externo.
    - Usa una concesión de envío con alcance de registro reenviada por la app iOS vinculada. El gateway no necesita un token de relay para toda la implementación.
    - Vincula cada registro respaldado por relay a la identidad del gateway con la que se vinculó la app iOS, de modo que otro gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales/manuales de iOS en APNs directo. Los envíos respaldados por relay solo se aplican a compilaciones oficiales distribuidas que se registraron mediante el relay.
    - Debe coincidir con la URL base del relay integrada en la compilación oficial/TestFlight de iOS, para que el tráfico de registro y envío llegue a la misma implementación del relay.

    Flujo de extremo a extremo:

    1. Instala una compilación oficial/TestFlight de iOS que se haya compilado con la misma URL base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` en el gateway.
    3. Vincula la app iOS al gateway y deja que se conecten tanto las sesiones de nodo como de operador.
    4. La app iOS obtiene la identidad del gateway, se registra con el relay usando App Attest más el recibo de la app y luego publica la carga `push.apns.register` respaldada por relay en el gateway vinculado.
    5. El gateway almacena el identificador del relay y la concesión de envío, y luego los usa para `push.test`, avisos de activación y reactivaciones de reconexión.

    Notas operativas:

    - Si cambias la app iOS a otro gateway, vuelve a conectar la app para que pueda publicar un nuevo registro de relay vinculado a ese gateway.
    - Si distribuyes una nueva compilación de iOS que apunte a una implementación de relay diferente, la app actualiza su registro de relay almacenado en caché en lugar de reutilizar el origen de relay anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como sobrescrituras temporales mediante variables de entorno.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape solo para loopback en desarrollo; no persistas URL de relay HTTP en la configuración.

    Consulta [App iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para ver el flujo completo de extremo a extremo y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para ver el modelo de seguridad del relay.

  </Accordion>

  <Accordion title="Configurar heartbeat (comprobaciones periódicas)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: cadena de duración (`30m`, `2h`). Establece `0m` para desactivarlo.
    - `target`: `last` | `none` | `<channel-id>` (por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predeterminado) o `block` para destinos heartbeat de estilo mensaje directo
    - Consulta [Heartbeat](/es/gateway/heartbeat) para la guía completa.

  </Accordion>

  <Accordion title="Configurar trabajos cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: poda sesiones completadas de ejecuciones aisladas de `sessions.json` (predeterminado `24h`; establece `false` para desactivarlo).
    - `runLog`: poda `cron/runs/<jobId>.jsonl` por tamaño y líneas retenidas.
    - Consulta [Trabajos cron](/es/automation/cron-jobs) para ver una descripción general de la funcionalidad y ejemplos de CLI.

  </Accordion>

  <Accordion title="Configurar webhooks (hooks)">
    Habilita endpoints HTTP de webhook en el Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Nota de seguridad:
    - Trata todo el contenido de cargas de hook/webhook como entrada no fiable.
    - Usa un `hooks.token` dedicado; no reutilices el token compartido del Gateway.
    - La autenticación de hooks es solo por cabecera (`Authorization: Bearer ...` o `x-openclaw-token`); los tokens en la cadena de consulta se rechazan.
    - `hooks.path` no puede ser `/`; mantén la entrada de webhooks en una subruta dedicada como `/hooks`.
    - Mantén desactivados los indicadores de omisión de contenido inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) salvo para depuración muy delimitada.
    - Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para limitar las claves de sesión elegidas por quien llama.
    - Para agentes impulsados por hooks, prefiere niveles de modelos modernos sólidos y una política de herramientas estricta (por ejemplo, solo mensajería más sandboxing cuando sea posible).

    Consulta la [referencia completa](/es/gateway/configuration-reference#hooks) para ver todas las opciones de mapeo y la integración con Gmail.

  </Accordion>

  <Accordion title="Configurar enrutamiento multiagente">
    Ejecuta varios agentes aislados con espacios de trabajo y sesiones separados:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Consulta [Multi-Agent](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/config-agents#multi-agent-routing) para ver reglas de binding y perfiles de acceso por agente.

  </Accordion>

  <Accordion title="Dividir la configuración en varios archivos ($include)">
    Usa `$include` para organizar configuraciones grandes:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Archivo único**: reemplaza el objeto contenedor
    - **Array de archivos**: se fusiona profundamente en orden (el posterior tiene prioridad)
    - **Claves hermanas**: se fusionan después de los includes (sobrescriben los valores incluidos)
    - **Includes anidados**: compatibles hasta 10 niveles de profundidad
    - **Rutas relativas**: se resuelven relativas al archivo que incluye
    - **Escrituras propiedad de OpenClaw**: cuando una escritura cambia solo una sección de nivel superior
      respaldada por un include de archivo único como `plugins: { $include: "./plugins.json5" }`,
      OpenClaw actualiza ese archivo incluido y deja `openclaw.json` intacto
    - **Escritura directa no compatible**: los includes de raíz, arrays de includes e includes
      con sobrescrituras hermanas fallan de forma segura para las escrituras propiedad de OpenClaw en lugar de
      aplanar la configuración
    - **Manejo de errores**: errores claros para archivos faltantes, errores de análisis e includes circulares

  </Accordion>
</AccordionGroup>

## Recarga en caliente de la configuración

El Gateway observa `~/.openclaw/openclaw.json` y aplica los cambios automáticamente: no hace falta reinicio manual para la mayoría de los ajustes.

Las ediciones directas del archivo se tratan como no fiables hasta que validan. El observador espera
a que termine el vaivén de escrituras temporales/renombrados del editor, lee el archivo final y rechaza
las ediciones externas no válidas restaurando la última configuración válida conocida. Las escrituras de
configuración propiedad de OpenClaw usan la misma barrera de esquema antes de escribir; las
sobrescrituras destructivas como eliminar `gateway.mode` o reducir el archivo a más de la mitad se rechazan
y se guardan como `.rejected.*` para su inspección.

Si ves `Config auto-restored from last-known-good` o
`config reload restored last-known-good config` en los logs, inspecciona el archivo
`.clobbered.*` correspondiente junto a `openclaw.json`, corrige la carga rechazada y luego ejecuta
`openclaw config validate`. Consulta [Solución de problemas de Gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config)
para ver la lista de recuperación.

### Modos de recarga

| Modo                  | Comportamiento                                                                          |
| --------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica en caliente los cambios seguros al instante. Reinicia automáticamente para los críticos. |
| **`hot`**             | Aplica en caliente solo los cambios seguros. Registra una advertencia cuando hace falta reiniciar: tú te encargas. |
| **`restart`**         | Reinicia el Gateway con cualquier cambio de configuración, sea seguro o no.             |
| **`off`**             | Desactiva la observación de archivos. Los cambios surten efecto en el siguiente reinicio manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica en caliente y qué necesita reinicio

La mayoría de los campos se aplican en caliente sin tiempo de inactividad. En modo `hybrid`, los cambios que requieren reinicio se gestionan automáticamente.

| Categoría            | Campos                                                            | ¿Necesita reinicio? |
| ------------------- | ----------------------------------------------------------------- | ------------------- |
| Canales             | `channels.*`, `web` (WhatsApp) — todos los canales integrados y de Plugin | No                  |
| Agente y modelos    | `agent`, `agents`, `models`, `routing`                            | No                  |
| Automatización      | `hooks`, `cron`, `agent.heartbeat`                                | No                  |
| Sesiones y mensajes | `session`, `messages`                                             | No                  |
| Herramientas y multimedia | `tools`, `browser`, `skills`, `audio`, `talk`               | No                  |
| UI y varios         | `ui`, `logging`, `identity`, `bindings`                           | No                  |
| Servidor Gateway    | `gateway.*` (puerto, bind, auth, tailscale, TLS, HTTP)            | **Sí**              |
| Infraestructura     | `discovery`, `canvasHost`, `plugins`                              | **Sí**              |

<Note>
`gateway.reload` y `gateway.remote` son excepciones: cambiarlos **no** provoca reinicio.
</Note>

### Planificación de recarga

Cuando editas un archivo fuente referenciado mediante `$include`, OpenClaw planifica
la recarga a partir del diseño creado en el origen, no de la vista en memoria aplanada.
Eso mantiene predecibles las decisiones de recarga en caliente (aplicar en caliente o reiniciar) incluso cuando una
única sección de nivel superior vive en su propio archivo incluido, como
`plugins: { $include: "./plugins.json5" }`. La planificación de recarga falla de forma segura si el
diseño de origen es ambiguo.

## RPC de configuración (actualizaciones programáticas)

Para herramientas que escriben configuración mediante la API del gateway, prefiere este flujo:

- `config.schema.lookup` para inspeccionar un subárbol (nodo superficial del esquema + resúmenes
  de hijos)
- `config.get` para obtener la instantánea actual más `hash`
- `config.patch` para actualizaciones parciales (JSON merge patch: los objetos se fusionan, `null`
  elimina, los arrays reemplazan)
- `config.apply` solo cuando pretendas reemplazar toda la configuración
- `update.run` para una autoactualización explícita más reinicio

<Note>
Las escrituras del plano de control (`config.apply`, `config.patch`, `update.run`) están
limitadas a 3 solicitudes por 60 segundos por `deviceId+clientIp`. Las solicitudes de reinicio
se agrupan y luego aplican un enfriamiento de 30 segundos entre ciclos de reinicio.
</Note>

Ejemplo de parche parcial:

```bash
openclaw gateway call config.get --params '{}'  # capturar payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Tanto `config.apply` como `config.patch` aceptan `raw`, `baseHash`, `sessionKey`,
`note` y `restartDelayMs`. `baseHash` es obligatorio en ambos métodos cuando ya
existe una configuración.

## Variables de entorno

OpenClaw lee variables de entorno del proceso padre además de:

- `.env` del directorio de trabajo actual (si existe)
- `~/.openclaw/.env` (respaldo global)

Ninguno de los archivos sobrescribe variables de entorno existentes. También puedes establecer variables de entorno en línea en la configuración:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importación del entorno del shell (opcional)">
  Si está habilitado y las claves esperadas no están configuradas, OpenClaw ejecuta tu shell de inicio de sesión e importa solo las claves que faltan:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente en variable de entorno: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Sustitución de variables de entorno en valores de configuración">
  Haz referencia a variables de entorno en cualquier valor de cadena de configuración con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo coinciden nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`
- Las variables faltantes o vacías generan un error en el momento de la carga
- Usa `$${VAR}` para salida literal
- Funciona dentro de archivos `$include`
- Sustitución en línea: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Refs de secretos (env, file, exec)">
  Para los campos que admiten objetos SecretRef, puedes usar:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Los detalles de SecretRef (incluidos `secrets.providers` para `env`/`file`/`exec`) están en [Gestión de secretos](/es/gateway/secrets).
Las rutas de credenciales compatibles se enumeran en [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Accordion>

Consulta [Entorno](/es/help/environment) para ver la precedencia completa y las fuentes.

## Referencia completa

Para la referencia completa campo por campo, consulta **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Runbook de Gateway](/es/gateway)
