---
read_when:
    - Ejecución o configuración de la incorporación mediante la CLI
    - Configurar una máquina nueva
sidebarTitle: 'Onboarding: CLI'
summary: 'Incorporación mediante CLI: verifica la inferencia y luego delega el resto de la configuración a Crestodian'
title: Incorporación (CLI)
x-i18n:
    generated_at: "2026-07-11T23:36:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

La incorporación mediante la CLI es la ruta recomendada para configurar desde la terminal en macOS, Linux y Windows (de forma nativa o con WSL2). De manera predeterminada, detecta el acceso a IA ya disponible en el equipo, lo verifica con una generación real e inicia Crestodian para configurar el espacio de trabajo, el Gateway y las funciones opcionales. `openclaw setup` ejecuta el mismo flujo ([Configuración](/es/cli/setup) explica la variante `--baseline`, que solo configura los ajustes). Los usuarios de escritorio de Windows también pueden comenzar desde [Windows Hub](/es/platforms/windows).

La incorporación guiada establece primero la inferencia. Detecta el acceso a IA disponible, exige una generación real y solo entonces inicia [Crestodian](/es/cli/crestodian) para configurar el resto de OpenClaw. En el flujo guiado no existe una ruta que inicie Crestodian antes de la inferencia ni que permita omitir la IA.

El asistente clásico sigue disponible para iniciar sesión con un proveedor, configurar un Gateway remoto, vincular canales, controlar el daemon, instalar Skills y realizar importaciones. Ejecútalo explícitamente con `openclaw onboard --classic`; la pantalla guiada de candidatos de inferencia no delega en él. Una vez superada la inferencia, Crestodian puede usar `open channel wizard for <channel>` para delegar la configuración de canales que requiera secretos a un asistente de terminal con entrada oculta. Para cambiar el proveedor del modelo o su autenticación, sal de Crestodian y ejecuta `openclaw onboard`; Crestodian no abre los flujos guiados ni clásicos de proveedores.

<Info>
Para iniciar el primer chat lo antes posible, completa la configuración guiada, ejecuta `openclaw dashboard` y chatea en el navegador mediante la interfaz de control. Documentación: [Panel](/es/web/dashboard).
</Info>

## Configuración regional

