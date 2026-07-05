---
read_when:
    - Configurar aprobaciones de ejecución o listas de permitidos
    - Implementación de la experiencia de usuario de aprobación de exec en la aplicación para macOS
    - Revisión de prompts de escape de sandbox y sus implicaciones
sidebarTitle: Exec approvals
summary: 'Aprobaciones de ejecución del host: controles de política, listas de permitidos y el flujo de trabajo YOLO/estricto'
title: Aprobaciones de ejecución
x-i18n:
    generated_at: "2026-07-05T11:48:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ddbd4dc2229183fe5a9b12c5fe26e89c09f0259d9c929d37e1c3b85311123a2
    source_path: tools/exec-approvals.md
    workflow: 16
---

Las aprobaciones de ejecución son la **barrera de seguridad de la app complementaria / host de nodo** para permitir que un agente en sandbox ejecute comandos en un host real (`gateway` o `node`). Los comandos se ejecutan solo cuando la política + la lista de permitidos + la aprobación opcional del usuario coinciden.
Las aprobaciones se apilan **encima de** la política de herramientas y la compuerta elevada (`full` elevado las omite).

Para obtener una descripción general orientada a modos de `deny`, `allowlist`, `ask`, `auto`, `full`, la asignación de Codex Guardian y los permisos del arnés ACPX, consulta
[Modos de permisos](/es/tools/permission-modes).

<Note>
La política efectiva es la **más estricta** entre `tools.exec.*` y los valores predeterminados de aprobaciones: las aprobaciones solo pueden endurecer la seguridad/pregunta derivada de la configuración, nunca relajarla. Si se omite un campo de aprobaciones, se usa el valor de `tools.exec`. La ejecución en host también usa el estado local de aprobaciones en esa máquina: un `ask: "always"` local del host en el archivo de aprobaciones del host de ejecución sigue solicitando confirmación aunque los valores predeterminados de sesión o configuración pidan `ask: "on-miss"`.
</Note>

## Dónde se aplica

Las aprobaciones de ejecución se aplican localmente en el host de ejecución:

- **Host Gateway** -> proceso `openclaw` en la máquina Gateway.
- **Host Node** -> ejecutor Node (app complementaria de macOS o host de nodo sin interfaz).

### Modelo de confianza

- Los llamadores autenticados por Gateway son operadores de confianza para ese Gateway.
- Los nodos emparejados extienden esa capacidad de operador de confianza al host de nodo.
- Las aprobaciones reducen el riesgo de ejecución accidental, pero **no** son un límite de autenticación por usuario ni una política de solo lectura del sistema de archivos.
- Una vez aprobado, un comando puede modificar archivos según los permisos del host o del sistema de archivos del sandbox seleccionados.
- Las ejecuciones aprobadas en host de nodo vinculan el contexto canónico de ejecución: cwd, argv exacto, enlace de env cuando esté presente y ruta de ejecutable fijada cuando corresponda.
- Para scripts de shell e invocaciones directas de archivos de intérprete/runtime, OpenClaw también intenta vincular un operando de archivo local concreto. Si ese archivo cambia después de la aprobación pero antes de la ejecución, la ejecución se deniega en lugar de ejecutar contenido desviado.
- El enlace de archivos es de mejor esfuerzo, no un modelo completo de todas las rutas de carga de cada intérprete/runtime. Si no se puede identificar exactamente un archivo local concreto, OpenClaw se niega a emitir una ejecución respaldada por aprobación en lugar de simular cobertura total.

### División en macOS

- El **servicio de host de nodo** reenvía `system.run` a la **app de macOS** mediante IPC local.
- La **app de macOS** aplica aprobaciones y ejecuta el comando en contexto de UI.

## Inspeccionar la política efectiva

| Comando                                                          | Qué muestra                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fuentes de política del host y el resultado efectivo.             |
| `openclaw exec-policy show`                                      | Vista combinada de la máquina local.                                                   |
| `openclaw exec-policy set` / `preset`                            | Sincroniza la política local solicitada con el archivo local de aprobaciones del host en un solo paso. |

