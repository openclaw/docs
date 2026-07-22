---
read_when:
    - Buscar un paso o indicador específico del proceso de incorporación
    - Automatización de la incorporación con el modo no interactivo
    - Depuración del comportamiento de incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa para la incorporación mediante la CLI: cada paso, opción y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-07-22T10:48:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9535e27db7cbc151a81935b6d4242b2517483f1486dce6e900fe632eecd90576
    source_path: reference/wizard.md
    workflow: 16
---

Esta es la referencia completa de `openclaw onboard`.
Para obtener una descripción general, consulte [Incorporación (CLI)](/es/start/wizard). Para conocer paso a paso
el comportamiento y los resultados, consulte la [Referencia de configuración de la CLI](/es/start/wizard-cli-reference).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Restablecimiento (opcional)">
    - `--reset` restablece el estado antes de ejecutar la configuración; sin esta opción, volver a ejecutar la incorporación
      conserva la configuración existente y la reutiliza como valores predeterminados.
    - `--reset-scope` controla lo que elimina `--reset`: `config` (solo el archivo de
      configuración), `config+creds+sessions` (valor predeterminado) o `full` (también elimina el
      espacio de trabajo).
    - Si el archivo de configuración no es válido, la incorporación se detiene e indica que primero se debe ejecutar
      `openclaw doctor` y, a continuación, volver a ejecutar la configuración.
    - El restablecimiento mueve el estado a la papelera (nunca lo elimina directamente).

  </Step>
  <Step title="Aceptación del riesgo">
    - La primera ejecución (o cualquier ejecución antes de que se establezca `wizard.securityAcknowledgedAt`)
      solicita confirmar que se comprende que los agentes son potentes y que el acceso
      completo al sistema conlleva riesgos.
    - `--non-interactive` requiere `--accept-risk` de forma explícita; sin esta opción,
      la incorporación finaliza con un error en lugar de solicitar confirmación.
    - Las ejecuciones interactivas muestran una solicitud de confirmación en lugar de la opción; rechazarla
      cancela la configuración.

  </Step>
  <Step title="Modelo/autenticación">
    - **Clave de API de Anthropic**: usa `ANTHROPIC_API_KEY` si está presente o solicita una clave y, a continuación, la guarda para que la utilice el daemon.
    - **CLI de Anthropic Claude**: ruta local preferida cuando ya existe un inicio de sesión en la CLI de Claude; OpenClaw sigue admitiendo como alternativa la autenticación mediante token de configuración de Anthropic.
    - **Suscripción a OpenAI Code (Codex) (OAuth)**: flujo mediante navegador; pegue el `code#state`.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.
    - **Suscripción a OpenAI Code (Codex) (emparejamiento de dispositivo)**: flujo de emparejamiento mediante navegador con un código de dispositivo de corta duración.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.
    - **Clave de API de OpenAI**: usa `OPENAI_API_KEY` si está presente o solicita una clave y, a continuación, la almacena en los perfiles de autenticación.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6`; el id. de modelo simple de la API directa se resuelve al nivel Sol.
    - Añadir OpenAI o volver a autenticarlo conserva un modelo principal explícito existente, incluido `openai/gpt-5.5`. Si la cuenta no ofrece GPT-5.6, seleccione `openai/gpt-5.5` de forma explícita; OpenClaw no cambia silenciosamente a un modelo inferior.
    - **OAuth de xAI**: inicio de sesión mediante navegador con código de dispositivo que no requiere una devolución de llamada en localhost, por lo que también funciona mediante SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Clave de API de xAI**: solicita `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` sigue funcionando como alias de compatibilidad de uso exclusivamente manual para el mismo flujo OAuth de xAI con código de dispositivo; use `xai-oauth` en scripts nuevos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, que puede obtenerse en https://opencode.ai/auth) y permite elegir el catálogo Zen o Go.
    - **Ollama**: primero ofrece **Nube + local**, **Solo nube** o **Solo local**. `Cloud only` solicita `OLLAMA_API_KEY` y usa `https://ollama.com`; los modos respaldados por un host solicitan la URL base de Ollama (valor predeterminado: `http://127.0.0.1:11434`), detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado cuando es necesario; `Cloud + Local` también comprueba si se ha iniciado sesión en ese host de Ollama para acceder a la nube.
    - Más información: [Ollama](/es/providers/ollama)
    - **Clave de API**: almacena la clave.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más información: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más información: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor alojado predeterminado es `MiniMax-M3`.
      La configuración mediante clave de API usa `minimax/...` y la configuración mediante OAuth usa
      `minimax-portal/...`.
    - Más información: [MiniMax](/es/providers/minimax)
    - **StepFun**: la configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    - Actualmente, el valor predeterminado estándar es `step-3.5-flash`; Step Plan también incluye `step-3.5-flash-2603`.
    - Más información: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más información: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más información: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Proveedor personalizado**: funciona con endpoints compatibles con OpenAI, compatibles con OpenAI Responses o compatibles con Anthropic. Opciones no interactivas: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`), `--custom-provider-id` (opcional; se deriva automáticamente de la URL base), `--custom-compatibility openai|openai-responses|anthropic` (valor predeterminado: `openai`), `--custom-image-input` / `--custom-text-input` (reemplazan la detección inferida del modelo de visión).
    - **Omitir**: todavía no se configura la autenticación.
    - Seleccione un modelo predeterminado entre las opciones detectadas (o introduzca manualmente el proveedor/modelo). Para obtener la mejor calidad y reducir el riesgo de inyección de instrucciones, elija el modelo más potente de última generación disponible en el conjunto de proveedores.
    - La incorporación ejecuta una comprobación del modelo y muestra una advertencia si el modelo configurado es desconocido o carece de autenticación.
    - El modo de almacenamiento de claves de API usa de forma predeterminada valores de perfil de autenticación en texto sin formato. Use `--secret-input-mode ref` para almacenar en su lugar referencias respaldadas por variables de entorno (por ejemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); la variable de entorno referenciada ya debe estar establecida o la incorporación fallará inmediatamente.
    - Los perfiles de autenticación se encuentran en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves de API + OAuth). `~/.openclaw/credentials/oauth.json` es solo para importaciones heredadas.
    - Más información: [OAuth](/es/concepts/oauth)
    <Note>
    Consejo para servidores/sistemas sin interfaz gráfica: complete OAuth en una máquina con navegador y, a continuación, copie
    el archivo `auth-profiles.json` de ese agente (por ejemplo,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` o la ruta
    `$OPENCLAW_STATE_DIR/...` correspondiente) al host del Gateway. `credentials/oauth.json`
    es solo una fuente de importación heredada.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado: `~/.openclaw/workspace` (configurable).
    - Crea los archivos del espacio de trabajo necesarios para el ritual de arranque del agente.
    - Diseño completo del espacio de trabajo y guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Puerto (valor predeterminado: **18789**), enlace, modo de autenticación y exposición mediante Tailscale.
    - Recomendación de autenticación: mantenga **Token** incluso para loopback, de modo que los clientes WS locales deban autenticarse.
    - En el modo de token, la configuración interactiva ofrece:
      - **Generar/almacenar un token en texto sin formato** (valor predeterminado)
      - **Usar SecretRef** (opcional)
      - El inicio rápido reutiliza las SecretRefs existentes de `gateway.auth.token` entre los proveedores `env`, `file` y `exec` para la prueba de incorporación y el arranque del panel.
      - Si esa SecretRef está configurada, pero no puede resolverse, la incorporación falla anticipadamente con un mensaje claro sobre cómo corregirlo, en lugar de degradar silenciosamente la autenticación del entorno de ejecución.
    - En el modo de contraseña, la configuración interactiva también admite el almacenamiento en texto sin formato o mediante SecretRef.
    - Ruta no interactiva de SecretRef para el token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No puede combinarse con `--gateway-token`.
    - Desactive la autenticación únicamente si confía plenamente en todos los procesos locales.
    - Los enlaces que no sean de loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional mediante código QR.
    - [Telegram](/es/channels/telegram): token de bot.
    - [Discord](/es/channels/discord): token de bot.
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + público del Webhook.
    - [Mattermost](/es/channels/mattermost) (Plugin): token de bot + URL base.
    - [Signal](/es/channels/signal) (Plugin): instalación opcional de `signal-cli` + configuración de la cuenta.
    - [iMessage](/es/channels/imessage): ruta de la CLI `imsg` + acceso a la base de datos de Mensajes; use un envoltorio SSH cuando el Gateway se ejecute fuera de un Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack y otros canales se distribuyen como
      plugins que la incorporación puede instalar. Catálogo completo: [Canales](/es/channels).
    - Seguridad de los mensajes directos: el valor predeterminado es el emparejamiento. El primer mensaje directo envía un código; apruébelo mediante `openclaw pairing approve <channel> <code>` o use listas de permitidos.

  </Step>
  <Step title="Búsqueda web">
    - Seleccione un proveedor compatible, como Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG o Tavily (o bien omita este paso).
    - Los proveedores respaldados por API pueden usar variables de entorno o la configuración existente para una configuración rápida; los proveedores sin clave usan en su lugar sus requisitos previos específicos.
    - Omita este paso con `--skip-search`.
    - Configúrelo más adelante: `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para sistemas sin interfaz gráfica, use un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows mediante WSL2): unidad de usuario de systemd
      - La incorporación intenta habilitar la permanencia mediante `loginctl enable-linger <user>` para que el Gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero usa una tarea programada; si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta Inicio e inicia el Gateway inmediatamente.
    - **Selección del entorno de ejecución:** Node es obligatorio porque el almacén de estado canónico del entorno de ejecución usa `node:sqlite`. Los servicios heredados de Bun se migran a Node durante la reparación.
    - Si la autenticación mediante token requiere un token y `gateway.auth.token` está gestionado mediante SecretRef, la instalación del daemon lo valida, pero no conserva los valores de token en texto sin formato resueltos en los metadatos del entorno de servicio del supervisor.
    - Si la autenticación mediante token requiere un token y la SecretRef de token configurada no se resuelve, la instalación del daemon se bloquea con instrucciones prácticas.
    - Si se configuran tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está establecido, la instalación del daemon se bloquea hasta que se establezca explícitamente el modo.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade la prueba de estado del gateway en directo a la salida de estado, incluidas las pruebas de canales cuando sean compatibles (requiere un gateway accesible).

  </Step>
  <Step title="Skills (recomendadas)">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Permite elegir un gestor de Node: **npm / pnpm / bun**.
    - Instala automáticamente las dependencias opcionales de las Skills integradas de confianza (algunas usan Homebrew en macOS).
    - Omite las Skills cuyo requisito previo de instalación mediante Homebrew, uv o Go no esté disponible, las agrupa con instrucciones de configuración manual y remite a `openclaw doctor` una vez instalado el requisito previo.

  </Step>
  <Step title="Finalización">
    - Resumen + pasos siguientes, incluida la pregunta **¿Cómo desea iniciar su agente?** para usar Terminal, Navegador o hacerlo más adelante.

  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, el proceso de incorporación muestra instrucciones de reenvío de puertos SSH para la interfaz de control en lugar de abrir un navegador.
Si faltan los recursos de la interfaz de control, el proceso de incorporación intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la interfaz).
</Note>

## Modo no interactivo

Use `--non-interactive --accept-risk` para automatizar o programar el proceso de incorporación (la
marca constituye la confirmación obligatoria de aceptación del riesgo; el proceso de incorporación finaliza con un error
si no se incluye):

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

Añada `--json` para obtener un resumen procesable por máquinas.

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

Los ejemplos de comandos específicos de cada proveedor se encuentran en [Automatización de la CLI](/es/start/wizard-cli-automation#provider-specific-examples).
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

`main` es un identificador de agente reservado y no se puede usar para `openclaw agents add`.

## RPC del asistente del Gateway

El Gateway expone el flujo de incorporación mediante RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (aplicación para macOS, interfaz de control) pueden representar los pasos sin volver a implementar la lógica de incorporación.

## Configuración de Signal (signal-cli)

El proceso de incorporación detecta si `signal-cli` se encuentra en `PATH` y, si falta, ofrece instalarlo:

- Linux x86-64: descarga la compilación nativa oficial de GraalVM desde las versiones de GitHub de `signal-cli` y la almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- macOS y otras arquitecturas: realiza la instalación mediante Homebrew.
- Windows nativo: todavía no es compatible; ejecute el proceso de incorporación dentro de WSL2 para usar la ruta de instalación de Linux.
- En cualquier caso, escribe `channels.signal.cliPath` en la configuración.

## Qué escribe el asistente

Campos habituales en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se proporciona `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (de forma predeterminada, el proceso de incorporación local usa `"coding"` cuando no se ha definido; se conservan los valores explícitos existentes)
- `gateway.*` (modo, enlace, autenticación, Tailscale)
- `session.dmScope` (el proceso de incorporación conserva los valores explícitos y, en caso contrario, lo deja sin definir, de modo que el valor predeterminado `"main"` mantiene todos los mensajes directos de los distintos canales en la sesión principal continua del agente, que es la configuración predeterminada para un agente personal. Para bandejas de entrada compartidas o multiusuario, use `"per-channel-peer"`; `openclaw security audit` recomienda el aislamiento cuando detecta tráfico de mensajes directos de varios usuarios. Más información: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos para mensajes directos de los canales cuando se habilitan durante las indicaciones de configuración de los canales. Discord, Matrix, Microsoft Teams y Slack convierten los nombres en identificadores cuando es posible; los demás canales reciben los identificadores directamente (por ejemplo, identificadores numéricos de remitentes de Telegram o números de teléfono de WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede usar `yarn` estableciendo directamente `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` escribe `agents.entries.*` y, opcionalmente, `bindings`.

Las credenciales de WhatsApp se guardan en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones activas y las transcripciones se almacenan en
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. El directorio
`~/.openclaw/agents/<agentId>/sessions/` se utiliza para las entradas de migraciones heredadas
y los artefactos de archivo o soporte.

Algunos canales se distribuyen como plugins. Cuando se selecciona uno durante la configuración, el proceso de incorporación
solicita instalarlo (desde npm o una ruta local) antes de poder configurarlo.

## Documentación relacionada

- Descripción general del proceso de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Referencia de configuración de la CLI: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference)
- Proceso de incorporación de la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Referencia de configuración: [Configuración del Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [iMessage](/es/channels/imessage)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
