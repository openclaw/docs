---
read_when:
    - Ejecutar matrices de modelos en vivo / backend de CLI / ACP / pruebas smoke de proveedores de medios
    - Depurar la resolución de credenciales de pruebas en vivo
    - Añadir una nueva prueba en vivo específica de proveedor
sidebarTitle: Live tests
summary: 'Pruebas en vivo (con acceso a red): matriz de modelos, backends de CLI, ACP, proveedores de medios, credenciales'
title: 'Pruebas: suites en vivo'
x-i18n:
    generated_at: "2026-04-24T05:33:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03689542176843de6e0163011250d1c1225ee5af492f88acf945b242addd1cc9
    source_path: help/testing-live.md
    workflow: 15
---

Para inicio rápido, runners de QA, suites unitarias/integración y flujos con Docker, consulta
[Testing](/es/help/testing). Esta página cubre las suites de pruebas **en vivo** (con acceso a red):
matriz de modelos, backends de CLI, ACP y pruebas en vivo de proveedores de medios, además del
manejo de credenciales.

## En vivo: barrido de capacidades de nodo Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando actualmente anunciado** por un nodo Android conectado y verificar el comportamiento del contrato del comando.
- Alcance:
  - Configuración previa/manual (la suite no instala/ejecuta/empareja la app).
  - Validación comando por comando de `node.invoke` del gateway para el nodo Android seleccionado.
- Configuración previa obligatoria:
  - La app Android ya está conectada y emparejada al gateway.
  - La app se mantiene en primer plano.
  - Permisos/consentimiento de captura concedidos para las capacidades que esperas que funcionen.
- Sobrescrituras opcionales del objetivo:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App Android](/es/platforms/android)

## En vivo: smoke de modelos (claves de perfil)

Las pruebas en vivo se dividen en dos capas para poder aislar fallos:

- “Modelo directo” nos dice si el proveedor/modelo puede responder en absoluto con la clave dada.
- “Gateway smoke” nos dice si toda la canalización gateway+agente funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: completado directo del modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tengas credenciales
  - Ejecutar un pequeño completado por modelo (y regresiones dirigidas cuando sea necesario)
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Configura `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; de lo contrario se omite para mantener `pnpm test:live` centrado en gateway smoke
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la allowlist moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist separada por comas)
  - Los barridos modern/all usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
  - Los barridos exhaustivos usan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para el tiempo de espera total de la prueba de modelo directo. Predeterminado: 60 minutos.
  - Los sondeos de modelo directo se ejecutan con paralelismo de 20 vías por defecto; establece `OPENCLAW_LIVE_MODEL_CONCURRENCY` para sobrescribirlo.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por comas)
- De dónde vienen las claves:
  - De forma predeterminada: almacén de perfiles y respaldos de env
  - Establece `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **solo** el almacén de perfiles
- Por qué existe:
  - Separa “la API del proveedor está rota / la clave no es válida” de “la canalización del agente de gateway está rota”
  - Contiene regresiones pequeñas y aisladas (ejemplo: OpenAI Responses/Codex Responses reasoning replay + flujos de llamadas a herramientas)

### Capa 2: smoke de Gateway + agente dev (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar un gateway en proceso
  - Crear/parchear una sesión `agent:dev:*` (sobrescritura de modelo por ejecución)
  - Iterar modelos con claves y verificar:
    - respuesta “significativa” (sin herramientas)
    - que una invocación real de herramienta funciona (sondeo de lectura)
    - sondeos opcionales extra de herramientas (sondeo exec+read)
    - que las rutas de regresión de OpenAI (solo llamada de herramienta → seguimiento) siguen funcionando
