---
read_when:
    - Configurar aprobaciones de ejecución o listas de permitidos
    - Implementación de la experiencia de usuario de aprobación de exec en la aplicación de macOS
    - Revisión de los prompts de escape del entorno aislado y sus implicaciones
sidebarTitle: Exec approvals
summary: 'Aprobaciones de ejecución en el host: controles de política, listas de permitidos y el flujo de trabajo YOLO/estricto'
title: Aprobaciones de ejecución
x-i18n:
    generated_at: "2026-05-06T05:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Las aprobaciones de ejecución son la **protección de la aplicación complementaria / host Node** para permitir que
un agente aislado ejecute comandos en un host real (`gateway` o `node`). Un
bloqueo de seguridad: los comandos solo se permiten cuando la política + la lista de permitidos +
la aprobación del usuario (opcional) coinciden. Las aprobaciones de ejecución se apilan **encima de**
la política de herramientas y el control elevado (a menos que elevado esté configurado en `full`, lo que
omite las aprobaciones).

<Note>
La política efectiva es la **más estricta** entre los valores predeterminados de `tools.exec.*` y las aprobaciones;
si se omite un campo de aprobaciones, se usa el valor de `tools.exec`.
La ejecución en host también usa el estado de aprobaciones local en esa máquina: un
`ask: "always"` local del host en `~/.openclaw/exec-approvals.json` sigue
solicitando confirmación aunque la sesión o los valores predeterminados de configuración soliciten `ask: "on-miss"`.
</Note>

## Inspeccionar la política efectiva

| Comando                                                          | Qué muestra                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fuentes de política del host y resultado efectivo.                |
| `openclaw exec-policy show`                                      | Vista combinada de la máquina local.                                                   |
| `openclaw exec-policy set` / `preset`                            | Sincroniza la política local solicitada con el archivo local de aprobaciones del host en un solo paso. |

Cuando un ámbito local solicita `host=node`, `exec-policy show` informa ese
ámbito como administrado por el nodo en tiempo de ejecución, en lugar de fingir que el archivo local
de aprobaciones es la fuente de verdad.

Si la interfaz de usuario de la aplicación complementaria **no está disponible**, cualquier solicitud que
normalmente pediría confirmación se resuelve mediante el **fallback de ask** (predeterminado: `deny`).

<Tip>
Los clientes nativos de aprobación por chat pueden incluir facilidades específicas del canal en el
mensaje de aprobación pendiente. Por ejemplo, Matrix incluye atajos de reacción
(`✅` permitir una vez, `❌` denegar, `♾️` permitir siempre) mientras mantiene
los comandos `/approve ...` en el mensaje como alternativa.
</Tip>

## Dónde se aplica

Las aprobaciones de ejecución se aplican localmente en el host de ejecución:

- **Host Gateway** → proceso `openclaw` en la máquina Gateway.
- **Host Node** → ejecutor del nodo (aplicación complementaria de macOS o host Node sin interfaz).

### Modelo de confianza

- Los llamadores autenticados por Gateway son operadores de confianza para ese Gateway.
- Los nodos emparejados extienden esa capacidad de operador de confianza al host Node.
- Las aprobaciones de ejecución reducen el riesgo de ejecución accidental, pero **no** son un límite de autenticación por usuario.
- Las ejecuciones aprobadas en host Node vinculan el contexto de ejecución canónico: cwd canónico, argv exacto, enlace de entorno cuando existe y ruta de ejecutable fijada cuando corresponde.
- Para scripts de shell e invocaciones directas de archivos de intérprete/runtime, OpenClaw también intenta vincular un operando de archivo local concreto. Si ese archivo vinculado cambia después de la aprobación pero antes de la ejecución, la ejecución se deniega en lugar de ejecutar contenido modificado.
- El enlace de archivos es intencionalmente de mejor esfuerzo, **no** un modelo semántico completo de cada ruta de carga de intérprete/runtime. Si el modo de aprobación no puede identificar exactamente un archivo local concreto para vincular, rechaza emitir una ejecución respaldada por aprobación en lugar de fingir cobertura completa.

### División de macOS

