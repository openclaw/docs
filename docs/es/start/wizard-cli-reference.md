---
read_when:
    - Necesitas el comportamiento detallado de `openclaw onboard`
    - Estás depurando resultados de incorporación o integrando clientes de incorporación
sidebarTitle: CLI reference
summary: Referencia completa del flujo de configuración CLI, configuración de autenticación/modelo, salidas e internals
title: Referencia de configuración CLI
x-i18n:
    generated_at: "2026-04-24T05:51:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Esta página es la referencia completa de `openclaw onboard`.
Para la guía breve, consulta [Incorporación (CLI)](/es/start/wizard).

## Qué hace el asistente

El modo local (predeterminado) te guía por:

- Configuración de modelo y autenticación (OAuth de suscripción OpenAI Code, Anthropic Claude CLI o clave API, además de opciones de MiniMax, GLM, Ollama, Moonshot, StepFun y AI Gateway)
- Ubicación del espacio de trabajo y archivos de arranque
- Configuración de Gateway (puerto, bind, autenticación, tailscale)
- Canales y proveedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles y otros Plugins de canal incluidos)
- Instalación del daemon (LaunchAgent, unidad de usuario systemd o Scheduled Task nativa de Windows con respaldo en la carpeta Inicio)
- Comprobación de estado
- Configuración de Skills

El modo remoto configura esta máquina para conectarse a un gateway en otro lugar.
No instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige Mantener, Modificar o Restablecer.
    - Volver a ejecutar el asistente no borra nada a menos que elijas explícitamente Restablecer (o pases `--reset`).
    - La CLI `--reset` usa por defecto `config+creds+sessions`; usa `--reset-scope full` para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y te pide que ejecutes `openclaw doctor` antes de continuar.
    - Reset usa `trash` y ofrece estos alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)
  </Step>
  <Step title="Modelo y autenticación">
    - La matriz completa de opciones está en [Opciones de autenticación y modelo](#auth-and-model-options).
  </Step>
  <Step title="Espacio de trabajo">
    - Predeterminado `~/.openclaw/workspace` (configurable).
    - Siembra los archivos del espacio de trabajo necesarios para el ritual de arranque de primera ejecución.
    - Diseño del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Solicita puerto, bind, modo de autenticación y exposición por tailscale.
    - Recomendado: mantener habilitada la autenticación por token incluso para loopback para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generate/store plaintext token** (predeterminado)
      - **Use SecretRef** (opt-in)
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta no interactiva de SecretRef de token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No puede combinarse con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en todos los procesos locales.
    - Los binds que no sean loopback siguen requiriendo autenticación.
  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional mediante QR
    - [Telegram](/es/channels/telegram): token del bot
    - [Discord](/es/channels/discord): token del bot
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de webhook
    - [Mattermost](/es/channels/mattermost): token del bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta
    - [BlueBubbles](/es/channels/bluebubbles): recomendado para iMessage; URL del servidor + contraseña + webhook
    - [iMessage](/es/channels/imessage): ruta heredada de CLI `imsg` + acceso a BD
    - Seguridad de mensajes directos: el valor predeterminado es vinculación. El primer mensaje directo envía un código; apruébalo mediante
      `openclaw pairing approve <channel> <code>` o usa listas de permitidos.
  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz, usa un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario systemd
      - El asistente intenta `loginctl enable-linger <user>` para que el gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: Scheduled Task primero
      - Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio por usuario en la carpeta Inicio e inicia el gateway inmediatamente.
      - Scheduled Tasks siguen siendo preferidas porque proporcionan mejor estado del supervisor.
    - Selección de runtime: Node (recomendado; obligatorio para WhatsApp y Telegram). Bun no se recomienda.
  </Step>
  <Step title="Comprobación de estado">
    - Inicia el gateway (si hace falta) y ejecuta `openclaw health`.
    - `openclaw status --deep` añade el sondeo live de estado del gateway a la salida de estado, incluidas comprobaciones de canales cuando se admiten.
  </Step>
  <Step title="Skills">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir el gestor de node: npm, pnpm o bun.
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).
  </Step>
  <Step title="Finalizar">
    - Resumen y siguientes pasos, incluidas opciones para apps de iOS, Android y macOS.
  </Step>
</Steps>

<Note>
Si no se detecta ninguna interfaz gráfica, el asistente imprime instrucciones de redirección de puertos SSH para la interfaz de Control en lugar de abrir un navegador.
Si faltan los recursos de la interfaz de Control, el asistente intenta compilarlos; el respaldo es `pnpm ui:build` (instala automáticamente dependencias de UI).
</Note>

## Detalles del modo remoto

El modo remoto configura esta máquina para conectarse a un gateway en otro lugar.

<Info>
El modo remoto no instala ni modifica nada en el host remoto.
</Info>

Lo que configuras:

- URL del gateway remoto (`ws://...`)
- Token si el gateway remoto requiere autenticación (recomendado)

<Note>
- Si el gateway está limitado a loopback, usa tunelización SSH o una tailnet.
- Pistas de descubrimiento:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opciones de autenticación y modelo

