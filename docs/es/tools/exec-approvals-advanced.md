---
read_when:
    - Configuración de safe bins o perfiles de safe-bin personalizados
    - Reenviar aprobaciones a Slack/Discord/Telegram u otros canales de chat
    - Implementar un cliente de aprobación nativo para un canal
summary: 'Aprobaciones avanzadas de ejecución: binarios seguros, vinculación de intérpretes, reenvío de aprobaciones, entrega nativa'
title: Aprobaciones de ejecución — avanzado
x-i18n:
    generated_at: "2026-06-27T13:03:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Temas avanzados de aprobaciones de exec: la vía rápida `safeBins`, la vinculación de intérprete/runtime
y el reenvío de aprobaciones a canales de chat (incluida la entrega nativa).
Para la política principal y el flujo de aprobación, consulta [Aprobaciones de exec](/es/tools/exec-approvals).

## Binarios seguros (solo stdin)

`tools.exec.safeBins` define una lista pequeña de binarios **solo stdin** (por
ejemplo `cut`) que pueden ejecutarse en modo de lista de permitidos **sin** entradas explícitas
en la lista de permitidos. Los binarios seguros rechazan argumentos posicionales de archivo y tokens con aspecto de ruta, por lo que
solo pueden operar sobre el flujo entrante. Trata esto como una vía rápida limitada para
filtros de flujo, no como una lista de confianza general.