- El **servicio de host Node** reenvía `system.run` a la **aplicación de macOS** mediante IPC local.
- La **aplicación de macOS** aplica las aprobaciones y ejecuta el comando en contexto de interfaz de usuario.

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
  - `full` - permite todo (equivalente a elevado).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nunca pide confirmación.
  - `on-miss` - pide confirmación solo cuando la lista de permitidos no coincide.
  - `always` - pide confirmación en cada comando. La confianza duradera `allow-always` **no** suprime las confirmaciones cuando el modo ask efectivo es `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolución cuando se requiere una confirmación pero no hay ninguna interfaz de usuario accesible.

- `deny` - bloquear.
- `allowlist` - permitir solo si la lista de permitidos coincide.
- `full` - permitir.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Cuando es `true`, OpenClaw trata las formas de evaluación de código en línea como solo aprobables
  aunque el binario del intérprete esté en la lista de permitidos. Defensa en profundidad
  para cargadores de intérpretes que no se mapean limpiamente a un único operando de archivo
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

En modo estricto, estos comandos todavía necesitan aprobación explícita, y
`allow-always` no conserva automáticamente nuevas entradas en la lista de permitidos para ellos.

## Modo YOLO (sin aprobación)

Si quieres que la ejecución en host se ejecute sin solicitudes de aprobación, debes abrir
**ambas** capas de política: la política de ejecución solicitada en la configuración de OpenClaw
(`tools.exec.*`) **y** la política de aprobaciones local del host en
`~/.openclaw/exec-approvals.json`.

YOLO es el comportamiento predeterminado del host a menos que lo restrinjas explícitamente:

| Capa                  | Configuración YOLO        |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` en `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| `askFallback` del host | `full`                    |

<Warning>
**Distinciones importantes:**

- `tools.exec.host=auto` elige **dónde** se ejecuta exec: sandbox cuando está disponible, de lo contrario gateway.
- YOLO elige **cómo** se aprueba la ejecución en host: `security=full` más `ask=off`.
- En modo YOLO, OpenClaw **no** añade una puerta de aprobación heurística independiente para comandos ofuscados ni una capa de rechazo previo de scripts encima de la política de ejecución en host configurada.
- `auto` no convierte el enrutamiento a gateway en una anulación libre desde una sesión aislada. Una solicitud por llamada `host=node` se permite desde `auto`; `host=gateway` solo se permite desde `auto` cuando no hay ningún runtime de sandbox activo. Para un valor predeterminado estable no automático, configura `tools.exec.host` o usa `/exec host=...` explícitamente.

</Warning>

Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo
pueden seguir esta política. Claude CLI añade
`--permission-mode bypassPermissions` cuando la política de ejecución solicitada por OpenClaw
es YOLO. Anula ese comportamiento del backend con argumentos explícitos de Claude
en `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
por ejemplo `--permission-mode default`, `acceptEdits` o
`bypassPermissions`.

Si quieres una configuración más conservadora, vuelve a restringir cualquiera de las capas a
`allowlist` / `on-miss` o `deny`.

### Configuración persistente de "nunca pedir confirmación" para host Gateway

<Steps>
  <Step title="Configura la política solicitada">
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

