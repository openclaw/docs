---
read_when:
    - Necesita información detallada sobre el comportamiento de un paso específico de `openclaw onboard`
    - Está depurando los resultados de la incorporación o integrando clientes de incorporación
sidebarTitle: CLI reference
summary: 'Comportamiento paso a paso de `openclaw onboard`: qué hace cada paso, qué configuración escribe y cómo funciona internamente'
title: Referencia de configuración de la CLI
x-i18n:
    generated_at: "2026-07-21T09:02:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71ac9a7948c9a5189e4f27a060295a45fc0230f1c60d4809e829fe06cbbbd872
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Esta página abarca paso a paso el comportamiento, los resultados y el funcionamiento interno de la incorporación.
Para consultar una guía, véase [Incorporación (CLI)](/es/start/wizard). Para obtener la referencia completa de las opciones de la CLI
(cada `--flag`, ejemplos no interactivos y comandos específicos de
proveedores), véase [`openclaw onboard`](/es/cli/onboard).

## Qué hace el asistente

El modo local (predeterminado) guía a través de:

- Configuración del modelo y la autenticación (Anthropic, OAuth de suscripción a OpenAI Code, xAI, OpenCode, endpoints personalizados y más flujos de autenticación propiedad de los proveedores)
- Ubicación del espacio de trabajo y archivos de arranque
- Configuración del Gateway (puerto, vinculación, autenticación, Tailscale)
- Canales y proveedores (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y otros canales incluidos o de plugins)
- Proveedor de búsqueda web (opcional)
- Instalación del demonio (LaunchAgent, unidad de usuario de systemd o tarea programada nativa de Windows con alternativa mediante la carpeta de inicio)
- Comprobación de estado
- Configuración de Skills

