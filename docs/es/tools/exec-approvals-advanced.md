---
read_when:
    - Configuración de binarios seguros o perfiles personalizados de binarios seguros
    - Reenvío de aprobaciones a Slack/Discord/Telegram u otros canales de chat
    - Implementación de un cliente de aprobación nativo para un canal
summary: 'Aprobaciones avanzadas de ejecución: binarios seguros, vinculación del intérprete, reenvío de aprobaciones, entrega nativa'
title: Aprobaciones de ejecución — opciones avanzadas
x-i18n:
    generated_at: "2026-07-22T10:51:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ac90d41f867a8ae4f14b6c9c13f3732d102a65707f456623932b858145a9bf46
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Temas avanzados de aprobación de ejecución: la vía rápida `safeBins`, la vinculación de intérpretes/entornos de ejecución
y el reenvío de aprobaciones a canales de chat (incluida la entrega nativa).
Para conocer la política principal y el flujo de aprobación, consulte [Aprobaciones de ejecución](/es/tools/exec-approvals).

## Binarios seguros (solo stdin)

`tools.exec.safeBins` especifica binarios **solo para stdin** (por ejemplo, `cut`) que
se ejecutan en modo de lista de permitidos **sin** entradas explícitas en dicha lista. Los binarios seguros rechazan
argumentos de archivo posicionales y tokens con apariencia de ruta, por lo que solo pueden operar sobre el
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
explícitas en la lista de permitidos para sus flujos de trabajo que no utilizan stdin. Para `grep` en modo de binario seguro,
proporcione el patrón mediante `-e`/`--regexp`; se rechaza el formato de patrón posicional
para impedir que se introduzcan operandos de archivo como argumentos posicionales ambiguos.

### Validación de argv y opciones denegadas

La validación es determinista y se basa únicamente en la estructura de argv (sin comprobar la existencia
de elementos en el sistema de archivos del host), lo que evita que las diferencias entre permitir y denegar
actúen como un oráculo de existencia de archivos. Las opciones orientadas a archivos se deniegan para los binarios seguros predeterminados; las
opciones largas se validan con cierre seguro (se rechazan las opciones desconocidas y las abreviaturas
ambiguas). Se aceptan las opciones booleanas de solo lectura reconocidas de los binarios predeterminados (por ejemplo,
`wc -l`, `tr -d`, `uniq -c`), mientras que las opciones cortas no reconocidas mantienen el
cierre seguro y pasan a aprobación manual.

Opciones denegadas por perfil de binario seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Los binarios seguros también fuerzan que los tokens de argv se traten como **texto literal** durante la ejecución
(sin expansión de comodines ni de `$VARS`) en los segmentos que solo utilizan stdin, de modo que
patrones como `*` o `$HOME/...` no puedan utilizarse para introducir lecturas de archivos. `awk`,
`sed` y `jq` siempre se deniegan como binarios seguros porque no es posible validar que su semántica
se limite a stdin: `jq` puede leer datos del entorno y cargar código jq desde
módulos o archivos de inicio. Para esas herramientas, utilice una entrada explícita en la lista de permitidos o una solicitud de aprobación
en lugar de `safeBins`.

### Directorios de binarios de confianza

Los binarios seguros deben resolverse desde directorios de binarios de confianza (los valores predeterminados del sistema más
el `tools.exec.safeBinTrustedDirs` opcional). Las entradas de `PATH` nunca se consideran de confianza automáticamente.
Los directorios de confianza predeterminados son intencionadamente mínimos: `/bin`, `/usr/bin`. Si
el ejecutable de su binario seguro se encuentra en rutas del gestor de paquetes o del usuario (por ejemplo,
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), añádalas
explícitamente a `tools.exec.safeBinTrustedDirs`.

### Encadenamiento de shell, envoltorios y multiplexores

El encadenamiento de shell (`&&`, `||`, `;`) está permitido cuando cada segmento de nivel superior
cumple la lista de permitidos (incluidos los binarios seguros o la autorización automática de Skills). Las redirecciones
siguen sin admitirse en el modo de lista de permitidos. La sustitución de comandos (`$()` / acentos graves) se
rechaza durante el análisis de la lista de permitidos, incluso dentro de comillas dobles; utilice comillas
simples si necesita texto `$()` literal.