Es intencionalmente solo local. Para cambiar aprobaciones de host Gateway o host Node
de forma remota, usa `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Para un host Node, aplica el mismo archivo de aprobaciones en ese nodo:

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

- `openclaw exec-policy` no sincroniza aprobaciones de nodos.
- `openclaw exec-policy set --host node` se rechaza.
- Las aprobaciones de ejecución de Node se obtienen del nodo en tiempo de ejecución, por lo que las actualizaciones dirigidas a nodos deben usar `openclaw approvals --node ...`.

</Note>

### Atajo solo de sesión

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un atajo de emergencia que también omite las aprobaciones de ejecución para esa sesión.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, la política del host
más estricta aún prevalece.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, cambia qué agente
estás editando en la aplicación de macOS. Los patrones son coincidencias glob.

Los patrones pueden ser globs de rutas de binarios resueltas o globs de nombres de comando simples.
Los nombres simples solo coinciden con comandos invocados mediante `PATH`, por lo que `rg` puede coincidir
con `/opt/homebrew/bin/rg` cuando el comando es `rg`, pero **no** con `./rg` ni
`/tmp/rg`. Usa un glob de ruta cuando quieras confiar en una ubicación específica de binario.

Las entradas heredadas `agents.default` se migran a `agents.main` al cargarse.
Las cadenas de shell como `echo ok && pwd` todavía necesitan que cada segmento de nivel superior
satisfaga las reglas de la lista de permitidos.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restringir argumentos con argPattern

Añade `argPattern` cuando una entrada de lista de permitidos deba coincidir con un binario y una
forma específica de argumentos. OpenClaw evalúa la expresión regular
contra los argumentos de comando analizados, excluyendo el token ejecutable
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
Si también existe una entrada solo de ruta para el mismo binario, los argumentos no coincidentes
todavía pueden recurrir a esa entrada solo de ruta. Omite la entrada solo de ruta cuando el objetivo
sea restringir el binario a los argumentos declarados.

Las entradas guardadas por flujos de aprobación pueden usar un formato separador interno para
coincidencia exacta de argv. Prefiere la interfaz de usuario o el flujo de aprobación para regenerar esas
entradas en lugar de editar a mano el valor codificado. Si OpenClaw no puede
analizar argv para un segmento de comando, las entradas con `argPattern` no coinciden.

Cada entrada de lista de permitidos admite:

| Campo              | Significado                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `pattern`          | Glob de ruta binaria resuelta o glob de nombre de comando simple  |
| `argPattern`       | Regex argv opcional; las entradas omitidas son solo de ruta        |
| `id`               | UUID estable usado para la identidad de la UI                     |
| `source`           | Fuente de la entrada, como `allow-always`                         |
| `commandText`      | Texto del comando capturado cuando un flujo de aprobación creó la entrada |
| `lastUsedAt`       | Marca de tiempo del último uso                                    |
| `lastUsedCommand`  | Último comando que coincidió                                      |
| `lastResolvedPath` | Última ruta binaria resuelta                                      |

## CLI de Skills con permiso automático

Cuando **Permitir automáticamente las CLI de Skills** está habilitado, los ejecutables referenciados por
Skills conocidas se tratan como permitidos en los nodos (nodo macOS o host de nodo
sin interfaz). Esto usa `skills.bins` sobre el RPC del Gateway para obtener la
lista de binarios de Skills. Deshabilítalo si quieres listas de permitidos manuales estrictas.

<Warning>
- Esta es una **lista de permitidos implícita por conveniencia**, separada de las entradas manuales de lista de permitidos por ruta.
- Está pensada para entornos de operadores de confianza donde Gateway y el nodo están dentro del mismo límite de confianza.
- Si requieres confianza explícita estricta, mantén `autoAllowSkills: false` y usa solo entradas manuales de lista de permitidos por ruta.

</Warning>

## Binarios seguros y reenvío de aprobaciones

Para binarios seguros (la ruta rápida solo con stdin), detalles de vinculación de intérpretes y
cómo reenviar solicitudes de aprobación a Slack/Discord/Telegram (o ejecutarlas como
clientes de aprobación nativos), consulta
[Aprobaciones de exec - avanzado](/es/tools/exec-approvals-advanced).

## Edición en la UI de control

Usa la tarjeta **UI de control → Nodos → Aprobaciones de exec** para editar valores predeterminados,
sobrescrituras por agente y listas de permitidos. Elige un ámbito (Valores predeterminados o un agente),
ajusta la política, agrega/elimina patrones de la lista de permitidos y luego **Guardar**. La UI
muestra metadatos de último uso por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (aprobaciones locales) o un **Node**.
Los nodos deben anunciar `system.execApprovals.get/set` (app de macOS u
host de nodo sin interfaz). Si un nodo aún no anuncia aprobaciones de exec,
edita directamente su `~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` admite la edición de Gateway o nodo; consulta
[CLI de aprobaciones](/es/cli/approvals).

## Flujo de aprobación

Cuando se requiere una solicitud, el gateway transmite
`exec.approval.requested` a los clientes operadores. La UI de control y la app de macOS
la resuelven mediante `exec.approval.resolve`; luego el gateway reenvía la
solicitud aprobada al host del nodo.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica
`systemRunPlan`. El gateway usa ese plan como el contexto autoritativo de
command/cwd/session al reenviar solicitudes `system.run` aprobadas.

Esto importa para la latencia de aprobación asíncrona:

- La ruta de exec del nodo prepara un plan canónico desde el inicio.
- El registro de aprobación almacena ese plan y sus metadatos de vinculación.
- Una vez aprobado, la llamada final reenviada a `system.run` reutiliza el plan almacenado en lugar de confiar en ediciones posteriores del llamador.
- Si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` después de que se creó la solicitud de aprobación, el gateway rechaza la ejecución reenviada como una discrepancia de aprobación.

## Eventos del sistema

El ciclo de vida de exec se expone como mensajes del sistema:

- `Exec running` (solo si el comando supera el umbral de aviso de ejecución).
- `Exec finished`.
- `Exec denied`.

Estos se publican en la sesión del agente después de que el nodo informa el evento.
Las aprobaciones de exec alojadas en Gateway emiten los mismos eventos de ciclo de vida cuando el
comando finaliza (y opcionalmente cuando se ejecuta durante más tiempo que el umbral).
Los execs protegidos por aprobación reutilizan el id de aprobación como `runId` en estos
mensajes para facilitar la correlación.

## Comportamiento de aprobación denegada

Cuando se deniega una aprobación de exec asíncrona, OpenClaw impide que el agente
reutilice la salida de cualquier ejecución anterior del mismo comando en la sesión.
El motivo de denegación se pasa con orientación explícita de que no hay salida de comando
disponible, lo que evita que el agente afirme que hay una salida nueva o
repita el comando denegado con resultados obsoletos de una ejecución exitosa previa.

## Implicaciones

- **`full`** es potente; prefiere listas de permitidos cuando sea posible.
- **`ask`** te mantiene al tanto y aun así permite aprobaciones rápidas.
- Las listas de permitidos por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de exec del host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una conveniencia a nivel de sesión para operadores autorizados y omite las aprobaciones por diseño. Para bloquear estrictamente exec del host, establece la seguridad de aprobaciones en `deny` o deniega la herramienta `exec` mediante la política de herramientas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Aprobaciones de exec - avanzado" href="/es/tools/exec-approvals-advanced" icon="gear">
    Binarios seguros, vinculación de intérpretes y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Herramienta exec" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Modo elevado" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta de emergencia que también omite las aprobaciones.
  </Card>
  <Card title="Sandboxing" href="/es/gateway/sandboxing" icon="box">
    Modos de sandbox y acceso al workspace.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y endurecimiento.
  </Card>
  <Card title="Sandbox vs política de herramientas vs elevado" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo usar cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de permiso automático respaldado por Skills.
  </Card>
</CardGroup>
