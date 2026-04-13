---
read_when:
    - Necesitas una referencia de configuración de modelos proveedor por proveedor
    - Quieres configuraciones de ejemplo o comandos de incorporación de CLI para proveedores de modelos
summary: Descripción general de los proveedores de modelos con configuraciones de ejemplo + flujos de CLI
title: Proveedores de modelos
x-i18n:
    generated_at: "2026-04-13T08:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ba688c4b4366eec07667571e835d4cfeee684896e2ffae11d601b5fa0a4b98
    source_path: concepts/model-providers.md
    workflow: 15
---

# Proveedores de modelos

Esta página cubre los **proveedores de LLM/modelos** (no canales de chat como WhatsApp/Telegram).
Para las reglas de selección de modelos, consulta [/concepts/models](/es/concepts/models).

## Reglas rápidas

- Las referencias de modelos usan `provider/model` (ejemplo: `opencode/claude-opus-4-6`).
- Si configuras `agents.defaults.models`, se convierte en la lista de permitidos.
- Ayudantes de CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Las reglas de runtime de respaldo, las sondas de enfriamiento y la persistencia de las anulaciones de sesión
  están documentadas en [/concepts/model-failover](/es/concepts/model-failover).
- `models.providers.*.models[].contextWindow` son metadatos nativos del modelo;
  `models.providers.*.models[].contextTokens` es el límite efectivo del runtime.
- Los plugins de proveedores pueden inyectar catálogos de modelos mediante `registerProvider({ catalog })`;
  OpenClaw fusiona esa salida en `models.providers` antes de escribir
  `models.json`.
- Los manifiestos de proveedores pueden declarar `providerAuthEnvVars` y
  `providerAuthAliases` para que las sondas genéricas de autenticación basadas en variables de entorno y las variantes de proveedor
  no necesiten cargar el runtime del plugin. El mapa restante de variables de entorno del núcleo ahora
  es solo para proveedores no basados en plugins/del núcleo y algunos casos de precedencia genérica tales
  como la incorporación con prioridad de clave de API de Anthropic.
- Los plugins de proveedores también pueden encargarse del comportamiento de runtime del proveedor mediante
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, y
  `onModelSelected`.
