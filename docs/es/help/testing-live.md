---
read_when:
    - Ejecución de pruebas de humo de matriz de modelos en vivo / motor de CLI / ACP / proveedor de medios
    - Depuración de la resolución de credenciales de pruebas en vivo
    - Añadir una nueva prueba en vivo específica del proveedor
sidebarTitle: Live tests
summary: 'Pruebas en vivo (con acceso a red): matriz de modelos, backends de CLI, ACP, proveedores de medios, credenciales'
title: 'Pruebas: suites en vivo'
x-i18n:
    generated_at: "2026-04-30T05:46:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

Para inicio rápido, ejecutores de QA, suites unitarias/de integración y flujos Docker, consulta
[Pruebas](/es/help/testing). Esta página cubre las suites de prueba **en vivo** (que usan la red):
matriz de modelos, backends de CLI, ACP y pruebas en vivo de proveedores de medios, además del
manejo de credenciales.

## En vivo: comandos de humo de perfil local

Carga `~/.profile` antes de comprobaciones en vivo ad hoc para que las claves de proveedores y las rutas
de herramientas locales coincidan con tu shell:

```bash
source ~/.profile
```

Humo seguro de medios:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Humo seguro de preparación para llamadas de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` es una ejecución de prueba a menos que `--yes` también esté presente. Usa `--yes` solo
cuando quieras colocar intencionalmente una llamada de notificación real. Para Twilio, Telnyx y
Plivo, una comprobación de preparación correcta requiere una URL de webhook pública; los
fallbacks local-only loopback/privados se rechazan por diseño.

## En vivo: barrido de capacidades de Node Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando anunciado actualmente** por un Node Android conectado y afirmar el comportamiento del contrato de comandos.
- Alcance:
  - Configuración previa/manual condicionada (la suite no instala/ejecuta/empareja la app).
  - Validación de `node.invoke` de Gateway comando por comando para el Node Android seleccionado.
- Configuración previa requerida:
  - App Android ya conectada y emparejada con el gateway.
  - App mantenida en primer plano.
  - Permisos/consentimiento de captura concedidos para las capacidades que esperas que pasen.
- Reemplazos de destino opcionales:
  - `OPENCLAW_ANDROID_NODE_ID` u `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App Android](/es/platforms/android)

## En vivo: humo de modelos (claves de perfil)

Las pruebas en vivo se dividen en dos capas para que podamos aislar fallos:

- “Modelo directo” nos dice si el proveedor/modelo puede responder en absoluto con la clave dada.
- “Humo de Gateway” nos dice si la canalización completa gateway+agente funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: finalización directa de modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tienes credenciales
  - Ejecutar una finalización pequeña por modelo (y regresiones dirigidas cuando sea necesario)
- Cómo habilitar:
  - `pnpm test:live` (u `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Configura `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; si no, se omite para mantener `pnpm test:live` enfocado en el humo de Gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la lista permitida moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista permitida separada por comas)
  - Los barridos modern/all usan por defecto un límite curado de alta señal; configura `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite más pequeño.
  - Los barridos exhaustivos usan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para el timeout de toda la prueba de modelo directo. Predeterminado: 60 minutos.
  - Las sondas de modelo directo se ejecutan con paralelismo de 20 vías de forma predeterminada; configura `OPENCLAW_LIVE_MODEL_CONCURRENCY` para reemplazarlo.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista permitida separada por comas)
- De dónde vienen las claves:
  - De forma predeterminada: almacén de perfiles y fallbacks de env
  - Configura `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir solo el **almacén de perfiles**
- Por qué existe:
  - Separa “la API del proveedor está rota / la clave no es válida” de “la canalización de agente de Gateway está rota”
  - Contiene regresiones pequeñas y aisladas (ejemplo: repetición de razonamiento de OpenAI Responses/Codex Responses + flujos de llamadas a herramientas)

### Capa 2: humo de Gateway + agente de desarrollo (lo que "@openclaw" hace realmente)

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar un Gateway en proceso
  - Crear/parchear una sesión `agent:dev:*` (reemplazo de modelo por ejecución)
  - Iterar modelos con claves y afirmar:
    - respuesta “significativa” (sin herramientas)
    - funciona una invocación real de herramienta (sonda de lectura)
    - sondas de herramientas extra opcionales (sonda exec+read)
    - las rutas de regresión de OpenAI (solo llamada a herramienta → seguimiento) siguen funcionando
