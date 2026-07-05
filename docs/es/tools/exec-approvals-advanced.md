---
read_when:
    - Configurar bins seguros o perfiles de bin seguro personalizados
    - Reenviar aprobaciones a Slack/Discord/Telegram u otros canales de chat
    - Implementar un cliente de aprobación nativo para un canal
summary: 'Aprobaciones avanzadas de exec: binarios seguros, enlace de intérprete, reenvío de aprobaciones, entrega nativa'
title: Aprobaciones de ejecución — avanzado
x-i18n:
    generated_at: "2026-07-05T11:44:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c3a4934b87c7b20f27439239bd1e02e7bcbd137b72624720da6aeb25dadc952
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Temas avanzados de aprobaciones de ejecución: la vía rápida `safeBins`, la vinculación de intérprete/runtime
y el reenvío de aprobaciones a canales de chat (incluida la entrega nativa).
Para la política principal y el flujo de aprobación, consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

## Bins seguros (solo stdin)

`tools.exec.safeBins` nombra binarios **solo stdin** (por ejemplo, `cut`) que
se ejecutan en modo de lista de permitidos **sin** entradas explícitas en la lista de permitidos. Los bins seguros rechazan
argumentos posicionales de archivo y tokens con aspecto de ruta, por lo que solo pueden operar sobre el
flujo entrante. Trata esto como una vía rápida estrecha para filtros de flujo, no como una
lista de confianza general.

