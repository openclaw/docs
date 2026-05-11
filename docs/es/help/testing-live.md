---
read_when:
    - Ejecución de pruebas de humo de la matriz de modelos en vivo / backend de CLI / ACP / proveedor de medios
    - Depuración de la resolución de credenciales de pruebas en vivo
    - Agregar una nueva prueba en vivo específica del proveedor
sidebarTitle: Live tests
summary: 'Pruebas en vivo (que interactúan con la red): matriz de modelos, backends de CLI, ACP, proveedores de medios, credenciales'
title: 'Pruebas: suites en vivo'
x-i18n:
    generated_at: "2026-05-11T20:39:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

Para inicio rápido, ejecutores de QA, suites unitarias/de integración y flujos de Docker, consulta
[Pruebas](/es/help/testing). Esta página cubre las suites de prueba **en vivo**
(que tocan la red): matriz de modelos, backends de CLI, ACP y pruebas en vivo
de proveedores de medios, además de la gestión de credenciales.

## En vivo: comandos smoke de perfil local

Ejecuta `source ~/.profile` antes de las comprobaciones en vivo ad hoc para que
las claves de proveedores y las rutas de herramientas locales coincidan con tu
shell:

```bash
source ~/.profile
```

Smoke seguro de medios:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke seguro de preparación para llamadas de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` es una ejecución en seco salvo que `--yes` también esté presente.
Usa `--yes` solo cuando quieras realizar intencionadamente una llamada de
notificación real. Para Twilio, Telnyx y Plivo, una comprobación de preparación
correcta requiere una URL de webhook pública; los fallbacks de loopback/privados
solo locales se rechazan por diseño.

## En vivo: barrido de capacidades de Node Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando anunciado actualmente** por un Node Android conectado y afirmar el comportamiento del contrato de comandos.
- Alcance:
  - Configuración previa/manual (la suite no instala/ejecuta/empareja la app).
  - Validación comando por comando de `node.invoke` del gateway para el Node Android seleccionado.
- Configuración previa requerida:
  - App Android ya conectada y emparejada con el gateway.
  - App mantenida en primer plano.
  - Permisos/consentimiento de captura concedidos para las capacidades que esperas que pasen.
- Sobrescrituras de destino opcionales:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App Android](/es/platforms/android)

## En vivo: smoke de modelos (claves de perfil)

Las pruebas en vivo se dividen en dos capas para que podamos aislar fallos:

- "Modelo directo" nos dice si el proveedor/modelo puede responder con la clave dada.
- "Smoke de Gateway" nos dice si la canalización completa de gateway+agente funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: completado directo de modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tienes credenciales
  - Ejecutar un completado pequeño por modelo (y regresiones dirigidas cuando haga falta)
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Define `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; de lo contrario se omite para mantener `pnpm test:live` centrado en el smoke de gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la lista permitida moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista permitida separada por comas)
  - Los barridos modern/all usan de forma predeterminada un límite seleccionado de alta señal; define `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
  - Los barridos exhaustivos usan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para el tiempo de espera de toda la prueba de modelo directo. Predeterminado: 60 minutos.
  - Las sondas de modelo directo se ejecutan con paralelismo de 20 vías de forma predeterminada; define `OPENCLAW_LIVE_MODEL_CONCURRENCY` para sobrescribirlo.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista permitida separada por comas)
- De dónde vienen las claves:
  - De forma predeterminada: almacén de perfiles y fallbacks de entorno
  - Define `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para aplicar **solo almacén de perfiles**
- Por qué existe esto:
  - Separa "la API del proveedor está rota / la clave no es válida" de "la canalización de agente de gateway está rota"
  - Contiene regresiones pequeñas y aisladas (ejemplo: reproducción de razonamiento de OpenAI Responses/Codex Responses + flujos de llamadas a herramientas)

### Capa 2: smoke de Gateway + agente de desarrollo (lo que "@openclaw" realmente hace)

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar un gateway en proceso
  - Crear/parchear una sesión `agent:dev:*` (sobrescritura de modelo por ejecución)
  - Iterar modelos con claves y afirmar:
    - respuesta "significativa" (sin herramientas)
    - una invocación real de herramienta funciona (sonda de lectura)
    - sondas de herramientas adicionales opcionales (sonda exec+read)
    - las rutas de regresión de OpenAI (solo llamada a herramienta → seguimiento) siguen funcionando