- Detalles de sondas (para que puedas explicar fallos rápidamente):
  - Sonda `read`: la prueba escribe un archivo nonce en el workspace y le pide al agente que lo lea con `read` y devuelva el nonce.
  - Sonda `exec+read`: la prueba le pide al agente que escriba con `exec` un nonce en un archivo temporal y luego lo lea de vuelta con `read`.
  - Sonda de imagen: la prueba adjunta un PNG generado (cat + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (u `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la lista permitida moderna
  - O configura `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o lista separada por comas) para acotar
  - Los barridos de Gateway modern/all usan por defecto un límite curado de alta señal; configura `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite más pequeño.
- Cómo seleccionar proveedores (evita “todo OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista permitida separada por comas)
- Las sondas de herramientas + imagen siempre están activadas en esta prueba en vivo:
  - Sonda `read` + sonda `exec+read` (estrés de herramientas)
  - La sonda de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG diminuto con “CAT” + código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analiza adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente embebido reenvía un mensaje de usuario multimodal al modelo
    - Afirmación: la respuesta contiene `cat` + el código (tolerancia de OCR: se permiten errores menores)

<Tip>
Para ver qué puedes probar en tu máquina (y los ids `provider/model` exactos), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## En vivo: humo de backend de CLI (Claude, Codex, Gemini u otras CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar la canalización Gateway + agente usando un backend de CLI local, sin tocar tu configuración predeterminada.
- Los valores predeterminados de humo específicos del backend viven con la definición `cli-backend.ts` del Plugin propietario.
- Habilitar:
  - `pnpm test:live` (u `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comandos/args/imagen viene de los metadatos del Plugin de backend de CLI propietario.
- Reemplazos (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt). Las recetas Docker desactivan esto por defecto salvo que se solicite explícitamente.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivos de imagen como argumentos de CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los argumentos de imagen cuando `IMAGE_ARG` está configurado.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para optar por la sonda de continuidad de misma sesión Claude Sonnet -> Opus cuando el modelo seleccionado admite un destino de cambio. Las recetas Docker desactivan esto por defecto para la fiabilidad agregada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para optar por la sonda MCP/herramienta local loopback. Las recetas Docker desactivan esto por defecto salvo que se solicite explícitamente.

Ejemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Humo barato de configuración MCP de Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Esto no le pide a Gemini que genere una respuesta. Escribe la misma configuración del sistema
que OpenClaw le da a Gemini, luego ejecuta `gemini --debug mcp list` para demostrar que un
servidor guardado con `transport: "streamable-http"` se normaliza a la forma MCP HTTP de Gemini
y puede conectarse a un servidor MCP streamable-HTTP local.

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

- El ejecutor Docker vive en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta el humo en vivo de backend de CLI dentro de la imagen Docker del repo como el usuario no root `node`.
- Resuelve metadatos de humo de CLI desde la extensión propietaria y luego instala el paquete de CLI Linux correspondiente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portable de suscripción Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primero demuestra `claude -p` directo en Docker y luego ejecuta dos turnos de backend de CLI de Gateway sin preservar vars env de clave de API de Anthropic. Esta vía de suscripción desactiva por defecto las sondas MCP/herramienta e imagen de Claude porque Claude actualmente enruta el uso de apps de terceros mediante facturación de uso extra en lugar de los límites normales del plan de suscripción.
- El humo en vivo de backend de CLI ahora ejercita el mismo flujo de extremo a extremo para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a la herramienta `cron` de MCP verificada mediante la CLI de Gateway.
- El humo predeterminado de Claude también parchea la sesión de Sonnet a Opus y verifica que la sesión reanudada todavía recuerda una nota anterior.

## En vivo: humo de bind ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de enlace de conversación de ACP con un agente ACP en vivo:
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
  - canal sintético: contexto de conversación de estilo Slack DM
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
  - Esta vía usa la superficie `chat.send` del Gateway con campos de ruta de origen sintética solo para administradores para que las pruebas puedan adjuntar contexto de canal de mensajes sin simular una entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está definido, la prueba usa el registro de agentes integrado del Plugin `acpx` incrustado para el agente de arnés ACP seleccionado.
  - La creación de MCP de cron de sesión vinculada es de mejor esfuerzo de forma predeterminada porque los arneses ACP externos pueden cancelar llamadas MCP después de que la prueba de enlace/imagen haya pasado; define `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para que esa sonda de Cron posterior al enlace sea estricta.

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
- De forma predeterminada, ejecuta el smoke de enlace ACP contra los agentes CLI en vivo agregados en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` u `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para reducir la matriz.
- Carga `~/.profile`, prepara el material de autenticación de la CLI correspondiente en el contenedor y luego instala la CLI en vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid mediante `https://app.factory.ai/cli`, `@google/gemini-cli` u `opencode-ai`) si falta. El backend ACP en sí es el paquete `acpx/runtime` incrustado incluido desde el Plugin `acpx`.
- La variante de Docker de Droid prepara `~/.factory` para la configuración, reenvía `FACTORY_API_KEY` y requiere esa clave de API porque la autenticación local de Factory por OAuth/keyring no es portable al contenedor. Usa la entrada de registro integrada de ACPX `droid exec --output-format acp`.
- La variante de Docker de OpenCode es una vía de regresión estricta de un solo agente. Escribe un modelo predeterminado temporal de `OPENCODE_CONFIG_CONTENT` desde `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predeterminado `opencode/kimi-k2.6`) después de cargar `~/.profile`, y `pnpm test:docker:live-acp-bind:opencode` requiere una transcripción de asistente vinculada en lugar de aceptar el salto genérico posterior al enlace.
- Las llamadas directas a la CLI `acpx` son solo una ruta manual/de solución alternativa para comparar el comportamiento fuera del Gateway. El smoke de enlace ACP en Docker ejercita el backend de runtime `acpx` incrustado de OpenClaw.

## En vivo: smoke del arnés de servidor de aplicación de Codex

- Objetivo: validar el arnés Codex propiedad del Plugin mediante el método normal de gateway
  `agent`:
  - cargar el Plugin `codex` incluido
  - seleccionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar un primer turno de agente de gateway a `openai/gpt-5.5` con el arnés Codex forzado
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo del servidor de aplicación pueda reanudarse
  - ejecutar `/codex status` y `/codex models` por la misma ruta de comandos de gateway
  - opcionalmente ejecutar dos sondas de shell escaladas revisadas por Guardian: un comando benigno que debería aprobarse y una carga de secreto falso que debería denegarse para que el agente pregunte de vuelta
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `openai/gpt-5.5`
- Sonda de imagen opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/herramienta opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda Guardian opcional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- El smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que un arnés Codex roto no pueda pasar recurriendo silenciosamente a PI.
- Autenticación: autenticación del servidor de aplicación de Codex desde el inicio de sesión de suscripción local de Codex. Los smokes de Docker también pueden proporcionar `OPENAI_API_KEY` para sondas que no son de Codex cuando corresponda, además de `~/.codex/auth.json` y `~/.codex/config.toml` copiados opcionalmente.

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

- El ejecutor de Docker está en `scripts/test-live-codex-harness-docker.sh`.
- Carga el `~/.profile` montado, pasa `OPENAI_API_KEY`, copia los archivos de autenticación de la CLI de Codex cuando están presentes, instala `@openai/codex` en un prefijo npm montado escribible, prepara el árbol de código fuente y luego ejecuta solo la prueba en vivo del arnés Codex.
- Docker habilita de forma predeterminada las sondas de imagen, MCP/herramienta y Guardian. Define `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`, `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` u `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` cuando necesites una ejecución de depuración más acotada.
- Docker también exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, lo que coincide con la configuración de la prueba en vivo para que los alias heredados o el fallback de PI no puedan ocultar una regresión del arnés Codex.

### Recetas en vivo recomendadas

Las allowlists acotadas y explícitas son las más rápidas y menos inestables:

- Un solo modelo, directo (sin gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Un solo modelo, smoke de gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamadas a herramientas entre varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque de Google (clave de API de Gemini + Antigravity):
  - Gemini (clave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke de pensamiento adaptativo de Google:
  - Si las claves locales están en el perfil de shell: `source ~/.profile`
  - Predeterminado dinámico de Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Presupuesto dinámico de Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notas:

- `google/...` usa la API de Gemini (clave de API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agente de estilo Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI local de Gemini en tu máquina (autenticación separada + particularidades de herramientas).
- API de Gemini frente a CLI de Gemini:
  - API: OpenClaw llama a la API de Gemini alojada de Google por HTTP (clave de API / autenticación de perfil); esto es lo que la mayoría de los usuarios quiere decir con “Gemini”.
  - CLI: OpenClaw invoca un binario `gemini` local; tiene su propia autenticación y puede comportarse de forma diferente (streaming/soporte de herramientas/desfase de versiones).

## En vivo: matriz de modelos (lo que cubrimos)

No hay una “lista de modelos de CI” fija (en vivo es opt-in), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto de smoke moderno (llamadas a herramientas + imagen)

Esta es la ejecución de “modelos comunes” que esperamos mantener funcionando:

- OpenAI (no Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita modelos antiguos Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` y `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecuta smoke de gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Línea base: llamadas a herramientas (Read + Exec opcional)

Elige al menos uno por familia de proveedor:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (conveniente):

- xAI: `xai/grok-4` (o el último disponible)
- Mistral: `mistral/`… (elige un modelo compatible con “herramientas” que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; las llamadas a herramientas dependen del modo de API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo compatible con imágenes en `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes compatibles con visión de Claude/Gemini/OpenAI, etc.) para ejercitar la sonda de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos compatibles con herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz en vivo (si tienes credenciales/configuración):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (nube/API), más cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

