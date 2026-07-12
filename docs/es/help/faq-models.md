---
read_when:
    - Elegir o cambiar modelos y configurar alias
    - Depuración de la conmutación por error de modelos / «Todos los modelos fallaron»
    - Cómo comprender los perfiles de autenticación y administrarlos
sidebarTitle: Models FAQ
summary: 'Preguntas frecuentes: valores predeterminados de los modelos, selección, alias, cambio, conmutación por error y perfiles de autenticación'
title: 'Preguntas frecuentes: modelos y autenticación'
x-i18n:
    generated_at: "2026-07-11T23:09:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Preguntas y respuestas sobre modelos y perfiles de autenticación. Para la configuración, las sesiones, el Gateway, los canales y la
  solución de problemas, consulta las [preguntas frecuentes](/es/help/faq) principales.

  ## Modelos: valores predeterminados, selección, alias y cambio

  <AccordionGroup>
  <Accordion title='¿Qué es el "modelo predeterminado"?'>
    Se establece con:

    ```text
    agents.defaults.model.primary
    ```

    Los modelos son referencias `proveedor/modelo` (por ejemplo: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Establece siempre `provider/model` de forma explícita. Si
    omites el proveedor, OpenClaw intenta primero encontrar un alias coincidente, después una
    coincidencia única entre los proveedores configurados para ese identificador de modelo y, por último, recurre al
    proveedor predeterminado configurado (ruta de compatibilidad obsoleta). Si ese
    proveedor ya no tiene el modelo predeterminado configurado, OpenClaw recurre
    al primer proveedor/modelo configurado en lugar de usar un valor predeterminado obsoleto.

  </Accordion>

  <Accordion title="¿Qué modelo recomiendan?">
    Usa el modelo más potente de última generación que ofrezca tu conjunto de proveedores,
    especialmente para agentes con herramientas habilitadas o que procesen entradas no confiables; los modelos más débiles o
    excesivamente cuantizados son más vulnerables a la inyección de instrucciones y a comportamientos
    inseguros (consulta [Seguridad](/es/gateway/security)). Asigna modelos más económicos al
    chat rutinario o de bajo riesgo según el rol del agente.

    Asigna modelos por agente y usa subagentes para paralelizar tareas largas (cada
    subagente consume sus propios tokens). Consulta [Modelos](/es/concepts/models),
    [Subagentes](/es/tools/subagents), [MiniMax](/es/providers/minimax) y
    [Modelos locales](/es/gateway/local-models).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sin borrar mi configuración?">
    Cambia únicamente los campos del modelo; evita sustituir toda la configuración.

    - `/model` en el chat (por sesión; consulta [Comandos con barra](/es/tools/slash-commands))
    - `openclaw models set ...` (actualiza únicamente la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - edita directamente `agents.defaults.model` en `~/.openclaw/openclaw.json`

    Para modificaciones mediante RPC, inspecciona primero con `config.schema.lookup` (ruta
    normalizada, documentación superficial del esquema y resúmenes de elementos secundarios) y después prefiere `config.patch`
    a `config.apply` con un objeto parcial. Si sobrescribiste la configuración,
    restáurala desde una copia de seguridad o ejecuta `openclaw doctor` para repararla.

    Documentación: [Modelos](/es/concepts/models), [Configurar](/es/cli/configure),
    [Configuración](/es/cli/config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Puedo usar modelos autoalojados (llama.cpp, vLLM, Ollama)?">
    Sí; Ollama es la opción más sencilla. Configuración rápida:

    1. Instala Ollama desde `https://ollama.com/download`
    2. Descarga un modelo local, por ejemplo, `ollama pull gemma4`
    3. Para usar también modelos en la nube, ejecuta `ollama signin`
    4. Ejecuta `openclaw onboard`, elige `Ollama` y después `Local` o `Cloud + Local`

    `Cloud + Local` te proporciona modelos en la nube además de tus modelos locales de Ollama;
    los modelos en la nube como `kimi-k2.5:cloud` no requieren una descarga local. Para cambiar
    manualmente: `openclaw models list` y después `openclaw models set ollama/<model>`.

    Los modelos más pequeños o muy cuantizados son más vulnerables a la inyección de instrucciones.
    Usa modelos grandes para cualquier bot con acceso a herramientas; si aun así usas modelos
    pequeños, activa el aislamiento y listas estrictas de herramientas permitidas.

    Documentación: [Ollama](/es/providers/ollama), [Modelos locales](/es/gateway/local-models),
    [Proveedores de modelos](/es/concepts/model-providers), [Seguridad](/es/gateway/security),
    [Aislamiento](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sobre la marcha (sin reiniciar)?">
    Envía `/model <name>` como mensaje independiente. Consulta
    [Comandos con barra](/es/tools/slash-commands) para ver la
    lista completa de comandos, incluido el selector numerado (`/model`, `/model
    list`, `/model 3`), `/model default` para borrar una sustitución de sesión y
    `/model status` para obtener detalles sobre el endpoint y el modo de API.

    Fuerza un perfil de autenticación específico por sesión con `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Para desanclar un perfil establecido con `@profile`, vuelve a ejecutar `/model` sin el
    sufijo (por ejemplo, `/model anthropic/claude-opus-4-6`) o elige el valor predeterminado en
    `/model`. Usa `/model status` para confirmar el perfil de autenticación activo.

  </Accordion>

  <Accordion title="Si dos proveedores ofrecen el mismo identificador de modelo, ¿cuál usa /model?">
    `/model provider/model` selecciona esa ruta exacta del proveedor. Por ejemplo,
    `qianfan/deepseek-v4-flash` y `deepseek/deepseek-v4-flash` son referencias diferentes
    aunque el identificador del modelo coincida; OpenClaw no cambia silenciosamente de
    proveedor cuando solo coincide el identificador.

    Una referencia `/model` seleccionada por el usuario aplica una política estricta para la conmutación por error: si ese
    proveedor/modelo deja de estar disponible, la respuesta falla de forma visible en lugar de
    recurrir a `agents.defaults.model.fallbacks`. Las cadenas de conmutación por error
    configuradas siguen aplicándose a los valores predeterminados configurados, a los modelos principales de tareas Cron y al
    estado de conmutación por error seleccionado automáticamente. Cuando se permite que una ejecución sin sustitución de sesión
    use la conmutación por error, OpenClaw prueba primero el proveedor/modelo solicitado, después
    las alternativas configuradas y, por último, el modelo principal configurado; por tanto, los identificadores
    de modelo simples duplicados nunca vuelven directamente al proveedor predeterminado.

    Consulta [Modelos](/es/concepts/models) y [Conmutación por error de modelos](/es/concepts/model-failover).

  </Accordion>

  <Accordion title="¿Puedo usar GPT 5.5 para las tareas diarias y Codex 5.5 para programar?">
    Sí; la elección del modelo y la elección del entorno de ejecución son independientes:

    - **Agente de programación Codex nativo:** establece `agents.defaults.model.primary` en
      `openai/gpt-5.5`. Inicia sesión con `openclaw models auth login --provider
      openai` para usar la autenticación de la suscripción de ChatGPT/Codex.
    - **Tareas directas de la API de OpenAI fuera del bucle del agente:** configura
      `OPENAI_API_KEY` para imágenes, embeddings, voz, tiempo real y otras
      superficies de la API de OpenAI ajenas al agente.
    - **Autenticación mediante clave de API del agente de OpenAI:** `/model openai/gpt-5.5` con un perfil
      ordenado de claves de API de `openai`.
    - **Subagentes:** asigna las tareas de programación a un agente centrado en Codex con su
      propio modelo `openai/gpt-5.5`.

    Consulta [Modelos](/es/concepts/models) y [Comandos con barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo configuro el modo rápido para GPT 5.5?">
    - **Por sesión:** envía `/fast on` mientras usas `openai/gpt-5.5`.
    - **Valor predeterminado por modelo:** establece
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` en `true`.
    - **Límite automático:** `/fast auto` o `params.fastMode: "auto"` ejecuta rápidamente las nuevas
      llamadas al modelo hasta alcanzar el límite; después ejecuta sin el modo rápido las llamadas posteriores de reintento, conmutación por error,
      resultado de herramienta o continuación. El límite predeterminado es de
      60 segundos; modifícalo con `params.fastAutoOnSeconds` en el modelo.

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
    se conservan los valores existentes de `service_tier` y el modo rápido no
    reescribe `reasoning` ni `text.verbosity`. Las sustituciones `/fast` de la sesión tienen
    prioridad sobre los valores predeterminados de la configuración.

    Consulta [Razonamiento y modo rápido](/es/tools/thinking) y la sección Modo rápido
    de Configuración avanzada en la página del proveedor [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title='¿Por qué veo "Model ... is not allowed" y después no recibo respuesta?'>
    Si se establece `agents.defaults.models`, este se convierte en la **lista de permitidos** para
    `/model` y las sustituciones de sesión. Elegir un modelo que no esté en esa lista devuelve
    lo siguiente en lugar de una respuesta normal:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Solución: añade el modelo exacto a `agents.defaults.models`, añade un comodín de proveedor
    como `"provider/*": {}` para catálogos dinámicos, elimina la
    lista de permitidos o elige un modelo de `/model list`. Si el comando también
    incluía `--runtime codex`, actualiza primero la lista de permitidos y vuelve a intentar
    el mismo comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='¿Por qué veo "Unknown model: minimax/MiniMax-M3"?'>
    Si usas una versión antigua de OpenClaw, actualiza primero (o ejecuta desde `main`
    del código fuente) y reinicia el Gateway; es posible que `MiniMax-M3` todavía no esté en el
    catálogo de la versión instalada. De lo contrario, el proveedor MiniMax no está
    configurado (no se encontró ninguna entrada de proveedor ni perfil de autenticación), por lo que el modelo no puede
    resolverse. Consulta la sección Solución de problemas de la
    página del proveedor [MiniMax](/es/providers/minimax) para ver la lista de comprobación completa de la solución,
    la tabla de identificadores de proveedor/modelo y el ejemplo de bloque de configuración.

  </Accordion>

  <Accordion title="¿Puedo usar MiniMax como modelo predeterminado y OpenAI para tareas complejas?">
    Sí. Usa MiniMax como valor predeterminado y cambia de modelo por sesión; las alternativas
    son para errores, no para "tareas difíciles", así que usa `/model` o un agente independiente.

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

    **Opción B: agentes independientes** — El agente A usa MiniMax de forma predeterminada y el agente B
    usa OpenAI; dirige las tareas por agente o usa `/agent` para cambiar.

    Documentación: [Modelos](/es/concepts/models), [Enrutamiento multiagente](/es/concepts/multi-agent),
    [MiniMax](/es/providers/minimax), [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title="¿opus / sonnet / gpt son atajos integrados?">
    Sí; son abreviaturas integradas que solo se aplican cuando el modelo de destino existe en
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

    Tu propio alias con el mismo nombre sustituye al integrado.

  </Accordion>

  <Accordion title="¿Cómo defino o sustituyo los atajos de modelos (alias)?">
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

    Después, `/model sonnet` (o `/<alias>` cuando sea compatible) se resuelve como ese
    identificador de modelo.

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

    Si falta la clave de un proveedor para un proveedor/modelo referenciado, se genera un error de
    autenticación en tiempo de ejecución (por ejemplo, `No API key found for provider "zai"`).

    **No se encontró ninguna clave de API para el proveedor después de añadir un agente nuevo**

    Un agente nuevo tiene un almacén de autenticación vacío; la autenticación es específica de cada agente y se almacena en:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Solución: ejecuta `openclaw agents add <id>` y configura la autenticación en el asistente, o
    copia únicamente los perfiles estáticos portátiles `api_key`/`token` del
    almacén del agente principal. Para OAuth, inicia sesión desde el agente nuevo
    cuando necesite su propia cuenta. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent)
    para conocer todas las reglas de reutilización de `agentDir` y uso compartido
    de credenciales; nunca reutilices `agentDir` entre agentes.

  </Accordion>
</AccordionGroup>

## Conmutación por error de modelos y "Todos los modelos fallaron"

<AccordionGroup>
  <Accordion title="¿Cómo funciona la conmutación por error?">
    Consta de dos etapas:

    1. **Rotación de perfiles de autenticación** dentro del mismo proveedor.
    2. **Modelo alternativo** al siguiente modelo de `agents.defaults.model.fallbacks`.

    Se aplican períodos de espera a los perfiles que fallan (retardo exponencial),
    por lo que OpenClaw sigue respondiendo cuando un proveedor limita la tasa de
    solicitudes o falla temporalmente.

    El grupo de límites de tasa abarca más que un simple `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` y los límites periódicos
    de la ventana de uso (`weekly/monthly limit reached`) cuentan como límites
    de tasa que justifican la conmutación por error.

    Las respuestas de facturación no siempre son `402`, y algunos códigos `402`
    permanecen en el grupo transitorio/de límite de tasa en lugar de pasar a la
    vía de facturación. El texto explícito de facturación en `401`/`403` aún puede
    dirigirse a la vía de facturación; los patrones de texto específicos del
    proveedor (por ejemplo, `Key limit exceeded` de OpenRouter) permanecen
    restringidos a su propio proveedor. Un `402` que parece indicar una ventana
    de uso reintentable o un límite de gasto de la organización o del espacio de
    trabajo (`daily limit reached, resets tomorrow`, `organization spending limit
    exceeded`) se trata como `rate_limit`, no como una desactivación prolongada
    por facturación.

    Los errores de desbordamiento de contexto quedan totalmente fuera de la ruta
    alternativa: las firmas como `request_too_large`, `input exceeds the maximum
    number of tokens`, `input token count exceeds the maximum number of input
    tokens`, `input is too long for the model` u `ollama error: context length
    exceeded` pasan a Compaction y reintento en lugar de avanzar al modelo
    alternativo.

    El texto genérico de error del servidor tiene un alcance más limitado que
    "cualquier cosa que contenga unknown/error". Las formas transitorias
    específicas del proveedor que sí cuentan como señales de conmutación por
    error son: el mensaje aislado `An unknown error occurred` de Anthropic, el
    mensaje aislado `Provider returned error` de OpenRouter, los errores de motivo
    de detención como `Unhandled stop reason: error`, las cargas JSON `api_error`
    con texto transitorio del servidor (`internal server error`, `unknown error,
    520`, `upstream error`, `backend error`) y los errores de proveedor ocupado
    como `ModelNotReadyException` cuando coincide el contexto del proveedor. El
    texto genérico interno de respaldo como `LLM request failed with an unknown
    error.` se trata de forma conservadora y no activa por sí solo la ruta
    alternativa.

  </Accordion>

  <Accordion title='¿Qué significa "No se encontraron credenciales para el perfil anthropic:default"?'>
    El identificador de perfil de autenticación `anthropic:default` no tiene
    credenciales en el almacén de autenticación esperado.

    **Lista de comprobación para solucionarlo:**

    - Confirma dónde se encuentran los perfiles; ubicación actual:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; ubicación heredada:
      `~/.openclaw/agent/*` (migrada por `openclaw doctor`).
    - Confirma que el Gateway cargue tu variable de entorno. Si
      `ANTHROPIC_API_KEY` solo está definida en tu shell, no llegará a una
      ejecución del Gateway mediante systemd/launchd; colócala en
      `~/.openclaw/.env` o activa `env.shellEnv`.
    - Confirma que estés editando el agente correcto; las configuraciones
      multiagente tienen varios archivos `auth-profiles.json`.
    - Ejecuta `openclaw models status` para ver los modelos configurados y el
      estado de autenticación del proveedor.

    **Para "No se encontraron credenciales para el perfil anthropic" (sin sufijo de correo electrónico):**

    La ejecución está fijada a un perfil de Anthropic que el Gateway no puede
    encontrar.

    - Usa la CLI de Claude: ejecuta `openclaw models auth login --provider anthropic
      --method cli --set-default` en el host del Gateway.
    - Si prefieres una clave de API: coloca `ANTHROPIC_API_KEY` en
      `~/.openclaw/.env` en el host del Gateway y, a continuación, elimina
      cualquier orden fijado que fuerce el uso del perfil ausente:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Modo remoto: los perfiles de autenticación se encuentran en la máquina
      del Gateway, no en tu portátil; confirma que estés ejecutando allí los
      comandos.

  </Accordion>

  <Accordion title="¿Por qué también intentó usar Google Gemini y falló?">
    Si la configuración de tu modelo incluye Google Gemini como alternativa
    (o cambiaste a una forma abreviada de Gemini), OpenClaw intenta usarlo durante
    la conmutación por error. Si no hay credenciales de Google configuradas,
    aparece `No API key found for provider "google"`. Solución: añade la
    autenticación de Google o elimina los modelos de Google de
    `agents.defaults.model.fallbacks`/alias.

    **Solicitud al LLM rechazada: se requiere una firma de razonamiento (Google Antigravity)**

    Causa: el historial de la sesión contiene bloques de razonamiento sin firmas
    (a menudo debido a una transmisión interrumpida o parcial); Google Antigravity
    exige firmas en los bloques de razonamiento. OpenClaw elimina los bloques de
    razonamiento sin firma para Google Antigravity Claude; si el problema persiste,
    inicia una sesión nueva o establece `/thinking off` para ese agente.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo administrarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos de OAuth, almacenamiento de tokens y patrones para varias cuentas)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un registro de credenciales con nombre (OAuth o clave de API) vinculado a un
    proveedor, almacenado en:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Inspecciona los perfiles guardados sin mostrar secretos: `openclaw models auth
    list` (opcionalmente, `--provider <id>` o `--json`). Consulta
    [CLI de modelos](/es/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="¿Cuáles son los identificadores de perfil habituales?">
    Con prefijo del proveedor: `anthropic:default` (habitual cuando no existe una
    identidad de correo electrónico), `anthropic:<email>` para identidades de
    OAuth o un identificador personalizado que elijas (por ejemplo,
    `anthropic:work`).

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se intenta primero?">
    Sí. La configuración `auth.order.<provider>` establece el orden de rotación
    por proveedor (solo metadatos; no se almacenan secretos).

    OpenClaw puede omitir un perfil durante un breve **período de espera**
    (límites de tasa, tiempos de espera o fallos de autenticación) o durante un
    estado **desactivado** más prolongado (facturación o créditos insuficientes).
    Inspecciónalo con `openclaw models status --json` y revisa
    `auth.unusableProfiles`. Ajústalo con `auth.cooldowns.billingBackoffHours*`.
    Los períodos de espera por límite de tasa pueden limitarse a un modelo: un
    perfil en espera para un modelo aún puede atender a otro modelo del mismo
    proveedor; las ventanas de facturación o desactivación bloquean todo el
    perfil.

    Establece una anulación del orden por agente (almacenada en el archivo
    `auth-state.json` de ese agente):

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
    perfil almacenado que se omita de un orden explícito muestra
    `excluded_by_auth_order` en lugar de intentarse de forma silenciosa.

  </Accordion>

  <Accordion title="OAuth frente a clave de API: ¿cuál es la diferencia?">
    - El **inicio de sesión con OAuth/CLI** suele usar el acceso mediante
      suscripción cuando el proveedor lo admite. Para Anthropic, el backend de la
      CLI de Claude de OpenClaw usa `claude -p` de Claude Code, que Anthropic
      actualmente trata como uso programático/del Agent SDK que consume los
      límites de uso de la suscripción; consulta [Anthropic](/es/providers/anthropic)
      para conocer el estado actual de la pausa de facturación y los enlaces a
      las fuentes.
    - Las **claves de API** usan facturación por token.

    El asistente admite la CLI de Anthropic Claude, OAuth de OpenAI Codex y claves
    de API.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Preguntas frecuentes](/es/help/faq) — las preguntas frecuentes principales
- [Preguntas frecuentes: inicio rápido y configuración de la primera ejecución](/es/help/faq-first-run)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
