---
read_when:
    - Ejecución o configuración de la incorporación de la CLI
    - Configurar una máquina nueva
sidebarTitle: 'Onboarding: CLI'
summary: 'Incorporación de CLI: configuración guiada de Gateway, espacio de trabajo, canales y Skills'
title: Incorporación (CLI)
x-i18n:
    generated_at: "2026-06-28T20:45:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding es la ruta de configuración de terminal **recomendada** para OpenClaw en
macOS, Linux o Windows. Los usuarios de escritorio de Windows también pueden empezar con
[Windows Hub](/es/platforms/windows).
Configura un Gateway local o una conexión a un Gateway remoto, además de canales, Skills
y valores predeterminados del espacio de trabajo en un único flujo guiado.

```bash
openclaw onboard
```

Inicio rápido suele tomar solo unos minutos, pero la incorporación completa puede tardar más
cuando el inicio de sesión del proveedor, el emparejamiento de canales, la instalación del daemon, las descargas de red,
Skills o plugins opcionales requieren configuración adicional. El asistente muestra esta cronología
por adelantado, y los pasos opcionales se pueden omitir y retomar más tarde con
`openclaw configure`.

## Configuración regional

El asistente de la CLI localiza el texto fijo de incorporación. Resuelve la configuración regional desde
`OPENCLAW_LOCALE`, luego `LC_ALL`, luego `LC_MESSAGES`, luego `LANG`, y usa
inglés como alternativa. Las configuraciones regionales compatibles del asistente son `en`, `zh-CN` y `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Los nombres e identificadores estables permanecen literales: `OpenClaw`, `Gateway`, `Tailscale`,
comandos, claves de configuración, URL, ID de proveedores, ID de modelos y etiquetas de plugin/canal
no se traducen.

<Info>
Primer chat más rápido: abre la Control UI (no se necesita configurar ningún canal). Ejecuta
`openclaw dashboard` y chatea en el navegador. Documentación: [Panel](/es/web/dashboard).
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
La incorporación por CLI incluye un paso de búsqueda web donde puedes elegir un proveedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG o Tavily. Algunos proveedores requieren una
clave de API, mientras que otros no requieren clave. También puedes configurar esto más tarde con
`openclaw configure --section web`. Documentación: [Herramientas web](/es/tools/web).
</Tip>

## Inicio rápido frente a avanzado

La incorporación empieza con **Inicio rápido** (valores predeterminados) frente a **Avanzado** (control total).

<Tabs>
  <Tab title="Inicio rápido (valores predeterminados)">
    - Gateway local (loopback)
    - Valor predeterminado del espacio de trabajo (o espacio de trabajo existente)
    - Puerto del Gateway **18789**
    - Autenticación del Gateway **Token** (generado automáticamente, incluso en loopback)
    - Valor predeterminado de política de herramientas para nuevas configuraciones locales: `tools.profile: "coding"` (se conserva el perfil explícito existente)
    - Valor predeterminado de aislamiento de DM: la incorporación local escribe `session.dmScope: "per-channel-peer"` cuando no está definido. Detalles: [Referencia de configuración por CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición con Tailscale **Desactivada**
    - Los DM de Telegram + WhatsApp usan **lista de permitidos** de forma predeterminada (se te pedirá tu número de teléfono)

  </Tab>
  <Tab title="Avanzado (control total)">
    - Expone todos los pasos (modo, espacio de trabajo, Gateway, canales, daemon, Skills).

  </Tab>
</Tabs>

## Qué configura la incorporación

El **modo local (predeterminado)** te guía por estos pasos:

1. **Modelo/autenticación** — elige cualquier proveedor/flujo de autenticación compatible (clave de API, OAuth o autenticación manual específica del proveedor), incluido Proveedor personalizado
   (compatible con OpenAI, compatible con Anthropic o detección automática desconocida). Elige un modelo predeterminado.
   Nota de seguridad: si este agente ejecutará herramientas o procesará contenido de Webhook/hooks, prefiere el modelo de última generación más potente disponible y mantén estricta la política de herramientas. Los niveles más débiles/antiguos son más fáciles de manipular mediante inyección de prompts.
   Para ejecuciones no interactivas, `--secret-input-mode ref` almacena referencias respaldadas por variables de entorno en perfiles de autenticación en lugar de valores de claves de API en texto plano.
   En modo `ref` no interactivo, la variable de entorno del proveedor debe estar definida; pasar flags de clave en línea sin esa variable de entorno falla de inmediato.
   En ejecuciones interactivas, elegir el modo de referencia secreta te permite apuntar a una variable de entorno o a una referencia de proveedor configurada (`file` o `exec`), con una validación preliminar rápida antes de guardar.
   Para Anthropic, la incorporación/configuración interactiva ofrece **Anthropic Claude CLI** como ruta local preferida y **clave de API de Anthropic** como ruta recomendada para producción. Anthropic setup-token también sigue disponible como ruta compatible de autenticación con token.
2. **Espacio de trabajo** — ubicación para archivos del agente (valor predeterminado `~/.openclaw/workspace`). Siembra archivos de arranque.
3. **Gateway** — puerto, dirección de enlace, modo de autenticación, exposición con Tailscale.
   En modo de token interactivo, elige el almacenamiento predeterminado de token en texto plano u opta por SecretRef.
   Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales** — canales de chat integrados y de plugins oficiales como iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y más.
5. **Daemon** — instala un LaunchAgent (macOS), una unidad de usuario systemd (Linux/WSL2) o una tarea programada nativa de Windows con alternativa por usuario en la carpeta de inicio.
   Si la autenticación con token requiere un token y `gateway.auth.token` está administrado por SecretRef, la instalación del daemon lo valida pero no persiste el token resuelto en los metadatos de entorno del servicio supervisor.
   Si la autenticación con token requiere un token y la SecretRef de token configurada no se resuelve, la instalación del daemon se bloquea con orientación accionable.
   Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación del daemon se bloquea hasta que el modo se defina explícitamente.
6. **Comprobación de estado** — inicia el Gateway y verifica que se esté ejecutando.
7. **Skills** — instala Skills recomendadas y dependencias opcionales.

<Note>
Volver a ejecutar la incorporación **no** borra nada a menos que elijas explícitamente **Restablecer** (o pases `--reset`).
CLI `--reset` incluye de forma predeterminada configuración, credenciales y sesiones; usa `--reset-scope full` para incluir el espacio de trabajo.
Si la configuración no es válida o contiene claves heredadas, la incorporación te pide ejecutar primero `openclaw doctor`.
</Note>

El **modo remoto** solo configura el cliente local para conectarse a un Gateway en otro lugar.
**No** instala ni cambia nada en el host remoto.

## Añadir otro agente

Usa `openclaw agents add <name>` para crear un agente separado con su propio espacio de trabajo,
sesiones y perfiles de autenticación. Ejecutarlo sin `--workspace` inicia la incorporación.

Lo que define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Los espacios de trabajo predeterminados siguen `~/.openclaw/workspace-<agentId>`.
- Añade `bindings` para enrutar mensajes entrantes (la incorporación puede hacerlo).
- Flags no interactivos: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para desgloses detallados paso a paso y salidas de configuración, consulta
[Referencia de configuración por CLI](/es/start/wizard-cli-reference).
Para ejemplos no interactivos, consulta [Automatización de CLI](/es/start/wizard-cli-automation).
Para la referencia técnica más profunda, incluidos detalles de RPC, consulta
[Referencia de incorporación](/es/reference/wizard).

## Documentación relacionada

- Referencia de comandos de CLI: [`openclaw onboard`](/es/cli/onboard)
- Descripción general de incorporación: [Descripción general de incorporación](/es/start/onboarding-overview)
- Incorporación de la app macOS: [Incorporación](/es/start/onboarding)
- Ritual de primer inicio del agente: [Arranque del agente](/es/start/bootstrapping)
