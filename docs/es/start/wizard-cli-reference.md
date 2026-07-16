---
read_when:
    - Necesita información detallada sobre el comportamiento de un paso específico de `openclaw onboard`
    - Está depurando los resultados de la incorporación o integrando clientes de incorporación
sidebarTitle: CLI reference
summary: 'Comportamiento paso a paso de openclaw onboard: qué hace cada paso, qué configuración escribe y aspectos internos'
title: Referencia de configuración de la CLI
x-i18n:
    generated_at: "2026-07-16T12:11:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Esta página describe paso a paso el comportamiento, los resultados y los aspectos internos de la incorporación.
Para consultar una guía, véase [Incorporación (CLI)](/es/start/wizard). Para obtener la referencia completa de las opciones de la CLI
(cada `--flag`, ejemplos no interactivos y comandos específicos de cada
proveedor), véase [`openclaw onboard`](/es/cli/onboard).

## Qué hace el asistente

El modo local (predeterminado) guía a través de:

- Configuración del modelo y la autenticación (Anthropic, OAuth de la suscripción a OpenAI Code, xAI, OpenCode, endpoints personalizados y otros flujos de autenticación propios de los proveedores)
- Ubicación del espacio de trabajo y archivos de arranque
- Ajustes del Gateway (puerto, vinculación, autenticación, Tailscale)
- Canales y proveedores (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y otros canales incluidos o mediante plugins)
- Proveedor de búsqueda web (opcional)
- Instalación del daemon (LaunchAgent, unidad de usuario de systemd o tarea programada nativa de Windows con alternativa mediante la carpeta Inicio)
- Comprobación de estado
- Configuración de Skills

