---
read_when:
    - Ejecutar o configurar la incorporación de la CLI
    - Configurar una máquina nueva
sidebarTitle: 'Onboarding: CLI'
summary: 'Configuración inicial de la CLI: configuración guiada del Gateway, el espacio de trabajo, los canales y Skills'
title: Incorporación (CLI)
x-i18n:
    generated_at: "2026-05-06T09:07:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

La incorporación mediante CLI es la forma **recomendada** de configurar OpenClaw en macOS,
Linux o Windows (mediante WSL2; muy recomendado).
Configura un Gateway local o una conexión a un Gateway remoto, además de canales, skills
y valores predeterminados del espacio de trabajo en un único flujo guiado.

```bash
openclaw onboard
```

<Info>
Primer chat más rápido: abre la Control UI (no se necesita configurar ningún canal). Ejecuta
`openclaw dashboard` y chatea en el navegador. Documentación: [Dashboard](/es/web/dashboard).
</Info>

Para reconfigurar más adelante:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica modo no interactivo. Para scripts, usa `--non-interactive`.
</Note>

<Tip>
La incorporación mediante CLI incluye un paso de búsqueda web donde puedes elegir un proveedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG o Tavily. Algunos proveedores requieren una
clave de API, mientras que otros no necesitan clave. También puedes configurarlo más adelante con
`openclaw configure --section web`. Documentación: [Herramientas web](/es/tools/web).
</Tip>

## QuickStart vs Avanzado

La incorporación empieza con **QuickStart** (valores predeterminados) vs **Avanzado** (control total).

<Tabs>
  <Tab title="QuickStart (valores predeterminados)">
    - Gateway local (local loopback)
    - Valor predeterminado del espacio de trabajo (o espacio de trabajo existente)
    - Puerto del Gateway **18789**
    - Autenticación del Gateway **Token** (generado automáticamente, incluso en loopback)
    - Valor predeterminado de política de herramientas para nuevas configuraciones locales: `tools.profile: "coding"` (se conserva el perfil explícito existente)
    - Valor predeterminado de aislamiento de DM: la incorporación local escribe `session.dmScope: "per-channel-peer"` cuando no está definido. Detalles: [Referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición de Tailscale **Desactivada**
    - Los DM de Telegram + WhatsApp usan **allowlist** de forma predeterminada (se te pedirá tu número de teléfono)

  </Tab>
  <Tab title="Avanzado (control total)">
    - Expone cada paso (modo, espacio de trabajo, Gateway, canales, daemon, skills).

  </Tab>
</Tabs>

## Qué configura la incorporación

El **modo local (predeterminado)** te guía por estos pasos:

1. **Modelo/Auth** — elige cualquier proveedor/flujo de autenticación compatible (clave de API, OAuth o autenticación manual específica del proveedor), incluido Custom Provider
   (compatible con OpenAI, compatible con Anthropic o detección automática Unknown). Elige un modelo predeterminado.
   Nota de seguridad: si este agente ejecutará herramientas o procesará contenido de webhook/hooks, prefiere el modelo más sólido de última generación disponible y mantén estricta la política de herramientas. Los niveles más débiles/antiguos son más fáciles de atacar con prompt injection.
   Para ejecuciones no interactivas, `--secret-input-mode ref` almacena refs respaldadas por env en los perfiles de autenticación en lugar de valores de clave de API en texto plano.
   En modo no interactivo `ref`, la variable de entorno del proveedor debe estar definida; pasar flags de clave inline sin esa variable de entorno falla de inmediato.
   En ejecuciones interactivas, elegir el modo de referencia secreta te permite apuntar a una variable de entorno o a una ref de proveedor configurada (`file` o `exec`), con una validación preflight rápida antes de guardar.
   Para Anthropic, la incorporación/configuración interactiva ofrece **Anthropic Claude CLI** como la ruta local preferida y **clave de API de Anthropic** como la ruta de producción recomendada. Anthropic setup-token también sigue disponible como ruta de autenticación por token compatible.
2. **Espacio de trabajo** — ubicación de los archivos del agente (valor predeterminado `~/.openclaw/workspace`). Inicializa archivos bootstrap.
3. **Gateway** — puerto, dirección de enlace, modo de autenticación, exposición de Tailscale.
   En modo de token interactivo, elige el almacenamiento predeterminado del token en texto plano u opta por SecretRef.
   Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales** — canales de chat integrados y empaquetados como BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y más.
5. **Daemon** — instala un LaunchAgent (macOS), una unidad de usuario systemd (Linux/WSL2) o una tarea programada nativa de Windows con fallback por usuario a la carpeta Startup.
   Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida pero no persiste el token resuelto en los metadatos de entorno del servicio supervisor.
   Si la autenticación por token requiere un token y la SecretRef del token configurado no se resuelve, la instalación del daemon se bloquea con orientación práctica.
   Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación del daemon se bloquea hasta que el modo se defina explícitamente.
6. **Comprobación de estado** — inicia el Gateway y verifica que esté en ejecución.
7. **Skills** — instala skills recomendadas y dependencias opcionales.

<Note>
Volver a ejecutar la incorporación **no** borra nada salvo que elijas explícitamente **Restablecer** (o pases `--reset`).
CLI `--reset` usa de forma predeterminada configuración, credenciales y sesiones; usa `--reset-scope full` para incluir el espacio de trabajo.
Si la configuración no es válida o contiene claves heredadas, la incorporación te pide ejecutar primero `openclaw doctor`.
</Note>

El **modo remoto** solo configura el cliente local para conectarse a un Gateway en otro lugar.
**No** instala ni cambia nada en el host remoto.

## Agregar otro agente

Usa `openclaw agents add <name>` para crear un agente separado con su propio espacio de trabajo,
sesiones y perfiles de autenticación. Ejecutarlo sin `--workspace` inicia la incorporación.

Qué define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Los espacios de trabajo predeterminados siguen `~/.openclaw/workspace-<agentId>`.
- Agrega `bindings` para enrutar mensajes entrantes (la incorporación puede hacerlo).
- Flags no interactivos: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para desgloses detallados paso a paso y salidas de configuración, consulta
[Referencia de configuración de CLI](/es/start/wizard-cli-reference).
Para ejemplos no interactivos, consulta [Automatización de CLI](/es/start/wizard-cli-automation).
Para la referencia técnica más profunda, incluidos detalles de RPC, consulta
[Referencia de incorporación](/es/reference/wizard).

## Documentación relacionada

- Referencia de comandos de CLI: [`openclaw onboard`](/es/cli/onboard)
- Resumen de incorporación: [Resumen de incorporación](/es/start/onboarding-overview)
- Incorporación de la app macOS: [Incorporación](/es/start/onboarding)
- Ritual de primera ejecución del agente: [Bootstrap del agente](/es/start/bootstrapping)
