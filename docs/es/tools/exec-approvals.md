---
read_when:
    - Configurar aprobaciones de exec o listas de permitidos
    - Implementar la UX de aprobación de exec en la app de macOS
    - Revisar los prompts de escape del sandbox y sus implicaciones
summary: Aprobaciones de exec, listas de permitidos y prompts de escape del sandbox
title: Aprobaciones de exec
x-i18n:
    generated_at: "2026-04-21T13:38:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Aprobaciones de exec

Las aprobaciones de exec son la **barandilla de seguridad de la app complementaria / host del node** para permitir que un agente en sandbox ejecute
comandos en un host real (`gateway` o `node`). Piensa en ello como un interbloqueo de seguridad:
los comandos se permiten solo cuando la política + la lista de permitidos + la aprobación del usuario (opcional) coinciden.
Las aprobaciones de exec son **adicionales** a la política de herramientas y al control elevado (a menos que elevated esté en `full`, lo que omite las aprobaciones).
La política efectiva es la **más estricta** entre los valores predeterminados de `tools.exec.*` y las aprobaciones; si se omite un campo de aprobaciones, se usa el valor de `tools.exec`.
El exec en host también usa el estado local de aprobaciones en esa máquina. Un valor local del host
`ask: "always"` en `~/.openclaw/exec-approvals.json` sigue mostrando prompts incluso si
la sesión o los valores predeterminados de configuración solicitan `ask: "on-miss"`.
Usa `openclaw approvals get`, `openclaw approvals get --gateway` o
`openclaw approvals get --node <id|name|ip>` para inspeccionar la política solicitada,
las fuentes de política del host y el resultado efectivo.
Para la máquina local, `openclaw exec-policy show` expone la misma vista combinada y
`openclaw exec-policy set|preset` puede sincronizar la política local solicitada con el
archivo local de aprobaciones del host en un solo paso. Cuando un alcance local solicita `host=node`,
`openclaw exec-policy show` informa ese alcance como administrado por el node en tiempo de ejecución en lugar de
simular que el archivo local de aprobaciones es la fuente efectiva de verdad.

Si la UI de la app complementaria **no está disponible**, cualquier solicitud que requiera un prompt se
resuelve mediante el **fallback de ask** (predeterminado: denegar).

Los clientes nativos de aprobación por chat también pueden exponer affordances específicas del canal en el
mensaje de aprobación pendiente. Por ejemplo, Matrix puede sembrar accesos directos mediante reacciones en el
prompt de aprobación (`✅` permitir una vez, `❌` denegar y `♾️` permitir siempre cuando esté disponible)
sin dejar de ofrecer los comandos `/approve ...` en el mensaje como fallback.

## Dónde se aplica

Las aprobaciones de exec se aplican localmente en el host de ejecución:

- **host del gateway** → proceso `openclaw` en la máquina del gateway
- **host del node** → runner del node (app complementaria de macOS o host de node sin interfaz)

Nota sobre el modelo de confianza:

- Los llamadores autenticados en Gateway son operadores de confianza para ese Gateway.
- Los nodes emparejados extienden esa capacidad de operador de confianza al host del node.
- Las aprobaciones de exec reducen el riesgo de ejecución accidental, pero no son un límite de autenticación por usuario.
- Las ejecuciones aprobadas del host del node vinculan el contexto de ejecución canónico: cwd canónico, argv exacto, vinculación de env
  cuando está presente y ruta del ejecutable fijada cuando corresponde.
- Para scripts de shell e invocaciones directas de archivos de intérprete/runtime, OpenClaw también intenta vincular
  un operando de archivo local concreto. Si ese archivo vinculado cambia después de la aprobación pero antes de la ejecución,
  la ejecución se deniega en lugar de ejecutar contenido desviado.
- Esta vinculación de archivos es intencionalmente de mejor esfuerzo, no un modelo semántico completo de todas
  las rutas de carga de intérprete/runtime. Si el modo de aprobación no puede identificar exactamente un archivo local concreto
  para vincular, se niega a emitir una ejecución respaldada por aprobación en lugar de simular cobertura total.