- Detalles de las sondas (para que puedas explicar fallos rápidamente):
  - Sonda `read`: la prueba escribe un archivo con nonce en el espacio de trabajo y pide al agente que lo `read` y devuelva el nonce.
  - Sonda `exec+read`: la prueba pide al agente que haga `exec` para escribir un nonce en un archivo temporal y luego lo `read` de vuelta.
  - Sonda de imagen: la prueba adjunta un PNG generado (gato + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la lista permitida moderna
  - O define `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o lista separada por comas) para acotar
  - Los barridos de gateway modern/all usan de forma predeterminada un límite seleccionado de alta señal; define `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores (evita "todo OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista permitida separada por comas)
- Las sondas de herramientas + imagen siempre están activadas en esta prueba en vivo:
  - sonda `read` + sonda `exec+read` (estrés de herramientas)
  - la sonda de imagen se ejecuta cuando el modelo anuncia soporte de entrada de imágenes
  - Flujo (alto nivel):
    - La prueba genera un PNG pequeño con "CAT" + código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analiza adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente embebido reenvía un mensaje de usuario multimodal al modelo
    - Afirmación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten errores menores)

<Tip>
Para ver qué puedes probar en tu máquina (y los ids exactos de `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## En vivo: smoke de backend de CLI (Claude, Codex, Gemini u otras CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar la canalización de Gateway + agente usando un backend de CLI local, sin tocar tu configuración predeterminada.
- Los valores predeterminados de smoke específicos del backend viven con la definición `cli-backend.ts` del plugin propietario.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comando/args/imagen viene de los metadatos del plugin de backend de CLI propietario.
- Sobrescrituras (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt). Las recetas de Docker desactivan esto de forma predeterminada salvo que se solicite explícitamente.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivos de imagen como args de CLI en lugar de inyección en prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los args de imagen cuando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para optar por la sonda de continuidad en la misma sesión de Claude Sonnet -> Opus cuando el modelo seleccionado admite un destino de cambio. Las recetas de Docker desactivan esto de forma predeterminada para la fiabilidad agregada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para optar por la sonda de loopback de MCP/herramienta. Las recetas de Docker desactivan esto de forma predeterminada salvo que se solicite explícitamente.

Ejemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke económico de configuración MCP de Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Esto no pide a Gemini que genere una respuesta. Escribe la misma configuración
de sistema que OpenClaw da a Gemini y luego ejecuta `gemini --debug mcp list`
para demostrar que un servidor `transport: "streamable-http"` guardado se
normaliza a la forma HTTP MCP de Gemini y puede conectarse a un servidor MCP
streamable-HTTP local.

Receta de Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas de Docker de proveedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El ejecutor de Docker vive en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta el smoke de backend de CLI en vivo dentro de la imagen Docker del repo como el usuario `node` no root.
- Resuelve los metadatos de smoke de CLI desde la extensión propietaria y luego instala el paquete de CLI de Linux correspondiente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portable de suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primero demuestra `claude -p` directo en Docker y luego ejecuta dos turnos de backend de CLI de Gateway sin conservar vars de entorno de clave API de Anthropic. Esta vía de suscripción desactiva por defecto las sondas MCP/herramienta e imagen de Claude porque Claude actualmente enruta el uso de apps de terceros mediante facturación de uso extra en lugar de límites normales del plan de suscripción.
- El smoke de backend de CLI en vivo ahora ejerce el mismo flujo de extremo a extremo para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a herramienta `cron` de MCP verificada mediante la CLI de gateway.
- El smoke predeterminado de Claude también parchea la sesión de Sonnet a Opus y verifica que la sesión reanudada todavía recuerda una nota anterior.

## En vivo: alcanzabilidad de proxy HTTP/2 de APNs

- Prueba: `src/infra/push-apns-http2.live.test.ts`
- Objetivo: tunelizar a través de un proxy HTTP CONNECT local hasta el endpoint APNs sandbox de Apple, enviar la solicitud de validación HTTP/2 de APNs y afirmar que la respuesta real `403 InvalidProviderToken` de Apple vuelve por la ruta del proxy.
- Habilitar:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Tiempo de espera opcional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## En vivo: smoke de enlace ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de vinculación de conversación ACP con un agente ACP en vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular in situ una conversación sintética de canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue a la transcripción de la sesión ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valores predeterminados:
  - agentes ACP en Docker: `claude,codex,gemini`
  - agente ACP para `pnpm test:live ...` directo: `claude`
  - canal sintético: contexto de conversación estilo DM de Slack
  - backend ACP: `acpx`
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
  - Este carril usa la superficie `chat.send` del gateway con campos de ruta de origen sintéticos solo para administradores, para que las pruebas puedan adjuntar contexto de canal de mensajes sin simular una entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está definido, la prueba usa el registro de agentes integrado del plugin `acpx` embebido para el agente del entorno de pruebas ACP seleccionado.
  - La creación MCP de Cron de sesión vinculada es de mejor esfuerzo de forma predeterminada porque los entornos de prueba ACP externos pueden cancelar llamadas MCP después de que la prueba de vinculación/imagen haya pasado; define `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para hacer estricta esa sonda Cron posterior a la vinculación.

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
- De forma predeterminada, ejecuta la prueba de humo de vinculación ACP contra los agentes CLI en vivo agregados en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` u `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para acotar la matriz.
- Carga `~/.profile`, prepara el material de autenticación CLI correspondiente en el contenedor y luego instala la CLI en vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid mediante `https://app.factory.ai/cli`, `@google/gemini-cli` u `opencode-ai`) si falta. El backend ACP en sí es el paquete `acpx/runtime` embebido del plugin oficial `acpx`.
- La variante Docker de Droid prepara `~/.factory` para la configuración, reenvía `FACTORY_API_KEY` y requiere esa clave de API porque la autenticación local OAuth/keyring de Factory no es portable al contenedor. Usa la entrada de registro integrada de ACPX `droid exec --output-format acp`.
- La variante Docker de OpenCode es un carril estricto de regresión de un solo agente. Escribe un modelo predeterminado temporal `OPENCODE_CONFIG_CONTENT` desde `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predeterminado `opencode/kimi-k2.6`) después de cargar `~/.profile`, y `pnpm test:docker:live-acp-bind:opencode` requiere una transcripción de asistente vinculada en lugar de aceptar el salto genérico posterior a la vinculación.
- Las llamadas directas a la CLI `acpx` son solo una ruta manual/de solución alternativa para comparar el comportamiento fuera del Gateway. La prueba de humo Docker de vinculación ACP ejercita el backend de runtime `acpx` embebido de OpenClaw.

## En vivo: prueba de humo del entorno de pruebas del servidor de aplicación de Codex

- Objetivo: validar el entorno de pruebas Codex propiedad del plugin a través del método normal
  `agent` del gateway:
  - cargar el plugin `codex` incluido
  - seleccionar `openai/gpt-5.5`, que enruta por defecto los turnos de agente de OpenAI a través de Codex
  - enviar un primer turno de agente del gateway a `openai/gpt-5.5` con el entorno de pruebas Codex seleccionado
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo del servidor de aplicación pueda reanudarse
  - ejecutar `/codex status` y `/codex models` a través de la misma ruta de comando del gateway
  - opcionalmente ejecutar dos sondas de shell escaladas revisadas por Guardian: un comando benigno que debería aprobarse y una carga de secreto falso que debería denegarse para que el agente vuelva a preguntar
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `openai/gpt-5.5`
- Sonda de imagen opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/herramienta opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda Guardian opcional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- La prueba de humo fuerza el proveedor/modelo `agentRuntime.id: "codex"` para que un entorno de pruebas Codex roto no pueda pasar mediante una recaída silenciosa a PI.
- Autenticación: autenticación del servidor de aplicación Codex desde el inicio de sesión de suscripción local de Codex. Las pruebas de humo Docker también pueden proporcionar `OPENAI_API_KEY` para sondas no Codex cuando corresponda, además de `~/.codex/auth.json` y `~/.codex/config.toml` copiados opcionalmente.

Receta local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta de Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notas de Docker:

- El ejecutor de Docker vive en `scripts/test-live-codex-harness-docker.sh`.
- Carga el `~/.profile` montado, pasa `OPENAI_API_KEY`, copia los archivos de autenticación de la CLI de Codex cuando están presentes, instala `@openai/codex` en un prefijo npm montado con permisos de escritura, prepara el árbol de código fuente y luego ejecuta solo la prueba en vivo del entorno de pruebas Codex.
- Docker habilita de forma predeterminada las sondas de imagen, MCP/herramienta y Guardian. Define `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` cuando necesites una ejecución de depuración más acotada.
- Docker usa la misma configuración explícita del runtime Codex, por lo que los alias heredados o la recaída a PI no pueden ocultar una regresión del entorno de pruebas Codex.

### Recetas en vivo recomendadas

Las listas de permitidos acotadas y explícitas son las más rápidas y las menos inestables:

- Un solo modelo, directo (sin gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Un solo modelo, prueba de humo del gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamadas a herramientas entre varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque en Google (clave de API de Gemini + Antigravity):
  - Gemini (clave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo de pensamiento adaptativo de Google:
  - Si las claves locales viven en el perfil de shell: `source ~/.profile`
  - Valor predeterminado dinámico de Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Presupuesto dinámico de Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notas:

- `google/...` usa la API de Gemini (clave de API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI local de Gemini en tu máquina (autenticación separada + particularidades de herramientas).
- API de Gemini frente a CLI de Gemini:
  - API: OpenClaw llama a la API alojada de Gemini de Google mediante HTTP (clave de API / autenticación de perfil); esto es lo que la mayoría de los usuarios quiere decir con "Gemini".
  - CLI: OpenClaw ejecuta un binario local `gemini`; tiene su propia autenticación y puede comportarse de forma diferente (streaming/soporte de herramientas/desfase de versiones).

## En vivo: matriz de modelos (lo que cubrimos)

No hay una "lista de modelos de CI" fija (en vivo es opcional), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto moderno de prueba de humo (llamada a herramientas + imagen)

Esta es la ejecución de "modelos comunes" que esperamos mantener funcionando:

- OpenAI (no Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita modelos Gemini 2.x más antiguos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` y `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecuta la prueba de humo del gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Línea base: llamada a herramientas (Read + Exec opcional)

Elige al menos uno por familia de proveedores:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (útil tenerla):

- xAI: `xai/grok-4.3` (o el más reciente disponible)
- Mistral: `mistral/`… (elige un modelo compatible con "tools" que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; la llamada a herramientas depende del modo de API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo compatible con imágenes en `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes compatibles con visión de Claude/Gemini/OpenAI, etc.) para ejercitar la sonda de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos compatibles con herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz en vivo (si tienes credenciales/configuración):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (nube/API), además de cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

