---
read_when:
    - Necesitas una referencia de configuración de modelos proveedor por proveedor
    - Quieres configuraciones de ejemplo o comandos de incorporación CLI para proveedores de modelos
summary: Resumen de proveedores de modelos con configuraciones de ejemplo + flujos de CLI
title: Proveedores de modelos
x-i18n:
    generated_at: "2026-04-24T05:25:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce2fc2b932ddc5d5b6066b70c4b0090868ad450e193f48d89daee9e65ceb9200
    source_path: concepts/model-providers.md
    workflow: 15
---

Esta página cubre los **proveedores de LLM/modelos** (no canales de chat como WhatsApp/Telegram).
Para las reglas de selección de modelos, consulta [/concepts/models](/es/concepts/models).

## Reglas rápidas

- Las referencias de modelo usan `provider/model` (ejemplo: `opencode/claude-opus-4-6`).
- `agents.defaults.models` actúa como lista de permitidos cuando está configurado.
- Ayudantes de CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` son metadatos nativos del modelo; `contextTokens` es el límite efectivo en runtime.
- Reglas de fallback, sondeos de cooldown y persistencia de sobrescrituras de sesión: [Failover de modelos](/es/concepts/model-failover).
- Las rutas de la familia OpenAI son específicas por prefijo: `openai/<model>` usa el proveedor directo con clave API de OpenAI en Pi, `openai-codex/<model>` usa OAuth de Codex en Pi, y `openai/<model>` más `agents.defaults.embeddedHarness.runtime: "codex"` usa el arnés nativo app-server de Codex. Consulta [OpenAI](/es/providers/openai)
  y [Arnés de Codex](/es/plugins/codex-harness).
- GPT-5.5 está disponible actualmente mediante rutas de suscripción/OAuth:
  `openai-codex/gpt-5.5` en Pi o `openai/gpt-5.5` con el arnés app-server de Codex. La ruta directa con clave API para `openai/gpt-5.5` será compatible cuando
  OpenAI habilite GPT-5.5 en la API pública; hasta entonces usa modelos habilitados para API
  como `openai/gpt-5.4` para configuraciones con `OPENAI_API_KEY`.

## Comportamiento del proveedor controlado por Plugin

La mayor parte de la lógica específica del proveedor vive en Plugins de proveedor (`registerProvider(...)`), mientras OpenClaw mantiene el bucle genérico de inferencia. Los Plugins controlan la incorporación, los catálogos de modelos, el mapeo de variables de entorno de autenticación, la normalización de transporte/configuración, la limpieza de esquemas de herramientas, la clasificación de failover, la actualización de OAuth, los informes de uso, los perfiles de thinking/reasoning y más.

La lista completa de Hooks del SDK de proveedores y ejemplos de Plugins incluidos está en [Plugins de proveedor](/es/plugins/sdk-provider-plugins). Un proveedor que necesite un ejecutor de solicitudes totalmente personalizado pertenece a una superficie de extensión distinta y más profunda.

<Note>
`capabilities` del runtime del proveedor son metadatos compartidos del runner (familia del proveedor, peculiaridades de transcript/herramientas, sugerencias de transporte/cache). No es lo mismo que el [modelo público de capacidades](/es/plugins/architecture#public-capability-model), que describe lo que registra un Plugin (inferencia de texto, voz, etc.).
</Note>

## Rotación de claves API

- Admite rotación genérica de proveedores para proveedores seleccionados.
- Configura varias claves mediante:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (sobrescritura live única, máxima prioridad)
  - `<PROVIDER>_API_KEYS` (lista separada por comas o punto y coma)
  - `<PROVIDER>_API_KEY` (clave principal)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por ejemplo `<PROVIDER>_API_KEY_1`)
- Para proveedores de Google, `GOOGLE_API_KEY` también se incluye como fallback.
- El orden de selección de claves conserva la prioridad y elimina valores duplicados.
- Las solicitudes se reintentan con la siguiente clave solo ante respuestas con límite de tasa (por
  ejemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` o mensajes periódicos de límite de uso).