Referencia completa de CLI (flags, salida JSON, agregar/quitar lista de permitidos): [CLI de aprobaciones](/es/cli/approvals).

Cuando un ámbito local solicita `host=node`, `exec-policy show` informa ese ámbito como administrado por nodo en tiempo de ejecución en lugar de tratar el archivo local de aprobaciones como fuente de verdad.

Si la UI de la app complementaria **no está disponible**, cualquier solicitud que normalmente pediría confirmación se resuelve mediante el **fallback de ask** (predeterminado: `deny`).

<Tip>
Los clientes nativos de aprobación por chat pueden preparar prestaciones específicas del canal en el mensaje de aprobación pendiente. Matrix prepara accesos directos de reacción (`✅` permitir una vez, `♾️` permitir siempre, `❌` denegar) mientras mantiene `/approve ...` en el mensaje como fallback.
</Tip>

## Configuración y almacenamiento

Las aprobaciones residen en un archivo JSON local en el host de ejecución. Cuando se establece `OPENCLAW_STATE_DIR`, el archivo sigue ese directorio de estado; de lo contrario usa el directorio de estado predeterminado de OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

El socket de aprobación predeterminado sigue la misma raíz:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, o
`~/.openclaw/exec-approvals.sock` cuando la variable no está establecida.

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

`tools.exec.mode` es la superficie de política normalizada preferida para la ejecución en host:

| Valor       | Comportamiento                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | Bloquea la ejecución en host.                                                                                                                                            |
| `allowlist` | Ejecuta solo comandos en la lista de permitidos sin preguntar.                                                                                                            |
| `ask`       | Usa la política de lista de permitidos y pregunta cuando no hay coincidencias.                                                                                            |
| `auto`      | Usa la política de lista de permitidos, ejecuta directamente coincidencias deterministas y envía las faltas de aprobación al revisor automático nativo de OpenClaw antes de recurrir a una ruta de aprobación humana. |
| `full`      | Ejecuta en host sin solicitudes de aprobación.                                                                                                                           |

Los `tools.exec.security` / `tools.exec.ask` heredados siguen siendo compatibles y todavía se aplican donde `mode` no esté definido en ese ámbito.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloquea todas las solicitudes de ejecución en host.
  - `allowlist` - permite solo comandos en la lista de permitidos.
  - `full` - permite todo (equivalente a elevado).