- Detalles del sondeo (para que puedas explicar fallos rápidamente):
  - sondeo `read`: la prueba escribe un archivo nonce en el espacio de trabajo y pide al agente que lo `read` y devuelva el nonce.
  - sondeo `exec+read`: la prueba pide al agente que escriba un nonce con `exec` en un archivo temporal y luego lo lea con `read`.
  - sondeo de imagen: la prueba adjunta un PNG generado (gato + código aleatorizado) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la allowlist moderna
  - O establece `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o lista separada por comas) para acotar
  - Los barridos modern/all de gateway usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores (evita “OpenRouter todo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por comas)
- Los sondeos de herramientas + imagen siempre están activados en esta prueba en vivo:
  - sondeo `read` + sondeo `exec+read` (estrés de herramientas)
  - el sondeo de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG pequeño con “CAT” + código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente embebido reenvía un mensaje de usuario multimodal al modelo
    - Verificación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten errores menores)

Consejo: para ver qué puedes probar en tu máquina (y los IDs exactos `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

## En vivo: smoke de backend de CLI (Claude, Codex, Gemini u otras CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar la canalización de Gateway + agente usando un backend de CLI local, sin tocar tu configuración predeterminada.
- Los valores predeterminados de smoke específicos del backend viven con la definición `cli-backend.ts` de la extensión propietaria.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comando/args/imagen proviene de los metadatos del Plugin propietario del backend CLI.
- Sobrescrituras (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivo de imagen como args de CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los args de imagen cuando `IMAGE_ARG` está configurado.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para deshabilitar el sondeo predeterminado de continuidad en la misma sesión de Claude Sonnet -> Opus (establece `1` para forzarlo cuando el modelo seleccionado admite un objetivo de cambio).

Ejemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas Docker de proveedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El runner Docker vive en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta el smoke de backend CLI en vivo dentro de la imagen Docker del repositorio como usuario no root `node`.
- Resuelve los metadatos del smoke de CLI desde la extensión propietaria y luego instala el paquete Linux CLI correspondiente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portátil de suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primero demuestra `claude -p` directo en Docker y luego ejecuta dos turnos de Gateway CLI-backend sin conservar variables env de clave API de Anthropic. Esta línea de suscripción deshabilita por defecto los sondeos Claude MCP/tool e imagen porque Claude actualmente enruta el uso de apps de terceros mediante facturación de uso extra en lugar de los límites normales del plan de suscripción.
- El smoke de backend CLI en vivo ahora ejercita el mismo flujo end-to-end para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a la herramienta MCP `cron` verificada a través de la CLI del gateway.
- El smoke predeterminado de Claude también parchea la sesión de Sonnet a Opus y verifica que la sesión reanudada siga recordando una nota anterior.

## En vivo: smoke de enlace ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de enlace de conversación ACP con un agente ACP en vivo:
  - enviar `/acp spawn <agent> --bind here`
  - enlazar en el lugar una conversación sintética de canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue a la transcripción de la sesión ACP enlazada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación estilo Slack DM
  - Backend ACP: `acpx`
- Sobrescrituras:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Notas:
  - Esta línea usa la superficie `chat.send` del gateway con campos de ruta de origen sintéticos solo para admin, para que las pruebas puedan adjuntar contexto de canal de mensajes sin fingir entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está configurado, la prueba usa el registro integrado de agentes del Plugin `acpx` embebido para el agente ACP de arnés seleccionado.

Ejemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recetas Docker de un solo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Notas Docker:

- El runner Docker vive en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta el smoke de enlace ACP contra todos los agentes CLI en vivo compatibles en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para acotar la matriz.
- Carga `~/.profile`, prepara el material de autenticación CLI correspondiente dentro del contenedor, instala `acpx` en un prefijo npm escribible y luego instala la CLI en vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) si falta.
- Dentro de Docker, el runner establece `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que acpx mantenga disponibles para la CLI hija del arnés las variables env del proveedor procedentes del perfil cargado.

## En vivo: smoke del arnés app-server de Codex

- Objetivo: validar el arnés de Codex propiedad del Plugin a través del método normal
  `agent` del gateway:
  - cargar el Plugin integrado `codex`
  - seleccionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar un primer turno del agente del gateway a `openai/gpt-5.2` con el arnés de Codex forzado
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo
    del app-server puede reanudarse
  - ejecutar `/codex status` y `/codex models` a través de la misma ruta de
    comando del gateway
  - opcionalmente ejecutar dos sondeos de shell elevados revisados por Guardian: un
    comando benigno que debería aprobarse y una carga falsa de secreto que debería
    denegarse para que el agente vuelva a preguntar
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `openai/gpt-5.2`
- Sondeo opcional de imagen: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondeo opcional de MCP/herramienta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sondeo opcional de Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- El smoke establece `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que un arnés
  de Codex roto no pueda pasar recurriendo silenciosamente a PI.
