---
read_when:
    - Ejecutar o configurar la incorporación de la CLI
    - Configurar una máquina nueva
sidebarTitle: 'Onboarding: CLI'
summary: 'Incorporación de CLI: configuración guiada de Gateway, espacio de trabajo, canales y Skills'
title: Incorporación (CLI)
x-i18n:
    generated_at: "2026-07-05T11:42:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd88690ba0b2be207299afece73eac465b528f4e97f4f5a0f889f69a97fb0e47
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

La incorporación por CLI es la ruta recomendada de configuración en terminal para macOS, Linux y Windows (nativo o WSL2). Configura un Gateway local (o una conexión a un Gateway remoto), además de canales, Skills y valores predeterminados del espacio de trabajo en un único flujo guiado. `openclaw setup` ejecuta el mismo flujo ([Configuración](/es/cli/setup) cubre la variante `--baseline` solo de configuración). Los usuarios de escritorio de Windows también pueden empezar desde [Centro de Windows](/es/platforms/windows).

El inicio de sesión del proveedor, el emparejamiento de canales, la instalación del daemon y las descargas de Skills pueden alargar una configuración rápida; los pasos opcionales se pueden omitir y retomar más adelante con `openclaw configure`.

<Info>
Primer chat más rápido: omite por completo la configuración de canales. Ejecuta `openclaw dashboard` y chatea en el navegador mediante Control UI. Documentación: [Panel](/es/web/dashboard).
</Info>

## Configuración regional

