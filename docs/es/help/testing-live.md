---
read_when:
    - Ejecución de pruebas de humo en vivo de la matriz de modelos / backend de la CLI / ACP / proveedor multimedia
    - Depuración de la resolución de credenciales para pruebas en vivo
    - Añadir una nueva prueba en vivo específica del proveedor
sidebarTitle: Live tests
summary: 'Pruebas en vivo (con acceso a la red): matriz de modelos, backends de CLI, ACP, proveedores multimedia, credenciales'
title: 'Pruebas: conjuntos en vivo'
x-i18n:
    generated_at: "2026-07-21T09:02:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da7f65c0d5e9467e600f6ef6bc2fb5bc6c6a2fd3555e942b15eaac6e9c01724b
    source_path: help/testing-live.md
    workflow: 16
---

Para obtener información sobre el inicio rápido, los ejecutores de QA, los conjuntos de pruebas unitarias/de integración y los flujos de Docker, consulte
[Pruebas](/es/help/testing). Esta página abarca las pruebas **en vivo** (que acceden a la red):
matriz de modelos, backends de CLI, ACP, proveedores multimedia y gestión de credenciales.

## Pruebas en vivo frente a un gateway real

Los conjuntos de pruebas en vivo y las pruebas de humo ad hoc nunca deben interferir con un gateway que ya
atiende tráfico real (propio o de otro operador):

- Use un gateway propio: utilice el gateway dentro del proceso (capa 2, más adelante) o inicie una
  instancia de desarrollo con un directorio de estado aislado (`OPENCLAW_STATE_DIR=<scratch>`) y un
  puerto libre. No vincule el puerto predeterminado del gateway (18789) mientras un gateway real
  se esté ejecutando en él.
- No ejecute `openclaw gateway stop`/`restart` (ni los equivalentes de `launchctl`/`systemctl`/tmux)
  en un servicio que no haya iniciado en esta sesión: se trata de la
  instancia en vivo del operador. Obtenga primero una aprobación explícita.
- ¿Necesita datos realistas? Copie el estado o la base de datos en vivo en el directorio de estado de desarrollo y realice las pruebas
  con la copia. Las migraciones in situ del estado de un gateway en vivo también requieren
  aprobación explícita.

## En vivo: comandos locales de prueba de humo

Exporte la clave necesaria del proveedor en el entorno del proceso antes de realizar comprobaciones
en vivo ad hoc.

Prueba de humo multimedia segura:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "Prueba de humo en vivo de OpenClaw." \
  --output /tmp/openclaw-live-smoke.mp3
```

Prueba de humo segura para comprobar la preparación de llamadas de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` es una ejecución de prueba a menos que también se proporcione `--yes`; use `--yes` solo
cuando pretenda realizar una llamada real. Para Twilio, Telnyx y Plivo, una
comprobación de preparación correcta requiere una URL pública de Webhook; las URL de bucle invertido
locales o privadas se rechazan porque esos proveedores no pueden acceder a ellas.

## En vivo: barrido de capacidades del Node de Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos los comandos anunciados actualmente** por un Node de Android conectado y verificar el comportamiento del contrato de los comandos.
- Alcance:
  - Configuración previa/manual (el conjunto de pruebas no instala, ejecuta ni empareja la aplicación).
  - Validación comando por comando mediante `node.invoke` del gateway para el Node de Android seleccionado.
- Configuración previa obligatoria:
  - La aplicación de Android ya está conectada y emparejada con el gateway.
  - La aplicación se mantiene en primer plano.
  - Se han concedido los permisos y el consentimiento de captura para las capacidades que se espera que superen la prueba.
- Sustituciones opcionales del destino:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [Aplicación de Android](/es/platforms/android)

## En vivo: prueba de humo de modelos (claves de perfil)

Las pruebas de modelos en vivo se dividen en dos capas para aislar los fallos:

- El «modelo directo» indica si el proveedor o modelo puede responder con la clave proporcionada.
- La «prueba de humo del gateway» indica si el pipeline completo del gateway y el agente funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

