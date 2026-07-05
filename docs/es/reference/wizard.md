---
read_when:
    - Buscando un paso o una marca de incorporación específicos
    - Automatizar la incorporación con el modo no interactivo
    - Depurar el comportamiento de incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa para la configuración inicial de CLI: cada paso, opción y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-07-05T01:58:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bc46146f8cf1a74d3b6573e58cf4d2dde945aa6889dda8a9c8a71dcfa8fce30
    source_path: reference/wizard.md
    workflow: 16
---

Esta es la referencia completa de `openclaw onboard`.
Para una descripción general de alto nivel, consulta [Onboarding (CLI)](/es/start/wizard).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Detección de configuración existente">
    - Si `~/.openclaw/openclaw.json` existe, elige **Mantener los valores actuales**, **Revisar y actualizar** o **Restablecer antes de configurar**.
    - Volver a ejecutar el onboarding **no** borra nada a menos que elijas explícitamente **Restablecer**
      (o pases `--reset`).
    - CLI `--reset` usa `config+creds+sessions` de forma predeterminada; usa `--reset-scope full`
      para eliminar también el workspace.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y te pide
      ejecutar `openclaw doctor` antes de continuar.
    - El restablecimiento usa `trash` (nunca `rm`) y ofrece estos alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el workspace)

  </Step>
  <Step title="Modelo/autenticación">
    - **Clave de API de Anthropic**: usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, y luego la guarda para uso del daemon.
    - **Clave de API de Anthropic**: opción preferida del asistente de Anthropic en onboarding/configuración.
    - **setup-token de Anthropic**: sigue disponible en onboarding/configuración, aunque OpenClaw ahora prefiere reutilizar Claude CLI cuando está disponible.
    - **Suscripción a OpenAI Code (Codex) (OAuth)**: flujo del navegador; pega el `code#state`.
      - Establece `agents.defaults.model` en `openai/gpt-5.5` mediante el runtime de Codex cuando el modelo no está definido o ya pertenece a la familia OpenAI.
    - **Suscripción a OpenAI Code (Codex) (emparejamiento de dispositivo)**: flujo de emparejamiento del navegador con un código de dispositivo de corta duración.
      - Establece `agents.defaults.model` en `openai/gpt-5.5` mediante el runtime de Codex cuando el modelo no está definido o ya pertenece a la familia OpenAI.
    - **Clave de API de OpenAI**: usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego la guarda en perfiles de autenticación.
      - Establece `agents.defaults.model` en `openai/gpt-5.5` cuando el modelo no está definido, es `openai/*` o son referencias heredadas de modelos Codex.
    - **xAI (Grok) OAuth / clave de API**: inicia sesión con xAI OAuth cuando se elige, o solicita `XAI_API_KEY` en la ruta de clave de API, y configura xAI como proveedor de modelos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, consíguela en https://opencode.ai/auth) y te permite elegir el catálogo Zen o Go.
    - **Ollama**: ofrece primero **Nube + local**, **Solo nube** o **Solo local**. `Cloud only` solicita `OLLAMA_API_KEY` y usa `https://ollama.com`; los modos respaldados por host solicitan la URL base de Ollama, descubren los modelos disponibles y descargan automáticamente el modelo local seleccionado cuando es necesario; `Cloud + Local` también comprueba si ese host de Ollama tiene sesión iniciada para acceso en la nube.
    - Más detalles: [Ollama](/es/providers/ollama)
    - **Clave de API**: guarda la clave por ti.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más detalles: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita el ID de cuenta, el ID de Gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor predeterminado alojado es `MiniMax-M3`.
      La configuración con clave de API usa `minimax/...`, y la configuración OAuth usa
      `minimax-portal/...`.
    - Más detalles: [MiniMax](/es/providers/minimax)
    - **StepFun**: la configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    - El estándar actualmente incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    - Más detalles: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más detalles: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Omitir**: aún no se ha configurado autenticación.
    - Elige un modelo predeterminado de las opciones detectadas (o introduce proveedor/modelo manualmente). Para obtener la mejor calidad y reducir el riesgo de inyección de prompts, elige el modelo de última generación más potente disponible en tu stack de proveedores.
    - El onboarding ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o no tiene autenticación.
    - El modo de almacenamiento de claves de API usa de forma predeterminada valores de perfil de autenticación en texto plano. Usa `--secret-input-mode ref` para almacenar en su lugar referencias respaldadas por env (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Los perfiles de autenticación viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves de API + OAuth). `~/.openclaw/credentials/oauth.json` es solo de importación heredada.
    - Más detalles: [/concepts/oauth](/es/concepts/oauth)
    <Note>
    Consejo para headless/servidor: completa OAuth en una máquina con navegador y luego copia
    el `auth-profiles.json` de ese agente (por ejemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
    `$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
    es solo una fuente de importación heredada.
    </Note>
  </Step>
  <Step title="Workspace">
    - `~/.openclaw/workspace` predeterminado (configurable).
    - Inicializa los archivos del workspace necesarios para el ritual de arranque del agente.
    - Diseño completo del workspace + guía de copia de seguridad: [Workspace del agente](/es/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Puerto, enlace, modo de autenticación, exposición de tailscale.
    - Recomendación de autenticación: mantén **Token** incluso para loopback, para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/guardar token en texto plano** (predeterminado)
      - **Usar SecretRef** (opt-in)
      - Quickstart reutiliza SecretRefs existentes de `gateway.auth.token` entre proveedores `env`, `file` y `exec` para la sonda de onboarding y el arranque del panel.
      - Si ese SecretRef está configurado pero no puede resolverse, el onboarding falla pronto con un mensaje de corrección claro en lugar de degradar silenciosamente la autenticación del runtime.
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de onboarding.
      - No se puede combinar con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en todos los procesos locales.
    - Los enlaces que no son loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión QR opcional.
    - [Telegram](/es/channels/telegram): token del bot.
    - [Discord](/es/channels/discord): token del bot.
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de webhook.
    - [Mattermost](/es/channels/mattermost) (plugin): token del bot + URL base.
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta.
    - [iMessage](/es/channels/imessage): ruta de CLI `imsg` + acceso a la base de datos de Messages; usa un contenedor SSH cuando el Gateway se ejecuta fuera de Mac.
    - Seguridad de DM: el valor predeterminado es el emparejamiento. El primer DM envía un código; apruébalo con `openclaw pairing approve <channel> <code>` o usa listas de permitidos.

  </Step>
  <Step title="Búsqueda web">
    - Elige un proveedor compatible como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (u omite este paso).
    - Los proveedores respaldados por API pueden usar variables de entorno o configuración existente para una configuración rápida; los proveedores sin clave usan en su lugar sus prerrequisitos específicos del proveedor.
    - Omitir con `--skip-search`.
    - Configurar más tarde: `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para headless, usa un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows mediante WSL2): unidad de usuario systemd
      - Onboarding intenta habilitar lingering mediante `loginctl enable-linger <user>` para que el Gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - **Selección de runtime:** la configuración interactiva solo ofrece **Node**. WhatsApp y Telegram requieren Node; Bun puede corromper la memoria al reconectar, y `openclaw doctor` marca los servicios Gateway basados en Bun como incompatibles con esos canales.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida pero no persiste valores de token en texto plano resueltos en los metadatos del entorno del servicio supervisor.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no se resuelve, la instalación del daemon se bloquea con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación del daemon se bloquea hasta que el modo se establezca explícitamente.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` agrega la sonda de estado del gateway en vivo a la salida de estado, incluidas las sondas de canal cuando son compatibles (requiere un gateway alcanzable).

  </Step>
  <Step title="Skills (recomendado)">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir un gestor de Node: **npm / pnpm** (bun no recomendado).
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).

  </Step>
  <Step title="Finalizar">
    - Resumen + próximos pasos, incluido el prompt **¿Cómo quieres incubar tu agente?** para Terminal, navegador o más tarde.

  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, el onboarding imprime instrucciones de reenvío de puertos SSH para la UI de control en lugar de abrir un navegador.
Si faltan los recursos de la UI de control, el onboarding intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la UI).
</Note>

## Modo no interactivo

Usa `--non-interactive` para automatizar o crear scripts de onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Agrega `--json` para un resumen legible por máquina.

SecretRef de token de Gateway en modo no interactivo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.

<Note>
`--json` **no** implica modo no interactivo. Usa `--non-interactive` (y `--workspace`) para scripts.
</Note>

Los ejemplos de comandos específicos de proveedor están en [Automatización de CLI](/es/start/wizard-cli-automation#provider-specific-examples).
Usa esta página de referencia para la semántica de flags y el orden de los pasos.

### Agregar agente (no interactivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC del asistente del Gateway

El Gateway expone el flujo de onboarding mediante RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (app de macOS, UI de control) pueden renderizar pasos sin volver a implementar la lógica de onboarding.

## Configuración de Signal (signal-cli)

Onboarding puede instalar `signal-cli` por ti:

- Linux x64: descarga la compilación nativa oficial desde las versiones de GitHub y la almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- macOS y otras plataformas sin compilación de versión nativa: instala mediante Homebrew (`brew install signal-cli`).
- Windows: la instalación automática aún no es compatible; instala `signal-cli` manualmente y apunta `channels.signal.cliPath` a él. Dentro de WSL2 se aplica el flujo de Linux.
- La ruta binaria resuelta se escribe en `channels.signal.cliPath` en tu configuración.

## Lo que escribe el asistente

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se eligió Minimax)
- `tools.profile` (la configuración inicial local usa `"coding"` de forma predeterminada cuando no está definido; se conservan los valores explícitos existentes)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (detalles de comportamiento: [Referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de DM del canal cuando aceptas durante las indicaciones del canal. Discord, Matrix, Microsoft Teams y Slack resuelven nombres a ID cuando es posible; otros canales toman ID directamente (por ejemplo, ID numéricos de remitente de Telegram o números de teléfono de WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede usar `yarn` definiendo `skills.install.nodeManager` directamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp van en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

Algunos canales se entregan como plugins. Cuando eliges uno durante la configuración, la configuración inicial
te pedirá instalarlo (npm o una ruta local) antes de poder configurarlo.

## Documentación relacionada

- Resumen de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Incorporación en la aplicación de macOS: [Incorporación](/es/start/onboarding)
- Referencia de configuración: [Configuración de Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [iMessage](/es/channels/imessage)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