El asistente localiza el texto fijo de incorporación. Orden de resolución: `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, `LANG` y luego inglés. Configuraciones regionales admitidas: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Los nombres de productos, comandos, claves de configuración, URL, ID de proveedor, ID de modelo y etiquetas de plugins/canales permanecen en inglés independientemente de la configuración regional.

Para reconfigurar más adelante:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica modo no interactivo. Para scripts, usa `--non-interactive` (consulta [Automatización de CLI](/es/start/wizard-cli-automation)).
</Note>

<Tip>
La incorporación incluye un paso de búsqueda web donde puedes elegir un proveedor: Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily. Algunos necesitan una clave de API; otros no requieren clave. Configura esto más adelante con `openclaw configure --section web`. Documentación: [Herramientas web](/es/tools/web).
</Tip>

## Inicio rápido vs Avanzado

La incorporación comienza con una elección entre **Inicio rápido** (valores predeterminados) y **Avanzado** (control completo). Pasa `--flow quickstart` o `--flow advanced` (alias `manual`) para omitir la solicitud.

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway local, enlace local loopback
    - Valor predeterminado del espacio de trabajo (o espacio de trabajo existente)
    - Puerto del Gateway **18789**
    - Autenticación del Gateway **Token** (generado automáticamente, incluso en loopback)
    - Política de herramientas: `tools.profile: "coding"` para configuraciones nuevas (se conserva un perfil explícito existente)
    - Aislamiento de DM: `session.dmScope: "per-channel-peer"` para configuraciones nuevas. Detalles: [Referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición de Tailscale **Desactivada**
    - Los DM de Telegram y WhatsApp usan **lista de permitidos** de forma predeterminada: Telegram solicita un ID numérico de usuario de Telegram, WhatsApp solicita un número de teléfono

  </Tab>
  <Tab title="Advanced (full control)">
    - Expone todos los pasos: modo, espacio de trabajo, Gateway, canales, daemon, Skills

  </Tab>
</Tabs>

El modo remoto (`--mode remote`) siempre usa el flujo avanzado; solo configura esta máquina para conectarse a un Gateway en otro lugar y nunca instala ni cambia nada en el host remoto.

## Qué configura la incorporación

El modo local (predeterminado) recorre estos pasos:

1. **Modelo/Autenticación** - elige un flujo de autenticación de proveedor (clave de API, OAuth o autenticación manual específica del proveedor), incluido Custom Provider (compatible con OpenAI, compatible con OpenAI Responses, compatible con Anthropic o detección automática Unknown). Elige un modelo predeterminado.
   Nota de seguridad: si este agente va a ejecutar herramientas o procesar contenido de webhook/hook, prefiere el modelo más sólido de última generación disponible y mantén estricta la política de herramientas; los niveles más débiles o antiguos son más fáciles de atacar con prompt injection.
   Para ejecuciones no interactivas, `--secret-input-mode ref` almacena referencias respaldadas por variables de entorno en lugar de valores de claves de API en texto sin formato; la variable de entorno referenciada ya debe estar definida, o la incorporación falla rápidamente. El modo interactivo de referencia de secreto puede apuntar a una variable de entorno o a una referencia de proveedor configurada (`file` o `exec`), con una comprobación previa rápida antes de guardar.
2. **Espacio de trabajo** - directorio para archivos del agente (predeterminado `~/.openclaw/workspace`). Inicializa archivos de arranque.
3. **Gateway** - puerto, dirección de enlace, modo de autenticación, exposición de Tailscale. En modo interactivo con token, elige almacenamiento de token en texto sin formato (predeterminado) u opta por un SecretRef. Ruta SecretRef no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales** - canales de chat integrados y de plugins oficiales, incluidos Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y más.
5. **Daemon** - instala un LaunchAgent (macOS), una unidad de usuario systemd (Linux/WSL2) o una tarea programada nativa de Windows con una alternativa por usuario en la carpeta de inicio.
   Si se requiere autenticación con token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida, pero no persiste un token resuelto en los metadatos del entorno del servicio supervisor; un SecretRef sin resolver bloquea la instalación con orientación. Si `gateway.auth.token` y `gateway.auth.password` están definidos mientras `gateway.auth.mode` no lo está, la instalación se bloquea hasta que definas el modo explícitamente.
6. **Comprobación de estado** - inicia el Gateway y verifica que sea accesible.
7. **Skills** - instala Skills recomendadas y sus dependencias opcionales.

<Note>
Volver a ejecutar la incorporación **no** borra nada a menos que elijas explícitamente **Restablecer** (o pases `--reset`). `--reset` de CLI restablece de forma predeterminada configuración, credenciales y sesiones; usa `--reset-scope full` para eliminar también el espacio de trabajo. Si la configuración no es válida o contiene claves heredadas, la incorporación te pide ejecutar primero `openclaw doctor`.
</Note>

`--flow import` ejecuta un flujo de migración detectado (por ejemplo, Hermes) en lugar de una configuración nueva; consulta [Migrar](/es/cli/migrate) y las guías de migración en [Instalar](/es/install/migrating-hermes). `openclaw onboard --modern` inicia [Crestodian](/es/cli/crestodian), un asistente conversacional de configuración/reparación, en lugar del asistente clásico.

## Añadir otro agente

Usa `openclaw agents add <name>` para crear un agente independiente con su propio espacio de trabajo, sesiones y perfiles de autenticación. Ejecutarlo sin `--workspace` inicia un flujo interactivo para nombre, espacio de trabajo, autenticación, canales y enlaces; no es el asistente completo de `openclaw onboard`.

Lo que define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Espacio de trabajo predeterminado: `~/.openclaw/workspace-<agentId>` (o bajo `agents.defaults.workspace` si está definido).
- Añade `bindings` para enrutar mensajes entrantes a este agente (la incorporación puede hacerlo por ti).
- Flags no interactivos: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para ver el comportamiento detallado paso a paso y las salidas de configuración, consulta [Referencia de configuración de CLI](/es/start/wizard-cli-reference).
Para ejemplos no interactivos, consulta [Automatización de CLI](/es/start/wizard-cli-automation).
Para la referencia completa de flags, consulta [`openclaw onboard`](/es/cli/onboard).

## Documentación relacionada

- Referencia de comandos de CLI: [`openclaw onboard`](/es/cli/onboard)
- Resumen de incorporación: [Resumen de incorporación](/es/start/onboarding-overview)
- Incorporación de la app de macOS: [Incorporación](/es/start/onboarding)
- Ritual de primer inicio del agente: [Arranque del agente](/es/start/bootstrapping)
