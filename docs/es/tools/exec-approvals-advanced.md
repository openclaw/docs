---
read_when:
    - Configurar binarios seguros o perfiles personalizados de binarios seguros
    - Reenvío de aprobaciones a Slack/Discord/Telegram u otros canales de chat
    - Implementación de un cliente de aprobación nativo para un canal
summary: 'Aprobaciones avanzadas de exec: binarios seguros, vinculación de intérpretes, reenvío de aprobaciones, entrega nativa'
title: Aprobaciones de ejecución — avanzadas
x-i18n:
    generated_at: "2026-05-07T01:54:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Temas avanzados de aprobación de exec: la vía rápida de `safeBins`, la vinculación de intérprete/runtime y el reenvío de aprobaciones a canales de chat (incluida la entrega nativa). Para la política central y el flujo de aprobación, consulta [Aprobaciones de exec](/es/tools/exec-approvals).

## Safe bins (solo stdin)

`tools.exec.safeBins` define una pequeña lista de binarios **solo stdin** (por ejemplo `cut`) que pueden ejecutarse en modo de lista de permitidos **sin** entradas explícitas en la lista de permitidos. Los safe bins rechazan argumentos de archivo posicionales y tokens con apariencia de ruta, por lo que solo pueden operar sobre el flujo entrante. Trata esto como una vía rápida estrecha para filtros de flujo, no como una lista de confianza general.

<Warning>
**No** añadas binarios de intérprete o runtime (por ejemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Si un comando puede evaluar código, ejecutar subcomandos o leer archivos por diseño, prefiere entradas explícitas en la lista de permitidos y mantén activados los avisos de aprobación. Los safe bins personalizados deben definir un perfil explícito en `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bins predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si optas por incluirlos, mantén entradas explícitas en la lista de permitidos para sus flujos de trabajo que no usan stdin. Para `grep` en modo safe-bin, proporciona el patrón con `-e`/`--regexp`; se rechaza la forma de patrón posicional para que los operandos de archivo no puedan introducirse como posicionales ambiguos.

### Validación de argv y flags denegados

La validación es determinista solo a partir de la forma de argv (sin comprobaciones de existencia en el sistema de archivos del host), lo que evita comportamientos de oráculo de existencia de archivos por diferencias entre permitir/denegar. Las opciones orientadas a archivos se deniegan para los safe bins predeterminados; las opciones largas se validan con cierre ante fallos (se rechazan flags desconocidos y abreviaturas ambiguas).

Flags denegados por perfil de safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Los safe bins también fuerzan que los tokens de argv se traten como **texto literal** en tiempo de ejecución (sin globbing y sin expansión de `$VARS`) para segmentos solo stdin, por lo que patrones como `*` o `$HOME/...` no pueden usarse para introducir lecturas de archivos.

### Directorios binarios de confianza

Los safe bins deben resolverse desde directorios binarios de confianza (valores predeterminados del sistema más `tools.exec.safeBinTrustedDirs` opcional). Las entradas de `PATH` nunca son de confianza automáticamente. Los directorios de confianza predeterminados son intencionalmente mínimos: `/bin`, `/usr/bin`. Si tu ejecutable safe-bin vive en rutas de gestor de paquetes/usuario (por ejemplo `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), añádelas explícitamente a `tools.exec.safeBinTrustedDirs`.

### Encadenamiento de shell, envoltorios y multiplexores

El encadenamiento de shell (`&&`, `||`, `;`) está permitido cuando cada segmento de nivel superior satisface la lista de permitidos (incluidos safe bins o auto-permisos de Skills). Las redirecciones siguen sin estar admitidas en modo de lista de permitidos. La sustitución de comandos (`$()` / acentos graves) se rechaza durante el análisis de la lista de permitidos, incluso dentro de comillas dobles; usa comillas simples si necesitas texto literal `$()`.

