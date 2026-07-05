---
read_when:
    - Necesitas una referencia de configuración de modelos por proveedor
    - Quieres configuraciones de ejemplo o comandos de incorporación de CLI para proveedores de modelos
sidebarTitle: Model providers
summary: Resumen del proveedor de modelos con configuraciones de ejemplo + flujos de CLI
title: Proveedores de modelos
x-i18n:
    generated_at: "2026-07-05T11:15:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27dc5802f622de2c36da44667d777c570693627202af8af5cde4276f3a7ec5d7
    source_path: concepts/model-providers.md
    workflow: 16
---

Referencia para **proveedores de LLM/modelos** (no canales de chat como WhatsApp/Telegram). Para las reglas de selección de modelos, consulta [Modelos](/es/concepts/models).

## Reglas rápidas

<AccordionGroup>
  <Accordion title="Referencias de modelo y ayudantes de CLI">
    - Las referencias de modelo usan `provider/model` (ejemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` actúa como lista de permitidos cuando se configura.
    - Ayudantes de CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` establecen valores predeterminados a nivel de proveedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` los sobrescriben por modelo.
    - Reglas de respaldo, sondeos de enfriamiento y persistencia de anulaciones de sesión: [Conmutación por error de modelo](/es/concepts/model-failover).

  </Accordion>
  <Accordion title="Agregar autenticación de proveedor no cambia tu modelo principal">
    `openclaw configure` conserva un `agents.defaults.model.primary` existente cuando agregas o vuelves a autenticar un proveedor. `openclaw models auth login` hace lo mismo salvo que pases `--set-default`. Los Plugin de proveedor aún pueden devolver un modelo predeterminado recomendado en su parche de configuración de autenticación, pero OpenClaw lo trata como "hacer que este modelo esté disponible" cuando ya existe un modelo principal, no como "reemplazar el modelo principal actual".

    Para cambiar intencionalmente el modelo predeterminado, usa `openclaw models set <provider/model>` o `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Separación entre proveedor y runtime de OpenAI">
    Las rutas de la familia OpenAI son específicas por prefijo:

    - `openai/<model>` usa el arnés nativo de servidor de aplicaciones de Codex para turnos de agente de forma predeterminada. Esta es la configuración habitual de suscripción a ChatGPT/Codex.
    - Las referencias de modelos Codex heredadas son configuración heredada que doctor reescribe a `openai/<model>`.
    - `openai/<model>` más `agentRuntime.id: "openclaw"` de proveedor/modelo usa el runtime integrado de OpenClaw para rutas explícitas de clave de API o compatibilidad.

    Consulta [OpenAI](/es/providers/openai) y [Arnés de Codex](/es/plugins/codex-harness). Si la separación entre proveedor y runtime resulta confusa, lee primero [Runtimes de agente](/es/concepts/agent-runtimes).

    La habilitación automática de Plugin sigue el mismo límite: las referencias de agente `openai/*` habilitan el Plugin de Codex para la ruta predeterminada, y las referencias explícitas de proveedor/modelo `agentRuntime.id: "codex"` o las referencias heredadas `codex/<model>` también lo requieren.

    GPT-5.5 está disponible a través del arnés nativo de servidor de aplicaciones de Codex de forma predeterminada en `openai/gpt-5.5`, y a través del runtime de OpenClaw cuando la política de runtime de proveedor/modelo selecciona explícitamente `openclaw`.

  </Accordion>
  <Accordion title="Runtimes de CLI">
    Los runtimes de CLI usan la misma separación: elige referencias de modelo canónicas como `anthropic/claude-*` o `google/gemini-*`, y luego establece la política de runtime de proveedor/modelo en `claude-cli` o `google-gemini-cli` cuando quieras un backend de CLI local.

    Las referencias heredadas `claude-cli/*` y `google-gemini-cli/*` migran de vuelta a referencias de proveedor canónicas con el runtime registrado por separado. Las referencias heredadas `codex-cli/*` migran a `openai/*` y usan la ruta de servidor de aplicaciones de Codex; OpenClaw ya no mantiene un backend Codex CLI incluido.

  </Accordion>
</AccordionGroup>

## Comportamiento de proveedor propiedad del Plugin

La mayor parte de la lógica específica del proveedor vive en Plugin de proveedor (`registerProvider(...)`) mientras OpenClaw mantiene el bucle genérico de inferencia. Los Plugin son propietarios del onboarding, catálogos de modelos, asignación de variables de entorno de autenticación, normalización de transporte/configuración, limpieza de esquemas de herramientas, clasificación de conmutación por error, renovación de OAuth, informes de uso, perfiles de pensamiento/razonamiento y más.

La lista completa de hooks del SDK de proveedores y ejemplos de Plugin incluidos se encuentra en [Plugin de proveedor](/es/plugins/sdk-provider-plugins). Un proveedor que necesita un ejecutor de solicitudes totalmente personalizado es una superficie de extensión separada y más profunda.

<Note>
El comportamiento del runner propiedad del proveedor vive en hooks explícitos del proveedor, como la política de reproducción, normalización de esquemas de herramientas, envoltura de streams y ayudantes de transporte/solicitud. La bolsa estática heredada `ProviderPlugin.capabilities` es solo de compatibilidad y ya no la lee la lógica compartida del runner.
</Note>

## Rotación de claves de API

<AccordionGroup>
  <Accordion title="Fuentes de claves y prioridad">
    Configura varias claves mediante:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (anulación live única, prioridad máxima)
    - `<PROVIDER>_API_KEYS` (lista separada por comas o punto y coma)
    - `<PROVIDER>_API_KEY` (clave principal)
    - `<PROVIDER>_API_KEY_*` (lista numerada, por ejemplo `<PROVIDER>_API_KEY_1`)

    Para proveedores de Google, `GOOGLE_API_KEY` también se incluye como respaldo. El orden de selección de claves conserva la prioridad y elimina valores duplicados.

  </Accordion>
  <Accordion title="Cuándo se activa la rotación">
    - Las solicitudes se reintentan con la siguiente clave solo ante respuestas de límite de tasa (por ejemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o mensajes periódicos de límite de uso).
    - Los fallos que no son de límite de tasa fallan de inmediato; no se intenta rotación de claves.
    - Cuando fallan todas las claves candidatas, se devuelve el error final del último intento.

  </Accordion>
</AccordionGroup>

## Plugin de proveedor oficiales

Los Plugin de proveedor oficiales publican sus propias filas de catálogo de modelos. Estos proveedores **no** requieren entradas de modelo en `models.providers`; habilita el Plugin de proveedor, configura la autenticación y elige un modelo. Usa `models.providers` solo para proveedores personalizados explícitos o ajustes de solicitud limitados, como tiempos de espera.

### OpenAI

- Proveedor: `openai`
- Autenticación: `OPENAI_API_KEY`
- Rotación opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, más `OPENCLAW_LIVE_OPENAI_KEY` (anulación única)
- Modelos de ejemplo: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifica la disponibilidad de cuenta/modelo con `openclaw models list --provider openai` si una instalación o clave de API específica se comporta de forma diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- El transporte predeterminado es `auto`; OpenClaw pasa la elección de transporte al runtime de modelo compartido.
- Sobrescribe por modelo mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- El procesamiento prioritario de OpenAI puede habilitarse mediante `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` y `params.fastMode` asignan solicitudes Responses directas `openai/*` a `service_tier=priority` en `api.openai.com`
- Usa `params.serviceTier` cuando quieras un nivel explícito en lugar del conmutador compartido `/fast`
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) se aplican solo al tráfico nativo de OpenAI hacia `api.openai.com`, no a proxies genéricos compatibles con OpenAI
- Las rutas nativas de OpenAI también conservan `store` de Responses, indicaciones de caché de prompts y moldeado de payload compatible con razonamiento de OpenAI; las rutas de proxy no lo hacen
- `openai/gpt-5.3-codex-spark` está disponible solo a través de OAuth de ChatGPT/Codex; las rutas directas con clave de API de OpenAI y clave de API de Azure lo rechazan

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Proveedor: `anthropic`
- Autenticación: `ANTHROPIC_API_KEY`
- Rotación opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, más `OPENCLAW_LIVE_ANTHROPIC_KEY` (anulación única)
- Modelo de ejemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Las solicitudes públicas directas de Anthropic admiten el conmutador compartido `/fast` y `params.fastMode`, incluido el tráfico autenticado con clave de API y OAuth enviado a `api.anthropic.com`; OpenClaw lo asigna a `service_tier` de Anthropic (`auto` frente a `standard_only`)
- La configuración preferida de Claude CLI conserva la referencia de modelo canónica y selecciona el backend de CLI por separado: `anthropic/claude-opus-4-8` con `agentRuntime.id: "claude-cli"` con alcance de modelo. Las referencias heredadas `claude-cli/claude-opus-4-7` siguen funcionando por compatibilidad.

