---
read_when:
    - Configuración de aprobaciones de exec o listas de permitidos
    - Implementación de la UX de aprobación de exec en la aplicación macOS
    - Revisión de prompts de escape de sandbox y sus implicaciones
sidebarTitle: Exec approvals
summary: 'Aprobaciones de exec del host: controles de política, listas de permitidos y el flujo YOLO/strict'
title: Aprobaciones de exec
x-i18n:
    generated_at: "2026-04-26T11:38:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

Las aprobaciones de exec son la **protección de la app complementaria / host Node** para permitir que
un agente en sandbox ejecute comandos en un host real (`gateway` o `node`). Es
un interbloqueo de seguridad: los comandos solo se permiten cuando política + lista de permitidos +
(aprobación opcional) del usuario coinciden. Las aprobaciones de exec se apilan **encima de**
la política de herramientas y del control de elevación (salvo cuando la elevación está en `full`, lo
que omite las aprobaciones).

<Note>
La política efectiva es la **más estricta** entre `tools.exec.*` y los valores
predeterminados de aprobaciones; si se omite un campo de aprobaciones, se
usa el valor de `tools.exec`. El exec del host también usa el estado local de aprobaciones
en esa máquina: un `ask: "always"` local del host en `~/.openclaw/exec-approvals.json` sigue
mostrando prompts incluso si la sesión o los valores predeterminados de configuración solicitan `ask: "on-miss"`.
</Note>

## Inspeccionar la política efectiva

| Comando                                                          | Qué muestra                                                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fuentes de política del host y el resultado efectivo.              |
| `openclaw exec-policy show`                                      | Vista fusionada de la máquina local.                                                    |
| `openclaw exec-policy set` / `preset`                            | Sincroniza la política local solicitada con el archivo local de aprobaciones del host en un solo paso. |

Cuando un alcance local solicita `host=node`, `exec-policy show` informa de ese
alcance como gestionado por el nodo en runtime en lugar de fingir que el archivo local de
aprobaciones es la fuente de verdad.

Si la UI de la app complementaria **no está disponible**, cualquier solicitud que normalmente
mostraría un prompt se resuelve mediante el **fallback de ask** (predeterminado: `deny`).

<Tip>
Los clientes nativos de aprobación en chat pueden inicializar affordances específicas del canal en el
mensaje de aprobación pendiente. Por ejemplo, Matrix inicializa atajos de reacción
(`✅` permitir una vez, `❌` denegar, `♾️` permitir siempre) y aun así deja
los comandos `/approve ...` en el mensaje como fallback.
</Tip>

## Dónde se aplica

Las aprobaciones de exec se aplican localmente en el host de ejecución:

- **Host del Gateway** → proceso `openclaw` en la máquina del gateway.
- **Host Node** → ejecutor del nodo (app complementaria de macOS o host Node sin interfaz).

### Modelo de confianza

- Los llamadores autenticados en el Gateway son operadores de confianza para ese Gateway.
- Los Nodes emparejados extienden esa capacidad de operador de confianza al host Node.
- Las aprobaciones de exec reducen el riesgo de ejecución accidental, pero **no** son un límite de autenticación por usuario.
- Las ejecuciones aprobadas en el host vinculan el contexto canónico de ejecución: `cwd` canónico, `argv` exacto, vinculación de entorno cuando está presente y ruta fijada del ejecutable cuando corresponde.
- Para scripts de shell e invocaciones directas de archivos de intérprete/runtime, OpenClaw también intenta vincular un operando local concreto de archivo. Si ese archivo vinculado cambia después de la aprobación pero antes de la ejecución, la ejecución se deniega en lugar de ejecutar contenido desviado.
- La vinculación de archivos es intencionadamente de mejor esfuerzo, **no** un modelo semántico completo de todas las rutas de carga de intérprete/runtime. Si el modo de aprobación no puede identificar exactamente un archivo local concreto que vincular, se niega a generar una ejecución respaldada por aprobación en lugar de fingir cobertura total.

### División en macOS

- El **servicio host Node** reenvía `system.run` a la **app de macOS** mediante IPC local.
- La **app de macOS** aplica las aprobaciones y ejecuta el comando en contexto de UI.

## Configuración y almacenamiento

Las aprobaciones viven en un archivo JSON local en el host de ejecución:

```text
~/.openclaw/exec-approvals.json
```

Ejemplo de esquema:

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

## Controles de política

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — bloquea todas las solicitudes de exec del host.
  - `allowlist` — permite solo comandos en la lista de permitidos.
  - `full` — permite todo (equivalente a elevación).
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — no muestra prompts nunca.
  - `on-miss` — muestra prompt solo cuando la lista de permitidos no coincide.
  - `always` — muestra prompt en cada comando. La confianza duradera `allow-always` **no** suprime prompts cuando el modo ask efectivo es `always`.
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolución cuando se requiere un prompt pero no hay ninguna UI accesible.

