---
read_when:
    - Necesitas una referencia de configuración de modelos por proveedor
    - Quieres configuraciones de ejemplo o comandos de incorporación de CLI para proveedores de modelos
sidebarTitle: Model providers
summary: Descripción general del proveedor de modelos con configuraciones de ejemplo y flujos de CLI
title: Proveedores de modelos
x-i18n:
    generated_at: "2026-06-27T11:15:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

Referencia para **proveedores de LLM/modelos** (no canales de chat como WhatsApp/Telegram). Para las reglas de selección de modelos, consulta [Modelos](/es/concepts/models).

## Reglas rápidas

<AccordionGroup>
  <Accordion title="Referencias de modelos y ayudas de la CLI">
    - Las referencias de modelo usan `provider/model` (ejemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` actúa como una lista de permitidos cuando se establece.
    - Ayudas de la CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` establecen valores predeterminados a nivel de proveedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` los anulan por modelo.
    - Reglas de fallback, sondeos de enfriamiento y persistencia de anulaciones de sesión: [Conmutación por error de modelos](/es/concepts/model-failover).

  </Accordion>
  <Accordion title="Agregar autenticación de proveedor no cambia tu modelo principal">
    `openclaw configure` conserva un `agents.defaults.model.primary` existente cuando agregas o vuelves a autenticar un proveedor. `openclaw models auth login` hace lo mismo a menos que pases `--set-default`. Los Plugins de proveedor aún pueden devolver un modelo predeterminado recomendado en su parche de configuración de autenticación, pero OpenClaw lo trata como "hacer que este modelo esté disponible" cuando ya existe un modelo principal, no como "reemplazar el modelo principal actual".

    Para cambiar intencionalmente el modelo predeterminado, usa `openclaw models set <provider/model>` o `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Separación entre proveedor y runtime de OpenAI">
    Las rutas de la familia OpenAI son específicas por prefijo:

    - `openai/<model>` usa de forma predeterminada el arnés nativo de servidor de aplicación Codex para turnos de agente. Esta es la configuración habitual de suscripción a ChatGPT/Codex.
    - las referencias heredadas de modelos Codex son configuración heredada que doctor reescribe a `openai/<model>`.
    - `openai/<model>` más `agentRuntime.id: "openclaw"` de proveedor/modelo usa el runtime integrado de OpenClaw para rutas explícitas de clave de API o compatibilidad.

    Consulta [OpenAI](/es/providers/openai) y [arnés de Codex](/es/plugins/codex-harness). Si la separación entre proveedor y runtime resulta confusa, lee primero [Runtimes de agente](/es/concepts/agent-runtimes).

    La activación automática de Plugins sigue el mismo límite: las referencias de agente `openai/*` habilitan el Plugin de Codex para la ruta predeterminada, y `agentRuntime.id: "codex"` explícito de proveedor/modelo o referencias heredadas `codex/<model>` también lo requieren.

    GPT-5.5 está disponible de forma predeterminada mediante el arnés nativo de servidor de aplicación Codex en `openai/gpt-5.5`, y mediante el runtime de OpenClaw cuando la política de runtime de proveedor/modelo selecciona explícitamente `openclaw`.

  </Accordion>
  <Accordion title="Runtimes de CLI">
    Los runtimes de CLI usan la misma separación: elige referencias de modelo canónicas como `anthropic/claude-*` o `google/gemini-*`, y luego establece la política de runtime de proveedor/modelo en `claude-cli` o `google-gemini-cli` cuando quieras un backend de CLI local.

    Las referencias heredadas `claude-cli/*` y `google-gemini-cli/*` migran de vuelta a referencias canónicas de proveedor con el runtime registrado por separado. Las referencias heredadas `codex-cli/*` migran a `openai/*` y usan la ruta de servidor de aplicación Codex; OpenClaw ya no conserva un backend de CLI Codex incluido.

  </Accordion>
</AccordionGroup>

## Comportamiento de proveedor propiedad del Plugin

La mayor parte de la lógica específica de proveedor vive en Plugins de proveedor (`registerProvider(...)`), mientras OpenClaw mantiene el bucle de inferencia genérico. Los Plugins son dueños de la incorporación, catálogos de modelos, asignación de variables de entorno de autenticación, normalización de transporte/configuración, limpieza de esquemas de herramientas, clasificación de conmutación por error, actualización de OAuth, informes de uso, perfiles de pensamiento/razonamiento y más.

La lista completa de hooks del SDK de proveedor y ejemplos de Plugins incluidos está en [Plugins de proveedor](/es/plugins/sdk-provider-plugins). Un proveedor que necesita un ejecutor de solicitudes totalmente personalizado es una superficie de extensión separada y más profunda.

<Note>
El comportamiento del runner propiedad del proveedor vive en hooks explícitos de proveedor, como política de reproducción, normalización de esquemas de herramientas, envoltura de streams y ayudas de transporte/solicitud. La bolsa estática heredada `ProviderPlugin.capabilities` es solo de compatibilidad y la lógica compartida del runner ya no la lee.
</Note>

## Rotación de claves de API

<AccordionGroup>
  <Accordion title="Fuentes de claves y prioridad">
    Configura varias claves mediante:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (anulación live única, máxima prioridad)
    - `<PROVIDER>_API_KEYS` (lista separada por comas o punto y coma)
    - `<PROVIDER>_API_KEY` (clave principal)
    - `<PROVIDER>_API_KEY_*` (lista numerada, por ejemplo `<PROVIDER>_API_KEY_1`)

    Para proveedores de Google, `GOOGLE_API_KEY` también se incluye como fallback. El orden de selección de claves conserva la prioridad y elimina valores duplicados.

  </Accordion>
  <Accordion title="Cuándo se activa la rotación">
    - Las solicitudes se reintentan con la siguiente clave solo en respuestas de límite de tasa (por ejemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o mensajes periódicos de límite de uso).
    - Los fallos que no son de límite de tasa fallan de inmediato; no se intenta rotación de claves.
    - Cuando todas las claves candidatas fallan, se devuelve el error final del último intento.

  </Accordion>
</AccordionGroup>

## Plugins de proveedor oficiales

Los Plugins de proveedor oficiales publican sus propias filas de catálogo de modelos. Estos proveedores **no** requieren entradas de modelo en `models.providers`; habilita el Plugin de proveedor, configura la autenticación y elige un modelo. Usa `models.providers` solo para proveedores personalizados explícitos o ajustes de solicitud estrechos, como tiempos de espera.

### OpenAI

- Proveedor: `openai`
- Autenticación: `OPENAI_API_KEY`
- Rotación opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, más `OPENCLAW_LIVE_OPENAI_KEY` (anulación única)
- Modelos de ejemplo: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifica la disponibilidad de la cuenta/modelo con `openclaw models list --provider openai` si una instalación específica o clave de API se comporta de forma diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- El transporte predeterminado es `auto`; OpenClaw pasa la elección de transporte al runtime de modelo compartido.
- Anula por modelo mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- El procesamiento prioritario de OpenAI se puede habilitar mediante `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` y `params.fastMode` asignan solicitudes directas de Responses `openai/*` a `service_tier=priority` en `api.openai.com`
- Usa `params.serviceTier` cuando quieras un nivel explícito en lugar del conmutador compartido `/fast`
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) se aplican solo al tráfico nativo de OpenAI hacia `api.openai.com`, no a proxies genéricos compatibles con OpenAI
- Las rutas nativas de OpenAI también conservan `store` de Responses, sugerencias de caché de prompts y modelado de payloads de compatibilidad de razonamiento de OpenAI; las rutas de proxy no
- `openai/gpt-5.3-codex-spark` está disponible mediante autenticación de suscripción OAuth de ChatGPT/Codex cuando tu cuenta iniciada lo expone; OpenClaw sigue suprimiendo rutas directas de clave de API de OpenAI y clave de API de Azure para este modelo porque esos transportes lo rechazan

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
- Las solicitudes públicas directas a Anthropic admiten el conmutador compartido `/fast` y `params.fastMode`, incluido el tráfico autenticado con clave de API y OAuth enviado a `api.anthropic.com`; OpenClaw lo asigna a `service_tier` de Anthropic (`auto` frente a `standard_only`)
- La configuración preferida de Claude CLI mantiene la referencia de modelo canónica y selecciona el
  backend de CLI por separado: `anthropic/claude-opus-4-8` con
  `agentRuntime.id: "claude-cli"` con alcance de modelo. Las referencias heredadas
  `claude-cli/claude-opus-4-7` siguen funcionando por compatibilidad.