El modo remoto configura este equipo para conectarse a un Gateway ubicado en otro lugar. No
instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de la configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, seleccione **Mantener los valores actuales**, **Revisar y actualizar** o **Restablecer antes de la configuración**.
    - Volver a ejecutar el asistente no borra nada, salvo que se seleccione explícitamente Restablecer (o se pase `--reset`).
    - El valor predeterminado de `--reset` de la CLI es `config+creds+sessions`; use `--reset-scope full` para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y solicita ejecutar `openclaw doctor` antes de continuar.
    - El restablecimiento mueve el estado a la papelera (nunca lo elimina directamente) y ofrece los siguientes ámbitos:
      - Solo la configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)

  </Step>
  <Step title="Modelo y autenticación">
    - La matriz completa de opciones se encuentra en [Opciones de autenticación y modelo](#auth-and-model-options).

  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado: `~/.openclaw/workspace` (configurable).
    - Crea los archivos iniciales del espacio de trabajo necesarios para el arranque de la primera ejecución.
    - Estructura del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Solicita el puerto, la vinculación, el modo de autenticación y la exposición mediante Tailscale.
    - Recomendación: mantenga habilitada la autenticación mediante token incluso para loopback, de modo que los clientes WS locales deban autenticarse.
    - En el modo de token, la configuración interactiva ofrece:
      - **Generar/almacenar un token en texto sin formato** (predeterminado)
      - **Usar SecretRef** (opcional)
    - En el modo de contraseña, la configuración interactiva también permite almacenarla en texto sin formato o mediante SecretRef.
    - Ruta no interactiva para SecretRef de token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No puede combinarse con `--gateway-token`.
    - Deshabilite la autenticación únicamente si confía plenamente en todos los procesos locales.
    - Las vinculaciones que no sean de loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional mediante código QR
    - [Telegram](/es/channels/telegram): token del bot
    - [Discord](/es/channels/discord): token del bot
    - [Google Chat](/es/channels/googlechat): JSON de la cuenta de servicio + audiencia del Webhook
    - [Mattermost](/es/channels/mattermost): token del bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de la cuenta
    - [iMessage](/es/channels/imessage): ruta de la CLI de `imsg` + acceso a la base de datos de Mensajes; use un contenedor SSH cuando el Gateway se ejecute fuera de un Mac
    - Seguridad de los mensajes directos: el valor predeterminado es el emparejamiento. El primer mensaje directo envía un código; apruébelo mediante
      `openclaw pairing approve <channel> <code>` o use listas de permitidos.
  </Step>
  <Step title="Búsqueda web">
    - Seleccione un proveedor (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) u omita este paso.
    - Omita este paso con `--skip-search`; vuelva a configurarlo más adelante con `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para un sistema sin interfaz gráfica, use un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario de systemd
      - El asistente intenta ejecutar `loginctl enable-linger <user>` para que el gateway permanezca activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero, una tarea programada
      - Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta Inicio e inicia el gateway inmediatamente.
      - Las tareas programadas siguen siendo la opción preferida porque proporcionan un mejor estado del supervisor.
    - Selección del entorno de ejecución: Node es obligatorio porque el almacén de estado canónico del entorno de ejecución de OpenClaw usa `node:sqlite`.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el gateway (si es necesario) y ejecuta `openclaw health`.
    - `openclaw status --deep` añade la sonda de estado del gateway activo a la salida de estado, incluidas las sondas de canales cuando son compatibles.

  </Step>
  <Step title="Skills">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Permite elegir el gestor de Node: npm, pnpm o bun.
    - Instala dependencias opcionales para las Skills incluidas de confianza cuando está disponible el
      instalador requerido.
    - Omite los instaladores de Homebrew, uv y Go que no estén disponibles y, a continuación, agrupa las
      Skills afectadas con instrucciones de configuración manual. Ejecute `openclaw doctor` después de instalar
      los requisitos previos que falten.

  </Step>
  <Step title="Finalización">
    - Resumen y pasos siguientes, incluidas las opciones de aplicaciones para iOS, Android y macOS.

  </Step>
</Steps>

<Note>
Si no se detecta una interfaz gráfica, el asistente muestra instrucciones de reenvío de puertos SSH para la interfaz de control en lugar de abrir un navegador.
Si faltan los recursos de la interfaz de control, el asistente intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la interfaz).
</Note>

## Detalles del modo remoto

El modo remoto configura este equipo para conectarse a un Gateway ubicado en otro lugar. No
instala ni modifica nada en el host remoto.

Elementos que se configuran:

- URL del gateway remoto (`ws://...` o `wss://...`)
- Token, contraseña o ninguna autenticación, de acuerdo con la configuración del Gateway remoto

<Steps>
  <Step title="Detección (opcional)">
    Si `dns-sd` (macOS) o `avahi-browse` (Linux) está disponible, la incorporación
    ofrece buscar balizas de gateway Bonjour/mDNS antes de recurrir a
    la introducción manual de la URL. También se intenta la detección DNS-SD de área extensa cuando
    está configurada. Documentación: [Detección del Gateway](/es/gateway/discovery), [Bonjour](/es/gateway/bonjour).
  </Step>
  <Step title="Método de conexión">
    Cuando se selecciona una baliza, elija WebSocket directo o un túnel SSH:
    - **Directa**: se conecta mediante `wss://` y solicita confiar en la huella digital
      TLS detectada (anclaje de confianza en el primer uso; solo se ancla si se acepta).
    - **Túnel SSH**: muestra un comando `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      que debe ejecutarse primero y, a continuación, se conecta al endpoint del túnel local.
  </Step>
  <Step title="Autenticación">
    Seleccione token (recomendado), contraseña o ninguna autenticación y, a continuación, elija opcionalmente almacenarlo
    como SecretRef en lugar de texto sin formato.
  </Step>
</Steps>

<Note>
Si el gateway solo usa loopback y no se puede detectar, use manualmente un túnel SSH o una tailnet.
Se acepta `ws://` en texto sin formato para loopback, literales de IP privadas, `.local` y URL de Tailnet `*.ts.net`; otros nombres DNS privados necesitan `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Opciones de autenticación y modelo

Si un paso de configuración del proveedor falla durante la incorporación interactiva (por ejemplo, una opción de reutilización de la CLI
sin un inicio de sesión local), el asistente muestra el error y vuelve al selector de proveedores
en lugar de salir. Las ejecuciones explícitas de `--auth-choice` siguen fallando inmediatamente para facilitar la automatización.

<AccordionGroup>
  <Accordion title="Clave de API de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave y, a continuación, la guarda para que la use el daemon.
  </Accordion>
  <Accordion title="CLI de Anthropic Claude">
    Ruta local preferida durante la incorporación/configuración interactiva; reutiliza un inicio de sesión existente de la CLI de Claude cuando está disponible.
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
    `openai/gpt-5.6`; el identificador de modelo de API directa sin prefijo se resuelve en el nivel Sol.

    Añadir o volver a autenticar OpenAI conserva un modelo principal explícito
    existente, incluido `openai/gpt-5.5`. Si la cuenta no ofrece GPT-5.6,
    seleccione `openai/gpt-5.5` explícitamente; OpenClaw no lo sustituye silenciosamente por un modelo inferior.

  </Accordion>
  <Accordion title="OAuth de xAI (Grok)">
    Inicio de sesión mediante navegador para cuentas SuperGrok o X Premium aptas. Esta es la
    opción de xAI recomendada para la mayoría de los usuarios. OpenClaw almacena el perfil
    de autenticación resultante para los modelos Grok, Grok `web_search`, `x_search` y `code_execution`.
  </Accordion>
  <Accordion title="Código de dispositivo de xAI (Grok)">
    Inicio de sesión mediante navegador apto para entornos remotos, con un código breve en lugar de una
    devolución de llamada a localhost. Utilice esta opción desde hosts SSH, Docker o VPS.
  </Accordion>
  <Accordion title="Clave de API de xAI (Grok)">
    Solicita `XAI_API_KEY` y configura xAI como proveedor de modelos. Utilice esta
    opción cuando quiera usar una clave de API de xAI Console en lugar de OAuth por suscripción.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) y permite elegir el catálogo Zen o Go (una clave de API sirve para ambos).
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
    Solicita el ID de cuenta, el ID del gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Más información: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuración se escribe automáticamente. El valor predeterminado alojado es `MiniMax-M3`; la configuración con clave de API utiliza
    `minimax/...` y la configuración con OAuth utiliza `minimax-portal/...`.
    Más información: [MiniMax](/es/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    La opción estándar incluye actualmente `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    Más información: [StepFun](/es/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Más información: [Synthetic](/es/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abiertos locales y en la nube)">
    Primero solicita `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` utiliza `OLLAMA_API_KEY` con `https://ollama.com`.
    Los modos basados en host solicitan la URL base (valor predeterminado: `http://127.0.0.1:11434`), detectan los modelos disponibles y sugieren valores predeterminados.
    `Cloud + Local` también comprueba si se ha iniciado sesión en ese host de Ollama para acceder a la nube.
    Más información: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más información: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con endpoints compatibles con OpenAI, OpenAI Responses y Anthropic.

    La incorporación interactiva admite las mismas opciones de almacenamiento de claves de API que los demás flujos de claves de API de proveedores:
    - **Pegar ahora la clave de API** (texto sin formato)
    - **Usar referencia de secreto** (referencia de entorno o referencia de proveedor configurado, con validación previa)

    La incorporación deduce la compatibilidad con imágenes para los ID habituales de modelos de visión (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral y similares) y solo pregunta cuando se desconoce el nombre del modelo.

    Indicadores no interactivos:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcional; valor predeterminado: `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcional; anula la capacidad de entrada del modelo deducida)

  </Accordion>
  <Accordion title="Omitir">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Seleccione el modelo predeterminado entre las opciones detectadas o introduzca manualmente el proveedor y el modelo.
- Cuando la incorporación comienza desde una opción de autenticación de proveedor, el selector de modelos da preferencia
  automáticamente a ese proveedor. Para Volcengine y BytePlus, esa misma preferencia
  también coincide con sus variantes de planes de programación (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro del proveedor preferido no produjera resultados, el selector recurre
  al catálogo completo en lugar de no mostrar ningún modelo.
- El asistente ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o carece de autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (claves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación de OAuth heredado: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- El comportamiento predeterminado de la incorporación conserva las claves de API como valores de texto sin formato en los perfiles de autenticación.
- `--secret-input-mode ref` activa el modo de referencia en lugar de almacenar la clave como texto sin formato.
  En la configuración interactiva, se puede elegir entre:
  - referencia de variable de entorno (por ejemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia de proveedor configurado (`file` o `exec`) con alias e ID del proveedor
- El modo de referencia interactivo ejecuta una validación previa rápida antes de guardar.
  - Referencias de entorno: valida el nombre de la variable y que su valor no esté vacío en el entorno de incorporación actual.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el ID solicitado.
  - Si la validación previa falla, la incorporación muestra el error y permite volver a intentarlo.
- En el modo no interactivo, `--secret-input-mode ref` solo admite valores procedentes del entorno.
  - Establezca la variable de entorno del proveedor en el entorno del proceso de incorporación.
  - Los indicadores de clave en línea (por ejemplo, `--openai-api-key`) requieren que esa variable de entorno esté establecida; de lo contrario, la incorporación falla de inmediato.
  - Para proveedores personalizados, el modo no interactivo `ref` almacena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que `CUSTOM_API_KEY` esté establecida; de lo contrario, la incorporación falla de inmediato.
- Las credenciales de autenticación del Gateway admiten opciones de texto sin formato y SecretRef en la configuración interactiva:
  - Modo de token: **Generar/almacenar token en texto sin formato** (valor predeterminado) o **Usar SecretRef**.
  - Modo de contraseña: texto sin formato o SecretRef.
- Ruta no interactiva de SecretRef para el token: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes con texto sin formato siguen funcionando sin cambios.

<Note>
Consejo para entornos sin interfaz gráfica y servidores: complete OAuth en una máquina con navegador y, después, copie
el archivo `auth-profiles.json` de ese agente (por ejemplo,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` o la ruta correspondiente
`$OPENCLAW_STATE_DIR/...`) al host del gateway. `credentials/oauth.json`
es únicamente una fuente de importación heredada.
</Note>

