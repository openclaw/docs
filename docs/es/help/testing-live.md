---
read_when:
    - Ejecución de pruebas smoke de matriz de modelos en vivo / backend de CLI / ACP / proveedor multimedia
    - Depuración de la resolución de credenciales de pruebas en vivo
    - Agregar una nueva prueba en vivo específica del proveedor
sidebarTitle: Live tests
summary: 'Pruebas en vivo (con acceso a la red): matriz de modelos, backends de CLI, ACP, proveedores de medios, credenciales'
title: 'Pruebas: suites en vivo'
x-i18n:
    generated_at: "2026-07-05T11:25:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de398a9334b060c2f1e520487cbf945589fb39e57cc7804a27b8a19de96c47a4
    source_path: help/testing-live.md
    workflow: 16
---

Para inicio rápido, ejecutores de QA, suites unitarias/de integración y flujos de Docker, consulta
[Pruebas](/es/help/testing). Esta página cubre las pruebas **en vivo** (que tocan la red):
matriz de modelos, backends de CLI, ACP, proveedores de medios y gestión de credenciales.

## En vivo: comandos locales de smoke

Exporta la clave de proveedor necesaria en el entorno del proceso antes de hacer
comprobaciones en vivo ad hoc.

Smoke seguro de medios:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke seguro de preparación de llamada de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` es una ejecución en seco salvo que también esté presente `--yes`; usa `--yes` solo
cuando tengas intención de realizar una llamada real. Para Twilio, Telnyx y Plivo, una
comprobación de preparación correcta requiere una URL de Webhook pública; las URL de
loopback locales/privadas se rechazan porque esos proveedores no pueden alcanzarlas.

## En vivo: barrido de capacidades de nodo Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos los comandos anunciados actualmente** por un nodo Android conectado y validar el comportamiento del contrato de comandos.
- Alcance:
  - Configuración previa/manual (la suite no instala/ejecuta/empareja la app).
  - Validación comando por comando de `node.invoke` del Gateway para el nodo Android seleccionado.
- Configuración previa requerida:
  - App Android ya conectada y emparejada con el Gateway.
  - App mantenida en primer plano.
  - Permisos/consentimiento de captura concedidos para las capacidades que esperas que pasen.
- Sustituciones opcionales de destino:
  - `OPENCLAW_ANDROID_NODE_ID` u `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App Android](/es/platforms/android)

## En vivo: smoke de modelos (claves de perfil)

Las pruebas de modelos en vivo se dividen en dos capas para aislar los fallos:

- "Modelo directo" te indica si el proveedor/modelo puede responder en absoluto con la clave dada.
- "Smoke de Gateway" te indica si la canalización completa gateway+agente funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

Las listas de modelos curadas siguientes viven en `src/agents/live-model-filter.ts` y
cambian con el tiempo; trata los arrays de allí como la fuente de verdad, no esta
página.

MiniMax M3 usa `minimax/MiniMax-M3` como referencia predeterminada de proveedor/modelo.

### Capa 1: finalización directa de modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tienes credenciales
  - Ejecutar una pequeña finalización por modelo (y regresiones dirigidas cuando sea necesario)
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - Define `OPENCLAW_LIVE_MODELS=modern`, `small` o `all` (alias de `modern`) para ejecutar realmente esta suite; de lo contrario se omite, por lo que `pnpm test:live` por sí solo permanece centrado en el smoke de Gateway.
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` ejecuta la lista de prioridad curada de alta señal (consulta [En vivo: matriz de modelos](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` ejecuta la lista de prioridad curada de modelos pequeños
  - `OPENCLAW_LIVE_MODELS=all` es un alias de `modern`
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista permitida separada por comas)
  - Las ejecuciones locales de modelos pequeños de Ollama usan de forma predeterminada `http://127.0.0.1:11434`; define `OPENCLAW_LIVE_OLLAMA_BASE_URL` solo para endpoints LAN, personalizados u Ollama Cloud.
  - Los barridos modern/all y small usan de forma predeterminada la longitud de su lista curada como límite; define `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido exhaustivo del perfil seleccionado o un número positivo para un límite menor.
  - Los barridos exhaustivos usan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para el tiempo de espera de toda la prueba de modelo directo. Valor predeterminado: 60 minutos.
  - Las sondas de modelo directo se ejecutan con paralelismo de 20 vías de forma predeterminada; define `OPENCLAW_LIVE_MODEL_CONCURRENCY` para sustituirlo.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista permitida separada por comas)
- De dónde vienen las claves:
  - De forma predeterminada: almacén de perfiles y alternativas de entorno
  - Define `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para imponer solo **almacén de perfiles**
