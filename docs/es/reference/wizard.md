---
read_when:
    - Buscar un paso o indicador específico de incorporación
    - Automatización de la incorporación con el modo no interactivo
    - Depuración del comportamiento de incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa para la incorporación mediante la CLI: cada paso, opción y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-07-19T02:10:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5fcf2876fcd01f6ce3fe029068e55eaba7281dd997c28d7f3799a97f12e5e751
    source_path: reference/wizard.md
    workflow: 16
---

Esta es la referencia completa de `openclaw onboard`.
Para obtener una descripción general, consulta [Incorporación (CLI)](/es/start/wizard). Para conocer el comportamiento y los resultados
paso a paso, consulta la [Referencia de configuración de la CLI](/es/start/wizard-cli-reference).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Restablecimiento (opcional)">
    - `--reset` restablece el estado antes de ejecutar la configuración; sin esta opción, al volver a ejecutar la incorporación
      se conserva la configuración existente y se reutiliza como valores predeterminados.
    - `--reset-scope` controla qué elimina `--reset`: `config` (solo el archivo de
      configuración), `config+creds+sessions` (valor predeterminado) o `full` (también elimina el
      espacio de trabajo).
    - Si el archivo de configuración no es válido, la incorporación se detiene e indica que primero se debe ejecutar
      `openclaw doctor` y, después, volver a ejecutar la configuración.
    - El restablecimiento mueve el estado a la Papelera (nunca lo elimina directamente).

  </Step>
  <Step title="Reconocimiento del riesgo">
    - La primera ejecución (o cualquier ejecución anterior a que se establezca `wizard.securityAcknowledgedAt`)
      solicita confirmar que se comprende que los agentes son potentes y que el acceso completo
      al sistema conlleva riesgos.
    - `--non-interactive` requiere `--accept-risk` de forma explícita; sin esta opción,
      la incorporación termina con un error en lugar de solicitar confirmación.
    - Las ejecuciones interactivas muestran una solicitud de confirmación en lugar de la opción; si se rechaza,
      se cancela la configuración.

  </Step>
  <Step title="Modelo/Autenticación">
    - **Clave de API de Anthropic**: utiliza `ANTHROPIC_API_KEY` si está presente o solicita una clave y, a continuación, la guarda para que la use el daemon.
    - **CLI de Anthropic Claude**: ruta local preferida cuando ya existe un inicio de sesión en la CLI de Claude; OpenClaw también admite como alternativa la autenticación mediante token de configuración de Anthropic.
    - **Suscripción a OpenAI Code (Codex) (OAuth)**: flujo del navegador; pega el `code#state`.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.
    - **Suscripción a OpenAI Code (Codex) (vinculación de dispositivo)**: flujo de vinculación del navegador con un código de dispositivo de corta duración.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.
    - **Clave de API de OpenAI**: utiliza `OPENAI_API_KEY` si está presente o solicita una clave y, a continuación, la almacena en los perfiles de autenticación.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6`; el identificador del modelo de API directa sin calificar se resuelve en el nivel Sol.
    - Al añadir OpenAI o volver a autenticarse, se conserva cualquier modelo principal explícito existente, incluido `openai/gpt-5.5`. Si la cuenta no ofrece GPT-5.6, selecciona `openai/gpt-5.5` explícitamente; OpenClaw no cambia silenciosamente a un modelo inferior.
    - **OAuth de xAI**: inicio de sesión en el navegador mediante código de dispositivo sin necesidad de una devolución de llamada de localhost, por lo que también funciona mediante SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Clave de API de xAI**: solicita `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` sigue funcionando como alias de compatibilidad exclusivamente manual para el mismo flujo OAuth de xAI mediante código de dispositivo; utiliza `xai-oauth` para los scripts nuevos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`; se obtiene en https://opencode.ai/auth) y permite elegir el catálogo Zen o Go.
    - **Ollama**: primero ofrece **Nube + local**, **Solo nube** o **Solo local**. `Cloud only` solicita `OLLAMA_API_KEY` y utiliza `https://ollama.com`; los modos respaldados por un host solicitan la URL base de Ollama (valor predeterminado: `http://127.0.0.1:11434`), detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado cuando es necesario; `Cloud + Local` también comprueba si se ha iniciado sesión en ese host de Ollama para acceder a la nube.
    - Más información: [Ollama](/es/providers/ollama)
    - **Clave de API**: almacena la clave.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más información: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más información: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor predeterminado alojado es `MiniMax-M3`.
      La configuración mediante clave de API utiliza `minimax/...` y la configuración mediante OAuth utiliza
      `minimax-portal/...`.
    - Más información: [MiniMax](/es/providers/minimax)
    - **StepFun**: la configuración se escribe automáticamente para StepFun estándar o Step Plan en puntos de conexión de China o globales.
    - Actualmente, la opción estándar utiliza `step-3.5-flash` de forma predeterminada; Step Plan también incluye `step-3.5-flash-2603`.
    - Más información: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más información: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más información: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Proveedor personalizado**: funciona con puntos de conexión compatibles con OpenAI, con OpenAI Responses o con Anthropic. Opciones no interactivas: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`), `--custom-provider-id` (opcional; se deriva automáticamente de la URL base), `--custom-compatibility openai|openai-responses|anthropic` (valor predeterminado: `openai`), `--custom-image-input` / `--custom-text-input` (sobrescriben la detección inferida del modelo de visión).
    - **Omitir**: aún no se configura la autenticación.
    - Selecciona un modelo predeterminado entre las opciones detectadas (o introduce manualmente el proveedor/modelo). Para obtener la mejor calidad y reducir el riesgo de inyección de prompts, elige el modelo más potente de última generación disponible en la pila del proveedor.
    - La incorporación ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o no tiene autenticación.
    - El modo de almacenamiento de claves de API utiliza de forma predeterminada valores de perfil de autenticación en texto sin formato. Utiliza `--secret-input-mode ref` para almacenar en su lugar referencias respaldadas por variables de entorno (por ejemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); la variable de entorno referenciada debe estar ya establecida o la incorporación falla de inmediato.
    - Los perfiles de autenticación se encuentran en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves de API + OAuth). `~/.openclaw/credentials/oauth.json` solo se usa para importar datos heredados.
    - Más información: [OAuth](/es/concepts/oauth)
    <Note>
    Consejo para entornos sin interfaz gráfica/servidores: completa OAuth en una máquina con navegador y, a continuación, copia
    el archivo `auth-profiles.json` de ese agente (por ejemplo,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` o la ruta
    `$OPENCLAW_STATE_DIR/...` correspondiente) en el host del Gateway. `credentials/oauth.json`
    es únicamente una fuente de importación heredada.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado: `~/.openclaw/workspace` (configurable).
    - Crea los archivos del espacio de trabajo necesarios para el proceso de arranque del agente.
    - Diseño completo del espacio de trabajo y guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Puerto (valor predeterminado: **18789**), vinculación, modo de autenticación y exposición mediante Tailscale.
    - Recomendación de autenticación: conserva **Token** incluso para loopback, de modo que los clientes WS locales deban autenticarse.
    - En el modo de token, la configuración interactiva ofrece:
      - **Generar/almacenar un token en texto sin formato** (valor predeterminado)
      - **Usar SecretRef** (opcional)
      - El inicio rápido reutiliza las SecretRefs de `gateway.auth.token` existentes en los proveedores `env`, `file` y `exec` para la comprobación de incorporación y el arranque del panel.
      - Si esa SecretRef está configurada pero no se puede resolver, la incorporación falla al principio con un mensaje claro para corregir el problema, en lugar de degradar silenciosamente la autenticación del entorno de ejecución.
    - En el modo de contraseña, la configuración interactiva también admite el almacenamiento en texto sin formato o mediante SecretRef.
    - Ruta no interactiva de SecretRef del token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No se puede combinar con `--gateway-token`.
    - Desactiva la autenticación únicamente si se confía plenamente en todos los procesos locales.
    - Las vinculaciones que no sean de loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional mediante QR.
    - [Telegram](/es/channels/telegram): token del bot.
    - [Discord](/es/channels/discord): token del bot.
    - [Google Chat](/es/channels/googlechat): JSON de la cuenta de servicio + audiencia del webhook.
    - [Mattermost](/es/channels/mattermost) (Plugin): token del bot + URL base.
    - [Signal](/es/channels/signal) (Plugin): instalación opcional de `signal-cli` + configuración de la cuenta.
    - [iMessage](/es/channels/imessage): ruta de la CLI de `imsg` + acceso a la base de datos de Mensajes; utiliza un contenedor SSH cuando el Gateway se ejecute fuera de un Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack y otros canales se distribuyen como
      plugins que la incorporación puede instalar. Catálogo completo: [Canales](/es/channels).
    - Seguridad de los mensajes directos: el valor predeterminado es la vinculación. El primer mensaje directo envía un código; apruébalo mediante `openclaw pairing approve <channel> <code>` o utiliza listas de permitidos.

  </Step>
  <Step title="Búsqueda web">
    - Selecciona un proveedor compatible, como Brave, Codex (búsqueda alojada), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG o Tavily (o bien omite este paso).
    - Los proveedores respaldados por API pueden utilizar variables de entorno o la configuración existente para una configuración rápida; los proveedores sin clave utilizan en su lugar sus requisitos previos específicos.
    - Omite este paso con `--skip-search`.
    - Configura más adelante: `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz gráfica, utiliza un LaunchDaemon personalizado (no se incluye).
    - Linux (y Windows mediante WSL2): unidad de usuario de systemd
      - La incorporación intenta habilitar la permanencia mediante `loginctl enable-linger <user>` para que el Gateway siga ejecutándose después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero, Tarea programada; si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta Inicio e inicia el Gateway inmediatamente.
    - **Selección del entorno de ejecución:** Node es obligatorio porque el almacén canónico del estado del entorno de ejecución utiliza `node:sqlite`. Los servicios Bun heredados se migran a Node durante la reparación.
    - Si la autenticación mediante token requiere un token y `gateway.auth.token` está gestionado mediante SecretRef, la instalación del daemon lo valida, pero no conserva los valores resueltos del token en texto sin formato en los metadatos del entorno del servicio supervisor.
    - Si la autenticación mediante token requiere un token y la SecretRef configurada para el token no se resuelve, se bloquea la instalación del daemon con instrucciones prácticas.
    - Si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, se bloquea la instalación del daemon hasta que se establezca explícitamente el modo.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade la comprobación activa del estado del Gateway a la salida de estado, incluidas las comprobaciones de los canales cuando sean compatibles (requiere un Gateway accesible).

  </Step>
  <Step title="Skills (recomendadas)">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Permite elegir un gestor de Node: **npm / pnpm / bun**.
    - Instala automáticamente las dependencias opcionales de las Skills incluidas de confianza (algunas utilizan Homebrew en macOS).
    - Omite las Skills cuyo requisito previo de instalación mediante Homebrew, uv o Go no esté disponible, las agrupa con instrucciones de configuración manual y remite a `openclaw doctor` una vez instalado el requisito previo.

  </Step>
  <Step title="Finalización">
    - Resumen + próximos pasos, incluida la pregunta **¿Cómo se desea hacer eclosionar al agente?** para Terminal, Navegador o más adelante.

  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, la incorporación muestra instrucciones de reenvío de puertos SSH para la interfaz de control en lugar de abrir un navegador.
Si faltan los recursos de la interfaz de control, la incorporación intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la interfaz).
</Note>

## Modo no interactivo

Use `--non-interactive --accept-risk` para automatizar la incorporación o ejecutarla mediante scripts (la
marca constituye la confirmación de riesgo obligatoria; la incorporación finaliza con un error
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

Añada `--json` para obtener un resumen legible por máquina.

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
`--json` **no** implica el modo no interactivo. Use `--non-interactive --accept-risk` (y `--workspace`) para los scripts.
</Note>

Los ejemplos de comandos específicos de proveedores se encuentran en [Automatización de la CLI](/es/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referencia para consultar la semántica de las marcas y el orden de los pasos.

### Añadir un agente (modo no interactivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` es un id. de agente reservado y no se puede usar para `openclaw agents add`.