<Warning>
No agregues binarios de intérprete o runtime (por ejemplo `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Si un comando puede evaluar código,
ejecutar subcomandos o leer archivos por diseño, prefiere entradas explícitas en la lista de permitidos
y mantén activados los avisos de aprobación. Los binarios seguros personalizados deben definir un perfil
explícito en `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binarios seguros predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si los habilitas, mantén entradas explícitas
en la lista de permitidos para sus flujos de trabajo que no sean stdin. Para `grep` en modo de binario seguro,
proporciona el patrón con `-e`/`--regexp`; la forma de patrón posicional se rechaza
para que no puedan introducirse operandos de archivo como posicionales ambiguos.

### Validación de argv y flags denegados

La validación es determinista solo a partir de la forma de argv (sin comprobaciones de existencia
del sistema de archivos del host), lo que evita el comportamiento de oráculo de existencia de archivos por diferencias
entre permitir/denegar. Las opciones orientadas a archivos se deniegan para los binarios seguros predeterminados; las opciones
largas se validan en modo cerrado ante fallos (los flags desconocidos y las abreviaturas ambiguas se
rechazan).

Flags denegados por perfil de binario seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Los binarios seguros también fuerzan que los tokens de argv se traten como **texto literal** en tiempo
de ejecución (sin expansión de glob y sin expansión de `$VARS`) para segmentos solo stdin, de modo que patrones
como `*` o `$HOME/...` no puedan usarse para introducir lecturas de archivos.

### Directorios de binarios de confianza

Los binarios seguros deben resolverse desde directorios de binarios de confianza (valores predeterminados del sistema más
`tools.exec.safeBinTrustedDirs` opcional). Las entradas de `PATH` nunca se consideran de confianza automáticamente.
Los directorios de confianza predeterminados son intencionadamente mínimos: `/bin`, `/usr/bin`. Si
tu ejecutable de binario seguro vive en rutas de gestor de paquetes/usuario (por ejemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), agrégalas
explícitamente a `tools.exec.safeBinTrustedDirs`.

### Encadenamiento de shell, envoltorios y multiplexores

El encadenamiento de shell (`&&`, `||`, `;`) se permite cuando cada segmento de nivel superior
satisface la lista de permitidos (incluidos binarios seguros o permiso automático de Skills). Las redirecciones
siguen sin estar admitidas en modo de lista de permitidos. La sustitución de comandos (`$()` / comillas invertidas) se
rechaza durante el análisis de la lista de permitidos, incluso dentro de comillas dobles; usa comillas simples
si necesitas texto literal `$()`.

En las aprobaciones de la app complementaria de macOS, el texto shell sin procesar que contiene sintaxis de control o
expansión de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se
trata como una falta de coincidencia con la lista de permitidos a menos que el propio binario de shell esté en la lista de permitidos.

Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), las anulaciones de env con alcance de solicitud se
reducen a una pequeña lista explícita de permitidos (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para decisiones `allow-always` en modo de lista de permitidos, los envoltorios de despacho conocidos (`env`,
`flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persisten la ruta del ejecutable interno
en lugar de la ruta del envoltorio. Los multiplexores de shell (`busybox`, `toybox`) se
desenvuelven para applets de shell (`sh`, `ash`, etc.) del mismo modo. Si un envoltorio o
multiplexor no puede desenvolverse de forma segura, no se persiste automáticamente ninguna entrada
en la lista de permitidos.

Si agregas a la lista de permitidos intérpretes como `python3` o `node`, prefiere
`tools.exec.strictInlineEval=true` para que la evaluación inline siga requiriendo una aprobación
explícita. En modo estricto, `allow-always` aún puede persistir invocaciones benignas de
intérprete/script, pero los portadores de evaluación inline no se persisten
automáticamente.

### Binarios seguros frente a lista de permitidos

| Tema             | `tools.exec.safeBins`                                  | Lista de permitidos (`exec-approvals.json`)                                        |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automáticamente filtros stdin limitados       | Confiar explícitamente en ejecutables específicos                                  |
| Tipo de coincidencia | Nombre de ejecutable + política argv de binario seguro | Glob de ruta de ejecutable resuelta, o glob de nombre de comando simple para comandos invocados por PATH |
| Alcance de argumentos | Restringido por el perfil de binario seguro y reglas de token literal | Coincidencia de ruta por defecto; `argPattern` opcional puede restringir argv analizado |
| Ejemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizadas                              |
| Mejor uso        | Transformaciones de texto de bajo riesgo en pipelines  | Cualquier herramienta con comportamiento o efectos secundarios más amplios         |

Ubicación de configuración:

- `safeBins` viene de la configuración (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` viene de la configuración (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` viene de la configuración (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` por agente). Las claves de perfil por agente sobrescriben las claves globales.
- Las entradas de la lista de permitidos viven en el archivo de aprobaciones local del host bajo `agents.<id>.allowlist` (o mediante Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` advierte con `tools.exec.safe_bins_interpreter_unprofiled` cuando aparecen binarios de intérprete/runtime en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede crear estructuras iniciales para las entradas `safeBinProfiles.<bin>` personalizadas faltantes como `{}` (revísalas y ajústalas después). Los binarios de intérprete/runtime no se crean automáticamente.

Ejemplo de perfil personalizado:
__OC_I18N_900000__
Si habilitas explícitamente `jq` en `safeBins`, OpenClaw sigue rechazando el builtin `env` en modo de binario seguro
para que `jq -n env` no pueda volcar el entorno del proceso host sin una ruta explícita en la lista de permitidos
o un aviso de aprobación.

## Comandos de intérprete/runtime

Las ejecuciones de intérprete/runtime respaldadas por aprobación son deliberadamente conservadoras:

- El contexto exacto de argv/cwd/env siempre se vincula.
- Las formas de script de shell directo y archivo de runtime directo se vinculan con el mejor esfuerzo a una instantánea local concreta
  de un único archivo.
- Las formas comunes de envoltorio de gestores de paquetes que siguen resolviendo a un único archivo local directo (por ejemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desenvuelven antes de la vinculación.
- Si OpenClaw no puede identificar exactamente un único archivo local concreto para un comando de intérprete/runtime
  (por ejemplo scripts de paquete, formas eval, cadenas de cargadores específicas del runtime o formas ambiguas de varios archivos),
  la ejecución respaldada por aprobación se deniega en lugar de afirmar una cobertura semántica que no
  tiene.
- Para esos flujos de trabajo, prefiere el aislamiento en sandbox, un límite de host separado o un flujo completo/lista de permitidos
  explícitamente de confianza donde el operador acepte la semántica de runtime más amplia.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente un id de aprobación. Usa ese id para
correlacionar eventos posteriores del sistema de ejecución aprobada (`Exec finished`, y `Exec running` cuando esté configurado).
Si no llega ninguna decisión antes del timeout, la solicitud se trata como un timeout de aprobación y
se muestra como una denegación terminal de comando de host. Para aprobaciones asíncronas del agente principal con una sesión
de origen, OpenClaw también reanuda esa sesión con un seguimiento interno para que el agente observe que
el comando no se ejecutó en lugar de reparar después un resultado faltante.

### Comportamiento de entrega de seguimiento

Después de que finaliza un exec asíncrono aprobado, OpenClaw envía un turno de seguimiento `agent` a la misma sesión.
Las aprobaciones asíncronas denegadas usan la misma ruta de seguimiento de la sesión principal para el estado de denegación, pero no
registran traspasos de runtime elevados y no ejecutan el comando. Las denegaciones sin una sesión principal reanudable
se suprimen o se informan mediante una ruta directa segura cuando existe una.

- Si existe un destino de entrega externo válido (canal entregable más destino `to`), la entrega de seguimiento usa ese canal.
- En flujos solo de webchat o de sesión interna sin destino externo, la entrega de seguimiento permanece solo en la sesión (`deliver: false`).
- Si un llamador solicita explícitamente entrega externa estricta sin un canal externo resoluble, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está habilitado y no puede resolverse ningún canal externo, la entrega se degrada a solo sesión en lugar de fallar.

## Reenvío de aprobaciones a canales de chat

Puedes reenviar avisos de aprobación de exec a cualquier canal de chat (incluidos canales de Plugin) y aprobarlos
con `/approve`. Esto usa el pipeline normal de entrega saliente.

Configuración:
__OC_I18N_900001__
Responde en el chat:
__OC_I18N_900002__
El comando `/approve` maneja tanto aprobaciones de exec como aprobaciones de Plugin. Si el ID no coincide con una aprobación de exec pendiente, comprueba automáticamente las aprobaciones de Plugin en su lugar.

### Reenvío de aprobaciones de Plugin

El reenvío de aprobaciones de Plugin usa el mismo pipeline de entrega que las aprobaciones de exec, pero tiene su propia
configuración independiente bajo `approvals.plugin`. Habilitar o deshabilitar una no afecta a la otra.
Para el comportamiento de creación de Plugins, los campos de solicitud y la semántica de decisión, consulta
[Solicitudes de permisos de Plugin](/plugins/plugin-permission-requests).
__OC_I18N_900003__
La forma de la configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` y `targets` funcionan del mismo modo.

Los canales que admiten respuestas interactivas compartidas muestran los mismos botones de aprobación tanto para aprobaciones de exec como de
Plugin. Los canales sin interfaz de usuario interactiva compartida recurren a texto sin formato con instrucciones de `/approve`.
Las solicitudes de aprobación de Plugin pueden restringir las decisiones disponibles. Las superficies de aprobación usan el conjunto de decisiones
declarado por la solicitud, y el Gateway rechaza los intentos de enviar una decisión que no se ofreció.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de exec o Plugin se origina desde una superficie de chat entregable, el mismo chat
ahora puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a canales como Slack, Matrix y
Microsoft Teams además de los flujos existentes de Web UI y terminal UI.

Esta ruta compartida de comandos de texto usa el modelo normal de autenticación del canal para esa conversación. Si el
chat de origen ya puede enviar comandos y recibir respuestas, las solicitudes de aprobación ya no necesitan un
adaptador de entrega nativo separado solo para permanecer pendientes.

Discord y Telegram también admiten `/approve` en el mismo chat, pero esos canales siguen usando su
lista resuelta de aprobadores para la autorización incluso cuando la entrega de aprobaciones nativa está deshabilitada.

Para Telegram y otros clientes de aprobación nativos que llaman directamente al Gateway,
este fallback está delimitado intencionalmente a fallos de "aprobación no encontrada". Una denegación/error real de
aprobación de exec no se reintenta silenciosamente como una aprobación de Plugin.

### Entrega de aprobaciones nativa

Algunos canales también pueden actuar como clientes de aprobación nativos. Los clientes nativos agregan DM de aprobadores, fanout al chat de origen
y UX interactiva de aprobación específica del canal sobre el flujo compartido de `/approve`
en el mismo chat.

Cuando hay tarjetas/botones de aprobación nativos disponibles, esa UI nativa es la ruta principal
orientada al agente. El agente no debería repetir también un comando de chat sin formato
`/approve` duplicado a menos que el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o que
la aprobación manual es la única ruta restante.

Si se configura un cliente de aprobación nativo pero no hay un runtime nativo activo para
el canal de origen, OpenClaw mantiene visible la solicitud local determinista de `/approve`.
Si el runtime nativo está activo e intenta la entrega pero ningún
destino recibe la tarjeta, OpenClaw envía un aviso de fallback en el mismo chat con el
comando exacto `/approve <id> <decision>` para que la solicitud todavía pueda resolverse.

Modelo genérico:

- la política de exec del host sigue decidiendo si se requiere aprobación de exec
- `approvals.exec` controla el reenvío de solicitudes de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si los clientes nativos específicos de canales como Discord, Slack, Telegram y similares
  están habilitados
- las aprobaciones de Plugin de Slack pueden usar el cliente de aprobación nativo de Slack cuando la solicitud viene de Slack
  y se resuelven aprobadores de Plugin de Slack; `approvals.plugin` también puede enrutar aprobaciones de Plugin a sesiones
  o destinos de Slack incluso cuando las aprobaciones de exec de Slack están deshabilitadas
- las tarjetas de aprobación nativas de Google Chat gestionan aprobaciones de exec y de Plugin que se originan en espacios
  o hilos de Google Chat cuando se resuelven aprobadores estables `users/<id>` desde `dm.allowFrom` o
  `defaultTo`; no usan eventos de reacción para las decisiones
- la entrega de aprobaciones por reacción de WhatsApp y Signal está controlada por `approvals.exec` y
  `approvals.plugin`; no tienen bloques `channels.<channel>.execApprovals`

Los clientes de aprobación nativos habilitan automáticamente la entrega con DM primero cuando todo esto es verdadero:

- el canal admite entrega de aprobaciones nativa
- los aprobadores pueden resolverse desde `execApprovals.approvers` explícito o desde una identidad
  de propietario como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` no está definido o es `"auto"`

Configura `enabled: false` para deshabilitar explícitamente un cliente de aprobación nativo. Configura `enabled: true` para forzarlo
cuando se resuelvan aprobadores. La entrega pública al chat de origen sigue siendo explícita mediante
`channels.<channel>.execApprovals.target`.

FAQ: [¿Por qué hay dos configuraciones de aprobación de exec para aprobaciones por chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: configura aprobadores estables con `channels.googlechat.dm.allowFrom` o
  `channels.googlechat.defaultTo`; no se requiere ningún bloque `execApprovals`
- WhatsApp: usa `approvals.exec` y `approvals.plugin` para enrutar solicitudes de aprobación a WhatsApp
- Signal: usa `approvals.exec` y `approvals.plugin` para enrutar solicitudes de aprobación a Signal

Estos clientes de aprobación nativos agregan enrutamiento por DM y fanout de canal opcional sobre el flujo compartido
de `/approve` en el mismo chat y los botones de aprobación compartidos.

Comportamiento compartido:

- Slack, Matrix, Microsoft Teams y chats entregables similares usan el modelo normal de autenticación del canal
  para `/approve` en el mismo chat
- cuando un cliente de aprobación nativo se habilita automáticamente, el destino predeterminado de entrega nativa son los DM de aprobadores
- para Discord y Telegram, solo los aprobadores resueltos pueden aprobar o denegar
- los aprobadores de Discord pueden ser explícitos (`execApprovals.approvers`) o inferirse de `commands.ownerAllowFrom`
- los aprobadores de Telegram pueden ser explícitos (`execApprovals.approvers`) o inferirse de `commands.ownerAllowFrom`
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferirse de `commands.ownerAllowFrom`
- los DM de aprobación de Plugin de Slack usan aprobadores de Plugin de Slack desde `allowFrom` y el enrutamiento
  predeterminado de la cuenta, no los aprobadores de exec de Slack
- los botones nativos de Slack preservan el tipo de id de aprobación, por lo que los ids `plugin:` pueden resolver aprobaciones de Plugin
  sin una segunda capa de fallback local de Slack
- las tarjetas nativas de Google Chat preservan el fallback manual de `/approve` en el texto del mensaje, pero las devoluciones de llamada
  de los botones de tarjeta solo llevan tokens de acción opacos; el id de aprobación y la decisión se recuperan del estado
  pendiente del lado del servidor
- las aprobaciones con emoji de WhatsApp gestionan solicitudes de exec y de Plugin solo cuando la familia de
  reenvío de nivel superior correspondiente está habilitada y enruta a WhatsApp; el reenvío de WhatsApp solo a destino permanece en
  la ruta de reenvío compartida a menos que coincida con el mismo destino nativo de origen
- las aprobaciones por reacción de Signal gestionan solicitudes de exec y de Plugin solo cuando la familia de
  reenvío de nivel superior correspondiente está habilitada y enruta a Signal. Las aprobaciones directas de exec de Signal en el mismo chat pueden
  suprimir el fallback local de `/approve` sin aprobadores explícitos; la resolución de reacciones de Signal
  sigue requiriendo aprobadores explícitos de Signal desde `channels.signal.allowFrom` o `defaultTo`.
- el enrutamiento nativo por DM/canal de Matrix y los atajos por reacción gestionan aprobaciones de exec y de Plugin;
  la autorización de Plugin sigue viniendo de `channels.matrix.dm.allowFrom`
- las solicitudes nativas de Matrix incluyen contenido de evento personalizado `com.openclaw.approval` en el primer evento
  de solicitud para que los clientes Matrix compatibles con OpenClaw puedan leer el estado estructurado de aprobación mientras los clientes estándar
  mantienen el fallback de `/approve` en texto sin formato
- el solicitante no necesita ser un aprobador
- el chat de origen puede aprobar directamente con `/approve` cuando ese chat ya admite comandos y respuestas
- los botones nativos de aprobación de Discord enrutan según el tipo de id de aprobación: los ids `plugin:` van
  directamente a aprobaciones de Plugin, todo lo demás va a aprobaciones de exec
- los botones nativos de aprobación de Telegram siguen el mismo fallback delimitado de exec a Plugin que `/approve`
- cuando `target` nativo habilita la entrega al chat de origen, las solicitudes de aprobación incluyen el texto del comando
- las aprobaciones de exec pendientes caducan después de 30 minutos de forma predeterminada
- si ninguna UI de operador o cliente de aprobación configurado puede aceptar la solicitud, la solicitud recurre a `askFallback`

Los comandos de grupo sensibles solo para propietarios, como `/diagnostics` y `/export-trajectory`, usan enrutamiento privado
de propietario para las solicitudes de aprobación y los resultados finales. OpenClaw primero intenta una ruta privada en la
misma superficie donde el propietario ejecutó el comando. Si esa superficie no tiene una ruta privada de propietario, recurre
a la primera ruta de propietario disponible desde `commands.ownerAllowFrom`, de modo que un comando de grupo de Discord
todavía puede enviar la aprobación y el resultado al DM de Telegram del propietario cuando Telegram es la interfaz privada
principal configurada. El chat de grupo solo recibe un breve acuse de recibo.

Telegram usa de forma predeterminada DM de aprobadores (`target: "dm"`). Puedes cambiar a `channel` o `both` cuando
quieras que las solicitudes de aprobación aparezcan también en el chat/tema de Telegram de origen. Para temas de foro de Telegram,
OpenClaw preserva el tema para la solicitud de aprobación y el seguimiento posterior a la aprobación.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flujo IPC de macOS
__OC_I18N_900004__
Notas de seguridad:

- Modo de socket Unix `0600`, token almacenado en `exec-approvals.json`.
- Comprobación de par con el mismo UID.
- Desafío/respuesta (nonce + token HMAC + hash de solicitud) + TTL corto.

## FAQ

### ¿Cuándo se usarían `accountId` y `threadId` en un destino de aprobación?

Usa `accountId` cuando el canal tiene varias identidades configuradas y la solicitud de aprobación debe
salir por una cuenta específica. Usa `threadId` cuando el destino admite temas o
hilos y la solicitud debe permanecer dentro de ese hilo en lugar del chat de nivel superior.

Un caso concreto de Telegram es un supergrupo de operaciones con temas de foro y dos cuentas de bot de Telegram.
El valor `to` nombra el supergrupo, `accountId` selecciona la cuenta de bot y `threadId`
selecciona el tema de foro:
__OC_I18N_900005__
Con esa configuración, las aprobaciones de exec reenviadas las publica la cuenta de Telegram `ops-bot` en el tema
`77` del chat `-1001234567890`. Un destino sin `accountId` usa la cuenta predeterminada del canal, y
un destino sin `threadId` publica en el destino de nivel superior.

### Cuando las aprobaciones se envían a una sesión, ¿cualquier persona en esa sesión puede aprobarlas?

No. La entrega a sesión solo controla dónde aparece la solicitud. Por sí sola no autoriza a todos los
participantes de ese chat a aprobar.

Para `/approve` genérico en el mismo chat, el remitente ya debe estar autorizado para comandos en esa
sesión de canal. Si el canal expone aprobadores de aprobación explícitos, esos aprobadores pueden autorizar
la acción `/approve` incluso cuando de otro modo no estén autorizados para comandos en esa sesión.

Algunos canales son más estrictos. Discord, Telegram, Matrix, los DM de aprobación nativos de Slack y clientes
de aprobación nativos similares usan sus listas resueltas de aprobadores para la autorización de aprobación. Por ejemplo,
una solicitud de aprobación en un tema de foro de Telegram puede ser visible para todos en el tema, pero solo los IDs
numéricos de usuario de Telegram resueltos desde `channels.telegram.execApprovals.approvers` o
`commands.ownerAllowFrom` pueden aprobarla o denegarla.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals) — política principal y flujo de aprobación
- [Herramienta exec](/es/tools/exec)
- [Modo elevado](/es/tools/elevated)
- [Skills](/es/tools/skills) — comportamiento de auto-permisión respaldado por Skills