- Nota: `capabilities` del runtime del proveedor son metadatos compartidos del ejecutor (familia del proveedor,
  peculiaridades de transcripción/herramientas, pistas de transporte/caché). No es lo
  mismo que el [modelo de capacidades públicas](/es/plugins/architecture#public-capability-model)
  que describe lo que registra un plugin (inferencia de texto, voz, etc.).
- El proveedor `codex` incluido se empareja con el arnés de agente Codex incluido.
  Usa `codex/gpt-*` cuando quieras inicio de sesión administrado por Codex, descubrimiento de modelos,
  reanudación nativa de hilos y ejecución en servidor de aplicaciones. Las referencias simples `openai/gpt-*` siguen
  usando el proveedor OpenAI y el transporte normal de proveedor de OpenClaw.
  Las implementaciones solo de Codex pueden desactivar el respaldo automático a PI con
  `agents.defaults.embeddedHarness.fallback: "none"`; consulta
  [Codex Harness](/es/plugins/codex-harness).

## Comportamiento del proveedor administrado por plugins

Los plugins de proveedores ahora pueden encargarse de la mayor parte de la lógica específica del proveedor, mientras que OpenClaw mantiene
el bucle genérico de inferencia.

Separación típica:

- `auth[].run` / `auth[].runNonInteractive`: el proveedor se encarga de los flujos de incorporación/inicio de sesión
  para `openclaw onboard`, `openclaw models auth` y la configuración sin interacción
- `wizard.setup` / `wizard.modelPicker`: el proveedor se encarga de las etiquetas de elección de autenticación,
  alias heredados, sugerencias de lista de permitidos para la incorporación y entradas de configuración en los selectores de incorporación/modelos
- `catalog`: el proveedor aparece en `models.providers`
- `normalizeModelId`: el proveedor normaliza ids de modelos heredados/de vista previa antes de la
  búsqueda o la canonicalización
- `normalizeTransport`: el proveedor normaliza `api` / `baseUrl` de la familia de transporte
  antes del ensamblado genérico del modelo; OpenClaw comprueba primero el proveedor coincidente,
  luego otros plugins de proveedores con capacidad de hook hasta que uno realmente cambie el
  transporte
- `normalizeConfig`: el proveedor normaliza la configuración `models.providers.<id>` antes de que
  el runtime la use; OpenClaw comprueba primero el proveedor coincidente, luego otros
  plugins de proveedores con capacidad de hook hasta que uno realmente cambie la configuración. Si ningún
  hook de proveedor reescribe la configuración, los ayudantes incluidos de la familia Google siguen
  normalizando las entradas compatibles de proveedores de Google.
- `applyNativeStreamingUsageCompat`: el proveedor aplica reescrituras de compatibilidad de uso de streaming nativo impulsadas por el endpoint para proveedores de configuración
- `resolveConfigApiKey`: el proveedor resuelve la autenticación con marcador de entorno para proveedores de configuración
  sin forzar la carga completa de la autenticación de runtime. `amazon-bedrock` también tiene aquí un
  resolvedor integrado de marcadores de entorno de AWS, aunque la autenticación de runtime de Bedrock use
  la cadena predeterminada del SDK de AWS.
- `resolveSyntheticAuth`: el proveedor puede exponer disponibilidad de autenticación local/autohospedada u otra
  autenticación respaldada por configuración sin persistir secretos en texto plano
- `shouldDeferSyntheticProfileAuth`: el proveedor puede marcar marcadores almacenados de perfiles sintéticos
  como de menor precedencia que la autenticación respaldada por entorno/configuración
- `resolveDynamicModel`: el proveedor acepta ids de modelos que todavía no están presentes en el
  catálogo estático local
- `prepareDynamicModel`: el proveedor necesita una actualización de metadatos antes de reintentar la
  resolución dinámica
- `normalizeResolvedModel`: el proveedor necesita reescrituras de transporte o URL base
- `contributeResolvedModelCompat`: el proveedor aporta indicadores de compatibilidad para sus
  modelos del proveedor incluso cuando llegan a través de otro transporte compatible
- `capabilities`: el proveedor publica peculiaridades de transcripción/herramientas/familia de proveedor
- `normalizeToolSchemas`: el proveedor limpia los esquemas de herramientas antes de que el
  ejecutor integrado los vea
- `inspectToolSchemas`: el proveedor muestra advertencias de esquemas específicas del transporte
  después de la normalización
- `resolveReasoningOutputMode`: el proveedor elige contratos de salida de razonamiento
  nativos frente a etiquetados
- `prepareExtraParams`: el proveedor establece por defecto o normaliza parámetros de solicitud por modelo
- `createStreamFn`: el proveedor reemplaza la ruta de streaming normal por un
  transporte totalmente personalizado
- `wrapStreamFn`: el proveedor aplica envolturas de compatibilidad para encabezados/cuerpo/modelo de la solicitud
- `resolveTransportTurnState`: el proveedor suministra encabezados o metadatos
  nativos de transporte por turno
- `resolveWebSocketSessionPolicy`: el proveedor suministra encabezados nativos de sesión WebSocket
  o una política de enfriamiento de sesión
- `createEmbeddingProvider`: el proveedor se encarga del comportamiento de embeddings de memoria cuando
  corresponde al plugin del proveedor en lugar del switchboard central de embeddings
- `formatApiKey`: el proveedor da formato a los perfiles de autenticación almacenados en la cadena
  `apiKey` de runtime que espera el transporte
- `refreshOAuth`: el proveedor se encarga de la actualización de OAuth cuando los actualizadores compartidos `pi-ai`
  no son suficientes
- `buildAuthDoctorHint`: el proveedor agrega orientación de reparación cuando la actualización de OAuth
  falla
- `matchesContextOverflowError`: el proveedor reconoce errores de desbordamiento de ventana de contexto
  específicos del proveedor que las heurísticas genéricas no detectarían
- `classifyFailoverReason`: el proveedor asigna errores sin procesar de transporte/API específicos del proveedor
  a motivos de failover como límite de tasa o sobrecarga
- `isCacheTtlEligible`: el proveedor decide qué ids de modelos upstream admiten TTL de caché de prompts
- `buildMissingAuthMessage`: el proveedor reemplaza el error genérico del almacén de autenticación
  por una sugerencia de recuperación específica del proveedor
- `suppressBuiltInModel`: el proveedor oculta filas upstream obsoletas y puede devolver un
  error administrado por el proveedor para fallos de resolución directa
- `augmentModelCatalog`: el proveedor agrega filas sintéticas/finales del catálogo después del
  descubrimiento y la fusión de configuración
- `isBinaryThinking`: el proveedor se encarga de la UX binaria de thinking activado/desactivado
- `supportsXHighThinking`: el proveedor habilita `xhigh` para modelos seleccionados
- `resolveDefaultThinkingLevel`: el proveedor se encarga de la política predeterminada de `/think` para una
  familia de modelos
- `applyConfigDefaults`: el proveedor aplica valores predeterminados globales específicos del proveedor
  durante la materialización de configuración según el modo de autenticación, el entorno o la familia de modelos
- `isModernModelRef`: el proveedor se encarga de la coincidencia de modelos preferidos en pruebas live/smoke
- `prepareRuntimeAuth`: el proveedor convierte una credencial configurada en un token de runtime
  de corta duración
- `resolveUsageAuth`: el proveedor resuelve credenciales de uso/cuota para `/usage`
  y superficies relacionadas de estado/informes
- `fetchUsageSnapshot`: el proveedor se encarga de la obtención/análisis del endpoint de uso, mientras que
  el núcleo sigue encargándose del contenedor de resumen y del formato
- `onModelSelected`: el proveedor ejecuta efectos secundarios posteriores a la selección, como
  telemetría o contabilidad de sesión administrada por el proveedor

Ejemplos actuales incluidos:

- `anthropic`: compatibilidad futura de Claude 4.6 con fallback, sugerencias de reparación de autenticación, obtención del endpoint de uso, metadatos de TTL de caché/familia de proveedor y valores predeterminados globales de configuración con reconocimiento de autenticación
- `amazon-bedrock`: coincidencia de desbordamiento de contexto administrada por el proveedor y clasificación del motivo de failover para errores específicos de Bedrock de limitación/no listo, además de la familia compartida de reproducción `anthropic-by-model` para protecciones de política de reproducción solo de Claude sobre tráfico de Anthropic
- `anthropic-vertex`: protecciones de política de reproducción solo de Claude sobre tráfico de mensajes de Anthropic
- `openrouter`: ids de modelos de paso directo, envolturas de solicitudes, sugerencias de capacidades del proveedor, saneamiento de firmas de pensamiento de Gemini en tráfico Gemini a través de proxy, inyección de razonamiento del proxy mediante la familia de streams `openrouter-thinking`, reenvío de metadatos de enrutamiento y política de TTL de caché
- `github-copilot`: incorporación/inicio de sesión en dispositivo, fallback de modelo con compatibilidad futura, sugerencias de transcripción de pensamiento de Claude, intercambio de tokens de runtime y obtención del endpoint de uso
- `openai`: fallback con compatibilidad futura de GPT-5.4, normalización directa del transporte de OpenAI, sugerencias de autenticación faltante con reconocimiento de Codex, supresión de Spark, filas sintéticas de catálogo de OpenAI/Codex, política de thinking/modelo live, normalización de alias de tokens de uso (`input` / `output` y familias `prompt` / `completion`), la familia compartida de streams `openai-responses-defaults` para envolturas nativas de OpenAI/Codex, metadatos de familia de proveedor, registro incluido del proveedor de generación de imágenes para `gpt-image-1` y registro incluido del proveedor de generación de video para `sora-2`
- `google` y `google-gemini-cli`: fallback con compatibilidad futura de Gemini 3.1, validación nativa de reproducción de Gemini, saneamiento de reproducción de bootstrap, modo de salida de razonamiento etiquetado, coincidencia de modelos modernos, registro incluido del proveedor de generación de imágenes para modelos Gemini image-preview y registro incluido del proveedor de generación de video para modelos Veo; Gemini CLI OAuth también se encarga del formato de tokens del perfil de autenticación, del análisis de tokens de uso y de la obtención del endpoint de cuota para superficies de uso
- `moonshot`: transporte compartido, normalización de payload de thinking administrada por el plugin
- `kilocode`: transporte compartido, encabezados de solicitud administrados por el plugin, normalización de payload de razonamiento, saneamiento de firmas de pensamiento de Gemini a través de proxy y política de TTL de caché
- `zai`: fallback con compatibilidad futura de GLM-5, valores predeterminados de `tool_stream`, política de TTL de caché, política de thinking binario/modelo live y autenticación de uso + obtención de cuota; los ids desconocidos `glm-5*` se sintetizan a partir de la plantilla incluida `glm-4.7`
- `xai`: normalización nativa del transporte Responses, reescrituras de alias `/fast` para variantes rápidas de Grok, `tool_stream` predeterminado, limpieza específica de xAI de esquemas de herramientas / payload de razonamiento y registro incluido del proveedor de generación de video para `grok-imagine-video`
- `mistral`: metadatos de capacidades administrados por el plugin
- `opencode` y `opencode-go`: metadatos de capacidades administrados por el plugin más saneamiento de firmas de pensamiento de Gemini a través de proxy
- `alibaba`: catálogo de generación de video administrado por el plugin para referencias directas de modelos Wan, como `alibaba/wan2.6-t2v`
- `byteplus`: catálogos administrados por el plugin más registro incluido del proveedor de generación de video para modelos Seedance de texto a video/imagen a video
- `fal`: registro incluido del proveedor de generación de video para modelos de terceros alojados y registro incluido del proveedor de generación de imágenes para modelos de imagen FLUX, además de registro incluido del proveedor de generación de video para modelos de video de terceros alojados
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` y `volcengine`:
  solo catálogos administrados por plugins
- `qwen`: catálogos administrados por plugins para modelos de texto más registros compartidos de proveedores de comprensión multimedia y generación de video para sus superficies multimodales; la generación de video de Qwen usa los endpoints de video estándar de DashScope con modelos Wan incluidos como `wan2.6-t2v` y `wan2.7-r2v`
- `runway`: registro de proveedor de generación de video administrado por el plugin para modelos nativos basados en tareas de Runway como `gen4.5`
- `minimax`: catálogos administrados por plugins, registro incluido del proveedor de generación de video para modelos de video Hailuo, registro incluido del proveedor de generación de imágenes para `image-01`, selección híbrida de política de reproducción Anthropic/OpenAI y lógica de autenticación/snapshot de uso
- `together`: catálogos administrados por plugins más registro incluido del proveedor de generación de video para modelos de video Wan
- `xiaomi`: catálogos administrados por plugins más lógica de autenticación/snapshot de uso

El plugin `openai` incluido ahora administra ambos ids de proveedor: `openai` y
`openai-codex`.

Eso cubre los proveedores que todavía encajan en los transportes normales de OpenClaw. Un proveedor
que necesite un ejecutor de solicitudes totalmente personalizado es una superficie de extensión
distinta y más profunda.

## Rotación de claves de API

- Admite rotación genérica de proveedores para proveedores seleccionados.
- Configura varias claves mediante:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (una sola anulación live, máxima prioridad)
  - `<PROVIDER>_API_KEYS` (lista separada por comas o punto y coma)
  - `<PROVIDER>_API_KEY` (clave principal)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por ejemplo `<PROVIDER>_API_KEY_1`)
- Para los proveedores de Google, `GOOGLE_API_KEY` también se incluye como fallback.
- El orden de selección de claves preserva la prioridad y elimina valores duplicados.
- Las solicitudes se reintentan con la siguiente clave solo en respuestas de límite de tasa (por
  ejemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` o mensajes periódicos de límite de uso).
