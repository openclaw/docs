---
read_when:
    - Ejecutar o configurar la incorporación mediante la CLI
    - Configuración de una máquina nueva
sidebarTitle: 'Onboarding: CLI'
summary: 'Incorporación mediante la CLI: verifique la inferencia y, a continuación, delegue la configuración restante a OpenClaw'
title: Incorporación (CLI)
x-i18n:
    generated_at: "2026-07-22T10:48:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 150adfac1424b42d66fa3035339082574cc631ce0dc3db09ad32376ef139bf1c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

La incorporación mediante la CLI es la ruta recomendada de configuración desde la terminal en macOS, Linux y
Windows (nativo o WSL2). De forma predeterminada, detecta el acceso a IA ya disponible en
el equipo, lo verifica con una finalización real e inicia OpenClaw para
configurar el espacio de trabajo, el Gateway y las funciones opcionales. `openclaw setup` ejecuta el mismo flujo ([Configuración](/es/cli/setup) abarca
la variante `--baseline` que solo configura). Los usuarios de escritorio de Windows también pueden comenzar
desde [Windows Hub](/es/platforms/windows).

La incorporación guiada establece primero la inferencia. Detecta el acceso a IA disponible,
requiere una finalización real y solo entonces inicia [OpenClaw](/es/cli/openclaw)
para configurar el resto de OpenClaw. Al elegir **Omitir por ahora**, se sale de la incorporación
sin iniciar OpenClaw.

El asistente clásico sigue disponible para proveedores personalizados, configuración remota del Gateway,
vinculación de canales, controles del daemon, Skills e importaciones. Ejecútelo explícitamente
con `openclaw onboard --classic`; el selector guiado de inferencia no delega
en él. Una vez superada la inferencia, OpenClaw puede usar `open channel wizard for
<channel>` para transferir la configuración de canales que necesita secretos a un asistente de terminal con entrada oculta.
Para cambiar el proveedor del modelo o su autenticación, salga de OpenClaw y ejecute
`openclaw onboard`; OpenClaw no abre los flujos guiados ni clásicos de proveedores.

<Info>
La forma más rápida de iniciar el primer chat: complete la configuración guiada, ejecute `openclaw dashboard` y converse en
el navegador mediante la interfaz de control. Documentación: [Panel](/es/web/dashboard).
</Info>

## Configuración regional

El asistente localiza el texto fijo de incorporación. Usa el primer valor no vacío de
`OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES` y `LANG`, en ese orden, y después
recurre al inglés. Configuraciones regionales compatibles: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # Sustitución explícita por inglés
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
El asistente clásico incluye un paso de búsqueda web en el que puede elegir un proveedor: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG o Tavily. Algunos necesitan una clave de API; otros
no requieren clave. Configure esto más adelante con `openclaw configure --section web`. Documentación:
[Herramientas web](/es/tools/web).
</Tip>

## Opción guiada predeterminada

`openclaw onboard` sin opciones sigue esta ruta:

1. Acepte el aviso de seguridad.
2. Detecte los modelos configurados, las variables de entorno de claves de API, las CLI locales de IA
   compatibles y los modelos con capacidad para usar herramientas ya instalados en servidores Ollama o LM
   Studio accesibles desde el host del Gateway. Este análisis de solo lectura nunca descarga un
   modelo. También se informa de las instalaciones de Gemini CLI, Antigravity, Pi y OpenCode
   cuando no pueden servir como ruta de inferencia reutilizable para la configuración guiada.
   Gemini y Antigravity no pueden imponer la prueba sin herramientas; Pi y OpenCode
   son entornos de agentes completos, no rutas de inferencia para la configuración.
3. Pruebe el primer candidato detectado con una finalización real. Si falla, muestre el
   motivo y continúe con el siguiente candidato utilizable.
4. Si se agotan las opciones detectadas, elija OpenAI, Anthropic, xAI (Grok), Google u
   OpenRouter, o elija **Más…** para ver los proveedores restantes. Las regiones,
   los planes y los métodos compatibles mediante navegador, dispositivo, clave de API o token de cada proveedor
   aparecen en un segundo menú y se prueban con la misma finalización real.
   Elija **Omitir por ahora** para salir sin iniciar OpenClaw.
5. Conserve únicamente la ruta del modelo verificada y cualquier estado de credenciales/plugins que
   requiera. Los ajustes del espacio de trabajo y del Gateway permanecen intactos.
