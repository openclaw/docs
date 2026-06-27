---
read_when:
    - Consultar un paso o indicador específico de incorporación
    - Automatización de la incorporación con el modo no interactivo
    - Depuración del comportamiento de incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa para la incorporación por CLI: cada paso, flag y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-06-27T12:56:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

Esta es la referencia completa de `openclaw onboard`.
Para una descripción general de alto nivel, consulta [Onboarding (CLI)](/es/start/wizard).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Detección de configuración existente">
    - Si `~/.openclaw/openclaw.json` existe, elige **Mantener valores actuales**, **Revisar y actualizar** o **Restablecer antes de configurar**.
    - Volver a ejecutar el onboarding **no** borra nada a menos que elijas explícitamente **Restablecer**
      (o pases `--reset`).
    - CLI `--reset` usa `config+creds+sessions` de forma predeterminada; usa `--reset-scope full`
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
    - **Clave de API de Anthropic**: opción preferida del asistente Anthropic en onboarding/configure.
    - **setup-token de Anthropic**: sigue disponible en onboarding/configure, aunque OpenClaw ahora prefiere reutilizar Claude CLI cuando esté disponible.
    - **Suscripción a OpenAI Code (Codex) (OAuth)**: flujo en navegador; pega el `code#state`.
      - Define `agents.defaults.model` como `openai/gpt-5.5` a través del runtime de Codex cuando el modelo no está definido o ya pertenece a la familia OpenAI.
    - **Suscripción a OpenAI Code (Codex) (emparejamiento de dispositivo)**: flujo de emparejamiento en navegador con un código de dispositivo de corta duración.
      - Define `agents.defaults.model` como `openai/gpt-5.5` a través del runtime de Codex cuando el modelo no está definido o ya pertenece a la familia OpenAI.
    - **Clave de API de OpenAI**: usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego la almacena en perfiles de autenticación.
      - Define `agents.defaults.model` como `openai/gpt-5.5` cuando el modelo no está definido, es `openai/*` o referencias de modelo Codex heredadas.
    - **OAuth / clave de API de xAI (Grok)**: inicia sesión con OAuth de xAI cuando se elige, o solicita `XAI_API_KEY` en la ruta de clave de API, y configura xAI como proveedor de modelos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, obtenla en https://opencode.ai/auth) y te permite elegir el catálogo Zen o Go.
    - **Ollama**: primero ofrece **Nube + local**, **Solo nube** o **Solo local**. `Cloud only` solicita `OLLAMA_API_KEY` y usa `https://ollama.com`; los modos respaldados por host solicitan la URL base de Ollama, descubren modelos disponibles y descargan automáticamente el modelo local seleccionado cuando hace falta; `Cloud + Local` también comprueba si ese host de Ollama tiene sesión iniciada para acceso en la nube.
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
    - Standard actualmente incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    - Más detalle: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más detalle: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más detalle: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Omitir**: aún no se configura autenticación.
    - Elige un modelo predeterminado entre las opciones detectadas (o introduce proveedor/modelo manualmente). Para obtener la mejor calidad y menor riesgo de inyección de prompts, elige el modelo de última generación más potente disponible en tu pila de proveedores.
    - El onboarding ejecuta una comprobación de modelo y advierte si el modelo configurado es desconocido o no tiene autenticación.
    - El modo de almacenamiento de clave de API usa de forma predeterminada valores de perfil de autenticación en texto plano. Usa `--secret-input-mode ref` para almacenar en su lugar referencias respaldadas por variables de entorno (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Los perfiles de autenticación viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves de API + OAuth). `~/.openclaw/credentials/oauth.json` solo es importación heredada.
    - Más detalle: [/concepts/oauth](/es/concepts/oauth)
    <Note>
    Consejo para servidores/headless: completa OAuth en una máquina con navegador y luego copia
    el `auth-profiles.json` de ese agente (por ejemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
    `$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
    es solo una fuente de importación heredada.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del espacio de trabajo necesarios para el ritual de arranque del agente.
    - Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Puerto, bind, modo de autenticación, exposición de Tailscale.
    - Recomendación de autenticación: mantén **Token** incluso para loopback, de modo que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto plano** (predeterminado)
      - **Usar SecretRef** (opt-in)
      - Quickstart reutiliza SecretRefs `gateway.auth.token` existentes en proveedores `env`, `file` y `exec` para la sonda de onboarding/arranque del dashboard.
      - Si ese SecretRef está configurado pero no se puede resolver, el onboarding falla temprano con un mensaje de corrección claro en lugar de degradar silenciosamente la autenticación del runtime.
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de onboarding.
      - No se puede combinar con `--gateway-token`.
    - Deshabilita la autenticación solo si confías plenamente en todos los procesos locales.
    - Los binds que no son loopback siguen requiriendo autenticación.

  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión QR opcional.
    - [Telegram](/es/channels/telegram): token de bot.
    - [Discord](/es/channels/discord): token de bot.
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de webhook.
    - [Mattermost](/es/channels/mattermost) (plugin): token de bot + URL base.
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta.
    - [iMessage](/es/channels/imessage): ruta de CLI `imsg` + acceso a la base de datos de Messages; usa un contenedor SSH cuando el Gateway se ejecute fuera de Mac.
    - Seguridad de DM: el valor predeterminado es emparejamiento. El primer DM envía un código; apruébalo mediante `openclaw pairing approve <channel> <code>` o usa listas de permitidos.

  </Step>
  <Step title="Búsqueda web">
    - Elige un proveedor compatible como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (u omite).
    - Los proveedores respaldados por API pueden usar variables de entorno o configuración existente para una configuración rápida; los proveedores sin clave usan sus requisitos previos específicos del proveedor.
    - Omite con `--skip-search`.
    - Configura más tarde: `openclaw configure --section web`.

  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para headless, usa un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows vía WSL2): unidad de usuario systemd
      - El onboarding intenta habilitar lingering mediante `loginctl enable-linger <user>` para que el Gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - **Selección de runtime:** Node (recomendado; requerido para WhatsApp/Telegram). Bun **no se recomienda**.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida pero no persiste valores de token en texto plano resueltos en los metadatos de entorno del servicio supervisor.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no se resuelve, la instalación del daemon se bloquea con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación del daemon se bloquea hasta que el modo se defina explícitamente.

  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si hace falta) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade la sonda de estado del gateway en vivo a la salida de estado, incluidas las sondas de canal cuando estén soportadas (requiere un gateway accesible).

  </Step>
  <Step title="Skills (recomendado)">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir un gestor de node: **npm / pnpm** (bun no recomendado).
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).

  </Step>
  <Step title="Finalizar">
    - Resumen + próximos pasos, incluido el prompt **¿Cómo quieres incubar tu agente?** para Terminal, Navegador o más tarde.

  </Step>
</Steps>

<Note>
Si no se detecta GUI, el onboarding imprime instrucciones de reenvío de puertos SSH para la Control UI en lugar de abrir un navegador.
Si faltan los assets de la Control UI, el onboarding intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de UI).
</Note>

## Modo no interactivo

Usa `--non-interactive` para automatizar o guionizar el onboarding:

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

Añade `--json` para un resumen legible por máquina.

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

El Gateway expone el flujo de onboarding por RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (app de macOS, Control UI) pueden renderizar pasos sin volver a implementar la lógica de onboarding.

## Configuración de Signal (signal-cli)

El onboarding puede instalar `signal-cli` desde releases de GitHub:

- Descarga el asset de release adecuado.
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- Escribe `channels.signal.cliPath` en tu configuración.

Notas:

- Las compilaciones JVM requieren **Java 21**.
- Las compilaciones nativas se usan cuando están disponibles.
- Windows usa WSL2; la instalación de signal-cli sigue el flujo de Linux dentro de WSL.

## Qué escribe el asistente

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se eligió Minimax)
- `tools.profile` (la incorporación local usa `"coding"` de forma predeterminada cuando no está definido; se conservan los valores explícitos existentes)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (detalles de comportamiento: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Slack/Discord/Matrix/Microsoft Teams) cuando aceptas durante las indicaciones (los nombres se resuelven a ID cuando es posible).
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

Algunos canales se entregan como plugins. Cuando eliges uno durante la configuración, la incorporación
te pedirá que lo instales (npm o una ruta local) antes de que se pueda configurar.

## Documentación relacionada

- Descripción general de la incorporación: [Incorporación (CLI)](/es/start/wizard)
- Incorporación de la app de macOS: [Incorporación](/es/start/onboarding)
- Referencia de configuración: [Configuración de Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [iMessage](/es/channels/imessage)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
