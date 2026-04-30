---
read_when:
    - Configuración de aprobaciones de exec o listas de permitidos
    - Implementación de la UX de aprobación de exec en la aplicación de macOS
    - Revisión de las indicaciones de escape del entorno aislado y sus implicaciones
sidebarTitle: Exec approvals
summary: 'Aprobaciones de ejecución en el host: controles de política, listas de permitidos y el flujo de trabajo YOLO/estricto'
title: Aprobaciones de ejecución
x-i18n:
    generated_at: "2026-04-30T06:04:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec approvals son el **mecanismo de protección de la app complementaria / host de nodo** para permitir que
un agente en sandbox ejecute comandos en un host real (`gateway` o `node`). Un
enclavamiento de seguridad: los comandos solo se permiten cuando la política, la allowlist y
la aprobación del usuario (opcional) coinciden. Exec approvals se apilan **encima de**
la política de herramientas y del gating elevado (a menos que elevado esté definido en `full`, lo que
omite las aprobaciones).

<Note>
La política efectiva es la **más estricta** entre los valores predeterminados de `tools.exec.*` y approvals; si se omite un campo de approvals, se usa el valor de `tools.exec`. Host exec también usa el estado local de approvals en esa máquina: un `ask: "always"` local del host en `~/.openclaw/exec-approvals.json` sigue solicitando confirmación aunque la sesión o los valores predeterminados de configuración soliciten `ask: "on-miss"`.
</Note>

## Inspeccionar la política efectiva

| Comando                                                          | Qué muestra                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, orígenes de política del host y el resultado efectivo.            |
| `openclaw exec-policy show`                                      | Vista combinada de la máquina local.                                                   |
| `openclaw exec-policy set` / `preset`                            | Sincroniza la política local solicitada con el archivo local de approvals del host en un solo paso. |

Cuando un ámbito local solicita `host=node`, `exec-policy show` informa ese
ámbito como administrado por node en tiempo de ejecución, en lugar de fingir que el archivo local de
approvals es la fuente de verdad.

Si la UI de la app complementaria **no está disponible**, cualquier solicitud que
normalmente pediría confirmación se resuelve mediante el **ask fallback** (predeterminado: `deny`).

<Tip>
Los clientes nativos de aprobación por chat pueden sembrar affordances específicas del canal en el
mensaje de aprobación pendiente. Por ejemplo, Matrix siembra accesos directos de reacción
(`✅` permitir una vez, `❌` denegar, `♾️` permitir siempre) mientras mantiene
los comandos `/approve ...` en el mensaje como alternativa.
</Tip>

## Dónde se aplica

Exec approvals se aplican localmente en el host de ejecución:

- **Host Gateway** → proceso `openclaw` en la máquina Gateway.
- **Host Node** → ejecutor de node (app complementaria de macOS o host de node sin interfaz).

### Modelo de confianza

- Los llamadores autenticados por Gateway son operadores de confianza para ese Gateway.
- Los nodes emparejados extienden esa capacidad de operador de confianza al host de node.
- Exec approvals reducen el riesgo de ejecución accidental, pero **no** son un límite de autenticación por usuario.
- Las ejecuciones aprobadas en host de node vinculan el contexto de ejecución canónico: cwd canónico, argv exacto, vínculo de entorno cuando está presente y ruta del ejecutable fijada cuando corresponde.
- Para scripts de shell e invocaciones directas de archivos de intérprete/runtime, OpenClaw también intenta vincular un operando de archivo local concreto. Si ese archivo vinculado cambia después de la aprobación pero antes de la ejecución, la ejecución se deniega en lugar de ejecutar contenido desviado.
- La vinculación de archivos es intencionalmente de mejor esfuerzo, **no** un modelo semántico completo de cada ruta de carga de intérprete/runtime. Si el modo de aprobación no puede identificar exactamente un archivo local concreto para vincular, se niega a emitir una ejecución respaldada por aprobación en lugar de fingir cobertura completa.

### División en macOS

- El **servicio de host de node** reenvía `system.run` a la **app de macOS** mediante IPC local.
- La **app de macOS** aplica approvals y ejecuta el comando en el contexto de la UI.

## Configuración y almacenamiento

