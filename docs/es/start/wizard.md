---
read_when:
    - Ejecutar o configurar onboarding por CLI
    - Configurar una máquina nueva
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding por CLI: configuración guiada para Gateway, espacio de trabajo, canales y Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-24T05:51:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

El onboarding por CLI es la forma **recomendada** de configurar OpenClaw en macOS,
Linux o Windows (mediante WSL2; muy recomendado).
Configura un Gateway local o una conexión a un Gateway remoto, además de canales, Skills
y valores predeterminados del espacio de trabajo en un único flujo guiado.

```bash
openclaw onboard
```

<Info>
La forma más rápida de tener el primer chat: abre la Control UI (no hace falta configurar ningún canal). Ejecuta
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
El onboarding por CLI incluye un paso de búsqueda web en el que puedes elegir un proveedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG o Tavily. Algunos proveedores requieren una
API key, mientras que otros no. También puedes configurarlo más adelante con
`openclaw configure --section web`. Documentación: [Herramientas web](/es/tools/web).
</Tip>

## QuickStart frente a Advanced

El onboarding empieza con **QuickStart** (valores predeterminados) frente a **Advanced** (control total).

<Tabs>
  <Tab title="QuickStart (valores predeterminados)">
    - Gateway local (loopback)
    - Espacio de trabajo predeterminado (o espacio de trabajo existente)
    - Puerto del Gateway **18789**
    - Autenticación del Gateway por **Token** (autogenerado, incluso en loopback)
    - Política de herramientas predeterminada para nuevas configuraciones locales: `tools.profile: "coding"` (se conserva cualquier perfil explícito existente)
    - Aislamiento de DM predeterminado: el onboarding local escribe `session.dmScope: "per-channel-peer"` cuando no está configurado. Detalles: [Referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición por Tailscale **desactivada**
    - Los DM de Telegram y WhatsApp usan **allowlist** por defecto (se te pedirá tu número de teléfono)
  </Tab>
  <Tab title="Advanced (control total)">
    - Expone todos los pasos (modo, espacio de trabajo, gateway, canales, daemon, Skills).
  </Tab>
</Tabs>

## Qué configura onboarding

El **modo local (predeterminado)** te guía por estos pasos:

1. **Modelo/Autenticación**: elige cualquier flujo de proveedor/autenticación compatible (API key, OAuth o autenticación manual específica del proveedor), incluido Proveedor personalizado
   (compatible con OpenAI, compatible con Anthropic o Unknown con autodetección). Elige un modelo predeterminado.
   Nota de seguridad: si este agente va a ejecutar herramientas o procesar contenido de Webhook/hooks, prefiere el modelo más potente y de última generación disponible y mantén estricta la política de herramientas. Los niveles más débiles o antiguos son más fáciles de atacar mediante inyección de prompts.
   Para ejecuciones no interactivas, `--secret-input-mode ref` almacena refs respaldadas por env en perfiles de autenticación en lugar de valores de API key en texto plano.
   En modo `ref` no interactivo, la variable de entorno del proveedor debe estar configurada; pasar flags de clave inline sin esa variable de entorno falla inmediatamente.
   En ejecuciones interactivas, elegir el modo de referencia secreta te permite apuntar a una variable de entorno o a una ref de proveedor configurada (`file` o `exec`), con una validación previa rápida antes de guardar.
   Para Anthropic, onboarding/configure interactivo ofrece **Anthropic Claude CLI** como ruta local preferida y **API key de Anthropic** como ruta recomendada para producción. Anthropic setup-token también sigue disponible como ruta compatible de autenticación por token.
2. **Espacio de trabajo**: ubicación de los archivos del agente (predeterminado `~/.openclaw/workspace`). Prepara archivos de bootstrap.
3. **Gateway**: puerto, dirección de bind, modo de autenticación, exposición por Tailscale.
   En el modo interactivo de token, elige el almacenamiento predeterminado del token en texto plano o activa SecretRef.
   Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales**: canales de chat integrados e incluidos como BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y más.
5. **Daemon**: instala un LaunchAgent (macOS), una unidad de usuario systemd (Linux/WSL2) o una Scheduled Task nativa de Windows con respaldo mediante carpeta Inicio por usuario.
   Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida, pero no persiste el token resuelto en los metadatos del entorno del servicio supervisor.
   Si la autenticación por token requiere un token y la SecretRef de token configurada no está resuelta, la instalación del daemon se bloquea con orientación accionable.
   Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no lo está, la instalación del daemon se bloquea hasta que el modo se configure explícitamente.
6. **Comprobación de estado**: inicia el Gateway y verifica que se esté ejecutando.
7. **Skills**: instala Skills recomendadas y dependencias opcionales.

<Note>
Volver a ejecutar onboarding **no** borra nada salvo que elijas explícitamente **Reset** (o pases `--reset`).
`--reset` de la CLI afecta por defecto a configuración, credenciales y sesiones; usa `--reset-scope full` para incluir el espacio de trabajo.
Si la configuración no es válida o contiene claves heredadas, onboarding te pide que ejecutes primero `openclaw doctor`.
</Note>

El **modo remoto** solo configura el cliente local para conectarse a un Gateway en otro lugar.
**No** instala ni cambia nada en el host remoto.

## Añadir otro agente

Usa `openclaw agents add <name>` para crear un agente separado con su propio espacio de trabajo,
sesiones y perfiles de autenticación. Ejecutarlo sin `--workspace` inicia onboarding.

Qué configura:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Los espacios de trabajo predeterminados siguen `~/.openclaw/workspace-<agentId>`.
- Añade `bindings` para enrutar mensajes entrantes (onboarding puede hacerlo).
- Flags no interactivas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para desgloses detallados paso a paso y salidas de configuración, consulta
[Referencia de configuración de CLI](/es/start/wizard-cli-reference).
Para ejemplos no interactivos, consulta [Automatización de CLI](/es/start/wizard-cli-automation).
Para la referencia técnica más profunda, incluidos detalles de RPC, consulta
[Referencia de onboarding](/es/reference/wizard).

## Documentación relacionada

- Referencia de comandos de CLI: [`openclaw onboard`](/es/cli/onboard)
- Resumen de onboarding: [Resumen de onboarding](/es/start/onboarding-overview)
- Onboarding de la app de macOS: [Onboarding](/es/start/onboarding)
- Ritual de primera ejecución del agente: [Inicialización del agente](/es/start/bootstrapping)