- Los fallos que no sean por límite de tasa fallan de inmediato; no se intenta rotación de claves.
- Cuando fallan todas las claves candidatas, se devuelve el error final del último intento.

## Proveedores integrados (catálogo pi-ai)

OpenClaw incluye el catálogo pi-ai. Estos proveedores **no** requieren
configuración `models.providers`; solo configura la autenticación y elige un modelo.

### OpenAI

- Proveedor: `openai`
- Autenticación: `OPENAI_API_KEY`
- Rotación opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, además de `OPENCLAW_LIVE_OPENAI_KEY` (sobrescritura única)
- Modelos de ejemplo: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- El soporte directo de GPT-5.5 por API queda preparado aquí para cuando OpenAI exponga GPT-5.5 en la API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- El transporte predeterminado es `auto` (primero WebSocket, fallback a SSE)
- Sobrescríbelo por modelo mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- El warm-up de WebSocket de OpenAI Responses está habilitado de forma predeterminada mediante `params.openaiWsWarmup` (`true`/`false`)
- El procesamiento prioritario de OpenAI puede habilitarse mediante `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` y `params.fastMode` asignan solicitudes directas `openai/*` Responses a `service_tier=priority` en `api.openai.com`
- Usa `params.serviceTier` cuando quieras un nivel explícito en lugar del toggle compartido `/fast`
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`,
  `User-Agent`) se aplican solo al tráfico nativo de OpenAI hacia `api.openai.com`, no
  a proxies genéricos compatibles con OpenAI
- Las rutas nativas de OpenAI también conservan `store` de Responses, sugerencias de prompt-cache y
  la conformación de payloads de compatibilidad de reasoning de OpenAI; las rutas por proxy no
- `openai/gpt-5.3-codex-spark` se suprime intencionalmente en OpenClaw porque las solicitudes en vivo a la API de OpenAI lo rechazan y el catálogo actual de Codex no lo expone

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Proveedor: `anthropic`
- Autenticación: `ANTHROPIC_API_KEY`
- Rotación opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, además de `OPENCLAW_LIVE_ANTHROPIC_KEY` (sobrescritura única)
- Modelo de ejemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Las solicitudes públicas directas a Anthropic admiten el toggle compartido `/fast` y `params.fastMode`, incluyendo tráfico autenticado con clave API y OAuth enviado a `api.anthropic.com`; OpenClaw lo asigna a Anthropic `service_tier` (`auto` vs `standard_only`)
- Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso tipo Claude CLI de OpenClaw vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración, salvo que Anthropic publique una nueva política.
- El setup-token de Anthropic sigue disponible como ruta de token compatible en OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Proveedor: `openai-codex`
- Autenticación: OAuth (ChatGPT)
- Referencia de modelo PI: `openai-codex/gpt-5.5`
- Referencia nativa del arnés app-server de Codex: `openai/gpt-5.5` con `agents.defaults.embeddedHarness.runtime: "codex"`
- Referencias de modelos heredadas: `codex/gpt-*`
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- El transporte predeterminado es `auto` (primero WebSocket, fallback a SSE)
- Sobrescríbelo por modelo PI mediante `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` también se reenvía en solicitudes nativas de Codex Responses (`chatgpt.com/backend-api`)
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`,
  `User-Agent`) solo se adjuntan al tráfico nativo de Codex hacia
  `chatgpt.com/backend-api`, no a proxies genéricos compatibles con OpenAI
- Comparte el mismo toggle `/fast` y configuración `params.fastMode` que `openai/*` directo; OpenClaw lo asigna a `service_tier=priority`
- `openai-codex/gpt-5.5` conserva `contextWindow = 1000000` nativo y un `contextTokens = 272000` de runtime predeterminado; sobrescribe el límite de runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota de política: OpenAI Codex OAuth es explícitamente compatible para herramientas/flujos de trabajo externos como OpenClaw.
- El acceso actual a GPT-5.5 usa esta ruta de OAuth/suscripción hasta que OpenAI habilite GPT-5.5 en la API pública.

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

### Otras opciones alojadas estilo suscripción

