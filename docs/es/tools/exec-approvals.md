---
read_when:
    - Configurar aprobaciones de exec o listas de permitidos
    - Implementación de la experiencia de aprobación de exec en la app para macOS
    - Revisión de prompts de escape del sandbox y sus implicaciones
sidebarTitle: Exec approvals
summary: 'Aprobaciones de ejecución en el host: controles de política, listas de permitidos y el flujo de trabajo YOLO/estricto'
title: Aprobaciones de ejecución
x-i18n:
    generated_at: "2026-06-27T13:03:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Las aprobaciones de exec son el **límite de seguridad de la aplicación complementaria / host Node** para permitir que
un agente en sandbox ejecute comandos en un host real (`gateway` o `node`). Un
enclavamiento de seguridad: los comandos solo se permiten cuando la política + la lista de permitidos +
la aprobación del usuario (opcional) coinciden. Las aprobaciones de exec se apilan **encima de**
la política de herramientas y la compuerta elevada (a menos que elevated esté configurado en `full`, lo que
omite las aprobaciones).

Para ver una descripción general centrada en modos de `deny`, `allowlist`, `ask`, `auto`, `full`,
la asignación de Codex Guardian y los permisos del arnés ACPX, consulta
[Modos de permisos](/es/tools/permission-modes).

<Note>
La política efectiva es la **más estricta** entre los valores predeterminados de `tools.exec.*` y approvals;
si se omite un campo de approvals, se usa el valor de `tools.exec`. La ejecución en host también usa el estado local de aprobaciones en esa máquina: un
`ask: "always"` local al host en el archivo de aprobaciones del host de ejecución sigue
solicitando confirmación aunque los valores predeterminados de sesión o configuración soliciten `ask: "on-miss"`.
</Note>

## Inspeccionar la política efectiva

| Comando                                                          | Qué muestra                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fuentes de política del host y el resultado efectivo.             |
| `openclaw exec-policy show`                                      | Vista combinada de la máquina local.                                                   |
| `openclaw exec-policy set` / `preset`                            | Sincroniza la política solicitada local con el archivo local de aprobaciones del host en un solo paso. |

Cuando un ámbito local solicita `host=node`, `exec-policy show` informa ese
ámbito como gestionado por Node en tiempo de ejecución, en lugar de fingir que el archivo local de
aprobaciones es la fuente de verdad.

Si la interfaz de la aplicación complementaria **no está disponible**, cualquier solicitud que
normalmente pediría confirmación se resuelve mediante el **ask fallback** (valor predeterminado: `deny`).

<Tip>
Los clientes nativos de aprobación por chat pueden preparar facilidades específicas del canal en el
mensaje de aprobación pendiente. Por ejemplo, Matrix prepara atajos de reacción
(`✅` permitir una vez, `❌` denegar, `♾️` permitir siempre), sin dejar de incluir
comandos `/approve ...` en el mensaje como alternativa.
</Tip>

## Dónde se aplica

Las aprobaciones de exec se aplican localmente en el host de ejecución:

- **Host Gateway** → proceso `openclaw` en la máquina Gateway.
- **Host Node** → ejecutor Node (aplicación complementaria de macOS o host Node sin interfaz).

### Modelo de confianza

- Los llamadores autenticados por Gateway son operadores de confianza para ese Gateway.
- Los nodos emparejados extienden esa capacidad de operador de confianza al host Node.
- Las aprobaciones de exec reducen el riesgo de ejecución accidental, pero **no** son un límite de autorización por usuario ni una política de sistema de archivos de solo lectura.
- Una vez aprobado, un comando puede modificar archivos según los permisos del host o del sistema de archivos del sandbox seleccionado.
- Las ejecuciones aprobadas en host Node vinculan el contexto de ejecución canónico: cwd canónico, argv exacto, enlace de env cuando está presente y ruta ejecutable fijada cuando corresponde.
- Para scripts de shell e invocaciones directas de archivos de intérprete/runtime, OpenClaw también intenta vincular un operando de archivo local concreto. Si ese archivo vinculado cambia después de la aprobación pero antes de la ejecución, la ejecución se deniega en lugar de ejecutar contenido desplazado.
- El enlace de archivos es intencionalmente de mejor esfuerzo, **no** un modelo semántico completo de cada ruta de cargador de intérprete/runtime. Si el modo de aprobación no puede identificar exactamente un archivo local concreto para vincular, se niega a emitir una ejecución respaldada por aprobación en lugar de fingir cobertura completa.

