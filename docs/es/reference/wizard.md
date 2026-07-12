---
read_when:
    - Buscar un paso o indicador específico de incorporación
    - Automatización de la incorporación con el modo no interactivo
    - Depuración del comportamiento de incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa para la incorporación mediante la CLI: cada paso, opción y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-07-12T14:51:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39155617d74a4004e9474c9d0ede231a6ccd4cb31becc07f25bcd9306b6a6675
    source_path: reference/wizard.md
    workflow: 16
---

Esta es la referencia completa de `openclaw onboard`.
Para obtener una descripción general, consulte [Incorporación (CLI)](/es/start/wizard). Para conocer el comportamiento y los resultados
paso a paso, consulte [Referencia de configuración de la CLI](/es/start/wizard-cli-reference).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Restablecimiento (opcional)">
    - `--reset` restablece el estado antes de ejecutar la configuración; sin esta opción, volver a ejecutar la incorporación
      conserva la configuración existente y la reutiliza como valores predeterminados.
    - `--reset-scope` controla lo que elimina `--reset`: `config` (solo el archivo de
      configuración), `config+creds+sessions` (valor predeterminado) o `full` (también elimina el
      espacio de trabajo).
    - Si el archivo de configuración no es válido, la incorporación se detiene e indica que primero se debe ejecutar
      `openclaw doctor` y, después, volver a ejecutar la configuración.
    - El restablecimiento mueve el estado a la Papelera (nunca lo elimina directamente).

  </Step>
  <Step title="Reconocimiento de riesgos">
    - La primera ejecución (o cualquier ejecución antes de establecer `wizard.securityAcknowledgedAt`)
      solicita confirmar que se comprende que los agentes son potentes y que el acceso completo
      al sistema conlleva riesgos.
    - `--non-interactive` requiere `--accept-risk` de forma explícita; sin esta opción,
      la incorporación termina con un error en lugar de solicitar confirmación.
    - Las ejecuciones interactivas muestran una solicitud de confirmación en lugar de usar la opción; rechazarla
      cancela la configuración.

  </Step>
  <Step title="Modelo/autenticación">
    - **Clave de API de Anthropic**: utiliza `ANTHROPIC_API_KEY` si está presente o solicita una clave y, después, la guarda para que la use el daemon.
    - **CLI de Anthropic Claude**: ruta local preferida cuando ya existe un inicio de sesión en la CLI de Claude; OpenClaw también admite la autenticación mediante token de configuración de Anthropic como alternativa.
    - **Suscripción a OpenAI Code (Codex) (OAuth)**: flujo en el navegador; pegue el `code#state`.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.
    - **Suscripción a OpenAI Code (Codex) (vinculación de dispositivo)**: flujo de vinculación en el navegador con un código de dispositivo de corta duración.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.
    - **Clave de API de OpenAI**: utiliza `OPENAI_API_KEY` si está presente o solicita una clave y, después, la almacena en los perfiles de autenticación.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6`; el identificador simple del modelo de API directa se resuelve al nivel Sol.
    - Añadir o volver a autenticar OpenAI conserva cualquier modelo principal explícito existente, incluido `openai/gpt-5.5`. Si la cuenta no ofrece GPT-5.6, seleccione `openai/gpt-5.5` explícitamente; OpenClaw no cambia silenciosamente a un modelo inferior.
    - **OAuth de xAI**: inicio de sesión en el navegador mediante código de dispositivo sin necesidad de una devolución de llamada en localhost, por lo que también funciona mediante SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Clave de API de xAI**: solicita `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` continúa funcionando como alias de compatibilidad exclusivamente manual para el mismo flujo OAuth de xAI mediante código de dispositivo; use `xai-oauth` en scripts nuevos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, disponible en https://opencode.ai/auth) y permite elegir el catálogo Zen o Go.
    - **Ollama**: primero ofrece **Nube + local**, **Solo nube** o **Solo local**. `Cloud only` solicita `OLLAMA_API_KEY` y utiliza `https://ollama.com`; los modos respaldados por un host solicitan la URL base de Ollama (valor predeterminado `http://127.0.0.1:11434`), detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado cuando es necesario; `Cloud + Local` también comprueba si se ha iniciado sesión en ese host de Ollama para acceder a la nube.
    - Más información: [Ollama](/es/providers/ollama)
    - **Clave de API**: almacena la clave.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más información: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita el identificador de cuenta, el identificador del Gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más información: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor predeterminado alojado es `MiniMax-M3`.
      La configuración mediante clave de API utiliza `minimax/...` y la configuración mediante OAuth utiliza
      `minimax-portal/...`.
    - Más información: [MiniMax](/es/providers/minimax)
    - **StepFun**: la configuración se escribe automáticamente para StepFun estándar o Step Plan en los endpoints de China o globales.
    - La opción estándar utiliza actualmente `step-3.5-flash` de forma predeterminada; Step Plan también incluye `step-3.5-flash-2603`.
    - Más información: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más información: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más información: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Proveedor personalizado**: funciona con endpoints compatibles con OpenAI, OpenAI Responses o Anthropic. Opciones no interactivas: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`), `--custom-provider-id` (opcional; se deriva automáticamente de la URL base), `--custom-compatibility openai|openai-responses|anthropic` (valor predeterminado `openai`), `--custom-image-input` / `--custom-text-input` (sustituyen la detección inferida de modelos de visión).
    - **Omitir**: todavía no se configura ninguna autenticación.
    - Seleccione un modelo predeterminado entre las opciones detectadas (o introduzca manualmente el proveedor/modelo). Para obtener la mejor calidad y reducir el riesgo de inyección de instrucciones, elija el modelo de última generación más potente disponible en su conjunto de proveedores.
    - La incorporación ejecuta una comprobación del modelo y muestra una advertencia si el modelo configurado es desconocido o no dispone de autenticación.
    - El modo de almacenamiento de claves de API utiliza de forma predeterminada valores de perfil de autenticación en texto sin formato. Use `--secret-input-mode ref` para almacenar en su lugar referencias respaldadas por variables de entorno (por ejemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); la variable de entorno referenciada ya debe estar definida o la incorporación falla de inmediato.
    - Los perfiles de autenticación se encuentran en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves de API + OAuth). `~/.openclaw/credentials/oauth.json` solo se utiliza para importar formatos heredados.
    - Más información: [OAuth](/es/concepts/oauth)
    <Note>
    Consejo para entornos sin interfaz gráfica/servidores: complete OAuth en una máquina con navegador y, después, copie
    el archivo `auth-profiles.json` de ese agente (por ejemplo,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` o la ruta correspondiente
    de `$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
    solo es una fuente de importación heredada.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado: `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del espacio de trabajo necesarios para el ritual de arranque del agente.
    - Diseño completo del espacio de trabajo y guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Puerto (valor predeterminado: **18789**), enlace, modo de autenticación y exposición mediante Tailscale.
    - Recomendación de autenticación: mantenga **Token** incluso para la interfaz de bucle invertido, de modo que los clientes WS locales deban autenticarse.
    - En el modo de token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto sin formato** (valor predeterminado)
      - **Usar SecretRef** (opcional)
      - El inicio rápido reutiliza los SecretRef existentes de `gateway.auth.token` en los proveedores `env`, `file` y `exec` para la comprobación de incorporación y el arranque del panel.
      - Si ese SecretRef está configurado pero no puede resolverse, la incorporación falla de forma anticipada con un mensaje claro para corregirlo, en lugar de degradar silenciosamente la autenticación del entorno de ejecución.
    - En el modo de contraseña, la configuración interactiva también permite el almacenamiento en texto sin formato o mediante SecretRef.
    - Ruta no interactiva para SecretRef del token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No puede combinarse con `--gateway-token`.
    - Desactive la autenticación únicamente si confía plenamente en todos los procesos locales.
    - Los enlaces que no sean de bucle invertido siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional mediante código QR.
    - [Telegram](/es/channels/telegram): token del bot.
    - [Discord](/es/channels/discord): token del bot.
    - [Google Chat](/es/channels/googlechat): JSON de la cuenta de servicio + audiencia del webhook.
    - [Mattermost](/es/channels/mattermost) (plugin): token del bot + URL base.
    - [Signal](/es/channels/signal) (plugin): instalación opcional de `signal-cli` + configuración de la cuenta.
    - [iMessage](/es/channels/imessage): ruta de la CLI `imsg` + acceso a la base de datos de Messages; use un contenedor SSH cuando el Gateway se ejecute fuera de un Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack y otros canales se distribuyen como
      plugins que la incorporación puede instalar. Catálogo completo: [Canales](/es/channels).
    - Seguridad de mensajes directos: el valor predeterminado es la vinculación. El primer mensaje directo envía un código; apruébelo mediante `openclaw pairing approve <channel> <code>` o use listas de permitidos.

  </Step>
  <Step title="Búsqueda web">
    - Seleccione un proveedor compatible, como Brave, Codex (búsqueda alojada), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG o Tavily (o bien omita este paso).
    - Los proveedores respaldados por una API pueden usar variables de entorno o una configuración existente para una configuración rápida; los proveedores sin clave utilizan en su lugar sus requisitos previos específicos.
    - Omita este paso con `--skip-search`.
    - Configúrelo más adelante: `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz gráfica, use un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows mediante WSL2): unidad de usuario de systemd
      - La incorporación intenta habilitar la persistencia mediante `loginctl enable-linger <user>` para que el Gateway continúe ejecutándose después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero, una tarea programada; si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta Inicio e inicia el Gateway inmediatamente.
    - **Selección del entorno de ejecución:** Node (recomendado; necesario para WhatsApp/Telegram, ya que Bun puede corromper la memoria al volver a conectarse). En el modo interactivo solo se ofrece Node; `--daemon-runtime bun` solo está disponible mediante la CLI.
    - Si la autenticación mediante token requiere un token y `gateway.auth.token` está administrado mediante SecretRef, la instalación del daemon lo valida, pero no conserva los valores resueltos del token en texto sin formato en los metadatos del entorno de servicio del supervisor.
    - Si la autenticación mediante token requiere un token y el SecretRef del token configurado no puede resolverse, la instalación del daemon se bloquea con instrucciones prácticas.
    - Si se configuran tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está establecido, la instalación del daemon se bloquea hasta que el modo se defina explícitamente.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade la comprobación de estado en vivo del Gateway a la salida del estado, incluidas las comprobaciones de canales cuando son compatibles (requiere un Gateway accesible).

  </Step>
  <Step title="Skills (recomendado)">
    - Lee las skills disponibles y comprueba los requisitos.
    - Permite elegir un gestor de Node: **npm / pnpm / bun**.
    - Instala automáticamente las dependencias opcionales para las skills incluidas de confianza (algunas utilizan Homebrew en macOS).
    - Omite las skills cuyo requisito previo de instalación mediante Homebrew, uv o Go no esté disponible, las agrupa con instrucciones de configuración manual e indica que se ejecute `openclaw doctor` una vez instalado el requisito previo.

  </Step>
  <Step title="Finalización">
    - Resumen + pasos siguientes, incluida la pregunta **¿Cómo desea iniciar su agente?** para Terminal, Navegador o más adelante.

  </Step>
</Steps>

<Note>
Si no se detecta ninguna interfaz gráfica, la incorporación muestra instrucciones de reenvío de puertos SSH para la interfaz de control en lugar de abrir un navegador.
Si faltan los recursos de la interfaz de control, la incorporación intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la interfaz).
</Note>

## Modo no interactivo

Use `--non-interactive --accept-risk` para automatizar la incorporación o ejecutarla mediante scripts (la
opción es el reconocimiento de riesgos obligatorio; la incorporación termina con un error
si no se proporciona):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Añada `--json` para obtener un resumen legible por máquinas.

SecretRef del token del Gateway en modo no interactivo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.

<Note>
`--json` **no** implica el modo no interactivo. Use `--non-interactive --accept-risk` (y `--workspace`) para scripts.
</Note>

Los ejemplos de comandos específicos de proveedores se encuentran en [Automatización de la CLI](/es/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referencia para consultar la semántica de las opciones y el orden de los pasos.

### Añadir un agente (modo no interactivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` es un identificador de agente reservado y no se puede usar con `openclaw agents add`.