El valor predeterminado es `full` para hosts gateway/node; un host `sandbox` usa `deny` de forma predeterminada.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Política de ask configurada para ejecución en host. Controla el comportamiento base de solicitud de aprobación desde `tools.exec.ask` y los valores predeterminados de aprobaciones del host.
  El valor predeterminado es `off`. El parámetro de herramienta `ask` por llamada (consulta
  [Herramienta Exec](/es/tools/exec#parameters)) solo puede endurecer esa línea base, y las llamadas de modelo originadas en canales lo ignoran cuando el ask efectivo del host es `off`.

- `off` - nunca preguntar.
- `on-miss` - preguntar solo cuando la lista de permitidos no coincida.
- `always` - preguntar en cada comando. La confianza duradera `allow-always` **no** suprime las solicitudes cuando el modo ask efectivo es `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolución cuando se requiere una solicitud pero no hay UI alcanzable (o la solicitud agota el tiempo de espera). El valor predeterminado al omitirse es `deny`.

- `deny` - bloquear.
- `allowlist` - permitir solo si la lista de permitidos coincide.
- `full` - permitir.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Cuando es `true`, trata las formas de evaluación de código en línea como solo con aprobación incluso si el binario del intérprete está en la lista de permitidos. Defensa en profundidad para cargadores de intérprete que no se asignan limpiamente a un operando de archivo estable.
</ParamField>

Ejemplos que el modo estricto detecta: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (también formas en línea de `awk`,
`sed`, `make`, `find -exec` y `xargs`).

En modo estricto estos comandos siguen necesitando aprobación explícita, y `allow-always` no conserva automáticamente nuevas entradas de lista de permitidos para ellos.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Solo presentación: cuando está habilitado, OpenClaw puede adjuntar tramos de comando derivados del analizador para que las solicitudes de aprobación Web puedan resaltar tokens de comando. **No** cambia `security`, `ask`, la coincidencia de la lista de permitidos, el comportamiento estricto de inline-eval, el reenvío de aprobaciones ni la ejecución de comandos.
</ParamField>

Configúralo globalmente bajo `tools.exec.commandHighlighting` o por agente bajo `agents.list[].tools.exec.commandHighlighting`.

## Modo YOLO (sin aprobación)

Para ejecutar en host sin solicitudes de aprobación, abre **ambas** capas de política: la política de ejecución solicitada en la configuración de OpenClaw (`tools.exec.*`) **y** la política de aprobaciones local del host en el archivo de aprobaciones del host de ejecución.

`askFallback` omitido usa `deny` de forma predeterminada. Establece `askFallback` del host en `full` explícitamente cuando una solicitud de aprobación sin UI deba caer en permitir.

| Capa                  | Configuración YOLO        |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` en `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Distinciones importantes:**

- `tools.exec.host=auto` elige **dónde** se ejecuta exec: sandbox cuando esté disponible; si no, gateway.
- YOLO elige **cómo** se aprueba la ejecución en host: `security=full` más `ask=off`.
- YOLO **no** agrega una compuerta de aprobación heurística separada de ofuscación de comandos ni una capa de rechazo de preflight de scripts encima de la política configurada de ejecución en host.
- `auto` no convierte el enrutamiento a gateway en una anulación libre desde una sesión en sandbox. Una solicitud por llamada `host=node` se permite desde `auto`; `host=gateway` solo se permite desde `auto` cuando no hay ningún runtime de sandbox activo. Para un valor predeterminado estable no automático, establece `tools.exec.host` o usa `/exec host=...` explícitamente.

</Warning>

Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo pueden seguir esta política. Claude CLI agrega `--permission-mode bypassPermissions` cuando la política efectiva de ejecución de OpenClaw es YOLO. Para sesiones live de Claude administradas por OpenClaw, la política efectiva de ejecución de OpenClaw tiene autoridad sobre el modo de permisos nativo de Claude: YOLO normaliza los lanzamientos live a `--permission-mode bypassPermissions`, y una política efectiva restrictiva de ejecución normaliza los lanzamientos live a `--permission-mode default`, incluso si los argumentos crudos del backend de Claude especifican otro modo.

Si quieres una configuración más conservadora, endurece de nuevo la política de ejecución de OpenClaw a `allowlist` / `on-miss` o `deny`.

### Configuración persistente de "nunca preguntar" para host gateway

<Steps>
  <Step title="Establece la política de configuración solicitada">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Haz coincidir el archivo de aprobaciones del host">
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

Actualiza tanto los valores predeterminados locales de `tools.exec.host/security/ask` como los del archivo local de aprobaciones (incluido `askFallback: "full"`). Es intencionalmente solo local. Para cambiar las aprobaciones de gateway-host o node-host de forma remota, usa `openclaw approvals set --gateway` o `openclaw approvals set --node
<id|name|ip>`.

Otros preajustes integrados: `cautious` (`host=gateway`, `security=allowlist`, `ask=on-miss`, `askFallback=deny`) y `deny-all` (`host=gateway`, `security=deny`, `ask=off`, `askFallback=deny`). Aplícalos del mismo modo: `openclaw exec-policy preset cautious`.

Para establecer campos individuales en lugar de un preajuste completo, usa `openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` con cualquier subconjunto de esas marcas.

### Host de Node

Aplica el mismo archivo de aprobaciones en el nodo en su lugar:

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

- `openclaw exec-policy` no sincroniza las aprobaciones de nodo.
- `openclaw exec-policy set --host node` se rechaza.
- Las aprobaciones de ejecución de Node se obtienen del nodo en tiempo de ejecución, por lo que las actualizaciones dirigidas a nodos deben usar `openclaw approvals --node ...`.

</Note>

### Atajo solo para la sesión

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un atajo de emergencia que omite las aprobaciones de ejecución solo cuando tanto la política solicitada como el archivo de aprobaciones del host se resuelven como `security: "full"` y `ask: "off"`. Un archivo de host más estricto, como `ask:
"always"`, sigue mostrando una solicitud.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, la política de host más estricta sigue prevaleciendo.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, cambia qué agente estás editando en la app de macOS. Los patrones son coincidencias glob.

Los patrones pueden ser globs de rutas de binario resueltas o globs de nombres de comando sin ruta. Los nombres sin ruta solo coinciden con comandos invocados mediante `PATH`, por lo que `rg` puede coincidir con `/opt/homebrew/bin/rg` cuando el comando es `rg`, pero **no** con `./rg` ni con `/tmp/rg`. Usa un glob de ruta para confiar en una ubicación binaria específica.

Las entradas heredadas de `agents.default` se migran a `agents.main` al cargar. Las cadenas de shell como `echo ok && pwd` siguen necesitando que cada segmento de nivel superior cumpla las reglas de la lista de permitidos.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restringir argumentos con argPattern

Agrega `argPattern` cuando una entrada de la lista de permitidos deba coincidir con un binario y una forma específica de argumentos. OpenClaw evalúa la expresión regular contra los argumentos del comando analizado, excluido el token ejecutable (`argv[0]`). Para entradas escritas a mano, los argumentos se unen con un solo espacio, así que ancla el patrón cuando necesites una coincidencia exacta.

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

Esa entrada permite `python3 safe.py`; `python3 other.py` no coincide con la lista de permitidos. Si también existe una entrada solo de ruta para el mismo binario, los argumentos no coincidentes todavía pueden recaer en esa entrada solo de ruta. Omite la entrada solo de ruta cuando el objetivo sea restringir el binario a los argumentos declarados.

Las entradas guardadas por los flujos de aprobación usan un formato separador interno para la coincidencia exacta de argv. Prefiere la UI o el flujo de aprobación para regenerar esas entradas en lugar de editar a mano el valor codificado. Si OpenClaw no puede analizar argv para un segmento de comando, las entradas con `argPattern` no coinciden.

Cada entrada de la lista de permitidos admite:

| Campo              | Significado                                                   |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob de ruta de binario resuelta o glob de nombre de comando sin ruta |
| `argPattern`       | Regex argv opcional; las entradas omitidas son solo de ruta   |
| `id`               | UUID estable usado para la identidad de la UI                 |
| `source`           | Origen de la entrada, como `allow-always`                     |
| `commandText`      | Texto del comando capturado cuando un flujo de aprobación creó la entrada |
| `lastUsedAt`       | Marca de tiempo del último uso                                |
| `lastUsedCommand`  | Último comando que coincidió                                  |
| `lastResolvedPath` | Última ruta de binario resuelta                               |

## CLI de Skills permitidas automáticamente

Cuando **CLI de Skills permitidas automáticamente** (`autoAllowSkills`) está habilitado, los ejecutables referenciados por Skills conocidas se tratan como permitidos en nodos (nodo de macOS o host de nodo sin interfaz). Esto usa `skills.bins` sobre el RPC de Gateway para obtener la lista de binarios de Skills. Desactívalo si quieres listas de permitidos manuales estrictas.

<Warning>
- Esta es una **lista de permitidos implícita de conveniencia**, separada de las entradas manuales de lista de permitidos por ruta.
- Está pensada para entornos de operador de confianza donde Gateway y el nodo están en el mismo límite de confianza.
- Si necesitas confianza explícita estricta, mantén `autoAllowSkills: false` y usa solo entradas manuales de lista de permitidos por ruta.

</Warning>

## Binarios seguros y reenvío de aprobaciones

Para binarios seguros (la ruta rápida solo por stdin), detalles de vinculación de intérprete y cómo reenviar solicitudes de aprobación a Slack/Discord/Telegram (o ejecutarlas como clientes de aprobación nativos), consulta [Aprobaciones de ejecución: avanzado](/es/tools/exec-approvals-advanced).

## Edición en Control UI

Usa la tarjeta **Control UI -> Nodes -> Exec approvals** para editar valores predeterminados, anulaciones por agente y listas de permitidos. Elige un ámbito (valores predeterminados o un agente), ajusta la política, agrega o quita patrones de la lista de permitidos y luego selecciona **Save**. La UI muestra metadatos de último uso por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (aprobaciones locales) o un **Node**. Los nodos deben anunciar `system.execApprovals.get/set` (app de macOS u host de nodo sin interfaz). Si un nodo aún no anuncia aprobaciones de ejecución, edita directamente su archivo local de aprobaciones.

CLI: `openclaw approvals` admite edición de Gateway o nodo; consulta [CLI de aprobaciones](/es/cli/approvals).

## Flujo de aprobación

Cuando se requiere una solicitud, el Gateway transmite `exec.approval.requested` a los clientes operadores. Control UI y la app de macOS la resuelven mediante `exec.approval.resolve`; luego el Gateway reenvía la solicitud aprobada al host de nodo.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica `systemRunPlan`. El Gateway usa ese plan como el contexto autorizado de comando/cwd/sesión al reenviar solicitudes `system.run` aprobadas:

- La ruta de ejecución del nodo prepara un plan canónico por adelantado.
- El registro de aprobación almacena ese plan y sus metadatos de vinculación.
- Una vez aprobado, la llamada final reenviada de `system.run` reutiliza el plan almacenado en lugar de confiar en ediciones posteriores del llamador.
- Si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` después de que se creó la solicitud de aprobación, el Gateway rechaza la ejecución reenviada por falta de coincidencia de aprobación.

## Eventos del sistema y denegaciones

El ciclo de vida de ejecución publica un mensaje del sistema `Exec finished` en la sesión del agente después de que el nodo informa la finalización. OpenClaw también puede emitir un aviso en progreso una vez concedida una aprobación, después de que transcurra `tools.exec.approvalRunningNoticeMs` (valor predeterminado `10000`; `0` lo desactiva). Las aprobaciones de ejecución denegadas son terminales para el comando del host: el comando no se ejecuta.

- Para aprobaciones asíncronas del agente principal con una sesión de origen, OpenClaw publica la denegación de vuelta en esa sesión como seguimiento interno para que el agente pueda dejar de esperar el comando asíncrono y evitar una reparación por resultado faltante.
- Si no hay sesión o la sesión no puede reanudarse, OpenClaw todavía puede informar una denegación concisa al operador o a la ruta de chat directa.
- Las denegaciones de sesiones de subagente y Cron no se publican de vuelta en esa sesión.

Las aprobaciones de ejecución del host Gateway emiten el mismo evento de ciclo de vida de finalización. Las ejecuciones protegidas por aprobación reutilizan el id de aprobación para correlacionar la solicitud pendiente con su mensaje de finalización/denegación (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Implicaciones

- **`full`** es potente; prefiere listas de permitidos cuando sea posible.
- **`ask`** te mantiene en el circuito mientras permite aprobaciones rápidas.
- Las listas de permitidos por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de ejecución del host provenientes de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad de nivel de sesión para operadores autorizados y omite las aprobaciones por diseño. Para bloquear por completo la ejecución del host, establece la seguridad de aprobaciones en `deny` o deniega la herramienta `exec` mediante la política de herramientas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/es/tools/exec-approvals-advanced" icon="gear">
    Binarios seguros, vinculación de intérprete y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Exec tool" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Elevated mode" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta de emergencia que también omite aprobaciones.
  </Card>
  <Card title="Sandboxing" href="/es/gateway/sandboxing" icon="box">
    Modos de sandbox y acceso al espacio de trabajo.
  </Card>
  <Card title="Security" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y refuerzo.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo usar cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de permiso automático respaldado por Skills.
  </Card>
</CardGroup>