## Resultados y detalles internos

Campos habituales en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se proporciona `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se selecciona Minimax)
- `tools.profile` (la incorporación local utiliza de forma predeterminada `"coding"` cuando no está establecido; se conservan los valores explícitos existentes)
- `gateway.*` (modo, vinculación, autenticación, Tailscale)
- `session.dmScope` (la incorporación local lo establece de forma predeterminada en `per-channel-peer` cuando no está establecido; se conservan los valores explícitos existentes)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Discord, iMessage, Signal, Slack, Telegram, WhatsApp) cuando se acepta su uso durante las solicitudes; Discord y Slack también resuelven los nombres introducidos en ID
- `skills.install.nodeManager`
  - El indicador `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede establecer `skills.install.nodeManager: "yarn"` posteriormente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` escribe `agents.list[]` y, opcionalmente, `bindings`.

Las credenciales de WhatsApp se guardan en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones activas y las transcripciones se almacenan en
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. El directorio
`~/.openclaw/agents/<agentId>/sessions/` se utiliza para entradas de migración
heredadas y artefactos de archivo o soporte.

<Note>
Algunos canales se distribuyen como plugins. Cuando se seleccionan durante la configuración, el asistente
solicita instalar el plugin (mediante npm o una ruta local) antes de configurar el canal.
</Note>

## Configuración no interactiva

`--non-interactive` requiere `--accept-risk` (confirma que los agentes son
potentes y que el acceso completo al sistema conlleva riesgos):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Referencia completa de indicadores y ejemplos específicos de proveedores: [`openclaw onboard`](/es/cli/onboard), [Automatización de la CLI](/es/start/wizard-cli-automation).

## RPC del asistente del Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Los clientes (la aplicación de macOS y la interfaz de control) pueden representar los pasos sin volver a implementar la lógica de incorporación.

## Comportamiento de la configuración de Signal

- Descarga el recurso de la versión correspondiente desde las versiones oficiales de GitHub de `signal-cli` (compilación nativa, solo Linux x86-64)
- En otras plataformas (macOS y Linux que no sea x64), realiza la instalación mediante Homebrew
- Almacena la instalación del recurso de la versión en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Windows nativo aún no es compatible; ejecute la incorporación dentro de WSL2 para obtener la ruta de instalación de Linux

## Documentación relacionada

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Automatización y scripts: [Automatización de la CLI](/es/start/wizard-cli-automation)
- Referencia del comando: [`openclaw onboard`](/es/cli/onboard)
