---
read_when:
    - Consultar un paso de incorporación o una opción específicos
    - Automatizar la incorporación con el modo no interactivo
    - Depuración del comportamiento de incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa para la incorporación con CLI: cada paso, opción y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-04-30T06:01:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

Esta es la referencia completa para `openclaw onboard`.
Para una descripción general de alto nivel, consulta [Onboarding (CLI)](/es/start/wizard).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Detección de configuración existente">
    - Si `~/.openclaw/openclaw.json` existe, elige **Conservar / Modificar / Restablecer**.
    - Volver a ejecutar el onboarding **no** borra nada a menos que elijas explícitamente **Restablecer**
      (o pases `--reset`).
    - CLI `--reset` usa de forma predeterminada `config+creds+sessions`; usa `--reset-scope full`
      para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y te pide
      ejecutar `openclaw doctor` antes de continuar.
    - El restablecimiento usa `trash` (nunca `rm`) y ofrece alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)

  </Step>
  <Step title="Modelo/autenticación">
    - **Clave de API de Anthropic**: usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, y luego la guarda para uso del daemon.
    - **Clave de API de Anthropic**: opción preferida de asistente Anthropic en onboarding/configure.
    - **setup-token de Anthropic**: sigue disponible en onboarding/configure, aunque OpenClaw ahora prefiere reutilizar Claude CLI cuando está disponible.
    - **Suscripción a OpenAI Code (Codex) (OAuth)**: flujo en navegador; pega el `code#state`.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.5` cuando el modelo no está definido o ya pertenece a la familia OpenAI.
    - **Suscripción a OpenAI Code (Codex) (emparejamiento de dispositivo)**: flujo de emparejamiento en navegador con un código de dispositivo de corta duración.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.5` cuando el modelo no está definido o ya pertenece a la familia OpenAI.
    - **Clave de API de OpenAI**: usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego la almacena en perfiles de autenticación.
      - Define `agents.defaults.model` como `openai/gpt-5.5` cuando el modelo no está definido, es `openai/*` o `openai-codex/*`.
    - **Clave de API de xAI (Grok)**: solicita `XAI_API_KEY` y configura xAI como proveedor de modelos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, consíguela en https://opencode.ai/auth) y te permite elegir el catálogo Zen o Go.
    - **Ollama**: primero ofrece **Cloud + Local**, **Solo Cloud** o **Solo local**. `Cloud only` solicita `OLLAMA_API_KEY` y usa `https://ollama.com`; los modos respaldados por host solicitan la URL base de Ollama, detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado cuando es necesario; `Cloud + Local` también comprueba si ese host de Ollama tiene sesión iniciada para acceso en la nube.
    - Más detalles: [Ollama](/es/providers/ollama)
    - **Clave de API**: almacena la clave por ti.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más detalles: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita el ID de cuenta, el ID de Gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor hospedado predeterminado es `MiniMax-M2.7`.
      La configuración con clave de API usa `minimax/...`, y la configuración con OAuth usa
      `minimax-portal/...`.
    - Más detalles: [MiniMax](/es/providers/minimax)
    - **StepFun**: la configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    - Actualmente, Standard incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    - Más detalles: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más detalles: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Omitir**: aún no se ha configurado autenticación.
    - Elige un modelo predeterminado entre las opciones detectadas (o introduce proveedor/modelo manualmente). Para obtener la mejor calidad y un menor riesgo de inyección de prompts, elige el modelo más potente de última generación disponible en tu conjunto de proveedores.
    - El onboarding ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o no tiene autenticación.
    - El modo de almacenamiento de claves de API usa de forma predeterminada valores de perfil de autenticación en texto plano. Usa `--secret-input-mode ref` para almacenar en su lugar referencias respaldadas por variables de entorno (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Los perfiles de autenticación están en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves de API + OAuth). `~/.openclaw/credentials/oauth.json` es solo una importación heredada.
    - Más detalles: [/concepts/oauth](/es/concepts/oauth)
    <Note>
    Consejo para entornos headless/servidor: completa OAuth en una máquina con navegador y luego copia
    el `auth-profiles.json` de ese agente (por ejemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
    `$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
    es solo una fuente de importación heredada.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Predeterminado `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del espacio de trabajo necesarios para el ritual de arranque del agente.
    - Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Puerto, enlace, modo de autenticación, exposición de Tailscale.
    - Recomendación de autenticación: conserva **Token** incluso para loopback, para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto plano** (predeterminado)
      - **Usar SecretRef** (opcional)
      - Quickstart reutiliza los SecretRefs existentes de `gateway.auth.token` entre proveedores `env`, `file` y `exec` para la inicialización del sondeo/dashboard de onboarding.
      - Si ese SecretRef está configurado pero no se puede resolver, el onboarding falla pronto con un mensaje de corrección claro en vez de degradar silenciosamente la autenticación en tiempo de ejecución.
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta de SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de onboarding.
      - No se puede combinar con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en todos los procesos locales.
    - Los enlaces que no sean loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión QR opcional.
    - [Telegram](/es/channels/telegram): token de bot.
    - [Discord](/es/channels/discord): token de bot.
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de webhook.
    - [Mattermost](/es/channels/mattermost) (plugin): token de bot + URL base.
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta.
    - [BlueBubbles](/es/channels/bluebubbles): **recomendado para iMessage**; URL del servidor + contraseña + webhook.
    - [iMessage](/es/channels/imessage): ruta heredada de CLI `imsg` + acceso a la base de datos.
    - Seguridad de DM: el valor predeterminado es el emparejamiento. El primer DM envía un código; apruébalo mediante `openclaw pairing approve <channel> <code>` o usa listas de permitidos.

  </Step>
  <Step title="Búsqueda web">
    - Elige un proveedor compatible como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (u omítelo).
    - Los proveedores respaldados por API pueden usar variables de entorno o la configuración existente para una configuración rápida; los proveedores sin clave usan en su lugar sus prerrequisitos específicos del proveedor.
    - Omite con `--skip-search`.
    - Configura más tarde: `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para headless, usa un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows mediante WSL2): unidad de usuario systemd
      - El onboarding intenta habilitar la persistencia mediante `loginctl enable-linger <user>` para que el Gateway permanezca activo después de cerrar sesión.
      - Puede solicitar sudo (escribe `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - **Selección de tiempo de ejecución:** Node (recomendado; necesario para WhatsApp/Telegram). Bun **no está recomendado**.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida pero no conserva valores de token en texto plano resueltos en los metadatos de entorno del servicio supervisor.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no se puede resolver, la instalación del daemon se bloquea con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación del daemon se bloquea hasta que el modo se defina explícitamente.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade el sondeo de estado del gateway en vivo a la salida de estado, incluidos los sondeos de canales cuando son compatibles (requiere un gateway accesible).

  </Step>
  <Step title="Skills (recomendado)">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir un gestor de node: **npm / pnpm** (bun no está recomendado).
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).

  </Step>
  <Step title="Finalizar">
    - Resumen + próximos pasos, incluidas las aplicaciones iOS/Android/macOS para funciones adicionales.

  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, el onboarding imprime instrucciones de reenvío de puertos SSH para la interfaz de Control en lugar de abrir un navegador.
