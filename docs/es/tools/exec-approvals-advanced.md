---
read_when:
    - Configurar safe bins o perfiles safe-bin personalizados
    - Reenvío de aprobaciones a Slack/Discord/Telegram u otros canales de chat
    - Implementar un cliente de aprobación nativo para un canal
summary: 'Aprobaciones exec avanzadas: binarios seguros, vinculación de intérpretes, reenvío de aprobaciones, entrega nativa'
title: Aprobaciones de ejecución — avanzado
x-i18n:
    generated_at: "2026-05-06T05:50:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Temas avanzados de aprobación de ejecución: la ruta rápida `safeBins`, la vinculación de intérprete/runtime y el reenvío de aprobaciones a canales de chat (incluida la entrega nativa). Para la política principal y el flujo de aprobación, consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

## Binarios seguros (solo stdin)

`tools.exec.safeBins` define una pequeña lista de binarios **solo stdin** (por ejemplo `cut`) que pueden ejecutarse en modo de lista de permitidos **sin** entradas explícitas en la lista de permitidos. Los binarios seguros rechazan argumentos posicionales de archivo y tokens con aspecto de ruta, por lo que solo pueden operar sobre el flujo entrante. Trata esto como una ruta rápida estrecha para filtros de flujo, no como una lista general de confianza.

<Warning>
No agregues binarios de intérprete o runtime (por ejemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Si un comando puede evaluar código, ejecutar subcomandos o leer archivos por diseño, prefiere entradas explícitas en la lista de permitidos y mantén habilitadas las solicitudes de aprobación. Los binarios seguros personalizados deben definir un perfil explícito en `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binarios seguros predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si decides incluirlos, conserva entradas explícitas en la lista de permitidos para sus flujos de trabajo que no usan stdin. Para `grep` en modo de binario seguro, proporciona el patrón con `-e`/`--regexp`; la forma de patrón posicional se rechaza para que los operandos de archivo no puedan introducirse como posicionales ambiguos.

### Validación de argv y flags denegados

La validación es determinista solo a partir de la forma de argv (sin comprobaciones de existencia en el sistema de archivos del host), lo que evita comportamientos de oráculo de existencia de archivos a partir de diferencias entre permitir y denegar. Las opciones orientadas a archivos se deniegan para los binarios seguros predeterminados; las opciones largas se validan con cierre ante fallo (se rechazan flags desconocidos y abreviaturas ambiguas).

Flags denegados por perfil de binario seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Los binarios seguros también fuerzan que los tokens argv se traten como **texto literal** en tiempo de ejecución (sin globbing y sin expansión de `$VARS`) para segmentos solo stdin, de modo que patrones como `*` o `$HOME/...` no puedan usarse para introducir lecturas de archivos.

### Directorios de binarios de confianza

Los binarios seguros deben resolverse desde directorios de binarios de confianza (valores predeterminados del sistema más `tools.exec.safeBinTrustedDirs` opcional). Las entradas de `PATH` nunca se consideran de confianza automáticamente. Los directorios de confianza predeterminados son intencionalmente mínimos: `/bin`, `/usr/bin`. Si tu ejecutable de binario seguro vive en rutas de gestor de paquetes/usuario (por ejemplo `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), agrégalas explícitamente a `tools.exec.safeBinTrustedDirs`.

### Encadenamiento de shell, wrappers y multiplexores

El encadenamiento de shell (`&&`, `||`, `;`) está permitido cuando cada segmento de nivel superior satisface la lista de permitidos (incluidos binarios seguros o permiso automático por skill). Las redirecciones siguen sin estar admitidas en modo de lista de permitidos. La sustitución de comandos (`$()` / comillas invertidas) se rechaza durante el análisis de la lista de permitidos, incluso dentro de comillas dobles; usa comillas simples si necesitas texto literal `$()`.

En aprobaciones de la app complementaria de macOS, el texto shell sin procesar que contiene sintaxis de control o expansión de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se trata como una falta de coincidencia de la lista de permitidos salvo que el propio binario de shell esté en la lista de permitidos.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), las sobrescrituras de entorno con alcance de solicitud se reducen a una pequeña lista de permitidos explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Para decisiones `allow-always` en modo de lista de permitidos, los wrappers de despacho conocidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan la ruta del ejecutable interno en lugar de la ruta del wrapper. Los multiplexores de shell (`busybox`, `toybox`) se desenvuelven para applets de shell (`sh`, `ash`, etc.) del mismo modo. Si un wrapper o multiplexor no puede desenvolverse de forma segura, no se conserva automáticamente ninguna entrada en la lista de permitidos.

