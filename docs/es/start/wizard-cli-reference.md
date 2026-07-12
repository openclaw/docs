---
read_when:
    - Necesitas información detallada sobre el comportamiento de un paso específico de `openclaw onboard`
    - Estás depurando los resultados de la incorporación o integrando clientes de incorporación
sidebarTitle: CLI reference
summary: 'Comportamiento paso a paso de openclaw onboard: qué hace cada paso, qué configuración escribe y detalles internos'
title: Referencia de configuración de la CLI
x-i18n:
    generated_at: "2026-07-12T14:51:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56b318b3c5fbaeb37e99871e10b35eae38b209f3a2f683ff85816aca87a4ee6e
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Esta página describe paso a paso el comportamiento, los resultados y los aspectos internos de la incorporación.
Para consultar una guía, consulte [Incorporación (CLI)](/es/start/wizard). Para ver la referencia completa de opciones de la CLI
(cada `--flag`, ejemplos no interactivos y comandos específicos de
proveedores), consulte [`openclaw onboard`](/es/cli/onboard).

## Qué hace el asistente

El modo local (predeterminado) guía por:

- Configuración del modelo y la autenticación (Anthropic, OAuth de suscripción a OpenAI Code, xAI, OpenCode, endpoints personalizados y más flujos de autenticación gestionados por proveedores)
- Ubicación del espacio de trabajo y archivos de arranque
- Configuración del Gateway (puerto, enlace, autenticación, Tailscale)
- Canales y proveedores (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y otros canales incluidos o de plugins)
- Proveedor de búsqueda web (opcional)
- Instalación del daemon (LaunchAgent, unidad de usuario de systemd o tarea programada nativa de Windows con alternativa en la carpeta de inicio)
- Comprobación de estado
- Configuración de Skills

