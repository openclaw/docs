---
read_when:
    - Ejecución o configuración de la incorporación mediante la CLI
    - Configurar una máquina nueva
sidebarTitle: 'Onboarding: CLI'
summary: 'Incorporación mediante la CLI: verifica la inferencia y, a continuación, delega la configuración restante a Crestodian'
title: Incorporación (CLI)
x-i18n:
    generated_at: "2026-07-12T14:50:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

La incorporación mediante la CLI es la ruta recomendada para la configuración desde la terminal en macOS, Linux y
Windows (nativo o WSL2). De forma predeterminada, detecta el acceso a la IA ya disponible en
el equipo, lo verifica con una finalización real e inicia Crestodian para
configurar el espacio de trabajo, el Gateway y las funciones opcionales. `openclaw setup` ejecuta el mismo flujo ([Configuración](/es/cli/setup) abarca
la variante `--baseline` que solo configura los ajustes). Los usuarios de escritorio de Windows también pueden comenzar
desde [Windows Hub](/es/platforms/windows).

La incorporación guiada establece primero la inferencia. Detecta el acceso disponible a la IA,
exige una finalización real y solo entonces inicia [Crestodian](/es/cli/crestodian)
para configurar el resto de OpenClaw. En el flujo guiado no hay ninguna opción de Crestodian
anterior a la inferencia ni una ruta para omitir la IA.

El asistente clásico sigue disponible para iniciar sesión con el proveedor, configurar un Gateway
remoto, vincular canales, controlar el demonio, gestionar Skills y realizar importaciones. Ejecútelo explícitamente
con `openclaw onboard --classic`; la pantalla de candidatos de inferencia guiada no
delega en él. Después de que la inferencia se complete correctamente, Crestodian puede usar `open channel
wizard for <channel>` para transferir la configuración del canal que requiera secretos a un asistente
de terminal con entrada oculta. Para cambiar el proveedor del modelo o su autenticación, salga de
Crestodian y ejecute `openclaw onboard`; Crestodian no abre los flujos guiados ni
clásicos de proveedores.

<Info>
La forma más rápida de iniciar el primer chat: complete la configuración guiada, ejecute `openclaw dashboard` y converse en
el navegador mediante la interfaz de control. Documentación: [Panel](/es/web/dashboard).
</Info>

## Configuración regional