<Tip>
No codifiques “todos los modelos” de forma rígida en la documentación. La lista autoritativa es lo que `discoverModels(...)` devuelva en tu máquina más las claves que estén disponibles.
</Tip>

## Credenciales (nunca confirmar en el repositorio)

Las pruebas en vivo descubren credenciales de la misma forma que lo hace la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas en vivo deberían encontrar las mismas claves.
- Si una prueba en vivo dice “no creds”, depúrala del mismo modo en que depurarías `openclaw models list` / la selección de modelo.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que “profile keys” significa en las pruebas en vivo)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia en el hogar en vivo preparado cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones locales en vivo copian de forma predeterminada la configuración activa, los archivos `auth-profiles.json` por agente, `credentials/` heredado y los directorios de autenticación de CLI externas compatibles en un hogar de prueba temporal; los hogares en vivo preparados omiten `workspace/` y `sandboxes/`, y las sobrescrituras de ruta `agents.*.workspace` / `agentDir` se eliminan para que las sondas permanezcan fuera del espacio de trabajo real de tu host.

Si quieres depender de claves de entorno (por ejemplo, exportadas en tu `~/.profile`), ejecuta las pruebas locales después de `source ~/.profile`, o usa los ejecutores Docker de abajo (pueden montar `~/.profile` en el contenedor).

