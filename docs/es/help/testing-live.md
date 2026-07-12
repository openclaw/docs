---
read_when:
    - Ejecución de pruebas rápidas en vivo de la matriz de modelos, el backend de la CLI, ACP y el proveedor multimedia
    - Depuración de la resolución de credenciales para pruebas en vivo
    - Añadir una nueva prueba en vivo específica del proveedor
sidebarTitle: Live tests
summary: 'Pruebas en vivo (con acceso a la red): matriz de modelos, backends de CLI, ACP, proveedores multimedia, credenciales'
title: 'Pruebas: conjuntos en vivo'
x-i18n:
    generated_at: "2026-07-11T23:10:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Para un inicio rápido, ejecutores de control de calidad, suites unitarias/de integración y flujos de Docker, consulta
[Pruebas](/es/help/testing). Esta página abarca las pruebas **en vivo** (que acceden a la red):
matriz de modelos, backends de CLI, ACP, proveedores multimedia y gestión de credenciales.

## En vivo: comandos de comprobación rápida local

Exporta la clave del proveedor necesaria en el entorno del proceso antes de realizar comprobaciones
en vivo ad hoc.

Comprobación multimedia segura:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Comprobación segura de preparación para llamadas de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` es una ejecución de prueba salvo que también se incluya `--yes`; usa `--yes` únicamente
cuando pretendas realizar una llamada real. Para Twilio, Telnyx y Plivo, una
comprobación de preparación correcta requiere una URL de webhook pública; las URL de
local loopback o privadas se rechazan porque esos proveedores no pueden acceder a ellas.

## En vivo: recorrido de capacidades del Node de Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos los comandos anunciados actualmente** por un Node de Android conectado y verificar el comportamiento del contrato de cada comando.
- Alcance:
  - Configuración previa/manual (la suite no instala, ejecuta ni empareja la aplicación).
  - Validación comando por comando de `node.invoke` del Gateway para el Node de Android seleccionado.
- Configuración previa obligatoria:
  - La aplicación de Android ya está conectada y emparejada con el Gateway.
  - La aplicación se mantiene en primer plano.
  - Se han concedido los permisos y el consentimiento de captura para las capacidades que esperas que superen la prueba.
- Sustituciones opcionales del destino:
  - `OPENCLAW_ANDROID_NODE_ID` u `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [Aplicación para Android](/es/platforms/android)

## En vivo: comprobación rápida de modelos (claves de perfil)

Las pruebas de modelos en vivo se dividen en dos capas para aislar los fallos:

- «Modelo directo» indica si el proveedor/modelo puede responder con la clave proporcionada.
- «Comprobación rápida del Gateway» indica si el proceso completo de Gateway+agente funciona con ese modelo (sesiones, historial, herramientas, política del entorno aislado, etc.).

Las listas seleccionadas de modelos que aparecen a continuación se encuentran en `src/agents/live-model-filter.ts` y
cambian con el tiempo; considera las matrices de ese archivo como la fuente de referencia, no esta
página.

MiniMax M3 utiliza `minimax/MiniMax-M3` como referencia predeterminada de proveedor/modelo.

### Capa 1: finalización directa del modelo (sin Gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar los modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tengas credenciales
  - Ejecutar una finalización breve por modelo (y regresiones específicas cuando sea necesario)
- Cómo habilitarla:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - Establece `OPENCLAW_LIVE_MODELS=modern`, `small` o `all` (alias de `modern`) para ejecutar realmente esta suite; de lo contrario se omite, de modo que `pnpm test:live` por sí solo permanece centrado en la comprobación rápida del Gateway.
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` ejecuta la lista prioritaria seleccionada de alta relevancia (consulta [En vivo: matriz de modelos](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` ejecuta la lista prioritaria seleccionada de modelos pequeños
  - `OPENCLAW_LIVE_MODELS=all` es un alias de `modern`
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (lista de permitidos separada por comas)
  - Las ejecuciones locales con modelos pequeños de Ollama usan de forma predeterminada `http://127.0.0.1:11434`; establece `OPENCLAW_LIVE_OLLAMA_BASE_URL` únicamente para puntos de conexión de LAN, personalizados o de Ollama Cloud.
  - Los recorridos modern/all y small usan de forma predeterminada la longitud de su lista seleccionada como límite; establece `OPENCLAW_LIVE_MAX_MODELS=0` para realizar un recorrido exhaustivo del perfil seleccionado o un número positivo para aplicar un límite menor.
  - Los recorridos exhaustivos usan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` como tiempo de espera de toda la prueba directa de modelos. Valor predeterminado: 60 minutos.
  - Las sondas directas de modelos se ejecutan con un paralelismo de 20 de forma predeterminada; establece `OPENCLAW_LIVE_MODEL_CONCURRENCY` para sustituirlo.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista de permitidos separada por comas)
- De dónde proceden las claves:
  - De forma predeterminada: almacén de perfiles y valores alternativos del entorno
  - Establece `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir únicamente el **almacén de perfiles**
