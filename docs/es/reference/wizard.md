---
read_when:
    - Buscar un paso o indicador específico de incorporación
    - Automatización de la incorporación con el modo no interactivo
    - Depuración del comportamiento de incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa para la incorporación mediante la CLI: cada paso, indicador y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-07-14T13:58:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

Esta es la referencia completa de `openclaw onboard`.
Para obtener una visión general, consulte [Incorporación (CLI)](/es/start/wizard). Para conocer el comportamiento y los resultados
paso a paso, consulte la [Referencia de configuración mediante CLI](/es/start/wizard-cli-reference).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Restablecimiento (opcional)">
    - `--reset` restablece el estado antes de ejecutar la configuración; sin esta opción, al repetir la incorporación
      se conserva la configuración existente y se reutiliza como valores predeterminados.
    - `--reset-scope` controla lo que elimina `--reset`: `config` (solo el archivo de
      configuración), `config+creds+sessions` (predeterminado) o `full` (también elimina el
      espacio de trabajo).
    - Si el archivo de configuración no es válido, la incorporación se detiene e indica que primero se debe ejecutar
      `openclaw doctor` y, después, volver a ejecutar la configuración.
    - El restablecimiento mueve el estado a la papelera (nunca lo elimina directamente).

  </Step>
  <Step title="Aceptación del riesgo">
    - La primera ejecución (o cualquier ejecución anterior a la configuración de `wizard.securityAcknowledgedAt`)
      solicita confirmar que se comprende que los agentes son potentes y que el acceso
      completo al sistema conlleva riesgos.
    - `--non-interactive` requiere `--accept-risk` de forma explícita; sin esta opción,
      la incorporación termina con un error en lugar de solicitar confirmación.
    - Las ejecuciones interactivas muestran una solicitud de confirmación en lugar de la opción; rechazarla
      cancela la configuración.

  </Step>
  <Step title="Modelo/autenticación">
    - **Clave de API de Anthropic**: utiliza `ANTHROPIC_API_KEY` si está presente o solicita una clave y, después, la guarda para que la use el daemon.
    - **CLI de Anthropic Claude**: ruta local preferida cuando ya existe un inicio de sesión en la CLI de Claude; OpenClaw sigue admitiendo como alternativa la autenticación mediante un token de configuración de Anthropic.
    - **Suscripción a OpenAI Code (Codex) (OAuth)**: flujo mediante navegador; pegue el `code#state`.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.
    - **Suscripción a OpenAI Code (Codex) (emparejamiento de dispositivo)**: flujo de emparejamiento mediante navegador con un código de dispositivo de corta duración.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6-sol` mediante el entorno de ejecución de Codex.
    - **Clave de API de OpenAI**: utiliza `OPENAI_API_KEY` si está presente o solicita una clave y, después, la almacena en los perfiles de autenticación.
      - En una configuración nueva sin modelo principal, establece `agents.defaults.model` en `openai/gpt-5.6`; el identificador de modelo básico de la API directa se resuelve al nivel Sol.
    - Añadir OpenAI o volver a autenticarlo conserva cualquier modelo principal explícito existente, incluido `openai/gpt-5.5`. Si la cuenta no ofrece GPT-5.6, seleccione `openai/gpt-5.5` explícitamente; OpenClaw no cambia silenciosamente a un modelo inferior.
    - **OAuth de xAI**: inicio de sesión mediante navegador con código de dispositivo que no requiere una devolución de llamada en localhost, por lo que también funciona mediante SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Clave de API de xAI**: solicita `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` sigue funcionando como alias de compatibilidad exclusivamente manual para el mismo flujo OAuth de xAI con código de dispositivo; utilice `xai-oauth` para scripts nuevos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`; se obtiene en https://opencode.ai/auth) y permite elegir el catálogo Zen o Go.
    - **Ollama**: primero ofrece **Nube + local**, **Solo nube** o **Solo local**. `Cloud only` solicita `OLLAMA_API_KEY` y utiliza `https://ollama.com`; los modos respaldados por un host solicitan la URL base de Ollama (valor predeterminado: `http://127.0.0.1:11434`), detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado cuando es necesario; `Cloud + Local` también comprueba si se ha iniciado sesión en ese host de Ollama para acceder a la nube.
    - Más información: [Ollama](/es/providers/ollama)
    - **Clave de API**: almacena la clave.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más información: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita el identificador de cuenta, el identificador de Gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más información: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor alojado predeterminado es `MiniMax-M3`.
      La configuración mediante clave de API utiliza `minimax/...` y la configuración mediante OAuth utiliza
      `minimax-portal/...`.
    - Más información: [MiniMax](/es/providers/minimax)
    - **StepFun**: la configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    - Actualmente, la opción estándar utiliza `step-3.5-flash` de forma predeterminada; Step Plan también incluye `step-3.5-flash-2603`.
    - Más información: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más información: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más información: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Proveedor personalizado**: funciona con endpoints compatibles con OpenAI, OpenAI Responses o Anthropic. Opciones no interactivas: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (opcional; utiliza `CUSTOM_API_KEY` como alternativa), `--custom-provider-id` (opcional; se deriva automáticamente de la URL base), `--custom-compatibility openai|openai-responses|anthropic` (valor predeterminado: `openai`), `--custom-image-input` / `--custom-text-input` (sustituyen la detección inferida del modelo de visión).
    - **Omitir**: todavía no se configura ninguna autenticación.
    - Elija un modelo predeterminado entre las opciones detectadas (o introduzca manualmente el proveedor/modelo). Para obtener la mejor calidad y reducir el riesgo de inyección de instrucciones, elija el modelo más potente de última generación disponible en su conjunto de proveedores.
    - La incorporación ejecuta una comprobación del modelo y muestra una advertencia si el modelo configurado es desconocido o carece de autenticación.
    - El modo de almacenamiento de claves de API utiliza de forma predeterminada valores de perfil de autenticación en texto sin formato. Utilice `--secret-input-mode ref` para almacenar referencias respaldadas por variables de entorno (por ejemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); la variable de entorno referenciada debe estar definida previamente o la incorporación falla de inmediato.
    - Los perfiles de autenticación se encuentran en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves de API + OAuth). `~/.openclaw/credentials/oauth.json` solo se utiliza para importar datos heredados.
    - Más información: [OAuth](/es/concepts/oauth)
    <Note>
    Consejo para servidores o entornos sin interfaz gráfica: complete OAuth en una máquina con navegador y, después, copie
    el archivo `auth-profiles.json` de ese agente (por ejemplo,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` o la ruta
    `$OPENCLAW_STATE_DIR/...` correspondiente) al host del Gateway. `credentials/oauth.json`
    solo es una fuente de importación heredada.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado: `~/.openclaw/workspace` (configurable).
    - Crea los archivos del espacio de trabajo necesarios para el proceso de arranque del agente.
    - Diseño completo del espacio de trabajo y guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Puerto (valor predeterminado: **18789**), enlace, modo de autenticación y exposición mediante Tailscale.
    - Recomendación de autenticación: mantenga **Token** incluso para la interfaz de bucle invertido, de modo que los clientes WS locales deban autenticarse.
    - En el modo de token, la configuración interactiva ofrece:
      - **Generar/almacenar un token en texto sin formato** (predeterminado)
      - **Usar SecretRef** (opcional)
      - El inicio rápido reutiliza las SecretRefs de `gateway.auth.token` existentes entre los proveedores `env`, `file` y `exec` para la prueba de incorporación y el arranque del panel.
      - Si esa SecretRef está configurada pero no se puede resolver, la incorporación falla de inmediato con un mensaje claro para solucionar el problema, en lugar de degradar silenciosamente la autenticación del entorno de ejecución.
    - En el modo de contraseña, la configuración interactiva también admite el almacenamiento en texto sin formato o mediante SecretRef.
    - Ruta de SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No se puede combinar con `--gateway-token`.
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
    - [iMessage](/es/channels/imessage): ruta de la CLI `imsg` + acceso a la base de datos de Mensajes; utilice un contenedor SSH cuando el Gateway se ejecute fuera de un Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack y otros canales se distribuyen como
      plugins que la incorporación puede instalar. Catálogo completo: [Canales](/es/channels).
    - Seguridad de los mensajes directos: el emparejamiento es el valor predeterminado. El primer mensaje directo envía un código; apruébelo mediante `openclaw pairing approve <channel> <code>` o utilice listas de permitidos.

  </Step>
  <Step title="Búsqueda web">
    - Elija un proveedor compatible, como Brave, Codex (búsqueda alojada), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG o Tavily (o bien omita este paso).
    - Los proveedores respaldados por API pueden utilizar variables de entorno o la configuración existente para una configuración rápida; los proveedores que no requieren clave utilizan en su lugar sus requisitos previos específicos.
    - Omita este paso con `--skip-search`.
    - Configúrelo más adelante: `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz gráfica, utilice un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows mediante WSL2): unidad de usuario de systemd
      - La incorporación intenta habilitar la persistencia mediante `loginctl enable-linger <user>` para que el Gateway continúe ejecutándose tras cerrar la sesión.
      - Puede solicitar sudo (escribe `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero utiliza una tarea programada; si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta de inicio y pone en marcha el Gateway inmediatamente.
    - **Selección del entorno de ejecución:** Node es obligatorio porque el almacén canónico del estado del entorno de ejecución utiliza `node:sqlite`. Los servicios Bun heredados se migran a Node durante la reparación.
    - Si la autenticación mediante token requiere un token y `gateway.auth.token` está administrado mediante SecretRef, la instalación del daemon lo valida, pero no conserva los valores resueltos del token en texto sin formato en los metadatos del entorno de servicio del supervisor.
    - Si la autenticación mediante token requiere un token y no se puede resolver la SecretRef del token configurada, la instalación del daemon se bloquea con instrucciones prácticas.
    - Si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación del daemon se bloquea hasta que el modo se establezca explícitamente.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade la prueba de estado del Gateway en tiempo real a la salida de estado, incluidas las pruebas de canales cuando sean compatibles (requiere que el Gateway sea accesible).

  </Step>
  <Step title="Skills (recomendadas)">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Permite elegir un gestor de Node: **npm / pnpm / bun**.
    - Instala automáticamente las dependencias opcionales de las Skills integradas de confianza (algunas utilizan Homebrew en macOS).
    - Omite las Skills cuyo requisito previo de instalación mediante Homebrew, uv o Go no esté disponible, las agrupa con instrucciones de configuración manual y remite a `openclaw doctor` una vez instalado el requisito previo.

  </Step>
  <Step title="Finalizar">
    - Resumen y próximos pasos, incluida la pregunta **¿Cómo desea iniciar su agente?** para Terminal, Navegador o más adelante.

  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, la incorporación muestra instrucciones de reenvío de puertos SSH para la interfaz de control en lugar de abrir un navegador.
Si faltan los recursos de la interfaz de control, la incorporación intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la interfaz).
</Note>

## Modo no interactivo

Use `--non-interactive --accept-risk` para automatizar o crear scripts de incorporación (la
marca es la confirmación de riesgo obligatoria; la incorporación finaliza con un error
sin ella):

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
`--json` **no** implica el modo no interactivo. Use `--non-interactive --accept-risk` (y `--workspace`) para scripts.
</Note>

Los ejemplos de comandos específicos de cada proveedor se encuentran en [Automatización de la CLI](/es/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referencia para consultar la semántica de las marcas y el orden de los pasos.

### Añadir agente (no interactivo)

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
Los clientes (aplicación de macOS, interfaz de control) pueden representar los pasos sin volver a implementar la lógica de incorporación.

## Configuración de Signal (signal-cli)

La incorporación detecta si `signal-cli` está en `PATH` y, si falta, ofrece instalarlo:

- Linux x86-64: descarga la compilación nativa oficial de GraalVM desde las versiones de GitHub de `signal-cli` y la almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- macOS y otras arquitecturas: se instala mediante Homebrew.
- Windows nativo: aún no es compatible; ejecute la incorporación dentro de WSL2 para obtener la ruta de instalación de Linux.
- En cualquier caso, escribe `channels.signal.cliPath` en la configuración.

## Qué escribe el asistente

Campos habituales en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se proporciona `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (la incorporación local usa `"coding"` de forma predeterminada cuando no está definido; se conservan los valores explícitos existentes)
- `gateway.*` (modo, enlace, autenticación, Tailscale)
- `session.dmScope` (la incorporación local lo establece en `"per-channel-peer"` de forma predeterminada cuando no está definido; se conservan los valores explícitos existentes. Detalles: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de mensajes directos de canales cuando se habilitan durante las preguntas de los canales. Discord, Matrix, Microsoft Teams y Slack resuelven los nombres en identificadores cuando es posible; otros canales aceptan identificadores directamente (por ejemplo, identificadores numéricos de remitentes de Telegram o números de teléfono de WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual puede seguir usando `yarn` estableciendo `skills.install.nodeManager` directamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` escribe `agents.list[]` y el `bindings` opcional.

Las credenciales de WhatsApp se almacenan en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones activas y las transcripciones se almacenan en
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. El directorio
`~/.openclaw/agents/<agentId>/sessions/` se utiliza para las entradas de migración heredadas
y los artefactos de archivo o soporte.

Algunos canales se distribuyen como plugins. Cuando se selecciona uno durante la configuración, la incorporación
solicita instalarlo (desde npm o una ruta local) antes de poder configurarlo.

## Documentación relacionada

- Descripción general de la incorporación: [Incorporación (CLI)](/es/start/wizard)
- Referencia de configuración de la CLI: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference)
- Incorporación en la aplicación de macOS: [Incorporación](/es/start/onboarding)
- Referencia de configuración: [Configuración del Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [iMessage](/es/channels/imessage)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
