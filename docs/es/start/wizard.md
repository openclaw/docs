---
read_when:
    - Ejecutar o configurar la incorporación mediante la CLI
    - Configuración de una máquina nueva
sidebarTitle: 'Onboarding: CLI'
summary: 'Incorporación mediante la CLI: verifica la inferencia y luego deja el resto de la configuración en manos de OpenClaw'
title: Incorporación (CLI)
x-i18n:
    generated_at: "2026-07-16T12:02:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

La incorporación mediante la CLI es la ruta de configuración recomendada desde el terminal en macOS, Linux y
Windows (nativo o WSL2). De forma predeterminada, detecta el acceso a la IA ya disponible en
la máquina, lo verifica con una finalización real e inicia OpenClaw para
configurar el espacio de trabajo, el Gateway y las funciones opcionales. `openclaw setup` ejecuta el mismo flujo ([Configuración](/es/cli/setup) describe
la variante `--baseline` solo para configuración). Los usuarios de Windows de escritorio también pueden comenzar
desde [Windows Hub](/es/platforms/windows).

La incorporación guiada establece primero la inferencia. Detecta el acceso a la IA disponible,
exige una finalización real y solo entonces inicia [OpenClaw](/cli/openclaw)
para configurar el resto de OpenClaw. Al elegir **Omitir por ahora**, se sale de la incorporación
sin iniciar OpenClaw.

El asistente clásico sigue disponible para proveedores personalizados, la configuración remota del Gateway,
la vinculación de canales, los controles del daemon, las habilidades y las importaciones. Ejecútelo explícitamente
con `openclaw onboard --classic`; el selector de inferencia guiado no delega
en él. Una vez superada la inferencia, OpenClaw puede usar `open channel wizard for
<channel>` para transferir la configuración de canales que requiere secretos a un asistente de terminal con datos ocultos.
Para cambiar el proveedor del modelo o su autenticación, salga de OpenClaw y ejecute
`openclaw onboard`; OpenClaw no abre los flujos guiados ni clásicos de proveedores.

<Info>
La forma más rápida de iniciar el primer chat: complete la configuración guiada, ejecute `openclaw dashboard` y converse en
el navegador mediante la interfaz de control. Documentación: [Panel de control](/es/web/dashboard).
</Info>

## Configuración regional

