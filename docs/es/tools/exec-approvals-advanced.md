---
read_when:
    - Configurar safe bins o perfiles personalizados de safe-bin
    - Reenviar aprobaciones a Slack/Discord/Telegram u otros canales de chat
    - Implementar un cliente nativo de aprobación para un canal
summary: 'Aprobaciones avanzadas de exec: safe bins, vinculación de intérpretes, reenvío de aprobaciones, entrega nativa'
title: Aprobaciones de exec — avanzado
x-i18n:
    generated_at: "2026-04-24T05:53:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Temas avanzados de aprobaciones de exec: la vía rápida `safeBins`, la vinculación de intérpretes/runtime y el reenvío de aprobaciones a canales de chat (incluida la entrega nativa).
Para la política central y el flujo de aprobación, consulta [Aprobaciones de exec](/es/tools/exec-approvals).

## Safe bins (solo stdin)

`tools.exec.safeBins` define una pequeña lista de binarios **solo stdin** (por
ejemplo `cut`) que pueden ejecutarse en modo allowlist **sin** entradas explícitas
en la lista de permitidos. Los safe bins rechazan args posicionales de archivo y tokens tipo ruta, por lo que
solo pueden operar sobre el flujo entrante. Trata esto como una vía rápida estrecha para
filtros de flujo, no como una lista general de confianza.

