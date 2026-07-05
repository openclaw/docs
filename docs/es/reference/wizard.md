---
read_when:
    - Buscando un paso o flag específico de onboarding
    - Automatización de la incorporación con modo no interactivo
    - Depuración del comportamiento de incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa para la incorporación con CLI: cada paso, flag y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-07-05T11:41:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1f85ca510c55ad572ce7595faebe4461567785b18851914a5f7818615c517a3
    source_path: reference/wizard.md
    workflow: 16
---

Esta es la referencia completa para `openclaw onboard`.
Para una descripción general, consulta [Incorporación (CLI)](/es/start/wizard). Para el comportamiento
y las salidas paso a paso, consulta [Referencia de configuración de CLI](/es/start/wizard-cli-reference).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Restablecimiento (opcional)">
    - `--reset` restablece el estado antes de que se ejecute la configuración; sin él, volver a ejecutar la incorporación
      conserva la configuración existente y la reutiliza como valores predeterminados.
    - `--reset-scope` controla lo que elimina `--reset`: `config` (solo el archivo de configuración),
      `config+creds+sessions` (predeterminado), o `full` (también elimina el
      espacio de trabajo).
    - Si el archivo de configuración no es válido, la incorporación se detiene y te indica que ejecutes
      `openclaw doctor` primero y luego vuelvas a ejecutar la configuración.
    - El restablecimiento mueve el estado a la Papelera (nunca lo elimina directamente).

  </Step>
  <Step title="Aceptación del riesgo">
    - La primera ejecución (o cualquier ejecución antes de que se establezca `wizard.securityAcknowledgedAt`)
      te pide confirmar que entiendes que los agentes son potentes y que el acceso completo
      al sistema es riesgoso.
    - `--non-interactive` requiere `--accept-risk` explícitamente; sin él,
      la incorporación sale con un error en lugar de mostrar un aviso.
    - Las ejecuciones interactivas reciben un aviso de confirmación en lugar de la marca; rechazarlo
      cancela la configuración.

  </Step>
  <Step title="Modelo/Autenticación">
    - **Clave de API de Anthropic**: usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, luego la guarda para uso del daemon.
    - **CLI de Anthropic Claude**: ruta local preferida cuando ya existe un inicio de sesión de la CLI de Claude; OpenClaw sigue admitiendo la autenticación con token de configuración de Anthropic como alternativa.
    - **Suscripción de OpenAI Code (Codex) (OAuth)**: flujo del navegador; pega el `code#state`.
      - Establece `agents.defaults.model` en `openai/gpt-5.5` mediante el runtime de Codex cuando el modelo no está definido o ya pertenece a la familia OpenAI.
    - **Suscripción de OpenAI Code (Codex) (emparejamiento de dispositivo)**: flujo de emparejamiento en el navegador con un código de dispositivo de corta duración.
      - Establece `agents.defaults.model` en `openai/gpt-5.5` mediante el runtime de Codex cuando el modelo no está definido o ya pertenece a la familia OpenAI.
    - **Clave de API de OpenAI**: usa `OPENAI_API_KEY` si está presente o solicita una clave, luego la almacena en perfiles de autenticación.
      - Establece `agents.defaults.model` en `openai/gpt-5.5` cuando el modelo no está definido, es `openai/*`, o son referencias de modelo Codex heredadas.
    - **OAuth de xAI**: inicio de sesión en el navegador con código de dispositivo sin necesidad de callback de localhost, por lo que también funciona por SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Clave de API de xAI**: solicita `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` sigue funcionando como alias de compatibilidad solo manual para el mismo flujo de código de dispositivo de OAuth de xAI; usa `xai-oauth` para scripts nuevos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, consíguela en https://opencode.ai/auth) y te permite elegir el catálogo Zen o Go.
    - **Ollama**: ofrece primero **Nube + Local**, **Solo nube**, o **Solo local**. `Cloud only` solicita `OLLAMA_API_KEY` y usa `https://ollama.com`; los modos respaldados por host solicitan la URL base de Ollama (predeterminada `http://127.0.0.1:11434`), descubren los modelos disponibles y descargan automáticamente el modelo local seleccionado cuando hace falta; `Cloud + Local` también comprueba si ese host de Ollama tiene sesión iniciada para acceso a la nube.
    - Más detalle: [Ollama](/es/providers/ollama)
    - **Clave de API**: almacena la clave por ti.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más detalle: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita el ID de cuenta, el ID de Gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más detalle: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor predeterminado alojado es `MiniMax-M3`.
      La configuración con clave de API usa `minimax/...`, y la configuración con OAuth usa
      `minimax-portal/...`.
    - Más detalle: [MiniMax](/es/providers/minimax)
    - **StepFun**: la configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    - El estándar actualmente usa `step-3.5-flash` de forma predeterminada; Step Plan también incluye `step-3.5-flash-2603`.
    - Más detalle: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más detalle: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más detalle: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Proveedor personalizado**: funciona con endpoints compatibles con OpenAI, compatibles con OpenAI Responses o compatibles con Anthropic. Marcas no interactivas: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`), `--custom-provider-id` (opcional; se deriva automáticamente de la URL base), `--custom-compatibility openai|openai-responses|anthropic` (predeterminado `openai`), `--custom-image-input` / `--custom-text-input` (anulan la detección inferida de modelo con visión).
    - **Omitir**: aún no hay autenticación configurada.
    - Elige un modelo predeterminado entre las opciones detectadas (o introduce proveedor/modelo manualmente). Para obtener la mejor calidad y un menor riesgo de inyección de prompts, elige el modelo más potente de última generación disponible en tu pila de proveedores.
    - La incorporación ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o le falta autenticación.
    - El modo de almacenamiento de claves de API usa de forma predeterminada valores de perfil de autenticación en texto plano. Usa `--secret-input-mode ref` para almacenar refs respaldadas por variables de entorno en su lugar (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); la variable de entorno referenciada ya debe estar definida, o la incorporación falla rápido.
    - Los perfiles de autenticación viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves de API + OAuth). `~/.openclaw/credentials/oauth.json` es solo para importación heredada.
    - Más detalle: [OAuth](/es/concepts/oauth)
    <Note>
    Consejo para servidores/sin interfaz gráfica: completa OAuth en una máquina con navegador y luego copia
    el `auth-profiles.json` de ese agente (por ejemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
    `$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
    es solo una fuente de importación heredada.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Predeterminado `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del espacio de trabajo necesarios para el ritual de bootstrap del agente.
    - Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Puerto (predeterminado **18789**), vinculación, modo de autenticación, exposición de Tailscale.
    - Recomendación de autenticación: mantén **Token** incluso para loopback, para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto plano** (predeterminado)
      - **Usar SecretRef** (con activación explícita)
      - Quickstart reutiliza SecretRefs existentes de `gateway.auth.token` en proveedores `env`, `file` y `exec` para la sonda de incorporación/bootstrap del panel.
      - Si ese SecretRef está configurado pero no puede resolverse, la incorporación falla pronto con un mensaje claro de corrección en lugar de degradar silenciosamente la autenticación del runtime.
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta de SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No puede combinarse con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en todos los procesos locales.
    - Las vinculaciones que no sean loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión QR opcional.
    - [Telegram](/es/channels/telegram): token de bot.
    - [Discord](/es/channels/discord): token de bot.
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de webhook.
    - [Mattermost](/es/channels/mattermost) (plugin): token de bot + URL base.
    - [Signal](/es/channels/signal) (plugin): instalación opcional de `signal-cli` + configuración de cuenta.
    - [iMessage](/es/channels/imessage): ruta de CLI `imsg` + acceso a la base de datos de Mensajes; usa un wrapper SSH cuando el Gateway se ejecute fuera de Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack y otros canales se distribuyen como
      plugins que la incorporación puede instalar por ti. Catálogo completo: [Canales](/es/channels).
    - Seguridad de DM: el valor predeterminado es el emparejamiento. El primer DM envía un código; apruébalo mediante `openclaw pairing approve <channel> <code>` o usa listas de permitidos.

  </Step>
  <Step title="Búsqueda web">
    - Elige un proveedor compatible como Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG o Tavily (u omite).
    - Los proveedores respaldados por API pueden usar variables de entorno o configuración existente para una configuración rápida; los proveedores sin clave usan en su lugar sus prerrequisitos específicos del proveedor.
    - Omite con `--skip-search`.
    - Configura más tarde: `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz, usa un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows mediante WSL2): unidad de usuario systemd
      - La incorporación intenta habilitar lingering mediante `loginctl enable-linger <user>` para que el Gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: Scheduled Task primero; si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta Startup e inicia el Gateway inmediatamente.
    - **Selección de runtime:** Node (recomendado; requerido para WhatsApp/Telegram - Bun puede corromper memoria al reconectar). Solo Node se ofrece de forma interactiva; `--daemon-runtime bun` es solo para CLI.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida, pero no persiste los valores de token en texto plano resueltos en los metadatos del entorno del servicio supervisor.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no se resuelve, la instalación del daemon se bloquea con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación del daemon se bloquea hasta que el modo se defina explícitamente.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade la sonda de estado del gateway en vivo a la salida de estado, incluidas las sondas de canal cuando son compatibles (requiere un gateway accesible).

  </Step>
  <Step title="Skills (recomendado)">
    - Lee las skills disponibles y comprueba los requisitos.
    - Te permite elegir un gestor de node: **npm / pnpm / bun**.
    - Instala automáticamente dependencias opcionales para skills incluidas de confianza (algunas usan Homebrew en macOS).
    - Omite las skills cuyo prerrequisito de instalador de Homebrew, uv o Go no esté disponible, las agrupa con orientación de configuración manual y te dirige a `openclaw doctor` una vez instalado el prerrequisito.

  </Step>
  <Step title="Finalizar">
    - Resumen + próximos pasos, incluido el aviso **¿Cómo quieres incubar tu agente?** para Terminal, Browser o más tarde.

  </Step>