<Tip>
No codifiques "todos los modelos" en la documentación. La lista autoritativa es lo que devuelva `discoverModels(...)` en tu máquina más las claves que estén disponibles.
</Tip>

## Credenciales (nunca confirmar)

Las pruebas en vivo descubren credenciales de la misma manera que lo hace la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas en vivo deberían encontrar las mismas claves.
- Si una prueba en vivo dice "no creds", depúrala del mismo modo en que depurarías `openclaw models list` / la selección de modelo.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significa "profile keys" en las pruebas en vivo)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia en el home en vivo preparado cuando existe, pero no es el almacén principal de claves de perfil)
- Las ejecuciones locales en vivo copian de forma predeterminada la configuración activa, los archivos `auth-profiles.json` por agente, `credentials/` heredado y los directorios de autenticación de CLI externos admitidos en un home de prueba temporal; los homes en vivo preparados omiten `workspace/` y `sandboxes/`, y las sobrescrituras de ruta `agents.*.workspace` / `agentDir` se eliminan para que las sondas permanezcan fuera del espacio de trabajo real de tu host.

Si quieres depender de claves de entorno (por ejemplo, exportadas en tu `~/.profile`), ejecuta las pruebas locales después de `source ~/.profile`, o usa los runners Docker siguientes (pueden montar `~/.profile` en el contenedor).

