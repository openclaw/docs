---
read_when:
    - Necesitas el comportamiento detallado de openclaw onboard
    - Está depurando resultados de incorporación o integrando clientes de incorporación
sidebarTitle: CLI reference
summary: Referencia completa para el flujo de configuración de la CLI, la configuración de autenticación/modelo, las salidas y los aspectos internos
title: Referencia de configuración de la CLI
x-i18n:
    generated_at: "2026-04-30T06:02:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Esta página es la referencia completa de `openclaw onboard`.
Para la guía breve, consulta [Onboarding (CLI)](/es/start/wizard).

## Qué hace el asistente

El modo local (predeterminado) te guía por:

- Configuración de modelo y autenticación (OAuth de suscripción OpenAI Code, Anthropic Claude CLI o clave de API, además de opciones de MiniMax, GLM, Ollama, Moonshot, StepFun y AI Gateway)
- Ubicación del espacio de trabajo y archivos de arranque
- Configuración del Gateway (puerto, enlace, autenticación, Tailscale)
- Canales y proveedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles y otros plugins de canal incluidos)
- Instalación del daemon (LaunchAgent, unidad de usuario systemd o tarea programada nativa de Windows con alternativa de carpeta de inicio)
- Comprobación de estado
- Configuración de Skills

El modo remoto configura esta máquina para conectarse a un gateway en otro lugar.
No instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige Conservar, Modificar o Restablecer.
    - Volver a ejecutar el asistente no borra nada a menos que elijas explícitamente Restablecer (o pases `--reset`).
    - CLI `--reset` usa `config+creds+sessions` de forma predeterminada; usa `--reset-scope full` para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y te pide ejecutar `openclaw doctor` antes de continuar.
    - El restablecimiento usa `trash` y ofrece estos alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)

  </Step>
  <Step title="Modelo y autenticación">
    - La matriz completa de opciones está en [Opciones de autenticación y modelo](#auth-and-model-options).

  </Step>
  <Step title="Espacio de trabajo">
    - Predeterminado: `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del espacio de trabajo necesarios para el ritual de arranque de primera ejecución.
    - Diseño del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Solicita puerto, enlace, modo de autenticación y exposición por Tailscale.
    - Recomendado: mantén habilitada la autenticación por token incluso para loopback, de modo que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/guardar token en texto plano** (predeterminado)
      - **Usar SecretRef** (opcional)
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de onboarding.
      - No se puede combinar con `--gateway-token`.
    - Deshabilita la autenticación solo si confías plenamente en todos los procesos locales.
    - Los enlaces que no son loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión QR opcional
    - [Telegram](/es/channels/telegram): token de bot
    - [Discord](/es/channels/discord): token de bot
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de webhook
    - [Mattermost](/es/channels/mattermost): token de bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta
    - [BlueBubbles](/es/channels/bluebubbles): recomendado para iMessage; URL del servidor + contraseña + Webhook
    - [iMessage](/es/channels/imessage): ruta de CLI heredada `imsg` + acceso a BD
    - Seguridad de DM: el valor predeterminado es el emparejamiento. El primer DM envía un código; apruébalo mediante
      `openclaw pairing approve <channel> <code>` o usa listas de permitidos.
  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz, usa un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario systemd
      - El asistente intenta `loginctl enable-linger <user>` para que el gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero tarea programada
      - Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta de inicio e inicia el gateway inmediatamente.
      - Las tareas programadas siguen siendo preferidas porque proporcionan mejor estado de supervisión.
    - Selección de runtime: Node (recomendado; requerido para WhatsApp y Telegram). Bun no se recomienda.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el gateway (si es necesario) y ejecuta `openclaw health`.
    - `openclaw status --deep` añade la sonda de estado del gateway en vivo a la salida de estado, incluidas las sondas de canal cuando son compatibles.

  </Step>
  <Step title="Skills">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir el gestor de node: npm, pnpm o bun.
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).

  </Step>
  <Step title="Finalizar">
    - Resumen y próximos pasos, incluidas opciones de apps para iOS, Android y macOS.

  </Step>
</Steps>

<Note>
Si no se detecta una GUI, el asistente imprime instrucciones de reenvío de puertos SSH para la UI de control en lugar de abrir un navegador.
Si faltan los recursos de la UI de control, el asistente intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la UI).
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
- Si el gateway solo usa loopback, usa túnel SSH o una tailnet.
- Pistas de descubrimiento:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opciones de autenticación y modelo

<AccordionGroup>
  <Accordion title="Clave de API de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave y luego la guarda para uso del daemon.
  </Accordion>
  <Accordion title="Suscripción OpenAI Code (OAuth)">
    Flujo de navegador; pega `code#state`.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.5` cuando el modelo no está definido o ya pertenece a la familia OpenAI.

  </Accordion>
  <Accordion title="Suscripción OpenAI Code (emparejamiento de dispositivo)">
    Flujo de emparejamiento en navegador con un código de dispositivo de corta duración.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.5` cuando el modelo no está definido o ya pertenece a la familia OpenAI.

  </Accordion>
  <Accordion title="Clave de API de OpenAI">
    Usa `OPENAI_API_KEY` si está presente o solicita una clave y luego almacena la credencial en los perfiles de autenticación.

    Establece `agents.defaults.model` en `openai/gpt-5.5` cuando el modelo no está definido, es `openai/*` o `openai-codex/*`.

  </Accordion>
  <Accordion title="Clave de API de xAI (Grok)">
    Solicita `XAI_API_KEY` y configura xAI como proveedor de modelos.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) y te permite elegir el catálogo Zen o Go.
    URL de configuración: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clave de API (genérica)">
    Guarda la clave por ti.
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
    La configuración se escribe automáticamente. El valor predeterminado alojado es `MiniMax-M2.7`; la configuración con clave de API usa
    `minimax/...`, y la configuración OAuth usa `minimax-portal/...`.
    Más detalles: [MiniMax](/es/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    Estándar actualmente incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    Más detalles: [StepFun](/es/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Más detalles: [Synthetic](/es/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abiertos locales y en la nube)">
    Primero solicita `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Los modos respaldados por host solicitan URL base (predeterminada `http://127.0.0.1:11434`), descubren modelos disponibles y sugieren valores predeterminados.
    `Cloud + Local` también comprueba si ese host de Ollama tiene sesión iniciada para acceso a la nube.
    Más detalles: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con endpoints compatibles con OpenAI y compatibles con Anthropic.

    El onboarding interactivo admite las mismas opciones de almacenamiento de clave de API que otros flujos de clave de API de proveedor:
    - **Pegar clave de API ahora** (texto plano)
    - **Usar referencia secreta** (referencia de entorno o referencia de proveedor configurado, con validación previa)

    Flags no interactivos:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; predeterminado `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcional; sobrescribe la capacidad de entrada de modelo inferida)

  </Accordion>
  <Accordion title="Omitir">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Elige el modelo predeterminado entre las opciones detectadas, o introduce proveedor y modelo manualmente.
- El onboarding de proveedor personalizado infiere compatibilidad con imágenes para IDs de modelo comunes y solo pregunta cuando se desconoce el nombre del modelo.
- Cuando el onboarding comienza desde una opción de autenticación de proveedor, el selector de modelo prefiere
  automáticamente ese proveedor. Para Volcengine y BytePlus, la misma preferencia
  también coincide con sus variantes de plan de codificación (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro de proveedor preferido quedara vacío, el selector vuelve al
  catálogo completo en lugar de no mostrar modelos.
- El asistente ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o no tiene autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (claves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación OAuth heredada: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- El comportamiento predeterminado del onboarding persiste las claves de API como valores en texto plano en los perfiles de autenticación.
- `--secret-input-mode ref` habilita el modo de referencia en lugar del almacenamiento de claves en texto plano.
  En la configuración interactiva, puedes elegir entre:
  - referencia de variable de entorno (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia de proveedor configurado (`file` o `exec`) con alias de proveedor + id
- El modo de referencia interactivo ejecuta una validación previa rápida antes de guardar.
  - Referencias de entorno: valida el nombre de variable + valor no vacío en el entorno de onboarding actual.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el id solicitado.
  - Si la validación previa falla, el onboarding muestra el error y te permite reintentar.
- En modo no interactivo, `--secret-input-mode ref` solo está respaldado por entorno.
  - Define la variable de entorno del proveedor en el entorno del proceso de onboarding.
  - Los flags de clave en línea (por ejemplo `--openai-api-key`) requieren que esa variable de entorno esté definida; de lo contrario, el onboarding falla rápidamente.
  - Para proveedores personalizados, el modo `ref` no interactivo almacena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que `CUSTOM_API_KEY` esté definida; de lo contrario, el onboarding falla rápidamente.
- Las credenciales de autenticación del Gateway admiten opciones de texto plano y SecretRef en la configuración interactiva:
  - Modo token: **Generar/guardar token en texto plano** (predeterminado) o **Usar SecretRef**.
  - Modo contraseña: texto plano o SecretRef.
- Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes en texto plano siguen funcionando sin cambios.

<Note>
Consejo para headless y servidores: completa OAuth en una máquina con navegador y, luego, copia
el `auth-profiles.json` de ese agente (por ejemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
`$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
es solo una fuente de importación heredada.
</Note>

## Salidas y detalles internos

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se pasa `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se eligió Minimax)
- `tools.profile` (la configuración inicial local usa `"coding"` de forma predeterminada cuando no está definido; se conservan los valores explícitos existentes)
- `gateway.*` (modo, enlace, autenticación, tailscale)
- `session.dmScope` (la configuración inicial local usa `per-channel-peer` de forma predeterminada cuando no está definido; se conservan los valores explícitos existentes)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Slack, Discord, Matrix, Microsoft Teams) cuando aceptas durante los avisos (los nombres se resuelven a ID cuando es posible)
- `skills.install.nodeManager`
  - La marca `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede establecer `skills.install.nodeManager: "yarn"` más adelante.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp van en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Algunos canales se entregan como plugins. Cuando se seleccionan durante la configuración, el asistente
solicita instalar el plugin (npm o ruta local) antes de la configuración del canal.
</Note>

RPC del asistente del Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Los clientes (app de macOS y Control UI) pueden renderizar los pasos sin volver a implementar la lógica de configuración inicial.

Comportamiento de configuración de Signal:

- Descarga el recurso de versión adecuado
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Las compilaciones de JVM requieren Java 21
- Las compilaciones nativas se usan cuando están disponibles
- Windows usa WSL2 y sigue el flujo de signal-cli de Linux dentro de WSL

## Documentos relacionados

- Centro de configuración inicial: [Configuración inicial (CLI)](/es/start/wizard)
- Automatización y scripts: [Automatización de CLI](/es/start/wizard-cli-automation)
- Referencia de comandos: [`openclaw onboard`](/es/cli/onboard)