- Autenticación: autenticación del app-server de Codex desde el inicio de sesión local de suscripción de Codex.
  Los smokes de Docker también pueden proporcionar `OPENAI_API_KEY` para sondeos no Codex cuando corresponda,
  además de `~/.codex/auth.json` y `~/.codex/config.toml` copiados opcionalmente.

Receta local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notas de Docker:

- El runner de Docker está en `scripts/test-live-codex-harness-docker.sh`.
- Carga el `~/.profile` montado, pasa `OPENAI_API_KEY`, copia archivos de
  autenticación de la CLI de Codex cuando están presentes, instala `@openai/codex` en un
  prefijo npm montado y escribible, prepara el árbol de código fuente y luego ejecuta solo la prueba en vivo del arnés de Codex.
- Docker habilita por defecto los sondeos de imagen, MCP/herramienta y Guardian. Establece
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` cuando necesites una ejecución de depuración
  más limitada.
- Docker también exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, igual que la configuración de la prueba en vivo para que los alias heredados o el respaldo a PI no puedan ocultar una regresión
  del arnés de Codex.

### Recetas recomendadas en vivo

Las allowlists acotadas y explícitas son las más rápidas y las que menos fallan:

- Modelo único, directo (sin gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke de gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamadas a herramientas en varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque en Google (clave API de Gemini + Antigravity):
  - Gemini (clave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notas:

- `google/...` usa la API de Gemini (clave API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI local de Gemini en tu máquina (autenticación separada + particularidades de herramientas).
- API de Gemini vs CLI de Gemini:
  - API: OpenClaw llama a la API alojada de Gemini de Google por HTTP (autenticación por clave API / perfil); esto es lo que la mayoría de los usuarios quieren decir con “Gemini”.
  - CLI: OpenClaw ejecuta un binario `gemini` local; tiene su propia autenticación y puede comportarse de forma diferente (streaming/compatibilidad con herramientas/desfase de versión).

## En vivo: matriz de modelos (lo que cubrimos)

No hay una “lista fija de modelos de CI” (las pruebas en vivo son opcionales), pero estos son los **modelos recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto moderno de smoke (llamadas a herramientas + imagen)

Esta es la ejecución de “modelos comunes” que esperamos que siga funcionando:

- OpenAI (no Codex): `openai/gpt-5.2`
- OAuth de OpenAI Codex: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita modelos Gemini 2.x más antiguos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecuta el smoke de gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Base: llamadas a herramientas (Read + Exec opcional)

Elige al menos uno por familia de proveedor:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (interesante tenerla):

- xAI: `xai/grok-4` (o la versión más reciente disponible)
- Mistral: `mistral/`… (elige un modelo con capacidad de herramientas que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; las llamadas a herramientas dependen del modo API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo con capacidad de imagen en `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes de OpenAI con visión, etc.) para ejercitar el sondeo de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos con capacidad de herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz en vivo (si tienes credenciales/configuración):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (nube/API), además de cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Consejo: no intentes codificar “todos los modelos” en la documentación. La lista autoritativa es lo que devuelva `discoverModels(...)` en tu máquina + las claves disponibles.

## Credenciales (no las subas nunca al repositorio)