El asistente localiza los textos fijos de incorporación. Orden de resolución: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG` y, después, inglés. Configuraciones regionales compatibles: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Los nombres de productos, comandos, claves de configuración, URL, identificadores de proveedores, identificadores de modelos y
etiquetas de plugins/canales permanecen en inglés independientemente de la configuración regional.

Para volver a configurar más adelante los ajustes no relacionados con la inferencia:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica el modo no interactivo. Para scripts, use `--non-interactive` (consulte [Automatización de la CLI](/es/start/wizard-cli-automation)).
</Note>

<Tip>
El asistente clásico incluye un paso de búsqueda web en el que se puede elegir un proveedor: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG o Tavily. Algunos necesitan una clave de API; otros
no requieren clave. Configure esta opción más adelante con `openclaw configure --section web`. Documentación:
[Herramientas web](/es/tools/web).
</Tip>

## Flujo guiado predeterminado

La ejecución simple de `openclaw onboard` sigue esta ruta:

1. Acepte el aviso de seguridad.
2. Detecte los modelos configurados, las variables de entorno de claves de API, las CLI locales de IA
   compatibles y los modelos con capacidad para usar herramientas ya instalados en servidores Ollama o LM
   Studio accesibles desde el host del Gateway. Este análisis de solo lectura nunca descarga un
   modelo. Las instalaciones de Gemini CLI y Antigravity se notifican, pero no se prueban automáticamente
   porque no pueden imponer una prueba sin herramientas.
3. Pruebe el primer candidato detectado con una finalización real. Si falla, muestre el
   motivo y continúe con el siguiente candidato utilizable.
4. Si se agotan los resultados de la detección, elija OpenAI, Anthropic, xAI (Grok), Google u
   OpenRouter, o elija **Más…** para ver los demás proveedores. Las
   regiones, los planes y los métodos compatibles mediante navegador, dispositivo, clave de API o token de cada proveedor
   aparecen en un segundo menú y se prueban con la misma finalización real.
   Elija **Omitir por ahora** para salir sin iniciar OpenClaw.
5. Conserve únicamente la ruta del modelo verificada y cualquier estado de credenciales/plugins que
   requiera. Los ajustes del espacio de trabajo y del Gateway permanecen intactos.
6. Inicie OpenClaw con el modelo verificado para que pueda configurar el espacio de trabajo,
   el Gateway, los canales, los agentes, los plugins y el resto de la configuración opcional.

Al volver a ejecutar el comando en una instalación configurada, se prueba primero el modelo
predeterminado actual, lo que convierte el flujo guiado en un proceso de verificación y reparación. Una comprobación
fallida nunca sustituye automáticamente el modelo configurado; la incorporación se detiene y
pregunta cómo continuar. Ejecute `openclaw channels add` o `openclaw configure` para
añadir posteriormente elementos no relacionados con la inferencia; use `openclaw onboard` para cambiar
las rutas del proveedor o de autenticación.

## Asistente clásico: Inicio rápido frente a Avanzado

Ejecute `openclaw onboard --classic` para abrir el asistente completo. Comienza con una
elección entre **Inicio rápido** (valores predeterminados) y **Avanzado** (control total). Pase
`--flow quickstart` o `--flow advanced` (alias `manual`) para seleccionar el flujo
clásico y omitir esa pregunta.

<Tabs>
  <Tab title="Inicio rápido (valores predeterminados)">
    - Gateway local, vinculación a la interfaz de bucle invertido
    - Espacio de trabajo predeterminado (o espacio de trabajo existente)
    - Puerto del Gateway **18789**
    - Autenticación del Gateway mediante **Token** (generado automáticamente, incluso en la interfaz de bucle invertido)
    - Política de herramientas: `tools.profile: "coding"` para configuraciones nuevas (se conserva cualquier perfil explícito existente)
    - Aislamiento de mensajes directos: `session.dmScope: "per-channel-peer"` para configuraciones nuevas. Detalles: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición mediante Tailscale **Desactivada**
    - Los mensajes directos de Telegram y WhatsApp usan de forma predeterminada una **lista de permitidos**: Telegram solicita un identificador numérico de usuario de Telegram y WhatsApp solicita un número de teléfono

  </Tab>
  <Tab title="Avanzado (control total)">
    - Muestra todos los pasos: modo, espacio de trabajo, Gateway, canales, daemon y habilidades

  </Tab>
</Tabs>

El modo remoto (`--mode remote`) siempre utiliza el flujo avanzado; únicamente
configura esta máquina para conectarse a un Gateway ubicado en otro lugar y nunca instala
ni modifica nada en el host remoto.

## Qué configura la incorporación clásica

El modo local (predeterminado) recorre estos pasos:

1. **Modelo/autenticación** - elija un flujo de autenticación del proveedor (clave de API, OAuth o
   autenticación manual específica del proveedor), incluido un proveedor personalizado
   (compatible con OpenAI, compatible con OpenAI Responses, compatible con Anthropic o
   detección automática desconocida). Elija un modelo predeterminado.
   Una configuración nueva con clave de API de OpenAI utiliza de forma predeterminada `openai/gpt-5.6` (el identificador
   básico de la API directa se resuelve como Sol); una configuración nueva de ChatGPT/Codex utiliza de forma predeterminada
   `openai/gpt-5.6-sol`. Al volver a ejecutar la configuración, se conserva un modelo explícito existente,
   incluido `openai/gpt-5.5`. Seleccione `openai/gpt-5.5` explícitamente si la
   cuenta no ofrece GPT-5.6.
   Nota de seguridad: si este agente va a ejecutar herramientas o procesar contenido de
   webhooks/hooks, prefiera el modelo de última generación más potente disponible y mantenga
   una política de herramientas estricta; los niveles más débiles o antiguos son más vulnerables a la inyección de instrucciones.
   Para ejecuciones no interactivas, `--secret-input-mode ref` almacena referencias respaldadas por variables de entorno
   en lugar de valores de claves de API en texto sin formato; la variable de entorno referenciada ya debe
   estar definida o la incorporación fallará de inmediato. El modo interactivo de referencia de secretos puede
   apuntar a una variable de entorno o a una referencia de proveedor configurada (`file` o
   `exec`), con una comprobación preliminar rápida antes de guardar. Después de configurar el modelo y la autenticación,
   el asistente ofrece una prueba opcional de finalización en vivo; si falla, se puede volver una vez a
   la configuración del modelo y la autenticación o ignorar el fallo sin bloquear el resto del
   asistente clásico. Ignorarlo no desbloquea OpenClaw; la configuración conversacional
   sigue exigiendo que la comprobación de inferencia se supere.
2. **Espacio de trabajo** - directorio para los archivos del agente (valor predeterminado: `~/.openclaw/workspace`). Inicializa los archivos de arranque.
3. **Gateway** - puerto, dirección de vinculación, modo de autenticación y exposición mediante Tailscale. En
   el modo interactivo con token, elija almacenar el token en texto sin formato (opción predeterminada) u
   opte por una SecretRef. Ruta no interactiva de SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales** - canales de chat integrados y de plugins oficiales, incluidos
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp y más.
5. **Daemon** - instala un LaunchAgent (macOS), una unidad de usuario de systemd
   (Linux/WSL2) o una tarea programada nativa de Windows con una alternativa por usuario
   en la carpeta de inicio.
   Si se requiere autenticación mediante token y `gateway.auth.token` está administrado mediante SecretRef,
   la instalación del daemon lo valida, pero no conserva un token resuelto en
   los metadatos del entorno del servicio supervisor; una SecretRef sin resolver bloquea
   la instalación y proporciona instrucciones. Si tanto `gateway.auth.token` como
   `gateway.auth.password` están definidos mientras `gateway.auth.mode` no lo está, la instalación
   se bloquea hasta que se defina explícitamente el modo.
6. **Comprobación de estado** - inicia el Gateway y verifica que sea accesible.
7. **Skills** - instala las habilidades recomendadas y sus dependencias opcionales.

<Note>
Volver a ejecutar la incorporación **no** elimina nada, a menos que se elija explícitamente
**Restablecer** (o se pase `--reset`). La opción `--reset` de la CLI afecta de forma predeterminada a la configuración, las credenciales
y las sesiones; use `--reset-scope full` para eliminar también el espacio de trabajo. Si la
configuración no es válida o contiene claves antiguas, la incorporación solicita ejecutar primero
`openclaw doctor`.
</Note>

`--flow import` ejecuta un flujo de migración detectado (por ejemplo, Hermes) en el
asistente clásico en lugar de realizar una configuración nueva; consulte [Migrar](/es/cli/migrate) y las guías de migración en
[Instalación](/es/install/migrating-hermes). `openclaw onboard --modern` es un
alias de compatibilidad para [OpenClaw](/cli/openclaw). Utiliza la misma
puerta de inferencia que `openclaw setup`: una inferencia verificada inicia el
asistente, mientras que un fallo interactivo vuelve a la configuración guiada de inferencia.

## Añadir otro agente

Use `openclaw agents add <name>` para crear un agente independiente con su propio
espacio de trabajo, sus sesiones y sus perfiles de autenticación. Si se ejecuta sin `--workspace`, se inicia
un flujo interactivo para el nombre, el espacio de trabajo, la autenticación, los canales y las vinculaciones; no es
el asistente completo de `openclaw onboard`.

Elementos que configura:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Espacio de trabajo predeterminado: `~/.openclaw/workspace-<agentId>` (o dentro de
  `agents.defaults.workspace` si está definido).
- Añada `bindings` para dirigir los mensajes entrantes a este agente (la incorporación puede hacerlo automáticamente).
- Indicadores no interactivos: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para consultar el comportamiento detallado paso a paso y los resultados de configuración, consulte
[Referencia de configuración de la CLI](/es/start/wizard-cli-reference).
Para consultar ejemplos no interactivos, consulte [Automatización de la CLI](/es/start/wizard-cli-automation).
Para consultar la referencia completa de indicadores, consulte [`openclaw onboard`](/es/cli/onboard).

## Documentación relacionada

- Referencia de comandos de la CLI: [`openclaw onboard`](/es/cli/onboard)
- Descripción general de la incorporación: [Descripción general de la incorporación](/es/start/onboarding-overview)
- Incorporación en la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Ritual de primera ejecución del agente: [Arranque del agente](/es/start/bootstrapping)