Separación de macOS:

- **servicio host del node** reenvía `system.run` a la **app de macOS** a través de IPC local.
- **app de macOS** aplica las aprobaciones + ejecuta el comando en el contexto de la UI.

## Configuración y almacenamiento

Las aprobaciones viven en un archivo JSON local en el host de ejecución:

`~/.openclaw/exec-approvals.json`

Esquema de ejemplo:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Modo "YOLO" sin aprobación

Si quieres que el exec en host se ejecute sin prompts de aprobación, debes abrir **ambas** capas de política:

- política de exec solicitada en la configuración de OpenClaw (`tools.exec.*`)
- política local de aprobaciones del host en `~/.openclaw/exec-approvals.json`

Este es ahora el comportamiento predeterminado del host a menos que lo endurezcas explícitamente:

- `tools.exec.security`: `full` en `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinción importante:

- `tools.exec.host=auto` elige dónde se ejecuta exec: sandbox cuando está disponible; en caso contrario, gateway.
- YOLO elige cómo se aprueba el exec en host: `security=full` más `ask=off`.
- En modo YOLO, OpenClaw no añade una barrera de aprobación heurística separada para ofuscación de comandos ni una capa de rechazo previo de scripts por encima de la política de exec en host configurada.
- `auto` no convierte el enrutamiento al gateway en una anulación libre desde una sesión en sandbox. Se permite una solicitud por llamada `host=node` desde `auto`, y `host=gateway` solo se permite desde `auto` cuando no hay un runtime de sandbox activo. Si quieres un valor predeterminado estable distinto de auto, establece `tools.exec.host` o usa `/exec host=...` explícitamente.

Si quieres una configuración más conservadora, vuelve a endurecer cualquiera de las dos capas a `allowlist` / `on-miss`
o `deny`.

Configuración persistente de host del gateway en "nunca preguntar":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Después, ajusta el archivo de aprobaciones del host para que coincida:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Acceso directo local para la misma política de host del gateway en la máquina actual:

```bash
openclaw exec-policy preset yolo
```

Ese acceso directo local actualiza ambos:

- `tools.exec.host/security/ask` locales
- valores predeterminados locales de `~/.openclaw/exec-approvals.json`

Está pensado intencionalmente solo para uso local. Si necesitas cambiar de forma remota las aprobaciones del host del gateway o del host del node,
sigue usando `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

Para un host del node, aplica en su lugar el mismo archivo de aprobaciones en ese node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Limitación importante solo local:

- `openclaw exec-policy` no sincroniza aprobaciones del node
- `openclaw exec-policy set --host node` se rechaza
- las aprobaciones de exec del node se obtienen del node en tiempo de ejecución, por lo que las actualizaciones dirigidas al node deben usar `openclaw approvals --node ...`

Acceso directo solo de sesión:

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un acceso directo de emergencia que también omite las aprobaciones de exec para esa sesión.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, la política más estricta del host sigue prevaleciendo.

## Controles de política

### Seguridad (`exec.security`)