6. Inicie OpenClaw con el modelo verificado para que pueda configurar el espacio de trabajo,
   el Gateway, los canales, los agentes, los plugins y el resto de la configuración opcional.

Al volver a ejecutar el comando en una instalación configurada, primero se prueba el modelo
predeterminado actual, lo que convierte el flujo guiado en un proceso de verificación y reparación. Una comprobación
fallida nunca sustituye automáticamente el modelo configurado; la incorporación se detiene y
pregunta cómo continuar. Ejecute `openclaw channels add` o `openclaw configure` para
añadir posteriormente elementos no relacionados con la inferencia; use `openclaw onboard` para cambiar
el proveedor o la ruta de autenticación.

## Asistente clásico: Inicio rápido frente a Avanzado

Ejecute `openclaw onboard --classic` para abrir el asistente completo. Comienza con la
posibilidad de elegir entre **Inicio rápido** (valores predeterminados) y **Avanzado** (control total). Pase
`--flow quickstart` o `--flow advanced` (alias `manual`) para seleccionar el flujo
clásico y omitir esa pregunta.

<Tabs>
  <Tab title="Inicio rápido (valores predeterminados)">
    - Gateway local, vinculación a loopback
    - Espacio de trabajo predeterminado (o espacio de trabajo existente)
    - Puerto del Gateway **18789**
    - Autenticación del Gateway mediante **token** (generado automáticamente, incluso en loopback)
    - Política de herramientas: `tools.profile: "coding"` para configuraciones nuevas (se conserva un perfil explícito existente)
    - Sesiones de mensajes directos: la incorporación conserva un valor `session.dmScope` explícito y, de lo contrario, lo deja sin definir, por lo que el valor predeterminado `"main"` mantiene todos los mensajes directos de todos los canales en la sesión principal continua del agente, el valor predeterminado para agentes personales. Para bandejas de entrada compartidas o multiusuario, use `"per-channel-peer"`; `openclaw security audit` recomienda el aislamiento cuando detecta tráfico de mensajes directos multiusuario. Detalles: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals)
    - Exposición mediante Tailscale **Desactivada**
    - Los mensajes directos de Telegram y WhatsApp usan de forma predeterminada una **lista de permitidos**: Telegram solicita un identificador numérico de usuario de Telegram y WhatsApp solicita un número de teléfono

  </Tab>
  <Tab title="Avanzado (control total)">
    - Muestra todos los pasos: modo, espacio de trabajo, Gateway, canales, daemon y Skills

  </Tab>
</Tabs>

El modo remoto (`--mode remote`) siempre usa el flujo avanzado; únicamente
configura este equipo para conectarse a un Gateway ubicado en otro lugar y nunca instala
ni modifica nada en el host remoto.

## Qué configura la incorporación clásica

El modo local (predeterminado) recorre estos pasos:

1. **Modelo/autenticación** - elija un flujo de autenticación del proveedor (clave de API, OAuth o
   autenticación manual específica del proveedor), incluido un proveedor personalizado
   (compatible con OpenAI, compatible con OpenAI Responses, compatible con Anthropic o
   detección automática desconocida). Elija un modelo predeterminado.
   La configuración nueva mediante clave de API de OpenAI usa de forma predeterminada `openai/gpt-5.6` (el identificador
   básico de la API directa se resuelve como Sol); la configuración nueva de ChatGPT/Codex usa de forma predeterminada
   `openai/gpt-5.6-sol`. Al volver a ejecutar la configuración, se conserva un modelo explícito existente,
   incluido `openai/gpt-5.5`. Seleccione `openai/gpt-5.5` explícitamente si la
   cuenta no ofrece GPT-5.6.
   Nota de seguridad: si este agente va a ejecutar herramientas o procesar contenido de
   webhooks/hooks, es preferible usar el modelo de última generación más potente disponible y mantener
   una política de herramientas estricta; los niveles más débiles o antiguos son más vulnerables a la inyección de prompts.
   Para ejecuciones no interactivas, `--secret-input-mode ref` almacena referencias respaldadas por variables de entorno
   en lugar de valores de claves de API en texto sin formato; la variable de entorno referenciada ya debe
   estar definida o la incorporación falla de inmediato. El modo interactivo de referencia de secretos puede
   apuntar a una variable de entorno o a una referencia de proveedor configurada (`file` o
   `exec`), con una comprobación preliminar rápida antes de guardar. Tras configurar el modelo y la autenticación,
   el asistente ofrece una prueba opcional de finalización en vivo; si falla, se puede volver una vez a
   la configuración del modelo y la autenticación o ignorar el fallo sin bloquear el resto del
   asistente clásico. Ignorarlo no desbloquea OpenClaw; la configuración conversacional
   sigue requiriendo una comprobación de inferencia satisfactoria.