- `deny` — bloquea.
- `allowlist` — permite solo si la lista de permitidos coincide.
- `full` — permite.
  </ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Cuando es `true`, OpenClaw trata los formularios de evaluación inline de código como solo aprobables
  aunque el binario del intérprete en sí esté en la lista de permitidos. Defensa en profundidad
  para cargadores de intérpretes que no se asignan limpiamente a un único operando
  estable de archivo.
</ParamField>

Ejemplos que detecta el modo estricto:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

En modo estricto, estos comandos siguen necesitando aprobación explícita, y
`allow-always` no persiste nuevas entradas de la lista de permitidos para ellos
automáticamente.

## Modo YOLO (sin aprobación)

Si quieres que el exec del host se ejecute sin prompts de aprobación, debes abrir
**ambas** capas de política: la política solicitada de exec en la configuración
de OpenClaw (`tools.exec.*`) **y** la política local de aprobaciones del host en
`~/.openclaw/exec-approvals.json`.

YOLO es el comportamiento predeterminado del host salvo que lo endurezcas explícitamente:

| Capa                  | Configuración YOLO            |
| --------------------- | ----------------------------- |
| `tools.exec.security` | `full` en `gateway`/`node`    |
| `tools.exec.ask`      | `off`                         |
| `askFallback` del host | `full`                       |

<Warning>
**Distinciones importantes:**

- `tools.exec.host=auto` elige **dónde** se ejecuta exec: sandbox cuando está disponible y, en caso contrario, gateway.
- YOLO elige **cómo** se aprueba el exec del host: `security=full` más `ask=off`.
- En modo YOLO, OpenClaw **no** añade una compuerta separada de aprobación heurística de ofuscación de comandos ni una capa de rechazo previo de scripts encima de la política configurada de exec del host.
- `auto` no hace que el enrutamiento al gateway sea una sobrescritura libre desde una sesión en sandbox. Una solicitud por llamada `host=node` está permitida desde `auto`; `host=gateway` solo se permite desde `auto` cuando no hay ningún runtime de sandbox activo. Para un valor predeterminado estable que no sea auto, establece `tools.exec.host` o usa `/exec host=...` explícitamente.
  </Warning>

Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo
pueden seguir esta política. Claude CLI añade
`--permission-mode bypassPermissions` cuando la política solicitada de exec de OpenClaw
es YOLO. Sobrescribe ese comportamiento del backend con argumentos explícitos de Claude
bajo `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`; por
ejemplo `--permission-mode default`, `acceptEdits` o
`bypassPermissions`.

Si quieres una configuración más conservadora, endurece cualquiera de las capas de nuevo a
`allowlist` / `on-miss` o `deny`.

### Configuración persistente de host gateway “nunca preguntar”

<Steps>
  <Step title="Establecer la política solicitada en la configuración">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Hacer coincidir el archivo de aprobaciones del host">
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

- `tools.exec.host/security/ask` locales.
- Los valores predeterminados locales de `~/.openclaw/exec-approvals.json`.

