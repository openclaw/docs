---
read_when:
    - Configurar OpenClaw por primera vez
    - Buscar patrones de configuración comunes
    - Ir a secciones específicas de configuración
summary: 'Resumen de la configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-04-23T05:15:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39a9f521b124026a32064464b6d0ce1f93597c523df6839fde37d61e597bcce7
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuración

OpenClaw lee una configuración opcional en <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`.
La ruta de configuración activa debe ser un archivo normal. Los diseños de
`openclaw.json` con symlink no son compatibles para escrituras administradas por
OpenClaw; una escritura atómica puede reemplazar la ruta en lugar de preservar
el symlink. Si mantienes la configuración fuera del directorio de estado
predeterminado, apunta `OPENCLAW_CONFIG_PATH` directamente al archivo real.

Si el archivo no existe, OpenClaw usa valores predeterminados seguros. Motivos comunes para agregar una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Establecer modelos, herramientas, aislamiento o automatización (Cron, hooks)
- Ajustar sesiones, contenido multimedia, red o UI

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
    openclaw onboard       # flujo de incorporación completo
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
  <Tab title="UI de control">
    Abre [http://127.0.0.1:18789](http://127.0.0.1:18789) y usa la pestaña **Config**.
    La UI de control representa un formulario a partir del esquema de configuración activo, incluidos los metadatos de documentación de campos `title` / `description`, además de los esquemas de Plugin y canal cuando están disponibles, con un editor de **Raw JSON** como vía de escape. Para las UI de exploración detallada y otras herramientas, el gateway también expone `config.schema.lookup` para recuperar un nodo del esquema acotado a una ruta junto con resúmenes inmediatos de sus elementos secundarios.
  </Tab>
  <Tab title="Edición directa">
    Edita `~/.openclaw/openclaw.json` directamente. El Gateway vigila el archivo y aplica los cambios automáticamente (consulta [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan completamente con el esquema. Las claves desconocidas, los tipos mal formados o los valores no válidos hacen que el Gateway **se niegue a iniciar**. La única excepción en el nivel raíz es `$schema` (cadena), para que los editores puedan adjuntar metadatos de JSON Schema.
</Warning>

Notas sobre las herramientas del esquema:

- `openclaw config schema` imprime la misma familia de JSON Schema que usa la UI de control y la validación de configuración.
- Trata esa salida del esquema como el contrato canónico legible por máquina para `openclaw.json`; este resumen y la referencia de configuración la sintetizan.
- Los valores de `title` y `description` de los campos se trasladan a la salida del esquema para herramientas de editor y formularios.
- Las entradas de objetos anidados, comodines (`*`) y elementos de arreglo (`[]`) heredan los mismos metadatos de documentación cuando existe documentación coincidente para el campo.
- Las ramas de composición `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación, por lo que las variantes de unión/intersección conservan la misma ayuda de campo.
- `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes y campos de validación similares), metadatos coincidentes de sugerencias de UI y resúmenes inmediatos de sus elementos secundarios para herramientas de exploración detallada.
- Los esquemas de Plugin/canal en tiempo de ejecución se fusionan cuando el gateway puede cargar el registro de manifiestos actual.
- `pnpm config:docs:check` detecta desviaciones entre los artefactos de línea base de configuración orientados a documentación y la superficie actual del esquema.

Cuando falla la validación:

- El Gateway no arranca
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecuta `openclaw doctor` para ver los problemas exactos
- Ejecuta `openclaw doctor --fix` (o `--yes`) para aplicar reparaciones

El Gateway también conserva una copia confiable del último estado válido después de un inicio correcto. Si más tarde `openclaw.json` se modifica fuera de OpenClaw y deja de validar, el inicio y la recarga en caliente conservan el archivo dañado como una instantánea `.clobbered.*` con marca de tiempo, restauran la copia del último estado válido y registran una advertencia visible con el motivo de la recuperación.
La recuperación de lectura al inicio también trata caídas bruscas de tamaño, metadatos de configuración ausentes y la ausencia de `gateway.mode` como firmas críticas de sobrescritura cuando la copia del último estado válido sí tenía esos campos.
Si una línea de estado/log se antepone por accidente antes de una configuración JSON por lo demás válida, el inicio del gateway y `openclaw doctor --fix` pueden eliminar el prefijo, conservar el archivo contaminado como `.clobbered.*` y continuar con el JSON recuperado.
El siguiente turno del agente principal también recibe una advertencia de evento del sistema indicándole que la configuración fue restaurada y no debe reescribirse a ciegas. La promoción del último estado válido se actualiza después de un inicio validado y después de recargas en caliente aceptadas, incluidas las escrituras de configuración administradas por OpenClaw cuyo hash del archivo persistido todavía coincide con la escritura aceptada. La promoción se omite cuando el candidato contiene marcadores de secretos redactados como `***` o valores de token acortados.

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

    Todos los canales comparten el mismo patrón de política de DM:

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
    Establece el modelo principal y las alternativas opcionales:

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

    - `agents.defaults.models` define el catálogo de modelos y actúa como lista permitida para `/model`.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para agregar entradas a la lista permitida sin eliminar modelos existentes. Los reemplazos simples que eliminarían entradas se rechazan a menos que pases `--replace`.
    - Las referencias de modelo usan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de imágenes de transcripción/herramientas (predeterminado `1200`); los valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulta [CLI de modelos](/es/concepts/models) para cambiar modelos en el chat y [Conmutación por error de modelos](/es/concepts/model-failover) para la rotación de autenticación y el comportamiento de alternativas.
    - Para proveedores personalizados/autohospedados, consulta [Proveedores personalizados](/es/gateway/configuration-reference#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso por DM se controla por canal mediante `dmPolicy`:

    - `"pairing"` (predeterminado): los remitentes desconocidos reciben un código de vinculación de un solo uso para su aprobación
    - `"allowlist"`: solo remitentes en `allowFrom` (o en el almacén de permitidos emparejados)
    - `"open"`: permitir todos los DM entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignorar todos los DM

    Para grupos, usa `groupPolicy` + `groupAllowFrom` o listas permitidas específicas del canal.

    Consulta la [referencia completa](/es/gateway/configuration-reference#dm-and-group-access) para los detalles por canal.

  </Accordion>

  <Accordion title="Configurar el filtrado por mención en chats grupales">
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

    - **Menciones de metadatos**: menciones nativas con @ (mencionar con toque en WhatsApp, @bot en Telegram, etc.)
    - **Patrones de texto**: patrones regex seguros en `mentionPatterns`
    - Consulta la [referencia completa](/es/gateway/configuration-reference#group-chat-mention-gating) para ver anulaciones por canal y el modo de chat consigo mismo.

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
          { id: "writer" }, // hereda github, weather
          { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
          { id: "locked-down", skills: [] }, // sin Skills
        ],
      },
    }
    ```

    - Omite `agents.defaults.skills` para permitir Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar los valores predeterminados.
    - Establece `agents.list[].skills: []` para no tener Skills.
    - Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y la [Referencia de configuración](/es/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar la supervisión del estado de canales del gateway">
    Controla cuán agresivamente el gateway reinicia canales que parecen obsoletos:

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

    - Establece `gateway.channelHealthCheckMinutes: 0` para deshabilitar globalmente los reinicios del monitor de estado.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de comprobación.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para deshabilitar reinicios automáticos para un canal o cuenta sin deshabilitar el monitor global.
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
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones vinculadas a hilos (Discord admite `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age`).
    - Consulta [Gestión de sesiones](/es/concepts/session) para ver el ámbito, los vínculos de identidad y la política de envío.
    - Consulta la [referencia completa](/es/gateway/configuration-reference#session) para todos los campos.

  </Accordion>

  <Accordion title="Habilitar aislamiento">
    Ejecuta sesiones de agente en entornos de aislamiento aislados:

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

    Equivalente en la CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Qué hace esto:

    - Permite que el gateway envíe `push.test`, avisos de activación y activaciones de reconexión a través del relay externo.
    - Usa una concesión de envío con alcance de registro reenviada por la app de iOS vinculada. El gateway no necesita un token de relay para toda la implementación.
    - Vincula cada registro respaldado por relay a la identidad del gateway con la que se vinculó la app de iOS, de modo que otro gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales/manuales de iOS en APNs directo. Los envíos respaldados por relay se aplican solo a compilaciones oficiales distribuidas que se registraron a través del relay.
    - Debe coincidir con la URL base del relay integrada en la compilación oficial/TestFlight de iOS, para que el tráfico de registro y envío llegue a la misma implementación de relay.

    Flujo de extremo a extremo:

    1. Instala una compilación oficial/TestFlight de iOS que se haya compilado con la misma URL base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` en el gateway.
    3. Vincula la app de iOS con el gateway y deja que se conecten tanto las sesiones de Node como las del operador.
    4. La app de iOS obtiene la identidad del gateway, se registra en el relay usando App Attest más el recibo de la app y luego publica la carga útil `push.apns.register` respaldada por relay en el gateway vinculado.
    5. El gateway almacena el identificador del relay y la concesión de envío, y luego los usa para `push.test`, avisos de activación y activaciones de reconexión.

    Notas operativas:

    - Si cambias la app de iOS a otro gateway, vuelve a conectar la app para que pueda publicar un nuevo registro de relay vinculado a ese gateway.
    - Si distribuyes una nueva compilación de iOS que apunte a una implementación de relay diferente, la app actualiza su registro de relay en caché en lugar de reutilizar el origen de relay anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como anulaciones temporales mediante variables de entorno.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape de desarrollo solo para loopback; no persistas URLs de relay HTTP en la configuración.

    Consulta [App de iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para el flujo de extremo a extremo y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para el modelo de seguridad del relay.

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

    - `every`: cadena de duración (`30m`, `2h`). Establece `0m` para deshabilitar.
    - `target`: `last` | `none` | `<channel-id>` (por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predeterminado) o `block` para objetivos de Heartbeat de estilo DM
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

    - `sessionRetention`: elimina de `sessions.json` las sesiones aisladas de ejecuciones completadas (predeterminado `24h`; establece `false` para deshabilitar).
    - `runLog`: poda `cron/runs/<jobId>.jsonl` por tamaño y líneas retenidas.
    - Consulta [Trabajos Cron](/es/automation/cron-jobs) para la descripción general de la funcionalidad y ejemplos de CLI.

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
    - Trata todo el contenido de carga útil de hooks/Webhook como entrada no confiable.
    - Usa un `hooks.token` dedicado; no reutilices el token compartido del Gateway.
    - La autenticación de hooks es solo por encabezado (`Authorization: Bearer ...` o `x-openclaw-token`); se rechazan los tokens en la cadena de consulta.
    - `hooks.path` no puede ser `/`; mantén la entrada de Webhook en una subruta dedicada, como `/hooks`.
    - Mantén deshabilitadas las marcas de omisión de contenido inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) salvo que estés haciendo depuración muy acotada.
    - Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para limitar las claves de sesión seleccionadas por quien llama.
    - Para agentes controlados por hooks, prefiere niveles de modelo modernos sólidos y una política de herramientas estricta (por ejemplo, solo mensajería más aislamiento cuando sea posible).

    Consulta la [referencia completa](/es/gateway/configuration-reference#hooks) para todas las opciones de mapeo y la integración con Gmail.

  </Accordion>

  <Accordion title="Configurar enrutamiento multiagente">
    Ejecuta varios agentes aislados con workspaces y sesiones independientes:

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

    Consulta [Multi-Agent](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/configuration-reference#multi-agent-routing) para las reglas de bindings y los perfiles de acceso por agente.

  </Accordion>

  <Accordion title="Dividir la configuración en varios archivos (`$include`)">
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
    - **Arreglo de archivos**: fusión profunda en orden (el posterior tiene prioridad)
    - **Claves hermanas**: se fusionan después de los include (sobrescriben valores incluidos)
    - **Include anidados**: compatibles hasta 10 niveles de profundidad
    - **Rutas relativas**: se resuelven en relación con el archivo que incluye
    - **Escrituras administradas por OpenClaw**: cuando una escritura cambia solo una sección de nivel superior respaldada por un include de archivo único como `plugins: { $include: "./plugins.json5" }`, OpenClaw actualiza ese archivo incluido y deja intacto `openclaw.json`
    - **Write-through no compatible**: los include raíz, los arreglos de include y los include con sobrescrituras hermanas fallan de forma cerrada para escrituras administradas por OpenClaw en lugar de aplanar la configuración
    - **Manejo de errores**: errores claros para archivos faltantes, errores de análisis e include circulares

  </Accordion>
</AccordionGroup>

## Recarga en caliente de la configuración

El Gateway vigila `~/.openclaw/openclaw.json` y aplica los cambios automáticamente; no hace falta reiniciar manualmente para la mayoría de los ajustes.

Las ediciones directas del archivo se tratan como no confiables hasta que validan. El observador espera a que termine la actividad de escritura temporal/cambio de nombre del editor, lee el archivo final y rechaza ediciones externas no válidas restaurando la última configuración válida conocida. Las escrituras de configuración administradas por OpenClaw usan la misma puerta de esquema antes de escribir; sobrescrituras destructivas como eliminar `gateway.mode` o reducir el archivo a menos de la mitad se rechazan y se guardan como `.rejected.*` para su inspección.

Si ves `Config auto-restored from last-known-good` o
`config reload restored last-known-good config` en los logs, inspecciona el archivo
`.clobbered.*` correspondiente junto a `openclaw.json`, corrige la carga útil rechazada y luego ejecuta
`openclaw config validate`. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config)
para la lista de recuperación.

### Modos de recarga

| Modo                   | Comportamiento                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica en caliente los cambios seguros al instante. Reinicia automáticamente para los críticos. |
| **`hot`**              | Aplica en caliente solo los cambios seguros. Registra una advertencia cuando se necesita reinicio; tú te encargas. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, sea seguro o no.            |
| **`off`**              | Deshabilita la vigilancia de archivos. Los cambios surten efecto en el siguiente reinicio manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica en caliente y qué requiere reinicio

La mayoría de los campos se aplican en caliente sin tiempo de inactividad. En modo `hybrid`, los cambios que requieren reinicio se gestionan automáticamente.

| Categoría            | Campos                                                            | ¿Requiere reinicio? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Canales            | `channels.*`, `web` (WhatsApp) — todos los canales integrados y de Plugin | No              |
| Agente y modelos      | `agent`, `agents`, `models`, `routing`                            | No              |
| Automatización          | `hooks`, `cron`, `agent.heartbeat`                                | No              |
| Sesiones y mensajes | `session`, `messages`                                             | No              |
| Herramientas y multimedia       | `tools`, `browser`, `skills`, `audio`, `talk`                     | No              |
| UI y varios           | `ui`, `logging`, `identity`, `bindings`                           | No              |
| Servidor gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Sí**         |
| Infraestructura      | `discovery`, `canvasHost`, `plugins`                              | **Sí**         |

<Note>
`gateway.reload` y `gateway.remote` son excepciones: cambiarlos **no** dispara un reinicio.
</Note>

## RPC de configuración (actualizaciones programáticas)

<Note>
Los RPC de escritura del plano de control (`config.apply`, `config.patch`, `update.run`) están limitados a **3 solicitudes por 60 segundos** por `deviceId+clientIp`. Cuando se alcanza el límite, el RPC devuelve `UNAVAILABLE` con `retryAfterMs`.
</Note>

Flujo seguro/predeterminado:

- `config.schema.lookup`: inspecciona un subárbol de configuración acotado a una ruta con un nodo de esquema superficial, metadatos de sugerencias coincidentes y resúmenes inmediatos de sus elementos secundarios
- `config.get`: obtiene la instantánea actual + hash
- `config.patch`: ruta preferida para actualizaciones parciales
- `config.apply`: solo reemplazo de configuración completa
- `update.run`: autoactualización + reinicio explícitos

Cuando no estés reemplazando toda la configuración, prefiere `config.schema.lookup`
y luego `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (reemplazo completo)">
    Valida + escribe la configuración completa y reinicia el Gateway en un solo paso.

    <Warning>
    `config.apply` reemplaza la **configuración completa**. Usa `config.patch` para actualizaciones parciales, o `openclaw config set` para claves individuales.
    </Warning>

    Parámetros:

    - `raw` (string) — carga útil JSON5 para toda la configuración
    - `baseHash` (opcional) — hash de configuración de `config.get` (obligatorio cuando la configuración existe)
    - `sessionKey` (opcional) — clave de sesión para el ping de activación posterior al reinicio
    - `note` (opcional) — nota para el centinela de reinicio
    - `restartDelayMs` (opcional) — demora antes del reinicio (predeterminado 2000)

    Las solicitudes de reinicio se consolidan mientras ya hay una pendiente/en curso, y se aplica un período de enfriamiento de 30 segundos entre ciclos de reinicio.

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
    Fusiona una actualización parcial en la configuración existente (semántica de parche de fusión JSON):

    - Los objetos se fusionan recursivamente
    - `null` elimina una clave
    - Los arreglos reemplazan

    Parámetros:

    - `raw` (string) — JSON5 solo con las claves que se van a cambiar
    - `baseHash` (obligatorio) — hash de configuración de `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — igual que en `config.apply`

    El comportamiento de reinicio coincide con `config.apply`: reinicios pendientes consolidados más un período de enfriamiento de 30 segundos entre ciclos de reinicio.

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
- `~/.openclaw/.env` (alternativa global)

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
  Si está habilitado y no están definidas las claves esperadas, OpenClaw ejecuta tu shell de inicio de sesión e importa solo las claves faltantes:

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
  Haz referencia a variables de entorno en cualquier valor de cadena de la configuración con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo se aceptan nombres en mayúsculas que coincidan con: `[A-Z_][A-Z0-9_]*`
- Las variables faltantes/vacías generan un error en el momento de la carga
- Escapa con `$${VAR}` para una salida literal
- Funciona dentro de archivos `$include`
- Sustitución en línea: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencias secretas (env, file, exec)">
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

Consulta [Entorno](/es/help/environment) para ver la precedencia y las fuentes completas.

## Referencia completa

Para la referencia completa campo por campo, consulta **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_