En las aprobaciones de la aplicación complementaria para macOS, el texto de shell sin procesar que contiene sintaxis de control o
expansión de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se
considera una ausencia de coincidencia en la lista de permitidos, salvo que el propio binario de shell esté incluido en ella.

Para los envoltorios de shell (`bash|sh|zsh ... -c/-lc`), las sustituciones de variables de entorno con ámbito de solicitud se
reducen a una pequeña lista de permitidos explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para las decisiones `allow-always` en modo de lista de permitidos, los envoltorios de despacho transparentes
(por ejemplo, `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan la
ruta del ejecutable interno en lugar de la ruta del envoltorio. Los multiplexores de shell
(`busybox`, `toybox`) se desenvuelven del mismo modo para los subprogramas de shell (`sh`, `ash`, etc.).
Si un envoltorio o multiplexor no puede desenvolverse de forma segura, no se conserva automáticamente
ninguna entrada en la lista de permitidos.

Si incluye intérpretes como `python3` o `node` en la lista de permitidos, utilice preferentemente
`tools.exec.strictInlineEval=true` para que la evaluación en línea siga requiriendo una
aprobación explícita. En modo estricto, `allow-always` aún puede conservar invocaciones
inocuas de intérpretes o scripts, pero los mecanismos de evaluación en línea no se conservan
automáticamente.

### Binarios seguros frente a lista de permitidos

| Tema             | `tools.exec.safeBins`                                      | Lista de permitidos (`exec-approvals.json`)                                                   |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Objetivo         | Permitir automáticamente filtros limitados de stdin   | Confiar explícitamente en ejecutables específicos                                          |
| Tipo de coincidencia | Nombre del ejecutable + política de argv del binario seguro | Patrón global de ruta del ejecutable resuelta o patrón global del nombre simple del comando para comandos invocados mediante PATH |
| Ámbito de los argumentos | Restringido por el perfil del binario seguro y las reglas de tokens literales | Coincidencia de ruta de forma predeterminada; el `argPattern` opcional puede restringir el argv analizado |
| Ejemplos habituales | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizadas                                     |
| Uso recomendado  | Transformaciones de texto de bajo riesgo en pipelines | Cualquier herramienta con un comportamiento más amplio o efectos secundarios               |

Ubicación de la configuración:

- `safeBins` procede de la configuración (`tools.exec.safeBins` o `agents.entries.*.tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` procede de la configuración (`tools.exec.safeBinTrustedDirs` o `agents.entries.*.tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` procede de la configuración (`tools.exec.safeBinProfiles` o `agents.entries.*.tools.exec.safeBinProfiles` por agente). Las claves de perfil por agente prevalecen sobre las claves globales.
- Las entradas de la lista de permitidos se encuentran en el archivo de aprobaciones local del host, bajo `agents.<id>.allowlist` (o mediante la interfaz de control / `openclaw approvals allowlist ...`).
- `openclaw security audit` muestra una advertencia mediante `tools.exec.safe_bins_interpreter_unprofiled` cuando aparecen binarios de intérpretes o entornos de ejecución en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede generar la estructura de las entradas personalizadas `safeBinProfiles.<bin>` que falten como `{}` (revísela y restrínjala después). Los binarios de intérpretes o entornos de ejecución no se generan automáticamente.

Ejemplo de perfil personalizado:

```json5
{
  tools: {
    exec: {
      safeBins: ["myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Comandos de intérpretes o entornos de ejecución

Las ejecuciones de intérpretes o entornos de ejecución respaldadas por aprobación son intencionadamente conservadoras:

- Siempre se vincula el contexto exacto de argv/cwd/env.
- Los formatos de script de shell directo y archivo de entorno de ejecución directo se vinculan, en la medida de lo posible, a una única instantánea concreta de un
  archivo local.
- Los formatos habituales de envoltorios de gestores de paquetes que aún se resuelven en un único archivo local directo (por ejemplo,
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desenvuelven antes de la vinculación.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete o entorno de ejecución
  (por ejemplo, scripts de paquetes, formatos de evaluación, cadenas de cargadores específicas del entorno de ejecución o formatos ambiguos de varios archivos),
  la ejecución respaldada por aprobación se deniega en lugar de afirmar una cobertura semántica que no
  posee.
- Para esos flujos de trabajo, utilice preferentemente un entorno aislado, un límite de host independiente o un flujo explícito completo/de
  lista de permitidos de confianza en el que el operador acepte la semántica más amplia del entorno de ejecución.

Cuando se requieren aprobaciones, la herramienta de ejecución devuelve inmediatamente un identificador de aprobación. Utilice ese identificador para
correlacionar los eventos posteriores del sistema correspondientes a ejecuciones aprobadas (`Exec finished` y `Exec running` cuando esté configurado).
Si no se recibe ninguna decisión antes de que finalice el tiempo de espera, la solicitud se considera una aprobación agotada por tiempo de espera y
se muestra como una denegación terminal del comando del host. Para las aprobaciones asíncronas del agente principal con una
sesión de origen, OpenClaw también reanuda dicha sesión con un seguimiento interno para que el agente observe que
el comando no se ejecutó, en lugar de intentar reparar posteriormente un resultado ausente. Las aprobaciones de ejecución pendientes caducan
de forma predeterminada después de 30 minutos.

### Comportamiento de la entrega de seguimiento

Cuando finaliza una ejecución asíncrona aprobada, OpenClaw envía un turno de seguimiento `agent` a la misma sesión.
Las aprobaciones asíncronas denegadas utilizan la misma ruta de seguimiento de la sesión principal para comunicar el estado de denegación, pero
no registran transferencias elevadas del entorno de ejecución ni ejecutan el comando. Las denegaciones sin una
sesión principal que pueda reanudarse se suprimen o se comunican mediante una ruta directa segura cuando existe alguna.

- Si existe un destino de entrega externo válido (un canal que admita entregas más el destino `to`), la entrega de seguimiento utiliza ese canal.
- En flujos exclusivos de chat web o de sesiones internas sin destino externo, la entrega de seguimiento permanece únicamente en la sesión (`deliver: false`).
- Si un llamador solicita explícitamente una entrega externa estricta sin un canal externo que pueda resolverse, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está activado y no puede resolverse ningún canal externo, la entrega se degrada a solo sesión en lugar de fallar.

## Ámbitos mínimos para clientes de terceros

La resolución de aprobaciones del Gateway está protegida por el ámbito específico `operator.approvals`. Esto se aplica tanto al método específico del propietario `exec.approval.resolve` como al método independiente del tipo `approval.resolve`; `operator.write` no lo engloba. Los paneles e integraciones deben solicitar únicamente los ámbitos requeridos por los métodos que utilizan. Considere el acceso de resolución de aprobaciones como una autorización equivalente a la ejecución remota y conceda `operator.approvals` de manera deliberada, incluso cuando el cliente solo presente una pequeña interfaz de aprobación.

## Reenvío de aprobaciones a canales de chat

Puedes reenviar las solicitudes de aprobación de exec a cualquier canal de chat (incluidos los canales de plugins) y aprobarlas
con `/approve`. Esto utiliza el pipeline normal de entrega saliente.

Configuración:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Responde en el chat:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

El comando `/approve` gestiona tanto las aprobaciones de exec como las aprobaciones de plugins. Si el ID no coincide con una aprobación de exec pendiente, comprueba automáticamente las aprobaciones de plugins. Este mecanismo alternativo se limita a los fallos de «aprobación no encontrada»; una denegación o un error real de aprobación de exec no provoca silenciosamente un nuevo intento como aprobación de plugin.

### Reenvío de aprobaciones de plugins

El reenvío de aprobaciones de plugins utiliza el mismo pipeline de entrega que las aprobaciones de exec, pero tiene su propia
configuración independiente en `approvals.plugin`. Activar o desactivar uno no afecta al otro.
Para consultar el comportamiento de creación de plugins, los campos de solicitud y la semántica de las decisiones, consulta
[Solicitudes de permisos de plugins](/plugins/plugin-permission-requests).

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

La estructura de configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` y `targets` funcionan de la misma manera.

Los canales que admiten respuestas interactivas compartidas muestran los mismos botones de aprobación tanto para las aprobaciones de exec como para
las de plugins. Los canales sin una interfaz interactiva compartida recurren a texto sin formato con instrucciones de `/approve`.
Las solicitudes de aprobación de plugins pueden restringir las decisiones disponibles: las superficies de aprobación utilizan
el conjunto de decisiones declarado por la solicitud, y el Gateway rechaza los intentos de enviar una decisión que
no se ofreció.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de exec o de plugin se origina en una superficie de chat con capacidad de entrega, ese mismo chat
puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a Slack, Matrix, Microsoft Teams y
chats similares con capacidad de entrega, además de los flujos existentes de la interfaz web y la interfaz de terminal, mediante el
modelo normal de autenticación del canal para esa conversación. Si el chat de origen ya puede enviar comandos
y recibir respuestas, las solicitudes de aprobación ya no necesitan un adaptador de entrega nativo independiente solo para
permanecer pendientes.

Discord, Telegram y QQ bot también admiten `/approve` en el mismo chat, pero esos canales siguen utilizando su
lista de aprobadores resuelta para la autorización, incluso cuando la entrega nativa de aprobaciones está desactivada.

### Entrega nativa de aprobaciones

Algunos canales también pueden actuar como clientes nativos de aprobación: Discord, Slack, Telegram, Matrix y QQ bot.
Los clientes nativos añaden mensajes directos a los aprobadores, distribución al chat de origen y una experiencia interactiva de aprobación específica del canal,
además del flujo compartido de `/approve` en el mismo chat.

Cuando hay disponibles tarjetas o botones nativos de aprobación, esa interfaz nativa es la vía principal de cara al agente.
El agente no debe repetir además un comando de chat `/approve` duplicado en texto sin formato, a menos que el resultado de la herramienta indique
que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía restante.

Si se configura un cliente nativo de aprobación, pero no hay ningún entorno de ejecución nativo activo para el canal de
origen, OpenClaw mantiene visible la solicitud determinista local `/approve`. Si el entorno de ejecución nativo está
activo e intenta realizar la entrega, pero ningún destino recibe la tarjeta, OpenClaw envía un aviso alternativo
en el mismo chat con el comando `/approve <id> <decision>` exacto para que la solicitud aún pueda resolverse.

Modelo genérico:

- la política de exec del host sigue determinando si se requiere la aprobación de exec
- `approvals.exec` controla el reenvío de solicitudes de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si están habilitados Discord, Slack, Telegram, QQ bot y otros
  clientes nativos similares específicos del canal
- las aprobaciones de plugins de Slack pueden utilizar el cliente nativo de aprobación de Slack cuando la solicitud procede de Slack
  y se resuelven aprobadores de plugins de Slack; `approvals.plugin` también puede enrutar aprobaciones de plugins a sesiones
  o destinos de Slack incluso cuando las aprobaciones de exec de Slack están desactivadas
- las tarjetas nativas de aprobación de Google Chat gestionan las aprobaciones de exec y de plugins que se originan en espacios
  o hilos de Google Chat cuando se resuelven aprobadores estables de `users/<id>` mediante `dm.allowFrom` o
  `defaultTo`; no utilizan eventos de reacción para las decisiones
- la entrega de aprobaciones mediante reacciones de WhatsApp y Signal está supeditada a `approvals.exec` y
  `approvals.plugin`; no tienen bloques `channels.<channel>.execApprovals`

Los clientes nativos de aprobación activan automáticamente la entrega prioritaria por mensaje directo cuando se cumplen todas estas condiciones:

- el canal admite la entrega nativa de aprobaciones
- los aprobadores se pueden resolver a partir de `execApprovals.approvers` explícitos o de la
  identidad del propietario, como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` no está definido o es `"auto"`

Establece `enabled: false` para desactivar explícitamente un cliente nativo de aprobación. Establece `enabled: true` para forzar
su activación cuando se resuelvan los aprobadores. La entrega pública al chat de origen sigue siendo explícita mediante
`channels.<channel>.execApprovals.target`. Cuando `target` nativo habilita la entrega al chat de origen,
las solicitudes de aprobación incluyen el texto del comando.

Preguntas frecuentes: [¿Por qué hay dos configuraciones de aprobación de exec para las aprobaciones por chat?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: configura aprobadores estables con `channels.googlechat.dm.allowFrom` o
  `channels.googlechat.defaultTo`; no se requiere ningún bloque `execApprovals`
- WhatsApp: utiliza `approvals.exec` y `approvals.plugin` para enrutar solicitudes de aprobación a WhatsApp
- Signal: utiliza `approvals.exec` y `approvals.plugin` para enrutar solicitudes de aprobación a Signal

Enrutamiento específico de clientes nativos:

- Telegram envía de forma predeterminada mensajes directos a los aprobadores (`target: "dm"`). Cambia a `channel` o `both` para mostrar también
  las solicitudes de aprobación en el chat o tema de Telegram de origen. En los temas de foros de Telegram, OpenClaw
  conserva el tema para la solicitud de aprobación y el seguimiento posterior a la aprobación.
- los aprobadores de Discord y Telegram pueden ser explícitos (`execApprovals.approvers`) o inferirse de
  `commands.ownerAllowFrom`; solo los aprobadores resueltos pueden aprobar o denegar.
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferirse de
  `commands.ownerAllowFrom`. Los mensajes directos de aprobación de plugins de Slack utilizan aprobadores de plugins de Slack procedentes de `allowFrom`
  y el enrutamiento predeterminado de la cuenta, no los aprobadores de exec de Slack. Los botones nativos de Slack conservan el tipo de ID de aprobación,
  por lo que los ID `plugin:` pueden resolver aprobaciones de plugins sin una segunda capa alternativa local de Slack.
- las tarjetas nativas de Google Chat conservan el mecanismo manual alternativo `/approve` en el texto del mensaje, pero las devoluciones de llamada
  de los botones de la tarjeta solo transportan tokens de acción opacos; el ID de aprobación y la decisión se recuperan del
  estado pendiente del servidor.
- las aprobaciones mediante emojis de WhatsApp gestionan tanto las solicitudes de exec como las de plugins cuando la familia de
  reenvío de nivel superior correspondiente enruta a WhatsApp. Las solicitudes de origen nativo se vinculan directamente; la entrega compartida en modo
  de destino vincula los mismos metadatos tipados de aprobación al acuse de recibo aceptado del mensaje de WhatsApp.
- las aprobaciones mediante reacciones de Signal gestionan tanto las solicitudes de exec como las de plugins solo cuando la familia de
  reenvío de nivel superior correspondiente está habilitada y enruta a Signal. Las aprobaciones directas de exec de Signal en el mismo chat pueden
  suprimir el mecanismo local alternativo `/approve` sin aprobadores explícitos; la resolución mediante reacciones de Signal
  sigue requiriendo aprobadores explícitos de Signal procedentes de `channels.signal.allowFrom` o `defaultTo`.
- el enrutamiento nativo por mensajes directos o canales y los atajos mediante reacciones de Matrix gestionan tanto las aprobaciones de exec como las de plugins;
  la autorización de plugins sigue procediendo de `channels.matrix.dm.allowFrom`. Las solicitudes nativas de Matrix
  incluyen contenido de evento personalizado `com.openclaw.approval` en el primer evento de solicitud, para que los clientes
  de Matrix compatibles con OpenClaw puedan leer el estado estructurado de aprobación mientras los clientes estándar conservan el mecanismo
  alternativo `/approve` en texto sin formato.
- los botones nativos de aprobación de Discord y Telegram transportan un tipo explícito de propietario de exec o plugin en
  los datos privados de devolución de llamada del transporte y solo resuelven ese propietario. Los controles `/approve` antiguos que carecen
  de tipo siguen siendo una vía de compatibilidad acotada: solo prueban los tipos de propietario que el actor puede aprobar,
  continúan únicamente tras un resultado de aprobación no encontrada y nunca infieren la propiedad a partir del ID de aprobación.
- la persona solicitante no necesita ser aprobadora.
- si ninguna interfaz de operador ni ningún cliente de aprobación configurado puede aceptar la solicitud, se recurre a
  `askFallback`.

Los comandos confidenciales de grupo exclusivos del propietario, como `/diagnostics` y `/export-trajectory`, utilizan un
enrutamiento privado del propietario para las solicitudes de aprobación y los resultados finales. OpenClaw primero intenta usar una ruta privada en la
misma superficie donde el propietario ejecutó el comando. Si esa superficie no tiene una ruta privada del propietario, recurre
a la primera ruta disponible del propietario de `commands.ownerAllowFrom`, por lo que un comando de grupo de Discord
aún puede enviar la aprobación y el resultado al mensaje directo de Telegram del propietario cuando Telegram es la
interfaz privada principal configurada. El chat grupal solo recibe un breve acuse de recibo.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Aplicaciones móviles oficiales para operadores

Las aplicaciones oficiales de iOS y Android también pueden revisar las aprobaciones pendientes de exec
propiedad del Gateway cuando se utiliza una conexión `operator.admin`, o cuando el dispositivo
`operator.approvals` emparejado se designó explícitamente como destino de la solicitud. Leen
el mismo registro duradero depurado que utiliza la
interfaz de control, envían una decisión que tiene en cuenta el tipo y muestran el resultado canónico
de la primera respuesta del Gateway. El Apple Watch replica estas solicitudes de aprobación a través
del iPhone emparejado, con acciones para permitir una vez y denegar. El modo Gateway directo del Watch
no revisa aprobaciones.

La pérdida de un acuse de recibo de resolución no convierte en autoritativa la opción enviada:
la aplicación desactiva los controles y vuelve a leer el registro. Si ganó otra superficie,
la aplicación muestra esa decisión registrada. Las solicitudes pendientes permanecen vinculadas al
Gateway que las emitió, por lo que cambiar el Gateway activo no puede redirigir un
ID de aprobación antiguo.

### Flujo IPC de macOS

```
Gateway -> Servicio Node (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Aplicación Mac (IU + aprobaciones + system.run)
```

Notas de seguridad:

- modo de socket Unix `0600`, token almacenado en `exec-approvals.json`.
- comprobación de par con el mismo UID.
- desafío/respuesta (nonce + token HMAC + hash de solicitud) + TTL breve.

## Preguntas frecuentes

### ¿Cuándo se utilizarían `accountId` y `threadId` en un destino de aprobación?

Utiliza `accountId` cuando el canal tenga varias identidades configuradas y la solicitud de aprobación deba
salir a través de una cuenta específica. Utiliza `threadId` cuando el destino admita temas o
hilos y la solicitud deba permanecer dentro de ese hilo en lugar del chat de nivel superior.

Un caso concreto de Telegram es un supergrupo de operaciones con temas de foro y dos cuentas de bot de Telegram.
El valor `to` designa el supergrupo, `accountId` selecciona la cuenta del bot y `threadId`
selecciona el tema del foro:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "targets",
      targets: [
        {
          channel: "telegram",
          to: "-1001234567890",
          accountId: "ops-bot",
          threadId: "77",
        },
      ],
    },
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Operations bot",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

Con esa configuración, las aprobaciones de ejecución reenviadas se publican mediante la cuenta de Telegram `ops-bot` en el tema
`77` del chat `-1001234567890`. Un destino sin `accountId` utiliza la cuenta predeterminada del canal, y
un destino sin `threadId` publica en el destino de nivel superior.

### Cuando las aprobaciones se envían a una sesión, ¿puede aprobarlas cualquier persona de esa sesión?

No. La entrega en la sesión solo controla dónde aparece la solicitud. Por sí sola, no autoriza a todos los
participantes de ese chat a aprobarla.

Para `/approve` genéricas en el mismo chat, el remitente ya debe tener autorización para ejecutar comandos en esa
sesión del canal. Si el canal permite especificar aprobadores explícitos, estos pueden autorizar
la acción `/approve`, aunque no tengan autorización para ejecutar comandos en esa sesión.

Algunos canales son más estrictos. Discord, Telegram, Matrix, los mensajes directos de aprobación nativos de Slack y otros
clientes de aprobación nativos similares utilizan sus listas de aprobadores resueltas para autorizar las aprobaciones. Por ejemplo,
una solicitud de aprobación en un tema de foro de Telegram puede ser visible para todas las personas del tema, pero solo los identificadores
numéricos de usuario de Telegram resueltos a partir de `channels.telegram.execApprovals.approvers` o
`commands.ownerAllowFrom` pueden aprobarla o denegarla.

## Contenido relacionado

- [Aprobaciones de ejecución](/es/tools/exec-approvals) — política principal y flujo de aprobación
- [Herramienta de ejecución](/es/tools/exec)
- [Modo elevado](/es/tools/elevated)
- [Skills](/es/tools/skills) — comportamiento de autorización automática respaldado por Skills
