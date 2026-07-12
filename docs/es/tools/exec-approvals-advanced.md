---
read_when:
    - Configuración de binarios seguros o perfiles personalizados de binarios seguros
    - Reenvío de aprobaciones a Slack/Discord/Telegram u otros canales de chat
    - Implementación de un cliente nativo de aprobaciones para un canal
summary: 'Aprobaciones avanzadas de ejecución: binarios seguros, vinculación de intérpretes, reenvío de aprobaciones, entrega nativa'
title: Aprobaciones de ejecución — avanzado
x-i18n:
    generated_at: "2026-07-12T14:53:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Temas avanzados de aprobación de ejecución: la vía rápida `safeBins`, la vinculación de intérpretes/entornos de ejecución
y el reenvío de aprobaciones a canales de chat (incluida la entrega nativa).
Para consultar la política principal y el flujo de aprobación, véase [Aprobaciones de ejecución](/es/tools/exec-approvals).

## Binarios seguros (solo stdin)

`tools.exec.safeBins` identifica binarios **solo para stdin** (por ejemplo, `cut`) que
se ejecutan en modo de lista de permitidos **sin** entradas explícitas en dicha lista. Los binarios seguros rechazan
los argumentos de archivo posicionales y los tokens con formato de ruta, por lo que solo pueden operar sobre el
flujo entrante. Esto debe considerarse una vía rápida limitada para filtros de flujo, no una
lista general de confianza.