El asistente localiza el texto fijo de incorporación. Orden de resolución: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG` y, por último, inglés. Configuraciones regionales compatibles: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Los nombres de productos, comandos, claves de configuración, URL, identificadores de proveedores, identificadores de modelos y
etiquetas de plugins y canales permanecen en inglés independientemente de la configuración regional.

Para reconfigurar más adelante los ajustes que no sean de inferencia:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica el modo no interactivo. Para scripts, use `--non-interactive` (consulte [Automatización de la CLI](/es/start/wizard-cli-automation)).
</Note>

<Tip>
El asistente clásico incluye un paso de búsqueda web donde puede elegir un proveedor: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG o Tavily. Algunos necesitan una clave de API; otros
no requieren clave. Configure esto más adelante con `openclaw configure --section web`. Documentación:
[Herramientas web](/es/tools/web).
</Tip>

## Flujo guiado predeterminado

`openclaw onboard` sin opciones sigue esta ruta:

1. Acepte el aviso de seguridad.
2. Detecte los modelos configurados, las variables de entorno de claves de API y las CLI
   locales de IA compatibles.
3. Pruebe el primer candidato detectado con una finalización real. Si falla, muestre el
   motivo y continúe con el siguiente candidato utilizable.
4. Si se agotan las opciones detectadas, vuelva a intentar con un candidato detectado o introduzca una clave de API
   del proveedor en una solicitud con entrada oculta. La incorporación guiada
   no ofrece Crestodian ni una salida para omitir la IA antes de que funcione la inferencia.
5. Conserve únicamente la ruta del modelo verificada y cualquier estado de credenciales o plugins que
   requiera. Los ajustes del espacio de trabajo y del Gateway permanecen intactos.
6. Inicie Crestodian con el modelo verificado para que pueda configurar el espacio de trabajo,
   el Gateway, los canales, los agentes, los plugins y el resto de la configuración opcional.

Al volver a ejecutar el comando en una instalación configurada, primero se prueba el modelo
predeterminado actual, lo que convierte el flujo guiado en una fase de verificación y reparación. Una comprobación
fallida nunca sustituye automáticamente el modelo configurado; la incorporación se detiene y
pregunta cómo continuar. Ejecute `openclaw channels add` o `openclaw configure` para
añadir posteriormente elementos no relacionados con la inferencia; use `openclaw onboard` para cambiar las rutas
del proveedor o de autenticación.

## Asistente clásico: QuickStart frente a Advanced

Ejecute `openclaw onboard --classic` para abrir el asistente completo. Comienza con una
elección entre **QuickStart** (valores predeterminados) y **Advanced** (control total). Pase
`--flow quickstart` o `--flow advanced` (alias `manual`) para seleccionar el flujo
clásico y omitir esa solicitud.

<Tabs>
  <Tab title="QuickStart (valores predeterminados)">
    - Gateway local, vinculación a la interfaz de bucle invertido
    - Espacio de trabajo predeterminado (o espacio de trabajo existente)
    - Puerto del Gateway **18789**
    - Autenticación del Gateway mediante **Token** (generado automáticamente, incluso en la interfaz de bucle invertido)
    - Política de herramientas: `tools.profile: "coding"` para configuraciones nuevas (se conserva un perfil explícito existente)
    - Aislamiento de mensajes directos: `session.dmScope: "per-channel-peer"` para configuraciones nuevas. Detalles: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición mediante Tailscale **Off**
    - Los mensajes directos de Telegram y WhatsApp usan de forma predeterminada una **allowlist**: Telegram solicita un identificador numérico de usuario de Telegram y WhatsApp solicita un número de teléfono

  </Tab>
  <Tab title="Advanced (control total)">
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
   La configuración nueva mediante una clave de API de OpenAI usa de forma predeterminada `openai/gpt-5.6` (el identificador
   directo de API sin prefijo se resuelve como Sol); la configuración nueva de ChatGPT/Codex usa de forma predeterminada
   `openai/gpt-5.6-sol`. Al volver a ejecutar la configuración, se conserva cualquier modelo explícito existente,
   incluido `openai/gpt-5.5`. Seleccione explícitamente `openai/gpt-5.5` si la
   cuenta no proporciona GPT-5.6.
   Nota de seguridad: si este agente va a ejecutar herramientas o procesar contenido de
   Webhooks/hooks, prefiera el modelo de última generación más potente disponible y mantenga
   una política estricta para las herramientas; los niveles más débiles o antiguos son más vulnerables a la inyección de instrucciones.
   En ejecuciones no interactivas, `--secret-input-mode ref` almacena referencias respaldadas por variables de entorno
   en lugar de valores de claves de API en texto sin formato; la variable de entorno referenciada debe estar
   definida previamente o la incorporación fallará de inmediato. El modo interactivo de referencias de secretos puede
   apuntar a una variable de entorno o a una referencia de proveedor configurada (`file` o
   `exec`), con una comprobación preliminar rápida antes de guardar. Después de configurar el modelo y la autenticación,
   el asistente ofrece una prueba opcional de finalización en vivo; si falla, se puede volver una vez a
   la configuración del modelo y la autenticación o ignorar el error sin bloquear el resto del
   asistente clásico. Ignorarlo no desbloquea Crestodian; la configuración conversacional
   sigue requiriendo una comprobación de inferencia satisfactoria.
2. **Espacio de trabajo**: directorio para los archivos del agente (valor predeterminado: `~/.openclaw/workspace`). Crea los archivos de arranque iniciales.
3. **Gateway**: puerto, dirección de vinculación, modo de autenticación y exposición mediante Tailscale. En
   el modo interactivo con token, elija entre almacenar el token como texto sin formato (opción predeterminada) o
   utilizar una SecretRef. Ruta no interactiva de SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales**: canales de chat integrados y de plugins oficiales, incluidos
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp y otros.
5. **Demonio**: instala un LaunchAgent (macOS), una unidad de usuario de systemd
   (Linux/WSL2) o una tarea programada nativa de Windows con una alternativa por usuario
   en la carpeta Startup.
   Si se requiere autenticación mediante token y `gateway.auth.token` está gestionado mediante SecretRef,
   la instalación del demonio lo valida, pero no conserva un token resuelto en
   los metadatos del entorno de servicio del supervisor; una SecretRef sin resolver bloquea
   la instalación y proporciona instrucciones. Si están definidos tanto `gateway.auth.token` como
   `gateway.auth.password` mientras `gateway.auth.mode` no está definido, la instalación
   se bloquea hasta que se establezca el modo explícitamente.
6. **Comprobación de estado**: inicia el Gateway y verifica que sea accesible.
7. **Skills**: instala las Skills recomendadas y sus dependencias opcionales.

<Note>
Volver a ejecutar la incorporación **no** elimina nada, salvo que elija explícitamente
**Reset** (o pase `--reset`). La opción `--reset` de la CLI restablece de forma predeterminada la configuración, las credenciales
y las sesiones; use `--reset-scope full` para eliminar también el espacio de trabajo. Si la
configuración no es válida o contiene claves heredadas, la incorporación solicita ejecutar primero
`openclaw doctor`.
</Note>

`--flow import` ejecuta un flujo de migración detectado (por ejemplo, Hermes) en el
asistente clásico en lugar de una configuración nueva; consulte [Migrar](/es/cli/migrate) y las guías de migración en
[Instalación](/es/install/migrating-hermes). `openclaw onboard --modern` es un
alias de compatibilidad para [Crestodian](/es/cli/crestodian). Utiliza la misma
barrera de inferencia que `openclaw crestodian`: una inferencia verificada inicia el
asistente, mientras que un fallo interactivo devuelve al usuario a la configuración guiada de la inferencia.

## Añadir otro agente

Use `openclaw agents add <name>` para crear un agente independiente con su propio
espacio de trabajo, sus sesiones y sus perfiles de autenticación. La ejecución sin `--workspace` inicia
un flujo interactivo para el nombre, el espacio de trabajo, la autenticación, los canales y las vinculaciones; no es
el asistente completo de `openclaw onboard`.

Elementos que establece:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Espacio de trabajo predeterminado: `~/.openclaw/workspace-<agentId>` (o dentro de
  `agents.defaults.workspace` si está definido).
- Añada `bindings` para enrutar los mensajes entrantes a este agente (la incorporación puede hacerlo por usted).
- Opciones no interactivas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para consultar el comportamiento detallado paso a paso y las configuraciones generadas, consulte
[Referencia de configuración de la CLI](/es/start/wizard-cli-reference).
Para ver ejemplos no interactivos, consulte [Automatización de la CLI](/es/start/wizard-cli-automation).
Para consultar la referencia completa de opciones, consulte [`openclaw onboard`](/es/cli/onboard).

## Documentación relacionada

- Referencia de comandos de la CLI: [`openclaw onboard`](/es/cli/onboard)
- Descripción general de la incorporación: [Descripción general de la incorporación](/es/start/onboarding-overview)
- Incorporación en la aplicación de macOS: [Incorporación](/es/start/onboarding)
- Ritual de primera ejecución del agente: [Arranque inicial del agente](/es/start/bootstrapping)
