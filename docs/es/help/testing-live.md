---
read_when:
    - Ejecución de pruebas rápidas en vivo de matriz de modelos / backend de CLI / ACP / proveedor de medios
    - Depuración de la resolución de credenciales de pruebas en vivo
    - Agregar una nueva prueba en vivo específica del proveedor
sidebarTitle: Live tests
summary: 'Pruebas en vivo (que interactúan con la red): matriz de modelos, backends de CLI, ACP, proveedores de medios, credenciales'
title: 'Pruebas: suites en vivo'
x-i18n:
    generated_at: "2026-06-27T11:43:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

Para el inicio rápido, los ejecutores de QA, las suites unitarias/de integración y los flujos de Docker, consulta
[Pruebas](/es/help/testing). Esta página cubre las suites de pruebas **en vivo** (con acceso a red):
matriz de modelos, backends de CLI, ACP y pruebas en vivo de proveedores de medios, además
del manejo de credenciales.

## En vivo: comandos locales de prueba de humo

Exporta la clave de proveedor necesaria en el entorno del proceso antes de realizar
comprobaciones en vivo ad hoc.

Prueba de humo segura de medios:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Prueba de humo segura de preparación para llamadas de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` es un ensayo sin ejecución real salvo que también esté presente `--yes`. Usa `--yes` solo
cuando quieras realizar intencionalmente una llamada de notificación real. Para Twilio, Telnyx y
Plivo, una comprobación correcta de preparación requiere una URL de webhook pública; las
alternativas de loopback solo locales/privadas se rechazan por diseño.

## En vivo: barrido de capacidades de nodo Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando anunciado actualmente** por un nodo Android conectado y comprobar el comportamiento del contrato de comandos.
- Alcance:
  - Configuración previa/manual condicionada (la suite no instala/ejecuta/empareja la app).
  - Validación comando por comando de `node.invoke` del gateway para el nodo Android seleccionado.
- Configuración previa requerida:
  - App Android ya conectada y emparejada con el gateway.
  - App mantenida en primer plano.
  - Permisos/consentimiento de captura concedidos para las capacidades que esperas que pasen.
- Sobrescrituras opcionales del destino:
  - `OPENCLAW_ANDROID_NODE_ID` u `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App Android](/es/platforms/android)

## En vivo: prueba de humo de modelos (claves de perfil)

Las pruebas en vivo se dividen en dos capas para que podamos aislar fallos:

- "Modelo directo" nos indica si el proveedor/modelo puede responder en absoluto con la clave dada.
- "Prueba de humo de Gateway" nos indica si la canalización completa de gateway+agente funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: finalización directa de modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tienes credenciales
  - Ejecutar una finalización pequeña por modelo (y regresiones dirigidas cuando sea necesario)
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Define `OPENCLAW_LIVE_MODELS=modern`, `small` o `all` (alias de modern) para ejecutar realmente esta suite; de lo contrario, se omite para mantener `pnpm test:live` centrado en la prueba de humo de gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` para ejecutar la lista permitida restringida de modelos pequeños (rutas Qwen 8B/9B compatibles con local, Ollama Gemma, OpenRouter Qwen/GLM y Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la lista permitida moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista permitida separada por comas)
  - Las ejecuciones locales de modelos pequeños de Ollama usan de forma predeterminada `http://127.0.0.1:11434`; define `OPENCLAW_LIVE_OLLAMA_BASE_URL` solo para endpoints de LAN, personalizados u Ollama Cloud.
  - Los barridos modern/all y small usan de forma predeterminada sus límites seleccionados; define `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido exhaustivo del perfil seleccionado o un número positivo para un límite menor.
  - Los barridos exhaustivos usan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para el tiempo de espera completo de la prueba directa de modelos. Valor predeterminado: 60 minutos.
  - Las sondas directas de modelos se ejecutan con paralelismo de 20 vías de forma predeterminada; define `OPENCLAW_LIVE_MODEL_CONCURRENCY` para sobrescribirlo.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista permitida separada por comas)
- De dónde vienen las claves:
  - De forma predeterminada: almacén de perfiles y alternativas de entorno
  - Define `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir solo el **almacén de perfiles**
- Por qué existe esto:
  - Separa "la API del proveedor está rota / la clave no es válida" de "la canalización de agente de gateway está rota"
  - Contiene regresiones pequeñas y aisladas (ejemplo: reproducción de razonamiento de OpenAI Responses/Codex Responses + flujos de llamadas de herramientas)