<Warning>
**No** añada binarios de intérpretes o entornos de ejecución (por ejemplo, `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Si un comando puede evaluar código,
ejecutar subcomandos o leer archivos por diseño, utilice preferentemente entradas explícitas en la lista de permitidos
y mantenga activadas las solicitudes de aprobación. Los binarios seguros personalizados deben definir un
perfil explícito en `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binarios seguros predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si decide incluirlos, mantenga entradas
explícitas en la lista de permitidos para sus flujos de trabajo que no usan stdin. Para `grep` en modo de binario seguro,
proporcione el patrón con `-e`/`--regexp`; se rechaza la forma de patrón posicional
para impedir que se introduzcan operandos de archivo como argumentos posicionales ambiguos.

### Validación de argv y opciones denegadas

La validación se determina únicamente y de forma reproducible a partir de la estructura de argv (sin
comprobar la existencia de archivos en el sistema de archivos del host), lo que evita que las diferencias entre
permitir y denegar actúen como un oráculo de existencia de archivos. Las opciones orientadas a archivos se deniegan
para los binarios seguros predeterminados; las opciones largas se validan con denegación por defecto (se rechazan
las opciones desconocidas y las abreviaturas ambiguas). Se aceptan las opciones booleanas
reconocidas de solo lectura de los binarios predeterminados (por ejemplo, `wc -l`, `tr -d`, `uniq -c`), mientras que las opciones cortas
no reconocidas permanecen denegadas por defecto y pasan a aprobación manual.

Opciones denegadas por perfil de binario seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Los binarios seguros también obligan a tratar los tokens de argv como **texto literal** durante la ejecución
(sin expansión de comodines ni de `$VARS`) en los segmentos que solo usan stdin, por lo que
patrones como `*` o `$HOME/...` no pueden utilizarse para introducir lecturas de archivos. `awk`,
`sed` y `jq` siempre se deniegan como binarios seguros porque no es posible validar que su semántica
se limite a stdin: `jq` puede leer datos del entorno y cargar código jq desde
módulos o archivos de inicio. Para esas herramientas, utilice una entrada explícita en la lista de permitidos o una solicitud de aprobación
en lugar de `safeBins`.

### Directorios de binarios de confianza

Los binarios seguros deben resolverse desde directorios de binarios de confianza (los valores predeterminados del sistema más
el valor opcional `tools.exec.safeBinTrustedDirs`). Las entradas de `PATH` nunca se consideran de confianza automáticamente.
Los directorios de confianza predeterminados son deliberadamente mínimos: `/bin`, `/usr/bin`. Si
el ejecutable del binario seguro se encuentra en rutas del gestor de paquetes o del usuario (por ejemplo,
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), añádalas
explícitamente a `tools.exec.safeBinTrustedDirs`.

### Encadenamiento del shell, envoltorios y multiplexores

El encadenamiento del shell (`&&`, `||`, `;`) está permitido cuando todos los segmentos de nivel superior
cumplen la lista de permitidos (incluidos los binarios seguros o la autorización automática de Skills). Las redirecciones
siguen sin estar disponibles en el modo de lista de permitidos. La sustitución de comandos (`$()` / comillas invertidas) se
rechaza durante el análisis de la lista de permitidos, incluso dentro de comillas dobles; utilice comillas
simples si necesita texto `$()` literal.

En las aprobaciones de la aplicación complementaria para macOS, el texto sin procesar del shell que contenga sintaxis de control o
expansión del shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se
considera una ausencia de coincidencia en la lista de permitidos, a menos que el propio binario del shell esté incluido en ella.

Para los envoltorios del shell (`bash|sh|zsh ... -c/-lc`), las anulaciones del entorno limitadas a la solicitud se
reducen a una pequeña lista explícita de permitidos (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para las decisiones `allow-always` en modo de lista de permitidos, los envoltorios de despacho transparentes
(por ejemplo, `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan la
ruta del ejecutable interno en lugar de la ruta del envoltorio. Los multiplexores del shell
(`busybox`, `toybox`) se desempaquetan del mismo modo para los subprogramas del shell (`sh`, `ash`, etc.).
Si un envoltorio o multiplexor no puede desempaquetarse de forma segura, no se conserva automáticamente
ninguna entrada en la lista de permitidos.

Si incluye intérpretes como `python3` o `node` en la lista de permitidos, se recomienda usar
`tools.exec.strictInlineEval=true` para que la evaluación en línea siga requiriendo una aprobación
explícita. En modo estricto, `allow-always` aún puede conservar invocaciones
inofensivas de intérpretes o scripts, pero los mecanismos de evaluación en línea no se conservan
automáticamente.

### Binarios seguros frente a lista de permitidos

| Tema             | `tools.exec.safeBins`                                           | Lista de permitidos (`exec-approvals.json`)                                                          |
| ---------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Objetivo         | Permitir automáticamente filtros limitados de stdin             | Confiar explícitamente en ejecutables concretos                                                      |
| Tipo de coincidencia | Nombre del ejecutable + política de argv del binario seguro | Patrón glob de ruta del ejecutable resuelta o patrón glob del nombre de comando para comandos invocados mediante PATH |
| Ámbito de argumentos | Restringido por el perfil del binario seguro y las reglas de tokens literales | Coincidencia de ruta de forma predeterminada; `argPattern` opcional puede restringir el argv analizado |
| Ejemplos habituales | `head`, `tail`, `tr`, `wc`                                  | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizadas                                                |
| Uso recomendado  | Transformaciones de texto de bajo riesgo en canalizaciones      | Cualquier herramienta con comportamiento más amplio o efectos secundarios                           |

Ubicación de la configuración:

- `safeBins` procede de la configuración (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` procede de la configuración (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` procede de la configuración (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` por agente). Las claves de perfil por agente prevalecen sobre las globales.
- Las entradas de la lista de permitidos se encuentran en el archivo local de aprobaciones del host, bajo `agents.<id>.allowlist` (o mediante Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` muestra la advertencia `tools.exec.safe_bins_interpreter_unprofiled` cuando aparecen binarios de intérprete o entorno de ejecución en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede crear la estructura inicial de las entradas personalizadas `safeBinProfiles.<bin>` que falten como `{}` (revísela y restrínjala después). Los binarios de intérpretes o entornos de ejecución no se crean automáticamente.

Ejemplo de perfil personalizado:
__OC_I18N_900000__
## Comandos de intérpretes y entornos de ejecución

Las ejecuciones de intérpretes o entornos de ejecución respaldadas por aprobación son deliberadamente conservadoras:

- El contexto exacto de argv/cwd/env siempre queda vinculado.
- Las formas de script de shell directo y archivo directo del entorno de ejecución se vinculan, en la medida de lo posible, a una instantánea concreta de un
  archivo local.
- Las formas habituales de envoltorios de gestores de paquetes que aún se resuelven en un único archivo local directo (por ejemplo,
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desempaquetan antes de la vinculación.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete o entorno de ejecución
  (por ejemplo, scripts de paquetes, formas de evaluación, cadenas de cargadores específicas del entorno de ejecución o formas ambiguas con varios archivos),
  se deniega la ejecución respaldada por aprobación en lugar de atribuirle una cobertura semántica que no
  posee.
- Para esos flujos de trabajo, se recomienda usar aislamiento, un límite de host independiente o un flujo completo o una lista de permitidos
  explícita y de confianza donde el operador acepte la semántica más amplia del entorno de ejecución.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente un identificador de aprobación. Utilice ese identificador para
correlacionar los eventos posteriores del sistema de la ejecución aprobada (`Exec finished` y `Exec running` cuando esté configurado).
Si no se recibe ninguna decisión antes de que venza el tiempo de espera, la solicitud se considera una aprobación agotada y
se presenta como una denegación terminal del comando del host. Para las aprobaciones asíncronas del agente principal con una
sesión de origen, OpenClaw también reanuda esa sesión con un seguimiento interno para que el agente observe que
el comando no se ejecutó, en lugar de intentar corregir posteriormente la ausencia del resultado. Las aprobaciones de ejecución pendientes caducan
después de 30 minutos de forma predeterminada.

### Comportamiento de entrega del seguimiento

Cuando finaliza una ejecución asíncrona aprobada, OpenClaw envía un turno de seguimiento `agent` a la misma sesión.
Las aprobaciones asíncronas denegadas utilizan la misma ruta de seguimiento de la sesión principal para comunicar el estado de denegación, pero
no registran transferencias elevadas del entorno de ejecución ni ejecutan el comando. Las denegaciones sin una sesión principal
que pueda reanudarse se suprimen o se notifican mediante una ruta directa segura, cuando exista alguna.

- Si existe un destino externo de entrega válido (un canal que admita entregas más un destino `to`), la entrega del seguimiento utiliza ese canal.
- En flujos exclusivos de chat web o de sesiones internas sin destino externo, la entrega del seguimiento permanece únicamente en la sesión (`deliver: false`).
- Si un invocador solicita explícitamente una entrega externa estricta sin un canal externo que pueda resolverse, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está activado y no puede resolverse ningún canal externo, la entrega se degrada a solo la sesión en lugar de fallar.

## Reenvío de aprobaciones a canales de chat

Puede reenviar las solicitudes de aprobación de ejecución a cualquier canal de chat (incluidos los canales de plugins) y aprobarlas
con `/approve`. Para ello se utiliza la canalización normal de entrega saliente.

Configuración:
__OC_I18N_900001__
Responda en el chat:
__OC_I18N_900002__
El comando `/approve` gestiona tanto las aprobaciones de ejecución como las aprobaciones de plugins. Si el identificador no coincide con una aprobación de ejecución pendiente, comprueba automáticamente las aprobaciones de plugins. Esta alternativa se limita a los errores de «aprobación no encontrada»; una denegación o un error real de una aprobación de ejecución no vuelve a intentarse silenciosamente como aprobación de un plugin.

### Reenvío de aprobaciones de plugins

El reenvío de aprobaciones de plugins utiliza la misma canalización de entrega que las aprobaciones de ejecución, pero tiene su propia
configuración independiente en `approvals.plugin`. Activar o desactivar una no afecta a la otra.
Para consultar el comportamiento de creación de plugins, los campos de solicitud y la semántica de las decisiones, véase
[Solicitudes de permisos de plugins](/plugins/plugin-permission-requests).
__OC_I18N_900003__
La estructura de configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` y `targets` funcionan de la misma manera.

Los canales que admiten respuestas interactivas compartidas muestran los mismos botones de aprobación tanto para aprobaciones de ejecución como de plugins. Los canales sin una interfaz de usuario interactiva compartida recurren a texto sin formato con instrucciones de `/approve`. Las solicitudes de aprobación de plugins pueden restringir las decisiones disponibles: las superficies de aprobación usan el conjunto de decisiones declarado en la solicitud, y el Gateway rechaza los intentos de enviar una decisión que no se haya ofrecido.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de ejecución o de plugin se origina en una superficie de chat con capacidad de entrega, ese mismo chat puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a Slack, Matrix, Microsoft Teams y chats similares con capacidad de entrega, además de los flujos existentes de la interfaz web y la interfaz de terminal, usando el modelo normal de autenticación del canal para esa conversación. Si el chat de origen ya puede enviar comandos y recibir respuestas, las solicitudes de aprobación ya no necesitan un adaptador de entrega nativo independiente solo para permanecer pendientes.

Discord, Telegram y QQ bot también admiten `/approve` en el mismo chat, pero esos canales siguen usando su lista de aprobadores resuelta para la autorización incluso cuando la entrega nativa de aprobaciones está deshabilitada.

### Entrega nativa de aprobaciones

Algunos canales también pueden actuar como clientes nativos de aprobación: Discord, Slack, Telegram, Matrix y QQ bot. Los clientes nativos añaden mensajes directos a los aprobadores, distribución al chat de origen y una experiencia de usuario interactiva de aprobación específica del canal, además del flujo compartido de `/approve` en el mismo chat.

Cuando hay tarjetas o botones de aprobación nativos disponibles, esa interfaz nativa es la vía principal orientada al agente. El agente no debe repetir además un comando `/approve` duplicado en texto sin formato en el chat, salvo que el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía restante.

Si hay un cliente nativo de aprobación configurado, pero no hay un entorno de ejecución nativo activo para el canal de origen, OpenClaw mantiene visible el mensaje determinista local de `/approve`. Si el entorno de ejecución nativo está activo e intenta realizar la entrega, pero ningún destino recibe la tarjeta, OpenClaw envía un aviso alternativo en el mismo chat con el comando exacto `/approve <id> <decision>` para que la solicitud aún pueda resolverse.

Modelo genérico:

- la política de ejecución del host sigue determinando si se requiere aprobación de ejecución
- `approvals.exec` controla el reenvío de mensajes de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si están habilitados los clientes nativos específicos del canal para Discord, Slack, Telegram, QQ bot y canales similares
- las aprobaciones de plugins de Slack pueden usar el cliente nativo de aprobación de Slack cuando la solicitud procede de Slack y se resuelven aprobadores de plugins de Slack; `approvals.plugin` también puede dirigir aprobaciones de plugins a sesiones o destinos de Slack incluso cuando las aprobaciones de ejecución de Slack están deshabilitadas
- las tarjetas nativas de aprobación de Google Chat gestionan las aprobaciones de ejecución y de plugins que se originan en espacios o hilos de Google Chat cuando se resuelven aprobadores estables `users/<id>` desde `dm.allowFrom` o `defaultTo`; no usan eventos de reacción para las decisiones
- la entrega de aprobaciones mediante reacciones en WhatsApp y Signal está controlada por `approvals.exec` y `approvals.plugin`; no disponen de bloques `channels.<channel>.execApprovals`

Los clientes nativos de aprobación habilitan automáticamente la entrega prioritaria por mensaje directo cuando se cumplen todas estas condiciones:

- el canal admite la entrega nativa de aprobaciones
- los aprobadores pueden resolverse a partir de `execApprovals.approvers` explícitos o de la identidad del propietario, como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` no está definido o tiene el valor `"auto"`

Establezca `enabled: false` para deshabilitar explícitamente un cliente nativo de aprobación. Establezca `enabled: true` para forzar su activación cuando se resuelvan aprobadores. La entrega pública al chat de origen sigue siendo explícita mediante `channels.<channel>.execApprovals.target`. Cuando el `target` nativo habilita la entrega al chat de origen, los mensajes de aprobación incluyen el texto del comando.

Preguntas frecuentes: [¿Por qué existen dos configuraciones de aprobación de ejecución para las aprobaciones por chat?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: configure aprobadores estables con `channels.googlechat.dm.allowFrom` o `channels.googlechat.defaultTo`; no se requiere ningún bloque `execApprovals`
- WhatsApp: use `approvals.exec` y `approvals.plugin` para dirigir mensajes de aprobación a WhatsApp
- Signal: use `approvals.exec` y `approvals.plugin` para dirigir mensajes de aprobación a Signal

Enrutamiento específico de clientes nativos:

- Telegram usa de forma predeterminada mensajes directos a los aprobadores (`target: "dm"`). Cambie a `channel` o `both` para mostrar también los mensajes de aprobación en el chat o tema de Telegram de origen. En los temas de foros de Telegram, OpenClaw conserva el tema tanto para el mensaje de aprobación como para el seguimiento posterior a la aprobación.
- los aprobadores de Discord y Telegram pueden ser explícitos (`execApprovals.approvers`) o inferirse de `commands.ownerAllowFrom`; solo los aprobadores resueltos pueden aprobar o denegar.
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferirse de `commands.ownerAllowFrom`. Los mensajes directos de aprobación de plugins de Slack usan aprobadores de plugins de Slack obtenidos de `allowFrom` y del enrutamiento predeterminado de la cuenta, no los aprobadores de ejecución de Slack. Los botones nativos de Slack conservan el tipo del identificador de aprobación, por lo que los identificadores `plugin:` pueden resolver aprobaciones de plugins sin una segunda capa alternativa local de Slack.
- las tarjetas nativas de Google Chat conservan la alternativa manual de `/approve` en el texto del mensaje, pero las devoluciones de llamada de los botones de la tarjeta solo transportan tokens de acción opacos; el identificador de aprobación y la decisión se recuperan del estado pendiente del servidor.
- las aprobaciones mediante emojis de WhatsApp gestionan tanto mensajes de ejecución como de plugins cuando la familia de reenvío de nivel superior correspondiente dirige el mensaje a WhatsApp. Los mensajes de origen nativo se vinculan directamente; la entrega en modo de destino compartido vincula los mismos metadatos tipados de aprobación al recibo del mensaje aceptado de WhatsApp.
- las aprobaciones mediante reacciones de Signal gestionan tanto mensajes de ejecución como de plugins solo cuando la familia de reenvío de nivel superior correspondiente está habilitada y dirige el mensaje a Signal. Las aprobaciones directas de ejecución de Signal en el mismo chat pueden suprimir la alternativa local de `/approve` sin aprobadores explícitos; la resolución mediante reacciones de Signal sigue requiriendo aprobadores explícitos de Signal procedentes de `channels.signal.allowFrom` o `defaultTo`.
- el enrutamiento nativo por mensaje directo o canal y los atajos mediante reacciones de Matrix gestionan tanto aprobaciones de ejecución como de plugins; la autorización de plugins sigue procediendo de `channels.matrix.dm.allowFrom`. Los mensajes nativos de Matrix incluyen contenido de evento personalizado `com.openclaw.approval` en el primer evento del mensaje para que los clientes de Matrix compatibles con OpenClaw puedan leer el estado estructurado de la aprobación, mientras que los clientes estándar conservan la alternativa de `/approve` en texto sin formato.
- los botones nativos de aprobación de Discord y Telegram transportan un tipo de propietario explícito de ejecución o de plugin en datos privados de devolución de llamada del transporte y solo resuelven ese propietario. Los controles `/approve` más antiguos que carecen de tipo siguen siendo una vía de compatibilidad limitada: solo prueban los tipos de propietario que el actor puede aprobar, continúan únicamente después de un resultado que indique que no se encontró la aprobación y nunca deducen la propiedad a partir del identificador de aprobación.
- no es necesario que el solicitante sea un aprobador.
- si ninguna interfaz de operador ni ningún cliente de aprobación configurado puede aceptar la solicitud, el mensaje recurre a `askFallback`.

Los comandos sensibles de grupo exclusivos del propietario, como `/diagnostics` y `/export-trajectory`, usan enrutamiento privado del propietario para los mensajes de aprobación y los resultados finales. OpenClaw intenta primero una ruta privada en la misma superficie donde el propietario ejecutó el comando. Si esa superficie no dispone de una ruta privada para el propietario, recurre a la primera ruta disponible del propietario en `commands.ownerAllowFrom`, por lo que un comando de grupo de Discord aún puede enviar la aprobación y el resultado al mensaje directo de Telegram del propietario cuando Telegram es la interfaz privada principal configurada. El chat grupal solo recibe un breve acuse de recibo.

Consulte:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Aplicaciones móviles oficiales para operadores

Las aplicaciones oficiales para iOS y Android también pueden revisar las aprobaciones de ejecución pendientes propiedad del Gateway cuando se usa una conexión `operator.admin` o cuando el dispositivo `operator.approvals` vinculado se ha establecido explícitamente como destino de la solicitud. Leen el mismo registro persistente sanitizado que usa la interfaz de control, envían una decisión que tiene en cuenta el tipo y muestran el resultado canónico de la primera respuesta del Gateway. El Apple Watch replica estos mensajes de aprobación mediante el iPhone vinculado, con acciones para permitir una vez y denegar. El modo de Gateway directo del Watch no revisa aprobaciones.

La pérdida de un acuse de recibo de resolución no convierte la elección enviada en autoritativa: la aplicación deshabilita los controles y vuelve a leer el registro. Si otra superficie se adelantó, la aplicación muestra esa decisión registrada. Los mensajes pendientes permanecen vinculados al Gateway que los emitió, por lo que cambiar el Gateway activo no puede redirigir un identificador de aprobación antiguo.

### Flujo IPC de macOS
__OC_I18N_900004__
Notas de seguridad:

- Modo del socket Unix `0600`, token almacenado en `exec-approvals.json`.
- Comprobación del par con el mismo UID.
- Desafío/respuesta (nonce + token HMAC + hash de la solicitud) + TTL breve.

## Preguntas frecuentes

### ¿Cuándo se usarían `accountId` y `threadId` en un destino de aprobación?

Use `accountId` cuando el canal tenga varias identidades configuradas y el mensaje de aprobación deba enviarse mediante una cuenta específica. Use `threadId` cuando el destino admita temas o hilos y el mensaje deba permanecer dentro de ese hilo en lugar de publicarse en el chat de nivel superior.

Un caso concreto de Telegram es un supergrupo de operaciones con temas de foro y dos cuentas de bot de Telegram. El valor `to` identifica el supergrupo, `accountId` selecciona la cuenta del bot y `threadId` selecciona el tema del foro:
__OC_I18N_900005__
Con esta configuración, las aprobaciones de ejecución reenviadas se publican mediante la cuenta de Telegram `ops-bot` en el tema `77` del chat `-1001234567890`. Un destino sin `accountId` usa la cuenta predeterminada del canal, y un destino sin `threadId` publica en el destino de nivel superior.

### Cuando las aprobaciones se envían a una sesión, ¿puede aprobarlas cualquier participante de esa sesión?

No. La entrega a la sesión solo controla dónde aparece el mensaje. Por sí sola, no autoriza a todos los participantes de ese chat a aprobar.

Para un `/approve` genérico en el mismo chat, el remitente ya debe estar autorizado para ejecutar comandos en esa sesión del canal. Si el canal expone aprobadores de aprobación explícitos, esos aprobadores pueden autorizar la acción `/approve` incluso cuando no estén autorizados de otro modo para ejecutar comandos en esa sesión.

Algunos canales son más estrictos. Discord, Telegram, Matrix, los mensajes directos nativos de aprobación de Slack y clientes nativos de aprobación similares usan sus listas de aprobadores resueltas para autorizar las aprobaciones. Por ejemplo, un mensaje de aprobación en un tema de foro de Telegram puede ser visible para todos los participantes del tema, pero solo los identificadores numéricos de usuarios de Telegram resueltos desde `channels.telegram.execApprovals.approvers` o `commands.ownerAllowFrom` pueden aprobarlo o denegarlo.

## Contenido relacionado

- [Aprobaciones de ejecución](/es/tools/exec-approvals) — política principal y flujo de aprobación
- [Herramienta de ejecución](/es/tools/exec)
- [Modo elevado](/es/tools/elevated)
- [Skills](/es/tools/skills) — comportamiento de autorización automática respaldado por Skills
