---
read_when:
    - Configurar OpenClaw por primera vez
    - Buscar patrones de configuración comunes
    - Ir a secciones específicas de configuración
summary: 'Resumen de configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-04-23T14:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuración

OpenClaw lee una configuración opcional en <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`.
La ruta de configuración activa debe ser un archivo normal. Los diseños de
`openclaw.json` con enlaces simbólicos no son compatibles con las escrituras gestionadas por OpenClaw; una escritura atómica puede reemplazar
la ruta en lugar de conservar el enlace simbólico. Si mantienes la configuración fuera del
directorio de estado predeterminado, apunta `OPENCLAW_CONFIG_PATH` directamente al archivo real.

Si el archivo no existe, OpenClaw usa valores predeterminados seguros. Motivos habituales para añadir configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Establecer modelos, herramientas, sandboxing o automatización (Cron, hooks)
- Ajustar sesiones, medios, red o UI

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
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Abre [http://127.0.0.1:18789](http://127.0.0.1:18789) y usa la pestaña **Config**.
    La Control UI renderiza un formulario a partir del esquema de configuración activo, incluidos los metadatos de documentación
    `title` / `description`, además de los esquemas de Plugin y canal cuando
    están disponibles, con un editor de **Raw JSON** como vía de escape. Para UIs
    de exploración detallada y otras herramientas, el Gateway también expone `config.schema.lookup` para
    recuperar un nodo del esquema con ámbito de ruta y resúmenes inmediatos de sus hijos.
  </Tab>
  <Tab title="Edición directa">
    Edita `~/.openclaw/openclaw.json` directamente. El Gateway vigila el archivo y aplica los cambios automáticamente (consulta [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan por completo con el esquema. Las claves desconocidas, los tipos mal formados o los valores no válidos hacen que el Gateway **se niegue a iniciar**. La única excepción a nivel raíz es `$schema` (cadena), para que los editores puedan adjuntar metadatos de JSON Schema.
</Warning>

`openclaw config schema` imprime el JSON Schema canónico usado por Control UI
y por la validación. `config.schema.lookup` recupera un único nodo con ámbito de ruta más
resúmenes de sus hijos para herramientas de exploración detallada. Los metadatos de documentación de los campos `title`/`description`
se propagan a través de objetos anidados, comodines (`*`), elementos de array (`[]`) y ramas `anyOf`/
`oneOf`/`allOf`. Los esquemas de Plugin y canal en runtime se fusionan cuando se carga el
registro de manifiestos.

Cuando la validación falla:

- El Gateway no se inicia
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecuta `openclaw doctor` para ver los problemas exactos
- Ejecuta `openclaw doctor --fix` (o `--yes`) para aplicar reparaciones

El Gateway conserva una copia fiable del último estado correcto después de cada inicio exitoso.
Si posteriormente `openclaw.json` falla la validación (o elimina `gateway.mode`, se reduce
drásticamente o tiene una línea de registro extraña al principio), OpenClaw conserva el archivo roto
como `.clobbered.*`, restaura la última copia correcta y registra el motivo de la recuperación.
El siguiente turno del agente también recibe una advertencia de evento del sistema para que el agente principal
no reescriba ciegamente la configuración restaurada. La promoción a último estado correcto
se omite cuando un candidato contiene marcadores de posición de secretos redactados como `***`.

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

    Todos los canales comparten el mismo patrón de política de MD:

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
    Establece el modelo principal y alternativas opcionales:

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

    - `agents.defaults.models` define el catálogo de modelos y actúa como lista de permitidos para `/model`.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas a la lista de permitidos sin eliminar modelos existentes. Los reemplazos simples que eliminarían entradas se rechazan a menos que pases `--replace`.
    - Las referencias de modelo usan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de imágenes en transcripciones/herramientas (predeterminado `1200`); los valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulta [CLI de modelos](/es/concepts/models) para cambiar modelos en el chat y [Failover de modelo](/es/concepts/model-failover) para ver el comportamiento de rotación de autenticación y alternativas.
    - Para proveedores personalizados/autohospedados, consulta [Proveedores personalizados](/es/gateway/configuration-reference#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso por MD se controla por canal mediante `dmPolicy`:

    - `"pairing"` (predeterminado): los remitentes desconocidos reciben un código de emparejamiento de un solo uso para aprobar
    - `"allowlist"`: solo los remitentes de `allowFrom` (o del almacén de permitidos emparejado)
    - `"open"`: permite todos los MD entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los MD

    Para grupos, usa `groupPolicy` + `groupAllowFrom` o listas de permitidos específicas del canal.

    Consulta la [referencia completa](/es/gateway/configuration-reference#dm-and-group-access) para ver detalles por canal.

  </Accordion>

  <Accordion title="Configurar la restricción por mención en chats de grupo">
    Los mensajes de grupo requieren **mención** de forma predeterminada. Configura patrones por agente:

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

    - **Menciones de metadatos**: menciones nativas con @ (WhatsApp tocar para mencionar, Telegram @bot, etc.)
    - **Patrones de texto**: patrones regex seguros en `mentionPatterns`
    - Consulta la [referencia completa](/es/gateway/configuration-reference#group-chat-mention-gating) para ver sobrescrituras por canal y el modo de chat con uno mismo.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Usa `agents.defaults.skills` para una línea base compartida y luego sobrescribe
    agentes específicos con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hereda github, weather
          { id: "docs", skills: ["docs-search"] }, // reemplaza los predeterminados
          { id: "locked-down", skills: [] }, // sin Skills
        ],
      },
    }
    ```

    - Omite `agents.defaults.skills` para permitir Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar los valores predeterminados.
    - Establece `agents.list[].skills: []` para no tener Skills.
    - Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y
      la [Referencia de configuración](/es/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar la supervisión de salud de canales del Gateway">
    Controla con qué agresividad el Gateway reinicia canales que parecen obsoletos:

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

    - Establece `gateway.channelHealthCheckMinutes: 0` para desactivar globalmente los reinicios por supervisión de salud.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de comprobación.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desactivar los reinicios automáticos de un canal o una cuenta sin desactivar el monitor global.
    - Consulta [Comprobaciones de salud](/es/gateway/health) para depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para ver todos los campos.

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
    - Consulta [Gestión de sesiones](/es/concepts/session) para ver ámbito, enlaces de identidad y política de envío.
    - Consulta la [referencia completa](/es/gateway/configuration-reference#session) para ver todos los campos.

  </Accordion>

  <Accordion title="Habilitar sandboxing">
    Ejecuta sesiones de agente en runtimes sandbox aislados:

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

    Primero compila la imagen: `scripts/sandbox-setup.sh`

    Consulta [Sandboxing](/es/gateway/sandboxing) para ver la guía completa y la [referencia completa](/es/gateway/configuration-reference#agentsdefaultssandbox) para todas las opciones.

  </Accordion>

  <Accordion title="Habilitar push con relay para compilaciones oficiales de iOS">
    El push con relay se configura en `openclaw.json`.

    Establece esto en la configuración del Gateway:

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

    - Permite que el Gateway envíe `push.test`, avisos de activación y activaciones de reconexión a través del relay externo.
    - Usa un permiso de envío con ámbito de registro reenviado por la app iOS emparejada. El Gateway no necesita un token de relay para toda la implementación.
    - Vincula cada registro respaldado por relay a la identidad del Gateway con la que se emparejó la app iOS, de modo que otro Gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales/manuales de iOS en APNs directo. Los envíos respaldados por relay se aplican solo a compilaciones oficiales distribuidas que se registraron a través del relay.
    - Debe coincidir con la URL base del relay integrada en la compilación oficial/TestFlight de iOS, para que el tráfico de registro y envío llegue a la misma implementación del relay.

    Flujo de extremo a extremo:

    1. Instala una compilación oficial/TestFlight de iOS que se haya compilado con la misma URL base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` en el Gateway.
    3. Empareja la app iOS con el Gateway y deja que se conecten tanto las sesiones de Node como las de operador.
    4. La app iOS obtiene la identidad del Gateway, se registra con el relay usando App Attest más el recibo de la app y luego publica la carga útil `push.apns.register` respaldada por relay en el Gateway emparejado.
    5. El Gateway almacena el identificador del relay y el permiso de envío, y luego los usa para `push.test`, avisos de activación y activaciones de reconexión.

    Notas operativas:

    - Si cambias la app iOS a otro Gateway, vuelve a conectar la app para que pueda publicar un nuevo registro de relay vinculado a ese Gateway.
    - Si distribuyes una nueva compilación de iOS que apunta a otra implementación de relay, la app actualiza su registro de relay en caché en lugar de reutilizar el origen de relay anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como sobrescrituras temporales de entorno.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape de desarrollo solo para loopback; no conserves URL de relay HTTP en la configuración.

    Consulta [App iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para ver el flujo de extremo a extremo y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para ver el modelo de seguridad del relay.

  </Accordion>

  <Accordion title="Configurar Heartbeat (comprobaciones periódicas)">
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

    - `every`: cadena de duración (`30m`, `2h`). Establece `0m` para desactivar.
    - `target`: `last` | `none` | `<channel-id>` (por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predeterminado) o `block` para destinos de Heartbeat de estilo MD
    - Consulta [Heartbeat](/es/gateway/heartbeat) para ver la guía completa.

  </Accordion>

  <Accordion title="Configurar trabajos de Cron">
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

    - `sessionRetention`: poda las sesiones completadas de ejecuciones aisladas de `sessions.json` (predeterminado `24h`; establece `false` para desactivar).
    - `runLog`: poda `cron/runs/<jobId>.jsonl` por tamaño y líneas conservadas.
    - Consulta [Trabajos de Cron](/es/automation/cron-jobs) para ver la visión general de funciones y ejemplos de CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (hooks)">
    Habilita endpoints HTTP de Webhook en el Gateway:

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
    - Trata todo el contenido de las cargas útiles de hook/Webhook como entrada no confiable.
    - Usa un `hooks.token` dedicado; no reutilices el token compartido del Gateway.
    - La autenticación de hook es solo por encabezado (`Authorization: Bearer ...` o `x-openclaw-token`); los tokens en query string se rechazan.
    - `hooks.path` no puede ser `/`; mantén el ingreso de Webhook en una subruta dedicada como `/hooks`.
    - Mantén desactivados los indicadores de omisión de contenido inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a menos que estés haciendo depuración muy acotada.
    - Si activas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para limitar las claves de sesión seleccionadas por el llamante.
    - Para agentes impulsados por hooks, prefiere niveles de modelo modernos y potentes y una política estricta de herramientas (por ejemplo, solo mensajería más sandboxing cuando sea posible).

    Consulta la [referencia completa](/es/gateway/configuration-reference#hooks) para ver todas las opciones de mapeo e integración con Gmail.

  </Accordion>

  <Accordion title="Configurar enrutamiento de varios agentes">
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

    Consulta [Varios agentes](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/configuration-reference#multi-agent-routing) para ver reglas de enlace y perfiles de acceso por agente.

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
    - **Array de archivos**: fusión profunda en orden (el posterior prevalece)
    - **Claves hermanas**: se fusionan después de los includes (sobrescriben valores incluidos)
    - **Includes anidados**: admitidos hasta 10 niveles de profundidad
    - **Rutas relativas**: se resuelven respecto al archivo que incluye
    - **Escrituras gestionadas por OpenClaw**: cuando una escritura cambia solo una sección de nivel superior
      respaldada por un include de archivo único como `plugins: { $include: "./plugins.json5" }`,
      OpenClaw actualiza ese archivo incluido y deja intacto `openclaw.json`
    - **Escritura a través no compatible**: los includes raíz, arrays de includes e includes
      con sobrescrituras hermanas fallan en modo cerrado para escrituras gestionadas por OpenClaw en lugar de
      aplanar la configuración
    - **Gestión de errores**: errores claros para archivos faltantes, errores de análisis e includes circulares

  </Accordion>
</AccordionGroup>

## Recarga en caliente de configuración

El Gateway vigila `~/.openclaw/openclaw.json` y aplica los cambios automáticamente: no hace falta reiniciar manualmente para la mayoría de los ajustes.

Las ediciones directas del archivo se tratan como no confiables hasta que validan. El observador espera
a que se estabilice la actividad de escritura temporal/renombrado del editor, lee el archivo final y rechaza
ediciones externas no válidas restaurando la configuración del último estado correcto. Las escrituras de configuración
gestionadas por OpenClaw usan la misma barrera de esquema antes de escribir; las sobrescrituras destructivas
como eliminar `gateway.mode` o reducir el archivo a menos de la mitad se rechazan
y se guardan como `.rejected.*` para inspección.

Si ves `Config auto-restored from last-known-good` o
`config reload restored last-known-good config` en los registros, inspecciona el archivo
`.clobbered.*` correspondiente junto a `openclaw.json`, corrige la carga útil rechazada y luego ejecuta
`openclaw config validate`. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config)
para ver la lista de recuperación.

### Modos de recarga

| Modo                   | Comportamiento                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica en caliente los cambios seguros al instante. Reinicia automáticamente para los críticos. |
| **`hot`**              | Aplica en caliente solo cambios seguros. Registra una advertencia cuando se necesita reinicio: tú te encargas. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, seguro o no.               |
| **`off`**              | Desactiva la vigilancia del archivo. Los cambios surten efecto en el siguiente reinicio manual. |

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
| Canales            | `channels.*`, `web` (WhatsApp) — todos los canales integrados y de Plugin | No              |
| Agente y modelos      | `agent`, `agents`, `models`, `routing`                            | No              |
| Automatización          | `hooks`, `cron`, `agent.heartbeat`                                | No              |
| Sesiones y mensajes | `session`, `messages`                                             | No              |
| Herramientas y medios       | `tools`, `browser`, `skills`, `audio`, `talk`                     | No              |
| UI y varios           | `ui`, `logging`, `identity`, `bindings`                           | No              |
| Servidor Gateway      | `gateway.*` (puerto, bind, auth, Tailscale, TLS, HTTP)              | **Sí**         |
| Infraestructura      | `discovery`, `canvasHost`, `plugins`                              | **Sí**         |

<Note>
`gateway.reload` y `gateway.remote` son excepciones: cambiarlos **no** activa un reinicio.
</Note>

### Planificación de recarga

Cuando editas un archivo fuente al que se hace referencia mediante `$include`, OpenClaw planifica
la recarga a partir del diseño creado en el origen, no de la vista aplanada en memoria.
Eso mantiene predecibles las decisiones de recarga en caliente (aplicar en caliente o reiniciar) incluso cuando
una sola sección de nivel superior vive en su propio archivo incluido como
`plugins: { $include: "./plugins.json5" }`. La planificación de recarga falla en modo cerrado si el
diseño de origen es ambiguo.

## RPC de configuración (actualizaciones programáticas)

Para herramientas que escriben configuración a través de la API del Gateway, prefiere este flujo:

- `config.schema.lookup` para inspeccionar un subárbol (nodo de esquema superficial + resúmenes
  de hijos)
- `config.get` para obtener la instantánea actual más `hash`
- `config.patch` para actualizaciones parciales (JSON merge patch: los objetos se fusionan, `null`
  elimina, los arrays reemplazan)
- `config.apply` solo cuando pretendas reemplazar toda la configuración
- `update.run` para autoactualización explícita más reinicio

<Note>
Las escrituras del plano de control (`config.apply`, `config.patch`, `update.run`) tienen
límite de tasa de 3 solicitudes por 60 segundos por `deviceId+clientIp`. Las solicitudes de reinicio
se agrupan y luego aplican un enfriamiento de 30 segundos entre ciclos de reinicio.
</Note>

Ejemplo de parche parcial:

```bash
openclaw gateway call config.get --params '{}'  # captura payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Tanto `config.apply` como `config.patch` aceptan `raw`, `baseHash`, `sessionKey`,
`note` y `restartDelayMs`. `baseHash` es obligatorio para ambos métodos cuando ya
existe una configuración.

## Variables de entorno

OpenClaw lee variables de entorno del proceso padre más:

- `.env` desde el directorio de trabajo actual (si existe)
- `~/.openclaw/.env` (respaldo global)

Ninguno de los dos archivos sobrescribe variables de entorno ya existentes. También puedes establecer variables de entorno en línea en la configuración:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importación de variables de entorno del shell (opcional)">
  Si está habilitado y las claves esperadas no están establecidas, OpenClaw ejecuta tu shell de inicio de sesión e importa solo las claves que faltan:

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
- Las variables faltantes o vacías generan un error en el momento de carga
- Escapa con `$${VAR}` para salida literal
- Funciona dentro de archivos `$include`
- Sustitución en línea: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencias a secretos (env, file, exec)">
  Para campos que admiten objetos SecretRef, puedes usar:

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

Los detalles de SecretRef (incluidos `secrets.providers` para `env`/`file`/`exec`) están en [Gestión de Secrets](/es/gateway/secrets).
Las rutas de credenciales compatibles se enumeran en [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
</Accordion>

Consulta [Entorno](/es/help/environment) para ver la precedencia completa y las fuentes.

## Referencia completa

Para la referencia completa campo por campo, consulta **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_