- [Qwen Cloud](/es/providers/qwen): superficie del proveedor Qwen Cloud más asignación de endpoints de Alibaba DashScope y Coding Plan
- [MiniMax](/es/providers/minimax): acceso a MiniMax Coding Plan mediante OAuth o clave API
- [GLM Models](/es/providers/glm): Z.AI Coding Plan o endpoints generales de API

### OpenCode

- Autenticación: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Proveedor de runtime Zen: `opencode`
- Proveedor de runtime Go: `opencode-go`
- Modelos de ejemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (clave API)

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY`
- Rotación opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback a `GOOGLE_API_KEY` y `OPENCLAW_LIVE_GEMINI_KEY` (sobrescritura única)
- Modelos de ejemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidad: la configuración heredada de OpenClaw que usa `google/gemini-3.1-flash-preview` se normaliza a `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Las ejecuciones directas de Gemini también aceptan `agents.defaults.models["google/<model>"].params.cachedContent`
  (o el heredado `cached_content`) para reenviar un handle nativo del proveedor
  `cachedContents/...`; los aciertos de caché de Gemini aparecen como `cacheRead` en OpenClaw

### Google Vertex y Gemini CLI

- Proveedores: `google-vertex`, `google-gemini-cli`
- Autenticación: Vertex usa gcloud ADC; Gemini CLI usa su flujo OAuth
- Precaución: OAuth de Gemini CLI en OpenClaw es una integración no oficial. Algunos usuarios han informado restricciones de cuentas de Google después de usar clientes de terceros. Revisa las condiciones de Google y usa una cuenta no crítica si decides continuar.
- Gemini CLI OAuth se distribuye como parte del Plugin `google` incluido.
  - Instala Gemini CLI primero:
    - `brew install gemini-cli`
    - o `npm install -g @google/gemini-cli`
  - Habilitar: `openclaw plugins enable google`
  - Inicio de sesión: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo predeterminado: `google-gemini-cli/gemini-3-flash-preview`
  - Nota: **no** debes pegar un client id ni un secret en `openclaw.json`. El flujo de inicio de sesión de la CLI almacena
    tokens en perfiles de autenticación en el host Gateway.
  - Si las solicitudes fallan después del inicio de sesión, establece `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host Gateway.
  - Las respuestas JSON de Gemini CLI se analizan desde `response`; el uso recurre a
    `stats`, con `stats.cached` normalizado como `cacheRead` en OpenClaw.

### Z.AI (GLM)

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- Modelo de ejemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` y `z-ai/*` se normalizan a `zai/*`
  - `zai-api-key` detecta automáticamente el endpoint correspondiente de Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` y `zai-cn` fuerzan una superficie específica

### Vercel AI Gateway

- Proveedor: `vercel-ai-gateway`
- Autenticación: `AI_GATEWAY_API_KEY`
- Modelos de ejemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Proveedor: `kilocode`
- Autenticación: `KILOCODE_API_KEY`
- Modelo de ejemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- El catálogo estático de fallback incluye `kilocode/kilo/auto`; el descubrimiento en vivo de
  `https://api.kilo.ai/api/gateway/models` puede ampliar aún más el catálogo de runtime.
- El enrutamiento exacto upstream detrás de `kilocode/kilo/auto` es propiedad de Kilo Gateway,
  no está codificado rígidamente en OpenClaw.

Consulta [/providers/kilocode](/es/providers/kilocode) para obtener detalles de configuración.

### Otros Plugins de proveedor incluidos

| Proveedor              | Id                               | Variable de entorno de autenticación                         | Modelo de ejemplo                               |
| ---------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus               | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras               | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway  | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| GitHub Copilot         | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                   | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                         | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway           | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding            | `kimi`                           | `KIMI_API_KEY` o `KIMICODE_API_KEY`                          | `kimi/kimi-code`                                |
| MiniMax                | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot               | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                 | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter             | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud             | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together               | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                 | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway      | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                    | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                 | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Aspectos importantes que conviene conocer:

