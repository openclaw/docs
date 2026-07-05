---
read_when:
    - Necesitas el comportamiento detallado de un paso específico de openclaw onboard
    - Estás depurando resultados de incorporación o integrando clientes de incorporación
sidebarTitle: CLI reference
summary: 'Comportamiento paso a paso de openclaw onboard: qué hace cada paso, la configuración que escribe y los elementos internos'
title: Referencia de configuración de la CLI
x-i18n:
    generated_at: "2026-07-05T11:44:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ac01078241e0dfdbadf065bbe3c42b543c76596ed63af12e47af683e5f6691f8
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Esta página cubre el comportamiento, las salidas y los aspectos internos de la incorporación paso a paso.
Para una guía, consulta [Incorporación (CLI)](/es/start/wizard). Para la referencia completa de flags de la CLI
(cada `--flag`, ejemplos no interactivos, comandos específicos de proveedor),
consulta [`openclaw onboard`](/es/cli/onboard).

## Qué hace el asistente

El modo local (predeterminado) te guía por:

- Configuración de modelo y autenticación (Anthropic, OAuth de suscripción de OpenAI Code, xAI, OpenCode, endpoints personalizados y más flujos de autenticación propiedad del proveedor)
- Ubicación del espacio de trabajo y archivos de arranque
- Ajustes de Gateway (puerto, enlace, autenticación, Tailscale)
- Canales y proveedores (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y otros canales integrados o de plugin)
- Proveedor de búsqueda web (opcional)
- Instalación del daemon (LaunchAgent, unidad de usuario systemd o tarea programada nativa de Windows con alternativa de carpeta de inicio)
- Comprobación de estado
- Configuración de Skills

