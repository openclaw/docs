---
read_when:
    - Consultar un paso o indicador específico de incorporación
    - Automatizar la incorporación con modo no interactivo
    - Depurar el comportamiento de la incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa de la incorporación por CLI: cada paso, indicador y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-04-24T05:50:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

Esta es la referencia completa de `openclaw onboard`.
Para una descripción general de alto nivel, consulta [Onboarding (CLI)](/es/start/wizard).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige **Keep / Modify / Reset**.
    - Volver a ejecutar onboarding **no** borra nada a menos que elijas explícitamente **Reset**
      (o pases `--reset`).
    - `--reset` en CLI usa por defecto `config+creds+sessions`; usa `--reset-scope full`
      para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y te pide
      ejecutar `openclaw doctor` antes de continuar.
    - Reset usa `trash` (nunca `rm`) y ofrece alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)
  </Step>
  <Step title="Modelo/Autenticación">
    - **Clave API de Anthropic**: usa `ANTHROPIC_API_KEY` si está presente o solicita una clave y luego la guarda para uso del daemon.
    - **Clave API de Anthropic**: opción preferida del asistente de Anthropic en onboarding/configure.
    - **Setup-token de Anthropic**: sigue disponible en onboarding/configure, aunque OpenClaw ahora prefiere reutilizar Claude CLI cuando está disponible.
    - **Suscripción OpenAI Code (Codex) (OAuth)**: flujo por navegador; pega el `code#state`.
      - Establece `agents.defaults.model` en `openai-codex/gpt-5.5` cuando el modelo no está configurado o ya es de la familia OpenAI.
    - **Suscripción OpenAI Code (Codex) (emparejamiento por dispositivo)**: flujo de emparejamiento por navegador con un código de dispositivo de corta duración.
      - Establece `agents.defaults.model` en `openai-codex/gpt-5.5` cuando el modelo no está configurado o ya es de la familia OpenAI.
    - **Clave API de OpenAI**: usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego la almacena en perfiles de autenticación.
      - Establece `agents.defaults.model` en `openai/gpt-5.4` cuando el modelo no está configurado, es `openai/*` o `openai-codex/*`.
    - **Clave API de xAI (Grok)**: solicita `XAI_API_KEY` y configura xAI como proveedor de modelos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, obtenla en https://opencode.ai/auth) y te permite elegir el catálogo Zen o Go.
    - **Ollama**: ofrece primero **Cloud + Local**, **Cloud only** o **Local only**. `Cloud only` solicita `OLLAMA_API_KEY` y usa `https://ollama.com`; los modos respaldados por host solicitan la URL base de Ollama, descubren modelos disponibles y descargan automáticamente el modelo local seleccionado cuando es necesario; `Cloud + Local` también comprueba si ese host de Ollama ha iniciado sesión para acceso cloud.
    - Más detalles: [Ollama](/es/providers/ollama)
    - **Clave API**: guarda la clave por ti.
    - **Vercel AI Gateway (proxy multi-modelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más detalles: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor predeterminado alojado es `MiniMax-M2.7`.
      La configuración con clave API usa `minimax/...`, y la configuración OAuth usa
      `minimax-portal/...`.
    - Más detalles: [MiniMax](/es/providers/minimax)
    - **StepFun**: la configuración se escribe automáticamente para StepFun standard o Step Plan en endpoints de China o globales.
    - Standard incluye actualmente `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    - Más detalles: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más detalles: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Skip**: aún no se configura ninguna autenticación.
    - Elige un modelo predeterminado entre las opciones detectadas (o introduce manualmente provider/model). Para obtener la mejor calidad y menor riesgo de inyección de prompt, elige el modelo de última generación más potente disponible en tu pila de proveedores.
    - Onboarding ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o carece de autenticación.
    - El modo de almacenamiento de claves API usa por defecto valores de perfil de autenticación en texto plano. Usa `--secret-input-mode ref` para almacenar en su lugar referencias respaldadas por env (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Los perfiles de autenticación viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves API + OAuth). `~/.openclaw/credentials/oauth.json` es solo heredado para importación.
    - Más detalles: [/concepts/oauth](/es/concepts/oauth)
    <Note>
    Consejo para headless/servidor: completa OAuth en una máquina con navegador y luego copia
    el `auth-profiles.json` de ese agente (por ejemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
    `$OPENCLAW_STATE_DIR/...`) al host del gateway. `credentials/oauth.json`
    es solo una fuente heredada de importación.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Predeterminado `~/.openclaw/workspace` (configurable).
    - Siembra los archivos del espacio de trabajo necesarios para el ritual bootstrap del agente.
    - Diseño completo del espacio de trabajo + guía de copia de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Puerto, bind, modo de autenticación, exposición por Tailscale.
    - Recomendación de autenticación: mantén **Token** incluso para loopback para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generate/store plaintext token** (predeterminado)
      - **Use SecretRef** (opcional)
      - Quickstart reutiliza SecretRefs existentes de `gateway.auth.token` en proveedores `env`, `file` y `exec` para el sondeo/bootstrap del panel de onboarding.
      - Si ese SecretRef está configurado pero no puede resolverse, onboarding falla pronto con un mensaje claro de corrección en lugar de degradar silenciosamente la autenticación del entorno de ejecución.
    - En modo password, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta no interactiva de token SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable env no vacía en el entorno del proceso de onboarding.
      - No puede combinarse con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en todos los procesos locales.
    - Los binds no loopback siguen requiriendo autenticación.
  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional con QR.
    - [Telegram](/es/channels/telegram): token del bot.
    - [Discord](/es/channels/discord): token del bot.
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de webhook.
    - [Mattermost](/es/channels/mattermost) (Plugin): token del bot + URL base.
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta.
    - [BlueBubbles](/es/channels/bluebubbles): **recomendado para iMessage**; URL del servidor + contraseña + webhook.
    - [iMessage](/es/channels/imessage): ruta heredada de CLI `imsg` + acceso a BD.
    - Seguridad de mensajes directos: el valor predeterminado es emparejamiento. El primer mensaje directo envía un código; apruébalo con `openclaw pairing approve <channel> <code>` o usa allowlists.
  </Step>
  <Step title="Búsqueda web">
    - Elige un proveedor compatible como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (o sáltalo).
    - Los proveedores respaldados por API pueden usar variables env o configuración existente para una instalación rápida; los proveedores sin clave usan en su lugar sus requisitos específicos.
    - Omitir con `--skip-search`.
    - Configurar más tarde: `openclaw configure --section web`.
  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para headless, usa un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows mediante WSL2): unidad de usuario systemd
      - Onboarding intenta habilitar lingering mediante `loginctl enable-linger <user>` para que el Gateway siga activo después de cerrar sesión.
      - Puede pedir sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - **Selección de entorno de ejecución:** Node (recomendado; obligatorio para WhatsApp/Telegram). Bun **no se recomienda**.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida, pero no conserva valores de token resueltos en texto plano en los metadatos del entorno del servicio supervisor.
    - Si la autenticación por token requiere un token y el SecretRef configurado del token no se resuelve, la instalación del daemon se bloquea con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está configurado, la instalación del daemon se bloquea hasta que el modo se configure explícitamente.
  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade el sondeo de estado del gateway en vivo a la salida de estado, incluidas sondas de canal cuando son compatibles (requiere un gateway accesible).
  </Step>
  <Step title="Skills (recomendado)">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir un administrador de Node: **npm / pnpm** (bun no recomendado).
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).
  </Step>
  <Step title="Finalizar">
    - Resumen + pasos siguientes, incluidas apps iOS/Android/macOS para funciones adicionales.
  </Step>
</Steps>

<Note>
Si no se detecta GUI, onboarding imprime instrucciones de reenvío de puerto SSH para Control UI en lugar de abrir un navegador.
Si faltan los recursos de Control UI, onboarding intenta compilarlos; el respaldo es `pnpm ui:build` (instala automáticamente dependencias de UI).
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

Añade `--json` para un resumen legible por máquinas.

Gateway token SecretRef en modo no interactivo:

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

Los ejemplos de comandos específicos por proveedor se encuentran en [Automatización de CLI](/es/start/wizard-cli-automation#provider-specific-examples).
Usa esta página de referencia para la semántica de indicadores y el orden de los pasos.

### Añadir agente (no interactivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC del asistente de Gateway

Gateway expone el flujo de onboarding mediante RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (app de macOS, Control UI) pueden representar los pasos sin volver a implementar la lógica de onboarding.

## Configuración de Signal (signal-cli)

Onboarding puede instalar `signal-cli` desde GitHub releases:

- Descarga el recurso de versión apropiado.
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- Escribe `channels.signal.cliPath` en tu configuración.

Notas:

- Las compilaciones JVM requieren **Java 21**.
- Las compilaciones nativas se usan cuando están disponibles.
- Windows usa WSL2; la instalación de signal-cli sigue el flujo de Linux dentro de WSL.

## Qué escribe el asistente

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se elige MiniMax)
- `tools.profile` (el onboarding local usa por defecto `"coding"` cuando no está configurado; los valores explícitos existentes se conservan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (detalles de comportamiento: [Referencia de configuración CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack/Discord/Matrix/Microsoft Teams) cuando las activas durante los prompts (los nombres se resuelven a IDs cuando es posible).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual todavía puede usar `yarn` estableciendo `skills.install.nodeManager` directamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp van en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

Algunos canales se entregan como Plugins. Cuando eliges uno durante la configuración, onboarding
te pedirá instalarlo (npm o una ruta local) antes de poder configurarlo.

## Documentación relacionada

- Resumen de onboarding: [Onboarding (CLI)](/es/start/wizard)
- Onboarding de la app de macOS: [Onboarding](/es/start/onboarding)
- Referencia de configuración: [Configuración de Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [BlueBubbles](/es/channels/bluebubbles) (iMessage), [iMessage](/es/channels/imessage) (heredado)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
