---
read_when:
    - Necesitas el comportamiento detallado de `openclaw onboard`
    - Estás depurando los resultados de incorporación o integrando clientes de incorporación
sidebarTitle: CLI reference
summary: Referencia completa del flujo de configuración de la CLI, la configuración de autenticación/modelo, las salidas y los componentes internos
title: Referencia de configuración de la CLI
x-i18n:
    generated_at: "2026-04-23T05:20:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Referencia de configuración de la CLI

Esta página es la referencia completa de `openclaw onboard`.
Para la guía breve, consulta [Incorporación (CLI)](/es/start/wizard).

## Qué hace el asistente

El modo local (predeterminado) te guía por:

- Configuración de modelo y autenticación (OAuth de suscripción a OpenAI Code, Anthropic Claude CLI o clave API, además de opciones de MiniMax, GLM, Ollama, Moonshot, StepFun y AI Gateway)
- Ubicación del espacio de trabajo y archivos de arranque
- Configuración de Gateway (puerto, bind, autenticación, Tailscale)
- Canales y proveedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles y otros plugins de canales incluidos)
- Instalación como daemon (LaunchAgent, unidad de usuario systemd o Scheduled Task nativa de Windows con alternativa de carpeta Startup)
- Comprobación de estado
- Configuración de Skills

El modo remoto configura esta máquina para conectarse a un gateway en otro lugar.
No instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige Conservar, Modificar o Restablecer.
    - Volver a ejecutar el asistente no borra nada a menos que elijas explícitamente Restablecer (o pases `--reset`).
    - `--reset` en la CLI usa por defecto `config+creds+sessions`; usa `--reset-scope full` para eliminar también el espacio de trabajo.
    - Si la configuración es inválida o contiene claves heredadas, el asistente se detiene y te pide ejecutar `openclaw doctor` antes de continuar.
    - El restablecimiento usa `trash` y ofrece alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)
  </Step>
  <Step title="Modelo y autenticación">
    - La matriz completa de opciones está en [Opciones de autenticación y modelo](#auth-and-model-options).
  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado `~/.openclaw/workspace` (configurable).
    - Genera los archivos de espacio de trabajo necesarios para el ritual de arranque de la primera ejecución.
    - Diseño del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Pide puerto, bind, modo de autenticación y exposición por Tailscale.
    - Recomendación: mantener habilitada la autenticación por token incluso para loopback local para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto sin formato** (predeterminado)
      - **Usar SecretRef** (opt-in)
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto sin formato o SecretRef.
    - Ruta no interactiva de SecretRef para token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No se puede combinar con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en cada proceso local.
    - Los bind no loopback siguen requiriendo autenticación.
  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión por QR opcional
    - [Telegram](/es/channels/telegram): token de bot
    - [Discord](/es/channels/discord): token de bot
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de Webhook
    - [Mattermost](/es/channels/mattermost): token de bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta
    - [BlueBubbles](/es/channels/bluebubbles): recomendado para iMessage; URL del servidor + contraseña + Webhook
    - [iMessage](/es/channels/imessage): ruta heredada de CLI `imsg` + acceso a la base de datos
    - Seguridad de DM: el valor predeterminado es emparejamiento. El primer DM envía un código; apruébalo con
      `openclaw pairing approve <channel> <code>` o usa listas de permitidos.
  </Step>
  <Step title="Instalación como daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario con inicio de sesión; para modo headless, usa un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario systemd
      - El asistente intenta `loginctl enable-linger <user>` para que el gateway siga activo después de cerrar sesión.
      - Puede pedir sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: Scheduled Task primero
      - Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta Startup y arranca el gateway inmediatamente.
      - Las Scheduled Task siguen siendo preferibles porque proporcionan mejor estado del supervisor.
    - Selección de runtime: Node (recomendado; obligatorio para WhatsApp y Telegram). Bun no es recomendable.
  </Step>
  <Step title="Comprobación de estado">
    - Inicia Gateway (si es necesario) y ejecuta `openclaw health`.
    - `openclaw status --deep` agrega la sonda live de estado de Gateway a la salida de estado, incluidas sondas de canales cuando son compatibles.
  </Step>
  <Step title="Skills">
    - Lee las Skills disponibles y verifica los requisitos.
    - Te permite elegir el gestor de Node: npm, pnpm o bun.
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).
  </Step>
  <Step title="Finalizar">
    - Resumen y pasos siguientes, incluidas opciones de apps para iOS, Android y macOS.
  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, el asistente imprime instrucciones de reenvío de puertos SSH para la Control UI en lugar de abrir un navegador.
Si faltan recursos de la Control UI, el asistente intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de UI).
</Note>

## Detalles del modo remoto

El modo remoto configura esta máquina para conectarse a un gateway en otro lugar.

<Info>
El modo remoto no instala ni modifica nada en el host remoto.
</Info>

Qué configuras:

- URL del gateway remoto (`ws://...`)
- Token si el gateway remoto requiere autenticación (recomendado)

<Note>
- Si el gateway es solo loopback local, usa túnel SSH o una tailnet.
- Sugerencias de detección:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opciones de autenticación y modelo