## Deepgram en vivo (transcripción de audio)

- Prueba: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan de codificación BytePlus en vivo

- Prueba: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sobrescritura opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Multimedia de flujo de trabajo ComfyUI en vivo

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas incluidas de imagen, video y `music_generate` de comfy
  - Omite cada capacidad a menos que `plugins.entries.comfy.config.<capability>` esté configurado
  - Útil después de cambiar el envío de flujos de trabajo comfy, el sondeo, las descargas o el registro de plugins

## Generación de imágenes en vivo

- Prueba: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera todos los Plugin proveedores registrados de generación de imágenes
  - Carga las variables de entorno de proveedor faltantes desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa de forma predeterminada las claves API en vivo/de entorno antes que los perfiles de autenticación almacenados, por lo que las claves de prueba obsoletas en `auth-profiles.json` no ocultan credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta cada proveedor configurado a través del runtime compartido de generación de imágenes:
    - `<provider>:generate`
    - `<provider>:edit` cuando el proveedor declara compatibilidad con edición
- Proveedores incluidos cubiertos actualmente:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Limitación opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar las sobrescrituras solo de entorno

Para la ruta de CLI publicada, agrega una prueba de humo de `infer` después de que
pase la prueba en vivo del proveedor/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Esto cubre el análisis de argumentos de CLI, la resolución de configuración/agente predeterminado, la activación de plugins incluidos, el runtime compartido de generación de imágenes y la solicitud en vivo al proveedor. Se espera que las dependencias de plugins estén presentes antes de cargar el runtime.