Las listas seleccionadas de modelos que aparecen a continuación se encuentran en `src/agents/live-model-filter.ts` y
cambian con el tiempo; considere las matrices de ese archivo como la fuente de verdad, no esta
página.

MiniMax M3 utiliza `minimax/MiniMax-M3` como referencia predeterminada de proveedor/modelo.

### Capa 1: finalización directa del modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar los modelos detectados
  - Usar `getApiKeyForModel` para seleccionar los modelos cuyas credenciales están disponibles
  - Ejecutar una finalización breve por modelo (y regresiones específicas cuando sea necesario)
- Cómo habilitarla:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si se invoca Vitest directamente)
  - Establezca `OPENCLAW_LIVE_MODELS=modern`, `small` o `all` (alias de `modern`) para ejecutar realmente este conjunto de pruebas; de lo contrario, se omite, por lo que `pnpm test:live` por sí solo permanece centrado en la prueba de humo del gateway.
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` ejecuta la lista prioritaria seleccionada de alta relevancia (consulte [En vivo: matriz de modelos](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` ejecuta la lista prioritaria seleccionada de modelos pequeños
  - `OPENCLAW_LIVE_MODELS=all` es un alias de `modern`
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (lista de permitidos separada por comas)
  - Las ejecuciones locales de modelos pequeños de Ollama usan de forma predeterminada `http://127.0.0.1:11434`; establezca `OPENCLAW_LIVE_OLLAMA_BASE_URL` solo para endpoints de LAN, personalizados o de Ollama Cloud.
  - Los barridos modernos/completos y de modelos pequeños usan de forma predeterminada la longitud de su lista seleccionada como límite; establezca `OPENCLAW_LIVE_MAX_MODELS=0` para realizar un barrido exhaustivo del perfil seleccionado o un número positivo para aplicar un límite menor.
  - Los barridos exhaustivos usan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` como tiempo de espera para toda la prueba directa de modelos. Valor predeterminado: 60 minutos.
  - Las sondas directas de modelos se ejecutan con un paralelismo de 20 de forma predeterminada; establezca `OPENCLAW_LIVE_MODEL_CONCURRENCY` para sustituirlo.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista de permitidos separada por comas)
- Origen de las claves:
  - De forma predeterminada: almacén de perfiles y alternativas del entorno
  - Establezca `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **solo el almacén de perfiles**
- Motivo:
  - Distingue entre «la API del proveedor está averiada o la clave no es válida» y «el pipeline del agente del gateway está averiado»
  - Contiene regresiones pequeñas y aisladas (por ejemplo: repetición del razonamiento de OpenAI Responses/Codex Responses y flujos de llamadas a herramientas)

### Capa 2: prueba de humo del gateway y del agente de desarrollo (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar un gateway dentro del proceso
  - Crear o modificar una sesión `agent:dev:*` (sustitución del modelo en cada ejecución)
  - Recorrer los modelos con claves y verificar:
    - una respuesta «significativa» (sin herramientas)
    - que funcione una invocación real de herramienta (sonda de lectura)
    - sondas de herramientas adicionales opcionales (sonda de ejecución y lectura)
    - que las rutas de regresión de OpenAI (solo llamada a herramienta -> seguimiento) sigan funcionando