<AccordionGroup>
  <Accordion title="Clave API de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, y luego la guarda para uso del daemon.
  </Accordion>
  <Accordion title="Suscripción a OpenAI Code (OAuth)">
    Flujo en navegador; pega `code#state`.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.4` cuando el modelo no está configurado o es `openai/*`.

  </Accordion>
  <Accordion title="Suscripción a OpenAI Code (emparejamiento de dispositivo)">
    Flujo de emparejamiento en navegador con un código de dispositivo de corta duración.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.4` cuando el modelo no está configurado o es `openai/*`.

  </Accordion>
  <Accordion title="Clave API de OpenAI">
    Usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego almacena la credencial en los perfiles de autenticación.

    Establece `agents.defaults.model` en `openai/gpt-5.4` cuando el modelo no está configurado, es `openai/*` o `openai-codex/*`.

  </Accordion>
  <Accordion title="Clave API de xAI (Grok)">
    Solicita `XAI_API_KEY` y configura xAI como proveedor de modelos.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) y te permite elegir el catálogo Zen o Go.
    URL de configuración: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clave API (genérica)">
    Almacena la clave por ti.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Más detalles: [Vercel AI Gateway](/es/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita el ID de cuenta, el ID de gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuración se escribe automáticamente. El valor alojado predeterminado es `MiniMax-M2.7`; la configuración con clave API usa
    `minimax/...`, y la configuración con OAuth usa `minimax-portal/...`.
    Más detalles: [MiniMax](/es/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    Actualmente, Standard incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    Más detalles: [StepFun](/es/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Más detalles: [Synthetic](/es/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud y modelos abiertos locales)">
    Primero solicita `Cloud + Local`, `Solo Cloud` o `Solo local`.
    `Solo Cloud` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Los modos respaldados por host solicitan URL base (predeterminada `http://127.0.0.1:11434`), detectan los modelos disponibles y sugieren valores predeterminados.
    `Cloud + Local` también comprueba si ese host de Ollama ha iniciado sesión para acceso a cloud.
    Más detalles: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con endpoints compatibles con OpenAI y compatibles con Anthropic.

    La incorporación interactiva admite las mismas opciones de almacenamiento de clave API que otros flujos de clave API de proveedor:
    - **Pegar la clave API ahora** (texto sin formato)
    - **Usar referencia de secreto** (referencia de entorno o referencia de proveedor configurado, con validación previa)

    Marcas no interactivas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; usa `CUSTOM_API_KEY` como alternativa)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; valor predeterminado `openai`)

  </Accordion>
  <Accordion title="Omitir">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Elige el modelo predeterminado entre las opciones detectadas, o introduce proveedor y modelo manualmente.
- Cuando la incorporación comienza desde una opción de autenticación de proveedor, el selector de modelos prioriza
  automáticamente ese proveedor. Para Volcengine y BytePlus, la misma preferencia
  también coincide con sus variantes de plan de codificación (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro de proveedor preferido quedara vacío, el selector vuelve al
  catálogo completo en lugar de no mostrar modelos.
- El asistente ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o falta autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (claves API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación heredada de OAuth: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- El comportamiento predeterminado de la incorporación persiste las claves API como valores en texto sin formato en los perfiles de autenticación.
- `--secret-input-mode ref` habilita el modo de referencia en lugar del almacenamiento de claves en texto sin formato.
  En la configuración interactiva, puedes elegir:
  - referencia de variable de entorno (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia de proveedor configurado (`file` o `exec`) con alias de proveedor + id
- El modo de referencia interactivo ejecuta una validación previa rápida antes de guardar.
  - Referencias de entorno: valida el nombre de la variable + valor no vacío en el entorno actual de incorporación.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el id solicitado.
  - Si la validación previa falla, la incorporación muestra el error y te permite reintentar.
- En modo no interactivo, `--secret-input-mode ref` usa solo referencias respaldadas por entorno.
  - Configura la variable de entorno del proveedor en el entorno del proceso de incorporación.
  - Las marcas de clave en línea (por ejemplo `--openai-api-key`) requieren que esa variable de entorno esté configurada; de lo contrario, la incorporación falla inmediatamente.
  - Para proveedores personalizados, el modo no interactivo `ref` almacena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que `CUSTOM_API_KEY` esté configurada; de lo contrario, la incorporación falla inmediatamente.
- Las credenciales de autenticación de Gateway admiten opciones de texto sin formato y SecretRef en la configuración interactiva:
  - Modo token: **Generar/almacenar token en texto sin formato** (predeterminado) o **Usar SecretRef**.
  - Modo contraseña: texto sin formato o SecretRef.
- Ruta no interactiva de SecretRef para token: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes en texto sin formato siguen funcionando sin cambios.

<Note>
Consejo para servidores y modo headless: completa OAuth en una máquina con navegador y luego copia
el `auth-profiles.json` de ese agente (por ejemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
`$OPENCLAW_STATE_DIR/...`) al host del gateway. `credentials/oauth.json`
es solo una fuente heredada de importación.
</Note>

## Salidas y componentes internos

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (la incorporación local usa por defecto `"coding"` cuando no está configurado; los valores explícitos existentes se conservan)
- `gateway.*` (modo, bind, autenticación, Tailscale)
- `session.dmScope` (la incorporación local usa por defecto `per-channel-peer` cuando no está configurado; los valores explícitos existentes se conservan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Slack, Discord, Matrix, Microsoft Teams) cuando optas por ellas durante los prompts (los nombres se resuelven a ID cuando es posible)
- `skills.install.nodeManager`
  - La marca `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede establecer más adelante `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp se guardan en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Algunos canales se distribuyen como plugins. Cuando se seleccionan durante la configuración, el asistente
solicita instalar el plugin (npm o ruta local) antes de la configuración del canal.
</Note>

RPC del asistente de Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Los clientes (app de macOS y Control UI) pueden representar pasos sin volver a implementar la lógica de incorporación.

Comportamiento de configuración de Signal:

- Descarga el recurso de versión apropiado
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Las compilaciones JVM requieren Java 21
- Las compilaciones nativas se usan cuando están disponibles
- Windows usa WSL2 y sigue el flujo de `signal-cli` de Linux dentro de WSL

## Documentos relacionados

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Automatización y scripts: [Automatización de CLI](/es/start/wizard-cli-automation)
- Referencia de comandos: [`openclaw onboard`](/cli/onboard)
