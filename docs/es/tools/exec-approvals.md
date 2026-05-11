---
read_when:
    - Configurar aprobaciones de exec o listas de permitidos
    - Implementación de la experiencia de usuario de aprobación de exec en la aplicación de macOS
    - Revisión de indicaciones de escape del entorno aislado y sus implicaciones
sidebarTitle: Exec approvals
summary: 'Aprobaciones de ejecución en el host: controles de política, listas de permitidos y el flujo de trabajo YOLO/estricto'
title: Aprobaciones de ejecución
x-i18n:
    generated_at: "2026-05-11T20:55:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Las aprobaciones de ejecución son la **barrera de seguridad de la app complementaria / host de Node** para permitir que
un agente en sandbox ejecute comandos en un host real (`gateway` o `node`). Un
enclavamiento de seguridad: los comandos se permiten solo cuando la política + la lista de permitidos +
la aprobación del usuario (opcional) coinciden. Las aprobaciones de ejecución se apilan **por encima de**
la política de herramientas y la puerta de elevación (salvo que elevated esté configurado en `full`, lo que
omite las aprobaciones).

<Note>
La política efectiva es la **más estricta** entre los valores predeterminados de `tools.exec.*` y aprobaciones;
si se omite un campo de aprobaciones, se usa el valor de `tools.exec`.
La ejecución en host también usa el estado local de aprobaciones en esa máquina: un
`ask: "always"` local del host en `~/.openclaw/exec-approvals.json` seguirá
solicitando confirmación aunque los valores predeterminados de sesión o configuración pidan `ask: "on-miss"`.
</Note>

## Inspeccionar la política efectiva

| Comando                                                          | Qué muestra                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fuentes de política del host y el resultado efectivo.             |
| `openclaw exec-policy show`                                      | Vista combinada de la máquina local.                                                   |
| `openclaw exec-policy set` / `preset`                            | Sincroniza la política local solicitada con el archivo local de aprobaciones del host en un solo paso. |

Cuando un ámbito local solicita `host=node`, `exec-policy show` informa
ese ámbito como administrado por Node en tiempo de ejecución, en lugar de fingir que el archivo local
de aprobaciones es la fuente de verdad.

Si la UI de la app complementaria **no está disponible**, cualquier solicitud que
normalmente pediría confirmación se resuelve mediante el **ask fallback** (valor predeterminado: `deny`).

<Tip>
Los clientes nativos de aprobación por chat pueden inicializar prestaciones específicas del canal en el
mensaje de aprobación pendiente. Por ejemplo, Matrix inicializa accesos directos de reacción
(`✅` permitir una vez, `❌` denegar, `♾️` permitir siempre) sin dejar de incluir
comandos `/approve ...` en el mensaje como alternativa.
</Tip>

## Dónde se aplica

Las aprobaciones de ejecución se aplican localmente en el host de ejecución:

- **Host Gateway** → proceso `openclaw` en la máquina Gateway.
- **Host Node** → ejecutor de Node (app complementaria de macOS o host Node sin interfaz).

### Modelo de confianza

- Los llamadores autenticados por Gateway son operadores de confianza para ese Gateway.
- Los nodos emparejados extienden esa capacidad de operador de confianza al host Node.
- Las aprobaciones de ejecución reducen el riesgo de ejecución accidental, pero **no** son un límite de autenticación por usuario ni una política de solo lectura del sistema de archivos.
- Una vez aprobado, un comando puede modificar archivos según los permisos del host o del sistema de archivos del sandbox seleccionado.
- Las ejecuciones aprobadas en host Node vinculan el contexto de ejecución canónico: cwd canónico, argv exacto, enlace de env cuando está presente y ruta de ejecutable fijada cuando corresponde.
- Para scripts de shell e invocaciones directas de archivos de intérprete/runtime, OpenClaw también intenta vincular un operando de archivo local concreto. Si ese archivo vinculado cambia después de la aprobación pero antes de la ejecución, la ejecución se deniega en lugar de ejecutar contenido desviado.
- La vinculación de archivos es intencionadamente de mejor esfuerzo, **no** un modelo semántico completo de cada ruta de carga de intérprete/runtime. Si el modo de aprobación no puede identificar exactamente un archivo local concreto que vincular, se niega a emitir una ejecución respaldada por aprobación en lugar de fingir cobertura completa.