El asistente localiza los textos fijos de incorporación. Orden de resolución: `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, `LANG` y, por último, inglés. Configuraciones regionales compatibles: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Los nombres de productos, comandos, claves de configuración, URL, identificadores de proveedores, identificadores de modelos y etiquetas de plugins o canales permanecen en inglés, independientemente de la configuración regional.

Para volver a configurar más adelante ajustes no relacionados con la inferencia:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica el modo no interactivo. Para scripts, usa `--non-interactive` (consulta [Automatización de la CLI](/es/start/wizard-cli-automation)).
</Note>

<Tip>
El asistente clásico incluye un paso de búsqueda web en el que puedes elegir un proveedor: Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily. Algunos requieren una clave de API; otros no requieren claves. Configura esto más adelante con `openclaw configure --section web`. Documentación: [Herramientas web](/es/tools/web).
</Tip>

## Flujo guiado predeterminado

`openclaw onboard` sin opciones sigue esta ruta:

1. Acepta el aviso de seguridad.
2. Detecta los modelos configurados, las variables de entorno con claves de API y las CLI locales de IA compatibles.
3. Prueba el primer candidato detectado mediante una generación real. Si falla, muestra el motivo y continúa con el siguiente candidato utilizable.
4. Si se agotan las opciones detectadas, vuelve a intentar con un candidato detectado o introduce una clave de API de proveedor en una solicitud con entrada oculta. La incorporación guiada no ofrece Crestodian ni una salida que permita omitir la IA antes de que funcione la inferencia.
5. Conserva únicamente la ruta de modelo verificada y cualquier estado de credenciales o plugins que requiera. Los ajustes del espacio de trabajo y del Gateway permanecen intactos.
6. Inicia Crestodian con el modelo verificado para que pueda configurar el espacio de trabajo, el Gateway, los canales, los agentes, los plugins y el resto de la configuración opcional.

Al volver a ejecutar el comando en una instalación configurada, primero se prueba el modelo predeterminado actual, lo que convierte el flujo guiado en un proceso de verificación y reparación. Una comprobación fallida nunca sustituye automáticamente el modelo configurado; la incorporación se detiene y pregunta cómo continuar. Ejecuta `openclaw channels add` o `openclaw configure` para añadir posteriormente elementos no relacionados con la inferencia; usa `openclaw onboard` para cambiar el proveedor o la ruta de autenticación.

## Asistente clásico: inicio rápido frente a configuración avanzada

Ejecuta `openclaw onboard --classic` para abrir el asistente completo. Comienza con una elección entre **Inicio rápido** (valores predeterminados) y **Configuración avanzada** (control total). Pasa `--flow quickstart` o `--flow advanced` (alias `manual`) para seleccionar el flujo clásico y omitir esa pregunta.

<Tabs>
  <Tab title="Inicio rápido (valores predeterminados)">
    - Gateway local, vinculación a local loopback
    - Espacio de trabajo predeterminado (o espacio de trabajo existente)
    - Puerto del Gateway: **18789**
    - Autenticación del Gateway mediante **token** (generado automáticamente, incluso con local loopback)
    - Política de herramientas: `tools.profile: "coding"` para configuraciones nuevas (se conserva cualquier perfil explícito existente)
    - Aislamiento de mensajes directos: `session.dmScope: "per-channel-peer"` para configuraciones nuevas. Detalles: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición mediante Tailscale **desactivada**
    - Los mensajes directos de Telegram y WhatsApp usan de forma predeterminada una **lista de permitidos**: Telegram solicita un identificador numérico de usuario de Telegram y WhatsApp solicita un número de teléfono

  </Tab>
  <Tab title="Configuración avanzada (control total)">
    - Muestra todos los pasos: modo, espacio de trabajo, Gateway, canales, daemon y Skills

  </Tab>
</Tabs>

El modo remoto (`--mode remote`) siempre utiliza el flujo avanzado; solo configura este equipo para conectarse a un Gateway ubicado en otro lugar y nunca instala ni modifica nada en el host remoto.

## Qué configura la incorporación clásica

El modo local (predeterminado) recorre estos pasos:

1. **Modelo/autenticación**: elige un flujo de autenticación del proveedor (clave de API, OAuth o autenticación manual específica del proveedor), incluido un proveedor personalizado (compatible con OpenAI, compatible con OpenAI Responses, compatible con Anthropic o con detección automática desconocida). Elige un modelo predeterminado.
   Una configuración nueva con clave de API de OpenAI usa de forma predeterminada `openai/gpt-5.6` (el identificador simple de la API directa se resuelve como Sol); una configuración nueva de ChatGPT/Codex usa de forma predeterminada `openai/gpt-5.6-sol`. Al volver a ejecutar la configuración, se conserva cualquier modelo explícito existente, incluido `openai/gpt-5.5`. Selecciona explícitamente `openai/gpt-5.5` si la cuenta no ofrece GPT-5.6.
   Nota de seguridad: si este agente va a ejecutar herramientas o procesar contenido de webhooks o hooks, elige el modelo de última generación más potente que esté disponible y mantén una política estricta de herramientas; los niveles más débiles o antiguos son más vulnerables a la inyección de instrucciones.
   En ejecuciones no interactivas, `--secret-input-mode ref` almacena referencias respaldadas por variables de entorno en lugar de valores de claves de API en texto sin formato; la variable de entorno indicada ya debe estar definida o la incorporación falla inmediatamente. El modo interactivo de referencia de secretos puede apuntar a una variable de entorno o a una referencia de proveedor configurada (`file` o `exec`), con una comprobación preliminar rápida antes de guardar. Tras configurar el modelo y la autenticación, el asistente ofrece una prueba opcional de generación en vivo; si falla, se puede volver una vez a la configuración del modelo y la autenticación o ignorar el error sin bloquear el resto del asistente clásico. Ignorarlo no habilita Crestodian; la configuración mediante conversación sigue exigiendo una comprobación de inferencia satisfactoria.
2. **Espacio de trabajo**: directorio para los archivos del agente (predeterminado: `~/.openclaw/workspace`). Crea los archivos iniciales.
3. **Gateway**: puerto, dirección de vinculación, modo de autenticación y exposición mediante Tailscale. En el modo interactivo con token, elige entre almacenar el token en texto sin formato (opción predeterminada) o usar una SecretRef. Ruta no interactiva de SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales**: canales de chat integrados y de plugins oficiales, incluidos Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y otros.
5. **Daemon**: instala un LaunchAgent (macOS), una unidad de usuario de systemd (Linux/WSL2) o una tarea programada nativa de Windows, con una alternativa por usuario en la carpeta de inicio.
   Si se requiere autenticación mediante token y `gateway.auth.token` está administrado mediante SecretRef, la instalación del daemon lo valida, pero no conserva el token resuelto en los metadatos del entorno de servicio del supervisor; una SecretRef sin resolver bloquea la instalación y muestra instrucciones. Si `gateway.auth.token` y `gateway.auth.password` están definidos mientras `gateway.auth.mode` no lo está, la instalación queda bloqueada hasta que establezcas explícitamente el modo.
6. **Comprobación de estado**: inicia el Gateway y verifica que sea accesible.
7. **Skills**: instala las Skills recomendadas y sus dependencias opcionales.

<Note>
Volver a ejecutar la incorporación **no** borra nada, salvo que elijas explícitamente **Restablecer** (o pases `--reset`). De forma predeterminada, `--reset` en la CLI restablece la configuración, las credenciales y las sesiones; usa `--reset-scope full` para eliminar también el espacio de trabajo. Si la configuración no es válida o contiene claves heredadas, la incorporación te solicita que ejecutes primero `openclaw doctor`.
</Note>

`--flow import` ejecuta en el asistente clásico un flujo de migración detectado (por ejemplo, Hermes) en lugar de una configuración nueva; consulta [Migrar](/es/cli/migrate) y las guías de migración en [Instalación](/es/install/migrating-hermes). `openclaw onboard --modern` es un alias de compatibilidad de [Crestodian](/es/cli/crestodian). Utiliza el mismo requisito de inferencia que `openclaw crestodian`: una inferencia verificada inicia el asistente, mientras que un fallo interactivo devuelve al flujo guiado de configuración de la inferencia.

## Añadir otro agente

Usa `openclaw agents add <name>` para crear un agente independiente con su propio espacio de trabajo, sus sesiones y sus perfiles de autenticación. Si se ejecuta sin `--workspace`, inicia un flujo interactivo para definir el nombre, el espacio de trabajo, la autenticación, los canales y las vinculaciones; no es el asistente completo de `openclaw onboard`.

Elementos que configura:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Espacio de trabajo predeterminado: `~/.openclaw/workspace-<agentId>` (o dentro de `agents.defaults.workspace`, si está definido).
- Añade `bindings` para dirigir los mensajes entrantes a este agente (la incorporación puede hacerlo por ti).
- Opciones no interactivas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para obtener información detallada sobre el comportamiento paso a paso y los resultados de configuración, consulta la [Referencia de configuración de la CLI](/es/start/wizard-cli-reference).
Para ver ejemplos no interactivos, consulta [Automatización de la CLI](/es/start/wizard-cli-automation).
Para consultar la referencia completa de opciones, consulta [`openclaw onboard`](/es/cli/onboard).

## Documentación relacionada

- Referencia de comandos de la CLI: [`openclaw onboard`](/es/cli/onboard)
- Descripción general de la incorporación: [Descripción general de la incorporación](/es/start/onboarding-overview)
- Incorporación en la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Ritual de primera ejecución del agente: [Inicialización del agente](/es/start/bootstrapping)