<Note>
La reutilización de Claude CLI (`claude -p`) es una ruta de integración aprobada de OpenClaw. La autenticación con token de configuración de Anthropic sigue siendo compatible, pero OpenClaw prefiere la reutilización de Claude CLI cuando está disponible.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth de OpenAI ChatGPT/Codex

- Proveedor: `openai`
- Autenticación: OAuth (ChatGPT)
- Referencia del arnés nativo de servidor de aplicaciones de Codex: `openai/gpt-5.5`
- Documentación del arnés nativo de servidor de aplicaciones de Codex: [Arnés de Codex](/es/plugins/codex-harness)
- Referencias de modelo heredadas: `codex/gpt-*`
- Límite de Plugin: `openai/*` carga el Plugin de OpenAI; el Plugin nativo de servidor de aplicaciones de Codex se selecciona mediante el runtime del arnés de Codex.
- CLI: `openclaw onboard --auth-choice openai` o `openclaw models auth login --provider openai`
- El transporte predeterminado es `auto` (WebSocket primero, SSE como respaldo)
- Sobrescribe por modelo OpenAI Codex mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` también se reenvía en solicitudes Responses nativas de Codex (`chatgpt.com/backend-api`)
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) solo se adjuntan al tráfico nativo de Codex hacia `chatgpt.com/backend-api`, no a proxies genéricos compatibles con OpenAI
- Comparte la misma configuración del conmutador `/fast` y `params.fastMode` que `openai/*` directo; OpenClaw lo asigna a `service_tier=priority`
- `openai/gpt-5.5` usa el `contextWindow = 400000` nativo del catálogo de Codex y el runtime predeterminado `contextTokens = 272000`; sobrescribe el límite del runtime con `models.providers.openai.models[].contextTokens`
- Inicia sesión con autenticación `openai` y configura `openai/gpt-5.5` para la suscripción estándar más la ruta de runtime nativa de Codex; los turnos de agente de OpenAI seleccionan Codex de forma predeterminada.
- Usa `agentRuntime.id: "openclaw"` de proveedor/modelo solo cuando quieras la ruta integrada de OpenClaw; de lo contrario, mantén `openai/gpt-5.5` en el arnés predeterminado de Codex.
- Las referencias GPT heredadas de Codex son estado heredado, no una ruta de proveedor live. Usa `openai/gpt-5.5` en el runtime nativo de Codex para la nueva configuración de agente, y ejecuta `openclaw doctor --fix` para migrar referencias de modelo Codex heredadas antiguas a referencias canónicas `openai/*`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
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

### Otras opciones alojadas de estilo suscripción

<CardGroup cols={3}>
  <Card title="MiniMax" href="/es/providers/minimax">
    Acceso mediante OAuth del MiniMax Coding Plan o clave de API.
  </Card>
  <Card title="Qwen Cloud" href="/es/providers/qwen">
    Superficie de proveedor de Qwen Cloud más asignación de endpoints de Alibaba DashScope y Coding Plan.
  </Card>
  <Card title="Z.AI (GLM)" href="/es/providers/zai">
    Z.AI Coding Plan o endpoints generales de API.
  </Card>
</CardGroup>

### OpenCode

- Autenticación: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Proveedor de runtime Zen: `opencode`
- Proveedor de runtime Go: `opencode-go`
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
- Rotación opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, respaldo `GOOGLE_API_KEY` y `OPENCLAW_LIVE_GEMINI_KEY` (sobrescritura única)
- Modelos de ejemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidad: la configuración heredada de OpenClaw que usa `google/gemini-3.1-flash-preview` se normaliza a `google/gemini-3-flash-preview`
- Alias: se acepta `google/gemini-3.1-pro` y se normaliza al ID de la API Gemini en vivo de Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Razonamiento: `/think adaptive` usa el razonamiento dinámico de Google. Gemini 3/3.1 omiten un `thinkingLevel` fijo; Gemini 2.5 envía `thinkingBudget: -1`.
- Las ejecuciones directas de Gemini también aceptan `agents.defaults.models["google/<model>"].params.cachedContent` (o el heredado `cached_content`) para reenviar un identificador nativo del proveedor `cachedContents/...`; los aciertos de caché de Gemini aparecen como `cacheRead` de OpenClaw

### Google Vertex y Gemini CLI

- Proveedores: `google-vertex`, `google-gemini-cli`
- Autenticación: Vertex usa ADC de gcloud; Gemini CLI usa su flujo OAuth

<Warning>
Gemini CLI OAuth en OpenClaw es una integración no oficial. Algunos usuarios han informado restricciones de cuenta de Google después de usar clientes de terceros. Revisa los términos de Google y usa una cuenta no crítica si decides continuar.
</Warning>

Gemini CLI OAuth se distribuye como parte del plugin `google` incluido.

<Steps>
  <Step title="Install Gemini CLI">
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
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo predeterminado: `google-gemini-cli/gemini-3-flash-preview`. **No** pegues un ID de cliente ni un secreto en `openclaw.json`. El flujo de inicio de sesión de la CLI almacena tokens en perfiles de autenticación en el host del gateway.

  </Step>
  <Step title="Set project (if needed)">
    Si las solicitudes fallan después de iniciar sesión, define `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway.
  </Step>
</Steps>

Gemini CLI usa `stream-json` de forma predeterminada. OpenClaw lee los mensajes
del flujo del asistente y normaliza `stats.cached` en `cacheRead`; las
sobrescrituras heredadas de `--output-format json` aún leen el texto de respuesta desde `response`.

### Z.AI (GLM)

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- Modelo de ejemplo: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Las referencias de modelo usan el ID de proveedor canónico `zai/*`.
  - `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente; `zai-coding-global`, `zai-coding-cn`, `zai-global` y `zai-cn` fuerzan una superficie específica

### Vercel AI Gateway

- Proveedor: `vercel-ai-gateway`
- Autenticación: `AI_GATEWAY_API_KEY`
- Modelos de ejemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Otros plugins de proveedor incluidos

| Proveedor                               | Id                               | Entorno de autenticación                           | Modelo de ejemplo                                         |
| --------------------------------------- | -------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` o `OPENROUTER_API_KEY`           | `arcee/trinity-large-thinking`                            |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                 | `byteplus-plan/ark-code-latest`                           |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                 | `cerebras/zai-glm-4.7`                                    |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` o `CHUTES_OAUTH_TOKEN`            | `chutes/zai-org/GLM-4.7-TEE`                              |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                               | `clawrouter/anthropic/claude-sonnet-4-6`                  |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                   | `cohere/command-a-03-2025`                                |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                 |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                 | `deepseek/deepseek-v4-flash`                              |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                       |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                      | `gmi/google/gemini-3.1-flash-lite`                        |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                     | `groq/llama-3.3-70b-versatile`                            |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`               | `huggingface/deepseek-ai/DeepSeek-R1`                     |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`          | `minimax/MiniMax-M3`                                      |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                  | `mistral/mistral-large-latest`                            |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                 | `moonshot/kimi-k2.6`                                      |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                   | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                   | `novita/deepseek/deepseek-v3-0324`                        |
| [Ollama Cloud](/es/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                   | `ollama-cloud/kimi-k2.6`                                  |
| OpenRouter                              | `openrouter`                     | OAuth de OpenRouter o `OPENROUTER_API_KEY`         | `openrouter/auto`                                         |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                  | `qianfan/deepseek-v3.2`                                   |
| [Qwen OAuth](/es/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                     | `qwen-oauth/qwen3.5-plus`                                 |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                 | `tencent-tokenhub/hy3-preview`                            |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                 | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`        |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                   | -                                                         |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                               | `vercel-ai-gateway/anthropic/claude-opus-4.6`             |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                           | `volcengine-plan/ark-code-latest`                         |
| xAI                                     | `xai`                            | OAuth de SuperGrok/X Premium o `XAI_API_KEY`       | `xai/grok-4.3`                                            |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`     | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Particularidades que conviene conocer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica sus encabezados de atribución de aplicación y marcadores Anthropic `cache_control` solo en rutas `openrouter.ai` verificadas. Las referencias de DeepSeek, Moonshot y ZAI son aptas para TTL de caché para el almacenamiento en caché de prompts gestionado por OpenRouter, pero no reciben marcadores de caché de Anthropic. Como ruta compatible con OpenAI de estilo proxy, omite el modelado exclusivo de OpenAI nativo (`serviceTier`, Responses `store`, sugerencias de caché de prompts, compatibilidad de razonamiento de OpenAI). Las referencias respaldadas por Gemini conservan solo el saneamiento de firma de pensamiento de proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Las referencias respaldadas por Gemini siguen la misma ruta de saneamiento de proxy-Gemini; `kilocode/kilo/auto` y otras referencias sin soporte de razonamiento por proxy omiten la inyección de razonamiento por proxy.
  </Accordion>
  <Accordion title="MiniMax">
    La incorporación con clave de API escribe definiciones explícitas de modelos de chat M3 y M2.7; la comprensión de imágenes permanece en el proveedor multimedia `MiniMax-VL-01`, propiedad del plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Los ids de modelo usan un espacio de nombres `nvidia/<vendor>/<model>` (por ejemplo, `nvidia/nvidia/nemotron-...` junto a `nvidia/moonshotai/kimi-k2.5`); los selectores preservan la composición literal `<provider>/<model-id>`, mientras que la clave canónica enviada a la API permanece con un solo prefijo.
  </Accordion>
  <Accordion title="xAI">
    Usa la ruta Responses de xAI. La ruta recomendada es OAuth de SuperGrok/X Premium; las claves de API siguen funcionando mediante `XAI_API_KEY` o la configuración del plugin, y `web_search` de Grok reutiliza el mismo perfil de autenticación antes de recurrir a la clave de API. `grok-4.3` es el modelo de chat predeterminado incluido, y `grok-build-0.1` puede seleccionarse para trabajo enfocado en compilación/codificación. `/fast` o `params.fastMode: true` reescribe `grok-3`, `grok-3-mini`, `grok-4` y `grok-4-0709` a sus variantes `*-fast`. `tool_stream` está activado de forma predeterminada; desactívalo mediante `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Proveedores mediante `models.providers` (URL personalizada/base)

Usa `models.providers` (o `models.json`) para agregar proveedores **personalizados** o proxies compatibles con OpenAI/Anthropic.

Muchos de los plugins de proveedor incluidos a continuación ya publican un catálogo predeterminado. Usa entradas explícitas `models.providers.<id>` solo cuando quieras anular la URL base, los encabezados o la lista de modelos predeterminados.

Las comprobaciones de capacidades de modelos del Gateway también leen metadatos explícitos de `models.providers.<id>.models[]`. Si un modelo personalizado o proxy acepta imágenes, define `input: ["text", "image"]` en ese modelo para que WebChat y las rutas de adjuntos originadas en nodos pasen imágenes como entradas nativas del modelo en lugar de referencias multimedia solo de texto.

`agents.defaults.models["provider/model"]` solo controla la visibilidad del modelo, los alias y los metadatos por modelo para agentes. No registra por sí mismo un nuevo modelo de runtime. Para modelos de proveedores personalizados, agrega también `models.providers.<provider>.models[]` con al menos el `id` correspondiente.

### Moonshot AI (Kimi)

Instala `@openclaw/moonshot-provider` antes de la incorporación. Agrega una entrada explícita `models.providers.moonshot` solo cuando necesites anular la URL base o los metadatos del modelo:

- Proveedor: `moonshot`
- Autenticación: `MOONSHOT_API_KEY`
- Modelo de ejemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo Kimi K2:

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

Consulta [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot) para ver la guía de configuración completa.

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

Los `kimi/kimi-code` y `kimi/k2p5` heredados siguen aceptándose como IDs de modelo de compatibilidad y se normalizan al ID de modelo de API estable de Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) proporciona acceso a Doubao y otros modelos en China.

- Proveedor: `volcengine` (codificación: `volcengine-plan`)
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

La incorporación usa de forma predeterminada la superficie de codificación, pero el catálogo general `volcengine/*` se registra al mismo tiempo.

En los selectores de modelo de incorporación/configuración, la opción de autenticación de Volcengine prefiere las filas `volcengine/*` y `volcengine-plan/*`. Si esos modelos aún no están cargados, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

<Tabs>
  <Tab title="Modelos estándar">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="Modelos de codificación (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Internacional)

BytePlus ARK proporciona acceso a los mismos modelos que Volcano Engine para usuarios internacionales.

- Proveedor: `byteplus` (codificación: `byteplus-plan`)
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

La incorporación usa de forma predeterminada la superficie de codificación, pero el catálogo general `byteplus/*` se registra al mismo tiempo.

En los selectores de modelo de incorporación/configuración, la opción de autenticación de BytePlus prefiere las filas `byteplus/*` y `byteplus-plan/*`. Si esos modelos aún no están cargados, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

<Tabs>
  <Tab title="Modelos estándar">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modelos de codificación (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic proporciona modelos compatibles con Anthropic detrás del proveedor `synthetic`:

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

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Clave de API de MiniMax (Global): `--auth-choice minimax-global-api`
- Clave de API de MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` para `minimax-portal`

Consulta [/providers/minimax](/es/providers/minimax) para ver detalles de configuración, opciones de modelo y fragmentos de configuración.

<Note>
En la ruta de streaming compatible con Anthropic de MiniMax, OpenClaw desactiva el razonamiento de forma predeterminada para la familia M2.x, a menos que lo configures explícitamente; MiniMax-M3 (y M3.x) permanece de forma predeterminada en la ruta de razonamiento omitida/adaptativa del proveedor. `/fast on` reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.
</Note>

División de capacidades propiedad del Plugin:

- Los valores predeterminados de texto/chat permanecen en `minimax/MiniMax-M3`
- La generación de imágenes es `minimax/image-01` o `minimax-portal/image-01`
- La comprensión de imágenes es `MiniMax-VL-01` propiedad del Plugin en ambas rutas de autenticación de MiniMax
- La búsqueda web permanece en el ID de proveedor `minimax`

### LM Studio

LM Studio se entrega como un Plugin de proveedor incluido que usa la API nativa:

- Proveedor: `lmstudio`
- Autenticación: `LM_API_TOKEN`
- URL base de inferencia predeterminada: `http://localhost:1234/v1`

Luego configura un modelo (reemplázalo por uno de los IDs devueltos por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa `/api/v1/models` y `/api/v1/models/load` nativos de LM Studio para descubrimiento + carga automática, con `/v1/chat/completions` para inferencia de forma predeterminada. Si quieres que la carga JIT, TTL y expulsión automática de LM Studio sean propietarias del ciclo de vida del modelo, establece `models.providers.lmstudio.params.preload: false`. Consulta [/providers/lmstudio](/es/providers/lmstudio) para configuración y solución de problemas.

### Ollama

Ollama se entrega como un Plugin de proveedor incluido y usa la API nativa de Ollama:

- Proveedor: `ollama`
- Autenticación: Ninguna requerida (servidor local)
- Modelo de ejemplo: `ollama/llama3.3`
- Instalación: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama se detecta localmente en `http://127.0.0.1:11434` cuando aceptas usarlo con `OLLAMA_API_KEY`, y el Plugin de proveedor incluido agrega Ollama directamente a `openclaw onboard` y al selector de modelos. Consulta [/providers/ollama](/es/providers/ollama) para incorporación, modo cloud/local y configuración personalizada.

### vLLM

vLLM se entrega como un Plugin de proveedor incluido para servidores locales/autohospedados compatibles con OpenAI:

- Proveedor: `vllm`
- Autenticación: Opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:8000/v1`

Para aceptar el descubrimiento automático localmente (cualquier valor funciona si tu servidor no exige autenticación):

```bash
export VLLM_API_KEY="vllm-local"
```

Luego configura un modelo (reemplázalo por uno de los IDs devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulta [/providers/vllm](/es/providers/vllm) para más detalles.

### SGLang

SGLang se entrega como un Plugin de proveedor incluido para servidores rápidos autohospedados compatibles con OpenAI:

- Proveedor: `sglang`
- Autenticación: Opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:30000/v1`

Para aceptar el descubrimiento automático localmente (cualquier valor funciona si tu servidor no exige autenticación):

```bash
export SGLANG_API_KEY="sglang-local"
```

Luego configura un modelo (reemplázalo por uno de los IDs devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consulta [/providers/sglang](/es/providers/sglang) para más detalles.

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
    Para proveedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` y `maxTokens` son opcionales. Cuando se omiten, OpenClaw usa de forma predeterminada:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recomendado: establece valores explícitos que coincidan con los límites de tu proxy/modelo.

  </Accordion>
  <Accordion title="Reglas de conformación de rutas proxy">
    - Para `api: "openai-completions"` en endpoints no nativos (cualquier `baseUrl` no vacío cuyo host no sea `api.openai.com`), OpenClaw fuerza `compat.supportsDeveloperRole: false` para evitar errores 400 del proveedor por roles `developer` no admitidos.
    - Las rutas estilo proxy compatibles con OpenAI también omiten la conformación de solicitudes nativa exclusiva de OpenAI: sin `service_tier`, sin `store` de Responses, sin `store` de Completions, sin indicios de caché de prompts, sin conformación de payload de compatibilidad de razonamiento de OpenAI y sin encabezados ocultos de atribución de OpenClaw.
    - Para proxies de Completions compatibles con OpenAI que necesitan campos específicos del proveedor, configura `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) para fusionar JSON adicional en el cuerpo de la solicitud saliente.
    - Para controles de plantillas de chat de vLLM, configura `agents.defaults.models["provider/model"].params.chat_template_kwargs`. El Plugin vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true` para `vllm/nemotron-3-*` cuando el nivel de pensamiento de la sesión está desactivado.
    - Para modelos locales lentos o hosts LAN/tailnet remotos, configura `models.providers.<id>.timeoutSeconds`. Esto amplía el manejo de solicitudes HTTP del modelo del proveedor, incluida la conexión, los encabezados, la transmisión del cuerpo y la cancelación total de la obtención protegida, sin aumentar el tiempo de espera de todo el tiempo de ejecución del agente. Si `agents.defaults.timeoutSeconds` o un tiempo de espera específico de ejecución es menor, aumenta también ese límite; los tiempos de espera del proveedor no pueden ampliar toda la ejecución.
    - Las llamadas HTTP al proveedor de modelos permiten respuestas DNS de IP falsa de Surge, Clash y sing-box en `198.18.0.0/15` y `fc00::/7` solo para el nombre de host `baseUrl` del proveedor configurado. Los endpoints de proveedor personalizados/locales también confían en ese origen exacto `scheme://host:port` configurado para solicitudes de modelo protegidas, incluidos hosts de loopback, LAN y tailnet. Esto no es una opción de configuración nueva; el `baseUrl` que configuras amplía la política de solicitudes solo para ese origen. La asignación de nombres de host de IP falsa y la confianza de origen exacto son mecanismos independientes. Otros destinos privados, de loopback, link-local, de metadatos y puertos diferentes siguen requiriendo una activación explícita de `models.providers.<id>.request.allowPrivateNetwork: true`. Configura `models.providers.<id>.request.allowPrivateNetwork: false` para excluirte de la confianza de origen exacto.
    - Si `baseUrl` está vacío/se omite, OpenClaw conserva el comportamiento predeterminado de OpenAI (que resuelve a `api.openai.com`).
    - Por seguridad, un `compat.supportsDeveloperRole: true` explícito se sigue sobrescribiendo en endpoints `openai-completions` no nativos.
    - Para `api: "anthropic-messages"` en endpoints no directos (cualquier proveedor distinto del `anthropic` canónico, o un `models.providers.anthropic.baseUrl` personalizado cuyo host no sea un endpoint público de `api.anthropic.com`), OpenClaw suprime encabezados beta implícitos de Anthropic como `claude-code-20250219`, `interleaved-thinking-2025-05-14` y marcadores de OAuth, para que los proxies personalizados compatibles con Anthropic no rechacen banderas beta no admitidas. Configura `models.providers.<id>.headers["anthropic-beta"]` explícitamente si tu proxy necesita funciones beta específicas.

  </Accordion>
</AccordionGroup>

## Ejemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulta también: [Configuración](/es/gateway/configuration) para ver ejemplos completos de configuración.

## Relacionado

- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - claves de configuración de modelos
- [Conmutación por error de modelos](/es/concepts/model-failover) - cadenas de respaldo y comportamiento de reintentos
- [Modelos](/es/concepts/models) - configuración y alias de modelos
- [Proveedores](/es/providers) - guías de configuración por proveedor