### División en macOS

- El **servicio de host Node** reenvía `system.run` a la **app de macOS** mediante IPC local.
- La **app de macOS** aplica las aprobaciones y ejecuta el comando en contexto de UI.

## Configuración y almacenamiento

Las aprobaciones viven en un archivo JSON local en el host de ejecución:

```text
~/.openclaw/exec-approvals.json
```

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

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloquea todas las solicitudes de ejecución en host.
  - `allowlist` - permite solo comandos en la lista de permitidos.
  - `full` - permite todo (equivalente a elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nunca solicita confirmación.
  - `on-miss` - solicita confirmación solo cuando la lista de permitidos no coincide.
  - `always` - solicita confirmación en cada comando. La confianza duradera `allow-always` **no** suprime las solicitudes cuando el modo ask efectivo es `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolución cuando se requiere una solicitud de confirmación pero no hay ninguna UI accesible.

- `deny` - bloquea.
- `allowlist` - permite solo si la lista de permitidos coincide.
- `full` - permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Cuando es `true`, OpenClaw trata las formas de evaluación de código en línea como solo aprobables
  aunque el binario del intérprete esté en la lista de permitidos. Defensa en profundidad
  para cargadores de intérprete que no se asignan limpiamente a un único operando
  de archivo estable.
</ParamField>

Ejemplos que captura el modo estricto:

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
  Controla solo la presentación en las solicitudes de aprobación de ejecución. Cuando está habilitado,
  OpenClaw puede adjuntar intervalos de comando derivados del analizador para que las solicitudes
  de aprobación Web puedan resaltar tokens de comando. Configúralo en `true` para habilitar
  el resaltado de texto de comandos.
</ParamField>

Esta configuración **no** cambia `security`, `ask`, la coincidencia de la lista de permitidos,
el comportamiento estricto de inline-eval, el reenvío de aprobaciones ni la ejecución de comandos.
Puede configurarse globalmente en `tools.exec.commandHighlighting` o por
agente en `agents.list[].tools.exec.commandHighlighting`.

## Modo YOLO (sin aprobación)

Si quieres que la ejecución en host se ejecute sin solicitudes de aprobación, debes abrir
**ambas** capas de política: la política de ejecución solicitada en la configuración de OpenClaw
(`tools.exec.*`) **y** la política local de aprobaciones del host en
`~/.openclaw/exec-approvals.json`.

YOLO es el comportamiento predeterminado del host salvo que lo restrinjas explícitamente:

| Capa                  | Configuración YOLO        |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` en `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Distinciones importantes:**

- `tools.exec.host=auto` elige **dónde** se ejecuta exec: sandbox cuando está disponible; si no, Gateway.
- YOLO elige **cómo** se aprueba la ejecución en host: `security=full` más `ask=off`.
- En modo YOLO, OpenClaw **no** añade una puerta separada de aprobación heurística de ofuscación de comandos ni una capa de rechazo de preflight de scripts por encima de la política configurada de ejecución en host.
- `auto` no convierte el enrutamiento a Gateway en una anulación libre desde una sesión en sandbox. Una solicitud por llamada `host=node` está permitida desde `auto`; `host=gateway` solo está permitida desde `auto` cuando no hay ningún runtime de sandbox activo. Para un valor predeterminado estable no automático, configura `tools.exec.host` o usa `/exec host=...` explícitamente.

</Warning>

Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo
pueden seguir esta política. Claude CLI añade
`--permission-mode bypassPermissions` cuando la política de ejecución solicitada por OpenClaw
es YOLO. Anula ese comportamiento de backend con argumentos explícitos de Claude
en `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
por ejemplo `--permission-mode default`, `acceptEdits` o
`bypassPermissions`.

Si quieres una configuración más conservadora, vuelve a restringir cualquiera de las capas a
`allowlist` / `on-miss` o `deny`.

### Configuración persistente de "nunca solicitar" en host Gateway

<Steps>
  <Step title="Configura la política solicitada de configuración">
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

Ese atajo local actualiza ambos:

- `tools.exec.host/security/ask` local.
- Valores predeterminados locales de `~/.openclaw/exec-approvals.json`.

Es intencionadamente solo local. Para cambiar aprobaciones de host Gateway o host Node
de forma remota, usa `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Para un host Node, aplica el mismo archivo de aprobaciones en ese Node:

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
- Las aprobaciones de ejecución de Node se obtienen de Node en tiempo de ejecución, por lo que las actualizaciones dirigidas a Node deben usar `openclaw approvals --node ...`.

</Note>

### Atajo solo de sesión

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un atajo de emergencia que también omite las aprobaciones de ejecución para esa sesión.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, la política
más estricta del host sigue ganando.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, cambia qué agente
estás editando en la app de macOS. Los patrones son coincidencias glob.

Los patrones pueden ser globs de ruta de binario resuelta o globs de nombre de comando simple.
Los nombres simples coinciden solo con comandos invocados mediante `PATH`, por lo que `rg` puede coincidir con
`/opt/homebrew/bin/rg` cuando el comando es `rg`, pero **no** con `./rg` ni
`/tmp/rg`. Usa un glob de ruta cuando quieras confiar en una ubicación de binario
específica.

Las entradas heredadas `agents.default` se migran a `agents.main` al cargar.
Las cadenas de shell como `echo ok && pwd` siguen necesitando que cada segmento de nivel superior
satisfaga las reglas de la lista de permitidos.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restringir argumentos con argPattern

Añade `argPattern` cuando una entrada de lista de permitidos deba coincidir con un binario y una
forma específica de argumentos. OpenClaw evalúa la expresión regular
contra los argumentos de comando analizados, excluido el token ejecutable
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
Si también está presente una entrada solo de ruta para el mismo binario, los argumentos sin coincidencia
todavía pueden recurrir a esa entrada solo de ruta. Omite la entrada solo de ruta
cuando el objetivo sea restringir el binario a los argumentos declarados.

Las entradas guardadas por flujos de aprobación pueden usar un formato de separador interno para
la coincidencia exacta de argv. Prefiere la UI o el flujo de aprobación para regenerar esas
entradas en lugar de editar manualmente el valor codificado. Si OpenClaw no puede
analizar argv para un segmento de comando, las entradas con `argPattern` no coinciden.

Cada entrada de la lista de permitidos admite:

| Campo              | Significado                                                  |
| ------------------ | ------------------------------------------------------------ |
| `pattern`          | Glob de ruta binaria resuelta o glob de nombre de comando simple |
| `argPattern`       | Regex argv opcional; las entradas omitidas son solo de ruta   |
| `id`               | UUID estable usado para la identidad de la UI                 |
| `source`           | Origen de la entrada, como `allow-always`                     |
| `commandText`      | Texto del comando capturado cuando un flujo de aprobación creó la entrada |
| `lastUsedAt`       | Marca de tiempo de último uso                                |
| `lastUsedCommand`  | Último comando que coincidió                                 |
| `lastResolvedPath` | Última ruta binaria resuelta                                 |

## Autoaprobar CLI de Skills

Cuando **Autoaprobar CLI de Skills** está habilitado, los ejecutables referenciados por
Skills conocidos se tratan como permitidos en nodos (nodo macOS o host de nodo
sin interfaz). Esto usa `skills.bins` sobre el RPC del Gateway para obtener la
lista de binarios de Skills. Deshabilita esto si quieres listas de permitidos manuales estrictas.

<Warning>
- Esta es una **lista de permitidos implícita de conveniencia**, separada de las entradas manuales de lista de permitidos por ruta.
- Está pensada para entornos de operadores de confianza donde Gateway y nodo están dentro del mismo límite de confianza.
- Si necesitas confianza explícita estricta, mantén `autoAllowSkills: false` y usa solo entradas manuales de lista de permitidos por ruta.

</Warning>

## Binarios seguros y reenvío de aprobaciones

Para binarios seguros (la ruta rápida solo por stdin), los detalles de vinculación de intérpretes y
cómo reenviar solicitudes de aprobación a Slack/Discord/Telegram (o ejecutarlas como
clientes de aprobación nativos), consulta
[Aprobaciones de ejecución: avanzado](/es/tools/exec-approvals-advanced).

## Edición en la UI de control

Usa la tarjeta **UI de control → Nodos → Aprobaciones de ejecución** para editar valores predeterminados,
sobrescrituras por agente y listas de permitidos. Elige un ámbito (Predeterminados o un agente),
ajusta la política, agrega/elimina patrones de lista de permitidos y luego **Guardar**. La UI
muestra metadatos de último uso por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (aprobaciones locales) o un **Nodo**.
Los nodos deben anunciar `system.execApprovals.get/set` (app de macOS o
host de nodo sin interfaz). Si un nodo aún no anuncia aprobaciones de ejecución,
edita directamente su `~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` admite la edición de gateway o nodo; consulta
[CLI de aprobaciones](/es/cli/approvals).

## Flujo de aprobación

Cuando se requiere una solicitud, el gateway transmite
`exec.approval.requested` a los clientes operadores. La UI de control y la app de macOS
la resuelven mediante `exec.approval.resolve`, luego el gateway reenvía la
solicitud aprobada al host del nodo.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica `systemRunPlan`.
El gateway usa ese plan como el contexto autorizado de
comando/cwd/sesión al reenviar solicitudes `system.run` aprobadas.

Esto importa para la latencia de aprobación asíncrona:

- La ruta de ejecución del nodo prepara un plan canónico por adelantado.
- El registro de aprobación almacena ese plan y sus metadatos de vinculación.
- Una vez aprobado, la llamada `system.run` reenviada final reutiliza el plan almacenado en lugar de confiar en ediciones posteriores del llamador.
- Si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` después de que se creó la solicitud de aprobación, el gateway rechaza la ejecución reenviada como una discrepancia de aprobación.

## Eventos del sistema

El ciclo de vida de la ejecución se expone como mensajes del sistema:

- `Exec running` (solo si el comando supera el umbral de aviso de ejecución).
- `Exec finished`.
- `Exec denied`.

Estos se publican en la sesión del agente después de que el nodo informa el evento.
Las aprobaciones de ejecución alojadas en Gateway emiten los mismos eventos de ciclo de vida cuando el
comando finaliza (y, opcionalmente, cuando se ejecuta más tiempo que el umbral).
Las ejecuciones protegidas por aprobación reutilizan el id de aprobación como `runId` en estos
mensajes para facilitar la correlación.

## Comportamiento de aprobaciones denegadas

Cuando se deniega una aprobación de ejecución asíncrona, OpenClaw impide que el agente
reutilice la salida de cualquier ejecución anterior del mismo comando en la sesión.
El motivo de denegación se pasa con una guía explícita de que no hay salida de comando
disponible, lo que impide que el agente afirme que hay salida nueva o
repita el comando denegado con resultados obsoletos de una ejecución correcta anterior.

## Implicaciones

- **`full`** es potente; prefiere listas de permitidos cuando sea posible.
- **`ask`** te mantiene al tanto y aun así permite aprobaciones rápidas.
- Las listas de permitidos por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de ejecución del host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite las aprobaciones por diseño. Para bloquear de forma estricta la ejecución en el host, configura la seguridad de aprobaciones como `deny` o deniega la herramienta `exec` mediante la política de herramientas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Aprobaciones de ejecución: avanzado" href="/es/tools/exec-approvals-advanced" icon="gear">
    Binarios seguros, vinculación de intérpretes y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Herramienta de ejecución" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Modo elevado" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta de emergencia que también omite aprobaciones.
  </Card>
  <Card title="Aislamiento" href="/es/gateway/sandboxing" icon="box">
    Modos de aislamiento y acceso al espacio de trabajo.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y endurecimiento.
  </Card>
  <Card title="Aislamiento vs política de herramientas vs elevado" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo recurrir a cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de autoaprobación respaldado por Skills.
  </Card>
</CardGroup>
