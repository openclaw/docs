---
read_when:
    - Ejecución o configuración de la incorporación mediante la CLI
    - Configuración de un equipo nuevo
sidebarTitle: 'Onboarding: CLI'
summary: 'Incorporación mediante la CLI: verificar la inferencia y, después, delegar la configuración restante a Crestodian'
title: Incorporación (CLI)
x-i18n:
    generated_at: "2026-07-14T14:10:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: d95e2a0803d2af9ac1f0d3790f023aad4371c6c86c2387ddc17e52e8774de9e8
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

La incorporación mediante la CLI es la ruta recomendada para la configuración desde el terminal en macOS, Linux y
Windows (nativo o WSL2). De forma predeterminada, detecta el acceso a IA ya disponible en
el equipo, lo verifica con una finalización real e inicia Crestodian para
configurar el espacio de trabajo, el Gateway y las funciones opcionales. `openclaw setup` ejecuta el mismo flujo ([Configuración](/es/cli/setup) abarca
la variante `--baseline` que solo configura). Los usuarios de escritorio de Windows también pueden comenzar
desde [Windows Hub](/es/platforms/windows).

La incorporación guiada establece primero la inferencia. Detecta el acceso a IA disponible,
exige una finalización real y solo entonces inicia [Crestodian](/es/cli/crestodian)
para configurar el resto de OpenClaw. Elegir **Skip for now** finaliza la incorporación
sin iniciar Crestodian.

El asistente clásico sigue disponible para proveedores personalizados, la configuración de un Gateway
remoto, la vinculación de canales, los controles del demonio, Skills y las importaciones. Ejecútelo explícitamente
con `openclaw onboard --classic`; el selector de inferencia guiado no delega
en él. Una vez superada la inferencia, Crestodian puede usar `open channel wizard for
<channel>` para transferir la configuración de canales que requiere secretos a un asistente de terminal con datos ocultos.
Para cambiar el proveedor del modelo o su autenticación, salga de Crestodian y ejecute
`openclaw onboard`; Crestodian no abre los flujos de proveedores guiados ni clásicos.

<Info>
La forma más rápida de iniciar el primer chat: complete la configuración guiada, ejecute `openclaw dashboard` y converse en
el navegador mediante la interfaz de control. Documentación: [Panel de control](/es/web/dashboard).
</Info>

## Configuración regional

