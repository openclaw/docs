---
read_when:
    - Necesitas una referencia de configuración de modelos por proveedor
    - Quieres configuraciones de ejemplo o comandos de incorporación de la CLI para proveedores de modelos
sidebarTitle: Model providers
summary: Descripción general de proveedores de modelos con configuraciones de ejemplo + flujos de CLI
title: Proveedores de modelos
x-i18n:
    generated_at: "2026-04-30T05:37:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3902194674d6d4e17a8477c28addb39b8e04c3b498eb6a0305e82c2f1b5d737e
    source_path: concepts/model-providers.md
    workflow: 16
---

Referencia para **proveedores de LLM/modelos** (no canales de chat como WhatsApp/Telegram). Para las reglas de selección de modelos, consulta [Modelos](/es/concepts/models).

## Reglas rápidas

<AccordionGroup>
  <Accordion title="Referencias de modelos y ayudantes de CLI">
    - Las referencias de modelos usan `provider/model` (ejemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` actúa como una lista de permitidos cuando se configura.
    - Ayudantes de CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` configuran valores predeterminados a nivel de proveedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` los sobrescriben por modelo.
    - Reglas de respaldo, sondeos de enfriamiento y persistencia de sobrescrituras de sesión: [Conmutación por error de modelos](/es/concepts/model-failover).

  </Accordion>
  <Accordion title="Separación entre proveedor/runtime de OpenAI">
    Las rutas de la familia OpenAI son específicas por prefijo:

    - `openai/<model>` usa el proveedor directo con clave de API de OpenAI en PI.
    - `openai-codex/<model>` usa OAuth de Codex en PI.
    - `openai/<model>` más `agents.defaults.agentRuntime.id: "codex"` usa el harness nativo de servidor de aplicación de Codex.

    Consulta [OpenAI](/es/providers/openai) y [harness de Codex](/es/plugins/codex-harness). Si la separación entre proveedor/runtime resulta confusa, lee primero [Runtimes de agente](/es/concepts/agent-runtimes).

    La habilitación automática de Plugin sigue el mismo límite: `openai-codex/<model>` pertenece al Plugin de OpenAI, mientras que el Plugin de Codex se habilita mediante `agentRuntime.id: "codex"` o referencias heredadas `codex/<model>`.

    GPT-5.5 está disponible mediante `openai/gpt-5.5` para tráfico directo con clave de API, `openai-codex/gpt-5.5` en PI para OAuth de Codex y el harness nativo de servidor de aplicación de Codex cuando se configura `agentRuntime.id: "codex"`.

  </Accordion>
  <Accordion title="Runtimes de CLI">
    Los runtimes de CLI usan la misma separación: elige referencias de modelo canónicas como `anthropic/claude-*`, `google/gemini-*` u `openai/gpt-*`, y luego configura `agents.defaults.agentRuntime.id` como `claude-cli`, `google-gemini-cli` o `codex-cli` cuando quieras un backend de CLI local.

    Las referencias heredadas `claude-cli/*`, `google-gemini-cli/*` y `codex-cli/*` migran de vuelta a referencias de proveedor canónicas con el runtime registrado por separado.

  </Accordion>
</AccordionGroup>

## Comportamiento de proveedores propiedad de Plugins

La mayor parte de la lógica específica de proveedor vive en Plugins de proveedor (`registerProvider(...)`), mientras OpenClaw conserva el bucle genérico de inferencia. Los Plugins son propietarios de la incorporación, los catálogos de modelos, la asignación de variables de entorno de autenticación, la normalización de transporte/configuración, la limpieza de esquemas de herramientas, la clasificación de conmutación por error, la actualización de OAuth, los informes de uso, los perfiles de pensamiento/razonamiento y más.

La lista completa de hooks del SDK de proveedores y ejemplos de Plugins incluidos está en [Plugins de proveedor](/es/plugins/sdk-provider-plugins). Un proveedor que necesita un ejecutor de solicitudes totalmente personalizado es una superficie de extensión separada y más profunda.

<Note>
El comportamiento del ejecutor propiedad del proveedor vive en hooks explícitos del proveedor, como la política de reproducción, la normalización de esquemas de herramientas, el envoltorio de streams y los ayudantes de transporte/solicitud. La bolsa estática heredada `ProviderPlugin.capabilities` es solo de compatibilidad y la lógica compartida del ejecutor ya no la lee.
</Note>

## Rotación de claves de API

<AccordionGroup>
  <Accordion title="Orígenes y prioridad de claves">
    Configura varias claves mediante:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (sobrescritura live única, prioridad más alta)
    - `<PROVIDER>_API_KEYS` (lista separada por comas o punto y coma)
    - `<PROVIDER>_API_KEY` (clave principal)
    - `<PROVIDER>_API_KEY_*` (lista numerada, p. ej. `<PROVIDER>_API_KEY_1`)

    Para proveedores de Google, `GOOGLE_API_KEY` también se incluye como respaldo. El orden de selección de claves conserva la prioridad y deduplica los valores.

  </Accordion>
  <Accordion title="Cuándo se activa la rotación">
    - Las solicitudes se reintentan con la siguiente clave solo ante respuestas de límite de tasa (por ejemplo, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o mensajes periódicos de límite de uso).
    - Los fallos que no sean de límite de tasa fallan inmediatamente; no se intenta la rotación de claves.
    - Cuando todas las claves candidatas fallan, se devuelve el error final del último intento.

  </Accordion>
</AccordionGroup>

## Proveedores integrados (catálogo pi-ai)

OpenClaw incluye el catálogo pi‑ai. Estos proveedores **no** requieren configuración de `models.providers`; basta con configurar la autenticación y elegir un modelo.

### OpenAI

- Proveedor: `openai`
- Autenticación: `OPENAI_API_KEY`
- Rotación opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, más `OPENCLAW_LIVE_OPENAI_KEY` (anulación única)
- Modelos de ejemplo: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifica la disponibilidad de la cuenta/modelo con `openclaw models list --provider openai` si una instalación o clave de API específica se comporta de forma diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- El transporte predeterminado es `auto` (WebSocket primero, respaldo SSE)
- Anula por modelo mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- El calentamiento de WebSocket de OpenAI Responses está habilitado de forma predeterminada mediante `params.openaiWsWarmup` (`true`/`false`)
- El procesamiento prioritario de OpenAI se puede habilitar mediante `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` y `params.fastMode` asignan las solicitudes directas de Responses `openai/*` a `service_tier=priority` en `api.openai.com`
- Usa `params.serviceTier` cuando quieras un nivel explícito en lugar del interruptor compartido `/fast`
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) se aplican solo al tráfico nativo de OpenAI hacia `api.openai.com`, no a proxies genéricos compatibles con OpenAI
- Las rutas nativas de OpenAI también conservan `store` de Responses, indicaciones de caché de prompts y conformación de cargas de compatibilidad con razonamiento de OpenAI; las rutas de proxy no lo hacen
- `openai/gpt-5.3-codex-spark` se suprime intencionalmente en OpenClaw porque las solicitudes en vivo a la API de OpenAI lo rechazan y el catálogo actual de Codex no lo expone

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
- Las solicitudes públicas directas de Anthropic admiten el interruptor compartido `/fast` y `params.fastMode`, incluido el tráfico autenticado con clave de API y OAuth enviado a `api.anthropic.com`; OpenClaw lo asigna al `service_tier` de Anthropic (`auto` frente a `standard_only`)
- La configuración preferida de Claude CLI conserva la referencia del modelo canónica y selecciona el backend de CLI por separado: `anthropic/claude-opus-4-7` con `agents.defaults.agentRuntime.id: "claude-cli"`. Las referencias heredadas `claude-cli/claude-opus-4-7` siguen funcionando por compatibilidad.

<Note>
El personal de Anthropic nos dijo que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración, a menos que Anthropic publique una nueva política. El token de configuración de Anthropic sigue disponible como ruta de token compatible de OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Proveedor: `openai-codex`
- Autenticación: OAuth (ChatGPT)
- Referencia de modelo PI: `openai-codex/gpt-5.5`
- Referencia del arnés nativo del servidor de aplicaciones Codex: `openai/gpt-5.5` con `agents.defaults.agentRuntime.id: "codex"`
- Documentación del arnés nativo del servidor de aplicaciones Codex: [arnés de Codex](/es/plugins/codex-harness)
- Referencias de modelo heredadas: `codex/gpt-*`
- Límite del Plugin: `openai-codex/*` carga el Plugin de OpenAI; el Plugin nativo del servidor de aplicaciones Codex se selecciona solo por el runtime del arnés de Codex o por referencias heredadas `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- El transporte predeterminado es `auto` (WebSocket primero, respaldo SSE)
- Anula por modelo PI mediante `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` también se reenvía en solicitudes nativas de Responses de Codex (`chatgpt.com/backend-api`)
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) solo se adjuntan al tráfico nativo de Codex hacia `chatgpt.com/backend-api`, no a proxies genéricos compatibles con OpenAI
- Comparte la misma configuración del interruptor `/fast` y `params.fastMode` que `openai/*` directo; OpenClaw lo asigna a `service_tier=priority`
- `openai-codex/gpt-5.5` usa el `contextWindow = 400000` nativo del catálogo de Codex y el runtime predeterminado `contextTokens = 272000`; anula el límite del runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota de política: OpenAI Codex OAuth está explícitamente admitido para herramientas/flujos de trabajo externos como OpenClaw.
- Usa `openai-codex/gpt-5.5` cuando quieras la ruta de OAuth/suscripción de Codex; usa `openai/gpt-5.5` cuando tu configuración con clave de API y catálogo local expongan la ruta de API pública.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Otras opciones alojadas de estilo suscripción

<CardGroup cols={3}>
  <Card title="Modelos GLM" href="/es/providers/glm">
    Plan de codificación de Z.AI o endpoints generales de API.
  </Card>
  <Card title="MiniMax" href="/es/providers/minimax">
    Acceso OAuth del plan de codificación de MiniMax o mediante clave de API.
  </Card>
  <Card title="Qwen Cloud" href="/es/providers/qwen">
    Superficie del proveedor Qwen Cloud más la asignación de endpoints de Alibaba DashScope y del plan de codificación.
  </Card>
</CardGroup>

### OpenCode

- Autenticación: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Proveedor del runtime Zen: `opencode`
- Proveedor del runtime Go: `opencode-go`
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
- Rotación opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, respaldo `GOOGLE_API_KEY` y `OPENCLAW_LIVE_GEMINI_KEY` (anulación única)
- Modelos de ejemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidad: la configuración heredada de OpenClaw que usa `google/gemini-3.1-flash-preview` se normaliza a `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` se acepta y se normaliza al id de la API Gemini en vivo de Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Pensamiento: `/think adaptive` usa pensamiento dinámico de Google. Gemini 3/3.1 omite un `thinkingLevel` fijo; Gemini 2.5 envía `thinkingBudget: -1`.
- Las ejecuciones directas de Gemini también aceptan `agents.defaults.models["google/<model>"].params.cachedContent` (o el heredado `cached_content`) para reenviar un identificador nativo del proveedor `cachedContents/...`; los aciertos de caché de Gemini aparecen como `cacheRead` de OpenClaw

### Google Vertex y Gemini CLI

- Proveedores: `google-vertex`, `google-gemini-cli`
- Autenticación: Vertex usa ADC de gcloud; Gemini CLI usa su flujo OAuth

<Warning>
Gemini CLI OAuth en OpenClaw es una integración no oficial. Algunos usuarios han informado restricciones de cuentas de Google después de usar clientes de terceros. Revisa los términos de Google y usa una cuenta no crítica si decides continuar.
</Warning>

Gemini CLI OAuth se distribuye como parte del Plugin `google` incluido.

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
  <Step title="Habilitar Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Iniciar sesión">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo predeterminado: `google-gemini-cli/gemini-3-flash-preview`. No debes pegar un ID de cliente ni un secreto en `openclaw.json`. El flujo de inicio de sesión de la CLI almacena los tokens en perfiles de autenticación en el host del Gateway.

  </Step>
  <Step title="Set project (if needed)">
    Si las solicitudes fallan después del inicio de sesión, configura `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway.
  </Step>
</Steps>

Las respuestas JSON de Gemini CLI se analizan desde `response`; el uso recurre a `stats`, con `stats.cached` normalizado a `cacheRead` de OpenClaw.

### Z.AI (GLM)

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- Modelo de ejemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` y `z-ai/*` se normalizan a `zai/*`
  - `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente; `zai-coding-global`, `zai-coding-cn`, `zai-global` y `zai-cn` fuerzan una superficie específica

### Vercel AI Gateway

- Proveedor: `vercel-ai-gateway`
- Autenticación: `AI_GATEWAY_API_KEY`
- Modelos de ejemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Proveedor: `kilocode`
- Autenticación: `KILOCODE_API_KEY`
- Modelo de ejemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- El catálogo de respaldo estático incluye `kilocode/kilo/auto`; la detección en vivo de `https://api.kilo.ai/api/gateway/models` puede ampliar aún más el catálogo en tiempo de ejecución.
- El enrutamiento upstream exacto detrás de `kilocode/kilo/auto` es propiedad de Kilo Gateway, no está codificado de forma fija en OpenClaw.

Consulta [/providers/kilocode](/es/providers/kilocode) para ver los detalles de configuración.

### Otros plugins de proveedor incluidos

| Proveedor               | Id                               | Entorno de autenticación                                    | Modelo de ejemplo                            |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                         | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` o `KIMICODE_API_KEY`                          | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                  |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Particularidades que conviene conocer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica sus encabezados de atribución de aplicación y marcadores `cache_control` de Anthropic solo en rutas `openrouter.ai` verificadas. Las referencias de DeepSeek, Moonshot y ZAI son aptas para TTL de caché para el almacenamiento en caché de prompts gestionado por OpenRouter, pero no reciben marcadores de caché de Anthropic. Como ruta de estilo proxy compatible con OpenAI, omite el modelado exclusivo de OpenAI nativo (`serviceTier`, `store` de Responses, sugerencias de caché de prompts, compatibilidad de razonamiento con OpenAI). Las referencias respaldadas por Gemini mantienen solo el saneamiento de firmas de pensamiento de proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Las referencias respaldadas por Gemini siguen la misma ruta de saneamiento de proxy-Gemini; `kilocode/kilo/auto` y otras referencias de proxy sin soporte de razonamiento omiten la inyección de razonamiento de proxy.
  </Accordion>
  <Accordion title="MiniMax">
    La incorporación con clave de API escribe definiciones explícitas de modelos de chat M2.7 solo de texto; la comprensión de imágenes permanece en el proveedor de medios `MiniMax-VL-01` propiedad del Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Los ID de modelo usan un espacio de nombres `nvidia/<vendor>/<model>` (por ejemplo, `nvidia/nvidia/nemotron-...` junto con `nvidia/moonshotai/kimi-k2.5`); los selectores conservan la composición literal `<provider>/<model-id>` mientras que la clave canónica enviada a la API permanece con un solo prefijo.
  </Accordion>
  <Accordion title="xAI">
    Usa la ruta Responses de xAI. `/fast` o `params.fastMode: true` reescribe `grok-3`, `grok-3-mini`, `grok-4` y `grok-4-0709` a sus variantes `*-fast`. `tool_stream` está activado de forma predeterminada; desactívalo con `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Se distribuye como el Plugin de proveedor `cerebras` incluido. GLM usa `zai-glm-4.7`; la URL base compatible con OpenAI es `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Proveedores mediante `models.providers` (URL personalizada/base)

Usa `models.providers` (o `models.json`) para agregar proveedores **personalizados** o proxies compatibles con OpenAI/Anthropic.

Muchos de los plugins de proveedor incluidos a continuación ya publican un catálogo predeterminado. Usa entradas explícitas `models.providers.<id>` solo cuando quieras anular la URL base predeterminada, los encabezados o la lista de modelos.

Las comprobaciones de capacidad de modelos del Gateway también leen metadatos explícitos de `models.providers.<id>.models[]`. Si un modelo personalizado o proxy acepta imágenes, establece `input: ["text", "image"]` en ese modelo para que las rutas de adjuntos de WebChat y de origen Node pasen imágenes como entradas nativas del modelo en lugar de referencias multimedia solo de texto.

### Moonshot AI (Kimi)

Moonshot se distribuye como un Plugin de proveedor incluido. Usa el proveedor integrado de forma predeterminada y agrega una entrada explícita `models.providers.moonshot` solo cuando necesites anular la URL base o los metadatos del modelo:

- Proveedor: `moonshot`
- Autenticación: `MOONSHOT_API_KEY`
- Modelo de ejemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

ID de modelo de Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
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

### Programación con Kimi

Kimi Coding usa el endpoint compatible con Anthropic de Moonshot AI:

- Proveedor: `kimi`
- Autenticación: `KIMI_API_KEY`
- Modelo de ejemplo: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

El `kimi/k2p5` heredado sigue aceptándose como id de modelo de compatibilidad.

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

En los selectores de modelo de incorporación/configuración, la opción de autenticación de Volcengine prefiere tanto las filas `volcengine/*` como `volcengine-plan/*`. Si esos modelos aún no se han cargado, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Internacional)

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

En los selectores de modelos de incorporación/configuración, la opción de autenticación de BytePlus prefiere tanto las filas `byteplus/*` como `byteplus-plan/*`. Si esos modelos aún no están cargados, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
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

MiniMax se configura mediante `models.providers` porque utiliza endpoints personalizados:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` para `minimax-portal`

Consulta [/providers/minimax](/es/providers/minimax) para ver detalles de configuración, opciones de modelos y fragmentos de configuración.

<Note>
En la ruta de streaming compatible con Anthropic de MiniMax, OpenClaw desactiva el razonamiento de forma predeterminada a menos que lo configures explícitamente, y `/fast on` reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
</Note>

Separación de capacidades propiedad del plugin:

- Los valores predeterminados de texto/chat permanecen en `minimax/MiniMax-M2.7`
- La generación de imágenes es `minimax/image-01` o `minimax-portal/image-01`
- La comprensión de imágenes es `MiniMax-VL-01`, propiedad del plugin, en ambas rutas de autenticación de MiniMax
- La búsqueda web permanece en el id de proveedor `minimax`

### LM Studio

LM Studio se distribuye como un plugin de proveedor incluido que utiliza la API nativa:

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

OpenClaw utiliza `/api/v1/models` y `/api/v1/models/load` nativos de LM Studio para descubrimiento y carga automática, con `/v1/chat/completions` para inferencia de forma predeterminada. Consulta [/providers/lmstudio](/es/providers/lmstudio) para configuración y solución de problemas.

### Ollama

Ollama se distribuye como un plugin de proveedor incluido y utiliza la API nativa de Ollama:

- Proveedor: `ollama`
- Autenticación: No se requiere ninguna (servidor local)
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

Ollama se detecta localmente en `http://127.0.0.1:11434` cuando optas por usarlo con `OLLAMA_API_KEY`, y el plugin de proveedor incluido añade Ollama directamente a `openclaw onboard` y al selector de modelos. Consulta [/providers/ollama](/es/providers/ollama) para incorporación, modo nube/local y configuración personalizada.

### vLLM

vLLM se distribuye como un plugin de proveedor incluido para servidores locales/autohospedados compatibles con OpenAI:

- Proveedor: `vllm`
- Autenticación: Opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:8000/v1`

Para optar por el descubrimiento automático localmente (cualquier valor funciona si tu servidor no exige autenticación):

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

Consulta [/providers/vllm](/es/providers/vllm) para obtener más detalles.

### SGLang

SGLang se distribuye como un plugin de proveedor incluido para servidores rápidos autohospedados compatibles con OpenAI:

- Proveedor: `sglang`
- Autenticación: Opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:30000/v1`

Para optar por el descubrimiento automático localmente (cualquier valor funciona si tu servidor no exige autenticación):

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

Consulta [/providers/sglang](/es/providers/sglang) para obtener más detalles.

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
  <Accordion title="Default optional fields">
    Para proveedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` y `maxTokens` son opcionales. Cuando se omiten, OpenClaw usa estos valores predeterminados:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recomendado: configura valores explícitos que coincidan con los límites de tu proxy/modelo.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Para `api: "openai-completions"` en endpoints no nativos (cualquier `baseUrl` no vacío cuyo host no sea `api.openai.com`), OpenClaw fuerza `compat.supportsDeveloperRole: false` para evitar errores 400 del proveedor por roles `developer` no admitidos.
    - Las rutas estilo proxy compatibles con OpenAI también omiten la adaptación de solicitudes exclusiva de OpenAI nativo: sin `service_tier`, sin Responses `store`, sin Completions `store`, sin sugerencias de caché de prompts, sin adaptación de payload de compatibilidad de razonamiento de OpenAI y sin encabezados ocultos de atribución de OpenClaw.
    - Para proxies de Completions compatibles con OpenAI que necesitan campos específicos del proveedor, configura `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) para fusionar JSON adicional en el cuerpo de la solicitud saliente.
    - Para controles de plantillas de chat de vLLM, configura `agents.defaults.models["provider/model"].params.chat_template_kwargs`. El plugin vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true` para `vllm/nemotron-3-*` cuando el nivel de razonamiento de la sesión está desactivado.
    - Para modelos locales lentos o hosts remotos de LAN/tailnet, configura `models.providers.<id>.timeoutSeconds`. Esto amplía el manejo de solicitudes HTTP del modelo del proveedor, incluida la conexión, los encabezados, el streaming del cuerpo y la cancelación total de guarded-fetch, sin aumentar el tiempo de espera de todo el runtime del agente.
    - Si `baseUrl` está vacío/se omite, OpenClaw conserva el comportamiento predeterminado de OpenAI (que resuelve a `api.openai.com`).
    - Por seguridad, un `compat.supportsDeveloperRole: true` explícito se sobrescribe igualmente en endpoints `openai-completions` no nativos.
    - Para `api: "anthropic-messages"` en endpoints no directos (cualquier proveedor distinto del `anthropic` canónico, o un `models.providers.anthropic.baseUrl` personalizado cuyo host no sea un endpoint público de `api.anthropic.com`), OpenClaw suprime encabezados beta implícitos de Anthropic como `claude-code-20250219`, `interleaved-thinking-2025-05-14` y marcadores OAuth, para que los proxies personalizados compatibles con Anthropic no rechacen flags beta no admitidos. Configura `models.providers.<id>.headers["anthropic-beta"]` explícitamente si tu proxy necesita funciones beta específicas.

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

- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de respaldo y comportamiento de reintento
- [Modelos](/es/concepts/models) — configuración de modelos y alias
- [Proveedores](/es/providers) — guías de configuración por proveedor