- Los fallos que no son por límite de tasa fallan inmediatamente; no se intenta rotación de claves.
- Cuando fallan todas las claves candidatas, se devuelve el error final del último intento.

## Proveedores integrados (catálogo pi-ai)

OpenClaw incluye el catálogo pi-ai. Estos proveedores no requieren
configuración de `models.providers`; solo configura la autenticación y elige un modelo.

### OpenAI

- Proveedor: `openai`
- Autenticación: `OPENAI_API_KEY`
- Rotación opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, más `OPENCLAW_LIVE_OPENAI_KEY` (una sola anulación)
- Modelos de ejemplo: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- El transporte predeterminado es `auto` (WebSocket primero, fallback a SSE)
- Anula por modelo mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- El calentamiento de WebSocket de OpenAI Responses está habilitado de forma predeterminada mediante `params.openaiWsWarmup` (`true`/`false`)
- El procesamiento prioritario de OpenAI puede habilitarse mediante `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` y `params.fastMode` asignan solicitudes Responses directas `openai/*` a `service_tier=priority` en `api.openai.com`
- Usa `params.serviceTier` cuando quieras un nivel explícito en lugar del interruptor compartido `/fast`
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`,
  `User-Agent`) se aplican solo al tráfico nativo de OpenAI hacia `api.openai.com`, no a
  proxies genéricos compatibles con OpenAI
- Las rutas nativas de OpenAI también conservan `store` de Responses, sugerencias de caché de prompts y
  modelado de payload de compatibilidad de razonamiento de OpenAI; las rutas proxy no
- `openai/gpt-5.3-codex-spark` se suprime intencionalmente en OpenClaw porque la API live de OpenAI lo rechaza; Spark se trata como exclusivo de Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Proveedor: `anthropic`
- Autenticación: `ANTHROPIC_API_KEY`
- Rotación opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, más `OPENCLAW_LIVE_ANTHROPIC_KEY` (una sola anulación)
- Modelo de ejemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Las solicitudes públicas directas a Anthropic también admiten el interruptor compartido `/fast` y `params.fastMode`, incluido el tráfico autenticado con clave de API y OAuth enviado a `api.anthropic.com`; OpenClaw lo asigna a `service_tier` de Anthropic (`auto` frente a `standard_only`)
- Nota de Anthropic: el personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que OpenClaw considera autorizados para esta integración tanto la reutilización de Claude CLI como el uso de `claude -p`, salvo que Anthropic publique una nueva política.
- El token de configuración de Anthropic sigue disponible como ruta de token compatible de OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Proveedor: `openai-codex`
- Autenticación: OAuth (ChatGPT)
- Modelo de ejemplo: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- El transporte predeterminado es `auto` (WebSocket primero, fallback a SSE)
- Anula por modelo mediante `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` también se reenvía en solicitudes nativas de Codex Responses (`chatgpt.com/backend-api`)
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`,
  `User-Agent`) solo se adjuntan en tráfico nativo de Codex hacia
  `chatgpt.com/backend-api`, no a proxies genéricos compatibles con OpenAI
