---
read_when:
    - Elegir o cambiar modelos, configurar alias
    - Depuración de la conmutación por error de modelos / "Todos los modelos fallaron"
    - Comprender los perfiles de autenticación y cómo gestionarlos
sidebarTitle: Models FAQ
summary: 'Preguntas frecuentes: valores predeterminados de modelos, selección, alias, cambio, conmutación por error y perfiles de autenticación'
title: 'Preguntas frecuentes: modelos y autenticación'
x-i18n:
    generated_at: "2026-06-27T11:41:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  Preguntas y respuestas sobre modelos y perfiles de autenticación. Para configuración, sesiones, Gateway, canales y
  solución de problemas, consulta la [pregunta frecuente principal](/es/help/faq).

  ## Modelos: valores predeterminados, selección, alias y cambio

  <AccordionGroup>
  <Accordion title='¿Qué es el "modelo predeterminado"?'>
    El modelo predeterminado de OpenClaw es lo que configures como:

    ```
    agents.defaults.model.primary
    ```

    Los modelos se referencian como `provider/model` (ejemplo: `openai/gpt-5.5` o `anthropic/claude-sonnet-4-6`). Si omites el proveedor, OpenClaw primero intenta usar un alias, luego una coincidencia única de proveedor configurado para ese id exacto de modelo y solo después recurre al proveedor predeterminado configurado como ruta de compatibilidad obsoleta. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado. Aun así, deberías configurar `provider/model` **explícitamente**.

  </Accordion>

  <Accordion title="¿Qué modelo recomiendas?">
    **Valor predeterminado recomendado:** usa el modelo más potente de última generación disponible en tu conjunto de proveedores.
    **Para agentes con herramientas habilitadas o entrada no confiable:** prioriza la potencia del modelo por encima del costo.
    **Para chat rutinario o de bajo riesgo:** usa modelos de respaldo más económicos y enruta según el rol del agente.

    MiniMax tiene su propia documentación: [MiniMax](/es/providers/minimax) y
    [modelos locales](/es/gateway/local-models).

    Regla general: usa el **mejor modelo que puedas permitirte** para trabajo de alto riesgo y un modelo más económico
    para chat rutinario o resúmenes. Puedes enrutar modelos por agente y usar subagentes para
    paralelizar tareas largas (cada subagente consume tokens). Consulta [Modelos](/es/concepts/models) y
    [Subagentes](/es/tools/subagents).

    Advertencia importante: los modelos más débiles o demasiado cuantizados son más vulnerables a la inyección de prompts
    y a comportamientos inseguros. Consulta [Seguridad](/es/gateway/security).

    Más contexto: [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sin borrar mi configuración?">
    Usa **comandos de modelo** o edita solo los campos de **modelo**. Evita reemplazos completos de configuración.

    Opciones seguras:

    - `/model` en el chat (rápido, por sesión)
    - `openclaw models set ...` (actualiza solo la configuración de modelo)
    - `openclaw configure --section model` (interactivo)
    - editar `agents.defaults.model` en `~/.openclaw/openclaw.json`

    Evita `config.apply` con un objeto parcial salvo que pretendas reemplazar toda la configuración.
    Para ediciones por RPC, inspecciona primero con `config.schema.lookup` y prefiere `config.patch`. La carga de lookup te da la ruta normalizada, documentación/restricciones superficiales del esquema y resúmenes inmediatos de los hijos.
    para actualizaciones parciales.
    Si sobrescribiste la configuración, restaura desde una copia de seguridad o vuelve a ejecutar `openclaw doctor` para repararla.

    Documentación: [Modelos](/es/concepts/models), [Configurar](/es/cli/configure), [Configuración](/es/cli/config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Puedo usar modelos autoalojados (llama.cpp, vLLM, Ollama)?">
    Sí. Ollama es la ruta más sencilla para modelos locales.

    Configuración más rápida:

    1. Instala Ollama desde `https://ollama.com/download`
    2. Descarga un modelo local como `ollama pull gemma4`
    3. Si también quieres modelos en la nube, ejecuta `ollama signin`
    4. Ejecuta `openclaw onboard` y elige `Ollama`
    5. Elige `Local` o `Cloud + Local`

    Notas:

    - `Cloud + Local` te da modelos en la nube además de tus modelos locales de Ollama
    - los modelos en la nube como `kimi-k2.5:cloud` no necesitan una descarga local
    - para cambio manual, usa `openclaw models list` y `openclaw models set ollama/<model>`

    Nota de seguridad: los modelos más pequeños o muy cuantizados son más vulnerables a la inyección de prompts.
    Recomendamos encarecidamente **modelos grandes** para cualquier bot que pueda usar herramientas.
    Si aun así quieres modelos pequeños, habilita el aislamiento y allowlists estrictas de herramientas.

    Documentación: [Ollama](/es/providers/ollama), [modelos locales](/es/gateway/local-models),
    [proveedores de modelos](/es/concepts/model-providers), [Seguridad](/es/gateway/security),
    [Aislamiento](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="¿Qué usan OpenClaw, Flawd y Krill como modelos?">
    - Estos despliegues pueden diferir y cambiar con el tiempo; no hay una recomendación fija de proveedor.
    - Revisa la configuración actual de ejecución en cada Gateway con `openclaw models status`.
    - Para agentes sensibles a seguridad o con herramientas habilitadas, usa el modelo más potente de última generación disponible.

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

    Consejo: `/model status` muestra qué agente está activo, qué archivo `auth-profiles.json` se está usando y qué perfil de autenticación se intentará a continuación.
    También muestra el endpoint configurado del proveedor (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

    **¿Cómo desanclo un perfil que configuré con @profile?**

    Vuelve a ejecutar `/model` **sin** el sufijo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si quieres volver al valor predeterminado, selecciónalo desde `/model` (o envía `/model <default provider/model>`).
    Usa `/model status` para confirmar qué perfil de autenticación está activo.

  </Accordion>

  <Accordion title="Si dos proveedores exponen el mismo id de modelo, ¿cuál usa /model?">
    `/model provider/model` selecciona esa ruta exacta de proveedor para la sesión.

    Por ejemplo, `qianfan/deepseek-v4-flash` y `deepseek/deepseek-v4-flash` son referencias de modelo distintas aunque ambas contengan `deepseek-v4-flash`. OpenClaw no debería cambiar silenciosamente de un proveedor al otro solo porque coincida el id de modelo sin proveedor.

    Una referencia `/model` seleccionada por el usuario también es estricta para la política de respaldo. Si ese proveedor/modelo seleccionado no está disponible, la respuesta falla de forma visible en lugar de responder desde `agents.defaults.model.fallbacks`. Las cadenas de respaldo configuradas siguen aplicándose a valores predeterminados configurados, primarios de trabajos Cron y estado de respaldo autoseleccionado.

    Si una ejecución que empezó desde una anulación que no es de sesión puede usar respaldo, OpenClaw intenta primero el proveedor/modelo solicitado, luego los respaldos configurados y solo después el primario configurado. Eso evita que ids de modelo sin proveedor duplicados salten directamente de vuelta al proveedor predeterminado.

    Consulta [Modelos](/es/concepts/models) y [conmutación por error de modelos](/es/concepts/model-failover).

  </Accordion>

  <Accordion title="¿Puedo usar GPT 5.5 para tareas diarias y Codex 5.5 para programar?">
    Sí. Trata la elección de modelo y la elección de runtime por separado:

    - **Agente de programación nativo de Codex:** configura `agents.defaults.model.primary` como `openai/gpt-5.5`. Inicia sesión con `openclaw models auth login --provider openai` cuando quieras autenticación de suscripción de ChatGPT/Codex.
    - **Tareas directas de API de OpenAI fuera del bucle del agente:** configura `OPENAI_API_KEY` para imágenes, embeddings, voz, tiempo real y otras superficies de API de OpenAI que no sean de agente.
    - **Autenticación con clave de API del agente OpenAI:** usa `/model openai/gpt-5.5` con un perfil de clave de API `openai` ordenado.
    - **Subagentes:** enruta tareas de programación a un agente centrado en Codex con su propio modelo `openai/gpt-5.5`.

    Consulta [Modelos](/es/concepts/models) y [comandos de barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo configuro el modo rápido para GPT 5.5?">
    Usa un alternador de sesión o un valor predeterminado de configuración:

    - **Por sesión:** envía `/fast on` mientras la sesión usa `openai/gpt-5.5`.
    - **Valor predeterminado por modelo:** configura `agents.defaults.models["openai/gpt-5.5"].params.fastMode` como `true`.
    - **Corte automático:** usa `/fast auto` o `params.fastMode: "auto"` para iniciar las nuevas llamadas de modelo en modo rápido hasta el corte automático, y luego iniciar los reintentos, respaldos, resultados de herramientas o llamadas de continuación posteriores sin modo rápido. El corte predeterminado es de 60 segundos; configura `params.fastAutoOnSeconds` en el modelo activo para cambiarlo.

    Ejemplo:

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

    Para OpenAI, el modo rápido se asigna a `service_tier = "priority"` en solicitudes nativas de Responses compatibles. Las anulaciones de sesión `/fast` tienen prioridad sobre los valores predeterminados de configuración. Los turnos del servidor de aplicación de Codex solo pueden recibir el tier al inicio del turno, por lo que `auto` se aplica en el siguiente turno de modelo iniciado por OpenClaw en lugar de dentro de un turno de servidor de aplicación que ya está en ejecución.

    Consulta [Razonamiento y modo rápido](/es/tools/thinking) y [modo rápido de OpenAI](/es/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='¿Por qué veo "Model ... is not allowed" y luego no hay respuesta?'>
    Si `agents.defaults.models` está configurado, se convierte en la **allowlist** para `/model` y cualquier
    anulación de sesión. Elegir un modelo que no está en esa lista devuelve:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ese error se devuelve **en lugar de** una respuesta normal. Solución: agrega el modelo exacto a
    `agents.defaults.models`, agrega un comodín de proveedor como `"provider/*": {}` para catálogos dinámicos de proveedores, elimina la allowlist o elige un modelo de `/model list`.
    Si el comando también incluía `--runtime codex`, actualiza primero la allowlist y luego vuelve a intentar
    el mismo comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='¿Por qué veo "Unknown model: minimax/MiniMax-M3"?'>
    Esto significa que el **proveedor no está configurado** (no se encontró configuración de proveedor MiniMax ni perfil de autenticación),
    así que el modelo no se puede resolver.

    Lista de verificación para corregirlo:

    1. Actualiza a una versión actual de OpenClaw (o ejecuta desde `main` de origen) y luego reinicia el Gateway.
    2. Asegúrate de que MiniMax esté configurado (asistente o JSON), o de que exista autenticación de MiniMax
       en perfiles de entorno/autenticación para que se pueda inyectar el proveedor coincidente
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` u OAuth de MiniMax almacenado
       para `minimax-portal`).
    3. Usa el id exacto del modelo (distingue mayúsculas y minúsculas) para tu ruta de autenticación:
       `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` o
       `minimax/MiniMax-M2.7-highspeed` para configuración con clave de API, o
       `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` o
       `minimax-portal/MiniMax-M2.7-highspeed` para configuración con OAuth.
    4. Ejecuta:

       ```bash
       openclaw models list
       ```

       y elige de la lista (o `/model list` en el chat).

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
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
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
    Sí. OpenClaw incluye algunos alias predeterminados (solo se aplican cuando el modelo existe en `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    Si defines tu propio alias con el mismo nombre, tu valor tiene prioridad.

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

    Si haces referencia a un proveedor/modelo pero falta la clave requerida del proveedor, recibirás un error de autenticación en tiempo de ejecución (p. ej., `No API key found for provider "zai"`).

    **No se encontró ninguna clave de API para el proveedor después de agregar un agente nuevo**

    Esto suele significar que el **agente nuevo** tiene un almacén de autenticación vacío. La autenticación es por agente y
    se almacena en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opciones de corrección:

    - Ejecuta `openclaw agents add <id>` y configura la autenticación durante el asistente.
    - O copia solo perfiles `api_key` / `token` estáticos portátiles del almacén de autenticación del agente principal al almacén de autenticación del agente nuevo.
    - Para perfiles OAuth, inicia sesión desde el agente nuevo cuando necesite su propia cuenta; de lo contrario, OpenClaw puede leer a través del agente predeterminado/principal sin clonar tokens de actualización.

    **No** reutilices `agentDir` entre agentes; causa colisiones de autenticación/sesión.

  </Accordion>
</AccordionGroup>

## Conmutación por error de modelos y "Todos los modelos fallaron"

<AccordionGroup>
  <Accordion title="¿Cómo funciona la conmutación por error?">
    La conmutación por error ocurre en dos etapas:

    1. **Rotación de perfiles de autenticación** dentro del mismo proveedor.
    2. **Reserva de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

    Los tiempos de espera se aplican a los perfiles que fallan (retroceso exponencial), por lo que OpenClaw puede seguir respondiendo incluso cuando un proveedor tiene límites de tasa o falla temporalmente.

    El contenedor de límites de tasa incluye más que respuestas `429` simples. OpenClaw
    también trata mensajes como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` y límites periódicos
    de ventanas de uso (`weekly/monthly limit reached`) como límites de tasa que
    justifican conmutación por error.

    Algunas respuestas que parecen de facturación no son `402`, y algunas respuestas HTTP `402`
    también permanecen en ese contenedor transitorio. Si un proveedor devuelve
    texto explícito de facturación en `401` o `403`, OpenClaw aún puede mantenerlo en
    la vía de facturación, pero los detectores de texto específicos del proveedor permanecen acotados al
    proveedor que los posee (por ejemplo, OpenRouter `Key limit exceeded`). Si un mensaje `402`
    en cambio parece una ventana de uso reintentable o
    un límite de gasto de organización/espacio de trabajo (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo trata como
    `rate_limit`, no como una desactivación prolongada de facturación.

    Los errores de desbordamiento de contexto son diferentes: firmas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` u `ollama error: context length
    exceeded` permanecen en la ruta de Compaction/reintento en lugar de avanzar a la
    reserva de modelo.

    El texto genérico de error del servidor es intencionalmente más estrecho que "cualquier cosa con
    unknown/error dentro". OpenClaw sí trata formas transitorias acotadas al proveedor,
    como el `An unknown error occurred` simple de Anthropic, el
    `Provider returned error` simple de OpenRouter, errores de motivo de detención como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) y errores de proveedor ocupado como `ModelNotReadyException` como
    señales de tiempo de espera/sobrecarga que justifican conmutación por error cuando el contexto del proveedor
    coincide.
    El texto genérico de reserva interna como `LLM request failed with an unknown
    error.` se mantiene conservador y no activa por sí solo la reserva de modelo.

  </Accordion>

  <Accordion title='¿Qué significa "No credentials found for profile anthropic:default"?'>
    Significa que el sistema intentó usar el ID de perfil de autenticación `anthropic:default`, pero no pudo encontrar credenciales para él en el almacén de autenticación esperado.

    **Lista de comprobación de corrección:**

    - **Confirma dónde viven los perfiles de autenticación** (rutas nuevas frente a heredadas)
      - Actual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Heredada: `~/.openclaw/agent/*` (migrada por `openclaw doctor`)
    - **Confirma que tu variable de entorno la carga el Gateway**
      - Si defines `ANTHROPIC_API_KEY` en tu shell pero ejecutas el Gateway mediante systemd/launchd, puede que no la herede. Ponla en `~/.openclaw/.env` o habilita `env.shellEnv`.
    - **Asegúrate de estar editando el agente correcto**
      - Las configuraciones multiagente significan que puede haber varios archivos `auth-profiles.json`.
    - **Comprueba de forma básica el estado de modelo/autenticación**
      - Usa `openclaw models status` para ver los modelos configurados y si los proveedores están autenticados.

    **Lista de comprobación de corrección para "No credentials found for profile anthropic"**

    Esto significa que la ejecución está fijada a un perfil de autenticación de Anthropic, pero el Gateway
    no puede encontrarlo en su almacén de autenticación.

    - **Usa Claude CLI**
      - Ejecuta `openclaw models auth login --provider anthropic --method cli --set-default` en el host del gateway.
    - **Si quieres usar una clave de API en su lugar**
      - Pon `ANTHROPIC_API_KEY` en `~/.openclaw/.env` en el **host del gateway**.
      - Borra cualquier orden fijado que fuerce un perfil ausente:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirma que estás ejecutando los comandos en el host del gateway**
      - En modo remoto, los perfiles de autenticación viven en la máquina del gateway, no en tu portátil.

  </Accordion>

  <Accordion title="¿Por qué también intentó usar Google Gemini y falló?">
    Si tu configuración de modelos incluye Google Gemini como reserva (o cambiaste a un alias de Gemini), OpenClaw lo intentará durante la reserva de modelo. Si no has configurado credenciales de Google, verás `No API key found for provider "google"`.

    Corrección: proporciona autenticación de Google o elimina/evita modelos de Google en `agents.defaults.model.fallbacks` / alias para que la reserva no enrute allí.

    **Solicitud LLM rechazada: se requiere firma de pensamiento (Google Antigravity)**

    Causa: el historial de la sesión contiene **bloques de pensamiento sin firmas** (a menudo de
    un flujo abortado/parcial). Google Antigravity requiere firmas para los bloques de pensamiento.

    Corrección: OpenClaw ahora elimina los bloques de pensamiento sin firma para Google Antigravity Claude. Si sigue apareciendo, inicia una **sesión nueva** o define `/thinking off` para ese agente.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo administrarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos OAuth, almacenamiento de tokens, patrones multi-cuenta)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un perfil de autenticación es un registro de credenciales con nombre (OAuth o clave de API) vinculado a un proveedor. Los perfiles viven en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Para inspeccionar perfiles guardados sin volcar secretos, ejecuta `openclaw models auth list` (opcionalmente `--provider <id>` o `--json`). Consulta [CLI de modelos](/es/cli/models#auth-profiles) para obtener detalles.

  </Accordion>

  <Accordion title="¿Cuáles son los ID de perfil típicos?">
    OpenClaw usa ID con prefijo de proveedor como:

    - `anthropic:default` (común cuando no existe identidad de correo electrónico)
    - `anthropic:<email>` para identidades OAuth
    - ID personalizados que eliges (p. ej., `anthropic:work`)

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se intenta primero?">
    Sí. La configuración admite metadatos opcionales para perfiles y un orden por proveedor (`auth.order.<provider>`). Esto **no** almacena secretos; asigna ID a proveedor/modo y establece el orden de rotación.

    OpenClaw puede omitir temporalmente un perfil si está en un **tiempo de espera** breve (límites de tasa/tiempos de espera/fallos de autenticación) o en un estado **deshabilitado** más largo (facturación/créditos insuficientes). Para inspeccionar esto, ejecuta `openclaw models status --json` y revisa `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Los tiempos de espera por límite de tasa pueden estar acotados al modelo. Un perfil que está en espera
    para un modelo aún puede ser utilizable para un modelo hermano en el mismo proveedor,
    mientras que las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil.

    También puedes definir una anulación de orden **por agente** (almacenada en el `auth-state.json` de ese agente) mediante la CLI:

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

    Si se omite un perfil almacenado del orden explícito, la prueba informa
    `excluded_by_auth_order` para ese perfil en lugar de intentarlo silenciosamente.

  </Accordion>

  <Accordion title="OAuth frente a clave de API: ¿cuál es la diferencia?">
    OpenClaw admite ambos:

    - El **inicio de sesión OAuth / CLI** a menudo aprovecha el acceso de suscripción cuando el
      proveedor lo admite. Para Anthropic, el backend Claude CLI de OpenClaw usa
      Claude Code `claude -p`; Anthropic actualmente lo trata como uso de Agent
      SDK/programático, con un crédito mensual separado de Agent SDK a partir del
      15 de junio de 2026.
    - Las **claves de API** usan facturación de pago por token.

    El asistente admite explícitamente Anthropic Claude CLI, OpenAI Codex OAuth y claves de API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [FAQ](/es/help/faq) — la FAQ principal
- [FAQ — inicio rápido y configuración de primera ejecución](/es/help/faq-first-run)
- [Selección de modelo](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