2. **Espacio de trabajo** - directorio para los archivos del agente (valor predeterminado: `~/.openclaw/workspace`). Inicializa los archivos de arranque.
3. **Gateway** - puerto, dirección de vinculación, modo de autenticación y exposición mediante Tailscale. En
   el modo interactivo con token, elija almacenar el token en texto sin formato (opción predeterminada) u
   optar por una SecretRef. Ruta de SecretRef no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canales** - canales de chat integrados y de plugins oficiales, incluidos
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp y otros.
5. **Daemon** - instala un LaunchAgent (macOS), una unidad de usuario de systemd
   (Linux/WSL2) o una tarea programada nativa de Windows con un mecanismo alternativo
   por usuario en la carpeta de inicio.
   Si se requiere autenticación mediante token y `gateway.auth.token` está gestionado mediante SecretRef,
   la instalación del daemon lo valida, pero no conserva un token resuelto en
   los metadatos del entorno de servicio del supervisor; una SecretRef sin resolver bloquea la
   instalación y muestra instrucciones. Si tanto `gateway.auth.token` como
   `gateway.auth.password` están definidos mientras `gateway.auth.mode` no lo está, la instalación
   se bloquea hasta que se defina explícitamente el modo.
6. **Comprobación de estado** - inicia el Gateway y verifica que sea accesible.
7. **Skills** - instala las Skills recomendadas y sus dependencias opcionales.

<Note>
Volver a ejecutar la incorporación **no** borra nada a menos que se elija explícitamente
**Restablecer** (o se pase `--reset`). `--reset` de la CLI actúa de forma predeterminada sobre la configuración, las credenciales
y las sesiones; use `--reset-scope full` para eliminar también el espacio de trabajo. Si la
configuración no es válida o contiene claves heredadas, la incorporación solicita ejecutar primero
`openclaw doctor`.
</Note>

`--flow import` ejecuta en el asistente clásico un flujo de migración detectado (por ejemplo, Hermes)
en lugar de una configuración nueva; consulte [Migrar](/es/cli/migrate) y las guías de migración en
[Instalación](/es/install/migrating-hermes). `openclaw onboard --modern` es un
alias de compatibilidad para [OpenClaw](/es/cli/openclaw). Usa la misma
barrera de inferencia que `openclaw setup`: una inferencia verificada inicia el
asistente, mientras que un fallo interactivo vuelve a la configuración guiada de inferencia.

## Añadir otro agente

Use `openclaw agents add <name>` para crear un agente independiente con su propio
espacio de trabajo, sesiones y perfiles de autenticación. Al ejecutarlo sin `--workspace`, se inicia
un flujo interactivo para el nombre, el espacio de trabajo, la autenticación, los canales y las vinculaciones; no es
el asistente completo de `openclaw onboard`.

Elementos que configura:

- `agents.entries.*.name`
- `agents.entries.*.workspace`
- `agents.entries.*.agentDir`

Notas:

- Espacio de trabajo predeterminado: `~/.openclaw/workspace-<agentId>` (o dentro de
  `agents.defaults.workspace` si está definido).
- Añada `bindings` para enrutar los mensajes entrantes a este agente (la incorporación puede hacerlo automáticamente).
- Opciones no interactivas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referencia completa

Para consultar el comportamiento detallado paso a paso y los resultados de configuración, consulte
[Referencia de configuración de la CLI](/es/start/wizard-cli-reference).
Para ver ejemplos no interactivos, consulte [Automatización de la CLI](/es/start/wizard-cli-automation).
Para consultar la referencia completa de opciones, consulte [`openclaw onboard`](/es/cli/onboard).

## Documentación relacionada

- Referencia de comandos de la CLI: [`openclaw onboard`](/es/cli/onboard)
- Descripción general de la incorporación: [Descripción general de la incorporación](/es/start/onboarding-overview)
- Incorporación en la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Ritual de primera ejecución del agente: [Inicialización del agente](/es/start/bootstrapping)