El modo remoto configura esta máquina para conectarse a un Gateway en otro lugar. No
instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige **Mantener valores actuales**, **Revisar y actualizar** o **Restablecer antes de configurar**.
    - Volver a ejecutar el asistente no borra nada a menos que elijas explícitamente Restablecer (o pases `--reset`).
    - CLI `--reset` usa `config+creds+sessions` de forma predeterminada; usa `--reset-scope full` para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y te pide que ejecutes `openclaw doctor` antes de continuar.
    - Restablecer mueve el estado a la Papelera (nunca lo elimina directamente) y ofrece alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)

  </Step>
  <Step title="Modelo y autenticación">
    - La matriz completa de opciones está en [Opciones de autenticación y modelo](#auth-and-model-options).

  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del espacio de trabajo necesarios para el arranque de la primera ejecución.
    - Diseño del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Solicita puerto, enlace, modo de autenticación y exposición de Tailscale.
    - Recomendado: mantener la autenticación por token habilitada incluso para loopback, para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto plano** (predeterminado)
      - **Usar SecretRef** (opcional)
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta no interactiva de SecretRef de token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No se puede combinar con `--gateway-token`.
    - Deshabilita la autenticación solo si confías completamente en todos los procesos locales.
    - Los enlaces que no son loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión QR opcional
    - [Telegram](/es/channels/telegram): token de bot
    - [Discord](/es/channels/discord): token de bot
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de webhook
    - [Mattermost](/es/channels/mattermost): token de bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta
    - [iMessage](/es/channels/imessage): ruta de la CLI `imsg` + acceso a la base de datos de Messages; usa un envoltorio SSH cuando el Gateway se ejecuta fuera de Mac
    - Seguridad de DM: el valor predeterminado es el emparejamiento. El primer DM envía un código; apruébalo mediante
      `openclaw pairing approve <channel> <code>` o usa listas de permitidos.
  </Step>
  <Step title="Búsqueda web">
    - Elige un proveedor (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) u omite.
    - Omite este paso con `--skip-search`; reconfigúralo más tarde con `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin monitor, usa un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario systemd
      - El asistente intenta `loginctl enable-linger <user>` para que gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero tarea programada
      - Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta de inicio e inicia gateway inmediatamente.
      - Las tareas programadas siguen siendo preferidas porque proporcionan mejor estado de supervisor.
    - Selección de runtime: solo Node se ofrece de forma interactiva. Bun puede corromper memoria al reconectar WhatsApp/Telegram y no es un runtime de daemon admitido para esos canales; pasa `--daemon-runtime bun` solo fuera de esa combinación.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia gateway (si es necesario) y ejecuta `openclaw health`.
    - `openclaw status --deep` añade la sonda de estado de gateway en vivo a la salida de estado, incluidas las sondas de canales cuando se admiten.

  </Step>
  <Step title="Skills">
    - Lee las habilidades disponibles y comprueba los requisitos.
    - Te permite elegir el gestor de node: npm, pnpm o bun.
    - Instala dependencias opcionales para skills integradas de confianza cuando el instalador requerido
      está disponible.
    - Omite instaladores de Homebrew, uv y Go no disponibles, y luego agrupa las skills afectadas
      con orientación de configuración manual. Ejecuta `openclaw doctor` después de instalar
      los prerrequisitos faltantes.

  </Step>
  <Step title="Finalizar">
    - Resumen y siguientes pasos, incluidas opciones de apps para iOS, Android y macOS.

  </Step>
</Steps>

<Note>
Si no se detecta GUI, el asistente imprime instrucciones de reenvío de puertos SSH para la Control UI en lugar de abrir un navegador.
Si faltan los recursos de la Control UI, el asistente intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la UI).
</Note>

## Detalles del modo remoto

El modo remoto configura esta máquina para conectarse a un Gateway en otro lugar. No
instala ni modifica nada en el host remoto.

Lo que configuras:

- URL del gateway remoto (`ws://...` o `wss://...`)
- Token, contraseña o sin autenticación, coincidiendo con la configuración del Gateway remoto

<Steps>
  <Step title="Descubrimiento (opcional)">
    Si `dns-sd` (macOS) o `avahi-browse` (Linux) está disponible, la incorporación
    ofrece buscar balizas de gateway Bonjour/mDNS antes de volver a la
    entrada manual de URL. También se intenta el descubrimiento DNS-SD de área amplia cuando
    está configurado. Documentación: [Descubrimiento de Gateway](/es/gateway/discovery), [Bonjour](/es/gateway/bonjour).
  </Step>
  <Step title="Método de conexión">
    Cuando se selecciona una baliza, elige WebSocket directo o un túnel SSH:
    - **Directo**: conecta por `wss://` y solicita confiar en la huella digital TLS descubierta
      (fijación de confianza en el primer uso; solo se fija si aceptas).
    - **Túnel SSH**: imprime un comando `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      para ejecutar primero y luego se conecta al endpoint del túnel local.
  </Step>
  <Step title="Autenticación">
    Elige token (recomendado), contraseña o sin autenticación, y luego opcionalmente almacénalo
    como SecretRef en lugar de texto plano.
  </Step>
</Steps>

<Note>
Si el gateway es solo loopback y no detectable, usa túnel SSH o una tailnet manualmente.
`ws://` en texto plano se acepta para loopback, literales de IP privada, `.local` y URL de Tailnet `*.ts.net`; otros nombres de DNS privado necesitan `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Opciones de autenticación y modelo

<AccordionGroup>
  <Accordion title="Clave de API de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, y luego la guarda para uso del daemon.
  </Accordion>
  <Accordion title="CLI de Anthropic Claude">
    Ruta local preferida en incorporación/configuración interactiva; reutiliza un inicio de sesión existente de Claude CLI cuando está disponible.
  </Accordion>
  <Accordion title="Suscripción de OpenAI Code (OAuth)">
    Flujo de navegador; pega `code#state`.

    Establece `agents.defaults.model` en `openai/gpt-5.5` a través del runtime de Codex cuando el modelo no está establecido o ya pertenece a la familia OpenAI.

  </Accordion>
  <Accordion title="Suscripción de OpenAI Code (emparejamiento de dispositivo)">
    Flujo de emparejamiento de navegador con un código de dispositivo de corta duración.

    Establece `agents.defaults.model` en `openai/gpt-5.5` a través del runtime de Codex cuando el modelo no está establecido o ya pertenece a la familia OpenAI.

  </Accordion>
  <Accordion title="Clave de API de OpenAI">
    Usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego almacena la credencial en perfiles de autenticación.

    Establece `agents.defaults.model` en `openai/gpt-5.5` cuando el modelo no está establecido, es `openai/*` o referencias heredadas de modelos Codex.

  </Accordion>
  <Accordion title="OAuth de xAI (Grok)">
    Inicio de sesión en navegador para cuentas SuperGrok o X Premium elegibles. Esta es la
    ruta de xAI recomendada para la mayoría de usuarios. OpenClaw almacena el perfil de autenticación
    resultante para modelos Grok, Grok `web_search`, `x_search` y `code_execution`.
  </Accordion>
  <Accordion title="Código de dispositivo de xAI (Grok)">
    Inicio de sesión en navegador apto para remoto con un código corto en lugar de una devolución de llamada
    localhost. Úsalo desde hosts SSH, Docker o VPS.
  </Accordion>
  <Accordion title="Clave de API de xAI (Grok)">
    Solicita `XAI_API_KEY` y configura xAI como proveedor de modelos. Úsalo
    cuando quieras una clave de API de xAI Console en lugar de OAuth de suscripción.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) y te permite elegir el catálogo Zen o Go (una clave de API cubre ambos).
    URL de configuración: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clave de API (genérica)">
    Almacena la clave por ti.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Más detalle: [Vercel AI Gateway](/es/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita ID de cuenta, ID de gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Más detalle: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuración se escribe automáticamente. El valor predeterminado alojado es `MiniMax-M3`; la configuración con clave de API usa
    `minimax/...`, y la configuración OAuth usa `minimax-portal/...`.
    Más detalle: [MiniMax](/es/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    Estándar actualmente incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    Más detalle: [StepFun](/es/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Más detalle: [Synthetic](/es/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abiertos en la nube y locales)">
    Primero solicita `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Los modos respaldados por host solicitan URL base (predeterminada `http://127.0.0.1:11434`), descubren modelos disponibles y sugieren valores predeterminados.
    `Cloud + Local` también comprueba si ese host Ollama tiene sesión iniciada para acceso a la nube.
    Más detalle: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más detalle: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con endpoints compatibles con OpenAI, compatibles con OpenAI Responses y compatibles con Anthropic.

    La incorporación interactiva admite las mismas opciones de almacenamiento de clave de API que otros flujos de clave de API de proveedores:
    - **Pegar clave de API ahora** (texto plano)
    - **Usar referencia secreta** (ref. de entorno o ref. de proveedor configurada, con validación previa)

    La incorporación infiere compatibilidad con imágenes para IDs de modelos de visión comunes (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral y similares) y solo pregunta cuando el nombre del modelo es desconocido.

    Opciones no interactivas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcional; predeterminado `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcional; anula la capacidad inferida de entrada del modelo)

  </Accordion>
  <Accordion title="Skip">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Elige el modelo predeterminado a partir de las opciones detectadas, o introduce el proveedor y el modelo manualmente.
- Cuando la incorporación comienza desde una opción de autenticación de proveedor, el selector de modelos prefiere
  automáticamente ese proveedor. Para Volcengine y BytePlus, la misma preferencia
  también coincide con sus variantes de plan de codificación (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro de proveedor preferido quedara vacío, el selector recurre al
  catálogo completo en lugar de no mostrar ningún modelo.
- El asistente ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o no tiene autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (claves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación OAuth heredada: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- El comportamiento predeterminado de incorporación conserva las claves de API como valores en texto plano en los perfiles de autenticación.
- `--secret-input-mode ref` habilita el modo de referencia en lugar del almacenamiento de claves en texto plano.
  En la configuración interactiva, puedes elegir entre:
  - referencia de variable de entorno (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia de proveedor configurado (`file` o `exec`) con alias de proveedor + id
- El modo de referencia interactivo ejecuta una validación preliminar rápida antes de guardar.
  - Referencias de entorno: valida el nombre de la variable + valor no vacío en el entorno de incorporación actual.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el id solicitado.
  - Si la validación preliminar falla, la incorporación muestra el error y te permite reintentarlo.
- En modo no interactivo, `--secret-input-mode ref` solo está respaldado por el entorno.
  - Define la variable de entorno del proveedor en el entorno del proceso de incorporación.
  - Las opciones de clave en línea (por ejemplo `--openai-api-key`) requieren que esa variable de entorno esté definida; de lo contrario, la incorporación falla de inmediato.
  - Para proveedores personalizados, el modo no interactivo `ref` almacena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que `CUSTOM_API_KEY` esté definida; de lo contrario, la incorporación falla de inmediato.
- Las credenciales de autenticación del Gateway admiten opciones de texto plano y SecretRef en la configuración interactiva:
  - Modo de token: **Generar/almacenar token en texto plano** (predeterminado) o **Usar SecretRef**.
  - Modo de contraseña: texto plano o SecretRef.
- Ruta de SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes en texto plano siguen funcionando sin cambios.

<Note>
Consejo para entornos sin interfaz gráfica y servidores: completa OAuth en una máquina con navegador y luego copia
el `auth-profiles.json` de ese agente (por ejemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
`$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
solo es una fuente de importación heredada.
</Note>

## Salidas e internos

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se pasa `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (la incorporación local usa `"coding"` de forma predeterminada cuando no está definido; los valores explícitos existentes se conservan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (la incorporación local establece esto en `per-channel-peer` de forma predeterminada cuando no está definido; los valores explícitos existentes se conservan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Discord, iMessage, Signal, Slack, Telegram, WhatsApp) cuando aceptas durante los avisos; Discord y Slack también resuelven los nombres introducidos a identificadores
- `skills.install.nodeManager`
  - La opción `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual todavía puede establecer `skills.install.nodeManager: "yarn"` más adelante.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp van en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Algunos canales se entregan como plugins. Cuando se seleccionan durante la configuración, el asistente
solicita instalar el plugin (npm o ruta local) antes de la configuración del canal.
</Note>

## Configuración no interactiva

`--non-interactive` requiere `--accept-risk` (reconoce que los agentes son
potentes y que el acceso completo al sistema es riesgoso):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Referencia completa de opciones y ejemplos específicos de proveedores: [`openclaw onboard`](/es/cli/onboard), [automatización de CLI](/es/start/wizard-cli-automation).

## RPC del asistente del Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Los clientes (aplicación de macOS y Control UI) pueden renderizar los pasos sin volver a implementar la lógica de incorporación.

## Comportamiento de configuración de Signal

- Descarga el artefacto de versión adecuado de las versiones oficiales de GitHub de `signal-cli` (compilación nativa, solo Linux x86-64)
- En otras plataformas (macOS, Linux no x64), instala mediante Homebrew en su lugar
- Almacena la instalación del artefacto de versión en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Windows nativo aún no es compatible; ejecuta la incorporación dentro de WSL2 para obtener la ruta de instalación de Linux

## Documentación relacionada

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Automatización y scripts: [Automatización de CLI](/es/start/wizard-cli-automation)
- Referencia de comandos: [`openclaw onboard`](/es/cli/onboard)