Las pruebas en vivo descubren credenciales del mismo modo que la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas en vivo deberían encontrar las mismas claves.
- Si una prueba en vivo dice “sin credenciales”, depúralo igual que depurarías `openclaw models list` / la selección de modelos.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significa “claves de perfil” en las pruebas en vivo)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia al home temporal de pruebas en vivo cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones locales en vivo copian por defecto la configuración activa, los archivos `auth-profiles.json` por agente, el directorio heredado `credentials/` y los directorios compatibles de autenticación de CLI externa a un home temporal de prueba; los homes preparados para pruebas en vivo omiten `workspace/` y `sandboxes/`, y se eliminan las sobrescrituras de ruta `agents.*.workspace` / `agentDir` para que los sondeos no toquen tu espacio de trabajo real del host.

Si quieres depender de claves env (por ejemplo exportadas en tu `~/.profile`), ejecuta las pruebas locales después de `source ~/.profile`, o usa los runners de Docker de abajo (pueden montar `~/.profile` dentro del contenedor).

## En vivo de Deepgram (transcripción de audio)

- Prueba: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## En vivo del plan de codificación de BytePlus

- Prueba: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sobrescritura opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## En vivo de medios de flujo de trabajo de ComfyUI

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas integradas de imagen, video y `music_generate` de comfy
  - Omite cada capacidad a menos que `models.providers.comfy.<capability>` esté configurado
  - Útil después de cambiar el envío de flujos de trabajo de comfy, el polling, las descargas o el registro del Plugin

## En vivo de generación de imágenes

- Prueba: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera cada Plugin de proveedor de generación de imágenes registrado
  - Carga variables env de proveedores que faltan desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API activas/env antes que perfiles de autenticación almacenados, para que las claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta las variantes estándar de generación de imágenes mediante la capacidad compartida del entorno de ejecución:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Proveedores integrados cubiertos actualmente:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Limitación opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo de env

## En vivo de generación de música

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida integrada de proveedores de generación de música
  - Actualmente cubre Google y MiniMax
  - Carga variables env de proveedores desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API activas/env antes que perfiles de autenticación almacenados, para que las claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta ambos modos de entorno de ejecución declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual de la línea compartida:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo en vivo de Comfy separado, no este barrido compartido
- Limitación opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo de env

## En vivo de generación de video

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida integrada de proveedores de generación de video
  - Usa por defecto la ruta de smoke segura para la versión: proveedores que no son FAL, una solicitud de texto a video por proveedor, prompt de langosta de un segundo y un límite de operación por proveedor tomado de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por defecto)
  - Omite FAL por defecto porque la latencia de cola del lado del proveedor puede dominar el tiempo de la versión; pasa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Carga variables env de proveedores desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API activas/env antes que perfiles de autenticación almacenados, para que las claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta solo `generate` por defecto
  - Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por búfer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por búfer en el barrido compartido
  - Proveedores actuales `imageToVideo` declarados pero omitidos en el barrido compartido:
    - `vydra` porque el `veo3` integrado es solo texto y el `kling` integrado requiere una URL remota de imagen
  - Cobertura específica del proveedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` texto a video además de una línea `kling` que usa por defecto un fixture de URL remota de imagen
  - Cobertura actual en vivo de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores actuales `videoToVideo` declarados pero omitidos en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs de referencia remotas `http(s)` / MP4
    - `google` porque la línea compartida actual de Gemini/Veo usa entrada local respaldada por búfer y esa ruta no se acepta en el barrido compartido
    - `openai` porque la línea compartida actual no tiene garantías de acceso específicas de organización para inpaint/remix de video
- Limitación opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una ejecución de smoke agresiva
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo de env

## Arnés en vivo de medios

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites compartidas en vivo de imagen, música y video mediante un único punto de entrada nativo del repositorio
  - Carga automáticamente variables env faltantes de proveedores desde `~/.profile`
  - Limita automáticamente cada suite a proveedores que actualmente tienen autenticación utilizable por defecto
  - Reutiliza `scripts/test-live.mjs`, para que el comportamiento de Heartbeat y modo silencioso siga siendo consistente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Testing](/es/help/testing) — suites unitarias, de integración, QA y Docker
