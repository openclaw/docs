---
read_when:
    - Configuración de binarios seguros o perfiles personalizados de binarios seguros
    - Reenvío de aprobaciones a Slack/Discord/Telegram u otros canales de chat
    - Implementación de un cliente nativo de aprobaciones para un canal
summary: 'Aprobaciones avanzadas de ejecución: binarios seguros, vinculación de intérpretes, reenvío de aprobaciones, entrega nativa'
title: Aprobaciones de ejecución — avanzado
x-i18n:
    generated_at: "2026-07-19T13:44:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 628f695f2a005d537b11966bab7f6626aa87d473b1f1d5d72319a57aa7d9b24c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Temas avanzados de aprobación de ejecución: la vía rápida `safeBins`, la vinculación de intérpretes/entornos de ejecución
y el reenvío de aprobaciones a canales de chat (incluida la entrega nativa).
Para conocer la política principal y el flujo de aprobación, consulte [Aprobaciones de ejecución](/es/tools/exec-approvals).

## Binarios seguros (solo stdin)

`tools.exec.safeBins` especifica binarios **solo stdin** (por ejemplo, `cut`) que
se ejecutan en modo de lista de permitidos **sin** entradas explícitas en dicha lista. Los binarios seguros rechazan
los argumentos de archivo posicionales y los tokens con aspecto de ruta, por lo que solo pueden operar sobre el
flujo entrante. Considere esto una vía rápida limitada para filtros de flujo, no una
lista de confianza general.