### Capa 2: prueba de humo de Gateway + agente de desarrollo (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Levantar un gateway en el proceso
  - Crear/parchear una sesión `agent:dev:*` (sobrescritura de modelo por ejecución)
  - Iterar modelos con claves y comprobar:
    - respuesta "significativa" (sin herramientas)
    - que funciona una invocación de herramienta real (sonda de lectura)
    - sondas de herramientas adicionales opcionales (sonda exec+read)
    - las rutas de regresión de OpenAI (solo llamada de herramienta → seguimiento) siguen funcionando
- Detalles de las sondas (para que puedas explicar fallos rápidamente):
  - Sonda `read`: la prueba escribe un archivo nonce en el espacio de trabajo y pide al agente que lo haga `read` y devuelva el nonce.
  - Sonda `exec+read`: la prueba pide al agente que escriba con `exec` un nonce en un archivo temporal y luego lo vuelva a leer con `read`.
  - Sonda de imagen: la prueba adjunta un PNG generado (gato + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `test/helpers/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Valor predeterminado: lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` para ejecutar la misma lista permitida restringida de modelos pequeños a través de la canalización completa de gateway+agente
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la lista permitida moderna
  - O define `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o una lista separada por comas) para acotar
  - Los barridos de gateway modern/all y small usan de forma predeterminada sus límites seleccionados; define `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido exhaustivo seleccionado o un número positivo para un límite menor.
- Cómo seleccionar proveedores (evita "todo OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista permitida separada por comas)
- Las sondas de herramientas + imagen siempre están activadas en esta prueba en vivo:
  - Sonda `read` + sonda `exec+read` (estrés de herramientas)
  - la sonda de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG diminuto con "CAT" + código aleatorio (`test/helpers/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente embebido reenvía un mensaje de usuario multimodal al modelo
    - Comprobación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten errores menores)

<Tip>
Para ver qué puedes probar en tu máquina (y los ids exactos de `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## En vivo: prueba de humo de backend de CLI (Claude, Gemini u otras CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar la canalización de Gateway + agente usando un backend de CLI local, sin tocar tu configuración predeterminada.
- Los valores predeterminados de prueba de humo específicos de backend viven con la definición `cli-backend.ts` de la extensión propietaria.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comando/argumentos/imagen proviene de los metadatos del plugin de backend de CLI propietario.
- Sobrescrituras (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt). Las recetas de Docker lo desactivan de forma predeterminada salvo que se solicite explícitamente.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivo de imagen como argumentos de CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los argumentos de imagen cuando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para optar por la sonda de continuidad en la misma sesión de Claude Sonnet -> Opus cuando el modelo seleccionado admite un destino de cambio. Las recetas de Docker lo desactivan de forma predeterminada para mejorar la fiabilidad agregada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para optar por la sonda de loopback de MCP/herramientas. Las recetas de Docker lo desactivan de forma predeterminada salvo que se solicite explícitamente.

Ejemplo:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Prueba de humo económica de configuración MCP de Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Esto no pide a Gemini que genere una respuesta. Escribe la misma configuración de sistema
que OpenClaw entrega a Gemini y luego ejecuta `gemini --debug mcp list` para demostrar que un
servidor guardado con `transport: "streamable-http"` se normaliza a la forma MCP HTTP de Gemini
y puede conectarse a un servidor MCP streamable-HTTP local.

Receta de Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas de Docker para proveedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El ejecutor de Docker vive en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta la prueba de humo en vivo de backend de CLI dentro de la imagen Docker del repositorio como el usuario no root `node`.
- Resuelve los metadatos de prueba de humo de CLI desde la extensión propietaria y luego instala el paquete CLI de Linux correspondiente (`@anthropic-ai/claude-code` o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (valor predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portátil de suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` desde `claude setup-token`. Primero demuestra `claude -p` directo en Docker y luego ejecuta dos turnos de backend de CLI de Gateway sin conservar variables de entorno de clave API de Anthropic. Esta vía de suscripción deshabilita por defecto las sondas MCP/herramientas e imagen de Claude porque Claude actualmente enruta el uso de apps de terceros mediante facturación de uso adicional en lugar de los límites normales del plan de suscripción.
- La prueba de humo en vivo de backend de CLI ahora ejercita el mismo flujo de extremo a extremo para Claude y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a la herramienta MCP `cron` verificada mediante la CLI de gateway.
- La prueba de humo predeterminada de Claude también parchea la sesión de Sonnet a Opus y verifica que la sesión reanudada aún recuerde una nota anterior.

## En vivo: alcanzabilidad del proxy HTTP/2 de APNs

- Prueba: `src/infra/push-apns-http2.live.test.ts`
- Objetivo: tunelizar mediante un proxy HTTP CONNECT local hacia el endpoint APNs sandbox de Apple, enviar la solicitud de validación HTTP/2 de APNs y comprobar que la respuesta real `403 InvalidProviderToken` de Apple vuelve por la ruta del proxy.
- Habilitar:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Tiempo de espera opcional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## En vivo: prueba de humo de vinculación ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de enlace de conversación de ACP con un agente ACP en vivo:
  - enviar `/acp spawn <agent> --bind here`
  - enlazar en el lugar una conversación sintética de canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llega a la transcripción de la sesión ACP enlazada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valores predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación estilo DM de Slack
  - Backend ACP: `acpx`
- Sobrescrituras:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Notas:
  - Este carril usa la superficie `chat.send` del Gateway con campos de ruta de origen sintéticos solo para administradores, de modo que las pruebas puedan adjuntar contexto de canal de mensajes sin fingir una entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está definido, la prueba usa el registro de agentes integrado del Plugin `acpx` incorporado para el agente de arnés ACP seleccionado.
  - La creación de MCP de Cron de sesión enlazada es de mejor esfuerzo de forma predeterminada porque los arneses ACP externos pueden cancelar llamadas MCP después de que la prueba de enlace/imagen haya pasado; define `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para hacer estricta esa sonda Cron posterior al enlace.

Ejemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receta de Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recetas de Docker para un solo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Notas de Docker:

- El ejecutor de Docker vive en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta la prueba de humo de enlace ACP contra los agentes CLI en vivo agregados en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` u `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para acotar la matriz.
- Prepara el material de autenticación de la CLI correspondiente dentro del contenedor y luego instala la CLI en vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid mediante `https://app.factory.ai/cli`, `@google/gemini-cli` u `opencode-ai`) si falta. El backend ACP en sí es el paquete `acpx/runtime` incorporado del Plugin oficial `acpx`.
- La variante de Docker para Droid prepara `~/.factory` para la configuración, reenvía `FACTORY_API_KEY` y requiere esa clave API porque la autenticación OAuth/keyring local de Factory no es portable al contenedor. Usa la entrada de registro integrada de ACPX `droid exec --output-format acp`.
- La variante de Docker para OpenCode es un carril estricto de regresión de un solo agente. Escribe un modelo predeterminado temporal de `OPENCODE_CONFIG_CONTENT` desde `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predeterminado `opencode/kimi-k2.6`), y `pnpm test:docker:live-acp-bind:opencode` requiere una transcripción del asistente enlazado en lugar de aceptar la omisión genérica posterior al enlace.
- Las llamadas directas a la CLI de `acpx` son solo una ruta manual/de solución alternativa para comparar el comportamiento fuera del Gateway. La prueba de humo de enlace ACP de Docker ejercita el backend de runtime `acpx` incorporado de OpenClaw.

## En vivo: prueba de humo del arnés de servidor de aplicaciones de Codex

- Objetivo: validar el arnés de Codex propiedad del Plugin a través del método normal
  `agent` del Gateway:
  - cargar el Plugin `codex` incluido
  - seleccionar `openai/gpt-5.5`, que enruta los turnos de agente de OpenAI a través de Codex de forma predeterminada
  - enviar un primer turno de agente del Gateway a `openai/gpt-5.5` con el arnés de Codex seleccionado
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo del servidor de aplicaciones pueda reanudarse
  - ejecutar `/codex status` y `/codex models` a través de la misma ruta de comandos del Gateway
  - opcionalmente ejecutar dos sondas de shell escaladas revisadas por Guardian: un comando benigno que debería aprobarse y una carga de secreto falso que debería denegarse para que el agente responda con una pregunta
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `openai/gpt-5.5`
- Sonda de imagen opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/herramienta opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda Guardian opcional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- La prueba de humo fuerza el proveedor/modelo `agentRuntime.id: "codex"` para que un arnés de Codex roto no pueda pasar recurriendo silenciosamente a OpenClaw.
- Autenticación: autenticación del servidor de aplicaciones de Codex desde el inicio de sesión de suscripción local de Codex. Las pruebas de humo de Docker también pueden proporcionar `OPENAI_API_KEY` para sondas que no sean de Codex cuando corresponda, además de `~/.codex/auth.json` y `~/.codex/config.toml` copiados de forma opcional.

Receta local:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta de Docker:

```bash
pnpm test:docker:live-codex-harness
```

Notas de Docker:

- El ejecutor de Docker vive en `scripts/test-live-codex-harness-docker.sh`.
- Pasa `OPENAI_API_KEY`, copia archivos de autenticación de la CLI de Codex cuando están presentes, instala `@openai/codex` en un prefijo npm montado y escribible, prepara el árbol de fuentes y luego ejecuta solo la prueba en vivo del arnés de Codex.
- Docker habilita las sondas de imagen, MCP/herramienta y Guardian de forma predeterminada. Define `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` cuando necesites una ejecución de depuración más acotada.
- Docker usa la misma configuración explícita de runtime de Codex, así que los alias heredados o el fallback de OpenClaw no pueden ocultar una regresión del arnés de Codex.

### Recetas en vivo recomendadas

Las listas permitidas acotadas y explícitas son las más rápidas y las menos inestables:

- Un solo modelo, directo (sin Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil directo de modelo pequeño:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil de Gateway de modelo pequeño:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo de la API de Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Un solo modelo, prueba de humo de Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamadas a herramientas entre varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo directa de Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Enfoque en Google (clave API de Gemini + Antigravity):
  - Gemini (clave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo de pensamiento adaptativo de Google:
  - Valor dinámico predeterminado de Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Presupuesto dinámico de Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notas:

- `google/...` usa la API de Gemini (clave API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI local de Gemini en tu máquina (autenticación separada + peculiaridades de herramientas).
- API de Gemini frente a CLI de Gemini:
  - API: OpenClaw llama a la API alojada de Gemini de Google mediante HTTP (clave API / autenticación de perfil); esto es lo que la mayoría de los usuarios quieren decir con "Gemini".
  - CLI: OpenClaw invoca un binario local `gemini`; tiene su propia autenticación y puede comportarse de forma distinta (streaming/soporte de herramientas/desfase de versiones).

## En vivo: matriz de modelos (qué cubrimos)

No hay una "lista de modelos de CI" fija (en vivo es opt-in), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto moderno de pruebas de humo (llamada a herramientas + imagen)

Esta es la ejecución de "modelos comunes" que esperamos mantener funcionando:

- OpenAI (no Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita modelos Gemini 2.x más antiguos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` y `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API general) o `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Ejecuta la prueba de humo de Gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Línea base: llamada a herramientas (Read + Exec opcional)

Elige al menos uno por familia de proveedores:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API general) o `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Cobertura adicional opcional (conveniente tenerla):

- xAI: `xai/grok-4.3` (o la más reciente disponible)
- Mistral: `mistral/`… (elige un modelo capaz de usar "tools" que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; la llamada a herramientas depende del modo de API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo con capacidad de imagen en `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes de Claude/Gemini/OpenAI con capacidad de visión, etc.) para ejercitar la sonda de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos con capacidad de herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz en vivo (si tienes credenciales/configuración):

- Integrados: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (nube/API), más cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

<Tip>
No codifiques "todos los modelos" de forma fija en la documentación. La lista autoritativa es lo que devuelva `discoverModels(...)` en tu máquina más las claves que estén disponibles.
</Tip>

## Credenciales (nunca las confirmes)

Las pruebas en vivo descubren credenciales de la misma forma que lo hace la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas en vivo deberían encontrar las mismas claves.
- Si una prueba en vivo dice "no creds", depúrala igual que depurarías `openclaw models list` / la selección de modelo.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significa "claves de perfil" en las pruebas en vivo)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia en el inicio en vivo preparado cuando existe, pero no es el almacén principal de claves de perfil)
- Las ejecuciones locales en vivo copian la configuración activa, los archivos `auth-profiles.json` por agente, `credentials/` heredado y los directorios de autenticación de CLI externas compatibles en un inicio temporal de prueba de forma predeterminada; los inicios en vivo preparados omiten `workspace/` y `sandboxes/`, y se eliminan las sobrescrituras de rutas `agents.*.workspace` / `agentDir` para que las sondas no toquen el espacio de trabajo real de tu host.