- Comparte el mismo interruptor `/fast` y la misma configuración `params.fastMode` que `openai/*` directo; OpenClaw lo asigna a `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` sigue disponible cuando el catálogo OAuth de Codex lo expone; depende de los derechos
- `openai-codex/gpt-5.4` mantiene `contextWindow = 1050000` nativo y un `contextTokens = 272000` de runtime predeterminado; anula el límite de runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota de política: OpenAI Codex OAuth es compatible explícitamente para herramientas/flujos de trabajo externos como OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Otras opciones alojadas de estilo suscripción

- [Qwen Cloud](/es/providers/qwen): superficie de proveedor de Qwen Cloud más mapeo de endpoints de Alibaba DashScope y Coding Plan
- [MiniMax](/es/providers/minimax): acceso a MiniMax Coding Plan OAuth o clave de API
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

### Google Gemini (clave de API)

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY`
- Rotación opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback de `GOOGLE_API_KEY` y `OPENCLAW_LIVE_GEMINI_KEY` (una sola anulación)
- Modelos de ejemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidad: la configuración heredada de OpenClaw que usa `google/gemini-3.1-flash-preview` se normaliza a `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Las ejecuciones directas de Gemini también aceptan `agents.defaults.models["google/<model>"].params.cachedContent`
  (o el heredado `cached_content`) para reenviar un identificador nativo del proveedor
  `cachedContents/...`; los aciertos de caché de Gemini aparecen como `cacheRead` de OpenClaw

