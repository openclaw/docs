---
read_when:
    - Elegir o cambiar modelos, configurar alias
    - Depuración de la conmutación por error de modelos / "Todos los modelos fallaron"
    - Comprender los perfiles de autenticación y cómo gestionarlos
sidebarTitle: Models FAQ
summary: 'Preguntas frecuentes: valores predeterminados de modelos, selección, alias, cambio, conmutación por error y perfiles de autenticación'
title: 'Preguntas frecuentes: modelos y autenticación'
x-i18n:
    generated_at: "2026-04-30T05:45:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  Preguntas y respuestas sobre modelos y perfiles de autenticación. Para configuración, sesiones, gateway, canales y solución de problemas, consulta la [FAQ](/es/help/faq) principal.

  ## Modelos: valores predeterminados, selección, alias, cambio

  <AccordionGroup>
  <Accordion title='¿Qué es el "modelo predeterminado"?'>
    El modelo predeterminado de OpenClaw es lo que configures como:

    ```
    agents.defaults.model.primary
    ```

    Los modelos se referencian como `provider/model` (ejemplo: `openai/gpt-5.5` u `openai-codex/gpt-5.5`). Si omites el proveedor, OpenClaw primero intenta usar un alias, luego una coincidencia única de proveedor configurado para ese identificador exacto de modelo, y solo entonces recurre al proveedor predeterminado configurado como ruta de compatibilidad obsoleta. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de proveedor eliminado. Aun así, deberías configurar `provider/model` **explícitamente**.

  </Accordion>

  <Accordion title="¿Qué modelo recomiendas?">
    **Valor predeterminado recomendado:** usa el modelo de generación más reciente y más potente disponible en tu pila de proveedores.
    **Para agentes con herramientas habilitadas o entradas no confiables:** prioriza la potencia del modelo sobre el costo.
    **Para chat rutinario o de bajo riesgo:** usa modelos de respaldo más baratos y enruta por rol de agente.

    MiniMax tiene su propia documentación: [MiniMax](/es/providers/minimax) y
    [Modelos locales](/es/gateway/local-models).

    Regla general: usa el **mejor modelo que puedas permitirte** para trabajo de alto riesgo, y un modelo más barato
    para chat rutinario o resúmenes. Puedes enrutar modelos por agente y usar subagentes para
    paralelizar tareas largas (cada subagente consume tokens). Consulta [Modelos](/es/concepts/models) y
    [Subagentes](/es/tools/subagents).

    Advertencia importante: los modelos más débiles o sobrecuantizados son más vulnerables a la inyección de prompts
    y al comportamiento inseguro. Consulta [Seguridad](/es/gateway/security).

    Más contexto: [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sin borrar mi configuración?">
    Usa **comandos de modelo** o edita solo los campos de **modelo**. Evita reemplazar toda la configuración.

    Opciones seguras:

    - `/model` en el chat (rápido, por sesión)
    - `openclaw models set ...` (actualiza solo la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - edita `agents.defaults.model` en `~/.openclaw/openclaw.json`

    Evita usar `config.apply` con un objeto parcial a menos que quieras reemplazar toda la configuración.
    Para ediciones RPC, inspecciona primero con `config.schema.lookup` y prefiere `config.patch`. La carga de búsqueda te da la ruta normalizada, documentación/restricciones superficiales del esquema y resúmenes inmediatos de los elementos secundarios.
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
    - los modelos en la nube como `kimi-k2.5:cloud` no necesitan una descarga local
    - para el cambio manual, usa `openclaw models list` y `openclaw models set ollama/<model>`

    Nota de seguridad: los modelos más pequeños o fuertemente cuantizados son más vulnerables a la inyección de prompts.
    Recomendamos firmemente **modelos grandes** para cualquier bot que pueda usar herramientas.
    Si aun así quieres modelos pequeños, habilita el aislamiento y listas estrictas de herramientas permitidas.

    Documentación: [Ollama](/es/providers/ollama), [Modelos locales](/es/gateway/local-models),
    [Proveedores de modelos](/es/concepts/model-providers), [Seguridad](/es/gateway/security),
    [Aislamiento](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="¿Qué usan OpenClaw, Flawd y Krill como modelos?">
    - Estas implementaciones pueden diferir y cambiar con el tiempo; no hay una recomendación fija de proveedor.
    - Comprueba la configuración de ejecución actual en cada gateway con `openclaw models status`.
    - Para agentes sensibles a la seguridad o con herramientas habilitadas, usa el modelo de generación más reciente y más potente disponible.

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

    **¿Cómo desanclo un perfil que configuré con @profile?**

    Vuelve a ejecutar `/model` **sin** el sufijo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si quieres volver al valor predeterminado, selecciónalo desde `/model` (o envía `/model <default provider/model>`).
    Usa `/model status` para confirmar qué perfil de autenticación está activo.

  </Accordion>

  <Accordion title="¿Puedo usar GPT 5.5 para tareas diarias y Codex 5.5 para programación?">
    Sí. Configura uno como predeterminado y cambia según sea necesario:

    - **Cambio rápido (por sesión):** `/model openai/gpt-5.5` para las tareas actuales con clave de API directa de OpenAI o `/model openai-codex/gpt-5.5` para tareas de GPT-5.5 Codex OAuth.
    - **Predeterminado:** configura `agents.defaults.model.primary` como `openai/gpt-5.5` para uso con clave de API o `openai-codex/gpt-5.5` para uso con GPT-5.5 Codex OAuth.
    - **Subagentes:** enruta tareas de programación a subagentes con un modelo predeterminado diferente.

    Consulta [Modelos](/es/concepts/models) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo configuro el modo rápido para GPT 5.5?">
    Usa un alternador de sesión o un valor predeterminado de configuración:

    - **Por sesión:** envía `/fast on` mientras la sesión usa `openai/gpt-5.5` u `openai-codex/gpt-5.5`.
    - **Valor predeterminado por modelo:** configura `agents.defaults.models["openai/gpt-5.5"].params.fastMode` o `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` como `true`.

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

    Para OpenAI, el modo rápido se asigna a `service_tier = "priority"` en solicitudes nativas de Responses compatibles. Las anulaciones de sesión con `/fast` tienen prioridad sobre los valores predeterminados de configuración.

    Consulta [Razonamiento y modo rápido](/es/tools/thinking) y [Modo rápido de OpenAI](/es/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='¿Por qué veo "Model ... is not allowed" y luego no hay respuesta?'>
    Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y cualquier
    anulación de sesión. Elegir un modelo que no esté en esa lista devuelve:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ese error se devuelve **en lugar de** una respuesta normal. Corrección: añade el modelo a
    `agents.defaults.models`, elimina la lista de permitidos o elige un modelo desde `/model list`.

  </Accordion>

  <Accordion title='¿Por qué veo "Unknown model: minimax/MiniMax-M2.7"?'>
    Esto significa que el **proveedor no está configurado** (no se encontró configuración de proveedor MiniMax ni perfil de autenticación),
    por lo que el modelo no puede resolverse.

    Lista de verificación para corregirlo:

    1. Actualiza a una versión actual de OpenClaw (o ejecuta desde el código fuente `main`) y luego reinicia el gateway.
    2. Asegúrate de que MiniMax esté configurado (asistente o JSON), o de que la autenticación de MiniMax
       exista en env/perfiles de autenticación para que pueda inyectarse el proveedor coincidente
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` u OAuth de MiniMax almacenado
       para `minimax-portal`).
    3. Usa el identificador exacto del modelo (distingue mayúsculas y minúsculas) para tu ruta de autenticación:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` para configuración
       con clave de API, o `minimax-portal/MiniMax-M2.7` /
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
    - `gpt` → `openai/gpt-5.5` para configuraciones con clave de API, u `openai-codex/gpt-5.5` cuando está configurado para Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si configuras tu propio alias con el mismo nombre, tu valor tiene prioridad.

  </Accordion>

  <Accordion title="¿Cómo defino/anulo atajos de modelo (alias)?">
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

    **No se encontró ninguna clave de API para el proveedor después de agregar un agente nuevo**

    Esto suele significar que el **agente nuevo** tiene un almacén de autenticación vacío. La autenticación es por agente y
    se almacena en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opciones de corrección:

    - Ejecuta `openclaw agents add <id>` y configura la autenticación durante el asistente.
    - O copia solo perfiles `api_key` / `token` estáticos portables del almacén de autenticación del agente principal al almacén de autenticación del agente nuevo.
    - Para perfiles OAuth, inicia sesión desde el agente nuevo cuando necesite su propia cuenta; de lo contrario, OpenClaw puede leer desde el agente predeterminado/principal sin clonar tokens de actualización.

    **No** reutilices `agentDir` entre agentes; provoca colisiones de autenticación/sesión.

  </Accordion>
</AccordionGroup>

## Conmutación por error de modelos y "Todos los modelos fallaron"

<AccordionGroup>
  <Accordion title="¿Cómo funciona la conmutación por error?">
    La conmutación por error ocurre en dos etapas:

    1. **Rotación de perfiles de autenticación** dentro del mismo proveedor.
    2. **Reserva de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

    Los tiempos de espera se aplican a los perfiles que fallan (retroceso exponencial), por lo que OpenClaw puede seguir respondiendo incluso cuando un proveedor está limitado por tasa o falla temporalmente.

    El contenedor de límite de tasa incluye más que respuestas `429` simples. OpenClaw
    también trata mensajes como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` y límites periódicos
    de ventanas de uso (`weekly/monthly limit reached`) como límites de tasa
    que ameritan conmutación por error.

    Algunas respuestas que parecen de facturación no son `402`, y algunas respuestas HTTP `402`
    también permanecen en ese contenedor transitorio. Si un proveedor devuelve
    texto explícito de facturación en `401` o `403`, OpenClaw aún puede mantenerlo
    en la vía de facturación, pero los comparadores de texto específicos del proveedor permanecen acotados al
    proveedor al que pertenecen (por ejemplo, OpenRouter `Key limit exceeded`). Si un mensaje `402`
    en cambio parece una ventana de uso reintentable o
    un límite de gasto de organización/espacio de trabajo (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo trata como
    `rate_limit`, no como una deshabilitación prolongada por facturación.

    Los errores de desbordamiento de contexto son diferentes: firmas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` u `ollama error: context length
    exceeded` permanecen en la ruta de Compaction/reintento en lugar de avanzar a la reserva de
    modelo.

    El texto genérico de error del servidor es intencionalmente más estrecho que "cualquier cosa con
    unknown/error". OpenClaw sí trata formas transitorias acotadas al proveedor
    como el `An unknown error occurred` básico de Anthropic, el
    `Provider returned error` básico de OpenRouter, errores de motivo de detención como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) y errores de proveedor ocupado como `ModelNotReadyException` como
    señales de tiempo de espera/sobrecarga que ameritan conmutación por error cuando coincide el contexto del
    proveedor.
    El texto genérico interno de reserva como `LLM request failed with an unknown
    error.` se mantiene conservador y no activa la reserva de modelo por sí solo.

  </Accordion>

  <Accordion title='¿Qué significa "No credentials found for profile anthropic:default"?'>
    Significa que el sistema intentó usar el ID de perfil de autenticación `anthropic:default`, pero no pudo encontrar credenciales para él en el almacén de autenticación esperado.

    **Lista de comprobación de corrección:**

    - **Confirma dónde viven los perfiles de autenticación** (rutas nuevas frente a heredadas)
      - Actual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Heredada: `~/.openclaw/agent/*` (migrada por `openclaw doctor`)
    - **Confirma que tu variable de entorno está cargada por el Gateway**
      - Si configuras `ANTHROPIC_API_KEY` en tu shell pero ejecutas el Gateway mediante systemd/launchd, puede que no la herede. Ponla en `~/.openclaw/.env` o habilita `env.shellEnv`.
    - **Asegúrate de estar editando el agente correcto**
      - Las configuraciones multiagente implican que puede haber varios archivos `auth-profiles.json`.
    - **Comprueba rápidamente el estado de modelo/autenticación**
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
      - En modo remoto, los perfiles de autenticación viven en la máquina gateway, no en tu portátil.

  </Accordion>

  <Accordion title="¿Por qué también probó Google Gemini y falló?">
    Si tu configuración de modelos incluye Google Gemini como reserva (o cambiaste a una abreviatura de Gemini), OpenClaw lo probará durante la reserva de modelo. Si no has configurado credenciales de Google, verás `No API key found for provider "google"`.

    Corrección: proporciona autenticación de Google o elimina/evita modelos de Google en `agents.defaults.model.fallbacks` / alias para que la reserva no enrute allí.

    **Solicitud de LLM rechazada: se requiere firma de pensamiento (Google Antigravity)**

    Causa: el historial de la sesión contiene **bloques de pensamiento sin firmas** (a menudo de
    un flujo abortado/parcial). Google Antigravity requiere firmas para los bloques de pensamiento.

    Corrección: OpenClaw ahora elimina bloques de pensamiento sin firma para Google Antigravity Claude. Si todavía aparece, inicia una **sesión nueva** o configura `/thinking off` para ese agente.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo gestionarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos OAuth, almacenamiento de tokens, patrones de varias cuentas)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un perfil de autenticación es un registro de credenciales con nombre (OAuth o clave de API) asociado a un proveedor. Los perfiles viven en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="¿Cuáles son los ID de perfil típicos?">
    OpenClaw usa ID con prefijo de proveedor como:

    - `anthropic:default` (común cuando no existe identidad de correo electrónico)
    - `anthropic:<email>` para identidades OAuth
    - ID personalizados que elijas (por ejemplo, `anthropic:work`)

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se prueba primero?">
    Sí. La configuración admite metadatos opcionales para perfiles y un orden por proveedor (`auth.order.<provider>`). Esto **no** almacena secretos; asigna ID a proveedor/modo y establece el orden de rotación.

    OpenClaw puede omitir temporalmente un perfil si está en un **tiempo de espera** corto (límites de tasa/tiempos de espera/fallos de autenticación) o en un estado **deshabilitado** más largo (facturación/créditos insuficientes). Para inspeccionarlo, ejecuta `openclaw models status --json` y revisa `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Los tiempos de espera de límite de tasa pueden estar acotados por modelo. Un perfil que está en tiempo de espera
    para un modelo aún puede ser utilizable para un modelo hermano en el mismo proveedor,
    mientras que las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil.

    También puedes configurar una anulación de orden **por agente** (almacenada en el `auth-state.json` de ese agente) mediante la CLI:

    ```bash
    # Predeterminado al agente predeterminado configurado (omite --agent)
    openclaw models auth order get --provider anthropic

    # Bloquear la rotación a un solo perfil (probar solo este)
    openclaw models auth order set --provider anthropic anthropic:default

    # O establecer un orden explícito (reserva dentro del proveedor)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Borrar anulación (volver a config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para apuntar a un agente específico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Para verificar qué se probará realmente, usa:

    ```bash
    openclaw models status --probe
    ```

    Si se omite un perfil almacenado del orden explícito, la sonda informa
    `excluded_by_auth_order` para ese perfil en lugar de probarlo silenciosamente.

  </Accordion>

  <Accordion title="OAuth frente a clave de API: ¿cuál es la diferencia?">
    OpenClaw admite ambos:

    - **OAuth** suele aprovechar el acceso de suscripción (cuando corresponde).
    - **Las claves de API** usan facturación de pago por token.

    El asistente admite explícitamente Anthropic Claude CLI, OpenAI Codex OAuth y claves de API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Preguntas frecuentes](/es/help/faq) — las preguntas frecuentes principales
- [Preguntas frecuentes — inicio rápido y configuración inicial](/es/help/faq-first-run)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