Está diseñado intencionadamente solo para uso local. Para cambiar aprobaciones de host gateway o de host Node
de forma remota, usa `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Para un host Node, aplica en ese nodo el mismo archivo de aprobaciones:

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

- `openclaw exec-policy` no sincroniza aprobaciones del nodo.
- `openclaw exec-policy set --host node` se rechaza.
- Las aprobaciones de exec del nodo se obtienen del nodo en runtime, por lo que las actualizaciones dirigidas al nodo deben usar `openclaw approvals --node ...`.
  </Note>

### Atajo solo de sesión

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un atajo de emergencia que también omite las aprobaciones de exec para esa sesión.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, la política
más estricta del host sigue prevaleciendo.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, cambia qué agente
estás editando en la app de macOS. Los patrones son coincidencias de glob.

Los patrones pueden ser globs de rutas resueltas de binarios o globs simples de nombres de comando.
Los nombres simples solo coinciden con comandos invocados mediante `PATH`, por lo que `rg` puede coincidir con
`/opt/homebrew/bin/rg` cuando el comando es `rg`, pero **no** con `./rg` ni
`/tmp/rg`. Usa un glob de ruta cuando quieras confiar en una ubicación específica del binario.

Las entradas heredadas `agents.default` se migran a `agents.main` al cargar.
Las cadenas de shell como `echo ok && pwd` siguen necesitando que cada segmento de nivel superior satisfaga las reglas de la lista de permitidos.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de la lista de permitidos rastrea:

| Campo              | Significado                         |
| ------------------ | ----------------------------------- |
| `id`               | UUID estable usado para identidad en UI |
| `lastUsedAt`       | Marca de tiempo del último uso      |
| `lastUsedCommand`  | Último comando que coincidió        |
| `lastResolvedPath` | Última ruta resuelta del binario    |

## Auto-permitir CLI de Skills

Cuando **Auto-allow skill CLIs** está habilitado, los ejecutables referenciados por
Skills conocidos se tratan como incluidos en la lista de permitidos en nodos (nodo macOS o
host Node sin interfaz). Esto usa `skills.bins` mediante la RPC del Gateway para obtener la
lista de binarios del Skill. Desactívalo si quieres listas de permitidos manuales estrictas.

<Warning>
- Esta es una **lista implícita de conveniencia**, separada de las entradas manuales de lista de permitidos por ruta.
- Está pensada para entornos de operador de confianza donde Gateway y nodo están dentro del mismo límite de confianza.
- Si necesitas confianza estricta y explícita, mantén `autoAllowSkills: false` y usa solo entradas manuales de lista de permitidos por ruta.
</Warning>

## Binarios seguros y reenvío de aprobaciones

Para binarios seguros (la ruta rápida solo-stdin), detalles de vinculación de intérpretes y
cómo reenviar prompts de aprobación a Slack/Discord/Telegram (o ejecutarlos como clientes nativos de aprobación), consulta
[Aprobaciones de exec — avanzado](/es/tools/exec-approvals-advanced).

## Edición en Control UI

Usa la tarjeta **Control UI → Nodes → Exec approvals** para editar valores predeterminados,
sobrescrituras por agente y listas de permitidos. Elige un alcance (Defaults o un agente),
ajusta la política, añade/elimina patrones de la lista de permitidos y luego pulsa **Save**. La UI
muestra metadatos de último uso por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (aprobaciones locales) o un **Node**.
Los Nodes deben anunciar `system.execApprovals.get/set` (app de macOS u
host Node sin interfaz). Si un Node todavía no anuncia aprobaciones de exec,
edita directamente su `~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` admite edición de gateway o de node; consulta
[Approvals CLI](/es/cli/approvals).

## Flujo de aprobación

Cuando se requiere un prompt, el gateway difunde
`exec.approval.requested` a los clientes operadores. La Control UI y la app de macOS
lo resuelven mediante `exec.approval.resolve`, y luego el gateway reenvía la
solicitud aprobada al host Node.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica
`systemRunPlan`. El gateway usa ese plan como contexto autoritativo de
comando/cwd/sesión al reenviar solicitudes aprobadas de `system.run`.

Esto es importante para la latencia de aprobación asíncrona:

- La ruta de exec del nodo prepara por adelantado un plan canónico.
- El registro de aprobación almacena ese plan y sus metadatos de vinculación.
- Una vez aprobado, la llamada final reenviada de `system.run` reutiliza el plan almacenado en lugar de confiar en ediciones posteriores del llamador.
- Si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` después de crear la solicitud de aprobación, el gateway rechaza la ejecución reenviada como desajuste de aprobación.

## Eventos del sistema

El ciclo de vida de exec se muestra como mensajes del sistema:

- `Exec running` (solo si el comando supera el umbral de aviso de ejecución).
- `Exec finished`.
- `Exec denied`.

Estos se publican en la sesión del agente después de que el nodo informe del evento.
Las aprobaciones de exec del host Gateway emiten los mismos eventos de ciclo de vida cuando
el comando termina (y opcionalmente cuando se ejecuta más tiempo del umbral).
Los exec controlados por aprobación reutilizan el ID de aprobación como `runId` en estos
mensajes para facilitar la correlación.

## Comportamiento de aprobación denegada

Cuando se deniega una aprobación asíncrona de exec, OpenClaw impide que el agente
reutilice la salida de cualquier ejecución anterior del mismo comando en la sesión.
El motivo de denegación se pasa con una guía explícita de que no hay salida de comando disponible, lo que impide que el agente afirme que hay nueva salida o
repita el comando denegado con resultados obsoletos de una ejecución correcta anterior.

## Implicaciones

- **`full`** es potente; prefiere listas de permitidos cuando sea posible.
- **`ask`** te mantiene dentro del circuito y al mismo tiempo permite aprobaciones rápidas.
- Las listas de permitidos por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de exec del host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite aprobaciones por diseño. Para bloquear por completo el exec del host, establece la seguridad de aprobaciones en `deny` o deniega la herramienta `exec` mediante la política de herramientas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec approvals — avanzado" href="/es/tools/exec-approvals-advanced" icon="gear">
    Binarios seguros, vinculación de intérpretes y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Herramienta Exec" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Modo elevado" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta de emergencia que también omite aprobaciones.
  </Card>
  <Card title="Sandboxing" href="/es/gateway/sandboxing" icon="box">
    Modos de sandbox y acceso al espacio de trabajo.
  </Card>
  <Card title="Security" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y refuerzo.
  </Card>
  <Card title="Sandbox vs política de herramientas vs elevated" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo usar cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de auto-permitir respaldado por Skills.
  </Card>
</CardGroup>