- **deny**: bloquea todas las solicitudes de exec en host.
- **allowlist**: permite solo comandos incluidos en la lista de permitidos.
- **full**: permite todo (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: nunca mostrar prompts.
- **on-miss**: mostrar prompt solo cuando la lista de permitidos no coincide.
- **always**: mostrar prompt en cada comando.
- La confianza duradera `allow-always` no suprime los prompts cuando el modo ask efectivo es `always`

### Fallback de ask (`askFallback`)

Si se requiere un prompt pero no hay ninguna UI accesible, fallback decide:

- **deny**: bloquear.
- **allowlist**: permitir solo si la lista de permitidos coincide.
- **full**: permitir.

### Endurecimiento de eval inline de intérprete (`tools.exec.strictInlineEval`)

Cuando `tools.exec.strictInlineEval=true`, OpenClaw trata las formas de evaluación inline de código como solo aprobables incluso si el binario del intérprete en sí está en la lista de permitidos.

Ejemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Esto es defensa en profundidad para cargadores de intérprete que no se asignan limpiamente a un único operando de archivo estable. En modo estricto:

- estos comandos siguen necesitando aprobación explícita;
- `allow-always` no conserva automáticamente nuevas entradas de lista de permitidos para ellos.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, cambia el agente que estás
editando en la app de macOS. Los patrones son **coincidencias glob sin distinguir mayúsculas/minúsculas**.
Los patrones deben resolverse a **rutas de binarios** (las entradas solo con nombre base se ignoran).
Las entradas heredadas `agents.default` se migran a `agents.main` al cargarse.
Las cadenas de shell como `echo ok && pwd` siguen necesitando que cada segmento de nivel superior cumpla las reglas de la lista de permitidos.

Ejemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de la lista de permitidos registra:

- **id** UUID estable usado para identidad en la UI (opcional)
- **último uso** marca de tiempo
- **último comando usado**
- **última ruta resuelta**

## Auto-allow de CLI de Skills

Cuando **Auto-allow skill CLIs** está activado, los ejecutables referenciados por Skills conocidos
se tratan como incluidos en la lista de permitidos en nodes (node de macOS o host de node sin interfaz). Esto usa
`skills.bins` sobre el RPC de Gateway para obtener la lista de binarios de Skills. Desactívalo si quieres listas de permitidos manuales estrictas.

Notas importantes de confianza:

- Esta es una **lista de permitidos implícita de conveniencia**, separada de las entradas manuales de lista de permitidos por ruta.
- Está pensada para entornos de operadores de confianza en los que Gateway y node están en el mismo límite de confianza.
- Si necesitas confianza explícita estricta, mantén `autoAllowSkills: false` y usa solo entradas manuales de lista de permitidos por ruta.

## Safe bins (solo stdin)

`tools.exec.safeBins` define una pequeña lista de binarios **solo stdin** (por ejemplo `cut`)
que pueden ejecutarse en modo de lista de permitidos **sin** entradas explícitas de lista de permitidos. Safe bins rechaza
argumentos de archivo posicionales y tokens con forma de ruta, por lo que solo pueden operar sobre el flujo entrante.
Trata esto como una ruta rápida limitada para filtros de flujo, no como una lista general de confianza.
**No** añadas binarios de intérprete o runtime (por ejemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Si un comando puede evaluar código, ejecutar subcomandos o leer archivos por diseño, prefiere entradas explícitas de lista de permitidos y mantén activados los prompts de aprobación.
Los safe bins personalizados deben definir un perfil explícito en `tools.exec.safeBinProfiles.<bin>`.
La validación es determinista solo a partir de la forma de argv (sin comprobaciones de existencia en el sistema de archivos del host), lo que
evita comportamiento de oráculo de existencia de archivos por diferencias de permitir/denegar.
Las opciones orientadas a archivos se deniegan para los safe bins predeterminados (por ejemplo `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Los safe bins también aplican política explícita por binario para opciones que rompen el
comportamiento solo stdin (por ejemplo `sort -o/--output/--compress-program` y flags recursivos de grep).
Las opciones largas se validan en modo fail-closed en safe-bin: se rechazan las banderas desconocidas y las abreviaturas ambiguas.
Banderas denegadas por perfil de safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins también obligan a que los tokens de argv se traten como **texto literal** en tiempo de ejecución (sin expansión de glob
ni de `$VARS`) para segmentos solo stdin, de modo que patrones como `*` o `$HOME/...` no puedan
usarse para introducir lecturas de archivos.
Los safe bins también deben resolverse desde directorios de binarios de confianza (valores predeterminados del sistema más
`tools.exec.safeBinTrustedDirs` opcional). Las entradas de `PATH` nunca se consideran de confianza automáticamente.
Los directorios predeterminados de confianza para safe bins son intencionalmente mínimos: `/bin`, `/usr/bin`.
Si tu ejecutable safe-bin vive en rutas de gestor de paquetes/usuario (por ejemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), añádelas explícitamente
a `tools.exec.safeBinTrustedDirs`.
Las cadenas de shell y las redirecciones no se permiten automáticamente en modo allowlist.

Las cadenas de shell (`&&`, `||`, `;`) se permiten cuando cada segmento de nivel superior cumple la allowlist
(incluyendo safe bins o auto-allow de Skills). Las redirecciones siguen sin ser compatibles en modo allowlist.
La sustitución de comandos (`$()` / comillas invertidas) se rechaza durante el análisis de allowlist, incluso dentro de
comillas dobles; usa comillas simples si necesitas texto literal `$()`.
En las aprobaciones de la app complementaria de macOS, el texto shell sin procesar que contiene sintaxis de control o expansión de shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se trata como un fallo de allowlist a menos que
el propio binario del shell esté en allowlist.
Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), las anulaciones de env con alcance de solicitud se reducen a una
pequeña allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Para decisiones `allow-always` en modo allowlist, los envoltorios de despacho conocidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan las rutas del ejecutable interno en lugar de las
rutas del envoltorio. Los multiplexores de shell (`busybox`, `toybox`) también se desempaquetan para applets de shell (`sh`, `ash`,
etc.) de modo que se conserven los ejecutables internos en lugar de los binarios multiplexores. Si un envoltorio o
multiplexor no puede desempaquetarse de forma segura, no se conserva automáticamente ninguna entrada de allowlist.
Si incluyes en allowlist intérpretes como `python3` o `node`, prefiere `tools.exec.strictInlineEval=true` para que la evaluación inline siga requiriendo una aprobación explícita. En modo estricto, `allow-always` aún puede conservar invocaciones inocuas de intérprete/script, pero los portadores de evaluación inline no se conservan automáticamente.

Safe bins predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si los activas explícitamente, mantén entradas de allowlist explícitas para
sus flujos de trabajo que no sean solo stdin.
Para `grep` en modo safe-bin, proporciona el patrón con `-e`/`--regexp`; la forma de patrón posicional se
rechaza para que no se puedan introducir operandos de archivo como posicionales ambiguos.

### Safe bins frente a allowlist

| Topic            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Objetivo         | Permitir automáticamente filtros limitados solo stdin  | Confiar explícitamente en ejecutables concretos              |
| Tipo de coincidencia | Nombre del ejecutable + política argv de safe-bin   | Patrón glob de ruta resuelta del ejecutable                  |
| Alcance de argumentos | Restringido por el perfil de safe-bin y reglas de tokens literales | Solo coincidencia de ruta; los argumentos son por lo demás tu responsabilidad |
| Ejemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizados        |
| Mejor uso        | Transformaciones de texto de bajo riesgo en pipelines  | Cualquier herramienta con comportamiento más amplio o efectos secundarios |

Ubicación de la configuración:

- `safeBins` viene de la configuración (`tools.exec.safeBins` o por agente `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` viene de la configuración (`tools.exec.safeBinTrustedDirs` o por agente `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` viene de la configuración (`tools.exec.safeBinProfiles` o por agente `agents.list[].tools.exec.safeBinProfiles`). Las claves de perfil por agente prevalecen sobre las globales.
- las entradas de allowlist viven en `~/.openclaw/exec-approvals.json` local del host bajo `agents.<id>.allowlist` (o mediante Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` advierte con `tools.exec.safe_bins_interpreter_unprofiled` cuando binarios de intérprete/runtime aparecen en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede generar entradas faltantes `safeBinProfiles.<bin>` como `{}` (revísalas y endurécelas después). Los binarios de intérprete/runtime no se generan automáticamente.

Ejemplo de perfil personalizado:
__OC_I18N_900005__
Si activas explícitamente `jq` en `safeBins`, OpenClaw sigue rechazando el builtin `env` en modo safe-bin
para que `jq -n env` no pueda volcar el entorno del proceso host sin una ruta explícita en allowlist
o un prompt de aprobación.

## Edición en Control UI

Usa la tarjeta **Control UI → Nodes → Exec approvals** para editar valores predeterminados, anulaciones
por agente y allowlists. Elige un alcance (Predeterminados o un agente), ajusta la política,
añade/elimina patrones de allowlist y luego **Save**. La UI muestra metadatos de **último uso**
por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (aprobaciones locales) o un **Node**. Los nodes
deben anunciar `system.execApprovals.get/set` (app de macOS o host de node sin interfaz).
Si un node aún no anuncia aprobaciones de exec, edita directamente su
`~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` admite edición de gateway o node (consulta [Approvals CLI](/cli/approvals)).

## Flujo de aprobación

Cuando se requiere un prompt, el gateway difunde `exec.approval.requested` a los clientes operadores.
Control UI y la app de macOS lo resuelven mediante `exec.approval.resolve`, y después el gateway reenvía la
solicitud aprobada al host del node.

Para `host=node`, las solicitudes de aprobación incluyen un payload canónico `systemRunPlan`. El gateway usa
ese plan como contexto autoritativo de comando/cwd/sesión al reenviar solicitudes aprobadas de `system.run`.

Esto importa para la latencia de aprobación asíncrona:

- la ruta de exec del node prepara por adelantado un plan canónico
- el registro de aprobación almacena ese plan y sus metadatos de vinculación
- una vez aprobado, la llamada final reenviada de `system.run` reutiliza el plan almacenado
  en lugar de confiar en ediciones posteriores del llamador
- si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` después de crear la solicitud de aprobación, el gateway rechaza la
  ejecución reenviada por incompatibilidad de aprobación

## Comandos de intérprete/runtime

Las ejecuciones de intérprete/runtime respaldadas por aprobación son intencionalmente conservadoras:

- Siempre se vincula el contexto exacto de argv/cwd/env.
- Las formas directas de script de shell y de archivo de runtime directo se vinculan por mejor esfuerzo a una instantánea concreta de un archivo local.
- Las formas comunes de envoltorio de gestor de paquetes que siguen resolviéndose a un único archivo local directo (por ejemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desempaquetan antes de la vinculación.
- Si OpenClaw no puede identificar exactamente un único archivo local concreto para un comando de intérprete/runtime
  (por ejemplo scripts de paquete, formas eval, cadenas de cargador específicas del runtime o formas ambiguas de múltiples archivos),
  la ejecución respaldada por aprobación se deniega en lugar de afirmar una cobertura semántica que no
  tiene.
- Para esos flujos de trabajo, prefiere el sandboxing, un límite de host separado o un flujo explícito
  de allowlist/full de confianza donde el operador acepte la semántica más amplia del runtime.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente un id de aprobación. Usa ese id para
correlacionar eventos posteriores del sistema (`Exec finished` / `Exec denied`). Si no llega ninguna decisión antes de que
venza el tiempo, la solicitud se trata como tiempo de espera de aprobación y se muestra como motivo de denegación.

### Comportamiento de entrega posterior

Después de que termine un exec asíncrono aprobado, OpenClaw envía un turno de `agent` de seguimiento a la misma sesión.

- Si existe un destino de entrega externo válido (canal entregable más destino `to`), la entrega de seguimiento usa ese canal.
- En flujos solo de webchat o sesión interna sin destino externo, la entrega de seguimiento permanece solo en la sesión (`deliver: false`).
- Si un llamador solicita explícitamente una entrega externa estricta sin un canal externo resoluble, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está activado y no se puede resolver ningún canal externo, la entrega se degrada a solo sesión en lugar de fallar.

El cuadro de diálogo de confirmación incluye:

- comando + args
- cwd
- id del agente
- ruta resuelta del ejecutable
- host + metadatos de política

Acciones:

- **Allow once** → ejecutar ahora
- **Always allow** → añadir a allowlist + ejecutar
- **Deny** → bloquear

## Reenvío de aprobaciones a canales de chat

Puedes reenviar prompts de aprobación de exec a cualquier canal de chat (incluidos canales Plugin) y aprobarlos
con `/approve`. Esto usa el pipeline normal de entrega saliente.

Configuración:
__OC_I18N_900006__
Responder en el chat:
__OC_I18N_900007__
El comando `/approve` gestiona tanto aprobaciones de exec como aprobaciones de Plugin. Si el ID no coincide con una aprobación de exec pendiente, comprueba automáticamente las aprobaciones de Plugin.

### Reenvío de aprobaciones de Plugin

El reenvío de aprobaciones de Plugin usa el mismo pipeline de entrega que las aprobaciones de exec, pero tiene su propia
configuración independiente en `approvals.plugin`. Activar o desactivar uno no afecta al otro.
__OC_I18N_900008__
La forma de la configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` y `targets` funcionan del mismo modo.

Los canales que admiten respuestas interactivas compartidas muestran los mismos botones de aprobación tanto para aprobaciones de exec como de Plugin. Los canales sin UI interactiva compartida recurren a texto sin formato con instrucciones de `/approve`.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de exec o de Plugin se origina en una superficie de chat entregable, ese mismo chat
ya puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a canales como Slack, Matrix y
Microsoft Teams además de los flujos ya existentes de Web UI y terminal UI.

Esta ruta compartida de comandos de texto usa el modelo normal de autenticación del canal para esa conversación. Si el
chat de origen ya puede enviar comandos y recibir respuestas, las solicitudes de aprobación ya no necesitan un
adaptador nativo de entrega independiente solo para permanecer pendientes.

Discord y Telegram también admiten `/approve` en el mismo chat, pero esos canales siguen usando su
lista resuelta de aprobadores para la autorización incluso cuando la entrega nativa de aprobación está desactivada.

Para Telegram y otros clientes nativos de aprobación que llaman directamente al Gateway,
este fallback está intencionalmente limitado a fallos de tipo "approval not found". Un error o denegación real
de aprobación de exec no vuelve a intentarse silenciosamente como aprobación de Plugin.

### Entrega nativa de aprobaciones

Algunos canales también pueden actuar como clientes nativos de aprobación. Los clientes nativos añaden MD de aprobadores, fanout al chat de origen
y UX interactiva de aprobación específica del canal además del flujo compartido `/approve`
en el mismo chat.

Cuando las tarjetas/botones nativos de aprobación están disponibles, esa UI nativa es la ruta principal
orientada al agente. El agente no debería además repetir un comando simple duplicado de chat
`/approve` a menos que el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o
que la aprobación manual es la única ruta restante.

Modelo genérico:

- la política de exec del host sigue decidiendo si se requiere aprobación de exec
- `approvals.exec` controla el reenvío de prompts de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si ese canal actúa como cliente nativo de aprobación

Los clientes nativos de aprobación activan automáticamente la entrega prioritaria por MD cuando se cumplen todas estas condiciones:

- el canal admite entrega nativa de aprobación
- los aprobadores pueden resolverse a partir de `execApprovals.approvers` explícito o de las
  fuentes de fallback documentadas para ese canal
- `channels.<channel>.execApprovals.enabled` no está establecido o es `"auto"`

Establece `enabled: false` para desactivar explícitamente un cliente nativo de aprobación. Establece `enabled: true` para forzarlo
cuando se resuelvan los aprobadores. La entrega pública al chat de origen sigue siendo explícita mediante
`channels.<channel>.execApprovals.target`.

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Estos clientes nativos de aprobación añaden enrutamiento por MD y fanout opcional al canal además del flujo compartido
`/approve` en el mismo chat y los botones compartidos de aprobación.

Comportamiento compartido:

- Slack, Matrix, Microsoft Teams y chats entregables similares usan el modelo normal de autenticación del canal
  para `/approve` en el mismo chat
- cuando un cliente nativo de aprobación se activa automáticamente, el destino nativo predeterminado de entrega son las MD de los aprobadores
- para Discord y Telegram, solo los aprobadores resueltos pueden aprobar o denegar
- los aprobadores de Discord pueden ser explícitos (`execApprovals.approvers`) o inferidos a partir de `commands.ownerAllowFrom`
- los aprobadores de Telegram pueden ser explícitos (`execApprovals.approvers`) o inferidos de la configuración existente de propietario (`allowFrom`, más `defaultTo` de mensaje directo cuando se admite)
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferidos a partir de `commands.ownerAllowFrom`
- los botones nativos de Slack conservan el tipo de id de aprobación, por lo que los ids `plugin:` pueden resolver aprobaciones de Plugin
  sin una segunda capa de fallback local de Slack
- el enrutamiento nativo de MD/canal de Matrix y los accesos directos por reacciones gestionan tanto aprobaciones de exec como de Plugin;
  la autorización de Plugin sigue viniendo de `channels.matrix.dm.allowFrom`
- la persona solicitante no necesita ser aprobadora
- el chat de origen puede aprobar directamente con `/approve` cuando ese chat ya admite comandos y respuestas
- los botones nativos de aprobación de Discord enrutan por tipo de id de aprobación: los ids `plugin:` van
  directamente a aprobaciones de Plugin; todo lo demás va a aprobaciones de exec
- los botones nativos de aprobación de Telegram siguen el mismo fallback limitado de exec a Plugin que `/approve`
- cuando `target` nativo habilita la entrega al chat de origen, los prompts de aprobación incluyen el texto del comando
- las aprobaciones de exec pendientes caducan después de 30 minutos de forma predeterminada
- si ninguna UI de operador o cliente de aprobación configurado puede aceptar la solicitud, el prompt recurre a `askFallback`

Telegram usa de forma predeterminada las MD de aprobadores (`target: "dm"`). Puedes cambiar a `channel` o `both` cuando
quieras que los prompts de aprobación aparezcan también en el chat/tema de Telegram de origen. Para temas de foro de Telegram,
OpenClaw conserva el tema para el prompt de aprobación y el seguimiento posterior a la aprobación.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flujo de IPC en macOS
__OC_I18N_900009__
Notas de seguridad:

- Modo del socket Unix `0600`, token almacenado en `exec-approvals.json`.
- Comprobación de par con mismo UID.
- Desafío/respuesta (nonce + token HMAC + hash de solicitud) + TTL corto.

## Eventos del sistema

El ciclo de vida de exec se expone como mensajes del sistema:

- `Exec running` (solo si el comando supera el umbral del aviso de ejecución)
- `Exec finished`
- `Exec denied`

Estos se publican en la sesión del agente después de que el node informe del evento.
Las aprobaciones de exec en el host del gateway emiten los mismos eventos de ciclo de vida cuando termina el comando (y opcionalmente cuando sigue ejecutándose más allá del umbral).
Los exec controlados por aprobación reutilizan el id de aprobación como `runId` en estos mensajes para facilitar la correlación.

## Comportamiento cuando se deniega la aprobación

Cuando se deniega una aprobación asíncrona de exec, OpenClaw impide que el agente reutilice
salida de cualquier ejecución anterior del mismo comando en la sesión. El motivo de la denegación
se transmite con una guía explícita de que no hay salida de comando disponible, lo que evita
que el agente afirme que hay salida nueva o repita el comando denegado con
resultados obsoletos de una ejecución previa satisfactoria.

## Implicaciones

- **full** es potente; prefiere allowlists cuando sea posible.
- **ask** te mantiene dentro del circuito y aun así permite aprobaciones rápidas.
- Las allowlists por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de exec en host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite las aprobaciones por diseño.
  Para bloquear por completo el exec en host, establece la seguridad de aprobaciones en `deny` o deniega la herramienta `exec` mediante política de herramientas.

Relacionado:

- [Exec tool](/es/tools/exec)
- [Elevated mode](/es/tools/elevated)
- [Skills](/es/tools/skills)

## Relacionado

- [Exec](/es/tools/exec) — herramienta de ejecución de comandos de shell
- [Sandboxing](/es/gateway/sandboxing) — modos de sandbox y acceso al espacio de trabajo
- [Security](/es/gateway/security) — modelo de seguridad y endurecimiento
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) — cuándo usar cada uno