### División en macOS

- El **servicio del host Node** reenvía `system.run` a la **aplicación macOS** mediante IPC local.
- La **aplicación macOS** aplica las aprobaciones y ejecuta el comando en contexto de interfaz.

## Configuración y almacenamiento

Las aprobaciones viven en un archivo JSON local en el host de ejecución. Cuando
`OPENCLAW_STATE_DIR` está definido, el archivo sigue ese directorio de estado;
de lo contrario usa el directorio de estado predeterminado de OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

El socket de aprobación predeterminado sigue la misma raíz:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, o
`~/.openclaw/exec-approvals.sock` cuando la variable no está definida.

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
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Controles de política

### `tools.exec.mode`

`tools.exec.mode` es la superficie de política normalizada preferida para exec en host.
Los valores son:

- `deny` - bloquear exec en host.
- `allowlist` - ejecutar solo comandos incluidos en la lista de permitidos sin preguntar.
- `ask` - usar la política de lista de permitidos y preguntar en las faltas.
- `auto` - usar la política de lista de permitidos, ejecutar coincidencias deterministas directamente y enviar las faltas de aprobación por el revisor automático nativo de OpenClaw antes de recurrir a una ruta de aprobación humana.
- `full` - ejecutar exec en host sin solicitudes de aprobación.