- Detalles de las sondas (para poder explicar rápidamente los fallos):
  - Sonda `read`: la prueba escribe un archivo nonce en el espacio de trabajo y solicita al agente que lo `read` y devuelva el nonce.
  - Sonda `exec+read`: la prueba solicita al agente que escriba mediante `exec` un nonce en un archivo temporal y, a continuación, que lo vuelva a `read`.
  - Sonda de imagen: la prueba adjunta un PNG generado (gato + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `test/helpers/live-image-probe.ts`.
- Cómo habilitarla:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si se invoca Vitest directamente)
- Cómo seleccionar modelos:
  - Valor predeterminado: la lista prioritaria seleccionada de alta relevancia (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` ejecuta la lista seleccionada de modelos pequeños a través del pipeline completo del gateway y el agente
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de `modern`
  - También se puede establecer `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o una lista separada por comas) para restringir la selección
  - Los barridos modernos/completos y de modelos pequeños del gateway usan de forma predeterminada la longitud de su lista seleccionada como límite; establezca `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para realizar un barrido exhaustivo de la selección o un número positivo para aplicar un límite menor.
- Cómo seleccionar proveedores (evite «todo mediante OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista de permitidos separada por comas)
- Las sondas de herramientas e imágenes están siempre habilitadas en esta prueba en vivo:
  - Sonda `read` + sonda `exec+read` (prueba intensiva de herramientas)
  - La sonda de imagen se ejecuta cuando el modelo anuncia compatibilidad con la entrada de imágenes
  - Flujo (a grandes rasgos):
    - La prueba genera un PNG diminuto con «CAT» + un código aleatorio (`test/helpers/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - El gateway analiza los archivos adjuntos y los convierte en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente integrado reenvía al modelo un mensaje de usuario multimodal
    - Verificación: la respuesta contiene `cat` + el código (tolerancia de OCR: se permiten errores menores)