## Generación de música en vivo

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida incluida de proveedor de generación de música
  - Actualmente cubre Google y MiniMax
  - Carga las variables de entorno de proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa de forma predeterminada las claves API en vivo/de entorno antes que los perfiles de autenticación almacenados, por lo que las claves de prueba obsoletas en `auth-profiles.json` no ocultan credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta ambos modos de runtime declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual del carril compartido:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo Comfy en vivo separado, no este barrido compartido
- Limitación opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar las sobrescrituras solo de entorno

## Generación de video en vivo

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida incluida de proveedor de generación de video
  - Usa de forma predeterminada la ruta de prueba de humo segura para lanzamientos: proveedores que no son FAL, una solicitud de texto a video por proveedor, prompt de langosta de un segundo y un límite de operación por proveedor desde `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de la cola del lado del proveedor puede dominar el tiempo de lanzamiento; pasa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Carga las variables de entorno de proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa de forma predeterminada las claves API en vivo/de entorno antes que los perfiles de autenticación almacenados, por lo que las claves de prueba obsoletas en `auth-profiles.json` no ocultan credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Define `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por búfer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por búfer en el barrido compartido
  - Proveedores `imageToVideo` declarados pero omitidos actualmente en el barrido compartido:
    - `vydra` porque el `veo3` incluido es solo de texto y el `kling` incluido requiere una URL de imagen remota
  - Cobertura específica de proveedor para Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` de texto a video más un carril `kling` que usa de forma predeterminada un fixture de URL de imagen remota
  - Cobertura en vivo actual de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores `videoToVideo` declarados pero omitidos actualmente en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs de referencia remotas `http(s)` / MP4
    - `google` porque el carril compartido actual Gemini/Veo usa entrada local respaldada por búfer y esa ruta no se acepta en el barrido compartido
    - `openai` porque el carril compartido actual carece de garantías de acceso a inpainting/remix de video específicas de la organización
- Limitación opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una prueba de humo agresiva
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar las sobrescrituras solo de entorno

## Arnés multimedia en vivo

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites en vivo compartidas de imagen, música y video a través de un único punto de entrada nativo del repositorio
  - Carga automáticamente las variables de entorno de proveedor faltantes desde `~/.profile`
  - Limita automáticamente cada suite de forma predeterminada a proveedores que actualmente tienen autenticación utilizable
  - Reutiliza `scripts/test-live.mjs`, por lo que el comportamiento de Heartbeat y modo silencioso se mantiene consistente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Pruebas](/es/help/testing) - suites unitarias, de integración, de QA y Docker
