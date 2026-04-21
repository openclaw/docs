---
read_when:
    - Configurando OpenClaw por primera vez
    - Buscando patrones de configuración comunes
    - Ir a secciones específicas de configuración
summary: 'Resumen de configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-04-21T05:14:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 479e59fb8b57c5228ef1c6076cf80a4ce6064d3f6fad5f38ea9d75eeb92811dc
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuración

OpenClaw lee una configuración opcional en <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`.

Si falta el archivo, OpenClaw usa valores predeterminados seguros. Motivos comunes para agregar una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Configurar modelos, herramientas, sandboxing o automatización (Cron, hooks)
- Ajustar sesiones, medios, red o UI

Consulta la [referencia completa](/es/gateway/configuration-reference) para ver todos los campos disponibles.

<Tip>
**¿Eres nuevo en la configuración?** Comienza con `openclaw onboard` para una configuración interactiva, o revisa la guía de [Ejemplos de configuración](/es/gateway/configuration-examples) para ver configuraciones completas listas para copiar y pegar.
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
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (una línea)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI de Control">
    Abre [http://127.0.0.1:18789](http://127.0.0.1:18789) y usa la pestaña **Config**.
    La UI de Control genera un formulario a partir del esquema de configuración activo, incluida la metadata de documentación de campos `title` / `description`, además de los esquemas de plugins y canales cuando están disponibles, con un editor de **Raw JSON** como vía de escape. Para UIs con navegación en detalle y otras herramientas, el gateway también expone `config.schema.lookup` para obtener un nodo del esquema acotado a una ruta junto con resúmenes inmediatos de sus hijos.
  </Tab>
  <Tab title="Edición directa">
    Edita `~/.openclaw/openclaw.json` directamente. El Gateway vigila el archivo y aplica los cambios automáticamente (consulta [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan completamente con el esquema. Las claves desconocidas, los tipos mal formados o los valores no válidos hacen que el Gateway **se niegue a iniciar**. La única excepción a nivel raíz es `$schema` (string), para que los editores puedan adjuntar metadata de JSON Schema.
</Warning>

Notas sobre las herramientas de esquema:

- `openclaw config schema` imprime la misma familia de JSON Schema que usan la UI de Control y la validación de configuración.
- Trata esa salida de esquema como el contrato canónico legible por máquina para `openclaw.json`; este resumen y la referencia de configuración lo sintetizan.
- Los valores `title` y `description` de los campos se trasladan a la salida del esquema para herramientas de editor y formularios.
- Las entradas de objeto anidado, comodín (`*`) y elementos de array (`[]`) heredan la misma metadata de documentación cuando existe documentación coincidente del campo.
- Las ramas de composición `anyOf` / `oneOf` / `allOf` también heredan la misma metadata de documentación, para que las variantes de unión/intersección mantengan la misma ayuda de campo.
- `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes y campos de validación similares), metadata coincidente de sugerencias de UI y resúmenes inmediatos de hijos para herramientas con navegación en detalle.
- Los esquemas de plugins/canales en runtime se fusionan cuando el gateway puede cargar el registro de manifiestos actual.
- `pnpm config:docs:check` detecta desviaciones entre los artifacts base de configuración orientados a docs y la superficie actual del esquema.

Cuando falla la validación:

- El Gateway no inicia
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecuta `openclaw doctor` para ver los problemas exactos
- Ejecuta `openclaw doctor --fix` (o `--yes`) para aplicar reparaciones

El Gateway también conserva una copia confiable del último estado válido tras un inicio correcto. Si después `openclaw.json` se cambia fuera de OpenClaw y deja de validar, el inicio y la recarga en caliente conservan el archivo roto como una instantánea `.clobbered.*` con marca de tiempo, restauran la última copia válida conocida y registran una advertencia visible con el motivo de la recuperación.
El siguiente turno del agente principal también recibe una advertencia de evento del sistema indicándole que la configuración fue restaurada y que no debe reescribirse a ciegas. La promoción del último estado válido conocido se actualiza después de un inicio validado y después de recargas en caliente aceptadas, incluidas las escrituras de configuración realizadas por OpenClaw cuyo hash de archivo persistido aún coincide con la escritura aceptada. La promoción se omite cuando el candidato contiene placeholders de secretos redactados como `***` o valores de token acortados.

