---
read_when:
    - Configurar OpenClaw por primera vez
    - Buscar patrones de configuración comunes
    - Navegar a secciones específicas de la configuración
summary: 'Descripción general de la configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-04-08T06:01:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a1e515bd4003319e71593a2659bb883299a76ff67e273d92583df03c96604
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuración

OpenClaw lee una configuración opcional en <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`.

Si el archivo no existe, OpenClaw usa valores predeterminados seguros. Motivos habituales para agregar una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Establecer modelos, herramientas, aislamiento o automatización (cron, hooks)
- Ajustar sesiones, medios, red o la UI

Consulta la [referencia completa](/es/gateway/configuration-reference) para ver todos los campos disponibles.

<Tip>
**¿Eres nuevo en la configuración?** Comienza con `openclaw onboard` para una configuración interactiva, o consulta la guía de [Ejemplos de configuración](/es/gateway/configuration-examples) para ver configuraciones completas listas para copiar y pegar.
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
  <Tab title="CLI (líneas únicas)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Abre [http://127.0.0.1:18789](http://127.0.0.1:18789) y usa la pestaña **Config**.
    La Control UI genera un formulario a partir del esquema de configuración activo, incluida la metainformación de documentación de los campos
    `title` / `description`, además de los esquemas de plugins y canales cuando
    están disponibles, con un editor de **Raw JSON** como vía de escape. Para las
    UI de exploración detallada y otras herramientas, el gateway también expone `config.schema.lookup` para
    obtener un nodo del esquema con alcance a una ruta más los resúmenes inmediatos de sus nodos hijos.
  </Tab>
  <Tab title="Edición directa">
    Edita `~/.openclaw/openclaw.json` directamente. El Gateway observa el archivo y aplica los cambios automáticamente (consulta [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan por completo con el esquema. Las claves desconocidas, los tipos mal formados o los valores no válidos hacen que el Gateway **se niegue a iniciar**. La única excepción en el nivel raíz es `$schema` (string), para que los editores puedan adjuntar metadatos de JSON Schema.
</Warning>

Notas sobre las herramientas del esquema:

- `openclaw config schema` imprime la misma familia de JSON Schema usada por la Control UI
  y la validación de configuración.
- Trata esa salida del esquema como el contrato canónico legible por máquinas para
  `openclaw.json`; esta descripción general y la referencia de configuración la resumen.
- Los valores `title` y `description` de los campos se incorporan en la salida del esquema para
  herramientas de edición y formularios.
- Las entradas de objetos anidados, comodines (`*`) y elementos de arreglos (`[]`) heredan la misma
  metainformación de documentación cuando existe documentación de campo coincidente.
- Las ramas de composición `anyOf` / `oneOf` / `allOf` también heredan la misma
  metainformación de documentación, para que las variantes de unión/intersección mantengan la misma ayuda de campo.
- `config.schema.lookup` devuelve una ruta de configuración normalizada con un
  nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes
  y campos de validación similares), metadatos de sugerencias de UI coincidentes y resúmenes inmediatos de
  nodos hijos para herramientas de exploración detallada.
- Los esquemas dinámicos de plugins/canales se fusionan cuando el gateway puede cargar el
  registro actual de manifiestos.
- `pnpm config:docs:check` detecta discrepancias entre los artefactos base de configuración orientados a la documentación
  y la superficie actual del esquema.

Cuando falla la validación:

- El Gateway no inicia
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecuta `openclaw doctor` para ver los problemas exactos
- Ejecuta `openclaw doctor --fix` (o `--yes`) para aplicar reparaciones

## Tareas comunes

<AccordionGroup>
  <Accordion title="Configurar un canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tiene su propia sección de configuración en `channels.<provider>`. Consulta la página dedicada de cada canal para ver los pasos de configuración:

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
    - Las referencias de modelo usan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de imágenes en transcripciones/herramientas (valor predeterminado `1200`); los valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulta [Models CLI](/es/concepts/models) para cambiar modelos en el chat y [Model Failover](/es/concepts/model-failover) para la rotación de autenticación y el comportamiento de respaldo.
    - Para proveedores personalizados o autoalojados, consulta [Proveedores personalizados](/es/gateway/configuration-reference#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso por mensajes directos se controla por canal mediante `dmPolicy`:

    - `"pairing"` (predeterminado): los remitentes desconocidos reciben un código de emparejamiento de un solo uso para aprobarlos
    - `"allowlist"`: solo los remitentes en `allowFrom` (o en el almacén de permitidos emparejados)
    - `"open"`: permite todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los mensajes directos

    Para grupos, usa `groupPolicy` + `groupAllowFrom` o listas de permitidos específicas del canal.

    Consulta la [referencia completa](/es/gateway/configuration-reference#dm-and-group-access) para ver los detalles por canal.

  </Accordion>

  <Accordion title="Configurar la exigencia de mención en chats grupales">
    Los mensajes de grupo, de forma predeterminada, **requieren mención**. Configura patrones por agente:

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

    - **Menciones de metadatos**: menciones nativas con @ (mención con toque en WhatsApp, Telegram @bot, etc.)
    - **Patrones de texto**: patrones regex seguros en `mentionPatterns`
    - Consulta la [referencia completa](/es/gateway/configuration-reference#group-chat-mention-gating) para ver anulaciones por canal y el modo de chat propio.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Usa `agents.defaults.skills` como base compartida y luego sobrescribe agentes específicos con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hereda github, weather
          { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
          { id: "locked-down", skills: [] }, // sin skills
        ],
      },
    }
    ```

    - Omite `agents.defaults.skills` para permitir Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar los valores predeterminados.
    - Establece `agents.list[].skills: []` para no usar Skills.
    - Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config), y
      la [Referencia de configuración](/es/gateway/configuration-reference#agentsdefaultsskills).

  </Accordion>

  <Accordion title="Ajustar la supervisión de estado de canales del gateway">
    Controla cuán agresivamente el gateway reinicia los canales que parecen inactivos:

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
    - Consulta [Comprobaciones de estado](/es/gateway/health) para la depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para todos los campos.

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
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones vinculado a hilos (Discord admite `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age`).
    - Consulta [Administración de sesiones](/es/concepts/session) para ver el alcance, los vínculos de identidad y la política de envío.
    - Consulta la [referencia completa](/es/gateway/configuration-reference#session) para ver todos los campos.

  </Accordion>

  <Accordion title="Habilitar aislamiento">
    Ejecuta sesiones de agentes en contenedores Docker aislados:

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

    Primero crea la imagen: `scripts/sandbox-setup.sh`

    Consulta [Aislamiento](/es/gateway/sandboxing) para la guía completa y la [referencia completa](/es/gateway/configuration-reference#agentsdefaultssandbox) para todas las opciones.

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

    - Permite que el gateway envíe `push.test`, avisos de activación y activaciones de reconexión a través del relay externo.
    - Usa un permiso de envío con alcance al registro, reenviado por la app de iOS emparejada. El gateway no necesita un token de relay de toda la implementación.
    - Vincula cada registro respaldado por relay a la identidad del gateway con la que se emparejó la app de iOS, para que otro gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales/manuales de iOS en APNs directo. Los envíos respaldados por relay se aplican solo a las compilaciones oficiales distribuidas que se registraron a través del relay.
    - Debe coincidir con la URL base del relay integrada en la compilación oficial/TestFlight de iOS, para que el tráfico de registro y envío llegue a la misma implementación del relay.

    Flujo de extremo a extremo:

    1. Instala una compilación oficial/TestFlight de iOS que se haya compilado con la misma URL base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` en el gateway.
    3. Empareja la app de iOS con el gateway y permite que se conecten tanto la sesión del nodo como la del operador.
    4. La app de iOS obtiene la identidad del gateway, se registra en el relay usando App Attest más el recibo de la app y luego publica la carga `push.apns.register` respaldada por relay en el gateway emparejado.
    5. El gateway almacena el identificador del relay y el permiso de envío, y luego los usa para `push.test`, avisos de activación y activaciones de reconexión.

    Notas operativas:

    - Si cambias la app de iOS a un gateway diferente, vuelve a conectar la app para que pueda publicar un nuevo registro de relay vinculado a ese gateway.
    - Si distribuyes una nueva compilación de iOS que apunta a una implementación de relay distinta, la app actualiza su registro de relay almacenado en caché en lugar de reutilizar el origen anterior del relay.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como anulaciones temporales por env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape de desarrollo solo para loopback; no conserves URL de relay HTTP en la configuración.

    Consulta [App de iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para el flujo completo y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para el modelo de seguridad del relay.

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

    - `every`: cadena de duración (`30m`, `2h`). Establece `0m` para desactivar.
    - `target`: `last` | `none` | `<channel-id>` (por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predeterminado) o `block` para destinos de heartbeat de estilo DM
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

    - `sessionRetention`: elimina de `sessions.json` las sesiones completadas de ejecuciones aisladas (predeterminado `24h`; establece `false` para desactivar).
    - `runLog`: recorta `cron/runs/<jobId>.jsonl` por tamaño y líneas conservadas.
    - Consulta [Trabajos cron](/es/automation/cron-jobs) para ver la descripción general de la función y ejemplos de CLI.

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
    - Trata todo el contenido de las cargas de hook/webhook como entrada no confiable.
    - Usa un `hooks.token` dedicado; no reutilices el token compartido del Gateway.
    - La autenticación de hooks es solo por encabezado (`Authorization: Bearer ...` o `x-openclaw-token`); los tokens en query string se rechazan.
    - `hooks.path` no puede ser `/`; mantén la entrada de webhook en una subruta dedicada como `/hooks`.
    - Mantén desactivadas las marcas de omisión de contenido inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) salvo para depuración muy delimitada.
    - Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para acotar las claves de sesión seleccionadas por quien llama.
    - Para agentes controlados por hooks, prefiere niveles de modelo modernos y sólidos, y una política estricta de herramientas (por ejemplo, solo mensajería más aislamiento cuando sea posible).

    Consulta la [referencia completa](/es/gateway/configuration-reference#hooks) para todas las opciones de mapeo y la integración con Gmail.

  </Accordion>

  <Accordion title="Configurar enrutamiento multiagente">
    Ejecuta varios agentes aislados con workspaces y sesiones separados:

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

    Consulta [Multi-Agent](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/configuration-reference#multi-agent-routing) para ver reglas de asociación y perfiles de acceso por agente.

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
    - **Arreglo de archivos**: se fusionan en profundidad en orden (el último prevalece)
    - **Claves hermanas**: se fusionan después de los includes (sobrescriben los valores incluidos)
    - **Includes anidados**: admitidos hasta 10 niveles de profundidad
    - **Rutas relativas**: se resuelven en relación con el archivo que incluye
    - **Manejo de errores**: errores claros para archivos faltantes, errores de análisis e includes circulares

  </Accordion>
</AccordionGroup>

## Recarga en caliente de la configuración

El Gateway observa `~/.openclaw/openclaw.json` y aplica los cambios automáticamente; no hace falta reiniciar manualmente para la mayoría de los ajustes.

### Modos de recarga

| Modo                   | Comportamiento                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica en caliente los cambios seguros al instante. Reinicia automáticamente en los críticos.           |
| **`hot`**              | Aplica en caliente solo los cambios seguros. Registra una advertencia cuando se necesita reiniciar; tú te encargas. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, sea seguro o no.                                 |
| **`off`**              | Desactiva la observación del archivo. Los cambios se aplican en el siguiente reinicio manual.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica en caliente y qué necesita reinicio

La mayoría de los campos se aplican en caliente sin tiempo de inactividad. En modo `hybrid`, los cambios que requieren reinicio se gestionan automáticamente.

| Categoría            | Campos                                                               | ¿Requiere reinicio? |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| Canales            | `channels.*`, `web` (WhatsApp): todos los canales integrados y de extensiones | No              |
| Agente y modelos      | `agent`, `agents`, `models`, `routing`                               | No              |
| Automatización          | `hooks`, `cron`, `agent.heartbeat`                                   | No              |
| Sesiones y mensajes | `session`, `messages`                                                | No              |
| Herramientas y medios       | `tools`, `browser`, `skills`, `audio`, `talk`                        | No              |
| UI y varios           | `ui`, `logging`, `identity`, `bindings`                              | No              |
| Servidor del gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Sí**         |
| Infraestructura      | `discovery`, `canvasHost`, `plugins`                                 | **Sí**         |

<Note>
`gateway.reload` y `gateway.remote` son excepciones: cambiarlos **no** desencadena un reinicio.
</Note>

## RPC de configuración (actualizaciones programáticas)

<Note>
Los RPC de escritura del plano de control (`config.apply`, `config.patch`, `update.run`) tienen límite de frecuencia de **3 solicitudes cada 60 segundos** por `deviceId+clientIp`. Cuando se alcanza el límite, el RPC devuelve `UNAVAILABLE` con `retryAfterMs`.
</Note>

Flujo seguro/predeterminado:

- `config.schema.lookup`: inspeccionar un subárbol de configuración con alcance a una ruta con un nodo de esquema superficial,
  metadatos de sugerencias coincidentes y resúmenes inmediatos de nodos hijos
- `config.get`: obtener la instantánea actual + hash
- `config.patch`: ruta preferida para actualizaciones parciales
- `config.apply`: reemplazo completo de la configuración únicamente
- `update.run`: autoactualización explícita + reinicio

Cuando no estés reemplazando toda la configuración, prefiere `config.schema.lookup`
y luego `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (reemplazo completo)">
    Valida + escribe la configuración completa y reinicia el Gateway en un solo paso.

    <Warning>
    `config.apply` reemplaza la **configuración completa**. Usa `config.patch` para actualizaciones parciales, o `openclaw config set` para claves individuales.
    </Warning>

    Parámetros:

    - `raw` (string): carga JSON5 para toda la configuración
    - `baseHash` (opcional): hash de configuración de `config.get` (obligatorio cuando la configuración existe)
    - `sessionKey` (opcional): clave de sesión para el ping de reactivación posterior al reinicio
    - `note` (opcional): nota para el marcador del reinicio
    - `restartDelayMs` (opcional): retraso antes del reinicio (predeterminado 2000)

    Las solicitudes de reinicio se consolidan mientras ya hay una pendiente/en curso, y se aplica un enfriamiento de 30 segundos entre ciclos de reinicio.

    ```bash
    openclaw gateway call config.get --params '{}'  # capturar payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (actualización parcial)">
    Fusiona una actualización parcial en la configuración existente (semántica de JSON merge patch):

    - Los objetos se fusionan recursivamente
    - `null` elimina una clave
    - Los arreglos reemplazan

    Parámetros:

    - `raw` (string): JSON5 con solo las claves que cambiar
    - `baseHash` (obligatorio): hash de configuración de `config.get`
    - `sessionKey`, `note`, `restartDelayMs`: igual que en `config.apply`

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

OpenClaw lee variables de entorno del proceso padre además de:

- `.env` del directorio de trabajo actual (si existe)
- `~/.openclaw/.env` (respaldo global)

Ninguno de los dos archivos sobrescribe variables de entorno existentes. También puedes establecer variables de entorno en línea en la configuración:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importación de env del shell (opcional)">
  Si está habilitado y las claves esperadas no están definidas, OpenClaw ejecuta tu shell de inicio de sesión e importa solo las claves que faltan:

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
  Haz referencia a variables de entorno en cualquier valor de string de la configuración con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo se reconocen nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`
- Las variables faltantes/vacías generan un error en el momento de la carga
- Usa `$${VAR}` para salida literal
- Funciona dentro de archivos `$include`
- Sustitución en línea: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencias secretas (env, file, exec)">
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

Los detalles de SecretRef (incluido `secrets.providers` para `env`/`file`/`exec`) están en [Administración de secretos](/es/gateway/secrets).
Las rutas de credenciales compatibles se enumeran en [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Accordion>

Consulta [Entorno](/es/help/environment) para ver la precedencia y las fuentes completas.

## Referencia completa

Para la referencia completa campo por campo, consulta **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_