En aprobaciones de la aplicación complementaria de macOS, el texto de shell sin procesar que contiene sintaxis de control o expansión de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se trata como una falta en la lista de permitidos a menos que el propio binario de shell esté en la lista de permitidos.

Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), las sobrescrituras de env con ámbito de solicitud se reducen a una pequeña lista explícita de permitidos (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Para decisiones `allow-always` en modo de lista de permitidos, los envoltorios de despacho conocidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persisten la ruta del ejecutable interno en lugar de la ruta del envoltorio. Los multiplexores de shell (`busybox`, `toybox`) se desenvuelven para applets de shell (`sh`, `ash`, etc.) del mismo modo. Si un envoltorio o multiplexor no puede desenvolverse de forma segura, no se persiste automáticamente ninguna entrada en la lista de permitidos.

Si incluyes intérpretes como `python3` o `node` en la lista de permitidos, prefiere `tools.exec.strictInlineEval=true` para que la evaluación inline siga requiriendo una aprobación explícita. En modo estricto, `allow-always` aún puede persistir invocaciones benignas de intérprete/script, pero los portadores de evaluación inline no se persisten automáticamente.

### Safe bins frente a lista de permitidos

| Tema             | `tools.exec.safeBins`                                  | Lista de permitidos (`exec-approvals.json`)                                       |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automáticamente filtros estrechos de stdin    | Confiar explícitamente en ejecutables específicos                                  |
| Tipo de coincidencia | Nombre de ejecutable + política argv de safe-bin   | Glob de ruta de ejecutable resuelta, o glob de nombre de comando simple para comandos invocados por PATH |
| Alcance de argumentos | Restringido por el perfil de safe-bin y reglas de token literal | Coincidencia de ruta de forma predeterminada; `argPattern` opcional puede restringir argv analizado |
| Ejemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizadas                              |
| Mejor uso        | Transformaciones de texto de bajo riesgo en pipelines  | Cualquier herramienta con comportamiento más amplio o efectos secundarios          |

Ubicación de configuración:

- `safeBins` proviene de la configuración (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` proviene de la configuración (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` proviene de la configuración (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` por agente). Las claves de perfil por agente sobrescriben las claves globales.
- Las entradas de la lista de permitidos viven en `~/.openclaw/exec-approvals.json` local al host bajo `agents.<id>.allowlist` (o mediante la UI de Control / `openclaw approvals allowlist ...`).
- `openclaw security audit` advierte con `tools.exec.safe_bins_interpreter_unprofiled` cuando aparecen bins de intérprete/runtime en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede generar entradas faltantes personalizadas de `safeBinProfiles.<bin>` como `{}` (revísalas y ajústalas después). Los bins de intérprete/runtime no se generan automáticamente.

Ejemplo de perfil personalizado:
__OC_I18N_900000__
Si incluyes explícitamente `jq` en `safeBins`, OpenClaw sigue rechazando el builtin `env` en modo safe-bin para que `jq -n env` no pueda volcar el entorno del proceso host sin una ruta explícita en la lista de permitidos o un aviso de aprobación.

## Comandos de intérprete/runtime

Las ejecuciones de intérprete/runtime respaldadas por aprobación son intencionalmente conservadoras:

- El contexto exacto de argv/cwd/env siempre se vincula.
- Las formas de script de shell directo y archivo de runtime directo se vinculan, en la medida de lo posible, a una instantánea de un único archivo local concreto.
- Las formas comunes de envoltorio de gestor de paquetes que aún se resuelven a un archivo local directo (por ejemplo `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desenvuelven antes de la vinculación.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete/runtime (por ejemplo scripts de paquete, formas de eval, cadenas de cargadores específicas del runtime o formas ambiguas de varios archivos), la ejecución respaldada por aprobación se deniega en lugar de afirmar una cobertura semántica que no tiene.
- Para esos flujos de trabajo, prefiere sandboxing, un límite de host separado o una lista de permitidos/flujo de trabajo completo explícitamente de confianza donde el operador acepte la semántica más amplia del runtime.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente un id de aprobación. Usa ese id para correlacionar eventos del sistema posteriores (`Exec finished` / `Exec denied`). Si no llega ninguna decisión antes del timeout, la solicitud se trata como un timeout de aprobación y se muestra como motivo de denegación.

### Comportamiento de entrega de seguimiento

Después de que finalice un exec asíncrono aprobado, OpenClaw envía un turno de seguimiento `agent` a la misma sesión.

- Si existe un destino de entrega externo válido (canal entregable más destino `to`), la entrega de seguimiento usa ese canal.
- En flujos solo de webchat o de sesión interna sin destino externo, la entrega de seguimiento permanece solo en la sesión (`deliver: false`).
- Si un llamador solicita explícitamente entrega externa estricta sin un canal externo resoluble, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está activado y no puede resolverse ningún canal externo, la entrega se degrada a solo sesión en lugar de fallar.

## Reenvío de aprobaciones a canales de chat

Puedes reenviar avisos de aprobación de exec a cualquier canal de chat (incluidos canales de Plugin) y aprobarlos con `/approve`. Esto usa la canalización normal de entrega saliente.

Configuración:
__OC_I18N_900001__
Responder en el chat:
__OC_I18N_900002__
El comando `/approve` gestiona tanto aprobaciones de exec como aprobaciones de Plugin. Si el ID no coincide con una aprobación de exec pendiente, comprueba automáticamente las aprobaciones de Plugin en su lugar.

### Reenvío de aprobaciones de Plugin

El reenvío de aprobaciones de Plugin usa la misma canalización de entrega que las aprobaciones de exec, pero tiene su propia configuración independiente bajo `approvals.plugin`. Activar o desactivar una no afecta a la otra.
__OC_I18N_900003__
La forma de configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` y `targets` funcionan del mismo modo.

Los canales que admiten respuestas interactivas compartidas muestran los mismos botones de aprobación tanto para aprobaciones de exec como de Plugin. Los canales sin UI interactiva compartida recurren a texto plano con instrucciones de `/approve`.
Las solicitudes de aprobación de Plugin pueden restringir las decisiones disponibles. Las superficies de aprobación usan el conjunto de decisiones declarado por la solicitud, y el Gateway rechaza los intentos de enviar una decisión que no se ofreció.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de exec o Plugin se origina desde una superficie de chat entregable, el mismo chat ahora puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a canales como Slack, Matrix y Microsoft Teams además de los flujos existentes de UI web y UI de terminal.

Esta ruta compartida de comando de texto usa el modelo normal de autenticación del canal para esa conversación. Si el chat de origen ya puede enviar comandos y recibir respuestas, las solicitudes de aprobación ya no necesitan un adaptador de entrega nativa separado solo para permanecer pendientes.

Discord y Telegram también admiten `/approve` en el mismo chat, pero esos canales siguen usando su lista resuelta de aprobadores para autorización incluso cuando la entrega nativa de aprobaciones está desactivada.

Para Telegram y otros clientes de aprobación nativos que llaman directamente al Gateway, este fallback está delimitado intencionalmente a fallos de "aprobación no encontrada". Una denegación/error real de aprobación de exec no reintenta silenciosamente como aprobación de Plugin.

### Entrega nativa de aprobaciones

Algunos canales también pueden actuar como clientes de aprobación nativos. Los clientes nativos añaden mensajes directos a aprobadores, distribución al chat de origen y una UX de aprobación interactiva específica del canal encima del flujo compartido de `/approve` en el mismo chat.

Cuando hay tarjetas/botones de aprobación nativos disponibles, esa UI nativa es la ruta principal orientada al agente. El agente tampoco debería repetir un comando de chat plano `/approve` duplicado a menos que el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta restante.

Si hay un cliente de aprobación nativo configurado pero no hay ningún runtime nativo activo para el canal de origen, OpenClaw mantiene visible el prompt determinista local de `/approve`. Si el runtime nativo está activo e intenta la entrega, pero ningún destino recibe la tarjeta, OpenClaw envía un aviso de reserva en el mismo chat con el comando exacto `/approve <id> <decision>` para que la solicitud aún pueda resolverse.

Modelo genérico:

- la política de ejecución del host sigue decidiendo si se requiere aprobación de exec
- `approvals.exec` controla el reenvío de prompts de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si ese canal actúa como cliente de aprobación nativo

Los clientes de aprobación nativos habilitan automáticamente la entrega primero por mensaje directo cuando todo esto es verdadero:

- el canal admite entrega de aprobaciones nativas
- los aprobadores pueden resolverse desde `execApprovals.approvers` explícitos o desde la identidad del propietario, como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` no está definido o es `"auto"`

Define `enabled: false` para deshabilitar explícitamente un cliente de aprobación nativo. Define `enabled: true` para forzarlo cuando los aprobadores se resuelvan. La entrega pública al chat de origen sigue siendo explícita mediante `channels.<channel>.execApprovals.target`.

Preguntas frecuentes: [¿Por qué hay dos configuraciones de aprobación de exec para aprobaciones por chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Estos clientes de aprobación nativos añaden enrutamiento por mensaje directo y distribución opcional al canal encima del flujo compartido de `/approve` en el mismo chat y los botones de aprobación compartidos.

Comportamiento compartido:

- Slack, Matrix, Microsoft Teams y chats entregables similares usan el modelo normal de autenticación del canal para `/approve` en el mismo chat
- cuando un cliente de aprobación nativo se habilita automáticamente, el destino de entrega nativa predeterminado son los mensajes directos a aprobadores
- para Discord y Telegram, solo los aprobadores resueltos pueden aprobar o denegar
- los aprobadores de Discord pueden ser explícitos (`execApprovals.approvers`) o inferirse de `commands.ownerAllowFrom`
- los aprobadores de Telegram pueden ser explícitos (`execApprovals.approvers`) o inferirse de `commands.ownerAllowFrom`
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferirse de `commands.ownerAllowFrom`
- los botones nativos de Slack conservan el tipo de id de aprobación, por lo que los ids `plugin:` pueden resolver aprobaciones de Plugin sin una segunda capa de reserva local de Slack
- el enrutamiento nativo de mensajes directos/canales de Matrix y los atajos de reacción manejan aprobaciones tanto de exec como de Plugin; la autorización de Plugin aún proviene de `channels.matrix.dm.allowFrom`
- los prompts nativos de Matrix incluyen contenido de evento personalizado `com.openclaw.approval` en el primer evento de prompt, para que los clientes Matrix compatibles con OpenClaw puedan leer el estado de aprobación estructurado mientras los clientes estándar conservan la alternativa de texto plano `/approve`
- el solicitante no necesita ser aprobador
- el chat de origen puede aprobar directamente con `/approve` cuando ese chat ya admite comandos y respuestas
- los botones de aprobación nativos de Discord enrutan por tipo de id de aprobación: los ids `plugin:` van directamente a las aprobaciones de Plugin, todo lo demás va a las aprobaciones de exec
- los botones de aprobación nativos de Telegram siguen la misma reserva acotada de exec a Plugin que `/approve`
- cuando `target` nativo habilita la entrega al chat de origen, los prompts de aprobación incluyen el texto del comando
- las aprobaciones de exec pendientes caducan después de 30 minutos de forma predeterminada
- si ninguna UI de operador o cliente de aprobación configurado puede aceptar la solicitud, el prompt recurre a `askFallback`

Los comandos de grupo confidenciales solo para propietarios, como `/diagnostics` y `/export-trajectory`, usan enrutamiento privado de propietario para los prompts de aprobación y los resultados finales. OpenClaw primero intenta una ruta privada en la misma superficie donde el propietario ejecutó el comando. Si esa superficie no tiene una ruta privada de propietario, recurre a la primera ruta de propietario disponible de `commands.ownerAllowFrom`, por lo que un comando de grupo de Discord aún puede enviar la aprobación y el resultado al mensaje directo de Telegram del propietario cuando Telegram es la interfaz privada principal configurada. El chat de grupo solo recibe un breve acuse de recibo.

Telegram usa de forma predeterminada mensajes directos a aprobadores (`target: "dm"`). Puedes cambiar a `channel` o `both` cuando quieras que los prompts de aprobación también aparezcan en el chat/tema de Telegram de origen. Para los temas de foro de Telegram, OpenClaw conserva el tema para el prompt de aprobación y el seguimiento posterior a la aprobación.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flujo IPC de macOS
__OC_I18N_900004__
Notas de seguridad:

- Modo de socket Unix `0600`, token almacenado en `exec-approvals.json`.
- Comprobación de par del mismo UID.
- Desafío/respuesta (nonce + token HMAC + hash de solicitud) + TTL corto.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals) — política central y flujo de aprobación
- [Herramienta exec](/es/tools/exec)
- [Modo elevado](/es/tools/elevated)
- [Skills](/es/tools/skills) — comportamiento de autorización automática respaldado por Skills