## Tareas comunes

<AccordionGroup>
  <Accordion title="Configurar un canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tiene su propia sección de configuración bajo `channels.<provider>`. Consulta la página dedicada de cada canal para ver los pasos de configuración:

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

    Todos los canales comparten el mismo patrón de política de DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Elegir y configurar modelos">
    Configura el modelo principal y fallbacks opcionales:

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
    - Las referencias de modelo usan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de imágenes en transcripciones/herramientas (predeterminado `1200`); valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulta [Models CLI](/es/concepts/models) para cambiar de modelo en el chat y [Model Failover](/es/concepts/model-failover) para el comportamiento de rotación de autenticación y fallback.
    - Para proveedores personalizados/autohospedados, consulta [Custom providers](/es/gateway/configuration-reference#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso por DM se controla por canal mediante `dmPolicy`:

    - `"pairing"` (predeterminado): los remitentes desconocidos reciben un código de emparejamiento de un solo uso para aprobar
    - `"allowlist"`: solo los remitentes en `allowFrom` (o el almacén de permitidos emparejados)
    - `"open"`: permite todos los DM entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los DM

    Para grupos, usa `groupPolicy` + `groupAllowFrom` o listas de permitidos específicas del canal.

    Consulta la [referencia completa](/es/gateway/configuration-reference#dm-and-group-access) para ver detalles por canal.

  </Accordion>

  <Accordion title="Configurar el filtrado por menciones en chats grupales">
    Los mensajes de grupo requieren mención por defecto. Configura patrones por agente:

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

    - **Menciones de metadata**: menciones @ nativas (mencionar tocando en WhatsApp, @bot en Telegram, etc.)
    - **Patrones de texto**: patrones regex seguros en `mentionPatterns`
    - Consulta la [referencia completa](/es/gateway/configuration-reference#group-chat-mention-gating) para ver sobrescrituras por canal y modo self-chat.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Usa `agents.defaults.skills` para una base compartida y luego sobrescribe agentes específicos con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Omite `agents.defaults.skills` para permitir Skills sin restricciones por defecto.
    - Omite `agents.list[].skills` para heredar los valores predeterminados.
    - Establece `agents.list[].skills: []` para no usar Skills.
    - Consulta [Skills](/es/tools/skills), [configuración de Skills](/es/tools/skills-config) y la [Referencia de configuración](/es/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar la supervisión de salud de canales del gateway">
    Controla cuán agresivamente el gateway reinicia canales que parecen inactivos:

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

    - Establece `gateway.channelHealthCheckMinutes: 0` para deshabilitar globalmente los reinicios del monitor de salud.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de verificación.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para deshabilitar reinicios automáticos para un canal o cuenta sin deshabilitar el monitor global.
    - Consulta [Health Checks](/es/gateway/health) para la depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para ver todos los campos.

  </Accordion>

  <Accordion title="Configurar sesiones y reinicios">
    Las sesiones controlan la continuidad y el aislamiento de la conversación:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
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
    - Consulta [Session Management](/es/concepts/session) para alcance, enlaces de identidad y política de envío.
    - Consulta la [referencia completa](/es/gateway/configuration-reference#session) para ver todos los campos.

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

    Primero construye la imagen: `scripts/sandbox-setup.sh`

    Consulta [Sandboxing](/es/gateway/sandboxing) para la guía completa y la [referencia completa](/es/gateway/configuration-reference#agentsdefaultssandbox) para ver todas las opciones.

  </Accordion>

  <Accordion title="Habilitar push respaldado por relay para compilaciones oficiales de iOS">
    El push respaldado por relay se configura en `openclaw.json`.

    Configura esto en la configuración del gateway:

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

    - Permite que el gateway envíe `push.test`, avisos de activación y activaciones de reconexión a través del relay externo.
    - Usa un permiso de envío con alcance de registro reenviado por la app de iOS emparejada. El gateway no necesita un token de relay de alcance global del despliegue.
    - Vincula cada registro respaldado por relay a la identidad del gateway con la que se emparejó la app de iOS, de modo que otro gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales/manuales de iOS en APNs directo. Los envíos respaldados por relay se aplican solo a las compilaciones oficiales distribuidas que se registraron a través del relay.
    - Debe coincidir con la URL base del relay integrada en la compilación oficial/TestFlight de iOS, para que el tráfico de registro y envío llegue al mismo despliegue de relay.

    Flujo de extremo a extremo:

    1. Instala una compilación oficial/TestFlight de iOS que haya sido compilada con la misma URL base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` en el gateway.
    3. Empareja la app de iOS con el gateway y deja que se conecten tanto las sesiones de Node como las del operador.
    4. La app de iOS obtiene la identidad del gateway, se registra en el relay usando App Attest más el recibo de la app, y luego publica la carga `push.apns.register` respaldada por relay en el gateway emparejado.
    5. El gateway almacena el identificador del relay y el permiso de envío, y luego los usa para `push.test`, avisos de activación y activaciones de reconexión.

    Notas operativas:

    - Si cambias la app de iOS a un gateway diferente, vuelve a conectar la app para que pueda publicar un nuevo registro de relay vinculado a ese gateway.
    - Si distribuyes una nueva compilación de iOS que apunte a un despliegue de relay diferente, la app actualiza su registro de relay en caché en lugar de reutilizar el origen de relay anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como sobrescrituras temporales mediante variables de entorno.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape de desarrollo solo para loopback; no persistas URLs de relay HTTP en la configuración.

    Consulta [iOS App](/es/platforms/ios#relay-backed-push-for-official-builds) para el flujo de extremo a extremo y [Authentication and trust flow](/es/platforms/ios#authentication-and-trust-flow) para el modelo de seguridad del relay.

  </Accordion>

  <Accordion title="Configurar Heartbeat (check-ins periódicos)">
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

    - `every`: cadena de duración (`30m`, `2h`). Establece `0m` para deshabilitarlo.
    - `target`: `last` | `none` | `<channel-id>` (por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predeterminado) o `block` para destinos de Heartbeat tipo DM
    - Consulta [Heartbeat](/es/gateway/heartbeat) para la guía completa.

  </Accordion>

  <Accordion title="Configurar trabajos Cron">
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

    - `sessionRetention`: elimina de `sessions.json` las sesiones aisladas completadas (predeterminado `24h`; establece `false` para deshabilitarlo).
    - `runLog`: depura `cron/runs/<jobId>.jsonl` por tamaño y líneas conservadas.
    - Consulta [Cron jobs](/es/automation/cron-jobs) para ver una descripción general de la función y ejemplos de CLI.

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
    - Trata todo el contenido de carga de hooks/webhooks como entrada no confiable.
    - Usa un `hooks.token` dedicado; no reutilices el token compartido del Gateway.
    - La autenticación de hooks es solo por encabezado (`Authorization: Bearer ...` o `x-openclaw-token`); los tokens en query string se rechazan.
    - `hooks.path` no puede ser `/`; mantén el ingreso de Webhook en una subruta dedicada, como `/hooks`.
    - Mantén deshabilitadas las marcas de bypass de contenido inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) salvo cuando hagas depuración muy acotada.
    - Si habilitas `hooks.allowRequestSessionKey`, también establece `hooks.allowedSessionKeyPrefixes` para limitar las session keys elegidas por el llamador.
    - Para agentes impulsados por hooks, prefiere niveles de modelo modernos y sólidos, y una política de herramientas estricta (por ejemplo, solo mensajería más sandboxing cuando sea posible).

    Consulta la [referencia completa](/es/gateway/configuration-reference#hooks) para ver todas las opciones de mapping e integración con Gmail.

  </Accordion>

  <Accordion title="Configurar enrutamiento multiagente">
    Ejecuta varios agentes aislados con espacios de trabajo y sesiones separadas:

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

    Consulta [Multi-Agent](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/configuration-reference#multi-agent-routing) para ver reglas de binding y perfiles de acceso por agente.

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
    - **Array de archivos**: combinación profunda en orden (el último prevalece)
    - **Claves hermanas**: se combinan después de los includes (sobrescriben los valores incluidos)
    - **Includes anidados**: admitidos hasta 10 niveles de profundidad
    - **Rutas relativas**: se resuelven en relación con el archivo que incluye
    - **Manejo de errores**: errores claros para archivos faltantes, errores de parseo e includes circulares

  </Accordion>
</AccordionGroup>

## Recarga en caliente de la configuración

El Gateway vigila `~/.openclaw/openclaw.json` y aplica los cambios automáticamente; no hace falta reiniciarlo manualmente para la mayoría de las configuraciones.

Las ediciones directas del archivo se tratan como no confiables hasta que validan. El observador espera a que se estabilice el ruido de escrituras temporales/renombrados del editor, lee el archivo final y rechaza las ediciones externas no válidas restaurando la última configuración válida conocida. Las escrituras de configuración hechas por OpenClaw usan la misma compuerta de esquema antes de escribir; los sobrescritos destructivos, como eliminar `gateway.mode` o reducir el archivo a menos de la mitad, se rechazan y se guardan como `.rejected.*` para su inspección.

Si ves `Config auto-restored from last-known-good` o `config reload restored last-known-good config` en los logs, inspecciona el archivo `.clobbered.*` correspondiente junto a `openclaw.json`, corrige la carga rechazada y luego ejecuta `openclaw config validate`. Consulta [Gateway troubleshooting](/es/gateway/troubleshooting#gateway-restored-last-known-good-config) para ver la lista de recuperación.

### Modos de recarga

| Modo                   | Comportamiento                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **`hybrid`** (predeterminado) | Aplica en caliente los cambios seguros al instante. Reinicia automáticamente para los críticos. |
| **`hot`**              | Solo aplica en caliente los cambios seguros. Registra una advertencia cuando hace falta reiniciar; tú te encargas. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, seguro o no.            |
| **`off`**              | Deshabilita la vigilancia del archivo. Los cambios surten efecto en el siguiente reinicio manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica en caliente y qué requiere reinicio

La mayoría de los campos se aplican en caliente sin interrupciones. En modo `hybrid`, los cambios que requieren reinicio se gestionan automáticamente.

| Categoría           | Campos                                                               | ¿Requiere reinicio? |
| ------------------- | -------------------------------------------------------------------- | ------------------- |
| Canales             | `channels.*`, `web` (WhatsApp): todos los canales integrados y de extensiones | No                  |
| Agente y modelos    | `agent`, `agents`, `models`, `routing`                               | No                  |
| Automatización      | `hooks`, `cron`, `agent.heartbeat`                                   | No                  |
| Sesiones y mensajes | `session`, `messages`                                                | No                  |
| Herramientas y medios | `tools`, `browser`, `skills`, `audio`, `talk`                      | No                  |
| UI y varios         | `ui`, `logging`, `identity`, `bindings`                              | No                  |
| Servidor Gateway    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Sí**              |
| Infraestructura     | `discovery`, `canvasHost`, `plugins`                                 | **Sí**              |

<Note>
`gateway.reload` y `gateway.remote` son excepciones: cambiarlos **no** provoca un reinicio.
</Note>

## RPC de configuración (actualizaciones programáticas)

<Note>
Las RPC de escritura del plano de control (`config.apply`, `config.patch`, `update.run`) tienen limitación de tasa de **3 solicitudes por 60 segundos** por `deviceId+clientIp`. Cuando se alcanza el límite, la RPC devuelve `UNAVAILABLE` con `retryAfterMs`.
</Note>

Flujo seguro/predeterminado:

- `config.schema.lookup`: inspecciona un subárbol de configuración acotado a una ruta con un nodo de esquema superficial, metadata de sugerencias coincidentes y resúmenes inmediatos de hijos
- `config.get`: obtiene la instantánea actual + hash
- `config.patch`: ruta preferida para actualizaciones parciales
- `config.apply`: solo para reemplazo completo de la configuración
- `update.run`: autoactualización + reinicio explícitos

Cuando no estés reemplazando toda la configuración, prefiere `config.schema.lookup` y luego `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (reemplazo completo)">
    Valida + escribe la configuración completa y reinicia el Gateway en un solo paso.

    <Warning>
    `config.apply` reemplaza la **configuración completa**. Usa `config.patch` para actualizaciones parciales, o `openclaw config set` para claves individuales.
    </Warning>

    Parámetros:

    - `raw` (string): carga JSON5 de la configuración completa
    - `baseHash` (opcional): hash de configuración de `config.get` (obligatorio cuando la configuración existe)
    - `sessionKey` (opcional): session key para el ping de reactivación posterior al reinicio
    - `note` (opcional): nota para el centinela de reinicio
    - `restartDelayMs` (opcional): retraso antes del reinicio (predeterminado 2000)

    Las solicitudes de reinicio se consolidan mientras ya hay una pendiente/en curso, y se aplica un enfriamiento de 30 segundos entre ciclos de reinicio.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (actualización parcial)">
    Combina una actualización parcial con la configuración existente (semántica de JSON merge patch):

    - Los objetos se combinan de forma recursiva
    - `null` elimina una clave
    - Los arrays reemplazan

    Parámetros:

    - `raw` (string): JSON5 con solo las claves que se van a cambiar
    - `baseHash` (obligatorio): hash de configuración de `config.get`
    - `sessionKey`, `note`, `restartDelayMs`: iguales que en `config.apply`

    El comportamiento de reinicio coincide con `config.apply`: reinicios pendientes consolidados más un enfriamiento de 30 segundos entre ciclos de reinicio.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variables de entorno

OpenClaw lee variables de entorno del proceso padre y además de:

- `.env` del directorio de trabajo actual (si existe)
- `~/.openclaw/.env` (fallback global)

Ninguno de los dos archivos sobrescribe variables de entorno existentes. También puedes establecer variables de entorno en línea en la configuración:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importación de variables de entorno del shell (opcional)">
  Si está habilitado y las claves esperadas no están configuradas, OpenClaw ejecuta tu shell de login e importa solo las claves que faltan:

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
  Haz referencia a variables de entorno en cualquier valor string de configuración con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo se reconocen nombres en mayúsculas que coincidan con: `[A-Z_][A-Z0-9_]*`
- Las variables faltantes o vacías generan un error en el momento de carga
- Escapa con `$${VAR}` para salida literal
- Funciona dentro de archivos `$include`
- Sustitución en línea: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencias de secretos (env, file, exec)">
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

Los detalles de SecretRef (incluido `secrets.providers` para `env`/`file`/`exec`) están en [Secrets Management](/es/gateway/secrets).
Las rutas de credenciales compatibles se enumeran en [SecretRef Credential Surface](/es/reference/secretref-credential-surface).
</Accordion>

Consulta [Environment](/es/help/environment) para ver la precedencia completa y las fuentes.

## Referencia completa

Para la referencia completa campo por campo, consulta **[Configuration Reference](/es/gateway/configuration-reference)**.

---

_Relacionado: [Configuration Examples](/es/gateway/configuration-examples) · [Configuration Reference](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_
