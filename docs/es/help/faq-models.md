---
read_when:
    - Elegir o cambiar modelos, configurar alias
    - Depuración de la conmutación por error de modelos / "Todos los modelos fallaron"
    - Entender los perfiles de autenticación y cómo gestionarlos
sidebarTitle: Models FAQ
summary: 'Preguntas frecuentes: valores predeterminados del modelo, selección, alias, cambio, conmutación por error y perfiles de autenticación'
title: 'Preguntas frecuentes: modelos y autenticación'
x-i18n:
    generated_at: "2026-05-11T20:38:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1bd3bcfdca583472d42782448271879a2bcaaa21858ab3304da48556ae922c
    source_path: help/faq-models.md
    workflow: 16
---

  Preguntas y respuestas sobre modelos y perfiles de autenticación. Para configuración, sesiones, Gateway, canales y
  solución de problemas, consulta las [preguntas frecuentes](/es/help/faq) principales.

  ## Modelos: valores predeterminados, selección, alias, cambio

  <AccordionGroup>
  <Accordion title='¿Cuál es el "modelo predeterminado"?'>
    El modelo predeterminado de OpenClaw es el que configures como:

    ```
    agents.defaults.model.primary
    ```

    Los modelos se referencian como `provider/model` (ejemplo: `openai/gpt-5.5` o `anthropic/claude-sonnet-4-6`). Si omites el proveedor, OpenClaw primero prueba un alias, luego una coincidencia única de proveedor configurado para ese id de modelo exacto y solo después recurre al proveedor predeterminado configurado como ruta de compatibilidad obsoleta. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado. Aun así, debes configurar **explícitamente** `provider/model`.

  </Accordion>

  <Accordion title="¿Qué modelo recomiendas?">
    **Valor predeterminado recomendado:** usa el modelo de última generación más potente disponible en tu pila de proveedores.
    **Para agentes con herramientas habilitadas o entradas no confiables:** prioriza la potencia del modelo por encima del costo.
    **Para chat rutinario/de bajo riesgo:** usa modelos de respaldo más baratos y enruta según el rol del agente.

    MiniMax tiene su propia documentación: [MiniMax](/es/providers/minimax) y
    [Modelos locales](/es/gateway/local-models).

    Regla práctica: usa el **mejor modelo que puedas permitirte** para trabajos de alto riesgo y un modelo más barato
    para chat rutinario o resúmenes. Puedes enrutar modelos por agente y usar subagentes para
    paralelizar tareas largas (cada subagente consume tokens). Consulta [Modelos](/es/concepts/models) y
    [Subagentes](/es/tools/subagents).

    Advertencia importante: los modelos más débiles o sobrecuantizados son más vulnerables a la inyección de prompts
    y a comportamientos inseguros. Consulta [Seguridad](/es/gateway/security).

    Más contexto: [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sin borrar mi configuración?">
    Usa **comandos de modelo** o edita solo los campos de **modelo**. Evita reemplazar la configuración completa.

    Opciones seguras:

    - `/model` en el chat (rápido, por sesión)
    - `openclaw models set ...` (actualiza solo la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - edita `agents.defaults.model` en `~/.openclaw/openclaw.json`

    Evita `config.apply` con un objeto parcial a menos que quieras reemplazar toda la configuración.
    Para ediciones por RPC, inspecciona primero con `config.schema.lookup` y prefiere `config.patch`. La carga útil de búsqueda te da la ruta normalizada, documentación/restricciones de esquema superficiales y resúmenes inmediatos de los hijos.
    para actualizaciones parciales.
    Si sobrescribiste la configuración, restaura desde una copia de seguridad o vuelve a ejecutar `openclaw doctor` para repararla.

    Documentación: [Modelos](/es/concepts/models), [Configurar](/es/cli/configure), [Configuración](/es/cli/config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Puedo usar modelos autoalojados (llama.cpp, vLLM, Ollama)?">
    Sí. Ollama es la ruta más fácil para modelos locales.

    Configuración más rápida:

    1. Instala Ollama desde `https://ollama.com/download`
    2. Descarga un modelo local como `ollama pull gemma4`
    3. Si también quieres modelos en la nube, ejecuta `ollama signin`
    4. Ejecuta `openclaw onboard` y elige `Ollama`
    5. Elige `Local` o `Cloud + Local`

    Notas:

    - `Cloud + Local` te da modelos en la nube más tus modelos locales de Ollama
    - los modelos en la nube como `kimi-k2.5:cloud` no necesitan una descarga local
    - para cambios manuales, usa `openclaw models list` y `openclaw models set ollama/<model>`

    Nota de seguridad: los modelos más pequeños o muy cuantizados son más vulnerables a la inyección de prompts.
    Recomendamos encarecidamente **modelos grandes** para cualquier bot que pueda usar herramientas.
    Si aun así quieres modelos pequeños, habilita el aislamiento y listas estrictas de herramientas permitidas.

    Documentación: [Ollama](/es/providers/ollama), [Modelos locales](/es/gateway/local-models),
    [Proveedores de modelos](/es/concepts/model-providers), [Seguridad](/es/gateway/security),
    [Aislamiento](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="¿Qué usan OpenClaw, Flawd y Krill como modelos?">
    - Estas implementaciones pueden diferir y cambiar con el tiempo; no hay una recomendación fija de proveedor.
    - Comprueba la configuración de runtime actual en cada Gateway con `openclaw models status`.
    - Para agentes sensibles a la seguridad o con herramientas habilitadas, usa el modelo de última generación más potente disponible.

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sobre la marcha (sin reiniciar)?">
    Usa el comando `/model` como mensaje independiente:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Estos son los alias integrados. Se pueden agregar alias personalizados mediante `agents.defaults.models`.

    Puedes listar los modelos disponibles con `/model`, `/model list` o `/model status`.

    `/model` (y `/model list`) muestra un selector compacto y numerado. Selecciona por número:

    ```
    /model 3
    ```

    También puedes forzar un perfil de autenticación específico para el proveedor (por sesión):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Consejo: `/model status` muestra qué agente está activo, qué archivo `auth-profiles.json` se está usando y qué perfil de autenticación se probará a continuación.
    También muestra el endpoint del proveedor configurado (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

    **¿Cómo desanclo un perfil que configuré con @profile?**

    Vuelve a ejecutar `/model` **sin** el sufijo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si quieres volver al valor predeterminado, elígelo desde `/model` (o envía `/model <default provider/model>`).
    Usa `/model status` para confirmar qué perfil de autenticación está activo.

  </Accordion>

  <Accordion title="Si dos proveedores exponen el mismo id de modelo, ¿cuál usa /model?">
    `/model provider/model` selecciona esa ruta exacta del proveedor para la sesión.

    Por ejemplo, `qianfan/deepseek-v4-flash` y `deepseek/deepseek-v4-flash` son referencias de modelo distintas aunque ambas contengan `deepseek-v4-flash`. OpenClaw no debe cambiar silenciosamente de un proveedor a otro solo porque coincida el id de modelo sin proveedor.

    Una referencia `/model` seleccionada por el usuario también es estricta para la política de respaldo. Si ese proveedor/modelo seleccionado no está disponible, la respuesta falla de forma visible en lugar de responder desde `agents.defaults.model.fallbacks`. Las cadenas de respaldo configuradas siguen aplicándose a los valores predeterminados configurados, a los modelos primarios de trabajos de cron y al estado de respaldo seleccionado automáticamente.

    Si una ejecución iniciada desde una anulación que no es de sesión tiene permitido usar respaldo, OpenClaw prueba primero el proveedor/modelo solicitado, luego los respaldos configurados y solo después el primario configurado. Eso evita que los ids de modelo duplicados sin proveedor salten directamente de vuelta al proveedor predeterminado.

    Consulta [Modelos](/es/concepts/models) y [Conmutación por error de modelos](/es/concepts/model-failover).

  </Accordion>

  <Accordion title="¿Puedo usar GPT 5.5 para tareas diarias y Codex 5.5 para programar?">
    Sí. Trata la elección del modelo y la elección del runtime por separado:

    - **Agente de programación nativo de Codex:** configura `agents.defaults.model.primary` como `openai/gpt-5.5`. Inicia sesión con `openclaw models auth login --provider openai-codex` cuando quieras autenticación por suscripción de ChatGPT/Codex.
    - **Tareas directas de la API de OpenAI fuera del bucle del agente:** configura `OPENAI_API_KEY` para imágenes, embeddings, voz, realtime y otras superficies de API de OpenAI que no sean de agente.
    - **Autenticación con clave de API para agentes de OpenAI:** usa `/model openai/gpt-5.5` con un perfil de clave de API `openai-codex` ordenado.
    - **Subagentes:** enruta tareas de programación a un agente centrado en Codex con su propio modelo `openai/gpt-5.5`.

    Consulta [Modelos](/es/concepts/models) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo configuro el modo rápido para GPT 5.5?">
    Usa una alternancia de sesión o un valor predeterminado de configuración:

    - **Por sesión:** envía `/fast on` mientras la sesión usa `openai/gpt-5.5`.
    - **Valor predeterminado por modelo:** configura `agents.defaults.models["openai/gpt-5.5"].params.fastMode` como `true`.

    Ejemplo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Para OpenAI, el modo rápido se asigna a `service_tier = "priority"` en solicitudes nativas de Responses compatibles. Las anulaciones de sesión `/fast` tienen prioridad sobre los valores predeterminados de configuración.

    Consulta [Pensamiento y modo rápido](/es/tools/thinking) y [Modo rápido de OpenAI](/es/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='¿Por qué veo "Model ... is not allowed" y luego no hay respuesta?'>
    Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y cualquier
    anulación de sesión. Elegir un modelo que no está en esa lista devuelve:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ese error se devuelve **en lugar de** una respuesta normal. Solución: agrega el modelo exacto a
    `agents.defaults.models`, agrega un comodín de proveedor como `"provider/*": {}` para catálogos de proveedores dinámicos, elimina la lista de permitidos o elige un modelo desde `/model list`.
    Si el comando también incluía `--runtime codex`, actualiza primero la lista de permitidos y luego reintenta
    el mismo comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='¿Por qué veo "Unknown model: minimax/MiniMax-M2.7"?'>
    Esto significa que el **proveedor no está configurado** (no se encontró ninguna configuración de proveedor MiniMax ni ningún perfil de autenticación),
    por lo que el modelo no se puede resolver.

    Lista de comprobación para solucionarlo:

    1. Actualiza a una versión actual de OpenClaw (o ejecuta desde `main` en código fuente) y luego reinicia el Gateway.
    2. Asegúrate de que MiniMax esté configurado (asistente o JSON), o de que la autenticación de MiniMax
       exista en env/perfiles de autenticación para que pueda inyectarse el proveedor correspondiente
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` u OAuth almacenado de MiniMax
       para `minimax-portal`).
    3. Usa el id de modelo exacto (distingue mayúsculas y minúsculas) para tu ruta de autenticación:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` para configuración
       con clave de API, o `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuración con OAuth.
    4. Ejecuta:

       ```bash
       openclaw models list
       ```

       y elige desde la lista (o `/model list` en el chat).

    Consulta [MiniMax](/es/providers/minimax) y [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar MiniMax como predeterminado y OpenAI para tareas complejas?">
    Sí. Usa **MiniMax como predeterminado** y cambia de modelo **por sesión** cuando sea necesario.
    Los respaldos son para **errores**, no para "tareas difíciles", así que usa `/model` o un agente separado.

    **Opción A: cambiar por sesión**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Luego:

    ```
    /model gpt
    ```

    **Opción B: agentes separados**

    - Valor predeterminado del agente A: MiniMax
    - Valor predeterminado del agente B: OpenAI
    - Enruta por agente o usa `/agent` para cambiar

    Documentación: [Modelos](/es/concepts/models), [Enrutamiento multiagente](/es/concepts/multi-agent), [MiniMax](/es/providers/minimax), [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title="¿opus / sonnet / gpt son atajos integrados?">
    Sí. OpenClaw incluye algunos atajos predeterminados (solo se aplican cuando el modelo existe en `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si defines tu propio alias con el mismo nombre, tu valor prevalece.

  </Accordion>

  <Accordion title="¿Cómo defino o sobrescribo atajos de modelos (alias)?">
    Los alias provienen de `agents.defaults.models.<modelId>.alias`. Ejemplo:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Luego `/model sonnet` (o `/<alias>` cuando sea compatible) se resuelve a ese ID de modelo.

  </Accordion>

  <Accordion title="¿Cómo agrego modelos de otros proveedores como OpenRouter o Z.AI?">
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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Si haces referencia a un proveedor/modelo pero falta la clave requerida del proveedor, recibirás un error de autenticación en tiempo de ejecución (por ejemplo, `No API key found for provider "zai"`).

    **No se encontró ninguna clave de API para el proveedor después de agregar un agente nuevo**

    Esto suele significar que el **agente nuevo** tiene un almacén de autenticación vacío. La autenticación es por agente y
    se almacena en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opciones de corrección:

    - Ejecuta `openclaw agents add <id>` y configura la autenticación durante el asistente.
    - O copia solo perfiles `api_key` / `token` estáticos portables del almacén de autenticación del agente principal al almacén de autenticación del agente nuevo.
    - Para perfiles OAuth, inicia sesión desde el agente nuevo cuando necesite su propia cuenta; de lo contrario, OpenClaw puede leer a través del agente predeterminado/principal sin clonar tokens de actualización.

    No reutilices `agentDir` entre agentes; causa colisiones de autenticación/sesión.

  </Accordion>
</AccordionGroup>

## Conmutación por error de modelos y "Todos los modelos fallaron"

<AccordionGroup>
  <Accordion title="¿Cómo funciona la conmutación por error?">
    La conmutación por error ocurre en dos etapas:

    1. **Rotación de perfiles de autenticación** dentro del mismo proveedor.
    2. **Respaldo de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

    Los periodos de espera se aplican a los perfiles que fallan (backoff exponencial), por lo que OpenClaw puede seguir respondiendo incluso cuando un proveedor está limitado por tasa o falla temporalmente.

    El grupo de límite de tasa incluye más que simples respuestas `429`. OpenClaw
    también trata mensajes como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` y límites periódicos
    de ventana de uso (`weekly/monthly limit reached`) como límites de tasa
    que justifican la conmutación por error.

    Algunas respuestas con apariencia de facturación no son `402`, y algunas respuestas HTTP `402`
    también permanecen en ese grupo transitorio. Si un proveedor devuelve
    texto explícito de facturación en `401` o `403`, OpenClaw aún puede mantenerlo en
    la vía de facturación, pero los comparadores de texto específicos del proveedor permanecen limitados al
    proveedor que los posee (por ejemplo, OpenRouter `Key limit exceeded`). Si un mensaje `402`
    en cambio parece una ventana de uso reintentable o
    un límite de gasto de organización/espacio de trabajo (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo trata como
    `rate_limit`, no como una deshabilitación prolongada por facturación.

    Los errores de desbordamiento de contexto son diferentes: firmas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` u `ollama error: context length
    exceeded` permanecen en la ruta de Compaction/reintento en lugar de avanzar al
    respaldo de modelo.

    El texto genérico de error del servidor es deliberadamente más estrecho que "cualquier cosa con
    unknown/error dentro". OpenClaw sí trata formas transitorias con alcance de proveedor
    como Anthropic sin más `An unknown error occurred`, OpenRouter sin más
    `Provider returned error`, errores de motivo de detención como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) y errores de proveedor ocupado como `ModelNotReadyException` como
    señales de tiempo de espera/sobrecarga que justifican la conmutación por error cuando el contexto del proveedor
    coincide.
    El texto genérico de respaldo interno como `LLM request failed with an unknown
    error.` permanece conservador y no activa por sí solo el respaldo de modelo.

  </Accordion>

  <Accordion title='¿Qué significa "No credentials found for profile anthropic:default"?'>
    Significa que el sistema intentó usar el ID de perfil de autenticación `anthropic:default`, pero no pudo encontrar credenciales para él en el almacén de autenticación esperado.

    **Lista de verificación para corregirlo:**

    - **Confirma dónde viven los perfiles de autenticación** (rutas nuevas frente a heredadas)
      - Actual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Heredada: `~/.openclaw/agent/*` (migrada por `openclaw doctor`)
    - **Confirma que tu variable de entorno esté cargada por el Gateway**
      - Si defines `ANTHROPIC_API_KEY` en tu shell pero ejecutas el Gateway mediante systemd/launchd, puede que no la herede. Ponla en `~/.openclaw/.env` o habilita `env.shellEnv`.
    - **Asegúrate de editar el agente correcto**
      - Las configuraciones multiagente significan que puede haber varios archivos `auth-profiles.json`.
    - **Comprueba de forma básica el estado del modelo/autenticación**
      - Usa `openclaw models status` para ver los modelos configurados y si los proveedores están autenticados.

    **Lista de verificación para corregir "No credentials found for profile anthropic"**

    Esto significa que la ejecución está fijada a un perfil de autenticación de Anthropic, pero el Gateway
    no puede encontrarlo en su almacén de autenticación.

    - **Usa Claude CLI**
      - Ejecuta `openclaw models auth login --provider anthropic --method cli --set-default` en el host del gateway.
    - **Si quieres usar una clave de API en su lugar**
      - Pon `ANTHROPIC_API_KEY` en `~/.openclaw/.env` en el **host del gateway**.
      - Borra cualquier orden fijado que fuerce un perfil faltante:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirma que estás ejecutando comandos en el host del gateway**
      - En modo remoto, los perfiles de autenticación viven en la máquina del gateway, no en tu portátil.

  </Accordion>

  <Accordion title="¿Por qué también intentó Google Gemini y falló?">
    Si tu configuración de modelos incluye Google Gemini como respaldo (o cambiaste a una abreviatura de Gemini), OpenClaw lo intentará durante el respaldo de modelo. Si no has configurado credenciales de Google, verás `No API key found for provider "google"`.

    Corrección: proporciona autenticación de Google, o elimina/evita modelos de Google en `agents.defaults.model.fallbacks` / alias para que el respaldo no enrute allí.

    **Solicitud LLM rechazada: se requiere firma de pensamiento (Google Antigravity)**

    Causa: el historial de la sesión contiene **bloques de pensamiento sin firmas** (a menudo de
    un flujo abortado/parcial). Google Antigravity requiere firmas para los bloques de pensamiento.

    Corrección: OpenClaw ahora elimina los bloques de pensamiento sin firma para Google Antigravity Claude. Si sigue apareciendo, inicia una **sesión nueva** o define `/thinking off` para ese agente.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo administrarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos OAuth, almacenamiento de tokens, patrones multicuenta)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un perfil de autenticación es un registro de credenciales con nombre (OAuth o clave de API) vinculado a un proveedor. Los perfiles viven en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Para inspeccionar perfiles guardados sin volcar secretos, ejecuta `openclaw models auth list` (opcionalmente `--provider <id>` o `--json`). Consulta [CLI de modelos](/es/cli/models#auth-profiles) para obtener detalles.

  </Accordion>

  <Accordion title="¿Cuáles son los ID de perfil habituales?">
    OpenClaw usa ID con prefijo de proveedor como:

    - `anthropic:default` (común cuando no existe identidad de correo electrónico)
    - `anthropic:<email>` para identidades OAuth
    - ID personalizados que elijas (por ejemplo, `anthropic:work`)

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se intenta primero?">
    Sí. La configuración admite metadatos opcionales para perfiles y un orden por proveedor (`auth.order.<provider>`). Esto **no** almacena secretos; asigna ID a proveedor/modo y define el orden de rotación.

    OpenClaw puede omitir temporalmente un perfil si está en un **periodo de espera** corto (límites de tasa/tiempos de espera/fallos de autenticación) o en un estado **deshabilitado** más largo (facturación/créditos insuficientes). Para inspeccionarlo, ejecuta `openclaw models status --json` y revisa `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Los periodos de espera por límite de tasa pueden tener alcance de modelo. Un perfil que está en espera
    para un modelo aún puede ser utilizable para un modelo hermano en el mismo proveedor,
    mientras que las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil.

    También puedes definir una sobrescritura de orden **por agente** (almacenada en el `auth-state.json` de ese agente) mediante la CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para apuntar a un agente específico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Para verificar qué se intentará realmente, usa:

    ```bash
    openclaw models status --probe
    ```

    Si se omite un perfil almacenado del orden explícito, la comprobación informa
    `excluded_by_auth_order` para ese perfil en lugar de intentarlo silenciosamente.

  </Accordion>

  <Accordion title="OAuth frente a clave de API: ¿cuál es la diferencia?">
    OpenClaw admite ambos:

    - **OAuth** a menudo aprovecha el acceso de suscripción (cuando corresponde).
    - **Las claves de API** usan facturación por token.

    El asistente admite explícitamente Anthropic Claude CLI, OAuth de OpenAI Codex y claves de API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [FAQ](/es/help/faq) — las preguntas frecuentes principales
- [FAQ — inicio rápido y configuración de primera ejecución](/es/help/faq-first-run)
- [Selección de modelo](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