Si faltan los recursos de la interfaz de Control, el onboarding intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la interfaz).
</Note>

## Modo no interactivo

Usa `--non-interactive` para automatizar o programar el onboarding:

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

Añade `--json` para obtener un resumen legible por máquina.

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

Los ejemplos de comandos específicos del proveedor están en [Automatización de CLI](/es/start/wizard-cli-automation#provider-specific-examples).
Usa esta página de referencia para la semántica de flags y el orden de los pasos.

### Añadir agente (no interactivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC del asistente de Gateway

El Gateway expone el flujo de onboarding mediante RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (aplicación macOS, interfaz de Control) pueden representar los pasos sin volver a implementar la lógica de onboarding.

## Configuración de Signal (signal-cli)

El onboarding puede instalar `signal-cli` desde las versiones de GitHub:

- Descarga el recurso de versión adecuado.
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- Escribe `channels.signal.cliPath` en tu configuración.

Notas:

- Las compilaciones JVM requieren **Java 21**.
- Las compilaciones nativas se usan cuando están disponibles.
- Windows usa WSL2; la instalación de signal-cli sigue el flujo de Linux dentro de WSL.

## Qué escribe el asistente

Campos habituales en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se elige Minimax)
- `tools.profile` (la incorporación local usa `"coding"` de forma predeterminada cuando no se ha establecido; los valores explícitos existentes se conservan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (detalles de comportamiento: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Slack/Discord/Matrix/Microsoft Teams) cuando aceptas durante las indicaciones (los nombres se resuelven a ID cuando es posible).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede usar `yarn` estableciendo `skills.install.nodeManager` directamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp van en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

Algunos canales se entregan como plugins. Cuando eliges uno durante la configuración, la incorporación
te pedirá instalarlo (npm o una ruta local) antes de que se pueda configurar.

## Documentación relacionada

- Resumen de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Incorporación de la app de macOS: [Incorporación](/es/start/onboarding)
- Referencia de configuración: [Configuración del Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [BlueBubbles](/es/channels/bluebubbles) (iMessage), [iMessage](/es/channels/imessage) (heredado)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
