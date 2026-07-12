---
read_when:
    - Necesita una referencia de configuración de modelos para cada proveedor
    - Quieres configuraciones de ejemplo o comandos de incorporación de la CLI para proveedores de modelos
sidebarTitle: Model providers
summary: Descripción general de proveedores de modelos con configuraciones de ejemplo y flujos de la CLI
title: Proveedores de modelos
x-i18n:
    generated_at: "2026-07-12T14:25:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20477f9f6c8c616b4eca6653a29e0e8c9ffe5049ddfed91c585e9e22cdb669a2
    source_path: concepts/model-providers.md
    workflow: 16
---

Referencia para **proveedores de LLM/modelos** (no canales de chat como WhatsApp/Telegram). Para consultar las reglas de selección de modelos, véase [Modelos](/es/concepts/models).

## Reglas rápidas

<AccordionGroup>
  <Accordion title="Referencias de modelos y utilidades de la CLI">
    - Las referencias de modelos usan `provider/model` (ejemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` actúa como lista de permitidos cuando se configura.
    - Utilidades de la CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` establecen los valores predeterminados del proveedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` los sobrescriben por modelo.
    - Reglas de conmutación por error, sondeos durante el período de espera y persistencia de sobrescrituras de sesión: [Conmutación por error de modelos](/es/concepts/model-failover).

  </Accordion>
  <Accordion title="Añadir autenticación de un proveedor no cambia el modelo principal">
    `openclaw configure` conserva el valor existente de `agents.defaults.model.primary` al añadir o volver a autenticar un proveedor. `openclaw models auth login` hace lo mismo, salvo que se proporcione `--set-default`. Los plugins de proveedores aún pueden devolver un modelo predeterminado recomendado en su parche de configuración de autenticación, pero, cuando ya existe un modelo principal, OpenClaw lo interpreta como «hacer que este modelo esté disponible», no como «reemplazar el modelo principal actual».

    Para cambiar intencionadamente el modelo predeterminado, use `openclaw models set <provider/model>` o `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Separación entre proveedor y entorno de ejecución de OpenAI">
    Las referencias de modelos de OpenAI y los entornos de ejecución de agentes son independientes:

    - `openai/<model>` selecciona el proveedor y el modelo canónicos de OpenAI. El prefijo por sí solo nunca selecciona Codex.
    - Si la política de entorno de ejecución del proveedor/modelo no está configurada o es `auto`, OpenAI puede seleccionar Codex implícitamente solo para una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin ninguna sobrescritura de solicitud definida.
    - Los adaptadores de Completions definidos, los endpoints personalizados y las rutas con comportamiento de solicitud definido permanecen en OpenClaw. Se rechazan los endpoints HTTP oficiales sin cifrar.
    - Las referencias antiguas de modelos de Codex son configuración heredada que doctor reescribe como `openai/<model>`.
    - El valor `agentRuntime.id: "openclaw"` del proveedor/modelo mantiene explícitamente en OpenClaw una ruta que, de otro modo, sería apta. `agentRuntime.id: "codex"` requiere Codex y falla de forma cerrada cuando la ruta efectiva no es compatible con Codex.

    Véanse [Entorno de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime) y [Entorno de pruebas de Codex](/es/plugins/codex-harness). Si la separación entre proveedor y entorno de ejecución resulta confusa, consulte primero [Entornos de ejecución de agentes](/es/concepts/agent-runtimes).

    La activación automática de plugins sigue el mismo límite: una ruta efectiva implícitamente compatible con Codex puede habilitar el plugin de Codex, mientras que el valor explícito `agentRuntime.id: "codex"` del proveedor/modelo o las referencias heredadas `codex/<model>` lo requieren. Un prefijo `openai/*` por sí solo no lo hace.

    La configuración nueva de OpenAI usa una referencia de GPT-5.6 específica de la ruta: la configuración mediante clave de API selecciona
    `openai/gpt-5.6` (el id básico de la API directa se resuelve como Sol), mientras que
    OAuth de ChatGPT/Codex selecciona exactamente `openai/gpt-5.6-sol` para el catálogo
    nativo de Codex. Los modelos principales explícitos existentes, incluido `openai/gpt-5.5`, se
    conservan al añadir o actualizar la autenticación de OpenAI. GPT-5.5 sigue disponible
    mediante cualquiera de los entornos de ejecución como opción explícita de recuperación para cuentas sin
    acceso a GPT-5.6.

  </Accordion>
  <Accordion title="Entornos de ejecución de la CLI">
    Los entornos de ejecución de la CLI usan la misma separación: elija referencias de modelos canónicas como `anthropic/claude-*` o `google/gemini-*` y, a continuación, establezca la política de entorno de ejecución del proveedor/modelo en `claude-cli` o `google-gemini-cli` cuando quiera usar un backend de CLI local.

    Las referencias heredadas `claude-cli/*` y `google-gemini-cli/*` se migran de nuevo a referencias de proveedores canónicas, con el entorno de ejecución registrado por separado. Las referencias heredadas `codex-cli/*` se migran a `openai/*` y usan la ruta del servidor de aplicaciones de Codex; OpenClaw ya no incluye un backend de CLI de Codex integrado.

  </Accordion>
</AccordionGroup>

## Comportamiento del proveedor propiedad del plugin

La mayor parte de la lógica específica de cada proveedor reside en plugins de proveedores (`registerProvider(...)`), mientras que OpenClaw conserva el bucle de inferencia genérico. Los plugins controlan la incorporación, los catálogos de modelos, la asignación de variables de entorno para autenticación, la normalización del transporte y la configuración, la depuración del esquema de herramientas, la clasificación de conmutación por error, la actualización de OAuth, los informes de uso, los perfiles de pensamiento/razonamiento y mucho más.

La lista completa de hooks del SDK de proveedores y ejemplos de plugins incluidos se encuentra en [Plugins de proveedores](/es/plugins/sdk-provider-plugins). Un proveedor que necesite un ejecutor de solicitudes totalmente personalizado constituye una superficie de extensión independiente y más profunda.

<Note>
El comportamiento del ejecutor propiedad del proveedor reside en hooks explícitos del proveedor, como la política de repetición, la normalización del esquema de herramientas, el encapsulado de flujos y las utilidades de transporte/solicitud. El contenedor estático heredado `ProviderPlugin.capabilities` existe solo por compatibilidad y la lógica compartida del ejecutor ya no lo consulta.
</Note>

## Rotación de claves de API

<AccordionGroup>
  <Accordion title="Fuentes y prioridad de las claves">
    Configure varias claves mediante:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (sobrescritura activa única, máxima prioridad)
    - `<PROVIDER>_API_KEYS` (lista separada por comas o punto y coma)
    - `<PROVIDER>_API_KEY` (clave principal)
    - `<PROVIDER>_API_KEY_*` (lista numerada, por ejemplo, `<PROVIDER>_API_KEY_1`)

    Para los proveedores de Google, también se incluye `GOOGLE_API_KEY` como alternativa. El orden de selección de claves conserva la prioridad y elimina los valores duplicados.

  </Accordion>
  <Accordion title="Cuándo se activa la rotación">
    - Las solicitudes se reintentan con la siguiente clave únicamente ante respuestas de límite de frecuencia (por ejemplo, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o mensajes periódicos de límite de uso).
    - Los errores que no se deben a límites de frecuencia fallan inmediatamente; no se intenta rotar las claves.
    - Cuando fallan todas las claves candidatas, se devuelve el error final del último intento.

  </Accordion>
</AccordionGroup>

## Plugins de proveedores oficiales

Los plugins de proveedores oficiales publican sus propias filas del catálogo de modelos. Estos proveedores **no** requieren entradas de modelos en `models.providers`; habilite el plugin del proveedor, configure la autenticación y elija un modelo. Use `models.providers` únicamente para proveedores personalizados explícitos o ajustes de solicitud específicos, como los tiempos de espera.

### OpenAI

- Proveedor: `openai`
- Autenticación: `OPENAI_API_KEY`
- Rotación opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, además de `OPENCLAW_LIVE_OPENAI_KEY` (sobrescritura única)
- Valor predeterminado para configuraciones nuevas: `openai/gpt-5.6`; en la API directa, el id básico se resuelve como Sol.
- Modelos de ejemplo: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- Compruebe la disponibilidad de la cuenta y del modelo con `openclaw models list --provider openai` si una instalación o clave de API específica se comporta de manera diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- El transporte predeterminado es `auto`; OpenClaw transmite la opción de transporte al entorno de ejecución compartido del modelo.
- Sobrescríbalo por modelo mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- El procesamiento prioritario de OpenAI puede habilitarse mediante `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` y `params.fastMode` asignan las solicitudes directas de Responses de `openai/*` a `service_tier=priority` en `api.openai.com`
- Use `params.serviceTier` cuando quiera un nivel explícito en lugar del conmutador compartido `/fast`
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) se aplican únicamente al tráfico nativo de OpenAI dirigido a `api.openai.com`, no a proxies genéricos compatibles con OpenAI
- Las rutas nativas de OpenAI también conservan `store` de Responses, las sugerencias de caché de prompts y la adaptación de la carga útil para compatibilidad con el razonamiento de OpenAI; las rutas de proxy no
- `openai/gpt-5.3-codex-spark` solo está disponible mediante OAuth de ChatGPT/Codex; las rutas directas con clave de API de OpenAI y con clave de API de Azure lo rechazan

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