- **OpenRouter** aplica sus encabezados de atribución de aplicación y los marcadores `cache_control` de Anthropic solo en rutas verificadas de `openrouter.ai`. Como ruta de estilo proxy compatible con OpenAI, omite el modelado exclusivo de OpenAI nativo (`serviceTier`, `store` de Responses, sugerencias de prompt-cache y compatibilidad de reasoning de OpenAI). Las referencias respaldadas por Gemini solo conservan la sanitización de firmas de pensamiento de Gemini en modo proxy.
- **Kilo Gateway** sigue la misma ruta de sanitización de Gemini en modo proxy para referencias respaldadas por Gemini; `kilocode/kilo/auto` y otras referencias proxy sin compatibilidad con reasoning omiten la inyección de reasoning en proxy.
- **MiniMax**: la incorporación con clave API escribe definiciones explícitas de modelos M2.7 con `input: ["text", "image"]`; el catálogo incluido mantiene las referencias de chat como solo texto hasta que esa configuración se materializa.
- **xAI** usa la ruta xAI Responses. `/fast` o `params.fastMode: true` reescriben `grok-3`, `grok-3-mini`, `grok-4` y `grok-4-0709` a sus variantes `*-fast`. `tool_stream` viene activado de forma predeterminada; desactívalo con `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras**: los modelos GLM usan `zai-glm-4.7` / `zai-glm-4.6`; la URL base compatible con OpenAI es `https://api.cerebras.ai/v1`.

## Proveedores mediante `models.providers` (personalizado/base URL)

Usa `models.providers` (o `models.json`) para agregar proveedores **personalizados** o
proxies compatibles con OpenAI/Anthropic.

Muchos de los Plugins de proveedor incluidos a continuación ya publican un catálogo predeterminado.
Usa entradas explícitas `models.providers.<id>` solo cuando quieras sobrescribir la
URL base, los encabezados o la lista de modelos predeterminados.

### Moonshot AI (Kimi)

Moonshot se distribuye como Plugin de proveedor incluido. Usa el proveedor integrado de
forma predeterminada y agrega una entrada explícita `models.providers.moonshot` solo cuando
necesites sobrescribir la URL base o los metadatos del modelo:

- Proveedor: `moonshot`
- Autenticación: `MOONSHOT_API_KEY`
- Modelo de ejemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

Ids de modelo Kimi K2:

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

### Kimi Coding

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

El id de modelo heredado `kimi/k2p5` sigue aceptándose por compatibilidad.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) proporciona acceso a Doubao y otros modelos en China.

- Proveedor: `volcengine` (coding: `volcengine-plan`)
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

La incorporación usa de forma predeterminada la superficie de coding, pero el catálogo general `volcengine/*`
se registra al mismo tiempo.

En los selectores de modelos de incorporación/configuración, la opción de autenticación de Volcengine prefiere tanto
las filas `volcengine/*` como `volcengine-plan/*`. Si esos modelos aún no están cargados,
OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un
selector vacío limitado al proveedor.

Modelos disponibles:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modelos de coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (internacional)

BytePlus ARK proporciona acceso a los mismos modelos que Volcano Engine para usuarios internacionales.

- Proveedor: `byteplus` (coding: `byteplus-plan`)
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

La incorporación usa de forma predeterminada la superficie de coding, pero el catálogo general `byteplus/*`
se registra al mismo tiempo.

En los selectores de modelos de incorporación/configuración, la opción de autenticación de BytePlus prefiere tanto
las filas `byteplus/*` como `byteplus-plan/*`. Si esos modelos aún no están cargados,
OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un
selector vacío limitado al proveedor.

Modelos disponibles:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modelos de coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

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

