---
read_when:
    - Elegir o cambiar modelos, configurar alias
    - Depuración de la conmutación por error de modelos / "Todos los modelos fallaron"
    - Comprender los perfiles de autenticación y cómo gestionarlos
sidebarTitle: Models FAQ
summary: 'Preguntas frecuentes: valores predeterminados de los modelos, selección, alias, cambio, conmutación por error y perfiles de autenticación'
title: 'Preguntas frecuentes: modelos y autenticación'
x-i18n:
    generated_at: "2026-05-07T13:18:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  Preguntas y respuestas sobre modelos y perfiles de autenticación. Para configuración, sesiones, Gateway, canales y solución de problemas, consulta la [FAQ](/es/help/faq) principal.

  ## Modelos: valores predeterminados, selección, alias, cambio

  <AccordionGroup>
  <Accordion title='¿Qué es el "modelo predeterminado"?'>
    El modelo predeterminado de OpenClaw es lo que configures como:

    ```
    agents.defaults.model.primary
    ```

    Los modelos se referencian como `provider/model` (ejemplo: `openai/gpt-5.5` o `anthropic/claude-sonnet-4-6`). Si omites el proveedor, OpenClaw primero intenta usar un alias, luego una coincidencia única de proveedor configurado para ese ID exacto de modelo y solo después recurre al proveedor predeterminado configurado como una ruta de compatibilidad obsoleta. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado. Aun así, deberías configurar **explícitamente** `provider/model`.

  </Accordion>

  <Accordion title="¿Qué modelo recomiendas?">
    **Valor predeterminado recomendado:** usa el modelo de última generación más potente disponible en tu conjunto de proveedores.
    **Para agentes con herramientas habilitadas o entrada no confiable:** prioriza la potencia del modelo sobre el coste.
    **Para chat rutinario/de bajo riesgo:** usa modelos alternativos más baratos y enruta por rol del agente.

    MiniMax tiene su propia documentación: [MiniMax](/es/providers/minimax) y
    [Modelos locales](/es/gateway/local-models).

    Regla general: usa el **mejor modelo que puedas permitirte** para trabajos de alto riesgo y un modelo más barato
    para chat rutinario o resúmenes. Puedes enrutar modelos por agente y usar subagentes para
    paralelizar tareas largas (cada subagente consume tokens). Consulta [Modelos](/es/concepts/models) y
    [Subagentes](/es/tools/subagents).

    Advertencia importante: los modelos más débiles o excesivamente cuantizados son más vulnerables a la inyección de prompts
    y a comportamientos inseguros. Consulta [Seguridad](/es/gateway/security).

    Más contexto: [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sin borrar mi configuración?">
    Usa **comandos de modelo** o edita solo los campos de **modelo**. Evita reemplazos completos de configuración.

    Opciones seguras:

    - `/model` en el chat (rápido, por sesión)
    - `openclaw models set ...` (actualiza solo la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - edita `agents.defaults.model` en `~/.openclaw/openclaw.json`

    Evita `config.apply` con un objeto parcial a menos que quieras reemplazar toda la configuración.
    Para ediciones RPC, inspecciona primero con `config.schema.lookup` y prefiere `config.patch`. La carga de lookup te da la ruta normalizada, documentación/restricciones superficiales del esquema y resúmenes inmediatos de los hijos.
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

    - `Cloud + Local` te da modelos en la nube más tus modelos locales de Ollama
    - los modelos en la nube como `kimi-k2.5:cloud` no necesitan descarga local
    - para cambio manual, usa `openclaw models list` y `openclaw models set ollama/<model>`

    Nota de seguridad: los modelos más pequeños o muy cuantizados son más vulnerables a la inyección de prompts.
    Recomendamos encarecidamente **modelos grandes** para cualquier bot que pueda usar herramientas.
    Si aun así quieres modelos pequeños, habilita el aislamiento y listas estrictas de herramientas permitidas.

    Documentación: [Ollama](/es/providers/ollama), [Modelos locales](/es/gateway/local-models),
    [Proveedores de modelos](/es/concepts/model-providers), [Seguridad](/es/gateway/security),
    [Aislamiento](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="¿Qué usan OpenClaw, Flawd y Krill como modelos?">
    - Estos despliegues pueden diferir y cambiar con el tiempo; no hay una recomendación fija de proveedor.
    - Comprueba la configuración de runtime actual en cada Gateway con `openclaw models status`.
    - Para agentes sensibles a seguridad o con herramientas habilitadas, usa el modelo de última generación más potente disponible.

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

    Estos son los alias integrados. Se pueden añadir alias personalizados mediante `agents.defaults.models`.

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

    **¿Cómo quito la fijación de un perfil que configuré con @profile?**

    Vuelve a ejecutar `/model` **sin** el sufijo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si quieres volver al valor predeterminado, selecciónalo desde `/model` (o envía `/model <default provider/model>`).
    Usa `/model status` para confirmar qué perfil de autenticación está activo.

  </Accordion>

  <Accordion title="¿Puedo usar GPT 5.5 para tareas diarias y Codex 5.5 para programación?">
    Sí. Trata la elección del modelo y la elección del runtime por separado:

    - **Agente de programación nativo Codex:** configura `agents.defaults.model.primary` como `openai/gpt-5.5`. Inicia sesión con `openclaw models auth login --provider openai-codex` cuando quieras autenticación de suscripción ChatGPT/Codex.
    - **Tareas directas de la API de OpenAI fuera del bucle del agente:** configura `OPENAI_API_KEY` para imágenes, embeddings, voz, realtime y otras superficies de API de OpenAI que no sean de agente.
    - **Autenticación con clave de API para agente de OpenAI:** usa `/model openai/gpt-5.5` con un perfil de clave de API `openai-codex` ordenado.
    - **Subagentes:** enruta tareas de programación a un agente solo de Codex con su propio modelo y valor predeterminado de `agentRuntime`.

    Consulta [Modelos](/es/concepts/models) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo configuro el modo rápido para GPT 5.5?">
    Usa un conmutador de sesión o un valor predeterminado de configuración:

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

    Para OpenAI, el modo rápido se asigna a `service_tier = "priority"` en solicitudes nativas Responses compatibles. Las anulaciones de sesión `/fast` prevalecen sobre los valores predeterminados de configuración.

    Consulta [Pensamiento y modo rápido](/es/tools/thinking) y [Modo rápido de OpenAI](/es/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='¿Por qué veo "Model ... is not allowed" y luego no hay respuesta?'>
    Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y cualquier
    anulación de sesión. Elegir un modelo que no esté en esa lista devuelve:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ese error se devuelve **en lugar de** una respuesta normal. Solución: añade el modelo a
    `agents.defaults.models`, elimina la lista de permitidos o elige un modelo de `/model list`.
    Si el comando también incluía `--runtime codex`, añade primero el modelo y luego vuelve a intentar
    el mismo comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='¿Por qué veo "Unknown model: minimax/MiniMax-M2.7"?'>
    Esto significa que el **proveedor no está configurado** (no se encontró configuración del proveedor MiniMax ni perfil de autenticación),
    por lo que el modelo no se puede resolver.

    Lista de comprobación para solucionarlo:

    1. Actualiza a una versión actual de OpenClaw (o ejecuta desde `main` en el código fuente) y luego reinicia el Gateway.
    2. Asegúrate de que MiniMax esté configurado (asistente o JSON), o de que la autenticación de MiniMax
       exista en env/perfiles de autenticación para que se pueda inyectar el proveedor correspondiente
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` o OAuth de MiniMax almacenado
       para `minimax-portal`).
    3. Usa el ID exacto del modelo (distingue mayúsculas y minúsculas) para tu ruta de autenticación:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` para la configuración
       con clave de API, o `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para la configuración con OAuth.
    4. Ejecuta:

       ```bash
       openclaw models list
       ```

       y elige de la lista (o `/model list` en el chat).

    Consulta [MiniMax](/es/providers/minimax) y [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar MiniMax como valor predeterminado y OpenAI para tareas complejas?">
    Sí. Usa **MiniMax como valor predeterminado** y cambia de modelo **por sesión** cuando sea necesario.
    Los fallbacks son para **errores**, no para "tareas difíciles", así que usa `/model` o un agente separado.

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

    Entonces:

    ```
    /model gpt
    ```

    **Opción B: agentes separados**

    - Valor predeterminado del agente A: MiniMax
    - Valor predeterminado del agente B: OpenAI
    - Enruta por agente o usa `/agent` para cambiar

    Documentación: [Modelos](/es/concepts/models), [Enrutamiento multiagente](/es/concepts/multi-agent), [MiniMax](/es/providers/minimax), [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title="¿Son opus / sonnet / gpt accesos directos integrados?">
    Sí. OpenClaw incluye algunos atajos predeterminados (solo se aplican cuando el modelo existe en `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si configuras tu propio alias con el mismo nombre, tu valor prevalece.

  </Accordion>

  <Accordion title="¿Cómo defino/anulo accesos directos de modelos (alias)?">
    Los alias vienen de `agents.defaults.models.<modelId>.alias`. Ejemplo:

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

    Entonces `/model sonnet` (o `/<alias>` cuando sea compatible) se resuelve a ese ID de modelo.

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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Si haces referencia a un proveedor/modelo pero falta la clave requerida del proveedor, obtendrás un error de autenticación en tiempo de ejecución (por ejemplo, `No API key found for provider "zai"`).

    **No se encontró ninguna clave API para el proveedor después de agregar un agente nuevo**

    Esto suele significar que el **agente nuevo** tiene un almacén de autenticación vacío. La autenticación es por agente y
    se almacena en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opciones de corrección:

    - Ejecuta `openclaw agents add <id>` y configura la autenticación durante el asistente.
    - O copia únicamente perfiles portátiles estáticos `api_key` / `token` desde el almacén de autenticación del agente principal al almacén de autenticación del agente nuevo.
    - Para perfiles OAuth, inicia sesión desde el agente nuevo cuando necesite su propia cuenta; de lo contrario, OpenClaw puede leer a través del agente predeterminado/principal sin clonar tokens de actualización.

    No reutilices **`agentDir`** entre agentes; causa colisiones de autenticación/sesión.

  </Accordion>
</AccordionGroup>

## Conmutación por error de modelos y "Todos los modelos fallaron"

<AccordionGroup>
  <Accordion title="¿Cómo funciona la conmutación por error?">
    La conmutación por error ocurre en dos etapas:

    1. **Rotación de perfiles de autenticación** dentro del mismo proveedor.
    2. **Respaldo de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

    Los tiempos de espera se aplican a los perfiles que fallan (retroceso exponencial), por lo que OpenClaw puede seguir respondiendo incluso cuando un proveedor tiene límites de frecuencia o falla temporalmente.

    El segmento de límite de frecuencia incluye más que respuestas `429` simples. OpenClaw
    también trata mensajes como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` y límites
    periódicos de ventana de uso (`weekly/monthly limit reached`) como límites
    de frecuencia que justifican la conmutación por error.

    Algunas respuestas con apariencia de facturación no son `402`, y algunas respuestas HTTP `402`
    también permanecen en ese segmento transitorio. Si un proveedor devuelve
    texto explícito de facturación en `401` o `403`, OpenClaw todavía puede mantenerlo en
    la vía de facturación, pero los comparadores de texto específicos del proveedor permanecen limitados al
    proveedor al que pertenecen (por ejemplo, OpenRouter `Key limit exceeded`). Si un mensaje `402`
    en cambio parece una ventana de uso reintentable o un límite de gasto
    de organización/espacio de trabajo (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo trata como
    `rate_limit`, no como una desactivación prolongada por facturación.

    Los errores de desbordamiento de contexto son distintos: firmas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` u `ollama error: context length
    exceeded` permanecen en la ruta de Compaction/reintento en lugar de avanzar al respaldo
    de modelo.

    El texto genérico de error de servidor es intencionalmente más estrecho que "cualquier cosa con
    unknown/error en él". OpenClaw sí trata formas transitorias acotadas por proveedor
    como el `An unknown error occurred` básico de Anthropic, el `Provider returned error`
    básico de OpenRouter, errores de razón de detención como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) y errores de proveedor ocupado como `ModelNotReadyException` como
    señales de tiempo de espera/sobrecarga que justifican la conmutación por error cuando coincide el contexto
    del proveedor.
    El texto genérico de respaldo interno como `LLM request failed with an unknown
    error.` sigue siendo conservador y no activa por sí solo el respaldo de modelo.

  </Accordion>

  <Accordion title='¿Qué significa "No credentials found for profile anthropic:default"?'>
    Significa que el sistema intentó usar el ID de perfil de autenticación `anthropic:default`, pero no pudo encontrar credenciales para él en el almacén de autenticación esperado.

    **Lista de verificación de corrección:**

    - **Confirma dónde residen los perfiles de autenticación** (rutas nuevas frente a heredadas)
      - Actual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Heredada: `~/.openclaw/agent/*` (migrada por `openclaw doctor`)
    - **Confirma que tu variable de entorno la carga el Gateway**
      - Si estableces `ANTHROPIC_API_KEY` en tu shell pero ejecutas el Gateway mediante systemd/launchd, quizá no la herede. Ponla en `~/.openclaw/.env` o habilita `env.shellEnv`.
    - **Asegúrate de estar editando el agente correcto**
      - Las configuraciones multiagente significan que puede haber varios archivos `auth-profiles.json`.
    - **Comprueba de forma básica el estado de modelo/autenticación**
      - Usa `openclaw models status` para ver los modelos configurados y si los proveedores están autenticados.

    **Lista de verificación de corrección para "No credentials found for profile anthropic"**

    Esto significa que la ejecución está fijada a un perfil de autenticación de Anthropic, pero el Gateway
    no puede encontrarlo en su almacén de autenticación.

    - **Usa Claude CLI**
      - Ejecuta `openclaw models auth login --provider anthropic --method cli --set-default` en el host del gateway.
    - **Si quieres usar una clave API en su lugar**
      - Pon `ANTHROPIC_API_KEY` en `~/.openclaw/.env` en el **host del gateway**.
      - Borra cualquier orden fijado que fuerce un perfil faltante:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirma que estás ejecutando comandos en el host del gateway**
      - En modo remoto, los perfiles de autenticación residen en la máquina gateway, no en tu portátil.

  </Accordion>

  <Accordion title="¿Por qué también probó Google Gemini y falló?">
    Si tu configuración de modelos incluye Google Gemini como respaldo (o cambiaste a una forma abreviada de Gemini), OpenClaw lo intentará durante el respaldo de modelo. Si no has configurado credenciales de Google, verás `No API key found for provider "google"`.

    Corrección: proporciona autenticación de Google, o elimina/evita modelos de Google en `agents.defaults.model.fallbacks` / alias para que el respaldo no enrute allí.

    **Solicitud LLM rechazada: se requiere firma de pensamiento (Google Antigravity)**

    Causa: el historial de sesión contiene **bloques de pensamiento sin firmas** (a menudo de
    un flujo abortado/parcial). Google Antigravity requiere firmas para los bloques de pensamiento.

    Corrección: OpenClaw ahora elimina bloques de pensamiento sin firma para Google Antigravity Claude. Si todavía aparece, inicia una **sesión nueva** o establece `/thinking off` para ese agente.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo administrarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos OAuth, almacenamiento de tokens, patrones multicuenta)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un perfil de autenticación es un registro de credenciales con nombre (OAuth o clave API) vinculado a un proveedor. Los perfiles residen en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Para inspeccionar los perfiles guardados sin volcar secretos, ejecuta `openclaw models auth list` (opcionalmente `--provider <id>` o `--json`). Consulta [CLI de modelos](/es/cli/models#auth-profiles) para obtener detalles.

  </Accordion>

  <Accordion title="¿Cuáles son los ID de perfil típicos?">
    OpenClaw usa ID con prefijo de proveedor como:

    - `anthropic:default` (común cuando no existe identidad de correo electrónico)
    - `anthropic:<email>` para identidades OAuth
    - ID personalizados que elijas (por ejemplo, `anthropic:work`)

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se prueba primero?">
    Sí. La configuración admite metadatos opcionales para perfiles y un orden por proveedor (`auth.order.<provider>`). Esto **no** almacena secretos; asigna ID a proveedor/modo y establece el orden de rotación.

    OpenClaw puede omitir temporalmente un perfil si está en un **tiempo de espera** breve (límites de frecuencia/tiempos de espera/fallos de autenticación) o en un estado **deshabilitado** más largo (facturación/créditos insuficientes). Para inspeccionarlo, ejecuta `openclaw models status --json` y revisa `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Los tiempos de espera por límite de frecuencia pueden estar acotados al modelo. Un perfil que está en espera
    para un modelo todavía puede ser usable para un modelo hermano del mismo proveedor,
    mientras que las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil.

    También puedes establecer una anulación de orden **por agente** (almacenada en el `auth-state.json` de ese agente) mediante la CLI:

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

    Si un perfil almacenado se omite del orden explícito, la prueba informa
    `excluded_by_auth_order` para ese perfil en lugar de intentarlo silenciosamente.

  </Accordion>

  <Accordion title="OAuth frente a clave API: ¿cuál es la diferencia?">
    OpenClaw admite ambos:

    - **OAuth** a menudo aprovecha el acceso de suscripción (donde corresponda).
    - Las **claves API** usan facturación por token.

    El asistente admite explícitamente Anthropic Claude CLI, OpenAI Codex OAuth y claves API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Preguntas frecuentes](/es/help/faq) — las preguntas frecuentes principales
- [Preguntas frecuentes — inicio rápido y configuración de primera ejecución](/es/help/faq-first-run)
- [Selección de modelo](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