</Steps>

<Note>
Si no se detecta ninguna interfaz gráfica, la incorporación imprime instrucciones de reenvío de puertos SSH para la Control UI en lugar de abrir un navegador.
Si faltan los recursos de la Control UI, la incorporación intenta compilarlos; el fallback es `pnpm ui:build` (instala automáticamente las dependencias de la interfaz).
</Note>

## Modo no interactivo

Usa `--non-interactive --accept-risk` para automatizar o programar la incorporación (la
marca es la aceptación de riesgo requerida; la incorporación sale con un error
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

Añade `--json` para obtener un resumen legible por máquina.

SecretRef de token de Gateway en modo no interactivo:

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
`--json` **no** implica el modo no interactivo. Usa `--non-interactive --accept-risk` (y `--workspace`) para scripts.
</Note>

Los ejemplos de comandos específicos de proveedor están en [Automatización de CLI](/es/start/wizard-cli-automation#provider-specific-examples).
Usa esta página de referencia para la semántica de las marcas y el orden de los pasos.

### Añadir agente (no interactivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` es un id de agente reservado y no se puede usar con `openclaw agents add`.

## RPC del asistente de Gateway

Gateway expone el flujo de incorporación por RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (app de macOS, Control UI) pueden renderizar los pasos sin volver a implementar la lógica de incorporación.

## Configuración de Signal (signal-cli)

La incorporación detecta si `signal-cli` está en `PATH` y, si falta, ofrece instalarlo:

- Linux x86-64: descarga la compilación nativa oficial de GraalVM desde las versiones de GitHub de `signal-cli` y la guarda en `~/.openclaw/tools/signal-cli/<version>/`.
- macOS y otras arquitecturas: instala mediante Homebrew en su lugar.
- Windows nativo: aún no es compatible; ejecuta la incorporación dentro de WSL2 para obtener la ruta de instalación de Linux.
- Escribe `channels.signal.cliPath` en tu configuración de cualquier forma.

## Qué escribe el asistente

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se pasa `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (la incorporación local usa `"coding"` de forma predeterminada cuando no está definido; los valores explícitos existentes se conservan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (la incorporación local establece esto en `"per-channel-peer"` de forma predeterminada cuando no está definido; los valores explícitos existentes se conservan. Detalles: [Referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos para MD de canales cuando aceptas durante las solicitudes de canal. Discord, Matrix, Microsoft Teams y Slack resuelven nombres a IDs cuando es posible; otros canales toman IDs directamente (por ejemplo, IDs numéricos de remitente de Telegram o números de teléfono de WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual todavía puede usar `yarn` estableciendo `skills.install.nodeManager` directamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp van en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

Algunos canales se entregan como plugins. Cuando eliges uno durante la configuración, la incorporación
te pedirá instalarlo (npm o una ruta local) antes de poder configurarlo.

## Documentos relacionados

- Descripción general de la incorporación: [Incorporación (CLI)](/es/start/wizard)
- Referencia de configuración de CLI: [Referencia de configuración de CLI](/es/start/wizard-cli-reference)
- Incorporación de la app de macOS: [Incorporación](/es/start/onboarding)
- Referencia de configuración: [Configuración de Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [iMessage](/es/channels/imessage)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