- MiniMax OAuth (global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Clave API de MiniMax (global): `--auth-choice minimax-global-api`
- Clave API de MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o
  `MINIMAX_API_KEY` para `minimax-portal`

Consulta [/providers/minimax](/es/providers/minimax) para ver detalles de configuración, opciones de modelo y fragmentos de configuración.

En la ruta de streaming compatible con Anthropic de MiniMax, OpenClaw desactiva thinking de
forma predeterminada a menos que lo configures explícitamente, y `/fast on` reescribe
`MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.

Separación de capacidades controlada por Plugin:

- Los valores predeterminados de texto/chat permanecen en `minimax/MiniMax-M2.7`
- La generación de imágenes es `minimax/image-01` o `minimax-portal/image-01`
- La comprensión de imágenes usa `MiniMax-VL-01`, controlado por Plugin, en ambas rutas de autenticación de MiniMax
- La búsqueda web permanece en el id de proveedor `minimax`

### LM Studio

LM Studio se distribuye como Plugin de proveedor incluido y usa la API nativa:

- Proveedor: `lmstudio`
- Autenticación: `LM_API_TOKEN`
- URL base de inferencia predeterminada: `http://localhost:1234/v1`

Después, configura un modelo (sustituye por uno de los ids devueltos por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa `/api/v1/models` y `/api/v1/models/load` nativos de LM Studio para descubrimiento + carga automática, con `/v1/chat/completions` para inferencia de forma predeterminada.
Consulta [/providers/lmstudio](/es/providers/lmstudio) para configuración y solución de problemas.

### Ollama

Ollama se distribuye como Plugin de proveedor incluido y usa la API nativa de Ollama:

- Proveedor: `ollama`
- Autenticación: no se requiere (servidor local)
- Modelo de ejemplo: `ollama/llama3.3`
- Instalación: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instala Ollama y luego descarga un modelo:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama se detecta localmente en `http://127.0.0.1:11434` cuando habilitas
`OLLAMA_API_KEY`, y el Plugin de proveedor incluido agrega Ollama directamente a
`openclaw onboard` y al selector de modelos. Consulta [/providers/ollama](/es/providers/ollama)
para incorporación, modo cloud/local y configuración personalizada.

### vLLM

vLLM se distribuye como Plugin de proveedor incluido para servidores locales/autoalojados
compatibles con OpenAI:

- Proveedor: `vllm`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:8000/v1`

Para habilitar la detección automática localmente (cualquier valor sirve si tu servidor no exige autenticación):

```bash
export VLLM_API_KEY="vllm-local"
```

Después, configura un modelo (sustituye por uno de los ids devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulta [/providers/vllm](/es/providers/vllm) para más detalles.

### SGLang

SGLang se distribuye como Plugin de proveedor incluido para servidores rápidos autoalojados
compatibles con OpenAI:

- Proveedor: `sglang`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:30000/v1`

Para habilitar la detección automática localmente (cualquier valor sirve si tu servidor no
exige autenticación):

```bash
export SGLANG_API_KEY="sglang-local"
```

Después, configura un modelo (sustituye por uno de los ids devueltos por `/v1/models`):

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

Notas:

- Para proveedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` y `maxTokens` son opcionales.
  Cuando se omiten, OpenClaw usa estos valores predeterminados:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: establece valores explícitos que coincidan con los límites de tu proxy/modelo.
- Para `api: "openai-completions"` en endpoints no nativos (cualquier `baseUrl` no vacío cuyo host no sea `api.openai.com`), OpenClaw fuerza `compat.supportsDeveloperRole: false` para evitar errores 400 del proveedor por roles `developer` no compatibles.
- Las rutas de estilo proxy compatibles con OpenAI también omiten el modelado de solicitudes exclusivo de OpenAI nativo: sin `service_tier`, sin `store` de Responses, sin sugerencias de prompt-cache, sin conformación de payloads de compatibilidad de reasoning de OpenAI y sin encabezados ocultos de atribución de OpenClaw.
- Si `baseUrl` está vacío o se omite, OpenClaw mantiene el comportamiento predeterminado de OpenAI (que resuelve a `api.openai.com`).
- Por seguridad, una configuración explícita `compat.supportsDeveloperRole: true` sigue siendo sobrescrita en endpoints `openai-completions` no nativos.

## Ejemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulta también: [/gateway/configuration](/es/gateway/configuration) para ver ejemplos completos de configuración.

## Relacionado

- [Modelos](/es/concepts/models) — configuración de modelos y alias
- [Failover de modelos](/es/concepts/model-failover) — cadenas de fallback y comportamiento de reintento
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Providers](/es/providers) — guías de configuración por proveedor