Los valores heredados `tools.exec.security` / `tools.exec.ask` siguen siendo compatibles y aún prevalecen
cuando están definidos en el ámbito más estrecho de sesión o agente.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloquear todas las solicitudes de exec en host.
  - `allowlist` - permitir solo comandos incluidos en la lista de permitidos.
  - `full` - permitir todo (equivalente a elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Política ask configurada para exec en host. Controla el comportamiento base de
  solicitud de aprobación desde `tools.exec.ask` y los valores predeterminados de aprobaciones del host. El
  parámetro de herramienta `ask` por llamada (consulta [Herramienta exec](/es/tools/exec#parameters))
  solo puede endurecer esa base, y las llamadas de modelo originadas en canal lo ignoran
  cuando el ask efectivo del host es `off`.

- `off` - no solicitar nunca.
- `on-miss` - solicitar solo cuando la lista de permitidos no coincide.
- `always` - solicitar en cada comando. La confianza duradera `allow-always` **no** suprime las solicitudes cuando el modo ask efectivo es `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolución cuando se requiere una solicitud pero no hay interfaz accesible. Si este
  campo se omite, OpenClaw usa `deny` de forma predeterminada.

- `deny` - bloquear.
- `allowlist` - permitir solo si la lista de permitidos coincide.
- `full` - permitir.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Cuando es `true`, OpenClaw trata las formas inline de evaluación de código como solo con aprobación,
  aunque el binario del intérprete en sí esté en la lista de permitidos. Defensa en profundidad
  para cargadores de intérprete que no se asignan limpiamente a un único operando de archivo
  estable.
</ParamField>

Ejemplos que el modo estricto detecta:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

En modo estricto, estos comandos siguen necesitando aprobación explícita, y
`allow-always` no conserva automáticamente nuevas entradas de lista de permitidos para ellos.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Controla solo la presentación en las solicitudes de aprobación de exec. Cuando está habilitado,
  OpenClaw puede adjuntar intervalos de comando derivados del analizador para que las
  solicitudes de aprobación Web puedan resaltar tokens de comando. Configúralo en `true` para habilitar
  el resaltado de texto de comando.
</ParamField>

Esta configuración **no** cambia `security`, `ask`, la coincidencia de lista de permitidos,
el comportamiento estricto de inline-eval, el reenvío de aprobaciones ni la ejecución de comandos.
Puede configurarse globalmente en `tools.exec.commandHighlighting` o por
agente en `agents.list[].tools.exec.commandHighlighting`.

## Modo YOLO (sin aprobación)

Si quieres que exec en host se ejecute sin solicitudes de aprobación, debes abrir
**ambas** capas de política: la política de exec solicitada en la configuración de OpenClaw
(`tools.exec.*`) **y** la política de aprobaciones local al host en
el archivo de aprobaciones del host de ejecución.

OpenClaw usa `deny` de forma predeterminada para `askFallback` omitido. Define `askFallback` del host
en `full` explícitamente cuando una solicitud de aprobación sin interfaz deba
recaer en permitir.

| Capa                  | Configuración YOLO        |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` en `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Distinciones importantes:**

- `tools.exec.host=auto` elige **dónde** se ejecuta exec: sandbox cuando está disponible; de lo contrario, Gateway.
- YOLO elige **cómo** se aprueba exec en host: `security=full` más `ask=off`.
- En modo YOLO, OpenClaw **no** agrega una compuerta de aprobación heurística separada para ofuscación de comandos ni una capa de rechazo de preflight de scripts encima de la política de exec en host configurada.
- `auto` no convierte el enrutamiento a Gateway en una anulación libre desde una sesión en sandbox. Una solicitud por llamada `host=node` está permitida desde `auto`; `host=gateway` solo está permitida desde `auto` cuando no hay runtime de sandbox activo. Para un valor predeterminado estable no automático, define `tools.exec.host` o usa `/exec host=...` explícitamente.

</Warning>

Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo
pueden seguir esta política. Claude CLI agrega
`--permission-mode bypassPermissions` cuando la política efectiva de exec de OpenClaw
es YOLO. Para sesiones en vivo de Claude gestionadas por OpenClaw, la
política efectiva de exec de OpenClaw prevalece sobre el modo de permisos nativo de Claude:
YOLO normaliza los lanzamientos en vivo a `--permission-mode bypassPermissions`, y
una política efectiva de exec restrictiva normaliza los lanzamientos en vivo a
`--permission-mode default`, aunque los argumentos sin procesar del backend de Claude especifiquen otro
modo.

Si quieres una configuración más conservadora, ajusta de nuevo la política de exec de OpenClaw a
`allowlist` / `on-miss` o `deny`.

### Configuración persistente de "no solicitar nunca" en host Gateway

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
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
  </Step>
</Steps>

### Atajo local

```bash
openclaw exec-policy preset yolo
```

Ese atajo local actualiza ambos:

- `tools.exec.host/security/ask` local.
- Valores predeterminados del archivo local de aprobaciones, incluido `askFallback: "full"`.

Es intencionalmente solo local. Para cambiar remotamente las aprobaciones de host Gateway o host Node,
usa `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Para un host Node, aplica en su lugar el mismo archivo de aprobaciones en ese nodo:

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

<Note>
**Limitaciones solo locales:**

- `openclaw exec-policy` no sincroniza aprobaciones de Node.
- `openclaw exec-policy set --host node` se rechaza.
- Las aprobaciones de exec en Node se obtienen del nodo en tiempo de ejecución, por lo que las actualizaciones dirigidas a Node deben usar `openclaw approvals --node ...`.

</Note>

### Atajo solo de sesión

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un atajo de emergencia que omite las aprobaciones de exec solo cuando
  tanto la política solicitada como el archivo de aprobaciones del host se resuelven en
  `security: "full"` y `ask: "off"`. Un archivo de host más estricto, como
  `ask: "always"`, sigue mostrando una solicitud.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, la política
más estricta del host sigue teniendo prioridad.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, cambia qué agente
estás editando en la app de macOS. Los patrones son coincidencias glob.

Los patrones pueden ser globs de rutas binarias resueltas o globs de nombres de comando simples.
Los nombres simples coinciden solo con comandos invocados mediante `PATH`, por lo que `rg` puede coincidir con
`/opt/homebrew/bin/rg` cuando el comando es `rg`, pero **no** con `./rg` ni
`/tmp/rg`. Usa un glob de ruta cuando quieras confiar en una ubicación binaria
específica.

Las entradas heredadas de `agents.default` se migran a `agents.main` al cargar.
Las cadenas de shell como `echo ok && pwd` siguen necesitando que cada segmento de nivel superior
cumpla las reglas de la lista de permitidos.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restringir argumentos con argPattern

Añade `argPattern` cuando una entrada de la lista de permitidos deba coincidir con un binario y una
forma de argumentos específica. OpenClaw evalúa la expresión regular
contra los argumentos del comando analizados, excluyendo el token del ejecutable
(`argv[0]`). Para entradas escritas a mano, los argumentos se unen con un
solo espacio, así que ancla el patrón cuando necesites una coincidencia exacta.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Esa entrada permite `python3 safe.py`; `python3 other.py` no coincide con la lista de permitidos.
Si también existe una entrada solo de ruta para el mismo binario, los
argumentos no coincidentes aún pueden recurrir a esa entrada solo de ruta. Omite la entrada solo de ruta
cuando el objetivo sea restringir el binario a los argumentos declarados.

Las entradas guardadas por los flujos de aprobación pueden usar un formato de separador interno para
coincidencia exacta de argv. Prefiere la UI o el flujo de aprobación para regenerar esas
entradas en lugar de editar a mano el valor codificado. Si OpenClaw no puede
analizar argv para un segmento de comando, las entradas con `argPattern` no coinciden.

Cada entrada de la lista de permitidos admite:

| Campo              | Significado                                                   |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob de ruta binaria resuelta o glob de nombre de comando simple |
| `argPattern`       | Regex argv opcional; las entradas omitidas son solo de ruta     |
| `id`               | UUID estable usado para la identidad en la UI                  |
| `source`           | Origen de la entrada, como `allow-always`                      |
| `commandText`      | Texto del comando capturado cuando un flujo de aprobación creó la entrada |
| `lastUsedAt`       | Marca de tiempo del último uso                                 |
| `lastUsedCommand`  | Último comando que coincidió                                   |
| `lastResolvedPath` | Última ruta binaria resuelta                                   |

## Permitir automáticamente las CLI de Skills

Cuando **Permitir automáticamente las CLI de Skills** está habilitado, los ejecutables referenciados por
Skills conocidas se tratan como permitidos en nodos (nodo macOS o host de nodo
sin interfaz). Esto usa `skills.bins` sobre el RPC de Gateway para obtener la
lista de binarios de Skills. Desactívalo si quieres listas de permitidos manuales estrictas.

<Warning>
- Esta es una **lista de permitidos implícita de conveniencia**, separada de las entradas manuales de lista de permitidos por ruta.
- Está pensada para entornos de operadores de confianza donde Gateway y el nodo están dentro del mismo límite de confianza.
- Si necesitas confianza explícita estricta, mantén `autoAllowSkills: false` y usa solo entradas manuales de lista de permitidos por ruta.

</Warning>

## Binarios seguros y reenvío de aprobaciones

Para binarios seguros (la ruta rápida solo por stdin), detalles de enlace de intérpretes y
cómo reenviar solicitudes de aprobación a Slack/Discord/Telegram (o ejecutarlas como
clientes de aprobación nativos), consulta
[Aprobaciones de exec - avanzado](/es/tools/exec-approvals-advanced).

## Edición en Control UI

Usa la tarjeta **Control UI → Nodes → Exec approvals** para editar valores predeterminados,
sobrescrituras por agente y listas de permitidos. Elige un alcance (valores predeterminados o un agente),
ajusta la política, añade/elimina patrones de lista de permitidos y luego **Guardar**. La UI
muestra metadatos de último uso por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (aprobaciones locales) o un **Node**.
Los nodos deben anunciar `system.execApprovals.get/set` (app de macOS u
host de nodo sin interfaz). Si un nodo aún no anuncia aprobaciones de exec,
edita directamente su archivo local de aprobaciones.

CLI: `openclaw approvals` admite edición de gateway o nodo; consulta
[CLI de aprobaciones](/es/cli/approvals).

## Flujo de aprobación

Cuando se requiere una solicitud, el gateway transmite
`exec.approval.requested` a los clientes operadores. Control UI y la app de macOS
la resuelven mediante `exec.approval.resolve`; luego el gateway reenvía la
solicitud aprobada al host del nodo.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica `systemRunPlan`.
El gateway usa ese plan como el contexto autorizado de
comando/cwd/sesión al reenviar solicitudes `system.run` aprobadas.

Eso importa para la latencia de aprobaciones asíncronas:

- La ruta de exec del nodo prepara un plan canónico por adelantado.
- El registro de aprobación almacena ese plan y sus metadatos de enlace.
- Una vez aprobado, la llamada final reenviada a `system.run` reutiliza el plan almacenado en lugar de confiar en ediciones posteriores del llamador.
- Si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` después de que se creó la solicitud de aprobación, el gateway rechaza la ejecución reenviada por una discrepancia de aprobación.

## Eventos del sistema

El ciclo de vida de exec se muestra como mensajes del sistema:

- `Exec running` (solo si el comando supera el umbral de aviso de ejecución).
- `Exec finished`.

Estos se publican en la sesión del agente después de que el nodo informa el evento.
Las aprobaciones de exec denegadas son terminales para el propio comando del host: el comando
no se ejecuta. Para aprobaciones asíncronas del agente principal con una sesión de origen,
OpenClaw publica la denegación de vuelta en esa sesión como un seguimiento interno para que el
agente pueda dejar de esperar el comando asíncrono y evitar una reparación por resultado ausente.
Si no hay sesión o la sesión no se puede reanudar, OpenClaw aún puede
informar una denegación concisa al operador o a la ruta de chat directa. Las denegaciones para
sesiones de subagentes no se publican de vuelta en el subagente.
Las aprobaciones de exec con host Gateway emiten los mismos eventos de ciclo de vida cuando el
comando finaliza (y opcionalmente cuando se ejecuta durante más tiempo que el umbral).
Los execs protegidos por aprobación reutilizan el id de aprobación como `runId` en estos
mensajes para facilitar la correlación.

## Comportamiento de aprobación denegada

Cuando se deniega una aprobación de exec asíncrona, OpenClaw trata el comando del host como
terminal y cerrado ante fallos. Para sesiones del agente principal, la denegación se entrega como un
seguimiento interno de sesión que informa al agente que el comando asíncrono no se ejecutó.
Eso conserva la continuidad de la transcripción sin exponer salida de comando obsoleta. Si
la entrega a la sesión no está disponible, OpenClaw recurre a una denegación concisa para el operador o
chat directo cuando existe una ruta segura.

## Implicaciones

- **`full`** es potente; prefiere listas de permitidos cuando sea posible.
- **`ask`** te mantiene en el proceso sin dejar de permitir aprobaciones rápidas.
- Las listas de permitidos por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de exec de host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite las aprobaciones por diseño. Para bloquear estrictamente exec de host, establece la seguridad de aprobaciones en `deny` o deniega la herramienta `exec` mediante la política de herramientas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Aprobaciones de exec - avanzado" href="/es/tools/exec-approvals-advanced" icon="gear">
    Binarios seguros, enlace de intérpretes y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Herramienta exec" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Modo elevado" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta de emergencia que también omite aprobaciones.
  </Card>
  <Card title="Sandboxing" href="/es/gateway/sandboxing" icon="box">
    Modos de sandbox y acceso al espacio de trabajo.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y hardening.
  </Card>
  <Card title="Sandbox vs política de herramientas vs elevado" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo usar cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de permiso automático respaldado por Skills.
  </Card>
</CardGroup>