### Google Vertex y Gemini CLI

- Proveedores: `google-vertex`, `google-gemini-cli`
- Autenticación: Vertex usa ADC de gcloud; Gemini CLI usa su flujo OAuth
- Precaución: Gemini CLI OAuth en OpenClaw es una integración no oficial. Algunos usuarios han informado restricciones en cuentas de Google después de usar clientes de terceros. Revisa los términos de Google y usa una cuenta no crítica si decides continuar.
- Gemini CLI OAuth se distribuye como parte del plugin `google` incluido.
  - Instala primero Gemini CLI:
    - `brew install gemini-cli`
    - o `npm install -g @google/gemini-cli`
  - Habilita: `openclaw plugins enable google`
  - Inicia sesión: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo predeterminado: `google-gemini-cli/gemini-3-flash-preview`
  - Nota: **no** pegas un id de cliente ni un secreto en `openclaw.json`. El flujo de inicio de sesión de CLI almacena
    tokens en perfiles de autenticación en el host del gateway.
  - Si las solicitudes fallan después de iniciar sesión, configura `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway.
  - Las respuestas JSON de Gemini CLI se analizan desde `response`; el uso recurre a
    `stats`, con `stats.cached` normalizado a `cacheRead` de OpenClaw.

### Z.AI (GLM)

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- Modelo de ejemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` y `z-ai/*` se normalizan a `zai/*`
  - `zai-api-key` detecta automáticamente el endpoint Z.AI correspondiente; `zai-coding-global`, `zai-coding-cn`, `zai-global` y `zai-cn` fuerzan una superficie específica