<Tip>
Para ver qué se puede probar en el equipo (y los identificadores `provider/model` exactos), ejecute:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## En vivo: prueba de humo del backend de CLI (Claude, Gemini u otras CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar el pipeline del gateway y el agente mediante un backend de CLI local, sin modificar la configuración predeterminada.
- Los valores predeterminados de las pruebas de humo específicos de cada backend se encuentran en la definición `cli-backend.ts` del Plugin propietario.
- Habilitación:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si se invoca Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de los comandos, argumentos e imágenes procede de los metadatos del Plugin propietario del backend de CLI.
- Sustituciones (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un archivo adjunto de imagen real (las rutas se insertan en el prompt). Está desactivado de forma predeterminada en las recetas de Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar las rutas de los archivos de imagen como argumentos de CLI en lugar de insertarlas en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los argumentos de imagen cuando se establece `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para habilitar la sonda de continuidad de Claude Sonnet -> Opus en la misma sesión cuando el modelo seleccionado admite un destino de cambio. Está desactivada de forma predeterminada, incluso en las recetas de Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para habilitar la sonda de bucle invertido de MCP/herramientas. Está desactivada de forma predeterminada en las recetas de Docker.

Ejemplo:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Prueba de humo económica de la configuración de MCP de Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Esto no solicita a Gemini que genere una respuesta. Escribe la misma configuración del
sistema que OpenClaw proporciona a Gemini y, a continuación, ejecuta `gemini --debug mcp list` para demostrar que un
servidor `transport: "streamable-http"` guardado se normaliza al formato MCP HTTP de Gemini
y puede conectarse a un servidor MCP HTTP transmitible local.

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
- Ejecuta la prueba de humo en vivo del backend de CLI dentro de la imagen Docker del repositorio como el usuario no root `node`.
- Resuelve los metadatos de la prueba de humo de CLI desde el plugin propietario y, a continuación, instala el paquete de CLI de Linux correspondiente (`@anthropic-ai/claude-code` o `@google/gemini-cli`) en un prefijo escribible almacenado en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (valor predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` ya no es un backend de CLI incluido; en su lugar, use `openai/*` con el runtime de app-server de Codex (consulte [En vivo: prueba de humo del entorno de pruebas de app-server de Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portátil de la suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o mediante `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primero comprueba `claude -p` directamente en Docker y, a continuación, ejecuta dos turnos del backend de CLI del Gateway sin conservar las variables de entorno de la clave de API de Anthropic. Esta vía de suscripción desactiva de forma predeterminada las comprobaciones de Claude para MCP/herramientas e imágenes porque consume los límites de uso de la suscripción con sesión iniciada y Anthropic puede cambiar el comportamiento de facturación y límites de frecuencia de Claude Agent SDK / `claude -p` sin una versión de OpenClaw.
- Claude y Gemini admiten el mismo conjunto de comprobaciones (turno de texto, clasificación de imágenes, llamada a la herramienta MCP `cron`, continuidad del cambio de modelo) mediante las opciones anteriores, pero ninguna se ejecuta de forma predeterminada; actívelas individualmente mediante la opción correspondiente según sea necesario.

## En vivo: accesibilidad del proxy HTTP/2 de APNs

- Prueba: `src/infra/push-apns-http2.live.test.ts`
- Objetivo: crear un túnel mediante un proxy HTTP CONNECT local hasta el endpoint de APNs del entorno aislado de Apple, enviar la solicitud de validación HTTP/2 de APNs y comprobar que la respuesta real `403 InvalidProviderToken` de Apple regresa a través de la ruta del proxy.
- Activación:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Tiempo de espera opcional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## En vivo: prueba de humo de vinculación de ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de vinculación de conversaciones de ACP con un agente ACP en vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular en el lugar una conversación sintética de un canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue a la transcripción de la sesión ACP vinculada
- Activación:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valores predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación con estilo de mensaje directo de Slack
  - Backend de ACP: `acpx`
- Valores alternativos:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (o `on`/`true`/`yes`) para forzar la activación de la comprobación de imágenes; cualquier otro valor fuerza su desactivación. Se ejecuta de forma predeterminada para todos los agentes excepto `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Notas:
  - Esta vía utiliza la superficie `chat.send` del Gateway con campos sintéticos de ruta de origen exclusivos para administradores, de modo que las pruebas puedan adjuntar contexto de canales de mensajes sin simular una entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está definido, la prueba utiliza el registro de agentes integrado del plugin `acpx` incorporado para el agente ACP seleccionado del entorno de pruebas.
  - La creación mediante MCP de Cron para sesiones vinculadas es de mejor esfuerzo de forma predeterminada porque los entornos de pruebas ACP externos pueden cancelar las llamadas MCP después de superar la comprobación de vinculación/imágenes; establezca `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para que esa comprobación de Cron posterior a la vinculación sea estricta.

Ejemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Procedimiento de Docker:

```bash
pnpm test:docker:live-acp-bind
```

Procedimientos de Docker para un único agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Notas de Docker:

- El ejecutor de Docker se encuentra en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta secuencialmente la prueba de humo de vinculación de ACP con los agentes de CLI en vivo agregados: `claude`, `codex` y, después, `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para reducir la matriz.
- Prepara en el contenedor el material de autenticación de CLI correspondiente y, a continuación, instala la CLI en vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid mediante `https://app.factory.ai/cli`, `@google/gemini-cli` o `opencode-ai`) si falta. El propio backend de ACP es el paquete `acpx/runtime` integrado del plugin oficial `acpx`.
- La variante de Docker para Droid prepara `~/.factory` para la configuración, reenvía `FACTORY_API_KEY` y requiere esa clave de API porque la autenticación local de Factory mediante OAuth/llavero no se puede transportar al contenedor. Utiliza la entrada de registro `droid exec --output-format acp` integrada en ACPX.
- La variante de Docker para OpenCode es una vía estricta de regresión para un único agente. Escribe un modelo predeterminado temporal `OPENCODE_CONFIG_CONTENT` a partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (valor predeterminado: `opencode/kimi-k2.6`).
- Las llamadas directas a la CLI `acpx` son únicamente una vía manual o alternativa para comparar el comportamiento fuera del Gateway. La prueba de humo de vinculación de ACP en Docker ejercita el backend de runtime `acpx` integrado en OpenClaw.

## En vivo: prueba de humo del entorno de pruebas de app-server de Codex

- Objetivo: validar el entorno de pruebas de Codex propiedad del plugin mediante el método normal
  `agent` del Gateway:
  - cargar el plugin `codex` incluido
  - seleccionar un modelo de OpenAI mediante `/model <ref> --runtime codex`
  - enviar un primer turno del agente del Gateway con el nivel de razonamiento solicitado
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo de
    app-server pueda reanudarse
  - ejecutar `/codex status` y `/codex models` mediante la misma ruta de comandos
    del Gateway
  - ejecutar opcionalmente dos comprobaciones de shell escaladas y revisadas por Guardian: un
    comando inocuo que debería aprobarse y una carga de un secreto falso que debería
    denegarse para que el agente vuelva a preguntar
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Activación: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo de referencia del entorno de pruebas: `openai/gpt-5.6-luna`
- Selección predeterminada de una clave de API nueva de OpenAI: `openai/gpt-5.6`
- Razonamiento predeterminado: `low`
- Modelo alternativo: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Razonamiento alternativo: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Comprobación del esfuerzo de un modelo no predeterminado:
  `OPENCLAW_LIVE_CODEX_HARNESS_EXPECTED_EFFORT=<level>`
- Matriz alternativa: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Modo de autenticación: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (predeterminado) utiliza el
  inicio de sesión de Codex copiado; `api-key` utiliza `OPENAI_API_KEY` mediante Codex app-server.
- Comprobación de imágenes opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Comprobación de MCP/herramientas opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Comprobación de Guardian opcional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Prueba de esfuerzo de reanudación opcional: `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1` añade
  cuatro turnos al historial y, a continuación, cierra y reinicia el Gateway y Codex app-server
  tres veces, exigiendo el mismo identificador de hilo nativo y el mismo historial de
  conversación. Sustituya los recuentos acotados mediante
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_HISTORY_TURNS` (1-20) y
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_RESTARTS` (1-10).
- Prueba de esfuerzo de distribución opcional: establezca `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1`
  y `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT` (1-12). El entorno de pruebas inicia
  todos los agentes secundarios simultáneamente, espera a que finalicen todas las ejecuciones y verifica cada
  respuesta única de los agentes secundarios y cada identidad de hilo nativa.
- Prueba de esfuerzo de Compaction opcional: `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1`
  genera una salida acotada de herramientas nativas, exige eventos automáticos de Compaction,
  verifica el recuento persistente de Compaction y la recuperación del marcador oculto, reinicia
  el Gateway y el app-server físico de Codex y, a continuación, repite la oleada de salida y
  Compaction. Ajuste el trabajo acotado mediante
  `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS` (1-8) y
  `OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES` (100000-800000).
- Comprobación opcional de exclusión de la retransmisión de bucle:
  `OPENCLAW_LIVE_CODEX_HARNESS_DISABLE_LOOP_RELAY=1`
- La preferencia de razonamiento solicitada puede asignarse al esfuerzo más cercano anunciado
  por Codex para ese modelo. Por ejemplo, Luna asigna `minimal` a `low`.
- Los modelos conocidos del catálogo de Codex obtienen automáticamente ese esfuerzo nativo exacto.
  Los modelos alternativos desconocidos deben indicar el esfuerzo asignado esperado.
- La prueba de humo fuerza el proveedor/modelo `agentRuntime.id: "codex"` para que un entorno de pruebas de Codex
  defectuoso no pueda superar la prueba recurriendo silenciosamente a OpenClaw.
- Autenticación: autenticación de Codex app-server mediante el inicio de sesión de la suscripción local de Codex, o
  `OPENAI_API_KEY` cuando `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker puede
  copiar `~/.codex/auth.json` y `~/.codex/config.toml` para las ejecuciones con suscripción.

Procedimiento local:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Procedimiento de Docker:

```bash
pnpm test:docker:live-codex-harness
```

Prueba de esfuerzo de reinicio e historial:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
pnpm test:docker:live-codex-harness
```

Prueba de esfuerzo de distribución, salida grande, Compaction y reinicio:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT=8 \
  OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1 \
  pnpm test:docker:live-codex-harness
```

Matriz nativa de Codex para GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Valor predeterminado con una clave de API nueva de OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Esta comprobación deja `OPENCLAW_LIVE_GATEWAY_MODELS` sin definir, resuelve el modelo mediante
la nueva interfaz de selección de inferencia de la incorporación, comprueba `openai/gpt-5.6` y, a continuación,
ejecuta un turno real del Gateway con el modelo resuelto.

Matriz integrada de OpenClaw para GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Notas de Docker:

- El ejecutor de Docker se encuentra en `scripts/test-live-codex-harness-docker.sh`.
- Pasa `OPENAI_API_KEY`, copia los archivos de autenticación de Codex CLI cuando están presentes, instala
  `@openai/codex` en un prefijo npm montado
  con permisos de escritura, prepara el árbol de fuentes y, a continuación, ejecuta únicamente la prueba en vivo del arnés de Codex.
- Docker habilita de forma predeterminada las pruebas de imagen, MCP/herramientas y Guardian. Establezca
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` cuando necesite una ejecución de depuración
  más acotada.
- Docker utiliza la misma configuración explícita del entorno de ejecución de Codex, por lo que los alias heredados o el
  mecanismo alternativo de OpenClaw no pueden ocultar una regresión del arnés de Codex.
- Los objetivos de la matriz se ejecutan secuencialmente en un contenedor. El script de Docker ajusta su
  tiempo de espera predeterminado de 35 minutos según la cantidad de objetivos; cualquier tiempo de espera externo del shell o de CI debe
  admitir el mismo total. La CI canónica mantiene cada objetivo GPT-5.6 en un segmento independiente.

### Recetas en vivo recomendadas

Las listas de permitidos acotadas y explícitas son más rápidas y menos propensas a fallos intermitentes:

- Un solo modelo, directo (sin Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil directo de modelo pequeño:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil de Gateway de modelo pequeño:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba rápida de la API de Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Un solo modelo, prueba rápida de Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Invocación de herramientas con varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba rápida directa de Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Enfoque en Google (clave de API de Gemini + Antigravity):
  - Gemini (clave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Prueba rápida del razonamiento adaptativo de Google (`qa manual` desde la CLI privada de control de calidad; requiere `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` y un checkout del código fuente; consulte [Descripción general del control de calidad](/es/concepts/qa-e2e-automation)):
  - Valor predeterminado dinámico de Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Presupuesto dinámico de Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notas:

- `google/...` utiliza la API de Gemini (clave de API).
- `google-antigravity/...` utiliza el puente OAuth de Antigravity (endpoint de agente con el estilo de Cloud Code Assist).
- `google-gemini-cli/...` utiliza la CLI local de Gemini en la máquina (autenticación independiente y particularidades de las herramientas).
- API de Gemini frente a CLI de Gemini:
  - API: OpenClaw llama por HTTP a la API de Gemini alojada por Google (clave de API/autenticación de perfil); esto es lo que la mayoría de los usuarios entiende por «Gemini».
  - CLI: OpenClaw invoca un binario local `gemini`; tiene su propia autenticación y puede comportarse de manera diferente (transmisión, compatibilidad con herramientas y divergencias entre versiones).

## En vivo: matriz de modelos (qué se cubre)

Las pruebas en vivo son opcionales, por lo que no existe una «lista de modelos de CI» fija. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (y su alias `all`) ejecutan la lista de prioridades seleccionada de `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` en `src/agents/live-model-filter.ts`, en este orden de prioridad:

| Proveedor/modelo                              | Notas      |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | API de Gemini |
| `google/gemini-3.5-flash`                     | API de Gemini |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k3`                            |            |
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

La lista seleccionada de **modelos pequeños** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), de `SMALL_LIVE_MODEL_PRIORITY`:

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

- Los proveedores `codex` y `codex-cli` se excluyen del barrido moderno predeterminado (cubren el comportamiento del backend de CLI/ACP, que se prueba por separado más arriba). `openai/gpt-5.5` se enruta de forma predeterminada mediante el arnés del servidor de aplicaciones de Codex; consulte [En vivo: prueba rápida del arnés del servidor de aplicaciones de Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` y `xai` solo ejecutan sus identificadores de modelo seleccionados explícitamente en el barrido moderno (sin expansión automática a «todos los modelos de este proveedor»).
- Incluya al menos un modelo compatible con imágenes (variantes de visión de las familias Claude/Gemini/OpenAI, etc.) en `OPENCLAW_LIVE_GATEWAY_MODELS` para ejecutar la prueba de imágenes.

Ejecute una prueba rápida de Gateway con herramientas e imágenes en un conjunto seleccionado de varios proveedores:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Cobertura adicional opcional fuera de las listas seleccionadas (recomendable; elija un modelo compatible con «herramientas» que tenga habilitado):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (si tiene acceso)
- LM Studio: `lmstudio/...` (local; la invocación de herramientas depende del modo de API)

### Agregadores/Gateways alternativos

Si tiene claves habilitadas, también puede realizar pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; utilice `openclaw models scan` para encontrar candidatos compatibles con herramientas e imágenes)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puede incluir en la matriz en vivo (si dispone de credenciales/configuración):

- Integrados: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Mediante `models.providers` (endpoints personalizados): `minimax` (nube/API), además de cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

<Tip>
No codifique de forma rígida «todos los modelos» en la documentación. La lista oficial es la que devuelva `discoverModels(...)` en la máquina, junto con las claves disponibles.
</Tip>

## Credenciales (nunca confirmar en el repositorio)

Las pruebas en vivo detectan las credenciales de la misma forma que la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas en vivo deberían encontrar las mismas claves.
- Si una prueba en vivo indica «sin credenciales», depure del mismo modo que depuraría `openclaw models list` / la selección del modelo.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significa «claves de perfil» en las pruebas en vivo)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio OAuth heredado: `~/.openclaw/credentials/` (se copia en el directorio principal preparado para las pruebas en vivo cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones en vivo locales copian la configuración activa (sin las sustituciones `agents.*.workspace` / `agentDir`) y el archivo `auth-profiles.json` de cada agente, pero no el resto del directorio del agente, por lo que los datos de `workspace/` y `sandboxes/` nunca llegan al directorio principal preparado; además, copian el directorio heredado `credentials/` y los archivos/directorios de autenticación admitidos de las CLI externas (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) en un directorio principal temporal de prueba.

Si desea utilizar claves del entorno, expórtelas antes de las pruebas locales o utilice los
ejecutores de Docker que aparecen a continuación con un `OPENCLAW_PROFILE_FILE` explícito.

## Deepgram en vivo (transcripción de audio)

- Prueba: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan de programación de BytePlus en vivo

- Prueba: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sustitución opcional del modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Contenido multimedia del flujo de trabajo de ComfyUI en vivo

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejecuta las rutas integradas de imagen, vídeo y `music_generate` de comfy
  - Omite cada capacidad a menos que `plugins.entries.comfy.config.<capability>` esté configurado
  - Resulta útil después de modificar el envío de flujos de trabajo de comfy, el sondeo, las descargas o el registro de plugins

## Generación de imágenes en vivo

- Prueba: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera todos los plugins de proveedor de generación de imágenes registrados
  - Utiliza las variables de entorno de los proveedores ya exportadas antes de realizar las pruebas
  - Utiliza de forma predeterminada las claves de API del entorno o de las pruebas en vivo antes que los perfiles de autenticación almacenados, para que las claves de prueba obsoletas de `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite los proveedores que no tengan una autenticación, un perfil o un modelo utilizables
  - Ejecuta cada proveedor configurado mediante el entorno de ejecución compartido de generación de imágenes:
    - `<provider>:generate`
    - `<provider>:edit` cuando el proveedor declara compatibilidad con la edición
- Proveedores integrados que se cubren actualmente:
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
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamiento opcional de la autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación mediante el almacén de perfiles e ignorar las sustituciones basadas únicamente en el entorno

Para la ruta de la CLI distribuida, añada una prueba rápida de `infer` después de que se supere la prueba en vivo
del proveedor y del entorno de ejecución:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image \
  --prompt "Imagen de prueba plana y minimalista: un cuadrado azul sobre un fondo blanco, sin texto." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Esto cubre el análisis de argumentos de la CLI, la resolución de la configuración y del agente predeterminado, la activación de
plugins integrados, el entorno de ejecución compartido de generación de imágenes y la solicitud al proveedor
en vivo. Se espera que las dependencias de los plugins estén presentes antes de cargar el entorno de ejecución.

## Generación de música en vivo

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitación: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Entorno de pruebas: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida del proveedor integrado de generación de música
  - Actualmente abarca `fal`, `google`, `minimax` y `openrouter`
  - Utiliza las variables de entorno del proveedor ya exportadas antes de realizar sondeos
  - Utiliza de forma predeterminada las claves de API activas o del entorno antes que los perfiles de autenticación almacenados, para que las claves de prueba obsoletas de `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite los proveedores sin autenticación, perfil o modelo utilizables
  - Ejecuta ambos modos de runtime declarados cuando están disponibles:
    - `generate` con entrada únicamente de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - `comfy` tiene su propio archivo activo independiente, no este barrido compartido
- Delimitación opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar las anulaciones exclusivas del entorno

## Generación de vídeo en vivo

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitación: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Entorno de pruebas: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida del proveedor integrado de generación de vídeo en `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Utiliza de forma predeterminada la ruta de prueba de humo segura para la versión: una solicitud de texto a vídeo por proveedor, un prompt de Lobster de un segundo y un límite de operaciones por proveedor definido por `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de la cola del proveedor puede dominar el tiempo de publicación; proporcione `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (o vacíe la lista de omisiones) para ejecutarlo explícitamente
  - Utiliza las variables de entorno del proveedor ya exportadas antes de realizar sondeos
  - Utiliza de forma predeterminada las claves de API activas o del entorno antes que los perfiles de autenticación almacenados, para que las claves de prueba obsoletas de `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite los proveedores sin autenticación, perfil o modelo utilizables
  - Ejecuta únicamente `generate` de forma predeterminada
  - Establezca `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor o modelo seleccionado acepta una imagen local respaldada por búfer como entrada en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor o modelo seleccionado acepta un vídeo local respaldado por búfer como entrada en el barrido compartido
  - Proveedor con `imageToVideo` declarado pero actualmente omitido en el barrido compartido:
    - `vydra` (la entrada de imágenes locales respaldada por búfer no es compatible con esta vía)
  - Cobertura específica del proveedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Ese archivo ejecuta `veo3` de texto a vídeo, además de una vía `kling` de imagen a vídeo que utiliza de forma predeterminada un fixture de URL de imagen remota (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` para anularlo).
  - Cobertura específica del proveedor xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - El caso clásico genera una imagen PNG local cuadrada como primer fotograma, omite la geometría, solicita un clip de imagen a vídeo de un segundo, consulta su estado hasta que finaliza y verifica el búfer descargado.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - El caso 1.5 genera una imagen PNG local como primer fotograma, solicita un clip de imagen a vídeo de un segundo a 1080P, consulta su estado hasta que finaliza y verifica el búfer descargado.
  - Cobertura en vivo actual de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado se resuelve como `gen4_aleph`
  - Proveedores con `videoToVideo` declarado pero actualmente omitidos en el barrido compartido:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, porque esas rutas actualmente requieren URL de referencia `http(s)` remotas en lugar de una entrada local respaldada por búfer
- Delimitación opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operaciones de cada proveedor en una prueba de humo intensiva
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la autenticación del almacén de perfiles e ignorar las anulaciones exclusivas del entorno

## Entorno de pruebas de medios en vivo

- Comando: `pnpm test:live:media`
- Punto de entrada: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, que ejecuta `pnpm test:live -- <suite-test-file>` por cada conjunto seleccionado, para que el comportamiento de Heartbeat y del modo silencioso se mantenga coherente con otras ejecuciones de `pnpm test:live`.
- Propósito:
  - Ejecuta los conjuntos compartidos de imágenes, música y vídeo en vivo mediante un único punto de entrada nativo del repositorio
  - Carga automáticamente las variables de entorno de proveedor que falten desde `~/.profile`
  - De forma predeterminada, delimita automáticamente cada conjunto a los proveedores que actualmente tienen autenticación utilizable
- Opciones:
  - `--providers <csv>` es el filtro global de proveedores; `--image-providers` / `--music-providers` / `--video-providers` limitan un filtro a un conjunto
  - `--all-providers` omite el filtro automático basado en la autenticación
  - `--allow-empty` finaliza con `0` cuando el filtrado no deja ningún proveedor ejecutable
  - `--quiet` / `--no-quiet` se pasan a `test:live`
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Contenido relacionado

- [Pruebas](/es/help/testing): conjuntos de pruebas unitarias, de integración, de QA y de Docker