Si quieres depender de claves de entorno, expórtalas antes de las pruebas locales o usa los
ejecutores de Docker siguientes con un `OPENCLAW_PROFILE_FILE` explícito.

## Deepgram en vivo (transcripción de audio)

- Prueba: `extensions/deepgram/audio.live.test.ts`
- Activar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan de codificación de BytePlus en vivo

- Prueba: `extensions/byteplus/live.test.ts`
- Activar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sobrescritura opcional del modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Multimedia de flujo de trabajo de ComfyUI en vivo

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Activar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas de imagen, video y `music_generate` de comfy incluido
  - Omite cada capacidad salvo que `plugins.entries.comfy.config.<capability>` esté configurado
  - Útil después de cambiar el envío de flujos de trabajo de comfy, el sondeo, las descargas o el registro de Plugin

## Generación de imágenes en vivo

- Prueba: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera cada Plugin proveedor de generación de imágenes registrado
  - Usa variables de entorno de proveedor ya exportadas antes de sondear
  - Usa claves de API en vivo/de entorno antes que perfiles de autenticación almacenados de forma predeterminada, para que las claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta cada proveedor configurado mediante el runtime compartido de generación de imágenes:
    - `<provider>:generate`
    - `<provider>:edit` cuando el proveedor declara compatibilidad con edición