<AccordionGroup>
  <Accordion title="Clave API de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave y luego la guarda para uso del daemon.
  </Accordion>
  <Accordion title="Suscripción OpenAI Code (OAuth)">
    Flujo de navegador; pega `code#state`.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.5` cuando el modelo no está establecido o ya pertenece a la familia OpenAI.

  </Accordion>
  <Accordion title="Suscripción OpenAI Code (vinculación de dispositivo)">
    Flujo de vinculación en navegador con un código de dispositivo de corta duración.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.5` cuando el modelo no está establecido o ya pertenece a la familia OpenAI.

  </Accordion>
  <Accordion title="Clave API de OpenAI">
    Usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego almacena la credencial en perfiles de autenticación.

    Establece `agents.defaults.model` en `openai/gpt-5.4` cuando el modelo no está establecido, es `openai/*` o `openai-codex/*`.

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
    Solicita ID de cuenta, ID de gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuración se escribe automáticamente. El valor predeterminado alojado es `MiniMax-M2.7`; la configuración con clave API usa
    `minimax/...`, y la configuración OAuth usa `minimax-portal/...`.
    Más detalles: [MiniMax](/es/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    El estándar incluye actualmente `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    Más detalles: [StepFun](/es/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Más detalles: [Synthetic](/es/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud y modelos abiertos locales)">
    Primero solicita `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Los modos respaldados por host solicitan URL base (predeterminada `http://127.0.0.1:11434`), descubren modelos disponibles y sugieren valores predeterminados.
    `Cloud + Local` también comprueba si ese host Ollama ha iniciado sesión para acceso cloud.
    Más detalles: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con endpoints compatibles con OpenAI y compatibles con Anthropic.

    La incorporación interactiva admite las mismas opciones de almacenamiento de claves API que otros flujos de clave API de proveedor:
    - **Paste API key now** (texto plano)
    - **Use secret reference** (referencia de entorno o referencia de proveedor configurado, con validación previa)

    Indicadores no interactivos:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; predeterminado `openai`)

  </Accordion>
  <Accordion title="Omitir">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Elige el modelo predeterminado entre las opciones detectadas o introduce manualmente proveedor y modelo.
- Cuando la incorporación empieza desde una opción de autenticación de proveedor, el selector de modelos prefiere
  automáticamente ese proveedor. Para Volcengine y BytePlus, la misma preferencia
  también coincide con sus variantes de plan de codificación (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro de proveedor preferido quedara vacío, el selector vuelve al catálogo completo en lugar de mostrar que no hay modelos.
- El asistente ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o le falta autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (claves API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación heredada de OAuth: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- El comportamiento predeterminado de la incorporación persiste las claves API como valores en texto plano en los perfiles de autenticación.
- `--secret-input-mode ref` habilita el modo de referencia en lugar del almacenamiento de la clave en texto plano.
  En la configuración interactiva, puedes elegir uno de estos:
  - referencia de variable de entorno (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia de proveedor configurado (`file` o `exec`) con alias de proveedor + id
- El modo interactivo de referencia ejecuta una validación rápida previa antes de guardar.
  - Referencias de entorno: valida el nombre de la variable y que tenga un valor no vacío en el entorno actual de incorporación.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el id solicitado.
  - Si la validación previa falla, la incorporación muestra el error y te permite reintentar.
- En modo no interactivo, `--secret-input-mode ref` solo está respaldado por entorno.
  - Establece la variable de entorno del proveedor en el entorno del proceso de incorporación.
  - Los indicadores de clave en línea (por ejemplo `--openai-api-key`) requieren que esa variable de entorno esté establecida; de lo contrario, la incorporación falla rápidamente.
  - Para proveedores personalizados, el modo no interactivo `ref` almacena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que `CUSTOM_API_KEY` esté establecido; de lo contrario, la incorporación falla rápidamente.
- Las credenciales de autenticación del Gateway admiten opciones de texto plano y SecretRef en la configuración interactiva:
  - Modo token: **Generate/store plaintext token** (predeterminado) o **Use SecretRef**.
  - Modo contraseña: texto plano o SecretRef.
- Ruta no interactiva de SecretRef de token: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes en texto plano siguen funcionando sin cambios.

<Note>
Consejo para entornos sin interfaz y servidores: completa OAuth en una máquina con navegador y luego copia
el `auth-profiles.json` de ese agente (por ejemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta equivalente
`$OPENCLAW_STATE_DIR/...`) al host del gateway. `credentials/oauth.json`
es solo una fuente heredada de importación.
</Note>

## Salidas e internals

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se elige MiniMax)
- `tools.profile` (la incorporación local usa por defecto `"coding"` cuando no está establecido; los valores explícitos existentes se conservan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (la incorporación local usa por defecto `per-channel-peer` cuando no está establecido; los valores explícitos existentes se conservan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Slack, Discord, Matrix, Microsoft Teams) cuando optas por ellas durante los prompts (los nombres se resuelven a ID cuando es posible)
- `skills.install.nodeManager`
  - El indicador `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede establecer después `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp van en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Algunos canales se distribuyen como Plugins. Cuando se seleccionan durante la configuración, el asistente
solicita instalar el Plugin (npm o ruta local) antes de la configuración del canal.
</Note>

RPC del asistente de Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Los clientes (app de macOS e interfaz de Control) pueden renderizar los pasos sin reimplementar la lógica de incorporación.

Comportamiento de configuración de Signal:

- Descarga el recurso de lanzamiento apropiado
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Las compilaciones JVM requieren Java 21
- Se usan compilaciones nativas cuando están disponibles
- Windows usa WSL2 y sigue el flujo Linux de signal-cli dentro de WSL

## Documentación relacionada

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Automatización y scripts: [Automatización CLI](/es/start/wizard-cli-automation)
- Referencia de comandos: [`openclaw onboard`](/es/cli/onboard)
