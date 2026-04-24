---
read_when:
    - Elegir o cambiar modelos, configurar aliasുകൾ
    - Depurando la conmutación por error de modelos / «Todos los modelos fallaron»
    - Comprender los perfiles de autenticación y cómo gestionarlos
sidebarTitle: Models FAQ
summary: 'Preguntas frecuentes: valores predeterminados de modelos, selección, alias, cambio, conmutación por error y perfiles de autenticación'
title: 'Preguntas frecuentes: modelos y autenticación'
x-i18n:
    generated_at: "2026-04-24T05:32:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  Preguntas y respuestas sobre modelos y perfiles de autenticación. Para configuración, sesiones, gateway, canales y
  solución de problemas, consulta las [Preguntas frecuentes](/es/help/faq) principales.

  ## Modelos: valores predeterminados, selección, alias, cambio

  <AccordionGroup>
  <Accordion title='¿Qué es el "modelo predeterminado"?'>
    El modelo predeterminado de OpenClaw es el que configures como:

    ```
    agents.defaults.model.primary
    ```

    Los modelos se referencian como `provider/model` (ejemplo: `openai/gpt-5.4` o `openai-codex/gpt-5.5`). Si omites el proveedor, OpenClaw primero intenta un alias, luego una coincidencia única de proveedor configurado para ese id exacto de modelo y solo entonces recurre al proveedor predeterminado configurado como una ruta de compatibilidad obsoleta. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado. Aun así, deberías **establecer explícitamente** `provider/model`.

  </Accordion>

  <Accordion title="¿Qué modelo recomiendas?">
    **Predeterminado recomendado:** usa el modelo más potente y de última generación disponible en tu pila de proveedores.
    **Para agentes con herramientas o con entradas no confiables:** prioriza la potencia del modelo sobre el costo.
    **Para chat rutinario o de bajo riesgo:** usa modelos de reserva más baratos y enruta por rol del agente.

    MiniMax tiene su propia documentación: [MiniMax](/es/providers/minimax) y
    [Modelos locales](/es/gateway/local-models).

    Regla general: usa el **mejor modelo que puedas permitirte** para trabajos de alto riesgo, y un modelo más barato
    para chat rutinario o resúmenes. Puedes enrutar modelos por agente y usar subagentes para
    paralelizar tareas largas (cada subagente consume tokens). Consulta [Models](/es/concepts/models) y
    [Sub-agents](/es/tools/subagents).

    Advertencia importante: los modelos más débiles o sobrecuantizados son más vulnerables a la
    inyección de prompts y a comportamientos inseguros. Consulta [Seguridad](/es/gateway/security).

    Más contexto: [Models](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sin borrar mi configuración?">
    Usa **comandos de modelo** o edita solo los campos de **modelo**. Evita reemplazos completos de configuración.

    Opciones seguras:

    - `/model` en chat (rápido, por sesión)
    - `openclaw models set ...` (actualiza solo la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - editar `agents.defaults.model` en `~/.openclaw/openclaw.json`

    Evita `config.apply` con un objeto parcial a menos que tengas la intención de reemplazar toda la configuración.
    Para ediciones por RPC, inspecciona primero con `config.schema.lookup` y prefiere `config.patch`. La carga útil de búsqueda te da la ruta normalizada, documentación/restricciones superficiales del esquema y resúmenes inmediatos de hijos.
    para actualizaciones parciales.
    Si sobrescribiste la configuración, restaura desde una copia de seguridad o vuelve a ejecutar `openclaw doctor` para repararla.

    Documentación: [Models](/es/concepts/models), [Configure](/es/cli/configure), [Config](/es/cli/config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Puedo usar modelos autoalojados (llama.cpp, vLLM, Ollama)?">
    Sí. Ollama es la vía más sencilla para modelos locales.

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

    Nota de seguridad: los modelos más pequeños o muy cuantizados son más vulnerables a la
    inyección de prompts. Recomendamos encarecidamente **modelos grandes** para cualquier bot que pueda usar herramientas.
    Si aun así quieres modelos pequeños, habilita sandboxing y listas de permitidos estrictas para herramientas.

    Documentación: [Ollama](/es/providers/ollama), [Modelos locales](/es/gateway/local-models),
    [Proveedores de modelos](/es/concepts/model-providers), [Seguridad](/es/gateway/security),
    [Sandboxing](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="¿Qué usan OpenClaw, Flawd y Krill como modelos?">
    - Estas implementaciones pueden diferir y cambiar con el tiempo; no hay una recomendación fija de proveedor.
    - Revisa la configuración actual en tiempo de ejecución en cada gateway con `openclaw models status`.
    - Para agentes sensibles a la seguridad o con herramientas, usa el modelo más potente y de última generación disponible.
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

    `/model` (y `/model list`) muestra un selector compacto numerado. Selecciona por número:

    ```
    /model 3
    ```

    También puedes forzar un perfil de autenticación específico para el proveedor (por sesión):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Consejo: `/model status` muestra qué agente está activo, qué archivo `auth-profiles.json` se está usando y qué perfil de autenticación se probará a continuación.
    También muestra el endpoint del proveedor configurado (`baseUrl`) y el modo API (`api`) cuando están disponibles.

    **¿Cómo quito la fijación de un perfil que establecí con @profile?**

    Vuelve a ejecutar `/model` **sin** el sufijo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si quieres volver al valor predeterminado, selecciónalo desde `/model` (o envía `/model <provider/model predeterminado>`).
    Usa `/model status` para confirmar qué perfil de autenticación está activo.

  </Accordion>

  <Accordion title="¿Puedo usar GPT 5.5 para tareas diarias y Codex 5.5 para programación?">
    Sí. Establece uno como predeterminado y cambia según necesites:

    - **Cambio rápido (por sesión):** `/model openai/gpt-5.4` para tareas actuales con clave API directa de OpenAI o `/model openai-codex/gpt-5.5` para tareas OAuth de GPT-5.5 Codex.
    - **Predeterminado:** establece `agents.defaults.model.primary` en `openai/gpt-5.4` para uso con clave API o `openai-codex/gpt-5.5` para uso OAuth de GPT-5.5 Codex.
    - **Subagentes:** enruta tareas de programación a subagentes con un modelo predeterminado distinto.

    El acceso directo con clave API a `openai/gpt-5.5` es compatible una vez que OpenAI habilite
    GPT-5.5 en la API pública. Hasta entonces, GPT-5.5 es solo por suscripción/OAuth.

    Consulta [Models](/es/concepts/models) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo configuro el modo rápido para GPT 5.5?">
    Usa un interruptor de sesión o un valor predeterminado en la configuración:

    - **Por sesión:** envía `/fast on` mientras la sesión usa `openai/gpt-5.4` o `openai-codex/gpt-5.5`.
    - **Predeterminado por modelo:** establece `agents.defaults.models["openai/gpt-5.4"].params.fastMode` o `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` en `true`.

    Ejemplo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Para OpenAI, el modo rápido se asigna a `service_tier = "priority"` en solicitudes nativas compatibles de Responses. Las anulaciones de sesión con `/fast` prevalecen sobre los valores predeterminados de configuración.

    Consulta [Thinking y modo rápido](/es/tools/thinking) y [Modo rápido de OpenAI](/es/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='¿Por qué veo "Model ... is not allowed" y luego no hay respuesta?'>
    Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y cualquier
    anulación de sesión. Elegir un modelo que no esté en esa lista devuelve:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ese error se devuelve **en lugar de** una respuesta normal. Solución: añade el modelo a
    `agents.defaults.models`, elimina la lista de permitidos o elige un modelo desde `/model list`.

  </Accordion>

  <Accordion title='¿Por qué veo "Unknown model: minimax/MiniMax-M2.7"?'>
    Esto significa que el **proveedor no está configurado** (no se encontró ninguna configuración ni perfil de
    autenticación de MiniMax), así que el modelo no puede resolverse.

    Lista de comprobación para solucionarlo:

    1. Actualiza a una versión actual de OpenClaw (o ejecuta desde la rama `main`), luego reinicia el gateway.
    2. Asegúrate de que MiniMax esté configurado (asistente o JSON), o de que exista autenticación
       de MiniMax en el entorno/perfiles de autenticación para que pueda inyectarse el proveedor correspondiente
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` o OAuth de MiniMax
       almacenado para `minimax-portal`).
    3. Usa el id exacto del modelo (distingue mayúsculas y minúsculas) para tu ruta de autenticación:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` para
       configuración con clave API, o `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuración con OAuth.
    4. Ejecuta:

       ```bash
       openclaw models list
       ```

       y elige de la lista (o `/model list` en el chat).

    Consulta [MiniMax](/es/providers/minimax) y [Models](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar MiniMax como predeterminado y OpenAI para tareas complejas?">
    Sí. Usa **MiniMax como predeterminado** y cambia de modelo **por sesión** cuando sea necesario.
    Las reservas son para **errores**, no para “tareas difíciles”, así que usa `/model` o un agente separado.

    **Opción A: cambiar por sesión**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
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

    - Agente A predeterminado: MiniMax
    - Agente B predeterminado: OpenAI
    - Enruta por agente o usa `/agent` para cambiar

    Documentación: [Models](/es/concepts/models), [Enrutamiento multiagente](/es/concepts/multi-agent), [MiniMax](/es/providers/minimax), [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title="¿Son opus / sonnet / gpt accesos directos integrados?">
    Sí. OpenClaw incluye algunos atajos predeterminados (solo se aplican cuando el modelo existe en `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4` para configuraciones con clave API, o `openai-codex/gpt-5.5` cuando está configurado para OAuth de Codex
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si estableces tu propio alias con el mismo nombre, prevalece tu valor.

  </Accordion>

  <Accordion title="¿Cómo defino o anulo atajos de modelo (alias)?">
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

    Luego `/model sonnet` (o `/<alias>` cuando se admita) se resuelve a ese id de modelo.

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

    **No se encontró clave de API para el proveedor después de añadir un nuevo agente**

    Esto normalmente significa que el **nuevo agente** tiene un almacén de autenticación vacío. La autenticación es por agente y
    se almacena en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opciones para solucionarlo:

    - Ejecuta `openclaw agents add <id>` y configura la autenticación durante el asistente.
    - O copia `auth-profiles.json` desde `agentDir` del agente principal al `agentDir` del nuevo agente.

    **No** reutilices `agentDir` entre agentes; provoca colisiones de autenticación/sesión.

  </Accordion>
</AccordionGroup>

## Conmutación por error de modelos y "Todos los modelos fallaron"

<AccordionGroup>
  <Accordion title="¿Cómo funciona la conmutación por error?">
    La conmutación por error ocurre en dos etapas:

    1. **Rotación de perfiles de autenticación** dentro del mismo proveedor.
    2. **Reserva de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

    Los periodos de enfriamiento se aplican a los perfiles que fallan (retroceso exponencial), por lo que OpenClaw puede seguir respondiendo incluso cuando un proveedor está limitado por tasa o falla temporalmente.

    El grupo de límites de tasa incluye más que simples respuestas `429`. OpenClaw
    también trata mensajes como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` y límites
    periódicos de ventana de uso (`weekly/monthly limit reached`) como
    límites de tasa aptos para conmutación por error.

    Algunas respuestas con apariencia de facturación no son `402`, y algunas
    respuestas HTTP `402` también permanecen en ese grupo transitorio. Si un proveedor devuelve
    texto explícito de facturación en `401` o `403`, OpenClaw aún puede mantenerlo en
    la vía de facturación, pero los comparadores de texto específicos del proveedor siguen limitados al
    proveedor al que pertenecen (por ejemplo, OpenRouter `Key limit exceeded`). Si un mensaje `402`
    en cambio parece un límite de ventana de uso reintentable o un límite
    de gasto de organización/espacio de trabajo (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo trata como
    `rate_limit`, no como una deshabilitación larga por facturación.

    Los errores de desbordamiento de contexto son distintos: firmas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` u `ollama error: context length
    exceeded` permanecen en la ruta de Compaction/reintento en lugar de avanzar la
    reserva de modelo.

    El texto genérico de error del servidor es intencionadamente más limitado que “cualquier cosa con
    unknown/error”. OpenClaw sí trata formas transitorias delimitadas por proveedor
    como `An unknown error occurred` simple de Anthropic, `Provider returned error` simple de OpenRouter,
    errores de motivo de parada como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) y errores de proveedor ocupado como `ModelNotReadyException` como
    señales de tiempo de espera/sobrecarga aptas para conmutación por error cuando el contexto del proveedor
    coincide.
    El texto genérico de reserva interna como `LLM request failed with an unknown
    error.` permanece conservador y no activa por sí solo la conmutación por error de modelo.

  </Accordion>

  <Accordion title='¿Qué significa "No credentials found for profile anthropic:default"?'>
    Significa que el sistema intentó usar el ID de perfil de autenticación `anthropic:default`, pero no pudo encontrar credenciales para él en el almacén de autenticación esperado.

    **Lista de comprobación para solucionarlo:**

    - **Confirma dónde viven los perfiles de autenticación** (rutas nuevas frente a heredadas)
      - Actual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Heredada: `~/.openclaw/agent/*` (migrada por `openclaw doctor`)
    - **Confirma que tu variable de entorno la carga el Gateway**
      - Si estableces `ANTHROPIC_API_KEY` en tu shell pero ejecutas el Gateway mediante systemd/launchd, puede que no la herede. Ponla en `~/.openclaw/.env` o habilita `env.shellEnv`.
    - **Asegúrate de estar editando el agente correcto**
      - Las configuraciones con varios agentes significan que puede haber varios archivos `auth-profiles.json`.
    - **Haz una comprobación rápida del estado de modelo/autenticación**
      - Usa `openclaw models status` para ver los modelos configurados y si los proveedores están autenticados.

    **Lista de comprobación para solucionar "No credentials found for profile anthropic"**

    Esto significa que la ejecución está fijada a un perfil de autenticación de Anthropic, pero el Gateway
    no puede encontrarlo en su almacén de autenticación.

    - **Usa Claude CLI**
      - Ejecuta `openclaw models auth login --provider anthropic --method cli --set-default` en el host del gateway.
    - **Si quieres usar una clave de API en su lugar**
      - Pon `ANTHROPIC_API_KEY` en `~/.openclaw/.env` en el **host del gateway**.
      - Borra cualquier orden fijado que fuerce un perfil inexistente:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirma que estás ejecutando los comandos en el host del gateway**
      - En modo remoto, los perfiles de autenticación viven en la máquina del gateway, no en tu portátil.

  </Accordion>

  <Accordion title="¿Por qué también intentó Google Gemini y falló?">
    Si la configuración de tu modelo incluye Google Gemini como reserva (o cambiaste a un alias abreviado de Gemini), OpenClaw lo intentará durante la reserva de modelo. Si no has configurado credenciales de Google, verás `No API key found for provider "google"`.

    Solución: proporciona autenticación de Google o elimina/evita modelos de Google en `agents.defaults.model.fallbacks` / alias para que la reserva no se enrute ahí.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: el historial de la sesión contiene **bloques de thinking sin firmas** (a menudo de
    un stream abortado o parcial). Google Antigravity requiere firmas para los bloques de thinking.

    Solución: OpenClaw ahora elimina bloques de thinking sin firma para Claude de Google Antigravity. Si sigue apareciendo, inicia una **nueva sesión** o establece `/thinking off` para ese agente.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo gestionarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos OAuth, almacenamiento de tokens, patrones de varias cuentas)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un perfil de autenticación es un registro de credenciales con nombre (OAuth o clave de API) vinculado a un proveedor. Los perfiles viven en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="¿Cuáles son los ID de perfil típicos?">
    OpenClaw usa ID con prefijo de proveedor como:

    - `anthropic:default` (habitual cuando no existe identidad de correo electrónico)
    - `anthropic:<email>` para identidades OAuth
    - ID personalizados que elijas (por ejemplo `anthropic:work`)

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se prueba primero?">
    Sí. La configuración admite metadatos opcionales para perfiles y un orden por proveedor (`auth.order.<provider>`). Esto **no** almacena secretos; asigna ID a proveedor/modo y establece el orden de rotación.

    OpenClaw puede omitir temporalmente un perfil si está en un **periodo de enfriamiento** corto (límites de tasa/tiempos de espera/fallos de autenticación) o en un estado **deshabilitado** más largo (facturación/créditos insuficientes). Para inspeccionarlo, ejecuta `openclaw models status --json` y revisa `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Los periodos de enfriamiento por límite de tasa pueden tener alcance por modelo. Un perfil que está en enfriamiento
    para un modelo aún puede ser utilizable para un modelo hermano del mismo proveedor,
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

    Para verificar lo que realmente se probará, usa:

    ```bash
    openclaw models status --probe
    ```

    Si se omite un perfil almacenado del orden explícito, el sondeo informa
    `excluded_by_auth_order` para ese perfil en lugar de intentarlo silenciosamente.

  </Accordion>

  <Accordion title="OAuth frente a clave de API: ¿cuál es la diferencia?">
    OpenClaw admite ambos:

    - **OAuth** a menudo aprovecha el acceso por suscripción (cuando corresponde).
    - **Las claves de API** usan facturación por token.

    El asistente admite explícitamente Anthropic Claude CLI, OAuth de OpenAI Codex y claves de API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Preguntas frecuentes](/es/help/faq) — las preguntas frecuentes principales
- [Preguntas frecuentes — inicio rápido y configuración de primera ejecución](/es/help/faq-first-run)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