Si incluyes intérpretes como `python3` o `node` en la lista de permitidos, prefiere `tools.exec.strictInlineEval=true` para que la evaluación inline siga requiriendo una aprobación explícita. En modo estricto, `allow-always` aún puede conservar invocaciones benignas de intérprete/script, pero los portadores de evaluación inline no se conservan automáticamente.

### Binarios seguros frente a lista de permitidos

| Tema             | `tools.exec.safeBins`                                  | Lista de permitidos (`exec-approvals.json`)                                        |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automáticamente filtros stdin estrechos       | Confiar explícitamente en ejecutables específicos                                  |
| Tipo de coincidencia | Nombre del ejecutable + política argv de binario seguro | Glob de ruta de ejecutable resuelta, o glob de nombre de comando simple para comandos invocados por PATH |
| Alcance de argumentos | Restringido por el perfil de binario seguro y reglas de tokens literales | Coincidencia de ruta por defecto; `argPattern` opcional puede restringir argv analizado |
| Ejemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizadas                              |
| Mejor uso        | Transformaciones de texto de bajo riesgo en pipelines  | Cualquier herramienta con comportamiento más amplio o efectos secundarios          |

Ubicación de configuración:

- `safeBins` viene de la configuración (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` viene de la configuración (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` viene de la configuración (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` por agente). Las claves de perfil por agente sobrescriben las claves globales.
- Las entradas de la lista de permitidos viven en el archivo local del host `~/.openclaw/exec-approvals.json` bajo `agents.<id>.allowlist` (o mediante la Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` advierte con `tools.exec.safe_bins_interpreter_unprofiled` cuando aparecen binarios de intérprete/runtime en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede generar entradas faltantes personalizadas de `safeBinProfiles.<bin>` como `{}` (revísalas y restríngelas después). Los binarios de intérprete/runtime no se generan automáticamente.

Ejemplo de perfil personalizado:
__OC_I18N_900000__
Si incluyes explícitamente `jq` en `safeBins`, OpenClaw aún rechaza el builtin `env` en modo de binario seguro para que `jq -n env` no pueda volcar el entorno del proceso host sin una ruta explícita en la lista de permitidos o una solicitud de aprobación.

## Comandos de intérprete/runtime

Las ejecuciones de intérprete/runtime respaldadas por aprobación son intencionalmente conservadoras:

- El contexto exacto de argv/cwd/env siempre queda vinculado.
- Las formas directas de script de shell y de archivo runtime directo se vinculan con mejor esfuerzo a una instantánea concreta de un archivo local.
- Las formas comunes de wrapper de gestor de paquetes que aún se resuelven a un archivo local directo (por ejemplo `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desenvuelven antes de la vinculación.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete/runtime (por ejemplo scripts de paquete, formas eval, cadenas de cargadores específicas de runtime o formas ambiguas de varios archivos), la ejecución respaldada por aprobación se deniega en lugar de afirmar una cobertura semántica que no tiene.
- Para esos flujos de trabajo, prefiere sandboxing, un límite de host separado o una lista de permitidos/flujo de trabajo completo explícitamente confiable donde el operador acepte la semántica más amplia del runtime.

Cuando se requieren aprobaciones, la herramienta exec devuelve de inmediato un id de aprobación. Usa ese id para correlacionar eventos posteriores del sistema (`Exec finished` / `Exec denied`). Si no llega ninguna decisión antes del timeout, la solicitud se trata como un timeout de aprobación y se muestra como motivo de denegación.

### Comportamiento de entrega de seguimiento

Después de que termina una ejecución asíncrona aprobada, OpenClaw envía un turno de seguimiento `agent` a la misma sesión.

- Si existe un destino de entrega externo válido (canal entregable más objetivo `to`), la entrega de seguimiento usa ese canal.
- En flujos solo webchat o de sesión interna sin objetivo externo, la entrega de seguimiento permanece solo en la sesión (`deliver: false`).
- Si un llamador solicita explícitamente entrega externa estricta sin un canal externo resoluble, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está habilitado y no se puede resolver ningún canal externo, la entrega se degrada a solo sesión en lugar de fallar.

## Reenvío de aprobaciones a canales de chat

Puedes reenviar solicitudes de aprobación de ejecución a cualquier canal de chat (incluidos canales de Plugin) y aprobarlas con `/approve`. Esto usa el pipeline normal de entrega saliente.

Configuración:
__OC_I18N_900001__
Responde en el chat:
__OC_I18N_900002__
El comando `/approve` gestiona tanto aprobaciones de ejecución como aprobaciones de Plugin. Si el ID no coincide con una aprobación de ejecución pendiente, comprueba automáticamente las aprobaciones de Plugin en su lugar.

### Reenvío de aprobaciones de Plugin

El reenvío de aprobaciones de Plugin usa el mismo pipeline de entrega que las aprobaciones de ejecución, pero tiene su propia configuración independiente bajo `approvals.plugin`. Habilitar o deshabilitar una no afecta a la otra.
__OC_I18N_900003__
La forma de la configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` y `targets` funcionan del mismo modo.

Los canales que admiten respuestas interactivas compartidas muestran los mismos botones de aprobación tanto para aprobaciones de ejecución como de Plugin. Los canales sin UI interactiva compartida recurren a texto sin formato con instrucciones de `/approve`.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de ejecución o de Plugin se origina en una superficie de chat entregable, el mismo chat ahora puede aprobarla con `/approve` por defecto. Esto se aplica a canales como Slack, Matrix y Microsoft Teams, además de los flujos existentes de Web UI y terminal UI.

Esta ruta de comando de texto compartida usa el modelo normal de autenticación del canal para esa conversación. Si el chat de origen ya puede enviar comandos y recibir respuestas, las solicitudes de aprobación ya no necesitan un adaptador de entrega nativa separado solo para permanecer pendientes.

Discord y Telegram también admiten `/approve` en el mismo chat, pero esos canales siguen usando su lista de aprobadores resuelta para la autorización incluso cuando la entrega nativa de aprobaciones está deshabilitada.

Para Telegram y otros clientes nativos de aprobación que llaman directamente al Gateway, este fallback está intencionalmente limitado a fallos de “aprobación no encontrada”. Una denegación/error real de aprobación de ejecución no se reintenta silenciosamente como aprobación de Plugin.

### Entrega nativa de aprobaciones

Algunos canales también pueden actuar como clientes nativos de aprobación. Los clientes nativos agregan DM a aprobadores, distribución al chat de origen y una UX interactiva de aprobación específica del canal sobre el flujo compartido de `/approve` en el mismo chat.

Cuando hay tarjetas/botones de aprobación nativos disponibles, esa interfaz nativa es la ruta principal
orientada al agente. El agente tampoco debería repetir un comando de chat simple duplicado
`/approve`, a menos que el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o que
la aprobación manual es la única ruta restante.

Si se configura un cliente de aprobación nativo pero no hay un runtime nativo activo para
el canal de origen, OpenClaw mantiene visible el prompt determinista local de `/approve`.
Si el runtime nativo está activo e intenta entregar, pero ningún destino recibe la tarjeta,
OpenClaw envía un aviso de respaldo en el mismo chat con el comando exacto
`/approve <id> <decision>` para que la solicitud aún pueda resolverse.

Modelo genérico:

- la política de ejecución del host sigue decidiendo si se requiere aprobación de ejecución
- `approvals.exec` controla el reenvío de prompts de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si ese canal actúa como cliente de aprobación nativo

Los clientes de aprobación nativos activan automáticamente la entrega primero por DM cuando todo esto es verdadero:

- el canal admite entrega de aprobación nativa
- los aprobadores pueden resolverse desde `execApprovals.approvers` explícitos o desde la identidad
  del propietario, como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` no está definido o es `"auto"`

Define `enabled: false` para desactivar explícitamente un cliente de aprobación nativo. Define `enabled: true` para forzar
su activación cuando los aprobadores se resuelvan. La entrega al chat público de origen sigue siendo explícita mediante
`channels.<channel>.execApprovals.target`.

FAQ: [¿Por qué hay dos configuraciones de aprobación de ejecución para aprobaciones por chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Estos clientes de aprobación nativos añaden enrutamiento por DM y difusión opcional a canales por encima del flujo
compartido de `/approve` en el mismo chat y los botones de aprobación compartidos.

Comportamiento compartido:

- Slack, Matrix, Microsoft Teams y chats entregables similares usan el modelo normal de autenticación del canal
  para `/approve` en el mismo chat
- cuando un cliente de aprobación nativo se activa automáticamente, el destino de entrega nativa predeterminado son los DM de los aprobadores
- para Discord y Telegram, solo los aprobadores resueltos pueden aprobar o denegar
- los aprobadores de Discord pueden ser explícitos (`execApprovals.approvers`) o inferirse desde `commands.ownerAllowFrom`
- los aprobadores de Telegram pueden ser explícitos (`execApprovals.approvers`) o inferirse desde `commands.ownerAllowFrom`
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferirse desde `commands.ownerAllowFrom`
- los botones nativos de Slack conservan el tipo de id de aprobación, por lo que los ids `plugin:` pueden resolver aprobaciones de Plugin
  sin una segunda capa de respaldo local de Slack
- el enrutamiento nativo por DM/canal y los accesos directos de reacción de Matrix gestionan tanto aprobaciones de ejecución como de Plugin;
  la autorización de Plugin sigue viniendo de `channels.matrix.dm.allowFrom`
- los prompts nativos de Matrix incluyen contenido de evento personalizado `com.openclaw.approval` en el primer evento
  de prompt, para que los clientes de Matrix compatibles con OpenClaw puedan leer el estado de aprobación estructurado mientras los clientes estándar
  conservan el respaldo de texto simple de `/approve`
- el solicitante no necesita ser aprobador
- el chat de origen puede aprobar directamente con `/approve` cuando ese chat ya admite comandos y respuestas
- los botones de aprobación nativos de Discord enrutan según el tipo de id de aprobación: los ids `plugin:` van
  directamente a las aprobaciones de Plugin, todo lo demás va a las aprobaciones de ejecución
- los botones de aprobación nativos de Telegram siguen el mismo respaldo acotado de ejecución a Plugin que `/approve`
- cuando `target` nativo activa la entrega al chat de origen, los prompts de aprobación incluyen el texto del comando
- las aprobaciones de ejecución pendientes caducan después de 30 minutos de forma predeterminada
- si ninguna interfaz de operador ni cliente de aprobación configurado puede aceptar la solicitud, el prompt recurre a `askFallback`

Los comandos sensibles de grupo solo para propietarios, como `/diagnostics` y `/export-trajectory`, usan enrutamiento privado
del propietario para prompts de aprobación y resultados finales. OpenClaw primero intenta una ruta privada en la
misma superficie donde el propietario ejecutó el comando. Si esa superficie no tiene una ruta privada de propietario, recurre
a la primera ruta de propietario disponible desde `commands.ownerAllowFrom`, por lo que un comando de grupo de Discord
aún puede enviar la aprobación y el resultado al DM de Telegram del propietario cuando Telegram es la interfaz privada
principal configurada. El chat de grupo solo recibe un breve acuse de recibo.

Telegram usa DM de aprobadores de forma predeterminada (`target: "dm"`). Puedes cambiar a `channel` o `both` cuando
quieras que los prompts de aprobación también aparezcan en el chat/tema de Telegram de origen. Para temas de foro de Telegram,
OpenClaw conserva el tema para el prompt de aprobación y el seguimiento posterior a la aprobación.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flujo IPC de macOS
__OC_I18N_900004__
Notas de seguridad:

- Modo del socket Unix `0600`, token almacenado en `exec-approvals.json`.
- Comprobación de par con el mismo UID.
- Desafío/respuesta (nonce + token HMAC + hash de solicitud) + TTL corto.

## Relacionado

- [Aprobaciones de ejecución](/es/tools/exec-approvals) — política central y flujo de aprobación
- [Herramienta de ejecución](/es/tools/exec)
- [Modo elevado](/es/tools/elevated)
- [Skills](/es/tools/skills) — comportamiento de permiso automático respaldado por Skills