El modo remoto configura este equipo para conectarse a un Gateway ubicado en otro lugar. No
instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de la configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, seleccione **Mantener los valores actuales**, **Revisar y actualizar** o **Restablecer antes de la configuración**.
    - Volver a ejecutar el asistente no borra nada, salvo que se elija explícitamente Reset (o se pase `--reset`).
    - El valor predeterminado de `--reset` en la CLI es `config+creds+sessions`; use `--reset-scope full` para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y solicita ejecutar `openclaw doctor` antes de continuar.
    - El restablecimiento mueve el estado a la papelera (nunca lo elimina directamente) y ofrece los siguientes ámbitos:
      - Solo la configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)

  </Step>
  <Step title="Modelo y autenticación">
    - La matriz completa de opciones se encuentra en [Opciones de autenticación y modelos](#auth-and-model-options).

  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado: `~/.openclaw/workspace` (configurable).
    - Crea los archivos del espacio de trabajo necesarios para el arranque inicial.
    - Al volver a ejecutarlo, una lista de agentes existente conserva su espacio de trabajo para toda la flota, a menos que
      se confirme explícitamente el traslado. Las nuevas ejecuciones no interactivas muestran una advertencia y conservan
      el valor actual.
    - Disposición del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Solicita el puerto, la vinculación, el modo de autenticación y la exposición mediante Tailscale.
    - Recomendación: mantenga habilitada la autenticación mediante token incluso para loopback, de modo que los clientes WS locales deban autenticarse.
    - En el modo de token, la configuración interactiva ofrece:
      - **Generar/almacenar un token en texto sin formato** (predeterminado)
      - **Usar SecretRef** (opcional)
    - En el modo de contraseña, la configuración interactiva también admite el almacenamiento en texto sin formato o mediante SecretRef.
    - Ruta no interactiva de SecretRef para el token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No puede combinarse con `--gateway-token`.
    - Deshabilite la autenticación solo si confía plenamente en todos los procesos locales.
    - Las vinculaciones que no sean loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional mediante QR
    - [Telegram](/es/channels/telegram): token del bot
    - [Discord](/es/channels/discord): token del bot
    - [Google Chat](/es/channels/googlechat): JSON de la cuenta de servicio + audiencia del webhook
    - [Mattermost](/es/channels/mattermost): token del bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de la cuenta
    - [iMessage](/es/channels/imessage): ruta de la CLI `imsg` + acceso a la base de datos de Messages; use un contenedor SSH cuando el Gateway se ejecute fuera de un Mac
    - Seguridad de los mensajes directos: el valor predeterminado es el emparejamiento. El primer mensaje directo envía un código; apruébelo mediante
      `openclaw pairing approve <channel> <code>` o use listas de permitidos.
  </Step>
  <Step title="Búsqueda web">
    - Elija un proveedor (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) u omita este paso.
    - Omita este paso con `--skip-search`; vuelva a configurarlo más tarde con `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del demonio">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz gráfica, use un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario de systemd
      - El asistente intenta ejecutar `loginctl enable-linger <user>` para que el Gateway siga activo después de cerrar la sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero, tarea programada
      - Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta de inicio e inicia el Gateway inmediatamente.
      - Las tareas programadas siguen siendo la opción preferida porque proporcionan un mejor estado del supervisor.
    - Selección del entorno de ejecución: Node es obligatorio porque el almacén de estado canónico del entorno de ejecución de OpenClaw utiliza `node:sqlite`.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - `openclaw status --deep` añade el sondeo de estado del Gateway activo a la salida de estado, incluidos los sondeos de canales cuando sean compatibles.

  </Step>
  <Step title="Skills">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Permite elegir el gestor de Node: npm, pnpm o bun.
    - Instala dependencias opcionales para las Skills incluidas de confianza cuando está disponible el
      instalador requerido.
    - Omite los instaladores de Homebrew, uv y Go que no estén disponibles y, a continuación, agrupa las
      Skills afectadas con instrucciones para la configuración manual. Ejecute `openclaw doctor` después de instalar
      los requisitos previos que falten.

  </Step>
  <Step title="Finalización">
    - Resumen y próximos pasos, incluidas las opciones de aplicaciones para iOS, Android y macOS.

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

- URL del Gateway remoto (`ws://...` o `wss://...`)
- Token, contraseña o ausencia de autenticación, según la configuración del Gateway remoto

<Steps>
  <Step title="Descubrimiento (opcional)">
    Si `dns-sd` (macOS) o `avahi-browse` (Linux) está disponible, la incorporación
    ofrece buscar anuncios de Gateways Bonjour/mDNS antes de recurrir a
    la introducción manual de la URL. También se intenta el descubrimiento DNS-SD de área amplia cuando
    está configurado. Documentación: [Descubrimiento de Gateways](/es/gateway/discovery), [Bonjour](/es/gateway/bonjour).
  </Step>
  <Step title="Método de conexión">
    Cuando se selecciona un anuncio, elija WebSocket directo o un túnel SSH:
    - **Directo**: se conecta mediante `wss://` y solicita confiar en la huella digital TLS descubierta
      (fijación basada en la confianza en el primer uso; solo se fija si se acepta).
    - **Túnel SSH**: muestra un comando `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      que debe ejecutarse primero y, a continuación, se conecta al endpoint local del túnel.
  </Step>
  <Step title="Autenticación">
    Elija token (recomendado), contraseña o ninguna autenticación y, a continuación, almacénelo opcionalmente
    como SecretRef en lugar de texto sin formato.
  </Step>
</Steps>

<Note>
Si el Gateway solo acepta conexiones loopback y no puede detectarse, use manualmente un túnel SSH o una tailnet.
Se acepta `ws://` en texto sin formato para loopback, literales de IP privadas, `.local` y URL `*.ts.net` de Tailnet; otros nombres DNS privados requieren `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Opciones de autenticación y modelos

Si un paso de configuración de un proveedor falla durante la incorporación interactiva (por ejemplo, una opción de reutilización de la CLI
sin un inicio de sesión local), el asistente muestra el error y vuelve al selector de proveedores
en lugar de salir. Las ejecuciones explícitas de `--auth-choice` siguen fallando inmediatamente para la automatización.

<AccordionGroup>
  <Accordion title="Clave de API de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave y, a continuación, la guarda para que la use el demonio.
  </Accordion>
  <Accordion title="CLI de Anthropic Claude">
    Ruta local preferida en la incorporación o configuración interactiva; reutiliza un inicio de sesión existente de la CLI de Claude cuando está disponible.
  </Accordion>
  <Accordion title="Suscripción a OpenAI Code (OAuth)">
    Flujo mediante navegador; pegue `code#state`.

    En una configuración nueva sin un modelo principal, establece `agents.defaults.model` en
    `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.

  </Accordion>
  <Accordion title="Suscripción a OpenAI Code (emparejamiento de dispositivos)">
    Flujo de emparejamiento mediante navegador con un código de dispositivo de corta duración.

    En una configuración nueva sin un modelo principal, establece `agents.defaults.model` en
    `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.

  </Accordion>
  <Accordion title="Clave de API de OpenAI">
    Usa `OPENAI_API_KEY` si está presente o solicita una clave y, a continuación, almacena la credencial en los perfiles de autenticación.

    En una configuración nueva sin un modelo principal, establece `agents.defaults.model` en
    `openai/gpt-5.6`; el identificador de modelo de API directa sin prefijo se resuelve en el nivel Sol.

    Añadir o volver a autenticar OpenAI conserva un modelo principal explícito
    existente, incluido `openai/gpt-5.5`. Si la cuenta no ofrece GPT-5.6,
    seleccione `openai/gpt-5.5` explícitamente; OpenClaw no lo sustituye silenciosamente por un modelo inferior.

  </Accordion>
  <Accordion title="OAuth de xAI (Grok)">
    Inicio de sesión en el navegador para cuentas aptas de SuperGrok o X Premium. Esta es la
    vía de xAI recomendada para la mayoría de los usuarios. OpenClaw almacena el perfil de
    autenticación resultante para los modelos Grok, Grok `web_search`, `x_search` y `code_execution`.
  </Accordion>
  <Accordion title="Código de dispositivo de xAI (Grok)">
    Inicio de sesión en el navegador apto para entornos remotos mediante un código corto en lugar de una
    devolución de llamada a localhost. Se utiliza desde hosts SSH, Docker o VPS.
  </Accordion>
  <Accordion title="Clave de API de xAI (Grok)">
    Solicita `XAI_API_KEY` y configura xAI como proveedor de modelos. Se utiliza
    cuando se desea una clave de API de xAI Console en lugar de OAuth de suscripción.
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
    Más detalles: [Vercel AI Gateway](/es/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita el ID de cuenta, el ID del gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuración se escribe automáticamente. El valor predeterminado alojado es `MiniMax-M3`; la configuración mediante clave de API utiliza
    `minimax/...` y la configuración mediante OAuth utiliza `minimax-portal/...`.
    Más detalles: [MiniMax](/es/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    Actualmente, la opción estándar incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    Más detalles: [StepFun](/es/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Más detalles: [Synthetic](/es/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abiertos locales y en la nube)">
    Primero solicita `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` utiliza `OLLAMA_API_KEY` con `https://ollama.com`.
    Los modos respaldados por un host solicitan la URL base (valor predeterminado: `http://127.0.0.1:11434`), detectan los modelos disponibles y sugieren valores predeterminados.
    `Cloud + Local` también comprueba si se ha iniciado sesión en ese host de Ollama para acceder a la nube.
    Más detalles: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con endpoints compatibles con OpenAI, OpenAI Responses y Anthropic.

    La incorporación interactiva admite las mismas opciones de almacenamiento de claves de API que otros flujos de claves de API de proveedores:
    - **Pegar la clave de API ahora** (texto sin formato)
    - **Usar referencia de secreto** (referencia de entorno o referencia de proveedor configurada, con validación preliminar)

    La incorporación infiere la compatibilidad con imágenes para los identificadores habituales de modelos de visión (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral y similares) y solo pregunta cuando se desconoce el nombre del modelo.

    Indicadores no interactivos:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcional; valor predeterminado: `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcional; sustituye la capacidad de entrada del modelo inferida)

  </Accordion>
  <Accordion title="Omitir">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Seleccione el modelo predeterminado entre las opciones detectadas o introduzca manualmente el proveedor y el modelo.
- Cuando la incorporación comienza a partir de una opción de autenticación de proveedor, el selector de modelos prioriza
  automáticamente ese proveedor. Para Volcengine y BytePlus, la misma preferencia
  también coincide con sus variantes de planes de programación (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro de proveedor preferido no produjera resultados, el selector recurre
  al catálogo completo en lugar de no mostrar ningún modelo.
- El asistente ejecuta una comprobación del modelo y muestra una advertencia si el modelo configurado es desconocido o carece de autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (claves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación de OAuth heredado: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- El comportamiento predeterminado de la incorporación conserva las claves de API como valores de texto sin formato en los perfiles de autenticación.
- `--secret-input-mode ref` habilita el modo de referencia en lugar de almacenar las claves en texto sin formato.
  En la configuración interactiva, se puede elegir entre:
  - referencia de variable de entorno (por ejemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia de proveedor configurada (`file` o `exec`) con alias e ID del proveedor
- El modo de referencia interactivo ejecuta una validación preliminar rápida antes de guardar.
  - Referencias de entorno: valida el nombre de la variable y que su valor no esté vacío en el entorno de incorporación actual.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el ID solicitado.
  - Si la validación preliminar falla, la incorporación muestra el error y permite volver a intentarlo.
- En el modo no interactivo, `--secret-input-mode ref` solo admite el respaldo mediante el entorno.
  - Defina la variable de entorno del proveedor en el entorno del proceso de incorporación.
  - Los indicadores de clave en línea (por ejemplo, `--openai-api-key`) requieren que esa variable de entorno esté definida; de lo contrario, la incorporación falla de inmediato.
  - Para los proveedores personalizados, el modo no interactivo `ref` almacena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que `CUSTOM_API_KEY` esté definido; de lo contrario, la incorporación falla de inmediato.
- Las credenciales de autenticación del Gateway admiten las opciones de texto sin formato y SecretRef en la configuración interactiva:
  - Modo de token: **Generar/almacenar token en texto sin formato** (valor predeterminado) o **Usar SecretRef**.
  - Modo de contraseña: texto sin formato o SecretRef.
- Ruta no interactiva para el SecretRef del token: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes en texto sin formato siguen funcionando sin cambios.

<Note>
Consejo para servidores y entornos sin interfaz gráfica: complete OAuth en un equipo con navegador y, a continuación, copie
el `auth-profiles.json` de ese agente (por ejemplo,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` o la ruta de
`$OPENCLAW_STATE_DIR/...` correspondiente) al host del Gateway. `credentials/oauth.json`
es únicamente una fuente de importación heredada.
</Note>

## Resultados y funcionamiento interno

Campos habituales en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se proporciona `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (la incorporación local utiliza de forma predeterminada `"coding"` cuando no está definido; se conservan los valores explícitos existentes)
- `gateway.*` (modo, enlace, autenticación, Tailscale)
- `session.dmScope` (la incorporación conserva los valores explícitos y, de lo contrario, lo deja sin definir, por lo que el valor predeterminado de `main` mantiene todos los mensajes directos de todos los canales en la sesión principal continua del agente, el valor predeterminado para agentes personales. Para bandejas de entrada compartidas o multiusuario, utilice `per-channel-peer`; `openclaw security audit` recomienda el aislamiento cuando detecta tráfico de mensajes directos multiusuario)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Discord, iMessage, Signal, Slack, Telegram, WhatsApp) cuando se habilitan durante las solicitudes; Discord y Slack también convierten los nombres introducidos en ID
- `skills.install.nodeManager`
  - El indicador `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual todavía puede establecer `skills.install.nodeManager: "yarn"` posteriormente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` escribe `agents.list[]` y el valor opcional `bindings`.

Las credenciales de WhatsApp se guardan en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones activas y las transcripciones se almacenan en
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. El directorio
`~/.openclaw/agents/<agentId>/sessions/` se utiliza para las entradas de migración
heredadas y los artefactos de archivo o soporte.

<Note>
Algunos canales se distribuyen como plugins. Cuando se seleccionan durante la configuración, el asistente
solicita instalar el plugin (npm o ruta local) antes de configurar el canal.
</Note>

### Recomendaciones de aplicaciones instaladas

Después de que la comprobación de acceso al modelo se complete correctamente, la incorporación interactiva clásica en macOS examina los nombres de las aplicaciones y los ID de los paquetes sin solicitar permisos de privacidad de macOS. Busca en los catálogos oficiales de plugins y en ClawHub y, a continuación, solicita al modelo configurado que descarte coincidencias de nombres falsas y recomiende plugins o Skills pertinentes. Las coincidencias recomendadas se seleccionan de forma predeterminada; las coincidencias opcionales requieren una selección explícita.

La pantalla de resultados enumera las aplicaciones detectadas y muestra: «Los nombres de las aplicaciones se asociaron mediante el modelo configurado y la búsqueda de ClawHub». Defina `wizard.appRecommendations` como `false` para deshabilitar tanto este paso de incorporación como el acceso del Gateway a los inventarios de aplicaciones del Node. El análisis no se utiliza en el inicio rápido ni en la incorporación fuera de macOS.

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

Los clientes (la aplicación para macOS y la interfaz de control) pueden representar los pasos sin volver a implementar la lógica de incorporación.

## Comportamiento de la configuración de Signal

- Descarga el recurso de versión adecuado de las versiones de GitHub oficiales de `signal-cli` (compilación nativa, solo Linux x86-64)
- En otras plataformas (macOS y Linux no x64), realiza la instalación mediante Homebrew
- Almacena la instalación del recurso de versión en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Windows nativo aún no es compatible; ejecute la incorporación dentro de WSL2 para obtener la ruta de instalación de Linux

## Documentación relacionada

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Automatización y scripts: [Automatización de la CLI](/es/start/wizard-cli-automation)
- Referencia del comando: [`openclaw onboard`](/es/cli/onboard)