<Warning>
No añadas binarios de intérprete o runtime (por ejemplo, `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Si un comando puede evaluar código,
ejecutar subcomandos o leer archivos por diseño, prefiere entradas explícitas en la lista de permitidos
y mantén activados los prompts de aprobación. Los bins seguros personalizados deben definir un
perfil explícito en `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bins seguros predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si los habilitas, mantén entradas explícitas
en la lista de permitidos para sus flujos de trabajo que no sean stdin. Para `grep` en modo bin seguro,
proporciona el patrón con `-e`/`--regexp`; la forma de patrón posicional se rechaza
para que los operandos de archivo no puedan colarse como posicionales ambiguos.

### Validación de argv y flags denegados

La validación es determinista solo a partir de la forma de argv (sin comprobaciones de existencia
en el sistema de archivos del host), lo que evita comportamientos de oráculo de existencia de archivos por diferencias
entre permitir y denegar. Las opciones orientadas a archivos se deniegan para los bins seguros predeterminados; las
opciones largas se validan con cierre seguro ante fallos (se rechazan flags desconocidos y abreviaturas ambiguas).

Flags denegados por perfil de bin seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Los bins seguros también fuerzan que los tokens argv se traten como **texto literal** en tiempo de ejecución
(sin globbing y sin expansión de `$VARS`) para segmentos solo stdin, por lo que
patrones como `*` o `$HOME/...` no pueden usarse para colar lecturas de archivos. `awk`
y `sed` siempre se deniegan como bins seguros (sus semánticas no pueden validarse
como solo stdin); `jq` puede habilitarse, pero OpenClaw sigue rechazando filtros de estilo `env`
(por ejemplo, `jq env` o `jq -n env`) en modo bin seguro para que `jq` no pueda
volcar el entorno del proceso host sin una ruta explícita en la lista de permitidos o
un prompt de aprobación.

### Directorios de binarios de confianza

Los bins seguros deben resolverse desde directorios de binarios de confianza (predeterminados del sistema más
`tools.exec.safeBinTrustedDirs` opcional). Las entradas de `PATH` nunca se consideran de confianza automáticamente.
Los directorios de confianza predeterminados son intencionalmente mínimos: `/bin`, `/usr/bin`. Si
tu ejecutable de bin seguro vive en rutas de gestor de paquetes/usuario (por ejemplo,
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), añádelas
explícitamente a `tools.exec.safeBinTrustedDirs`.

### Encadenamiento de shell, wrappers y multiplexores

El encadenamiento de shell (`&&`, `||`, `;`) está permitido cuando cada segmento de nivel superior
satisface la lista de permitidos (incluidos bins seguros o permiso automático de Skills). Las redirecciones
siguen sin estar soportadas en modo de lista de permitidos. La sustitución de comandos (`$()` / acentos graves) se
rechaza durante el análisis de la lista de permitidos, incluso dentro de comillas dobles; usa comillas simples
si necesitas texto literal `$()`.

En aprobaciones de la app complementaria de macOS, el texto shell sin procesar que contiene sintaxis de control o
expansión de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se
trata como una falta en la lista de permitidos salvo que el propio binario de shell esté permitido.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), las sobrescrituras de entorno con alcance de solicitud se
reducen a una pequeña lista explícita de permitidos (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para decisiones `allow-always` en modo de lista de permitidos, los wrappers de despacho transparente
(por ejemplo, `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persisten la
ruta del ejecutable interno en lugar de la ruta del wrapper. Los multiplexores de shell
(`busybox`, `toybox`) se desenvuelven para applets de shell (`sh`, `ash`, etc.) de la
misma manera. Si un wrapper o multiplexor no puede desenvolverse con seguridad, no se persiste
automáticamente ninguna entrada en la lista de permitidos.

Si incluyes intérpretes como `python3` o `node` en la lista de permitidos, prefiere
`tools.exec.strictInlineEval=true` para que la evaluación en línea siga requiriendo una
aprobación explícita. En modo estricto, `allow-always` todavía puede persistir invocaciones
benignas de intérprete/script, pero los portadores de evaluación en línea no se persisten
automáticamente.

### Bins seguros frente a lista de permitidos

| Tema             | `tools.exec.safeBins`                                  | Lista de permitidos (`exec-approvals.json`)                                        |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automáticamente filtros stdin estrechos       | Confiar explícitamente en ejecutables específicos                                  |
| Tipo de coincidencia | Nombre del ejecutable + política argv de bin seguro | Glob de ruta de ejecutable resuelta, o glob de nombre de comando simple para comandos invocados por PATH |
| Alcance de argumentos | Restringido por perfil de bin seguro y reglas de token literal | Coincidencia de ruta por defecto; `argPattern` opcional puede restringir argv analizado |
| Ejemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizados                              |
| Mejor uso        | Transformaciones de texto de bajo riesgo en pipelines  | Cualquier herramienta con comportamiento más amplio o efectos secundarios          |

Ubicación de configuración:

- `safeBins` viene de la configuración (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` viene de la configuración (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` viene de la configuración (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` por agente). Las claves de perfil por agente sobrescriben las claves globales.
- Las entradas de la lista de permitidos viven en el archivo de aprobaciones local del host bajo `agents.<id>.allowlist` (o mediante Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` advierte con `tools.exec.safe_bins_interpreter_unprofiled` cuando bins de intérprete/runtime aparecen en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede crear la estructura de entradas `safeBinProfiles.<bin>` personalizadas faltantes como `{}` (revísalas y restríngelas después). Los bins de intérprete/runtime no se crean automáticamente.

Ejemplo de perfil personalizado:
__OC_I18N_900000__
## Comandos de intérprete/runtime

Las ejecuciones de intérprete/runtime respaldadas por aprobación son intencionalmente conservadoras:

- El contexto exacto de argv/cwd/env siempre queda vinculado.
- Las formas directas de script de shell y archivo de runtime directo se vinculan con mejor esfuerzo a una instantánea concreta de
  archivo local.
- Las formas comunes de wrapper de gestor de paquetes que aún resuelven a un archivo local directo (por ejemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desenvuelven antes de vincularse.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete/runtime
  (por ejemplo, scripts de paquete, formas de eval, cadenas de cargadores específicas del runtime o formas multiarchivo ambiguas),
  la ejecución respaldada por aprobación se deniega en lugar de afirmar una cobertura semántica que no
  tiene.
- Para esos flujos de trabajo, prefiere sandboxing, un límite de host separado o una lista de permitidos/flujo completo de confianza
  explícitos donde el operador acepte las semánticas más amplias del runtime.

Cuando se requieren aprobaciones, la herramienta exec devuelve de inmediato un id de aprobación. Usa ese id para
correlacionar eventos de sistema posteriores de ejecución aprobada (`Exec finished`, y `Exec running` cuando esté configurado).
Si no llega ninguna decisión antes del tiempo de espera, la solicitud se trata como un tiempo de espera de aprobación y
se expone como una denegación terminal de comando del host. Para aprobaciones asíncronas del agente principal con una
sesión de origen, OpenClaw también reanuda esa sesión con un seguimiento interno para que el agente observe que
el comando no se ejecutó en lugar de reparar más tarde un resultado faltante. Las aprobaciones exec pendientes expiran
después de 30 minutos por defecto.

### Comportamiento de entrega de seguimiento

Después de que una ejecución exec asíncrona aprobada termina, OpenClaw envía un turno de seguimiento `agent` a la misma sesión.
Las aprobaciones asíncronas denegadas usan la misma ruta de seguimiento de la sesión principal para el estado de denegación, pero no
registran traspasos de runtime elevados y no ejecutan el comando. Las denegaciones sin una sesión principal reanudable
se suprimen o se informan mediante una ruta directa segura cuando existe una.

- Si existe un destino de entrega externo válido (canal entregable más destino `to`), la entrega de seguimiento usa ese canal.
- En flujos solo de webchat o de sesión interna sin destino externo, la entrega de seguimiento permanece solo en sesión (`deliver: false`).
- Si un llamador solicita explícitamente entrega externa estricta sin un canal externo resoluble, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está habilitado y no se puede resolver ningún canal externo, la entrega se degrada a solo sesión en lugar de fallar.

## Reenvío de aprobaciones a canales de chat

Puedes reenviar prompts de aprobación de exec a cualquier canal de chat (incluidos canales de Plugin) y aprobarlos
con `/approve`. Esto usa la canalización normal de entrega saliente.

Configuración:
__OC_I18N_900001__
Responde en el chat:
__OC_I18N_900002__
El comando `/approve` gestiona tanto aprobaciones exec como aprobaciones de Plugin. Si el ID no coincide con una aprobación exec pendiente, comprueba automáticamente las aprobaciones de Plugin en su lugar. Esta alternativa está limitada a fallos de "aprobación no encontrada"; una denegación/error real de aprobación exec no se reintenta silenciosamente como aprobación de Plugin.

### Reenvío de aprobaciones de Plugin

El reenvío de aprobaciones de Plugin usa la misma canalización de entrega que las aprobaciones exec, pero tiene su propia
configuración independiente bajo `approvals.plugin`. Habilitar o deshabilitar una no afecta a la otra.
Para el comportamiento de autoría de Plugin, campos de solicitud y semántica de decisión, consulta
[Solicitudes de permisos de Plugin](/plugins/plugin-permission-requests).
__OC_I18N_900003__
La forma de configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` y `targets` funcionan de la misma manera.

Los canales que admiten respuestas interactivas compartidas renderizan los mismos botones de aprobación para aprobaciones exec y
de Plugin. Los canales sin UI interactiva compartida recurren a texto plano con instrucciones de `/approve`.
Las solicitudes de aprobación de Plugin pueden restringir las decisiones disponibles: las superficies de aprobación usan
el conjunto de decisiones declarado por la solicitud, y el Gateway rechaza los intentos de enviar una decisión que no se
ofreció.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de exec o de plugin se origina en una superficie de chat entregable, ese mismo chat
puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a Slack, Matrix, Microsoft Teams y
chats entregables similares, además de los flujos existentes de la interfaz web y la interfaz de terminal, usando el
modelo normal de autenticación de canal para esa conversación. Si el chat de origen ya puede enviar comandos
y recibir respuestas, las solicitudes de aprobación ya no necesitan un adaptador de entrega nativo separado solo para
permanecer pendientes.

Discord, Telegram y QQ bot también admiten `/approve` en el mismo chat, pero esos canales siguen usando su
lista de aprobadores resuelta para la autorización incluso cuando la entrega de aprobación nativa está deshabilitada.

### Entrega de aprobación nativa

Algunos canales también pueden actuar como clientes de aprobación nativos: Discord, Slack, Telegram, Matrix y QQ bot.
Los clientes nativos agregan DMs de aprobadores, distribución al chat de origen y una UX de aprobación interactiva específica del canal
encima del flujo compartido de `/approve` en el mismo chat.

Cuando hay tarjetas o botones de aprobación nativos disponibles, esa interfaz nativa es la ruta principal orientada al agente.
El agente no debe repetir también un comando de chat simple `/approve` duplicado, salvo que el resultado de la herramienta indique que
las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta restante.

Si un cliente de aprobación nativo está configurado pero no hay un runtime nativo activo para el canal de origen,
OpenClaw mantiene visible el prompt local determinista de `/approve`. Si el runtime nativo está
activo e intenta la entrega pero ningún destino recibe la tarjeta, OpenClaw envía un aviso de respaldo en el mismo chat
con el comando exacto `/approve <id> <decision>` para que la solicitud aún pueda resolverse.

Modelo genérico:

- la política de exec del host sigue decidiendo si se requiere aprobación de exec
- `approvals.exec` controla el reenvío de prompts de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si Discord, Slack, Telegram, QQ bot y clientes nativos
  específicos de canal similares están habilitados
- las aprobaciones de plugin de Slack pueden usar el cliente de aprobación nativo de Slack cuando la solicitud proviene de Slack
  y los aprobadores del plugin de Slack se resuelven; `approvals.plugin` también puede enrutar aprobaciones de plugin a sesiones
  o destinos de Slack incluso cuando las aprobaciones de exec de Slack están deshabilitadas
- las tarjetas de aprobación nativas de Google Chat gestionan aprobaciones de exec y de plugin que se originan en espacios o hilos de Google
  Chat cuando aprobadores estables `users/<id>` se resuelven desde `dm.allowFrom` o
  `defaultTo`; no usan eventos de reacción para las decisiones
- la entrega de aprobación por reacción de WhatsApp y Signal está controlada por `approvals.exec` y
  `approvals.plugin`; no tienen bloques `channels.<channel>.execApprovals`

Los clientes de aprobación nativos habilitan automáticamente la entrega con DM primero cuando todo esto es verdadero:

- el canal admite entrega de aprobación nativa
- los aprobadores pueden resolverse desde `execApprovals.approvers` explícitos o desde una identidad
  de propietario como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` no está definido o es `"auto"`

Establece `enabled: false` para deshabilitar explícitamente un cliente de aprobación nativo. Establece `enabled: true` para forzarlo
cuando los aprobadores se resuelvan. La entrega pública al chat de origen sigue siendo explícita mediante
`channels.<channel>.execApprovals.target`. Cuando `target` nativo habilita la entrega al chat de origen,
los prompts de aprobación incluyen el texto del comando.

FAQ: [¿Por qué hay dos configuraciones de aprobación de exec para aprobaciones por chat?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: configura aprobadores estables con `channels.googlechat.dm.allowFrom` o
  `channels.googlechat.defaultTo`; no se requiere ningún bloque `execApprovals`
- WhatsApp: usa `approvals.exec` y `approvals.plugin` para enrutar prompts de aprobación a WhatsApp
- Signal: usa `approvals.exec` y `approvals.plugin` para enrutar prompts de aprobación a Signal

Enrutamiento específico del cliente nativo:

- Telegram usa DMs a aprobadores de forma predeterminada (`target: "dm"`). Cambia a `channel` o `both` para mostrar también
  prompts de aprobación en el chat o tema de Telegram de origen. Para temas de foro de Telegram, OpenClaw
  conserva el tema para el prompt de aprobación y el seguimiento posterior a la aprobación.
- Los aprobadores de Discord y Telegram pueden ser explícitos (`execApprovals.approvers`) o inferirse de
  `commands.ownerAllowFrom`; solo los aprobadores resueltos pueden aprobar o denegar.
- Los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferirse de
  `commands.ownerAllowFrom`. Los DMs de aprobación de plugin de Slack usan aprobadores de plugin de Slack desde `allowFrom`
  y el enrutamiento predeterminado de la cuenta, no los aprobadores de exec de Slack. Los botones nativos de Slack conservan el tipo
  de id de aprobación, por lo que los ids `plugin:` pueden resolver aprobaciones de plugin sin una segunda capa de respaldo local de Slack.
- Las tarjetas nativas de Google Chat conservan el respaldo manual de `/approve` en el texto del mensaje, pero las devoluciones de llamada de botones
  de la tarjeta solo llevan tokens de acción opacos; el id de aprobación y la decisión se recuperan desde
  el estado pendiente del lado del servidor.
- Las aprobaciones por emoji de WhatsApp gestionan prompts de exec y de plugin solo cuando la familia de reenvío de nivel superior
  correspondiente está habilitada y enruta a WhatsApp; el reenvío a WhatsApp solo por destino permanece en la
  ruta de reenvío compartida salvo que coincida con el mismo destino nativo de origen.
- Las aprobaciones por reacción de Signal gestionan prompts de exec y de plugin solo cuando la familia de reenvío de nivel superior
  correspondiente está habilitada y enruta a Signal. Las aprobaciones de exec directas en el mismo chat de Signal pueden
  suprimir el respaldo local de `/approve` sin aprobadores explícitos; la resolución de reacciones de Signal
  aún requiere aprobadores explícitos de Signal desde `channels.signal.allowFrom` o `defaultTo`.
- El enrutamiento nativo de DM/canal de Matrix y los atajos de reacción gestionan aprobaciones de exec y de plugin;
  la autorización de plugin sigue viniendo de `channels.matrix.dm.allowFrom`. Los prompts nativos de Matrix
  incluyen contenido de evento personalizado `com.openclaw.approval` en el primer evento de prompt para que los clientes de Matrix
  compatibles con OpenClaw puedan leer el estado estructurado de aprobación mientras los clientes estándar conservan el respaldo de texto simple
  `/approve`.
- Los botones de aprobación nativos de Discord enrutan según el tipo de id de aprobación: los ids `plugin:` van directamente a aprobaciones de plugin,
  todo lo demás va a aprobaciones de exec. Los botones de aprobación nativos de Telegram siguen el mismo
  respaldo limitado de exec a plugin que `/approve`.
- El solicitante no necesita ser un aprobador.
- Si ninguna interfaz de operador o cliente de aprobación configurado puede aceptar la solicitud, el prompt recurre a
  `askFallback`.

Los comandos de grupo confidenciales solo para propietarios, como `/diagnostics` y `/export-trajectory`, usan enrutamiento privado
del propietario para prompts de aprobación y resultados finales. OpenClaw primero intenta una ruta privada en la
misma superficie donde el propietario ejecutó el comando. Si esa superficie no tiene una ruta privada de propietario, recurre
a la primera ruta de propietario disponible desde `commands.ownerAllowFrom`, por lo que un comando de grupo de Discord
todavía puede enviar la aprobación y el resultado al DM de Telegram del propietario cuando Telegram es la interfaz privada principal
configurada. El chat de grupo solo recibe una confirmación breve.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Flujo IPC de macOS
__OC_I18N_900004__
Notas de seguridad:

- Modo de socket Unix `0600`, token almacenado en `exec-approvals.json`.
- Comprobación de par con el mismo UID.
- Desafío/respuesta (nonce + token HMAC + hash de solicitud) + TTL corto.

## FAQ

### ¿Cuándo se usarían `accountId` y `threadId` en un destino de aprobación?

Usa `accountId` cuando el canal tiene varias identidades configuradas y el prompt de aprobación debe
salir por una cuenta específica. Usa `threadId` cuando el destino admite temas o
hilos y el prompt debe permanecer dentro de ese hilo en lugar del chat de nivel superior.

Un caso concreto de Telegram es un supergrupo de operaciones con temas de foro y dos cuentas de bot de Telegram.
El valor `to` nombra el supergrupo, `accountId` selecciona la cuenta de bot y `threadId`
selecciona el tema de foro:
__OC_I18N_900005__
Con esa configuración, las aprobaciones de exec reenviadas se publican mediante la cuenta de Telegram `ops-bot` en el tema
`77` del chat `-1001234567890`. Un destino sin `accountId` usa la cuenta predeterminada del canal, y
un destino sin `threadId` publica en el destino de nivel superior.

### Cuando las aprobaciones se envían a una sesión, ¿cualquier persona en esa sesión puede aprobarlas?

No. La entrega a sesión solo controla dónde aparece el prompt. Por sí sola no autoriza a todos
los participantes de ese chat a aprobar.

Para `/approve` genérico en el mismo chat, el remitente ya debe estar autorizado para comandos en esa
sesión de canal. Si el canal expone aprobadores de aprobación explícitos, esos aprobadores pueden autorizar
la acción `/approve` incluso cuando no estén autorizados de otro modo para comandos en esa sesión.

Algunos canales son más estrictos. Discord, Telegram, Matrix, DMs de aprobación nativos de Slack y clientes de aprobación nativos
similares usan sus listas de aprobadores resueltas para la autorización de aprobación. Por ejemplo,
un prompt de aprobación en un tema de foro de Telegram puede ser visible para todos en el tema, pero solo los IDs
numéricos de usuario de Telegram resueltos desde `channels.telegram.execApprovals.approvers` o
`commands.ownerAllowFrom` pueden aprobarlo o denegarlo.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals) — política central y flujo de aprobación
- [Herramienta exec](/es/tools/exec)
- [Modo elevado](/es/tools/elevated)
- [Skills](/es/tools/skills) — comportamiento de autorización automática respaldado por Skills