- Por qué existe:
  - Distingue «la API del proveedor está averiada/la clave no es válida» de «el proceso de agentes del Gateway está averiado»
  - Contiene regresiones pequeñas y aisladas (ejemplo: reproducción del razonamiento de OpenAI Responses/Codex Responses y flujos de llamadas a herramientas)

### Capa 2: comprobación rápida del Gateway + agente de desarrollo (lo que hace realmente «@openclaw»)

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar un Gateway dentro del proceso
  - Crear/modificar una sesión `agent:dev:*` (sustitución del modelo en cada ejecución)
  - Recorrer los modelos con claves y verificar:
    - respuesta «significativa» (sin herramientas)
    - funcionamiento de una invocación real de herramienta (sonda de lectura)
    - sondas adicionales opcionales de herramientas (sonda de ejecución+lectura)
    - continuidad del funcionamiento de las rutas de regresión de OpenAI (solo llamada a herramienta -> seguimiento)
- Detalles de las sondas (para que puedas explicar rápidamente los fallos):
  - Sonda `read`: la prueba escribe un archivo con un valor único en el espacio de trabajo y pide al agente que lo lea mediante `read` y devuelva ese valor.
  - Sonda `exec+read`: la prueba pide al agente que escriba mediante `exec` un valor único en un archivo temporal y después lo vuelva a leer mediante `read`.
  - Sonda de imagen: la prueba adjunta un PNG generado (gato + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `test/helpers/live-image-probe.ts`.
- Cómo habilitarla:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Valor predeterminado: lista prioritaria seleccionada de alta relevancia (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` ejecuta la lista seleccionada de modelos pequeños mediante el proceso completo de Gateway+agente
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de `modern`
  - También puedes establecer `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o una lista separada por comas) para limitar la selección
  - Los recorridos modern/all y small del Gateway usan de forma predeterminada la longitud de su lista seleccionada como límite; establece `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para realizar un recorrido exhaustivo de la selección o un número positivo para aplicar un límite menor.
- Cómo seleccionar proveedores (evita «todo mediante OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista de permitidos separada por comas)
- Las sondas de herramientas e imágenes siempre están activadas en esta prueba en vivo:
  - Sonda `read` + sonda `exec+read` (prueba de esfuerzo de herramientas)
  - La sonda de imagen se ejecuta cuando el modelo anuncia compatibilidad con la entrada de imágenes
  - Flujo (a grandes rasgos):
    - La prueba genera un PNG diminuto con «CAT» + un código aleatorio (`test/helpers/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - El Gateway analiza los archivos adjuntos y los convierte en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente integrado reenvía un mensaje multimodal del usuario al modelo
    - Verificación: la respuesta contiene `cat` + el código (tolerancia de OCR: se permiten errores menores)

<Tip>
Para ver qué puedes probar en tu equipo (y los identificadores exactos de `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## En vivo: comprobación rápida del backend de CLI (Claude, Gemini u otras CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar el proceso de Gateway + agente mediante un backend de CLI local sin modificar tu configuración predeterminada.
- Los valores predeterminados de comprobación rápida específicos de cada backend se encuentran en la definición `cli-backend.ts` del Plugin propietario.
- Habilitación:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento del comando, los argumentos y las imágenes procede de los metadatos del Plugin propietario del backend de CLI.
- Sustituciones (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un archivo adjunto de imagen real (las rutas se insertan en la instrucción). Desactivado de forma predeterminada en las recetas de Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar las rutas de archivos de imagen como argumentos de CLI en lugar de insertarlas en la instrucción.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los argumentos de imagen cuando se establece `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para habilitar expresamente la sonda de continuidad Claude Sonnet -> Opus en la misma sesión cuando el modelo seleccionado admita un destino de cambio. Desactivado de forma predeterminada, incluso en las recetas de Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para habilitar expresamente la sonda de MCP/herramientas mediante local loopback. Desactivado de forma predeterminada en las recetas de Docker.

Ejemplo:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Comprobación rápida económica de la configuración de MCP de Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Esto no pide a Gemini que genere una respuesta. Escribe la misma configuración del sistema
que OpenClaw proporciona a Gemini y después ejecuta `gemini --debug mcp list` para demostrar que un
servidor guardado con `transport: "streamable-http"` se normaliza al formato MCP HTTP de Gemini
y puede conectarse a un servidor MCP HTTP transmisible local.

Receta de Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas de Docker para un único proveedor:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El ejecutor de Docker se encuentra en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta la comprobación rápida en vivo del backend de CLI dentro de la imagen de Docker del repositorio como el usuario `node` sin privilegios de administrador.
- Resuelve los metadatos de comprobación rápida de CLI desde el Plugin propietario y después instala el paquete de CLI de Linux correspondiente (`@anthropic-ai/claude-code` o `@google/gemini-cli`) en un prefijo escribible almacenado en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (valor predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` ya no es un backend de CLI incluido; usa `openai/*` con el entorno de ejecución del servidor de aplicaciones de Codex (consulta [En vivo: comprobación rápida del entorno de pruebas del servidor de aplicaciones de Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portátil de una suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` procedente de `claude setup-token`. Primero verifica directamente `claude -p` en Docker y después ejecuta dos turnos del backend de CLI del Gateway sin conservar variables de entorno de claves de API de Anthropic. Esta vía de suscripción desactiva de forma predeterminada las sondas de MCP/herramientas y de imágenes de Claude porque consume los límites de uso de la suscripción iniciada y Anthropic puede cambiar el comportamiento de facturación y limitación de frecuencia de Claude Agent SDK / `claude -p` sin una versión nueva de OpenClaw.
- Claude y Gemini admiten el mismo conjunto de sondas (turno de texto, clasificación de imágenes, llamada a la herramienta `cron` de MCP y continuidad tras el cambio de modelo) mediante las opciones anteriores, pero ninguna de esas sondas se ejecuta de forma predeterminada; habilítalas expresamente mediante la opción correspondiente según sea necesario.

## En vivo: accesibilidad del proxy HTTP/2 de APNs

- Prueba: `src/infra/push-apns-http2.live.test.ts`
- Objetivo: crear un túnel mediante un proxy HTTP CONNECT local hasta el punto de conexión APNs del entorno aislado de Apple, enviar la solicitud de validación HTTP/2 de APNs y verificar que la respuesta real `403 InvalidProviderToken` de Apple vuelve a través de la ruta del proxy.
- Habilitación:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Tiempo de espera opcional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## En vivo: comprobación rápida de vinculación de ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de vinculación de conversaciones de ACP con un agente ACP en vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular en el lugar una conversación sintética de un canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue a la transcripción de la sesión ACP vinculada
- Habilitación:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valores predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación con estilo de mensaje directo de Slack
  - Backend de ACP: `acpx`
- Anulaciones:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (o `on`/`true`/`yes`) para forzar la activación de la prueba de imagen; cualquier otro valor fuerza su desactivación. Se ejecuta de forma predeterminada para todos los agentes excepto `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Notas:
  - Esta vía usa la superficie `chat.send` del Gateway con campos sintéticos de ruta de origen exclusivos para administradores, de modo que las pruebas puedan adjuntar contexto de canales de mensajes sin simular una entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está definido, la prueba usa el registro de agentes integrado del Plugin `acpx` incorporado para el agente seleccionado del entorno de pruebas ACP.
  - La creación de MCP de Cron para sesiones vinculadas es de mejor esfuerzo de forma predeterminada, porque los entornos de pruebas ACP externos pueden cancelar llamadas MCP después de que las pruebas de vinculación e imagen hayan finalizado correctamente; establece `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para hacer estricta esa prueba de Cron posterior a la vinculación.

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

- El ejecutor de Docker se encuentra en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta secuencialmente la prueba de humo de vinculación ACP con los agentes CLI en vivo del conjunto: `claude`, `codex` y, a continuación, `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` u `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para limitar la matriz.
- Prepara en el contenedor el material de autenticación correspondiente de la CLI y, si falta, instala la CLI en vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid mediante `https://app.factory.ai/cli`, `@google/gemini-cli` u `opencode-ai`). El propio backend de ACP es el paquete `acpx/runtime` incorporado del Plugin oficial `acpx`.
- La variante de Docker para Droid prepara `~/.factory` para la configuración, reenvía `FACTORY_API_KEY` y requiere esa clave de API porque la autenticación local de Factory mediante OAuth o llavero no se puede trasladar al contenedor. Usa la entrada de registro integrada de ACPX `droid exec --output-format acp`.
- La variante de Docker para OpenCode es una vía estricta de regresión para un solo agente. Escribe un modelo predeterminado temporal en `OPENCODE_CONFIG_CONTENT` a partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (valor predeterminado: `opencode/kimi-k2.6`).
- Las llamadas directas a la CLI `acpx` son únicamente una vía manual o alternativa para comparar el comportamiento fuera del Gateway. La prueba de humo de vinculación ACP en Docker ejercita el backend de ejecución `acpx` incorporado de OpenClaw.

## En vivo: prueba de humo del entorno de pruebas del servidor de aplicaciones de Codex

- Objetivo: validar el entorno de pruebas de Codex propiedad del Plugin mediante el método normal `agent` del Gateway:
  - cargar el Plugin `codex` incluido
  - seleccionar un modelo de OpenAI mediante `/model <ref> --runtime codex`
  - enviar un primer turno del agente del Gateway con el nivel de razonamiento solicitado
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo del servidor de aplicaciones pueda reanudarse
  - ejecutar `/codex status` y `/codex models` mediante la misma ruta de comandos del Gateway
  - ejecutar opcionalmente dos pruebas de shell con privilegios elevados revisadas por Guardian: un comando benigno que debería aprobarse y una carga de secreto falso que debería denegarse para que el agente solicite confirmación
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitación: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo de referencia del entorno de pruebas: `openai/gpt-5.6-luna`
- Selección predeterminada con una nueva clave de API de OpenAI: `openai/gpt-5.6`
- Razonamiento predeterminado: `low`
- Anulación del modelo: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Anulación del razonamiento: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Anulación de la matriz: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Modo de autenticación: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (predeterminado) usa el inicio de sesión copiado de Codex; `api-key` usa `OPENAI_API_KEY` mediante el servidor de aplicaciones de Codex.
- Prueba de imagen opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Prueba opcional de MCP/herramientas: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Prueba opcional de Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- La prueba de humo fuerza `agentRuntime.id: "codex"` en el proveedor/modelo para que un entorno de pruebas de Codex defectuoso no pueda pasar recurriendo silenciosamente a OpenClaw.
- Autenticación: autenticación del servidor de aplicaciones de Codex mediante el inicio de sesión de la suscripción local de Codex, o `OPENAI_API_KEY` cuando `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker puede copiar `~/.codex/auth.json` y `~/.codex/config.toml` para las ejecuciones con suscripción.

Receta local:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta de Docker:

```bash
pnpm test:docker:live-codex-harness
```

Matriz nativa de Codex para GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Valor predeterminado con una nueva clave de API de OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Esta comprobación deja `OPENCLAW_LIVE_GATEWAY_MODELS` sin definir, resuelve el modelo mediante el mecanismo nuevo de selección por inferencia durante la incorporación, comprueba `openai/gpt-5.6` y después ejecuta un turno real del Gateway con el modelo resuelto.

Matriz de GPT-5.6 incorporada en OpenClaw:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Notas de Docker:

- El ejecutor de Docker se encuentra en `scripts/test-live-codex-harness-docker.sh`.
- Pasa `OPENAI_API_KEY`, copia los archivos de autenticación de la CLI de Codex cuando están presentes, instala `@openai/codex` en un prefijo de npm montado con permisos de escritura, prepara el árbol de código fuente y, a continuación, ejecuta únicamente la prueba en vivo del entorno de pruebas de Codex.
- Docker habilita de forma predeterminada las pruebas de imagen, MCP/herramientas y Guardian. Establece `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`, `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` cuando necesites una ejecución de depuración más limitada.
- Docker usa la misma configuración explícita de ejecución de Codex, por lo que los alias heredados o la alternativa de OpenClaw no pueden ocultar una regresión del entorno de pruebas de Codex.
- Los objetivos de la matriz se ejecutan secuencialmente en un contenedor. El script de Docker amplía su tiempo de espera predeterminado de 35 minutos según el número de objetivos; cualquier tiempo de espera de un shell externo o de CI debe permitir el mismo total. La CI canónica mantiene cada objetivo de GPT-5.6 en un fragmento separado.

### Recetas recomendadas para pruebas en vivo

Las listas de permitidos limitadas y explícitas son más rápidas y menos propensas a fallos intermitentes:

- Un solo modelo, directo (sin Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil directo de modelos pequeños:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil de Gateway para modelos pequeños:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo de la API de Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Un solo modelo, prueba de humo del Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamadas a herramientas con varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo directa de GLM-5.2 con Z.AI Coding Plan:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Enfoque en Google (clave de API de Gemini + Antigravity):
  - Gemini (clave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba de humo del razonamiento adaptativo de Google (`qa manual` desde la CLI privada de control de calidad; requiere `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` y un árbol de código fuente; consulta [descripción general de control de calidad](/es/concepts/qa-e2e-automation)):
  - Valor predeterminado dinámico de Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Presupuesto dinámico de Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notas:

- `google/...` usa la API de Gemini (clave de API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (punto de conexión de agente al estilo de Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI local de Gemini en tu equipo (autenticación independiente y particularidades propias de las herramientas).
- API de Gemini frente a CLI de Gemini:
  - API: OpenClaw llama por HTTP a la API alojada de Gemini de Google (clave de API o autenticación de perfil); esto es lo que la mayoría de los usuarios entiende por «Gemini».
  - CLI: OpenClaw ejecuta un binario local `gemini` mediante el shell; tiene su propia autenticación y puede comportarse de manera diferente (transmisión, compatibilidad con herramientas y diferencias entre versiones).

## En vivo: matriz de modelos (qué cubrimos)

Las pruebas en vivo son opcionales, por lo que no existe una «lista de modelos de CI» fija. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (y su alias `all`) ejecutan la lista prioritaria seleccionada de `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` en `src/agents/live-model-filter.ts`, en este orden de prioridad:

| Proveedor/modelo                              | Notas      |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | API de Gemini |
| `google/gemini-3.5-flash`                     | API de Gemini |
| `cohere/command-a-plus-05-2026`               |            |
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
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

La lista seleccionada de **modelos pequeños** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), procedente de `SMALL_LIVE_MODEL_PRIORITY`:

| Proveedor/modelo              |
| ----------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Notas sobre la lista moderna:

- Los proveedores `codex` y `codex-cli` se excluyen del barrido moderno predeterminado (cubren el comportamiento del backend de la CLI/ACP, que se prueba por separado más arriba). `openai/gpt-5.5` se enruta de forma predeterminada mediante el arnés del servidor de aplicaciones de Codex; consulta [En vivo: prueba rápida del arnés del servidor de aplicaciones de Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` y `xai` solo ejecutan en el barrido moderno los identificadores de modelo seleccionados explícitamente (sin expansión automática a «todos los modelos de este proveedor»).
- Incluye al menos un modelo compatible con imágenes (variantes de visión de las familias Claude, Gemini, OpenAI, etc.) en `OPENCLAW_LIVE_GATEWAY_MODELS` para ejecutar la prueba de imágenes.

Ejecuta una prueba rápida del Gateway con herramientas e imágenes en un conjunto de varios proveedores seleccionado manualmente:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Cobertura adicional opcional fuera de las listas seleccionadas (recomendable; elige un modelo compatible con «herramientas» que tengas habilitado):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (si tienes acceso)
- LM Studio: `lmstudio/...` (local; las llamadas a herramientas dependen del modo de la API)

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también puedes realizar pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos compatibles con herramientas e imágenes)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Otros proveedores que puedes incluir en la matriz en vivo (si tienes credenciales/configuración):

- Integrados: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Mediante `models.providers` (endpoints personalizados): `minimax` (nube/API), además de cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

<Tip>
No codifiques de forma rígida «todos los modelos» en la documentación. La lista autoritativa es la que devuelva `discoverModels(...)` en tu máquina, junto con las claves disponibles.
</Tip>

## Credenciales (nunca las confirmes en el repositorio)

Las pruebas en vivo detectan las credenciales de la misma manera que la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas en vivo deberían encontrar las mismas claves.
- Si una prueba en vivo indica «sin credenciales», depúrala de la misma forma que depurarías `openclaw models list` / la selección de modelos.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significa «claves de perfil» en las pruebas en vivo)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de OAuth heredado: `~/.openclaw/credentials/` (se copia al directorio personal provisional de las pruebas en vivo cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones locales en vivo copian la configuración activa (sin las sobrescrituras `agents.*.workspace` / `agentDir`) y el archivo `auth-profiles.json` de cada agente, pero no el resto del directorio de ese agente, por lo que los datos de `workspace/` y `sandboxes/` nunca llegan al directorio personal provisional; también copian el directorio heredado `credentials/` y los archivos/directorios de autenticación admitidos de CLI externas (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) a un directorio personal temporal de pruebas.

Si quieres depender de claves del entorno, expórtalas antes de las pruebas locales o usa los
ejecutores de Docker que aparecen a continuación con un `OPENCLAW_PROFILE_FILE` explícito.

## Deepgram en vivo (transcripción de audio)

- Prueba: `extensions/deepgram/audio.live.test.ts`
- Habilitación: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan de programación de BytePlus en vivo

- Prueba: `extensions/byteplus/live.test.ts`
- Habilitación: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sobrescritura opcional del modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Contenido multimedia de flujos de trabajo de ComfyUI en vivo

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitación: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejecuta las rutas integradas de imágenes, vídeos y `music_generate` de comfy
  - Omite cada capacidad salvo que `plugins.entries.comfy.config.<capability>` esté configurado
  - Resulta útil después de modificar el envío de flujos de trabajo de comfy, el sondeo, las descargas o el registro del Plugin

## Generación de imágenes en vivo

- Prueba: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera todos los plugins de proveedores de generación de imágenes registrados
  - Usa las variables de entorno del proveedor ya exportadas antes de realizar las pruebas
  - De forma predeterminada, prioriza las claves de API en vivo/del entorno frente a los perfiles de autenticación almacenados, para que las claves de prueba obsoletas de `auth-profiles.json` no oculten credenciales reales del shell
  - Omite los proveedores que no tengan una autenticación, un perfil o un modelo utilizables
  - Ejecuta cada proveedor configurado mediante el entorno de ejecución compartido de generación de imágenes:
    - `<provider>:generate`
    - `<provider>:edit` cuando el proveedor declara compatibilidad con la edición
- Proveedores integrados cubiertos actualmente:
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
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación mediante el almacén de perfiles e ignorar las sobrescrituras exclusivas del entorno

Para la ruta distribuida de la CLI, añade una prueba rápida de `infer` después de que se supere
la prueba en vivo del proveedor/entorno de ejecución:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Esto cubre el análisis de argumentos de la CLI, la resolución de la configuración/del agente predeterminado, la activación
del Plugin integrado, el entorno de ejecución compartido de generación de imágenes y la solicitud al proveedor
en vivo. Se espera que las dependencias del Plugin estén presentes antes de cargar el entorno de ejecución.

## Generación de música en vivo

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitación: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejecuta la ruta compartida de proveedores integrados de generación de música
  - Actualmente cubre `fal`, `google`, `minimax` y `openrouter`
  - Usa las variables de entorno del proveedor ya exportadas antes de realizar las pruebas
  - De forma predeterminada, prioriza las claves de API en vivo/del entorno frente a los perfiles de autenticación almacenados, para que las claves de prueba obsoletas de `auth-profiles.json` no oculten credenciales reales del shell
  - Omite los proveedores que no tengan una autenticación, un perfil o un modelo utilizables
  - Ejecuta ambos modos declarados del entorno de ejecución cuando están disponibles:
    - `generate` con una entrada que solo contiene una instrucción
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - `comfy` tiene su propio archivo en vivo independiente y no forma parte de este barrido compartido
- Restricción opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación mediante el almacén de perfiles e ignorar las sobrescrituras exclusivas del entorno

## Generación de vídeo en vivo

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Prueba la ruta compartida de proveedores de generación de vídeo incluidos para `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - De forma predeterminada, usa la ruta de prueba rápida segura para lanzamientos: una solicitud de texto a vídeo por proveedor, una instrucción de langosta de un segundo y un límite de tiempo de operación por proveedor definido por `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de la cola del proveedor puede dominar el tiempo de lanzamiento; pasa `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (o vacía la lista de omisiones) para ejecutarlo explícitamente
  - Usa las variables de entorno del proveedor ya exportadas antes de realizar sondeos
  - De forma predeterminada, usa las claves de API del entorno o de ejecución en vivo antes que los perfiles de autenticación almacenados, para que las claves de prueba obsoletas de `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite los proveedores sin autenticación, perfil o modelo utilizables
  - De forma predeterminada, solo ejecuta `generate`
  - Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor o modelo seleccionado acepta entradas de imágenes locales respaldadas por búfer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor o modelo seleccionado acepta entradas de vídeo locales respaldadas por búfer en el barrido compartido
  - Proveedor `imageToVideo` actualmente declarado pero omitido en el barrido compartido:
    - `vydra` (esta vía no admite entradas de imágenes locales respaldadas por búfer)
  - Cobertura específica del proveedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Ese archivo ejecuta texto a vídeo con `veo3`, además de una vía de imagen a vídeo con `kling` que usa de forma predeterminada un recurso de prueba con una URL de imagen remota (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` para sustituirla).
  - Cobertura específica del proveedor xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - El caso clásico genera primero un fotograma PNG local cuadrado, omite la geometría, solicita un clip de imagen a vídeo de un segundo, consulta el estado hasta que finaliza y verifica el búfer descargado.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - El caso 1.5 genera un primer fotograma PNG local, solicita un clip de imagen a vídeo de un segundo en 1080P, consulta el estado hasta que finaliza y verifica el búfer descargado.
  - Cobertura en vivo actual de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado se resuelve como `gen4_aleph`
  - Proveedores `videoToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, porque esas rutas requieren actualmente URL de referencia `http(s)` remotas en lugar de entradas locales respaldadas por búfer
- Restricción opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de cada operación de proveedor en una ejecución rápida agresiva
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación mediante el almacén de perfiles e ignorar las sustituciones que solo procedan del entorno

## Arnés de pruebas de medios en vivo

- Comando: `pnpm test:live:media`
- Punto de entrada: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, que ejecuta `pnpm test:live -- <suite-test-file>` por cada conjunto seleccionado, para que el comportamiento de Heartbeat y del modo silencioso sea coherente con otras ejecuciones de `pnpm test:live`.
- Propósito:
  - Ejecuta los conjuntos compartidos de pruebas en vivo de imágenes, música y vídeo mediante un único punto de entrada nativo del repositorio
  - Carga automáticamente desde `~/.profile` las variables de entorno de proveedores que falten
  - De forma predeterminada, restringe automáticamente cada conjunto a los proveedores que tengan actualmente una autenticación utilizable
- Opciones:
  - `--providers <csv>` filtro global de proveedores; `--image-providers` / `--music-providers` / `--video-providers` limitan el filtro a un conjunto
  - `--all-providers` omite el filtro automático basado en la autenticación
  - `--allow-empty` finaliza con `0` cuando el filtrado no deja ningún proveedor ejecutable
  - `--quiet` / `--no-quiet` se pasan a `test:live`
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Contenido relacionado

- [Pruebas](/es/help/testing) - conjuntos de pruebas unitarias, de integración, de control de calidad y de Docker