- Por qué existe esto:
  - Separa "la API del proveedor está rota / la clave no es válida" de "la canalización de agente de Gateway está rota"
  - Contiene regresiones pequeñas y aisladas (ejemplo: reproducción de razonamiento de OpenAI Responses/Codex Responses + flujos de llamadas a herramientas)

### Capa 2: smoke de Gateway + agente dev (lo que "@openclaw" hace realmente)

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Arrancar un Gateway en proceso
  - Crear/parchear una sesión `agent:dev:*` (sustitución de modelo por ejecución)
  - Iterar modelos con claves y validar:
    - respuesta "significativa" (sin herramientas)
    - una invocación real de herramienta funciona (sonda de lectura)
    - sondas opcionales adicionales de herramienta (sonda exec+read)
    - las rutas de regresión de OpenAI (solo llamada a herramienta -> seguimiento) siguen funcionando
- Detalles de sondas (para poder explicar fallos rápidamente):
  - Sonda `read`: la prueba escribe un archivo nonce en el workspace y pide al agente que lo lea con `read` y devuelva el nonce.
  - Sonda `exec+read`: la prueba pide al agente que escriba con `exec` un nonce en un archivo temporal y luego lo lea de vuelta con `read`.
  - Sonda de imagen: la prueba adjunta un PNG generado (cat + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `test/helpers/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: la lista de prioridad curada de alta señal (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` ejecuta la lista curada de modelos pequeños a través de toda la canalización gateway+agente
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de `modern`
  - O define `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o lista separada por comas) para restringir
  - Los barridos modern/all y small de Gateway usan de forma predeterminada la longitud de su lista curada como límite; define `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido exhaustivo seleccionado o un número positivo para un límite menor.
- Cómo seleccionar proveedores (evita "todo OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista permitida separada por comas)
- Las sondas de herramientas + imagen siempre están activadas en esta prueba en vivo:
  - Sonda `read` + sonda `exec+read` (estrés de herramientas)
  - La sonda de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG diminuto con "CAT" + código aleatorio (`test/helpers/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente embebido reenvía al modelo un mensaje de usuario multimodal
    - Validación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten errores menores)

<Tip>
Para ver qué puedes probar en tu máquina (y los ids `provider/model` exactos), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## En vivo: smoke de backend de CLI (Claude, Gemini u otras CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar la canalización Gateway + agente usando un backend de CLI local, sin tocar tu configuración predeterminada.
- Los valores predeterminados de smoke específicos del backend viven con la definición `cli-backend.ts` del Plugin propietario.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comando/args/imagen viene de los metadatos del Plugin de backend de CLI propietario.
- Sustituciones (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt). Desactivado de forma predeterminada en las recetas de Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivos de imagen como args de CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los args de imagen cuando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para optar por la sonda de continuidad en la misma sesión Claude Sonnet -> Opus cuando el modelo seleccionado admite un destino de cambio. Desactivado de forma predeterminada, incluso en recetas de Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para optar por la sonda MCP/herramienta de loopback. Desactivado de forma predeterminada en recetas de Docker.

Ejemplo:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke barato de configuración MCP de Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Esto no pide a Gemini que genere una respuesta. Escribe la misma configuración del sistema
que OpenClaw da a Gemini, luego ejecuta `gemini --debug mcp list` para probar que un servidor
guardado `transport: "streamable-http"` se normaliza a la forma MCP HTTP de Gemini
y puede conectarse a un servidor MCP streamable-HTTP local.

Receta de Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas de Docker de un solo proveedor:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El ejecutor de Docker vive en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta el smoke de backend de CLI en vivo dentro de la imagen Docker del repositorio como el usuario no root `node`.
- Resuelve los metadatos de smoke de CLI desde el Plugin propietario, luego instala el paquete de CLI de Linux coincidente (`@anthropic-ai/claude-code` o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` ya no es un backend de CLI incluido; usa `openai/*` con el runtime de servidor de app Codex en su lugar (consulta [En vivo: smoke de arnés de servidor de app Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portable de suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primero prueba `claude -p` directo en Docker y luego ejecuta dos turnos de backend de CLI de Gateway sin conservar variables de entorno de clave de API de Anthropic. Este carril de suscripción desactiva de forma predeterminada las sondas MCP/herramienta e imagen de Claude porque consume los límites de uso de la suscripción iniciada y Anthropic puede cambiar el comportamiento de facturación y límites de tasa de Claude Agent SDK / `claude -p` sin una versión de OpenClaw.
- Claude y Gemini admiten el mismo conjunto de sondas (turno de texto, clasificación de imagen, llamada a herramienta MCP `cron`, continuidad de cambio de modelo) mediante las marcas anteriores, pero ninguna de esas sondas se ejecuta de forma predeterminada: opta por cada marca según sea necesario.

## En vivo: alcanzabilidad del proxy HTTP/2 de APNs

- Prueba: `src/infra/push-apns-http2.live.test.ts`
- Objetivo: tunelizar a través de un proxy HTTP CONNECT local hasta el endpoint APNs sandbox de Apple, enviar la solicitud de validación HTTP/2 de APNs y validar que la respuesta real `403 InvalidProviderToken` de Apple vuelve por la ruta del proxy.
- Habilitar:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Tiempo de espera opcional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## En vivo: smoke de enlace ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de enlace de conversaciones ACP con un agente ACP en vivo:
  - enviar `/acp spawn <agent> --bind here`
  - enlazar in situ una conversación sintética de canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue a la transcripción de la sesión ACP enlazada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valores predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación estilo DM de Slack
  - Backend ACP: `acpx`
- Sustituciones:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (o `on`/`true`/`yes`) para forzar la activación de la sonda de imagen; cualquier otro valor la fuerza a desactivarse. Se ejecuta de forma predeterminada para todos los agentes excepto `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Notas:
  - Este carril usa la superficie `chat.send` del Gateway con campos sintéticos de ruta de origen solo para administradores, de modo que las pruebas puedan adjuntar contexto de canal de mensajes sin fingir una entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está definido, la prueba usa el registro de agentes integrado del Plugin `acpx` incorporado para el agente del arnés ACP seleccionado.
  - La creación de MCP Cron de sesión enlazada es de mejor esfuerzo de forma predeterminada porque los arneses ACP externos pueden cancelar llamadas MCP después de que haya pasado la prueba de enlace/imagen; define `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para hacer estricta esa sonda Cron posterior al enlace.

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

- El ejecutor de Docker está en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta la prueba de humo de enlace ACP contra los agentes CLI en vivo agregados en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` u `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para acotar la matriz.
- Prepara el material de autenticación CLI correspondiente dentro del contenedor y luego instala la CLI en vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid mediante `https://app.factory.ai/cli`, `@google/gemini-cli` u `opencode-ai`) si falta. El propio backend ACP es el paquete `acpx/runtime` incorporado del Plugin oficial `acpx`.
- La variante Docker de Droid prepara `~/.factory` para la configuración, reenvía `FACTORY_API_KEY` y requiere esa clave de API porque la autenticación local de Factory mediante OAuth/keyring no es portable al contenedor. Usa la entrada de registro integrada de ACPX `droid exec --output-format acp`.
- La variante Docker de OpenCode es un carril de regresión estricto de un solo agente. Escribe un modelo predeterminado temporal `OPENCODE_CONFIG_CONTENT` desde `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predeterminado `opencode/kimi-k2.6`).
- Las llamadas directas a la CLI `acpx` son solo una ruta manual/de solución alternativa para comparar el comportamiento fuera del Gateway. La prueba de humo Docker de enlace ACP ejercita el backend de runtime `acpx` incorporado de OpenClaw.

## En vivo: prueba de humo del arnés de servidor de aplicación Codex

- Objetivo: validar el arnés Codex propiedad del Plugin a través del método normal
  `agent` del gateway:
  - cargar el Plugin `codex` incluido
  - seleccionar `openai/gpt-5.5`, que enruta los turnos de agente OpenAI a través de Codex de forma predeterminada
  - enviar un primer turno de agente de gateway a `openai/gpt-5.5` con el arnés Codex seleccionado
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo
    del servidor de aplicación pueda reanudarse
  - ejecutar `/codex status` y `/codex models` a través de la misma ruta de comando
    del gateway
  - opcionalmente ejecutar dos sondas de shell con elevación revisadas por Guardian: un comando benigno
    que debería aprobarse y una carga de secreto falso que debería
    denegarse para que el agente vuelva a preguntar
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `openai/gpt-5.5`
- Sonda de imagen opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/herramienta opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda Guardian opcional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- La prueba de humo fuerza la configuración de proveedor/modelo `agentRuntime.id: "codex"` para que un arnés Codex roto
  no pueda pasar al recurrir silenciosamente a OpenClaw.
- Autenticación: autenticación del servidor de aplicación Codex desde el inicio de sesión local de suscripción de Codex. Las pruebas de humo de Docker
  también pueden proporcionar `OPENAI_API_KEY` para sondas no Codex cuando corresponda,
  además de `~/.codex/auth.json` y `~/.codex/config.toml` copiados opcionalmente.

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

- El ejecutor de Docker está en `scripts/test-live-codex-harness-docker.sh`.
- Pasa `OPENAI_API_KEY`, copia los archivos de autenticación de la CLI de Codex cuando existen, instala
  `@openai/codex` en un prefijo npm montado
  con escritura, prepara el árbol de código fuente y luego ejecuta solo la prueba en vivo del arnés Codex.
- Docker habilita de forma predeterminada las sondas de imagen, MCP/herramienta y Guardian. Define
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` cuando necesites una ejecución de depuración más acotada.
- Docker usa la misma configuración explícita de runtime Codex, por lo que los alias heredados o el
  fallback de OpenClaw no pueden ocultar una regresión del arnés Codex.

### Recetas en vivo recomendadas

Las listas de permitidos acotadas y explícitas son las más rápidas y menos inestables:

- Un solo modelo, directo (sin gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil directo de modelo pequeño:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil de gateway de modelo pequeño:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo de Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Un solo modelo, prueba de humo de gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamadas a herramientas entre varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo directa de Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Enfoque en Google (clave de API de Gemini + Antigravity):
  - Gemini (clave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo de pensamiento adaptativo de Google (`qa manual` desde la CLI privada de QA; requiere `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` y un checkout de código fuente; consulta [descripción general de QA](/es/concepts/qa-e2e-automation)):
  - Valor predeterminado dinámico de Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Presupuesto dinámico de Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notas:

- `google/...` usa la Gemini API (clave de API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI local de Gemini en tu máquina (autenticación separada + particularidades de herramientas).
- Gemini API frente a Gemini CLI:
  - API: OpenClaw llama a la Gemini API alojada de Google por HTTP (clave de API / autenticación de perfil); esto es lo que la mayoría de los usuarios entiende por "Gemini".
  - CLI: OpenClaw invoca un binario local `gemini`; tiene su propia autenticación y puede comportarse de forma distinta (streaming/compatibilidad con herramientas/desfase de versiones).

## En vivo: matriz de modelos (lo que cubrimos)

En vivo es opt-in, por lo que no hay una "lista de modelos de CI" fija. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (y su alias `all`) ejecutan la lista de prioridad seleccionada de `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` en `src/agents/live-model-filter.ts`, en este orden de prioridad:

| Proveedor/modelo                              | Notas      |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3-flash-preview`               | Gemini API |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.3`                                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

La lista seleccionada de **modelos pequeños** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), desde `SMALL_LIVE_MODEL_PRIORITY`:

| Proveedor/modelo             |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Notas sobre la lista moderna:

- Los proveedores `codex` y `codex-cli` se excluyen del barrido moderno predeterminado (cubren el comportamiento de backend de CLI/ACP, probado por separado arriba). `openai/gpt-5.5` se enruta de forma predeterminada a través del arnés de servidor de aplicación de Codex; consulta [Live: humo del arnés de servidor de aplicación de Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` y `xai` solo ejecutan sus ids de modelo seleccionados explícitamente en el barrido moderno (sin expansión automática de "todos los modelos de este proveedor").
- Incluye al menos un modelo con capacidad de imagen (variantes de visión de las familias Claude/Gemini/OpenAI, etc.) en `OPENCLAW_LIVE_GATEWAY_MODELS` para ejercitar la prueba de imagen.

Ejecuta el humo de Gateway con herramientas + imagen en un conjunto multiproveedor seleccionado manualmente:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Cobertura adicional opcional fuera de las listas seleccionadas (conveniente, elige un modelo con capacidad de "herramientas" que tengas habilitado):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (si tienes acceso)
- LM Studio: `lmstudio/...` (local; las llamadas a herramientas dependen del modo de API)

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también puedes probar mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos con capacidad de herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz live (si tienes credenciales/configuración):

- Integrados: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Mediante `models.providers` (endpoints personalizados): `minimax` (nube/API), además de cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

<Tip>
No codifiques de forma rígida "todos los modelos" en la documentación. La lista autoritativa es lo que `discoverModels(...)` devuelva en tu máquina más las claves disponibles.
</Tip>

## Credenciales (nunca confirmar en git)

Las pruebas live descubren credenciales de la misma forma que lo hace la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas live deberían encontrar las mismas claves.
- Si una prueba live dice "sin credenciales", depura de la misma forma en que depurarías `openclaw models list` / la selección de modelo.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que "claves de perfil" significa en las pruebas live)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio OAuth heredado: `~/.openclaw/credentials/` (se copia al home live preparado cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones live locales copian la configuración activa (sin las sobrescrituras `agents.*.workspace` / `agentDir`) y el `auth-profiles.json` de cada agente, no el resto del directorio de ese agente, de modo que los datos de `workspace/` y `sandboxes/` nunca llegan al home preparado, además del directorio `credentials/` heredado y los archivos/directorios de autenticación de CLI externa admitidos (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) en un home de prueba temporal.

Si quieres depender de claves de entorno, expórtalas antes de las pruebas locales o usa los
runners de Docker de abajo con un `OPENCLAW_PROFILE_FILE` explícito.

## Deepgram live (transcripción de audio)

- Prueba: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan de codificación BytePlus live

- Prueba: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sobrescritura opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Medios de flujo de trabajo ComfyUI live

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas integradas de imagen, video y `music_generate` de comfy
  - Omite cada capacidad salvo que `plugins.entries.comfy.config.<capability>` esté configurado
  - Útil después de cambiar el envío de flujos de trabajo comfy, el sondeo, las descargas o el registro de plugins

## Generación de imágenes live

- Prueba: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera cada plugin proveedor de generación de imágenes registrado
  - Usa las variables de entorno de proveedor ya exportadas antes de sondear
  - Usa claves de API live/env antes que perfiles de autenticación almacenados de forma predeterminada, para que las claves de prueba obsoletas en `auth-profiles.json` no enmascaren credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta cada proveedor configurado a través del runtime compartido de generación de imágenes:
    - `<provider>:generate`
    - `<provider>:edit` cuando el proveedor declara soporte de edición
- Proveedores integrados actuales cubiertos:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Reducción opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar sobrescrituras solo de env

Para la ruta de CLI distribuida, agrega un humo `infer` después de que pase la prueba live
del proveedor/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Esto cubre el análisis de argumentos de CLI, la resolución de configuración/agente predeterminado, la activación de
plugins integrados, el runtime compartido de generación de imágenes y la solicitud live al proveedor.
Se espera que las dependencias del plugin estén presentes antes de cargar el runtime.

## Generación de música live

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida de proveedor integrado de generación de música
  - Actualmente cubre `fal`, `google`, `minimax` y `openrouter`
  - Usa las variables de entorno de proveedor ya exportadas antes de sondear
  - Usa claves de API live/env antes que perfiles de autenticación almacenados de forma predeterminada, para que las claves de prueba obsoletas en `auth-profiles.json` no enmascaren credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta ambos modos de runtime declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - `comfy` tiene su propio archivo live separado, no este barrido compartido
- Reducción opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar sobrescrituras solo de env

## Generación de video live

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida de proveedor integrado de generación de video en `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - De forma predeterminada usa la ruta de humo segura para releases: una solicitud de texto a video por proveedor, prompt de langosta de un segundo y un límite de operación por proveedor desde `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de cola del lado del proveedor puede dominar el tiempo de release; pasa `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (o limpia la lista de omisiones) para ejecutarlo explícitamente
  - Usa las variables de entorno de proveedor ya exportadas antes de sondear
  - Usa claves de API live/env antes que perfiles de autenticación almacenados de forma predeterminada, para que las claves de prueba obsoletas en `auth-profiles.json` no enmascaren credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Define `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por buffer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por buffer en el barrido compartido
  - Proveedor `imageToVideo` declarado actualmente pero omitido en el barrido compartido:
    - `vydra` (la entrada de imagen local respaldada por buffer no se admite en este carril)
  - Cobertura específica de proveedor para Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Ese archivo ejecuta `veo3` de texto a video más un carril `kling` de imagen a video que usa de forma predeterminada un fixture de URL de imagen remota (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` para sobrescribir).
  - Cobertura live actual de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado se resuelve a `gen4_aleph`
  - Proveedores `videoToVideo` declarados actualmente pero omitidos en el barrido compartido:
    - `alibaba`, `google`, `openai`, `qwen`, `xai` porque esas rutas actualmente requieren URL de referencia `http(s)` remotas en lugar de entrada local respaldada por buffer
- Reducción opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una ejecución de humo agresiva
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar sobrescrituras solo de env

## Arnés de medios live

- Comando: `pnpm test:live:media`
- Punto de entrada: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, que ejecuta `pnpm test:live -- <suite-test-file>` por cada suite seleccionada, de modo que el comportamiento de Heartbeat y modo silencioso se mantenga consistente con otras ejecuciones de `pnpm test:live`.
- Propósito:
  - Ejecuta las suites live compartidas de imagen, música y video a través de un único punto de entrada nativo del repo
  - Carga automáticamente variables de entorno de proveedor faltantes desde `~/.profile`
  - Reduce automáticamente cada suite a proveedores que actualmente tienen autenticación utilizable de forma predeterminada
- Flags:
  - `--providers <csv>` filtro global de proveedor; `--image-providers` / `--music-providers` / `--video-providers` acotan un filtro a una suite
  - `--all-providers` omite el autofiltro basado en autenticación
  - `--allow-empty` sale con `0` cuando el filtrado no deja proveedores ejecutables
  - `--quiet` / `--no-quiet` se pasan a `test:live`
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Pruebas](/es/help/testing) - suites unitarias, de integración, QA y Docker