### Vercel AI Gateway

- Proveedor: `vercel-ai-gateway`
- Autenticación: `AI_GATEWAY_API_KEY`
- Modelo de ejemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Proveedor: `kilocode`
- Autenticación: `KILOCODE_API_KEY`
- Modelo de ejemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- El catálogo de fallback estático incluye `kilocode/kilo/auto`; el descubrimiento live de
  `https://api.kilo.ai/api/gateway/models` puede ampliar aún más el catálogo de runtime.
- El enrutamiento exacto upstream detrás de `kilocode/kilo/auto` es responsabilidad de Kilo Gateway,
  no está codificado de forma fija en OpenClaw.

Consulta [/providers/kilocode](/es/providers/kilocode) para conocer los detalles de configuración.

### Otros plugins de proveedores incluidos

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelo de ejemplo: `openrouter/auto`
- OpenClaw aplica los encabezados documentados de atribución de aplicación de OpenRouter solo cuando
  la solicitud realmente apunta a `openrouter.ai`
- Los marcadores `cache_control` específicos de Anthropic para OpenRouter también se limitan a
  rutas de OpenRouter verificadas, no a URLs proxy arbitrarias
- OpenRouter permanece en la ruta de estilo proxy compatible con OpenAI, por lo que el
  modelado de solicitudes exclusivo de OpenAI nativo (`serviceTier`, `store` de Responses,
  sugerencias de caché de prompts, payloads de compatibilidad de razonamiento de OpenAI) no se reenvía
- Las referencias de OpenRouter respaldadas por Gemini conservan solo el saneamiento de firmas de pensamiento de Gemini a través de proxy;
  la validación nativa de reproducción de Gemini y las reescrituras de bootstrap permanecen desactivadas
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modelo de ejemplo: `kilocode/kilo/auto`
- Las referencias de Kilo respaldadas por Gemini conservan la misma ruta de saneamiento de firmas de pensamiento de Gemini a través de proxy;
  `kilocode/kilo/auto` y otras sugerencias sin compatibilidad con razonamiento por proxy omiten la inyección de razonamiento por proxy