## RPC del asistente del Gateway

El Gateway expone el flujo de incorporación mediante RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (aplicación para macOS, interfaz de control) pueden representar los pasos sin volver a implementar la lógica de incorporación.

## Configuración de Signal (signal-cli)

La incorporación detecta si `signal-cli` está en `PATH` y, si falta, ofrece instalarlo:

- Linux x86-64: descarga la compilación nativa oficial de GraalVM desde las versiones de GitHub de `signal-cli` y la almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- macOS y otras arquitecturas: realiza la instalación mediante Homebrew.
- Windows nativo: todavía no es compatible; ejecute la incorporación dentro de WSL2 para usar la ruta de instalación de Linux.
- En cualquier caso, escribe `channels.signal.cliPath` en la configuración.

## Qué escribe el asistente

Campos habituales en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se proporciona `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (la incorporación local usa `"coding"` de forma predeterminada cuando no está establecido; se conservan los valores explícitos existentes)
- `gateway.*` (modo, enlace, autenticación, Tailscale)
- `session.dmScope` (la incorporación conserva los valores explícitos y, en caso contrario, lo deja sin establecer, por lo que el valor predeterminado `"main"` mantiene todos los mensajes directos de todos los canales en la sesión principal continua del agente, el valor predeterminado para agentes personales. Para bandejas de entrada compartidas o multiusuario, use `"per-channel-peer"`; `openclaw security audit` recomienda el aislamiento cuando detecta tráfico de mensajes directos multiusuario. Detalles: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de remitentes permitidos para mensajes directos de los canales cuando se habilitan durante las solicitudes de configuración del canal. Discord, Matrix, Microsoft Teams y Slack convierten los nombres en identificadores cuando es posible; los demás canales aceptan los identificadores directamente (por ejemplo, identificadores numéricos de remitentes de Telegram o números de teléfono de WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual puede seguir usando `yarn` estableciendo `skills.install.nodeManager` directamente.
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
`~/.openclaw/agents/<agentId>/sessions/` se usa para las entradas de migración
heredada y los artefactos de archivo o soporte.

Algunos canales se distribuyen como plugins. Al seleccionar uno durante la configuración, la incorporación
solicitará instalarlo (desde npm o una ruta local) antes de poder configurarlo.

## Documentación relacionada

- Descripción general de la incorporación: [Incorporación (CLI)](/es/start/wizard)
- Referencia de configuración de la CLI: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference)
- Incorporación en la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Referencia de configuración: [Configuración del Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [iMessage](/es/channels/imessage)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