<Warning>
**No** añada binarios de intérpretes o entornos de ejecución (por ejemplo, `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Si un comando puede evaluar código,
ejecutar subcomandos o leer archivos por diseño, es preferible usar entradas explícitas en la lista de permitidos
y mantener activadas las solicitudes de aprobación. Los binarios seguros personalizados deben definir un perfil
explícito en `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binarios seguros predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si decide incluirlos, mantenga entradas
explícitas en la lista de permitidos para sus flujos de trabajo que no usan stdin. Para `grep` en modo de binario seguro,
proporcione el patrón con `-e`/`--regexp`; se rechaza la forma de patrón posicional
para impedir que los operandos de archivo se oculten como argumentos posicionales ambiguos.

### Validación de argv y opciones denegadas

La validación es determinista y se basa únicamente en la forma de argv (sin comprobaciones de existencia
en el sistema de archivos del host), lo que impide que las diferencias entre permisos y denegaciones
actúen como un oráculo de existencia de archivos. Las opciones orientadas a archivos se deniegan para los binarios seguros predeterminados; las
opciones largas se validan con cierre seguro (se rechazan las opciones desconocidas y las abreviaturas ambiguas).
Se aceptan las opciones booleanas de solo lectura reconocidas de los binarios predeterminados (por ejemplo,
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
(sin expansión de comodines ni de `$VARS`) en los segmentos solo stdin, de modo que
patrones como `*` o `$HOME/...` no puedan utilizarse para ocultar lecturas de archivos. `awk`,
`sed` y `jq` siempre se deniegan como binarios seguros porque no se puede validar que su semántica
se limite a stdin: `jq` puede leer datos del entorno y cargar código jq desde
módulos o archivos de inicio. Utilice una entrada explícita en la lista de permitidos o una solicitud de aprobación para
esas herramientas en lugar de `safeBins`.

### Directorios de binarios de confianza

Los binarios seguros deben resolverse desde directorios de binarios de confianza (los valores predeterminados del sistema más
el valor opcional `tools.exec.safeBinTrustedDirs`). Las entradas de `PATH` nunca reciben confianza automática.
Los directorios de confianza predeterminados son mínimos de forma intencionada: `/bin`, `/usr/bin`. Si
el ejecutable del binario seguro se encuentra en rutas del gestor de paquetes o del usuario (por ejemplo,
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), añádalas
explícitamente a `tools.exec.safeBinTrustedDirs`.

### Encadenamiento del shell, envoltorios y multiplexores

El encadenamiento del shell (`&&`, `||`, `;`) está permitido cuando cada segmento de nivel superior
cumple la lista de permitidos (incluidos los binarios seguros o la autorización automática de Skills). Las redirecciones
siguen sin ser compatibles con el modo de lista de permitidos. La sustitución de comandos (`$()` / acentos graves) se
rechaza durante el análisis de la lista de permitidos, incluso dentro de comillas dobles; utilice comillas simples
si necesita texto literal `$()`.

En las aprobaciones de la aplicación complementaria de macOS, el texto sin procesar del shell que contiene sintaxis de control o
expansión del shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se
considera una falta de coincidencia con la lista de permitidos, salvo que el propio binario del shell esté en ella.

Para los envoltorios del shell (`bash|sh|zsh ... -c/-lc`), las sustituciones de variables de entorno circunscritas a la solicitud
se reducen a una pequeña lista de permitidos explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para las decisiones de `allow-always` en modo de lista de permitidos, los envoltorios de despacho transparentes
(por ejemplo, `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan la
ruta del ejecutable interno en lugar de la ruta del envoltorio. Los multiplexores del shell
(`busybox`, `toybox`) se desenvuelven de la misma forma para los subprogramas del shell (`sh`, `ash`, etc.).
Si un envoltorio o multiplexor no puede desenvolverse de forma segura, no se conserva automáticamente ninguna entrada
en la lista de permitidos.

Si añade intérpretes como `python3` o `node` a la lista de permitidos, es preferible usar
`tools.exec.strictInlineEval=true` para que la evaluación en línea siga requiriendo una aprobación
explícita. En modo estricto, `allow-always` todavía puede conservar invocaciones
inocuas de intérpretes o scripts, pero los portadores de evaluación en línea no se conservan
automáticamente.

### Binarios seguros frente a lista de permitidos

| Tema             | `tools.exec.safeBins`                                  | Lista de permitidos (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automáticamente filtros stdin limitados       | Confiar explícitamente en ejecutables específicos                                  |
| Tipo de coincidencia | Nombre del ejecutable + política de argv del binario seguro | Patrón glob de la ruta resuelta del ejecutable o del nombre de comando simple para comandos invocados mediante PATH |
| Alcance de los argumentos | Restringido por el perfil del binario seguro y las reglas de tokens literales | Coincidencia de ruta de forma predeterminada; `argPattern` opcional puede restringir el argv analizado |
| Ejemplos habituales | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizadas                                     |
| Uso recomendado  | Transformaciones de texto de bajo riesgo en pipelines  | Cualquier herramienta con un comportamiento más amplio o efectos secundarios       |

Ubicación de la configuración:

- `safeBins` procede de la configuración (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` procede de la configuración (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` procede de la configuración (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` por agente). Las claves de perfil por agente sustituyen las claves globales.
- las entradas de la lista de permitidos residen en el archivo de aprobaciones local del host, bajo `agents.<id>.allowlist` (o mediante la interfaz de control / `openclaw approvals allowlist ...`).
- `openclaw security audit` muestra la advertencia `tools.exec.safe_bins_interpreter_unprofiled` cuando aparecen binarios de intérpretes o entornos de ejecución en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede crear entradas personalizadas `safeBinProfiles.<bin>` que falten como `{}` (revise y restrinja después). Los binarios de intérpretes o entornos de ejecución no se crean automáticamente.

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

Las ejecuciones de intérpretes o entornos de ejecución respaldadas por aprobación son deliberadamente conservadoras:

- El contexto exacto de argv/cwd/env siempre queda vinculado.
- Las formas de archivo de script de shell directo y de entorno de ejecución directo se vinculan, en la medida de lo posible, a una única instantánea concreta de un archivo
  local.
- Las formas habituales de envoltorios de gestores de paquetes que aún se resuelven en un único archivo local directo (por ejemplo,
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desenvuelven antes de la vinculación.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete o entorno de ejecución
  (por ejemplo, scripts de paquetes, formas de evaluación, cadenas de cargadores específicas del entorno de ejecución o formas ambiguas
  con varios archivos), se deniega la ejecución respaldada por aprobación en lugar de afirmar una cobertura semántica
  que no posee.
- Para esos flujos de trabajo, es preferible usar un entorno aislado, un límite de host independiente o un flujo de trabajo completo
  con una lista de permitidos explícita y de confianza, donde el operador acepte la semántica más amplia del entorno de ejecución.

Cuando se requieren aprobaciones, la herramienta de ejecución devuelve inmediatamente un identificador de aprobación. Utilice ese identificador para
correlacionar los eventos posteriores del sistema correspondientes a la ejecución aprobada (`Exec finished` y `Exec running` cuando esté configurado).
Si no llega ninguna decisión antes de que se agote el tiempo de espera, la solicitud se considera una aprobación expirada y
se presenta como una denegación terminal del comando del host. Para las aprobaciones asíncronas del agente principal con una
sesión de origen, OpenClaw también reanuda esa sesión con un seguimiento interno para que el agente observe que
el comando no se ejecutó, en lugar de intentar reparar posteriormente la ausencia de un resultado. Las aprobaciones de ejecución pendientes caducan
después de 30 minutos de forma predeterminada.

### Comportamiento de la entrega de seguimiento

Cuando finaliza una ejecución asíncrona aprobada, OpenClaw envía un turno de seguimiento `agent` a la misma sesión.
Las aprobaciones asíncronas denegadas utilizan la misma ruta de seguimiento de la sesión principal para comunicar el estado de denegación, pero
no registran transferencias elevadas del entorno de ejecución ni ejecutan el comando. Las denegaciones sin una
sesión principal reanudable se suprimen o se notifican mediante una ruta directa segura cuando existe alguna.

- Si existe un destino externo válido para la entrega (un canal que admite entregas más el destino `to`), la entrega de seguimiento utiliza ese canal.
- En los flujos exclusivos de chat web o de sesiones internas sin un destino externo, la entrega de seguimiento permanece restringida a la sesión (`deliver: false`).
- Si un llamador solicita explícitamente una entrega externa estricta sin ningún canal externo resoluble, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está activado y no puede resolverse ningún canal externo, la entrega se degrada al modo exclusivo de sesión en lugar de fallar.

## Alcances mínimos para clientes de terceros

La resolución de aprobaciones del Gateway está protegida por el alcance específico `operator.approvals`. Esto se aplica tanto al método específico del propietario `exec.approval.resolve` como al método independiente del tipo `approval.resolve`; `operator.write` no lo engloba. Los paneles y las integraciones deben solicitar únicamente los alcances requeridos por los métodos que utilizan. Considere el acceso a la resolución de aprobaciones como una autoridad equivalente a la ejecución remota y conceda `operator.approvals` de forma deliberada, incluso cuando el cliente solo presente una pequeña interfaz de aprobación.

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
      sessionFilter: ["discord"], // subcadena o expresión regular
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

El comando `/approve` gestiona tanto las aprobaciones de exec como las aprobaciones de plugins. Si el ID no coincide con una aprobación de exec pendiente, comprueba automáticamente las aprobaciones de plugins. Este mecanismo alternativo se limita a los errores de «aprobación no encontrada»; una denegación o un error real de aprobación de exec no vuelve a intentarse silenciosamente como aprobación de plugin.

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

Los canales que admiten respuestas interactivas compartidas muestran los mismos botones de aprobación para las aprobaciones de exec y
de plugins. Los canales sin una interfaz interactiva compartida recurren a texto sin formato con instrucciones de `/approve`.
Las solicitudes de aprobación de plugins pueden restringir las decisiones disponibles: las superficies de aprobación utilizan
el conjunto de decisiones declarado en la solicitud, y el Gateway rechaza los intentos de enviar una decisión que no se
haya ofrecido.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de exec o de plugin se origina en una superficie de chat con capacidad de entrega, ese mismo chat
puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a Slack, Matrix, Microsoft Teams y
otros chats similares con capacidad de entrega, además de los flujos existentes de la interfaz web y la interfaz de terminal, mediante el
modelo normal de autenticación del canal para esa conversación. Si el chat de origen ya puede enviar comandos
y recibir respuestas, las solicitudes de aprobación ya no necesitan un adaptador de entrega nativo independiente solo para
permanecer pendientes.

Discord, Telegram y QQ bot también admiten `/approve` en el mismo chat, pero esos canales siguen utilizando su
lista de aprobadores resuelta para la autorización, incluso cuando la entrega de aprobaciones nativa está desactivada.

### Entrega de aprobaciones nativa

Algunos canales también pueden actuar como clientes de aprobación nativos: Discord, Slack, Telegram, Matrix y QQ bot.
Los clientes nativos añaden mensajes directos a los aprobadores, distribución al chat de origen y una experiencia de aprobación interactiva específica del canal
sobre el flujo compartido de `/approve` en el mismo chat.

Cuando hay disponibles tarjetas o botones de aprobación nativos, esa interfaz nativa es la vía principal para el agente.
El agente no debe repetir además un comando de chat sin formato `/approve`, a menos que el resultado de la herramienta indique
que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía restante.

Si hay un cliente de aprobación nativo configurado, pero no hay ningún entorno de ejecución nativo activo para el canal
de origen, OpenClaw mantiene visible la solicitud local determinista `/approve`. Si el entorno de ejecución nativo está
activo e intenta realizar la entrega, pero ningún destino recibe la tarjeta, OpenClaw envía un aviso alternativo en el mismo chat
con el comando exacto `/approve <id> <decision>` para que la solicitud todavía pueda resolverse.

Modelo genérico:

- la política de exec del host sigue determinando si se requiere la aprobación de exec
- `approvals.exec` controla el reenvío de solicitudes de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si están habilitados Discord, Slack, Telegram, QQ bot y otros
  clientes nativos similares específicos del canal
- las aprobaciones de plugins de Slack pueden utilizar el cliente de aprobación nativo de Slack cuando la solicitud procede de Slack
  y se resuelven los aprobadores de plugins de Slack; `approvals.plugin` también puede dirigir las aprobaciones de plugins a sesiones
  o destinos de Slack, incluso cuando las aprobaciones de exec de Slack están desactivadas
- las tarjetas de aprobación nativas de Google Chat gestionan las aprobaciones de exec y de plugins que se originan en
  espacios o hilos de Google Chat cuando se resuelven aprobadores estables de `users/<id>` desde `dm.allowFrom` o
  `defaultTo`; no utilizan eventos de reacción para las decisiones
- la entrega de aprobaciones mediante reacciones de WhatsApp y Signal está controlada por `approvals.exec` y
  `approvals.plugin`; no tienen bloques `channels.<channel>.execApprovals`

Los clientes de aprobación nativos activan automáticamente la entrega prioritaria por mensaje directo cuando se cumplen todas estas condiciones:

- el canal admite la entrega de aprobaciones nativa
- los aprobadores pueden resolverse desde `execApprovals.approvers` explícito o desde una
  identidad de propietario como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` no está definido o es `"auto"`

Establece `enabled: false` para desactivar explícitamente un cliente de aprobación nativo. Establece `enabled: true` para forzar
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
- WhatsApp: utiliza `approvals.exec` y `approvals.plugin` para dirigir las solicitudes de aprobación a WhatsApp
- Signal: utiliza `approvals.exec` y `approvals.plugin` para dirigir las solicitudes de aprobación a Signal

Enrutamiento específico de clientes nativos:

- Telegram envía de forma predeterminada mensajes directos a los aprobadores (`target: "dm"`). Cambia a `channel` o `both` para mostrar también
  las solicitudes de aprobación en el chat o tema de Telegram de origen. Para los temas de foros de Telegram, OpenClaw
  conserva el tema para la solicitud de aprobación y para el seguimiento posterior a la aprobación.
- los aprobadores de Discord y Telegram pueden ser explícitos (`execApprovals.approvers`) o inferirse de
  `commands.ownerAllowFrom`; solo los aprobadores resueltos pueden aprobar o denegar.
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferirse de
  `commands.ownerAllowFrom`. Los mensajes directos de aprobación de plugins de Slack utilizan los aprobadores de plugins de Slack de `allowFrom`
  y el enrutamiento predeterminado de la cuenta, no los aprobadores de exec de Slack. Los botones nativos de Slack conservan el tipo de ID de aprobación,
  por lo que los ID `plugin:` pueden resolver aprobaciones de plugins sin una segunda capa alternativa local de Slack.
- las tarjetas nativas de Google Chat conservan la alternativa manual `/approve` en el texto del mensaje, pero las devoluciones de llamada
  de los botones de las tarjetas solo contienen tokens de acción opacos; el ID de aprobación y la decisión se recuperan del
  estado pendiente del servidor.
- las aprobaciones mediante emojis de WhatsApp gestionan las solicitudes de exec y de plugins cuando la familia de reenvío de nivel superior
  correspondiente dirige a WhatsApp. Las solicitudes de origen nativo se vinculan directamente; la entrega compartida en modo
  de destinos vincula los mismos metadatos de aprobación tipados al recibo de mensaje de WhatsApp aceptado.
- las aprobaciones mediante reacciones de Signal gestionan las solicitudes de exec y de plugins únicamente cuando la familia de reenvío de nivel superior
  correspondiente está habilitada y dirige a Signal. Las aprobaciones directas de exec de Signal en el mismo chat pueden
  suprimir la alternativa local `/approve` sin aprobadores explícitos; la resolución mediante reacciones de Signal
  sigue requiriendo aprobadores explícitos de Signal de `channels.signal.allowFrom` o `defaultTo`.
- el enrutamiento nativo de Matrix por mensajes directos o canales y los atajos mediante reacciones gestionan las aprobaciones de exec y de plugins;
  la autorización de plugins sigue procediendo de `channels.matrix.dm.allowFrom`. Las solicitudes nativas de Matrix
  incluyen el contenido de evento personalizado `com.openclaw.approval` en el primer evento de solicitud para que los clientes de
  Matrix compatibles con OpenClaw puedan leer el estado estructurado de la aprobación, mientras que los clientes estándar mantienen la alternativa
  de texto sin formato `/approve`.
- los botones de aprobación nativos de Discord y Telegram incluyen un tipo de propietario explícito, de exec o de plugin, en
  los datos de devolución de llamada privados del transporte y solo resuelven ese propietario. Los controles `/approve` antiguos que carecen
  de tipo siguen siendo una vía de compatibilidad limitada: solo prueban los tipos de propietario que el actor puede aprobar,
  continúan únicamente tras un resultado de aprobación no encontrada y nunca infieren la propiedad a partir del ID de aprobación.
- el solicitante no necesita ser un aprobador.
- si ninguna interfaz de operador ni ningún cliente de aprobación configurado puede aceptar la solicitud, la solicitud recurre a
  `askFallback`.

Los comandos de grupo confidenciales exclusivos del propietario, como `/diagnostics` y `/export-trajectory`, utilizan
enrutamiento privado del propietario para las solicitudes de aprobación y los resultados finales. OpenClaw intenta primero una ruta privada en la
misma superficie donde el propietario ejecutó el comando. Si esa superficie no dispone de una ruta privada para el propietario, recurre
a la primera ruta de propietario disponible de `commands.ownerAllowFrom`, de modo que un comando de grupo de Discord
todavía pueda enviar la aprobación y el resultado al mensaje directo de Telegram del propietario cuando Telegram sea la interfaz privada
principal configurada. El chat grupal solo recibe una breve confirmación.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Aplicaciones móviles oficiales para operadores

Las aplicaciones oficiales de iOS y Android también pueden revisar las aprobaciones de exec pendientes
propiedad del Gateway cuando se utiliza una conexión `operator.admin`, o cuando el dispositivo
`operator.approvals` emparejado se ha seleccionado explícitamente como destino de la solicitud. Leen
el mismo registro duradero y depurado que utiliza la
interfaz de control, envían una decisión que tiene en cuenta el tipo y muestran el resultado canónico
de primera respuesta del Gateway. El Apple Watch refleja estas solicitudes de aprobación mediante
el iPhone emparejado, con acciones para permitir una vez y denegar. El modo de Gateway directo del Watch
no revisa aprobaciones.

La pérdida de una confirmación de resolución no convierte la elección enviada en autoritativa:
la aplicación desactiva los controles y vuelve a leer el registro. Si otra superficie
se adelantó, la aplicación muestra la decisión registrada. Las solicitudes pendientes permanecen vinculadas al
Gateway que las emitió, por lo que cambiar el Gateway activo no puede redirigir
un ID de aprobación antiguo.

### Flujo IPC de macOS

```
Gateway -> Servicio Node (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Aplicación Mac (IU + aprobaciones + system.run)
```

Notas de seguridad:

- modo de socket Unix `0600`, token almacenado en `exec-approvals.json`.
- comprobación del par con el mismo UID.
- desafío/respuesta (nonce + token HMAC + hash de la solicitud) + TTL breve.

## Preguntas frecuentes

### ¿Cuándo se utilizarían `accountId` y `threadId` en un destino de aprobación?

Utiliza `accountId` cuando el canal tenga varias identidades configuradas y la solicitud de aprobación deba
enviarse mediante una cuenta específica. Utiliza `threadId` cuando el destino admita temas o
hilos y la solicitud deba permanecer dentro de ese hilo en lugar del chat de nivel superior.

Un caso concreto de Telegram es un supergrupo de operaciones con temas de foro y dos cuentas de bot de Telegram.
El valor `to` identifica el supergrupo, `accountId` selecciona la cuenta del bot y `threadId`
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

Para las `/approve` genéricas del mismo chat, el remitente ya debe tener autorización para ejecutar comandos en esa
sesión del canal. Si el canal permite definir explícitamente quién puede aprobar, esas personas pueden autorizar
la acción `/approve` aunque no tengan autorización para ejecutar otros comandos en esa sesión.

Algunos canales son más estrictos. Discord, Telegram, Matrix, los mensajes directos de aprobación nativos de Slack y otros
clientes de aprobación nativos similares utilizan sus listas resueltas de personas autorizadas para determinar quién puede aprobar. Por ejemplo,
una solicitud de aprobación en un tema de foro de Telegram puede ser visible para todos los participantes del tema, pero solo los identificadores
numéricos de usuario de Telegram resueltos desde `channels.telegram.execApprovals.approvers` o
`commands.ownerAllowFrom` pueden aprobarla o denegarla.

## Temas relacionados

- [Aprobaciones de ejecución](/es/tools/exec-approvals) — política principal y flujo de aprobación
- [Herramienta de ejecución](/es/tools/exec)
- [Modo elevado](/es/tools/elevated)
- [Skills](/es/tools/skills) — comportamiento de autorización automática respaldado por Skills
