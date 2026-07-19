---
read_when:
    - Necesita una referencia de configuración de modelos para cada proveedor
    - Se buscan configuraciones de ejemplo o comandos de incorporación de la CLI para proveedores de modelos
sidebarTitle: Model providers
summary: Descripción general de proveedores de modelos con configuraciones de ejemplo y flujos de la CLI
title: Proveedores de modelos
x-i18n:
    generated_at: "2026-07-19T01:55:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c0240811ced123bb58c862b08bb91110d211bc74074f7a48acb5bb87295838d
    source_path: concepts/model-providers.md
    workflow: 16
---

Referencia para **proveedores de LLM/modelos** (no canales de chat como WhatsApp/Telegram). Para consultar las reglas de selección de modelos, véase [Modelos](/es/concepts/models).

## Reglas rápidas

<AccordionGroup>
  <Accordion title="Referencias de modelos y utilidades de la CLI">
    - Las referencias de modelos usan `provider/model` (ejemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` almacena alias y ajustes por modelo; `agents.defaults.modelPolicy.allow` es la lista de permitidos opcional para anulaciones explícitas.
    - Utilidades de la CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` establecen los valores predeterminados del proveedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` los anulan para cada modelo.
    - Reglas de conmutación por error, sondeos durante el periodo de espera y persistencia de anulaciones de sesión: [Conmutación por error de modelos](/es/concepts/model-failover).

  </Accordion>
  <Accordion title="Añadir autenticación de proveedor no cambia el modelo principal">
    `openclaw configure` conserva un `agents.defaults.model.primary` existente al añadir o volver a autenticar un proveedor. `openclaw models auth login` hace lo mismo, salvo que se proporcione `--set-default`. Los plugins de proveedores aún pueden devolver un modelo predeterminado recomendado en su parche de configuración de autenticación, pero, cuando ya existe un modelo principal, OpenClaw lo interpreta como «hacer que este modelo esté disponible», no como «reemplazar el modelo principal actual».

    Para cambiar intencionadamente el modelo predeterminado, use `openclaw models set <provider/model>` o `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Separación entre proveedor y entorno de ejecución de OpenAI">
    Las referencias de modelos de OpenAI y los entornos de ejecución de agentes son independientes:

    - `openai/<model>` selecciona el proveedor y el modelo canónicos de OpenAI. El prefijo por sí solo nunca selecciona Codex.
    - Si la política del entorno de ejecución del proveedor/modelo no está definida o es `auto`, OpenAI puede seleccionar Codex implícitamente solo para una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin una anulación de solicitud definida.
    - Los adaptadores de Completions definidos, los endpoints personalizados y las rutas con comportamiento de solicitud definido permanecen en OpenClaw. Se rechazan los endpoints HTTP oficiales de texto sin formato.
    - Las referencias heredadas de modelos Codex son configuración heredada que doctor reescribe como `openai/<model>`.
    - El `agentRuntime.id: "openclaw"` del proveedor/modelo mantiene explícitamente en OpenClaw una ruta que, de otro modo, sería apta. `agentRuntime.id: "codex"` requiere Codex y aplica un cierre seguro cuando la ruta efectiva no es compatible con Codex.

    Véanse [Entorno de ejecución implícito de agentes de OpenAI](/es/providers/openai#implicit-agent-runtime) y [Arnés de Codex](/es/plugins/codex-harness). Si la separación entre proveedor y entorno de ejecución resulta confusa, lea primero [Entornos de ejecución de agentes](/es/concepts/agent-runtimes).

    La activación automática de plugins sigue el mismo límite: una ruta efectiva implícitamente compatible con Codex puede activar el plugin de Codex, mientras que el `agentRuntime.id: "codex"` explícito del proveedor/modelo o las referencias heredadas `codex/<model>` lo requieren. Un prefijo `openai/*` por sí solo no lo requiere.

    Una configuración nueva de OpenAI usa una referencia de GPT-5.6 específica de la ruta: la configuración con clave de API selecciona
    `openai/gpt-5.6` (el identificador básico de la API directa se resuelve como Sol), mientras que
    OAuth de ChatGPT/Codex selecciona exactamente `openai/gpt-5.6-sol` para el catálogo nativo de Codex.
    Los modelos principales explícitos existentes, incluido `openai/gpt-5.5`, se
    conservan al añadir o actualizar la autenticación de OpenAI. GPT-5.5 sigue disponible
    mediante cualquiera de los entornos de ejecución como opción de recuperación explícita para cuentas sin
    acceso a GPT-5.6.

  </Accordion>
  <Accordion title="Entornos de ejecución de la CLI">
    Los entornos de ejecución de la CLI usan la misma separación: elija referencias de modelos canónicas como `anthropic/claude-*` o `google/gemini-*` y, a continuación, establezca la política del entorno de ejecución del proveedor/modelo como `claude-cli` o `google-gemini-cli` cuando se desee un backend de CLI local.

    Las referencias heredadas `claude-cli/*` y `google-gemini-cli/*` se migran de nuevo a referencias canónicas de proveedores, con el entorno de ejecución registrado por separado. Las referencias heredadas `codex-cli/*` se migran a `openai/*` y usan la ruta del servidor de aplicaciones de Codex; OpenClaw ya no mantiene un backend de CLI de Codex incluido.

  </Accordion>
</AccordionGroup>

## Configurar proveedores en la interfaz de control

Abra **Settings → Model Providers** en la interfaz de control para añadir, reemplazar o eliminar las claves de API de proveedores almacenadas en `models.providers.<id>.apiKey`. La página identifica si cada clave de API procede de la configuración de OpenClaw o de una variable de entorno sin mostrar la credencial. Las claves proporcionadas mediante el entorno continúan gestionándose desde el entorno del proceso del Gateway.

Use **Test connection** para ejecutar un sondeo activo del proveedor y consultar la latencia o un error categorizado de autenticación, límite de frecuencia, facturación, tiempo de espera o respuesta. Un sondeo realiza una solicitud real al proveedor y puede consumir una pequeña cantidad de tokens. También se puede cerrar la sesión de los perfiles de OAuth y de tokens desde la tarjeta del proveedor.

La tarjeta **Default models** gestiona el modelo principal, los modelos de respaldo ordenados y el modelo auxiliar del catálogo de modelos configurado. Elija los modelos y guárdelos juntos en los ajustes existentes `agents.defaults.model` y `agents.defaults.utilityModel`. Para el modelo auxiliar, **Automatic** deja el ajuste sin definir y **Disabled** almacena una cadena vacía para desactivar el enrutamiento auxiliar.

## Comportamiento del proveedor gestionado por el plugin

La mayor parte de la lógica específica del proveedor reside en los plugins de proveedores (`registerProvider(...)`), mientras que OpenClaw conserva el bucle genérico de inferencia. Los plugins gestionan la incorporación, los catálogos de modelos, la asignación de variables de entorno de autenticación, la normalización del transporte y la configuración, la limpieza del esquema de herramientas, la clasificación de la conmutación por error, la renovación de OAuth, los informes de uso, los perfiles de pensamiento/razonamiento y mucho más.

La lista completa de enlaces del SDK de proveedores y ejemplos de plugins incluidos se encuentra en [Plugins de proveedores](/es/plugins/sdk-provider-plugins). Un proveedor que necesite un ejecutor de solicitudes totalmente personalizado constituye una superficie de extensión independiente y más profunda.

<Note>
El comportamiento del ejecutor gestionado por el proveedor reside en enlaces explícitos del proveedor, como la política de repetición, la normalización del esquema de herramientas, el encapsulado del flujo y las utilidades de transporte/solicitud. El contenedor estático heredado `ProviderPlugin.capabilities` es solo para compatibilidad y la lógica compartida del ejecutor ya no lo consulta.
</Note>

## Rotación de claves de API

<AccordionGroup>
  <Accordion title="Fuentes y prioridad de las claves">
    Configure varias claves mediante:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (anulación activa única, máxima prioridad)
    - `<PROVIDER>_API_KEYS` (lista separada por comas o puntos y comas)
    - `<PROVIDER>_API_KEY` (clave principal)
    - `<PROVIDER>_API_KEY_*` (lista numerada; por ejemplo, `<PROVIDER>_API_KEY_1`)

    Para los proveedores de Google, `GOOGLE_API_KEY` también se incluye como opción de respaldo. El orden de selección de claves conserva la prioridad y elimina los valores duplicados.

  </Accordion>
  <Accordion title="Cuándo se activa la rotación">
    - Las solicitudes vuelven a intentarse con la siguiente clave únicamente ante respuestas de límite de frecuencia (por ejemplo, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o mensajes periódicos de límite de uso).
    - Los fallos que no sean de límite de frecuencia se devuelven inmediatamente; no se intenta rotar las claves.
    - Cuando todas las claves candidatas fallan, se devuelve el error final del último intento.

  </Accordion>
</AccordionGroup>

## Plugins oficiales de proveedores

Los plugins oficiales de proveedores publican sus propias filas del catálogo de modelos. Estos proveedores **no** requieren entradas de modelo `models.providers`; active el plugin del proveedor, configure la autenticación y elija un modelo. Use `models.providers` únicamente para proveedores personalizados explícitos o ajustes de solicitud específicos, como los tiempos de espera.

### OpenAI

- Proveedor: `openai`
- Autenticación: `OPENAI_API_KEY`
- Rotación opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, además de `OPENCLAW_LIVE_OPENAI_KEY` (anulación única)
- Valor predeterminado de la configuración nueva: `openai/gpt-5.6`; en la API directa, el identificador básico se resuelve como Sol.
- Modelos de ejemplo: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- Compruebe la disponibilidad de la cuenta/modelo con `openclaw models list --provider openai` si una instalación o clave de API concreta se comporta de manera diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- El transporte predeterminado es `auto`; OpenClaw transmite la opción de transporte al entorno de ejecución de modelos compartido.
- Anúlelo para cada modelo mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- El procesamiento prioritario de OpenAI se puede activar mediante `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` y `params.fastMode` asignan las solicitudes directas de Responses de `openai/*` a `service_tier=priority` en `api.openai.com`
- Use `params.serviceTier` cuando se desee un nivel explícito en lugar del conmutador compartido `/fast`
- Las cabeceras ocultas de atribución de OpenClaw (`originator`, `version`, `User-Agent`) se aplican únicamente al tráfico nativo de OpenAI hacia `api.openai.com`, no a proxies genéricos compatibles con OpenAI
- Las rutas nativas de OpenAI también conservan `store` de Responses, las indicaciones de caché de prompts y la adaptación de la carga útil para la compatibilidad con el razonamiento de OpenAI; las rutas de proxy no
- `openai/gpt-5.3-codex-spark` solo está disponible mediante OAuth de ChatGPT/Codex; las rutas de clave de API directa de OpenAI y de clave de API de Azure lo rechazan

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

Si la organización de la API no ofrece GPT-5.6, establezca
`openai/gpt-5.5` explícitamente. La incorporación y la reautenticación normales conservan un
modelo principal explícito existente; `models auth login --set-default` y
`models set` son las vías de reemplazo intencionado.

### Anthropic

- Proveedor: `anthropic`
- Autenticación: `ANTHROPIC_API_KEY`
- Rotación opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, además de `OPENCLAW_LIVE_ANTHROPIC_KEY` (anulación única)
- Modelo de ejemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Las solicitudes públicas directas a Anthropic admiten el conmutador compartido `/fast` y `params.fastMode`, incluido el tráfico autenticado mediante clave de API y OAuth enviado a `api.anthropic.com`; OpenClaw lo asigna a `service_tier` de Anthropic (`auto` frente a `standard_only`)
- La configuración preferida de la CLI de Claude mantiene la referencia del modelo como canónica y selecciona el
  backend de la CLI por separado: `anthropic/claude-opus-4-8` con
  `agentRuntime.id: "claude-cli"` limitado al modelo. Las referencias heredadas
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
- Referencias de modelos heredadas: `codex/gpt-*`, `openai-codex/gpt-*`
- Límite del Plugin: `openai/*` carga el Plugin de OpenAI; la política explícita del entorno de ejecución o la ruta efectiva controlada por el proveedor determina si se selecciona el Plugin nativo del servidor de aplicaciones de Codex.
- CLI: `openclaw onboard --auth-choice openai` o `openclaw models auth login --provider openai`
- El transporte de Responses de ChatGPT integrado en OpenClaw utiliza de forma predeterminada `auto` (primero WebSocket, con SSE como alternativa).
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier` y `params.fastMode` son ajustes creados para solicitudes integradas. Mantienen la selección implícita del entorno de ejecución en OpenClaw; Codex nativo controla el transporte de su servidor de aplicaciones y el nivel de servicio.
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) solo se adjuntan al tráfico de Codex nativo dirigido a `chatgpt.com/backend-api`, no a proxies genéricos compatibles con OpenAI
- El selector compartido `/fast` sigue disponible como control del entorno de ejecución; es distinto de los parámetros de modelo creados.
- El catálogo de Codex nativo puede exponer las referencias exactas `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` y `openai/gpt-5.6-luna` según el acceso de la cuenta. No aplica en el cliente el alias simple `gpt-5.6` de la API directa.
- `openai/gpt-5.5` utiliza el `contextWindow = 400000` nativo del catálogo de Codex y el entorno de ejecución predeterminado `contextTokens = 272000`; sobrescriba el límite del entorno de ejecución con `models.providers.openai.models[].contextTokens`
- Inicie sesión con la autenticación `openai` y utilice `openai/gpt-5.6-sol` para una configuración nueva respaldada por una suscripción. Seleccione `openai/gpt-5.5` explícitamente si ese espacio de trabajo de Codex no ofrece GPT-5.6.
- Utilice el proveedor/modelo `agentRuntime.id: "openclaw"` para mantener en el entorno de ejecución integrado una ruta que, de otro modo, sería apta. Si el entorno de ejecución no está establecido o es `auto`, solo una ruta oficial HTTPS exacta compatible con Responses/ChatGPT y sin sobrescrituras creadas para la solicitud puede seleccionar Codex implícitamente.
- Las referencias heredadas de Codex GPT son un estado heredado, no una ruta activa del proveedor. Utilice referencias canónicas `openai/*` para la configuración de agentes nuevos y ejecute `openclaw doctor --fix` para migrar las referencias `codex/*` y `openai-codex/*`, preservando su semántica de Codex nativo mediante `agentRuntime.id: "codex"` con ámbito de modelo. Las selecciones canónicas explícitas `openai/gpt-5.5` existentes no se actualizan.

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

### Otras opciones alojadas de tipo suscripción

<CardGroup cols={3}>
  <Card title="MiniMax" href="/es/providers/minimax">
    Acceso mediante OAuth del plan MiniMax Coding o clave de API.
  </Card>
  <Card title="Qwen Cloud" href="/es/providers/qwen">
    Superficie del proveedor Qwen Cloud, además de la asignación de endpoints de Alibaba DashScope y Coding Plan.
  </Card>
  <Card title="Z.AI (GLM)" href="/es/providers/zai">
    Coding Plan de Z.AI o endpoints de API generales.
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
- Rotación opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` como alternativa y `OPENCLAW_LIVE_GEMINI_KEY` (sobrescritura única)
- Modelos de ejemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- Compatibilidad: la configuración heredada de OpenClaw que utiliza `google/gemini-3.1-flash-preview` se normaliza a `google/gemini-3-flash-preview`
- Alias: se acepta `google/gemini-3.1-pro` y se normaliza al identificador activo de la API de Gemini de Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Razonamiento: `/think adaptive` utiliza el razonamiento dinámico de Google. Gemini 3/3.1 omite un `thinkingLevel` fijo; Gemini 2.5 envía `thinkingBudget: -1`.
- Las ejecuciones directas de Gemini también aceptan `agents.defaults.models["google/<model>"].params.cachedContent` (o el heredado `cached_content`) para reenviar un identificador `cachedContents/...` nativo del proveedor; los aciertos de caché de Gemini se presentan como `cacheRead` de OpenClaw

### Google Vertex y Gemini CLI

- Proveedores: `google-vertex`, `google-gemini-cli`
- Autenticación: Vertex utiliza ADC de gcloud; Gemini CLI utiliza su flujo de OAuth

<Warning>
OAuth de Gemini CLI en OpenClaw es una integración no oficial. Algunos usuarios han informado de restricciones en sus cuentas de Google después de utilizar clientes de terceros. Revise los términos de Google y utilice una cuenta no crítica si decide continuar.
</Warning>

OAuth de Gemini CLI se distribuye como parte del Plugin incluido `google`.

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
  <Step title="Habilitar el Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Iniciar sesión">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo predeterminado: `google-gemini-cli/gemini-3-flash-preview`. **No** pegue un identificador ni un secreto de cliente en `openclaw.json`. El flujo de inicio de sesión de la CLI almacena los tokens en perfiles de autenticación en el host del Gateway.

  </Step>
  <Step title="Establecer el proyecto (si es necesario)">
    Si las solicitudes fallan después de iniciar sesión, establezca `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway.
  </Step>
</Steps>

Gemini CLI utiliza `stream-json` de forma predeterminada. OpenClaw lee los mensajes
del flujo del asistente y normaliza `stats.cached` en `cacheRead`; las sobrescrituras
heredadas de `--output-format json` siguen leyendo el texto de respuesta de `response`.

### Z.AI (GLM)

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- Modelo de ejemplo: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Las referencias de modelos utilizan el identificador canónico del proveedor `zai/*`.
  - `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente; `zai-coding-global`, `zai-coding-cn`, `zai-global` y `zai-cn` fuerzan una superficie específica

### Vercel AI Gateway

- Proveedor: `vercel-ai-gateway`
- Autenticación: `AI_GATEWAY_API_KEY`
- Modelos de ejemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Otros Plugins de proveedores incluidos

| Proveedor                               | Id                               | Entorno de autenticación                              | Modelo de ejemplo                                      |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` o `OPENROUTER_API_KEY`             | `arcee/trinity-large-thinking`                         |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                        |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                 |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` o `CHUTES_OAUTH_TOKEN`              | `chutes/zai-org/GLM-5-TEE`                             |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`               |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                        |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`              |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                           |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                           |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                      |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                     |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                 | `huggingface/deepseek-ai/DeepSeek-R1`                  |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                   |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                         |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                   |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`             |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                     |
| [Ollama Cloud](/es/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                               |
| OpenRouter                              | `openrouter`                     | OAuth de OpenRouter o `OPENROUTER_API_KEY`             | `openrouter/auto`                                      |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                         |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`     |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                      |
| Gateway de IA de Vercel                 | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`          |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                      |
| xAI                                     | `xai`                            | OAuth de SuperGrok/X Premium o `XAI_API_KEY`         | `xai/grok-4.3`                                         |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2.5` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Particularidades que conviene conocer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica sus encabezados de atribución de aplicaciones y los marcadores `cache_control` de Anthropic únicamente en rutas `openrouter.ai` verificadas. Las referencias de DeepSeek, Moonshot y ZAI son aptas para TTL de caché en el almacenamiento en caché de prompts administrado por OpenRouter, pero no reciben marcadores de caché de Anthropic. Como ruta compatible con OpenAI de tipo proxy, omite la adaptación exclusiva de OpenAI nativo (`serviceTier`, `store` de Responses, indicaciones de caché de prompts y compatibilidad de razonamiento de OpenAI). Las referencias respaldadas por Gemini solo conservan la depuración de firmas de pensamiento de Gemini mediante proxy.
  </Accordion>
  <Accordion title="Gateway de Kilo">
    Las referencias respaldadas por Gemini siguen la misma ruta de depuración de Gemini mediante proxy; `kilocode/kilo-auto/balanced` y otras referencias de proxy sin compatibilidad con razonamiento omiten la inyección de razonamiento del proxy.
  </Accordion>
  <Accordion title="MiniMax">
    La incorporación mediante clave de API escribe definiciones explícitas de los modelos de chat M3 y M2.7; la comprensión de imágenes permanece en el proveedor multimedia `MiniMax-VL-01`, propiedad del plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Los identificadores de modelos usan un espacio de nombres `nvidia/<vendor>/<model>` (por ejemplo, `nvidia/nvidia/nemotron-...`); los selectores conservan la composición literal `<provider>/<model-id>`, mientras que la clave canónica enviada a la API mantiene un único prefijo.
  </Accordion>
  <Accordion title="xAI">
    Usa la ruta Responses de xAI. La ruta recomendada es OAuth de SuperGrok/X Premium; las claves de API siguen funcionando mediante `XAI_API_KEY` o la configuración del plugin, y `web_search` de Grok reutiliza el mismo perfil de autenticación antes de recurrir a la clave de API. Grok 4.5 se puede seleccionar para chat, programación y trabajo con agentes donde esté disponible; `grok-4.3` sigue siendo el valor predeterminado incluido que es seguro para la región. Las configuraciones anteriores `/fast` y `params.fastMode: true` siguen resolviéndose mediante las redirecciones de compatibilidad de Grok 4.3 de xAI, pero las configuraciones nuevas deben seleccionar directamente un modelo actual. `tool_stream` está habilitado de forma predeterminada; se deshabilita mediante `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Proveedores mediante `models.providers` (URL personalizada/base)

Use `models.providers` (o `models.json`) para añadir proveedores **personalizados** o proxies compatibles con OpenAI/Anthropic.

Muchos de los plugins de proveedores incluidos que aparecen a continuación ya publican un catálogo predeterminado. Use entradas `models.providers.<id>` explícitas solo cuando quiera sustituir la URL base, los encabezados o la lista de modelos predeterminados.

Las comprobaciones de capacidades de modelos del Gateway también leen metadatos `models.providers.<id>.models[]` explícitos. Si un modelo personalizado o de proxy acepta imágenes, configure `input: ["text", "image"]` en ese modelo para que las rutas de adjuntos procedentes de WebChat y Node pasen las imágenes como entradas nativas del modelo en lugar de referencias multimedia de solo texto.

`agents.defaults.models["provider/model"]` controla los alias y los metadatos por modelo para los agentes. Por sí solo, no restringe las sustituciones ni registra un nuevo modelo de ejecución. Para los modelos de proveedores personalizados, añada también `models.providers.<provider>.models[]` con al menos el `id` correspondiente; use `agents.defaults.modelPolicy.allow` por separado cuando quiera restringir las sustituciones.

### Moonshot AI (Kimi)

Instale `@openclaw/moonshot-provider` antes de la incorporación. Añada una entrada `models.providers.moonshot` explícita solo cuando necesite sustituir la URL base o los metadatos del modelo:

- Proveedor: `moonshot`
- Autenticación: `MOONSHOT_API_KEY`
- Modelo de ejemplo: `moonshot/kimi-k3`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

Identificadores de modelos Kimi:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k3`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.7-code-highspeed`
- `moonshot/kimi-k2.5`

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

Consulte [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot) para obtener la guía de configuración completa.

### Kimi Coding

Kimi Coding usa el punto de conexión compatible con Anthropic de Moonshot AI:

- Proveedor: `kimi`
- Autenticación: `KIMI_API_KEY`
- Kimi K3: `kimi/k3` (256K) o `kimi/k3[1m]` (plan de 1M)
- Kimi Code: `kimi/kimi-for-coding`
- Kimi Code HighSpeed: `kimi/kimi-for-coding-highspeed`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Los identificadores heredados `kimi/kimi-code` y `kimi/k2p5` siguen aceptándose como identificadores de modelos de compatibilidad y se normalizan al identificador estable del modelo de API de Kimi.

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

En los selectores de modelos de incorporación/configuración, la opción de autenticación de Volcengine prioriza las filas `volcengine/*` y `volcengine-plan/*`. Si esos modelos aún no están cargados, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

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

La incorporación utiliza de forma predeterminada la superficie de programación, pero el catálogo general `byteplus/*` se registra al mismo tiempo.

En los selectores de modelos de incorporación/configuración, la opción de autenticación de BytePlus da preferencia a las filas `byteplus/*` y `byteplus-plan/*`. Si esos modelos aún no están cargados, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

<Tabs>
  <Tab title="Modelos estándar">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modelos de programación (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic proporciona modelos compatibles con Anthropic mediante el proveedor `synthetic`:

- Proveedor: `synthetic`
- Autenticación: `SYNTHETIC_API_KEY`
- Modelo de ejemplo: `synthetic/hf:MiniMaxAI/MiniMax-M3`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M3", name: "MiniMax M3" }],
      },
    },
  },
}
```

### MiniMax

MiniMax se configura mediante `models.providers` porque utiliza endpoints personalizados:

- OAuth de MiniMax (global): `--auth-choice minimax-global-oauth`
- OAuth de MiniMax (China): `--auth-choice minimax-cn-oauth`
- Clave de API de MiniMax (global): `--auth-choice minimax-global-api`
- Clave de API de MiniMax (China): `--auth-choice minimax-cn-api`
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/es/providers/minimax) para obtener detalles de configuración, opciones de modelos y fragmentos de configuración.

<Note>
En la ruta de streaming compatible con Anthropic de MiniMax, OpenClaw desactiva de forma predeterminada el razonamiento para la familia M2.x, a menos que se establezca explícitamente; MiniMax-M3 (y M3.x) mantiene de forma predeterminada la ruta de razonamiento omitido/adaptativo del proveedor. `/fast on` reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
</Note>

División de capacidades propiedad del plugin:

- Los valores predeterminados de texto/chat permanecen en `minimax/MiniMax-M3`
- La generación de imágenes es `minimax/image-01` o `minimax-portal/image-01`
- La comprensión de imágenes es `MiniMax-VL-01`, propiedad del plugin, en ambas rutas de autenticación de MiniMax
- La búsqueda web permanece en el identificador de proveedor `minimax`

### LM Studio

LM Studio se distribuye como un plugin de proveedor incluido que utiliza la API nativa:

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

OpenClaw utiliza los endpoints nativos `/api/v1/models` y `/api/v1/models/load` de LM Studio para el descubrimiento y la carga automática, con `/v1/chat/completions` para la inferencia de forma predeterminada. Si se desea que la carga JIT, el TTL y la expulsión automática de LM Studio gestionen el ciclo de vida del modelo, establezca `models.providers.lmstudio.params.preload: false`. Consulte [/providers/lmstudio](/es/providers/lmstudio) para obtener información sobre la configuración y la solución de problemas.

### Ollama

Ollama se distribuye como un plugin de proveedor incluido y utiliza la API nativa de Ollama:

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

Ollama se detecta localmente en `http://127.0.0.1:11434` al habilitarlo mediante `OLLAMA_API_KEY`, y el plugin de proveedor incluido añade Ollama directamente a `openclaw onboard` y al selector de modelos. Consulte [/providers/ollama](/es/providers/ollama) para obtener información sobre la incorporación, el modo local/en la nube y la configuración personalizada.

### vLLM

vLLM se distribuye como un plugin de proveedor incluido para servidores locales o autoalojados compatibles con OpenAI:

- Proveedor: `vllm`
- Autenticación: opcional (depende del servidor)
- URL base predeterminada: `http://127.0.0.1:8000/v1`

Para habilitar el descubrimiento automático localmente (cualquier valor funciona si el servidor no exige autenticación):

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

Consulte [/providers/vllm](/es/providers/vllm) para obtener más detalles.

### SGLang

SGLang se distribuye como un plugin de proveedor incluido para servidores autoalojados rápidos compatibles con OpenAI:

- Proveedor: `sglang`
- Autenticación: opcional (depende del servidor)
- URL base predeterminada: `http://127.0.0.1:30000/v1`

Para habilitar el descubrimiento automático localmente (cualquier valor funciona si el servidor no exige autenticación):

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

Consulte [/providers/sglang](/es/providers/sglang) para obtener más detalles.

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
    Para los proveedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` y `maxTokens` son opcionales. Si se omiten, OpenClaw utiliza de forma predeterminada:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recomendación: establezca valores explícitos que coincidan con los límites del proxy/modelo.

  </Accordion>
  <Accordion title="Reglas de conformación de rutas de proxy">
    - Para `api: "openai-completions"` en endpoints no nativos (cualquier `baseUrl` no vacío cuyo host no sea `api.openai.com`), OpenClaw fuerza `compat.supportsDeveloperRole: false` para evitar errores 400 del proveedor por roles `developer` no admitidos.
    - Las rutas de estilo proxy compatibles con OpenAI también omiten la conformación de solicitudes exclusiva de OpenAI nativo: sin `service_tier`, sin `store` de Responses, sin `store` de Completions, sin indicaciones de caché de prompts, sin conformación de la carga de compatibilidad de razonamiento de OpenAI y sin encabezados ocultos de atribución de OpenClaw.
    - Para los proxies de Completions compatibles con OpenAI que necesiten campos específicos del proveedor, establezca `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) para combinar JSON adicional en el cuerpo de la solicitud saliente.
    - Para los controles de plantillas de chat de vLLM, establezca `agents.defaults.models["provider/model"].params.chat_template_kwargs`. El plugin de vLLM incluido envía automáticamente `enable_thinking: false` y `force_nonempty_content: true` para `vllm/nemotron-3-*` cuando el nivel de razonamiento de la sesión está desactivado.
    - Para modelos locales lentos o hosts remotos de LAN/tailnet, establezca `models.providers.<id>.timeoutSeconds`. Esto amplía el tiempo de gestión de solicitudes HTTP del modelo del proveedor, incluida la conexión, los encabezados, el streaming del cuerpo y la cancelación total de la obtención protegida, sin aumentar el tiempo de espera de toda la ejecución del agente. Si `agents.defaults.timeoutSeconds` o un tiempo de espera específico de la ejecución es inferior, aumente también ese límite; los tiempos de espera del proveedor no pueden ampliar toda la ejecución.
    - Las llamadas HTTP al proveedor del modelo permiten respuestas DNS de IP falsa de Surge, Clash y sing-box en `198.18.0.0/15` y `fc00::/7` únicamente para el nombre de host `baseUrl` del proveedor configurado. Los endpoints de proveedores personalizados/locales también confían en ese origen `scheme://host:port` configurado exacto para las solicitudes de modelos protegidas, incluidos los hosts de bucle invertido, LAN y tailnet. Esta no es una nueva opción de configuración; el `baseUrl` configurado amplía la política de solicitudes únicamente para ese origen. La autorización de nombres de host con IP falsa y la confianza en el origen exacto son mecanismos independientes. Otros destinos privados, de bucle invertido, de vínculo local o de metadatos, así como los puertos diferentes, siguen requiriendo una habilitación explícita mediante `models.providers.<id>.request.allowPrivateNetwork: true`. Establezca `models.providers.<id>.request.allowPrivateNetwork: false` para desactivar la confianza en el origen exacto.
    - Si `baseUrl` está vacío o se omite, OpenClaw conserva el comportamiento predeterminado de OpenAI (que se resuelve como `api.openai.com`).
    - Por seguridad, un `compat.supportsDeveloperRole: true` explícito sigue anulándose en endpoints `openai-completions` no nativos.
    - Para `api: "anthropic-messages"` en endpoints no directos (cualquier proveedor distinto del `anthropic` canónico, o un `models.providers.anthropic.baseUrl` personalizado cuyo host no sea un endpoint público `api.anthropic.com`), OpenClaw suprime los encabezados beta implícitos de Anthropic, como `claude-code-20250219`, `interleaved-thinking-2025-05-14` y los marcadores OAuth, para que los proxies personalizados compatibles con Anthropic no rechacen indicadores beta no admitidos. Establezca `models.providers.<id>.headers["anthropic-beta"]` explícitamente si el proxy necesita funciones beta específicas.

  </Accordion>
</AccordionGroup>

## Ejemplos de la CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte también: [Configuración](/es/gateway/configuration) para ver ejemplos completos de configuración.

## Relacionado

- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - claves de configuración de modelos
- [Conmutación por error de modelos](/es/concepts/model-failover) - cadenas de respaldo y comportamiento de reintento
- [Modelos](/es/concepts/models) - configuración y alias de modelos
- [Proveedores](/es/providers) - guías de configuración por proveedor
