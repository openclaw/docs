---
read_when:
    - Elegir o cambiar modelos y configurar alias
    - Depuración de la conmutación por error de modelos / «Todos los modelos fallaron»
    - Descripción de los perfiles de autenticación y cómo gestionarlos
sidebarTitle: Models FAQ
summary: 'Preguntas frecuentes: valores predeterminados, selección, alias, cambio y conmutación por error de modelos, y perfiles de autenticación'
title: 'Preguntas frecuentes: modelos y autenticación'
x-i18n:
    generated_at: "2026-07-19T02:00:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8c09012db311041fdec6ec4b78104dd720a7e69fdd1ca67ded1a4606cb0a5b3
    source_path: help/faq-models.md
    workflow: 16
---

Preguntas y respuestas sobre modelos y perfiles de autenticación. Para la configuración, las sesiones, el Gateway, los canales y la
solución de problemas, consulte las [Preguntas frecuentes](/es/help/faq) principales.

## Modelos: valores predeterminados, selección, alias y cambio

<AccordionGroup>
  <Accordion title='¿Qué es el "modelo predeterminado"?'>
    Se establece con:

    ```text
    agents.defaults.model.primary
    ```

    Los modelos son referencias `provider/model` (por ejemplo: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Establezca siempre `provider/model` explícitamente. Si
    omite el proveedor, OpenClaw intenta primero encontrar una coincidencia de alias, luego una coincidencia única
    de proveedor configurado para ese id. de modelo y, por último, recurre al
    proveedor predeterminado configurado (ruta de compatibilidad obsoleta). Si ese
    proveedor ya no tiene el modelo predeterminado configurado, OpenClaw recurre
    al primer proveedor/modelo configurado en lugar de usar un valor predeterminado obsoleto.

  </Accordion>

  <Accordion title="¿Qué modelo se recomienda?">
    Utilice el modelo de última generación más potente que ofrezca su conjunto de proveedores,
    especialmente para agentes con herramientas habilitadas o que procesen entradas no confiables: los modelos más débiles o
    excesivamente cuantizados son más vulnerables a la inyección de prompts y a comportamientos
    inseguros (consulte [Seguridad](/es/gateway/security)). Dirija los chats
    rutinarios o de bajo riesgo a modelos más económicos según el rol del agente.

    Dirija los modelos por agente y utilice subagentes para paralelizar tareas largas (cada
    subagente consume sus propios tokens). Consulte [Modelos](/es/concepts/models),
    [Subagentes](/es/tools/subagents), [MiniMax](/es/providers/minimax) y
    [Modelos locales](/es/gateway/local-models).

  </Accordion>

  <Accordion title="¿Cómo se cambia de modelo sin borrar la configuración?">
    Cambie únicamente los campos del modelo; evite reemplazar toda la configuración.

    - `/model` en el chat (por sesión; consulte [Comandos de barra](/es/tools/slash-commands))
    - `openclaw models set ...` (actualiza únicamente la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - edite `agents.defaults.model` directamente en `~/.openclaw/openclaw.json`

    Para las ediciones mediante RPC, inspeccione primero con `config.schema.lookup` (ruta
    normalizada, documentación superficial del esquema y resúmenes de elementos secundarios) y, después, prefiera `config.patch`
    en lugar de `config.apply` con un objeto parcial. Si sobrescribió la configuración,
    restáurela desde una copia de seguridad o ejecute `openclaw doctor` para repararla.

    Documentación: [Modelos](/es/concepts/models), [Configurar](/es/cli/configure),
    [Configuración](/es/cli/config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Se pueden utilizar modelos autoalojados (llama.cpp, vLLM, Ollama)?">
    Sí; Ollama es la opción más sencilla. Configuración rápida:

    1. Instale Ollama desde `https://ollama.com/download`
    2. Descargue un modelo local, por ejemplo, `ollama pull gemma4`
    3. Para usar también modelos en la nube, ejecute `ollama signin`
    4. Ejecute `openclaw onboard`, elija `Ollama` y, después, `Local` o `Cloud + Local`

    `Cloud + Local` proporciona modelos en la nube además de sus modelos locales de Ollama;
    los modelos en la nube como `kimi-k2.5:cloud` no necesitan una descarga local. Para cambiar
    manualmente: `openclaw models list` y, después, `openclaw models set ollama/<model>`.

    Los modelos más pequeños o muy cuantizados son más vulnerables a la inyección de prompts.
    Utilice modelos grandes para cualquier bot con acceso a herramientas; si utiliza modelos pequeños
    de todos modos, habilite el aislamiento y listas estrictas de herramientas permitidas.

    Documentación: [Ollama](/es/providers/ollama), [Modelos locales](/es/gateway/local-models),
    [Proveedores de modelos](/es/concepts/model-providers), [Seguridad](/es/gateway/security),
    [Aislamiento](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="¿Cómo se cambia de modelo sobre la marcha (sin reiniciar)?">
    Envíe `/model <name>` como mensaje independiente. Consulte
    [Comandos de barra](/es/tools/slash-commands) para ver la
    lista completa de comandos, incluido el selector numerado (`/model`, `/model
    list`, `/model 3`), `/model default` para borrar una sustitución de sesión y
    `/model status` para obtener detalles del endpoint/modo de API.

    Fuerce un perfil de autenticación específico por sesión con `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Para desanclar un perfil establecido con `@profile`, vuelva a ejecutar `/model` sin el
    sufijo (por ejemplo, `/model anthropic/claude-opus-4-6`) o seleccione el predeterminado en
    `/model`. Utilice `/model status` para confirmar el perfil de autenticación activo.

  </Accordion>

  <Accordion title="Si dos proveedores exponen el mismo id. de modelo, ¿cuál utiliza /model?">
    `/model provider/model` selecciona esa ruta exacta del proveedor. Por ejemplo,
    `qianfan/deepseek-v4-flash` y `deepseek/deepseek-v4-flash` son referencias
    diferentes aunque el id. del modelo coincida; OpenClaw no cambia silenciosamente
    de proveedor por la coincidencia de un id. sin proveedor.

    Una referencia `/model` seleccionada por el usuario es estricta para la conmutación por error: si ese
    proveedor/modelo deja de estar disponible, la respuesta falla de forma visible en lugar de
    recurrir a `agents.defaults.model.fallbacks`. Las cadenas de conmutación por error
    configuradas siguen aplicándose a los valores predeterminados configurados, los modelos principales de tareas Cron y
    el estado de conmutación por error seleccionado automáticamente. Cuando una ejecución sin sustitución de sesión puede
    usar la conmutación por error, OpenClaw prueba primero el proveedor/modelo solicitado, después
    las alternativas configuradas y, por último, el modelo principal configurado; por tanto, los id. de
    modelo sin proveedor duplicados nunca saltan directamente al proveedor predeterminado.

    Consulte [Modelos](/es/concepts/models) y [Conmutación por error de modelos](/es/concepts/model-failover).

  </Accordion>

  <Accordion title="¿Se puede utilizar GPT 5.5 para las tareas diarias y Codex 5.5 para programar?">
    Sí; la elección del modelo y la elección del entorno de ejecución son independientes:

    - **Agente de programación nativo de Codex:** establezca `agents.defaults.model.primary` en
      `openai/gpt-5.5`. Inicie sesión con `openclaw models auth login --provider
      openai` para usar la autenticación de la suscripción a ChatGPT/Codex.
    - **Tareas directas de la API de OpenAI fuera del bucle del agente:** configure
      `OPENAI_API_KEY` para imágenes, embeddings, voz, tiempo real y otras
      superficies de la API de OpenAI no relacionadas con agentes.
    - **Autenticación por clave de API del agente de OpenAI:** `/model openai/gpt-5.5` con un perfil
      de clave de API `openai` ordenado.
    - **Subagentes:** dirija las tareas de programación a un agente especializado en Codex con su
      propio modelo `openai/gpt-5.5`.

    Consulte [Modelos](/es/concepts/models) y [Comandos de barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo se configura el modo rápido para GPT 5.5?">
    - **Por sesión:** envíe `/fast on` mientras utiliza `openai/gpt-5.5`.
    - **Valor predeterminado por modelo:** establezca
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` en `true`.
    - **Límite automático:** `/fast auto` o `params.fastMode: "auto"` ejecuta las nuevas
      llamadas al modelo en modo rápido hasta el límite y, después, ejecuta las llamadas posteriores de reintento, conmutación por error,
      resultado de herramienta o continuación sin el modo rápido. El límite predeterminado es de
      60 segundos; puede sustituirse con `params.fastAutoOnSeconds` en el modelo.

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

    El modo rápido se asigna a `service_tier = "priority"` en las solicitudes nativas de OpenAI Responses;
    los valores `service_tier` existentes se conservan y el modo rápido no
    reescribe `reasoning` ni `text.verbosity`. Las sustituciones de sesión `/fast` tienen
    prioridad sobre los valores predeterminados de la configuración.

    Consulte [Razonamiento y modo rápido](/es/tools/thinking) y la sección Modo rápido
    en Configuración avanzada de la página del proveedor
    [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title='¿Por qué aparece "Model ... is not allowed" y después no hay respuesta?'>
    Si `agents.defaults.modelPolicy.allow` no está vacío, se convierte en la
    **lista de permitidos** para `/model`, las sustituciones de sesión y `--model`. Al seleccionar un modelo que no figure en esa lista, se devuelve
    lo siguiente en lugar de una respuesta normal:

    ```text
    La sustitución del modelo "provider/model" no está permitida por agents.defaults.modelPolicy.allow.
    ```

    Solución: añada el modelo exacto o un comodín de proveedor como `"provider/*"` a
    la lista `modelPolicy.allow` indicada, elimine o vacíe esa lista, o seleccione un modelo
    de `/model list`. Si el comando también
    incluía `--runtime codex`, actualice primero la lista de permitidos y, después, vuelva a intentar el
    mismo comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='¿Por qué aparece "Unknown model: minimax/MiniMax-M3"?'>
    Si utiliza una versión anterior de OpenClaw, actualícela primero (o ejecute desde el código fuente
    `main`) y reinicie el Gateway; es posible que `MiniMax-M3` aún no esté en el
    catálogo de la versión instalada. De lo contrario, el proveedor MiniMax no está
    configurado (no se encontró ninguna entrada de proveedor ni perfil de autenticación), por lo que el modelo no puede
    resolverse. Consulte la sección Solución de problemas de la
    página del proveedor [MiniMax](/es/providers/minimax) para ver la lista de comprobación completa de la solución,
    la tabla de id. de proveedor/modelo y el ejemplo del bloque de configuración.

  </Accordion>

  <Accordion title="¿Se puede utilizar MiniMax como valor predeterminado y OpenAI para tareas complejas?">
    Sí. Utilice MiniMax como valor predeterminado y cambie de modelo por sesión; las alternativas
    son para errores, no para «tareas difíciles», así que utilice `/model` o un agente independiente.

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

    Después, `/model gpt`.

    **Opción B: agentes independientes** — El agente A utiliza MiniMax de forma predeterminada y el agente B
    utiliza OpenAI de forma predeterminada; dirija las tareas por agente o utilice `/agent` para cambiar.

    Documentación: [Modelos](/es/concepts/models), [Enrutamiento multiagente](/es/concepts/multi-agent),
    [MiniMax](/es/providers/minimax), [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title="¿opus / sonnet / gpt son atajos integrados?">
    Sí; son abreviaturas integradas que se aplican únicamente cuando el modelo de destino existe en
    `agents.defaults.models`:

    | Alias | Se resuelve como |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Un alias propio con el mismo nombre sustituye al integrado.

  </Accordion>

  <Accordion title="¿Cómo se definen o sustituyen los atajos (alias) de modelos?">
    Los alias se encuentran en `agents.defaults.models.<modelId>.alias`:

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

    Después, `/model sonnet` (o `/<alias>`, cuando sea compatible) se resuelve como ese
    id. de modelo.

  </Accordion>

  <Accordion title="¿Cómo se añaden modelos de otros proveedores, como OpenRouter o Z.AI?">
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

    La ausencia de una clave de proveedor para un proveedor/modelo referenciado genera un error de
    autenticación en tiempo de ejecución (por ejemplo, `No API key found for provider "zai"`).

    **No se encontró ninguna clave de API para el proveedor después de añadir un agente nuevo**

    Un agente nuevo tiene un almacén de autenticación vacío; la autenticación es específica de cada agente y se almacena en:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Corrección: ejecuta `openclaw agents add <id>` y configura la autenticación en el asistente, o
    copia únicamente los perfiles estáticos portátiles `api_key`/`token` del almacén del
    agente principal. Para OAuth, inicia sesión desde el agente nuevo cuando necesite su
    propia cuenta. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent) para conocer
    todas las reglas de reutilización de `agentDir` y uso compartido de credenciales; nunca reutilices
    `agentDir` entre agentes.

  </Accordion>
</AccordionGroup>

## Conmutación por error de modelos y "Todos los modelos fallaron"

<AccordionGroup>
  <Accordion title="¿Cómo funciona la conmutación por error?">
    Dos etapas:

    1. **Rotación de perfiles de autenticación** dentro del mismo proveedor.
    2. **Modelo de respaldo** al siguiente modelo de `agents.defaults.model.fallbacks`.

    Se aplican períodos de espera a los perfiles que fallan (retroceso exponencial), por lo que OpenClaw
    sigue respondiendo cuando un proveedor limita la frecuencia o falla temporalmente.

    El conjunto de límites de frecuencia abarca más que un simple `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` y los límites periódicos
    de ventanas de uso (`weekly/monthly limit reached`) cuentan como
    límites de frecuencia que justifican la conmutación por error.

    Las respuestas de facturación no siempre son `402`, y algunos `402`s permanecen en el
    conjunto de errores transitorios o de límites de frecuencia, en lugar de pasar a la vía de facturación. El texto explícito
    de facturación en `401`/`403` aún puede dirigirse a facturación; los
    comparadores de texto específicos del proveedor (p. ej., `Key limit exceeded` de OpenRouter) permanecen limitados a su
    propio proveedor. Un `402` que parezca un límite reintentable de ventana de uso o
    de gasto de la organización o del espacio de trabajo (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) se trata como `rate_limit`, no como una
    desactivación prolongada por facturación.

    Los errores de desbordamiento de contexto quedan completamente fuera de la ruta de respaldo: las firmas
    como `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` o `ollama error: context length exceeded` pasan a
    Compaction y reintento, en lugar de avanzar al siguiente modelo de respaldo.

    El texto genérico de error del servidor tiene un alcance más limitado que "cualquier cosa que contenga unknown/error".
    Formatos transitorios específicos del proveedor que sí cuentan como señales de conmutación por error:
    el `An unknown error occurred` simple de Anthropic, el
    `Provider returned error` simple de OpenRouter, errores de motivo de detención como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio del servidor (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    y errores de proveedor ocupado como `ModelNotReadyException` cuando coincide el contexto del
    proveedor. El texto genérico interno de respaldo como `LLM request failed
    with an unknown error.` se trata de forma conservadora y no activa por sí solo la
    conmutación por error.

  </Accordion>

  <Accordion title='¿Qué significa "No se encontraron credenciales para el perfil anthropic:default"?'>
    El identificador del perfil de autenticación `anthropic:default` no tiene credenciales en el
    almacén de autenticación previsto.

    **Lista de comprobación para corregirlo:**

    - Confirma dónde se encuentran los perfiles — ubicación actual:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; ubicación heredada:
      `~/.openclaw/agent/*` (migrada por `openclaw doctor`).
    - Confirma que el Gateway cargue la variable de entorno. `ANTHROPIC_API_KEY` definida únicamente en
      el shell no llegará a un Gateway ejecutado mediante systemd/launchd; colócala en
      `~/.openclaw/.env` o habilita `env.shellEnv`.
    - Confirma que estés editando el agente correcto: las configuraciones multiagente tienen
      varios archivos `auth-profiles.json`.
    - Ejecuta `openclaw models status` para ver los modelos configurados y el estado de
      autenticación del proveedor.

    **Para "No se encontraron credenciales para el perfil anthropic" (sin sufijo de correo electrónico):**

    La ejecución está fijada a un perfil de Anthropic que el Gateway no puede encontrar.

    - Usa la CLI de Claude: ejecuta `openclaw models auth login --provider anthropic
      --method cli --set-default` en el host del Gateway.
    - Si prefieres una clave de API: coloca `ANTHROPIC_API_KEY` en
      `~/.openclaw/.env` en el host del Gateway y, después, borra cualquier orden fijado
      que fuerce el uso del perfil ausente:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Modo remoto: los perfiles de autenticación se encuentran en la máquina del Gateway, no en tu
      portátil; confirma que estés ejecutando allí los comandos.

  </Accordion>

  <Accordion title="¿Por qué también intentó usar Google Gemini y falló?">
    Si la configuración de modelos incluye Google Gemini como respaldo (o se
    cambió a una forma abreviada de Gemini), OpenClaw lo intenta durante la conmutación por error. Si no hay
    credenciales de Google configuradas, se obtiene `No API key found for provider
    "google"`. Corrección: añade la autenticación de Google o elimina los modelos de Google de
    `agents.defaults.model.fallbacks`/los alias.

    **Solicitud de LLM rechazada: se requiere una firma de razonamiento (Google Antigravity)**

    Causa: el historial de la sesión contiene bloques de razonamiento sin firmas (a menudo
    debido a un flujo abortado o parcial); Google Antigravity requiere firmas
    en los bloques de razonamiento. OpenClaw elimina los bloques de razonamiento sin firma para Google
    Antigravity Claude; si el problema persiste, inicia una sesión nueva o establece
    `/thinking off` para ese agente.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo administrarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos de OAuth, almacenamiento de tokens y patrones de varias cuentas)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un registro de credenciales con nombre (OAuth o clave de API) asociado a un proveedor y almacenado
    en:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Inspecciona los perfiles guardados sin mostrar secretos: `openclaw models auth
    list` (opcionalmente `--provider <id>` o `--json`). Consulta
    [CLI de modelos](/es/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="¿Cuáles son los identificadores de perfil habituales?">
    Con prefijo del proveedor: `anthropic:default` (habitual cuando no existe una identidad de correo electrónico),
    `anthropic:<email>` para identidades de OAuth o un identificador personalizado que
    elijas (p. ej., `anthropic:work`).

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se intenta primero?">
    Sí. La configuración `auth.order.<provider>` establece el orden de rotación por proveedor
    (solo metadatos; no se almacenan secretos).

    OpenClaw puede omitir un perfil que se encuentre en un breve **período de espera** (límites de frecuencia,
    tiempos de espera agotados o fallos de autenticación) o en un estado **deshabilitado** más prolongado
    (facturación o créditos insuficientes). Inspecciónalo con `openclaw models status
    --json` y consulta `auth.unusableProfiles`. Ajústalo con
    `auth.cooldowns.billingBackoffHours*`. Los períodos de espera por límites de frecuencia pueden
    limitarse a un modelo: un perfil en período de espera para un modelo puede seguir sirviendo a un
    modelo relacionado del mismo proveedor; las ventanas de facturación o deshabilitación bloquean
    todo el perfil.

    Establece una anulación del orden por agente (almacenada en el archivo `auth-state.json` de ese agente):

    ```bash
    # Usa de forma predeterminada el agente predeterminado configurado (omite --agent)
    openclaw models auth order get --provider anthropic

    # Limita la rotación a un único perfil
    openclaw models auth order set --provider anthropic anthropic:default

    # O establece un orden explícito (respaldo dentro del proveedor)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Borra la anulación (vuelve a la configuración auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Selecciona un agente específico
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Verifica qué se intentará realmente: `openclaw models status --probe`. Un
    perfil almacenado que se omita en un orden explícito muestra
    `excluded_by_auth_order` en lugar de intentarse silenciosamente.

  </Accordion>

  <Accordion title="OAuth frente a clave de API: ¿cuál es la diferencia?">
    - El **inicio de sesión mediante OAuth o CLI** suele usar el acceso por suscripción cuando el
      proveedor lo admite. Para Anthropic, el backend de la CLI de Claude de OpenClaw
      utiliza `claude -p` de Claude Code, que Anthropic trata actualmente como
      uso programático o del Agent SDK que consume los límites de uso de la suscripción;
      consulta [Anthropic](/es/providers/anthropic) para conocer el estado actual de la pausa de
      facturación y los enlaces a las fuentes.
    - Las **claves de API** usan facturación por token.

    El asistente admite la CLI de Anthropic Claude, OAuth de OpenAI Codex y claves de
    API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Preguntas frecuentes](/es/help/faq) — las preguntas frecuentes principales
- [Preguntas frecuentes: inicio rápido y configuración de la primera ejecución](/es/help/faq-first-run)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