## Deepgram en vivo (transcripción de audio)

- Prueba: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan de codificación de BytePlus en vivo

- Prueba: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sobrescritura opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Multimedia de flujo de trabajo de ComfyUI en vivo

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas comfy incluidas de imagen, video y `music_generate`
  - Omite cada capacidad salvo que `plugins.entries.comfy.config.<capability>` esté configurado
  - Útil después de cambiar el envío de flujos de trabajo comfy, el sondeo, las descargas o el registro de plugins

## Generación de imágenes en vivo

- Prueba: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera todos los plugins proveedores de generación de imágenes registrados
  - Carga las variables de entorno de proveedor que falten desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa claves de API en vivo/de entorno antes que los perfiles de autenticación almacenados de forma predeterminada, de modo que las claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta cada proveedor configurado a través del runtime compartido de generación de imágenes:
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
- Acotación opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar sobrescrituras solo de entorno

Para la ruta de CLI incluida, agrega una prueba rápida de `infer` después de que pase la prueba en vivo del proveedor/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Esto cubre el análisis de argumentos de CLI, la resolución de configuración/agente predeterminado, la activación de plugins incluidos, la reparación bajo demanda de dependencias de runtime incluidas, el runtime compartido de generación de imágenes y la solicitud en vivo al proveedor.

## Generación de música en vivo

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida de proveedores incluidos de generación de música
  - Actualmente cubre Google y MiniMax
  - Carga las variables de entorno de proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa claves de API en vivo/de entorno antes que los perfiles de autenticación almacenados de forma predeterminada, de modo que las claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta ambos modos de runtime declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual del carril compartido:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo en vivo de Comfy separado, no este barrido compartido
- Acotación opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar sobrescrituras solo de entorno

## Generación de video en vivo

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida de proveedores incluidos de generación de video
  - Usa de forma predeterminada la ruta de prueba rápida segura para lanzamiento: proveedores que no sean FAL, una solicitud de texto a video por proveedor, prompt de langosta de un segundo y un límite de operación por proveedor desde `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de cola del lado del proveedor puede dominar el tiempo de lanzamiento; pasa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Carga las variables de entorno de proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa claves de API en vivo/de entorno antes que los perfiles de autenticación almacenados de forma predeterminada, de modo que las claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Define `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por búfer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por búfer en el barrido compartido
  - Proveedores `imageToVideo` declarados pero omitidos actualmente en el barrido compartido:
    - `vydra` porque el `veo3` incluido es solo texto y el `kling` incluido requiere una URL de imagen remota
  - Cobertura específica de proveedor para Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` de texto a video más un carril `kling` que usa de forma predeterminada una fixture de URL de imagen remota
  - Cobertura en vivo actual de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores `videoToVideo` declarados pero omitidos actualmente en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URL de referencia remotas `http(s)` / MP4
    - `google` porque el carril compartido actual de Gemini/Veo usa entrada local respaldada por búfer y esa ruta no se acepta en el barrido compartido
    - `openai` porque el carril compartido actual carece de garantías de acceso específicas de organización para inpaint/remix de video
- Acotación opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de cada operación de proveedor en una prueba rápida agresiva
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar sobrescrituras solo de entorno

## Arnés multimedia en vivo

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites en vivo compartidas de imagen, música y video mediante un único punto de entrada nativo del repo
  - Carga automáticamente las variables de entorno de proveedor que falten desde `~/.profile`
  - Acota automáticamente cada suite a proveedores que actualmente tienen autenticación utilizable de forma predeterminada
  - Reutiliza `scripts/test-live.mjs`, por lo que el comportamiento de Heartbeat y de modo silencioso permanece coherente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Pruebas](/es/help/testing) — suites unitarias, de integración, QA y Docker
