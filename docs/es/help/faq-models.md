---
read_when:
    - Elegir o cambiar modelos, configurar alias
    - Depurar la conmutación por error de modelos / "Todos los modelos fallaron"
    - Comprender los perfiles de autenticación y cómo gestionarlos
sidebarTitle: Models FAQ
summary: 'Preguntas frecuentes: valores predeterminados de modelos, selección, alias, cambio, conmutación por error y perfiles de autenticación'
title: 'FAQ: modelos y autenticación'
x-i18n:
    generated_at: "2026-07-05T11:21:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Preguntas y respuestas sobre modelos y perfiles de autenticación. Para configuración, sesiones, gateway, canales y
  solución de problemas, consulta la [FAQ](/es/help/faq) principal.

  ## Modelos: valores predeterminados, selección, alias, cambio

  <AccordionGroup>
  <Accordion title='¿Qué es el "modelo predeterminado"?'>
    Se establece con:

    ```text
    agents.defaults.model.primary
    ```

    Los modelos son referencias `provider/model` (ejemplo: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Establece siempre `provider/model` de forma explícita. Si
    omites el proveedor, OpenClaw intenta primero una coincidencia de alias, luego una coincidencia única
    de proveedor configurado para ese id de modelo y, después, recurre al
    proveedor predeterminado configurado (ruta de compatibilidad obsoleta). Si ese
    proveedor ya no tiene el modelo predeterminado configurado, OpenClaw recurre
    al primer proveedor/modelo configurado en lugar de a un predeterminado obsoleto.

  </Accordion>

  <Accordion title="¿Qué modelo recomiendas?">
    Usa el modelo de última generación más potente que ofrezca tu pila de proveedores,
    especialmente para agentes con herramientas o con entradas no confiables: los modelos más débiles o
    excesivamente cuantizados son más vulnerables a la inyección de prompts y al comportamiento inseguro
    (consulta [Seguridad](/es/gateway/security)). Dirige los modelos más baratos al
    chat rutinario/de bajo riesgo según el rol del agente.

    Dirige los modelos por agente y usa subagentes para paralelizar tareas largas (cada
    subagente consume sus propios tokens). Consulta [Modelos](/es/concepts/models),
    [Subagentes](/es/tools/subagents), [MiniMax](/es/providers/minimax) y
    [Modelos locales](/es/gateway/local-models).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sin borrar mi configuración?">
    Cambia solo los campos del modelo; evita reemplazos completos de configuración.

    - `/model` en el chat (por sesión, consulta [Comandos slash](/es/tools/slash-commands))
    - `openclaw models set ...` (actualiza solo la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - edita `agents.defaults.model` directamente en `~/.openclaw/openclaw.json`

    Para ediciones RPC, inspecciona primero con `config.schema.lookup` (ruta
    normalizada, documentación superficial del esquema, resúmenes de hijos) y luego prefiere `config.patch`
    sobre `config.apply` con un objeto parcial. Si sobrescribiste la configuración,
    restaura desde una copia de seguridad o ejecuta `openclaw doctor` para repararla.

    Documentación: [Modelos](/es/concepts/models), [Configurar](/es/cli/configure),
    [Config](/es/cli/config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Puedo usar modelos autoalojados (llama.cpp, vLLM, Ollama)?">
    Sí; Ollama es la ruta más sencilla. Configuración rápida:

    1. Instala Ollama desde `https://ollama.com/download`
    2. Descarga un modelo local, por ejemplo `ollama pull gemma4`
    3. Para modelos en la nube también, ejecuta `ollama signin`
    4. Ejecuta `openclaw onboard`, elige `Ollama` y luego `Local` o `Cloud + Local`

    `Cloud + Local` te da modelos en la nube además de tus modelos locales de Ollama;
    los modelos en la nube como `kimi-k2.5:cloud` no necesitan descarga local. Para cambiar
    manualmente: `openclaw models list`, luego `openclaw models set ollama/<model>`.

    Los modelos más pequeños o muy cuantizados son más vulnerables a la inyección de prompts.
    Usa modelos grandes para cualquier bot con acceso a herramientas; si usas modelos pequeños
    de todos modos, habilita el aislamiento y allowlists estrictas de herramientas.

    Documentación: [Ollama](/es/providers/ollama), [Modelos locales](/es/gateway/local-models),
    [Proveedores de modelos](/es/concepts/model-providers), [Seguridad](/es/gateway/security),
    [Aislamiento](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sobre la marcha (sin reiniciar)?">
    Envía `/model <name>` como mensaje independiente. Consulta
    [Comandos slash](/es/tools/slash-commands) para ver la
    lista completa de comandos, incluido el selector numerado (`/model`, `/model
    list`, `/model 3`), `/model default` para borrar una anulación de sesión y
    `/model status` para detalles de endpoint/modo de API.

    Fuerza un perfil de autenticación específico por sesión con `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Para desanclar un perfil establecido con `@profile`, vuelve a ejecutar `/model` sin el
    sufijo (por ejemplo, `/model anthropic/claude-opus-4-6`) o elige el valor predeterminado desde
    `/model`. Usa `/model status` para confirmar el perfil de autenticación activo.

  </Accordion>

  <Accordion title="Si dos proveedores exponen el mismo id de modelo, ¿cuál usa /model?">
    `/model provider/model` selecciona esa ruta de proveedor exacta. Por ejemplo,
    `qianfan/deepseek-v4-flash` y `deepseek/deepseek-v4-flash` son referencias diferentes
    aunque el id de modelo coincida: OpenClaw no cambia de proveedor en silencio
    por una coincidencia de id sin proveedor.

    Una referencia `/model` seleccionada por el usuario es estricta para la conmutación por error: si ese
    proveedor/modelo deja de estar disponible, la respuesta falla de forma visible en lugar de
    recurrir a `agents.defaults.model.fallbacks`. Las cadenas de conmutación por error configuradas
    siguen aplicándose a los valores predeterminados configurados, los primarios de trabajos Cron y
    el estado de conmutación por error seleccionado automáticamente. Cuando se permite que una ejecución sin
    anulación de sesión use conmutación por error, OpenClaw intenta primero el proveedor/modelo solicitado, luego
    las conmutaciones por error configuradas y, después, el primario configurado; por eso los ids de modelo
    sin proveedor duplicados nunca saltan directamente al proveedor predeterminado.

    Consulta [Modelos](/es/concepts/models) y [Conmutación por error de modelos](/es/concepts/model-failover).

  </Accordion>

  <Accordion title="¿Puedo usar GPT 5.5 para tareas diarias y Codex 5.5 para programar?">
    Sí; la elección del modelo y la elección del runtime son independientes:

    - **Agente de programación nativo de Codex:** establece `agents.defaults.model.primary` en
      `openai/gpt-5.5`. Inicia sesión con `openclaw models auth login --provider
      openai` para la autenticación de suscripción de ChatGPT/Codex.
    - **Tareas directas con la API de OpenAI fuera del bucle del agente:** configura
      `OPENAI_API_KEY` para imágenes, embeddings, voz, tiempo real y otras
      superficies de la API de OpenAI que no son de agente.
    - **Autenticación con clave de API del agente de OpenAI:** `/model openai/gpt-5.5` con un perfil
      de clave de API `openai` ordenado.
    - **Subagentes:** dirige las tareas de programación a un agente centrado en Codex con su
      propio modelo `openai/gpt-5.5`.

    Consulta [Modelos](/es/concepts/models) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo configuro el modo rápido para GPT 5.5?">
    - **Por sesión:** envía `/fast on` mientras usas `openai/gpt-5.5`.
    - **Predeterminado por modelo:** establece
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` en `true`.
    - **Corte automático:** `/fast auto` o `params.fastMode: "auto"` ejecuta las nuevas
      llamadas al modelo en modo rápido hasta el corte y luego ejecuta los reintentos posteriores, conmutación por error,
      resultados de herramientas o llamadas de continuación sin modo rápido. El corte predeterminado es de
      60 segundos; anúlalo con `params.fastAutoOnSeconds` en el modelo.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    El modo rápido se asigna a `service_tier = "priority"` en solicitudes nativas de OpenAI Responses;
    los valores existentes de `service_tier` se conservan y el modo rápido no
    reescribe `reasoning` ni `text.verbosity`. Las anulaciones de sesión `/fast` prevalecen sobre
    los valores predeterminados de configuración.

    Consulta [Pensamiento y modo rápido](/es/tools/thinking) y la sección Modo rápido
    en Configuración avanzada en la página del proveedor [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title='¿Por qué veo "Model ... is not allowed" y luego no hay respuesta?'>
    Si `agents.defaults.models` está establecido, se convierte en la **allowlist** para
    `/model` y las anulaciones de sesión. Elegir un modelo fuera de esa lista devuelve
    esto en lugar de una respuesta normal:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Corrección: añade el modelo exacto a `agents.defaults.models`, añade un comodín de proveedor
    como `"provider/*": {}` para catálogos dinámicos, elimina la
    allowlist o elige un modelo desde `/model list`. Si el comando también
    incluía `--runtime codex`, actualiza primero la allowlist y luego vuelve a intentar el
    mismo comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='¿Por qué veo "Unknown model: minimax/MiniMax-M3"?'>
    Si estás en una versión anterior de OpenClaw, actualiza primero (o ejecuta desde la fuente
    `main`) y reinicia el gateway: `MiniMax-M3` puede que aún no esté en el
    catálogo de tu versión instalada. De lo contrario, el proveedor MiniMax no está
    configurado (no se encontró entrada de proveedor ni perfil de autenticación), por lo que el modelo no puede
    resolverse. Consulta la sección Solución de problemas en la
    página del proveedor [MiniMax](/es/providers/minimax) para ver la lista completa de comprobación de correcciones,
    la tabla de ids de proveedor/modelo y el ejemplo de bloque de configuración.

  </Accordion>

  <Accordion title="¿Puedo usar MiniMax como predeterminado y OpenAI para tareas complejas?">
    Sí. Usa MiniMax como predeterminado y cambia de modelo por sesión; las conmutaciones por error
    son para errores, no para "tareas difíciles", así que usa `/model` o un agente separado.

    **Opción A: cambiar por sesión**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Luego `/model gpt`.

    **Opción B: agentes separados**: el Agente A usa MiniMax de forma predeterminada, el Agente B
    usa OpenAI de forma predeterminada; dirige por agente o usa `/agent` para cambiar.

    Documentación: [Modelos](/es/concepts/models), [Enrutamiento multiagente](/es/concepts/multi-agent),
    [MiniMax](/es/providers/minimax), [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title="¿opus / sonnet / gpt son accesos directos integrados?">
    Sí: abreviaturas integradas, aplicadas solo cuando el modelo de destino existe en
    `agents.defaults.models`:

    | Alias | Se resuelve en |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Tu propio alias con el mismo nombre anula el integrado.

  </Accordion>

  <Accordion title="¿Cómo defino/anulo accesos directos de modelos (alias)?">
    Los alias viven en `agents.defaults.models.<modelId>.alias`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    Luego `/model sonnet` (o `/<alias>` cuando sea compatible) se resuelve a ese
    id de modelo.

  </Accordion>

  <Accordion title="¿Cómo añado modelos de otros proveedores como OpenRouter o Z.AI?">
    OpenRouter (pago por token; muchos modelos):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modelos GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    La falta de una clave de proveedor para un proveedor/modelo referenciado genera un error de autenticación
    en runtime (por ejemplo, `No API key found for provider "zai"`).

    **No se encontró ninguna clave de API para el proveedor después de añadir un nuevo agente**

    Un nuevo agente tiene un almacén de autenticación vacío: la autenticación es por agente y se almacena en:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Solución: ejecuta `openclaw agents add <id>` y configura la autenticación en el asistente, o
    copia solo perfiles `api_key`/`token` estáticos portables desde el almacén
    del agente principal. Para OAuth, inicia sesión desde el nuevo agente cuando necesite su
    propia cuenta. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent) para ver las
    reglas completas de reutilización de `agentDir` y uso compartido de credenciales; nunca reutilices
    `agentDir` entre agentes.

  </Accordion>
</AccordionGroup>

## Conmutación por error de modelos y "All models failed"

<AccordionGroup>
  <Accordion title="¿Cómo funciona la conmutación por error?">
    Dos etapas:

    1. **Rotación de perfiles de autenticación** dentro del mismo proveedor.
    2. **Respaldo de modelos** al siguiente modelo en `agents.defaults.model.fallbacks`.

    Los tiempos de espera se aplican a los perfiles que fallan (backoff exponencial), por lo que OpenClaw
    sigue respondiendo cuando un proveedor tiene límite de velocidad o falla temporalmente.

    El bucket de límite de velocidad cubre más que un simple `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` y los límites periódicos
    de ventana de uso (`weekly/monthly limit reached`) cuentan todos como
    límites de velocidad que justifican conmutación por error.

    Las respuestas de facturación no siempre son `402`, y algunos `402` permanecen en el
    bucket transitorio/de límite de velocidad en lugar del carril de facturación. El texto explícito
    de facturación en `401`/`403` aún puede enrutarse a facturación; los
    comparadores de texto específicos de proveedor (por ejemplo, OpenRouter `Key limit exceeded`) permanecen limitados a su
    propio proveedor. Un `402` que parece una ventana de uso reintentable o
    un límite de gasto de organización/espacio de trabajo (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) se trata como `rate_limit`, no como una
    deshabilitación prolongada por facturación.

    Los errores de desbordamiento de contexto quedan completamente fuera de la ruta de respaldo: firmas
    como `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` u `ollama error: context length exceeded` van a
    compactación/reintento en lugar de avanzar el respaldo de modelos.

    El texto genérico de error del servidor es más estrecho que "cualquier cosa con unknown/error
    dentro". Formas transitorias limitadas al proveedor que sí cuentan como señales de conmutación por error:
    el `An unknown error occurred` sin más de Anthropic, el `Provider returned error` sin más de OpenRouter,
    errores de motivo de detención como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio del servidor (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    y errores de proveedor ocupado como `ModelNotReadyException` cuando coincide el contexto
    del proveedor. El texto genérico interno de respaldo como `LLM request failed
    with an unknown error.` se mantiene conservador y no activa el respaldo
    por sí solo.

  </Accordion>

  <Accordion title='¿Qué significa "No credentials found for profile anthropic:default"?'>
    El id de perfil de autenticación `anthropic:default` no tiene credenciales en el
    almacén de autenticación esperado.

    **Lista de verificación de solución:**

    - Confirma dónde residen los perfiles: actual:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; heredado:
      `~/.openclaw/agent/*` (migrado por `openclaw doctor`).
    - Confirma que el Gateway carga tu variable de entorno. `ANTHROPIC_API_KEY` configurada solo en
      tu shell no llegará a una ejecución del Gateway mediante systemd/launchd; ponla en
      `~/.openclaw/.env` o habilita `env.shellEnv`.
    - Confirma que estás editando el agente correcto: las configuraciones multiagente tienen
      varios archivos `auth-profiles.json`.
    - Ejecuta `openclaw models status` para ver los modelos configurados y el estado de
      autenticación del proveedor.

    **Para "No credentials found for profile anthropic" (sin sufijo de correo electrónico):**

    La ejecución está fijada a un perfil de Anthropic que el Gateway no puede encontrar.

    - Usa Claude CLI: ejecuta `openclaw models auth login --provider anthropic
      --method cli --set-default` en el host del Gateway.
    - Si prefieres una clave API: pon `ANTHROPIC_API_KEY` en
      `~/.openclaw/.env` en el host del Gateway, luego borra cualquier orden fijado
      que fuerce el perfil faltante:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Modo remoto: los perfiles de autenticación residen en la máquina del Gateway, no en tu
      portátil; confirma que estás ejecutando los comandos allí.

  </Accordion>

  <Accordion title="¿Por qué también intentó Google Gemini y falló?">
    Si tu configuración de modelos incluye Google Gemini como respaldo (o
    cambiaste a una abreviatura de Gemini), OpenClaw lo intenta durante el respaldo. Si no hay
    credenciales de Google configuradas, aparece `No API key found for provider
    "google"`. Solución: añade autenticación de Google o elimina los modelos de Google de
    `agents.defaults.model.fallbacks`/alias.

    **Solicitud LLM rechazada: se requiere firma de pensamiento (Google Antigravity)**

    Causa: el historial de sesión tiene bloques de pensamiento sin firmas (a menudo
    de un flujo abortado/parcial); Google Antigravity requiere firmas
    en los bloques de pensamiento. OpenClaw elimina los bloques de pensamiento sin firma para Google
    Antigravity Claude; si sigue apareciendo, inicia una sesión nueva o configura
    `/thinking off` para ese agente.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo gestionarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos OAuth, almacenamiento de tokens, patrones multicuenta)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un registro de credenciales con nombre (OAuth o clave API) vinculado a un proveedor, almacenado
    en:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Inspecciona los perfiles guardados sin volcar secretos: `openclaw models auth
    list` (opcionalmente `--provider <id>` o `--json`). Consulta
    [CLI de modelos](/es/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="¿Cuáles son los ID de perfil típicos?">
    Con prefijo de proveedor: `anthropic:default` (común cuando no existe identidad de correo electrónico),
    `anthropic:<email>` para identidades OAuth, o un id personalizado que
    elijas (por ejemplo, `anthropic:work`).

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se intenta primero?">
    Sí. La configuración `auth.order.<provider>` establece el orden de rotación por proveedor
    (solo metadatos, no se almacenan secretos).

    OpenClaw puede omitir un perfil en un **tiempo de espera** breve (límites de velocidad,
    timeouts, fallos de autenticación) o en un estado **deshabilitado** más largo
    (facturación/créditos insuficientes). Inspecciona con `openclaw models status
    --json` y revisa `auth.unusableProfiles`. Ajusta con
    `auth.cooldowns.billingBackoffHours*`. Los tiempos de espera por límite de velocidad pueden estar
    limitados al modelo: un perfil en tiempo de espera para un modelo aún puede atender a un
    modelo hermano en el mismo proveedor; las ventanas de facturación/deshabilitación bloquean
    todo el perfil.

    Establece una anulación de orden por agente (almacenada en el `auth-state.json` de ese agente):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Verifica qué se intentará realmente: `openclaw models status --probe`. Un
    perfil almacenado omitido de un orden explícito informa
    `excluded_by_auth_order` en lugar de intentarse silenciosamente.

  </Accordion>

  <Accordion title="OAuth frente a clave API: ¿cuál es la diferencia?">
    - **OAuth / inicio de sesión CLI** suele usar acceso de suscripción cuando el
      proveedor lo admite. Para Anthropic, el backend Claude CLI de OpenClaw
      usa Claude Code `claude -p`, que Anthropic trata actualmente como
      uso programático/Agent SDK que consume límites de uso de la suscripción;
      consulta [Anthropic](/es/providers/anthropic) para ver el estado actual de pausa de facturación
      y los enlaces de origen.
    - **Claves API** usan facturación por token.

    El asistente admite Anthropic Claude CLI, OpenAI Codex OAuth y claves
    API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Preguntas frecuentes](/es/help/faq): las preguntas frecuentes principales
- [Preguntas frecuentes: inicio rápido y configuración de la primera ejecución](/es/help/faq-first-run)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