## RPC del asistente del Gateway

El Gateway expone el flujo de incorporación mediante RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (la aplicación para macOS y la interfaz de control) pueden representar los pasos sin volver a implementar la lógica de incorporación.

## Configuración de Signal (signal-cli)

La incorporación detecta si `signal-cli` está en `PATH` y, si falta, ofrece instalarlo:

- Linux x86-64: descarga la compilación nativa oficial de GraalVM desde las versiones de `signal-cli` en GitHub y la almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- macOS y otras arquitecturas: realiza la instalación mediante Homebrew.
- Windows nativo: aún no es compatible; ejecute la incorporación dentro de WSL2 para usar la ruta de instalación de Linux.
- En cualquier caso, escribe `channels.signal.cliPath` en la configuración.

## Qué escribe el asistente

Campos habituales en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se especifica `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (la incorporación local usa `"coding"` de forma predeterminada cuando no está establecido; se conservan los valores explícitos existentes)
- `gateway.*` (modo, enlace, autenticación, Tailscale)
- `session.dmScope` (la incorporación local usa `"per-channel-peer"` de forma predeterminada cuando no está establecido; se conservan los valores explícitos existentes. Detalles: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de remitentes permitidos para mensajes directos de los canales cuando acepta habilitarlas durante las indicaciones de configuración del canal. Discord, Matrix, Microsoft Teams y Slack convierten los nombres en identificadores cuando es posible; los demás canales aceptan identificadores directamente (por ejemplo, identificadores numéricos de remitentes de Telegram o números de teléfono de WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual puede seguir usando `yarn` si se establece directamente `skills.install.nodeManager`.
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
`~/.openclaw/agents/<agentId>/sessions/` se usa para las entradas de migración
heredadas y los artefactos de archivo o soporte.

Algunos canales se distribuyen como plugins. Cuando selecciona uno durante la configuración, el proceso de incorporación
solicita instalarlo (desde npm o una ruta local) antes de poder configurarlo.

## Documentación relacionada

- Descripción general de la incorporación: [Incorporación (CLI)](/es/start/wizard)
- Referencia de configuración de la CLI: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference)
- Incorporación en la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Referencia de configuración: [Configuración del Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [iMessage](/es/channels/imessage)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