El asistente localiza los textos fijos de incorporación. Orden de resolución: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG` y, por último, inglés. Configuraciones regionales compatibles: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Los nombres de productos, comandos, claves de configuración, URL, identificadores de proveedores, identificadores de modelos y
etiquetas de plugins y canales permanecen en inglés independientemente de la configuración regional.

Para volver a configurar más adelante los ajustes no relacionados con la inferencia:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica el modo no interactivo. Para scripts, use `--non-interactive` (consulte [Automatización de la CLI](/es/start/wizard-cli-automation)).
</Note>

<Tip>
El asistente clásico incluye un paso de búsqueda web en el que puede elegir un proveedor: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG o Tavily. Algunos necesitan una clave de API; otros
no requieren ninguna. Configure esto más adelante con `openclaw configure --section web`. Documentación:
[Herramientas web](/es/tools/web).
</Tip>

## Flujo guiado predeterminado

La ejecución simple de `openclaw onboard` sigue esta ruta:

1. Acepte el aviso de seguridad.
2. Detecte los modelos configurados, las variables de entorno de claves de API y las CLI
   de IA locales compatibles.
3. Pruebe el primer candidato detectado con una finalización real. Si falla, muestre el
   motivo y continúe con el siguiente candidato utilizable.
4. Si se agotan las opciones detectadas, elija OpenAI, Anthropic, xAI (Grok), Google u
   OpenRouter, o elija **More…** para ver los proveedores restantes. Las
   regiones, los planes y los métodos compatibles mediante navegador, dispositivo, clave de API o token
   de cada proveedor aparecen en un segundo menú y se prueban con la misma finalización real.
   Elija **Skip for now** para salir sin iniciar Crestodian.
5. Conserve únicamente la ruta del modelo verificada y cualquier estado de credenciales o plugins que
   requiera. La configuración del espacio de trabajo y del Gateway permanece intacta.
6. Inicie Crestodian con el modelo verificado para que pueda configurar el espacio de trabajo,
   el Gateway, los canales, los agentes, los plugins y el resto de la configuración opcional.

Al volver a ejecutar el comando en una instalación configurada, primero se prueba el modelo
predeterminado actual, lo que convierte el flujo guiado en una comprobación y reparación. Una
comprobación fallida nunca sustituye automáticamente el modelo configurado; la incorporación se detiene y
pregunta cómo continuar. Ejecute `openclaw channels add` o `openclaw configure` para
añadir posteriormente elementos no relacionados con la inferencia; use `openclaw onboard` para cambiar
el proveedor o la ruta de autenticación.

## Asistente clásico: QuickStart frente a Advanced

Ejecute `openclaw onboard --classic` para abrir el asistente completo. Comienza con una
elección entre **QuickStart** (valores predeterminados) y **Advanced** (control total). Pase
`--flow quickstart` o `--flow advanced` (alias `manual`) para seleccionar el flujo
clásico y omitir esa pregunta.

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway local, vinculación de bucle invertido
    - Espacio de trabajo predeterminado (o espacio de trabajo existente)
    - Puerto del Gateway **18789**
    - Autenticación del Gateway mediante **Token** (generado automáticamente, incluso en bucle invertido)
    - Política de herramientas: `tools.profile: "coding"` para configuraciones nuevas (se conserva cualquier perfil explícito existente)
    - Aislamiento de mensajes directos: `session.dmScope: "per-channel-peer"` para configuraciones nuevas. Detalles: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición mediante Tailscale **Off**
    - Los mensajes directos de Telegram y WhatsApp usan **allowlist** de forma predeterminada: Telegram solicita un identificador numérico de usuario de Telegram y WhatsApp solicita un número de teléfono

  </Tab>
  <Tab title="Advanced (full control)">
    - Muestra todos los pasos: modo, espacio de trabajo, Gateway, canales, demonio y Skills

  </Tab>
</Tabs>

El modo remoto (`--mode remote`) siempre utiliza el flujo avanzado; únicamente
configura este equipo para conectarse a un Gateway ubicado en otro lugar y nunca instala
ni cambia nada en el host remoto.

## Qué configura la incorporación clásica

El modo local (predeterminado) recorre estos pasos:

1. **Modelo/autenticación**: elija un flujo de autenticación del proveedor (clave de API, OAuth o
   autenticación manual específica del proveedor), incluido un proveedor personalizado
   (compatible con OpenAI, compatible con OpenAI Responses, compatible con Anthropic o
   detección automática desconocida). Elija un modelo predeterminado.
   Una configuración nueva con clave de API de OpenAI utiliza de forma predeterminada `openai/gpt-5.6` (el identificador
   básico de la API directa se resuelve como Sol); una configuración nueva de ChatGPT/Codex utiliza de forma predeterminada
   `openai/gpt-5.6-sol`. Al volver a ejecutar la configuración, se conserva cualquier modelo explícito existente,
   incluido `openai/gpt-5.5`. Seleccione `openai/gpt-5.5` explícitamente si la
   cuenta no ofrece GPT-5.6.
   Nota de seguridad: si este agente va a ejecutar herramientas o procesar contenido de
   Webhook o enlaces, prefiera el modelo de última generación más potente disponible y mantenga
   una política de herramientas estricta; los niveles menos potentes o antiguos son más vulnerables a la inyección de instrucciones.
   En ejecuciones no interactivas, `--secret-input-mode ref` almacena referencias respaldadas por variables de entorno
   en lugar de valores de claves de API en texto sin formato; la variable de entorno referenciada ya debe
   estar definida o la incorporación falla inmediatamente. El modo interactivo de referencia de secretos puede
   apuntar a una variable de entorno o a una referencia de proveedor configurada (`file` o
   `exec`), con una comprobación preliminar rápida antes de guardar. Después de configurar el modelo y la autenticación,
   el asistente ofrece una prueba opcional de finalización en vivo; si falla, puede volver una vez a
   la configuración del modelo y la autenticación o ignorarse sin bloquear el resto del
   asistente clásico. Ignorarla no desbloquea Crestodian; la configuración conversacional
   sigue exigiendo una comprobación de inferencia satisfactoria.
2. **Espacio de trabajo**: directorio para los archivos del agente (valor predeterminado: `~/.openclaw/workspace`). Crea los archivos de arranque iniciales.
3. **Gateway**: puerto, dirección de vinculación, modo de autenticación y exposición mediante Tailscale. En
   el modo interactivo con token, elija almacenar el token en texto sin formato (opción predeterminada) o
   utilizar una SecretRef. Ruta no interactiva de SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales**: canales de chat integrados y de plugins oficiales, incluidos
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp y más.
5. **Demonio**: instala un LaunchAgent (macOS), una unidad de usuario de systemd
   (Linux/WSL2) o una tarea programada nativa de Windows con un mecanismo alternativo
   por usuario en la carpeta de inicio.
   Si se requiere autenticación mediante token y `gateway.auth.token` está gestionado mediante SecretRef,
   la instalación del demonio lo valida, pero no conserva un token resuelto en
   los metadatos del entorno del servicio supervisor; una SecretRef sin resolver bloquea
   la instalación y proporciona instrucciones. Si `gateway.auth.token` y
   `gateway.auth.password` están definidos mientras `gateway.auth.mode` no lo está, la instalación
   se bloquea hasta que se defina explícitamente el modo.
6. **Comprobación de estado**: inicia el Gateway y verifica que sea accesible.
7. **Skills**: instala las Skills recomendadas y sus dependencias opcionales.

<Note>
Volver a ejecutar la incorporación **no** borra nada, salvo que se elija explícitamente
**Reset** (o se pase `--reset`). En la CLI, `--reset` restablece de forma predeterminada la configuración, las credenciales
y las sesiones; use `--reset-scope full` para eliminar también el espacio de trabajo. Si la
configuración no es válida o contiene claves heredadas, la incorporación solicita ejecutar primero
`openclaw doctor`.
</Note>

`--flow import` ejecuta un flujo de migración detectado (por ejemplo, Hermes) en el
asistente clásico en lugar de una configuración nueva; consulte [Migración](/es/cli/migrate) y las guías de migración en
[Instalación](/es/install/migrating-hermes). `openclaw onboard --modern` es un
alias de compatibilidad para [Crestodian](/es/cli/crestodian). Utiliza el mismo
control de inferencia que `openclaw crestodian`: una inferencia verificada inicia el
asistente, mientras que un fallo interactivo vuelve a la configuración guiada de inferencia.

## Añadir otro agente

Use `openclaw agents add <name>` para crear un agente independiente con su propio
espacio de trabajo, sesiones y perfiles de autenticación. Ejecutarlo sin `--workspace` inicia
un flujo interactivo para el nombre, el espacio de trabajo, la autenticación, los canales y las vinculaciones; no es
el asistente completo `openclaw onboard`.

Elementos que configura:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Espacio de trabajo predeterminado: `~/.openclaw/workspace-<agentId>` (o dentro de
  `agents.defaults.workspace` si está definido).
- Añada `bindings` para dirigir los mensajes entrantes a este agente (la incorporación puede hacerlo automáticamente).
- Opciones no interactivas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para obtener información detallada paso a paso sobre el comportamiento y los resultados de configuración, consulte
[Referencia de configuración de la CLI](/es/start/wizard-cli-reference).
Para ver ejemplos no interactivos, consulte [Automatización de la CLI](/es/start/wizard-cli-automation).
Para consultar la referencia completa de opciones, consulte [`openclaw onboard`](/es/cli/onboard).

## Documentación relacionada

- Referencia de comandos de la CLI: [`openclaw onboard`](/es/cli/onboard)
- Descripción general de la incorporación: [Descripción general de la incorporación](/es/start/onboarding-overview)
- Incorporación en la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Ritual de primera ejecución del agente: [Arranque inicial del agente](/es/start/bootstrapping)