- MiniMax: `minimax` (clave de API) y `minimax-portal` (OAuth)
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` para `minimax-portal`
- Modelo de ejemplo: `minimax/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7`
- La configuración de incorporación/clave de API de MiniMax escribe definiciones explícitas del modelo M2.7 con
  `input: ["text", "image"]`; el catálogo de proveedor incluido mantiene las referencias de chat
  como solo texto hasta que se materializa esa configuración del proveedor
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Modelo de ejemplo: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` (`KIMI_API_KEY` o `KIMICODE_API_KEY`)
- Modelo de ejemplo: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Modelo de ejemplo: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` o `DASHSCOPE_API_KEY`)
- Modelo de ejemplo: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Modelo de ejemplo: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Modelos de ejemplo: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Modelo de ejemplo: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Modelo de ejemplo: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Modelo de ejemplo: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Modelo de ejemplo: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Las solicitudes xAI nativas incluidas usan la ruta xAI Responses
  - `/fast` o `params.fastMode: true` reescriben `grok-3`, `grok-3-mini`,
    `grok-4` y `grok-4-0709` a sus variantes `*-fast`
  - `tool_stream` está activado de forma predeterminada; configura
    `agents.defaults.models["xai/<model>"].params.tool_stream` en `false` para
    desactivarlo
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Modelo de ejemplo: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Los modelos GLM en Cerebras usan los ids `zai-glm-4.7` y `zai-glm-4.6`.
  - URL base compatible con OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modelo de ejemplo de Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Consulta [Hugging Face (Inference)](/es/providers/huggingface).

## Proveedores mediante `models.providers` (personalizado/URL base)

Usa `models.providers` (o `models.json`) para agregar proveedores **personalizados** o
proxies compatibles con OpenAI/Anthropic.

Muchos de los plugins de proveedores incluidos a continuación ya publican un catálogo predeterminado.
Usa entradas explícitas `models.providers.<id>` solo cuando quieras anular la
URL base, los encabezados o la lista de modelos predeterminados.

### Moonshot AI (Kimi)

Moonshot se distribuye como un plugin de proveedor incluido. Usa el proveedor integrado de forma predeterminada,
y agrega una entrada explícita `models.providers.moonshot` solo cuando
necesites anular la URL base o los metadatos del modelo:

- Proveedor: `moonshot`
- Autenticación: `MOONSHOT_API_KEY`
- Modelo de ejemplo: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
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

El `kimi/k2p5` heredado sigue aceptándose como id de modelo de compatibilidad.

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

La incorporación usa de forma predeterminada la superficie de coding, pero el
catálogo general `volcengine/*` se registra al mismo tiempo.

En los selectores de modelo de incorporación/configuración, la opción de autenticación de Volcengine prioriza tanto
las filas `volcengine/*` como `volcengine-plan/*`. Si esos modelos aún no están cargados,
OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector
vacío con alcance del proveedor.

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

En los selectores de modelo de incorporación/configuración, la opción de autenticación de BytePlus prioriza tanto
las filas `byteplus/*` como `byteplus-plan/*`. Si esos modelos aún no están cargados,
OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector
vacío con alcance del proveedor.

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

- OAuth de MiniMax (Global): `--auth-choice minimax-global-oauth`
- OAuth de MiniMax (CN): `--auth-choice minimax-cn-oauth`
- Clave de API de MiniMax (Global): `--auth-choice minimax-global-api`
- Clave de API de MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o
  `MINIMAX_API_KEY` para `minimax-portal`

Consulta [/providers/minimax](/es/providers/minimax) para conocer los detalles de configuración, opciones de modelos y fragmentos de configuración.

En la ruta de streaming compatible con Anthropic de MiniMax, OpenClaw desactiva thinking de forma predeterminada
a menos que lo configures explícitamente, y `/fast on` reescribe
`MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.

División de capacidades administradas por el plugin:

- Los valores predeterminados de texto/chat permanecen en `minimax/MiniMax-M2.7`
- La generación de imágenes es `minimax/image-01` o `minimax-portal/image-01`
- La comprensión de imágenes es `MiniMax-VL-01`, administrada por plugin, en ambas rutas de autenticación de MiniMax
- La búsqueda web permanece en el id de proveedor `minimax`

### LM Studio

LM Studio se distribuye como un plugin de proveedor incluido que usa la API nativa:

- Proveedor: `lmstudio`
- Autenticación: `LM_API_TOKEN`
- URL base de inferencia predeterminada: `http://localhost:1234/v1`

Luego configura un modelo (reemplázalo por uno de los ids devueltos por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa los endpoints nativos `/api/v1/models` y `/api/v1/models/load` de LM Studio
para descubrimiento + carga automática, con `/v1/chat/completions` para inferencia de forma predeterminada.
Consulta [/providers/lmstudio](/es/providers/lmstudio) para configuración y solución de problemas.

### Ollama

Ollama se distribuye como un plugin de proveedor incluido y usa la API nativa de Ollama:

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

Ollama se detecta localmente en `http://127.0.0.1:11434` cuando optas por usarlo con
`OLLAMA_API_KEY`, y el plugin de proveedor incluido agrega Ollama directamente a
`openclaw onboard` y al selector de modelos. Consulta [/providers/ollama](/es/providers/ollama)
para incorporación, modo cloud/local y configuración personalizada.

### vLLM

vLLM se distribuye como un plugin de proveedor incluido para servidores
compatibles con OpenAI locales/autohospedados:

- Proveedor: `vllm`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:8000/v1`

Para optar por el autodescubrimiento local (cualquier valor funciona si tu servidor no exige autenticación):

```bash
export VLLM_API_KEY="vllm-local"
```

Luego configura un modelo (reemplázalo por uno de los ids devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulta [/providers/vllm](/es/providers/vllm) para más detalles.

### SGLang

SGLang se distribuye como un plugin de proveedor incluido para servidores rápidos
compatibles con OpenAI autohospedados:

- Proveedor: `sglang`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:30000/v1`

Para optar por el autodescubrimiento local (cualquier valor funciona si tu servidor no
exige autenticación):

```bash
export SGLANG_API_KEY="sglang-local"
```

Luego configura un modelo (reemplázalo por uno de los ids devueltos por `/v1/models`):

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
- Recomendado: configura valores explícitos que coincidan con los límites de tu proxy/modelo.
- Para `api: "openai-completions"` en endpoints no nativos (cualquier `baseUrl` no vacío cuyo host no sea `api.openai.com`), OpenClaw fuerza `compat.supportsDeveloperRole: false` para evitar errores 400 del proveedor por roles `developer` no admitidos.
- Las rutas de estilo proxy compatibles con OpenAI también omiten el modelado de solicitudes exclusivo de OpenAI nativo:
  no hay `service_tier`, no hay `store` de Responses, no hay sugerencias de caché de prompts, no hay
  modelado de payload de compatibilidad de razonamiento de OpenAI y no hay encabezados
  ocultos de atribución de OpenClaw.
- Si `baseUrl` está vacío o se omite, OpenClaw mantiene el comportamiento predeterminado de OpenAI (que resuelve a `api.openai.com`).
- Por seguridad, un `compat.supportsDeveloperRole: true` explícito sigue siendo reemplazado en endpoints no nativos `openai-completions`.

## Ejemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulta también: [/gateway/configuration](/es/gateway/configuration) para ejemplos completos de configuración.

## Relacionado

- [Models](/es/concepts/models) — configuración de modelos y alias
- [Model Failover](/es/concepts/model-failover) — cadenas de fallback y comportamiento de reintento
- [Configuration Reference](/es/gateway/configuration-reference#agent-defaults) — claves de configuración de modelos
- [Providers](/es/providers) — guías de configuración por proveedor