El modo remoto configura este equipo para conectarse a un Gateway ubicado en otro lugar. No
instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de la configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elija **Conservar los valores actuales**, **Revisar y actualizar** o **Restablecer antes de la configuración**.
    - Volver a ejecutar el asistente no borra nada, salvo que elija explícitamente Restablecer (o especifique `--reset`).
    - La opción `--reset` de la CLI usa de forma predeterminada `config+creds+sessions`; use `--reset-scope full` para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y solicita que ejecute `openclaw doctor` antes de continuar.
    - El restablecimiento mueve el estado a la Papelera (nunca lo elimina directamente) y ofrece los siguientes ámbitos:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)

  </Step>
  <Step title="Modelo y autenticación">
    - La matriz completa de opciones se encuentra en [Opciones de autenticación y modelo](#auth-and-model-options).

  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado: `~/.openclaw/workspace` (configurable).
    - Crea los archivos del espacio de trabajo necesarios para el arranque inicial.
    - Estructura del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Solicita el puerto, el enlace, el modo de autenticación y la exposición mediante Tailscale.
    - Recomendación: mantenga habilitada la autenticación mediante token incluso para loopback, de modo que los clientes WS locales deban autenticarse.
    - En el modo de token, la configuración interactiva ofrece:
      - **Generar/almacenar un token en texto sin formato** (predeterminado)
      - **Usar SecretRef** (opcional)
    - En el modo de contraseña, la configuración interactiva también permite el almacenamiento en texto sin formato o mediante SecretRef.
    - Ruta no interactiva de SecretRef para el token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No se puede combinar con `--gateway-token`.
    - Deshabilite la autenticación únicamente si confía plenamente en todos los procesos locales.
    - Los enlaces que no sean de loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional mediante código QR
    - [Telegram](/es/channels/telegram): token del bot
    - [Discord](/es/channels/discord): token del bot
    - [Google Chat](/es/channels/googlechat): JSON de la cuenta de servicio + audiencia del webhook
    - [Mattermost](/es/channels/mattermost): token del bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de la cuenta
    - [iMessage](/es/channels/imessage): ruta de la CLI `imsg` + acceso a la base de datos de Mensajes; use un contenedor SSH cuando el Gateway se ejecute fuera de un Mac
    - Seguridad de los mensajes directos: el valor predeterminado es el emparejamiento. El primer mensaje directo envía un código; apruébelo mediante
      `openclaw pairing approve <channel> <code>` o use listas de permitidos.
  </Step>
  <Step title="Búsqueda web">
    - Elija un proveedor (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) u omita este paso.
    - Omita este paso con `--skip-search`; vuelva a configurarlo posteriormente con `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para sistemas sin interfaz gráfica, use un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario de systemd
      - El asistente intenta ejecutar `loginctl enable-linger <user>` para que el Gateway permanezca activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero, tarea programada
      - Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta de inicio e inicia el Gateway inmediatamente.
      - Las tareas programadas siguen siendo la opción preferida porque proporcionan un mejor estado del supervisor.
    - Selección del entorno de ejecución: solo Node se ofrece de forma interactiva. Bun puede dañar la memoria al volver a conectar WhatsApp/Telegram y no es un entorno de ejecución de daemon compatible con esos canales; especifique `--daemon-runtime bun` únicamente fuera de esa combinación.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - `openclaw status --deep` añade la sonda de estado del Gateway en vivo a la salida de estado, incluidas las sondas de canales cuando sean compatibles.

  </Step>
  <Step title="Skills">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Permite elegir el gestor de Node: npm, pnpm o bun.
    - Instala dependencias opcionales para las Skills incluidas de confianza cuando el instalador requerido
      está disponible.
    - Omite los instaladores no disponibles de Homebrew, uv y Go y, a continuación, agrupa las Skills afectadas
      con instrucciones de configuración manual. Ejecute `openclaw doctor` después de instalar
      los requisitos previos que faltan.

  </Step>
  <Step title="Finalización">
    - Resumen y próximos pasos, incluidas las opciones de aplicaciones para iOS, Android y macOS.

  </Step>
</Steps>

<Note>
Si no se detecta ninguna interfaz gráfica, el asistente muestra instrucciones de redirección de puertos SSH para la interfaz de control en lugar de abrir un navegador.
Si faltan los recursos de la interfaz de control, el asistente intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la interfaz).
</Note>

## Detalles del modo remoto

El modo remoto configura esta máquina para conectarse a un Gateway ubicado en otro lugar. No
instala ni modifica nada en el host remoto.

Lo que se configura:

- URL del Gateway remoto (`ws://...` o `wss://...`)
- Token, contraseña o ausencia de autenticación, según la configuración del Gateway remoto

<Steps>
  <Step title="Descubrimiento (opcional)">
    Si `dns-sd` (macOS) o `avahi-browse` (Linux) está disponible, el proceso de incorporación
    ofrece buscar balizas de Gateway Bonjour/mDNS antes de recurrir a la
    introducción manual de la URL. También se intenta el descubrimiento DNS-SD de área amplia cuando
    está configurado. Documentación: [Descubrimiento de Gateway](/es/gateway/discovery), [Bonjour](/es/gateway/bonjour).
  </Step>
  <Step title="Método de conexión">
    Cuando se selecciona una baliza, se elige entre WebSocket directo o un túnel SSH:
    - **Directo**: se conecta mediante `wss://` y solicita confiar en la huella digital
      TLS descubierta (anclaje por confianza en el primer uso; solo se ancla si se acepta).
    - **Túnel SSH**: muestra un comando `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      que debe ejecutarse primero y, a continuación, se conecta al punto de conexión del túnel local.
  </Step>
  <Step title="Autenticación">
    Se elige token (recomendado), contraseña o ausencia de autenticación y, opcionalmente, se almacena
    como SecretRef en lugar de texto sin formato.
  </Step>
</Steps>

<Note>
Si el Gateway solo admite conexiones de bucle invertido y no se puede detectar, use manualmente un túnel SSH o una tailnet.
Se acepta `ws://` en texto sin formato para bucle invertido, literales de IP privadas, `.local` y URL de Tailnet `*.ts.net`; otros nombres DNS privados necesitan `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Opciones de autenticación y modelo

Si un paso de configuración de proveedor falla durante la incorporación interactiva (por ejemplo, una opción de reutilización de la CLI
sin un inicio de sesión local), el asistente muestra el error y vuelve al selector de proveedores
en lugar de finalizar. Las ejecuciones explícitas con `--auth-choice` siguen fallando de inmediato para facilitar la automatización.

<AccordionGroup>
  <Accordion title="Clave de API de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave y, a continuación, la guarda para que la use el daemon.
  </Accordion>
  <Accordion title="CLI de Anthropic Claude">
    Ruta local preferida en la incorporación/configuración interactiva; reutiliza un inicio de sesión existente de la CLI de Claude cuando está disponible.
  </Accordion>
  <Accordion title="Suscripción a OpenAI Code (OAuth)">
    Flujo del navegador; pegue `code#state`.

    En una configuración nueva sin modelo principal, establece `agents.defaults.model` en
    `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.

  </Accordion>
  <Accordion title="Suscripción a OpenAI Code (emparejamiento de dispositivo)">
    Flujo de emparejamiento en el navegador con un código de dispositivo de corta duración.

    En una configuración nueva sin modelo principal, establece `agents.defaults.model` en
    `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.

  </Accordion>
  <Accordion title="Clave de API de OpenAI">
    Usa `OPENAI_API_KEY` si está presente o solicita una clave y, a continuación, almacena la credencial en los perfiles de autenticación.

    En una configuración nueva sin modelo principal, establece `agents.defaults.model` en
    `openai/gpt-5.6`; el identificador básico del modelo de API directa se resuelve al nivel Sol.

    Al añadir o volver a autenticar OpenAI, se conserva un modelo principal explícito
    existente, incluido `openai/gpt-5.5`. Si la cuenta no ofrece GPT-5.6,
    seleccione `openai/gpt-5.5` explícitamente; OpenClaw no lo sustituye silenciosamente por una versión inferior.

  </Accordion>
  <Accordion title="OAuth de xAI (Grok)">
    Inicio de sesión en el navegador para cuentas SuperGrok o X Premium aptas. Esta es la
    ruta de xAI recomendada para la mayoría de las personas. OpenClaw almacena el perfil de
    autenticación resultante para los modelos Grok, Grok `web_search`, `x_search` y `code_execution`.
  </Accordion>
  <Accordion title="Código de dispositivo de xAI (Grok)">
    Inicio de sesión en el navegador apto para entornos remotos mediante un código corto en lugar de una
    devolución de llamada a localhost. Use esta opción desde hosts SSH, Docker o VPS.
  </Accordion>
  <Accordion title="Clave de API de xAI (Grok)">
    Solicita `XAI_API_KEY` y configura xAI como proveedor de modelos. Use esta
    opción cuando prefiera una clave de API de xAI Console en lugar de OAuth de suscripción.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) y permite elegir el catálogo Zen o Go (una clave de API cubre ambos).
    URL de configuración: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clave de API (genérica)">
    Almacena la clave.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Más información: [Vercel AI Gateway](/es/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita el identificador de cuenta, el identificador del Gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Más información: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuración se escribe automáticamente. El valor predeterminado alojado es `MiniMax-M3`; la configuración mediante clave de API usa
    `minimax/...` y la configuración mediante OAuth usa `minimax-portal/...`.
    Más información: [MiniMax](/es/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuración se escribe automáticamente para StepFun estándar o Step Plan en puntos de conexión de China o globales.
    La opción estándar incluye actualmente `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    Más información: [StepFun](/es/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Más información: [Synthetic](/es/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abiertos locales y en la nube)">
    Primero solicita elegir `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Los modos respaldados por un host solicitan la URL base (valor predeterminado: `http://127.0.0.1:11434`), detectan los modelos disponibles y sugieren valores predeterminados.
    `Cloud + Local` también comprueba si se ha iniciado sesión en ese host de Ollama para acceder a la nube.
    Más información: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más información: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con puntos de conexión compatibles con OpenAI, OpenAI Responses y Anthropic.

    La incorporación interactiva admite las mismas opciones de almacenamiento de claves de API que los demás flujos de claves de API de proveedores:
    - **Pegar la clave de API ahora** (texto sin formato)
    - **Usar una referencia de secreto** (referencia de entorno o referencia de proveedor configurado, con validación previa)

    La incorporación infiere la compatibilidad con imágenes para los identificadores habituales de modelos de visión (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral y similares) y solo pregunta cuando se desconoce el nombre del modelo.

    Opciones no interactivas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcional; valor predeterminado: `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcional; anula la capacidad de entrada inferida del modelo)

  </Accordion>
  <Accordion title="Omitir">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Seleccione el modelo predeterminado entre las opciones detectadas o introduzca manualmente el proveedor y el modelo.
- Cuando la incorporación comienza a partir de una opción de autenticación de proveedor, el selector de modelos da preferencia
  automáticamente a ese proveedor. Para Volcengine y BytePlus, la misma preferencia
  también coincide con sus variantes de planes de programación (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro de proveedor preferido no produjera ningún resultado, el selector recurre
  al catálogo completo en lugar de no mostrar ningún modelo.
- El asistente ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o carece de autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (claves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación de OAuth heredada: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- De forma predeterminada, la incorporación conserva las claves de API como valores de texto sin formato en los perfiles de autenticación.
- `--secret-input-mode ref` habilita el modo de referencia en lugar del almacenamiento de claves en texto sin formato.
  En la configuración interactiva, puede elegir entre:
  - referencia a una variable de entorno (por ejemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia a un proveedor configurado (`file` o `exec`) con alias e identificador del proveedor
- El modo de referencia interactivo ejecuta una validación previa rápida antes de guardar.
  - Referencias de entorno: valida el nombre de la variable y que tenga un valor no vacío en el entorno de incorporación actual.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el identificador solicitado.
  - Si falla la validación previa, la incorporación muestra el error y permite volver a intentarlo.
- En el modo no interactivo, `--secret-input-mode ref` solo admite variables de entorno.
  - Defina la variable de entorno del proveedor en el entorno del proceso de incorporación.
  - Las opciones de clave en línea (por ejemplo, `--openai-api-key`) requieren que se defina esa variable de entorno; de lo contrario, la incorporación falla inmediatamente.
  - Para proveedores personalizados, el modo no interactivo `ref` almacena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que se defina `CUSTOM_API_KEY`; de lo contrario, la incorporación falla inmediatamente.
- Las credenciales de autenticación del Gateway admiten opciones de texto sin formato y SecretRef en la configuración interactiva:
  - Modo de token: **Generar/almacenar un token en texto sin formato** (predeterminado) o **Usar SecretRef**.
  - Modo de contraseña: texto sin formato o SecretRef.
- Ruta no interactiva de SecretRef para el token: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes con texto sin formato siguen funcionando sin cambios.

<Note>
Consejo para entornos sin interfaz gráfica y servidores: complete OAuth en una máquina con navegador y, después, copie
el archivo `auth-profiles.json` de ese agente (por ejemplo,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` o la ruta
correspondiente bajo `$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
es únicamente una fuente de importación heredada.
</Note>

## Salidas y funcionamiento interno

Campos habituales en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se pasa `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (la incorporación local usa de forma predeterminada `"coding"` cuando no está definido; se conservan los valores explícitos existentes)
- `gateway.*` (modo, enlace, autenticación, Tailscale)
- `session.dmScope` (la incorporación local usa de forma predeterminada `per-channel-peer` cuando no está definido; se conservan los valores explícitos existentes)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Discord, iMessage, Signal, Slack, Telegram, WhatsApp) cuando acepta configurarlas durante las indicaciones; Discord y Slack también resuelven los nombres introducidos a identificadores
- `skills.install.nodeManager`
  - La opción `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual puede seguir estableciendo posteriormente `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` escribe `agents.list[]` y los `bindings` opcionales.

Las credenciales de WhatsApp se guardan en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones activas y las transcripciones se almacenan en
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. El directorio
`~/.openclaw/agents/<agentId>/sessions/` se utiliza para las entradas de migración
heredadas y los artefactos de archivo o soporte.

<Note>
Algunos canales se proporcionan como plugins. Cuando se seleccionan durante la configuración, el asistente
solicita instalar el plugin (npm o ruta local) antes de configurar el canal.
</Note>

## Configuración no interactiva

`--non-interactive` requiere `--accept-risk` (reconoce que los agentes son
potentes y que el acceso completo al sistema conlleva riesgos):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Referencia completa de opciones y ejemplos específicos de proveedores: [`openclaw onboard`](/es/cli/onboard), [Automatización de la CLI](/es/start/wizard-cli-automation).

## RPC del asistente del Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Los clientes (la aplicación para macOS y la interfaz de control) pueden representar los pasos sin volver a implementar la lógica de incorporación.

## Comportamiento de la configuración de Signal

- Descarga el recurso de la versión correspondiente desde las versiones oficiales de `signal-cli` en GitHub (compilación nativa, solo Linux x86-64)
- En otras plataformas (macOS y Linux que no sea x64), realiza la instalación mediante Homebrew
- Almacena la instalación del recurso de la versión en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Windows nativo aún no es compatible; ejecuta la incorporación dentro de WSL2 para obtener la ruta de instalación de Linux

## Documentación relacionada

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Automatización y scripts: [Automatización de la CLI](/es/start/wizard-cli-automation)
- Referencia de comandos: [`openclaw onboard`](/es/cli/onboard)
