---
read_when:
    - Ejecutar o configurar la incorporación de la CLI
    - Configurar una máquina nueva
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI onboarding: configuración guiada de Gateway, espacio de trabajo, canales y Skills'
title: Incorporación (CLI)
x-i18n:
    generated_at: "2026-06-27T12:59:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding es la ruta de configuración de terminal **recomendada** para OpenClaw en
macOS, Linux o Windows. Los usuarios de escritorio de Windows también pueden empezar con
[Windows Hub](/es/platforms/windows).
Configura un Gateway local o una conexión a un Gateway remoto, además de canales, skills
y valores predeterminados del espacio de trabajo en un único flujo guiado.

```bash
openclaw onboard
```

## Configuración regional

El asistente de la CLI localiza el texto fijo del onboarding. Resuelve la configuración regional desde
`OPENCLAW_LOCALE`, luego `LC_ALL`, luego `LC_MESSAGES`, luego `LANG`, y recurre
al inglés. Las configuraciones regionales compatibles del asistente son `en`, `zh-CN` y `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Los nombres y los identificadores estables permanecen literales: `OpenClaw`, `Gateway`, `Tailscale`,
comandos, claves de configuración, URL, ID de proveedor, ID de modelo y etiquetas de plugin/canal
no se traducen.

<Info>
Primer chat más rápido: abre la Control UI (no hace falta configurar canales). Ejecuta
`openclaw dashboard` y chatea en el navegador. Documentación: [Dashboard](/es/web/dashboard).
</Info>

Para reconfigurar más tarde:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica modo no interactivo. Para scripts, usa `--non-interactive`.
</Note>

<Tip>
CLI onboarding incluye un paso de búsqueda web donde puedes elegir un proveedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG o Tavily. Algunos proveedores requieren una
clave de API, mientras que otros no requieren clave. También puedes configurarlo más tarde con
`openclaw configure --section web`. Documentación: [Herramientas web](/es/tools/web).
</Tip>

## QuickStart frente a Advanced

El onboarding empieza con **QuickStart** (valores predeterminados) frente a **Advanced** (control completo).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway local (loopback)
    - Valor predeterminado del espacio de trabajo (o espacio de trabajo existente)
    - Puerto del Gateway **18789**
    - Autenticación del Gateway **Token** (generado automáticamente, incluso en loopback)
    - Valor predeterminado de política de herramientas para nuevas configuraciones locales: `tools.profile: "coding"` (se conserva el perfil explícito existente)
    - Valor predeterminado de aislamiento de DM: el onboarding local escribe `session.dmScope: "per-channel-peer"` cuando no está definido. Detalles: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición de Tailscale **desactivada**
    - Los DM de Telegram + WhatsApp usan **lista de permitidos** de forma predeterminada (se te pedirá tu número de teléfono)

  </Tab>
  <Tab title="Advanced (full control)">
    - Expone cada paso (modo, espacio de trabajo, Gateway, canales, daemon, skills).

  </Tab>
</Tabs>

## Qué configura el onboarding

El **modo local (predeterminado)** te guía por estos pasos:

1. **Modelo/autenticación**: elige cualquier proveedor/flujo de autenticación compatible (clave de API, OAuth o autenticación manual específica del proveedor), incluido Custom Provider
   (compatible con OpenAI, compatible con Anthropic o detección automática Unknown). Elige un modelo predeterminado.
   Nota de seguridad: si este agente ejecutará herramientas o procesará contenido de Webhook/hooks, prefiere el modelo de generación más reciente y potente disponible y mantén estricta la política de herramientas. Los niveles más débiles/antiguos son más fáciles de atacar mediante inyección de prompts.
   Para ejecuciones no interactivas, `--secret-input-mode ref` almacena referencias respaldadas por variables de entorno en perfiles de autenticación en lugar de valores de clave de API en texto plano.
   En modo `ref` no interactivo, la variable de entorno del proveedor debe estar definida; pasar flags de clave en línea sin esa variable de entorno falla de inmediato.
   En ejecuciones interactivas, elegir el modo de referencia secreta te permite apuntar a una variable de entorno o a una referencia de proveedor configurada (`file` o `exec`), con una validación previa rápida antes de guardar.
   Para Anthropic, el onboarding/configure interactivo ofrece **Anthropic Claude CLI** como ruta local preferida y **Anthropic API key** como ruta recomendada para producción. Anthropic setup-token también sigue disponible como ruta de autenticación por token compatible.
2. **Espacio de trabajo**: ubicación de los archivos del agente (predeterminado `~/.openclaw/workspace`). Inicializa archivos de arranque.
3. **Gateway**: puerto, dirección de enlace, modo de autenticación, exposición de Tailscale.
   En modo de token interactivo, elige el almacenamiento de token en texto plano predeterminado u opta por SecretRef.
   Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales**: canales de chat integrados y de plugins oficiales como iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y más.
5. **Daemon**: instala un LaunchAgent (macOS), una unidad de usuario systemd (Linux/WSL2) o una tarea programada nativa de Windows con respaldo de la carpeta de inicio por usuario.
   Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida, pero no persiste el token resuelto en los metadatos de entorno del servicio supervisor.
   Si la autenticación por token requiere un token y el SecretRef de token configurado no se puede resolver, la instalación del daemon se bloquea con orientación accionable.
   Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación del daemon se bloquea hasta que el modo se defina explícitamente.
6. **Comprobación de estado**: inicia el Gateway y verifica que se esté ejecutando.
7. **Skills**: instala skills recomendadas y dependencias opcionales.

<Note>
Volver a ejecutar el onboarding **no** borra nada a menos que elijas explícitamente **Reset** (o pases `--reset`).
CLI `--reset` se aplica de forma predeterminada a configuración, credenciales y sesiones; usa `--reset-scope full` para incluir el espacio de trabajo.
Si la configuración no es válida o contiene claves heredadas, el onboarding te pide que ejecutes primero `openclaw doctor`.
</Note>

El **modo remoto** solo configura el cliente local para conectarse a un Gateway en otro lugar.
**No** instala ni cambia nada en el host remoto.

## Añadir otro agente

Usa `openclaw agents add <name>` para crear un agente separado con su propio espacio de trabajo,
sesiones y perfiles de autenticación. Ejecutarlo sin `--workspace` inicia el onboarding.

Lo que establece:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Los espacios de trabajo predeterminados siguen `~/.openclaw/workspace-<agentId>`.
- Añade `bindings` para enrutar mensajes entrantes (el onboarding puede hacerlo).
- Flags no interactivos: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para desgloses detallados paso a paso y salidas de configuración, consulta
[Referencia de configuración de la CLI](/es/start/wizard-cli-reference).
Para ejemplos no interactivos, consulta [Automatización de la CLI](/es/start/wizard-cli-automation).
Para la referencia técnica más profunda, incluidos los detalles de RPC, consulta
[Referencia de onboarding](/es/reference/wizard).

## Documentación relacionada

- Referencia de comandos de la CLI: [`openclaw onboard`](/es/cli/onboard)
- Descripción general del onboarding: [Descripción general del onboarding](/es/start/onboarding-overview)
- Onboarding de la app para macOS: [Onboarding](/es/start/onboarding)
- Ritual de primer inicio del agente: [Arranque del agente](/es/start/bootstrapping)