<Warning>
**No** añadas binarios de intérprete o runtime (por ejemplo `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Si un comando puede evaluar código,
ejecutar subcomandos o leer archivos por diseño, prefiere entradas explícitas en la lista de permitidos
y mantén activados los prompts de aprobación. Los safe bins personalizados deben definir un perfil explícito en `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bins predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si optas por incluirlos, mantén entradas explícitas
en la allowlist para sus flujos que no sean stdin. Para `grep` en modo safe-bin,
proporciona el patrón con `-e`/`--regexp`; la forma posicional del patrón se rechaza
para que no puedan colarse operandos de archivo como posicionales ambiguos.

### Validación de argv y flags denegadas

La validación es determinista solo a partir de la forma de argv (sin comprobaciones de existencia del sistema de archivos del host), lo que evita comportamiento tipo oráculo de existencia de archivos a partir de diferencias de allow/deny. Las opciones orientadas a archivos se deniegan para los safe bins predeterminados; las opciones largas se validan en modo fail-closed (se rechazan flags desconocidas y abreviaturas ambiguas).

Flags denegadas por perfil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Los safe bins también fuerzan que los tokens de argv se traten como **texto literal** en tiempo de ejecución (sin globbing ni expansión de `$VARS`) para segmentos solo stdin, de modo que patrones como `*` o `$HOME/...` no puedan usarse para colar lecturas de archivos.

### Directorios binarios de confianza

Los safe bins deben resolverse desde directorios binarios de confianza (valores predeterminados del sistema más `tools.exec.safeBinTrustedDirs` opcional). Las entradas de `PATH` nunca se consideran automáticamente de confianza.
Los directorios de confianza predeterminados son intencionadamente mínimos: `/bin`, `/usr/bin`. Si
tu ejecutable safe-bin vive en rutas de gestor de paquetes o de usuario (por ejemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), añádelas
explícitamente a `tools.exec.safeBinTrustedDirs`.

### Encadenamiento de shell, wrappers y multiplexores

El encadenamiento de shell (`&&`, `||`, `;`) está permitido cuando cada segmento de nivel superior
satisface la allowlist (incluidos safe bins o auto-allow de Skill). Las redirecciones
siguen sin ser compatibles en modo allowlist. La sustitución de comandos (`$()` / backticks) se
rechaza durante el análisis de allowlist, incluso dentro de comillas dobles; usa comillas simples si necesitas texto literal `$()`.

En aprobaciones de la app complementaria de macOS, el texto de shell sin procesar que contiene sintaxis de control o expansión del shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se
trata como fallo de allowlist salvo que el propio binario de shell esté en la allowlist.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), las sobrescrituras de entorno con alcance de solicitud se
reducen a una pequeña allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para decisiones `allow-always` en modo allowlist, los wrappers de despacho conocidos (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persisten la ruta del ejecutable interno en lugar
de la del wrapper. Los multiplexores de shell (`busybox`, `toybox`) se desenvuelven para
applets de shell (`sh`, `ash`, etc.) del mismo modo. Si un wrapper o multiplexor no puede
desenvolverse con seguridad, no se persiste automáticamente ninguna entrada de allowlist.

Si añades a la allowlist intérpretes como `python3` o `node`, prefiere
`tools.exec.strictInlineEval=true` para que la evaluación inline siga requiriendo aprobación explícita. En modo estricto, `allow-always` puede seguir persistiendo invocaciones benignas de intérprete/script, pero los portadores de evaluación inline no se persisten automáticamente.

### Safe bins frente a allowlist

| Tema             | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Objetivo         | Permitir automáticamente filtros estrechos de stdin    | Confiar explícitamente en ejecutables específicos            |
| Tipo de coincidencia | Nombre del ejecutable + política de argv de safe-bin | Patrón glob de la ruta resuelta del ejecutable              |
| Ámbito de argumentos | Restringido por el perfil safe-bin y reglas de tokens literales | Solo coincidencia de ruta; el resto de argumentos son responsabilidad tuya |
| Ejemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizadas       |
| Mejor uso        | Transformaciones de texto de bajo riesgo en pipelines  | Cualquier herramienta con comportamiento más amplio o efectos secundarios |

Ubicación de la configuración:

- `safeBins` viene de la configuración (`tools.exec.safeBins` o por agente `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` viene de la configuración (`tools.exec.safeBinTrustedDirs` o por agente `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` viene de la configuración (`tools.exec.safeBinProfiles` o por agente `agents.list[].tools.exec.safeBinProfiles`). Las claves por agente sobrescriben las claves globales.
- Las entradas de allowlist viven en `~/.openclaw/exec-approvals.json` local del host bajo `agents.<id>.allowlist` (o mediante Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avisa con `tools.exec.safe_bins_interpreter_unprofiled` cuando aparecen bins de intérprete/runtime en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede generar entradas faltantes `safeBinProfiles.<bin>` como `{}` (revísalas y endurece la configuración después). Los bins de intérprete/runtime no se generan automáticamente.

Ejemplo de perfil personalizado:
__OC_I18N_900000__
Si incluyes explícitamente `jq` en `safeBins`, OpenClaw sigue rechazando el builtin `env` en modo safe-bin para que `jq -n env` no pueda volcar el entorno del proceso del host sin una ruta explícita de allowlist o un prompt de aprobación.

## Comandos de intérprete/runtime

Las ejecuciones de intérprete/runtime respaldadas por aprobación son intencionadamente conservadoras:

- Siempre se vincula el contexto exacto de argv/cwd/env.
- Las formas directas de script de shell y de archivo de runtime directo se vinculan, en modo best-effort, a una única instantánea concreta de archivo local.
- Las formas comunes de wrapper de gestor de paquetes que aún resuelven a un único archivo local directo (por ejemplo `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desenvuelven antes de vincularse.
- Si OpenClaw no puede identificar exactamente un único archivo local concreto para un comando de intérprete/runtime (por ejemplo scripts de paquetes, formas eval, cadenas de cargadores específicas del runtime o formas ambiguas de varios archivos), la ejecución respaldada por aprobación se deniega en lugar de afirmar una cobertura semántica que no tiene.
- Para esos flujos, prefiere sandboxing, un límite de host independiente o un flujo explícito de allowlist/confianza total donde el operador acepte la semántica más amplia del runtime.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente un id de aprobación. Usa ese id para correlacionar más tarde eventos del sistema (`Exec finished` / `Exec denied`). Si no llega ninguna decisión antes del timeout, la solicitud se trata como timeout de aprobación y aparece como motivo de denegación.

### Comportamiento de entrega de seguimiento

Después de que termine un exec asíncrono aprobado, OpenClaw envía un turno de `agent` de seguimiento a la misma sesión.

- Si existe un destino válido de entrega externa (canal entregable más objetivo `to`), la entrega de seguimiento usa ese canal.
- En flujos solo de webchat o de sesión interna sin objetivo externo, la entrega de seguimiento permanece solo en sesión (`deliver: false`).
- Si un llamante solicita explícitamente una entrega externa estricta y no se puede resolver ningún canal externo, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está habilitado y no se puede resolver ningún canal externo, la entrega se degrada a solo sesión en lugar de fallar.

## Reenvío de aprobaciones a canales de chat

Puedes reenviar prompts de aprobación de exec a cualquier canal de chat (incluidos canales Plugin) y aprobarlos
con `/approve`. Esto usa el pipeline normal de entrega saliente.

Configuración:
__OC_I18N_900001__
Responder en el chat:
__OC_I18N_900002__
El comando `/approve` maneja tanto aprobaciones de exec como aprobaciones de Plugins. Si el ID no coincide con una aprobación de exec pendiente, comprueba automáticamente las aprobaciones de Plugins en su lugar.

### Reenvío de aprobaciones de Plugins

El reenvío de aprobaciones de Plugins usa el mismo pipeline de entrega que las aprobaciones de exec, pero tiene su propia configuración independiente bajo `approvals.plugin`. Habilitar o deshabilitar una no afecta a la otra.
__OC_I18N_900003__
La forma de configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` y `targets` funcionan del mismo modo.

Los canales que admiten respuestas interactivas compartidas renderizan los mismos botones de aprobación tanto para aprobaciones de exec como de Plugins. Los canales sin UI interactiva compartida recurren a texto plano con instrucciones `/approve`.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de exec o de Plugin se origina en una superficie de chat entregable, ese mismo chat
puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a canales como Slack, Matrix y
Microsoft Teams además de los flujos ya existentes de Web UI y terminal UI.

Esta ruta compartida de comando de texto usa el modelo normal de autenticación de canal para esa conversación. Si el
chat de origen ya puede enviar comandos y recibir respuestas, las solicitudes de aprobación ya no necesitan un adaptador nativo de entrega independiente solo para seguir pendientes.

Discord y Telegram también admiten `/approve` en el mismo chat, pero esos canales siguen usando su
lista resuelta de aprobadores para la autorización incluso cuando la entrega nativa de aprobaciones está deshabilitada.

Para Telegram y otros clientes nativos de aprobación que llaman directamente al Gateway,
este respaldo está limitado intencionadamente a fallos de tipo "approval not found". Una denegación o error real
de aprobación de exec no reintenta silenciosamente como aprobación de Plugin.

### Entrega nativa de aprobaciones

Algunos canales también pueden actuar como clientes nativos de aprobación. Los clientes nativos añaden DMs de aprobador, fanout al chat de origen y UX interactiva de aprobación específica del canal por encima del flujo compartido `/approve` en el mismo chat.

Cuando hay disponibles tarjetas o botones nativos de aprobación, esa UI nativa es la ruta primaria
de cara al agente. El agente no debería además repetir un comando de chat simple
`/approve` duplicado salvo que el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía restante.

Modelo genérico:

- la política de exec del host sigue decidiendo si se requiere aprobación de exec
- `approvals.exec` controla el reenvío de prompts de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si ese canal actúa como cliente nativo de aprobación

Los clientes nativos de aprobación habilitan automáticamente entrega prioritaria por DM cuando se cumplen todas estas condiciones:

- el canal admite entrega nativa de aprobaciones
- los aprobadores pueden resolverse a partir de `execApprovals.approvers` explícito o de las fuentes de respaldo documentadas para ese canal
- `channels.<channel>.execApprovals.enabled` no está configurado o está en `"auto"`

Configura `enabled: false` para deshabilitar explícitamente un cliente nativo de aprobación. Configura `enabled: true` para forzarlo
cuando se resuelvan aprobadores. La entrega pública al chat de origen sigue siendo explícita mediante
`channels.<channel>.execApprovals.target`.

FAQ: [¿Por qué hay dos configuraciones de aprobación de exec para aprobaciones por chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Estos clientes nativos de aprobación añaden enrutamiento por DM y fanout opcional al canal por encima del flujo compartido `/approve` en el mismo chat y de los botones compartidos de aprobación.

Comportamiento compartido:

- Slack, Matrix, Microsoft Teams y chats entregables similares usan el modelo normal de autenticación del canal
  para `/approve` en el mismo chat
- cuando un cliente nativo de aprobación se autoactiva, el destino nativo predeterminado es DM a los aprobadores
- para Discord y Telegram, solo los aprobadores resueltos pueden aprobar o denegar
- los aprobadores de Discord pueden ser explícitos (`execApprovals.approvers`) o inferidos desde `commands.ownerAllowFrom`
- los aprobadores de Telegram pueden ser explícitos (`execApprovals.approvers`) o inferidos desde la configuración existente de propietario (`allowFrom`, más `defaultTo` de mensaje directo donde se admita)
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferidos desde `commands.ownerAllowFrom`
- los botones nativos de Slack conservan el tipo de id de aprobación, de modo que los ids `plugin:` pueden resolver aprobaciones de Plugins
  sin una segunda capa local de respaldo en Slack
- el enrutamiento nativo de DM/canal y los atajos por reacción de Matrix manejan tanto aprobaciones de exec como de Plugins;
  la autorización de Plugins sigue viniendo de `channels.matrix.dm.allowFrom`
- quien solicita no necesita ser aprobador
- el chat de origen puede aprobar directamente con `/approve` cuando ese chat ya admite comandos y respuestas
- los botones nativos de aprobación de Discord enrutan según el tipo de id de aprobación: los ids `plugin:` van
  directamente a aprobaciones de Plugins; todo lo demás va a aprobaciones de exec
- los botones nativos de aprobación de Telegram siguen el mismo respaldo limitado de exec a Plugin que `/approve`
- cuando `target` nativo habilita entrega al chat de origen, los prompts de aprobación incluyen el texto del comando
- las aprobaciones pendientes de exec caducan a los 30 minutos de forma predeterminada
- si ninguna UI de operador ni cliente de aprobación configurado puede aceptar la solicitud, el prompt recurre a `askFallback`

Telegram usa por defecto DM a los aprobadores (`target: "dm"`). Puedes cambiar a `channel` o `both` cuando
quieras que los prompts de aprobación aparezcan también en el chat o tema de Telegram de origen. Para temas de foro de Telegram, OpenClaw conserva el tema tanto para el prompt de aprobación como para el seguimiento posterior a la aprobación.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flujo IPC de macOS
__OC_I18N_900004__
Notas de seguridad:

- Modo de socket Unix `0600`, token almacenado en `exec-approvals.json`.
- Comprobación de par con mismo UID.
- Desafío/respuesta (nonce + token HMAC + hash de solicitud) + TTL corto.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals) — política central y flujo de aprobación
- [Herramienta exec](/es/tools/exec)
- [Modo elevado](/es/tools/elevated)
- [Skills](/es/tools/skills) — comportamiento de auto-allow respaldado por Skills