Approvals vive en un archivo JSON local en el host de ejecución:

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
  - `deny` — bloquea todas las solicitudes de host exec.
  - `allowlist` — permite solo comandos incluidos en la allowlist.
  - `full` — permite todo (equivalente a elevado).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — nunca pedir confirmación.
  - `on-miss` — pedir confirmación solo cuando la allowlist no coincida.
  - `always` — pedir confirmación en cada comando. La confianza duradera de `allow-always` **no** suprime las solicitudes cuando el modo ask efectivo es `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolución cuando se requiere una solicitud de confirmación pero no hay UI accesible.

- `deny` — bloquear.
- `allowlist` — permitir solo si la allowlist coincide.
- `full` — permitir.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Cuando es `true`, OpenClaw trata las formas de evaluación de código en línea como solo con aprobación
  aunque el binario del intérprete esté en la allowlist. Defensa en profundidad
  para cargadores de intérprete que no se asignan limpiamente a un operando
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
`allow-always` no conserva automáticamente nuevas entradas de allowlist para ellos.

## Modo YOLO (sin aprobación)

Si quieres que host exec se ejecute sin solicitudes de aprobación, debes abrir
**ambas** capas de política: la política de exec solicitada en la configuración de OpenClaw
(`tools.exec.*`) **y** la política de approvals local del host en
`~/.openclaw/exec-approvals.json`.

YOLO es el comportamiento predeterminado del host a menos que lo restrinjas explícitamente:

| Capa                  | Configuración YOLO        |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` en `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Distinciones importantes:**

- `tools.exec.host=auto` elige **dónde** se ejecuta exec: sandbox cuando está disponible; de lo contrario, Gateway.
- YOLO elige **cómo** se aprueba host exec: `security=full` más `ask=off`.
- En modo YOLO, OpenClaw **no** agrega una puerta de aprobación heurística separada para ofuscación de comandos ni una capa de rechazo previo de scripts encima de la política de host exec configurada.
- `auto` no convierte el enrutamiento por Gateway en una anulación libre desde una sesión en sandbox. Una solicitud por llamada `host=node` se permite desde `auto`; `host=gateway` solo se permite desde `auto` cuando no hay runtime de sandbox activo. Para un valor predeterminado estable que no sea auto, define `tools.exec.host` o usa `/exec host=...` explícitamente.

</Warning>

Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo
pueden seguir esta política. Claude CLI agrega
`--permission-mode bypassPermissions` cuando la política de exec solicitada por OpenClaw
es YOLO. Anula ese comportamiento de backend con argumentos explícitos de Claude
en `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
por ejemplo `--permission-mode default`, `acceptEdits` o
`bypassPermissions`.

Si quieres una configuración más conservadora, vuelve a restringir cualquiera de las capas a
`allowlist` / `on-miss` o `deny`.

### Configuración persistente de "nunca pedir confirmación" para host Gateway

<Steps>
  <Step title="Define la política de configuración solicitada">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Haz coincidir el archivo de approvals del host">
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