<Note>
El personal de Anthropic nos informó que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración a menos que Anthropic publique una nueva política. El token de configuración de Anthropic sigue estando disponible como una ruta de token compatible con OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth de OpenAI ChatGPT/Codex

- Proveedor: `openai`
- Autenticación: OAuth (ChatGPT)
- Referencia de modelo heredada de OpenAI Codex: `openai/gpt-5.5`
- Referencia del arnés nativo de servidor de aplicación Codex: `openai/gpt-5.5`
- Documentación del arnés nativo de servidor de aplicación Codex: [arnés de Codex](/es/plugins/codex-harness)
- Referencias de modelos heredadas: `codex/gpt-*`
- Límite de Plugin: `openai/*` carga el Plugin de OpenAI; el Plugin nativo de servidor de aplicación Codex se selecciona mediante el runtime del arnés de Codex.
- CLI: `openclaw onboard --auth-choice openai` o `openclaw models auth login --provider openai`
- El transporte predeterminado es `auto` (WebSocket primero, SSE como fallback)
- Anula por modelo de OpenAI Codex mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` también se reenvía en solicitudes nativas Codex Responses (`chatgpt.com/backend-api`)
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) solo se adjuntan al tráfico nativo de Codex hacia `chatgpt.com/backend-api`, no a proxies genéricos compatibles con OpenAI
- Comparte el mismo conmutador `/fast` y configuración `params.fastMode` que `openai/*` directo; OpenClaw lo asigna a `service_tier=priority`
- `openai/gpt-5.5` usa el `contextWindow = 400000` nativo del catálogo de Codex y el runtime predeterminado `contextTokens = 272000`; anula el límite del runtime con `models.providers.openai.models[].contextTokens`
- Nota de política: OpenAI Codex OAuth se admite explícitamente para herramientas/flujos de trabajo externos como OpenClaw.
- Para la ruta común de suscripción más runtime nativo de Codex, inicia sesión con autenticación `openai` y configura `openai/gpt-5.5`; los turnos de agente de OpenAI seleccionan Codex de forma predeterminada.
- Usa `agentRuntime.id: "openclaw"` de proveedor/modelo solo cuando quieras la ruta integrada de OpenClaw; de lo contrario, mantén `openai/gpt-5.5` en el arnés de Codex predeterminado.
- las referencias GPT heredadas de Codex son estado heredado, no una ruta de proveedor live. Usa `openai/gpt-5.5` en el runtime nativo de Codex para la nueva configuración de agente, y ejecuta `openclaw doctor --fix` para migrar referencias de modelo Codex heredadas antiguas a referencias canónicas `openai/*`.

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
  <Card title="Z.AI (GLM)" href="/es/providers/zai">
    Plan de codificación de Z.AI o endpoints generales de API.
  </Card>
  <Card title="MiniMax" href="/es/providers/minimax">
    OAuth del Plan de codificación de MiniMax o acceso con clave de API.
  </Card>
  <Card title="Qwen Cloud" href="/es/providers/qwen">
    Superficie de proveedor de Qwen Cloud más asignación de endpoints de Alibaba DashScope y Plan de codificación.
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
- Rotación opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, respaldo de `GOOGLE_API_KEY` y `OPENCLAW_LIVE_GEMINI_KEY` (anulación única)
- Modelos de ejemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidad: la configuración heredada de OpenClaw que usa `google/gemini-3.1-flash-preview` se normaliza a `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` se acepta y se normaliza al id de la API de Gemini en vivo de Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Razonamiento: `/think adaptive` usa el razonamiento dinámico de Google. Gemini 3/3.1 omiten un `thinkingLevel` fijo; Gemini 2.5 envía `thinkingBudget: -1`.
- Las ejecuciones directas de Gemini también aceptan `agents.defaults.models["google/<model>"].params.cachedContent` (o el heredado `cached_content`) para reenviar un identificador `cachedContents/...` nativo del proveedor; los aciertos de caché de Gemini aparecen como `cacheRead` de OpenClaw

### Google Vertex y Gemini CLI

- Proveedores: `google-vertex`, `google-gemini-cli`
- Autenticación: Vertex usa ADC de gcloud; Gemini CLI usa su flujo de OAuth

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

    Modelo predeterminado: `google-gemini-cli/gemini-3-flash-preview`. **No** pegas un id de cliente ni un secreto en `openclaw.json`. El flujo de inicio de sesión de la CLI almacena tokens en perfiles de autenticación en el host del gateway.

  </Step>
  <Step title="Configurar proyecto (si es necesario)">
    Si las solicitudes fallan después de iniciar sesión, configura `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway.
  </Step>
</Steps>

Gemini CLI usa `stream-json` de forma predeterminada. OpenClaw lee los mensajes de flujo
del asistente y normaliza `stats.cached` a `cacheRead`; las anulaciones heredadas de
`--output-format json` siguen leyendo el texto de respuesta desde `response`.

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

| Proveedor                               | Id                               | Entorno de autenticación                            | Modelo de ejemplo                                         |
| --------------------------------------- | -------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                  | `byteplus-plan/ark-code-latest`                           |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                    | `cohere/command-a-03-2025`                                |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                     |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`           | `minimax/MiniMax-M3`                                      |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                   | `mistral/mistral-large-latest`                            |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                  | `moonshot/kimi-k2.6`                                      |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                    | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                    | `novita/deepseek/deepseek-v3-0324`                        |
| [Ollama Cloud](/es/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                    | `ollama-cloud/kimi-k2.6`                                  |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth o `OPENROUTER_API_KEY`             | `openrouter/auto`                                         |
| [Qwen OAuth](/es/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                      | `qwen-oauth/qwen3.5-plus`                                 |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                  | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`        |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                    | -                                                         |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                | `vercel-ai-gateway/anthropic/claude-opus-4.6`             |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                            | `volcengine-plan/ark-code-latest`                         |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth o `XAI_API_KEY`           | `xai/grok-4.3`                                            |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`      | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Peculiaridades que vale la pena conocer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica sus encabezados de atribución de aplicación y marcadores `cache_control` de Anthropic solo en rutas verificadas de `openrouter.ai`. Las referencias de DeepSeek, Moonshot y ZAI son aptas para TTL de caché para el almacenamiento en caché de prompts gestionado por OpenRouter, pero no reciben marcadores de caché de Anthropic. Como ruta compatible con OpenAI de estilo proxy, omite el modelado exclusivo de OpenAI nativo (`serviceTier`, `store` de Responses, sugerencias de caché de prompts, compatibilidad de razonamiento de OpenAI). Las referencias respaldadas por Gemini conservan solo el saneamiento de firmas de pensamiento de proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Las referencias respaldadas por Gemini siguen la misma ruta de saneamiento de proxy-Gemini; `kilocode/kilo/auto` y otras referencias de proxy sin soporte de razonamiento omiten la inyección de razonamiento de proxy.
  </Accordion>
  <Accordion title="MiniMax">
    La incorporación con clave de API escribe definiciones explícitas de modelos de chat M3 y M2.7; la comprensión de imágenes permanece en el proveedor multimedia `MiniMax-VL-01` propiedad del plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Los ids de modelo usan un espacio de nombres `nvidia/<vendor>/<model>` (por ejemplo, `nvidia/nvidia/nemotron-...` junto con `nvidia/moonshotai/kimi-k2.5`); los selectores conservan la composición literal `<provider>/<model-id>` mientras que la clave canónica enviada a la API permanece con un solo prefijo.
  </Accordion>
  <Accordion title="xAI">
    Usa la ruta Responses de xAI. La ruta recomendada es SuperGrok/X Premium OAuth; las claves de API siguen funcionando mediante `XAI_API_KEY` o la configuración del plugin, y `web_search` de Grok reutiliza el mismo perfil de autenticación antes del respaldo con clave de API. `grok-4.3` es el modelo de chat predeterminado incluido, y `grok-build-0.1` se puede seleccionar para trabajo centrado en compilación/codificación. `/fast` o `params.fastMode: true` reescriben `grok-3`, `grok-3-mini`, `grok-4` y `grok-4-0709` a sus variantes `*-fast`. `tool_stream` está activado de forma predeterminada; desactívalo mediante `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Proveedores mediante `models.providers` (URL personalizada/base)

Usa `models.providers` (o `models.json`) para agregar proveedores **personalizados** o proxies compatibles con OpenAI/Anthropic.

Muchos de los plugins de proveedor incluidos a continuación ya publican un catálogo predeterminado. Usa entradas explícitas de `models.providers.<id>` solo cuando quieras anular la URL base, los encabezados o la lista de modelos.

Las comprobaciones de capacidades del modelo de Gateway también leen metadatos explícitos de `models.providers.<id>.models[]`. Si un modelo personalizado o proxy acepta imágenes, establece `input: ["text", "image"]` en ese modelo para que WebChat y las rutas de adjuntos originadas en nodos pasen imágenes como entradas nativas del modelo en lugar de referencias de medios solo de texto.

`agents.defaults.models["provider/model"]` solo controla la visibilidad del modelo, los alias y los metadatos por modelo para los agentes. No registra un nuevo modelo de runtime por sí mismo. Para modelos de proveedor personalizados, añade también `models.providers.<provider>.models[]` con al menos el `id` correspondiente.

### Moonshot AI (Kimi)

Instala `@openclaw/moonshot-provider` antes del onboarding. Añade una entrada explícita `models.providers.moonshot` solo cuando necesites sobrescribir la URL base o los metadatos del modelo:

- Proveedor: `moonshot`
- Autenticación: `MOONSHOT_API_KEY`
- Modelo de ejemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` u `openclaw onboard --auth-choice moonshot-api-key-cn`

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

### Programación con Kimi

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

El onboarding usa de forma predeterminada la superficie de programación, pero el catálogo general `volcengine/*` se registra al mismo tiempo.

En los selectores de modelos de incorporación/configuración, la opción de autenticación de Volcengine prefiere las filas `volcengine/*` y `volcengine-plan/*`. Si esos modelos aún no se han cargado, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

<Tabs>
  <Tab title="Modelos estándar">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Modelos de programación (volcengine-plan)">
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

En los selectores de modelos de incorporación/configuración, la opción de autenticación de BytePlus prefiere las filas `byteplus/*` y `byteplus-plan/*`. Si esos modelos aún no se han cargado, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

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

Consulta [/providers/minimax](/es/providers/minimax) para obtener detalles de configuración, opciones de modelos y fragmentos de configuración.

<Note>
En la ruta de streaming compatible con Anthropic de MiniMax, OpenClaw desactiva thinking de forma predeterminada para la familia M2.x salvo que lo configures explícitamente; MiniMax-M3 (y M3.x) permanece de forma predeterminada en la ruta de thinking omitida/adaptativa del proveedor. `/fast on` reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
</Note>

División de capacidades propiedad del Plugin:

- Los valores predeterminados de texto/chat permanecen en `minimax/MiniMax-M3`
- La generación de imágenes es `minimax/image-01` o `minimax-portal/image-01`
- La comprensión de imágenes es `MiniMax-VL-01`, propiedad del Plugin, en ambas rutas de autenticación de MiniMax
- La búsqueda web permanece en el id de proveedor `minimax`

### LM Studio

LM Studio se distribuye como un Plugin de proveedor incluido que usa la API nativa:

- Proveedor: `lmstudio`
- Autenticación: `LM_API_TOKEN`
- URL base de inferencia predeterminada: `http://localhost:1234/v1`

Luego configura un modelo (reemplázalo por uno de los ID devueltos por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa los endpoints nativos `/api/v1/models` y `/api/v1/models/load` de LM Studio para descubrimiento y carga automática, con `/v1/chat/completions` para inferencia de forma predeterminada. Si quieres que la carga JIT, TTL y expulsión automática de LM Studio gestionen el ciclo de vida de los modelos, establece `models.providers.lmstudio.params.preload: false`. Consulta [/providers/lmstudio](/es/providers/lmstudio) para configuración y solución de problemas.

### Ollama

Ollama se distribuye como un Plugin de proveedor incluido y usa la API nativa de Ollama:

- Proveedor: `ollama`
- Autenticación: no requerida (servidor local)
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

vLLM se distribuye como un Plugin de proveedor incluido para servidores locales/autohospedados compatibles con OpenAI:

- Proveedor: `vllm`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:8000/v1`

Para aceptar el descubrimiento automático localmente (cualquier valor funciona si tu servidor no exige autenticación):

```bash
export VLLM_API_KEY="vllm-local"
```

Luego configura un modelo (reemplázalo por uno de los ID devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulta [/providers/vllm](/es/providers/vllm) para obtener más detalles.

### SGLang

SGLang se distribuye como un Plugin de proveedor incluido para servidores rápidos autohospedados compatibles con OpenAI:

- Proveedor: `sglang`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:30000/v1`

Para aceptar el descubrimiento automático localmente (cualquier valor funciona si tu servidor no exige autenticación):

```bash
export SGLANG_API_KEY="sglang-local"
```

Luego configura un modelo (reemplázalo por uno de los ID devueltos por `/v1/models`):

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
  <Accordion title="Campos opcionales predeterminados">
    Para proveedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` y `maxTokens` son opcionales. Cuando se omiten, OpenClaw usa de forma predeterminada:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recomendación: establece valores explícitos que coincidan con los límites de tu proxy/modelo.

  </Accordion>
  <Accordion title="Reglas de conformación de rutas de proxy">
    - Para `api: "openai-completions"` en endpoints no nativos (cualquier `baseUrl` no vacío cuyo host no sea `api.openai.com`), OpenClaw fuerza `compat.supportsDeveloperRole: false` para evitar errores 400 del proveedor por roles `developer` no admitidos.
    - Las rutas compatibles con OpenAI de estilo proxy también omiten la conformación de solicitudes nativa exclusiva de OpenAI: sin `service_tier`, sin `store` de Responses, sin `store` de Completions, sin indicaciones de caché de prompts, sin conformación de payload de compatibilidad de razonamiento de OpenAI y sin encabezados de atribución ocultos de OpenClaw.
    - Para proxies de Completions compatibles con OpenAI que necesiten campos específicos del proveedor, establece `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) para fusionar JSON adicional en el cuerpo de la solicitud saliente.
    - Para controles de plantillas de chat de vLLM, establece `agents.defaults.models["provider/model"].params.chat_template_kwargs`. El Plugin de vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true` para `vllm/nemotron-3-*` cuando el nivel de thinking de la sesión está desactivado.
    - Para modelos locales lentos o hosts remotos de LAN/tailnet, establece `models.providers.<id>.timeoutSeconds`. Esto amplía la gestión de solicitudes HTTP de modelos del proveedor, incluidas conexión, cabeceras, streaming del cuerpo y la cancelación total de guarded-fetch, sin aumentar el tiempo de espera de todo el runtime del agente. Si `agents.defaults.timeoutSeconds` o un tiempo de espera específico de ejecución es menor, eleva también ese límite; los tiempos de espera del proveedor no pueden ampliar toda la ejecución.
    - Las llamadas HTTP del proveedor de modelos permiten respuestas DNS de fake-IP de Surge, Clash y sing-box en `198.18.0.0/15` y `fc00::/7` solo para el nombre de host `baseUrl` del proveedor configurado. Los endpoints de proveedor personalizados/locales también confían en el origen exacto configurado `scheme://host:port` para solicitudes de modelos protegidas, incluidos hosts loopback, LAN y tailnet. Esta no es una opción de configuración nueva; el `baseUrl` que configuras amplía la política de solicitudes solo para ese origen. La autorización de nombres de host fake-IP y la confianza en el origen exacto son mecanismos independientes. Otros destinos privados, loopback, link-local, de metadatos y puertos distintos aún requieren aceptar explícitamente `models.providers.<id>.request.allowPrivateNetwork: true`. Establece `models.providers.<id>.request.allowPrivateNetwork: false` para excluirte de la confianza en el origen exacto.
    - Si `baseUrl` está vacío/omitido, OpenClaw conserva el comportamiento predeterminado de OpenAI (que resuelve a `api.openai.com`).
    - Por seguridad, un `compat.supportsDeveloperRole: true` explícito sigue siendo sobrescrito en endpoints `openai-completions` no nativos.
    - Para `api: "anthropic-messages"` en endpoints no directos (cualquier proveedor que no sea el `anthropic` canónico, o un `models.providers.anthropic.baseUrl` personalizado cuyo host no sea un endpoint público de `api.anthropic.com`), OpenClaw suprime encabezados beta implícitos de Anthropic como `claude-code-20250219`, `interleaved-thinking-2025-05-14` y marcadores OAuth, de modo que los proxies personalizados compatibles con Anthropic no rechacen flags beta no admitidos. Establece `models.providers.<id>.headers["anthropic-beta"]` explícitamente si tu proxy necesita funciones beta específicas.

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
- [Conmutación por error de modelos](/es/concepts/model-failover) - cadenas de fallback y comportamiento de reintento
- [Modelos](/es/concepts/models) - configuración de modelos y alias
- [Proveedores](/es/providers) - guías de configuración por proveedor