- Proveedores incluidos actuales cubiertos:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restricción opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación desde el almacén de perfiles e ignorar sobrescrituras solo de entorno

Para la ruta de CLI distribuida, añade una prueba de humo de `infer` después de que pase la
prueba en vivo de proveedor/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Esto cubre el análisis de argumentos de CLI, la resolución de configuración/agente predeterminado,
la activación de Plugin incluido, el runtime compartido de generación de imágenes y la solicitud
en vivo al proveedor. Se espera que las dependencias del Plugin estén presentes antes de cargar el runtime.

## Generación de música en vivo

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Activar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida del proveedor incluido de generación de música
  - Actualmente cubre Google y MiniMax
  - Usa variables de entorno de proveedor ya exportadas antes de sondear
  - Usa claves de API en vivo/de entorno antes que perfiles de autenticación almacenados de forma predeterminada, para que las claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta ambos modos de runtime declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual de la ruta compartida:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo en vivo de Comfy separado, no este barrido compartido
- Restricción opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación desde el almacén de perfiles e ignorar sobrescrituras solo de entorno

## Generación de video en vivo

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Activar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida del proveedor incluido de generación de video
  - Usa de forma predeterminada la ruta de humo segura para releases: proveedores que no sean FAL, una solicitud de texto a video por proveedor, prompt de langosta de un segundo y un límite de operación por proveedor tomado de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de la cola del lado del proveedor puede dominar el tiempo de release; pasa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Usa variables de entorno de proveedor ya exportadas antes de sondear
  - Usa claves de API en vivo/de entorno antes que perfiles de autenticación almacenados de forma predeterminada, para que las claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por búfer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por búfer en el barrido compartido
  - Proveedores `imageToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `vydra` porque el `veo3` incluido solo admite texto y el `kling` incluido requiere una URL de imagen remota
  - Cobertura específica de Vydra por proveedor:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` de texto a video más una ruta de `kling` que usa por defecto una fixture de URL de imagen remota
  - Cobertura en vivo actual de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores `videoToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs de referencia remotas `http(s)` / MP4
    - `google` porque la ruta compartida actual de Gemini/Veo usa entrada local respaldada por búfer y esa ruta no se acepta en el barrido compartido
    - `openai` porque la ruta compartida actual carece de garantías de acceso a edición de video específicas de la organización
- Restricción opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una ejecución de humo agresiva
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación desde el almacén de perfiles e ignorar sobrescrituras solo de entorno

## Arnés multimedia en vivo

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites en vivo compartidas de imagen, música y video mediante un único punto de entrada nativo del repo
  - Usa variables de entorno de proveedor ya exportadas
  - Restringe automáticamente cada suite a los proveedores que actualmente tienen autenticación utilizable de forma predeterminada
  - Reutiliza `scripts/test-live.mjs`, por lo que el comportamiento de Heartbeat y modo silencioso se mantiene coherente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Pruebas](/es/help/testing) - suites unitarias, de integración, QA y Docker