Es intencionalmente solo local. Para cambiar approvals de host Gateway o host de node
de forma remota, usa `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

### Host de node

Para un host de node, aplica el mismo archivo de approvals en ese node:

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

- `openclaw exec-policy` no sincroniza approvals de node.
- `openclaw exec-policy set --host node` se rechaza.
- Exec approvals de node se obtienen desde el node en tiempo de ejecución, por lo que las actualizaciones dirigidas a node deben usar `openclaw approvals --node ...`.

</Note>

### Atajo solo de sesión

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un atajo de emergencia que también omite exec approvals para esa sesión.

Si el archivo de approvals del host sigue siendo más estricto que la configuración, la política
más estricta del host sigue prevaleciendo.

## Allowlist (por agente)

Las allowlists son **por agente**. Si existen varios agentes, cambia qué agente
estás editando en la app de macOS. Los patrones son coincidencias glob.

Los patrones pueden ser globs de ruta binaria resuelta o globs de nombre de comando sin ruta.
Los nombres sin ruta solo coinciden con comandos invocados mediante `PATH`, de modo que `rg` puede coincidir
con `/opt/homebrew/bin/rg` cuando el comando es `rg`, pero **no** con `./rg` ni
`/tmp/rg`. Usa un glob de ruta cuando quieras confiar en una ubicación específica
de binario.

Las entradas heredadas de `agents.default` se migran a `agents.main` al cargar.
Las cadenas de shell como `echo ok && pwd` siguen necesitando que cada segmento de nivel superior
satisfaga las reglas de allowlist.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de allowlist registra:

| Campo              | Significado                        |
| ------------------ | ---------------------------------- |
| `id`               | UUID estable usado para identidad de UI |
| `lastUsedAt`       | Marca de tiempo del último uso     |
| `lastUsedCommand`  | Último comando que coincidió       |
| `lastResolvedPath` | Última ruta binaria resuelta       |

## Permitir automáticamente CLIs de Skills

Cuando **Permitir automáticamente CLIs de Skills** está habilitado, los ejecutables referenciados por
Skills conocidos se tratan como incluidos en la allowlist en nodes (node de macOS o host de
node sin interfaz). Esto usa `skills.bins` sobre el RPC de Gateway para obtener la
lista de bins de Skills. Desactívalo si quieres allowlists manuales estrictas.

<Warning>
- Esta es una **allowlist de conveniencia implícita**, separada de las entradas manuales de allowlist por ruta.
- Está pensada para entornos de operadores de confianza donde Gateway y node están dentro del mismo límite de confianza.
- Si necesitas confianza explícita estricta, conserva `autoAllowSkills: false` y usa solo entradas manuales de allowlist por ruta.

</Warning>

## Bins seguros y reenvío de aprobaciones

Para bins seguros (la ruta rápida solo por stdin), detalles de vinculación de intérpretes y
cómo reenviar solicitudes de aprobación a Slack/Discord/Telegram (o ejecutarlas como
clientes nativos de aprobación), consulta
[Exec approvals — avanzado](/es/tools/exec-approvals-advanced).

## Edición en la UI de control

Usa la tarjeta **UI de control → Nodes → Exec approvals** para editar valores predeterminados,
anulaciones por agente y allowlists. Elige un ámbito (Valores predeterminados o un agente),
ajusta la política, agrega/elimina patrones de allowlist y luego **Guardar**. La UI
muestra metadatos de último uso por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (aprobaciones locales) o un **Node**.
Los Nodes deben anunciar `system.execApprovals.get/set` (aplicación de macOS o
host de nodo sin interfaz). Si un nodo aún no anuncia aprobaciones exec,
edita directamente su `~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` admite editar gateway o node; consulta
[CLI de aprobaciones](/es/cli/approvals).

## Flujo de aprobación

Cuando se requiere un prompt, el gateway difunde
`exec.approval.requested` a los clientes operadores. La UI de Control y la aplicación de macOS
lo resuelven mediante `exec.approval.resolve`; luego el gateway reenvía la
solicitud aprobada al host del nodo.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil
`systemRunPlan` canónica. El gateway usa ese plan como contexto autoritativo
de comando/cwd/sesión al reenviar solicitudes `system.run`
aprobadas.

Eso importa para la latencia de aprobación asíncrona:

- La ruta de exec del nodo prepara un único plan canónico por adelantado.
- El registro de aprobación almacena ese plan y sus metadatos de vinculación.
- Una vez aprobado, la llamada final reenviada a `system.run` reutiliza el plan almacenado en lugar de confiar en ediciones posteriores del llamador.
- Si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` después de crear la solicitud de aprobación, el gateway rechaza la ejecución reenviada como una discrepancia de aprobación.

## Eventos del sistema

El ciclo de vida de exec se expone como mensajes del sistema:

- `Exec running` (solo si el comando supera el umbral de aviso de ejecución).
- `Exec finished`.
- `Exec denied`.

Estos se publican en la sesión del agente después de que el nodo informa el evento.
Las aprobaciones de exec alojadas en el Gateway emiten los mismos eventos de ciclo de vida cuando el
comando termina (y, opcionalmente, cuando se ejecuta durante más tiempo que el umbral).
Los execs protegidos por aprobación reutilizan el id de aprobación como `runId` en estos
mensajes para facilitar la correlación.

## Comportamiento de aprobación denegada

Cuando se deniega una aprobación exec asíncrona, OpenClaw impide que el agente
reutilice la salida de cualquier ejecución anterior del mismo comando en la sesión.
La razón de denegación se pasa con indicaciones explícitas de que no hay salida de comando
disponible, lo que evita que el agente afirme que hay salida nueva o
repita el comando denegado con resultados obsoletos de una ejecución exitosa
anterior.

## Implicaciones

- **`full`** es potente; prefiere listas de permitidos cuando sea posible.
- **`ask`** te mantiene informado y aun así permite aprobaciones rápidas.
- Las listas de permitidos por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de exec del host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite las aprobaciones por diseño. Para bloquear por completo el exec del host, configura la seguridad de aprobaciones en `deny` o deniega la herramienta `exec` mediante la política de herramientas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/es/tools/exec-approvals-advanced" icon="gear">
    Contenedores seguros, vinculación de intérprete y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Exec tool" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Elevated mode" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta de emergencia que también omite las aprobaciones.
  </Card>
  <Card title="Sandboxing" href="/es/gateway/sandboxing" icon="box">
    Modos de sandbox y acceso al espacio de trabajo.
  </Card>
  <Card title="Security" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y refuerzo.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo recurrir a cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de autorización automática respaldado por Skills.
  </Card>
</CardGroup>