Si la organización de la API no ofrece GPT-5.6, configure
`openai/gpt-5.5` explícitamente. La incorporación y la reautenticación normales conservan un
modelo principal explícito existente; `models auth login --set-default` y
`models set` son las vías para reemplazarlo intencionadamente.

### Anthropic

- Proveedor: `anthropic`
- Autenticación: `ANTHROPIC_API_KEY`
- Rotación opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, además de `OPENCLAW_LIVE_ANTHROPIC_KEY` (sobrescritura única)
- Modelo de ejemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Las solicitudes públicas directas a Anthropic admiten el conmutador compartido `/fast` y `params.fastMode`, incluido el tráfico autenticado mediante clave de API y OAuth enviado a `api.anthropic.com`; OpenClaw lo asigna a `service_tier` de Anthropic (`auto` frente a `standard_only`)
- La configuración preferida de la CLI de Claude mantiene la referencia del modelo canónica y selecciona el backend de la CLI
  por separado: `anthropic/claude-opus-4-8` con
  `agentRuntime.id: "claude-cli"` en el ámbito del modelo. Las referencias heredadas
  `claude-cli/claude-opus-4-7` siguen funcionando por compatibilidad.

<Note>
La reutilización de la CLI de Claude (`claude -p`) es una vía de integración autorizada de OpenClaw. La autenticación mediante token de configuración de Anthropic sigue siendo compatible, pero OpenClaw prefiere reutilizar la CLI de Claude cuando está disponible.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth de OpenAI ChatGPT/Codex

- Proveedor: `openai`
- Autenticación: OAuth (ChatGPT)
- Referencia nueva del entorno de pruebas nativo del servidor de aplicaciones de Codex: `openai/gpt-5.6-sol`
- Documentación del entorno de pruebas nativo del servidor de aplicaciones de Codex: [Entorno de pruebas de Codex](/es/plugins/codex-harness)
- Referencias de modelos heredadas: `codex/gpt-*`
- Límite del plugin: `openai/*` carga el plugin de OpenAI; la política explícita del entorno de ejecución o la ruta efectiva propiedad del proveedor determina si se selecciona el plugin nativo del servidor de aplicaciones de Codex.
- CLI: `openclaw onboard --auth-choice openai` o `openclaw models auth login --provider openai`
- El transporte integrado de ChatGPT Responses de OpenClaw usa `auto` de forma predeterminada (primero WebSocket, con SSE como alternativa).
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier` y `params.fastMode` son ajustes definidos de solicitudes integradas. Mantienen la selección implícita del entorno de ejecución en OpenClaw; Codex nativo controla el transporte y el nivel de servicio de su servidor de aplicaciones.
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) solo se adjuntan al tráfico nativo de Codex dirigido a `chatgpt.com/backend-api`, no a proxies genéricos compatibles con OpenAI
- El conmutador compartido `/fast` sigue estando disponible como control del entorno de ejecución; es distinto de los parámetros definidos del modelo.
- El catálogo nativo de Codex puede ofrecer las referencias exactas `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` y `openai/gpt-5.6-luna` según el acceso de la cuenta. No aplica en el cliente el alias básico `gpt-5.6` de la API directa.
- `openai/gpt-5.5` usa el valor nativo `contextWindow = 400000` del catálogo de Codex y el valor predeterminado del entorno de ejecución `contextTokens = 272000`; sobrescriba el límite del entorno de ejecución con `models.providers.openai.models[].contextTokens`
- Inicie sesión con la autenticación `openai` y use `openai/gpt-5.6-sol` para una configuración nueva respaldada por una suscripción. Seleccione `openai/gpt-5.5` explícitamente si ese espacio de trabajo de Codex no ofrece GPT-5.6.
- Use `agentRuntime.id: "openclaw"` en el proveedor/modelo para mantener una ruta que, de otro modo, sería apta en el entorno de ejecución integrado. Si el entorno de ejecución no está configurado o es `auto`, solo una ruta oficial HTTPS exacta compatible con Responses/ChatGPT y sin sobrescrituras de solicitud definidas puede seleccionar Codex implícitamente.
- Las referencias heredadas de GPT de Codex constituyen un estado heredado, no una ruta de proveedor activa. Use referencias canónicas `openai/*` para la configuración de agentes nuevos y ejecute `openclaw doctor --fix` para migrar las referencias antiguas de modelos de Codex sin actualizar una selección explícita existente de `openai/gpt-5.5`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Otras opciones alojadas basadas en suscripción

<CardGroup cols={3}>
  <Card title="MiniMax" href="/es/providers/minimax">
    Acceso mediante OAuth de MiniMax Coding Plan o clave de API.
  </Card>
  <Card title="Qwen Cloud" href="/es/providers/qwen">
    Superficie del proveedor Qwen Cloud, además de la correspondencia de endpoints de Alibaba DashScope y Coding Plan.
  </Card>
  <Card title="Z.AI (GLM)" href="/es/providers/zai">
    Endpoints de Z.AI Coding Plan o de la API general.
  </Card>
</CardGroup>

### OpenCode

- Autenticación: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Proveedor del entorno de ejecución Zen: `opencode`
- Proveedor del entorno de ejecución Go: `opencode-go`
- Modelos de ejemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (clave de API)

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY`
- Rotación opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, alternativa `GOOGLE_API_KEY` y `OPENCLAW_LIVE_GEMINI_KEY` (sustitución única)
- Modelos de ejemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- Compatibilidad: la configuración heredada de OpenClaw que usa `google/gemini-3.1-flash-preview` se normaliza a `google/gemini-3-flash-preview`
- Alias: se acepta `google/gemini-3.1-pro` y se normaliza al identificador activo de la API de Gemini de Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Razonamiento: `/think adaptive` usa el razonamiento dinámico de Google. Gemini 3/3.1 omite un `thinkingLevel` fijo; Gemini 2.5 envía `thinkingBudget: -1`.
- Las ejecuciones directas de Gemini también aceptan `agents.defaults.models["google/<model>"].params.cachedContent` (o el valor heredado `cached_content`) para reenviar un identificador `cachedContents/...` nativo del proveedor; los aciertos de caché de Gemini se muestran como `cacheRead` de OpenClaw

### Google Vertex y Gemini CLI

- Proveedores: `google-vertex`, `google-gemini-cli`
- Autenticación: Vertex usa ADC de gcloud; Gemini CLI usa su flujo de OAuth

<Warning>
OAuth de Gemini CLI en OpenClaw es una integración no oficial. Algunos usuarios han informado de restricciones en sus cuentas de Google después de usar clientes de terceros. Revise las condiciones de Google y use una cuenta no crítica si decide continuar.
</Warning>

OAuth de Gemini CLI se distribuye como parte del plugin `google` incluido.

<Steps>
  <Step title="Instalar Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Habilitar el plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Iniciar sesión">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo predeterminado: `google-gemini-cli/gemini-3-flash-preview`. **No** se pega un identificador ni un secreto de cliente en `openclaw.json`. El flujo de inicio de sesión de la CLI almacena los tokens en perfiles de autenticación del host del gateway.

  </Step>
  <Step title="Configurar el proyecto (si es necesario)">
    Si las solicitudes fallan después de iniciar sesión, configure `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway.
  </Step>
</Steps>

Gemini CLI usa `stream-json` de forma predeterminada. OpenClaw lee los mensajes
del flujo del asistente y normaliza `stats.cached` como `cacheRead`; las sustituciones heredadas
de `--output-format json` siguen leyendo el texto de la respuesta desde `response`.

### Z.AI (GLM)

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- Modelo de ejemplo: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Las referencias de modelos usan el identificador de proveedor canónico `zai/*`.
  - `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente; `zai-coding-global`, `zai-coding-cn`, `zai-global` y `zai-cn` fuerzan una superficie específica

### Vercel AI Gateway

- Proveedor: `vercel-ai-gateway`
- Autenticación: `AI_GATEWAY_API_KEY`
- Modelos de ejemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Otros plugins de proveedores incluidos

| Proveedor                               | Id                               | Variable de entorno de autenticación                  | Modelo de ejemplo                                          |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` o `OPENROUTER_API_KEY`             | `arcee/trinity-large-thinking`                             |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                     |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` o `CHUTES_OAUTH_TOKEN`              | `chutes/zai-org/GLM-4.7-TEE`                               |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                            |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                  |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                               |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                               |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                         |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                             |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                 | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/es/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OAuth de OpenRouter o `OPENROUTER_API_KEY`           | `openrouter/auto`                                          |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                    |
| [OAuth de Qwen](/es/providers/qwen-oauth)  | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                             |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | OAuth de SuperGrok/X Premium o `XAI_API_KEY`         | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Particularidades que conviene conocer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica sus encabezados de atribución de la aplicación y los marcadores `cache_control` de Anthropic solo en rutas verificadas de `openrouter.ai`. Las referencias de DeepSeek, Moonshot y ZAI pueden usar TTL de caché para el almacenamiento en caché de prompts administrado por OpenRouter, pero no reciben marcadores de caché de Anthropic. Como ruta compatible con OpenAI de tipo proxy, omite los ajustes exclusivos de OpenAI nativo (`serviceTier`, `store` de Responses, indicaciones de caché de prompts y compatibilidad de razonamiento de OpenAI). Las referencias basadas en Gemini conservan únicamente el saneamiento de firmas de pensamiento de Gemini mediante proxy.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Las referencias basadas en Gemini siguen la misma ruta de saneamiento de Gemini mediante proxy; `kilocode/kilo/auto` y otras referencias de proxy que no admiten razonamiento omiten la inyección de razonamiento mediante proxy.
  </Accordion>
  <Accordion title="MiniMax">
    La incorporación con clave de API escribe definiciones explícitas de modelos de chat M3 y M2.7; la comprensión de imágenes permanece en el proveedor multimedia `MiniMax-VL-01`, propiedad del plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Los identificadores de modelo usan un espacio de nombres `nvidia/<vendor>/<model>` (por ejemplo, `nvidia/nvidia/nemotron-...` junto con `nvidia/moonshotai/kimi-k2.5`); los selectores conservan la composición literal `<provider>/<model-id>`, mientras que la clave canónica enviada a la API mantiene un único prefijo.
  </Accordion>
  <Accordion title="xAI">
    Usa la ruta Responses de xAI. La ruta recomendada es OAuth de SuperGrok/X Premium; las claves de API siguen funcionando mediante `XAI_API_KEY` o la configuración del plugin, y `web_search` de Grok reutiliza el mismo perfil de autenticación antes de recurrir a la clave de API. Grok 4.5 puede seleccionarse para chat, programación y trabajo con agentes donde esté disponible; `grok-4.3` sigue siendo el valor predeterminado incluido y seguro para todas las regiones. Las configuraciones anteriores de `/fast` y `params.fastMode: true` aún se resuelven mediante las redirecciones de compatibilidad de Grok 4.3 de xAI, pero las configuraciones nuevas deben seleccionar directamente un modelo actual. `tool_stream` está activado de forma predeterminada; desactívelo mediante `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Proveedores mediante `models.providers` (URL personalizada/base)

Use `models.providers` (o `models.json`) para añadir proveedores **personalizados** o proxies compatibles con OpenAI/Anthropic.

Muchos de los plugins de proveedores incluidos que aparecen a continuación ya publican un catálogo predeterminado. Use entradas explícitas de `models.providers.<id>` solo cuando quiera sustituir la URL base, los encabezados o la lista de modelos predeterminados.

Las comprobaciones de capacidades de modelos del Gateway también leen los metadatos explícitos de `models.providers.<id>.models[]`. Si un modelo personalizado o de proxy acepta imágenes, establezca `input: ["text", "image"]` en ese modelo para que WebChat y las rutas de archivos adjuntos originadas en nodos pasen las imágenes como entradas nativas del modelo en lugar de referencias multimedia de solo texto.

`agents.defaults.models["provider/model"]` solo controla la visibilidad de los modelos, los alias y los metadatos por modelo para los agentes. No registra por sí solo un nuevo modelo de tiempo de ejecución. Para modelos de proveedores personalizados, añada también `models.providers.<provider>.models[]` con al menos el `id` correspondiente.

### Moonshot AI (Kimi)

Instale `@openclaw/moonshot-provider` antes de la incorporación. Añada una entrada explícita de `models.providers.moonshot` solo cuando necesite sustituir la URL base o los metadatos del modelo:

- Proveedor: `moonshot`
- Autenticación: `MOONSHOT_API_KEY`
- Modelo de ejemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

Identificadores de modelos Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

Consulte [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot) para ver la guía de configuración completa.

### Kimi Coding

Kimi Coding usa el endpoint compatible con Anthropic de Moonshot AI:

- Proveedor: `kimi`
- Autenticación: `KIMI_API_KEY`
- Modelo de ejemplo: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Los identificadores de modelos heredados `kimi/kimi-code` y `kimi/k2p5` siguen aceptándose por compatibilidad y se normalizan al identificador de modelo estable de la API de Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) proporciona acceso a Doubao y otros modelos en China.

- Proveedor: `volcengine` (programación: `volcengine-plan`)
- Autenticación: `VOLCANO_ENGINE_API_KEY`
- Modelo de ejemplo: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

La incorporación usa de forma predeterminada la superficie de programación, pero el catálogo general `volcengine/*` se registra al mismo tiempo.

En los selectores de modelos de incorporación/configuración, la opción de autenticación de Volcengine da preferencia tanto a las filas `volcengine/*` como a las filas `volcengine-plan/*`. Si esos modelos aún no están cargados, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

<Tabs>
  <Tab title="Modelos estándar">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="Modelos de programación (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (internacional)

BytePlus ARK proporciona acceso a los mismos modelos que Volcano Engine para usuarios internacionales.

- Proveedor: `byteplus` (programación: `byteplus-plan`)
- Autenticación: `BYTEPLUS_API_KEY`
- Modelo de ejemplo: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

La incorporación usa de forma predeterminada la superficie de programación, pero el catálogo general `byteplus/*` se registra al mismo tiempo.

En los selectores de modelos de incorporación/configuración, la opción de autenticación de BytePlus da preferencia tanto a las filas `byteplus/*` como a las filas `byteplus-plan/*`. Si esos modelos aún no están cargados, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

<Tabs>
  <Tab title="Modelos estándar">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modelos de programación (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic proporciona modelos compatibles con Anthropic mediante el proveedor `synthetic`:

- Proveedor: `synthetic`
- Autenticación: `SYNTHETIC_API_KEY`
- Modelo de ejemplo: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax se configura mediante `models.providers` porque usa endpoints personalizados:

- OAuth de MiniMax (global): `--auth-choice minimax-global-oauth`
- OAuth de MiniMax (CN): `--auth-choice minimax-cn-oauth`
- Clave de API de MiniMax (global): `--auth-choice minimax-global-api`
- Clave de API de MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/es/providers/minimax) para obtener detalles de configuración, opciones de modelos y fragmentos de configuración.

<Note>
En la ruta de transmisión compatible con Anthropic de MiniMax, OpenClaw desactiva el razonamiento de forma predeterminada para la familia M2.x, a menos que se establezca explícitamente; MiniMax-M3 (y M3.x) conserva de forma predeterminada la ruta de razonamiento omitido/adaptativo del proveedor. `/fast on` sustituye `MiniMax-M2.7` por `MiniMax-M2.7-highspeed`.
</Note>

División de capacidades propiedad del plugin:

- Los valores predeterminados de texto/chat permanecen en `minimax/MiniMax-M3`
- La generación de imágenes es `minimax/image-01` o `minimax-portal/image-01`
- La comprensión de imágenes es `MiniMax-VL-01`, propiedad del plugin, en ambas rutas de autenticación de MiniMax
- La búsqueda web permanece en el identificador de proveedor `minimax`

### LM Studio

LM Studio se distribuye como un plugin de proveedor incluido que usa la API nativa:

- Proveedor: `lmstudio`
- Autenticación: `LM_API_TOKEN`
- URL base de inferencia predeterminada: `http://localhost:1234/v1`

A continuación, establezca un modelo (sustitúyalo por uno de los identificadores devueltos por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa los endpoints nativos `/api/v1/models` y `/api/v1/models/load` de LM Studio para la detección y la carga automática, y `/v1/chat/completions` para la inferencia de forma predeterminada. Si quiere que la carga JIT, el TTL y la expulsión automática de LM Studio controlen el ciclo de vida del modelo, establezca `models.providers.lmstudio.params.preload: false`. Consulte [/providers/lmstudio](/es/providers/lmstudio) para obtener información sobre la configuración y la solución de problemas.

### Ollama

Ollama se distribuye como un plugin de proveedor incluido y usa la API nativa de Ollama:

- Proveedor: `ollama`
- Autenticación: no se requiere (servidor local)
- Modelo de ejemplo: `ollama/llama3.3`
- Instalación: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instale Ollama y, a continuación, descargue un modelo:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama se detecta localmente en `http://127.0.0.1:11434` cuando se habilita mediante `OLLAMA_API_KEY`, y el plugin de proveedor incluido añade Ollama directamente a `openclaw onboard` y al selector de modelos. Consulte [/providers/ollama](/es/providers/ollama) para obtener información sobre la incorporación, los modos en la nube/local y la configuración personalizada.

### vLLM

vLLM se distribuye como un plugin de proveedor incluido para servidores locales o autoalojados compatibles con OpenAI:

- Proveedor: `vllm`
- Autenticación: opcional (depende del servidor)
- URL base predeterminada: `http://127.0.0.1:8000/v1`

Para habilitar la detección automática local (cualquier valor funciona si el servidor no exige autenticación):

```bash
export VLLM_API_KEY="vllm-local"
```

A continuación, establezca un modelo (sustitúyalo por uno de los identificadores devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulte [/providers/vllm](/es/providers/vllm) para obtener más información.

### SGLang

SGLang se distribuye como un plugin de proveedor incluido para servidores rápidos y autoalojados compatibles con OpenAI:

- Proveedor: `sglang`
- Autenticación: opcional (depende del servidor)
- URL base predeterminada: `http://127.0.0.1:30000/v1`

Para habilitar la detección automática local (cualquier valor funciona si el servidor no exige autenticación):

```bash
export SGLANG_API_KEY="sglang-local"
```

A continuación, establezca un modelo (sustitúyalo por uno de los identificadores devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consulte [/providers/sglang](/es/providers/sglang) para obtener más información.

### Proxies locales (LM Studio, vLLM, LiteLLM, etc.)

Ejemplo (compatible con OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Campos opcionales predeterminados">
    Para los proveedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` y `maxTokens` son opcionales. Cuando se omiten, OpenClaw utiliza de forma predeterminada:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recomendación: establezca valores explícitos que coincidan con los límites de su proxy/modelo.

  </Accordion>
  <Accordion title="Reglas de conformación de rutas de proxy">
    - Para `api: "openai-completions"` en endpoints no nativos (cualquier `baseUrl` no vacío cuyo host no sea `api.openai.com`), OpenClaw fuerza `compat.supportsDeveloperRole: false` para evitar errores 400 del proveedor debido a roles `developer` no compatibles.
    - Las rutas compatibles con OpenAI de tipo proxy también omiten la conformación de solicitudes exclusiva de OpenAI nativo: sin `service_tier`, sin `store` de Responses, sin `store` de Completions, sin indicaciones de caché de prompts, sin conformación de cargas útiles de compatibilidad con el razonamiento de OpenAI y sin encabezados ocultos de atribución de OpenClaw.
    - Para los proxies de Completions compatibles con OpenAI que necesiten campos específicos del proveedor, establezca `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) para combinar JSON adicional en el cuerpo de la solicitud saliente.
    - Para los controles de plantillas de chat de vLLM, establezca `agents.defaults.models["provider/model"].params.chat_template_kwargs`. El Plugin de vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true` para `vllm/nemotron-3-*` cuando el nivel de razonamiento de la sesión está desactivado.
    - Para modelos locales lentos o hosts remotos de LAN/tailnet, establezca `models.providers.<id>.timeoutSeconds`. Esto amplía el procesamiento de solicitudes HTTP del modelo del proveedor, incluida la conexión, los encabezados, la transmisión del cuerpo y la cancelación total de la recuperación protegida, sin aumentar el tiempo de espera de todo el entorno de ejecución del agente. Si `agents.defaults.timeoutSeconds` o un tiempo de espera específico de la ejecución es menor, aumente también ese límite; los tiempos de espera del proveedor no pueden prolongar toda la ejecución.
    - Las llamadas HTTP del proveedor del modelo permiten respuestas DNS de IP falsa de Surge, Clash y sing-box en `198.18.0.0/15` y `fc00::/7` únicamente para el nombre de host de `baseUrl` del proveedor configurado. Los endpoints de proveedores personalizados/locales también confían en el origen exacto configurado `scheme://host:port` para las solicitudes de modelo protegidas, incluidos los hosts de bucle invertido, LAN y tailnet. Esta no es una nueva opción de configuración; el `baseUrl` que configure amplía la política de solicitudes únicamente para ese origen. La autorización de nombres de host con IP falsa y la confianza en el origen exacto son mecanismos independientes. Otros destinos privados, de bucle invertido, locales de enlace o de metadatos, así como los puertos diferentes, siguen requiriendo la habilitación explícita de `models.providers.<id>.request.allowPrivateNetwork: true`. Establezca `models.providers.<id>.request.allowPrivateNetwork: false` para desactivar la confianza en el origen exacto.
    - Si `baseUrl` está vacío o se omite, OpenClaw conserva el comportamiento predeterminado de OpenAI (que se resuelve como `api.openai.com`).
    - Por seguridad, un valor explícito `compat.supportsDeveloperRole: true` se sigue anulando en los endpoints `openai-completions` no nativos.
    - Para `api: "anthropic-messages"` en endpoints no directos (cualquier proveedor que no sea el `anthropic` canónico, o un `models.providers.anthropic.baseUrl` personalizado cuyo host no sea un endpoint público de `api.anthropic.com`), OpenClaw suprime los encabezados beta implícitos de Anthropic, como `claude-code-20250219`, `interleaved-thinking-2025-05-14` y los marcadores de OAuth, para que los proxies personalizados compatibles con Anthropic no rechacen indicadores beta no compatibles. Establezca `models.providers.<id>.headers["anthropic-beta"]` explícitamente si su proxy necesita funciones beta específicas.

  </Accordion>
</AccordionGroup>

## Ejemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte también: [Configuración](/es/gateway/configuration) para ver ejemplos completos de configuración.

## Contenido relacionado

- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - claves de configuración del modelo
- [Conmutación por error de modelos](/es/concepts/model-failover) - cadenas de respaldo y comportamiento de reintentos
- [Modelos](/es/concepts/models) - configuración y alias de modelos
- [Proveedores](/es/providers) - guías de configuración para cada proveedor
